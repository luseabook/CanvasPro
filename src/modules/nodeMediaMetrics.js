import { isNodeType } from './registry.js';
export const NODE_MEDIA_DATASET_KEYS = Object.freeze({
  imageW: 'mediaImageW',
  imageH: 'mediaImageH',
  videoW: 'mediaVideoW',
  videoH: 'mediaVideoH',
  videoSrc: 'mediaVideoSrc',
});
function toPositiveNumber(_0x32d370) {
  const _0x5b33c3 = Number(_0x32d370);
  return Number.isFinite(_0x5b33c3) && _0x5b33c3 > 0 ? _0x5b33c3 : 0;
}
function toText(_0xc92ef8) {
  return String(_0xc92ef8 || '').trim();
}
function firstText(..._0x249518) {
  for (const _0x5590b6 of _0x249518) {
    const _0x48c8ef = toText(_0x5590b6);
    if (_0x48c8ef) return _0x48c8ef;
  }
  return '';
}
function pickMainItem(_0x4c586a, _0xa9962e) {
  if (!Array.isArray(_0x4c586a) || _0x4c586a.length === 0) return null;
  const _0x648cc2 = Number(_0xa9962e),
    _0x570d82 = Number.isFinite(_0x648cc2) ? Math.max(0, Math.trunc(_0x648cc2)) : 0;
  return _0x4c586a[_0x570d82] || _0x4c586a[0] || null;
}
function hasImageSource(_0x8b30a2) {
  return !!firstText(
    _0x8b30a2?.localPath,
    _0x8b30a2?.displayLocalPath,
    _0x8b30a2?.originalLocalPath,
    _0x8b30a2?.imageUrl,
    _0x8b30a2?.sourceUrl,
    _0x8b30a2?.thumbLocalPath,
    _0x8b30a2?.thumbUrl,
    _0x8b30a2?.thumbId,
    _0x8b30a2?.src,
    _0x8b30a2?.url,
  );
}
function hasVideoSource(_0x3edbbe) {
  return !!firstText(
    _0x3edbbe?.localPath,
    _0x3edbbe?.displayLocalPath,
    _0x3edbbe?.originalLocalPath,
    _0x3edbbe?.videoLocalPath,
    _0x3edbbe?.videoUrl,
    _0x3edbbe?.resultUrl,
    _0x3edbbe?.sourceUrl,
    _0x3edbbe?.thumbLocalPath,
    _0x3edbbe?.posterLocalPath,
    _0x3edbbe?.thumbUrl,
    _0x3edbbe?.posterUrl,
    _0x3edbbe?.thumbId,
    _0x3edbbe?.src,
    _0x3edbbe?.url,
  );
}
function resolveImageMetrics(_0x31aaa7) {
  if (!_0x31aaa7 || typeof _0x31aaa7 !== 'object') return null;
  if (isNodeType(_0x31aaa7, 'source-image')) {
    if (!hasImageSource(_0x31aaa7)) return null;
    const _0x31d2c0 = toPositiveNumber(_0x31aaa7.imageWidth) || toPositiveNumber(_0x31aaa7.naturalWidth),
      _0x3bc329 = toPositiveNumber(_0x31aaa7.imageHeight) || toPositiveNumber(_0x31aaa7.naturalHeight);
    return _0x31d2c0 > 0 && _0x3bc329 > 0 ? { w: _0x31d2c0, h: _0x3bc329 } : null;
  }
  if (isNodeType(_0x31aaa7, 'ai-image')) {
    const _0x56598f = pickMainItem(_0x31aaa7.images, _0x31aaa7.mainImageIndex) || _0x31aaa7;
    if (!hasImageSource(_0x56598f) && !hasImageSource(_0x31aaa7)) return null;
    const _0x97e531 =
        toPositiveNumber(_0x56598f?.imageWidth) ||
        toPositiveNumber(_0x56598f?.naturalWidth) ||
        toPositiveNumber(_0x56598f?.width) ||
        toPositiveNumber(_0x31aaa7.imageWidth) ||
        toPositiveNumber(_0x31aaa7.naturalWidth),
      _0x2aa402 =
        toPositiveNumber(_0x56598f?.imageHeight) ||
        toPositiveNumber(_0x56598f?.naturalHeight) ||
        toPositiveNumber(_0x56598f?.height) ||
        toPositiveNumber(_0x31aaa7.imageHeight) ||
        toPositiveNumber(_0x31aaa7.naturalHeight);
    return _0x97e531 > 0 && _0x2aa402 > 0 ? { w: _0x97e531, h: _0x2aa402 } : null;
  }
  return null;
}
function resolveVideoMetrics(_0x3c3db3) {
  if (!_0x3c3db3 || typeof _0x3c3db3 !== 'object') return null;
  if (isNodeType(_0x3c3db3, 'source-video')) {
    if (!hasVideoSource(_0x3c3db3)) return null;
    const _0x322931 =
        toPositiveNumber(_0x3c3db3.selectedVideoWidth) ||
        toPositiveNumber(_0x3c3db3.videoWidth) ||
        toPositiveNumber(_0x3c3db3.naturalWidth),
      _0x3c8d1d =
        toPositiveNumber(_0x3c3db3.selectedVideoHeight) ||
        toPositiveNumber(_0x3c3db3.videoHeight) ||
        toPositiveNumber(_0x3c3db3.naturalHeight),
      _0x2f1155 = firstText(
        _0x3c3db3.localPath,
        _0x3c3db3.displayLocalPath,
        _0x3c3db3.videoLocalPath,
        _0x3c3db3.videoUrl,
        _0x3c3db3.src,
        _0x3c3db3.url,
        _0x3c3db3.resultUrl,
      );
    return _0x322931 > 0 && _0x3c8d1d > 0 ? { w: _0x322931, h: _0x3c8d1d, src: _0x2f1155 } : null;
  }
  if (isNodeType(_0x3c3db3, 'ai-video')) {
    const _0x37b598 = pickMainItem(_0x3c3db3.videos, _0x3c3db3.mainVideoIndex) || _0x3c3db3;
    if (!hasVideoSource(_0x37b598) && !hasVideoSource(_0x3c3db3)) return null;
    const _0x194859 =
        toPositiveNumber(_0x3c3db3.selectedVideoWidth) ||
        toPositiveNumber(_0x37b598?.videoWidth) ||
        toPositiveNumber(_0x37b598?.width) ||
        toPositiveNumber(_0x3c3db3.videoWidth) ||
        toPositiveNumber(_0x3c3db3.naturalWidth),
      _0x404fac =
        toPositiveNumber(_0x3c3db3.selectedVideoHeight) ||
        toPositiveNumber(_0x37b598?.videoHeight) ||
        toPositiveNumber(_0x37b598?.height) ||
        toPositiveNumber(_0x3c3db3.videoHeight) ||
        toPositiveNumber(_0x3c3db3.naturalHeight),
      _0x2a9108 = firstText(
        _0x37b598?.localPath,
        _0x37b598?.videoUrl,
        _0x37b598?.url,
        _0x37b598?.resultUrl,
        _0x3c3db3.localPath,
        _0x3c3db3.videoUrl,
        _0x3c3db3.src,
        _0x3c3db3.url,
        _0x3c3db3.resultUrl,
      );
    return _0x194859 > 0 && _0x404fac > 0 ? { w: _0x194859, h: _0x404fac, src: _0x2a9108 } : null;
  }
  return null;
}
export function resolveNodeDisplayedMediaMetrics(_0x2bf26e) {
  return { image: resolveImageMetrics(_0x2bf26e), video: resolveVideoMetrics(_0x2bf26e) };
}
function writeSize(_0x250856, _0x218826, _0x46592b, _0x5d8ce7) {
  _0x5d8ce7?.w > 0 && _0x5d8ce7?.h > 0
    ? ((_0x250856[_0x218826] = String(Math.round(_0x5d8ce7.w))),
      (_0x250856[_0x46592b] = String(Math.round(_0x5d8ce7.h))))
    : (delete _0x250856[_0x218826], delete _0x250856[_0x46592b]);
}
export function syncNodeMediaMetricsDataset(_0x474ace, _0x37f17b) {
  const _0x4eefb6 = _0x474ace?.dataset;
  if (!_0x4eefb6) return;
  const _0x52a183 = resolveNodeDisplayedMediaMetrics(_0x37f17b);
  (writeSize(_0x4eefb6, NODE_MEDIA_DATASET_KEYS.imageW, NODE_MEDIA_DATASET_KEYS.imageH, _0x52a183.image),
    writeSize(_0x4eefb6, NODE_MEDIA_DATASET_KEYS.videoW, NODE_MEDIA_DATASET_KEYS.videoH, _0x52a183.video),
    _0x52a183.video?.src
      ? (_0x4eefb6[NODE_MEDIA_DATASET_KEYS.videoSrc] = _0x52a183.video.src)
      : delete _0x4eefb6[NODE_MEDIA_DATASET_KEYS.videoSrc]);
}
export function readNodeMediaMetricsDataset(_0x5c245e, _0x1b2d96) {
  const _0x51a80a = _0x5c245e?.dataset;
  if (!_0x51a80a) return null;
  const _0x2fa500 = NODE_MEDIA_DATASET_KEYS,
    _0x130a32 = String(_0x1b2d96 || '') === 'video',
    _0x448020 = toPositiveNumber(_0x51a80a[_0x130a32 ? _0x2fa500.videoW : _0x2fa500.imageW]),
    _0x43c43d = toPositiveNumber(_0x51a80a[_0x130a32 ? _0x2fa500.videoH : _0x2fa500.imageH]);
  if (!(_0x448020 > 0 && _0x43c43d > 0)) return null;
  return { w: _0x448020, h: _0x43c43d, src: _0x130a32 ? toText(_0x51a80a[_0x2fa500.videoSrc]) : '' };
}
