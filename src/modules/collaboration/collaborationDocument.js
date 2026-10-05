const PRIVATE_KEYS =
    /^(?:_.*|.*apiKey|authorization|cookie|cookies|password|secret|accessToken|refreshToken|cdkey|providerProfileId|rhProviderProfileId|providerAssetRefs|selected|isSelected|isGenerating|isLoading|loading|progress|generation(?:StartTime|EndTime|Duration|Progress|Error|Queue.*|Task.*|Request.*|History|Recover.*)|rhTask.*|rhStatus.*|taskId|taskStatus|asyncTask.*|job.*|error|statusMessage|hydratedAt|waveformLocalPath|waveformUrl)$/i,
  MEDIA_KEYS =
    /(?:^(?:src|url|thumbnail|thumb|image|video|audio|poster|dataUrl|references)$|(?:Urls?|Paths?|Srcs?|Images|Videos|Audios)$)/i,
  MEDIA_SOURCE =
    /^(?:https?:|blob:|data:(?:image|video|audio)\/|file:|[A-Za-z]:[\\/]|\/?(?:api\/|output\/|uploads\/|assets\/|data\/|user\/))/i,
  unsafeField = (value) => ['__proto__', 'constructor', 'prototype']['includes'](value),
  privateField = (item) => PRIVATE_KEYS['test'](item) || PRIVATE_KEYS['test'](item['replace'](/[_-]/g, ''));
export function cloneGraph(state = {}) {
  return {
    nodes: structuredClone(state['nodes'] || {}),
    edges: structuredClone(state['edges'] || {}),
  };
}
export function sharedValue(list, key = '', handler = (index) => index) {
  if (Array['isArray'](list)) return list['map']((result) => sharedValue(result, key, handler));
  if (list && typeof list === 'object') {
    const data = {};
    for (const [options, target] of Object['entries'](list)) {
      if (privateField(options) || unsafeField(options) || target === undefined) continue;
      data[options] = sharedValue(target, options, handler);
    }
    return data;
  }
  if (typeof list === 'string' && MEDIA_KEYS['test'](key) && MEDIA_SOURCE['test'](list)) return handler(list);
  return list;
}
export function projectGraph(state2, source) {
  return {
    nodes: sharedValue(state2['nodes'] || {}, '', source),
    edges: sharedValue(state2['edges'] || {}, '', source),
  };
}
export function mergeSharedNode(list2, list3) {
  if (Array['isArray'](list3))
    return list3['map']((next) =>
      mergeSharedNode(
        next?.['id'] && Array['isArray'](list2)
          ? list2['find']((current) => current?.['id'] === next['id'])
          : undefined,
        next,
      ),
    );
  if (list3 && typeof list3 === 'object') {
    const entry = {};
    for (const [record, payload] of Object['entries'](list2 || {})) {
      if (
        /^waveform(?:LocalPath|Url)$/i['test'](record) &&
        ['src', 'localPath', 'originalLocalPath']['some']((handle) => list2?.[handle] !== list3[handle])
      )
        continue;
      if (!unsafeField(record) && privateField(record)) entry[record] = structuredClone(payload);
    }
    for (const [config, scope] of Object['entries'](list3)) {
      if (!unsafeField(config) && !privateField(config))
        entry[config] = mergeSharedNode(list2?.[config], scope);
    }
    return entry;
  }
  return list3;
}
export function graphChanges(input, output) {
  const list4 = [];
  for (const kind of ['nodes', 'edges']) {
    for (const id of new Set([...Object['keys'](input[kind] || {}), ...Object['keys'](output[kind] || {})])) {
      const before = input[kind]?.[id] ?? null,
        after = output[kind]?.[id] ?? null;
      if (JSON['stringify'](before) !== JSON['stringify'](after))
        list4['push']({ kind: kind, id: id, before: before, after: after });
    }
  }
  return list4;
}
export function applyGraphChanges(value2, value3) {
  const cloneGraph2 = cloneGraph(value2);
  for (const value4 of value3) {
    if (value4['after'] === null) delete cloneGraph2[value4['kind']][value4['id']];
    else cloneGraph2[value4['kind']][value4['id']] = structuredClone(value4['after']);
  }
  return cloneGraph2;
}
export function invertChanges(list5) {
  return list5['map'](({ kind: kind2, id: id2, before: before2, after: after2 }) => ({
    kind: kind2,
    id: id2,
    before: after2,
    after: before2,
  }));
}
export function graphChangesConflict(list6, list7, state3) {
  const map = new Set(list6['map']((value5) => value5['kind'] + ':' + value5['id'])),
    map2 = new Set(
      list6['filter']((enabled) => enabled['kind'] === 'nodes' && !enabled['after'])['map'](
        (value6) => value6['id'],
      ),
    );
  return list7['some']((value7) => {
    if (map['has'](value7['kind'] + ':' + value7['id'])) return true;
    if (value7['kind'] === 'edges')
      return [value7['after']?.['sourceId'], value7['after']?.['targetId']]['some']((value8) =>
        map2['has'](value8),
      );
    let value9 = value7['after']?.['parentId'];
    const map3 = new Set();
    while (value9 && !map3['has'](value9)) {
      if (map2['has'](value9)) return true;
      (map3['add'](value9), (value9 = state3['nodes'][value9]?.['parentId']));
    }
    return false;
  });
}
