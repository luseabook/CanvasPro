import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clearSourceVideoPlaybackFeedback,
  playSourceVideoWithFeedback,
} from './sourceVideoPlaybackFeedback.js';

function createCard() {
  const attributes = new Map();
  const classList = new Set();
  return {
    attributes,
    classList: {
      contains: (name) => classList.has(name),
      add: (name) => classList.add(name),
      remove: (name) => classList.delete(name),
    },
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

function createController({ readyState = 0, currentSrc = 'https://cdn.example/video.mp4' } = {}) {
  const video = {
    currentSrc,
    readyState,
    preload: '',
    paused: true,
    isConnected: true,
    playCalls: 0,
    pauseCalls: 0,
    addEventListener() {},
    play() {
      this.playCalls += 1;
      return Promise.resolve();
    },
    pause() {
      this.pauseCalls += 1;
      this.paused = true;
    },
  };
  const card = createCard();
  const calls = [];
  return {
    video,
    card,
    calls,
    _currentSrc: currentSrc,
    _card: card,
    _video: video,
    _isHovered: true,
    _isManualControl: false,
    _ensureVideoElement: () => video,
    _attachPlaybackRecovery: (label) => calls.push(['attach', label]),
    _getPlaybackLabel: () => 'Preview',
    _ensurePlaybackVideoSrc: async (options) => {
      calls.push(['ensure', options]);
      video.currentSrc = currentSrc;
      video.readyState = 2;
      return currentSrc;
    },
  };
}

test('sourceVideoPlaybackFeedback: clears loading state when no request is pending', () => {
  const controller = createController();
  assert.doesNotThrow(() => clearSourceVideoPlaybackFeedback(controller));
  assert.equal(controller.card.attributes.size, 0);
});

test('sourceVideoPlaybackFeedback: marks the card busy during playback and clears it afterward', async () => {
  const controller = createController();
  controller.video.currentSrc = '';
  let busyDuringPlay = false;
  controller.video.play = function play() {
    busyDuringPlay = controller.card.attributes.get('aria-busy') === 'true';
    this.playCalls += 1;
    return Promise.resolve();
  };

  const played = await playSourceVideoWithFeedback(controller, 'hover', () => true);

  assert.equal(played, true);
  assert.equal(busyDuringPlay, true);
  assert.equal(controller.card.attributes.has('aria-busy'), false);
  assert.deepEqual(controller.calls, [
    ['attach', 'hover'],
    ['ensure', { forPlayback: true, preload: 'metadata' }],
  ]);
});

test('sourceVideoPlaybackFeedback: skips loading feedback when the current source is already ready', async () => {
  const controller = createController({ readyState: 2 });
  const played = await playSourceVideoWithFeedback(controller, 'manual', () => true);

  assert.equal(played, true);
  assert.equal(controller.card.attributes.has('aria-busy'), false);
  assert.deepEqual(controller.calls, [['attach', 'manual']]);
});

test('sourceVideoPlaybackFeedback: returns false when no video element is available', async () => {
  const controller = {
    _ensureVideoElement: () => null,
  };
  assert.equal(await playSourceVideoWithFeedback(controller, 'hover', () => true), false);
});
