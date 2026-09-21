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
    const _0x2ad321 = normalizeCompletionSoundSettings({});
    (assert.equal(_0x2ad321.enabled, true),
      assert.equal(_0x2ad321.notificationEnabled, true),
      assert.equal(_0x2ad321.volume, 0.7),
      assert.equal(_0x2ad321.builtInPath, BUILT_IN_COMPLETION_SOUND_PATH),
      assert.equal(_0x2ad321.selectedFilePath, BUILT_IN_COMPLETION_SOUND_PATH));
  }),
  test('completionSoundService: plays built-in sound from relative asset path', async () => {
    const _0x1e5ddf = [];
    (setCompletionSoundSettingsCache({ enabled: true, volume: 0.35 }),
      __completionSoundServiceForTest.setAudioFactory((_0x122ad5) => ({
        set volume(_0x3c93ed) {
          _0x1e5ddf.push(['volume', _0x3c93ed]);
        },
        play: async () => {
          _0x1e5ddf.push(['play', _0x122ad5]);
        },
      })),
      await playCompletionSound('generation-success'),
      assert.deepEqual(_0x1e5ddf, [
        ['volume', 0.35],
        ['play', BUILT_IN_COMPLETION_SOUND_PATH],
      ]));
  }),
  test('completionSoundService: custom sound uses desktop preview URL', async () => {
    const _0x1284bb = [],
      _0x1c6f61 = [];
    ((globalThis.window = {
      electronAPI: {
        getLocalPreviewUrl: async (_0x2113e1) => {
          return (_0x1284bb.push(_0x2113e1), { url: 'aic-local-preview://preview/custom.mp3' });
        },
      },
    }),
      __completionSoundServiceForTest.setAudioFactory((_0x176274) => ({
        set volume(_0xd04870) {
          _0x1c6f61.push(['volume', _0xd04870]);
        },
        play: async () => {
          _0x1c6f61.push(['play', _0x176274]);
        },
      })));
    const _0x56046e = await previewCompletionSound({
      enabled: true,
      volume: 0.8,
      selectedFilePath: 'D:/sounds/custom.mp3',
    });
    (assert.equal(_0x56046e.ok, true),
      assert.deepEqual(_0x1284bb, [{ path: 'D:/sounds/custom.mp3', type: 'audio/mpeg' }]),
      assert.deepEqual(_0x1c6f61, [
        ['volume', 0.8],
        ['play', 'aic-local-preview://preview/custom.mp3'],
      ]));
  }),
  test('completionSoundService: preview failure is contained', async () => {
    const _0x2a8ae2 = [];
    ((console.warn = () => {}),
      (globalThis.window = { showToast: (_0x81dafd, _0x3cfee4) => _0x2a8ae2.push([_0x81dafd, _0x3cfee4]) }),
      __completionSoundServiceForTest.setAudioFactory(() => ({
        set volume(_0x449751) {},
        play: async () => {
          throw new Error('blocked');
        },
      })));
    const _0xb1ea9a = await previewCompletionSound({ enabled: true });
    (assert.equal(_0xb1ea9a.ok, false),
      assert.equal(_0xb1ea9a.error.message, 'blocked'),
      assert.deepEqual(_0x2a8ae2, [['提示音播放失败，请检查文件', 'warn']]));
  }));
