export function normalizeDirectorCameraPath(value, pointIds) {
  const map = new Set(Array['isArray'](value?.['pointIds']) ? value['pointIds'] : []);
  return {
    pointIds: pointIds['filter']((item) => map['has'](item['id']))['map']((key) => key['id']),
  };
}
export function readDirectorCameraPath(index) {
  const map2 = new Set(index?.['cameraPath']?.['pointIds'] || []);
  return (index?.['cameraKeyframes'] || [])['filter']((result) => map2['has'](result['id']));
}
export function addDirectorCameraPathPoint(args, data) {
  const list = readDirectorCameraPath(args),
    time = list['length']
      ? list['at'](-0x1)['time'] + 0x1
      : Math['max'](0x0, ...args['cameraKeyframes']['map']((options) => options['time'])) + 0x1;
  if (time > 0xe10) throw new Error('轨道已达到镜头时长上限。');
  if (list['length'] >= 0x64) throw new Error('每条轨道最多 100 个控制点。');
  const structuredClone2 = structuredClone(args);
  if (!list['length'])
    structuredClone2['cameraPath'] = { pointIds: [structuredClone2['cameraKeyframes']['at'](-0x1)['id']] };
  const target = {
    id: 'camera-path-' + globalThis['crypto']['randomUUID'](),
    time: time,
    camera: structuredClone(data),
    easing: 'linear',
  };
  return (
    structuredClone2['cameraKeyframes']['push'](target),
    structuredClone2['cameraPath']['pointIds']['push'](target['id']),
    (structuredClone2['duration'] = Math['max'](structuredClone2['duration'], time)),
    structuredClone2
  );
}
export function updateDirectorCameraPathPoint(source, next, args2) {
  const structuredClone3 = structuredClone(source),
    enabled = structuredClone3['cameraKeyframes']['find']((current) => current['id'] === next);
  if (!enabled) return structuredClone3;
  if (args2['time'] != null) {
    const count = Math['round'](Number(args2['time']) * structuredClone3['fps']) / structuredClone3['fps'];
    if (!Number['isFinite'](count) || count < 0x0 || count > 0xe10)
      throw new Error('控制点时间必须在\x200–3600\x20秒之间。');
    if (
      structuredClone3['cameraKeyframes']['some'](
        (entry) => entry['id'] !== next && Math['abs'](entry['time'] - count) < 0.5 / structuredClone3['fps'],
      )
    )
      throw new Error('该帧已有摄像机控制点。');
    enabled['time'] = count;
  }
  if (args2['camera']) enabled['camera'] = structuredClone(args2['camera']);
  args2['easing'] && ((enabled['easing'] = args2['easing']), delete enabled['easingCurve']);
  for (const record of ['inTangent', 'outTangent', 'easingCurve']) {
    if (Object['hasOwn'](args2, record)) {
      if (args2[record]) enabled[record] = [...args2[record]];
      else delete enabled[record];
    }
  }
  return (
    structuredClone3['cameraKeyframes']['sort'](
      (payload, handle) => payload['time'] - handle['time'] || payload['id']['localeCompare'](handle['id']),
    ),
    (structuredClone3['cameraPath'] = normalizeDirectorCameraPath(
      structuredClone3['cameraPath'],
      structuredClone3['cameraKeyframes'],
    )),
    structuredClone3
  );
}
export function removeDirectorCameraPathPoint(state, config) {
  if (state['cameraKeyframes']['length'] <= 0x1) throw new Error('至少保留一个摄像机控制点。');
  const structuredClone4 = structuredClone(state);
  return (
    (structuredClone4['cameraKeyframes'] = structuredClone4['cameraKeyframes']['filter'](
      (scope) => scope['id'] !== config,
    )),
    (structuredClone4['cameraPath'] = normalizeDirectorCameraPath(
      structuredClone4['cameraPath'],
      structuredClone4['cameraKeyframes'],
    )),
    structuredClone4
  );
}
