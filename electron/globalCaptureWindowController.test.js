import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GLOBAL_CAPTURE_ACTION_IDS,
  createGlobalCaptureWindowController,
  resolveGlobalCaptureWindowBounds,
} from './globalCaptureWindowController.js';

const DIRNAME = 'C:\\app\\electron';
const DEFAULT_WORK_AREA = { x: 0, y: 0, width: 1280, height: 720 };
const DEFAULT_BOUNDS = { x: 14, y: 14, width: 400, height: 52 };
const PRELOAD_FILE = 'globalCaptureWindowPreload.cjs';
const HTML_FILE = 'globalCaptureWindow.html';
const FOCUS_RETRY_MS = 32;
const PENDING_SHOW_MS = 128;

function createTimerDouble() {
  const timers = [];
  let seq = 0;
  return {
    timers,
    setTimeoutFn: (fn, ms) => {
      const id = ++seq;
      timers.push({ id, fn, ms, cleared: false });
      return id;
    },
    clearTimeoutFn: (id) => {
      const timer = timers.find((entry) => entry.id === id);
      if (timer) timer.cleared = true;
    },
    active: () => timers.filter((timer) => !timer.cleared),
    fire: (id) => {
      const timer = timers.find((entry) => entry.id === id);
      if (!timer) throw new Error('unknown timer ' + id);
      timer.fn();
      return timer;
    },
  };
}

function createWindowDouble(options = {}) {
  const record = {
    constructorOptions: null,
    events: new Map(),
    destroyed: options.destroyed === true,
    visible: options.visible === true,
    focused: options.focused === true,
    focusEffective: options.focusEffective !== false,
    capturePageResult: options.capturePageResult || { isEmpty: () => false },
    capturePageImpl: options.capturePageImpl || null,
    loadFileError: options.loadFileError || null,
    bounds: null,
    alwaysOnTop: null,
    visibleOnAllWorkspaces: null,
    showCount: 0,
    showInactiveCount: 0,
    hideCount: 0,
    focusCount: 0,
    destroyCount: 0,
    throttling: [],
    sent: [],
    loads: [],
    capturePageCalls: [],
  };
  const handlers = (event) => record.events.get(event) || [];
  const window = {
    loadFile: async (file) => {
      record.loads.push(file);
      if (record.loadFileError) throw record.loadFileError;
    },
    on: (event, handler) => {
      record.events.set(event, [...handlers(event), handler]);
      return window;
    },
    isDestroyed: () => record.destroyed,
    isVisible: () => record.visible,
    isFocused: () => record.focused,
    focus: () => {
      record.focusCount += 1;
      if (record.focusEffective) record.focused = true;
    },
    hide: () => {
      record.hideCount += 1;
      record.visible = false;
    },
    show: () => {
      record.showCount += 1;
      record.visible = true;
    },
    showInactive: () => {
      record.showInactiveCount += 1;
      record.visible = true;
    },
    destroy: () => {
      record.destroyCount += 1;
      record.destroyed = true;
      record.visible = false;
    },
    setBounds: (bounds) => {
      record.bounds = bounds;
    },
    setAlwaysOnTop: (flag, level) => {
      record.alwaysOnTop = { flag, level };
    },
    setVisibleOnAllWorkspaces: (flag, extra) => {
      record.visibleOnAllWorkspaces = { flag, extra };
    },
    webContents: {
      setBackgroundThrottling: (flag) => {
        record.throttling.push(flag);
      },
      send: (channel, payload) => {
        record.sent.push({ channel, payload });
      },
      capturePage: async (...args) => {
        record.capturePageCalls.push(args);
        if (record.capturePageImpl) return record.capturePageImpl(...args);
        return record.capturePageResult;
      },
    },
  };
  return {
    window,
    record,
    sender: window.webContents,
    emit: (event, ...args) => handlers(event).forEach((handler) => handler(...args)),
  };
}

function createBrowserWindowClassDouble(options = {}) {
  const instances = [];
  const BrowserWindowClass = class {
    constructor(constructorOptions) {
      const created = createWindowDouble(options);
      created.record.constructorOptions = constructorOptions;
      instances.push(created);
      return created.window;
    }
  };
  return { BrowserWindowClass, instances };
}

function createScreenApiDouble({ cursor = { x: 0, y: 0 }, workArea = DEFAULT_WORK_AREA } = {}) {
  const calls = { cursorPoints: 0, displayPoints: [] };
  return {
    calls,
    screenApi: {
      getCursorScreenPoint: () => {
        calls.cursorPoints += 1;
        return cursor;
      },
      getDisplayNearestPoint: (point) => {
        calls.displayPoints.push(point);
        return { workArea, bounds: workArea };
      },
    },
  };
}

function createDeferred() {
  let resolve = null;
  const promise = new Promise((resolveFn) => {
    resolve = resolveFn;
  });
  return { promise, resolve };
}

function createController(overrides = {}) {
  const logs = [];
  const timers = createTimerDouble();
  const windowFactory = createBrowserWindowClassDouble(overrides.windowOptions);
  const screen = createScreenApiDouble(overrides.screen);
  const actionCalls = [];
  const hasTheme = Object.prototype.hasOwnProperty.call(overrides, 'shouldUseDarkColors');
  const controller = createGlobalCaptureWindowController({
    dirname: DIRNAME,
    BrowserWindowClass: windowFactory.BrowserWindowClass,
    screenApi: screen.screenApi,
    nativeThemeApi: { shouldUseDarkColors: hasTheme ? overrides.shouldUseDarkColors : false },
    onAction: async (event, context) => {
      actionCalls.push({ event, context, abortedWhileRunning: context.signal.aborted });
      return overrides.actionResult ?? { ok: true };
    },
    logDiagnosticEvent: (event) => logs.push(event),
    prepareWindow: overrides.prepareWindow ?? (async () => ({ ok: true })),
    windowSize: overrides.windowSize,
    focusRetryDelayMs: FOCUS_RETRY_MS,
    pendingShowDelayMs: PENDING_SHOW_MS,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  return {
    controller,
    logs,
    timers,
    windowFactory,
    screen,
    actionCalls,
    logTypes: () => logs.map((event) => event.type),
    first: () => windowFactory.instances[0],
    showFirst: () => controller.show({ captureId: 'cap-1', text: 'hello' }, null),
  };
}

function createHeldActionController(handleAction) {
  const logs = [];
  const timers = createTimerDouble();
  const windowFactory = createBrowserWindowClassDouble();
  const screen = createScreenApiDouble();
  const controller = createGlobalCaptureWindowController({
    dirname: DIRNAME,
    BrowserWindowClass: windowFactory.BrowserWindowClass,
    screenApi: screen.screenApi,
    nativeThemeApi: { shouldUseDarkColors: false },
    logDiagnosticEvent: (event) => logs.push(event),
    prepareWindow: async () => ({ ok: true }),
    focusRetryDelayMs: FOCUS_RETRY_MS,
    pendingShowDelayMs: PENDING_SHOW_MS,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
    onAction: handleAction,
  });
  return { controller, logs, windowFactory, timers };
}

test('GLOBAL_CAPTURE_ACTION_IDS exposes the five capture actions and is frozen', () => {
  assert.deepEqual(GLOBAL_CAPTURE_ACTION_IDS, [
    'source-text',
    'ai-text',
    'ai-image',
    'ai-video',
    'preset-draft',
  ]);
  assert.equal(Object.isFrozen(GLOBAL_CAPTURE_ACTION_IDS), true);
});

test('resolveGlobalCaptureWindowBounds falls back to the documented default area and size', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds(), DEFAULT_BOUNDS);
});

test('resolveGlobalCaptureWindowBounds offsets the popup from the cursor', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ cursor: { x: 100, y: 200 } }), {
    x: 114,
    y: 214,
    width: 400,
    height: 52,
  });
});

test('resolveGlobalCaptureWindowBounds flips left and up when the popup would overflow', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ cursor: { x: 1270, y: 710 } }), {
    x: 856,
    y: 644,
    width: 400,
    height: 52,
  });
});

test('resolveGlobalCaptureWindowBounds clamps a negative cursor to the work-area margin', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ cursor: { x: -500, y: -500 } }), {
    x: 12,
    y: 12,
    width: 400,
    height: 52,
  });
});

test('resolveGlobalCaptureWindowBounds clamps a far outside cursor to the far corner', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ cursor: { x: 100000, y: 100000 } }), {
    x: 868,
    y: 656,
    width: 400,
    height: 52,
  });
});

test('resolveGlobalCaptureWindowBounds shrinks the popup to the work area minus margins', () => {
  assert.deepEqual(
    resolveGlobalCaptureWindowBounds({ workArea: { x: 0, y: 0, width: 100, height: 60 } }),
    {
      x: 12,
      y: 12,
      width: 76,
      height: 36,
    },
  );
});

test('resolveGlobalCaptureWindowBounds falls back to the default size for a zero size', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ size: { width: 0, height: 0 } }), DEFAULT_BOUNDS);
});

test('resolveGlobalCaptureWindowBounds treats a non-numeric margin and offset as zero', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ margin: 'abc', offset: 'xyz' }), {
    x: 0,
    y: 0,
    width: 400,
    height: 52,
  });
});

test('resolveGlobalCaptureWindowBounds survives non-object cursor and work area inputs', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ cursor: null, workArea: null }), {
    x: 12,
    y: 12,
    width: 1,
    height: 1,
  });
});

test('resolveGlobalCaptureWindowBounds rounds fractional coordinates', () => {
  assert.deepEqual(resolveGlobalCaptureWindowBounds({ cursor: { x: 164, y: 326 } }), {
    x: 178,
    y: 340,
    width: 400,
    height: 52,
  });
});

test('createGlobalCaptureWindowController exposes the ten documented members', () => {
  const { controller } = createController();
  for (const name of [
    'cancel',
    'chooseAction',
    'destroy',
    'didPresent',
    'hide',
    'isTrustedSender',
    'isVisible',
    'prewarm',
    'setExpanded',
    'show',
  ])
    assert.equal(typeof controller[name], 'function', name);
});

test('show builds a frameless transparent always-on-top window and loads its html', async () => {
  const { first, showFirst } = createController();
  assert.deepEqual(await showFirst(), {
    ok: true,
    captureId: 'cap-1',
    bounds: DEFAULT_BOUNDS,
    phase: 'ready',
  });
  const options = first().record.constructorOptions;
  assert.equal(options.title, '发送到 Canvas 无限画布');
  assert.equal(options.show, false);
  assert.equal(options.frame, false);
  assert.equal(options.thickFrame, false);
  assert.equal(options.roundedCorners, false);
  assert.equal(options.transparent, true);
  assert.equal(options.backgroundColor, '#00000000');
  assert.equal(options.backgroundMaterial, 'none');
  assert.equal(options.hasShadow, false);
  assert.equal(options.paintWhenInitiallyHidden, true);
  assert.equal(options.alwaysOnTop, true);
  assert.equal(options.focusable, true);
  assert.equal(options.skipTaskbar, true);
  assert.equal(options.resizable, false);
  assert.equal(options.movable, false);
  assert.equal(options.minimizable, false);
  assert.equal(options.maximizable, false);
  assert.equal(options.fullscreenable, false);
  assert.equal(options.width, 400);
  assert.equal(options.height, 52);
  assert.deepEqual(options.webPreferences, {
    preload: DIRNAME + '\\' + PRELOAD_FILE,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    backgroundThrottling: false,
  });
  assert.deepEqual(first().record.loads, [DIRNAME + '\\' + HTML_FILE]);
});

test('show honours a custom window size for the native window', async () => {
  const { first, showFirst } = createController({ windowSize: { width: 320, height: 40 } });
  const result = await showFirst();
  assert.equal(first().record.constructorOptions.width, 320);
  assert.equal(first().record.constructorOptions.height, 40);
  assert.equal(result.bounds.width, 320);
  assert.equal(result.bounds.height, 40);
});

test('show reuses a live window instead of constructing a second one', async () => {
  const { controller, windowFactory, showFirst } = createController();
  await controller.prewarm();
  await showFirst();
  assert.equal(windowFactory.instances.length, 1);
});

test('show logs that native transitions were disabled before presentation', async () => {
  const { logTypes, showFirst } = createController();
  await showFirst();
  assert.deepEqual(logTypes(), ['global_capture.window_transitions_disabled']);
});

test('show skips the transitions log when the preparation was skipped', async () => {
  const { logTypes, showFirst } = createController({
    prepareWindow: async () => ({ ok: true, skipped: true }),
  });
  await showFirst();
  assert.deepEqual(logTypes(), []);
});

test('show logs a warning when the native transition preparation reports failure', async () => {
  const { logs, showFirst } = createController({
    prepareWindow: async () => ({ ok: false, reason: 'nope' }),
  });
  assert.equal((await showFirst()).ok, true);
  assert.deepEqual(
    logs.map((event) => [event.type, event.level]),
    [['global_capture.window_transitions_unavailable', 'warn']],
  );
  assert.equal(logs[0].error.message, 'nope');
});

test('show logs a warning when the native transition preparation rejects', async () => {
  const { logs, showFirst } = createController({
    prepareWindow: async () => {
      throw new Error('boom');
    },
  });
  assert.equal((await showFirst()).ok, true);
  assert.equal(logs[0].type, 'global_capture.window_transitions_unavailable');
  assert.equal(logs[0].error.message, 'boom');
});

test('show rejects a capture without an id', async () => {
  const { controller, windowFactory } = createController();
  assert.deepEqual(await controller.show({ text: 'hello' }, null), { ok: false, reason: 'invalid-capture' });
  assert.equal(windowFactory.instances.length, 0);
});

test('show rejects a capture with an unknown phase and no text', async () => {
  const { controller, windowFactory } = createController();
  assert.deepEqual(await controller.show({ captureId: 'cap-1', phase: 'bogus' }, null), {
    ok: false,
    reason: 'invalid-capture',
  });
  assert.equal(windowFactory.instances.length, 0);
});

test('show rejects a ready capture without text', async () => {
  const { controller, windowFactory } = createController();
  assert.deepEqual(await controller.show({ captureId: 'cap-1', text: '', phase: 'ready' }, null), {
    ok: false,
    reason: 'invalid-capture',
  });
  assert.equal(windowFactory.instances.length, 0);
});

test('show accepts a capturing capture without text', async () => {
  const { controller } = createController();
  assert.deepEqual(await controller.show({ captureId: 'cap-1', phase: 'capturing' }, null), {
    ok: true,
    captureId: 'cap-1',
    bounds: DEFAULT_BOUNDS,
    phase: 'capturing',
  });
});

test('show derives the ready phase from the text when no phase is supplied', async () => {
  const { controller } = createController();
  assert.equal((await controller.show({ captureId: 'cap-1', text: 'hello' }, null)).phase, 'ready');
});

test('show sends the presentation payload on the window channel', async () => {
  const { first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(first().record.sent, [
    {
      channel: 'globalCaptureWindow:present',
      payload: {
        captureId: 'cap-1',
        presentationId: 1,
        text: 'hello',
        phase: 'ready',
        errorReason: '',
        shortcutLabel: 'Control+Alt+Shift+C',
        theme: 'light',
        runImmediately: false,
        activeActionId: 'source-text',
      },
    },
  ]);
});

test('show numbers each presentation in sequence', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  await controller.show({ captureId: 'cap-2', text: 'hello' }, null);
  assert.deepEqual(
    first().record.sent.map((entry) => entry.payload.presentationId),
    [1, 2],
  );
});

test('show defaults the shortcut label when the payload label is blank', async () => {
  const { controller, first } = createController();
  await controller.show({ captureId: 'cap-1', text: 'hi', shortcutLabel: '   ' }, null);
  assert.equal(first().record.sent[0].payload.shortcutLabel, 'Control+Alt+Shift+C');
});

test('show trims a supplied shortcut label and error reason', async () => {
  const { controller, first } = createController();
  await controller.show(
    { captureId: 'cap-1', text: 'hi', shortcutLabel: '  Alt+X ', errorReason: '  blocked  ' },
    null,
  );
  const payload = first().record.sent[0].payload;
  assert.equal(payload.shortcutLabel, 'Alt+X');
  assert.equal(payload.errorReason, 'blocked');
});

test('show maps an explicit light shell theme to the light payload theme', async () => {
  const { first, showFirst } = createController({ shouldUseDarkColors: false });
  await showFirst();
  assert.equal(first().record.sent[0].payload.theme, 'light');
});

test('show reports a dark theme for a dark shell', async () => {
  const { first, showFirst } = createController({ shouldUseDarkColors: true });
  await showFirst();
  assert.equal(first().record.sent[0].payload.theme, 'dark');
});

test('show reports a dark theme when the shell theme is unknown', async () => {
  const { first, showFirst } = createController({ shouldUseDarkColors: undefined });
  await showFirst();
  assert.equal(first().record.sent[0].payload.theme, 'dark');
});

test('show anchors a fresh presentation to the cursor display', async () => {
  const { first, showFirst, screen } = createController({ screen: { cursor: { x: 200, y: 300 } } });
  await showFirst();
  assert.deepEqual(first().record.bounds, { x: 214, y: 314, width: 400, height: 52 });
  assert.deepEqual(first().record.alwaysOnTop, { flag: true, level: 'pop-up-menu' });
  assert.deepEqual(first().record.visibleOnAllWorkspaces, {
    flag: true,
    extra: { visibleOnFullScreen: true },
  });
  assert.deepEqual(screen.calls.displayPoints, [{ x: 200, y: 300 }]);
  assert.equal(screen.calls.cursorPoints, 1);
});

test('show keeps the existing anchor for a reused presentation', async () => {
  const { controller, first } = createController();
  await controller.show({ captureId: 'cap-1', text: 'one' }, null);
  const anchor = first().record.bounds;
  await controller.show({ captureId: 'cap-1', text: 'two' }, null);
  assert.equal(first().record.bounds, anchor);
  assert.equal(first().record.sent[1].payload.text, 'two');
});

test('show reports capture-cancelled after the same capture was cancelled', async () => {
  const { controller, first } = createController();
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  assert.deepEqual(controller.cancel({ captureId: 'cap-1' }, first().sender), { ok: true });
  assert.deepEqual(await controller.show({ captureId: 'cap-1', text: 'hello' }, null), {
    ok: false,
    reason: 'capture-cancelled',
  });
});

test('show accepts a different capture after a cancel', async () => {
  const { controller, first } = createController();
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  controller.cancel({ captureId: 'cap-1' }, first().sender);
  const result = await controller.show({ captureId: 'cap-2', text: 'hello' }, null);
  assert.equal(result.ok, true);
  assert.equal(result.captureId, 'cap-2');
});

test('show reports window-unavailable when the window is already destroyed', async () => {
  const { controller, first } = createController({ windowOptions: { destroyed: true } });
  assert.deepEqual(await controller.show({ captureId: 'cap-1', text: 'hello' }, null), {
    ok: false,
    reason: 'window-unavailable',
  });
  assert.equal(first().record.sent.length, 0);
});

test('show reports capture-controller-destroyed after destroy', async () => {
  const { controller, showFirst } = createController();
  await showFirst();
  controller.destroy();
  assert.deepEqual(await controller.show({ captureId: 'cap-2', text: 'hello' }, null), {
    ok: false,
    reason: 'capture-controller-destroyed',
  });
});

test('show reports window-show-failed and logs when the window html cannot load', async () => {
  const { logs, showFirst } = createController({ windowOptions: { loadFileError: new Error('missing') } });
  assert.deepEqual(await showFirst(), { ok: false, reason: 'window-show-failed' });
  const failure = logs.find((event) => event.type === 'global_capture.window_show_failed');
  assert.equal(failure.level, 'error');
  assert.equal(failure.error.message, 'missing');
});

test('show clears the pending presentation when the window html cannot load', async () => {
  const { controller, first, showFirst } = createController({
    windowOptions: { loadFileError: new Error('missing') },
  });
  await showFirst();
  assert.deepEqual(controller.cancel({ captureId: 'cap-1' }, first().sender), {
    ok: false,
    reason: 'stale-capture',
  });
});

test('show re-enables background throttling for a fresh presentation', async () => {
  const { first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(first().record.throttling, [false]);
});

test('prewarm returns the shared window ready promise', async () => {
  const { controller, windowFactory } = createController();
  const first = controller.prewarm();
  const second = controller.prewarm();
  assert.equal(first, second);
  await first;
  assert.equal(windowFactory.instances.length, 1);
});

test('prewarm logs a warning and resolves when the prewarm fails', async () => {
  const { controller, logs } = createController({ windowOptions: { loadFileError: new Error('missing') } });
  await controller.prewarm();
  const failure = logs.find((event) => event.type === 'global_capture.window_prewarm_failed');
  assert.equal(failure.level, 'warn');
  assert.equal(failure.error.message, 'missing');
});

test('didPresent rejects an untrusted sender', async () => {
  const { controller, showFirst } = createController();
  await showFirst();
  assert.deepEqual(await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, null), {
    ok: false,
    reason: 'untrusted-sender',
  });
});

test('didPresent rejects when no presentation is active', async () => {
  const { controller, first } = createController();
  await controller.prewarm();
  assert.deepEqual(await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender), {
    ok: false,
    reason: 'stale-presentation',
  });
});

test('didPresent rejects the wrong capture id', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(await controller.didPresent({ captureId: 'other', presentationId: 1 }, first().sender), {
    ok: false,
    reason: 'stale-presentation',
  });
});

test('didPresent rejects a stale presentation id', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(await controller.didPresent({ captureId: 'cap-1', presentationId: 2 }, first().sender), {
    ok: false,
    reason: 'stale-presentation',
  });
});

test('didPresent captures a frame while the window is still hidden', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender), {
    ok: true,
  });
  assert.deepEqual(first().record.capturePageCalls, [[undefined, { stayHidden: true, stayAwake: true }]]);
});

test('didPresent skips the frame capture once the window is visible', async () => {
  const { controller, first, showFirst } = createController({ windowOptions: { visible: true } });
  await showFirst();
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  assert.equal(first().record.capturePageCalls.length, 0);
});

test('didPresent reveals a ready window, focuses it and schedules a focus retry', async () => {
  const { controller, first, timers, showFirst } = createController();
  await showFirst();
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  assert.equal(first().record.showCount, 1);
  assert.equal(first().record.showInactiveCount, 0);
  assert.equal(first().record.focusCount, 1);
  assert.deepEqual(
    timers.active().map((timer) => timer.ms),
    [FOCUS_RETRY_MS],
  );
});

test('didPresent holds a capturing window back for the pending show delay', async () => {
  const { controller, first, timers } = createController();
  await controller.show({ captureId: 'cap-1', phase: 'capturing' }, null);
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  assert.equal(first().record.showCount, 0);
  assert.equal(first().record.showInactiveCount, 0);
  assert.deepEqual(
    timers.active().map((timer) => timer.ms),
    [PENDING_SHOW_MS],
  );
  timers.fire(timers.active()[0].id);
  assert.equal(first().record.showInactiveCount, 1);
  assert.equal(first().record.showCount, 0);
  assert.equal(first().record.focusCount, 0);
});

test('didPresent drops a held-back reveal when the presentation went away first', async () => {
  const { controller, first, timers } = createController();
  await controller.show({ captureId: 'cap-1', phase: 'capturing' }, null);
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  const held = timers.active()[0];
  controller.cancel({ captureId: 'cap-1' }, first().sender);
  timers.fire(held.id);
  assert.equal(first().record.showInactiveCount, 0);
});

test('didPresent hides and reports an empty frame', async () => {
  const { controller, first, logs, showFirst } = createController({
    windowOptions: { capturePageResult: { isEmpty: () => true } },
  });
  await showFirst();
  assert.deepEqual(await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender), {
    ok: false,
    reason: 'window-frame-failed',
  });
  assert.equal(first().record.hideCount, 1);
  const failure = logs.find((event) => event.type === 'global_capture.window_frame_failed');
  assert.equal(failure.error.message, 'empty-capture-frame');
});

test('didPresent hides and reports a rejected frame capture', async () => {
  const { controller, first, logs, showFirst } = createController({
    windowOptions: {
      capturePageImpl: async () => {
        throw new Error('capture exploded');
      },
    },
  });
  await showFirst();
  assert.deepEqual(await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender), {
    ok: false,
    reason: 'window-frame-failed',
  });
  assert.equal(first().record.hideCount, 1);
  assert.equal(
    logs.find((event) => event.type === 'global_capture.window_frame_failed').error.message,
    'capture exploded',
  );
});

test('didPresent memoizes the first presentation of the same capture', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  const shown = first().record.showCount;
  assert.deepEqual(await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender), {
    ok: true,
  });
  assert.equal(first().record.capturePageCalls.length, 1);
  assert.equal(first().record.showCount, shown);
});

test('didPresent reports a stale presentation when the capture changed mid frame', async () => {
  const deferred = createDeferred();
  const { controller, first } = createController({
    windowOptions: { capturePageImpl: () => deferred.promise },
  });
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  const pending = controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  await controller.show({ captureId: 'cap-2', text: 'other' }, null);
  deferred.resolve({ isEmpty: () => false });
  assert.deepEqual(await pending, { ok: false, reason: 'stale-presentation' });
  assert.equal(first().record.showCount, 0);
});

test('didPresent retries the focus when the first attempt did not take', async () => {
  const { controller, first, timers, showFirst } = createController({
    windowOptions: { focusEffective: false },
  });
  await showFirst();
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  assert.equal(first().record.focusCount, 1);
  timers.fire(timers.active()[0].id);
  assert.equal(first().record.focusCount, 2);
});

test('didPresent skips the focus retry when the window is already focused', async () => {
  const { controller, first, timers, showFirst } = createController();
  await showFirst();
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  timers.fire(timers.active()[0].id);
  assert.equal(first().record.focusCount, 1);
});

test('setExpanded rejects an untrusted sender', async () => {
  const { controller, showFirst } = createController();
  await showFirst();
  assert.deepEqual(controller.setExpanded({ captureId: 'cap-1', expanded: true }, null), {
    ok: false,
    reason: 'untrusted-sender',
  });
});

test('setExpanded rejects a stale capture', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(controller.setExpanded({ captureId: 'other', expanded: true }, first().sender), {
    ok: false,
    reason: 'stale-capture',
  });
});

test('setExpanded rejects while the capture is not ready', async () => {
  const { controller, first } = createController();
  await controller.show({ captureId: 'cap-1', phase: 'capturing' }, null);
  assert.deepEqual(controller.setExpanded({ captureId: 'cap-1', expanded: true }, first().sender), {
    ok: false,
    reason: 'capture-not-ready',
  });
});

test('setExpanded rejects while an action is in flight', async () => {
  const deferred = createDeferred();
  const { controller, windowFactory } = createHeldActionController(async () => deferred.promise);
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  const sender = windowFactory.instances[0].sender;
  const pending = controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, sender);
  assert.deepEqual(controller.setExpanded({ captureId: 'cap-1', expanded: true }, sender), {
    ok: false,
    reason: 'capture-not-ready',
  });
  deferred.resolve({ ok: true });
  await pending;
});

test('setExpanded grows the window downwards when there is room', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  const result = controller.setExpanded({ captureId: 'cap-1', expanded: true }, first().sender);
  assert.deepEqual(result, {
    ok: true,
    expanded: true,
    opensUp: false,
    bounds: { x: 14, y: 14, width: 400, height: 260 },
  });
  assert.deepEqual(first().record.bounds, result.bounds);
});

test('setExpanded grows upwards when the popup would fall off the bottom', async () => {
  const { controller, first } = createController({ screen: { cursor: { x: 100, y: 672 } } });
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  assert.equal(first().record.bounds.y, 606);
  const result = controller.setExpanded({ captureId: 'cap-1', expanded: true }, first().sender);
  assert.deepEqual(result, {
    ok: true,
    expanded: true,
    opensUp: true,
    bounds: { x: 114, y: 398, width: 400, height: 260 },
  });
});

test('setExpanded clamps the expanded height to the work area', async () => {
  const { controller, first, showFirst } = createController({
    screen: { workArea: { x: 0, y: 0, width: 1280, height: 100 } },
  });
  await showFirst();
  const result = controller.setExpanded({ captureId: 'cap-1', expanded: true }, first().sender);
  assert.equal(result.bounds.height, 76);
});

test('setExpanded collapses back to the base height', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  controller.setExpanded({ captureId: 'cap-1', expanded: true }, first().sender);
  assert.deepEqual(controller.setExpanded({ captureId: 'cap-1', expanded: false }, first().sender), {
    ok: true,
    expanded: false,
    opensUp: false,
    bounds: DEFAULT_BOUNDS,
  });
});

test('chooseAction rejects an untrusted sender', async () => {
  const { controller, showFirst } = createController();
  await showFirst();
  assert.deepEqual(await controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, null), {
    ok: false,
    reason: 'untrusted-sender',
  });
});

test('chooseAction rejects an unknown action id', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(await controller.chooseAction({ actionId: 'nope', captureId: 'cap-1' }, first().sender), {
    ok: false,
    reason: 'invalid-action',
  });
});

test('chooseAction rejects a stale capture', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(
    await controller.chooseAction({ actionId: 'ai-text', captureId: 'other' }, first().sender),
    {
      ok: false,
      reason: 'stale-capture',
    },
  );
});

test('chooseAction rejects while another action is in flight', async () => {
  const deferred = createDeferred();
  const { controller, windowFactory } = createHeldActionController(async () => deferred.promise);
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  const sender = windowFactory.instances[0].sender;
  const pending = controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, sender);
  assert.deepEqual(await controller.chooseAction({ actionId: 'ai-image', captureId: 'cap-1' }, sender), {
    ok: false,
    reason: 'action-in-flight',
  });
  deferred.resolve({ ok: true });
  await pending;
});

test('chooseAction rejects a capturing capture that has no text yet', async () => {
  const { controller, first } = createController();
  await controller.show({ captureId: 'cap-1', phase: 'capturing' }, null);
  assert.deepEqual(
    await controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, first().sender),
    {
      ok: false,
      reason: 'capture-not-ready',
    },
  );
});

test('chooseAction hides the window when the action succeeds', async () => {
  const { controller, first, showFirst, actionCalls } = createController();
  await showFirst();
  assert.deepEqual(
    await controller.chooseAction({ actionId: 'ai-image', captureId: 'cap-1' }, first().sender),
    {
      ok: true,
    },
  );
  assert.equal(first().record.hideCount, 1);
  assert.equal(actionCalls[0].event.eventId, 'global-capture-cap-1-1');
  assert.equal(actionCalls[0].event.actionId, 'ai-image');
  assert.equal(actionCalls[0].event.text, 'hello');
  assert.equal(actionCalls[0].event.runImmediately, false);
  assert.equal(actionCalls[0].event.source, 'globalCaptureWindow');
  assert.equal(typeof actionCalls[0].event.createdAt, 'number');
  assert.equal(actionCalls[0].abortedWhileRunning, false);
  assert.equal(actionCalls[0].context.signal.aborted, true);
});

test('chooseAction keeps the window visible and refocuses when the action fails', async () => {
  const { controller, first, showFirst } = createController({ actionResult: { ok: false, reason: 'busy' } });
  await showFirst();
  assert.deepEqual(
    await controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, first().sender),
    {
      ok: false,
      reason: 'busy',
    },
  );
  assert.equal(first().record.hideCount, 0);
  assert.equal(first().record.showCount, 1);
  assert.equal(first().record.focusCount, 1);
});

test('chooseAction normalizes a non-object dispatch result', async () => {
  const { controller, windowFactory } = createHeldActionController(async () => null);
  assert.equal((await controller.show({ captureId: 'cap-1', text: 'hello' }, null)).ok, true);
  const sender = windowFactory.instances[0].sender;
  assert.deepEqual(await controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, sender), {
    ok: false,
    reason: 'dispatch-failed',
  });
});

test('chooseAction logs and reports a dispatch failure when the action throws', async () => {
  const { controller, logs, windowFactory } = createHeldActionController(async () => {
    throw new Error('service down');
  });
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  const sender = windowFactory.instances[0].sender;
  assert.deepEqual(await controller.chooseAction({ actionId: 'ai-video', captureId: 'cap-1' }, sender), {
    ok: false,
    reason: 'dispatch-failed',
  });
  const failure = logs.find((event) => event.type === 'global_capture.action_dispatch_failed');
  assert.equal(failure.level, 'error');
  assert.equal(failure.error.message, 'service down');
  assert.deepEqual(failure.context, { actionId: 'ai-video' });
});

test('chooseAction aborts an in-flight dispatch when the controller is destroyed', async () => {
  const { controller, logs, windowFactory } = createHeldActionController(
    (event, context) =>
      new Promise((resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  const sender = windowFactory.instances[0].sender;
  const pending = controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, sender);
  controller.destroy();
  assert.deepEqual(await pending, { ok: false, reason: 'dispatch-failed' });
  assert.equal(
    logs.some((event) => event.type === 'global_capture.action_dispatch_failed'),
    true,
  );
});

test('chooseAction remembers the run immediately preference for AI actions', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  await controller.chooseAction(
    { actionId: 'ai-text', captureId: 'cap-1', runImmediately: true },
    first().sender,
  );
  await controller.show({ captureId: 'cap-2', text: 'hello' }, null);
  assert.equal(first().record.sent[1].payload.runImmediately, true);
  assert.equal(first().record.sent[1].payload.activeActionId, 'ai-text');
});

test('chooseAction keeps the stored preference when the payload opts out of remembering', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  await controller.chooseAction(
    { actionId: 'ai-text', captureId: 'cap-1', runImmediately: true },
    first().sender,
  );
  await controller.show({ captureId: 'cap-2', text: 'hello' }, null);
  await controller.chooseAction(
    { actionId: 'ai-text', captureId: 'cap-2', runImmediately: false, rememberRunImmediately: false },
    first().sender,
  );
  await controller.show({ captureId: 'cap-3', text: 'hello' }, null);
  assert.equal(first().record.sent[2].payload.runImmediately, true);
});

test('chooseAction never runs a non-AI action immediately', async () => {
  const { controller, first, showFirst, actionCalls } = createController();
  await showFirst();
  await controller.chooseAction(
    { actionId: 'source-text', captureId: 'cap-1', runImmediately: true },
    first().sender,
  );
  assert.equal(actionCalls[0].event.runImmediately, false);
  await controller.show({ captureId: 'cap-2', text: 'hello' }, null);
  assert.equal(first().record.sent[1].payload.runImmediately, false);
});

test('chooseAction numbers each dispatch event in sequence', async () => {
  const { controller, first, showFirst, actionCalls } = createController();
  await showFirst();
  await controller.chooseAction({ actionId: 'source-text', captureId: 'cap-1' }, first().sender);
  await controller.show({ captureId: 'cap-2', text: 'hello' }, null);
  await controller.chooseAction({ actionId: 'preset-draft', captureId: 'cap-2' }, first().sender);
  assert.deepEqual(
    actionCalls.map((call) => call.event.eventId),
    ['global-capture-cap-1-1', 'global-capture-cap-2-2'],
  );
});

test('cancel rejects an untrusted sender', async () => {
  const { controller, showFirst } = createController();
  await showFirst();
  assert.deepEqual(controller.cancel({ captureId: 'cap-1' }, null), {
    ok: false,
    reason: 'untrusted-sender',
  });
});

test('cancel rejects a capture id that does not match the live presentation', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  assert.deepEqual(controller.cancel({ captureId: 'other' }, first().sender), {
    ok: false,
    reason: 'stale-capture',
  });
});

test('cancel hides the window and clears the presentation', async () => {
  const { controller, first, timers, showFirst } = createController();
  await showFirst();
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  assert.deepEqual(controller.cancel({ captureId: 'cap-1' }, first().sender), { ok: true });
  assert.equal(first().record.hideCount, 1);
  assert.deepEqual(first().record.throttling, [false, true]);
  assert.deepEqual(timers.active(), []);
});

test('destroy tears the window down once and makes later shows fail', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  controller.destroy();
  controller.destroy();
  assert.equal(first().record.destroyCount, 1);
  assert.deepEqual(await controller.show({ captureId: 'cap-2', text: 'hello' }, null), {
    ok: false,
    reason: 'capture-controller-destroyed',
  });
});

test('destroy on a controller that never opened a window is a no-op', () => {
  const { controller, windowFactory } = createController();
  controller.destroy();
  assert.equal(windowFactory.instances.length, 0);
});

test('isTrustedSender only accepts the capture window contents', async () => {
  const { controller, first, showFirst } = createController();
  assert.equal(controller.isTrustedSender({}), false);
  await showFirst();
  assert.equal(controller.isTrustedSender(first().sender), true);
  assert.equal(controller.isTrustedSender({}), false);
});

test('isVisible reflects the window visibility', async () => {
  const { controller, first, showFirst } = createController();
  assert.equal(controller.isVisible(), false);
  await showFirst();
  assert.equal(controller.isVisible(), false);
  await controller.didPresent({ captureId: 'cap-1', presentationId: 1 }, first().sender);
  assert.equal(controller.isVisible(), true);
});

test('a closed window resets the controller and is rebuilt on the next show', async () => {
  const { controller, first, windowFactory, showFirst } = createController();
  await showFirst();
  first().emit('closed');
  assert.equal(controller.isTrustedSender(first().sender), false);
  assert.equal(controller.isVisible(), false);
  assert.equal((await controller.show({ captureId: 'cap-2', text: 'hello' }, null)).ok, true);
  assert.equal(windowFactory.instances.length, 2);
});

test('blur is ignored until the popup has been focused', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  first().emit('blur');
  assert.equal(first().record.hideCount, 0);
});

test('blur hides the popup once the user focused it', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  first().emit('focus');
  first().emit('blur');
  assert.equal(first().record.hideCount, 1);
});

test('blur is ignored while an action is still in flight', async () => {
  const deferred = createDeferred();
  const { controller, windowFactory } = createHeldActionController(async () => deferred.promise);
  await controller.show({ captureId: 'cap-1', text: 'hello' }, null);
  const instance = windowFactory.instances[0];
  instance.emit('focus');
  const pending = controller.chooseAction({ actionId: 'ai-text', captureId: 'cap-1' }, instance.sender);
  instance.emit('blur');
  assert.equal(instance.record.hideCount, 0);
  deferred.resolve({ ok: true });
  await pending;
  assert.equal(instance.record.hideCount, 1);
});

test('a focus event alone does not reveal the window', async () => {
  const { controller, first, showFirst } = createController();
  await showFirst();
  first().emit('focus');
  assert.equal(first().record.showCount, 0);
  assert.equal(first().record.visible, false);
});
