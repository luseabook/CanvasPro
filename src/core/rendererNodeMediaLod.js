import { isNodeType } from '../modules/registry.js';
import {
  CANVAS_IMAGE_LOD_ENTER_THUMB_ZOOM,
  CANVAS_IMAGE_LOD_EXIT_THUMB_ZOOM,
  MEDIA_LOD_MODE_ATTR,
  MEDIA_LOD_MODE_FULL,
  MEDIA_LOD_MODE_THUMB,
} from '../modules/canvasImageLod.js';
export function getNodeMediaLodMode(_0x4c9323, _0x45e8cf, _0x4a779b = '') {
  if (!isNodeType(_0x4c9323, ['source-image', 'ai-image'])) return '';
  const _0x6b93a1 = Number.isFinite(_0x45e8cf?.zoom) ? _0x45e8cf.zoom : 1,
    _0x68675 = _0x4a779b === MEDIA_LOD_MODE_THUMB ? MEDIA_LOD_MODE_THUMB : MEDIA_LOD_MODE_FULL;
  if (_0x68675 === MEDIA_LOD_MODE_THUMB)
    return _0x6b93a1 >= CANVAS_IMAGE_LOD_EXIT_THUMB_ZOOM ? MEDIA_LOD_MODE_FULL : MEDIA_LOD_MODE_THUMB;
  return _0x6b93a1 <= CANVAS_IMAGE_LOD_ENTER_THUMB_ZOOM ? MEDIA_LOD_MODE_THUMB : MEDIA_LOD_MODE_FULL;
}
export function syncNodeMediaLodMode(_0x5b6784, _0x4de579, _0x52c79a) {
  if (!_0x5b6784?.dataset) return '';
  const _0x3c1ff7 = String(_0x5b6784.dataset[MEDIA_LOD_MODE_ATTR] || '').trim(),
    _0x49906b = getNodeMediaLodMode(_0x4de579, _0x52c79a, _0x3c1ff7);
  if (!_0x49906b)
    return (MEDIA_LOD_MODE_ATTR in _0x5b6784.dataset && delete _0x5b6784.dataset[MEDIA_LOD_MODE_ATTR], '');
  return (
    _0x5b6784.dataset[MEDIA_LOD_MODE_ATTR] !== _0x49906b &&
      (_0x5b6784.dataset[MEDIA_LOD_MODE_ATTR] = _0x49906b),
    _0x49906b
  );
}
