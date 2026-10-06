import { fetchVideoFirstFrameThumbFromServer } from './videoThumbApi.js';
import { localPathToUrl, pickResultLocalPath, urlToLocalPath } from '../src/utils/localMediaPath.js';
const inflightByFetcher = new WeakMap(),
  IMAGE_THUMBNAIL_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|svg|avif)$/i;
function normalizeText(value) {
  return String(value || '').trim();
}
function firstText(...list) {
  return list.map(normalizeText).find(Boolean) || '';
}
function resolveThumbnailLocalPath(response = {}) {
  for (const item of [
    response.posterLocalPath,
    response.thumbLocalPath,
    response.thumbnailLocalPath,
    response.localPath,
    response.path,
    response.posterUrl,
    response.thumbUrl,
    response.thumbnailUrl,
    response.url,
  ]) {
    const resultLocalPath = pickResultLocalPath(item);
    if (resultLocalPath && IMAGE_THUMBNAIL_EXTENSION_RE.test(resultLocalPath)) return resultLocalPath;
  }
  return '';
}
function getInflightMap(key) {
  let enabled = inflightByFetcher.get(key);
  return (!enabled && ((enabled = new Map()), inflightByFetcher.set(key, enabled)), enabled);
}
function fetchThumbnailFields(videoThumbSrc, handler) {
  const map = getInflightMap(handler),
    index = map.get(videoThumbSrc);
  if (index) return index;
  let result;
  return (
    (result = Promise.resolve()
      .then(() => handler(videoThumbSrc))
      .then((data) => {
        const posterLocalPath = resolveThumbnailLocalPath(data);
        if (!posterLocalPath) throw new Error('视频首帧服务未返回本地缩略图');
        const posterUrl = localPathToUrl(posterLocalPath);
        return {
          posterUrl: posterUrl,
          thumbUrl: posterUrl,
          posterLocalPath: posterLocalPath,
          thumbLocalPath: posterLocalPath,
          videoThumbSrc: videoThumbSrc,
        };
      })
      .finally(() => {
        if (map.get(videoThumbSrc) === result) map.delete(videoThumbSrc);
      })),
    map.set(videoThumbSrc, result),
    result
  );
}
export function resolveVideoResultThumbnailSource(response2 = {}) {
  if (!response2 || typeof response2 !== 'object' || Array.isArray(response2)) return '';
  for (const options of [response2.localPath, response2.displayLocalPath]) {
    const resultLocalPath2 = pickResultLocalPath(options);
    if (resultLocalPath2) return localPathToUrl(resultLocalPath2);
  }
  for (const target of [response2.videoUrl, response2.url, response2.displayUrl]) {
    const localPath = urlToLocalPath(target);
    if (localPath) return localPathToUrl(localPath);
  }
  return '';
}
export function hasStableVideoResultThumbnail(posterLocalPath2 = {}) {
  return Boolean(
    resolveThumbnailLocalPath({
      posterLocalPath: posterLocalPath2?.posterLocalPath,
      thumbLocalPath: posterLocalPath2?.thumbLocalPath,
      thumbnailLocalPath: posterLocalPath2?.thumbnailLocalPath,
      posterUrl: posterLocalPath2?.posterUrl,
      thumbUrl: posterLocalPath2?.thumbUrl,
      thumbnailUrl: posterLocalPath2?.thumbnailUrl,
    }),
  );
}
export function needsVideoResultThumbnail(options2 = {}) {
  return Boolean(resolveVideoResultThumbnailSource(options2) && !hasStableVideoResultThumbnail(options2));
}
export async function ensureVideoResultThumbnail(
  sourceThumbUrl = {},
  { fetchThumbnail: fetchThumbnail = fetchVideoFirstFrameThumbFromServer } = {},
) {
  if (!needsVideoResultThumbnail(sourceThumbUrl)) return sourceThumbUrl;
  const videoResultThumbnailSource = resolveVideoResultThumbnailSource(sourceThumbUrl),
    args = await fetchThumbnailFields(videoResultThumbnailSource, fetchThumbnail),
    text = firstText(sourceThumbUrl.thumbUrl, sourceThumbUrl.thumbnailUrl, sourceThumbUrl.posterUrl),
    text2 = firstText(sourceThumbUrl.posterUrl, sourceThumbUrl.coverUrl);
  return {
    ...sourceThumbUrl,
    ...(text && !urlToLocalPath(text) ? { sourceThumbUrl: sourceThumbUrl.sourceThumbUrl || text } : {}),
    ...(text2 && !urlToLocalPath(text2)
      ? { sourcePosterUrl: sourceThumbUrl.sourcePosterUrl || text2 }
      : {}),
    ...args,
  };
}
