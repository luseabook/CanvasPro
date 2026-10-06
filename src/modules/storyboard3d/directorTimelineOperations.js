export function collectDirectorKeys(args) {
  return [
    ...args.cameraKeyframes.map((key) => ({
      key: key,
      type: 'camera',
      objectId: '',
      property: '',
    })),
    ...args.objectTracks.flatMap((objectId) =>
      ['position', 'rotation', 'scale'].flatMap((property) =>
        objectId[property + 'Keyframes'].map((key2) => ({
          key: key2,
          type: 'object',
          objectId: objectId.objectId,
          property: property,
        })),
      ),
    ),
  ];
}
export function directorKeyIdentity(event) {
  return (
    event.type +
    ':' +
    (event.objectId || '') +
    ':' +
    (event.property || '') +
    ':' +
    (event.key?.id || event.keyframeId)
  );
}
export function shiftDirectorKeys(value, item, index) {
  const structuredClone2 = structuredClone(value),
    map = new Set(item),
    list = collectDirectorKeys(structuredClone2),
    list2 = list.filter((result) => map.has(directorKeyIdentity(result)));
  if (!list2.length) return structuredClone2;
  const data = Math.round(Number(index) * structuredClone2.fps) / structuredClone2.fps;
  if (!Number.isFinite(data)) throw new Error('请输入有效时间。');
  const args2 = list2.map(({ key: key3 }) => key3.time + data);
  if (Math.min(...args2) < 0 || Math.max(...args2) > 3600)
    throw new Error('移动后关键帧超出 0–3600 秒范围。');
  for (const event2 of list2) {
    if (
      list.some(
        (event3) =>
          !map.has(directorKeyIdentity(event3)) &&
          event3.type === event2.type &&
          event3.objectId === event2.objectId &&
          event3.property === event2.property &&
          Math.abs(event3.key.time - event2.key.time - data) < 0.5 / structuredClone2.fps,
      )
    )
      throw new Error('移动后与已有关键帧冲突。');
  }
  return (
    list2.forEach(({ key: key4 }) => {
      key4.time += data;
    }),
    structuredClone2
  );
}
export function copyDirectorKeys(options, target) {
  const map2 = new Set(target),
    list3 = collectDirectorKeys(options).filter((source) => map2.has(directorKeyIdentity(source)));
  if (!list3.length) return [];
  const next = Math.min(...list3.map(({ key: key5 }) => key5.time));
  return list3.map((time) => ({
    ...structuredClone(time),
    key: { ...structuredClone(time.key), time: time.key.time - next },
  }));
}
export function pasteDirectorKeys(current, entry, record) {
  const structuredClone3 = structuredClone(current);
  for (const event4 of entry) {
    const payload = {
      ...structuredClone(event4.key),
      id: 'key-' + globalThis.crypto.randomUUID(),
      time:
        Math.round((event4.key.time + record) * structuredClone3.fps) / structuredClone3.fps,
    };
    if (payload.time < 0 || payload.time > 3600) throw new Error('粘贴超出镜头时长范围。');
    const handle = structuredClone3.objectTracks.find(
        (state) => state.objectId === event4.objectId,
      ),
      list4 =
        event4.type === 'camera'
          ? structuredClone3.cameraKeyframes
          : handle?.[event4.property + 'Keyframes'];
    if (!list4) throw new Error('粘贴目标轨道已不存在。');
    if (
      list4.some((config) => Math.abs(config.time - payload.time) < 0.5 / structuredClone3.fps)
    )
      throw new Error('粘贴位置已有关键帧，请移动播放头。');
    list4.push(payload);
  }
  return structuredClone3;
}
export function deleteDirectorKeys(scope, input) {
  const structuredClone4 = structuredClone(scope),
    map3 = new Set(input);
  for (const event5 of collectDirectorKeys(structuredClone4)) {
    if (!map3.has(directorKeyIdentity(event5))) continue;
    const list5 =
      event5.type === 'camera'
        ? structuredClone4.cameraKeyframes
        : structuredClone4.objectTracks.find((output) => output.objectId === event5.objectId)[
            event5.property + 'Keyframes'
          ];
    if (event5.type === 'camera' && list5.length <= 1) throw new Error('至少保留一个摄像机关键帧。');
    list5.splice(
      list5.findIndex((value2) => value2.id === event5.key.id),
      1,
    );
  }
  return structuredClone4;
}
export function directorSnapTime(value3, args3, value4 = 0, value5 = []) {
  const value6 = Math.round(value3 * args3.fps) / args3.fps,
    map4 = new Set(value5),
    list6 = [
      0,
      args3.duration,
      ...collectDirectorKeys(args3)
        .filter((event6) => !map4.has(event6.key.id))
        .map(({ key: key6 }) => key6.time),
      ...[...args3.actionClips, ...(args3.motionClips || [])].flatMap((value7) => [
        value7.start,
        value7.end,
      ]),
    ],
    value8 = list6.reduce(
      (value9, value10) => (Math.abs(value10 - value6) < Math.abs(value9 - value6) ? value10 : value9),
      value6 + value4 + 1,
    );
  return Math.abs(value8 - value6) <= value4 ? value8 : value6;
}
