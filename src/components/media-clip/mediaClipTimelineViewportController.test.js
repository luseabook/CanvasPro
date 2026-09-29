import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampTimelineScrollLeft,
  shouldLockTimelineWheelScroll,
  syncTimelineScrollFade,
  timelineDragAutoScrollVelocity,
  timelineDragDeltaPx,
  timelineMaterialRangeSec,
} from './mediaClipTimelineViewportController.js';

function createClassList() {
  const values = new Map();
  return {
    values,
    toggle(name, force) {
      values.set(name, Boolean(force));
    },
  };
}

test('mediaClipTimelineViewportController: locks wheel scrolling for add-slot-only overflow', () => {
  const context = {
    _timelineTrackContentWidth() {
      return 300;
    },
  };
  const element = { scrollWidth: 345, clientWidth: 320 };

  assert.equal(shouldLockTimelineWheelScroll(context, element), true);
  assert.equal(shouldLockTimelineWheelScroll(context, { scrollWidth: 450, clientWidth: 320 }), false);
});

test('mediaClipTimelineViewportController: combines video and audio material ranges', () => {
  const range = timelineMaterialRangeSec({
    _mediaClip: {
      tracks: {
        video: { startSec: 0, endSec: 2 },
        audio: { startSec: 0, endSec: 2 },
      },
    },
    _videoTimelineClips() {
      return [{ timelineStartSec: 2, timelineEndSec: 5 }];
    },
    _audioTimelineClips() {
      return [{ timelineStartSec: 1, timelineEndSec: 4 }];
    },
  });

  assert.deepEqual(range, { startSec: 1, endSec: 5 });
});

test('mediaClipTimelineViewportController: clamps scroll to material bounds', () => {
  const context = {
    _shouldLockTimelineWheelScroll() {
      return false;
    },
    _timelineMaterialScrollBounds() {
      return { minScrollLeft: 25, maxScrollLeft: 75 };
    },
  };
  const element = { scrollWidth: 400, clientWidth: 200, scrollLeft: 0 };

  assert.equal(clampTimelineScrollLeft(context, element, 10), 25);
  assert.equal(clampTimelineScrollLeft(context, element, 50), 50);
  assert.equal(clampTimelineScrollLeft(context, element, 120), 75);
});

test('mediaClipTimelineViewportController: accounts for scroll movement in drag deltas', () => {
  const context = {
    _timelineDragScrollDeltaPx() {
      return 5;
    },
  };
  const drag = { startX: 100, latestClientX: 112 };

  assert.equal(timelineDragDeltaPx(context, drag), 17);
});

test('mediaClipTimelineViewportController: computes drag auto-scroll velocity near edges', () => {
  const element = {
    scrollWidth: 1000,
    clientWidth: 300,
    getBoundingClientRect() {
      return { left: 0, right: 300, width: 300 };
    },
  };

  assert.ok(timelineDragAutoScrollVelocity(element, 10) < 0);
  assert.ok(timelineDragAutoScrollVelocity(element, 290) > 0);
  assert.equal(timelineDragAutoScrollVelocity(element, 150), 0);
});

test('mediaClipTimelineViewportController: toggles the right-overflow fade', () => {
  const classList = createClassList();
  const element = {
    scrollWidth: 400,
    clientWidth: 200,
    scrollLeft: 20,
    classList,
  };
  const context = {
    _timelineMaterialScrollBounds() {
      return { minScrollLeft: 10, maxScrollLeft: 100 };
    },
    _shouldLockTimelineWheelScroll() {
      return false;
    },
  };

  syncTimelineScrollFade(context, element);

  assert.equal(classList.values.get('has-right-overflow'), true);
});
