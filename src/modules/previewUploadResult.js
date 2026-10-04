import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import {
  buildCanvasLocalAudioFields,
  buildCanvasLocalImageFields,
  buildCanvasLocalVideoFields,
  assertCanvasMediaPatchLocalOnly,
  normalizeCanvasLocalPath,
  toCanvasLocalUrl,
} from '../services/canvasMediaLocalService.js';
import { stopPreviewNodeLoading } from './previewMode.js';
import { buildImageGenerationResultPatch } from '../components/aigenImage/imageGenerationResultRenderer.js';
import { buildLocalAudioGenerationResultPatch } from '../components/audio-node/audioGenerationResultRenderer.js';
import { buildVideoGenerationResultPatch } from '../components/video-node/videoGenerationResultRenderer.js';
function normalizeText(value) {
  return String(value || '').trim();
}
function previewUploadResultText(item, key = {}) {
  return t('previewUploadResult.' + item, key);
}
function resolveRequiredLocalUrl(response = {}, kind = previewUploadResultText('kind.media')) {
  const localPath = normalizeCanvasLocalPath(
      response?.localPath || response?.originalLocalPath || response?.url || '',
    ),
    localUrl = toCanvasLocalUrl(localPath);
  if (!localUrl) throw new Error(previewUploadResultText('missingLocalPath', { kind: kind }));
  return { localPath: localPath, localUrl: localUrl };
}
function resolveFileName(options = {}, index = '') {
  return normalizeText(options?.filename) || normalizeText(options?.fileName) || normalizeText(index);
}
function buildCommonSuccessPatch(generationStartTime = Date.now()) {
  return {
    generationStartTime: generationStartTime,
    generationDuration: 0,
    rhStatusMessage: null,
    rhStatusCode: null,
  };
}
function buildImageTaskResetPatch() {
  return {
    rhTaskId: '',
    rhTaskStatus: 'idle',
    rhTaskStartedAt: 0,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
    dreaminaSubmitId: '',
    dreaminaTaskStatus: 'idle',
    dreaminaTaskPhase: 'done',
    dreaminaTaskLabel: '',
    dreaminaTaskStartedAt: 0,
    dreaminaTaskLastCheckedAt: null,
    dreaminaTaskLastRaw: {},
    dreaminaTaskRecovering: false,
    asyncTaskProvider: '',
    asyncTaskKind: 'image',
    asyncTaskId: '',
    asyncTaskStatus: 'idle',
    asyncTaskStartedAt: 0,
    asyncTaskRecovering: false,
  };
}
function buildVideoTaskResetPatch() {
  return {
    rhTaskId: '',
    rhTaskStatus: 'idle',
    rhTaskStartedAt: 0,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
    asyncTaskProvider: '',
    asyncTaskKind: 'video',
    asyncTaskId: '',
    asyncTaskStatus: 'idle',
    asyncTaskStartedAt: 0,
    asyncTaskRecovering: false,
    dreaminaSubmitId: '',
    dreaminaTaskStatus: 'idle',
    dreaminaTaskPhase: 'done',
    dreaminaTaskLabel: '',
    dreaminaTaskStartedAt: 0,
    dreaminaTaskLastCheckedAt: null,
    dreaminaTaskLastRaw: {},
    dreaminaTaskRecovering: false,
  };
}
function buildAudioTaskResetPatch() {
  return {
    rhTaskId: '',
    rhTaskStatus: 'idle',
    rhTaskStartedAt: 0,
    rhTaskRecovering: false,
    rhTaskUseOpenapiQuery: false,
  };
}
export function applyUploadedPreviewImageResult({
  nodeId: nodeId,
  uploadRes: uploadRes,
  fileName: fileName = '',
} = {}) {
  const text = normalizeText(nodeId);
  if (!text) throw new Error(previewUploadResultText('missingNodeId'));
  resolveRequiredLocalUrl(uploadRes, previewUploadResultText('kind.image'));
  const result = Date.now(),
    fileName2 = resolveFileName(uploadRes, fileName),
    data = {
      ...buildCanvasLocalImageFields({ ...uploadRes, fileName: fileName2 }, { includeSrc: false }),
    };
  (assertCanvasMediaPatchLocalOnly(data), stopPreviewNodeLoading(text));
  const target = {
    ...buildImageGenerationResultPatch({ outputType: 'image', items: [data] }, { duration: 0 }),
    fileName: fileName2,
    ...buildCommonSuccessPatch(result),
    ...buildImageTaskResetPatch(),
  };
  (assertCanvasMediaPatchLocalOnly(target), appStore.updateNodeData(text, target));
}
export function applyUploadedPreviewVideoResult({
  nodeId: nodeId2,
  uploadRes: uploadRes2,
  fileName: fileName = '',
} = {}) {
  const text2 = normalizeText(nodeId2);
  if (!text2) throw new Error(previewUploadResultText('missingNodeId'));
  resolveRequiredLocalUrl(uploadRes2, previewUploadResultText('kind.video'));
  const source = Date.now(),
    fileName3 = resolveFileName(uploadRes2, fileName),
    thumbId = buildCanvasLocalVideoFields(
      { ...uploadRes2, fileName: fileName3 },
      { includeCanonicalUrl: false, includeResultUrl: false },
    );
  (assertCanvasMediaPatchLocalOnly(thumbId), stopPreviewNodeLoading(text2));
  const next = {
    ...buildVideoGenerationResultPatch({ outputType: 'video', items: [thumbId] }, { duration: 0 }),
    thumbId: thumbId.thumbId,
    fileName: fileName3,
    videoMetaSrc: '',
    videoFps: null,
    videoFrameCount: null,
    videoDuration: null,
    videoWidth: null,
    videoHeight: null,
    ...buildCommonSuccessPatch(source),
    ...buildVideoTaskResetPatch(),
  };
  (assertCanvasMediaPatchLocalOnly(next), appStore.updateNodeData(text2, next));
}
export function applyUploadedPreviewAudioResult({
  nodeId: nodeId3,
  uploadRes: uploadRes3,
  fileName: fileName = '',
} = {}) {
  const text3 = normalizeText(nodeId3);
  if (!text3) throw new Error(previewUploadResultText('missingNodeId'));
  resolveRequiredLocalUrl(uploadRes3, previewUploadResultText('kind.audio'));
  const current = Date.now(),
    fileName4 = resolveFileName(uploadRes3, fileName),
    entry = {
      ...buildLocalAudioGenerationResultPatch(
        buildCanvasLocalAudioFields(
          { ...uploadRes3, fileName: fileName4 },
          { includeCanonicalUrl: false, includeResultUrl: false },
        ),
        { duration: 0 },
      ),
      fileName: fileName4,
      ...buildCommonSuccessPatch(current),
      ...buildAudioTaskResetPatch(),
    };
  (assertCanvasMediaPatchLocalOnly(entry),
    stopPreviewNodeLoading(text3),
    appStore.updateNodeData(text3, entry));
}
