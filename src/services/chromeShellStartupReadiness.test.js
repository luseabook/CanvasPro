import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM,
  CHROME_SHELL_STARTUP_READY_EVENT,
  CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM,
  DEFAULT_CHROME_SHELL_STARTUP_READY_DELAY_MS,
  buildChromeShellStartupMetadataUrl,
  isChromeShellRuntimeHref,
  isChromeShellStartupAttemptId,
  readChromeShellStartupMetadata,
  scheduleChromeShellStartupReady,
} from './chromeShellStartupReadiness.js';

const ATTEMPT_ID = 'startup-attempt-0001';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const CHROME_SHELL_HREF = `http://127.0.0.1:8777/?aicRuntime=chrome-shell&${CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM}=${ATTEMPT_ID}&${CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM}=60000`;

test('chromeShellStartupReadiness: runtime href requires loopback host and chrome-shell marker', () => {
  assert.equal(isChromeShellRuntimeHref(CHROME_SHELL_HREF), true);
  assert.equal(isChromeShellRuntimeHref('http://localhost:8777/?aicRuntime=chrome-shell'), true);
  assert.equal(isChromeShellRuntimeHref('http://[::1]:8777/?aicRuntime=chrome-shell'), false);
  assert.equal(isChromeShellRuntimeHref('https://example.com/?aicRuntime=chrome-shell'), false);
  assert.equal(isChromeShellRuntimeHref('http://127.0.0.1:8777/'), false);
  assert.equal(isChromeShellRuntimeHref('not a url'), false);
  assert.equal(isChromeShellRuntimeHref(''), false);
});

test('chromeShellStartupReadiness: attempt id validation bounds length and charset', () => {
  assert.equal(isChromeShellStartupAttemptId(ATTEMPT_ID), true);
  assert.equal(isChromeShellStartupAttemptId('a'.repeat(16)), true);
  assert.equal(isChromeShellStartupAttemptId('a'.repeat(128)), true);
  assert.equal(isChromeShellStartupAttemptId('a'.repeat(15)), false);
  assert.equal(isChromeShellStartupAttemptId('a'.repeat(129)), false);
  assert.equal(isChromeShellStartupAttemptId('attempt id with spaces'), false);
  assert.equal(isChromeShellStartupAttemptId('attempt/with+slash'), false);
  assert.equal(isChromeShellStartupAttemptId(null), false);
  assert.equal(isChromeShellStartupAttemptId(1234), false);
});

test('chromeShellStartupReadiness: metadata url encodes both startup params and rejects invalid input', () => {
  const url = buildChromeShellStartupMetadataUrl('http://127.0.0.1:8777/?aicRuntime=chrome-shell', {
    startupAttemptId: ATTEMPT_ID,
    readyTimeoutMs: 60000,
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('aicRuntime'), 'chrome-shell');
  assert.equal(parsed.searchParams.get(CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM), ATTEMPT_ID);
  assert.equal(parsed.searchParams.get(CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM), '60000');
  assert.throws(
    () =>
      buildChromeShellStartupMetadataUrl('http://127.0.0.1:8777/', {
        startupAttemptId: 'short',
        readyTimeoutMs: 60000,
      }),
    /Invalid Chrome shell startup attempt id/,
  );
  assert.throws(
    () =>
      buildChromeShellStartupMetadataUrl('http://127.0.0.1:8777/', {
        startupAttemptId: ATTEMPT_ID,
        readyTimeoutMs: 999,
      }),
    /Invalid Chrome shell startup ready timeout/,
  );
  assert.throws(
    () =>
      buildChromeShellStartupMetadataUrl('http://127.0.0.1:8777/', {
        startupAttemptId: ATTEMPT_ID,
        readyTimeoutMs: 120001,
      }),
    /Invalid Chrome shell startup ready timeout/,
  );
});

test('chromeShellStartupReadiness: metadata reader returns null outside chrome shell and for bad params', () => {
  assert.deepEqual(readChromeShellStartupMetadata(CHROME_SHELL_HREF), {
    startupAttemptId: ATTEMPT_ID,
    readyTimeoutMs: 60000,
  });
  assert.equal(readChromeShellStartupMetadata('https://example.com/?aicRuntime=chrome-shell'), null);
  assert.equal(readChromeShellStartupMetadata('http://127.0.0.1:8777/?aicRuntime=chrome-shell'), null);
  assert.equal(
    readChromeShellStartupMetadata(
      `http://127.0.0.1:8777/?aicRuntime=chrome-shell&${CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM}=short&${CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM}=60000`,
    ),
    null,
  );
  assert.equal(
    readChromeShellStartupMetadata(
      `http://127.0.0.1:8777/?aicRuntime=chrome-shell&${CHROME_SHELL_STARTUP_ATTEMPT_ID_PARAM}=${ATTEMPT_ID}&${CHROME_SHELL_STARTUP_READY_TIMEOUT_MS_PARAM}=0999`,
    ),
    null,
  );
});

test('chromeShellStartupReadiness: scheduler returns null without a chrome shell window or diagnostics', () => {
  const timers = [];
  const setTimeoutFn = (fn, ms) => {
    timers.push({ fn, ms });
    return timers.length;
  };
  assert.equal(
    scheduleChromeShellStartupReady({
      windowObject: { location: { href: 'http://127.0.0.1:8777/' }, performance: { now: () => 0 } },
      diagnostics: { logEvent: () => ({ startupReadyAccepted: true }) },
      setTimeoutFn,
    }),
    null,
  );
  assert.equal(
    scheduleChromeShellStartupReady({
      windowObject: { location: { href: CHROME_SHELL_HREF }, performance: { now: () => 0 } },
      diagnostics: {},
      setTimeoutFn,
    }),
    null,
  );
  assert.deepEqual(timers, []);
});

test('chromeShellStartupReadiness: accepted ready report logs once and stops retrying', () => {
  const timers = [];
  const events = [];
  const setTimeoutFn = (fn, ms) => {
    timers.push({ fn, ms });
    return timers.length;
  };
  const handle = scheduleChromeShellStartupReady({
    windowObject: { location: { href: CHROME_SHELL_HREF }, performance: { now: () => 0 } },
    diagnostics: {
      logEvent: (event) => {
        events.push(event);
        return { startupReadyAccepted: true };
      },
    },
    setTimeoutFn,
  });
  assert.equal(handle, 1);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].ms, DEFAULT_CHROME_SHELL_STARTUP_READY_DELAY_MS);
  timers[0].fn();
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    type: CHROME_SHELL_STARTUP_READY_EVENT,
    level: 'info',
    source: 'renderer',
    message: 'Chrome shell renderer completed startup',
    context: {
      attempt: 1,
      href: CHROME_SHELL_HREF,
      navigationElapsedMs: 0,
      readyTimeoutMs: 60000,
      remainingTimeoutMs: 60000,
      startupAttemptId: ATTEMPT_ID,
      userAgent: '',
    },
  });
  assert.equal(timers.length, 1);
});

test('chromeShellStartupReadiness: unaccepted ready report schedules a retry with the clamped delay', async () => {
  const timers = [];
  const setTimeoutFn = (fn, ms) => {
    timers.push({ fn, ms });
    return timers.length;
  };
  const handle = scheduleChromeShellStartupReady({
    windowObject: { location: { href: CHROME_SHELL_HREF }, performance: { now: () => 0 } },
    diagnostics: { logEvent: () => ({ startupReadyAccepted: false }) },
    setTimeoutFn,
    maxAttempts: 2,
  });
  assert.equal(handle, 1);
  assert.equal(timers.length, 1);
  timers[0].fn();
  await tick();
  assert.equal(timers.length, 2);
  assert.equal(timers[1].ms, 750);
  timers[1].fn();
  await tick();
  assert.equal(timers.length, 2);
});

test('chromeShellStartupReadiness: navigation elapsed time never exceeds the ready budget', () => {
  const timers = [];
  const events = [];
  const setTimeoutFn = (fn, ms) => {
    timers.push({ fn, ms });
    return timers.length;
  };
  scheduleChromeShellStartupReady({
    windowObject: { location: { href: CHROME_SHELL_HREF }, performance: { now: () => 12000 } },
    diagnostics: {
      logEvent: (event) => {
        events.push(event);
        return { startupReadyAccepted: true };
      },
    },
    setTimeoutFn,
  });
  assert.equal(timers[0].ms, 1500);
  timers[0].fn();
  assert.equal(events[0].context.navigationElapsedMs, 12000);
  assert.equal(events[0].context.remainingTimeoutMs, 48000);
});
