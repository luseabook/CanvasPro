import test from 'node:test';
import assert from 'node:assert/strict';

import { syncNotificationShortcut } from './notificationShortcutSettings.js';

// 冻结文案：settings.shortcuts.notificationShortcutUnavailable 不在词典里，t() 回退成 key。
const TOAST_TEXT = 'settings.shortcuts.notificationShortcutUnavailable';

function makeHost(over = {}) {
  const calls = { updates: [], toasts: [] };
  const handler =
    'updateGlobalShortcut' in over
      ? over.updateGlobalShortcut
      : () => Promise.resolve({ success: true });
  const notification = {
    showGenerationComplete:
      'showGenerationComplete' in over ? over.showGenerationComplete : () => {},
    updateGlobalShortcut(request) {
      calls.updates.push(request);
      return handler(request);
    },
  };
  return {
    calls,
    window: {
      electronAPI: { notification },
      showToast:
        'showToast' in over
          ? over.showToast
          : function showToast(message, type) {
              calls.toasts.push([message, type]);
            },
    },
  };
}

async function withHost(over, run) {
  const previous = globalThis.window;
  const host = makeHost(over);
  globalThis.window = host.window;
  try {
    return await run(host);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

test('notificationShortcut: 无 window 时直接返回 undefined', () => {
  delete globalThis.window;
  assert.equal(syncNotificationShortcut(['F5']), undefined);
});

test('notificationShortcut: 桌面通知不可用时直接返回 undefined 且不请求接口', async () => {
  const previous = globalThis.window;
  globalThis.window = { electronAPI: { notification: {} } };
  try {
    assert.equal(syncNotificationShortcut(['F5']), undefined);
    await Promise.resolve();
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('notificationShortcut: 可用时把按键透传给桌面接口且不提示失败', async () => {
  await withHost({}, async ({ calls }) => {
    const pending = syncNotificationShortcut(['Ctrl', 'Shift', 'N']);
    assert.equal(typeof pending.then, 'function');
    await pending;
    assert.deepEqual(calls.updates, [{ keys: ['Ctrl', 'Shift', 'N'] }]);
    assert.deepEqual(calls.toasts, []);
  });
});

test('notificationShortcut: 失败时按 join("+") 去重提示 warn', async () => {
  await withHost(
    { updateGlobalShortcut: () => Promise.resolve({ success: false }) },
    async ({ calls }) => {
      await syncNotificationShortcut(['Ctrl', 'Shift']);
      assert.deepEqual(calls.toasts, [[TOAST_TEXT, 'warn']]);

      await syncNotificationShortcut(['Ctrl', 'Shift']);
      assert.equal(calls.toasts.length, 1);

      await syncNotificationShortcut(['Shift', 'Ctrl']);
      assert.equal(calls.toasts.length, 2);

      await syncNotificationShortcut(['Ctrl', 'Shift', 'Alt']);
      assert.equal(calls.toasts.length, 3);
      assert.equal(calls.updates.length, 4);
      assert.deepEqual(calls.updates[3], { keys: ['Ctrl', 'Shift', 'Alt'] });
    },
  );
});

test('notificationShortcut: 成功会清空失败记忆，再次失败重新提示', async () => {
  let result = { success: false };
  await withHost(
    { updateGlobalShortcut: () => Promise.resolve(result) },
    async ({ calls }) => {
      await syncNotificationShortcut(['F7']);
      assert.equal(calls.toasts.length, 1);

      result = { success: true };
      await syncNotificationShortcut(['F7']);
      assert.equal(calls.toasts.length, 1);

      result = { success: false };
      await syncNotificationShortcut(['F7']);
      assert.equal(calls.toasts.length, 2);
    },
  );
});

test('notificationShortcut: 接口抛错按失败处理', async () => {
  await withHost(
    {
      updateGlobalShortcut: () => {
        throw new Error('boom');
      },
    },
    async ({ calls }) => {
      await assert.doesNotReject(syncNotificationShortcut(['F8']));
      assert.deepEqual(calls.toasts, [[TOAST_TEXT, 'warn']]);
      assert.equal(calls.updates.length, 1);
    },
  );
});

test('notificationShortcut: 返回值非对象不算失败并清空失败记忆', async () => {
  let result;
  await withHost(
    { updateGlobalShortcut: () => Promise.resolve(result) },
    async ({ calls }) => {
      await syncNotificationShortcut(['F9']);
      assert.equal(calls.toasts.length, 0);

      result = { success: false };
      await syncNotificationShortcut(['F9']);
      assert.equal(calls.toasts.length, 1);

      result = undefined;
      await syncNotificationShortcut(['F9']);
      assert.equal(calls.toasts.length, 1);

      result = { success: false };
      await syncNotificationShortcut(['F9']);
      assert.equal(calls.toasts.length, 2);
      assert.equal(calls.updates.length, 4);
    },
  );
});

test('notificationShortcut: 后发调用胜出，过期任务不请求接口', async () => {
  await withHost({}, async ({ calls }) => {
    const first = syncNotificationShortcut(['A1']);
    const second = syncNotificationShortcut(['A2']);
    await Promise.all([first, second]);
    assert.equal(calls.updates.length, 1);
    assert.deepEqual(calls.updates[0], { keys: ['A2'] });
    assert.deepEqual(calls.toasts, []);
  });
});

test('notificationShortcut: 宿主缺少 showToast 时失败不抛出', async () => {
  await withHost(
    {
      showToast: undefined,
      updateGlobalShortcut: () => Promise.resolve({ success: false }),
    },
    async ({ calls }) => {
      await assert.doesNotReject(syncNotificationShortcut(['B1']));
      assert.deepEqual(calls.toasts, []);
      assert.equal(calls.updates.length, 1);
    },
  );
});

test('notificationShortcut: 上一次失败不阻塞后续调用', async () => {
  await withHost(
    { updateGlobalShortcut: () => Promise.resolve({ success: false }) },
    async ({ calls }) => {
      await syncNotificationShortcut(['C1']);
      assert.deepEqual(calls.toasts, [[TOAST_TEXT, 'warn']]);

      await syncNotificationShortcut(['C2']);
      assert.equal(calls.toasts.length, 2);
      assert.deepEqual(calls.updates, [{ keys: ['C1'] }, { keys: ['C2'] }]);
    },
  );
});
