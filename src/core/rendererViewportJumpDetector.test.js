import test from 'node:test';
import assert from 'node:assert/strict';

import { createRendererViewportJumpDetector } from './rendererViewportJumpDetector.js';

test('rendererViewportJumpDetector: first sample establishes the baseline', () => {
  const detector = createRendererViewportJumpDetector();
  assert.equal(detector.consume(), false);
  assert.equal(detector.consume({ x: 20, y: 20, zoom: 1.01 }), false);
  assert.equal(detector.consume({ x: 181, y: 0, zoom: 1 }), true);
  assert.equal(detector.consume({ x: 181, y: 160, zoom: 1 }), false);
});

test('rendererViewportJumpDetector: zoom jumps, thresholds and reset are exact', () => {
  const detector = createRendererViewportJumpDetector({ panThreshold: 10, zoomThreshold: 0.5 });
  detector.consume({ x: 0, y: 0, zoom: 1 });
  assert.equal(detector.consume({ x: 10, y: 0, zoom: 1.5 }), false);
  assert.equal(detector.consume({ x: 10, y: 0, zoom: 2.01 }), true);

  assert.equal(detector.consume({ x: 'bad', y: Infinity, zoom: 0 }), true);
  assert.equal(detector.consume({ x: 0, y: 0, zoom: 1 }), false);
  detector.reset();
  assert.equal(detector.consume({ x: 0, y: 0, zoom: 1 }), false);
});
