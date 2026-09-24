import assert from 'node:assert/strict';
import test from 'node:test';
import { startChromeShellRuntime, __chromeShellRuntimeForTest } from './chromeShellRuntime.js';

const BROWSER_NODE_MODE_ENV = 'AIC_CHROME_BROWSER_NODE_MODE';
const SPAWN_ERROR_CODE = 'CHROME_SHELL_SPAWN_ERROR';
const APP_URL = 'http://127.0.0.1:8777/';
const BROWSER_PATH = 'C:\\Chrome\\chrome.exe';
const PROFILE_DIR = 'C:\\Profiles\\chrome-shell-profile';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flush(count = 0x8) {
  let chain = Promise.resolve();
  for (let index = 0x0; index < count; index += 0x1)
    chain = chain.then(() => new Promise((resolve) => setImmediate(resolve)));
  return chain;
}

function createLogDouble(override = null) {
  const events = [];
  return {
    events,
    logEvent: (event) => {
      events.push(event);
      override?.(event);
    },
    types: () => events.map((event) => event.type),
    find: (type) => events.find((event) => event.type === type) || null,
  };
}

function createLaunchDouble(overrides = {}) {
  const launch = {
    browserPath: BROWSER_PATH,
    profileDir: PROFILE_DIR,
    process: {
      pid: 0x10e1,
      exitCode: null,
      signalCode: null,
      killCount: 0x0,
      kill() {
        launch.process.killCount += 0x1;
      },
    },
    startupDiagnostics: {
      stopCount: 0x0,
      stop() {
        launch.startupDiagnostics.stopCount += 0x1;
      },
      snapshot: () => ({ stderrTail: 'boom' }),
    },
  };
  return Object.assign(launch, overrides);
}

function createLaunchShellDouble({ launch = null, throwError = null } = {}) {
  const calls = [];
  return {
    calls,
    launchShell: async (options = {}) => {
      calls.push(options);
      if (throwError) throw throwError;
      return launch || createLaunchDouble();
    },
  };
}

function createBrowserWorkerDouble({ devToolsPipe = null } = {}) {
  const launched = [];
  const factory = (options = {}) => {
    const worker = {
      options,
      disposeCount: 0x0,
      dispose() {
        worker.disposeCount += 0x1;
      },
    };
    if (devToolsPipe) worker.devToolsPipe = devToolsPipe;
    launched.push(worker);
    return worker;
  };
  return { factory, launched };
}

function createCdpClientDouble() {
  const created = [];
  const factory = (options = {}) => {
    const client = { options };
    created.push(client);
    return client;
  };
  return { factory, created };
}

function createWebPreviewManagerDouble() {
  const created = [];
  const factory = (options = {}) => {
    const manager = {
      options,
      syncViewsPayloads: [],
      controlViewPayloads: [],
      disposeViewsPayloads: [],
      disposeCount: 0x0,
      entries: {},
      syncViews: async (payload) => {
        manager.syncViewsPayloads.push(payload);
        return { ok: true, applied: payload.views.length };
      },
      controlView: async (payload) => {
        manager.controlViewPayloads.push(payload);
        return { ok: true, controlled: true };
      },
      disposeViews: async (payload) => {
        manager.disposeViewsPayloads.push(payload);
        return { ok: true, disposed: payload.views.length };
      },
      consumeEvents: () => [{ type: 'consumed' }],
      waitForEvents: (payload) => Promise.resolve([{ type: 'waited', payload: payload }]),
      dispose: async () => {
        manager.disposeCount += 0x1;
      },
      _getEntry: (nodeId, tabId) => manager.entries[nodeId + ':' + tabId] || null,
    };
    created.push(manager);
    return manager;
  };
  return { factory, created };
}

function createBridgeDouble(overrides = {}) {
  const bridge = {
    url: 'http://127.0.0.1:18999/bridge',
    token: 'bridge-token',
    closeCount: 0x0,
    close: async () => {
      bridge.closeCount += 0x1;
    },
  };
  return Object.assign(bridge, overrides);
}

function runtimeInput(overrides = {}) {
  const log = createLogDouble();
  const shell = createLaunchShellDouble();
  const bridge = createBridgeDouble();
  return {
    log,
    shell,
    bridge,
    input: {
      app: { isPackaged: false, paths: { userData: 'C:\\UserData' } },
      appUrl: APP_URL,
      env: {},
      platform: 'linux',
      desktopHttpBridge: bridge,
      logEvent: log.logEvent,
      launchShell: shell.launchShell,
      launchBrowserWorker: createBrowserWorkerDouble().factory,
      createCdpClient: createCdpClientDouble().factory,
      createWebPreviewManager: createWebPreviewManagerDouble().factory,
      ...overrides,
    },
  };
}

const {
  BROWSER_NODE_MODE_ENV: EXPORTED_MODE_ENV,
  resolveBrowserNodeMode,
  shouldKeepWebPreviewView,
} = __chromeShellRuntimeForTest;

test('exposes the browser node mode env name and the two pure helpers', () => {
  assert.equal(EXPORTED_MODE_ENV, BROWSER_NODE_MODE_ENV);
  assert.equal(typeof resolveBrowserNodeMode, 'function');
  assert.equal(typeof shouldKeepWebPreviewView, 'function');
});

test('resolveBrowserNodeMode accepts eager/lazy/off and normalizes case and padding', () => {
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: 'eager' }), 'eager');
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: 'lazy' }), 'lazy');
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: 'off' }), 'off');
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: '  EAGER  ' }), 'eager');
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: 'Off' }), 'off');
});

test('resolveBrowserNodeMode falls back to lazy for unknown, blank and missing values', () => {
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: 'aggressive' }), 'lazy');
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: '' }), 'lazy');
  assert.equal(resolveBrowserNodeMode({}), 'lazy');
  assert.equal(resolveBrowserNodeMode(null), 'lazy');
  assert.equal(resolveBrowserNodeMode({ [BROWSER_NODE_MODE_ENV]: 0x7 }), 'lazy');
});

test('resolveBrowserNodeMode defaults to process.env', () => {
  const previous = process.env[BROWSER_NODE_MODE_ENV];
  process.env[BROWSER_NODE_MODE_ENV] = 'off';
  try {
    assert.equal(resolveBrowserNodeMode(), 'off');
  } finally {
    if (previous === undefined) delete process.env[BROWSER_NODE_MODE_ENV];
    else process.env[BROWSER_NODE_MODE_ENV] = previous;
  }
});

test('shouldKeepWebPreviewView keeps views that are visible, selected, fullscreen or pending a popup', () => {
  assert.equal(shouldKeepWebPreviewView({ visible: true }), true);
  assert.equal(shouldKeepWebPreviewView({ selected: true }), true);
  assert.equal(shouldKeepWebPreviewView({ fullscreen: true }), true);
  assert.equal(shouldKeepWebPreviewView({ pendingPopup: true }), true);
  assert.equal(shouldKeepWebPreviewView({ visible: true, selected: false }), true);
});

test('shouldKeepWebPreviewView rejects idle views and requires strict booleans', () => {
  assert.equal(shouldKeepWebPreviewView({}), false);
  assert.equal(shouldKeepWebPreviewView(), false);
  assert.equal(shouldKeepWebPreviewView(null), false);
  assert.equal(shouldKeepWebPreviewView({ visible: 0x1, selected: 'yes' }), false);
  assert.equal(shouldKeepWebPreviewView({ visible: false, fullscreen: false, pendingPopup: false }), false);
});

test('startChromeShellRuntime requires a desktop bridge factory when no bridge is supplied', async () => {
  const { input } = runtimeInput({ desktopHttpBridge: null });
  await assert.rejects(startChromeShellRuntime(input), {
    name: 'TypeError',
    message: 'Chrome shell desktop bridge factory is required',
  });
});

test('startChromeShellRuntime creates the bridge through startHttpBridge and exports its address', async () => {
  const created = createBridgeDouble();
  const calls = [];
  const handlers = { 'asset/read': () => undefined };
  const { input } = runtimeInput({
    desktopHttpBridge: null,
    startHttpBridge: async (options) => {
      calls.push(options);
      return created;
    },
    token: 'session-token',
    handlers: handlers,
  });
  const result = await startChromeShellRuntime(input);
  assert.equal(calls.length, 0x1);
  assert.equal(calls[0x0].token, 'session-token');
  assert.equal(calls[0x0].handlers, handlers);
  assert.equal(typeof calls[0x0].logEvent, 'function');
  assert.equal(input.env['AIC_DESKTOP_BRIDGE_URL'], created.url);
  assert.equal(input.env['AIC_DESKTOP_BRIDGE_TOKEN'], created.token);
  assert.equal(result.desktopHttpBridge, created);
  assert.equal(created.closeCount, 0x0);
});

test('startChromeShellRuntime keeps a caller supplied bridge on startup failure', async () => {
  const bridge = createBridgeDouble();
  const { input } = runtimeInput({
    desktopHttpBridge: bridge,
    launchShell: async () => {
      throw new Error('launch exploded');
    },
  });
  await assert.rejects(startChromeShellRuntime(input), { message: 'launch exploded' });
  assert.equal(bridge.closeCount, 0x0);
});

test('startChromeShellRuntime closes a self created bridge on startup failure', async () => {
  const bridge = createBridgeDouble();
  const { input, log } = runtimeInput({
    desktopHttpBridge: null,
    startHttpBridge: async () => bridge,
    launchShell: async () => {
      throw new Error('launch exploded');
    },
  });
  await assert.rejects(startChromeShellRuntime(input), { message: 'launch exploded' });
  assert.equal(bridge.closeCount, 0x1);
  assert.equal(log.find('chrome_shell.startup_failed').level, 'error');
});

test('startChromeShellRuntime forwards the launch inputs and log sink to launchShell', async () => {
  const displayWorkAreas = [{ x: 0x0, y: 0x0, width: 0x780, height: 0x438 }];
  const windowsTaskbarIdentity = { identity: 'canvaspro' };
  const { input, shell, log } = runtimeInput({ windowsTaskbarIdentity, displayWorkAreas });
  const result = await startChromeShellRuntime(input);
  assert.equal(shell.calls.length, 0x1);
  const options = shell.calls[0x0];
  assert.equal(options.app, input.app);
  assert.equal(options.appUrl, APP_URL);
  assert.equal(options.env, input.env);
  assert.equal(options.platform, 'linux');
  assert.equal(options.logEvent, log.logEvent);
  assert.equal(options.displayWorkAreas, displayWorkAreas);
  assert.equal(options.windowsTaskbarIdentity, windowsTaskbarIdentity);
  assert.equal(options.windowsTaskbarIdentityPreparation, null);
  assert.equal(typeof options.onClosed, 'function');
  assert.equal(typeof options.onLaunchError, 'function');
  assert.equal(result.chromeShellLaunch.browserPath, BROWSER_PATH);
  assert.equal(result.chromeShellLaunch.profileDir, PROFILE_DIR);
});

test('startChromeShellRuntime lets prepare override the application url', async () => {
  const customUrl = 'http://127.0.0.1:9999/custom/';
  const { input, shell } = runtimeInput({ prepare: async () => ({ appUrl: customUrl }) });
  await startChromeShellRuntime(input);
  assert.equal(shell.calls[0x0].appUrl, customUrl);
});

test('startChromeShellRuntime keeps the default url when prepare returns nothing useful', async () => {
  const { input, shell } = runtimeInput({ prepare: async () => ({ appUrl: '   ' }) });
  await startChromeShellRuntime(input);
  assert.equal(shell.calls[0x0].appUrl, APP_URL);
});

test('startChromeShellRuntime stops the startup diagnostics collector on success', async () => {
  const launch = createLaunchDouble();
  const shell = createLaunchShellDouble({ launch });
  const { input } = runtimeInput({ launchShell: shell.launchShell });
  const result = await startChromeShellRuntime(input);
  assert.equal(launch.startupDiagnostics.stopCount, 0x1);
  assert.equal(result.chromeShellLaunch, launch);
});

test('startChromeShellRuntime throws the normalized spawn error recorded on the launch', async () => {
  const launch = createLaunchDouble({ spawnError: { code: SPAWN_ERROR_CODE, message: 'cached' } });
  const shell = createLaunchShellDouble({ launch });
  await assert.rejects(
    startChromeShellRuntime(runtimeInput({ launchShell: shell.launchShell }).input),
    (error) => {
      assert.equal(error.code, SPAWN_ERROR_CODE);
      assert.equal(error.message, 'cached');
      return true;
    },
  );
});

test('startChromeShellRuntime ignores a spawn failure reported before the launch object is registered', async () => {
  const launch = createLaunchDouble();
  const raw = new Error('spawn chrome ENOENT');
  raw.code = 'ENOENT';
  const { input } = runtimeInput({
    launchShell: async (options) => {
      options.onLaunchError(raw);
      return launch;
    },
  });
  const result = await startChromeShellRuntime(input);
  assert.equal(launch.spawnError, undefined);
  assert.equal(result.chromeShellLaunch, launch);
});

test('startChromeShellRuntime stores a late spawn failure on the launch when no renderer gate is open', async () => {
  const launch = createLaunchDouble();
  let reportSpawnError = null;
  const { input } = runtimeInput({
    launchShell: async (options) => {
      reportSpawnError = options.onLaunchError;
      return launch;
    },
  });
  const result = await startChromeShellRuntime(input);
  const raw = new Error('spawn chrome EBUSY');
  raw.code = 'EBUSY';
  reportSpawnError(raw);
  assert.equal(result.chromeShellLaunch.spawnError.code, SPAWN_ERROR_CODE);
  assert.equal(result.chromeShellLaunch.spawnError.details.originalCode, 'EBUSY');
});

test('startChromeShellRuntime aborts startup when the launch reports a spawn error while waiting for the renderer', async () => {
  const launch = createLaunchDouble();
  const { input } = runtimeInput({
    waitForRendererReady: () => new Promise(() => undefined),
    launchShell: async (options) => {
      const raw = new Error('spawn chrome EACCES');
      raw.code = 'EACCES';
      options.onLaunchError(raw);
      return launch;
    },
  });
  await assert.rejects(startChromeShellRuntime(input), (error) => {
    assert.equal(error.code, SPAWN_ERROR_CODE);
    assert.equal(error.details.originalCode, 'EACCES');
    return true;
  });
});

test('startChromeShellRuntime logs renderer readiness with the elapsed time', async () => {
  const { input, log } = runtimeInput({ waitForRendererReady: async () => ({ elapsedMs: 0x2af8 }) });
  await startChromeShellRuntime(input);
  const event = log.find('chrome_shell.renderer_ready');
  assert.equal(event.level, 'info');
  assert.equal(event.source, 'main');
  assert.equal(event.message, 'Chrome shell renderer completed startup');
  assert.equal(event.context.browserPath, BROWSER_PATH);
  assert.equal(event.context.profileDir, PROFILE_DIR);
  assert.equal(event.context.elapsedMs, 0x2af8);
});

test('startChromeShellRuntime defaults the reported readiness time to zero', async () => {
  const { input, log } = runtimeInput({ waitForRendererReady: async () => undefined });
  await startChromeShellRuntime(input);
  assert.equal(log.find('chrome_shell.renderer_ready').context.elapsedMs, 0x0);
});

test('startChromeShellRuntime calls onClosed when the renderer already reported readiness', async () => {
  const closeContext = { code: 0x0, signal: null };
  const { input, shell } = runtimeInput({ onClosed: () => 'user-result' });
  await startChromeShellRuntime(input);
  assert.equal(shell.calls[0x0].onClosed(closeContext), 'user-result');
});

test('startChromeShellRuntime vetoes the quit through onClosed when no renderer waiter exists', async () => {
  const { input, shell } = runtimeInput({ onClosed: () => false });
  await startChromeShellRuntime(input);
  assert.equal(shell.calls[0x0].onClosed({ code: 0x3, signal: null }), false);
});

test('startChromeShellRuntime reports no quit request for a detached exit and marks the launch', async () => {
  const { input, shell } = runtimeInput({ onClosed: () => 'never called' });
  const result = await startChromeShellRuntime(input);
  assert.equal(shell.calls[0x0].onClosed({ detached: true, code: 0x0 }), false);
  assert.equal(result.chromeShellLaunch.detached, true);
});

test('startChromeShellRuntime fails startup when the shell exits before the renderer is ready', async () => {
  let onClosed = null;
  const { input, log } = runtimeInput({
    waitForRendererReady: () => new Promise(() => undefined),
    launchShell: async (options) => {
      onClosed = options.onClosed;
      return createLaunchDouble();
    },
  });
  const promise = startChromeShellRuntime(input);
  await flush();
  assert.equal(typeof onClosed, 'function');
  assert.equal(onClosed({ code: 0x2, signal: null }), false);
  await assert.rejects(promise, (error) => {
    assert.equal(error.message, 'Chrome shell exited before the renderer completed startup');
    assert.equal(error.code, 'CHROME_SHELL_EXITED_BEFORE_READY');
    assert.equal(error.details.code, 0x2);
    return true;
  });
  const event = log.find('chrome_shell.exited_before_renderer_ready');
  assert.equal(event.level, 'error');
  assert.equal(event.source, 'main');
  assert.equal(event.context.code, 0x2);
});

test('startChromeShellRuntime reports a pre-ready exit without signal as a cancelled startup', async () => {
  let onClosed = null;
  const { input, log } = runtimeInput({
    waitForRendererReady: () => new Promise(() => undefined),
    launchShell: async (options) => {
      onClosed = options.onClosed;
      return createLaunchDouble();
    },
  });
  const promise = startChromeShellRuntime(input);
  await flush();
  onClosed({ code: 0x0, signal: null });
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, 'CHROME_SHELL_STARTUP_CANCELLED');
    return true;
  });
  const event = log.find('chrome_shell.exited_before_renderer_ready');
  assert.equal(event.level, 'info');
  assert.equal(event.context.signal, null);
});

test('startChromeShellRuntime keeps the browser node lazy by default', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => true } });
  const cdp = createCdpClientDouble();
  const manager = createWebPreviewManagerDouble();
  const { input } = runtimeInput({
    launchBrowserWorker: browserWorker.factory,
    createCdpClient: cdp.factory,
    createWebPreviewManager: manager.factory,
  });
  const result = await startChromeShellRuntime(input);
  assert.equal(result.browserWorker, null);
  assert.equal(typeof result.webPreviewManager.syncViews, 'function');
  assert.equal(browserWorker.launched.length, 0x0);
  assert.equal(cdp.created.length, 0x0);
  assert.equal(manager.created.length, 0x0);
});

test('startChromeShellRuntime prepares the browser node eagerly when asked', async () => {
  const pipe = { write: () => undefined };
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: pipe });
  const cdp = createCdpClientDouble();
  const manager = createWebPreviewManagerDouble();
  const { input, log } = runtimeInput({
    env: { [BROWSER_NODE_MODE_ENV]: 'eager' },
    launchBrowserWorker: browserWorker.factory,
    createCdpClient: cdp.factory,
    createWebPreviewManager: manager.factory,
  });
  const result = await startChromeShellRuntime(input);
  assert.equal(browserWorker.launched.length, 0x1);
  assert.equal(result.browserWorker, browserWorker.launched[0x0]);
  assert.equal(cdp.created.length, 0x1);
  assert.equal(cdp.created[0x0].options.write, pipe.write);
  assert.equal(cdp.created[0x0].options.logEvent, log.logEvent);
  assert.equal(manager.created.length, 0x1);
  assert.equal(manager.created[0x0].options.client, cdp.created[0x0]);
  assert.equal(browserWorker.launched[0x0].disposeCount, 0x0);
});

test('startChromeShellRuntime disables the browser node when the mode is off', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => true } });
  const { input } = runtimeInput({
    env: { [BROWSER_NODE_MODE_ENV]: 'off' },
    launchBrowserWorker: browserWorker.factory,
  });
  const result = await startChromeShellRuntime(input);
  assert.deepEqual(await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] }), {
    ok: false,
    error: 'browser-node-disabled',
  });
  assert.deepEqual(await result.webPreviewManager.controlView({ nodeId: 'a' }), {
    ok: false,
    error: 'browser-node-disabled',
  });
  assert.equal(browserWorker.launched.length, 0x0);
});

test('startChromeShellRuntime returns an idle result for empty view sets without touching the worker', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => true } });
  const { input } = runtimeInput({ launchBrowserWorker: browserWorker.factory });
  const result = await startChromeShellRuntime(input);
  assert.deepEqual(await result.webPreviewManager.syncViews({ views: [] }), {
    ok: true,
    count: 0x0,
    visibleCount: 0x0,
  });
  assert.deepEqual(await result.webPreviewManager.syncViews({ views: [{ id: 'a' }] }), {
    ok: true,
    count: 0x0,
    visibleCount: 0x0,
  });
  assert.equal(browserWorker.launched.length, 0x0);
});

test('startChromeShellRuntime starts the browser node on the first kept view and reuses it', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => undefined } });
  const manager = createWebPreviewManagerDouble();
  const { input } = runtimeInput({
    launchBrowserWorker: browserWorker.factory,
    createWebPreviewManager: manager.factory,
  });
  const result = await startChromeShellRuntime(input);
  const first = await result.webPreviewManager.syncViews({
    views: [{ id: 'a', visible: true }, { id: 'b' }, { id: 'c', selected: true }],
  });
  assert.deepEqual(first, { ok: true, applied: 0x2 });
  assert.equal(browserWorker.launched.length, 0x1);
  assert.equal(browserWorker.launched[0x0].options.browserPath, BROWSER_PATH);
  assert.equal(browserWorker.launched[0x0].options.mainProfileDir, PROFILE_DIR);
  assert.deepEqual(
    manager.created[0x0].syncViewsPayloads[0x0].views.map((view) => view.id),
    ['a', 'c'],
  );
  const second = await result.webPreviewManager.syncViews({ views: [{ id: 'd', fullscreen: true }] });
  assert.deepEqual(second, { ok: true, applied: 0x1 });
  assert.equal(browserWorker.launched.length, 0x1);
  assert.deepEqual(
    manager.created[0x0].syncViewsPayloads[0x1].views.map((view) => view.id),
    ['d'],
  );
});

test('startChromeShellRuntime reports an unavailable browser node when the worker has no pipe', async () => {
  const browserWorker = createBrowserWorkerDouble();
  const { input, log } = runtimeInput({ launchBrowserWorker: browserWorker.factory });
  const result = await startChromeShellRuntime(input);
  assert.deepEqual(await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] }), {
    ok: false,
    error: 'browser-node-unavailable',
  });
  const event = log.find('chrome_web_preview.pipe_unavailable');
  assert.equal(event.level, 'error');
  assert.equal(event.source, 'main');
  assert.equal(event.message, 'Chrome browser node pipe is unavailable');
  assert.equal(result.browserWorker, null);
});

test('startChromeShellRuntime logs worker errors through the deferred runtime log sink', async () => {
  const pipe = { write: () => undefined };
  let workerOptions = null;
  const { input, log } = runtimeInput({
    launchBrowserWorker: (options) => {
      workerOptions = options;
      return { devToolsPipe: pipe, dispose: () => undefined };
    },
  });
  const result = await startChromeShellRuntime(input);
  await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] });
  assert.equal(typeof workerOptions.onError, 'function');
  workerOptions.onError(new Error('node worker crashed'));
  const event = log.find('chrome_web_preview.worker_error');
  assert.equal(event.level, 'error');
  assert.equal(event.source, 'main');
  assert.equal(event.message, 'Chrome browser node worker failed');
  assert.equal(event.error.message, 'node worker crashed');
});

test('startChromeShellRuntime delegates preview control to the manager once it exists', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => undefined } });
  const manager = createWebPreviewManagerDouble();
  const { input } = runtimeInput({
    launchBrowserWorker: browserWorker.factory,
    createWebPreviewManager: manager.factory,
  });
  const result = await startChromeShellRuntime(input);
  await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] });
  assert.deepEqual(await result.webPreviewManager.controlView({ nodeId: 'a', action: 'reload' }), {
    ok: true,
    controlled: true,
  });
  assert.deepEqual(await result.webPreviewManager.disposeViews({ views: [{ id: 'a' }] }), {
    ok: true,
    disposed: 0x1,
  });
  assert.deepEqual(manager.created[0x0].controlViewPayloads, [{ nodeId: 'a', action: 'reload' }]);
  assert.deepEqual(manager.created[0x0].disposeViewsPayloads, [{ views: [{ id: 'a' }] }]);
});

test('startChromeShellRuntime reports no disposed views when the manager is absent', async () => {
  const { input } = runtimeInput();
  const result = await startChromeShellRuntime(input);
  assert.deepEqual(await result.webPreviewManager.disposeViews({ views: [{ id: 'a' }] }), {
    ok: true,
    disposed: 0x0,
  });
});

test('startChromeShellRuntime reports no preview events before the manager exists', async () => {
  const manager = createWebPreviewManagerDouble();
  const { input } = runtimeInput({ createWebPreviewManager: manager.factory });
  const result = await startChromeShellRuntime(input);
  assert.deepEqual(result.webPreviewManager.consumeEvents(), []);
  assert.equal(manager.created.length, 0x0);
});

test('startChromeShellRuntime delegates event consumption and waiting to the manager', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => undefined } });
  const manager = createWebPreviewManagerDouble();
  const { input } = runtimeInput({
    launchBrowserWorker: browserWorker.factory,
    createWebPreviewManager: manager.factory,
  });
  const result = await startChromeShellRuntime(input);
  await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] });
  assert.deepEqual(result.webPreviewManager.consumeEvents(), [{ type: 'consumed' }]);
  assert.deepEqual(await result.webPreviewManager.waitForEvents({ waitMs: 0x32 }), [
    { type: 'waited', payload: { waitMs: 0x32 } },
  ]);
});

test('startChromeShellRuntime waits out the clamped fallback delay when the manager is absent', async () => {
  const { input } = runtimeInput();
  const result = await startChromeShellRuntime(input);
  const startedAt = Date.now();
  assert.deepEqual(await result.webPreviewManager.waitForEvents({ waitMs: 0x1 }), []);
  assert.ok(Date.now() - startedAt >= 0x28, 'clamped wait should not resolve before 50ms');
});

test('startChromeShellRuntime ignores the requested wait time when it is not finite', async () => {
  const { input } = runtimeInput();
  const result = await startChromeShellRuntime(input);
  let settled = false;
  const promise = result.webPreviewManager.waitForEvents({ waitMs: 'later' }).then((value) => {
    settled = true;
    return value;
  });
  await delay(0x14);
  assert.equal(settled, false);
  assert.deepEqual(await promise, []);
  assert.equal(settled, true);
});

test('startChromeShellRuntime resolves pending waits once the runtime is disposed', async () => {
  const { input } = runtimeInput();
  const result = await startChromeShellRuntime(input);
  await result.webPreviewManager.dispose();
  assert.deepEqual(await result.webPreviewManager.waitForEvents({ waitMs: 0x1770 }), []);
});

test('startChromeShellRuntime looks entries up through the manager with both identifiers', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => undefined } });
  const manager = createWebPreviewManagerDouble();
  const { input } = runtimeInput({
    launchBrowserWorker: browserWorker.factory,
    createWebPreviewManager: manager.factory,
  });
  const result = await startChromeShellRuntime(input);
  assert.equal(result.webPreviewManager._getEntry('node-1', 'tab-1'), null);
  await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] });
  manager.created[0x0].entries['node-1:tab-1'] = { nodeId: 'node-1', tabId: 'tab-1' };
  assert.deepEqual(result.webPreviewManager._getEntry('node-1', 'tab-1'), {
    nodeId: 'node-1',
    tabId: 'tab-1',
  });
});

test('startChromeShellRuntime disposes the manager and worker exactly once', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => undefined } });
  const manager = createWebPreviewManagerDouble();
  const { input } = runtimeInput({
    launchBrowserWorker: browserWorker.factory,
    createWebPreviewManager: manager.factory,
  });
  const result = await startChromeShellRuntime(input);
  await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] });
  await result.webPreviewManager.dispose();
  assert.equal(manager.created[0x0].disposeCount, 0x1);
  assert.equal(browserWorker.launched[0x0].disposeCount, 0x1);
  await result.webPreviewManager.dispose();
  assert.equal(manager.created[0x0].disposeCount, 0x1);
  assert.equal(browserWorker.launched[0x0].disposeCount, 0x1);
});

test('startChromeShellRuntime refuses to start the browser node after disposal', async () => {
  const browserWorker = createBrowserWorkerDouble({ devToolsPipe: { write: () => undefined } });
  const { input } = runtimeInput({ launchBrowserWorker: browserWorker.factory });
  const result = await startChromeShellRuntime(input);
  await result.webPreviewManager.dispose();
  assert.deepEqual(await result.webPreviewManager.syncViews({ views: [{ id: 'a', visible: true }] }), {
    ok: false,
    error: 'browser-node-unavailable',
  });
  assert.equal(browserWorker.launched.length, 0x0);
});

test('startChromeShellRuntime logs the failed stage and launch snapshot when startup throws', async () => {
  const launch = createLaunchDouble();
  const shell = createLaunchShellDouble({ launch });
  const { input, log } = runtimeInput({
    prepare: async () => {
      throw new Error('prepare exploded');
    },
    launchShell: shell.launchShell,
  });
  await assert.rejects(startChromeShellRuntime(input), { message: 'prepare exploded' });
  const event = log.find('chrome_shell.startup_failed');
  assert.equal(event.level, 'error');
  assert.equal(event.source, 'main');
  assert.equal(event.message, 'Chrome shell startup failed before cleanup');
  assert.equal(event.context.stage, 'prepare');
  assert.equal(event.context.browserPath, '');
  assert.equal(event.context.profileDir, '');
  assert.equal(event.context.detached, false);
  assert.equal(event.context.stderrTail, undefined);
  assert.equal(shell.calls.length, 0x0);
});

test('startChromeShellRuntime reports the launch stage before the launch object exists', async () => {
  const shell = createLaunchShellDouble({ throwError: new Error('launch exploded') });
  const { input, log } = runtimeInput({ launchShell: shell.launchShell });
  await assert.rejects(startChromeShellRuntime(input), { message: 'launch exploded' });
  const event = log.find('chrome_shell.startup_failed');
  assert.equal(event.context.stage, 'launch');
  assert.equal(event.context.pid, null);
  assert.equal(event.context.exitCode, null);
  assert.equal(event.context.signalCode, null);
  assert.equal(event.context.detached, false);
  assert.equal(event.context.browserPath, '');
  assert.equal(event.context.profileDir, '');
});

test('startChromeShellRuntime reports the launch snapshot and process handles when a ready shell fails', async () => {
  const launch = createLaunchDouble();
  launch.process.pid = 0xbeef;
  launch.process.exitCode = 0x1;
  launch.process.signalCode = 'SIGTERM';
  let onClosed = null;
  const { input, log } = runtimeInput({
    waitForRendererReady: () => new Promise(() => undefined),
    launchShell: async (options) => {
      onClosed = options.onClosed;
      return launch;
    },
  });
  const promise = startChromeShellRuntime(input);
  await flush();
  onClosed({ code: 0x2, signal: null });
  await assert.rejects(promise, { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  const event = log.find('chrome_shell.startup_failed');
  assert.equal(event.context.stage, 'renderer-ready');
  assert.equal(event.context.pid, 0xbeef);
  assert.equal(event.context.exitCode, 0x1);
  assert.equal(event.context.signalCode, 'SIGTERM');
  assert.equal(event.context.detached, false);
  assert.equal(event.context.browserPath, BROWSER_PATH);
  assert.equal(event.context.profileDir, PROFILE_DIR);
  assert.equal(event.context.stderrTail, 'boom');
  assert.equal(launch.startupDiagnostics.stopCount, 0x1);
});

test('startChromeShellRuntime reports the renderer stage when readiness fails', async () => {
  const { input, log } = runtimeInput({
    waitForRendererReady: async () => {
      throw new Error('renderer blew up');
    },
  });
  await assert.rejects(startChromeShellRuntime(input), { message: 'renderer blew up' });
  assert.equal(log.find('chrome_shell.startup_failed').context.stage, 'renderer-ready');
});

test('startChromeShellRuntime logs an informative cancellation for the desktop startup abort', async () => {
  const cancelled = new Error('desktop startup cancelled');
  cancelled.code = 'AIC_DESKTOP_STARTUP_CANCELLED';
  const shell = createLaunchShellDouble({ throwError: cancelled });
  const { input, log } = runtimeInput({ launchShell: shell.launchShell });
  await assert.rejects(startChromeShellRuntime(input), cancelled);
  const event = log.find('chrome_shell.startup_cancelled');
  assert.equal(event.level, 'info');
  assert.equal(event.source, 'main');
  assert.equal(event.message, 'Chrome shell startup cancelled during shutdown');
  assert.equal(event.context.stage, 'launch');
});

async function failAfterLaunch({ launch = null, closeShellLaunch = null, controlShellWindow = null } = {}) {
  const target = launch || createLaunchDouble();
  let onClosed = null;
  const { input, log } = runtimeInput({
    waitForRendererReady: () => new Promise(() => undefined),
    launchShell: async (options) => {
      onClosed = options.onClosed;
      return target;
    },
    ...(closeShellLaunch ? { closeShellLaunch } : {}),
    ...(controlShellWindow ? { controlShellWindow } : {}),
  });
  const promise = startChromeShellRuntime(input);
  await flush();
  onClosed({ code: 0x2, signal: null });
  return { promise, input, log, launch: target };
}

test('startChromeShellRuntime closes the shell launch after a startup failure', async () => {
  const closeCalls = [];
  const { promise, log, launch } = await failAfterLaunch({
    closeShellLaunch: async (options) => {
      closeCalls.push(options);
      return true;
    },
  });
  await assert.rejects(promise, { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  assert.equal(closeCalls.length, 0x1);
  assert.equal(closeCalls[0x0].launch, launch);
  assert.equal(closeCalls[0x0].platform, 'linux');
  const event = log.find('chrome_shell.launch_close_after_startup_failure');
  assert.equal(event.level, 'info');
  assert.equal(event.source, 'main');
  assert.equal(event.message, 'Chrome shell close completed; profile release is not confirmed');
  assert.equal(event.context.closed, true);
  assert.equal(launch.process.killCount, 0x0);
});

test('startChromeShellRuntime warns when the launch close cannot be confirmed and kills the process', async () => {
  const { promise, log, launch } = await failAfterLaunch({ closeShellLaunch: async () => false });
  await assert.rejects(promise, { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  const event = log.find('chrome_shell.launch_close_after_startup_failure');
  assert.equal(event.level, 'warn');
  assert.equal(
    event.message,
    'Chrome\x20shell\x20process\x20tree\x20could\x20not\x20be\x20confirmed\x20closed\x20after\x20startup\x20failure',
  );
  assert.equal(event.context.closed, false);
  assert.equal(launch.process.killCount, 0x1);
});

test('startChromeShellRuntime swallows a throwing launch close and falls back to killing the process', async () => {
  const { promise, log, launch } = await failAfterLaunch({
    closeShellLaunch: async () => {
      throw new Error('close exploded');
    },
  });
  await assert.rejects(promise, { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  assert.equal(log.find('chrome_shell.launch_close_after_startup_failure').context.closed, false);
  assert.equal(launch.process.killCount, 0x1);
});

test('startChromeShellRuntime closes a detached window when the launch close is unconfirmed', async () => {
  const controlCalls = [];
  const { promise, log, launch } = await failAfterLaunch({
    launch: createLaunchDouble({ detached: true }),
    closeShellLaunch: async () => false,
    controlShellWindow: async (options) => {
      controlCalls.push(options);
      return true;
    },
  });
  await assert.rejects(promise, { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  assert.equal(controlCalls.length, 0x1);
  assert.equal(controlCalls[0x0].action, 'close');
  assert.equal(controlCalls[0x0].launch, launch);
  assert.equal(controlCalls[0x0].platform, 'linux');
  const event = log.find('chrome_shell.detached_window_close_after_startup_failure');
  assert.equal(event.level, 'info');
  assert.equal(
    event.message,
    'Detached\x20Chrome\x20shell\x20window\x20closed\x20after\x20startup\x20failure',
  );
  assert.equal(event.context.closed, true);
  assert.equal(launch.process.killCount, 0x0);
});

test('startChromeShellRuntime warns when a detached window cannot be closed', async () => {
  const { promise, log, launch } = await failAfterLaunch({
    launch: createLaunchDouble({ detached: true }),
    closeShellLaunch: async () => false,
    controlShellWindow: async () => {
      throw new Error('control exploded');
    },
  });
  await assert.rejects(promise, { code: 'CHROME_SHELL_EXITED_BEFORE_READY' });
  const event = log.find('chrome_shell.detached_window_close_after_startup_failure');
  assert.equal(event.level, 'warn');
  assert.equal(event.context.closed, false);
  assert.equal(launch.process.killCount, 0x0);
});

test('startChromeShellRuntime disposes an eager browser node after a later startup failure', async () => {
  const pipeError = new Error('pipe unavailable');
  const log = createLogDouble((event) => {
    if (event.type === 'chrome_web_preview.pipe_unavailable') throw pipeError;
  });
  const browserWorker = createBrowserWorkerDouble();
  const { input } = runtimeInput({
    env: { [BROWSER_NODE_MODE_ENV]: 'eager' },
    logEvent: log.logEvent,
    launchBrowserWorker: browserWorker.factory,
  });
  await assert.rejects(startChromeShellRuntime(input), pipeError);
  assert.equal(browserWorker.launched.length, 0x1);
  assert.equal(browserWorker.launched[0x0].disposeCount, 0x1);
});

test('startChromeShellRuntime rethrows the original startup failure after cleanup', async () => {
  const original = new Error('launch exploded');
  const launch = createLaunchDouble();
  const shell = createLaunchShellDouble({ launch, throwError: original });
  const { input } = runtimeInput({
    launchShell: shell.launchShell,
    closeShellLaunch: async () => true,
  });
  await assert.rejects(startChromeShellRuntime(input), (error) => {
    assert.equal(error, original);
    return true;
  });
});
