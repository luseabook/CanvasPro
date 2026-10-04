import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
} from '../../services/canvasMediaLocalService.js';
function resolveAiImagePrimaryItem(enabled) {
  if (!enabled || String(enabled.type || '') !== 'ai-image') return null;
  const list = Array.isArray(enabled.images) ? enabled.images : [];
  if (list.length === 0) return null;
  const value = Number(enabled.mainImageIndex),
    item = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  return list[Math.min(item, list.length - 1)] || null;
}
function firstNonEmptyUrl(...args) {
  for (const key of args) {
    const index = String(key || '').trim();
    if (index) return index;
  }
  return '';
}
export function collectRefThumbIds(result) {
  const list2 = [],
    handler = (data) => {
      const enabled2 = String(data || '').trim();
      if (!enabled2 || list2.includes(enabled2)) return;
      list2.push(enabled2);
    },
    aiImagePrimaryItem = resolveAiImagePrimaryItem(result);
  return (handler(result?.thumbId), handler(aiImagePrimaryItem?.thumbId), list2);
}
export function resolveRefImageRenderSources(options, target = {}) {
  const aiImagePrimaryItem2 = resolveAiImagePrimaryItem(options),
    source = String(target?.thumbBlobUrl || '').trim(),
    thumbSrc = firstNonEmptyUrl(
      resolveCanvasImageThumbUrl(options),
      resolveCanvasImageThumbUrl(aiImagePrimaryItem2),
      source,
    ),
    previewSrc = firstNonEmptyUrl(
      resolveCanvasImageDisplayUrl(options),
      resolveCanvasImageSourceUrl(options),
      resolveCanvasImageDisplayUrl(aiImagePrimaryItem2),
      resolveCanvasImageSourceUrl(aiImagePrimaryItem2),
      thumbSrc,
    );
  return { thumbSrc: thumbSrc, previewSrc: previewSrc };
}
export function resolveRefImageCandidateUrls(next) {
  const { thumbSrc: thumbSrc2, previewSrc: previewSrc2 } = resolveRefImageRenderSources(next),
    current = [thumbSrc2, previewSrc2].filter(Boolean);
  return Array.from(new Set(current));
}

function normalizeIdentityPart(entry) {
  return String(entry ?? '')['trim']();
}

function appendImageIdentityFields(record, payload, handle = {}) {
  [
    'assetId',
    'sourceId',
    'thumbId',
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'url',
    'resultUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'fileName',
    'derivativeStatus',
  ]['forEach']((state) => {
    const identityPart = normalizeIdentityPart(handle?.[state]);
    if (identityPart) record['push'](payload + '.' + state + '=' + identityPart);
  });
}

function hashRefImageVersionKey(config = '') {
  const identityPart2 = normalizeIdentityPart(config);
  let scope = 0x1505;
  for (let input = 0x0; input < identityPart2['length']; input += 0x1) {
    ((scope = ((scope << 0x5) + scope) ^ identityPart2['charCodeAt'](input)), (scope >>>= 0x0));
  }
  return scope['toString'](0x24);
}

export function resolveRefImageMediaIdentityKey(output, value2 = {}) {
  const aiImagePrimaryItem3 = resolveAiImagePrimaryItem(output),
    list3 = [
      'node=' + normalizeIdentityPart(output?.['id']),
      'type=' + normalizeIdentityPart(output?.['type']),
      '_bizRev=' + normalizeIdentityPart(output?.['_bizRev']),
      'main=' + normalizeIdentityPart(output?.['mainImageIndex']),
      'edgeSourceMediaKey=' + normalizeIdentityPart(value2?.['sourceMediaKey']),
    ];
  return (
    appendImageIdentityFields(list3, 'node', output),
    appendImageIdentityFields(list3, 'primary', aiImagePrimaryItem3),
    list3['join']('|')
  );
}

export function versionRefImageUrl(value3 = '', value4 = '') {
  const enabled3 = String(value3 || '')['trim'](),
    identityPart3 = normalizeIdentityPart(value4);
  if (!enabled3 || !identityPart3) return enabled3;
  if (/^(?:blob:|data:)/i['test'](enabled3)) return enabled3;
  if (!enabled3['startsWith']('/')) return enabled3;
  const [value5, value6 = ''] = enabled3['split']('#', 0x2),
    value7 = value5['includes']('?') ? '&' : '?',
    hashRefImageVersionKey2 = hashRefImageVersionKey(identityPart3);
  return '' + value5 + value7 + 'aicv=' + hashRefImageVersionKey2 + (value6 ? '#' + value6 : '');
}

export function resolveVersionedRefImageRenderSources(value8, value9 = {}, value10 = {}) {
  const refImageMediaIdentityKey = resolveRefImageMediaIdentityKey(value8, value9),
    { thumbSrc: thumbSrc3, previewSrc: previewSrc3 } = resolveRefImageRenderSources(value8, value10),
    versionRefImageUrl2 = versionRefImageUrl(thumbSrc3, refImageMediaIdentityKey);
  return {
    thumbSrc: versionRefImageUrl2,
    previewSrc: versionRefImageUrl(previewSrc3 || versionRefImageUrl2, refImageMediaIdentityKey),
    mediaIdentityKey: refImageMediaIdentityKey,
  };
}
