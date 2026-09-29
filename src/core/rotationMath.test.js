import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getImageRotationLayout,
  getRotatedSize,
  inverseImageRotationPoint,
  normalizeRotationDegrees,
  rotatePointAroundCenter,
} from './rotationMath.js';

function assertClose(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} is not close to ${expected}`);
}

test('rotationMath: normalizes degrees into the rounded signed range', () => {
  assert.equal(normalizeRotationDegrees(450), 90);
  assert.equal(normalizeRotationDegrees(-270), 90);
  assert.equal(normalizeRotationDegrees(359.94), -0.1);
  assert.equal(normalizeRotationDegrees(12.34), 12.3);
  assert.equal(normalizeRotationDegrees('bad'), 0);
});

test('rotationMath: rotates sizes and points around the center', () => {
  assert.deepEqual(getRotatedSize(4, 2, 90), { width: 2, height: 4 });
  assert.deepEqual(getRotatedSize(3, 1, 45), { width: 3, height: 3 });

  const point = rotatePointAroundCenter({ x: 10, y: 0 }, { x: 0, y: 0 }, 90);
  assertClose(point.x, 0);
  assertClose(point.y, 10);
});

test('rotationMath: computes contained image layouts and inverse points', () => {
  assert.deepEqual(getImageRotationLayout(4, 2, 90, true), {
    width: 4,
    height: 2,
    scale: 0.5,
  });
  assert.deepEqual(getImageRotationLayout(4, 2, 0, false), {
    width: 4,
    height: 2,
    scale: 1,
  });

  const inverse = inverseImageRotationPoint({ x: 3, y: 0 }, 4, 2, 90, false);
  assertClose(inverse.x, 1);
  assertClose(inverse.y, 0);
});
