import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
  resolveCanvasVideoDisplayUrl,
  resolveCanvasVideoPosterUrl,
} from '../services/canvasMediaLocalService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
const IMAGE_NODE_TYPES = new Set(['image', 'source-image', 'ai-image']),
  VIDEO_NODE_TYPES = new Set(['video', 'source-video', 'ai-video']),
  NON_IMAGE_MEDIA_RE = /\.(?:mp4|webm|mov|mkv|m4v|mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  ASSET_MATERIAL_THUMB_RE = /(?:^|\/)data\/assets\/thumbs\//i;
export const ASSET_MATERIAL_VIDEO_THUMB_MAX_EDGE = 0x3c0;
const ASSET_MATERIAL_VIDEO_THUMB_VERSION = 'video-v2-' + ASSET_MATERIAL_VIDEO_THUMB_MAX_EDGE;
function normalizeText(_0x33352d) {
  return String(_0x33352d || '')['trim']();
}
function firstUsableCoverUrl(..._0x16f5b6) {
  for (const _0x4cd1bb of _0x16f5b6) {
    const _0xedd893 = normalizeText(_0x4cd1bb);
    if (!_0xedd893 || /^data:(?:video|audio)\//i['test'](_0xedd893) || NON_IMAGE_MEDIA_RE['test'](_0xedd893))
      continue;
    return _0xedd893;
  }
  return '';
}
function pickIndexedItem(_0x8679c8, _0x2b9abc) {
  if (!Array['isArray'](_0x8679c8) || _0x8679c8['length'] === 0x0) return null;
  const _0xbb9d86 = Number(_0x2b9abc),
    _0x295e5a = Number['isFinite'](_0xbb9d86) ? Math['max'](0x0, Math['trunc'](_0xbb9d86)) : 0x0;
  return _0x8679c8[_0x295e5a] || _0x8679c8[0x0] || null;
}
function resolveImageCoverUrl(_0x19df5c = {}) {
  if (!_0x19df5c || typeof _0x19df5c !== 'object') return '';
  return firstUsableCoverUrl(
    resolveCanvasImageThumbUrl(_0x19df5c),
    resolveCanvasImageDisplayUrl(_0x19df5c),
    resolveCanvasImageSourceUrl(_0x19df5c),
    localPathToUrl(_0x19df5c['thumbLocalPath']),
    localPathToUrl(_0x19df5c['thumbnailLocalPath']),
    localPathToUrl(_0x19df5c['previewLocalPath']),
    localPathToUrl(_0x19df5c['displayLocalPath']),
    localPathToUrl(_0x19df5c['localPath']),
    localPathToUrl(_0x19df5c['originalLocalPath']),
    _0x19df5c['thumbUrl'],
    _0x19df5c['thumbnailUrl'],
    _0x19df5c['previewUrl'],
    _0x19df5c['displayUrl'],
    _0x19df5c['imageUrl'],
    _0x19df5c['sourceUrl'],
    _0x19df5c['src'],
    _0x19df5c['url'],
    _0x19df5c['resultUrl'],
  );
}
function resolveImagePreviewUrl(_0x1e8db4 = {}) {
  if (!_0x1e8db4 || typeof _0x1e8db4 !== 'object') return '';
  return firstUsableCoverUrl(
    resolveCanvasImageDisplayUrl(_0x1e8db4),
    resolveCanvasImagePreviewUrl(_0x1e8db4),
    resolveCanvasImageSourceUrl(_0x1e8db4),
    localPathToUrl(_0x1e8db4['displayLocalPath']),
    localPathToUrl(_0x1e8db4['previewLocalPath']),
    localPathToUrl(_0x1e8db4['originalLocalPath']),
    localPathToUrl(_0x1e8db4['localPath']),
    _0x1e8db4['displayUrl'],
    _0x1e8db4['previewUrl'],
    _0x1e8db4['imageUrl'],
    _0x1e8db4['sourceUrl'],
    _0x1e8db4['src'],
    _0x1e8db4['url'],
    _0x1e8db4['resultUrl'],
    _0x1e8db4['thumbUrl'],
    _0x1e8db4['thumbnailUrl'],
  );
}
function resolveVideoCoverUrl(_0x7f70c0 = {}) {
  if (!_0x7f70c0 || typeof _0x7f70c0 !== 'object') return '';
  return firstUsableCoverUrl(
    resolveCanvasVideoPosterUrl(_0x7f70c0),
    localPathToUrl(_0x7f70c0['posterLocalPath']),
    localPathToUrl(_0x7f70c0['coverLocalPath']),
    localPathToUrl(_0x7f70c0['previewLocalPath']),
    localPathToUrl(_0x7f70c0['thumbLocalPath']),
    localPathToUrl(_0x7f70c0['thumbnailLocalPath']),
    _0x7f70c0['posterUrl'],
    _0x7f70c0['coverUrl'],
    _0x7f70c0['previewUrl'],
    _0x7f70c0['thumbUrl'],
    _0x7f70c0['thumbnailUrl'],
  );
}
function resolveGenericCoverUrl(_0x51cd07 = {}) {
  return firstUsableCoverUrl(
    localPathToUrl(_0x51cd07['coverLocalPath']),
    localPathToUrl(_0x51cd07['posterLocalPath']),
    localPathToUrl(_0x51cd07['thumbLocalPath']),
    localPathToUrl(_0x51cd07['thumbnailLocalPath']),
    _0x51cd07['coverUrl'],
    _0x51cd07['posterUrl'],
    _0x51cd07['thumbUrl'],
    _0x51cd07['thumbnailUrl'],
    _0x51cd07['imageUrl'],
    _0x51cd07['sourceUrl'],
  );
}
function resolveNodeMediaKind(_0x4988e5 = {}) {
  const _0x1a65e7 = normalizeText(_0x4988e5['type'])['toLowerCase']();
  if (VIDEO_NODE_TYPES['has'](_0x1a65e7)) return 'video';
  if (IMAGE_NODE_TYPES['has'](_0x1a65e7)) return 'image';
  if (Array['isArray'](_0x4988e5['videos']) && _0x4988e5['videos']['length'] > 0x0) return 'video';
  if (
    (Array['isArray'](_0x4988e5['images']) && _0x4988e5['images']['length'] > 0x0) ||
    (Array['isArray'](_0x4988e5['outputImages']) && _0x4988e5['outputImages']['length'] > 0x0)
  )
    return 'image';
  return 'other';
}
function getCurrentImage(_0x493b76 = {}) {
  return pickIndexedItem(
    Array['isArray'](_0x493b76['images']) ? _0x493b76['images'] : _0x493b76['outputImages'],
    _0x493b76['mainImageIndex'],
  );
}
function getCurrentVideo(_0xb026f1 = {}) {
  return pickIndexedItem(_0xb026f1['videos'], _0xb026f1['mainVideoIndex']);
}
function resolvePositiveDimension(..._0x18896b) {
  for (const _0x537754 of _0x18896b) {
    const _0x6f7958 = Number(_0x537754);
    if (Number['isFinite'](_0x6f7958) && _0x6f7958 > 0x0) return _0x6f7958;
  }
  return 0x0;
}
function resolveSourceAspectRatio(_0x471109 = {}) {
  if (!_0x471109 || typeof _0x471109 !== 'object') return 0x0;
  const _0x420d60 = resolvePositiveDimension(
      _0x471109['originalWidth'],
      _0x471109['imageWidth'],
      _0x471109['videoWidth'],
      _0x471109['naturalWidth'],
      _0x471109['mediaWidth'],
      _0x471109['width'],
    ),
    _0x389d73 = resolvePositiveDimension(
      _0x471109['originalHeight'],
      _0x471109['imageHeight'],
      _0x471109['videoHeight'],
      _0x471109['naturalHeight'],
      _0x471109['mediaHeight'],
      _0x471109['height'],
    ),
    _0x1c7491 = _0x420d60 > 0x0 && _0x389d73 > 0x0 ? _0x420d60 / _0x389d73 : 0x0;
  return _0x1c7491 >= 0.1 && _0x1c7491 <= 0xa ? _0x1c7491 : 0x0;
}
export function resolveAssetNodeCoverUrl(_0x45a0ae = {}) {
  const _0x3fa98c = resolveNodeMediaKind(_0x45a0ae);
  if (_0x3fa98c === 'image') {
    if (normalizeText(_0x45a0ae['type'])['toLowerCase']() === 'source-image') {
      const _0x2cb19b = firstUsableCoverUrl(
        localPathToUrl(_0x45a0ae['thumbLocalPath']),
        localPathToUrl(_0x45a0ae['thumbnailLocalPath']),
        _0x45a0ae['thumbUrl'],
        _0x45a0ae['thumbnailUrl'],
      );
      if (_0x2cb19b) return _0x2cb19b;
    }
    return resolveImageCoverUrl(getCurrentImage(_0x45a0ae)) || resolveImageCoverUrl(_0x45a0ae);
  }
  if (_0x3fa98c === 'video')
    return resolveVideoCoverUrl(getCurrentVideo(_0x45a0ae)) || resolveVideoCoverUrl(_0x45a0ae);
  return resolveGenericCoverUrl(_0x45a0ae);
}
export function resolveAssetNodePreviewUrl(_0x696216 = {}) {
  const _0x290fd1 = resolveNodeMediaKind(_0x696216);
  if (_0x290fd1 === 'image')
    return resolveImagePreviewUrl(getCurrentImage(_0x696216)) || resolveImagePreviewUrl(_0x696216);
  if (_0x290fd1 === 'video')
    return resolveVideoCoverUrl(getCurrentVideo(_0x696216)) || resolveVideoCoverUrl(_0x696216);
  return resolveGenericCoverUrl(_0x696216);
}
export function resolveAssetNodePreviewAspectRatio(_0x56505d = {}) {
  const _0x185e9d = resolveNodeMediaKind(_0x56505d),
    _0x52b490 =
      _0x185e9d === 'image'
        ? getCurrentImage(_0x56505d)
        : _0x185e9d === 'video'
          ? getCurrentVideo(_0x56505d)
          : null;
  return resolveSourceAspectRatio(_0x52b490) || resolveSourceAspectRatio(_0x56505d) || 0x4 / 0x3;
}
export function resolveAssetNodeCoverThumbId(_0x1f4abe = {}) {
  if (resolveNodeMediaKind(_0x1f4abe) !== 'image') return '';
  const _0x310455 = getCurrentImage(_0x1f4abe);
  return normalizeText(
    _0x310455?.['thumbId'] || _0x310455?.['sourceId'] || _0x1f4abe['thumbId'] || _0x1f4abe['sourceId'],
  );
}
export function isAssetMaterialThumbnailUrl(_0x4391ae) {
  return ASSET_MATERIAL_THUMB_RE['test'](normalizeText(_0x4391ae));
}
export function getAssetMaterialVideoThumbnailKey(_0x5ab1da) {
  const _0x5d77c1 = Number['isFinite'](Number(_0x5ab1da))
    ? Math['max'](0x0, Math['trunc'](Number(_0x5ab1da)))
    : 0x0;
  return ASSET_MATERIAL_VIDEO_THUMB_VERSION + '-' + _0x5d77c1;
}
export function isAssetMaterialVideoThumbnailUrl(_0x1e002f) {
  const _0x5ca61e = normalizeText(_0x1e002f);
  return (
    isAssetMaterialThumbnailUrl(_0x5ca61e) &&
    _0x5ca61e['includes']('_' + ASSET_MATERIAL_VIDEO_THUMB_VERSION + '-')
  );
}
export function resolveMaterialItemThumbUrl(_0x207e98 = {}) {
  const _0x1c8203 = _0x207e98?.['nodeData'] || {},
    _0x264908 = resolveNodeMediaKind({ ..._0x1c8203, type: _0x1c8203?.['type'] || _0x207e98?.['type'] }),
    _0x2116b4 = normalizeText(_0x207e98?.['thumbSrc']);
  if (_0x264908 === 'video' && isAssetMaterialThumbnailUrl(_0x2116b4)) return _0x2116b4;
  return resolveAssetNodeCoverUrl(_0x1c8203) || _0x2116b4;
}
export function resolveMaterialItemPreviewUrl(_0x4dad13 = {}) {
  const _0x28f44e = _0x4dad13?.['nodeData'] || {},
    _0x33c3ad = resolveNodeMediaKind({ ..._0x28f44e, type: _0x28f44e?.['type'] || _0x4dad13?.['type'] }),
    _0x3d95ec = normalizeText(_0x4dad13?.['thumbSrc']);
  if (_0x33c3ad === 'video' && isAssetMaterialThumbnailUrl(_0x3d95ec)) return _0x3d95ec;
  return resolveAssetNodePreviewUrl(_0x28f44e) || resolveMaterialItemThumbUrl(_0x4dad13);
}
export function resolveAssetMaterialVideoSourceUrl(_0xa48739 = {}) {
  if (resolveNodeMediaKind(_0xa48739) !== 'video') return '';
  const _0x3e284b = getCurrentVideo(_0xa48739);
  return resolveCanvasVideoDisplayUrl(_0x3e284b || {}) || resolveCanvasVideoDisplayUrl(_0xa48739);
}
export function fitAssetMaterialVideoThumbnail(
  _0x16319a,
  _0x60a831,
  _0x1200c6 = ASSET_MATERIAL_VIDEO_THUMB_MAX_EDGE,
) {
  const _0x3d4e88 = Number(_0x16319a) || 0x0,
    _0xc5318b = Number(_0x60a831) || 0x0,
    _0x1d087c = Math['max'](0x1, Number(_0x1200c6) || ASSET_MATERIAL_VIDEO_THUMB_MAX_EDGE);
  if (_0x3d4e88 <= 0x0 || _0xc5318b <= 0x0) return { width: 0x0, height: 0x0 };
  const _0xbc0b0f = Math['min'](0x1, _0x1d087c / _0x3d4e88, _0x1d087c / _0xc5318b);
  return {
    width: Math['max'](0x1, Math['round'](_0x3d4e88 * _0xbc0b0f)),
    height: Math['max'](0x1, Math['round'](_0xc5318b * _0xbc0b0f)),
  };
}
