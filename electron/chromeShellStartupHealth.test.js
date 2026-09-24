import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHROME_SHELL_STARTUP_READY_EVENT,
  CHROME_SHELL_STARTUP_FAILED_EVENT,
} from '../src/services/chromeShellStartupReadiness.js';
import {
  resolveChromeShellStartupReadyTimeoutMs,
  createChromeShellStartupHealthController,
  __chromeShellStartupHealthForTest,
} from './chromeShellStartupHealth.js';

const { DEFAULT_READY_TIMEOUT_MS, MIN_READY_TIMEOUT_MS, MAX_READY_TIMEOUT_MS } =
  __chromeShellStartupHealthForTest;
const ATTEMPT_ID = 'startupAttempt000001';
const READY_TIMEOUT_MS = 30000;
const RUNTIME_HREF =
  'http://127.0.0.1:3000/index.html?aicRuntime=chrome-shell' +
  '&aicStartupAttemptId=' +
  ATTEMPT_ID +
  '&aicStartupReadyTimeoutMs=' +
  READY_TIMEOUT_MS;

function createFakeTimers() {
  const timers = new Map();
  const cleared = [];
  let nextId = 1;
  return {
    timers: timers,
    cleared: cleared,
    setTimeoutFn: (callback, ms) => {
      const token = { id: nextId };
      nextId += 1;
      timers.set(token, { callback: callback, ms: ms });
      return token;
    },
    clearTimeoutFn: (token) => {
      cleared.push(token);
      timers.delete(token);
    },
    fire: (token) => {
      const entry = timers.get(token);
      if (!entry) return false;
      timers.delete(token);
      entry.callback();
      return true;
    },
  };
}

function readyEvent({ source = 'renderer', href = RUNTIME_HREF, attemptId, timeoutMs } = {}) {
  return {
    type: CHROME_SHELL_STARTUP_READY_EVENT,
    source: source,
    context: {
      href: href,
      startupAttemptId: attemptId === undefined ? ATTEMPT_ID : attemptId,
      readyTimeoutMs: timeoutMs === undefined ? READY_TIMEOUT_MS : timeoutMs,
    },
  };
}

function failedEvent({ source = 'renderer', href = RUNTIME_HREF, failure = 'entry' } = {}) {
  return {
    type: CHROME_SHELL_STARTUP_FAILED_EVENT,
    source: source,
    context: { href: href, startupAttemptId: ATTEMPT_ID, readyTimeoutMs: READY_TIMEOUT_MS, failure: failure },
  };
}

function settle(promise) {
  return promise.then(
    (value) => ({ ok: true, value: value }),
    (error) => ({ ok: false, error: error }),
  );
}

test('the exported timeout bounds match the readiness module contract', () => {
  assert.equal(DEFAULT_READY_TIMEOUT_MS, 30000);
  assert.equal(MIN_READY_TIMEOUT_MS, 1000);
  assert.equal(MAX_READY_TIMEOUT_MS, 120000);
});

test('the environment override falls back to the default for missing, non-numeric and non-positive values', () => {
  assert.equal(resolveChromeShellStartupReadyTimeoutMs({}), DEFAULT_READY_TIMEOUT_MS);
  assert.equal(
    resolveChromeShellStartupReadyTimeoutMs(),
    resolveChromeShellStartupReadyTimeoutMs(process.env),
  );
  assert.equal(resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: 'abc' }), 30000);
  assert.equal(resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: '0' }), 30000);
  assert.equal(resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: '-5' }), 30000);
  assert.equal(
    resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: 'Infinity' }),
    30000,
  );
});

test('the environment override is clamped to 1000-120000 ms and rounded', () => {
  assert.equal(resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: '500' }), 1000);
  assert.equal(
    resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: '999999' }),
    120000,
  );
  assert.equal(
    resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: '12345.6' }),
    12346,
  );
  assert.equal(resolveChromeShellStartupReadyTimeoutMs({ AIC_CHROME_SHELL_READY_TIMEOUT_MS: 1500 }), 1500);
});

test('waitForReady rejects an attempt id that is not a valid identifier', async () => {
  const controller = createChromeShellStartupHealthController();
  for (const attemptId of [undefined, null, 42, '', 'short', 'bad id with spaces', 'a'.repeat(129)]) {
    await assert.rejects(
      controller.waitForReady({ startupAttemptId: attemptId }),
      (error) => error.code === 'CHROME_SHELL_STARTUP_ATTEMPT_INVALID',
    );
  }
});

test('waitForReady resolves with the elapsed time once the matching ready event arrives', async () => {
  const timers = createFakeTimers();
  const times = [1000, 1750];
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
    now: () => times.shift(),
  });
  const promise = controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID });
  assert.equal(timers.timers.size, 1);
  assert.equal(controller.observeDiagnosticEvent(readyEvent()), true);
  const result = await promise;
  assert.deepEqual(result, {
    ready: true,
    elapsedMs: 750,
    href: RUNTIME_HREF,
    startupAttemptId: ATTEMPT_ID,
  });
  assert.equal(timers.cleared.length, 1);
  assert.equal(timers.timers.size, 0);
});

test('waitForReady clamps a too-small timeout up to the minimum', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = controller.waitForReady({ timeoutMs: 500, startupAttemptId: ATTEMPT_ID });
  const [, entry] = [...timers.timers.entries()][0];
  assert.equal(entry.ms, MIN_READY_TIMEOUT_MS);
  timers.fire([...timers.timers.keys()][0]);
  const result = await settle(promise);
  assert.equal(result.error.code, 'CHROME_SHELL_RENDERER_READY_TIMEOUT');
  assert.ok(result.error.message.includes('1000ms'));
});

test('waitForReady clamps a too-large timeout down to the maximum and names it when timing out', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = controller.waitForReady({ timeoutMs: 999999, startupAttemptId: ATTEMPT_ID });
  const token = [...timers.timers.keys()][0];
  assert.equal(timers.timers.get(token).ms, MAX_READY_TIMEOUT_MS);
  timers.fire(token);
  const result = await settle(promise);
  assert.equal(result.ok, false);
  assert.ok(result.error.message.includes('120000ms'));
});

test('waitForReady defaults to the 30000 ms ready timeout', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = controller.waitForReady({ startupAttemptId: ATTEMPT_ID });
  const token = [...timers.timers.keys()][0];
  assert.equal(timers.timers.get(token).ms, DEFAULT_READY_TIMEOUT_MS);
  timers.fire(token);
  const result = await settle(promise);
  assert.equal(result.error.code, 'CHROME_SHELL_RENDERER_READY_TIMEOUT');
});

test('a ready event with a mismatched attempt id or timeout is ignored', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID });
  assert.equal(controller.observeDiagnosticEvent(readyEvent({ attemptId: 'anotherAttempt00001' })), false);
  assert.equal(controller.observeDiagnosticEvent(readyEvent({ timeoutMs: 20000 })), false);
  assert.equal(
    controller.observeDiagnosticEvent(readyEvent({ href: 'http://127.0.0.1:3000/index.html' })),
    false,
  );
  assert.equal(controller.observeDiagnosticEvent(readyEvent({ source: 'main' })), false);
  assert.equal(controller.observeDiagnosticEvent({ type: 'unrelated.event', source: 'renderer' }), false);
  assert.equal(timers.timers.size, 1);
  assert.equal(controller.observeDiagnosticEvent(readyEvent()), true);
  assert.equal((await promise).startupAttemptId, ATTEMPT_ID);
});

test('a second waitForReady replaces the first with a dedicated error code', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const first = settle(
    controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID }),
  );
  const second = controller.waitForReady({
    timeoutMs: READY_TIMEOUT_MS,
    startupAttemptId: 'secondAttempt000001',
  });
  const result = await first;
  assert.equal(result.error.code, 'CHROME_SHELL_RENDERER_READY_REPLACED');
  assert.equal(timers.timers.size, 1);
  timers.fire([...timers.timers.keys()][0]);
  assert.equal((await settle(second)).error.code, 'CHROME_SHELL_RENDERER_READY_TIMEOUT');
});

test('a failure event rejects with the reported stage', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = settle(
    controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID }),
  );
  assert.equal(controller.observeDiagnosticEvent(failedEvent({ failure: 'project-hydration' })), true);
  const result = await promise;
  assert.equal(result.error.code, 'CHROME_SHELL_RENDERER_STARTUP_FAILED');
  assert.equal(result.error.message, 'Canvas renderer initialization failed');
  assert.deepEqual(result.error.details, { stage: 'project-hydration' });
  assert.equal(timers.cleared.length, 1);
});

test('an unrecognized failure stage is normalized to initialization', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = settle(
    controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID }),
  );
  assert.equal(controller.observeDiagnosticEvent(failedEvent({ failure: 'something-else' })), true);
  const result = await promise;
  assert.equal(result.error.details.stage, 'initialization');
});

test('a failure event with no pending wait and no prior resolution is ignored', () => {
  const controller = createChromeShellStartupHealthController();
  assert.equal(controller.observeDiagnosticEvent(failedEvent()), false);
});

test('a duplicate ready event after resolution is acknowledged while metadata still matches', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID });
  assert.equal(controller.observeDiagnosticEvent(readyEvent()), true);
  await promise;
  assert.equal(controller.observeDiagnosticEvent(readyEvent()), true);
  const otherHref = RUNTIME_HREF.replace(ATTEMPT_ID, 'differentAttempt0001');
  assert.equal(controller.observeDiagnosticEvent(readyEvent({ href: otherHref })), false);
});

test('cancel with no pending wait reports false', () => {
  const controller = createChromeShellStartupHealthController();
  assert.equal(controller.cancel(), false);
});

test('cancel rejects the pending wait with the cancelled code and the custom message', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = settle(
    controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID }),
  );
  assert.equal(controller.cancel('Chrome shell startup was cancelled by the user'), true);
  const result = await promise;
  assert.equal(result.error.code, 'CHROME_SHELL_RENDERER_READY_CANCELLED');
  assert.equal(result.error.message, 'Chrome shell startup was cancelled by the user');
  assert.equal(timers.cleared.length, 1);
});

test('cancel is scoped to a matching startup attempt id', async () => {
  const timers = createFakeTimers();
  const controller = createChromeShellStartupHealthController({
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  const promise = settle(
    controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID }),
  );
  assert.equal(controller.cancel('other', { startupAttemptId: 'otherAttempt0000001' }), false);
  assert.equal(timers.timers.size, 1);
  assert.equal(controller.cancel('matching', { startupAttemptId: ATTEMPT_ID }), true);
  assert.equal((await promise).error.message, 'matching');
});

test('the default cancel message is used when none is supplied', async () => {
  const controller = createChromeShellStartupHealthController();
  const promise = settle(
    controller.waitForReady({ timeoutMs: READY_TIMEOUT_MS, startupAttemptId: ATTEMPT_ID }),
  );
  assert.equal(controller.cancel(), true);
  assert.equal((await promise).error.message, 'Chrome shell renderer readiness wait was cancelled');
});
