import { shouldApplyMediaTaskEventToNode } from './mediaTaskService.js';
import { generateThumbnail } from '../modules/imageUtils.js';
import { WHITEBOARD_SIZE } from '../modules/whiteboard/whiteboardModel.js';
import { COMFY_NODE_SIZE } from '../modules/comfyui/comfyWorkflowModel.js';
import { STORY_WORKSPACE_SIZE } from '../modules/storyWorkspace/storyWorkspaceModel.js';
import { ensureLocalImageDerivatives, uploadFile } from './projectService.js';
import { buildImageNodeStorageFields } from './imageDerivativeService.js';
import appStore from '../core/stores/appStore.js';
import { screenToWorld } from '../core/math.js';
import { showError, showWarning } from './toastService.js';
import { setThumbnail } from './thumbnailCacheService.js';
import { installMediaTaskUpdateListener } from './mediaTaskService.js';
import { logDiagnosticEvent } from './diagnosticsService.js';
import { logDragImportProfile } from './dragImportDiagnostics.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { t } from '../i18n/index.js';
import {
  AI_GENERATION_NODE_SHORT_SIDE,
  AI_TEXT_DEFAULT_RATIO,
  MEDIA_CLIP_COMPACT_SIZE,
  SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE,
} from './mediaSizingPolicy.js';
import { WEB_PREVIEW_MIN_SIZE } from '../modules/webPreviewSizing.js';
export {
  AI_GENERATION_NODE_SHORT_SIDE,
  AI_TEXT_DEFAULT_RATIO,
  MEDIA_CLIP_COMPACT_SIZE,
  SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE,
} from './mediaSizingPolicy.js';
function _toOneLineMessage(error) {
  const value =
    typeof error === 'string'
      ? error
      : error?.message
        ? String(error.message)
        : t('fileService.unknownError');
  return value.replace(/\s+/g, ' ').trim();
}
function _profileDragImport(item, key = {}) {
  logDragImportProfile(item, key);
}
let _assetUpdatedListenerInstalled = false;
function installElectronAssetUpdatedListener() {
  if (_assetUpdatedListenerInstalled) return;
  _assetUpdatedListenerInstalled = true;
  const run = globalThis.window?.electronAPI?.onAssetUpdated;
  if (typeof run !== 'function') return;
  run((localPath) => {
    const assetId = String(localPath?.assetId || '').trim();
    if (!assetId) return;
    const index = appStore.getState()?.nodes || {},
      result = {
        assetId: assetId,
        localPath: localPath?.localPath || localPath?.originalLocalPath || '',
        originalLocalPath: localPath?.originalLocalPath || localPath?.localPath || '',
        displayLocalPath: localPath?.displayLocalPath || '',
        thumbLocalPath: localPath?.thumbLocalPath || localPath?.posterLocalPath || '',
        posterLocalPath: localPath?.posterLocalPath || '',
        waveformLocalPath: localPath?.waveformLocalPath || '',
        derivativeStatus: localPath?.derivativeStatus || localPath?.status || '',
        mediaTaskId: localPath?.mediaTaskId || '',
        mediaTaskKind: localPath?.mediaTaskKind || '',
        mediaTaskStatus: localPath?.mediaTaskStatus || '',
        mediaTaskProgress: Number(localPath?.mediaTaskProgress || 0) || 0,
        mediaTaskError: localPath?.mediaTaskError || '',
        videoProxyStatus: localPath?.videoProxyStatus || '',
        videoCodec: localPath?.videoCodec || '',
        videoWidth: Number(localPath?.videoWidth || localPath?.width || 0) || 0,
        videoHeight: Number(localPath?.videoHeight || localPath?.height || 0) || 0,
        videoDuration: Number(localPath?.videoDuration || 0) || 0,
        videoFps: Number(localPath?.videoFps || 0) || 0,
      };
    if (localPath?.kind === 'image')
      ((result.src = localPath?.displayUrl || localPath?.url || ''),
        (result.imageUrl = localPath?.displayUrl || localPath?.url || ''),
        (result.sourceUrl = localPath?.originalUrl || ''),
        (result.thumbUrl = localPath?.thumbUrl || ''));
    else {
      if (localPath?.kind === 'video')
        ((result.src = localPath?.originalUrl || localPath?.url || ''),
          (result.videoUrl = localPath?.originalUrl || localPath?.url || ''),
          (result.thumbUrl = localPath?.posterUrl || localPath?.thumbUrl || ''));
      else
        localPath?.kind === 'audio' &&
          ((result.src = localPath?.originalUrl || localPath?.url || ''),
          (result.audioUrl = localPath?.originalUrl || localPath?.url || ''));
    }
    Object.values(index).forEach((item2) => {
      if (String(item2?.assetId || '').trim() !== assetId) return;
      appStore.updateNodeData(item2.id, result);
    });
  });
}
(installElectronAssetUpdatedListener(), installMediaTaskUpdateListener());
export function getBaseName(data) {
  const options = String(data || '').trim();
  return options.replace(/\.[^/.]+$/, '');
}
function getDefaultNodeName(target) {
  const source = {
    'source-image': t('fileService.defaultNames.image'),
    'source-video': t('fileService.defaultNames.video'),
    'source-audio': t('fileService.defaultNames.audio'),
    'media-clip': t('fileService.defaultNames.mediaClip'),
    'source-text': t('fileService.defaultNames.text'),
  };
  return source[target] || t('fileService.defaultNames.file');
}
export function getNodeTypeByFile(error2) {
  if (error2.type.startsWith('image/')) return 'source-image';
  if (error2.type.startsWith('video/')) return 'source-video';
  if (error2.type.startsWith('audio/')) return 'source-audio';
  if (error2.type === 'text/plain' || error2.name.endsWith('.txt')) return 'source-text';
  return null;
}
export function getNodeDefaultSize(next) {
  const current = {
    'source-image': { width: 0x200, height: 0x120 },
    'source-video': { width: 0x200, height: 0x120 },
    'web-preview': { ...WEB_PREVIEW_MIN_SIZE },
    'web-reference-card': { width: 0x1a4, height: 0x168 },
    'source-audio': { width: 0x140, height: 140 },
    'media-clip': { ...MEDIA_CLIP_COMPACT_SIZE },
    collage: { width: 0x240, height: 0x240 },
    whiteboard: { ...WHITEBOARD_SIZE },
    'comfyui-workflow': { ...COMFY_NODE_SIZE },
    'story-workspace': { ...STORY_WORKSPACE_SIZE },
    'source-text': { width: 0x200, height: 0x120 },
    'comment-note': { width: 0x104, height: 120 },
    'storyboard-script': { width: 0x400, height: 0x240 },
    'panorama-scene': { width: 0x400, height: 0x240 },
    'panorama-360': { width: 0x400, height: 0x240 },
  };
  return current[next] || { width: 0x140, height: 180 };
}
export function getAutoMediaSizeByShortSide(entry, record, payload = SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE) {
  const handle = Math.max(1, Number(entry) || 1),
    state = Math.max(1, Number(record) || 1),
    config = Math.max(1, Number(payload) || SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE),
    scope = Math.min(handle, state),
    input = config / scope;
  return {
    width: Math.max(1, Math.round(handle * input)),
    height: Math.max(1, Math.round(state * input)),
  };
}
export function getAIGenerationNodeSize(output, value2, value3 = AI_GENERATION_NODE_SHORT_SIDE) {
  const width2 = Math.max(1, Number(value3) || AI_GENERATION_NODE_SHORT_SIDE),
    count = Number(output) || 0,
    count2 = Number(value2) || 0;
  if (count > 0 && count2 > 0) return getAutoMediaSizeByShortSide(count, count2, width2);
  return { width: width2, height: width2 };
}
export function getAIGenerationDefaultSizeByType(value4, value5 = AI_GENERATION_NODE_SHORT_SIDE) {
  const value6 = String(value4 || '').trim();
  if (value6 === 'ai-text')
    return getAutoMediaSizeByShortSide(AI_TEXT_DEFAULT_RATIO.width, AI_TEXT_DEFAULT_RATIO.height, value5);
  if (value6 === 'ai-image' || value6 === 'ai-video')
    return getAIGenerationNodeSize(undefined, undefined, value5);
  return {
    width: Math.max(1, Number(value5) || AI_GENERATION_NODE_SHORT_SIDE),
    height: Math.max(1, Number(value5) || AI_GENERATION_NODE_SHORT_SIDE),
  };
}
export function buildSourceMediaNodePayload(id = {}) {
  const type = String(id.type || '').trim();
  if (type !== 'source-image' && type !== 'source-video')
    throw new Error('Unsupported source media type: ' + (type || 'unknown'));
  const args = {
    ...id,
    id: id.id,
    type: type,
    x: Number(id.x) || 0,
    y: Number(id.y) || 0,
    src: id.src || '',
    localPath: id.localPath || '',
    fileName: id.fileName || '',
    name: id.name || getDefaultNodeName(type),
  };
  (delete args.naturalWidth, delete args.naturalHeight);
  const count3 = Number(id.naturalWidth || 0),
    count4 = Number(id.naturalHeight || 0),
    width3 = Number(id.width || 0),
    height2 = Number(id.height || 0),
    enabled = count3 > 0 && count4 > 0,
    value7 = width3 > 0 && height2 > 0,
    enabled2 =
      value7 &&
      (id.needsAutoResize === false || id.fixedSize === true || id.useExplicitSizeAsSource === true),
    width4 = enabled
      ? getAutoMediaSizeByShortSide(count3, count4)
      : enabled2
        ? { width: width3, height: height2 }
        : getNodeDefaultSize(type),
    value8 = !!String(id.src || id.localPath || '').trim(),
    needsAutoResize = typeof id.needsAutoResize === 'boolean' ? id.needsAutoResize : !enabled && !enabled2;
  return (
    needsAutoResize && args.fixedSize && (args.fixedSize = false),
    { ...args, width: width4.width, height: width4.height, needsAutoResize: needsAutoResize }
  );
}
export function buildSourceAudioNodePayload(id2 = {}) {
  const value9 = String(id2.type || 'source-audio').trim();
  if (value9 !== 'source-audio') throw new Error('Unsupported source audio type: ' + (value9 || 'unknown'));
  const box = getNodeDefaultSize('source-audio'),
    width5 = Number(id2.width) > 0 ? Number(id2.width) : box.width,
    height3 = Number(id2.height) > 0 ? Number(id2.height) : box.height;
  return {
    ...id2,
    id: id2.id,
    type: 'source-audio',
    x: Number(id2.x) || 0,
    y: Number(id2.y) || 0,
    width: width5,
    height: height3,
    src: id2.src || '',
    localPath: id2.localPath || '',
    fileName: id2.fileName || '',
    name: id2.name || getDefaultNodeName('source-audio'),
    needsAutoResize: false,
    fixedSize: typeof id2.fixedSize === 'boolean' ? id2.fixedSize : true,
  };
}
function generateNodeId(value10, value11 = 0) {
  return value10 + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '-' + value11;
}
const WEB_PREVIEW_IMAGE_DROP_MIME = 'application/x-ai-canvas-web-preview-image',
  IMAGE_URL_EXTENSION_RE = /\.(?:png|jpe?g|webp|gif|bmp|svg|avif)(?:[?#].*)?$/i,
  VIDEO_URL_EXTENSION_RE = /\.(?:mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i,
  STREAM_MEDIA_URL_EXTENSION_RE = /\.(?:m3u8|mpd)(?:[?#].*)?$/i,
  WEB_IMAGE_REMOTE_IMPORT_CONCURRENCY = 3,
  WEB_VIDEO_TRUSTED_SOURCE_TYPES = new Set([
    'video',
    'video-source',
    'source',
    'video-resource',
    'douyin-detail',
  ]),
  _webImageRemoteImportQueue = [];
let _webImageRemoteImportActive = 0;
function normalizeHttpDropUrl(value12) {
  const enabled3 = String(value12 || '').trim();
  if (!enabled3) return '';
  try {
    const uRL = new URL(enabled3, globalThis.location?.href || 'https://example.invalid/');
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return '';
    return ((uRL.username = ''), (uRL.password = ''), uRL.href);
  } catch {
    return '';
  }
}
function toPositiveMediaDimension(value13) {
  const count5 = Number(value13);
  if (!Number.isFinite(count5) || count5 <= 0) return 0;
  return Math.max(1, Math.round(count5));
}
function normalizeWebImagePayloadSize(box2 = {}) {
  const width6 = toPositiveMediaDimension(box2?.width ?? box2?.naturalWidth ?? box2?.imageWidth),
    height4 = toPositiveMediaDimension(box2?.height ?? box2?.naturalHeight ?? box2?.imageHeight);
  return width6 > 0 && height4 > 0 ? { width: width6, height: height4 } : {};
}
function readDataTransferText(value14, value15) {
  try {
    return String(value14?.getData?.(value15) || '').trim();
  } catch {
    return '';
  }
}
function normalizeWebImagePayload(response = {}) {
  const url = normalizeHttpDropUrl(response?.url);
  if (!url) return null;
  const pageUrl2 = normalizeHttpDropUrl(
    response?.pageUrl || response?.sourceUrl || response?.webPageUrl || '',
  );
  return {
    kind: 'image',
    url: url,
    title: String(response?.title || response?.alt || '')
      .trim()
      .slice(0, 160),
    pageUrl: pageUrl2,
    sourceUrl: pageUrl2,
    nodeId: String(response?.nodeId || '').trim(),
    tabId: String(response?.tabId || '').trim(),
    ...normalizeWebImagePayloadSize(response),
  };
}
function normalizeWebVideoPayload(rightsConfirmed = {}) {
  const url2 = normalizeHttpDropUrl(rightsConfirmed?.url);
  if (!url2) return null;
  const mimeType = String(rightsConfirmed?.mimeType || '').trim(),
    sourceType = String(rightsConfirmed?.sourceType || '')
      .trim()
      .toLowerCase();
  try {
    const uRL2 = new URL(url2).pathname;
    if (STREAM_MEDIA_URL_EXTENSION_RE.test(uRL2)) return null;
    const enabled4 =
      mimeType.toLowerCase().startsWith('video/') ||
      VIDEO_URL_EXTENSION_RE.test(uRL2) ||
      WEB_VIDEO_TRUSTED_SOURCE_TYPES.has(sourceType);
    if (!enabled4) return null;
  } catch {
    return null;
  }
  const pageUrl3 = normalizeHttpDropUrl(
    rightsConfirmed?.pageUrl || rightsConfirmed?.sourceUrl || rightsConfirmed?.webPageUrl || '',
  );
  return {
    kind: 'video',
    url: url2,
    title: String(rightsConfirmed?.title || '')
      .trim()
      .slice(0, 160),
    pageUrl: pageUrl3,
    sourceUrl: pageUrl3,
    nodeId: String(rightsConfirmed?.nodeId || '').trim(),
    tabId: String(rightsConfirmed?.tabId || '').trim(),
    width: Math.max(0, Math.round(Number(rightsConfirmed?.width || 0) || 0)),
    height: Math.max(0, Math.round(Number(rightsConfirmed?.height || 0) || 0)),
    duration: Math.max(0, Number(rightsConfirmed?.duration || 0) || 0),
    mimeType: mimeType,
    sourceType: sourceType,
    rightsConfirmed: rightsConfirmed?.rightsConfirmed === true,
  };
}
function parseWebPreviewImagePayload(value16) {
  try {
    const value17 = JSON.parse(String(value16 || ''));
    if (value17?.kind !== 'image') return null;
    return normalizeWebImagePayload(value17);
  } catch {
    return null;
  }
}
function extractFirstUriListUrl(value18) {
  return (
    String(value18 || '')
      .split(/\r?\n/)
      .map((item3) => item3.trim())
      .find((enabled5) => enabled5 && !enabled5.startsWith('#')) || ''
  );
}
function decodeHtmlAttribute(value19) {
  return String(value19 || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
function extractImageUrlFromHtml(value20) {
  const value21 = String(value20 || ''),
    value22 = value21.match(/<img\b[^>]*\bsrc\s*=\s*(["'])(?<src>.*?)\1/i);
  return normalizeHttpDropUrl(decodeHtmlAttribute(value22?.groups?.src || ''));
}
function looksLikeImageUrl(value23) {
  const httpDropUrl = normalizeHttpDropUrl(value23);
  if (!httpDropUrl) return '';
  try {
    const uRL3 = new URL(httpDropUrl);
    if (IMAGE_URL_EXTENSION_RE.test(uRL3.pathname)) return httpDropUrl;
    const value24 = uRL3.searchParams.get('format') || uRL3.searchParams.get('type') || '';
    return /^(?:png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(value24) ? httpDropUrl : '';
  } catch {
    return '';
  }
}
export function extractWebImageDropUrl(value25) {
  return extractWebImageDropPayload(value25)?.url || '';
}
export function extractWebImageDropPayload(value26) {
  const webPreviewImagePayload = parseWebPreviewImagePayload(
    readDataTransferText(value26, WEB_PREVIEW_IMAGE_DROP_MIME),
  );
  if (webPreviewImagePayload) return webPreviewImagePayload;
  const url3 = extractImageUrlFromHtml(readDataTransferText(value26, 'text/html'));
  if (url3) return normalizeWebImagePayload({ url: url3 });
  const url4 = looksLikeImageUrl(extractFirstUriListUrl(readDataTransferText(value26, 'text/uri-list')));
  if (url4) return normalizeWebImagePayload({ url: url4 });
  const url5 = looksLikeImageUrl(readDataTransferText(value26, 'text/plain'));
  return url5 ? normalizeWebImagePayload({ url: url5 }) : null;
}
function getRemoteImageFileName(value27) {
  try {
    const uRL4 = new URL(value27),
      decodeURIComponent2 = decodeURIComponent(uRL4.pathname.split('/').filter(Boolean).pop() || '');
    return decodeURIComponent2 || t('fileService.defaultNames.webImage');
  } catch {
    return t('fileService.defaultNames.webImage');
  }
}
function getRemoteVideoFileName(value28) {
  try {
    const uRL5 = new URL(value28),
      decodeURIComponent3 = decodeURIComponent(uRL5.pathname.split('/').filter(Boolean).pop() || '');
    if (decodeURIComponent3 && !STREAM_MEDIA_URL_EXTENSION_RE.test(decodeURIComponent3))
      return decodeURIComponent3;
    return t('fileService.defaultNames.webVideo');
  } catch {
    return t('fileService.defaultNames.webVideo');
  }
}
export function buildWebImageDropNodePayload({
  url: url6,
  title: title = '',
  pageUrl: pageUrl = '',
  nodeId: nodeId,
  worldX: worldX,
  worldY: worldY,
  width: width = 0,
  height: height = 0,
} = {}) {
  const capturePreviewUrl = normalizeHttpDropUrl(url6);
  if (!capturePreviewUrl) return null;
  const fileName = getRemoteImageFileName(capturePreviewUrl),
    webPageUrl = normalizeHttpDropUrl(pageUrl),
    webSourceTitle = String(title || '')
      .trim()
      .slice(0, 160),
    naturalWidth = toPositiveMediaDimension(width),
    naturalHeight = toPositiveMediaDimension(height),
    value29 = naturalWidth > 0 && naturalHeight > 0;
  return buildSourceMediaNodePayload({
    id: nodeId || generateNodeId('source-image'),
    type: 'source-image',
    x: worldX,
    y: worldY,
    naturalWidth: naturalWidth,
    naturalHeight: naturalHeight,
    ...(value29 ? { imageWidth: naturalWidth, imageHeight: naturalHeight } : {}),
    capturePreviewUrl: capturePreviewUrl,
    webSourceUrl: capturePreviewUrl,
    webPageUrl: webPageUrl,
    webSourceTitle: webSourceTitle,
    fileName: fileName,
    name: webSourceTitle || getBaseName(fileName) || t('fileService.defaultNames.webImage'),
    needsAutoResize: true,
    isGenerating: true,
    jobStatus: 'running',
    jobError: null,
    generationStartTime: Date.now(),
    generationDuration: null,
  });
}
function buildRemoteImageImportPatch(assetId2 = {}, value30 = {}) {
  const args2 = buildImageNodeStorageFields(assetId2),
    src = localPathToUrl(args2.displayLocalPath || args2.originalLocalPath || args2.localPath),
    sourceUrl = localPathToUrl(args2.originalLocalPath || args2.localPath || args2.displayLocalPath),
    thumbUrl = localPathToUrl(args2.thumbLocalPath);
  return {
    assetId: assetId2?.assetId || '',
    derivativeStatus: assetId2?.derivativeStatus || assetId2?.status || '',
    ...args2,
    src: src || sourceUrl || '',
    imageUrl: src || sourceUrl || '',
    sourceUrl: sourceUrl || src || '',
    thumbUrl: thumbUrl,
    isGenerating: false,
    jobStatus: null,
    jobError: null,
    generationDuration: Date.now() - Number(value30?.generationStartTime || Date.now()),
    capturePreviewUrl: '',
  };
}
export function buildWebVideoSourceNodePayload({
  url: url7,
  title: title = '',
  pageUrl: pageUrl = '',
  nodeId: nodeId2,
  worldX: worldX2,
  worldY: worldY2,
  width: width = 0,
  height: height = 0,
  duration: duration = 0,
} = {}) {
  const webSourceUrl = normalizeHttpDropUrl(url7);
  if (!webSourceUrl) return null;
  try {
    if (STREAM_MEDIA_URL_EXTENSION_RE.test(new URL(webSourceUrl).pathname)) return null;
  } catch {
    return null;
  }
  const fileName2 = getRemoteVideoFileName(webSourceUrl),
    webPageUrl2 = normalizeHttpDropUrl(pageUrl),
    webSourceTitle2 = String(title || '')
      .trim()
      .slice(0, 160);
  return buildSourceMediaNodePayload({
    id: nodeId2 || generateNodeId('source-video'),
    type: 'source-video',
    x: worldX2,
    y: worldY2,
    webSourceUrl: webSourceUrl,
    webPageUrl: webPageUrl2,
    webSourceTitle: webSourceTitle2,
    webMediaKind: 'video',
    webRightsConfirmed: true,
    fileName: fileName2,
    name: webSourceTitle2 || getBaseName(fileName2) || t('fileService.defaultNames.webVideo'),
    naturalWidth: width,
    naturalHeight: height,
    videoWidth: Number(width || 0) || 0,
    videoHeight: Number(height || 0) || 0,
    videoDuration: Number(duration || 0) || 0,
    needsAutoResize: true,
    isGenerating: true,
    jobStatus: 'running',
    jobError: null,
    generationStartTime: Date.now(),
    generationDuration: null,
  });
}
function buildRemoteVideoImportPatch(assetId3 = {}, value31 = {}) {
  const localPath2 = assetId3?.localPath || assetId3?.originalLocalPath || '',
    displayLocalPath = assetId3?.displayLocalPath || '',
    value32 = displayLocalPath || localPath2,
    url8 = localPathToUrl(value32),
    sourceUrl2 = localPathToUrl(localPath2 || displayLocalPath),
    thumbLocalPath = assetId3?.posterLocalPath || assetId3?.thumbLocalPath || '',
    thumbUrl2 = assetId3?.posterUrl || assetId3?.thumbUrl || localPathToUrl(thumbLocalPath),
    mediaTaskStatus = String(assetId3?.mediaTaskStatus || '').trim(),
    videoProxyStatus = String(assetId3?.videoProxyStatus || '').trim(),
    isGenerating =
      mediaTaskStatus === 'waiting' || mediaTaskStatus === 'processing' || videoProxyStatus === 'processing';
  return {
    assetId: assetId3?.assetId || '',
    localPath: localPath2,
    originalLocalPath: assetId3?.originalLocalPath || localPath2,
    displayLocalPath: displayLocalPath,
    posterLocalPath: assetId3?.posterLocalPath || '',
    thumbLocalPath: thumbLocalPath,
    derivativeStatus: assetId3?.derivativeStatus || assetId3?.status || '',
    mediaTaskId: assetId3?.mediaTaskId || '',
    mediaTaskKind: assetId3?.mediaTaskKind || '',
    mediaTaskStatus: mediaTaskStatus,
    mediaTaskProgress: Number(assetId3?.mediaTaskProgress || 0) || 0,
    mediaTaskError: assetId3?.mediaTaskError || '',
    videoProxyStatus: videoProxyStatus,
    videoCodec: assetId3?.videoCodec || '',
    videoDuration: Number(assetId3?.videoDuration || 0) || Number(value31?.videoDuration || 0) || 0,
    videoFps: Number(assetId3?.videoFps || 0) || 0,
    videoWidth: Number(assetId3?.videoWidth || assetId3?.width || 0) || Number(value31?.videoWidth || 0) || 0,
    videoHeight:
      Number(assetId3?.videoHeight || assetId3?.height || 0) || Number(value31?.videoHeight || 0) || 0,
    src: videoProxyStatus === 'processing' ? '' : url8 || sourceUrl2 || '',
    videoUrl: videoProxyStatus === 'processing' ? '' : url8 || sourceUrl2 || '',
    sourceUrl: sourceUrl2 || url8 || '',
    thumbUrl: thumbUrl2,
    isGenerating: isGenerating,
    jobStatus: isGenerating ? 'running' : null,
    jobError: null,
    generationDuration: Date.now() - Number(value31?.generationStartTime || Date.now()),
    capturePreviewUrl: '',
  };
}
function getRemoteImportApi() {
  const value33 = globalThis.window?.electronAPI?.importRemoteAsset;
  return typeof value33 === 'function' ? value33 : null;
}
function pumpWebImageRemoteImportQueue() {
  while (
    _webImageRemoteImportActive < WEB_IMAGE_REMOTE_IMPORT_CONCURRENCY &&
    _webImageRemoteImportQueue.length > 0
  ) {
    const value34 = _webImageRemoteImportQueue.shift();
    ((_webImageRemoteImportActive += 1),
      Promise.resolve()
        .then(value34)
        .catch(() => {})
        .finally(() => {
          ((_webImageRemoteImportActive = Math.max(0, _webImageRemoteImportActive - 1)),
            pumpWebImageRemoteImportQueue());
        }));
  }
}
function enqueueWebImageRemoteImport(value35) {
  if (typeof value35 !== 'function') return;
  (_webImageRemoteImportQueue.push(value35), pumpWebImageRemoteImportQueue());
}
function buildWebImageRemoteImportFallbackPatch(value36, value37 = {}) {
  return {
    isGenerating: false,
    jobStatus: null,
    jobError: null,
    webImportStatus: 'failed',
    webImportError: String(value36 || t('fileService.errors.remoteImageImportFailed')),
    generationDuration: Date.now() - Number(value37?.generationStartTime || Date.now()),
  };
}
export function scheduleWebImageRemoteImport(enabled6, value38 = {}, value39 = {}) {
  const url9 = normalizeWebImagePayload(value38);
  if (!enabled6 || !url9) return false;
  const store = value39.storeInstance || appStore,
    projectId = value39.projectId || globalThis.window?.currentProjectId || 'default_v2_project',
    handler = value39.importRemoteAsset || getRemoteImportApi(),
    handler2 = (value40) => {
      const enabled7 = store.getState?.()?.nodes?.[enabled6] || store.getStateRaw?.()?.nodes?.[enabled6];
      if (!enabled7) return;
      const httpDropUrl2 = normalizeHttpDropUrl(enabled7.capturePreviewUrl),
        httpDropUrl3 = normalizeHttpDropUrl(enabled7.webSourceUrl);
      if (httpDropUrl2 === url9.url || httpDropUrl3 === url9.url) {
        store.updateNodeData?.(enabled6, buildWebImageRemoteImportFallbackPatch(value40, enabled7));
        return;
      }
      store.updateNodeData?.(enabled6, {
        isGenerating: false,
        jobStatus: 'error',
        jobError: String(value40 || t('fileService.errors.remoteImageImportFailed')),
        generationDuration: Date.now() - Number(enabled7.generationStartTime || Date.now()),
      });
    };
  return (
    enqueueWebImageRemoteImport(async () => {
      const enabled8 = store.getState?.()?.nodes?.[enabled6] || store.getStateRaw?.()?.nodes?.[enabled6];
      if (!enabled8) return;
      if (typeof handler !== 'function') {
        handler2(t('fileService.errors.remoteImportUnsupported'));
        return;
      }
      try {
        const value41 = await handler({
            url: url9.url,
            pageUrl: url9.pageUrl,
            referrer: url9.pageUrl,
            title: url9.title,
            name: getRemoteImageFileName(url9.url),
            projectId: projectId,
            nodeId: url9.nodeId,
            tabId: url9.tabId,
          }),
          enabled9 = store.getState?.()?.nodes?.[enabled6] || store.getStateRaw?.()?.nodes?.[enabled6];
        if (!enabled9) return;
        store.updateNodeData?.(enabled6, buildRemoteImageImportPatch(value41, enabled9));
      } catch (error3) {
        const message = _toOneLineMessage(error3);
        (handler2(message || t('fileService.errors.remoteImageImportFailed')),
          void logDiagnosticEvent({
            type: 'import.web_image_failed',
            level: 'warn',
            source: 'renderer',
            message: message || t('fileService.errors.remoteImageImportFailed'),
            error: error3,
            context: { url: url9.url, pageUrl: url9.pageUrl, projectId: projectId },
          }));
      }
    }),
    true
  );
}
export function scheduleWebVideoRemoteImport(enabled10, value42 = {}, value43 = {}) {
  const url10 = normalizeWebVideoPayload(value42);
  if (!enabled10 || !url10) return false;
  const store2 = value43.storeInstance || appStore,
    projectId2 = value43.projectId || globalThis.window?.currentProjectId || 'default_v2_project',
    handler3 = value43.importRemoteAsset || getRemoteImportApi(),
    handler4 = (value44) => {
      const enabled11 = store2.getState?.()?.nodes?.[enabled10] || store2.getStateRaw?.()?.nodes?.[enabled10];
      if (!enabled11) return;
      store2.updateNodeData?.(enabled10, {
        isGenerating: false,
        jobStatus: 'error',
        jobError: String(value44 || t('fileService.errors.remoteVideoImportFailed')),
        generationDuration: Date.now() - Number(enabled11.generationStartTime || Date.now()),
      });
    };
  return (
    enqueueWebImageRemoteImport(async () => {
      const enabled12 = store2.getState?.()?.nodes?.[enabled10] || store2.getStateRaw?.()?.nodes?.[enabled10];
      if (!enabled12) return;
      if (typeof handler3 !== 'function') {
        handler4(t('fileService.errors.remoteImportUnsupported'));
        return;
      }
      if (url10.rightsConfirmed !== true) {
        handler4(t('fileService.errors.webVideoRightsRequired'));
        return;
      }
      try {
        const value45 = await handler3({
            kind: 'video',
            url: url10.url,
            pageUrl: url10.pageUrl,
            referrer: url10.pageUrl,
            title: url10.title,
            name: getRemoteVideoFileName(url10.url),
            type: url10.mimeType,
            projectId: projectId2,
            nodeId: url10.nodeId,
            tabId: url10.tabId,
          }),
          enabled13 = store2.getState?.()?.nodes?.[enabled10] || store2.getStateRaw?.()?.nodes?.[enabled10];
        if (!enabled13) return;
        store2.updateNodeData?.(enabled10, buildRemoteVideoImportPatch(value45, enabled13));
      } catch (error4) {
        const message2 = _toOneLineMessage(error4);
        (handler4(message2 || t('fileService.errors.remoteVideoImportFailed')),
          void logDiagnosticEvent({
            type: 'import.web_video_failed',
            level: 'warn',
            source: 'renderer',
            message: message2 || t('fileService.errors.remoteVideoImportFailed'),
            error: error4,
            context: { url: url10.url, pageUrl: url10.pageUrl, projectId: projectId2 },
          }));
      }
    }),
    true
  );
}
export function createWebImageSourceNode({
  payload: payload2,
  worldX: worldX3,
  worldY: worldY3,
  storeInstance: storeInstance = appStore,
  projectId: projectId3,
  select: select = true,
  importRemote: importRemote = true,
  importRemoteAsset: importRemoteAsset,
} = {}) {
  const url11 = normalizeWebImagePayload(payload2);
  if (!url11) return null;
  const webImageDropNodePayload = buildWebImageDropNodePayload({
    url: url11.url,
    title: url11.title,
    pageUrl: url11.pageUrl,
    width: url11.width,
    height: url11.height,
    worldX: worldX3,
    worldY: worldY3,
  });
  if (!webImageDropNodePayload) return null;
  storeInstance.addNode?.(webImageDropNodePayload);
  if (select) storeInstance.setSelectedNodes?.([webImageDropNodePayload.id]);
  return (
    importRemote &&
      scheduleWebImageRemoteImport(webImageDropNodePayload.id, url11, {
        storeInstance: storeInstance,
        projectId: projectId3,
        importRemoteAsset: importRemoteAsset,
      }),
    webImageDropNodePayload
  );
}
export function createWebVideoSourceNode({
  payload: payload3,
  worldX: worldX4,
  worldY: worldY4,
  storeInstance: storeInstance = appStore,
  projectId: projectId4,
  select: select = true,
  importRemote: importRemote = true,
  importRemoteAsset: importRemoteAsset2,
} = {}) {
  const url12 = normalizeWebVideoPayload(payload3);
  if (!url12 || url12.rightsConfirmed !== true) return null;
  const webVideoSourceNodePayload = buildWebVideoSourceNodePayload({
    url: url12.url,
    title: url12.title,
    pageUrl: url12.pageUrl,
    width: url12.width,
    height: url12.height,
    duration: url12.duration,
    worldX: worldX4,
    worldY: worldY4,
  });
  if (!webVideoSourceNodePayload) return null;
  storeInstance.addNode?.(webVideoSourceNodePayload);
  if (select) storeInstance.setSelectedNodes?.([webVideoSourceNodePayload.id]);
  return (
    importRemote &&
      scheduleWebVideoRemoteImport(webVideoSourceNodePayload.id, url12, {
        storeInstance: storeInstance,
        projectId: projectId4,
        importRemoteAsset: importRemoteAsset2,
      }),
    webVideoSourceNodePayload
  );
}
function createObjectUrlForFilePreview(value46) {
  const enabled14 = String(value46?.type || '').trim();
  if (!enabled14.startsWith('image/') && !enabled14.startsWith('video/')) return '';
  const value47 = globalThis.window?.URL || globalThis.URL;
  if (typeof value47?.createObjectURL !== 'function') return '';
  try {
    return value47.createObjectURL(value46);
  } catch {
    return '';
  }
}
function revokeObjectUrl(value48) {
  const enabled15 = String(value48 || '').trim();
  if (!enabled15.startsWith('blob:')) return;
  const value49 = globalThis.window?.URL || globalThis.URL;
  if (typeof value49?.revokeObjectURL !== 'function') return;
  try {
    value49.revokeObjectURL(enabled15);
  } catch {}
}
function scheduleRevokeObjectUrl(value50) {
  const enabled16 = String(value50 || '').trim();
  if (!enabled16.startsWith('blob:')) return;
  const run2 = globalThis.window?.setTimeout || globalThis.setTimeout;
  if (typeof run2 === 'function') {
    run2(() => revokeObjectUrl(enabled16), 0);
    return;
  }
  revokeObjectUrl(enabled16);
}
function normalizeNaturalSize(value51, value52) {
  const width7 = Math.round(Number(value51) || 0),
    height5 = Math.round(Number(value52) || 0);
  if (width7 <= 0 || height5 <= 0) return null;
  return { width: width7, height: height5 };
}
function pickNaturalSize(box3 = {}) {
  return normalizeNaturalSize(box3?.width ?? box3?.naturalWidth, box3?.height ?? box3?.naturalHeight);
}
async function readImageFileNaturalSize(enabled17) {
  if (!enabled17) return null;
  const run3 = globalThis?.createImageBitmap;
  if (typeof run3 === 'function')
    try {
      const box4 = await run3(enabled17),
        naturalSize = normalizeNaturalSize(box4?.width, box4?.height);
      if (typeof box4?.close === 'function') box4.close();
      if (naturalSize) return naturalSize;
    } catch {}
  const run4 = globalThis.Image || globalThis.window?.Image,
    value53 = globalThis.window?.URL || globalThis.URL;
  if (!run4 || typeof value53?.createObjectURL !== 'function') return null;
  let value54 = '';
  try {
    value54 = value53.createObjectURL(enabled17);
  } catch {
    return null;
  }
  return new Promise((handler5) => {
    const box5 = new run4();
    let value55 = false,
      setTimeout2 = null;
    const run5 = (value56) => {
      if (value55) return;
      value55 = true;
      if (setTimeout2) clearTimeout(setTimeout2);
      (revokeObjectUrl(value54), handler5(value56));
    };
    ((setTimeout2 = setTimeout(() => run5(null), 0x7d0)),
      (box5.onload = () =>
        run5(normalizeNaturalSize(box5.naturalWidth || box5.width, box5.naturalHeight || box5.height))),
      (box5.onerror = () => run5(null)),
      (box5.src = value54));
  });
}
async function readVideoFileNaturalSize(enabled18) {
  const el = globalThis.document,
    value57 = globalThis.window?.URL || globalThis.URL;
  if (!enabled18 || typeof el?.createElement !== 'function') return null;
  if (typeof value57?.createObjectURL !== 'function') return null;
  let value58 = '';
  try {
    value58 = value57.createObjectURL(enabled18);
  } catch {
    return null;
  }
  return new Promise((handler6) => {
    const value59 = el.createElement('video');
    let value60 = false,
      setTimeout3 = null;
    const run6 = (value61) => {
      if (value60) return;
      value60 = true;
      if (setTimeout3) clearTimeout(setTimeout3);
      value59.removeAttribute('src');
      try {
        value59.load?.();
      } catch {}
      (revokeObjectUrl(value58), handler6(value61));
    };
    ((setTimeout3 = setTimeout(() => run6(null), 0x9c4)),
      (value59.preload = 'metadata'),
      (value59.muted = true),
      (value59.onloadedmetadata = () => run6(normalizeNaturalSize(value59.videoWidth, value59.videoHeight))),
      (value59.onerror = () => run6(null)),
      (value59.src = value58));
  });
}
export async function readFileNaturalSize(value62, value63 = '') {
  const value64 = String(value63 || getNodeTypeByFile(value62) || '').trim();
  if (value64 === 'source-image') return readImageFileNaturalSize(value62);
  if (value64 === 'source-video') return readVideoFileNaturalSize(value62);
  return null;
}
function getElectronImportLocalFile() {
  const value65 = globalThis.window?.electronAPI?.importLocalFile;
  return typeof value65 === 'function' ? value65 : null;
}
function getElectronLocalPreviewUrl() {
  const value66 = globalThis.window?.electronAPI?.getLocalPreviewUrl;
  return typeof value66 === 'function' ? value66 : null;
}
function getElectronFilePath(name) {
  if (!globalThis.window?.electronAPI) return '';
  const path = String(name?.path || '').trim();
  if (path)
    return (_profileDragImport('electron-file-path:direct', { name: name?.name || '', path: path }), path);
  const run7 = globalThis.window?.electronAPI?.getPathForFile;
  if (typeof run7 !== 'function')
    return (
      _profileDragImport('electron-file-path:missing-api', {
        name: name?.name || '',
        hasElectronAPI: !!globalThis.window?.electronAPI,
      }),
      ''
    );
  try {
    const path2 = String(run7(name) || '').trim();
    return (
      _profileDragImport('electron-file-path:webutils', { name: name?.name || '', path: path2 }),
      path2
    );
  } catch (value67) {
    return (
      _profileDragImport('electron-file-path:error', {
        name: name?.name || '',
        error: _toOneLineMessage(value67),
      }),
      ''
    );
  }
}
function canUseElectronLocalImport(value68) {
  return !!(getElectronImportLocalFile() && getElectronFilePath(value68));
}
function isPreviewablePendingFile(value69, value70 = '') {
  const value71 = String(value69?.type || '').trim();
  return (
    value70 === 'source-image' ||
    value70 === 'source-video' ||
    value71.startsWith('image/') ||
    value71.startsWith('video/')
  );
}
function isAllowedCapturePreviewUrl(value72) {
  const value73 = String(value72 || '').trim();
  return (
    value73.startsWith('blob:') ||
    value73.startsWith('data:image/') ||
    value73.startsWith('aic-local-preview:')
  );
}
function waitForNextPaint() {
  const run8 = globalThis.window?.requestAnimationFrame || globalThis.requestAnimationFrame;
  if (typeof run8 === 'function')
    return new Promise((handler7) => {
      let value74 = false,
        setTimeout4 = null;
      const value75 = () => {
        if (value74) return;
        value74 = true;
        if (setTimeout4) clearTimeout(setTimeout4);
        handler7();
      };
      ((setTimeout4 = setTimeout(value75, 50)), run8(value75));
    });
  return new Promise((value76) => setTimeout(value76, 0));
}
async function createCapturePreviewUrlForFile(name2, value77 = '') {
  if (!isPreviewablePendingFile(name2, value77)) return '';
  const run9 = getElectronLocalPreviewUrl(),
    electronImportLocalFile = getElectronImportLocalFile();
  if (run9 && electronImportLocalFile) {
    const path3 = getElectronFilePath(name2);
    if (path3)
      try {
        const response2 = await run9({
            path: path3,
            name: name2?.name || '',
            type: name2?.type || '',
          }),
          url13 = typeof response2 === 'string' ? response2 : String(response2?.url || '').trim();
        if (isAllowedCapturePreviewUrl(url13))
          return (
            _profileDragImport('electron-preview-url:done', { name: name2?.name || '', url: url13 }),
            url13
          );
      } catch (value78) {
        _profileDragImport('electron-preview-url:error', {
          name: name2?.name || '',
          error: _toOneLineMessage(value78),
        });
      }
  }
  return createObjectUrlForFilePreview(name2);
}
async function importFileWithBestAvailableFlow(name3, projectId5, value79 = '') {
  const run10 = getElectronImportLocalFile();
  if (run10) {
    const path4 = getElectronFilePath(name3);
    if (path4)
      try {
        const localPath3 = await run10({
          path: path4,
          name: name3?.name || '',
          type: name3?.type || '',
          projectId: projectId5,
        });
        _profileDragImport('electron-import:done', {
          name: name3?.name || '',
          localPath: localPath3?.localPath || '',
          displayLocalPath: localPath3?.displayLocalPath || '',
          thumbLocalPath: localPath3?.thumbLocalPath || '',
        });
        const localPath4 = String(localPath3?.localPath || '').trim(),
          enabled19 = !!String(
            localPath3?.displayLocalPath || localPath3?.thumbLocalPath || localPath3?.originalLocalPath || '',
          ).trim();
        if (localPath3 && value79 === 'source-image' && localPath4 && !enabled19)
          try {
            _profileDragImport('ensure-derivatives:start', { localPath: localPath4 });
            const localPath5 = await ensureLocalImageDerivatives(localPath4);
            return (
              _profileDragImport('ensure-derivatives:done', {
                localPath: localPath5?.localPath || '',
                displayLocalPath: localPath5?.displayLocalPath || '',
                thumbLocalPath: localPath5?.thumbLocalPath || '',
              }),
              localPath5
            );
          } catch (value80) {
            return (
              console.warn('[fileService] Electron 本地导入图片派生生成失败，使用原始文件:', value80),
              localPath3
            );
          }
        if (localPath3) return localPath3;
      } catch (value81) {
        console.warn('[fileService] Electron 本地导入失败，回退上传流程:', value81);
      }
  }
  return uploadFile(name3, projectId5);
}
export function buildPendingFileNodePayload(fileName3, x, y, value82, width8 = {}) {
  const type2 = getNodeTypeByFile(fileName3);
  if (!type2 || type2 === 'source-text') return null;
  const id3 = value82 || generateNodeId(type2),
    name4 = getBaseName(fileName3?.name),
    naturalWidth2 = pickNaturalSize(
      width8.mediaNaturalSize || { width: width8.naturalWidth, height: width8.naturalHeight },
    ),
    args3 = {
      id: id3,
      type: type2,
      x: x,
      y: y,
      fileName: fileName3?.name || '',
      name: name4 || getDefaultNodeName(type2),
      isGenerating: true,
      jobStatus: 'running',
      jobError: null,
      generationStartTime: Date.now(),
      generationDuration: null,
    };
  if (type2 === 'source-image' || type2 === 'source-video')
    return buildSourceMediaNodePayload({
      ...args3,
      naturalWidth: naturalWidth2?.width,
      naturalHeight: naturalWidth2?.height,
      capturePreviewUrl:
        typeof width8.capturePreviewUrl === 'string'
          ? width8.capturePreviewUrl
          : createObjectUrlForFilePreview(fileName3),
    });
  if (type2 === 'source-audio') return buildSourceAudioNodePayload(args3);
  return null;
}
function readTextFile(value83) {
  return new Promise((handler8, value84) => {
    const fileReader = new FileReader();
    ((fileReader.onload = (event) => handler8(event.target.result)),
      (fileReader.onerror = value84),
      fileReader.readAsText(value83, 'UTF-8'));
  });
}
export async function processFile(file, x2, y2, value85, width9 = {}) {
  const type3 = getNodeTypeByFile(file);
  if (!type3)
    return (
      console.warn('[fileService] 暂不支持此类型文件: ' + file.type),
      showWarning(
        t('fileService.errors.unsupportedFileType', {
          file: file.name || file.type || t('fileService.defaultNames.unknownFile'),
        }),
      ),
      null
    );
  const { width: width10, height: height6 } = getNodeDefaultSize(type3),
    id4 = width9?.nodeId || generateNodeId(type3),
    name5 = getBaseName(file.name),
    box6 = pickNaturalSize(
      width9?.mediaNaturalSize || { width: width9?.naturalWidth, height: width9?.naturalHeight },
    );
  try {
    if (type3 === 'source-text') {
      const text = await readTextFile(file);
      return {
        id: id4,
        type: type3,
        x: x2,
        y: y2,
        width: width10,
        height: height6,
        text: text,
        content: text,
        fileName: file.name,
        name: name5 || t('fileService.defaultNames.text'),
        isGenerating: false,
        jobStatus: null,
        jobError: null,
      };
    } else {
      const value86 =
          type3 === 'source-image' && !canUseElectronLocalImport(file)
            ? (() => {
                const value87 = URL.createObjectURL(file);
                return generateThumbnail(value87).finally(() => {
                  URL.revokeObjectURL(value87);
                });
              })()
            : Promise.resolve(null),
        assetId4 = await importFileWithBestAvailableFlow(file, value85, type3),
        value88 = await value86,
        localPath6 = pickResultLocalPath(assetId4),
        src2 = localPathToUrl(localPath6);
      if (type3 === 'source-image' && value88)
        try {
          await setThumbnail({ localPath: localPath6, src: src2, imageUrl: src2 }, value88);
        } catch (value89) {
          console.warn('[fileService] 写入缩略图缓存失败:', value89);
        }
      const args4 = type3 === 'source-image' ? buildImageNodeStorageFields(assetId4) : {},
        args5 = {
          assetId: assetId4.assetId || '',
          originalLocalPath: assetId4.originalLocalPath || assetId4.localPath || '',
          displayLocalPath: assetId4.displayLocalPath || '',
          posterLocalPath: assetId4.posterLocalPath || '',
          waveformLocalPath: assetId4.waveformLocalPath || '',
          derivativeStatus: assetId4.derivativeStatus || assetId4.status || '',
          mediaTaskId: assetId4.mediaTaskId || '',
          mediaTaskKind: assetId4.mediaTaskKind || '',
          mediaTaskStatus: assetId4.mediaTaskStatus || '',
          mediaTaskProgress: Number(assetId4.mediaTaskProgress || 0) || 0,
          mediaTaskError: assetId4.mediaTaskError || '',
          videoProxyStatus: assetId4.videoProxyStatus || '',
          videoCodec: assetId4.videoCodec || '',
          videoDuration: Number(assetId4.videoDuration || 0) || 0,
          videoFps: Number(assetId4.videoFps || 0) || 0,
        };
      type3 === 'source-video' &&
        (assetId4.posterLocalPath || assetId4.posterUrl || assetId4.thumbUrl) &&
        ((args5.thumbUrl = assetId4.posterUrl || assetId4.thumbUrl || ''),
        (args5.thumbLocalPath = assetId4.posterLocalPath || assetId4.thumbLocalPath || ''));
      const value90 = String(assetId4.mediaTaskStatus || '').trim(),
        value91 = String(assetId4.videoProxyStatus || '').trim(),
        isGenerating2 = value90 === 'waiting' || value90 === 'processing',
        capturePreviewUrl2 =
          type3 === 'source-video' && isGenerating2 && isAllowedCapturePreviewUrl(width9?.capturePreviewUrl)
            ? String(width9.capturePreviewUrl || '').trim()
            : '',
        videoWidth = Number(assetId4.videoWidth || assetId4.width || 0) || box6?.width || 0,
        videoHeight = Number(assetId4.videoHeight || assetId4.height || 0) || box6?.height || 0,
        originalWidth = Number(args4.originalWidth || assetId4.originalWidth || 0) || box6?.width || 0,
        originalHeight = Number(args4.originalHeight || assetId4.originalHeight || 0) || box6?.height || 0,
        value92 =
          type3 === 'source-video' && value91 === 'processing'
            ? ''
            : localPathToUrl(assetId4.displayLocalPath) || src2,
        args6 =
          type3 === 'source-image'
            ? {
                originalWidth: originalWidth || undefined,
                originalHeight: originalHeight || undefined,
                imageWidth: originalWidth || undefined,
                imageHeight: originalHeight || undefined,
              }
            : {},
        args7 = type3 === 'source-video' ? { videoWidth: videoWidth, videoHeight: videoHeight } : {},
        value93 = {
          id: id4,
          type: type3,
          x: x2,
          y: y2,
          width: width10,
          height: height6,
          src: type3 === 'source-video' ? value92 : src2,
          localPath: localPath6,
          ...args5,
          ...args4,
          fileName: file.name,
          name: name5 || getDefaultNodeName(type3),
          ...args6,
          naturalWidth: type3 === 'source-video' ? videoWidth : originalWidth,
          naturalHeight: type3 === 'source-video' ? videoHeight : originalHeight,
          ...args7,
          isGenerating: isGenerating2,
          jobStatus: isGenerating2 ? 'running' : null,
          jobError: null,
          generationDuration: null,
          capturePreviewUrl: capturePreviewUrl2,
        };
      if (type3 === 'source-image' || type3 === 'source-video') return buildSourceMediaNodePayload(value93);
      return value93;
    }
  } catch (value94) {
    console.error('[fileService] 文件 ' + file.name + ' 处理失败:', value94);
    throw value94;
  }
}
export async function handleFileDrop(event2, projectId6) {
  const count6 = event2.dataTransfer.files;
  if (!count6 || count6.length === 0) return false;
  _profileDragImport('drop:start', { count: count6.length, projectId: projectId6 });
  if (count6.length === 1 && /\.(json|aicpkg)$/i.test(count6[0].name || '')) return false;
  (event2.preventDefault(), event2.stopPropagation());
  const { viewport: viewport } = appStore.getState(),
    box7 = screenToWorld(event2.clientX, event2.clientY, viewport);
  let value95 = box7.x,
    value96 = box7.y,
    value97 = false;
  for (let value98 = 0; value98 < count6.length; value98++) {
    const name6 = count6[value98],
      nodeType = getNodeTypeByFile(name6);
    _profileDragImport('file:start', {
      name: name6?.name || '',
      type: name6?.type || '',
      size: name6?.size || 0,
      nodeType: nodeType,
      canUseElectronLocalImport: canUseElectronLocalImport(name6),
    });
    let capturePreviewUrl3 = '',
      width11 = null;
    nodeType &&
      nodeType !== 'source-text' &&
      ((capturePreviewUrl3 = await createCapturePreviewUrlForFile(name6, nodeType)),
      nodeType !== 'source-video' && (width11 = await readFileNaturalSize(name6, nodeType)));
    width11 &&
      _profileDragImport('file:natural-size', {
        name: name6?.name || '',
        width: width11.width,
        height: width11.height,
      });
    const id5 =
        nodeType && nodeType !== 'source-text'
          ? buildPendingFileNodePayload(name6, value95, value96, generateNodeId(nodeType, value98), {
              capturePreviewUrl: capturePreviewUrl3,
              mediaNaturalSize: width11,
            })
          : null,
      value99 = id5?.capturePreviewUrl || '';
    id5 &&
      (appStore.addNode(id5),
      appStore.setSelectedNodes([id5.id]),
      _profileDragImport('pending:add', {
        id: id5.id,
        name: name6?.name || '',
        hasCapturePreviewUrl: !!id5.capturePreviewUrl,
        jobStatus: id5.jobStatus || '',
      }),
      (value97 = true),
      (value95 += 30),
      (value96 += 30),
      id5.type === 'source-video' && (await waitForNextPaint()));
    try {
      _profileDragImport('process:start', { name: name6?.name || '', pendingId: id5?.id || '' });
      const localPath7 = await processFile(
        name6,
        id5 ? id5.x : value95,
        id5 ? id5.y : value96,
        projectId6,
        id5
          ? { nodeId: id5.id, mediaNaturalSize: width11, capturePreviewUrl: capturePreviewUrl3 }
          : { mediaNaturalSize: width11, capturePreviewUrl: capturePreviewUrl3 },
      );
      _profileDragImport('process:done', {
        name: name6?.name || '',
        pendingId: id5?.id || '',
        localPath: localPath7?.localPath || '',
        displayLocalPath: localPath7?.displayLocalPath || '',
        thumbLocalPath: localPath7?.thumbLocalPath || '',
        jobStatus: localPath7?.jobStatus || '',
      });
      if (localPath7) {
        if (id5) {
          const value100 = appStore.getState().nodes?.[id5.id];
          value100
            ? (appStore.updateNodeData(id5.id, localPath7),
              _profileDragImport('pending:update-final', {
                id: id5.id,
                localPath: localPath7?.localPath || '',
                displayLocalPath: localPath7?.displayLocalPath || '',
                thumbLocalPath: localPath7?.thumbLocalPath || '',
              }),
              localPath7.capturePreviewUrl !== value99 && scheduleRevokeObjectUrl(value99))
            : revokeObjectUrl(value99);
        } else
          (appStore.addNode(localPath7),
            appStore.setSelectedNodes([localPath7.id]),
            (value97 = true),
            (value95 += 30),
            (value96 += 30));
      }
    } catch (error5) {
      const reason = _toOneLineMessage(error5),
        message3 = reason || t('fileService.errors.importFailed');
      (void logDiagnosticEvent({
        type: 'import.file_failed',
        level: 'error',
        source: 'renderer',
        message: message3,
        error: error5,
        context: {
          fileName: name6?.name || '',
          fileType: name6?.type || '',
          fileSize: Number(name6?.size || 0) || 0,
          projectId: projectId6 || '',
        },
      }),
        id5 &&
          appStore.getState().nodes?.[id5.id] &&
          appStore.updateNodeData(id5.id, {
            isGenerating: false,
            jobStatus: 'error',
            jobError: message3,
            generationDuration: Date.now() - Number(id5.generationStartTime || Date.now()),
            capturePreviewUrl: '',
          }),
        revokeObjectUrl(value99),
        showError(
          t('fileService.errors.importFailedWithFile', {
            file: name6?.name || t('fileService.defaultNames.file'),
            reason: reason ? t('fileService.errors.importFailedReason', { reason: reason }) : '',
          }).trim(),
        ),
        console.error('[fileService] 处理文件失败:', error5));
    }
  }
  return value97;
}
export async function handleWebImageUrlDrop(event3, projectId7 = {}) {
  const payload4 = extractWebImageDropPayload(event3?.dataTransfer);
  if (!payload4?.url) return false;
  (event3?.preventDefault?.(), event3?.stopPropagation?.());
  const storeInstance2 = projectId7.storeInstance || appStore,
    value101 = typeof storeInstance2.getState === 'function' ? storeInstance2.getState() : {},
    worldX5 = screenToWorld(event3?.clientX || 0, event3?.clientY || 0, value101.viewport || {}),
    id6 = createWebImageSourceNode({
      payload: payload4,
      worldX: worldX5.x,
      worldY: worldX5.y,
      storeInstance: storeInstance2,
      projectId: projectId7.projectId,
      importRemote: projectId7.importRemote !== false,
    });
  if (!id6) return false;
  return (
    _profileDragImport('web-image:add', {
      id: id6.id,
      url: payload4.url,
      pageUrl: payload4.pageUrl || '',
    }),
    true
  );
}
export function downloadJson(value102, value103) {
  const blob = new Blob([JSON.stringify(value102, null, 2)], { type: 'application/json' }),
    value104 = URL.createObjectURL(blob),
    el2 = document.createElement('a');
  ((el2.href = value104),
    (el2.download = value103),
    document.body.appendChild(el2),
    el2.click(),
    document.body.removeChild(el2),
    URL.revokeObjectURL(value104));
}
export function readJsonFile(value105) {
  return new Promise((handler9, handler10) => {
    const fileReader2 = new FileReader();
    ((fileReader2.onload = (event4) => {
      try {
        const value106 = JSON.parse(event4.target.result);
        handler9(value106);
      } catch (value107) {
        handler10(new Error(t('fileService.errors.jsonParseFailed')));
      }
    }),
      (fileReader2.onerror = () => handler10(new Error(t('fileService.errors.fileReadFailed')))),
      fileReader2.readAsText(value105));
  });
}

export const CANVAS_VIDEO_IMPORT_MAX_BYTES = 0x12c * 0x400 * 0x400;

export const CANVAS_VIDEO_IMPORT_MAX_MB = Math['round'](CANVAS_VIDEO_IMPORT_MAX_BYTES / 0x400 / 0x400);

const ASSET_MEDIA_TASK_STATUS_RANK = new Map([
  ['waiting', 0x1],
  ['processing', 0x2],
  ['cancelled', 0x3],
  ['failed', 0x3],
  ['complete', 0x3],
]);

function normalizeAssetUpdatedAt(value108) {
  const enabled20 = String(value108 || '')['trim']();
  if (!enabled20) return '';
  const value109 = Date['parse'](enabled20);
  return Number['isFinite'](value109) ? value109 : '';
}

function normalizeAssetRevision(value110) {
  const count7 = Math['trunc'](Number(value110));
  return Number['isFinite'](count7) && count7 > 0x0 ? count7 : 0x0;
}

export function shouldApplyElectronAssetUpdateToNode(options2 = {}, value111 = {}) {
  const assetRevision = normalizeAssetRevision(value111?.['assetRevision']),
    assetRevision2 = normalizeAssetRevision(options2?.['assetRevision']);
  if (assetRevision > 0x0 && assetRevision2 > 0x0) return assetRevision > assetRevision2;
  const assetUpdatedAt = normalizeAssetUpdatedAt(value111?.['assetUpdatedAt'] || value111?.['updatedAt']),
    assetUpdatedAt2 = normalizeAssetUpdatedAt(options2?.['assetUpdatedAt']),
    value112 = assetUpdatedAt !== '' && assetUpdatedAt2 !== '';
  if (value112 && assetUpdatedAt < assetUpdatedAt2) return ![];
  const value113 = {
    taskId: value111?.['mediaTaskId'] || '',
    kind: value111?.['mediaTaskKind'] || '',
    status: value111?.['mediaTaskStatus'] || '',
  };
  if (shouldApplyMediaTaskEventToNode(options2, value113)) {
    const enabled21 = String(value113['taskId'] || '')['trim'](),
      enabled22 = String(options2?.['mediaTaskId'] || '')['trim']();
    if (!enabled21 || !enabled22 || enabled21 === enabled22) {
      const value114 =
          ASSET_MEDIA_TASK_STATUS_RANK['get'](
            String(value113['status'] || '')
              ['trim']()
              ['toLowerCase'](),
          ) || 0x0,
        value115 =
          ASSET_MEDIA_TASK_STATUS_RANK['get'](
            String(options2?.['mediaTaskStatus'] || '')
              ['trim']()
              ['toLowerCase'](),
          ) || 0x0;
      if (value114 < value115) return ![];
    }
    return !![];
  }
  return value112 && assetUpdatedAt > assetUpdatedAt2;
}

function assignPositiveNumber(value116, value117, ...args8) {
  const value118 = args8['map']((value119) => Number(value119))['find'](
    (count8) => Number['isFinite'](count8) && count8 > 0x0,
  );
  if (value118 !== undefined) value116[value117] = value118;
}

export function buildElectronAssetNodePatch(response3 = {}) {
  const enabled23 = String(response3?.['assetId'] || '')['trim']();
  if (!enabled23) return {};
  const value120 = {
      assetId: enabled23,
      localPath: response3?.['localPath'] || response3?.['originalLocalPath'] || '',
      originalLocalPath: response3?.['originalLocalPath'] || response3?.['localPath'] || '',
      displayLocalPath: response3?.['displayLocalPath'] || '',
      thumbLocalPath: response3?.['thumbLocalPath'] || response3?.['posterLocalPath'] || '',
      posterLocalPath: response3?.['posterLocalPath'] || '',
      waveformLocalPath: response3?.['waveformLocalPath'] || '',
      derivativeStatus: response3?.['derivativeStatus'] || response3?.['status'] || '',
      mediaTaskId: response3?.['mediaTaskId'] || '',
      mediaTaskKind: response3?.['mediaTaskKind'] || '',
      mediaTaskStatus: response3?.['mediaTaskStatus'] || '',
      mediaTaskProgress: Number(response3?.['mediaTaskProgress'] || 0x0) || 0x0,
      mediaTaskError: response3?.['mediaTaskError'] || '',
      videoProxyStatus: response3?.['videoProxyStatus'] || '',
      videoProxyVersion: response3?.['videoProxyVersion'] || '',
      videoCodec: response3?.['videoCodec'] || '',
    },
    value121 = String(response3?.['assetUpdatedAt'] || response3?.['updatedAt'] || '')['trim'](),
    assetRevision3 = normalizeAssetRevision(response3?.['assetRevision']);
  if (assetRevision3 > 0x0) value120['assetRevision'] = assetRevision3;
  if (value121) value120['assetUpdatedAt'] = value121;
  (assignPositiveNumber(value120, 'videoWidth', response3?.['videoWidth'], response3?.['width']),
    assignPositiveNumber(value120, 'videoHeight', response3?.['videoHeight'], response3?.['height']),
    assignPositiveNumber(value120, 'videoDuration', response3?.['videoDuration']),
    assignPositiveNumber(value120, 'videoFps', response3?.['videoFps']));
  if (response3?.['kind'] === 'image')
    ((value120['src'] = response3?.['displayUrl'] || response3?.['url'] || ''),
      (value120['imageUrl'] = response3?.['displayUrl'] || response3?.['url'] || ''),
      (value120['sourceUrl'] = response3?.['originalUrl'] || ''),
      (value120['thumbUrl'] = response3?.['thumbUrl'] || ''));
  else {
    if (response3?.['kind'] === 'video')
      ((value120['src'] =
        response3?.['displayUrl'] || response3?.['url'] || response3?.['originalUrl'] || ''),
        (value120['videoUrl'] =
          response3?.['displayUrl'] || response3?.['url'] || response3?.['originalUrl'] || ''),
        (value120['sourceUrl'] = response3?.['originalUrl'] || response3?.['url'] || ''),
        (value120['thumbUrl'] = response3?.['posterUrl'] || response3?.['thumbUrl'] || ''));
    else
      response3?.['kind'] === 'audio' &&
        ((value120['src'] = response3?.['originalUrl'] || response3?.['url'] || ''),
        (value120['audioUrl'] = response3?.['originalUrl'] || response3?.['url'] || ''));
  }
  return value120;
}

export function applyElectronAssetUpdate(options3 = {}, store3 = appStore) {
  const enabled24 = String(options3?.['assetId'] || '')['trim']();
  if (!enabled24) return [];
  const value122 =
      typeof store3?.['getStateRaw'] === 'function' ? store3['getStateRaw']() : store3?.['getState']?.(),
    value123 = value122?.['nodes'] || {},
    value124 = [];
  return (
    Object['values'](value123)['forEach']((value125) => {
      if (String(value125?.['assetId'] || '')['trim']() !== enabled24) return;
      if (!shouldApplyElectronAssetUpdateToNode(value125, options3)) return;
      const electronAssetNodePatch = buildElectronAssetNodePatch(options3),
        enabled25 = Object['entries'](electronAssetNodePatch)['some'](
          ([value126, value127]) => value125?.[value126] !== value127,
        );
      if (!enabled25) return;
      (store3['updateNodeData'](value125['id'], electronAssetNodePatch), value124['push'](value125['id']));
    }),
    value124
  );
}

export async function resolveImageImportThumbnailData({
  suppliedThumbnail: suppliedThumbnail,
  canUseLocalImport: canUseLocalImport = ![],
  generateThumbnailData: generateThumbnailData,
} = {}) {
  if (suppliedThumbnail != null)
    try {
      const value128 = String((await suppliedThumbnail) || '')['trim']();
      if (value128) return value128;
    } catch {}
  if (canUseLocalImport || typeof generateThumbnailData !== 'function') return null;
  return generateThumbnailData();
}
