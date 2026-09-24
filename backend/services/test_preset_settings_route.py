"""Source-level regression cases for the prompt-preset settings route.

Covers the ``/api/v2/user/presets/settings`` GET/POST pair that backs the global
text-capture default preset tab. These tests use only temporary fixtures. They
are intentionally not executed as part of the source handoff; running them
requires separate user authorization.
"""

import json
import os
import tempfile
import unittest

from backend.services.library_file_route_service import LibraryFileRouteService


class PresetSettingsRouteTests(unittest.TestCase):
    def setUp(self):
        self.sandbox = tempfile.TemporaryDirectory()
        self.addCleanup(self.sandbox.cleanup)
        self.user_dir = os.path.join(self.sandbox.name, "user")
        self.thumbs_dir = os.path.join(self.sandbox.name, "thumbs")
        os.makedirs(self.user_dir, exist_ok=True)
        os.makedirs(self.thumbs_dir, exist_ok=True)
        self.service = LibraryFileRouteService(
            user_dir_getter=lambda: self.user_dir,
            asset_thumbs_dir_getter=lambda: self.thumbs_dir,
            workflow_thumbs_dir_getter=lambda: self.thumbs_dir,
        )

    def settings_path(self):
        return os.path.join(self.user_dir, "prompt", "settings.json")

    def test_missing_settings_file_answers_an_empty_default(self):
        response = self.service.handle_get(None, "/api/v2/user/presets/settings")
        self.assertEqual(response, {"kind": "json_ok", "data": {"defaultQuickCaptureNodeType": ""}})
        self.assertFalse(os.path.exists(self.settings_path()))

    def test_saved_settings_round_trip_through_the_file(self):
        saved = self.service.handle_post(
            None,
            "/api/v2/user/presets/settings",
            json.dumps({"defaultQuickCaptureNodeType": "ai-video"}),
        )
        self.assertEqual(saved, {"kind": "json_ok", "data": {"defaultQuickCaptureNodeType": "ai-video"}})
        self.assertTrue(os.path.exists(self.settings_path()))

        reloaded = LibraryFileRouteService(
            user_dir_getter=lambda: self.user_dir,
            asset_thumbs_dir_getter=lambda: self.thumbs_dir,
            workflow_thumbs_dir_getter=lambda: self.thumbs_dir,
        ).handle_get(None, "/api/v2/user/presets/settings")
        self.assertEqual(reloaded, {"kind": "json_ok", "data": {"defaultQuickCaptureNodeType": "ai-video"}})

    def test_every_preset_manager_tab_is_accepted(self):
        for node_type in ("ai-text", "ai-image", "ai-video", "ai-audio"):
            response = self.service.handle_post(
                None,
                "/api/v2/user/presets/settings",
                json.dumps({"defaultQuickCaptureNodeType": node_type}),
            )
            self.assertEqual(
                response,
                {"kind": "json_ok", "data": {"defaultQuickCaptureNodeType": node_type}},
            )

    def test_unsupported_values_collapse_to_the_empty_default(self):
        for value in ("", "   ", "text", "ai-", None, 42, ["ai-text"], {"nodeType": "ai-text"}):
            response = self.service.handle_post(
                None,
                "/api/v2/user/presets/settings",
                json.dumps({"defaultQuickCaptureNodeType": value}),
            )
            self.assertEqual(response, {"kind": "json_ok", "data": {"defaultQuickCaptureNodeType": ""}})

    def test_unknown_payload_keys_are_dropped(self):
        self.service.handle_post(
            None,
            "/api/v2/user/presets/settings",
            json.dumps({"defaultQuickCaptureNodeType": "ai-audio", "unexpected": "value"}),
        )
        with open(self.settings_path(), "r", encoding="utf-8") as file:
            self.assertEqual(json.load(file), {"defaultQuickCaptureNodeType": "ai-audio"})

    def test_invalid_json_is_rejected(self):
        response = self.service.handle_post(None, "/api/v2/user/presets/settings", b"{not json")
        self.assertEqual(response["kind"], "json_err")
        self.assertEqual(response["code"], 400)
        self.assertFalse(os.path.exists(self.settings_path()))

    def test_a_non_object_payload_is_rejected(self):
        response = self.service.handle_post(None, "/api/v2/user/presets/settings", b'"ai-text"')
        self.assertEqual(response["kind"], "json_err")
        self.assertEqual(response["code"], 400)

    def test_a_corrupt_settings_file_degrades_to_the_empty_default(self):
        os.makedirs(os.path.dirname(self.settings_path()), exist_ok=True)
        with open(self.settings_path(), "w", encoding="utf-8") as file:
            file.write("{ truncated")
        response = self.service.handle_get(None, "/api/v2/user/presets/settings")
        self.assertEqual(response, {"kind": "json_ok", "data": {"defaultQuickCaptureNodeType": ""}})

    def test_the_settings_file_never_leaks_into_the_preset_catalog(self):
        self.service.handle_post(
            None,
            "/api/v2/user/presets/settings",
            json.dumps({"defaultQuickCaptureNodeType": "ai-text"}),
        )
        catalog = self.service.handle_get(None, "/api/v2/user/presets")
        self.assertEqual(catalog["kind"], "json_ok")
        self.assertNotIn("settings.json", catalog["data"])

    def test_unrelated_paths_still_fall_through(self):
        self.assertIsNone(self.service.handle_get(None, "/api/v2/user/presets/unknown"))
        self.assertIsNone(self.service.handle_post(None, "/api/v2/user/presets/unknown", b"{}"))


if __name__ == "__main__":
    unittest.main()
