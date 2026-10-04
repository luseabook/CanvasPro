import { getModelManifest } from '../manifests/index.js';
function toPositiveDimension(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function pickPositiveDimension(...args) {
  for (const item of args) {
    const toPositiveDimension2 = toPositiveDimension(item);
    if (toPositiveDimension2 > 0) return toPositiveDimension2;
  }
  return 0;
}
function pickIndexedItem(key, index, result = '') {
  const list = Array.isArray(key) ? key : [];
  if (list.length === 0) return null;
  const data = String(result || '').trim();
  if (data) {
    const options = list.find((item2) => {
      const target =
        String(item2?.originalLocalPath || '').trim() ||
        String(item2?.localPath || '').trim() ||
        String(item2?.videoUrl || '').trim() ||
        String(item2?.imageUrl || '').trim() ||
        String(item2?.sourceUrl || '').trim() ||
        String(item2?.thumbUrl || '').trim();
      return target === data;
    });
    if (options) return options;
  }
  const source = Number(index),
    next = Number.isFinite(source) ? Math.max(0, Math.trunc(source)) : 0;
  return list[Math.min(next, list.length - 1)] || null;
}
function normalizeSourceIndex(current) {
  const count2 = Number(current);
  return Number.isFinite(count2) && count2 >= 0 ? Math.trunc(count2) : null;
}
export function getGenerationDisplayRatioSourceConfig(options2 = {}) {
  const entry = typeof options2 === 'string' ? options2 : options2?.model || options2?.modelId,
    modelManifest = getModelManifest(entry),
    enabled = modelManifest?.inputSlots?.displayAspectRatioSource;
  if (!enabled || typeof enabled !== 'object' || Array.isArray(enabled)) return null;
  const slot = Array.from(
      new Set(
        [
          String(enabled.slot || enabled.refSlot || '').trim(),
          ...(Array.isArray(enabled.slots) ? enabled.slots : []),
        ]
          .map((item3) => String(item3 || '').trim())
          .filter(Boolean),
      ),
    ),
    kind = String(enabled.kind || '').trim(),
    inputIndex = normalizeSourceIndex(enabled.inputIndex ?? enabled.index),
    fallbackIndex = normalizeSourceIndex(enabled.fallbackIndex ?? enabled.inputIndex ?? enabled.index);
  if (slot.length === 0 && inputIndex === null && fallbackIndex === null) return null;
  return {
    ...(kind ? { kind: kind } : {}),
    ...(slot.length ? { slot: slot[0], slots: slot } : {}),
    ...(inputIndex !== null ? { inputIndex: inputIndex } : {}),
    ...(fallbackIndex !== null ? { fallbackIndex: fallbackIndex } : {}),
  };
}
export function pickGenerationRatioSourceEdge(list2 = [], record = {}) {
  const list3 = Array.isArray(list2) ? list2.filter(Boolean) : [];
  if (list3.length === 0) return null;
  const generationDisplayRatioSourceConfig = getGenerationDisplayRatioSourceConfig(record);
  if (!generationDisplayRatioSourceConfig) return list3[0] || null;
  const payload = Array.isArray(generationDisplayRatioSourceConfig.slots)
    ? generationDisplayRatioSourceConfig.slots
    : generationDisplayRatioSourceConfig.slot
      ? [generationDisplayRatioSourceConfig.slot]
      : [];
  for (const handle of payload) {
    const state = list3.find((item4) => String(item4?.refSlot || '').trim() === handle);
    if (state) return state;
  }
  const count3 =
    generationDisplayRatioSourceConfig.inputIndex !== undefined
      ? generationDisplayRatioSourceConfig.inputIndex
      : generationDisplayRatioSourceConfig.fallbackIndex;
  if (Number.isInteger(count3) && count3 >= 0 && count3 < list3.length) return list3[count3] || null;
  return list3[0] || null;
}
function getMainImageItem(config, scope = null) {
  return pickIndexedItem(config?.images, config?.mainImageIndex, scope?.sourceMediaKey);
}
function getMainVideoItem(input, output = null) {
  return pickIndexedItem(input?.videos, input?.mainVideoIndex, output?.sourceMediaKey);
}
function getDomMediaSizeByNodeId(value2, value3 = 'img, video') {
  const el =
      typeof document !== 'undefined' && typeof document.getElementById === 'function' && value2
        ? document.getElementById(value2)
        : null,
    box = el?.querySelector?.(value3),
    width = pickPositiveDimension(box?.naturalWidth, box?.videoWidth, box?.width),
    height = pickPositiveDimension(box?.naturalHeight, box?.videoHeight, box?.height);
  return width > 0 && height > 0 ? { width: width, height: height } : null;
}
export function getGenerationRatioMediaSize(
  box2 = {},
  value4 = null,
  { includeNodeFrame: includeNodeFrame = false } = {},
) {
  const box3 = getMainImageItem(box2, value4),
    box4 = getMainVideoItem(box2, value4),
    width2 = pickPositiveDimension(
      value4?.sourceMediaW,
      value4?.sourceWidth,
      value4?.mediaWidth,
      box3?.originalWidth,
      box3?.imageWidth,
      box3?.width,
      box4?.videoWidth,
      box4?.originalWidth,
      box4?.width,
      box2?.originalWidth,
      box2?.naturalWidth,
      box2?.imageWidth,
      box2?.selectedVideoWidth,
      box2?.videoWidth,
      box2?.mediaWidth,
      includeNodeFrame ? box2?.width : 0,
    ),
    height2 = pickPositiveDimension(
      value4?.sourceMediaH,
      value4?.sourceHeight,
      value4?.mediaHeight,
      box3?.originalHeight,
      box3?.imageHeight,
      box3?.height,
      box4?.videoHeight,
      box4?.originalHeight,
      box4?.height,
      box2?.originalHeight,
      box2?.naturalHeight,
      box2?.imageHeight,
      box2?.selectedVideoHeight,
      box2?.videoHeight,
      box2?.mediaHeight,
      includeNodeFrame ? box2?.height : 0,
    );
  return width2 > 0 && height2 > 0 ? { width: width2, height: height2 } : null;
}
export function getGenerationRatioSizeWithDom({
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  edge: edge = null,
  mediaSelector: mediaSelector = 'img, video',
  includeNodeFrame: includeNodeFrame = false,
} = {}) {
  return (
    getGenerationRatioMediaSize(nodeData, edge, { includeNodeFrame: false }) ||
    getDomMediaSizeByNodeId(nodeId || nodeData?.id, mediaSelector) ||
    getGenerationRatioMediaSize(nodeData, edge, { includeNodeFrame: includeNodeFrame })
  );
}
export function getGenerationMediaItemSize(options3 = {}) {
  const box5 = options3 && typeof options3 === 'object' ? options3 : {},
    box6 = box5['metadata'] && typeof box5['metadata'] === 'object' ? box5['metadata'] : {},
    width3 = pickPositiveDimension(
      box5['originalWidth'],
      box5['imageWidth'],
      box5['videoWidth'],
      box5['naturalWidth'],
      box5['mediaWidth'],
      box5['width'],
      box6['originalWidth'],
      box6['imageWidth'],
      box6['videoWidth'],
      box6['width'],
    ),
    height3 = pickPositiveDimension(
      box5['originalHeight'],
      box5['imageHeight'],
      box5['videoHeight'],
      box5['naturalHeight'],
      box5['mediaHeight'],
      box5['height'],
      box6['originalHeight'],
      box6['imageHeight'],
      box6['videoHeight'],
      box6['height'],
    );
  return width3 > 0x0 && height3 > 0x0 ? { width: width3, height: height3 } : null;
}

export function pickGenerationRatioSourceInput(options4 = {}, value5 = {}) {
  const value6 = options4 && typeof options4 === 'object' && !Array['isArray'](options4) ? options4 : {},
    list4 = ['image', 'video']['flatMap']((kind2) => {
      const value7 = value6[kind2] ?? value6[kind2 + 's'] ?? [],
        list5 = Array['isArray'](value7) ? value7 : value7 ? [value7] : [];
      return list5['filter'](Boolean)['map']((item5) => ({ item: item5, kind: kind2 }));
    });
  if (list4['length'] === 0x0) return null;
  const generationDisplayRatioSourceConfig2 = getGenerationDisplayRatioSourceConfig(value5),
    list6 = generationDisplayRatioSourceConfig2?.['kind']
      ? list4['filter'](({ kind: kind3 }) => kind3 === generationDisplayRatioSourceConfig2['kind'])
      : list4,
    list7 = list6['length'] > 0x0 ? list6 : list4,
    value8 = Array['isArray'](generationDisplayRatioSourceConfig2?.['slots'])
      ? generationDisplayRatioSourceConfig2['slots']
      : generationDisplayRatioSourceConfig2?.['slot']
        ? [generationDisplayRatioSourceConfig2['slot']]
        : [];
  for (const value9 of value8) {
    const value10 = list7['find'](
      ({ item: item6 }) => String(item6?.['slotId'] || item6?.['refSlot'] || '')['trim']() === value9,
    );
    if (value10) return value10['item'];
  }
  const count4 =
    generationDisplayRatioSourceConfig2?.['inputIndex'] !== undefined
      ? generationDisplayRatioSourceConfig2['inputIndex']
      : generationDisplayRatioSourceConfig2?.['fallbackIndex'];
  if (Number['isInteger'](count4) && count4 >= 0x0 && count4 < list7['length'])
    return list7[count4]?.['item'] || null;
  return list7[0x0]?.['item'] || null;
}

export function getGenerationInputRatioMediaSize(options5 = {}, value11 = {}) {
  return getGenerationMediaItemSize(pickGenerationRatioSourceInput(options5, value11));
}
