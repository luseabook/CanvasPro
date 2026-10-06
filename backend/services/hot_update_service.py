import json
import os
import platform as runtime_platform
import re
import subprocess
import sys
import threading
import time
import urllib.request
import logging

_LOGGER = logging.getLogger(__name__)



class HotUpdateService:
    LOCAL_RELEASE_NOTES_FALLBACK = "本次更新未提供详细说明，请享受最新版本！"
    LOCAL_PREVIEW_VIDEO_FILE = "release_video_url.txt"
    RELEASE_NOTES_PREVIEW_VIDEO_RE = re.compile(
        r"^\[previewVideoUrl\]\s*:\s*(\S+)\s*$",
        re.IGNORECASE | re.MULTILINE,
    )

    def __init__(
        self,
        *,
        directory,
        local_version,
        is_dev_build,
        update_manifest_url="https://github.com/luseaer-ship-it/CanvasPro/releases/latest/download/latest.json",
        update_release_url="https://github.com/luseaer-ship-it/CanvasPro/releases/latest",
        update_branch="master",
        remote_priority=("origin", "github", "gitee"),
        update_interval_sec=30 * 60,
        initial_delay_sec=10,
        update_config_provider=None,
    ):
        self.directory = os.path.abspath(directory)
        self.local_version = str(local_version or "").strip()
        self._is_dev_build = is_dev_build if callable(is_dev_build) else (lambda: bool(is_dev_build))
        self.update_manifest_url = str(update_manifest_url or "").strip()
        self.update_release_url = str(update_release_url or "").strip()
        self.update_config_provider = update_config_provider if callable(update_config_provider) else None
        self.update_branch = str(update_branch or "master").strip() or "master"
        self.remote_priority = tuple(remote_priority or ("origin", "github", "gitee"))
        self.update_interval_sec = max(1.0, float(update_interval_sec or 30 * 60))
        self.initial_delay_sec = max(0.0, float(initial_delay_sec or 10))
        self._update_info = None
        self._update_lock = threading.Lock()

    @staticmethod
    def decode_proc_output(raw):
        if raw is None:
            return ""
        if isinstance(raw, str):
            return raw
        for enc in ("utf-8", "gbk"):
            try:
                return raw.decode(enc)
            except UnicodeDecodeError as exc:
                # 按该编码解码失败，尝试下一种编码
                _LOGGER.debug("按当前编码解码失败，尝试下一种: %s", exc)
                continue
        return raw.decode("utf-8", errors="replace")

    @staticmethod
    def normalize_version(value):
        return str(value or "").strip()

    @classmethod
    def version_parts(cls, value):
        text = cls.normalize_version(value).lstrip("vV")
        parts = re.findall(r"\d+", text)
        return tuple(int(part) for part in parts)

    @classmethod
    def is_remote_version_newer(cls, local_version, remote_version):
        local = cls.normalize_version(local_version)
        remote = cls.normalize_version(remote_version)
        if not remote or remote == local:
            return False
        local_parts = cls.version_parts(local)
        remote_parts = cls.version_parts(remote)
        if local_parts and remote_parts:
            length = max(len(local_parts), len(remote_parts))
            padded_remote = remote_parts + (0,) * (length - len(remote_parts))
            padded_local = local_parts + (0,) * (length - len(local_parts))
            return padded_remote > padded_local
        return remote != local

    @classmethod
    def is_local_version_newer(cls, local_version, remote_version):
        return cls.is_remote_version_newer(remote_version, local_version)

    def get_update_platform_key(self):
        if sys.platform.startswith("win"):
            return "windows-x64"
        if sys.platform == "darwin":
            machine = runtime_platform.machine().lower()
            if machine in ("arm64", "aarch64"):
                return "darwin-aarch64"
            return "darwin-x64"
        machine = runtime_platform.machine().lower()
        if machine in ("arm64", "aarch64"):
            return "linux-aarch64"
        return "linux-x64"

    def get_restart_script_path(self):
        if sys.platform.startswith("win"):
            return os.path.join(self.directory, "双击运行.bat")
        if sys.platform == "darwin":
            return os.path.join(self.directory, "双击启动.command")
        return None

    def get_git_remotes(self):
        try:
            remotes_raw = subprocess.check_output(
                ["git", "remote"],
                cwd=self.directory,
                stderr=subprocess.DEVNULL,
            )
            return self.decode_proc_output(remotes_raw).split()
        except Exception:
            return []

    def _git_worktree_snapshot(self):
        try:
            status = subprocess.run(
                ["git", "status", "--porcelain=v1", "--untracked-files=all"],
                cwd=self.directory,
                capture_output=True,
                timeout=10,
            )
            if status.returncode != 0:
                return None
            head = subprocess.run(
                ["git", "rev-parse", "--verify", "HEAD"],
                cwd=self.directory,
                capture_output=True,
                timeout=10,
            )
            if head.returncode != 0:
                return None
            return {
                "dirty": bool(self.decode_proc_output(status.stdout).strip()),
                "head": self.decode_proc_output(head.stdout).strip(),
            }
        except Exception:
            return None

    def select_git_remote(self, remotes=None):
        remotes = remotes if remotes is not None else self.get_git_remotes()
        for name in self.remote_priority:
            if name in remotes:
                return name
        return remotes[0] if remotes else None

    def _worktree_is_clean(self):
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain", "--untracked-files=all"],
                cwd=self.directory, capture_output=True, timeout=10,
            )
            return result.returncode == 0 and not result.stdout.strip()
        except Exception:
            return False

    def hot_update_status(self):
        if not os.path.isdir(os.path.join(self.directory, ".git")):
            return {
                "canHotApply": False,
                "remote": None,
                "restartScript": None,
                "reason": "当前不是可热更新包，缺少 .git 目录",
            }
        worktree = self._git_worktree_snapshot()
        if worktree is None:
            return {
                "canHotApply": False,
                "remote": None,
                "restartScript": None,
                "reason": "无法确认 Git 工作树状态，已禁用热更新",
            }
        if worktree["dirty"]:
            return {
                "canHotApply": False,
                "remote": None,
                "restartScript": None,
                "reason": "工作树有未提交或未跟踪文件，请先保存/提交后再热更新",
            }
        remote = self.select_git_remote()
        if not remote:
            return {
                "canHotApply": False,
                "remote": None,
                "restartScript": None,
                "reason": "当前包缺少 git remote，无法执行热更新",
            }
        restart_script = self.get_restart_script_path()
        if not restart_script:
            return {
                "canHotApply": False,
                "remote": remote,
                "restartScript": None,
                "reason": "当前平台暂不支持自动重启",
            }
        if not os.path.isfile(restart_script):
            return {
                "canHotApply": False,
                "remote": remote,
                "restartScript": restart_script,
                "reason": f"未找到当前平台启动脚本: {restart_script}",
            }
        if not self._worktree_is_clean():
            return {"canHotApply": False, "remote": remote, "restartScript": restart_script,
                    "reason": "工作区有未提交修改或无法检查状态，已禁用热更新。请先自行备份处理。"}
        return {
            "canHotApply": True,
            "remote": remote,
            "restartScript": restart_script,
            "reason": "",
        }

    def fetch_update_manifest(self):
        manifest_url = self.update_manifest_url
        if self.update_config_provider:
            try:
                config = self.update_config_provider()
                candidate = str(
                    (config or {}).get("update_manifest_url")
                    or (config or {}).get("updateManifestUrl")
                    or ""
                ).strip()
                if candidate:
                    manifest_url = candidate
            except Exception as exc:
                # 读取更新配置失败时忽略该覆盖
                _LOGGER.debug("读取更新配置失败: %s", exc)
        headers = {
            "User-Agent": "Canvas-AutoUpdate/2.0",
            "Accept": "application/json, application/octet-stream;q=0.9, */*;q=0.8",
        }
        req = urllib.request.Request(manifest_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def select_manifest_download_url(self, manifest):
        platforms = manifest.get("platforms") if isinstance(manifest, dict) else {}
        if not isinstance(platforms, dict):
            return ""
        entry = platforms.get(self.get_update_platform_key()) or {}
        if isinstance(entry, dict):
            return str(entry.get("url") or "").strip()
        return ""

    def read_local_release_notes(self):
        notes_path = os.path.join(self.directory, "release_notes.txt")
        try:
            with open(notes_path, "r", encoding="utf-8") as file:
                raw_notes = file.read()
        except Exception:
            return self.LOCAL_RELEASE_NOTES_FALLBACK
        notes = re.split(r"^---\s*$", raw_notes, maxsplit=1, flags=re.MULTILINE)[0].strip()
        notes = self.RELEASE_NOTES_PREVIEW_VIDEO_RE.sub("", notes).strip()
        return notes or self.LOCAL_RELEASE_NOTES_FALLBACK

    def read_local_preview_video_url(self):
        notes_path = os.path.join(self.directory, "release_notes.txt")
        try:
            with open(notes_path, "r", encoding="utf-8") as file:
                match = self.RELEASE_NOTES_PREVIEW_VIDEO_RE.search(file.read())
                if match:
                    return match.group(1).strip()
        except Exception as exc:
            # 读取 release notes 失败时回落其它来源
            _LOGGER.debug("读取 release 说明失败: %s", exc)

        video_path = os.path.join(self.directory, self.LOCAL_PREVIEW_VIDEO_FILE)
        try:
            with open(video_path, "r", encoding="utf-8") as file:
                for line in file:
                    value = line.strip()
                    if value and not value.startswith("#"):
                        return value
        except Exception:
            return ""
        return ""

    @staticmethod
    def get_manifest_preview_video_url(manifest):
        if not isinstance(manifest, dict):
            return ""
        for key in ("previewVideoUrl", "preview_video_url", "videoUrl"):
            value = str(manifest.get(key) or "").strip()
            if value:
                return value
        return ""

    def build_local_update_preview(self):
        version = self.local_version or "V_unknown"
        info = {
            "hasUpdate": False,
            "previewOnly": True,
            "localVersion": version,
            "remoteVersion": version,
            "pubDate": "",
            "message": f"本地更新预览 {version}",
            "notes": self.read_local_release_notes(),
            "downloadUrl": "",
            "releaseUrl": "",
            "canHotApply": False,
            "hotApplyReason": "本地预览不会执行真实更新",
            "platform": self.get_update_platform_key(),
            "remoteCommit": "",
        }
        preview_video_url = self.read_local_preview_video_url()
        if preview_video_url:
            info["previewVideoUrl"] = preview_video_url
        return info

    def build_update_info(self, manifest, include_current=False):
        if not isinstance(manifest, dict):
            return None
        remote_version = self.normalize_version(manifest.get("version"))
        git_info = manifest.get("git") if isinstance(manifest.get("git"), dict) else {}
        has_update = self.is_remote_version_newer(self.local_version, remote_version)
        if not has_update and not include_current:
            return None
        if has_update:
            message = f"发现新版本 {remote_version}"
        elif self.is_local_version_newer(self.local_version, remote_version):
            message = f"本地版本高于线上发布 {remote_version}"
        else:
            message = f"当前已是最新版本 {self.local_version}"
        hot = self.hot_update_status()
        release_url = str(manifest.get("release_url") or self.update_release_url).strip()
        download_url = self.select_manifest_download_url(manifest) or release_url
        info = {
            "hasUpdate": has_update,
            "localVersion": self.local_version,
            "remoteVersion": remote_version,
            "pubDate": str(manifest.get("pub_date") or "").strip(),
            "message": message,
            "notes": str(manifest.get("notes") or "").strip(),
            "downloadUrl": download_url,
            "releaseUrl": release_url,
            "canHotApply": bool(has_update and hot.get("canHotApply")),
            "hotApplyReason": hot.get("reason") or "",
            "platform": self.get_update_platform_key(),
            "remoteCommit": str(git_info.get("commit") or "").strip(),
        }
        preview_video_url = self.get_manifest_preview_video_url(manifest)
        if preview_video_url:
            info["previewVideoUrl"] = preview_video_url
        return info

    def get_cached_update_info(self):
        with self._update_lock:
            if isinstance(self._update_info, dict):
                return dict(self._update_info)
            return None

    def _set_cached_update_info(self, info):
        with self._update_lock:
            self._update_info = dict(info) if isinstance(info, dict) else None

    def do_update_check(self, force=False, include_current=False):
        if self._is_dev_build() and not force:
            self._set_cached_update_info(None)
            return None
        try:
            manifest = self.fetch_update_manifest()
            info = self.build_update_info(manifest, include_current=include_current)
            self._set_cached_update_info(info)
        except Exception:
            self._set_cached_update_info(None)
        return self.get_cached_update_info()

    def check_for_updates(self, force=False, include_current=False):
        return self.do_update_check(force=force, include_current=include_current)

    def update_check_loop(self):
        time.sleep(self.initial_delay_sec)
        while True:
            self.do_update_check()
            time.sleep(self.update_interval_sec)

    def _schedule_restart(self, restart_script):
        def _restart():
            time.sleep(0.8)
            if sys.platform.startswith("win"):
                os.startfile(restart_script)
            elif sys.platform == "darwin":
                subprocess.Popen(["open", restart_script], cwd=self.directory)
            else:
                subprocess.Popen([restart_script], cwd=self.directory)
            time.sleep(0.3)
            os._exit(0)

        threading.Thread(target=_restart, daemon=True, name="HotUpdateRestart").start()

    def apply_hot_update(self):
        hot = self.hot_update_status()
        if not hot.get("canHotApply"):
            return {"success": False, "error": hot.get("reason") or "当前环境不支持热更新"}
        remote = hot.get("remote")
        restart_script = hot.get("restartScript")

        initial_state = self._git_worktree_snapshot()
        if initial_state is None or initial_state["dirty"]:
            return {"success": False, "error": "工作树状态已变化或不干净，已取消热更新"}

        fetch = subprocess.run(
            ["git", "fetch", remote, self.update_branch],
            cwd=self.directory,
            capture_output=True,
            timeout=60,
        )
        if fetch.returncode != 0:
            err = self.decode_proc_output(fetch.stderr).strip() or self.decode_proc_output(fetch.stdout).strip()
            return {"success": False, "error": err}

        current_state = self._git_worktree_snapshot()
        if current_state is None or current_state["dirty"] or current_state["head"] != initial_state["head"]:
            return {"success": False, "error": "更新期间工作树发生变化，未覆盖本地改动"}
        target = subprocess.run(
            ["git", "rev-parse", "--verify", "FETCH_HEAD"],
            cwd=self.directory,
            capture_output=True,
            timeout=10,
        )
        if target.returncode != 0:
            err = self.decode_proc_output(target.stderr).strip() or self.decode_proc_output(target.stdout).strip()
            return {"success": False, "error": err or "无法解析更新提交"}
        ancestry = subprocess.run(
            ["git", "merge-base", "--is-ancestor", initial_state["head"], "FETCH_HEAD"],
            cwd=self.directory,
            capture_output=True,
            timeout=10,
        )
        if ancestry.returncode != 0:
            return {"success": False, "error": "远端更新不是当前提交的快进后代，拒绝覆盖本地提交"}
        merge = subprocess.run(
            ["git", "merge", "--ff-only", "FETCH_HEAD"],
            cwd=self.directory,
            capture_output=True,
            timeout=60,
        )
        if merge.returncode != 0:
            err = self.decode_proc_output(merge.stderr).strip() or self.decode_proc_output(merge.stdout).strip()
            return {"success": False, "error": err or "快进更新失败"}

        if not restart_script or not os.path.isfile(restart_script):
            return {"success": False, "error": f"未找到当前平台启动脚本: {restart_script}"}

        self._schedule_restart(restart_script)
        return {"success": True}
