import test from 'node:test';
import assert from 'node:assert/strict';

import {
  claimExternalVideoPlayback,
  createHoverVideoPlaybackLifecycle,
  isExternallyOwnedVideoPlayback,
  releaseExternalVideoPlayback,
  setHoverPlaybackChromeVisible,
  shouldKeepManualPlaybackPresentationActive,
  shouldTakeOverActiveHoverPlayback,
} from './hoverVideoPlaybackLifecycle.js';

test('hoverVideoPlaybackLifecycle: tracks external playback ownership', () => {
  const media = { paused: false };

  assert.equal(claimExternalVideoPlayback(media, 'owner-a'), true);
  assert.equal(isExternallyOwnedVideoPlayback(media), true);
  assert.equal(releaseExternalVideoPlayback(media, 'owner-b'), false);
  assert.equal(isExternallyOwnedVideoPlayback(media), true);
  assert.equal(releaseExternalVideoPlayback(media, 'owner-a'), true);
  assert.equal(isExternallyOwnedVideoPlayback(media), false);
});

test('hoverVideoPlaybackLifecycle: decides takeover and presentation from playback state', () => {
  const hovered = {
    _isHovered: true,
    _isManualControl: false,
    _hoverManualPause: false,
  };
  const playing = { paused: false };
  assert.equal(shouldTakeOverActiveHoverPlayback(hovered, playing), true);
  assert.equal(shouldTakeOverActiveHoverPlayback({ ...hovered, _hoverManualPause: true }, playing), false);
  assert.equal(shouldTakeOverActiveHoverPlayback({ ...hovered, _isManualControl: true }, playing), false);
  assert.equal(shouldTakeOverActiveHoverPlayback(hovered, { paused: true }), false);

  assert.equal(shouldKeepManualPlaybackPresentationActive({ _isManualControl: true }, playing), true);
  assert.equal(shouldKeepManualPlaybackPresentationActive({ _isManualLoopPlayback: true }, playing), true);
  const external = { paused: false };
  claimExternalVideoPlayback(external, 'external');
  assert.equal(shouldKeepManualPlaybackPresentationActive({}, external), true);
  assert.equal(shouldKeepManualPlaybackPresentationActive({}, { paused: true }), false);
});

test('hoverVideoPlaybackLifecycle: toggles hover playback chrome', () => {
  const controlsEl = { style: {} };
  const muteEl = { style: {} };
  const centerEl = { style: {} };

  setHoverPlaybackChromeVisible({ controlsEl, muteEl, centerEl }, true);
  assert.deepEqual(controlsEl.style.display, 'flex');
  assert.deepEqual(muteEl.style.display, 'flex');
  assert.deepEqual(centerEl.style.display, 'flex');

  setHoverPlaybackChromeVisible({ controlsEl, muteEl, centerEl }, false);
  assert.deepEqual(controlsEl.style.display, 'none');
  assert.deepEqual(muteEl.style.display, 'none');
  assert.deepEqual(centerEl.style.display, 'none');
});

test('hoverVideoPlaybackLifecycle: cancels stale delayed releases and releases once', () => {
  const scheduled = [];
  const cancelled = [];
  let releases = 0;
  const lifecycle = createHoverVideoPlaybackLifecycle({
    releaseMedia() {
      releases += 1;
    },
    releaseDelayMs: 25,
    schedule(callback, delay) {
      const handle = { callback, delay };
      scheduled.push(handle);
      return handle;
    },
    cancel(handle) {
      cancelled.push(handle);
    },
  });

  assert.equal(lifecycle.activate(), true);
  assert.equal(lifecycle.activate(), true);
  assert.equal(lifecycle.deactivate(), true);
  assert.equal(scheduled[0].delay, 25);
  assert.equal(lifecycle.hasPendingRelease(), true);

  assert.equal(lifecycle.activate(), true);
  assert.equal(cancelled[0], scheduled[0]);
  scheduled[0].callback();
  assert.equal(releases, 0);
  assert.equal(lifecycle.hasPendingRelease(), false);

  assert.equal(lifecycle.deactivate(), true);
  scheduled[1].callback();
  assert.equal(releases, 1);
  assert.equal(lifecycle.hasPendingRelease(), false);

  lifecycle.dispose();
  assert.equal(lifecycle.activate(), false);
});
