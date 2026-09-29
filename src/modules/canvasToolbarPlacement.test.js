import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CANVAS_TOOLBAR_PLACEMENTS,
  CANVAS_TOOLBAR_PLACEMENT_EVENT,
  DEFAULT_CANVAS_TOOLBAR_PLACEMENT,
  normalizeCanvasToolbarPlacement,
} from './canvasToolbarPlacement.js';

test('freezes the supported placements in order', () => {
  assert.deepEqual([...CANVAS_TOOLBAR_PLACEMENTS], ['left', 'right', 'bottom']);
  assert.equal(Object.isFrozen(CANVAS_TOOLBAR_PLACEMENTS), true);
});

test('defaults to the left placement and names the change event', () => {
  assert.equal(DEFAULT_CANVAS_TOOLBAR_PLACEMENT, 'left');
  assert.equal(CANVAS_TOOLBAR_PLACEMENT_EVENT, 'canvas-toolbar-placement-changed');
});

test('keeps every supported placement untouched', () => {
  assert.equal(normalizeCanvasToolbarPlacement('left'), 'left');
  assert.equal(normalizeCanvasToolbarPlacement('right'), 'right');
  assert.equal(normalizeCanvasToolbarPlacement('bottom'), 'bottom');
});

test('falls back to the default for unsupported or nullish values', () => {
  for (const value of ['top', 'LEFT', ' left ', '', null, undefined, 0, {}]) {
    assert.equal(normalizeCanvasToolbarPlacement(value), 'left');
  }
});
