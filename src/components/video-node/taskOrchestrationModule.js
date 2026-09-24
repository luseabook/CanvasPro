import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDefaultModel,
  getDreaminaStyleVideoModelVersion,
  isDreaminaStyleVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaStyleVideoDuration,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from '../../modules/dreaminaVideoModelHelper.js';
import { isAdaptiveRatioLabel, pickClosestRatioForProviderModel } from '../../../api/imageRatioPolicy.js';
import { getGenerationRatioSizeWithDom } from '../../modules/generationRatioSource.js';
import {
  getPromptAssetInputRefsFromNode,
  insertPresetPromptIntoEditor,
  isRunningHubWorkflowNode,
  previewPresetPromptInEditor,
  resolvePresetPromptTextWithTextRefs,
  shouldUsePromptPreviewForPreset,
} from '../../modules/nodePromptShared.js';
import {
  isPreviewModeEnabled,
  isPreviewNodeLoading,
  startPreviewNodeLoading,
} from '../../modules/previewMode.js';
import {
  createPreviewGenerateButtonCallbacks,
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from '../../modules/previewGenerateButtonUi.js';
import { createStoryReferenceVideoGuard } from '../../modules/storyWorkspace/storyReferenceVideo.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
import { logDiagnosticEvent } from '../../services/diagnosticsService.js';
import { buildGenerationStartPatch } from '../../core/generationTaskLifecycle.js';
import { cancelTask, resumeTask, submitTask } from '../../core/generationTaskRuntime.js';
import { shouldAllowCancel, shouldShowGenerationBusyUi } from '../../core/generationTaskUiState.js';
import { GENERATION_HISTORY_EVENT } from '../../modules/generationHistoryAssets.js';
import { GENERATION_TASK_CENTER_EVENT } from '../../modules/generationTaskCenterEvents.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolveVideoWorkflowSchemaParam } from './runningHubVideoUiSchema.js';
import {
  buildVideoGenerationFailurePatch,
  buildVideoGenerationResultPatch,
  normalizeVideoGenerationResult,
} from './videoGenerationResultRenderer.js';
import {
  buildRunningHubVideoWorkflowSubmitPatch,
  getDefaultRunningHubVideoWorkflowModelId,
  shouldScopeRunningHubVideoSubmitEdges,
} from './runningHubVideoSubmitPayload.js';
import { isModelApiModel, resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import {
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { appendApimartPrivateAvatarProviderAssetRefs } from '../../modules/apimartPrivateAvatarAssets.js';
import { t } from '../../i18n/index.js';
const DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS = 0x2328;
function videoTaskText(_0x32f421, _0x1e9ba2 = {}) {
  return t('videoTask.' + _0x32f421, _0x1e9ba2);
}
function getVideoGenerateTitle() {
  return videoTaskText('controls.generateTitle');
}
function getVideoCancelTooltip() {
  return videoTaskText('controls.cancelTooltip');
}
const APIMART_KLING_V3_OMNI_MODEL_ID = 'apimart/kling-v3-omni',
  APIMART_KLING_O1_MODEL_ID = 'apimart/kling-video-o1',
  HAPPYHORSE_BODY_RESOLVERS = new Set(['apimartHappyHorseVideo', 'runninghubHappyHorseVideo']),
  WAN27_BODY_RESOLVERS = new Set(['apimartWan27Video', 'runninghubWan27Video']),
  HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS = 15,
  WAN27_AUDIO_INPUT_MIN_SECONDS = 2,
  WAN27_AUDIO_INPUT_MAX_SECONDS = 30,
  WAN27_AUDIO_INPUT_MAX_BYTES = 15 * 0x400 * 0x400,
  WAN27_VIDEO_EXTEND_MAX_SECONDS = 10,
  WAN27_REFERENCE_VIDEO_MAX_SECONDS = 30,
  WAN27_EDIT_VIDEO_MIN_SECONDS = 2,
  WAN27_EDIT_VIDEO_MAX_SECONDS = 10,
  KLING_V3_OMNI_VIDEO_MIN_SECONDS = 3,
  KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS = 10,
  KLING_O1_VIDEO_MIN_SECONDS = 3,
  KLING_O1_VIDEO_MAX_SECONDS = 10,
  DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 0x3e8,
  DREAMINA_NON_RECOVERABLE_STATUSES = new Set([
    'cancelled',
    'canceled',
    'complete',
    'completed',
    'done',
    'error',
    'fail',
    'failed',
    'finish',
    'finished',
    'idle',
    'success',
    'succeeded',
  ]),
  DREAMINA_NON_RECOVERABLE_PHASES = new Set([
    'cancelled',
    'canceled',
    'complete',
    'completed',
    'done',
    'error',
    'fail',
    'failed',
    'finish',
    'finished',
    'success',
    'succeeded',
  ]),
  dreaminaBackgroundQueueToastKeys = new Set();
function normalizeTaskStatus(_0x2b8854) {
  return String(_0x2b8854 || '')
    .trim()
    .toLowerCase();
}
function mapDreaminaSnapshotToTaskCenterStatus(_0x46f13e = {}) {
  const _0x40fa5d = String(_0x46f13e?.phase || '')
      .trim()
      .toLowerCase(),
    _0xc753b7 = String(_0x46f13e?.status || '')
      .trim()
      .toLowerCase();
  if (_0x40fa5d === 'done' || _0xc753b7 === 'success') return 'complete';
  if (_0x40fa5d === 'cancelled' || _0xc753b7 === 'cancelled' || _0xc753b7 === 'canceled') return 'cancelled';
  if (_0x40fa5d === 'failed' || _0xc753b7 === 'failed') return 'failed';
  if (_0x40fa5d === 'queued' || _0x40fa5d === 'pending') return 'waiting';
  return 'processing';
}
function buildDreaminaTaskCenterMessage(_0x2be673 = {}) {
  const _0x58ef0e = String(_0x2be673?.label || '').trim(),
    _0x386433 = Number(_0x2be673?.queueIndex),
    _0x2cdaed = Number(_0x2be673?.queueLength);
  if (Number.isFinite(_0x386433) && _0x386433 >= 0 && Number.isFinite(_0x2cdaed) && _0x2cdaed > 0)
    return (
      (_0x58ef0e || videoTaskText('task.queueing')) +
      ' ' +
      (Math.trunc(_0x386433) + 1) +
      '/' +
      Math.trunc(_0x2cdaed)
    );
  return _0x58ef0e || '';
}
function isDreaminaUploadDurationErrorMessage(_0x3c9f58) {
  const _0x4e5e38 = String(_0x3c9f58 || '').trim();
  return _0x4e5e38.startsWith('上传源视频失败：') || _0x4e5e38.startsWith('上传源音频失败：');
}
function pickVideoAdaptiveSourceSize({ inEdges: inEdges = [], nodes: nodes = {} } = {}) {
  const _0x4ed0fe = [],
    _0x7b3ae = [];
  for (const _0x33ae18 of inEdges) {
    const _0x2fc448 = nodes?.[_0x33ae18?.sourceId];
    if (!_0x2fc448) continue;
    const _0x255e4c = String(_0x2fc448?.type || '').toLowerCase(),
      _0x130e44 = getGenerationRatioSizeWithDom({
        nodeId: _0x33ae18?.sourceId,
        nodeData: _0x2fc448,
        edge: _0x33ae18,
        includeNodeFrame: true,
      });
    if (!(_0x130e44?.width > 0 && _0x130e44?.height > 0)) continue;
    if (_0x255e4c.includes('image')) _0x4ed0fe.push(_0x130e44);
    else {
      if (_0x255e4c.includes('video')) _0x7b3ae.push(_0x130e44);
    }
  }
  return _0x4ed0fe[0] || _0x7b3ae[0] || null;
}
function findVideoAspectRatioField(_0x48a220) {
  return (Array.isArray(_0x48a220?.uiSchema?.fields) ? _0x48a220.uiSchema.fields : []).find((_0x547776) => {
    const _0x403bdd = String(_0x547776?.id || '').trim(),
      _0x9c3790 = String(_0x547776?.displayRole || '').trim();
    return _0x403bdd === 'aspectRatio' || _0x9c3790 === 'aspectRatio';
  });
}
function pickManifestDefaultVideoRatio(_0x16fbe1) {
  const _0x11e40b = findVideoAspectRatioField(_0x16fbe1),
    _0x48ee0f = Array.isArray(_0x11e40b?.options) ? _0x11e40b.options : [];
  for (const _0x2a1ed3 of _0x48ee0f) {
    const _0x22198 = String(_0x2a1ed3?.value ?? _0x2a1ed3 ?? '').trim();
    if (_0x22198 && _0x22198.includes(':') && !isAdaptiveRatioLabel(_0x22198)) return _0x22198;
  }
  return '';
}
function resolveVideoAspectRatioInput({
  nodeData: nodeData = {},
  payload: payload = {},
  modelManifest: modelManifest = null,
} = {}) {
  const _0x4416ed =
      nodeData?.generationParams &&
      typeof nodeData.generationParams === 'object' &&
      !Array.isArray(nodeData.generationParams)
        ? nodeData.generationParams
        : {},
    _0x3d7b85 =
      payload?.generationParams &&
      typeof payload.generationParams === 'object' &&
      !Array.isArray(payload.generationParams)
        ? payload.generationParams
        : {};
  if (Object.prototype.hasOwnProperty.call(_0x4416ed, 'aspectRatio')) return _0x4416ed.aspectRatio;
  const _0x20e875 = String(findVideoAspectRatioField(modelManifest)?.id || '').trim();
  if (_0x20e875 && Object.prototype.hasOwnProperty.call(_0x4416ed, _0x20e875)) return _0x4416ed[_0x20e875];
  if (Object.prototype.hasOwnProperty.call(nodeData || {}, 'aspectRatio')) return nodeData.aspectRatio;
  if (Object.prototype.hasOwnProperty.call(_0x3d7b85, 'aspectRatio')) return _0x3d7b85.aspectRatio;
  if (_0x20e875 && Object.prototype.hasOwnProperty.call(_0x3d7b85, _0x20e875)) return _0x3d7b85[_0x20e875];
  if (Object.prototype.hasOwnProperty.call(payload || {}, 'aspectRatio')) return payload.aspectRatio;
  if (_0x20e875 && Object.prototype.hasOwnProperty.call(payload || {}, _0x20e875)) return payload[_0x20e875];
  return findVideoAspectRatioField(modelManifest)?.defaultValue ?? '';
}
function resolveModelApiVideoAdaptiveRatio({
  inEdges: inEdges = [],
  nodes: nodes = {},
  nodeData: nodeData = {},
  provider: provider = '',
  model: model = '',
  modelManifest: modelManifest = null,
} = {}) {
  const _0x384cc3 = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (_0x384cc3?.width > 0 && _0x384cc3?.height > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: _0x384cc3.width,
      height: _0x384cc3.height,
    });
  const _0x2585e6 = Number(nodeData?.width || 0),
    _0x63f495 = Number(nodeData?.height || 0);
  if (Number.isFinite(_0x2585e6) && _0x2585e6 > 0 && Number.isFinite(_0x63f495) && _0x63f495 > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: _0x2585e6,
      height: _0x63f495,
    });
  return pickManifestDefaultVideoRatio(modelManifest);
}
function resolveVideoManifestAdaptiveRatio({
  inEdges: inEdges = [],
  nodes: nodes = {},
  nodeData: nodeData = {},
  provider: provider = '',
  model: model = '',
  modelManifest: modelManifest = null,
} = {}) {
  const _0x4ae424 = Number(nodeData?.width || 0),
    _0x350c95 = Number(nodeData?.height || 0);
  if (Number.isFinite(_0x4ae424) && _0x4ae424 > 0 && Number.isFinite(_0x350c95) && _0x350c95 > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: _0x4ae424,
      height: _0x350c95,
    });
  const _0x54ceef = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (_0x54ceef?.width > 0 && _0x54ceef?.height > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: _0x54ceef.width,
      height: _0x54ceef.height,
    });
  return pickManifestDefaultVideoRatio(modelManifest);
}
function applyModelApiVideoAdaptiveRatio(_0x42b05e, _0x36bebd = {}) {
  const _0x1cf401 = _0x36bebd?.modelManifest || null;
  if (!findVideoAspectRatioField(_0x1cf401)) return _0x42b05e;
  const _0x3f617b = resolveVideoAspectRatioInput({
    nodeData: _0x36bebd?.nodeData,
    payload: _0x42b05e,
    modelManifest: _0x1cf401,
  });
  if (!isAdaptiveRatioLabel(_0x3f617b)) return _0x42b05e;
  const _0x33bfb2 = resolveModelApiVideoAdaptiveRatio(_0x36bebd);
  return (
    _0x33bfb2 && !isAdaptiveRatioLabel(_0x33bfb2) && (_0x42b05e.resolvedRatioLabel = _0x33bfb2),
    _0x42b05e
  );
}
function applyVideoManifestAdaptiveRatio(_0x1f5df8, _0x36d5ec = {}) {
  const _0x3bb6f1 = _0x36d5ec?.modelManifest || null;
  if (!findVideoAspectRatioField(_0x3bb6f1)) return _0x1f5df8;
  const _0x4142c8 = resolveVideoAspectRatioInput({
    nodeData: _0x36d5ec?.nodeData,
    payload: _0x1f5df8,
    modelManifest: _0x3bb6f1,
  });
  if (!isAdaptiveRatioLabel(_0x4142c8)) return _0x1f5df8;
  const _0x49848e = resolveVideoManifestAdaptiveRatio(_0x36d5ec);
  return (
    _0x49848e && !isAdaptiveRatioLabel(_0x49848e) && (_0x1f5df8.resolvedRatioLabel = _0x49848e),
    _0x1f5df8
  );
}
function pickDreaminaAdaptiveSourceRatio({
  inEdges: inEdges = [],
  nodes: nodes = {},
  provider: provider = '',
  model: model = '',
} = {}) {
  const _0x383e02 = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (!_0x383e02) return '';
  return pickClosestRatioForProviderModel({
    provider: provider,
    model: model,
    width: _0x383e02.width,
    height: _0x383e02.height,
  });
}
function isHappyHorseVideoModel(_0x45f501, _0x3f6891) {
  return isModelUsingBodyResolver(_0x45f501, _0x3f6891, HAPPYHORSE_BODY_RESOLVERS);
}
function isModelUsingBodyResolver(_0x2f545e, _0x16da52, _0x475971 = new Set()) {
  const _0x30f0cb =
      resolveModelExecution(_0x2f545e, { providerHint: _0x16da52 }) || resolveModelExecution(_0x2f545e),
    _0x272fe6 = String(_0x30f0cb?.executionManifest?.extensions?.bodyResolver || '').trim();
  return _0x272fe6 && _0x475971.has(_0x272fe6);
}
function getHappyHorseVideoInputMaxSeconds(_0x1152a7, _0x6ae616) {
  const _0x1e3045 =
      resolveModelExecution(_0x1152a7, { providerHint: _0x6ae616 }) || resolveModelExecution(_0x1152a7),
    _0x19a5e0 = String(_0x1e3045?.executionManifest?.extensions?.bodyResolver || '').trim();
  return _0x19a5e0 === 'runninghubHappyHorseVideo' ? 60 : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
}
function isWan27VideoModel(_0x6d1ca5, _0x87f7ef) {
  return isModelUsingBodyResolver(_0x6d1ca5, _0x87f7ef, WAN27_BODY_RESOLVERS);
}
function isKlingV3OmniVideoModel(_0x332714, _0x24d0ab) {
  const _0x383df9 =
      resolveModelExecution(_0x332714, { providerHint: _0x24d0ab }) || resolveModelExecution(_0x332714),
    _0x3ed183 = String(
      _0x383df9?.canonicalModelId || _0x383df9?.modelManifest?.modelId || _0x332714 || '',
    ).trim(),
    _0x373645 = String(_0x383df9?.modelManifest?.provider || _0x24d0ab || '')
      .trim()
      .toLowerCase();
  return _0x3ed183 === APIMART_KLING_V3_OMNI_MODEL_ID && (!_0x373645 || _0x373645 === 'apimart');
}
function isKlingO1VideoModel(_0x3d5d04, _0x47e9ce) {
  const _0x43e46e =
      resolveModelExecution(_0x3d5d04, { providerHint: _0x47e9ce }) || resolveModelExecution(_0x3d5d04),
    _0x49416c = String(
      _0x43e46e?.canonicalModelId || _0x43e46e?.modelManifest?.modelId || _0x3d5d04 || '',
    ).trim(),
    _0x39a527 = String(_0x43e46e?.modelManifest?.provider || _0x47e9ce || '')
      .trim()
      .toLowerCase();
  return _0x49416c === APIMART_KLING_O1_MODEL_ID && (!_0x39a527 || _0x39a527 === 'apimart');
}
function getPlainObject(_0x205a8b) {
  return _0x205a8b && typeof _0x205a8b === 'object' && !Array.isArray(_0x205a8b) ? _0x205a8b : {};
}
function normalizeSubmitRandomSeedMode(_0x59df9b, _0x567499 = 'fixed') {
  const _0x5c5ed5 = String(_0x59df9b ?? _0x567499)
    .trim()
    .toLowerCase();
  return _0x5c5ed5 === 'random' ? 'random' : 'fixed';
}
function getSubmitRandomSeedParam(_0x5347a5, _0x54972c, _0x2f9f6b) {
  const _0x158786 = String(_0x54972c || '').trim();
  if (_0x158786 && Object.prototype.hasOwnProperty.call(_0x5347a5 || {}, _0x158786))
    return _0x5347a5[_0x158786];
  return _0x2f9f6b;
}
function generateSubmitRandomSeed(_0x2f6545 = {}) {
  const _0x155da4 = Number.isFinite(Number(_0x2f6545?.randomSeedMin))
      ? Math.trunc(Number(_0x2f6545.randomSeedMin))
      : Number.isFinite(Number(_0x2f6545?.min))
        ? Math.trunc(Number(_0x2f6545.min))
        : 0,
    _0x3291c2 = Number.isFinite(Number(_0x2f6545?.randomSeedMax))
      ? Math.trunc(Number(_0x2f6545.randomSeedMax))
      : Number.isFinite(Number(_0x2f6545?.max))
        ? Math.trunc(Number(_0x2f6545.max))
        : 0x7fffffff,
    _0xb4f1c1 = Math.min(_0x155da4, _0x3291c2),
    _0x30c1e5 = Math.max(_0x155da4, _0x3291c2);
  return String(_0xb4f1c1 + Math.floor(Math.random() * (_0x30c1e5 - _0xb4f1c1 + 1)));
}
function buildSubmitRandomizedSeedPatch({
  modelManifest: modelManifest = null,
  nodeData: nodeData = {},
  payload: payload = {},
} = {}) {
  const _0x5d11f0 = Array.isArray(modelManifest?.uiSchema?.fields) ? modelManifest.uiSchema.fields : [],
    _0x21a64e = _0x5d11f0.filter((_0x2bffd3) => {
      if (_0x2bffd3?.randomizeOnSubmit !== true) return false;
      const _0x113db3 = String(_0x2bffd3?.id || '').trim();
      return _0x113db3 && String(_0x2bffd3?.variant || '') === 'randomSeedRow';
    });
  if (_0x21a64e.length === 0) return null;
  let _0x4d12bf = {
      ...getPlainObject(nodeData?.generationParams),
      ...getPlainObject(payload?.generationParams),
    },
    _0x27b9cd = null,
    _0x332139 = false;
  _0x21a64e.forEach((_0x2df6e1) => {
    const _0x544c2d = String(_0x2df6e1?.id || '').trim(),
      _0x4e841e = String(_0x2df6e1?.randomSeedModeField || '').trim(),
      _0x530390 = String(_0x2df6e1?.randomSeedDefaultMode || 'fixed').trim() || 'fixed',
      _0x4720ff = _0x4e841e
        ? normalizeSubmitRandomSeedMode(getSubmitRandomSeedParam(_0x4d12bf, _0x4e841e, _0x530390), _0x530390)
        : 'random';
    if (_0x4720ff !== 'random') return;
    const _0x442427 = generateSubmitRandomSeed(_0x2df6e1);
    ((_0x4d12bf = { ..._0x4d12bf, [_0x544c2d]: _0x442427, ...(_0x4e841e ? { [_0x4e841e]: 'random' } : {}) }),
      (_0x27b9cd = {
        ...(_0x27b9cd || _0x4d12bf),
        [_0x544c2d]: _0x442427,
        ...(_0x4e841e ? { [_0x4e841e]: 'fixed' } : {}),
      }),
      (_0x332139 = true));
  });
  if (!_0x332139) return null;
  const _0x2fd374 = String(payload?.model || nodeData?.model || modelManifest?.modelId || '').trim(),
    _0x4b84a6 = { generationParams: _0x4d12bf };
  return (
    _0x2fd374 &&
      (_0x4b84a6.generationParamsByModel = {
        ...getPlainObject(nodeData?.generationParamsByModel),
        [_0x2fd374]: _0x4d12bf,
      }),
    { requestParams: _0x27b9cd || _0x4d12bf, storePatch: _0x4b84a6 }
  );
}
function normalizeHappyHorseMode(_0x2a845c) {
  const _0x142bc1 = String(_0x2a845c || '')
    .trim()
    .toLowerCase();
  return _0x142bc1 === 'image' || _0x142bc1 === 'reference' || _0x142bc1 === 'edit' ? _0x142bc1 : 'auto';
}
function getHappyHorseMode(_0x346bc5 = {}) {
  const _0x4715e9 = getPlainObject(_0x346bc5?.generationParams);
  return normalizeHappyHorseMode(_0x4715e9.happyhorse_mode ?? _0x346bc5?.happyhorse_mode);
}
function normalizeWan27Mode(_0x2db053) {
  const _0x1aa0d1 = String(_0x2db053 || '')
    .trim()
    .toLowerCase();
  return _0x1aa0d1 === 'video' || _0x1aa0d1 === 'reference' || _0x1aa0d1 === 'edit' ? _0x1aa0d1 : 'image';
}
function getWan27Mode(_0x2ec95a = {}) {
  const _0x4990e7 = getPlainObject(_0x2ec95a?.generationParams);
  return normalizeWan27Mode(_0x4990e7.wan27_mode ?? _0x2ec95a?.wan27_mode);
}
function normalizeKlingV3OmniMode(_0x391d3d) {
  const _0xe1452a = String(_0x391d3d || '')
    .trim()
    .toLowerCase();
  return _0xe1452a === 'reference' || _0xe1452a === 'edit' ? _0xe1452a : 'image';
}
function getKlingV3OmniMode(_0x1b01af = {}) {
  const _0x4cf570 = getPlainObject(_0x1b01af?.generationParams);
  return normalizeKlingV3OmniMode(_0x4cf570.kling_v3_omni_mode ?? _0x1b01af?.kling_v3_omni_mode);
}
function normalizeMediaDurationSeconds(..._0xbbc91) {
  for (const _0x16185c of _0xbbc91) {
    const _0x3c5064 = Number(_0x16185c);
    if (Number.isFinite(_0x3c5064) && _0x3c5064 > 0) return _0x3c5064;
  }
  return 0;
}
function getVideoDurationFromSource(_0x54ea74 = {}, _0x2b4bee = null) {
  return normalizeMediaDurationSeconds(
    _0x2b4bee?.videoDuration,
    _0x2b4bee?.duration,
    _0x54ea74?.videoDuration,
    _0x54ea74?.duration,
  );
}
function getVideoDurationFromAssetRef(_0x197fdb = {}) {
  return normalizeMediaDurationSeconds(
    _0x197fdb?.videoDuration,
    _0x197fdb?.duration,
    _0x197fdb?.nodeData?.videoDuration,
    _0x197fdb?.nodeData?.duration,
  );
}
function normalizeMediaSizeBytes(..._0x4ba70c) {
  for (const _0x539d50 of _0x4ba70c) {
    const _0x361554 = Number(_0x539d50);
    if (Number.isFinite(_0x361554) && _0x361554 > 0) return _0x361554;
  }
  return 0;
}
function getAudioDurationFromSource(_0x5e54f7 = {}) {
  return normalizeMediaDurationSeconds(_0x5e54f7?.audioDuration, _0x5e54f7?.duration);
}
function getAudioDurationFromAssetRef(_0x4eef68 = {}) {
  return normalizeMediaDurationSeconds(
    _0x4eef68?.audioDuration,
    _0x4eef68?.duration,
    _0x4eef68?.nodeData?.audioDuration,
    _0x4eef68?.nodeData?.duration,
  );
}
function getAudioSizeBytesFromSource(_0x25df9f = {}) {
  return normalizeMediaSizeBytes(
    _0x25df9f?.audioSizeBytes,
    _0x25df9f?.audioByteSize,
    _0x25df9f?.fileSize,
    _0x25df9f?.sizeBytes,
    _0x25df9f?.byteSize,
  );
}
function getAudioSizeBytesFromAssetRef(_0x22994e = {}) {
  return normalizeMediaSizeBytes(
    _0x22994e?.audioSizeBytes,
    _0x22994e?.audioByteSize,
    _0x22994e?.fileSize,
    _0x22994e?.sizeBytes,
    _0x22994e?.byteSize,
    _0x22994e?.nodeData?.audioSizeBytes,
    _0x22994e?.nodeData?.audioByteSize,
    _0x22994e?.nodeData?.fileSize,
    _0x22994e?.nodeData?.sizeBytes,
    _0x22994e?.nodeData?.byteSize,
  );
}
function buildVideoInputUrlsByFixedKindSlot({
  fixedInputConfig: fixedInputConfig = null,
  refs: refs = [],
  assetInputRefs: assetInputRefs = [],
  kind: kind = 'image',
} = {}) {
  const _0x539131 = String(kind || '').trim(),
    _0x5466b6 = (fixedInputConfig?.visibleSlots || [])
      .map((_0x144944) => String(_0x144944 || '').trim())
      .filter(
        (_0x19564d) => _0x19564d && String(fixedInputConfig?.slotKindById?.[_0x19564d] || '') === _0x539131,
      );
  if (_0x5466b6.length === 0) return {};
  const _0xe95a3b = {},
    _0x4acaf9 = new Set(),
    _0x265fb6 = (_0x3c5dce, _0x20acc5) => {
      const _0x17a230 = String(_0x3c5dce || '').trim(),
        _0x2f1a4d = String(_0x20acc5 || '').trim();
      if (!_0x17a230 || !_0x2f1a4d || _0xe95a3b[_0x17a230]) return false;
      if (!_0x5466b6.includes(_0x17a230)) return false;
      return ((_0xe95a3b[_0x17a230] = _0x2f1a4d), _0x4acaf9.add(_0x2f1a4d), true);
    },
    _0x44daab = (_0x523f95, { allowAuto: allowAuto = true } = {}) => {
      const _0x4c1bc7 = String(_0x523f95?.url || '').trim();
      if (!_0x4c1bc7 || _0x4acaf9.has(_0x4c1bc7)) return false;
      const _0xb821fa = resolveEffectiveInputKind(_0x523f95) || _0x523f95?.type || _0x539131;
      if (String(_0xb821fa || '').trim() !== _0x539131) return false;
      const _0x12008b = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: _0x523f95?.refSlot,
        kind: _0x539131,
        occupiedSlots: _0xe95a3b,
        sourceNode: _0x523f95?.nodeData || _0x523f95,
      });
      if (!allowAuto && _0x12008b.reason !== 'explicit') return false;
      return _0x265fb6(_0x12008b.slot, _0x4c1bc7);
    },
    _0x161dc7 = (_0x4a6c80) => {
      const _0x4810a7 = String(_0x4a6c80 || '').trim();
      if (!_0x4810a7 || _0x4acaf9.has(_0x4810a7)) return false;
      const _0x5d9733 = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: '',
        kind: _0x539131,
        occupiedSlots: _0xe95a3b,
        sourceNode: { type: _0x539131, url: _0x4810a7 },
      });
      return _0x265fb6(_0x5d9733.slot, _0x4810a7);
    },
    _0x436716 = [
      ...(Array.isArray(refs) ? refs : []),
      ...(Array.isArray(assetInputRefs) ? assetInputRefs : []),
    ];
  return (
    _0x436716.forEach((_0x2e0544) => {
      _0x44daab(_0x2e0544, { allowAuto: false });
    }),
    (Array.isArray(refs) ? refs : []).forEach((_0x476e21) => {
      _0x44daab(_0x476e21);
    }),
    (Array.isArray(assetInputRefs) ? assetInputRefs : []).forEach((_0x2e5028) => {
      const _0x1ba25b = resolveEffectiveInputKind(_0x2e5028) || _0x2e5028?.type;
      if (_0x1ba25b === _0x539131) _0x161dc7(_0x2e5028?.url);
    }),
    _0xe95a3b
  );
}
function buildVideoInputUrlsByFixedImageSlot({
  fixedInputConfig: fixedInputConfig = null,
  imageRefs: imageRefs = [],
  assetInputRefs: assetInputRefs = [],
} = {}) {
  return buildVideoInputUrlsByFixedKindSlot({
    fixedInputConfig: fixedInputConfig,
    refs: imageRefs,
    assetInputRefs: assetInputRefs,
    kind: 'image',
  });
}
function buildHappyHorseMediaPayload({
  prompt: prompt = '',
  mode: mode = 'auto',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0,
  maxVideoSeconds: maxVideoSeconds = HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS,
} = {}) {
  const _0x4608f1 = String(prompt || '').trim();
  if (!_0x4608f1) return { ok: false, message: videoTaskText('validation.happyHorse.promptRequired') };
  const _0x4b9283 = Array.from(
      new Set(
        (Array.isArray(images) ? images : [])
          .map((_0x777217) => String(_0x777217 || '').trim())
          .filter(Boolean),
      ),
    ),
    _0x1c26f0 = Array.from(
      new Set(
        (Array.isArray(videos) ? videos : [])
          .map((_0x45c33a) => String(_0x45c33a || '').trim())
          .filter(Boolean),
      ),
    ),
    _0x206aea = normalizeHappyHorseMode(mode),
    _0x1b9341 = _0x4b9283.length > 0 || _0x1c26f0.length > 0,
    _0x152df4 = { ok: true, images: [], videos: [], inputUrls: [], mode: 'auto' },
    _0x1dd089 = assetVideoCount > 0 ? videoTaskText('validation.removePromptVideoRefs') : '';
  if (_0x206aea === 'auto') {
    if (_0x4b9283.length > 0 || _0x1c26f0.length > 0)
      return { ok: false, message: videoTaskText('validation.happyHorse.chooseMode') };
    return _0x152df4;
  }
  if (_0x206aea === 'image') {
    if (_0x1c26f0.length > 0)
      return { ok: false, message: videoTaskText('validation.imageModeRejectsVideo', { hint: _0x1dd089 }) };
    if (!_0x4b9283[0]) {
      if (!_0x1b9341) return _0x152df4;
      return { ok: false, message: videoTaskText('validation.imageModeNeedsFirstFrame') };
    }
    return {
      ok: true,
      images: _0x4b9283.slice(0, 1),
      videos: [],
      inputUrls: _0x4b9283.slice(0, 1),
      mode: 'image',
    };
  }
  if (_0x206aea === 'reference') {
    if (_0x1c26f0.length > 0)
      return {
        ok: false,
        message: videoTaskText('validation.referenceImageModeRejectsVideo', { hint: _0x1dd089 }),
      };
    if (_0x4b9283.length <= 0) {
      if (!_0x1b9341) return _0x152df4;
      return { ok: false, message: videoTaskText('validation.referenceImageModeNeedsReference') };
    }
    const _0x2fcd34 = _0x4b9283.slice(0, 9);
    return { ok: true, images: _0x2fcd34, videos: [], inputUrls: _0x2fcd34, mode: 'reference' };
  }
  if (!_0x1c26f0[0]) {
    if (!_0x1b9341) return _0x152df4;
    return { ok: false, message: videoTaskText('validation.videoEditNeedsVideo') };
  }
  const _0x48e53c = _0x1c26f0[0],
    _0x414d2a =
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (_0x182ba8) => String(_0x182ba8?.url || '').trim() === _0x48e53c,
      ) || {},
    _0x21dcd2 = normalizeMediaDurationSeconds(_0x414d2a.duration),
    _0x5abfde = Number(maxVideoSeconds),
    _0x2ffca8 = Number.isFinite(_0x5abfde) && _0x5abfde > 0 ? _0x5abfde : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
  if (_0x21dcd2 > _0x2ffca8)
    return {
      ok: false,
      message: videoTaskText('validation.happyHorse.editVideoMaxSeconds', { seconds: _0x2ffca8 }),
    };
  return {
    ok: true,
    images: _0x4b9283.slice(0, 5),
    videos: [_0x48e53c],
    inputUrls: _0x4b9283.slice(0, 5),
    mode: 'edit',
  };
}
function orderHappyHorseImageUrls({
  mode: mode = 'auto',
  images: images = [],
  slotUrls: slotUrls = {},
} = {}) {
  const _0x1eaa62 = normalizeHappyHorseMode(mode),
    _0x374ab1 = [],
    _0x5f3603 = (_0x374d7a) => {
      const _0x2d5127 = String(_0x374d7a || '').trim();
      if (_0x2d5127 && !_0x374ab1.includes(_0x2d5127)) _0x374ab1.push(_0x2d5127);
    };
  if (_0x1eaa62 === 'image') _0x5f3603(slotUrls.firstFrame);
  else {
    if (_0x1eaa62 === 'reference') _0x5f3603(slotUrls.referenceImage);
    else _0x1eaa62 === 'edit' && _0x5f3603(slotUrls.editRefImage);
  }
  return ((Array.isArray(images) ? images : []).forEach(_0x5f3603), _0x374ab1);
}
function buildWan27MediaPayload({
  mode: mode = 'image',
  images: images = [],
  videos: videos = [],
  audios: audios = [],
  videoEntries: videoEntries = [],
  audioEntries: audioEntries = [],
  assetVideoCount: assetVideoCount = 0,
} = {}) {
  const _0x86f5b0 = normalizeWan27Mode(mode),
    _0x2d45df = (_0x19a958) =>
      Array.from(
        new Set(
          (Array.isArray(_0x19a958) ? _0x19a958 : [])
            .map((_0x5d284d) => String(_0x5d284d || '').trim())
            .filter(Boolean),
        ),
      ),
    _0x239995 = _0x2d45df(images),
    _0x4b3978 = _0x2d45df(videos),
    _0x8a6f0 = _0x2d45df(audios),
    _0x590aba = assetVideoCount > 0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    _0x4c48f6 = (_0x233587) => {
      if (!_0x233587) return null;
      const _0x9a61b =
          (Array.isArray(audioEntries) ? audioEntries : []).find(
            (_0x5818cc) => String(_0x5818cc?.url || '').trim() === _0x233587,
          ) || {},
        _0x4c7900 = normalizeMediaDurationSeconds(_0x9a61b.duration);
      if (
        _0x4c7900 > 0 &&
        (_0x4c7900 < WAN27_AUDIO_INPUT_MIN_SECONDS || _0x4c7900 > WAN27_AUDIO_INPUT_MAX_SECONDS)
      )
        return videoTaskText('validation.wan27.audioDuration');
      const _0x5dccaf = normalizeMediaSizeBytes(_0x9a61b.sizeBytes);
      if (_0x5dccaf > WAN27_AUDIO_INPUT_MAX_BYTES) return videoTaskText('validation.wan27.audioSize');
      return null;
    },
    _0x4872c9 = (_0x1c6da0) =>
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (_0x163d21) => String(_0x163d21?.url || '').trim() === _0x1c6da0,
      ) || {},
    _0x5389a6 = (_0x1c98de) => normalizeMediaDurationSeconds(_0x4872c9(_0x1c98de).duration);
  if (_0x86f5b0 === 'video') {
    if (_0x239995.length > 0)
      return { ok: false, message: videoTaskText('validation.videoExtendRejectsImage', { hint: _0x590aba }) };
    if (_0x8a6f0.length > 0)
      return { ok: false, message: videoTaskText('validation.videoExtendRejectsAudio') };
    if (!_0x4b3978[0]) return { ok: true, images: [], videos: [], audios: [], inputUrls: [] };
    const _0x258065 = _0x4b3978[0],
      _0xe26304 = _0x5389a6(_0x258065);
    if (_0xe26304 > WAN27_VIDEO_EXTEND_MAX_SECONDS)
      return { ok: false, message: videoTaskText('validation.wan27.extendMaxSeconds') };
    return { ok: true, images: [], videos: [_0x258065], audios: [], inputUrls: [] };
  }
  if (_0x86f5b0 === 'reference') {
    const _0x38e84f = _0x239995.slice(0, 1),
      _0x2993ed = _0x4b3978.slice(0, 1);
    if (_0x38e84f.length <= 0 && _0x2993ed.length <= 0)
      return { ok: false, message: videoTaskText('validation.referenceVideoNeedsMedia') };
    const _0x354b9a = _0x2993ed[0] || '',
      _0x108f6f = _0x5389a6(_0x354b9a);
    if (_0x108f6f > WAN27_REFERENCE_VIDEO_MAX_SECONDS)
      return { ok: false, message: videoTaskText('validation.wan27.referenceVideoMaxSeconds') };
    const _0x8e4f7a = _0x8a6f0[0] || '',
      _0x2aa3d6 = _0x4c48f6(_0x8e4f7a);
    if (_0x2aa3d6) return { ok: false, message: _0x2aa3d6 };
    if (_0x8e4f7a && _0x38e84f.length <= 0)
      return { ok: false, message: videoTaskText('validation.referenceAudioNeedsImage') };
    return {
      ok: true,
      images: _0x38e84f,
      videos: _0x2993ed,
      audios: _0x8e4f7a ? [_0x8e4f7a] : [],
      inputUrls: _0x38e84f,
    };
  }
  if (_0x86f5b0 === 'edit') {
    if (!_0x4b3978[0]) return { ok: false, message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (_0x239995.length > 0)
      return { ok: false, message: videoTaskText('validation.videoEditRejectsImageUseReferenceVideo') };
    if (_0x8a6f0.length > 0) return { ok: false, message: videoTaskText('validation.videoEditRejectsAudio') };
    const _0x29d482 = _0x4b3978[0],
      _0x46306a = _0x5389a6(_0x29d482);
    if (
      _0x46306a > 0 &&
      (_0x46306a < WAN27_EDIT_VIDEO_MIN_SECONDS || _0x46306a > WAN27_EDIT_VIDEO_MAX_SECONDS)
    )
      return { ok: false, message: videoTaskText('validation.wan27.editVideoDuration') };
    return { ok: true, images: [], videos: _0x4b3978.slice(0, 2), audios: [], inputUrls: [] };
  }
  if (_0x4b3978.length > 0)
    return { ok: false, message: videoTaskText('validation.imageModeRejectsVideo', { hint: _0x590aba }) };
  const _0x593e77 = _0x8a6f0[0] || '',
    _0x1c4d12 = _0x4c48f6(_0x593e77);
  if (_0x1c4d12) return { ok: false, message: _0x1c4d12 };
  const _0x4542e5 = _0x239995.slice(0, 2);
  return {
    ok: true,
    images: _0x4542e5,
    videos: [],
    audios: _0x593e77 ? [_0x593e77] : [],
    inputUrls: _0x4542e5,
  };
}
function buildKlingV3OmniMediaPayload({
  mode: mode = 'image',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0,
} = {}) {
  const _0x112056 = normalizeKlingV3OmniMode(mode),
    _0x5bfe59 = (_0x2f8a6f) =>
      Array.from(
        new Set(
          (Array.isArray(_0x2f8a6f) ? _0x2f8a6f : [])
            .map((_0xcfed40) => String(_0xcfed40 || '').trim())
            .filter(Boolean),
        ),
      ),
    _0x5afc51 = _0x5bfe59(images),
    _0x1cff18 = _0x5bfe59(videos),
    _0x5e4bef = assetVideoCount > 0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    _0x22557d = (_0x44d43d) =>
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (_0x4207f9) => String(_0x4207f9?.url || '').trim() === _0x44d43d,
      ) || {},
    _0x5b4e20 = (_0x35db42) => normalizeMediaDurationSeconds(_0x22557d(_0x35db42).duration);
  if (_0x112056 === 'reference') {
    const _0x1765b5 = _0x5afc51.slice(0, 1),
      _0x525f47 = _0x1cff18.slice(0, 1);
    if (_0x1765b5.length <= 0 && _0x525f47.length <= 0)
      return { ok: false, message: videoTaskText('validation.referenceVideoNeedsMedia') };
    return { ok: true, images: _0x1765b5, videos: _0x525f47, audios: [], inputUrls: _0x1765b5 };
  }
  if (_0x112056 === 'edit') {
    if (!_0x1cff18[0]) return { ok: false, message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (_0x5afc51.length > 0)
      return { ok: false, message: videoTaskText('validation.videoEditRejectsImage') };
    const _0x4af394 = _0x1cff18[0],
      _0x2e85f7 = _0x5b4e20(_0x4af394);
    if (
      _0x2e85f7 > 0 &&
      (_0x2e85f7 < KLING_V3_OMNI_VIDEO_MIN_SECONDS || _0x2e85f7 > KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS)
    )
      return { ok: false, message: videoTaskText('validation.klingV3Omni.editVideoDuration') };
    return { ok: true, images: [], videos: [_0x4af394], audios: [], inputUrls: [] };
  }
  if (_0x1cff18.length > 0)
    return { ok: false, message: videoTaskText('validation.imageModeRejectsVideo', { hint: _0x5e4bef }) };
  return {
    ok: true,
    images: _0x5afc51.slice(0, 2),
    videos: [],
    audios: [],
    inputUrls: _0x5afc51.slice(0, 2),
  };
}
function replaceKlingO1PromptImageReferences(_0x575d95, _0x47a4fd) {
  const _0x364b20 = Math.max(0, Math.trunc(Number(_0x47a4fd) || 0));
  if (_0x364b20 <= 0) return String(_0x575d95 || '');
  return String(_0x575d95 || '').replace(/@?图片\s*([1-9]\d*)/g, (_0x351864, _0x2d240e) => {
    const _0x3049b5 = Number.parseInt(String(_0x2d240e || ''), 10);
    if (!Number.isFinite(_0x3049b5) || _0x3049b5 < 1 || _0x3049b5 > _0x364b20) return _0x351864;
    return '<<<image_' + _0x3049b5 + '>>>';
  });
}
function buildKlingO1MediaPayload({
  prompt: prompt = '',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  videoRole: videoRole = '',
  hasEditVideo: hasEditVideo = false,
  hasFeatureVideo: hasFeatureVideo = false,
} = {}) {
  const _0x2b3226 = (_0x5221ad) =>
      Array.from(
        new Set(
          (Array.isArray(_0x5221ad) ? _0x5221ad : [])
            .map((_0x2fe426) => String(_0x2fe426 || '').trim())
            .filter(Boolean),
        ),
      ),
    _0xf45dd2 = _0x2b3226(images),
    _0x1418a5 = _0x2b3226(videos),
    _0x4081c7 = String(videoRole || '').trim() === 'feature' ? 'feature' : 'base',
    _0x16a570 = (_0x5156c7) =>
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (_0x462ef8) => String(_0x462ef8?.url || '').trim() === _0x5156c7,
      ) || {},
    _0x54270a = (_0x2d1b43) => normalizeMediaDurationSeconds(_0x16a570(_0x2d1b43).duration);
  if (hasEditVideo && hasFeatureVideo)
    return { ok: false, message: videoTaskText('validation.klingO1.editAndFeatureExclusive') };
  if (_0x1418a5.length > 1) return { ok: false, message: videoTaskText('validation.klingO1.onlyOneVideo') };
  const _0x8e3b = _0x1418a5[0] || '';
  if (_0x8e3b) {
    const _0x13e9cf = _0x54270a(_0x8e3b);
    if (_0x13e9cf > 0 && (_0x13e9cf < KLING_O1_VIDEO_MIN_SECONDS || _0x13e9cf > KLING_O1_VIDEO_MAX_SECONDS))
      return { ok: false, message: videoTaskText('validation.klingO1.referenceVideoDuration') };
    if (_0x4081c7 === 'base') {
      if (_0xf45dd2.length > 0)
        return { ok: false, message: videoTaskText('validation.klingO1.editVideoRejectsImage') };
      return {
        ok: true,
        prompt: replaceKlingO1PromptImageReferences(prompt, 0),
        images: [],
        videos: [_0x8e3b],
        inputUrls: [],
        videoRole: 'base',
      };
    }
    if (_0xf45dd2.length > 1)
      return { ok: false, message: videoTaskText('validation.klingO1.featureVideoMaxOneImage') };
    const _0xabbc8d = _0xf45dd2.slice(0, 1);
    return {
      ok: true,
      prompt: replaceKlingO1PromptImageReferences(prompt, _0xabbc8d.length),
      images: _0xabbc8d,
      videos: [_0x8e3b],
      inputUrls: _0xabbc8d,
      videoRole: 'feature',
    };
  }
  const _0x141c3d = _0xf45dd2.slice(0, 2);
  return {
    ok: true,
    prompt: replaceKlingO1PromptImageReferences(prompt, _0x141c3d.length),
    images: _0x141c3d,
    videos: [],
    inputUrls: _0x141c3d,
    videoRole: '',
  };
}
export function createVideoNodeTaskOrchestrationModule(_0x267351) {
  const {
      store: _0x4cc8fc,
      api: _0x285cdc,
      getImage: _0x215b94,
      startLoading: _0x55f9d6,
      stopLoading: _0x11f58d,
      ensureConfig: _0x568d9b,
      getProviderConfig: _0x358106,
      isVideoVipModel: _0x212b55,
      ensureVipSessionRecheck: _0x9f6bfe,
    } = _0x267351,
    _0x22c9ed = 'DREAMINA_POLL_TIMEOUT',
    _0x4fb3f5 = 20 * 60 * 0x3e8,
    _0x297b39 = 20 * 0x3e8,
    _0x52a04a = 24 * 60 * 60 * 0x3e8,
    _0x336be9 = () =>
      typeof _0x4cc8fc.getStateRaw === 'function' ? _0x4cc8fc.getStateRaw() : _0x4cc8fc.getState();
  class _0x34e28e {
    ['_isDreaminaPollTimeoutError'](_0x1390da) {
      const _0x3ccd35 = String(_0x1390da?.code || '')
        .trim()
        .toUpperCase();
      if (_0x3ccd35 === _0x22c9ed || _0x3ccd35 === 'TIMEOUT') return true;
      const _0x11dfd2 = String(_0x1390da?.type || '')
        .trim()
        .toUpperCase();
      if (_0x11dfd2 === 'TIMEOUT' || _0x11dfd2 === 'TASK_TIMEOUT') return true;
      const _0x56afbc = String(_0x1390da?.message || '')
        .trim()
        .toLowerCase();
      return _0x56afbc.includes('timeout') || _0x56afbc.includes('超时');
    }
    ['_buildDreaminaBackgroundPendingSnapshot'](_0x465a86 = '') {
      return this._buildDreaminaPendingSnapshot({
        submitId: _0x465a86,
        phase: 'generating',
        label: videoTaskText('task.backgroundQueueing'),
      });
    }
    ['_showDreaminaBackgroundQueueingToast'](_0x30fe16 = '') {
      const _0x10d00b =
        String(_0x30fe16 || '').trim() ||
        String(_0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim() ||
        String(this.nodeId || '').trim();
      if (_0x10d00b && dreaminaBackgroundQueueToastKeys.has(_0x10d00b)) return;
      if (_0x10d00b) dreaminaBackgroundQueueToastKeys.add(_0x10d00b);
      window.showToast?.(videoTaskText('toasts.dreaminaBackgroundQueueing'), 'warning');
    }
    ['_resolveDreaminaAdaptiveAspectRatioFromNode'](_0x5cbc2a = this._data) {
      const _0x519285 = Number(_0x5cbc2a?.width || 0),
        _0x64d8f8 = Number(_0x5cbc2a?.height || 0);
      return (
        pickClosestRatioForProviderModel({
          provider: resolveDreaminaStyleVideoProvider(_0x5cbc2a?.model, _0x5cbc2a?.provider),
          model: _0x5cbc2a?.model,
          width: _0x519285,
          height: _0x64d8f8,
        }) || '1:1'
      );
    }
    ['_hasResolvedVideoResult'](_0x5c9761 = this._data) {
      const _0x154ec6 = Array.isArray(_0x5c9761?.videos) ? _0x5c9761.videos : [];
      if (_0x154ec6.length > 0) return true;
      return !!String(_0x5c9761?.videoUrl || '').trim() || !!String(_0x5c9761?.localPath || '').trim();
    }
    ['_persistDreaminaResumeCache']() {
      try {
        window._triggerLocalCacheSave?.();
      } catch {}
    }
    ['_persistRunningHubResumeCache']() {
      try {
        window._triggerLocalCacheSave?.();
      } catch {}
    }
    ['_persistAsyncResumeCache']() {
      this._persistRunningHubResumeCache();
    }
    ['_isDreaminaRecoverableRunningTask'](_0xad0372 = this._data) {
      if (!this._isDreaminaVideoNode(_0xad0372)) return false;
      const _0x2f711d = String(_0xad0372?.dreaminaSubmitId || '').trim();
      if (!_0x2f711d) return false;
      const _0x36a10a = normalizeTaskStatus(_0xad0372?.jobStatus),
        _0x19940a = normalizeTaskStatus(_0xad0372?.dreaminaTaskPhase),
        _0x4e0e10 = normalizeTaskStatus(_0xad0372?.dreaminaTaskStatus);
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(_0x36a10a)) return false;
      if (DREAMINA_NON_RECOVERABLE_PHASES.has(_0x19940a)) return false;
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(_0x4e0e10)) return false;
      return true;
    }
    ['_isStaleActiveDreaminaTask'](_0x3ce338 = this._data) {
      if (!this._isGenerating) return false;
      if (_0x3ce338?.dreaminaTaskRecovering === true) return false;
      if (this._dreaminaResumePromise) return false;
      const _0x31a6c9 = Number(
        _0x3ce338?.dreaminaTaskLastCheckedAt ||
          _0x3ce338?.dreaminaTaskStartedAt ||
          _0x3ce338?.generationStartTime ||
          0,
      );
      if (!Number.isFinite(_0x31a6c9) || _0x31a6c9 <= 0) return false;
      return Date.now() - _0x31a6c9 >= DREAMINA_STALE_ACTIVE_RESUME_MS;
    }
    ['_shouldKeepDreaminaLoading'](
      _0x8b64c3 = _0x4cc8fc.getState().nodes?.[this.nodeId] || this._data || {},
    ) {
      if (!this._isDreaminaVideoNode(_0x8b64c3)) return false;
      const _0x5dc486 = normalizeTaskStatus(_0x8b64c3?.jobStatus),
        _0x384938 = normalizeTaskStatus(_0x8b64c3?.dreaminaTaskPhase),
        _0x116855 = normalizeTaskStatus(_0x8b64c3?.dreaminaTaskStatus);
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(_0x5dc486)) return false;
      if (DREAMINA_NON_RECOVERABLE_PHASES.has(_0x384938)) return false;
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(_0x116855)) return false;
      if (_0x8b64c3?.isGenerating === true) return true;
      if (
        String(_0x8b64c3?.jobStatus || '')
          .trim()
          .toLowerCase() === 'running'
      )
        return true;
      if (_0x8b64c3?.dreaminaTaskRecovering === true) return true;
      if (this._dreaminaResumePromise) return true;
      return this._isDreaminaRecoverableRunningTask(_0x8b64c3);
    }
    ['_inferAsyncProviderFromModel'](_0x221b16, _0x45d8b0 = '') {
      const _0x1002de = resolveModelProvider(_0x221b16, '', { allowProviderHint: false });
      if (_0x1002de) return _0x1002de;
      const _0x2f0529 = String(_0x45d8b0 || '')
        .trim()
        .toLowerCase();
      if (_0x2f0529) return _0x2f0529;
      const _0x466ab2 = String(_0x221b16 || '').trim();
      if (_0x466ab2 && !_0x466ab2.includes('/')) return 'grsai';
      return '';
    }
    ['_isRunningHubRecoverableRunningTask'](_0x8e4f71 = this._data) {
      if (!this._isRunninghubWorkflowModel(_0x8e4f71?.model, _0x8e4f71?.provider)) return false;
      const _0x407f48 = String(_0x8e4f71?.rhTaskId || '').trim();
      if (!_0x407f48) return false;
      const _0x1ad4d9 = String(_0x8e4f71?.rhTaskStatus || '')
        .trim()
        .toLowerCase();
      if (
        _0x1ad4d9 === 'success' ||
        _0x1ad4d9 === 'failed' ||
        _0x1ad4d9 === 'idle' ||
        _0x1ad4d9 === 'cancelled'
      )
        return false;
      return true;
    }
    ['_isAsyncRecoverableRunningTask'](_0x2553d3 = this._data) {
      const _0x5dc3e3 = String(_0x2553d3?.asyncTaskId || '').trim();
      if (!_0x5dc3e3) return false;
      const _0x479ba6 = this._inferAsyncProviderFromModel(
        _0x2553d3?.model,
        _0x2553d3?.asyncTaskProvider || _0x2553d3?.provider || '',
      );
      if (
        !_0x479ba6 ||
        _0x479ba6 === 'runninghubwf' ||
        _0x479ba6 === 'runninghub' ||
        _0x479ba6 === 'dreamina'
      )
        return false;
      const _0x26e674 = String(_0x2553d3?.asyncTaskKind || '')
        .trim()
        .toLowerCase();
      if (_0x26e674 && _0x26e674 !== 'video') return false;
      const _0x5735da = String(_0x2553d3?.asyncTaskStatus || '')
        .trim()
        .toLowerCase();
      if (
        _0x5735da === 'success' ||
        _0x5735da === 'failed' ||
        _0x5735da === 'idle' ||
        _0x5735da === 'cancelled'
      )
        return false;
      return true;
    }
    ['_buildRunningHubTaskPatch']({
      taskId: taskId = '',
      status: status = 'pending',
      startedAt: startedAt = 0,
      recovering: recovering = false,
      useOpenapiQuery: useOpenapiQuery = false,
    } = {}) {
      return {
        rhTaskId: String(taskId || '').trim(),
        rhTaskStatus: String(status || 'pending').trim() || 'pending',
        rhTaskStartedAt: Number(startedAt || 0),
        rhTaskRecovering: recovering === true,
        rhTaskUseOpenapiQuery: useOpenapiQuery === true,
      };
    }
    ['_buildAsyncTaskPatch']({
      provider: provider = '',
      kind: kind = 'video',
      taskId: taskId = '',
      status: status = 'pending',
      startedAt: startedAt = 0,
      recovering: recovering = false,
    } = {}) {
      return {
        asyncTaskProvider: String(provider || '').trim(),
        asyncTaskKind: String(kind || 'video').trim() || 'video',
        asyncTaskId: String(taskId || '').trim(),
        asyncTaskStatus: String(status || 'pending').trim() || 'pending',
        asyncTaskStartedAt: Number(startedAt || 0),
        asyncTaskRecovering: recovering === true,
      };
    }
    async ['_buildResumePayload'](_0x1916dd = this._data, _0x899741 = {}) {
      const _0x52fc66 = _0x1916dd || {},
        _0x15f122 = String(_0x52fc66?.model || '').trim(),
        _0x3aabfe = this._inferAsyncProviderFromModel(
          _0x15f122,
          _0x899741?.providerHint || _0x52fc66?.asyncTaskProvider || _0x52fc66?.provider || '',
        );
      if (!_0x15f122 || !_0x3aabfe)
        throw new Error(videoTaskText('errors.missingAsyncResumeModelOrProvider'));
      await _0x568d9b();
      const _0x511f07 = _0x358106(_0x3aabfe) || {},
        _0x135800 = String(
          _0x3aabfe === 'runninghub'
            ? _0x511f07.modelApiKey || _0x511f07.apiKey || ''
            : _0x511f07.apiKey || window._appApiKey || '',
        ).trim();
      return { nodeId: this.nodeId, model: _0x15f122, provider: _0x3aabfe, apiKey: _0x135800 };
    }
    ['_syncLocalTaskNodeData']() {
      const _0x219196 = _0x4cc8fc.getState().nodes?.[this.nodeId];
      if (_0x219196) this._data = _0x219196;
      return this._data || {};
    }
    ['_emitDreaminaTaskCenterUpdate'](_0x3de99f = {}, _0x9365ee = {}) {
      const _0x4ed3b3 = String(
          _0x3de99f?.submitId ||
            _0x9365ee.taskId ||
            _0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaSubmitId ||
            '',
        ).trim(),
        _0x56e36c = globalThis.window;
      if (!_0x4ed3b3 || typeof _0x56e36c?.dispatchEvent !== 'function') return;
      const _0x56f4a7 = String(_0x9365ee.status || mapDreaminaSnapshotToTaskCenterStatus(_0x3de99f)).trim(),
        _0x3ce357 = _0x56f4a7 === 'complete' || _0x56f4a7 === 'failed' || _0x56f4a7 === 'cancelled';
      _0x56e36c.dispatchEvent(
        new CustomEvent(GENERATION_TASK_CENTER_EVENT, {
          detail: {
            taskId: _0x4ed3b3,
            nodeId: this.nodeId,
            kind: 'dreaminaVideo',
            status: _0x56f4a7,
            progress: _0x56f4a7 === 'complete' ? 1 : _0x56f4a7 === 'waiting' ? 0 : 0.45,
            message: String(_0x9365ee.message || buildDreaminaTaskCenterMessage(_0x3de99f)).trim(),
            error:
              _0x56f4a7 === 'failed'
                ? String(_0x9365ee.error || _0x3de99f?.failReason || _0x3de99f?.label || '').trim()
                : '',
            result: _0x9365ee.result && typeof _0x9365ee.result === 'object' ? _0x9365ee.result : null,
            cancellable: true,
            createdAt: Number(
              _0x9365ee.createdAt ||
                _0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaTaskStartedAt ||
                Date.now(),
            ),
            startedAt: Number(
              _0x9365ee.startedAt || _0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaTaskStartedAt || 0,
            ),
            finishedAt: _0x3ce357 ? Date.now() : 0,
          },
        }),
      );
    }
    ['_buildDreaminaTaskPatch'](_0x55bfcf, _0x5802cc = {}) {
      const _0x10a447 = {
        dreaminaSubmitId: String(_0x55bfcf?.submitId || '').trim(),
        dreaminaTaskStatus: String(_0x55bfcf?.status || 'pending').trim() || 'pending',
        dreaminaTaskPhase: String(_0x55bfcf?.phase || 'generating').trim() || 'generating',
        dreaminaTaskLabel:
          String(_0x55bfcf?.label || videoTaskText('task.generating')).trim() ||
          videoTaskText('task.generating'),
        dreaminaTaskLastCheckedAt: Number(_0x55bfcf?.lastCheckedAt || Date.now()),
        dreaminaTaskRecovering: _0x5802cc.recovering === true,
        dreaminaTaskLastRaw:
          _0x55bfcf?.raw && typeof _0x55bfcf.raw === 'object' && !Array.isArray(_0x55bfcf.raw)
            ? _0x55bfcf.raw
            : {},
      };
      return (
        _0x5802cc.startedAt != null && (_0x10a447.dreaminaTaskStartedAt = Number(_0x5802cc.startedAt || 0)),
        _0x10a447
      );
    }
    ['_applyDreaminaTaskSnapshot'](_0x50a94e, _0x5710c3 = {}) {
      const _0x47986d = _0x4cc8fc.getState().nodes?.[this.nodeId] || this._data || {},
        _0x11c6d2 = this._buildDreaminaTaskPatch(_0x50a94e, {
          recovering: _0x5710c3.recovering === true,
          startedAt: _0x5710c3.startedAt != null ? _0x5710c3.startedAt : _0x47986d?.dreaminaTaskStartedAt,
        });
      return (
        _0x4cc8fc.updateNodeData(this.nodeId, _0x11c6d2),
        this._syncLocalTaskNodeData(),
        this._persistDreaminaResumeCache(),
        this._emitDreaminaTaskCenterUpdate(_0x50a94e, { startedAt: _0x11c6d2.dreaminaTaskStartedAt }),
        _0x11c6d2
      );
    }
    ['_stopDreaminaRecovery'](_0x167328 = false) {
      this._dreaminaResumeAbortController &&
        !this._dreaminaResumeAbortController.signal.aborted &&
        this._dreaminaResumeAbortController.abort();
      ((this._dreaminaResumeAbortController = null),
        (this._dreaminaResumeSubmitId = ''),
        (this._dreaminaResumePromise = null),
        (this._dreaminaActiveSubmitId = ''));
      if (_0x167328) {
        const _0x23568b = _0x4cc8fc.getState().nodes?.[this.nodeId];
        _0x23568b?.dreaminaTaskRecovering &&
          _0x4cc8fc.updateNodeData(this.nodeId, { dreaminaTaskRecovering: false });
      }
    }
    ['_stopRunningHubRecovery'](_0x49ed52 = false) {
      this._rhResumeAbortController &&
        !this._rhResumeAbortController.signal.aborted &&
        this._rhResumeAbortController.abort();
      ((this._rhResumeAbortController = null), (this._rhResumeTaskId = ''), (this._rhResumePromise = null));
      if (_0x49ed52) {
        const _0x2ee084 = _0x4cc8fc.getState().nodes?.[this.nodeId];
        _0x2ee084?.rhTaskRecovering &&
          (_0x4cc8fc.updateNodeData(this.nodeId, { rhTaskRecovering: false }),
          this._persistRunningHubResumeCache());
      }
    }
    ['_stopAsyncRecovery'](_0x1a65e4 = false) {
      this._asyncResumeAbortController &&
        !this._asyncResumeAbortController.signal.aborted &&
        this._asyncResumeAbortController.abort();
      ((this._asyncResumeAbortController = null),
        (this._asyncResumeTaskId = ''),
        (this._asyncResumePromise = null));
      if (_0x1a65e4) {
        const _0x35bd25 = _0x4cc8fc.getState().nodes?.[this.nodeId];
        _0x35bd25?.asyncTaskRecovering &&
          (_0x4cc8fc.updateNodeData(this.nodeId, { asyncTaskRecovering: false }),
          this._persistAsyncResumeCache());
      }
    }
    ['_buildDreaminaPendingSnapshot']({
      submitId: submitId = '',
      phase: phase = 'generating',
      label: label = videoTaskText('task.generating'),
      raw: raw = {},
    } = {}) {
      return {
        submitId: String(submitId || '').trim(),
        status: 'pending',
        phase: phase,
        label: label,
        queueStatus: '',
        queueIndex: null,
        queueLength: null,
        outputs: [],
        failReason: '',
        raw: raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {},
        isTerminal: false,
        hasOutputs: false,
        lastCheckedAt: Date.now(),
      };
    }
    ['_buildDreaminaFailedSnapshot'](_0x32dda8, _0x417bf4, _0x121570 = {}) {
      return {
        submitId: String(_0x32dda8 || '').trim(),
        status: 'failed',
        phase: 'failed',
        label: String(_0x417bf4 || '').trim() || videoTaskText('task.queryFailed'),
        queueStatus: '',
        queueIndex: null,
        queueLength: null,
        outputs: [],
        failReason: String(_0x417bf4 || '').trim(),
        raw: _0x121570 && typeof _0x121570 === 'object' && !Array.isArray(_0x121570) ? _0x121570 : {},
        isTerminal: true,
        hasOutputs: false,
        lastCheckedAt: Date.now(),
      };
    }
    ['_applyDreaminaSuccessResult'](
      _0x2aa9d3,
      _0x504388,
      _0x2478d7 = null,
      { writeStore: writeStore = true, returnPatch: returnPatch = false } = {},
    ) {
      const _0x121684 = normalizeVideoGenerationResult(_0x2aa9d3),
        _0x1c4d78 = _0x121684.items,
        _0x599132 = this._isDreaminaVideoNode(_0x4cc8fc.getState().nodes?.[this.nodeId] || this._data || {}),
        _0x121483 =
          String(_0x2478d7?.submitId || '').trim() ||
          String(_0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim(),
        _0x31944c = _0x599132
          ? _0x2478d7
            ? this._buildDreaminaTaskPatch(_0x2478d7, { recovering: false, startedAt: _0x504388 })
            : {
                isGenerating: false,
                jobStatus: 'success',
                dreaminaSubmitId: _0x121483,
                dreaminaTaskStatus: 'success',
                dreaminaTaskPhase: 'done',
                dreaminaTaskLabel: videoTaskText('task.completed'),
                dreaminaTaskStartedAt: _0x504388,
                dreaminaTaskLastCheckedAt: Date.now(),
                dreaminaTaskLastRaw: {},
                dreaminaTaskRecovering: false,
              }
          : {},
        _0x582570 = buildVideoGenerationResultPatch(_0x121684, { startedAt: _0x504388 }),
        _0x49b508 = _0x582570 ? { ..._0x582570, ..._0x31944c } : null;
      _0x582570 &&
        (writeStore && (_0x4cc8fc.updateNodeData(this.nodeId, _0x49b508), this._persistDreaminaResumeCache()),
        _0x599132 &&
          this._emitDreaminaTaskCenterUpdate(
            _0x2478d7 || {
              submitId: _0x121483,
              status: 'success',
              phase: 'done',
              label: videoTaskText('task.completed'),
            },
            { status: 'complete', startedAt: _0x504388, result: _0x1c4d78[0] || _0x121684 },
          ));
      if (returnPatch) return { videos: _0x1c4d78, patch: _0x49b508 || {}, normalizedResult: _0x121684 };
      return _0x1c4d78;
    }
    ['_scheduleDreaminaResultEnrichment'](_0x5a3034) {
      if (!(Array.isArray(_0x5a3034) && _0x5a3034.length > 0)) return;
      {
        const _0x168bf8 = this.nodeId,
          _0x199ab4 = ++this._resultThumbToken;
        (async () => {
          for (let _0xeb2bff = 0; _0xeb2bff < _0x5a3034.length; _0xeb2bff++) {
            if (_0x199ab4 !== this._resultThumbToken) return;
            const _0x2b536b = _0x4cc8fc.getState().nodes?.[_0x168bf8];
            if (!_0x2b536b) return;
            const _0x2e554b = Array.isArray(_0x2b536b.videos) ? _0x2b536b.videos : [],
              _0x576fc9 = _0x2e554b[_0xeb2bff];
            if (!_0x576fc9 || typeof _0x576fc9 !== 'object') continue;
            const _0x350e80 = !!String(_0x576fc9.thumbUrl || '').trim();
            if (_0x350e80) {
              const _0x99c5ac = Number(_0x2b536b.mainVideoIndex),
                _0x5ce493 = Number.isFinite(_0x99c5ac) ? Math.max(0, Math.trunc(_0x99c5ac)) : 0;
              _0xeb2bff === _0x5ce493 &&
                !String(_0x2b536b.thumbUrl || '').trim() &&
                _0x4cc8fc.updateNodeData(_0x168bf8, { thumbUrl: String(_0x576fc9.thumbUrl).trim() });
              continue;
            }
            const _0x34ff4a = this._resolveVideoMetaSrcFromVideoData(_0x576fc9);
            if (!_0x34ff4a) continue;
            if (!(_0x34ff4a.startsWith('/output/') || _0x34ff4a.startsWith('/data/'))) continue;
            const _0x57567d = 'gen|' + _0x168bf8 + '|' + _0xeb2bff + '|' + _0x34ff4a;
            if (this._videoThumbPending.has(_0x57567d)) continue;
            this._videoThumbPending.add(_0x57567d);
            let _0x39de25 = null;
            try {
              _0x39de25 = await _0x285cdc.fetchVideoFirstFrameThumbFromServer(_0x34ff4a, {
                nodeId: _0x168bf8,
                assetId: String(_0x576fc9.assetId || _0x576fc9.thumbId || ''),
              });
            } catch {
              _0x39de25 = null;
            } finally {
              this._videoThumbPending.delete(_0x57567d);
            }
            if (_0x199ab4 !== this._resultThumbToken) return;
            const _0x40bece = String(_0x39de25?.thumbUrl || _0x39de25?.url || '').trim();
            if (!_0x40bece) continue;
            const _0x56ad5a = _0x4cc8fc.getState().nodes?.[_0x168bf8];
            if (!_0x56ad5a) return;
            const _0x3c45a7 = Array.isArray(_0x56ad5a.videos) ? _0x56ad5a.videos : [],
              _0x139523 = _0x3c45a7[_0xeb2bff];
            if (!_0x139523 || typeof _0x139523 !== 'object') continue;
            const _0x5b5c94 = { ..._0x139523 };
            if (!String(_0x5b5c94.thumbUrl || '').trim() && _0x40bece) _0x5b5c94.thumbUrl = _0x40bece;
            const _0x5e7d71 = _0x3c45a7.slice();
            _0x5e7d71[_0xeb2bff] = _0x5b5c94;
            const _0x3a3668 = { videos: _0x5e7d71 },
              _0x191f45 = Number(_0x56ad5a.mainVideoIndex),
              _0x314dfa = Number.isFinite(_0x191f45) ? Math.max(0, Math.trunc(_0x191f45)) : 0;
            if (_0xeb2bff === _0x314dfa) {
              if (!String(_0x56ad5a.thumbUrl || '').trim() && _0x40bece) _0x3a3668.thumbUrl = _0x40bece;
            }
            _0x4cc8fc.updateNodeData(_0x168bf8, _0x3a3668);
          }
        })();
      }
      {
        const _0x5ea1f5 = this.nodeId,
          _0x27b408 = ++this._metaFetchToken;
        (async () => {
          for (let _0x3dc44f = 0; _0x3dc44f < _0x5a3034.length; _0x3dc44f++) {
            if (_0x27b408 !== this._metaFetchToken) return;
            const _0x51bbbe = _0x4cc8fc.getState().nodes?.[_0x5ea1f5];
            if (!_0x51bbbe) return;
            const _0x3bd2ac = Array.isArray(_0x51bbbe.videos) ? _0x51bbbe.videos : [],
              _0x14296a = _0x3bd2ac[_0x3dc44f];
            if (!_0x14296a || typeof _0x14296a !== 'object') continue;
            const _0x539059 = Number(_0x14296a.videoWidth || 0),
              _0x4e8239 = Number(_0x14296a.videoHeight || 0);
            if (_0x539059 > 0 && _0x4e8239 > 0) continue;
            const _0x5bbaf5 = this._resolveVideoMetaSrcFromVideoData(_0x14296a);
            if (!_0x5bbaf5) continue;
            let _0x5bace8 = null;
            try {
              _0x5bace8 = await _0x285cdc.fetchVideoMetaFromServer(_0x5bbaf5);
            } catch {
              _0x5bace8 = null;
            }
            if (_0x27b408 !== this._metaFetchToken) return;
            if (!_0x5bace8 || _0x5bace8.success !== true) continue;
            const _0x5dc829 = Math.round(Number(_0x5bace8.width) || 0),
              _0x5d6d4d = Math.round(Number(_0x5bace8.height) || 0),
              _0x4d6800 = Number(_0x5bace8.duration);
            if (!(_0x5dc829 > 0 && _0x5d6d4d > 0)) continue;
            const _0x48b3e5 = _0x4cc8fc.getState().nodes?.[_0x5ea1f5];
            if (!_0x48b3e5) return;
            const _0x748608 = Array.isArray(_0x48b3e5.videos) ? _0x48b3e5.videos : [],
              _0x24a53b = _0x748608[_0x3dc44f];
            if (!_0x24a53b || typeof _0x24a53b !== 'object') continue;
            const _0x53d070 = Number(_0x24a53b.videoWidth || 0),
              _0x1374d8 = Number(_0x24a53b.videoHeight || 0);
            if (_0x53d070 > 0 && _0x1374d8 > 0) continue;
            const _0x17a4e1 = { ..._0x24a53b, videoWidth: _0x5dc829, videoHeight: _0x5d6d4d };
            Number.isFinite(_0x4d6800) &&
              _0x4d6800 > 0 &&
              !(Number(_0x17a4e1.duration) > 0) &&
              (_0x17a4e1.duration = _0x4d6800);
            const _0x4f2d51 = _0x748608.slice();
            _0x4f2d51[_0x3dc44f] = _0x17a4e1;
            const _0x54e008 = { videos: _0x4f2d51 },
              _0x3af25d = Number(_0x48b3e5.mainVideoIndex),
              _0x20f77c = Number.isFinite(_0x3af25d) ? Math.max(0, Math.trunc(_0x3af25d)) : 0;
            if (_0x3dc44f === _0x20f77c) {
              ((_0x54e008.videoWidth = _0x5dc829),
                (_0x54e008.videoHeight = _0x5d6d4d),
                (_0x54e008.selectedVideoWidth = _0x5dc829),
                (_0x54e008.selectedVideoHeight = _0x5d6d4d));
              if (Number.isFinite(_0x4d6800) && _0x4d6800 > 0) _0x54e008.videoDuration = _0x4d6800;
            }
            _0x4cc8fc.updateNodeData(_0x5ea1f5, _0x54e008);
          }
        })();
      }
    }
    ['_finalizeVideoSuccessSideEffects'](_0x228fe7, _0x3e4c1) {
      (this._scheduleDreaminaResultEnrichment(_0x228fe7),
        this._dispatchGenerationHistoryVideos(_0x228fe7, _0x3e4c1));
      const _0x441e18 = _0x228fe7.find((_0x5b2996) => _0x5b2996?.saveError)?.saveError;
      _0x441e18 &&
        window.showToast?.(videoTaskText('toasts.localSaveFailed', { error: _0x441e18 }), 'warning');
    }
    ['_finalizeDreaminaSuccessResult'](_0x354a36, _0x1a59ec, _0x362b83 = null, _0xf62df1 = {}) {
      const _0x4fa8af = this._applyDreaminaSuccessResult(_0x354a36, _0x1a59ec, _0x362b83, {
          writeStore: _0xf62df1.writeStore !== false,
          returnPatch: _0xf62df1.returnPatch === true,
        }),
        _0x3e9259 = Array.isArray(_0x4fa8af) ? _0x4fa8af : _0x4fa8af?.videos || [];
      return (
        this._finalizeVideoSuccessSideEffects(_0x3e9259, _0x1a59ec),
        _0xf62df1.returnPatch === true
          ? { ...(_0x4fa8af && !Array.isArray(_0x4fa8af) ? _0x4fa8af : {}), videos: _0x3e9259 }
          : _0x3e9259
      );
    }
    ['_dispatchGenerationHistoryVideos'](_0x2dbcdb, _0x1f31e9) {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
      const _0x3eafd2 = Array.isArray(_0x2dbcdb)
        ? _0x2dbcdb.filter((_0x4f6c12) => _0x4f6c12 && typeof _0x4f6c12 === 'object' && !_0x4f6c12.error)
        : [];
      if (_0x3eafd2.length === 0) return;
      const _0x43587a = _0x4cc8fc.getState().nodes?.[this.nodeId] || this._data || {};
      try {
        window.dispatchEvent(
          new CustomEvent(GENERATION_HISTORY_EVENT, {
            detail: {
              kind: 'video',
              sourceNodeId: this.nodeId,
              nodeData: _0x43587a,
              videos: _0x3eafd2,
              startedAt: _0x1f31e9,
              createdAt: Date.now(),
            },
          }),
        );
      } catch {}
    }
    async ['_maybeResumeDreaminaTaskImpl']() {
      if (this._videoSubmitInFlight === true) return;
      const _0x2a7f64 = _0x336be9().nodes?.[this.nodeId] || this._data || {};
      if (!this._isDreaminaVideoNode(_0x2a7f64)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (!this._isDreaminaRecoverableRunningTask(_0x2a7f64)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      const _0x47de58 = String(_0x2a7f64?.dreaminaSubmitId || '').trim();
      if (!_0x47de58) {
        this._stopDreaminaRecovery(false);
        return;
      }
      const _0xc9a850 = String(this._dreaminaActiveSubmitId || '').trim();
      if (
        this._isGenerating &&
        _0x2a7f64?.dreaminaTaskRecovering !== true &&
        _0xc9a850 &&
        _0xc9a850 === _0x47de58 &&
        !this._isStaleActiveDreaminaTask(_0x2a7f64)
      )
        return;
      if (this._dreaminaResumeSubmitId === _0x47de58) return;
      this._stopDreaminaRecovery(false);
      const _0x2da7af = Number(
        _0x2a7f64?.dreaminaTaskStartedAt || _0x2a7f64?.generationStartTime || Date.now(),
      );
      ((this._dreaminaResumeSubmitId = _0x47de58), (this._dreaminaActiveSubmitId = _0x47de58));
      const _0x3143bc = (async () => {
        let _0x85e926 = null;
        try {
          ((_0x85e926 = new AbortController()),
            (this._dreaminaResumeAbortController = _0x85e926),
            (this._isGenerating = true),
            this._setGenerateButtonBusyUi({ cancellable: false }),
            _0x55f9d6(this.previewEl));
          const _0xf099b9 = resolveDreaminaStyleVideoProvider(_0x2a7f64?.model, _0x2a7f64?.provider),
            _0x321462 = await resumeTask(
              {
                sourceNodeId: this.nodeId,
                targetNodeId: this.nodeId,
                trigger: 'node',
                taskType: 'video-generation',
                provider: _0xf099b9 || 'dreamina',
                adapterType: _0xf099b9 === 'dreamina' ? 'localRuntime' : 'modelApi',
                modelId: _0x2a7f64?.model || '',
                executionId: (_0xf099b9 || 'dreamina') + '.video.cli',
                payload: {
                  ..._0x2a7f64,
                  provider: _0xf099b9 || _0x2a7f64?.provider || 'dreamina',
                  model:
                    _0xf099b9 === 'apimart'
                      ? _0x2a7f64?.model || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL
                      : _0x2a7f64?.model || '',
                },
                taskId: _0x47de58,
                cancellable: false,
                resumable: true,
                startBuilder: () => ({
                  ...this._buildDreaminaTaskPatch(
                    this._buildDreaminaPendingSnapshot({
                      submitId: _0x47de58,
                      phase: 'generating',
                      label:
                        String(_0x2a7f64?.dreaminaTaskLabel || '').trim() || videoTaskText('task.generating'),
                      raw: _0x2a7f64?.dreaminaTaskLastRaw || {},
                    }),
                    { recovering: true, startedAt: _0x2da7af },
                  ),
                }),
                onTaskStart: () => {
                  this._persistDreaminaResumeCache();
                },
                poll: async ({ payload: _0x534314 }) => {
                  if (_0xf099b9 && _0xf099b9 !== 'dreamina')
                    return _0x285cdc.resumeAsyncVideoTask(_0x47de58, _0x534314, { signal: _0x85e926.signal });
                  return _0x285cdc.resumeDreaminaVideoTask(_0x47de58, {
                    signal: _0x85e926.signal,
                    intervalMs: _0x297b39,
                    maxWaitMs: _0x52a04a,
                    onProgress: async (_0x37d507) => {
                      if (_0x85e926.signal.aborted) return;
                      this._applyDreaminaTaskSnapshot(_0x37d507, { recovering: true, startedAt: _0x2da7af });
                    },
                  });
                },
                resultBuilder: async (_0x545172, _0x41e570) => {
                  const _0x365407 = _0x545172?.dreaminaSnapshot || null,
                    _0x4cf250 = this._applyDreaminaSuccessResult(_0x545172, _0x41e570.startedAt, _0x365407, {
                      writeStore: false,
                      returnPatch: true,
                    });
                  return _0x4cf250?.patch || {};
                },
                failureBuilder: (_0x218569, _0x44a50a) => {
                  if (this._isDreaminaPollTimeoutError(_0x218569)) {
                    const _0x2bd60e = this._buildDreaminaBackgroundPendingSnapshot(_0x47de58);
                    return Object.assign(
                      {
                        isGenerating: true,
                        jobStatus: 'running',
                        jobError: null,
                        generationDuration: Date.now() - _0x44a50a.startedAt,
                      },
                      this._buildDreaminaTaskPatch(_0x2bd60e, {
                        recovering: false,
                        startedAt: _0x44a50a.startedAt,
                      }),
                    );
                  }
                  const _0x24ed74 = _0x218569?.dreaminaSnapshot || null,
                    _0x581b20 =
                      _0x218569?.message ||
                      _0x24ed74?.failReason ||
                      _0x24ed74?.label ||
                      videoTaskText('task.queryFailed');
                  return Object.assign(
                    buildVideoGenerationFailurePatch({ error: _0x581b20, startedAt: _0x44a50a.startedAt }),
                    _0x24ed74
                      ? this._buildDreaminaTaskPatch(_0x24ed74, {
                          recovering: false,
                          startedAt: _0x44a50a.startedAt,
                        })
                      : this._buildDreaminaTaskPatch(
                          this._buildDreaminaFailedSnapshot(_0x47de58, _0x581b20),
                          { recovering: false, startedAt: _0x44a50a.startedAt },
                        ),
                  );
                },
                cancelledBuilder: (_0xefe263) =>
                  Object.assign(
                    { generationDuration: Date.now() - _0xefe263.startedAt },
                    this._buildDreaminaTaskPatch(
                      this._buildDreaminaPendingSnapshot({
                        submitId: _0x47de58,
                        phase: 'generating',
                        label:
                          String(_0x2a7f64?.dreaminaTaskLabel || '').trim() ||
                          videoTaskText('task.generating'),
                        raw: _0x2a7f64?.dreaminaTaskLastRaw || {},
                      }),
                      { recovering: false, startedAt: _0xefe263.startedAt },
                    ),
                  ),
                parseError: (_0x514729) => _0x514729?.message || videoTaskText('task.queryFailed'),
              },
              { store: _0x4cc8fc, startedAt: _0x2da7af, abortController: _0x85e926 },
            );
          if (_0x321462.status === 'pending') {
            this._persistDreaminaResumeCache();
            return;
          }
          if (_0x321462.status === 'success') {
            const _0x5cd55e = normalizeVideoGenerationResult(_0x321462.result).items;
            this._finalizeVideoSuccessSideEffects(_0x5cd55e, _0x2da7af);
          }
          if (_0x321462.status === 'failed' && this._isDreaminaPollTimeoutError(_0x321462.error))
            this._showDreaminaBackgroundQueueingToast(_0x47de58);
          else _0x321462.status === 'failed' && (this._dreaminaActiveSubmitId = '');
          this._persistDreaminaResumeCache();
        } catch (_0x2137d1) {
          if (
            _0x85e926?.signal?.aborted ||
            _0x2137d1?.message === 'CANCELLED' ||
            _0x2137d1?.name === 'AbortError'
          )
            return;
          const _0x294d43 = _0x2137d1?.message || videoTaskText('task.queryFailed'),
            _0x1438ed = this._buildDreaminaFailedSnapshot(_0x47de58, _0x294d43);
          (_0x4cc8fc.updateNodeData(
            this.nodeId,
            Object.assign(
              buildVideoGenerationFailurePatch({ error: _0x294d43, startedAt: _0x2da7af }),
              this._buildDreaminaTaskPatch(_0x1438ed, { recovering: false, startedAt: _0x2da7af }),
            ),
          ),
            this._persistDreaminaResumeCache());
        } finally {
          _0x85e926 &&
            this._dreaminaResumeAbortController === _0x85e926 &&
            (this._dreaminaResumeAbortController = null);
          this._dreaminaResumeSubmitId === _0x47de58 && (this._dreaminaResumeSubmitId = '');
          this._dreaminaResumePromise = null;
          const _0x5054b6 = this._syncLocalTaskNodeData(),
            _0x540c11 = shouldShowGenerationBusyUi(_0x5054b6) || this._shouldKeepDreaminaLoading(_0x5054b6);
          ((this._isGenerating = _0x540c11),
            !_0x540c11 && (this._dreaminaActiveSubmitId = ''),
            _0x540c11
              ? this._updateSubmitButtonState?.()
              : (this._resetGenerateButtonIdleUi({ cancellable: false }),
                _0x11f58d(this.previewEl),
                this._updateSubmitButtonState?.()));
        }
      })();
      this._dreaminaResumePromise = _0x3143bc;
    }
    async ['_maybeResumeRunningHubTaskImpl']() {
      const _0x284b49 = _0x336be9().nodes?.[this.nodeId] || this._data || {};
      if (!this._isRunninghubWorkflowModel(_0x284b49?.model, _0x284b49?.provider)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (!this._isRunningHubRecoverableRunningTask(_0x284b49)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      const _0x3454f9 = String(_0x284b49?.rhTaskId || '').trim();
      if (!_0x3454f9) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (this._rhResumeTaskId === _0x3454f9 && this._rhResumePromise) return;
      this._stopRunningHubRecovery(false);
      const _0x58c156 = Number(_0x284b49?.rhTaskStartedAt || _0x284b49?.generationStartTime || Date.now()),
        _0x2babf4 = _0x284b49?.rhTaskUseOpenapiQuery === true;
      this._rhResumeTaskId = _0x3454f9;
      const _0x4ed7c5 = (async () => {
        let _0x245d03 = null;
        try {
          const _0x47043d = await this._buildPayload();
          if (!_0x47043d) return;
          ((_0x245d03 = new AbortController()),
            (this._rhResumeAbortController = _0x245d03),
            (this._rhAbortController = _0x245d03),
            (this._rhTaskId = _0x3454f9),
            (this._rhApiKey = String(_0x47043d?.apiKey || '').trim() || this._rhApiKey || null),
            (this._rhCancelRequested = false),
            (this._rhRemoteCancelSent = false),
            (this._isGenerating = true),
            this._setGenerateButtonBusyUi({ cancellable: true }),
            _0x55f9d6(this.previewEl));
          const _0x5a4244 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'video-generation',
              provider: _0x47043d.provider || _0x284b49?.provider || 'runninghubwf',
              adapterType: 'workflow',
              modelId: _0x47043d.model || _0x284b49?.model || '',
              executionId: 'runninghub.video.' + (_0x47043d.model || _0x284b49?.model || 'workflow'),
              payload: _0x47043d,
              taskId: _0x3454f9,
              cancellable: true,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () => ({
                rhStatusMessage: null,
                rhStatusCode: null,
                rhTaskUseOpenapiQuery: _0x2babf4,
              }),
              onTaskStart: () => {
                this._persistRunningHubResumeCache();
              },
              poll: async () =>
                _0x285cdc.resumeRunningHubVideoTask(_0x3454f9, _0x47043d, {
                  signal: _0x245d03.signal,
                  useOpenapiQuery: _0x2babf4,
                }),
              resultBuilder: async (_0x129145, _0x7be6d1) => {
                const _0x45c323 = this._applyDreaminaSuccessResult(_0x129145, _0x7be6d1.startedAt, null, {
                  writeStore: false,
                  returnPatch: true,
                });
                return {
                  ...(_0x45c323?.patch || {}),
                  rhStatusMessage: null,
                  rhStatusCode: null,
                  ...this._buildRunningHubTaskPatch({
                    taskId: _0x3454f9,
                    status: 'success',
                    startedAt: _0x7be6d1.startedAt,
                    recovering: false,
                    useOpenapiQuery: _0x2babf4,
                  }),
                };
              },
              failureBuilder: (_0x4004bb, _0x295b9e) => ({
                ...buildVideoGenerationFailurePatch({
                  error: _0x4004bb?.message || videoTaskText('task.generationFailed'),
                  startedAt: _0x295b9e.startedAt,
                  duration: Date.now() - _0x295b9e.startedAt,
                }),
                rhStatusMessage: _0x4004bb?.message || videoTaskText('task.generationFailed'),
                rhStatusCode: Number.isFinite(Number(_0x4004bb?.code)) ? Number(_0x4004bb.code) : null,
                ...this._buildRunningHubTaskPatch({
                  taskId: _0x3454f9,
                  status: 'failed',
                  startedAt: _0x295b9e.startedAt,
                  recovering: false,
                  useOpenapiQuery: _0x2babf4,
                }),
              }),
              cancelledBuilder: (_0x556f57) => ({
                videos: [],
                videoUrl: '',
                localPath: '',
                generationDuration: Date.now() - _0x556f57.startedAt,
                rhStatusMessage: videoTaskText('cancel.interrupted'),
                rhStatusCode: null,
                ...this._buildRunningHubTaskPatch({
                  taskId: _0x3454f9,
                  status: 'cancelled',
                  startedAt: _0x556f57.startedAt,
                  recovering: false,
                  useOpenapiQuery: _0x2babf4,
                }),
              }),
              parseError: (_0x29cd1d) => _0x29cd1d?.message || videoTaskText('task.generationFailed'),
            },
            { store: _0x4cc8fc, startedAt: _0x58c156, abortController: _0x245d03 },
          );
          if (_0x5a4244.status === 'pending') {
            this._persistRunningHubResumeCache();
            return;
          }
          if (_0x5a4244.status === 'success') {
            const _0x2e84b1 = normalizeVideoGenerationResult(_0x5a4244.result).items;
            this._finalizeVideoSuccessSideEffects(_0x2e84b1, _0x58c156);
          }
          this._persistRunningHubResumeCache();
        } catch (_0x367400) {
          if (
            _0x245d03?.signal?.aborted ||
            _0x367400?.message === 'CANCELLED' ||
            _0x367400?.name === 'AbortError'
          )
            return;
          (_0x4cc8fc.updateNodeData(this.nodeId, {
            generationDuration: Math.max(0, Date.now() - _0x58c156),
            rhStatusMessage: _0x367400?.message || videoTaskText('task.generationFailed'),
            rhStatusCode: Number.isFinite(Number(_0x367400?.code)) ? Number(_0x367400.code) : null,
            ...this._buildRunningHubTaskPatch({
              taskId: _0x3454f9,
              status: 'failed',
              startedAt: _0x58c156,
              recovering: false,
              useOpenapiQuery: _0x2babf4,
            }),
          }),
            this._persistRunningHubResumeCache());
        } finally {
          _0x245d03 && this._rhResumeAbortController === _0x245d03 && (this._rhResumeAbortController = null);
          _0x245d03 && this._rhAbortController === _0x245d03 && (this._rhAbortController = null);
          this._rhResumeTaskId === _0x3454f9 && (this._rhResumeTaskId = '');
          this._rhResumePromise = null;
          const _0x864ada = this._syncLocalTaskNodeData(),
            _0xf68708 = shouldShowGenerationBusyUi(_0x864ada);
          this._isGenerating = _0xf68708;
          if (_0xf68708) this._rhTaskId = String(_0x864ada?.rhTaskId || _0x3454f9 || '').trim();
          else {
            this._rhTaskId = null;
            if (!this._rhCancelRequested) this._rhApiKey = null;
            (this._resetGenerateButtonIdleUi({ cancellable: true }), _0x11f58d(this.previewEl));
          }
          this._updateSubmitButtonState();
        }
      })();
      this._rhResumePromise = _0x4ed7c5;
    }
    async ['_maybeResumeAsyncTaskImpl']() {
      const _0x37aee3 = _0x336be9().nodes?.[this.nodeId] || this._data || {};
      if (this._isGenerating && _0x37aee3?.asyncTaskRecovering !== true) return;
      if (!this._isAsyncRecoverableRunningTask(_0x37aee3)) {
        this._stopAsyncRecovery(false);
        return;
      }
      const _0x47acd9 = String(_0x37aee3?.asyncTaskId || '').trim();
      if (!_0x47acd9) {
        this._stopAsyncRecovery(false);
        return;
      }
      if (this._asyncResumeTaskId === _0x47acd9 && this._asyncResumePromise) return;
      this._stopAsyncRecovery(false);
      const _0xf0bf7e = Number(_0x37aee3?.asyncTaskStartedAt || _0x37aee3?.generationStartTime || Date.now()),
        _0xf7bff6 = this._inferAsyncProviderFromModel(
          _0x37aee3?.model,
          _0x37aee3?.asyncTaskProvider || _0x37aee3?.provider || '',
        );
      this._asyncResumeTaskId = _0x47acd9;
      const _0x168f8e = (async () => {
        let _0x40c64a = null;
        try {
          const _0x289366 = await this._buildResumePayload(_0x37aee3, { providerHint: _0xf7bff6 });
          if (!_0x289366) return;
          ((_0x40c64a = new AbortController()),
            (this._asyncResumeAbortController = _0x40c64a),
            (this._isGenerating = true),
            this._setGenerateButtonBusyUi({ cancellable: false }),
            _0x55f9d6(this.previewEl));
          const _0x2c21e3 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'video-generation',
              provider: _0xf7bff6 || _0x289366.provider || _0x37aee3?.provider || '',
              adapterType: 'modelApi',
              modelId: _0x289366.model || _0x37aee3?.model || '',
              executionId: (_0xf7bff6 || _0x289366.provider || 'model') + '.video.async',
              payload: _0x289366,
              taskId: _0x47acd9,
              async: true,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this._buildAsyncTaskPatch({
                  provider: _0xf7bff6,
                  kind: 'video',
                  taskId: _0x47acd9,
                  status: 'running',
                  startedAt: _0xf0bf7e,
                  recovering: true,
                }),
              onTaskStart: () => {
                this._persistAsyncResumeCache();
              },
              poll: async () =>
                _0x285cdc.resumeAsyncVideoTask(_0x47acd9, _0x289366, { signal: _0x40c64a.signal }),
              resultBuilder: async (_0x3eb2c2, _0x304097) => {
                const _0x4a21b1 = this._applyDreaminaSuccessResult(_0x3eb2c2, _0x304097.startedAt, null, {
                  writeStore: false,
                  returnPatch: true,
                });
                return {
                  ...(_0x4a21b1?.patch || {}),
                  ...this._buildAsyncTaskPatch({
                    provider: _0xf7bff6,
                    kind: 'video',
                    taskId: _0x47acd9,
                    status: 'success',
                    startedAt: _0x304097.startedAt,
                    recovering: false,
                  }),
                };
              },
              failureBuilder: (_0x2d00ce, _0x287334) => ({
                ...buildVideoGenerationFailurePatch({
                  error: _0x2d00ce?.message || videoTaskText('task.generationFailed'),
                  startedAt: _0x287334.startedAt,
                  duration: Math.max(0, Date.now() - _0x287334.startedAt),
                }),
                ...this._buildAsyncTaskPatch({
                  provider: _0xf7bff6,
                  kind: 'video',
                  taskId: _0x47acd9,
                  status: 'failed',
                  startedAt: _0x287334.startedAt,
                  recovering: false,
                }),
              }),
              cancelledBuilder: (_0x484092) => ({
                videos: [],
                videoUrl: '',
                localPath: '',
                generationDuration: Date.now() - _0x484092.startedAt,
                ...this._buildAsyncTaskPatch({
                  provider: _0xf7bff6,
                  kind: 'video',
                  taskId: _0x47acd9,
                  status: 'cancelled',
                  startedAt: _0x484092.startedAt,
                  recovering: false,
                }),
              }),
              parseError: (_0x1ac1b4) => _0x1ac1b4?.message || videoTaskText('task.generationFailed'),
            },
            { store: _0x4cc8fc, startedAt: _0xf0bf7e, abortController: _0x40c64a },
          );
          if (_0x2c21e3.status === 'pending') {
            this._persistAsyncResumeCache();
            return;
          }
          if (_0x2c21e3.status === 'success') {
            const _0xede3a7 = normalizeVideoGenerationResult(_0x2c21e3.result).items;
            this._finalizeVideoSuccessSideEffects(_0xede3a7, _0xf0bf7e);
          }
          this._persistAsyncResumeCache();
        } catch (_0x4c8b5a) {
          if (
            _0x40c64a?.signal?.aborted ||
            _0x4c8b5a?.message === 'CANCELLED' ||
            _0x4c8b5a?.name === 'AbortError'
          )
            return;
          (_0x4cc8fc.updateNodeData(this.nodeId, {
            ...buildVideoGenerationFailurePatch({
              error: _0x4c8b5a?.message || videoTaskText('task.generationFailed'),
              startedAt: _0xf0bf7e,
              duration: Math.max(0, Date.now() - _0xf0bf7e),
            }),
            ...this._buildAsyncTaskPatch({
              provider: _0xf7bff6,
              kind: 'video',
              taskId: _0x47acd9,
              status: 'failed',
              startedAt: _0xf0bf7e,
              recovering: false,
            }),
          }),
            this._persistAsyncResumeCache());
        } finally {
          _0x40c64a &&
            this._asyncResumeAbortController === _0x40c64a &&
            (this._asyncResumeAbortController = null);
          this._asyncResumeTaskId === _0x47acd9 && (this._asyncResumeTaskId = '');
          this._asyncResumePromise = null;
          const _0x285109 = this._syncLocalTaskNodeData(),
            _0x355061 = shouldShowGenerationBusyUi(_0x285109);
          ((this._isGenerating = _0x355061),
            !_0x355061 &&
              (this._resetGenerateButtonIdleUi({ cancellable: false }), _0x11f58d(this.previewEl)),
            this._updateSubmitButtonState());
        }
      })();
      this._asyncResumePromise = _0x168f8e;
    }
    async ['_handleGenerateOrCancelImpl'](_0x49696b = null) {
      const _0x36e7e7 = _0x4cc8fc.getState().nodes?.[this.nodeId] || this._data || {},
        _0x445d51 = this._isRunninghubWorkflowModel(_0x36e7e7?.model, _0x36e7e7?.provider);
      !_0x445d51 && this._dreaminaResumePromise && this._stopDreaminaRecovery(true);
      !_0x445d51 && this._asyncResumePromise && this._stopAsyncRecovery(true);
      if (
        shouldAllowCancel(_0x36e7e7, {
          cancellable: _0x445d51,
          cancelInFlight: this._rhCancelInFlight === true,
        })
      ) {
        await this._cancelRunningHubWorkflowTask();
        return;
      }
      await this._onGenerate(_0x49696b);
    }
    async ['_cancelRunningHubWorkflowTaskImpl']() {
      const _0x5f408f = _0x4cc8fc.getState().nodes?.[this.nodeId] || this._data || {},
        _0xf074e4 = this._rhApiKey || '',
        _0x3bebfb = String(this._rhTaskId || '').trim() || String(_0x5f408f?.rhTaskId || '').trim(),
        _0x7f22df = Date.now(),
        _0x2f0903 = Number(_0x5f408f?.generationStartTime),
        _0x58ffaf =
          _0x5f408f?.generationDuration != null
            ? _0x5f408f.generationDuration
            : Number.isFinite(_0x2f0903) && _0x2f0903 > 0
              ? Math.max(0, _0x7f22df - _0x2f0903)
              : 0;
      this._rhCancelRequested = true;
      this._rhAbortController && !this._rhAbortController.signal.aborted && this._rhAbortController.abort();
      const _0x3e7b86 = !_0xf074e4,
        _0x247014 = !_0x3bebfb;
      try {
        this._rhRemoteCancelSent = !_0x3e7b86 && !_0x247014;
        const _0x2ad5ab = ({ remoteResult: _0x4668c1, remoteError: _0x578866, startedAt: _0x50e3ef }) => {
          const _0x59322b = Number(_0x4668c1?.code),
            _0x24d262 = _0x3e7b86
              ? videoTaskText('cancel.missingApiKey')
              : _0x247014
                ? videoTaskText('cancel.interruptedNoTaskId')
                : '',
            _0x3d6e1f =
              _0x24d262 ||
              (_0x578866
                ? _0x578866.message || videoTaskText('cancel.failed')
                : _0x59322b === 0
                  ? videoTaskText('cancel.success')
                  : _0x59322b === 0x327
                    ? videoTaskText('cancel.taskNotFound')
                    : _0x4668c1?.msg || videoTaskText('cancel.failed'));
          return {
            rhStatusMessage: _0x3d6e1f,
            rhStatusCode: _0x247014 ? 0x32d : Number.isFinite(_0x59322b) ? _0x59322b : null,
            videos: [],
            videoUrl: '',
            localPath: '',
            generationDuration: _0x58ffaf,
            ...this._buildRunningHubTaskPatch({
              taskId: _0x3bebfb,
              status: 'cancelled',
              startedAt: Number(
                _0x50e3ef || _0x5f408f?.rhTaskStartedAt || _0x5f408f?.generationStartTime || 0,
              ),
              recovering: false,
              useOpenapiQuery: _0x5f408f?.rhTaskUseOpenapiQuery === true,
            }),
          };
        };
        (await cancelTask(this.nodeId, {
          store: _0x4cc8fc,
          taskId: _0x3bebfb,
          cancellable: true,
          cancel: ({ taskId: _0x1b3a0e }) => {
            if (!_0xf074e4) throw new Error(videoTaskText('cancel.missingApiKey'));
            return _0x285cdc.cancelRunningHubWorkflowTask({ apiKey: _0xf074e4, taskId: _0x1b3a0e });
          },
          cancelledBuilder: _0x2ad5ab,
          spec: {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'video-generation',
            provider: _0x5f408f?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: _0x5f408f?.model || '',
            executionId: 'runninghub.video.' + (_0x5f408f?.model || 'workflow'),
            payload: _0x5f408f,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: _0x2ad5ab,
          },
        }),
          this._persistRunningHubResumeCache());
      } finally {
        ((this._isGenerating = false),
          (this._rhAbortController = null),
          (this._rhTaskId = null),
          (this._rhApiKey = null),
          (this._rhRemoteCancelSent = false),
          this._stopRunningHubRecovery(true),
          this._resetGenerateButtonIdleUi({ cancellable: true }),
          _0x11f58d(this.previewEl),
          this._updateSubmitButtonState());
      }
    }
    ['_setGenerateButtonBusyUi']({ cancellable: cancellable = false } = {}) {
      if (!this.btnEl) return;
      if (cancellable) {
        const _0x28afb0 = getVideoCancelTooltip();
        setGenerateButtonCancellableUi(this.btnEl, {
          title: _0x28afb0,
          tooltip: _0x28afb0,
          ariaLabel: videoTaskText('controls.cancelGenerateAria'),
          color: 'var(--red)',
          busy: true,
        });
        return;
      }
      const _0x191fb7 = getVideoGenerateTitle();
      setGenerateButtonLoadingUi(this.btnEl, { title: _0x191fb7, disabled: true, ariaLabel: _0x191fb7 });
    }
    ['_resetGenerateButtonIdleUi']({ cancellable: cancellable = false } = {}) {
      if (!this.btnEl) return;
      const _0x216ea2 = getVideoGenerateTitle();
      resetGenerateButtonIdleUi(this.btnEl, _0x216ea2);
      if (cancellable) {
        (this.btnEl.removeAttribute('title'),
          this.btnEl.setAttribute('data-tooltip', getVideoCancelTooltip()));
        return;
      }
      (this.btnEl.removeAttribute('data-tooltip'), (this.btnEl.title = _0x216ea2));
    }
    ['_getPreviewGenerateButtonLoadingOptions']() {
      return createPreviewGenerateButtonCallbacks(this, getVideoGenerateTitle());
    }
    async ['_onGenerateImpl'](_0x133f9f = null, _0x4d1e6b = {}) {
      if (this._isGenerating) return;
      if (_0x4d1e6b?.insertPrompt === true) {
        (insertPresetPromptIntoEditor({
          storeApi: _0x4cc8fc,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          template: _0x133f9f,
          inEdges: _0x4cc8fc.getIncomingEdges(this.nodeId),
          nodes: _0x4cc8fc.getState().nodes || {},
          allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        }),
          this._updateSubmitButtonState?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(_0x133f9f)) {
        const _0x2d467b = await this._buildPayload(_0x133f9f);
        if (!_0x2d467b) return;
        previewPresetPromptInEditor({
          storeApi: _0x4cc8fc,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          promptText: _0x2d467b.prompt,
        });
        return;
      }
      if (isPreviewModeEnabled()) {
        !isPreviewNodeLoading(this.nodeId) &&
          startPreviewNodeLoading(
            this.nodeId,
            this.previewEl,
            this._getPreviewGenerateButtonLoadingOptions(),
          );
        return;
      }
      if (this._videoSubmitInFlight === true) return;
      const _0x33f6f3 = _0x4cc8fc.getState().nodes?.[this.nodeId] || this._data || {},
        _0x30885d =
          typeof this._shouldKeepDreaminaLoading === 'function' &&
          typeof this._isDreaminaVideoNode === 'function'
            ? this._shouldKeepDreaminaLoading(_0x33f6f3)
            : false;
      if (shouldShowGenerationBusyUi(_0x33f6f3) || _0x30885d) return;
      this._videoSubmitInFlight = true;
      try {
        let storyReferenceGuard;
        try {
          storyReferenceGuard = createStoryReferenceVideoGuard({ store: _0x4cc8fc, nodeId: this.nodeId,
            resolveExecution: resolveModelExecution, getPromptHtml: () => this.promptEl?.innerHTML });
          if (storyReferenceGuard && _0x133f9f != null) throw new Error('首帧任务不接受预设覆盖，请使用原节点普通生成按钮');
          if (storyReferenceGuard && !window.confirm(storyReferenceGuard.confirmation)) return;
        } catch (error) {
          window.showToast?.(error.message, 'error'); return;
        }
        const _0x457103 = String(this._data?.model || '').trim(),
          _0x51db0b = String(this._data?.provider || '').trim();
        await _0x9f6bfe(_0x457103, _0x51db0b);
        if (!this._guardVipSelection(this._data?.model || '', _0x51db0b)) return;
        if (typeof window.ensureSubscriptionInstallId === 'function')
          try {
            await window.ensureSubscriptionInstallId();
          } catch {}
        const _0x5bd3a7 = await this._buildPayload(_0x133f9f, { randomizeSubmitParams: true });
        if (!_0x5bd3a7) return;
        try { storyReferenceGuard?.assertCurrent(_0x5bd3a7); }
        catch (error) { window.showToast?.(error.message, 'error'); return; }
        const _0x4fdef3 = String(_0x5bd3a7.model || '').trim();
        if (_0x212b55(_0x4fdef3, _0x5bd3a7.provider) && !String(_0x5bd3a7.installId || '').trim()) {
          window.showToast?.(videoTaskText('toasts.missingInstallId'), 'error');
          return;
        }
        const _0x30ee23 = this._isRunninghubWorkflowModel(_0x5bd3a7.model, _0x5bd3a7.provider),
          _0x223447 = this._isDreaminaVideoNode(_0x5bd3a7),
          _0x4a6399 = String(_0x5bd3a7?.provider || this._data?.provider || '')
            .trim()
            .toLowerCase(),
          _0x4b3bb6 = !_0x30ee23 && !_0x223447;
        _0x223447 && this._stopDreaminaRecovery(true);
        _0x30ee23 && this._stopRunningHubRecovery(true);
        _0x4b3bb6 && this._stopAsyncRecovery(true);
        this._rhGenToken = (this._rhGenToken || 0) + 1;
        const _0x1739e8 = this._rhGenToken;
        ((this._rhCancelRequested = false),
          (this._rhRemoteCancelSent = false),
          (this._rhApiKey = _0x30ee23 ? _0x5bd3a7.apiKey : null),
          (this._rhTaskId = null),
          (this._rhAbortController = _0x30ee23 ? new AbortController() : null),
          (this._isGenerating = true),
          this._setGenerateButtonBusyUi({ cancellable: _0x30ee23 }),
          _0x55f9d6(this.previewEl));
        const _0x55c726 = Date.now(),
          _0x2b1ef2 = {
            ...buildGenerationStartPatch({ startedAt: _0x55c726 }),
            generationStartTime: _0x55c726,
            generationDuration: null,
            rhStatusMessage: null,
            rhStatusCode: null,
          };
        _0x223447 &&
          (Object.assign(_0x2b1ef2, {
            dreaminaSubmitId: '',
            dreaminaTaskStatus: 'pending',
            dreaminaTaskPhase: 'generating',
            dreaminaTaskLabel: videoTaskText('task.submitting'),
            dreaminaTaskStartedAt: _0x55c726,
            dreaminaTaskLastCheckedAt: null,
            dreaminaTaskLastRaw: {},
            dreaminaTaskRecovering: false,
          }),
          Object.assign(_0x2b1ef2, {
            ...this._buildRunningHubTaskPatch({
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
              useOpenapiQuery: false,
            }),
            ...this._buildAsyncTaskPatch({
              provider: '',
              kind: 'video',
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
            }),
          }));
        _0x30ee23 &&
          (Object.assign(_0x2b1ef2, {
            rhTaskId: '',
            rhTaskStatus: 'pending',
            rhTaskStartedAt: _0x55c726,
            rhTaskRecovering: false,
            rhTaskUseOpenapiQuery: false,
          }),
          Object.assign(_0x2b1ef2, {
            dreaminaSubmitId: '',
            dreaminaTaskStatus: 'idle',
            dreaminaTaskPhase: 'done',
            dreaminaTaskLabel: '',
            dreaminaTaskStartedAt: 0,
            dreaminaTaskLastCheckedAt: null,
            dreaminaTaskLastRaw: {},
            dreaminaTaskRecovering: false,
            ...this._buildAsyncTaskPatch({
              provider: '',
              kind: 'video',
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
            }),
          }));
        _0x4b3bb6 &&
          (Object.assign(
            _0x2b1ef2,
            this._buildAsyncTaskPatch({
              provider: _0x4a6399,
              kind: 'video',
              taskId: '',
              status: 'pending',
              startedAt: _0x55c726,
              recovering: false,
            }),
          ),
          Object.assign(_0x2b1ef2, {
            ...this._buildRunningHubTaskPatch({
              taskId: '',
              status: 'idle',
              startedAt: 0,
              recovering: false,
              useOpenapiQuery: false,
            }),
            dreaminaSubmitId: '',
            dreaminaTaskStatus: 'idle',
            dreaminaTaskPhase: 'done',
            dreaminaTaskLabel: '',
            dreaminaTaskStartedAt: 0,
            dreaminaTaskLastCheckedAt: null,
            dreaminaTaskLastRaw: {},
            dreaminaTaskRecovering: false,
          }));
        try {
          const _0xc986d1 = await submitTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'video-generation',
              provider: _0x5bd3a7.provider || _0x4a6399 || this._data?.provider || '',
              adapterType: _0x30ee23 ? 'workflow' : 'modelApi',
              modelId: _0x5bd3a7.model || this._data?.model || '',
              executionId:
                'video.' +
                (_0x5bd3a7.provider || _0x4a6399 || 'modelApi') +
                '.' +
                (_0x5bd3a7.model || 'default'),
              payload: _0x5bd3a7,
              cancellable: _0x30ee23,
              resumable: _0x223447 || _0x30ee23 || _0x4b3bb6,
              async: _0x4b3bb6,
              startBuilder: () => _0x2b1ef2,
              onTaskStart: () => {
                this._syncLocalTaskNodeData();
                if (_0x223447) this._persistDreaminaResumeCache();
                if (_0x30ee23) this._persistRunningHubResumeCache();
                if (_0x4b3bb6) this._persistAsyncResumeCache();
              },
              submit: async (_0x13d984, _0x2cdbc0 = {}) =>
                _0x285cdc.generateVideo((storyReferenceGuard?.beforeSend(_0x5bd3a7), _0x5bd3a7), {
                  ...(_0x30ee23 ? { signal: this._rhAbortController.signal } : {}),
                  ...(_0x223447 ? { maxWaitMs: _0x4fb3f5 } : {}),
                  onTaskMeta: ({ taskId: _0x5ebf88, useOpenapiQuery: _0x17b67a, provider: _0x272d83 }) => {
                    if (_0x1739e8 !== this._rhGenToken) return;
                    const _0x303ac2 = String(_0x5ebf88 || '').trim();
                    if (!_0x303ac2) return;
                    if (_0x30ee23) {
                      ((this._rhTaskId = _0x303ac2),
                        _0x2cdbc0.onTaskId?.(_0x303ac2),
                        _0x4cc8fc.updateNodeData(this.nodeId, {
                          rhStatusMessage: null,
                          rhStatusCode: null,
                          rhTaskUseOpenapiQuery: _0x17b67a === true,
                        }),
                        this._syncLocalTaskNodeData(),
                        this._persistRunningHubResumeCache());
                      return;
                    }
                    if (_0x223447) {
                      this._dreaminaActiveSubmitId = _0x303ac2;
                      const _0x567b4d = this._buildDreaminaPendingSnapshot({
                        submitId: _0x303ac2,
                        phase: 'generating',
                        label: videoTaskText('task.generating'),
                      });
                      (this._applyDreaminaTaskSnapshot(_0x567b4d, {
                        recovering: false,
                        startedAt: _0x55c726,
                      }),
                        _0x2cdbc0.onTaskId?.(_0x303ac2));
                      return;
                    }
                    _0x4b3bb6 &&
                      (_0x2cdbc0.onTaskId?.(_0x303ac2),
                      _0x4cc8fc.updateNodeData(this.nodeId, {
                        asyncTaskProvider: String(_0x272d83 || _0x4a6399 || this._data?.provider || '')
                          .trim()
                          .toLowerCase(),
                        asyncTaskKind: 'video',
                      }),
                      this._syncLocalTaskNodeData(),
                      this._persistAsyncResumeCache());
                  },
                  onTaskId: (_0x39ff8e) => {
                    if (_0x1739e8 !== this._rhGenToken) return;
                    const _0x52353c = String(_0x39ff8e || '').trim();
                    if (!_0x52353c) return;
                    if (_0x223447) {
                      this._dreaminaActiveSubmitId = _0x52353c;
                      const _0x257177 = this._buildDreaminaPendingSnapshot({
                        submitId: _0x52353c,
                        phase: 'generating',
                        label: videoTaskText('task.generating'),
                      });
                      (this._applyDreaminaTaskSnapshot(_0x257177, {
                        recovering: false,
                        startedAt: _0x55c726,
                      }),
                        _0x2cdbc0.onTaskId?.(_0x52353c));
                      return;
                    }
                    if (_0x30ee23) {
                      ((this._rhTaskId = _0x52353c),
                        _0x2cdbc0.onTaskId?.(_0x52353c),
                        _0x4cc8fc.updateNodeData(this.nodeId, {
                          rhStatusMessage: null,
                          rhStatusCode: null,
                          rhTaskUseOpenapiQuery:
                            _0x4cc8fc.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
                        }),
                        this._syncLocalTaskNodeData(),
                        this._persistRunningHubResumeCache());
                      const _0x2f098b = this._rhApiKey || '';
                      this._rhCancelRequested &&
                        !this._rhRemoteCancelSent &&
                        _0x2f098b &&
                        _0x52353c &&
                        ((this._rhRemoteCancelSent = true),
                        (async () => {
                          if (_0x1739e8 !== this._rhGenToken) return;
                          const _0x4bb28a = ({ remoteResult: _0x13163a, remoteError: _0x53c826 }) => {
                            const _0x292da1 = Number(_0x13163a?.code),
                              _0xac91c1 = _0x53c826
                                ? _0x53c826.message || videoTaskText('cancel.failed')
                                : _0x292da1 === 0
                                  ? videoTaskText('cancel.success')
                                  : _0x292da1 === 0x327
                                    ? videoTaskText('cancel.taskNotFound')
                                    : _0x13163a?.msg || videoTaskText('cancel.failed');
                            return {
                              rhStatusMessage: _0xac91c1,
                              rhStatusCode: Number.isFinite(_0x292da1) ? _0x292da1 : null,
                              videos: [],
                              videoUrl: '',
                              localPath: '',
                              ...this._buildRunningHubTaskPatch({
                                taskId: _0x52353c,
                                status: 'cancelled',
                                startedAt: _0x55c726,
                                recovering: false,
                                useOpenapiQuery:
                                  _0x4cc8fc.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
                              }),
                            };
                          };
                          await cancelTask(this.nodeId, {
                            store: _0x4cc8fc,
                            taskId: _0x52353c,
                            cancellable: true,
                            cancel: ({ taskId: _0x3673b2 }) =>
                              _0x285cdc.cancelRunningHubWorkflowTask({
                                apiKey: _0x2f098b,
                                taskId: _0x3673b2,
                              }),
                            cancelledBuilder: _0x4bb28a,
                            spec: {
                              sourceNodeId: this.nodeId,
                              targetNodeId: this.nodeId,
                              trigger: 'node',
                              taskType: 'video-generation',
                              provider: 'runninghubwf',
                              adapterType: 'workflow',
                              modelId: _0x5bd3a7?.model || '',
                              executionId: 'runninghub.video.' + (_0x5bd3a7?.model || 'workflow'),
                              payload: _0x5bd3a7,
                              cancellable: true,
                              resumable: true,
                              resultBuilder: () => ({}),
                              cancelledBuilder: _0x4bb28a,
                            },
                          });
                          if (_0x1739e8 !== this._rhGenToken) return;
                          this._persistRunningHubResumeCache();
                        })());
                      return;
                    }
                    if (_0x4b3bb6) {
                      const _0x3185b1 = _0x4cc8fc.getState().nodes?.[this.nodeId] || {};
                      (_0x2cdbc0.onTaskId?.(_0x52353c),
                        _0x4cc8fc.updateNodeData(this.nodeId, {
                          asyncTaskProvider: String(
                            _0x3185b1?.asyncTaskProvider || _0x4a6399 || this._data?.provider || '',
                          )
                            .trim()
                            .toLowerCase(),
                          asyncTaskKind: 'video',
                        }),
                        this._syncLocalTaskNodeData(),
                        this._persistAsyncResumeCache());
                    }
                  },
                  onProgress: _0x223447
                    ? async (_0x14eb05) => {
                        if (_0x1739e8 !== this._rhGenToken) return;
                        this._applyDreaminaTaskSnapshot(_0x14eb05, {
                          recovering: false,
                          startedAt: _0x55c726,
                        });
                      }
                    : undefined,
                }),
              cancel: _0x30ee23
                ? async ({ taskId: _0x1c302a }) => {
                    const _0xa5cb0d = this._rhApiKey || _0x5bd3a7.apiKey || '',
                      _0x2deb6c = String(_0x1c302a || '').trim();
                    if (!_0xa5cb0d || !_0x2deb6c) return null;
                    return _0x285cdc.cancelRunningHubWorkflowTask({ apiKey: _0xa5cb0d, taskId: _0x2deb6c });
                  }
                : undefined,
              resultBuilder: (_0x19e28b, _0x14eaf1) => {
                const _0xde4366 = this._applyDreaminaSuccessResult(_0x19e28b, _0x14eaf1.startedAt, null, {
                    writeStore: false,
                    returnPatch: true,
                  }),
                  _0x206eb3 = { ...(_0xde4366?.patch || {}) };
                if (_0x30ee23) {
                  const _0x116a6c = _0x4cc8fc.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    _0x206eb3,
                    { rhStatusMessage: null, rhStatusCode: null },
                    this._buildRunningHubTaskPatch({
                      taskId: String(this._rhTaskId || '').trim() || String(_0x116a6c?.rhTaskId || '').trim(),
                      status: 'success',
                      startedAt: _0x14eaf1.startedAt,
                      recovering: false,
                      useOpenapiQuery: _0x116a6c?.rhTaskUseOpenapiQuery === true,
                    }),
                  );
                } else {
                  if (_0x4b3bb6) {
                    const _0x518936 = _0x4cc8fc.getState().nodes?.[this.nodeId] || {};
                    Object.assign(
                      _0x206eb3,
                      this._buildAsyncTaskPatch({
                        provider: String(_0x518936?.asyncTaskProvider || _0x4a6399 || '').trim(),
                        kind: 'video',
                        taskId: String(_0x518936?.asyncTaskId || '').trim(),
                        status: 'success',
                        startedAt: _0x14eaf1.startedAt,
                        recovering: false,
                      }),
                    );
                  }
                }
                return _0x206eb3;
              },
              failureBuilder: (_0x4a1fbf, _0x3f1df1) => {
                const _0x1fb5af = _0x4a1fbf?.message || videoTaskText('task.generationFailed');
                if (_0x223447 && this._isDreaminaPollTimeoutError(_0x4a1fbf)) {
                  const _0xf0ccc1 = _0x4cc8fc.getState().nodes?.[this.nodeId] || {},
                    _0xfbd4ca = String(_0xf0ccc1?.dreaminaSubmitId || '').trim(),
                    _0x1fa12a = this._buildDreaminaBackgroundPendingSnapshot(_0xfbd4ca);
                  return Object.assign(
                    {
                      isGenerating: true,
                      jobStatus: 'running',
                      jobError: null,
                      generationDuration: Date.now() - _0x3f1df1.startedAt,
                    },
                    this._buildDreaminaTaskPatch(_0x1fa12a, {
                      recovering: false,
                      startedAt: Number(
                        _0xf0ccc1?.dreaminaTaskStartedAt ||
                          _0xf0ccc1?.generationStartTime ||
                          _0x3f1df1.startedAt,
                      ),
                    }),
                  );
                }
                const _0x54d701 =
                  String(_0x4a1fbf?.code || '') === 'SUBSCRIPTION_REQUIRED'
                    ? {}
                    : buildVideoGenerationFailurePatch({
                        error: _0x1fb5af,
                        startedAt: _0x3f1df1.startedAt,
                        duration: Date.now() - _0x3f1df1.startedAt,
                      });
                if (_0x223447) {
                  const _0x3944c0 = this._buildDreaminaFailedSnapshot(
                    _0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '',
                    _0x1fb5af,
                  );
                  (Object.assign(
                    _0x54d701,
                    this._buildDreaminaTaskPatch(_0x3944c0, {
                      recovering: false,
                      startedAt: _0x3f1df1.startedAt,
                    }),
                  ),
                    this._emitDreaminaTaskCenterUpdate(_0x3944c0, {
                      status: 'failed',
                      error: _0x1fb5af,
                      startedAt: _0x3f1df1.startedAt,
                    }));
                }
                if (_0x30ee23) {
                  const _0x1f97bf = _0x4cc8fc.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    _0x54d701,
                    {
                      rhStatusMessage: _0x1fb5af,
                      rhStatusCode: Number.isFinite(Number(_0x4a1fbf?.code)) ? Number(_0x4a1fbf.code) : null,
                    },
                    this._buildRunningHubTaskPatch({
                      taskId: String(this._rhTaskId || '').trim() || String(_0x1f97bf?.rhTaskId || '').trim(),
                      status: 'failed',
                      startedAt: _0x3f1df1.startedAt,
                      recovering: false,
                      useOpenapiQuery: _0x1f97bf?.rhTaskUseOpenapiQuery === true,
                    }),
                  );
                }
                if (_0x4b3bb6) {
                  const _0x127140 = _0x4cc8fc.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    _0x54d701,
                    this._buildAsyncTaskPatch({
                      provider: String(_0x127140?.asyncTaskProvider || _0x4a6399 || '').trim(),
                      kind: 'video',
                      taskId: String(_0x127140?.asyncTaskId || '').trim(),
                      status: 'failed',
                      startedAt: _0x3f1df1.startedAt,
                      recovering: false,
                    }),
                  );
                }
                return _0x54d701;
              },
              cancelledBuilder: (_0x101ebf) => ({
                videos: [],
                videoUrl: '',
                localPath: '',
                generationDuration: Date.now() - _0x101ebf.startedAt,
                ...(_0x30ee23
                  ? {
                      rhStatusMessage: videoTaskText('task.generationCancelled'),
                      rhStatusCode: null,
                      ...this._buildRunningHubTaskPatch({
                        taskId:
                          String(this._rhTaskId || '').trim() ||
                          String(_0x4cc8fc.getState().nodes?.[this.nodeId]?.rhTaskId || '').trim(),
                        status: 'cancelled',
                        startedAt: _0x101ebf.startedAt,
                        recovering: false,
                        useOpenapiQuery:
                          _0x4cc8fc.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
                      }),
                    }
                  : {}),
              }),
              parseError: (_0x7ba6cf) => _0x7ba6cf?.message || videoTaskText('task.generationFailed'),
            },
            { store: _0x4cc8fc, startedAt: _0x55c726, abortController: this._rhAbortController },
          );
          if (_0xc986d1.status === 'pending') return _0xc986d1;
          if (_0xc986d1.status === 'success') {
            const _0x2d6ace = normalizeVideoGenerationResult(_0xc986d1.result).items;
            this._finalizeVideoSuccessSideEffects(_0x2d6ace, _0x55c726);
            if (_0x223447) this._persistDreaminaResumeCache();
            if (_0x30ee23) this._persistRunningHubResumeCache();
            if (_0x4b3bb6) this._persistAsyncResumeCache();
            return _0xc986d1;
          }
          const _0x7452b2 = _0xc986d1.error;
          if (_0xc986d1.status === 'failed' && String(_0x7452b2?.code || '') === 'SUBSCRIPTION_REQUIRED') {
            const _0x384a86 = String(_0x7452b2?.requiredModelId || '').trim(),
              _0x15b940 = _0x384a86 || this._data?.model || '',
              _0x44cbab = String(this._data?.provider || '').trim(),
              _0x4a8e73 = window.handleSubscriptionRequired;
            if (typeof _0x4a8e73 === 'function')
              await _0x4a8e73({ modelId: _0x15b940, provider: _0x44cbab, error: _0x7452b2 });
            else {
              if (typeof window.openSubscriptionDialog === 'function') {
                const _0x2501af = window.getSubscriptionState?.() || {};
                String(_0x2501af.status || '').toLowerCase() !== 'active'
                  ? window.openSubscriptionDialog({ modelId: _0x15b940, provider: _0x44cbab })
                  : window.showToast?.(
                      _0x7452b2?.message || videoTaskText('toasts.subscriptionSyncing'),
                      'warning',
                    );
              }
            }
            return _0xc986d1;
          }
          if (_0xc986d1.status === 'failed' && _0x223447 && this._isDreaminaPollTimeoutError(_0x7452b2))
            return (
              this._persistDreaminaResumeCache(),
              this._showDreaminaBackgroundQueueingToast(
                _0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '',
              ),
              _0xc986d1
            );
          if (_0xc986d1.status === 'failed') {
            const _0x1dadff = _0x7452b2?.message || '';
            (void logDiagnosticEvent({
              type: 'generation.video_failed',
              level: 'error',
              source: 'renderer',
              message: _0x1dadff || videoTaskText('task.videoGenerationFailed'),
              error: _0x7452b2,
              context: {
                nodeId: this.nodeId,
                provider: _0x5bd3a7?.provider || '',
                model: _0x5bd3a7?.model || '',
                isDreamina: _0x223447,
                isRhWorkflow: _0x30ee23,
                isAsyncTaskModel: _0x4b3bb6,
              },
            }),
              window.showToast?.(
                _0x1dadff,
                'error',
                isDreaminaUploadDurationErrorMessage(_0x1dadff)
                  ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
                  : undefined,
              ));
            if (_0x223447) this._persistDreaminaResumeCache();
            if (_0x30ee23) this._persistRunningHubResumeCache();
            if (_0x4b3bb6) this._persistAsyncResumeCache();
            return _0xc986d1;
          }
          return _0xc986d1;
        } catch (_0x3617ec) {
          if (
            _0x30ee23 &&
            (this._rhCancelRequested ||
              _0x3617ec?.message === 'CANCELLED' ||
              _0x3617ec?.name === 'AbortError')
          )
            return;
          if (String(_0x3617ec?.code || '') === 'SUBSCRIPTION_REQUIRED') {
            const _0x49dc75 = String(_0x3617ec?.requiredModelId || '').trim(),
              _0x3ba1e8 = _0x49dc75 || this._data?.model || '',
              _0x18b54b = String(this._data?.provider || '').trim(),
              _0x58f1ba = window.handleSubscriptionRequired;
            if (typeof _0x58f1ba === 'function')
              await _0x58f1ba({ modelId: _0x3ba1e8, provider: _0x18b54b, error: _0x3617ec });
            else {
              if (typeof window.openSubscriptionDialog === 'function') {
                const _0x3e65af = window.getSubscriptionState?.() || {};
                String(_0x3e65af.status || '').toLowerCase() !== 'active'
                  ? window.openSubscriptionDialog({ modelId: _0x3ba1e8, provider: _0x18b54b })
                  : window.showToast?.(
                      _0x3617ec?.message || videoTaskText('toasts.subscriptionSyncing'),
                      'warning',
                    );
              }
            }
            return;
          }
          if (_0x223447 && this._isDreaminaPollTimeoutError(_0x3617ec)) {
            const _0x3591ab = _0x4cc8fc.getState().nodes?.[this.nodeId] || {},
              _0x970968 = String(_0x3591ab?.dreaminaSubmitId || '').trim(),
              _0x453421 = this._buildDreaminaBackgroundPendingSnapshot(_0x970968);
            (_0x4cc8fc.updateNodeData(
              this.nodeId,
              Object.assign(
                {
                  isGenerating: true,
                  jobStatus: 'running',
                  jobError: null,
                  generationDuration: Date.now() - _0x55c726,
                },
                this._buildDreaminaTaskPatch(_0x453421, {
                  recovering: false,
                  startedAt: Number(
                    _0x3591ab?.dreaminaTaskStartedAt || _0x3591ab?.generationStartTime || _0x55c726,
                  ),
                }),
              ),
            ),
              this._persistDreaminaResumeCache(),
              this._showDreaminaBackgroundQueueingToast(_0x970968));
            return;
          }
          const _0x312c84 = _0x3617ec?.message || '';
          (void logDiagnosticEvent({
            type: 'generation.video_failed',
            level: 'error',
            source: 'renderer',
            message: _0x312c84 || videoTaskText('task.videoGenerationFailed'),
            error: _0x3617ec,
            context: {
              nodeId: this.nodeId,
              provider: _0x5bd3a7?.provider || '',
              model: _0x5bd3a7?.model || '',
              isDreamina: _0x223447,
              isRhWorkflow: _0x30ee23,
              isAsyncTaskModel: _0x4b3bb6,
            },
          }),
            window.showToast?.(
              _0x312c84,
              'error',
              isDreaminaUploadDurationErrorMessage(_0x312c84)
                ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
                : undefined,
            ));
          const _0x5b46ea = buildVideoGenerationFailurePatch({
            error: _0x312c84 || videoTaskText('task.generationFailed'),
            startedAt: _0x55c726,
            duration: Date.now() - _0x55c726,
          });
          _0x223447 &&
            Object.assign(
              _0x5b46ea,
              this._buildDreaminaTaskPatch(
                this._buildDreaminaFailedSnapshot(
                  _0x4cc8fc.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '',
                  _0x3617ec?.message || videoTaskText('task.generationFailed'),
                ),
                { recovering: false, startedAt: _0x55c726 },
              ),
            );
          _0x30ee23 &&
            Object.assign(
              _0x5b46ea,
              {
                rhStatusMessage: _0x3617ec?.message || videoTaskText('task.generationFailed'),
                rhStatusCode: Number.isFinite(Number(_0x3617ec?.code)) ? Number(_0x3617ec.code) : null,
              },
              this._buildRunningHubTaskPatch({
                taskId:
                  String(this._rhTaskId || '').trim() ||
                  String(_0x4cc8fc.getState().nodes?.[this.nodeId]?.rhTaskId || '').trim(),
                status: 'failed',
                startedAt: _0x55c726,
                recovering: false,
                useOpenapiQuery: _0x4cc8fc.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
              }),
            );
          if (_0x4b3bb6) {
            const _0x459145 = _0x4cc8fc.getState().nodes?.[this.nodeId] || {};
            Object.assign(
              _0x5b46ea,
              this._buildAsyncTaskPatch({
                provider: String(_0x459145?.asyncTaskProvider || _0x4a6399 || '').trim(),
                kind: 'video',
                taskId: String(_0x459145?.asyncTaskId || '').trim(),
                status: 'failed',
                startedAt: _0x55c726,
                recovering: false,
              }),
            );
          }
          _0x223447 &&
            this._emitDreaminaTaskCenterUpdate(
              {
                submitId: _0x5b46ea.dreaminaSubmitId,
                status: _0x5b46ea.dreaminaTaskStatus,
                phase: _0x5b46ea.dreaminaTaskPhase,
                label: _0x5b46ea.dreaminaTaskLabel,
                failReason: _0x312c84,
              },
              { status: 'failed', error: _0x312c84, startedAt: _0x55c726 },
            );
          _0x4cc8fc.updateNodeData(this.nodeId, _0x5b46ea);
          if (_0x223447) this._persistDreaminaResumeCache();
          if (_0x30ee23) this._persistRunningHubResumeCache();
          if (_0x4b3bb6) this._persistAsyncResumeCache();
        } finally {
          const _0x192605 = this._syncLocalTaskNodeData(),
            _0x5d4ba0 = shouldShowGenerationBusyUi(_0x192605);
          this._isGenerating = _0x5d4ba0;
          _0x223447 && !_0x5d4ba0 && (this._dreaminaActiveSubmitId = '');
          this._rhAbortController = null;
          if (_0x30ee23 && _0x5d4ba0) {
            const _0x3b5b27 = String(_0x192605?.rhTaskId || '').trim();
            if (_0x3b5b27) this._rhTaskId = _0x3b5b27;
          } else {
            this._rhTaskId = null;
            if (!this._rhCancelRequested) this._rhApiKey = null;
          }
          _0x5d4ba0
            ? this._updateSubmitButtonState?.()
            : (this._resetGenerateButtonIdleUi({ cancellable: _0x30ee23 }),
              _0x11f58d(this.previewEl),
              this._updateSubmitButtonState?.());
        }
      } finally {
        this._videoSubmitInFlight = false;
      }
    }
    async ['_buildPayloadImpl'](_0x529ad1 = null, _0xdc43bb = {}) {
      const _0x20df8b = _0x4cc8fc.getState?.() || {},
        _0x5ccc04 = _0x20df8b.nodes?.[this.nodeId];
      _0x5ccc04 && typeof _0x5ccc04 === 'object' && (this._data = _0x5ccc04);
      let _0x52b585 = _0x4cc8fc.getIncomingEdges(this.nodeId);
      shouldScopeRunningHubVideoSubmitEdges(this._data || {}) &&
        (_0x52b585 = _0x52b585.filter((_0x11270d) => _0x11270d?.targetId === this.nodeId));
      const _0x408e2a = _0x20df8b.nodes || {};
      let _0x20af3f = [],
        _0x535d75 = [];
      for (const _0x4a0af5 of _0x52b585) {
        const _0x2744c0 = _0x408e2a[_0x4a0af5.sourceId],
          _0x197752 = String(_0x2744c0?.type || '').toLowerCase(),
          _0x1bbeca = _0x197752 === 'source-image' || _0x197752 === 'image' || _0x197752 === 'ai-image';
        let _0x2866c7 = '';
        _0x1bbeca && (_0x2866c7 = resolveGenerationInputImageUrl(_0x2744c0));
        let _0x564dc8 = _0x1bbeca ? _0x2866c7 : _0x2744c0?.videoUrl || _0x2744c0?.imageUrl || '';
        if (String(_0x2744c0?.type || '') === 'ai-video') {
          const _0x4b51ff = String(_0x4a0af5?.sourceMediaKey || '').trim();
          if (_0x4b51ff) {
            const _0x44620f = Array.isArray(_0x2744c0?.videos) ? _0x2744c0.videos : [],
              _0x307a81 = _0x44620f.find((_0xf2f407) => {
                const _0x10e80f =
                  String(_0xf2f407?.localPath || '').trim() || String(_0xf2f407?.videoUrl || '').trim();
                return _0x10e80f === _0x4b51ff;
              });
            _0x307a81 &&
              (_0x564dc8 =
                localPathToUrl(_0x307a81.localPath) || String(_0x307a81.videoUrl || '').trim() || _0x564dc8);
          }
        }
        if (!_0x564dc8 && _0x408e2a[_0x4a0af5.sourceId]?.sourceId) {
          const _0x4dddf4 = await _0x215b94(_0x408e2a[_0x4a0af5.sourceId].sourceId);
          if (_0x4dddf4) _0x564dc8 = URL.createObjectURL(_0x4dddf4);
        }
        if (_0x564dc8 && !_0x20af3f.includes(_0x564dc8)) _0x20af3f.push(_0x564dc8);
        if (_0x1bbeca) {
          const _0x376b8a = String(_0x2866c7 || _0x564dc8 || '').trim();
          _0x376b8a &&
            !_0x376b8a.startsWith('blob:') &&
            !_0x535d75.includes(_0x376b8a) &&
            _0x535d75.push(_0x376b8a);
        }
      }
      const _0x59d9e9 = [],
        _0x54ecf4 = resolvePresetPromptTextWithTextRefs({
          template: _0x529ad1,
          promptEl: this.promptEl,
          inEdges: _0x52b585,
          nodes: _0x408e2a,
          assetInputRefs: _0x59d9e9,
          assetMediaCounts: { image: 0, video: 0, audio: 0 },
          allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        }),
        _0x6f1f7c = this._data.model || getDefaultRunningHubVideoWorkflowModelId(),
        _0x3a2911 = isDreaminaStyleVideoModel(_0x6f1f7c, this._data.provider)
          ? resolveDreaminaStyleVideoProvider(_0x6f1f7c, this._data.provider)
          : '',
        _0x3de15f = this._data.provider || _0x3a2911 || resolveModelProvider(_0x6f1f7c) || 'grsai',
        _0x45134a = isRunningHubWorkflowNode({ ...this._data, model: _0x6f1f7c, provider: _0x3de15f });
      if (_0x45134a) {
        const _0x49e57d = _0x408e2a?.[this.nodeId] || this._data || {};
        _0x59d9e9.push(
          ...getPromptAssetInputRefsFromNode(_0x49e57d, { allowedTypes: ['image', 'video', 'audio'] }),
        );
      }
      const _0x19d06d = _0x59d9e9
          .filter((_0x1726af) => _0x1726af.type === 'image' && _0x1726af.url)
          .map((_0x489bf0) => _0x489bf0.url),
        _0x1a32f0 = _0x59d9e9
          .filter((_0x55d5e8) => _0x55d5e8.type === 'video' && _0x55d5e8.url)
          .map((_0x48136b) => _0x48136b.url),
        _0x573707 = _0x59d9e9
          .filter((_0x4c1d2c) => _0x4c1d2c.type === 'audio' && _0x4c1d2c.url)
          .map((_0x488adc) => _0x488adc.url);
      for (const _0x14225 of _0x59d9e9) {
        if (_0x14225.url && !_0x20af3f.includes(_0x14225.url)) _0x20af3f.push(_0x14225.url);
        _0x14225.type === 'image' &&
          _0x14225.url &&
          !_0x535d75.includes(_0x14225.url) &&
          _0x535d75.push(_0x14225.url);
      }
      const _0x4486e7 = isDreaminaStyleVideoModel(_0x6f1f7c, _0x3de15f),
        _0x4b1f8b = _0x4486e7 ? _0x535d75.slice(0, 1) : _0x20af3f,
        _0x4424fd =
          resolveModelExecution(_0x6f1f7c, { providerHint: _0x3de15f }) || resolveModelExecution(_0x6f1f7c),
        _0x102879 =
          _0x4424fd?.modelManifest?.adapterType === 'modelApi' &&
          _0x4424fd?.modelManifest?.kind === 'video' &&
          _0x4424fd?.executionManifest?.adapterType === 'modelApi',
        _0x2596d3 = this._isRunninghubWorkflowModel(_0x6f1f7c, _0x3de15f) || _0x45134a;
      if (isHappyHorseVideoModel(_0x6f1f7c, _0x3de15f) && !_0x54ecf4)
        return (window.showToast?.(videoTaskText('validation.happyHorse.promptRequired'), 'warn'), null);
      if (!_0x4486e7 && !_0x2596d3 && !_0x54ecf4 && !_0x4b1f8b.length) return null;
      const _0xaf6a13 = this._data.resolution || '1080p',
        _0x114547 = _0x2596d3
          ? String(resolveVideoWorkflowSchemaParam(this._data, _0x6f1f7c, 'rhInstanceType')) === 'plus'
            ? 'plus'
            : 'default'
          : this._data.rhInstanceType;
      await _0x568d9b();
      const _0x109827 = _0x358106(_0x3de15f);
      let _0x51ae76 = '';
      if (_0x3de15f === 'runninghub')
        _0x51ae76 = isModelApiModel(_0x6f1f7c, _0x3de15f)
          ? _0x109827.modelApiKey || ''
          : _0x109827.apiKey || '';
      else
        _0x3de15f === 'runninghubwf'
          ? (_0x51ae76 = _0x109827.apiKey || '')
          : (_0x51ae76 = _0x109827.apiKey || '');
      const _0x13f241 = getPlainObject(this._data.generationParams),
        _0x22ae09 = (_0xa221a4, _0x32a154) =>
          Object.prototype.hasOwnProperty.call(_0x13f241, _0xa221a4) ? _0x13f241[_0xa221a4] : _0x32a154,
        _0x20bdc6 = {
          prompt: _0x54ecf4,
          model: _0x6f1f7c,
          generationParams: { ..._0x13f241 },
          aspectRatio: _0x22ae09('aspectRatio', this._data.aspectRatio || '1:1'),
          resolution: _0x22ae09('resolution', _0xaf6a13),
          videoSize: _0x22ae09('resolution', _0xaf6a13),
          duration: _0x22ae09('duration', this._data.duration || 5),
          mode: this._data.mode || '全能参考',
          provider: _0x3de15f,
          apiKey: _0x51ae76,
          cameraAngle: this._data.cameraAngle,
          inputUrls: _0x4b1f8b,
          rhInstanceType: _0x114547,
          installId: String(window.__aicInstallId || '').trim(),
        };
      if (_0xdc43bb?.randomizeSubmitParams === true && _0x102879) {
        const _0x4e0621 = buildSubmitRandomizedSeedPatch({
          modelManifest: _0x4424fd?.modelManifest || null,
          nodeData: this._data,
          payload: _0x20bdc6,
        });
        _0x4e0621 &&
          ((_0x20bdc6.generationParams = _0x4e0621.requestParams),
          _0x4cc8fc.updateNodeData?.(this.nodeId, _0x4e0621.storePatch),
          (this._data = { ...(this._data || {}), ..._0x4e0621.storePatch }));
      }
      const _0x3ac64a = (_0x2f6af5, _0x3b8a3f) => {
          const _0x573500 = Array.isArray(_0x2f6af5?.videos) ? _0x2f6af5.videos : [];
          if (!_0x573500.length) return null;
          const _0xc1e12b = String(_0x3b8a3f?.sourceMediaKey || '').trim();
          if (_0xc1e12b) {
            const _0x4cd269 = _0x573500.find((_0x27bc15) => {
              const _0x563477 =
                String(_0x27bc15?.localPath || '').trim() || String(_0x27bc15?.videoUrl || '').trim();
              return _0x563477 === _0xc1e12b;
            });
            if (_0x4cd269) return _0x4cd269;
          }
          const _0x44773e = Number(_0x2f6af5?.mainVideoIndex),
            _0x150908 = Number.isFinite(_0x44773e) ? Math.max(0, Math.trunc(_0x44773e)) : 0;
          return _0x573500[Math.min(_0x150908, _0x573500.length - 1)] || null;
        },
        _0x137192 = (_0x44b7b2, _0x1c152b = null) => {
          const _0xe3cdd3 =
              String(_0x44b7b2?.type || '') === 'ai-video' ? _0x3ac64a(_0x44b7b2, _0x1c152b) : null,
            _0x4c4c55 = String(_0xe3cdd3?.localPath || '').trim(),
            _0x47092c = localPathToUrl(_0x4c4c55);
          if (_0x47092c) return this._resolveMediaUrl(_0x47092c);
          const _0x38e9dc = String(_0xe3cdd3?.displayLocalPath || '').trim(),
            _0x2c9d8f = localPathToUrl(_0x38e9dc);
          if (_0x2c9d8f) return this._resolveMediaUrl(_0x2c9d8f);
          const _0x2c03df = String(_0xe3cdd3?.originalLocalPath || '').trim(),
            _0x357b92 = localPathToUrl(_0x2c03df);
          if (_0x357b92) return this._resolveMediaUrl(_0x357b92);
          const _0x2b54a0 = String(_0xe3cdd3?.videoUrl || '').trim();
          if (_0x2b54a0) return this._resolveMediaUrl(_0x2b54a0);
          const _0x4bb4a7 = String(_0x44b7b2?.localPath || '').trim(),
            _0x4f5951 = localPathToUrl(_0x4bb4a7);
          if (_0x4f5951) return this._resolveMediaUrl(_0x4f5951);
          const _0x318db9 = String(_0x44b7b2?.displayLocalPath || '').trim(),
            _0x548c29 = localPathToUrl(_0x318db9);
          if (_0x548c29) return this._resolveMediaUrl(_0x548c29);
          const _0x543df5 = String(_0x44b7b2?.originalLocalPath || '').trim(),
            _0x51766a = localPathToUrl(_0x543df5);
          if (_0x51766a) return this._resolveMediaUrl(_0x51766a);
          const _0x6d5053 = String(_0x44b7b2?.videoLocalPath || '').trim(),
            _0x157de4 = localPathToUrl(_0x6d5053);
          if (_0x157de4) return this._resolveMediaUrl(_0x157de4);
          const _0x32178e = String(_0x44b7b2?.videoUrl || '').trim();
          if (_0x32178e) return this._resolveMediaUrl(_0x32178e);
          const _0x21ac19 = String(_0x44b7b2?.src || '').trim();
          if (_0x21ac19) return this._resolveMediaUrl(_0x21ac19);
          const _0x429b95 = String(_0x44b7b2?.url || '').trim();
          if (_0x429b95) return this._resolveMediaUrl(_0x429b95);
          const _0x5337bf = String(_0x44b7b2?.resultUrl || '').trim();
          if (_0x5337bf) return this._resolveMediaUrl(_0x5337bf);
          const _0x32f5a0 = String(_0x44b7b2?.sourceUrl || '').trim();
          if (_0x32f5a0) return this._resolveMediaUrl(_0x32f5a0);
          return '';
        },
        _0x37e9f6 = (_0x47ebf0) => {
          const _0xe52149 = resolveGenerationInputImageUrl(_0x47ebf0);
          return _0xe52149 ? this._resolveMediaUrl(_0xe52149) : '';
        },
        _0xdbeaaa = (_0x2dde51) => {
          const _0x4649d4 = String(
            _0x2dde51?.mask ||
              _0x2dde51?.maskImageDataUrl ||
              _0x2dde51?.maskImageUrl ||
              _0x2dde51?.maskUrl ||
              _0x2dde51?.maskLocalPath ||
              '',
          ).trim();
          if (!_0x4649d4) return '';
          const _0xa24fb3 = localPathToUrl(_0x4649d4);
          return this._resolveMediaUrl(_0xa24fb3 || _0x4649d4);
        },
        _0xfc639 = (_0x110ff7) => {
          const _0x33bb13 = String(_0x110ff7?.localPath || '').trim(),
            _0x11daff = localPathToUrl(_0x33bb13);
          if (_0x11daff) return this._resolveMediaUrl(_0x11daff);
          const _0x24b468 = String(_0x110ff7?.audioUrl || '').trim();
          if (_0x24b468) return this._resolveMediaUrl(_0x24b468);
          const _0x4c5730 = String(_0x110ff7?.src || '').trim();
          if (_0x4c5730) return this._resolveMediaUrl(_0x4c5730);
          return '';
        };
      if (_0x4486e7) {
        let _0x114d6a = this._data;
        typeof this._normalizeDreaminaNodeData === 'function' &&
          ((_0x114d6a = this._normalizeDreaminaNodeData(this._data, { syncStore: true }) || this._data),
          (this._data = _0x114d6a));
        const _0x92db64 = getPlainObject(_0x114d6a?.generationParams),
          _0x3f44f9 = (_0x1b868a, _0x1e5365) => {
            const _0x110264 = Array.isArray(_0x1b868a) ? _0x1b868a : [_0x1b868a];
            for (const _0x12da91 of _0x110264) {
              const _0x20d9b4 = String(_0x12da91 || '').trim();
              if (_0x20d9b4 && Object.prototype.hasOwnProperty.call(_0x92db64, _0x20d9b4))
                return _0x92db64[_0x20d9b4];
            }
            return _0x1e5365;
          },
          _0x49bc56 = resolveDreaminaStyleVideoProvider(
            _0x114d6a?.model || _0x6f1f7c,
            _0x114d6a?.provider || _0x3de15f,
          ),
          _0x5d995f = _0x19d06d.slice(),
          _0x3b12a3 = _0x1a32f0.slice(),
          _0x927fce = _0x573707.slice(),
          _0x1c311b = [];
        for (const _0xb3fca4 of _0x52b585) {
          const _0x36eaf2 = _0x408e2a[_0xb3fca4.sourceId];
          if (!_0x36eaf2) continue;
          const _0x96e3e = String(_0x36eaf2?.type || '').toLowerCase();
          if (_0x96e3e.includes('image')) {
            const _0x11e108 = _0x37e9f6(_0x36eaf2);
            _0x11e108 &&
              (_0x5d995f.push(_0x11e108),
              appendApimartPrivateAvatarProviderAssetRefs(_0x1c311b, _0x36eaf2, {
                kind: 'image',
                sourceUrl: _0x11e108,
                refSlot: _0xb3fca4?.refSlot,
                edgeId: _0xb3fca4?.id,
              }));
            continue;
          }
          if (_0x96e3e.includes('video')) {
            const _0x29f699 = _0x137192(_0x36eaf2, _0xb3fca4);
            _0x29f699 &&
              (_0x3b12a3.push(_0x29f699),
              appendApimartPrivateAvatarProviderAssetRefs(_0x1c311b, _0x36eaf2, {
                kind: 'video',
                sourceUrl: _0x29f699,
                refSlot: _0xb3fca4?.refSlot,
                edgeId: _0xb3fca4?.id,
              }));
            continue;
          }
          if (_0x96e3e.includes('audio')) {
            const _0x973171 = _0xfc639(_0x36eaf2);
            if (_0x973171) _0x927fce.push(_0x973171);
          }
        }
        const _0x4d998c = normalizeDreaminaVideoRouteMode(
          _0x3f44f9(
            ['dreaminaRouteMode', 'volcengine_seedance_2_mode', 'rh_seedance_2_mode'],
            _0x114d6a?.dreaminaRouteMode,
          ),
          _0x114d6a?.mode,
        );
        if (!isDreaminaVideoRouteModeEnabled(_0x4d998c))
          return (window.showToast?.(videoTaskText('toasts.smartMultiframeUnavailable'), 'warn'), null);
        const _0xd0f41c = resolveDreaminaVideoTaskType({
            routeMode: _0x4d998c,
            imageCount: _0x5d995f.length,
            videoCount: _0x3b12a3.length,
            audioCount: _0x927fce.length,
          }),
          _0x34e3ad = validateDreaminaVideoRouteSelection({
            routeMode: _0x4d998c,
            taskType: _0xd0f41c,
            imageCount: _0x5d995f.length,
            videoCount: _0x3b12a3.length,
            audioCount: _0x927fce.length,
          });
        if (_0x34e3ad) return (window.showToast?.(_0x34e3ad, 'warn'), null);
        const _0x3a347b =
            ensureDreaminaStyleVideoModelForTask(
              _0xd0f41c,
              normalizeDreaminaStyleVideoModel(_0x114d6a?.model, _0x49bc56),
              _0x49bc56,
            ) || normalizeDreaminaStyleVideoModel(_0x114d6a?.model, _0x49bc56),
          _0xc9f96e = normalizeDreaminaStyleVideoResolution(
            _0xd0f41c,
            _0x3a347b,
            _0x3f44f9('resolution', _0x114d6a?.resolution || _0x114d6a?.videoSize),
            _0x49bc56,
          ),
          _0x1ebcf5 = normalizeDreaminaVideoAspectRatio(_0x3f44f9('aspectRatio', _0x114d6a?.aspectRatio));
        let _0x3d1cd5 = _0x1ebcf5;
        const _0x4be773 = String(_0x3f44f9('aspectRatio', _0x114d6a?.aspectRatio) || '').trim(),
          _0x46cdfb = isAdaptiveRatioLabel(_0x4be773);
        if (_0x46cdfb) {
          const _0x34e5f3 = pickDreaminaAdaptiveSourceRatio({
              inEdges: _0x52b585,
              nodes: _0x408e2a,
              provider: _0x49bc56,
              model: _0x3a347b,
            }),
            _0xc2cb0a = _0x34e5f3 || this._resolveDreaminaAdaptiveAspectRatioFromNode(_0x114d6a);
          _0x3d1cd5 = _0xc2cb0a;
        }
        const _0x3e4b01 = normalizeDreaminaStyleVideoDuration(
            _0xd0f41c,
            _0x3a347b,
            _0x3f44f9('duration', _0x114d6a?.duration),
            _0x49bc56,
          ),
          _0xe61e9e = getDreaminaStyleVideoDefaultModel(_0xd0f41c, _0x49bc56),
          _0x2f9328 = {
            prompt: _0x54ecf4,
            provider: _0x49bc56,
            model: _0x3a347b || _0xe61e9e,
            generationParams: { ..._0x92db64 },
            modelVersion:
              _0x49bc56 === 'dreamina' ? getDreaminaStyleVideoModelVersion(_0x3a347b, _0x49bc56) : '',
            dreaminaRouteMode: _0x4d998c,
            dreaminaTaskType: _0xd0f41c,
            aspectRatio: _0x3d1cd5,
            duration: _0x3e4b01,
            resolution: _0xc9f96e,
            videoResolution: _0xc9f96e,
            videoSize: _0xc9f96e,
            images: _0x5d995f,
            videos: _0x3b12a3,
            audios: _0x927fce,
            inputUrls: _0x5d995f.slice(),
            providerAssetRefs: _0x1c311b,
            installId: String(window.__aicInstallId || '').trim(),
          };
        Object.keys(_0x92db64).length <= 0 && delete _0x2f9328.generationParams;
        if (_0x1c311b.length <= 0) delete _0x2f9328.providerAssetRefs;
        if (!_0x2f9328.modelVersion) delete _0x2f9328.modelVersion;
        !_0xc9f96e &&
          (delete _0x2f9328.resolution, delete _0x2f9328.videoResolution, delete _0x2f9328.videoSize);
        if (_0xd0f41c === 'text2video') {
          if (!_0x54ecf4) return null;
          return (
            (_0x2f9328.inputUrls = []),
            (_0x2f9328.images = []),
            (_0x2f9328.videos = []),
            (_0x2f9328.audios = []),
            _0x2f9328
          );
        }
        if (_0xd0f41c === 'image2video') {
          if (!_0x54ecf4 || !_0x5d995f[0]) return null;
          ((_0x2f9328.image = _0x5d995f[0]),
            (_0x2f9328.inputUrls = [_0x5d995f[0]]),
            (_0x2f9328.images = [_0x5d995f[0]]));
          if (_0x49bc56 === 'dreamina') delete _0x2f9328.aspectRatio;
          return _0x2f9328;
        }
        if (_0xd0f41c === 'frames2video') {
          if (!_0x54ecf4 || _0x5d995f.length < 2) return null;
          ((_0x2f9328.first = _0x5d995f[0]),
            (_0x2f9328.last = _0x5d995f[1]),
            (_0x2f9328.inputUrls = _0x5d995f.slice(0, 2)),
            (_0x2f9328.images = _0x5d995f.slice(0, 2)));
          if (_0x49bc56 === 'dreamina') delete _0x2f9328.aspectRatio;
          return _0x2f9328;
        }
        if (_0xd0f41c === 'multiframe2video') {
          const _0x100dcb = _0x5d995f.slice(0, 20);
          if (_0x100dcb.length < 2) return null;
          const _0x5b573e = Math.max(0, _0x100dcb.length - 1),
            _0x5b662a = Array.isArray(_0x114d6a?.dreaminaTransitionPrompts)
              ? _0x114d6a.dreaminaTransitionPrompts
              : [],
            _0x5a496b = Array.isArray(_0x114d6a?.dreaminaTransitionDurations)
              ? _0x114d6a.dreaminaTransitionDurations
              : [],
            _0x5242b8 = [],
            _0x448af4 = [];
          for (let _0x3142a4 = 0; _0x3142a4 < _0x5b573e; _0x3142a4 += 1) {
            const _0x4fa2e4 = String(_0x5b662a[_0x3142a4] || '').trim() || _0x54ecf4,
              _0x2e29e8 = Number(_0x5a496b[_0x3142a4]),
              _0x31ade7 =
                Number.isFinite(_0x2e29e8) && _0x2e29e8 > 0 ? Math.max(1, Math.trunc(_0x2e29e8)) : 3;
            (_0x5242b8.push(_0x4fa2e4), _0x448af4.push(_0x31ade7));
          }
          if (!_0x54ecf4 && !_0x5242b8.some((_0x525912) => String(_0x525912 || '').trim())) return null;
          return (
            (_0x2f9328.images = _0x100dcb),
            (_0x2f9328.inputUrls = _0x100dcb.slice()),
            (_0x2f9328.transitionPrompts = _0x5242b8),
            (_0x2f9328.transitionDurations = _0x448af4),
            _0x100dcb.length === 2 &&
              ((_0x2f9328.prompt = _0x5242b8[0] || _0x54ecf4),
              (_0x2f9328.duration = _0x448af4[0] || 3),
              delete _0x2f9328.transitionPrompts,
              delete _0x2f9328.transitionDurations),
            delete _0x2f9328.modelVersion,
            delete _0x2f9328.model,
            delete _0x2f9328.aspectRatio,
            delete _0x2f9328.resolution,
            delete _0x2f9328.videoResolution,
            delete _0x2f9328.videoSize,
            _0x2f9328
          );
        }
        if (_0xd0f41c === 'multimodal2video') {
          if (_0x5d995f.length <= 0 && _0x3b12a3.length <= 0) return null;
          if (!_0x2f9328.modelVersion) {
            if (_0x49bc56 === 'dreamina')
              ((_0x2f9328.model = _0xe61e9e || _0x2f9328.model),
                (_0x2f9328.modelVersion = getDreaminaStyleVideoModelVersion(_0x2f9328.model, _0x49bc56)));
            else !_0x2f9328.model && (_0x2f9328.model = APIMART_DREAMINA_VIDEO_DEFAULT_MODEL);
          }
          return _0x2f9328;
        }
        return null;
      }
      if (_0x2596d3) {
        const _0x221326 = await buildRunningHubVideoWorkflowSubmitPatch({
          model: _0x6f1f7c,
          nodeData: this._data,
          inEdges: _0x52b585,
          nodes: _0x408e2a,
          assetInputRefs: _0x59d9e9,
          prompt: _0x54ecf4,
          helpers: {
            getVideoUrl: _0x137192,
            getImageUrl: _0x37e9f6,
            getMaskImageUrl: _0xdbeaaa,
            getAudioUrl: _0xfc639,
          },
        });
        if (_0x221326 === null) return null;
        return (
          Object.assign(_0x20bdc6, _0x221326.payloadPatch || {}),
          applyVideoManifestAdaptiveRatio(_0x20bdc6, {
            inEdges: _0x52b585,
            nodes: _0x408e2a,
            nodeData: this._data,
            provider: _0x3de15f,
            model: _0x6f1f7c,
            modelManifest: _0x4424fd?.modelManifest || null,
          }),
          Object.keys(_0x221326.updateData || {}).length > 0 &&
            _0x4cc8fc.updateNodeData(this.nodeId, _0x221326.updateData),
          _0x20bdc6
        );
      }
      if (_0x102879 && !_0x4486e7) {
        const _0x342d8f = _0x535d75.slice(),
          _0x5ed361 = [],
          _0x526688 = [],
          _0x5bc234 = [],
          _0xb7a3dd = [],
          _0x1abed4 = [],
          _0x39b821 = [],
          _0x500e7f = [],
          _0x19bbba = (_0x233f14, _0x1442e7) => {
            const _0x225f01 = String(_0x1442e7 || '').trim();
            if (_0x225f01 && !_0x233f14.includes(_0x225f01)) _0x233f14.push(_0x225f01);
          },
          _0x10a4b0 = (_0x3e04d4, _0x2bf2e3 = {}) => {
            const _0x5458e6 = String(_0x3e04d4 || '').trim();
            if (!_0x5458e6) return;
            const _0x318938 = _0x5bc234.indexOf(_0x5458e6),
              _0x3bd65c = { ..._0x2bf2e3, url: _0x5458e6 };
            if (_0x318938 < 0) {
              (_0x5bc234.push(_0x5458e6), _0xb7a3dd.push(_0x3bd65c));
              return;
            }
            const _0x4992fe = _0xb7a3dd[_0x318938] || {};
            !(Number(_0x4992fe.duration) > 0) &&
              Number(_0x3bd65c.duration) > 0 &&
              (_0xb7a3dd[_0x318938] = { ..._0x4992fe, ..._0x3bd65c });
          },
          _0x4d2efe = (_0x49f192, _0x303ed8 = {}) => {
            const _0x48edc5 = String(_0x49f192 || '').trim();
            if (!_0x48edc5) return;
            const _0x2d769d = _0x1abed4.indexOf(_0x48edc5),
              _0x16ecac = { ..._0x303ed8, url: _0x48edc5 };
            if (_0x2d769d < 0) {
              (_0x1abed4.push(_0x48edc5), _0x39b821.push(_0x16ecac));
              return;
            }
            const _0x121823 = _0x39b821[_0x2d769d] || {};
            _0x39b821[_0x2d769d] = {
              ..._0x121823,
              ...Object.fromEntries(
                Object.entries(_0x16ecac).filter(([, _0x35d441]) => {
                  if (_0x35d441 === '' || _0x35d441 == null) return false;
                  if (Number(_0x35d441) === 0) return false;
                  return true;
                }),
              ),
            };
          };
        (_0x59d9e9
          .filter((_0x14452a) => _0x14452a?.type === 'audio' && _0x14452a?.url)
          .forEach((_0x3d454a) => {
            _0x4d2efe(_0x3d454a.url, {
              duration: getAudioDurationFromAssetRef(_0x3d454a),
              sizeBytes: getAudioSizeBytesFromAssetRef(_0x3d454a),
              assetRefSource: _0x3d454a.assetRefSource || '',
            });
          }),
          _0x59d9e9
            .filter((_0x4f3152) => _0x4f3152?.type === 'video' && _0x4f3152?.url)
            .forEach((_0x2f7dfd) => {
              (_0x10a4b0(_0x2f7dfd.url, {
                duration: getVideoDurationFromAssetRef(_0x2f7dfd),
                assetRefSource: _0x2f7dfd.assetRefSource || '',
              }),
                _0x526688.push({ refSlot: _0x2f7dfd?.refSlot || '', url: _0x2f7dfd.url }));
            }));
        for (const _0x5075ac of _0x52b585) {
          const _0x261252 = _0x408e2a[_0x5075ac.sourceId];
          if (!_0x261252) continue;
          const _0x136e6f = String(_0x261252?.type || '').toLowerCase();
          if (_0x136e6f.includes('image')) {
            const _0x10945b = _0x37e9f6(_0x261252) || _0x261252?.imageUrl || _0x261252?.src || _0x261252?.url;
            (_0x19bbba(_0x342d8f, _0x10945b),
              String(_0x10945b || '').trim() &&
                (_0x5ed361.push({ refSlot: _0x5075ac?.refSlot || '', url: _0x10945b }),
                appendApimartPrivateAvatarProviderAssetRefs(_0x500e7f, _0x261252, {
                  kind: 'image',
                  sourceUrl: _0x10945b,
                  refSlot: _0x5075ac?.refSlot,
                  edgeId: _0x5075ac?.id,
                })));
          } else {
            if (_0x136e6f.includes('video')) {
              const _0xd81b46 =
                  String(_0x261252?.type || '') === 'ai-video' ? _0x3ac64a(_0x261252, _0x5075ac) : null,
                _0x12d329 = _0x137192(_0x261252, _0x5075ac);
              (_0x10a4b0(_0x12d329, {
                duration: getVideoDurationFromSource(_0x261252, _0xd81b46),
                edgeId: _0x5075ac?.id,
              }),
                String(_0x12d329 || '').trim() &&
                  (_0x526688.push({ refSlot: _0x5075ac?.refSlot || '', url: _0x12d329 }),
                  appendApimartPrivateAvatarProviderAssetRefs(_0x500e7f, _0x261252, {
                    kind: 'video',
                    sourceUrl: _0x12d329,
                    refSlot: _0x5075ac?.refSlot,
                    edgeId: _0x5075ac?.id,
                  })));
            } else
              _0x136e6f.includes('audio') &&
                _0x4d2efe(_0xfc639(_0x261252), {
                  duration: getAudioDurationFromSource(_0x261252),
                  sizeBytes: getAudioSizeBytesFromSource(_0x261252),
                  edgeId: _0x5075ac?.id,
                });
          }
        }
        applyModelApiVideoAdaptiveRatio(_0x20bdc6, {
          inEdges: _0x52b585,
          nodes: _0x408e2a,
          nodeData: this._data,
          provider: _0x3de15f,
          model: _0x6f1f7c,
          modelManifest: _0x4424fd?.modelManifest || null,
        });
        if (isHappyHorseVideoModel(_0x6f1f7c, _0x3de15f)) {
          const _0x5a304f = getHappyHorseMode(this._data),
            _0x56cbff = getFixedInputSlotConfigFromManifest(this._data || {}),
            _0x1ba0c5 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: _0x56cbff,
              imageRefs: _0x5ed361,
              assetInputRefs: _0x59d9e9,
            }),
            _0x66089f = orderHappyHorseImageUrls({ mode: _0x5a304f, images: _0x342d8f, slotUrls: _0x1ba0c5 }),
            _0x356898 = buildHappyHorseMediaPayload({
              prompt: _0x54ecf4,
              mode: _0x5a304f,
              images: _0x66089f,
              videos: _0x5bc234,
              videoEntries: _0xb7a3dd,
              assetVideoCount: _0x1a32f0.length,
              maxVideoSeconds: getHappyHorseVideoInputMaxSeconds(_0x6f1f7c, _0x3de15f),
            });
          if (!_0x356898.ok) return (window.showToast?.(_0x356898.message, 'warn'), null);
          const _0x2210c5 = _0x356898.mode || _0x5a304f;
          return (
            (_0x20bdc6.generationParams = { ..._0x20bdc6.generationParams, happyhorse_mode: _0x2210c5 }),
            (_0x20bdc6.images = _0x356898.images),
            (_0x20bdc6.videos = _0x356898.videos),
            (_0x20bdc6.audios = []),
            (_0x20bdc6.inputUrls = _0x356898.inputUrls),
            _0x20bdc6
          );
        }
        if (isWan27VideoModel(_0x6f1f7c, _0x3de15f)) {
          const _0xf2a752 = getWan27Mode(this._data),
            _0x54dc17 = getFixedInputSlotConfigFromManifest(this._data || {}),
            _0x6cf96f = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: _0x54dc17,
              refs: _0x526688,
              assetInputRefs: _0x59d9e9,
              kind: 'video',
            }),
            _0x6ff894 = [],
            _0xf927cb = (_0x59bb92) => {
              const _0xe2fd37 = String(_0x59bb92 || '').trim();
              _0xe2fd37 && !_0x6ff894.includes(_0xe2fd37) && _0x6ff894.push(_0xe2fd37);
            };
          if (_0xf2a752 === 'video') _0xf927cb(_0x6cf96f.sourceVideo);
          else {
            if (_0xf2a752 === 'reference') _0xf927cb(_0x6cf96f.referenceVideo);
            else
              _0xf2a752 === 'edit' &&
                (_0xf927cb(_0x6cf96f.originalVideo), _0xf927cb(_0x6cf96f.referenceVideo));
          }
          _0x5bc234.forEach(_0xf927cb);
          const _0xaede2 = buildWan27MediaPayload({
            mode: _0xf2a752,
            images: _0x342d8f,
            videos: _0x6ff894,
            audios: _0x1abed4,
            videoEntries: _0xb7a3dd,
            audioEntries: _0x39b821,
            assetVideoCount: _0x1a32f0.length,
          });
          if (!_0xaede2.ok) return (window.showToast?.(_0xaede2.message, 'warn'), null);
          ((_0x20bdc6.generationParams = { ..._0x20bdc6.generationParams, wan27_mode: _0xf2a752 }),
            (_0x20bdc6.images = _0xaede2.images),
            (_0x20bdc6.videos = _0xaede2.videos),
            (_0x20bdc6.audios = _0xaede2.audios),
            (_0x20bdc6.inputUrls = _0xaede2.inputUrls));
          if (_0xf2a752 === 'image' || _0xf2a752 === 'reference') {
            const _0x254c4c = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: _0x54dc17,
              imageRefs: _0x5ed361,
              assetInputRefs: _0x59d9e9,
            });
            Object.keys(_0x254c4c).length > 0 && (_0x20bdc6.inputUrlsBySlot = _0x254c4c);
          }
          return _0x20bdc6;
        }
        if (isKlingV3OmniVideoModel(_0x6f1f7c, _0x3de15f)) {
          const _0x13b558 = getKlingV3OmniMode(this._data),
            _0x7360e6 = getFixedInputSlotConfigFromManifest(this._data || {}),
            _0x34a655 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: _0x7360e6,
              imageRefs: _0x5ed361,
              assetInputRefs: _0x59d9e9,
            }),
            _0x34dc01 = [],
            _0x321860 = (_0xb3e9a4) => {
              const _0x4f5cf1 = String(_0xb3e9a4 || '').trim();
              _0x4f5cf1 && !_0x34dc01.includes(_0x4f5cf1) && _0x34dc01.push(_0x4f5cf1);
            };
          if (_0x13b558 === 'image') (_0x321860(_0x34a655.firstFrame), _0x321860(_0x34a655.lastFrame));
          else _0x13b558 === 'reference' && _0x321860(_0x34a655.referenceImage);
          _0x342d8f.forEach(_0x321860);
          const _0x12a7ae = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: _0x7360e6,
              refs: _0x526688,
              assetInputRefs: _0x59d9e9,
              kind: 'video',
            }),
            _0x104e81 = [],
            _0x35dfc9 = (_0x45f637) => {
              const _0x264024 = String(_0x45f637 || '').trim();
              _0x264024 && !_0x104e81.includes(_0x264024) && _0x104e81.push(_0x264024);
            };
          if (_0x13b558 === 'reference') _0x35dfc9(_0x12a7ae.referenceVideo);
          else _0x13b558 === 'edit' && _0x35dfc9(_0x12a7ae.editVideo);
          _0x5bc234.forEach(_0x35dfc9);
          const _0xbdccf5 = buildKlingV3OmniMediaPayload({
            mode: _0x13b558,
            images: _0x34dc01,
            videos: _0x104e81,
            videoEntries: _0xb7a3dd,
            assetVideoCount: _0x1a32f0.length,
          });
          if (!_0xbdccf5.ok) return (window.showToast?.(_0xbdccf5.message, 'warn'), null);
          ((_0x20bdc6.generationParams = { ..._0x20bdc6.generationParams, kling_v3_omni_mode: _0x13b558 }),
            (_0x20bdc6.images = _0xbdccf5.images),
            (_0x20bdc6.videos = _0xbdccf5.videos),
            (_0x20bdc6.audios = []),
            (_0x20bdc6.inputUrls = _0xbdccf5.inputUrls));
          if (_0x13b558 === 'image' || _0x13b558 === 'reference') {
            const _0x454fcf = {};
            if (_0x13b558 === 'image')
              (_0x34a655.firstFrame && (_0x454fcf.firstFrame = _0x34a655.firstFrame),
                _0x34a655.lastFrame && (_0x454fcf.lastFrame = _0x34a655.lastFrame));
            else _0x34a655.referenceImage && (_0x454fcf.referenceImage = _0x34a655.referenceImage);
            Object.keys(_0x454fcf).length > 0 && (_0x20bdc6.inputUrlsBySlot = _0x454fcf);
          }
          return _0x20bdc6;
        }
        if (isKlingO1VideoModel(_0x6f1f7c, _0x3de15f)) {
          const _0xe386e4 = getFixedInputSlotConfigFromManifest(this._data || {}),
            _0x8c3cc6 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: _0xe386e4,
              imageRefs: _0x5ed361,
              assetInputRefs: _0x59d9e9,
            }),
            _0x27628d = [],
            _0x913094 = (_0x5dcd5e) => {
              const _0x26b471 = String(_0x5dcd5e || '').trim();
              _0x26b471 && !_0x27628d.includes(_0x26b471) && _0x27628d.push(_0x26b471);
            };
          (_0x913094(_0x8c3cc6.referenceImage), _0x342d8f.forEach(_0x913094));
          const _0x5e81d1 = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: _0xe386e4,
              refs: _0x526688,
              assetInputRefs: _0x59d9e9,
              kind: 'video',
            }),
            _0x56a852 = !!_0x5e81d1.editVideo,
            _0x201b28 = !!_0x5e81d1.featureReferenceVideo,
            _0x5e2672 = [],
            _0x545c25 = (_0x3d86f4) => {
              const _0x839a85 = String(_0x3d86f4 || '').trim();
              _0x839a85 && !_0x5e2672.includes(_0x839a85) && _0x5e2672.push(_0x839a85);
            };
          (_0x545c25(_0x5e81d1.editVideo),
            _0x545c25(_0x5e81d1.featureReferenceVideo),
            _0x5bc234.forEach(_0x545c25));
          const _0x22c298 = buildKlingO1MediaPayload({
            prompt: _0x20bdc6.prompt,
            images: _0x27628d,
            videos: _0x5e2672,
            videoEntries: _0xb7a3dd,
            videoRole: _0x201b28 ? 'feature' : 'base',
            hasEditVideo: _0x56a852,
            hasFeatureVideo: _0x201b28,
          });
          if (!_0x22c298.ok) return (window.showToast?.(_0x22c298.message, 'warn'), null);
          return (
            (_0x20bdc6.prompt = _0x22c298.prompt),
            (_0x20bdc6.images = _0x22c298.images),
            (_0x20bdc6.videos = _0x22c298.videos),
            (_0x20bdc6.audios = []),
            (_0x20bdc6.inputUrls = _0x22c298.inputUrls),
            _0x22c298.videoRole
              ? (_0x20bdc6.klingO1VideoRole = _0x22c298.videoRole)
              : delete _0x20bdc6.klingO1VideoRole,
            _0x20bdc6
          );
        }
        ((_0x20bdc6.images = _0x342d8f),
          (_0x20bdc6.videos = _0x5bc234),
          (_0x20bdc6.audios = _0x1abed4),
          (_0x20bdc6.inputUrls = _0x342d8f));
        _0x500e7f.length > 0 && (_0x20bdc6.providerAssetRefs = _0x500e7f);
        const _0x1fa066 = getFixedInputSlotConfigFromManifest(this._data || {}),
          _0x51c119 = buildVideoInputUrlsByFixedImageSlot({
            fixedInputConfig: _0x1fa066,
            imageRefs: _0x5ed361,
            assetInputRefs: _0x59d9e9,
          });
        Object.keys(_0x51c119).length > 0 && (_0x20bdc6.inputUrlsBySlot = _0x51c119);
      }
      return _0x20bdc6;
    }
  }
  return _0x34e28e.prototype;
}
