import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import server


class ServerSecurityTest(unittest.TestCase):
    def _request(self, client_ip, origin=None, token=None):
        headers = {}
        if origin is not None:
            headers["Origin"] = origin
        if token is not None:
            headers["X-AIC-Local-Token"] = token
        return SimpleNamespace(
            headers=headers,
            client_address=(client_ip, 45678),
            server=SimpleNamespace(server_address=("0.0.0.0", server.PORT)),
        )

    def test_loopback_origin_is_not_remote_lan_authentication(self):
        remote = self._request(
            "192.168.1.44",
            origin=f"http://127.0.0.1:{server.PORT}",
        )
        local = self._request(
            "127.0.0.1",
            origin=f"http://127.0.0.1:{server.PORT}",
        )
        with patch.object(server, "LOCAL_ACCESS_TOKEN", ""):
            self.assertFalse(server._request_passes_local_security(remote, "/api/v2/config"))
            self.assertTrue(server._request_passes_local_security(local, "/api/v2/config"))

    def test_remote_sensitive_api_requires_valid_local_token(self):
        remote = self._request("192.168.1.44", origin="https://trusted.example", token="secret")
        invalid = self._request("192.168.1.44", origin="http://127.0.0.1:8777", token="wrong")
        with patch.object(server, "LOCAL_ACCESS_TOKEN", "secret"):
            self.assertTrue(server._request_passes_local_security(remote, "/api/v2/projects"))
            self.assertFalse(server._request_passes_local_security(invalid, "/api/v2/projects"))

    def test_remote_client_cannot_fetch_private_static_user_files_without_token(self):
        # Runtime data lives under private roots; a non-loopback peer must never read it.
        handler = object.__new__(server.Handler)
        resolved = server.Handler._resolve_static_file(handler, "/output/render.png")
        self.assertIsNotNone(resolved)
        self.assertTrue(resolved[1], "output/ must be classified as private")
        sent = []
        handler.path = "/output/render.png"
        handler.headers = {}
        handler.client_address = ("192.168.1.44", 45678)
        handler.server = SimpleNamespace(server_address=("0.0.0.0", server.PORT))
        handler.send_response = lambda code, message=None: sent.append(code)
        handler.send_header = lambda *args, **kwargs: None
        handler.end_headers = lambda: None
        handler.wfile = SimpleNamespace(write=lambda body: None)
        with patch.object(server, "LOCAL_ACCESS_TOKEN", ""):
            result = server.Handler.send_head(handler)
        self.assertIsNone(result)
        self.assertEqual(sent[0], 403)

    def test_legacy_user_static_files_are_not_served_at_all(self):
        handler = object.__new__(server.Handler)
        self.assertIsNone(server.Handler._resolve_static_file(handler, "/user/config.json"))
        self.assertIsNone(server.Handler._resolve_static_file(handler, "/data/workflows/../../secret.json"))

    def test_oversized_content_length_is_rejected_before_body_read(self):
        stream = __import__("io").BytesIO(b"body-not-consumed")
        handler = SimpleNamespace(
            headers={"Content-Length": "9"},
            rfile=stream,
            close_connection=False,
        )
        with self.assertRaisesRegex(ValueError, "REQUEST_BODY_TOO_LARGE"):
            server._read_body(handler, max_bytes=8)
        self.assertEqual(stream.tell(), 0)
        self.assertTrue(handler.close_connection)

    def test_chunk_size_is_checked_before_reading_payload(self):
        header = b"9\r\n"
        stream = __import__("io").BytesIO(header + b"x" * 9 + b"\r\n0\r\n\r\n")
        handler = SimpleNamespace(
            headers={"Transfer-Encoding": "chunked"},
            rfile=stream,
            close_connection=False,
        )
        with self.assertRaisesRegex(ValueError, "REQUEST_BODY_TOO_LARGE"):
            server._read_body(handler, max_bytes=8)
        self.assertEqual(stream.tell(), len(header))
        self.assertTrue(handler.close_connection)

    def test_small_chunked_body_is_read_and_validated(self):
        stream = __import__("io").BytesIO(b"3\r\nabc\r\n0\r\n\r\n")
        handler = SimpleNamespace(
            headers={"Transfer-Encoding": "chunked"},
            rfile=stream,
            close_connection=False,
        )
        self.assertEqual(server._read_body(handler, max_bytes=8), b"abc")

    def test_windows_drive_path_cannot_escape_virtual_workflow_root(self):
        handler = object.__new__(server.Handler)
        handler.directory = server.DIRECTORY
        # A drive-qualified name is refused outright rather than resolved outside the root.
        self.assertIsNone(
            server.Handler._resolve_static_file(
                handler,
                "/data/workflows/C:/Users/example/private.json",
            )
        )
        # A legitimate workflow name still resolves, and resolves inside the workflow root.
        resolved = server.Handler._resolve_static_file(handler, "/data/workflows/demo.json")
        self.assertIsNotNone(resolved)
        self.assertTrue(server._is_path_within_root(resolved[0], server.WORKFLOWS_DIR))
        self.assertTrue(resolved[1])


if __name__ == "__main__":
    unittest.main()
