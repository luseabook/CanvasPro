import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Apps whose selection behaviour confuses the passive selection hook on Windows: they need the
// clipboard-cursor heuristic disabled / the delayed clipboard read enabled.
export const WINDOWS_FINE_TUNED_SELECTION_APPS = Object.freeze({
  excludeClipboardCursorDetect: ['acrobat.exe', 'wps.exe', 'cajviewer.exe'],
  includeClipboardDelayRead: ['acrobat.exe', 'wps.exe', 'cajviewer.exe', 'foxitphantom.exe'],
});

function loadDefaultSelectionHook() {
  return require('selection-hook');
}

// Long-lived PowerShell worker used on Windows when the native selection hook cannot deliver the
// selection: it waits for the shortcut chord to be released, synthesizes Ctrl+C, then reports
// whether the clipboard sequence number actually changed.
export const WINDOWS_CAPTURE_WORKER_SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class AicGlobalCopyInput {
  private const uint InputKeyboard = 1;
  private const uint KeyEventKeyUp = 0x0002;
  private const ushort VirtualKeyControl = 0x11;
  private const ushort VirtualKeyC = 0x43;

  [StructLayout(LayoutKind.Sequential)]
  private struct Input {
    public uint type;
    public InputUnion data;
  }

  [StructLayout(LayoutKind.Explicit)]
  private struct InputUnion {
    [FieldOffset(0)]
    public KeyboardInput keyboard;
    [FieldOffset(0)]
    public MouseInput mouse;
    [FieldOffset(0)]
    public HardwareInput hardware;
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct KeyboardInput {
    public ushort virtualKey;
    public ushort scanCode;
    public uint flags;
    public uint time;
    public UIntPtr extraInfo;
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct MouseInput {
    public int x;
    public int y;
    public uint mouseData;
    public uint flags;
    public uint time;
    public UIntPtr extraInfo;
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct HardwareInput {
    public uint message;
    public ushort lowParam;
    public ushort highParam;
  }

  [DllImport("user32.dll")]
  public static extern short GetAsyncKeyState(int virtualKey);

  [DllImport("user32.dll")]
  public static extern uint GetClipboardSequenceNumber();

  [DllImport("user32.dll", SetLastError = true)]
  private static extern uint SendInput(uint inputCount, Input[] inputs, int inputSize);

  private static Input CreateKeyInput(ushort virtualKey, bool keyUp) {
    Input input = new Input();
    input.type = InputKeyboard;
    input.data.keyboard.virtualKey = virtualKey;
    input.data.keyboard.flags = keyUp ? KeyEventKeyUp : 0;
    return input;
  }

  public static bool IsCaptureChordKeyDown() {
    int[] keys = new int[] {
      0x10, 0x11, 0x12, 0x43,
      0x5B, 0x5C,
      0xA0, 0xA1, 0xA2, 0xA3, 0xA4, 0xA5
    };
    foreach (int key in keys) {
      if ((GetAsyncKeyState(key) & 0x8000) != 0) return true;
    }
    return false;
  }

  public static bool SendCopy() {
    Input[] inputs = new Input[] {
      CreateKeyInput(VirtualKeyControl, false),
      CreateKeyInput(VirtualKeyC, false),
      CreateKeyInput(VirtualKeyC, true),
      CreateKeyInput(VirtualKeyControl, true)
    };
    return SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(Input))) == inputs.Length;
  }
}
'@

[Console]::Out.WriteLine('READY')
[Console]::Out.Flush()
while (($line = [Console]::In.ReadLine()) -ne $null) {
  if ($line -eq 'EXIT') { break }
  if (-not $line.StartsWith('COPY:')) { continue }
  $commandParts = $line.Split(':', 3)
  if ($commandParts.Length -ne 3) { continue }
  $requestId = $commandParts[1]
  $strategy = $commandParts[2]
  $status = 'NO_SELECTION'
  try {
    $keysReleased = $false
    for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
      if (-not [AicGlobalCopyInput]::IsCaptureChordKeyDown()) {
        $keysReleased = $true
        break
      }
      Start-Sleep -Milliseconds 10
    }
    if (-not $keysReleased) {
      $status = 'KEYS_HELD'
    } else {
      [Console]::Out.WriteLine('KEYS_RELEASED')
      [Console]::Out.Flush()
      $before = [AicGlobalCopyInput]::GetClipboardSequenceNumber()
      $copySent = $false
      if ($strategy -eq 'INPUT') {
        if (-not [AicGlobalCopyInput]::SendCopy()) {
          $status = 'SEND_FAILED'
        } else {
          $copySent = $true
        }
      } elseif ($strategy -eq 'SENDKEYS') {
        [System.Windows.Forms.SendKeys]::SendWait('^c')
        $copySent = $true
      } else {
        $status = 'INVALID_STRATEGY'
      }
      if ($copySent) {
        $clipboardWaitAttempts = if ($strategy -eq 'INPUT') { 60 } else { 100 }
        for ($clipboardAttempt = 0; $clipboardAttempt -lt $clipboardWaitAttempts; $clipboardAttempt += 1) {
          Start-Sleep -Milliseconds 10
          if ([AicGlobalCopyInput]::GetClipboardSequenceNumber() -ne $before) {
            $status = 'OK'
            break
          }
        }
      }
    }
  } catch {
    $status = 'FAILED'
  }
  [Console]::Out.WriteLine(('RESULT:{0}:{1}' -f $requestId, $status))
  [Console]::Out.Flush()
}
`.trim();

export function resolveWindowsCaptureWorkerCommand() {
  return {
    command: 'powershell.exe',
    args: [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      WINDOWS_CAPTURE_WORKER_SCRIPT,
    ],
  };
}

export function mapWindowsWorkerStatus(status) {
  if (status === 'OK') return { ok: true };
  if (status === 'NO_SELECTION') return { ok: false, reason: 'no-selection' };
  if (status === 'KEYS_HELD') return { ok: false, reason: 'shortcut-keys-still-held' };
  return { ok: false, reason: 'copy-command-failed', workerStatus: status };
}

export const WINDOWS_COPY_STRATEGIES = Object.freeze(['INPUT', 'SENDKEYS']);

export function shouldRetryWindowsCopy(result) {
  if (result?.reason === 'no-selection') return true;
  return (
    result?.reason === 'copy-command-failed' &&
    (result?.workerStatus === 'SEND_FAILED' || result?.workerStatus === 'FAILED')
  );
}

export function createSelectedTextCaptureController({
  platform = process.platform,
  spawnProcess = spawn,
  loadSelectionHook = loadDefaultSelectionHook,
  startupTimeoutMs = 3500,
  timeoutMs = 2500,
  windowsCopyStrategies = WINDOWS_COPY_STRATEGIES,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  onKeyReleased = () => {},
} = {}) {
  let destroyed = false;
  let requestSequence = 0;
  let worker = null;
  let selectionHook = null;
  let nativeUnavailable = false;
  const pendingCopies = new Map();
  const copyStrategies = Array.from(
    new Set(
      (Array.isArray(windowsCopyStrategies) ? windowsCopyStrategies : WINDOWS_COPY_STRATEGIES).filter(
        (strategy) => WINDOWS_COPY_STRATEGIES.includes(strategy),
      ),
    ),
  );
  if (copyStrategies.length === 0) copyStrategies.push(...WINDOWS_COPY_STRATEGIES);

  function settleWorkerReady(target, result) {
    if (target.readySettled) return;
    target.readySettled = true;
    if (target.startupTimer !== null) clearTimeoutFn(target.startupTimer);
    target.startupTimer = null;
    target.resolveReady(result);
  }

  function settlePendingCopy(requestId, result) {
    const pending = pendingCopies.get(requestId);
    if (!pending) return;
    pendingCopies.delete(requestId);
    clearTimeoutFn(pending.timer);
    pending.resolve(result);
  }

  function closeWorker(target, result, { kill = false } = {}) {
    if (!target || target.closed) return;
    target.closed = true;
    if (worker === target) worker = null;
    settleWorkerReady(target, result);
    pendingCopies.forEach((pending, requestId) => {
      if (pending.worker === target) settlePendingCopy(requestId, result);
    });
    if (kill)
      try {
        target.child.kill?.();
      } catch {}
  }

  function handleWorkerLine(target, line) {
    const trimmed = String(line || '').trim();
    if (!trimmed || target.closed) return;
    if (trimmed === 'KEYS_RELEASED') {
      onKeyReleased({ keysReleased: true });
      return;
    }
    if (trimmed === 'READY') {
      target.ready = true;
      settleWorkerReady(target, { ok: true });
      return;
    }
    const resultMatch = /^RESULT:([^:]+):([A-Z_]+)$/.exec(trimmed);
    if (!resultMatch) return;
    settlePendingCopy(resultMatch[1], mapWindowsWorkerStatus(resultMatch[2]));
  }

  function consumeWorkerOutput(target, chunk) {
    target.outputBuffer += String(chunk || '');
    let newlineIndex = target.outputBuffer.indexOf('\n');
    while (newlineIndex >= 0) {
      handleWorkerLine(target, target.outputBuffer.slice(0, newlineIndex));
      target.outputBuffer = target.outputBuffer.slice(newlineIndex + 1);
      newlineIndex = target.outputBuffer.indexOf('\n');
    }
  }

  function ensureWorker() {
    if (destroyed) return Promise.resolve({ ok: false, reason: 'capture-controller-destroyed' });
    if (worker && !worker.closed) return worker.readyPromise;
    const command = resolveWindowsCaptureWorkerCommand();
    let child = null;
    try {
      child = spawnProcess(command.command, command.args, {
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true,
      });
    } catch (error) {
      return Promise.resolve({
        ok: false,
        reason: 'copy-command-failed',
        error: String(error?.message || error || ''),
      });
    }
    const target = {
      child: child,
      closed: false,
      outputBuffer: '',
      ready: false,
      readySettled: false,
      resolveReady: null,
      startupTimer: null,
    };
    target.readyPromise = new Promise((resolve) => {
      target.resolveReady = resolve;
    });
    worker = target;
    child.stdout?.on?.('data', (chunk) => consumeWorkerOutput(target, chunk));
    child.stdin?.on?.('error', (error) => {
      closeWorker(target, {
        ok: false,
        reason: 'copy-command-failed',
        error: String(error?.message || error || ''),
      });
    });
    child.once?.('error', (error) => {
      closeWorker(target, {
        ok: false,
        reason: 'copy-command-failed',
        error: String(error?.message || error || ''),
      });
    });
    child.once?.('exit', (exitCode) => {
      closeWorker(target, { ok: false, reason: 'copy-command-failed', exitCode: Number(exitCode) });
    });
    target.startupTimer = setTimeoutFn(() => {
      closeWorker(target, { ok: false, reason: 'copy-worker-startup-timeout' }, { kill: true });
    }, startupTimeoutMs);
    return target.readyPromise;
  }

  function disposeSelectionHook() {
    const hook = selectionHook;
    selectionHook = null;
    if (!hook) return;
    try {
      hook.stop?.();
    } catch {}
    try {
      hook.cleanup?.();
    } catch {}
  }

  function ensureSelectionHook() {
    if (selectionHook) return { ok: true };
    if (nativeUnavailable || destroyed || !['win32', 'darwin', 'linux'].includes(platform))
      return { ok: false, reason: 'native-selection-unavailable' };
    let hook = null;
    try {
      const loaded = loadSelectionHook?.();
      const SelectionHook = loaded?.default || loaded;
      if (typeof SelectionHook !== 'function')
        return ((nativeUnavailable = true), { ok: false, reason: 'native-selection-unavailable' });
      hook = new SelectionHook();
      hook.on?.('error', () => {});
      hook.on?.('key-up', (payload) => {
        if (destroyed || (platform === 'win32' && Number(payload?.flags) & 0x10)) return;
        onKeyReleased(payload);
      });
      hook.setSelectionPassiveMode?.(true);
      const listTypes = SelectionHook.FineTunedListType || {};
      if (platform === 'win32' && typeof hook.setFineTunedList === 'function') {
        if (Number.isInteger(listTypes.EXCLUDE_CLIPBOARD_CURSOR_DETECT))
          hook.setFineTunedList(
            listTypes.EXCLUDE_CLIPBOARD_CURSOR_DETECT,
            WINDOWS_FINE_TUNED_SELECTION_APPS.excludeClipboardCursorDetect,
          );
        if (Number.isInteger(listTypes.INCLUDE_CLIPBOARD_DELAY_READ))
          hook.setFineTunedList(
            listTypes.INCLUDE_CLIPBOARD_DELAY_READ,
            WINDOWS_FINE_TUNED_SELECTION_APPS.includeClipboardDelayRead,
          );
      }
      if (hook.start?.() !== true) {
        try {
          hook.cleanup?.();
        } catch {}
        return ((nativeUnavailable = true), { ok: false, reason: 'native-selection-start-failed' });
      }
      selectionHook = hook;
      return { ok: true };
    } catch (error) {
      nativeUnavailable = true;
      try {
        hook?.stop?.();
      } catch {}
      try {
        hook?.cleanup?.();
      } catch {}
      return {
        ok: false,
        reason: 'native-selection-unavailable',
        error: String(error?.message || error || ''),
      };
    }
  }

  function requestWindowsCopy(target, strategy) {
    const requestId = String(++requestSequence);
    return new Promise((resolve) => {
      const timer = setTimeoutFn(() => {
        settlePendingCopy(requestId, { ok: false, reason: 'copy-command-timeout' });
        closeWorker(target, { ok: false, reason: 'copy-command-timeout' }, { kill: true });
      }, timeoutMs);
      pendingCopies.set(requestId, { resolve: resolve, timer: timer, worker: target });
      try {
        target.child.stdin?.write?.('COPY:' + requestId + ':' + strategy + '\n');
      } catch (error) {
        settlePendingCopy(requestId, {
          ok: false,
          reason: 'copy-command-failed',
          error: String(error?.message || error || ''),
        });
        closeWorker(target, { ok: false, reason: 'copy-command-failed' }, { kill: true });
      }
    });
  }

  async function captureWithWindowsWorker() {
    const ready = await ensureWorker();
    if (!ready?.ok) return ready;
    const target = worker;
    if (!target || target.closed || !target.ready)
      return { ok: false, reason: 'copy-worker-unavailable' };
    let result = { ok: false, reason: 'copy-command-failed' };
    for (let index = 0; index < copyStrategies.length; index += 1) {
      result = await requestWindowsCopy(target, copyStrategies[index]);
      if (result?.ok === true) return result;
      if (index >= copyStrategies.length - 1 || !shouldRetryWindowsCopy(result)) return result;
    }
    return result;
  }

  function readNativeSelection() {
    try {
      const selection = selectionHook.getCurrentSelection?.();
      const text = typeof selection?.text === 'string' ? selection.text : '';
      if (!text.trim()) return { ok: false, reason: 'no-selection' };
      return {
        ok: true,
        text: text,
        source: 'selection-hook',
        programName: String(selection?.programName || ''),
        method: Number(selection?.method) || 0,
      };
    } catch (error) {
      disposeSelectionHook();
      return {
        ok: false,
        reason: 'native-selection-failed',
        error: String(error?.message || error || ''),
      };
    }
  }

  async function captureOnWindows() {
    const hookStatus = ensureSelectionHook();
    if (!hookStatus.ok || !selectionHook) return captureWithWindowsWorker();
    const nativeResult = readNativeSelection();
    if (nativeResult?.ok) return nativeResult;
    return captureWithWindowsWorker();
  }

  async function prewarm() {
    const hookStatus = ensureSelectionHook();
    if (platform !== 'win32') return hookStatus;
    const workerStatus = await ensureWorker();
    return hookStatus?.ok || workerStatus?.ok ? { ok: true } : workerStatus || hookStatus;
  }

  function capture() {
    if (destroyed) return Promise.resolve({ ok: false, reason: 'capture-controller-destroyed' });
    if (platform === 'win32') return captureOnWindows();
    if (!['darwin', 'linux'].includes(platform))
      return Promise.resolve({ ok: false, reason: 'unsupported-platform' });
    const hookStatus = ensureSelectionHook();
    return Promise.resolve(hookStatus.ok ? readNativeSelection() : hookStatus);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    disposeSelectionHook();
    const target = worker;
    if (!target) return;
    try {
      target.child.stdin?.write?.('EXIT\n');
      target.child.stdin?.end?.();
    } catch {}
    closeWorker(target, { ok: false, reason: 'capture-controller-destroyed' }, { kill: true });
  }

  return {
    capture: capture,
    destroy: destroy,
    prewarm: prewarm,
    isKeyReleaseTrackingAvailable: () => Boolean(selectionHook) && !destroyed,
  };
}

export async function copySelectedTextToClipboard(options = {}) {
  const controller = createSelectedTextCaptureController(options);
  try {
    return await controller.capture();
  } finally {
    controller.destroy();
  }
}
