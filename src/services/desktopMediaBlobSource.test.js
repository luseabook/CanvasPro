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
