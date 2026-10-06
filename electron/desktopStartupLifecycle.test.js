import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopStartupLifecycle } from './desktopStartupLifecycle.js';

function createHarness(overrides = {}) {
  const calls = [];
  const timers = [];
  const fakeTimers = {
    setTimer: (callback, delayMs) => {
      const handle = { callback: callback, delayMs: delayMs, cleared: false };
      timers.push(handle);
      return handle;
    },
    clearTimer: (handle) => {
      if (handle) handle.cleared = true;
    },
  };
  const app = {
    relaunch: (options) => calls.push(['relaunch', options]),
    quit: () => calls.push(['quit']),
  };
  const deps = {
    app: app,
    getSpawnedServer: () => null,
    probeServer: async () => false,
    clearPortBeforeStart: async () => calls.push(['clearPort']),
    ensureServerRunning: async () => calls.push(['ensure']),
    ...fakeTimers,
    ...overrides,
  };
  return {
    calls: calls,
    timers: timers,
    lifecycle: createDesktopStartupLifecycle(deps),
  };
}

function runTimers(timers) {
  for (const timer of timers) {
    if (!timer.cleared) timer.callback();
  }
}

test('requestStart succeeds while the app is not quitting', () => {
  const { lifecycle } = createHarness();
  assert.equal(lifecycle.isQuitting(), false);
  assert.equal(lifecycle.requestStart(), true);
});

test('requestStart after beginQuit triggers a single relaunch', () => {
  const { lifecycle, calls } = createHarness();
  lifecycle.beginQuit();
  assert.equal(lifecycle.isQuitting(), true);
  assert.equal(lifecycle.requestStart(), false);
  assert.equal(lifecycle.requestStart(), false);
  assert.deepEqual(calls, [['relaunch', undefined]]);
});

test('requestStart forwards relaunch args', () => {
  const { lifecycle, calls } = createHarness();
  lifecycle.beginQuit();
  assert.equal(lifecycle.requestStart(['--open', 'project.aicanvas']), false);
  assert.deepEqual(calls, [['relaunch', { args: ['--open', 'project.aicanvas'] }]]);
});

test('assertStarting throws AIC_DESKTOP_STARTUP_CANCELLED once quitting', () => {
  const { lifecycle } = createHarness();
  assert.equal(lifecycle.assertStarting(), undefined);
  lifecycle.beginQuit();
  assert.throws(
    () => lifecycle.assertStarting(),
    (error) => error.code === 'AIC_DESKTOP_STARTUP_CANCELLED' && /shutdown/.test(error.message),
  );
});

test('onShellClosed ignores the quit path while quitting for an update', () => {
  const { lifecycle, timers, calls } = createHarness();
  assert.equal(lifecycle.onShellClosed({ isQuittingForUpdate: true, hasUnsavedChanges: true }), false);
  assert.equal(timers.length, 0);
  runTimers(timers);
  assert.deepEqual(calls, []);
});

test('onShellClosed keeps running when there are no unsaved changes', () => {
  const { lifecycle, timers } = createHarness();
  assert.equal(lifecycle.onShellClosed({ hasUnsavedChanges: false }), true);
  assert.equal(timers.length, 0);
});

test('onShellClosed schedules a quit when unsaved changes exist', () => {
  const { lifecycle, timers, calls } = createHarness();
  assert.equal(lifecycle.onShellClosed({ hasUnsavedChanges: true }), false);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delayMs, 1200);
  assert.deepEqual(calls, []);
  runTimers(timers);
  assert.deepEqual(calls, [['quit']]);
});

test('requestStart clears a pending quit timer', () => {
  const { lifecycle, timers, calls } = createHarness();
  lifecycle.onShellClosed({ hasUnsavedChanges: true });
  assert.equal(lifecycle.requestStart(), true);
  assert.equal(timers[0].cleared, true);
  runTimers(timers);
  assert.deepEqual(calls, []);
});

test('beginQuit clears a pending quit timer', () => {
  const { lifecycle, timers, calls } = createHarness();
  lifecycle.onShellClosed({ hasUnsavedChanges: true });
  lifecycle.beginQuit();
  assert.equal(timers[0].cleared, true);
  runTimers(timers);
  assert.deepEqual(calls, []);
});

test('a second onShellClosed replaces the pending quit timer', () => {
  const { lifecycle, timers, calls } = createHarness();
  lifecycle.onShellClosed({ hasUnsavedChanges: true });
  lifecycle.onShellClosed({ hasUnsavedChanges: true });
  assert.equal(timers.length, 2);
  assert.equal(timers[0].cleared, true);
  runTimers(timers);
  assert.deepEqual(calls, [['quit']]);
});

test('prepareBackend reuses a healthy backend without touching the port', async () => {
  const server = { exitCode: null, signalCode: null, killed: false };
  const { lifecycle, calls } = createHarness({
    getSpawnedServer: () => server,
    probeServer: async () => true,
  });
  await lifecycle.prepareBackend();
  assert.deepEqual(calls, []);
});

test('prepareBackend restarts the backend when nothing is spawned', async () => {
  const { lifecycle, calls } = createHarness();
  await lifecycle.prepareBackend();
  assert.deepEqual(calls, [['clearPort'], ['ensure']]);
});

test('prepareBackend restarts the backend when the probe fails', async () => {
  const server = { exitCode: null, signalCode: null, killed: false };
  const { lifecycle, calls } = createHarness({
    getSpawnedServer: () => server,
    probeServer: async () => false,
  });
  await lifecycle.prepareBackend();
  assert.deepEqual(calls, [['clearPort'], ['ensure']]);
});

test('prepareBackend restarts when the spawned server identity changes during the probe', async () => {
  const server = { exitCode: null, signalCode: null, killed: false };
  let current = server;
  const { lifecycle, calls } = createHarness({
    getSpawnedServer: () => current,
    probeServer: async () => {
      current = { exitCode: null, signalCode: null, killed: false };
      return true;
    },
  });
  await lifecycle.prepareBackend();
  assert.deepEqual(calls, [['clearPort'], ['ensure']]);
});

test('prepareBackend treats an exited or killed server as dead', async () => {
  for (const patch of [{ exitCode: 0 }, { signalCode: 'SIGTERM' }, { killed: true }]) {
    const server = { exitCode: null, signalCode: null, killed: false, ...patch };
    const { lifecycle, calls } = createHarness({ getSpawnedServer: () => server });
    await lifecycle.prepareBackend();
    assert.deepEqual(calls, [['clearPort'], ['ensure']]);
  }
});

test('prepareBackend fails fast when the app is already quitting', async () => {
  const { lifecycle, calls } = createHarness();
  lifecycle.beginQuit();
  await assert.rejects(
    () => lifecycle.prepareBackend(),
    (error) => error.code === 'AIC_DESKTOP_STARTUP_CANCELLED',
  );
  assert.deepEqual(calls, []);
});

test('prepareBackend aborts when quitting starts during the probe', async () => {
  const server = { exitCode: null, signalCode: null, killed: false };
  const { lifecycle, calls } = createHarness({
    getSpawnedServer: () => server,
    probeServer: async () => {
      lifecycle.beginQuit();
      return true;
    },
  });
  await assert.rejects(
    () => lifecycle.prepareBackend(),
    (error) => error.code === 'AIC_DESKTOP_STARTUP_CANCELLED',
  );
  assert.deepEqual(calls, []);
});

test('prepareBackend propagates a start failure while still running', async () => {
  const failure = new Error('port busy');
  const { lifecycle } = createHarness({
    ensureServerRunning: async () => {
      throw failure;
    },
  });
  await assert.rejects(
    () => lifecycle.prepareBackend(),
    (error) => error === failure,
  );
});

test('exposes the documented member set', () => {
  const { lifecycle } = createHarness();
  assert.deepEqual(Object.keys(lifecycle).sort(), [
    'assertStarting',
    'beginQuit',
    'isQuitting',
    'onShellClosed',
    'prepareBackend',
    'requestStart',
  ]);
});
