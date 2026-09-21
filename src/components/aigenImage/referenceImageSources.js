import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
} from '../../services/canvasMediaLocalService.js';
function resolveAiImagePrimaryItem(_0x297f40) {
  if (!_0x297f40 || String(_0x297f40.type || '') !== 'ai-image') return null;
  const _0x1945e7 = Array.isArray(_0x297f40.images) ? _0x297f40.images : [];
  if (_0x1945e7.length === 0) return null;
  const _0x247a24 = Number(_0x297f40.mainImageIndex),
    _0x12a431 = Number.isFinite(_0x247a24) ? Math.max(0, Math.trunc(_0x247a24)) : 0;
  return _0x1945e7[Math.min(_0x12a431, _0x1945e7.length - 1)] || null;
}
function firstNonEmptyUrl(..._0x3ed34c) {
  for (const _0x260620 of _0x3ed34c) {
    const _0x1c779d = String(_0x260620 || '').trim();
    if (_0x1c779d) return _0x1c779d;
  }
  return '';
}
export function collectRefThumbIds(_0x277390) {
  const _0x3e1c16 = [],
    _0x50543b = (_0x2cc86c) => {
      const _0x555c22 = String(_0x2cc86c || '').trim();
      if (!_0x555c22 || _0x3e1c16.includes(_0x555c22)) return;
      _0x3e1c16.push(_0x555c22);
    },
    _0x415b1b = resolveAiImagePrimaryItem(_0x277390);
  return (_0x50543b(_0x277390?.thumbId), _0x50543b(_0x415b1b?.thumbId), _0x3e1c16);
}
export function resolveRefImageRenderSources(_0x16737a, _0x373e85 = {}) {
  const _0x3591dc = resolveAiImagePrimaryItem(_0x16737a),
    _0x19866e = String(_0x373e85?.thumbBlobUrl || '').trim(),
    _0x1884af = firstNonEmptyUrl(
      resolveCanvasImageThumbUrl(_0x16737a),
      resolveCanvasImageThumbUrl(_0x3591dc),
      _0x19866e,
    ),
    _0x5e9f8d = firstNonEmptyUrl(
      resolveCanvasImageDisplayUrl(_0x16737a),
      resolveCanvasImageSourceUrl(_0x16737a),
      resolveCanvasImageDisplayUrl(_0x3591dc),
      resolveCanvasImageSourceUrl(_0x3591dc),
      _0x1884af,
    );
  return { thumbSrc: _0x1884af, previewSrc: _0x5e9f8d };
}
export function resolveRefImageCandidateUrls(_0x48888b) {
  const { thumbSrc: _0x353847, previewSrc: _0x4801c2 } = resolveRefImageRenderSources(_0x48888b),
    _0x1a1de7 = [_0x353847, _0x4801c2].filter(Boolean);
  return Array.from(new Set(_0x1a1de7));
}
