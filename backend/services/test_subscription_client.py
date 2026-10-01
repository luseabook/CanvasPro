import datetime
import base64
import hashlib
import hmac
import json
import os
import tempfile
import unittest
from unittest.mock import patch

from backend.services import offline_cache_verifier
from backend.services.subscription_client import SubscriptionRemoteClient


UTC = datetime.timezone.utc
NOW = datetime.datetime(2026, 9, 30, 12, 0, tzinfo=UTC)
_TEST_RSA_MODULUS_HEX = "ade76511d44d7154fab7f3721b9bd95deb3a1992f7ad0659ede9a97e4f2393ae852f40a7b06ceefd3f4fa2a1a451b8818982dfc1240bb0795b4ead6c9df7a1da09cc8fffdf21495109f16d40f135a402d443596f69e275fc27f32e1d922bfadf32a585ef6745557962fdc883fa1f8bbab4d24981e2069050d5c51ed61b69601b640d8227122068213f0835e802ba87c83da2d4853138d4c1bd80778cf13f59675d8cb342135dd192a7d093f45100e860fede0149b2927f848ff8696584561e85fb4a45fc45f87fad169edb816e28511c8264b6b7d9d5953d17f2fff6c45bd2e2ce2464173987e3ae07bf6ed9ee4ab28dc691fd3a23cee5a6c7e32af464cafab1"
_TEST_RSA_PRIVATE_DER_B64 = "MIIEpAIBAAKCAQEAredlEdRNcVT6t/NyG5vZXes6GZL3rQZZ7empfk8jk66FL0CnsGzu/T9PoqGkUbiBiYLfwSQLsHlbTq1snfeh2gnMj//fIUlRCfFtQPE1pALUQ1lvaeJ1/CfzLh2SK/rfMqWF72dFVXli/ciD+h+LurTSSYHiBpBQ1cUe1htpYBtkDYInEiBoIT8INegCuofIPaLUhTE41MG9gHeM8T9ZZ12Ms0ITXdGSp9CT9FEA6GD+3gFJspJ/hI/4aWWEVh6F+0pF/EX4f60WntuBbihRHIJktrfZ1ZU9F/L/9sRb0uLOJGQXOYfjrge/btnuSrKNxpH9OiPO5abH4yr0ZMr6sQIDAQABAoIBAD67XwksdXcxeXPL/NiawrGPfhjlnDStOtmI1Zx7vdCzPtYJ07Pfx+JQ6VA4UQctsITDUiXg89qIHHjoNGtTfe4iZMl5OqtOQE5+6bNoj7oHTzywUXF3wKniW2XCQw1cZRFnBkaTET7BGAWGRJ2Ara3/NnBPyxIlExPaFMKVhtCk2G2gdS7YvbD4viSz/FdLMWCLsohnTOyHT/RpFYY9OASuHPeFfiFRa5tGiP6gywPZDzp8w2JWspaGgQCF/53FZEmycXPqH0qNkKahf9RVGRLHnm8mNUqrqOgWcfWBhqaF0BG0xmhLfFjNleIe8SsSY9UFjJneNOBhPZAvSoHi+8UCgYEA3YTDupZ4Ma4shoi+F8DUG3/atHp3NP3Pm/Wsdwg6IGOIDQdRyrax0jADwj6Ijhtx1zaFGPhp0f8bGCBTVeaYvgAW3ZqlrW6dgeRWU5WGYAEWe77b7lM5hkX7l8kSsY9hFkFEkXwT3s0wnRqEloBDJ49x4KCaEyxBay89+DcsJw8CgYEAyPk+bmV7GEBjuFszSL+Zs05rTRlK/wXSCl8yXrJnS4Lq45z36/j2AhqK0M8+UnWRYMT4u2MKo9PHdeIDyeIiBCey2TN9aXSRHGuT6XGIqdLO1pVrculyjmvWcaz9hJ9v2DoL3gDqtHNoJNWCmoGCTqBHPVzbO4G2uqtRiw9swj8CgYEA1h+AZvsNwc//wCerwCAnp1FGIdCDLBjvNm0aQZEVRruPBjD+EfnZFzhMWdXCf8Ltnr9XlpSBDXkPQpn0lAMrv/UsJRdYcLWM0MLb4z2Uv3Ytun3573xJDY7WLJkzVaknirCaTBroxiQHisTYRvZCc5oH1L7JUCEmNypaN3V1W2cCgYEAoZoZo3eihZuxE9rx3/uBQfc6vOIrtekePgzSWecmvEdnTOM5T9v/JS3mlYUv3ep/ncqFH1jCg32Vk6rL1RgqtiCd5Z1LqPJ8hNfUNhB/Dd9fRpkbr2kcHn2EECBEMtJpgvsZ88fU8okiIww0Wrzs5QBoiGUUPENPhcagaStcDs0CgYAjXXjAY6xh1TK4hyGkfqIQs1HJhzrf1idmZAfBO9ag1EMI9zmxQ/mBPYSO41D5VaI+VFJKyCDxCEL+CefyNpjG/eHnsMltHnS481U/wFn0nXhHIyJ0Lj12jT0KEtP8kyaCF6X/uys6xhAco6zwMSPQN4rn0cRzE8SqA8F5vA5x2Q=="
offline_cache_verifier.OFFLINE_CACHE_RSA_PUBLIC_MODULUS_HEX = _TEST_RSA_MODULUS_HEX


def _read_der_value(data, offset=0):
    tag = data[offset]
    length = data[offset + 1]
    offset += 2
    if length & 0x80:
        count = length & 0x7f
        length = int.from_bytes(data[offset:offset + count], "big")
        offset += count
    return tag, data[offset:offset + length], offset + length


def _sign_test_offline_response(response, install_id, device_id):
    der = base64.b64decode(_TEST_RSA_PRIVATE_DER_B64)
    _, sequence, _ = _read_der_value(der)
    values = []
    offset = 0
    while offset < len(sequence):
        _, raw, offset = _read_der_value(sequence, offset)
        values.append(int.from_bytes(raw, "big"))
    modulus, private_exponent = values[1], values[3]
    signed_response = dict(response)
    proof_payload = {
        "version": 1,
        "installId": install_id,
        "deviceId": device_id,
        "response": signed_response,
    }
    message = json.dumps(proof_payload, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":")).encode("utf-8")
    digest_info = bytes.fromhex("3031300d060960864801650304020105000420") + hashlib.sha256(message).digest()
    key_size = (modulus.bit_length() + 7) // 8
    encoded = b"\x00\x01" + b"\xff" * (key_size - len(digest_info) - 3) + b"\x00" + digest_info
    signature = pow(int.from_bytes(encoded, "big"), private_exponent, modulus).to_bytes(key_size, "big")
    return {
        **signed_response,
        "offlineProof": {
            "algorithm": "RS256",
            "payload": proof_payload,
            "signature": base64.urlsafe_b64encode(signature).decode("ascii").rstrip("="),
        },
    }


class FakeResponse:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.payload


class SubscriptionClientTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.root = self.temp_dir.name
        self.config_path = os.path.join(self.root, "client-config.json")
        self.override_path = os.path.join(self.root, "client-config.local.json")
        self.status_path = os.path.join(self.root, "subscription-status.json")

    def tearDown(self):
        self.temp_dir.cleanup()

    def make_client(self, *, clock=None):
        return SubscriptionRemoteClient(
            api_base_url="https://api.example.test",
            timeout_seconds=1,
            status_active="active",
            err_required="SUBSCRIPTION_REQUIRED",
            required_message="VIP subscription required",
            contact_text="Support",
            contact_url="https://support.example.test",
            client_config_path=self.config_path,
            local_override_path=self.override_path,
            status_cache_path=self.status_path,
            now_fn=clock or (lambda: NOW),
        )

    def write_json(self, path, payload):
        with open(path, "w", encoding="utf-8") as file:
            json.dump(payload, file)

    def cache_active_subscription(self, client, expires_at, **extra):
        payload = _sign_test_offline_response(
            {
                "status": "active",
                "expiresAt": expires_at.isoformat(),
                "serverTime": NOW.isoformat(),
                "entitledModelIds": ["model-1"],
                "graceSeconds": 3600,
                **extra,
            },
            "install-1",
            "device-1",
        )
        client._cache_subscription_status(
            "install-1",
            "device-1",
            payload,
        )

class SubscriptionClientConfigTests(SubscriptionClientTestCase):
    def test_local_and_environment_overrides_take_precedence_over_cached_server_config(self):
        self.write_json(
            self.config_path,
            {
                "configVersion": 4,
                "license_domain": "https://server.example.test",
                "grace_seconds": 1800,
                "product_display_name": "Server name",
                "update_manifest_url": "https://server.example.test/latest.json",
            },
        )
        self.write_json(
            self.override_path,
            {"license_domain": "http://127.0.0.1:8010", "product_display_name": "Local name"},
        )
        with patch.dict(os.environ, {
            "AIC_SUBSCRIPTION_API_BASE": "https://env.example.test",
            "AIC_ALLOW_SUBSCRIPTION_API_OVERRIDE": "1",
            "AIC_DEV_MODE": "1",
        }):
            config = self.make_client().get_client_config()

        self.assertEqual(config["license_domain"], "https://env.example.test")
        self.assertEqual(config["product_display_name"], "Local name")
        self.assertEqual(config["grace_seconds"], 1800)
        self.assertEqual(config["update_manifest_url"], "https://server.example.test/latest.json")

    def test_environment_override_is_ignored_without_explicit_opt_in(self):
        with patch.dict(os.environ, {
            "AIC_SUBSCRIPTION_API_BASE": "http://attacker.example.test",
            "AIC_ALLOW_SUBSCRIPTION_API_OVERRIDE": "",
            "AIC_DEV_MODE": "",
        }, clear=False):
            config = self.make_client().get_client_config()

        self.assertEqual(config["license_domain"], "https://api.example.test")

    def test_successful_config_fetch_is_normalized_and_persisted(self):
        response = {
            "success": True,
            "data": {
                "configVersion": 7,
                "license_domain": "https://next.example.test/",
                "grace_seconds": 7200,
                "product_display_name": "Canvas Studio",
                "update_manifest_url": "https://releases.example.test/manifest.json",
            },
        }
        client = self.make_client()
        with patch.dict(os.environ, {"AIC_SUBSCRIPTION_API_BASE": ""}):
            with patch("backend.services.subscription_client.urllib.request.urlopen", return_value=FakeResponse(response)) as urlopen:
                config = client.refresh_client_config(force=True)

        self.assertEqual(urlopen.call_args.args[0].full_url, "https://api.example.test/api/client-config")
        self.assertEqual(config["configVersion"], 7)
        self.assertEqual(config["license_domain"], "https://next.example.test")
        self.assertEqual(config["grace_seconds"], 7200)
        self.assertEqual(config["product_display_name"], "Canvas Studio")
        with open(self.config_path, "r", encoding="utf-8") as file:
            self.assertEqual(json.load(file)["configVersion"], 7)


class SubscriptionActivationSignatureTests(SubscriptionClientTestCase):
    def test_activation_request_signs_the_exact_json_body_and_protocol_message(self):
        client = self.make_client()
        payload = {"installId": "install-1", "cdkey": "ABCD-EFGH-IJKL-MNOP", "deviceId": "device-1"}
        captured = {}

        def fake_urlopen(request, timeout):
            captured["request"] = request
            captured["timeout"] = timeout
            return FakeResponse({"ok": True})

        with patch("backend.services.subscription_client.urllib.request.urlopen", side_effect=fake_urlopen):
            with patch.object(client, "refresh_client_config"):
                result = client._request_json("POST", "/api/subscription/activate", payload=payload)

        request = captured["request"]
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.assertEqual(result, {"ok": True})
        self.assertEqual(request.data, body)
        headers = {name.lower(): value for name, value in request.header_items()}
        timestamp = headers["x-aic-timestamp"]
        nonce = headers["x-aic-nonce"]
        signature = headers["x-aic-sign"]
        self.assertRegex(nonce, r"^[A-Za-z0-9_-]{16,128}$")

        key = hmac.new(
            payload["cdkey"].encode("utf-8"),
            b"canvas-activation-v1\0" + payload["installId"].encode("utf-8"),
            hashlib.sha256,
        ).digest()
        message = timestamp.encode("ascii") + b"\n" + nonce.encode("ascii") + b"\n" + body
        expected = hmac.new(key, message, hashlib.sha256).hexdigest()
        self.assertEqual(signature, expected)


class SubscriptionOfflineGraceTests(SubscriptionClientTestCase):
    def test_offline_grace_fails_closed_when_no_public_key_is_pinned(self):
        client = self.make_client()
        self.cache_active_subscription(client, NOW + datetime.timedelta(days=1))

        with patch.object(offline_cache_verifier, "OFFLINE_CACHE_RSA_PUBLIC_MODULUS_HEX", ""):
            with patch.object(client, "fetch_subscription_status", return_value=None):
                decision = client.evaluate_install_active("install-1", "device-1")

        self.assertFalse(decision["allowed"])
        self.assertEqual(decision["reasonCode"], "OFFLINE_CACHE_UNTRUSTED")

    def test_cached_server_grace_is_used_even_when_config_version_is_zero(self):
        clock = [NOW]
        self.write_json(self.config_path, {"configVersion": 0, "grace_seconds": 7200})
        client = self.make_client(clock=lambda: clock[0])
        self.cache_active_subscription(
            client, NOW + datetime.timedelta(days=1), graceSeconds=7200
        )
        clock[0] = NOW + datetime.timedelta(seconds=3601)

        with patch.object(client, "fetch_subscription_status", return_value=None):
            decision = client.evaluate_install_active("install-1", "device-1")

        self.assertTrue(decision["allowed"])
        self.assertEqual(decision["reasonCode"], "OFFLINE_GRACE")

    def test_cached_active_subscription_is_allowed_only_within_grace_and_before_expiry(self):
        clock = [NOW]
        client = self.make_client(clock=lambda: clock[0])
        self.cache_active_subscription(client, NOW + datetime.timedelta(hours=10))

        with patch.object(client, "fetch_subscription_status", return_value=None):
            decision = client.evaluate_install_active("install-1", "device-1")
            self.assertTrue(decision["allowed"])
            self.assertEqual(decision["reasonCode"], "OFFLINE_GRACE")
            self.assertTrue(client.is_install_entitled_for_model("install-1", "model-1", "device-1"))

            clock[0] = NOW + datetime.timedelta(seconds=3601)
            expired_grace = client.evaluate_install_active("install-1", "device-1")
            self.assertFalse(expired_grace["allowed"])
            self.assertEqual(expired_grace["reasonCode"], "OFFLINE_GRACE_EXPIRED")

            clock[0] = NOW + datetime.timedelta(hours=11)
            expired_license = client.evaluate_install_active("install-1", "device-1")
            self.assertFalse(expired_license["allowed"])
            self.assertEqual(expired_license["reasonCode"], "SUBSCRIPTION_EXPIRED")

    def test_clock_rollback_disables_offline_grace(self):
        clock = [NOW]
        client = self.make_client(clock=lambda: clock[0])
        self.cache_active_subscription(client, NOW + datetime.timedelta(days=1))
        clock[0] = NOW - datetime.timedelta(seconds=1)

        with patch.object(client, "fetch_subscription_status", return_value=None):
            decision = client.evaluate_install_active("install-1", "device-1")

        self.assertFalse(decision["allowed"])
        self.assertEqual(decision["reasonCode"], "CLOCK_ROLLBACK")

    def test_expired_subscription_is_never_extended_by_offline_grace(self):
        clock = [NOW]
        client = self.make_client(clock=lambda: clock[0])
        self.cache_active_subscription(client, NOW + datetime.timedelta(minutes=10))
        clock[0] = NOW + datetime.timedelta(minutes=11)

        with patch.object(client, "fetch_subscription_status", return_value=None):
            decision = client.evaluate_install_active("install-1", "device-1")

        self.assertFalse(decision["allowed"])
        self.assertEqual(decision["reasonCode"], "SUBSCRIPTION_EXPIRED")

    def test_tampered_signed_cache_is_rejected(self):
        client = self.make_client()
        self.cache_active_subscription(client, NOW + datetime.timedelta(days=1))
        cached = client._read_json_file(self.status_path)
        cached["payload"]["graceSeconds"] = 10_000_000
        self.write_json(self.status_path, cached)

        with patch.object(client, "fetch_subscription_status", return_value=None):
            decision = client.evaluate_install_active("install-1", "device-1")

        self.assertFalse(decision["allowed"])
        self.assertEqual(decision["reasonCode"], "OFFLINE_CACHE_UNTRUSTED")

    def test_unsigned_legacy_cache_no_longer_grants_offline_grace(self):
        client = self.make_client()
        self.cache_active_subscription(client, NOW + datetime.timedelta(days=1))
        cached = client._read_json_file(self.status_path)
        cached["payload"].pop("offlineProof")
        self.write_json(self.status_path, cached)

        with patch.object(client, "fetch_subscription_status", return_value=None):
            decision = client.evaluate_install_active("install-1", "device-1")

        self.assertFalse(decision["allowed"])
        self.assertEqual(decision["reasonCode"], "OFFLINE_CACHE_UNTRUSTED")

    def test_local_config_cannot_extend_signed_offline_grace(self):
        clock = [NOW]
        client = self.make_client(clock=lambda: clock[0])
        self.cache_active_subscription(client, NOW + datetime.timedelta(days=1))
        self.write_json(self.config_path, {"configVersion": 9, "grace_seconds": 10_000_000})
        self.write_json(self.override_path, {"grace_seconds": 10_000_000})
        clock[0] = NOW + datetime.timedelta(seconds=3601)

        with patch.object(client, "fetch_subscription_status", return_value=None):
            decision = client.evaluate_install_active("install-1", "device-1")

        self.assertFalse(decision["allowed"])
        self.assertEqual(decision["reasonCode"], "OFFLINE_GRACE_EXPIRED")


if __name__ == "__main__":
    unittest.main()
