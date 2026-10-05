import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disableWindowsWindowTransitions } from './windowsWindowTransitions.js';
import { resolveWindowsSystemToolPath } from './windowsSystemTools.js';

const POWERSHELL_PATH = resolveWindowsSystemToolPath('powershell');
const TIMEOUT_MS = 5000;
const MAX_BUFFER = 16384;
const EXPECTED_ARGS_TAIL = ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass'];

function createWindowDouble(handle, { destroyAfterHandle = false } = {}) {
  const state = { destroyed: false, handleCalls: 0 };
  return {
    state: state,
    isDestroyed: () => state.destroyed,
    getNativeWindowHandle: () => {
      state.handleCalls += 1;
      if (destroyAfterHandle) state.destroyed = true;
      return handle;
    },
  };
}

function createExecFileDouble({ stdout = 'APPLIED', error = null, throwError = null } = {}) {
  const calls = [];
  const execFileFn = (file, args, options, callback) => {
    calls.push({ file: file, args: args, options: options });
    if (throwError) throw throwError;
    callback(error, stdout);
  };
  return { execFileFn: execFileFn, calls: calls };
}

function decodeScript(args) {
  return Buffer.from(args[args.length - 1], 'base64').toString('utf16le');
}

test('non-win32 platforms short-circuit without touching the window or shelling out', async () => {
  const targetWindow = createWindowDouble(Buffer.alloc(4));
  const execFile = createExecFileDouble();
  const result = await disableWindowsWindowTransitions(targetWindow, {
    platform: 'darwin',
    execFileFn: execFile.execFileFn,
  });
  assert.deepEqual(result, { ok: true, skipped: true });
  assert.equal(targetWindow.state.handleCalls, 0);
  assert.equal(execFile.calls.length, 0);
});

test('a destroyed window reports window-unavailable without shelling out', async () => {
  const targetWindow = createWindowDouble(Buffer.alloc(4));
  targetWindow.state.destroyed = true;
  const execFile = createExecFileDouble();
  const result = await disableWindowsWindowTransitions(targetWindow, {
    platform: 'win32',
    execFileFn: execFile.execFileFn,
  });
  assert.deepEqual(result, { ok: false, reason: 'window-unavailable' });
  assert.equal(execFile.calls.length, 0);
});

test('a native handle that is not a 4 or 8 byte buffer is rejected', async () => {
  for (const handle of [null, undefined, '0x1', 1, Buffer.alloc(3), Buffer.alloc(16)]) {
    const execFile = createExecFileDouble();
    const result = await disableWindowsWindowTransitions(createWindowDouble(handle), {
      platform: 'win32',
      execFileFn: execFile.execFileFn,
    });
    assert.deepEqual(result, { ok: false, reason: 'window-unavailable' });
    assert.equal(execFile.calls.length, 0);
  }
});

test('a zero or out-of-range window handle is rejected', async () => {
  for (const handle of [
    Buffer.alloc(4),
    Buffer.alloc(8),
    Buffer.from([0, 0, 0, 0, 0, 0, 0, 128]),
  ]) {
    const execFile = createExecFileDouble();
    const result = await disableWindowsWindowTransitions(createWindowDouble(handle), {
      platform: 'win32',
      execFileFn: execFile.execFileFn,
    });
    assert.deepEqual(result, { ok: false, reason: 'window-unavailable' });
    assert.equal(execFile.calls.length, 0);
  }
});

test('an owner pid that is not a positive safe integer is rejected', async () => {
  const handle = Buffer.from([52, 18, 0, 0]);
  for (const ownerPid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, '1234', null]) {
    const execFile = createExecFileDouble();
    const result = await disableWindowsWindowTransitions(createWindowDouble(handle), {
      platform: 'win32',
      ownerPid: ownerPid,
      execFileFn: execFile.execFileFn,
    });
    assert.deepEqual(result, { ok: false, reason: 'window-unavailable' });
    assert.equal(execFile.calls.length, 0);
  }
});

test('a 4 byte handle is read as a little-endian uint32 and passed to the PowerShell helper', async () => {
  const execFile = createExecFileDouble();
  const result = await disableWindowsWindowTransitions(
    createWindowDouble(Buffer.from([52, 18, 0, 0])),
    {
      platform: 'win32',
      ownerPid: 4321,
      execFileFn: execFile.execFileFn,
    },
  );
  assert.deepEqual(result, { ok: true });
  const call = execFile.calls[0];
  assert.equal(call.file, POWERSHELL_PATH);
  assert.deepEqual(call.args.slice(0, 5), EXPECTED_ARGS_TAIL);
  assert.deepEqual(call.options, {
    windowsHide: true,
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    encoding: 'utf8',
  });
  const script = decodeScript(call.args);
  assert.ok(
    script.includes("$result = [ShuoWindowTransitions]::Disable([long]::Parse('4660'), [uint32]4321)"),
  );
  assert.ok(script.includes('DwmSetWindowAttribute(hwnd, 3, ref disabled, 4)'));
  assert.ok(script.includes('if ($result -ne 0) { throw "DwmSetWindowAttribute failed: $result" }'));
});

test('an 8 byte handle is read as a little-endian uint64', async () => {
  const execFile = createExecFileDouble();
  const handleValue = 0x1234_5678_9abcn;
  const handle = Buffer.alloc(8);
  handle.writeBigUInt64LE(handleValue);
  const result = await disableWindowsWindowTransitions(createWindowDouble(handle), {
    platform: 'win32',
    ownerPid: 1,
    execFileFn: execFile.execFileFn,
  });
  assert.deepEqual(result, { ok: true });
  assert.ok(decodeScript(execFile.calls[0].args).includes(`[long]::Parse('${handleValue}')`));
});

test('the helper reply is trimmed before the APPLIED comparison', async () => {
  const execFile = createExecFileDouble({ stdout: '  APPLIED\r\n' });
  const result = await disableWindowsWindowTransitions(createWindowDouble(Buffer.alloc(4, 1)), {
    platform: 'win32',
    ownerPid: 1,
    execFileFn: execFile.execFileFn,
  });
  assert.deepEqual(result, { ok: true });
});

test('any helper reply other than APPLIED reports native-transitions-unavailable', async () => {
  for (const stdout of ['', 'FAILED', 'APPLIED-TWICE', null, 1]) {
    const execFile = createExecFileDouble({ stdout: stdout });
    const result = await disableWindowsWindowTransitions(createWindowDouble(Buffer.alloc(4, 1)), {
      platform: 'win32',
      ownerPid: 1,
      execFileFn: execFile.execFileFn,
    });
    assert.deepEqual(result, { ok: false, reason: 'native-transitions-unavailable' });
  }
});

test('an execFile error and a synchronous throw both report native-transitions-unavailable', async () => {
  const errored = createExecFileDouble({ error: new Error('spawn powershell ENOENT') });
  assert.deepEqual(
    await disableWindowsWindowTransitions(createWindowDouble(Buffer.alloc(4, 1)), {
      platform: 'win32',
      ownerPid: 1,
      execFileFn: errored.execFileFn,
    }),
    { ok: false, reason: 'native-transitions-unavailable' },
  );
  const thrown = createExecFileDouble({ throwError: new Error('spawn EPERM') });
  assert.deepEqual(
    await disableWindowsWindowTransitions(createWindowDouble(Buffer.alloc(4, 1)), {
      platform: 'win32',
      ownerPid: 1,
      execFileFn: thrown.execFileFn,
    }),
    { ok: false, reason: 'native-transitions-unavailable' },
  );
});

test('a window destroyed while the helper runs reports native-transitions-unavailable', async () => {
  const execFile = createExecFileDouble();
  const targetWindow = createWindowDouble(Buffer.alloc(4, 1), { destroyAfterHandle: true });
  const result = await disableWindowsWindowTransitions(targetWindow, {
    platform: 'win32',
    ownerPid: 1,
    execFileFn: execFile.execFileFn,
  });
  assert.deepEqual(result, { ok: false, reason: 'native-transitions-unavailable' });
  assert.equal(execFile.calls.length, 1);
});

test('the owner pid defaults to the current process and the platform to process.platform', async () => {
  const execFile = createExecFileDouble();
  const result = await disableWindowsWindowTransitions(createWindowDouble(Buffer.alloc(4, 1)), {
    platform: 'win32',
    execFileFn: execFile.execFileFn,
  });
  assert.deepEqual(result, { ok: true });
  assert.ok(
    decodeScript(execFile.calls[0].args).includes(`'), [uint32]${process.pid})`),
    'the default owner pid must be process.pid',
  );
});
