import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  createChromeShellProfileRecovery,
  runChromeShellStartupWithProfileRecovery,
  __chromeShellProfileRecoveryForTest,
} from './chromeShellProfileRecovery.js';

const {
  CHROME_SHELL_RENDERER_READY_TIMEOUT,
  DEFAULT_MAX_RECOVERY_ATTEMPTS,
  formatRecoveryTimestamp,
  resolveRecoveryPaths,
} = __chromeShellProfileRecoveryForTest;
const SESSION_ROOT = path.resolve('chrome-shell-session-data');
const PROFILE_DIR = path.join(SESSION_ROOT, 'chrome-shell-profile');
const FIXED_TIME = new Date('2026-09-24T01:02:03.000Z');
const FIXED_STAMP = '20260924-010203';

function createExistsDouble(taken) {
  const calls = [];
  const exists = (target) => {
    calls.push(target);
    return taken.has(target);
  };
  exists.calls = calls;
  return exists;
}

function createRenameDouble(plan) {
  const calls = [];
  let index = 0;
  const rename = (from, to) => {
    calls.push([from, to]);
    const step = Array.isArray(plan) ? plan[Math.min(index, plan.length - 1)] : plan;
    index += 1;
    if (step) throw step;
  };
  rename.calls = calls;
  return rename;
}

function lockedError(code = 'EPERM') {
  return Object.assign(new Error('profile is locked'), { code: code });
}

function readyTimeoutError() {
  return Object.assign(new Error('renderer timed out'), { code: CHROME_SHELL_RENDERER_READY_TIMEOUT });
}

function createRecovery({ taken = new Set(), plan = [], delay } = {}) {
  const exists = createExistsDouble(taken);
  const rename = createRenameDouble(plan);
  const delays = [];
  const recovery = createChromeShellProfileRecovery({
    sessionDataRoot: SESSION_ROOT,
    profileDir: PROFILE_DIR,
    exists: exists,
    rename: rename,
    now: () => FIXED_TIME,
    delay:
      delay ||
      ((ms) => {
        delays.push(ms);
        return Promise.resolve();
      }),
  });
  return { recovery: recovery, exists: exists, rename: rename, delays: delays };
}

function createLogDouble() {
  const events = [];
  const logEvent = (event) => {
    events.push(event);
  };
  logEvent.events = events;
  return logEvent;
}

test('the exported constants match the readiness and recovery contract', () => {
  assert.equal(CHROME_SHELL_RENDERER_READY_TIMEOUT, 'CHROME_SHELL_RENDERER_READY_TIMEOUT');
  assert.equal(DEFAULT_MAX_RECOVERY_ATTEMPTS, 1);
});

test('formatRecoveryTimestamp renders a filesystem-safe stamp', () => {
  assert.equal(formatRecoveryTimestamp(FIXED_TIME), FIXED_STAMP);
  assert.equal(formatRecoveryTimestamp(FIXED_TIME.getTime()), FIXED_STAMP);
  assert.equal(formatRecoveryTimestamp('2026-09-24T01:02:03.000Z'), FIXED_STAMP);
  assert.equal(formatRecoveryTimestamp(FIXED_TIME).length, 15);
});

test('formatRecoveryTimestamp rejects an unparsable value', () => {
  assert.throws(
    () => formatRecoveryTimestamp('not-a-date'),
    (error) => error.code === 'CHROME_SHELL_PROFILE_RECOVERY_TIMESTAMP_INVALID',
  );
});

test('resolveRecoveryPaths accepts the three supported browsers', () => {
  for (const browser of ['chrome', 'chromium', 'edge']) {
    const result = resolveRecoveryPaths({
      sessionDataRoot: SESSION_ROOT,
      profileDir: path.join(SESSION_ROOT, browser + '-shell-profile'),
    });
    assert.equal(result.sessionDataRoot, SESSION_ROOT);
    assert.equal(result.profileDir, path.join(SESSION_ROOT, browser + '-shell-profile'));
  }
});

test('resolveRecoveryPaths rejects blank, unrelated and non-profile paths', () => {
  const invalid = [
    {},
    { sessionDataRoot: SESSION_ROOT, profileDir: '' },
    { sessionDataRoot: '   ', profileDir: PROFILE_DIR },
    { sessionDataRoot: SESSION_ROOT, profileDir: path.join(SESSION_ROOT, 'firefox-shell-profile') },
    { sessionDataRoot: SESSION_ROOT, profileDir: path.join(SESSION_ROOT, 'chrome-shell-profile-2') },
    { sessionDataRoot: SESSION_ROOT, profileDir: path.resolve('other-root', 'chrome-shell-profile') },
  ];
  for (const input of invalid) {
    assert.throws(
      () => resolveRecoveryPaths(input),
      (error) => error.code === 'CHROME_SHELL_PROFILE_RECOVERY_PATH_INVALID',
    );
  }
});

test('rotate refuses to run when the profile directory is already gone', () => {
  const { recovery, rename } = createRecovery({ taken: new Set() });
  assert.throws(
    () => recovery.rotate(),
    (error) => error.code === 'CHROME_SHELL_PROFILE_RECOVERY_SOURCE_MISSING',
  );
  assert.equal(rename.calls.length, 0);
});

test('rotate renames the profile to a timestamped backup directory', () => {
  const { recovery, rename } = createRecovery({ taken: new Set([PROFILE_DIR]) });
  const result = recovery.rotate();
  assert.deepEqual(result, {
    rotated: true,
    profileDir: PROFILE_DIR,
    backupDir: PROFILE_DIR + '.recovery-' + FIXED_STAMP,
  });
  assert.deepEqual(rename.calls, [[PROFILE_DIR, PROFILE_DIR + '.recovery-' + FIXED_STAMP]]);
});

test('rotate appends a numeric suffix when the timestamped name is taken', () => {
  const taken = new Set([PROFILE_DIR, PROFILE_DIR + '.recovery-' + FIXED_STAMP]);
  const { recovery } = createRecovery({ taken: taken });
  assert.equal(recovery.rotate().backupDir, PROFILE_DIR + '.recovery-' + FIXED_STAMP + '-1');
});

test('rotate reports an unavailable backup name once every suffix is taken', () => {
  const taken = new Set([PROFILE_DIR, PROFILE_DIR + '.recovery-' + FIXED_STAMP]);
  for (let suffix = 1; suffix <= 999; suffix += 1)
    taken.add(PROFILE_DIR + '.recovery-' + FIXED_STAMP + '-' + suffix);
  const { recovery } = createRecovery({ taken: taken });
  assert.throws(
    () => recovery.rotate(),
    (error) => error.code === 'CHROME_SHELL_PROFILE_RECOVERY_BACKUP_UNAVAILABLE',
  );
});

test('rotate wraps a filesystem rename failure and keeps the cause', () => {
  const failure = lockedError();
  const { recovery } = createRecovery({ taken: new Set([PROFILE_DIR]), plan: [failure] });
  assert.throws(
    () => recovery.rotate(),
    (error) =>
      error.code === 'CHROME_SHELL_PROFILE_RECOVERY_RENAME_FAILED' &&
      error.cause === failure &&
      error.message === 'Chrome shell profile could not be backed up for recovery',
  );
});

test('rotateWhenReleased succeeds on the first attempt without waiting', async () => {
  const { recovery, delays } = createRecovery({ taken: new Set([PROFILE_DIR]) });
  const result = await recovery.rotateWhenReleased();
  assert.equal(result.rotated, true);
  assert.equal(result.renameAttempts, 1);
  assert.deepEqual(delays, []);
});

test('rotateWhenReleased walks the retry ladder while the profile stays locked', async () => {
  const plan = [lockedError(), lockedError(), lockedError('EACCES'), null];
  const { recovery, delays } = createRecovery({ taken: new Set([PROFILE_DIR]), plan: plan });
  const result = await recovery.rotateWhenReleased();
  assert.equal(result.renameAttempts, 4);
  assert.deepEqual(delays, [200, 400, 800]);
});

test('rotateWhenReleased gives up after the last retry delay', async () => {
  const { recovery, delays } = createRecovery({
    taken: new Set([PROFILE_DIR]),
    plan: [lockedError()],
  });
  const error = await recovery.rotateWhenReleased().then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(error.code, 'CHROME_SHELL_PROFILE_RECOVERY_RENAME_FAILED');
  assert.equal(error.renameAttempts, 6);
  assert.deepEqual(delays, [200, 400, 800, 1200, 1400]);
});

test('rotateWhenReleased does not retry a non-retryable filesystem code', async () => {
  const { recovery, delays } = createRecovery({
    taken: new Set([PROFILE_DIR]),
    plan: [lockedError('ENOENT')],
  });
  const error = await recovery.rotateWhenReleased().then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(error.code, 'CHROME_SHELL_PROFILE_RECOVERY_RENAME_FAILED');
  assert.equal(error.renameAttempts, 1);
  assert.deepEqual(delays, []);
});

test('rotateWhenReleased does not retry a missing source directory', async () => {
  const { recovery, delays } = createRecovery({ taken: new Set() });
  const error = await recovery.rotateWhenReleased().then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(error.code, 'CHROME_SHELL_PROFILE_RECOVERY_SOURCE_MISSING');
  assert.equal(error.renameAttempts, 1);
  assert.deepEqual(delays, []);
});

test('the recovery loop requires both callbacks', async () => {
  await assert.rejects(
    runChromeShellStartupWithProfileRecovery({ rotateProfile: async () => ({}) }),
    (error) =>
      error instanceof TypeError && error.message === 'Chrome shell startup attempt factory is required',
  );
  await assert.rejects(
    runChromeShellStartupWithProfileRecovery({ startAttempt: async () => ({}) }),
    (error) =>
      error instanceof TypeError && error.message === 'Chrome shell profile recovery operation is required',
  );
});

test('a healthy first attempt reports no recovery', async () => {
  const runtime = { pid: 4242 };
  const attempts = [];
  const result = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async (payload) => (attempts.push(payload), runtime),
    rotateProfile: async () => {
      throw new Error('rotation must not run');
    },
  });
  assert.deepEqual(attempts, [{ attemptNumber: 1, recoveryCount: 0 }]);
  assert.equal(result.runtime, runtime);
  assert.deepEqual(result.profileRecovery, { recovered: false, recoveryCount: 0, backupDir: '' });
});

test('a renderer timeout triggers one rotation and reports the successful retry', async () => {
  const runtime = { pid: 4242 };
  const logEvent = createLogDouble();
  const attempts = [];
  const rotations = [];
  const backupDir = PROFILE_DIR + '.recovery-' + FIXED_STAMP;
  const result = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async (payload) => {
      attempts.push(payload);
      if (attempts.length === 1) throw readyTimeoutError();
      return runtime;
    },
    rotateProfile: async (payload) => (
      rotations.push(payload),
      { rotated: true, backupDir: backupDir, renameAttempts: 2 }
    ),
    logEvent: logEvent,
  });
  assert.deepEqual(attempts, [
    { attemptNumber: 1, recoveryCount: 0 },
    { attemptNumber: 2, recoveryCount: 1 },
  ]);
  assert.equal(rotations.length, 1);
  assert.equal(rotations[0].recoveryCount, 0);
  assert.equal(rotations[0].error.code, CHROME_SHELL_RENDERER_READY_TIMEOUT);
  assert.deepEqual(
    logEvent.events.map((event) => event.type),
    [
      'chrome_shell.profile_recovery_started',
      'chrome_shell.profile_rotated',
      'chrome_shell.profile_recovery_succeeded',
    ],
  );
  assert.equal(logEvent.events[1].context.backupName, path.basename(backupDir));
  assert.equal(logEvent.events[1].context.renameAttempts, 2);
  assert.equal(logEvent.events[2].context.recoveryCount, 1);
  assert.deepEqual(result.profileRecovery, { recovered: true, recoveryCount: 1, backupDir: backupDir });
  assert.equal(result.runtime, runtime);
});

test('a non-timeout startup failure is rethrown without rotating', async () => {
  const failure = Object.assign(new Error('renderer crashed'), { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  const result = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async () => {
      throw failure;
    },
    rotateProfile: async () => {
      throw new Error('rotation must not run');
    },
  }).then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(result, failure);
});

test('the default recovery budget allows a single retry and no more', async () => {
  const logEvent = createLogDouble();
  const error = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async () => {
      throw readyTimeoutError();
    },
    rotateProfile: async () => ({ rotated: true, backupDir: PROFILE_DIR + '.recovery-' + FIXED_STAMP }),
    logEvent: logEvent,
  }).then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(error.code, CHROME_SHELL_RENDERER_READY_TIMEOUT);
  assert.equal(logEvent.events.filter((event) => event.type === 'chrome_shell.profile_rotated').length, 1);
  const failed = logEvent.events.at(-1);
  assert.equal(failed.type, 'chrome_shell.profile_recovery_failed');
  assert.equal(failed.context.recoveryCount, 1);
});

test('a zero recovery budget disables rotation entirely', async () => {
  const error = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async () => {
      throw readyTimeoutError();
    },
    rotateProfile: async () => {
      throw new Error('rotation must not run');
    },
    maxRecoveryAttempts: 0,
  }).then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(error.code, CHROME_SHELL_RENDERER_READY_TIMEOUT);
});

test('a rotation failure is reported on the startup error and logged with its filesystem cause', async () => {
  const logEvent = createLogDouble();
  const rotationError = Object.assign(new Error('rename failed'), {
    code: 'CHROME_SHELL_PROFILE_RECOVERY_RENAME_FAILED',
    renameAttempts: 3,
    cause: { code: 'EBUSY' },
  });
  const startupError = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async () => {
      throw readyTimeoutError();
    },
    rotateProfile: async () => {
      throw rotationError;
    },
    logEvent: logEvent,
  }).then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(startupError.code, CHROME_SHELL_RENDERER_READY_TIMEOUT);
  assert.equal(startupError.profileRecoveryError, rotationError);
  const failed = logEvent.events.at(-1);
  assert.equal(failed.type, 'chrome_shell.profile_recovery_failed');
  assert.equal(failed.error, rotationError);
  assert.equal(failed.context.renameAttempts, 3);
  assert.equal(failed.context.filesystemCode, 'EBUSY');
});

test('a rotation that reports rotated false is treated as a failed recovery', async () => {
  const startupError = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async () => {
      throw readyTimeoutError();
    },
    rotateProfile: async () => ({ rotated: false }),
  }).then(
    () => null,
    (thrown) => thrown,
  );
  assert.equal(startupError.code, CHROME_SHELL_RENDERER_READY_TIMEOUT);
  assert.equal(startupError.profileRecoveryError.code, 'CHROME_SHELL_PROFILE_RECOVERY_NOT_ROTATED');
});

test('recovery works without a log sink and tolerates a rotation result without a backup directory', async () => {
  const result = await runChromeShellStartupWithProfileRecovery({
    startAttempt: async (payload) =>
      payload.recoveryCount === 1 ? { pid: 1 } : Promise.reject(readyTimeoutError()),
    rotateProfile: async () => ({ rotated: true }),
  });
  assert.deepEqual(result.profileRecovery, { recovered: true, recoveryCount: 1, backupDir: '' });
});
