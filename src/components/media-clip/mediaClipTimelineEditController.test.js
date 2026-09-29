import test from 'node:test';
import assert from 'node:assert/strict';

import {
  commitMediaClipTimelineEditTransaction,
  isMediaClipRollingVideoLeftTrimDrag,
  isMediaClipVideoLeftTrimDrag,
  resolveMediaClipTimelineMovePreview,
  resolveMediaClipTimelineTrimPreview,
} from './mediaClipTimelineEditController.js';

function createVideoClip(overrides = {}) {
  return {
    id: 'clip-1',
    sourceKey: 'source-video-1',
    startSec: 1,
    endSec: 5,
    durationSec: 10,
    timelineStartSec: 2,
    timelineEndSec: 6,
    ...overrides,
  };
}

function createMediaClip(clip = createVideoClip()) {
  return {
    clips: [clip],
    tracks: {
      video: {
        id: 'video-track',
        startSec: clip.timelineStartSec,
        endSec: clip.timelineEndSec,
        durationSec: clip.durationSec,
      },
    },
  };
}

test('mediaClipTimelineEditController: detects only video left-trim drags', () => {
  const drag = { kind: 'video', side: 'left', clipIndex: 0, startClips: [createVideoClip()] };
  assert.equal(isMediaClipVideoLeftTrimDrag(drag), true);
  assert.equal(isMediaClipRollingVideoLeftTrimDrag(drag), false);
  assert.equal(isMediaClipVideoLeftTrimDrag({ ...drag, side: 'right' }), false);
  assert.equal(isMediaClipVideoLeftTrimDrag({ ...drag, kind: 'audio' }), false);
});

test('mediaClipTimelineEditController: builds a clamped trim preview', () => {
  const clip = createVideoClip();
  const drag = {
    kind: 'video',
    side: 'right',
    clipIndex: 0,
    startClips: [{ ...clip }],
    startTrack: { ...createMediaClip(clip).tracks.video },
  };
  const preview = resolveMediaClipTimelineTrimPreview({
    mediaClip: createMediaClip(clip),
    kind: 'video',
    drag,
    deltaSec: 2,
    durationSec: 10,
  });

  assert.ok(preview);
  assert.deepEqual(preview.pendingRange, { startSec: 1, endSec: 7 });
  assert.equal(preview.previewClips[0].endSec, 7);
  assert.equal(preview.previewClips[0].timelineEndSec, 6);
  assert.equal(preview.pendingPlayheadSec, 6);
});

test('mediaClipTimelineEditController: clamps move previews inside the display duration', () => {
  const clip = createVideoClip();
  const preview = resolveMediaClipTimelineMovePreview({
    kind: 'video',
    drag: {
      kind: 'video',
      clipIndex: 0,
      startClips: [{ ...clip }],
      startPlayheadSec: 3,
    },
    deltaSec: 2,
    durationSec: 20,
  });

  assert.ok(preview);
  assert.equal(preview.timelineStartSec, 4);
  assert.equal(preview.timelineEndSec, 8);
  assert.equal(preview.pendingDeltaSec, 2);
  assert.equal(preview.pendingPlayheadSec, 5);
});

test('mediaClipTimelineEditController: commits trim and move transactions', () => {
  const clip = createVideoClip();
  const mediaClip = createMediaClip(clip);
  const trim = commitMediaClipTimelineEditTransaction({
    mediaClip,
    kind: 'video',
    mode: 'trim',
    drag: {
      kind: 'video',
      side: 'right',
      clipIndex: 0,
      startClips: [{ ...clip }],
      startTrack: { ...mediaClip.tracks.video },
      pendingRange: { startSec: 1, endSec: 7 },
    },
  });

  assert.equal(trim.activeClipIndex, 0);
  assert.equal(trim.mediaClip.clips[0].endSec, 7);

  const move = commitMediaClipTimelineEditTransaction({
    mediaClip,
    kind: 'video',
    mode: 'move',
    drag: {
      kind: 'video',
      clipIndex: 0,
      startClips: [{ ...clip }],
      startTrack: { ...mediaClip.tracks.video },
      pendingDeltaSec: 2,
    },
  });

  assert.equal(move.activeClipIndex, 0);
  assert.equal(move.mediaClip.clips[0].timelineStartSec, 0);
  assert.equal(move.mediaClip.clips[0].timelineEndSec, 4);
});
