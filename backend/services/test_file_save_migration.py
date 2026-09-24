"""Source-level regression cases for the opt-in copy-only path migration.

These tests use only temporary fixtures. They are intentionally not executed as
part of the source handoff; running them requires separate user authorization.
"""

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.services.file_save_migration import (
    copy_tree,
    inspect_source,
    validate_copy_steps,
    verify_copies,
)


class FileSaveMigrationTests(unittest.TestCase):
    def setUp(self):
        self.sandbox = tempfile.TemporaryDirectory()
        self.addCleanup(self.sandbox.cleanup)
        self.root = Path(self.sandbox.name)
        self.old = self.root / "old"
        self.new = self.root / "new"
        (self.old / "projects").mkdir(parents=True)
        (self.old / "projects" / "old project.aicanvas").write_bytes(b'old project')
        (self.old / "data").mkdir()
        (self.old / "data" / "custom.bin").write_bytes(b'original media')
        (self.old / "output").mkdir()
        (self.old / "output" / "render.mp4").write_bytes(b'output bytes')
        self.steps = [
            {"key": key, "label": key, "src": str(self.old / key), "dst": str(self.new / key)}
            for key in ("projects", "data", "output")
        ]

    def test_copy_preserves_all_sources_and_copies_unknown_data_files(self):
        active = validate_copy_steps(self.steps)
        snapshots = [inspect_source(step["src"]) for step in active]
        outcomes = []
        for step in active:
            copy_tree(step["src"], step["dst"],
                      lambda relative, result, size, error: outcomes.append((relative, result)))
        verify_copies(active, snapshots)
        self.assertEqual(len(outcomes), 3)
        self.assertTrue(all(result == "copied" for _, result in outcomes))
        self.assertEqual((self.new / "data" / "custom.bin").read_bytes(), b'original media')
        self.assertEqual((self.old / "projects" / "old project.aicanvas").read_bytes(), b'old project')

    def test_identical_existing_file_is_safe_to_skip(self):
        (self.new / "projects").mkdir(parents=True)
        (self.new / "projects" / "old project.aicanvas").write_bytes(b'old project')
        results = []
        copy_tree(str(self.old / "projects"), str(self.new / "projects"),
                  lambda relative, result, size, error: results.append(result))
        self.assertEqual(results, ["skipped"])
        self.assertTrue((self.old / "projects" / "old project.aicanvas").is_file())

    def test_name_collision_does_not_overwrite_source_or_destination(self):
        (self.new / "projects").mkdir(parents=True)
        conflict = self.new / "projects" / "old project.aicanvas"
        conflict.write_bytes(b'different project')
        with self.assertRaises(FileExistsError):
            copy_tree(str(self.old / "projects"), str(self.new / "projects"))
        self.assertEqual(conflict.read_bytes(), b'different project')
        self.assertEqual((self.old / "projects" / "old project.aicanvas").read_bytes(), b'old project')

    def test_changed_source_before_final_verification_fails(self):
        step = validate_copy_steps(self.steps)[0]
        snapshot = inspect_source(step["src"])
        copy_tree(step["src"], step["dst"])
        (self.old / "projects" / "new.json").write_bytes(b'new write during migration')
        with self.assertRaises(RuntimeError):
            verify_copies([step], [snapshot])
        self.assertTrue((self.old / "projects" / "new.json").exists())

    def test_nested_destination_and_cross_bucket_swap_fail_closed(self):
        nested = [{"src": str(self.old / "projects"), "dst": str(self.old / "projects" / "new") }]
        with self.assertRaises(ValueError):
            validate_copy_steps(nested)
        swapped = [
            {"src": str(self.old / "data"), "dst": str(self.old / "output")},
            {"src": str(self.old / "output"), "dst": str(self.old / "data")},
        ]
        with self.assertRaises(ValueError):
            validate_copy_steps(swapped)

    def test_source_symlink_rejected_when_supported(self):
        link = self.root / "source-link"
        try:
            os.symlink(self.old / "projects", link, target_is_directory=True)
        except (OSError, NotImplementedError):
            self.skipTest("symlink creation is not available")
        with self.assertRaises(ValueError):
            validate_copy_steps([{"src": str(link), "dst": str(self.new / "projects")}])

    def test_hard_link_unavailable_leaves_no_final_or_temp_file(self):
        source = str(self.old / "projects")
        destination = str(self.new / "projects")
        with patch("backend.services.file_save_migration.os.link", side_effect=OSError("no links")):
            with self.assertRaises(OSError):
                copy_tree(source, destination)
        self.assertFalse((self.new / "projects" / "old project.aicanvas").exists())
        self.assertEqual(list((self.new / "projects").glob(".aic-migration-*")), [])
        self.assertTrue((self.old / "projects" / "old project.aicanvas").is_file())


if __name__ == "__main__":
    unittest.main()
