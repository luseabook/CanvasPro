"""后台运营内容网关的行为契约。

重点锁住三件事：
1. 网络异常必须静默降级（离线时不能把错误抛给界面）；
2. 只读结果走缓存，写操作绝不缓存；
3. 远端脏数据必须被裁剪，不能顺着网关漏到渲染层。
"""
import unittest

from backend.services.admin_content_gateway import AdminContentGateway


class _Recorder:
    """替代 SubscriptionRemoteClient._request_json，记录调用并可按需抛错。"""

    def __init__(self, responses=None, error=None):
        self.calls = []
        self._responses = responses or {}
        self._error = error

    def __call__(self, method, path, payload=None, query=None):
        self.calls.append({"method": method, "path": path, "payload": payload,
                           "query": query})
        if self._error:
            raise self._error
        return self._responses.get(path)


class GatewayReadTests(unittest.TestCase):
    def test_announcements_returns_only_known_fields(self):
        recorder = _Recorder({"/api/announcements": {"items": [
            {"id": 1, "title": "维护通知", "body": "今晚 22:00", "level": "warning",
             "display": "banner", "pinned": True, "publishedAt": "2026-10-09T00:00:00Z",
             "unknownField": "x"},
            "not-a-dict",
        ]}})
        gateway = AdminContentGateway(recorder)
        items = gateway.announcements()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["title"], "维护通知")
        self.assertTrue(items[0]["pinned"])
        self.assertNotIn("unknownField", items[0])
        self.assertEqual(recorder.calls[0]["method"], "GET")

    def test_reads_are_cached_until_ttl_expires(self):
        recorder = _Recorder({"/api/promotions": {"items": [{"key": "a", "url": "https://x.cn"}]}})
        now = [0.0]
        gateway = AdminContentGateway(recorder, cache_ttl_seconds=60, now_fn=lambda: now[0])
        self.assertEqual(len(gateway.promotions()), 1)
        self.assertEqual(len(gateway.promotions()), 1)
        self.assertEqual(len(recorder.calls), 1, "TTL 内应命中缓存")
        now[0] = 61.0
        gateway.promotions()
        self.assertEqual(len(recorder.calls), 2, "过期后应重新拉取")

    def test_different_query_parameters_are_cached_separately(self):
        recorder = _Recorder({"/api/catalog": {"items": []}})
        gateway = AdminContentGateway(recorder)
        gateway.catalog(kind="model")
        gateway.catalog(kind="pricing")
        gateway.catalog(kind="model")
        self.assertEqual(len(recorder.calls), 2)
        self.assertEqual(recorder.calls[0]["query"], {"kind": "model"})

    def test_network_failure_degrades_to_empty_list(self):
        gateway = AdminContentGateway(_Recorder(error=OSError("离线")))
        self.assertEqual(gateway.announcements(), [])
        self.assertEqual(gateway.catalog(), [])
        self.assertEqual(gateway.promotions(), [])
        self.assertEqual(gateway.gates(), [])

    def test_malformed_payloads_degrade_to_empty_list(self):
        for payload in (None, [], "x", {"items": "nope"}, {}):
            gateway = AdminContentGateway(_Recorder({"/api/promotions": payload}))
            self.assertEqual(gateway.promotions(), [])

    def test_gates_pass_through_structured_fields(self):
        recorder = _Recorder({"/api/subscription/gates": {"items": [
            {"key": "scail_v2", "label": "Scail V2", "modelId": "runninghub/1",
             "aliases": ["s2"], "providers": ["runninghub"], "modelPrefixes": []},
        ]}})
        gateway = AdminContentGateway(recorder)
        gates = gateway.gates()
        self.assertEqual(gates[0]["aliases"], ["s2"])
        self.assertEqual(gates[0]["modelId"], "runninghub/1")

    def test_non_https_urls_are_dropped(self):
        recorder = _Recorder({"/api/promotions": {"items": [
            {"key": "a", "url": "javascript:alert(1)"},
            {"key": "b", "url": "https://ok.example.com"},
        ]}})
        gateway = AdminContentGateway(recorder)
        items = gateway.promotions()
        self.assertEqual(items[0]["url"], "")
        self.assertEqual(items[1]["url"], "https://ok.example.com")

    def test_free_form_payload_is_clipped(self):
        recorder = _Recorder({"/api/catalog": {"items": [
            {"kind": "model", "key": "m", "title": "M",
             "payload": {"blob": "x" * 5000, "nested": {"deep": "y" * 5000}}},
        ]}})
        gateway = AdminContentGateway(recorder)
        payload = gateway.catalog()[0]["payload"]
        self.assertTrue(len(payload["blob"]) <= 512)
        self.assertTrue(len(payload["nested"]["deep"]) <= 512)

    def test_invalidate_clears_the_cache(self):
        recorder = _Recorder({"/api/promotions": {"items": []}})
        gateway = AdminContentGateway(recorder)
        gateway.promotions()
        gateway.invalidate()
        gateway.promotions()
        self.assertEqual(len(recorder.calls), 2)


class GatewayUpdateCheckTests(unittest.TestCase):
    def test_update_payload_is_normalized(self):
        recorder = _Recorder({"/api/app-version/latest": {
            "hasUpdate": True, "channel": "stable", "version": "0.4.13",
            "notes": "修了若干问题", "downloadUrl": "https://x.cn/a.exe",
            "manifestUrl": "https://x.cn/latest.json", "forced": True,
            "minSupportedVersion": "0.4.0", "extra": 1,
        }})
        gateway = AdminContentGateway(recorder)
        result = gateway.app_version(current_version="0.4.12", install_id="inst-1")
        self.assertTrue(result["hasUpdate"])
        self.assertEqual(result["version"], "0.4.13")
        self.assertTrue(result["forced"])
        self.assertNotIn("extra", result)
        self.assertEqual(recorder.calls[0]["query"]["installId"], "inst-1")

    def test_update_check_is_never_cached(self):
        recorder = _Recorder({"/api/app-version/latest": {"hasUpdate": False}})
        gateway = AdminContentGateway(recorder)
        gateway.app_version()
        gateway.app_version()
        self.assertEqual(len(recorder.calls), 2, "版本号变了必须立刻反映，不能读缓存")

    def test_update_failure_returns_empty_result(self):
        gateway = AdminContentGateway(_Recorder(error=OSError("离线")))
        self.assertEqual(gateway.app_version(), {})


class GatewayWriteTests(unittest.TestCase):
    def test_feedback_is_posted_and_not_cached(self):
        recorder = _Recorder({"/api/feedback": {"ok": True, "ticketId": 7}})
        gateway = AdminContentGateway(recorder)
        self.assertEqual(gateway.submit_feedback(install_id="i", content="登不上"),
                         {"ok": True, "ticketId": 7})
        gateway.submit_feedback(install_id="i", content="登不上")
        self.assertEqual(len(recorder.calls), 2, "写操作不能命中缓存")
        self.assertEqual(recorder.calls[0]["method"], "POST")
        self.assertEqual(recorder.calls[0]["payload"]["content"], "登不上")

    def test_coupon_redemption_forwards_code_and_plan(self):
        recorder = _Recorder({"/api/coupon/redeem": {"ok": True, "bonusDays": 30}})
        gateway = AdminContentGateway(recorder)
        self.assertEqual(gateway.redeem_coupon(code="ABC123", plan="pro"),
                         {"ok": True, "bonusDays": 30})
        self.assertEqual(recorder.calls[0]["payload"]["code"], "ABC123")

    def test_event_report_includes_optional_detail(self):
        recorder = _Recorder({"/api/events": {"ok": True}})
        gateway = AdminContentGateway(recorder)
        gateway.report_event(install_id="i", event="startup", detail={"k": "v"})
        self.assertEqual(recorder.calls[0]["payload"]["detail"], {"k": "v"})
        gateway.report_event(install_id="i", event="startup")
        self.assertNotIn("detail", recorder.calls[1]["payload"])

    def test_write_failures_are_reported_not_swallowed(self):
        gateway = AdminContentGateway(_Recorder(error=OSError("离线")))
        self.assertEqual(gateway.submit_feedback(content="x"),
                         {"ok": False, "error": "NETWORK_ERROR"})
        self.assertEqual(gateway.redeem_coupon(code="A"),
                         {"ok": False, "error": "NETWORK_ERROR"})
        self.assertEqual(gateway.report_event(event="x"),
                         {"ok": False, "error": "NETWORK_ERROR"})

    def test_non_dict_response_is_reported_as_bad(self):
        gateway = AdminContentGateway(_Recorder({"/api/feedback": "nope"}))
        self.assertEqual(gateway.submit_feedback(content="x"),
                         {"ok": False, "error": "BAD_RESPONSE"})

    def test_oversized_input_is_truncated(self):
        recorder = _Recorder({"/api/feedback": {"ok": True}})
        gateway = AdminContentGateway(recorder)
        gateway.submit_feedback(content="x" * 9000, install_id="i" * 500)
        payload = recorder.calls[0]["payload"]
        self.assertTrue(len(payload["content"]) <= 4000)
        self.assertTrue(len(payload["installId"]) <= 128)


if __name__ == "__main__":
    unittest.main()
