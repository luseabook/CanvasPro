"""server.py 四条代理路由的 URL 校验（SSRF / 本地文件读取防护）回归测试。

覆盖 ``/api/v2/proxy/apimart-upload``、``/api/v2/proxy/image``、
``/api/v2/proxy/completions``、``/api/v2/chat``：在发起任何出站请求之前，
非法 apiUrl（非 http(s) 协议、非公网 IP 字面量）必须被 400 阻断，
且不会触达网络层；合法公网 IP 字面量则不被误伤。

沿用仓库既有的「直接驱动 Handler」风格（参见 test_server_security.py）：
用 ``object.__new__(server.Handler)`` 构造实例并打桩响应相关方法，
``patch.object`` 替换 ``_read_body`` / ``LOCAL_ACCESS_TOKEN``。
"""

import io
import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import server


# 阻断用例：非法 URL 与对应的中文原因片段。
BLOCK_CASES = (
    ("file:///C:/Windows/win.ini", "http/https"),
    ("http://127.0.0.1:8778/x", "非公网地址"),
)

# 放行用例：合法公网 IP 字面量。
PUBLIC_IP_BASE_URL = "https://93.184.216.34/v1"


def _build_multipart_body(
    boundary,
    fields,
    *,
    file_bytes=b"\x89PNG\r\n\x1a\n-binary-",
    filename="x.png",
    content_type="image/png",
):
    """构造一个最小的 multipart/form-data 请求体，用于 apimart-upload 路由。"""
    crlf = b"\r\n"
    chunks = []
    for name, value in fields:
        chunks.append(f"--{boundary}\r\n".encode("utf-8"))
        chunks.append(
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8")
        )
        chunks.append(str(value).encode("utf-8"))
        chunks.append(crlf)
    chunks.append(f"--{boundary}\r\n".encode("utf-8"))
    chunks.append(
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode(
            "utf-8"
        )
    )
    chunks.append(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    chunks.append(file_bytes)
    chunks.append(crlf)
    chunks.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(chunks)


class _FakeRequestsResponse:
    """requests.post/get 的假响应，满足路由对 headers/text/status_code 的读取。"""

    def __init__(self, text, status_code=200, content_type="application/json"):
        self.text = text
        self.status_code = status_code
        self.headers = {"Content-Type": content_type}

    def close(self):
        pass


class _FakeUrlopenResponse:
    """urllib.request.urlopen 的假响应（上下文管理器 + read()）。"""

    def __init__(self, data, status=200):
        self.status = status
        self._data = data
        self.headers = {"Content-Type": "application/json"}

    def read(self):
        return self._data

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False


class _HandlerHarness:
    """驱动 server.Handler.do_POST 的最小测试夹具。"""

    def __init__(self, path, body=b"", headers=None):
        handler = object.__new__(server.Handler)
        handler.path = path
        handler.headers = dict(headers or {})
        handler.client_address = ("127.0.0.1", 45678)
        handler.server = SimpleNamespace(server_address=("0.0.0.0", server.PORT))
        handler.rfile = io.BytesIO(b"")
        handler.close_connection = False
        self.status_codes = []
        self.body = b""

        def _send_response(code, message=None):
            self.status_codes.append(int(code))

        def _write(data):
            payload = bytes(data)
            self.body += payload
            return len(payload)

        handler.send_response = _send_response
        handler.send_header = lambda *args, **kwargs: None
        handler.end_headers = lambda: None
        handler.wfile = SimpleNamespace(write=_write, flush=lambda: None)
        self.handler = handler
        self._raw_body = body

    def run(self):
        """在回环客户端 + 无本地令牌的理想条件下驱动 do_POST。"""
        with patch.object(server, "LOCAL_ACCESS_TOKEN", ""), patch.object(
            server, "_read_body", lambda handler, *args, **kwargs: self._raw_body
        ):
            server.Handler.do_POST(self.handler)
        return self.status_codes, self.body

    def error_text(self):
        try:
            return str(json.loads(self.body.decode("utf-8")).get("error", ""))
        except Exception:
            return ""


class ProxyUrlGuardTest(unittest.TestCase):
    def _json_harness(self, path, payload):
        return _HandlerHarness(
            path,
            json.dumps(payload).encode("utf-8"),
            {"Content-Type": "application/json"},
        )

    def _assert_blocked(self, harness, marker):
        """断言 URL 校验生效：返回 400、原因匹配、且未触达任何网络层。"""
        with patch("requests.post") as m_post, patch(
            "requests.get"
        ) as m_get, patch("urllib.request.urlopen") as m_urlopen, patch(
            "urllib.request.Request"
        ) as m_request:
            codes, _body = harness.run()
        self.assertEqual(codes, [400])
        self.assertEqual(m_post.call_count, 0)
        self.assertEqual(m_get.call_count, 0)
        self.assertEqual(m_urlopen.call_count, 0)
        self.assertEqual(m_request.call_count, 0)
        self.assertIn(marker, harness.error_text())

    # --- /api/v2/proxy/apimart-upload -------------------------------------

    def _apimart_harness(self, api_url):
        boundary = "----CanvasProUrlGuardBoundary"
        body = _build_multipart_body(
            boundary,
            (("apiKey", "secret"), ("apiUrl", api_url)),
        )
        return _HandlerHarness(
            "/api/v2/proxy/apimart-upload",
            body,
            {"Content-Type": f"multipart/form-data; boundary={boundary}"},
        )

    def test_apimart_upload_blocks_unsafe_api_url(self):
        for api_url, marker in BLOCK_CASES:
            with self.subTest(api_url=api_url):
                self._assert_blocked(self._apimart_harness(api_url), marker)

    # --- /api/v2/proxy/image ----------------------------------------------

    def test_proxy_image_blocks_unsafe_api_url(self):
        for api_url, marker in BLOCK_CASES:
            with self.subTest(api_url=api_url):
                harness = self._json_harness(
                    "/api/v2/proxy/image", {"apiUrl": api_url, "apiKey": "secret"}
                )
                self._assert_blocked(harness, marker)

    # --- /api/v2/proxy/completions ----------------------------------------

    def test_proxy_completions_blocks_unsafe_api_url(self):
        for api_url, marker in BLOCK_CASES:
            with self.subTest(api_url=api_url):
                harness = self._json_harness(
                    "/api/v2/proxy/completions",
                    {"apiUrl": api_url, "apiKey": "secret"},
                )
                self._assert_blocked(harness, marker)

    # --- /api/v2/chat ------------------------------------------------------

    def test_chat_blocks_unsafe_api_url(self):
        for api_url, marker in BLOCK_CASES:
            with self.subTest(api_url=api_url):
                harness = self._json_harness(
                    "/api/v2/chat",
                    {
                        "apiUrl": api_url,
                        "apiKey": "secret",
                        "model": "demo-model",
                        "prompt": "hello",
                    },
                )
                self._assert_blocked(harness, marker)

    # --- 放行用例：合法公网 IP 字面量不得被校验误伤 -------------------------

    def test_proxy_completions_allows_public_ip_literal(self):
        harness = self._json_harness(
            "/api/v2/proxy/completions",
            {"apiUrl": PUBLIC_IP_BASE_URL, "apiKey": "secret"},
        )
        fake = _FakeRequestsResponse('{"ok": true}')
        with patch("requests.post", return_value=fake) as m_post:
            codes, body = harness.run()
        self.assertNotIn(400, codes)
        self.assertEqual(codes, [200])
        self.assertEqual(m_post.call_count, 1)
        self.assertEqual(
            m_post.call_args[0][0], f"{PUBLIC_IP_BASE_URL}/chat/completions"
        )
        self.assertEqual(body, b'{"ok": true}')

    def test_chat_allows_public_ip_literal(self):
        harness = self._json_harness(
            "/api/v2/chat",
            {
                "apiUrl": PUBLIC_IP_BASE_URL,
                "apiKey": "secret",
                "model": "demo-model",
                "prompt": "hello",
            },
        )
        fake = _FakeUrlopenResponse(
            b'{"choices": [{"message": {"content": "hi"}}]}'
        )
        with patch("urllib.request.urlopen", return_value=fake) as m_urlopen:
            codes, body = harness.run()
        self.assertNotIn(400, codes)
        self.assertEqual(codes, [200])
        self.assertEqual(m_urlopen.call_count, 1)
        self.assertIn("hi", body.decode("utf-8"))


if __name__ == "__main__":
    unittest.main()
