import {
  getDefaultDreaminaImageModelId,
  getDreaminaImageModelVersion,
  isDreaminaImageModel,
  normalizeDreaminaImageAspectRatio,
  normalizeDreaminaImageModel,
  normalizeDreaminaImageSize,
} from './dreaminaModelMenuHelper.js';
import { setNodeMediaLodHoverPromoted } from '../../modules/canvasImageLod.js';
import {
  NANO_BANANA_FAMILIES,
  resolveNanoBananaModelBySelection,
  resolveNanoBananaSelectionFromModel,
} from '../../modules/nanoBananaModeRules.js';
import {
  getRatioCapability,
  isAdaptiveRatioLabel,
  parseRatioLabel,
  pickClosestRatioForProviderModel,
  resolveAdaptiveSourceSize,
  resolveProviderRatioPayload,
} from '../../../api/imageRatioPolicy.js';
import {
  appendAssetMentionToPrompt,
  getPromptAssetInputRefsFromNode,
  insertPresetPromptIntoEditor,
  isRunningHubWorkflowNode,
  previewPresetPromptInEditor,
  shouldUsePromptPreviewForPreset,
} from '../../modules/nodePromptShared.js';
import { getFixedInputSlotConfigFromManifest } from '../../modules/fixedInputAssetRefs.js';
import {
  getPromptPresetTemplateEmptyInputMessage,
  requiresPromptPresetInput,
  resolvePromptPresetTemplate,
} from '../../modules/promptPresetTemplate.js';
import { normalizeImageSizeForProviderModel } from '../../modules/imageModelCapabilities.js';
import {
  getGenerationRatioSizeWithDom,
  pickGenerationRatioSourceEdge,
} from '../../modules/generationRatioSource.js';
import {
  getTargetInputPolicy,
  isRhPersonReplaceWorkflowModel,
  isRhQwenImageEditModel,
  isInputKindAllowed,
  resolveEffectiveInputKind,
} from '../../modules/modelInputPolicy.js';
import {
  getModelManifest,
  isModelApiModel,
  isWorkflowModel,
  resolveModelExecution,
  resolveModelProvider,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
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
import {
  buildGenerationCancelledPatch,
  buildGenerationStartPatch,
} from '../../core/generationTaskLifecycle.js';
import { cancelTask, resumeTask, submitTask } from '../../core/generationTaskRuntime.js';
import { shouldAllowCancel, shouldShowGenerationBusyUi } from '../../core/generationTaskUiState.js';
import { resolveGenerationInputImageUrl } from '../../services/imageReferenceUrlService.js';
import { logDiagnosticEvent } from '../../services/diagnosticsService.js';
import { GENERATION_HISTORY_EVENT } from '../../modules/generationHistoryAssets.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from './imageGenerationResultRenderer.js';
import {
  getImageInputGateMissingMessage,
  getImageInputGateUploadedUrl,
  getImageNodeInputGate,
  shouldUseImageWorkflowBusyButton,
} from './imageNodeManifestPolicies.js';
import { t } from '../../i18n/index.js';
const DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 1000,
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
  ASYNC_IMAGE_MODEL_API_PROVIDERS = new Set(['apimart', 'grsai', 'ppio']);
function normalizeTaskStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function isAsyncImageModelApiProvider(item) {
  return ASYNC_IMAGE_MODEL_API_PROVIDERS.has(
    String(item || '')
      .trim()
      .toLowerCase(),
  );
}
function getImageProviderApiKeyMissingMessage(options = {}) {
  if (String(options?.apiKey || '').trim()) return '';
  const enabled = String(options?.provider || '')
    .trim()
    .toLowerCase();
  if (!enabled) return '';
  if (enabled === 'volcengine') return t('aigenImage.task.apiKeyMissing.volcengine');
  if (enabled === 'runninghub')
    return isModelApiModel(options?.model, 'runninghub')
      ? t('aigenImage.task.apiKeyMissing.runninghubModel')
      : t('aigenImage.task.apiKeyMissing.runninghub');
  if (enabled === 'runninghubwf') return t('aigenImage.task.apiKeyMissing.runninghub');
  if (enabled === 'apimart') return t('aigenImage.task.apiKeyMissing.apimart');
  if (enabled === 'ppio') return t('aigenImage.task.apiKeyMissing.ppio');
  if (enabled === 'grsai') return t('aigenImage.task.apiKeyMissing.grsai');
  return '';
}
const REFERENCE_LABEL_ALIASES = Object.freeze({
  text: Object.freeze(['文本', 'Text']),
  image: Object.freeze(['图片', 'Image']),
  video: Object.freeze(['视频', 'Video']),
  audio: Object.freeze(['音频', 'Audio']),
});
function getReferenceTypeLabel(key) {
  const index = {
    text: t('aigenImage.refs.types.text'),
    image: t('aigenImage.refs.types.image'),
    video: t('aigenImage.refs.types.video'),
    audio: t('aigenImage.refs.types.audio'),
  };
  return index[key] || String(key || '');
}
function buildReferenceLabelAliases(result, data) {
  const target = [
    '@' + getReferenceTypeLabel(result) + data,
    ...(REFERENCE_LABEL_ALIASES[result] || []).map((item2) => '@' + item2 + data),
  ];
  return Array.from(new Set(target));
}
function createSchemaParamAccess({
  model: model,
  data: data2,
  generationParams: generationParams,
  manifestFields: manifestFields,
}) {
  const getManifestField = (source) =>
      manifestFields.find((item3) => String(item3?.id || '') === source) || null,
    readSchemaParam = (next) => {
      const enabled2 = getManifestField(next);
      if (!enabled2) return undefined;
      if (generationParams[next] !== undefined) return generationParams[next];
      return enabled2.defaultValue;
    },
    requireSchemaParam = (current) => {
      const entry = readSchemaParam(current);
      if (entry === undefined || entry === null || String(entry).trim() === '')
        throw new Error('Manifest model ' + model + ' missing ' + current);
      return entry;
    };
  return {
    getManifestField: getManifestField,
    readSchemaParam: readSchemaParam,
    requireSchemaParam: requireSchemaParam,
  };
}
function isGrsaiGptImage2Model(record, payload) {
  const nanoBananaSelectionFromModel = resolveNanoBananaSelectionFromModel(payload, '2K', record || 'grsai');
  return (
    nanoBananaSelectionFromModel?.provider === 'grsai' &&
    nanoBananaSelectionFromModel.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2
  );
}
function resolveGrsaiGptImage2ModelForSize({
  provider: provider2,
  model: model2,
  imageSize: imageSize,
} = {}) {
  if (!isGrsaiGptImage2Model(provider2, model2)) return model2;
  const handle = String(imageSize || '1K')
      .trim()
      .toUpperCase(),
    modelExecution =
      resolveModelExecution(model2, { providerHint: 'grsai' }) ||
      resolveModelExecution(resolveNanoBananaSelectionFromModel(model2, handle, 'grsai')?.model, {
        providerHint: 'grsai',
      }),
    enabled3 = modelExecution?.executionManifest?.imageSizeModels;
  if (!enabled3 || typeof enabled3 !== 'object') return model2;
  return enabled3[handle] || enabled3.default || modelExecution?.modelManifest?.modelId || model2;
}
function resolveImageSizeForProviderModel({
  provider: provider3,
  model: model3,
  imageSize: imageSize2,
} = {}) {
  const imageSizeForProviderModel = normalizeImageSizeForProviderModel({
    provider: provider3,
    model: model3,
    imageSize: imageSize2,
  });
  if (imageSizeForProviderModel) return imageSizeForProviderModel;
  if (
    !String(imageSize2 || '').trim() &&
    String(provider3 || '')
      .trim()
      .toLowerCase() === 'runninghub' &&
    String(model3 || '').trim() === 'runninghub-model/rhart-image-g'
  )
    return '1K';
  const state = String(imageSize2 || (isGrsaiGptImage2Model(provider3, model3) ? '1K' : '2K'))
    .trim()
    .toUpperCase();
  return state || '2K';
}
function shouldUseGrsaiNanoBananaApiAuto({ provider: provider4, model: model4 } = {}) {
  const config = String(provider4 || '')
    .trim()
    .toLowerCase();
  if (config !== 'grsai') return false;
  const nanoBananaSelectionFromModel2 = resolveNanoBananaSelectionFromModel(model4, '2K', provider4);
  if (!nanoBananaSelectionFromModel2) return false;
  return nanoBananaSelectionFromModel2.family !== NANO_BANANA_FAMILIES.GPT_IMAGE_2;
}
function shouldUseApimartSeedreamApiAuto({
  provider: provider5,
  model: model5,
  hasInputImages: hasInputImages,
} = {}) {
  const providerHint = String(provider5 || '')
    .trim()
    .toLowerCase();
  if (providerHint !== 'apimart' || !hasInputImages) return false;
  const modelExecution2 = resolveModelExecution(model5, { providerHint: providerHint });
  return modelExecution2?.executionManifest?.extensions?.apimartSeedream?.preserveAdaptiveInputRatio === true;
}
function sanitizeTaskGenerationParams(scope, input = {}) {
  const args = input && typeof input === 'object' && !Array.isArray(input) ? input : {},
    args2 = sanitizeModelUiSchemaParams(scope, args, { includeDefaults: false });
  return (
    Object.prototype.hasOwnProperty.call(args, 'aspectRatio') && (args2.aspectRatio = args.aspectRatio),
    { ...args, ...args2 }
  );
}
function normalizeTaskBooleanParam(output) {
  if (output === true || output === false) return output;
  const value2 = String(output ?? '')
    .trim()
    .toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(value2)) return true;
  if (['false', '0', 'no', 'off', ''].includes(value2)) return false;
  return Boolean(output);
}
const MODEL_API_PAYLOAD_SCHEMA_PARAM_EXCLUDES = Object.freeze(
  new Set([
    'mode',
    'rhModelRoute',
    'imageSize',
    'aspectRatio',
    'batchSize',
    'google_search',
    'google_image_search',
  ]),
);
function buildModelApiSchemaPayloadParams({
  isModelApiManifest: isModelApiManifest,
  manifestFields: manifestFields2,
  readSchemaParam: readSchemaParam2,
} = {}) {
  if (!isModelApiManifest || !Array.isArray(manifestFields2)) return {};
  return manifestFields2.reduce((item4, value3) => {
    const enabled4 = String(value3?.id || '').trim();
    if (!enabled4 || MODEL_API_PAYLOAD_SCHEMA_PARAM_EXCLUDES.has(enabled4)) return item4;
    return ((item4[enabled4] = readSchemaParam2(enabled4)), item4);
  }, {});
}
function reorderImageInputUrlsByRefOrder(list = [], value4 = []) {
  const list2 = (Array.isArray(list) ? list : []).map((item5) => String(item5 || '').trim()).filter(Boolean);
  if (list2.length <= 1) return list2;
  const map = new Set(list2),
    list3 = [],
    handler = (value5) => {
      const enabled5 = String(value5 || '').trim();
      if (!enabled5 || !map.has(enabled5)) return;
      (list3.push(enabled5), map.delete(enabled5));
    };
  return (
    (Array.isArray(value4) ? value4 : []).forEach((response) => {
      handler(response?.url);
    }),
    list2.forEach(handler),
    list3
  );
}
function buildInputUrlsByFixedImageSlot({
  fixedInputConfig: fixedInputConfig = null,
  imageRefs: imageRefs = [],
  assetInputRefs: assetInputRefs = [],
} = {}) {
  const list4 = (fixedInputConfig?.visibleSlots || [])
    .map((item6) => String(item6 || '').trim())
    .filter((item7) => item7 && String(fixedInputConfig?.slotKindById?.[item7] || '') === 'image');
  if (list4.length === 0) return {};
  const enabled6 = {},
    map2 = new Set(),
    handler2 = (value6, value7) => {
      const enabled7 = String(value6 || '').trim(),
        enabled8 = String(value7 || '').trim();
      if (!enabled7 || !enabled8 || enabled6[enabled7]) return false;
      if (!list4.includes(enabled7)) return false;
      return ((enabled6[enabled7] = enabled8), map2.add(enabled8), true);
    },
    handler3 = (value8) => {
      const enabled9 = String(value8 || '').trim();
      if (!enabled9 || map2.has(enabled9)) return false;
      const value9 = list4.find((item8) => !enabled6[item8]);
      return handler2(value9, enabled9);
    };
  return (
    (Array.isArray(imageRefs) ? imageRefs : []).forEach((response2) => {
      handler2(response2?.refSlot, response2?.url);
    }),
    (Array.isArray(assetInputRefs) ? assetInputRefs : []).forEach((response3) => {
      handler2(response3?.refSlot, response3?.url);
    }),
    (Array.isArray(imageRefs) ? imageRefs : []).forEach((response4) => {
      handler3(response4?.url);
    }),
    (Array.isArray(assetInputRefs) ? assetInputRefs : []).forEach((response5) => {
      const effectiveInputKind = resolveEffectiveInputKind(response5) || response5?.type;
      if (effectiveInputKind === 'image') handler3(response5?.url);
    }),
    enabled6
  );
}
export function createAIGenerateNodeTaskOrchestrationModule(value10) {
  const {
    store: store,
    api: api,
    getDisplayModelName: getDisplayModelName,
    _handlePillHover: _handlePillHover,
    _handlePillOut: _handlePillOut,
    _syncEdgesOrderFromPills: _syncEdgesOrderFromPills,
    _syncPillLabels: _syncPillLabels,
    _checkAtTrigger: _checkAtTrigger,
    _populateMentionMenu: _populateMentionMenu,
    _insertMentionPill: _insertMentionPill,
    _handlePillKeyboard: _handlePillKeyboard,
    _rehydratePromptPills: _rehydratePromptPills,
    _handleMentionMenuKeyboard: _handleMentionMenuKeyboard,
    TEXT_TOOLBAR_HTML: TEXT_TOOLBAR_HTML,
    bindTextToolbarEvents: bindTextToolbarEvents,
    IMAGE_TOOLBAR_HTML: IMAGE_TOOLBAR_HTML,
    bindImageToolbarEvents: bindImageToolbarEvents,
    showDevToast: showDevToast,
    getImage: getImage,
    openNodeImagePreview: openNodeImagePreview,
    getPromptPresets: getPromptPresets,
    openCustomPresetsManager: openCustomPresetsManager,
    startLoading: startLoading,
    stopLoading: stopLoading,
    bindRefThumbHoverPreview: bindRefThumbHoverPreview,
    ensureThumbDecoded: ensureThumbDecoded,
    revealRefThumbMedia: revealRefThumbMedia,
    getRefKindByNodeType: getRefKindByNodeType,
    uploadFile: uploadFile,
    ensureConfig: ensureConfig,
    getProviderConfig: getProviderConfig,
    generateId: generateId,
    checkSlashTrigger: checkSlashTrigger,
    handleSlashKeyboardNavigation: handleSlashKeyboardNavigation,
    closeSlashMenu: closeSlashMenu,
    activateMenuKeyboard: activateMenuKeyboard,
    ImageFreeAngleController: ImageFreeAngleController,
  } = value10;
  class value11 {
    ['_persistRunningHubResumeCache']() {
      try {
        window._triggerLocalCacheSave?.();
      } catch {}
    }
    ['_persistDreaminaResumeCache']() {
      this._persistRunningHubResumeCache();
    }
    ['_persistAsyncResumeCache']() {
      this._persistRunningHubResumeCache();
    }
    ['_isDreaminaImageNode'](value12 = this._data) {
      return resolveModelProvider(value12?.model, value12?.provider) === 'dreamina';
    }
    ['_inferProviderFromModel'](value13, value14 = '') {
      return (
        resolveModelProvider(value13, '', { allowProviderHint: false }) ||
        resolveModelProvider(value13, value14) ||
        resolveModelProvider(value13, 'grsai')
      );
    }
    ['_isRunninghubTaskModel'](value15, value16) {
      const modelProvider = resolveModelProvider(value15, value16, { allowProviderHint: false }),
        value17 = String(value16 || modelProvider || '')
          .trim()
          .toLowerCase();
      return (
        ((value17 === 'runninghub' || modelProvider === 'runninghub') &&
          isModelApiModel(value15, 'runninghub')) ||
        this._isRunninghubWorkflowModel(value15, value16)
      );
    }
    ['_isRunningHubNanoBananaModel'](value18 = this._data?.model) {
      const nanoBananaSelectionFromModel3 = resolveNanoBananaSelectionFromModel(value18, '2K', 'runninghub');
      return (
        nanoBananaSelectionFromModel3?.provider === 'runninghub' &&
        nanoBananaSelectionFromModel3.family === NANO_BANANA_FAMILIES.NANOBANANA
      );
    }
    ['_isRunningHubRecoverableRunningTask'](value19 = this._data) {
      if (!this._isRunninghubTaskModel(value19?.model, value19?.provider)) return false;
      const enabled10 = String(value19?.rhTaskId || '').trim();
      if (!enabled10) return false;
      const value20 = String(value19?.rhTaskStatus || '')
        .trim()
        .toLowerCase();
      if (
        value20 === 'complete' ||
        value20 === 'completed' ||
        value20 === 'done' ||
        value20 === 'error' ||
        value20 === 'finish' ||
        value20 === 'finished' ||
        value20 === 'success' ||
        value20 === 'succeeded' ||
        value20 === 'failed' ||
        value20 === 'fail' ||
        value20 === 'idle' ||
        value20 === 'cancelled' ||
        value20 === 'canceled'
      )
        return false;
      return true;
    }
    ['_isDreaminaRecoverableRunningTask'](value21 = this._data) {
      if (!this._isDreaminaImageNode(value21)) return false;
      const enabled11 = String(value21?.dreaminaSubmitId || '').trim();
      if (!enabled11) return false;
      const taskStatus = normalizeTaskStatus(value21?.jobStatus),
        taskStatus2 = normalizeTaskStatus(value21?.dreaminaTaskPhase),
        taskStatus3 = normalizeTaskStatus(value21?.dreaminaTaskStatus);
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(taskStatus)) return false;
      if (DREAMINA_NON_RECOVERABLE_PHASES.has(taskStatus2)) return false;
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(taskStatus3)) return false;
      return true;
    }
    ['_isStaleActiveDreaminaTask'](value22 = this._data) {
      if (!this._isGenerating) return false;
      if (value22?.dreaminaTaskRecovering === true) return false;
      if (this._dreaminaResumePromise) return false;
      const count = Number(
        value22?.dreaminaTaskLastCheckedAt ||
          value22?.dreaminaTaskStartedAt ||
          value22?.generationStartTime ||
          0,
      );
      if (!Number.isFinite(count) || count <= 0) return false;
      return Date.now() - count >= DREAMINA_STALE_ACTIVE_RESUME_MS;
    }
    ['_isAsyncRecoverableRunningTask'](value23 = this._data) {
      const enabled12 = String(value23?.asyncTaskId || '').trim();
      if (!enabled12) return false;
      const enabled13 = this._inferProviderFromModel(
        value23?.model,
        value23?.asyncTaskProvider || value23?.provider || '',
      );
      if (
        !enabled13 ||
        enabled13 === 'runninghubwf' ||
        enabled13 === 'runninghub' ||
        enabled13 === 'dreamina'
      )
        return false;
      const value24 = String(value23?.asyncTaskKind || '')
        .trim()
        .toLowerCase();
      if (value24 && value24 !== 'image') return false;
      const value25 = String(value23?.asyncTaskStatus || '')
        .trim()
        .toLowerCase();
      if (value25 === 'success' || value25 === 'failed' || value25 === 'idle' || value25 === 'cancelled')
        return false;
      return true;
    }
    ['_hasImageGenerationResult'](value26 = this._data) {
      const list5 = Array.isArray(value26?.images) ? value26.images : [],
        value27 = list5.some((enabled14) => {
          if (!enabled14 || typeof enabled14 !== 'object') return false;
          if (String(enabled14?.error || '').trim()) return false;
          return !!String(
            enabled14?.localPath || enabled14?.imageUrl || enabled14?.sourceUrl || enabled14?.thumbUrl || '',
          ).trim();
        });
      if (value27) return true;
      return !!String(
        value26?.localPath || value26?.imageUrl || value26?.sourceUrl || value26?.thumbUrl || '',
      ).trim();
    }
    ['_shouldFallbackRegenerateAsyncTask'](value28 = this._data) {
      // Workroom batches require a new explicit decision, never fallback paid resubmission.
      if (
        value28?.storyMediaBatch?.version === 1 ||
        store.getState?.()?.nodes?.[this.nodeId]?.storyMediaBatch?.version === 1
      )
        return false;
      const value29 = String(value28?.asyncTaskId || '').trim();
      if (value29) return false;
      const value30 = this._inferProviderFromModel(
        value28?.model,
        value28?.asyncTaskProvider || value28?.provider || '',
      );
      if (!['ppio', 'apimart'].includes(value30)) return false;
      const value31 = String(value28?.asyncTaskStatus || '')
          .trim()
          .toLowerCase(),
        enabled15 = [
          'submitted',
          'pending',
          'queued',
          'waiting',
          'running',
          'processing',
          'querying',
          'in_progress',
        ].includes(value31);
      if (!enabled15) return false;
      if (this._hasImageGenerationResult(value28)) return false;
      if (value28?.generationDuration != null) return false;
      return true;
    }
    async ['_maybeFallbackRegenerateAsyncTask'](value32 = this._data) {
      if (!this._shouldFallbackRegenerateAsyncTask(value32)) return false;
      if (this._asyncFallbackRegeneratePromise) return true;
      if (this._isGenerating) return true;
      const promise = (async () => {
        const value33 = store.getState().nodes?.[this.nodeId] || value32 || {},
          startedAt2 =
            Number(value33?.generationStartTime || 0) > 0 ? Number(value33.generationStartTime) : Date.now();
        (store.updateNodeData(
          this.nodeId,
          this._buildAsyncTaskPatch({
            provider: this._inferProviderFromModel(
              value33?.model,
              value33?.asyncTaskProvider || value33?.provider || '',
            ),
            kind: 'image',
            taskId: '',
            status: 'pending',
            startedAt: startedAt2,
            recovering: true,
          }),
        ),
          this._persistAsyncResumeCache(),
          await this._onGenerate());
      })();
      return (
        (this._asyncFallbackRegeneratePromise = promise.finally(() => {
          this._asyncFallbackRegeneratePromise = null;
        })),
        true
      );
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
    ['_buildDreaminaTaskPatch']({
      submitId: submitId = '',
      status: status = 'pending',
      phase: phase = 'generating',
      label: label = t('aigenImage.task.generating'),
      startedAt: startedAt = 0,
      lastCheckedAt: lastCheckedAt = Date.now(),
      recovering: recovering = false,
      raw: raw = {},
    } = {}) {
      return {
        dreaminaSubmitId: String(submitId || '').trim(),
        dreaminaTaskStatus: String(status || 'pending').trim() || 'pending',
        dreaminaTaskPhase: String(phase || 'generating').trim() || 'generating',
        dreaminaTaskLabel:
          String(label || t('aigenImage.task.generating')).trim() || t('aigenImage.task.generating'),
        dreaminaTaskStartedAt: Number(startedAt || 0),
        dreaminaTaskLastCheckedAt: Number(lastCheckedAt || Date.now()),
        dreaminaTaskRecovering: recovering === true,
        dreaminaTaskLastRaw: raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {},
      };
    }
    ['_buildDreaminaFailurePatch']({
      error: error = '',
      startedAt: startedAt = 0,
      submitId: submitId = '',
      lastCheckedAt: lastCheckedAt = Date.now(),
      raw: raw = {},
    } = {}) {
      const value34 = store.getState().nodes?.[this.nodeId] || this._data || {},
        error2 =
          String(error?.message || error || t('aigenImage.task.generationFailed')).trim() ||
          t('aigenImage.task.generationFailed'),
        submitId2 = String(submitId || '').trim() || String(value34?.dreaminaSubmitId || '').trim(),
        startedAt3 =
          Number(startedAt) > 0
            ? Number(startedAt)
            : Number(value34?.dreaminaTaskStartedAt || value34?.generationStartTime || Date.now());
      return {
        ...buildImageGenerationFailurePatch({ error: error2, startedAt: startedAt3 }),
        ...this._buildDreaminaTaskPatch({
          submitId: submitId2,
          status: 'failed',
          phase: 'failed',
          label: error2,
          startedAt: startedAt3,
          lastCheckedAt: Number(lastCheckedAt || Date.now()),
          recovering: false,
          raw: raw,
        }),
      };
    }
    ['_finalizeDreaminaImageFailure'](options2 = {}) {
      const value35 = this._buildDreaminaFailurePatch(options2);
      return (
        store.updateNodeData(this.nodeId, value35),
        this._persistDreaminaResumeCache(),
        (this._isGenerating = false),
        (this._dreaminaActiveSubmitId = ''),
        this.btnEl && resetGenerateButtonIdleUi(this.btnEl),
        stopLoading(this.previewEl),
        this._updateSubmitButtonState?.(),
        value35
      );
    }
    ['_buildAsyncTaskPatch']({
      provider: provider = '',
      kind: kind = 'image',
      taskId: taskId = '',
      status: status = 'pending',
      startedAt: startedAt = 0,
      recovering: recovering = false,
    } = {}) {
      const asyncTaskStatus = String(status || 'pending').trim() || 'pending',
        asyncTaskId = String(taskId || '').trim();
      let asyncTaskProvider = String(provider || '')
        .trim()
        .toLowerCase();
      return (
        !asyncTaskProvider &&
          (asyncTaskId || asyncTaskStatus !== 'idle') &&
          (asyncTaskProvider = this._inferProviderFromModel(this._data?.model || '', '')),
        {
          asyncTaskProvider: asyncTaskProvider,
          asyncTaskKind: String(kind || 'image').trim() || 'image',
          asyncTaskId: asyncTaskId,
          asyncTaskStatus: asyncTaskStatus,
          asyncTaskStartedAt: Number(startedAt || 0),
          asyncTaskRecovering: recovering === true,
        }
      );
    }
    ['_syncLocalTaskNodeData']() {
      const value36 = store.getState().nodes?.[this.nodeId];
      if (value36) this._data = value36;
      return this._data || {};
    }
    ['_applyDreaminaTaskPatch'](options3 = {}, args3 = {}) {
      const value37 = store.getState().nodes?.[this.nodeId] || this._data || {},
        value38 = {
          generationStartTime:
            Number(value37?.generationStartTime) > 0
              ? Number(value37.generationStartTime)
              : Number(options3?.startedAt || Date.now()),
          generationDuration: null,
          ...this._buildDreaminaTaskPatch(options3),
          ...args3,
        };
      return (
        store.updateNodeData(this.nodeId, value38),
        this._syncLocalTaskNodeData(),
        this._persistDreaminaResumeCache(),
        value38
      );
    }
    ['_stopRunningHubRecovery'](value39 = false) {
      this._rhResumeAbortController &&
        !this._rhResumeAbortController.signal.aborted &&
        this._rhResumeAbortController.abort();
      ((this._rhResumeAbortController = null), (this._rhResumeTaskId = ''), (this._rhResumePromise = null));
      if (value39) {
        const value40 = store.getState().nodes?.[this.nodeId];
        value40?.rhTaskRecovering &&
          (store.updateNodeData(this.nodeId, { rhTaskRecovering: false }),
          this._persistRunningHubResumeCache());
      }
    }
    ['_stopDreaminaRecovery'](value41 = false) {
      this._dreaminaResumeAbortController &&
        !this._dreaminaResumeAbortController.signal.aborted &&
        this._dreaminaResumeAbortController.abort();
      ((this._dreaminaResumeAbortController = null),
        (this._dreaminaResumeSubmitId = ''),
        (this._dreaminaResumePromise = null));
      if (value41) {
        const value42 = store.getState().nodes?.[this.nodeId];
        value42?.dreaminaTaskRecovering &&
          (store.updateNodeData(this.nodeId, { dreaminaTaskRecovering: false }),
          this._persistDreaminaResumeCache());
      }
    }
    ['_stopAsyncRecovery'](value43 = false) {
      this._asyncResumeAbortController &&
        !this._asyncResumeAbortController.signal.aborted &&
        this._asyncResumeAbortController.abort();
      ((this._asyncResumeAbortController = null),
        (this._asyncResumeTaskId = ''),
        (this._asyncResumePromise = null));
      if (value43) {
        const value44 = store.getState().nodes?.[this.nodeId];
        value44?.asyncTaskRecovering &&
          (store.updateNodeData(this.nodeId, { asyncTaskRecovering: false }),
          this._persistAsyncResumeCache());
      }
    }
    ['_applyImageGenerationResult'](value45, startedAt4, { writeStore: writeStore = true } = {}) {
      const normalizedResult = normalizeImageGenerationResult(value45),
        patch = buildImageGenerationResultPatch(normalizedResult, { startedAt: startedAt4 });
      if (!patch) return null;
      return (
        writeStore && store.updateNodeData(this.nodeId, patch),
        this._dispatchGenerationHistoryAssets(
          getSuccessfulImageGenerationItems(normalizedResult),
          startedAt4,
        ),
        {
          patch: patch,
          normalizedResult: normalizedResult,
          items: getSuccessfulImageGenerationItems(normalizedResult),
        }
      );
    }
    ['_dispatchGenerationHistoryAssets'](list6, startedAt5) {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
      const images = Array.isArray(list6)
        ? list6.filter((enabled16) => enabled16 && typeof enabled16 === 'object' && !enabled16.error)
        : [];
      if (images.length === 0) return;
      const nodeData = store.getState().nodes?.[this.nodeId] || this._data || {};
      try {
        window.dispatchEvent(
          new CustomEvent(GENERATION_HISTORY_EVENT, {
            detail: {
              kind: 'image',
              sourceNodeId: this.nodeId,
              nodeData: nodeData,
              images: images,
              startedAt: startedAt5,
              createdAt: Date.now(),
            },
          }),
        );
      } catch {}
    }
    ['_getImageGenerationResultError'](value46) {
      return getImageGenerationResultError(value46);
    }
    async ['_buildResumePayload'](value47 = this._data, value48 = {}) {
      const value49 = value47 || {};
      let model6 = String(
        normalizeDreaminaImageModel(value49?.model, value49?.provider) || value49?.model || '',
      ).trim();
      const value50 =
          value49.generationParams &&
          typeof value49.generationParams === 'object' &&
          !Array.isArray(value49.generationParams)
            ? value49.generationParams
            : {},
        modelManifest = getModelManifest(model6);
      if (!modelManifest) throw new Error('Missing model manifest: ' + model6);
      const generationParams2 = sanitizeTaskGenerationParams(model6, value50),
        enabled17 = modelManifest.adapterType === 'modelApi',
        manifestFields3 = Array.isArray(modelManifest?.uiSchema?.fields) ? modelManifest.uiSchema.fields : [],
        {
          getManifestField: getManifestField2,
          readSchemaParam: readSchemaParam3,
          requireSchemaParam: requireSchemaParam2,
        } = createSchemaParamAccess({
          model: model6,
          data: this._data,
          generationParams: generationParams2,
          manifestFields: manifestFields3,
        }),
        imageSize3 = getManifestField2('imageSize') ? requireSchemaParam2('imageSize') : undefined,
        mode = enabled17 ? readSchemaParam3('mode') : undefined,
        family = resolveNanoBananaSelectionFromModel(model6, imageSize3 || '2K', value49?.provider);
      if (family) {
        if (!enabled17 && mode !== undefined)
          model6 = resolveNanoBananaModelBySelection({
            family: family.family,
            mode: mode,
            imageSize: imageSize3 || '2K',
            provider: family.provider || value49?.provider,
          });
        else !enabled17 && (model6 = family.model);
      }
      const value51 = String(value48?.providerHint || value49?.provider || '')
        .trim()
        .toLowerCase();
      isDreaminaImageModel(model6, value51) &&
        (model6 = normalizeDreaminaImageModel(model6, value51) || model6 || getDefaultDreaminaImageModelId());
      const provider6 = this._inferProviderFromModel(model6, value51),
        imageSize4 = resolveImageSizeForProviderModel({
          provider: provider6,
          model: model6,
          imageSize: imageSize3,
        });
      !getModelManifest(model6) &&
        (model6 = resolveGrsaiGptImage2ModelForSize({
          provider: provider6,
          model: model6,
          imageSize: imageSize4,
        }));
      await ensureConfig();
      const value52 = getProviderConfig(provider6) || {};
      let apiKey = '';
      if (provider6 === 'runninghub')
        apiKey = isModelApiModel(model6, provider6) ? value52.modelApiKey || '' : value52.apiKey || '';
      else
        provider6 === 'runninghubwf'
          ? (apiKey = value52.apiKey || '')
          : (apiKey = value52.apiKey || window._appApiKey || '');
      return { nodeId: this.nodeId, model: model6, provider: provider6, apiKey: apiKey };
    }
    async ['_maybeResumeRunningHubTaskImpl']() {
      const value53 = store.getState().nodes?.[this.nodeId] || this._data || {};
      if (this._isGenerating && value53?.rhTaskRecovering !== true) return;
      if (!this._isRunninghubTaskModel(value53?.model, value53?.provider)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (!this._isRunningHubRecoverableRunningTask(value53)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      const taskId2 = String(value53?.rhTaskId || '').trim();
      if (!taskId2) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (this._rhResumeTaskId === taskId2 && this._rhResumePromise) return;
      this._stopRunningHubRecovery(false);
      const startedAt6 = Number(value53?.rhTaskStartedAt || value53?.generationStartTime || Date.now()),
        rhTaskUseOpenapiQuery =
          value53?.rhTaskUseOpenapiQuery === true ||
          isModelApiModel(value53?.model, value53?.provider || 'runninghub');
      this._rhResumeTaskId = taskId2;
      const value54 = (async () => {
        let signal = null;
        const cancellable = this._isRunninghubWorkflowModel(value53?.model, value53?.provider),
          busy = shouldUseImageWorkflowBusyButton(value53?.model);
        try {
          const provider7 = await this._buildResumePayload(value53);
          if (!provider7) return;
          ((signal = new AbortController()),
            (this._rhResumeAbortController = signal),
            (this._rhTaskId = taskId2),
            (this._rhApiKey = String(provider7?.apiKey || '').trim() || this._rhApiKey || null),
            (this._rhCancelRequested = false),
            (this._isGenerating = true));
          this.btnEl &&
            (cancellable
              ? setGenerateButtonCancellableUi(this.btnEl, { busy: busy })
              : setGenerateButtonLoadingUi(this.btnEl));
          startLoading(this.previewEl);
          const response6 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'image-generation',
              provider: provider7.provider || value53?.provider || 'runninghubwf',
              adapterType: 'workflow',
              modelId: provider7.model || value53?.model || '',
              executionId: 'runninghub.image.' + (provider7.model || value53?.model || 'workflow'),
              payload: provider7,
              taskId: taskId2,
              cancellable: cancellable,
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
                api.resumeRunningHubImageTask(taskId2, provider7, {
                  signal: signal.signal,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              resultBuilder: async (value55, startedAt7) => {
                const value56 = this._getImageGenerationResultError(value55);
                if (value56) throw new Error(value56);
                const value57 = this._applyImageGenerationResult(value55, startedAt7.startedAt, {
                  writeStore: false,
                });
                return {
                  ...(value57?.patch || {}),
                  ...this._buildRunningHubTaskPatch({
                    taskId: taskId2,
                    status: 'success',
                    startedAt: startedAt7.startedAt,
                    recovering: false,
                    useOpenapiQuery: rhTaskUseOpenapiQuery,
                  }),
                };
              },
              failureBuilder: (error3, startedAt8) => ({
                ...buildImageGenerationFailurePatch({
                  error: error3?.message || t('aigenImage.task.generationFailed'),
                  startedAt: startedAt8.startedAt,
                }),
                rhStatusMessage: error3?.message || t('aigenImage.task.generationFailed'),
                rhStatusCode: Number.isFinite(Number(error3?.code)) ? Number(error3.code) : null,
                ...this._buildRunningHubTaskPatch({
                  taskId: taskId2,
                  status: 'failed',
                  startedAt: startedAt8.startedAt,
                  recovering: false,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                }),
              }),
              cancelledBuilder: (value58) => {
                const latest2 = store.getState().nodes?.[this.nodeId] || {},
                  duration2 =
                    latest2.generationDuration == null
                      ? Date.now() - value58.startedAt
                      : latest2.generationDuration;
                return this._buildRunningHubCancelResultPatch({
                  latest: latest2,
                  message: latest2.rhStatusMessage || t('aigenImage.task.interrupted'),
                  code: latest2.rhStatusCode,
                  duration: duration2,
                  taskId: taskId2,
                });
              },
              parseError: (error4) => error4?.message || t('aigenImage.task.generationFailed'),
            },
            { store: store, startedAt: startedAt6, abortController: signal },
          );
          if (response6.status === 'pending') {
            this._persistRunningHubResumeCache();
            return;
          }
          this._persistRunningHubResumeCache();
        } catch (rhStatusMessage) {
          if (
            signal?.signal?.aborted ||
            rhStatusMessage?.message === 'CANCELLED' ||
            rhStatusMessage?.name === 'AbortError'
          )
            return;
          (store.updateNodeData(this.nodeId, {
            generationDuration: Math.max(0, Date.now() - startedAt6),
            rhStatusMessage: rhStatusMessage?.message || t('aigenImage.task.generationFailed'),
            rhStatusCode: Number.isFinite(Number(rhStatusMessage?.code))
              ? Number(rhStatusMessage.code)
              : null,
            ...this._buildRunningHubTaskPatch({
              taskId: taskId2,
              status: 'failed',
              startedAt: startedAt6,
              recovering: false,
              useOpenapiQuery: rhTaskUseOpenapiQuery,
            }),
          }),
            this._persistRunningHubResumeCache());
        } finally {
          signal && this._rhResumeAbortController === signal && (this._rhResumeAbortController = null);
          this._rhResumeTaskId === taskId2 && (this._rhResumeTaskId = '');
          this._rhResumePromise = null;
          const value59 = this._syncLocalTaskNodeData(),
            shouldShowGenerationBusyUi2 = shouldShowGenerationBusyUi(value59);
          this._isGenerating = shouldShowGenerationBusyUi2;
          if (shouldShowGenerationBusyUi2) this._rhTaskId = String(value59?.rhTaskId || taskId2 || '').trim();
          else {
            this._rhTaskId = null;
            if (!this._rhCancelRequested) this._rhApiKey = null;
            (this.btnEl && resetGenerateButtonIdleUi(this.btnEl), stopLoading(this.previewEl));
          }
          this._updateSubmitButtonState();
        }
      })();
      this._rhResumePromise = value54;
    }
    async ['_maybeResumeDreaminaTaskImpl']() {
      const raw2 = store.getState().nodes?.[this.nodeId] || this._data || {},
        taskId3 = String(raw2?.dreaminaSubmitId || '').trim(),
        value60 = String(this._dreaminaActiveSubmitId || '').trim();
      if (
        this._isGenerating &&
        raw2?.dreaminaTaskRecovering !== true &&
        value60 &&
        value60 === taskId3 &&
        !this._isStaleActiveDreaminaTask(raw2)
      )
        return;
      if (!this._isDreaminaImageNode(raw2)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (!this._isDreaminaRecoverableRunningTask(raw2)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (!taskId3) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (this._dreaminaResumeSubmitId === taskId3) return;
      this._stopDreaminaRecovery(false);
      const startedAt9 = Number(raw2?.dreaminaTaskStartedAt || raw2?.generationStartTime || Date.now());
      this._dreaminaResumeSubmitId = taskId3;
      const value61 = (async () => {
        let signal2 = null;
        try {
          const modelId = await this._buildResumePayload(raw2);
          if (!modelId) return;
          ((signal2 = new AbortController()),
            (this._dreaminaResumeAbortController = signal2),
            (this._isGenerating = true));
          this.btnEl && setGenerateButtonLoadingUi(this.btnEl);
          startLoading(this.previewEl);
          const response7 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'image-generation',
              provider: 'dreamina',
              adapterType: 'localRuntime',
              modelId: modelId.model || raw2?.model || '',
              executionId: 'dreamina.image.' + (modelId.model || raw2?.model || 'cli'),
              payload: modelId,
              taskId: taskId3,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this._buildDreaminaTaskPatch({
                  submitId: taskId3,
                  status: 'pending',
                  phase: 'generating',
                  label: String(raw2?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: startedAt9,
                  lastCheckedAt: Date.now(),
                  recovering: true,
                  raw: raw2?.dreaminaTaskLastRaw || {},
                }),
              onTaskStart: () => {
                this._persistDreaminaResumeCache();
              },
              pauseBuilder: (startedAt10) =>
                this._buildDreaminaTaskPatch({
                  submitId: taskId3,
                  status: String(raw2?.dreaminaTaskStatus || '').trim() || 'pending',
                  phase: String(raw2?.dreaminaTaskPhase || '').trim() || 'generating',
                  label: String(raw2?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: startedAt10.startedAt,
                  lastCheckedAt: Date.now(),
                  recovering: false,
                  raw: raw2?.dreaminaTaskLastRaw || {},
                }),
              poll: async () => api.resumeDreaminaImageTask(taskId3, modelId, { signal: signal2.signal }),
              resultBuilder: async (value62, startedAt11) => {
                const value63 = this._getImageGenerationResultError(value62);
                if (value63) throw new Error(value63);
                const value64 = this._applyImageGenerationResult(value62, startedAt11.startedAt, {
                  writeStore: false,
                });
                return {
                  ...(value64?.patch || {}),
                  ...this._buildDreaminaTaskPatch({
                    submitId: taskId3,
                    status: 'success',
                    phase: 'done',
                    label: t('aigenImage.task.completed'),
                    startedAt: startedAt11.startedAt,
                    lastCheckedAt: Date.now(),
                    recovering: false,
                    raw: {},
                  }),
                };
              },
              failureBuilder: (error5, startedAt12) =>
                this._buildDreaminaFailurePatch({
                  error: error5,
                  startedAt: startedAt12.startedAt,
                  submitId: taskId3,
                  lastCheckedAt: Date.now(),
                  raw: {},
                }),
              cancelledBuilder: (startedAt13) => ({
                generationDuration: Date.now() - startedAt13.startedAt,
                ...this._buildDreaminaTaskPatch({
                  submitId: taskId3,
                  status: 'pending',
                  phase: 'generating',
                  label: String(raw2?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: startedAt13.startedAt,
                  lastCheckedAt: Date.now(),
                  recovering: false,
                  raw: raw2?.dreaminaTaskLastRaw || {},
                }),
              }),
              parseError: (error6) => error6?.message || t('aigenImage.task.generationFailed'),
            },
            { store: store, startedAt: startedAt9, abortController: signal2 },
          );
          if (response7.status === 'pending') {
            this._persistDreaminaResumeCache();
            return;
          }
          (response7.status === 'failed' && (this._dreaminaActiveSubmitId = ''),
            this._persistDreaminaResumeCache());
        } catch (error7) {
          if (signal2?.signal?.aborted || error7?.message === 'CANCELLED' || error7?.name === 'AbortError')
            return;
          this._finalizeDreaminaImageFailure({
            error: error7,
            startedAt: startedAt9,
            submitId: taskId3,
            lastCheckedAt: Date.now(),
            raw: {},
          });
        } finally {
          signal2 &&
            this._dreaminaResumeAbortController === signal2 &&
            (this._dreaminaResumeAbortController = null);
          this._dreaminaResumeSubmitId === taskId3 && (this._dreaminaResumeSubmitId = '');
          this._dreaminaResumePromise = null;
          const value65 = this._syncLocalTaskNodeData(),
            shouldShowGenerationBusyUi3 = shouldShowGenerationBusyUi(value65);
          ((this._isGenerating = shouldShowGenerationBusyUi3),
            !shouldShowGenerationBusyUi3 &&
              (this.btnEl && resetGenerateButtonIdleUi(this.btnEl), stopLoading(this.previewEl)),
            this._updateSubmitButtonState());
        }
      })();
      this._dreaminaResumePromise = value61;
    }
    async ['_maybeResumeAsyncTaskImpl']() {
      const value66 = store.getState().nodes?.[this.nodeId] || this._data || {};
      if (this._isGenerating && value66?.asyncTaskRecovering !== true) return;
      if (!this._isAsyncRecoverableRunningTask(value66)) {
        const value67 = await this._maybeFallbackRegenerateAsyncTask(value66);
        if (value67) return;
        this._stopAsyncRecovery(false);
        return;
      }
      const taskId4 = String(value66?.asyncTaskId || '').trim();
      if (!taskId4) {
        const value68 = await this._maybeFallbackRegenerateAsyncTask(value66);
        if (value68) return;
        this._stopAsyncRecovery(false);
        return;
      }
      if (this._asyncResumeTaskId === taskId4 && this._asyncResumePromise) return;
      this._stopAsyncRecovery(false);
      const startedAt14 = Number(value66?.asyncTaskStartedAt || value66?.generationStartTime || Date.now()),
        providerHint2 = this._inferProviderFromModel(
          value66?.model,
          value66?.asyncTaskProvider || value66?.provider || '',
        );
      this._asyncResumeTaskId = taskId4;
      const value69 = (async () => {
        let signal3 = null;
        try {
          const modelId2 = await this._buildResumePayload(value66, { providerHint: providerHint2 });
          if (!modelId2) return;
          ((signal3 = new AbortController()),
            (this._asyncResumeAbortController = signal3),
            (this._isGenerating = true));
          this.btnEl && setGenerateButtonLoadingUi(this.btnEl);
          startLoading(this.previewEl);
          const response8 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'image-generation',
              provider: providerHint2 || modelId2.provider || value66?.provider || '',
              adapterType: 'modelApi',
              modelId: modelId2.model || value66?.model || '',
              executionId: (providerHint2 || modelId2.provider || 'model') + '.image.async',
              payload: modelId2,
              taskId: taskId4,
              async: true,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this._buildAsyncTaskPatch({
                  provider: providerHint2,
                  kind: 'image',
                  taskId: taskId4,
                  status: 'running',
                  startedAt: startedAt14,
                  recovering: true,
                }),
              onTaskStart: () => {
                this._persistAsyncResumeCache();
              },
              poll: async () => api.resumeAsyncImageTask(taskId4, modelId2, { signal: signal3.signal }),
              resultBuilder: async (value70, startedAt15) => {
                const value71 = this._getImageGenerationResultError(value70);
                if (value71) throw new Error(value71);
                const value72 = this._applyImageGenerationResult(value70, startedAt15.startedAt, {
                  writeStore: false,
                });
                return {
                  ...(value72?.patch || {}),
                  ...this._buildAsyncTaskPatch({
                    provider: providerHint2,
                    kind: 'image',
                    taskId: taskId4,
                    status: 'success',
                    startedAt: startedAt15.startedAt,
                    recovering: false,
                  }),
                };
              },
              failureBuilder: (error8, startedAt16) => ({
                ...buildImageGenerationFailurePatch({
                  error: error8?.message || t('aigenImage.task.generationFailed'),
                  startedAt: startedAt16.startedAt,
                }),
                ...this._buildAsyncTaskPatch({
                  provider: providerHint2,
                  kind: 'image',
                  taskId: taskId4,
                  status: 'failed',
                  startedAt: startedAt16.startedAt,
                  recovering: false,
                }),
              }),
              cancelledBuilder: (startedAt17) => ({
                images: [],
                imageUrl: '',
                src: '',
                localPath: '',
                generationDuration: Date.now() - startedAt17.startedAt,
                ...this._buildAsyncTaskPatch({
                  provider: providerHint2,
                  kind: 'image',
                  taskId: taskId4,
                  status: 'cancelled',
                  startedAt: startedAt17.startedAt,
                  recovering: false,
                }),
              }),
              parseError: (error9) => error9?.message || t('aigenImage.task.generationFailed'),
            },
            { store: store, startedAt: startedAt14, abortController: signal3 },
          );
          if (response8.status === 'pending') {
            this._persistAsyncResumeCache();
            return;
          }
          this._persistAsyncResumeCache();
        } catch (error10) {
          if (signal3?.signal?.aborted || error10?.message === 'CANCELLED' || error10?.name === 'AbortError')
            return;
          (store.updateNodeData(this.nodeId, {
            generationDuration: Math.max(0, Date.now() - startedAt14),
            ...this._buildAsyncTaskPatch({
              provider: providerHint2,
              kind: 'image',
              taskId: taskId4,
              status: 'failed',
              startedAt: startedAt14,
              recovering: false,
            }),
          }),
            this._persistAsyncResumeCache());
        } finally {
          signal3 &&
            this._asyncResumeAbortController === signal3 &&
            (this._asyncResumeAbortController = null);
          this._asyncResumeTaskId === taskId4 && (this._asyncResumeTaskId = '');
          this._asyncResumePromise = null;
          const value73 = this._syncLocalTaskNodeData(),
            shouldShowGenerationBusyUi4 = shouldShowGenerationBusyUi(value73);
          ((this._isGenerating = shouldShowGenerationBusyUi4),
            !shouldShowGenerationBusyUi4 &&
              (this.btnEl && resetGenerateButtonIdleUi(this.btnEl), stopLoading(this.previewEl)),
            this._updateSubmitButtonState());
        }
      })();
      this._asyncResumePromise = value69;
    }
    async ['_buildPayload'](value74 = null) {
      const value75 = store.getState(),
        list7 = store.getIncomingEdges(this.nodeId),
        nodeData2 = value75.nodes || {},
        targetInputPolicy = getTargetInputPolicy(nodeData2?.[this.nodeId] || this._data || {}),
        fixedInputConfig2 = getFixedInputSlotConfigFromManifest(nodeData2?.[this.nodeId] || this._data || {}),
        imageNodeInputGate = getImageNodeInputGate(this._data?.model),
        value76 = String(imageNodeInputGate.kind || '').trim(),
        value77 = Number(imageNodeInputGate.max),
        isRhPersonReplaceWorkflowModel2 = isRhPersonReplaceWorkflowModel(this._data?.model),
        rhQwenEditMode = isRhQwenImageEditModel(this._data?.model),
        modelManifest2 = getModelManifest(this._data?.model)?.inputSlots,
        value78 = Math.max(0, Number(modelManifest2?.maxByKind?.image) || 0),
        value79 = value78 || 3,
        imageInputGateUploadedUrl = getImageInputGateUploadedUrl(this._data, imageNodeInputGate),
        imageRefs2 = { text: [], image: [], video: [], audio: [] },
        value80 = { text: 0, image: 0, video: 0, audio: 0 },
        map3 = new Map();
      for (const sourceId of list7) {
        const response9 = nodeData2[sourceId.sourceId];
        if (!response9) continue;
        const effectiveInputKind2 = resolveEffectiveInputKind(response9, sourceId);
        if (!effectiveInputKind2) continue;
        if (!isInputKindAllowed(targetInputPolicy, effectiveInputKind2)) continue;
        if (value76 && effectiveInputKind2 !== value76) continue;
        if (value76 && Number.isFinite(value77) && value80[value76] >= value77) continue;
        if (isRhPersonReplaceWorkflowModel2 && effectiveInputKind2 !== 'image') continue;
        if (isRhPersonReplaceWorkflowModel2 && value80.image >= 2) continue;
        if (rhQwenEditMode && effectiveInputKind2 !== 'image') continue;
        if (rhQwenEditMode && value80.image >= value79) continue;
        let content = '',
          url = '';
        if (effectiveInputKind2 === 'text') {
          content = (
            response9.outputText ||
            response9.text ||
            response9.content ||
            response9.prompt ||
            response9.label ||
            ''
          ).trim();
          if (!content) continue;
        } else {
          effectiveInputKind2 === 'image' && (url = resolveGenerationInputImageUrl(response9));
          if (!url && response9.sourceId) {
            const value81 = await getImage(response9.sourceId);
            if (value81) url = URL.createObjectURL(value81);
          }
          if (!url) url = response9.src || response9.imageUrl || response9.thumbUrl || '';
          if (!url) continue;
        }
        value80[effectiveInputKind2]++;
        const labels = buildReferenceLabelAliases(effectiveInputKind2, value80[effectiveInputKind2]),
          label2 = labels[0],
          value82 = effectiveInputKind2 === 'image' ? String(response9.mask || '') : '',
          value83 = value82.trim(),
          maskUrl =
            effectiveInputKind2 === 'image' && value83
              ? value83.startsWith('/')
                ? value83
                : '/' + value83.replace(/^\//, '')
              : '';
        if (effectiveInputKind2 === 'image' && maskUrl) map3.set(url, maskUrl);
        imageRefs2[effectiveInputKind2].push({
          label: label2,
          labels: labels,
          content: content,
          url: url,
          maskUrl: maskUrl,
          used: false,
          sourceId: sourceId.sourceId,
          refSlot: sourceId.refSlot || '',
        });
      }
      const list8 = [...imageRefs2.text, ...imageRefs2.image, ...imageRefs2.video, ...imageRefs2.audio],
        value84 = {};
      list8.forEach((item9) => {
        (item9.labels || [item9.label]).forEach((item10) => {
          value84[item10.replace(/\s+/g, '')] = item9;
        });
      });
      const value85 = {};
      list8.forEach((item11) => {
        if (item11.sourceId) value85[item11.sourceId] = item11;
      });
      let hasInputImages2 = [];
      const inputRefs = [],
        mediaCounts = { image: 0, video: 0, audio: 0 },
        value86 = nodeData2?.[this.nodeId] || this._data || {},
        list9 = getPromptAssetInputRefsFromNode(value86, { allowedTypes: ['image'] }),
        hasImageInput = () =>
          (imageRefs2.image || []).some((response10) => !!response10.url) ||
          hasInputImages2.some(Boolean) ||
          inputRefs.some((response11) => response11.type === 'image' && response11.url) ||
          list9.some((response12) => {
            const effectiveInputKind3 = resolveEffectiveInputKind(response12) || response12.type;
            return effectiveInputKind3 === 'image' && !!response12.url;
          }),
        handler4 = (value87) => {
          let value88 = '';
          const run = (value89) => {
            for (const domNode of value89.childNodes) {
              if (domNode.nodeType === Node.TEXT_NODE) value88 += domNode.textContent;
              else {
                if (domNode.nodeType === Node.ELEMENT_NODE) {
                  if (domNode.classList.contains('ref-pill')) {
                    const value90 = domNode.dataset.nodeId || '',
                      rawLabel = domNode.dataset.label || domNode.textContent.trim(),
                      promptParts = [];
                    if (
                      appendAssetMentionToPrompt({
                        domNode: domNode,
                        rawLabel: rawLabel,
                        promptParts: promptParts,
                        inputRefs: inputRefs,
                        mediaCounts: mediaCounts,
                        allowedTypes: ['text', 'image'],
                      })
                    ) {
                      ((value88 += promptParts.join('')),
                        inputRefs.forEach((response13) => {
                          response13.type === 'image' &&
                            response13.url &&
                            !hasInputImages2.includes(response13.url) &&
                            hasInputImages2.push(response13.url);
                        }));
                      continue;
                    }
                    const value91 = rawLabel.replace(/\s+/g, ''),
                      response14 = (value90 && value85[value90]) || value84[value91];
                    if (response14) {
                      response14.used = true;
                      if (response14.content) value88 += ' ' + response14.content + ' ';
                      else {
                        if (response14.url) {
                          value88 += ' ' + rawLabel + ' ';
                          if (!isRhPersonReplaceWorkflowModel2 && !hasInputImages2.includes(response14.url))
                            hasInputImages2.push(response14.url);
                        }
                      }
                    } else value88 += ' ' + rawLabel + ' ';
                  } else domNode.tagName === 'BR' ? (value88 += '\n') : run(domNode);
                }
              }
            }
          };
          run(value87);
          let promptPresetTemplate = value88.replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, ' ').trim();
          if (value74) {
            let value92 = promptPresetTemplate;
            if (requiresPromptPresetInput(value74)) {
              const list10 = [];
              (imageRefs2.text.forEach((enabled18) => {
                const list11 = (enabled18.labels || [enabled18.label]).map(
                  (item12) =>
                    new RegExp(
                      item12.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\u00A0]*'),
                      'g',
                    ),
                );
                !enabled18.used &&
                  enabled18.content &&
                  !list11.some((item13) => item13.test(promptPresetTemplate)) &&
                  (list10.push(enabled18.content), (enabled18.used = true));
              }),
                (value92 = [...list10, promptPresetTemplate].filter(Boolean).join('\n').trim()));
            }
            promptPresetTemplate = resolvePromptPresetTemplate(value74, value92, {
              hasImageInput: hasImageInput,
            });
          } else promptPresetTemplate = promptPresetTemplate || '';
          return promptPresetTemplate;
        };
      let prompt = handler4(this.promptEl);
      const list12 = list8
        .flatMap((ref) => (ref.labels || [ref.label]).map((label3) => ({ ref: ref, label: label3 })))
        .sort((item14, value93) => value93.label.length - item14.label.length);
      list12.forEach(({ ref: ref2, label: label4 }) => {
        if (!ref2.used) {
          const regExp = new RegExp(
            label4.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\u00A0]*'),
            'g',
          );
          if (regExp.test(prompt)) {
            ref2.used = true;
            if (ref2.content) prompt = prompt.replace(regExp, ' ' + ref2.content + ' ');
            else {
              if (ref2.url) {
                prompt = prompt.replace(regExp, ' ' + label4.trim() + ' ');
                if (!isRhPersonReplaceWorkflowModel2 && !hasInputImages2.includes(ref2.url))
                  hasInputImages2.push(ref2.url);
              }
            }
          }
        }
      });
      let value94 = '';
      imageRefs2.text.forEach((enabled19) => {
        !enabled19.used &&
          enabled19.content &&
          ((value94 += enabled19.content + '\n'), (enabled19.used = true));
      });
      value94 && (prompt = value94 + prompt);
      !isRhPersonReplaceWorkflowModel2 &&
        list8.forEach((response15) => {
          !response15.used &&
            response15.url &&
            !hasInputImages2.includes(response15.url) &&
            hasInputImages2.push(response15.url);
        });
      requiresPromptPresetInput(value74) &&
        list9.forEach((response16) => {
          const effectiveInputKind4 = resolveEffectiveInputKind(response16) || response16.type;
          effectiveInputKind4 === 'image' &&
            response16.url &&
            !hasInputImages2.includes(response16.url) &&
            hasInputImages2.push(response16.url);
        });
      hasInputImages2 = reorderImageInputUrlsByRefOrder(hasInputImages2, imageRefs2.image);
      if (value76 === 'image') {
        if (imageInputGateUploadedUrl) hasInputImages2 = [imageInputGateUploadedUrl];
        else Number.isFinite(value77) && (hasInputImages2 = hasInputImages2.slice(0, value77));
      }
      if (isRhPersonReplaceWorkflowModel2) {
        const value95 = ['replaceTarget', 'replacedImage'],
          list13 = imageRefs2.image || [],
          handler5 = (value96) =>
            String(list13.find((item15) => String(item15.refSlot || '') === value96)?.url || ''),
          value97 = String(list13[0]?.url || ''),
          value98 = String(list13.find((response17) => String(response17.url || '') !== value97)?.url || ''),
          value99 = handler5(value95[0]) || value97,
          value100 = handler5(value95[1]) || value98;
        hasInputImages2 = [value99, value100].filter(Boolean);
      }
      rhQwenEditMode && (hasInputImages2 = hasInputImages2.filter(Boolean).slice(0, value79));
      const inputUrlsBySlot = isRhPersonReplaceWorkflowModel2
          ? {}
          : buildInputUrlsByFixedImageSlot({
              fixedInputConfig: fixedInputConfig2,
              imageRefs: imageRefs2.image,
              assetInputRefs: inputRefs,
            }),
        value101 =
          this._data.generationParams &&
          typeof this._data.generationParams === 'object' &&
          !Array.isArray(this._data.generationParams)
            ? this._data.generationParams
            : {},
        model7 = normalizeDreaminaImageModel(this._data.model, this._data.provider) || this._data.model,
        modelManifest3 = getModelManifest(model7);
      if (!modelManifest3) throw new Error('Missing model manifest: ' + this._data.model);
      const generationParams3 = sanitizeTaskGenerationParams(model7, value101),
        isModelApiManifest2 = modelManifest3.adapterType === 'modelApi',
        manifestFields4 = Array.isArray(modelManifest3?.uiSchema?.fields)
          ? modelManifest3.uiSchema.fields
          : [],
        {
          getManifestField: getManifestField3,
          readSchemaParam: readSchemaParam4,
          requireSchemaParam: requireSchemaParam3,
        } = createSchemaParamAccess({
          model: model7,
          data: this._data,
          generationParams: generationParams3,
          manifestFields: manifestFields4,
        }),
        imageSize5 = getManifestField3('imageSize') ? requireSchemaParam3('imageSize') : undefined,
        value102 = getManifestField3('aspectRatio') ? requireSchemaParam3('aspectRatio') : '自适应',
        value103 = getManifestField3('batchSize') ? requireSchemaParam3('batchSize') : 1,
        google_image_search =
          isModelApiManifest2 && getManifestField3('google_image_search')
            ? normalizeTaskBooleanParam(readSchemaParam4('google_image_search'))
            : undefined,
        google_search =
          isModelApiManifest2 && getManifestField3('google_search')
            ? normalizeTaskBooleanParam(readSchemaParam4('google_search')) || google_image_search === true
            : undefined,
        args4 = buildModelApiSchemaPayloadParams({
          isModelApiManifest: isModelApiManifest2,
          manifestFields: manifestFields4,
          readSchemaParam: readSchemaParam4,
        });
      let model8 = model7 || 'nano-banana-2';
      const mode2 = isModelApiManifest2 ? readSchemaParam4('mode') : undefined,
        rhModelRoute = readSchemaParam4('rhModelRoute'),
        family2 = resolveNanoBananaSelectionFromModel(model8, imageSize5 || '2K', this._data.provider);
      if (family2) {
        if (!isModelApiManifest2 && mode2 !== undefined)
          model8 = resolveNanoBananaModelBySelection({
            family: family2.family,
            mode: mode2,
            imageSize: imageSize5 || '2K',
            provider: family2.provider || this._data.provider,
          });
        else !isModelApiManifest2 && (model8 = family2.model);
      }
      isDreaminaImageModel(model8, this._data.provider) &&
        (model8 =
          normalizeDreaminaImageModel(model8, this._data.provider) || getDefaultDreaminaImageModelId());
      const provider8 = this._inferProviderFromModel(model8, this._data.provider),
        imageSize6 = resolveImageSizeForProviderModel({
          provider: provider8,
          model: model8,
          imageSize: imageSize5,
        });
      !getModelManifest(model8) &&
        (model8 = resolveGrsaiGptImage2ModelForSize({
          provider: provider8,
          model: model8,
          imageSize: imageSize6,
        }));
      const isRunningHubWorkflowNode2 = isRunningHubWorkflowNode({
        ...this._data,
        model: model8,
        provider: provider8,
      });
      if (isRunningHubWorkflowNode2) {
        const value104 = nodeData2?.[this.nodeId] || this._data || {};
        getPromptAssetInputRefsFromNode(value104, { allowedTypes: ['image'] }).forEach((response18) => {
          if (resolveEffectiveInputKind(response18) !== 'image') return;
          if (response18.url && !hasInputImages2.includes(response18.url))
            hasInputImages2.push(response18.url);
        });
      }
      if (provider8 === 'dreamina') {
        const list14 = [],
          handler6 = (value105) => {
            const enabled20 = String(value105 || '').trim();
            if (!enabled20 || enabled20.startsWith('blob:')) return;
            if (!list14.includes(enabled20)) list14.push(enabled20);
          };
        ((imageRefs2.image || []).forEach((response19) => {
          const value106 = nodeData2?.[response19?.sourceId] || null,
            value107 = value106 ? resolveGenerationInputImageUrl(value106) : '';
          (handler6(value107), handler6(response19?.url));
        }),
          (hasInputImages2 = list14.slice(0, 1)));
      }
      const inputMaskUrls = hasInputImages2.map((item16) => String(map3.get(item16) || ''));
      if (value76 === 'image' && hasInputImages2.length === 0)
        return (
          window.showToast?.(
            getImageInputGateMissingMessage(imageNodeInputGate) ||
              t('aigenImage.task.referenceImageRequired'),
            'warn',
          ),
          null
        );
      if (isRhPersonReplaceWorkflowModel2 && hasInputImages2.length < 2)
        return (window.showToast?.(t('aigenImage.task.replacePairRequired'), 'warn'), null);
      if (rhQwenEditMode && hasInputImages2.length < 1)
        return (window.showToast?.(t('aigenImage.task.referenceImageRequired'), 'warn'), null);
      const promptPresetTemplateEmptyInputMessage = getPromptPresetTemplateEmptyInputMessage(value74);
      if (promptPresetTemplateEmptyInputMessage && !prompt && hasInputImages2.length === 0)
        return (window.showToast?.(promptPresetTemplateEmptyInputMessage, 'warn'), null);
      if (!isRunningHubWorkflowNode2 && !prompt && hasInputImages2.length === 0)
        return (
          console.warn('[AIGenerateNode] prompt 为空，跳过生成'),
          window.showToast?.(t('aigenImage.task.promptOrReferenceRequired'), 'warn'),
          null
        );
      await ensureConfig();
      const value108 = getProviderConfig(provider8);
      let apiKey2 = '';
      if (provider8 === 'runninghub')
        apiKey2 = isModelApiModel(model8, provider8) ? value108.modelApiKey || '' : value108.apiKey || '';
      else
        provider8 === 'runninghubwf'
          ? (apiKey2 = value108.apiKey || '')
          : (apiKey2 = value108.apiKey || window._appApiKey || '');
      let installId = String(window.__aicInstallId || '').trim();
      if (typeof window.ensureSubscriptionInstallId === 'function')
        try {
          installId = String(await window.ensureSubscriptionInstallId()).trim();
        } catch {}
      const value109 = String(value102 || '自适应').trim(),
        isAdaptiveRatioLabel2 = isAdaptiveRatioLabel(value109),
        value110 = list7.filter((item17) => {
          const list15 = String(item17?.refSlot || '').toLowerCase();
          if (list15.includes('mask')) return false;
          const value111 = nodeData2?.[item17?.sourceId];
          return resolveEffectiveInputKind(value111, item17) === 'image';
        }),
        edge = pickGenerationRatioSourceEdge(value110, nodeData2?.[this.nodeId] || this._data || {});
      let inputWidth = 0,
        inputHeight = 0;
      if (edge?.sourceId) {
        const nodeId = edge.sourceId,
          box = getGenerationRatioSizeWithDom({
            nodeId: nodeId,
            nodeData: nodeData2[nodeId],
            edge: edge,
            includeNodeFrame: true,
          });
        box && ((inputWidth = box.width), (inputHeight = box.height));
      }
      const box2 = nodeData2?.[this.nodeId] || {},
        adaptiveSourceSize = resolveAdaptiveSourceSize({
          displayWidth: Number(box2?.width || this._data?.width || 0),
          displayHeight: Number(box2?.height || this._data?.height || 0),
          inputWidth: inputWidth,
          inputHeight: inputHeight,
        }),
        width =
          isAdaptiveRatioLabel2 && inputWidth > 0 && inputHeight > 0
            ? { width: inputWidth, height: inputHeight, source: 'input-media' }
            : adaptiveSourceSize,
        value112 = provider8 === 'dreamina' ? normalizeDreaminaImageAspectRatio(value109) : value109,
        ratioLabel = parseRatioLabel(value112)?.label || '',
        imageSize7 = imageSize6,
        value113 =
          isAdaptiveRatioLabel2 &&
          (shouldUseGrsaiNanoBananaApiAuto({ provider: provider8, model: model8 }) ||
            shouldUseApimartSeedreamApiAuto({
              provider: provider8,
              model: model8,
              hasInputImages: hasInputImages2.length > 0,
            })),
        ratioLabel2 = isAdaptiveRatioLabel2
          ? value113
            ? 'auto'
            : pickClosestRatioForProviderModel({
                provider: provider8,
                model: model8,
                width: width.width,
                height: width.height,
                imageSize: imageSize7,
              })
          : pickClosestRatioForProviderModel({
              provider: provider8,
              model: model8,
              ratioLabel: ratioLabel || value112 || '1:1',
              imageSize: imageSize7,
            }),
        aspectRatio = value113
          ? { resolvedRatioLabel: 'auto' }
          : resolveProviderRatioPayload({
              provider: provider8,
              model: model8,
              ratioLabel: ratioLabel2,
              imageSize: imageSize7,
            }),
        ratioCapability = getRatioCapability(provider8, model8),
        value114 = ratioCapability === 'none',
        imageSize8 =
          provider8 === 'dreamina'
            ? normalizeDreaminaImageSize(imageSize5 || '2K')
            : rhQwenEditMode && String(imageSize6).toUpperCase() === '4K'
              ? '2K'
              : imageSize6,
        modelVersion = provider8 === 'dreamina' ? getDreaminaImageModelVersion(model8, provider8) : '';
      return {
        prompt: prompt,
        model: model8,
        aspectRatio: aspectRatio.resolvedRatioLabel,
        resolvedRatioLabel: aspectRatio.resolvedRatioLabel,
        adaptiveSource: width.source,
        ratioCapability: ratioCapability,
        imageSize: imageSize8,
        modelVersion: modelVersion,
        ...args4,
        ...(mode2 !== undefined ? { mode: mode2 } : {}),
        ...(rhModelRoute !== undefined ? { rhModelRoute: rhModelRoute } : {}),
        ...(google_search !== undefined ? { google_search: google_search } : {}),
        ...(google_image_search !== undefined ? { google_image_search: google_image_search } : {}),
        batchSize: parseInt(value103) || 1,
        inputUrls: hasInputImages2,
        ...(Object.keys(inputUrlsBySlot).length > 0 ? { inputUrlsBySlot: inputUrlsBySlot } : {}),
        inputMaskUrls: inputMaskUrls,
        apiKey: apiKey2,
        installId: installId,
        rhResolution: readSchemaParam4('rhResolution') ?? readSchemaParam4('rhAnimeRealResolution'),
        rhAnimeRealResolution: readSchemaParam4('rhAnimeRealResolution'),
        rhInstanceType: readSchemaParam4('rhInstanceType'),
        rhQwenEditMode: rhQwenEditMode ? String(readSchemaParam4('rhQwenEditMode') || '').trim() : undefined,
        rhQwenFirstImageMode: rhQwenEditMode
          ? String(readSchemaParam4('rhQwenFirstImageMode') || '').trim()
          : undefined,
        provider: provider8,
        cameraAngle: this._data.cameraAngle || null,
        ratioNotice: aspectRatio.notice || '',
        ...(value114 ? { suppressAspectRatio: true } : {}),
      };
    }
    async ['_handleGenerateOrCancel'](value115 = null) {
      const value116 = store.getState().nodes?.[this.nodeId] || this._data || {},
        cancellable2 = this._isRunninghubWorkflowModel(value116?.model, value116?.provider);
      if (
        shouldAllowCancel(value116, {
          cancellable: cancellable2,
          cancelInFlight: this._rhCancelInFlight === true,
        })
      ) {
        await this._cancelRunningHubWorkflowTask();
        return;
      }
      await this._onGenerate(value115);
    }
    ['_buildRunningHubCancelResultPatch']({
      latest: latest = {},
      message: message = t('aigenImage.task.interrupted'),
      code: code = null,
      duration: duration = null,
      taskId: taskId = '',
    } = {}) {
      const startedAt18 = Number(latest?.rhTaskStartedAt || latest?.generationStartTime || 0),
        rhStatusMessage2 =
          String(message || t('aigenImage.task.interrupted')).trim() || t('aigenImage.task.interrupted'),
        value117 = code === null || code === undefined || code === '' ? null : Number(code);
      return {
        rhStatusMessage: rhStatusMessage2,
        rhStatusCode: Number.isFinite(value117) ? value117 : null,
        images: [],
        imageUrl: '',
        thumbUrl: '',
        localPath: '',
        ...buildGenerationCancelledPatch({ startedAt: startedAt18, duration: duration }),
        ...this._buildRunningHubTaskPatch({
          taskId: taskId,
          status: 'cancelled',
          startedAt: startedAt18,
          recovering: false,
          useOpenapiQuery: latest?.rhTaskUseOpenapiQuery === true,
        }),
      };
    }
    async ['_cancelRunningHubWorkflowTask']() {
      const latest3 = store.getState().nodes?.[this.nodeId] || this._data || {},
        apiKey3 = this._rhApiKey || '',
        taskId5 = String(this._rhTaskId || '').trim() || String(latest3?.rhTaskId || '').trim(),
        value118 = Date.now(),
        count2 = Number(latest3?.generationStartTime),
        duration3 =
          latest3?.generationDuration != null
            ? latest3.generationDuration
            : Number.isFinite(count2) && count2 > 0
              ? Math.max(0, value118 - count2)
              : 0;
      this._rhCancelRequested = true;
      if (this._rhCancelInFlight) return;
      this._rhAbortController && !this._rhAbortController.signal.aborted && this._rhAbortController.abort();
      const enabled21 = !apiKey3,
        code2 = !taskId5;
      try {
        this._rhCancelInFlight = true;
        const cancelledBuilder = ({ remoteResult: remoteResult, remoteError: remoteError }) => {
          const count3 = Number(remoteResult?.code),
            value119 = String(remoteResult?.msg || remoteResult?.message || '').trim(),
            value120 = enabled21
              ? t('aigenImage.task.cancelMissingApiKey')
              : code2
                ? t('aigenImage.task.interruptedMissingTaskId')
                : '',
            message2 =
              value120 ||
              (remoteError
                ? remoteError.message || t('aigenImage.task.cancelFailed')
                : count3 === 0
                  ? value119 || t('aigenImage.task.cancelSuccess')
                  : count3 === 807
                    ? value119 || t('aigenImage.task.taskNotFound')
                    : value119 || t('aigenImage.task.cancelFailed'));
          return this._buildRunningHubCancelResultPatch({
            latest: latest3,
            message: message2,
            code: code2 ? 813 : count3,
            duration: duration3,
          });
        };
        (await cancelTask(this.nodeId, {
          store: store,
          taskId: taskId5,
          cancellable: true,
          cancel: ({ taskId: taskId6 }) => {
            if (!apiKey3) throw new Error(t('aigenImage.task.cancelMissingApiKey'));
            return api.cancelRunningHubWorkflowTask({ apiKey: apiKey3, taskId: taskId6 });
          },
          cancelledBuilder: cancelledBuilder,
          spec: {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'image-generation',
            provider: latest3?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: latest3?.model || '',
            executionId: 'runninghub.image.' + (latest3?.model || 'workflow'),
            payload: latest3,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: cancelledBuilder,
          },
        }),
          this._persistRunningHubResumeCache());
        const value121 = store.getState().nodes?.[this.nodeId] || {},
          count4 = Number(value121?.rhStatusCode),
          value122 = String(value121?.rhStatusMessage || '').trim();
        if (!enabled21 && !code2) {
          if (count4 === 0) window.showToast?.(t('aigenImage.task.cancelledToast'), 'success');
          else {
            if (value122) window.showToast?.(value122, 'error');
          }
        }
      } finally {
        ((this._rhCancelInFlight = false),
          (this._isGenerating = false),
          (this._rhAbortController = null),
          (this._rhTaskId = null),
          (this._rhApiKey = null),
          this.btnEl && (resetGenerateButtonIdleUi(this.btnEl), this._updateSubmitButtonState()),
          stopLoading(this.previewEl));
      }
    }
    ['_getPreviewGenerateButtonLoadingOptions']() {
      return createPreviewGenerateButtonCallbacks(this, t('aigenImage.controls.generate'));
    }
    async ['runGeneration'](options4 = {}) {
      return this._onGenerate(null, options4);
    }
    async ['cancelGeneration']() {
      return this._cancelRunningHubWorkflowTask();
    }
    ['getGenerationStatus']() {
      const value123 = store.getState?.()?.nodes?.[this.nodeId] || this._data || {},
        jobStatus = String(
          value123.jobStatus ||
            value123.asyncTaskStatus ||
            value123.rhTaskStatus ||
            (this._isGenerating ? 'running' : 'idle'),
        );
      return {
        nodeId: this.nodeId,
        jobStatus: jobStatus,
        isGenerating: this._isGenerating === true || jobStatus === 'running' || jobStatus === 'pending',
        taskId: String(this._rhTaskId || value123.rhTaskId || value123.asyncTaskId || value123.taskId || ''),
        cancellable: true,
        resumable: Boolean(value123.asyncTaskId || value123.rhTaskId),
      };
    }
    async ['_onGenerate'](template = null, value124 = {}) {
      if (this._isGenerating) return;
      if (value124?.insertPrompt === true) {
        (insertPresetPromptIntoEditor({
          storeApi: store,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          template: template,
          inEdges: store.getIncomingEdges(this.nodeId),
          nodes: store.getState().nodes || {},
          allowedAssetTypes: ['text', 'image'],
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
      const provider9 = await this._buildPayload(template);
      if (!provider9) return;
      const imageProviderApiKeyMissingMessage = getImageProviderApiKeyMissingMessage(provider9);
      if (imageProviderApiKeyMissingMessage) {
        window.showToast?.(imageProviderApiKeyMissingMessage, 'warn');
        return;
      }
      const resumable = this._isRunninghubTaskModel(provider9.model, provider9.provider),
        adapterType = this._isRunninghubWorkflowModel(provider9.model, provider9.provider),
        onProgress = this._isDreaminaImageNode(provider9),
        provider10 = this._inferProviderFromModel(
          provider9?.model,
          provider9?.provider || this._data?.provider || '',
        ),
        async2 = !resumable && !onProgress && isAsyncImageModelApiProvider(provider10),
        useOpenapiQuery2 =
          resolveModelProvider(provider9?.model, provider9?.provider, { allowProviderHint: false }) ===
            'runninghub' && isModelApiModel(provider9?.model, 'runninghub'),
        busy2 = shouldUseImageWorkflowBusyButton(provider9.model);
      resumable && this._stopRunningHubRecovery(true);
      onProgress && this._stopDreaminaRecovery(true);
      async2 && this._stopAsyncRecovery(true);
      this._rhCancelRequested = false;
      const pauseOnAbort = resumable || onProgress || async2;
      ((this._rhApiKey = resumable ? provider9.apiKey : null),
        (this._rhTaskId = null),
        (this._rhAbortController = pauseOnAbort ? new AbortController() : null),
        (this._isGenerating = true));
      this.btnEl &&
        (adapterType
          ? setGenerateButtonCancellableUi(this.btnEl, { busy: busy2 })
          : setGenerateButtonLoadingUi(this.btnEl));
      startLoading(this.previewEl);
      const startedAt19 = Date.now(),
        value125 = {
          ...buildGenerationStartPatch({ startedAt: startedAt19 }),
          rhStatusMessage: null,
          rhStatusCode: null,
        };
      resumable &&
        (Object.assign(
          value125,
          this._buildRunningHubTaskPatch({
            taskId: '',
            status: 'pending',
            startedAt: startedAt19,
            recovering: false,
            useOpenapiQuery: useOpenapiQuery2,
          }),
        ),
        Object.assign(value125, {
          ...this._buildDreaminaTaskPatch({
            submitId: '',
            status: 'idle',
            phase: 'idle',
            label: '',
            startedAt: 0,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
          ...this._buildAsyncTaskPatch({
            provider: '',
            kind: 'image',
            taskId: '',
            status: 'idle',
            startedAt: 0,
            recovering: false,
          }),
        }));
      onProgress &&
        (Object.assign(
          value125,
          this._buildDreaminaTaskPatch({
            submitId: '',
            status: 'pending',
            phase: 'generating',
            label: t('aigenImage.task.submitting'),
            startedAt: startedAt19,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
        ),
        Object.assign(value125, {
          ...this._buildRunningHubTaskPatch({
            taskId: '',
            status: 'idle',
            startedAt: 0,
            recovering: false,
            useOpenapiQuery: false,
          }),
          ...this._buildAsyncTaskPatch({
            provider: '',
            kind: 'image',
            taskId: '',
            status: 'idle',
            startedAt: 0,
            recovering: false,
          }),
        }));
      async2 &&
        (Object.assign(
          value125,
          this._buildAsyncTaskPatch({
            provider: provider10,
            kind: 'image',
            taskId: '',
            status: 'pending',
            startedAt: startedAt19,
            recovering: false,
          }),
        ),
        Object.assign(value125, {
          ...this._buildRunningHubTaskPatch({
            taskId: '',
            status: 'idle',
            startedAt: 0,
            recovering: false,
            useOpenapiQuery: false,
          }),
          ...this._buildDreaminaTaskPatch({
            submitId: '',
            status: 'idle',
            phase: 'idle',
            label: '',
            startedAt: 0,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
        }));
      !resumable &&
        !onProgress &&
        !async2 &&
        Object.assign(value125, {
          ...this._buildRunningHubTaskPatch({
            taskId: '',
            status: 'idle',
            startedAt: 0,
            recovering: false,
            useOpenapiQuery: false,
          }),
          ...this._buildDreaminaTaskPatch({
            submitId: '',
            status: 'idle',
            phase: 'idle',
            label: '',
            startedAt: 0,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
          ...this._buildAsyncTaskPatch({
            provider: '',
            kind: 'image',
            taskId: '',
            status: 'idle',
            startedAt: 0,
            recovering: false,
          }),
        });
      value125.ratioNotice = String(provider9?.ratioNotice || '');
      let response20 = null;
      try {
        response20 = await submitTask(
          {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'image-generation',
            provider: provider9.provider || provider10 || this._data?.provider || '',
            adapterType: adapterType ? 'workflow' : 'modelApi',
            modelId: provider9.model || this._data?.model || '',
            executionId:
              'image.' +
              (provider9.provider || provider10 || 'modelApi') +
              '.' +
              (provider9.model || 'default'),
            payload: provider9,
            cancellable: adapterType,
            resumable: resumable || onProgress || async2,
            async: async2,
            pauseOnAbort: pauseOnAbort,
            startBuilder: () => value125,
            pauseBuilder: (startedAt20) => {
              const raw3 = store.getState().nodes?.[this.nodeId] || {};
              if (onProgress)
                return this._buildDreaminaTaskPatch({
                  submitId:
                    String(this._dreaminaActiveSubmitId || '').trim() ||
                    String(raw3?.dreaminaSubmitId || '').trim(),
                  status: String(raw3?.dreaminaTaskStatus || '').trim() || 'pending',
                  phase: String(raw3?.dreaminaTaskPhase || '').trim() || 'generating',
                  label: String(raw3?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: startedAt20.startedAt,
                  lastCheckedAt: Date.now(),
                  recovering: false,
                  raw: raw3?.dreaminaTaskLastRaw || {},
                });
              if (resumable)
                return this._buildRunningHubTaskPatch({
                  taskId:
                    String(this._rhTaskId || '').trim() ||
                    String(raw3?.rhTaskId || '').trim() ||
                    String(startedAt20?.taskId || '').trim(),
                  status: String(raw3?.rhTaskStatus || '').trim() || 'running',
                  startedAt: startedAt20.startedAt,
                  recovering: false,
                  useOpenapiQuery: raw3?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                });
              return {};
            },
            onTaskStart: () => {
              this._syncLocalTaskNodeData();
              if (resumable) this._persistRunningHubResumeCache();
              if (onProgress) this._persistDreaminaResumeCache();
              if (async2) this._persistAsyncResumeCache();
            },
            submit: async (value126, value127 = {}) =>
              api.generateImage(provider9, {
                ...(this._rhAbortController ? { signal: this._rhAbortController.signal } : {}),
                onProgress: onProgress
                  ? (raw4 = {}) => {
                      const status2 = String(raw4?.status || 'pending').trim() || 'pending',
                        phase2 = String(raw4?.phase || 'generating').trim() || 'generating',
                        error11 = String(
                          raw4?.failReason ||
                            raw4?.failureReason ||
                            raw4?.error ||
                            raw4?.message ||
                            raw4?.label ||
                            '',
                        ).trim();
                      if (
                        status2.toLowerCase() === 'failed' ||
                        status2.toLowerCase() === 'fail' ||
                        status2.toLowerCase() === 'error' ||
                        phase2.toLowerCase() === 'failed' ||
                        phase2.toLowerCase() === 'fail' ||
                        phase2.toLowerCase() === 'error'
                      ) {
                        this._finalizeDreaminaImageFailure({
                          error: error11 || t('aigenImage.task.generationFailed'),
                          startedAt: startedAt19,
                          submitId:
                            String(raw4?.submitId || '').trim() ||
                            String(store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim(),
                          lastCheckedAt: Number(raw4?.lastCheckedAt || Date.now()),
                          raw: raw4?.raw || {},
                        });
                        return;
                      }
                      this._applyDreaminaTaskPatch({
                        submitId:
                          String(raw4?.submitId || '').trim() ||
                          String(store.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim(),
                        status: status2,
                        phase: phase2,
                        label:
                          String(raw4?.label || t('aigenImage.task.generating')).trim() ||
                          t('aigenImage.task.generating'),
                        startedAt: startedAt19,
                        lastCheckedAt: Number(raw4?.lastCheckedAt || Date.now()),
                        recovering: false,
                        raw: raw4?.raw || {},
                      });
                    }
                  : undefined,
                onTaskMeta: ({
                  taskId: taskId7,
                  useOpenapiQuery: useOpenapiQuery3,
                  provider: provider11,
                }) => {
                  const submitId3 = String(taskId7 || '').trim();
                  if (!submitId3) return;
                  if (resumable) {
                    ((this._rhTaskId = submitId3),
                      value127.onTaskId?.(submitId3),
                      store.updateNodeData(this.nodeId, {
                        rhStatusMessage: null,
                        rhStatusCode: null,
                        rhTaskUseOpenapiQuery: useOpenapiQuery3 === true,
                      }),
                      this._syncLocalTaskNodeData(),
                      this._persistRunningHubResumeCache());
                    adapterType && this._rhCancelRequested && this._cancelRunningHubWorkflowTask();
                    return;
                  }
                  if (onProgress) {
                    ((this._dreaminaActiveSubmitId = submitId3),
                      this._applyDreaminaTaskPatch({
                        submitId: submitId3,
                        status: 'pending',
                        phase: 'generating',
                        label: t('aigenImage.task.generating'),
                        startedAt: startedAt19,
                        lastCheckedAt: Date.now(),
                        recovering: false,
                        raw: {},
                      }),
                      value127.onTaskId?.(submitId3));
                    return;
                  }
                  async2 &&
                    (value127.onTaskId?.(submitId3),
                    store.updateNodeData(this.nodeId, {
                      asyncTaskProvider: this._inferProviderFromModel(
                        provider9?.model,
                        provider11 || provider10 || this._data?.provider || '',
                      ),
                      asyncTaskKind: 'image',
                    }),
                    this._syncLocalTaskNodeData(),
                    this._persistAsyncResumeCache());
                },
                onTaskId: (value128) => {
                  const submitId4 = String(value128 || '').trim();
                  if (!submitId4) return;
                  if (resumable) {
                    ((this._rhTaskId = submitId4), value127.onTaskId?.(submitId4));
                    const rhTaskUseOpenapiQuery2 = store.getState().nodes?.[this.nodeId] || {};
                    (store.updateNodeData(this.nodeId, {
                      rhStatusMessage: null,
                      rhStatusCode: null,
                      rhTaskUseOpenapiQuery:
                        rhTaskUseOpenapiQuery2?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                    }),
                      this._syncLocalTaskNodeData(),
                      this._persistRunningHubResumeCache());
                    adapterType && this._rhCancelRequested && this._cancelRunningHubWorkflowTask();
                    return;
                  }
                  if (onProgress) {
                    ((this._dreaminaActiveSubmitId = submitId4),
                      this._applyDreaminaTaskPatch({
                        submitId: submitId4,
                        status: 'pending',
                        phase: 'generating',
                        label: t('aigenImage.task.generating'),
                        startedAt: startedAt19,
                        lastCheckedAt: Date.now(),
                        recovering: false,
                        raw: {},
                      }),
                      value127.onTaskId?.(submitId4));
                    return;
                  }
                  if (async2) {
                    const value129 = store.getState().nodes?.[this.nodeId] || {};
                    (value127.onTaskId?.(submitId4),
                      store.updateNodeData(this.nodeId, {
                        asyncTaskProvider: this._inferProviderFromModel(
                          value129?.model || provider9?.model,
                          value129?.asyncTaskProvider || provider10 || this._data?.provider || '',
                        ),
                        asyncTaskKind: 'image',
                      }),
                      this._syncLocalTaskNodeData(),
                      this._persistAsyncResumeCache());
                  }
                },
              }),
            cancel: adapterType
              ? async ({ taskId: taskId8 }) => {
                  const apiKey4 = this._rhApiKey || provider9.apiKey || '',
                    taskId9 = String(taskId8 || '').trim();
                  if (!apiKey4 || !taskId9) return null;
                  return api.cancelRunningHubWorkflowTask({ apiKey: apiKey4, taskId: taskId9 });
                }
              : undefined,
            resultBuilder: async (value130, startedAt21) => {
              const value131 = this._getImageGenerationResultError(value130);
              if (value131) throw new Error(value131);
              const value132 = this._applyImageGenerationResult(value130, startedAt21.startedAt, {
                  writeStore: false,
                }),
                value133 = { ...(value132?.patch || {}) };
              if (resumable) {
                const useOpenapiQuery4 = store.getState().nodes?.[this.nodeId] || {};
                (Object.assign(
                  value133,
                  this._buildRunningHubTaskPatch({
                    taskId:
                      String(this._rhTaskId || '').trim() || String(useOpenapiQuery4?.rhTaskId || '').trim(),
                    status: 'success',
                    startedAt: startedAt21.startedAt,
                    recovering: false,
                    useOpenapiQuery: useOpenapiQuery4?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                  }),
                ),
                  this._persistRunningHubResumeCache());
              } else {
                if (onProgress) {
                  const value134 = store.getState().nodes?.[this.nodeId] || {};
                  (Object.assign(
                    value133,
                    this._buildDreaminaTaskPatch({
                      submitId: String(value134?.dreaminaSubmitId || '').trim(),
                      status: 'success',
                      phase: 'done',
                      label: t('aigenImage.task.completed'),
                      startedAt: startedAt21.startedAt,
                      lastCheckedAt: Date.now(),
                      recovering: false,
                      raw: {},
                    }),
                  ),
                    this._persistDreaminaResumeCache());
                } else {
                  if (async2) {
                    const value135 = store.getState().nodes?.[this.nodeId] || {};
                    (Object.assign(
                      value133,
                      this._buildAsyncTaskPatch({
                        provider: this._inferProviderFromModel(
                          value135?.model || provider9?.model,
                          value135?.asyncTaskProvider || provider10 || '',
                        ),
                        kind: 'image',
                        taskId:
                          String(value135?.asyncTaskId || '').trim() ||
                          String(startedAt21?.taskId || '').trim(),
                        status: 'success',
                        startedAt: startedAt21.startedAt,
                        recovering: false,
                      }),
                    ),
                      this._persistAsyncResumeCache());
                  }
                }
              }
              return value133;
            },
            failureBuilder: (error12, startedAt22) => {
              if (onProgress) {
                const raw5 = store.getState().nodes?.[this.nodeId] || {};
                return this._buildDreaminaFailurePatch({
                  error: error12,
                  startedAt: startedAt22.startedAt,
                  submitId:
                    String(this._dreaminaActiveSubmitId || '').trim() ||
                    String(raw5?.dreaminaSubmitId || '').trim(),
                  lastCheckedAt: Date.now(),
                  raw: raw5?.dreaminaTaskLastRaw || {},
                });
              }
              const value136 = {
                ...buildImageGenerationFailurePatch({
                  error: error12?.message || t('aigenImage.task.generationFailed'),
                  startedAt: startedAt22.startedAt,
                }),
              };
              if (resumable) {
                const useOpenapiQuery5 = store.getState().nodes?.[this.nodeId] || {};
                Object.assign(
                  value136,
                  {
                    rhStatusMessage: error12?.message || t('aigenImage.task.generationFailed'),
                    rhStatusCode: Number.isFinite(Number(error12?.code)) ? Number(error12.code) : null,
                  },
                  this._buildRunningHubTaskPatch({
                    taskId:
                      String(this._rhTaskId || '').trim() || String(useOpenapiQuery5?.rhTaskId || '').trim(),
                    status: 'failed',
                    startedAt: startedAt22.startedAt,
                    recovering: false,
                    useOpenapiQuery: useOpenapiQuery5?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                  }),
                );
              } else {
                if (async2) {
                  const value137 = store.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    value136,
                    this._buildAsyncTaskPatch({
                      provider: this._inferProviderFromModel(
                        value137?.model || provider9?.model,
                        value137?.asyncTaskProvider || provider10 || '',
                      ),
                      kind: 'image',
                      taskId:
                        String(value137?.asyncTaskId || '').trim() ||
                        String(startedAt22?.taskId || '').trim(),
                      status: 'failed',
                      startedAt: startedAt22.startedAt,
                      recovering: false,
                    }),
                  );
                }
              }
              return value136;
            },
            cancelledBuilder: (value138) => {
              const latest4 = store.getState().nodes?.[this.nodeId] || {},
                duration4 =
                  latest4.generationDuration == null
                    ? Date.now() - value138.startedAt
                    : latest4.generationDuration;
              if (adapterType)
                return this._buildRunningHubCancelResultPatch({
                  latest: latest4,
                  message: latest4.rhStatusMessage || t('aigenImage.task.interrupted'),
                  code: latest4.rhStatusCode,
                  duration: duration4,
                  taskId: String(this._rhTaskId || '').trim() || String(latest4?.rhTaskId || '').trim(),
                });
              return { images: [], imageUrl: '', thumbUrl: '', localPath: '' };
            },
            parseError: (error13) => error13?.message || t('aigenImage.task.generationFailed'),
          },
          { store: store, startedAt: startedAt19, abortController: this._rhAbortController },
        );
        if (response20.status === 'failed') {
          const message3 = response20.error;
          (console.error('[AIGenerateNode] 生成失败:', message3),
            void logDiagnosticEvent({
              type: 'generation.image_failed',
              level: 'error',
              source: 'renderer',
              message: message3?.message || t('aigenImage.task.imageGenerationFailed'),
              error: message3,
              context: {
                nodeId: this.nodeId,
                provider: provider9?.provider || '',
                model: provider9?.model || '',
                isRhTaskModel: resumable,
                isDreaminaTask: onProgress,
                isAsyncTaskModel: async2,
              },
            }));
        }
        if (resumable) this._persistRunningHubResumeCache();
        if (onProgress) this._persistDreaminaResumeCache();
        if (async2) this._persistAsyncResumeCache();
        return response20;
      } finally {
        const value139 = this._syncLocalTaskNodeData(),
          shouldShowGenerationBusyUi5 = shouldShowGenerationBusyUi(value139);
        ((this._isGenerating = shouldShowGenerationBusyUi5),
          (this._dreaminaActiveSubmitId = ''),
          (this._rhAbortController = null));
        if (resumable && shouldShowGenerationBusyUi5) {
          const value140 = String(value139?.rhTaskId || '').trim();
          if (value140) this._rhTaskId = value140;
        } else {
          this._rhTaskId = null;
          if (!this._rhCancelRequested) this._rhApiKey = null;
        }
        this.btnEl && this._updateSubmitButtonState?.();
        if (!shouldShowGenerationBusyUi5) {
          if (this.btnEl) resetGenerateButtonIdleUi(this.btnEl);
          stopLoading(this.previewEl);
        }
      }
    }
    ['unmount']() {
      (this._flushPromptHtmlCommit?.(),
        this._assetMentionRegistryUnsubscribe?.(),
        (this._assetMentionRegistryUnsubscribe = null),
        (this._assetMentionRegistryRefreshPending = false),
        this._stopRunningHubRecovery(false),
        this._stopDreaminaRecovery(false),
        this._stopAsyncRecovery(false),
        this._rhAbortController && !this._rhAbortController.signal.aborted && this._rhAbortController.abort(),
        (this._rhAbortController = null),
        this._generationNodeHelpTip?.remove(),
        (this._generationNodeHelpTip = null),
        this._unbindImageLocaleChange?.(),
        (this._unbindImageLocaleChange = null),
        this._uiSchemaCleanup?.(),
        (this._uiSchemaCleanup = null),
        this._footerControllerCleanup?.(),
        (this._footerControllerCleanup = null),
        this._lowZoomHoverRefreshTimer &&
          (clearTimeout(this._lowZoomHoverRefreshTimer), (this._lowZoomHoverRefreshTimer = null)),
        setNodeMediaLodHoverPromoted(this._root, false));
    }
  }
  return value11.prototype;
}
