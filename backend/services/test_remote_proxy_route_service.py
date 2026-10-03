import io
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from backend.services.remote_proxy_route_service import RemoteProxyRouteService


class RemoteProxyRouteServiceTest(unittest.TestCase):
    def _make_service(self):
        return RemoteProxyRouteService(
            read_body=lambda handler, **kwargs: b"",
            subscription_gate_service_getter=lambda: None,
            video_vip_workflow_ids=set(),
        )

    def test_upload_proxy_reports_exception_type_when_message_is_empty(self):
        handler = SimpleNamespace(
            path="/api/v2/proxy/upload?apiUrl=https%3A%2F%2Fuguu.se%2Fupload",
            headers={
                "Content-Length": "5",
                "Content-Type": "multipart/form-data; boundary=demo",
            },
            rfile=io.BytesIO(b"hello"),
        )

        with patch(
            "backend.services.remote_proxy_route_service.urllib.request.urlopen",
            side_effect=TimeoutError(),
        ):
            result = self._make_service()._handle_upload_proxy(handler)

        self.assertEqual(result["kind"], "json_err")
        self.assertEqual(result["code"], 500)
        self.assertIn("Upload proxy error: TimeoutError", result["message"])


    def test_upload_proxy_rejects_oversized_request_body(self):
        handler = SimpleNamespace(
            path="/api/v2/proxy/upload?apiUrl=https%3A%2F%2Fuguu.se%2Fupload",
            headers={"Content-Length": "1000000000", "Content-Type": "application/octet-stream"},
            rfile=io.BytesIO(b""),
        )
        service = RemoteProxyRouteService(
            read_body=lambda handler, **kwargs: (_ for _ in ()).throw(ValueError("REQUEST_BODY_TOO_LARGE")),
            subscription_gate_service_getter=lambda: None,
            video_vip_workflow_ids=set(),
        )
        result = service._handle_upload_proxy(handler)
        self.assertEqual(result["kind"], "json_err")
        self.assertEqual(result["code"], 413)


if __name__ == "__main__":
    unittest.main()
