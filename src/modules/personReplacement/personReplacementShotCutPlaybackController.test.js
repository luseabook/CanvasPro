import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPersonReplacementShotCutPlaybackController } from './personReplacementShotCutPlaybackController.js';

const DRAFT = [
  {
    shotId: 's1',
    sourceId: 'src1',
    index: 0,
    startSec: 0,
    endSec: 4,
    durationSec: 4,
    outputFps: 24,
  },
];

function createHarness(overrides = {}) {
  const calls = {
    native: [],
    preview: [],
    timeline: [],
    cancelFrameCallback: [],
    cancelAnimationFrame: [],
    clearTimeout: [],
  };
  const draft = overrides.draft || DRAFT;
  const project = overrides.project || { shots: [{ id: 's1', sourceId: 'src1' }] };
  let rafCallback = null;
  let rafId = 0;
  let videoFrameCallback = null;
  const windowObject = {
    requestAnimationFrame(callback) {
      rafCallback = callback;
      return ++rafId;
    },
    cancelAnimationFrame(id) {
      calls.cancelAnimationFrame.push(id);
    },
    clearTimeout(id) {
      calls.clearTimeout.push(id);
    },
    setTimeout() {
      return 99;
    },
  };
  const controller = createPersonReplacementShotCutPlaybackController({
    windowObject,
    isEditorOpen: overrides.isEditorOpen || (() => true),
    getDraft: () => draft,
    getProject: () => project,
    syncNativePlayback: (video) => calls.native.push(video),
    syncTimelinePosition: (position) => calls.timeline.push(position),
    previewShotCut: (...args) => calls.preview.push(args),
  });
  return {
    calls,
    controller,
    fireAnimationFrame(time = 1000) {
      const callback = rafCallback;
      rafCallback = null;
      assert.ok(callback, 'expected a pending animation frame callback');
      callback(time);
    },
    setVideoFrameCallback(callback) {
      videoFrameCallback = callback;
    },
    fireVideoFrameCallback() {
      const callback = videoFrameCallback;
      videoFrameCallback = null;
      assert.ok(callback, 'expected a pending video frame callback');
      callback();
    },
  };
}

test('personReplacementShotCutPlaybackController: refuses to start outside the editor', () => {
  const harness = createHarness({ isEditorOpen: () => false });
  const video = { paused: false, ended: false };

  assert.equal(harness.controller.startReverse(video, 1), false);
  harness.controller.startNative(video);
  assert.equal(harness.calls.preview.length, 0);
  assert.equal(harness.calls.native.length, 0);
});

test('personReplacementShotCutPlaybackController: native playback samples video frames and keeps rescheduling', () => {
  const harness = createHarness();
  const video = {
    paused: false,
    ended: false,
    requestVideoFrameCallback(callback) {
      harness.setVideoFrameCallback(callback);
      return 7;
    },
    cancelVideoFrameCallback(id) {
      harness.calls.cancelFrameCallback.push(id);
    },
  };

  harness.controller.startNative(video);
  assert.equal(harness.calls.native.length, 0);
  harness.fireVideoFrameCallback();
  assert.deepEqual(harness.calls.native, [video]);
  harness.controller.stop();
  assert.deepEqual(harness.calls.cancelFrameCallback, [7]);
});

test('personReplacementShotCutPlaybackController: reverse playback hands non-reversed shots back to the preview', () => {
  const harness = createHarness();
  const video = {
    paused: false,
    ended: false,
    muted: false,
    currentTime: 0,
    dataset: { sourceId: 'src1' },
    pause() {},
  };

  assert.equal(harness.controller.startReverse(video, 0.5), true);
  assert.equal(harness.controller.isReverseActive(), true);
  harness.fireAnimationFrame(1000);

  assert.deepEqual(harness.calls.preview, [['s1', 0.5, { timelineSec: 0.5, autoplay: true }]]);
  assert.equal(harness.controller.isReverseActive(), false);
  assert.equal(harness.calls.timeline.length, 0);
});

test('personReplacementShotCutPlaybackController: reversed shots drive currentTime and publish timeline progress', () => {
  const harness = createHarness({
    draft: [{ ...DRAFT[0], isReversed: true, originShotId: 's1' }],
  });
  const video = {
    paused: false,
    ended: false,
    muted: false,
    currentTime: 0,
    dataset: { sourceId: 'src1' },
    pause() {},
  };

  assert.equal(harness.controller.startReverse(video, 0.5), true);
  harness.fireAnimationFrame(1000);

  assert.equal(harness.calls.timeline.length, 1);
  assert.equal(harness.calls.timeline[0].shotId, 's1');
  assert.equal(harness.calls.timeline[0].timelineSec, 0.5);
  assert.ok(video.currentTime > 3);
  assert.equal(harness.calls.preview.length, 0);
});

test('personReplacementShotCutPlaybackController: reversed playback falls back to preview when the source changes', () => {
  const harness = createHarness({
    draft: [{ ...DRAFT[0], isReversed: true, originShotId: 's1' }],
  });
  const video = {
    paused: false,
    ended: false,
    muted: false,
    currentTime: 0,
    dataset: { sourceId: 'other-source' },
    pause() {},
  };

  assert.equal(harness.controller.startReverse(video, 0.5), true);
  harness.fireAnimationFrame(1000);

  assert.equal(harness.calls.timeline.length, 0);
  assert.equal(harness.calls.preview.length, 1);
  assert.equal(harness.calls.preview[0][0], 's1');
  assert.ok(Math.abs(harness.calls.preview[0][1] - 3.463541666666667) < 1e-9);
  assert.deepEqual(harness.calls.preview[0][2], { timelineSec: 0.5, autoplay: true });
});

test('personReplacementShotCutPlaybackController: stop cancels a pending animation frame callback', () => {
  const harness = createHarness();
  const video = {
    paused: false,
    ended: false,
    muted: false,
    currentTime: 0,
    dataset: { sourceId: 'src1' },
    pause() {},
  };

  harness.controller.startReverse(video, 0.5);
  harness.controller.stop();
  assert.deepEqual(harness.calls.cancelAnimationFrame, [1]);
  assert.equal(harness.calls.timeline.length, 0);
});
