import { authorDirectorPath } from './directorPathAuthoring.js';
import { applyDirectorCameraMotion, DIRECTOR_CAMERA_MOTIONS } from './directorAuthoring.js';
import { STORYBOARD_3D_ACTIONS } from './characterRig.js';
import { normalizeStoryboard3DShotAnimation } from './shotAnimation.js';
export const DIRECTOR_AI_TOOLS = [
  'setCameraPath',
  'setObjectPath',
  'setCameraMotion',
  'setCameraFollow',
  'addActionClip',
];
export function normalizeDirectorAIArgs(
  value,
  item,
  { requiredId: requiredId, vector3: vector3, finiteNumber: finiteNumber },
) {
  if (!DIRECTOR_AI_TOOLS['includes'](value)) return null;
  const key = {
    shotId: requiredId(item['shotId'], 'args.shotId'),
    start: finiteNumber(item['start'] ?? 0x0, 'args.start', { min: 0x0, max: 3599.9 }),
    duration: finiteNumber(item['duration'] ?? 0x3, 'args.duration', { min: 0.1, max: 0xe10 }),
  };
  if (key['start'] + key['duration'] > 0xe10) throw new Error('导演命令结束时间超过\x203600\x20秒。');
  if (value === 'setObjectPath' || value === 'addActionClip')
    key['objectId'] = requiredId(item['objectId'], 'args.objectId');
  if (value === 'setCameraPath' || value === 'setObjectPath') {
    if (
      !Array['isArray'](item['points']) ||
      item['points']['length'] < 0x2 ||
      item['points']['length'] > 0x64
    )
      throw new Error('轨迹需要 2–100 个三维控制点。');
    ((key['points'] = item['points']['map']((index, result) =>
      vector3(index, 'args.points[' + result + ']', [0x0, 0x0, 0x0]),
    )),
      (key['smooth'] = item['smooth'] === !![]));
  }
  if (value === 'setCameraMotion') {
    if (!DIRECTOR_CAMERA_MOTIONS['some'](([data]) => data === item['preset']))
      throw new Error('运镜预设不存在。');
    ((key['preset'] = item['preset']),
      (key['amount'] = finiteNumber(item['amount'] ?? 0x3, 'args.amount', { min: 0.1, max: 0x64 })));
  }
  if (value === 'setCameraFollow') {
    if (!['relative', 'path', 'fixed']['includes'](item['mode']))
      throw new Error('跟拍模式必须为\x20relative、path\x20或\x20fixed。');
    Object['assign'](key, {
      mode: item['mode'],
      followObjectId: item['followObjectId'] ? requiredId(item['followObjectId'], 'args.followObjectId') : '',
      lookAtObjectId: item['lookAtObjectId'] ? requiredId(item['lookAtObjectId'], 'args.lookAtObjectId') : '',
      followOffset: vector3(item['followOffset'], 'args.followOffset', [0x0, 0x2, 0x5]),
      lookAtOffset: vector3(item['lookAtOffset'], 'args.lookAtOffset', [0x0, 1.2, 0x0]),
      followHeading: item['followHeading'] === !![],
    });
  }
  if (value === 'addActionClip') {
    if (!STORYBOARD_3D_ACTIONS['some']((options) => options['id'] === item['actionId']))
      throw new Error('动作不存在。');
    ((key['actionId'] = item['actionId']),
      (key['speed'] = finiteNumber(item['speed'] ?? 0x1, 'args.speed', { min: 0.1, max: 0x4 })));
  }
  return key;
}
export function executeDirectorAICommand(enabled, target, args) {
  if (!DIRECTOR_AI_TOOLS['includes'](target)) return null;
  const enabled2 = enabled['shots']['find']((source) => source['id'] === args['shotId']);
  if (!enabled2) throw new Error('导演命令镜头不存在。');
  const enabled3 = args['objectId'] && enabled['objects']['find']((next) => next['id'] === args['objectId']);
  if (args['objectId'] && (!enabled3 || enabled3['locked'])) throw new Error('导演命令对象不存在或已锁定。');
  let storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(enabled2['animation']);
  if (target === 'setCameraPath' || target === 'setObjectPath')
    storyboard3DShotAnimation = authorDirectorPath(storyboard3DShotAnimation, {
      ...args,
      camera: enabled2['camera'],
      object: enabled3 || undefined,
    });
  if (target === 'setCameraMotion')
    storyboard3DShotAnimation = applyDirectorCameraMotion(storyboard3DShotAnimation, {
      ...args,
      camera: enabled2['camera'],
    });
  if (target === 'setCameraFollow') {
    for (const current of [args['followObjectId'], args['lookAtObjectId']]['filter'](Boolean))
      if (!enabled['objects']['some']((entry) => entry['id'] === current))
        throw new Error('跟拍目标不存在。');
    storyboard3DShotAnimation['cameraConstraintClips']['push']({
      ...args,
      id: 'follow-' + globalThis['crypto']['randomUUID'](),
      end: args['start'] + args['duration'],
    });
  }
  if (target === 'addActionClip') {
    if (enabled3['type'] !== 'character') throw new Error('动作片段只能用于角色。');
    storyboard3DShotAnimation['actionClips']['push']({
      ...args,
      id: 'action-' + globalThis['crypto']['randomUUID'](),
      end: args['start'] + args['duration'],
      offset: 0x0,
    });
  }
  return (
    (enabled2['animation'] = normalizeStoryboard3DShotAnimation(storyboard3DShotAnimation)),
    {
      changed: !![],
      result: {
        shotId: enabled2['id'],
        keyframes: enabled2['animation']['cameraKeyframes']['length'],
        actionClips: enabled2['animation']['actionClips']['length'],
      },
    }
  );
}
