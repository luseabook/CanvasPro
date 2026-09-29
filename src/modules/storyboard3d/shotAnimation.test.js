import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES,
  applyStoryboard3DAnimationEasing,
  createStoryboard3DShotAnimation,
  getStoryboard3DObjectAnimationTrack,
  normalizeStoryboard3DShotAnimation,
  remapStoryboard3DAnimationObjectIds,
  removeStoryboard3DAnimationKeyframe,
  sampleStoryboard3DShotAnimation,
  updateStoryboard3DShotAnimationSettings,
  upsertStoryboard3DCameraKeyframe,
  upsertStoryboard3DObjectKeyframe,
} from './shotAnimation.js';

test('shotAnimation: creates and normalizes a bounded animation document', () => {
  const created = createStoryboard3DShotAnimation({
    camera: {
      position: [1, 2, 3],
      target: [0, 0, 0],
      focalLength: 40,
      near: 0.1,
      far: 1000,
      aspectRatio: '16:9',
    },
    duration: 30,
    fps: 12,
    idFactory: () => 'camera-seed',
  });

  assert.deepEqual(STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES, [
    'position',
    'rotation',
    'scale',
  ]);
  assert.equal(created.duration, 30);
  assert.equal(created.fps, 12);
  assert.equal(created.loop, false);
  assert.equal(created.cameraKeyframes[0].id, 'camera-seed');
  assert.deepEqual(created.cameraKeyframes[0].camera.position, [1, 2, 3]);

  const normalized = normalizeStoryboard3DShotAnimation(
    {
      duration: 0.01,
      fps: 500,
      cameraKeyframes: [
        { id: 'later', time: 2, camera: { focalLength: 80 }, easing: 'bad' },
        { id: 'earlier', time: -1, camera: { focalLength: -10 } },
        { id: 'later', time: 1, camera: { focalLength: 50 } },
      ],
      objectTracks: [
        {
          objectId: 'hero',
          positionKeyframes: [
            { id: 'p2', time: 4, value: [4, 0, 0] },
            { id: 'p1', time: 0, value: [0, 0, 0] },
          ],
        },
        { objectId: 'missing', positionKeyframes: [] },
      ],
    },
    {
      camera: { position: [5, 4, 7] },
      objectIds: new Set(['hero']),
    },
  );

  assert.equal(normalized.duration, 4);
  assert.equal(normalized.fps, 120);
  assert.deepEqual(
    normalized.cameraKeyframes.map((keyframe) => [keyframe.id, keyframe.time]),
    [
      ['earlier', 0],
      ['later', 1],
    ],
  );
  assert.equal(normalized.cameraKeyframes[1].camera.focalLength, 50);
  assert.equal(normalized.cameraKeyframes[1].easing, 'ease-in-out');
  assert.deepEqual(
    normalized.objectTracks.map((track) => track.objectId),
    ['hero'],
  );
});

test('shotAnimation: upserts, removes, and remaps keyframes without mutating input', () => {
  const base = {
    duration: 2,
    fps: 10,
    cameraKeyframes: [
      {
        id: 'start',
        time: 0,
        camera: { position: [0, 0, 0], target: [0, 0, 0] },
      },
    ],
    objectTracks: [
      {
        objectId: 'hero',
        positionKeyframes: [
          { id: 'hero-start', time: 0, value: [0, 0, 0] },
          { id: 'hero-end', time: 2, value: [2, 0, 0] },
        ],
      },
    ],
    cameraConstraint: {
      mode: 'relative',
      followObjectId: 'hero',
      lookAtObjectId: 'hero',
    },
    actionClips: [
      {
        id: 'action',
        objectId: 'hero',
        actionId: 'walking-left',
        start: 0,
        end: 1,
      },
    ],
  };
  const original = JSON.parse(JSON.stringify(base));
  const withCamera = upsertStoryboard3DCameraKeyframe(
    base,
    {
      time: 1,
      camera: { position: [1, 0, 0], target: [0, 0, 0] },
      easing: 'linear',
    },
    { idFactory: () => 'middle' },
  );
  const replaced = upsertStoryboard3DCameraKeyframe(
    withCamera,
    {
      time: 1.01,
      camera: { position: [3, 0, 0], target: [1, 0, 0] },
    },
    { idFactory: () => 'replacement' },
  );
  const withObject = upsertStoryboard3DObjectKeyframe(
    replaced,
    {
      objectId: 'hero',
      property: 'rotation',
      time: 1,
      value: [0, Math.PI, 0],
    },
    { idFactory: () => 'rotation' },
  );
  const remapped = remapStoryboard3DAnimationObjectIds(withObject, new Map([['hero', 'hero-2']]));

  assert.deepEqual(base, original);
  assert.deepEqual(
    replaced.cameraKeyframes.map((keyframe) => [keyframe.id, keyframe.time]),
    [
      ['start', 0],
      ['middle', 1.01],
    ],
  );
  assert.deepEqual(replaced.cameraKeyframes[1].camera.position, [3, 0, 0]);
  assert.equal(getStoryboard3DObjectAnimationTrack(remapped, 'hero'), null);
  assert.equal(getStoryboard3DObjectAnimationTrack(remapped, 'hero-2').objectId, 'hero-2');
  assert.equal(remapped.cameraConstraint.followObjectId, 'hero-2');
  assert.equal(remapped.actionClips[0].objectId, 'hero-2');

  const removedCamera = removeStoryboard3DAnimationKeyframe(replaced, {
    type: 'camera',
    keyframeId: 'middle',
  });
  const removedObject = removeStoryboard3DAnimationKeyframe(remapped, {
    type: 'object',
    objectId: 'hero-2',
    property: 'rotation',
    keyframeId: 'rotation',
  });
  assert.deepEqual(
    removedCamera.cameraKeyframes.map((keyframe) => keyframe.id),
    ['start'],
  );
  assert.equal(getStoryboard3DObjectAnimationTrack(removedObject, 'hero-2').rotationKeyframes.length, 0);
});

test('shotAnimation: updates settings, samples looped interpolation, and applies easing', () => {
  const animation = {
    duration: 10,
    fps: 24,
    loop: true,
    cameraKeyframes: [
      {
        id: 'camera-start',
        time: 0,
        camera: {
          position: [0, 0, 0],
          target: [0, 0, 0],
          focalLength: 20,
          near: 0.1,
          far: 100,
          aspectRatio: '16:9',
        },
        easing: 'linear',
      },
      {
        id: 'camera-end',
        time: 10,
        camera: {
          position: [10, 0, 0],
          target: [4, 0, 0],
          focalLength: 60,
          near: 0.2,
          far: 200,
          aspectRatio: '4:3',
        },
        easing: 'linear',
      },
    ],
    objectTracks: [
      {
        objectId: 'hero',
        positionKeyframes: [
          { id: 'position-start', time: 0, value: [0, 0, 0], easing: 'linear' },
          { id: 'position-end', time: 10, value: [10, 0, 0], easing: 'linear' },
        ],
        rotationKeyframes: [],
        scaleKeyframes: [],
      },
    ],
  };

  const sample = sampleStoryboard3DShotAnimation(animation, 11, {
    objectTransforms: {
      hero: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    },
  });
  const updated = updateStoryboard3DShotAnimationSettings(animation, {
    duration: 12,
    fps: 60,
    loop: false,
  });

  assert.equal(sample.time, 1);
  assert.deepEqual(sample.camera.position, [1, 0, 0]);
  assert.deepEqual(sample.camera.target, [0.4, 0, 0]);
  assert.equal(sample.camera.focalLength, 24);
  assert.deepEqual(sample.objectTransforms.hero.position, [1, 0, 0]);
  assert.equal(updated.duration, 12);
  assert.equal(updated.fps, 60);
  assert.equal(updated.loop, false);
  assert.equal(applyStoryboard3DAnimationEasing(0.5, 'ease-in'), 0.25);
  assert.equal(applyStoryboard3DAnimationEasing(0.5, 'ease-out'), 0.75);
  assert.equal(applyStoryboard3DAnimationEasing(0.5, 'invalid'), 0.5);
});
