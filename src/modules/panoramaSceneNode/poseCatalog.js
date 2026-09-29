export const PANORAMA_CHARACTER_BONES = Object['freeze']([
  'root',
  'pelvis',
  'spine_01',
  'spine_02',
  'spine_03',
  'neck_01',
  'Head',
  'clavicle_l',
  'clavicle_r',
  'upperarm_l',
  'upperarm_r',
  'lowerarm_l',
  'lowerarm_r',
  'hand_l',
  'hand_r',
  'thigh_l',
  'thigh_r',
  'calf_l',
  'calf_r',
  'foot_l',
  'foot_r',
]);
const BONE_SET = new Set(PANORAMA_CHARACTER_BONES),
  PI = Math['PI'];
function clampRadians(_0x2a28a2) {
  const _0x39f10f = Number(_0x2a28a2);
  if (!Number['isFinite'](_0x39f10f)) return 0x0;
  return Math['max'](-PI, Math['min'](PI, _0x39f10f));
}
function rotation(_0x309827 = 0x0, _0x22fd7d = 0x0, _0x165513 = 0x0) {
  return { x: _0x309827, y: _0x22fd7d, z: _0x165513 };
}
export function normalizeBonePose(_0x3e1e4e = {}) {
  const _0x1129e2 = {};
  for (const _0x260921 of PANORAMA_CHARACTER_BONES) {
    const _0x2844d4 = _0x3e1e4e?.[_0x260921];
    if (!_0x2844d4 || typeof _0x2844d4 !== 'object') continue;
    const _0x1a8dd4 = {
      x: clampRadians(_0x2844d4['x']),
      y: clampRadians(_0x2844d4['y']),
      z: clampRadians(_0x2844d4['z']),
    };
    if (Math['abs'](_0x1a8dd4['x']) + Math['abs'](_0x1a8dd4['y']) + Math['abs'](_0x1a8dd4['z']) < 1e-8)
      continue;
    _0x1129e2[_0x260921] = _0x1a8dd4;
  }
  return _0x1129e2;
}
function swapSideName(_0x53fd25) {
  if (_0x53fd25['endsWith']('_l')) return _0x53fd25['slice'](0x0, -0x2) + '_r';
  if (_0x53fd25['endsWith']('_r')) return _0x53fd25['slice'](0x0, -0x2) + '_l';
  return _0x53fd25;
}
function mirrorBonePose(_0x18cf5e = {}) {
  const _0x861c66 = {};
  for (const [_0x139196, _0x324f0f] of Object['entries'](normalizeBonePose(_0x18cf5e))) {
    _0x861c66[swapSideName(_0x139196)] = { x: _0x324f0f['x'], y: -_0x324f0f['y'], z: -_0x324f0f['z'] };
  }
  return _0x861c66;
}
function preset(_0x348b19, _0x5a6654, _0x3b5d81, _0x395b66, _0x42637c = []) {
  return Object['freeze']({
    id: _0x348b19,
    name: _0x5a6654,
    category: _0x3b5d81,
    tags: Object['freeze']([..._0x42637c]),
    bones: Object['freeze'](normalizeBonePose(_0x395b66)),
  });
}
const WAVE_LEFT = {
    spine_03: rotation(0x0, 0.08, -0.08),
    upperarm_l: rotation(-0.35, -0.15, -1.85),
    lowerarm_l: rotation(-0.25, -0.2, -1.1),
    hand_l: rotation(0.1, -0.1, -0.25),
    upperarm_r: rotation(0.05, 0x0, 0.18),
  },
  POINT_LEFT = {
    spine_03: rotation(0x0, 0.16, -0.06),
    upperarm_l: rotation(-0.15, -0.35, -1.5),
    lowerarm_l: rotation(0x0, 0x0, -0.08),
    hand_l: rotation(0x0, 0.1, 0x0),
  },
  WALK_LEFT = {
    pelvis: rotation(0x0, 0.08, -0.03),
    spine_02: rotation(0.05, -0.08, 0.02),
    upperarm_l: rotation(0.45, 0x0, -0.08),
    upperarm_r: rotation(-0.45, 0x0, 0.08),
    thigh_l: rotation(-0.5, 0x0, 0x0),
    calf_l: rotation(0.48, 0x0, 0x0),
    thigh_r: rotation(0.42, 0x0, 0x0),
    calf_r: rotation(0.18, 0x0, 0x0),
  },
  RUN_LEFT = {
    pelvis: rotation(0.08, 0.1, -0.04),
    spine_01: rotation(0.22, 0x0, 0x0),
    upperarm_l: rotation(0.85, 0x0, -0.12),
    lowerarm_l: rotation(-1.05, 0x0, 0x0),
    upperarm_r: rotation(-0.82, 0x0, 0.12),
    lowerarm_r: rotation(-1.08, 0x0, 0x0),
    thigh_l: rotation(-0.95, 0x0, 0x0),
    calf_l: rotation(1.15, 0x0, 0x0),
    thigh_r: rotation(0.75, 0x0, 0x0),
    calf_r: rotation(0.35, 0x0, 0x0),
  },
  KICK_LEFT = {
    pelvis: rotation(0x0, 0.08, -0.08),
    spine_02: rotation(-0.12, -0.08, 0.06),
    thigh_l: rotation(-1.25, -0.08, -0.08),
    calf_l: rotation(0.18, 0x0, 0x0),
    foot_l: rotation(0.25, 0x0, 0x0),
    thigh_r: rotation(0.18, 0x0, 0.08),
    calf_r: rotation(0.25, 0x0, 0x0),
    upperarm_l: rotation(0.2, 0x0, -0.65),
    upperarm_r: rotation(-0.25, 0x0, 0.7),
  },
  DISCO_LEFT = {
    pelvis: rotation(0x0, 0.18, -0.12),
    spine_02: rotation(0x0, -0.15, 0.18),
    upperarm_l: rotation(-0.2, -0.1, -2.2),
    lowerarm_l: rotation(-0.15, 0x0, -0.18),
    upperarm_r: rotation(0.25, 0.2, 0.62),
    lowerarm_r: rotation(-0.7, 0x0, 0.2),
    thigh_l: rotation(-0.15, 0x0, -0.12),
    thigh_r: rotation(0.22, 0x0, 0.15),
  },
  SALSA_LEFT = {
    pelvis: rotation(0x0, 0.28, -0.12),
    spine_02: rotation(0x0, -0.2, 0.13),
    upperarm_l: rotation(-0.3, -0.25, -1.15),
    lowerarm_l: rotation(-0.55, 0x0, -0.45),
    upperarm_r: rotation(0.15, 0.1, 0.85),
    lowerarm_r: rotation(-0.45, 0x0, 0.38),
    thigh_l: rotation(-0.4, 0.15, -0.08),
    calf_l: rotation(0.62, 0x0, 0x0),
    thigh_r: rotation(0.18, -0.08, 0.1),
  },
  PRESETS = Object['freeze']([
    preset('neutral', 'Neutral', 'basic', {}, ['stand', 'default']),
    preset(
      'idle-relaxed',
      'Idle Relaxed',
      'basic',
      {
        pelvis: rotation(0x0, 0.05, 0.04),
        spine_02: rotation(0x0, -0.04, -0.03),
        upperarm_l: rotation(0.08, 0x0, -0.12),
        upperarm_r: rotation(-0.06, 0x0, 0.1),
        thigh_l: rotation(-0.04, 0x0, -0.05),
        thigh_r: rotation(0.08, 0x0, 0.04),
      },
      ['stand'],
    ),
    preset('wave-left', 'Wave\x20Left', 'gesture', WAVE_LEFT, ['hello', 'hand']),
    preset('wave-right', 'Wave\x20Right', 'gesture', mirrorBonePose(WAVE_LEFT), ['hello', 'hand']),
    preset('point-left', 'Point Left', 'gesture', POINT_LEFT, ['direct', 'hand']),
    preset('point-right', 'Point Right', 'gesture', mirrorBonePose(POINT_LEFT), ['direct', 'hand']),
    preset(
      'hands-up',
      'Hands Up',
      'gesture',
      {
        upperarm_l: rotation(-0.2, 0x0, -2.35),
        upperarm_r: rotation(-0.2, 0x0, 2.35),
        lowerarm_l: rotation(-0.25, 0x0, -0.25),
        lowerarm_r: rotation(-0.25, 0x0, 0.25),
      },
      ['raise', 'arms'],
    ),
    preset(
      'celebrate',
      'Celebrate',
      'gesture',
      {
        spine_03: rotation(-0.08, 0x0, 0x0),
        Head: rotation(-0.15, 0x0, 0x0),
        upperarm_l: rotation(-0.5, -0.2, -2.1),
        upperarm_r: rotation(-0.45, 0.2, 2.05),
        lowerarm_l: rotation(-0.6, 0x0, -0.25),
        lowerarm_r: rotation(-0.55, 0x0, 0.25),
      },
      ['victory', 'happy'],
    ),
    preset(
      'clap',
      'Clap',
      'gesture',
      {
        upperarm_l: rotation(-0.65, -0.35, -0.82),
        upperarm_r: rotation(-0.65, 0.35, 0.82),
        lowerarm_l: rotation(-0.78, 0x0, -0.68),
        lowerarm_r: rotation(-0.78, 0x0, 0.68),
      },
      ['applause', 'hands'],
    ),
    preset(
      'bow',
      'Bow',
      'action',
      {
        pelvis: rotation(0.18, 0x0, 0x0),
        spine_01: rotation(0.48, 0x0, 0x0),
        spine_02: rotation(0.28, 0x0, 0x0),
        Head: rotation(-0.18, 0x0, 0x0),
        upperarm_l: rotation(-0.2, 0x0, -0.08),
        upperarm_r: rotation(-0.2, 0x0, 0.08),
      },
      ['greet'],
    ),
    preset(
      'sit',
      'Sit',
      'action',
      {
        pelvis: rotation(-0.12, 0x0, 0x0),
        spine_01: rotation(0.12, 0x0, 0x0),
        thigh_l: rotation(-1.35, 0x0, 0x0),
        thigh_r: rotation(-1.35, 0x0, 0x0),
        calf_l: rotation(1.42, 0x0, 0x0),
        calf_r: rotation(1.42, 0x0, 0x0),
      },
      ['chair'],
    ),
    preset(
      'squat',
      'Squat',
      'action',
      {
        pelvis: rotation(0.2, 0x0, 0x0),
        spine_01: rotation(0.25, 0x0, 0x0),
        thigh_l: rotation(-0.95, 0x0, -0.08),
        thigh_r: rotation(-0.95, 0x0, 0.08),
        calf_l: rotation(1.35, 0x0, 0x0),
        calf_r: rotation(1.35, 0x0, 0x0),
      },
      ['crouch'],
    ),
    preset('walk-left', 'Walk\x20Lead\x20Left', 'locomotion', WALK_LEFT, ['walk', 'step']),
    preset('walk-right', 'Walk\x20Lead\x20Right', 'locomotion', mirrorBonePose(WALK_LEFT), ['walk', 'step']),
    preset('run-left', 'Run Lead Left', 'locomotion', RUN_LEFT, ['run', 'sport']),
    preset('run-right', 'Run Lead Right', 'locomotion', mirrorBonePose(RUN_LEFT), ['run', 'sport']),
    preset('kick-left', 'Kick Left', 'action', KICK_LEFT, ['sport', 'fight']),
    preset('kick-right', 'Kick Right', 'action', mirrorBonePose(KICK_LEFT), ['sport', 'fight']),
    preset(
      'dance-groove',
      'Dance\x20Groove',
      'dance',
      {
        pelvis: rotation(0x0, -0.2, 0.15),
        spine_02: rotation(0x0, 0.18, -0.12),
        upperarm_l: rotation(-0.35, 0.1, -1.05),
        lowerarm_l: rotation(-0.8, 0x0, -0.5),
        upperarm_r: rotation(0.25, -0.1, 1.25),
        lowerarm_r: rotation(-0.55, 0x0, 0.42),
        thigh_l: rotation(-0.25, 0x0, -0.1),
        calf_l: rotation(0.45, 0x0, 0x0),
      },
      ['club', 'music'],
    ),
    preset('dance-disco-left', 'Disco\x20Left', 'dance', DISCO_LEFT, ['disco', 'music']),
    preset('dance-disco-right', 'Disco Right', 'dance', mirrorBonePose(DISCO_LEFT), ['disco', 'music']),
    preset('dance-salsa-left', 'Salsa Left', 'dance', SALSA_LEFT, ['salsa', 'music']),
    preset('dance-salsa-right', 'Salsa\x20Right', 'dance', mirrorBonePose(SALSA_LEFT), ['salsa', 'music']),
    preset(
      'dance-ballet',
      'Ballet',
      'dance',
      {
        pelvis: rotation(0x0, 0x0, 0.05),
        spine_03: rotation(-0.08, 0x0, -0.05),
        upperarm_l: rotation(-0.25, -0.2, -1.35),
        upperarm_r: rotation(-0.25, 0.2, 1.35),
        lowerarm_l: rotation(-0.35, 0x0, -0.25),
        lowerarm_r: rotation(-0.35, 0x0, 0.25),
        thigh_l: rotation(0.18, -0.18, -0.45),
        calf_l: rotation(0.62, 0x0, 0x0),
        thigh_r: rotation(-0.1, 0.12, 0.08),
      },
      ['ballet', 'elegant'],
    ),
    preset(
      'dance-jump',
      'Dance\x20Jump',
      'dance',
      {
        pelvis: rotation(0.08, 0x0, 0x0),
        spine_02: rotation(-0.12, 0x0, 0x0),
        upperarm_l: rotation(-0.2, 0x0, -2.15),
        upperarm_r: rotation(-0.2, 0x0, 2.15),
        thigh_l: rotation(-0.55, 0x0, -0.15),
        calf_l: rotation(1.05, 0x0, 0x0),
        thigh_r: rotation(-0.65, 0x0, 0.15),
        calf_r: rotation(1.15, 0x0, 0x0),
      },
      ['jump', 'music'],
    ),
    preset(
      'lean-left',
      'Lean\x20Left',
      'basic',
      {
        pelvis: rotation(0x0, 0x0, -0.18),
        spine_02: rotation(0x0, 0x0, 0.28),
        Head: rotation(0x0, 0x0, -0.12),
      },
      ['tilt'],
    ),
    preset(
      'lean-right',
      'Lean Right',
      'basic',
      mirrorBonePose({
        pelvis: rotation(0x0, 0x0, -0.18),
        spine_02: rotation(0x0, 0x0, 0.28),
        Head: rotation(0x0, 0x0, -0.12),
      }),
      ['tilt'],
    ),
  ]),
  PRESET_BY_ID = new Map(PRESETS['map']((_0xcb5e81) => [_0xcb5e81['id'], _0xcb5e81]));
export const DEFAULT_MANNEQUIN_POSE_ID = 'neutral';
export function listMannequinPosePresets({ category: category = 'all', query: query = '' } = {}) {
  const _0x259f32 = String(category || 'all')
      ['trim']()
      ['toLowerCase'](),
    _0xdd6676 = String(query || '')
      ['trim']()
      ['toLowerCase']();
  return PRESETS['filter']((_0x231f23) => {
    if (_0x259f32 !== 'all' && _0x231f23['category'] !== _0x259f32) return ![];
    if (!_0xdd6676) return !![];
    return [_0x231f23['id'], _0x231f23['name'], _0x231f23['category'], ..._0x231f23['tags']]
      ['join']('\x20')
      ['toLowerCase']()
      ['includes'](_0xdd6676);
  });
}
export function findMannequinPosePreset(_0x51ae56) {
  return PRESET_BY_ID['get'](String(_0x51ae56 || '')['trim']()) || null;
}
export function resolveMannequinPose(_0x4b882a, _0x2d7815 = null) {
  const _0x15e2bb = String(_0x4b882a || DEFAULT_MANNEQUIN_POSE_ID)['trim']();
  if (_0x15e2bb === 'custom' && _0x2d7815) return normalizeCustomMannequinPose(_0x2d7815);
  return PRESET_BY_ID['get'](_0x15e2bb) || PRESET_BY_ID['get'](DEFAULT_MANNEQUIN_POSE_ID);
}
export function normalizeCustomMannequinPose(_0x1665ac = {}) {
  return {
    id: String(_0x1665ac['id'] || 'custom')['trim']() || 'custom',
    name:
      String(_0x1665ac['name'] || 'Custom pose')
        ['trim']()
        ['slice'](0x0, 0x50) || 'Custom\x20pose',
    category: 'custom',
    tags: Array['isArray'](_0x1665ac['tags'])
      ? _0x1665ac['tags']
          ['map']((_0xad3f60) => String(_0xad3f60 || '')['trim']())
          ['filter'](Boolean)
          ['slice'](0x0, 0xc)
      : [],
    bones: normalizeBonePose(_0x1665ac['bones']),
  };
}
export function createCustomMannequinPose({
  id: id = 'custom',
  name: name = 'Custom pose',
  bones: bones = {},
} = {}) {
  return normalizeCustomMannequinPose({ id: id, name: name, bones: bones });
}
export function validateCustomMannequinPose(_0x597b01) {
  const _0xe2fe68 = [];
  if (!_0x597b01 || typeof _0x597b01 !== 'object') _0xe2fe68['push']('Pose must be an object.');
  if (!_0x597b01?.['bones'] || typeof _0x597b01['bones'] !== 'object')
    _0xe2fe68['push']('Pose bones are required.');
  const _0x1798de = Object['keys'](_0x597b01?.['bones'] || {})['filter'](
    (_0x38f10f) => !BONE_SET['has'](_0x38f10f),
  );
  if (_0x1798de['length'] > 0x0) _0xe2fe68['push']('Unknown\x20bones:\x20' + _0x1798de['join'](',\x20'));
  return {
    ok: _0xe2fe68['length'] === 0x0,
    errors: _0xe2fe68,
    pose: normalizeCustomMannequinPose(_0x597b01),
  };
}
