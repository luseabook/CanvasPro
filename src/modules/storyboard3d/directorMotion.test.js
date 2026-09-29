import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyDirectorCameraConstraint,
  directorConstraintAt,
  normalizeDirectorMotion,
  sampleDirectorActions,
} from './directorMotion.js';

test('directorMotion: normalizes constraints and sorts bounded clip lists', () => {
  const objectIds = new Set(['hero', 'target']);
  const motion = normalizeDirectorMotion(
    {
      cameraConstraint: {
        mode: 'fixed',
        followObjectId: 'hero',
        lookAtObjectId: 'missing',
        followHeading: true,
        followOffset: [2, 'bad', 1],
        lookAtOffset: [0, 2, '3'],
      },
      cameraConstraintClips: [
        { id: 'later', start: 5, end: 5, followObjectId: 'hero' },
        { id: 'earlier', start: -1, end: 99, mode: 'invalid', followObjectId: 'target' },
      ],
      actionClips: [
        {
          id: 'z',
          objectId: 'hero',
          actionId: 'walking-left',
          start: 2,
          end: 1,
          speed: 9,
          offset: -4,
        },
        { id: 'ignored-object', objectId: 'missing', actionId: 'running-left' },
        { id: 'ignored-action', objectId: 'hero', actionId: 'unknown' },
        { id: 'a', objectId: 'target', actionId: 'dialogue', start: 2, end: 3 },
      ],
    },
    objectIds,
  );

  assert.deepEqual(motion.cameraConstraint, {
    mode: 'fixed',
    followOffset: [2, 0, 1],
    followObjectId: 'hero',
    lookAtObjectId: '',
    followHeading: true,
    lookAtOffset: [0, 2, 3],
  });
  assert.deepEqual(
    motion.cameraConstraintClips.map((clip) => [clip.id, clip.start, clip.end, clip.mode]),
    [
      ['earlier', 0, 99, 'relative'],
      ['later', 5, 5.1, 'relative'],
    ],
  );
  assert.deepEqual(
    motion.actionClips.map((clip) => [
      clip.id,
      clip.start,
      clip.end,
      clip.speed,
      clip.offset,
    ]),
    [
      ['a', 2, 3, 1, 0],
      ['z', 2, 2.1, 4, 0],
    ],
  );
});

test('directorMotion: selects the last active clip and otherwise uses the base constraint', () => {
  const motion = normalizeDirectorMotion(
    {
      cameraConstraint: { mode: 'relative' },
      cameraConstraintClips: [
        { id: 'first', start: 0, end: 10, mode: 'relative' },
        { id: 'last', start: 5, end: 6, mode: 'fixed' },
      ],
    },
    new Set(),
  );

  assert.equal(directorConstraintAt(motion, 2).id, 'first');
  assert.equal(directorConstraintAt(motion, 5.5).id, 'last');
  assert.deepEqual(directorConstraintAt(motion, -1), motion.cameraConstraint);
});

test('directorMotion: applies fixed, relative, and look-at camera constraints without mutation', () => {
  const camera = { position: [1, 2, 3], target: [0, 0, 0] };
  const previousObjects = { hero: { position: [0, 0, 0], rotation: [0, 0, 0] } };
  const currentObjects = {
    hero: { position: [10, 1, 20], rotation: [0, 0, 0] },
    focus: { position: [4, 2, 6] },
  };

  const fixed = normalizeDirectorMotion(
    {
      cameraConstraint: {
        mode: 'fixed',
        followObjectId: 'hero',
        followOffset: [0, 2, 5],
        lookAtOffset: [0, 2, 3],
      },
    },
    new Set(['hero', 'focus']),
  ).cameraConstraint;
  assert.deepEqual(applyDirectorCameraConstraint(camera, fixed, currentObjects, previousObjects), {
    position: [10, 3, 25],
    target: [10, 3, 23],
  });

  const relative = normalizeDirectorMotion(
    {
      cameraConstraint: {
        mode: 'relative',
        followObjectId: 'hero',
        lookAtObjectId: 'focus',
        followOffset: [0, 2, 5],
        lookAtOffset: [0, 1, 0],
      },
    },
    new Set(['hero', 'focus']),
  ).cameraConstraint;
  assert.deepEqual(applyDirectorCameraConstraint(camera, relative, currentObjects, previousObjects), {
    position: [11, 5, 28],
    target: [4, 3, 6],
  });
  assert.deepEqual(camera, { position: [1, 2, 3], target: [0, 0, 0] });
});

test('directorMotion: samples active action clips and falls back to each character state', () => {
  const samples = sampleDirectorActions(
    [
      {
        id: 'walk',
        objectId: 'hero',
        actionId: 'walking-left',
        start: 1,
        end: 5,
        speed: 2,
        offset: 0.5,
      },
    ],
    2,
    [
      {
        id: 'hero',
        type: 'character',
        actionId: 'standing',
        actionTime: 1,
        actionPlaying: true,
      },
      {
        id: 'idle',
        type: 'character',
        actionId: 'seated',
        actionTime: 3,
        actionPlaying: false,
      },
      { id: 'prop', type: 'prop', actionId: 'standing' },
    ],
  );

  assert.deepEqual(samples, {
    hero: { actionId: 'walking-left', actionTime: 2.5 },
    idle: { actionId: 'seated', actionTime: 3 },
  });
});

