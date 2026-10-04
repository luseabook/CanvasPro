import { isNodeType } from './registry.js';
export const NODE_MEDIA_DATASET_KEYS = Object.freeze({
  imageW: 'mediaImageW',
  imageH: 'mediaImageH',
  videoW: 'mediaVideoW',
  videoH: 'mediaVideoH',
  videoSrc: 'mediaVideoSrc',
});
function toPositiveNumber(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function toText(item) {
  return String(item || '').trim();
}
function firstText(...args) {
  for (const key of args) {
    const toText2 = toText(key);
    if (toText2) return toText2;
  }
  return '';
}
function pickMainItem(list, index) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const result = Number(index),
    data = Number.isFinite(result) ? Math.max(0, Math.trunc(result)) : 0;
  return list[data] || list[0] || null;
}
function hasImageSource(response) {
  return !!firstText(
    response?.localPath,
    response?.displayLocalPath,
    response?.originalLocalPath,
    response?.imageUrl,
    response?.sourceUrl,
    response?.thumbLocalPath,
    response?.thumbUrl,
    response?.thumbId,
    response?.src,
    response?.url,
  );
}
function hasVideoSource(response2) {
  return !!firstText(
    response2?.localPath,
    response2?.displayLocalPath,
    response2?.originalLocalPath,
    response2?.videoLocalPath,
    response2?.videoUrl,
    response2?.resultUrl,
    response2?.sourceUrl,
    response2?.thumbLocalPath,
    response2?.posterLocalPath,
    response2?.thumbUrl,
    response2?.posterUrl,
    response2?.thumbId,
    response2?.src,
    response2?.url,
  );
}
function resolveImageMetrics(enabled) {
  if (!enabled || typeof enabled !== 'object') return null;
  if (isNodeType(enabled, 'source-image')) {
    if (!hasImageSource(enabled)) return null;
    const w = toPositiveNumber(enabled.imageWidth) || toPositiveNumber(enabled.naturalWidth),
      h = toPositiveNumber(enabled.imageHeight) || toPositiveNumber(enabled.naturalHeight);
    return w > 0 && h > 0 ? { w: w, h: h } : null;
  }
  if (isNodeType(enabled, 'ai-image')) {
    const box = pickMainItem(enabled.images, enabled.mainImageIndex) || enabled;
    if (!hasImageSource(box) && !hasImageSource(enabled)) return null;
    const w2 =
        toPositiveNumber(box?.imageWidth) ||
        toPositiveNumber(box?.naturalWidth) ||
        toPositiveNumber(box?.width) ||
        toPositiveNumber(enabled.imageWidth) ||
        toPositiveNumber(enabled.naturalWidth),
      h2 =
        toPositiveNumber(box?.imageHeight) ||
        toPositiveNumber(box?.naturalHeight) ||
        toPositiveNumber(box?.height) ||
        toPositiveNumber(enabled.imageHeight) ||
        toPositiveNumber(enabled.naturalHeight);
    return w2 > 0 && h2 > 0 ? { w: w2, h: h2 } : null;
  }
  return null;
}
function resolveVideoMetrics(response3) {
  if (!response3 || typeof response3 !== 'object') return null;
  if (isNodeType(response3, 'source-video')) {
    if (!hasVideoSource(response3)) return null;
    const w3 =
        toPositiveNumber(response3.selectedVideoWidth) ||
        toPositiveNumber(response3.videoWidth) ||
        toPositiveNumber(response3.naturalWidth),
      h3 =
        toPositiveNumber(response3.selectedVideoHeight) ||
        toPositiveNumber(response3.videoHeight) ||
        toPositiveNumber(response3.naturalHeight),
      src = firstText(
        response3.localPath,
        response3.displayLocalPath,
        response3.videoLocalPath,
        response3.videoUrl,
        response3.src,
        response3.url,
        response3.resultUrl,
      );
    return w3 > 0 && h3 > 0 ? { w: w3, h: h3, src: src } : null;
  }
  if (isNodeType(response3, 'ai-video')) {
    const box2 = pickMainItem(response3.videos, response3.mainVideoIndex) || response3;
    if (!hasVideoSource(box2) && !hasVideoSource(response3)) return null;
    const w4 =
        toPositiveNumber(response3.selectedVideoWidth) ||
        toPositiveNumber(box2?.videoWidth) ||
        toPositiveNumber(box2?.width) ||
        toPositiveNumber(response3.videoWidth) ||
        toPositiveNumber(response3.naturalWidth),
      h4 =
        toPositiveNumber(response3.selectedVideoHeight) ||
        toPositiveNumber(box2?.videoHeight) ||
        toPositiveNumber(box2?.height) ||
        toPositiveNumber(response3.videoHeight) ||
        toPositiveNumber(response3.naturalHeight),
      src2 = firstText(
        box2?.localPath,
        box2?.videoUrl,
        box2?.url,
        box2?.resultUrl,
        response3.localPath,
        response3.videoUrl,
        response3.src,
        response3.url,
        response3.resultUrl,
      );
    return w4 > 0 && h4 > 0 ? { w: w4, h: h4, src: src2 } : null;
  }
  return null;
}
export function resolveNodeDisplayedMediaMetrics(options) {
  return { image: resolveImageMetrics(options), video: resolveVideoMetrics(options) };
}
function writeSize(target, source, next, current) {
  current?.w > 0 && current?.h > 0
    ? ((target[source] = String(Math.round(current.w))), (target[next] = String(Math.round(current.h))))
    : (delete target[source], delete target[next]);
}
export function syncNodeMediaMetricsDataset(el, entry) {
  const enabled2 = el?.dataset;
  if (!enabled2) return;
  const nodeDisplayedMediaMetrics = resolveNodeDisplayedMediaMetrics(entry);
  (writeSize(
    enabled2,
    NODE_MEDIA_DATASET_KEYS.imageW,
    NODE_MEDIA_DATASET_KEYS.imageH,
    nodeDisplayedMediaMetrics.image,
  ),
    writeSize(
      enabled2,
      NODE_MEDIA_DATASET_KEYS.videoW,
      NODE_MEDIA_DATASET_KEYS.videoH,
      nodeDisplayedMediaMetrics.video,
    ),
    nodeDisplayedMediaMetrics.video?.src
      ? (enabled2[NODE_MEDIA_DATASET_KEYS.videoSrc] = nodeDisplayedMediaMetrics.video.src)
      : delete enabled2[NODE_MEDIA_DATASET_KEYS.videoSrc]);
}
export function readNodeMediaMetricsDataset(el2, record) {
  const enabled3 = el2?.dataset;
  if (!enabled3) return null;
  const payload = NODE_MEDIA_DATASET_KEYS,
    src3 = String(record || '') === 'video',
    w5 = toPositiveNumber(enabled3[src3 ? payload.videoW : payload.imageW]),
    h5 = toPositiveNumber(enabled3[src3 ? payload.videoH : payload.imageH]);
  if (!(w5 > 0 && h5 > 0)) return null;
  return { w: w5, h: h5, src: src3 ? toText(enabled3[payload.videoSrc]) : '' };
}
