import test from 'node:test';
import assert from 'node:assert/strict';

import { createStoryboard3DShotAnimation } from './shotAnimation.js';
import {
  DIRECTOR_CAMERA_MOTIONS,
  applyDirectorCameraMotion,
  applyDirectorObjectPath,
} from './directorAuthoring.js';

const CAMERA = {
  position: [0, 2, 10],
  target: [0, 2, 0],
  focalLength: 35,
  near: 0.1,
  far: 1000,
  aspectRatio: '16:9',
};

test('directorAuthoring: applies a bounded camera push motion', () => {
  const animation = createStoryboard3DShotAnimation({ camera: CAMERA, duration: 30 });
  const result = applyDirectorCameraMotion(animation, {
    camera: CAMERA,
    preset: 'push',
    start: 1,
    duration: 4,
    amount: 2,
  });

  assert.deepEqual(DIRECTOR_CAMERA_MOTIONS.map(([key]) => key), [
    'orbit',
    'arc',
    'push',
    'pull',
    'crane',
    'slide',
    'spiral',
  ]);
  assert.deepEqual(
    result.cameraKeyframes.map((keyframe) => keyframe.time),
    [0, 1, 5],
  );
  assert.deepEqual(result.cameraKeyframes[0].camera.position, [0, 2, 10]);
  assert.deepEqual(result.cameraKeyframes[1].camera.position, [0, 2, 10]);
  assert.deepEqual(result.cameraKeyframes[2].camera.position, [0, 2, 8]);
  assert.deepEqual(result.cameraKeyframes[2].camera.target, [0, 2, 0]);
  assert.throws(
    () => applyDirectorCameraMotion(animation, { camera: CAMERA, preset: 'missing' }),
    /请选择运镜预设/u,
  );
});

test('directorAuthoring: appends a camera motion from the last keyframe', () => {
  const animation = createStoryboard3DShotAnimation({ camera: CAMERA, duration: 30 });
  const first = applyDirectorCameraMotion(animation, {
    camera: CAMERA,
    preset: 'crane',
    start: 0,
    duration: 2,
    amount: 3,
  });
  const second = applyDirectorCameraMotion(first, {
    preset: 'crane',
    append: true,
    duration: 2,
    amount: 3,
  });

  assert.deepEqual(
    second.cameraKeyframes.map((keyframe) => keyframe.time),
    [0, 2, 4],
  );
  assert.deepEqual(second.cameraKeyframes[1].camera.position, [0, 5, 10]);
  assert.deepEqual(second.cameraKeyframes[2].camera.position, [0, 8, 10]);
});

test('directorAuthoring: authors an oriented object path and validates its inputs', () => {
  const animation = createStoryboard3DShotAnimation({ camera: CAMERA, duration: 30 });
  const object = {
    id: 'hero',
    locked: false,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };
  const result = applyDirectorObjectPath(animation, {
    object,
    points: [
      [0, 0, 0],
      [0, 0, 2],
      [2, 0, 2],
    ],
    duration: 2,
    orient: true,
  });
  const track = result.objectTracks.find((candidate) => candidate.objectId === 'hero');

  assert.deepEqual(
    track.positionKeyframes.map((keyframe) => keyframe.time),
    [0, 1, 2],
  );
  assert.deepEqual(
    track.positionKeyframes.map((keyframe) => keyframe.value),
    [
      [0, 0, 0],
      [0, 0, 2],
      [2, 0, 2],
    ],
  );
  assert.equal(track.rotationKeyframes[0].value[1], 0);
  assert.equal(track.rotationKeyframes[1].value[1], Math.PI / 2);
  assert.equal(track.rotationKeyframes[2].value[1], Math.PI / 2);

  assert.throws(
    () => applyDirectorObjectPath(animation, { object: { ...object, locked: true }, points: [[0, 0, 0], [1, 0, 0]] }),
    /请先选择一个未锁定的角色或物体/u,
  );
  assert.throws(
    () => applyDirectorObjectPath(animation, { object, points: [[0, 0, 0], [0, 0, 0]] }),
    /路径点之间需要有距离/u,
  );
});
