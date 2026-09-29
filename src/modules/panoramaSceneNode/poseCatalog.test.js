import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_MANNEQUIN_POSE_ID,
  PANORAMA_CHARACTER_BONES,
  createCustomMannequinPose,
  findMannequinPosePreset,
  listMannequinPosePresets,
  normalizeBonePose,
  normalizeCustomMannequinPose,
  resolveMannequinPose,
  validateCustomMannequinPose,
} from './poseCatalog.js';

function bone(presetId, boneName) {
  return findMannequinPosePreset(presetId).bones[boneName];
}

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-12, 'expected ' + actual + ' to be近 ' + expected);
}

test('骨骼名单冻结且包含根骨与头骨', () => {
  assert.equal(Object.isFrozen(PANORAMA_CHARACTER_BONES), true);
  assert.equal(PANORAMA_CHARACTER_BONES.length, 21);
  assert.ok(PANORAMA_CHARACTER_BONES.includes('root'));
  assert.ok(PANORAMA_CHARACTER_BONES.includes('Head'));
  assert.ok(PANORAMA_CHARACTER_BONES.includes('upperarm_l'));
  assert.ok(PANORAMA_CHARACTER_BONES.includes('foot_r'));
});

test('normalizeBonePose 只保留已知骨骼并夹到 ±π', () => {
  assert.deepEqual(
    normalizeBonePose({
      upperarm_l: { x: 10, y: 0, z: 0 },
      lowerarm_r: { x: -10, y: 0, z: 0 },
      unknown_bone: { x: 1, y: 1, z: 1 },
    }),
    {
      upperarm_l: { x: Math.PI, y: 0, z: 0 },
      lowerarm_r: { x: -Math.PI, y: 0, z: 0 },
    },
  );
});

test('normalizeBonePose 丢弃近零与非法骨骼值', () => {
  assert.deepEqual(normalizeBonePose({ upperarm_l: { x: 1e-12, y: 0, z: 0 } }), {});
  assert.deepEqual(normalizeBonePose({ upperarm_l: 5 }), {});
  assert.deepEqual(normalizeBonePose({ upperarm_l: null }), {});
  assert.deepEqual(normalizeBonePose({ upperarm_l: 'abc' }), {});
  assert.deepEqual(normalizeBonePose(), {});
});

test('normalizeBonePose 把缺失与非法通道当作 0', () => {
  assert.deepEqual(normalizeBonePose({ upperarm_l: { x: 1 } }), {
    upperarm_l: { x: 1, y: 0, z: 0 },
  });
  assert.deepEqual(normalizeBonePose({ upperarm_l: { x: 'abc', y: 2, z: 0 } }), {
    upperarm_l: { x: 0, y: 2, z: 0 },
  });
});

test('默认姿势 id 为 neutral 且可查到', () => {
  assert.equal(DEFAULT_MANNEQUIN_POSE_ID, 'neutral');
  assert.deepEqual(findMannequinPosePreset('neutral'), {
    id: 'neutral',
    name: 'Neutral',
    category: 'basic',
    tags: ['stand', 'default'],
    bones: {},
  });
});

test('findMannequinPosePreset 去空白并拒绝未知 id', () => {
  assert.equal(findMannequinPosePreset('  wave-left  ').id, 'wave-left');
  assert.equal(findMannequinPosePreset('nope'), null);
  assert.equal(findMannequinPosePreset(null), null);
  assert.equal(findMannequinPosePreset(''), null);
});

test('姿势预设共 27 条并按类别分布', () => {
  const presets = listMannequinPosePresets();
  assert.equal(presets.length, 27);
  const counts = {};
  for (const preset of presets) counts[preset.category] = (counts[preset.category] || 0) + 1;
  assert.deepEqual(counts, { basic: 4, gesture: 7, action: 5, locomotion: 4, dance: 7 });
  for (const preset of presets) {
    assert.equal(Object.isFrozen(preset), true);
    assert.equal(Object.isFrozen(preset.tags), true);
    assert.equal(Object.isFrozen(preset.bones), true);
  }
});

test('listMannequinPosePresets 支持类别与关键词过滤', () => {
  assert.equal(listMannequinPosePresets({ category: 'dance' }).length, 7);
  assert.ok(listMannequinPosePresets({ category: 'dance' }).every((p) => p.category === 'dance'));
  assert.equal(listMannequinPosePresets({ query: 'salsa' }).length, 2);
  assert.equal(listMannequinPosePresets({ query: 'clap' }).length, 1);
  assert.deepEqual(
    listMannequinPosePresets({ category: ' DANCE ', query: ' SALSA ' }).map((p) => p.id),
    ['dance-salsa-left', 'dance-salsa-right'],
  );
  assert.deepEqual(listMannequinPosePresets({ category: 'unknown' }), []);
  assert.deepEqual(listMannequinPosePresets({ query: 'zzz' }), []);
});

test('镜像预设交换左右骨骼并翻转 y 与 z', () => {
  const left = bone('wave-left', 'upperarm_l');
  assert.equal(left.x, -0.35);
  assert.equal(left.y, -0.15);
  assert.equal(left.z, -1.85);
  const right = bone('wave-right', 'upperarm_r');
  assert.equal(right.x, -0.35);
  closeTo(right.y, 0.15);
  assert.equal(right.z, 1.85);
  const mirroredTorso = bone('wave-right', 'spine_03');
  closeTo(mirroredTorso.y, -0.08);
  assert.equal(mirroredTorso.x, 0);
  assert.equal(bone('point-right', 'upperarm_r').x, -0.15);
  assert.equal(bone('walk-right', 'thigh_r').x, -0.5);
  assert.equal(bone('walk-right', 'thigh_l').x, 0.42);
});

test('镜像预设不带自身时保留原侧命名', () => {
  const right = findMannequinPosePreset('wave-right');
  assert.ok(right.tags.includes('hello'));
  assert.equal(right.category, 'gesture');
  assert.equal(right.bones.upperarm_r !== undefined, true);
  assert.equal(right.bones.upperarm_l !== undefined, true);
});

test('resolveMannequinPose 缺省与未知 id 都回落到 neutral', () => {
  assert.equal(resolveMannequinPose().id, 'neutral');
  assert.equal(resolveMannequinPose('nope').id, 'neutral');
  assert.equal(resolveMannequinPose('   ').id, 'neutral');
  assert.equal(resolveMannequinPose('  sit ').id, 'sit');
});

test('resolveMannequinPose 对 custom 使用传入的自定义姿势', () => {
  const resolved = resolveMannequinPose('custom', {
    id: ' my-pose ',
    name: ' 我的姿势 ',
    bones: { upperarm_l: { x: 0.5, y: 0, z: 0 } },
  });
  assert.equal(resolved.id, 'my-pose');
  assert.equal(resolved.name, '我的姿势');
  assert.equal(resolved.category, 'custom');
  assert.deepEqual(resolved.bones, { upperarm_l: { x: 0.5, y: 0, z: 0 } });
  assert.equal(resolveMannequinPose('custom').id, 'neutral');
});

test('normalizeCustomMannequinPose 补齐缺省字段', () => {
  assert.deepEqual(normalizeCustomMannequinPose(), {
    id: 'custom',
    name: 'Custom pose',
    category: 'custom',
    tags: [],
    bones: {},
  });
  assert.deepEqual(normalizeCustomMannequinPose({ id: '   ' }), {
    id: 'custom',
    name: 'Custom pose',
    category: 'custom',
    tags: [],
    bones: {},
  });
});

test('normalizeCustomMannequinPose 截断名称并清洗标签', () => {
  const longName = 'x'.repeat(120);
  const normalized = normalizeCustomMannequinPose({
    name: longName,
    tags: [' a ', '', '  ', 'b', ...Array.from({ length: 20 }, (_, index) => 't' + index)],
  });
  assert.equal(normalized.name.length, 80);
  assert.equal(normalized.name, 'x'.repeat(80));
  assert.equal(normalized.tags.length, 12);
  assert.deepEqual(normalized.tags.slice(0, 2), ['a', 'b']);
  assert.deepEqual(normalizeCustomMannequinPose({ tags: 'not-array' }).tags, []);
});

test('normalizeCustomMannequinPose 规范化骨骼', () => {
  const normalized = normalizeCustomMannequinPose({
    bones: { upperarm_l: { x: 9, y: 0, z: 0 }, bogus: { x: 1, y: 1, z: 1 } },
  });
  assert.deepEqual(normalized.bones, { upperarm_l: { x: Math.PI, y: 0, z: 0 } });
});

test('createCustomMannequinPose 接受命名参数', () => {
  assert.deepEqual(
    createCustomMannequinPose({ id: 'p1', name: 'P1', bones: { Head: { x: 0.2, y: 0, z: 0 } } }),
    {
      id: 'p1',
      name: 'P1',
      category: 'custom',
      tags: [],
      bones: { Head: { x: 0.2, y: 0, z: 0 } },
    },
  );
  assert.deepEqual(createCustomMannequinPose(), normalizeCustomMannequinPose());
});

test('validateCustomMannequinPose 通过合法姿势', () => {
  const result = validateCustomMannequinPose({
    id: 'ok',
    name: 'Okay',
    bones: { upperarm_l: { x: 0.1, y: 0, z: 0 } },
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pose.bones, { upperarm_l: { x: 0.1, y: 0, z: 0 } });
  assert.equal(result.pose.category, 'custom');
});

test('validateCustomMannequinPose 报告非法输入与未知骨骼', () => {
  const notObject = validateCustomMannequinPose(undefined);
  assert.equal(notObject.ok, false);
  assert.deepEqual(notObject.errors, ['Pose must be an object.', 'Pose bones are required.']);
  assert.equal(notObject.pose.id, 'custom');

  assert.throws(() => validateCustomMannequinPose(null), TypeError);

  const noBones = validateCustomMannequinPose({});
  assert.equal(noBones.ok, false);
  assert.deepEqual(noBones.errors, ['Pose bones are required.']);

  const unknown = validateCustomMannequinPose({
    bones: { bogus_one: { x: 1, y: 0, z: 0 }, bogus_two: { x: 1, y: 0, z: 0 } },
  });
  assert.equal(unknown.ok, false);
  assert.deepEqual(unknown.errors, ['Unknown bones: bogus_one, bogus_two']);
  assert.deepEqual(unknown.pose.bones, {});

  const stringBones = validateCustomMannequinPose({ bones: 'abc' });
  assert.equal(stringBones.ok, false);
  assert.ok(stringBones.errors.includes('Pose bones are required.'));
});
