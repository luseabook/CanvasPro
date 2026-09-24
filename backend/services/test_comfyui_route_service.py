"""Offline contract tests, explicit execution only; no network calls."""
import unittest
from unittest.mock import patch
from backend.services.comfyui_route_service import ComfyUiRouteService, ComfyError, normalize_endpoint, output_files, validate_prompt


class ComfyContracts(unittest.TestCase):
    def test_endpoint_policy(self):
        self.assertEqual(normalize_endpoint('https://EXAMPLE.com:443/comfy/'), 'https://example.com/comfy')
        for url in ('file:///tmp/a', 'http://example.com', 'https://user:pass@example.com', 'https://example.com/?token=secret'):
            with self.assertRaises(ComfyError):
                normalize_endpoint(url)

    def test_no_arbitrary_endpoints(self):
        service = ComfyUiRouteService(read_body=lambda *a, **k: b'{}')
        with patch.dict('os.environ', {'AIC_COMFYUI_ALLOWED_URLS': ''}):
            with self.assertRaises(ComfyError):
                service.connection({'endpoint': 'https://unconfigured.example'})

    def test_output_paths_and_types(self):
        files = output_files({'outputs': {'1': {'images': [
            {'filename': '../secret.png'}, {'filename': 'x.svg'},
            {'filename': 'ok.png', 'subfolder': '../private'},
            {'filename': 'ok.png', 'type': 'output'},
        ]}}})
        self.assertEqual(len(files), 1)
        self.assertEqual(files[0]['mimeType'], 'image/png')

    def test_submit_is_idempotent_within_backend_lifetime(self):
        service = ComfyUiRouteService(read_body=lambda *a, **k: b'{}')
        payload = {'requestId': 'request-1', 'prompt': {'1': {'class_type': 'X', 'inputs': {}}}}
        with patch.object(service, '_request', return_value={'prompt_id': 'prompt-1'}) as upstream:
            first = service.prompt('http://127.0.0.1:8188', '', payload)
            self.assertEqual(service.prompt('http://127.0.0.1:8188', '', payload), first)
            self.assertEqual(upstream.call_count, 1)

    def test_timeout_does_not_automatically_resubmit(self):
        service = ComfyUiRouteService(read_body=lambda *a, **k: b'{}')
        payload = {'requestId': 'request-2', 'prompt': {'1': {'class_type': 'X', 'inputs': {}}}}
        with patch.object(service, '_request', side_effect=ComfyError('timeout', 502)) as upstream:
            self.assertEqual(service.prompt('http://127.0.0.1:8188', '', payload)['state'], 'unknown')
            service.prompt('http://127.0.0.1:8188', '', payload)
            self.assertEqual(upstream.call_count, 1)

    def test_running_task_never_uses_global_interrupt(self):
        service = ComfyUiRouteService(read_body=lambda *a, **k: b'{}')
        def fake(endpoint, token, method, route, **kwargs):
            self.assertNotEqual(route, '/interrupt')
            if route == '/queue':
                return {'queue_running': [[0, 'prompt-1', {}, {}]], 'queue_pending': []}
            return {}
        with patch.object(service, '_request', side_effect=fake):
            result = service.cancel('http://127.0.0.1:8188', '', {'promptId': 'prompt-1'})
            self.assertFalse(result['cancelled'])
            self.assertEqual(result['state'], 'running')

    def test_graph_validation(self):
        with self.assertRaises(ComfyError):
            validate_prompt({'nodes': [], 'links': []})
        with self.assertRaises(ComfyError):
            validate_prompt({'1': {'class_type': 'X', 'inputs': {'bad': ['2', 0]}}})


if __name__ == '__main__':
    unittest.main()
