"""Cross-platform path checks: reject Windows paths even when tests run on POSIX."""
import ntpath
import os
import re

_WINDOWS_RESERVED = re.compile(r"^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)", re.I)

def safe_json_filename(name):
    if not isinstance(name, str) or not name.lower().endswith(".json"):
        return False
    if not name[:-5] or name != name.strip() or ".." in name:
        return False
    if any(ord(char) < 32 for char in name) or any(char in name for char in '/\\:*?"<>|%'):
        return False
    return not _WINDOWS_RESERVED.match(name)

def confined_path(root, relative):
    if not isinstance(relative, str) or not relative or ntpath.isabs(relative) or ntpath.splitdrive(relative)[0]:
        raise ValueError("Invalid relative path")
    if "\\" in relative or "\x00" in relative or ":" in relative:
        raise ValueError("Invalid path separator")
    parts = relative.split("/")
    if any(part in ("", ".", "..") or part.rstrip(" .") != part for part in parts):
        raise ValueError("Invalid path component")
    root = os.path.realpath(os.path.abspath(root))
    candidate = os.path.realpath(os.path.join(root, *parts))
    try:
        if os.path.normcase(os.path.commonpath([root, candidate])) != os.path.normcase(root):
            raise ValueError("Path escapes the allowed directory")
    except (ValueError, OSError) as exc:
        raise ValueError("Path escapes the allowed directory") from exc
    return candidate

def confined_json_path(root, filename):
    if not safe_json_filename(filename):
        raise ValueError("Invalid JSON filename")
    return confined_path(root, filename)
