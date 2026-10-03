"""Atomic JSON commits, per-file serialization and last-known-good backups."""
import json
import os
import tempfile
import threading

_locks = {}
_locks_guard = threading.Lock()

class CorruptJSONError(ValueError):
    pass

def json_file_lock(path):
    key = os.path.normcase(os.path.realpath(os.path.abspath(path)))
    with _locks_guard:
        return _locks.setdefault(key, threading.RLock())

def _replace_bytes(path, content):
    parent = os.path.dirname(os.path.abspath(path))
    fd, temporary = tempfile.mkstemp(prefix=".aic-json-", suffix=".tmp", dir=parent)
    try:
        with os.fdopen(fd, "wb") as file:
            file.write(content)
            file.flush()
            os.fsync(file.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

def atomic_write_json(path, data, *, backup=True):
    path = os.path.abspath(path)
    content = (json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")
    with json_file_lock(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if os.path.exists(path):
            with open(path, "rb") as file:
                previous = file.read()
            try:
                json.loads(previous.decode("utf-8-sig"))
            except (ValueError, UnicodeError) as exc:
                raise CorruptJSONError("Existing JSON is damaged; it was preserved. Restore or back up the file before saving.") from exc
            if backup:
                _replace_bytes(path + ".bak", previous)
        _replace_bytes(path, content)
        # Directory syncing is supported on POSIX; Windows replacement is still atomic.
        if os.name != "nt":
            fd = os.open(os.path.dirname(path), os.O_RDONLY)
            try:
                os.fsync(fd)
            finally:
                os.close(fd)
