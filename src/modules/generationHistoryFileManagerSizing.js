import { getAutoMediaSizeByShortSide, getNodeDefaultSize } from '../services/fileService.js';
function pickPositiveNumber(..._0x5d4498) {
  for (const _0x548751 of _0x5d4498) {
    const _0x54924e = Number(_0x548751 || 0);
    if (Number.isFinite(_0x54924e) && _0x54924e > 0) return _0x54924e;
  }
  return 0;
}
function getSourceMediaNodeNaturalSize(_0x286ef1, _0x24106a) {
  if (!_0x286ef1 || typeof _0x286ef1 !== 'object') return { width: 0, height: 0 };
  if (_0x24106a === 'source-video')
    return {
      width: pickPositiveNumber(
        _0x286ef1.videoWidth,
        _0x286ef1.originalWidth,
        _0x286ef1.imageWidth,
        _0x286ef1.width,
        _0x286ef1.w,
      ),
      height: pickPositiveNumber(
        _0x286ef1.videoHeight,
        _0x286ef1.originalHeight,
        _0x286ef1.imageHeight,
        _0x286ef1.height,
        _0x286ef1.h,
      ),
    };
  if (_0x24106a === 'source-image')
    return {
      width: pickPositiveNumber(
        _0x286ef1.originalWidth,
        _0x286ef1.imageWidth,
        _0x286ef1.videoWidth,
        _0x286ef1.width,
        _0x286ef1.w,
      ),
      height: pickPositiveNumber(
        _0x286ef1.originalHeight,
        _0x286ef1.imageHeight,
        _0x286ef1.videoHeight,
        _0x286ef1.height,
        _0x286ef1.h,
      ),
    };
  return { width: 0, height: 0 };
}
export function normalizeFileManagerSourceNodeForCanvas(_0x2db790 = {}) {
  const _0x30da07 = String(_0x2db790?.type || '').trim();
  if (_0x30da07 !== 'source-image' && _0x30da07 !== 'source-video') return { ..._0x2db790 };
  const _0x8371f4 = getSourceMediaNodeNaturalSize(_0x2db790, _0x30da07),
    _0x53454d =
      _0x8371f4.width > 0 && _0x8371f4.height > 0
        ? getAutoMediaSizeByShortSide(_0x8371f4.width, _0x8371f4.height)
        : getNodeDefaultSize(_0x30da07);
  return { ..._0x2db790, width: _0x53454d.width, height: _0x53454d.height, needsAutoResize: false };
}
