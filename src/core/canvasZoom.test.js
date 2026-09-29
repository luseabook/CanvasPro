import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CANVAS_ZOOM_LIMITS,
  CANVAS_ZOOM_SLIDER_RANGE,
  canvasZoomAfterWheel,
  canvasZoomToDisplayPercent,
  canvasZoomToSliderValue,
  clampCanvasZoom,
  sliderValueToCanvasZoom,
} from './canvasZoom.js';

test('canvasZoom: clamps invalid and out-of-range zoom values', () => {
  assert.equal(clampCanvasZoom(Number.NaN), CANVAS_ZOOM_LIMITS.default);
  assert.equal(clampCanvasZoom(0), CANVAS_ZOOM_LIMITS.min);
  assert.equal(clampCanvasZoom(10), CANVAS_ZOOM_LIMITS.max);
  assert.equal(clampCanvasZoom(0.5), 0.5);
});

test('canvasZoom: maps wheel input exponentially and clamps the result', () => {
  assert.ok(canvasZoomAfterWheel(1, -120) > 1);
  assert.ok(canvasZoomAfterWheel(1, 120) < 1);
  assert.equal(canvasZoomAfterWheel(1, -100000), CANVAS_ZOOM_LIMITS.max);
  assert.equal(canvasZoomAfterWheel(1, 100000), CANVAS_ZOOM_LIMITS.min);
});

test('canvasZoom: round-trips slider values and formats display percentages', () => {
  assert.equal(canvasZoomToSliderValue(CANVAS_ZOOM_LIMITS.min), CANVAS_ZOOM_SLIDER_RANGE.min);
  assert.equal(canvasZoomToSliderValue(CANVAS_ZOOM_LIMITS.max), CANVAS_ZOOM_SLIDER_RANGE.max);
  assert.equal(sliderValueToCanvasZoom(CANVAS_ZOOM_SLIDER_RANGE.min), CANVAS_ZOOM_LIMITS.min);
  assert.equal(sliderValueToCanvasZoom(CANVAS_ZOOM_SLIDER_RANGE.max), CANVAS_ZOOM_LIMITS.max);

  const sliderValue = canvasZoomToSliderValue(0.75);
  assert.ok(Math.abs(sliderValueToCanvasZoom(sliderValue) - 0.75) < 0.01);
  assert.equal(canvasZoomToDisplayPercent(0.333), 33);
  assert.equal(canvasZoomToDisplayPercent(0), 1);
  assert.equal(canvasZoomToDisplayPercent(5), 400);
});
