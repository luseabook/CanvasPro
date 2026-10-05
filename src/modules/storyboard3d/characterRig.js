import { PANORAMA_CHARACTER_BONES, normalizeBonePose } from '../panoramaSceneNode/poseCatalog.js';
import { sampleCharacterActionPose } from './characterActionSampling.js';
function bodyPreset(
  id,
  name,
  {
    gender: gender = 'male',
    ageGroup: ageGroup = 'adult',
    height: height = 1.72,
    shoulderScale: shoulderScale = 1,
    hipScale: hipScale = 1,
    headScale: headScale = 1,
    depthScale: depthScale = 1,
    posture: posture = {},
    tags: tags = [],
  } = {},
) {
  return Object['freeze']({
    id: id,
    name: name,
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
  spine_01: Object['freeze']({ x: 0.1, y: 0, z: 0 }),
  spine_02: Object['freeze']({ x: 0.07, y: 0, z: 0 }),
  neck_01: Object['freeze']({ x: -0.06, y: 0, z: 0 }),
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
    shoulderScale: 1,
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
  Object['freeze']({ id: 'standing', name: '站立', poseId: 'neutral', loop: false, duration: 1 }),
  Object['freeze']({
    id: 'standing-relaxed',
    name: '放松站立',
    poseId: 'idle-relaxed',
    loop: true,
    duration: 2.4,
  }),
  Object['freeze']({ id: 'seated', name: '坐姿', poseId: 'sit', loop: false, duration: 1 }),
  Object['freeze']({
    id: 'walking-left',
    name: '行走（左脚）',
    poseId: 'walk-left',
    loop: true,
    duration: 0.9,
  }),
  Object['freeze']({
    id: 'walking-right',
    name: '行走（右脚）',
    poseId: 'walk-right',
    loop: true,
    duration: 0.9,
  }),
  Object['freeze']({
    id: 'running-left',
    name: '跑步（左脚）',
    poseId: 'run-left',
    loop: true,
    duration: 0.62,
  }),
  Object['freeze']({
    id: 'running-right',
    name: '跑步（右脚）',
    poseId: 'run-right',
    loop: true,
    duration: 0.62,
  }),
  Object['freeze']({ id: 'dialogue', name: '对话', poseId: 'point-right', loop: true, duration: 2.2 }),
  Object['freeze']({ id: 'jump', name: '跳跃', poseId: 'dance-jump', loop: false, duration: 1.1 }),
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
  ]['map'](([id2, name2]) =>
    Object['freeze']({ id: id2, name: name2, poseId: id2, loop: false, duration: 1 }),
  ),
]);
export const STORYBOARD_3D_HAND_POSES = Object['freeze']([
  Object['freeze']({ id: 'relaxed', name: '自然', rotation: { x: 0, y: 0, z: 0 } }),
  Object['freeze']({ id: 'open', name: '张开', rotation: { x: 0.08, y: 0, z: 0 } }),
  Object['freeze']({ id: 'fist', name: '握拳', rotation: { x: -0.18, y: 0, z: 0 } }),
  Object['freeze']({ id: 'point', name: '指向', rotation: { x: -0.05, y: 0.08, z: 0 } }),
  Object['freeze']({
    id: 'grip',
    name: '抓握',
    rotation: { x: -0.22, y: 0.04, z: 0 },
    fingerCurl: 1,
    thumbCurl: 0.75,
  }),
]);
const BODY_BY_ID = new Map(STORYBOARD_3D_BODY_PRESETS['map']((value) => [value['id'], value])),
  ACTION_BY_ID = new Map(STORYBOARD_3D_ACTIONS['map']((item) => [item['id'], item])),
  HAND_BY_ID = new Map(STORYBOARD_3D_HAND_POSES['map']((key) => [key['id'], key])),
  BONE_SET = new Set(PANORAMA_CHARACTER_BONES),
  PI = Math['PI'],
  DEFAULT_LIMIT = Object['freeze']({ x: [-PI, PI], y: [-PI, PI], z: [-PI, PI] });
export const STORYBOARD_3D_BONE_LIMITS = Object['freeze']({
  neck_01: Object['freeze']({ x: [-0.8, 0.8], y: [-1.1, 1.1], z: [-0.65, 0.65] }),
  Head: Object['freeze']({ x: [-0.7, 0.7], y: [-1.15, 1.15], z: [-0.65, 0.65] }),
  lowerarm_l: Object['freeze']({ x: [-2.45, 0.3], y: [-0.65, 0.65], z: [-2.4, 0.25] }),
  lowerarm_r: Object['freeze']({ x: [-2.45, 0.3], y: [-0.65, 0.65], z: [-0.25, 2.4] }),
  calf_l: Object['freeze']({ x: [0, 2.65], y: [-0.25, 0.25], z: [-0.25, 0.25] }),
  calf_r: Object['freeze']({ x: [0, 2.65], y: [-0.25, 0.25], z: [-0.25, 0.25] }),
});
function clamp(index, result, data) {
  return Math['max'](result, Math['min'](data, Number(index) || 0));
}
function mergeBonePoses(...list) {
  const options = {};
  return (
    list['forEach']((target) => {
      Object['entries'](normalizeBonePose(target))['forEach'](([source, box]) => {
        const x2 = options[source] || { x: 0, y: 0, z: 0 };
        options[source] = {
          x: x2['x'] + box['x'],
          y: x2['y'] + box['y'],
          z: x2['z'] + box['z'],
        };
      });
    }),
    normalizeBonePose(options)
  );
}
export function clampStoryboard3DBoneEuler(next, box2 = {}) {
  if (!BONE_SET['has'](String(next || ''))) return null;
  const box3 = STORYBOARD_3D_BONE_LIMITS[next] || DEFAULT_LIMIT;
  return {
    x: clamp(box2['x'], box3['x'][0], box3['x'][1]),
    y: clamp(box2['y'], box3['y'][0], box3['y'][1]),
    z: clamp(box2['z'], box3['z'][0], box3['z'][1]),
  };
}
export function eulerToStoryboard3DQuaternion(box4 = {}) {
  const current = Number(box4['x']) || 0,
    entry = Number(box4['y']) || 0,
    record = Number(box4['z']) || 0,
    payload = Math['cos'](current / 2),
    handle = Math['cos'](entry / 2),
    state = Math['cos'](record / 2),
    config = Math['sin'](current / 2),
    scope = Math['sin'](entry / 2),
    input = Math['sin'](record / 2);
  return [
    config * handle * state + payload * scope * input,
    payload * scope * state - config * handle * input,
    payload * handle * input + config * scope * state,
    payload * handle * state - config * scope * input,
  ];
}
export function normalizeStoryboard3DBoneOverrides(options2 = {}) {
  const output = {};
  for (const [value2, list2] of Object['entries'](options2 || {})) {
    if (!BONE_SET['has'](value2) || !Array['isArray'](list2) || list2['length'] !== 4) continue;
    const list3 = list2['map'](Number);
    if (!list3['every'](Number['isFinite'])) continue;
    const count = Math['hypot'](...list3);
    if (count <= 1e-8) continue;
    output[value2] = list3['map']((value3) => value3 / count);
  }
  return output;
}
export function setStoryboard3DBoneOverride(value4, value5, value6) {
  const clampStoryboard3DBoneEuler2 = clampStoryboard3DBoneEuler(value5, value6);
  if (!clampStoryboard3DBoneEuler2) throw new Error('Unknown character bone: ' + value5);
  return {
    ...normalizeStoryboard3DBoneOverrides(value4),
    [value5]: eulerToStoryboard3DQuaternion(clampStoryboard3DBoneEuler2),
  };
}
export function normalizeStoryboard3DCharacterState(actionPlaying = {}) {
  const bodyPresetId = BODY_BY_ID['has'](actionPlaying['bodyPresetId'])
      ? actionPlaying['bodyPresetId']
      : 'adult-male',
    actionId = ACTION_BY_ID['has'](actionPlaying['actionId'])
      ? actionPlaying['actionId']
      : STORYBOARD_3D_ACTIONS[0]['id'],
    leftHandPoseId = HAND_BY_ID['has'](actionPlaying['leftHandPoseId'])
      ? actionPlaying['leftHandPoseId']
      : 'relaxed',
    rightHandPoseId = HAND_BY_ID['has'](actionPlaying['rightHandPoseId'])
      ? actionPlaying['rightHandPoseId']
      : 'relaxed';
  return {
    bodyPresetId: bodyPresetId,
    actionId: actionId,
    actionTime: Math['max'](0, Number(actionPlaying['actionTime']) || 0),
    actionPlaying: actionPlaying['actionPlaying'] === true,
    leftHandPoseId: leftHandPoseId,
    rightHandPoseId: rightHandPoseId,
    boneOverrides: normalizeStoryboard3DBoneOverrides(actionPlaying['boneOverrides']),
  };
}
export function resolveStoryboard3DCharacterPose(options3 = {}) {
  const state2 = normalizeStoryboard3DCharacterState(options3),
    value7 = BODY_BY_ID['get'](state2['bodyPresetId']),
    value8 = ACTION_BY_ID['get'](state2['actionId']),
    sampleCharacterActionPose2 = sampleCharacterActionPose(value8, state2['actionTime']),
    args = HAND_BY_ID['get'](state2['leftHandPoseId']),
    args2 = HAND_BY_ID['get'](state2['rightHandPoseId']),
    value9 = {
      state: state2,
      body: {
        ...structuredClone(value7),
        ...(Number['isFinite'](options3['heightCm'])
          ? { height: Math['max'](55, Math['min'](230, options3['heightCm'])) / 100 }
          : {}),
      },
      action: structuredClone(value8),
      baseBones: mergeBonePoses(value7?.['posture'], sampleCharacterActionPose2?.['bones']),
      handRotations: { hand_l: { ...args['rotation'] }, hand_r: { ...args2['rotation'] } },
      handPoses: { left: structuredClone(args), right: structuredClone(args2) },
      boneOverrides: structuredClone(state2['boneOverrides']),
    };
  return ((value9['resolvedBoneQuaternions'] = composeStoryboard3DCharacterBoneQuaternions(value9)), value9);
}
export function composeStoryboard3DCharacterBoneQuaternions(options4 = {}) {
  const value10 =
      options4?.['baseBones'] && options4?.['handRotations'] && options4?.['boneOverrides']
        ? options4
        : { ...resolveStoryboard3DCharacterPoseParts(options4) },
    value11 = {
      ...normalizeBonePose(value10['baseBones']),
      ...normalizeBonePose(value10['handRotations']),
    },
    args3 = {};
  for (const [value12, value13] of Object['entries'](value11)) {
    args3[value12] = eulerToStoryboard3DQuaternion(value13);
  }
  return { ...args3, ...normalizeStoryboard3DBoneOverrides(value10['boneOverrides']) };
}
export function applyStoryboard3DCharacterPoseToModel(
  value14,
  value15 = {},
  { baseBoneQuaternions: baseBoneQuaternions = {} } = {},
) {
  const composeStoryboard3DCharacterBoneQuaternions2 = composeStoryboard3DCharacterBoneQuaternions(value15);
  for (const value16 of PANORAMA_CHARACTER_BONES) {
    const enabled = value14?.['getObjectByName']?.(value16);
    if (!enabled?.['quaternion']) continue;
    const box5 = baseBoneQuaternions[value16];
    box5 &&
      typeof enabled['quaternion']['set'] === 'function' &&
      enabled['quaternion']['set'](box5['x'], box5['y'], box5['z'], box5['w']);
    const x3 = composeStoryboard3DCharacterBoneQuaternions2[value16];
    if (!x3) continue;
    if (typeof enabled['quaternion']['multiply'] === 'function')
      enabled['quaternion']['multiply']({
        x: x3[0],
        y: x3[1],
        z: x3[2],
        w: x3[3],
      });
    else
      typeof enabled['quaternion']['set'] === 'function' &&
        enabled['quaternion']['set'](x3[0], x3[1], x3[2], x3[3]);
  }
  return (value14?.['updateMatrixWorld']?.(true), value14);
}
export function setStoryboard3DCharacterActionPlayback(value17, actionPlaying2) {
  const args4 = normalizeStoryboard3DCharacterState(value17);
  return { ...args4, actionPlaying: actionPlaying2 === true };
}
export function seekStoryboard3DCharacterAction(value18, value19) {
  const args5 = normalizeStoryboard3DCharacterState(value18),
    actionTime = ACTION_BY_ID['get'](args5['actionId']),
    value20 = Math['max'](0.001, Number(actionTime['duration']) || 1),
    value21 = Math['max'](0, Number(value19) || 0);
  return {
    ...args5,
    actionTime: actionTime['loop'] ? value21 % value20 : Math['min'](value21, value20),
  };
}
export function advanceStoryboard3DCharacterAction(value22, value23) {
  const args6 = normalizeStoryboard3DCharacterState(value22);
  if (!args6['actionPlaying']) return args6;
  const value24 = ACTION_BY_ID['get'](args6['actionId']),
    actionTime2 = Math['max'](0.001, Number(value24['duration']) || 1),
    actionTime3 = args6['actionTime'] + Math['max'](0, Number(value23) || 0);
  if (value24['loop']) return { ...args6, actionTime: actionTime3 % actionTime2 };
  if (actionTime3 >= actionTime2) return { ...args6, actionTime: actionTime2, actionPlaying: false };
  return { ...args6, actionTime: actionTime3 };
}
export function quaternionToStoryboard3DEuler(list4 = []) {
  const list5 = Array['isArray'](list4) ? list4['map'](Number) : [],
    count2 = list5['length'] === 4 && list5['every'](Number['isFinite']) ? Math['hypot'](...list5) : 0,
    value25 = count2 > 1e-8 ? list5['map']((value26) => value26 / count2) : [0, 0, 0, 1],
    [value27, value28, value29, value30] = value25,
    value31 = 1 - 2 * (value28 * value28 + value29 * value29),
    value32 = 2 * (value27 * value28 - value29 * value30),
    value33 = 2 * (value27 * value29 + value28 * value30),
    value34 = 1 - 2 * (value27 * value27 + value29 * value29),
    value35 = 2 * (value28 * value29 - value27 * value30),
    value36 = 2 * (value28 * value29 + value27 * value30),
    value37 = 1 - 2 * (value27 * value27 + value28 * value28),
    box6 = { x: 0, y: Math['asin'](clamp(value33, -1, 1)), z: 0 };
  return (
    Math['abs'](value33) < 0.9999999
      ? ((box6['x'] = Math['atan2'](-value35, value37)), (box6['z'] = Math['atan2'](-value32, value31)))
      : (box6['x'] = Math['atan2'](value36, value34)),
    box6
  );
}
export function createStoryboard3DBoneEditState(
  options5 = {},
  { selectedBoneName: selectedBoneName = 'pelvis', showControls: showControls = true } = {},
) {
  const boneOverrides = normalizeStoryboard3DCharacterState(options5),
    localEulerByBone = {};
  for (const [value38, value39] of Object['entries'](boneOverrides['boneOverrides'])) {
    localEulerByBone[value38] = quaternionToStoryboard3DEuler(value39);
  }
  return {
    selectedBoneName: BONE_SET['has'](selectedBoneName) ? selectedBoneName : 'pelvis',
    showControls: showControls !== false,
    localEulerByBone: localEulerByBone,
    boneOverrides: boneOverrides['boneOverrides'],
  };
}
export function updateStoryboard3DBoneEditState(args7, selectedBoneName2, value40) {
  const clampStoryboard3DBoneEuler3 = clampStoryboard3DBoneEuler(selectedBoneName2, value40);
  if (!clampStoryboard3DBoneEuler3) throw new Error('Unknown character bone: ' + selectedBoneName2);
  return {
    ...args7,
    selectedBoneName: selectedBoneName2,
    localEulerByBone: { ...args7?.['localEulerByBone'], [selectedBoneName2]: clampStoryboard3DBoneEuler3 },
    boneOverrides: setStoryboard3DBoneOverride(
      args7?.['boneOverrides'],
      selectedBoneName2,
      clampStoryboard3DBoneEuler3,
    ),
  };
}
export function commitStoryboard3DBoneEditState(args8, boneOverrides2) {
  return normalizeStoryboard3DCharacterState({ ...args8, boneOverrides: boneOverrides2?.['boneOverrides'] });
}
function resolveStoryboard3DCharacterPoseParts(options6 = {}) {
  const boneOverrides3 = normalizeStoryboard3DCharacterState(options6),
    value41 = BODY_BY_ID['get'](boneOverrides3['bodyPresetId']),
    value42 = ACTION_BY_ID['get'](boneOverrides3['actionId']),
    sampleCharacterActionPose3 = sampleCharacterActionPose(value42, boneOverrides3['actionTime']);
  return {
    baseBones: mergeBonePoses(value41?.['posture'], sampleCharacterActionPose3?.['bones']),
    handRotations: {
      hand_l: { ...HAND_BY_ID['get'](boneOverrides3['leftHandPoseId'])['rotation'] },
      hand_r: { ...HAND_BY_ID['get'](boneOverrides3['rightHandPoseId'])['rotation'] },
    },
    boneOverrides: boneOverrides3['boneOverrides'],
  };
}
