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
  set ['src'](value) {
    this.setAttribute('src', value);
  }
  ['getAttribute'](item) {
    return this._attrs.get(String(item)) || '';
  }
  ['setAttribute'](key, index) {
    this._attrs.set(String(key), String(index));
  }
  ['addEventListener'](result, data) {
    const options = String(result),
      list = this._listeners.get(options) || [];
    (list.push(data), this._listeners.set(options, list));
  }
  ['removeEventListener'](target, source) {
    const next = String(target),
      list2 = this._listeners.get(next) || [];
    this._listeners.set(
      next,
      list2.filter((item2) => item2 !== source),
    );
  }
  ['dispatchEventName'](type) {
    for (const run of this._listeners.get(String(type)) || []) {
      run({ type: type });
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
    const fakeVideoElement = new FakeVideoElement();
    ((fakeVideoElement.currentTime = 3),
      (fakeVideoElement.buffered = {
        length: 2,
        start(count) {
          return count === 0 ? 0 : 2.5;
        },
        end(count2) {
          return count2 === 0 ? 1 : 6;
        },
      }),
      assert.equal(getVideoBufferedAhead(fakeVideoElement), 3));
  }),
  test('playVideoWithRecovery ensures source, sets preload, then plays', async () => {
    const fakeVideoElement2 = new FakeVideoElement(),
      playVideoWithRecovery2 = await playVideoWithRecovery(fakeVideoElement2, {
        ensureSrc() {
          fakeVideoElement2.src = '/output/sample.mp4';
        },
      });
    (assert.equal(playVideoWithRecovery2, true),
      assert.equal(fakeVideoElement2.preload, 'auto'),
      assert.equal(fakeVideoElement2.loadCount, 0),
      assert.equal(fakeVideoElement2.playCount, 1),
      assert.equal(fakeVideoElement2.paused, false));
  }),
  test('playVideoWithRecovery requests play during an active media load without restarting it', async () => {
    const fakeVideoElement3 = new FakeVideoElement();
    ((fakeVideoElement3.src = '/output/sample.mp4'),
      (fakeVideoElement3.readyState = 0),
      (fakeVideoElement3.networkState = 2));
    const playVideoWithRecovery3 = playVideoWithRecovery(fakeVideoElement3, { readyTimeoutMs: 1000 });
    (await Promise.resolve(),
      await Promise.resolve(),
      assert.equal(fakeVideoElement3.playCount, 1),
      (fakeVideoElement3.readyState = 2),
      (fakeVideoElement3.networkState = 1),
      fakeVideoElement3.dispatchEventName('loadeddata'));
    const current = await playVideoWithRecovery3;
    (assert.equal(current, true),
      assert.equal(fakeVideoElement3.preload, 'auto'),
      assert.equal(fakeVideoElement3.loadCount, 0),
      assert.equal(fakeVideoElement3.playCount, 1),
      assert.equal(fakeVideoElement3.paused, false));
  }),
  test('playVideoWithRecovery does not reload an idle metadata-ready video', async () => {
    const fakeVideoElement4 = new FakeVideoElement();
    ((fakeVideoElement4.src = '/output/sample.mp4'),
      (fakeVideoElement4.readyState = 1),
      (fakeVideoElement4.networkState = 1),
      setTimeout(() => {
        ((fakeVideoElement4.readyState = 2), fakeVideoElement4.dispatchEventName('loadeddata'));
      }, 0));
    const playVideoWithRecovery4 = await playVideoWithRecovery(fakeVideoElement4, { readyTimeoutMs: 1000 });
    (assert.equal(playVideoWithRecovery4, true),
      assert.equal(fakeVideoElement4.preload, 'auto'),
      assert.equal(fakeVideoElement4.loadCount, 0),
      assert.equal(fakeVideoElement4.playCount, 1),
      assert.equal(fakeVideoElement4.paused, false));
  }),
  test('playVideoWithRecovery defers stalled reload during playback startup', async () => {
    const fakeVideoElement5 = new FakeVideoElement();
    ((fakeVideoElement5.src = '/output/sample.mp4'), (fakeVideoElement5.readyState = 1));
    const playVideoWithRecovery5 = await playVideoWithRecovery(fakeVideoElement5, {
      recoveryDebounceMs: 50,
      startupRecoveryGraceMs: 180,
      startupRecoveryMinPlayedSeconds: 0.08,
    });
    (assert.equal(playVideoWithRecovery5, true),
      assert.equal(fakeVideoElement5.paused, false),
      (fakeVideoElement5.readyState = 1),
      fakeVideoElement5.dispatchEventName('waiting'),
      await new Promise((entry) => setTimeout(entry, 90)),
      assert.equal(fakeVideoElement5.loadCount, 0),
      await new Promise((record) => setTimeout(record, 170)),
      assert.equal(fakeVideoElement5.loadCount, 1));
  }),
  test('playVideoWithRecovery pauses the previous active video before playing another', async () => {
    const fakeVideoElement6 = new FakeVideoElement();
    ((fakeVideoElement6.readyState = 2), (fakeVideoElement6.src = '/output/first.mp4'));
    const fakeVideoElement7 = new FakeVideoElement();
    ((fakeVideoElement7.readyState = 2),
      (fakeVideoElement7.src = '/output/second.mp4'),
      assert.equal(await playVideoWithRecovery(fakeVideoElement6), true),
      assert.equal(fakeVideoElement6.paused, false),
      assert.equal(await playVideoWithRecovery(fakeVideoElement7), true),
      assert.equal(fakeVideoElement6.paused, true),
      assert.equal(fakeVideoElement6.pauseCount, 1),
      assert.equal(fakeVideoElement7.paused, false));
  }),
  test('playVideoWithRecovery can allow concurrent video playback', async () => {
    const fakeVideoElement8 = new FakeVideoElement();
    ((fakeVideoElement8.readyState = 2), (fakeVideoElement8.src = '/output/first.mp4'));
    const fakeVideoElement9 = new FakeVideoElement();
    ((fakeVideoElement9.readyState = 2),
      (fakeVideoElement9.src = '/output/second.mp4'),
      assert.equal(await playVideoWithRecovery(fakeVideoElement8), true),
      assert.equal(fakeVideoElement8.paused, false),
      assert.equal(await playVideoWithRecovery(fakeVideoElement9, { allowConcurrent: true }), true),
      assert.equal(fakeVideoElement8.paused, false),
      assert.equal(fakeVideoElement8.pauseCount, 0),
      assert.equal(fakeVideoElement9.paused, false));
  }));
