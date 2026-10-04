import { computeGridPlacement } from '../../core/panoramaSceneMath.js';
import {
  normalizeStoryboard3DBoneOverrides,
  setStoryboard3DBoneOverride,
  quaternionToStoryboard3DEuler,
} from './characterRig.js';
export const DIRECTOR_CHARACTER_COLORS = [
  'blue',
  'red',
  'green',
  'yellow',
  'purple',
  'cyan',
  'white',
  'black',
];
export const DIRECTOR_POSE_CHANNELS = [
  ['抬头低头', 'Head', 'x', -0x3c, 0x3c],
  ['转头', 'Head', 'y', -0x50, 0x50],
  ['弯腰', 'spine_02', 'x', -0x2d, 0x5a],
  ['转身', 'spine_02', 'y', -0x3c, 0x3c],
  ['左臂抬举', 'upperarm_l', 'z', -0x78, 0x78],
  ['右臂抬举', 'upperarm_r', 'z', -0x78, 0x78],
  ['左肘弯曲', 'lowerarm_l', 'x', -0x8c, 0xf],
  ['右肘弯曲', 'lowerarm_r', 'x', -0x8c, 0xf],
  ['左腿抬起', 'thigh_l', 'x', -0x64, 0x3c],
  ['右腿抬起', 'thigh_r', 'x', -0x64, 0x3c],
  ['左膝弯曲', 'calf_l', 'x', 0x0, 0x8c],
  ['右膝弯曲', 'calf_r', 'x', 0x0, 0x8c],
];
export function normalizeDirectorPoseLibrary(value) {
  return (Array['isArray'](value) ? value : [])
    ['slice'](0x0, 0xc8)
    ['filter']((item) => typeof item?.['id'] === 'string')
    ['map']((error) => ({
      id: error['id']['slice'](0x0, 0x78),
      name: String(error['name'] || '自定义姿势')['slice'](0x0, 0x78),
      actionId: String(error['actionId'] || 'standing'),
      actionTime: Math['max'](0x0, Number(error['actionTime']) || 0x0),
      leftHandPoseId: String(error['leftHandPoseId'] || 'relaxed'),
      rightHandPoseId: String(error['rightHandPoseId'] || 'relaxed'),
      boneOverrides: normalizeStoryboard3DBoneOverrides(error['boneOverrides']),
    }));
}
export function applyDirectorPoseChannel(args, key, index) {
  const enabled = DIRECTOR_POSE_CHANNELS[key];
  if (!enabled || !Number['isFinite'](index)) return args;
  const [, result, data, options, target] = enabled,
    storyboard3DEuler = quaternionToStoryboard3DEuler(args['boneOverrides']?.[result]);
  return (
    (storyboard3DEuler[data] = (Math['max'](options, Math['min'](target, index)) * Math['PI']) / 0xb4),
    {
      ...args,
      actionPlaying: ![],
      boneOverrides: setStoryboard3DBoneOverride(args['boneOverrides'], result, storyboard3DEuler),
    }
  );
}
export function createDirectorCrowd(
  args2,
  source,
  { rows: rows = 0x2, cols: cols = 0x3, spacing: spacing = 1.8, yaw: yaw = 0x0 } = {},
) {
  if (source['type'] !== 'character' || source['locked'])
    throw new Error('请选择一个已解锁角色作为群众模板。');
  const count = Number(rows) * Number(cols);
  if (!Number['isInteger'](rows) || !Number['isInteger'](cols) || rows < 0x1 || cols < 0x1 || count > 0x64)
    throw new Error('群众阵列为 1–100 人，请调整行列数。');
  const [next, current, entry] = source['transform']['position'],
    gridPlacement = computeGridPlacement({
      rows: rows,
      cols: cols,
      spacingX: spacing,
      spacingZ: spacing,
      origin: { x: next, y: current, z: entry },
      yaw: (yaw * Math['PI']) / 0xb4,
    }),
    args3 = gridPlacement['map']((box, record) => ({
      ...structuredClone(source),
      id: 'crowd-' + globalThis['crypto']['randomUUID'](),
      name: source['name'] + ' 群众 ' + (record + 0x1),
      transform: {
        ...structuredClone(source['transform']),
        position: [box['x'], box['y'], box['z']],
        rotation: [0x0, (yaw * Math['PI']) / 0xb4, 0x0],
      },
    }));
  return { ...args2, objects: [...args2['objects'], ...args3] };
}
