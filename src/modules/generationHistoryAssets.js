import { buildImageNodeStorageFields } from '../services/imageDerivativeService.js';
import { createStableSignature } from '../utils/stableSignature.js';
import { localPathToUrl, normalizeLocalPath as normalizeLocalPath_2 } from '../utils/localMediaPath.js';
import { getLocale, t } from '../i18n/index.js';
export const GENERATION_HISTORY_CATEGORY = '出图历史';
export const GENERATION_HISTORY_KIND = 'generation-history';
export const GENERATION_HISTORY_EVENT = 'aicanvas:generation-history:add';
export const GENERATION_HISTORY_MEDIA_KINDS = Object.freeze({
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
});
function firstNonEmptyString(..._0x51b458) {
  for (const _0x200fc9 of _0x51b458) {
    const _0xcef8ea = String(_0x200fc9 || '').trim();
    if (_0xcef8ea) return _0xcef8ea;
  }
  return '';
}
function normalizeProjectId(_0x40a41c) {
  return String(_0x40a41c || '').trim() || 'default_v2_project';
}
function normalizeCanvasId(_0x43a194) {
  return String(_0x43a194 || '').trim() || 'canvas_1';
}
function normalizeLocalPath(_0x398c6a) {
  return normalizeLocalPath_2(_0x398c6a);
}
function toLocalUrl(_0x3382d6) {
  return localPathToUrl(_0x3382d6);
}
function hashString(_0x3e2633) {
  const _0x27d8e7 = String(_0x3e2633 || '');
  let _0x173717 = 0x811c9dc5;
  for (let _0x127740 = 0; _0x127740 < _0x27d8e7.length; _0x127740 += 1) {
    ((_0x173717 ^= _0x27d8e7.charCodeAt(_0x127740)), (_0x173717 = Math.imul(_0x173717, 0x1000193)));
  }
  return (_0x173717 >>> 0).toString(36);
}
function sanitizeIdPart(_0x518f3f) {
  return String(_0x518f3f || '')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}
function formatHistoryDate(_0x42a7c5, _0x4626fb) {
  return new Date(_0x42a7c5).toLocaleString(getLocale(), _0x4626fb);
}
function pickImageLocalPath(_0x3ed211 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(_0x3ed211.localPath),
    normalizeLocalPath(_0x3ed211.originalLocalPath),
    normalizeLocalPath(_0x3ed211.displayLocalPath),
    normalizeLocalPath(_0x3ed211.imageUrl),
    normalizeLocalPath(_0x3ed211.sourceUrl),
    normalizeLocalPath(_0x3ed211.url),
    normalizeLocalPath(_0x3ed211.resultUrl),
  );
}
function pickVideoLocalPath(_0x3b6cf7 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(_0x3b6cf7.localPath),
    normalizeLocalPath(_0x3b6cf7.originalLocalPath),
    normalizeLocalPath(_0x3b6cf7.displayLocalPath),
    normalizeLocalPath(_0x3b6cf7.videoUrl),
    normalizeLocalPath(_0x3b6cf7.sourceUrl),
    normalizeLocalPath(_0x3b6cf7.url),
    normalizeLocalPath(_0x3b6cf7.resultUrl),
  );
}
function pickAudioLocalPath(_0x1feb33 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(_0x1feb33.localPath),
    normalizeLocalPath(_0x1feb33.originalLocalPath),
    normalizeLocalPath(_0x1feb33.displayLocalPath),
    normalizeLocalPath(_0x1feb33.audioUrl),
    normalizeLocalPath(_0x1feb33.sourceUrl),
    normalizeLocalPath(_0x1feb33.url),
    normalizeLocalPath(_0x1feb33.resultUrl),
  );
}
function pickImageDisplayUrl(_0x220e94 = {}) {
  return firstNonEmptyString(
    toLocalUrl(_0x220e94.displayLocalPath),
    toLocalUrl(_0x220e94.localPath),
    toLocalUrl(_0x220e94.originalLocalPath),
    toLocalUrl(_0x220e94.imageUrl),
    toLocalUrl(_0x220e94.sourceUrl),
    String(_0x220e94.imageUrl || '').trim(),
    String(_0x220e94.sourceUrl || '').trim(),
  );
}
function pickImageThumbUrl(_0x1dbf46 = {}) {
  return firstNonEmptyString(
    toLocalUrl(_0x1dbf46.thumbLocalPath),
    toLocalUrl(_0x1dbf46.displayLocalPath),
    toLocalUrl(_0x1dbf46.localPath),
    toLocalUrl(_0x1dbf46.thumbUrl),
    String(_0x1dbf46.thumbUrl || '').trim(),
  );
}
function pickVideoDisplayUrl(_0x34dabf = {}) {
  return firstNonEmptyString(
    toLocalUrl(_0x34dabf.displayLocalPath),
    toLocalUrl(_0x34dabf.localPath),
    toLocalUrl(_0x34dabf.originalLocalPath),
    toLocalUrl(_0x34dabf.videoUrl),
    toLocalUrl(_0x34dabf.sourceUrl),
    String(_0x34dabf.videoUrl || '').trim(),
    String(_0x34dabf.sourceUrl || '').trim(),
    String(_0x34dabf.url || '').trim(),
  );
}
function pickVideoThumbUrl(_0x335831 = {}) {
  return firstNonEmptyString(
    toLocalUrl(_0x335831.thumbLocalPath),
    toLocalUrl(_0x335831.thumbUrl),
    String(_0x335831.thumbUrl || '').trim(),
    toLocalUrl(_0x335831.posterLocalPath),
    String(_0x335831.posterUrl || '').trim(),
    toLocalUrl(_0x335831.coverLocalPath),
    String(_0x335831.coverUrl || '').trim(),
    toLocalUrl(_0x335831.displayLocalPath),
    toLocalUrl(_0x335831.localPath),
  );
}
function pickAudioDisplayUrl(_0x118f37 = {}) {
  return firstNonEmptyString(
    toLocalUrl(_0x118f37.displayLocalPath),
    toLocalUrl(_0x118f37.localPath),
    toLocalUrl(_0x118f37.originalLocalPath),
    toLocalUrl(_0x118f37.audioUrl),
    toLocalUrl(_0x118f37.sourceUrl),
    String(_0x118f37.audioUrl || '').trim(),
    String(_0x118f37.sourceUrl || '').trim(),
    String(_0x118f37.url || '').trim(),
  );
}
function hasUsableImageResult(_0x276644 = {}) {
  if (!_0x276644 || typeof _0x276644 !== 'object') return false;
  if (String(_0x276644.error || '').trim()) return false;
  return Boolean(
    firstNonEmptyString(
      _0x276644.localPath,
      _0x276644.originalLocalPath,
      _0x276644.displayLocalPath,
      _0x276644.thumbLocalPath,
      _0x276644.imageUrl,
      _0x276644.sourceUrl,
      _0x276644.thumbUrl,
      _0x276644.sourceId,
      _0x276644.thumbId,
    ),
  );
}
function hasUsableVideoResult(_0x5c77a4 = {}) {
  if (!_0x5c77a4 || typeof _0x5c77a4 !== 'object') return false;
  if (String(_0x5c77a4.error || '').trim()) return false;
  return Boolean(
    firstNonEmptyString(
      _0x5c77a4.localPath,
      _0x5c77a4.originalLocalPath,
      _0x5c77a4.displayLocalPath,
      _0x5c77a4.thumbLocalPath,
      _0x5c77a4.videoUrl,
      _0x5c77a4.sourceUrl,
      _0x5c77a4.thumbUrl,
      _0x5c77a4.sourceId,
      _0x5c77a4.thumbId,
    ),
  );
}
function hasUsableAudioResult(_0x3e2a78 = {}) {
  if (!_0x3e2a78 || typeof _0x3e2a78 !== 'object') return false;
  if (String(_0x3e2a78.error || '').trim()) return false;
  return Boolean(
    firstNonEmptyString(
      _0x3e2a78.localPath,
      _0x3e2a78.originalLocalPath,
      _0x3e2a78.displayLocalPath,
      _0x3e2a78.audioUrl,
      _0x3e2a78.sourceUrl,
      _0x3e2a78.sourceId,
    ),
  );
}
function resolveNodeSize(_0x15a539 = {}, _0x2b59ca = {}) {
  const _0xc06288 = Number(_0x15a539.originalWidth || _0x15a539.imageWidth || _0x2b59ca.imageWidth || 0) || 0,
    _0x4a5630 = Number(_0x15a539.originalHeight || _0x15a539.imageHeight || _0x2b59ca.imageHeight || 0) || 0;
  if (_0xc06288 > 0 && _0x4a5630 > 0) {
    const _0x36e15a = 0x104,
      _0x15e37a = _0x36e15a / Math.min(_0xc06288, _0x4a5630);
    return {
      width: Math.max(120, Math.round(_0xc06288 * _0x15e37a)),
      height: Math.max(120, Math.round(_0x4a5630 * _0x15e37a)),
    };
  }
  return { width: Number(_0x2b59ca.width || 0) || 0x104, height: Number(_0x2b59ca.height || 0) || 0x104 };
}
function resolveVideoNodeSize(_0x64229c = {}, _0x440bce = {}) {
  const _0x5b8805 = Number(_0x64229c.videoWidth || _0x64229c.width || _0x440bce.videoWidth || 0) || 0,
    _0x386715 = Number(_0x64229c.videoHeight || _0x64229c.height || _0x440bce.videoHeight || 0) || 0;
  if (_0x5b8805 > 0 && _0x386715 > 0) {
    const _0x3a423a = 0x104,
      _0x509a73 = _0x3a423a / Math.min(_0x5b8805, _0x386715);
    return {
      width: Math.max(160, Math.round(_0x5b8805 * _0x509a73)),
      height: Math.max(120, Math.round(_0x386715 * _0x509a73)),
    };
  }
  return { width: Number(_0x440bce.width || 0) || 0x200, height: Number(_0x440bce.height || 0) || 0x120 };
}
function resolveAudioNodeSize(_0x4bc16e = {}) {
  return { width: Number(_0x4bc16e.width || 0) || 0x140, height: Number(_0x4bc16e.height || 0) || 140 };
}
export function buildGenerationHistoryFingerprint(_0x47d7e2 = {}) {
  const _0x489904 = pickImageLocalPath(_0x47d7e2),
    _0x5bf307 = createStableSignature(
      _0x489904
        ? { kind: GENERATION_HISTORY_MEDIA_KINDS.IMAGE, localPath: _0x489904 }
        : {
            kind: GENERATION_HISTORY_MEDIA_KINDS.IMAGE,
            imageUrl: String(_0x47d7e2.imageUrl || '').trim(),
            sourceUrl: String(_0x47d7e2.sourceUrl || '').trim(),
            thumbUrl: String(_0x47d7e2.thumbUrl || '').trim(),
            sourceId: String(_0x47d7e2.sourceId || '').trim(),
            thumbId: String(_0x47d7e2.thumbId || '').trim(),
          },
    );
  return hashString(_0x5bf307);
}
export function buildGenerationHistoryMediaFingerprint(_0x1e1fa6 = {}, _0xfb9cba = 'image') {
  const _0x3a104c = String(_0xfb9cba || 'image').trim() || 'image',
    _0x13f5d5 =
      _0x3a104c === GENERATION_HISTORY_MEDIA_KINDS.VIDEO
        ? pickVideoLocalPath(_0x1e1fa6)
        : _0x3a104c === GENERATION_HISTORY_MEDIA_KINDS.AUDIO
          ? pickAudioLocalPath(_0x1e1fa6)
          : pickImageLocalPath(_0x1e1fa6),
    _0x5876fa = createStableSignature(
      _0x13f5d5
        ? { kind: _0x3a104c, localPath: _0x13f5d5 }
        : {
            kind: _0x3a104c,
            imageUrl: String(_0x1e1fa6.imageUrl || '').trim(),
            videoUrl: String(_0x1e1fa6.videoUrl || '').trim(),
            audioUrl: String(_0x1e1fa6.audioUrl || '').trim(),
            sourceUrl: String(_0x1e1fa6.sourceUrl || '').trim(),
            thumbUrl: String(_0x1e1fa6.thumbUrl || '').trim(),
            sourceId: String(_0x1e1fa6.sourceId || '').trim(),
            thumbId: String(_0x1e1fa6.thumbId || '').trim(),
          },
    );
  return hashString(_0x5876fa);
}
export function isGenerationHistoryAsset(_0x4efa09) {
  return String(_0x4efa09?.kind || '') === GENERATION_HISTORY_KIND;
}
export function isAssetVisibleInTab(_0x4f0599, _0x4d3091, _0x1f10db) {
  const _0x1684a1 = String(_0x4d3091 || '').trim();
  if (_0x1684a1 === GENERATION_HISTORY_CATEGORY)
    return (
      isGenerationHistoryAsset(_0x4f0599) &&
      normalizeProjectId(_0x4f0599?.projectId) === normalizeProjectId(_0x1f10db)
    );
  if (isGenerationHistoryAsset(_0x4f0599)) return false;
  return String(_0x4f0599?.category || '') === _0x1684a1;
}
export function buildGenerationHistoryAsset({
  image: _0x5a9763,
  nodeData: _0x6fca4b,
  projectId: _0x2f801c,
  canvasId: _0x256948,
  index: index = 0,
  now: now = Date.now(),
} = {}) {
  if (!hasUsableImageResult(_0x5a9763)) return null;
  const _0x3506f1 = normalizeProjectId(_0x2f801c),
    _0x26a1f0 = normalizeCanvasId(_0x256948),
    _0x3dd6d7 = buildGenerationHistoryFingerprint(_0x5a9763),
    _0x42155c = hashString(_0x3506f1),
    _0x5edf2e = hashString(_0x26a1f0),
    _0x522b84 = Math.max(0, Math.trunc(Number(index) || 0)),
    _0x227a3b = 'gen-history-' + _0x42155c + '-' + _0x5edf2e + '-' + _0x3dd6d7,
    _0x2ea889 = buildImageNodeStorageFields(_0x5a9763),
    _0x3a053a = _0x2ea889.localPath || pickImageLocalPath(_0x5a9763),
    _0x210e9e = pickImageDisplayUrl({ ..._0x5a9763, ..._0x2ea889 }),
    _0x29ee46 = pickImageThumbUrl({ ..._0x5a9763, ..._0x2ea889 }),
    { width: _0x1cefe9, height: _0x570325 } = resolveNodeSize(_0x5a9763, _0x6fca4b),
    _0x464af4 = String(_0x6fca4b?.id || '').trim(),
    _0x3c487d =
      String(_0x5a9763?.fileName || '').trim() ||
      String(_0x3a053a || '')
        .split(/[\\/]/)
        .pop() ||
      t('generationHistory.fileFallback.image', { date: formatHistoryDate(now) }),
    _0x53292b = {
      id: 'source-image-history-' + _0x3dd6d7,
      type: 'source-image',
      name: _0x3c487d,
      x: 0,
      y: 0,
      width: _0x1cefe9,
      height: _0x570325,
      src: _0x210e9e || _0x29ee46,
      imageUrl: _0x210e9e || _0x29ee46,
      sourceUrl: _0x210e9e || _0x29ee46,
      thumbUrl: _0x29ee46,
      localPath: _0x3a053a,
      ..._0x2ea889,
      sourceId: String(_0x5a9763?.sourceId || '').trim(),
      thumbId: String(_0x5a9763?.thumbId || '').trim(),
      fileName: _0x3c487d,
      needsAutoResize: true,
    },
    _0xa946c0 = sanitizeIdPart(_0x3506f1) || 'project',
    _0x4e09bb = sanitizeIdPart(_0x464af4) || 'node',
    _0x195289 = formatHistoryDate(now, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return {
    id: _0x227a3b,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS.IMAGE,
    projectId: _0x3506f1,
    canvasId: _0x26a1f0,
    sourceNodeId: _0x464af4,
    resultFingerprint: _0x3dd6d7,
    name: t('generationHistory.assetName.image', { date: _0x195289 }),
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: _0x29ee46 || _0x210e9e,
    coverType: 'image',
    items: [{ type: 'source-image', name: _0x3c487d, thumbSrc: _0x29ee46 || _0x210e9e, nodeData: _0x53292b }],
    nodes: [_0x53292b],
    edges: [],
    model: String(_0x6fca4b?.model || '').trim(),
    provider: String(_0x6fca4b?.provider || '').trim(),
    prompt: String(_0x6fca4b?.prompt || '').trim(),
    aspectRatio: String(_0x6fca4b?.aspectRatio || '').trim(),
    imageSize: String(_0x6fca4b?.imageSize || '').trim(),
    sourceIndex: _0x522b84,
    createdAt: Number(now) || Date.now(),
    updatedAt: Number(now) || Date.now(),
    metaKey: _0xa946c0 + ':' + _0x4e09bb + ':' + _0x3dd6d7,
  };
}
export function buildVideoGenerationHistoryAsset({
  video: _0x4fcf84,
  nodeData: _0x4f8ed9,
  projectId: _0x45a861,
  canvasId: _0x10bbcf,
  index: index = 0,
  now: now = Date.now(),
} = {}) {
  if (!hasUsableVideoResult(_0x4fcf84)) return null;
  const _0x1edc7b = normalizeProjectId(_0x45a861),
    _0x5b3393 = normalizeCanvasId(_0x10bbcf),
    _0x1b53b8 = buildGenerationHistoryMediaFingerprint(_0x4fcf84, 'video'),
    _0x120ed5 = hashString(_0x1edc7b),
    _0x4fd2de = hashString(_0x5b3393),
    _0x55f812 = Math.max(0, Math.trunc(Number(index) || 0)),
    _0x45c0bd = 'gen-history-' + _0x120ed5 + '-' + _0x4fd2de + '-' + _0x1b53b8,
    _0x422e2e = pickVideoLocalPath(_0x4fcf84),
    _0x2d275d = pickVideoDisplayUrl(_0x4fcf84),
    _0x1c5284 = pickVideoThumbUrl(_0x4fcf84),
    { width: _0x4172b3, height: _0x2469c6 } = resolveVideoNodeSize(_0x4fcf84, _0x4f8ed9),
    _0x204da0 = String(_0x4f8ed9?.id || '').trim(),
    _0x403763 =
      String(_0x4fcf84?.fileName || '').trim() ||
      String(_0x422e2e || _0x2d275d || '')
        .split(/[\\/]/)
        .pop() ||
      t('generationHistory.fileFallback.video', { date: formatHistoryDate(now) }),
    _0x4edf4c = _0x2d275d || (_0x422e2e ? '/' + _0x422e2e : ''),
    _0x521c42 = {
      id: 'source-video-history-' + _0x1b53b8,
      type: 'source-video',
      name: _0x403763,
      x: 0,
      y: 0,
      width: _0x4172b3,
      height: _0x2469c6,
      src: _0x4edf4c,
      videoUrl: _0x4edf4c,
      thumbUrl: _0x1c5284,
      videoThumbSrc: _0x1c5284,
      localPath: _0x422e2e,
      sourceId: String(_0x4fcf84?.sourceId || '').trim(),
      thumbId: String(_0x4fcf84?.thumbId || '').trim(),
      fileName: _0x403763,
      videoWidth: Number(_0x4fcf84?.videoWidth || _0x4fcf84?.width || 0) || undefined,
      videoHeight: Number(_0x4fcf84?.videoHeight || _0x4fcf84?.height || 0) || undefined,
      duration: Number(_0x4fcf84?.duration || _0x4fcf84?.videoDuration || 0) || undefined,
      needsAutoResize: true,
    },
    _0x39f02c = sanitizeIdPart(_0x1edc7b) || 'project',
    _0xcb3293 = sanitizeIdPart(_0x204da0) || 'node',
    _0x3fe960 = formatHistoryDate(now, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return {
    id: _0x45c0bd,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS.VIDEO,
    projectId: _0x1edc7b,
    canvasId: _0x5b3393,
    sourceNodeId: _0x204da0,
    resultFingerprint: _0x1b53b8,
    name: t('generationHistory.assetName.video', { date: _0x3fe960 }),
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: _0x1c5284 || _0x4edf4c,
    coverType: 'video',
    items: [{ type: 'source-video', name: _0x403763, thumbSrc: _0x1c5284 || _0x4edf4c, nodeData: _0x521c42 }],
    nodes: [_0x521c42],
    edges: [],
    model: String(_0x4f8ed9?.model || '').trim(),
    provider: String(_0x4f8ed9?.provider || '').trim(),
    prompt: String(_0x4f8ed9?.prompt || '').trim(),
    aspectRatio: String(_0x4f8ed9?.aspectRatio || '').trim(),
    videoSize: String(_0x4f8ed9?.videoSize || _0x4f8ed9?.resolution || '').trim(),
    duration: Number(_0x4fcf84?.duration || _0x4f8ed9?.duration || 0) || undefined,
    sourceIndex: _0x55f812,
    createdAt: Number(now) || Date.now(),
    updatedAt: Number(now) || Date.now(),
    metaKey: _0x39f02c + ':' + _0xcb3293 + ':' + _0x1b53b8,
  };
}
export function buildAudioGenerationHistoryAsset({
  audio: _0x3b89ec,
  nodeData: _0x4a1dd2,
  projectId: _0x4ad9e0,
  canvasId: _0x4efcf2,
  index: index = 0,
  now: now = Date.now(),
} = {}) {
  if (!hasUsableAudioResult(_0x3b89ec)) return null;
  const _0x42c748 = normalizeProjectId(_0x4ad9e0),
    _0x2ec144 = normalizeCanvasId(_0x4efcf2),
    _0x238ce0 = buildGenerationHistoryMediaFingerprint(_0x3b89ec, 'audio'),
    _0x495053 = hashString(_0x42c748),
    _0x1e6b74 = hashString(_0x2ec144),
    _0x345eea = Math.max(0, Math.trunc(Number(index) || 0)),
    _0x13cac3 = 'gen-history-' + _0x495053 + '-' + _0x1e6b74 + '-' + _0x238ce0,
    _0x3840a9 = pickAudioLocalPath(_0x3b89ec),
    _0x647e59 = pickAudioDisplayUrl(_0x3b89ec),
    { width: _0x4e1ded, height: _0x482098 } = resolveAudioNodeSize(_0x4a1dd2),
    _0x16912e = String(_0x4a1dd2?.id || '').trim(),
    _0x38bdc8 =
      String(_0x3b89ec?.fileName || '').trim() ||
      String(_0x3840a9 || _0x647e59 || '')
        .split(/[\\/]/)
        .pop() ||
      t('generationHistory.fileFallback.audio', { date: formatHistoryDate(now) }),
    _0x41300f = {
      id: 'source-audio-history-' + _0x238ce0,
      type: 'source-audio',
      name: _0x38bdc8,
      x: 0,
      y: 0,
      width: _0x4e1ded,
      height: _0x482098,
      src: _0x647e59,
      audioUrl: _0x647e59,
      localPath: _0x3840a9,
      fileName: _0x38bdc8,
      duration: Number(_0x3b89ec?.duration || _0x3b89ec?.audioDuration || 0) || undefined,
    },
    _0x5c94eb = sanitizeIdPart(_0x42c748) || 'project',
    _0x5c7250 = sanitizeIdPart(_0x16912e) || 'node',
    _0xfdc444 = formatHistoryDate(now, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return {
    id: _0x13cac3,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS.AUDIO,
    projectId: _0x42c748,
    canvasId: _0x2ec144,
    sourceNodeId: _0x16912e,
    resultFingerprint: _0x238ce0,
    name: t('generationHistory.assetName.audio', { date: _0xfdc444 }),
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: '',
    coverType: 'audio',
    items: [{ type: 'source-audio', name: _0x38bdc8, thumbSrc: '', nodeData: _0x41300f }],
    nodes: [_0x41300f],
    edges: [],
    model: String(_0x4a1dd2?.model || _0x4a1dd2?.audioWorkflowKey || '').trim(),
    provider: String(_0x4a1dd2?.provider || '').trim(),
    prompt: String(_0x4a1dd2?.prompt || '').trim(),
    audioWorkflowKey: String(_0x4a1dd2?.audioWorkflowKey || '').trim(),
    audioWorkflowLabel: String(_0x4a1dd2?.audioWorkflowLabel || '').trim(),
    duration: Number(_0x3b89ec?.duration || _0x4a1dd2?.duration || 0) || undefined,
    sourceIndex: _0x345eea,
    createdAt: Number(now) || Date.now(),
    updatedAt: Number(now) || Date.now(),
    metaKey: _0x5c94eb + ':' + _0x5c7250 + ':' + _0x238ce0,
  };
}
export function buildGenerationHistoryAssetsFromNode({
  images: _0x38649f,
  videos: _0x5c058c,
  audios: _0x44b419,
  nodeData: _0x31095c,
  projectId: _0x46d2a6,
  canvasId: _0x2a8c3f,
  now: now = Date.now(),
} = {}) {
  const _0x8776df = Array.isArray(_0x38649f)
      ? _0x38649f
      : Array.isArray(_0x31095c?.images)
        ? _0x31095c.images
        : [],
    _0xb1533b = Array.isArray(_0x5c058c)
      ? _0x5c058c
      : Array.isArray(_0x31095c?.videos)
        ? _0x31095c.videos
        : [],
    _0x120307 = String(_0x31095c?.type || '')
      .trim()
      .toLowerCase(),
    _0x2169d8 = Array.isArray(_0x44b419)
      ? _0x44b419
      : _0x120307.includes('audio') && firstNonEmptyString(_0x31095c?.audioUrl, _0x31095c?.localPath)
        ? [_0x31095c]
        : [];
  return [
    ..._0x8776df.map((_0x58bffe, _0x44ed96) =>
      buildGenerationHistoryAsset({
        image: _0x58bffe,
        nodeData: _0x31095c,
        projectId: _0x46d2a6,
        canvasId: _0x2a8c3f,
        index: _0x44ed96,
        now: now + _0x44ed96,
      }),
    ),
    ..._0xb1533b.map((_0x271574, _0x43a5f5) =>
      buildVideoGenerationHistoryAsset({
        video: _0x271574,
        nodeData: _0x31095c,
        projectId: _0x46d2a6,
        canvasId: _0x2a8c3f,
        index: _0x43a5f5,
        now: now + _0x8776df.length + _0x43a5f5,
      }),
    ),
    ..._0x2169d8.map((_0x3f8e44, _0x3bd03a) =>
      buildAudioGenerationHistoryAsset({
        audio: _0x3f8e44,
        nodeData: _0x31095c,
        projectId: _0x46d2a6,
        canvasId: _0x2a8c3f,
        index: _0x3bd03a,
        now: now + _0x8776df.length + _0xb1533b.length + _0x3bd03a,
      }),
    ),
  ].filter(Boolean);
}
