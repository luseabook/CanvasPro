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
function _toOneLineMessage(_0x13fc61) {
  const _0x47404a =
    typeof _0x13fc61 === 'string'
      ? _0x13fc61
      : _0x13fc61?.message
        ? String(_0x13fc61.message)
        : t('fileService.unknownError');
  return _0x47404a.replace(/\s+/g, ' ').trim();
}
function _profileDragImport(_0x48a2b1, _0x28ce2e = {}) {
  logDragImportProfile(_0x48a2b1, _0x28ce2e);
}
let _assetUpdatedListenerInstalled = false;
function installElectronAssetUpdatedListener() {
  if (_assetUpdatedListenerInstalled) return;
  _assetUpdatedListenerInstalled = true;
  const _0x1496fc = globalThis.window?.electronAPI?.onAssetUpdated;
  if (typeof _0x1496fc !== 'function') return;
  _0x1496fc((_0x397351) => {
    const _0x5c32c0 = String(_0x397351?.assetId || '').trim();
    if (!_0x5c32c0) return;
    const _0x2be65e = appStore.getState()?.nodes || {},
      _0x2f929d = {
        assetId: _0x5c32c0,
        localPath: _0x397351?.localPath || _0x397351?.originalLocalPath || '',
        originalLocalPath: _0x397351?.originalLocalPath || _0x397351?.localPath || '',
        displayLocalPath: _0x397351?.displayLocalPath || '',
        thumbLocalPath: _0x397351?.thumbLocalPath || _0x397351?.posterLocalPath || '',
        posterLocalPath: _0x397351?.posterLocalPath || '',
        waveformLocalPath: _0x397351?.waveformLocalPath || '',
        derivativeStatus: _0x397351?.derivativeStatus || _0x397351?.status || '',
        mediaTaskId: _0x397351?.mediaTaskId || '',
        mediaTaskKind: _0x397351?.mediaTaskKind || '',
        mediaTaskStatus: _0x397351?.mediaTaskStatus || '',
        mediaTaskProgress: Number(_0x397351?.mediaTaskProgress || 0) || 0,
        mediaTaskError: _0x397351?.mediaTaskError || '',
        videoProxyStatus: _0x397351?.videoProxyStatus || '',
        videoCodec: _0x397351?.videoCodec || '',
        videoWidth: Number(_0x397351?.videoWidth || _0x397351?.width || 0) || 0,
        videoHeight: Number(_0x397351?.videoHeight || _0x397351?.height || 0) || 0,
        videoDuration: Number(_0x397351?.videoDuration || 0) || 0,
        videoFps: Number(_0x397351?.videoFps || 0) || 0,
      };
    if (_0x397351?.kind === 'image')
      ((_0x2f929d.src = _0x397351?.displayUrl || _0x397351?.url || ''),
        (_0x2f929d.imageUrl = _0x397351?.displayUrl || _0x397351?.url || ''),
        (_0x2f929d.sourceUrl = _0x397351?.originalUrl || ''),
        (_0x2f929d.thumbUrl = _0x397351?.thumbUrl || ''));
    else {
      if (_0x397351?.kind === 'video')
        ((_0x2f929d.src = _0x397351?.originalUrl || _0x397351?.url || ''),
          (_0x2f929d.videoUrl = _0x397351?.originalUrl || _0x397351?.url || ''),
          (_0x2f929d.thumbUrl = _0x397351?.posterUrl || _0x397351?.thumbUrl || ''));
      else
        _0x397351?.kind === 'audio' &&
          ((_0x2f929d.src = _0x397351?.originalUrl || _0x397351?.url || ''),
          (_0x2f929d.audioUrl = _0x397351?.originalUrl || _0x397351?.url || ''));
    }
    Object.values(_0x2be65e).forEach((_0x472860) => {
      if (String(_0x472860?.assetId || '').trim() !== _0x5c32c0) return;
      appStore.updateNodeData(_0x472860.id, _0x2f929d);
    });
  });
}
(installElectronAssetUpdatedListener(), installMediaTaskUpdateListener());
export function getBaseName(_0x53603c) {
  const _0x153a0d = String(_0x53603c || '').trim();
  return _0x153a0d.replace(/\.[^/.]+$/, '');
}
function getDefaultNodeName(_0x2cc4ae) {
  const _0x3cf92a = {
    'source-image': t('fileService.defaultNames.image'),
    'source-video': t('fileService.defaultNames.video'),
    'source-audio': t('fileService.defaultNames.audio'),
    'media-clip': t('fileService.defaultNames.mediaClip'),
    'source-text': t('fileService.defaultNames.text'),
  };
  return _0x3cf92a[_0x2cc4ae] || t('fileService.defaultNames.file');
}
export function getNodeTypeByFile(_0x2082da) {
  if (_0x2082da.type.startsWith('image/')) return 'source-image';
  if (_0x2082da.type.startsWith('video/')) return 'source-video';
  if (_0x2082da.type.startsWith('audio/')) return 'source-audio';
  if (_0x2082da.type === 'text/plain' || _0x2082da.name.endsWith('.txt')) return 'source-text';
  return null;
}
export function getNodeDefaultSize(_0x347af4) {
  const _0x47f42a = {
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
  return _0x47f42a[_0x347af4] || { width: 0x140, height: 180 };
}
export function getAutoMediaSizeByShortSide(
  _0x4e9e36,
  _0x4973c0,
  _0x1485c3 = SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE,
) {
  const _0x54972e = Math.max(1, Number(_0x4e9e36) || 1),
    _0x499a06 = Math.max(1, Number(_0x4973c0) || 1),
    _0x5737da = Math.max(1, Number(_0x1485c3) || SOURCE_MEDIA_AUTO_RESIZE_SHORT_SIDE),
    _0x35c04f = Math.min(_0x54972e, _0x499a06),
    _0x5177a4 = _0x5737da / _0x35c04f;
  return {
    width: Math.max(1, Math.round(_0x54972e * _0x5177a4)),
    height: Math.max(1, Math.round(_0x499a06 * _0x5177a4)),
  };
}
export function getAIGenerationNodeSize(_0x39d17f, _0x20a543, _0x16009e = AI_GENERATION_NODE_SHORT_SIDE) {
  const _0x175292 = Math.max(1, Number(_0x16009e) || AI_GENERATION_NODE_SHORT_SIDE),
    _0x683ea7 = Number(_0x39d17f) || 0,
    _0x5d309b = Number(_0x20a543) || 0;
  if (_0x683ea7 > 0 && _0x5d309b > 0) return getAutoMediaSizeByShortSide(_0x683ea7, _0x5d309b, _0x175292);
  return { width: _0x175292, height: _0x175292 };
}
export function getAIGenerationDefaultSizeByType(_0x307f3f, _0x47ce45 = AI_GENERATION_NODE_SHORT_SIDE) {
  const _0x4529a0 = String(_0x307f3f || '').trim();
  if (_0x4529a0 === 'ai-text')
    return getAutoMediaSizeByShortSide(AI_TEXT_DEFAULT_RATIO.width, AI_TEXT_DEFAULT_RATIO.height, _0x47ce45);
  if (_0x4529a0 === 'ai-image' || _0x4529a0 === 'ai-video')
    return getAIGenerationNodeSize(undefined, undefined, _0x47ce45);
  return {
    width: Math.max(1, Number(_0x47ce45) || AI_GENERATION_NODE_SHORT_SIDE),
    height: Math.max(1, Number(_0x47ce45) || AI_GENERATION_NODE_SHORT_SIDE),
  };
}
export function buildSourceMediaNodePayload(_0x5e72ca = {}) {
  const _0x46f8da = String(_0x5e72ca.type || '').trim();
  if (_0x46f8da !== 'source-image' && _0x46f8da !== 'source-video')
    throw new Error('Unsupported source media type: ' + (_0x46f8da || 'unknown'));
  const _0x2ed14d = {
    ..._0x5e72ca,
    id: _0x5e72ca.id,
    type: _0x46f8da,
    x: Number(_0x5e72ca.x) || 0,
    y: Number(_0x5e72ca.y) || 0,
    src: _0x5e72ca.src || '',
    localPath: _0x5e72ca.localPath || '',
    fileName: _0x5e72ca.fileName || '',
    name: _0x5e72ca.name || getDefaultNodeName(_0x46f8da),
  };
  (delete _0x2ed14d.naturalWidth, delete _0x2ed14d.naturalHeight);
  const _0x4dc668 = Number(_0x5e72ca.naturalWidth || 0),
    _0x3b1541 = Number(_0x5e72ca.naturalHeight || 0),
    _0xe36877 = Number(_0x5e72ca.width || 0),
    _0x56ea50 = Number(_0x5e72ca.height || 0),
    _0x45cba6 = _0x4dc668 > 0 && _0x3b1541 > 0,
    _0x5c2ea9 = _0xe36877 > 0 && _0x56ea50 > 0,
    _0x1b8486 =
      _0x5c2ea9 &&
      (_0x5e72ca.needsAutoResize === false ||
        _0x5e72ca.fixedSize === true ||
        _0x5e72ca.useExplicitSizeAsSource === true),
    _0x21e8c6 = _0x45cba6
      ? getAutoMediaSizeByShortSide(_0x4dc668, _0x3b1541)
      : _0x1b8486
        ? { width: _0xe36877, height: _0x56ea50 }
        : getNodeDefaultSize(_0x46f8da),
    _0x5cdd1a = !!String(_0x5e72ca.src || _0x5e72ca.localPath || '').trim(),
    _0x1affd3 =
      typeof _0x5e72ca.needsAutoResize === 'boolean' ? _0x5e72ca.needsAutoResize : !_0x45cba6 && !_0x1b8486;
  return (
    _0x1affd3 && _0x2ed14d.fixedSize && (_0x2ed14d.fixedSize = false),
    { ..._0x2ed14d, width: _0x21e8c6.width, height: _0x21e8c6.height, needsAutoResize: _0x1affd3 }
  );
}
export function buildSourceAudioNodePayload(_0x332da6 = {}) {
  const _0x4e21c7 = String(_0x332da6.type || 'source-audio').trim();
  if (_0x4e21c7 !== 'source-audio')
    throw new Error('Unsupported source audio type: ' + (_0x4e21c7 || 'unknown'));
  const _0x2622e8 = getNodeDefaultSize('source-audio'),
    _0xdde8f8 = Number(_0x332da6.width) > 0 ? Number(_0x332da6.width) : _0x2622e8.width,
    _0x4d55c7 = Number(_0x332da6.height) > 0 ? Number(_0x332da6.height) : _0x2622e8.height;
  return {
    ..._0x332da6,
    id: _0x332da6.id,
    type: 'source-audio',
    x: Number(_0x332da6.x) || 0,
    y: Number(_0x332da6.y) || 0,
    width: _0xdde8f8,
    height: _0x4d55c7,
    src: _0x332da6.src || '',
    localPath: _0x332da6.localPath || '',
    fileName: _0x332da6.fileName || '',
    name: _0x332da6.name || getDefaultNodeName('source-audio'),
    needsAutoResize: false,
    fixedSize: typeof _0x332da6.fixedSize === 'boolean' ? _0x332da6.fixedSize : true,
  };
}
function generateNodeId(_0x3724da, _0x16dde8 = 0) {
  return _0x3724da + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '-' + _0x16dde8;
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
function normalizeHttpDropUrl(_0x3806f6) {
  const _0x523086 = String(_0x3806f6 || '').trim();
  if (!_0x523086) return '';
  try {
    const _0x3a523f = new URL(_0x523086, globalThis.location?.href || 'https://example.invalid/');
    if (_0x3a523f.protocol !== 'http:' && _0x3a523f.protocol !== 'https:') return '';
    return ((_0x3a523f.username = ''), (_0x3a523f.password = ''), _0x3a523f.href);
  } catch {
    return '';
  }
}
function toPositiveMediaDimension(_0x11fbb1) {
  const _0x2795b1 = Number(_0x11fbb1);
  if (!Number.isFinite(_0x2795b1) || _0x2795b1 <= 0) return 0;
  return Math.max(1, Math.round(_0x2795b1));
}
function normalizeWebImagePayloadSize(_0x3a6075 = {}) {
  const _0x135d6e = toPositiveMediaDimension(
      _0x3a6075?.width ?? _0x3a6075?.naturalWidth ?? _0x3a6075?.imageWidth,
    ),
    _0x2e364b = toPositiveMediaDimension(
      _0x3a6075?.height ?? _0x3a6075?.naturalHeight ?? _0x3a6075?.imageHeight,
    );
  return _0x135d6e > 0 && _0x2e364b > 0 ? { width: _0x135d6e, height: _0x2e364b } : {};
}
function readDataTransferText(_0x101312, _0x239eab) {
  try {
    return String(_0x101312?.getData?.(_0x239eab) || '').trim();
  } catch {
    return '';
  }
}
function normalizeWebImagePayload(_0x5e0c03 = {}) {
  const _0x1e94d6 = normalizeHttpDropUrl(_0x5e0c03?.url);
  if (!_0x1e94d6) return null;
  const _0x1e5c66 = normalizeHttpDropUrl(
    _0x5e0c03?.pageUrl || _0x5e0c03?.sourceUrl || _0x5e0c03?.webPageUrl || '',
  );
  return {
    kind: 'image',
    url: _0x1e94d6,
    title: String(_0x5e0c03?.title || _0x5e0c03?.alt || '')
      .trim()
      .slice(0, 160),
    pageUrl: _0x1e5c66,
    sourceUrl: _0x1e5c66,
    nodeId: String(_0x5e0c03?.nodeId || '').trim(),
    tabId: String(_0x5e0c03?.tabId || '').trim(),
    ...normalizeWebImagePayloadSize(_0x5e0c03),
  };
}
function normalizeWebVideoPayload(_0x63698d = {}) {
  const _0x3a399f = normalizeHttpDropUrl(_0x63698d?.url);
  if (!_0x3a399f) return null;
  const _0x284833 = String(_0x63698d?.mimeType || '').trim(),
    _0x3e366d = String(_0x63698d?.sourceType || '')
      .trim()
      .toLowerCase();
  try {
    const _0x3359cf = new URL(_0x3a399f).pathname;
    if (STREAM_MEDIA_URL_EXTENSION_RE.test(_0x3359cf)) return null;
    const _0x28b8c9 =
      _0x284833.toLowerCase().startsWith('video/') ||
      VIDEO_URL_EXTENSION_RE.test(_0x3359cf) ||
      WEB_VIDEO_TRUSTED_SOURCE_TYPES.has(_0x3e366d);
    if (!_0x28b8c9) return null;
  } catch {
    return null;
  }
  const _0x3ef61a = normalizeHttpDropUrl(
    _0x63698d?.pageUrl || _0x63698d?.sourceUrl || _0x63698d?.webPageUrl || '',
  );
  return {
    kind: 'video',
    url: _0x3a399f,
    title: String(_0x63698d?.title || '')
      .trim()
      .slice(0, 160),
    pageUrl: _0x3ef61a,
    sourceUrl: _0x3ef61a,
    nodeId: String(_0x63698d?.nodeId || '').trim(),
    tabId: String(_0x63698d?.tabId || '').trim(),
    width: Math.max(0, Math.round(Number(_0x63698d?.width || 0) || 0)),
    height: Math.max(0, Math.round(Number(_0x63698d?.height || 0) || 0)),
    duration: Math.max(0, Number(_0x63698d?.duration || 0) || 0),
    mimeType: _0x284833,
    sourceType: _0x3e366d,
    rightsConfirmed: _0x63698d?.rightsConfirmed === true,
  };
}
function parseWebPreviewImagePayload(_0x37da6c) {
  try {
    const _0x1b3585 = JSON.parse(String(_0x37da6c || ''));
    if (_0x1b3585?.kind !== 'image') return null;
    return normalizeWebImagePayload(_0x1b3585);
  } catch {
    return null;
  }
}
function extractFirstUriListUrl(_0x167878) {
  return (
    String(_0x167878 || '')
      .split(/\r?\n/)
      .map((_0x490b4a) => _0x490b4a.trim())
      .find((_0x4c61f6) => _0x4c61f6 && !_0x4c61f6.startsWith('#')) || ''
  );
}
function decodeHtmlAttribute(_0x55e51b) {
  return String(_0x55e51b || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
function extractImageUrlFromHtml(_0x316568) {
  const _0x41d45b = String(_0x316568 || ''),
    _0x1cc8d7 = _0x41d45b.match(/<img\b[^>]*\bsrc\s*=\s*(["'])(?<src>.*?)\1/i);
  return normalizeHttpDropUrl(decodeHtmlAttribute(_0x1cc8d7?.groups?.src || ''));
}
function looksLikeImageUrl(_0x362ef5) {
  const _0x2d80f3 = normalizeHttpDropUrl(_0x362ef5);
  if (!_0x2d80f3) return '';
  try {
    const _0x3525de = new URL(_0x2d80f3);
    if (IMAGE_URL_EXTENSION_RE.test(_0x3525de.pathname)) return _0x2d80f3;
    const _0x40319a = _0x3525de.searchParams.get('format') || _0x3525de.searchParams.get('type') || '';
    return /^(?:png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(_0x40319a) ? _0x2d80f3 : '';
  } catch {
    return '';
  }
}
export function extractWebImageDropUrl(_0x290922) {
  return extractWebImageDropPayload(_0x290922)?.url || '';
}
export function extractWebImageDropPayload(_0x552c85) {
  const _0x3f583c = parseWebPreviewImagePayload(readDataTransferText(_0x552c85, WEB_PREVIEW_IMAGE_DROP_MIME));
  if (_0x3f583c) return _0x3f583c;
  const _0x78141 = extractImageUrlFromHtml(readDataTransferText(_0x552c85, 'text/html'));
  if (_0x78141) return normalizeWebImagePayload({ url: _0x78141 });
  const _0x25ad96 = looksLikeImageUrl(
    extractFirstUriListUrl(readDataTransferText(_0x552c85, 'text/uri-list')),
  );
  if (_0x25ad96) return normalizeWebImagePayload({ url: _0x25ad96 });
  const _0x112c05 = looksLikeImageUrl(readDataTransferText(_0x552c85, 'text/plain'));
  return _0x112c05 ? normalizeWebImagePayload({ url: _0x112c05 }) : null;
}
function getRemoteImageFileName(_0x61f3c2) {
  try {
    const _0x619b4f = new URL(_0x61f3c2),
      _0x255efb = decodeURIComponent(_0x619b4f.pathname.split('/').filter(Boolean).pop() || '');
    return _0x255efb || t('fileService.defaultNames.webImage');
  } catch {
    return t('fileService.defaultNames.webImage');
  }
}
function getRemoteVideoFileName(_0x1600ae) {
  try {
    const _0x445fdd = new URL(_0x1600ae),
      _0x32087c = decodeURIComponent(_0x445fdd.pathname.split('/').filter(Boolean).pop() || '');
    if (_0x32087c && !STREAM_MEDIA_URL_EXTENSION_RE.test(_0x32087c)) return _0x32087c;
    return t('fileService.defaultNames.webVideo');
  } catch {
    return t('fileService.defaultNames.webVideo');
  }
}
export function buildWebImageDropNodePayload({
  url: _0x56294e,
  title: title = '',
  pageUrl: pageUrl = '',
  nodeId: _0x8d2015,
  worldX: _0x51abee,
  worldY: _0x483bc,
  width: width = 0,
  height: height = 0,
} = {}) {
  const _0x5b3c0b = normalizeHttpDropUrl(_0x56294e);
  if (!_0x5b3c0b) return null;
  const _0x1e25a4 = getRemoteImageFileName(_0x5b3c0b),
    _0x27f402 = normalizeHttpDropUrl(pageUrl),
    _0x3fa7e2 = String(title || '')
      .trim()
      .slice(0, 160),
    _0x429fc5 = toPositiveMediaDimension(width),
    _0x2a2e47 = toPositiveMediaDimension(height),
    _0x4f0269 = _0x429fc5 > 0 && _0x2a2e47 > 0;
  return buildSourceMediaNodePayload({
    id: _0x8d2015 || generateNodeId('source-image'),
    type: 'source-image',
    x: _0x51abee,
    y: _0x483bc,
    naturalWidth: _0x429fc5,
    naturalHeight: _0x2a2e47,
    ...(_0x4f0269 ? { imageWidth: _0x429fc5, imageHeight: _0x2a2e47 } : {}),
    capturePreviewUrl: _0x5b3c0b,
    webSourceUrl: _0x5b3c0b,
    webPageUrl: _0x27f402,
    webSourceTitle: _0x3fa7e2,
    fileName: _0x1e25a4,
    name: _0x3fa7e2 || getBaseName(_0x1e25a4) || t('fileService.defaultNames.webImage'),
    needsAutoResize: true,
    isGenerating: true,
    jobStatus: 'running',
    jobError: null,
    generationStartTime: Date.now(),
    generationDuration: null,
  });
}
function buildRemoteImageImportPatch(_0x257fa1 = {}, _0x30ec60 = {}) {
  const _0x6a1d4f = buildImageNodeStorageFields(_0x257fa1),
    _0x35f59e = localPathToUrl(
      _0x6a1d4f.displayLocalPath || _0x6a1d4f.originalLocalPath || _0x6a1d4f.localPath,
    ),
    _0x5980eb = localPathToUrl(
      _0x6a1d4f.originalLocalPath || _0x6a1d4f.localPath || _0x6a1d4f.displayLocalPath,
    ),
    _0x3f7352 = localPathToUrl(_0x6a1d4f.thumbLocalPath);
  return {
    assetId: _0x257fa1?.assetId || '',
    derivativeStatus: _0x257fa1?.derivativeStatus || _0x257fa1?.status || '',
    ..._0x6a1d4f,
    src: _0x35f59e || _0x5980eb || '',
    imageUrl: _0x35f59e || _0x5980eb || '',
    sourceUrl: _0x5980eb || _0x35f59e || '',
    thumbUrl: _0x3f7352,
    isGenerating: false,
    jobStatus: null,
    jobError: null,
    generationDuration: Date.now() - Number(_0x30ec60?.generationStartTime || Date.now()),
    capturePreviewUrl: '',
  };
}
export function buildWebVideoSourceNodePayload({
  url: _0x544607,
  title: title = '',
  pageUrl: pageUrl = '',
  nodeId: _0x8f960e,
  worldX: _0x117741,
  worldY: _0x58930b,
  width: width = 0,
  height: height = 0,
  duration: duration = 0,
} = {}) {
  const _0x6599e = normalizeHttpDropUrl(_0x544607);
  if (!_0x6599e) return null;
  try {
    if (STREAM_MEDIA_URL_EXTENSION_RE.test(new URL(_0x6599e).pathname)) return null;
  } catch {
    return null;
  }
  const _0x4cb3ce = getRemoteVideoFileName(_0x6599e),
    _0x5c6646 = normalizeHttpDropUrl(pageUrl),
    _0x3aeef7 = String(title || '')
      .trim()
      .slice(0, 160);
  return buildSourceMediaNodePayload({
    id: _0x8f960e || generateNodeId('source-video'),
    type: 'source-video',
    x: _0x117741,
    y: _0x58930b,
    webSourceUrl: _0x6599e,
    webPageUrl: _0x5c6646,
    webSourceTitle: _0x3aeef7,
    webMediaKind: 'video',
    webRightsConfirmed: true,
    fileName: _0x4cb3ce,
    name: _0x3aeef7 || getBaseName(_0x4cb3ce) || t('fileService.defaultNames.webVideo'),
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
function buildRemoteVideoImportPatch(_0x26aa32 = {}, _0x4b6f37 = {}) {
  const _0x456a48 = _0x26aa32?.localPath || _0x26aa32?.originalLocalPath || '',
    _0x3e3099 = _0x26aa32?.displayLocalPath || '',
    _0x24ed05 = _0x3e3099 || _0x456a48,
    _0x4830c1 = localPathToUrl(_0x24ed05),
    _0x344a4b = localPathToUrl(_0x456a48 || _0x3e3099),
    _0x266c29 = _0x26aa32?.posterLocalPath || _0x26aa32?.thumbLocalPath || '',
    _0x115d9b = _0x26aa32?.posterUrl || _0x26aa32?.thumbUrl || localPathToUrl(_0x266c29),
    _0x4495c4 = String(_0x26aa32?.mediaTaskStatus || '').trim(),
    _0x30f1ae = String(_0x26aa32?.videoProxyStatus || '').trim(),
    _0x56609c = _0x4495c4 === 'waiting' || _0x4495c4 === 'processing' || _0x30f1ae === 'processing';
  return {
    assetId: _0x26aa32?.assetId || '',
    localPath: _0x456a48,
    originalLocalPath: _0x26aa32?.originalLocalPath || _0x456a48,
    displayLocalPath: _0x3e3099,
    posterLocalPath: _0x26aa32?.posterLocalPath || '',
    thumbLocalPath: _0x266c29,
    derivativeStatus: _0x26aa32?.derivativeStatus || _0x26aa32?.status || '',
    mediaTaskId: _0x26aa32?.mediaTaskId || '',
    mediaTaskKind: _0x26aa32?.mediaTaskKind || '',
    mediaTaskStatus: _0x4495c4,
    mediaTaskProgress: Number(_0x26aa32?.mediaTaskProgress || 0) || 0,
    mediaTaskError: _0x26aa32?.mediaTaskError || '',
    videoProxyStatus: _0x30f1ae,
    videoCodec: _0x26aa32?.videoCodec || '',
    videoDuration: Number(_0x26aa32?.videoDuration || 0) || Number(_0x4b6f37?.videoDuration || 0) || 0,
    videoFps: Number(_0x26aa32?.videoFps || 0) || 0,
    videoWidth:
      Number(_0x26aa32?.videoWidth || _0x26aa32?.width || 0) || Number(_0x4b6f37?.videoWidth || 0) || 0,
    videoHeight:
      Number(_0x26aa32?.videoHeight || _0x26aa32?.height || 0) || Number(_0x4b6f37?.videoHeight || 0) || 0,
    src: _0x30f1ae === 'processing' ? '' : _0x4830c1 || _0x344a4b || '',
    videoUrl: _0x30f1ae === 'processing' ? '' : _0x4830c1 || _0x344a4b || '',
    sourceUrl: _0x344a4b || _0x4830c1 || '',
    thumbUrl: _0x115d9b,
    isGenerating: _0x56609c,
    jobStatus: _0x56609c ? 'running' : null,
    jobError: null,
    generationDuration: Date.now() - Number(_0x4b6f37?.generationStartTime || Date.now()),
    capturePreviewUrl: '',
  };
}
function getRemoteImportApi() {
  const _0x13aef9 = globalThis.window?.electronAPI?.importRemoteAsset;
  return typeof _0x13aef9 === 'function' ? _0x13aef9 : null;
}
function pumpWebImageRemoteImportQueue() {
  while (
    _webImageRemoteImportActive < WEB_IMAGE_REMOTE_IMPORT_CONCURRENCY &&
    _webImageRemoteImportQueue.length > 0
  ) {
    const _0x3e2496 = _webImageRemoteImportQueue.shift();
    ((_webImageRemoteImportActive += 1),
      Promise.resolve()
        .then(_0x3e2496)
        .catch(() => {})
        .finally(() => {
          ((_webImageRemoteImportActive = Math.max(0, _webImageRemoteImportActive - 1)),
            pumpWebImageRemoteImportQueue());
        }));
  }
}
function enqueueWebImageRemoteImport(_0x192f6a) {
  if (typeof _0x192f6a !== 'function') return;
  (_webImageRemoteImportQueue.push(_0x192f6a), pumpWebImageRemoteImportQueue());
}
function buildWebImageRemoteImportFallbackPatch(_0x3a4b14, _0x4ba181 = {}) {
  return {
    isGenerating: false,
    jobStatus: null,
    jobError: null,
    webImportStatus: 'failed',
    webImportError: String(_0x3a4b14 || t('fileService.errors.remoteImageImportFailed')),
    generationDuration: Date.now() - Number(_0x4ba181?.generationStartTime || Date.now()),
  };
}
export function scheduleWebImageRemoteImport(_0x389d97, _0x585a3f = {}, _0x4924b7 = {}) {
  const _0xa56166 = normalizeWebImagePayload(_0x585a3f);
  if (!_0x389d97 || !_0xa56166) return false;
  const _0x5abbf4 = _0x4924b7.storeInstance || appStore,
    _0x37e46b = _0x4924b7.projectId || globalThis.window?.currentProjectId || 'default_v2_project',
    _0x51479a = _0x4924b7.importRemoteAsset || getRemoteImportApi(),
    _0x47c065 = (_0x280ee4) => {
      const _0x53ee53 =
        _0x5abbf4.getState?.()?.nodes?.[_0x389d97] || _0x5abbf4.getStateRaw?.()?.nodes?.[_0x389d97];
      if (!_0x53ee53) return;
      const _0x15ef2b = normalizeHttpDropUrl(_0x53ee53.capturePreviewUrl),
        _0x22ccea = normalizeHttpDropUrl(_0x53ee53.webSourceUrl);
      if (_0x15ef2b === _0xa56166.url || _0x22ccea === _0xa56166.url) {
        _0x5abbf4.updateNodeData?.(_0x389d97, buildWebImageRemoteImportFallbackPatch(_0x280ee4, _0x53ee53));
        return;
      }
      _0x5abbf4.updateNodeData?.(_0x389d97, {
        isGenerating: false,
        jobStatus: 'error',
        jobError: String(_0x280ee4 || t('fileService.errors.remoteImageImportFailed')),
        generationDuration: Date.now() - Number(_0x53ee53.generationStartTime || Date.now()),
      });
    };
  return (
    enqueueWebImageRemoteImport(async () => {
      const _0x3e3966 =
        _0x5abbf4.getState?.()?.nodes?.[_0x389d97] || _0x5abbf4.getStateRaw?.()?.nodes?.[_0x389d97];
      if (!_0x3e3966) return;
      if (typeof _0x51479a !== 'function') {
        _0x47c065(t('fileService.errors.remoteImportUnsupported'));
        return;
      }
      try {
        const _0x254a58 = await _0x51479a({
            url: _0xa56166.url,
            pageUrl: _0xa56166.pageUrl,
            referrer: _0xa56166.pageUrl,
            title: _0xa56166.title,
            name: getRemoteImageFileName(_0xa56166.url),
            projectId: _0x37e46b,
            nodeId: _0xa56166.nodeId,
            tabId: _0xa56166.tabId,
          }),
          _0x21996c =
            _0x5abbf4.getState?.()?.nodes?.[_0x389d97] || _0x5abbf4.getStateRaw?.()?.nodes?.[_0x389d97];
        if (!_0x21996c) return;
        _0x5abbf4.updateNodeData?.(_0x389d97, buildRemoteImageImportPatch(_0x254a58, _0x21996c));
      } catch (_0x27c507) {
        const _0x5365a0 = _toOneLineMessage(_0x27c507);
        (_0x47c065(_0x5365a0 || t('fileService.errors.remoteImageImportFailed')),
          void logDiagnosticEvent({
            type: 'import.web_image_failed',
            level: 'warn',
            source: 'renderer',
            message: _0x5365a0 || t('fileService.errors.remoteImageImportFailed'),
            error: _0x27c507,
            context: { url: _0xa56166.url, pageUrl: _0xa56166.pageUrl, projectId: _0x37e46b },
          }));
      }
    }),
    true
  );
}
export function scheduleWebVideoRemoteImport(_0x2aba1b, _0x12d031 = {}, _0x11c4fd = {}) {
  const _0x43f493 = normalizeWebVideoPayload(_0x12d031);
  if (!_0x2aba1b || !_0x43f493) return false;
  const _0x1aa296 = _0x11c4fd.storeInstance || appStore,
    _0x3bbe26 = _0x11c4fd.projectId || globalThis.window?.currentProjectId || 'default_v2_project',
    _0x69831e = _0x11c4fd.importRemoteAsset || getRemoteImportApi(),
    _0x3d0b76 = (_0x54a53d) => {
      const _0x445d41 =
        _0x1aa296.getState?.()?.nodes?.[_0x2aba1b] || _0x1aa296.getStateRaw?.()?.nodes?.[_0x2aba1b];
      if (!_0x445d41) return;
      _0x1aa296.updateNodeData?.(_0x2aba1b, {
        isGenerating: false,
        jobStatus: 'error',
        jobError: String(_0x54a53d || t('fileService.errors.remoteVideoImportFailed')),
        generationDuration: Date.now() - Number(_0x445d41.generationStartTime || Date.now()),
      });
    };
  return (
    enqueueWebImageRemoteImport(async () => {
      const _0x17de41 =
        _0x1aa296.getState?.()?.nodes?.[_0x2aba1b] || _0x1aa296.getStateRaw?.()?.nodes?.[_0x2aba1b];
      if (!_0x17de41) return;
      if (typeof _0x69831e !== 'function') {
        _0x3d0b76(t('fileService.errors.remoteImportUnsupported'));
        return;
      }
      if (_0x43f493.rightsConfirmed !== true) {
        _0x3d0b76(t('fileService.errors.webVideoRightsRequired'));
        return;
      }
      try {
        const _0x5ae24a = await _0x69831e({
            kind: 'video',
            url: _0x43f493.url,
            pageUrl: _0x43f493.pageUrl,
            referrer: _0x43f493.pageUrl,
            title: _0x43f493.title,
            name: getRemoteVideoFileName(_0x43f493.url),
            type: _0x43f493.mimeType,
            projectId: _0x3bbe26,
            nodeId: _0x43f493.nodeId,
            tabId: _0x43f493.tabId,
          }),
          _0x5924de =
            _0x1aa296.getState?.()?.nodes?.[_0x2aba1b] || _0x1aa296.getStateRaw?.()?.nodes?.[_0x2aba1b];
        if (!_0x5924de) return;
        _0x1aa296.updateNodeData?.(_0x2aba1b, buildRemoteVideoImportPatch(_0x5ae24a, _0x5924de));
      } catch (_0x364d7c) {
        const _0x2578ce = _toOneLineMessage(_0x364d7c);
        (_0x3d0b76(_0x2578ce || t('fileService.errors.remoteVideoImportFailed')),
          void logDiagnosticEvent({
            type: 'import.web_video_failed',
            level: 'warn',
            source: 'renderer',
            message: _0x2578ce || t('fileService.errors.remoteVideoImportFailed'),
            error: _0x364d7c,
            context: { url: _0x43f493.url, pageUrl: _0x43f493.pageUrl, projectId: _0x3bbe26 },
          }));
      }
    }),
    true
  );
}
export function createWebImageSourceNode({
  payload: _0x30efa7,
  worldX: _0x32e90c,
  worldY: _0x339c09,
  storeInstance: storeInstance = appStore,
  projectId: _0x15572f,
  select: select = true,
  importRemote: importRemote = true,
  importRemoteAsset: _0x18c042,
} = {}) {
  const _0xc4318c = normalizeWebImagePayload(_0x30efa7);
  if (!_0xc4318c) return null;
  const _0x97012a = buildWebImageDropNodePayload({
    url: _0xc4318c.url,
    title: _0xc4318c.title,
    pageUrl: _0xc4318c.pageUrl,
    width: _0xc4318c.width,
    height: _0xc4318c.height,
    worldX: _0x32e90c,
    worldY: _0x339c09,
  });
  if (!_0x97012a) return null;
  storeInstance.addNode?.(_0x97012a);
  if (select) storeInstance.setSelectedNodes?.([_0x97012a.id]);
  return (
    importRemote &&
      scheduleWebImageRemoteImport(_0x97012a.id, _0xc4318c, {
        storeInstance: storeInstance,
        projectId: _0x15572f,
        importRemoteAsset: _0x18c042,
      }),
    _0x97012a
  );
}
export function createWebVideoSourceNode({
  payload: _0x55f960,
  worldX: _0x122d4d,
  worldY: _0xa511ff,
  storeInstance: storeInstance = appStore,
  projectId: _0xe88c6a,
  select: select = true,
  importRemote: importRemote = true,
  importRemoteAsset: _0xf9757b,
} = {}) {
  const _0x38aa49 = normalizeWebVideoPayload(_0x55f960);
  if (!_0x38aa49 || _0x38aa49.rightsConfirmed !== true) return null;
  const _0x632a3d = buildWebVideoSourceNodePayload({
    url: _0x38aa49.url,
    title: _0x38aa49.title,
    pageUrl: _0x38aa49.pageUrl,
    width: _0x38aa49.width,
    height: _0x38aa49.height,
    duration: _0x38aa49.duration,
    worldX: _0x122d4d,
    worldY: _0xa511ff,
  });
  if (!_0x632a3d) return null;
  storeInstance.addNode?.(_0x632a3d);
  if (select) storeInstance.setSelectedNodes?.([_0x632a3d.id]);
  return (
    importRemote &&
      scheduleWebVideoRemoteImport(_0x632a3d.id, _0x38aa49, {
        storeInstance: storeInstance,
        projectId: _0xe88c6a,
        importRemoteAsset: _0xf9757b,
      }),
    _0x632a3d
  );
}
function createObjectUrlForFilePreview(_0x2f4c8a) {
  const _0x40be2d = String(_0x2f4c8a?.type || '').trim();
  if (!_0x40be2d.startsWith('image/') && !_0x40be2d.startsWith('video/')) return '';
  const _0x3dbe74 = globalThis.window?.URL || globalThis.URL;
  if (typeof _0x3dbe74?.createObjectURL !== 'function') return '';
  try {
    return _0x3dbe74.createObjectURL(_0x2f4c8a);
  } catch {
    return '';
  }
}
function revokeObjectUrl(_0x26e840) {
  const _0x2e9b8a = String(_0x26e840 || '').trim();
  if (!_0x2e9b8a.startsWith('blob:')) return;
  const _0x1b33d5 = globalThis.window?.URL || globalThis.URL;
  if (typeof _0x1b33d5?.revokeObjectURL !== 'function') return;
  try {
    _0x1b33d5.revokeObjectURL(_0x2e9b8a);
  } catch {}
}
function scheduleRevokeObjectUrl(_0x4c6c61) {
  const _0x39c748 = String(_0x4c6c61 || '').trim();
  if (!_0x39c748.startsWith('blob:')) return;
  const _0x1fa52e = globalThis.window?.setTimeout || globalThis.setTimeout;
  if (typeof _0x1fa52e === 'function') {
    _0x1fa52e(() => revokeObjectUrl(_0x39c748), 0);
    return;
  }
  revokeObjectUrl(_0x39c748);
}
function normalizeNaturalSize(_0x532623, _0x43ea67) {
  const _0x4be413 = Math.round(Number(_0x532623) || 0),
    _0x51f023 = Math.round(Number(_0x43ea67) || 0);
  if (_0x4be413 <= 0 || _0x51f023 <= 0) return null;
  return { width: _0x4be413, height: _0x51f023 };
}
function pickNaturalSize(_0x4b04c4 = {}) {
  return normalizeNaturalSize(
    _0x4b04c4?.width ?? _0x4b04c4?.naturalWidth,
    _0x4b04c4?.height ?? _0x4b04c4?.naturalHeight,
  );
}
async function readImageFileNaturalSize(_0x2f0a6b) {
  if (!_0x2f0a6b) return null;
  const _0x3e54f8 = globalThis?.createImageBitmap;
  if (typeof _0x3e54f8 === 'function')
    try {
      const _0xee7dbb = await _0x3e54f8(_0x2f0a6b),
        _0x4a02ea = normalizeNaturalSize(_0xee7dbb?.width, _0xee7dbb?.height);
      if (typeof _0xee7dbb?.close === 'function') _0xee7dbb.close();
      if (_0x4a02ea) return _0x4a02ea;
    } catch {}
  const _0x273218 = globalThis.Image || globalThis.window?.Image,
    _0xdd171c = globalThis.window?.URL || globalThis.URL;
  if (!_0x273218 || typeof _0xdd171c?.createObjectURL !== 'function') return null;
  let _0x5bc08f = '';
  try {
    _0x5bc08f = _0xdd171c.createObjectURL(_0x2f0a6b);
  } catch {
    return null;
  }
  return new Promise((_0x455150) => {
    const _0x122bd8 = new _0x273218();
    let _0x265d32 = false,
      _0x443b71 = null;
    const _0x15bc37 = (_0x30501e) => {
      if (_0x265d32) return;
      _0x265d32 = true;
      if (_0x443b71) clearTimeout(_0x443b71);
      (revokeObjectUrl(_0x5bc08f), _0x455150(_0x30501e));
    };
    ((_0x443b71 = setTimeout(() => _0x15bc37(null), 0x7d0)),
      (_0x122bd8.onload = () =>
        _0x15bc37(
          normalizeNaturalSize(
            _0x122bd8.naturalWidth || _0x122bd8.width,
            _0x122bd8.naturalHeight || _0x122bd8.height,
          ),
        )),
      (_0x122bd8.onerror = () => _0x15bc37(null)),
      (_0x122bd8.src = _0x5bc08f));
  });
}
async function readVideoFileNaturalSize(_0x54ad11) {
  const _0x547afa = globalThis.document,
    _0x15f673 = globalThis.window?.URL || globalThis.URL;
  if (!_0x54ad11 || typeof _0x547afa?.createElement !== 'function') return null;
  if (typeof _0x15f673?.createObjectURL !== 'function') return null;
  let _0x3b3f1b = '';
  try {
    _0x3b3f1b = _0x15f673.createObjectURL(_0x54ad11);
  } catch {
    return null;
  }
  return new Promise((_0x40a5b8) => {
    const _0x4245f4 = _0x547afa.createElement('video');
    let _0x5d7bf8 = false,
      _0x2bf689 = null;
    const _0x28a244 = (_0x577606) => {
      if (_0x5d7bf8) return;
      _0x5d7bf8 = true;
      if (_0x2bf689) clearTimeout(_0x2bf689);
      _0x4245f4.removeAttribute('src');
      try {
        _0x4245f4.load?.();
      } catch {}
      (revokeObjectUrl(_0x3b3f1b), _0x40a5b8(_0x577606));
    };
    ((_0x2bf689 = setTimeout(() => _0x28a244(null), 0x9c4)),
      (_0x4245f4.preload = 'metadata'),
      (_0x4245f4.muted = true),
      (_0x4245f4.onloadedmetadata = () =>
        _0x28a244(normalizeNaturalSize(_0x4245f4.videoWidth, _0x4245f4.videoHeight))),
      (_0x4245f4.onerror = () => _0x28a244(null)),
      (_0x4245f4.src = _0x3b3f1b));
  });
}
export async function readFileNaturalSize(_0x21f297, _0x5d0ef2 = '') {
  const _0x4efee1 = String(_0x5d0ef2 || getNodeTypeByFile(_0x21f297) || '').trim();
  if (_0x4efee1 === 'source-image') return readImageFileNaturalSize(_0x21f297);
  if (_0x4efee1 === 'source-video') return readVideoFileNaturalSize(_0x21f297);
  return null;
}
function getElectronImportLocalFile() {
  const _0xc2eae1 = globalThis.window?.electronAPI?.importLocalFile;
  return typeof _0xc2eae1 === 'function' ? _0xc2eae1 : null;
}
function getElectronLocalPreviewUrl() {
  const _0x270db6 = globalThis.window?.electronAPI?.getLocalPreviewUrl;
  return typeof _0x270db6 === 'function' ? _0x270db6 : null;
}
function getElectronFilePath(_0x5c84ef) {
  if (!globalThis.window?.electronAPI) return '';
  const _0x48d711 = String(_0x5c84ef?.path || '').trim();
  if (_0x48d711)
    return (
      _profileDragImport('electron-file-path:direct', { name: _0x5c84ef?.name || '', path: _0x48d711 }),
      _0x48d711
    );
  const _0x2e5ca2 = globalThis.window?.electronAPI?.getPathForFile;
  if (typeof _0x2e5ca2 !== 'function')
    return (
      _profileDragImport('electron-file-path:missing-api', {
        name: _0x5c84ef?.name || '',
        hasElectronAPI: !!globalThis.window?.electronAPI,
      }),
      ''
    );
  try {
    const _0x2987e4 = String(_0x2e5ca2(_0x5c84ef) || '').trim();
    return (
      _profileDragImport('electron-file-path:webutils', { name: _0x5c84ef?.name || '', path: _0x2987e4 }),
      _0x2987e4
    );
  } catch (_0x3b3742) {
    return (
      _profileDragImport('electron-file-path:error', {
        name: _0x5c84ef?.name || '',
        error: _toOneLineMessage(_0x3b3742),
      }),
      ''
    );
  }
}
function canUseElectronLocalImport(_0x214ff3) {
  return !!(getElectronImportLocalFile() && getElectronFilePath(_0x214ff3));
}
function isPreviewablePendingFile(_0x2e6475, _0x406c2b = '') {
  const _0x1ed759 = String(_0x2e6475?.type || '').trim();
  return (
    _0x406c2b === 'source-image' ||
    _0x406c2b === 'source-video' ||
    _0x1ed759.startsWith('image/') ||
    _0x1ed759.startsWith('video/')
  );
}
function isAllowedCapturePreviewUrl(_0x3a27f0) {
  const _0x5c4a90 = String(_0x3a27f0 || '').trim();
  return (
    _0x5c4a90.startsWith('blob:') ||
    _0x5c4a90.startsWith('data:image/') ||
    _0x5c4a90.startsWith('aic-local-preview:')
  );
}
function waitForNextPaint() {
  const _0x44ecb4 = globalThis.window?.requestAnimationFrame || globalThis.requestAnimationFrame;
  if (typeof _0x44ecb4 === 'function')
    return new Promise((_0x5a45cc) => {
      let _0x3e9770 = false,
        _0x25b46f = null;
      const _0x45aeeb = () => {
        if (_0x3e9770) return;
        _0x3e9770 = true;
        if (_0x25b46f) clearTimeout(_0x25b46f);
        _0x5a45cc();
      };
      ((_0x25b46f = setTimeout(_0x45aeeb, 50)), _0x44ecb4(_0x45aeeb));
    });
  return new Promise((_0x2f059a) => setTimeout(_0x2f059a, 0));
}
async function createCapturePreviewUrlForFile(_0x2683e0, _0x422325 = '') {
  if (!isPreviewablePendingFile(_0x2683e0, _0x422325)) return '';
  const _0x2b463a = getElectronLocalPreviewUrl(),
    _0x298bde = getElectronImportLocalFile();
  if (_0x2b463a && _0x298bde) {
    const _0xa8c310 = getElectronFilePath(_0x2683e0);
    if (_0xa8c310)
      try {
        const _0x1ff2d7 = await _0x2b463a({
            path: _0xa8c310,
            name: _0x2683e0?.name || '',
            type: _0x2683e0?.type || '',
          }),
          _0x3d41d7 = typeof _0x1ff2d7 === 'string' ? _0x1ff2d7 : String(_0x1ff2d7?.url || '').trim();
        if (isAllowedCapturePreviewUrl(_0x3d41d7))
          return (
            _profileDragImport('electron-preview-url:done', { name: _0x2683e0?.name || '', url: _0x3d41d7 }),
            _0x3d41d7
          );
      } catch (_0x464526) {
        _profileDragImport('electron-preview-url:error', {
          name: _0x2683e0?.name || '',
          error: _toOneLineMessage(_0x464526),
        });
      }
  }
  return createObjectUrlForFilePreview(_0x2683e0);
}
async function importFileWithBestAvailableFlow(_0x47f28f, _0x32df59, _0x12158c = '') {
  const _0x59cf7d = getElectronImportLocalFile();
  if (_0x59cf7d) {
    const _0x4c4dd9 = getElectronFilePath(_0x47f28f);
    if (_0x4c4dd9)
      try {
        const _0xdc9048 = await _0x59cf7d({
          path: _0x4c4dd9,
          name: _0x47f28f?.name || '',
          type: _0x47f28f?.type || '',
          projectId: _0x32df59,
        });
        _profileDragImport('electron-import:done', {
          name: _0x47f28f?.name || '',
          localPath: _0xdc9048?.localPath || '',
          displayLocalPath: _0xdc9048?.displayLocalPath || '',
          thumbLocalPath: _0xdc9048?.thumbLocalPath || '',
        });
        const _0x583987 = String(_0xdc9048?.localPath || '').trim(),
          _0x55b4f7 = !!String(
            _0xdc9048?.displayLocalPath || _0xdc9048?.thumbLocalPath || _0xdc9048?.originalLocalPath || '',
          ).trim();
        if (_0xdc9048 && _0x12158c === 'source-image' && _0x583987 && !_0x55b4f7)
          try {
            _profileDragImport('ensure-derivatives:start', { localPath: _0x583987 });
            const _0x392ba1 = await ensureLocalImageDerivatives(_0x583987);
            return (
              _profileDragImport('ensure-derivatives:done', {
                localPath: _0x392ba1?.localPath || '',
                displayLocalPath: _0x392ba1?.displayLocalPath || '',
                thumbLocalPath: _0x392ba1?.thumbLocalPath || '',
              }),
              _0x392ba1
            );
          } catch (_0x62ba43) {
            return (
              console.warn('[fileService] Electron 本地导入图片派生生成失败，使用原始文件:', _0x62ba43),
              _0xdc9048
            );
          }
        if (_0xdc9048) return _0xdc9048;
      } catch (_0x5c454e) {
        console.warn('[fileService] Electron 本地导入失败，回退上传流程:', _0x5c454e);
      }
  }
  return uploadFile(_0x47f28f, _0x32df59);
}
export function buildPendingFileNodePayload(_0x23a475, _0x24ca6f, _0xdba0d0, _0x376192, _0x1b5de3 = {}) {
  const _0x3d5e59 = getNodeTypeByFile(_0x23a475);
  if (!_0x3d5e59 || _0x3d5e59 === 'source-text') return null;
  const _0x2fb401 = _0x376192 || generateNodeId(_0x3d5e59),
    _0x4c0b4a = getBaseName(_0x23a475?.name),
    _0xe2576b = pickNaturalSize(
      _0x1b5de3.mediaNaturalSize || { width: _0x1b5de3.naturalWidth, height: _0x1b5de3.naturalHeight },
    ),
    _0x3a728c = {
      id: _0x2fb401,
      type: _0x3d5e59,
      x: _0x24ca6f,
      y: _0xdba0d0,
      fileName: _0x23a475?.name || '',
      name: _0x4c0b4a || getDefaultNodeName(_0x3d5e59),
      isGenerating: true,
      jobStatus: 'running',
      jobError: null,
      generationStartTime: Date.now(),
      generationDuration: null,
    };
  if (_0x3d5e59 === 'source-image' || _0x3d5e59 === 'source-video')
    return buildSourceMediaNodePayload({
      ..._0x3a728c,
      naturalWidth: _0xe2576b?.width,
      naturalHeight: _0xe2576b?.height,
      capturePreviewUrl:
        typeof _0x1b5de3.capturePreviewUrl === 'string'
          ? _0x1b5de3.capturePreviewUrl
          : createObjectUrlForFilePreview(_0x23a475),
    });
  if (_0x3d5e59 === 'source-audio') return buildSourceAudioNodePayload(_0x3a728c);
  return null;
}
function readTextFile(_0xf322aa) {
  return new Promise((_0x3a6181, _0x4b8d43) => {
    const _0x2502ce = new FileReader();
    ((_0x2502ce.onload = (_0x172496) => _0x3a6181(_0x172496.target.result)),
      (_0x2502ce.onerror = _0x4b8d43),
      _0x2502ce.readAsText(_0xf322aa, 'UTF-8'));
  });
}
export async function processFile(_0x41c5c8, _0x5b596f, _0x456189, _0x57e203, _0x5ceef3 = {}) {
  const _0x212cb8 = getNodeTypeByFile(_0x41c5c8);
  if (!_0x212cb8)
    return (
      console.warn('[fileService] 暂不支持此类型文件: ' + _0x41c5c8.type),
      showWarning(
        t('fileService.errors.unsupportedFileType', {
          file: _0x41c5c8.name || _0x41c5c8.type || t('fileService.defaultNames.unknownFile'),
        }),
      ),
      null
    );
  const { width: _0x2b1e62, height: _0x5e1cb5 } = getNodeDefaultSize(_0x212cb8),
    _0x30ffed = _0x5ceef3?.nodeId || generateNodeId(_0x212cb8),
    _0x1146be = getBaseName(_0x41c5c8.name),
    _0x687d69 = pickNaturalSize(
      _0x5ceef3?.mediaNaturalSize || { width: _0x5ceef3?.naturalWidth, height: _0x5ceef3?.naturalHeight },
    );
  try {
    if (_0x212cb8 === 'source-text') {
      const _0x2f3446 = await readTextFile(_0x41c5c8);
      return {
        id: _0x30ffed,
        type: _0x212cb8,
        x: _0x5b596f,
        y: _0x456189,
        width: _0x2b1e62,
        height: _0x5e1cb5,
        text: _0x2f3446,
        content: _0x2f3446,
        fileName: _0x41c5c8.name,
        name: _0x1146be || t('fileService.defaultNames.text'),
        isGenerating: false,
        jobStatus: null,
        jobError: null,
      };
    } else {
      const _0x24c0a =
          _0x212cb8 === 'source-image' && !canUseElectronLocalImport(_0x41c5c8)
            ? (() => {
                const _0x12afd0 = URL.createObjectURL(_0x41c5c8);
                return generateThumbnail(_0x12afd0).finally(() => {
                  URL.revokeObjectURL(_0x12afd0);
                });
              })()
            : Promise.resolve(null),
        _0x47dc72 = await importFileWithBestAvailableFlow(_0x41c5c8, _0x57e203, _0x212cb8),
        _0x1d2c57 = await _0x24c0a,
        _0x52a255 = pickResultLocalPath(_0x47dc72),
        _0x5c0311 = localPathToUrl(_0x52a255);
      if (_0x212cb8 === 'source-image' && _0x1d2c57)
        try {
          await setThumbnail({ localPath: _0x52a255, src: _0x5c0311, imageUrl: _0x5c0311 }, _0x1d2c57);
        } catch (_0x229813) {
          console.warn('[fileService] 写入缩略图缓存失败:', _0x229813);
        }
      const _0x48c440 = _0x212cb8 === 'source-image' ? buildImageNodeStorageFields(_0x47dc72) : {},
        _0x5ee540 = {
          assetId: _0x47dc72.assetId || '',
          originalLocalPath: _0x47dc72.originalLocalPath || _0x47dc72.localPath || '',
          displayLocalPath: _0x47dc72.displayLocalPath || '',
          posterLocalPath: _0x47dc72.posterLocalPath || '',
          waveformLocalPath: _0x47dc72.waveformLocalPath || '',
          derivativeStatus: _0x47dc72.derivativeStatus || _0x47dc72.status || '',
          mediaTaskId: _0x47dc72.mediaTaskId || '',
          mediaTaskKind: _0x47dc72.mediaTaskKind || '',
          mediaTaskStatus: _0x47dc72.mediaTaskStatus || '',
          mediaTaskProgress: Number(_0x47dc72.mediaTaskProgress || 0) || 0,
          mediaTaskError: _0x47dc72.mediaTaskError || '',
          videoProxyStatus: _0x47dc72.videoProxyStatus || '',
          videoCodec: _0x47dc72.videoCodec || '',
          videoDuration: Number(_0x47dc72.videoDuration || 0) || 0,
          videoFps: Number(_0x47dc72.videoFps || 0) || 0,
        };
      _0x212cb8 === 'source-video' &&
        (_0x47dc72.posterLocalPath || _0x47dc72.posterUrl || _0x47dc72.thumbUrl) &&
        ((_0x5ee540.thumbUrl = _0x47dc72.posterUrl || _0x47dc72.thumbUrl || ''),
        (_0x5ee540.thumbLocalPath = _0x47dc72.posterLocalPath || _0x47dc72.thumbLocalPath || ''));
      const _0x12e3f1 = String(_0x47dc72.mediaTaskStatus || '').trim(),
        _0xdaba52 = String(_0x47dc72.videoProxyStatus || '').trim(),
        _0x3c03fb = _0x12e3f1 === 'waiting' || _0x12e3f1 === 'processing',
        _0xd5d4d9 =
          _0x212cb8 === 'source-video' &&
          _0x3c03fb &&
          isAllowedCapturePreviewUrl(_0x5ceef3?.capturePreviewUrl)
            ? String(_0x5ceef3.capturePreviewUrl || '').trim()
            : '',
        _0x4e318b = Number(_0x47dc72.videoWidth || _0x47dc72.width || 0) || _0x687d69?.width || 0,
        _0x2242e3 = Number(_0x47dc72.videoHeight || _0x47dc72.height || 0) || _0x687d69?.height || 0,
        _0x56b6a4 = Number(_0x48c440.originalWidth || _0x47dc72.originalWidth || 0) || _0x687d69?.width || 0,
        _0x1753ad =
          Number(_0x48c440.originalHeight || _0x47dc72.originalHeight || 0) || _0x687d69?.height || 0,
        _0x27d66c =
          _0x212cb8 === 'source-video' && _0xdaba52 === 'processing'
            ? ''
            : localPathToUrl(_0x47dc72.displayLocalPath) || _0x5c0311,
        _0x52b6a2 =
          _0x212cb8 === 'source-image'
            ? {
                originalWidth: _0x56b6a4 || undefined,
                originalHeight: _0x1753ad || undefined,
                imageWidth: _0x56b6a4 || undefined,
                imageHeight: _0x1753ad || undefined,
              }
            : {},
        _0x3948e2 = _0x212cb8 === 'source-video' ? { videoWidth: _0x4e318b, videoHeight: _0x2242e3 } : {},
        _0x19ce47 = {
          id: _0x30ffed,
          type: _0x212cb8,
          x: _0x5b596f,
          y: _0x456189,
          width: _0x2b1e62,
          height: _0x5e1cb5,
          src: _0x212cb8 === 'source-video' ? _0x27d66c : _0x5c0311,
          localPath: _0x52a255,
          ..._0x5ee540,
          ..._0x48c440,
          fileName: _0x41c5c8.name,
          name: _0x1146be || getDefaultNodeName(_0x212cb8),
          ..._0x52b6a2,
          naturalWidth: _0x212cb8 === 'source-video' ? _0x4e318b : _0x56b6a4,
          naturalHeight: _0x212cb8 === 'source-video' ? _0x2242e3 : _0x1753ad,
          ..._0x3948e2,
          isGenerating: _0x3c03fb,
          jobStatus: _0x3c03fb ? 'running' : null,
          jobError: null,
          generationDuration: null,
          capturePreviewUrl: _0xd5d4d9,
        };
      if (_0x212cb8 === 'source-image' || _0x212cb8 === 'source-video')
        return buildSourceMediaNodePayload(_0x19ce47);
      return _0x19ce47;
    }
  } catch (_0x4762b8) {
    console.error('[fileService] 文件 ' + _0x41c5c8.name + ' 处理失败:', _0x4762b8);
    throw _0x4762b8;
  }
}
export async function handleFileDrop(_0x1bfbc6, _0x423ebc) {
  const _0x1ad425 = _0x1bfbc6.dataTransfer.files;
  if (!_0x1ad425 || _0x1ad425.length === 0) return false;
  _profileDragImport('drop:start', { count: _0x1ad425.length, projectId: _0x423ebc });
  if (_0x1ad425.length === 1 && /\.(json|aicpkg)$/i.test(_0x1ad425[0].name || '')) return false;
  (_0x1bfbc6.preventDefault(), _0x1bfbc6.stopPropagation());
  const { viewport: _0x414dc0 } = appStore.getState(),
    _0x43ec54 = screenToWorld(_0x1bfbc6.clientX, _0x1bfbc6.clientY, _0x414dc0);
  let _0x332691 = _0x43ec54.x,
    _0x562891 = _0x43ec54.y,
    _0x4f6023 = false;
  for (let _0x39142e = 0; _0x39142e < _0x1ad425.length; _0x39142e++) {
    const _0xd1d71 = _0x1ad425[_0x39142e],
      _0x57b99d = getNodeTypeByFile(_0xd1d71);
    _profileDragImport('file:start', {
      name: _0xd1d71?.name || '',
      type: _0xd1d71?.type || '',
      size: _0xd1d71?.size || 0,
      nodeType: _0x57b99d,
      canUseElectronLocalImport: canUseElectronLocalImport(_0xd1d71),
    });
    let _0x55ae94 = '',
      _0xc65740 = null;
    _0x57b99d &&
      _0x57b99d !== 'source-text' &&
      ((_0x55ae94 = await createCapturePreviewUrlForFile(_0xd1d71, _0x57b99d)),
      _0x57b99d !== 'source-video' && (_0xc65740 = await readFileNaturalSize(_0xd1d71, _0x57b99d)));
    _0xc65740 &&
      _profileDragImport('file:natural-size', {
        name: _0xd1d71?.name || '',
        width: _0xc65740.width,
        height: _0xc65740.height,
      });
    const _0x20e4e6 =
        _0x57b99d && _0x57b99d !== 'source-text'
          ? buildPendingFileNodePayload(
              _0xd1d71,
              _0x332691,
              _0x562891,
              generateNodeId(_0x57b99d, _0x39142e),
              { capturePreviewUrl: _0x55ae94, mediaNaturalSize: _0xc65740 },
            )
          : null,
      _0x11a72c = _0x20e4e6?.capturePreviewUrl || '';
    _0x20e4e6 &&
      (appStore.addNode(_0x20e4e6),
      appStore.setSelectedNodes([_0x20e4e6.id]),
      _profileDragImport('pending:add', {
        id: _0x20e4e6.id,
        name: _0xd1d71?.name || '',
        hasCapturePreviewUrl: !!_0x20e4e6.capturePreviewUrl,
        jobStatus: _0x20e4e6.jobStatus || '',
      }),
      (_0x4f6023 = true),
      (_0x332691 += 30),
      (_0x562891 += 30),
      _0x20e4e6.type === 'source-video' && (await waitForNextPaint()));
    try {
      _profileDragImport('process:start', { name: _0xd1d71?.name || '', pendingId: _0x20e4e6?.id || '' });
      const _0x5f1e6b = await processFile(
        _0xd1d71,
        _0x20e4e6 ? _0x20e4e6.x : _0x332691,
        _0x20e4e6 ? _0x20e4e6.y : _0x562891,
        _0x423ebc,
        _0x20e4e6
          ? { nodeId: _0x20e4e6.id, mediaNaturalSize: _0xc65740, capturePreviewUrl: _0x55ae94 }
          : { mediaNaturalSize: _0xc65740, capturePreviewUrl: _0x55ae94 },
      );
      _profileDragImport('process:done', {
        name: _0xd1d71?.name || '',
        pendingId: _0x20e4e6?.id || '',
        localPath: _0x5f1e6b?.localPath || '',
        displayLocalPath: _0x5f1e6b?.displayLocalPath || '',
        thumbLocalPath: _0x5f1e6b?.thumbLocalPath || '',
        jobStatus: _0x5f1e6b?.jobStatus || '',
      });
      if (_0x5f1e6b) {
        if (_0x20e4e6) {
          const _0xe51ad2 = appStore.getState().nodes?.[_0x20e4e6.id];
          _0xe51ad2
            ? (appStore.updateNodeData(_0x20e4e6.id, _0x5f1e6b),
              _profileDragImport('pending:update-final', {
                id: _0x20e4e6.id,
                localPath: _0x5f1e6b?.localPath || '',
                displayLocalPath: _0x5f1e6b?.displayLocalPath || '',
                thumbLocalPath: _0x5f1e6b?.thumbLocalPath || '',
              }),
              _0x5f1e6b.capturePreviewUrl !== _0x11a72c && scheduleRevokeObjectUrl(_0x11a72c))
            : revokeObjectUrl(_0x11a72c);
        } else
          (appStore.addNode(_0x5f1e6b),
            appStore.setSelectedNodes([_0x5f1e6b.id]),
            (_0x4f6023 = true),
            (_0x332691 += 30),
            (_0x562891 += 30));
      }
    } catch (_0x4d93b8) {
      const _0x4c71e3 = _toOneLineMessage(_0x4d93b8),
        _0x460b4b = _0x4c71e3 || t('fileService.errors.importFailed');
      (void logDiagnosticEvent({
        type: 'import.file_failed',
        level: 'error',
        source: 'renderer',
        message: _0x460b4b,
        error: _0x4d93b8,
        context: {
          fileName: _0xd1d71?.name || '',
          fileType: _0xd1d71?.type || '',
          fileSize: Number(_0xd1d71?.size || 0) || 0,
          projectId: _0x423ebc || '',
        },
      }),
        _0x20e4e6 &&
          appStore.getState().nodes?.[_0x20e4e6.id] &&
          appStore.updateNodeData(_0x20e4e6.id, {
            isGenerating: false,
            jobStatus: 'error',
            jobError: _0x460b4b,
            generationDuration: Date.now() - Number(_0x20e4e6.generationStartTime || Date.now()),
            capturePreviewUrl: '',
          }),
        revokeObjectUrl(_0x11a72c),
        showError(
          t('fileService.errors.importFailedWithFile', {
            file: _0xd1d71?.name || t('fileService.defaultNames.file'),
            reason: _0x4c71e3 ? t('fileService.errors.importFailedReason', { reason: _0x4c71e3 }) : '',
          }).trim(),
        ),
        console.error('[fileService] 处理文件失败:', _0x4d93b8));
    }
  }
  return _0x4f6023;
}
export async function handleWebImageUrlDrop(_0x4b27e6, _0x10f874 = {}) {
  const _0x10d256 = extractWebImageDropPayload(_0x4b27e6?.dataTransfer);
  if (!_0x10d256?.url) return false;
  (_0x4b27e6?.preventDefault?.(), _0x4b27e6?.stopPropagation?.());
  const _0x18fd71 = _0x10f874.storeInstance || appStore,
    _0x538b74 = typeof _0x18fd71.getState === 'function' ? _0x18fd71.getState() : {},
    _0x141785 = screenToWorld(_0x4b27e6?.clientX || 0, _0x4b27e6?.clientY || 0, _0x538b74.viewport || {}),
    _0x4b84d4 = createWebImageSourceNode({
      payload: _0x10d256,
      worldX: _0x141785.x,
      worldY: _0x141785.y,
      storeInstance: _0x18fd71,
      projectId: _0x10f874.projectId,
      importRemote: _0x10f874.importRemote !== false,
    });
  if (!_0x4b84d4) return false;
  return (
    _profileDragImport('web-image:add', {
      id: _0x4b84d4.id,
      url: _0x10d256.url,
      pageUrl: _0x10d256.pageUrl || '',
    }),
    true
  );
}
export function downloadJson(_0x39730e, _0x22c01d) {
  const _0x3c452c = new Blob([JSON.stringify(_0x39730e, null, 2)], { type: 'application/json' }),
    _0x5b8840 = URL.createObjectURL(_0x3c452c),
    _0xeec5a6 = document.createElement('a');
  ((_0xeec5a6.href = _0x5b8840),
    (_0xeec5a6.download = _0x22c01d),
    document.body.appendChild(_0xeec5a6),
    _0xeec5a6.click(),
    document.body.removeChild(_0xeec5a6),
    URL.revokeObjectURL(_0x5b8840));
}
export function readJsonFile(_0x3e8c6f) {
  return new Promise((_0x5070c7, _0x4948f3) => {
    const _0x2a97de = new FileReader();
    ((_0x2a97de.onload = (_0x33cd5e) => {
      try {
        const _0x1c0970 = JSON.parse(_0x33cd5e.target.result);
        _0x5070c7(_0x1c0970);
      } catch (_0x57a9eb) {
        _0x4948f3(new Error(t('fileService.errors.jsonParseFailed')));
      }
    }),
      (_0x2a97de.onerror = () => _0x4948f3(new Error(t('fileService.errors.fileReadFailed')))),
      _0x2a97de.readAsText(_0x3e8c6f));
  });
}
