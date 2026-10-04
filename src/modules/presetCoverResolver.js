import { get } from '../../api/requester.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import {
  resolveCanvasImageDisplayUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasImageThumbUrl,
  resolveCanvasVideoPosterUrl,
  resolveCanvasVideoUrl,
} from '../services/canvasMediaLocalService.js';
import { convertImageBlobToDataUrl } from '../services/imagePngConversionService.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
const IMAGE_DATA_URL_RE = /^data:image\//i;
function normalizeText(value) {
  return String(value || '')['trim']();
}
function firstNonEmptyString(...args) {
  for (const item of args) {
    const text = normalizeText(item);
    if (text) return text;
  }
  return '';
}
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
function hasError(key) {
  return !!normalizeText(key?.['error']);
}
function normalizeIndex(index, result) {
  const data = Number(index);
  if (!Number['isFinite'](data)) return 0x0;
  return Math['max'](0x0, Math['min'](Math['trunc'](data), Math['max'](0x0, result - 0x1)));
}
function pickSuccessfulItem(list, options, handler) {
  const list2 = Array['isArray'](list) ? list['filter']((target) => isPlainObject(target)) : [];
  if (list2['length'] === 0x0) return null;
  const index2 = normalizeIndex(options, list2['length']),
    source = list2[index2];
  if (source && !hasError(source) && handler(source)) return source;
  return list2['find']((next) => !hasError(next) && !!handler(next)) || null;
}
function resolveImageCoverUrl(response = {}) {
  if (!isPlainObject(response) || hasError(response)) return '';
  return firstNonEmptyString(
    resolveCanvasImageThumbUrl(response),
    resolveCanvasImageDisplayUrl(response),
    resolveCanvasImageSourceUrl(response),
    response['thumbUrl'],
    response['imageUrl'],
    response['sourceUrl'],
    response['url'],
    response['resultUrl'],
    localPathToUrl(response['thumbLocalPath']),
    localPathToUrl(response['displayLocalPath']),
    localPathToUrl(response['localPath']),
  );
}
function resolveVideoCoverUrl(options2 = {}) {
  if (!isPlainObject(options2) || hasError(options2)) return '';
  return firstNonEmptyString(
    resolveCanvasVideoPosterUrl(options2),
    localPathToUrl(options2['posterLocalPath']),
    localPathToUrl(options2['previewLocalPath']),
    localPathToUrl(options2['thumbLocalPath']),
    localPathToUrl(options2['thumbnailLocalPath']),
    options2['posterUrl'],
    options2['previewUrl'],
    options2['thumbUrl'],
    options2['thumbnailUrl'],
    options2['coverUrl'],
  );
}
function resolveVideoResultUrl(response2 = {}) {
  if (!isPlainObject(response2) || hasError(response2)) return '';
  return firstNonEmptyString(
    resolveCanvasVideoUrl(response2),
    localPathToUrl(response2['displayLocalPath']),
    localPathToUrl(response2['localPath']),
    response2['videoUrl'],
    response2['resultUrl'],
    response2['src'],
    response2['url'],
  );
}
function resolveVideoThumbResultUrl(response3 = {}) {
  if (!isPlainObject(response3)) return '';
  return firstNonEmptyString(
    response3['url'],
    response3['thumbUrl'],
    response3['posterUrl'],
    localPathToUrl(response3['thumbLocalPath']),
    localPathToUrl(response3['posterLocalPath']),
    localPathToUrl(response3['localPath']),
  );
}
export function resolvePresetDefaultCoverCandidate(options3 = {}) {
  if (!isPlainObject(options3)) return { coverUrl: '', videoUrl: '' };
  const text2 = normalizeText(options3['type']);
  if (text2 === 'ai-image') {
    const list3 = Array['isArray'](options3['images']) ? options3['images'] : [];
    if (list3['length'] > 0x0) {
      const successfulItem = pickSuccessfulItem(list3, options3['mainImageIndex'], resolveImageCoverUrl);
      return { coverUrl: resolveImageCoverUrl(successfulItem), videoUrl: '' };
    }
    return { coverUrl: resolveImageCoverUrl(options3), videoUrl: '' };
  }
  if (text2 === 'ai-video') {
    const list4 = Array['isArray'](options3['videos']) ? options3['videos'] : [];
    if (list4['length'] > 0x0) {
      const successfulItem2 = pickSuccessfulItem(
          list4,
          options3['mainVideoIndex'],
          (current) => resolveVideoCoverUrl(current) || resolveVideoResultUrl(current),
        ),
        coverUrl = resolveVideoCoverUrl(successfulItem2);
      return { coverUrl: coverUrl, videoUrl: coverUrl ? '' : resolveVideoResultUrl(successfulItem2) };
    }
    const coverUrl2 = resolveVideoCoverUrl(options3);
    return { coverUrl: coverUrl2, videoUrl: coverUrl2 ? '' : resolveVideoResultUrl(options3) };
  }
  return { coverUrl: '', videoUrl: '' };
}
export async function imageUrlToDataUrl(entry, record = {}) {
  const text3 = normalizeText(entry);
  if (!text3) return '';
  if (IMAGE_DATA_URL_RE['test'](text3)) return text3;
  const run =
      typeof record['getBlob'] === 'function'
        ? record['getBlob']
        : (payload) => get(payload, { responseType: 'blob', provider: 'local', timeout: 0x7530 }),
    handler2 =
      typeof record['blobToDataUrl'] === 'function' ? record['blobToDataUrl'] : convertImageBlobToDataUrl;
  try {
    const handle = await run(text3),
      state = await handler2(handle, text3);
    return IMAGE_DATA_URL_RE['test'](state) ? state : '';
  } catch {
    return '';
  }
}
export async function resolvePresetDefaultCoverDataUrl(options4 = {}, config = {}) {
  const run2 =
      typeof config['loadImageDataUrl'] === 'function'
        ? config['loadImageDataUrl']
        : (scope) => imageUrlToDataUrl(scope, config),
    handler3 =
      typeof config['fetchVideoFirstFrameThumb'] === 'function'
        ? config['fetchVideoFirstFrameThumb']
        : fetchVideoFirstFrameThumbFromServer;
  try {
    const presetDefaultCoverCandidate = resolvePresetDefaultCoverCandidate(options4);
    if (presetDefaultCoverCandidate['coverUrl']) {
      const input = await run2(presetDefaultCoverCandidate['coverUrl']);
      return IMAGE_DATA_URL_RE['test'](input) ? input : '';
    }
    if (!presetDefaultCoverCandidate['videoUrl']) return '';
    const output = await handler3(presetDefaultCoverCandidate['videoUrl'], {
        nodeId: normalizeText(options4?.['id']),
      }),
      videoThumbResultUrl = resolveVideoThumbResultUrl(output);
    if (!videoThumbResultUrl) return '';
    const value2 = await run2(videoThumbResultUrl);
    return IMAGE_DATA_URL_RE['test'](value2) ? value2 : '';
  } catch {
    return '';
  }
}
