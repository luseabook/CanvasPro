"""HTTP/worker contract tests. No server, subprocess or network is started."""
import io
import json
import subprocess
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

from backend.services.story_document_route_service import StoryDocumentRouteService, DOCUMENT_ROUTE, FILE_LIMIT


def handler(body=b'%PDF-fixture', **headers):
    return SimpleNamespace(headers={'Content-Length': str(len(body)), 'Content-Type': 'application/pdf', **headers},
                           rfile=io.BytesIO(body), connection=MagicMock(), close_connection=False)


class DocumentRouteTests(unittest.TestCase):
    def test_unrelated_route_does_not_read_body(self):
        service = StoryDocumentRouteService(); request = handler()
        self.assertIsNone(service.handle_post(request, '/elsewhere'))
        self.assertEqual(request.rfile.tell(), 0)

    def test_binary_body_goes_only_to_fixed_worker(self):
        service = StoryDocumentRouteService(); request = handler()
        expected = {'kind': 'json_ok', 'data': {'text': 'sample'}}
        with patch.object(service, '_run_worker', return_value=expected) as worker:
            self.assertEqual(service.handle_post(request, DOCUMENT_ROUTE), expected)
            worker.assert_called_once_with(b'%PDF-fixture', '.pdf')
        self.assertTrue(request.close_connection)

    def test_oversize_chunked_and_unsupported_content_type(self):
        service = StoryDocumentRouteService()
        for headers, status in [({'Content-Length': str(FILE_LIMIT + 1)}, 413),
                                ({'Transfer-Encoding': 'chunked'}, 400), ({'Content-Type': 'application/json'}, 415),
                                ({'Content-Length': ''}, 411)]:
            with self.subTest(headers=headers):
                self.assertEqual(service.handle_post(handler(**headers), DOCUMENT_ROUTE)['code'], status)

    def test_busy_rejects_without_waiting(self):
        service = StoryDocumentRouteService(); service._slot.acquire()
        try:
            self.assertEqual(service.handle_post(handler(), DOCUMENT_ROUTE)['code'], 429)
        finally:
            service._slot.release()

    def test_timeout_kills_and_reaps_worker(self):
        service = StoryDocumentRouteService(); process = MagicMock()
        process.__enter__.return_value = process
        process.communicate.side_effect = [subprocess.TimeoutExpired('python', 35), (b'', None)]
        with patch('backend.services.story_document_route_service.subprocess.Popen', return_value=process):
            result = service._run_worker(b'%PDF-fixture', '.pdf')
        self.assertEqual(result['code'], 504); process.kill.assert_called_once()
        self.assertEqual(process.communicate.call_count, 2)

    def test_worker_structured_error_is_preserved(self):
        service = StoryDocumentRouteService(); process = MagicMock()
        process.__enter__.return_value = process; process.returncode = 0
        process.communicate.return_value = (json.dumps({'ok': False, 'code': 503, 'message': 'dependency missing'}).encode(), None)
        with patch('backend.services.story_document_route_service.subprocess.Popen', return_value=process):
            self.assertEqual(service._run_worker(b'%PDF-fixture', '.pdf')['code'], 503)

    def test_malformed_worker_output_is_not_success(self):
        service = StoryDocumentRouteService(); process = MagicMock()
        process.__enter__.return_value = process; process.returncode = 0
        process.communicate.return_value = (b'not json', None)
        with patch('backend.services.story_document_route_service.subprocess.Popen', return_value=process):
            self.assertEqual(service._run_worker(b'%PDF-fixture', '.pdf')['code'], 502)


if __name__ == '__main__':
    unittest.main()
