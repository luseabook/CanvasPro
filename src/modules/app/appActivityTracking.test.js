import test from 'node:test';
import assert from 'node:assert/strict';
import { detectClientOperatingSystem, initAppActivityTracking } from './appActivityTracking.js';

function navigatorLike(over = {}) {
  return {
    userAgentData: 'userAgentData' in over ? over.userAgentData : undefined,
    platform: 'platform' in over ? over.platform : undefined,
    userAgent: 'userAgent' in over ? over.userAgent : '',
  };
}

test('detects windows from the user agent data platform', () => {
  assert.equal(
    detectClientOperatingSystem(navigatorLike({ userAgentData: { platform: 'Windows' } })),
    'windows',
  );
  assert.equal(detectClientOperatingSystem(navigatorLike({ platform: 'Win32' })), 'windows');
  assert.equal(detectClientOperatingSystem(navigatorLike({ platform: 'Win64; x64' })), 'windows');
});

test('detects macos from the classic user agent', () => {
  assert.equal(
    detectClientOperatingSystem(
      navigatorLike({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }),
    ),
    'macos',
  );
  assert.equal(
    detectClientOperatingSystem(navigatorLike({ userAgent: 'Mozilla/5.0 Darwin Kernel' })),
    'macos',
  );
});

test('detects chromeos from the platform token', () => {
  assert.equal(detectClientOperatingSystem(navigatorLike({ platform: 'Chrome OS' })), 'chromeos');
  assert.equal(detectClientOperatingSystem(navigatorLike({ platform: 'CrOS x86_64' })), 'chromeos');
});

test('detects linux from the user agent', () => {
  assert.equal(
    detectClientOperatingSystem(navigatorLike({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })),
    'linux',
  );
});

test('unknown platforms fall back to other', () => {
  assert.equal(detectClientOperatingSystem(navigatorLike()), 'other');
  assert.equal(detectClientOperatingSystem(navigatorLike({ platform: 'FreeBSD' })), 'other');
  assert.equal(detectClientOperatingSystem(null), 'other');
  assert.equal(detectClientOperatingSystem({}), 'other');
});

test('windows wins over a mac token appearing later in the user agent', () => {
  assert.equal(
    detectClientOperatingSystem(navigatorLike({ platform: 'Win32', userAgent: 'Macintosh' })),
    'windows',
  );
});

test('the user agent data platform takes precedence over the legacy platform', () => {
  assert.equal(
    detectClientOperatingSystem(navigatorLike({ userAgentData: { platform: 'Linux' }, platform: 'Win32' })),
    'linux',
  );
});

test('detection lower-cases a mixed-case platform', () => {
  assert.equal(detectClientOperatingSystem(navigatorLike({ platform: '  WINDOWS  ' })), 'windows');
});

test('detection defaults to the global navigator', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: navigatorLike({ platform: 'Linux' }),
  });
  try {
    assert.equal(detectClientOperatingSystem(), 'linux');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous);
    else delete globalThis.navigator;
  }
});

function trackingFixture(over = {}) {
  const reports = [];
  const result = {
    success: true,
    recorded: true,
    runtimeInfoPromise: Promise.resolve({ localVersion: ' 1.2.3 ' }),
    ensureDeviceId: async () => ' dev-1 ',
    reportStartupActivity: async (payload) => {
      reports.push(payload);
      return { success: true, recorded: true };
    },
    ...over,
  };
  return { result, reports };
}

test('init reports unavailable without the two required hooks', async () => {
  for (const over of [
    { ensureDeviceId: undefined },
    { reportStartupActivity: undefined },
    { ensureDeviceId: 1 },
  ]) {
    const { result } = trackingFixture(over);
    assert.deepEqual(await initAppActivityTracking(result), {
      success: false,
      recorded: false,
      reason: 'unavailable',
    });
  }
});

test('a blank device id is refused before reporting', async () => {
  for (const deviceId of ['', '   ', null, undefined]) {
    const { result, reports } = trackingFixture({ ensureDeviceId: async () => deviceId });
    assert.deepEqual(await initAppActivityTracking(result), {
      success: false,
      recorded: false,
      reason: 'missing_device_id',
    });
    assert.equal(reports.length, 0);
  }
});

test('init reports the trimmed device id, version and detected os', async () => {
  const { result, reports } = trackingFixture();
  const outcome = await initAppActivityTracking({
    ...result,
    navigatorObject: navigatorLike({ platform: 'Windows' }),
  });
  assert.deepEqual(outcome, { success: true, recorded: true });
  assert.deepEqual(reports, [{ deviceId: 'dev-1', appVersion: '1.2.3', os: 'windows' }]);
});

test('the app version is truncated to 64 characters', async () => {
  const { result, reports } = trackingFixture({
    runtimeInfoPromise: Promise.resolve({ localVersion: 'x'.repeat(100) }),
  });
  await initAppActivityTracking(result);
  assert.equal(reports[0].appVersion.length, 64);
  assert.equal(reports[0].appVersion, 'x'.repeat(64));
});

test('a missing runtime version becomes an empty string', async () => {
  for (const runtimeInfo of [{}, { localVersion: null }, undefined]) {
    const { result, reports } = trackingFixture({ runtimeInfoPromise: Promise.resolve(runtimeInfo) });
    await initAppActivityTracking(result);
    assert.equal(reports[0].appVersion, '');
  }
});

test('a rejected runtime info promise degrades to an empty version', async () => {
  const { result, reports } = trackingFixture({ runtimeInfoPromise: Promise.reject(new Error('boom')) });
  await initAppActivityTracking(result);
  assert.equal(reports[0].appVersion, '');
  assert.equal(reports[0].deviceId, 'dev-1');
});

test('a rejected device id lookup is reported as report_failed', async () => {
  const { result } = trackingFixture({
    ensureDeviceId: async () => {
      throw new Error('keystore unavailable');
    },
  });
  assert.deepEqual(await initAppActivityTracking(result), {
    success: false,
    recorded: false,
    reason: 'report_failed',
  });
});

test('a rejected report is reported as report_failed', async () => {
  const { result } = trackingFixture({
    reportStartupActivity: async () => {
      throw new Error('offline');
    },
  });
  assert.deepEqual(await initAppActivityTracking(result), {
    success: false,
    recorded: false,
    reason: 'report_failed',
  });
});

test('the report outcome is passed through untouched', async () => {
  const { result } = trackingFixture({
    reportStartupActivity: async () => ({ success: false, recorded: false, reason: 'quota' }),
  });
  assert.deepEqual(await initAppActivityTracking(result), {
    success: false,
    recorded: false,
    reason: 'quota',
  });
});

test('init defaults its navigator object to the global navigator', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: navigatorLike({ userAgent: 'X11; Linux x86_64' }),
  });
  try {
    const { result, reports } = trackingFixture();
    await initAppActivityTracking(result);
    assert.equal(reports[0].os, 'linux');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous);
    else delete globalThis.navigator;
  }
});
