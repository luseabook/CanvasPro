import json
import threading
from collections import OrderedDict
from pathlib import Path


_SUBSCRIPTION_GATE_MANIFEST_PATH = (
    Path(__file__).resolve().parents[2]
    / "src"
    / "manifests"
    / "subscription"
    / "subscriptionGateManifest.json"
)


def _runninghub_model_id(workflow_id):
    value = str(workflow_id or "").strip()
    return f"runninghub/{value}" if value else ""


def _string_tuple(value, *, lowercase=False):
    if not isinstance(value, (list, tuple)):
        return ()
    out = []
    for item in value:
        text = str(item or "").strip()
        if lowercase:
            text = text.lower()
        if text:
            out.append(text)
    return tuple(out)


def _legacy_alias_tuple(value, index):
    if not isinstance(value, (list, tuple)):
        return ()
    out = []
    for alias_index, item in enumerate(value, start=1):
        if not isinstance(item, dict):
            raise ValueError(
                f"subscription gate entry #{index} legacyAlias #{alias_index} must be an object"
            )
        alias_value = str(item.get("value") or "").strip()
        delete_when = str(item.get("deleteWhen") or "").strip()
        if not alias_value or not delete_when:
            raise ValueError(
                f"subscription gate entry #{index} legacyAlias #{alias_index} missing value or deleteWhen"
            )
        out.append({"value": alias_value, "deleteWhen": delete_when})
    return tuple(out)


def _load_subscription_gate_document():
    with _SUBSCRIPTION_GATE_MANIFEST_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, dict):
        raise ValueError("subscription gate manifest must be a JSON object")
    if str(data.get("schemaVersion") or "").strip() != "1.0":
        raise ValueError("unsupported subscription gate manifest schemaVersion")
    return data


def _normalize_gate_entry(item, index):
    if not isinstance(item, dict):
        raise ValueError(f"subscription gate entry #{index} must be an object")
    model_id = str(item.get("modelId") or "").strip()
    if not model_id:
        raise ValueError(f"subscription gate entry #{index} missing modelId")
    return {
        "key": str(item.get("key") or "").strip(),
        "modelId": model_id,
        "workflowId": str(item.get("workflowId") or "").strip(),
        "displayName": str(item.get("displayName") or "").strip() or model_id,
        "aliases": _string_tuple(item.get("aliases")),
        "legacyAliases": _legacy_alias_tuple(item.get("legacyAliases"), index),
        "providers": _string_tuple(item.get("providers"), lowercase=True),
        "modelPrefixes": _string_tuple(item.get("modelPrefixes")),
    }


def _load_subscription_gate_manifests():
    data = _load_subscription_gate_document()
    raw_gates = data.get("gates")
    if not isinstance(raw_gates, list):
        raise ValueError("subscription gate manifest gates must be an array")
    manifests = tuple(
        _normalize_gate_entry(item, index)
        for index, item in enumerate(raw_gates, start=1)
    )
    if not manifests:
        raise ValueError("subscription gate manifest gates must not be empty")
    return manifests


def _load_canonical_excludes():
    data = _load_subscription_gate_document()
    return frozenset(_string_tuple(data.get("canonicalExcludes")))


SUBSCRIPTION_GATE_MANIFESTS = _load_subscription_gate_manifests()
SUBSCRIPTION_GATE_CANONICAL_EXCLUDES = _load_canonical_excludes()


def get_subscription_gate_manifest_path():
    return str(_SUBSCRIPTION_GATE_MANIFEST_PATH)


def iter_subscription_gate_manifests():
    return tuple(dict(item) for item in SUBSCRIPTION_GATE_MANIFESTS)


def get_subscription_gate_model_ids():
    return tuple(
        str(item.get("modelId") or "").strip()
        for item in SUBSCRIPTION_GATE_MANIFESTS
        if str(item.get("modelId") or "").strip()
    )


def get_subscription_gate_model_id_by_key(key):
    target_key = str(key or "").strip()
    if not target_key:
        return ""
    for item in SUBSCRIPTION_GATE_MANIFESTS:
        if str(item.get("key") or "").strip() == target_key:
            return str(item.get("modelId") or "").strip()
    raise KeyError(f"Missing subscription gate manifest entry: {target_key}")


def get_subscription_gate_model_name_map():
    return {
        str(item.get("modelId") or "").strip(): str(item.get("displayName") or "").strip()
        for item in SUBSCRIPTION_GATE_MANIFESTS
        if str(item.get("modelId") or "").strip()
    }


def get_runninghub_subscription_workflow_ids():
    return {
        str(item.get("workflowId") or "").strip()
        for item in SUBSCRIPTION_GATE_MANIFESTS
        if str(item.get("modelId") or "").strip().startswith("runninghub/")
        and str(item.get("workflowId") or "").strip()
    }


def _build_alias_map():
    aliases = {}
    for item in SUBSCRIPTION_GATE_MANIFESTS:
        model_id = str(item.get("modelId") or "").strip()
        if not model_id:
            continue
        aliases[model_id] = model_id
        workflow_id = str(item.get("workflowId") or "").strip()
        if workflow_id:
            aliases[_runninghub_model_id(workflow_id)] = model_id
        for alias in item.get("aliases") or ():
            alias_text = str(alias or "").strip()
            if alias_text:
                aliases[alias_text] = model_id
        for alias in item.get("legacyAliases") or ():
            alias_text = str(alias.get("value") or "").strip()
            if alias_text:
                aliases[alias_text] = model_id
    return aliases


def _build_prefix_rules():
    rules = []
    for item in SUBSCRIPTION_GATE_MANIFESTS:
        model_id = str(item.get("modelId") or "").strip()
        if not model_id:
            continue
        for prefix in item.get("modelPrefixes") or ():
            prefix_text = str(prefix or "").strip()
            if prefix_text:
                rules.append((prefix_text, model_id))
    return tuple(rules)


_SUBSCRIPTION_GATE_ALIAS_MAP = _build_alias_map()
_SUBSCRIPTION_GATE_PREFIX_RULES = _build_prefix_rules()


# ---------------------------------------------------------------------------
# 后台下发的门禁清单（client-config 的 subscription_gates）
#
# 目的：消除「前端 subscriptionAccess.js 与后端 manifest 各抄一份」的双份维护。
# 后台改了门禁之后，客户端以远端清单为准；本地 manifest 退化为**离线兜底**——
# 拿不到远端（首次启动、断网、后台未配）时行为与今天完全一致。
# ---------------------------------------------------------------------------
_REMOTE_GATE_LOCK = threading.Lock()
_REMOTE_GATES: tuple = ()
_REMOTE_ALIAS_MAP: dict = {}
_REMOTE_PREFIX_RULES: tuple = ()


def _build_remote_maps(gates):
    aliases = {}
    rules = []
    for item in gates:
        if not isinstance(item, dict):
            continue
        model_id = str(item.get("modelId") or "").strip()
        key = str(item.get("key") or "").strip()
        if not model_id:
            continue
        aliases[model_id] = model_id
        for alias in item.get("aliases") or ():
            text = str(alias or "").strip()
            if text:
                aliases[text] = model_id
        if key:
            aliases[key] = model_id
        for prefix in item.get("modelPrefixes") or ():
            text = str(prefix or "").strip()
            if text:
                rules.append((text, model_id))
    return aliases, tuple(rules)


def set_remote_subscription_gates(gates):
    """用后台下发的门禁清单覆盖解析规则。传空列表/None 表示「回到本地兜底」。

    只接受**已经清洗过**的数据（见 subscription_client._normalize_subscription_gates），
    这里不再做一次校验——重复校验会掩盖上游的清洗缺口。
    """
    global _REMOTE_GATES, _REMOTE_ALIAS_MAP, _REMOTE_PREFIX_RULES
    # 没有 modelId 的条目无法参与门禁判定，留着只会让「后台配了」变成假阳性。
    cleaned = tuple(
        item for item in (gates or ())
        if isinstance(item, dict) and str(item.get("modelId") or "").strip()
    )
    with _REMOTE_GATE_LOCK:
        _REMOTE_GATES = cleaned
        if cleaned:
            _REMOTE_ALIAS_MAP, _REMOTE_PREFIX_RULES = _build_remote_maps(cleaned)
        else:
            _REMOTE_ALIAS_MAP, _REMOTE_PREFIX_RULES = {}, ()
        # 别名解析结果会随门禁清单变化，缓存必须一起失效
        _REMOTE_NORMALIZE_CACHE.clear()


def get_remote_subscription_gates():
    with _REMOTE_GATE_LOCK:
        return tuple(dict(item) for item in _REMOTE_GATES)


def has_remote_subscription_gates():
    with _REMOTE_GATE_LOCK:
        return bool(_REMOTE_GATES)


def clear_remote_subscription_gates():
    set_remote_subscription_gates(())


_REMOTE_NORMALIZE_CACHE_MAX = 4096
_REMOTE_NORMALIZE_CACHE: "OrderedDict[str, str]" = OrderedDict()


def normalize_subscription_gate_model_id(value):
    model_id = str(value or "").strip()
    if not model_id:
        return ""
    if model_id in SUBSCRIPTION_GATE_CANONICAL_EXCLUDES:
        return model_id
    with _REMOTE_GATE_LOCK:
        remote_alias = _REMOTE_ALIAS_MAP.get(model_id)
        remote_rules = _REMOTE_PREFIX_RULES
        remote_active = bool(_REMOTE_GATES)
    if remote_active:
        if remote_alias:
            return remote_alias
        for prefix, target_model_id in remote_rules:
            if model_id.startswith(prefix):
                return target_model_id
        # 远端清单是权威来源：没匹配上就按原样放行，不再回落到本地清单。
        # 否则后台「删掉一条门禁」在客户端会删不掉（本地清单仍在）。
        return model_id
    cached = _REMOTE_NORMALIZE_CACHE.get(model_id)
    if cached is not None:
        _REMOTE_NORMALIZE_CACHE.move_to_end(model_id)
        return cached
    mapped = _SUBSCRIPTION_GATE_ALIAS_MAP.get(model_id)
    if mapped:
        result = mapped
    else:
        result = model_id
        for prefix, target_model_id in _SUBSCRIPTION_GATE_PREFIX_RULES:
            if model_id.startswith(prefix):
                result = target_model_id
                break
    _REMOTE_NORMALIZE_CACHE[model_id] = result
    if len(_REMOTE_NORMALIZE_CACHE) > _REMOTE_NORMALIZE_CACHE_MAX:
        _REMOTE_NORMALIZE_CACHE.popitem(last=False)
    return result
