import datetime
import hashlib
import hmac
import json
import os
import re
import secrets
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from .offline_cache_verifier import verify_offline_cache_proof


DEFAULT_LICENSE_DOMAIN = "https://api.1e1e.cn"
DEFAULT_GRACE_SECONDS = 259200
DEFAULT_PRODUCT_DISPLAY_NAME = "Canvas"
DEFAULT_UPDATE_MANIFEST_URL = "https://github.com/luseaer-ship-it/CanvasPro/releases/latest/download/latest.json"


def _env_enabled(name):
    return str(os.environ.get(name, "") or "").strip().lower() in ("1", "true", "yes", "on")


def _subscription_override_enabled():
    return _env_enabled("AIC_ALLOW_SUBSCRIPTION_API_OVERRIDE")


def _allow_http_subscription_override():
    return _subscription_override_enabled() and _env_enabled("AIC_DEV_MODE")


SUBSCRIPTION_NETWORK_HELP_MESSAGE = (
    "授权服务不可用，请检查网络；如果当前网络无法连接授权服务器，"
    "请打开科学上网/代理后重试，或查看飞书文档《关于网络》。"
)


class SubscriptionRemoteClient:
    def __init__(
        self,
        *,
        api_base_url,
        timeout_seconds,
        status_active,
        err_required,
        required_message,
        contact_text,
        contact_url,
        contact_wechat="",
        client_config_path=None,
        local_override_path=None,
        status_cache_path=None,
        now_fn=None,
    ):
        self._default_api_base_url = (
            self._normalize_api_base_url(api_base_url)
            or DEFAULT_LICENSE_DOMAIN
        )
        self.client_config_path = os.fspath(client_config_path) if client_config_path else ""
        self.local_override_path = os.fspath(local_override_path) if local_override_path else ""
        self.status_cache_path = os.fspath(status_cache_path) if status_cache_path else ""
        self._now_fn = now_fn if callable(now_fn) else lambda: datetime.datetime.now(datetime.timezone.utc)
        self._config_lock = threading.RLock()
        self._last_config_refresh = 0.0
        self._remote_config = self._normalize_client_config(self._read_json_file(self.client_config_path))
        self.timeout_seconds = max(1, int(timeout_seconds or 5))
        self.status_active = str(status_active or "active")
        self.err_required = str(err_required or "SUBSCRIPTION_REQUIRED")
        self.required_message = str(required_message or "该模型为 VIP，请先激活 CDKEY/订阅")
        self.contact_text = str(contact_text or "").strip()
        self.contact_url = str(contact_url or "").strip()
        self.contact_wechat = str(contact_wechat or "").strip()
        self.status_none = "none"
        self.status_expired = "expired"
        self.api_base_url = self.get_client_config()["license_domain"]

    @staticmethod
    def _normalize_api_base_url(value, *, allow_http=False):
        text = str(value or "").strip().rstrip("/")
        try:
            parsed = urllib.parse.urlsplit(text)
        except Exception:
            return ""
        allowed_schemes = ("https", "http") if allow_http else ("https",)
        if (
            parsed.scheme.lower() not in allowed_schemes
            or not parsed.netloc
            or parsed.username
            or parsed.password
            or parsed.path not in ("", "/")
            or parsed.query
            or parsed.fragment
        ):
            return ""
        return f"{parsed.scheme.lower()}://{parsed.netloc}"

    @staticmethod
    def _normalize_update_url(value, *, allow_http=False):
        text = str(value or "").strip()
        try:
            parsed = urllib.parse.urlsplit(text)
        except Exception:
            return ""
        allowed_schemes = ("https", "http") if allow_http else ("https",)
        if (
            parsed.scheme.lower() not in allowed_schemes
            or not parsed.netloc
            or parsed.username
            or parsed.password
        ):
            return ""
        return text

    @staticmethod
    def _read_json_file(path):
        if not path:
            return {}
        try:
            with open(path, "r", encoding="utf-8-sig") as file:
                data = json.load(file)
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    @staticmethod
    def _write_json_file(path, data):
        if not path:
            return
        temp_path = f"{path}.{os.getpid()}.{threading.get_ident()}.tmp"
        try:
            parent = os.path.dirname(path)
            if parent:
                os.makedirs(parent, exist_ok=True)
            with open(temp_path, "w", encoding="utf-8") as file:
                json.dump(data, file, ensure_ascii=False, indent=2)
            os.replace(temp_path, path)
        except Exception:
            try:
                os.remove(temp_path)
            except Exception:
                pass

    def _normalize_client_config(self, value, *, allow_http=False):
        if not isinstance(value, dict):
            return {}
        data = self._extract_payload_dict(value)
        config = {}
        version = data.get("configVersion")
        if isinstance(version, int) and not isinstance(version, bool) and version >= 0:
            config["configVersion"] = version
        license_domain = self._normalize_api_base_url(
            data.get("license_domain") or data.get("licenseDomain"),
            allow_http=allow_http,
        )
        if license_domain:
            config["license_domain"] = license_domain
        grace = data.get("grace_seconds", data.get("graceSeconds"))
        if isinstance(grace, int) and not isinstance(grace, bool) and grace >= 0:
            config["grace_seconds"] = grace
        display_name = str(
            data.get("product_display_name") or data.get("productDisplayName") or ""
        ).strip()
        if display_name:
            config["product_display_name"] = display_name[:80]
        manifest_url = self._normalize_update_url(
            data.get("update_manifest_url") or data.get("updateManifestUrl"),
            allow_http=allow_http,
        )
        if manifest_url:
            config["update_manifest_url"] = manifest_url
        return config

    def get_client_config(self, *, refresh=False):
        if refresh:
            self.refresh_client_config(force=True)
        with self._config_lock:
            config = {
                "configVersion": 0,
                "license_domain": self._default_api_base_url,
                "grace_seconds": DEFAULT_GRACE_SECONDS,
                "product_display_name": DEFAULT_PRODUCT_DISPLAY_NAME,
                "update_manifest_url": DEFAULT_UPDATE_MANIFEST_URL,
            }
            config.update(self._normalize_client_config(self._remote_config))
            allow_http_override = _allow_http_subscription_override()
            local = self._normalize_client_config(
                self._read_json_file(self.local_override_path), allow_http=allow_http_override
            )
            local.pop("configVersion", None)
            if not _subscription_override_enabled():
                local.pop("license_domain", None)
            config.update(local)
            env_override = ""
            if _subscription_override_enabled():
                env_override = self._normalize_api_base_url(
                    os.environ.get("AIC_SUBSCRIPTION_API_BASE"),
                    allow_http=allow_http_override,
                )
            if env_override:
                config["license_domain"] = env_override
            self.api_base_url = config["license_domain"]
            return config

    def refresh_client_config(self, *, force=False):
        with self._config_lock:
            now = time.monotonic()
            if not force and now - self._last_config_refresh < 300:
                return self.get_client_config()
            self._last_config_refresh = now
            base = self.get_client_config()["license_domain"]
            data = self._fetch_json_url(f"{base}/api/client-config")
            if isinstance(data, dict):
                config = self._normalize_client_config(data)
                if config:
                    self._remote_config = config
                    self._write_json_file(self.client_config_path, config)
            return self.get_client_config()

    def _fetch_json_url(self, url, method="GET", payload=None, *, raw_body=None, extra_headers=None):
        req_body = None
        if raw_body is not None:
            req_body = raw_body
        elif payload is not None:
            req_body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(url, data=req_body, method=method)
        req.add_header("Accept", "application/json")
        if req_body is not None:
            req.add_header("Content-Type", "application/json")
        for name, value in (extra_headers or {}).items():
            req.add_header(name, value)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as error:
            try:
                raw = error.read()
            except Exception:
                raw = b""
        except Exception:
            return None
        try:
            data = json.loads(raw.decode("utf-8", errors="ignore"))
        except Exception:
            return None
        return data if isinstance(data, dict) else None

    @staticmethod
    def _parse_utc_datetime(value):
        text = str(value or "").strip()
        if not text:
            return None
        if text.endswith("Z"):
            text = text[:-1]
        try:
            parsed = datetime.datetime.fromisoformat(text)
        except Exception:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=datetime.timezone.utc)
        return parsed.astimezone(datetime.timezone.utc)

    def _now_utc(self):
        value = self._now_fn()
        parsed = self._parse_utc_datetime(value.isoformat() if isinstance(value, datetime.datetime) else value)
        return parsed or datetime.datetime.now(datetime.timezone.utc)

    def _cache_subscription_status(self, install_id, device_id, data):
        if self.status_cache_path and isinstance(data, dict):
            self._write_json_file(
                self.status_cache_path,
                {
                    "installId": install_id,
                    "deviceId": device_id,
                    "lastConfirmedAt": self._now_utc().isoformat(),
                    "payload": data,
                },
            )

    def _evaluate_offline_status(self, install_id, device_id):
        cached = self._read_json_file(self.status_cache_path)
        if (
            cached.get("installId") != install_id
            or cached.get("deviceId") != device_id
            or not isinstance(cached.get("payload"), dict)
        ):
            return None
        data = cached["payload"]
        if not verify_offline_cache_proof(data, install_id, device_id):
            result = {
                "allowed": False,
                "installId": install_id,
                "deviceId": device_id,
                "status": self.status_none,
                "reasonCode": "OFFLINE_CACHE_UNTRUSTED",
                "reasonMessage": "离线授权缓存签名无效，请联网重新校验",
                "payload": data,
            }
            return result
        payload = self._extract_payload_dict(data)
        status_value = payload.get("status") or payload.get("subscriptionStatus") or payload.get("state")
        status = self._normalize_status(status_value)
        result = {
            "allowed": False,
            "installId": install_id,
            "deviceId": device_id,
            "status": status,
            "reasonCode": "NOT_ACTIVE",
            "reasonMessage": "未激活",
            "payload": data,
        }
        if status != self.status_active:
            if status == self.status_expired:
                result.update(reasonCode="SUBSCRIPTION_EXPIRED", reasonMessage="订阅已过期")
            return result
        expires_at = self._parse_utc_datetime(payload.get("expiresAt") or payload.get("expires_at"))
        server_time = self._parse_utc_datetime(payload.get("serverTime") or payload.get("server_time"))
        if expires_at is None or server_time is None:
            result.update(reasonCode="OFFLINE_CACHE_INVALID", reasonMessage=SUBSCRIPTION_NETWORK_HELP_MESSAGE)
            return result
        grace_seconds = payload.get("graceSeconds", payload.get("grace_seconds"))
        if not isinstance(grace_seconds, int) or isinstance(grace_seconds, bool) or grace_seconds < 0:
            result.update(reasonCode="OFFLINE_CACHE_INVALID", reasonMessage=SUBSCRIPTION_NETWORK_HELP_MESSAGE)
            return result
        now = self._now_utc()
        if now < server_time:
            result.update(reasonCode="CLOCK_ROLLBACK", reasonMessage="检测到系统时间回拨，离线宽限已禁用")
            return result
        if now >= expires_at:
            result.update(reasonCode="SUBSCRIPTION_EXPIRED", reasonMessage="订阅已过期")
            return result
        elapsed = (now - server_time).total_seconds()
        if grace_seconds <= 0 or elapsed > grace_seconds:
            result.update(reasonCode="OFFLINE_GRACE_EXPIRED", reasonMessage="离线宽限期已结束")
            return result
        result.update(allowed=True, reasonCode="OFFLINE_GRACE", reasonMessage="")
        return result

    def normalize_install_id(self, value):
        s = str(value or "").strip()
        if not s or len(s) > 128:
            return ""
        if not re.match(r"^[A-Za-z0-9._:-]+$", s):
            return ""
        return s

    def normalize_device_id(self, value):
        s = str(value or "").strip()
        if not s or len(s) > 256:
            return ""
        if not re.match(r"^[A-Za-z0-9._:-]+$", s):
            return ""
        return s

    def extract_install_id_from_request(self, handler, payload=None):
        header_value = handler.headers.get("X-AIC-Install-Id", "") if handler is not None else ""
        install = self.normalize_install_id(header_value)
        if install:
            return install
        if isinstance(payload, dict):
            install = self.normalize_install_id(payload.get("installId"))
            if install:
                return install
        if handler is None:
            return ""
        parsed = urllib.parse.urlparse(handler.path)
        qs = urllib.parse.parse_qs(parsed.query, keep_blank_values=True, max_num_fields=20)
        install_qs = (qs.get("installId") or [""])[0]
        return self.normalize_install_id(install_qs)

    def extract_device_id_from_request(self, handler, payload=None, fallback_install_id=""):
        header_value = handler.headers.get("X-AIC-Device-Id", "") if handler is not None else ""
        device = self.normalize_device_id(header_value)
        if device:
            return device
        if isinstance(payload, dict):
            device = self.normalize_device_id(payload.get("deviceId") or payload.get("device_id"))
            if device:
                return device
        if handler is None:
            return self.normalize_device_id(fallback_install_id)
        parsed = urllib.parse.urlparse(handler.path)
        qs = urllib.parse.parse_qs(parsed.query, keep_blank_values=True, max_num_fields=20)
        device_qs = (qs.get("deviceId") or qs.get("device_id") or [""])[0]
        device = self.normalize_device_id(device_qs)
        if device:
            return device
        return self.normalize_device_id(fallback_install_id)

    def subscription_required_payload(self, reason=None):
        message = self.required_message
        if reason:
            message = f"{message}（{reason}）"
        return {
            "success": False,
            "code": self.err_required,
            "message": message,
            "contactText": self.contact_text,
            "contactUrl": self.contact_url,
            "contactWechat": self.contact_wechat,
        }

    def _request_json(self, method, path, *, payload=None, query=None):
        base_url = self.get_client_config()["license_domain"]
        if not base_url:
            return None
        base_path = str(path or "").strip()
        if not base_path.startswith("/"):
            base_path = "/" + base_path
        url = f"{base_url}{base_path}"
        if isinstance(query, dict) and query:
            encoded = urllib.parse.urlencode(query)
            if encoded:
                url = f"{url}?{encoded}"
        if method.upper() == "POST" and base_path == "/api/subscription/activate" and isinstance(payload, dict):
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers = self._activation_signature_headers(payload, body)
            data = self._fetch_json_url(url, method=method, raw_body=body, extra_headers=headers)
        else:
            data = self._fetch_json_url(url, method=method, payload=payload)
        if isinstance(data, dict):
            self.refresh_client_config()
        return data

    @staticmethod
    def _activation_signature_headers(payload, body):
        install_id = str(payload.get("installId") or "").strip()
        cdkey = str(payload.get("cdkey") or "").strip()
        timestamp = str(int(time.time()))
        nonce = secrets.token_urlsafe(24)
        key = hmac.new(
            cdkey.encode("utf-8"),
            b"canvas-activation-v1\0" + install_id.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        message = timestamp.encode("ascii") + b"\n" + nonce.encode("ascii") + b"\n" + body
        signature = hmac.new(key, message, hashlib.sha256).hexdigest()
        return {
            "X-AIC-Timestamp": timestamp,
            "X-AIC-Nonce": nonce,
            "X-AIC-Sign": signature,
        }

    def _extract_payload_dict(self, data):
        if not isinstance(data, dict):
            return {}
        nested = data.get("data")
        if isinstance(nested, dict):
            return nested
        return data

    def _normalize_status(self, status_value):
        status = str(status_value or "").strip().lower()
        if status == str(self.status_active).strip().lower():
            return self.status_active
        if status == self.status_expired:
            return self.status_expired
        if status == self.status_none:
            return self.status_none
        return self.status_none

    def fetch_subscription_status(self, install_id, device_id=None):
        install = self.normalize_install_id(install_id)
        if not install:
            return None
        device = self.normalize_device_id(device_id) or install
        query = {"installId": install}
        if device:
            query["deviceId"] = device
        data = self._request_json(
            "GET",
            "/api/subscription/status",
            query=query,
        )
        if isinstance(data, dict):
            self._cache_subscription_status(install, device, data)
        return data

    def activate_cdkey(self, install_id, cdkey, device_id=None):
        install = self.normalize_install_id(install_id)
        device = self.normalize_device_id(device_id) or install
        token = str(cdkey or "").strip()
        if not install or not token:
            return None
        payload = {"installId": install, "cdkey": token}
        if device:
            payload["deviceId"] = device
        data = self._request_json(
            "POST",
            "/api/subscription/activate",
            payload=payload,
        )
        if isinstance(data, dict):
            self._cache_subscription_status(install, device, data)
        return data

    def evaluate_install_active(self, install_id, device_id=None):
        install = self.normalize_install_id(install_id)
        device = self.normalize_device_id(device_id) or install
        if not install:
            return {
                "allowed": False,
                "installId": "",
                "deviceId": "",
                "status": self.status_none,
                "reasonCode": "MISSING_INSTALL_ID",
                "reasonMessage": "缺少 installId",
                "payload": None,
            }
        data = self.fetch_subscription_status(install, device)
        if not isinstance(data, dict):
            offline = self._evaluate_offline_status(install, device)
            if offline is not None:
                return offline
            return {
                "allowed": False,
                "installId": install,
                "deviceId": device,
                "status": self.status_none,
                "reasonCode": "SERVICE_UNAVAILABLE",
                "reasonMessage": SUBSCRIPTION_NETWORK_HELP_MESSAGE,
                "payload": None,
            }
        payload = self._extract_payload_dict(data)
        status_value = (
            payload.get("status")
            or payload.get("subscriptionStatus")
            or payload.get("state")
            or ""
        )
        status = self._normalize_status(status_value)
        if status == self.status_active:
            return {
                "allowed": True,
                "installId": install,
                "deviceId": device,
                "status": status,
                "reasonCode": "ACTIVE",
                "reasonMessage": "",
                "payload": data,
            }
        if status == self.status_expired:
            reason_code = "SUBSCRIPTION_EXPIRED"
            reason_message = "订阅已过期"
        else:
            reason_code = "NOT_ACTIVE"
            reason_message = "未激活"
        return {
            "allowed": False,
            "installId": install,
            "deviceId": device,
            "status": status,
            "reasonCode": reason_code,
            "reasonMessage": reason_message,
            "payload": data,
        }

    def _fetch_status_payload(self, install_id, device_id=None):
        return self.fetch_subscription_status(install_id, device_id)

    def is_install_entitled_for_model(self, install_id, model_id, device_id=None):
        install = self.normalize_install_id(install_id)
        if not install:
            return False
        device = self.normalize_device_id(device_id) or install
        data = self._fetch_status_payload(install, device)
        if not isinstance(data, dict):
            offline = self._evaluate_offline_status(install, device)
            if offline is None or not offline.get("allowed"):
                return False
            data = offline.get("payload")
            if not isinstance(data, dict):
                return False
        payload = self._extract_payload_dict(data)
        status_value = (
            payload.get("status")
            or payload.get("subscriptionStatus")
            or payload.get("state")
            or ""
        )
        if self._normalize_status(status_value) != self.status_active:
            return False
        entitled = payload.get("entitledModelIds")
        if not isinstance(entitled, list):
            entitled = payload.get("entitled_model_ids")
        if not isinstance(entitled, list):
            return False
        model = str(model_id or "").strip()
        return model in [str(m or "").strip() for m in entitled]
