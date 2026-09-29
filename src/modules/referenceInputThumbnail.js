import { localPathToUrl } from '../utils/localMediaPath.js';
import { createReferenceFallbackThumbHtml } from './referenceThumbnailFallback.js';
const MEDIA_KINDS = new Set(['text', 'image', 'video', 'audio']);
function normalizeKind(_0x36f9bf) {
  const _0x115f5e = String(_0x36f9bf || '')
    ['trim']()
    ['toLowerCase']();
  return MEDIA_KINDS['has'](_0x115f5e) ? _0x115f5e : '';
}
function normalizeText(_0x29ac90) {
  return String(_0x29ac90 || '')['trim']();
}
function escapeHtmlAttr(_0x1d62ab) {
  return String(_0x1d62ab ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function normalizeClassName(_0x45bfaf) {
  return String(_0x45bfaf || '')
    ['split'](/\s+/)
    ['map']((_0x29bd3c) => _0x29bd3c['replace'](/[^A-Za-z0-9_-]/g, ''))
    ['filter'](Boolean)
    ['join']('\x20');
}
function normalizeVideoMediaKey(_0xa063dd) {
  return normalizeText(_0xa063dd)['replace'](/^\/+/, '');
}
function getVideoItemMediaKey(_0x1471f0) {
  return (
    normalizeVideoMediaKey(_0x1471f0?.['localPath']) ||
    normalizeVideoMediaKey(_0x1471f0?.['displayLocalPath']) ||
    normalizeVideoMediaKey(_0x1471f0?.['originalLocalPath']) ||
    normalizeVideoMediaKey(_0x1471f0?.['videoLocalPath']) ||
    normalizeVideoMediaKey(_0x1471f0?.['videoUrl'])
  );
}
function getVideoThumbnailUrl(_0x49a8b0) {
  return normalizeText(
    _0x49a8b0?.['thumbUrl'] ||
      _0x49a8b0?.['thumbnailUrl'] ||
      _0x49a8b0?.['firstFrameThumbUrl'] ||
      _0x49a8b0?.['firstFrameUrl'] ||
      _0x49a8b0?.['imageUrl'],
  );
}
export function resolveReferenceVideoItemByEdge(_0x695cfd = {}, _0x447963 = null) {
  const _0x4063de = Array['isArray'](_0x695cfd?.['videos']) ? _0x695cfd['videos'] : [];
  if (!_0x4063de['length']) return { item: null, index: -0x1, matchedByKey: ![] };
  const _0x12851d = normalizeVideoMediaKey(_0x447963?.['sourceMediaKey']);
  let _0x2a34a5 = _0x12851d
    ? _0x4063de['findIndex']((_0xd687da) => getVideoItemMediaKey(_0xd687da) === _0x12851d)
    : -0x1;
  const _0x1a3a17 = _0x2a34a5 >= 0x0;
  if (!_0x1a3a17) {
    const _0x4f941b = Number(_0x695cfd?.['mainVideoIndex']),
      _0x15ac75 = Number['isFinite'](_0x4f941b) ? Math['max'](0x0, Math['trunc'](_0x4f941b)) : 0x0;
    _0x2a34a5 = Math['max'](0x0, Math['min'](_0x4063de['length'] - 0x1, _0x15ac75));
  }
  return { item: _0x4063de[_0x2a34a5] || null, index: _0x2a34a5, matchedByKey: _0x1a3a17 };
}
export function resolveReferenceVideoThumbnail(_0x574f76 = {}, _0x54ad63 = null) {
  const _0x375020 = resolveReferenceVideoItemByEdge(_0x574f76, _0x54ad63),
    _0x179315 = getVideoThumbnailUrl(_0x375020['item']);
  if (_0x179315) return { thumbUrl: _0x179315, selected: _0x375020 };
  const _0x18eb30 = Array['isArray'](_0x574f76?.['videos']) ? _0x574f76['videos'] : [],
    _0x194f57 = Number(_0x574f76?.['mainVideoIndex']),
    _0x139a9f = _0x18eb30['length']
      ? Math['max'](
          0x0,
          Math['min'](
            _0x18eb30['length'] - 0x1,
            Number['isFinite'](_0x194f57) ? Math['trunc'](_0x194f57) : 0x0,
          ),
        )
      : -0x1,
    _0x47df9e = _0x139a9f >= 0x0 ? getVideoThumbnailUrl(_0x18eb30[_0x139a9f]) : '';
  if (_0x47df9e && !_0x375020['matchedByKey'])
    return {
      thumbUrl: _0x47df9e,
      selected: { item: _0x18eb30[_0x139a9f] || null, index: _0x139a9f, matchedByKey: ![] },
    };
  const _0x5b8234 = getVideoThumbnailUrl(_0x574f76);
  if (_0x5b8234 && (!_0x375020['matchedByKey'] || _0x375020['index'] === _0x139a9f))
    return { thumbUrl: _0x5b8234, selected: _0x375020 };
  return { thumbUrl: '', selected: _0x375020 };
}
export function resolveReferenceVideoSourcePath(_0x4015d6 = {}, _0x3647ac = null) {
  const _0x52f7ba = resolveReferenceVideoItemByEdge(_0x4015d6, _0x3647ac),
    _0x16c7d2 =
      String(_0x4015d6?.['type'] || '') === 'ai-video'
        ? [
            _0x52f7ba['item']?.['localPath'],
            _0x52f7ba['item']?.['displayLocalPath'],
            _0x52f7ba['item']?.['originalLocalPath'],
            _0x52f7ba['item']?.['videoLocalPath'],
            _0x52f7ba['item']?.['videoUrl'],
          ]
        : [
            _0x4015d6?.['localPath'],
            _0x4015d6?.['displayLocalPath'],
            _0x4015d6?.['originalLocalPath'],
            _0x4015d6?.['videoLocalPath'],
            _0x4015d6?.['videoUrl'],
            _0x4015d6?.['src'],
          ];
  for (const _0x2ae7b0 of _0x16c7d2) {
    const _0x1128eb = localPathToUrl(normalizeText(_0x2ae7b0));
    if (_0x1128eb) return _0x1128eb;
  }
  return '';
}
export function resolveReferenceVideoMediaSignature(_0x29f4b8 = {}, _0x895b50 = null) {
  const _0x480e80 = resolveReferenceVideoItemByEdge(_0x29f4b8, _0x895b50);
  return (
    getVideoItemMediaKey(_0x480e80['item']) ||
    normalizeVideoMediaKey(_0x29f4b8?.['localPath']) ||
    normalizeVideoMediaKey(_0x29f4b8?.['displayLocalPath']) ||
    normalizeVideoMediaKey(_0x29f4b8?.['originalLocalPath']) ||
    normalizeVideoMediaKey(_0x29f4b8?.['videoLocalPath']) ||
    normalizeVideoMediaKey(_0x29f4b8?.['videoUrl']) ||
    normalizeVideoMediaKey(_0x29f4b8?.['src'])
  );
}
function createMediaFallbackHtml(_0x856536, _0x3b63bb) {
  if (_0x856536 === 'text' || _0x856536 === 'audio')
    return createReferenceFallbackThumbHtml(_0x856536, _0x3b63bb);
  if (_0x856536 !== 'image' && _0x856536 !== 'video') return '';
  const _0x32a837 =
    _0x856536 === 'video'
      ? '<polygon points="8,6 19,12 8,18"></polygon>'
      : '<path d="M5 17l4-4 3 3 2-2 5 5M8.5 9.5h.01"></path>';
  return (
    '<div class="' +
    _0x3b63bb +
    ' ref-input-thumbnail--fallback" aria-hidden="true"><svg class="ref-input-thumbnail-icon" viewBox="0 0 24 24" focusable="false">' +
    _0x32a837 +
    '</svg></div>'
  );
}
export function createReferenceInputThumbnailHtml({
  kind: _0x31a3f7,
  thumbnailUrl: thumbnailUrl = '',
  videoUrl: videoUrl = '',
  extraHtml: extraHtml = '',
  additionalClassName: additionalClassName = '',
} = {}) {
  const _0x11af07 = normalizeKind(_0x31a3f7);
  if (!_0x11af07) return '';
  const _0x38bc9a = [
      'ref-thumb-media',
      'ref-input-thumbnail',
      'ref-input-thumbnail--' + _0x11af07,
      normalizeClassName(additionalClassName),
    ]
      ['filter'](Boolean)
      ['join']('\x20'),
    _0x3d5261 = normalizeText(thumbnailUrl);
  if (!_0x3d5261 && _0x11af07 === 'video' && normalizeText(videoUrl))
    return (
      '<video src="' +
      escapeHtmlAttr(videoUrl) +
      '" class="' +
      _0x38bc9a +
      '\x22\x20muted\x20playsinline\x20preload=\x22metadata\x22\x20draggable=\x22false\x22\x20aria-hidden=\x22true\x22></video>' +
      String(extraHtml || '')
    );
  if (!_0x3d5261) return createMediaFallbackHtml(_0x11af07, _0x38bc9a);
  return (
    '<img src="' +
    escapeHtmlAttr(_0x3d5261) +
    '" class="' +
    _0x38bc9a +
    '\x20is-pending\x22\x20draggable=\x22false\x22\x20alt=\x22\x22>' +
    String(extraHtml || '')
  );
}
