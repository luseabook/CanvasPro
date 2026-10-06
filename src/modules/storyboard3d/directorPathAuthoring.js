import {
  normalizeStoryboard3DShotAnimation,
  upsertStoryboard3DCameraKeyframe,
  upsertStoryboard3DObjectKeyframe,
} from './shotAnimation.js';
import { smoothDirectorKeys } from './directorCurves.js';
export function authorDirectorPath(
  value,
  {
    points: points,
    camera: camera,
    object: object,
    start: start = 0,
    duration: duration = 3,
    smooth: smooth = false,
  } = {},
) {
  const item = (points || [])
    .filter(
      (list) => Array.isArray(list) && list.length === 3 && list.every(Number.isFinite),
    )
    .slice(0, 100);
  if (item.length < 2) throw new Error('轨迹至少需要两个不同的位置。');
  if (object?.locked) throw new Error('请先解锁对象。');
  const key = item.map((list2, index) =>
      index ? Math.hypot(...list2.map((result, data) => result - item[index - 1][data])) : 0,
    ),
    count = key.reduce((options, target) => options + target, 0);
  if (count < 0.001) throw new Error('轨迹过短，请移动指针绘制路线。');
  let args = normalizeStoryboard3DShotAnimation(value);
  const source = Math.max(0, Math.min(3599.9, Number(start) || 0)),
    next = Math.max(0.1, Math.min(3600 - source, Number(duration) || 3));
  let current = 0;
  if (object) {
    const entry = args.objectTracks.find((record) => record.objectId === object.id);
    if (entry) {
      for (const payload of ['positionKeyframes', 'rotationKeyframes'])
        entry[payload] = entry[payload].filter(
          (handle) => handle.time < source || handle.time > source + next,
        );
    }
  } else
    args.cameraKeyframes = args.cameraKeyframes.filter(
      (state) => state.time < source || state.time > source + next,
    );
  item.forEach((config, scope) => {
    current += key[scope];
    const input = source + (next * current) / count;
    if (!object)
      args = upsertStoryboard3DCameraKeyframe(args, {
        time: input,
        camera: { ...camera, position: config },
        easing: 'linear',
      });
    else {
      args = upsertStoryboard3DObjectKeyframe(args, {
        objectId: object.id,
        property: 'position',
        time: input,
        value: config,
        easing: 'linear',
      });
      const output = scope === item.length - 1 ? item[scope - 1] : config,
        value2 = scope === item.length - 1 ? config : item[scope + 1],
        value3 = [...object.transform.rotation];
      ((value3[1] = Math.atan2(value2[0] - output[0], value2[2] - output[2])),
        (args = upsertStoryboard3DObjectKeyframe(args, {
          objectId: object.id,
          property: 'rotation',
          time: input,
          value: value3,
          easing: 'linear',
        })));
    }
  });
  const list3 = object
      ? args.objectTracks.find((value4) => value4.objectId === object.id).positionKeyframes
      : args.cameraKeyframes,
    value5 = list3.filter((value6) => value6.time >= source && value6.time <= source + next);
  if (smooth) smoothDirectorKeys(value5);
  if (object)
    args.objectPaths = {
      ...(args.objectPaths || {}),
      [object.id]: { pointIds: value5.map((value7) => value7.id) },
    };
  else args.cameraPath = { pointIds: value5.map((value8) => value8.id) };
  return normalizeStoryboard3DShotAnimation(args);
}
