"""Explicit public frontend assets; runtime data is never a repository-root fallback."""
import os
from urllib.parse import unquote, urlsplit
from backend.services.path_security import confined_path

PUBLIC_FILES = {"index.html", "main.js", "style.css", "favicon.ico"}
PUBLIC_DIRECTORIES = {"src", "api", "styles", "assets", "images", "icons", "fonts", "vendor"}
PUBLIC_EXTENSIONS = {".js", ".mjs", ".css", ".json", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".avif", ".woff", ".woff2", ".ttf", ".otf", ".wasm", ".mp3", ".mp4", ".webm"}
PRIVATE_EXTENSIONS = {".json", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp", ".tif", ".tiff", ".heic", ".mp3", ".wav", ".ogg", ".opus", ".m4a", ".aac", ".flac", ".mp4", ".mov", ".mkv", ".webm", ".pdf"}

def resolve_static_file(url, app_root, private_roots):
    decoded = unquote(urlsplit(url).path)
    if not decoded.startswith("/") or decoded.startswith("//"):
        return None
    relative = decoded[1:] or "index.html"
    parts = relative.split("/")
    if any(not part or part.startswith(".") for part in parts) or "%" in relative:
        return None
    if any(part in {"__pycache__", "node_modules", "tests", "__tests__"} for part in parts):
        return None
    ext = os.path.splitext(relative)[1].lower()
    try:
        for prefix, root in private_roots:
            if relative.startswith(prefix):
                name = relative[len(prefix):]
                if ext not in PRIVATE_EXTENSIONS or ext == ".json" and prefix != "data/workflows/":
                    return None
                return confined_path(root, name), True
        if relative in PUBLIC_FILES or (parts[0] in PUBLIC_DIRECTORIES and len(parts) > 1 and ext in PUBLIC_EXTENSIONS):
            if ".test." in parts[-1] or ".spec." in parts[-1]:
                return None
            return confined_path(app_root, relative), False
    except (ValueError, OSError):
        return None
    return None
