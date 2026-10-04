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
function firstNonEmptyString(...args) {
  for (const value of args) {
    const item = String(value || '').trim();
    if (item) return item;
  }
  return '';
}
function normalizeProjectId(key) {
  return String(key || '').trim() || 'default_v2_project';
}
function normalizeCanvasId(result) {
  return String(result || '').trim() || 'canvas_1';
}
function normalizeLocalPath(data) {
  return normalizeLocalPath_2(data);
}
function toLocalUrl(options) {
  return localPathToUrl(options);
}
function hashString(target) {
  const list = String(target || '');
  let source = 0x811c9dc5;
  for (let next = 0; next < list.length; next += 1) {
    ((source ^= list.charCodeAt(next)), (source = Math.imul(source, 0x1000193)));
  }
  return (source >>> 0).toString(36);
}
function sanitizeIdPart(current) {
  return String(current || '')
    .trim()
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
}
function formatHistoryDate(entry, record) {
  return new Date(entry).toLocaleString(getLocale(), record);
}
function pickImageLocalPath(response = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(response.localPath),
    normalizeLocalPath(response.originalLocalPath),
    normalizeLocalPath(response.displayLocalPath),
    normalizeLocalPath(response.imageUrl),
    normalizeLocalPath(response.sourceUrl),
    normalizeLocalPath(response.url),
    normalizeLocalPath(response.resultUrl),
  );
}
function pickVideoLocalPath(response2 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(response2.localPath),
    normalizeLocalPath(response2.originalLocalPath),
    normalizeLocalPath(response2.displayLocalPath),
    normalizeLocalPath(response2.videoUrl),
    normalizeLocalPath(response2.sourceUrl),
    normalizeLocalPath(response2.url),
    normalizeLocalPath(response2.resultUrl),
  );
}
function pickAudioLocalPath(response3 = {}) {
  return firstNonEmptyString(
    normalizeLocalPath(response3.localPath),
    normalizeLocalPath(response3.originalLocalPath),
    normalizeLocalPath(response3.displayLocalPath),
    normalizeLocalPath(response3.audioUrl),
    normalizeLocalPath(response3.sourceUrl),
    normalizeLocalPath(response3.url),
    normalizeLocalPath(response3.resultUrl),
  );
}
function pickImageDisplayUrl(options2 = {}) {
  return firstNonEmptyString(
    toLocalUrl(options2.displayLocalPath),
    toLocalUrl(options2.localPath),
    toLocalUrl(options2.originalLocalPath),
    toLocalUrl(options2.imageUrl),
    toLocalUrl(options2.sourceUrl),
    String(options2.imageUrl || '').trim(),
    String(options2.sourceUrl || '').trim(),
  );
}
function pickImageThumbUrl(options3 = {}) {
  return firstNonEmptyString(
    toLocalUrl(options3.thumbLocalPath),
    toLocalUrl(options3.displayLocalPath),
    toLocalUrl(options3.localPath),
    toLocalUrl(options3.thumbUrl),
    String(options3.thumbUrl || '').trim(),
  );
}
function pickVideoDisplayUrl(response4 = {}) {
  return firstNonEmptyString(
    toLocalUrl(response4.displayLocalPath),
    toLocalUrl(response4.localPath),
    toLocalUrl(response4.originalLocalPath),
    toLocalUrl(response4.videoUrl),
    toLocalUrl(response4.sourceUrl),
    String(response4.videoUrl || '').trim(),
    String(response4.sourceUrl || '').trim(),
    String(response4.url || '').trim(),
  );
}
function pickVideoThumbUrl(options4 = {}) {
  return firstNonEmptyString(
    toLocalUrl(options4.thumbLocalPath),
    toLocalUrl(options4.thumbUrl),
    String(options4.thumbUrl || '').trim(),
    toLocalUrl(options4.posterLocalPath),
    String(options4.posterUrl || '').trim(),
    toLocalUrl(options4.coverLocalPath),
    String(options4.coverUrl || '').trim(),
    toLocalUrl(options4.displayLocalPath),
    toLocalUrl(options4.localPath),
  );
}
function pickAudioDisplayUrl(response5 = {}) {
  return firstNonEmptyString(
    toLocalUrl(response5.displayLocalPath),
    toLocalUrl(response5.localPath),
    toLocalUrl(response5.originalLocalPath),
    toLocalUrl(response5.audioUrl),
    toLocalUrl(response5.sourceUrl),
    String(response5.audioUrl || '').trim(),
    String(response5.sourceUrl || '').trim(),
    String(response5.url || '').trim(),
  );
}
function hasUsableImageResult(enabled = {}) {
  if (!enabled || typeof enabled !== 'object') return false;
  if (String(enabled.error || '').trim()) return false;
  return Boolean(
    firstNonEmptyString(
      enabled.localPath,
      enabled.originalLocalPath,
      enabled.displayLocalPath,
      enabled.thumbLocalPath,
      enabled.imageUrl,
      enabled.sourceUrl,
      enabled.thumbUrl,
      enabled.sourceId,
      enabled.thumbId,
    ),
  );
}
function hasUsableVideoResult(enabled2 = {}) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  if (String(enabled2.error || '').trim()) return false;
  return Boolean(
    firstNonEmptyString(
      enabled2.localPath,
      enabled2.originalLocalPath,
      enabled2.displayLocalPath,
      enabled2.thumbLocalPath,
      enabled2.videoUrl,
      enabled2.sourceUrl,
      enabled2.thumbUrl,
      enabled2.sourceId,
      enabled2.thumbId,
    ),
  );
}
function hasUsableAudioResult(enabled3 = {}) {
  if (!enabled3 || typeof enabled3 !== 'object') return false;
  if (String(enabled3.error || '').trim()) return false;
  return Boolean(
    firstNonEmptyString(
      enabled3.localPath,
      enabled3.originalLocalPath,
      enabled3.displayLocalPath,
      enabled3.audioUrl,
      enabled3.sourceUrl,
      enabled3.sourceId,
    ),
  );
}
function resolveNodeSize(options5 = {}, box = {}) {
  const count = Number(options5.originalWidth || options5.imageWidth || box.imageWidth || 0) || 0,
    count2 = Number(options5.originalHeight || options5.imageHeight || box.imageHeight || 0) || 0;
  if (count > 0 && count2 > 0) {
    const payload = 0x104,
      handle = payload / Math.min(count, count2);
    return {
      width: Math.max(120, Math.round(count * handle)),
      height: Math.max(120, Math.round(count2 * handle)),
    };
  }
  return { width: Number(box.width || 0) || 0x104, height: Number(box.height || 0) || 0x104 };
}
function resolveVideoNodeSize(box2 = {}, box3 = {}) {
  const count3 = Number(box2.videoWidth || box2.width || box3.videoWidth || 0) || 0,
    count4 = Number(box2.videoHeight || box2.height || box3.videoHeight || 0) || 0;
  if (count3 > 0 && count4 > 0) {
    const state = 0x104,
      config = state / Math.min(count3, count4);
    return {
      width: Math.max(160, Math.round(count3 * config)),
      height: Math.max(120, Math.round(count4 * config)),
    };
  }
  return { width: Number(box3.width || 0) || 0x200, height: Number(box3.height || 0) || 0x120 };
}
function resolveAudioNodeSize(box4 = {}) {
  return { width: Number(box4.width || 0) || 0x140, height: Number(box4.height || 0) || 140 };
}
export function buildGenerationHistoryFingerprint(options6 = {}) {
  const localPath = pickImageLocalPath(options6),
    stableSignature = createStableSignature(
      localPath
        ? { kind: GENERATION_HISTORY_MEDIA_KINDS.IMAGE, localPath: localPath }
        : {
            kind: GENERATION_HISTORY_MEDIA_KINDS.IMAGE,
            imageUrl: String(options6.imageUrl || '').trim(),
            sourceUrl: String(options6.sourceUrl || '').trim(),
            thumbUrl: String(options6.thumbUrl || '').trim(),
            sourceId: String(options6.sourceId || '').trim(),
            thumbId: String(options6.thumbId || '').trim(),
          },
    );
  return hashString(stableSignature);
}
export function buildGenerationHistoryMediaFingerprint(options7 = {}, scope = 'image') {
  const kind = String(scope || 'image').trim() || 'image',
    localPath2 =
      kind === GENERATION_HISTORY_MEDIA_KINDS.VIDEO
        ? pickVideoLocalPath(options7)
        : kind === GENERATION_HISTORY_MEDIA_KINDS.AUDIO
          ? pickAudioLocalPath(options7)
          : pickImageLocalPath(options7),
    stableSignature2 = createStableSignature(
      localPath2
        ? { kind: kind, localPath: localPath2 }
        : {
            kind: kind,
            imageUrl: String(options7.imageUrl || '').trim(),
            videoUrl: String(options7.videoUrl || '').trim(),
            audioUrl: String(options7.audioUrl || '').trim(),
            sourceUrl: String(options7.sourceUrl || '').trim(),
            thumbUrl: String(options7.thumbUrl || '').trim(),
            sourceId: String(options7.sourceId || '').trim(),
            thumbId: String(options7.thumbId || '').trim(),
          },
    );
  return hashString(stableSignature2);
}
export function isGenerationHistoryAsset(input) {
  return String(input?.kind || '') === GENERATION_HISTORY_KIND;
}
export function isAssetVisibleInTab(output, value2, value3) {
  const value4 = String(value2 || '').trim();
  if (value4 === GENERATION_HISTORY_CATEGORY)
    return (
      isGenerationHistoryAsset(output) && normalizeProjectId(output?.projectId) === normalizeProjectId(value3)
    );
  if (isGenerationHistoryAsset(output)) return false;
  return String(output?.category || '') === value4;
}
export function buildGenerationHistoryAsset({
  image: image,
  nodeData: nodeData,
  projectId: projectId,
  canvasId: canvasId,
  index: index = 0,
  now: now = Date.now(),
} = {}) {
  if (!hasUsableImageResult(image)) return null;
  const projectId2 = normalizeProjectId(projectId),
    canvasId2 = normalizeCanvasId(canvasId),
    resultFingerprint = buildGenerationHistoryFingerprint(image),
    hashString2 = hashString(projectId2),
    hashString3 = hashString(canvasId2),
    sourceIndex = Math.max(0, Math.trunc(Number(index) || 0)),
    id = 'gen-history-' + hashString2 + '-' + hashString3 + '-' + resultFingerprint,
    args2 = buildImageNodeStorageFields(image),
    localPath3 = args2.localPath || pickImageLocalPath(image),
    src = pickImageDisplayUrl({ ...image, ...args2 }),
    thumbUrl = pickImageThumbUrl({ ...image, ...args2 }),
    { width: width, height: height } = resolveNodeSize(image, nodeData),
    sourceNodeId = String(nodeData?.id || '').trim(),
    name =
      String(image?.fileName || '').trim() ||
      String(localPath3 || '')
        .split(/[\\/]/)
        .pop() ||
      t('generationHistory.fileFallback.image', { date: formatHistoryDate(now) }),
    nodeData2 = {
      id: 'source-image-history-' + resultFingerprint,
      type: 'source-image',
      name: name,
      x: 0,
      y: 0,
      width: width,
      height: height,
      src: src || thumbUrl,
      imageUrl: src || thumbUrl,
      sourceUrl: src || thumbUrl,
      thumbUrl: thumbUrl,
      localPath: localPath3,
      ...args2,
      sourceId: String(image?.sourceId || '').trim(),
      thumbId: String(image?.thumbId || '').trim(),
      fileName: name,
      needsAutoResize: true,
    },
    metaKey = sanitizeIdPart(projectId2) || 'project',
    sanitizeIdPart2 = sanitizeIdPart(sourceNodeId) || 'node',
    date = formatHistoryDate(now, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return {
    id: id,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS.IMAGE,
    projectId: projectId2,
    canvasId: canvasId2,
    sourceNodeId: sourceNodeId,
    resultFingerprint: resultFingerprint,
    name: t('generationHistory.assetName.image', { date: date }),
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: thumbUrl || src,
    coverType: 'image',
    items: [{ type: 'source-image', name: name, thumbSrc: thumbUrl || src, nodeData: nodeData2 }],
    nodes: [nodeData2],
    edges: [],
    model: String(nodeData?.model || '').trim(),
    provider: String(nodeData?.provider || '').trim(),
    prompt: String(nodeData?.prompt || '').trim(),
    aspectRatio: String(nodeData?.aspectRatio || '').trim(),
    imageSize: String(nodeData?.imageSize || '').trim(),
    sourceIndex: sourceIndex,
    createdAt: Number(now) || Date.now(),
    updatedAt: Number(now) || Date.now(),
    metaKey: metaKey + ':' + sanitizeIdPart2 + ':' + resultFingerprint,
  };
}
export function buildVideoGenerationHistoryAsset({
  video: video,
  nodeData: nodeData3,
  projectId: projectId3,
  canvasId: canvasId3,
  index: index = 0,
  now: now = Date.now(),
} = {}) {
  if (!hasUsableVideoResult(video)) return null;
  const projectId4 = normalizeProjectId(projectId3),
    canvasId4 = normalizeCanvasId(canvasId3),
    resultFingerprint2 = buildGenerationHistoryMediaFingerprint(video, 'video'),
    hashString4 = hashString(projectId4),
    hashString5 = hashString(canvasId4),
    sourceIndex2 = Math.max(0, Math.trunc(Number(index) || 0)),
    id2 = 'gen-history-' + hashString4 + '-' + hashString5 + '-' + resultFingerprint2,
    localPath4 = pickVideoLocalPath(video),
    videoDisplayUrl = pickVideoDisplayUrl(video),
    thumbUrl2 = pickVideoThumbUrl(video),
    { width: width2, height: height2 } = resolveVideoNodeSize(video, nodeData3),
    sourceNodeId2 = String(nodeData3?.id || '').trim(),
    name2 =
      String(video?.fileName || '').trim() ||
      String(localPath4 || videoDisplayUrl || '')
        .split(/[\\/]/)
        .pop() ||
      t('generationHistory.fileFallback.video', { date: formatHistoryDate(now) }),
    src2 = videoDisplayUrl || (localPath4 ? '/' + localPath4 : ''),
    nodeData4 = {
      id: 'source-video-history-' + resultFingerprint2,
      type: 'source-video',
      name: name2,
      x: 0,
      y: 0,
      width: width2,
      height: height2,
      src: src2,
      videoUrl: src2,
      thumbUrl: thumbUrl2,
      videoThumbSrc: thumbUrl2,
      localPath: localPath4,
      sourceId: String(video?.sourceId || '').trim(),
      thumbId: String(video?.thumbId || '').trim(),
      fileName: name2,
      videoWidth: Number(video?.videoWidth || video?.width || 0) || undefined,
      videoHeight: Number(video?.videoHeight || video?.height || 0) || undefined,
      duration: Number(video?.duration || video?.videoDuration || 0) || undefined,
      needsAutoResize: true,
    },
    metaKey2 = sanitizeIdPart(projectId4) || 'project',
    sanitizeIdPart3 = sanitizeIdPart(sourceNodeId2) || 'node',
    date2 = formatHistoryDate(now, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return {
    id: id2,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS.VIDEO,
    projectId: projectId4,
    canvasId: canvasId4,
    sourceNodeId: sourceNodeId2,
    resultFingerprint: resultFingerprint2,
    name: t('generationHistory.assetName.video', { date: date2 }),
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: thumbUrl2 || src2,
    coverType: 'video',
    items: [{ type: 'source-video', name: name2, thumbSrc: thumbUrl2 || src2, nodeData: nodeData4 }],
    nodes: [nodeData4],
    edges: [],
    model: String(nodeData3?.model || '').trim(),
    provider: String(nodeData3?.provider || '').trim(),
    prompt: String(nodeData3?.prompt || '').trim(),
    aspectRatio: String(nodeData3?.aspectRatio || '').trim(),
    videoSize: String(nodeData3?.videoSize || nodeData3?.resolution || '').trim(),
    duration: Number(video?.duration || nodeData3?.duration || 0) || undefined,
    sourceIndex: sourceIndex2,
    createdAt: Number(now) || Date.now(),
    updatedAt: Number(now) || Date.now(),
    metaKey: metaKey2 + ':' + sanitizeIdPart3 + ':' + resultFingerprint2,
  };
}
export function buildAudioGenerationHistoryAsset({
  audio: audio,
  nodeData: nodeData5,
  projectId: projectId5,
  canvasId: canvasId5,
  index: index = 0,
  now: now = Date.now(),
} = {}) {
  if (!hasUsableAudioResult(audio)) return null;
  const projectId6 = normalizeProjectId(projectId5),
    canvasId6 = normalizeCanvasId(canvasId5),
    resultFingerprint3 = buildGenerationHistoryMediaFingerprint(audio, 'audio'),
    hashString6 = hashString(projectId6),
    hashString7 = hashString(canvasId6),
    sourceIndex3 = Math.max(0, Math.trunc(Number(index) || 0)),
    id3 = 'gen-history-' + hashString6 + '-' + hashString7 + '-' + resultFingerprint3,
    localPath5 = pickAudioLocalPath(audio),
    src3 = pickAudioDisplayUrl(audio),
    { width: width3, height: height3 } = resolveAudioNodeSize(nodeData5),
    sourceNodeId3 = String(nodeData5?.id || '').trim(),
    name3 =
      String(audio?.fileName || '').trim() ||
      String(localPath5 || src3 || '')
        .split(/[\\/]/)
        .pop() ||
      t('generationHistory.fileFallback.audio', { date: formatHistoryDate(now) }),
    nodeData6 = {
      id: 'source-audio-history-' + resultFingerprint3,
      type: 'source-audio',
      name: name3,
      x: 0,
      y: 0,
      width: width3,
      height: height3,
      src: src3,
      audioUrl: src3,
      localPath: localPath5,
      fileName: name3,
      duration: Number(audio?.duration || audio?.audioDuration || 0) || undefined,
    },
    metaKey3 = sanitizeIdPart(projectId6) || 'project',
    sanitizeIdPart4 = sanitizeIdPart(sourceNodeId3) || 'node',
    date3 = formatHistoryDate(now, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  return {
    id: id3,
    kind: GENERATION_HISTORY_KIND,
    mediaKind: GENERATION_HISTORY_MEDIA_KINDS.AUDIO,
    projectId: projectId6,
    canvasId: canvasId6,
    sourceNodeId: sourceNodeId3,
    resultFingerprint: resultFingerprint3,
    name: t('generationHistory.assetName.audio', { date: date3 }),
    category: GENERATION_HISTORY_CATEGORY,
    coverUrl: '',
    coverType: 'audio',
    items: [{ type: 'source-audio', name: name3, thumbSrc: '', nodeData: nodeData6 }],
    nodes: [nodeData6],
    edges: [],
    model: String(nodeData5?.model || nodeData5?.audioWorkflowKey || '').trim(),
    provider: String(nodeData5?.provider || '').trim(),
    prompt: String(nodeData5?.prompt || '').trim(),
    audioWorkflowKey: String(nodeData5?.audioWorkflowKey || '').trim(),
    audioWorkflowLabel: String(nodeData5?.audioWorkflowLabel || '').trim(),
    duration: Number(audio?.duration || nodeData5?.duration || 0) || undefined,
    sourceIndex: sourceIndex3,
    createdAt: Number(now) || Date.now(),
    updatedAt: Number(now) || Date.now(),
    metaKey: metaKey3 + ':' + sanitizeIdPart4 + ':' + resultFingerprint3,
  };
}
export function buildGenerationHistoryAssetsFromNode({
  images: images,
  videos: videos,
  audios: audios,
  nodeData: nodeData7,
  projectId: projectId7,
  canvasId: canvasId7,
  now: now = Date.now(),
} = {}) {
  const list2 = Array.isArray(images) ? images : Array.isArray(nodeData7?.images) ? nodeData7.images : [],
    list3 = Array.isArray(videos) ? videos : Array.isArray(nodeData7?.videos) ? nodeData7.videos : [],
    list4 = String(nodeData7?.type || '')
      .trim()
      .toLowerCase(),
    list5 = Array.isArray(audios)
      ? audios
      : list4.includes('audio') && firstNonEmptyString(nodeData7?.audioUrl, nodeData7?.localPath)
        ? [nodeData7]
        : [];
  return [
    ...list2.map((image2, index2) =>
      buildGenerationHistoryAsset({
        image: image2,
        nodeData: nodeData7,
        projectId: projectId7,
        canvasId: canvasId7,
        index: index2,
        now: now + index2,
      }),
    ),
    ...list3.map((video2, index3) =>
      buildVideoGenerationHistoryAsset({
        video: video2,
        nodeData: nodeData7,
        projectId: projectId7,
        canvasId: canvasId7,
        index: index3,
        now: now + list2.length + index3,
      }),
    ),
    ...list5.map((audio2, index4) =>
      buildAudioGenerationHistoryAsset({
        audio: audio2,
        nodeData: nodeData7,
        projectId: projectId7,
        canvasId: canvasId7,
        index: index4,
        now: now + list2.length + list3.length + index4,
      }),
    ),
  ].filter(Boolean);
}
