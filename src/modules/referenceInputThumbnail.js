import { localPathToUrl } from '../utils/localMediaPath.js';
import { createReferenceFallbackThumbHtml } from './referenceThumbnailFallback.js';
const MEDIA_KINDS = new Set(['text', 'image', 'video', 'audio']);
function normalizeKind(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']();
  return MEDIA_KINDS['has'](item) ? item : '';
}
function normalizeText(key) {
  return String(key || '')['trim']();
}
function escapeHtmlAttr(index) {
  return String(index ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function normalizeClassName(result) {
  return String(result || '')
    ['split'](/\s+/)
    ['map']((data) => data['replace'](/[^A-Za-z0-9_-]/g, ''))
    ['filter'](Boolean)
    ['join']('\x20');
}
function normalizeVideoMediaKey(options) {
  return normalizeText(options)['replace'](/^\/+/, '');
}
function getVideoItemMediaKey(target) {
  return (
    normalizeVideoMediaKey(target?.['localPath']) ||
    normalizeVideoMediaKey(target?.['displayLocalPath']) ||
    normalizeVideoMediaKey(target?.['originalLocalPath']) ||
    normalizeVideoMediaKey(target?.['videoLocalPath']) ||
    normalizeVideoMediaKey(target?.['videoUrl'])
  );
}
function getVideoThumbnailUrl(source) {
  return normalizeText(
    source?.['thumbUrl'] ||
      source?.['thumbnailUrl'] ||
      source?.['firstFrameThumbUrl'] ||
      source?.['firstFrameUrl'] ||
      source?.['imageUrl'],
  );
}
export function resolveReferenceVideoItemByEdge(options2 = {}, next = null) {
  const item2 = Array['isArray'](options2?.['videos']) ? options2['videos'] : [];
  if (!item2['length']) return { item: null, index: -0x1, matchedByKey: ![] };
  const videoMediaKey = normalizeVideoMediaKey(next?.['sourceMediaKey']);
  let index2 = videoMediaKey
    ? item2['findIndex']((current) => getVideoItemMediaKey(current) === videoMediaKey)
    : -0x1;
  const matchedByKey = index2 >= 0x0;
  if (!matchedByKey) {
    const entry = Number(options2?.['mainVideoIndex']),
      record = Number['isFinite'](entry) ? Math['max'](0x0, Math['trunc'](entry)) : 0x0;
    index2 = Math['max'](0x0, Math['min'](item2['length'] - 0x1, record));
  }
  return { item: item2[index2] || null, index: index2, matchedByKey: matchedByKey };
}
export function resolveReferenceVideoThumbnail(options3 = {}, payload = null) {
  const selected = resolveReferenceVideoItemByEdge(options3, payload),
    thumbUrl = getVideoThumbnailUrl(selected['item']);
  if (thumbUrl) return { thumbUrl: thumbUrl, selected: selected };
  const item3 = Array['isArray'](options3?.['videos']) ? options3['videos'] : [],
    handle = Number(options3?.['mainVideoIndex']),
    index3 = item3['length']
      ? Math['max'](
          0x0,
          Math['min'](item3['length'] - 0x1, Number['isFinite'](handle) ? Math['trunc'](handle) : 0x0),
        )
      : -0x1,
    thumbUrl2 = index3 >= 0x0 ? getVideoThumbnailUrl(item3[index3]) : '';
  if (thumbUrl2 && !selected['matchedByKey'])
    return {
      thumbUrl: thumbUrl2,
      selected: { item: item3[index3] || null, index: index3, matchedByKey: ![] },
    };
  const thumbUrl3 = getVideoThumbnailUrl(options3);
  if (thumbUrl3 && (!selected['matchedByKey'] || selected['index'] === index3))
    return { thumbUrl: thumbUrl3, selected: selected };
  return { thumbUrl: '', selected: selected };
}
export function resolveReferenceVideoSourcePath(options4 = {}, state = null) {
  const referenceVideoItemByEdge = resolveReferenceVideoItemByEdge(options4, state),
    config =
      String(options4?.['type'] || '') === 'ai-video'
        ? [
            referenceVideoItemByEdge['item']?.['localPath'],
            referenceVideoItemByEdge['item']?.['displayLocalPath'],
            referenceVideoItemByEdge['item']?.['originalLocalPath'],
            referenceVideoItemByEdge['item']?.['videoLocalPath'],
            referenceVideoItemByEdge['item']?.['videoUrl'],
          ]
        : [
            options4?.['localPath'],
            options4?.['displayLocalPath'],
            options4?.['originalLocalPath'],
            options4?.['videoLocalPath'],
            options4?.['videoUrl'],
            options4?.['src'],
          ];
  for (const scope of config) {
    const url = localPathToUrl(normalizeText(scope));
    if (url) return url;
  }
  return '';
}
export function resolveReferenceVideoMediaSignature(options5 = {}, input = null) {
  const referenceVideoItemByEdge2 = resolveReferenceVideoItemByEdge(options5, input);
  return (
    getVideoItemMediaKey(referenceVideoItemByEdge2['item']) ||
    normalizeVideoMediaKey(options5?.['localPath']) ||
    normalizeVideoMediaKey(options5?.['displayLocalPath']) ||
    normalizeVideoMediaKey(options5?.['originalLocalPath']) ||
    normalizeVideoMediaKey(options5?.['videoLocalPath']) ||
    normalizeVideoMediaKey(options5?.['videoUrl']) ||
    normalizeVideoMediaKey(options5?.['src'])
  );
}
function createMediaFallbackHtml(output, value2) {
  if (output === 'text' || output === 'audio') return createReferenceFallbackThumbHtml(output, value2);
  if (output !== 'image' && output !== 'video') return '';
  const value3 =
    output === 'video'
      ? '<polygon points="8,6 19,12 8,18"></polygon>'
      : '<path d="M5 17l4-4 3 3 2-2 5 5M8.5 9.5h.01"></path>';
  return (
    '<div class="' +
    value2 +
    ' ref-input-thumbnail--fallback" aria-hidden="true"><svg class="ref-input-thumbnail-icon" viewBox="0 0 24 24" focusable="false">' +
    value3 +
    '</svg></div>'
  );
}
export function createReferenceInputThumbnailHtml({
  kind: kind,
  thumbnailUrl: thumbnailUrl = '',
  videoUrl: videoUrl = '',
  extraHtml: extraHtml = '',
  additionalClassName: additionalClassName = '',
} = {}) {
  const kind2 = normalizeKind(kind);
  if (!kind2) return '';
  const value4 = [
      'ref-thumb-media',
      'ref-input-thumbnail',
      'ref-input-thumbnail--' + kind2,
      normalizeClassName(additionalClassName),
    ]
      ['filter'](Boolean)
      ['join']('\x20'),
    text = normalizeText(thumbnailUrl);
  if (!text && kind2 === 'video' && normalizeText(videoUrl))
    return (
      '<video src="' +
      escapeHtmlAttr(videoUrl) +
      '" class="' +
      value4 +
      '\x22\x20muted\x20playsinline\x20preload=\x22metadata\x22\x20draggable=\x22false\x22\x20aria-hidden=\x22true\x22></video>' +
      String(extraHtml || '')
    );
  if (!text) return createMediaFallbackHtml(kind2, value4);
  return (
    '<img src="' +
    escapeHtmlAttr(text) +
    '" class="' +
    value4 +
    '\x20is-pending\x22\x20draggable=\x22false\x22\x20alt=\x22\x22>' +
    String(extraHtml || '')
  );
}
