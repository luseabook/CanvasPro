import { isAdaptiveRatioLabel, pickClosestRatioForProviderModel } from '../../api/imageRatioPolicy.js';
function toPositiveDimension(_0x2c0142) {
  const _0x16dfdd = Number(_0x2c0142);
  return Number['isFinite'](_0x16dfdd) && _0x16dfdd > 0x0 ? _0x16dfdd : 0x0;
}
function pickPositiveDimension(..._0x4349b8) {
  for (const _0x37f097 of _0x4349b8) {
    const _0x3e5681 = toPositiveDimension(_0x37f097);
    if (_0x3e5681 > 0x0) return _0x3e5681;
  }
  return 0x0;
}
export function resolveImageFreeAngleSourceSize(_0x1c4b41 = {}, _0x51611d = null) {
  const _0x14b1e4 = pickPositiveDimension(
      _0x1c4b41?.['originalWidth'],
      _0x1c4b41?.['imageWidth'],
      _0x1c4b41?.['imgWidth'],
      _0x1c4b41?.['naturalWidth'],
      _0x51611d?.['naturalWidth'],
    ),
    _0x44da9b = pickPositiveDimension(
      _0x1c4b41?.['originalHeight'],
      _0x1c4b41?.['imageHeight'],
      _0x1c4b41?.['imgHeight'],
      _0x1c4b41?.['naturalHeight'],
      _0x51611d?.['naturalHeight'],
    );
  return _0x14b1e4 > 0x0 && _0x44da9b > 0x0 ? { width: _0x14b1e4, height: _0x44da9b } : null;
}
export function resolveImageFreeAngleAspectRatio({
  aspectRatio: aspectRatio = '',
  provider: provider = '',
  model: model = '',
  imageSize: imageSize = '',
  sourceSize: sourceSize = null,
} = {}) {
  const _0x272ade = String(aspectRatio || '')['trim']();
  if (!isAdaptiveRatioLabel(_0x272ade)) return _0x272ade;
  return pickClosestRatioForProviderModel({
    provider: provider,
    model: model,
    imageSize: imageSize,
    width: sourceSize?.['width'] || 0x0,
    height: sourceSize?.['height'] || 0x0,
  });
}
