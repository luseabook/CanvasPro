"""后台下发门禁清单（client-config.subscription_gates）的远程优先行为。

对应 FR-2.3：套餐↔模型映射由后台统一维护，前后端不再各抄一份。
本地 subscriptionGateManifest.json 只在拿不到远端时兜底。
"""
import unittest

from backend.services.subscription_gate_manifest import (
    clear_remote_subscription_gates,
    get_remote_subscription_gates,
    has_remote_subscription_gates,
    normalize_subscription_gate_model_id,
    set_remote_subscription_gates,
    SUBSCRIPTION_GATE_MANIFESTS,
)

LOCAL_WORKFLOW_ID = "2041741496667348994"
LOCAL_MODEL_ID = f"runninghub/{LOCAL_WORKFLOW_ID}"

REMOTE_GATES = [
    {"key": "video_edit_v54", "label": "视频编辑 V5.4", "modelId": LOCAL_MODEL_ID,
     "aliases": ["video_edit.pro", LOCAL_WORKFLOW_ID], "providers": ["runninghub"],
     "modelPrefixes": []},
]


class RemoteGateTests(unittest.TestCase):
    def setUp(self):
        clear_remote_subscription_gates()

    def tearDown(self):
        clear_remote_subscription_gates()

    def test_local_manifest_is_the_fallback_when_remote_is_absent(self):
        self.assertFalse(has_remote_subscription_gates())
        self.assertEqual(normalize_subscription_gate_model_id(LOCAL_WORKFLOW_ID),
                         LOCAL_MODEL_ID)

    def test_remote_gates_take_over_alias_resolution(self):
        set_remote_subscription_gates(REMOTE_GATES)
        self.assertTrue(has_remote_subscription_gates())
        self.assertEqual(normalize_subscription_gate_model_id("video_edit.pro"),
                         LOCAL_MODEL_ID)
        self.assertEqual(normalize_subscription_gate_model_id(LOCAL_WORKFLOW_ID),
                         LOCAL_MODEL_ID)

    def test_remote_gate_key_resolves_to_its_model(self):
        set_remote_subscription_gates(REMOTE_GATES)
        self.assertEqual(normalize_subscription_gate_model_id("video_edit_v54"),
                         LOCAL_MODEL_ID)

    def test_deleting_a_gate_remotely_actually_deletes_it(self):
        """远端是权威来源：清单里没有的模型必须原样放行，不能回落到本地清单命中。"""
        set_remote_subscription_gates([
            {"key": "other", "label": "其他", "modelId": "runninghub/999",
             "aliases": [], "providers": [], "modelPrefixes": []},
        ])
        self.assertEqual(normalize_subscription_gate_model_id(LOCAL_WORKFLOW_ID),
                         LOCAL_WORKFLOW_ID)

    def test_remote_prefix_rules_are_applied(self):
        set_remote_subscription_gates([
            {"key": "scail", "label": "Scail", "modelId": "runninghub/555",
             "aliases": [], "providers": [], "modelPrefixes": ["scail/"]},
        ])
        self.assertEqual(normalize_subscription_gate_model_id("scail/v2"),
                         "runninghub/555")

    def test_clearing_restores_the_local_fallback(self):
        set_remote_subscription_gates(REMOTE_GATES)
        clear_remote_subscription_gates()
        self.assertFalse(has_remote_subscription_gates())
        self.assertEqual(normalize_subscription_gate_model_id(LOCAL_WORKFLOW_ID),
                         LOCAL_MODEL_ID)

    def test_empty_remote_list_is_treated_as_unset(self):
        set_remote_subscription_gates(REMOTE_GATES)
        set_remote_subscription_gates([])
        self.assertFalse(has_remote_subscription_gates())
        self.assertEqual(normalize_subscription_gate_model_id(LOCAL_WORKFLOW_ID),
                         LOCAL_MODEL_ID)

    def test_malformed_remote_entries_are_ignored(self):
        set_remote_subscription_gates([None, "x", {}, {"key": "no-model"}])
        self.assertFalse(has_remote_subscription_gates())
        self.assertEqual(normalize_subscription_gate_model_id(LOCAL_WORKFLOW_ID),
                         LOCAL_MODEL_ID)

    def test_get_remote_subscription_gates_returns_a_copy(self):
        set_remote_subscription_gates(REMOTE_GATES)
        snapshot = get_remote_subscription_gates()
        for item in snapshot:
            item["modelId"] = "tampered"
        self.assertTrue(has_remote_subscription_gates())
        self.assertEqual(normalize_subscription_gate_model_id("video_edit_v54"),
                         LOCAL_MODEL_ID, "调用方改动返回值不应影响内部状态")

    def test_empty_input_returns_empty_string(self):
        self.assertEqual(normalize_subscription_gate_model_id(""), "")
        set_remote_subscription_gates(REMOTE_GATES)
        self.assertEqual(normalize_subscription_gate_model_id(""), "")

    def test_unknown_model_passes_through_when_remote_is_active(self):
        set_remote_subscription_gates(REMOTE_GATES)
        self.assertEqual(normalize_subscription_gate_model_id("dreamina/1"),
                         "dreamina/1")

    def test_local_manifest_is_still_populated_for_offline_use(self):
        """本地清单必须还在：断网启动时的兜底依赖它。"""
        self.assertTrue(len(SUBSCRIPTION_GATE_MANIFESTS) > 0)


if __name__ == "__main__":
    unittest.main()
