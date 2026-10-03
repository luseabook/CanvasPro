"""Pure-stdlib verifier for signed offline authorization responses.

Pin the production RSA modulus here before building a release. An empty key
intentionally disables offline grace rather than trusting an unsigned cache.
"""
import base64
import hashlib
import hmac
import json
import re

OFFLINE_CACHE_RSA_PUBLIC_MODULUS_HEX = ""
OFFLINE_CACHE_RSA_PUBLIC_EXPONENT = 65537
_SHA256_DIGEST_INFO_PREFIX = bytes.fromhex("3031300d060960864801650304020105000420")


def _canonical_bytes(payload):
    return json.dumps(payload, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":")).encode("utf-8")


def verify_offline_cache_proof(response, install_id, device_id):
    modulus_hex = str(OFFLINE_CACHE_RSA_PUBLIC_MODULUS_HEX or "").strip().lower()
    if not modulus_hex or not re.fullmatch(r"[0-9a-f]+", modulus_hex):
        return False
    try:
        modulus = int(modulus_hex, 16)
        exponent = int(OFFLINE_CACHE_RSA_PUBLIC_EXPONENT)
        if modulus.bit_length() < 2048 or exponent != 65537 or not isinstance(response, dict):
            return False
        proof = response.get("offlineProof")
        if not isinstance(proof, dict) or proof.get("algorithm") != "RS256":
            return False
        signed_response = dict(response)
        signed_response.pop("offlineProof", None)
        expected_payload = {
            "version": 1,
            "installId": str(install_id or ""),
            "deviceId": str(device_id or ""),
            "response": signed_response,
        }
        if proof.get("payload") != expected_payload:
            return False
        encoded_signature = str(proof.get("signature") or "")
        padded_signature = encoded_signature + "=" * ((-len(encoded_signature)) % 4)
        signature = base64.b64decode(padded_signature, altchars=b"-_", validate=True)
        key_size = (modulus.bit_length() + 7) // 8
        if len(signature) != key_size:
            return False
        digest_info = _SHA256_DIGEST_INFO_PREFIX + hashlib.sha256(
            _canonical_bytes(expected_payload)
        ).digest()
        padding_size = key_size - len(digest_info) - 3
        if padding_size < 8:
            return False
        expected_encoded = bytes((0, 1)) + bytes([255]) * padding_size + bytes((0,)) + digest_info
        actual_encoded = pow(int.from_bytes(signature, "big"), exponent, modulus).to_bytes(
            key_size, "big"
        )
        return hmac.compare_digest(actual_encoded, expected_encoded)
    except (ValueError, TypeError, OverflowError):
        return False
