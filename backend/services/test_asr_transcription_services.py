"""Offline tests for the R16 transcription/diarization helpers.

Only pure helpers and runtime *probes* run here: funasr / torch / nemo are probed
and expected to be absent, so no model is loaded and no network call is made.
"""
import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.services import funasr_transcription_service as funasr
from backend.services import outbound_http_transport as transport
from backend.services import sortformer_diarization_service as sortformer


class OutboundHttpTransportTests(unittest.TestCase):
    def test_loopback_detection_is_restricted_to_real_loopback_hosts(self):
        self.assertTrue(transport.is_loopback_http_url("http://127.0.0.1:8778/api/v2"))
        self.assertTrue(transport.is_loopback_http_url("http://127.0.0.5/"))
        self.assertTrue(transport.is_loopback_http_url("http://[::1]:8778/"))
        self.assertFalse(transport.is_loopback_http_url("https://example.com/"))
        self.assertFalse(transport.is_loopback_http_url("ftp://127.0.0.1/"))
        self.assertFalse(transport.is_loopback_http_url(""))

    def test_userinfo_and_relative_urls_are_not_treated_as_loopback(self):
        self.assertFalse(transport.is_loopback_http_url("http://user:pass@127.0.0.1/"))
        self.assertFalse(transport.is_loopback_http_url("/api/v2/desktop/status"))
        self.assertFalse(transport.is_loopback_http_url(None))

    def test_urlopen_accepts_request_like_objects_through_full_url(self):
        class RequestLike:
            full_url = "http://127.0.0.1:8778/"

        self.assertTrue(transport.is_loopback_http_url(RequestLike()))

    def test_shared_context_is_never_replaced_by_a_caller_context(self):
        with self.assertRaises(TypeError):
            transport.urlopen("https://example.com/", context=None)

    def test_requests_client_rejects_per_call_verify_overrides(self):
        with self.assertRaises(TypeError):
            transport._REQUESTS_CLIENT._request("GET", "https://example.com/", verify=False)

    def test_tls_status_reports_a_merged_trust_store(self):
        transport._reset_outbound_tls_state_for_tests()
        try:
            context = transport.get_outbound_ssl_context()
            status = transport.get_outbound_tls_status()
        finally:
            transport._reset_outbound_tls_state_for_tests()
        self.assertIsNotNone(context)
        self.assertEqual(status["policyVersion"], "system-plus-bundled-certifi-v1")
        self.assertTrue(status["systemTrustLoaded"] or status["certifiBundleLoaded"])
        self.assertTrue(status["requestsAvailable"])

    def test_context_build_fails_loudly_when_no_trust_store_loads(self):
        class BrokenContext:
            def __init__(self, *args, **kwargs):
                pass

            def load_default_certs(self, *args, **kwargs):
                raise OSError("no system store")

            def load_verify_locations(self, *args, **kwargs):
                raise OSError("no bundle")

        with patch.object(transport, "certifi", None), patch.object(transport.ssl, "SSLContext", BrokenContext):
            with self.assertRaises(transport.ssl.SSLError):
                transport._build_outbound_ssl_context()


class FunasrHelperTests(unittest.TestCase):
    def test_normalize_time_ms_rejects_bad_input_and_seconds_like_values(self):
        self.assertEqual(funasr.normalize_time_ms(None), 0)
        self.assertEqual(funasr.normalize_time_ms("not-a-number"), 0)
        self.assertEqual(funasr.normalize_time_ms(-5), 0)
        self.assertEqual(funasr.normalize_time_ms(2500, 10000), 2500)
        self.assertEqual(funasr.normalize_time_ms(3.5, 10000), 3500)

    def test_first_text_skips_blank_candidates(self):
        self.assertEqual(funasr.first_text(None, "  ", "", "keep"), "keep")
        self.assertEqual(funasr.first_text(), "")

    def test_sentence_info_becomes_normalized_segments(self):
        raw = {
            "sentence_info": [
                {"text": "你好", "start": 0, "end": 1200, "spk": "0"},
                {"text": "世界", "start": 1200, "end": 2400},
            ]
        }
        self.assertEqual(
            funasr.normalize_funasr_segments(raw),
            [
                {"startMs": 0, "endMs": 1200, "sourceText": "你好", "speaker": "0"},
                {"startMs": 1200, "endMs": 2400, "sourceText": "世界"},
            ],
        )

    def test_zero_length_or_inverted_sentences_are_dropped(self):
        raw = {"sentences": [{"start": 500, "end": 500, "text": "x"}, {"start": 900, "end": 100, "text": "y"}]}
        self.assertEqual(funasr.normalize_funasr_segments(raw), [])

    def test_plain_text_only_becomes_a_full_duration_segment(self):
        self.assertEqual(
            funasr.normalize_funasr_segments({"text": "整段"}, 60000),
            [{"startMs": 0, "endMs": 60000, "sourceText": "整段"}],
        )
        self.assertEqual(funasr.normalize_funasr_segments({"text": "整段"}, 0), [])

    def test_non_dict_results_are_ignored(self):
        self.assertEqual(funasr.normalize_funasr_segments(["nope", 42]), [])

    def test_environment_is_confined_to_the_given_mapping_and_creates_dirs(self):
        with tempfile.TemporaryDirectory() as root:
            env = {}
            result = funasr.configure_funasr_environment(root, env)
            resolved = Path(root).resolve()
            self.assertEqual(result["AIC_FUNASR_MODEL_ROOT"], str(resolved))
            self.assertEqual(result["MODELSCOPE_CACHE"], str(resolved / "models"))
            self.assertEqual(result["HF_HOME"], str(resolved / "cache"))
            self.assertEqual(result["PYTHONIOENCODING"], "utf-8")
            for name in ("cache", "models", "torch", "tmp"):
                self.assertTrue((resolved / name).is_dir())

    def test_offline_mode_is_applied_unless_downloads_are_allowed(self):
        with patch.dict(os.environ, {}, clear=True):
            funasr.apply_offline_mode_if_needed(False)
            self.assertEqual(os.environ["MODELSCOPE_OFFLINE"], "1")
            self.assertEqual(os.environ["TRANSFORMERS_OFFLINE"], "1")
        with patch.dict(os.environ, {}, clear=True):
            funasr.apply_offline_mode_if_needed(True)
            self.assertNotIn("MODELSCOPE_OFFLINE", os.environ)

    def test_runtime_probe_reports_funasr_absent_without_raising(self):
        with tempfile.TemporaryDirectory() as root:
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                code = funasr.main(["--model-root", root, "--check-runtime-only"])
        self.assertEqual(code, 0)
        payloads = [json.loads(line) for line in output.getvalue().strip().splitlines()]
        result = [item for item in payloads if item.get("type") == "result"]
        self.assertEqual(len(result), 1)
        self.assertFalse(result[0]["available"])
        self.assertEqual(result[0]["code"], "funasr_missing")

    def test_audio_required_is_reported_before_any_model_load(self):
        with tempfile.TemporaryDirectory() as root:
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                code = funasr.main(["--model-root", root])
        self.assertEqual(code, 2)
        payload = json.loads(output.getvalue().strip().splitlines()[-1])
        self.assertEqual(payload["type"], "error")
        self.assertEqual(payload["code"], "audio_required")

    def test_gpu_resolution_is_rejected_without_torch(self):
        with self.assertRaises(RuntimeError):
            funasr.resolve_funasr_device("gpu")
        self.assertEqual(funasr.resolve_funasr_device("cpu"), "cpu")

    def test_arg_parser_defaults_match_the_published_model_set(self):
        args = funasr.build_arg_parser().parse_args(["--model-root", "x"])
        self.assertEqual(args.model, "paraformer-zh")
        self.assertEqual(args.vad_model, "fsmn-vad")
        self.assertEqual(args.punc_model, "ct-punc-c")
        self.assertEqual(args.spk_model, "cam++")
        self.assertEqual(args.model_hub, "ms")
        self.assertEqual(args.engine, "cpu")
        self.assertEqual(args.batch_size_s, 300)
        self.assertFalse(args.download_model_if_missing)


class SortformerHelperTests(unittest.TestCase):
    def test_speaker_labels_are_normalized_or_passed_through(self):
        self.assertEqual(sortformer.normalize_speaker_label("speaker_1"), "SPEAKER_01")
        self.assertEqual(sortformer.normalize_speaker_label("spk-2"), "SPEAKER_02")
        self.assertEqual(sortformer.normalize_speaker_label("SPEAKER3"), "SPEAKER_03")
        self.assertEqual(sortformer.normalize_speaker_label("  guest  "), "guest")
        self.assertEqual(sortformer.normalize_speaker_label(""), "")
        self.assertEqual(sortformer.normalize_speaker_label(None), "")

    def test_segment_strings_need_three_fields(self):
        self.assertEqual(
            sortformer.parse_sortformer_segment_string("0.0 1.0 speaker_0"),
            {"start": "0.0", "end": "1.0", "speaker": "speaker_0"},
        )
        self.assertIsNone(sortformer.parse_sortformer_segment_string("0.0 1.0"))
        self.assertIsNone(sortformer.parse_sortformer_segment_string(""))

    def test_nested_inputs_are_flattened(self):
        self.assertEqual(
            list(sortformer.iter_raw_sortformer_segments([[{"start": 0}], "0 1 speaker_0"])),
            [{"start": 0}, "0 1 speaker_0"],
        )

    def test_segments_are_clamped_to_media_duration_and_sorted(self):
        raw = [
            {"startMs": 4000, "endMs": 5000, "speaker": "SPEAKER_01"},
            {"start": 0, "end": 99999, "speaker": "spk0"},
        ]
        self.assertEqual(
            sortformer.normalize_sortformer_segments(raw, 6000),
            [
                {"startMs": 0, "endMs": 6000, "speaker": "SPEAKER_00"},
                {"startMs": 4000, "endMs": 5000, "speaker": "SPEAKER_01"},
            ],
        )

    def test_segments_without_speaker_or_length_are_dropped(self):
        raw = [
            {"start": 0, "end": 100},
            {"start": 500, "end": 500, "speaker": "spk0"},
            {"start": 100, "end": 200, "label": "spk1"},
        ]
        self.assertEqual(
            sortformer.normalize_sortformer_segments(raw),
            [{"startMs": 100, "endMs": 200, "speaker": "SPEAKER_01"}],
        )

    def test_string_segments_are_parsed_like_dict_segments(self):
        self.assertEqual(
            sortformer.normalize_sortformer_segments(["0.0 1.0 speaker_1"]),
            [{"startMs": 0, "endMs": 1, "speaker": "SPEAKER_01"}],
        )

    def test_environment_is_confined_to_the_given_mapping_and_creates_dirs(self):
        with tempfile.TemporaryDirectory() as root:
            result = sortformer.configure_sortformer_environment(root, {})
            resolved = Path(root).resolve()
            self.assertEqual(result["AIC_SORTFORMER_MODEL_ROOT"], str(resolved))
            self.assertEqual(result["HUGGINGFACE_HUB_CACHE"], str(resolved / "models"))
            self.assertEqual(result["HF_HUB_DISABLE_TELEMETRY"], "1")
            self.assertEqual(result["WANDB_DISABLED"], "true")
            for name in ("cache", "models", "torch", "tmp"):
                self.assertTrue((resolved / name).is_dir())

    def test_model_path_stays_inside_the_models_directory(self):
        expected = Path("C:/models-root").resolve() / "models" / "diar.nemo"
        self.assertEqual(sortformer.get_sortformer_model_path("C:/models-root", "diar.nemo"), expected)
        self.assertTrue(
            str(sortformer.get_sortformer_model_path("C:/models-root")).endswith("diar_streaming_sortformer_4spk-v2.1.nemo")
        )

    def test_low_latency_profile_sets_the_documented_windows(self):
        class Modules:
            def _check_streaming_parameters(self):
                self.checked = True

        class Model:
            sortformer_modules = Modules()

        model = Model()
        sortformer.apply_low_latency_sortformer_config(model)
        self.assertEqual(model.sortformer_modules.chunk_len, 80)
        self.assertEqual(model.sortformer_modules.chunk_right_context, 24)
        self.assertEqual(model.sortformer_modules.fifo_len, 104)
        self.assertEqual(model.sortformer_modules.spkcache_update_period, 80)
        self.assertEqual(model.sortformer_modules.spkcache_len, 188)
        self.assertTrue(model.sortformer_modules.checked)

    def test_low_latency_profile_is_a_no_op_without_modules(self):
        sortformer.apply_low_latency_sortformer_config(object())

    def test_missing_model_file_is_reported_before_any_download(self):
        with tempfile.TemporaryDirectory() as root:
            args = sortformer.build_arg_parser().parse_args(["--model-root", root])
            with self.assertRaises(sortformer.SortformerModelMissingError):
                sortformer.ensure_sortformer_model_file(args)

    def test_download_uses_an_injected_transport_and_writes_atomically(self):
        class Response:
            headers = {"content-length": "6"}

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def raise_for_status(self):
                return None

            def iter_content(self, chunk_size=0):
                yield b"abc"
                yield b"def"

        seen = []

        def request_get(url, **options):
            seen.append((url, options))
            return Response()

        with tempfile.TemporaryDirectory() as root:
            destination = Path(root) / "models" / "diar.nemo"
            progress = []
            result = sortformer.download_file_with_progress(
                "https://example.com/diar.nemo",
                destination,
                lambda value, message: progress.append((value, message)),
                request_get,
            )
            self.assertEqual(result, destination)
            self.assertEqual(destination.read_bytes(), b"abcdef")
            self.assertFalse(destination.with_suffix(".nemo.part").exists())
            self.assertTrue(seen[0][1]["stream"])
            self.assertEqual(progress[-1][0], 1.0)

    def test_runtime_probe_reports_nemo_absent_without_raising(self):
        with tempfile.TemporaryDirectory() as root:
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                code = sortformer.main(["--model-root", root, "--check-runtime-only"])
        self.assertEqual(code, 0)
        payload = json.loads(output.getvalue().strip().splitlines()[-1])
        self.assertEqual(payload["type"], "result")
        self.assertFalse(payload["available"])
        self.assertEqual(payload["code"], "sortformer_missing")

    def test_audio_required_is_reported_before_any_model_load(self):
        with tempfile.TemporaryDirectory() as root:
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                code = sortformer.main(["--model-root", root])
        self.assertEqual(code, 2)
        payload = json.loads(output.getvalue().strip().splitlines()[-1])
        self.assertEqual(payload["code"], "audio_required")

    def test_arg_parser_defaults_match_the_published_model_set(self):
        args = sortformer.build_arg_parser().parse_args(["--model-root", "x"])
        self.assertEqual(sortformer.DEFAULT_SORTFORMER_REPO_ID, "nvidia/diar_streaming_sortformer_4spk-v2.1")
        self.assertEqual(args.model_file, sortformer.DEFAULT_SORTFORMER_MODEL_FILE)
        self.assertEqual(args.engine, "cpu")
        self.assertEqual(args.duration_ms, 0)
        self.assertFalse(args.download_model_if_missing)


if __name__ == "__main__":
    unittest.main()
