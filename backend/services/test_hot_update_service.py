import unittest
from unittest.mock import patch

from backend.services.hot_update_service import HotUpdateService


class HotUpdateWorktreeSafetyTest(unittest.TestCase):
    def test_apply_refuses_dirty_worktree_before_fetch_or_merge(self):
        service = HotUpdateService(directory=".", local_version="1.0.0", is_dev_build=True)
        with patch.object(service, "hot_update_status", return_value={"canHotApply": True, "remote": "origin", "restartScript": "restart.bat"}), patch.object(
            service, "_git_worktree_snapshot", return_value={"dirty": True, "head": "abc123"}
        ), patch("backend.services.hot_update_service.subprocess.run") as run:
            result = service.apply_hot_update()
        self.assertFalse(result["success"])
        self.assertIn("不干净", result["error"])
        run.assert_not_called()

    def test_dirty_status_is_fail_closed_when_git_status_fails(self):
        service = HotUpdateService(directory=".", local_version="1.0.0", is_dev_build=True)
        failed = type("Result", (), {"returncode": 1, "stdout": b"", "stderr": b"fatal"})()
        with patch("backend.services.hot_update_service.subprocess.run", return_value=failed):
            self.assertIsNone(service._git_worktree_snapshot())


if __name__ == "__main__":
    unittest.main()
