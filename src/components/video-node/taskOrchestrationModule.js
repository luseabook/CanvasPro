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
function videoTaskText(value, item = {}) {
  return t('videoTask.' + value, item);
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
function normalizeTaskStatus(key) {
  return String(key || '')
    .trim()
    .toLowerCase();
}
function mapDreaminaSnapshotToTaskCenterStatus(response = {}) {
  const index = String(response?.phase || '')
      .trim()
      .toLowerCase(),
    result = String(response?.status || '')
      .trim()
      .toLowerCase();
  if (index === 'done' || result === 'success') return 'complete';
  if (index === 'cancelled' || result === 'cancelled' || result === 'canceled') return 'cancelled';
  if (index === 'failed' || result === 'failed') return 'failed';
  if (index === 'queued' || index === 'pending') return 'waiting';
  return 'processing';
}
function buildDreaminaTaskCenterMessage(options = {}) {
  const data = String(options?.label || '').trim(),
    count = Number(options?.queueIndex),
    count2 = Number(options?.queueLength);
  if (Number.isFinite(count) && count >= 0 && Number.isFinite(count2) && count2 > 0)
    return (
      (data || videoTaskText('task.queueing')) + ' ' + (Math.trunc(count) + 1) + '/' + Math.trunc(count2)
    );
  return data || '';
}
function isDreaminaUploadDurationErrorMessage(target) {
  const source = String(target || '').trim();
  return source.startsWith('上传源视频失败：') || source.startsWith('上传源音频失败：');
}
function pickVideoAdaptiveSourceSize({ inEdges: inEdges = [], nodes: nodes = {} } = {}) {
  const list = [],
    list2 = [];
  for (const nodeId of inEdges) {
    const nodeData2 = nodes?.[nodeId?.sourceId];
    if (!nodeData2) continue;
    const list3 = String(nodeData2?.type || '').toLowerCase(),
      box = getGenerationRatioSizeWithDom({
        nodeId: nodeId?.sourceId,
        nodeData: nodeData2,
        edge: nodeId,
        includeNodeFrame: true,
      });
    if (!(box?.width > 0 && box?.height > 0)) continue;
    if (list3.includes('image')) list.push(box);
    else {
      if (list3.includes('video')) list2.push(box);
    }
  }
  return list[0] || list2[0] || null;
}
function findVideoAspectRatioField(next) {
  return (Array.isArray(next?.uiSchema?.fields) ? next.uiSchema.fields : []).find((item2) => {
    const current = String(item2?.id || '').trim(),
      entry = String(item2?.displayRole || '').trim();
    return current === 'aspectRatio' || entry === 'aspectRatio';
  });
}
function pickManifestDefaultVideoRatio(record) {
  const videoAspectRatioField = findVideoAspectRatioField(record),
    handle = Array.isArray(videoAspectRatioField?.options) ? videoAspectRatioField.options : [];
  for (const el of handle) {
    const list4 = String(el?.value ?? el ?? '').trim();
    if (list4 && list4.includes(':') && !isAdaptiveRatioLabel(list4)) return list4;
  }
  return '';
}
function resolveVideoAspectRatioInput({
  nodeData: nodeData = {},
  payload: payload = {},
  modelManifest: modelManifest = null,
} = {}) {
  const state =
      nodeData?.generationParams &&
      typeof nodeData.generationParams === 'object' &&
      !Array.isArray(nodeData.generationParams)
        ? nodeData.generationParams
        : {},
    config =
      payload?.generationParams &&
      typeof payload.generationParams === 'object' &&
      !Array.isArray(payload.generationParams)
        ? payload.generationParams
        : {};
  if (Object.prototype.hasOwnProperty.call(state, 'aspectRatio')) return state.aspectRatio;
  const scope = String(findVideoAspectRatioField(modelManifest)?.id || '').trim();
  if (scope && Object.prototype.hasOwnProperty.call(state, scope)) return state[scope];
  if (Object.prototype.hasOwnProperty.call(nodeData || {}, 'aspectRatio')) return nodeData.aspectRatio;
  if (Object.prototype.hasOwnProperty.call(config, 'aspectRatio')) return config.aspectRatio;
  if (scope && Object.prototype.hasOwnProperty.call(config, scope)) return config[scope];
  if (Object.prototype.hasOwnProperty.call(payload || {}, 'aspectRatio')) return payload.aspectRatio;
  if (scope && Object.prototype.hasOwnProperty.call(payload || {}, scope)) return payload[scope];
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
  const width = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (width?.width > 0 && width?.height > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: width.width,
      height: width.height,
    });
  const width2 = Number(nodeData?.width || 0),
    height = Number(nodeData?.height || 0);
  if (Number.isFinite(width2) && width2 > 0 && Number.isFinite(height) && height > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: width2,
      height: height,
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
  const width3 = Number(nodeData?.width || 0),
    height2 = Number(nodeData?.height || 0);
  if (Number.isFinite(width3) && width3 > 0 && Number.isFinite(height2) && height2 > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: width3,
      height: height2,
    });
  const width4 = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (width4?.width > 0 && width4?.height > 0)
    return pickClosestRatioForProviderModel({
      provider: provider,
      model: model,
      width: width4.width,
      height: width4.height,
    });
  return pickManifestDefaultVideoRatio(modelManifest);
}
function applyModelApiVideoAdaptiveRatio(payload2, nodeData3 = {}) {
  const modelManifest2 = nodeData3?.modelManifest || null;
  if (!findVideoAspectRatioField(modelManifest2)) return payload2;
  const videoAspectRatioInput = resolveVideoAspectRatioInput({
    nodeData: nodeData3?.nodeData,
    payload: payload2,
    modelManifest: modelManifest2,
  });
  if (!isAdaptiveRatioLabel(videoAspectRatioInput)) return payload2;
  const modelApiVideoAdaptiveRatio = resolveModelApiVideoAdaptiveRatio(nodeData3);
  return (
    modelApiVideoAdaptiveRatio &&
      !isAdaptiveRatioLabel(modelApiVideoAdaptiveRatio) &&
      (payload2.resolvedRatioLabel = modelApiVideoAdaptiveRatio),
    payload2
  );
}
function applyVideoManifestAdaptiveRatio(payload3, nodeData4 = {}) {
  const modelManifest3 = nodeData4?.modelManifest || null;
  if (!findVideoAspectRatioField(modelManifest3)) return payload3;
  const videoAspectRatioInput2 = resolveVideoAspectRatioInput({
    nodeData: nodeData4?.nodeData,
    payload: payload3,
    modelManifest: modelManifest3,
  });
  if (!isAdaptiveRatioLabel(videoAspectRatioInput2)) return payload3;
  const videoManifestAdaptiveRatio = resolveVideoManifestAdaptiveRatio(nodeData4);
  return (
    videoManifestAdaptiveRatio &&
      !isAdaptiveRatioLabel(videoManifestAdaptiveRatio) &&
      (payload3.resolvedRatioLabel = videoManifestAdaptiveRatio),
    payload3
  );
}
function pickDreaminaAdaptiveSourceRatio({
  inEdges: inEdges = [],
  nodes: nodes = {},
  provider: provider = '',
  model: model = '',
} = {}) {
  const width5 = pickVideoAdaptiveSourceSize({ inEdges: inEdges, nodes: nodes });
  if (!width5) return '';
  return pickClosestRatioForProviderModel({
    provider: provider,
    model: model,
    width: width5.width,
    height: width5.height,
  });
}
function isHappyHorseVideoModel(input, output) {
  return isModelUsingBodyResolver(input, output, HAPPYHORSE_BODY_RESOLVERS);
}
function isModelUsingBodyResolver(value2, providerHint, map = new Set()) {
  const modelExecution =
      resolveModelExecution(value2, { providerHint: providerHint }) || resolveModelExecution(value2),
    value3 = String(modelExecution?.executionManifest?.extensions?.bodyResolver || '').trim();
  return value3 && map.has(value3);
}
function getHappyHorseVideoInputMaxSeconds(value4, providerHint2) {
  const modelExecution2 =
      resolveModelExecution(value4, { providerHint: providerHint2 }) || resolveModelExecution(value4),
    value5 = String(modelExecution2?.executionManifest?.extensions?.bodyResolver || '').trim();
  return value5 === 'runninghubHappyHorseVideo' ? 60 : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
}
function isWan27VideoModel(value6, value7) {
  return isModelUsingBodyResolver(value6, value7, WAN27_BODY_RESOLVERS);
}
function isKlingV3OmniVideoModel(value8, providerHint3) {
  const modelExecution3 =
      resolveModelExecution(value8, { providerHint: providerHint3 }) || resolveModelExecution(value8),
    value9 = String(
      modelExecution3?.canonicalModelId || modelExecution3?.modelManifest?.modelId || value8 || '',
    ).trim(),
    enabled = String(modelExecution3?.modelManifest?.provider || providerHint3 || '')
      .trim()
      .toLowerCase();
  return value9 === APIMART_KLING_V3_OMNI_MODEL_ID && (!enabled || enabled === 'apimart');
}
function isKlingO1VideoModel(value10, providerHint4) {
  const modelExecution4 =
      resolveModelExecution(value10, { providerHint: providerHint4 }) || resolveModelExecution(value10),
    value11 = String(
      modelExecution4?.canonicalModelId || modelExecution4?.modelManifest?.modelId || value10 || '',
    ).trim(),
    enabled2 = String(modelExecution4?.modelManifest?.provider || providerHint4 || '')
      .trim()
      .toLowerCase();
  return value11 === APIMART_KLING_O1_MODEL_ID && (!enabled2 || enabled2 === 'apimart');
}
function getPlainObject(value12) {
  return value12 && typeof value12 === 'object' && !Array.isArray(value12) ? value12 : {};
}
function normalizeSubmitRandomSeedMode(value13, value14 = 'fixed') {
  const value15 = String(value13 ?? value14)
    .trim()
    .toLowerCase();
  return value15 === 'random' ? 'random' : 'fixed';
}
function getSubmitRandomSeedParam(value16, value17, value18) {
  const value19 = String(value17 || '').trim();
  if (value19 && Object.prototype.hasOwnProperty.call(value16 || {}, value19)) return value16[value19];
  return value18;
}
function generateSubmitRandomSeed(options2 = {}) {
  const value20 = Number.isFinite(Number(options2?.randomSeedMin))
      ? Math.trunc(Number(options2.randomSeedMin))
      : Number.isFinite(Number(options2?.min))
        ? Math.trunc(Number(options2.min))
        : 0,
    value21 = Number.isFinite(Number(options2?.randomSeedMax))
      ? Math.trunc(Number(options2.randomSeedMax))
      : Number.isFinite(Number(options2?.max))
        ? Math.trunc(Number(options2.max))
        : 0x7fffffff,
    value22 = Math.min(value20, value21),
    value23 = Math.max(value20, value21);
  return String(value22 + Math.floor(Math.random() * (value23 - value22 + 1)));
}
function buildSubmitRandomizedSeedPatch({
  modelManifest: modelManifest = null,
  nodeData: nodeData = {},
  payload: payload = {},
} = {}) {
  const list5 = Array.isArray(modelManifest?.uiSchema?.fields) ? modelManifest.uiSchema.fields : [],
    list6 = list5.filter((item3) => {
      if (item3?.randomizeOnSubmit !== true) return false;
      const value24 = String(item3?.id || '').trim();
      return value24 && String(item3?.variant || '') === 'randomSeedRow';
    });
  if (list6.length === 0) return null;
  let generationParams = {
      ...getPlainObject(nodeData?.generationParams),
      ...getPlainObject(payload?.generationParams),
    },
    requestParams = null,
    enabled3 = false;
  list6.forEach((item4) => {
    const value25 = String(item4?.id || '').trim(),
      value26 = String(item4?.randomSeedModeField || '').trim(),
      value27 = String(item4?.randomSeedDefaultMode || 'fixed').trim() || 'fixed',
      value28 = value26
        ? normalizeSubmitRandomSeedMode(getSubmitRandomSeedParam(generationParams, value26, value27), value27)
        : 'random';
    if (value28 !== 'random') return;
    const generateSubmitRandomSeed2 = generateSubmitRandomSeed(item4);
    ((generationParams = {
      ...generationParams,
      [value25]: generateSubmitRandomSeed2,
      ...(value26 ? { [value26]: 'random' } : {}),
    }),
      (requestParams = {
        ...(requestParams || generationParams),
        [value25]: generateSubmitRandomSeed2,
        ...(value26 ? { [value26]: 'fixed' } : {}),
      }),
      (enabled3 = true));
  });
  if (!enabled3) return null;
  const value29 = String(payload?.model || nodeData?.model || modelManifest?.modelId || '').trim(),
    storePatch = { generationParams: generationParams };
  return (
    value29 &&
      (storePatch.generationParamsByModel = {
        ...getPlainObject(nodeData?.generationParamsByModel),
        [value29]: generationParams,
      }),
    { requestParams: requestParams || generationParams, storePatch: storePatch }
  );
}
function normalizeHappyHorseMode(value30) {
  const value31 = String(value30 || '')
    .trim()
    .toLowerCase();
  return value31 === 'image' || value31 === 'reference' || value31 === 'edit' ? value31 : 'auto';
}
function getHappyHorseMode(options3 = {}) {
  const plainObject = getPlainObject(options3?.generationParams);
  return normalizeHappyHorseMode(plainObject.happyhorse_mode ?? options3?.happyhorse_mode);
}
function normalizeWan27Mode(value32) {
  const value33 = String(value32 || '')
    .trim()
    .toLowerCase();
  return value33 === 'video' || value33 === 'reference' || value33 === 'edit' ? value33 : 'image';
}
function getWan27Mode(options4 = {}) {
  const plainObject2 = getPlainObject(options4?.generationParams);
  return normalizeWan27Mode(plainObject2.wan27_mode ?? options4?.wan27_mode);
}
function normalizeKlingV3OmniMode(value34) {
  const value35 = String(value34 || '')
    .trim()
    .toLowerCase();
  return value35 === 'reference' || value35 === 'edit' ? value35 : 'image';
}
function getKlingV3OmniMode(options5 = {}) {
  const plainObject3 = getPlainObject(options5?.generationParams);
  return normalizeKlingV3OmniMode(plainObject3.kling_v3_omni_mode ?? options5?.kling_v3_omni_mode);
}
function normalizeMediaDurationSeconds(...args) {
  for (const value36 of args) {
    const count3 = Number(value36);
    if (Number.isFinite(count3) && count3 > 0) return count3;
  }
  return 0;
}
function getVideoDurationFromSource(options6 = {}, value37 = null) {
  return normalizeMediaDurationSeconds(
    value37?.videoDuration,
    value37?.duration,
    options6?.videoDuration,
    options6?.duration,
  );
}
function getVideoDurationFromAssetRef(options7 = {}) {
  return normalizeMediaDurationSeconds(
    options7?.videoDuration,
    options7?.duration,
    options7?.nodeData?.videoDuration,
    options7?.nodeData?.duration,
  );
}
function normalizeMediaSizeBytes(...args2) {
  for (const value38 of args2) {
    const count4 = Number(value38);
    if (Number.isFinite(count4) && count4 > 0) return count4;
  }
  return 0;
}
function getAudioDurationFromSource(options8 = {}) {
  return normalizeMediaDurationSeconds(options8?.audioDuration, options8?.duration);
}
function getAudioDurationFromAssetRef(options9 = {}) {
  return normalizeMediaDurationSeconds(
    options9?.audioDuration,
    options9?.duration,
    options9?.nodeData?.audioDuration,
    options9?.nodeData?.duration,
  );
}
function getAudioSizeBytesFromSource(options10 = {}) {
  return normalizeMediaSizeBytes(
    options10?.audioSizeBytes,
    options10?.audioByteSize,
    options10?.fileSize,
    options10?.sizeBytes,
    options10?.byteSize,
  );
}
function getAudioSizeBytesFromAssetRef(options11 = {}) {
  return normalizeMediaSizeBytes(
    options11?.audioSizeBytes,
    options11?.audioByteSize,
    options11?.fileSize,
    options11?.sizeBytes,
    options11?.byteSize,
    options11?.nodeData?.audioSizeBytes,
    options11?.nodeData?.audioByteSize,
    options11?.nodeData?.fileSize,
    options11?.nodeData?.sizeBytes,
    options11?.nodeData?.byteSize,
  );
}
function buildVideoInputUrlsByFixedKindSlot({
  fixedInputConfig: fixedInputConfig = null,
  refs: refs = [],
  assetInputRefs: assetInputRefs = [],
  kind: kind = 'image',
} = {}) {
  const kind2 = String(kind || '').trim(),
    list7 = (fixedInputConfig?.visibleSlots || [])
      .map((item5) => String(item5 || '').trim())
      .filter((item6) => item6 && String(fixedInputConfig?.slotKindById?.[item6] || '') === kind2);
  if (list7.length === 0) return {};
  const occupiedSlots = {},
    map2 = new Set(),
    handler = (value39, value40) => {
      const enabled4 = String(value39 || '').trim(),
        enabled5 = String(value40 || '').trim();
      if (!enabled4 || !enabled5 || occupiedSlots[enabled4]) return false;
      if (!list7.includes(enabled4)) return false;
      return ((occupiedSlots[enabled4] = enabled5), map2.add(enabled5), true);
    },
    handler2 = (refSlot, { allowAuto: allowAuto = true } = {}) => {
      const enabled6 = String(refSlot?.url || '').trim();
      if (!enabled6 || map2.has(enabled6)) return false;
      const effectiveInputKind = resolveEffectiveInputKind(refSlot) || refSlot?.type || kind2;
      if (String(effectiveInputKind || '').trim() !== kind2) return false;
      const fixedInputSlotForRef = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: refSlot?.refSlot,
        kind: kind2,
        occupiedSlots: occupiedSlots,
        sourceNode: refSlot?.nodeData || refSlot,
      });
      if (!allowAuto && fixedInputSlotForRef.reason !== 'explicit') return false;
      return handler(fixedInputSlotForRef.slot, enabled6);
    },
    handler3 = (value41) => {
      const url = String(value41 || '').trim();
      if (!url || map2.has(url)) return false;
      const fixedInputSlotForRef2 = resolveFixedInputSlotForRef({
        fixedInputConfig: fixedInputConfig,
        refSlot: '',
        kind: kind2,
        occupiedSlots: occupiedSlots,
        sourceNode: { type: kind2, url: url },
      });
      return handler(fixedInputSlotForRef2.slot, url);
    },
    list8 = [...(Array.isArray(refs) ? refs : []), ...(Array.isArray(assetInputRefs) ? assetInputRefs : [])];
  return (
    list8.forEach((item7) => {
      handler2(item7, { allowAuto: false });
    }),
    (Array.isArray(refs) ? refs : []).forEach((item8) => {
      handler2(item8);
    }),
    (Array.isArray(assetInputRefs) ? assetInputRefs : []).forEach((response2) => {
      const effectiveInputKind2 = resolveEffectiveInputKind(response2) || response2?.type;
      if (effectiveInputKind2 === kind2) handler3(response2?.url);
    }),
    occupiedSlots
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
  const enabled7 = String(prompt || '').trim();
  if (!enabled7) return { ok: false, message: videoTaskText('validation.happyHorse.promptRequired') };
  const images2 = Array.from(
      new Set(
        (Array.isArray(images) ? images : []).map((item9) => String(item9 || '').trim()).filter(Boolean),
      ),
    ),
    list9 = Array.from(
      new Set(
        (Array.isArray(videos) ? videos : []).map((item10) => String(item10 || '').trim()).filter(Boolean),
      ),
    ),
    happyHorseMode = normalizeHappyHorseMode(mode),
    enabled8 = images2.length > 0 || list9.length > 0,
    value42 = { ok: true, images: [], videos: [], inputUrls: [], mode: 'auto' },
    hint = assetVideoCount > 0 ? videoTaskText('validation.removePromptVideoRefs') : '';
  if (happyHorseMode === 'auto') {
    if (images2.length > 0 || list9.length > 0)
      return { ok: false, message: videoTaskText('validation.happyHorse.chooseMode') };
    return value42;
  }
  if (happyHorseMode === 'image') {
    if (list9.length > 0)
      return { ok: false, message: videoTaskText('validation.imageModeRejectsVideo', { hint: hint }) };
    if (!images2[0]) {
      if (!enabled8) return value42;
      return { ok: false, message: videoTaskText('validation.imageModeNeedsFirstFrame') };
    }
    return {
      ok: true,
      images: images2.slice(0, 1),
      videos: [],
      inputUrls: images2.slice(0, 1),
      mode: 'image',
    };
  }
  if (happyHorseMode === 'reference') {
    if (list9.length > 0)
      return {
        ok: false,
        message: videoTaskText('validation.referenceImageModeRejectsVideo', { hint: hint }),
      };
    if (images2.length <= 0) {
      if (!enabled8) return value42;
      return { ok: false, message: videoTaskText('validation.referenceImageModeNeedsReference') };
    }
    const images3 = images2.slice(0, 9);
    return { ok: true, images: images3, videos: [], inputUrls: images3, mode: 'reference' };
  }
  if (!list9[0]) {
    if (!enabled8) return value42;
    return { ok: false, message: videoTaskText('validation.videoEditNeedsVideo') };
  }
  const value43 = list9[0],
    value44 =
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (response3) => String(response3?.url || '').trim() === value43,
      ) || {},
    mediaDurationSeconds = normalizeMediaDurationSeconds(value44.duration),
    count5 = Number(maxVideoSeconds),
    seconds = Number.isFinite(count5) && count5 > 0 ? count5 : HAPPYHORSE_VIDEO_INPUT_MAX_SECONDS;
  if (mediaDurationSeconds > seconds)
    return {
      ok: false,
      message: videoTaskText('validation.happyHorse.editVideoMaxSeconds', { seconds: seconds }),
    };
  return {
    ok: true,
    images: images2.slice(0, 5),
    videos: [value43],
    inputUrls: images2.slice(0, 5),
    mode: 'edit',
  };
}
function orderHappyHorseImageUrls({
  mode: mode = 'auto',
  images: images = [],
  slotUrls: slotUrls = {},
} = {}) {
  const happyHorseMode2 = normalizeHappyHorseMode(mode),
    list10 = [],
    handler4 = (value45) => {
      const value46 = String(value45 || '').trim();
      if (value46 && !list10.includes(value46)) list10.push(value46);
    };
  if (happyHorseMode2 === 'image') handler4(slotUrls.firstFrame);
  else {
    if (happyHorseMode2 === 'reference') handler4(slotUrls.referenceImage);
    else happyHorseMode2 === 'edit' && handler4(slotUrls.editRefImage);
  }
  return ((Array.isArray(images) ? images : []).forEach(handler4), list10);
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
  const wan27Mode = normalizeWan27Mode(mode),
    handler5 = (value47) =>
      Array.from(
        new Set(
          (Array.isArray(value47) ? value47 : [])
            .map((item11) => String(item11 || '').trim())
            .filter(Boolean),
        ),
      ),
    list11 = handler5(images),
    videos2 = handler5(videos),
    list12 = handler5(audios),
    hint2 = assetVideoCount > 0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    handler6 = (enabled9) => {
      if (!enabled9) return null;
      const value48 =
          (Array.isArray(audioEntries) ? audioEntries : []).find(
            (response4) => String(response4?.url || '').trim() === enabled9,
          ) || {},
        mediaDurationSeconds2 = normalizeMediaDurationSeconds(value48.duration);
      if (
        mediaDurationSeconds2 > 0 &&
        (mediaDurationSeconds2 < WAN27_AUDIO_INPUT_MIN_SECONDS ||
          mediaDurationSeconds2 > WAN27_AUDIO_INPUT_MAX_SECONDS)
      )
        return videoTaskText('validation.wan27.audioDuration');
      const mediaSizeBytes = normalizeMediaSizeBytes(value48.sizeBytes);
      if (mediaSizeBytes > WAN27_AUDIO_INPUT_MAX_BYTES) return videoTaskText('validation.wan27.audioSize');
      return null;
    },
    handler7 = (value49) =>
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (response5) => String(response5?.url || '').trim() === value49,
      ) || {},
    handler8 = (value50) => normalizeMediaDurationSeconds(handler7(value50).duration);
  if (wan27Mode === 'video') {
    if (list11.length > 0)
      return { ok: false, message: videoTaskText('validation.videoExtendRejectsImage', { hint: hint2 }) };
    if (list12.length > 0) return { ok: false, message: videoTaskText('validation.videoExtendRejectsAudio') };
    if (!videos2[0]) return { ok: true, images: [], videos: [], audios: [], inputUrls: [] };
    const value51 = videos2[0],
      value52 = handler8(value51);
    if (value52 > WAN27_VIDEO_EXTEND_MAX_SECONDS)
      return { ok: false, message: videoTaskText('validation.wan27.extendMaxSeconds') };
    return { ok: true, images: [], videos: [value51], audios: [], inputUrls: [] };
  }
  if (wan27Mode === 'reference') {
    const images4 = list11.slice(0, 1),
      videos3 = videos2.slice(0, 1);
    if (images4.length <= 0 && videos3.length <= 0)
      return { ok: false, message: videoTaskText('validation.referenceVideoNeedsMedia') };
    const value53 = videos3[0] || '',
      value54 = handler8(value53);
    if (value54 > WAN27_REFERENCE_VIDEO_MAX_SECONDS)
      return { ok: false, message: videoTaskText('validation.wan27.referenceVideoMaxSeconds') };
    const audios2 = list12[0] || '',
      message = handler6(audios2);
    if (message) return { ok: false, message: message };
    if (audios2 && images4.length <= 0)
      return { ok: false, message: videoTaskText('validation.referenceAudioNeedsImage') };
    return {
      ok: true,
      images: images4,
      videos: videos3,
      audios: audios2 ? [audios2] : [],
      inputUrls: images4,
    };
  }
  if (wan27Mode === 'edit') {
    if (!videos2[0]) return { ok: false, message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (list11.length > 0)
      return { ok: false, message: videoTaskText('validation.videoEditRejectsImageUseReferenceVideo') };
    if (list12.length > 0) return { ok: false, message: videoTaskText('validation.videoEditRejectsAudio') };
    const value55 = videos2[0],
      count6 = handler8(value55);
    if (count6 > 0 && (count6 < WAN27_EDIT_VIDEO_MIN_SECONDS || count6 > WAN27_EDIT_VIDEO_MAX_SECONDS))
      return { ok: false, message: videoTaskText('validation.wan27.editVideoDuration') };
    return { ok: true, images: [], videos: videos2.slice(0, 2), audios: [], inputUrls: [] };
  }
  if (videos2.length > 0)
    return { ok: false, message: videoTaskText('validation.imageModeRejectsVideo', { hint: hint2 }) };
  const audios3 = list12[0] || '',
    message2 = handler6(audios3);
  if (message2) return { ok: false, message: message2 };
  const images5 = list11.slice(0, 2);
  return {
    ok: true,
    images: images5,
    videos: [],
    audios: audios3 ? [audios3] : [],
    inputUrls: images5,
  };
}
function buildKlingV3OmniMediaPayload({
  mode: mode = 'image',
  images: images = [],
  videos: videos = [],
  videoEntries: videoEntries = [],
  assetVideoCount: assetVideoCount = 0,
} = {}) {
  const klingV3OmniMode = normalizeKlingV3OmniMode(mode),
    handler9 = (value56) =>
      Array.from(
        new Set(
          (Array.isArray(value56) ? value56 : [])
            .map((item12) => String(item12 || '').trim())
            .filter(Boolean),
        ),
      ),
    images6 = handler9(images),
    list13 = handler9(videos),
    hint3 = assetVideoCount > 0 ? videoTaskText('validation.removePromptVideoRefs') : '',
    handler10 = (value57) =>
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (response6) => String(response6?.url || '').trim() === value57,
      ) || {},
    handler11 = (value58) => normalizeMediaDurationSeconds(handler10(value58).duration);
  if (klingV3OmniMode === 'reference') {
    const images7 = images6.slice(0, 1),
      videos4 = list13.slice(0, 1);
    if (images7.length <= 0 && videos4.length <= 0)
      return { ok: false, message: videoTaskText('validation.referenceVideoNeedsMedia') };
    return { ok: true, images: images7, videos: videos4, audios: [], inputUrls: images7 };
  }
  if (klingV3OmniMode === 'edit') {
    if (!list13[0]) return { ok: false, message: videoTaskText('validation.videoEditNeedsSourceVideo') };
    if (images6.length > 0) return { ok: false, message: videoTaskText('validation.videoEditRejectsImage') };
    const value59 = list13[0],
      count7 = handler11(value59);
    if (
      count7 > 0 &&
      (count7 < KLING_V3_OMNI_VIDEO_MIN_SECONDS || count7 > KLING_V3_OMNI_EDIT_VIDEO_MAX_SECONDS)
    )
      return { ok: false, message: videoTaskText('validation.klingV3Omni.editVideoDuration') };
    return { ok: true, images: [], videos: [value59], audios: [], inputUrls: [] };
  }
  if (list13.length > 0)
    return { ok: false, message: videoTaskText('validation.imageModeRejectsVideo', { hint: hint3 }) };
  return {
    ok: true,
    images: images6.slice(0, 2),
    videos: [],
    audios: [],
    inputUrls: images6.slice(0, 2),
  };
}
function replaceKlingO1PromptImageReferences(value60, value61) {
  const count8 = Math.max(0, Math.trunc(Number(value61) || 0));
  if (count8 <= 0) return String(value60 || '');
  return String(value60 || '').replace(/@?图片\s*([1-9]\d*)/g, (value62, value63) => {
    const count9 = Number.parseInt(String(value63 || ''), 10);
    if (!Number.isFinite(count9) || count9 < 1 || count9 > count8) return value62;
    return '<<<image_' + count9 + '>>>';
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
  const run = (value64) =>
      Array.from(
        new Set(
          (Array.isArray(value64) ? value64 : [])
            .map((item13) => String(item13 || '').trim())
            .filter(Boolean),
        ),
      ),
    list14 = run(images),
    list15 = run(videos),
    value65 = String(videoRole || '').trim() === 'feature' ? 'feature' : 'base',
    handler12 = (value66) =>
      (Array.isArray(videoEntries) ? videoEntries : []).find(
        (response7) => String(response7?.url || '').trim() === value66,
      ) || {},
    handler13 = (value67) => normalizeMediaDurationSeconds(handler12(value67).duration);
  if (hasEditVideo && hasFeatureVideo)
    return { ok: false, message: videoTaskText('validation.klingO1.editAndFeatureExclusive') };
  if (list15.length > 1) return { ok: false, message: videoTaskText('validation.klingO1.onlyOneVideo') };
  const value68 = list15[0] || '';
  if (value68) {
    const count10 = handler13(value68);
    if (count10 > 0 && (count10 < KLING_O1_VIDEO_MIN_SECONDS || count10 > KLING_O1_VIDEO_MAX_SECONDS))
      return { ok: false, message: videoTaskText('validation.klingO1.referenceVideoDuration') };
    if (value65 === 'base') {
      if (list14.length > 0)
        return { ok: false, message: videoTaskText('validation.klingO1.editVideoRejectsImage') };
      return {
        ok: true,
        prompt: replaceKlingO1PromptImageReferences(prompt, 0),
        images: [],
        videos: [value68],
        inputUrls: [],
        videoRole: 'base',
      };
    }
    if (list14.length > 1)
      return { ok: false, message: videoTaskText('validation.klingO1.featureVideoMaxOneImage') };
    const images8 = list14.slice(0, 1);
    return {
      ok: true,
      prompt: replaceKlingO1PromptImageReferences(prompt, images8.length),
      images: images8,
      videos: [value68],
      inputUrls: images8,
      videoRole: 'feature',
    };
  }
  const images9 = list14.slice(0, 2);
  return {
    ok: true,
    prompt: replaceKlingO1PromptImageReferences(prompt, images9.length),
    images: images9,
    videos: [],
    inputUrls: images9,
    videoRole: '',
  };
}
export function createVideoNodeTaskOrchestrationModule(value69) {
  const {
      store: store,
      api: api,
      getImage: getImage,
      startLoading: startLoading,
      stopLoading: stopLoading,
      ensureConfig: ensureConfig,
      getProviderConfig: getProviderConfig,
      isVideoVipModel: isVideoVipModel,
      ensureVipSessionRecheck: ensureVipSessionRecheck,
    } = value69,
    value70 = 'DREAMINA_POLL_TIMEOUT',
    maxWaitMs = 20 * 60 * 0x3e8,
    intervalMs = 20 * 0x3e8,
    maxWaitMs2 = 24 * 60 * 60 * 0x3e8,
    handler14 = () => (typeof store.getStateRaw === 'function' ? store.getStateRaw() : store.getState());
  class value71 {
    ['_isDreaminaPollTimeoutError'](error2) {
      const value72 = String(error2?.code || '')
        .trim()
        .toUpperCase();
      if (value72 === value70 || value72 === 'TIMEOUT') return true;
      const value73 = String(error2?.type || '')
        .trim()
        .toUpperCase();
      if (value73 === 'TIMEOUT' || value73 === 'TASK_TIMEOUT') return true;
      const list16 = String(error2?.message || '')
        .trim()
        .toLowerCase();
      return list16.includes('timeout') || list16.includes('超时');
    }
    ['_buildDreaminaBackgroundPendingSnapshot'](submitId2 = '') {
      return this._buildDreaminaPendingSnapshot({
        submitId: submitId2,
        phase: 'generating',
        label: videoTaskText('task.backgroundQueueing'),
      });
    }
    ['_showDreaminaBackgroundQueueingToast'](value74 = '') {
      const value75 =
        String(value74 || '').trim() ||
        String(store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim() ||
        String(this.nodeId || '').trim();
      if (value75 && dreaminaBackgroundQueueToastKeys.has(value75)) return;
      if (value75) dreaminaBackgroundQueueToastKeys.add(value75);
      window.showToast?.(videoTaskText('toasts.dreaminaBackgroundQueueing'), 'warning');
    }
    ['_resolveDreaminaAdaptiveAspectRatioFromNode'](model2 = this._data) {
      const width6 = Number(model2?.width || 0),
        height3 = Number(model2?.height || 0);
      return (
        pickClosestRatioForProviderModel({
          provider: resolveDreaminaStyleVideoProvider(model2?.model, model2?.provider),
          model: model2?.model,
          width: width6,
          height: height3,
        }) || '1:1'
      );
    }
    ['_hasResolvedVideoResult'](value76 = this._data) {
      const list17 = Array.isArray(value76?.videos) ? value76.videos : [];
      if (list17.length > 0) return true;
      return !!String(value76?.videoUrl || '').trim() || !!String(value76?.localPath || '').trim();
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
    ['_isDreaminaRecoverableRunningTask'](value77 = this._data) {
      if (!this._isDreaminaVideoNode(value77)) return false;
      const enabled10 = String(value77?.dreaminaSubmitId || '').trim();
      if (!enabled10) return false;
      const taskStatus = normalizeTaskStatus(value77?.jobStatus),
        taskStatus2 = normalizeTaskStatus(value77?.dreaminaTaskPhase),
        taskStatus3 = normalizeTaskStatus(value77?.dreaminaTaskStatus);
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(taskStatus)) return false;
      if (DREAMINA_NON_RECOVERABLE_PHASES.has(taskStatus2)) return false;
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(taskStatus3)) return false;
      return true;
    }
    ['_isStaleActiveDreaminaTask'](value78 = this._data) {
      if (!this._isGenerating) return false;
      if (value78?.dreaminaTaskRecovering === true) return false;
      if (this._dreaminaResumePromise) return false;
      const count11 = Number(
        value78?.dreaminaTaskLastCheckedAt ||
          value78?.dreaminaTaskStartedAt ||
          value78?.generationStartTime ||
          0,
      );
      if (!Number.isFinite(count11) || count11 <= 0) return false;
      return Date.now() - count11 >= DREAMINA_STALE_ACTIVE_RESUME_MS;
    }
    ['_shouldKeepDreaminaLoading'](value79 = store.getState().nodes?.[this.nodeId] || this._data || {}) {
      if (!this._isDreaminaVideoNode(value79)) return false;
      const taskStatus4 = normalizeTaskStatus(value79?.jobStatus),
        taskStatus5 = normalizeTaskStatus(value79?.dreaminaTaskPhase),
        taskStatus6 = normalizeTaskStatus(value79?.dreaminaTaskStatus);
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(taskStatus4)) return false;
      if (DREAMINA_NON_RECOVERABLE_PHASES.has(taskStatus5)) return false;
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(taskStatus6)) return false;
      if (value79?.isGenerating === true) return true;
      if (
        String(value79?.jobStatus || '')
          .trim()
          .toLowerCase() === 'running'
      )
        return true;
      if (value79?.dreaminaTaskRecovering === true) return true;
      if (this._dreaminaResumePromise) return true;
      return this._isDreaminaRecoverableRunningTask(value79);
    }
    ['_inferAsyncProviderFromModel'](value80, value81 = '') {
      const modelProvider = resolveModelProvider(value80, '', { allowProviderHint: false });
      if (modelProvider) return modelProvider;
      const value82 = String(value81 || '')
        .trim()
        .toLowerCase();
      if (value82) return value82;
      const list18 = String(value80 || '').trim();
      if (list18 && !list18.includes('/')) return 'grsai';
      return '';
    }
    ['_isRunningHubRecoverableRunningTask'](value83 = this._data) {
      if (!this._isRunninghubWorkflowModel(value83?.model, value83?.provider)) return false;
      const enabled11 = String(value83?.rhTaskId || '').trim();
      if (!enabled11) return false;
      const value84 = String(value83?.rhTaskStatus || '')
        .trim()
        .toLowerCase();
      if (value84 === 'success' || value84 === 'failed' || value84 === 'idle' || value84 === 'cancelled')
        return false;
      return true;
    }
    ['_isAsyncRecoverableRunningTask'](value85 = this._data) {
      const enabled12 = String(value85?.asyncTaskId || '').trim();
      if (!enabled12) return false;
      const enabled13 = this._inferAsyncProviderFromModel(
        value85?.model,
        value85?.asyncTaskProvider || value85?.provider || '',
      );
      if (
        !enabled13 ||
        enabled13 === 'runninghubwf' ||
        enabled13 === 'runninghub' ||
        enabled13 === 'dreamina'
      )
        return false;
      const value86 = String(value85?.asyncTaskKind || '')
        .trim()
        .toLowerCase();
      if (value86 && value86 !== 'video') return false;
      const value87 = String(value85?.asyncTaskStatus || '')
        .trim()
        .toLowerCase();
      if (value87 === 'success' || value87 === 'failed' || value87 === 'idle' || value87 === 'cancelled')
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
    async ['_buildResumePayload'](value88 = this._data, value89 = {}) {
      const value90 = value88 || {},
        model3 = String(value90?.model || '').trim(),
        provider2 = this._inferAsyncProviderFromModel(
          model3,
          value89?.providerHint || value90?.asyncTaskProvider || value90?.provider || '',
        );
      if (!model3 || !provider2) throw new Error(videoTaskText('errors.missingAsyncResumeModelOrProvider'));
      await ensureConfig();
      const value91 = getProviderConfig(provider2) || {},
        apiKey = String(
          provider2 === 'runninghub'
            ? value91.modelApiKey || value91.apiKey || ''
            : value91.apiKey || window._appApiKey || '',
        ).trim();
      return { nodeId: this.nodeId, model: model3, provider: provider2, apiKey: apiKey };
    }
    ['_syncLocalTaskNodeData']() {
      const value92 = store.getState().nodes?.[this.nodeId];
      if (value92) this._data = value92;
      return this._data || {};
    }
    ['_emitDreaminaTaskCenterUpdate'](options12 = {}, result2 = {}) {
      const taskId2 = String(
          options12?.submitId ||
            result2.taskId ||
            store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId ||
            '',
        ).trim(),
        value93 = globalThis.window;
      if (!taskId2 || typeof value93?.dispatchEvent !== 'function') return;
      const status2 = String(result2.status || mapDreaminaSnapshotToTaskCenterStatus(options12)).trim(),
        finishedAt = status2 === 'complete' || status2 === 'failed' || status2 === 'cancelled';
      value93.dispatchEvent(
        new CustomEvent(GENERATION_TASK_CENTER_EVENT, {
          detail: {
            taskId: taskId2,
            nodeId: this.nodeId,
            kind: 'dreaminaVideo',
            status: status2,
            progress: status2 === 'complete' ? 1 : status2 === 'waiting' ? 0 : 0.45,
            message: String(result2.message || buildDreaminaTaskCenterMessage(options12)).trim(),
            error:
              status2 === 'failed'
                ? String(result2.error || options12?.failReason || options12?.label || '').trim()
                : '',
            result: result2.result && typeof result2.result === 'object' ? result2.result : null,
            cancellable: true,
            createdAt: Number(
              result2.createdAt || store.getState().nodes?.[this.nodeId]?.dreaminaTaskStartedAt || Date.now(),
            ),
            startedAt: Number(
              result2.startedAt || store.getState().nodes?.[this.nodeId]?.dreaminaTaskStartedAt || 0,
            ),
            finishedAt: finishedAt ? Date.now() : 0,
          },
        }),
      );
    }
    ['_buildDreaminaTaskPatch'](dreaminaTaskLastRaw, dreaminaTaskRecovering = {}) {
      const value94 = {
        dreaminaSubmitId: String(dreaminaTaskLastRaw?.submitId || '').trim(),
        dreaminaTaskStatus: String(dreaminaTaskLastRaw?.status || 'pending').trim() || 'pending',
        dreaminaTaskPhase: String(dreaminaTaskLastRaw?.phase || 'generating').trim() || 'generating',
        dreaminaTaskLabel:
          String(dreaminaTaskLastRaw?.label || videoTaskText('task.generating')).trim() ||
          videoTaskText('task.generating'),
        dreaminaTaskLastCheckedAt: Number(dreaminaTaskLastRaw?.lastCheckedAt || Date.now()),
        dreaminaTaskRecovering: dreaminaTaskRecovering.recovering === true,
        dreaminaTaskLastRaw:
          dreaminaTaskLastRaw?.raw &&
          typeof dreaminaTaskLastRaw.raw === 'object' &&
          !Array.isArray(dreaminaTaskLastRaw.raw)
            ? dreaminaTaskLastRaw.raw
            : {},
      };
      return (
        dreaminaTaskRecovering.startedAt != null &&
          (value94.dreaminaTaskStartedAt = Number(dreaminaTaskRecovering.startedAt || 0)),
        value94
      );
    }
    ['_applyDreaminaTaskSnapshot'](value95, recovering2 = {}) {
      const value96 = store.getState().nodes?.[this.nodeId] || this._data || {},
        startedAt2 = this._buildDreaminaTaskPatch(value95, {
          recovering: recovering2.recovering === true,
          startedAt: recovering2.startedAt != null ? recovering2.startedAt : value96?.dreaminaTaskStartedAt,
        });
      return (
        store.updateNodeData(this.nodeId, startedAt2),
        this._syncLocalTaskNodeData(),
        this._persistDreaminaResumeCache(),
        this._emitDreaminaTaskCenterUpdate(value95, { startedAt: startedAt2.dreaminaTaskStartedAt }),
        startedAt2
      );
    }
    ['_stopDreaminaRecovery'](value97 = false) {
      this._dreaminaResumeAbortController &&
        !this._dreaminaResumeAbortController.signal.aborted &&
        this._dreaminaResumeAbortController.abort();
      ((this._dreaminaResumeAbortController = null),
        (this._dreaminaResumeSubmitId = ''),
        (this._dreaminaResumePromise = null),
        (this._dreaminaActiveSubmitId = ''));
      if (value97) {
        const value98 = store.getState().nodes?.[this.nodeId];
        value98?.dreaminaTaskRecovering &&
          store.updateNodeData(this.nodeId, { dreaminaTaskRecovering: false });
      }
    }
    ['_stopRunningHubRecovery'](value99 = false) {
      this._rhResumeAbortController &&
        !this._rhResumeAbortController.signal.aborted &&
        this._rhResumeAbortController.abort();
      ((this._rhResumeAbortController = null), (this._rhResumeTaskId = ''), (this._rhResumePromise = null));
      if (value99) {
        const value100 = store.getState().nodes?.[this.nodeId];
        value100?.rhTaskRecovering &&
          (store.updateNodeData(this.nodeId, { rhTaskRecovering: false }),
          this._persistRunningHubResumeCache());
      }
    }
    ['_stopAsyncRecovery'](value101 = false) {
      this._asyncResumeAbortController &&
        !this._asyncResumeAbortController.signal.aborted &&
        this._asyncResumeAbortController.abort();
      ((this._asyncResumeAbortController = null),
        (this._asyncResumeTaskId = ''),
        (this._asyncResumePromise = null));
      if (value101) {
        const value102 = store.getState().nodes?.[this.nodeId];
        value102?.asyncTaskRecovering &&
          (store.updateNodeData(this.nodeId, { asyncTaskRecovering: false }),
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
    ['_buildDreaminaFailedSnapshot'](value103, value104, raw2 = {}) {
      return {
        submitId: String(value103 || '').trim(),
        status: 'failed',
        phase: 'failed',
        label: String(value104 || '').trim() || videoTaskText('task.queryFailed'),
        queueStatus: '',
        queueIndex: null,
        queueLength: null,
        outputs: [],
        failReason: String(value104 || '').trim(),
        raw: raw2 && typeof raw2 === 'object' && !Array.isArray(raw2) ? raw2 : {},
        isTerminal: true,
        hasOutputs: false,
        lastCheckedAt: Date.now(),
      };
    }
    ['_applyDreaminaSuccessResult'](
      value105,
      startedAt3,
      value106 = null,
      { writeStore: writeStore = true, returnPatch: returnPatch = false } = {},
    ) {
      const normalizedResult = normalizeVideoGenerationResult(value105),
        result3 = normalizedResult.items,
        value107 = this._isDreaminaVideoNode(store.getState().nodes?.[this.nodeId] || this._data || {}),
        dreaminaSubmitId =
          String(value106?.submitId || '').trim() ||
          String(store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim(),
        args3 = value107
          ? value106
            ? this._buildDreaminaTaskPatch(value106, { recovering: false, startedAt: startedAt3 })
            : {
                isGenerating: false,
                jobStatus: 'success',
                dreaminaSubmitId: dreaminaSubmitId,
                dreaminaTaskStatus: 'success',
                dreaminaTaskPhase: 'done',
                dreaminaTaskLabel: videoTaskText('task.completed'),
                dreaminaTaskStartedAt: startedAt3,
                dreaminaTaskLastCheckedAt: Date.now(),
                dreaminaTaskLastRaw: {},
                dreaminaTaskRecovering: false,
              }
          : {},
        args4 = buildVideoGenerationResultPatch(normalizedResult, { startedAt: startedAt3 }),
        patch = args4 ? { ...args4, ...args3 } : null;
      args4 &&
        (writeStore && (store.updateNodeData(this.nodeId, patch), this._persistDreaminaResumeCache()),
        value107 &&
          this._emitDreaminaTaskCenterUpdate(
            value106 || {
              submitId: dreaminaSubmitId,
              status: 'success',
              phase: 'done',
              label: videoTaskText('task.completed'),
            },
            { status: 'complete', startedAt: startedAt3, result: result3[0] || normalizedResult },
          ));
      if (returnPatch) return { videos: result3, patch: patch || {}, normalizedResult: normalizedResult };
      return result3;
    }
    ['_scheduleDreaminaResultEnrichment'](list19) {
      if (!(Array.isArray(list19) && list19.length > 0)) return;
      {
        const nodeId2 = this.nodeId,
          value108 = ++this._resultThumbToken;
        (async () => {
          for (let value109 = 0; value109 < list19.length; value109++) {
            if (value108 !== this._resultThumbToken) return;
            const enabled14 = store.getState().nodes?.[nodeId2];
            if (!enabled14) return;
            const value110 = Array.isArray(enabled14.videos) ? enabled14.videos : [],
              enabled15 = value110[value109];
            if (!enabled15 || typeof enabled15 !== 'object') continue;
            const value111 = !!String(enabled15.thumbUrl || '').trim();
            if (value111) {
              const value112 = Number(enabled14.mainVideoIndex),
                value113 = Number.isFinite(value112) ? Math.max(0, Math.trunc(value112)) : 0;
              value109 === value113 &&
                !String(enabled14.thumbUrl || '').trim() &&
                store.updateNodeData(nodeId2, { thumbUrl: String(enabled15.thumbUrl).trim() });
              continue;
            }
            const enabled16 = this._resolveVideoMetaSrcFromVideoData(enabled15);
            if (!enabled16) continue;
            if (!(enabled16.startsWith('/output/') || enabled16.startsWith('/data/'))) continue;
            const value114 = 'gen|' + nodeId2 + '|' + value109 + '|' + enabled16;
            if (this._videoThumbPending.has(value114)) continue;
            this._videoThumbPending.add(value114);
            let response8 = null;
            try {
              response8 = await api.fetchVideoFirstFrameThumbFromServer(enabled16, {
                nodeId: nodeId2,
                assetId: String(enabled15.assetId || enabled15.thumbId || ''),
              });
            } catch {
              response8 = null;
            } finally {
              this._videoThumbPending.delete(value114);
            }
            if (value108 !== this._resultThumbToken) return;
            const enabled17 = String(response8?.thumbUrl || response8?.url || '').trim();
            if (!enabled17) continue;
            const enabled18 = store.getState().nodes?.[nodeId2];
            if (!enabled18) return;
            const list20 = Array.isArray(enabled18.videos) ? enabled18.videos : [],
              args5 = list20[value109];
            if (!args5 || typeof args5 !== 'object') continue;
            const value115 = { ...args5 };
            if (!String(value115.thumbUrl || '').trim() && enabled17) value115.thumbUrl = enabled17;
            const videos5 = list20.slice();
            videos5[value109] = value115;
            const value116 = { videos: videos5 },
              value117 = Number(enabled18.mainVideoIndex),
              value118 = Number.isFinite(value117) ? Math.max(0, Math.trunc(value117)) : 0;
            if (value109 === value118) {
              if (!String(enabled18.thumbUrl || '').trim() && enabled17) value116.thumbUrl = enabled17;
            }
            store.updateNodeData(nodeId2, value116);
          }
        })();
      }
      {
        const value119 = this.nodeId,
          value120 = ++this._metaFetchToken;
        (async () => {
          for (let value121 = 0; value121 < list19.length; value121++) {
            if (value120 !== this._metaFetchToken) return;
            const enabled19 = store.getState().nodes?.[value119];
            if (!enabled19) return;
            const value122 = Array.isArray(enabled19.videos) ? enabled19.videos : [],
              enabled20 = value122[value121];
            if (!enabled20 || typeof enabled20 !== 'object') continue;
            const count12 = Number(enabled20.videoWidth || 0),
              count13 = Number(enabled20.videoHeight || 0);
            if (count12 > 0 && count13 > 0) continue;
            const enabled21 = this._resolveVideoMetaSrcFromVideoData(enabled20);
            if (!enabled21) continue;
            let box2 = null;
            try {
              box2 = await api.fetchVideoMetaFromServer(enabled21);
            } catch {
              box2 = null;
            }
            if (value120 !== this._metaFetchToken) return;
            if (!box2 || box2.success !== true) continue;
            const videoWidth = Math.round(Number(box2.width) || 0),
              videoHeight = Math.round(Number(box2.height) || 0),
              count14 = Number(box2.duration);
            if (!(videoWidth > 0 && videoHeight > 0)) continue;
            const enabled22 = store.getState().nodes?.[value119];
            if (!enabled22) return;
            const list21 = Array.isArray(enabled22.videos) ? enabled22.videos : [],
              args6 = list21[value121];
            if (!args6 || typeof args6 !== 'object') continue;
            const count15 = Number(args6.videoWidth || 0),
              count16 = Number(args6.videoHeight || 0);
            if (count15 > 0 && count16 > 0) continue;
            const value123 = { ...args6, videoWidth: videoWidth, videoHeight: videoHeight };
            Number.isFinite(count14) &&
              count14 > 0 &&
              !(Number(value123.duration) > 0) &&
              (value123.duration = count14);
            const videos6 = list21.slice();
            videos6[value121] = value123;
            const value124 = { videos: videos6 },
              value125 = Number(enabled22.mainVideoIndex),
              value126 = Number.isFinite(value125) ? Math.max(0, Math.trunc(value125)) : 0;
            if (value121 === value126) {
              ((value124.videoWidth = videoWidth),
                (value124.videoHeight = videoHeight),
                (value124.selectedVideoWidth = videoWidth),
                (value124.selectedVideoHeight = videoHeight));
              if (Number.isFinite(count14) && count14 > 0) value124.videoDuration = count14;
            }
            store.updateNodeData(value119, value124);
          }
        })();
      }
    }
    ['_finalizeVideoSuccessSideEffects'](list22, value127) {
      (this._scheduleDreaminaResultEnrichment(list22),
        this._dispatchGenerationHistoryVideos(list22, value127));
      const error3 = list22.find((item14) => item14?.saveError)?.saveError;
      error3 && window.showToast?.(videoTaskText('toasts.localSaveFailed', { error: error3 }), 'warning');
    }
    ['_finalizeDreaminaSuccessResult'](value128, value129, value130 = null, writeStore2 = {}) {
      const value131 = this._applyDreaminaSuccessResult(value128, value129, value130, {
          writeStore: writeStore2.writeStore !== false,
          returnPatch: writeStore2.returnPatch === true,
        }),
        videos7 = Array.isArray(value131) ? value131 : value131?.videos || [];
      return (
        this._finalizeVideoSuccessSideEffects(videos7, value129),
        writeStore2.returnPatch === true
          ? { ...(value131 && !Array.isArray(value131) ? value131 : {}), videos: videos7 }
          : videos7
      );
    }
    ['_dispatchGenerationHistoryVideos'](list23, startedAt4) {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
      const videos8 = Array.isArray(list23)
        ? list23.filter((enabled23) => enabled23 && typeof enabled23 === 'object' && !enabled23.error)
        : [];
      if (videos8.length === 0) return;
      const nodeData5 = store.getState().nodes?.[this.nodeId] || this._data || {};
      try {
        window.dispatchEvent(
          new CustomEvent(GENERATION_HISTORY_EVENT, {
            detail: {
              kind: 'video',
              sourceNodeId: this.nodeId,
              nodeData: nodeData5,
              videos: videos8,
              startedAt: startedAt4,
              createdAt: Date.now(),
            },
          }),
        );
      } catch {}
    }
    async ['_maybeResumeDreaminaTaskImpl']() {
      if (this._videoSubmitInFlight === true) return;
      const modelId = handler14().nodes?.[this.nodeId] || this._data || {};
      if (!this._isDreaminaVideoNode(modelId)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (!this._isDreaminaRecoverableRunningTask(modelId)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      const taskId3 = String(modelId?.dreaminaSubmitId || '').trim();
      if (!taskId3) {
        this._stopDreaminaRecovery(false);
        return;
      }
      const value132 = String(this._dreaminaActiveSubmitId || '').trim();
      if (
        this._isGenerating &&
        modelId?.dreaminaTaskRecovering !== true &&
        value132 &&
        value132 === taskId3 &&
        !this._isStaleActiveDreaminaTask(modelId)
      )
        return;
      if (this._dreaminaResumeSubmitId === taskId3) return;
      this._stopDreaminaRecovery(false);
      const startedAt5 = Number(modelId?.dreaminaTaskStartedAt || modelId?.generationStartTime || Date.now());
      ((this._dreaminaResumeSubmitId = taskId3), (this._dreaminaActiveSubmitId = taskId3));
      const value133 = (async () => {
        let signal = null;
        try {
          ((signal = new AbortController()),
            (this._dreaminaResumeAbortController = signal),
            (this._isGenerating = true),
            this._setGenerateButtonBusyUi({ cancellable: false }),
            startLoading(this.previewEl));
          const provider3 = resolveDreaminaStyleVideoProvider(modelId?.model, modelId?.provider),
            response9 = await resumeTask(
              {
                sourceNodeId: this.nodeId,
                targetNodeId: this.nodeId,
                trigger: 'node',
                taskType: 'video-generation',
                provider: provider3 || 'dreamina',
                adapterType: provider3 === 'dreamina' ? 'localRuntime' : 'modelApi',
                modelId: modelId?.model || '',
                executionId: (provider3 || 'dreamina') + '.video.cli',
                payload: {
                  ...modelId,
                  provider: provider3 || modelId?.provider || 'dreamina',
                  model:
                    provider3 === 'apimart'
                      ? modelId?.model || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL
                      : modelId?.model || '',
                },
                taskId: taskId3,
                cancellable: false,
                resumable: true,
                startBuilder: () => ({
                  ...this._buildDreaminaTaskPatch(
                    this._buildDreaminaPendingSnapshot({
                      submitId: taskId3,
                      phase: 'generating',
                      label:
                        String(modelId?.dreaminaTaskLabel || '').trim() || videoTaskText('task.generating'),
                      raw: modelId?.dreaminaTaskLastRaw || {},
                    }),
                    { recovering: true, startedAt: startedAt5 },
                  ),
                }),
                onTaskStart: () => {
                  this._persistDreaminaResumeCache();
                },
                poll: async ({ payload: payload4 }) => {
                  if (provider3 && provider3 !== 'dreamina')
                    return api.resumeAsyncVideoTask(taskId3, payload4, { signal: signal.signal });
                  return api.resumeDreaminaVideoTask(taskId3, {
                    signal: signal.signal,
                    intervalMs: intervalMs,
                    maxWaitMs: maxWaitMs2,
                    onProgress: async (value134) => {
                      if (signal.signal.aborted) return;
                      this._applyDreaminaTaskSnapshot(value134, { recovering: true, startedAt: startedAt5 });
                    },
                  });
                },
                resultBuilder: async (value135, value136) => {
                  const value137 = value135?.dreaminaSnapshot || null,
                    value138 = this._applyDreaminaSuccessResult(value135, value136.startedAt, value137, {
                      writeStore: false,
                      returnPatch: true,
                    });
                  return value138?.patch || {};
                },
                failureBuilder: (error4, startedAt6) => {
                  if (this._isDreaminaPollTimeoutError(error4)) {
                    const value139 = this._buildDreaminaBackgroundPendingSnapshot(taskId3);
                    return Object.assign(
                      {
                        isGenerating: true,
                        jobStatus: 'running',
                        jobError: null,
                        generationDuration: Date.now() - startedAt6.startedAt,
                      },
                      this._buildDreaminaTaskPatch(value139, {
                        recovering: false,
                        startedAt: startedAt6.startedAt,
                      }),
                    );
                  }
                  const value140 = error4?.dreaminaSnapshot || null,
                    error5 =
                      error4?.message ||
                      value140?.failReason ||
                      value140?.label ||
                      videoTaskText('task.queryFailed');
                  return Object.assign(
                    buildVideoGenerationFailurePatch({ error: error5, startedAt: startedAt6.startedAt }),
                    value140
                      ? this._buildDreaminaTaskPatch(value140, {
                          recovering: false,
                          startedAt: startedAt6.startedAt,
                        })
                      : this._buildDreaminaTaskPatch(this._buildDreaminaFailedSnapshot(taskId3, error5), {
                          recovering: false,
                          startedAt: startedAt6.startedAt,
                        }),
                  );
                },
                cancelledBuilder: (startedAt7) =>
                  Object.assign(
                    { generationDuration: Date.now() - startedAt7.startedAt },
                    this._buildDreaminaTaskPatch(
                      this._buildDreaminaPendingSnapshot({
                        submitId: taskId3,
                        phase: 'generating',
                        label:
                          String(modelId?.dreaminaTaskLabel || '').trim() || videoTaskText('task.generating'),
                        raw: modelId?.dreaminaTaskLastRaw || {},
                      }),
                      { recovering: false, startedAt: startedAt7.startedAt },
                    ),
                  ),
                parseError: (error6) => error6?.message || videoTaskText('task.queryFailed'),
              },
              { store: store, startedAt: startedAt5, abortController: signal },
            );
          if (response9.status === 'pending') {
            this._persistDreaminaResumeCache();
            return;
          }
          if (response9.status === 'success') {
            const videoGenerationResult = normalizeVideoGenerationResult(response9.result).items;
            this._finalizeVideoSuccessSideEffects(videoGenerationResult, startedAt5);
          }
          if (response9.status === 'failed' && this._isDreaminaPollTimeoutError(response9.error))
            this._showDreaminaBackgroundQueueingToast(taskId3);
          else response9.status === 'failed' && (this._dreaminaActiveSubmitId = '');
          this._persistDreaminaResumeCache();
        } catch (error7) {
          if (signal?.signal?.aborted || error7?.message === 'CANCELLED' || error7?.name === 'AbortError')
            return;
          const error8 = error7?.message || videoTaskText('task.queryFailed'),
            value141 = this._buildDreaminaFailedSnapshot(taskId3, error8);
          (store.updateNodeData(
            this.nodeId,
            Object.assign(
              buildVideoGenerationFailurePatch({ error: error8, startedAt: startedAt5 }),
              this._buildDreaminaTaskPatch(value141, { recovering: false, startedAt: startedAt5 }),
            ),
          ),
            this._persistDreaminaResumeCache());
        } finally {
          signal &&
            this._dreaminaResumeAbortController === signal &&
            (this._dreaminaResumeAbortController = null);
          this._dreaminaResumeSubmitId === taskId3 && (this._dreaminaResumeSubmitId = '');
          this._dreaminaResumePromise = null;
          const value142 = this._syncLocalTaskNodeData(),
            shouldShowGenerationBusyUi2 =
              shouldShowGenerationBusyUi(value142) || this._shouldKeepDreaminaLoading(value142);
          ((this._isGenerating = shouldShowGenerationBusyUi2),
            !shouldShowGenerationBusyUi2 && (this._dreaminaActiveSubmitId = ''),
            shouldShowGenerationBusyUi2
              ? this._updateSubmitButtonState?.()
              : (this._resetGenerateButtonIdleUi({ cancellable: false }),
                stopLoading(this.previewEl),
                this._updateSubmitButtonState?.()));
        }
      })();
      this._dreaminaResumePromise = value133;
    }
    async ['_maybeResumeRunningHubTaskImpl']() {
      const value143 = handler14().nodes?.[this.nodeId] || this._data || {};
      if (!this._isRunninghubWorkflowModel(value143?.model, value143?.provider)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (!this._isRunningHubRecoverableRunningTask(value143)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      const taskId4 = String(value143?.rhTaskId || '').trim();
      if (!taskId4) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (this._rhResumeTaskId === taskId4 && this._rhResumePromise) return;
      this._stopRunningHubRecovery(false);
      const startedAt8 = Number(value143?.rhTaskStartedAt || value143?.generationStartTime || Date.now()),
        rhTaskUseOpenapiQuery = value143?.rhTaskUseOpenapiQuery === true;
      this._rhResumeTaskId = taskId4;
      const value144 = (async () => {
        let signal2 = null;
        try {
          const provider4 = await this._buildPayload();
          if (!provider4) return;
          ((signal2 = new AbortController()),
            (this._rhResumeAbortController = signal2),
            (this._rhAbortController = signal2),
            (this._rhTaskId = taskId4),
            (this._rhApiKey = String(provider4?.apiKey || '').trim() || this._rhApiKey || null),
            (this._rhCancelRequested = false),
            (this._rhRemoteCancelSent = false),
            (this._isGenerating = true),
            this._setGenerateButtonBusyUi({ cancellable: true }),
            startLoading(this.previewEl));
          const response10 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'video-generation',
              provider: provider4.provider || value143?.provider || 'runninghubwf',
              adapterType: 'workflow',
              modelId: provider4.model || value143?.model || '',
              executionId: 'runninghub.video.' + (provider4.model || value143?.model || 'workflow'),
              payload: provider4,
              taskId: taskId4,
              cancellable: true,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () => ({
                rhStatusMessage: null,
                rhStatusCode: null,
                rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery,
              }),
              onTaskStart: () => {
                this._persistRunningHubResumeCache();
              },
              poll: async () =>
                api.resumeRunningHubVideoTask(taskId4, provider4, {
                  signal: signal2.signal,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              resultBuilder: async (value145, startedAt9) => {
                const value146 = this._applyDreaminaSuccessResult(value145, startedAt9.startedAt, null, {
                  writeStore: false,
                  returnPatch: true,
                });
                return {
                  ...(value146?.patch || {}),
                  rhStatusMessage: null,
                  rhStatusCode: null,
                  ...this._buildRunningHubTaskPatch({
                    taskId: taskId4,
                    status: 'success',
                    startedAt: startedAt9.startedAt,
                    recovering: false,
                    useOpenapiQuery: rhTaskUseOpenapiQuery,
                  }),
                };
              },
              failureBuilder: (error9, startedAt10) => ({
                ...buildVideoGenerationFailurePatch({
                  error: error9?.message || videoTaskText('task.generationFailed'),
                  startedAt: startedAt10.startedAt,
                  duration: Date.now() - startedAt10.startedAt,
                }),
                rhStatusMessage: error9?.message || videoTaskText('task.generationFailed'),
                rhStatusCode: Number.isFinite(Number(error9?.code)) ? Number(error9.code) : null,
                ...this._buildRunningHubTaskPatch({
                  taskId: taskId4,
                  status: 'failed',
                  startedAt: startedAt10.startedAt,
                  recovering: false,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              }),
              cancelledBuilder: (startedAt11) => ({
                videos: [],
                videoUrl: '',
                localPath: '',
                generationDuration: Date.now() - startedAt11.startedAt,
                rhStatusMessage: videoTaskText('cancel.interrupted'),
                rhStatusCode: null,
                ...this._buildRunningHubTaskPatch({
                  taskId: taskId4,
                  status: 'cancelled',
                  startedAt: startedAt11.startedAt,
                  recovering: false,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              }),
              parseError: (error10) => error10?.message || videoTaskText('task.generationFailed'),
            },
            { store: store, startedAt: startedAt8, abortController: signal2 },
          );
          if (response10.status === 'pending') {
            this._persistRunningHubResumeCache();
            return;
          }
          if (response10.status === 'success') {
            const videoGenerationResult2 = normalizeVideoGenerationResult(response10.result).items;
            this._finalizeVideoSuccessSideEffects(videoGenerationResult2, startedAt8);
          }
          this._persistRunningHubResumeCache();
        } catch (rhStatusMessage) {
          if (
            signal2?.signal?.aborted ||
            rhStatusMessage?.message === 'CANCELLED' ||
            rhStatusMessage?.name === 'AbortError'
          )
            return;
          (store.updateNodeData(this.nodeId, {
            generationDuration: Math.max(0, Date.now() - startedAt8),
            rhStatusMessage: rhStatusMessage?.message || videoTaskText('task.generationFailed'),
            rhStatusCode: Number.isFinite(Number(rhStatusMessage?.code))
              ? Number(rhStatusMessage.code)
              : null,
            ...this._buildRunningHubTaskPatch({
              taskId: taskId4,
              status: 'failed',
              startedAt: startedAt8,
              recovering: false,
              useOpenapiQuery: rhTaskUseOpenapiQuery,
            }),
          }),
            this._persistRunningHubResumeCache());
        } finally {
          signal2 && this._rhResumeAbortController === signal2 && (this._rhResumeAbortController = null);
          signal2 && this._rhAbortController === signal2 && (this._rhAbortController = null);
          this._rhResumeTaskId === taskId4 && (this._rhResumeTaskId = '');
          this._rhResumePromise = null;
          const value147 = this._syncLocalTaskNodeData(),
            shouldShowGenerationBusyUi3 = shouldShowGenerationBusyUi(value147);
          this._isGenerating = shouldShowGenerationBusyUi3;
          if (shouldShowGenerationBusyUi3)
            this._rhTaskId = String(value147?.rhTaskId || taskId4 || '').trim();
          else {
            this._rhTaskId = null;
            if (!this._rhCancelRequested) this._rhApiKey = null;
            (this._resetGenerateButtonIdleUi({ cancellable: true }), stopLoading(this.previewEl));
          }
          this._updateSubmitButtonState();
        }
      })();
      this._rhResumePromise = value144;
    }
    async ['_maybeResumeAsyncTaskImpl']() {
      const value148 = handler14().nodes?.[this.nodeId] || this._data || {};
      if (this._isGenerating && value148?.asyncTaskRecovering !== true) return;
      if (!this._isAsyncRecoverableRunningTask(value148)) {
        this._stopAsyncRecovery(false);
        return;
      }
      const taskId5 = String(value148?.asyncTaskId || '').trim();
      if (!taskId5) {
        this._stopAsyncRecovery(false);
        return;
      }
      if (this._asyncResumeTaskId === taskId5 && this._asyncResumePromise) return;
      this._stopAsyncRecovery(false);
      const startedAt12 = Number(value148?.asyncTaskStartedAt || value148?.generationStartTime || Date.now()),
        providerHint5 = this._inferAsyncProviderFromModel(
          value148?.model,
          value148?.asyncTaskProvider || value148?.provider || '',
        );
      this._asyncResumeTaskId = taskId5;
      const value149 = (async () => {
        let signal3 = null;
        try {
          const modelId2 = await this._buildResumePayload(value148, { providerHint: providerHint5 });
          if (!modelId2) return;
          ((signal3 = new AbortController()),
            (this._asyncResumeAbortController = signal3),
            (this._isGenerating = true),
            this._setGenerateButtonBusyUi({ cancellable: false }),
            startLoading(this.previewEl));
          const response11 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'video-generation',
              provider: providerHint5 || modelId2.provider || value148?.provider || '',
              adapterType: 'modelApi',
              modelId: modelId2.model || value148?.model || '',
              executionId: (providerHint5 || modelId2.provider || 'model') + '.video.async',
              payload: modelId2,
              taskId: taskId5,
              async: true,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this._buildAsyncTaskPatch({
                  provider: providerHint5,
                  kind: 'video',
                  taskId: taskId5,
                  status: 'running',
                  startedAt: startedAt12,
                  recovering: true,
                }),
              onTaskStart: () => {
                this._persistAsyncResumeCache();
              },
              poll: async () => api.resumeAsyncVideoTask(taskId5, modelId2, { signal: signal3.signal }),
              resultBuilder: async (value150, startedAt13) => {
                const value151 = this._applyDreaminaSuccessResult(value150, startedAt13.startedAt, null, {
                  writeStore: false,
                  returnPatch: true,
                });
                return {
                  ...(value151?.patch || {}),
                  ...this._buildAsyncTaskPatch({
                    provider: providerHint5,
                    kind: 'video',
                    taskId: taskId5,
                    status: 'success',
                    startedAt: startedAt13.startedAt,
                    recovering: false,
                  }),
                };
              },
              failureBuilder: (error11, startedAt14) => ({
                ...buildVideoGenerationFailurePatch({
                  error: error11?.message || videoTaskText('task.generationFailed'),
                  startedAt: startedAt14.startedAt,
                  duration: Math.max(0, Date.now() - startedAt14.startedAt),
                }),
                ...this._buildAsyncTaskPatch({
                  provider: providerHint5,
                  kind: 'video',
                  taskId: taskId5,
                  status: 'failed',
                  startedAt: startedAt14.startedAt,
                  recovering: false,
                }),
              }),
              cancelledBuilder: (startedAt15) => ({
                videos: [],
                videoUrl: '',
                localPath: '',
                generationDuration: Date.now() - startedAt15.startedAt,
                ...this._buildAsyncTaskPatch({
                  provider: providerHint5,
                  kind: 'video',
                  taskId: taskId5,
                  status: 'cancelled',
                  startedAt: startedAt15.startedAt,
                  recovering: false,
                }),
              }),
              parseError: (error12) => error12?.message || videoTaskText('task.generationFailed'),
            },
            { store: store, startedAt: startedAt12, abortController: signal3 },
          );
          if (response11.status === 'pending') {
            this._persistAsyncResumeCache();
            return;
          }
          if (response11.status === 'success') {
            const videoGenerationResult3 = normalizeVideoGenerationResult(response11.result).items;
            this._finalizeVideoSuccessSideEffects(videoGenerationResult3, startedAt12);
          }
          this._persistAsyncResumeCache();
        } catch (error13) {
          if (signal3?.signal?.aborted || error13?.message === 'CANCELLED' || error13?.name === 'AbortError')
            return;
          (store.updateNodeData(this.nodeId, {
            ...buildVideoGenerationFailurePatch({
              error: error13?.message || videoTaskText('task.generationFailed'),
              startedAt: startedAt12,
              duration: Math.max(0, Date.now() - startedAt12),
            }),
            ...this._buildAsyncTaskPatch({
              provider: providerHint5,
              kind: 'video',
              taskId: taskId5,
              status: 'failed',
              startedAt: startedAt12,
              recovering: false,
            }),
          }),
            this._persistAsyncResumeCache());
        } finally {
          signal3 &&
            this._asyncResumeAbortController === signal3 &&
            (this._asyncResumeAbortController = null);
          this._asyncResumeTaskId === taskId5 && (this._asyncResumeTaskId = '');
          this._asyncResumePromise = null;
          const value152 = this._syncLocalTaskNodeData(),
            shouldShowGenerationBusyUi4 = shouldShowGenerationBusyUi(value152);
          ((this._isGenerating = shouldShowGenerationBusyUi4),
            !shouldShowGenerationBusyUi4 &&
              (this._resetGenerateButtonIdleUi({ cancellable: false }), stopLoading(this.previewEl)),
            this._updateSubmitButtonState());
        }
      })();
      this._asyncResumePromise = value149;
    }
    async ['_handleGenerateOrCancelImpl'](value153 = null) {
      const value154 = store.getState().nodes?.[this.nodeId] || this._data || {},
        cancellable2 = this._isRunninghubWorkflowModel(value154?.model, value154?.provider);
      !cancellable2 && this._dreaminaResumePromise && this._stopDreaminaRecovery(true);
      !cancellable2 && this._asyncResumePromise && this._stopAsyncRecovery(true);
      if (
        shouldAllowCancel(value154, {
          cancellable: cancellable2,
          cancelInFlight: this._rhCancelInFlight === true,
        })
      ) {
        await this._cancelRunningHubWorkflowTask();
        return;
      }
      await this._onGenerate(value153);
    }
    async ['_cancelRunningHubWorkflowTaskImpl']() {
      const useOpenapiQuery2 = store.getState().nodes?.[this.nodeId] || this._data || {},
        apiKey2 = this._rhApiKey || '',
        taskId6 = String(this._rhTaskId || '').trim() || String(useOpenapiQuery2?.rhTaskId || '').trim(),
        value155 = Date.now(),
        count17 = Number(useOpenapiQuery2?.generationStartTime),
        generationDuration =
          useOpenapiQuery2?.generationDuration != null
            ? useOpenapiQuery2.generationDuration
            : Number.isFinite(count17) && count17 > 0
              ? Math.max(0, value155 - count17)
              : 0;
      this._rhCancelRequested = true;
      this._rhAbortController && !this._rhAbortController.signal.aborted && this._rhAbortController.abort();
      const enabled24 = !apiKey2,
        rhStatusCode = !taskId6;
      try {
        this._rhRemoteCancelSent = !enabled24 && !rhStatusCode;
        const cancelledBuilder = ({
          remoteResult: remoteResult,
          remoteError: remoteError,
          startedAt: startedAt16,
        }) => {
          const count18 = Number(remoteResult?.code),
            value156 = enabled24
              ? videoTaskText('cancel.missingApiKey')
              : rhStatusCode
                ? videoTaskText('cancel.interruptedNoTaskId')
                : '',
            rhStatusMessage2 =
              value156 ||
              (remoteError
                ? remoteError.message || videoTaskText('cancel.failed')
                : count18 === 0
                  ? videoTaskText('cancel.success')
                  : count18 === 0x327
                    ? videoTaskText('cancel.taskNotFound')
                    : remoteResult?.msg || videoTaskText('cancel.failed'));
          return {
            rhStatusMessage: rhStatusMessage2,
            rhStatusCode: rhStatusCode ? 0x32d : Number.isFinite(count18) ? count18 : null,
            videos: [],
            videoUrl: '',
            localPath: '',
            generationDuration: generationDuration,
            ...this._buildRunningHubTaskPatch({
              taskId: taskId6,
              status: 'cancelled',
              startedAt: Number(
                startedAt16 ||
                  useOpenapiQuery2?.rhTaskStartedAt ||
                  useOpenapiQuery2?.generationStartTime ||
                  0,
              ),
              recovering: false,
              useOpenapiQuery: useOpenapiQuery2?.rhTaskUseOpenapiQuery === true,
            }),
          };
        };
        (await cancelTask(this.nodeId, {
          store: store,
          taskId: taskId6,
          cancellable: true,
          cancel: ({ taskId: taskId7 }) => {
            if (!apiKey2) throw new Error(videoTaskText('cancel.missingApiKey'));
            return api.cancelRunningHubWorkflowTask({ apiKey: apiKey2, taskId: taskId7 });
          },
          cancelledBuilder: cancelledBuilder,
          spec: {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'video-generation',
            provider: useOpenapiQuery2?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: useOpenapiQuery2?.model || '',
            executionId: 'runninghub.video.' + (useOpenapiQuery2?.model || 'workflow'),
            payload: useOpenapiQuery2,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: cancelledBuilder,
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
          stopLoading(this.previewEl),
          this._updateSubmitButtonState());
      }
    }
    ['_setGenerateButtonBusyUi']({ cancellable: cancellable = false } = {}) {
      if (!this.btnEl) return;
      if (cancellable) {
        const title = getVideoCancelTooltip();
        setGenerateButtonCancellableUi(this.btnEl, {
          title: title,
          tooltip: title,
          ariaLabel: videoTaskText('controls.cancelGenerateAria'),
          color: 'var(--red)',
          busy: true,
        });
        return;
      }
      const title2 = getVideoGenerateTitle();
      setGenerateButtonLoadingUi(this.btnEl, { title: title2, disabled: true, ariaLabel: title2 });
    }
    ['_resetGenerateButtonIdleUi']({ cancellable: cancellable = false } = {}) {
      if (!this.btnEl) return;
      const videoGenerateTitle = getVideoGenerateTitle();
      resetGenerateButtonIdleUi(this.btnEl, videoGenerateTitle);
      if (cancellable) {
        (this.btnEl.removeAttribute('title'),
          this.btnEl.setAttribute('data-tooltip', getVideoCancelTooltip()));
        return;
      }
      (this.btnEl.removeAttribute('data-tooltip'), (this.btnEl.title = videoGenerateTitle));
    }
    ['_getPreviewGenerateButtonLoadingOptions']() {
      return createPreviewGenerateButtonCallbacks(this, getVideoGenerateTitle());
    }
    async ['_onGenerateImpl'](template = null, value157 = {}) {
      if (this._isGenerating) return;
      if (value157?.insertPrompt === true) {
        (insertPresetPromptIntoEditor({
          storeApi: store,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          template: template,
          inEdges: store.getIncomingEdges(this.nodeId),
          nodes: store.getState().nodes || {},
          allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        }),
          this._updateSubmitButtonState?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(template)) {
        const promptText = await this._buildPayload(template);
        if (!promptText) return;
        previewPresetPromptInEditor({
          storeApi: store,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          promptText: promptText.prompt,
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
      const value158 = store.getState().nodes?.[this.nodeId] || this._data || {},
        value159 =
          typeof this._shouldKeepDreaminaLoading === 'function' &&
          typeof this._isDreaminaVideoNode === 'function'
            ? this._shouldKeepDreaminaLoading(value158)
            : false;
      if (shouldShowGenerationBusyUi(value158) || value159) return;
      this._videoSubmitInFlight = true;
      try {
        let storyReferenceGuard;
        try {
          storyReferenceGuard = createStoryReferenceVideoGuard({
            store: store,
            nodeId: this.nodeId,
            resolveExecution: resolveModelExecution,
            getPromptHtml: () => this.promptEl?.innerHTML,
          });
          if (storyReferenceGuard && template != null)
            throw new Error('首帧任务不接受预设覆盖，请使用原节点普通生成按钮');
          if (storyReferenceGuard && !window.confirm(storyReferenceGuard.confirmation)) return;
        } catch (error) {
          window.showToast?.(error.message, 'error');
          return;
        }
        const value160 = String(this._data?.model || '').trim(),
          value161 = String(this._data?.provider || '').trim();
        await ensureVipSessionRecheck(value160, value161);
        if (!this._guardVipSelection(this._data?.model || '', value161)) return;
        if (typeof window.ensureSubscriptionInstallId === 'function')
          try {
            await window.ensureSubscriptionInstallId();
          } catch {}
        const provider5 = await this._buildPayload(template, { randomizeSubmitParams: true });
        if (!provider5) return;
        try {
          storyReferenceGuard?.assertCurrent(provider5);
        } catch (error) {
          window.showToast?.(error.message, 'error');
          return;
        }
        const value162 = String(provider5.model || '').trim();
        if (isVideoVipModel(value162, provider5.provider) && !String(provider5.installId || '').trim()) {
          window.showToast?.(videoTaskText('toasts.missingInstallId'), 'error');
          return;
        }
        const cancellable3 = this._isRunninghubWorkflowModel(provider5.model, provider5.provider),
          resumable = this._isDreaminaVideoNode(provider5),
          provider6 = String(provider5?.provider || this._data?.provider || '')
            .trim()
            .toLowerCase(),
          async2 = !cancellable3 && !resumable;
        resumable && this._stopDreaminaRecovery(true);
        cancellable3 && this._stopRunningHubRecovery(true);
        async2 && this._stopAsyncRecovery(true);
        this._rhGenToken = (this._rhGenToken || 0) + 1;
        const value163 = this._rhGenToken;
        ((this._rhCancelRequested = false),
          (this._rhRemoteCancelSent = false),
          (this._rhApiKey = cancellable3 ? provider5.apiKey : null),
          (this._rhTaskId = null),
          (this._rhAbortController = cancellable3 ? new AbortController() : null),
          (this._isGenerating = true),
          this._setGenerateButtonBusyUi({ cancellable: cancellable3 }),
          startLoading(this.previewEl));
        const startedAt17 = Date.now(),
          value164 = {
            ...buildGenerationStartPatch({ startedAt: startedAt17 }),
            generationStartTime: startedAt17,
            generationDuration: null,
            rhStatusMessage: null,
            rhStatusCode: null,
          };
        resumable &&
          (Object.assign(value164, {
            dreaminaSubmitId: '',
            dreaminaTaskStatus: 'pending',
            dreaminaTaskPhase: 'generating',
            dreaminaTaskLabel: videoTaskText('task.submitting'),
            dreaminaTaskStartedAt: startedAt17,
            dreaminaTaskLastCheckedAt: null,
            dreaminaTaskLastRaw: {},
            dreaminaTaskRecovering: false,
          }),
          Object.assign(value164, {
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
        cancellable3 &&
          (Object.assign(value164, {
            rhTaskId: '',
            rhTaskStatus: 'pending',
            rhTaskStartedAt: startedAt17,
            rhTaskRecovering: false,
            rhTaskUseOpenapiQuery: false,
          }),
          Object.assign(value164, {
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
        async2 &&
          (Object.assign(
            value164,
            this._buildAsyncTaskPatch({
              provider: provider6,
              kind: 'video',
              taskId: '',
              status: 'pending',
              startedAt: startedAt17,
              recovering: false,
            }),
          ),
          Object.assign(value164, {
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
          const response12 = await submitTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'video-generation',
              provider: provider5.provider || provider6 || this._data?.provider || '',
              adapterType: cancellable3 ? 'workflow' : 'modelApi',
              modelId: provider5.model || this._data?.model || '',
              executionId:
                'video.' +
                (provider5.provider || provider6 || 'modelApi') +
                '.' +
                (provider5.model || 'default'),
              payload: provider5,
              cancellable: cancellable3,
              resumable: resumable || cancellable3 || async2,
              async: async2,
              startBuilder: () => value164,
              onTaskStart: () => {
                this._syncLocalTaskNodeData();
                if (resumable) this._persistDreaminaResumeCache();
                if (cancellable3) this._persistRunningHubResumeCache();
                if (async2) this._persistAsyncResumeCache();
              },
              submit: async (value165, value166 = {}) =>
                api.generateVideo((storyReferenceGuard?.beforeSend(provider5), provider5), {
                  ...(cancellable3 ? { signal: this._rhAbortController.signal } : {}),
                  ...(resumable ? { maxWaitMs: maxWaitMs } : {}),
                  onTaskMeta: ({
                    taskId: taskId8,
                    useOpenapiQuery: useOpenapiQuery3,
                    provider: provider7,
                  }) => {
                    if (value163 !== this._rhGenToken) return;
                    const submitId3 = String(taskId8 || '').trim();
                    if (!submitId3) return;
                    if (cancellable3) {
                      ((this._rhTaskId = submitId3),
                        value166.onTaskId?.(submitId3),
                        store.updateNodeData(this.nodeId, {
                          rhStatusMessage: null,
                          rhStatusCode: null,
                          rhTaskUseOpenapiQuery: useOpenapiQuery3 === true,
                        }),
                        this._syncLocalTaskNodeData(),
                        this._persistRunningHubResumeCache());
                      return;
                    }
                    if (resumable) {
                      this._dreaminaActiveSubmitId = submitId3;
                      const value167 = this._buildDreaminaPendingSnapshot({
                        submitId: submitId3,
                        phase: 'generating',
                        label: videoTaskText('task.generating'),
                      });
                      (this._applyDreaminaTaskSnapshot(value167, {
                        recovering: false,
                        startedAt: startedAt17,
                      }),
                        value166.onTaskId?.(submitId3));
                      return;
                    }
                    async2 &&
                      (value166.onTaskId?.(submitId3),
                      store.updateNodeData(this.nodeId, {
                        asyncTaskProvider: String(provider7 || provider6 || this._data?.provider || '')
                          .trim()
                          .toLowerCase(),
                        asyncTaskKind: 'video',
                      }),
                      this._syncLocalTaskNodeData(),
                      this._persistAsyncResumeCache());
                  },
                  onTaskId: (value168) => {
                    if (value163 !== this._rhGenToken) return;
                    const submitId4 = String(value168 || '').trim();
                    if (!submitId4) return;
                    if (resumable) {
                      this._dreaminaActiveSubmitId = submitId4;
                      const value169 = this._buildDreaminaPendingSnapshot({
                        submitId: submitId4,
                        phase: 'generating',
                        label: videoTaskText('task.generating'),
                      });
                      (this._applyDreaminaTaskSnapshot(value169, {
                        recovering: false,
                        startedAt: startedAt17,
                      }),
                        value166.onTaskId?.(submitId4));
                      return;
                    }
                    if (cancellable3) {
                      ((this._rhTaskId = submitId4),
                        value166.onTaskId?.(submitId4),
                        store.updateNodeData(this.nodeId, {
                          rhStatusMessage: null,
                          rhStatusCode: null,
                          rhTaskUseOpenapiQuery:
                            store.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
                        }),
                        this._syncLocalTaskNodeData(),
                        this._persistRunningHubResumeCache());
                      const apiKey3 = this._rhApiKey || '';
                      this._rhCancelRequested &&
                        !this._rhRemoteCancelSent &&
                        apiKey3 &&
                        submitId4 &&
                        ((this._rhRemoteCancelSent = true),
                        (async () => {
                          if (value163 !== this._rhGenToken) return;
                          const cancelledBuilder2 = ({
                            remoteResult: remoteResult2,
                            remoteError: remoteError2,
                          }) => {
                            const count19 = Number(remoteResult2?.code),
                              rhStatusMessage3 = remoteError2
                                ? remoteError2.message || videoTaskText('cancel.failed')
                                : count19 === 0
                                  ? videoTaskText('cancel.success')
                                  : count19 === 0x327
                                    ? videoTaskText('cancel.taskNotFound')
                                    : remoteResult2?.msg || videoTaskText('cancel.failed');
                            return {
                              rhStatusMessage: rhStatusMessage3,
                              rhStatusCode: Number.isFinite(count19) ? count19 : null,
                              videos: [],
                              videoUrl: '',
                              localPath: '',
                              ...this._buildRunningHubTaskPatch({
                                taskId: submitId4,
                                status: 'cancelled',
                                startedAt: startedAt17,
                                recovering: false,
                                useOpenapiQuery:
                                  store.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
                              }),
                            };
                          };
                          await cancelTask(this.nodeId, {
                            store: store,
                            taskId: submitId4,
                            cancellable: true,
                            cancel: ({ taskId: taskId9 }) =>
                              api.cancelRunningHubWorkflowTask({
                                apiKey: apiKey3,
                                taskId: taskId9,
                              }),
                            cancelledBuilder: cancelledBuilder2,
                            spec: {
                              sourceNodeId: this.nodeId,
                              targetNodeId: this.nodeId,
                              trigger: 'node',
                              taskType: 'video-generation',
                              provider: 'runninghubwf',
                              adapterType: 'workflow',
                              modelId: provider5?.model || '',
                              executionId: 'runninghub.video.' + (provider5?.model || 'workflow'),
                              payload: provider5,
                              cancellable: true,
                              resumable: true,
                              resultBuilder: () => ({}),
                              cancelledBuilder: cancelledBuilder2,
                            },
                          });
                          if (value163 !== this._rhGenToken) return;
                          this._persistRunningHubResumeCache();
                        })());
                      return;
                    }
                    if (async2) {
                      const value170 = store.getState().nodes?.[this.nodeId] || {};
                      (value166.onTaskId?.(submitId4),
                        store.updateNodeData(this.nodeId, {
                          asyncTaskProvider: String(
                            value170?.asyncTaskProvider || provider6 || this._data?.provider || '',
                          )
                            .trim()
                            .toLowerCase(),
                          asyncTaskKind: 'video',
                        }),
                        this._syncLocalTaskNodeData(),
                        this._persistAsyncResumeCache());
                    }
                  },
                  onProgress: resumable
                    ? async (value171) => {
                        if (value163 !== this._rhGenToken) return;
                        this._applyDreaminaTaskSnapshot(value171, {
                          recovering: false,
                          startedAt: startedAt17,
                        });
                      }
                    : undefined,
                }),
              cancel: cancellable3
                ? async ({ taskId: taskId10 }) => {
                    const apiKey4 = this._rhApiKey || provider5.apiKey || '',
                      taskId11 = String(taskId10 || '').trim();
                    if (!apiKey4 || !taskId11) return null;
                    return api.cancelRunningHubWorkflowTask({ apiKey: apiKey4, taskId: taskId11 });
                  }
                : undefined,
              resultBuilder: (value172, startedAt18) => {
                const value173 = this._applyDreaminaSuccessResult(value172, startedAt18.startedAt, null, {
                    writeStore: false,
                    returnPatch: true,
                  }),
                  value174 = { ...(value173?.patch || {}) };
                if (cancellable3) {
                  const useOpenapiQuery4 = store.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    value174,
                    { rhStatusMessage: null, rhStatusCode: null },
                    this._buildRunningHubTaskPatch({
                      taskId:
                        String(this._rhTaskId || '').trim() ||
                        String(useOpenapiQuery4?.rhTaskId || '').trim(),
                      status: 'success',
                      startedAt: startedAt18.startedAt,
                      recovering: false,
                      useOpenapiQuery: useOpenapiQuery4?.rhTaskUseOpenapiQuery === true,
                    }),
                  );
                } else {
                  if (async2) {
                    const value175 = store.getState().nodes?.[this.nodeId] || {};
                    Object.assign(
                      value174,
                      this._buildAsyncTaskPatch({
                        provider: String(value175?.asyncTaskProvider || provider6 || '').trim(),
                        kind: 'video',
                        taskId: String(value175?.asyncTaskId || '').trim(),
                        status: 'success',
                        startedAt: startedAt18.startedAt,
                        recovering: false,
                      }),
                    );
                  }
                }
                return value174;
              },
              failureBuilder: (error14, startedAt19) => {
                const error15 = error14?.message || videoTaskText('task.generationFailed');
                if (resumable && this._isDreaminaPollTimeoutError(error14)) {
                  const value176 = store.getState().nodes?.[this.nodeId] || {},
                    value177 = String(value176?.dreaminaSubmitId || '').trim(),
                    value178 = this._buildDreaminaBackgroundPendingSnapshot(value177);
                  return Object.assign(
                    {
                      isGenerating: true,
                      jobStatus: 'running',
                      jobError: null,
                      generationDuration: Date.now() - startedAt19.startedAt,
                    },
                    this._buildDreaminaTaskPatch(value178, {
                      recovering: false,
                      startedAt: Number(
                        value176?.dreaminaTaskStartedAt ||
                          value176?.generationStartTime ||
                          startedAt19.startedAt,
                      ),
                    }),
                  );
                }
                const value179 =
                  String(error14?.code || '') === 'SUBSCRIPTION_REQUIRED'
                    ? {}
                    : buildVideoGenerationFailurePatch({
                        error: error15,
                        startedAt: startedAt19.startedAt,
                        duration: Date.now() - startedAt19.startedAt,
                      });
                if (resumable) {
                  const value180 = this._buildDreaminaFailedSnapshot(
                    store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '',
                    error15,
                  );
                  (Object.assign(
                    value179,
                    this._buildDreaminaTaskPatch(value180, {
                      recovering: false,
                      startedAt: startedAt19.startedAt,
                    }),
                  ),
                    this._emitDreaminaTaskCenterUpdate(value180, {
                      status: 'failed',
                      error: error15,
                      startedAt: startedAt19.startedAt,
                    }));
                }
                if (cancellable3) {
                  const useOpenapiQuery5 = store.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    value179,
                    {
                      rhStatusMessage: error15,
                      rhStatusCode: Number.isFinite(Number(error14?.code)) ? Number(error14.code) : null,
                    },
                    this._buildRunningHubTaskPatch({
                      taskId:
                        String(this._rhTaskId || '').trim() ||
                        String(useOpenapiQuery5?.rhTaskId || '').trim(),
                      status: 'failed',
                      startedAt: startedAt19.startedAt,
                      recovering: false,
                      useOpenapiQuery: useOpenapiQuery5?.rhTaskUseOpenapiQuery === true,
                    }),
                  );
                }
                if (async2) {
                  const value181 = store.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    value179,
                    this._buildAsyncTaskPatch({
                      provider: String(value181?.asyncTaskProvider || provider6 || '').trim(),
                      kind: 'video',
                      taskId: String(value181?.asyncTaskId || '').trim(),
                      status: 'failed',
                      startedAt: startedAt19.startedAt,
                      recovering: false,
                    }),
                  );
                }
                return value179;
              },
              cancelledBuilder: (startedAt20) => ({
                videos: [],
                videoUrl: '',
                localPath: '',
                generationDuration: Date.now() - startedAt20.startedAt,
                ...(cancellable3
                  ? {
                      rhStatusMessage: videoTaskText('task.generationCancelled'),
                      rhStatusCode: null,
                      ...this._buildRunningHubTaskPatch({
                        taskId:
                          String(this._rhTaskId || '').trim() ||
                          String(store.getState().nodes?.[this.nodeId]?.rhTaskId || '').trim(),
                        status: 'cancelled',
                        startedAt: startedAt20.startedAt,
                        recovering: false,
                        useOpenapiQuery:
                          store.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
                      }),
                    }
                  : {}),
              }),
              parseError: (error16) => error16?.message || videoTaskText('task.generationFailed'),
            },
            { store: store, startedAt: startedAt17, abortController: this._rhAbortController },
          );
          if (response12.status === 'pending') return response12;
          if (response12.status === 'success') {
            const videoGenerationResult4 = normalizeVideoGenerationResult(response12.result).items;
            this._finalizeVideoSuccessSideEffects(videoGenerationResult4, startedAt17);
            if (resumable) this._persistDreaminaResumeCache();
            if (cancellable3) this._persistRunningHubResumeCache();
            if (async2) this._persistAsyncResumeCache();
            return response12;
          }
          const error17 = response12.error;
          if (response12.status === 'failed' && String(error17?.code || '') === 'SUBSCRIPTION_REQUIRED') {
            const value182 = String(error17?.requiredModelId || '').trim(),
              modelId3 = value182 || this._data?.model || '',
              provider8 = String(this._data?.provider || '').trim(),
              handler15 = window.handleSubscriptionRequired;
            if (typeof handler15 === 'function')
              await handler15({ modelId: modelId3, provider: provider8, error: error17 });
            else {
              if (typeof window.openSubscriptionDialog === 'function') {
                const response13 = window.getSubscriptionState?.() || {};
                String(response13.status || '').toLowerCase() !== 'active'
                  ? window.openSubscriptionDialog({ modelId: modelId3, provider: provider8 })
                  : window.showToast?.(
                      error17?.message || videoTaskText('toasts.subscriptionSyncing'),
                      'warning',
                    );
              }
            }
            return response12;
          }
          if (response12.status === 'failed' && resumable && this._isDreaminaPollTimeoutError(error17))
            return (
              this._persistDreaminaResumeCache(),
              this._showDreaminaBackgroundQueueingToast(
                store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '',
              ),
              response12
            );
          if (response12.status === 'failed') {
            const message3 = error17?.message || '';
            (void logDiagnosticEvent({
              type: 'generation.video_failed',
              level: 'error',
              source: 'renderer',
              message: message3 || videoTaskText('task.videoGenerationFailed'),
              error: error17,
              context: {
                nodeId: this.nodeId,
                provider: provider5?.provider || '',
                model: provider5?.model || '',
                isDreamina: resumable,
                isRhWorkflow: cancellable3,
                isAsyncTaskModel: async2,
              },
            }),
              window.showToast?.(
                message3,
                'error',
                isDreaminaUploadDurationErrorMessage(message3)
                  ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
                  : undefined,
              ));
            if (resumable) this._persistDreaminaResumeCache();
            if (cancellable3) this._persistRunningHubResumeCache();
            if (async2) this._persistAsyncResumeCache();
            return response12;
          }
          return response12;
        } catch (error18) {
          if (
            cancellable3 &&
            (this._rhCancelRequested || error18?.message === 'CANCELLED' || error18?.name === 'AbortError')
          )
            return;
          if (String(error18?.code || '') === 'SUBSCRIPTION_REQUIRED') {
            const value183 = String(error18?.requiredModelId || '').trim(),
              modelId4 = value183 || this._data?.model || '',
              provider9 = String(this._data?.provider || '').trim(),
              handler16 = window.handleSubscriptionRequired;
            if (typeof handler16 === 'function')
              await handler16({ modelId: modelId4, provider: provider9, error: error18 });
            else {
              if (typeof window.openSubscriptionDialog === 'function') {
                const response14 = window.getSubscriptionState?.() || {};
                String(response14.status || '').toLowerCase() !== 'active'
                  ? window.openSubscriptionDialog({ modelId: modelId4, provider: provider9 })
                  : window.showToast?.(
                      error18?.message || videoTaskText('toasts.subscriptionSyncing'),
                      'warning',
                    );
              }
            }
            return;
          }
          if (resumable && this._isDreaminaPollTimeoutError(error18)) {
            const value184 = store.getState().nodes?.[this.nodeId] || {},
              value185 = String(value184?.dreaminaSubmitId || '').trim(),
              value186 = this._buildDreaminaBackgroundPendingSnapshot(value185);
            (store.updateNodeData(
              this.nodeId,
              Object.assign(
                {
                  isGenerating: true,
                  jobStatus: 'running',
                  jobError: null,
                  generationDuration: Date.now() - startedAt17,
                },
                this._buildDreaminaTaskPatch(value186, {
                  recovering: false,
                  startedAt: Number(
                    value184?.dreaminaTaskStartedAt || value184?.generationStartTime || startedAt17,
                  ),
                }),
              ),
            ),
              this._persistDreaminaResumeCache(),
              this._showDreaminaBackgroundQueueingToast(value185));
            return;
          }
          const message4 = error18?.message || '';
          (void logDiagnosticEvent({
            type: 'generation.video_failed',
            level: 'error',
            source: 'renderer',
            message: message4 || videoTaskText('task.videoGenerationFailed'),
            error: error18,
            context: {
              nodeId: this.nodeId,
              provider: provider5?.provider || '',
              model: provider5?.model || '',
              isDreamina: resumable,
              isRhWorkflow: cancellable3,
              isAsyncTaskModel: async2,
            },
          }),
            window.showToast?.(
              message4,
              'error',
              isDreaminaUploadDurationErrorMessage(message4)
                ? DREAMINA_UPLOAD_DURATION_ERROR_TOAST_MS
                : undefined,
            ));
          const submitId5 = buildVideoGenerationFailurePatch({
            error: message4 || videoTaskText('task.generationFailed'),
            startedAt: startedAt17,
            duration: Date.now() - startedAt17,
          });
          resumable &&
            Object.assign(
              submitId5,
              this._buildDreaminaTaskPatch(
                this._buildDreaminaFailedSnapshot(
                  store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '',
                  error18?.message || videoTaskText('task.generationFailed'),
                ),
                { recovering: false, startedAt: startedAt17 },
              ),
            );
          cancellable3 &&
            Object.assign(
              submitId5,
              {
                rhStatusMessage: error18?.message || videoTaskText('task.generationFailed'),
                rhStatusCode: Number.isFinite(Number(error18?.code)) ? Number(error18.code) : null,
              },
              this._buildRunningHubTaskPatch({
                taskId:
                  String(this._rhTaskId || '').trim() ||
                  String(store.getState().nodes?.[this.nodeId]?.rhTaskId || '').trim(),
                status: 'failed',
                startedAt: startedAt17,
                recovering: false,
                useOpenapiQuery: store.getState().nodes?.[this.nodeId]?.rhTaskUseOpenapiQuery === true,
              }),
            );
          if (async2) {
            const value187 = store.getState().nodes?.[this.nodeId] || {};
            Object.assign(
              submitId5,
              this._buildAsyncTaskPatch({
                provider: String(value187?.asyncTaskProvider || provider6 || '').trim(),
                kind: 'video',
                taskId: String(value187?.asyncTaskId || '').trim(),
                status: 'failed',
                startedAt: startedAt17,
                recovering: false,
              }),
            );
          }
          resumable &&
            this._emitDreaminaTaskCenterUpdate(
              {
                submitId: submitId5.dreaminaSubmitId,
                status: submitId5.dreaminaTaskStatus,
                phase: submitId5.dreaminaTaskPhase,
                label: submitId5.dreaminaTaskLabel,
                failReason: message4,
              },
              { status: 'failed', error: message4, startedAt: startedAt17 },
            );
          store.updateNodeData(this.nodeId, submitId5);
          if (resumable) this._persistDreaminaResumeCache();
          if (cancellable3) this._persistRunningHubResumeCache();
          if (async2) this._persistAsyncResumeCache();
        } finally {
          const value188 = this._syncLocalTaskNodeData(),
            shouldShowGenerationBusyUi5 = shouldShowGenerationBusyUi(value188);
          this._isGenerating = shouldShowGenerationBusyUi5;
          resumable && !shouldShowGenerationBusyUi5 && (this._dreaminaActiveSubmitId = '');
          this._rhAbortController = null;
          if (cancellable3 && shouldShowGenerationBusyUi5) {
            const value189 = String(value188?.rhTaskId || '').trim();
            if (value189) this._rhTaskId = value189;
          } else {
            this._rhTaskId = null;
            if (!this._rhCancelRequested) this._rhApiKey = null;
          }
          shouldShowGenerationBusyUi5
            ? this._updateSubmitButtonState?.()
            : (this._resetGenerateButtonIdleUi({ cancellable: cancellable3 }),
              stopLoading(this.previewEl),
              this._updateSubmitButtonState?.());
        }
      } finally {
        this._videoSubmitInFlight = false;
      }
    }
    async ['_buildPayloadImpl'](template2 = null, value190 = {}) {
      const value191 = store.getState?.() || {},
        value192 = value191.nodes?.[this.nodeId];
      value192 && typeof value192 === 'object' && (this._data = value192);
      let inEdges2 = store.getIncomingEdges(this.nodeId);
      shouldScopeRunningHubVideoSubmitEdges(this._data || {}) &&
        (inEdges2 = inEdges2.filter((item15) => item15?.targetId === this.nodeId));
      const nodes2 = value191.nodes || {};
      let list24 = [],
        list25 = [];
      for (const value193 of inEdges2) {
        const value194 = nodes2[value193.sourceId],
          value195 = String(value194?.type || '').toLowerCase(),
          value196 = value195 === 'source-image' || value195 === 'image' || value195 === 'ai-image';
        let generationInputImageUrl = '';
        value196 && (generationInputImageUrl = resolveGenerationInputImageUrl(value194));
        let url2 = value196 ? generationInputImageUrl : value194?.videoUrl || value194?.imageUrl || '';
        if (String(value194?.type || '') === 'ai-video') {
          const value197 = String(value193?.sourceMediaKey || '').trim();
          if (value197) {
            const list26 = Array.isArray(value194?.videos) ? value194.videos : [],
              value198 = list26.find((item16) => {
                const value199 =
                  String(item16?.localPath || '').trim() || String(item16?.videoUrl || '').trim();
                return value199 === value197;
              });
            value198 &&
              (url2 = localPathToUrl(value198.localPath) || String(value198.videoUrl || '').trim() || url2);
          }
        }
        if (!url2 && nodes2[value193.sourceId]?.sourceId) {
          const value200 = await getImage(nodes2[value193.sourceId].sourceId);
          if (value200) url2 = URL.createObjectURL(value200);
        }
        if (url2 && !list24.includes(url2)) list24.push(url2);
        if (value196) {
          const enabled25 = String(generationInputImageUrl || url2 || '').trim();
          enabled25 &&
            !enabled25.startsWith('blob:') &&
            !list25.includes(enabled25) &&
            list25.push(enabled25);
        }
      }
      const assetInputRefs2 = [],
        prompt2 = resolvePresetPromptTextWithTextRefs({
          template: template2,
          promptEl: this.promptEl,
          inEdges: inEdges2,
          nodes: nodes2,
          assetInputRefs: assetInputRefs2,
          assetMediaCounts: { image: 0, video: 0, audio: 0 },
          allowedAssetTypes: ['text', 'image', 'video', 'audio'],
        }),
        model4 = this._data.model || getDefaultRunningHubVideoWorkflowModelId(),
        isDreaminaStyleVideoModel2 = isDreaminaStyleVideoModel(model4, this._data.provider)
          ? resolveDreaminaStyleVideoProvider(model4, this._data.provider)
          : '',
        provider10 =
          this._data.provider || isDreaminaStyleVideoModel2 || resolveModelProvider(model4) || 'grsai',
        isRunningHubWorkflowNode2 = isRunningHubWorkflowNode({
          ...this._data,
          model: model4,
          provider: provider10,
        });
      if (isRunningHubWorkflowNode2) {
        const value201 = nodes2?.[this.nodeId] || this._data || {};
        assetInputRefs2.push(
          ...getPromptAssetInputRefsFromNode(value201, { allowedTypes: ['image', 'video', 'audio'] }),
        );
      }
      const list27 = assetInputRefs2
          .filter((response15) => response15.type === 'image' && response15.url)
          .map((response16) => response16.url),
        assetVideoCount2 = assetInputRefs2
          .filter((response17) => response17.type === 'video' && response17.url)
          .map((response18) => response18.url),
        list28 = assetInputRefs2
          .filter((response19) => response19.type === 'audio' && response19.url)
          .map((response20) => response20.url);
      for (const response21 of assetInputRefs2) {
        if (response21.url && !list24.includes(response21.url)) list24.push(response21.url);
        response21.type === 'image' &&
          response21.url &&
          !list25.includes(response21.url) &&
          list25.push(response21.url);
      }
      const isDreaminaStyleVideoModel3 = isDreaminaStyleVideoModel(model4, provider10),
        inputUrls = isDreaminaStyleVideoModel3 ? list25.slice(0, 1) : list24,
        modelManifest4 =
          resolveModelExecution(model4, { providerHint: provider10 }) || resolveModelExecution(model4),
        value202 =
          modelManifest4?.modelManifest?.adapterType === 'modelApi' &&
          modelManifest4?.modelManifest?.kind === 'video' &&
          modelManifest4?.executionManifest?.adapterType === 'modelApi',
        enabled26 = this._isRunninghubWorkflowModel(model4, provider10) || isRunningHubWorkflowNode2;
      if (isHappyHorseVideoModel(model4, provider10) && !prompt2)
        return (window.showToast?.(videoTaskText('validation.happyHorse.promptRequired'), 'warn'), null);
      if (!isDreaminaStyleVideoModel3 && !enabled26 && !prompt2 && !inputUrls.length) return null;
      const value203 = this._data.resolution || '1080p',
        rhInstanceType = enabled26
          ? String(resolveVideoWorkflowSchemaParam(this._data, model4, 'rhInstanceType')) === 'plus'
            ? 'plus'
            : 'default'
          : this._data.rhInstanceType;
      await ensureConfig();
      const value204 = getProviderConfig(provider10);
      let apiKey5 = '';
      if (provider10 === 'runninghub')
        apiKey5 = isModelApiModel(model4, provider10) ? value204.modelApiKey || '' : value204.apiKey || '';
      else
        provider10 === 'runninghubwf' ? (apiKey5 = value204.apiKey || '') : (apiKey5 = value204.apiKey || '');
      const args7 = getPlainObject(this._data.generationParams),
        aspectRatio = (value205, value206) =>
          Object.prototype.hasOwnProperty.call(args7, value205) ? args7[value205] : value206,
        payload5 = {
          prompt: prompt2,
          model: model4,
          generationParams: { ...args7 },
          aspectRatio: aspectRatio('aspectRatio', this._data.aspectRatio || '1:1'),
          resolution: aspectRatio('resolution', value203),
          videoSize: aspectRatio('resolution', value203),
          duration: aspectRatio('duration', this._data.duration || 5),
          mode: this._data.mode || '全能参考',
          provider: provider10,
          apiKey: apiKey5,
          cameraAngle: this._data.cameraAngle,
          inputUrls: inputUrls,
          rhInstanceType: rhInstanceType,
          installId: String(window.__aicInstallId || '').trim(),
        };
      if (value190?.randomizeSubmitParams === true && value202) {
        const args8 = buildSubmitRandomizedSeedPatch({
          modelManifest: modelManifest4?.modelManifest || null,
          nodeData: this._data,
          payload: payload5,
        });
        args8 &&
          ((payload5.generationParams = args8.requestParams),
          store.updateNodeData?.(this.nodeId, args8.storePatch),
          (this._data = { ...(this._data || {}), ...args8.storePatch }));
      }
      const run2 = (value207, value208) => {
          const list29 = Array.isArray(value207?.videos) ? value207.videos : [];
          if (!list29.length) return null;
          const value209 = String(value208?.sourceMediaKey || '').trim();
          if (value209) {
            const value210 = list29.find((item17) => {
              const value211 =
                String(item17?.localPath || '').trim() || String(item17?.videoUrl || '').trim();
              return value211 === value209;
            });
            if (value210) return value210;
          }
          const value212 = Number(value207?.mainVideoIndex),
            value213 = Number.isFinite(value212) ? Math.max(0, Math.trunc(value212)) : 0;
          return list29[Math.min(value213, list29.length - 1)] || null;
        },
        getVideoUrl = (response22, value214 = null) => {
          const value215 = String(response22?.type || '') === 'ai-video' ? run2(response22, value214) : null,
            value216 = String(value215?.localPath || '').trim(),
            url3 = localPathToUrl(value216);
          if (url3) return this._resolveMediaUrl(url3);
          const value217 = String(value215?.displayLocalPath || '').trim(),
            url4 = localPathToUrl(value217);
          if (url4) return this._resolveMediaUrl(url4);
          const value218 = String(value215?.originalLocalPath || '').trim(),
            url5 = localPathToUrl(value218);
          if (url5) return this._resolveMediaUrl(url5);
          const value219 = String(value215?.videoUrl || '').trim();
          if (value219) return this._resolveMediaUrl(value219);
          const value220 = String(response22?.localPath || '').trim(),
            url6 = localPathToUrl(value220);
          if (url6) return this._resolveMediaUrl(url6);
          const value221 = String(response22?.displayLocalPath || '').trim(),
            url7 = localPathToUrl(value221);
          if (url7) return this._resolveMediaUrl(url7);
          const value222 = String(response22?.originalLocalPath || '').trim(),
            url8 = localPathToUrl(value222);
          if (url8) return this._resolveMediaUrl(url8);
          const value223 = String(response22?.videoLocalPath || '').trim(),
            url9 = localPathToUrl(value223);
          if (url9) return this._resolveMediaUrl(url9);
          const value224 = String(response22?.videoUrl || '').trim();
          if (value224) return this._resolveMediaUrl(value224);
          const value225 = String(response22?.src || '').trim();
          if (value225) return this._resolveMediaUrl(value225);
          const value226 = String(response22?.url || '').trim();
          if (value226) return this._resolveMediaUrl(value226);
          const value227 = String(response22?.resultUrl || '').trim();
          if (value227) return this._resolveMediaUrl(value227);
          const value228 = String(response22?.sourceUrl || '').trim();
          if (value228) return this._resolveMediaUrl(value228);
          return '';
        },
        getImageUrl = (value229) => {
          const generationInputImageUrl2 = resolveGenerationInputImageUrl(value229);
          return generationInputImageUrl2 ? this._resolveMediaUrl(generationInputImageUrl2) : '';
        },
        getMaskImageUrl = (value230) => {
          const enabled27 = String(
            value230?.mask ||
              value230?.maskImageDataUrl ||
              value230?.maskImageUrl ||
              value230?.maskUrl ||
              value230?.maskLocalPath ||
              '',
          ).trim();
          if (!enabled27) return '';
          const url10 = localPathToUrl(enabled27);
          return this._resolveMediaUrl(url10 || enabled27);
        },
        getAudioUrl = (value231) => {
          const value232 = String(value231?.localPath || '').trim(),
            url11 = localPathToUrl(value232);
          if (url11) return this._resolveMediaUrl(url11);
          const value233 = String(value231?.audioUrl || '').trim();
          if (value233) return this._resolveMediaUrl(value233);
          const value234 = String(value231?.src || '').trim();
          if (value234) return this._resolveMediaUrl(value234);
          return '';
        };
      if (isDreaminaStyleVideoModel3) {
        let value235 = this._data;
        typeof this._normalizeDreaminaNodeData === 'function' &&
          ((value235 = this._normalizeDreaminaNodeData(this._data, { syncStore: true }) || this._data),
          (this._data = value235));
        const args9 = getPlainObject(value235?.generationParams),
          handler17 = (value236, value237) => {
            const value238 = Array.isArray(value236) ? value236 : [value236];
            for (const value239 of value238) {
              const value240 = String(value239 || '').trim();
              if (value240 && Object.prototype.hasOwnProperty.call(args9, value240)) return args9[value240];
            }
            return value237;
          },
          provider11 = resolveDreaminaStyleVideoProvider(
            value235?.model || model4,
            value235?.provider || provider10,
          ),
          imageCount = list27.slice(),
          videoCount = assetVideoCount2.slice(),
          audioCount = list28.slice(),
          providerAssetRefs = [];
        for (const refSlot2 of inEdges2) {
          const enabled28 = nodes2[refSlot2.sourceId];
          if (!enabled28) continue;
          const list30 = String(enabled28?.type || '').toLowerCase();
          if (list30.includes('image')) {
            const sourceUrl = getImageUrl(enabled28);
            sourceUrl &&
              (imageCount.push(sourceUrl),
              appendApimartPrivateAvatarProviderAssetRefs(providerAssetRefs, enabled28, {
                kind: 'image',
                sourceUrl: sourceUrl,
                refSlot: refSlot2?.refSlot,
                edgeId: refSlot2?.id,
              }));
            continue;
          }
          if (list30.includes('video')) {
            const sourceUrl2 = getVideoUrl(enabled28, refSlot2);
            sourceUrl2 &&
              (videoCount.push(sourceUrl2),
              appendApimartPrivateAvatarProviderAssetRefs(providerAssetRefs, enabled28, {
                kind: 'video',
                sourceUrl: sourceUrl2,
                refSlot: refSlot2?.refSlot,
                edgeId: refSlot2?.id,
              }));
            continue;
          }
          if (list30.includes('audio')) {
            const value241 = getAudioUrl(enabled28);
            if (value241) audioCount.push(value241);
          }
        }
        const routeMode = normalizeDreaminaVideoRouteMode(
          handler17(
            ['dreaminaRouteMode', 'volcengine_seedance_2_mode', 'rh_seedance_2_mode'],
            value235?.dreaminaRouteMode,
          ),
          value235?.mode,
        );
        if (!isDreaminaVideoRouteModeEnabled(routeMode))
          return (window.showToast?.(videoTaskText('toasts.smartMultiframeUnavailable'), 'warn'), null);
        const taskType = resolveDreaminaVideoTaskType({
            routeMode: routeMode,
            imageCount: imageCount.length,
            videoCount: videoCount.length,
            audioCount: audioCount.length,
          }),
          validateDreaminaVideoRouteSelection2 = validateDreaminaVideoRouteSelection({
            routeMode: routeMode,
            taskType: taskType,
            imageCount: imageCount.length,
            videoCount: videoCount.length,
            audioCount: audioCount.length,
          });
        if (validateDreaminaVideoRouteSelection2)
          return (window.showToast?.(validateDreaminaVideoRouteSelection2, 'warn'), null);
        const model5 =
            ensureDreaminaStyleVideoModelForTask(
              taskType,
              normalizeDreaminaStyleVideoModel(value235?.model, provider11),
              provider11,
            ) || normalizeDreaminaStyleVideoModel(value235?.model, provider11),
          resolution = normalizeDreaminaStyleVideoResolution(
            taskType,
            model5,
            handler17('resolution', value235?.resolution || value235?.videoSize),
            provider11,
          ),
          dreaminaVideoAspectRatio = normalizeDreaminaVideoAspectRatio(
            handler17('aspectRatio', value235?.aspectRatio),
          );
        let aspectRatio2 = dreaminaVideoAspectRatio;
        const value242 = String(handler17('aspectRatio', value235?.aspectRatio) || '').trim(),
          isAdaptiveRatioLabel2 = isAdaptiveRatioLabel(value242);
        if (isAdaptiveRatioLabel2) {
          const dreaminaAdaptiveSourceRatio = pickDreaminaAdaptiveSourceRatio({
              inEdges: inEdges2,
              nodes: nodes2,
              provider: provider11,
              model: model5,
            }),
            value243 =
              dreaminaAdaptiveSourceRatio || this._resolveDreaminaAdaptiveAspectRatioFromNode(value235);
          aspectRatio2 = value243;
        }
        const duration = normalizeDreaminaStyleVideoDuration(
            taskType,
            model5,
            handler17('duration', value235?.duration),
            provider11,
          ),
          dreaminaStyleVideoDefaultModel = getDreaminaStyleVideoDefaultModel(taskType, provider11),
          enabled29 = {
            prompt: prompt2,
            provider: provider11,
            model: model5 || dreaminaStyleVideoDefaultModel,
            generationParams: { ...args9 },
            modelVersion:
              provider11 === 'dreamina' ? getDreaminaStyleVideoModelVersion(model5, provider11) : '',
            dreaminaRouteMode: routeMode,
            dreaminaTaskType: taskType,
            aspectRatio: aspectRatio2,
            duration: duration,
            resolution: resolution,
            videoResolution: resolution,
            videoSize: resolution,
            images: imageCount,
            videos: videoCount,
            audios: audioCount,
            inputUrls: imageCount.slice(),
            providerAssetRefs: providerAssetRefs,
            installId: String(window.__aicInstallId || '').trim(),
          };
        Object.keys(args9).length <= 0 && delete enabled29.generationParams;
        if (providerAssetRefs.length <= 0) delete enabled29.providerAssetRefs;
        if (!enabled29.modelVersion) delete enabled29.modelVersion;
        !resolution &&
          (delete enabled29.resolution, delete enabled29.videoResolution, delete enabled29.videoSize);
        if (taskType === 'text2video') {
          if (!prompt2) return null;
          return (
            (enabled29.inputUrls = []),
            (enabled29.images = []),
            (enabled29.videos = []),
            (enabled29.audios = []),
            enabled29
          );
        }
        if (taskType === 'image2video') {
          if (!prompt2 || !imageCount[0]) return null;
          ((enabled29.image = imageCount[0]),
            (enabled29.inputUrls = [imageCount[0]]),
            (enabled29.images = [imageCount[0]]));
          if (provider11 === 'dreamina') delete enabled29.aspectRatio;
          return enabled29;
        }
        if (taskType === 'frames2video') {
          if (!prompt2 || imageCount.length < 2) return null;
          ((enabled29.first = imageCount[0]),
            (enabled29.last = imageCount[1]),
            (enabled29.inputUrls = imageCount.slice(0, 2)),
            (enabled29.images = imageCount.slice(0, 2)));
          if (provider11 === 'dreamina') delete enabled29.aspectRatio;
          return enabled29;
        }
        if (taskType === 'multiframe2video') {
          const list31 = imageCount.slice(0, 20);
          if (list31.length < 2) return null;
          const value244 = Math.max(0, list31.length - 1),
            value245 = Array.isArray(value235?.dreaminaTransitionPrompts)
              ? value235.dreaminaTransitionPrompts
              : [],
            value246 = Array.isArray(value235?.dreaminaTransitionDurations)
              ? value235.dreaminaTransitionDurations
              : [],
            list32 = [],
            list33 = [];
          for (let value247 = 0; value247 < value244; value247 += 1) {
            const value248 = String(value245[value247] || '').trim() || prompt2,
              count20 = Number(value246[value247]),
              value249 = Number.isFinite(count20) && count20 > 0 ? Math.max(1, Math.trunc(count20)) : 3;
            (list32.push(value248), list33.push(value249));
          }
          if (!prompt2 && !list32.some((item18) => String(item18 || '').trim())) return null;
          return (
            (enabled29.images = list31),
            (enabled29.inputUrls = list31.slice()),
            (enabled29.transitionPrompts = list32),
            (enabled29.transitionDurations = list33),
            list31.length === 2 &&
              ((enabled29.prompt = list32[0] || prompt2),
              (enabled29.duration = list33[0] || 3),
              delete enabled29.transitionPrompts,
              delete enabled29.transitionDurations),
            delete enabled29.modelVersion,
            delete enabled29.model,
            delete enabled29.aspectRatio,
            delete enabled29.resolution,
            delete enabled29.videoResolution,
            delete enabled29.videoSize,
            enabled29
          );
        }
        if (taskType === 'multimodal2video') {
          if (imageCount.length <= 0 && videoCount.length <= 0) return null;
          if (!enabled29.modelVersion) {
            if (provider11 === 'dreamina')
              ((enabled29.model = dreaminaStyleVideoDefaultModel || enabled29.model),
                (enabled29.modelVersion = getDreaminaStyleVideoModelVersion(enabled29.model, provider11)));
            else !enabled29.model && (enabled29.model = APIMART_DREAMINA_VIDEO_DEFAULT_MODEL);
          }
          return enabled29;
        }
        return null;
      }
      if (enabled26) {
        const runningHubVideoWorkflowSubmitPatch = await buildRunningHubVideoWorkflowSubmitPatch({
          model: model4,
          nodeData: this._data,
          inEdges: inEdges2,
          nodes: nodes2,
          assetInputRefs: assetInputRefs2,
          prompt: prompt2,
          helpers: {
            getVideoUrl: getVideoUrl,
            getImageUrl: getImageUrl,
            getMaskImageUrl: getMaskImageUrl,
            getAudioUrl: getAudioUrl,
          },
        });
        if (runningHubVideoWorkflowSubmitPatch === null) return null;
        return (
          Object.assign(payload5, runningHubVideoWorkflowSubmitPatch.payloadPatch || {}),
          applyVideoManifestAdaptiveRatio(payload5, {
            inEdges: inEdges2,
            nodes: nodes2,
            nodeData: this._data,
            provider: provider10,
            model: model4,
            modelManifest: modelManifest4?.modelManifest || null,
          }),
          Object.keys(runningHubVideoWorkflowSubmitPatch.updateData || {}).length > 0 &&
            store.updateNodeData(this.nodeId, runningHubVideoWorkflowSubmitPatch.updateData),
          payload5
        );
      }
      if (value202 && !isDreaminaStyleVideoModel3) {
        const images10 = list25.slice(),
          imageRefs2 = [],
          refs2 = [],
          videos9 = [],
          videoEntries2 = [],
          audios4 = [],
          audioEntries2 = [],
          list34 = [],
          handler18 = (list35, value250) => {
            const value251 = String(value250 || '').trim();
            if (value251 && !list35.includes(value251)) list35.push(value251);
          },
          handler19 = (value252, args10 = {}) => {
            const url12 = String(value252 || '').trim();
            if (!url12) return;
            const count21 = videos9.indexOf(url12),
              args11 = { ...args10, url: url12 };
            if (count21 < 0) {
              (videos9.push(url12), videoEntries2.push(args11));
              return;
            }
            const args12 = videoEntries2[count21] || {};
            !(Number(args12.duration) > 0) &&
              Number(args11.duration) > 0 &&
              (videoEntries2[count21] = { ...args12, ...args11 });
          },
          handler20 = (value253, args13 = {}) => {
            const url13 = String(value253 || '').trim();
            if (!url13) return;
            const count22 = audios4.indexOf(url13),
              value254 = { ...args13, url: url13 };
            if (count22 < 0) {
              (audios4.push(url13), audioEntries2.push(value254));
              return;
            }
            const args14 = audioEntries2[count22] || {};
            audioEntries2[count22] = {
              ...args14,
              ...Object.fromEntries(
                Object.entries(value254).filter(([, value255]) => {
                  if (value255 === '' || value255 == null) return false;
                  if (Number(value255) === 0) return false;
                  return true;
                }),
              ),
            };
          };
        (assetInputRefs2
          .filter((response23) => response23?.type === 'audio' && response23?.url)
          .forEach((assetRefSource) => {
            handler20(assetRefSource.url, {
              duration: getAudioDurationFromAssetRef(assetRefSource),
              sizeBytes: getAudioSizeBytesFromAssetRef(assetRefSource),
              assetRefSource: assetRefSource.assetRefSource || '',
            });
          }),
          assetInputRefs2
            .filter((response24) => response24?.type === 'video' && response24?.url)
            .forEach((assetRefSource2) => {
              (handler19(assetRefSource2.url, {
                duration: getVideoDurationFromAssetRef(assetRefSource2),
                assetRefSource: assetRefSource2.assetRefSource || '',
              }),
                refs2.push({ refSlot: assetRefSource2?.refSlot || '', url: assetRefSource2.url }));
            }));
        for (const refSlot3 of inEdges2) {
          const response25 = nodes2[refSlot3.sourceId];
          if (!response25) continue;
          const list36 = String(response25?.type || '').toLowerCase();
          if (list36.includes('image')) {
            const url14 =
              getImageUrl(response25) || response25?.imageUrl || response25?.src || response25?.url;
            (handler18(images10, url14),
              String(url14 || '').trim() &&
                (imageRefs2.push({ refSlot: refSlot3?.refSlot || '', url: url14 }),
                appendApimartPrivateAvatarProviderAssetRefs(list34, response25, {
                  kind: 'image',
                  sourceUrl: url14,
                  refSlot: refSlot3?.refSlot,
                  edgeId: refSlot3?.id,
                })));
          } else {
            if (list36.includes('video')) {
              const value256 =
                  String(response25?.type || '') === 'ai-video' ? run2(response25, refSlot3) : null,
                url15 = getVideoUrl(response25, refSlot3);
              (handler19(url15, {
                duration: getVideoDurationFromSource(response25, value256),
                edgeId: refSlot3?.id,
              }),
                String(url15 || '').trim() &&
                  (refs2.push({ refSlot: refSlot3?.refSlot || '', url: url15 }),
                  appendApimartPrivateAvatarProviderAssetRefs(list34, response25, {
                    kind: 'video',
                    sourceUrl: url15,
                    refSlot: refSlot3?.refSlot,
                    edgeId: refSlot3?.id,
                  })));
            } else
              list36.includes('audio') &&
                handler20(getAudioUrl(response25), {
                  duration: getAudioDurationFromSource(response25),
                  sizeBytes: getAudioSizeBytesFromSource(response25),
                  edgeId: refSlot3?.id,
                });
          }
        }
        applyModelApiVideoAdaptiveRatio(payload5, {
          inEdges: inEdges2,
          nodes: nodes2,
          nodeData: this._data,
          provider: provider10,
          model: model4,
          modelManifest: modelManifest4?.modelManifest || null,
        });
        if (isHappyHorseVideoModel(model4, provider10)) {
          const mode2 = getHappyHorseMode(this._data),
            fixedInputConfig2 = getFixedInputSlotConfigFromManifest(this._data || {}),
            slotUrls2 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: fixedInputConfig2,
              imageRefs: imageRefs2,
              assetInputRefs: assetInputRefs2,
            }),
            images11 = orderHappyHorseImageUrls({ mode: mode2, images: images10, slotUrls: slotUrls2 }),
            error19 = buildHappyHorseMediaPayload({
              prompt: prompt2,
              mode: mode2,
              images: images11,
              videos: videos9,
              videoEntries: videoEntries2,
              assetVideoCount: assetVideoCount2.length,
              maxVideoSeconds: getHappyHorseVideoInputMaxSeconds(model4, provider10),
            });
          if (!error19.ok) return (window.showToast?.(error19.message, 'warn'), null);
          const happyhorse_mode = error19.mode || mode2;
          return (
            (payload5.generationParams = { ...payload5.generationParams, happyhorse_mode: happyhorse_mode }),
            (payload5.images = error19.images),
            (payload5.videos = error19.videos),
            (payload5.audios = []),
            (payload5.inputUrls = error19.inputUrls),
            payload5
          );
        }
        if (isWan27VideoModel(model4, provider10)) {
          const mode3 = getWan27Mode(this._data),
            fixedInputConfig3 = getFixedInputSlotConfigFromManifest(this._data || {}),
            videoInputUrlsByFixedKindSlot = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: fixedInputConfig3,
              refs: refs2,
              assetInputRefs: assetInputRefs2,
              kind: 'video',
            }),
            videos10 = [],
            handler21 = (value257) => {
              const value258 = String(value257 || '').trim();
              value258 && !videos10.includes(value258) && videos10.push(value258);
            };
          if (mode3 === 'video') handler21(videoInputUrlsByFixedKindSlot.sourceVideo);
          else {
            if (mode3 === 'reference') handler21(videoInputUrlsByFixedKindSlot.referenceVideo);
            else
              mode3 === 'edit' &&
                (handler21(videoInputUrlsByFixedKindSlot.originalVideo),
                handler21(videoInputUrlsByFixedKindSlot.referenceVideo));
          }
          videos9.forEach(handler21);
          const error20 = buildWan27MediaPayload({
            mode: mode3,
            images: images10,
            videos: videos10,
            audios: audios4,
            videoEntries: videoEntries2,
            audioEntries: audioEntries2,
            assetVideoCount: assetVideoCount2.length,
          });
          if (!error20.ok) return (window.showToast?.(error20.message, 'warn'), null);
          ((payload5.generationParams = { ...payload5.generationParams, wan27_mode: mode3 }),
            (payload5.images = error20.images),
            (payload5.videos = error20.videos),
            (payload5.audios = error20.audios),
            (payload5.inputUrls = error20.inputUrls));
          if (mode3 === 'image' || mode3 === 'reference') {
            const videoInputUrlsByFixedImageSlot = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: fixedInputConfig3,
              imageRefs: imageRefs2,
              assetInputRefs: assetInputRefs2,
            });
            Object.keys(videoInputUrlsByFixedImageSlot).length > 0 &&
              (payload5.inputUrlsBySlot = videoInputUrlsByFixedImageSlot);
          }
          return payload5;
        }
        if (isKlingV3OmniVideoModel(model4, provider10)) {
          const mode4 = getKlingV3OmniMode(this._data),
            fixedInputConfig4 = getFixedInputSlotConfigFromManifest(this._data || {}),
            videoInputUrlsByFixedImageSlot2 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: fixedInputConfig4,
              imageRefs: imageRefs2,
              assetInputRefs: assetInputRefs2,
            }),
            images12 = [],
            handler22 = (value259) => {
              const value260 = String(value259 || '').trim();
              value260 && !images12.includes(value260) && images12.push(value260);
            };
          if (mode4 === 'image')
            (handler22(videoInputUrlsByFixedImageSlot2.firstFrame),
              handler22(videoInputUrlsByFixedImageSlot2.lastFrame));
          else mode4 === 'reference' && handler22(videoInputUrlsByFixedImageSlot2.referenceImage);
          images10.forEach(handler22);
          const videoInputUrlsByFixedKindSlot2 = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: fixedInputConfig4,
              refs: refs2,
              assetInputRefs: assetInputRefs2,
              kind: 'video',
            }),
            videos11 = [],
            handler23 = (value261) => {
              const value262 = String(value261 || '').trim();
              value262 && !videos11.includes(value262) && videos11.push(value262);
            };
          if (mode4 === 'reference') handler23(videoInputUrlsByFixedKindSlot2.referenceVideo);
          else mode4 === 'edit' && handler23(videoInputUrlsByFixedKindSlot2.editVideo);
          videos9.forEach(handler23);
          const error21 = buildKlingV3OmniMediaPayload({
            mode: mode4,
            images: images12,
            videos: videos11,
            videoEntries: videoEntries2,
            assetVideoCount: assetVideoCount2.length,
          });
          if (!error21.ok) return (window.showToast?.(error21.message, 'warn'), null);
          ((payload5.generationParams = { ...payload5.generationParams, kling_v3_omni_mode: mode4 }),
            (payload5.images = error21.images),
            (payload5.videos = error21.videos),
            (payload5.audios = []),
            (payload5.inputUrls = error21.inputUrls));
          if (mode4 === 'image' || mode4 === 'reference') {
            const value263 = {};
            if (mode4 === 'image')
              (videoInputUrlsByFixedImageSlot2.firstFrame &&
                (value263.firstFrame = videoInputUrlsByFixedImageSlot2.firstFrame),
                videoInputUrlsByFixedImageSlot2.lastFrame &&
                  (value263.lastFrame = videoInputUrlsByFixedImageSlot2.lastFrame));
            else
              videoInputUrlsByFixedImageSlot2.referenceImage &&
                (value263.referenceImage = videoInputUrlsByFixedImageSlot2.referenceImage);
            Object.keys(value263).length > 0 && (payload5.inputUrlsBySlot = value263);
          }
          return payload5;
        }
        if (isKlingO1VideoModel(model4, provider10)) {
          const fixedInputConfig5 = getFixedInputSlotConfigFromManifest(this._data || {}),
            videoInputUrlsByFixedImageSlot3 = buildVideoInputUrlsByFixedImageSlot({
              fixedInputConfig: fixedInputConfig5,
              imageRefs: imageRefs2,
              assetInputRefs: assetInputRefs2,
            }),
            images13 = [],
            handler24 = (value264) => {
              const value265 = String(value264 || '').trim();
              value265 && !images13.includes(value265) && images13.push(value265);
            };
          (handler24(videoInputUrlsByFixedImageSlot3.referenceImage), images10.forEach(handler24));
          const videoInputUrlsByFixedKindSlot3 = buildVideoInputUrlsByFixedKindSlot({
              fixedInputConfig: fixedInputConfig5,
              refs: refs2,
              assetInputRefs: assetInputRefs2,
              kind: 'video',
            }),
            hasEditVideo2 = !!videoInputUrlsByFixedKindSlot3.editVideo,
            videoRole2 = !!videoInputUrlsByFixedKindSlot3.featureReferenceVideo,
            videos12 = [],
            handler25 = (value266) => {
              const value267 = String(value266 || '').trim();
              value267 && !videos12.includes(value267) && videos12.push(value267);
            };
          (handler25(videoInputUrlsByFixedKindSlot3.editVideo),
            handler25(videoInputUrlsByFixedKindSlot3.featureReferenceVideo),
            videos9.forEach(handler25));
          const error22 = buildKlingO1MediaPayload({
            prompt: payload5.prompt,
            images: images13,
            videos: videos12,
            videoEntries: videoEntries2,
            videoRole: videoRole2 ? 'feature' : 'base',
            hasEditVideo: hasEditVideo2,
            hasFeatureVideo: videoRole2,
          });
          if (!error22.ok) return (window.showToast?.(error22.message, 'warn'), null);
          return (
            (payload5.prompt = error22.prompt),
            (payload5.images = error22.images),
            (payload5.videos = error22.videos),
            (payload5.audios = []),
            (payload5.inputUrls = error22.inputUrls),
            error22.videoRole
              ? (payload5.klingO1VideoRole = error22.videoRole)
              : delete payload5.klingO1VideoRole,
            payload5
          );
        }
        ((payload5.images = images10),
          (payload5.videos = videos9),
          (payload5.audios = audios4),
          (payload5.inputUrls = images10));
        list34.length > 0 && (payload5.providerAssetRefs = list34);
        const fixedInputConfig6 = getFixedInputSlotConfigFromManifest(this._data || {}),
          videoInputUrlsByFixedImageSlot4 = buildVideoInputUrlsByFixedImageSlot({
            fixedInputConfig: fixedInputConfig6,
            imageRefs: imageRefs2,
            assetInputRefs: assetInputRefs2,
          });
        Object.keys(videoInputUrlsByFixedImageSlot4).length > 0 &&
          (payload5.inputUrlsBySlot = videoInputUrlsByFixedImageSlot4);
      }
      return payload5;
    }
  }
  return value71.prototype;
}
