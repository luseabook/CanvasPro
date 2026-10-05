const INPUT_KINDS = new Set(['text', 'image', 'video', 'audio']);
function normalizeKind(value = '') {
  const item = String(value || '')['trim']();
  return INPUT_KINDS['has'](item) ? item : '';
}
function normalizeSlotId(key = '') {
  return String(key || '')['trim']();
}
function toPositiveInteger(index) {
  const count = Number(index);
  if (!Number['isFinite'](count) || count <= 0) return 0;
  return Math['trunc'](count);
}
function getVisibleFixedSlots(value2 = null) {
  const map = new Set(
    (Array['isArray'](value2?.['visibleSlots']) ? value2['visibleSlots'] : [])
      ['map'](normalizeSlotId)
      ['filter'](Boolean),
  );
  return (Array['isArray'](value2?.['fixedSlots']) ? value2['fixedSlots'] : [])
    ['map']((args) => ({
      ...args,
      id: normalizeSlotId(args?.['id']),
      kind: normalizeKind(args?.['kind']),
    }))
    ['filter']((result) => result['id'] && result['kind'] && map['has'](result['id']));
}
export function countManifestInputRecords(list = []) {
  return (Array['isArray'](list) ? list : [])['reduce'](
    (data, options) => {
      const kind = normalizeKind(options?.['kind']);
      if (!kind) return data;
      return ((data[kind] = (data[kind] || 0) + 1), data);
    },
    { text: 0, image: 0, video: 0, audio: 0 },
  );
}
export function buildFixedSlotOccupancy({
  fixedInputConfig: fixedInputConfig = null,
  inputRecords: inputRecords = [],
} = {}) {
  const list2 = getVisibleFixedSlots(fixedInputConfig);
  if (list2['length'] === 0) return {};
  const map2 = new Map(list2['map']((target) => [target['id'], target])),
    map3 = list2['reduce']((map4, source) => {
      if (!map4['has'](source['kind'])) map4['set'](source['kind'], []);
      return (map4['get'](source['kind'])['push'](source['id']), map4);
    }, new Map()),
    list3 = (Array['isArray'](inputRecords) ? inputRecords : [])
      ['map']((next, index2) => ({
        index: index2,
        kind: normalizeKind(next?.['kind']),
        refSlot: normalizeSlotId(next?.['refSlot']),
      }))
      ['filter']((current) => current['kind']),
    enabled = {},
    map5 = new Set();
  return (
    list3['forEach']((enabled2) => {
      if (!enabled2['refSlot'] || map5['has'](enabled2['index'])) return;
      const enabled3 = map2['get'](enabled2['refSlot']);
      if (!enabled3 || enabled3['kind'] !== enabled2['kind'] || enabled[enabled3['id']]) return;
      ((enabled[enabled3['id']] = !![]), map5['add'](enabled2['index']));
    }),
    list3['forEach']((entry) => {
      if (map5['has'](entry['index'])) return;
      const enabled4 = (map3['get'](entry['kind']) || [])['find']((record) => !enabled[record]);
      if (!enabled4) return;
      ((enabled[enabled4] = !![]), map5['add'](entry['index']));
    }),
    enabled
  );
}
export function getMissingManifestInputRequirement({
  inputSlots: inputSlots = null,
  fixedInputConfig: fixedInputConfig = null,
  inputCounts: inputCounts = null,
  occupiedFixedSlots: occupiedFixedSlots = null,
} = {}) {
  const payload =
      inputCounts && typeof inputCounts === 'object'
        ? inputCounts
        : { text: 0, image: 0, video: 0, audio: 0 },
    handle = occupiedFixedSlots && typeof occupiedFixedSlots === 'object' ? occupiedFixedSlots : {},
    kind2 = getVisibleFixedSlots(fixedInputConfig)['find'](
      (state) => state['required'] === !![] && handle[state['id']] !== !![],
    );
  if (kind2)
    return {
      kind: kind2['kind'],
      slotId: kind2['id'],
      required: 1,
      actual: 0,
      source: 'fixedSlot',
    };
  const config =
    inputSlots?.['minByKind'] && typeof inputSlots['minByKind'] === 'object' ? inputSlots['minByKind'] : {};
  for (const [scope, input] of Object['entries'](config)) {
    const kind3 = normalizeKind(scope),
      required = toPositiveInteger(input);
    if (!kind3 || required <= 0) continue;
    const actual = Math['max'](0, Number(payload[kind3]) || 0);
    if (actual < required)
      return { kind: kind3, slotId: '', required: required, actual: actual, source: 'minByKind' };
  }
  return null;
}
