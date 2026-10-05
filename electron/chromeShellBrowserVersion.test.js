import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import {
  DEFAULT_MIN_CHROME_VERSION,
  DEFAULT_MIN_EDGE_VERSION,
  DEFAULT_MIN_CHROMIUM_VERSION,
  compareBrowserVersions,
  identifyChromeShellBrowser,
  readBrowserExecutableVersion,
  inspectChromeShellBrowserVersion,
  checkChromeShellBrowserVersionBeforeLaunch,
  __chromeShellBrowserVersionForTest,
} from './chromeShellBrowserVersion.js';

const {
  WINDOWS_VERSION_SCRIPT,
  clearRememberedBrowserChoice,
  parseVersionParts,
  resolveMinimumBrowserVersion,
} = __chromeShellBrowserVersionForTest;
const WINDOWS_BROWSER_PATH_ENV_NAME = 'AIC_CHROME_SHELL_BROWSER_PATH_BASE64';
const VERSION_CHECK_TIMEOUT_MS = 5000;
const CHROME_PATH = '/opt/google/chrome/chrome';
const EDGE_PATH = '/opt/microsoft/msedge/msedge.exe';

function versionResult(version) {
  return { status: 0, stdout: version + '\n', stderr: '' };
}

function createSpawnDouble(plan) {
  const calls = [];
  const spawnProcess = (command, args, options) => {
    calls.push({ command: command, args: args, options: options });
    const step = typeof plan === 'function' ? plan(command) : plan[command];
    if (step instanceof Error) throw step;
    return step ?? { status: 1, stdout: '', stderr: '' };
  };
  spawnProcess.calls = calls;
  return spawnProcess;
}

function createLogDouble() {
  const events = [];
  const logEvent = (event) => events.push(event);
  logEvent.events = events;
  return logEvent;
}

test('parseVersionParts extracts and pads numeric version parts', () => {
  assert.deepEqual(parseVersionParts('148.0.7778.280'), {
    text: '148.0.7778.280',
    parts: [148, 0, 7778, 280],
  });
  assert.deepEqual(parseVersionParts('1.2'), { text: '1.2', parts: [1, 2, 0, 0] });
  assert.deepEqual(parseVersionParts('Google Chrome 148.0.7778.280'), {
    text: '148.0.7778.280',
    parts: [148, 0, 7778, 280],
  });
});

test('parseVersionParts rejects version text without at least one dotted pair', () => {
  assert.equal(parseVersionParts('148'), null);
  assert.equal(parseVersionParts('no version here'), null);
  assert.equal(parseVersionParts(''), null);
  assert.equal(parseVersionParts(null), null);
});

test('compareBrowserVersions orders versions and returns null when either side is unparseable', () => {
  assert.equal(compareBrowserVersions('148.0.7778.280', '148.0.0.0'), 1);
  assert.equal(compareBrowserVersions('147.9.9.9', '148.0.0.0'), -1);
  assert.equal(compareBrowserVersions('148.0.7778.280', '148.0.7778.280'), 0);
  assert.equal(compareBrowserVersions('148.0', '148.0.0.0'), 0);
  assert.equal(compareBrowserVersions('148.0.0.0', 'not-a-version'), null);
  assert.equal(compareBrowserVersions(null, '148.0.0.0'), null);
});

test('identifyChromeShellBrowser recognizes every supported browser name', () => {
  for (const name of ['chrome.exe', 'chrome', 'google chrome', 'google-chrome', 'google-chrome-stable'])
    assert.equal(identifyChromeShellBrowser('/x/' + name), 'chrome');
  for (const name of ['msedge.exe', 'msedge', 'microsoft edge', 'microsoft-edge', 'microsoft-edge-stable'])
    assert.equal(identifyChromeShellBrowser('/x/' + name), 'edge');
  for (const name of ['chromium', 'chromium-browser'])
    assert.equal(identifyChromeShellBrowser('/x/' + name), 'chromium');
});

test('identifyChromeShellBrowser is case-insensitive and defaults to unknown', () => {
  assert.equal(identifyChromeShellBrowser('/x/CHROME.EXE'), 'chrome');
  assert.equal(identifyChromeShellBrowser('/x/Microsoft-Edge'), 'edge');
  assert.equal(identifyChromeShellBrowser('/x/firefox.exe'), 'unknown');
  assert.equal(identifyChromeShellBrowser(''), 'unknown');
  assert.equal(identifyChromeShellBrowser(null), 'unknown');
});

test('WINDOWS_VERSION_SCRIPT carries the base64 path handoff and six semicolon-joined lines', () => {
  assert.equal(typeof WINDOWS_VERSION_SCRIPT, 'string');
  assert.equal(WINDOWS_VERSION_SCRIPT.split('; ').length, 6);
  assert.ok(WINDOWS_VERSION_SCRIPT.includes('$env:' + WINDOWS_BROWSER_PATH_ENV_NAME));
  assert.ok(WINDOWS_VERSION_SCRIPT.includes('[Convert]::FromBase64String($encodedTarget)'));
  assert.ok(WINDOWS_VERSION_SCRIPT.includes('if (-not $target) { exit 2 }'));
  assert.ok(WINDOWS_VERSION_SCRIPT.includes('[Console]::Out.Write($item.VersionInfo.ProductVersion)'));
});

test('readBrowserExecutableVersion on win32 drives powershell with a base64 target env var', () => {
  const spawnProcess = createSpawnDouble(() => versionResult('148.0.7778.280'));
  const env = { SystemRoot: 'C:\\Windows' };
  const version = readBrowserExecutableVersion({
    browserPath: 'C:\\Chrome\\chrome.exe',
    env: env,
    platform: 'win32',
    spawnProcess: spawnProcess,
  });
  assert.equal(version, '148.0.7778.280');
  assert.equal(spawnProcess.calls.length, 1);
  const [call] = spawnProcess.calls;
  assert.equal(call.command, 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
  assert.deepEqual(call.args, [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    WINDOWS_VERSION_SCRIPT,
  ]);
  assert.equal(call.options.encoding, 'utf8');
  assert.equal(call.options.timeout, VERSION_CHECK_TIMEOUT_MS);
  assert.equal(call.options.windowsHide, true);
  assert.deepEqual(call.options.env, {
    SystemRoot: 'C:\\Windows',
    [WINDOWS_BROWSER_PATH_ENV_NAME]: Buffer.from('C:\\Chrome\\chrome.exe', 'utf8').toString('base64'),
  });
});

test('readBrowserExecutableVersion on non-win32 runs the executable with --version', () => {
  const spawnProcess = createSpawnDouble(() => versionResult('Google Chrome 148.0.7778.280'));
  const version = readBrowserExecutableVersion({
    browserPath: '  ' + CHROME_PATH + '  ',
    env: {},
    platform: 'linux',
    spawnProcess: spawnProcess,
  });
  assert.equal(version, '148.0.7778.280');
  const [call] = spawnProcess.calls;
  assert.equal(call.command, CHROME_PATH);
  assert.deepEqual(call.args, ['--version']);
  assert.equal(call.options.encoding, 'utf8');
  assert.equal(call.options.timeout, VERSION_CHECK_TIMEOUT_MS);
  assert.equal(call.options.windowsHide, true);
});

test('readBrowserExecutableVersion returns an empty string for a blank path without spawning', () => {
  const spawnProcess = createSpawnDouble(() => versionResult('148.0.7778.280'));
  assert.equal(
    readBrowserExecutableVersion({ browserPath: '   ', platform: 'linux', spawnProcess: spawnProcess }),
    '',
  );
  assert.equal(readBrowserExecutableVersion({ platform: 'linux', spawnProcess: spawnProcess }), '');
  assert.equal(spawnProcess.calls.length, 0);
});

test('readBrowserExecutableVersion discards results with a non-zero status, error or signal', () => {
  const failingStatus = createSpawnDouble(() => ({ status: 1, stdout: '148.0.7778.280', stderr: '' }));
  assert.equal(
    readBrowserExecutableVersion({
      browserPath: CHROME_PATH,
      platform: 'linux',
      spawnProcess: failingStatus,
    }),
    '',
  );
  const errorResult = createSpawnDouble(() => ({
    status: 0,
    stdout: '148.0.7778.280',
    error: new Error('nope'),
  }));
  assert.equal(
    readBrowserExecutableVersion({ browserPath: CHROME_PATH, platform: 'linux', spawnProcess: errorResult }),
    '',
  );
  const signalResult = createSpawnDouble(() => ({
    status: 0,
    stdout: '148.0.7778.280',
    signal: 'SIGTERM',
  }));
  assert.equal(
    readBrowserExecutableVersion({ browserPath: CHROME_PATH, platform: 'linux', spawnProcess: signalResult }),
    '',
  );
});

test('readBrowserExecutableVersion swallows a throwing spawn process', () => {
  const spawnProcess = createSpawnDouble(() => new Error('spawn ENOENT'));
  assert.equal(
    readBrowserExecutableVersion({ browserPath: CHROME_PATH, platform: 'linux', spawnProcess: spawnProcess }),
    '',
  );
});

test('resolveMinimumBrowserVersion honours env overrides and per-kind defaults', () => {
  assert.equal(
    resolveMinimumBrowserVersion('chrome', { AIC_CHROME_SHELL_MIN_CHROME_VERSION: '149.0.0.0' }),
    '149.0.0.0',
  );
  assert.equal(
    resolveMinimumBrowserVersion('edge', { AIC_CHROME_SHELL_MIN_EDGE_VERSION: '150.0.0.0' }),
    '150.0.0.0',
  );
  assert.equal(
    resolveMinimumBrowserVersion('chromium', { AIC_CHROME_SHELL_MIN_CHROMIUM_VERSION: '151.0.0.0' }),
    '151.0.0.0',
  );
  assert.equal(resolveMinimumBrowserVersion('chrome', {}), DEFAULT_MIN_CHROME_VERSION);
  assert.equal(resolveMinimumBrowserVersion('edge', {}), DEFAULT_MIN_EDGE_VERSION);
  assert.equal(resolveMinimumBrowserVersion('chromium', {}), DEFAULT_MIN_CHROMIUM_VERSION);
  assert.equal(resolveMinimumBrowserVersion('unknown', {}), DEFAULT_MIN_CHROME_VERSION);
});

test('inspectChromeShellBrowserVersion reports unsupported browsers without spawning', () => {
  const spawnProcess = createSpawnDouble(() => versionResult('148.0.7778.280'));
  const inspection = inspectChromeShellBrowserVersion({
    browserPath: '/x/firefox.exe',
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
  });
  assert.deepEqual(inspection, {
    browserKind: 'unknown',
    browserPath: '/x/firefox.exe',
    version: '',
    minimumVersion: DEFAULT_MIN_CHROME_VERSION,
    checked: false,
    outdated: true,
    reason: 'unsupported-browser',
  });
  assert.equal(spawnProcess.calls.length, 0);
});

test('inspectChromeShellBrowserVersion reports version-unavailable when no version can be read', () => {
  const spawnProcess = createSpawnDouble(() => ({ status: 1, stdout: '', stderr: '' }));
  const inspection = inspectChromeShellBrowserVersion({
    browserPath: CHROME_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
  });
  assert.equal(inspection.browserKind, 'chrome');
  assert.equal(inspection.version, '');
  assert.equal(inspection.checked, false);
  assert.equal(inspection.outdated, true);
  assert.equal(inspection.reason, 'version-unavailable');
  assert.equal(inspection.minimumVersion, DEFAULT_MIN_CHROME_VERSION);
});

test('inspectChromeShellBrowserVersion reports version-too-old below the minimum', () => {
  const spawnProcess = createSpawnDouble(() => versionResult('100.0.0.0'));
  const inspection = inspectChromeShellBrowserVersion({
    browserPath: CHROME_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
  });
  assert.deepEqual(inspection, {
    browserKind: 'chrome',
    browserPath: CHROME_PATH,
    version: '100.0.0.0',
    minimumVersion: DEFAULT_MIN_CHROME_VERSION,
    checked: true,
    outdated: true,
    reason: 'version-too-old',
  });
});

test('inspectChromeShellBrowserVersion reports supported at or above the minimum', () => {
  const spawnProcess = createSpawnDouble(() => versionResult(DEFAULT_MIN_CHROME_VERSION));
  const inspection = inspectChromeShellBrowserVersion({
    browserPath: CHROME_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
  });
  assert.equal(inspection.checked, true);
  assert.equal(inspection.outdated, false);
  assert.equal(inspection.reason, 'supported');
});

test('clearRememberedBrowserChoice unlinks the remembered preference path', () => {
  const calls = [];
  clearRememberedBrowserChoice('/tmp/browser-choice.json', (target) => calls.push(target));
  assert.deepEqual(calls, ['/tmp/browser-choice.json']);
});

test('clearRememberedBrowserChoice skips an empty path and swallows unlink failures', () => {
  const calls = [];
  clearRememberedBrowserChoice('', (target) => calls.push(target));
  clearRememberedBrowserChoice(null, (target) => calls.push(target));
  assert.deepEqual(calls, []);
  assert.doesNotThrow(() =>
    clearRememberedBrowserChoice('/tmp/browser-choice.json', () => {
      throw new Error('EBUSY');
    }),
  );
});

test('checkChromeShellBrowserVersionBeforeLaunch continues on a validated primary browser', async () => {
  const spawnProcess = createSpawnDouble(() => versionResult('148.0.7778.280'));
  const logEvent = createLogDouble();
  const result = await checkChromeShellBrowserVersionBeforeLaunch({
    browserPath: CHROME_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
    logEvent: logEvent,
  });
  assert.equal(result.continueLaunch, true);
  assert.equal(result.action, 'continue');
  assert.equal(result.browserPath, CHROME_PATH);
  assert.equal(result.inspection.reason, 'supported');
  assert.deepEqual(
    logEvent.events.map((event) => [event.type, event.level]),
    [['chrome_shell.browser_version_checked', 'info']],
  );
  assert.equal(logEvent.events[0].message, 'Browser version check completed');
  assert.equal(logEvent.events[0].source, 'main');
});

test('checkChromeShellBrowserVersionBeforeLaunch falls back to a validated Edge browser', async () => {
  const spawnProcess = createSpawnDouble((command) =>
    command === EDGE_PATH ? versionResult('150.0.0.0') : versionResult('100.0.0.0'),
  );
  const logEvent = createLogDouble();
  const result = await checkChromeShellBrowserVersionBeforeLaunch({
    browserPath: CHROME_PATH,
    edgeBrowserPath: EDGE_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
    logEvent: logEvent,
  });
  assert.equal(result.continueLaunch, true);
  assert.equal(result.action, 'edge-fallback');
  assert.equal(result.browserPath, EDGE_PATH);
  assert.equal(result.inspection.reason, 'version-too-old');
  assert.equal(result.fallbackInspection.reason, 'supported');
  assert.deepEqual(
    logEvent.events.map((event) => [event.type, event.level]),
    [
      ['chrome_shell.browser_version_checked', 'warn'],
      ['chrome_shell.fallback_browser_version_checked', 'info'],
      ['chrome_shell.safe_browser_fallback_selected', 'warn'],
    ],
  );
  assert.equal(logEvent.events[0].message, 'Browser version is below the supported minimum');
  assert.equal(logEvent.events[1].message, 'Fallback browser version check completed');
});

test('checkChromeShellBrowserVersionBeforeLaunch requires the Electron fallback when no browser qualifies', async () => {
  const spawnProcess = createSpawnDouble((command) =>
    command === EDGE_PATH ? versionResult('100.0.0.0') : versionResult('100.0.0.0'),
  );
  const logEvent = createLogDouble();
  const result = await checkChromeShellBrowserVersionBeforeLaunch({
    browserPath: CHROME_PATH,
    edgeBrowserPath: EDGE_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
    logEvent: logEvent,
  });
  assert.equal(result.continueLaunch, false);
  assert.equal(result.action, 'electron-fallback');
  assert.equal(result.browserPath, CHROME_PATH);
  assert.equal(result.fallbackInspection.reason, 'version-too-old');
  assert.deepEqual(
    logEvent.events.map((event) => [event.type, event.level]),
    [
      ['chrome_shell.browser_version_checked', 'warn'],
      ['chrome_shell.fallback_browser_version_checked', 'warn'],
      ['chrome_shell.electron_fallback_required', 'error'],
    ],
  );
  assert.equal(
    logEvent.events[2].message,
    'No validated external browser is available; Electron fallback is required',
  );
  assert.deepEqual(logEvent.events[2].context, {
    primary: result.inspection,
    fallback: result.fallbackInspection,
  });
});

test('checkChromeShellBrowserVersionBeforeLaunch skips a fallback that resolves to the primary path', async () => {
  const spawnProcess = createSpawnDouble(() => versionResult('100.0.0.0'));
  const logEvent = createLogDouble();
  const result = await checkChromeShellBrowserVersionBeforeLaunch({
    browserPath: CHROME_PATH,
    edgeBrowserPath: CHROME_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
    logEvent: logEvent,
  });
  assert.equal(result.action, 'electron-fallback');
  assert.equal(result.fallbackInspection, null);
  assert.deepEqual(
    logEvent.events.map((event) => event.type),
    ['chrome_shell.browser_version_checked', 'chrome_shell.electron_fallback_required'],
  );
});

test('checkChromeShellBrowserVersionBeforeLaunch flags an unverifiable browser as version-unavailable', async () => {
  const spawnProcess = createSpawnDouble(() => ({ status: 1, stdout: '', stderr: '' }));
  const logEvent = createLogDouble();
  const result = await checkChromeShellBrowserVersionBeforeLaunch({
    browserPath: CHROME_PATH,
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
    logEvent: logEvent,
  });
  assert.equal(result.action, 'electron-fallback');
  assert.equal(logEvent.events[0].message, 'Browser version could not be verified');
  assert.equal(logEvent.events[0].level, 'warn');
});

test('checkChromeShellBrowserVersionBeforeLaunch clears the remembered choice and tolerates a missing log sink', async () => {
  const spawnProcess = createSpawnDouble(() => versionResult('148.0.7778.280'));
  const unlinked = [];
  await checkChromeShellBrowserVersionBeforeLaunch({
    browserPath: CHROME_PATH,
    preferencePath: '/tmp/browser-choice.json',
    platform: 'linux',
    env: {},
    spawnProcess: spawnProcess,
    unlink: (target) => unlinked.push(target),
  });
  assert.deepEqual(unlinked, ['/tmp/browser-choice.json']);
});
