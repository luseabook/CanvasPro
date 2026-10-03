import json
import os
import tempfile
import unittest
from pathlib import Path

from backend.services.json_file_route_service import JsonFileRouteService


class JsonFileRouteSecurityTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.canvas = self.root / "canvas"
        self.assets = self.root / "assets"
        self.workflows = self.root / "workflows"
        self.user = self.root / "user"
        for directory in (self.canvas, self.assets, self.workflows, self.user):
            directory.mkdir()
        self.service = JsonFileRouteService(
            canvas_dir_getter=lambda: str(self.canvas),
            assets_dir_getter=lambda: str(self.assets),
            workflows_dir_getter=lambda: str(self.workflows),
            user_dir_getter=lambda: str(self.user),
            read_user_settings=lambda: {},
            write_user_settings=lambda value: None,
            atomic_write_json=lambda path, value: None,
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_json_filename_guards_reject_drive_and_separators(self):
        for value in (
            "C:/Users/person/secret.json",
            "C:\\Users\\person\\secret.json",
            "\\server\\share\\secret.json",
            "nested/project.json",
            "../project.json",
        ):
            self.assertFalse(self.service._safe_json_filename(value), value)
            self.assertFalse(self.service._valid_json_path_fragment(value), value)
        self.assertTrue(self.service._safe_json_filename("project-1.json"))

    def test_project_read_cannot_escape_canvas_directory(self):
        outside = self.root / "outside.json"
        outside.write_text(json.dumps({"secret": "must stay outside"}), encoding="utf-8")
        drive, tail = os.path.splitdrive(str(outside))
        if not drive:
            self.skipTest("drive-qualified path test requires Windows")
        request_path = "/api/v2/projects/" + drive + "/" + tail.lstrip("\\/").replace("\\", "/")
        response = self.service._load_project(request_path)
        self.assertEqual(response["code"], 400)
        self.assertTrue(outside.is_file())

    def test_delete_and_rename_reject_drive_qualified_paths(self):
        outside = self.root / "outside.json"
        outside.write_text(json.dumps({"secret": "must stay outside"}), encoding="utf-8")
        drive, _ = os.path.splitdrive(str(outside))
        suffix = str(outside).split(":", 1)[1].lstrip("\\/").replace("\\", "/")
        if not drive:
            self.skipTest("drive-qualified path test requires Windows")
        request_tail = drive + "/" + suffix
        deleted = self.service._delete_json_file(
            "/api/v2/projects/" + request_tail,
            prefix="/api/v2/projects/",
            directory=str(self.canvas),
            not_found_message="Project not found",
        )
        renamed = self.service._rename_project(
            "/api/v2/projects/" + request_tail,
            {"name": "renamed"},
        )
        self.assertEqual(deleted["code"], 400)
        self.assertEqual(renamed["code"], 400)
        self.assertTrue(outside.is_file())


if __name__ == "__main__":
    unittest.main()
