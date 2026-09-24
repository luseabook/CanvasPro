import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBackgroundCompletionNotifier,
  __backgroundCompletionNotificationForTest,
} from './backgroundCompletionNotification.js';

const { isWindowFocused, normalizeNavigation, normalizeThumbnailLocalPath, resolveNotificationIcon, normalizeText } =
  __backgroundCompletionNotificationForTest;

function createStubNotification() {
  const instances = [];
  class StubNotification {
    constructor(options) {
      this.options = options;
      this.handlers = {};
      this.closed = false;
      this.shown = false;
      instances.push(this);
    }
    static isSupported() {
      return true;
    }
    on(event, handler) {
      this.handlers[event] = handler;
      return this;
    }
    show() {
      this.shown = true;
    }
    close() {
      this.closed = true;
    }
    emit(event, ...args) {
      this.handlers[event]?.(...args);
    }
  }
  return { StubNotification, instances };
}

function createShortcutApi() {
  const calls = [];
  return {
    calls,
    register: (accelerator) => (calls.push(['register', accelerator]), true),
    unregister: (accelerator) => calls.push(['unregister', accelerator]),
  };
}

test('isWindowFocused guards destroyed and non-focused windows', () => {
  assert.equal(isWindowFocused({ isDestroyed: () => false, isFocused: () => true }), true);
  assert.equal(isWindowFocused({ isDestroyed: () => true, isFocused: () => true }), false);
  assert.equal(isWindowFocused({ isDestroyed: () => false, isFocused: () => false }), false);
  assert.equal(
    isWindowFocused({
      isDestroyed: () => {
        throw new Error('gone');
      },
    }),
    false,
  );
  assert.equal(isWindowFocused(null), false);
});

test('normalizeNavigation handles canvas and studio navigations', () => {
  assert.equal(normalizeNavigation(null), null);
  assert.equal(normalizeNavigation('canvas'), null);
  assert.equal(normalizeNavigation([]), null);
  assert.deepEqual(normalizeNavigation({ source: 'canvas', nodeId: 'n1' }), {
    source: 'canvas',
    projectId: '',
    nodeId: 'n1',
    canvasId: '',
  });
  assert.equal(normalizeNavigation({ source: 'canvas' }), null);
  assert.equal(normalizeNavigation({ source: 'story', projectId: 'p1' }).step, 1);
  assert.equal(normalizeNavigation({ source: 'story', projectId: 'p1', step: 9 }).step, 3);
  assert.equal(normalizeNavigation({ source: 'replacement-studio', projectId: 'p1', step: 9 }).step, 5);
  assert.equal(normalizeNavigation({ source: 'story', projectId: 'p1', step: 0 }).step, 1);
});

test('normalizeThumbnailLocalPath only accepts image extensions and strips query strings', () => {
  assert.equal(normalizeThumbnailLocalPath('/tmp/a.PNG?x=1'), '/tmp/a.PNG');
  assert.equal(normalizeThumbnailLocalPath('/tmp/a.mp4'), '');
  assert.equal(normalizeThumbnailLocalPath(''), '');
  assert.equal(normalizeThumbnailLocalPath(null), '');
});

test('resolveNotificationIcon resolves a relative image path through the resolver', () => {
  assert.equal(resolveNotificationIcon({ thumbnailLocalPath: '/tmp/a.jpg' }, () => 'file:///abs/a.jpg'), 'file:///abs/a.jpg');
  assert.equal(resolveNotificationIcon({ thumbnailLocalPath: '/tmp/a.mp4' }, () => 'file:///abs/a.mp4'), '');
  assert.equal(resolveNotificationIcon({ thumbnailLocalPath: '/tmp/a.jpg' }, null), '');
  assert.equal(
    resolveNotificationIcon({ thumbnailLocalPath: '/tmp/a.jpg' }, () => {
      throw new Error('nope');
    }),
    '',
  );
});

test('showGenerationComplete is skipped when the window is focused', () => {
  const { StubNotification, instances } = createStubNotification();
  const notifier = createBackgroundCompletionNotifier({
    Notification: StubNotification,
    getMainWindow: () => ({ isDestroyed: () => false, isFocused: () => true }),
    platform: 'linux',
  });
  assert.deepEqual(notifier.showGenerationComplete({ title: 't', body: 'b' }), {
    success: true,
    shown: false,
    reason: 'window-focused',
  });
  assert.equal(instances.length, 0);
});

test('showGenerationComplete builds a Windows toast and wires click navigation', async () => {
  const { StubNotification, instances } = createStubNotification();
  const clicks = [],
    timers = [];
  const notifier = createBackgroundCompletionNotifier({
    Notification: StubNotification,
    getMainWindow: () => ({ isDestroyed: () => false, isFocused: () => false }),
    focusMainWindow: () => true,
    onClick: (event) => clicks.push(event),
    resolveNotificationIconPath: () => 'file:///tmp/icon.png',
    platform: 'win32',
    setTimeoutFn: (fn) => {
      timers.push(fn);
      return { unref: () => {} };
    },
    clearTimeoutFn: () => {},
  });
  const result = notifier.showGenerationComplete({
    title: 'Done',
    body: 'Body',
    thumbnailLocalPath: '/tmp/icon.png',
    navigation: { source: 'canvas', nodeId: 'n1' },
    notificationId: 'notif-1',
  });
  assert.deepEqual(result, { success: true, shown: true });
  assert.equal(instances.length, 1);
  const notification = instances[0];
  assert.match(notification.options.toastXml, /<toast duration="long">/);
  assert.equal(notification.options.icon, 'file:///tmp/icon.png');
  assert.equal(notification.options.silent, true);
  assert.equal(timers.length, 1);
  notification.emit('show');
  assert.equal(timers.length, 2);
  notification.emit('click');
  assert.equal(clicks.length, 1);
  assert.equal(clicks[0].nodeId, 'n1');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(notifier.consumeClickEvents().length, 1);
});

test('showGenerationComplete reports unsupported platforms without constructing a notification', () => {
  let constructed = 0;
  class UnsupportedNotification {
    constructor() {
      constructed += 1;
    }
    static isSupported() {
      return false;
    }
  }
  const notifier = createBackgroundCompletionNotifier({
    Notification: UnsupportedNotification,
    getMainWindow: () => null,
    platform: 'linux',
  });
  assert.deepEqual(notifier.showGenerationComplete({}), {
    success: true,
    shown: false,
    reason: 'unsupported',
  });
  assert.equal(constructed, 0);
});

test('showGenerationComplete surfaces construction failures and logs them', () => {
  const logs = [];
  class ThrowingNotification {
    constructor() {
      throw new Error('no display');
    }
  }
  const notifier = createBackgroundCompletionNotifier({
    Notification: ThrowingNotification,
    getMainWindow: () => null,
    logEvent: (entry) => logs.push(entry),
    platform: 'linux',
  });
  const result = notifier.showGenerationComplete({ title: 'x' });
  assert.equal(result.success, false);
  assert.equal(result.shown, false);
  assert.equal(result.error, 'no display');
  assert.equal(logs[0].type, 'notification.generation_complete_failed');
});

test('auto-close timer and dispose clear active notifications', () => {
  const { StubNotification, instances } = createStubNotification();
  let timerHandler = null;
  const notifier = createBackgroundCompletionNotifier({
    Notification: StubNotification,
    getMainWindow: () => null,
    platform: 'linux',
    setTimeoutFn: (fn) => {
      timerHandler = fn;
      return { unref: () => {} };
    },
    clearTimeoutFn: () => {},
  });
  notifier.showGenerationComplete({});
  const notification = instances[0];
  notification.emit('show');
  assert.equal(typeof timerHandler, 'function');
  timerHandler();
  assert.equal(notification.closed, true);
  notifier.dispose();
});

test('updateGlobalShortcut and acknowledge delegate to the navigation controller', () => {
  const shortcutApi = createShortcutApi();
  const notifier = createBackgroundCompletionNotifier({
    Notification: null,
    globalShortcutApi: shortcutApi,
    getMainWindow: () => null,
    platform: 'linux',
  });
  assert.deepEqual(notifier.updateGlobalShortcut({ keys: ['Alt', 'E'] }), {
    success: true,
    accelerator: 'Alt+E',
  });
  assert.deepEqual(shortcutApi.calls, [['register', 'Alt+E']]);
  assert.deepEqual(notifier.acknowledge({ notificationId: 'missing' }), { success: true });
  assert.deepEqual(notifier.acknowledge({}), { success: false });
  notifier.dispose();
  assert.deepEqual(shortcutApi.calls, [['register', 'Alt+E'], ['unregister', 'Alt+E']]);
});

test('normalizeText collapses whitespace and truncates', () => {
  assert.equal(normalizeText('  a   b  '), 'a b');
  assert.equal(normalizeText('', 'fallback'), 'fallback');
  assert.equal(normalizeText('abcdef', '', 3), 'abc');
});
