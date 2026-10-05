import { getModelManifest } from '../../manifests/index.js';
export function getAudioWorkflowSlots(value = '', { includeImages: includeImages = ![] } = {}) {
  const modelManifest = getModelManifest(value),
    item = modelManifest?.['inputSlots'],
    list = item?.['fixedSlots'],
    count = Number(item?.['maxByKind']?.['audio']);
  if (Number['isFinite'](count) && count <= 0 && !includeImages) return [];
  if (Array['isArray'](list) && list['length'] > 0)
    return list['map']((label) => ({
      slot: String(label?.['id'] || '')['trim'](),
      kind: String(label?.['kind'] || '')['trim'](),
      label: label?.['label'] || label?.['id'] || '音频参考',
      required: label?.['required'] === !![],
    }))['filter'](
      (enabled) =>
        enabled['slot'] &&
        (!enabled['kind'] || enabled['kind'] === 'audio' || (includeImages && enabled['kind'] === 'image')),
    );
  if (Number['isFinite'](count) && count <= 0) return [];
  return [{ slot: 'audioRef', kind: 'audio', label: '音频参考', required: !![] }];
}
export function getAudioWorkflowInputLimit(key = '') {
  return getAudioWorkflowSlots(key)['length'] || 1;
}
export function normalizeAudioWorkflowRefSlots(list2 = [], index = '') {
  const list3 = Array['isArray'](list2) ? list2 : [],
    refSlot = getAudioWorkflowSlots(index)['map']((result) => result['slot']);
  if (refSlot['length'] === 0) return list3;
  const map = new Set();
  return list3['map']((args) => {
    const refSlot2 = String(args?.['refSlot'] || '')['trim']();
    if (refSlot2 && refSlot['includes'](refSlot2) && !map['has'](refSlot2))
      return (map['add'](refSlot2), { ...args, refSlot: refSlot2 });
    const refSlot3 = refSlot['find']((data) => !map['has'](data)) || '';
    if (!refSlot3) return { ...args, refSlot: refSlot['includes'](refSlot2) ? refSlot2 : '' };
    return (map['add'](refSlot3), { ...args, refSlot: refSlot3 });
  });
}
export function doesAudioWorkflowSupportMultipleAudioInputs(options = '') {
  return getAudioWorkflowSlots(options)['length'] >= 2;
}
