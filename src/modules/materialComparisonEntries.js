import { isCollageImageNode, resolveCollageNodeImage } from './collage/collageFactory.js';
import { resolveCanvasNodePlayableVideoEntry } from './videoSyncPlayback.js';
import { resolveCanvasVideoPosterUrl } from '../services/canvasMediaLocalService.js';
import { t } from '../i18n/index.js';
export const MATERIAL_COMPARISON_KIND_IMAGE = 'image';
export const MATERIAL_COMPARISON_KIND_VIDEO = 'video';
function getEntryLabel(_0x26b605, _0x5698fa, _0x4b734e, _0x31d32c) {
  return String(
    _0x5698fa?.['label'] ||
      _0x26b605?.['name'] ||
      _0x26b605?.['fileName'] ||
      _0x31d32c('canvasInteraction.materialComparison.untitled', { index: _0x4b734e + 0x1 }),
  )['trim']();
}
function getEntryAspectRatio(_0x2e7f53, _0x18b877) {
  const _0x2679cb = Number(
      _0x18b877?.['originalWidth'] ||
        _0x18b877?.['videoWidth'] ||
        _0x18b877?.['imageWidth'] ||
        _0x18b877?.['sourceWidth'] ||
        _0x18b877?.['width'] ||
        _0x2e7f53?.['originalWidth'] ||
        _0x2e7f53?.['videoWidth'] ||
        _0x2e7f53?.['imageWidth'] ||
        _0x2e7f53?.['sourceWidth'] ||
        0x0,
    ),
    _0x39864f = Number(
      _0x18b877?.['originalHeight'] ||
        _0x18b877?.['videoHeight'] ||
        _0x18b877?.['imageHeight'] ||
        _0x18b877?.['sourceHeight'] ||
        _0x18b877?.['height'] ||
        _0x2e7f53?.['originalHeight'] ||
        _0x2e7f53?.['videoHeight'] ||
        _0x2e7f53?.['imageHeight'] ||
        _0x2e7f53?.['sourceHeight'] ||
        0x0,
    );
  if (_0x2679cb <= 0x0 || _0x39864f <= 0x0) return 0x0;
  return _0x2679cb / _0x39864f;
}
function resolveImageEntry(_0x4e940e, _0x2d5a9d, _0x35c771) {
  if (!isCollageImageNode(_0x4e940e)) return null;
  const _0x76e0cd = resolveCollageNodeImage(_0x4e940e),
    _0x5bb657 = String(_0x76e0cd?.['url'] || '')['trim']();
  if (!_0x5bb657) return null;
  return {
    id: String(_0x4e940e?.['id'] || 'comparison-image-' + _0x2d5a9d),
    node: _0x4e940e,
    kind: MATERIAL_COMPARISON_KIND_IMAGE,
    label: getEntryLabel(_0x4e940e, _0x76e0cd, _0x2d5a9d, _0x35c771),
    thumbnailUrl: _0x5bb657,
    sourceUrl: '',
    aspectRatio: getEntryAspectRatio(_0x4e940e, _0x76e0cd),
    originalPromise: null,
    originalUrl: '',
    revokeUrlOnClose: ![],
  };
}
function resolveVideoEntry(_0x1b7644, _0x38ede5, _0x1daf52) {
  const _0x55e629 = resolveCanvasNodePlayableVideoEntry(_0x1b7644);
  if (!_0x55e629?.['source']) return null;
  const _0x554141 = _0x55e629['record'] || _0x1b7644;
  return {
    id: String(_0x1b7644?.['id'] || 'comparison-video-' + _0x38ede5),
    node: _0x1b7644,
    kind: MATERIAL_COMPARISON_KIND_VIDEO,
    label: getEntryLabel(_0x1b7644, _0x554141, _0x38ede5, _0x1daf52),
    thumbnailUrl: String(
      resolveCanvasVideoPosterUrl(_0x554141) || resolveCanvasVideoPosterUrl(_0x1b7644) || '',
    )['trim'](),
    sourceUrl: String(_0x55e629['source'] || '')['trim'](),
    videoIndex: Number(_0x55e629['videoIndex']) || 0x0,
    aspectRatio: getEntryAspectRatio(_0x1b7644, _0x554141),
    originalPromise: null,
    originalUrl: '',
    revokeUrlOnClose: ![],
  };
}
export function resolveMaterialComparisonEntries(_0x3e7d28 = [], _0x11c764 = {}) {
  const _0x53171e = typeof _0x11c764['translate'] === 'function' ? _0x11c764['translate'] : t;
  return (Array['isArray'](_0x3e7d28) ? _0x3e7d28 : [])
    ['map'](
      (_0x3b7aff, _0x2ae158) =>
        resolveImageEntry(_0x3b7aff, _0x2ae158, _0x53171e) ||
        resolveVideoEntry(_0x3b7aff, _0x2ae158, _0x53171e),
    )
    ['filter'](Boolean);
}
export function getMaterialComparisonKindCounts(_0x32466a = []) {
  const _0x4e7e2b = new Map();
  for (const _0xf22492 of Array['isArray'](_0x32466a) ? _0x32466a : []) {
    const _0x207ef8 = String(_0xf22492?.['kind'] || '')['trim']();
    if (!_0x207ef8) continue;
    _0x4e7e2b['set'](_0x207ef8, (_0x4e7e2b['get'](_0x207ef8) || 0x0) + 0x1);
  }
  return _0x4e7e2b;
}
export function findInitialMaterialComparisonPair(_0x3181e0 = []) {
  const _0x826bf0 = Array['isArray'](_0x3181e0) ? _0x3181e0 : [],
    _0x140aba = getMaterialComparisonKindCounts(_0x826bf0),
    _0x299ab3 = _0x826bf0['findIndex']((_0x17661f) => (_0x140aba['get'](_0x17661f?.['kind']) || 0x0) >= 0x2);
  if (_0x299ab3 < 0x0) return null;
  const _0x29728d = _0x826bf0['findIndex'](
    (_0x414be0, _0x233e6a) =>
      _0x233e6a !== _0x299ab3 && _0x414be0?.['kind'] === _0x826bf0[_0x299ab3]?.['kind'],
  );
  if (_0x29728d < 0x0) return null;
  return { leftIndex: _0x299ab3, rightIndex: _0x29728d };
}
export function hasMaterialComparisonPair(_0x286b69 = []) {
  return !!findInitialMaterialComparisonPair(resolveMaterialComparisonEntries(_0x286b69));
}
