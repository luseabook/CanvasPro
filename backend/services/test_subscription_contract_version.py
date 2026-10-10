"""反向契约测试：证明 CanvasPro 客户端能消费 canvas-admin 的 /api/client-config 响应。

与 canvas-admin 侧 backend/tests/test_canvaspro_contract.py（后台响应 → CanvasPro
归一化器）方向相反，本文件构造三种后台 client-config 响应，验证客户端解析契约版本
（contractVersion）的行为：

  1) 含**受支持**版本 → 解析成功、可读到、无告警；
  2) **不含**版本（旧后台 / 老响应）→ 静默兼容，不抛错、不告警；
  3) 含**未知**版本 → 解析成功（不抛错、不阻断），并产生一条 WARNING 日志。

风格对齐 backend/services/test_*.py（unittest，供 tools/run-backend-tests.mjs 的
`unittest discover` 收集）。只从公开导出进入，不 import 私有 _STRUCTURED_NORMALIZERS。
"""
import json
import os
import re
import tempfile
import unittest
from unittest.mock import patch

from backend.services.subscription_client import (
    CONTRACT_VERSION_KEY,
    SUPPORTED_CONTRACT_VERSIONS,
    SubscriptionRemoteClient,
)

_LOG_TARGET = "backend.services.subscription_client"
# 后台契约版本所在文件（相对 canvas-admin 仓库根）。默认 sibling 目录 F:\canvas-admin，
# 允许用 CANVAS_ADMIN_ROOT 覆盖（与 tools/canvas-workspace.mjs 一致）。
_ADMIN_ROOT_ENV = "CANVAS_ADMIN_ROOT"
_ADMIN_ROOT_DEFAULT = r"F:\canvas-admin"
_ADMIN_CONTRACT_RELATIVE = ("backend", "app", "services", "client_config_service.py")


def read_admin_contract_version():
    """只读核查后台声明的 CONTRACT_VERSION；文件缺失/解析失败返回 None（表示跳过）。"""
    root = os.environ.get(_ADMIN_ROOT_ENV) or _ADMIN_ROOT_DEFAULT
    path = os.path.join(root, *_ADMIN_CONTRACT_RELATIVE)
    try:
        with open(path, "r", encoding="utf-8") as file:
            source = file.read()
    except OSError:
        return None
    matched = re.search(r"""CONTRACT_VERSION\s*=\s*["']([^"']+)["']""", source)
    return matched.group(1) if matched else None


class FakeResponse:
    """最小 urllib 响应替身：仅实现 client 读取所需的 read/context manager。"""

    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.payload


def _base_config_payload(**extra):
    """构造与后台 payload() 形状一致的 client-config 响应，可注入额外字段。"""
    payload = {
        "configVersion": 7,
        "license_domain": "https://api.example.test",
        "grace_seconds": 7200,
        "product_display_name": "Canvas",
        "update_manifest_url": "",
    }
    payload.update(extra)
    return payload


class SubscriptionContractVersionTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = self.temp_dir.name
        self.config_path = os.path.join(self.root, "client-config.json")

    def tearDown(self):
        self.temp_dir.cleanup()

    def make_client(self):
        return SubscriptionRemoteClient(
            api_base_url="https://api.example.test",
            timeout_seconds=1,
            status_active="active",
            err_required="SUBSCRIPTION_REQUIRED",
            required_message="VIP subscription required",
            contact_text="Support",
            contact_url="https://support.example.test",
            client_config_path=self.config_path,
        )

    def refresh_with(self, response_payload):
        """走完整的公开路径：模拟 /api/client-config 响应 → refresh → get_client_config。"""
        client = self.make_client()
        with patch(
            "backend.services.subscription_client.urllib.request.urlopen",
            return_value=FakeResponse(response_payload),
        ):
            config = client.refresh_client_config(force=True)
        return client, config

    def test_supported_contract_version_is_consumed_without_warning(self):
        """受支持版本：可读到契约版本，且不产生 WARNING。"""
        self.assertTrue(SUPPORTED_CONTRACT_VERSIONS, "SUPPORTED_CONTRACT_VERSIONS 不得为空")
        payload = _base_config_payload(
            **{CONTRACT_VERSION_KEY: SUPPORTED_CONTRACT_VERSIONS[0]}
        )
        with self.assertNoLogs(_LOG_TARGET, level="WARNING"):
            _client, config = self.refresh_with(payload)

        self.assertEqual(config.get(CONTRACT_VERSION_KEY), SUPPORTED_CONTRACT_VERSIONS[0])
        # 既有基础键解析不受影响。
        self.assertEqual(config["configVersion"], 7)
        self.assertEqual(config["grace_seconds"], 7200)

    def test_missing_contract_version_is_silently_compatible(self):
        """旧后台无该字段：静默兼容，不抛错、不告警。"""
        payload = _base_config_payload()
        with self.assertNoLogs(_LOG_TARGET, level="WARNING"):
            _client, config = self.refresh_with(payload)

        self.assertNotIn(CONTRACT_VERSION_KEY, config)
        self.assertEqual(config["configVersion"], 7)

    def test_unknown_contract_version_warns_but_does_not_break_authorization(self):
        """未知版本：产生 WARNING，但解析成功、不抛错、不阻断授权流程。"""
        payload = _base_config_payload(**{CONTRACT_VERSION_KEY: "9999.99"})
        with self.assertLogs(_LOG_TARGET, level="WARNING") as captured:
            _client, config = self.refresh_with(payload)

        # 不抛错、不阻断：既有配置照常解析出来。
        self.assertEqual(config["configVersion"], 7)
        self.assertEqual(config["product_display_name"], "Canvas")
        # 必须有一条 WARNING，且内容点明「超出客户端支持范围」。
        joined = "\n".join(captured.output)
        self.assertIn("超出客户端支持范围", joined)
        self.assertIn("9999.99", joined)


class SubscriptionContractVersionCrossRepoTests(unittest.TestCase):
    """跨仓一致性：后台声明的 CONTRACT_VERSION 必须落在客户端支持集合内。

    这是手册（docs/operations-runbook.md「契约变更流程 → 手动演练」）里漂移演练的
    **自动触发点**：把 canvas-admin 的 CONTRACT_VERSION 改成客户端不支持的值，本用例
    立即变红；改回即恢复绿。canvas-admin 检出缺失时 skip，对齐 admin 侧
    test_canvaspro_contract.py 的 sibling-checkout 假设。
    """

    def test_backend_declared_version_is_in_client_supported_set(self):
        version = read_admin_contract_version()
        if version is None:
            self.skipTest(
                "canvas-admin checkout is required for the cross-repository contract suite")
        self.assertIn(
            version, SUPPORTED_CONTRACT_VERSIONS,
            f"契约漂移：后台 CONTRACT_VERSION={version} 不在客户端支持集合 "
            f"{SUPPORTED_CONTRACT_VERSIONS} 内")


if __name__ == "__main__":
    unittest.main()
