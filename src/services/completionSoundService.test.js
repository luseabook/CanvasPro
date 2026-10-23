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
        electronAPI: {
          notificationSound: { play: async () => ({ success: false, reason: 'player-exit' }) },
        },
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

// ---------------------------------------------------------------------------
// 207 批：http-compat（浏览器连桌面后端）下的系统提示音。
// 该运行时读不到本地文件，必须由宿主给出可播放 URL 或直接由宿主播放；
// 0.4.12 版直接走 window.electronAPI，这两个能力整块缺失。
// ---------------------------------------------------------------------------
test('completionSoundService: shim 运行时用宿主编排好的播放地址', async () => {
  const played = [];
  let askedLocalPreview = 0;
  globalThis.window = {
    electronAPI: {
      __aicDesktopHttpShim: true,
      getLocalPreviewUrl: async () => {
        askedLocalPreview += 1;
        return { url: 'should-not-happen' };
      },
      notificationSound: {
        listSystemSounds: async () => ({
          files: [
            { path: 'C://Windows//Media//Alarm01.wav', playbackUrl: 'aic-sound://alarm01' },
            { path: 'C://Windows//Media//Alarm02.wav', playbackUrl: 'aic-sound://alarm02' },
          ],
        }),
        play: async () => ({ success: false, reason: 'native-disabled' }),
      },
    },
  };
  __completionSoundServiceForTest.setAudioFactory((url) => {
    played.push(url);
    return { set volume(value) {}, play: async () => {} };
  });
  const outcome = await previewCompletionSound({
    enabled: true,
    selectedFilePath: 'c://windows//media//alarm02.wav',
  });
  assert.equal(outcome.ok, true);
  assert.deepEqual(played, ['aic-sound://alarm02'], '大小写与斜杠方向不同的同一文件要能匹配上');
  assert.equal(askedLocalPreview, 0, 'shim 运行时不该再走本地文件预览通道');
});

test('completionSoundService: shim 运行时找不到系统音就明确报错，而不是喂一个本地路径给浏览器', async () => {
  globalThis.window = {
    electronAPI: {
      __aicDesktopHttpShim: true,
      notificationSound: {
        listSystemSounds: async () => ({ files: [] }),
        play: async () => ({ success: false, reason: 'native-disabled' }),
      },
    },
  };
  const prevWarn = console.warn;
  console.warn = () => {};
  try {
    const outcome = await previewCompletionSound({
      enabled: true,
      selectedFilePath: 'D:/sounds/missing.mp3',
    });
    assert.equal(outcome.ok, false);
    assert.match(
      String(outcome.error?.message || ''),
      /unavailable to the browser runtime/,
      '要说明是「浏览器运行时拿不到系统音」，而不是笼统的播放失败'
    );
  } finally {
    console.warn = prevWarn;
  }
});

test('completionSoundService: shim 运行时优先让宿主播放，不进浏览器音频', async () => {
  const nativeCalls = [];
  let audioCreated = 0;
  globalThis.window = {
    electronAPI: {
      __aicDesktopHttpShim: true,
      notificationSound: {
        play: async (options) => {
          nativeCalls.push(options);
          return { success: true };
        },
      },
    },
  };
  __completionSoundServiceForTest.setAudioFactory((url) => {
    audioCreated += 1;
    return { set volume(value) {}, play: async () => {} };
  });
  const outcome = await previewCompletionSound({
    enabled: true,
    volume: 0.4,
    selectedFilePath: 'D:/sounds/a.mp3',
  });
  assert.equal(outcome.ok, true);
  assert.equal(outcome.native, true);
  assert.deepEqual(nativeCalls, [
    { filePath: 'D:/sounds/a.mp3', volume: 0.4, reason: 'generation-success' },
  ]);
  assert.equal(audioCreated, 0, '宿主能放就不要再建 <audio>');
});

test('completionSoundService: 相对资源路径不做本地文件转换', async () => {
  let askedPreview = 0;
  globalThis.window = {
    electronAPI: {
      getLocalPreviewUrl: async () => {
        askedPreview += 1;
        return { url: 'should-not-happen' };
      },
    },
  };
  const played = [];
  __completionSoundServiceForTest.setAudioFactory((url) => {
    played.push(url);
    return { set volume(value) {}, play: async () => {} };
  });
  const outcome = await previewCompletionSound({
    enabled: true,
    selectedFilePath: BUILT_IN_COMPLETION_SOUND_PATH,
  });
  assert.equal(outcome.ok, true);
  assert.deepEqual(played, [BUILT_IN_COMPLETION_SOUND_PATH], '内置音是打包资源，直接用相对路径');
  assert.equal(askedPreview, 0);
});
