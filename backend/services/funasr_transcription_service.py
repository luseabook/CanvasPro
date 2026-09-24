from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


DEFAULT_FUNASR_MODEL = "paraformer-zh"
DEFAULT_FUNASR_VAD_MODEL = "fsmn-vad"
DEFAULT_FUNASR_PUNC_MODEL = "ct-punc-c"
DEFAULT_FUNASR_SPK_MODEL = "cam++"


class FunasrMissingError(RuntimeError):
    pass


def emit_json(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def emit_progress(stage: str, progress: float, message: str) -> None:
    emit_json(
        {
            "type": "progress",
            "stage": stage,
            "progress": max(0.0, min(1.0, float(progress))),
            "message": message,
        }
    )


def emit_error(message: str, code: str = "funasr_failed") -> None:
    emit_json({"type": "error", "code": code, "message": message})


def configure_funasr_environment(model_root: str, env: dict[str, str] | None = None) -> dict[str, str]:
    target_env = os.environ if env is None else env
    root = Path(model_root).expanduser().resolve()
    cache_root = root / "cache"
    model_cache = root / "models"
    torch_cache = root / "torch"
    tmp_root = root / "tmp"
    for directory in (root, cache_root, model_cache, torch_cache, tmp_root):
        directory.mkdir(parents=True, exist_ok=True)

    cache_text = str(cache_root)
    model_cache_text = str(model_cache)
    target_env["AIC_FUNASR_MODEL_ROOT"] = str(root)
    target_env["MODELSCOPE_CACHE"] = model_cache_text
    target_env["MODELSCOPE_HOME"] = cache_text
    target_env["HF_HOME"] = cache_text
    target_env["HUGGINGFACE_HUB_CACHE"] = model_cache_text
    target_env["TRANSFORMERS_CACHE"] = model_cache_text
    target_env["TORCH_HOME"] = str(torch_cache)
    target_env["XDG_CACHE_HOME"] = cache_text
    target_env["TMPDIR"] = str(tmp_root)
    target_env["TEMP"] = str(tmp_root)
    target_env["TMP"] = str(tmp_root)
    target_env.setdefault("PYTHONIOENCODING", "utf-8")
    return target_env


def normalize_time_ms(value: Any, duration_ms: int = 0) -> int:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0
    if number < 0:
        return 0
    # FunASR sentence_info normally uses milliseconds. Keep seconds-like values useful for tests.
    if duration_ms > 0 and number <= max(1.0, duration_ms / 1000.0 + 5.0):
        number *= 1000.0
    return max(0, int(round(number)))


def first_text(*values: Any) -> str:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def normalize_funasr_segments(raw_result: Any, duration_ms: int = 0) -> list[dict[str, Any]]:
    results = raw_result if isinstance(raw_result, list) else [raw_result]
    segments: list[dict[str, Any]] = []
    for result in results:
        if not isinstance(result, dict):
            continue
        sentence_info = (
            result.get("sentence_info")
            or result.get("sentences")
            or result.get("segments")
            or []
        )
        if isinstance(sentence_info, list):
            for item in sentence_info:
                if not isinstance(item, dict):
                    continue
                text = first_text(item.get("text"), item.get("sentence"), item.get("value"))
                start_ms = normalize_time_ms(item.get("start"), duration_ms)
                end_ms = normalize_time_ms(item.get("end"), duration_ms)
                if end_ms <= start_ms:
                    continue
                speaker = first_text(item.get("spk"), item.get("speaker"), item.get("speaker_id"))
                segment = {
                    "startMs": start_ms,
                    "endMs": end_ms,
                    "sourceText": text,
                }
                if speaker:
                    segment["speaker"] = speaker
                segments.append(
                    segment
                )
        if not segments:
            text = first_text(result.get("text"), result.get("sentence"), result.get("value"))
            if text and duration_ms > 0:
                segments.append({"startMs": 0, "endMs": duration_ms, "sourceText": text})
    return segments


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI CanvasPro FunASR transcription helper")
    parser.add_argument("--audio", default="")
    parser.add_argument("--model-root", required=True)
    parser.add_argument("--duration-ms", type=int, default=0)
    parser.add_argument("--model", default=DEFAULT_FUNASR_MODEL)
    parser.add_argument("--vad-model", default=DEFAULT_FUNASR_VAD_MODEL)
    parser.add_argument("--punc-model", default=DEFAULT_FUNASR_PUNC_MODEL)
    parser.add_argument("--spk-model", default=DEFAULT_FUNASR_SPK_MODEL)
    parser.add_argument("--model-hub", default="ms")
    parser.add_argument("--engine", choices=("cpu", "gpu"), default="cpu")
    parser.add_argument("--batch-size-s", type=int, default=300)
    parser.add_argument("--download-model-if-missing", action="store_true")
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--check-runtime-only", action="store_true")
    return parser


def apply_offline_mode_if_needed(download_model_if_missing: bool) -> None:
    if not download_model_if_missing:
        os.environ["MODELSCOPE_OFFLINE"] = "1"
        os.environ["TRANSFORMERS_OFFLINE"] = "1"
        os.environ["HF_DATASETS_OFFLINE"] = "1"


def detect_nvidia_gpu_name(run=subprocess.run) -> str:
    try:
        result = run(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=5,
        )
    except Exception:
        return ""
    if getattr(result, "returncode", 1) != 0:
        return ""
    first_line = str(getattr(result, "stdout", "") or "").splitlines()
    return first_line[0].strip() if first_line else ""


def check_torch_gpu_runtime(run=subprocess.run) -> dict[str, Any]:
    gpu_name = detect_nvidia_gpu_name(run)
    try:
        import torch  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on bundled runtime
        return {
            "available": False,
            "code": "torch_missing",
            "message": f"GPU acceleration requires PyTorch: {exc}",
            "gpuName": gpu_name,
        }

    torch_version = str(getattr(torch, "__version__", "") or "")
    torch_cuda = str(getattr(getattr(torch, "version", None), "cuda", "") or "")
    if not torch_cuda:
        return {
            "available": False,
            "code": "torch_cpu_only",
            "message": (
                "NVIDIA GPU was detected, but the current Python runtime has CPU-only PyTorch installed. "
                "Install CUDA-enabled torch."
                if gpu_name
                else "The current Python runtime has CPU-only PyTorch installed. Install CUDA-enabled torch."
            ),
            "gpuName": gpu_name,
            "torchVersion": torch_version,
            "torchCuda": torch_cuda,
        }

    try:
        cuda_available = bool(torch.cuda.is_available())
        device_count = int(torch.cuda.device_count())
    except Exception as exc:
        return {
            "available": False,
            "code": "cuda_unavailable",
            "message": f"CUDA-enabled PyTorch is installed, but CUDA cannot be initialized: {exc}",
            "gpuName": gpu_name,
            "torchVersion": torch_version,
            "torchCuda": torch_cuda,
        }

    if not cuda_available or device_count <= 0:
        return {
            "available": False,
            "code": "cuda_unavailable",
            "message": "CUDA-enabled PyTorch is installed, but CUDA is not available.",
            "gpuName": gpu_name,
            "torchVersion": torch_version,
            "torchCuda": torch_cuda,
        }

    try:
        device_name = str(torch.cuda.get_device_name(0) or "")
    except Exception:
        device_name = gpu_name
    return {
        "available": True,
        "code": "",
        "message": "",
        "device": "cuda:0",
        "gpuName": device_name or gpu_name,
        "torchVersion": torch_version,
        "torchCuda": torch_cuda,
    }


def resolve_funasr_device(engine: str) -> str:
    if engine != "gpu":
        return "cpu"
    status = check_torch_gpu_runtime()
    if not status.get("available"):
        raise RuntimeError(str(status.get("message") or "GPU acceleration is unavailable"))
    return str(status.get("device") or "cuda:0")


def load_funasr_model(args: argparse.Namespace):
    emit_progress("model-download", 0.05, "Preparing FunASR model")
    try:
        from funasr import AutoModel  # type: ignore
    except Exception as exc:  # pragma: no cover - exercised by integration smoke only
        raise FunasrMissingError(
            "FunASR runtime is not bundled in the current Python runtime. "
            "Rebuild the Electron Python runtime with requirements.txt before using subtitle recognition. "
            f"Original error: {exc}"
        ) from exc

    emit_progress("model-download", 0.25, "Loading FunASR model")
    try:
        device = resolve_funasr_device(args.engine)
        model_kwargs: dict[str, Any] = {
            "model": args.model,
            "vad_model": args.vad_model,
            "punc_model": args.punc_model,
            "device": device,
        }
        spk_model = str(getattr(args, "spk_model", "") or "").strip()
        if spk_model:
            model_kwargs["spk_model"] = spk_model
        if args.model_hub:
            model_kwargs["model_hub"] = args.model_hub
        return AutoModel(**model_kwargs)
    except Exception as exc:
        raise RuntimeError(f"FunASR model preparation failed: {exc}") from exc


def check_funasr_runtime(args: argparse.Namespace) -> int:
    configure_funasr_environment(args.model_root)
    emit_progress("model-prepare", 0.1, "Checking FunASR runtime")
    try:
        import funasr  # type: ignore  # noqa: F401
    except Exception as exc:  # pragma: no cover - exercised by integration smoke only
        emit_json(
            {
                "type": "result",
                "available": False,
                "engine": args.engine,
                "code": "funasr_missing",
                "message": (
                    "FunASR runtime is not bundled in the current Python runtime. "
                    f"Original error: {exc}"
                ),
            }
        )
        return 0

    if args.engine == "gpu":
        gpu_status = check_torch_gpu_runtime()
        if not gpu_status.get("available"):
            emit_json(
                {
                    "type": "result",
                    "available": False,
                    "engine": args.engine,
                    **gpu_status,
                }
            )
            return 0
        device = str(gpu_status.get("device") or "cuda:0")
    else:
        device = "cpu"

    emit_progress("model-prepare", 1.0, "FunASR runtime is available")
    emit_json(
        {
            "type": "result",
            "available": True,
            "engine": args.engine,
            "device": device,
        }
    )
    return 0


def prepare_funasr_model(args: argparse.Namespace) -> int:
    configure_funasr_environment(args.model_root)
    apply_offline_mode_if_needed(args.download_model_if_missing)
    try:
        load_funasr_model(args)
    except FunasrMissingError as exc:  # pragma: no cover - exercised by integration smoke only
        emit_error(str(exc), "funasr_missing")
        return 2
    except Exception as exc:
        emit_error(str(exc), "model_prepare_failed")
        return 2
    emit_progress("model-prepare", 1.0, "FunASR model is ready")
    emit_json({"type": "result", "prepared": True, "engine": args.engine})
    return 0


def transcribe_with_funasr(args: argparse.Namespace) -> int:
    configure_funasr_environment(args.model_root)
    audio_text = str(args.audio or "").strip()
    if not audio_text:
        emit_error("Audio file is required for transcription", "audio_required")
        return 2
    audio_path = Path(audio_text).expanduser().resolve()
    if not audio_path.exists():
        emit_error(f"Audio file not found: {audio_path}", "audio_not_found")
        return 2

    apply_offline_mode_if_needed(args.download_model_if_missing)

    try:
        model = load_funasr_model(args)
    except FunasrMissingError as exc:  # pragma: no cover - exercised by integration smoke only
        emit_error(str(exc), "funasr_missing")
        return 2
    except Exception as exc:
        emit_error(str(exc), "model_prepare_failed")
        return 2

    emit_progress("transcribe", 0.05, "Recognizing subtitles")
    try:
        result = model.generate(
            input=str(audio_path),
            sentence_timestamp=True,
            batch_size_s=max(1, int(args.batch_size_s or 300)),
        )
    except Exception as exc:
        emit_error(f"FunASR transcription failed: {exc}", "transcribe_failed")
        return 2

    segments = normalize_funasr_segments(result, max(0, int(args.duration_ms or 0)))
    emit_progress("transcribe", 1.0, "Subtitle recognition complete")
    emit_json({"type": "result", "segments": segments})
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_arg_parser()
    args = parser.parse_args(argv)
    if args.check_runtime_only:
        return check_funasr_runtime(args)
    if args.prepare_only:
        return prepare_funasr_model(args)
    return transcribe_with_funasr(args)


if __name__ == "__main__":
    raise SystemExit(main())
