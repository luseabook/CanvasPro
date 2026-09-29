import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampStoryboard3DBoneEuler,
  quaternionToStoryboard3DEuler,
} from './characterRig.js';
import {
  DIRECTOR_CHARACTER_COLORS,
  DIRECTOR_POSE_CHANNELS,
  applyDirectorPoseChannel,
  createDirectorCrowd,
  normalizeDirectorPoseLibrary,
} from './directorCharacterAuthoring.js';

test('directorCharacterAuthoring exposes stable color and pose channel catalogs', () => {
  assert.deepEqual(DIRECTOR_CHARACTER_COLORS, [
    'blue',
    'red',
    'green',
    'yellow',
    'purple',
    'cyan',
    'white',
    'black',
  ]);
  assert.equal(DIRECTOR_POSE_CHANNELS.length, 12);
  assert.deepEqual(DIRECTOR_POSE_CHANNELS[0], ['抬头低头', 'Head', 'x', -60, 60]);
});

test('normalizeDirectorPoseLibrary normalizes names, ids, and bone overrides', () => {
  const result = normalizeDirectorPoseLibrary([
    {
      id: 'p1',
      name: '',
      actionId: 'walking-left',
      actionTime: -4,
      boneOverrides: { Head: [0, 1, 0, 0] },
    },
    null,
    { id: 7, name: 'ignored' },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'p1');
  assert.equal(result[0].name, '自定义姿势');
  assert.equal(result[0].leftHandPoseId, 'relaxed');
  assert.equal(result[0].rightHandPoseId, 'relaxed');
  assert.equal(result[0].actionTime, 0);
  assert.deepEqual(result[0].boneOverrides.Head, [0, 1, 0, 0]);
});

test('applyDirectorPoseChannel clamps the requested angle and clears playback', () => {
  const pose = { actionPlaying: true, boneOverrides: {} };
  const result = applyDirectorPoseChannel(pose, 0, 999);
  const euler = quaternionToStoryboard3DEuler(result.boneOverrides.Head);
  const expected = clampStoryboard3DBoneEuler('Head', { x: Math.PI / 3 }).x;
  assert.equal(result.actionPlaying, false);
  assert.ok(Math.abs(euler.x - expected) < 1e-9);
  assert.equal(applyDirectorPoseChannel(pose, 99, 10), pose);
  assert.equal(applyDirectorPoseChannel(pose, 0, Number.NaN), pose);
});

test('createDirectorCrowd clones an unlocked character into a grid', () => {
  const state = {
    objects: [{ id: 'existing', type: 'prop' }],
  };
  const template = {
    id: 'hero',
    type: 'character',
    locked: false,
    name: 'Hero',
    transform: {
      position: [1, 2, 3],
      rotation: [0.1, 0.2, 0.3],
      scale: [1, 1, 1],
    },
  };
  const result = createDirectorCrowd(state, template, {
    rows: 1,
    cols: 2,
    spacing: 2,
    yaw: 0,
  });

  assert.equal(result.objects.length, 3);
  assert.equal(state.objects.length, 1);
  const crowd = result.objects.slice(1);
  assert.deepEqual(
    crowd.map((object) => object.transform.position),
    [
      [0, 2, 3],
      [2, 2, 3],
    ],
  );
  assert.equal(crowd[0].name, 'Hero 群众 1');
  assert.equal(crowd[1].name, 'Hero 群众 2');
  assert.equal(crowd.every((object) => object.id.startsWith('crowd-')), true);
  assert.equal(crowd.every((object) => object.transform !== template.transform), true);
});

test('createDirectorCrowd rejects locked, non-character, and oversized grids', () => {
  const character = {
    type: 'character',
    locked: false,
    transform: { position: [0, 0, 0] },
  };
  assert.throws(
    () => createDirectorCrowd({ objects: [] }, { ...character, locked: true }),
    /已解锁角色/,
  );
  assert.throws(
    () => createDirectorCrowd({ objects: [] }, { ...character, type: 'prop' }),
    /已解锁角色/,
  );
  assert.throws(
    () => createDirectorCrowd({ objects: [] }, character, { rows: 10, cols: 11 }),
    /1–100/,
  );
  assert.throws(
    () => createDirectorCrowd({ objects: [] }, character, { rows: 1.5, cols: 2 }),
    /1–100/,
  );
});
