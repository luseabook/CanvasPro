import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createChromeShellWebPreviewManager,
  __chromeShellWebPreviewManagerForTest,
} from './chromeShellWebPreviewManager.js';

const { normalizeHttpUrl, normalizeInputModifiers, normalizeMouseButton, normalizeViewport, toEntryKey } =
  __chromeShellWebPreviewManagerForTest;

const MAX_EVENT_QUEUE_SIZE = 160;
const SCREENCAST_QUALITY = 58;
const SCREENCAST_MIN_FRAME_INTERVAL_MS = 24;
const SNAPSHOT_QUALITY = 72;
const MIN_VIEWPORT_WIDTH = 320;
const MIN_VIEWPORT_HEIGHT = 180;
const MAX_VIEWPORT_WIDTH = 1920;
const MAX_VIEWPORT_HEIGHT = 1200;
const EVENT_WAIT_MIN_MS = 50;
const EVENT_WAIT_MAX_MS = 5000;

const TARGET_ID = 'target-1';
const SESSION_ID = 'session-1';
const WEB_URL = 'https://example.com/';

function createClientDouble(plan = {}) {
  const calls = [];
  const listeners = [];
  const send = (method, params, sessionId) => {
    calls.push({ method: method, params: params, sessionId: sessionId });
    const step = plan[method];
    const result = typeof step === 'function' ? step(params, sessionId, calls.length) : step;
    if (result instanceof Error) return Promise.reject(result);
    return Promise.resolve(result === undefined ? {} : result);
  };
  let unsubscribed = 0;
  let closed = 0;
  const onEvent = (listener) => {
    listeners.push(listener);
    return () => {
      unsubscribed += 1;
    };
  };
  const close = () => {
    closed += 1;
  };
  return {
    send: send,
    onEvent: onEvent,
    close: close,
    calls: calls,
    emit(message) {
      for (const listener of listeners) listener(message);
    },
    methods() {
      return calls.map((call) => call.method);
    },
    callFor(method) {
      return calls.filter((call) => call.method === method);
    },
    get unsubscribed() {
      return unsubscribed;
    },
    get closed() {
      return closed;
    },
  };
}

function createTimerDouble() {
  let nextId = 1;
  const timers = new Map();
  const setTimeoutFn = (fn, ms) => {
    const id = nextId;
    nextId += 1;
    timers.set(id, { fn: fn, ms: ms });
    return id;
  };
  const clearTimeoutFn = (id) => {
    timers.delete(id);
  };
  return {
    setTimeoutFn: setTimeoutFn,
    clearTimeoutFn: clearTimeoutFn,
    get size() {
      return timers.size;
    },
    pendingMs() {
      return [...timers.values()].map((timer) => timer.ms);
    },
    fire(id) {
      const timer = timers.get(id);
      if (!timer) return false;
      timers.delete(id);
      timer.fn();
      return true;
    },
    fireAll() {
      for (const id of [...timers.keys()]) this.fire(id);
    },
  };
}

function createLogDouble() {
  const events = [];
  const logEvent = (event) => events.push(event);
  logEvent.events = events;
  return logEvent;
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function basePlan(overrides = {}) {
  return {
    'Target.createTarget': { targetId: TARGET_ID },
    'Target.attachToTarget': { sessionId: SESSION_ID },
    'Page.getNavigationHistory': { entries: [{ id: 1 }], currentIndex: 0 },
    ...overrides,
  };
}

function createManager({ plan = basePlan(), log = null, clock = { value: 0 } } = {}) {
  const client = createClientDouble(plan);
  const timers = createTimerDouble();
  const manager = createChromeShellWebPreviewManager({
    client: client,
    logEvent: log,
    now: () => clock.value,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  return { client: client, timers: timers, manager: manager, clock: clock };
}

function view(overrides = {}) {
  return { nodeId: 'n1', tabId: 't1', webUrl: WEB_URL, ...overrides };
}

test('createChromeShellWebPreviewManager rejects a missing or unusable CDP client', () => {
  assert.throws(() => createChromeShellWebPreviewManager(), {
    name: 'TypeError',
    message: 'Chrome CDP client is required',
  });
  assert.throws(() => createChromeShellWebPreviewManager({ client: {} }), {
    name: 'TypeError',
    message: 'Chrome CDP client is required',
  });
  assert.throws(() => createChromeShellWebPreviewManager({ client: { send: 1 } }), {
    name: 'TypeError',
    message: 'Chrome CDP client is required',
  });
});

test('normalizeHttpUrl keeps only absolute http and https urls', () => {
  assert.equal(normalizeHttpUrl('https://example.com/a?b=1#c'), 'https://example.com/a?b=1#c');
  assert.equal(normalizeHttpUrl('http://example.com'), 'http://example.com/');
  assert.equal(normalizeHttpUrl('   https://example.com  '), 'https://example.com/');
  assert.equal(normalizeHttpUrl('about:blank'), '');
  assert.equal(normalizeHttpUrl('file:///tmp/x.html'), '');
  assert.equal(normalizeHttpUrl('javascript:alert(1)'), '');
  assert.equal(normalizeHttpUrl('data:text/html,hi'), '');
  assert.equal(normalizeHttpUrl('not a url'), '');
  assert.equal(normalizeHttpUrl(''), '');
  assert.equal(normalizeHttpUrl(null), '');
});

test('toEntryKey joins the normalized node and tab ids with a NUL byte', () => {
  assert.equal(toEntryKey(' n1 ', ' t1 '), 'n1\x00t1');
  assert.equal(toEntryKey('n1'), 'n1\x00default');
  assert.equal(toEntryKey('', ''), '\x00default');
});

test('normalizeInputModifiers folds the four modifier flags into a bitmask', () => {
  assert.equal(normalizeInputModifiers(), 0);
  assert.equal(normalizeInputModifiers({ altKey: true }), 1);
  assert.equal(normalizeInputModifiers({ ctrlKey: true }), 2);
  assert.equal(normalizeInputModifiers({ metaKey: true }), 4);
  assert.equal(normalizeInputModifiers({ shiftKey: true }), 8);
  assert.equal(normalizeInputModifiers({ altKey: true, ctrlKey: true, metaKey: true, shiftKey: true }), 15);
});

test('normalizeMouseButton maps both numeric and named buttons', () => {
  assert.equal(normalizeMouseButton(0), 'left');
  assert.equal(normalizeMouseButton(1), 'middle');
  assert.equal(normalizeMouseButton(2), 'right');
  assert.equal(normalizeMouseButton(3), 'back');
  assert.equal(normalizeMouseButton(4), 'forward');
  assert.equal(normalizeMouseButton('left'), 'left');
  assert.equal(normalizeMouseButton('forward'), 'forward');
  assert.equal(normalizeMouseButton('MIDDLE'), 'none');
  assert.equal(normalizeMouseButton(5), 'none');
  assert.equal(normalizeMouseButton(null), 'none');
});

test('normalizeViewport falls back to the default surface when nothing is provided', () => {
  assert.deepEqual(normalizeViewport(), {
    width: 960,
    height: 600,
    visualWidth: 960,
    visualHeight: 600,
    zoomFactor: 1,
  });
});

test('normalizeViewport enforces its minimum viewport bounds', () => {
  const viewport = normalizeViewport({ bounds: { width: 100, height: 100 } });
  assert.equal(viewport.visualWidth, 100);
  assert.equal(viewport.visualHeight, 100);
  assert.equal(viewport.width, MIN_VIEWPORT_WIDTH);
  assert.equal(viewport.height, MIN_VIEWPORT_HEIGHT);
});

test('normalizeViewport enforces its maximum viewport bounds', () => {
  const viewport = normalizeViewport({ bounds: { width: 10000, height: 10000 } });
  assert.equal(viewport.visualWidth, MAX_VIEWPORT_WIDTH);
  assert.equal(viewport.visualHeight, MAX_VIEWPORT_HEIGHT);
  assert.equal(viewport.width, MAX_VIEWPORT_WIDTH);
  assert.equal(viewport.height, MAX_VIEWPORT_HEIGHT);
});

test('normalizeViewport divides the visual bounds by the zoom factor', () => {
  const viewport = normalizeViewport({ zoomFactor: 2, bounds: { width: 1000, height: 800 } });
  assert.equal(viewport.zoomFactor, 2);
  assert.equal(viewport.visualWidth, 1000);
  assert.equal(viewport.visualHeight, 800);
  assert.equal(viewport.width, 500);
  assert.equal(viewport.height, 400);
});

test('normalizeViewport clamps the zoom factor to its 0.05 floor', () => {
  assert.equal(normalizeViewport({ zoomFactor: 0 }).zoomFactor, 1);
  const zoomedOut = normalizeViewport({ zoomFactor: -5 });
  assert.equal(zoomedOut.zoomFactor, 0.05);
  assert.equal(zoomedOut.width, MAX_VIEWPORT_WIDTH);
  assert.equal(zoomedOut.height, MAX_VIEWPORT_HEIGHT);
});

test('normalizeViewport falls back on non numeric bounds but honours a numeric zero', () => {
  const viewport = normalizeViewport({ bounds: { width: 'abc', height: null } });
  assert.equal(viewport.visualWidth, 960);
  assert.equal(viewport.visualHeight, 1);
  assert.equal(viewport.height, MIN_VIEWPORT_HEIGHT);
});

test('syncViews creates a target, enables the domains and navigates to the web url', async () => {
  const { client, manager } = createManager();
  const result = await manager.syncViews({ views: [view()] });
  assert.deepEqual(result, { ok: true, count: 1, visibleCount: 0 });
  assert.deepEqual(client.methods(), [
    'Target.createTarget',
    'Target.attachToTarget',
    'Page.enable',
    'Runtime.enable',
    'Emulation.setDeviceMetricsOverride',
    'Page.navigate',
  ]);
  assert.deepEqual(client.calls[0].params, { url: 'about:blank', background: true, focus: false });
  assert.deepEqual(client.calls[1].params, { targetId: TARGET_ID, flatten: true });
  assert.deepEqual(client.calls[4].params, {
    width: 960,
    height: 600,
    deviceScaleFactor: 1,
    mobile: false,
  });
  assert.equal(client.calls[4].sessionId, SESSION_ID);
  assert.deepEqual(client.calls[5].params, { url: WEB_URL });
  const entry = manager._getEntry('n1', 't1');
  assert.equal(entry.ready, true);
  assert.equal(entry.sessionId, SESSION_ID);
  assert.equal(entry.targetId, TARGET_ID);
  assert.equal(entry.url, WEB_URL);
  assert.equal(entry.requestedUrl, WEB_URL);
  assert.equal(entry.viewportWidth, 960);
  assert.equal(entry.viewportHeight, 600);
});

test('syncViews publishes a loading event that consumeEvents drains exactly once', async () => {
  const { manager } = createManager();
  await manager.syncViews({ views: [view()] });
  const events = manager.consumeEvents();
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], {
    nodeId: 'n1',
    tabId: 't1',
    type: 'loading',
    url: WEB_URL,
    holdSnapshot: false,
    sequence: 1,
    createdAt: 0,
  });
  assert.deepEqual(manager.consumeEvents(), []);
});

test('syncViews skips views without a node id or without an http url', async () => {
  const { client, manager } = createManager();
  const result = await manager.syncViews({
    views: [
      { tabId: 't1', webUrl: WEB_URL },
      { nodeId: 'n2', tabId: 't1', webUrl: 'about:blank' },
      { nodeId: '  ', webUrl: WEB_URL },
      null,
    ],
  });
  assert.deepEqual(result, { ok: true, count: 0, visibleCount: 0 });
  assert.deepEqual(client.methods(), []);
});

test('syncViews counts only visible entries', async () => {
  const { manager } = createManager();
  const result = await manager.syncViews({
    views: [view({ visible: true }), view({ nodeId: 'n2', visible: false })],
  });
  assert.deepEqual(result, { ok: true, count: 2, visibleCount: 1 });
});

test('syncViews disposes entries that are no longer among the active keys', async () => {
  const { client, manager } = createManager();
  await manager.syncViews({ views: [view()] });
  const result = await manager.syncViews({ views: [view({ nodeId: 'n2' })] });
  assert.deepEqual(result, { ok: true, count: 1, visibleCount: 0 });
  assert.equal(manager._getEntry('n1', 't1'), null);
  assert.deepEqual(client.callFor('Target.closeTarget')[0].params, { targetId: TARGET_ID });
});

test('syncViews reuses the existing entry and only resizes when the viewport changed', async () => {
  const { client, manager } = createManager();
  await manager.syncViews({ views: [view()] });
  await manager.syncViews({ views: [view(), view({ nodeId: 'n2' })] });
  assert.equal(client.callFor('Target.createTarget').length, 2);
  assert.equal(client.callFor('Emulation.setDeviceMetricsOverride').length, 2);
  await manager.syncViews({ views: [view(), view({ nodeId: 'n2' })] });
  assert.equal(client.callFor('Target.createTarget').length, 2);
  assert.equal(client.callFor('Emulation.setDeviceMetricsOverride').length, 2);
});

test('syncViews reports a failed target creation through an event and logs it', async () => {
  const log = createLogDouble();
  const { manager } = createManager({ plan: { 'Target.createTarget': { targetId: '' } }, log: log });
  const result = await manager.syncViews({ views: [view()] });
  assert.deepEqual(result, { ok: true, count: 1, visibleCount: 0 });
  const events = manager.consumeEvents();
  assert.equal(events[0].type, 'failed');
  assert.equal(events[0].message, 'Chrome did not create a browser target');
  assert.equal(log.events[0].type, 'chrome_web_preview.create_failed');
  assert.equal(log.events[0].level, 'warn');
  assert.equal(log.events[0].context.nodeId, 'n1');
});

test('syncViews returns null for a view whose ready promise rejects', async () => {
  const { manager } = createManager({ plan: { 'Target.attachToTarget': {} } });
  await manager.syncViews({ views: [view()] });
  const entry = manager._getEntry('n1', 't1');
  assert.equal(entry.ready, false);
});

test('controlView reports missing-node and missing-view before any CDP traffic', async () => {
  const { client, manager } = createManager();
  assert.deepEqual(await manager.controlView({ action: 'reload' }), { ok: false, error: 'missing-node' });
  assert.deepEqual(await manager.controlView({ nodeId: 'n1', action: 'reload' }), {
    ok: false,
    error: 'missing-view',
  });
  assert.deepEqual(client.methods(), []);
});

test('controlView reload triggers a cache ignoring reload and publishes the navigation state', async () => {
  const { client, manager } = createManager({
    plan: basePlan({ 'Page.getNavigationHistory': { entries: [{ id: 1 }, { id: 2 }], currentIndex: 1 } }),
  });
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  const result = await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'reload' });
  assert.deepEqual(result, { ok: true, action: 'reload', tabId: 't1', canGoBack: true, canGoForward: false });
  assert.deepEqual(client.callFor('Page.reload')[0].params, { ignoreCache: true });
  const events = manager.consumeEvents();
  assert.deepEqual(
    events.map((event) => event.type),
    ['loading', 'navigation-state'],
  );
  assert.equal(events[1].canGoBack, true);
});

test('controlView back blocks and mentions the missing previous page', async () => {
  const { client, manager } = createManager({
    plan: basePlan({ 'Page.getNavigationHistory': { entries: [{ id: 1 }, { id: 2 }], currentIndex: 0 } }),
  });
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  const result = await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'back' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'no-history');
  assert.equal(result.canGoBack, false);
  assert.equal(result.canGoForward, true);
  assert.equal(client.callFor('Page.navigateToHistoryEntry').length, 0);
  const events = manager.consumeEvents();
  assert.equal(events[0].type, 'blocked');
  assert.equal(events[0].message, '没有上一页');
});

test('controlView forward blocks and mentions the missing next page', async () => {
  const { client, manager } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  const result = await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'forward' });
  assert.equal(result.error, 'no-history');
  assert.equal(client.callFor('Page.navigateToHistoryEntry').length, 0);
  assert.equal(manager.consumeEvents()[0].message, '没有下一页');
});

test('controlView back navigates to the previous history entry when one exists', async () => {
  const { client, manager } = createManager({
    plan: basePlan({ 'Page.getNavigationHistory': { entries: [{ id: 7 }, { id: 9 }], currentIndex: 1 } }),
  });
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  const result = await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'back' });
  assert.equal(result.ok, true);
  assert.equal(result.canGoBack, true);
  assert.deepEqual(client.callFor('Page.navigateToHistoryEntry')[0].params, { entryId: 7 });
});

test('controlView dispatch-input scales the mouse ratio against the viewport', async () => {
  const { client, manager } = createManager();
  await manager.syncViews({ views: [view({ bounds: { width: 1280, height: 1024 } })] });
  const result = await manager.controlView({
    nodeId: 'n1',
    tabId: 't1',
    action: 'dispatch-input',
    input: {
      kind: 'mouse',
      type: 'mousePressed',
      xRatio: 0.5,
      yRatio: 0.25,
      button: 0,
      buttons: 1,
      clickCount: 2,
    },
  });
  assert.deepEqual(result, { ok: true, action: 'dispatch-input', tabId: 't1' });
  const call = client.callFor('Input.dispatchMouseEvent')[0];
  assert.deepEqual(call.params, {
    type: 'mousePressed',
    x: 640,
    y: 256,
    modifiers: 0,
    button: 'left',
    buttons: 1,
    clickCount: 2,
  });
  assert.equal(call.sessionId, SESSION_ID);
});

test('controlView dispatch-input clamps the ratio and folds the modifiers', async () => {
  const { client, manager } = createManager();
  await manager.syncViews({ views: [view({ bounds: { width: 1280, height: 1024 } })] });
  await manager.controlView({
    nodeId: 'n1',
    tabId: 't1',
    action: 'dispatch-input',
    input: { kind: 'mouse', type: 'mouseMoved', xRatio: 5, yRatio: -3, ctrlKey: true, shiftKey: true },
  });
  const call = client.callFor('Input.dispatchMouseEvent')[0];
  assert.equal(call.params.x, 1280);
  assert.equal(call.params.y, 0);
  assert.equal(call.params.modifiers, 10);
  assert.equal(call.params.button, 'none');
});

test('controlView dispatch-input carries the wheel deltas and schedules a snapshot', async () => {
  const { client, manager, timers } = createManager();
  await manager.syncViews({ views: [view({ bounds: { width: 1280, height: 1024 } })] });
  await manager.controlView({
    nodeId: 'n1',
    tabId: 't1',
    action: 'dispatch-input',
    input: { kind: 'mouse', type: 'mouseWheel', xRatio: 1, yRatio: 1, deltaX: 10, deltaY: -20 },
  });
  const call = client.callFor('Input.dispatchMouseEvent')[0];
  assert.equal(call.params.deltaX, 10);
  assert.equal(call.params.deltaY, -20);
  assert.deepEqual(timers.pendingMs(), [90]);
});

test('controlView dispatch-input does not schedule a snapshot for a press', async () => {
  const { manager, timers } = createManager();
  await manager.syncViews({ views: [view()] });
  await manager.controlView({
    nodeId: 'n1',
    tabId: 't1',
    action: 'dispatch-input',
    input: { kind: 'mouse', type: 'mousePressed' },
  });
  assert.equal(timers.size, 0);
});

test('controlView rejects an unknown mouse event type', async () => {
  const { manager } = createManager();
  await manager.syncViews({ views: [view()] });
  assert.deepEqual(
    await manager.controlView({
      nodeId: 'n1',
      tabId: 't1',
      action: 'dispatch-input',
      input: { kind: 'mouse', type: 'mouseDown' },
    }),
    { ok: false, error: 'unsupported-input' },
  );
});

test('controlView dispatch-input sends a key down with its text payload', async () => {
  const { client, manager, timers } = createManager();
  await manager.syncViews({ views: [view()] });
  const result = await manager.controlView({
    nodeId: 'n1',
    tabId: 't1',
    action: 'dispatch-input',
    input: {
      kind: 'key',
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      text: '\r',
      keyCode: 13,
      shiftKey: true,
    },
  });
  assert.deepEqual(result, { ok: true, action: 'dispatch-input', tabId: 't1' });
  assert.deepEqual(client.callFor('Input.dispatchKeyEvent')[0].params, {
    type: 'keyDown',
    modifiers: 8,
    key: 'Enter',
    code: 'Enter',
    text: '\r',
    unmodifiedText: '\r',
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
    autoRepeat: false,
  });
  assert.equal(timers.size, 0);
});

test('controlView dispatch-input sends a key up without text and schedules a snapshot', async () => {
  const { client, manager, timers } = createManager();
  await manager.syncViews({ views: [view()] });
  await manager.controlView({
    nodeId: 'n1',
    tabId: 't1',
    action: 'dispatch-input',
    input: { kind: 'key', type: 'keyUp', key: 'a', code: 'KeyA', text: 'a', keyCode: 65, repeat: true },
  });
  const params = client.callFor('Input.dispatchKeyEvent')[0].params;
  assert.equal(params.type, 'keyUp');
  assert.equal(params.text, '');
  assert.equal(params.unmodifiedText, '');
  assert.equal(params.autoRepeat, true);
  assert.deepEqual(timers.pendingMs(), [90]);
});

test('controlView dispatch-input inserts text and schedules a snapshot', async () => {
  const { client, manager, timers } = createManager();
  await manager.syncViews({ views: [view()] });
  const result = await manager.controlView({
    nodeId: 'n1',
    tabId: 't1',
    action: 'dispatch-input',
    input: { kind: 'text', text: '你好' },
  });
  assert.deepEqual(result, { ok: true, action: 'dispatch-input', tabId: 't1' });
  assert.deepEqual(client.callFor('Input.insertText')[0].params, { text: '你好' });
  assert.deepEqual(timers.pendingMs(), [90]);
});

test('controlView rejects an unknown dispatch-input kind', async () => {
  const { manager } = createManager();
  await manager.syncViews({ views: [view()] });
  assert.deepEqual(
    await manager.controlView({
      nodeId: 'n1',
      tabId: 't1',
      action: 'dispatch-input',
      input: { kind: 'wheel' },
    }),
    { ok: false, error: 'unsupported-input' },
  );
});

test('controlView capture-reference gathers the page metadata plus the screenshot', async () => {
  const { client, manager, clock } = createManager({
    plan: basePlan({
      'Runtime.evaluate': {
        result: { value: { pageUrl: 'https://a/', pageTitle: 'T', selectedText: 'x'.repeat(6000) } },
      },
      'Page.captureScreenshot': { data: 'AAA' },
      'Page.getNavigationHistory': { entries: [{ id: 1 }, { id: 2 }], currentIndex: 1 },
    }),
  });
  clock.value = 1000;
  await manager.syncViews({ views: [view()] });
  const result = await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'capture-reference' });
  assert.equal(result.ok, true);
  assert.equal(result.pageUrl, 'https://a/');
  assert.equal(result.pageTitle, 'T');
  assert.equal(result.selectedText.length, 5000);
  assert.equal(result.screenshotDataUrl, 'data:image/webp;base64,AAA');
  assert.equal(result.capturedAt, new Date(1000).toISOString());
  assert.equal(result.canGoBack, true);
  const evaluate = client.callFor('Runtime.evaluate')[0];
  assert.equal(evaluate.params.returnByValue, true);
  assert.equal(evaluate.params.awaitPromise, true);
  assert.match(evaluate.params.expression, /pageUrl/);
});

test('controlView capture-reference falls back to the entry url and an empty screenshot', async () => {
  const { manager } = createManager({ plan: basePlan({ 'Runtime.evaluate': { result: { value: {} } } }) });
  await manager.syncViews({ views: [view()] });
  const result = await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'capture-reference' });
  assert.equal(result.pageUrl, WEB_URL);
  assert.equal(result.pageTitle, '');
  assert.equal(result.selectedText, '');
  assert.equal(result.screenshotDataUrl, '');
});

test('controlView rejects an unknown action', async () => {
  const { manager } = createManager();
  await manager.syncViews({ views: [view()] });
  assert.deepEqual(await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'zoom' }), {
    ok: false,
    error: 'unsupported-action',
  });
});

test('controlView reports a control failure when the CDP call rejects', async () => {
  const log = createLogDouble();
  const { manager } = createManager({
    plan: basePlan({ 'Page.reload': new Error('reload exploded') }),
    log: log,
  });
  await manager.syncViews({ views: [view()] });
  const result = await manager.controlView({ nodeId: 'n1', tabId: 't1', action: 'reload' });
  assert.deepEqual(result, { ok: false, error: 'reload exploded' });
  assert.equal(log.events.at(-1).type, 'chrome_web_preview.control_failed');
  assert.equal(log.events.at(-1).error.message, 'reload exploded');
});

test('waitForEvents resolves immediately with the queued events', async () => {
  const { manager } = createManager();
  await manager.syncViews({ views: [view()] });
  const events = await manager.waitForEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'loading');
  assert.deepEqual(manager.consumeEvents(), []);
});

test('waitForEvents defers to its timer when the queue is empty', async () => {
  const { manager, timers } = createManager();
  const pending = manager.waitForEvents({ waitMs: 500 });
  assert.deepEqual(timers.pendingMs(), [500]);
  assert.equal(timers.fireAll(), undefined);
  assert.deepEqual(await pending, []);
});

test('waitForEvents clamps the requested wait time into its supported window', async () => {
  const low = createManager();
  low.manager.waitForEvents({ waitMs: 10 });
  assert.deepEqual(low.timers.pendingMs(), [EVENT_WAIT_MIN_MS]);
  const high = createManager();
  high.manager.waitForEvents({ waitMs: 100000 });
  assert.deepEqual(high.timers.pendingMs(), [EVENT_WAIT_MAX_MS]);
  const fallback = createManager();
  fallback.manager.waitForEvents({ waitMs: 'soon' });
  assert.deepEqual(fallback.timers.pendingMs(), [1000]);
});

test('waitForEvents hands the events to the first waiter as soon as one arrives', async () => {
  const { manager, client } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  const pending = manager.waitForEvents({ waitMs: 5000 });
  client.emit({ sessionId: SESSION_ID, method: 'Page.frameStartedLoading', params: {} });
  const events = await pending;
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'loading');
});

test('the event queue drops the oldest entries beyond its capacity', async () => {
  const { manager, client } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  for (let index = 0; index < 0xaa; index += 1)
    client.emit({ sessionId: SESSION_ID, method: 'Page.frameStartedLoading', params: {} });
  const events = manager.consumeEvents();
  assert.equal(events.length, MAX_EVENT_QUEUE_SIZE);
  assert.equal(events[0].sequence, 2 + (0xaa - MAX_EVENT_QUEUE_SIZE));
  assert.equal(events.at(-1).sequence, 0xaa + 1);
});

test('a fresh snapshot replaces the queued snapshot of the same view', async () => {
  const { manager, client } = createManager({
    plan: basePlan({ 'Page.captureScreenshot': { data: 'SHOT' } }),
  });
  await manager.syncViews({
    views: [view({ active: true, visible: true, selected: false, bounds: { width: 1280, height: 1024 } })],
  });
  manager.consumeEvents();
  client.emit({ sessionId: SESSION_ID, method: 'Page.loadEventFired', params: {} });
  await flush();
  client.emit({ sessionId: SESSION_ID, method: 'Page.loadEventFired', params: {} });
  await flush();
  const events = manager.consumeEvents();
  const snapshots = events.filter((event) => event.type === 'snapshot');
  assert.equal(events.length, 5);
  assert.equal(snapshots.length, 1);
  assert.equal(events.filter((event) => event.type === 'loaded').length, 2);
  assert.equal(events.filter((event) => event.type === 'navigation-state').length, 2);
  assert.equal(snapshots[0].surfaceMode, 'remote-snapshot');
  assert.equal(snapshots[0].freezeToken, 'ready');
  assert.equal(snapshots[0].dataUrl, 'data:image/webp;base64,SHOT');
  assert.equal(snapshots[0].width, 1280);
  assert.equal(snapshots[0].height, 1024);
});

test('a failed webp snapshot falls back to the jpeg capture', async () => {
  const { manager, client } = createManager({
    plan: basePlan({
      'Page.captureScreenshot': (params) =>
        params.format === 'webp' ? new Error('no webp') : { data: 'JPG' },
    }),
  });
  await manager.syncViews({ views: [view({ active: true, visible: true, selected: false })] });
  manager.consumeEvents();
  client.emit({ sessionId: SESSION_ID, method: 'Page.loadEventFired', params: {} });
  await flush();
  assert.equal(client.callFor('Page.captureScreenshot').length, 2);
  const snapshot = manager.consumeEvents().find((event) => event.type === 'snapshot');
  assert.equal(snapshot.dataUrl, 'data:image/jpeg;base64,JPG');
});

test('a snapshot failure logs the chrome web preview snapshot error', async () => {
  const log = createLogDouble();
  const { manager, client } = createManager({
    plan: basePlan({ 'Page.captureScreenshot': new Error('capture exploded') }),
    log: log,
  });
  await manager.syncViews({ views: [view({ active: true, visible: true, selected: false })] });
  manager.consumeEvents();
  client.emit({ sessionId: SESSION_ID, method: 'Page.loadEventFired', params: {} });
  await flush();
  assert.equal(log.events.at(-1).type, 'chrome_web_preview.snapshot_failed');
  assert.equal(log.events.at(-1).message, 'Chrome browser node snapshot failed');
  assert.equal(log.events.at(-1).context.url, WEB_URL);
});

test('reconcileScreencast streams live frames once the view is active, visible and selected', async () => {
  const { manager, client, clock } = createManager({
    plan: basePlan({ 'Page.screencastFrameAck': {} }),
  });
  clock.value = 1000;
  await manager.syncViews({
    views: [view({ active: true, visible: true, selected: true, bounds: { width: 1280, height: 1024 } })],
  });
  assert.deepEqual(client.callFor('Target.activateTarget')[0].params, { targetId: TARGET_ID });
  assert.deepEqual(client.callFor('Page.startScreencast')[0].params, {
    format: 'jpeg',
    quality: SCREENCAST_QUALITY,
    maxWidth: 1280,
    maxHeight: 800,
    everyNthFrame: 1,
  });
  assert.equal(manager._getEntry('n1', 't1').screencastActive, true);
  manager.consumeEvents();
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.screencastFrame',
    params: { sessionId: 5, data: 'FRAME' },
  });
  await flush();
  assert.deepEqual(client.callFor('Page.screencastFrameAck')[0].params, { sessionId: 5 });
  const snapshot = manager.consumeEvents().find((event) => event.type === 'snapshot');
  assert.equal(snapshot.streaming, true);
  assert.equal(snapshot.freezeToken, 'live');
  assert.equal(snapshot.dataUrl, 'data:image/jpeg;base64,FRAME');
});

test('throttled screencast frames are held back until the minimum frame interval elapses', async () => {
  const { manager, client, clock, timers } = createManager({ plan: basePlan() });
  clock.value = 1000;
  await manager.syncViews({ views: [view({ active: true, visible: true, selected: true })] });
  manager.consumeEvents();
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.screencastFrame',
    params: { sessionId: 1, data: 'A' },
  });
  await flush();
  assert.equal(manager.consumeEvents().length, 1);
  clock.value = 1005;
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.screencastFrame',
    params: { sessionId: 2, data: 'B' },
  });
  await flush();
  assert.deepEqual(timers.pendingMs(), [SCREENCAST_MIN_FRAME_INTERVAL_MS - 5]);
  assert.equal(manager.consumeEvents().length, 0);
  timers.fireAll();
  const snapshot = manager.consumeEvents().find((event) => event.type === 'snapshot');
  assert.equal(snapshot.dataUrl, 'data:image/jpeg;base64,B');
});

test('a screencast frame without data or without a numeric session id is ignored', async () => {
  const { manager, client } = createManager({ plan: basePlan() });
  await manager.syncViews({ views: [view({ active: true, visible: true, selected: true })] });
  manager.consumeEvents();
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.screencastFrame',
    params: { sessionId: 'x', data: 'A' },
  });
  await flush();
  assert.equal(client.callFor('Page.screencastFrameAck').length, 0);
  assert.equal(manager.consumeEvents().length, 1);
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.screencastFrame',
    params: { sessionId: 1, data: '   ' },
  });
  await flush();
  assert.equal(client.callFor('Page.screencastFrameAck').length, 1);
  assert.deepEqual(client.callFor('Page.screencastFrameAck')[0].params, { sessionId: 1 });
  assert.deepEqual(manager.consumeEvents(), []);
});

test('frameStartedLoading re-publishes the requested url as a loading event', async () => {
  const { manager, client } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  client.emit({ sessionId: SESSION_ID, method: 'Page.frameStartedLoading', params: {} });
  const events = manager.consumeEvents();
  assert.deepEqual(events[0], {
    nodeId: 'n1',
    tabId: 't1',
    type: 'loading',
    url: WEB_URL,
    holdSnapshot: false,
    sequence: 2,
    createdAt: 0,
  });
});

test('frameNavigated adopts the committed top level url only', async () => {
  const { manager, client } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.frameNavigated',
    params: { frame: { url: 'https://next.example/p', parentId: '' } },
  });
  const events = manager.consumeEvents();
  assert.equal(events[0].type, 'navigated');
  assert.equal(events[0].url, 'https://next.example/p');
  assert.equal(manager._getEntry('n1', 't1').url, 'https://next.example/p');
});

test('frameNavigated ignores subframes and non http urls', async () => {
  const { manager, client } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.frameNavigated',
    params: { frame: { url: 'https://child.example/', parentId: 'parent' } },
  });
  client.emit({
    sessionId: SESSION_ID,
    method: 'Page.frameNavigated',
    params: { frame: { url: 'about:blank', parentId: '' } },
  });
  assert.deepEqual(manager.consumeEvents(), []);
  assert.equal(manager._getEntry('n1', 't1').url, WEB_URL);
});

test('targetCrashed publishes a failed event with the exit message', async () => {
  const { manager, client } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  client.emit({ sessionId: SESSION_ID, method: 'Inspector.targetCrashed', params: {} });
  const events = manager.consumeEvents();
  assert.equal(events[0].type, 'failed');
  assert.equal(events[0].message, '浏览器页面进程已退出');
});

test('client events from an unknown session are ignored', async () => {
  const { manager, client } = createManager();
  await manager.syncViews({ views: [view()] });
  manager.consumeEvents();
  client.emit({ sessionId: 'nope', method: 'Page.frameStartedLoading', params: {} });
  client.emit({ method: 'Page.loadEventFired', params: {} });
  assert.deepEqual(manager.consumeEvents(), []);
});

test('disposeViews disposes the matching entries by node and tab id', async () => {
  const { client, manager } = createManager();
  await manager.syncViews({ views: [view(), view({ nodeId: 'n2' })] });
  const result = await manager.disposeViews({ nodeIds: ['n1'] });
  assert.deepEqual(result, { ok: true, disposed: 1 });
  assert.equal(manager._getEntry('n1', 't1'), null);
  assert.notEqual(manager._getEntry('n2', 't1'), null);
  assert.equal(client.callFor('Target.closeTarget').length, 1);
});

test('disposeViews disposes everything when asked with all', async () => {
  const { client, manager } = createManager();
  await manager.syncViews({ views: [view(), view({ nodeId: 'n2' })] });
  const result = await manager.disposeViews({ all: true });
  assert.deepEqual(result, { ok: true, disposed: 2 });
  assert.equal(client.callFor('Target.closeTarget').length, 2);
});

test('disposeViews without a selector and without all keeps every entry', async () => {
  const { manager } = createManager();
  await manager.syncViews({ views: [view()] });
  assert.deepEqual(await manager.disposeViews(), { ok: true, disposed: 0 });
  assert.notEqual(manager._getEntry('n1', 't1'), null);
});

test('dispose tears down the client once and rejects after that', async () => {
  const { client, manager, timers } = createManager();
  await manager.syncViews({ views: [view()] });
  await manager.dispose();
  assert.equal(client.unsubscribed, 1);
  assert.equal(client.closed, 1);
  assert.equal(manager._getEntry('n1', 't1'), null);
  assert.deepEqual(await manager.syncViews({ views: [view()] }), { ok: false, error: 'disposed' });
  assert.deepEqual(await manager.waitForEvents(), []);
  assert.equal(timers.size, 0);
});

test('dispose resolves a pending waiter with an empty event list', async () => {
  const { manager, timers } = createManager();
  const pending = manager.waitForEvents({ waitMs: 5000 });
  assert.equal(timers.size, 1);
  await manager.dispose();
  assert.deepEqual(await pending, []);
  assert.equal(timers.size, 0);
});

test('dispose tolerates a client without an event subscription', async () => {
  const client = createClientDouble(basePlan());
  delete client.onEvent;
  const manager = createChromeShellWebPreviewManager({ client: client });
  await manager.syncViews({ views: [view()] });
  await manager.dispose();
  assert.equal(client.calls.filter((call) => call.method === 'Target.closeTarget').length, 1);
});
