"""Private one-shot parser protocol. Invoked only by the document route service."""
import ctypes
import json
import os
from pathlib import Path
import sys

# Direct execution with Python -I needs an explicit trusted project root.
if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.services.story_document_extractor import DocumentError, FILE_LIMIT, extract_document

MEMORY_LIMIT = 512 * 1024 * 1024
CPU_SECONDS = 20
_WINDOWS_JOB = None


def _windows_limits():
    from ctypes import wintypes

    class BasicLimit(ctypes.Structure):
        _fields_ = [("PerProcessUserTimeLimit", ctypes.c_int64), ("PerJobUserTimeLimit", ctypes.c_int64),
                    ("LimitFlags", wintypes.DWORD), ("MinimumWorkingSetSize", ctypes.c_size_t),
                    ("MaximumWorkingSetSize", ctypes.c_size_t), ("ActiveProcessLimit", wintypes.DWORD),
                    ("Affinity", ctypes.c_size_t), ("PriorityClass", wintypes.DWORD), ("SchedulingClass", wintypes.DWORD)]

    class IoCounters(ctypes.Structure):
        _fields_ = [(name, ctypes.c_uint64) for name in ("ReadOperationCount", "WriteOperationCount", "OtherOperationCount",
                                                       "ReadTransferCount", "WriteTransferCount", "OtherTransferCount")]

    class ExtendedLimit(ctypes.Structure):
        _fields_ = [("BasicLimitInformation", BasicLimit), ("IoInfo", IoCounters),
                    ("ProcessMemoryLimit", ctypes.c_size_t), ("JobMemoryLimit", ctypes.c_size_t),
                    ("PeakProcessMemoryUsed", ctypes.c_size_t), ("PeakJobMemoryUsed", ctypes.c_size_t)]

    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    kernel.CreateJobObjectW.restype = wintypes.HANDLE
    kernel.SetInformationJobObject.argtypes = [wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD]
    kernel.SetInformationJobObject.restype = wintypes.BOOL
    kernel.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    kernel.AssignProcessToJobObject.restype = wintypes.BOOL
    kernel.GetCurrentProcess.argtypes = []
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    kernel.CloseHandle.argtypes = [wintypes.HANDLE]
    kernel.CloseHandle.restype = wintypes.BOOL
    job = kernel.CreateJobObjectW(None, None)
    if not job:
        raise DocumentError("无法建立文档工作进程资源限制。", 503)
    limits = ExtendedLimit()
    limits.BasicLimitInformation.LimitFlags = 0x100 | 0x8 | 0x2  # process memory, active processes, CPU time
    limits.BasicLimitInformation.ActiveProcessLimit = 1
    limits.BasicLimitInformation.PerProcessUserTimeLimit = CPU_SECONDS * 10000000
    limits.ProcessMemoryLimit = MEMORY_LIMIT
    if not kernel.SetInformationJobObject(job, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
        kernel.CloseHandle(job)
        raise DocumentError("无法设置文档工作进程资源限制。", 503)
    if not kernel.AssignProcessToJobObject(job, kernel.GetCurrentProcess()):
        kernel.CloseHandle(job)
        raise DocumentError("当前 Windows 进程策略不允许文档资源隔离。", 503)
    # Keep the handle alive until process exit; do not release the limit early.
    global _WINDOWS_JOB
    _WINDOWS_JOB = job


def configure_limits():
    if os.name == "nt":
        _windows_limits()
        return
    try:
        import resource
        resource.setrlimit(resource.RLIMIT_AS, (MEMORY_LIMIT, MEMORY_LIMIT))
        resource.setrlimit(resource.RLIMIT_CPU, (CPU_SECONDS, CPU_SECONDS + 1))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    except (ImportError, OSError, ValueError) as exc:
        raise DocumentError("当前系统不支持文档工作进程资源限制。", 503) from exc


def main():
    try:
        configure_limits()
        input_stream = sys.stdin.buffer
        # The trusted parent sends one JSON header line followed by raw bytes.
        header = input_stream.readline(1024)
        metadata = json.loads(header)
        data = input_stream.read(FILE_LIMIT + 1)
        result = {"ok": True, "data": extract_document(data, metadata.get("extension"))}
    except DocumentError as exc:
        result = {"ok": False, "code": exc.code, "message": str(exc)}
    except MemoryError:
        result = {"ok": False, "code": 413, "message": "文档解析超出内存上限，请拆分文档。"}
    except Exception:
        result = {"ok": False, "code": 422, "message": "文档解析失败，请检查文件或转换为 TXT。"}
    sys.stdout.buffer.write(json.dumps(result, ensure_ascii=True).encode("ascii"))
    sys.stdout.buffer.flush()


if __name__ == "__main__":
    main()
