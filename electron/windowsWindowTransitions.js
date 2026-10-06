import { execFile } from 'node:child_process';
import { resolveWindowsSystemToolPath } from './windowsSystemTools.js';
export async function disableWindowsWindowTransitions(
  targetWindow,
  {
    platform: platform = process.platform,
    ownerPid: ownerPid = process.pid,
    execFileFn: execFileFn = execFile,
  } = {},
) {
  if (platform !== 'win32') return { ok: true, skipped: true };
  if (targetWindow?.isDestroyed?.()) return { ok: false, reason: 'window-unavailable' };
  let windowHandle;
  try {
    const rawHandle = targetWindow?.getNativeWindowHandle?.();
    if (!Buffer.isBuffer(rawHandle) || ![4, 8].includes(rawHandle.length))
      throw new Error('invalid-handle');
    windowHandle =
      rawHandle.length === 8 ? rawHandle.readBigUInt64LE() : BigInt(rawHandle.readUInt32LE());
    if (
      windowHandle <= 0x0n ||
      windowHandle > 0x7fffffffffffffffn ||
      !Number.isSafeInteger(ownerPid) ||
      ownerPid <= 0
    )
      throw new Error('invalid-handle');
  } catch {
    return { ok: false, reason: 'window-unavailable' };
  }
  const script =
    "\n$ErrorActionPreference = 'Stop'\nAdd-Type -TypeDefinition @'\nusing System;\nusing System.Runtime.InteropServices;\npublic static class ShuoWindowTransitions {\n  [DllImport(\"user32.dll\")]\n  private static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);\n  [DllImport(\"dwmapi.dll\")]\n  private static extern int DwmSetWindowAttribute(IntPtr hwnd, uint attribute, ref int value, uint size);\n  public static int Disable(long handle, uint expectedPid) {\n    IntPtr hwnd = new IntPtr(handle);\n    uint actualPid;\n    if (GetWindowThreadProcessId(hwnd, out actualPid) == 0 || actualPid != expectedPid) return -1;\n    int disabled = 1;\n    // DWMWA_TRANSITIONS_FORCEDISABLED = 3, BOOL occupies four bytes.\n    return DwmSetWindowAttribute(hwnd, 3, ref disabled, 4);\n  }\n}\n'@\n$result = [ShuoWindowTransitions]::Disable([long]::Parse('" +
    windowHandle +
    "'), [uint32]" +
    ownerPid +
    ')\nif ($result -ne 0) { throw "DwmSetWindowAttribute failed: $result" }\n[Console]::Out.WriteLine(\'APPLIED\')\n';
  return new Promise((resolve) => {
    const handleResult = (error, stdout) =>
      resolve(
        !error && String(stdout || '').trim() === 'APPLIED' && !targetWindow.isDestroyed?.()
          ? { ok: true }
          : { ok: false, reason: 'native-transitions-unavailable' },
      );
    try {
      execFileFn(
        resolveWindowsSystemToolPath('powershell'),
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-EncodedCommand',
          Buffer.from(script, 'utf16le').toString('base64'),
        ],
        { windowsHide: true, timeout: 5000, maxBuffer: 16384, encoding: 'utf8' },
        handleResult,
      );
    } catch (thrown) {
      handleResult(thrown);
    }
  });
}
