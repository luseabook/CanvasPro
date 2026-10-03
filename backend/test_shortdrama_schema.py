import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from backend import shortdrama_db as db

class ShortDramaSchemaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='aic-db-test-')
        self.path = str(Path(self.temp.name) / 'new' / 'shortdrama.db')
        self.env = patch.dict(os.environ, {'SHORTDRAMA_DB': self.path})
        self.env.start()
        self.previous = db._DB; db._DB = None

    def tearDown(self):
        if db._DB is not None: db._DB.close()
        db._DB = self.previous; self.env.stop(); self.temp.cleanup()

    def test_clean_install_initializes_full_schema_and_crud(self):
        project = db.create_project('test project')
        script = db.add_script(project, 'episode', 'test content', 1)
        db.add_storyboard(project, script, 1, 'fixture prompt', '3')
        self.assertEqual(len(db.list_storyboards(script)), 1)
        self.assertGreater(db.enqueue_task('fixture', project, script), 0)
        tables = {row[0] for row in db.conn().execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertEqual(len([name for name in tables if name.startswith('o_')]), 17)

    def test_schema_initialization_is_idempotent_and_preserves_rows(self):
        project = db.create_project('keep')
        db._DB.close(); db._DB = None
        self.assertEqual(db.conn().execute('SELECT name FROM o_project WHERE id=?', (project,)).fetchone()[0], 'keep')

    def test_concurrent_writes_are_serialized(self):
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=4) as executor:
            ids = list(executor.map(lambda n: db.create_project('project ' + str(n)), range(12)))
        self.assertEqual(len(set(ids)), 12)
        self.assertEqual(db.conn().execute('SELECT COUNT(*) FROM o_project').fetchone()[0], 12)

if __name__ == '__main__': unittest.main()
