import test from 'node:test';
import assert from 'node:assert/strict';

import { createStoryboard3DShotAnimation } from './shotAnimation.js';
import { authorDirectorPath } from './directorPathAuthoring.js';

const CAMERA = {
  position: [0, 2, 10],
  target: [0, 2, 0],
  focalLength: 35,
  near: 0.1,
  far: 1000,
  aspectRatio: '16:9',
};

test('directorPathAuthoring: distributes camera keys by path distance', () => {
  const animation = createStoryboard3DShotAnimation({ camera: CAMERA, duration: 30 });
  const result = authorDirectorPath(animation, {
    points: [
      [0, 0, 0],
      [3, 0, 0],
      [3, 0, 4],
    ],
    camera: CAMERA,
    start: 1,
    duration: 4,
  });

  assert.equal(result.cameraKeyframes.length, 4);
  const authoredKeys = result.cameraKeyframes.slice(-3);
  assert.equal(authoredKeys[0].time, 1);
  assert.ok(Math.abs(authoredKeys[1].time - (1 + 12 / 7)) < 1e-9);
  assert.equal(authoredKeys[2].time, 5);
  assert.deepEqual(
    authoredKeys.map((keyframe) => keyframe.camera.position),
    [
      [0, 0, 0],
      [3, 0, 0],
      [3, 0, 4],
    ],
  );
  assert.deepEqual(result.cameraPath.pointIds, authoredKeys.map((keyframe) => keyframe.id));
});

test('directorPathAuthoring: authors object rotation and smooths path keys', () => {
  const animation = createStoryboard3DShotAnimation({ camera: CAMERA, duration: 30 });
  const object = {
    id: 'hero',
    locked: false,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0.4, 0],
      scale: [1, 1, 1],
    },
  };
  const result = authorDirectorPath(animation, {
    points: [
      [0, 0, 0],
      [0, 0, 2],
      [2, 0, 2],
    ],
    object,
    duration: 2,
    smooth: true,
  });
  const track = result.objectTracks.find((candidate) => candidate.objectId === 'hero');

  assert.deepEqual(
    track.positionKeyframes.map((keyframe) => keyframe.time),
    [0, 1, 2],
  );
  assert.equal(track.rotationKeyframes[1].value[1], Math.PI / 2);
  assert.ok(track.positionKeyframes.every((keyframe) => Array.isArray(keyframe.outTangent)));
  assert.equal(result.objectPaths.hero.pointIds.length, 3);
});

test('directorPathAuthoring: rejects short, invalid, and locked paths', () => {
  const animation = createStoryboard3DShotAnimation({ camera: CAMERA, duration: 30 });
  const object = {
    id: 'hero',
    locked: false,
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };

  assert.throws(
    () => authorDirectorPath(animation, { points: [[0, 0, 0]], camera: CAMERA }),
    /轨迹至少需要两个不同的位置/u,
  );
  assert.throws(
    () =>
      authorDirectorPath(animation, {
        points: [
          [0, 0, 0],
          [0, 0, 0],
        ],
        camera: CAMERA,
      }),
    /轨迹过短/u,
  );
  assert.throws(
    () => authorDirectorPath(animation, { points: [[0, 0, 0], [1, 0, 0]], object: { ...object, locked: true } }),
    /请先解锁对象/u,
  );
});
