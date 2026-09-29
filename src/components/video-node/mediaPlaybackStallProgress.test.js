import test from 'node:test';
import assert from 'node:assert/strict';

import { observePlaybackStallProgress } from './mediaPlaybackStallProgress.js';

test('observePlaybackStallProgress: resets the timer when media progress changes', () => {
  const state = { stallTimeoutMs: 1000 };
  const media = { src: 'video-a', currentTime: 1, buffered: 2 };

  assert.equal(observePlaybackStallProgress(state, media, 100), 1000);
  assert.equal(observePlaybackStallProgress(state, media, 400), 700);
  assert.equal(observePlaybackStallProgress(state, { ...media, currentTime: 2 }, 900), 1000);
});

test('observePlaybackStallProgress: uses the default timeout and clamps elapsed time', () => {
  const state = {};
  const media = { src: 'video-a', currentTime: 0, buffered: 0 };

  assert.equal(observePlaybackStallProgress(state, media, 100), 4000);
  assert.equal(observePlaybackStallProgress(state, media, 6000), 0);
});
