import { collectDirectorKeys } from './directorTimelineOperations.js';
const finite = (value, item) => (Number['isFinite'](Number(value)) ? Number(value) : item);
export function normalizeDirectorClips(key, index) {
  const list = collectDirectorKeys(index),
    map = new Set(list['map'](({ key: key2 }) => key2['id'])),
    map2 = new Set();
  return (Array['isArray'](key) ? key : [])
    ['slice'](0, 300)
    ['map']((error, result) => {
      const keyframeIds = [...new Set(Array['isArray'](error?.['keyframeIds']) ? error['keyframeIds'] : [])][
        'filter'
      ]((data) => map['has'](data) && !map2['has'](data));
      if (!keyframeIds['length']) return null;
      keyframeIds['forEach']((options) => map2['add'](options));
      const list2 = list['filter'](({ key: key3 }) => keyframeIds['includes'](key3['id'])),
        start = Math['max'](
          0,
          Math['min'](
            3599.9,
            finite(error['start'], Math['min'](...list2['map'](({ key: key4 }) => key4['time']))),
          ),
        );
      return {
        id: String(error['id'] || 'motion-clip-' + result),
        name: String(error['name'] || '运动片段')['slice'](0, 120),
        keyframeIds: keyframeIds,
        start: start,
        end: Math['max'](
          start + 0.1,
          Math['min'](
            3600,
            finite(error['end'], Math['max'](...list2['map'](({ key: key5 }) => key5['time']))),
          ),
        ),
      };
    })
    ['filter'](Boolean)
    ['sort'](
      (target, source) => target['start'] - source['start'] || target['id']['localeCompare'](source['id']),
    );
}
export function resolveDirectorClipSample(next, keys, time) {
  const map3 = new Set(keys['map']((current) => current['id'])),
    list3 = (next || [])['filter']((entry) => entry['keyframeIds']['some']((record) => map3['has'](record)));
  if (!list3['length']) return { keys: keys, time: time };
  const map4 = new Set(list3['flatMap']((payload) => payload['keyframeIds'])),
    enabled = list3['filter']((handle) => handle['start'] <= time)['at'](-1);
  if (!enabled) return { keys: keys['filter']((state) => !map4['has'](state['id'])), time: time };
  const keys2 = keys['filter']((config) => !map4['has'](config['id']) && config['time'] > enabled['end']);
  if (time >= enabled['end'] && keys2['length'] && time >= keys2[0]['time'])
    return { keys: keys2, time: time };
  const map5 = new Set(enabled['keyframeIds']);
  return {
    keys: keys['filter']((scope) => map5['has'](scope['id'])),
    time: Math['min'](time, enabled['end']),
  };
}
export function createDirectorClip(input, output, name = '运动片段') {
  const map6 = new Set(output),
    list4 = collectDirectorKeys(input)['filter'](({ key: key6 }) => map6['has'](key6['id']));
  if (!list4['length']) throw new Error('请先选择关键帧或创建轨迹。');
  if (
    (input['motionClips'] || [])['some']((value2) =>
      value2['keyframeIds']['some']((value3) => map6['has'](value3)),
    )
  )
    throw new Error('选中关键帧已属于运动片段，请编辑或复制原片段。');
  const structuredClone2 = structuredClone(input),
    start2 = Math['min'](...list4['map'](({ key: key7 }) => key7['time'])),
    value4 = Math['max'](...list4['map'](({ key: key8 }) => key8['time']));
  return (
    (structuredClone2['motionClips'] = [
      ...(structuredClone2['motionClips'] || []),
      {
        id: 'motion-' + globalThis['crypto']['randomUUID'](),
        name: name,
        keyframeIds: [...map6],
        start: start2,
        end: Math['max'](start2 + 0.1, value4),
      },
    ]),
    structuredClone2
  );
}
export function editDirectorClip(value5, { kind: kind, id: id, start: start3, end: end, move: move = ![] }) {
  const structuredClone3 = structuredClone(value5),
    enabled2 = (kind === 'action' ? structuredClone3['actionClips'] : structuredClone3['motionClips'])?.[
      'find'
    ]((value6) => value6['id'] === id);
  if (!enabled2) return structuredClone3;
  const count = Math['round'](Number(start3) * structuredClone3['fps']) / structuredClone3['fps'],
    count2 = Math['round'](Number(end) * structuredClone3['fps']) / structuredClone3['fps'];
  if (
    !Number['isFinite'](count) ||
    !Number['isFinite'](count2) ||
    count < 0 ||
    count2 > 3600 ||
    count2 - count < 1 / structuredClone3['fps']
  )
    throw new Error('片段范围必须在 0–3600 秒内且至少一帧。');
  if (kind === 'action' && !move) {
    const count3 = enabled2['offset'] + (count - enabled2['start']) * enabled2['speed'];
    if (count3 < 0) throw new Error('无法向前扩展到动作源起点之前。');
    enabled2['offset'] = count3;
  }
  if (kind === 'motion' && move) {
    const count4 = count - enabled2['start'],
      map7 = new Set(enabled2['keyframeIds']),
      list5 = collectDirectorKeys(structuredClone3)['filter'](({ key: key9 }) => map7['has'](key9['id']));
    if (list5['some'](({ key: key10 }) => key10['time'] + count4 < 0 || key10['time'] + count4 > 3600))
      throw new Error('移动后源关键帧超出范围。');
    list5['forEach'](({ key: key11 }) => {
      key11['time'] += count4;
    });
  }
  return ((enabled2['start'] = count), (enabled2['end'] = count2), structuredClone3);
}
export function duplicateDirectorClip(value7, value8, value9, value10) {
  return pasteDirectorClip(value7, copyDirectorClip(value7, value8, value9), value10);
}
export function copyDirectorClip(value11, kind2, value12) {
  const clip = (kind2 === 'action' ? value11['actionClips'] : value11['motionClips'])?.['find'](
    (value13) => value13['id'] === value12,
  );
  if (!clip) throw new Error('片段已不存在。');
  return structuredClone({
    kind: kind2,
    clip: clip,
    entries:
      kind2 === 'motion'
        ? collectDirectorKeys(value11)['filter'](({ key: key12 }) =>
            clip['keyframeIds']['includes'](key12['id']),
          )
        : [],
  });
}
export function pasteDirectorClip(value14, value15, count5) {
  const structuredClone4 = structuredClone(value14),
    { kind: kind3, clip: clip2, entries: entries } = value15;
  if (!clip2) throw new Error('片段已不存在。');
  const structuredClone5 = structuredClone(clip2),
    count6 = count5 - structuredClone5['start'];
  if (count5 < 0 || structuredClone5['end'] + count6 > 3600) throw new Error('复制片段超出镜头时长范围。');
  ((structuredClone5['id'] = 'clip-' + globalThis['crypto']['randomUUID']()),
    (structuredClone5['start'] += count6),
    (structuredClone5['end'] += count6));
  if (kind3 === 'motion') {
    const map8 = new Map();
    for (const time2 of entries) {
      const value16 = {
        ...structuredClone(time2['key']),
        id: 'key-' + globalThis['crypto']['randomUUID'](),
        time: time2['key']['time'] + count6,
      };
      if (value16['time'] < 0 || value16['time'] > 3600) throw new Error('源关键帧超出复制范围。');
      map8['set'](time2['key']['id'], value16['id']);
      const enabled3 = structuredClone4['objectTracks']['find'](
        (value17) => value17['objectId'] === time2['objectId'],
      );
      if (time2['type'] !== 'camera' && !enabled3) throw new Error('片段对应物体轨道已不存在。');
      const list6 =
        time2['type'] === 'camera'
          ? structuredClone4['cameraKeyframes']
          : enabled3[time2['property'] + 'Keyframes'];
      list6['push'](value16);
    }
    ((structuredClone5['keyframeIds'] = structuredClone5['keyframeIds']['map']((value18) =>
      map8['get'](value18),
    )),
      (structuredClone4['motionClips'] ||= [])['push'](structuredClone5));
  } else structuredClone4['actionClips']['push'](structuredClone5);
  return structuredClone4;
}
