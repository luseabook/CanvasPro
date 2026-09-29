import test from 'node:test';
import assert from 'node:assert/strict';

import { PANORAMA_CHARACTER_BONES } from '../panoramaSceneNode/poseCatalog.js';
import {
  STORYBOARD_3D_ACTIONS,
  STORYBOARD_3D_BODY_PRESETS,
  STORYBOARD_3D_HAND_POSES,
  advanceStoryboard3DCharacterAction,
  applyStoryboard3DCharacterPoseToModel,
  clampStoryboard3DBoneEuler,
  commitStoryboard3DBoneEditState,
  composeStoryboard3DCharacterBoneQuaternions,
  createStoryboard3DBoneEditState,
  eulerToStoryboard3DQuaternion,
  normalizeStoryboard3DBoneOverrides,
  normalizeStoryboard3DCharacterState,
  quaternionToStoryboard3DEuler,
  resolveStoryboard3DCharacterPose,
  seekStoryboard3DCharacterAction,
  setStoryboard3DBoneOverride,
  updateStoryboard3DBoneEditState,
} from './characterRig.js';

test('characterRig: exposes body, action, and hand catalogs', () => {
  assert.ok(STORYBOARD_3D_BODY_PRESETS.length >= 12);
  assert.ok(STORYBOARD_3D_ACTIONS.some((entry) => entry.id === 'walking-left'));
  assert.ok(STORYBOARD_3D_HAND_POSES.some((entry) => entry.id === 'relaxed'));
  assert.ok(PANORAMA_CHARACTER_BONES.includes('pelvis'));
});

test('characterRig: bone euler clamping respects per-bone limits', () => {
  assert.equal(clampStoryboard3DBoneEuler('missing', {}), null);
  assert.deepEqual(clampStoryboard3DBoneEuler('neck_01', { x: 2, y: -2, z: 0.2 }), {
    x: 0.8,
    y: -1.1,
    z: 0.2,
  });
});

test('characterRig: quaternion conversion round-trips identity and principal rotations', () => {
  assert.deepEqual(eulerToStoryboard3DQuaternion({}), [0, 0, 0, 1]);
  const halfTurn = eulerToStoryboard3DQuaternion({ x: Math.PI });
  assert.ok(Math.abs(halfTurn[0] - 1) < 1e-12);
  assert.ok(Math.abs(halfTurn[3]) < 1e-12);
  const identity = quaternionToStoryboard3DEuler([0, 0, 0, 1]);
  assert.ok(Math.abs(identity.x) < 1e-12);
  assert.ok(Math.abs(identity.y) < 1e-12);
  assert.ok(Math.abs(identity.z) < 1e-12);
});

test('characterRig: bone overrides require known bones and finite non-zero quaternions', () => {
  assert.deepEqual(normalizeStoryboard3DBoneOverrides({ pelvis: [0, 2, 0, 0] }), {
    pelvis: [0, 1, 0, 0],
  });
  assert.deepEqual(normalizeStoryboard3DBoneOverrides({ pelvis: [0, 0, 0, 0] }), {});
  assert.deepEqual(normalizeStoryboard3DBoneOverrides({ unknown: [0, 1, 0, 0] }), {});
  assert.throws(() => setStoryboard3DBoneOverride({}, 'missing', {}), /Unknown character bone/);
  assert.deepEqual(setStoryboard3DBoneOverride({}, 'pelvis', {}), { pelvis: [0, 0, 0, 1] });
});

test('characterRig: character state falls back to valid ids and normalizes numbers', () => {
  assert.deepEqual(normalizeStoryboard3DCharacterState({}), {
    bodyPresetId: 'adult-male',
    actionId: 'standing',
    actionTime: 0,
    actionPlaying: false,
    leftHandPoseId: 'relaxed',
    rightHandPoseId: 'relaxed',
    boneOverrides: {},
  });
  assert.equal(
    normalizeStoryboard3DCharacterState({
      actionId: 'missing',
      actionTime: -3,
      actionPlaying: 1,
      heightCm: 180,
    }).actionId,
    'standing',
  );
});

test('characterRig: looping and one-shot actions seek and advance correctly', () => {
  assert.equal(
    seekStoryboard3DCharacterAction({ actionId: 'walking-left', actionPlaying: true }, 1.25).actionTime,
    0.35,
  );
  assert.equal(
    advanceStoryboard3DCharacterAction({ actionId: 'jump', actionPlaying: true, actionTime: 1.099 }, 0.01)
      .actionPlaying,
    false,
  );
  assert.equal(
    advanceStoryboard3DCharacterAction({ actionId: 'jump', actionPlaying: false, actionTime: 0.2 }, 1)
      .actionTime,
    0.2,
  );
});

test('characterRig: resolved poses include body height and bone quaternions', () => {
  const pose = resolveStoryboard3DCharacterPose({
    bodyPresetId: 'adult-female',
    actionId: 'walking-left',
    leftHandPoseId: 'open',
    rightHandPoseId: 'open',
    heightCm: 180,
  });
  assert.equal(pose.body.height, 1.8);
  assert.ok(pose.resolvedBoneQuaternions.hand_l);
  assert.ok(composeStoryboard3DCharacterBoneQuaternions(pose).hand_r);
});

test('characterRig: pose application multiplies quaternions on a model and updates matrices', () => {
  const calls = [];
  const model = {
    getObjectByName(name) {
      if (name !== 'hand_l') return null;
      return {
        quaternion: {
          multiply(value) {
            calls.push(['multiply', value]);
          },
        },
      };
    },
    updateMatrixWorld(value) {
      calls.push(['updateMatrixWorld', value]);
    },
  };
  assert.equal(
    applyStoryboard3DCharacterPoseToModel(model, { leftHandPoseId: 'open', rightHandPoseId: 'open' }),
    model,
  );
  assert.equal(calls.filter(([name]) => name === 'multiply').length, 1);
  assert.deepEqual(calls.at(-1), ['updateMatrixWorld', true]);
});

test('characterRig: bone edit state selects valid bones and commits overrides', () => {
  const state = createStoryboard3DBoneEditState(
    { boneOverrides: { pelvis: [0, 1, 0, 0] } },
    { selectedBoneName: 'missing' },
  );
  assert.equal(state.selectedBoneName, 'pelvis');
  const updated = updateStoryboard3DBoneEditState(state, 'neck_01', { x: 3, y: 0, z: 0 });
  assert.equal(updated.selectedBoneName, 'neck_01');
  assert.equal(updated.localEulerByBone.neck_01.x, 0.8);
  assert.ok(commitStoryboard3DBoneEditState(updated, updated).boneOverrides.neck_01);
});
