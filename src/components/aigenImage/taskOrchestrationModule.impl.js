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
const DREAMINA_STALE_ACTIVE_RESUME_MS = 15 * 0x3e8,
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
function normalizeTaskStatus(_0x345625) {
  return String(_0x345625 || '')
    .trim()
    .toLowerCase();
}
function isAsyncImageModelApiProvider(_0x5a9947) {
  return ASYNC_IMAGE_MODEL_API_PROVIDERS.has(
    String(_0x5a9947 || '')
      .trim()
      .toLowerCase(),
  );
}
function getImageProviderApiKeyMissingMessage(_0x3d30d0 = {}) {
  if (String(_0x3d30d0?.apiKey || '').trim()) return '';
  const _0x14bd89 = String(_0x3d30d0?.provider || '')
    .trim()
    .toLowerCase();
  if (!_0x14bd89) return '';
  if (_0x14bd89 === 'volcengine') return t('aigenImage.task.apiKeyMissing.volcengine');
  if (_0x14bd89 === 'runninghub')
    return isModelApiModel(_0x3d30d0?.model, 'runninghub')
      ? t('aigenImage.task.apiKeyMissing.runninghubModel')
      : t('aigenImage.task.apiKeyMissing.runninghub');
  if (_0x14bd89 === 'runninghubwf') return t('aigenImage.task.apiKeyMissing.runninghub');
  if (_0x14bd89 === 'apimart') return t('aigenImage.task.apiKeyMissing.apimart');
  if (_0x14bd89 === 'ppio') return t('aigenImage.task.apiKeyMissing.ppio');
  if (_0x14bd89 === 'grsai') return t('aigenImage.task.apiKeyMissing.grsai');
  return '';
}
const REFERENCE_LABEL_ALIASES = Object.freeze({
  text: Object.freeze(['文本', 'Text']),
  image: Object.freeze(['图片', 'Image']),
  video: Object.freeze(['视频', 'Video']),
  audio: Object.freeze(['音频', 'Audio']),
});
function getReferenceTypeLabel(_0x445ea6) {
  const _0x4b6d66 = {
    text: t('aigenImage.refs.types.text'),
    image: t('aigenImage.refs.types.image'),
    video: t('aigenImage.refs.types.video'),
    audio: t('aigenImage.refs.types.audio'),
  };
  return _0x4b6d66[_0x445ea6] || String(_0x445ea6 || '');
}
function buildReferenceLabelAliases(_0x340714, _0xe1b449) {
  const _0x1c1633 = [
    '@' + getReferenceTypeLabel(_0x340714) + _0xe1b449,
    ...(REFERENCE_LABEL_ALIASES[_0x340714] || []).map((_0xe7ec54) => '@' + _0xe7ec54 + _0xe1b449),
  ];
  return Array.from(new Set(_0x1c1633));
}
function createSchemaParamAccess({
  model: _0xc5900a,
  data: _0x707741,
  generationParams: _0x3a48bc,
  manifestFields: _0x56bdab,
}) {
  const _0x6281a1 = (_0x4f2618) =>
      _0x56bdab.find((_0x2eae69) => String(_0x2eae69?.id || '') === _0x4f2618) || null,
    _0x2d5826 = (_0x505de2) => {
      const _0x2662ac = _0x6281a1(_0x505de2);
      if (!_0x2662ac) return undefined;
      if (_0x3a48bc[_0x505de2] !== undefined) return _0x3a48bc[_0x505de2];
      return _0x2662ac.defaultValue;
    },
    _0x70acd1 = (_0x3699dc) => {
      const _0x1e8db5 = _0x2d5826(_0x3699dc);
      if (_0x1e8db5 === undefined || _0x1e8db5 === null || String(_0x1e8db5).trim() === '')
        throw new Error('Manifest model ' + _0xc5900a + ' missing ' + _0x3699dc);
      return _0x1e8db5;
    };
  return { getManifestField: _0x6281a1, readSchemaParam: _0x2d5826, requireSchemaParam: _0x70acd1 };
}
function isGrsaiGptImage2Model(_0x556b6c, _0x3f4891) {
  const _0x3ed22c = resolveNanoBananaSelectionFromModel(_0x3f4891, '2K', _0x556b6c || 'grsai');
  return _0x3ed22c?.provider === 'grsai' && _0x3ed22c.family === NANO_BANANA_FAMILIES.GPT_IMAGE_2;
}
function resolveGrsaiGptImage2ModelForSize({
  provider: _0x381839,
  model: _0x48c4ee,
  imageSize: _0x501130,
} = {}) {
  if (!isGrsaiGptImage2Model(_0x381839, _0x48c4ee)) return _0x48c4ee;
  const _0x44e1b3 = String(_0x501130 || '1K')
      .trim()
      .toUpperCase(),
    _0x4030c3 =
      resolveModelExecution(_0x48c4ee, { providerHint: 'grsai' }) ||
      resolveModelExecution(resolveNanoBananaSelectionFromModel(_0x48c4ee, _0x44e1b3, 'grsai')?.model, {
        providerHint: 'grsai',
      }),
    _0x204e1a = _0x4030c3?.executionManifest?.imageSizeModels;
  if (!_0x204e1a || typeof _0x204e1a !== 'object') return _0x48c4ee;
  return _0x204e1a[_0x44e1b3] || _0x204e1a.default || _0x4030c3?.modelManifest?.modelId || _0x48c4ee;
}
function resolveImageSizeForProviderModel({
  provider: _0x57a79e,
  model: _0x160fd3,
  imageSize: _0x329b8a,
} = {}) {
  const _0x4b9988 = normalizeImageSizeForProviderModel({
    provider: _0x57a79e,
    model: _0x160fd3,
    imageSize: _0x329b8a,
  });
  if (_0x4b9988) return _0x4b9988;
  if (
    !String(_0x329b8a || '').trim() &&
    String(_0x57a79e || '')
      .trim()
      .toLowerCase() === 'runninghub' &&
    String(_0x160fd3 || '').trim() === 'runninghub-model/rhart-image-g'
  )
    return '1K';
  const _0x3df6fa = String(_0x329b8a || (isGrsaiGptImage2Model(_0x57a79e, _0x160fd3) ? '1K' : '2K'))
    .trim()
    .toUpperCase();
  return _0x3df6fa || '2K';
}
function shouldUseGrsaiNanoBananaApiAuto({ provider: _0x2b34bb, model: _0x1d486e } = {}) {
  const _0x371d60 = String(_0x2b34bb || '')
    .trim()
    .toLowerCase();
  if (_0x371d60 !== 'grsai') return false;
  const _0x2a5b82 = resolveNanoBananaSelectionFromModel(_0x1d486e, '2K', _0x2b34bb);
  if (!_0x2a5b82) return false;
  return _0x2a5b82.family !== NANO_BANANA_FAMILIES.GPT_IMAGE_2;
}
function shouldUseApimartSeedreamApiAuto({
  provider: _0x34a849,
  model: _0x5d1b0b,
  hasInputImages: _0x13d1e4,
} = {}) {
  const _0x1e8c34 = String(_0x34a849 || '')
    .trim()
    .toLowerCase();
  if (_0x1e8c34 !== 'apimart' || !_0x13d1e4) return false;
  const _0x536d06 = resolveModelExecution(_0x5d1b0b, { providerHint: _0x1e8c34 });
  return _0x536d06?.executionManifest?.extensions?.apimartSeedream?.preserveAdaptiveInputRatio === true;
}
function sanitizeTaskGenerationParams(_0x28032f, _0x3339f6 = {}) {
  const _0x43276f = _0x3339f6 && typeof _0x3339f6 === 'object' && !Array.isArray(_0x3339f6) ? _0x3339f6 : {},
    _0x649329 = sanitizeModelUiSchemaParams(_0x28032f, _0x43276f, { includeDefaults: false });
  return (
    Object.prototype.hasOwnProperty.call(_0x43276f, 'aspectRatio') &&
      (_0x649329.aspectRatio = _0x43276f.aspectRatio),
    { ..._0x43276f, ..._0x649329 }
  );
}
function normalizeTaskBooleanParam(_0x4cb0db) {
  if (_0x4cb0db === true || _0x4cb0db === false) return _0x4cb0db;
  const _0x360388 = String(_0x4cb0db ?? '')
    .trim()
    .toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(_0x360388)) return true;
  if (['false', '0', 'no', 'off', ''].includes(_0x360388)) return false;
  return Boolean(_0x4cb0db);
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
  isModelApiManifest: _0x11902c,
  manifestFields: _0x1a9de6,
  readSchemaParam: _0xba085a,
} = {}) {
  if (!_0x11902c || !Array.isArray(_0x1a9de6)) return {};
  return _0x1a9de6.reduce((_0x511c23, _0x3dbce0) => {
    const _0x5bf9d = String(_0x3dbce0?.id || '').trim();
    if (!_0x5bf9d || MODEL_API_PAYLOAD_SCHEMA_PARAM_EXCLUDES.has(_0x5bf9d)) return _0x511c23;
    return ((_0x511c23[_0x5bf9d] = _0xba085a(_0x5bf9d)), _0x511c23);
  }, {});
}
function reorderImageInputUrlsByRefOrder(_0x54a423 = [], _0x969459 = []) {
  const _0x3b4ee1 = (Array.isArray(_0x54a423) ? _0x54a423 : [])
    .map((_0x19a082) => String(_0x19a082 || '').trim())
    .filter(Boolean);
  if (_0x3b4ee1.length <= 1) return _0x3b4ee1;
  const _0x598411 = new Set(_0x3b4ee1),
    _0x8b8e41 = [],
    _0x2ac295 = (_0x11902b) => {
      const _0x4c5993 = String(_0x11902b || '').trim();
      if (!_0x4c5993 || !_0x598411.has(_0x4c5993)) return;
      (_0x8b8e41.push(_0x4c5993), _0x598411.delete(_0x4c5993));
    };
  return (
    (Array.isArray(_0x969459) ? _0x969459 : []).forEach((_0x5df2d9) => {
      _0x2ac295(_0x5df2d9?.url);
    }),
    _0x3b4ee1.forEach(_0x2ac295),
    _0x8b8e41
  );
}
function buildInputUrlsByFixedImageSlot({
  fixedInputConfig: fixedInputConfig = null,
  imageRefs: imageRefs = [],
  assetInputRefs: assetInputRefs = [],
} = {}) {
  const _0x65379d = (fixedInputConfig?.visibleSlots || [])
    .map((_0x5f2516) => String(_0x5f2516 || '').trim())
    .filter(
      (_0xd6b718) => _0xd6b718 && String(fixedInputConfig?.slotKindById?.[_0xd6b718] || '') === 'image',
    );
  if (_0x65379d.length === 0) return {};
  const _0xacf884 = {},
    _0x41b02b = new Set(),
    _0x379441 = (_0x646403, _0x27f66e) => {
      const _0x3e7ba2 = String(_0x646403 || '').trim(),
        _0x182165 = String(_0x27f66e || '').trim();
      if (!_0x3e7ba2 || !_0x182165 || _0xacf884[_0x3e7ba2]) return false;
      if (!_0x65379d.includes(_0x3e7ba2)) return false;
      return ((_0xacf884[_0x3e7ba2] = _0x182165), _0x41b02b.add(_0x182165), true);
    },
    _0x16839e = (_0x170a9b) => {
      const _0x4be552 = String(_0x170a9b || '').trim();
      if (!_0x4be552 || _0x41b02b.has(_0x4be552)) return false;
      const _0x2ace23 = _0x65379d.find((_0xb74726) => !_0xacf884[_0xb74726]);
      return _0x379441(_0x2ace23, _0x4be552);
    };
  return (
    (Array.isArray(imageRefs) ? imageRefs : []).forEach((_0x244354) => {
      _0x379441(_0x244354?.refSlot, _0x244354?.url);
    }),
    (Array.isArray(assetInputRefs) ? assetInputRefs : []).forEach((_0x2fa72e) => {
      _0x379441(_0x2fa72e?.refSlot, _0x2fa72e?.url);
    }),
    (Array.isArray(imageRefs) ? imageRefs : []).forEach((_0x42aa88) => {
      _0x16839e(_0x42aa88?.url);
    }),
    (Array.isArray(assetInputRefs) ? assetInputRefs : []).forEach((_0x257d41) => {
      const _0x323eb0 = resolveEffectiveInputKind(_0x257d41) || _0x257d41?.type;
      if (_0x323eb0 === 'image') _0x16839e(_0x257d41?.url);
    }),
    _0xacf884
  );
}
export function createAIGenerateNodeTaskOrchestrationModule(_0x4481d1) {
  const {
    store: _0xff470c,
    api: _0xfcf4f2,
    getDisplayModelName: _0x5169d7,
    _handlePillHover: _0x2f0cf0,
    _handlePillOut: _0x1d078c,
    _syncEdgesOrderFromPills: _0x273dec,
    _syncPillLabels: _0x49d284,
    _checkAtTrigger: _0xbe7a6a,
    _populateMentionMenu: _0x31ee8e,
    _insertMentionPill: _0x5b866c,
    _handlePillKeyboard: _0x3f48e1,
    _rehydratePromptPills: _0x42519e,
    _handleMentionMenuKeyboard: _0x44e821,
    TEXT_TOOLBAR_HTML: _0x379af8,
    bindTextToolbarEvents: _0xd20093,
    IMAGE_TOOLBAR_HTML: _0x4d5cda,
    bindImageToolbarEvents: _0x40c888,
    showDevToast: _0x589542,
    getImage: _0xeea044,
    openNodeImagePreview: _0x520d7e,
    getPromptPresets: _0xa614a,
    openCustomPresetsManager: _0xc9231a,
    startLoading: _0x27a9f5,
    stopLoading: _0x32cd7a,
    bindRefThumbHoverPreview: _0x26f8b7,
    ensureThumbDecoded: _0x1da4be,
    revealRefThumbMedia: _0x28b18c,
    getRefKindByNodeType: _0x7bff2c,
    uploadFile: _0x5dc018,
    ensureConfig: _0x14e2fd,
    getProviderConfig: _0x28ad2b,
    generateId: _0x49a538,
    checkSlashTrigger: _0x2f48a4,
    handleSlashKeyboardNavigation: _0x3363e5,
    closeSlashMenu: _0x1154e6,
    activateMenuKeyboard: _0x4eaa76,
    ImageFreeAngleController: _0x450fea,
  } = _0x4481d1;
  class _0x2b8f6c {
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
    ['_isDreaminaImageNode'](_0x246b53 = this._data) {
      return resolveModelProvider(_0x246b53?.model, _0x246b53?.provider) === 'dreamina';
    }
    ['_inferProviderFromModel'](_0x1fb19f, _0x3fa144 = '') {
      return (
        resolveModelProvider(_0x1fb19f, '', { allowProviderHint: false }) ||
        resolveModelProvider(_0x1fb19f, _0x3fa144) ||
        resolveModelProvider(_0x1fb19f, 'grsai')
      );
    }
    ['_isRunninghubTaskModel'](_0x50420a, _0x2dc6db) {
      const _0x47a421 = resolveModelProvider(_0x50420a, _0x2dc6db, { allowProviderHint: false }),
        _0x47b884 = String(_0x2dc6db || _0x47a421 || '')
          .trim()
          .toLowerCase();
      return (
        ((_0x47b884 === 'runninghub' || _0x47a421 === 'runninghub') &&
          isModelApiModel(_0x50420a, 'runninghub')) ||
        this._isRunninghubWorkflowModel(_0x50420a, _0x2dc6db)
      );
    }
    ['_isRunningHubNanoBananaModel'](_0x48f144 = this._data?.model) {
      const _0x29e33d = resolveNanoBananaSelectionFromModel(_0x48f144, '2K', 'runninghub');
      return _0x29e33d?.provider === 'runninghub' && _0x29e33d.family === NANO_BANANA_FAMILIES.NANOBANANA;
    }
    ['_isRunningHubRecoverableRunningTask'](_0x93c83c = this._data) {
      if (!this._isRunninghubTaskModel(_0x93c83c?.model, _0x93c83c?.provider)) return false;
      const _0x44a9d6 = String(_0x93c83c?.rhTaskId || '').trim();
      if (!_0x44a9d6) return false;
      const _0x362b03 = String(_0x93c83c?.rhTaskStatus || '')
        .trim()
        .toLowerCase();
      if (
        _0x362b03 === 'complete' ||
        _0x362b03 === 'completed' ||
        _0x362b03 === 'done' ||
        _0x362b03 === 'error' ||
        _0x362b03 === 'finish' ||
        _0x362b03 === 'finished' ||
        _0x362b03 === 'success' ||
        _0x362b03 === 'succeeded' ||
        _0x362b03 === 'failed' ||
        _0x362b03 === 'fail' ||
        _0x362b03 === 'idle' ||
        _0x362b03 === 'cancelled' ||
        _0x362b03 === 'canceled'
      )
        return false;
      return true;
    }
    ['_isDreaminaRecoverableRunningTask'](_0x493b54 = this._data) {
      if (!this._isDreaminaImageNode(_0x493b54)) return false;
      const _0x14ea07 = String(_0x493b54?.dreaminaSubmitId || '').trim();
      if (!_0x14ea07) return false;
      const _0x74fda5 = normalizeTaskStatus(_0x493b54?.jobStatus),
        _0x3c80ba = normalizeTaskStatus(_0x493b54?.dreaminaTaskPhase),
        _0x44e2a3 = normalizeTaskStatus(_0x493b54?.dreaminaTaskStatus);
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(_0x74fda5)) return false;
      if (DREAMINA_NON_RECOVERABLE_PHASES.has(_0x3c80ba)) return false;
      if (DREAMINA_NON_RECOVERABLE_STATUSES.has(_0x44e2a3)) return false;
      return true;
    }
    ['_isStaleActiveDreaminaTask'](_0x1dfeda = this._data) {
      if (!this._isGenerating) return false;
      if (_0x1dfeda?.dreaminaTaskRecovering === true) return false;
      if (this._dreaminaResumePromise) return false;
      const _0x343c97 = Number(
        _0x1dfeda?.dreaminaTaskLastCheckedAt ||
          _0x1dfeda?.dreaminaTaskStartedAt ||
          _0x1dfeda?.generationStartTime ||
          0,
      );
      if (!Number.isFinite(_0x343c97) || _0x343c97 <= 0) return false;
      return Date.now() - _0x343c97 >= DREAMINA_STALE_ACTIVE_RESUME_MS;
    }
    ['_isAsyncRecoverableRunningTask'](_0x501e70 = this._data) {
      const _0x9a74cd = String(_0x501e70?.asyncTaskId || '').trim();
      if (!_0x9a74cd) return false;
      const _0x4e79fa = this._inferProviderFromModel(
        _0x501e70?.model,
        _0x501e70?.asyncTaskProvider || _0x501e70?.provider || '',
      );
      if (
        !_0x4e79fa ||
        _0x4e79fa === 'runninghubwf' ||
        _0x4e79fa === 'runninghub' ||
        _0x4e79fa === 'dreamina'
      )
        return false;
      const _0x34fbac = String(_0x501e70?.asyncTaskKind || '')
        .trim()
        .toLowerCase();
      if (_0x34fbac && _0x34fbac !== 'image') return false;
      const _0x36f7b8 = String(_0x501e70?.asyncTaskStatus || '')
        .trim()
        .toLowerCase();
      if (
        _0x36f7b8 === 'success' ||
        _0x36f7b8 === 'failed' ||
        _0x36f7b8 === 'idle' ||
        _0x36f7b8 === 'cancelled'
      )
        return false;
      return true;
    }
    ['_hasImageGenerationResult'](_0x5adf85 = this._data) {
      const _0x19dcdc = Array.isArray(_0x5adf85?.images) ? _0x5adf85.images : [],
        _0x3c01f2 = _0x19dcdc.some((_0x3c50f7) => {
          if (!_0x3c50f7 || typeof _0x3c50f7 !== 'object') return false;
          if (String(_0x3c50f7?.error || '').trim()) return false;
          return !!String(
            _0x3c50f7?.localPath || _0x3c50f7?.imageUrl || _0x3c50f7?.sourceUrl || _0x3c50f7?.thumbUrl || '',
          ).trim();
        });
      if (_0x3c01f2) return true;
      return !!String(
        _0x5adf85?.localPath || _0x5adf85?.imageUrl || _0x5adf85?.sourceUrl || _0x5adf85?.thumbUrl || '',
      ).trim();
    }
    ['_shouldFallbackRegenerateAsyncTask'](_0x26fe5d = this._data) {
      const _0x4efc83 = String(_0x26fe5d?.asyncTaskId || '').trim();
      if (_0x4efc83) return false;
      const _0x2f0a18 = this._inferProviderFromModel(
        _0x26fe5d?.model,
        _0x26fe5d?.asyncTaskProvider || _0x26fe5d?.provider || '',
      );
      if (!['ppio', 'apimart'].includes(_0x2f0a18)) return false;
      const _0x16a1b3 = String(_0x26fe5d?.asyncTaskStatus || '')
          .trim()
          .toLowerCase(),
        _0x389b9b = [
          'submitted',
          'pending',
          'queued',
          'waiting',
          'running',
          'processing',
          'querying',
          'in_progress',
        ].includes(_0x16a1b3);
      if (!_0x389b9b) return false;
      if (this._hasImageGenerationResult(_0x26fe5d)) return false;
      if (_0x26fe5d?.generationDuration != null) return false;
      return true;
    }
    async ['_maybeFallbackRegenerateAsyncTask'](_0x3c6d46 = this._data) {
      if (!this._shouldFallbackRegenerateAsyncTask(_0x3c6d46)) return false;
      if (this._asyncFallbackRegeneratePromise) return true;
      if (this._isGenerating) return true;
      const _0x294e49 = (async () => {
        const _0x5c1e24 = _0xff470c.getState().nodes?.[this.nodeId] || _0x3c6d46 || {},
          _0x41d5fe =
            Number(_0x5c1e24?.generationStartTime || 0) > 0
              ? Number(_0x5c1e24.generationStartTime)
              : Date.now();
        (_0xff470c.updateNodeData(
          this.nodeId,
          this._buildAsyncTaskPatch({
            provider: this._inferProviderFromModel(
              _0x5c1e24?.model,
              _0x5c1e24?.asyncTaskProvider || _0x5c1e24?.provider || '',
            ),
            kind: 'image',
            taskId: '',
            status: 'pending',
            startedAt: _0x41d5fe,
            recovering: true,
          }),
        ),
          this._persistAsyncResumeCache(),
          await this._onGenerate());
      })();
      return (
        (this._asyncFallbackRegeneratePromise = _0x294e49.finally(() => {
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
      const _0x57d2d8 = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {},
        _0xa256ec =
          String(error?.message || error || t('aigenImage.task.generationFailed')).trim() ||
          t('aigenImage.task.generationFailed'),
        _0x1a1533 = String(submitId || '').trim() || String(_0x57d2d8?.dreaminaSubmitId || '').trim(),
        _0x59b9fb =
          Number(startedAt) > 0
            ? Number(startedAt)
            : Number(_0x57d2d8?.dreaminaTaskStartedAt || _0x57d2d8?.generationStartTime || Date.now());
      return {
        ...buildImageGenerationFailurePatch({ error: _0xa256ec, startedAt: _0x59b9fb }),
        ...this._buildDreaminaTaskPatch({
          submitId: _0x1a1533,
          status: 'failed',
          phase: 'failed',
          label: _0xa256ec,
          startedAt: _0x59b9fb,
          lastCheckedAt: Number(lastCheckedAt || Date.now()),
          recovering: false,
          raw: raw,
        }),
      };
    }
    ['_finalizeDreaminaImageFailure'](_0x245bb5 = {}) {
      const _0x348b80 = this._buildDreaminaFailurePatch(_0x245bb5);
      return (
        _0xff470c.updateNodeData(this.nodeId, _0x348b80),
        this._persistDreaminaResumeCache(),
        (this._isGenerating = false),
        (this._dreaminaActiveSubmitId = ''),
        this.btnEl && resetGenerateButtonIdleUi(this.btnEl),
        _0x32cd7a(this.previewEl),
        this._updateSubmitButtonState?.(),
        _0x348b80
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
      const _0x1dae70 = String(status || 'pending').trim() || 'pending',
        _0x143e5d = String(taskId || '').trim();
      let _0xd31a2c = String(provider || '')
        .trim()
        .toLowerCase();
      return (
        !_0xd31a2c &&
          (_0x143e5d || _0x1dae70 !== 'idle') &&
          (_0xd31a2c = this._inferProviderFromModel(this._data?.model || '', '')),
        {
          asyncTaskProvider: _0xd31a2c,
          asyncTaskKind: String(kind || 'image').trim() || 'image',
          asyncTaskId: _0x143e5d,
          asyncTaskStatus: _0x1dae70,
          asyncTaskStartedAt: Number(startedAt || 0),
          asyncTaskRecovering: recovering === true,
        }
      );
    }
    ['_syncLocalTaskNodeData']() {
      const _0x4e6c61 = _0xff470c.getState().nodes?.[this.nodeId];
      if (_0x4e6c61) this._data = _0x4e6c61;
      return this._data || {};
    }
    ['_applyDreaminaTaskPatch'](_0x19ebac = {}, _0x53336a = {}) {
      const _0x35a440 = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {},
        _0x37c518 = {
          generationStartTime:
            Number(_0x35a440?.generationStartTime) > 0
              ? Number(_0x35a440.generationStartTime)
              : Number(_0x19ebac?.startedAt || Date.now()),
          generationDuration: null,
          ...this._buildDreaminaTaskPatch(_0x19ebac),
          ..._0x53336a,
        };
      return (
        _0xff470c.updateNodeData(this.nodeId, _0x37c518),
        this._syncLocalTaskNodeData(),
        this._persistDreaminaResumeCache(),
        _0x37c518
      );
    }
    ['_stopRunningHubRecovery'](_0x4cc125 = false) {
      this._rhResumeAbortController &&
        !this._rhResumeAbortController.signal.aborted &&
        this._rhResumeAbortController.abort();
      ((this._rhResumeAbortController = null), (this._rhResumeTaskId = ''), (this._rhResumePromise = null));
      if (_0x4cc125) {
        const _0x107a58 = _0xff470c.getState().nodes?.[this.nodeId];
        _0x107a58?.rhTaskRecovering &&
          (_0xff470c.updateNodeData(this.nodeId, { rhTaskRecovering: false }),
          this._persistRunningHubResumeCache());
      }
    }
    ['_stopDreaminaRecovery'](_0x1f5a40 = false) {
      this._dreaminaResumeAbortController &&
        !this._dreaminaResumeAbortController.signal.aborted &&
        this._dreaminaResumeAbortController.abort();
      ((this._dreaminaResumeAbortController = null),
        (this._dreaminaResumeSubmitId = ''),
        (this._dreaminaResumePromise = null));
      if (_0x1f5a40) {
        const _0x4ed217 = _0xff470c.getState().nodes?.[this.nodeId];
        _0x4ed217?.dreaminaTaskRecovering &&
          (_0xff470c.updateNodeData(this.nodeId, { dreaminaTaskRecovering: false }),
          this._persistDreaminaResumeCache());
      }
    }
    ['_stopAsyncRecovery'](_0x545cde = false) {
      this._asyncResumeAbortController &&
        !this._asyncResumeAbortController.signal.aborted &&
        this._asyncResumeAbortController.abort();
      ((this._asyncResumeAbortController = null),
        (this._asyncResumeTaskId = ''),
        (this._asyncResumePromise = null));
      if (_0x545cde) {
        const _0x49c25d = _0xff470c.getState().nodes?.[this.nodeId];
        _0x49c25d?.asyncTaskRecovering &&
          (_0xff470c.updateNodeData(this.nodeId, { asyncTaskRecovering: false }),
          this._persistAsyncResumeCache());
      }
    }
    ['_applyImageGenerationResult'](_0xd35d71, _0x21a49a, { writeStore: writeStore = true } = {}) {
      const _0x2daac7 = normalizeImageGenerationResult(_0xd35d71),
        _0x1f23b5 = buildImageGenerationResultPatch(_0x2daac7, { startedAt: _0x21a49a });
      if (!_0x1f23b5) return null;
      return (
        writeStore && _0xff470c.updateNodeData(this.nodeId, _0x1f23b5),
        this._dispatchGenerationHistoryAssets(getSuccessfulImageGenerationItems(_0x2daac7), _0x21a49a),
        { patch: _0x1f23b5, normalizedResult: _0x2daac7, items: getSuccessfulImageGenerationItems(_0x2daac7) }
      );
    }
    ['_dispatchGenerationHistoryAssets'](_0x54ffbc, _0x5b362e) {
      if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
      const _0x59eef5 = Array.isArray(_0x54ffbc)
        ? _0x54ffbc.filter((_0x390b1a) => _0x390b1a && typeof _0x390b1a === 'object' && !_0x390b1a.error)
        : [];
      if (_0x59eef5.length === 0) return;
      const _0x331694 = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {};
      try {
        window.dispatchEvent(
          new CustomEvent(GENERATION_HISTORY_EVENT, {
            detail: {
              kind: 'image',
              sourceNodeId: this.nodeId,
              nodeData: _0x331694,
              images: _0x59eef5,
              startedAt: _0x5b362e,
              createdAt: Date.now(),
            },
          }),
        );
      } catch {}
    }
    ['_getImageGenerationResultError'](_0x223dda) {
      return getImageGenerationResultError(_0x223dda);
    }
    async ['_buildResumePayload'](_0x1e8858 = this._data, _0x743a0a = {}) {
      const _0x22119e = _0x1e8858 || {};
      let _0x2827a4 = String(
        normalizeDreaminaImageModel(_0x22119e?.model, _0x22119e?.provider) || _0x22119e?.model || '',
      ).trim();
      const _0x40d321 =
          _0x22119e.generationParams &&
          typeof _0x22119e.generationParams === 'object' &&
          !Array.isArray(_0x22119e.generationParams)
            ? _0x22119e.generationParams
            : {},
        _0x63116a = getModelManifest(_0x2827a4);
      if (!_0x63116a) throw new Error('Missing model manifest: ' + _0x2827a4);
      const _0x56c658 = sanitizeTaskGenerationParams(_0x2827a4, _0x40d321),
        _0x42f873 = _0x63116a.adapterType === 'modelApi',
        _0x1363c9 = Array.isArray(_0x63116a?.uiSchema?.fields) ? _0x63116a.uiSchema.fields : [],
        {
          getManifestField: _0x2d946b,
          readSchemaParam: _0x456baf,
          requireSchemaParam: _0x6e1d45,
        } = createSchemaParamAccess({
          model: _0x2827a4,
          data: this._data,
          generationParams: _0x56c658,
          manifestFields: _0x1363c9,
        }),
        _0x3ca544 = _0x2d946b('imageSize') ? _0x6e1d45('imageSize') : undefined,
        _0x5d8b69 = _0x42f873 ? _0x456baf('mode') : undefined,
        _0x272c4c = resolveNanoBananaSelectionFromModel(_0x2827a4, _0x3ca544 || '2K', _0x22119e?.provider);
      if (_0x272c4c) {
        if (!_0x42f873 && _0x5d8b69 !== undefined)
          _0x2827a4 = resolveNanoBananaModelBySelection({
            family: _0x272c4c.family,
            mode: _0x5d8b69,
            imageSize: _0x3ca544 || '2K',
            provider: _0x272c4c.provider || _0x22119e?.provider,
          });
        else !_0x42f873 && (_0x2827a4 = _0x272c4c.model);
      }
      const _0x539194 = String(_0x743a0a?.providerHint || _0x22119e?.provider || '')
        .trim()
        .toLowerCase();
      isDreaminaImageModel(_0x2827a4, _0x539194) &&
        (_0x2827a4 =
          normalizeDreaminaImageModel(_0x2827a4, _0x539194) || _0x2827a4 || getDefaultDreaminaImageModelId());
      const _0xb0368c = this._inferProviderFromModel(_0x2827a4, _0x539194),
        _0x3eb7c0 = resolveImageSizeForProviderModel({
          provider: _0xb0368c,
          model: _0x2827a4,
          imageSize: _0x3ca544,
        });
      !getModelManifest(_0x2827a4) &&
        (_0x2827a4 = resolveGrsaiGptImage2ModelForSize({
          provider: _0xb0368c,
          model: _0x2827a4,
          imageSize: _0x3eb7c0,
        }));
      await _0x14e2fd();
      const _0x1a4108 = _0x28ad2b(_0xb0368c) || {};
      let _0x44d879 = '';
      if (_0xb0368c === 'runninghub')
        _0x44d879 = isModelApiModel(_0x2827a4, _0xb0368c)
          ? _0x1a4108.modelApiKey || ''
          : _0x1a4108.apiKey || '';
      else
        _0xb0368c === 'runninghubwf'
          ? (_0x44d879 = _0x1a4108.apiKey || '')
          : (_0x44d879 = _0x1a4108.apiKey || window._appApiKey || '');
      return { nodeId: this.nodeId, model: _0x2827a4, provider: _0xb0368c, apiKey: _0x44d879 };
    }
    async ['_maybeResumeRunningHubTaskImpl']() {
      const _0x1792ae = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {};
      if (this._isGenerating && _0x1792ae?.rhTaskRecovering !== true) return;
      if (!this._isRunninghubTaskModel(_0x1792ae?.model, _0x1792ae?.provider)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (!this._isRunningHubRecoverableRunningTask(_0x1792ae)) {
        this._stopRunningHubRecovery(false);
        return;
      }
      const _0x241e78 = String(_0x1792ae?.rhTaskId || '').trim();
      if (!_0x241e78) {
        this._stopRunningHubRecovery(false);
        return;
      }
      if (this._rhResumeTaskId === _0x241e78 && this._rhResumePromise) return;
      this._stopRunningHubRecovery(false);
      const _0x510c4c = Number(_0x1792ae?.rhTaskStartedAt || _0x1792ae?.generationStartTime || Date.now()),
        _0xa36fcc =
          _0x1792ae?.rhTaskUseOpenapiQuery === true ||
          isModelApiModel(_0x1792ae?.model, _0x1792ae?.provider || 'runninghub');
      this._rhResumeTaskId = _0x241e78;
      const _0x3ff114 = (async () => {
        let _0x588327 = null;
        const _0x2738bf = this._isRunninghubWorkflowModel(_0x1792ae?.model, _0x1792ae?.provider),
          _0x49de3d = shouldUseImageWorkflowBusyButton(_0x1792ae?.model);
        try {
          const _0x2d449f = await this._buildResumePayload(_0x1792ae);
          if (!_0x2d449f) return;
          ((_0x588327 = new AbortController()),
            (this._rhResumeAbortController = _0x588327),
            (this._rhTaskId = _0x241e78),
            (this._rhApiKey = String(_0x2d449f?.apiKey || '').trim() || this._rhApiKey || null),
            (this._rhCancelRequested = false),
            (this._isGenerating = true));
          this.btnEl &&
            (_0x2738bf
              ? setGenerateButtonCancellableUi(this.btnEl, { busy: _0x49de3d })
              : setGenerateButtonLoadingUi(this.btnEl));
          _0x27a9f5(this.previewEl);
          const _0x367978 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'image-generation',
              provider: _0x2d449f.provider || _0x1792ae?.provider || 'runninghubwf',
              adapterType: 'workflow',
              modelId: _0x2d449f.model || _0x1792ae?.model || '',
              executionId: 'runninghub.image.' + (_0x2d449f.model || _0x1792ae?.model || 'workflow'),
              payload: _0x2d449f,
              taskId: _0x241e78,
              cancellable: _0x2738bf,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () => ({
                rhStatusMessage: null,
                rhStatusCode: null,
                rhTaskUseOpenapiQuery: _0xa36fcc,
              }),
              onTaskStart: () => {
                this._persistRunningHubResumeCache();
              },
              poll: async () =>
                _0xfcf4f2.resumeRunningHubImageTask(_0x241e78, _0x2d449f, {
                  signal: _0x588327.signal,
                  useOpenapiQuery: _0xa36fcc,
                }),
              resultBuilder: async (_0x3f61b8, _0x1ce04e) => {
                const _0x2e3516 = this._getImageGenerationResultError(_0x3f61b8);
                if (_0x2e3516) throw new Error(_0x2e3516);
                const _0x2ccb18 = this._applyImageGenerationResult(_0x3f61b8, _0x1ce04e.startedAt, {
                  writeStore: false,
                });
                return {
                  ...(_0x2ccb18?.patch || {}),
                  ...this._buildRunningHubTaskPatch({
                    taskId: _0x241e78,
                    status: 'success',
                    startedAt: _0x1ce04e.startedAt,
                    recovering: false,
                    useOpenapiQuery: _0xa36fcc,
                  }),
                };
              },
              failureBuilder: (_0x4d0965, _0x587e81) => ({
                ...buildImageGenerationFailurePatch({
                  error: _0x4d0965?.message || t('aigenImage.task.generationFailed'),
                  startedAt: _0x587e81.startedAt,
                }),
                rhStatusMessage: _0x4d0965?.message || t('aigenImage.task.generationFailed'),
                rhStatusCode: Number.isFinite(Number(_0x4d0965?.code)) ? Number(_0x4d0965.code) : null,
                ...this._buildRunningHubTaskPatch({
                  taskId: _0x241e78,
                  status: 'failed',
                  startedAt: _0x587e81.startedAt,
                  recovering: false,
                  useOpenapiQuery: _0xa36fcc,
                }),
              }),
              cancelledBuilder: (_0x277d2e) => {
                const _0x3593bb = _0xff470c.getState().nodes?.[this.nodeId] || {},
                  _0x460a48 =
                    _0x3593bb.generationDuration == null
                      ? Date.now() - _0x277d2e.startedAt
                      : _0x3593bb.generationDuration;
                return this._buildRunningHubCancelResultPatch({
                  latest: _0x3593bb,
                  message: _0x3593bb.rhStatusMessage || t('aigenImage.task.interrupted'),
                  code: _0x3593bb.rhStatusCode,
                  duration: _0x460a48,
                  taskId: _0x241e78,
                });
              },
              parseError: (_0x6bca96) => _0x6bca96?.message || t('aigenImage.task.generationFailed'),
            },
            { store: _0xff470c, startedAt: _0x510c4c, abortController: _0x588327 },
          );
          if (_0x367978.status === 'pending') {
            this._persistRunningHubResumeCache();
            return;
          }
          this._persistRunningHubResumeCache();
        } catch (_0x5c347f) {
          if (
            _0x588327?.signal?.aborted ||
            _0x5c347f?.message === 'CANCELLED' ||
            _0x5c347f?.name === 'AbortError'
          )
            return;
          (_0xff470c.updateNodeData(this.nodeId, {
            generationDuration: Math.max(0, Date.now() - _0x510c4c),
            rhStatusMessage: _0x5c347f?.message || t('aigenImage.task.generationFailed'),
            rhStatusCode: Number.isFinite(Number(_0x5c347f?.code)) ? Number(_0x5c347f.code) : null,
            ...this._buildRunningHubTaskPatch({
              taskId: _0x241e78,
              status: 'failed',
              startedAt: _0x510c4c,
              recovering: false,
              useOpenapiQuery: _0xa36fcc,
            }),
          }),
            this._persistRunningHubResumeCache());
        } finally {
          _0x588327 && this._rhResumeAbortController === _0x588327 && (this._rhResumeAbortController = null);
          this._rhResumeTaskId === _0x241e78 && (this._rhResumeTaskId = '');
          this._rhResumePromise = null;
          const _0xed635e = this._syncLocalTaskNodeData(),
            _0x4c74ce = shouldShowGenerationBusyUi(_0xed635e);
          this._isGenerating = _0x4c74ce;
          if (_0x4c74ce) this._rhTaskId = String(_0xed635e?.rhTaskId || _0x241e78 || '').trim();
          else {
            this._rhTaskId = null;
            if (!this._rhCancelRequested) this._rhApiKey = null;
            (this.btnEl && resetGenerateButtonIdleUi(this.btnEl), _0x32cd7a(this.previewEl));
          }
          this._updateSubmitButtonState();
        }
      })();
      this._rhResumePromise = _0x3ff114;
    }
    async ['_maybeResumeDreaminaTaskImpl']() {
      const _0x42cb24 = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {},
        _0x464266 = String(_0x42cb24?.dreaminaSubmitId || '').trim(),
        _0xcc5f51 = String(this._dreaminaActiveSubmitId || '').trim();
      if (
        this._isGenerating &&
        _0x42cb24?.dreaminaTaskRecovering !== true &&
        _0xcc5f51 &&
        _0xcc5f51 === _0x464266 &&
        !this._isStaleActiveDreaminaTask(_0x42cb24)
      )
        return;
      if (!this._isDreaminaImageNode(_0x42cb24)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (!this._isDreaminaRecoverableRunningTask(_0x42cb24)) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (!_0x464266) {
        this._stopDreaminaRecovery(false);
        return;
      }
      if (this._dreaminaResumeSubmitId === _0x464266) return;
      this._stopDreaminaRecovery(false);
      const _0x1a1e1e = Number(
        _0x42cb24?.dreaminaTaskStartedAt || _0x42cb24?.generationStartTime || Date.now(),
      );
      this._dreaminaResumeSubmitId = _0x464266;
      const _0x500c94 = (async () => {
        let _0x252fdc = null;
        try {
          const _0x2837d1 = await this._buildResumePayload(_0x42cb24);
          if (!_0x2837d1) return;
          ((_0x252fdc = new AbortController()),
            (this._dreaminaResumeAbortController = _0x252fdc),
            (this._isGenerating = true));
          this.btnEl && setGenerateButtonLoadingUi(this.btnEl);
          _0x27a9f5(this.previewEl);
          const _0x3f0bbd = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'image-generation',
              provider: 'dreamina',
              adapterType: 'localRuntime',
              modelId: _0x2837d1.model || _0x42cb24?.model || '',
              executionId: 'dreamina.image.' + (_0x2837d1.model || _0x42cb24?.model || 'cli'),
              payload: _0x2837d1,
              taskId: _0x464266,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this._buildDreaminaTaskPatch({
                  submitId: _0x464266,
                  status: 'pending',
                  phase: 'generating',
                  label: String(_0x42cb24?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: _0x1a1e1e,
                  lastCheckedAt: Date.now(),
                  recovering: true,
                  raw: _0x42cb24?.dreaminaTaskLastRaw || {},
                }),
              onTaskStart: () => {
                this._persistDreaminaResumeCache();
              },
              pauseBuilder: (_0x15940c) =>
                this._buildDreaminaTaskPatch({
                  submitId: _0x464266,
                  status: String(_0x42cb24?.dreaminaTaskStatus || '').trim() || 'pending',
                  phase: String(_0x42cb24?.dreaminaTaskPhase || '').trim() || 'generating',
                  label: String(_0x42cb24?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: _0x15940c.startedAt,
                  lastCheckedAt: Date.now(),
                  recovering: false,
                  raw: _0x42cb24?.dreaminaTaskLastRaw || {},
                }),
              poll: async () =>
                _0xfcf4f2.resumeDreaminaImageTask(_0x464266, _0x2837d1, { signal: _0x252fdc.signal }),
              resultBuilder: async (_0x17839a, _0x4669d2) => {
                const _0x4e2f98 = this._getImageGenerationResultError(_0x17839a);
                if (_0x4e2f98) throw new Error(_0x4e2f98);
                const _0x177748 = this._applyImageGenerationResult(_0x17839a, _0x4669d2.startedAt, {
                  writeStore: false,
                });
                return {
                  ...(_0x177748?.patch || {}),
                  ...this._buildDreaminaTaskPatch({
                    submitId: _0x464266,
                    status: 'success',
                    phase: 'done',
                    label: t('aigenImage.task.completed'),
                    startedAt: _0x4669d2.startedAt,
                    lastCheckedAt: Date.now(),
                    recovering: false,
                    raw: {},
                  }),
                };
              },
              failureBuilder: (_0x57f02c, _0x1b4a5e) =>
                this._buildDreaminaFailurePatch({
                  error: _0x57f02c,
                  startedAt: _0x1b4a5e.startedAt,
                  submitId: _0x464266,
                  lastCheckedAt: Date.now(),
                  raw: {},
                }),
              cancelledBuilder: (_0xc46972) => ({
                generationDuration: Date.now() - _0xc46972.startedAt,
                ...this._buildDreaminaTaskPatch({
                  submitId: _0x464266,
                  status: 'pending',
                  phase: 'generating',
                  label: String(_0x42cb24?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: _0xc46972.startedAt,
                  lastCheckedAt: Date.now(),
                  recovering: false,
                  raw: _0x42cb24?.dreaminaTaskLastRaw || {},
                }),
              }),
              parseError: (_0x58fdc8) => _0x58fdc8?.message || t('aigenImage.task.generationFailed'),
            },
            { store: _0xff470c, startedAt: _0x1a1e1e, abortController: _0x252fdc },
          );
          if (_0x3f0bbd.status === 'pending') {
            this._persistDreaminaResumeCache();
            return;
          }
          (_0x3f0bbd.status === 'failed' && (this._dreaminaActiveSubmitId = ''),
            this._persistDreaminaResumeCache());
        } catch (_0x146213) {
          if (
            _0x252fdc?.signal?.aborted ||
            _0x146213?.message === 'CANCELLED' ||
            _0x146213?.name === 'AbortError'
          )
            return;
          this._finalizeDreaminaImageFailure({
            error: _0x146213,
            startedAt: _0x1a1e1e,
            submitId: _0x464266,
            lastCheckedAt: Date.now(),
            raw: {},
          });
        } finally {
          _0x252fdc &&
            this._dreaminaResumeAbortController === _0x252fdc &&
            (this._dreaminaResumeAbortController = null);
          this._dreaminaResumeSubmitId === _0x464266 && (this._dreaminaResumeSubmitId = '');
          this._dreaminaResumePromise = null;
          const _0x2ede4c = this._syncLocalTaskNodeData(),
            _0x508727 = shouldShowGenerationBusyUi(_0x2ede4c);
          ((this._isGenerating = _0x508727),
            !_0x508727 && (this.btnEl && resetGenerateButtonIdleUi(this.btnEl), _0x32cd7a(this.previewEl)),
            this._updateSubmitButtonState());
        }
      })();
      this._dreaminaResumePromise = _0x500c94;
    }
    async ['_maybeResumeAsyncTaskImpl']() {
      const _0xe418fa = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {};
      if (this._isGenerating && _0xe418fa?.asyncTaskRecovering !== true) return;
      if (!this._isAsyncRecoverableRunningTask(_0xe418fa)) {
        const _0x48968b = await this._maybeFallbackRegenerateAsyncTask(_0xe418fa);
        if (_0x48968b) return;
        this._stopAsyncRecovery(false);
        return;
      }
      const _0xf09c0e = String(_0xe418fa?.asyncTaskId || '').trim();
      if (!_0xf09c0e) {
        const _0x2c275a = await this._maybeFallbackRegenerateAsyncTask(_0xe418fa);
        if (_0x2c275a) return;
        this._stopAsyncRecovery(false);
        return;
      }
      if (this._asyncResumeTaskId === _0xf09c0e && this._asyncResumePromise) return;
      this._stopAsyncRecovery(false);
      const _0x421deb = Number(_0xe418fa?.asyncTaskStartedAt || _0xe418fa?.generationStartTime || Date.now()),
        _0x312923 = this._inferProviderFromModel(
          _0xe418fa?.model,
          _0xe418fa?.asyncTaskProvider || _0xe418fa?.provider || '',
        );
      this._asyncResumeTaskId = _0xf09c0e;
      const _0x2f48ec = (async () => {
        let _0x262d16 = null;
        try {
          const _0x15c66d = await this._buildResumePayload(_0xe418fa, { providerHint: _0x312923 });
          if (!_0x15c66d) return;
          ((_0x262d16 = new AbortController()),
            (this._asyncResumeAbortController = _0x262d16),
            (this._isGenerating = true));
          this.btnEl && setGenerateButtonLoadingUi(this.btnEl);
          _0x27a9f5(this.previewEl);
          const _0x1578c6 = await resumeTask(
            {
              sourceNodeId: this.nodeId,
              targetNodeId: this.nodeId,
              trigger: 'node',
              taskType: 'image-generation',
              provider: _0x312923 || _0x15c66d.provider || _0xe418fa?.provider || '',
              adapterType: 'modelApi',
              modelId: _0x15c66d.model || _0xe418fa?.model || '',
              executionId: (_0x312923 || _0x15c66d.provider || 'model') + '.image.async',
              payload: _0x15c66d,
              taskId: _0xf09c0e,
              async: true,
              cancellable: false,
              resumable: true,
              pauseOnAbort: true,
              startBuilder: () =>
                this._buildAsyncTaskPatch({
                  provider: _0x312923,
                  kind: 'image',
                  taskId: _0xf09c0e,
                  status: 'running',
                  startedAt: _0x421deb,
                  recovering: true,
                }),
              onTaskStart: () => {
                this._persistAsyncResumeCache();
              },
              poll: async () =>
                _0xfcf4f2.resumeAsyncImageTask(_0xf09c0e, _0x15c66d, { signal: _0x262d16.signal }),
              resultBuilder: async (_0x1362f8, _0x1a760d) => {
                const _0x316b40 = this._getImageGenerationResultError(_0x1362f8);
                if (_0x316b40) throw new Error(_0x316b40);
                const _0x51937c = this._applyImageGenerationResult(_0x1362f8, _0x1a760d.startedAt, {
                  writeStore: false,
                });
                return {
                  ...(_0x51937c?.patch || {}),
                  ...this._buildAsyncTaskPatch({
                    provider: _0x312923,
                    kind: 'image',
                    taskId: _0xf09c0e,
                    status: 'success',
                    startedAt: _0x1a760d.startedAt,
                    recovering: false,
                  }),
                };
              },
              failureBuilder: (_0x4f1fa4, _0x162822) => ({
                ...buildImageGenerationFailurePatch({
                  error: _0x4f1fa4?.message || t('aigenImage.task.generationFailed'),
                  startedAt: _0x162822.startedAt,
                }),
                ...this._buildAsyncTaskPatch({
                  provider: _0x312923,
                  kind: 'image',
                  taskId: _0xf09c0e,
                  status: 'failed',
                  startedAt: _0x162822.startedAt,
                  recovering: false,
                }),
              }),
              cancelledBuilder: (_0x46b798) => ({
                images: [],
                imageUrl: '',
                src: '',
                localPath: '',
                generationDuration: Date.now() - _0x46b798.startedAt,
                ...this._buildAsyncTaskPatch({
                  provider: _0x312923,
                  kind: 'image',
                  taskId: _0xf09c0e,
                  status: 'cancelled',
                  startedAt: _0x46b798.startedAt,
                  recovering: false,
                }),
              }),
              parseError: (_0x67126e) => _0x67126e?.message || t('aigenImage.task.generationFailed'),
            },
            { store: _0xff470c, startedAt: _0x421deb, abortController: _0x262d16 },
          );
          if (_0x1578c6.status === 'pending') {
            this._persistAsyncResumeCache();
            return;
          }
          this._persistAsyncResumeCache();
        } catch (_0x2c554e) {
          if (
            _0x262d16?.signal?.aborted ||
            _0x2c554e?.message === 'CANCELLED' ||
            _0x2c554e?.name === 'AbortError'
          )
            return;
          (_0xff470c.updateNodeData(this.nodeId, {
            generationDuration: Math.max(0, Date.now() - _0x421deb),
            ...this._buildAsyncTaskPatch({
              provider: _0x312923,
              kind: 'image',
              taskId: _0xf09c0e,
              status: 'failed',
              startedAt: _0x421deb,
              recovering: false,
            }),
          }),
            this._persistAsyncResumeCache());
        } finally {
          _0x262d16 &&
            this._asyncResumeAbortController === _0x262d16 &&
            (this._asyncResumeAbortController = null);
          this._asyncResumeTaskId === _0xf09c0e && (this._asyncResumeTaskId = '');
          this._asyncResumePromise = null;
          const _0x35d506 = this._syncLocalTaskNodeData(),
            _0xacb146 = shouldShowGenerationBusyUi(_0x35d506);
          ((this._isGenerating = _0xacb146),
            !_0xacb146 && (this.btnEl && resetGenerateButtonIdleUi(this.btnEl), _0x32cd7a(this.previewEl)),
            this._updateSubmitButtonState());
        }
      })();
      this._asyncResumePromise = _0x2f48ec;
    }
    async ['_buildPayload'](_0x2e526d = null) {
      const _0x606f8e = _0xff470c.getState(),
        _0x52c3bb = _0xff470c.getIncomingEdges(this.nodeId),
        _0x373fbd = _0x606f8e.nodes || {},
        _0x153dac = getTargetInputPolicy(_0x373fbd?.[this.nodeId] || this._data || {}),
        _0x180729 = getFixedInputSlotConfigFromManifest(_0x373fbd?.[this.nodeId] || this._data || {}),
        _0x4de6a6 = getImageNodeInputGate(this._data?.model),
        _0x19bdf9 = String(_0x4de6a6.kind || '').trim(),
        _0x5c5c05 = Number(_0x4de6a6.max),
        _0x8313a7 = isRhPersonReplaceWorkflowModel(this._data?.model),
        _0x14423c = isRhQwenImageEditModel(this._data?.model),
        _0x14678c = getModelManifest(this._data?.model)?.inputSlots,
        _0x2628f7 = Math.max(0, Number(_0x14678c?.maxByKind?.image) || 0),
        _0x3f64a0 = _0x2628f7 || 3,
        _0x47eda0 = getImageInputGateUploadedUrl(this._data, _0x4de6a6),
        _0x182597 = { text: [], image: [], video: [], audio: [] },
        _0x1db25a = { text: 0, image: 0, video: 0, audio: 0 },
        _0x2d3a26 = new Map();
      for (const _0x59c89e of _0x52c3bb) {
        const _0xd62e2 = _0x373fbd[_0x59c89e.sourceId];
        if (!_0xd62e2) continue;
        const _0x107fa5 = resolveEffectiveInputKind(_0xd62e2, _0x59c89e);
        if (!_0x107fa5) continue;
        if (!isInputKindAllowed(_0x153dac, _0x107fa5)) continue;
        if (_0x19bdf9 && _0x107fa5 !== _0x19bdf9) continue;
        if (_0x19bdf9 && Number.isFinite(_0x5c5c05) && _0x1db25a[_0x19bdf9] >= _0x5c5c05) continue;
        if (_0x8313a7 && _0x107fa5 !== 'image') continue;
        if (_0x8313a7 && _0x1db25a.image >= 2) continue;
        if (_0x14423c && _0x107fa5 !== 'image') continue;
        if (_0x14423c && _0x1db25a.image >= _0x3f64a0) continue;
        let _0x16f625 = '',
          _0x493102 = '';
        if (_0x107fa5 === 'text') {
          _0x16f625 = (
            _0xd62e2.outputText ||
            _0xd62e2.text ||
            _0xd62e2.content ||
            _0xd62e2.prompt ||
            _0xd62e2.label ||
            ''
          ).trim();
          if (!_0x16f625) continue;
        } else {
          _0x107fa5 === 'image' && (_0x493102 = resolveGenerationInputImageUrl(_0xd62e2));
          if (!_0x493102 && _0xd62e2.sourceId) {
            const _0x5dee0e = await _0xeea044(_0xd62e2.sourceId);
            if (_0x5dee0e) _0x493102 = URL.createObjectURL(_0x5dee0e);
          }
          if (!_0x493102) _0x493102 = _0xd62e2.src || _0xd62e2.imageUrl || _0xd62e2.thumbUrl || '';
          if (!_0x493102) continue;
        }
        _0x1db25a[_0x107fa5]++;
        const _0x2296fb = buildReferenceLabelAliases(_0x107fa5, _0x1db25a[_0x107fa5]),
          _0x3a7712 = _0x2296fb[0],
          _0x58683e = _0x107fa5 === 'image' ? String(_0xd62e2.mask || '') : '',
          _0x523571 = _0x58683e.trim(),
          _0x3d5254 =
            _0x107fa5 === 'image' && _0x523571
              ? _0x523571.startsWith('/')
                ? _0x523571
                : '/' + _0x523571.replace(/^\//, '')
              : '';
        if (_0x107fa5 === 'image' && _0x3d5254) _0x2d3a26.set(_0x493102, _0x3d5254);
        _0x182597[_0x107fa5].push({
          label: _0x3a7712,
          labels: _0x2296fb,
          content: _0x16f625,
          url: _0x493102,
          maskUrl: _0x3d5254,
          used: false,
          sourceId: _0x59c89e.sourceId,
          refSlot: _0x59c89e.refSlot || '',
        });
      }
      const _0x145a86 = [..._0x182597.text, ..._0x182597.image, ..._0x182597.video, ..._0x182597.audio],
        _0x5ef042 = {};
      _0x145a86.forEach((_0x32dbd0) => {
        (_0x32dbd0.labels || [_0x32dbd0.label]).forEach((_0x547bb5) => {
          _0x5ef042[_0x547bb5.replace(/\s+/g, '')] = _0x32dbd0;
        });
      });
      const _0x181389 = {};
      _0x145a86.forEach((_0x2260c5) => {
        if (_0x2260c5.sourceId) _0x181389[_0x2260c5.sourceId] = _0x2260c5;
      });
      let _0x944f57 = [];
      const _0x50eae9 = [],
        _0x2c426e = { image: 0, video: 0, audio: 0 },
        _0x304c6b = _0x373fbd?.[this.nodeId] || this._data || {},
        _0x50022f = getPromptAssetInputRefsFromNode(_0x304c6b, { allowedTypes: ['image'] }),
        _0x295f13 = () =>
          (_0x182597.image || []).some((_0x21a452) => !!_0x21a452.url) ||
          _0x944f57.some(Boolean) ||
          _0x50eae9.some((_0x588fc5) => _0x588fc5.type === 'image' && _0x588fc5.url) ||
          _0x50022f.some((_0x10e1df) => {
            const _0x55eff9 = resolveEffectiveInputKind(_0x10e1df) || _0x10e1df.type;
            return _0x55eff9 === 'image' && !!_0x10e1df.url;
          }),
        _0x113fc3 = (_0xa26ad5) => {
          let _0x467f95 = '';
          const _0x2e4ddf = (_0x24089c) => {
            for (const _0x1f117b of _0x24089c.childNodes) {
              if (_0x1f117b.nodeType === Node.TEXT_NODE) _0x467f95 += _0x1f117b.textContent;
              else {
                if (_0x1f117b.nodeType === Node.ELEMENT_NODE) {
                  if (_0x1f117b.classList.contains('ref-pill')) {
                    const _0x5970ec = _0x1f117b.dataset.nodeId || '',
                      _0x106c52 = _0x1f117b.dataset.label || _0x1f117b.textContent.trim(),
                      _0xab035 = [];
                    if (
                      appendAssetMentionToPrompt({
                        domNode: _0x1f117b,
                        rawLabel: _0x106c52,
                        promptParts: _0xab035,
                        inputRefs: _0x50eae9,
                        mediaCounts: _0x2c426e,
                        allowedTypes: ['text', 'image'],
                      })
                    ) {
                      ((_0x467f95 += _0xab035.join('')),
                        _0x50eae9.forEach((_0x4746e3) => {
                          _0x4746e3.type === 'image' &&
                            _0x4746e3.url &&
                            !_0x944f57.includes(_0x4746e3.url) &&
                            _0x944f57.push(_0x4746e3.url);
                        }));
                      continue;
                    }
                    const _0x4ac093 = _0x106c52.replace(/\s+/g, ''),
                      _0x11bbf9 = (_0x5970ec && _0x181389[_0x5970ec]) || _0x5ef042[_0x4ac093];
                    if (_0x11bbf9) {
                      _0x11bbf9.used = true;
                      if (_0x11bbf9.content) _0x467f95 += ' ' + _0x11bbf9.content + ' ';
                      else {
                        if (_0x11bbf9.url) {
                          _0x467f95 += ' ' + _0x106c52 + ' ';
                          if (!_0x8313a7 && !_0x944f57.includes(_0x11bbf9.url)) _0x944f57.push(_0x11bbf9.url);
                        }
                      }
                    } else _0x467f95 += ' ' + _0x106c52 + ' ';
                  } else _0x1f117b.tagName === 'BR' ? (_0x467f95 += '\n') : _0x2e4ddf(_0x1f117b);
                }
              }
            }
          };
          _0x2e4ddf(_0xa26ad5);
          let _0x459362 = _0x467f95.replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, ' ').trim();
          if (_0x2e526d) {
            let _0x519e79 = _0x459362;
            if (requiresPromptPresetInput(_0x2e526d)) {
              const _0x41dd9a = [];
              (_0x182597.text.forEach((_0x1a26f0) => {
                const _0x3b9adc = (_0x1a26f0.labels || [_0x1a26f0.label]).map(
                  (_0x5cb2b5) =>
                    new RegExp(
                      _0x5cb2b5.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\u00A0]*'),
                      'g',
                    ),
                );
                !_0x1a26f0.used &&
                  _0x1a26f0.content &&
                  !_0x3b9adc.some((_0x370c3d) => _0x370c3d.test(_0x459362)) &&
                  (_0x41dd9a.push(_0x1a26f0.content), (_0x1a26f0.used = true));
              }),
                (_0x519e79 = [..._0x41dd9a, _0x459362].filter(Boolean).join('\n').trim()));
            }
            _0x459362 = resolvePromptPresetTemplate(_0x2e526d, _0x519e79, { hasImageInput: _0x295f13 });
          } else _0x459362 = _0x459362 || '';
          return _0x459362;
        };
      let _0x2356c = _0x113fc3(this.promptEl);
      const _0x461570 = _0x145a86
        .flatMap((_0x1df5b2) =>
          (_0x1df5b2.labels || [_0x1df5b2.label]).map((_0x464fc7) => ({ ref: _0x1df5b2, label: _0x464fc7 })),
        )
        .sort((_0xee402b, _0x25ed38) => _0x25ed38.label.length - _0xee402b.label.length);
      _0x461570.forEach(({ ref: _0x3ed704, label: _0x26c79b }) => {
        if (!_0x3ed704.used) {
          const _0x3c8c24 = new RegExp(
            _0x26c79b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '[\\s\\u00A0]*'),
            'g',
          );
          if (_0x3c8c24.test(_0x2356c)) {
            _0x3ed704.used = true;
            if (_0x3ed704.content) _0x2356c = _0x2356c.replace(_0x3c8c24, ' ' + _0x3ed704.content + ' ');
            else {
              if (_0x3ed704.url) {
                _0x2356c = _0x2356c.replace(_0x3c8c24, ' ' + _0x26c79b.trim() + ' ');
                if (!_0x8313a7 && !_0x944f57.includes(_0x3ed704.url)) _0x944f57.push(_0x3ed704.url);
              }
            }
          }
        }
      });
      let _0x3326e9 = '';
      _0x182597.text.forEach((_0x34adac) => {
        !_0x34adac.used &&
          _0x34adac.content &&
          ((_0x3326e9 += _0x34adac.content + '\n'), (_0x34adac.used = true));
      });
      _0x3326e9 && (_0x2356c = _0x3326e9 + _0x2356c);
      !_0x8313a7 &&
        _0x145a86.forEach((_0x537a21) => {
          !_0x537a21.used &&
            _0x537a21.url &&
            !_0x944f57.includes(_0x537a21.url) &&
            _0x944f57.push(_0x537a21.url);
        });
      requiresPromptPresetInput(_0x2e526d) &&
        _0x50022f.forEach((_0x3fe89a) => {
          const _0x8df373 = resolveEffectiveInputKind(_0x3fe89a) || _0x3fe89a.type;
          _0x8df373 === 'image' &&
            _0x3fe89a.url &&
            !_0x944f57.includes(_0x3fe89a.url) &&
            _0x944f57.push(_0x3fe89a.url);
        });
      _0x944f57 = reorderImageInputUrlsByRefOrder(_0x944f57, _0x182597.image);
      if (_0x19bdf9 === 'image') {
        if (_0x47eda0) _0x944f57 = [_0x47eda0];
        else Number.isFinite(_0x5c5c05) && (_0x944f57 = _0x944f57.slice(0, _0x5c5c05));
      }
      if (_0x8313a7) {
        const _0x4cf215 = ['replaceTarget', 'replacedImage'],
          _0x192d9f = _0x182597.image || [],
          _0x20aa74 = (_0x14269a) =>
            String(_0x192d9f.find((_0x2c7ecd) => String(_0x2c7ecd.refSlot || '') === _0x14269a)?.url || ''),
          _0x165ea6 = String(_0x192d9f[0]?.url || ''),
          _0x4664f2 = String(
            _0x192d9f.find((_0x375ef4) => String(_0x375ef4.url || '') !== _0x165ea6)?.url || '',
          ),
          _0x3c3a52 = _0x20aa74(_0x4cf215[0]) || _0x165ea6,
          _0xc3f772 = _0x20aa74(_0x4cf215[1]) || _0x4664f2;
        _0x944f57 = [_0x3c3a52, _0xc3f772].filter(Boolean);
      }
      _0x14423c && (_0x944f57 = _0x944f57.filter(Boolean).slice(0, _0x3f64a0));
      const _0x1f8423 = _0x8313a7
          ? {}
          : buildInputUrlsByFixedImageSlot({
              fixedInputConfig: _0x180729,
              imageRefs: _0x182597.image,
              assetInputRefs: _0x50eae9,
            }),
        _0x118d5b =
          this._data.generationParams &&
          typeof this._data.generationParams === 'object' &&
          !Array.isArray(this._data.generationParams)
            ? this._data.generationParams
            : {},
        _0x212f06 = normalizeDreaminaImageModel(this._data.model, this._data.provider) || this._data.model,
        _0xd3231d = getModelManifest(_0x212f06);
      if (!_0xd3231d) throw new Error('Missing model manifest: ' + this._data.model);
      const _0x56622f = sanitizeTaskGenerationParams(_0x212f06, _0x118d5b),
        _0x177fb9 = _0xd3231d.adapterType === 'modelApi',
        _0xfca2aa = Array.isArray(_0xd3231d?.uiSchema?.fields) ? _0xd3231d.uiSchema.fields : [],
        {
          getManifestField: _0x1565e1,
          readSchemaParam: _0x1ad9dd,
          requireSchemaParam: _0x515506,
        } = createSchemaParamAccess({
          model: _0x212f06,
          data: this._data,
          generationParams: _0x56622f,
          manifestFields: _0xfca2aa,
        }),
        _0x117661 = _0x1565e1('imageSize') ? _0x515506('imageSize') : undefined,
        _0x20587d = _0x1565e1('aspectRatio') ? _0x515506('aspectRatio') : '自适应',
        _0x3c1c71 = _0x1565e1('batchSize') ? _0x515506('batchSize') : 1,
        _0x21cd1c =
          _0x177fb9 && _0x1565e1('google_image_search')
            ? normalizeTaskBooleanParam(_0x1ad9dd('google_image_search'))
            : undefined,
        _0x12bbd4 =
          _0x177fb9 && _0x1565e1('google_search')
            ? normalizeTaskBooleanParam(_0x1ad9dd('google_search')) || _0x21cd1c === true
            : undefined,
        _0x274423 = buildModelApiSchemaPayloadParams({
          isModelApiManifest: _0x177fb9,
          manifestFields: _0xfca2aa,
          readSchemaParam: _0x1ad9dd,
        });
      let _0x85b36 = _0x212f06 || 'nano-banana-2';
      const _0x221699 = _0x177fb9 ? _0x1ad9dd('mode') : undefined,
        _0xc01929 = _0x1ad9dd('rhModelRoute'),
        _0x2bc70a = resolveNanoBananaSelectionFromModel(_0x85b36, _0x117661 || '2K', this._data.provider);
      if (_0x2bc70a) {
        if (!_0x177fb9 && _0x221699 !== undefined)
          _0x85b36 = resolveNanoBananaModelBySelection({
            family: _0x2bc70a.family,
            mode: _0x221699,
            imageSize: _0x117661 || '2K',
            provider: _0x2bc70a.provider || this._data.provider,
          });
        else !_0x177fb9 && (_0x85b36 = _0x2bc70a.model);
      }
      isDreaminaImageModel(_0x85b36, this._data.provider) &&
        (_0x85b36 =
          normalizeDreaminaImageModel(_0x85b36, this._data.provider) || getDefaultDreaminaImageModelId());
      const _0x580db1 = this._inferProviderFromModel(_0x85b36, this._data.provider),
        _0x42c122 = resolveImageSizeForProviderModel({
          provider: _0x580db1,
          model: _0x85b36,
          imageSize: _0x117661,
        });
      !getModelManifest(_0x85b36) &&
        (_0x85b36 = resolveGrsaiGptImage2ModelForSize({
          provider: _0x580db1,
          model: _0x85b36,
          imageSize: _0x42c122,
        }));
      const _0x31a9c6 = isRunningHubWorkflowNode({ ...this._data, model: _0x85b36, provider: _0x580db1 });
      if (_0x31a9c6) {
        const _0x58c08c = _0x373fbd?.[this.nodeId] || this._data || {};
        getPromptAssetInputRefsFromNode(_0x58c08c, { allowedTypes: ['image'] }).forEach((_0x2c3f61) => {
          if (resolveEffectiveInputKind(_0x2c3f61) !== 'image') return;
          if (_0x2c3f61.url && !_0x944f57.includes(_0x2c3f61.url)) _0x944f57.push(_0x2c3f61.url);
        });
      }
      if (_0x580db1 === 'dreamina') {
        const _0x5409b3 = [],
          _0x25c622 = (_0x22d520) => {
            const _0xd87e01 = String(_0x22d520 || '').trim();
            if (!_0xd87e01 || _0xd87e01.startsWith('blob:')) return;
            if (!_0x5409b3.includes(_0xd87e01)) _0x5409b3.push(_0xd87e01);
          };
        ((_0x182597.image || []).forEach((_0x1cc804) => {
          const _0x297d5e = _0x373fbd?.[_0x1cc804?.sourceId] || null,
            _0x5a2168 = _0x297d5e ? resolveGenerationInputImageUrl(_0x297d5e) : '';
          (_0x25c622(_0x5a2168), _0x25c622(_0x1cc804?.url));
        }),
          (_0x944f57 = _0x5409b3.slice(0, 1)));
      }
      const _0x48441f = _0x944f57.map((_0x22a082) => String(_0x2d3a26.get(_0x22a082) || ''));
      if (_0x19bdf9 === 'image' && _0x944f57.length === 0)
        return (
          window.showToast?.(
            getImageInputGateMissingMessage(_0x4de6a6) || t('aigenImage.task.referenceImageRequired'),
            'warn',
          ),
          null
        );
      if (_0x8313a7 && _0x944f57.length < 2)
        return (window.showToast?.(t('aigenImage.task.replacePairRequired'), 'warn'), null);
      if (_0x14423c && _0x944f57.length < 1)
        return (window.showToast?.(t('aigenImage.task.referenceImageRequired'), 'warn'), null);
      const _0x1b7c77 = getPromptPresetTemplateEmptyInputMessage(_0x2e526d);
      if (_0x1b7c77 && !_0x2356c && _0x944f57.length === 0)
        return (window.showToast?.(_0x1b7c77, 'warn'), null);
      if (!_0x31a9c6 && !_0x2356c && _0x944f57.length === 0)
        return (
          console.warn('[AIGenerateNode] prompt 为空，跳过生成'),
          window.showToast?.(t('aigenImage.task.promptOrReferenceRequired'), 'warn'),
          null
        );
      await _0x14e2fd();
      const _0x1d8cd4 = _0x28ad2b(_0x580db1);
      let _0x48aac7 = '';
      if (_0x580db1 === 'runninghub')
        _0x48aac7 = isModelApiModel(_0x85b36, _0x580db1)
          ? _0x1d8cd4.modelApiKey || ''
          : _0x1d8cd4.apiKey || '';
      else
        _0x580db1 === 'runninghubwf'
          ? (_0x48aac7 = _0x1d8cd4.apiKey || '')
          : (_0x48aac7 = _0x1d8cd4.apiKey || window._appApiKey || '');
      let _0x11b4de = String(window.__aicInstallId || '').trim();
      if (typeof window.ensureSubscriptionInstallId === 'function')
        try {
          _0x11b4de = String(await window.ensureSubscriptionInstallId()).trim();
        } catch {}
      const _0x29e984 = String(_0x20587d || '自适应').trim(),
        _0x3e20d2 = isAdaptiveRatioLabel(_0x29e984),
        _0x6e4f7 = _0x52c3bb.filter((_0x17650b) => {
          const _0x5b375b = String(_0x17650b?.refSlot || '').toLowerCase();
          if (_0x5b375b.includes('mask')) return false;
          const _0x1f6237 = _0x373fbd?.[_0x17650b?.sourceId];
          return resolveEffectiveInputKind(_0x1f6237, _0x17650b) === 'image';
        }),
        _0x3f61c9 = pickGenerationRatioSourceEdge(_0x6e4f7, _0x373fbd?.[this.nodeId] || this._data || {});
      let _0x5dd3d1 = 0,
        _0x35a3c7 = 0;
      if (_0x3f61c9?.sourceId) {
        const _0xe636dc = _0x3f61c9.sourceId,
          _0x1fe8b7 = getGenerationRatioSizeWithDom({
            nodeId: _0xe636dc,
            nodeData: _0x373fbd[_0xe636dc],
            edge: _0x3f61c9,
            includeNodeFrame: true,
          });
        _0x1fe8b7 && ((_0x5dd3d1 = _0x1fe8b7.width), (_0x35a3c7 = _0x1fe8b7.height));
      }
      const _0x1b2650 = _0x373fbd?.[this.nodeId] || {},
        _0x3e0ea9 = resolveAdaptiveSourceSize({
          displayWidth: Number(_0x1b2650?.width || this._data?.width || 0),
          displayHeight: Number(_0x1b2650?.height || this._data?.height || 0),
          inputWidth: _0x5dd3d1,
          inputHeight: _0x35a3c7,
        }),
        _0xd32f2f =
          _0x3e20d2 && _0x5dd3d1 > 0 && _0x35a3c7 > 0
            ? { width: _0x5dd3d1, height: _0x35a3c7, source: 'input-media' }
            : _0x3e0ea9,
        _0x2102f3 = _0x580db1 === 'dreamina' ? normalizeDreaminaImageAspectRatio(_0x29e984) : _0x29e984,
        _0x344719 = parseRatioLabel(_0x2102f3)?.label || '',
        _0x1c38c7 = _0x42c122,
        _0x3ccc53 =
          _0x3e20d2 &&
          (shouldUseGrsaiNanoBananaApiAuto({ provider: _0x580db1, model: _0x85b36 }) ||
            shouldUseApimartSeedreamApiAuto({
              provider: _0x580db1,
              model: _0x85b36,
              hasInputImages: _0x944f57.length > 0,
            })),
        _0x4a86fb = _0x3e20d2
          ? _0x3ccc53
            ? 'auto'
            : pickClosestRatioForProviderModel({
                provider: _0x580db1,
                model: _0x85b36,
                width: _0xd32f2f.width,
                height: _0xd32f2f.height,
                imageSize: _0x1c38c7,
              })
          : pickClosestRatioForProviderModel({
              provider: _0x580db1,
              model: _0x85b36,
              ratioLabel: _0x344719 || _0x2102f3 || '1:1',
              imageSize: _0x1c38c7,
            }),
        _0x377398 = _0x3ccc53
          ? { resolvedRatioLabel: 'auto' }
          : resolveProviderRatioPayload({
              provider: _0x580db1,
              model: _0x85b36,
              ratioLabel: _0x4a86fb,
              imageSize: _0x1c38c7,
            }),
        _0x1332fc = getRatioCapability(_0x580db1, _0x85b36),
        _0x18b7fe = _0x1332fc === 'none',
        _0x25f759 =
          _0x580db1 === 'dreamina'
            ? normalizeDreaminaImageSize(_0x117661 || '2K')
            : _0x14423c && String(_0x42c122).toUpperCase() === '4K'
              ? '2K'
              : _0x42c122,
        _0x3a8c95 = _0x580db1 === 'dreamina' ? getDreaminaImageModelVersion(_0x85b36, _0x580db1) : '';
      return {
        prompt: _0x2356c,
        model: _0x85b36,
        aspectRatio: _0x377398.resolvedRatioLabel,
        resolvedRatioLabel: _0x377398.resolvedRatioLabel,
        adaptiveSource: _0xd32f2f.source,
        ratioCapability: _0x1332fc,
        imageSize: _0x25f759,
        modelVersion: _0x3a8c95,
        ..._0x274423,
        ...(_0x221699 !== undefined ? { mode: _0x221699 } : {}),
        ...(_0xc01929 !== undefined ? { rhModelRoute: _0xc01929 } : {}),
        ...(_0x12bbd4 !== undefined ? { google_search: _0x12bbd4 } : {}),
        ...(_0x21cd1c !== undefined ? { google_image_search: _0x21cd1c } : {}),
        batchSize: parseInt(_0x3c1c71) || 1,
        inputUrls: _0x944f57,
        ...(Object.keys(_0x1f8423).length > 0 ? { inputUrlsBySlot: _0x1f8423 } : {}),
        inputMaskUrls: _0x48441f,
        apiKey: _0x48aac7,
        installId: _0x11b4de,
        rhResolution: _0x1ad9dd('rhResolution') ?? _0x1ad9dd('rhAnimeRealResolution'),
        rhAnimeRealResolution: _0x1ad9dd('rhAnimeRealResolution'),
        rhInstanceType: _0x1ad9dd('rhInstanceType'),
        rhQwenEditMode: _0x14423c ? String(_0x1ad9dd('rhQwenEditMode') || '').trim() : undefined,
        rhQwenFirstImageMode: _0x14423c ? String(_0x1ad9dd('rhQwenFirstImageMode') || '').trim() : undefined,
        provider: _0x580db1,
        cameraAngle: this._data.cameraAngle || null,
        ratioNotice: _0x377398.notice || '',
        ...(_0x18b7fe ? { suppressAspectRatio: true } : {}),
      };
    }
    async ['_handleGenerateOrCancel'](_0x48e5c4 = null) {
      const _0x5a5d13 = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {},
        _0x13fac7 = this._isRunninghubWorkflowModel(_0x5a5d13?.model, _0x5a5d13?.provider);
      if (
        shouldAllowCancel(_0x5a5d13, {
          cancellable: _0x13fac7,
          cancelInFlight: this._rhCancelInFlight === true,
        })
      ) {
        await this._cancelRunningHubWorkflowTask();
        return;
      }
      await this._onGenerate(_0x48e5c4);
    }
    ['_buildRunningHubCancelResultPatch']({
      latest: latest = {},
      message: message = t('aigenImage.task.interrupted'),
      code: code = null,
      duration: duration = null,
      taskId: taskId = '',
    } = {}) {
      const _0x3a885a = Number(latest?.rhTaskStartedAt || latest?.generationStartTime || 0),
        _0x48aff3 =
          String(message || t('aigenImage.task.interrupted')).trim() || t('aigenImage.task.interrupted'),
        _0x4a4e7d = code === null || code === undefined || code === '' ? null : Number(code);
      return {
        rhStatusMessage: _0x48aff3,
        rhStatusCode: Number.isFinite(_0x4a4e7d) ? _0x4a4e7d : null,
        images: [],
        imageUrl: '',
        thumbUrl: '',
        localPath: '',
        ...buildGenerationCancelledPatch({ startedAt: _0x3a885a, duration: duration }),
        ...this._buildRunningHubTaskPatch({
          taskId: taskId,
          status: 'cancelled',
          startedAt: _0x3a885a,
          recovering: false,
          useOpenapiQuery: latest?.rhTaskUseOpenapiQuery === true,
        }),
      };
    }
    async ['_cancelRunningHubWorkflowTask']() {
      const _0x37d581 = _0xff470c.getState().nodes?.[this.nodeId] || this._data || {},
        _0x465dc9 = this._rhApiKey || '',
        _0xccf866 = String(this._rhTaskId || '').trim() || String(_0x37d581?.rhTaskId || '').trim(),
        _0x54002a = Date.now(),
        _0x1b9fc7 = Number(_0x37d581?.generationStartTime),
        _0x3c77ef =
          _0x37d581?.generationDuration != null
            ? _0x37d581.generationDuration
            : Number.isFinite(_0x1b9fc7) && _0x1b9fc7 > 0
              ? Math.max(0, _0x54002a - _0x1b9fc7)
              : 0;
      this._rhCancelRequested = true;
      if (this._rhCancelInFlight) return;
      this._rhAbortController && !this._rhAbortController.signal.aborted && this._rhAbortController.abort();
      const _0x3ba64c = !_0x465dc9,
        _0x30957b = !_0xccf866;
      try {
        this._rhCancelInFlight = true;
        const _0x4ae497 = ({ remoteResult: _0x5149bd, remoteError: _0x199162 }) => {
          const _0x53e5c2 = Number(_0x5149bd?.code),
            _0x54ccc8 = String(_0x5149bd?.msg || _0x5149bd?.message || '').trim(),
            _0x4652d5 = _0x3ba64c
              ? t('aigenImage.task.cancelMissingApiKey')
              : _0x30957b
                ? t('aigenImage.task.interruptedMissingTaskId')
                : '',
            _0x51a157 =
              _0x4652d5 ||
              (_0x199162
                ? _0x199162.message || t('aigenImage.task.cancelFailed')
                : _0x53e5c2 === 0
                  ? _0x54ccc8 || t('aigenImage.task.cancelSuccess')
                  : _0x53e5c2 === 0x327
                    ? _0x54ccc8 || t('aigenImage.task.taskNotFound')
                    : _0x54ccc8 || t('aigenImage.task.cancelFailed'));
          return this._buildRunningHubCancelResultPatch({
            latest: _0x37d581,
            message: _0x51a157,
            code: _0x30957b ? 0x32d : _0x53e5c2,
            duration: _0x3c77ef,
          });
        };
        (await cancelTask(this.nodeId, {
          store: _0xff470c,
          taskId: _0xccf866,
          cancellable: true,
          cancel: ({ taskId: _0x97deb4 }) => {
            if (!_0x465dc9) throw new Error(t('aigenImage.task.cancelMissingApiKey'));
            return _0xfcf4f2.cancelRunningHubWorkflowTask({ apiKey: _0x465dc9, taskId: _0x97deb4 });
          },
          cancelledBuilder: _0x4ae497,
          spec: {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'image-generation',
            provider: _0x37d581?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: _0x37d581?.model || '',
            executionId: 'runninghub.image.' + (_0x37d581?.model || 'workflow'),
            payload: _0x37d581,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: _0x4ae497,
          },
        }),
          this._persistRunningHubResumeCache());
        const _0xf198cc = _0xff470c.getState().nodes?.[this.nodeId] || {},
          _0x21e3e4 = Number(_0xf198cc?.rhStatusCode),
          _0x4a5770 = String(_0xf198cc?.rhStatusMessage || '').trim();
        if (!_0x3ba64c && !_0x30957b) {
          if (_0x21e3e4 === 0) window.showToast?.(t('aigenImage.task.cancelledToast'), 'success');
          else {
            if (_0x4a5770) window.showToast?.(_0x4a5770, 'error');
          }
        }
      } finally {
        ((this._rhCancelInFlight = false),
          (this._isGenerating = false),
          (this._rhAbortController = null),
          (this._rhTaskId = null),
          (this._rhApiKey = null),
          this.btnEl && (resetGenerateButtonIdleUi(this.btnEl), this._updateSubmitButtonState()),
          _0x32cd7a(this.previewEl));
      }
    }
    ['_getPreviewGenerateButtonLoadingOptions']() {
      return createPreviewGenerateButtonCallbacks(this, t('aigenImage.controls.generate'));
    }
    async ['runGeneration'](_0x51fa56 = {}) {
      return this._onGenerate(null, _0x51fa56);
    }
    async ['cancelGeneration']() {
      return this._cancelRunningHubWorkflowTask();
    }
    ['getGenerationStatus']() {
      const _0x4aeddb = _0xff470c.getState?.()?.nodes?.[this.nodeId] || this._data || {},
        _0x6c4d67 = String(
          _0x4aeddb.jobStatus ||
            _0x4aeddb.asyncTaskStatus ||
            _0x4aeddb.rhTaskStatus ||
            (this._isGenerating ? 'running' : 'idle'),
        );
      return {
        nodeId: this.nodeId,
        jobStatus: _0x6c4d67,
        isGenerating: this._isGenerating === true || _0x6c4d67 === 'running' || _0x6c4d67 === 'pending',
        taskId: String(
          this._rhTaskId || _0x4aeddb.rhTaskId || _0x4aeddb.asyncTaskId || _0x4aeddb.taskId || '',
        ),
        cancellable: true,
        resumable: Boolean(_0x4aeddb.asyncTaskId || _0x4aeddb.rhTaskId),
      };
    }
    async ['_onGenerate'](_0x474df3 = null, _0x1bd6db = {}) {
      if (this._isGenerating) return;
      if (_0x1bd6db?.insertPrompt === true) {
        (insertPresetPromptIntoEditor({
          storeApi: _0xff470c,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          template: _0x474df3,
          inEdges: _0xff470c.getIncomingEdges(this.nodeId),
          nodes: _0xff470c.getState().nodes || {},
          allowedAssetTypes: ['text', 'image'],
        }),
          this._updateSubmitButtonState?.());
        return;
      }
      if (shouldUsePromptPreviewForPreset(_0x474df3)) {
        const _0x37ff8c = await this._buildPayload(_0x474df3);
        if (!_0x37ff8c) return;
        previewPresetPromptInEditor({
          storeApi: _0xff470c,
          nodeId: this.nodeId,
          promptEl: this.promptEl,
          promptText: _0x37ff8c.prompt,
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
      const _0x18be32 = await this._buildPayload(_0x474df3);
      if (!_0x18be32) return;
      const _0x2bd8b2 = getImageProviderApiKeyMissingMessage(_0x18be32);
      if (_0x2bd8b2) {
        window.showToast?.(_0x2bd8b2, 'warn');
        return;
      }
      const _0x21d97a = this._isRunninghubTaskModel(_0x18be32.model, _0x18be32.provider),
        _0x125bb7 = this._isRunninghubWorkflowModel(_0x18be32.model, _0x18be32.provider),
        _0x5d581c = this._isDreaminaImageNode(_0x18be32),
        _0x236309 = this._inferProviderFromModel(
          _0x18be32?.model,
          _0x18be32?.provider || this._data?.provider || '',
        ),
        _0x224e39 = !_0x21d97a && !_0x5d581c && isAsyncImageModelApiProvider(_0x236309),
        _0x3a307d =
          resolveModelProvider(_0x18be32?.model, _0x18be32?.provider, { allowProviderHint: false }) ===
            'runninghub' && isModelApiModel(_0x18be32?.model, 'runninghub'),
        _0x28d282 = shouldUseImageWorkflowBusyButton(_0x18be32.model);
      _0x21d97a && this._stopRunningHubRecovery(true);
      _0x5d581c && this._stopDreaminaRecovery(true);
      _0x224e39 && this._stopAsyncRecovery(true);
      this._rhCancelRequested = false;
      const _0x280798 = _0x21d97a || _0x5d581c || _0x224e39;
      ((this._rhApiKey = _0x21d97a ? _0x18be32.apiKey : null),
        (this._rhTaskId = null),
        (this._rhAbortController = _0x280798 ? new AbortController() : null),
        (this._isGenerating = true));
      this.btnEl &&
        (_0x125bb7
          ? setGenerateButtonCancellableUi(this.btnEl, { busy: _0x28d282 })
          : setGenerateButtonLoadingUi(this.btnEl));
      _0x27a9f5(this.previewEl);
      const _0x344dda = Date.now(),
        _0x1fc31e = {
          ...buildGenerationStartPatch({ startedAt: _0x344dda }),
          rhStatusMessage: null,
          rhStatusCode: null,
        };
      _0x21d97a &&
        (Object.assign(
          _0x1fc31e,
          this._buildRunningHubTaskPatch({
            taskId: '',
            status: 'pending',
            startedAt: _0x344dda,
            recovering: false,
            useOpenapiQuery: _0x3a307d,
          }),
        ),
        Object.assign(_0x1fc31e, {
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
      _0x5d581c &&
        (Object.assign(
          _0x1fc31e,
          this._buildDreaminaTaskPatch({
            submitId: '',
            status: 'pending',
            phase: 'generating',
            label: t('aigenImage.task.submitting'),
            startedAt: _0x344dda,
            lastCheckedAt: 0,
            recovering: false,
            raw: {},
          }),
        ),
        Object.assign(_0x1fc31e, {
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
      _0x224e39 &&
        (Object.assign(
          _0x1fc31e,
          this._buildAsyncTaskPatch({
            provider: _0x236309,
            kind: 'image',
            taskId: '',
            status: 'pending',
            startedAt: _0x344dda,
            recovering: false,
          }),
        ),
        Object.assign(_0x1fc31e, {
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
      !_0x21d97a &&
        !_0x5d581c &&
        !_0x224e39 &&
        Object.assign(_0x1fc31e, {
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
      _0x1fc31e.ratioNotice = String(_0x18be32?.ratioNotice || '');
      let _0x333763 = null;
      try {
        _0x333763 = await submitTask(
          {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'image-generation',
            provider: _0x18be32.provider || _0x236309 || this._data?.provider || '',
            adapterType: _0x125bb7 ? 'workflow' : 'modelApi',
            modelId: _0x18be32.model || this._data?.model || '',
            executionId:
              'image.' +
              (_0x18be32.provider || _0x236309 || 'modelApi') +
              '.' +
              (_0x18be32.model || 'default'),
            payload: _0x18be32,
            cancellable: _0x125bb7,
            resumable: _0x21d97a || _0x5d581c || _0x224e39,
            async: _0x224e39,
            pauseOnAbort: _0x280798,
            startBuilder: () => _0x1fc31e,
            pauseBuilder: (_0x5aa4cd) => {
              const _0x1b9c3 = _0xff470c.getState().nodes?.[this.nodeId] || {};
              if (_0x5d581c)
                return this._buildDreaminaTaskPatch({
                  submitId:
                    String(this._dreaminaActiveSubmitId || '').trim() ||
                    String(_0x1b9c3?.dreaminaSubmitId || '').trim(),
                  status: String(_0x1b9c3?.dreaminaTaskStatus || '').trim() || 'pending',
                  phase: String(_0x1b9c3?.dreaminaTaskPhase || '').trim() || 'generating',
                  label: String(_0x1b9c3?.dreaminaTaskLabel || '').trim() || t('aigenImage.task.generating'),
                  startedAt: _0x5aa4cd.startedAt,
                  lastCheckedAt: Date.now(),
                  recovering: false,
                  raw: _0x1b9c3?.dreaminaTaskLastRaw || {},
                });
              if (_0x21d97a)
                return this._buildRunningHubTaskPatch({
                  taskId:
                    String(this._rhTaskId || '').trim() ||
                    String(_0x1b9c3?.rhTaskId || '').trim() ||
                    String(_0x5aa4cd?.taskId || '').trim(),
                  status: String(_0x1b9c3?.rhTaskStatus || '').trim() || 'running',
                  startedAt: _0x5aa4cd.startedAt,
                  recovering: false,
                  useOpenapiQuery: _0x1b9c3?.rhTaskUseOpenapiQuery === true || _0x3a307d,
                });
              return {};
            },
            onTaskStart: () => {
              this._syncLocalTaskNodeData();
              if (_0x21d97a) this._persistRunningHubResumeCache();
              if (_0x5d581c) this._persistDreaminaResumeCache();
              if (_0x224e39) this._persistAsyncResumeCache();
            },
            submit: async (_0xb9caf2, _0x2f87b5 = {}) =>
              _0xfcf4f2.generateImage(_0x18be32, {
                ...(this._rhAbortController ? { signal: this._rhAbortController.signal } : {}),
                onProgress: _0x5d581c
                  ? (_0x452385 = {}) => {
                      const _0x1ce838 = String(_0x452385?.status || 'pending').trim() || 'pending',
                        _0x45a61e = String(_0x452385?.phase || 'generating').trim() || 'generating',
                        _0x2387a9 = String(
                          _0x452385?.failReason ||
                            _0x452385?.failureReason ||
                            _0x452385?.error ||
                            _0x452385?.message ||
                            _0x452385?.label ||
                            '',
                        ).trim();
                      if (
                        _0x1ce838.toLowerCase() === 'failed' ||
                        _0x1ce838.toLowerCase() === 'fail' ||
                        _0x1ce838.toLowerCase() === 'error' ||
                        _0x45a61e.toLowerCase() === 'failed' ||
                        _0x45a61e.toLowerCase() === 'fail' ||
                        _0x45a61e.toLowerCase() === 'error'
                      ) {
                        this._finalizeDreaminaImageFailure({
                          error: _0x2387a9 || t('aigenImage.task.generationFailed'),
                          startedAt: _0x344dda,
                          submitId:
                            String(_0x452385?.submitId || '').trim() ||
                            String(_0xff470c.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim(),
                          lastCheckedAt: Number(_0x452385?.lastCheckedAt || Date.now()),
                          raw: _0x452385?.raw || {},
                        });
                        return;
                      }
                      this._applyDreaminaTaskPatch({
                        submitId:
                          String(_0x452385?.submitId || '').trim() ||
                          String(_0xff470c.getState().nodes?.[this.nodeId]?.dreaminaSubmitId || '').trim(),
                        status: _0x1ce838,
                        phase: _0x45a61e,
                        label:
                          String(_0x452385?.label || t('aigenImage.task.generating')).trim() ||
                          t('aigenImage.task.generating'),
                        startedAt: _0x344dda,
                        lastCheckedAt: Number(_0x452385?.lastCheckedAt || Date.now()),
                        recovering: false,
                        raw: _0x452385?.raw || {},
                      });
                    }
                  : undefined,
                onTaskMeta: ({ taskId: _0x4ba80c, useOpenapiQuery: _0x39a69e, provider: _0x4d3107 }) => {
                  const _0x40f423 = String(_0x4ba80c || '').trim();
                  if (!_0x40f423) return;
                  if (_0x21d97a) {
                    ((this._rhTaskId = _0x40f423),
                      _0x2f87b5.onTaskId?.(_0x40f423),
                      _0xff470c.updateNodeData(this.nodeId, {
                        rhStatusMessage: null,
                        rhStatusCode: null,
                        rhTaskUseOpenapiQuery: _0x39a69e === true,
                      }),
                      this._syncLocalTaskNodeData(),
                      this._persistRunningHubResumeCache());
                    _0x125bb7 && this._rhCancelRequested && this._cancelRunningHubWorkflowTask();
                    return;
                  }
                  if (_0x5d581c) {
                    ((this._dreaminaActiveSubmitId = _0x40f423),
                      this._applyDreaminaTaskPatch({
                        submitId: _0x40f423,
                        status: 'pending',
                        phase: 'generating',
                        label: t('aigenImage.task.generating'),
                        startedAt: _0x344dda,
                        lastCheckedAt: Date.now(),
                        recovering: false,
                        raw: {},
                      }),
                      _0x2f87b5.onTaskId?.(_0x40f423));
                    return;
                  }
                  _0x224e39 &&
                    (_0x2f87b5.onTaskId?.(_0x40f423),
                    _0xff470c.updateNodeData(this.nodeId, {
                      asyncTaskProvider: this._inferProviderFromModel(
                        _0x18be32?.model,
                        _0x4d3107 || _0x236309 || this._data?.provider || '',
                      ),
                      asyncTaskKind: 'image',
                    }),
                    this._syncLocalTaskNodeData(),
                    this._persistAsyncResumeCache());
                },
                onTaskId: (_0x35a0ac) => {
                  const _0x3a5ceb = String(_0x35a0ac || '').trim();
                  if (!_0x3a5ceb) return;
                  if (_0x21d97a) {
                    ((this._rhTaskId = _0x3a5ceb), _0x2f87b5.onTaskId?.(_0x3a5ceb));
                    const _0x42f459 = _0xff470c.getState().nodes?.[this.nodeId] || {};
                    (_0xff470c.updateNodeData(this.nodeId, {
                      rhStatusMessage: null,
                      rhStatusCode: null,
                      rhTaskUseOpenapiQuery: _0x42f459?.rhTaskUseOpenapiQuery === true || _0x3a307d,
                    }),
                      this._syncLocalTaskNodeData(),
                      this._persistRunningHubResumeCache());
                    _0x125bb7 && this._rhCancelRequested && this._cancelRunningHubWorkflowTask();
                    return;
                  }
                  if (_0x5d581c) {
                    ((this._dreaminaActiveSubmitId = _0x3a5ceb),
                      this._applyDreaminaTaskPatch({
                        submitId: _0x3a5ceb,
                        status: 'pending',
                        phase: 'generating',
                        label: t('aigenImage.task.generating'),
                        startedAt: _0x344dda,
                        lastCheckedAt: Date.now(),
                        recovering: false,
                        raw: {},
                      }),
                      _0x2f87b5.onTaskId?.(_0x3a5ceb));
                    return;
                  }
                  if (_0x224e39) {
                    const _0x4751ed = _0xff470c.getState().nodes?.[this.nodeId] || {};
                    (_0x2f87b5.onTaskId?.(_0x3a5ceb),
                      _0xff470c.updateNodeData(this.nodeId, {
                        asyncTaskProvider: this._inferProviderFromModel(
                          _0x4751ed?.model || _0x18be32?.model,
                          _0x4751ed?.asyncTaskProvider || _0x236309 || this._data?.provider || '',
                        ),
                        asyncTaskKind: 'image',
                      }),
                      this._syncLocalTaskNodeData(),
                      this._persistAsyncResumeCache());
                  }
                },
              }),
            cancel: _0x125bb7
              ? async ({ taskId: _0x11ada7 }) => {
                  const _0x15a703 = this._rhApiKey || _0x18be32.apiKey || '',
                    _0x59cdfb = String(_0x11ada7 || '').trim();
                  if (!_0x15a703 || !_0x59cdfb) return null;
                  return _0xfcf4f2.cancelRunningHubWorkflowTask({ apiKey: _0x15a703, taskId: _0x59cdfb });
                }
              : undefined,
            resultBuilder: async (_0x45cfe7, _0x1f9bad) => {
              const _0xd1b60f = this._getImageGenerationResultError(_0x45cfe7);
              if (_0xd1b60f) throw new Error(_0xd1b60f);
              const _0x379354 = this._applyImageGenerationResult(_0x45cfe7, _0x1f9bad.startedAt, {
                  writeStore: false,
                }),
                _0x3462b4 = { ...(_0x379354?.patch || {}) };
              if (_0x21d97a) {
                const _0x1ede1b = _0xff470c.getState().nodes?.[this.nodeId] || {};
                (Object.assign(
                  _0x3462b4,
                  this._buildRunningHubTaskPatch({
                    taskId: String(this._rhTaskId || '').trim() || String(_0x1ede1b?.rhTaskId || '').trim(),
                    status: 'success',
                    startedAt: _0x1f9bad.startedAt,
                    recovering: false,
                    useOpenapiQuery: _0x1ede1b?.rhTaskUseOpenapiQuery === true || _0x3a307d,
                  }),
                ),
                  this._persistRunningHubResumeCache());
              } else {
                if (_0x5d581c) {
                  const _0x238d7e = _0xff470c.getState().nodes?.[this.nodeId] || {};
                  (Object.assign(
                    _0x3462b4,
                    this._buildDreaminaTaskPatch({
                      submitId: String(_0x238d7e?.dreaminaSubmitId || '').trim(),
                      status: 'success',
                      phase: 'done',
                      label: t('aigenImage.task.completed'),
                      startedAt: _0x1f9bad.startedAt,
                      lastCheckedAt: Date.now(),
                      recovering: false,
                      raw: {},
                    }),
                  ),
                    this._persistDreaminaResumeCache());
                } else {
                  if (_0x224e39) {
                    const _0x5541d8 = _0xff470c.getState().nodes?.[this.nodeId] || {};
                    (Object.assign(
                      _0x3462b4,
                      this._buildAsyncTaskPatch({
                        provider: this._inferProviderFromModel(
                          _0x5541d8?.model || _0x18be32?.model,
                          _0x5541d8?.asyncTaskProvider || _0x236309 || '',
                        ),
                        kind: 'image',
                        taskId:
                          String(_0x5541d8?.asyncTaskId || '').trim() ||
                          String(_0x1f9bad?.taskId || '').trim(),
                        status: 'success',
                        startedAt: _0x1f9bad.startedAt,
                        recovering: false,
                      }),
                    ),
                      this._persistAsyncResumeCache());
                  }
                }
              }
              return _0x3462b4;
            },
            failureBuilder: (_0x18e099, _0x2e93a4) => {
              if (_0x5d581c) {
                const _0xe91247 = _0xff470c.getState().nodes?.[this.nodeId] || {};
                return this._buildDreaminaFailurePatch({
                  error: _0x18e099,
                  startedAt: _0x2e93a4.startedAt,
                  submitId:
                    String(this._dreaminaActiveSubmitId || '').trim() ||
                    String(_0xe91247?.dreaminaSubmitId || '').trim(),
                  lastCheckedAt: Date.now(),
                  raw: _0xe91247?.dreaminaTaskLastRaw || {},
                });
              }
              const _0x295ed3 = {
                ...buildImageGenerationFailurePatch({
                  error: _0x18e099?.message || t('aigenImage.task.generationFailed'),
                  startedAt: _0x2e93a4.startedAt,
                }),
              };
              if (_0x21d97a) {
                const _0x5c718d = _0xff470c.getState().nodes?.[this.nodeId] || {};
                Object.assign(
                  _0x295ed3,
                  {
                    rhStatusMessage: _0x18e099?.message || t('aigenImage.task.generationFailed'),
                    rhStatusCode: Number.isFinite(Number(_0x18e099?.code)) ? Number(_0x18e099.code) : null,
                  },
                  this._buildRunningHubTaskPatch({
                    taskId: String(this._rhTaskId || '').trim() || String(_0x5c718d?.rhTaskId || '').trim(),
                    status: 'failed',
                    startedAt: _0x2e93a4.startedAt,
                    recovering: false,
                    useOpenapiQuery: _0x5c718d?.rhTaskUseOpenapiQuery === true || _0x3a307d,
                  }),
                );
              } else {
                if (_0x224e39) {
                  const _0x3b01f2 = _0xff470c.getState().nodes?.[this.nodeId] || {};
                  Object.assign(
                    _0x295ed3,
                    this._buildAsyncTaskPatch({
                      provider: this._inferProviderFromModel(
                        _0x3b01f2?.model || _0x18be32?.model,
                        _0x3b01f2?.asyncTaskProvider || _0x236309 || '',
                      ),
                      kind: 'image',
                      taskId:
                        String(_0x3b01f2?.asyncTaskId || '').trim() || String(_0x2e93a4?.taskId || '').trim(),
                      status: 'failed',
                      startedAt: _0x2e93a4.startedAt,
                      recovering: false,
                    }),
                  );
                }
              }
              return _0x295ed3;
            },
            cancelledBuilder: (_0x275104) => {
              const _0xb0a1f7 = _0xff470c.getState().nodes?.[this.nodeId] || {},
                _0x16cf57 =
                  _0xb0a1f7.generationDuration == null
                    ? Date.now() - _0x275104.startedAt
                    : _0xb0a1f7.generationDuration;
              if (_0x125bb7)
                return this._buildRunningHubCancelResultPatch({
                  latest: _0xb0a1f7,
                  message: _0xb0a1f7.rhStatusMessage || t('aigenImage.task.interrupted'),
                  code: _0xb0a1f7.rhStatusCode,
                  duration: _0x16cf57,
                  taskId: String(this._rhTaskId || '').trim() || String(_0xb0a1f7?.rhTaskId || '').trim(),
                });
              return { images: [], imageUrl: '', thumbUrl: '', localPath: '' };
            },
            parseError: (_0x193cc0) => _0x193cc0?.message || t('aigenImage.task.generationFailed'),
          },
          { store: _0xff470c, startedAt: _0x344dda, abortController: this._rhAbortController },
        );
        if (_0x333763.status === 'failed') {
          const _0x35bd96 = _0x333763.error;
          (console.error('[AIGenerateNode] 生成失败:', _0x35bd96),
            void logDiagnosticEvent({
              type: 'generation.image_failed',
              level: 'error',
              source: 'renderer',
              message: _0x35bd96?.message || t('aigenImage.task.imageGenerationFailed'),
              error: _0x35bd96,
              context: {
                nodeId: this.nodeId,
                provider: _0x18be32?.provider || '',
                model: _0x18be32?.model || '',
                isRhTaskModel: _0x21d97a,
                isDreaminaTask: _0x5d581c,
                isAsyncTaskModel: _0x224e39,
              },
            }));
        }
        if (_0x21d97a) this._persistRunningHubResumeCache();
        if (_0x5d581c) this._persistDreaminaResumeCache();
        if (_0x224e39) this._persistAsyncResumeCache();
        return _0x333763;
      } finally {
        const _0x43f168 = this._syncLocalTaskNodeData(),
          _0x2f376d = shouldShowGenerationBusyUi(_0x43f168);
        ((this._isGenerating = _0x2f376d),
          (this._dreaminaActiveSubmitId = ''),
          (this._rhAbortController = null));
        if (_0x21d97a && _0x2f376d) {
          const _0x4e5c91 = String(_0x43f168?.rhTaskId || '').trim();
          if (_0x4e5c91) this._rhTaskId = _0x4e5c91;
        } else {
          this._rhTaskId = null;
          if (!this._rhCancelRequested) this._rhApiKey = null;
        }
        this.btnEl && this._updateSubmitButtonState?.();
        if (!_0x2f376d) {
          if (this.btnEl) resetGenerateButtonIdleUi(this.btnEl);
          _0x32cd7a(this.previewEl);
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
  return _0x2b8f6c.prototype;
}
