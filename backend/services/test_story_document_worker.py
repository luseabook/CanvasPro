"""Worker tests mock OS limits; never restrict the test runner's actual resources."""
import io
import json
from types import SimpleNamespace
import unittest
from unittest.mock import MagicMock, patch

from backend.services import story_document_worker as worker
from backend.services.story_document_extractor import DocumentError


class DocumentWorkerTests(unittest.TestCase):
    def test_posix_limits_are_required(self):
        resource = MagicMock()
        with patch.object(worker.os, 'name', 'posix'), patch.dict('sys.modules', {'resource': resource}):
            worker.configure_limits()
        self.assertEqual(resource.setrlimit.call_count, 3)

    def test_limit_failure_is_not_silently_ignored(self):
        resource = MagicMock(); resource.setrlimit.side_effect = OSError('not supported')
        with patch.object(worker.os, 'name', 'posix'), patch.dict('sys.modules', {'resource': resource}):
            with self.assertRaises(DocumentError) as raised:
                worker.configure_limits()
        self.assertEqual(raised.exception.code, 503)

    def test_protocol_uses_bytes_not_file_paths(self):
        output = io.BytesIO()
        request = io.BytesIO(b'{"extension":".pdf"}\n%PDF-fixture')
        with patch.object(worker, 'configure_limits'), patch.object(worker, 'extract_document', return_value={'text': 'hello'}) as extract:
            with patch.object(worker.sys, 'stdin', SimpleNamespace(buffer=request)), patch.object(worker.sys, 'stdout', SimpleNamespace(buffer=output)):
                worker.main()
        extract.assert_called_once_with(b'%PDF-fixture', '.pdf')
        self.assertEqual(json.loads(output.getvalue())['data']['text'], 'hello')


if __name__ == '__main__':
    unittest.main()
