"""后台运营内容网关：把 canvas-admin 的客户端面运营接口收敛到一个入口。

分管两端：
- 客户端（本进程）→ 本地 server.py 的 /api/v2/admin-content/*；
- server.py → 本网关 → 远端授权服务的 /api/announcements、/api/catalog …

设计约束（都是踩过的坑）：
1. **任何网络异常都不能冒泡到界面**。教程/公告/推广位是锦上添花的功能，
   离线或后端不可用时必须安静地返回空结果，而不是把「获取失败」弹给用户。
2. **只读结果带 TTL 缓存**。面板每次打开都打一次远端既慢又容易触发限流。
3. **写操作（工单/优惠码/事件）不缓存**，失败要如实返回，让界面能提示。
4. **远端返回的数据不可信**：统一走一遍清洗，条数与字段长度都设上限，
   避免后台配错一行超长文案就把渲染层撑爆。
"""
import logging
import threading
import time

_LOGGER = logging.getLogger(__name__)

DEFAULT_CACHE_TTL_SECONDS = 300.0
_MAX_ITEMS = 200
_MAX_TEXT = 512
_MAX_URL = 2048

_READ_PATHS = {
    "announcements": "/api/announcements",
    "catalog": "/api/catalog",
    "promotions": "/api/promotions",
    "gates": "/api/subscription/gates",
}


def _clean_text(value, max_len=_MAX_TEXT):
    if isinstance(value, bool) or not isinstance(value, (str, int, float)):
        return ""
    return str(value).strip()[:max_len]


def _clean_url(value):
    text = _clean_text(value, max_len=_MAX_URL)
    if not text:
        return ""
    if text.lower().startswith(("http://", "https://")):
        return text
    return ""


def _clean_items(data, *, keys):
    """只保留认识的字段，并限制条数。

    后台新增字段时这里会静默忽略，属于刻意为之：渲染层只消费白名单字段，
    脏数据/超长文案不会顺着网关漏到界面上。
    """
    if not isinstance(data, dict):
        return []
    raw = data.get("items")
    if not isinstance(raw, list):
        return []
    out = []
    for entry in raw[:_MAX_ITEMS]:
        if not isinstance(entry, dict):
            continue
        item = {}
        for key, kind in keys.items():
            value = entry.get(key)
            if kind == "text":
                item[key] = _clean_text(value)
            elif kind == "url":
                item[key] = _clean_url(value)
            elif kind == "bool":
                item[key] = bool(value)
            elif kind == "int":
                try:
                    item[key] = int(value)
                except (TypeError, ValueError):
                    item[key] = 0
            elif kind == "raw":
                # payload / params / aliases 这类自由结构：原样透传，但挡掉超长字符串，
                # 防止后台误填一大段文本把渲染层撑爆。
                item[key] = _clip_structure(value)
        out.append(item)
    return out


def _clip_structure(value, *, depth=0):
    """递归裁剪自由结构：字符串限长、容器限深限项数，其余标量原样保留。"""
    if depth > 4:
        return None
    if isinstance(value, str):
        return value[:_MAX_TEXT]
    if isinstance(value, bool) or isinstance(value, (int, float)):
        return value
    if isinstance(value, list):
        return [_clip_structure(item, depth=depth + 1) for item in value[:_MAX_ITEMS]]
    if isinstance(value, dict):
        out = {}
        for index, (key, item) in enumerate(value.items()):
            if index >= _MAX_ITEMS:
                break
            out[str(key)[:64]] = _clip_structure(item, depth=depth + 1)
        return out
    return None


# 字段名与 canvas-admin 的 content_service / entitlement_service 下发的字典一一对应。
# 改这里之前先改后台，两边必须同改，否则会出现「后台有数据、客户端读不到」的静默故障。
_ANNOUNCEMENT_FIELDS = {
    "id": "int", "title": "text", "body": "text", "level": "text",
    "display": "text", "pinned": "bool", "publishedAt": "text",
}
_CATALOG_FIELDS = {
    "kind": "text", "key": "text", "title": "text", "payload": "raw",
    "sortOrder": "int", "updatedAt": "text",
}
_PROMOTION_FIELDS = {
    "key": "text", "provider": "text", "title": "text", "url": "url",
    "slot": "text", "params": "raw",
}
_GATE_FIELDS = {
    "key": "text", "label": "text", "modelId": "text", "aliases": "raw",
    "providers": "raw", "modelPrefixes": "raw",
}


class AdminContentGateway:
    """远端运营内容的只读缓存 + 写入转发。

    request_json 的签名与 SubscriptionRemoteClient._request_json 一致：
    ``request_json(method, path, *, payload=None, query=None)``，失败返回 None。
    """

    def __init__(self, request_json, *, cache_ttl_seconds=DEFAULT_CACHE_TTL_SECONDS,
                 now_fn=None):
        self._request_json = request_json
        self._cache_ttl = max(0.0, float(cache_ttl_seconds or 0.0))
        self._now = now_fn if callable(now_fn) else time.monotonic
        self._lock = threading.RLock()
        self._cache = {}

    # ------------------------------------------------------------------ 内部

    def _cache_get(self, key):
        with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            expires_at, value = entry
            if self._now() >= expires_at:
                self._cache.pop(key, None)
                return None
            return value

    def _cache_put(self, key, value):
        with self._lock:
            if self._cache_ttl <= 0:
                return value
            self._cache[key] = (self._now() + self._cache_ttl, value)
            return value

    def _fetch_cached(self, name, *, query=None, fields):
        cache_key = (name, tuple(sorted((query or {}).items())))
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached
        try:
            data = self._request_json("GET", _READ_PATHS[name], query=query or None)
        except Exception as exc:
            # 离线/后端不可用时静默降级：运营内容是增强项，不该弹错误打断用户。
            _LOGGER.debug("拉取运营内容 %s 失败，本次返回空列表: %s", name, exc)
            return []
        items = _clean_items(data, keys=fields)
        return self._cache_put(cache_key, items)

    def invalidate(self):
        with self._lock:
            self._cache.clear()

    # ------------------------------------------------------------------ 只读

    def announcements(self, *, plan="", version=""):
        query = {}
        if plan:
            query["plan"] = str(plan)[:64]
        if version:
            query["version"] = str(version)[:32]
        return self._fetch_cached("announcements", query=query, fields=_ANNOUNCEMENT_FIELDS)

    def catalog(self, *, kind=""):
        query = {"kind": str(kind)[:32]} if kind else None
        return self._fetch_cached("catalog", query=query, fields=_CATALOG_FIELDS)

    def promotions(self):
        return self._fetch_cached("promotions", fields=_PROMOTION_FIELDS)

    def gates(self):
        return self._fetch_cached("gates", fields=_GATE_FIELDS)

    def app_version(self, *, current_version="", channel="stable", platform="win",
                    install_id=""):
        """更新检查不做缓存：版本号变了必须立刻反映，缓存会让灰度判断失真。"""
        query = {
            "currentVersion": str(current_version or "")[:32],
            "channel": str(channel or "stable")[:16],
            "platform": str(platform or "win")[:16],
        }
        if install_id:
            query["installId"] = str(install_id)[:128]
        try:
            data = self._request_json("GET", "/api/app-version/latest", query=query)
        except Exception as exc:
            _LOGGER.debug("更新检查失败，本次不提示更新: %s", exc)
            return {}
        if not isinstance(data, dict):
            return {}
        return {
            "hasUpdate": bool(data.get("hasUpdate")),
            "channel": _clean_text(data.get("channel"), max_len=16),
            "currentVersion": _clean_text(data.get("currentVersion"), max_len=32),
            "version": _clean_text(data.get("version"), max_len=32),
            "notes": _clean_text(data.get("notes")),
            "downloadUrl": _clean_url(data.get("downloadUrl")),
            "manifestUrl": _clean_url(data.get("manifestUrl")),
            "forced": bool(data.get("forced")),
            "minSupportedVersion": _clean_text(data.get("minSupportedVersion"), max_len=32),
        }

    # ------------------------------------------------------------------ 写入

    def _post(self, path, payload):
        try:
            data = self._request_json("POST", path, payload=payload)
        except Exception as exc:
            _LOGGER.debug("提交 %s 失败: %s", path, exc)
            return {"ok": False, "error": "NETWORK_ERROR"}
        if not isinstance(data, dict):
            return {"ok": False, "error": "BAD_RESPONSE"}
        return data

    def submit_feedback(self, *, install_id="", contact="", category="other", content=""):
        return self._post("/api/feedback", {
            "installId": str(install_id or "")[:128],
            "contact": str(contact or "")[:128],
            "category": str(category or "other")[:32],
            "content": str(content or "")[:4000],
        })

    def redeem_coupon(self, *, code="", plan="", install_id=""):
        return self._post("/api/coupon/redeem", {
            "code": str(code or "")[:64],
            "plan": str(plan or "")[:32],
            "installId": str(install_id or "")[:128],
        })

    def report_event(self, *, install_id="", device_id="", event="", result="ok",
                     app_version="", os_name="", detail=None):
        payload = {
            "installId": str(install_id or "")[:128],
            "deviceId": str(device_id or "")[:256],
            "event": str(event or "")[:32],
            "result": str(result or "ok")[:48],
            "appVersion": str(app_version or "")[:32],
            "os": str(os_name or "")[:32],
        }
        if isinstance(detail, dict):
            payload["detail"] = detail
        return self._post("/api/events", payload)
