export const PANORAMA_CHARACTER_BONES = Object.freeze([
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
  PI = Math.PI;
function clampRadians(value) {
  const item = Number(value);
  if (!Number.isFinite(item)) return 0;
  return Math.max(-PI, Math.min(PI, item));
}
function rotation(x = 0, y = 0, z = 0) {
  return { x: x, y: y, z: z };
}
export function normalizeBonePose(options = {}) {
  const key = {};
  for (const index of PANORAMA_CHARACTER_BONES) {
    const box = options?.[index];
    if (!box || typeof box !== 'object') continue;
    const box2 = {
      x: clampRadians(box.x),
      y: clampRadians(box.y),
      z: clampRadians(box.z),
    };
    if (Math.abs(box2.x) + Math.abs(box2.y) + Math.abs(box2.z) < 1e-8) continue;
    key[index] = box2;
  }
  return key;
}
function swapSideName(list) {
  if (list.endsWith('_l')) return list.slice(0, -2) + '_r';
  if (list.endsWith('_r')) return list.slice(0, -2) + '_l';
  return list;
}
function mirrorBonePose(options2 = {}) {
  const result = {};
  for (const [data, x2] of Object.entries(normalizeBonePose(options2))) {
    result[swapSideName(data)] = { x: x2.x, y: -x2.y, z: -x2.z };
  }
  return result;
}
function preset(id2, name2, category2, target, args = []) {
  return Object.freeze({
    id: id2,
    name: name2,
    category: category2,
    tags: Object.freeze([...args]),
    bones: Object.freeze(normalizeBonePose(target)),
  });
}
const WAVE_LEFT = {
    spine_03: rotation(0, 0.08, -0.08),
    upperarm_l: rotation(-0.35, -0.15, -1.85),
    lowerarm_l: rotation(-0.25, -0.2, -1.1),
    hand_l: rotation(0.1, -0.1, -0.25),
    upperarm_r: rotation(0.05, 0, 0.18),
  },
  POINT_LEFT = {
    spine_03: rotation(0, 0.16, -0.06),
    upperarm_l: rotation(-0.15, -0.35, -1.5),
    lowerarm_l: rotation(0, 0, -0.08),
    hand_l: rotation(0, 0.1, 0),
  },
  WALK_LEFT = {
    pelvis: rotation(0, 0.08, -0.03),
    spine_02: rotation(0.05, -0.08, 0.02),
    upperarm_l: rotation(0.45, 0, -0.08),
    upperarm_r: rotation(-0.45, 0, 0.08),
    thigh_l: rotation(-0.5, 0, 0),
    calf_l: rotation(0.48, 0, 0),
    thigh_r: rotation(0.42, 0, 0),
    calf_r: rotation(0.18, 0, 0),
  },
  RUN_LEFT = {
    pelvis: rotation(0.08, 0.1, -0.04),
    spine_01: rotation(0.22, 0, 0),
    upperarm_l: rotation(0.85, 0, -0.12),
    lowerarm_l: rotation(-1.05, 0, 0),
    upperarm_r: rotation(-0.82, 0, 0.12),
    lowerarm_r: rotation(-1.08, 0, 0),
    thigh_l: rotation(-0.95, 0, 0),
    calf_l: rotation(1.15, 0, 0),
    thigh_r: rotation(0.75, 0, 0),
    calf_r: rotation(0.35, 0, 0),
  },
  KICK_LEFT = {
    pelvis: rotation(0, 0.08, -0.08),
    spine_02: rotation(-0.12, -0.08, 0.06),
    thigh_l: rotation(-1.25, -0.08, -0.08),
    calf_l: rotation(0.18, 0, 0),
    foot_l: rotation(0.25, 0, 0),
    thigh_r: rotation(0.18, 0, 0.08),
    calf_r: rotation(0.25, 0, 0),
    upperarm_l: rotation(0.2, 0, -0.65),
    upperarm_r: rotation(-0.25, 0, 0.7),
  },
  DISCO_LEFT = {
    pelvis: rotation(0, 0.18, -0.12),
    spine_02: rotation(0, -0.15, 0.18),
    upperarm_l: rotation(-0.2, -0.1, -2.2),
    lowerarm_l: rotation(-0.15, 0, -0.18),
    upperarm_r: rotation(0.25, 0.2, 0.62),
    lowerarm_r: rotation(-0.7, 0, 0.2),
    thigh_l: rotation(-0.15, 0, -0.12),
    thigh_r: rotation(0.22, 0, 0.15),
  },
  SALSA_LEFT = {
    pelvis: rotation(0, 0.28, -0.12),
    spine_02: rotation(0, -0.2, 0.13),
    upperarm_l: rotation(-0.3, -0.25, -1.15),
    lowerarm_l: rotation(-0.55, 0, -0.45),
    upperarm_r: rotation(0.15, 0.1, 0.85),
    lowerarm_r: rotation(-0.45, 0, 0.38),
    thigh_l: rotation(-0.4, 0.15, -0.08),
    calf_l: rotation(0.62, 0, 0),
    thigh_r: rotation(0.18, -0.08, 0.1),
  },
  PRESETS = Object.freeze([
    preset('neutral', 'Neutral', 'basic', {}, ['stand', 'default']),
    preset(
      'idle-relaxed',
      'Idle Relaxed',
      'basic',
      {
        pelvis: rotation(0, 0.05, 0.04),
        spine_02: rotation(0, -0.04, -0.03),
        upperarm_l: rotation(0.08, 0, -0.12),
        upperarm_r: rotation(-0.06, 0, 0.1),
        thigh_l: rotation(-0.04, 0, -0.05),
        thigh_r: rotation(0.08, 0, 0.04),
      },
      ['stand'],
    ),
    preset('wave-left', 'Wave Left', 'gesture', WAVE_LEFT, ['hello', 'hand']),
    preset('wave-right', 'Wave Right', 'gesture', mirrorBonePose(WAVE_LEFT), ['hello', 'hand']),
    preset('point-left', 'Point Left', 'gesture', POINT_LEFT, ['direct', 'hand']),
    preset('point-right', 'Point Right', 'gesture', mirrorBonePose(POINT_LEFT), ['direct', 'hand']),
    preset(
      'hands-up',
      'Hands Up',
      'gesture',
      {
        upperarm_l: rotation(-0.2, 0, -2.35),
        upperarm_r: rotation(-0.2, 0, 2.35),
        lowerarm_l: rotation(-0.25, 0, -0.25),
        lowerarm_r: rotation(-0.25, 0, 0.25),
      },
      ['raise', 'arms'],
    ),
    preset(
      'celebrate',
      'Celebrate',
      'gesture',
      {
        spine_03: rotation(-0.08, 0, 0),
        Head: rotation(-0.15, 0, 0),
        upperarm_l: rotation(-0.5, -0.2, -2.1),
        upperarm_r: rotation(-0.45, 0.2, 2.05),
        lowerarm_l: rotation(-0.6, 0, -0.25),
        lowerarm_r: rotation(-0.55, 0, 0.25),
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
        lowerarm_l: rotation(-0.78, 0, -0.68),
        lowerarm_r: rotation(-0.78, 0, 0.68),
      },
      ['applause', 'hands'],
    ),
    preset(
      'bow',
      'Bow',
      'action',
      {
        pelvis: rotation(0.18, 0, 0),
        spine_01: rotation(0.48, 0, 0),
        spine_02: rotation(0.28, 0, 0),
        Head: rotation(-0.18, 0, 0),
        upperarm_l: rotation(-0.2, 0, -0.08),
        upperarm_r: rotation(-0.2, 0, 0.08),
      },
      ['greet'],
    ),
    preset(
      'sit',
      'Sit',
      'action',
      {
        pelvis: rotation(-0.12, 0, 0),
        spine_01: rotation(0.12, 0, 0),
        thigh_l: rotation(-1.35, 0, 0),
        thigh_r: rotation(-1.35, 0, 0),
        calf_l: rotation(1.42, 0, 0),
        calf_r: rotation(1.42, 0, 0),
      },
      ['chair'],
    ),
    preset(
      'squat',
      'Squat',
      'action',
      {
        pelvis: rotation(0.2, 0, 0),
        spine_01: rotation(0.25, 0, 0),
        thigh_l: rotation(-0.95, 0, -0.08),
        thigh_r: rotation(-0.95, 0, 0.08),
        calf_l: rotation(1.35, 0, 0),
        calf_r: rotation(1.35, 0, 0),
      },
      ['crouch'],
    ),
    preset('walk-left', 'Walk Lead Left', 'locomotion', WALK_LEFT, ['walk', 'step']),
    preset('walk-right', 'Walk Lead Right', 'locomotion', mirrorBonePose(WALK_LEFT), ['walk', 'step']),
    preset('run-left', 'Run Lead Left', 'locomotion', RUN_LEFT, ['run', 'sport']),
    preset('run-right', 'Run Lead Right', 'locomotion', mirrorBonePose(RUN_LEFT), ['run', 'sport']),
    preset('kick-left', 'Kick Left', 'action', KICK_LEFT, ['sport', 'fight']),
    preset('kick-right', 'Kick Right', 'action', mirrorBonePose(KICK_LEFT), ['sport', 'fight']),
    preset(
      'dance-groove',
      'Dance Groove',
      'dance',
      {
        pelvis: rotation(0, -0.2, 0.15),
        spine_02: rotation(0, 0.18, -0.12),
        upperarm_l: rotation(-0.35, 0.1, -1.05),
        lowerarm_l: rotation(-0.8, 0, -0.5),
        upperarm_r: rotation(0.25, -0.1, 1.25),
        lowerarm_r: rotation(-0.55, 0, 0.42),
        thigh_l: rotation(-0.25, 0, -0.1),
        calf_l: rotation(0.45, 0, 0),
      },
      ['club', 'music'],
    ),
    preset('dance-disco-left', 'Disco Left', 'dance', DISCO_LEFT, ['disco', 'music']),
    preset('dance-disco-right', 'Disco Right', 'dance', mirrorBonePose(DISCO_LEFT), ['disco', 'music']),
    preset('dance-salsa-left', 'Salsa Left', 'dance', SALSA_LEFT, ['salsa', 'music']),
    preset('dance-salsa-right', 'Salsa Right', 'dance', mirrorBonePose(SALSA_LEFT), ['salsa', 'music']),
    preset(
      'dance-ballet',
      'Ballet',
      'dance',
      {
        pelvis: rotation(0, 0, 0.05),
        spine_03: rotation(-0.08, 0, -0.05),
        upperarm_l: rotation(-0.25, -0.2, -1.35),
        upperarm_r: rotation(-0.25, 0.2, 1.35),
        lowerarm_l: rotation(-0.35, 0, -0.25),
        lowerarm_r: rotation(-0.35, 0, 0.25),
        thigh_l: rotation(0.18, -0.18, -0.45),
        calf_l: rotation(0.62, 0, 0),
        thigh_r: rotation(-0.1, 0.12, 0.08),
      },
      ['ballet', 'elegant'],
    ),
    preset(
      'dance-jump',
      'Dance Jump',
      'dance',
      {
        pelvis: rotation(0.08, 0, 0),
        spine_02: rotation(-0.12, 0, 0),
        upperarm_l: rotation(-0.2, 0, -2.15),
        upperarm_r: rotation(-0.2, 0, 2.15),
        thigh_l: rotation(-0.55, 0, -0.15),
        calf_l: rotation(1.05, 0, 0),
        thigh_r: rotation(-0.65, 0, 0.15),
        calf_r: rotation(1.15, 0, 0),
      },
      ['jump', 'music'],
    ),
    preset(
      'lean-left',
      'Lean Left',
      'basic',
      {
        pelvis: rotation(0, 0, -0.18),
        spine_02: rotation(0, 0, 0.28),
        Head: rotation(0, 0, -0.12),
      },
      ['tilt'],
    ),
    preset(
      'lean-right',
      'Lean Right',
      'basic',
      mirrorBonePose({
        pelvis: rotation(0, 0, -0.18),
        spine_02: rotation(0, 0, 0.28),
        Head: rotation(0, 0, -0.12),
      }),
      ['tilt'],
    ),
  ]),
  PRESET_BY_ID = new Map(PRESETS.map((source) => [source.id, source]));
export const DEFAULT_MANNEQUIN_POSE_ID = 'neutral';
export function listMannequinPosePresets({ category: category = 'all', query: query = '' } = {}) {
  const next = String(category || 'all')
      .trim()
      .toLowerCase(),
    enabled = String(query || '')
      .trim()
      .toLowerCase();
  return PRESETS.filter((error) => {
    if (next !== 'all' && error.category !== next) return false;
    if (!enabled) return true;
    return [error.id, error.name, error.category, ...error.tags]
      .join(' ')
      .toLowerCase()
      .includes(enabled);
  });
}
export function findMannequinPosePreset(current) {
  return PRESET_BY_ID.get(String(current || '').trim()) || null;
}
export function resolveMannequinPose(entry, record = null) {
  const payload = String(entry || DEFAULT_MANNEQUIN_POSE_ID).trim();
  if (payload === 'custom' && record) return normalizeCustomMannequinPose(record);
  return PRESET_BY_ID.get(payload) || PRESET_BY_ID.get(DEFAULT_MANNEQUIN_POSE_ID);
}
export function normalizeCustomMannequinPose(error2 = {}) {
  return {
    id: String(error2.id || 'custom').trim() || 'custom',
    name:
      String(error2.name || 'Custom pose')
        .trim()
        .slice(0, 80) || 'Custom pose',
    category: 'custom',
    tags: Array.isArray(error2.tags)
      ? error2.tags
          .map((handle) => String(handle || '').trim())
          .filter(Boolean)
          .slice(0, 12)
      : [],
    bones: normalizeBonePose(error2.bones),
  };
}
export function createCustomMannequinPose({
  id: id = 'custom',
  name: name = 'Custom pose',
  bones: bones = {},
} = {}) {
  return normalizeCustomMannequinPose({ id: id, name: name, bones: bones });
}
export function validateCustomMannequinPose(enabled2) {
  const ok = [];
  if (!enabled2 || typeof enabled2 !== 'object') ok.push('Pose must be an object.');
  if (!enabled2?.bones || typeof enabled2.bones !== 'object') ok.push('Pose bones are required.');
  const list2 = Object.keys(enabled2?.bones || {}).filter((state) => !BONE_SET.has(state));
  if (list2.length > 0) ok.push('Unknown bones: ' + list2.join(', '));
  return {
    ok: ok.length === 0,
    errors: ok,
    pose: normalizeCustomMannequinPose(enabled2),
  };
}
