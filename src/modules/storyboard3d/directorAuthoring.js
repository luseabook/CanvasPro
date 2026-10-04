import {
  normalizeStoryboard3DShotAnimation,
  upsertStoryboard3DCameraKeyframe,
  upsertStoryboard3DObjectKeyframe,
} from './shotAnimation.js';
export const DIRECTOR_CAMERA_MOTIONS = Object['freeze']([
  ['orbit', '环绕'],
  ['arc', '半弧'],
  ['push', '推进'],
  ['pull', '拉远'],
  ['crane', '升降'],
  ['slide', '横移'],
  ['spiral', '螺旋上升'],
]);
export function applyDirectorCameraMotion(
  value,
  {
    camera: camera,
    preset: preset,
    duration: duration = 0x3,
    amount: amount = 0x3,
    append: append = ![],
    start: start2,
  } = {},
) {
  if (!DIRECTOR_CAMERA_MOTIONS['some'](([item]) => item === preset)) throw new Error('请选择运镜预设。');
  let storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(value, { camera: camera });
  const key = append
      ? storyboard3DShotAnimation['cameraKeyframes']['at'](-0x1)['time']
      : Math['max'](0x0, Number(start2) || 0x0),
    event = append
      ? storyboard3DShotAnimation['cameraKeyframes']['at'](-0x1)['camera']
      : camera || storyboard3DShotAnimation['cameraKeyframes'][0x0]['camera'],
    count = Math['max'](0.1, Math['min'](0xe10 - key, Number(duration) || 0x3));
  if (key + count > 0xe10) throw new Error('运镜已达到镜头时长上限。');
  const index = Math['max'](0.1, Math['min'](0x64, Number(amount) || 0x3)),
    args = event['position']['map']((result, data) => result - event['target'][data]),
    options = Math['max'](0.01, Math['hypot'](args[0x0], args[0x2])),
    target = ['orbit', 'arc', 'spiral']['includes'](preset) ? 0x30 : 0x1;
  if (!append)
    storyboard3DShotAnimation['cameraKeyframes'] =
      start2 == null
        ? []
        : storyboard3DShotAnimation['cameraKeyframes']['filter'](
            (source) => source['time'] < key || source['time'] > key + count,
          );
  for (let next = 0x0; next <= target; next += 0x1) {
    const current = next / target,
      structuredClone2 = structuredClone(event);
    if (['orbit', 'arc', 'spiral']['includes'](preset)) {
      const entry = current * Math['PI'] * (preset === 'arc' ? 0x1 : 0x2);
      ((structuredClone2['position'][0x0] =
        event['target'][0x0] + args[0x0] * Math['cos'](entry) + args[0x2] * Math['sin'](entry)),
        (structuredClone2['position'][0x2] =
          event['target'][0x2] - args[0x0] * Math['sin'](entry) + args[0x2] * Math['cos'](entry)));
      if (preset === 'spiral') structuredClone2['position'][0x1] += current * index;
    } else {
      if (preset === 'push' || preset === 'pull') {
        const record = Math['max'](0.01, Math['hypot'](...args)),
          payload = preset === 'push' ? -Math['min'](index, record * 0.9) : index;
        structuredClone2['position'] = event['position']['map'](
          (handle, state) => handle + (args[state] / record) * payload * current,
        );
      } else {
        const config =
          preset === 'crane'
            ? [0x0, index * current, 0x0]
            : [(args[0x2] / options) * index * current, 0x0, (-args[0x0] / options) * index * current];
        ((structuredClone2['position'] = event['position']['map']((scope, input) => scope + config[input])),
          (structuredClone2['target'] = event['target']['map']((output, value2) => output + config[value2])));
      }
    }
    storyboard3DShotAnimation = upsertStoryboard3DCameraKeyframe(storyboard3DShotAnimation, {
      camera: structuredClone2,
      time: key + count * current,
      easing: 'linear',
    });
  }
  return normalizeStoryboard3DShotAnimation(storyboard3DShotAnimation);
}
export function applyDirectorObjectPath(
  value3,
  {
    object: object,
    points: points,
    start: start = 0x0,
    duration: duration = 0x3,
    orient: orient = !![],
  } = {},
) {
  if (!object || object['locked']) throw new Error('请先选择一个未锁定的角色或物体。');
  const list = (points || [])['filter'](
    (value4) => Array['isArray'](value4) && value4['length'] === 0x3 && value4['every'](Number['isFinite']),
  );
  if (list['length'] < 0x2) throw new Error('走位至少需要两个路径点。');
  const value5 = list['map']((args2, value6) =>
      value6 ? Math['hypot'](...args2['map']((value7, value8) => value7 - list[value6 - 0x1][value8])) : 0x0,
    ),
    count2 = value5['reduce']((value9, value10) => value9 + value10, 0x0);
  if (count2 < 0.001) throw new Error('路径点之间需要有距离。');
  const value11 = Math['max'](0x0, Math['min'](3599.9, Number(start) || 0x0)),
    value12 = Math['max'](0.1, Math['min'](0xe10 - value11, Number(duration) || 0x3));
  let storyboard3DShotAnimation2 = normalizeStoryboard3DShotAnimation(value3);
  const value13 = storyboard3DShotAnimation2['objectTracks']['find'](
    (value14) => value14['objectId'] === object['id'],
  );
  for (const value15 of ['positionKeyframes', ...(orient ? ['rotationKeyframes'] : [])]) {
    if (value13)
      value13[value15] = value13[value15]['filter'](
        (value16) => value16['time'] < value11 || value16['time'] > value11 + value12,
      );
  }
  let value17 = 0x0;
  return (
    list['forEach']((value18, value19) => {
      value17 += value5[value19];
      const value20 = value11 + (value12 * value17) / count2;
      storyboard3DShotAnimation2 = upsertStoryboard3DObjectKeyframe(storyboard3DShotAnimation2, {
        objectId: object['id'],
        property: 'position',
        time: value20,
        value: value18,
        easing: 'linear',
      });
      if (orient) {
        const value21 = value19 === list['length'] - 0x1 ? list[value19 - 0x1] : value18,
          value22 = value19 === list['length'] - 0x1 ? value18 : list[value19 + 0x1],
          value23 = [...object['transform']['rotation']];
        ((value23[0x1] = Math['atan2'](value22[0x0] - value21[0x0], value22[0x2] - value21[0x2])),
          (storyboard3DShotAnimation2 = upsertStoryboard3DObjectKeyframe(storyboard3DShotAnimation2, {
            objectId: object['id'],
            property: 'rotation',
            time: value20,
            value: value23,
            easing: 'linear',
          })));
      }
    }),
    storyboard3DShotAnimation2
  );
}
