import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __desktopMediaBlobSourceForTest,
  attachDesktopMediaPlaybackSource,
  attachMediaElementPlaybackSource,
} from './desktopMediaBlobSource.js';
const previousWindow = globalThis.window,
  previousLocation = globalThis.location;
(test.afterEach(() => {
  __desktopMediaBlobSourceForTest.clearBlobCacheForTest();
  if (typeof previousWindow === 'undefined') delete globalThis.window;
  else globalThis.window = previousWindow;
  if (typeof previousLocation === 'undefined') delete globalThis.location;
  else globalThis.location = previousLocation;
}),
  test('desktop media playback source: Electron local media resolves as local preview candidate', () => {
    ((globalThis.window = { electronAPI: {} }),
      (globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' }),
      assert.equal(__desktopMediaBlobSourceForTest.isDesktopBlobCandidate('/output/a.mp4'), false),
      assert.equal(
        __desktopMediaBlobSourceForTest.isDesktopBlobCandidate('https://example.com/a.mp4'),
        false,
      ),
      assert.equal(__desktopMediaBlobSourceForTest.isDesktopBlobCandidate('blob:http://127.0.0.1/x'), false),
      assert.equal(
        __desktopMediaBlobSourceForTest.normalizeDesktopLocalMediaPath('/output/a.mp4'),
        '/output/a.mp4',
      ),
      assert.equal(
        __desktopMediaBlobSourceForTest.normalizeDesktopLocalMediaPath('http://127.0.0.1:8777/output/a.mp4'),
        '/output/a.mp4',
      ));
  }),
  test('desktop media playback source: audio attaches Electron local preview', async () => {
    const list = [];
    ((globalThis.window = {
      electronAPI: {
        getLocalPreviewUrl(value) {
          return (list.push(value), { url: 'aic-local-preview://preview/audio-token/a.mp3' });
        },
      },
    }),
      (globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' }));
    const el = {
        dataset: {},
        preload: 'none',
        loadCount: 0,
        getAttribute() {
          return '';
        },
        set src(item) {
          this._src = item;
        },
        get src() {
          return this._src || '';
        },
        load() {
          this.loadCount += 1;
        },
      },
      attachDesktopMediaPlaybackSource2 = await attachDesktopMediaPlaybackSource(el, '/output/a.mp3', {
        preload: 'auto',
      });
    (assert.equal(attachDesktopMediaPlaybackSource2, 'aic-local-preview://preview/audio-token/a.mp3'),
      assert.equal(el.src, 'aic-local-preview://preview/audio-token/a.mp3'),
      assert.equal(el.preload, 'auto'),
      assert.equal(el.loadCount, 1),
      assert.equal(el.dataset.desktopMediaSourceUrl, 'http://127.0.0.1:8777/output/a.mp3'),
      assert.deepEqual(list, [{ localPath: '/output/a.mp3', type: 'audio/mpeg' }]));
  }),
  test('desktop media playback source: video attaches Electron local preview', async () => {
    const list2 = [];
    ((globalThis.window = {
      electronAPI: {
        getLocalPreviewUrl(key) {
          return (list2.push(key), { url: 'aic-local-preview://preview/video-token/a.mp4' });
        },
      },
    }),
      (globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' }));
    const el2 = {
        dataset: {},
        preload: 'none',
        loadCount: 0,
        getAttribute() {
          return '';
        },
        set src(index) {
          this._src = index;
        },
        get src() {
          return this._src || '';
        },
        load() {
          this.loadCount += 1;
        },
      },
      attachDesktopMediaPlaybackSource3 = await attachDesktopMediaPlaybackSource(el2, '/output/a.mp4', {
        preload: 'auto',
      });
    (assert.equal(attachDesktopMediaPlaybackSource3, 'aic-local-preview://preview/video-token/a.mp4'),
      assert.equal(el2.src, 'aic-local-preview://preview/video-token/a.mp4'),
      assert.equal(el2.preload, 'auto'),
      assert.equal(el2.loadCount, 1),
      assert.equal(el2.dataset.desktopMediaSourceUrl, 'http://127.0.0.1:8777/output/a.mp4'),
      assert.deepEqual(list2, [{ localPath: '/output/a.mp4', type: 'video/mp4' }]));
  }),
  test('desktop media playback source: generic attach keeps web direct source synchronous', async () => {
    ((globalThis.window = {}),
      (globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' }));
    const result = {
        preload: 'metadata',
        loadCount: 0,
        getAttribute() {
          return '';
        },
        set src(data) {
          this._src = data;
        },
        get src() {
          return this._src || '';
        },
        load() {
          this.loadCount += 1;
        },
      },
      attachMediaElementPlaybackSource2 = attachMediaElementPlaybackSource(result, '/output/web.mp3');
    (await attachMediaElementPlaybackSource2,
      assert.equal(result.src, '/output/web.mp3'),
      assert.equal(result.preload, 'metadata'),
      assert.equal(result.loadCount, 1),
      assert.equal(await attachMediaElementPlaybackSource2, '/output/web.mp3'));
  }));
function createMediaElement(tagName = 'VIDEO') {
  return {
    tagName: tagName,
    dataset: {},
    preload: 'none',
    loadCount: 0,
    getAttribute(name) {
      return name === 'src' ? this._src || '' : '';
    },
    setAttribute(name, value) {
      if (name === 'src') this._src = value;
    },
    set src(value) {
      this._src = value;
    },
    get src() {
      return this._src || '';
    },
    load() {
      this.loadCount += 1;
    },
  };
}
test('desktop media playback source: shouldAssign 为假时不写 src 也不 load', async () => {
  globalThis.window = { electronAPI: {} };
  globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' };
  const el = createMediaElement();
  const returned = await attachMediaElementPlaybackSource(el, '/output/a.mp4', {
    preload: 'auto',
    shouldAssign: () => false,
  });
  assert.equal(returned, '');
  assert.equal(el.src, '');
  assert.equal(el.loadCount, 0);
  assert.equal(el.dataset.desktopMediaSourceUrl, undefined);
});
test('desktop media playback source: onSourceAssigned 在赋值后触发且带原始与播放地址', async () => {
  globalThis.window = {
    electronAPI: { getLocalPreviewUrl: () => ({ url: 'aic-local-preview://preview/v/a.mp4' }) },
  };
  globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' };
  const el = createMediaElement();
  const seen = [];
  await attachMediaElementPlaybackSource(el, '/output/a.mp4', {
    preload: 'auto',
    onSourceAssigned: (payload) => seen.push({ ...payload, srcAtCallback: el.src }),
  });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].originalSourceUrl, 'http://127.0.0.1:8777/output/a.mp4');
  assert.equal(seen[0].playbackUrl, 'aic-local-preview://preview/v/a.mp4');
  assert.equal(seen[0].srcAtCallback, 'aic-local-preview://preview/v/a.mp4');
});
test('desktop media playback source: 显式 playbackUrl 时不再向桥请求', async () => {
  let bridgeCalls = 0;
  globalThis.window = {
    electronAPI: {
      getLocalPreviewUrl: () => {
        bridgeCalls += 1;
        return { url: 'aic-local-preview://preview/v/unused.mp4' };
      },
    },
  };
  globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' };
  const el = createMediaElement();
  await attachMediaElementPlaybackSource(el, '/output/a.mp4', {
    playbackUrl: 'blob:http://127.0.0.1:8777/reuse-token',
    preload: 'auto',
  });
  assert.equal(bridgeCalls, 0);
  assert.equal(el.src, 'blob:http://127.0.0.1:8777/reuse-token');
});
test('desktop media playback source: 同一路径并发只协商一次', async () => {
  let bridgeCalls = 0;
  globalThis.window = {
    electronAPI: {
      getLocalPreviewUrl: async () => {
        bridgeCalls += 1;
        await Promise.resolve();
        return { url: 'aic-local-preview://preview/v/a.mp4' };
      },
    },
  };
  globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' };
  const first = __desktopMediaBlobSourceForTest.resolveDesktopMediaPlaybackUrl('/output/a.mp4');
  const second = __desktopMediaBlobSourceForTest.resolveDesktopMediaPlaybackUrl('/output/a.mp4');
  assert.deepEqual(await Promise.all([first, second]), [
    'aic-local-preview://preview/v/a.mp4',
    'aic-local-preview://preview/v/a.mp4',
  ]);
  assert.equal(bridgeCalls, 1);
});
test('desktop media playback source: 本地预览协议补 crossOrigin 且不重复赋值', async () => {
  globalThis.window = {
    electronAPI: { getLocalPreviewUrl: () => ({ url: 'aic-local-preview://preview/v/a.mp4' }) },
  };
  globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' };
  const el = createMediaElement();
  el.crossOrigin = null;
  await attachMediaElementPlaybackSource(el, '/output/a.mp4', { preload: 'auto' });
  assert.equal(el.crossOrigin, 'anonymous');
  assert.equal(el.loadCount, 1);
  await attachMediaElementPlaybackSource(el, '/output/a.mp4', { preload: 'auto' });
  assert.equal(el.crossOrigin, 'anonymous');
  assert.equal(el.loadCount, 1);
});
test('desktop media playback source: chrome-shell 下 audio 在 loopback 别名间改写', async () => {
  globalThis.window = { __AIC_CHROME_SHELL__: true };
  globalThis.location = {
    href: 'http://127.0.0.1:8777/',
    origin: 'http://127.0.0.1:8777',
    protocol: 'http:',
    hostname: '127.0.0.1',
    search: '?aicRuntime=chrome-shell',
  };
  const el = createMediaElement('AUDIO');
  await attachMediaElementPlaybackSource(el, 'http://127.0.0.1:8777/output/a.mp3', { preload: 'auto' });
  assert.equal(el.src, 'http://localhost:8777/output/a.mp3');
  assert.equal(el.dataset.desktopMediaSourceUrl, 'http://127.0.0.1:8777/output/a.mp3');
});
