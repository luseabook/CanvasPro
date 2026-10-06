"""对 P0-1「远程 URL 安全校验 + 通用代理接入」的对抗性验证用例。

本文件由 QA 独立编写，不复用实现者用例；目标：尝试绕过 SSRF 校验、
证明被拦时未发起网络请求、证明正常路径未回归。
只读源码，不修改被验对象。
"""

import ipaddress
import json
import socket
import unittest
import urllib.parse
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from backend.services.outbound_http_transport import (
    _is_public_ip_address,
    is_public_http_url,
    unsafe_remote_url_reason,
)
from backend.services.remote_proxy_route_service import RemoteProxyRouteService

PUBLIC_IP_URL = "https://93.184.216.34/v1/task"


class _FakeCtxResponse:
    """urllib.urlopen 返回值的上下文管理器伪对象。"""

    def __init__(self, *, status=200, body=b"{}"):
        self.status = status
        self._body = body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self._body


class _FakeRequestsResponse:
    def __init__(self, *, status_code=200, content=b"{}"):
        self.status_code = status_code
        self.content = content


def _task_handler(api_url, *, api_key="demo"):
    query = urllib.parse.urlencode({"apiUrl": api_url, "apiKey": api_key})
    return SimpleNamespace(path=f"/api/v2/proxy/task?{query}", headers={})


def _upload_handler(api_url, *, api_key="demo", body=b"hello"):
    query = urllib.parse.urlencode({"apiUrl": api_url, "apiKey": api_key})
    return SimpleNamespace(
        path=f"/api/v2/proxy/upload?{query}",
        headers={
            "Content-Type": "application/octet-stream",
            "Content-Length": str(len(body)),
        },
    )


def _make_service(read_body=None):
    return RemoteProxyRouteService(
        read_body=read_body or (lambda handler, **kwargs: b"hello"),
        subscription_gate_service_getter=lambda: None,
        video_vip_workflow_ids=set(),
    )


# ---------------------------------------------------------------------------
# A. 绕过尝试：直接针对 unsafe_remote_url_reason / is_public_http_url
# ---------------------------------------------------------------------------
class BypassAttemptsTest(unittest.TestCase):
    def _assert_unsafe(self, url):
        reason = unsafe_remote_url_reason(url)
        self.assertNotEqual(reason, "", f"应被拒绝但被放行: {url}")
        self.assertFalse(is_public_http_url(url), f"is_public_http_url 应为 False: {url}")
        return reason

    def test_scheme_variants_blocked(self):
        for url in (
            "file:///C:/Windows/win.ini",
            "ftp://example.com/x",
            "gopher://example.com/",
            "//example.com/x",          # 无协议
            "FILE:///C:/Windows/win.ini",  # 大写变体
        ):
            with self.subTest(url=url):
                self._assert_unsafe(url)

    def test_uppercase_http_does_not_bypass_internal_host_block(self):
        # 大写 HTTP 不应绕过对内部主机的拦截。
        self._assert_unsafe("HTTP://127.0.0.1/")

    def test_loopback_and_special_blocked(self):
        for url in (
            "http://127.0.0.1/",
            "http://localhost/",
            "http://[::1]/",
            "http://0.0.0.0/",
            "http://169.254.169.254/latest/meta-data/",
        ):
            with self.subTest(url=url):
                self._assert_unsafe(url)

    def test_private_ranges_blocked_and_172_16_boundary(self):
        for url in (
            "http://10.1.2.3/",
            "http://192.168.1.1/",
            "http://172.16.0.1/",   # 172.16/12 内 -> 拒
        ):
            with self.subTest(url=url):
                self._assert_unsafe(url)
        # 172.32.0.1 在 172.16/12 之外，应放行（公网字面量，无需网络）。
        self.assertEqual(unsafe_remote_url_reason("http://172.32.0.1/"), "")
        self.assertTrue(is_public_http_url("http://172.32.0.1/"))

    def test_integer_hex_octal_ip_forms_blocked_real_env(self):
        # 关键绕过面：整数/十六进制/八进制 IP 写法。本机(Windows)getaddrinfo 直接失败。
        forms = {
            "http://2130706433/": "127.0.0.1 的十进制",
            "http://0x7f000001/": "127.0.0.1 的十六进制",
            "http://0177.0.0.1/": "127.0.0.1 的八进制",
        }
        for url, desc in forms.items():
            with self.subTest(url=url, desc=desc):
                self._assert_unsafe(url)

    def test_integer_hex_octal_blocked_even_if_os_resolves_to_loopback(self):
        # 证明：即便某些平台(glibc)把 2130706433 解析为 127.0.0.1，
        # 也会在「解析结果非公网」分支被拦，而非依赖 getaddrinfo 恰好失败。
        loopback_info = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 80)),
        ]
        with patch(
            "backend.services.outbound_http_transport.socket.getaddrinfo",
            return_value=loopback_info,
        ):
            for url in ("http://2130706433/", "http://0x7f000001/", "http://0177.0.0.1/"):
                with self.subTest(url=url):
                    self._assert_unsafe(url)

    def test_userinfo_blocked(self):
        for url in ("https://user:pass@example.com/", "https://@example.com/"):
            with self.subTest(url=url):
                self._assert_unsafe(url)

    def test_invalid_port_blocked(self):
        for url in ("http://example.com:99999/", "http://example.com:abc/"):
            with self.subTest(url=url):
                self._assert_unsafe(url)

    def test_trailing_dot_and_uppercase_hostname_blocked(self):
        # LOCALHOST. 经系统解析回环 -> 必须被拦。
        self._assert_unsafe("http://LOCALHOST./")

    def test_ipv4_mapped_ipv6_blocked(self):
        for url in ("http://[::ffff:127.0.0.1]/", "http://[::ffff:10.0.0.1]/"):
            with self.subTest(url=url):
                self._assert_unsafe(url)


# ---------------------------------------------------------------------------
# B. 证明「拦下时确实没有发起网络请求」
# ---------------------------------------------------------------------------
class NoNetworkOnBlockTest(unittest.TestCase):
    def _assert_no_network(self, api_url, handler_factory):
        handler = handler_factory(api_url)
        with patch("requests.get") as get_mock, patch(
            "backend.services.remote_proxy_route_service.urllib.request.urlopen"
        ) as urlopen_mock, patch(
            "backend.services.remote_proxy_route_service.urllib.request.Request"
        ) as request_mock:
            result = _make_service()._handle_task_proxy(handler)
        self.assertEqual(result["kind"], "json_err", api_url)
        self.assertEqual(result["code"], 400, api_url)
        self.assertTrue(result["message"], api_url)
        self.assertEqual(get_mock.call_count, 0, f"requests.get 被调用: {api_url}")
        self.assertEqual(urlopen_mock.call_count, 0, f"urlopen 被调用: {api_url}")
        self.assertEqual(request_mock.call_count, 0, f"Request 被构造: {api_url}")

    def test_file_scheme_makes_no_network_call(self):
        self._assert_no_network("file:///C:/Windows/win.ini", _task_handler)

    def test_loopback_makes_no_network_call(self):
        self._assert_no_network("http://127.0.0.1/", _task_handler)

    def test_upload_proxy_blocks_before_network(self):
        handler = _upload_handler("file:///C:/Windows/win.ini")
        with patch(
            "backend.services.remote_proxy_route_service.urllib.request.urlopen"
        ) as urlopen_mock, patch(
            "backend.services.remote_proxy_route_service.urllib.request.Request"
        ) as request_mock:
            result = _make_service()._handle_upload_proxy(handler)
        self.assertEqual(result["kind"], "json_err")
        self.assertEqual(result["code"], 400)
        self.assertEqual(urlopen_mock.call_count, 0)
        self.assertEqual(request_mock.call_count, 0)


# ---------------------------------------------------------------------------
# C. 证明正常路径没被改坏
# ---------------------------------------------------------------------------
class NormalPathTest(unittest.TestCase):
    def test_public_literal_passes_through_requests(self):
        handler = _task_handler(PUBLIC_IP_URL)
        fake = _FakeRequestsResponse(status_code=200, content=b'{"ok": true}')
        with patch("requests.get", return_value=fake) as get_mock:
            result = _make_service()._handle_task_proxy(handler)
        self.assertEqual(result["kind"], "binary")
        self.assertEqual(result["status"], 200)
        self.assertEqual(result["body"], b'{"ok": true}')
        get_mock.assert_called_once()
        self.assertEqual(get_mock.call_args.args[0], PUBLIC_IP_URL)

    def test_requests_import_error_falls_back_to_urllib(self):
        handler = _task_handler(PUBLIC_IP_URL)
        fake_ctx = _FakeCtxResponse(status=200, body=b"urllib-body")
        with patch.object(
            RemoteProxyRouteService, "_requests_module", side_effect=ImportError("no requests")
        ), patch(
            "backend.services.remote_proxy_route_service.urllib.request.urlopen",
            return_value=fake_ctx,
        ) as urlopen_mock:
            result = _make_service()._handle_task_proxy(handler)
        self.assertEqual(result["kind"], "binary")
        self.assertEqual(result["status"], 200)
        self.assertEqual(result["body"], b"urllib-body")
        self.assertEqual(urlopen_mock.call_count, 1)

    def test_runtime_error_no_longer_falls_back_to_urllib(self):
        # 有意的行为变更：requests 抛非 ImportError 时不得回落 urllib。
        handler = _task_handler(PUBLIC_IP_URL)
        fake_requests = SimpleNamespace(get=MagicMock(side_effect=RuntimeError("boom")))
        with patch.object(
            RemoteProxyRouteService, "_requests_module", return_value=fake_requests
        ), patch(
            "backend.services.remote_proxy_route_service.urllib.request.urlopen"
        ) as urlopen_mock:
            result = _make_service()._handle_task_proxy(handler)
        self.assertEqual(result["kind"], "json_err")
        self.assertEqual(result["code"], 500)
        self.assertIn("Task proxy global error", result["message"])
        self.assertEqual(urlopen_mock.call_count, 0)


# ---------------------------------------------------------------------------
# 残余风险记录（不阻断，仅固化观测）
# ---------------------------------------------------------------------------
class ResidualRiskTest(unittest.TestCase):
    def test_cgnat_range_is_now_blocked(self):
        # 100.64.0.0/10 (RFC6598) 曾被视为公网（is_private 不覆盖），
        # 现 _is_public_ip_address 已改为正向 is_global + 显式 CGNAT 兜底 -> 非公网。
        self.assertFalse(_is_public_ip_address(ipaddress.ip_address("100.64.0.1")))
        self.assertFalse(_is_public_ip_address(ipaddress.ip_address("100.127.255.255")))
        # 边界两侧仍应视为公网，确认兜底未误伤。
        self.assertTrue(_is_public_ip_address(ipaddress.ip_address("100.63.255.255")))
        self.assertTrue(_is_public_ip_address(ipaddress.ip_address("100.128.0.1")))
        # API 级回归：CGNAT 目标现在应被 unsafe_remote_url_reason 拒绝。
        self.assertNotEqual(unsafe_remote_url_reason("http://100.64.0.1/"), "")
        self.assertFalse(is_public_http_url("http://100.64.0.1/"))

    def test_ipv4_mapped_ipv6_is_not_public(self):
        self.assertFalse(_is_public_ip_address(ipaddress.ip_address("::ffff:127.0.0.1")))
        self.assertFalse(_is_public_ip_address(ipaddress.ip_address("::ffff:10.0.0.1")))


if __name__ == "__main__":
    unittest.main()
