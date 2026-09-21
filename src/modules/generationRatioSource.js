import { getModelManifest } from '../manifests/index.js';
function toPositiveDimension(_0x1c0598) {
  const _0x472b77 = Number(_0x1c0598);
  return Number.isFinite(_0x472b77) && _0x472b77 > 0 ? _0x472b77 : 0;
}
function pickPositiveDimension(..._0x9aeac6) {
  for (const _0x46e494 of _0x9aeac6) {
    const _0x2bf0a9 = toPositiveDimension(_0x46e494);
    if (_0x2bf0a9 > 0) return _0x2bf0a9;
  }
  return 0;
}
function pickIndexedItem(_0x561b89, _0x311a01, _0x2e469e = '') {
  const _0x3050c1 = Array.isArray(_0x561b89) ? _0x561b89 : [];
  if (_0x3050c1.length === 0) return null;
  const _0x4d6a20 = String(_0x2e469e || '').trim();
  if (_0x4d6a20) {
    const _0x56fd8c = _0x3050c1.find((_0x100060) => {
      const _0x57d748 =
        String(_0x100060?.originalLocalPath || '').trim() ||
        String(_0x100060?.localPath || '').trim() ||
        String(_0x100060?.videoUrl || '').trim() ||
        String(_0x100060?.imageUrl || '').trim() ||
        String(_0x100060?.sourceUrl || '').trim() ||
        String(_0x100060?.thumbUrl || '').trim();
      return _0x57d748 === _0x4d6a20;
    });
    if (_0x56fd8c) return _0x56fd8c;
  }
  const _0x16056e = Number(_0x311a01),
    _0xb6a9e0 = Number.isFinite(_0x16056e) ? Math.max(0, Math.trunc(_0x16056e)) : 0;
  return _0x3050c1[Math.min(_0xb6a9e0, _0x3050c1.length - 1)] || null;
}
function normalizeSourceIndex(_0x1a8a5c) {
  const _0x3268cb = Number(_0x1a8a5c);
  return Number.isFinite(_0x3268cb) && _0x3268cb >= 0 ? Math.trunc(_0x3268cb) : null;
}
export function getGenerationDisplayRatioSourceConfig(_0x23aa6f = {}) {
  const _0x935f6c = typeof _0x23aa6f === 'string' ? _0x23aa6f : _0x23aa6f?.model || _0x23aa6f?.modelId,
    _0x1dbfec = getModelManifest(_0x935f6c),
    _0x8f45b8 = _0x1dbfec?.inputSlots?.displayAspectRatioSource;
  if (!_0x8f45b8 || typeof _0x8f45b8 !== 'object' || Array.isArray(_0x8f45b8)) return null;
  const _0x2b579f = Array.from(
      new Set(
        [
          String(_0x8f45b8.slot || _0x8f45b8.refSlot || '').trim(),
          ...(Array.isArray(_0x8f45b8.slots) ? _0x8f45b8.slots : []),
        ]
          .map((_0x1b43e0) => String(_0x1b43e0 || '').trim())
          .filter(Boolean),
      ),
    ),
    _0x308dda = String(_0x8f45b8.kind || '').trim(),
    _0xc9138d = normalizeSourceIndex(_0x8f45b8.inputIndex ?? _0x8f45b8.index),
    _0x3f4008 = normalizeSourceIndex(_0x8f45b8.fallbackIndex ?? _0x8f45b8.inputIndex ?? _0x8f45b8.index);
  if (_0x2b579f.length === 0 && _0xc9138d === null && _0x3f4008 === null) return null;
  return {
    ...(_0x308dda ? { kind: _0x308dda } : {}),
    ...(_0x2b579f.length ? { slot: _0x2b579f[0], slots: _0x2b579f } : {}),
    ...(_0xc9138d !== null ? { inputIndex: _0xc9138d } : {}),
    ...(_0x3f4008 !== null ? { fallbackIndex: _0x3f4008 } : {}),
  };
}
export function pickGenerationRatioSourceEdge(_0x4c5aff = [], _0x2c919c = {}) {
  const _0x4d500b = Array.isArray(_0x4c5aff) ? _0x4c5aff.filter(Boolean) : [];
  if (_0x4d500b.length === 0) return null;
  const _0x2e31a7 = getGenerationDisplayRatioSourceConfig(_0x2c919c);
  if (!_0x2e31a7) return _0x4d500b[0] || null;
  const _0x1cf4bb = Array.isArray(_0x2e31a7.slots) ? _0x2e31a7.slots : _0x2e31a7.slot ? [_0x2e31a7.slot] : [];
  for (const _0x4ea9b8 of _0x1cf4bb) {
    const _0x1bc91d = _0x4d500b.find((_0x2d1e0e) => String(_0x2d1e0e?.refSlot || '').trim() === _0x4ea9b8);
    if (_0x1bc91d) return _0x1bc91d;
  }
  const _0x24b17e = _0x2e31a7.inputIndex !== undefined ? _0x2e31a7.inputIndex : _0x2e31a7.fallbackIndex;
  if (Number.isInteger(_0x24b17e) && _0x24b17e >= 0 && _0x24b17e < _0x4d500b.length)
    return _0x4d500b[_0x24b17e] || null;
  return _0x4d500b[0] || null;
}
function getMainImageItem(_0x550663, _0x4a3698 = null) {
  return pickIndexedItem(_0x550663?.images, _0x550663?.mainImageIndex, _0x4a3698?.sourceMediaKey);
}
function getMainVideoItem(_0x403027, _0x3de8ac = null) {
  return pickIndexedItem(_0x403027?.videos, _0x403027?.mainVideoIndex, _0x3de8ac?.sourceMediaKey);
}
function getDomMediaSizeByNodeId(_0x18422d, _0x5c4b1a = 'img, video') {
  const _0x4cabca =
      typeof document !== 'undefined' && typeof document.getElementById === 'function' && _0x18422d
        ? document.getElementById(_0x18422d)
        : null,
    _0x250b74 = _0x4cabca?.querySelector?.(_0x5c4b1a),
    _0xa74e53 = pickPositiveDimension(_0x250b74?.naturalWidth, _0x250b74?.videoWidth, _0x250b74?.width),
    _0x512115 = pickPositiveDimension(_0x250b74?.naturalHeight, _0x250b74?.videoHeight, _0x250b74?.height);
  return _0xa74e53 > 0 && _0x512115 > 0 ? { width: _0xa74e53, height: _0x512115 } : null;
}
export function getGenerationRatioMediaSize(
  _0x236ba2 = {},
  _0x144398 = null,
  { includeNodeFrame: includeNodeFrame = false } = {},
) {
  const _0xc69036 = getMainImageItem(_0x236ba2, _0x144398),
    _0x25fffb = getMainVideoItem(_0x236ba2, _0x144398),
    _0x5a3865 = pickPositiveDimension(
      _0x144398?.sourceMediaW,
      _0x144398?.sourceWidth,
      _0x144398?.mediaWidth,
      _0xc69036?.originalWidth,
      _0xc69036?.imageWidth,
      _0xc69036?.width,
      _0x25fffb?.videoWidth,
      _0x25fffb?.originalWidth,
      _0x25fffb?.width,
      _0x236ba2?.originalWidth,
      _0x236ba2?.naturalWidth,
      _0x236ba2?.imageWidth,
      _0x236ba2?.selectedVideoWidth,
      _0x236ba2?.videoWidth,
      _0x236ba2?.mediaWidth,
      includeNodeFrame ? _0x236ba2?.width : 0,
    ),
    _0x425309 = pickPositiveDimension(
      _0x144398?.sourceMediaH,
      _0x144398?.sourceHeight,
      _0x144398?.mediaHeight,
      _0xc69036?.originalHeight,
      _0xc69036?.imageHeight,
      _0xc69036?.height,
      _0x25fffb?.videoHeight,
      _0x25fffb?.originalHeight,
      _0x25fffb?.height,
      _0x236ba2?.originalHeight,
      _0x236ba2?.naturalHeight,
      _0x236ba2?.imageHeight,
      _0x236ba2?.selectedVideoHeight,
      _0x236ba2?.videoHeight,
      _0x236ba2?.mediaHeight,
      includeNodeFrame ? _0x236ba2?.height : 0,
    );
  return _0x5a3865 > 0 && _0x425309 > 0 ? { width: _0x5a3865, height: _0x425309 } : null;
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
