import { PANORAMA_CHARACTER_BONES, normalizeBonePose } from '../panoramaSceneNode/poseCatalog.js';
import { sampleCharacterActionPose } from './characterActionSampling.js';
function bodyPreset(
  _0x4c2047,
  _0x398eb3,
  {
    gender: gender = 'male',
    ageGroup: ageGroup = 'adult',
    height: height = 1.72,
    shoulderScale: shoulderScale = 0x1,
    hipScale: hipScale = 0x1,
    headScale: headScale = 0x1,
    depthScale: depthScale = 0x1,
    posture: posture = {},
    tags: tags = [],
  } = {},
) {
  return Object['freeze']({
    id: _0x4c2047,
    name: _0x398eb3,
    gender: gender,
    ageGroup: ageGroup,
    height: height,
    shoulderScale: shoulderScale,
    hipScale: hipScale,
    headScale: headScale,
    depthScale: depthScale,
    posture: Object['freeze'](structuredClone(posture)),
    tags: Object['freeze']([...tags]),
  });
}
const SENIOR_POSTURE = Object['freeze']({
  spine_01: Object['freeze']({ x: 0.1, y: 0x0, z: 0x0 }),
  spine_02: Object['freeze']({ x: 0.07, y: 0x0, z: 0x0 }),
  neck_01: Object['freeze']({ x: -0.06, y: 0x0, z: 0x0 }),
});
export const STORYBOARD_3D_BODY_PRESETS = Object['freeze']([
  bodyPreset('adult-male', '成年男性', {
    gender: 'male',
    height: 1.78,
    shoulderScale: 1.05,
    hipScale: 0.96,
    tags: ['成人', '大人', '男性', '男人'],
  }),
  bodyPreset('adult-female', '成年女性', {
    gender: 'female',
    height: 1.68,
    shoulderScale: 0.94,
    hipScale: 1.04,
    tags: ['成人', '大人', '女性', '女人'],
  }),
  bodyPreset('slim-adult', '纤细成人', {
    gender: 'male',
    height: 1.74,
    shoulderScale: 0.8,
    hipScale: 0.78,
    headScale: 1.03,
    depthScale: 0.78,
    tags: ['成人', '大人', '纤细', '瘦', '瘦人'],
  }),
  bodyPreset('heavy-adult', '壮硕成人', {
    gender: 'male',
    height: 1.72,
    shoulderScale: 1.24,
    hipScale: 1.28,
    headScale: 0.97,
    depthScale: 1.3,
    tags: ['成人', '大人', '壮硕', '胖', '胖人'],
  }),
  bodyPreset('senior-male', '老年男性', {
    gender: 'male',
    ageGroup: 'senior',
    height: 1.7,
    shoulderScale: 0.98,
    hipScale: 0.98,
    headScale: 1.04,
    posture: SENIOR_POSTURE,
    tags: ['老人', '老年人', '爷爷', '男性'],
  }),
  bodyPreset('senior-female', '老年女性', {
    gender: 'female',
    ageGroup: 'senior',
    height: 1.58,
    shoulderScale: 0.91,
    hipScale: 1.03,
    headScale: 1.05,
    posture: SENIOR_POSTURE,
    tags: ['老人', '老年人', '奶奶', '女性'],
  }),
  bodyPreset('youth-male', '青年男性', {
    gender: 'male',
    ageGroup: 'youth',
    height: 1.7,
    shoulderScale: 0x1,
    hipScale: 0.97,
    headScale: 1.03,
    tags: ['青年', '年轻人', '男青年'],
  }),
  bodyPreset('youth-female', '青年女性', {
    gender: 'female',
    ageGroup: 'youth',
    height: 1.62,
    shoulderScale: 0.93,
    hipScale: 1.02,
    headScale: 1.04,
    tags: ['青年', '年轻人', '女青年'],
  }),
  bodyPreset('child-male', '男孩', {
    gender: 'male',
    ageGroup: 'child',
    height: 1.28,
    shoulderScale: 0.84,
    hipScale: 0.9,
    headScale: 1.18,
    depthScale: 0.94,
    tags: ['儿童', '小孩', '孩子', '男孩'],
  }),
  bodyPreset('child-female', '女孩', {
    gender: 'female',
    ageGroup: 'child',
    height: 1.24,
    shoulderScale: 0.82,
    hipScale: 0.91,
    headScale: 1.19,
    depthScale: 0.94,
    tags: ['儿童', '小孩', '孩子', '女孩'],
  }),
  bodyPreset('toddler', '幼儿', {
    gender: 'male',
    ageGroup: 'toddler',
    height: 0.92,
    shoulderScale: 0.78,
    hipScale: 0.88,
    headScale: 1.34,
    depthScale: 0.98,
    tags: ['幼儿', '幼童', '小孩', '孩子'],
  }),
  bodyPreset('child', '儿童（通用）', {
    gender: 'male',
    ageGroup: 'child',
    height: 1.25,
    shoulderScale: 0.82,
    hipScale: 0.9,
    headScale: 1.18,
    depthScale: 0.94,
    tags: ['儿童', '小孩', '孩子', '兼容'],
  }),
  bodyPreset('muscular-adult', '健壮成人', {
    height: 1.85,
    shoulderScale: 1.35,
    hipScale: 1.02,
    depthScale: 1.2,
    tags: ['健壮', '肌肉'],
  }),
  bodyPreset('tall-adult', '高挑成人', {
    height: 2.05,
    shoulderScale: 0.94,
    hipScale: 0.9,
    headScale: 0.9,
    tags: ['高挑', '高个'],
  }),
  bodyPreset('chibi', '大头卡通人偶', {
    height: 1.1,
    shoulderScale: 0.85,
    hipScale: 0.9,
    headScale: 1.45,
    tags: ['卡通', 'Q版'],
  }),
]);
export const STORYBOARD_3D_ACTIONS = Object['freeze']([
  Object['freeze']({ id: 'standing', name: '站立', poseId: 'neutral', loop: ![], duration: 0x1 }),
  Object['freeze']({
    id: 'standing-relaxed',
    name: '放松站立',
    poseId: 'idle-relaxed',
    loop: !![],
    duration: 2.4,
  }),
  Object['freeze']({ id: 'seated', name: '坐姿', poseId: 'sit', loop: ![], duration: 0x1 }),
  Object['freeze']({
    id: 'walking-left',
    name: '行走（左脚）',
    poseId: 'walk-left',
    loop: !![],
    duration: 0.9,
  }),
  Object['freeze']({
    id: 'walking-right',
    name: '行走（右脚）',
    poseId: 'walk-right',
    loop: !![],
    duration: 0.9,
  }),
  Object['freeze']({
    id: 'running-left',
    name: '跑步（左脚）',
    poseId: 'run-left',
    loop: !![],
    duration: 0.62,
  }),
  Object['freeze']({
    id: 'running-right',
    name: '跑步（右脚）',
    poseId: 'run-right',
    loop: !![],
    duration: 0.62,
  }),
  Object['freeze']({ id: 'dialogue', name: '对话', poseId: 'point-right', loop: !![], duration: 2.2 }),
  Object['freeze']({ id: 'jump', name: '跳跃', poseId: 'dance-jump', loop: ![], duration: 1.1 }),
  ...[
    ['squat', '蹲姿'],
    ['wave-left', '左手挥手'],
    ['wave-right', '右手挥手'],
    ['point-left', '左手指向'],
    ['point-right', '右手指向'],
    ['hands-up', '举起双手'],
    ['celebrate', '庆祝'],
    ['clap', '鼓掌姿势'],
    ['bow', '鞠躬'],
    ['kick-left', '左脚踢腿'],
    ['kick-right', '右脚踢腿'],
    ['dance-groove', '舞蹈律动姿势'],
    ['dance-ballet', '芭蕾姿势'],
    ['lean-left', '左侧倾身'],
    ['lean-right', '右侧倾身'],
  ]['map'](([_0x23e7b6, _0x2a38e3]) =>
    Object['freeze']({ id: _0x23e7b6, name: _0x2a38e3, poseId: _0x23e7b6, loop: ![], duration: 0x1 }),
  ),
]);
export const STORYBOARD_3D_HAND_POSES = Object['freeze']([
  Object['freeze']({ id: 'relaxed', name: '自然', rotation: { x: 0x0, y: 0x0, z: 0x0 } }),
  Object['freeze']({ id: 'open', name: '张开', rotation: { x: 0.08, y: 0x0, z: 0x0 } }),
  Object['freeze']({ id: 'fist', name: '握拳', rotation: { x: -0.18, y: 0x0, z: 0x0 } }),
  Object['freeze']({ id: 'point', name: '指向', rotation: { x: -0.05, y: 0.08, z: 0x0 } }),
  Object['freeze']({
    id: 'grip',
    name: '抓握',
    rotation: { x: -0.22, y: 0.04, z: 0x0 },
    fingerCurl: 0x1,
    thumbCurl: 0.75,
  }),
]);
const BODY_BY_ID = new Map(STORYBOARD_3D_BODY_PRESETS['map']((_0x3fa3eb) => [_0x3fa3eb['id'], _0x3fa3eb])),
  ACTION_BY_ID = new Map(STORYBOARD_3D_ACTIONS['map']((_0x54b563) => [_0x54b563['id'], _0x54b563])),
  HAND_BY_ID = new Map(STORYBOARD_3D_HAND_POSES['map']((_0x34243b) => [_0x34243b['id'], _0x34243b])),
  BONE_SET = new Set(PANORAMA_CHARACTER_BONES),
  PI = Math['PI'],
  DEFAULT_LIMIT = Object['freeze']({ x: [-PI, PI], y: [-PI, PI], z: [-PI, PI] });
export const STORYBOARD_3D_BONE_LIMITS = Object['freeze']({
  neck_01: Object['freeze']({ x: [-0.8, 0.8], y: [-1.1, 1.1], z: [-0.65, 0.65] }),
  Head: Object['freeze']({ x: [-0.7, 0.7], y: [-1.15, 1.15], z: [-0.65, 0.65] }),
  lowerarm_l: Object['freeze']({ x: [-2.45, 0.3], y: [-0.65, 0.65], z: [-2.4, 0.25] }),
  lowerarm_r: Object['freeze']({ x: [-2.45, 0.3], y: [-0.65, 0.65], z: [-0.25, 2.4] }),
  calf_l: Object['freeze']({ x: [0x0, 2.65], y: [-0.25, 0.25], z: [-0.25, 0.25] }),
  calf_r: Object['freeze']({ x: [0x0, 2.65], y: [-0.25, 0.25], z: [-0.25, 0.25] }),
});
function clamp(_0x2c7775, _0x1a6c13, _0x39d290) {
  return Math['max'](_0x1a6c13, Math['min'](_0x39d290, Number(_0x2c7775) || 0x0));
}
function mergeBonePoses(..._0x51b050) {
  const _0xe7336e = {};
  return (
    _0x51b050['forEach']((_0x230b44) => {
      Object['entries'](normalizeBonePose(_0x230b44))['forEach'](([_0x3d46fc, _0x3ed93d]) => {
        const _0x1a7bd7 = _0xe7336e[_0x3d46fc] || { x: 0x0, y: 0x0, z: 0x0 };
        _0xe7336e[_0x3d46fc] = {
          x: _0x1a7bd7['x'] + _0x3ed93d['x'],
          y: _0x1a7bd7['y'] + _0x3ed93d['y'],
          z: _0x1a7bd7['z'] + _0x3ed93d['z'],
        };
      });
    }),
    normalizeBonePose(_0xe7336e)
  );
}
export function clampStoryboard3DBoneEuler(_0x595eb3, _0x46b1b0 = {}) {
  if (!BONE_SET['has'](String(_0x595eb3 || ''))) return null;
  const _0x3f50c1 = STORYBOARD_3D_BONE_LIMITS[_0x595eb3] || DEFAULT_LIMIT;
  return {
    x: clamp(_0x46b1b0['x'], _0x3f50c1['x'][0x0], _0x3f50c1['x'][0x1]),
    y: clamp(_0x46b1b0['y'], _0x3f50c1['y'][0x0], _0x3f50c1['y'][0x1]),
    z: clamp(_0x46b1b0['z'], _0x3f50c1['z'][0x0], _0x3f50c1['z'][0x1]),
  };
}
export function eulerToStoryboard3DQuaternion(_0xd3734 = {}) {
  const _0x384799 = Number(_0xd3734['x']) || 0x0,
    _0x25f3ea = Number(_0xd3734['y']) || 0x0,
    _0x247803 = Number(_0xd3734['z']) || 0x0,
    _0x546656 = Math['cos'](_0x384799 / 0x2),
    _0x471ac6 = Math['cos'](_0x25f3ea / 0x2),
    _0xd70f74 = Math['cos'](_0x247803 / 0x2),
    _0xc6fb9d = Math['sin'](_0x384799 / 0x2),
    _0x27d12e = Math['sin'](_0x25f3ea / 0x2),
    _0x3f42c6 = Math['sin'](_0x247803 / 0x2);
  return [
    _0xc6fb9d * _0x471ac6 * _0xd70f74 + _0x546656 * _0x27d12e * _0x3f42c6,
    _0x546656 * _0x27d12e * _0xd70f74 - _0xc6fb9d * _0x471ac6 * _0x3f42c6,
    _0x546656 * _0x471ac6 * _0x3f42c6 + _0xc6fb9d * _0x27d12e * _0xd70f74,
    _0x546656 * _0x471ac6 * _0xd70f74 - _0xc6fb9d * _0x27d12e * _0x3f42c6,
  ];
}
export function normalizeStoryboard3DBoneOverrides(_0x658c6 = {}) {
  const _0x42fbbe = {};
  for (const [_0x17c5db, _0x1bd890] of Object['entries'](_0x658c6 || {})) {
    if (!BONE_SET['has'](_0x17c5db) || !Array['isArray'](_0x1bd890) || _0x1bd890['length'] !== 0x4) continue;
    const _0x499c43 = _0x1bd890['map'](Number);
    if (!_0x499c43['every'](Number['isFinite'])) continue;
    const _0x1a265b = Math['hypot'](..._0x499c43);
    if (_0x1a265b <= 1e-8) continue;
    _0x42fbbe[_0x17c5db] = _0x499c43['map']((_0xe69167) => _0xe69167 / _0x1a265b);
  }
  return _0x42fbbe;
}
export function setStoryboard3DBoneOverride(_0x18f428, _0x3f6599, _0xb85fd8) {
  const _0x22cf2f = clampStoryboard3DBoneEuler(_0x3f6599, _0xb85fd8);
  if (!_0x22cf2f) throw new Error('Unknown character bone: ' + _0x3f6599);
  return {
    ...normalizeStoryboard3DBoneOverrides(_0x18f428),
    [_0x3f6599]: eulerToStoryboard3DQuaternion(_0x22cf2f),
  };
}
export function normalizeStoryboard3DCharacterState(_0x370722 = {}) {
  const _0x28f22c = BODY_BY_ID['has'](_0x370722['bodyPresetId']) ? _0x370722['bodyPresetId'] : 'adult-male',
    _0x1b241b = ACTION_BY_ID['has'](_0x370722['actionId'])
      ? _0x370722['actionId']
      : STORYBOARD_3D_ACTIONS[0x0]['id'],
    _0x15acc3 = HAND_BY_ID['has'](_0x370722['leftHandPoseId']) ? _0x370722['leftHandPoseId'] : 'relaxed',
    _0x2965a3 = HAND_BY_ID['has'](_0x370722['rightHandPoseId']) ? _0x370722['rightHandPoseId'] : 'relaxed';
  return {
    bodyPresetId: _0x28f22c,
    actionId: _0x1b241b,
    actionTime: Math['max'](0x0, Number(_0x370722['actionTime']) || 0x0),
    actionPlaying: _0x370722['actionPlaying'] === !![],
    leftHandPoseId: _0x15acc3,
    rightHandPoseId: _0x2965a3,
    boneOverrides: normalizeStoryboard3DBoneOverrides(_0x370722['boneOverrides']),
  };
}
export function resolveStoryboard3DCharacterPose(_0x32e226 = {}) {
  const _0x1f452f = normalizeStoryboard3DCharacterState(_0x32e226),
    _0x9556f1 = BODY_BY_ID['get'](_0x1f452f['bodyPresetId']),
    _0x4de542 = ACTION_BY_ID['get'](_0x1f452f['actionId']),
    _0x30296f = sampleCharacterActionPose(_0x4de542, _0x1f452f['actionTime']),
    _0xd542e2 = HAND_BY_ID['get'](_0x1f452f['leftHandPoseId']),
    _0x1f2b46 = HAND_BY_ID['get'](_0x1f452f['rightHandPoseId']),
    _0xccd9cc = {
      state: _0x1f452f,
      body: {
        ...structuredClone(_0x9556f1),
        ...(Number['isFinite'](_0x32e226['heightCm'])
          ? { height: Math['max'](0x37, Math['min'](0xe6, _0x32e226['heightCm'])) / 0x64 }
          : {}),
      },
      action: structuredClone(_0x4de542),
      baseBones: mergeBonePoses(_0x9556f1?.['posture'], _0x30296f?.['bones']),
      handRotations: { hand_l: { ..._0xd542e2['rotation'] }, hand_r: { ..._0x1f2b46['rotation'] } },
      handPoses: { left: structuredClone(_0xd542e2), right: structuredClone(_0x1f2b46) },
      boneOverrides: structuredClone(_0x1f452f['boneOverrides']),
    };
  return (
    (_0xccd9cc['resolvedBoneQuaternions'] = composeStoryboard3DCharacterBoneQuaternions(_0xccd9cc)),
    _0xccd9cc
  );
}
export function composeStoryboard3DCharacterBoneQuaternions(_0x3ef0a2 = {}) {
  const _0x47933b =
      _0x3ef0a2?.['baseBones'] && _0x3ef0a2?.['handRotations'] && _0x3ef0a2?.['boneOverrides']
        ? _0x3ef0a2
        : { ...resolveStoryboard3DCharacterPoseParts(_0x3ef0a2) },
    _0x4cdf6a = {
      ...normalizeBonePose(_0x47933b['baseBones']),
      ...normalizeBonePose(_0x47933b['handRotations']),
    },
    _0x305adb = {};
  for (const [_0x1ab56c, _0x12aea1] of Object['entries'](_0x4cdf6a)) {
    _0x305adb[_0x1ab56c] = eulerToStoryboard3DQuaternion(_0x12aea1);
  }
  return { ..._0x305adb, ...normalizeStoryboard3DBoneOverrides(_0x47933b['boneOverrides']) };
}
export function applyStoryboard3DCharacterPoseToModel(
  _0xf0e2b9,
  _0x109207 = {},
  { baseBoneQuaternions: baseBoneQuaternions = {} } = {},
) {
  const _0xac7ef8 = composeStoryboard3DCharacterBoneQuaternions(_0x109207);
  for (const _0x560fab of PANORAMA_CHARACTER_BONES) {
    const _0x26a87e = _0xf0e2b9?.['getObjectByName']?.(_0x560fab);
    if (!_0x26a87e?.['quaternion']) continue;
    const _0x586dd4 = baseBoneQuaternions[_0x560fab];
    _0x586dd4 &&
      typeof _0x26a87e['quaternion']['set'] === 'function' &&
      _0x26a87e['quaternion']['set'](_0x586dd4['x'], _0x586dd4['y'], _0x586dd4['z'], _0x586dd4['w']);
    const _0x45872f = _0xac7ef8[_0x560fab];
    if (!_0x45872f) continue;
    if (typeof _0x26a87e['quaternion']['multiply'] === 'function')
      _0x26a87e['quaternion']['multiply']({
        x: _0x45872f[0x0],
        y: _0x45872f[0x1],
        z: _0x45872f[0x2],
        w: _0x45872f[0x3],
      });
    else
      typeof _0x26a87e['quaternion']['set'] === 'function' &&
        _0x26a87e['quaternion']['set'](_0x45872f[0x0], _0x45872f[0x1], _0x45872f[0x2], _0x45872f[0x3]);
  }
  return (_0xf0e2b9?.['updateMatrixWorld']?.(!![]), _0xf0e2b9);
}
export function setStoryboard3DCharacterActionPlayback(_0x46f669, _0xb04e99) {
  const _0x4db45c = normalizeStoryboard3DCharacterState(_0x46f669);
  return { ..._0x4db45c, actionPlaying: _0xb04e99 === !![] };
}
export function seekStoryboard3DCharacterAction(_0xc75c5e, _0x56ac96) {
  const _0x38245d = normalizeStoryboard3DCharacterState(_0xc75c5e),
    _0x117960 = ACTION_BY_ID['get'](_0x38245d['actionId']),
    _0x1c3048 = Math['max'](0.001, Number(_0x117960['duration']) || 0x1),
    _0xdf2b1a = Math['max'](0x0, Number(_0x56ac96) || 0x0);
  return {
    ..._0x38245d,
    actionTime: _0x117960['loop'] ? _0xdf2b1a % _0x1c3048 : Math['min'](_0xdf2b1a, _0x1c3048),
  };
}
export function advanceStoryboard3DCharacterAction(_0x107f97, _0x501b5e) {
  const _0x53f1a2 = normalizeStoryboard3DCharacterState(_0x107f97);
  if (!_0x53f1a2['actionPlaying']) return _0x53f1a2;
  const _0x4f7bed = ACTION_BY_ID['get'](_0x53f1a2['actionId']),
    _0x362775 = Math['max'](0.001, Number(_0x4f7bed['duration']) || 0x1),
    _0x79e395 = _0x53f1a2['actionTime'] + Math['max'](0x0, Number(_0x501b5e) || 0x0);
  if (_0x4f7bed['loop']) return { ..._0x53f1a2, actionTime: _0x79e395 % _0x362775 };
  if (_0x79e395 >= _0x362775) return { ..._0x53f1a2, actionTime: _0x362775, actionPlaying: ![] };
  return { ..._0x53f1a2, actionTime: _0x79e395 };
}
export function quaternionToStoryboard3DEuler(_0x3b30c6 = []) {
  const _0x35531b = Array['isArray'](_0x3b30c6) ? _0x3b30c6['map'](Number) : [],
    _0x476ae8 =
      _0x35531b['length'] === 0x4 && _0x35531b['every'](Number['isFinite'])
        ? Math['hypot'](..._0x35531b)
        : 0x0,
    _0x416d34 =
      _0x476ae8 > 1e-8 ? _0x35531b['map']((_0x1edd9c) => _0x1edd9c / _0x476ae8) : [0x0, 0x0, 0x0, 0x1],
    [_0x544378, _0x39c8a9, _0x4d8bf6, _0x311721] = _0x416d34,
    _0xd81df5 = 0x1 - 0x2 * (_0x39c8a9 * _0x39c8a9 + _0x4d8bf6 * _0x4d8bf6),
    _0x1a5474 = 0x2 * (_0x544378 * _0x39c8a9 - _0x4d8bf6 * _0x311721),
    _0x197f4f = 0x2 * (_0x544378 * _0x4d8bf6 + _0x39c8a9 * _0x311721),
    _0x246b44 = 0x1 - 0x2 * (_0x544378 * _0x544378 + _0x4d8bf6 * _0x4d8bf6),
    _0x3f82c0 = 0x2 * (_0x39c8a9 * _0x4d8bf6 - _0x544378 * _0x311721),
    _0x3b2f8f = 0x2 * (_0x39c8a9 * _0x4d8bf6 + _0x544378 * _0x311721),
    _0x35100f = 0x1 - 0x2 * (_0x544378 * _0x544378 + _0x39c8a9 * _0x39c8a9),
    _0x3fc87a = { x: 0x0, y: Math['asin'](clamp(_0x197f4f, -0x1, 0x1)), z: 0x0 };
  return (
    Math['abs'](_0x197f4f) < 0.9999999
      ? ((_0x3fc87a['x'] = Math['atan2'](-_0x3f82c0, _0x35100f)),
        (_0x3fc87a['z'] = Math['atan2'](-_0x1a5474, _0xd81df5)))
      : (_0x3fc87a['x'] = Math['atan2'](_0x3b2f8f, _0x246b44)),
    _0x3fc87a
  );
}
export function createStoryboard3DBoneEditState(
  _0x813c79 = {},
  { selectedBoneName: selectedBoneName = 'pelvis', showControls: showControls = !![] } = {},
) {
  const _0x2fe7b5 = normalizeStoryboard3DCharacterState(_0x813c79),
    _0x1e73f2 = {};
  for (const [_0xdfc3ac, _0x3ba641] of Object['entries'](_0x2fe7b5['boneOverrides'])) {
    _0x1e73f2[_0xdfc3ac] = quaternionToStoryboard3DEuler(_0x3ba641);
  }
  return {
    selectedBoneName: BONE_SET['has'](selectedBoneName) ? selectedBoneName : 'pelvis',
    showControls: showControls !== ![],
    localEulerByBone: _0x1e73f2,
    boneOverrides: _0x2fe7b5['boneOverrides'],
  };
}
export function updateStoryboard3DBoneEditState(_0x37f59b, _0x372ce7, _0x7002b8) {
  const _0x5ac722 = clampStoryboard3DBoneEuler(_0x372ce7, _0x7002b8);
  if (!_0x5ac722) throw new Error('Unknown character bone: ' + _0x372ce7);
  return {
    ..._0x37f59b,
    selectedBoneName: _0x372ce7,
    localEulerByBone: { ..._0x37f59b?.['localEulerByBone'], [_0x372ce7]: _0x5ac722 },
    boneOverrides: setStoryboard3DBoneOverride(_0x37f59b?.['boneOverrides'], _0x372ce7, _0x5ac722),
  };
}
export function commitStoryboard3DBoneEditState(_0xc21f1a, _0x32c240) {
  return normalizeStoryboard3DCharacterState({ ..._0xc21f1a, boneOverrides: _0x32c240?.['boneOverrides'] });
}
function resolveStoryboard3DCharacterPoseParts(_0x48645a = {}) {
  const _0x15f96d = normalizeStoryboard3DCharacterState(_0x48645a),
    _0x2c6099 = BODY_BY_ID['get'](_0x15f96d['bodyPresetId']),
    _0x5b3c23 = ACTION_BY_ID['get'](_0x15f96d['actionId']),
    _0x9751d3 = sampleCharacterActionPose(_0x5b3c23, _0x15f96d['actionTime']);
  return {
    baseBones: mergeBonePoses(_0x2c6099?.['posture'], _0x9751d3?.['bones']),
    handRotations: {
      hand_l: { ...HAND_BY_ID['get'](_0x15f96d['leftHandPoseId'])['rotation'] },
      hand_r: { ...HAND_BY_ID['get'](_0x15f96d['rightHandPoseId'])['rotation'] },
    },
    boneOverrides: _0x15f96d['boneOverrides'],
  };
}
