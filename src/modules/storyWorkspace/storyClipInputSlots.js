import { resolveModelExecution } from '../../manifests/index.js';
const MEDIA_KINDS = Object['freeze'](['image', 'video', 'audio']),
  KIND_LABELS = Object['freeze']({ image: '图片', video: '视频', audio: '音频' });
function asObject(item) {
  return item && typeof item === 'object' && !Array['isArray'](item) ? item : {};
}
function normalizeText(key) {
  return String(key || '')['trim']();
}
function normalizeStoredInput(url, kind, result) {
  const response = typeof url === 'string' ? { url: url } : asObject(url),
    url2 = normalizeText(
      response['url'] ||
        response['localUrl'] ||
        response['imageUrl'] ||
        response['videoUrl'] ||
        response['audioUrl'] ||
        response['localPath'],
    );
  return {
    ...response,
    kind: kind,
    url: url2,
    slotId: normalizeText(response['slotId'] || response['refSlot']),
    order: Number['isFinite'](Number(response['order'])) ? Number(response['order']) : result,
  };
}
export function normalizeStoryClipInputs(options = {}) {
  const asObject2 = asObject(options);
  return Object['fromEntries'](
    MEDIA_KINDS['map']((data) => {
      const target = asObject2[data] ?? asObject2[data + 's'] ?? [],
        list = Array['isArray'](target) ? target : target ? [target] : [];
      return [data, list['map']((source, next) => normalizeStoredInput(source, data, next))];
    }),
  );
}
function getSlotCount(current, entry, record) {
  const payload = Number(current?.['maxByKind']?.[entry]);
  if (Number['isFinite'](payload)) return Math['max'](0, Math['trunc'](payload));
  const handle = (current?.['fixedSlots'] || [])['filter'](
      (state) => normalizeText(state?.['kind']) === entry,
    )['length'],
    config = Number(current?.['minByKind']?.[entry]);
  return Math['max'](handle, record + 1, Number['isFinite'](config) ? Math['trunc'](config) : 0, 1);
}
function assignInputsToSlots(list2, list3) {
  const input = new Map(),
    map = new Set(list2['map']((scope) => scope['id']));
  for (const output of list3) {
    output['slotId'] &&
      map['has'](output['slotId']) &&
      !input['has'](output['slotId']) &&
      input['set'](output['slotId'], output);
  }
  const value2 = list3['filter'](
    (enabled) =>
      !enabled['slotId'] || !map['has'](enabled['slotId']) || input['get'](enabled['slotId']) !== enabled,
  );
  for (const value3 of list2) {
    if (input['has'](value3['id'])) continue;
    const value4 = value2['shift']();
    if (value4) input['set'](value3['id'], value4);
  }
  return list2['map']((args) => ({ ...args, input: input['get'](args['id']) || null }));
}
export function buildStoryClipInputSlotViewModel({
  modelId: modelId,
  provider: provider = '',
  inputs: inputs = {},
} = {}) {
  const modelId2 = resolveModelExecution(modelId, { providerHint: provider });
  if (!modelId2?.['modelManifest'] || modelId2['modelManifest']['kind'] !== 'video')
    throw new Error('视频模型缺少 manifest：' + (normalizeText(modelId) || '(empty)'));
  const asObject3 = asObject(modelId2['modelManifest']['inputSlots']),
    map2 = new Set(
      (Array['isArray'](asObject3['allowedKinds']) ? asObject3['allowedKinds'] : [])
        ['map'](normalizeText)
        ['filter'](Boolean),
    ),
    storyClipInputs = normalizeStoryClipInputs(inputs),
    list4 = Array['isArray'](asObject3['fixedSlots']) ? asObject3['fixedSlots'] : [],
    groups = MEDIA_KINDS['filter']((value5) => map2['has'](value5))['map']((kind2) => {
      const value6 = list4['filter']((value7) => normalizeText(value7?.['kind']) === kind2)['sort'](
          (value8, value9) =>
            Number(value8?.['displayOrder'] || 0) - Number(value9?.['displayOrder'] || 0),
        ),
        length = getSlotCount(asObject3, kind2, storyClipInputs[kind2]['length']),
        value10 = Array['from']({ length: length }, (value11, index2) => {
          const required = value6[index2] || null;
          return {
            id: normalizeText(required?.['id']) || kind2 + '-' + (index2 + 1),
            kind: kind2,
            index: index2,
            label: normalizeText(required?.['label']) || KIND_LABELS[kind2] + ' ' + (index2 + 1),
            required:
              required?.['required'] === true || index2 < Number(asObject3?.['minByKind']?.[kind2] || 0),
            fixed: Boolean(required),
          };
        });
      return {
        kind: kind2,
        label: KIND_LABELS[kind2],
        min: Math['max'](0, Number(asObject3?.['minByKind']?.[kind2] || 0)),
        max: length,
        slots: assignInputsToSlots(value10, storyClipInputs[kind2]),
      };
    });
  return {
    modelId: modelId2['modelManifest']['modelId'],
    provider: modelId2['modelManifest']['provider'],
    displayName: normalizeText(modelId2['modelManifest']['displayName']),
    groups: groups,
    slots: groups['flatMap']((value12) => value12['slots']),
  };
}
export function updateStoryClipInput(
  value13,
  { kind: kind3, slotId: slotId, index: index = null, value: value = null } = {},
) {
  const text = normalizeText(kind3);
  if (!MEDIA_KINDS['includes'](text)) throw new Error('不支持的片段输入类型：' + (text || '(empty)'));
  const slotId2 = normalizeText(slotId);
  if (!slotId2) throw new Error('更新片段输入时缺少 slotId');
  const args2 = normalizeStoryClipInputs(asObject(value13)['inputs']),
    value14 = index === null || index === undefined ? Number['NaN'] : Number(index),
    list5 = args2[text]['filter'](
      (value15, value16) =>
        normalizeText(value15['slotId']) !== slotId2 &&
        !(
          Number['isFinite'](value14) &&
          !normalizeText(value15['slotId']) &&
          value16 === Math['max'](0, Math['trunc'](value14))
        ),
    );
  if (value !== null && value !== undefined && value !== '') {
    const args3 = normalizeStoredInput(value, text, list5['length']);
    list5['push']({ ...args3, slotId: slotId2 });
  }
  return { ...asObject(value13), inputs: { ...args2, [text]: list5 } };
}
