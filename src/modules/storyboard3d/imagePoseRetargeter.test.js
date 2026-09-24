import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_IMAGE_POSE_MIN_VISIBILITY,
  MEDIAPIPE_POSE_LANDMARK_INDEX,
  retargetMediaPipePoseToStoryboard3D,
} from './imagePoseRetargeter.js';

const BONE_NAMES = [
  'pelvis',
  'spine_01',
  'spine_02',
  'spine_03',
  'neck_01',
  'Head',
  'upperarm_l',
  'lowerarm_l',
  'hand_l',
  'upperarm_r',
  'lowerarm_r',
  'hand_r',
  'thigh_l',
  'calf_l',
  'foot_l',
  'thigh_r',
  'calf_r',
  'foot_r',
];

function landmarks(points = {}, visibility = 1) {
  return Array.from({ length: 33 }, (_unused, index) => {
    const point = points[index] || {};
    return { x: point.x || 0, y: point.y || 0, z: point.z || 0, visibility };
  });
}

const T_POSE = landmarks({
  [MEDIAPIPE_POSE_LANDMARK_INDEX.nose]: { x: 0, y: 1.7, z: 0.1 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftEar]: { x: -0.15, y: 1.55, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightEar]: { x: 0.15, y: 1.55, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftShoulder]: { x: -0.2, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightShoulder]: { x: 0.2, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftElbow]: { x: -0.45, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightElbow]: { x: 0.45, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftWrist]: { x: -0.7, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightWrist]: { x: 0.7, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftPinky]: { x: -0.75, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightPinky]: { x: 0.75, y: 1.4, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftIndex]: { x: -0.75, y: 1.42, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightIndex]: { x: 0.75, y: 1.42, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftHip]: { x: -0.1, y: 0.9, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightHip]: { x: 0.1, y: 0.9, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftKnee]: { x: -0.1, y: 0.5, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightKnee]: { x: 0.1, y: 0.5, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftAnkle]: { x: -0.1, y: 0.1, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightAnkle]: { x: 0.1, y: 0.1, z: 0 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.leftFootIndex]: { x: -0.1, y: 0.05, z: 0.15 },
  [MEDIAPIPE_POSE_LANDMARK_INDEX.rightFootIndex]: { x: 0.1, y: 0.05, z: 0.15 },
});

const AXIS_ALIGNED = {
  worldLandmarks: T_POSE.map((point, index) =>
    index === MEDIAPIPE_POSE_LANDMARK_INDEX.nose ? { ...point, z: 0 } : point,
  ),
};

function flipLimb(pose, index, replacement) {
  const next = pose.map((point, position) =>
    position === index ? { ...point, ...replacement } : { ...point },
  );
  return next;
}

function mirrorPose(pose, { x = false, y = false, z = false } = {}) {
  return {
    worldLandmarks: pose.map((point) => ({
      ...point,
      x: x ? -point.x : point.x,
      y: y ? -point.y : point.y,
      z: z ? -point.z : point.z,
    })),
  };
}

function assertUnitQuaternion(value, label) {
  assert.ok(Array.isArray(value), label + ' 应为四元数数组');
  assert.equal(value.length, 4, label + ' 长度应为 4');
  assert.ok(
    value.every((entry) => Number.isFinite(entry)),
    label + ' 分量应为有限数',
  );
  const length = Math.hypot(...value);
  assert.ok(Math.abs(length - 1) < 1e-9, label + ' 应为单位四元数，实际模长 ' + length);
  assert.ok(value[3] >= 0, label + ' 的 w 分量应为非负（统一符号约定）');
}

function assertQuaternionClose(value, expected, label, epsilon = 1e-12) {
  for (let index = 0; index < 4; index += 1) {
    assert.ok(
      Math.abs(value[index] - expected[index]) <= epsilon,
      label + ' 分量 ' + index + ' 期望 ' + expected[index] + ' 实际 ' + value[index],
    );
  }
}

test('姿态重定向：常量与地标索引冻结', () => {
  assert.equal(DEFAULT_IMAGE_POSE_MIN_VISIBILITY, 0.5);
  assert.ok(Object.isFrozen(MEDIAPIPE_POSE_LANDMARK_INDEX));
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.nose, 0);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.leftEar, 7);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.rightEar, 8);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.leftShoulder, 11);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.rightShoulder, 12);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.leftWrist, 15);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.rightWrist, 16);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.leftHip, 23);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.rightHip, 24);
  assert.equal(MEDIAPIPE_POSE_LANDMARK_INDEX.rightFootIndex, 32);
});

test('姿态重定向：无效地标返回 POSE_LANDMARKS_INVALID', () => {
  for (const input of [null, undefined, {}, 'pose', 7, [], landmarks().slice(0, 32)]) {
    const result = retargetMediaPipePoseToStoryboard3D(input);
    assert.equal(result.confidence, 0);
    assert.deepEqual(result.boneOverrides, {});
    assert.deepEqual(result.boneConfidence, {});
    assert.equal(result.warnings.length, 1);
    assert.equal(result.warnings[0].code, 'POSE_LANDMARKS_INVALID');
    assert.equal(
      result.warnings[0].message,
      'MediaPipe pose retargeting requires at least 33 world landmarks.',
    );
  }
});

test('姿态重定向：无法确定身体比例返回 POSE_SCALE_UNAVAILABLE', () => {
  const collapsed = landmarks({ [MEDIAPIPE_POSE_LANDMARK_INDEX.leftShoulder]: { x: 0, y: 0, z: 0 } });
  const result = retargetMediaPipePoseToStoryboard3D(collapsed);
  assert.equal(result.confidence, 0);
  assert.deepEqual(result.boneOverrides, {});
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, 'POSE_SCALE_UNAVAILABLE');
  assert.equal(result.warnings[0].message, 'Pose landmarks do not contain a usable torso or body scale.');
});

test('姿态重定向：T 字姿态产出全量骨骼与单位四元数', () => {
  const result = retargetMediaPipePoseToStoryboard3D({ worldLandmarks: T_POSE });
  assert.deepEqual(result.warnings, []);
  assert.equal(result.confidence, 1);
  assert.deepEqual(Object.keys(result.boneOverrides).sort(), [...BONE_NAMES].sort());
  assert.deepEqual(Object.keys(result.boneConfidence).sort(), [...BONE_NAMES].sort());
  for (const name of BONE_NAMES) {
    assertUnitQuaternion(result.boneOverrides[name], name);
    assert.equal(result.boneConfidence[name], 1);
  }
});

test('姿态重定向：轴对齐姿态在关闭全部反转时给出单位旋转', () => {
  const result = retargetMediaPipePoseToStoryboard3D(AXIS_ALIGNED, {
    mirrorX: false,
    invertY: false,
    invertZ: false,
  });
  assert.deepEqual(result.warnings, []);
  for (const name of ['pelvis', 'spine_01', 'spine_02', 'spine_03']) {
    assertQuaternionClose(result.boneOverrides[name], [0, 0, 0, 1], name);
  }
});

test('姿态重定向：镜像与翻转选项等价于预处理地标', () => {
  const mirroredX = retargetMediaPipePoseToStoryboard3D(mirrorPose(T_POSE, { x: true }), {
    mirrorX: false,
    invertY: false,
    invertZ: false,
  });
  const optionX = retargetMediaPipePoseToStoryboard3D(T_POSE, {
    mirrorX: true,
    invertY: false,
    invertZ: false,
  });
  assert.deepStrictEqual(mirroredX, optionX);

  const mirroredY = retargetMediaPipePoseToStoryboard3D(mirrorPose(T_POSE, { y: true }), {
    mirrorX: false,
    invertY: false,
    invertZ: false,
  });
  assert.deepStrictEqual(
    mirroredY,
    retargetMediaPipePoseToStoryboard3D(T_POSE, { mirrorX: false, invertY: true, invertZ: false }),
  );

  const mirroredZ = retargetMediaPipePoseToStoryboard3D(mirrorPose(T_POSE, { z: true }), {
    mirrorX: false,
    invertY: false,
    invertZ: false,
  });
  assert.deepStrictEqual(
    mirroredZ,
    retargetMediaPipePoseToStoryboard3D(T_POSE, { mirrorX: false, invertY: false, invertZ: true }),
  );

  assert.deepStrictEqual(
    retargetMediaPipePoseToStoryboard3D(T_POSE, {}),
    retargetMediaPipePoseToStoryboard3D(T_POSE),
  );
});

test('姿态重定向：低可见度骨骼被跳过且阈值受夹取', () => {
  const pose = {
    worldLandmarks: flipLimb(T_POSE, MEDIAPIPE_POSE_LANDMARK_INDEX.leftWrist, { visibility: 0.2 }),
  };
  const result = retargetMediaPipePoseToStoryboard3D(pose);
  const skipped = result.warnings.find((entry) => entry.code === 'LOW_CONFIDENCE_BONES_SKIPPED');
  assert.ok(skipped);
  assert.deepEqual(skipped.bones.sort(), ['hand_l', 'lowerarm_l']);
  assert.equal(skipped.threshold, 0.5);
  assert.equal(result.boneConfidence.lowerarm_l, 0.2);
  assert.equal(result.boneConfidence.hand_l, 0.2);
  assert.equal(result.boneConfidence.upperarm_l, 1);
  assert.equal(result.boneOverrides.lowerarm_l, undefined);
  assert.equal(result.boneOverrides.hand_l, undefined);
  assert.equal(Object.keys(result.boneOverrides).length, 16);
  assert.ok(Math.abs(result.confidence - (16 + 0.4) / 18) < 1e-12);

  const relaxed = retargetMediaPipePoseToStoryboard3D(pose, { minVisibility: 0 });
  assert.deepEqual(relaxed.warnings, []);
  assert.equal(Object.keys(relaxed.boneOverrides).length, 18);

  const clampedHigh = retargetMediaPipePoseToStoryboard3D(pose, { minVisibility: 2 });
  const clamped = clampedHigh.warnings.find((entry) => entry.code === 'LOW_CONFIDENCE_BONES_SKIPPED');
  assert.ok(clamped);
  assert.equal(clamped.threshold, 1);
  assert.deepEqual(clamped.bones.sort(), ['hand_l', 'lowerarm_l']);

  const boundary = retargetMediaPipePoseToStoryboard3D(pose, { minVisibility: 0.2 });
  assert.deepEqual(boundary.warnings, []);
});

test('姿态重定向：退化骨骼段被跳过', () => {
  const pose = {
    worldLandmarks: flipLimb(T_POSE, MEDIAPIPE_POSE_LANDMARK_INDEX.leftElbow, {
      x: T_POSE[MEDIAPIPE_POSE_LANDMARK_INDEX.leftShoulder].x,
      y: T_POSE[MEDIAPIPE_POSE_LANDMARK_INDEX.leftShoulder].y,
      z: T_POSE[MEDIAPIPE_POSE_LANDMARK_INDEX.leftShoulder].z,
    }),
  };
  const result = retargetMediaPipePoseToStoryboard3D(pose);
  const degenerate = result.warnings.find((entry) => entry.code === 'DEGENERATE_POSE_SEGMENTS_SKIPPED');
  assert.ok(degenerate);
  assert.deepEqual(degenerate.bones.sort(), ['hand_l', 'lowerarm_l', 'upperarm_l']);
  assert.equal(result.boneOverrides.upperarm_l, undefined);
  assert.ok(result.boneOverrides.upperarm_r);
  assert.equal(result.warnings.length, 1);
});

test('姿态重定向：缺少可见度字段时按完全可见处理', () => {
  const bare = T_POSE.map(({ x, y, z }) => ({ x, y, z }));
  const result = retargetMediaPipePoseToStoryboard3D(bare);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.confidence, 1);
  assert.equal(Object.keys(result.boneOverrides).length, 18);

  const presenceOnly = T_POSE.map(({ x, y, z }, index) => ({ x, y, z, presence: index === 15 ? 0.3 : 1 }));
  const partial = retargetMediaPipePoseToStoryboard3D(presenceOnly);
  const skipped = partial.warnings.find((entry) => entry.code === 'LOW_CONFIDENCE_BONES_SKIPPED');
  assert.ok(skipped);
  assert.deepEqual(skipped.bones.sort(), ['hand_l', 'lowerarm_l']);
  assert.equal(partial.boneConfidence.lowerarm_l, 0.3);
});

test('姿态重定向：接受四种地标形状', () => {
  const direct = retargetMediaPipePoseToStoryboard3D(T_POSE);
  assert.deepStrictEqual(retargetMediaPipePoseToStoryboard3D([T_POSE]), direct);
  assert.deepStrictEqual(retargetMediaPipePoseToStoryboard3D({ landmarks: T_POSE }), direct);
  assert.deepStrictEqual(retargetMediaPipePoseToStoryboard3D({ poseWorldLandmarks: T_POSE }), direct);
  assert.deepStrictEqual(retargetMediaPipePoseToStoryboard3D({ worldLandmarks: [T_POSE] }), direct);

  const nested = { worldLandmarks: [T_POSE.slice(1)] };
  assert.equal(retargetMediaPipePoseToStoryboard3D(nested).warnings[0].code, 'POSE_LANDMARKS_INVALID');
});
