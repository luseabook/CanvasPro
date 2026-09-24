"""Conservative, copy-only file-save migration primitives.

No source file is moved or removed. A destination is installed by exclusive hard link
from a complete temporary copy; unsupported filesystems fail rather than overwrite.
The caller alone decides whether to change active settings after verify_copies().
"""

import hashlib
import os
import stat
import tempfile

_CHUNK_SIZE = 1024 * 1024


def _key(path):
    return os.path.normcase(os.path.realpath(os.path.abspath(path)))


def _overlap(left, right):
    left, right = _key(left), _key(right)
    try:
        common = os.path.commonpath((left, right))
    except ValueError:  # Different Windows drives.
        return False
    return common == left or common == right


def _link_or_junction(path):
    is_junction = getattr(os.path, "isjunction", None)
    return os.path.islink(path) or bool(is_junction and is_junction(path))


def validate_copy_steps(steps):
    """Reject aliases, nested sources/targets and target/source swaps before writing."""
    roots = []
    active = []
    for step in steps:
        src, dst = os.path.abspath(step["src"]), os.path.abspath(step["dst"])
        roots.append(src)
        if os.path.normcase(src) == os.path.normcase(dst):
            continue
        if _key(src) == _key(dst):
            raise ValueError("迁移源目录和目标目录指向同一位置")
        if _link_or_junction(src):
            raise ValueError("不支持迁移目录符号链接或目录联接")
        if os.path.lexists(src) and not os.path.isdir(src):
            raise ValueError("旧保存路径不是目录")
        active.append({**step, "src": src, "dst": dst})

    for index, step in enumerate(active):
        if any(_overlap(step["dst"], src) for src in roots):
            raise ValueError("新目录与旧目录重叠，无法安全复制；请选择独立目录")
        for other in active[index + 1 :]:
            if _overlap(step["src"], other["src"]) or _overlap(step["dst"], other["dst"]):
                raise ValueError("迁移目录相互重叠，无法安全复制")
    return active


def _iter_regular_files(root):
    if not os.path.lexists(root):
        return
    if _link_or_junction(root) or not os.path.isdir(root):
        raise ValueError("旧保存目录不可读取或是符号链接")

    def raise_walk_error(exc):
        raise exc

    for current, dirs, files in os.walk(root, onerror=raise_walk_error, followlinks=False):
        dirs.sort()
        files.sort()
        for dirname in dirs:
            folder = os.path.join(current, dirname)
            if _link_or_junction(folder) or not os.path.isdir(folder):
                raise ValueError("旧保存目录包含链接或非目录项目")
        for filename in files:
            source = os.path.join(current, filename)
            info = os.stat(source, follow_symlinks=False)
            if not stat.S_ISREG(info.st_mode):
                raise ValueError("旧保存目录包含链接或非普通文件")
            yield os.path.relpath(source, root), source, info


def inspect_source(root):
    """Bounded-memory metadata snapshot; rechecked before activating new paths."""
    digest = hashlib.sha256()
    count = 0
    for relative, _, info in _iter_regular_files(root):
        count += 1
        fingerprint = (relative, info.st_size, info.st_mtime_ns, info.st_dev, info.st_ino)
        digest.update(repr(fingerprint).encode("utf-8", "surrogateescape"))
        digest.update(b"\0")
    return count, digest.hexdigest()


def _file_digest(path):
    before = os.stat(path, follow_symlinks=False)
    if not stat.S_ISREG(before.st_mode):
        raise ValueError("目标或源文件不是普通文件")
    flags = os.O_RDONLY | getattr(os, "O_BINARY", 0) | getattr(os, "O_NOFOLLOW", 0)
    fd = os.open(path, flags)
    digest = hashlib.sha256()
    with os.fdopen(fd, "rb") as stream:
        opened = os.fstat(stream.fileno())
        if (opened.st_dev, opened.st_ino) != (before.st_dev, before.st_ino):
            raise RuntimeError("迁移期间文件发生变化")
        while True:
            chunk = stream.read(_CHUNK_SIZE)
            if not chunk:
                break
            digest.update(chunk)
    after = os.stat(path, follow_symlinks=False)
    if (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns) != (
        before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns
    ):
        raise RuntimeError("迁移期间文件发生变化")
    return digest.digest(), before.st_size


def _identical_files(src, dst):
    return _file_digest(src) == _file_digest(dst)


def copy_one_file(src, dst):
    """Return (copied|skipped, byte_count), never replacing an existing target."""
    if os.path.lexists(dst):
        if _identical_files(src, dst):
            return "skipped", 0
        raise FileExistsError("目标已有不同内容的同名文件，请先人工处理冲突")

    parent = os.path.dirname(dst)
    os.makedirs(parent, exist_ok=True)
    if _link_or_junction(parent):
        raise ValueError("目标目录包含符号链接或目录联接")
    fd, temporary = tempfile.mkstemp(prefix=".aic-migration-", suffix=".tmp", dir=parent)
    try:
        source_digest, source_size = _file_digest(src)
        digest = hashlib.sha256()
        source_stream = open(src, "rb")
        try:
            target_stream = os.fdopen(fd, "wb")
        except Exception:
            source_stream.close()
            raise
        fd = -1
        with source_stream as source, target_stream as target:
            while True:
                chunk = source.read(_CHUNK_SIZE)
                if not chunk:
                    break
                target.write(chunk)
                digest.update(chunk)
            target.flush()
            os.fsync(target.fileno())
        if digest.digest() != source_digest or _file_digest(src) != (source_digest, source_size):
            raise RuntimeError("复制期间源文件发生变化")
        source_info = os.stat(src, follow_symlinks=False)
        if not stat.S_ISREG(source_info.st_mode):
            raise ValueError("复制期间源文件类型发生变化")
        # Preserve mtime for existing project lists. Set read-only permissions
        # only after unlinking the private staging name (Windows cannot unlink
        # a read-only hard link).
        os.utime(temporary, ns=(source_info.st_atime_ns, source_info.st_mtime_ns))
        try:
            os.link(temporary, dst)
        except FileExistsError:
            if _identical_files(src, dst):
                return "skipped", 0
            raise FileExistsError("目标已有不同内容的同名文件，请先人工处理冲突")
        if not _identical_files(src, dst):
            raise RuntimeError("复制后校验不一致，保存路径未切换")
    finally:
        if fd != -1:
            os.close(fd)
        if os.path.lexists(temporary):
            os.unlink(temporary)
    os.chmod(dst, stat.S_IMODE(source_info.st_mode))
    return "copied", source_size


def _assert_no_target_links(root, target):
    current = os.path.abspath(root)
    if _link_or_junction(current):
        raise ValueError("目标目录是符号链接或目录联接")
    relative = os.path.relpath(os.path.dirname(target), current)
    if relative == ".." or relative.startswith(".." + os.sep) or os.path.isabs(relative):
        raise ValueError("迁移目标超出选择的目录")
    if relative != ".":
        for part in relative.split(os.sep):
            current = os.path.join(current, part)
            if _link_or_junction(current):
                raise ValueError("目标目录包含符号链接或目录联接")


def copy_tree(src, dst, on_file=None):
    for relative, source, _ in _iter_regular_files(src):
        target = os.path.join(dst, relative)
        try:
            _assert_no_target_links(dst, target)
            result, byte_count = copy_one_file(source, target)
        except Exception as exc:
            if on_file:
                on_file(relative, "failed", 0, exc)
            raise
        if on_file:
            on_file(relative, result, byte_count, None)


def verify_copies(steps, snapshots):
    """Abort settings activation when source list/metadata changed or bytes differ."""
    if len(steps) != len(snapshots):
        raise ValueError("迁移源目录快照不完整")
    for step, expected in zip(steps, snapshots):
        if inspect_source(step["src"]) != expected:
            raise RuntimeError("迁移期间旧目录发生变化；未切换保存路径，请暂停写入后重试")
        for relative, source, _ in _iter_regular_files(step["src"]):
            target = os.path.join(step["dst"], relative)
            _assert_no_target_links(step["dst"], target)
            if not os.path.lexists(target) or not _identical_files(source, target):
                raise RuntimeError("复制结果校验失败；保存路径未切换")
