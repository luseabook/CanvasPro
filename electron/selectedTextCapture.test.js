import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import {
  WINDOWS_CAPTURE_WORKER_SCRIPT,
  copySelectedTextToClipboard,
  createSelectedTextCaptureController,
  mapWindowsWorkerStatus,
  resolveWindowsCaptureWorkerCommand,
  shouldRetryWindowsCopy,
} from './selectedTextCapture.js';

const tick = () => new Promise((resolve) => setImmediate(resolve));

function createFakeTimers() {
  const scheduled = [];
  return {
    scheduled: scheduled,
    setTimeoutFn: (fn, ms) => {
      const entry = { fn: fn, ms: ms, cleared: false };
      scheduled.push(entry);
      return entry;
    },
    clearTimeoutFn: (entry) => {
      if (entry) entry.cleared = true;
    },
    fire(entry) {
      if (!entry.cleared) entry.fn();
    },
  };
}

function createFakeChild() {
  const stdout = new EventEmitter(),
    stdin = new EventEmitter(),
    events = new EventEmitter(),
    writes = [];
  let stdinEnded = false,
    killed = false;
  stdin.write = (chunk) => {
    writes.push(String(chunk));
    return true;
  };
  stdin.end = () => {
    stdinEnded = true;
  };
  return {
    writes: writes,
    stdout: stdout,
    stdin: stdin,
    ended: () => stdinEnded,
    killed: () => killed,
    on: (...args) => events.on(...args),
    once: (...args) => events.once(...args),
    emit: (...args) => events.emit(...args),
    kill: () => {
      killed = true;
    },
  };
}

function createFakeHookClass(options = {}) {
  const {
    startResult = true,
    throwOnCapture = false,
  } = options;
  const selection = 'selection' in options
    ? options.selection
    : { text: 'hello world', programName: 'vscode.exe', method: 2 };
  const instances = [];
  class FakeSelectionHook {
    static FineTunedListType = { EXCLUDE_CLIPBOARD_CURSOR_DETECT: 1, INCLUDE_CLIPBOARD_DELAY_READ: 2 };
    constructor() {
      instances.push(this);
      this.listeners = new Map();
      this.calls = [];
      this.fineTuned = [];
    }
    on(name, handler) {
      this.listeners.set(name, handler);
    }
    setSelectionPassiveMode(value) {
      this.calls.push(['passive', value]);
    }
    setFineTunedList(type, apps) {
      this.fineTuned.push([type, apps]);
    }
    start() {
      this.calls.push(['start']);
      return startResult;
    }
    stop() {
      this.calls.push(['stop']);
    }
    cleanup() {
      this.calls.push(['cleanup']);
    }
    getCurrentSelection() {
      if (throwOnCapture) throw new Error('selection exploded');
      return selection;
    }
  }
  return { FakeSelectionHook: FakeSelectionHook, instances: instances };
}

test('selectedTextCapture: rejects platforms without a native hook or a Windows worker', async () => {
  const controller = createSelectedTextCaptureController({ platform: 'aix' });
  assert.equal(controller.isKeyReleaseTrackingAvailable(), false);
  assert.deepEqual(await controller.capture(), { ok: false, reason: 'unsupported-platform' });
  assert.deepEqual(await controller.prewarm(), {
    ok: false,
    reason: 'native-selection-unavailable',
  });
  controller.destroy();
  assert.deepEqual(await copySelectedTextToClipboard({ platform: 'aix' }), {
    ok: false,
    reason: 'unsupported-platform',
  });
});

test('selectedTextCapture: reads the selection through the native hook off Windows', async () => {
  const hook = createFakeHookClass();
  const keyReleases = [];
  const controller = createSelectedTextCaptureController({
    platform: 'darwin',
    loadSelectionHook: () => hook.FakeSelectionHook,
    onKeyReleased: (payload) => keyReleases.push(payload),
  });
  assert.equal(controller.isKeyReleaseTrackingAvailable(), false);
  assert.deepEqual(await controller.capture(), {
    ok: true,
    text: 'hello world',
    source: 'selection-hook',
    programName: 'vscode.exe',
    method: 2,
  });
  assert.equal(controller.isKeyReleaseTrackingAvailable(), true);
  const [instance] = hook.instances;
  assert.deepEqual(instance.calls, [['passive', true], ['start']]);
  assert.deepEqual(instance.fineTuned, []);
  const keyUp = instance.listeners.get('key-up');
  keyUp({ flags: 0, uniKey: 'c' });
  keyUp({ flags: 16, uniKey: 'c' });
  assert.deepEqual(keyReleases, [{ flags: 0, uniKey: 'c' }, { flags: 16, uniKey: 'c' }]);
  controller.destroy();
  assert.equal(controller.isKeyReleaseTrackingAvailable(), false);
});

test('selectedTextCapture: applies the Windows fine-tuned selection lists only on win32', async () => {
  const hook = createFakeHookClass();
  class HookWithoutFineTuning extends hook.FakeSelectionHook {
    static FineTunedListType = {};
  }
  const controller = createSelectedTextCaptureController({
    platform: 'win32',
    loadSelectionHook: () => HookWithoutFineTuning,
    spawnProcess: () => {
      throw new Error('unused');
    },
    setTimeoutFn: () => null,
    clearTimeoutFn: () => {},
  });
  await controller.capture();
  const instance = HookWithoutFineTuning.instances ?? null;
  assert.equal(instance, null);
  const withLists = createFakeHookClass();
  const win32KeyReleases = [];
  const win32Controller = createSelectedTextCaptureController({
    platform: 'win32',
    loadSelectionHook: () => withLists.FakeSelectionHook,
    onKeyReleased: (payload) => win32KeyReleases.push(payload),
  });
  assert.equal(win32Controller.isKeyReleaseTrackingAvailable(), false);
  assert.deepEqual(await win32Controller.capture(), {
    ok: true,
    text: 'hello world',
    source: 'selection-hook',
    programName: 'vscode.exe',
    method: 2,
  });
  assert.deepEqual(withLists.instances[0].fineTuned, [
    [1, ['acrobat.exe', 'wps.exe', 'cajviewer.exe']],
    [2, ['acrobat.exe', 'wps.exe', 'cajviewer.exe', 'foxitphantom.exe']],
  ]);
  const win32KeyUp = withLists.instances[0].listeners.get('key-up');
  win32KeyUp({ flags: 0, uniKey: 'c' });
  win32KeyUp({ flags: 16, uniKey: 'c' });
  assert.deepEqual(win32KeyReleases, [{ flags: 0, uniKey: 'c' }]);
});

test('selectedTextCapture: empty or missing selections are reported without a worker', async () => {
  const empty = createFakeHookClass({ selection: { text: '   ' } });
  const controller = createSelectedTextCaptureController({
    platform: 'darwin',
    loadSelectionHook: () => empty.FakeSelectionHook,
  });
  assert.deepEqual(await controller.capture(), { ok: false, reason: 'no-selection' });
  const missing = createFakeHookClass({ selection: undefined });
  const missingController = createSelectedTextCaptureController({
    platform: 'darwin',
    loadSelectionHook: () => missing.FakeSelectionHook,
  });
  assert.deepEqual(await missingController.capture(), { ok: false, reason: 'no-selection' });
});

test('selectedTextCapture: a throwing native read cleans up and can be retried', async () => {
  const hook = createFakeHookClass({ throwOnCapture: true });
  const controller = createSelectedTextCaptureController({
    platform: 'darwin',
    loadSelectionHook: () => hook.FakeSelectionHook,
  });
  assert.deepEqual(await controller.capture(), {
    ok: false,
    reason: 'native-selection-failed',
    error: 'selection exploded',
  });
  assert.deepEqual(hook.instances[0].calls, [['passive', true], ['start'], ['stop'], ['cleanup']]);
  assert.equal(controller.isKeyReleaseTrackingAvailable(), false);
  assert.equal((await controller.capture()).reason, 'native-selection-failed');
  assert.equal(hook.instances.length, 2);
});

test('selectedTextCapture: a failing or missing native hook latches native-selection-unavailable', async () => {
  const notStarting = createFakeHookClass({ startResult: false });
  const controller = createSelectedTextCaptureController({
    platform: 'darwin',
    loadSelectionHook: () => notStarting.FakeSelectionHook,
  });
  assert.deepEqual(await controller.capture(), {
    ok: false,
    reason: 'native-selection-start-failed',
  });
  assert.deepEqual(notStarting.instances[0].calls, [['passive', true], ['start'], ['cleanup']]);
  assert.deepEqual(await controller.capture(), {
    ok: false,
    reason: 'native-selection-unavailable',
  });
  assert.equal(notStarting.instances.length, 1);
  const notAFunction = createSelectedTextCaptureController({
    platform: 'darwin',
    loadSelectionHook: () => ({ default: null }),
  });
  assert.deepEqual(await notAFunction.capture(), {
    ok: false,
    reason: 'native-selection-unavailable',
  });
  const throwing = createSelectedTextCaptureController({
    platform: 'darwin',
    loadSelectionHook: () => {
      throw new Error('module missing');
    },
  });
  assert.deepEqual(await throwing.capture(), {
    ok: false,
    reason: 'native-selection-unavailable',
    error: 'module missing',
  });
});

test('selectedTextCapture: the Windows worker script and its status mapping are stable', () => {
  const command = resolveWindowsCaptureWorkerCommand();
  assert.equal(command.command, 'powershell.exe');
  assert.deepEqual(command.args.slice(0, 6), [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
  ]);
  assert.equal(command.args[6], WINDOWS_CAPTURE_WORKER_SCRIPT);
  assert.match(WINDOWS_CAPTURE_WORKER_SCRIPT, /SendInput/);
  assert.deepEqual(mapWindowsWorkerStatus('OK'), { ok: true });
  assert.deepEqual(mapWindowsWorkerStatus('KEYS_HELD'), {
    ok: false,
    reason: 'shortcut-keys-still-held',
  });
  assert.equal(shouldRetryWindowsCopy({ reason: 'no-selection' }), true);
  assert.equal(shouldRetryWindowsCopy({ reason: 'copy-command-failed', workerStatus: 'FAILED' }), true);
  assert.equal(shouldRetryWindowsCopy({ reason: 'copy-command-failed', workerStatus: 'SEND_FAILED' }), true);
  assert.equal(shouldRetryWindowsCopy({ reason: 'shortcut-keys-still-held' }), false);
});

function createWorkerController(overrides = {}) {
  const child = createFakeChild();
  const spawnCalls = [];
  const timer = createFakeTimers();
  const controller = createSelectedTextCaptureController({
    platform: 'win32',
    loadSelectionHook: () => {
      throw new Error('selection-hook is not installed');
    },
    spawnProcess: (command, args, options) => {
      if (overrides.spawnThrows) throw new Error('spawn failed');
      spawnCalls.push({ command: command, args: args, options: options });
      return child;
    },
    setTimeoutFn: overrides.setTimeoutFn || timer.setTimeoutFn,
    clearTimeoutFn: overrides.clearTimeoutFn || timer.clearTimeoutFn,
    ...overrides.controllerOptions,
  });
  return { controller: controller, child: child, spawnCalls: spawnCalls, timer: timer };
}

test('selectedTextCapture: win32 falls back to the PowerShell worker and copies through it', async () => {
  const h = createWorkerController();
  const pending = h.controller.capture();
  await tick();
  assert.equal(h.spawnCalls.length, 1);
  assert.equal(h.spawnCalls[0].command, 'powershell.exe');
  assert.deepEqual(h.spawnCalls[0].options, { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
  h.child.stdout.emit('data', 'READY\n');
  await tick();
  assert.deepEqual(h.child.writes, ['COPY:1:INPUT\n']);
  h.child.stdout.emit('data', 'RESULT:1:OK\n');
  assert.deepEqual(await pending, { ok: true });
  h.controller.destroy();
  assert.deepEqual(h.child.writes[1], 'EXIT\n');
  assert.equal(h.child.ended(), true);
  assert.equal(h.child.killed(), true);
});

test('selectedTextCapture: win32 retries with the next copy strategy and reassembles split lines', async () => {
  const h = createWorkerController();
  const pending = h.controller.capture();
  await tick();
  h.child.stdout.emit('data', 'REA');
  h.child.stdout.emit('data', 'DY\n');
  await tick();
  assert.deepEqual(h.child.writes, ['COPY:1:INPUT\n']);
  h.child.stdout.emit('data', 'RESU');
  h.child.stdout.emit('data', 'LT:1:NO_SELECTION\n');
  await tick();
  assert.deepEqual(h.child.writes, ['COPY:1:INPUT\n', 'COPY:2:SENDKEYS\n']);
  h.child.stdout.emit('data', 'RESULT:2:OK\n');
  assert.deepEqual(await pending, { ok: true });
});

test('selectedTextCapture: win32 does not retry non-retryable worker statuses', async () => {
  const h = createWorkerController();
  const pending = h.controller.capture();
  await tick();
  h.child.stdout.emit('data', 'READY\n');
  await tick();
  h.child.stdout.emit('data', 'RESULT:1:KEYS_HELD\n');
  assert.deepEqual(await pending, { ok: false, reason: 'shortcut-keys-still-held' });
  assert.deepEqual(h.child.writes, ['COPY:1:INPUT\n']);
});

test('selectedTextCapture: win32 stops after the last strategy and reports the worker status', async () => {
  const h = createWorkerController({
    controllerOptions: { windowsCopyStrategies: ['SENDKEYS', 'bogus', 'SENDKEYS'] },
  });
  const pending = h.controller.capture();
  await tick();
  h.child.stdout.emit('data', 'READY\n');
  await tick();
  assert.deepEqual(h.child.writes, ['COPY:1:SENDKEYS\n']);
  h.child.stdout.emit('data', 'RESULT:1:SEND_FAILED\n');
  assert.deepEqual(await pending, {
    ok: false,
    reason: 'copy-command-failed',
    workerStatus: 'SEND_FAILED',
  });
});

test('selectedTextCapture: a stalled copy command times out and kills the worker', async () => {
  const h = createWorkerController();
  const pending = h.controller.capture();
  await tick();
  h.child.stdout.emit('data', 'READY\n');
  await tick();
  assert.equal(h.timer.scheduled.length, 2);
  h.timer.fire(h.timer.scheduled[1]);
  assert.deepEqual(await pending, { ok: false, reason: 'copy-command-timeout' });
  assert.equal(h.child.killed(), true);
  assert.equal(h.timer.scheduled[1].cleared, true);
});

test('selectedTextCapture: a worker that never reports READY fails on the startup timeout', async () => {
  const h = createWorkerController();
  const pending = h.controller.capture();
  await tick();
  h.timer.fire(h.timer.scheduled[0]);
  assert.deepEqual(await pending, { ok: false, reason: 'copy-worker-startup-timeout' });
  assert.equal(h.child.killed(), true);
});

test('selectedTextCapture: a spawn failure or an early exit is reported as copy-command-failed', async () => {
  const throwing = createWorkerController({ spawnThrows: true });
  assert.deepEqual(await throwing.controller.capture(), {
    ok: false,
    reason: 'copy-command-failed',
    error: 'spawn failed',
  });
  const exiting = createWorkerController();
  const pending = exiting.controller.capture();
  await tick();
  exiting.child.emit('exit', 1);
  assert.deepEqual(await pending, {
    ok: false,
    reason: 'copy-command-failed',
    exitCode: 1,
  });
});

test('selectedTextCapture: prewarm starts both the native hook and the Windows worker', async () => {
  const hook = createFakeHookClass();
  const child = createFakeChild();
  const controller = createSelectedTextCaptureController({
    platform: 'win32',
    loadSelectionHook: () => hook.FakeSelectionHook,
    spawnProcess: () => child,
  });
  const pending = controller.prewarm();
  await tick();
  child.stdout.emit('data', 'READY\n');
  assert.deepEqual(await pending, { ok: true });
  assert.equal(controller.isKeyReleaseTrackingAvailable(), true);
  const nativeOnly = createSelectedTextCaptureController({
    platform: 'win32',
    loadSelectionHook: () => hook.FakeSelectionHook,
    spawnProcess: () => {
      throw new Error('spawn failed');
    },
  });
  assert.deepEqual(await nativeOnly.prewarm(), { ok: true });
  const neither = createSelectedTextCaptureController({
    platform: 'win32',
    loadSelectionHook: () => {
      throw new Error('missing');
    },
    spawnProcess: () => {
      throw new Error('spawn failed');
    },
  });
  assert.deepEqual(await neither.prewarm(), {
    ok: false,
    reason: 'copy-command-failed',
    error: 'spawn failed',
  });
});

test('selectedTextCapture: destroy is idempotent and blocks further captures', async () => {
  const h = createWorkerController();
  h.controller.destroy();
  h.controller.destroy();
  assert.deepEqual(await h.controller.capture(), {
    ok: false,
    reason: 'capture-controller-destroyed',
  });
  assert.deepEqual(h.spawnCalls, []);
  assert.deepEqual(await h.controller.prewarm(), {
    ok: false,
    reason: 'capture-controller-destroyed',
  });
});

test('copySelectedTextToClipboard uses a throwaway controller and tears it down', async () => {
  const child = createFakeChild();
  const spawnCalls = [];
  const pending = copySelectedTextToClipboard({
    platform: 'win32',
    loadSelectionHook: () => {
      throw new Error('missing');
    },
    spawnProcess: (command) => {
      spawnCalls.push(command);
      return child;
    },
  });
  await tick();
  child.stdout.emit('data', 'READY\n');
  await tick();
  child.stdout.emit('data', 'RESULT:1:OK\n');
  assert.deepEqual(await pending, { ok: true });
  assert.deepEqual(spawnCalls, ['powershell.exe']);
  assert.deepEqual(child.writes, ['COPY:1:INPUT\n', 'EXIT\n']);
  assert.equal(child.killed(), true);
});
