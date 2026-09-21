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
    const _0x273f81 = [];
    ((globalThis.window = {
      electronAPI: {
        getLocalPreviewUrl(_0x4c70e0) {
          return (_0x273f81.push(_0x4c70e0), { url: 'aic-local-preview://preview/audio-token/a.mp3' });
        },
      },
    }),
      (globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' }));
    const _0x402ac0 = {
        dataset: {},
        preload: 'none',
        loadCount: 0,
        getAttribute() {
          return '';
        },
        set src(_0x290612) {
          this._src = _0x290612;
        },
        get src() {
          return this._src || '';
        },
        load() {
          this.loadCount += 1;
        },
      },
      _0x160773 = await attachDesktopMediaPlaybackSource(_0x402ac0, '/output/a.mp3', { preload: 'auto' });
    (assert.equal(_0x160773, 'aic-local-preview://preview/audio-token/a.mp3'),
      assert.equal(_0x402ac0.src, 'aic-local-preview://preview/audio-token/a.mp3'),
      assert.equal(_0x402ac0.preload, 'auto'),
      assert.equal(_0x402ac0.loadCount, 1),
      assert.equal(_0x402ac0.dataset.desktopMediaSourceUrl, 'http://127.0.0.1:8777/output/a.mp3'),
      assert.deepEqual(_0x273f81, [{ localPath: '/output/a.mp3', type: 'audio/mpeg' }]));
  }),
  test('desktop media playback source: video attaches Electron local preview', async () => {
    const _0x4b7da8 = [];
    ((globalThis.window = {
      electronAPI: {
        getLocalPreviewUrl(_0x56e412) {
          return (_0x4b7da8.push(_0x56e412), { url: 'aic-local-preview://preview/video-token/a.mp4' });
        },
      },
    }),
      (globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' }));
    const _0x1f7d14 = {
        dataset: {},
        preload: 'none',
        loadCount: 0,
        getAttribute() {
          return '';
        },
        set src(_0x3a617d) {
          this._src = _0x3a617d;
        },
        get src() {
          return this._src || '';
        },
        load() {
          this.loadCount += 1;
        },
      },
      _0x2ca87d = await attachDesktopMediaPlaybackSource(_0x1f7d14, '/output/a.mp4', { preload: 'auto' });
    (assert.equal(_0x2ca87d, 'aic-local-preview://preview/video-token/a.mp4'),
      assert.equal(_0x1f7d14.src, 'aic-local-preview://preview/video-token/a.mp4'),
      assert.equal(_0x1f7d14.preload, 'auto'),
      assert.equal(_0x1f7d14.loadCount, 1),
      assert.equal(_0x1f7d14.dataset.desktopMediaSourceUrl, 'http://127.0.0.1:8777/output/a.mp4'),
      assert.deepEqual(_0x4b7da8, [{ localPath: '/output/a.mp4', type: 'video/mp4' }]));
  }),
  test('desktop media playback source: generic attach keeps web direct source synchronous', async () => {
    ((globalThis.window = {}),
      (globalThis.location = { href: 'http://127.0.0.1:8777/', origin: 'http://127.0.0.1:8777' }));
    const _0x31906b = {
        preload: 'metadata',
        loadCount: 0,
        getAttribute() {
          return '';
        },
        set src(_0xa23411) {
          this._src = _0xa23411;
        },
        get src() {
          return this._src || '';
        },
        load() {
          this.loadCount += 1;
        },
      },
      _0x1a0253 = attachMediaElementPlaybackSource(_0x31906b, '/output/web.mp3');
    (await _0x1a0253,
      assert.equal(_0x31906b.src, '/output/web.mp3'),
      assert.equal(_0x31906b.preload, 'metadata'),
      assert.equal(_0x31906b.loadCount, 1),
      assert.equal(await _0x1a0253, '/output/web.mp3'));
  }));
