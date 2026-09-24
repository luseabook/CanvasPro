"""Read-only candidate selection checks. Not executed during source handoff."""

import tempfile
import unittest
from pathlib import Path

from backend.services.legacy_storage_import import (
    inspect_legacy_roots, public_legacy_candidates, resolve_legacy_candidate,
)


class LegacyStorageImportTests(unittest.TestCase):
    def setUp(self):
        self.sandbox = tempfile.TemporaryDirectory()
        self.addCleanup(self.sandbox.cleanup)
        base = Path(self.sandbox.name)
        self.legacy = base / "old-install" / "Data"
        self.current = base / "current"
        self.source_paths = {
            "canvasDir": str(self.legacy / "Canvas Project"),
            "outputDir": str(self.legacy / "output"),
            "dataDir": str(self.legacy / "data"),
        }
        self.target_paths = {
            "canvasDir": str(self.current / "projects"),
            "outputDir": str(self.current / "output"),
            "dataDir": str(self.current / "data"),
        }
        (self.legacy / "Canvas Project").mkdir(parents=True)
        (self.legacy / "Canvas Project" / "old.json").write_bytes(b'old project')

    def test_only_configured_sources_are_selected_and_no_files_are_copied_by_preview(self):
        candidates = inspect_legacy_roots([self.source_paths], self.target_paths)
        self.assertEqual(len(candidates), 1)
        self.assertEqual(candidates[0]["fileCount"], 1)
        public = public_legacy_candidates(candidates)[0]
        self.assertNotIn("steps", public)
        self.assertNotIn("snapshots", public)
        self.assertFalse(self.current.exists())
        selected = resolve_legacy_candidate(candidates, public["id"], public["fingerprint"])
        self.assertEqual(selected["steps"][0]["src"], self.source_paths["canvasDir"])

    def test_stale_preview_or_unknown_candidate_fails_closed(self):
        preview = inspect_legacy_roots([self.source_paths], self.target_paths)
        old_token = preview[0]["fingerprint"]
        (self.legacy / "Canvas Project" / "new.json").write_bytes(b'late')
        fresh = inspect_legacy_roots([self.source_paths], self.target_paths)
        with self.assertRaises(ValueError):
            resolve_legacy_candidate(fresh, preview[0]["id"], old_token)
        with self.assertRaises(ValueError):
            resolve_legacy_candidate(fresh, "../../arbitrary-root", fresh[0]["fingerprint"])

    def test_cross_bucket_overlap_is_reported_as_blocked(self):
        invalid_targets = dict(self.target_paths)
        invalid_targets["dataDir"] = str(self.legacy / "Canvas Project" / "new-data")
        candidates = inspect_legacy_roots([self.source_paths], invalid_targets)
        self.assertTrue(candidates[0]["error"])
        with self.assertRaises(ValueError):
            resolve_legacy_candidate(candidates, candidates[0]["id"], "any")


if __name__ == "__main__":
    unittest.main()
