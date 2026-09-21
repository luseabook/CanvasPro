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
function normalizeText(_0x355f75) {
  return String(_0x355f75 || '').trim();
}
function previewUploadResultText(_0x236979, _0x5551bb = {}) {
  return t('previewUploadResult.' + _0x236979, _0x5551bb);
}
function resolveRequiredLocalUrl(_0x10bd5d = {}, _0xe440e0 = previewUploadResultText('kind.media')) {
  const _0x4ef2a3 = normalizeCanvasLocalPath(
      _0x10bd5d?.localPath || _0x10bd5d?.originalLocalPath || _0x10bd5d?.url || '',
    ),
    _0x3c4e33 = toCanvasLocalUrl(_0x4ef2a3);
  if (!_0x3c4e33) throw new Error(previewUploadResultText('missingLocalPath', { kind: _0xe440e0 }));
  return { localPath: _0x4ef2a3, localUrl: _0x3c4e33 };
}
function resolveFileName(_0x2f2e35 = {}, _0x4b6b82 = '') {
  return normalizeText(_0x2f2e35?.filename) || normalizeText(_0x2f2e35?.fileName) || normalizeText(_0x4b6b82);
}
function buildCommonSuccessPatch(_0x176ffc = Date.now()) {
  return { generationStartTime: _0x176ffc, generationDuration: 0, rhStatusMessage: null, rhStatusCode: null };
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
  nodeId: _0x55a406,
  uploadRes: _0x184e9d,
  fileName: fileName = '',
} = {}) {
  const _0x24ee50 = normalizeText(_0x55a406);
  if (!_0x24ee50) throw new Error(previewUploadResultText('missingNodeId'));
  resolveRequiredLocalUrl(_0x184e9d, previewUploadResultText('kind.image'));
  const _0x4ccc35 = Date.now(),
    _0x1d987a = resolveFileName(_0x184e9d, fileName),
    _0x4026a0 = {
      ...buildCanvasLocalImageFields({ ..._0x184e9d, fileName: _0x1d987a }, { includeSrc: false }),
    };
  (assertCanvasMediaPatchLocalOnly(_0x4026a0), stopPreviewNodeLoading(_0x24ee50));
  const _0x58df62 = {
    ...buildImageGenerationResultPatch({ outputType: 'image', items: [_0x4026a0] }, { duration: 0 }),
    fileName: _0x1d987a,
    ...buildCommonSuccessPatch(_0x4ccc35),
    ...buildImageTaskResetPatch(),
  };
  (assertCanvasMediaPatchLocalOnly(_0x58df62), appStore.updateNodeData(_0x24ee50, _0x58df62));
}
export function applyUploadedPreviewVideoResult({
  nodeId: _0x4fb449,
  uploadRes: _0x36f6c9,
  fileName: fileName = '',
} = {}) {
  const _0xcf0b13 = normalizeText(_0x4fb449);
  if (!_0xcf0b13) throw new Error(previewUploadResultText('missingNodeId'));
  resolveRequiredLocalUrl(_0x36f6c9, previewUploadResultText('kind.video'));
  const _0x5498e4 = Date.now(),
    _0x520735 = resolveFileName(_0x36f6c9, fileName),
    _0xc5bf92 = buildCanvasLocalVideoFields(
      { ..._0x36f6c9, fileName: _0x520735 },
      { includeCanonicalUrl: false, includeResultUrl: false },
    );
  (assertCanvasMediaPatchLocalOnly(_0xc5bf92), stopPreviewNodeLoading(_0xcf0b13));
  const _0x4e70ed = {
    ...buildVideoGenerationResultPatch({ outputType: 'video', items: [_0xc5bf92] }, { duration: 0 }),
    thumbId: _0xc5bf92.thumbId,
    fileName: _0x520735,
    videoMetaSrc: '',
    videoFps: null,
    videoFrameCount: null,
    videoDuration: null,
    videoWidth: null,
    videoHeight: null,
    ...buildCommonSuccessPatch(_0x5498e4),
    ...buildVideoTaskResetPatch(),
  };
  (assertCanvasMediaPatchLocalOnly(_0x4e70ed), appStore.updateNodeData(_0xcf0b13, _0x4e70ed));
}
export function applyUploadedPreviewAudioResult({
  nodeId: _0x58663f,
  uploadRes: _0x58d656,
  fileName: fileName = '',
} = {}) {
  const _0x4df01a = normalizeText(_0x58663f);
  if (!_0x4df01a) throw new Error(previewUploadResultText('missingNodeId'));
  resolveRequiredLocalUrl(_0x58d656, previewUploadResultText('kind.audio'));
  const _0x2d263c = Date.now(),
    _0x441b37 = resolveFileName(_0x58d656, fileName),
    _0x56f41e = {
      ...buildLocalAudioGenerationResultPatch(
        buildCanvasLocalAudioFields(
          { ..._0x58d656, fileName: _0x441b37 },
          { includeCanonicalUrl: false, includeResultUrl: false },
        ),
        { duration: 0 },
      ),
      fileName: _0x441b37,
      ...buildCommonSuccessPatch(_0x2d263c),
      ...buildAudioTaskResetPatch(),
    };
  (assertCanvasMediaPatchLocalOnly(_0x56f41e),
    stopPreviewNodeLoading(_0x4df01a),
    appStore.updateNodeData(_0x4df01a, _0x56f41e));
}
