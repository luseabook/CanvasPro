import io
import ipaddress
import socket
import unittest
import urllib.parse
from types import SimpleNamespace
from unittest.mock import patch

from backend.services.outbound_http_transport import (
    _is_public_ip_address,
    is_public_http_url,
    unsafe_remote_url_reason,
)
from backend.services.remote_proxy_route_service import RemoteProxyRouteService


class RemoteProxyRouteServiceTest(unittest.TestCase):
    def _make_service(self):
        return RemoteProxyRouteService(
            read_body=lambda handler, **kwargs: b"",
            subscription_gate_service_getter=lambda: None,
            video_vip_workflow_ids=set(),
        )

    @staticmethod
    def _task_handler(api_url, *, api_key="demo"):
        query = urllib.parse.urlencode({"apiUrl": api_url, "apiKey": api_key})
        return SimpleNamespace(
            path=f"/api/v2/proxy/task?{query}",
            headers={},
        )

    def _assert_blocked(self, api_url):
        """断言该 apiUrl 被 400 拒绝，且未发起任何真实网络请求。"""
        handler = self._task_handler(api_url)
        with patch("requests.get") as get_mock, patch(
            "backend.services.remote_proxy_route_service.urllib.request.urlopen"
        ) as urlopen_mock, patch(
            "backend.services.remote_proxy_route_service.urllib.request.Request"
        ) as request_mock:
            result = self._make_service()._handle_task_proxy(handler)
        self.assertEqual(result["kind"], "json_err", api_url)
        self.assertEqual(result["code"], 400, api_url)
        self.assertTrue(result["message"], api_url)
        get_mock.assert_not_called()
        urlopen_mock.assert_not_called()
        request_mock.assert_not_called()
        return result

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

    def test_task_proxy_blocks_file_scheme_without_any_network_call(self):
        # file:// 曾可经 urllib 回落读取本地文件，必须在校验阶段直接拒绝。
        result = self._assert_blocked("file:///C:/Windows/win.ini")
        self.assertIn("http", result["message"].lower())

    def test_task_proxy_blocks_loopback_and_link_local(self):
        self._assert_blocked("http://127.0.0.1:8778/x")
        self._assert_blocked("http://169.254.169.254/latest/meta-data/")

    def test_task_proxy_blocks_userinfo_and_invalid_port(self):
        self._assert_blocked("https://user:pass@example.com/")
        self._assert_blocked("https://example.com:99999/")

    def test_task_proxy_passes_through_public_url(self):
        api_url = "https://93.184.216.34/v1/task"
        handler = self._task_handler(api_url)
        fake_response = SimpleNamespace(status_code=200, content=b'{"ok": true}')
        with patch("requests.get", return_value=fake_response) as get_mock:
            result = self._make_service()._handle_task_proxy(handler)
        self.assertEqual(result["kind"], "binary")
        self.assertEqual(result["status"], 200)
        self.assertEqual(result["body"], b'{"ok": true}')
        get_mock.assert_called_once()
        self.assertEqual(get_mock.call_args.args[0], api_url)

    def test_is_public_http_url_accepts_public_ip_literal(self):
        self.assertTrue(is_public_http_url("https://93.184.216.34/v1/task"))
        self.assertEqual(unsafe_remote_url_reason("https://93.184.216.34/v1/task"), "")

    def test_unsafe_remote_url_reason_flags_local_and_malformed_targets(self):
        for api_url in (
            "file:///C:/Windows/win.ini",
            "ftp://example.com/x",
            "http://127.0.0.1:8778/x",
            "http://169.254.169.254/latest/meta-data/",
            "https://user:pass@example.com/",
            "https://example.com:99999/",
            "http://[::1]/x",
        ):
            self.assertNotEqual(unsafe_remote_url_reason(api_url), "", api_url)
            self.assertFalse(is_public_http_url(api_url), api_url)

    def test_domain_resolving_to_public_ip_is_allowed(self):
        address_info = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 443)),
        ]
        with patch(
            "backend.services.outbound_http_transport.socket.getaddrinfo",
            return_value=address_info,
        ):
            self.assertTrue(is_public_http_url("https://example.com/"))
            self.assertEqual(unsafe_remote_url_reason("https://example.com/"), "")

    def test_domain_resolving_to_private_ip_is_blocked(self):
        address_info = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("10.0.0.5", 443)),
        ]
        with patch(
            "backend.services.outbound_http_transport.socket.getaddrinfo",
            return_value=address_info,
        ):
            self.assertFalse(is_public_http_url("https://internal.example.com/"))
            self.assertIn("非公网", unsafe_remote_url_reason("https://internal.example.com/"))

    def test_cgnat_range_blocked_and_boundaries_allowed(self):
        # 100.64.0.0/10 (RFC6598 CGNAT) 非公网可路由 -> 拦；/10 边界外应放行。
        for blocked in ("100.64.0.1", "100.127.255.255"):
            self.assertFalse(_is_public_ip_address(ipaddress.ip_address(blocked)), blocked)
            self.assertNotEqual(unsafe_remote_url_reason(f"https://{blocked}/x"), "", blocked)
            self.assertFalse(is_public_http_url(f"https://{blocked}/x"), blocked)
        for allowed in ("100.63.255.255", "100.128.0.1"):
            self.assertTrue(_is_public_ip_address(ipaddress.ip_address(allowed)), allowed)
            self.assertEqual(unsafe_remote_url_reason(f"https://{allowed}/x"), "", allowed)
            self.assertTrue(is_public_http_url(f"https://{allowed}/x"), allowed)

    def test_non_public_ip_classification_regression(self):
        for blocked in (
            "10.1.2.3",
            "127.0.0.1",
            "169.254.169.254",
            "0.0.0.0",
            "172.16.0.1",
            "::ffff:127.0.0.1",
            "::ffff:10.0.0.1",
        ):
            self.assertFalse(_is_public_ip_address(ipaddress.ip_address(blocked)), blocked)
        for allowed in ("172.32.0.1", "93.184.216.34"):
            self.assertTrue(_is_public_ip_address(ipaddress.ip_address(allowed)), allowed)


if __name__ == "__main__":
    unittest.main()
