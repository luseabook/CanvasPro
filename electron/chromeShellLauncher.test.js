import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  shouldUseChromeShellRuntime,
  shouldQuitWhenAllElectronWindowsClosed,
  isChromeShellLaunchActive,
  buildChromeShellAppUrl,
  resolveChromeShellAppIdentity,
  resolveChromeShellBrowserExecutable,
  resolveChromeShellProfileDir,
  prepareChromeShellTaskbarIdentity,
  writeChromeShellPreferences,
  normalizeChromeShellSpawnError,
  activateChromeShellWindowSoon,
  controlChromeShellLaunchWindow,
  focusChromeShellLaunchWindow,
  closeChromeShellLaunchForUpdate,
  resolveChromeShellWindowStartupArgs,
  launchChromeShell,
  launchChromeShellWithLifecycle,
  __chromeShellLauncherForTest,
} from './chromeShellLauncher.js';

const { candidatePathsForPlatform, envFlag, resolveRemoteDebuggingPort, shouldQuitWhenChromeShellExits } =
  __chromeShellLauncherForTest;

const BROWSER_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PROFILE_DIR = 'C:\\Profiles\\chrome-shell-profile';
const APP_URL = 'http://127.0.0.1:8777/';
const APP_URL_SHELL = 'http://127.0.0.1:8777/?aicRuntime=chrome-shell';
const SPAWN_ERROR_CODE = 'CHROME_SHELL_SPAWN_ERROR';
const WINDOWS_ACTIVATION_TIMEOUT_MS = 0x1770;

function createChildDouble({ pid = undefined, exitCode = null, signalCode = null } = {}) {
  const handlers = new Map();
  const state = { unrefed: 0x0, killed: 0x0, offed: 0x0 };
  const child = {
    pid: pid,
    exitCode: exitCode,
    signalCode: signalCode,
    killed: false,
    state: state,
    once(event, handler) {
      const list = handlers.get(event) || [];
      list.push(handler);
      handlers.set(event, list);
      return child;
    },
    off(event, handler) {
      state.offed += 0x1;
      const list = handlers.get(event) || [];
      handlers.set(
        event,
        list.filter((entry) => entry !== handler),
      );
      return child;
    },
    emit(event, ...args) {
      for (const handler of [...(handlers.get(event) || [])]) handler(...args);
    },
    unref() {
      state.unrefed += 0x1;
    },
    kill() {
      state.killed += 0x1;
      child.killed = true;
    },
  };
  return child;
}

function createSpawnDouble({ throwError = null, child = null } = {}) {
  const calls = [];
  const created = [];
  const spawnProcess = (file, args, options) => {
    calls.push({ file: file, args: args, options: options });
    if (throwError) throw throwError;
    const next = child || createChildDouble();
    created.push(next);
    return next;
  };
  return { spawnProcess: spawnProcess, calls: calls, children: created };
}

function createTimerDouble() {
  const timers = [];
  return {
    timers: timers,
    setTimeoutFn(fn, ms) {
      const timer = { fn: fn, ms: ms, cancelled: false };
      timers.push(timer);
      return timer;
    },
    clearTimeoutFn(timer) {
      if (timer) timer.cancelled = true;
    },
    fire(index = 0x0) {
      const timer = timers[index];
      if (timer && !timer.cancelled) timer.fn();
    },
    fireNext() {
      const timer = timers.find((entry) => !entry.cancelled && !entry.fired);
      if (!timer) return false;
      timer.fired = true;
      timer.fn();
      return true;
    },
  };
}

function createLogDouble() {
  const events = [];
  return { events: events, logEvent: (event) => events.push(event) };
}

function createAppDouble({ isPackaged = false, paths = {}, quit = null } = {}) {
  const quitCalls = [];
  return {
    isPackaged: isPackaged,
    quitCalls: quitCalls,
    getPath(name) {
      return paths[name];
    },
    quit() {
      quitCalls.push(true);
      if (quit) quit();
    },
  };
}

function createReadFileDouble(files = {}) {
  return (filePath) => {
    const key = String(filePath);
    if (!Object.prototype.hasOwnProperty.call(files, key)) {
      const error = new Error('ENOENT: no such file');
      error.code = 'ENOENT';
      throw error;
    }
    return files[key];
  };
}

function decodeUtf16Base64(value) {
  return Buffer.from(String(value), 'base64').toString('utf16le');
}

function launchInput(overrides = {}) {
  return {
    app: createAppDouble({ paths: { sessionData: 'C:\\Session' } }),
    appUrl: APP_URL,
    env: { AIC_CHROME_SHELL_BROWSER: BROWSER_PATH, AIC_CHROME_SHELL_PROFILE_DIR: PROFILE_DIR },
    platform: 'linux',
    windowsTaskbarIdentityPreparation: Promise.resolve(null),
    exists: (candidate) => String(candidate) === BROWSER_PATH,
    mkdir: () => undefined,
    readFile: createReadFileDouble(),
    writeFile: () => undefined,
    spawnProcess: createSpawnDouble().spawnProcess,
    displayWorkAreas: [],
    ...overrides,
  };
}

test('envFlag recognizes the documented truthy and falsey words', () => {
  for (const value of ['1', 'true', 'TRUE', 'yes', 'Yes', 'on', 'ON']) {
    assert.equal(envFlag({ FLAG: value }, 'FLAG'), true, `expected ${value} to be truthy`);
  }
  for (const value of ['0', 'false', 'FALSE', 'no', 'No', 'off', 'OFF']) {
    assert.equal(envFlag({ FLAG: value }, 'FLAG'), false, `expected ${value} to be falsey`);
  }
});

test('envFlag keeps the three-state contract for unknown, empty and missing values', () => {
  assert.equal(envFlag({ FLAG: '' }, 'FLAG'), null);
  assert.equal(envFlag({ FLAG: '   ' }, 'FLAG'), null);
  assert.equal(envFlag({ FLAG: 'maybe' }, 'FLAG'), null);
  assert.equal(envFlag({}, 'FLAG'), null);
  assert.equal(envFlag(undefined, 'FLAG'), null);
  assert.equal(envFlag({ FLAG: '  yes  ' }, 'FLAG'), true);
  assert.equal(envFlag({ OTHER: '1' }, 'FLAG'), null);
  assert.equal(envFlag({ FLAG: 1 }, 'FLAG'), true);
});

test('shouldUseChromeShellRuntime defaults to true and only special values opt out', () => {
  assert.equal(shouldUseChromeShellRuntime({}, {}), true);
  assert.equal(shouldUseChromeShellRuntime({ AIC_CANVAS_RUNTIME: 'electron' }, {}), false);
  assert.equal(shouldUseChromeShellRuntime({ AIC_CANVAS_RUNTIME: 'browser-window' }, {}), false);
  assert.equal(shouldUseChromeShellRuntime({ AIC_CANVAS_RUNTIME: ' CHROME-SHELL ' }, {}), true);
  assert.equal(shouldUseChromeShellRuntime({ AIC_CANVAS_RUNTIME: 'edge-shell' }, {}), true);
  assert.equal(shouldUseChromeShellRuntime({ AIC_CANVAS_RUNTIME: 'anything-else' }, {}), true);
  assert.equal(shouldUseChromeShellRuntime({ AIC_USE_CHROME_SHELL: '1' }, {}), true);
});

test('shouldUseChromeShellRuntime honours the electron escape hatch except when packaged on desktop', () => {
  const electronEnv = { AIC_USE_ELECTRON_CANVAS: 'true' };
  assert.equal(shouldUseChromeShellRuntime(electronEnv, { appIsPackaged: false, platform: 'win32' }), false);
  assert.equal(shouldUseChromeShellRuntime(electronEnv, { appIsPackaged: false, platform: 'linux' }), false);
  assert.equal(shouldUseChromeShellRuntime(electronEnv, { appIsPackaged: true, platform: 'linux' }), false);
  assert.equal(shouldUseChromeShellRuntime(electronEnv, { appIsPackaged: true, platform: 'win32' }), true);
  assert.equal(shouldUseChromeShellRuntime(electronEnv, { appIsPackaged: true, platform: 'darwin' }), true);
});

test('shouldQuitWhenAllElectronWindowsClosed keeps the app alive for chrome-shell and darwin', () => {
  assert.equal(shouldQuitWhenAllElectronWindowsClosed({ platform: 'win32' }), true);
  assert.equal(shouldQuitWhenAllElectronWindowsClosed({ platform: 'linux' }), true);
  assert.equal(shouldQuitWhenAllElectronWindowsClosed({ platform: 'darwin' }), false);
  assert.equal(
    shouldQuitWhenAllElectronWindowsClosed({ platform: 'win32', useChromeShellRuntime: true }),
    false,
  );
});

test('isChromeShellLaunchActive requires a live child process', () => {
  assert.equal(isChromeShellLaunchActive(undefined), false);
  assert.equal(isChromeShellLaunchActive({}), false);
  assert.equal(isChromeShellLaunchActive({ process: null }), false);
  assert.equal(
    isChromeShellLaunchActive({ process: { exitCode: null, signalCode: null, killed: false } }),
    true,
  );
  assert.equal(isChromeShellLaunchActive({ process: { exitCode: null, signalCode: undefined } }), true);
  assert.equal(isChromeShellLaunchActive({ process: { exitCode: 0, signalCode: null } }), false);
  assert.equal(isChromeShellLaunchActive({ process: { exitCode: null, signalCode: 'SIGTERM' } }), false);
  assert.equal(
    isChromeShellLaunchActive({ process: { exitCode: null, signalCode: null, killed: true } }),
    false,
  );
});

test('buildChromeShellAppUrl stamps the runtime marker and the packaged flag', () => {
  assert.equal(buildChromeShellAppUrl(APP_URL, {}), APP_URL_SHELL);
  assert.equal(
    buildChromeShellAppUrl(APP_URL, { appIsPackaged: true }),
    'http://127.0.0.1:8777/?aicRuntime=chrome-shell&aicPackaged=1',
  );
  assert.equal(buildChromeShellAppUrl('', {}), 'http://127.0.0.1:8777/?aicRuntime=chrome-shell');
});

test('buildChromeShellAppUrl drops a stale packaged flag and keeps unrelated parameters', () => {
  const built = buildChromeShellAppUrl('http://127.0.0.1:8777/index.html?foo=1&aicPackaged=1', {});
  assert.equal(built, 'http://127.0.0.1:8777/index.html?foo=1&aicRuntime=chrome-shell');
});

test('resolveChromeShellAppIdentity returns only the origin and path of a chrome-shell url', () => {
  assert.equal(resolveChromeShellAppIdentity(APP_URL_SHELL), 'http://127.0.0.1:8777/');
  assert.equal(
    resolveChromeShellAppIdentity('https://127.0.0.1:8777/app/index.html?aicRuntime=chrome-shell&x=1'),
    'https://127.0.0.1:8777/app/index.html',
  );
});

test('resolveChromeShellAppIdentity rejects everything that is not a plain chrome-shell origin', () => {
  assert.equal(resolveChromeShellAppIdentity('file:///tmp/index.html?aicRuntime=chrome-shell'), '');
  assert.equal(resolveChromeShellAppIdentity(`${APP_URL}?aicRuntime=electron`), '');
  assert.equal(resolveChromeShellAppIdentity('http://user:pass@127.0.0.1:8777/?aicRuntime=chrome-shell'), '');
  assert.equal(resolveChromeShellAppIdentity(''), '');
  assert.equal(resolveChromeShellAppIdentity('not a url'), '');
  assert.equal(resolveChromeShellAppIdentity(undefined), '');
});

test('candidatePathsForPlatform builds the six windows candidates from the environment', () => {
  const candidates = candidatePathsForPlatform(
    { ProgramFiles: 'C:\\PF', 'ProgramFiles(x86)': 'C:\\PF86', LOCALAPPDATA: 'C:\\LA' },
    'win32',
  );
  assert.deepEqual(candidates, [
    path.join('C:\\PF', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join('C:\\PF86', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join('C:\\LA', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join('C:\\PF', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join('C:\\PF86', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join('C:\\LA', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]);
});

test('candidatePathsForPlatform accepts the uppercase windows aliases and degrades to relative names', () => {
  const aliased = candidatePathsForPlatform(
    { PROGRAMFILES: 'C:\\PF', PROGRAMFILES_X86: 'C:\\PF86', LOCALAPPDATA: 'C:\\LA' },
    'win32',
  );
  assert.ok(aliased[0].startsWith('C:\\PF' + path.sep));
  assert.ok(aliased[1].startsWith('C:\\PF86' + path.sep));
  const empty = candidatePathsForPlatform({}, 'win32');
  assert.equal(empty.length, 6);
  assert.ok(empty.every((entry) => !path.isAbsolute(entry)));
});

test('candidatePathsForPlatform keeps the escaped darwin and linux fixtures', () => {
  const macCandidates = candidatePathsForPlatform({}, 'darwin');
  assert.deepEqual(macCandidates, [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ]);
  const linuxCandidates = candidatePathsForPlatform({}, 'linux');
  assert.deepEqual(linuxCandidates, [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/usr/bin/microsoft-edge-stable',
  ]);
});

test('resolveChromeShellBrowserExecutable prefers an existing configured absolute path', () => {
  const probed = [];
  const resolved = resolveChromeShellBrowserExecutable({
    env: { AIC_CHROME_SHELL_BROWSER: BROWSER_PATH },
    platform: 'win32',
    exists: (candidate) => {
      probed.push(candidate);
      return String(candidate) === BROWSER_PATH;
    },
  });
  assert.equal(resolved, BROWSER_PATH);
  assert.deepEqual(probed, [BROWSER_PATH]);
});

test('resolveChromeShellBrowserExecutable accepts a bare configured name without probing it', () => {
  const probed = [];
  const resolved = resolveChromeShellBrowserExecutable({
    env: { AIC_CHROME_SHELL_BROWSER: 'chrome' },
    platform: 'win32',
    exists: (candidate) => {
      probed.push(candidate);
      return false;
    },
  });
  assert.equal(resolved, 'chrome');
  assert.deepEqual(probed, []);
});

test('resolveChromeShellBrowserExecutable falls back to candidates when the configured path is missing', () => {
  const resolved = resolveChromeShellBrowserExecutable({
    env: { AIC_CHROME_SHELL_BROWSER: 'C:\\Missing\\chrome.exe', ProgramFiles: 'C:\\PF' },
    platform: 'win32',
    exists: (candidate) =>
      String(candidate) === path.join('C:\\PF', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  });
  assert.equal(resolved, path.join('C:\\PF', 'Google', 'Chrome', 'Application', 'chrome.exe'));
});

test('resolveChromeShellBrowserExecutable filters candidates by the preferred browser', () => {
  const env = { ProgramFiles: 'C:\\PF' };
  assert.equal(
    resolveChromeShellBrowserExecutable({ env: env, platform: 'win32', exists: () => true }),
    path.join('C:\\PF', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  );
  assert.equal(
    resolveChromeShellBrowserExecutable({
      env: env,
      platform: 'win32',
      exists: () => true,
      preferredBrowser: 'EDGE',
    }),
    path.join('C:\\PF', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  );
  assert.equal(
    resolveChromeShellBrowserExecutable({
      env: env,
      platform: 'win32',
      exists: () => true,
      preferredBrowser: 'firefox',
    }),
    path.join('C:\\PF', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  );
  assert.equal(
    resolveChromeShellBrowserExecutable({
      env: env,
      platform: 'win32',
      exists: () => false,
      preferredBrowser: 'edge',
    }),
    '',
  );
});

test('resolveChromeShellBrowserExecutable refuses a configured edge name when chrome is requested', () => {
  const resolved = resolveChromeShellBrowserExecutable({
    env: { AIC_CHROME_SHELL_BROWSER: 'msedge.exe', ProgramFiles: 'C:\\PF' },
    platform: 'win32',
    exists: () => true,
    preferredBrowser: 'chrome',
  });
  assert.equal(resolved, path.join('C:\\PF', 'Google', 'Chrome', 'Application', 'chrome.exe'));
});

test('resolveChromeShellProfileDir honours the explicit override first', () => {
  assert.equal(
    resolveChromeShellProfileDir({ env: { AIC_CHROME_SHELL_PROFILE_DIR: '  C:\\Custom\\profile  ' } }),
    path.resolve('C:\\Custom\\profile'),
  );
});

test('resolveChromeShellProfileDir derives the profile name from the browser family', () => {
  const app = createAppDouble({ paths: { sessionData: 'C:\\Session' } });
  assert.equal(
    resolveChromeShellProfileDir({ app: app, env: {}, browserPath: BROWSER_PATH }),
    path.join('C:\\Session', 'chrome-shell-profile'),
  );
  assert.equal(
    resolveChromeShellProfileDir({ app: app, env: {}, browserPath: 'C:\\Edge\\msedge.exe' }),
    path.join('C:\\Session', 'edge-shell-profile'),
  );
  assert.equal(
    resolveChromeShellProfileDir({ app: app, env: {}, browserPath: 'C:\\Chromium\\chromium' }),
    path.join('C:\\Session', 'chromium-shell-profile'),
  );
});

test('resolveChromeShellProfileDir walks sessionData, userData and finally the cwd', () => {
  const sessionOnly = createAppDouble({ paths: { sessionData: 'C:\\Session', userData: 'C:\\User' } });
  assert.ok(resolveChromeShellProfileDir({ app: sessionOnly, env: {} }).startsWith('C:\\Session'));
  const userOnly = createAppDouble({ paths: { userData: 'C:\\User' } });
  assert.equal(
    resolveChromeShellProfileDir({ app: userOnly, env: {} }),
    path.join('C:\\User', 'chrome-shell-profile'),
  );
  assert.equal(resolveChromeShellProfileDir({ env: {} }), path.join(process.cwd(), 'chrome-shell-profile'));
});

test('prepareChromeShellTaskbarIdentity short-circuits without a helper or a browser', async () => {
  assert.equal(await prepareChromeShellTaskbarIdentity({}), null);
  assert.equal(
    await prepareChromeShellTaskbarIdentity({
      windowsTaskbarIdentity: {},
      env: { AIC_CHROME_SHELL_BROWSER: BROWSER_PATH },
      platform: 'linux',
      exists: () => false,
    }),
    null,
  );
});

test('prepareChromeShellTaskbarIdentity forwards the resolved browser and profile', async () => {
  const seen = [];
  let readyHandler = null;
  const result = await prepareChromeShellTaskbarIdentity({
    app: createAppDouble({ paths: { sessionData: 'C:\\Session' } }),
    env: { AIC_CHROME_SHELL_BROWSER: BROWSER_PATH },
    platform: 'win32',
    exists: (candidate) => String(candidate) === BROWSER_PATH,
    spawnProcess: (file, args, options) => {
      seen.push({ file: file, args: args, options: options });
      return {
        stdout: {
          on: (event, handler) => {
            if (event === 'data') {
              readyHandler = handler;
              queueMicrotask(() => handler('READY\n'));
            }
          },
          removeListener: () => undefined,
        },
        once: () => undefined,
        removeListener: () => undefined,
        kill: () => undefined,
      };
    },
    windowsTaskbarIdentity: {
      appId: 'com.example.aicanvaspro',
      iconPath: 'C:\\App\\icon.ico',
      executablePath: 'C:\\App\\ai-canvaspro.exe',
      displayName: 'AI CanvasPro',
      sizeGuardDllPath: 'C:\\App\\size-guard.dll',
      minWidth: 1400,
    },
  });
  assert.equal(typeof readyHandler, 'function');
  assert.ok(result === null || typeof result === 'object');
  assert.equal(seen.length, 0x1);
  assert.equal(seen[0].file, 'powershell.exe');
  assert.ok(seen[0].args.includes('-Command'));
  const script = String(seen[0].args[seen[0].args.length - 1]);
  assert.ok(script.includes(Buffer.from('C:\\Session\\chrome-shell-profile', 'utf8').toString('base64')));
});

test('writeChromeShellPreferences creates the profile and neutralizes first-run dialogs', () => {
  const created = [];
  const written = [];
  const result = writeChromeShellPreferences({
    profileDir: PROFILE_DIR,
    mkdir: (target, options) => created.push({ target: target, options: options }),
    readFile: createReadFileDouble(),
    writeFile: (target, contents, encoding) =>
      written.push({ target: target, contents: contents, encoding: encoding }),
  });
  assert.deepEqual(created, [{ target: path.join(PROFILE_DIR, 'Default'), options: { recursive: true } }]);
  assert.equal(result.preferencesPath, path.join(PROFILE_DIR, 'Default', 'Preferences'));
  assert.equal(written.length, 0x1);
  assert.equal(written[0].encoding, 'utf8');
  assert.ok(written[0].contents.endsWith('\n'));
  assert.equal(result.preferences.credentials_enable_service, false);
  assert.deepEqual(result.preferences.autofill, { credit_card_enabled: false, profile_enabled: false });
  assert.deepEqual(result.preferences.profile, { password_manager_enabled: false });
  assert.deepEqual(result.preferences.devtools, {});
});

test('writeChromeShellPreferences preserves unrelated keys and existing sub-objects', () => {
  const preferencesPath = path.join(PROFILE_DIR, 'Default', 'Preferences');
  const result = writeChromeShellPreferences({
    profileDir: PROFILE_DIR,
    mkdir: () => undefined,
    readFile: createReadFileDouble({
      [preferencesPath]: JSON.stringify({
        browser: { theme: 'dark' },
        autofill: { keep: 1 },
        profile: { name: 'main' },
        devtools: { availability: 1, prefs: 'kept' },
      }),
    }),
    writeFile: () => undefined,
  });
  assert.deepEqual(result.preferences.browser, { theme: 'dark' });
  assert.deepEqual(result.preferences.autofill, {
    keep: 1,
    credit_card_enabled: false,
    profile_enabled: false,
  });
  assert.deepEqual(result.preferences.profile, { name: 'main', password_manager_enabled: false });
  assert.deepEqual(result.preferences.devtools, { prefs: 'kept' });
});

test('writeChromeShellPreferences disables devtools with availability 2 when packaged', () => {
  const result = writeChromeShellPreferences({
    profileDir: PROFILE_DIR,
    disableDevTools: true,
    mkdir: () => undefined,
    readFile: createReadFileDouble(),
    writeFile: () => undefined,
  });
  assert.deepEqual(result.preferences.devtools, { availability: 0x2 });
});

test('normalizeChromeShellSpawnError wraps a raw failure with a stable shape', () => {
  const raw = new Error('spawn chrome EACCES');
  raw.code = 'EACCES';
  raw.errno = -0x1005;
  raw.syscall = 'spawn chrome.exe';
  raw.path = BROWSER_PATH;
  const normalized = normalizeChromeShellSpawnError(raw);
  assert.equal(normalized.name, 'ChromeShellSpawnError');
  assert.equal(normalized.code, SPAWN_ERROR_CODE);
  assert.equal(normalized.message, 'Chrome shell process failed to start: spawn chrome EACCES');
  assert.equal(normalized.cause, raw);
  assert.deepEqual(normalized.details, {
    originalCode: 'EACCES',
    errno: -0x1005,
    syscall: 'spawn chrome.exe',
    path: BROWSER_PATH,
  });
});

test('normalizeChromeShellSpawnError falls back to a generic message and empty details', () => {
  const normalized = normalizeChromeShellSpawnError({});
  assert.equal(normalized.message, 'Chrome shell process failed to start');
  assert.deepEqual(normalized.details, { originalCode: '', errno: null, syscall: '', path: '' });
  const fromNull = normalizeChromeShellSpawnError(null);
  assert.equal(fromNull.code, SPAWN_ERROR_CODE);
  assert.equal(fromNull.cause, null);
});

test('normalizeChromeShellSpawnError passes an already-normalized error through untouched', () => {
  const already = new Error('done');
  already.code = SPAWN_ERROR_CODE;
  assert.equal(normalizeChromeShellSpawnError(already), already);
});

test('activateChromeShellWindowSoon stays inert off the desktop platforms', () => {
  const spawn = createSpawnDouble();
  assert.equal(
    activateChromeShellWindowSoon({
      child: createChildDouble({ pid: 0x10e1 }),
      platform: 'linux',
      spawnProcess: spawn.spawnProcess,
    }),
    null,
  );
  assert.equal(spawn.calls.length, 0x0);
});

test('activateChromeShellWindowSoon respects the opt-out flag and unusable pids', () => {
  const spawn = createSpawnDouble();
  assert.equal(
    activateChromeShellWindowSoon({
      child: createChildDouble({ pid: 0x10e1 }),
      env: { AIC_CHROME_SHELL_ACTIVATE_WINDOW: '0' },
      platform: 'win32',
      spawnProcess: spawn.spawnProcess,
    }),
    null,
  );
  for (const pid of [undefined, 0x0, -0x1, Number.NaN, 'nope']) {
    assert.equal(
      activateChromeShellWindowSoon({
        child: createChildDouble({ pid: pid }),
        platform: 'win32',
        spawnProcess: spawn.spawnProcess,
      }),
      null,
    );
  }
  assert.equal(spawn.calls.length, 0x0);
});

test('activateChromeShellWindowSoon spawns the windows activator with the decoded pid', () => {
  const spawn = createSpawnDouble();
  const helper = activateChromeShellWindowSoon({
    child: createChildDouble({ pid: 0x1234 }),
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
  });
  assert.equal(spawn.calls.length, 0x1);
  assert.equal(spawn.calls[0].file, 'powershell.exe');
  assert.deepEqual(spawn.calls[0].args.slice(0x0, 0x5), [
    '-NoLogo',
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
  ]);
  assert.deepEqual(spawn.calls[0].options, { stdio: 'ignore', windowsHide: true, detached: true });
  const script = spawn.calls[0].args[0x5];
  assert.ok(script.startsWith('$targetPid = 4660\n$deadline = [DateTime]::UtcNow.AddMilliseconds(6000)'));
  assert.ok(script.includes('AicChromeShellWindowActivator'));
  assert.ok(script.includes("-like '*AI CanvasPro*'"));
  assert.ok(script.includes("-like '*AI Canvas*'"));
  assert.ok(!script.includes('SHUO'));
  assert.ok(script.endsWith('exit 0'));
  assert.equal(helper.state.unrefed, 0x1);
});

test('activateChromeShellWindowSoon spawns osascript on darwin', () => {
  const spawn = createSpawnDouble();
  const helper = activateChromeShellWindowSoon({
    child: createChildDouble({ pid: 0x1234 }),
    platform: 'darwin',
    spawnProcess: spawn.spawnProcess,
  });
  assert.equal(spawn.calls[0].file, 'osascript');
  assert.deepEqual(spawn.calls[0].args.slice(0x0, 0x2), ['-l', 'JavaScript']);
  assert.equal(spawn.calls[0].args[0x2], '-e');
  const script = spawn.calls[0].args[0x3];
  assert.ok(script.startsWith('ObjC.import("AppKit");'));
  assert.ok(script.includes('runningApplicationWithProcessIdentifier(4660)'));
  assert.ok(script.includes('NSApplicationActivateIgnoringOtherApps'));
  assert.equal(spawn.calls[0].options.detached, true);
  assert.equal(helper.state.unrefed, 0x1);
});

test('activateChromeShellWindowSoon swallows spawn failures', () => {
  const spawn = createSpawnDouble({ throwError: new Error('osascript missing') });
  assert.equal(
    activateChromeShellWindowSoon({
      child: createChildDouble({ pid: 0x1234 }),
      platform: 'win32',
      spawnProcess: spawn.spawnProcess,
    }),
    null,
  );
});

test('resolveRemoteDebuggingPort only accepts 1..65535 decimal values', () => {
  assert.equal(resolveRemoteDebuggingPort({ AIC_CHROME_SHELL_REMOTE_DEBUGGING_PORT: '9222' }), '9222');
  assert.equal(resolveRemoteDebuggingPort({ AIC_CHROME_SHELL_REMOTE_DEBUGGING_PORT: ' 9222 ' }), '9222');
  assert.equal(resolveRemoteDebuggingPort({ AIC_CHROME_SHELL_REMOTE_DEBUGGING_PORT: '65535' }), '65535');
  for (const value of ['0', '65536', '-1', '9 222', 'abc', '', '12.5', '0x1']) {
    assert.equal(
      resolveRemoteDebuggingPort({ AIC_CHROME_SHELL_REMOTE_DEBUGGING_PORT: value }),
      '',
      `expected ${value} to be rejected`,
    );
  }
  assert.equal(resolveRemoteDebuggingPort({}), '');
});

test('shouldQuitWhenChromeShellExits is disabled by the keep-launcher flag', () => {
  assert.equal(shouldQuitWhenChromeShellExits({}), true);
  assert.equal(shouldQuitWhenChromeShellExits({ AIC_CHROME_SHELL_KEEP_LAUNCHER: 'garbage' }), true);
  for (const value of ['1', 'true', 'yes', 'on']) {
    assert.equal(shouldQuitWhenChromeShellExits({ AIC_CHROME_SHELL_KEEP_LAUNCHER: value }), false);
  }
  assert.equal(shouldQuitWhenChromeShellExits({ AIC_CHROME_SHELL_KEEP_LAUNCHER: '0' }), true);
});

test('controlChromeShellLaunchWindow refuses unsupported platforms and actions', async () => {
  assert.equal(await controlChromeShellLaunchWindow({ platform: 'linux' }), false);
  assert.equal(await controlChromeShellLaunchWindow({ platform: 'darwin' }), false);
  assert.equal(await controlChromeShellLaunchWindow({ platform: 'win32', action: 'raise' }), false);
  assert.equal(await controlChromeShellLaunchWindow({ platform: 'win32', action: '' }), false);
});

test('controlChromeShellLaunchWindow refuses an unresolvable target', async () => {
  const spawn = createSpawnDouble();
  assert.equal(
    await controlChromeShellLaunchWindow({
      launch: { detached: false, process: { pid: 0x0 } },
      platform: 'win32',
      spawnProcess: spawn.spawnProcess,
    }),
    false,
  );
  assert.equal(
    await controlChromeShellLaunchWindow({
      launch: {
        detached: true,
        browserPath: 'relative/chrome.exe',
        profileDir: 'C:\\P',
        appUrl: APP_URL_SHELL,
      },
      platform: 'win32',
      spawnProcess: spawn.spawnProcess,
    }),
    false,
  );
  assert.equal(
    await controlChromeShellLaunchWindow({
      launch: {
        detached: true,
        browserPath: BROWSER_PATH,
        profileDir: 'C:\\P',
        appUrl: 'http://127.0.0.1:8777/',
      },
      platform: 'win32',
      spawnProcess: spawn.spawnProcess,
    }),
    false,
  );
  assert.equal(spawn.calls.length, 0x0);
});

test('controlChromeShellLaunchWindow spawns an encoded focus helper carrying the launch identity', async () => {
  const spawn = createSpawnDouble();
  const timers = createTimerDouble();
  const promise = controlChromeShellLaunchWindow({
    launch: { detached: false, process: { pid: 0x10e1, exitCode: null, signalCode: null, killed: false } },
    action: 'focus',
    env: { KEEP: 'yes' },
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  assert.equal(spawn.calls.length, 0x1);
  assert.equal(spawn.calls[0].file, 'powershell.exe');
  assert.deepEqual(spawn.calls[0].args.slice(0x0, 0x6), [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-EncodedCommand',
  ]);
  const script = decodeUtf16Base64(spawn.calls[0].args[0x6]);
  assert.ok(script.includes('GetEnvironmentVariable("AIC_CHROME_SHELL_FOCUS_MODE")'));
  assert.ok(script.includes('AicChromeShellFocus'));
  assert.ok(script.includes('-notlike "*AI CanvasPro*"'));
  assert.ok(script.includes('-notlike "*AI Canvas*"'));
  assert.ok(!script.includes('SHUO'));
  assert.equal(spawn.calls[0].options.env.AIC_CHROME_SHELL_FOCUS_MODE, 'tracked');
  assert.equal(spawn.calls[0].options.env.AIC_CHROME_SHELL_WINDOW_ACTION, 'focus');
  assert.equal(spawn.calls[0].options.env.AIC_CHROME_SHELL_TARGET_PID, '4321');
  assert.equal(
    spawn.calls[0].options.env.AIC_CHROME_SHELL_FOCUS_TIMEOUT_MS,
    String(WINDOWS_ACTIVATION_TIMEOUT_MS),
  );
  assert.equal(spawn.calls[0].options.env.AIC_CHROME_SHELL_EXPECTED_BROWSER_PATH, '');
  assert.equal(spawn.calls[0].options.env.KEEP, 'yes');
  spawn.children[0x0].emit('exit', 0x0);
  assert.equal(await promise, true);
});

test('controlChromeShellLaunchWindow resolves false on error and non-zero exits', async () => {
  const timers = createTimerDouble();
  const errorSpawn = createSpawnDouble();
  const onError = controlChromeShellLaunchWindow({
    launch: { detached: false, process: { pid: 0x10e1 } },
    platform: 'win32',
    spawnProcess: errorSpawn.spawnProcess,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  errorSpawn.children[0x0].emit('error', new Error('spawn failed'));
  assert.equal(await onError, false);

  const badExitSpawn = createSpawnDouble();
  const onBadExit = controlChromeShellLaunchWindow({
    launch: { detached: false, process: { pid: 0x10e1 } },
    platform: 'win32',
    spawnProcess: badExitSpawn.spawnProcess,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  badExitSpawn.children[0x0].emit('exit', 0x3);
  assert.equal(await onBadExit, false);
});

test('controlChromeShellLaunchWindow reports false when the helper has no once handler', async () => {
  assert.equal(
    await controlChromeShellLaunchWindow({
      launch: { detached: false, process: { pid: 0x10e1 } },
      platform: 'win32',
      spawnProcess: () => ({}),
    }),
    false,
  );
  assert.equal(
    await controlChromeShellLaunchWindow({
      launch: { detached: false, process: { pid: 0x10e1 } },
      platform: 'win32',
      spawnProcess: () => {
        throw new Error('EPERM');
      },
    }),
    false,
  );
});

test('controlChromeShellLaunchWindow clamps the timeout and kills the helper on expiry', async () => {
  const timers = createTimerDouble();
  const spawn = createSpawnDouble();
  const promise = controlChromeShellLaunchWindow({
    launch: { detached: false, process: { pid: 0x10e1 } },
    platform: 'win32',
    timeoutMs: 999999,
    spawnProcess: spawn.spawnProcess,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  assert.equal(spawn.calls[0x0].options.env.AIC_CHROME_SHELL_FOCUS_TIMEOUT_MS, '10000');
  assert.equal(timers.timers[0x0].ms, 10000 + 0x3e8);
  timers.fire(0x0);
  assert.equal(await promise, false);
  assert.equal(spawn.children[0x0].state.killed, 0x1);

  const lowTimers = createTimerDouble();
  const lowSpawn = createSpawnDouble();
  const lowPromise = controlChromeShellLaunchWindow({
    launch: { detached: false, process: { pid: 0x10e1 } },
    platform: 'win32',
    timeoutMs: 0x1,
    spawnProcess: lowSpawn.spawnProcess,
    setTimeoutFn: lowTimers.setTimeoutFn,
    clearTimeoutFn: lowTimers.clearTimeoutFn,
  });
  assert.equal(lowSpawn.calls[0x0].options.env.AIC_CHROME_SHELL_FOCUS_TIMEOUT_MS, '100');
  lowTimers.fire(0x0);
  assert.equal(await lowPromise, false);
});

test('controlChromeShellLaunchWindow clears the timer once the helper exits first', async () => {
  const timers = createTimerDouble();
  const spawn = createSpawnDouble();
  const promise = controlChromeShellLaunchWindow({
    launch: { detached: false, process: { pid: 0x10e1 } },
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  spawn.children[0x0].emit('exit', 0x0);
  assert.equal(await promise, true);
  assert.equal(timers.timers[0x0].cancelled, true);
});

test('focusChromeShellLaunchWindow delegates to the focus action', async () => {
  const spawn = createSpawnDouble();
  const promise = focusChromeShellLaunchWindow({
    launch: { detached: false, process: { pid: 0x10e1 } },
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
  });
  assert.equal(spawn.calls[0x0].options.env.AIC_CHROME_SHELL_WINDOW_ACTION, 'focus');
  spawn.children[0x0].emit('exit', 0x0);
  assert.equal(await promise, true);
});

test('closeChromeShellLaunchForUpdate short-circuits and delegates detached closes', async () => {
  assert.equal(await closeChromeShellLaunchForUpdate({}), true);
  const seen = [];
  const delegated = await closeChromeShellLaunchForUpdate({
    launch: { detached: true, browserPath: BROWSER_PATH, profileDir: 'C:\\P', appUrl: APP_URL_SHELL },
    platform: 'win32',
    controlWindow: async (options) => {
      seen.push(options);
      return 'closed';
    },
  });
  assert.equal(delegated, 'closed');
  assert.equal(seen.length, 0x1);
  assert.equal(seen[0x0].action, 'close');
});

test('closeChromeShellLaunchForUpdate reports success for an already finished process', async () => {
  assert.equal(
    await closeChromeShellLaunchForUpdate({
      launch: { detached: false, process: { exitCode: 0x0, signalCode: null } },
    }),
    true,
  );
  assert.equal(await closeChromeShellLaunchForUpdate({ launch: { detached: false } }), true);
});

test('closeChromeShellLaunchForUpdate escalates windows taskkill from graceful to forced', async () => {
  const spawn = createSpawnDouble();
  const timers = createTimerDouble();
  const child = createChildDouble({ pid: 0x10e1 });
  const promise = closeChromeShellLaunchForUpdate({
    launch: { detached: false, process: child },
    platform: 'win32',
    spawnProcess: spawn.spawnProcess,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
    gracefulTimeoutMs: 0x5dc,
    forceTimeoutMs: 0x9c4,
  });
  for (let index = 0x0; index < 0xc; index += 0x1) {
    await new Promise((resolve) => setImmediate(resolve));
    timers.fireNext();
  }
  assert.equal(await promise, false);
  assert.deepEqual(
    spawn.calls.map((call) => call.file),
    ['taskkill.exe', 'taskkill.exe'],
  );
  assert.deepEqual(spawn.calls[0x0].args, ['/PID', '4321', '/T']);
  assert.deepEqual(spawn.calls[0x1].args, ['/PID', '4321', '/T', '/F']);
  assert.ok(timers.timers.length >= 0x2);
});

test('closeChromeShellLaunchForUpdate uses a plain kill off windows and waits for exit', async () => {
  const spawn = createSpawnDouble();
  const timers = createTimerDouble();
  const child = createChildDouble({ pid: 0x10e1 });
  const promise = closeChromeShellLaunchForUpdate({
    launch: { detached: false, process: child },
    platform: 'linux',
    spawnProcess: spawn.spawnProcess,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  assert.equal(child.state.killed, 0x1);
  child.emit('exit', 0x0, null);
  assert.equal(await promise, true);
  assert.equal(spawn.calls.length, 0x0);
  assert.equal(child.state.offed, 0x1);
});

test('closeChromeShellLaunchForUpdate reports the exit state when kill throws', async () => {
  const child = createChildDouble({ pid: 0x10e1 });
  child.kill = () => {
    throw new Error('ESRCH');
  };
  assert.equal(
    await closeChromeShellLaunchForUpdate({
      launch: { detached: false, process: child },
      platform: 'linux',
      setTimeoutFn: createTimerDouble().setTimeoutFn,
      clearTimeoutFn: createTimerDouble().clearTimeoutFn,
    }),
    false,
  );
  assert.equal(
    await closeChromeShellLaunchForUpdate({
      launch: {
        detached: false,
        process: {
          exitCode: 0x0,
          signalCode: null,
          kill: () => {
            throw new Error('ESRCH');
          },
        },
      },
      platform: 'linux',
    }),
    true,
  );
});

test('resolveChromeShellWindowStartupArgs picks the largest stored placement', () => {
  const preferencesPath = path.join(PROFILE_DIR, 'Default', 'Preferences');
  const args = resolveChromeShellWindowStartupArgs({
    profileDir: PROFILE_DIR,
    readFile: createReadFileDouble({
      [preferencesPath]: JSON.stringify({
        browser: {
          app_window_placement: {
            small: { left: 0x0, top: 0x0, right: 0x3e8, bottom: 0x258 },
            large: { left: 0xa, top: 0xa, right: 0x50a, bottom: 0x2c2 },
          },
        },
      }),
    }),
  });
  assert.deepEqual(args, ['--window-position=10,10', '--window-size=1280,696']);
});

test('resolveChromeShellWindowStartupArgs maps fullscreen and maximized states', () => {
  const preferencesPath = path.join(PROFILE_DIR, 'Default', 'Preferences');
  const readFileOf = (preferences) =>
    createReadFileDouble({ [preferencesPath]: JSON.stringify(preferences) });
  assert.deepEqual(
    resolveChromeShellWindowStartupArgs({
      profileDir: PROFILE_DIR,
      readFile: readFileOf({ browser: { app_window_placement: { one: { fullscreen: true } } } }),
    }),
    ['--start-fullscreen'],
  );
  assert.deepEqual(
    resolveChromeShellWindowStartupArgs({
      profileDir: PROFILE_DIR,
      readFile: readFileOf({ browser: { app_window_placement: { one: { show_state: 'Maximized' } } } }),
    }),
    ['--start-maximized'],
  );
  assert.deepEqual(
    resolveChromeShellWindowStartupArgs({
      profileDir: PROFILE_DIR,
      readFile: readFileOf({
        browser: { app_window_placement: { one: { isFullscreen: true, isMaximized: true } } },
      }),
    }),
    ['--start-fullscreen'],
  );
});

test('resolveChromeShellWindowStartupArgs falls back to the legacy window-state file', () => {
  const legacyDir = 'C:\\Legacy\\profiles';
  const legacyPath = path.join(legacyDir, 'window-state.json');
  const profileDir = path.join(legacyDir, 'chrome-shell-profile');
  const args = resolveChromeShellWindowStartupArgs({
    profileDir: profileDir,
    readFile: createReadFileDouble({ [legacyPath]: JSON.stringify({ width: 0x384, height: 0x258 }) }),
  });
  assert.deepEqual(args, ['--window-size=900,600']);
});

test('resolveChromeShellWindowStartupArgs returns no arguments when there is nothing stored', () => {
  assert.deepEqual(
    resolveChromeShellWindowStartupArgs({ profileDir: PROFILE_DIR, readFile: createReadFileDouble() }),
    [],
  );
  assert.deepEqual(resolveChromeShellWindowStartupArgs({ readFile: createReadFileDouble() }), []);
  assert.deepEqual(
    resolveChromeShellWindowStartupArgs({
      profileDir: PROFILE_DIR,
      readFile: createReadFileDouble({
        [path.join(PROFILE_DIR, 'Default', 'Preferences')]: JSON.stringify({
          browser: { app_window_placement: { tiny: { left: 0x1 } } },
        }),
      }),
    }),
    [],
  );
});

test('resolveChromeShellWindowStartupArgs re-centers an off-screen window on the nearest display', () => {
  const preferencesPath = path.join(PROFILE_DIR, 'Default', 'Preferences');
  const args = resolveChromeShellWindowStartupArgs({
    profileDir: PROFILE_DIR,
    displayWorkAreas: [{ workArea: { x: 0x0, y: 0x0, width: 0x780, height: 0x438 } }],
    readFile: createReadFileDouble({
      [preferencesPath]: JSON.stringify({
        browser: {
          app_window_placement: { off: { left: 0x1388, top: 0x1388, width: 0x320, height: 0x258 } },
        },
      }),
    }),
  });
  assert.deepEqual(args, ['--window-position=560,240', '--window-size=800,600']);
});

test('resolveChromeShellWindowStartupArgs drops the position when no display work area is known', () => {
  const preferencesPath = path.join(PROFILE_DIR, 'Default', 'Preferences');
  const args = resolveChromeShellWindowStartupArgs({
    profileDir: PROFILE_DIR,
    displayWorkAreas: [{}],
    readFile: createReadFileDouble({
      [preferencesPath]: JSON.stringify({
        browser: {
          app_window_placement: { off: { left: 0x1388, top: 0x1388, width: 0x320, height: 0x258 } },
        },
      }),
    }),
  });
  assert.deepEqual(args, ['--window-size=800,600']);
});

test('launchChromeShell throws when no chrome or edge executable can be found', async () => {
  await assert.rejects(
    () =>
      launchChromeShell(
        launchInput({
          env: {},
          exists: () => false,
        }),
      ),
    { message: 'Chrome or Edge executable not found' },
  );
});

test('launchChromeShell builds the full argv in order and records the launch state', async () => {
  const spawn = createSpawnDouble();
  const written = [];
  const created = [];
  const launch = await launchChromeShell(
    launchInput({
      spawnProcess: spawn.spawnProcess,
      mkdir: (target, options) => created.push({ target: target, options: options }),
      writeFile: (target, contents) => written.push({ target: target, contents: contents }),
      now: () => 0x3e8,
    }),
  );
  assert.equal(spawn.calls.length, 0x1);
  assert.equal(spawn.calls[0x0].file, BROWSER_PATH);
  assert.deepEqual(spawn.calls[0x0].args, [
    '--user-data-dir=' + PROFILE_DIR,
    '--no-first-run',
    '--no-default-browser-check',
    '--enable-logging=stderr',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-background-mode',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--app=' + APP_URL_SHELL,
  ]);
  assert.deepEqual(spawn.calls[0x0].options, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: false });
  assert.deepEqual(created, [
    { target: PROFILE_DIR, options: { recursive: true } },
    { target: path.join(PROFILE_DIR, 'Default'), options: { recursive: true } },
  ]);
  assert.equal(written.length, 0x1);
  assert.equal(launch.browserPath, BROWSER_PATH);
  assert.equal(launch.profileDir, PROFILE_DIR);
  assert.equal(launch.appUrl, APP_URL_SHELL);
  assert.equal(launch.detached, false);
  assert.equal(launch.spawnError, null);
  assert.equal(launch.spawnedAt, 0x3e8);
  assert.equal(typeof launch.startupDiagnostics.snapshot, 'function');
  assert.equal(launch.process, spawn.children[0x0]);
});

test('launchChromeShell honours the packaged flag, the debug port and the background opt-outs', async () => {
  const spawn = createSpawnDouble();
  const env = {
    AIC_CHROME_SHELL_BROWSER: BROWSER_PATH,
    AIC_CHROME_SHELL_PROFILE_DIR: PROFILE_DIR,
    AIC_CHROME_SHELL_REMOTE_DEBUGGING_PORT: '9222',
    AIC_CHROME_SHELL_DISABLE_BACKGROUND_MODE: '0',
    AIC_CHROME_SHELL_PREVENT_BACKGROUND_THROTTLING: '0',
  };
  const launch = await launchChromeShell(
    launchInput({
      app: createAppDouble({ isPackaged: true, paths: { sessionData: 'C:\\Session' } }),
      env: env,
      spawnProcess: spawn.spawnProcess,
    }),
  );
  const args = spawn.calls[0x0].args;
  assert.ok(args.includes('--remote-debugging-port=9222'));
  assert.ok(args.includes('--app=' + APP_URL_SHELL + '&aicPackaged=1'));
  assert.ok(!args.includes('--disable-background-mode'));
  assert.ok(!args.includes('--disable-background-timer-throttling'));
  assert.ok(!args.includes('--disable-renderer-backgrounding'));
  assert.ok(!args.includes('--disable-backgrounding-occluded-windows'));
  assert.equal(launch.appUrl, APP_URL_SHELL + '&aicPackaged=1');
});

test('launchChromeShell attaches an injected taskbar identity helper to the child', async () => {
  const spawn = createSpawnDouble();
  const prepared = {
    attached: [],
    cancelled: 0x0,
    attach(child) {
      prepared.attached.push(child);
      return true;
    },
    cancel() {
      prepared.cancelled += 0x1;
    },
  };
  const launch = await launchChromeShell(
    launchInput({
      spawnProcess: spawn.spawnProcess,
      windowsTaskbarIdentityPreparation: Promise.resolve(prepared),
    }),
  );
  assert.deepEqual(prepared.attached, [spawn.children[0x0]]);
  assert.equal(prepared.cancelled, 0x0);
  assert.equal(launch.process, spawn.children[0x0]);
});

test('launchChromeShell cancels the identity helper and rethrows a normalized spawn error', async () => {
  const prepared = {
    cancelled: 0x0,
    cancel() {
      prepared.cancelled += 0x1;
    },
  };
  const raw = new Error('spawn EPERM');
  raw.code = 'EPERM';
  await assert.rejects(
    () =>
      launchChromeShell(
        launchInput({
          spawnProcess: createSpawnDouble({ throwError: raw }).spawnProcess,
          windowsTaskbarIdentityPreparation: Promise.resolve(prepared),
        }),
      ),
    (error) => {
      assert.equal(error.code, SPAWN_ERROR_CODE);
      assert.equal(error.name, 'ChromeShellSpawnError');
      assert.equal(error.cause, raw);
      return true;
    },
  );
  assert.equal(prepared.cancelled, 0x1);
});

test('launchChromeShell wires the process error and exit callbacks', async () => {
  const spawn = createSpawnDouble();
  const exits = [];
  const errors = [];
  const launch = await launchChromeShell(
    launchInput({
      spawnProcess: spawn.spawnProcess,
      now: () => 0x64,
      onExit: (event) => exits.push(event),
      onError: (error) => errors.push(error),
    }),
  );
  const child = spawn.children[0x0];
  child.emit('error', new Error('crashed'));
  assert.equal(errors.length, 0x1);
  assert.equal(errors[0x0].code, SPAWN_ERROR_CODE);
  assert.equal(launch.spawnError, errors[0x0]);
  child.emit('exit', 0x3, 'SIGTERM');
  assert.deepEqual(exits, [{ code: 0x3, signal: 'SIGTERM', spawnedAt: 0x64 }]);
});

test('launchChromeShell skips the exit hook when no callback is supplied', async () => {
  const spawn = createSpawnDouble();
  const launch = await launchChromeShell(launchInput({ spawnProcess: spawn.spawnProcess }));
  assert.equal(launch.process, spawn.children[0x0]);
  spawn.children[0x0].emit('exit', 0x0, null);
});

test('launchChromeShellWithLifecycle logs the launch and returns the launch record', async () => {
  const spawn = createSpawnDouble();
  const log = createLogDouble();
  const launch = await launchChromeShellWithLifecycle(
    launchInput({ spawnProcess: spawn.spawnProcess, logEvent: log.logEvent }),
  );
  assert.equal(launch.process, spawn.children[0x0]);
  assert.equal(log.events.length, 0x1);
  assert.equal(log.events[0x0].type, 'chrome_shell.launched');
  assert.deepEqual(log.events[0x0].context, {
    browserPath: BROWSER_PATH,
    profileDir: PROFILE_DIR,
    appUrl: APP_URL_SHELL,
  });
});

test('launchChromeShellWithLifecycle treats a fast clean exit as a detached shell', async () => {
  const spawn = createSpawnDouble();
  const log = createLogDouble();
  const closed = [];
  let clock = 0x3e8;
  const app = createAppDouble({ paths: { sessionData: 'C:\\Session' } });
  const launch = await launchChromeShellWithLifecycle(
    launchInput({
      app: app,
      spawnProcess: spawn.spawnProcess,
      logEvent: log.logEvent,
      onClosed: (event) => closed.push(event),
      now: () => clock,
    }),
  );
  clock += 0x1f4;
  spawn.children[0x0].emit('exit', 0x0, null);
  assert.equal(launch.detached, true);
  assert.equal(log.events[0x1].type, 'chrome_shell.early_exit_ignored');
  assert.equal(log.events[0x1].level, 'warn');
  assert.equal(log.events[0x1].context.runtimeMs, 0x1f4);
  assert.equal(log.events[0x1].context.graceMs, 0x1388);
  assert.deepEqual(closed, [{ code: 0x0, signal: null, runtimeMs: 0x1f4, detached: true }]);
  assert.equal(app.quitCalls.length, 0x0);
});

test('launchChromeShellWithLifecycle quits after a real exit unless the launcher is kept', async () => {
  const spawn = createSpawnDouble();
  const log = createLogDouble();
  const closed = [];
  let clock = 0x0;
  const app = createAppDouble({ paths: { sessionData: 'C:\\Session' } });
  await launchChromeShellWithLifecycle(
    launchInput({
      app: app,
      env: { AIC_CHROME_SHELL_BROWSER: BROWSER_PATH, AIC_CHROME_SHELL_PROFILE_DIR: PROFILE_DIR },
      spawnProcess: spawn.spawnProcess,
      logEvent: log.logEvent,
      onClosed: (event) => {
        closed.push(event);
      },
      now: () => clock,
    }),
  );
  clock = 0x3e8 + 0x1388;
  spawn.children[0x0].emit('exit', 0x0, null);
  assert.equal(log.events[0x1].type, 'chrome_shell.exited');
  assert.equal(log.events[0x1].level, 'info');
  assert.deepEqual(closed, [{ code: 0x0, signal: null, runtimeMs: 0x1770, detached: false }]);
  assert.equal(app.quitCalls.length, 0x1);
});

test('launchChromeShellWithLifecycle keeps the app when onClosed asks to or the flag is set', async () => {
  const keepSpawn = createSpawnDouble();
  const keepApp = createAppDouble({ paths: { sessionData: 'C:\\Session' } });
  let keepClock = 0x0;
  await launchChromeShellWithLifecycle(
    launchInput({
      app: keepApp,
      appUrl: APP_URL,
      spawnProcess: keepSpawn.spawnProcess,
      onClosed: () => false,
      now: () => keepClock,
    }),
  );
  keepClock = 0x1770;
  keepSpawn.children[0x0].emit('exit', 0x0, null);
  assert.equal(keepApp.quitCalls.length, 0x0);

  const flagSpawn = createSpawnDouble();
  const flagApp = createAppDouble({ paths: { sessionData: 'C:\\Session' } });
  let flagClock = 0x0;
  await launchChromeShellWithLifecycle(
    launchInput({
      app: flagApp,
      env: {
        AIC_CHROME_SHELL_BROWSER: BROWSER_PATH,
        AIC_CHROME_SHELL_PROFILE_DIR: PROFILE_DIR,
        AIC_CHROME_SHELL_KEEP_LAUNCHER: '1',
      },
      spawnProcess: flagSpawn.spawnProcess,
      onClosed: () => undefined,
      now: () => flagClock,
    }),
  );
  flagClock = 0x1770;
  flagSpawn.children[0x0].emit('exit', 0x0, null);
  assert.equal(flagApp.quitCalls.length, 0x0);
});

test('launchChromeShellWithLifecycle normalizes and reports spawn errors', async () => {
  const spawn = createSpawnDouble();
  const log = createLogDouble();
  const launchErrors = [];
  const raw = new Error('spawn ENOENT');
  raw.code = 'ENOENT';
  await launchChromeShellWithLifecycle(
    launchInput({
      spawnProcess: spawn.spawnProcess,
      logEvent: log.logEvent,
      onLaunchError: (error) => launchErrors.push(error),
    }),
  );
  spawn.children[0x0].emit('error', raw);
  assert.equal(launchErrors.length, 0x1);
  assert.equal(launchErrors[0x0].code, SPAWN_ERROR_CODE);
  const spawnErrorEvent = log.events.find((event) => event.type === 'chrome_shell.spawn_error');
  assert.equal(spawnErrorEvent.level, 'error');
  assert.equal(spawnErrorEvent.source, 'main');
  assert.equal(spawnErrorEvent.message, 'Chrome shell process failed');
  assert.equal(spawnErrorEvent.error, launchErrors[0x0]);
});
