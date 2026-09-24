"""统一管理后端所有 HTTP 客户端的 TLS 信任链。"""

import ipaddress
import json
import os
import platform
import ssl
import sys
import threading
import urllib.parse
import urllib.request

try:
    import requests
    from requests.adapters import HTTPAdapter
except ImportError:  # pragma: no cover - urllib remains available without requests
    requests = None
    HTTPAdapter = object

try:
    import certifi
except ImportError:  # pragma: no cover - packaged runtime installs certifi via requests
    certifi = None


_TLS_STATE_LOCK = threading.RLock()
_OUTBOUND_SSL_CONTEXT = None
_OUTBOUND_TLS_STATUS = None
_REQUESTS_SESSION = None
_TLS_POLICY_VERSION = "system-plus-bundled-certifi-v1"


def _resolve_certifi_ca_bundle():
    if certifi is None:
        return ""
    try:
        bundle_path = str(certifi.where() or "").strip()
    except Exception:
        return ""
    return bundle_path if bundle_path and os.path.isfile(bundle_path) else ""


def _resolve_environment_ca_bundles():
    bundles = []
    for key in ("SSL_CERT_FILE", "REQUESTS_CA_BUNDLE"):
        candidate = str(os.environ.get(key, "") or "").strip()
        if candidate and candidate not in bundles:
            bundles.append(candidate)
    return bundles


def _build_outbound_ssl_context():
    """合并系统、certifi 和有效的企业 CA，环境值不能替换基础信任根。"""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.verify_mode = ssl.CERT_REQUIRED
    context.check_hostname = True
    bundle_path = _resolve_certifi_ca_bundle()
    environment_ca_bundles = _resolve_environment_ca_bundles()
    status = {
        "policyVersion": _TLS_POLICY_VERSION,
        "systemTrustLoaded": False,
        "certifiAvailable": certifi is not None,
        "certifiBundleLoaded": False,
        "environmentCaOverridePresent": bool(environment_ca_bundles),
        "environmentCaOverrideMerged": False,
        "environmentCaOverrideIgnored": False,
        "pythonVersion": platform.python_version(),
        "opensslVersion": ssl.OPENSSL_VERSION,
        "compiledRuntime": bool(
            getattr(sys, "frozen", False) or "__compiled__" in globals()
        ),
        "requestsAvailable": requests is not None,
    }
    try:
        context.load_default_certs(ssl.Purpose.SERVER_AUTH)
        status["systemTrustLoaded"] = True
    except Exception as error:
        status["systemTrustErrorType"] = type(error).__name__

    if bundle_path:
        try:
            context.load_verify_locations(cafile=bundle_path)
            status["certifiBundleLoaded"] = True
            certifi_version = str(getattr(certifi, "__version__", "") or "").strip()
            if certifi_version:
                status["certifiVersion"] = certifi_version
        except Exception as error:
            status["caBundleErrorType"] = type(error).__name__
        try:
            status["certifiBundleBytes"] = int(os.path.getsize(bundle_path))
        except Exception as error:
            status["caBundleStatErrorType"] = type(error).__name__

    environment_ca_errors = []
    for environment_bundle in environment_ca_bundles:
        if not os.path.isfile(environment_bundle):
            environment_ca_errors.append("FileNotFoundError")
            continue
        try:
            context.load_verify_locations(cafile=environment_bundle)
            status["environmentCaOverrideMerged"] = True
        except Exception as error:
            environment_ca_errors.append(type(error).__name__)
    if environment_ca_errors:
        status["environmentCaOverrideErrorTypes"] = sorted(set(environment_ca_errors))
    status["environmentCaOverrideIgnored"] = bool(
        environment_ca_bundles and not status["environmentCaOverrideMerged"]
    )
    if not status["systemTrustLoaded"] and not status["certifiBundleLoaded"]:
        raise ssl.SSLError("no outbound HTTPS trust store could be loaded")
    try:
        store_stats = context.cert_store_stats()
        status["caCertificateCount"] = int(store_stats.get("x509_ca", 0) or 0)
    except Exception as error:
        status["storeStatsErrorType"] = type(error).__name__
    return context, status


def get_outbound_ssl_context():
    global _OUTBOUND_SSL_CONTEXT, _OUTBOUND_TLS_STATUS
    if _OUTBOUND_SSL_CONTEXT is not None:
        return _OUTBOUND_SSL_CONTEXT
    with _TLS_STATE_LOCK:
        if _OUTBOUND_SSL_CONTEXT is None:
            _OUTBOUND_SSL_CONTEXT, _OUTBOUND_TLS_STATUS = _build_outbound_ssl_context()
            print(
                "[outbound-http][tls] "
                + json.dumps(_OUTBOUND_TLS_STATUS, ensure_ascii=True, sort_keys=True),
                flush=True,
            )
    return _OUTBOUND_SSL_CONTEXT


def get_outbound_tls_status():
    get_outbound_ssl_context()
    return dict(_OUTBOUND_TLS_STATUS or {})


def is_loopback_http_url(url):
    raw_url = getattr(url, "full_url", url)
    try:
        parsed = urllib.parse.urlsplit(str(raw_url or "").strip())
        hostname = parsed.hostname
        parsed.port
    except (TypeError, ValueError):
        return False
    if (
        parsed.scheme.lower() not in {"http", "https"}
        or not hostname
        or parsed.username is not None
        or parsed.password is not None
    ):
        return False
    try:
        return ipaddress.ip_address(hostname).is_loopback
    except ValueError:
        return False


def urlopen(url, data=None, timeout=None, **options):
    if "context" in options:
        raise TypeError("outbound HTTP TLS context is managed centrally")
    options = dict(options)
    if data is not None:
        options["data"] = data
    if timeout is not None:
        options["timeout"] = timeout
    if is_loopback_http_url(url):
        no_proxy_handler = urllib.request.ProxyHandler({})
        return build_opener(no_proxy_handler).open(url, **options)
    options["context"] = get_outbound_ssl_context()
    return urllib.request.urlopen(url, **options)


def build_opener(*handlers):
    https_handler = urllib.request.HTTPSHandler(context=get_outbound_ssl_context())
    return urllib.request.build_opener(https_handler, *handlers)


class _SharedTlsHttpAdapter(HTTPAdapter):
    def __init__(self, *, ssl_context, **options):
        self.ssl_context = ssl_context
        super().__init__(**options)

    def init_poolmanager(self, connections, maxsize, block=False, **pool_kwargs):
        pool_kwargs["ssl_context"] = self.ssl_context
        return super().init_poolmanager(connections, maxsize, block, **pool_kwargs)

    def proxy_manager_for(self, proxy, **proxy_kwargs):
        proxy_kwargs["ssl_context"] = self.ssl_context
        return super().proxy_manager_for(proxy, **proxy_kwargs)

    def cert_verify(self, conn, url, verify, cert):
        conn.cert_reqs = "CERT_REQUIRED"
        conn.ca_certs = None
        conn.ca_cert_dir = None
        if cert:
            if isinstance(cert, str):
                conn.cert_file = cert
                conn.key_file = None
            else:
                conn.cert_file = cert[0]
                conn.key_file = cert[1]


def get_requests_session():
    global _REQUESTS_SESSION
    if requests is None:
        raise ImportError("requests is not installed")
    if _REQUESTS_SESSION is not None:
        return _REQUESTS_SESSION
    with _TLS_STATE_LOCK:
        if _REQUESTS_SESSION is None:
            session = requests.Session()
            session.mount(
                "https://",
                _SharedTlsHttpAdapter(ssl_context=get_outbound_ssl_context()),
            )
            _REQUESTS_SESSION = session
    return _REQUESTS_SESSION


class _RequestsClient:
    @staticmethod
    def _request(method, url, **options):
        if "verify" in options:
            raise TypeError("outbound HTTP TLS verification is managed centrally")
        return get_requests_session().request(method, url, **options)

    def get(self, url, **options):
        return self._request("GET", url, **options)

    def post(self, url, **options):
        return self._request("POST", url, **options)

    def put(self, url, **options):
        return self._request("PUT", url, **options)

    def patch(self, url, **options):
        return self._request("PATCH", url, **options)

    def delete(self, url, **options):
        return self._request("DELETE", url, **options)

    def head(self, url, **options):
        return self._request("HEAD", url, **options)

    def options(self, url, **options):
        return self._request("OPTIONS", url, **options)

    def request(self, method, url, **options):
        return self._request(str(method or "GET").upper(), url, **options)

    @property
    def exceptions(self):
        if requests is None:
            raise ImportError("requests is not installed")
        return requests.exceptions


_REQUESTS_CLIENT = _RequestsClient()


def get_requests_client():
    if requests is None:
        raise ImportError("requests is not installed")
    return _REQUESTS_CLIENT


def _reset_outbound_tls_state_for_tests():
    global _OUTBOUND_SSL_CONTEXT, _OUTBOUND_TLS_STATUS, _REQUESTS_SESSION
    with _TLS_STATE_LOCK:
        if _REQUESTS_SESSION is not None:
            try:
                _REQUESTS_SESSION.close()
            except Exception:
                pass
        _REQUESTS_SESSION = None
        _OUTBOUND_SSL_CONTEXT = None
        _OUTBOUND_TLS_STATUS = None
