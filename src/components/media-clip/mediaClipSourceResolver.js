import { buildApiUrl } from '../../../api/apiBase.js';
import {
  resolveCanvasAudioUrl,
  resolveCanvasImagePreviewUrl,
  resolveCanvasImageSourceUrl,
  resolveCanvasVideoUrl,
} from '../../services/canvasMediaLocalService.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolveMediaClipDimensions } from './mediaClipState.js';
import { firstNonEmpty, normalizeText, toNumber } from './mediaClipUtils.js';
import { isRenderableUrl, isUsableMediaElement } from './mediaClipMediaElement.js';
export function downloadLocalPath(value, item = '') {
  const text = normalizeText(value);
  if (!text) return;
  const el = document.createElement('a');
  ((el.href = localPathToUrl(text) || '/' + text.replace(/^\/+/, '')),
    (el.download = item || text.split(/[\\/]/).pop() || 'clip'),
    (el.rel = 'noopener'),
    document.body.appendChild(el),
    el.click(),
    el.remove());
}
export function toPlayableMediaUrl(key) {
  const text2 = normalizeText(key);
  if (!text2) return '';
  if (/^(?:https?:|data:|blob:|aic-local-preview:)/i.test(text2)) return text2;
  const url = localPathToUrl(text2),
    index = url || (text2.startsWith('/') ? text2 : '');
  return index ? buildApiUrl(index) : '';
}
export function resolveLiveMediaElementUrl(options = {}, result = 'video') {
  const text3 = normalizeText(options?.id);
  if (!text3 || typeof document === 'undefined' || typeof document.getElementById !== 'function') return '';
  const el2 = document.getElementById(text3);
  if (!el2) return '';
  const data = Array.from(el2.querySelectorAll(result));
  let enabled = '';
  for (const target of data) {
    const nonEmpty = firstNonEmpty(target.currentSrc, target.getAttribute?.('src'), target.src),
      toPlayableMediaUrl2 = toPlayableMediaUrl(nonEmpty) || (isRenderableUrl(nonEmpty) ? nonEmpty : '');
    if (!toPlayableMediaUrl2) continue;
    if (!enabled) enabled = toPlayableMediaUrl2;
    if (isUsableMediaElement(target)) return toPlayableMediaUrl2;
  }
  return enabled;
}
export function getSourceDataCandidates(enabled2 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return [];
  const list = [],
    handler = (enabled3) => {
      if (!enabled3 || typeof enabled3 !== 'object') return;
      if (list.includes(enabled3)) return;
      list.push(enabled3);
    };
  (handler(enabled2), handler(enabled2.nodeData), handler(enabled2.data), handler(enabled2._data));
  for (let source = 0; source < list.length; source += 1) {
    const next = list[source];
    (handler(next.nodeData), handler(next.data), handler(next._data));
    const list2 = Array.isArray(next.videos) ? next.videos : [],
      current = Number(next.mainVideoIndex),
      entry = Number.isFinite(current) ? Math.max(0, Math.trunc(current)) : 0;
    (handler(list2[entry]), list2.forEach(handler));
  }
  return list;
}
export function resolveNestedMediaUrl(record, handler2, payload = []) {
  for (const handle of getSourceDataCandidates(record)) {
    const text4 = normalizeText(handler2(handle));
    if (text4) return toPlayableMediaUrl(text4) || text4;
    for (const state of payload) {
      const text5 = normalizeText(handle?.[state]);
      if (!text5) continue;
      const toPlayableMediaUrl3 = toPlayableMediaUrl(text5);
      if (toPlayableMediaUrl3) return toPlayableMediaUrl3;
      if (isRenderableUrl(text5)) return text5;
    }
  }
  return '';
}
export function resolveMediaClipVideoUrl(options2 = {}) {
  return (
    resolveLiveMediaElementUrl(options2, 'video') ||
    resolveNestedMediaUrl(options2, resolveCanvasVideoUrl, [
      'displayLocalPath',
      'videoMetaSrc',
      'videoLocalPath',
      'videoUrl',
      'src',
      'localUrl',
      'url',
      'resultUrl',
      'sourceUrl',
      'localPath',
      'originalLocalPath',
      'capturePreviewUrl',
      'playbackUrl',
      'mediaUrl',
    ])
  );
}
export function resolveMediaClipAudioUrl(options3 = {}) {
  return (
    resolveLiveMediaElementUrl(options3, 'audio') ||
    resolveNestedMediaUrl(options3, resolveCanvasAudioUrl, [
      'audioLocalPath',
      'audioUrl',
      'src',
      'localUrl',
      'url',
      'resultUrl',
      'sourceUrl',
      'localPath',
      'mediaUrl',
    ])
  );
}
export function resolveMediaClipWaveformUrl(options4 = {}) {
  for (const config of getSourceDataCandidates(options4)) {
    const nonEmpty2 = firstNonEmpty(config?.waveformLocalPath, config?.waveformUrl, config?.waveformJsonUrl);
    if (!nonEmpty2) continue;
    return (
      localPathToUrl(nonEmpty2) ||
      toPlayableMediaUrl(nonEmpty2) ||
      (isRenderableUrl(nonEmpty2) ? nonEmpty2 : '')
    );
  }
  return '';
}
export function resolveMediaClipImageUrl(options5 = {}) {
  return (
    resolveNestedMediaUrl(options5, resolveCanvasImagePreviewUrl, [
      'displayLocalPath',
      'imageUrl',
      'sourceUrl',
      'thumbUrl',
      'src',
      'localUrl',
      'url',
      'resultUrl',
      'localPath',
      'originalLocalPath',
      'thumbLocalPath',
    ]) ||
    resolveNestedMediaUrl(options5, resolveCanvasImageSourceUrl, [
      'imageUrl',
      'sourceUrl',
      'src',
      'localPath',
      'originalLocalPath',
    ])
  );
}
export function resolveMediaClipThumbUrl(options6 = {}) {
  for (const scope of getSourceDataCandidates(options6)) {
    const nonEmpty3 = firstNonEmpty(
      scope.thumbUrl,
      scope.thumbnailUrl,
      scope.posterUrl,
      scope.imageUrl,
      scope.sourceUrl,
      scope.videoThumbSrc,
      scope.videoMetaSrc,
      scope.coverUrl,
      scope.src,
    );
    if (nonEmpty3) {
      const toPlayableMediaUrl4 = toPlayableMediaUrl(nonEmpty3);
      if (toPlayableMediaUrl4) return toPlayableMediaUrl4;
      if (isRenderableUrl(nonEmpty3)) return nonEmpty3;
    }
    const nonEmpty4 = firstNonEmpty(
        scope.posterLocalPath,
        scope.thumbLocalPath,
        scope.coverLocalPath,
        scope.displayLocalPath,
        scope.localPath,
      ),
      toPlayableMediaUrl5 = toPlayableMediaUrl(nonEmpty4);
    if (toPlayableMediaUrl5) return toPlayableMediaUrl5;
  }
  return '';
}
export function resolveMediaClipPosterImageFields(options7 = {}, input = {}, output = {}) {
  const thumbUrl = (value2) => {
      const text6 = normalizeText(value2);
      if (!text6) return '';
      return toPlayableMediaUrl(text6) || (isRenderableUrl(text6) ? text6 : '');
    },
    nonEmpty5 = firstNonEmpty(input.thumbUrl, input.posterUrl, output.thumbUrl, output.posterUrl),
    nonEmpty6 = firstNonEmpty(
      input.thumbLocalPath,
      input.posterLocalPath,
      output.thumbLocalPath,
      output.posterLocalPath,
    );
  if (nonEmpty5 || nonEmpty6)
    return {
      thumbUrl: thumbUrl(nonEmpty5 || nonEmpty6),
      posterUrl: thumbUrl(nonEmpty5 || nonEmpty6),
      thumbLocalPath: normalizeText(nonEmpty6),
      posterLocalPath: normalizeText(nonEmpty6),
      isOutputPoster: true,
    };
  for (const value3 of getSourceDataCandidates(options7)) {
    const nonEmpty7 = firstNonEmpty(value3.thumbUrl, value3.thumbnailUrl, value3.posterUrl, value3.coverUrl),
      nonEmpty8 = firstNonEmpty(value3.thumbLocalPath, value3.posterLocalPath, value3.coverLocalPath);
    if (nonEmpty7 || nonEmpty8) {
      const thumbUrl2 = thumbUrl(nonEmpty7 || nonEmpty8);
      return {
        thumbUrl: thumbUrl2,
        posterUrl: thumbUrl2,
        thumbLocalPath: normalizeText(nonEmpty8),
        posterLocalPath: normalizeText(nonEmpty8),
        isOutputPoster: false,
      };
    }
  }
  return { thumbUrl: '', posterUrl: '', thumbLocalPath: '', posterLocalPath: '', isOutputPoster: false };
}
export function resolveMediaClipOutputVideoDimensions(options8 = {}, box = {}) {
  const width = toNumber(box.videoWidth, 0),
    height = toNumber(box.videoHeight, 0);
  if (width > 0 && height > 0) return { width: width, height: height };
  const width2 = toNumber(box.width, 0),
    height2 = toNumber(box.height, 0);
  if (width2 > 0 && height2 > 0) return { width: width2, height: height2 };
  return resolveMediaClipDimensions(options8);
}
export function collectMediaClipFrameUrls(options9 = {}) {
  const list3 = [],
    map = new Set(),
    handler3 = (value4) => {
      const text7 = normalizeText(value4);
      if (!text7) return;
      const toPlayableMediaUrl6 = toPlayableMediaUrl(text7) || (isRenderableUrl(text7) ? text7 : '');
      if (!toPlayableMediaUrl6 || map.has(toPlayableMediaUrl6)) return;
      (map.add(toPlayableMediaUrl6), list3.push(toPlayableMediaUrl6));
    },
    handler4 = (response, value5 = {}) => {
      if (!response) return;
      if (typeof response === 'string') {
        handler3(response);
        return;
      }
      if (typeof response !== 'object') return;
      handler3(
        firstNonEmpty(
          response.thumbUrl,
          response.thumbnailUrl,
          response.posterUrl,
          response.imageUrl,
          response.sourceUrl,
          response.url,
          response.src,
          response.thumbLocalPath,
          response.posterLocalPath,
          value5.allowLocalPath === true ? response.localPath : '',
        ),
      );
    };
  for (const value6 of getSourceDataCandidates(options9)) {
    ([
      value6.frameThumbUrls,
      value6.frameThumbnailUrls,
      value6.thumbnailUrls,
      value6.thumbUrls,
      value6.posterUrls,
      value6.frames,
      value6.thumbnails,
      value6.videoFrames,
    ].forEach((list4) => {
      Array.isArray(list4) && list4.forEach((item2) => handler4(item2, { allowLocalPath: true }));
    }),
      handler4(value6));
  }
  const mediaClipThumbUrl = resolveMediaClipThumbUrl(options9);
  if (mediaClipThumbUrl) handler3(mediaClipThumbUrl);
  return list3;
}
export function resolveMediaClipLocalPath(options10 = {}) {
  for (const response2 of getSourceDataCandidates(options10)) {
    const nonEmpty9 = firstNonEmpty(
      response2.localPath,
      response2.originalLocalPath,
      response2.displayLocalPath,
      response2.videoLocalPath,
      response2.audioLocalPath,
      response2.imageUrl,
      response2.sourceUrl,
      response2.src,
      response2.url,
      response2.resultUrl,
    );
    if (nonEmpty9) return nonEmpty9;
  }
  return '';
}
