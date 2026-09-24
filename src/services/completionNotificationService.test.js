import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  clearCompletionSoundSettingsCache,
  setCompletionSoundSettingsCache,
} from './completionSoundService.js';
import {
  buildGenerationCompleteNotificationRequest,
  dispatchCompletionClick,
  showGenerationCompleteNotification,
  showTaskStatusNotification,
  subscribeGenerationCompleteNotificationClicks,
} from './completionNotificationService.js';
const originalWindow = globalThis.window;
(afterEach(() => {
  clearCompletionSoundSettingsCache();
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
}),
  test('completionNotificationService: no-ops outside desktop bridge', async () => {
    delete globalThis.window;
    const _0x418680 = await showGenerationCompleteNotification();
    assert.deepEqual(_0x418680, { success: true, shown: false, reason: 'unavailable' });
  }),
  test('completionNotificationService: sends generation completion payload', async () => {
    const _0xfbd86a = [];
    (setCompletionSoundSettingsCache({ notificationEnabled: true }),
      (globalThis.window = {
        electronAPI: {
          notification: {
            showGenerationComplete: async (_0x28d1f3) => {
              return (_0xfbd86a.push(_0x28d1f3), { success: true, shown: true });
            },
          },
        },
      }));
    const _0x56e1fa = await showGenerationCompleteNotification();
    (assert.deepEqual(_0x56e1fa, { success: true, shown: true }),
      assert.deepEqual(_0xfbd86a, [{ title: 'AI CanvasPro', body: '生成任务已完成。' }]));
  }),
  test('completionNotificationService: skips when disabled in settings', async () => {
    const _0x53e795 = [];
    (setCompletionSoundSettingsCache({ notificationEnabled: false }),
      (globalThis.window = {
        electronAPI: {
          notification: {
            showGenerationComplete: async (_0x1404f4) => {
              return (_0x53e795.push(_0x1404f4), { success: true, shown: true });
            },
          },
        },
      }));
    const _0x4f6f36 = await showGenerationCompleteNotification();
    (assert.deepEqual(_0x4f6f36, { success: true, shown: false, reason: 'disabled' }),
      assert.deepEqual(_0x53e795, []));
  }));

test('completionNotificationService: builds a node-aware request with the local image thumbnail', async () => {
  const request = await buildGenerationCompleteNotificationRequest({
    node: { name: '图片 1', images: [{ localPath: 'data/assets/a.png' }] },
    mediaKind: 'image',
    navigation: { source: 'canvas', nodeId: 'n1' },
  });
  assert.deepEqual(request, {
    title: 'AI CanvasPro',
    body: '“图片 1”生成完成。',
    thumbnailLocalPath: 'data/assets/a.png',
    navigation: { source: 'canvas', nodeId: 'n1' },
  });
});

test('completionNotificationService: video requests use the injected first-frame enhancer', async () => {
  const seen = [];
  const request = await buildGenerationCompleteNotificationRequest(
    {
      node: { name: '视频 1', videos: [{ localPath: 'data/assets/a.mp4' }] },
      mediaKind: 'video',
    },
    {
      ensureVideoThumbnail: async (video) => (
        seen.push(video),
        { ...video, posterLocalPath: 'data/assets/a.thumb.jpg' }
      ),
    },
  );
  assert.equal(seen.length, 1);
  assert.equal(seen[0].localPath, 'data/assets/a.mp4');
  assert.deepEqual(request, {
    title: 'AI CanvasPro',
    body: '“视频 1”生成完成。',
    thumbnailLocalPath: 'data/assets/a.thumb.jpg',
  });
});

test('completionNotificationService: a failing first-frame enhancer still yields a request', async () => {
  const request = await buildGenerationCompleteNotificationRequest(
    { node: { name: '视频 2', videos: [{ localPath: 'data/assets/a.mp4' }] }, mediaKind: 'video' },
    {
      ensureVideoThumbnail: async () => {
        throw new Error('boom');
      },
    },
  );
  assert.deepEqual(request, { title: 'AI CanvasPro', body: '“视频 2”生成完成。' });
});

test('completionNotificationService: navigation payload drives the toast and the native delivery', async () => {
  const toasts = [];
  const delivered = [];
  const acknowledged = [];
  (setCompletionSoundSettingsCache({ notificationEnabled: true }),
    (globalThis.window = {
      electronAPI: {
        notification: {
          showGenerationComplete: async (payload) => (
            delivered.push(payload),
            { success: true, shown: true }
          ),
          acknowledge: async (payload) => (acknowledged.push(payload), { ok: true }),
        },
      },
      showToast: (...args) => toasts.push(args),
    }));
  const result = await showGenerationCompleteNotification({
    nodeName: '图片 1',
    navigation: { source: 'canvas', nodeId: 'n1' },
  });
  (assert.deepEqual(result, { success: true, shown: true }),
    assert.equal(toasts.length, 1),
    assert.equal(toasts[0][0], '“图片 1”生成完成。'),
    assert.equal(toasts[0][1], 'success'),
    assert.equal(toasts[0][2], 0x2710),
    assert.equal(toasts[0][3].ariaLabel, '“图片 1”生成完成。，点击查看结果'),
    assert.equal(delivered.length, 1),
    assert.equal(delivered[0].body, '“图片 1”生成完成。'),
    assert.equal(delivered[0].notificationId.startsWith('renderer-'), true));
  toasts[0][3].onClick();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(acknowledged, [{ notificationId: delivered[0].notificationId }]);
});

test('completionNotificationService: desktop notification clicks reach renderer subscribers', () => {
  const handlers = [];
  const unsubscribeCalls = [];
  globalThis.window = {
    electronAPI: {
      notification: {
        onGenerationCompleteClick: (handler) => (handlers.push(handler), () => unsubscribeCalls.push(true)),
      },
    },
  };
  const received = [];
  const unsubscribe = subscribeGenerationCompleteNotificationClicks((navigation) =>
    received.push(navigation),
  );
  (assert.equal(handlers.length, 1),
    handlers[0]({ source: 'canvas', nodeId: 'n1' }),
    assert.deepEqual(received, [{ source: 'canvas', nodeId: 'n1' }]),
    dispatchCompletionClick({ source: 'canvas', nodeId: 'n2' }),
    assert.deepEqual(received, [
      { source: 'canvas', nodeId: 'n1' },
      { source: 'canvas', nodeId: 'n2' },
    ]),
    assert.equal(subscribeGenerationCompleteNotificationClicks('not-a-function')(), undefined));
  unsubscribe();
  (assert.deepEqual(unsubscribeCalls, [true]),
    dispatchCompletionClick({ source: 'canvas', nodeId: 'n3' }),
    assert.equal(received.length, 2));
});

test('completionNotificationService: task status notifications reuse the toast and native channels', async () => {
  const toasts = [];
  const delivered = [];
  const played = [];
  (setCompletionSoundSettingsCache({ enabled: true, notificationEnabled: true, volume: 0.5 }),
    (globalThis.window = {
      electronAPI: {
        notification: {
          showGenerationComplete: async (payload) => (delivered.push(payload), { success: true }),
        },
        notificationSound: { play: async (payload) => (played.push(payload), { success: true }) },
      },
      showToast: (...args) => toasts.push(args),
    }));
  await showTaskStatusNotification({ body: '生成失败', navigation: { source: 'canvas', nodeId: 'n1' } });
  (assert.equal(toasts.length, 1),
    assert.equal(toasts[0][0], '生成失败'),
    assert.equal(toasts[0][1], 'error'),
    assert.equal(toasts[0][3].ariaLabel, '生成失败，点击查看任务'),
    assert.deepEqual(played, [{ system: true }]),
    assert.equal(delivered.length, 1),
    assert.equal(delivered[0].title, 'AI CanvasPro'),
    assert.equal(delivered[0].body, '生成失败'),
    assert.deepEqual(delivered[0].navigation, { source: 'canvas', nodeId: 'n1' }));
});

test('completionNotificationService: task status notifications without navigation skip the toast action', async () => {
  const toasts = [];
  (setCompletionSoundSettingsCache({ enabled: false, notificationEnabled: false }),
    (globalThis.window = { electronAPI: {}, showToast: (...args) => toasts.push(args) }));
  await showTaskStatusNotification({ body: '任务中断' });
  (assert.equal(toasts.length, 1), assert.equal(toasts[0][1], 'error'), assert.deepEqual(toasts[0][3], {}));
});
