import argparse
import importlib.util
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Callable


DEFAULT_SORTFORMER_REPO_ID = "nvidia/diar_streaming_sortformer_4spk-v2.1"
DEFAULT_SORTFORMER_MODEL_FILE = "diar_streaming_sortformer_4spk-v2.1.nemo"
DEFAULT_SORTFORMER_MODEL_URL = (
    "https://huggingface.co/"
    f"{DEFAULT_SORTFORMER_REPO_ID}/resolve/main/{DEFAULT_SORTFORMER_MODEL_FILE}"
)


class SortformerMissingError(RuntimeError):
    pass


class SortformerModelMissingError(RuntimeError):
    pass


def emit_json(payload: dict[str, Any]) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def emit_progress(stage: str, progress: float, message: str) -> None:
    emit_json(
        {
            "type": "progress",
            "stage": stage,
            "progress": max(0.0, min(1.0, float(progress))),
            "message": message,
        }
    )


def emit_error(message: str, code: str = "sortformer_failed") -> None:
    emit_json({"type": "error", "code": code, "message": message})


def configure_sortformer_environment(
    model_root: str,
    env: dict[str, str] | None = None,
) -> dict[str, str]:
    target_env = os.environ if env is None else env
    root = Path(model_root).expanduser().resolve()
    cache_root = root / "cache"
    model_cache = root / "models"
    torch_cache = root / "torch"
    tmp_root = root / "tmp"
    for directory in (root, cache_root, model_cache, torch_cache, tmp_root):
        directory.mkdir(parents=True, exist_ok=True)

    target_env["AIC_SORTFORMER_MODEL_ROOT"] = str(root)
    target_env["HF_HOME"] = str(cache_root)
    target_env["HUGGINGFACE_HUB_CACHE"] = str(model_cache)
    target_env["TORCH_HOME"] = str(torch_cache)
    target_env["XDG_CACHE_HOME"] = str(cache_root)
    target_env["TMPDIR"] = str(tmp_root)
    target_env["TEMP"] = str(tmp_root)
    target_env["TMP"] = str(tmp_root)
    target_env.setdefault("PYTHONIOENCODING", "utf-8")
    target_env.setdefault("PYTHONUTF8", "1")
    target_env.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    target_env.setdefault("WANDB_DISABLED", "true")
    return target_env


def normalize_time_ms(value: Any, duration_ms: int = 0) -> int:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0
    if number < 0:
        return 0
    if duration_ms > 0 and number <= max(1.0, duration_ms / 1000.0 + 5.0):
        number *= 1000.0
    return max(0, int(round(number)))


def normalize_speaker_label(value: Any) -> str:
    text = str(value or "").strip()
    if not text:
        return ""
    match = re.match(r"^(?:speaker|spk)[_-]?(\d+)$", text, flags=re.IGNORECASE)
    if match:
        return f"SPEAKER_{int(match.group(1)):02d}"
    match = re.match(r"^SPEAKER[_-]?(\d+)$", text, flags=re.IGNORECASE)
    if match:
        return f"SPEAKER_{int(match.group(1)):02d}"
    return text


def iter_raw_sortformer_segments(raw_segments: Any):
    if isinstance(raw_segments, str):
        yield raw_segments
        return
    if isinstance(raw_segments, dict):
        yield raw_segments
        return
    if isinstance(raw_segments, (list, tuple)):
        for item in raw_segments:
            yield from iter_raw_sortformer_segments(item)


def parse_sortformer_segment_string(value: str) -> dict[str, Any] | None:
    parts = re.split(r"[\s,]+", str(value or "").strip())
    if len(parts) < 3:
        return None
    return {"start": parts[0], "end": parts[1], "speaker": parts[2]}


def normalize_sortformer_segments(raw_segments: Any, duration_ms: int = 0) -> list[dict[str, Any]]:
    segments: list[dict[str, Any]] = []
    max_end = max(0, int(duration_ms or 0)) or sys.maxsize
    for item in iter_raw_sortformer_segments(raw_segments):
        if isinstance(item, str):
            item = parse_sortformer_segment_string(item)
        if not isinstance(item, dict):
            continue
        start_ms = normalize_time_ms(item.get("startMs", item.get("start", 0)), duration_ms)
        end_ms = normalize_time_ms(item.get("endMs", item.get("end", 0)), duration_ms)
        start_ms = min(max(0, start_ms), max_end)
        end_ms = min(max(start_ms, end_ms), max_end)
        if end_ms <= start_ms:
            continue
        speaker = normalize_speaker_label(item.get("speaker", item.get("label", "")))
        if not speaker:
            continue
        segments.append({"startMs": start_ms, "endMs": end_ms, "speaker": speaker})
    return sorted(segments, key=lambda segment: (segment["startMs"], segment["endMs"], segment["speaker"]))


def resolve_sortformer_device(engine: str) -> str:
    if engine != "gpu":
        return "cpu"
    try:
        import torch  # type: ignore
    except Exception as exc:
        raise RuntimeError(f"GPU acceleration requires torch: {exc}") from exc
    if not getattr(torch, "cuda", None) or not torch.cuda.is_available():
        raise RuntimeError("GPU acceleration was selected, but CUDA is not available")
    return "cuda"


def get_sortformer_model_path(model_root: str, filename: str = DEFAULT_SORTFORMER_MODEL_FILE) -> Path:
    return Path(model_root).expanduser().resolve() / "models" / filename


def download_file_with_progress(
    url: str,
    destination: Path,
    progress_callback: Callable[[float, str], None] | None = None,
    request_get: Callable[..., Any] | None = None,
) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_suffix(destination.suffix + ".part")
    if partial.exists():
        partial.unlink()
    if request_get is None:
        from backend.services import outbound_http_transport

        request_get = outbound_http_transport.get_requests_client().get
    with request_get(url, stream=True, timeout=(10, 60)) as response:
        response.raise_for_status()
        total = int(response.headers.get("content-length") or 0)
        downloaded = 0
        with partial.open("wb") as fh:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                fh.write(chunk)
                downloaded += len(chunk)
                if progress_callback:
                    local_progress = downloaded / total if total > 0 else 0
                    progress_callback(min(local_progress, 0.98), "Downloading speaker separation model")
    partial.replace(destination)
    if progress_callback:
        progress_callback(1.0, "Speaker separation model downloaded")
    return destination


def ensure_sortformer_model_file(args: argparse.Namespace) -> Path:
    model_path = get_sortformer_model_path(args.model_root, str(args.model_file or DEFAULT_SORTFORMER_MODEL_FILE))
    if model_path.exists() and model_path.stat().st_size > 0:
        emit_progress("diarization-model-download", 1.0, "Speaker separation model is ready")
        return model_path
    if not args.download_model_if_missing:
        raise SortformerModelMissingError(
            "Sortformer speaker diarization model is not downloaded. "
            "Enable model download before using speaker separation."
        )
    emit_progress("diarization-model-download", 0.02, "Downloading speaker separation model")

    def on_progress(progress: float, message: str) -> None:
        emit_progress("diarization-model-download", progress, message)

    try:
        return download_file_with_progress(str(args.model_url or DEFAULT_SORTFORMER_MODEL_URL), model_path, on_progress)
    except Exception as exc:
        raise RuntimeError(f"Sortformer model download failed: {exc}") from exc


def import_sortformer_model_class():
    try:
        spec = importlib.util.find_spec("nemo.collections.asr")
    except ModuleNotFoundError:
        spec = None
    if spec is None:
        raise SortformerMissingError(
            "NVIDIA NeMo is not installed in the current Python runtime. "
            "Rebuild the Electron Python runtime with nemo_toolkit[asr] before using speaker separation."
        )
    try:
        from nemo.collections.asr.models import SortformerEncLabelModel  # type: ignore
    except Exception as exc:
        raise SortformerMissingError(
            "NVIDIA NeMo Sortformer runtime is unavailable. "
            f"Original error: {exc}"
        ) from exc
    return SortformerEncLabelModel


def apply_low_latency_sortformer_config(model: Any) -> None:
    modules = getattr(model, "sortformer_modules", None)
    if modules is None:
        return
    modules.chunk_len = 80
    modules.chunk_right_context = 24
    modules.fifo_len = 104
    modules.spkcache_update_period = 80
    modules.spkcache_len = 188
    check = getattr(modules, "_check_streaming_parameters", None)
    if callable(check):
        check()


def load_sortformer_model(args: argparse.Namespace):
    emit_progress("diarization-model-prepare", 0.05, "Preparing speaker separation runtime")
    SortformerEncLabelModel = import_sortformer_model_class()
    model_path = ensure_sortformer_model_file(args)
    device = resolve_sortformer_device(str(args.engine or "cpu"))
    emit_progress("diarization-model-prepare", 0.2, "Loading speaker separation model")
    try:
        model = SortformerEncLabelModel.restore_from(
            restore_path=str(model_path),
            map_location=device,
            strict=False,
        )
        model.eval()
        apply_low_latency_sortformer_config(model)
    except Exception as exc:
        raise RuntimeError(f"Sortformer model preparation failed: {exc}") from exc
    emit_progress("diarization-model-prepare", 1.0, "Speaker separation model is ready")
    return model


def check_sortformer_runtime(args: argparse.Namespace) -> int:
    configure_sortformer_environment(args.model_root)
    emit_progress("diarization-model-prepare", 0.1, "Checking speaker separation runtime")
    try:
        import_sortformer_model_class()
        device = resolve_sortformer_device(str(args.engine or "cpu"))
    except Exception as exc:
        emit_json(
            {
                "type": "result",
                "available": False,
                "code": "sortformer_missing",
                "message": str(exc),
            }
        )
        return 0
    emit_progress("diarization-model-prepare", 1.0, "Speaker separation runtime is available")
    emit_json({"type": "result", "available": True, "device": device})
    return 0


def prepare_sortformer_model(args: argparse.Namespace) -> int:
    configure_sortformer_environment(args.model_root)
    try:
        model = load_sortformer_model(args)
    except SortformerMissingError as exc:
        emit_error(str(exc), "sortformer_missing")
        return 2
    except SortformerModelMissingError as exc:
        emit_error(str(exc), "sortformer_model_missing")
        return 2
    except Exception as exc:
        emit_error(str(exc), "model_prepare_failed")
        return 2
    emit_json({"type": "result", "prepared": True, "model": model.__class__.__name__})
    return 0


def diarize_with_sortformer(args: argparse.Namespace) -> int:
    configure_sortformer_environment(args.model_root)
    audio_text = str(args.audio or "").strip()
    if not audio_text:
        emit_error("Audio file is required for speaker separation", "audio_required")
        return 2
    audio_path = Path(audio_text).expanduser().resolve()
    if not audio_path.exists():
        emit_error(f"Audio file not found: {audio_path}", "audio_not_found")
        return 2

    try:
        model = load_sortformer_model(args)
    except SortformerMissingError as exc:
        emit_error(str(exc), "sortformer_missing")
        return 2
    except SortformerModelMissingError as exc:
        emit_error(str(exc), "sortformer_model_missing")
        return 2
    except Exception as exc:
        emit_error(str(exc), "model_prepare_failed")
        return 2

    emit_progress("diarize", 0.05, "Separating speakers")
    try:
        raw_segments = model.diarize(audio=[str(audio_path)], batch_size=1)
    except Exception as exc:
        emit_error(f"Sortformer speaker separation failed: {exc}", "diarize_failed")
        return 2

    segments = normalize_sortformer_segments(raw_segments, max(0, int(args.duration_ms or 0)))
    emit_progress("diarize", 1.0, "Speaker separation complete")
    emit_json({"type": "result", "segments": segments})
    return 0


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI CanvasPro Sortformer speaker diarization helper")
    parser.add_argument("--audio", default="", help="Path to a 16 kHz mono wav audio file")
    parser.add_argument("--model-root", required=True, help="Writable Sortformer model/cache root")
    parser.add_argument("--duration-ms", type=int, default=0, help="Source media duration in milliseconds")
    parser.add_argument("--engine", choices=["cpu", "gpu"], default="cpu", help="Inference device")
    parser.add_argument("--model-url", default=DEFAULT_SORTFORMER_MODEL_URL, help="Sortformer .nemo download URL")
    parser.add_argument("--model-file", default=DEFAULT_SORTFORMER_MODEL_FILE, help="Local Sortformer .nemo filename")
    parser.add_argument("--check-runtime-only", action="store_true", help="Check runtime imports without model loading")
    parser.add_argument("--prepare-only", action="store_true", help="Download and load the model without diarizing")
    parser.add_argument(
        "--download-model-if-missing",
        action="store_true",
        help="Allow downloading missing Sortformer model files",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    if args.check_runtime_only:
        return check_sortformer_runtime(args)
    if args.prepare_only:
        return prepare_sortformer_model(args)
    return diarize_with_sortformer(args)


if __name__ == "__main__":
    raise SystemExit(main())
