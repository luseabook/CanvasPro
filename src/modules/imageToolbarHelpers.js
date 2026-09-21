import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  readImageNaturalSize,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from '../services/mediaRatioService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
export const RATIO_SWITCH_THRESHOLD = OUTPUT_RATIO_SWITCH_THRESHOLD;
export function normalizeLocalPathText(_0x5528aa) {
  return normalizeLocalPath(_0x5528aa);
}
export function resolveGridCropImageRef(_0x4e41f4) {
  const _0x4649ea = normalizeLocalPathText(
      _0x4e41f4?.localPath ||
        (_0x4e41f4?.images && _0x4e41f4.images[_0x4e41f4.mainImageIndex || 0]?.localPath),
    ),
    _0x1c7849 = _0x4649ea ? localPathToUrl(_0x4649ea) : _0x4e41f4?.src || _0x4e41f4?.sourceUrl || '';
  return { localPath: _0x4649ea, imgUrl: _0x1c7849 };
}
export function toPositiveInt(_0x3c7a69, _0x33460a = 0) {
  const _0x56771f = Number(_0x3c7a69);
  if (!Number.isFinite(_0x56771f) || _0x56771f <= 0) return _0x33460a;
  return Math.max(1, Math.round(_0x56771f));
}
export function normalizeGridTileResult(_0x39f7fb = {}, _0x2c8f03 = {}) {
  const _0xd2b285 = pickResultLocalPath(_0x39f7fb),
    _0x43d231 = normalizeLocalPathText(_0x39f7fb.originalLocalPath || _0xd2b285),
    _0x56e38f = normalizeLocalPathText(_0x39f7fb.displayLocalPath),
    _0x45c50b = normalizeLocalPathText(_0x39f7fb.thumbLocalPath),
    _0x339793 = localPathToUrl(_0xd2b285) || String(_0x39f7fb.url || '').trim(),
    _0x2f9fff = toPositiveInt(_0x39f7fb.w || _0x39f7fb.width || _0x39f7fb.originalWidth, _0x2c8f03.w),
    _0x15ab01 = toPositiveInt(_0x39f7fb.h || _0x39f7fb.height || _0x39f7fb.originalHeight, _0x2c8f03.h);
  return {
    ..._0x39f7fb,
    url: _0x339793,
    localPath: _0xd2b285,
    originalLocalPath: _0x43d231,
    displayLocalPath: _0x56e38f,
    thumbLocalPath: _0x45c50b,
    fileName: _0x39f7fb.filename || _0x39f7fb.fileName || _0x2c8f03.fileName || '',
    w: _0x2f9fff,
    h: _0x15ab01,
    width: _0x2f9fff,
    height: _0x15ab01,
    originalWidth: toPositiveInt(_0x39f7fb.originalWidth, _0x2f9fff),
    originalHeight: toPositiveInt(_0x39f7fb.originalHeight, _0x15ab01),
    row: toPositiveInt(_0x39f7fb.row, _0x2c8f03.row || 0),
    col: toPositiveInt(_0x39f7fb.col, _0x2c8f03.col || 0),
    isEmpty: false,
  };
}
export function resolveNodeKnownMediaBasis(_0x37c2aa = {}) {
  const _0x4c3746 = Number(_0x37c2aa?.mainImageIndex) || 0,
    _0xe798c2 = Array.isArray(_0x37c2aa?.images) ? _0x37c2aa.images[_0x4c3746] : null;
  return resolveInputRatioBasis(
    { width: _0x37c2aa?.imageWidth, height: _0x37c2aa?.imageHeight },
    { width: _0x37c2aa?.imgWidth, height: _0x37c2aa?.imgHeight },
    { width: _0x37c2aa?.naturalWidth, height: _0x37c2aa?.naturalHeight },
    { width: _0x37c2aa?.originalWidth, height: _0x37c2aa?.originalHeight },
    { width: _0xe798c2?.imageWidth, height: _0xe798c2?.imageHeight },
    { width: _0xe798c2?.width, height: _0xe798c2?.height },
  );
}
export async function resolveApiInputRatioBasis(_0x52581c, _0x5f2113) {
  const _0x2ab5b1 = resolveNodeKnownMediaBasis(_0x52581c);
  if (_0x2ab5b1.valid) return _0x2ab5b1;
  const _0x28efe1 = await readImageNaturalSize(_0x5f2113);
  return resolveInputRatioBasis(_0x28efe1 || {}, { width: _0x52581c?.width, height: _0x52581c?.height });
}
export async function resolveFinalResultDisplaySize(_0x5e5075, _0x1fdc5a = {}) {
  const _0x507660 = await resolveOutputMediaSize(_0x1fdc5a);
  if (
    _0x507660 &&
    shouldSwitchToOutputRatio(
      _0x5e5075.width,
      _0x5e5075.height,
      _0x507660.width,
      _0x507660.height,
      RATIO_SWITCH_THRESHOLD,
    )
  )
    return calcDisplaySizeByMedia(_0x507660.width, _0x507660.height);
  return calcDisplaySizeByMedia(_0x5e5075.width, _0x5e5075.height);
}
export const RH_PENDING_CODES = new Set([0x324, 0x32d]);
export const parseRhTaskId = (_0x227d43) =>
  String(
    _0x227d43?.task_id ||
      _0x227d43?.taskId ||
      _0x227d43?.data?.task_id ||
      _0x227d43?.data?.taskId ||
      _0x227d43?.data?.id ||
      _0x227d43?.id ||
      '',
  ).trim();
export function parseRhCode(_0x4d25b1) {
  const _0x43b548 = Number(_0x4d25b1?.code);
  return Number.isFinite(_0x43b548) ? _0x43b548 : null;
}
export function extractFirstImageUrl(_0xb38c7d) {
  const _0x3cfa52 = new Set(),
    _0x20182c = [],
    _0x5f215a = (_0x1aab72) => {
      if (!_0x1aab72) return;
      if (typeof _0x1aab72 === 'string') {
        const _0x6bfa37 = _0x1aab72.trim();
        if (!_0x6bfa37) return;
        if (_0x6bfa37.startsWith('http://') || _0x6bfa37.startsWith('https://')) {
          !_0x3cfa52.has(_0x6bfa37) && (_0x3cfa52.add(_0x6bfa37), _0x20182c.push(_0x6bfa37));
          return;
        }
        if (
          (_0x6bfa37.startsWith('{') && _0x6bfa37.endsWith('}')) ||
          (_0x6bfa37.startsWith('[') && _0x6bfa37.endsWith(']'))
        )
          try {
            _0x5f215a(JSON.parse(_0x6bfa37));
          } catch {}
        return;
      }
      if (Array.isArray(_0x1aab72)) {
        _0x1aab72.forEach(_0x5f215a);
        return;
      }
      if (typeof _0x1aab72 !== 'object') return;
      (['url', 'imageUrl', 'image', 'fileUrl', 'output', 'download_url', 'sourceUrl', 'thumbUrl'].forEach(
        (_0x5a0e26) => _0x5f215a(_0x1aab72[_0x5a0e26]),
      ),
        Object.values(_0x1aab72).forEach(_0x5f215a));
    };
  return (_0x5f215a(_0xb38c7d), _0x20182c[0] || '');
}
