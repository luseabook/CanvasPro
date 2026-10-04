import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  __completionSoundServiceForTest,
  BUILT_IN_COMPLETION_SOUND_PATH,
  clearCompletionSoundSettingsCache,
  normalizeCompletionSoundSettings,
  playCompletionSound,
  previewCompletionSound,
  setCompletionSoundSettingsCache,
} from './completionSoundService.js';
const originalWindow = globalThis.window,
  originalAudio = globalThis.Audio,
  originalConsoleWarn = console.warn;
(afterEach(() => {
  (__completionSoundServiceForTest.reset(), clearCompletionSoundSettingsCache());
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalAudio === undefined) delete globalThis.Audio;
  else globalThis.Audio = originalAudio;
  console.warn = originalConsoleWarn;
}),
  test('completionSoundService: normalizes defaults to built-in sound', () => {
    const completionSoundSettings = normalizeCompletionSoundSettings({});
    (assert.equal(completionSoundSettings.enabled, true),
      assert.equal(completionSoundSettings.notificationEnabled, true),
      assert.equal(completionSoundSettings.volume, 0.7),
      assert.equal(completionSoundSettings.builtInPath, BUILT_IN_COMPLETION_SOUND_PATH),
      assert.equal(completionSoundSettings.selectedFilePath, BUILT_IN_COMPLETION_SOUND_PATH));
  }),
  test('completionSoundService: plays built-in sound from relative asset path', async () => {
    const list = [];
    (setCompletionSoundSettingsCache({ enabled: true, volume: 0.35 }),
      __completionSoundServiceForTest.setAudioFactory((value) => ({
        set volume(item) {
          list.push(['volume', item]);
        },
        play: async () => {
          list.push(['play', value]);
        },
      })),
      await playCompletionSound('generation-success'),
      assert.deepEqual(list, [
        ['volume', 0.35],
        ['play', BUILT_IN_COMPLETION_SOUND_PATH],
      ]));
  }),
  test('completionSoundService: custom sound uses desktop preview URL', async () => {
    const list2 = [],
      list3 = [];
    ((globalThis.window = {
      electronAPI: {
        getLocalPreviewUrl: async (key) => {
          return (list2.push(key), { url: 'aic-local-preview://preview/custom.mp3' });
        },
      },
    }),
      __completionSoundServiceForTest.setAudioFactory((index) => ({
        set volume(result) {
          list3.push(['volume', result]);
        },
        play: async () => {
          list3.push(['play', index]);
        },
      })));
    const response = await previewCompletionSound({
      enabled: true,
      volume: 0.8,
      selectedFilePath: 'D:/sounds/custom.mp3',
    });
    (assert.equal(response.ok, true),
      assert.deepEqual(list2, [{ path: 'D:/sounds/custom.mp3', type: 'audio/mpeg' }]),
      assert.deepEqual(list3, [
        ['volume', 0.8],
        ['play', 'aic-local-preview://preview/custom.mp3'],
      ]));
  }),
  test('completionSoundService: preview failure is contained', async () => {
    const list4 = [];
    ((console.warn = () => {}),
      (globalThis.window = { showToast: (data, options) => list4.push([data, options]) }),
      __completionSoundServiceForTest.setAudioFactory(() => ({
        set volume(target) {},
        play: async () => {
          throw new Error('blocked');
        },
      })));
    const response2 = await previewCompletionSound({ enabled: true });
    (assert.equal(response2.ok, false),
      assert.equal(response2.error.message, 'blocked'),
      assert.deepEqual(list4, [['提示音播放失败，请检查文件', 'warn']]));
  }),
  test('completionSoundService: native playback rescues a blocked browser play', async () => {
    const list5 = [];
    ((console.warn = () => {}),
      (globalThis.window = {
        electronAPI: {
          notificationSound: {
            play: async (source) => {
              return (list5.push(source), { success: true, played: true });
            },
          },
        },
      }),
      __completionSoundServiceForTest.setAudioFactory(() => ({
        set volume(next) {},
        play: async () => {
          throw new Error('autoplay-blocked');
        },
      })));
    const response3 = await previewCompletionSound({
      enabled: true,
      volume: 0.8,
      selectedFilePath: 'D:/sounds/custom.mp3',
    });
    (assert.equal(response3.ok, true),
      assert.equal(response3.native, true),
      assert.deepEqual(list5, [
        { filePath: 'D:/sounds/custom.mp3', volume: 0.8, reason: 'generation-success' },
      ]));
  }),
  test('completionSoundService: native playback failure keeps the original error', async () => {
    const list6 = [];
    ((console.warn = () => {}),
      (globalThis.window = {
        electronAPI: { notificationSound: { play: async () => ({ success: false, reason: 'player-exit' }) } },
        showToast: (current, entry) => list6.push([current, entry]),
      }),
      __completionSoundServiceForTest.setAudioFactory(() => ({
        set volume(record) {},
        play: async () => {
          throw new Error('blocked');
        },
      })));
    const response4 = await previewCompletionSound({
      enabled: true,
      selectedFilePath: 'D:/sounds/custom.mp3',
    });
    (assert.equal(response4.ok, false),
      assert.equal(response4.error.message, 'blocked'),
      assert.deepEqual(list6, [['提示音播放失败，请检查文件', 'warn']]));
  }));
