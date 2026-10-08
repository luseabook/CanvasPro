"""``/api/v2/proxy/image`` 的 task_id 快速探测边界回归测试。

背景：该路由对「提交任务类」端点做 task_id 快速探测，好让前端立刻拿到任务号开始轮询。
但 Agnes 的 ``/v1/images/generations`` 是**同步**接口，响应里同时带 ``data[].url`` 和顶层
``task_id``；一旦命中探测分支，真正的图片地址会被丢弃，前端只能收到
``{"task_id": ..., "status": "submitted", "source": "body-probe"}``，随后报
「无法从服务器响应中提取图片地址」。

而 APIMart 用的是**同一个路径** ``/v1/images/generations``，却是异步的，必须保留探测。
所以豁免只能按域名判定——本文件把这条边界钉死：
Agnes 两条线路的同步图像端点透传原始响应，其它主机行为不变。

沿用 ``test_server_proxy_url_guard.py`` 的「直接驱动 Handler」风格。
出站 URL 校验依赖 DNS，这里用 ``patch.object`` 关掉它：SSRF 边界由
``test_server_proxy_url_guard.py`` / ``test_ssrf_adversarial_qa.py`` 单独覆盖，
本文件只关心探测分支本身。
"""

import io
import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import server


AGNES_IMAGE_BODY = {
    "data": [
        {
            "url": "https://cos-platform-outputs.agnes-ai.cn/outputs/output_abc.png",
            "revised_prompt": "a red cube",
        }
    ],
    "created": 1791450831,
    "task_id": "task_CF2Cw9u9bmKlMlqNJ4TOlcYmsyTeJzh0",
}

APIMART_SUBMIT_BODY = {"task_id": "task_apimart_1", "status": "queued"}


class _FakeStreamingResponse:
    """requests.post(..., stream=True) 的假响应。"""

    def __init__(self, payload, status_code=200, headers=None):
        self._payload = payload if isinstance(payload, bytes) else str(payload).encode("utf-8")
        self.status_code = status_code
        self.headers = dict(headers or {})
        self.closed = False

    def iter_content(self, chunk_size=4096):
        for start in range(0, len(self._payload), chunk_size):
            yield self._payload[start : start + chunk_size]

    def close(self):
        self.closed = True


class _HandlerHarness:
    """驱动 server.Handler.do_POST("/api/v2/proxy/image") 的最小夹具。"""

    def __init__(self, api_url, api_key="secret"):
        handler = object.__new__(server.Handler)
        handler.path = "/api/v2/proxy/image"
        handler.headers = {"Content-Type": "application/json"}
        handler.client_address = ("127.0.0.1", 45678)
        handler.server = SimpleNamespace(server_address=("0.0.0.0", server.PORT))
        handler.rfile = io.BytesIO(b"")
        handler.close_connection = False
        self.status_codes = []
        self.body = b""

        def _send_response(code, message=None):
            self.status_codes.append(int(code))

        def _write(data):
            payload = bytes(data)
            self.body += payload
            return len(payload)

        handler.send_response = _send_response
        handler.send_header = lambda *args, **kwargs: None
        handler.end_headers = lambda: None
        handler.wfile = SimpleNamespace(write=_write, flush=lambda: None)
        self.handler = handler
        self._raw_body = json.dumps(
            {"apiUrl": api_url, "apiKey": api_key, "model": "demo", "prompt": "a red cube"}
        ).encode("utf-8")

    def run(self, response):
        with patch.object(server, "LOCAL_ACCESS_TOKEN", ""), patch.object(
            server, "_read_body", lambda handler, *args, **kwargs: self._raw_body
        ), patch.object(
            server, "unsafe_remote_url_reason", lambda url: ""
        ), patch(
            "requests.post", return_value=response
        ) as m_post:
            server.Handler.do_POST(self.handler)
        return self.status_codes, m_post


class ProxyImageTaskProbeTest(unittest.TestCase):
    def test_agnes_domestic_sync_image_response_is_passed_through(self):
        """国内线路：必须把 data[].url 原样交给前端，不能截成 body-probe。"""
        response = _FakeStreamingResponse(json.dumps(AGNES_IMAGE_BODY))
        harness = _HandlerHarness("https://api.agnes-ai.cn/v1/images/generations")
        codes, m_post = harness.run(response)
        self.assertEqual(codes, [200])
        self.assertEqual(m_post.call_count, 1)
        payload = json.loads(harness.body.decode("utf-8"))
        self.assertEqual(
            payload["data"][0]["url"],
            "https://cos-platform-outputs.agnes-ai.cn/outputs/output_abc.png",
        )
        self.assertNotEqual(payload.get("source"), "body-probe")

    def test_agnes_international_sync_image_response_is_passed_through(self):
        response = _FakeStreamingResponse(json.dumps(AGNES_IMAGE_BODY))
        harness = _HandlerHarness("https://apihub.agnes-ai.com/v1/images/generations")
        codes, _m_post = harness.run(response)
        self.assertEqual(codes, [200])
        payload = json.loads(harness.body.decode("utf-8"))
        self.assertEqual(payload["task_id"], AGNES_IMAGE_BODY["task_id"])
        self.assertIn("data", payload)

    def test_agnes_edits_endpoint_is_also_passed_through(self):
        response = _FakeStreamingResponse(json.dumps(AGNES_IMAGE_BODY))
        harness = _HandlerHarness("https://api.agnes-ai.cn/v1/images/edits")
        codes, _m_post = harness.run(response)
        self.assertEqual(codes, [200])
        self.assertIn("data", json.loads(harness.body.decode("utf-8")))

    def test_apimart_async_submit_still_short_circuits(self):
        """同一路径但异步的厂商必须保留快速探测，否则前端拿不到任务号。"""
        response = _FakeStreamingResponse(json.dumps(APIMART_SUBMIT_BODY))
        harness = _HandlerHarness("https://api.apimart.ai/v1/images/generations")
        codes, _m_post = harness.run(response)
        self.assertEqual(codes, [200])
        self.assertEqual(
            json.loads(harness.body.decode("utf-8")),
            {
                "task_id": "task_apimart_1",
                "status": "submitted",
                "source": "body-probe",
            },
        )

    def test_public_ip_host_keeps_short_circuit(self):
        """豁免按域名判定：别的公网主机同样是该路径时行为不变。"""
        response = _FakeStreamingResponse(json.dumps(APIMART_SUBMIT_BODY))
        harness = _HandlerHarness("https://93.184.216.34/v1/images/generations")
        codes, _m_post = harness.run(response)
        self.assertEqual(codes, [200])
        self.assertEqual(
            json.loads(harness.body.decode("utf-8")).get("source"), "body-probe"
        )

if __name__ == "__main__":
    unittest.main()
