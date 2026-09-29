import test from 'node:test';
import assert from 'node:assert/strict';

import {
  adjustSpatialCamera,
  applyRelativeCameraPose,
  clientToViewportNdc,
  intersectRayWithAxisPlane,
  ndcToViewportPoint,
} from './spatialProjectionMath.js';

test('spatialProjectionMath: converts client coordinates to NDC and back', () => {
  const rect = { left: 100, top: 50, width: 200, height: 100 };
  assert.deepEqual(clientToViewportNdc(200, 100, rect), { x: 0, y: 0 });
  assert.deepEqual(clientToViewportNdc(100, 50, rect), { x: -1, y: 1 });
  assert.deepEqual(clientToViewportNdc(300, 150, rect), { x: 1, y: -1 });
  assert.equal(clientToViewportNdc(0, 0, { left: 0, top: 0, width: 0, height: 10 }), null);

  assert.deepEqual(ndcToViewportPoint({ x: 0, y: 0, z: 0 }, { width: 200, height: 100 }), {
    x: 100,
    y: 50,
  });
  assert.equal(ndcToViewportPoint({ x: 0, y: 0, z: 2 }, { width: 200, height: 100 }), null);
});

test('spatialProjectionMath: intersects rays with axis planes only in the forward range', () => {
  assert.deepEqual(intersectRayWithAxisPlane([0, 0, 0], [0, 1, 0], 1, 2), [0, 2, 0]);
  assert.deepEqual(intersectRayWithAxisPlane([0, 0, 0], [1, 0, 0], 0, 5), [5, 0, 0]);
  assert.equal(intersectRayWithAxisPlane([0, 0, 0], [1, 0, 0], 1, 2), null);
  assert.equal(intersectRayWithAxisPlane([0, 0, 0], [0, 1, 0], 1, -2), null);
  assert.equal(intersectRayWithAxisPlane([0, 0, 0], [0, 1, 0], 1, 20001), null);
});

test('spatialProjectionMath: adjusts camera rotation or pans without mutating the input', () => {
  const camera = { position: [0, 0, 10], target: [0, 0, 0], roll: 0.1 };
  const rotated = adjustSpatialCamera(camera, 100, 50);

  assert.deepEqual(rotated.position, [0, 0, 10]);
  assert.notDeepEqual(rotated.target, camera.target);
  assert.deepEqual(camera, { position: [0, 0, 10], target: [0, 0, 0], roll: 0.1 });
  assert.ok(
    Math.abs(
      Math.hypot(
        rotated.target[0] - rotated.position[0],
        rotated.target[1] - rotated.position[1],
        rotated.target[2] - rotated.position[2],
      ) - 10,
    ) < 1e-9,
  );

  const panned = adjustSpatialCamera(camera, 0, 100, true);
  assert.deepEqual(panned.position, [0, 0, 8]);
  assert.deepEqual(panned.target, [0, 0, 0]);
});

test('spatialProjectionMath: applies relative translation in camera space and adds roll', () => {
  const camera = { position: [0, 0, 10], target: [0, 0, 0], roll: 0.1 };
  const result = applyRelativeCameraPose(camera, {
    rotation: [0, 0, 0.2],
    translation: [1, 2, 3],
  });

  for (const [actual, expected] of [
    [result.position[0], 1],
    [result.position[1], 2],
    [result.position[2], 13],
    [result.target[0], 1],
    [result.target[1], 2],
    [result.target[2], 3],
  ]) {
    assert.ok(Math.abs(actual - expected) < 1e-9);
  }
  assert.ok(Math.abs(result.roll - 0.3) < 1e-9);
  assert.deepEqual(camera, { position: [0, 0, 10], target: [0, 0, 0], roll: 0.1 });
});
