// Offline characterization tests for the pure sizing/center helpers in
// editorWorkspace.js. These lock the clamping behaviour before the file is split.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeStoryboard3DInspectorWidth,
  normalizeStoryboard3DRightSidebarWidth,
  normalizeStoryboard3DTimelineHeight,
  resolveStoryboard3DViewportCenterPosition,
} from './editorWorkspace.js';

test('inspector width clamps into 280..560 and rounds to an integer', () => {
  assert.equal(normalizeStoryboard3DInspectorWidth(500, 1200), 500);
  assert.equal(normalizeStoryboard3DInspectorWidth(100, 1200), 280);
  assert.equal(normalizeStoryboard3DInspectorWidth(900, 1200), 560);
  // No stored width: falls back to min(360, sidebar-available).
  assert.equal(normalizeStoryboard3DInspectorWidth(undefined, 1200), 360);
  assert.equal(normalizeStoryboard3DInspectorWidth(undefined, 700), 280);
  for (const width of [-100, 0, 123.6, 9999]) {
    const value = normalizeStoryboard3DInspectorWidth(width, 1440);
    assert.ok(Number.isInteger(value) && value >= 280 && value <= 560, String(value));
  }
});

test('viewport center falls back to x/z and tolerates garbage input', () => {
  assert.deepEqual(resolveStoryboard3DViewportCenterPosition({ target: { x: 5, z: 7 } }), [5, 0, 7]);
  assert.deepEqual(resolveStoryboard3DViewportCenterPosition({ target: [1, 2, 9] }), [1, 0, 9]);
  assert.deepEqual(resolveStoryboard3DViewportCenterPosition(undefined), [0, 0, 0]);
  assert.deepEqual(resolveStoryboard3DViewportCenterPosition({ target: { x: 'x', z: null } }), [0, 0, 0]);
});

test('right sidebar width clamps into 360..1800 and varies by mode', () => {
  assert.equal(normalizeStoryboard3DRightSidebarWidth(undefined, 1440, 'assets'), 605);
  assert.equal(normalizeStoryboard3DRightSidebarWidth(4000, 1440, 'assets'), 1160);
  assert.equal(normalizeStoryboard3DRightSidebarWidth(100, 1440, 'assets'), 360);
  assert.equal(normalizeStoryboard3DRightSidebarWidth(undefined, 1440, 'inspector'), 360);
  for (const width of [-1, 0, 777.7, 99999]) {
    const value = normalizeStoryboard3DRightSidebarWidth(width, 1920, 'assets');
    assert.ok(Number.isInteger(value) && value >= 360 && value <= 1800, String(value));
  }
});

test('timeline height clamps and falls back to the default', () => {
  assert.equal(normalizeStoryboard3DTimelineHeight(undefined, 900), 340);
  assert.equal(normalizeStoryboard3DTimelineHeight(100, 900), 220);
  assert.equal(normalizeStoryboard3DTimelineHeight(1000, 900), 720);
  assert.equal(normalizeStoryboard3DTimelineHeight(undefined, 300), 140);
  for (const height of [-50, 0, 512.4, 5000]) {
    const value = normalizeStoryboard3DTimelineHeight(height, 1000);
    assert.ok(Number.isInteger(value), String(value));
  }
});
