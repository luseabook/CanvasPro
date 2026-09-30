"""Offline regressions. All files and SQLite databases live in TemporaryDirectory."""
import ast
import concurrent.futures
import json
import os
from pathlib import Path
import tempfile
import types
import unittest
import urllib.parse
from unittest.mock import patch, Mock

from backend.services.json_storage import atomic_write_json, CorruptJSONError
from backend.services.path_security import safe_json_filename, confined_json_path
from backend.services.static_file_access import resolve_static_file
from backend.services.json_file_route_service import JsonFileRouteService
from backend.services.config_route_service import ConfigRouteService
from backend.services.hot_update_service import HotUpdateService

class TemporaryFiles(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="aic-security-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

class AtomicJSONTests(TemporaryFiles):
    def test_previous_version_is_kept(self):
        p = self.root / "workspace.json"
        atomic_write_json(p, {"revision": 1})
        atomic_write_json(p, {"revision": 2})
        self.assertEqual(json.loads(p.read_text()), {"revision": 2})
        self.assertEqual(json.loads(Path(str(p) + ".bak").read_text()), {"revision": 1})

    def test_failed_replace_keeps_original_and_cleans_temp(self):
        p = self.root / "workspace.json"
        atomic_write_json(p, {"revision": 1})
        original_replace = os.replace
        def fail_destination(source, destination):
            if os.fspath(destination) == os.fspath(p):
                raise OSError("simulated disk failure")
            return original_replace(source, destination)
        with patch("backend.services.json_storage.os.replace", side_effect=fail_destination):
            with self.assertRaises(OSError):
                atomic_write_json(p, {"revision": 2})
        self.assertEqual(json.loads(p.read_text()), {"revision": 1})
        self.assertFalse(list(self.root.glob("*.tmp")))

    def test_bad_existing_json_is_preserved(self):
        p = self.root / "workspace.json"; p.write_text('{"unfinished":')
        with self.assertRaises(CorruptJSONError):
            atomic_write_json(p, {})
        self.assertEqual(p.read_text(), '{"unfinished":')

    def test_serialization_failure_cannot_truncate(self):
        p = self.root / "workspace.json"; atomic_write_json(p, {"revision": 1})
        with self.assertRaises(TypeError):
            atomic_write_json(p, {"bad": object()})
        self.assertEqual(json.loads(p.read_text()), {"revision": 1})

    def test_concurrent_writers_always_leave_whole_json(self):
        p = self.root / "workspace.json"
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            list(executor.map(lambda n: atomic_write_json(p, {"n": n, "data": "x" * 4096}), range(12)))
        self.assertEqual(len(json.loads(p.read_text())["data"]), 4096)
        json.loads(Path(str(p) + ".bak").read_text())

class FileBoundaryTests(TemporaryFiles):
    def setUp(self):
        super().setUp()
        self.service = JsonFileRouteService(
            canvas_dir_getter=lambda: str(self.root), assets_dir_getter=lambda: str(self.root),
            workflows_dir_getter=lambda: str(self.root), user_dir_getter=lambda: str(self.root),
            read_user_settings=lambda: {}, write_user_settings=lambda data: None,
            atomic_write_json=atomic_write_json,
        )

    def test_windows_and_encoded_paths_are_rejected(self):
        for name in ["C:\\private.json", "C:private.json", "\\private.json", "/private.json", "../private.json", "a/b.json", "a\\b.json", "CON.json", "a.json:secret", "x%2fsecret.json", "a\x00.json"]:
            with self.subTest(name=name):
                self.assertFalse(safe_json_filename(name))
                encoded = urllib.parse.quote(name, safe="")
                result = self.service.handle_get(None, "/api/v2/projects/" + encoded)
                self.assertEqual(result["code"], 400)
                self.assertEqual(self.service.handle_delete(None, "/api/v2/projects/" + encoded)["code"], 400)
                self.assertEqual(self.service.handle_patch(None, "/api/v2/projects/" + encoded, '{"name":"new"}')["code"], 400)

    def test_normal_json_read_save_delete_and_rename(self):
        result = self.service.handle_post(None, "/api/v2/projects/save", '{"projectName":"normal","nodes":{}}')
        self.assertTrue(result["data"]["success"])
        self.assertEqual(self.service.handle_get(None, "/api/v2/projects/normal.json")["kind"], "json_ok")
        self.assertTrue(self.service.handle_patch(None, "/api/v2/projects/normal.json", '{"name":"renamed"}')["data"]["success"])
        self.assertTrue(self.service.handle_delete(None, "/api/v2/projects/renamed.json")["data"]["success"])

    def test_unicode_workspace_and_all_json_writers_use_atomic_storage(self):
        for path, payload, filename in [
            ("/api/v2/user/story-workspace.json", {"text": "测试"}, "story-workspace.json"),
            ("/api/v2/assets/save", {"id": "asset"}, "asset.json"),
            ("/api/v2/workflows/save", {"id": "workflow"}, "workflow.json"),
        ]:
            self.service.handle_post(None, path, json.dumps(payload))
            self.service.handle_post(None, path, json.dumps(payload))
            self.assertTrue((self.root / (filename + ".bak")).exists())

    def test_symlink_cannot_escape_root(self):
        inside = self.root / "inside"; inside.mkdir()
        outside = self.root / "outside.json"; outside.write_text('{}')
        try:
            (inside / "link.json").symlink_to(outside)
        except OSError:
            self.skipTest("Host does not permit symlink creation")
        with self.assertRaises(ValueError):
            confined_json_path(inside, "link.json")
        self.assertEqual(outside.read_text(), '{}')

    def test_rename_never_overwrites_an_existing_project(self):
        (self.root / 'a.json').write_text('{}'); (self.root / 'b.json').write_text('{"keep":1}')
        self.assertEqual(self.service.handle_patch(None, '/api/v2/projects/a.json', '{"name":"b"}')["code"], 409)
        self.assertEqual((self.root / 'b.json').read_text(), '{"keep":1}')

class ConfigTests(TemporaryFiles):
    def test_corruption_is_not_treated_as_an_empty_config(self):
        path = self.root / 'config.json'; path.write_text('{broken')
        service = ConfigRouteService(config_file_getter=lambda: str(path))
        self.assertEqual(service.handle_get(None, '/api/config')["code"], 409)
        self.assertEqual(service.handle_post(None, '/api/config', '{}')["code"], 409)
        self.assertEqual(path.read_text(), '{broken')

    def test_config_commits_keep_a_backup(self):
        path = self.root / 'config.json'; service = ConfigRouteService(config_file_getter=lambda: str(path))
        service.handle_post(None, '/api/config', '{"provider":"first"}')
        service.handle_post(None, '/api/config', '{"provider":"second"}')
        self.assertEqual(json.loads(Path(str(path)+'.bak').read_text())["provider"], 'first')

class StaticAccessTests(TemporaryFiles):
    def resolve(self, url):
        return resolve_static_file(url, self.root, [('output/', self.root / 'output'), ('data/workflows/', self.root / 'workflows')])

    def test_private_repository_paths_never_fall_back_to_static(self):
        for path in ['/user/config.json', '/user/story-workspace.json', '/.git/HEAD', '/%2egit/config', '/server.py', '/backend/shortdrama_db.py', '/package-lock.json', '/user/', '/src/../../user/config.json', '/src/%5c..%5cuser/config.json', '/src/%252e%252e/user/config.json']:
            with self.subTest(path=path): self.assertIsNone(self.resolve(path))

    def test_public_entry_and_modules_remain_reachable(self):
        for path in ['/', '/main.js', '/style.css', '/src/modules/app/workspaceCloseGuard.js', '/api/requester.js', '/styles/story-workspace-modern.css', '/vendor/module.js']:
            self.assertIsNotNone(self.resolve(path), path)
            self.assertFalse(self.resolve(path)[1])

    def test_generated_media_and_workflows_are_marked_private(self):
        self.assertTrue(self.resolve('/output/clip.mp4')[1])
        self.assertTrue(self.resolve('/data/workflows/flow.json')[1])
        self.assertIsNone(self.resolve('/output/private.json'))
        self.assertIsNone(self.resolve('/output/../config.json'))

    def test_static_symlink_does_not_expose_outside_file(self):
        assets = self.root / 'assets'; assets.mkdir()
        outside = self.root.parent / (self.root.name + '-outside.png')
        outside.write_bytes(b'fixture'); self.addCleanup(lambda: outside.unlink(missing_ok=True))
        try: (assets / 'link.png').symlink_to(outside)
        except OSError: self.skipTest('Host does not permit symlink creation')
        self.assertIsNone(self.resolve('/assets/link.png'))

    def test_server_auth_policy_is_default_protected(self):
        # Execute the actual pure policy function, without importing server startup side effects.
        source = (Path(__file__).resolve().parents[2] / 'server.py').read_text(encoding='utf-8-sig')
        definition = next(n for n in ast.parse(source).body if isinstance(n, ast.FunctionDef) and n.name == '_is_sensitive_api_path')
        namespace = {'urllib': __import__('urllib')}
        exec(compile(ast.Module(body=[definition], type_ignores=[]), 'server.py', 'exec'), namespace)
        policy = namespace['_is_sensitive_api_path']
        for path in ['/api/shortdrama/create', '/api/v2/new-sensitive-api', '/api/v2/runtime/info', '/api/private-media']:
            self.assertTrue(policy(path))
        self.assertFalse(policy('/style.css'))

class HotUpdateTests(TemporaryFiles):
    def service(self):
        (self.root / '.git').mkdir(exist_ok=True)
        script = self.root / 'restart.cmd'; script.write_text('test fixture only')
        service = HotUpdateService(directory=str(self.root), local_version='1', is_dev_build=True)
        service.select_git_remote = Mock(return_value='origin')
        service.get_restart_script_path = Mock(return_value=str(script))
        service._schedule_restart = Mock()
        return service

    def test_dirty_worktree_is_refused_before_fetch(self):
        service = self.service()
        with patch('backend.services.hot_update_service.subprocess.run', return_value=types.SimpleNamespace(returncode=0, stdout=b' M main.js', stderr=b'')) as run:
            self.assertFalse(service.apply_hot_update()['success'])
            self.assertEqual(run.call_count, 1)
        service._schedule_restart.assert_not_called()

    def test_changes_during_fetch_abort_before_merge(self):
        service = self.service()
        values = [types.SimpleNamespace(returncode=0, stdout=b'', stderr=b'') for _ in range(3)]
        values[2].stdout = b'?? work.json'
        with patch('backend.services.hot_update_service.subprocess.run', side_effect=values) as run:
            self.assertFalse(service.apply_hot_update()['success'])
            self.assertEqual(run.call_count, 3)
        service._schedule_restart.assert_not_called()

    def test_clean_update_is_fast_forward_only_and_never_resets(self):
        service = self.service()
        with patch('backend.services.hot_update_service.subprocess.run', return_value=types.SimpleNamespace(returncode=0, stdout=b'', stderr=b'')) as run:
            self.assertTrue(service.apply_hot_update()['success'])
            commands = [call.args[0] for call in run.call_args_list]
            self.assertIn(['git', 'merge', '--ff-only', 'FETCH_HEAD'], commands)
            self.assertFalse(any('reset' in cmd or '--hard' in cmd for cmd in commands))
        service._schedule_restart.assert_called_once()

if __name__ == '__main__':
    unittest.main()
