import { getAutoMediaSizeByShortSide } from './fileService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
export const OUTPUT_RATIO_SWITCH_THRESHOLD = 0.03;
function _toSafeNumber(_0x1113d3) {
  const _0x555d27 = Number(_0x1113d3);
  return Number.isFinite(_0x555d27) ? _0x555d27 : 0;
}
function _normalizeDims(_0x24f436, _0x4feb1d) {
  const _0x4c5225 = _toSafeNumber(_0x24f436),
    _0xe4e9d8 = _toSafeNumber(_0x4feb1d);
  if (_0x4c5225 <= 0 || _0xe4e9d8 <= 0) return null;
  return { width: Math.max(1, Math.round(_0x4c5225)), height: Math.max(1, Math.round(_0xe4e9d8)) };
}
export function resolveInputRatioBasis(..._0x1386c3) {
  for (const _0x46febe of _0x1386c3) {
    if (!_0x46febe || typeof _0x46febe !== 'object') continue;
    const _0x249eab = _normalizeDims(_0x46febe.width, _0x46febe.height);
    if (_0x249eab) return { ..._0x249eab, valid: true };
  }
  return { width: 1, height: 1, valid: false };
}
export function calcDisplaySizeByMedia(_0x3b36bc, _0x19258b) {
  const _0xd1aad4 = resolveInputRatioBasis({ width: _0x3b36bc, height: _0x19258b });
  return getAutoMediaSizeByShortSide(_0xd1aad4.width, _0xd1aad4.height);
}
export function shouldSwitchToOutputRatio(
  _0x42b1f2,
  _0x4d7c86,
  _0x45efc9,
  _0x2e7b46,
  _0x478319 = OUTPUT_RATIO_SWITCH_THRESHOLD,
) {
  const _0x4d1977 = _normalizeDims(_0x42b1f2, _0x4d7c86),
    _0x5995c2 = _normalizeDims(_0x45efc9, _0x2e7b46),
    _0x4a8bcb = Math.max(0, _toSafeNumber(_0x478319));
  if (!_0x4d1977 || !_0x5995c2) return false;
  const _0x151b69 = _0x4d1977.width / _0x4d1977.height,
    _0x3b8b24 = _0x5995c2.width / _0x5995c2.height;
  if (!Number.isFinite(_0x151b69) || !Number.isFinite(_0x3b8b24) || _0x151b69 <= 0) return false;
  const _0x157e9d = Math.abs(_0x3b8b24 - _0x151b69) / _0x151b69;
  return _0x157e9d > _0x4a8bcb;
}
export function normalizePathToLocalUrl(_0x365279) {
  const _0x230ca1 = String(_0x365279 || '').trim();
  if (!_0x230ca1) return '';
  if (
    _0x230ca1.startsWith('http://') ||
    _0x230ca1.startsWith('https://') ||
    _0x230ca1.startsWith('blob:') ||
    _0x230ca1.startsWith('data:')
  )
    return _0x230ca1;
  return localPathToUrl(_0x230ca1);
}
export async function readImageNaturalSize(_0x1710b6) {
  const _0x47b1f1 = String(_0x1710b6 || '').trim();
  if (!_0x47b1f1) return null;
  if (typeof Image === 'undefined') return null;
  return new Promise((_0x475873) => {
    const _0x515c03 = new Image();
    ((_0x515c03.crossOrigin = 'anonymous'),
      (_0x515c03.onload = () => {
        const _0x472652 = _normalizeDims(
          _0x515c03.naturalWidth || _0x515c03.width,
          _0x515c03.naturalHeight || _0x515c03.height,
        );
        _0x475873(_0x472652);
      }),
      (_0x515c03.onerror = () => _0x475873(null)),
      (_0x515c03.src = _0x47b1f1));
  });
}
export async function resolveOutputMediaSize({
  localPath: localPath = '',
  imageUrl: imageUrl = '',
  sourceUrl: sourceUrl = '',
  thumbUrl: thumbUrl = '',
  src: src = '',
} = {}) {
  const _0xd01bcd = normalizePathToLocalUrl(localPath),
    _0xf1cc23 = [
      _0xd01bcd,
      String(imageUrl || '').trim(),
      String(sourceUrl || '').trim(),
      String(thumbUrl || '').trim(),
      String(src || '').trim(),
    ].filter(Boolean);
  for (const _0x3530c1 of _0xf1cc23) {
    const _0x2d7c7d = await readImageNaturalSize(_0x3530c1);
    if (_0x2d7c7d) return _0x2d7c7d;
  }
  return null;
}
