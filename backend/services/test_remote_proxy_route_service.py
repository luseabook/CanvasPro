import io
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from backend.services.remote_proxy_route_service import RemoteProxyRouteService


class RemoteProxyRouteServiceTest(unittest.TestCase):
    def _make_service(self):
        return RemoteProxyRouteService(
            read_body=lambda handler: b"",
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


if __name__ == "__main__":
    unittest.main()
