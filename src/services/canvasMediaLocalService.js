import {
  buildImageNodeStorageFields,
  pickCanvasImageLocalPath,
  pickCanvasThumbLocalPath,
  pickPreviewFallbackLocalPath,
  pickPreviewImageLocalPath,
  toLocalPathUrl,
} from './imageDerivativeService.js';
import { isSafeVirtualLocalPath, localPathToUrl, normalizeLocalPath } from '../utils/localMediaPath.js';
const REMOTE_HTTP_RE = /^https?:\/\//i,
  IMAGE_NODE_TYPES = new Set(['source-image', 'image', 'ai-image']),
  VIDEO_NODE_TYPES = new Set(['source-video', 'video', 'ai-video']),
  AUDIO_NODE_TYPES = new Set(['source-audio', 'audio', 'ai-audio']),
  IMAGE_TRIGGER_KEYS = [
    'src',
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'url',
    'resultUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
  ],
  VIDEO_TRIGGER_KEYS = [
    'src',
    'videoUrl',
    'thumbUrl',
    'url',
    'resultUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'posterLocalPath',
    'videoThumbSrc',
    'videoMetaSrc',
  ],
  AUDIO_TRIGGER_KEYS = ['src', 'audioUrl', 'url', 'resultUrl', 'localPath'];
function hasOwn(enabled, item) {
  return !!enabled && Object.prototype.hasOwnProperty.call(enabled, item);
}
function normalizeText(key) {
  return String(key || '').trim();
}
function firstNonEmptyString(...args) {
  for (const index of args) {
    const text = normalizeText(index);
    if (text) return text;
  }
  return '';
}
function touchesAnyKey(result, list) {
  return Array.isArray(list) && list.some((item2) => hasOwn(result, item2));
}
function normalizeLocalUrlText(data) {
  const canvasLocalPath = normalizeCanvasLocalPath(data);
  return localPathToUrl(canvasLocalPath);
}
function pickLocalPath(options, target) {
  for (const source of target) {
    const canvasLocalPath2 = normalizeCanvasLocalPath(options?.[source]);
    if (canvasLocalPath2) return canvasLocalPath2;
  }
  return '';
}
function copyCommonImageMeta(next, current) {
  if (hasOwn(current, 'assetId')) next.assetId = normalizeText(current.assetId);
  if (hasOwn(current, 'sourceId')) next.sourceId = normalizeText(current.sourceId);
  if (hasOwn(current, 'thumbId')) next.thumbId = normalizeText(current.thumbId);
  if (hasOwn(current, 'fileName')) next.fileName = current.fileName;
  if (hasOwn(current, 'error')) next.error = current.error;
  hasOwn(current, 'derivativeStatus') && (next.derivativeStatus = normalizeText(current.derivativeStatus));
}
function copyCommonVideoMeta(entry, record) {
  if (hasOwn(record, 'assetId')) entry.assetId = normalizeText(record.assetId);
  if (hasOwn(record, 'fileName')) entry.fileName = record.fileName;
  if (hasOwn(record, 'thumbId')) entry.thumbId = normalizeText(record.thumbId);
  hasOwn(record, 'videoProxyStatus') && (entry.videoProxyStatus = normalizeText(record.videoProxyStatus));
  if (hasOwn(record, 'videoCodec')) entry.videoCodec = normalizeText(record.videoCodec);
  if (hasOwn(record, 'videoWidth')) entry.videoWidth = Number(record.videoWidth || 0) || 0;
  if (hasOwn(record, 'videoHeight')) entry.videoHeight = Number(record.videoHeight || 0) || 0;
  if (hasOwn(record, 'videoDuration')) entry.videoDuration = Number(record.videoDuration || 0) || 0;
  if (hasOwn(record, 'videoFps')) entry.videoFps = Number(record.videoFps || 0) || 0;
  hasOwn(record, 'derivativeStatus') && (entry.derivativeStatus = normalizeText(record.derivativeStatus));
}
function buildNormalizedImageStorage(args2 = {}) {
  const localPath = pickLocalPath(args2, [
      'localPath',
      'originalLocalPath',
      'displayLocalPath',
      'imageUrl',
      'sourceUrl',
      'src',
      'url',
      'resultUrl',
    ]),
    originalLocalPath = pickLocalPath(args2, [
      'originalLocalPath',
      'localPath',
      'sourceUrl',
      'imageUrl',
      'src',
      'url',
      'resultUrl',
    ]),
    displayLocalPath = pickLocalPath(args2, ['displayLocalPath', 'imageUrl', 'src', 'url', 'resultUrl']),
    thumbLocalPath = pickLocalPath(args2, ['thumbLocalPath', 'thumbUrl']);
  return buildImageNodeStorageFields({
    ...args2,
    localPath: localPath,
    originalLocalPath: originalLocalPath,
    displayLocalPath: displayLocalPath,
    thumbLocalPath: thumbLocalPath,
  });
}
export function resolveCanvasImageSourceUrl(options2 = {}) {
  const normalizedImageStorage = buildNormalizedImageStorage(options2),
    previewImageLocalPath =
      pickPreviewImageLocalPath(normalizedImageStorage) ||
      normalizedImageStorage.originalLocalPath ||
      normalizedImageStorage.localPath;
  return toLocalPathUrl(previewImageLocalPath);
}
function resolveCanvasImageDisplayPath(options3 = {}) {
  return pickCanvasImageLocalPath(buildNormalizedImageStorage(options3));
}
function resolveCanvasImageThumbPath(options4 = {}) {
  return pickCanvasThumbLocalPath(buildNormalizedImageStorage(options4));
}
export function isRemoteHttpUrl(payload) {
  return REMOTE_HTTP_RE.test(normalizeText(payload));
}
export function normalizeCanvasLocalPath(handle) {
  return normalizeLocalPath(handle);
}
export function toCanvasLocalUrl(state) {
  return localPathToUrl(state);
}
export function resolveCanvasImageDisplayUrl(options5 = {}) {
  return toLocalPathUrl(resolveCanvasImageDisplayPath(options5));
}
export function resolveCanvasImageThumbUrl(options6 = {}) {
  return toLocalPathUrl(resolveCanvasImageThumbPath(options6));
}
export function resolveCanvasImageLowZoomUrl(options7 = {}) {
  return (
    resolveCanvasImageThumbUrl(options7) ||
    resolveCanvasImageDisplayUrl(options7) ||
    resolveCanvasImageSourceUrl(options7)
  );
}
export function resolveCanvasImagePreviewUrl(options8 = {}) {
  const normalizedImageStorage2 = buildNormalizedImageStorage(options8),
    nonEmptyString = firstNonEmptyString(
      pickPreviewImageLocalPath(normalizedImageStorage2),
      pickPreviewFallbackLocalPath(normalizedImageStorage2),
    );
  return toLocalPathUrl(nonEmptyString);
}
export function resolveCanvasVideoLocalPath(options9 = {}) {
  const localPath2 = pickLocalPath(options9, ['displayLocalPath']);
  if (localPath2) return localPath2;
  const text2 = normalizeText(options9?.videoProxyStatus);
  if (text2 === 'processing' || text2 === 'waiting') return '';
  return pickLocalPath(options9, ['src', 'videoUrl', 'url', 'resultUrl', 'localPath']);
}
export function resolveCanvasVideoUrl(options10 = {}) {
  return toCanvasLocalUrl(resolveCanvasVideoLocalPath(options10));
}
function normalizeCanvasVideoPosterUrl(value, { localOnly = false } = {}) {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (
    /^data:image\//i.test(normalized) ||
    /^blob:/i.test(normalized) ||
    /^aic-local-preview:/i.test(normalized)
  ) {
    return normalized;
  }
  if (/^(?:https?:|file:)/i.test(normalized)) return '';
  const localUrl = localPathToUrl(normalized);
  if (localUrl) return localUrl;
  return localOnly ? '' : normalized;
}
export function resolveCanvasVideoPosterUrl(options11 = {}) {
  const videos = Array.isArray(options11?.videos) ? options11.videos : [],
    mainIndex = Math.max(0, Number(options11?.mainVideoIndex) || 0),
    mainVideo = videos[mainIndex] || videos[0] || null,
    candidates = [
      [mainVideo?.posterLocalPath, true],
      [mainVideo?.previewLocalPath, true],
      [mainVideo?.thumbLocalPath, true],
      [mainVideo?.thumbnailLocalPath, true],
      [mainVideo?.posterUrl, false],
      [mainVideo?.previewUrl, false],
      [mainVideo?.thumbUrl, false],
      [mainVideo?.thumbnailUrl, false],
      [options11?.posterLocalPath, true],
      [options11?.previewLocalPath, true],
      [options11?.thumbLocalPath, true],
      [options11?.thumbnailLocalPath, true],
      [options11?.posterUrl, false],
      [options11?.previewUrl, false],
      [options11?.thumbUrl, false],
      [options11?.thumbnailUrl, false],
    ];
  for (const [value, localOnly] of candidates) {
    const resolved = normalizeCanvasVideoPosterUrl(value, { localOnly });
    if (resolved) return resolved;
  }
  return '';
}
export function resolveCanvasAudioLocalPath(options12 = {}) {
  return pickLocalPath(options12, ['localPath', 'audioUrl', 'src', 'url', 'resultUrl']);
}
export function resolveCanvasAudioUrl(options13 = {}) {
  return toCanvasLocalUrl(resolveCanvasAudioLocalPath(options13));
}
export function buildCanvasLocalImageFields(options14 = {}, config = {}) {
  const normalizedImageStorage3 = buildNormalizedImageStorage(options14),
    toLocalPathUrl2 = toLocalPathUrl(pickCanvasImageLocalPath(normalizedImageStorage3)),
    canvasImageSourceUrl = resolveCanvasImageSourceUrl(normalizedImageStorage3),
    toLocalPathUrl3 = toLocalPathUrl(pickCanvasThumbLocalPath(normalizedImageStorage3)),
    scope = config.includeSrc === true || hasOwn(options14, 'src'),
    input = config.includeCanonicalUrl === true || hasOwn(options14, 'url'),
    output = config.includeResultUrl === true || hasOwn(options14, 'resultUrl'),
    response = {};
  (hasOwn(options14, 'localPath') ||
    normalizedImageStorage3.localPath ||
    normalizedImageStorage3.originalLocalPath) &&
    ((response.localPath = normalizedImageStorage3.localPath || ''),
    (response.originalLocalPath = normalizedImageStorage3.originalLocalPath || ''));
  (hasOwn(options14, 'displayLocalPath') || normalizedImageStorage3.displayLocalPath) &&
    (response.displayLocalPath = normalizedImageStorage3.displayLocalPath || '');
  (hasOwn(options14, 'thumbLocalPath') ||
    hasOwn(options14, 'thumbUrl') ||
    normalizedImageStorage3.thumbLocalPath) &&
    (response.thumbLocalPath = normalizedImageStorage3.thumbLocalPath || '');
  (touchesAnyKey(options14, [
    'imageUrl',
    'sourceUrl',
    'thumbUrl',
    'localPath',
    'originalLocalPath',
    'displayLocalPath',
    'thumbLocalPath',
    'src',
    'url',
    'resultUrl',
  ]) ||
    toLocalPathUrl2 ||
    canvasImageSourceUrl ||
    toLocalPathUrl3) &&
    ((response.imageUrl = toLocalPathUrl2 || ''),
    (response.sourceUrl = canvasImageSourceUrl || ''),
    (response.thumbUrl = toLocalPathUrl3 || ''));
  if (scope) response.src = toLocalPathUrl2 || '';
  if (input) response.url = toLocalPathUrl2 || '';
  if (output) response.resultUrl = toLocalPathUrl2 || '';
  return (copyCommonImageMeta(response, options14), response);
}
export function buildCanvasLocalVideoFields(options11 = {}, value2 = {}) {
  const localPath3 = pickLocalPath(options11, [
      'localPath',
      'originalLocalPath',
      'videoUrl',
      'src',
      'url',
      'resultUrl',
    ]),
    localPath4 = pickLocalPath(options11, ['originalLocalPath']),
    localPath5 = pickLocalPath(options11, ['displayLocalPath']),
    canvasVideoLocalPath = resolveCanvasVideoLocalPath(options11),
    toLocalPathUrl4 = toLocalPathUrl(canvasVideoLocalPath),
    toCanvasLocalUrl2 = toCanvasLocalUrl(options11?.thumbUrl),
    localPath6 = pickLocalPath(options11, ['posterLocalPath']),
    toLocalPathUrl5 = toLocalPathUrl(localPath6),
    toCanvasLocalUrl3 = toCanvasLocalUrl(options11?.videoThumbSrc || canvasVideoLocalPath),
    value3 = value2.includeCanonicalUrl === true || hasOwn(options11, 'url'),
    value4 = value2.includeResultUrl === true || hasOwn(options11, 'resultUrl'),
    response2 = {};
  (hasOwn(options11, 'localPath') ||
    hasOwn(options11, 'videoUrl') ||
    hasOwn(options11, 'src') ||
    hasOwn(options11, 'url') ||
    hasOwn(options11, 'resultUrl') ||
    hasOwn(options11, 'displayLocalPath') ||
    canvasVideoLocalPath) &&
    ((hasOwn(options11, 'localPath') ||
      hasOwn(options11, 'videoUrl') ||
      hasOwn(options11, 'src') ||
      hasOwn(options11, 'url') ||
      hasOwn(options11, 'resultUrl') ||
      localPath3) &&
      (response2.localPath = localPath3 || ''),
    (hasOwn(options11, 'originalLocalPath') || localPath4) &&
      (response2.originalLocalPath = localPath4 || ''),
    (hasOwn(options11, 'displayLocalPath') || localPath5) && (response2.displayLocalPath = localPath5 || ''),
    (response2.videoUrl = toLocalPathUrl4 || ''),
    (response2.src = toLocalPathUrl4 || ''));
  (hasOwn(options11, 'thumbUrl') || toCanvasLocalUrl2) &&
    (response2.thumbUrl = toCanvasLocalUrl2 || toLocalPathUrl5 || '');
  if (hasOwn(options11, 'posterLocalPath') || localPath6) {
    response2.posterLocalPath = localPath6 || '';
    if (!response2.thumbUrl) response2.thumbUrl = toLocalPathUrl5 || '';
  }
  hasOwn(options11, 'videoThumbSrc') && (response2.videoThumbSrc = toCanvasLocalUrl3 || '');
  hasOwn(options11, 'videoMetaSrc') &&
    (response2.videoMetaSrc = toCanvasLocalUrl(options11.videoMetaSrc || canvasVideoLocalPath));
  if (value3) response2.url = toLocalPathUrl4 || '';
  if (value4) response2.resultUrl = toLocalPathUrl4 || '';
  return (copyCommonVideoMeta(response2, options11), response2);
}
export function buildCanvasLocalAudioFields(options15 = {}, value5 = {}) {
  const canvasAudioLocalPath = resolveCanvasAudioLocalPath(options15),
    toLocalPathUrl6 = toLocalPathUrl(canvasAudioLocalPath),
    localPath7 = pickLocalPath(options15, ['waveformLocalPath']),
    value6 = value5.includeCanonicalUrl === true || hasOwn(options15, 'url'),
    value7 = value5.includeResultUrl === true || hasOwn(options15, 'resultUrl'),
    response3 = {};
  (hasOwn(options15, 'localPath') ||
    hasOwn(options15, 'audioUrl') ||
    hasOwn(options15, 'src') ||
    hasOwn(options15, 'url') ||
    hasOwn(options15, 'resultUrl') ||
    canvasAudioLocalPath) &&
    ((response3.localPath = canvasAudioLocalPath || ''),
    (response3.audioUrl = toLocalPathUrl6 || ''),
    (response3.src = toLocalPathUrl6 || ''));
  if (value6) response3.url = toLocalPathUrl6 || '';
  if (value7) response3.resultUrl = toLocalPathUrl6 || '';
  (hasOwn(options15, 'waveformLocalPath') || localPath7) && (response3.waveformLocalPath = localPath7 || '');
  if (hasOwn(options15, 'assetId')) response3.assetId = normalizeText(options15.assetId);
  hasOwn(options15, 'derivativeStatus') &&
    (response3.derivativeStatus = normalizeText(options15.derivativeStatus));
  if (hasOwn(options15, 'fileName')) response3.fileName = options15.fileName;
  return response3;
}
function normalizeImageCollection(list2) {
  if (!Array.isArray(list2)) return list2;
  return list2.map((args3) => {
    if (!args3 || typeof args3 !== 'object') return args3;
    return {
      ...args3,
      ...buildCanvasLocalImageFields(args3, {
        includeSrc: hasOwn(args3, 'src'),
        includeCanonicalUrl: hasOwn(args3, 'url'),
        includeResultUrl: hasOwn(args3, 'resultUrl'),
      }),
    };
  });
}
function normalizeVideoCollection(list3) {
  if (!Array.isArray(list3)) return list3;
  return list3.map((args4) => {
    if (!args4 || typeof args4 !== 'object') return args4;
    return {
      ...args4,
      ...buildCanvasLocalVideoFields(args4, {
        includeCanonicalUrl: hasOwn(args4, 'url'),
        includeResultUrl: hasOwn(args4, 'resultUrl'),
      }),
    };
  });
}
function validateUrlField(value8, value9) {
  const text3 = normalizeText(value9);
  if (!text3) return;
  if (normalizeLocalUrlText(text3) !== text3)
    throw new Error('[canvasMediaLocalService] ' + value8 + ' 必须是本地 URL');
}
function validatePathField(value10, value11) {
  const text4 = normalizeText(value11);
  if (!text4) return;
  const canvasLocalPath3 = normalizeCanvasLocalPath(text4);
  if (!canvasLocalPath3 || !isSafeVirtualLocalPath(canvasLocalPath3))
    throw new Error('[canvasMediaLocalService] ' + value10 + ' 必须是本地路径');
}
export function assertCanvasMediaPatchLocalOnly(enabled2 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return;
  const run = (enabled3) => {
    if (!enabled3 || typeof enabled3 !== 'object') return;
    for (const value12 of [
      'src',
      'imageUrl',
      'sourceUrl',
      'thumbUrl',
      'videoUrl',
      'audioUrl',
      'url',
      'resultUrl',
      'videoThumbSrc',
      'videoMetaSrc',
    ]) {
      if (hasOwn(enabled3, value12)) validateUrlField(value12, enabled3[value12]);
    }
    for (const value13 of [
      'localPath',
      'originalLocalPath',
      'displayLocalPath',
      'thumbLocalPath',
      'posterLocalPath',
      'waveformLocalPath',
      'path',
    ]) {
      if (hasOwn(enabled3, value13)) validatePathField(value13, enabled3[value13]);
    }
  };
  run(enabled2);
  if (Array.isArray(enabled2.images)) {
    for (const value14 of enabled2.images) run(value14);
  }
  if (Array.isArray(enabled2.videos)) {
    for (const value15 of enabled2.videos) run(value15);
  }
}
export function sanitizeCanvasNodeMediaPatchForStore(args5 = {}, value16 = null) {
  if (!args5 || typeof args5 !== 'object' || Array.isArray(args5)) return args5;
  const text5 = normalizeText(args5.type || value16?.type),
    value17 = { ...args5 };
  hasOwn(args5, 'images') && (value17.images = normalizeImageCollection(args5.images));
  hasOwn(args5, 'videos') && (value17.videos = normalizeVideoCollection(args5.videos));
  const hasOwn2 =
    hasOwn(args5, 'images') ||
    touchesAnyKey(args5, IMAGE_TRIGGER_KEYS) ||
    (IMAGE_NODE_TYPES.has(text5) && touchesAnyKey(args5, ['src', 'localPath', 'fileName']));
  hasOwn2 &&
    Object.assign(
      value17,
      buildCanvasLocalImageFields(args5, {
        includeSrc: hasOwn(args5, 'src') || IMAGE_NODE_TYPES.has(text5),
        includeCanonicalUrl: hasOwn(args5, 'url'),
        includeResultUrl: hasOwn(args5, 'resultUrl'),
      }),
    );
  const hasOwn3 =
    hasOwn(args5, 'videos') ||
    touchesAnyKey(args5, [
      'videoUrl',
      'videoThumbSrc',
      'videoMetaSrc',
      'posterLocalPath',
      'videoProxyStatus',
    ]) ||
    (VIDEO_NODE_TYPES.has(text5) && touchesAnyKey(args5, VIDEO_TRIGGER_KEYS));
  hasOwn3 &&
    Object.assign(
      value17,
      buildCanvasLocalVideoFields(args5, {
        includeCanonicalUrl: hasOwn(args5, 'url'),
        includeResultUrl: hasOwn(args5, 'resultUrl'),
      }),
    );
  const hasOwn4 =
    hasOwn(args5, 'audioUrl') ||
    (AUDIO_NODE_TYPES.has(text5) &&
      touchesAnyKey(args5, ['src', 'localPath', 'waveformLocalPath', 'fileName']));
  return (
    hasOwn4 &&
      Object.assign(
        value17,
        buildCanvasLocalAudioFields(args5, {
          includeCanonicalUrl: hasOwn(args5, 'url'),
          includeResultUrl: hasOwn(args5, 'resultUrl'),
        }),
      ),
    value17
  );
}
export const VIDEO_PROXY_VERSION_V2_1280 = 'v2-1280';

export function resolveCanvasVideoDisplayUrl(options16 = {}) {
  return resolveCanvasVideoUrl(options16);
}

export function buildCanvasVideoProxyPromotionPatch(options17 = {}) {
  const displayLocalPath2 = pickLocalPath(options17, ['pendingVideoProxyLocalPath']),
    videoProxyVersion = normalizeText(options17?.pendingVideoProxyVersion);
  if (!displayLocalPath2 || videoProxyVersion !== VIDEO_PROXY_VERSION_V2_1280) return null;
  return {
    ...buildCanvasLocalVideoFields({
      displayLocalPath: displayLocalPath2,
      videoProxyStatus: 'generated',
      videoProxyVersion: videoProxyVersion,
    }),
    pendingVideoProxyLocalPath: '',
    pendingVideoProxyVersion: '',
    videoProxyMigrationStatus: 'promoted',
    videoProxyMigrationError: '',
  };
}

function normalizeRemoteMediaFallback() {
  return '';
}

function normalizeAudioCollection(list4) {
  if (!Array.isArray(list4)) return list4;
  return list4.map((args6) => {
    if (!args6 || typeof args6 !== 'object') return args6;
    return {
      ...args6,
      ...buildCanvasLocalAudioFields(args6, {
        includeCanonicalUrl: hasOwn(args6, 'url'),
        includeResultUrl: hasOwn(args6, 'resultUrl'),
      }),
    };
  });
}
