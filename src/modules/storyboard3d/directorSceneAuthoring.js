import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
export const DIRECTOR_AXIS_VIEWS = [
  ['front', '前', 0x0, 0x0],
  ['back', '后', Math['PI'], 0x0],
  ['left', '左', -Math['PI'] / 0x2, 0x0],
  ['right', '右', Math['PI'] / 0x2, 0x0],
  ['top', '上', 0x0, Math['PI'] / 0x2 - 0.0001],
  ['bottom', '下', 0x0, -Math['PI'] / 0x2 + 0.0001],
];
export function sampleDirectorGroundRoute(list, handler, value = 0x0, item = 0.25) {
  const list2 = list['slice'](0x1)['map']((key, index) =>
      Math['hypot'](key[0x0] - list[index][0x0], key[0x2] - list[index][0x2]),
    ),
    count =
      0x1 + list2['reduce']((result, data) => result + Math['max'](0x1, Math['ceil'](data / item)), 0x0);
  if (count > 0x64) throw new Error('路径过长，精细贴地采样超过 100 点，请分段编排。');
  const list3 = [];
  return (
    list['slice'](0x1)['forEach']((options, target) => {
      const source = Math['max'](0x1, Math['ceil'](list2[target] / item));
      for (let next = target ? 0x1 : 0x0; next <= source; next++) {
        const current = list[target][0x0] + ((options[0x0] - list[target][0x0]) * next) / source,
          entry = list[target][0x2] + ((options[0x2] - list[target][0x2]) * next) / source;
        list3['push']([current, handler(current, entry) + value, entry]);
      }
    }),
    list3
  );
}
export function transformDirectorScene(
  record,
  { x: x = 0x0, y: y = 0x0, z: z = 0x0, yaw: yaw = 0x0, scale: scale = 0x1 } = {},
) {
  if (![x, y, z, yaw, scale]['every'](Number['isFinite']) || scale < 0.01 || scale > 0x64)
    throw new Error('整体变换参数无效，缩放应为 0.01–100。');
  if (record['objects']['some']((payload) => payload['locked']))
    throw new Error('场景含锁定对象，请先解锁再整体变换。');
  const structuredClone2 = structuredClone(record),
    handle = new threeRuntime['Quaternion']()['setFromAxisAngle'](
      new threeRuntime['Vector3'](0x0, 0x1, 0x0),
      (yaw * Math['PI']) / 0xb4,
    ),
    state = new threeRuntime['Matrix4']()['compose'](
      new threeRuntime['Vector3'](x, y, z),
      handle,
      new threeRuntime['Vector3'](scale, scale, scale),
    ),
    handler2 = (args) => new threeRuntime['Vector3'](...args)['applyMatrix4'](state)['toArray'](),
    handler3 = (args2) =>
      new threeRuntime['Vector3'](...args2)['applyQuaternion'](handle)['multiplyScalar'](scale)['toArray'](),
    handler4 = (args3) => {
      const config = new threeRuntime['Quaternion']()['setFromEuler'](new threeRuntime['Euler'](...args3)),
        box = new threeRuntime['Euler']()['setFromQuaternion'](handle['clone']()['multiply'](config));
      return [box['x'], box['y'], box['z']];
    },
    handler5 = (event) => {
      ((event['position'] = handler2(event['position'])), (event['target'] = handler2(event['target'])));
    };
  for (const event2 of structuredClone2['objects']) {
    ((event2['transform']['position'] = handler2(event2['transform']['position'])),
      (event2['transform']['rotation'] = handler4(event2['transform']['rotation'])),
      (event2['transform']['scale'] = event2['transform']['scale']['map']((scope) => scope * scale)));
    if (event2['target']) event2['target'] = handler2(event2['target']);
  }
  for (const input of structuredClone2['shots']) {
    handler5(input['camera']);
    for (const output of input['animation']['cameraKeyframes']) {
      handler5(output['camera']);
      for (const value2 of ['inTangent', 'outTangent'])
        if (output[value2]) output[value2] = handler3(output[value2]);
    }
    for (const value3 of input['animation']['objectTracks']) {
      for (const el of value3['positionKeyframes']) {
        el['value'] = handler2(el['value']);
        for (const value4 of ['inTangent', 'outTangent']) if (el[value4]) el[value4] = handler3(el[value4]);
      }
      for (const el2 of value3['rotationKeyframes']) el2['value'] = handler4(el2['value']);
      for (const el3 of value3['scaleKeyframes'])
        el3['value'] = el3['value']['map']((value5) => value5 * scale);
    }
    for (const value6 of [
      input['animation']['cameraConstraint'],
      ...(input['animation']['cameraConstraintClips'] || []),
    ]) {
      ((value6['followOffset'] = handler3(value6['followOffset'] || [0x0, 0x0, 0x0])),
        (value6['lookAtOffset'] = handler3(value6['lookAtOffset'])));
    }
  }
  return (
    (structuredClone2['directorSettings']['groundHeight'] =
      structuredClone2['directorSettings']['groundHeight'] * scale + y),
    structuredClone2
  );
}
export function findDirectorObstacleRoute(
  args4,
  args5,
  list4,
  { clearance: clearance = 0.4, step: step = 0.5 } = {},
) {
  ((step = Math['max'](0.1, Number(step) || 0.5)), (clearance = Math['max'](0x0, Number(clearance) || 0x0)));
  const value7 = Math['max'](0x3, clearance * 0x4),
    value8 = Math['min'](args4[0x0], args5[0x0], ...list4['map']((value9) => value9['min'][0x0])) - value7,
    value10 = Math['min'](args4[0x2], args5[0x2], ...list4['map']((value11) => value11['min'][0x2])) - value7,
    value12 = Math['max'](args4[0x0], args5[0x0], ...list4['map']((value13) => value13['max'][0x0])) + value7,
    value14 = Math['max'](args4[0x2], args5[0x2], ...list4['map']((value15) => value15['max'][0x2])) + value7,
    value16 = Math['ceil']((value12 - value8) / step) + 0x1,
    count2 = Math['ceil']((value14 - value10) / step) + 0x1;
  if (value16 * count2 > 0x186a0) throw new Error('避障区域过大，请减小场景范围或增大采样步长。');
  const run = (value17) => [
      Math['round']((value17[0x0] - value8) / step),
      Math['round']((value17[0x2] - value10) / step),
    ],
    handler6 = (value18, value19) => [value8 + value18 * step, args4[0x1], value10 + value19 * step],
    handler7 = (value20, value21) => {
      const value22 = handler6(value20, value21);
      return list4['some'](
        (value23) =>
          value23['max'][0x1] > args4[0x1] + 0.1 &&
          value23['min'][0x1] < args4[0x1] + 1.8 &&
          value22[0x0] >= value23['min'][0x0] - clearance &&
          value22[0x0] <= value23['max'][0x0] + clearance &&
          value22[0x2] >= value23['min'][0x2] - clearance &&
          value22[0x2] <= value23['max'][0x2] + clearance,
      );
    },
    [value24, value25] = run(args4),
    [value26, value27] = run(args5),
    handler8 = (value28, value29) => value29 * value16 + value28,
    value30 = handler8(value26, value27);
  if (handler7(value24, value25) || handler7(value26, value27))
    throw new Error('路线起点或终点位于障碍物内，请先移开控制点。');
  const map = new Map([[handler8(value24, value25), null]]),
    list5 = [[value24, value25]];
  for (let value31 = 0x0; value31 < list5['length']; value31++) {
    const [value32, value33] = list5[value31],
      value34 = handler8(value32, value33);
    if (value34 === value30) break;
    for (const [value35, value36] of [
      [0x1, 0x0],
      [-0x1, 0x0],
      [0x0, 0x1],
      [0x0, -0x1],
    ]) {
      const count3 = value32 + value35,
        count4 = value33 + value36,
        value37 = handler8(count3, count4);
      if (
        count3 < 0x0 ||
        count4 < 0x0 ||
        count3 >= value16 ||
        count4 >= count2 ||
        map['has'](value37) ||
        handler7(count3, count4)
      )
        continue;
      (map['set'](value37, value34), list5['push']([count3, count4]));
    }
  }
  if (!map['has'](value30)) throw new Error('当前障碍与间距下找不到可通行路线。');
  const list6 = [];
  for (let value38 = value30; value38 != null; value38 = map['get'](value38))
    list6['push'](handler6(value38 % value16, Math['floor'](value38 / value16)));
  (list6['reverse'](), (list6[0x0] = [...args4]), (list6[list6['length'] - 0x1] = [...args5]));
  const list7 = list6['filter'](
    (value39, count5) =>
      count5 === 0x0 ||
      count5 === list6['length'] - 0x1 ||
      (value39[0x0] - list6[count5 - 0x1][0x0]) * (list6[count5 + 0x1][0x2] - value39[0x2]) !==
        (value39[0x2] - list6[count5 - 0x1][0x2]) * (list6[count5 + 0x1][0x0] - value39[0x0]),
  );
  if (list7['length'] > 0x64) throw new Error('避障路径控制点超过 100 个，请调整障碍布局。');
  return list7;
}
