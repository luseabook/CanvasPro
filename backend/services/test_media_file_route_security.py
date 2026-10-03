import unittest
from email.message import Message
from urllib.request import Request

from backend.services.media_file_route_service import _ValidatedDownloadRedirectHandler


class ValidatedDownloadRedirectTest(unittest.TestCase):
    def _redirect(self, target, validate):
        handler = _ValidatedDownloadRedirectHandler(validate)
        request = Request("https://public.example/source")
        return handler.redirect_request(request, None, 302, "Found", Message(), target)

    def test_redirect_to_private_or_non_http_host_is_rejected(self):
        def validate(parsed):
            return {"kind": "json_err"} if parsed.hostname == "127.0.0.1" else None

        self.assertIsNone(self._redirect("http://127.0.0.1/admin", validate))
        self.assertIsNone(self._redirect("file:///etc/passwd", validate))

    def test_public_redirect_is_followed_after_validation(self):
        target = self._redirect("https://cdn.example/media.mp4", lambda parsed: None)
        self.assertIsNotNone(target)
        self.assertEqual(target.full_url, "https://cdn.example/media.mp4")


if __name__ == "__main__":
    unittest.main()
