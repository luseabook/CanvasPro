function normalizeText(value) {
  return String(value || '')['trim']();
}
function buildOperationKey({
  kind: kind = '',
  sourceNodeId: sourceNodeId = '',
  segmentId: segmentId = '',
} = {}) {
  return [normalizeText(kind), normalizeText(sourceNodeId), normalizeText(segmentId)]['join']('\x1f');
}
function normalizeSegmentIds(options = {}) {
  const item = [
    ...(Array['isArray'](options['segmentIds']) ? options['segmentIds'] : []),
    options['segmentId'],
  ]
    ['map'](normalizeText)
    ['filter'](Boolean);
  return [...new Set(item)];
}
function operationsOverlap(options2 = {}, key = {}) {
  if (options2['sourceNodeId'] !== key['sourceNodeId']) return ![];
  const list = options2['segmentIds'] || [],
    list2 = key['segmentIds'] || [];
  if (list['includes']('all') || list2['includes']('all')) return !![];
  const map = new Set(list);
  return list2['some']((index) => map['has'](index));
}
export function createAudioVoiceSegmentEditSession() {
  const map2 = new Map();
  let result = 0;
  function begin(payload = {}) {
    const key2 = buildOperationKey(payload);
    if (map2['has'](key2)) return null;
    const data = {
      id: ++result,
      key: key2,
      kind: normalizeText(payload['kind']),
      sourceNodeId: normalizeText(payload['sourceNodeId']),
      segmentId: normalizeText(payload['segmentId']),
      segmentIds: normalizeSegmentIds(payload),
      payload: payload['payload'] ?? null,
      invalidated: ![],
    };
    if ([...map2['values']()]['some']((target) => operationsOverlap(target, data))) return null;
    const source = data;
    return (map2['set'](key2, source), source);
  }
  function isCurrent(event, next = event?.['sourceNodeId']) {
    return (
      !!event &&
      event['invalidated'] !== !![] &&
      map2['get'](event['key']) === event &&
      event['sourceNodeId'] === normalizeText(next)
    );
  }
  function finish(event2) {
    if (!isCurrent(event2)) return ![];
    return (map2['delete'](event2['key']), (event2['invalidated'] = !![]), !![]);
  }
  function invalidateAll() {
    (map2['forEach']((current) => {
      current['invalidated'] = !![];
    }),
      map2['clear']());
  }
  function listActive(options3 = {}) {
    const text = normalizeText(options3['kind']),
      text2 = normalizeText(options3['sourceNodeId']);
    return [...map2['values']()]['filter'](
      (entry) =>
        entry['invalidated'] !== !![] &&
        (!text || entry['kind'] === text) &&
        (!text2 || entry['sourceNodeId'] === text2),
    );
  }
  function isSegmentReserved(record, handle) {
    const sourceNodeId2 = normalizeText(record),
      text3 = normalizeText(handle);
    if (!sourceNodeId2 || !text3) return ![];
    return listActive({ sourceNodeId: sourceNodeId2 })['some'](
      (state) => state['segmentIds']['includes']('all') || state['segmentIds']['includes'](text3),
    );
  }
  return {
    begin: begin,
    finish: finish,
    getActiveCount: () => map2['size'],
    invalidateAll: invalidateAll,
    isCurrent: isCurrent,
    isSegmentReserved: isSegmentReserved,
    listActive: listActive,
  };
}
