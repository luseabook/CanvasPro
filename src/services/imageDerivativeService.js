import { localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
function firstNonEmptyString(..._0x43a65f) {
  for (const _0x5afbc2 of _0x43a65f) {
    const _0xd4d406 = normalizeLocalPath(_0x5afbc2);
    if (_0xd4d406) return _0xd4d406;
  }
  return '';
}
function toPositiveInt(_0x14730a) {
  const _0x5380bf = Number(_0x14730a);
  if (!Number.isFinite(_0x5380bf) || _0x5380bf <= 0) return 0;
  return Math.max(1, Math.round(_0x5380bf));
}
export function toLocalPathUrl(_0x11449a) {
  return localPathToUrl(_0x11449a);
}
export function normalizeImageDerivativeFields(_0x38efb3 = {}) {
  const _0x1a737e = firstNonEmptyString(_0x38efb3?.localPath),
    _0x3b6db5 = firstNonEmptyString(_0x38efb3?.originalLocalPath, _0x1a737e),
    _0x3671c7 = firstNonEmptyString(_0x38efb3?.displayLocalPath),
    _0x31bb98 = firstNonEmptyString(_0x38efb3?.thumbLocalPath),
    _0xd5f95c = toPositiveInt(_0x38efb3?.originalWidth),
    _0x4bd594 = toPositiveInt(_0x38efb3?.originalHeight);
  return {
    localPath: _0x1a737e,
    originalLocalPath: _0x3b6db5,
    displayLocalPath: _0x3671c7,
    thumbLocalPath: _0x31bb98,
    originalWidth: _0xd5f95c,
    originalHeight: _0x4bd594,
  };
}
export function hasImageDerivativeFields(_0x3c9ad4 = {}) {
  return Boolean(
    firstNonEmptyString(
      _0x3c9ad4?.originalLocalPath,
      _0x3c9ad4?.displayLocalPath,
      _0x3c9ad4?.thumbLocalPath,
    ) ||
    toPositiveInt(_0x3c9ad4?.originalWidth) ||
    toPositiveInt(_0x3c9ad4?.originalHeight),
  );
}
export function needsImageDerivatives(_0x1862bf = {}) {
  const _0x56f760 = normalizeImageDerivativeFields(_0x1862bf),
    _0x55be8b = _0x56f760.originalLocalPath || _0x56f760.localPath;
  if (!_0x55be8b || /\.svg$/i.test(_0x55be8b)) return false;
  return [_0x56f760.displayLocalPath, _0x56f760.thumbLocalPath].some(
    (_0xed7eae) => !_0xed7eae || _0xed7eae === _0x55be8b,
  );
}
export function buildImageNodeStorageFields(_0x541646 = {}) {
  const _0x1c8e63 = normalizeImageDerivativeFields(_0x541646),
    _0x44090a = {
      localPath: _0x1c8e63.localPath || _0x1c8e63.originalLocalPath || '',
      originalLocalPath: _0x1c8e63.originalLocalPath || '',
      displayLocalPath: _0x1c8e63.displayLocalPath || '',
      thumbLocalPath: _0x1c8e63.thumbLocalPath || '',
    };
  return (
    _0x1c8e63.originalWidth > 0 && (_0x44090a.originalWidth = _0x1c8e63.originalWidth),
    _0x1c8e63.originalHeight > 0 && (_0x44090a.originalHeight = _0x1c8e63.originalHeight),
    _0x44090a
  );
}
export function pickCanvasImageLocalPath(_0x3009b6 = {}) {
  const _0x51ec1f = normalizeImageDerivativeFields(_0x3009b6);
  return firstNonEmptyString(
    _0x51ec1f.displayLocalPath,
    _0x51ec1f.originalLocalPath,
    _0x51ec1f.localPath,
    _0x51ec1f.thumbLocalPath,
  );
}
export function pickCanvasThumbLocalPath(_0x455412 = {}) {
  const _0x4fe3ea = normalizeImageDerivativeFields(_0x455412);
  return firstNonEmptyString(
    _0x4fe3ea.thumbLocalPath,
    _0x4fe3ea.displayLocalPath,
    _0x4fe3ea.originalLocalPath,
    _0x4fe3ea.localPath,
  );
}
export function pickPreviewImageLocalPath(_0x7e5ce4 = {}) {
  const _0xd40c57 = normalizeImageDerivativeFields(_0x7e5ce4);
  return firstNonEmptyString(_0xd40c57.originalLocalPath, _0xd40c57.localPath);
}
export function pickPreviewFallbackLocalPath(_0x278e55 = {}) {
  const _0x3768e5 = normalizeImageDerivativeFields(_0x278e55);
  return firstNonEmptyString(_0x3768e5.displayLocalPath, _0x3768e5.thumbLocalPath);
}
