"""Read-only previews of trusted legacy default roots passed by the desktop host.

No renderer-provided paths are accepted. Preview fingerprints bind the displayed
source metadata and current destinations to the later explicit copy request.
"""

import hashlib
import json
import os

from backend.services.file_save_migration import inspect_source, validate_copy_steps

LEGACY_BUCKETS = (
    ("canvasDir", "旧版画布项目"),
    ("outputDir", "旧版输出文件"),
    ("dataDir", "旧版数据与素材"),
)


def inspect_legacy_roots(legacy_sets, current_paths):
    candidates = []
    for index, paths in enumerate(legacy_sets):
        if not isinstance(paths, dict) or any(not paths.get(key) for key, _ in LEGACY_BUCKETS):
            continue
        sources = {key: os.path.abspath(paths[key]) for key, _ in LEGACY_BUCKETS}
        targets = {key: os.path.abspath(current_paths[key]) for key, _ in LEGACY_BUCKETS}
        try:
            source_root = os.path.commonpath(tuple(sources.values()))
        except ValueError:
            source_root = os.path.dirname(sources["canvasDir"])
        candidate = {
            "id": f"legacy-{index}",
            "sourceRoot": source_root,
            "sourcePaths": sources,
            "targetPaths": targets,
            "fileCount": 0,
            "fingerprint": "",
            "error": "",
            "steps": [],
            "snapshots": [],
        }
        try:
            steps = validate_copy_steps([
                {"key": key, "label": label, "src": sources[key], "dst": targets[key]}
                for key, label in LEGACY_BUCKETS
            ])
            snapshots = [inspect_source(step["src"]) for step in steps]
            count = sum(snapshot[0] for snapshot in snapshots)
            candidate["steps"] = steps
            candidate["snapshots"] = snapshots
            candidate["fileCount"] = count
            if count:
                payload = [(step["key"], step["src"], step["dst"], snap)
                           for step, snap in zip(steps, snapshots)]
                candidate["fingerprint"] = hashlib.sha256(
                    json.dumps(payload, ensure_ascii=False).encode("utf-8")
                ).hexdigest()
        except (OSError, ValueError) as exc:
            candidate["error"] = str(exc)
        if candidate["fileCount"] or candidate["error"]:
            candidates.append(candidate)
    return candidates


def public_legacy_candidates(candidates):
    return [{key: value for key, value in candidate.items()
             if key not in ("steps", "snapshots")}
            for candidate in candidates]


def resolve_legacy_candidate(candidates, candidate_id, fingerprint):
    candidate = next((item for item in candidates if item["id"] == candidate_id), None)
    if not candidate or not candidate["fileCount"] or candidate["error"]:
        raise ValueError("旧版目录不存在或不可安全复制，请重新扫描")
    if not fingerprint or fingerprint != candidate["fingerprint"]:
        raise ValueError("旧版目录或目标位置已变化，请重新扫描并确认")
    return candidate
