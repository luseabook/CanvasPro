import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  clearCompletionSoundSettingsCache,
  setCompletionSoundSettingsCache,
} from './completionSoundService.js';
import { showGenerationCompleteNotification } from './completionNotificationService.js';
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
