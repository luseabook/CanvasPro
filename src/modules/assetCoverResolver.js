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
function normalizeText(value) {
  return String(value || '')['trim']();
}
function firstUsableCoverUrl(...args) {
  for (const item of args) {
    const text = normalizeText(item);
    if (!text || /^data:(?:video|audio)\//i['test'](text) || NON_IMAGE_MEDIA_RE['test'](text)) continue;
    return text;
  }
  return '';
}
function pickIndexedItem(list, key) {
  if (!Array['isArray'](list) || list['length'] === 0x0) return null;
  const index = Number(key),
    result = Number['isFinite'](index) ? Math['max'](0x0, Math['trunc'](index)) : 0x0;
  return list[result] || list[0x0] || null;
}
function resolveImageCoverUrl(response = {}) {
  if (!response || typeof response !== 'object') return '';
  return firstUsableCoverUrl(
    resolveCanvasImageThumbUrl(response),
    resolveCanvasImageDisplayUrl(response),
    resolveCanvasImageSourceUrl(response),
    localPathToUrl(response['thumbLocalPath']),
    localPathToUrl(response['thumbnailLocalPath']),
    localPathToUrl(response['previewLocalPath']),
    localPathToUrl(response['displayLocalPath']),
    localPathToUrl(response['localPath']),
    localPathToUrl(response['originalLocalPath']),
    response['thumbUrl'],
    response['thumbnailUrl'],
    response['previewUrl'],
    response['displayUrl'],
    response['imageUrl'],
    response['sourceUrl'],
    response['src'],
    response['url'],
    response['resultUrl'],
  );
}
function resolveImagePreviewUrl(response2 = {}) {
  if (!response2 || typeof response2 !== 'object') return '';
  return firstUsableCoverUrl(
    resolveCanvasImageDisplayUrl(response2),
    resolveCanvasImagePreviewUrl(response2),
    resolveCanvasImageSourceUrl(response2),
    localPathToUrl(response2['displayLocalPath']),
    localPathToUrl(response2['previewLocalPath']),
    localPathToUrl(response2['originalLocalPath']),
    localPathToUrl(response2['localPath']),
    response2['displayUrl'],
    response2['previewUrl'],
    response2['imageUrl'],
    response2['sourceUrl'],
    response2['src'],
    response2['url'],
    response2['resultUrl'],
    response2['thumbUrl'],
    response2['thumbnailUrl'],
  );
}
function resolveVideoCoverUrl(enabled = {}) {
  if (!enabled || typeof enabled !== 'object') return '';
  return firstUsableCoverUrl(
    resolveCanvasVideoPosterUrl(enabled),
    localPathToUrl(enabled['posterLocalPath']),
    localPathToUrl(enabled['coverLocalPath']),
    localPathToUrl(enabled['previewLocalPath']),
    localPathToUrl(enabled['thumbLocalPath']),
    localPathToUrl(enabled['thumbnailLocalPath']),
    enabled['posterUrl'],
    enabled['coverUrl'],
    enabled['previewUrl'],
    enabled['thumbUrl'],
    enabled['thumbnailUrl'],
  );
}
function resolveGenericCoverUrl(options = {}) {
  return firstUsableCoverUrl(
    localPathToUrl(options['coverLocalPath']),
    localPathToUrl(options['posterLocalPath']),
    localPathToUrl(options['thumbLocalPath']),
    localPathToUrl(options['thumbnailLocalPath']),
    options['coverUrl'],
    options['posterUrl'],
    options['thumbUrl'],
    options['thumbnailUrl'],
    options['imageUrl'],
    options['sourceUrl'],
  );
}
function resolveNodeMediaKind(options2 = {}) {
  const text2 = normalizeText(options2['type'])['toLowerCase']();
  if (VIDEO_NODE_TYPES['has'](text2)) return 'video';
  if (IMAGE_NODE_TYPES['has'](text2)) return 'image';
  if (Array['isArray'](options2['videos']) && options2['videos']['length'] > 0x0) return 'video';
  if (
    (Array['isArray'](options2['images']) && options2['images']['length'] > 0x0) ||
    (Array['isArray'](options2['outputImages']) && options2['outputImages']['length'] > 0x0)
  )
    return 'image';
  return 'other';
}
function getCurrentImage(options3 = {}) {
  return pickIndexedItem(
    Array['isArray'](options3['images']) ? options3['images'] : options3['outputImages'],
    options3['mainImageIndex'],
  );
}
function getCurrentVideo(options4 = {}) {
  return pickIndexedItem(options4['videos'], options4['mainVideoIndex']);
}
function resolvePositiveDimension(...args2) {
  for (const data of args2) {
    const count = Number(data);
    if (Number['isFinite'](count) && count > 0x0) return count;
  }
  return 0x0;
}
function resolveSourceAspectRatio(box = {}) {
  if (!box || typeof box !== 'object') return 0x0;
  const positiveDimension = resolvePositiveDimension(
      box['originalWidth'],
      box['imageWidth'],
      box['videoWidth'],
      box['naturalWidth'],
      box['mediaWidth'],
      box['width'],
    ),
    positiveDimension2 = resolvePositiveDimension(
      box['originalHeight'],
      box['imageHeight'],
      box['videoHeight'],
      box['naturalHeight'],
      box['mediaHeight'],
      box['height'],
    ),
    count2 =
      positiveDimension > 0x0 && positiveDimension2 > 0x0 ? positiveDimension / positiveDimension2 : 0x0;
  return count2 >= 0.1 && count2 <= 0xa ? count2 : 0x0;
}
export function resolveAssetNodeCoverUrl(options5 = {}) {
  const nodeMediaKind = resolveNodeMediaKind(options5);
  if (nodeMediaKind === 'image') {
    if (normalizeText(options5['type'])['toLowerCase']() === 'source-image') {
      const usableCoverUrl = firstUsableCoverUrl(
        localPathToUrl(options5['thumbLocalPath']),
        localPathToUrl(options5['thumbnailLocalPath']),
        options5['thumbUrl'],
        options5['thumbnailUrl'],
      );
      if (usableCoverUrl) return usableCoverUrl;
    }
    return resolveImageCoverUrl(getCurrentImage(options5)) || resolveImageCoverUrl(options5);
  }
  if (nodeMediaKind === 'video')
    return resolveVideoCoverUrl(getCurrentVideo(options5)) || resolveVideoCoverUrl(options5);
  return resolveGenericCoverUrl(options5);
}
export function resolveAssetNodePreviewUrl(options6 = {}) {
  const nodeMediaKind2 = resolveNodeMediaKind(options6);
  if (nodeMediaKind2 === 'image')
    return resolveImagePreviewUrl(getCurrentImage(options6)) || resolveImagePreviewUrl(options6);
  if (nodeMediaKind2 === 'video')
    return resolveVideoCoverUrl(getCurrentVideo(options6)) || resolveVideoCoverUrl(options6);
  return resolveGenericCoverUrl(options6);
}
export function resolveAssetNodePreviewAspectRatio(options7 = {}) {
  const nodeMediaKind3 = resolveNodeMediaKind(options7),
    target =
      nodeMediaKind3 === 'image'
        ? getCurrentImage(options7)
        : nodeMediaKind3 === 'video'
          ? getCurrentVideo(options7)
          : null;
  return resolveSourceAspectRatio(target) || resolveSourceAspectRatio(options7) || 0x4 / 0x3;
}
export function resolveAssetNodeCoverThumbId(options8 = {}) {
  if (resolveNodeMediaKind(options8) !== 'image') return '';
  const currentImage = getCurrentImage(options8);
  return normalizeText(
    currentImage?.['thumbId'] || currentImage?.['sourceId'] || options8['thumbId'] || options8['sourceId'],
  );
}
export function isAssetMaterialThumbnailUrl(source) {
  return ASSET_MATERIAL_THUMB_RE['test'](normalizeText(source));
}
export function getAssetMaterialVideoThumbnailKey(next) {
  const current = Number['isFinite'](Number(next)) ? Math['max'](0x0, Math['trunc'](Number(next))) : 0x0;
  return ASSET_MATERIAL_VIDEO_THUMB_VERSION + '-' + current;
}
export function isAssetMaterialVideoThumbnailUrl(entry) {
  const list2 = normalizeText(entry);
  return (
    isAssetMaterialThumbnailUrl(list2) && list2['includes']('_' + ASSET_MATERIAL_VIDEO_THUMB_VERSION + '-')
  );
}
export function resolveMaterialItemThumbUrl(options9 = {}) {
  const type = options9?.['nodeData'] || {},
    nodeMediaKind4 = resolveNodeMediaKind({ ...type, type: type?.['type'] || options9?.['type'] }),
    text3 = normalizeText(options9?.['thumbSrc']);
  if (nodeMediaKind4 === 'video' && isAssetMaterialThumbnailUrl(text3)) return text3;
  return resolveAssetNodeCoverUrl(type) || text3;
}
export function resolveMaterialItemPreviewUrl(options10 = {}) {
  const type2 = options10?.['nodeData'] || {},
    nodeMediaKind5 = resolveNodeMediaKind({ ...type2, type: type2?.['type'] || options10?.['type'] }),
    text4 = normalizeText(options10?.['thumbSrc']);
  if (nodeMediaKind5 === 'video' && isAssetMaterialThumbnailUrl(text4)) return text4;
  return resolveAssetNodePreviewUrl(type2) || resolveMaterialItemThumbUrl(options10);
}
export function resolveAssetMaterialVideoSourceUrl(options11 = {}) {
  if (resolveNodeMediaKind(options11) !== 'video') return '';
  const currentVideo = getCurrentVideo(options11);
  return resolveCanvasVideoDisplayUrl(currentVideo || {}) || resolveCanvasVideoDisplayUrl(options11);
}
export function fitAssetMaterialVideoThumbnail(
  record,
  payload,
  handle = ASSET_MATERIAL_VIDEO_THUMB_MAX_EDGE,
) {
  const count3 = Number(record) || 0x0,
    count4 = Number(payload) || 0x0,
    state = Math['max'](0x1, Number(handle) || ASSET_MATERIAL_VIDEO_THUMB_MAX_EDGE);
  if (count3 <= 0x0 || count4 <= 0x0) return { width: 0x0, height: 0x0 };
  const config = Math['min'](0x1, state / count3, state / count4);
  return {
    width: Math['max'](0x1, Math['round'](count3 * config)),
    height: Math['max'](0x1, Math['round'](count4 * config)),
  };
}
