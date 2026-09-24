"""Local, authenticated, bounded text extraction; no filesystem paths or remote URLs."""
import json
from pathlib import Path
import subprocess
import sys
import threading
import time

from backend.services.story_document_extractor import FILE_LIMIT

DOCUMENT_ROUTE = "/api/v2/story-workspace/document/extract"
WORKER_TIMEOUT = 35
RESPONSE_LIMIT = 8 * 1024 * 1024


class StoryDocumentRouteService:
    def __init__(self):
        self._slot = threading.BoundedSemaphore(1)

    @staticmethod
    def _error(code, message):
        return {"kind": "json_err", "code": code, "message": message}

    def handle_post(self, handler, path):
        if path != DOCUMENT_ROUTE:
            return None
        if not self._slot.acquire(blocking=False):
            handler.close_connection = True
            return self._error(429, "已有文档正在提取，请稍后手动重试。")
        try:
            # Require a bounded, known-length binary body. Do not let the shared
            # chunked-body helper allocate an unbounded chunk before checking size.
            handler.close_connection = True
            if handler.headers.get("Transfer-Encoding"):
                return self._error(400, "文档上传不支持分块传输。")
            length_header = handler.headers.get("Content-Length", "")
            if not length_header.isdigit():
                return self._error(411, "文档上传需要 Content-Length。")
            length = int(length_header)
            if not 0 < length <= FILE_LIMIT:
                return self._error(413, "文档必须非空且不超过 8MB。")
            mime = handler.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            extension = {"application/pdf": ".pdf",
                         "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"}.get(mime)
            if not extension:
                return self._error(415, "仅支持 DOCX 和 PDF。")
            try:
                data = self._read_upload(handler, length)
            except (OSError, TimeoutError):
                return self._error(408, "文档上传超时。")
            if len(data) != length:
                return self._error(400, "文档上传不完整。")
            if extension == ".pdf" and not data.startswith(b"%PDF-"):
                return self._error(422, "PDF 文件签名不正确。")
            if extension == ".docx" and not data.startswith(b"PK\x03\x04"):
                return self._error(422, "DOCX 文件签名不正确；旧版 DOC 不受支持。")
            return self._run_worker(data, extension)
        except (OSError, ValueError, subprocess.SubprocessError):
            return self._error(503, "无法启动文档工作进程，请检查当前 Python 后端运行环境。")
        finally:
            self._slot.release()

    @staticmethod
    def _read_upload(handler, length):
        deadline, chunks, remaining = time.monotonic() + 15, [], length
        # BufferedReader.read1 performs at most one raw read, so slow trickle
        # uploads cannot reset an idle timeout indefinitely.
        while remaining:
            timeout = deadline - time.monotonic()
            if timeout <= 0:
                raise TimeoutError("upload deadline")
            handler.connection.settimeout(timeout)
            chunk = handler.rfile.read1(min(65536, remaining))
            if not chunk:
                break
            chunks.append(chunk)
            remaining -= len(chunk)
        return b"".join(chunks)

    def _run_worker(self, data, extension):
        worker_path = Path(__file__).with_name("story_document_worker.py")
        if getattr(sys, "frozen", False):
            return self._error(503, "当前打包后端不支持独立文档工作进程，请启动源码版 Python 后端。")
        command = [sys.executable, "-I", "-u", str(worker_path)]
        payload = json.dumps({"extension": extension}).encode("ascii") + b"\n" + data
        # No shell, filename interpolation, temporary document, remote request or retry.
        with subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                              creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)) as process:
            try:
                stdout, _ = process.communicate(payload, timeout=WORKER_TIMEOUT)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate()
                return self._error(504, "文档提取超过 35 秒，工作进程已终止。请拆分文件或转换为 TXT。")
        if process.returncode != 0:
            return self._error(422, "文档工作进程已退出，可能超出资源限制或解析失败。请拆分文件。")
        if not stdout or len(stdout) > RESPONSE_LIMIT:
            return self._error(502, "文档工作进程返回的数据无效或过大。")
        try:
            result = json.loads(stdout)
        except (UnicodeError, ValueError):
            return self._error(502, "文档工作进程未返回有效结果。")
        if not isinstance(result, dict):
            return self._error(502, "文档工作进程返回格式错误。")
        if result.get("ok") is not True:
            code = result.get("code")
            if code not in (400, 413, 415, 422, 503):
                code = 422
            return self._error(code, str(result.get("message") or "文档提取失败。"))
        data = result.get("data")
        if not isinstance(data, dict) or not isinstance(data.get("text"), str) or not data["text"].strip():
            return self._error(422, "未提取到有效文本。")
        return {"kind": "json_ok", "data": data}
