"""后台结构化客户端配置的清洗与下发。

对应 canvas-admin 的 client_config_service.STRUCTURED_KEYS。客户端必须认得这些命名空间，
否则「后台改了、客户端没反应」——这是本套用例要锁住的行为。
"""
import copy
import tempfile
import unittest
from pathlib import Path

from backend.services.subscription_client import (
    DEFAULT_STRUCTURED_CONFIG,
    STRUCTURED_CONFIG_KEYS,
    SubscriptionRemoteClient,
    normalize_structured_config,
)


class StructuredConfigNormalizationTests(unittest.TestCase):
    def test_unknown_namespaces_are_dropped(self):
        out = normalize_structured_config({"bogus": {"x": 1}, "brand": {"author": "A"}})
        self.assertNotIn("bogus", out)
        self.assertEqual(out["brand"]["author"], "A")

    def test_non_https_urls_are_dropped(self):
        out = normalize_structured_config({
            "brand": {"logoUrl": "javascript:alert(1)", "feedbackQrUrl": "https://x.cn/q.png"},
        })
        self.assertEqual(out["brand"]["logoUrl"], "")
        self.assertEqual(out["brand"]["feedbackQrUrl"], "https://x.cn/q.png")

    def test_about_links_keep_only_valid_entries(self):
        out = normalize_structured_config({
            "brand": {"aboutLinks": [
                {"label": "Bilibili", "url": "https://space.bilibili.com/1"},
                {"label": "坏链", "url": "javascript:alert(1)"},
                "not-a-dict",
            ]},
        })
        self.assertEqual(len(out["brand"]["aboutLinks"]), 1)
        self.assertEqual(out["brand"]["aboutLinks"][0]["label"], "Bilibili")

    def test_contact_locales_are_cleaned(self):
        out = normalize_structured_config({
            "contact": {"wechat": "canvas_support",
                        "locales": {"en-US": {"text": "Contact us"}, "bad": 5}},
        })
        self.assertEqual(out["contact"]["wechat"], "canvas_support")
        self.assertEqual(out["contact"]["locales"], {"en-US": {"text": "Contact us",
                                                               "wechat": "", "url": ""}})

    def test_subscription_gates_deduplicate_and_drop_invalid(self):
        out = normalize_structured_config({
            "subscription_gates": [
                {"key": "g1", "modelId": "m/1", "aliases": ["a", "", 5], "providers": ["p"]},
                {"key": "g1"},
                {"modelId": "no-key"},
                "not-a-dict",
            ],
        })
        gates = out["subscription_gates"]
        self.assertEqual(len(gates), 1)
        self.assertEqual(gates[0]["key"], "g1")
        self.assertEqual(gates[0]["aliases"], ["a"])

    def test_expiry_reminder_clamps_days(self):
        out = normalize_structured_config({
            "expiry_reminder": {"enabled": True, "days": [3, 7, 999, "x"], "message": "快到期"},
        })
        self.assertEqual(out["expiry_reminder"]["days"], [7, 3])
        self.assertEqual(out["expiry_reminder"]["message"], "快到期")

    def test_expiry_reminder_empty_days_is_treated_as_unset(self):
        """days 为空数组时不产出该字段 —— 由默认值的 [7,3,1] 兜底，而不是变成「不提醒」。"""
        out = normalize_structured_config({"expiry_reminder": {"days": []}})
        self.assertNotIn("expiry_reminder", out)

    def test_feature_flags_coerce_to_bool(self):
        out = normalize_structured_config({"feature_flags": {"a": 1, "b": 0, "c": "yes"}})
        self.assertEqual(out["feature_flags"], {"a": True, "b": False, "c": True})

    def test_system_params_preserve_scalars_and_clean_strings(self):
        out = normalize_structured_config({"system_params": {"n": 3, "f": 1.5, "b": True,
                                                             "s": "  x  "}})
        self.assertEqual(out["system_params"], {"n": 3, "f": 1.5, "b": True, "s": "x"})

    def test_telemetry_sample_rate_is_clamped(self):
        out = normalize_structured_config({"telemetry": {"enabled": True, "sampleRate": 9}})
        self.assertEqual(out["telemetry"]["sampleRate"], 1.0)
        out = normalize_structured_config({"telemetry": {"sampleRate": -1}})
        self.assertEqual(out["telemetry"]["sampleRate"], 0.0)

    def test_content_sources_are_cleaned(self):
        out = normalize_structured_config({
            "content_sources": {"tutorialOrigin": "https://api.1e1e.cn",
                                "releaseNotesRepo": "luseaer/CanvasPro"},
        })
        self.assertEqual(out["content_sources"]["tutorialOrigin"], "https://api.1e1e.cn")
        self.assertEqual(out["content_sources"]["releaseNotesRepo"], "luseaer/CanvasPro")

    def test_empty_structured_value_is_treated_as_unset(self):
        """全空的结构化项不能写成空壳，否则会盖掉本地兜底（例如门禁清单）。"""
        out = normalize_structured_config({"subscription_gates": [], "brand": {}})
        self.assertEqual(out, {})

    def test_non_dict_input_returns_empty(self):
        for value in (None, [], "x", 5):
            self.assertEqual(normalize_structured_config(value), {})


def _make_client(tmp):
    return SubscriptionRemoteClient(
        api_base_url="https://api.1e1e.cn",
        timeout_seconds=5,
        status_active="active",
        err_required="SUBSCRIPTION_REQUIRED",
        required_message="请先激活",
        contact_text="联系管理员",
        contact_url="",
        contact_wechat="",
        client_config_path=str(Path(tmp) / "client-config.json"),
        local_override_path=str(Path(tmp) / "client-config.local.json"),
        status_cache_path=str(Path(tmp) / "status-cache.json"),
    )


class ClientConfigEndToEndTests(unittest.TestCase):
    """结构化配置必须真的出现在 /api/client-config 的响应里。"""

    def test_defaults_include_every_structured_namespace(self):
        with tempfile.TemporaryDirectory() as tmp:
            client = _make_client(tmp)
            config = client.get_client_config()
            for key in STRUCTURED_CONFIG_KEYS:
                self.assertIn(key, config)
            # 默认门禁清单为空：此时客户端必须用本地 manifest 兜底
            self.assertEqual(config["subscription_gates"], [])
            self.assertEqual(config["expiry_reminder"]["days"], [7, 3, 1])

    def test_remote_structured_config_reaches_client_config(self):
        with tempfile.TemporaryDirectory() as tmp:
            client = _make_client(tmp)
            client._remote_config = {
                "configVersion": 7,
                "brand": {"author": "Canvas 团队"},
                "subscription_gates": [{"key": "g1", "modelId": "m/1"}],
                "content_sources": {"tutorialOrigin": "https://api.1e1e.cn"},
            }
            config = client.get_client_config()
            self.assertEqual(config["configVersion"], 7)
            self.assertEqual(config["brand"]["author"], "Canvas 团队")
            # 未下发的命名空间保持默认形状，不会被洗成 None
            self.assertEqual(config["brand"]["aboutLinks"], [])
            self.assertEqual(len(config["subscription_gates"]), 1)
            self.assertEqual(config["subscription_gates"][0]["modelId"], "m/1")
            self.assertEqual(config["content_sources"]["tutorialOrigin"], "https://api.1e1e.cn")

    def test_defaults_object_is_not_mutated_by_normalization(self):
        before = copy.deepcopy(DEFAULT_STRUCTURED_CONFIG)
        with tempfile.TemporaryDirectory() as tmp:
            client = _make_client(tmp)
            client._remote_config = {"brand": {"author": "X"},
                                     "expiry_reminder": {"days": [1]}}
            client.get_client_config()
        self.assertEqual(DEFAULT_STRUCTURED_CONFIG, before)


if __name__ == "__main__":
    unittest.main()
