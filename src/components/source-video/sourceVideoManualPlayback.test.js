import test from 'node:test';
import assert from 'node:assert/strict';

import {
  setSourceVideoManualLoopPlayback,
  toggleSourceVideoManualPlayback,
} from './sourceVideoManualPlayback.js';

test('sourceVideoManualPlayback: enables loop only when the active clip needs manual looping', () => {
  const activeController = {
    _video: { loop: true },
    _isManualLoopPlayback: false,
    _getBaseDuration: () => 10,
    _getClipRange: () => ({ active: true, start: 2, end: 8 }),
  };
  setSourceVideoManualLoopPlayback(activeController, true);
  assert.equal(activeController._isManualLoopPlayback, true);
  assert.equal(activeController._video.loop, false);

  const fullController = {
    _video: { loop: false },
    _isManualLoopPlayback: false,
    _getBaseDuration: () => 10,
    _getClipRange: () => ({ active: false, start: 0, end: 10 }),
  };
  setSourceVideoManualLoopPlayback(fullController, true);
  assert.equal(fullController._video.loop, true);

  setSourceVideoManualLoopPlayback(fullController, false);
  assert.equal(fullController._isManualLoopPlayback, false);
  assert.equal(fullController._video.loop, false);
});

test('sourceVideoManualPlayback: starts from the clip start and reports successful playback', async () => {
  const video = {
    paused: true,
    ended: false,
    currentTime: 5,
    loop: false,
    pause() {
      this.paused = true;
    },
  };
  const calls = [];
  const controller = {
    _currentSrc: 'https://cdn.example/video.mp4',
    _video: video,
    _autoPlayToken: 0,
    _isManualControl: false,
    _hoverManualPause: true,
    _ensureVideoElement: () => video,
    _syncPlaybackChromeVisibility: () => calls.push('chrome'),
    _syncRendererPlaybackPin: () => calls.push('pin'),
    _setManualLoopPlayback: (loop) => calls.push(['loop', loop]),
    _getBaseDuration: () => 10,
    _getClipRange: () => ({ active: true, start: 2, end: 8 }),
    _playVideoWithRecovery: async (label, shouldContinue) => {
      calls.push(['play', label, shouldContinue()]);
      return true;
    },
    _flashCenterIndicator: (kind) => calls.push(['flash', kind]),
  };

  toggleSourceVideoManualPlayback(controller, { loop: true });
  await Promise.resolve();

  assert.equal(controller._autoPlayToken, 1);
  assert.equal(controller._isManualControl, true);
  assert.equal(controller._hoverManualPause, false);
  assert.equal(video.currentTime, 5);
  assert.deepEqual(calls.slice(0, 4), ['chrome', 'pin', ['loop', true], ['play', 'manual', true]]);
  assert.deepEqual(calls.at(-1), ['flash', 'play']);
});

test('sourceVideoManualPlayback: rolls back manual mode when playback fails and pauses on toggle-off', async () => {
  const video = {
    paused: true,
    ended: false,
    currentTime: 0,
    pause() {
      this.paused = true;
    },
  };
  const calls = [];
  const controller = {
    _currentSrc: 'https://cdn.example/video.mp4',
    _video: video,
    _autoPlayToken: 0,
    _isManualControl: false,
    _hoverManualPause: true,
    _ensureVideoElement: () => video,
    _syncPlaybackChromeVisibility: () => calls.push('chrome'),
    _syncRendererPlaybackPin: () => calls.push('pin'),
    _setManualLoopPlayback: (loop) => calls.push(['loop', loop]),
    _getBaseDuration: () => 10,
    _getClipRange: () => ({ active: false, start: 0, end: 10 }),
    _playVideoWithRecovery: async () => false,
    _flashCenterIndicator: (kind) => calls.push(['flash', kind]),
  };

  toggleSourceVideoManualPlayback(controller);
  await Promise.resolve();
  assert.deepEqual(calls.slice(-3), [['loop', false], 'chrome', 'pin']);

  calls.length = 0;
  video.paused = false;
  toggleSourceVideoManualPlayback(controller);
  assert.equal(video.paused, true);
  assert.equal(controller._hoverManualPause, true);
  assert.deepEqual(calls.slice(-3), [['loop', false], ['flash', 'pause'], 'pin']);
});
