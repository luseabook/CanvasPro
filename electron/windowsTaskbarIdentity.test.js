import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  configureWindowsTaskbarIdentity,
  installWindowsTaskbarIdentity,
  buildWindowsChromeShellTaskbarIdentityScript,
  prepareWindowsChromeShellTaskbarIdentity,
} from './windowsTaskbarIdentity.js';
import { APP_WINDOW_MIN_HEIGHT, APP_WINDOW_MIN_WIDTH } from './appWindowSizePolicy.js';

const IDENTITY_TIMEOUT_MS = 6000;
const IDENTITY = {
  appId: 'cn.1e1e.canvas',
  iconPath: 'C:\\app\\icon.ico',
  executablePath: 'C:\\app\\canvas.exe',
  displayName: 'Canvas',
};
const SCRIPT_INPUT = {
  browserPath: 'C:\\Chrome\\chrome.exe',
  profileDir: 'C:\\profile',
  sizeGuardDllPath: 'C:\\app\\size-guard.dll',
  ...IDENTITY,
};

function createWindowDouble({ destroyOnSetIcon = false } = {}) {
  const calls = [];
  return {
    calls: calls,
    setIcon(iconPath) {
      calls.push({ method: 'setIcon', iconPath: iconPath });
      if (destroyOnSetIcon) throw new Error('window destroyed');
    },
    setAppDetails(details) {
      calls.push({ method: 'setAppDetails', details: details });
    },
  };
}

function createLogDouble() {
  const events = [];
  return { events: events, logEvent: (event) => events.push(event) };
}

function createHelperDouble({ stdinWritable = true } = {}) {
  const handlers = new Map();
  const state = { killed: 0, unrefed: 0, stdinEnded: 0, stdoutDestroyed: 0 };
  const writes = [];
  const add = (event, listener) => {
    const list = handlers.get(event) || [];
    list.push(listener);
    handlers.set(event, list);
  };
  const remove = (event, listener) => {
    const list = handlers.get(event) || [];
    handlers.set(
      event,
      list.filter((entry) => entry !== listener),
    );
  };
  const stdin = { write: (chunk) => writes.push(chunk), end: () => (state.stdinEnded += 1) };
  if (!stdinWritable) delete stdin.write;
  return {
    state: state,
    writes: writes,
    stdout: {
      on: (event, listener) => add(event, listener),
      removeListener: (event, listener) => remove(event, listener),
      destroy: () => (state.stdoutDestroyed += 1),
    },
    stdin: stdin,
    on: (event, listener) => add(event, listener),
    once: (event, listener) => add(event, listener),
    removeListener: (event, listener) => remove(event, listener),
    kill: () => (state.killed += 1),
    unref: () => (state.unrefed += 1),
    emit(event, ...args) {
      for (const listener of (handlers.get(event) || []).slice()) listener(...args);
    },
  };
}

function createSpawnDouble(helper, { throwError = null } = {}) {
  const calls = [];
  return {
    calls: calls,
    spawnProcess: (command, args, options) => {
      calls.push({ command: command, args: args, options: options });
      if (throwError) throw throwError;
      return helper;
    },
  };
}

function decode(script, marker) {
  const encoded = new RegExp(marker + ' "([^"]*)"').exec(script);
  assert.ok(encoded, `missing marker ${marker}`);
  return Buffer.from(encoded[1], 'base64').toString('utf8');
}

test('configureWindowsTaskbarIdentity returns false off win32 and leaves the window untouched', () => {
  const targetWindow = createWindowDouble();
  for (const platform of ['darwin', 'linux', null]) {
    assert.equal(
      configureWindowsTaskbarIdentity({ window: targetWindow, platform: platform, ...IDENTITY }),
      false,
    );
  }
  assert.equal(targetWindow.calls.length, 0);
});

test('configureWindowsTaskbarIdentity needs both setIcon and setAppDetails', () => {
  assert.equal(configureWindowsTaskbarIdentity({ window: {}, platform: 'win32', ...IDENTITY }), false);
  assert.equal(
    configureWindowsTaskbarIdentity({ window: { setIcon: () => {} }, platform: 'win32', ...IDENTITY }),
    false,
  );
  assert.equal(
    configureWindowsTaskbarIdentity({ window: { setAppDetails: () => {} }, platform: 'win32', ...IDENTITY }),
    false,
  );
});

test('configureWindowsTaskbarIdentity requires every identity field', () => {
  for (const key of ['appId', 'iconPath', 'executablePath', 'displayName']) {
    const targetWindow = createWindowDouble();
    assert.equal(
      configureWindowsTaskbarIdentity({
        window: targetWindow,
        platform: 'win32',
        ...IDENTITY,
        [key]: undefined,
      }),
      false,
    );
    assert.equal(targetWindow.calls.length, 0);
  }
});

test('configureWindowsTaskbarIdentity sets the icon and the four app details in order', () => {
  const targetWindow = createWindowDouble();
  assert.equal(
    configureWindowsTaskbarIdentity({ window: targetWindow, platform: 'win32', ...IDENTITY }),
    true,
  );
  assert.deepEqual(targetWindow.calls, [
    { method: 'setIcon', iconPath: IDENTITY.iconPath },
    {
      method: 'setAppDetails',
      details: {
        appId: IDENTITY.appId,
        appIconPath: IDENTITY.iconPath,
        appIconIndex: 0,
        relaunchCommand: IDENTITY.executablePath,
        relaunchDisplayName: IDENTITY.displayName,
      },
    },
  ]);
});

test('configureWindowsTaskbarIdentity swallows a throwing window', () => {
  const targetWindow = createWindowDouble({ destroyOnSetIcon: true });
  assert.equal(
    configureWindowsTaskbarIdentity({ window: targetWindow, platform: 'win32', ...IDENTITY }),
    false,
  );
  assert.equal(targetWindow.calls.length, 1);
});

test('installWindowsTaskbarIdentity returns false off win32 or without window events', () => {
  const targetWindow = { ...createWindowDouble(), on: () => {} };
  assert.equal(
    installWindowsTaskbarIdentity({ window: targetWindow, platform: 'darwin', ...IDENTITY }),
    false,
  );
  assert.equal(installWindowsTaskbarIdentity({ window: {}, platform: 'win32', ...IDENTITY }), false);
  assert.equal(
    installWindowsTaskbarIdentity({ window: { on: () => {} }, platform: 'win32', ...IDENTITY }),
    false,
  );
});

test('installWindowsTaskbarIdentity applies once and re-applies on every show event', () => {
  const targetWindow = createWindowDouble();
  const subscribed = [];
  targetWindow.on = (event, listener) => subscribed.push({ event: event, listener: listener });
  assert.equal(installWindowsTaskbarIdentity({ window: targetWindow, platform: 'win32', ...IDENTITY }), true);
  assert.equal(subscribed.length, 1);
  assert.equal(subscribed[0].event, 'show');
  assert.equal(targetWindow.calls.length, 2);
  subscribed[0].listener();
  assert.equal(targetWindow.calls.length, 4);
  assert.equal(targetWindow.calls[2].method, 'setIcon');
});

test('buildWindowsChromeShellTaskbarIdentityScript returns an empty string without every path', () => {
  for (const key of [
    'browserPath',
    'profileDir',
    'appId',
    'iconPath',
    'executablePath',
    'displayName',
    'sizeGuardDllPath',
  ]) {
    assert.equal(buildWindowsChromeShellTaskbarIdentityScript({ ...SCRIPT_INPUT, [key]: '' }), '');
    assert.equal(buildWindowsChromeShellTaskbarIdentityScript({ ...SCRIPT_INPUT, [key]: undefined }), '');
  }
});

test('the script carries the default timeout and the shared window size floors', () => {
  const script = buildWindowsChromeShellTaskbarIdentityScript(SCRIPT_INPUT);
  assert.equal(script[0], '$');
  assert.equal(script[script.length - 1], '}');
  assert.ok(
    script.startsWith('$timeoutMs = ' + IDENTITY_TIMEOUT_MS + '\n$minimumWidth = ' + APP_WINDOW_MIN_WIDTH),
  );
  assert.ok(
    script.includes('\n$minimumHeight = ' + APP_WINDOW_MIN_HEIGHT + '\nfunction Decode-TaskbarIdentityValue'),
  );
});

test('the script rounds explicit minimums and keeps the floor when they are unusable', () => {
  assert.ok(
    buildWindowsChromeShellTaskbarIdentityScript({
      ...SCRIPT_INPUT,
      minWidth: 1400.6,
      minHeight: '900',
    }).includes('$minimumWidth = 1401\n$minimumHeight = 900'),
  );
  const floored = buildWindowsChromeShellTaskbarIdentityScript({
    ...SCRIPT_INPUT,
    minWidth: 0,
    minHeight: -5,
  });
  assert.ok(
    floored.includes(
      '$minimumWidth = ' + APP_WINDOW_MIN_WIDTH + '\n$minimumHeight = ' + APP_WINDOW_MIN_HEIGHT,
    ),
  );
});

test('the script normalizes the timeout and falls back on unusable values', () => {
  assert.ok(
    buildWindowsChromeShellTaskbarIdentityScript({ ...SCRIPT_INPUT, timeoutMs: 1234.4 }).startsWith(
      '$timeoutMs = 1234',
    ),
  );
  assert.ok(
    buildWindowsChromeShellTaskbarIdentityScript({ ...SCRIPT_INPUT, timeoutMs: 0 }).startsWith(
      '$timeoutMs = 0\n',
    ),
  );
  for (const timeoutMs of [undefined, -1, Number.NaN, 'soon']) {
    assert.ok(
      buildWindowsChromeShellTaskbarIdentityScript({ ...SCRIPT_INPUT, timeoutMs: timeoutMs }).startsWith(
        '$timeoutMs = ' + IDENTITY_TIMEOUT_MS,
      ),
      `timeoutMs=${String(timeoutMs)} must fall back to the default`,
    );
  }
});

test('every identity value is base64 encoded as utf8 and decoded inside the script', () => {
  const script = buildWindowsChromeShellTaskbarIdentityScript(SCRIPT_INPUT);
  assert.equal(decode(script, '\\$browserPath = Decode-TaskbarIdentityValue'), SCRIPT_INPUT.browserPath);
  assert.equal(decode(script, '\\$profileDir = Decode-TaskbarIdentityValue'), SCRIPT_INPUT.profileDir);
  assert.equal(decode(script, '\\$appId = Decode-TaskbarIdentityValue'), IDENTITY.appId);
  assert.equal(decode(script, '\\$iconPath = Decode-TaskbarIdentityValue'), IDENTITY.iconPath);
  assert.equal(decode(script, '\\$executablePath = Decode-TaskbarIdentityValue'), IDENTITY.executablePath);
  assert.equal(decode(script, '\\$displayName = Decode-TaskbarIdentityValue'), IDENTITY.displayName);
  assert.equal(
    decode(script, '\\$sizeGuardDllPath = Decode-TaskbarIdentityValue'),
    SCRIPT_INPUT.sizeGuardDllPath,
  );
});

test('the script builds the relaunch command, the profile switch and the size guard hooks', () => {
  const script = buildWindowsChromeShellTaskbarIdentityScript(SCRIPT_INPUT);
  assert.ok(script.includes("$relaunchCommand = '\"' + $executablePath + '\"'"));
  assert.ok(script.includes("$relaunchIconResource = $iconPath + ',0'"));
  assert.ok(script.includes("$profileSwitch = '--user-data-dir=' + $profileDir"));
  assert.ok(script.includes('ShuoCanvasCallWndProcHookProc'));
  assert.ok(script.includes("WriteLine('READY')"));
  assert.ok(script.includes('exit 5'));
  assert.ok(script.includes('exit 3'));
});

test('the taskbar brand matcher accepts Canvas and legacy titles', () => {
  const script = buildWindowsChromeShellTaskbarIdentityScript(SCRIPT_INPUT);
  assert.ok(script.includes('title.IndexOf("updream canvas", StringComparison.OrdinalIgnoreCase) >= 0'));
  assert.ok(script.includes('title.IndexOf("AI CanvasPro", StringComparison.OrdinalIgnoreCase) >= 0'));
  assert.ok(script.includes('title.IndexOf("AI Canvas", StringComparison.OrdinalIgnoreCase) >= 0'));
  assert.ok(script.includes('title.IndexOf("Canvas", StringComparison.OrdinalIgnoreCase) >= 0'));
  assert.ok(!script.includes('SHUO Canvas'));
});

test('prepareWindowsChromeShellTaskbarIdentity is a no-op off win32 or without a script', async () => {
  const spawn = createSpawnDouble(createHelperDouble());
  assert.equal(
    await prepareWindowsChromeShellTaskbarIdentity({
      ...SCRIPT_INPUT,
      platform: 'darwin',
      spawnProcess: spawn.spawnProcess,
    }),
    null,
  );
  assert.equal(spawn.calls.length, 0);
  assert.equal(
    await prepareWindowsChromeShellTaskbarIdentity({
      browserPath: SCRIPT_INPUT.browserPath,
      platform: 'win32',
      spawnProcess: spawn.spawnProcess,
    }),
    null,
  );
  assert.equal(spawn.calls.length, 0);
});

test('the helper is spawned hidden, detached and without a stderr pipe', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const log = createLogDouble();
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    logEvent: log.logEvent,
  });
  helper.emit('data', 'READY\n');
  const prepared = await pending;
  assert.equal(spawn.calls.length, 1);
  assert.equal(spawn.calls[0].command, 'powershell.exe');
  assert.deepEqual(spawn.calls[0].args, [
    '-NoLogo',
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    buildWindowsChromeShellTaskbarIdentityScript(SCRIPT_INPUT),
  ]);
  assert.deepEqual(spawn.calls[0].options, {
    stdio: ['pipe', 'pipe', 'ignore'],
    windowsHide: true,
    detached: false,
  });
  assert.equal(prepared.helper, helper);
  assert.equal(typeof prepared.cancel, 'function');
  assert.equal(typeof prepared.attach, 'function');
  assert.equal(log.events.length, 0);
});

test('READY is only accepted on a line boundary and may arrive split across chunks', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const log = createLogDouble();
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    logEvent: log.logEvent,
  });
  helper.emit('data', 'NOTREADY\n');
  helper.emit('data', 'REA');
  helper.emit('data', 'DY\n');
  assert.ok(await pending);
  assert.equal(log.events.length, 0);
});

test('a helper that exits before READY is killed and reported', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const log = createLogDouble();
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    logEvent: log.logEvent,
  });
  helper.emit('data', 'NOTREADY\n');
  helper.emit('exit', 2, null);
  assert.equal(await pending, null);
  assert.equal(helper.state.killed, 1);
  assert.equal(log.events.length, 1);
  assert.deepEqual(log.events[0], {
    type: 'chrome_shell.taskbar_identity_not_ready',
    level: 'warn',
    source: 'main',
    message: 'Windows Chrome shell taskbar identity helper was not ready before launch',
  });
});

test('a helper error before READY is killed and reported', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const log = createLogDouble();
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    logEvent: log.logEvent,
  });
  helper.emit('error', new Error('EPIPE'));
  assert.equal(await pending, null);
  assert.equal(helper.state.killed, 1);
  assert.equal(log.events.length, 1);
  assert.equal(log.events[0].type, 'chrome_shell.taskbar_identity_not_ready');
});

test('a non-zero helper exit after READY is reported as a timeout with the exit context', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const log = createLogDouble();
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    logEvent: log.logEvent,
  });
  helper.emit('data', 'READY\n');
  const prepared = await pending;
  helper.emit('exit', 3, 'SIGTERM');
  assert.ok(prepared);
  assert.deepEqual(log.events[0], {
    type: 'chrome_shell.taskbar_identity_timeout',
    level: 'warn',
    source: 'main',
    message: 'Windows Chrome shell taskbar identity was not applied',
    context: { code: 3, signal: 'SIGTERM' },
  });
  assert.equal(helper.state.killed, 0);
});

test('a clean helper exit after READY is not reported', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const log = createLogDouble();
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    logEvent: log.logEvent,
  });
  helper.emit('data', 'READY\n');
  assert.ok(await pending);
  helper.emit('exit', 0, null);
  assert.equal(log.events.length, 0);
});

test('a throwing spawn is reported as a spawn error with the cause', async () => {
  const spawnError = new Error('spawn powershell.exe EPERM');
  const spawn = createSpawnDouble(null, { throwError: spawnError });
  const log = createLogDouble();
  const prepared = await prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    logEvent: log.logEvent,
  });
  assert.equal(prepared, null);
  assert.equal(spawn.calls.length, 1);
  assert.deepEqual(log.events[0], {
    type: 'chrome_shell.taskbar_identity_spawn_error',
    level: 'warn',
    source: 'main',
    message: 'Windows Chrome shell taskbar identity helper could not start',
    error: spawnError,
  });
});

test('cancel closes stdin first and then kills the helper', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
  });
  helper.emit('data', 'READY\n');
  const prepared = await pending;
  prepared.cancel();
  assert.equal(helper.state.stdinEnded, 1);
  assert.equal(helper.state.killed, 1);
});

test('attach streams the browser pid, detaches stdin/stdout and releases the handle', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
  });
  helper.emit('data', 'READY\n');
  const prepared = await pending;
  assert.equal(prepared.attach({ pid: 4321 }), true);
  assert.deepEqual(helper.writes, ['4321\n']);
  assert.equal(helper.state.stdinEnded, 1);
  assert.equal(helper.state.stdoutDestroyed, 1);
  assert.equal(helper.state.unrefed, 1);
  assert.equal(helper.state.killed, 0);
});

test('attach rounds a fractional pid and rejects unusable pids by cancelling', async () => {
  const helper = createHelperDouble();
  const spawn = createSpawnDouble(helper);
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
  });
  helper.emit('data', 'READY\n');
  const prepared = await pending;
  assert.equal(prepared.attach({ pid: 12.7 }), true);
  assert.deepEqual(helper.writes, ['13\n']);
  const killedBefore = helper.state.killed;
  for (const pid of [0, -1, Number.NaN, 'not-a-pid', undefined]) {
    assert.equal(prepared.attach({ pid: pid }), false);
  }
  assert.equal(helper.state.killed, killedBefore + 5);
  assert.equal(helper.state.stdinEnded, 6);
});

test('attach cancels when the helper stdin is not writable', async () => {
  const helper = createHelperDouble({ stdinWritable: false });
  const spawn = createSpawnDouble(helper);
  const pending = prepareWindowsChromeShellTaskbarIdentity({
    ...SCRIPT_INPUT,
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
  });
  helper.emit('data', 'READY\n');
  const prepared = await pending;
  assert.equal(prepared.attach({ pid: 4321 }), false);
  assert.equal(helper.state.stdinEnded, 1);
  assert.equal(helper.state.killed, 1);
});
