import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __resetVideoPlaybackRecoveryForTest,
  getVideoBufferedAhead,
  playVideoWithRecovery,
} from './mediaPlaybackRecovery.js';
class FakeVideoElement {
  constructor() {
    ((this._attrs = new Map()),
      (this._listeners = new Map()),
      (this.currentTime = 0),
      (this.duration = 10),
      (this.readyState = 0),
      (this.networkState = 1),
      (this.paused = true),
      (this.preload = ''),
      (this.loadCount = 0),
      (this.playCount = 0),
      (this.pauseCount = 0),
      (this.buffered = {
        length: 0,
        start() {
          return 0;
        },
        end() {
          return 0;
        },
      }));
  }
  get ['currentSrc']() {
    return '';
  }
  get ['src']() {
    return this.getAttribute('src');
  }
  set ['src'](_0x11a320) {
    this.setAttribute('src', _0x11a320);
  }
  ['getAttribute'](_0x3427d3) {
    return this._attrs.get(String(_0x3427d3)) || '';
  }
  ['setAttribute'](_0x543cef, _0x21b2ef) {
    this._attrs.set(String(_0x543cef), String(_0x21b2ef));
  }
  ['addEventListener'](_0xb01bf5, _0x1996e6) {
    const _0x28521e = String(_0xb01bf5),
      _0x5e137e = this._listeners.get(_0x28521e) || [];
    (_0x5e137e.push(_0x1996e6), this._listeners.set(_0x28521e, _0x5e137e));
  }
  ['removeEventListener'](_0x5c3fb4, _0x2d9e44) {
    const _0x3e498b = String(_0x5c3fb4),
      _0x17471e = this._listeners.get(_0x3e498b) || [];
    this._listeners.set(
      _0x3e498b,
      _0x17471e.filter((_0x1e8955) => _0x1e8955 !== _0x2d9e44),
    );
  }
  ['dispatchEventName'](_0x3885b4) {
    for (const _0x166f28 of this._listeners.get(String(_0x3885b4)) || []) {
      _0x166f28({ type: _0x3885b4 });
    }
  }
  ['load']() {
    ((this.loadCount += 1), (this.readyState = 2), this.dispatchEventName('loadeddata'));
  }
  ['play']() {
    return ((this.playCount += 1), (this.paused = false), Promise.resolve());
  }
  ['pause']() {
    ((this.pauseCount += 1), (this.paused = true));
  }
}
(test.afterEach(() => {
  __resetVideoPlaybackRecoveryForTest();
}),
  test('getVideoBufferedAhead returns buffered seconds at current time', () => {
    const _0x41cabd = new FakeVideoElement();
    ((_0x41cabd.currentTime = 3),
      (_0x41cabd.buffered = {
        length: 2,
        start(_0x41a91e) {
          return _0x41a91e === 0 ? 0 : 2.5;
        },
        end(_0x507eac) {
          return _0x507eac === 0 ? 1 : 6;
        },
      }),
      assert.equal(getVideoBufferedAhead(_0x41cabd), 3));
  }),
  test('playVideoWithRecovery ensures source, sets preload, then plays', async () => {
    const _0x21b11d = new FakeVideoElement(),
      _0x4222e7 = await playVideoWithRecovery(_0x21b11d, {
        ensureSrc() {
          _0x21b11d.src = '/output/sample.mp4';
        },
      });
    (assert.equal(_0x4222e7, true),
      assert.equal(_0x21b11d.preload, 'auto'),
      assert.equal(_0x21b11d.loadCount, 0),
      assert.equal(_0x21b11d.playCount, 1),
      assert.equal(_0x21b11d.paused, false));
  }),
  test('playVideoWithRecovery requests play during an active media load without restarting it', async () => {
    const _0xe3f63c = new FakeVideoElement();
    ((_0xe3f63c.src = '/output/sample.mp4'), (_0xe3f63c.readyState = 0), (_0xe3f63c.networkState = 2));
    const _0x190833 = playVideoWithRecovery(_0xe3f63c, { readyTimeoutMs: 0x3e8 });
    (await Promise.resolve(),
      await Promise.resolve(),
      assert.equal(_0xe3f63c.playCount, 1),
      (_0xe3f63c.readyState = 2),
      (_0xe3f63c.networkState = 1),
      _0xe3f63c.dispatchEventName('loadeddata'));
    const _0x3fd1c5 = await _0x190833;
    (assert.equal(_0x3fd1c5, true),
      assert.equal(_0xe3f63c.preload, 'auto'),
      assert.equal(_0xe3f63c.loadCount, 0),
      assert.equal(_0xe3f63c.playCount, 1),
      assert.equal(_0xe3f63c.paused, false));
  }),
  test('playVideoWithRecovery does not reload an idle metadata-ready video', async () => {
    const _0x5b52fb = new FakeVideoElement();
    ((_0x5b52fb.src = '/output/sample.mp4'),
      (_0x5b52fb.readyState = 1),
      (_0x5b52fb.networkState = 1),
      setTimeout(() => {
        ((_0x5b52fb.readyState = 2), _0x5b52fb.dispatchEventName('loadeddata'));
      }, 0));
    const _0x3eb7aa = await playVideoWithRecovery(_0x5b52fb, { readyTimeoutMs: 0x3e8 });
    (assert.equal(_0x3eb7aa, true),
      assert.equal(_0x5b52fb.preload, 'auto'),
      assert.equal(_0x5b52fb.loadCount, 0),
      assert.equal(_0x5b52fb.playCount, 1),
      assert.equal(_0x5b52fb.paused, false));
  }),
  test('playVideoWithRecovery defers stalled reload during playback startup', async () => {
    const _0x532411 = new FakeVideoElement();
    ((_0x532411.src = '/output/sample.mp4'), (_0x532411.readyState = 1));
    const _0x2140a1 = await playVideoWithRecovery(_0x532411, {
      recoveryDebounceMs: 50,
      startupRecoveryGraceMs: 180,
      startupRecoveryMinPlayedSeconds: 0.08,
    });
    (assert.equal(_0x2140a1, true),
      assert.equal(_0x532411.paused, false),
      (_0x532411.readyState = 1),
      _0x532411.dispatchEventName('waiting'),
      await new Promise((_0xb655b8) => setTimeout(_0xb655b8, 90)),
      assert.equal(_0x532411.loadCount, 0),
      await new Promise((_0x4c248c) => setTimeout(_0x4c248c, 170)),
      assert.equal(_0x532411.loadCount, 1));
  }),
  test('playVideoWithRecovery pauses the previous active video before playing another', async () => {
    const _0x2c52c0 = new FakeVideoElement();
    ((_0x2c52c0.readyState = 2), (_0x2c52c0.src = '/output/first.mp4'));
    const _0x77ec7b = new FakeVideoElement();
    ((_0x77ec7b.readyState = 2),
      (_0x77ec7b.src = '/output/second.mp4'),
      assert.equal(await playVideoWithRecovery(_0x2c52c0), true),
      assert.equal(_0x2c52c0.paused, false),
      assert.equal(await playVideoWithRecovery(_0x77ec7b), true),
      assert.equal(_0x2c52c0.paused, true),
      assert.equal(_0x2c52c0.pauseCount, 1),
      assert.equal(_0x77ec7b.paused, false));
  }),
  test('playVideoWithRecovery can allow concurrent video playback', async () => {
    const _0x42e789 = new FakeVideoElement();
    ((_0x42e789.readyState = 2), (_0x42e789.src = '/output/first.mp4'));
    const _0x1d995c = new FakeVideoElement();
    ((_0x1d995c.readyState = 2),
      (_0x1d995c.src = '/output/second.mp4'),
      assert.equal(await playVideoWithRecovery(_0x42e789), true),
      assert.equal(_0x42e789.paused, false),
      assert.equal(await playVideoWithRecovery(_0x1d995c, { allowConcurrent: true }), true),
      assert.equal(_0x42e789.paused, false),
      assert.equal(_0x42e789.pauseCount, 0),
      assert.equal(_0x1d995c.paused, false));
  }));
