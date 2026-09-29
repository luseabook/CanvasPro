import test from 'node:test';
import assert from 'node:assert/strict';

import { sampleCharacterActionPose } from './characterActionSampling.js';
import { findMannequinPosePreset } from '../panoramaSceneNode/poseCatalog.js';

const AXES = ['x', 'y', 'z'];

function bonesOf(poseId) {
  const preset = findMannequinPosePreset(poseId);
  assert.ok(preset, poseId + ' 预设应存在');
  return preset.bones;
}

function normalize(bones) {
  return Object.fromEntries(
    Object.entries(bones).map(([bone, values]) => [
      bone,
      Object.fromEntries(AXES.map((axis) => [axis, Number(values?.[axis]) || 0])),
    ]),
  );
}

// 姿态插值是 a + (b - a) * t，t 靠近 1 时会带浮点误差，这里按容差比较。
function expectBonesClose(actualBones, expectedPoseId) {
  const expected = normalize(bonesOf(expectedPoseId));
  assert.deepEqual(Object.keys(actualBones).sort(), Object.keys(expected).sort());
  for (const bone of Object.keys(expected)) {
    for (const axis of AXES) {
      assert.ok(
        Math.abs(actualBones[bone][axis] - expected[bone][axis]) < 1e-9,
        bone + '.' + axis + ' 期望 ' + expected[bone][axis] + '，实际 ' + actualBones[bone][axis],
      );
    }
  }
}

test('characterActionSampling: 非循环动作原样回落姿态预设', () => {
  const result = sampleCharacterActionPose({ id: 'stand-idle', poseId: 'walk-left' });
  assert.deepEqual(result, findMannequinPosePreset('walk-left'));
});

test('characterActionSampling: 姿态预设不存在时返回 null', () => {
  assert.equal(sampleCharacterActionPose({ id: 'anything', poseId: 'stand' }), null);
  assert.equal(sampleCharacterActionPose({ id: 'anything', poseId: '' }), null);
});

test('characterActionSampling: 循环动作在相位 0 时取左脚关键姿态', () => {
  const result = sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, 0);
  assert.deepEqual(result.bones, normalize(bonesOf('walk-left')));
});

test('characterActionSampling: 右脚起步整体偏移半个周期', () => {
  const result = sampleCharacterActionPose({ id: 'walking-right', duration: 1 }, 0);
  expectBonesClose(result.bones, 'walk-right');
});

test('characterActionSampling: 半周期处左右脚互换，正好走到另一侧', () => {
  const result = sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, 0.5);
  expectBonesClose(result.bones, 'walk-right');
});

test('characterActionSampling: running 前缀走跑步预设，walking 走走路预设', () => {
  const walk = sampleCharacterActionPose({ id: 'walking-left', duration: 2 }, 0);
  const run = sampleCharacterActionPose({ id: 'running-left', duration: 2 }, 0);
  expectBonesClose(walk.bones, 'walk-left');
  expectBonesClose(run.bones, 'run-left');
  assert.notDeepEqual(walk.bones, run.bones);
});

test('characterActionSampling: 每根骨头的三个轴都是数字', () => {
  const result = sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, 0.25);
  const bones = Object.keys(result.bones);
  assert.ok(bones.length > 0);
  for (const bone of bones) {
    for (const axis of AXES) {
      assert.equal(Number.isFinite(result.bones[bone][axis]), true, bone + '.' + axis);
    }
  }
  const expectedKeys = new Set([
    ...Object.keys(bonesOf('walk-left')),
    ...Object.keys(bonesOf('walk-right')),
  ]);
  assert.deepEqual(bones.sort(), [...expectedKeys].sort());
});

test('characterActionSampling: 时间参数不可用时按 0 处理', () => {
  const explicitZero = sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, 0);
  assert.deepEqual(sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, 'abc').bones, explicitZero.bones);
  assert.deepEqual(sampleCharacterActionPose({ id: 'walking-left', duration: 1 }).bones, explicitZero.bones);
  assert.deepEqual(sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, null).bones, explicitZero.bones);
});

test('characterActionSampling: 采样在整周期后回到起点', () => {
  const base = sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, 0);
  const wrapped = sampleCharacterActionPose({ id: 'walking-left', duration: 1 }, 2);
  for (const bone of Object.keys(base.bones)) {
    for (const axis of AXES) {
      assert.ok(Math.abs(base.bones[bone][axis] - wrapped.bones[bone][axis]) < 1e-9, bone + '.' + axis);
    }
  }
});
