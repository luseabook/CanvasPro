import { resolveCanvasImagePreviewUrl, resolveCanvasImageThumbUrl } from './canvasMediaLocalService.js';
function pickResultItem(_0x3bbf7d, _0x462604) {
  if (!Array.isArray(_0x3bbf7d) || _0x3bbf7d.length === 0) return null;
  const _0x4426b0 = Number(_0x462604),
    _0x8fac4e = Number.isFinite(_0x4426b0) ? Math.max(0, Math.trunc(_0x4426b0)) : 0;
  return _0x3bbf7d[Math.min(_0x8fac4e, _0x3bbf7d.length - 1)] || null;
}
function firstNonEmptyUrl(..._0x3e16cd) {
  for (const _0x1739b5 of _0x3e16cd) {
    const _0x1c5b8f = String(_0x1739b5 || '').trim();
    if (_0x1c5b8f) return _0x1c5b8f;
  }
  return '';
}
function normalizeRemoteHttpImageUrl(_0x43ebe5) {
  const _0x5bb41b = String(_0x43ebe5 || '').trim();
  if (!_0x5bb41b) return '';
  try {
    const _0x4ae650 = new URL(_0x5bb41b);
    if (_0x4ae650.protocol !== 'http:' && _0x4ae650.protocol !== 'https:') return '';
    return ((_0x4ae650.username = ''), (_0x4ae650.password = ''), _0x4ae650.href);
  } catch {
    return '';
  }
}
function resolvePendingWebImageUrl(_0x5cd3a9) {
  const _0x3b8ef0 = normalizeRemoteHttpImageUrl(_0x5cd3a9?.webSourceUrl),
    _0xeaa1d = normalizeRemoteHttpImageUrl(_0x5cd3a9?.capturePreviewUrl);
  if (_0xeaa1d && (!_0x3b8ef0 || _0xeaa1d === _0x3b8ef0)) return _0xeaa1d;
  return _0x3b8ef0;
}
export function resolveGenerationInputImageUrl(_0x18ec61) {
  if (!_0x18ec61 || typeof _0x18ec61 !== 'object') return '';
  if (String(_0x18ec61.type || '') === 'ai-image') {
    const _0x15feed = pickResultItem(_0x18ec61.images, _0x18ec61.mainImageIndex);
    return firstNonEmptyUrl(
      resolveCanvasImagePreviewUrl(_0x15feed),
      resolveCanvasImagePreviewUrl(_0x18ec61),
      resolveCanvasImageThumbUrl(_0x15feed),
      resolveCanvasImageThumbUrl(_0x18ec61),
      resolvePendingWebImageUrl(_0x15feed),
      resolvePendingWebImageUrl(_0x18ec61),
    );
  }
  return firstNonEmptyUrl(
    resolveCanvasImagePreviewUrl(_0x18ec61),
    resolveCanvasImageThumbUrl(_0x18ec61),
    resolvePendingWebImageUrl(_0x18ec61),
  );
}
