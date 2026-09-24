"""Bounded ComfyUI adapter; fixed upstream operations, explicit endpoint allowlist.

No service is contacted until the user requests an operation. Never calls /interrupt.
Credentials are request-scoped and never persisted in projects or the submission cache.
"""
import base64
import binascii
import hashlib
import json
import os
import re
import threading
from urllib.parse import urlsplit, urlunsplit

import requests

PREFIX = "/api/v2/comfyui/"
JSON_LIMIT = 8 * 1024 * 1024
MEDIA_LIMIT = 64 * 1024 * 1024
REQUEST_LIMIT = 12 * 1024 * 1024
ID_RE = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")
MIME_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
              ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4",
              ".webm": "video/webm", ".wav": "audio/wav", ".mp3": "audio/mpeg",
              ".flac": "audio/flac", ".ogg": "audio/ogg"}


class ComfyError(Exception):
    def __init__(self, message, code=400):
        super().__init__(message)
        self.code = code


def normalize_endpoint(value):
    value = str(value or "").strip()
    if len(value) > 2048 or any(ord(c) < 33 for c in value):
        raise ComfyError("Invalid ComfyUI endpoint")
    try:
        parsed = urlsplit(value)
        port = parsed.port
    except ValueError as exc:
        raise ComfyError("Invalid ComfyUI endpoint") from exc
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise ComfyError("Use an HTTP(S) URL without credentials, query or fragment")
    if parsed.scheme == "http" and parsed.hostname not in ("127.0.0.1", "localhost", "::1"):
        raise ComfyError("Remote ComfyUI endpoints must use HTTPS")
    if "%" in parsed.path or "\\" in parsed.path or any(p in (".", "..") for p in parsed.path.split("/")):
        raise ComfyError("Invalid endpoint path")
    host = parsed.hostname.lower()
    if ":" in host:
        host = "[" + host + "]"
    if port and not ((parsed.scheme == "https" and port == 443) or (parsed.scheme == "http" and port == 80)):
        host += ":" + str(port)
    return urlunsplit((parsed.scheme, host, parsed.path.rstrip("/"), "", ""))


def validate_prompt(prompt):
    if not isinstance(prompt, dict) or not prompt or len(prompt) > 500:
        raise ComfyError("Import a ComfyUI API-format workflow (1-500 nodes), not the UI workflow JSON")
    for node_id, node in prompt.items():
        if not ID_RE.fullmatch(str(node_id)) or not isinstance(node, dict):
            raise ComfyError("Invalid workflow node")
        if not isinstance(node.get("class_type"), str) or not node["class_type"] or not isinstance(node.get("inputs"), dict):
            raise ComfyError("Each node needs class_type and inputs; export the API format in ComfyUI")
        for value in node["inputs"].values():
            if isinstance(value, list):
                if len(value) != 2 or str(value[0]) not in prompt or not isinstance(value[1], int) or isinstance(value[1], bool) or value[1] < 0:
                    raise ComfyError("Invalid workflow connection")
            elif isinstance(value, dict):
                raise ComfyError("Nested input objects are not supported in this adapter")
    return prompt


def validate_id(value):
    value = str(value or "")
    if not ID_RE.fullmatch(value):
        raise ComfyError("Invalid task identifier")
    return value


def output_files(record):
    result, seen = [], set()
    outputs = record.get("outputs", {}) if isinstance(record, dict) else {}
    if not isinstance(outputs, dict):
        return result
    for node_id, output in outputs.items():
        if not isinstance(output, dict):
            continue
        for kind in ("images", "gifs", "audio", "videos"):
            items = output.get(kind, [])
            if not isinstance(items, list):
                continue
            for item in items:
                if not isinstance(item, dict):
                    continue
                filename = str(item.get("filename") or "")
                subfolder = str(item.get("subfolder") or "")
                storage = str(item.get("type") or "output")
                if not filename or len(filename) > 255 or any(c in filename for c in ("/", "\\", ":", "\x00")):
                    continue
                if ":" in subfolder or len(subfolder) > 512 or subfolder.startswith(("/", "\\")) or "\\" in subfolder or any(p in ("..", ".") for p in subfolder.split("/")) or "\x00" in subfolder:
                    continue
                if storage not in ("output", "temp") or os.path.splitext(filename)[1].lower() not in MIME_TYPES:
                    continue
                identity = (filename, subfolder, storage)
                if identity in seen:
                    continue
                seen.add(identity)
                key = hashlib.sha256(json.dumps(identity).encode()).hexdigest()[:24]
                result.append({"key": key, "filename": filename, "subfolder": subfolder,
                               "type": storage, "nodeId": str(node_id), "mimeType": MIME_TYPES[os.path.splitext(filename)[1].lower()]})
                if len(result) >= 200:
                    return result
    return result


class ComfyUiRouteService:
    def __init__(self, *, read_body):
        self._read_body = read_body
        self._submissions = {}
        self._lock = threading.Lock()

    @staticmethod
    def _ok(data):
        return {"kind": "json_ok", "data": data}

    @staticmethod
    def _error(exc):
        return {"kind": "json_err", "code": getattr(exc, "code", 502), "message": str(exc)}

    @staticmethod
    def endpoints():
        values = ["http://127.0.0.1:8188", "http://localhost:8188"]
        values += os.environ.get("AIC_COMFYUI_ALLOWED_URLS", "").split(",")
        return list(dict.fromkeys(normalize_endpoint(v) for v in values if v.strip()))

    def connection(self, payload):
        endpoint = normalize_endpoint(payload.get("endpoint"))
        if endpoint not in self.endpoints():
            raise ComfyError("Endpoint is not allowed. Configure AIC_COMFYUI_ALLOWED_URLS on the Canvas backend first", 403)
        token = payload.get("token") or ""
        if not isinstance(token, str) or len(token) > 4096 or "\n" in token or "\r" in token:
            raise ComfyError("Invalid token")
        return endpoint, token

    @staticmethod
    def _request(endpoint, token, method, route, *, payload=None, params=None, files=None, media=False):
        headers = {"Accept": "*/*" if media else "application/json"}
        if token:
            headers["Authorization"] = "Bearer " + token
        limit = MEDIA_LIMIT if media else JSON_LIMIT
        try:
            with requests.Session() as session:
                session.trust_env = False
                with session.request(method, endpoint + route, headers=headers, json=payload,
                                     params=params, files=files, timeout=(5, 60),
                                     allow_redirects=False, stream=True) as response:
                    if 300 <= response.status_code < 400:
                        raise ComfyError("ComfyUI redirects are disabled; configure the final HTTPS endpoint", 502)
                    if response.status_code >= 400:
                        # Do not echo upstream bodies: they can contain workflows or credentials.
                        code = 400 if response.status_code in (400, 422) else 502
                        raise ComfyError("ComfyUI returned HTTP %s. Check workflow nodes, models and credentials" % response.status_code, code)
                    content_length = response.headers.get("Content-Length", "")
                    if content_length.isdigit() and int(content_length) > limit:
                        raise ComfyError("ComfyUI response exceeds size limit", 413)
                    chunks, size = [], 0
                    for chunk in response.iter_content(65536):
                        size += len(chunk)
                        if size > limit:
                            raise ComfyError("ComfyUI response exceeds size limit", 413)
                        chunks.append(chunk)
                    body = b"".join(chunks)
                    if media:
                        return body
                    data = json.loads(body.decode("utf-8")) if body else {}
                    if not isinstance(data, dict):
                        raise ComfyError("Unexpected ComfyUI response", 502)
                    return data
        except requests.RequestException as exc:
            raise ComfyError("Cannot reach ComfyUI or request timed out; verify the configured service", 502) from exc
        except (UnicodeError, json.JSONDecodeError) as exc:
            raise ComfyError("ComfyUI did not return valid JSON", 502) from exc

    def handle_get(self, handler, path):
        if path != PREFIX + "connections":
            return None
        try:
            return self._ok({"endpoints": self.endpoints()})
        except ComfyError as exc:
            return self._error(exc)

    def handle_post(self, handler, path):
        if not path.startswith(PREFIX):
            return None
        operation = path[len(PREFIX):]
        if operation not in {"system-stats", "prompt", "history", "recover", "cancel", "view", "upload"}:
            return self._error(ComfyError("Unknown ComfyUI operation", 404))
        try:
            payload = json.loads(self._read_body(handler, max_bytes=REQUEST_LIMIT))
            if not isinstance(payload, dict):
                raise ComfyError("JSON object required")
            endpoint, token = self.connection(payload)
            if operation == "view":
                return self.view(endpoint, token, payload)
            if operation == "system-stats":
                self._request(endpoint, token, "GET", "/system_stats")
                return self._ok({"connected": True})
            method = getattr(self, operation)
            return self._ok(method(endpoint, token, payload))
        except (ValueError, TypeError, binascii.Error) as exc:
            return self._error(ComfyError("Invalid or oversized request body"))
        except ComfyError as exc:
            return self._error(exc)

    def prompt(self, endpoint, token, payload):
        request_id = validate_id(payload.get("requestId"))
        prompt = validate_prompt(payload.get("prompt"))
        key = (endpoint, request_id)
        with self._lock:
            if key in self._submissions:
                return dict(self._submissions[key])
            if len(self._submissions) >= 512:
                raise ComfyError("Submission cache is full; restart backend after finishing active tasks", 503)
            self._submissions[key] = {"requestId": request_id, "promptId": "", "state": "submitting"}
        try:
            response = self._request(endpoint, token, "POST", "/prompt", payload={
                "prompt": prompt, "client_id": request_id, "extra_data": {"aic_request_id": request_id}})
            if not response.get("prompt_id") and (response.get("error") or response.get("node_errors")):
                raise ComfyError("Workflow validation failed; check missing custom nodes, models and input values")
            prompt_id = str(response.get("prompt_id") or "")
            if not ID_RE.fullmatch(prompt_id):
                raise ComfyError("Submission response has no task ID; verify ComfyUI queue before retrying", 502)
            record = {"requestId": request_id, "promptId": prompt_id, "state": "queued"}
            if response.get("node_errors"):
                record["message"] = "Task accepted, but some output nodes failed validation; inspect ComfyUI"
        except ComfyError as exc:
            record = {"requestId": request_id, "promptId": "", "state": "failed" if exc.code == 400 else "unknown", "message": str(exc)}
        with self._lock:
            self._submissions[key] = record
        return dict(record)

    def _record(self, endpoint, token, prompt_id):
        history = self._request(endpoint, token, "GET", "/history/" + validate_id(prompt_id))
        record = history.get(prompt_id)
        return record if isinstance(record, dict) else None

    def history(self, endpoint, token, payload):
        prompt_id = validate_id(payload.get("promptId"))
        record = self._record(endpoint, token, prompt_id)
        if record is not None:
            status = record.get("status") or {}
            if not isinstance(status, dict):
                raise ComfyError("Unexpected task status", 502)
            state = "completed"
            if status.get("status_str") == "error":
                state = "failed"
            elif status and not status.get("completed") and status.get("status_str") != "success":
                state = "running"
            return {"promptId": prompt_id, "state": state, "files": output_files(record) if state == "completed" else [],
                    "message": "Workflow execution failed; inspect the ComfyUI server log" if state == "failed" else ""}
        queue = self._request(endpoint, token, "GET", "/queue")
        for name, state in (("queue_running", "running"), ("queue_pending", "queued")):
            for index, item in enumerate(queue.get(name) or []):
                if isinstance(item, list) and len(item) > 1 and item[1] == prompt_id:
                    return {"promptId": prompt_id, "state": state, "queuePosition": index + 1, "files": []}
        return {"promptId": prompt_id, "state": "unknown", "files": [],
                "message": "Task is absent from queue/history; it may have been removed. No automatic resubmission."}

    def recover(self, endpoint, token, payload):
        request_id = validate_id(payload.get("requestId"))
        with self._lock:
            cached = dict(self._submissions.get((endpoint, request_id)) or {})
        if cached.get("promptId"):
            return cached
        queue = self._request(endpoint, token, "GET", "/queue")
        for name in ("queue_running", "queue_pending"):
            for item in queue.get(name) or []:
                if isinstance(item, list) and len(item) > 3 and isinstance(item[3], dict) and item[3].get("aic_request_id") == request_id:
                    return {"requestId": request_id, "promptId": str(item[1]), "state": "running" if name == "queue_running" else "queued"}
        history = self._request(endpoint, token, "GET", "/history", params={"max_items": 100})
        for prompt_id, record in history.items():
            prompt = record.get("prompt") if isinstance(record, dict) else None
            if isinstance(prompt, list) and len(prompt) > 3 and isinstance(prompt[3], dict) and prompt[3].get("aic_request_id") == request_id:
                return {"requestId": request_id, "promptId": prompt_id, "state": "queued"}
        return {"requestId": request_id, "promptId": "", "state": "unknown", "message": "Submission could not be recovered; do not submit again unless you confirm it was not accepted."}

    def cancel(self, endpoint, token, payload):
        prompt_id = validate_id(payload.get("promptId"))
        queue = self._request(endpoint, token, "GET", "/queue")
        pending = any(isinstance(item, list) and len(item) > 1 and item[1] == prompt_id for item in queue.get("queue_pending") or [])
        if pending:
            self._request(endpoint, token, "POST", "/queue", payload={"delete": [prompt_id]})
        status = self.history(endpoint, token, {"promptId": prompt_id})
        if pending and status["state"] == "unknown":
            return {"promptId": prompt_id, "state": "cancelled", "cancelled": True}
        return {**status, "cancelled": False,
                "message": "Only queued tasks can be cancelled here; running tasks require action in ComfyUI. Global interrupt is never called."}

    def view(self, endpoint, token, payload):
        prompt_id = validate_id(payload.get("promptId"))
        record = self._record(endpoint, token, prompt_id)
        output = next((f for f in output_files(record) if f["key"] == payload.get("fileKey")), None)
        if output is None:
            raise ComfyError("Output is not present in this task history", 404)
        params = {key: output[key] for key in ("filename", "subfolder", "type")}
        body = self._request(endpoint, token, "GET", "/view", params=params, media=True)
        return {"kind": "binary", "status": 200, "body": body, "contentType": output["mimeType"],
                "headers": {"X-Content-Type-Options": "nosniff", "Cache-Control": "no-store"}}

    def upload(self, endpoint, token, payload):
        mime = str(payload.get("mimeType") or "")
        ext = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}.get(mime)
        if not ext:
            raise ComfyError("Only PNG, JPEG and WebP uploads are supported")
        raw = payload.get("base64")
        if not isinstance(raw, str) or len(raw) > 11 * 1024 * 1024:
            raise ComfyError("Image exceeds 8 MB upload limit", 413)
        body = base64.b64decode(raw, validate=True)
        if not body or len(body) > 8 * 1024 * 1024:
            raise ComfyError("Image exceeds 8 MB upload limit", 413)
        filename = "canvas-" + hashlib.sha256(body).hexdigest()[:24] + ext
        result = self._request(endpoint, token, "POST", "/upload/image", files={"image": (filename, body, mime)})
        name, subfolder = str(result.get("name") or ""), str(result.get("subfolder") or "")
        if not name or any(c in name for c in ("/", "\\", ":", "\x00")) or ":" in subfolder or "\x00" in subfolder or ".." in subfolder or subfolder.startswith(("/", "\\")) or "\\" in subfolder:
            raise ComfyError("Invalid uploaded image reference", 502)
        return {"name": name, "subfolder": subfolder, "value": (subfolder + "/" if subfolder else "") + name}
