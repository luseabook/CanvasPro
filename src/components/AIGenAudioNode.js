import { openDebugRequestWindow } from '../modules/debugRequestWindow.js';
import { normalizeRunningHubInstanceType } from '../modules/runningHubInstanceTypes.js';
import appStore from '../core/stores/appStore.js';
import { buildCanvasLocalImageFields } from '../services/canvasMediaLocalService.js';
import {
  collectAudioWorkflowImageInputs,
  buildAudioWorkflowImageSlotItems,
} from './audio-node/audioWorkflowImageInputs.js';
import { bindRendererMediaPlaybackPin } from './shared/rendererMediaPlaybackPin.js';
import { shouldPreserveGenerationTaskOnUnmount } from '../core/generationTaskRuntime.js';
import { onLocaleChange, t } from '../i18n/index.js';
import {
  buildGenerateAudioRequest,
  cancelRunningHubAudioTask,
  generateAudio,
  resumeRunningHubAudioTask,
} from '../../api/aiAudioApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { saveRemoteAudioLocallyDetailed, uploadFile } from '../modules/project.js';
import { getNodeDefaultSize } from '../services/fileService.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { subscribeAssetMentionRegistry } from '../modules/assetMentionRegistry.js';
import { removeCoveredAssetInputRefForConnection } from '../modules/promptAssetInputOverride.js';
import {
  cancelAudioSeparationTaskForNode,
  getRunningAudioSeparationTaskForNode,
  runAudioSeparationFromNode,
} from '../modules/AudioSeparationController.js';
import { bindRunningHubToolbarTaskButton } from './nodeToolbar/runningHubToolbarTaskButton.js';
import {
  _handlePillHover,
  _handlePillOut,
  _checkAtTrigger,
  _handleMentionMenuKeyboard,
  _handlePillKeyboard,
  _rehydratePromptPills,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  getAssetInputRefsFromPromptAndNode,
  getPromptAssetInputRefsFromNode,
  handleRefThumbDeleteClick,
  insertPresetPromptIntoEditor,
  previewPresetPromptInEditor,
  resolvePresetPromptTextWithTextRefs,
  shouldUsePromptPreviewForPreset,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  schedulePromptHtmlCommit,
  shouldSubmitPromptByKeyboard,
} from '../modules/nodePromptShared.js';
import {
  isPreviewModeEnabled,
  isPreviewNodeLoading,
  startPreviewNodeLoading,
  stopPreviewNodeLoading,
  syncPreviewNodeLoading,
} from '../modules/previewMode.js';
import {
  createPreviewGenerateButtonCallbacks,
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from '../modules/previewGenerateButtonUi.js';
import { AUDIO_TOOLBAR_HTML } from './NodeToolbarConfig.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import AudioClipController from '../modules/AudioClipController.js';
import { findAvailablePosition, generateId } from '../core/math.js';
import { getNodeSpawnPrefs } from '../modules/nodeSpawn.js';
import { ensureThumbDecoded, revealRefThumbMedia } from '../modules/refThumbMediaReveal.js';
import {
  createReferenceInputThumbnailHtml,
  resolveReferenceVideoThumbnail,
} from '../modules/referenceInputThumbnail.js';
import { escapeInputSlotLabelHtml, formatInputSlotLabelHtml } from './shared/inputSlotLabelFormatter.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation } from '../modules/slashMenu.js';
import { shouldSkipPromptTriggerForBulkInput } from '../modules/promptTriggerComposition.js';
import {
  clearVirtualizedPromptCommit,
  isVirtualizedPromptEditorCurrent,
} from '../modules/promptPasteVirtualization.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import { bindRefThumbHoverPreview } from '../modules/refThumbHoverPreview.js';
import { bindRefThumbFixedSlotDrag } from '../modules/refThumbDragController.js';
import { getAudioNodeWaveformPath } from '../utils/audioWaveform.js';
import { createAudioPlaybackProgressController } from '../utils/audioPlaybackProgress.js';
import {
  loadAudioDurationMetadataSec,
  normalizeAudioDurationSec,
  pickAudioDurationSec,
} from '../services/audioMetadataService.js';
import { beginAudioPlayback, registerAudioPlaybackClient } from '../modules/audioPlaybackCoordinator.js';
import { sanitizePromptHtml } from '../utils/dom.js';
import { GENERATION_HISTORY_EVENT } from '../modules/generationHistoryAssets.js';
import {
  showProviderApiKeyMissingToast,
  showProviderApiKeyMissingToastForError,
} from '../modules/providerApiKeyMissingToast.js';
import {
  applyModelCredentialButtonState,
  bindModelCredentialMenu,
  guardModelGenerationCredentials,
  resetModelCredentialButtonState,
  syncModelCredentialMenu,
} from '../modules/modelCredentialUi.js';
import { createModelProviderProfileControl } from './shared/modelProviderProfileControl.js';
import { normalizeRunningHubModelApiProfileId } from '../modules/runningHubProviderProfiles.js';
import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from './promptBoxResize.js';
import {
  buildCanvasLocalVideoFields,
  resolveCanvasAudioUrl,
  resolveCanvasVideoUrl,
} from '../services/canvasMediaLocalService.js';
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
  getMediaElementCurrentSource,
  getMediaElementPlaybackSourceKey,
  isMediaElementPlaybackSource,
} from '../services/desktopMediaBlobSource.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { DEBUG_WRENCH_ICON_HTML, buildFinalApiDebugPreview } from '../utils/debugRequestPreview.js';
import { createPromptAttachmentButtonHTML } from './refAttachmentButton.js';
import { getModelManifest, RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID } from '../manifests/index.js';
import { isVipModel, resolveVipGateModelId } from '../modules/subscriptionAccess.js';
import { buildAudioWorkflowItems } from './audio-node/audioModelMenuHelpers.js';
import {
  buildAudioWorkflowFooterHtml,
  isRunningHubAudioWorkflowItem,
} from './audio-node/audioFooterSchemaSlots.js';
import { isCustomAiAppManifest } from './shared/rhAiAppNodeBehavior.js';
import {
  bindAudioWorkflowSchemaSlotControls,
  closeAudioWorkflowAdvancedPanel,
  collectAudioWorkflowSchemaSlotElements,
  syncAudioWorkflowSchemaSlots,
} from './audio-node/audioWorkflowSchemaSlotSync.js';
import {
  buildAudioWorkflowDefaultSyncPatch,
  buildAudioWorkflowSelectionPatch,
  getAudioWorkflowUiSchemaField,
} from './audio-node/audioWorkflowSelectionPatch.js';
import { buildAudioGenerationResultPatch } from './audio-node/audioGenerationResultRenderer.js';
import {
  MULTI_RESULT_BACKPLATE_CLASS,
  MULTI_RESULT_STACK_WRAP_CLASS,
  buildMultiResultBackplateItems,
  buildMultiResultCollapsedFrame,
  buildMultiResultExpandedSlotMap,
  clearMultiResultStackClasses,
  createMultiResultBackplates,
  syncMultiResultStackClasses,
} from './aigenImage/multiResultStackBackplates.js';
import { getAudioWorkflowInputLimit, getAudioWorkflowSlots } from './audio-node/audioWorkflowRefSlots.js';
import { buildAudioWorkflowInputPlan } from './audio-node/audioWorkflowInputPlan.js';
import { bindAudioDownloadAction } from './nodeToolbar/audioActions/downloadAction.js';
import { bindAudioVoiceStudioAction } from './nodeToolbar/audioActions/voiceStudioAction.js';
import { bindPreviewUploadToolbarAction } from '../modules/previewUploadEntry.js';
import {
  bindNodeFooterController,
  bindNodeModelMenuTrigger,
  positionNodeAdvancedPanel,
} from './shared/nodeFooterControls.js';
import { bindGenerationNodeFooterLifecycle } from './shared/generationNodeFooterLifecycle.js';
import {
  createGenerationNodeHelpTipController,
  getGenerationNodeHelpTooltip,
} from './generationNodeHelpTip.js';
import { createPromptPresetTriggerController } from './promptPresetTrigger.js';
import { attachNodePromptExpansion } from './nodePromptExpansion.js';
import {
  getTaskMessage,
  resolveGenerationButtonMode,
  shouldAllowCancel,
  shouldShowGenerationBusyUi,
} from '../core/generationTaskUiState.js';
import { createAudioNodeTaskOrchestration } from './audio-node/taskOrchestrationModule.js';
import {
  shouldDeferRendererDetailsOnMount,
  shouldDeferRendererMediaOnMount,
} from '../core/rendererDeferredMedia.js';
const WAVE_PATH =
  'M10,40 L10,40 M20,20 L20,60 M30,25 L30,55 M40,30 L40,50 M50,22 L50,58 M60,28 L60,52 M70,24 L70,56 M80,20 L80,60 M90,26 L90,54 M100,22 L100,58 M110,30 L110,50 M120,15 L120,65 M130,35 L130,45 M140,30 L140,50 M150,40 L150,40 M160,30 L160,50 M170,22 L170,58 M180,28 L180,52 M190,24 L190,56';
function buildAudioPlaceholderSvg({ width: width = 44, height: height = 44 } = {}) {
  return (
    '<svg class="placeholder-icon-svg" width="' +
    width +
    '" height="' +
    height +
    '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">\n    <path d="M9 18V5l12-2v13"/>\n    <circle cx="6" cy="18" r="3"/>\n    <circle cx="18" cy="16" r="3"/>\n  </svg>'
  );
}
const ADVANCED_VOICE_CLONE_WORKFLOW_KEY = RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  ADVANCED_VOICE_CLONE_MIN_SECONDS = 3,
  ADVANCED_VOICE_CLONE_MAX_SECONDS = 15.05;
function aigenAudioText(value, item = {}) {
  return t('aigenAudioNode.' + value, item);
}
const AUDIO_WORKFLOW_VALIDATORS = Object.freeze({
    indextts2_clone(key) {
      const list = Array.isArray(key?.audioRefs) ? key.audioRefs : [],
        enabled = list.some((index) => String(index?.refSlot || '') === 'audioRef');
      if (!enabled) return aigenAudioText('validation.referenceVoiceRequired');
      const enabled2 = list.some((result) => String(result?.refSlot || '') === 'audio2');
      if (!enabled2 && !String(key?.prompt || '').trim())
        return aigenAudioText('validation.promptRequired');
      return '';
    },
    voice_convert(data) {
      const list2 = Array.isArray(data?.audioRefs) ? data.audioRefs : [],
        enabled3 = list2.some((options) => String(options?.refSlot || '') === 'audioRef'),
        enabled4 = list2.some((target) => String(target?.refSlot || '') === 'audioTarget');
      if (!enabled3 || !enabled4) return aigenAudioText('validation.voiceConvertRefsRequired');
      return '';
    },
    [ADVANCED_VOICE_CLONE_WORKFLOW_KEY](source) {
      if (!String(source?.prompt || '').trim()) return aigenAudioText('validation.promptRequired');
      return '';
    },
  }),
  AUDIO_WORKFLOW_ITEMS = buildAudioWorkflowItems(AUDIO_WORKFLOW_VALIDATORS),
  AUDIO_WORKFLOW_MAP = new Map(AUDIO_WORKFLOW_ITEMS.map((event) => [event.key, event])),
  AUDIO_WORKFLOW_LABEL_MAP = new Map(
    AUDIO_WORKFLOW_ITEMS.map((event2) => [event2.label, event2.key]),
  );
export function doesAudioWorkflowAcceptTextInput(next = '') {
  const modelManifest = getModelManifest(String(next || '').trim()),
    list3 = modelManifest?.inputSlots?.allowedKinds;
  if (!Array.isArray(list3)) return true;
  return list3.map((current) => String(current || '').trim()).includes('text');
}
function resolveAudioWorkflowPromptPlaceholder(entry = '') {
  const modelManifest2 = getModelManifest(String(entry || '').trim());
  return (
    String(modelManifest2?.prompt?.placeholder || '').trim() || aigenAudioText('prompt.placeholder')
  );
}
function syncAudioPromptPlaceholder(el, record = '') {
  if (!el) return;
  const audioWorkflowPromptPlaceholder = resolveAudioWorkflowPromptPlaceholder(record);
  if (el.dataset) {
    el.dataset.placeholder = audioWorkflowPromptPlaceholder;
    return;
  }
  el.setAttribute?.('data-placeholder', audioWorkflowPromptPlaceholder);
}
const TEXT_INPUT_TYPES = new Set(['source-text', 'text', 'ai-text', 'custom-ai-text']),
  AUDIO_INPUT_TYPES = new Set(['source-audio', 'audio', 'ai-audio']),
  AUDIO_PLAY_LOADING_DEADLINE_MS = 5000,
  VIDEO_INPUT_TYPES = new Set(['source-video', 'video', 'ai-video']),
  AUDIO_RESULT_WIDTH = 420,
  AUDIO_RESULT_HEIGHT = 180,
  AUDIO_RESULT_RATIO = AUDIO_RESULT_WIDTH / AUDIO_RESULT_HEIGHT,
  getStoreSnapshot = () =>
    typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function getWorkflowGateModelId(payload) {
  if (!isVipModel(payload, 'runninghubwf')) return '';
  return resolveVipGateModelId(payload, 'runninghubwf');
}
function escapeAudioWorkflowIconText(handle) {
  return String(handle ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function createDynamicWorkflowItemFromManifest(state) {
  const enabled5 = String(state || '').trim();
  if (!enabled5) return null;
  const key2 = getModelManifest(enabled5),
    enabled6 = key2?.extensions?.customProvider,
    label = key2?.extensions?.audioMenu || {};
  if (
    !key2 ||
    key2.kind !== 'audio' ||
    !['workflow', 'modelApi'].includes(key2.adapterType) ||
    (key2.provider !== 'runninghubwf' && !isCustomAiAppManifest(key2) && !enabled6)
  )
    return null;
  return Object.freeze({
    key: key2.modelId,
    label: label.label || key2.displayName || key2.modelId,
    subtitle: label.subtitle || key2.description || '',
    icon: key2.icon || 'images/RH.png',
    iconAlt: 'runninghub',
    iconHtml:
      label.iconKind === 'customProviderBadge'
        ? '<div class="node-menu-icon node-menu-icon-badge">' +
          escapeAudioWorkflowIconText(String(enabled6?.badge || 'CP').slice(0, 2)) +
          '</div>'
        : '',
    provider: key2.provider,
    adapterType: key2.adapterType,
    executionId: key2.executionId || '',
    async: key2.async === true,
    cancellable: key2.cancellable === true,
    vip: key2.vip === true,
    group: isCustomAiAppManifest(key2) ? 'rhAiApp' : label.group || 'runninghubWorkflow',
    validate: () => '',
  });
}
function getWorkflowByKey(config) {
  const scope = String(config || '').trim();
  return AUDIO_WORKFLOW_MAP.get(scope) || createDynamicWorkflowItemFromManifest(scope);
}
function resolveWorkflowKeyFromNodeData(options2 = {}) {
  const input = [options2.audioWorkflowKey, options2.model, options2.audioWorkflowLabel].map((output) => String(output || '').trim());
  for (const enabled7 of input) {
    if (!enabled7) continue;
    const value2 =
      (AUDIO_WORKFLOW_MAP.has(enabled7) ? enabled7 : '') ||
      AUDIO_WORKFLOW_LABEL_MAP.get(enabled7) ||
      '';
    if (value2) return value2;
    const event3 = createDynamicWorkflowItemFromManifest(enabled7);
    if (event3?.key) return event3.key;
  }
  return '';
}
function getDefaultWorkflow() {
  return AUDIO_WORKFLOW_ITEMS[0];
}
export { isRunningHubAudioWorkflowItem };
function getPlainGenerationParams(args) {
  return args && typeof args === 'object' && !Array.isArray(args) ? { ...args } : {};
}
function resolveWorkflowSchemaParam(value3, value4, value5) {
  const audioWorkflowUiSchemaField = getAudioWorkflowUiSchemaField(value4, value5);
  if (!audioWorkflowUiSchemaField) throw new Error('RunningHub audio manifest ' + value4 + ' missing ' + value5);
  if (audioWorkflowUiSchemaField.defaultValue === undefined)
    throw new Error(
      'RunningHub audio manifest ' + value4 + ' missing ' + value5 + ' defaultValue',
    );
  const plainGenerationParams = getPlainGenerationParams(value3?.generationParams),
    value6 = Object.prototype.hasOwnProperty.call(plainGenerationParams, value5)
      ? plainGenerationParams[value5]
      : audioWorkflowUiSchemaField.defaultValue;
  if (value6 === undefined || value6 === null || String(value6).trim() === '')
    throw new Error('RunningHub audio manifest ' + value4 + ' missing ' + value5);
  return value6;
}
function normalizePromptForBackend(value7, value8) {
  if (!doesAudioWorkflowAcceptTextInput(value7)) return '';
  const value9 = String(value8 || '').trim();
  if (value7 !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY) return value9;
  return value9.replace(/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    .replace(/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]: ')
    .replace(/\s+(\[speaker_[12]\]:)/g, '\n$1')
    .trim();
}
function toLocalAssetUrl(value10) {
  return localPathToUrl(value10);
}
function isLikelyImageUrl(value11) {
  const enabled8 = String(value11 || '')
    .trim()
    .toLowerCase();
  if (!enabled8) return false;
  if (enabled8.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i.test(enabled8);
}
function localUrlFromPath(value12) {
  return localPathToUrl(value12);
}
function normalizeAudioRemoteUrl(value13) {
  const enabled9 = String(value13 || '').trim();
  if (!enabled9) return '';
  if (enabled9.startsWith('/')) return enabled9;
  if (/^data:/i.test(enabled9)) return enabled9;
  if (/^blob:/i.test(enabled9)) return enabled9;
  if (enabled9.startsWith('//')) return 'https:' + enabled9;
  if (/^https?:\/\//i.test(enabled9)) return enabled9;
  return 'https://' + enabled9.replace(/^\/+/, '');
}
export class AIGenAudioNode {
  constructor(value14) {
    ((this._data = value14),
      (this.nodeId = value14.id),
      (this.previewEl = null),
      (this.audioEl = null),
      (this._placeholderEl = null),
      (this.refBarEl = null),
      (this.promptEl = null),
      (this.btnEl = null),
      (this.modelWrap = null),
      (this._currentSrc = null),
      (this._audioLoadToken = 0),
      (this._audioLoadInFlightSource = ''),
      (this._audioLoadInFlightPreload = ''),
      (this._audioPlayAttemptToken = 0),
      (this._audioPlayDeadlineTimer = null),
      (this._audioPlayPending = false),
      (this._playbackResumeSource = ''),
      (this._playbackResumeTime = 0),
      (this._lastEdgeSig = null),
      (this._isGenerating = false),
      (this._modelMenu = null),
      (this._runninghubSubmenu = null),
      (this._modelLabelEl = null),
      (this._workflowSchemaSlotElements = null),
      (this._lastRenderedWorkflowKey = ''),
      (this._docClickHandler = null),
      (this._submenuCloseTimer = null),
      (this._unbindRefThumbHoverPreview = null),
      (this._attachBtnIcon = null),
      (this._audioRefUploadInput = null),
      (this._audioRefUploadSlot = ''),
      (this._audioRefUploadAnchorNodeId = ''),
      (this._lastRefMediaSig = ''),
      (this._lastWorkflowKey = ''),
      (this._refBarWorkflowKey = ''),
      (this._speedIdx = 0),
      (this._audioCard = null),
      (this._audioMainSurface = null),
      (this._audioMultiResultsContainer = null),
      (this._audioMultiStackWrap = null),
      (this._audioMultiBackdropWrap = null),
      (this._audioMultiToggleBtn = null),
      (this._audioMultiBackplateEls = []),
      (this._lastAudioResultsKeyStr = ''),
      (this._lastMainAudioIndex = 0),
      (this._lastIsAudiosExpanded = false),
      (this._waveBgEl = null),
      (this._wavePlayed = null),
      (this._progressLine = null),
      (this._bar = null),
      (this._controlsEl = null),
      (this._playBtn = null),
      (this._timeEl = null),
      (this._waveBgPath = null),
      (this._waveFgPath = null),
      (this._waveformLocalPath = ''),
      (this._waveToken = 0),
      (this._cancelDeferredWaveform = null),
      (this._waveformAbortController = null),
      (this._statusOverlayEl = null),
      (this._isSeeking = false),
      (this._progressController = null),
      (this._audioDurationProbeToken = 0),
      (this._promptPanel = null),
      (this._promptInputWrap = null),
      (this._isPromptBoxResizing = false),
      (this._promptResizeHandle = false),
      (this._promptResizeCleanup = null),
      (this._rhCancelInFlight = false),
      (this._assetMentionRegistryUnsubscribe = null),
      (this._assetMentionRegistryRefreshPending = false),
      (this._vipInstallId = ''),
      (this._vipSelectionRetryInProgress = false),
      (this._generationNodeHelpTip = null),
      (this._modelProviderProfileControl = null),
      (this._uiSchemaCleanup = null),
      (this._footerControllerCleanup = null),
      (this._unsubscribeLocale = null),
      (this._toolbarActionCleanups = []),
      (this.footerEl = null),
      (this._rendererDetailsDeferred = shouldDeferRendererDetailsOnMount(value14)),
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(value14)),
      (this._audioTaskOrchestration = createAudioNodeTaskOrchestration({
        nodeId: this.nodeId,
        store: appStore,
        api: {
          generateAudio: generateAudio,
          resumeRunningHubAudioTask: resumeRunningHubAudioTask,
          cancelRunningHubAudioTask: cancelRunningHubAudioTask,
        },
        ensureConfig: ensureConfig,
        getProviderConfig: getProviderConfig,
        buildResultPatch: (value15, value16) => this._buildAudioResultPatch(value15, value16),
        afterResultCommit: (value17, value18) =>
          this._applyAudioResultProjection(value17, value18),
        persistTaskState: () => this._persistRunningHubResumeCache(),
        setBusyState: ({ isGenerating: isGenerating, cancelInFlight: cancelInFlight }) => {
          ((this._isGenerating = isGenerating),
            (this._rhCancelInFlight = cancelInFlight),
            this._setGeneratingUi());
        },
        setLoading: (value19) => {
          if (!this.previewEl) return;
          if (value19) startLoading(this.previewEl);
          else stopLoading(this.previewEl);
        },
        onSuccess: (value20, { recovering: recovering = false } = {}) => {
          if (recovering) return;
          window.showToast?.(aigenAudioText('generation.completed'), 'success');
        },
        onFailure: (value21, value22) => this._handleAudioTaskFailure(value21, value22),
        messages: {
          generationFailed: () => aigenAudioText('generation.failed'),
          interrupted: () => aigenAudioText('generation.interrupted'),
          interruptedMissingTaskId: () => aigenAudioText('cancel.interruptedMissingTaskId'),
          cancelSuccess: () => aigenAudioText('cancel.success'),
          cancelFailed: () => aigenAudioText('cancel.failed'),
          cancelTaskMissing: () => aigenAudioText('cancel.taskMissing'),
          missingApiKey: () => aigenAudioText('cancel.missingApiKey'),
        },
      })));
  }
  ['_getCurrentWorkflow']() {
    const workflowKeyFromNodeData = resolveWorkflowKeyFromNodeData(this._data);
    return getWorkflowByKey(workflowKeyFromNodeData) || getDefaultWorkflow();
  }
  ['_syncWorkflowDefaults']() {
    const workflow = this._getCurrentWorkflow(),
      nodeData = getStoreSnapshot().nodes?.[this.nodeId] || this._data,
      args2 = buildAudioWorkflowDefaultSyncPatch({ nodeData: nodeData, workflow: workflow });
    if (!Object.keys(args2).length) return;
    (appStore.updateNodeData(this.nodeId, args2), (this._data = { ...nodeData, ...args2 }));
  }
  ['_setSelectedWorkflow'](value23) {
    const workflow2 = getWorkflowByKey(value23);
    if (!workflow2) return;
    if (
      !this._guardVipWorkflowSelection(workflow2.key, () => {
        this._vipSelectionRetryInProgress = true;
        try {
          this._setSelectedWorkflow(workflow2.key);
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      })
    )
      return;
    const nodeData2 = appStore.getState?.()?.nodes?.[this.nodeId] || this._data,
      args3 = buildAudioWorkflowSelectionPatch({ nodeData: nodeData2, workflow: workflow2 });
    (appStore.updateNodeData(this.nodeId, args3),
      (this._data = { ...this._data, ...args3 }),
      this._enforceWorkflowAudioInputLimit(),
      (this._lastEdgeSig = null),
      (this._lastRefMediaSig = ''),
      (this._lastWorkflowKey = ''),
      (this._lastRenderedWorkflowKey = ''),
      (this._refBarWorkflowKey = ''),
      this._renderRefBar(),
      this._refreshWorkflowUi(),
      this._updateSubmitButtonState());
  }
  ['_closeModelMenu']() {
    this._modelMenu?.classList.remove('show');
    if (this._runninghubSubmenu) this._runninghubSubmenu.style.display = 'none';
    this._submenuCloseTimer &&
      (clearTimeout(this._submenuCloseTimer), (this._submenuCloseTimer = null));
  }
  ['_openSubmenu']() {
    if (!this._runninghubSubmenu) return;
    (this._submenuCloseTimer &&
      (clearTimeout(this._submenuCloseTimer), (this._submenuCloseTimer = null)),
      (this._runninghubSubmenu.style.display = 'flex'));
  }
  ['_scheduleCloseSubmenu']() {
    if (this._submenuCloseTimer) clearTimeout(this._submenuCloseTimer);
    this._submenuCloseTimer = setTimeout(() => {
      if (this._runninghubSubmenu) this._runninghubSubmenu.style.display = 'none';
      this._submenuCloseTimer = null;
    }, 150);
  }
  ['_refreshWorkflowUi']() {
    const workflow3 = this._getCurrentWorkflow(),
      storeSnapshot = getStoreSnapshot().nodes?.[this.nodeId] || this._data;
    this._data !== storeSnapshot && (this._data = storeSnapshot);
    if (this._modelLabelEl) this._modelLabelEl.textContent = workflow3.label;
    (this._syncPromptInputVisibility(workflow3.key), this._syncAudioPromptHelpTip(workflow3.key));
    const syncAudioWorkflowSchemaSlots2 = syncAudioWorkflowSchemaSlots({
      root: this._root,
      workflow: workflow3,
      nodeData: this._data,
      elements: this._workflowSchemaSlotElements,
      lastRenderedWorkflowKey: this._lastRenderedWorkflowKey,
    });
    ((this._lastRenderedWorkflowKey = syncAudioWorkflowSchemaSlots2.lastRenderedWorkflowKey),
      this._runninghubSubmenu?.querySelectorAll('.floating-menu-item').forEach((el2) => {
        el2.classList.toggle('active', el2.dataset.value === workflow3.key);
      }),
      this._modelMenu
        ?.querySelectorAll('.node-menu-submenu .floating-menu-item')
        .forEach((el3) => {
          el3.classList.toggle('active', el3.dataset.value === workflow3.key);
        }),
      this._syncModelProviderProfileControl());
  }
  ['refreshModelRegistryUi']() {
    if (this._rendererDetailsDeferred === true || !this.footerEl) return false;
    return (
      this._renderFooter(this.footerEl),
      this._refreshWorkflowUi(),
      this._updateSubmitButtonState(),
      true
    );
  }
  ['_getGenerationNodeHelpText'](key3 = this._getCurrentWorkflow().key) {
    return getGenerationNodeHelpTooltip({ kind: 'audio', key: key3 });
  }
  ['_ensureGenerationNodeHelpTip']() {
    if (this._generationNodeHelpTip || !this._promptPanel) return this._generationNodeHelpTip;
    return (
      (this._generationNodeHelpTip = createGenerationNodeHelpTipController({
        panel: this._promptPanel,
        getHelpText: () => this._getGenerationNodeHelpText(),
        ariaLabel: aigenAudioText('help.ariaLabel'),
      })),
      this._generationNodeHelpTip
    );
  }
  ['_syncAudioPromptHelpTip']() {
    this._ensureGenerationNodeHelpTip()?.sync();
  }
  ['_ensureModelProviderProfileControl']() {
    if (this._modelProviderProfileControl || !this._promptPanel)
      return this._modelProviderProfileControl;
    return (
      (this._modelProviderProfileControl = createModelProviderProfileControl({
        panel: this._promptPanel,
        getNodeData: () => appStore.getState().nodes?.[this.nodeId] || this._data || {},
        onChange: (value24) => appStore.updateNodeData(this.nodeId, value24),
      })),
      this._modelProviderProfileControl
    );
  }
  ['_syncModelProviderProfileControl']() {
    this._ensureModelProviderProfileControl()?.sync();
  }
  ['_syncPromptInputVisibility'](value25 = this._getCurrentWorkflow().key) {
    if (!this._promptInputWrap || !this.promptEl) return;
    const doesAudioWorkflowAcceptTextInput2 = doesAudioWorkflowAcceptTextInput(value25);
    ((this._promptInputWrap.hidden = !doesAudioWorkflowAcceptTextInput2),
      this._promptInputWrap.classList.toggle('is-hidden', !doesAudioWorkflowAcceptTextInput2),
      this.promptEl.setAttribute('aria-hidden', doesAudioWorkflowAcceptTextInput2 ? 'false' : 'true'),
      (this.promptEl.contentEditable = doesAudioWorkflowAcceptTextInput2 ? 'true' : 'false'),
      syncAudioPromptPlaceholder(this.promptEl, value25));
  }
  ['_resolveAudioRefUrl'](value26) {
    return resolveCanvasAudioUrl(value26);
  }
  ['_getAudioResultItems'](waveformLocalPath = this._data) {
    const list4 = Array.isArray(waveformLocalPath?.audios) ? waveformLocalPath.audios : [];
    if (list4.length > 0)
      return list4.filter((value27) => value27 && typeof value27 === 'object')
        .map((args4) => ({
          ...args4,
          audioUrl: resolveCanvasAudioUrl(args4) || String(args4.audioUrl || '').trim(),
        }))
        .filter((value28) => String(value28.audioUrl || value28.localPath || '').trim());
    const audioUrl = resolveCanvasAudioUrl(waveformLocalPath);
    if (!audioUrl) return [];
    return [
      {
        audioUrl: audioUrl,
        src: audioUrl,
        localPath: normalizeLocalPath(waveformLocalPath?.localPath || audioUrl),
        waveformLocalPath: waveformLocalPath?.waveformLocalPath,
        audioDuration: waveformLocalPath?.audioDuration,
        assetId: waveformLocalPath?.assetId,
        derivativeStatus: waveformLocalPath?.derivativeStatus,
        fileName: waveformLocalPath?.fileName,
      },
    ];
  }
  ['_getMainAudioIndex'](value29 = this._data, value30 = 0) {
    const count = Number(value29?.mainAudioIndex);
    if (!Number.isFinite(count) || count < 0) return 0;
    return Math.min(Math.max(0, Math.trunc(count)), Math.max(0, value30 - 1));
  }
  ['_resolveNodeAudioUrl'](value31) {
    const list5 = this._getAudioResultItems(value31);
    if (list5.length > 0) {
      const value32 = this._getMainAudioIndex(value31, list5.length);
      return resolveCanvasAudioUrl(list5[value32] || list5[0]) || '';
    }
    return '';
  }
  ['_applyAudioMultiToggleVisual'](enabled10, value33) {
    const el4 = this._audioMultiToggleBtn;
    if (!el4) return;
    (el4.classList.toggle('is-expanded', !!enabled10),
      (el4.innerHTML = enabled10
        ? '<span>' +
          value33 +
          '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
        : '<span>' +
          value33 +
          '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'));
  }
  ['_clearAudioMultiResultStack']() {
    (this._audioMultiResultsContainer && this._audioMultiResultsContainer.remove(),
      this._audioMultiToggleBtn && this._audioMultiToggleBtn.remove(),
      clearMultiResultStackClasses({ previewEl: this.previewEl, stackWrap: this._audioMultiStackWrap }),
      (this._audioMultiResultsContainer = null),
      (this._audioMultiStackWrap = null),
      (this._audioMultiBackdropWrap = null),
      (this._audioMultiToggleBtn = null),
      (this._audioMultiBackplateEls = []),
      (this._lastAudioResultsKeyStr = ''));
  }
  ['_applyAudioMultiStackLayout']({ count: count2, mainIndex: mainIndex, expanded: expanded }) {
    if (!this.previewEl || !this._audioMultiBackdropWrap) return;
    const previewWidth = this.previewEl.offsetWidth || this._data?.width || AUDIO_RESULT_WIDTH,
      previewHeight = this.previewEl.offsetHeight || this._data?.height || AUDIO_RESULT_HEIGHT,
      gap = 12,
      value34 = 38,
      value35 = 18,
      value36 = Math.max(1, previewWidth - value34 - 4),
      value37 = Math.max(1, previewHeight - value35 * 2),
      map = buildMultiResultExpandedSlotMap({
        imageCount: count2,
        mainIndex: mainIndex,
        previewWidth: previewWidth,
        previewHeight: previewHeight,
        gap: gap,
      });
    this._audioMultiBackdropWrap
      .querySelectorAll('.' + MULTI_RESULT_BACKPLATE_CLASS)
      .forEach((el5) => {
        const value38 = Number(el5.dataset?.imageIndex),
          value39 = Math.max(1, Number(el5.dataset?.stackIndex) || 1),
          box = buildMultiResultCollapsedFrame(value39),
          box2 = map.get(value38),
          display = !!expanded && !!box2,
          el6 = el5.querySelector('.multi-stack-backplate-media'),
          value40 =
            'translate(' +
            box.x +
            'px, ' +
            box.y +
            'px) rotate(' +
            box.rotate +
            'deg) scale(' +
            box.scale +
            ')';
        (Object.assign(el5.style, {
          display: display ? 'block' : 'none',
          top: display ? box2.top + 'px' : value35 + 'px',
          left: display ? box2.left + 'px' : value34 + 'px',
          width: display ? previewWidth + 'px' : value36 + 'px',
          height: display ? previewHeight + 'px' : value37 + 'px',
          opacity: display ? '1' : String(box.opacity),
          pointerEvents: display ? 'auto' : 'none',
          zIndex: display ? String(2 + box2.order) : String(value39),
          borderRadius: display ? '18px' : '0 var(--radius-16) var(--radius-16) 0',
          transform: display ? 'translate(0px, 0px) rotate(0deg) scale(1)' : value40,
          filter: display ? 'brightness(1) saturate(1)' : 'brightness(0.86) saturate(0.92)',
          transformOrigin: display ? 'bottom left' : 'center right',
        }),
          el5.classList.toggle('is-expanded-card', display),
          el6 &&
            ((el6.style.opacity = display ? '1' : '0'),
            (el6.style.transform = display ? 'scale(1)' : 'scale(1.02)')));
      });
  }
  ['_syncAudioMultiResultStack'](enabled11 = this._data) {
    if (!this.previewEl) return;
    const list6 = this._getAudioResultItems(enabled11),
      imageCount = list6.length;
    if (imageCount <= 1) {
      this._clearAudioMultiResultStack();
      return;
    }
    this._root?.style.setProperty('overflow', 'visible');
    const mainIndex2 = this._getMainAudioIndex(enabled11, imageCount),
      isExpanded = !!enabled11?.isAudiosExpanded,
      value41 = list6.map((value42) =>
        [String(value42.audioUrl || ''), String(value42.localPath || '')].join('|'),
      ).join('||'),
      value43 =
        value41 !== this._lastAudioResultsKeyStr ||
        mainIndex2 !== this._lastMainAudioIndex ||
        !this._audioMultiResultsContainer ||
        !this._audioMultiStackWrap ||
        !this._audioMultiBackdropWrap;
    if (value43) {
      this._clearAudioMultiResultStack();
      const el7 = document.createElement('div');
      el7.className = 'audio-multi-results-container';
      const el8 = document.createElement('div');
      el8.className = MULTI_RESULT_STACK_WRAP_CLASS;
      const items = buildMultiResultBackplateItems({ imageCount: imageCount, mainIndex: mainIndex2 }),
        el9 = createMultiResultBackplates(document, imageCount, { items: items });
      el9 &&
        (el8.appendChild(el9),
        el9.querySelectorAll('.' + MULTI_RESULT_BACKPLATE_CLASS).forEach((el10) => {
          const value44 = Number(el10.dataset?.imageIndex);
          if (!Number.isFinite(value44)) return;
          this._audioMultiBackplateEls[value44] = el10;
          const el11 = document.createElement('div');
          ((el11.className = 'multi-stack-backplate-media audio-multi-wave-preview'),
            (el11.innerHTML =
              '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n              <path d="' +
              WAVE_PATH +
              '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n              <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n            </svg>'),
            el10.appendChild(el11),
            el10.addEventListener('pointerdown', (event4) => {
              const value45 = appStore.getState().nodes?.[this.nodeId] || {};
              if (value45?.isAudiosExpanded) event4.stopPropagation();
            }),
            el10.addEventListener('click', (event5) => {
              const enabled12 = appStore.getState().nodes?.[this.nodeId] || {};
              if (!enabled12?.isAudiosExpanded) return;
              (event5.preventDefault(),
                event5.stopPropagation(),
                this._selectMainAudioResult(Number(el10.dataset?.imageIndex)));
            }));
        }));
      const el12 = document.createElement('button');
      ((el12.type = 'button'),
        (el12.className = 'multi-toggle-btn audio-multi-toggle-btn'),
        el12.addEventListener('pointerdown', (event6) => {
          if (event6.button !== 0) return;
          (event6.preventDefault(), event6.stopPropagation());
          const value46 = appStore.getState().nodes?.[this.nodeId] || {};
          if (value46?.isAudiosExpanded) {
            this._selectMainAudioResult(value46.mainAudioIndex ?? this._lastMainAudioIndex ?? 0);
            return;
          }
          appStore.updateNodeData(this.nodeId, { isAudiosExpanded: true });
        }),
        el12.addEventListener('click', (event7) => {
          (event7.preventDefault(), event7.stopPropagation());
        }),
        el7.appendChild(el8),
        this._audioMainSurface && this._audioMainSurface.parentNode === this.previewEl
          ? this.previewEl.insertBefore(el7, this._audioMainSurface)
          : this.previewEl.appendChild(el7),
        this.previewEl.appendChild(el12),
        (this._audioMultiResultsContainer = el7),
        (this._audioMultiStackWrap = el8),
        (this._audioMultiBackdropWrap = el9),
        (this._audioMultiToggleBtn = el12),
        (this._lastAudioResultsKeyStr = value41));
    }
    (syncMultiResultStackClasses({
      previewEl: this.previewEl,
      stackWrap: this._audioMultiStackWrap,
      isActive: imageCount > 1,
      isExpanded: isExpanded,
    }),
      this._applyAudioMultiToggleVisual(isExpanded, imageCount),
      this._applyAudioMultiStackLayout({ count: imageCount, mainIndex: mainIndex2, expanded: isExpanded }),
      (this._lastMainAudioIndex = mainIndex2),
      (this._lastIsAudiosExpanded = isExpanded));
  }
  ['_selectMainAudioResult'](value47 = 0) {
    const value48 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      list7 = this._getAudioResultItems(value48);
    if (list7.length === 0) return;
    const mainAudioIndex = Number.isFinite(Number(value47))
        ? Math.min(list7.length - 1, Math.max(0, Math.trunc(Number(value47))))
        : 0,
      value49 = list7[mainAudioIndex] || list7[0],
      audioUrl2 = resolveCanvasAudioUrl(value49);
    if (!audioUrl2) return;
    const value50 = {
      mainAudioIndex: mainAudioIndex,
      isAudiosExpanded: false,
      audioUrl: audioUrl2,
      src: audioUrl2,
      localPath: normalizeLocalPath(value49.localPath || audioUrl2),
    };
    for (const value51 of [
      'waveformLocalPath',
      'assetId',
      'derivativeStatus',
      'fileName',
      'audioDuration',
    ]) {
      if (value49[value51] !== undefined) value50[value51] = value49[value51];
    }
    appStore.updateNodeData(this.nodeId, value50);
  }
  ['_resolveVideoRefUrl'](value52) {
    const value53 = Number.isFinite(Number(value52?.mainVideoIndex))
        ? Math.max(0, Math.trunc(Number(value52.mainVideoIndex)))
        : 0,
      value54 = Array.isArray(value52?.videos)
        ? value52.videos[value53] || value52.videos[0]
        : null;
    return resolveCanvasVideoUrl(value54) || resolveCanvasVideoUrl(value52);
  }
  async ['_persistAudioOutput'](value55) {
    const audioRemoteUrl = normalizeAudioRemoteUrl(value55);
    if (!audioRemoteUrl) return { localPath: '', audioUrl: '' };
    const localPath = normalizeLocalPath(audioRemoteUrl);
    if (localPath) {
      const localPath2 = localPath;
      return { localPath: localPath2, audioUrl: localUrlFromPath(localPath2) };
    }
    try {
      const saveRemoteAudioLocallyDetailed2 = await saveRemoteAudioLocallyDetailed(audioRemoteUrl),
        localPath3 = pickResultLocalPath(saveRemoteAudioLocallyDetailed2);
      if (localPath3) {
        const audioDuration = pickAudioDurationSec(saveRemoteAudioLocallyDetailed2?.audioDuration, saveRemoteAudioLocallyDetailed2?.duration);
        return {
          ...(saveRemoteAudioLocallyDetailed2 && typeof saveRemoteAudioLocallyDetailed2 === 'object' ? saveRemoteAudioLocallyDetailed2 : {}),
          localPath: localPath3,
          audioUrl: localUrlFromPath(localPath3),
          ...(audioDuration > 0 ? { audioDuration: audioDuration } : {}),
        };
      }
    } catch (error) {
      console.error('[AIGenAudioNode] 音频落盘失败:', error);
      const value56 = error?.message ? ': ' + error.message : '';
      throw new Error(aigenAudioText('errors.localSaveGeneratedFailed') + value56);
    }
    throw new Error(aigenAudioText('errors.localSaveGeneratedFailed'));
  }
  ['_persistRunningHubResumeCache']() {
    try {
      window._triggerLocalCacheSave?.();
    } catch {}
  }
  ['_isRunningHubRecoverableRunningTask'](value57 = this._data) {
    const value58 = String(value57?.provider || '')
      .trim()
      .toLowerCase();
    if (value58 !== 'runninghubwf' && value58 !== 'runninghub') return false;
    const enabled13 = String(value57?.rhTaskId || '').trim();
    if (!enabled13) return false;
    const value59 = String(value57?.rhTaskStatus || '')
      .trim()
      .toLowerCase();
    if (
      value59 === 'success' ||
      value59 === 'failed' ||
      value59 === 'idle' ||
      value59 === 'cancelled'
    )
      return false;
    return true;
  }
  ['_stopRunningHubRecovery'](resetRecovering = false) {
    this._audioTaskOrchestration?.resetRecovery({ resetRecovering: resetRecovering });
  }
  ['_setGeneratingUi']() {
    if (!this.btnEl) return;
    const value60 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      value61 = String(value60?.provider || 'runninghubwf').toLowerCase(),
      cancellable = value61 === 'runninghubwf' || value61 === 'runninghub',
      el13 = resolveGenerationButtonMode(value60, {
        cancellable: cancellable,
        cancelInFlight: this._rhCancelInFlight === true,
      });
    if (el13.busy) {
      cancellable
        ? setGenerateButtonCancellableUi(this.btnEl, {
            title: aigenAudioText('buttons.generateCancellable'),
            tooltip: aigenAudioText('buttons.generateCancellable'),
            ariaLabel: aigenAudioText('buttons.cancelAudioGeneration'),
            color: 'var(--red)',
            busy: true,
          })
        : setGenerateButtonLoadingUi(this.btnEl, {
            title: aigenAudioText('buttons.generate'),
            disabled: true,
            ariaLabel: aigenAudioText('buttons.generate'),
          });
      ((this.btnEl.disabled = el13.disabled),
        (this.btnEl.style.cursor = el13.cursor));
      return;
    }
    (resetGenerateButtonIdleUi(this.btnEl, aigenAudioText('buttons.generate')),
      this._updateSubmitButtonState());
  }
  ['_guardVipWorkflowSelection'](value62, onSuccess = null) {
    const modelId = getWorkflowGateModelId(value62);
    if (!modelId) return true;
    const run = window.isModelAllowedBySubscription,
      value63 = typeof run === 'function' ? run(modelId, 'runninghubwf') : true;
    if (value63) return true;
    if (this._vipSelectionRetryInProgress) return false;
    return (
      typeof window.openSubscriptionDialog === 'function'
        ? window.openSubscriptionDialog({
            modelId: modelId,
            provider: 'runninghubwf',
            onSuccess: onSuccess,
          })
        : window.showToast?.(aigenAudioText('vip.needAuthorization'), 'warn'),
      false
    );
  }
  async ['runGeneration'](options3 = {}) {
    return this._onGenerate(null, options3);
  }
  async ['cancelGeneration']() {
    return this._audioTaskOrchestration.cancelGeneration();
  }
  ['getGenerationStatus']() {
    return this._audioTaskOrchestration.getGenerationStatus();
  }
  async ['_handleGenerateOrCancel'](value64 = null) {
    const value65 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      value66 = String(value65?.provider || 'runninghubwf')
        .trim()
        .toLowerCase(),
      cancellable2 = value66 === 'runninghubwf' || value66 === 'runninghub';
    if (
      shouldAllowCancel(value65, {
        cancellable: cancellable2,
        cancelInFlight: this._rhCancelInFlight === true,
      })
    ) {
      await this._cancelRunningHubWorkflowTask();
      return;
    }
    await this._onGenerate(value64);
  }
  async ['_cancelRunningHubWorkflowTask']() {
    return this._audioTaskOrchestration.cancelGeneration();
  }
  async ['_buildAudioResultPatch'](value67, startedAt) {
    const audioGenerationResultPatch = await buildAudioGenerationResultPatch(value67, {
      startedAt: startedAt,
      persistAudioOutput: (value68) => this._persistAudioOutput(value68),
    });
    if (!audioGenerationResultPatch?.audioUrl || !audioGenerationResultPatch?.localPath)
      throw new Error(aigenAudioText('errors.localSaveGeneratedFailed'));
    return audioGenerationResultPatch;
  }
  ['_applyAudioResultProjection'](audioUrl3, value69) {
    const finalUrl = {
      audioUrl: audioUrl3.audioUrl,
      src: audioUrl3.src,
      localPath: audioUrl3.localPath,
      audioDuration: audioUrl3.audioDuration,
      waveformLocalPath: audioUrl3.waveformLocalPath,
      assetId: audioUrl3.assetId,
      derivativeStatus: audioUrl3.derivativeStatus,
      fileName: audioUrl3.fileName,
    };
    return (
      this._dispatchGenerationHistoryAudio(audioUrl3.audios || finalUrl, value69),
      this._applyResultWideLayout({ ...this._data, ...audioUrl3, ...finalUrl }, true),
      this._syncAudioMultiResultStack({ ...this._data, ...audioUrl3, ...finalUrl }),
      { finalUrl: finalUrl.audioUrl, finalLocalPath: finalUrl.localPath, patch: audioUrl3 }
    );
  }
  async ['_applyAudioResultAndStore'](value70, value71, { writeStore: writeStore = true } = {}) {
    const value72 = await this._buildAudioResultPatch(value70, value71);
    if (writeStore) appStore.updateNodeData(this.nodeId, value72);
    return this._applyAudioResultProjection(value72, value71);
  }
  ['_dispatchGenerationHistoryAudio'](value73, startedAt2) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    const audios = (Array.isArray(value73) ? value73 : [value73]).filter(
      (value74) =>
        value74 &&
        typeof value74 === 'object' &&
        String(value74.audioUrl || value74.localPath || '').trim(),
    );
    if (audios.length === 0) return;
    const nodeData3 = appStore.getState().nodes?.[this.nodeId] || this._data || {};
    try {
      window.dispatchEvent(
        new CustomEvent(GENERATION_HISTORY_EVENT, {
          detail: {
            kind: 'audio',
            sourceNodeId: this.nodeId,
            nodeData: nodeData3,
            audios: audios,
            startedAt: startedAt2,
            createdAt: Date.now(),
          },
        }),
      );
    } catch {}
  }
  async ['_maybeResumeRunningHubTask']() {
    const storeSnapshot2 = getStoreSnapshot().nodes?.[this.nodeId] || this._data || {};
    if (this._isGenerating && storeSnapshot2?.rhTaskRecovering !== true) return null;
    if (!this._isRunningHubRecoverableRunningTask(storeSnapshot2))
      return (this._stopRunningHubRecovery(false), null);
    const payload2 = await this._buildPayload();
    if (!payload2) return null;
    return this._audioTaskOrchestration.resumeIfNeeded({
      payload: payload2,
      startedAt: Number(
        storeSnapshot2?.rhTaskStartedAt || storeSnapshot2?.generationStartTime || Date.now(),
      ),
    });
  }
  ['_applyResultWideLayout'](value75 = null, enabled14 = false) {
    const box3 = value75 || this._data || {},
      enabled15 = this._resolveNodeAudioUrl(box3);
    if (!enabled15) return;
    const count3 = Number(box3.width || 0),
      count4 = Number(box3.height || 0);
    if (!enabled14 && count3 > 0 && count4 > 0) {
      const count5 = count3 / count4,
        value76 =
          count5 >= 2 &&
          count3 >= AUDIO_RESULT_WIDTH - 20 &&
          count4 <= AUDIO_RESULT_HEIGHT + 40,
        value77 = Math.abs(count5 - AUDIO_RESULT_RATIO) <= 0.08;
      if (value76 || value77) return;
    }
    const value78 = count3 > 0 ? count3 : AUDIO_RESULT_WIDTH,
      value79 = count4 > 0 ? count4 : AUDIO_RESULT_HEIGHT,
      value80 = Number(box3.x || 0) + value78 / 2,
      value81 = Number(box3.y || 0) + value79 / 2,
      x = Math.round(value80 - AUDIO_RESULT_WIDTH / 2),
      y = Math.round(value81 - AUDIO_RESULT_HEIGHT / 2);
    if (
      count3 === AUDIO_RESULT_WIDTH &&
      count4 === AUDIO_RESULT_HEIGHT &&
      Number(box3.x || 0) === x &&
      Number(box3.y || 0) === y
    )
      return;
    appStore.updateNodeData(this.nodeId, {
      width: AUDIO_RESULT_WIDTH,
      height: AUDIO_RESULT_HEIGHT,
      x: x,
      y: y,
    });
  }
  ['_collectInputs'](template = null) {
    const inEdges = appStore.getIncomingEdges(this.nodeId),
      nodes = getStoreSnapshot().nodes || {},
      textInputs = [],
      audioRefs = [],
      videoRefs = [],
      workflowKey = this._getCurrentWorkflow().key,
      doesAudioWorkflowAcceptTextInput3 = doesAudioWorkflowAcceptTextInput(workflowKey);
    inEdges.forEach((edgeId) => {
      const fileName = nodes[edgeId.sourceId];
      if (!fileName) return;
      const sourceType = String(fileName.type || '');
      if (doesAudioWorkflowAcceptTextInput3 && TEXT_INPUT_TYPES.has(sourceType)) {
        const text = String(
          fileName.outputText || fileName.text || fileName.content || fileName.prompt || '',
        ).trim();
        if (!text) return;
        textInputs.push({
          edgeId: edgeId.id,
          sourceId: edgeId.sourceId,
          sourceType: sourceType,
          text: text,
        });
        return;
      }
      if (AUDIO_INPUT_TYPES.has(sourceType)) {
        const url = this._resolveAudioRefUrl(fileName);
        if (!url) return;
        audioRefs.push({
          edgeId: edgeId.id,
          sourceId: edgeId.sourceId,
          sourceType: sourceType,
          refSlot: String(edgeId?.refSlot || ''),
          ...(fileName.fileName ? { fileName: fileName.fileName } : {}),
          ...(fileName.fileSize != null ? { size: fileName.fileSize } : {}),
          ...(pickAudioDurationSec(fileName.audioDuration, fileName.duration) > 0
            ? { audioDuration: pickAudioDurationSec(fileName.audioDuration, fileName.duration) }
            : {}),
          url: url,
        });
        return;
      }
      if (VIDEO_INPUT_TYPES.has(sourceType)) {
        const url2 = this._resolveVideoRefUrl(fileName);
        if (!url2) return;
        videoRefs.push({
          edgeId: edgeId.id,
          sourceId: edgeId.sourceId,
          sourceType: sourceType,
          url: url2,
        });
      }
    });
    const assetInputRefs = [],
      value82 = doesAudioWorkflowAcceptTextInput3
        ? resolvePresetPromptTextWithTextRefs({
            template: template,
            promptEl: this.promptEl,
            inEdges: inEdges,
            nodes: nodes,
            assetInputRefs: assetInputRefs,
            assetMediaCounts: { image: 0, video: 0, audio: 0 },
            allowedAssetTypes: ['text', 'audio'],
          })
        : '',
      value83 = nodes?.[this.nodeId] || this._data || {};
    assetInputRefs.push(...getPromptAssetInputRefsFromNode(value83, { allowedTypes: ['audio'] }));
    const audioRefs2 = buildAudioWorkflowInputPlan({
      workflowKey: workflowKey,
      audioRefs: audioRefs,
      assetInputRefs: assetInputRefs,
    });
    return {
      prompt: String(value82 || '').trim(),
      textInputs: textInputs,
      audioRefs: audioRefs2.audioRefs,
      imageRefs: collectAudioWorkflowImageInputs(workflowKey, inEdges, nodes),
      videoRefs: videoRefs,
    };
  }
  ['_validatePayload'](value84) {
    const workflowByKey = getWorkflowByKey(value84?.audioWorkflowKey) || getDefaultWorkflow(),
      message = workflowByKey.validate(value84);
    return { ok: !message, message: message };
  }
  ['_buildPayloadSnapshot'](value85 = null) {
    const audioWorkflowKey = this._getCurrentWorkflow(),
      textInputs2 = this._collectInputs(value85),
      provider = String(audioWorkflowKey.provider || 'runninghubwf').trim(),
      adapterType = String(audioWorkflowKey.adapterType || 'workflow').trim(),
      value86 = String(
        this._data?.providerProfileId || this._data?.rhProviderProfileId || '',
      ).trim(),
      providerProfileId =
        (provider === 'runninghubwf' || provider === 'runninghub') && value86
          ? normalizeRunningHubModelApiProfileId(value86)
          : '',
      generationParams = getPlainGenerationParams(this._data?.generationParams),
      payload3 = {
        nodeId: this.nodeId,
        provider: provider,
        adapterType: adapterType,
        audioWorkflowKey: audioWorkflowKey.key,
        audioWorkflowLabel: audioWorkflowKey.label,
        executionId: audioWorkflowKey.executionId || '',
        prompt: normalizePromptForBackend(audioWorkflowKey.key, textInputs2.prompt),
        textInputs: textInputs2.textInputs.map((response) => response.text),
        audioRefs: textInputs2.audioRefs,
        imageRefs: textInputs2.imageRefs,
        videoRefs: textInputs2.videoRefs,
        generationParams: generationParams,
        installId: String(this._vipInstallId || window.__aicInstallId || '').trim(),
        ...(providerProfileId ? { providerProfileId: providerProfileId, rhProviderProfileId: providerProfileId } : {}),
      };
    provider === 'runninghubwf' &&
      (payload3.rhInstanceType = normalizeRunningHubInstanceType(
        resolveWorkflowSchemaParam(this._data, audioWorkflowKey.key, 'rhInstanceType'),
      ));
    const validation = this._validatePayload(payload3);
    return { payload: payload3, validation: validation };
  }
  ['_enforceWorkflowAudioInputLimit']() {
    const event8 = this._getCurrentWorkflow(),
      audioWorkflowInputLimit = getAudioWorkflowInputLimit(event8.key),
      list8 = appStore.getIncomingEdges(this.nodeId),
      storeSnapshot3 = getStoreSnapshot().nodes || {},
      list9 = list8.filter((value87) => {
        const value88 = storeSnapshot3[value87.sourceId];
        return AUDIO_INPUT_TYPES.has(String(value88?.type || ''));
      });
    if (list9.length <= audioWorkflowInputLimit) return;
    const list10 = [...list9].sort((value89, value90) => {
        const value91 = Number(value89?.createdAt || 0),
          value92 = Number(value90?.createdAt || 0);
        return value91 - value92;
      }),
      list11 = list10.slice(0, Math.max(0, list10.length - audioWorkflowInputLimit));
    if (!list11.length) return;
    appStore.batch(() => {
      list11.forEach((value93) => appStore.removeEdge(value93.id));
    });
  }
  ['_syncPickConnectVisualState']() {
    const storeSnapshot4 = getStoreSnapshot().pickConnectMode || {},
      value94 = !!(storeSnapshot4.active && storeSnapshot4.sourceNodeId === this.nodeId),
      el14 =
        this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || this._attachBtnIcon;
    el14 &&
      ((this._attachBtnIcon = el14),
      (el14.style.transition = 'opacity 0.2s ease, transform 0.2s ease'),
      (el14.style.opacity = value94 ? '0' : ''),
      (el14.style.transform = value94 ? 'scale(0.4)' : ''),
      (el14.style.pointerEvents = value94 ? 'none' : ''));
    if (this._placeholderEl) {
      const el15 = this._placeholderEl.querySelector('.placeholder-icon-svg');
      if (el15) {
        if (value94) el15.classList.add('is-pick-connecting');
        else el15.classList.remove('is-pick-connecting');
      }
    }
  }
  ['_fmtTime'](enabled16) {
    if (!enabled16 || isNaN(enabled16)) return '0:00';
    return (
      Math.floor(enabled16 / 60) + ':' + String(Math.floor(enabled16 % 60)).padStart(2, '0')
    );
  }
  ['_setPlayIcon'](value95) {
    const el16 = this._playBtn?.querySelector?.('svg');
    if (!el16) return;
    const value96 = 'http://www.w3.org/2000/svg';
    while (el16.firstChild) el16.removeChild(el16.firstChild);
    if (value95) {
      const el17 = document.createElementNS(value96, 'polygon');
      (el17.setAttribute('points', '5 3 19 12 5 21 5 3'), el16.appendChild(el17));
      return;
    }
    const el18 = document.createElementNS(value96, 'rect');
    (el18.setAttribute('x', '6'),
      el18.setAttribute('y', '4'),
      el18.setAttribute('width', '4'),
      el18.setAttribute('height', '16'));
    const el19 = document.createElementNS(value96, 'rect');
    (el19.setAttribute('x', '14'),
      el19.setAttribute('y', '4'),
      el19.setAttribute('width', '4'),
      el19.setAttribute('height', '16'),
      el16.appendChild(el18),
      el16.appendChild(el19));
  }
  ['_setPlaybackBuffering'](value97) {
    const el20 = this._playBtn;
    if (!el20) return;
    el20.classList?.toggle?.('is-buffering', value97 === true);
    if (value97 === true) el20.setAttribute?.('aria-busy', 'true');
    else el20.removeAttribute?.('aria-busy');
  }
  ['_seekTo'](value98) {
    const duration = this._readAudioDurationSec();
    if (!this.audioEl || duration <= 0 || !this._bar) return;
    const box4 = this._bar.getBoundingClientRect();
    if (!box4.width) return;
    let value99 = (value98 - box4.left) / box4.width;
    value99 = Math.max(0, Math.min(1, value99));
    const currentTime2 = value99 * duration;
    if (!isFinite(currentTime2)) return;
    ((this._isSeeking = true),
      (this.audioEl.currentTime = currentTime2),
      this._progressController?.sync({
        currentTime: currentTime2,
        duration: duration,
        force: true,
        showLine: true,
      }),
      this.audioEl.addEventListener(
        'seeked',
        () => {
          ((this._isSeeking = false),
            this._progressController?.sync({ force: true, showLine: true }));
        },
        { once: true },
      ));
  }
  ['_setAudioPreviewResultState'](enabled17) {
    const value100 = !!enabled17;
    if (this._waveBgEl) this._waveBgEl.style.display = value100 ? '' : 'none';
    if (this._wavePlayed) this._wavePlayed.style.display = value100 ? '' : 'none';
    if (this._progressLine) this._progressLine.style.display = value100 ? '' : 'none';
    if (this._bar) this._bar.style.display = value100 ? '' : 'none';
    if (this._controlsEl) this._controlsEl.style.display = value100 ? '' : 'none';
    if (this._placeholderEl) this._placeholderEl.style.display = value100 ? 'none' : '';
  }
  ['_getCurrentGateModelId']() {
    return getWorkflowGateModelId(this._getCurrentWorkflow().key);
  }
  async ['_ensureVipAccessForCurrentWorkflow']() {
    const modelId2 = this._getCurrentGateModelId();
    if (!modelId2) return ((this._vipInstallId = ''), true);
    const run2 = window.isModelAllowedBySubscription,
      enabled18 = typeof run2 === 'function' ? run2(modelId2, 'runninghubwf') : true;
    if (!enabled18)
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: modelId2, provider: 'runninghubwf' })
          : window.showToast?.(aigenAudioText('vip.needAuthorization'), 'warn'),
        false
      );
    if (typeof window.ensureSubscriptionInstallId === 'function')
      try {
        this._vipInstallId = String(await window.ensureSubscriptionInstallId()).trim();
      } catch {
        this._vipInstallId = '';
      }
    else this._vipInstallId = String(window.__aicInstallId || '').trim();
    return true;
  }
  async ['_resolveAudioDurationSec'](value101) {
    const enabled19 = String(value101 || '').trim();
    if (!enabled19) return 0;
    return await loadAudioDurationMetadataSec(enabled19, { timeoutMs: 5000 });
  }
  async ['_validateAdvancedVoiceCloneDurations'](list12 = []) {
    if (this._getCurrentWorkflow().key !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY) return true;
    const value102 = Array.isArray(list12) ? list12 : [];
    for (const response2 of value102) {
      const duration2 = await this._resolveAudioDurationSec(response2?.url);
      if (
        Number.isFinite(duration2) &&
        duration2 > 0 &&
        (duration2 < ADVANCED_VOICE_CLONE_MIN_SECONDS || duration2 > ADVANCED_VOICE_CLONE_MAX_SECONDS)
      ) {
        const label2 =
          String(response2?.refSlot || '') === 'audio2'
            ? aigenAudioText('refs.audio2')
            : aigenAudioText('refs.audio1');
        return (
          window.showToast?.(
            aigenAudioText('validation.advancedVoiceDuration', {
              label: label2,
              duration: duration2.toFixed(1),
            }),
            'warn',
          ),
          false
        );
      }
    }
    return true;
  }
  ['_createStatusCard'](value103, value104) {
    const el21 = document.createElement('div');
    ((el21.className = 'gen-status-card'),
      Object.assign(el21.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        gap: '8px',
        padding: '16px',
        boxSizing: 'border-box',
        background: 'var(--bg-panel-card)',
        textAlign: 'center',
      }));
    const value105 = Number(value104) === 0,
      value106 = value105 ? 'var(--green)' : 'var(--white-80)';
    return (
      (el21.innerHTML =
        '\n      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
        value106 +
        '" stroke-width="2">\n        <circle cx="12" cy="12" r="10"/><path d="' +
        (value105 ? 'M8 12l2.5 2.5L16 9' : 'M12 8v5') +
        '" />' +
        (value105 ? '' : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
        '\n      </svg>\n      <span style="color:' +
        value106 +
        ';font-size:12px;font-weight:600;line-height:1.4;">' +
        value103 +
        '</span>\n    '),
      el21
    );
  }
  ['_ensureStatusOverlayEl']() {
    if (this._statusOverlayEl) return this._statusOverlayEl;
    return (
      (this._statusOverlayEl = document.createElement('div')),
      (this._statusOverlayEl.className = 'dreamina-status-overlay'),
      Object.assign(this._statusOverlayEl.style, {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        padding: '16px',
        boxSizing: 'border-box',
        zIndex: '11',
      }),
      this.previewEl?.appendChild(this._statusOverlayEl),
      this._statusOverlayEl
    );
  }
  ['_clearStatusOverlay']() {
    if (!this._statusOverlayEl) return;
    (this._statusOverlayEl.remove(), (this._statusOverlayEl = null));
  }
  ['_syncStatusOverlay'](value107 = this._data, enabled20 = false) {
    const value108 =
        String(value107?.rhStatusMessage || '').trim() ||
        (String(value107?.jobStatus || '').toLowerCase() === 'error'
          ? getTaskMessage(value107)
          : ''),
      value109 = value107?.rhStatusCode;
    if (!enabled20 && value108) {
      const el22 = this._ensureStatusOverlayEl();
      ((el22.innerHTML = ''),
        el22.appendChild(this._createStatusCard(value108, value109)));
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
      return;
    }
    this._clearStatusOverlay();
  }
  ['_cancelWaveformRequest']() {
    ((this._waveformLoadingKey = ''), (this._waveToken = Number(this._waveToken || 0) + 1));
    const value110 = this._waveformAbortController;
    this._waveformAbortController = null;
    try {
      value110?.abort?.();
    } catch {}
  }
  async ['_ensureWaveform'](value111) {
    const enabled21 = String(value111 || '').trim();
    if (!enabled21 || this._rendererWaveformVisible !== true) return;
    const value112 = JSON.stringify([enabled21, this._data?.waveformLocalPath || '']);
    if (value112 === this._waveformLoadingKey) return;
    this._cancelWaveformRequest();
    if (value112 === this._waveformLoadedKey) return;
    this._waveformLoadingKey = value112;
    const value113 = this._waveToken,
      signal = typeof AbortController === 'function' ? new AbortController() : null;
    this._waveformAbortController = signal;
    const url3 = localPathToUrl(this._data?.waveformLocalPath);
    this._waveformLocalPath = String(this._data?.waveformLocalPath || '').trim();
    let value114 = 0;
    const value115 = {
      width: 200,
      height: 80,
      samples: 190,
      signal: signal?.signal,
      onDuration:
        this._readAudioDurationSec() > 0
          ? undefined
          : (value116) => {
              value114 = value116;
            },
    };
    let audioNodeWaveformPath = '';
    try {
      audioNodeWaveformPath = await getAudioNodeWaveformPath(enabled21, url3, value115);
    } finally {
      this._waveformAbortController === signal &&
        ((this._waveformAbortController = null), (this._waveformLoadingKey = ''));
    }
    if (signal?.signal?.aborted) return;
    if (!this.audioEl || !this._root || !this._root.isConnected) return;
    if (value113 !== this._waveToken) return;
    this._applyResolvedAudioDuration(value114, enabled21);
    if (!audioNodeWaveformPath) return;
    this._waveformLoadedKey = value112;
    if (this._waveBgPath) this._waveBgPath.setAttribute('d', audioNodeWaveformPath);
    if (this._waveFgPath) this._waveFgPath.setAttribute('d', audioNodeWaveformPath);
  }
  ['setRendererAudioSurfaceVisible'](value117) {
    if (this._rendererWaveformVisible === value117) return;
    this._rendererWaveformVisible = value117;
    if (value117) void this._ensureWaveform(this._currentSrc);
    else this._cancelWaveformRequest();
  }
  ['_renderInitialFooter'](value118) {
    this.footerEl = value118;
    if (this._rendererDetailsDeferred) this._renderDeferredFooterShell(value118);
    else this._renderFooter(value118);
  }
  ['_renderDeferredFooterShell'](el23) {
    if (!el23) return;
    if (el23.dataset) el23.dataset.deferredDetailsShell = '1';
    ((el23.innerHTML =
      '\n      <div class="prompt-actions">\n        <button type="button" class="prompt-submit img-gen-btn" disabled title="' +
      aigenAudioText('buttons.generate') +
      '">\n          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n        </button>\n      </div>'),
      (this.modelWrap = null),
      (this._modelMenu = null),
      (this._runninghubSubmenu = null),
      (this._modelLabelEl = null),
      (this._workflowSchemaSlotElements = null),
      (this.btnEl = el23.querySelector('.img-gen-btn')),
      this.btnEl?.addEventListener('click', () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      }));
  }
  ['_renderFooter'](footer) {
    if (!footer) return;
    if (footer.dataset) delete footer.dataset.deferredDetailsShell;
    const workflow4 = this._getCurrentWorkflow();
    ((footer.innerHTML = buildAudioWorkflowFooterHtml({
      workflow: workflow4,
      nodeData: this._data,
      workflowItems: buildAudioWorkflowItems(AUDIO_WORKFLOW_VALIDATORS),
      debugIconHtml: DEBUG_WRENCH_ICON_HTML,
      labels: {
        advanced: aigenAudioText('controls.advancedSettings'),
        debugTitle: aigenAudioText('debug.buttonTitle'),
        generateTitle: aigenAudioText('buttons.generate'),
      },
    })),
      (this.modelWrap = footer.querySelector('.img-model-wrap')),
      (this.btnEl = footer.querySelector('.img-gen-btn')));
    const el24 = footer.querySelector('.debug-wrench-btn'),
      audioWorkflowSchemaSlotElements = collectAudioWorkflowSchemaSlotElements(footer),
      trigger = audioWorkflowSchemaSlotElements.modelTrigger,
      menu = footer.querySelector('.img-model-menu'),
      el25 = footer.querySelector('[data-runninghub-toggle]'),
      el26 = footer.querySelector('.runninghub-submenu'),
      value119 = footer.querySelector('.img-model-label'),
      el27 = audioWorkflowSchemaSlotElements.advancedButton,
      el28 = audioWorkflowSchemaSlotElements.advancedPanel;
    ((this._modelMenu = menu),
      (this._runninghubSubmenu = el26),
      (this._modelLabelEl = value119),
      (this._workflowSchemaSlotElements = audioWorkflowSchemaSlotElements));
    el27 &&
      el28 &&
      el27.addEventListener('click', (event9) => {
        event9.stopPropagation();
        const value120 = el28.classList.toggle('show');
        if (value120) positionNodeAdvancedPanel(el28);
        (el27.classList.toggle('active', value120),
          el27.setAttribute('aria-expanded', String(value120)));
      });
    (footer.addEventListener('click', (event10) => {
      const el29 = event10.target.closest?.('[data-ui-schema-field-help-url]');
      if (!el29 || !footer.contains(el29)) return;
      (event10.preventDefault(), event10.stopPropagation());
      const value121 = String(el29.dataset.uiSchemaFieldHelpUrl || '').trim();
      if (value121) void openExternalLink(value121).catch(() => {});
    }),
      this._footerControllerCleanup?.());
    const bindNodeFooterController2 = bindNodeFooterController(footer, {
      onOutsideClose: () => {
        (this._closeModelMenu(), closeAudioWorkflowAdvancedPanel(this._workflowSchemaSlotElements));
      },
    });
    ((this._footerControllerCleanup = bindGenerationNodeFooterLifecycle(this, bindNodeFooterController2)),
      this._uiSchemaCleanup?.(),
      (this._uiSchemaCleanup = bindAudioWorkflowSchemaSlotControls({
        footer: footer,
        nodeId: this.nodeId,
        nodeData: this._data,
        store: appStore,
      })),
      el24?.addEventListener('click', (event11) => {
        event11.stopPropagation();
        if (globalThis.window?.DEV_MODE !== true) return;
        (flushPromptHtmlCommit(this),
          openDebugRequestWindow({
            prepare: async () => {
              const enabled22 = await this._buildPayload();
              if (!enabled22) throw new Error('请先填写提示词或连接参考素材。');
              return buildFinalApiDebugPreview(await buildGenerateAudioRequest(enabled22));
            },
          }));
      }),
      bindNodeModelMenuTrigger({
        root: footer,
        trigger: trigger,
        menu: menu,
        activateMenuKeyboard: activateMenuKeyboard,
      }));
    const value122 = {
      listenConfigChanges: false,
      getProviderProfileId: () => {
        const value123 = appStore.getState?.()?.nodes?.[this.nodeId] || this._data || {};
        return value123.providerProfileId || value123.rhProviderProfileId || '';
      },
    };
    (this._modelCredentialMenuCleanup?.(),
      (this._modelCredentialMenuCleanup = bindModelCredentialMenu(menu, value122)),
      trigger?.addEventListener('click', () => {
        void syncModelCredentialMenu(menu, value122);
      }));
    const value124 = (el30) => {
      if (el30.classList.contains('node-menu-group-header')) return;
      if (el30.dataset.boundClick === 'true') return;
      ((el30.dataset.boundClick = 'true'),
        el30.addEventListener('click', (event12) => {
          event12.stopPropagation();
          if (el30.dataset.disabled === 'true') return;
          const enabled23 = String(el30.dataset.value || '').trim();
          if (!enabled23) return;
          const value125 = this._getCurrentWorkflow().key;
          (this._setSelectedWorkflow(enabled23),
            this._getCurrentWorkflow().key !== value125 && this._closeModelMenu());
        }));
    };
    (el26?.querySelectorAll('.floating-menu-item').forEach(value124),
      menu?.querySelectorAll('.node-menu-submenu .floating-menu-item').forEach(value124),
      el25?.addEventListener('click', (event13) => {
        event13.stopPropagation();
      }),
      this.btnEl?.addEventListener('click', () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      }));
  }
  ['mount']() {
    this._clearToolbarActionBindings();
    const el31 = document.createElement('div');
    (el31.classList.add('aigen-node-root', 'aigen-audio-root'),
      (this._root = el31),
      (el31.innerHTML = AUDIO_TOOLBAR_HTML),
      (this.previewEl = document.createElement('div')),
      (this.previewEl.className = 'node-card media-card audio-card aigen-audio-preview'),
      (this._audioCard = this.previewEl));
    const el32 = document.createElement('div');
    ((el32.className = 'audio-main-surface'),
      (this._audioMainSurface = el32),
      this.previewEl.appendChild(el32));
    const el33 = document.createElement('div');
    ((el33.className = 'waveform waveform-bg'),
      (el33.innerHTML =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      el32.appendChild(el33),
      (this._waveBgEl = el33));
    const el34 = document.createElement('div');
    ((el34.className = 'waveform waveform-unplayed'),
      (el34.innerHTML =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      el32.appendChild(el34),
      (this._wavePlayed = el34));
    const list13 = this.previewEl.querySelectorAll('.waveform-bg svg path'),
      list14 = this.previewEl.querySelectorAll('.waveform-unplayed svg path');
    ((this._waveBgPath = list13 && list13.length ? list13[0] : null),
      (this._waveFgPath = list14 && list14.length ? list14[0] : null));
    const value126 = document.createElement('div');
    ((value126.className = 'media-progress-line'),
      el32.appendChild(value126),
      (this._progressLine = value126));
    const value127 = document.createElement('div');
    ((value127.className = 'media-progress-bar'),
      el32.appendChild(value127),
      (this._bar = value127));
    const el35 = document.createElement('div');
    ((el35.className = 'audio-controls'),
      (el35.innerHTML =
        '\n      <button type="button" class="audio-play-btn">\n        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n      </button>\n      <div class="audio-time-wrap">\n        <span class="audio-time-display">0:00 / 0:00</span>\n      </div>'),
      el32.appendChild(el35),
      (this._controlsEl = el35),
      (this._playBtn = el35.querySelector('.audio-play-btn')),
      (this._timeEl = el35.querySelector('.audio-time-display')),
      (this.audioEl = document.createElement('audio')),
      (this.audioEl.className = 'audio-player'),
      (this.audioEl.controls = false),
      (this.audioEl.draggable = false),
      (this.audioEl.preload = 'none'),
      (this._progressController = createAudioPlaybackProgressController({
        audioEl: this.audioEl,
        wavePlayedEl: this._wavePlayed,
        progressLineEl: this._progressLine,
        timeEl: this._timeEl,
        trackEl: this._bar,
        formatTime: (value128) => this._fmtTime(value128),
        shouldSuppressSync: () => this._isSeeking,
      }).attach()));
    const el36 = document.createElement('div');
    ((el36.className = 'img-node-placeholder'),
      Object.assign(el36.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        userSelect: 'none',
      }),
      (el36.innerHTML = '\n            ' + buildAudioPlaceholderSvg()),
      (this._placeholderEl = el36),
      el32.appendChild(this.audioEl),
      el32.appendChild(el36),
      syncPreviewNodeLoading(
        this.nodeId,
        this.previewEl,
        this._getPreviewGenerateButtonLoadingOptions(),
      ));
    let box5 = { x: 0, y: 0 };
    (this.previewEl.addEventListener('pointerdown', (x2) => {
      if (x2.target.closest('.media-progress-bar')) return;
      box5 = { x: x2.clientX, y: x2.clientY };
    }),
      this.previewEl.addEventListener('pointerup', (event14) => {
        if (
          event14.target.closest('.media-progress-bar') ||
          event14.target.closest('.audio-play-btn') ||
          event14.target.closest('.audio-controls') ||
          event14.target.closest('.audio-multi-toggle-btn') ||
          event14.target.closest('.multi-stack-backplate')
        )
          return;
        const count6 = Math.hypot(
          event14.clientX - box5.x,
          event14.clientY - box5.y,
        );
        if (count6 >= 5) return;
        if (!this.audioEl || !this.audioEl.duration) return;
        const box6 = this.previewEl.getBoundingClientRect(),
          value129 = Math.max(
            0,
            Math.min(1, (event14.clientX - box6.left) / box6.width),
          ),
          currentTime3 = value129 * this.audioEl.duration;
        ((this.audioEl.currentTime = currentTime3),
          this._progressController?.sync({
            currentTime: currentTime3,
            duration: this.audioEl.duration,
            force: true,
            showLine: true,
          }));
      }),
      this._bar?.addEventListener('click', (event15) => {
        this._seekTo(event15.clientX);
      }),
      this._playBtn?.addEventListener('pointerdown', (event16) => {
        event16.stopPropagation();
        if (!this._currentSrc) return;
        if (this.audioEl.paused) this._playAudio();
        else this.audioEl.pause();
      }),
      this.audioEl.addEventListener('play', () => this._setPlayIcon(false)),
      this.audioEl.addEventListener('pause', () => {
        (this._setPlaybackBuffering(false), this._setPlayIcon(true));
      }),
      this.audioEl.addEventListener('waiting', () => {
        if (this.audioEl?.paused === false) this._setPlaybackBuffering(true);
      }),
      this.audioEl.addEventListener('playing', () => {
        this._setPlaybackBuffering(false);
      }),
      this.audioEl.addEventListener('ended', () => {
        this._setPlaybackBuffering(false);
      }),
      this._unregisterAudioPlaybackClient?.(),
      (this._unregisterAudioPlaybackClient = registerAudioPlaybackClient(this.nodeId, {
        stopForExternalPlayback: () => this._stopAudioForExternalPlayback(),
      })),
      this._releaseRendererPlaybackPin?.(),
      (this._releaseRendererPlaybackPin = bindRendererMediaPlaybackPin(this.audioEl, this.nodeId)));
    const value130 = this._resolveNodeAudioUrl(this._data);
    value130
      ? this._rendererMediaDeferred
        ? this._prepareDeferredAudio(value130)
        : (this._prepareAudio(value130),
          this._applyResultWideLayout(this._data, false),
          this._setAudioPreviewResultState(true),
          this._syncAudioMultiResultStack(this._data))
      : (this._setAudioPreviewResultState(false),
        this._syncStatusOverlay(this._data, false),
        this._syncAudioMultiResultStack(this._data));
    el31.appendChild(this.previewEl);
    const panel = document.createElement('div');
    ((panel.className = 'text-prompt-panel'),
      (this._promptPanel = panel),
      this._syncModelProviderProfileControl(),
      panel.addEventListener('pointerdown', (event17) => {
        event17.stopPropagation();
      }),
      panel.addEventListener('dblclick', (event18) => {
        !event18.target.closest('.prompt-textarea') &&
          (event18.preventDefault(), event18.stopPropagation());
      }),
      (this.refBarEl = document.createElement('div')),
      (this.refBarEl.className = 'node-ref-bar'),
      panel.appendChild(this.refBarEl),
      this.refBarEl.addEventListener('click', (event19) => {
        if (handleRefThumbDeleteClick(this, event19)) return;
        const el37 = event19.target.closest('.rh-v5-ref-box[data-slot]');
        if (el37) {
          (event19.stopPropagation(), event19.preventDefault());
          const enabled24 = String(el37.dataset.slot || '').trim();
          if (!enabled24 || !this._audioRefUploadInput || this._audioRefUploadPending) return;
          ((this._audioRefUploadSlot = enabled24),
            (this._audioRefUploadAnchorNodeId = this.nodeId),
            (this._audioRefUploadInput.accept =
              getAudioWorkflowSlots(this._getCurrentWorkflow().key, { includeImages: true }).find(
                (value131) => value131.slot === enabled24,
              )?.kind === 'image'
                ? 'image/png,image/jpeg,image/webp'
                : 'audio/*'),
            this._audioRefUploadInput.click());
          return;
        }
        const enabled25 = event19.target.closest('.prompt-attachment-btn');
        if (!enabled25 || event19._pickConnectHandled) return;
        (event19.stopPropagation(), event19.preventDefault());
        const value132 = appStore.getState().pickConnectMode;
        (value132 && value132.active && value132.sourceNodeId === this.nodeId
          ? appStore.setPickConnectMode({ active: false })
          : appStore.setPickConnectMode({
              active: true,
              sourceNodeId: this.nodeId,
              handleDirection: 'left',
              preferredRefSlot: undefined,
            }),
          this._syncPickConnectVisualState());
      }),
      this.refBarEl.addEventListener('pointerdown', (event20) => {
        if (
          event20.target.closest(
            '.prompt-attachment-btn, .ref-thumb-delete, .ref-upload-slot, .rh-v5-ref-box',
          )
        )
          event20.stopPropagation();
      }),
      (this._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(this.refBarEl)),
      (this._audioRefUploadInput = document.createElement('input')),
      (this._audioRefUploadInput.type = 'file'),
      (this._audioRefUploadInput.accept = 'audio/*'),
      (this._audioRefUploadInput.style.display = 'none'),
      panel.appendChild(this._audioRefUploadInput),
      this._audioRefUploadInput.addEventListener('change', async (event21) => {
        const fileSize = event21.target.files?.[0],
          refSlot = String(this._audioRefUploadSlot || '').trim(),
          enabled26 = String(this._audioRefUploadAnchorNodeId || '').trim();
        if (!fileSize || !refSlot || !enabled26) {
          this._audioRefUploadInput.value = '';
          return;
        }
        if (this._audioRefUploadPending) return;
        const value133 = this._getCurrentWorkflow().key,
          el38 = this._root,
          el39 = this.refBarEl;
        ((this._audioRefUploadPending = true),
          el39?.setAttribute('aria-busy', 'true'),
          startLoading(el39),
          this._updateSubmitButtonState());
        try {
          const sourceKind =
            getAudioWorkflowSlots(this._getCurrentWorkflow().key, { includeImages: true }).find(
              (value134) => value134.slot === refSlot,
            )?.kind || 'audio';
          if (!String(fileSize.type || '').startsWith(sourceKind + '/'))
            throw new Error(sourceKind === 'image' ? '请选择图片文件' : aigenAudioText('upload.audioOnly'));
          const value135 = window.currentProjectId || 'default_v2_project',
            assetId = await uploadFile(fileSize, value135);
          if (
            this._root !== el38 ||
            !el38?.isConnected ||
            this._getCurrentWorkflow().key !== value133
          )
            return;
          const src = String(assetId?.url || '').trim();
          if (!src) throw new Error(aigenAudioText('upload.missingUrl'));
          const state2 = appStore.getState(),
            box7 = state2.nodes?.[enabled26];
          if (!box7) throw new Error(aigenAudioText('upload.anchorMissing'));
          const localPath4 = pickResultLocalPath(assetId) || normalizeLocalPath(src),
            width2 = 320,
            height2 = sourceKind === 'image' ? 240 : 140,
            { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
            y2 = direction === 'down' ? 'down' : 'left',
            value136 = Number(box7.x) || 0,
            value137 = Number(box7.y) || 0,
            value138 = Number(box7.width) || 360,
            value139 = Number(box7.height) || 360,
            value140 = value137 + Math.round((value139 - height2) / 2);
          let value141 = value140;
          if (refSlot === 'audioRef' && this._getCurrentWorkflow().key === 'voice_convert')
            value141 = value140 - Math.round(height2 / 2) - 8;
          else
            refSlot === 'audioTarget' &&
              this._getCurrentWorkflow().key === 'voice_convert' &&
              (value141 = value140 + Math.round(height2 / 2) + 8);
          const x3 = value136 - spacing - width2,
            x4 = avoidOverlap
              ? findAvailablePosition(
                  state2.nodes || {},
                  x3,
                  y2 === 'down' ? value137 + value139 + spacing : value141,
                  width2,
                  height2,
                  spacing,
                  y2,
                )
              : { x: x3, y: y2 === 'down' ? value137 + value139 + spacing : value141 };
          (appStore.batch(() => {
            const value142 = appStore.getIncomingEdges(this.nodeId);
            for (const value143 of value142) {
              if (String(value143?.refSlot || '') === refSlot) appStore.removeEdge(value143.id);
            }
            removeCoveredAssetInputRefForConnection({
              targetId: this.nodeId,
              sourceKind: sourceKind,
              refSlot: refSlot,
            });
            const id2 = generateId('node');
            (appStore.addNode({
              id: id2,
              type: 'source-' + sourceKind,
              x: x4.x,
              y: x4.y,
              width: width2,
              height: height2,
              src: src,
              localPath: localPath4,
              assetId: assetId.assetId || '',
              originalLocalPath: assetId.originalLocalPath || assetId.localPath || '',
              waveformLocalPath: assetId.waveformLocalPath || '',
              derivativeStatus: assetId.derivativeStatus || assetId.status || '',
              mediaTaskId: assetId.mediaTaskId || '',
              mediaTaskKind: assetId.mediaTaskKind || '',
              mediaTaskStatus: assetId.mediaTaskStatus || '',
              mediaTaskProgress: Number(assetId.mediaTaskProgress || 0) || 0,
              mediaTaskError: assetId.mediaTaskError || '',
              fileName: assetId.filename || fileSize.name || '',
              fileSize: fileSize.size,
              name: fileSize.name || aigenAudioText('upload.sourceAudioName'),
              ...(sourceKind === 'image' ? buildCanvasLocalImageFields(assetId, { includeSrc: true }) : {}),
            }),
              appStore.addEdge({
                id: generateId('edge'),
                sourceId: id2,
                targetId: this.nodeId,
                refSlot: refSlot,
                createdAt: Date.now(),
              }),
              appStore.setSelectedNodes([this.nodeId]));
          }),
            this._updateSubmitButtonState());
        } catch (error2) {
          window.showToast?.(error2?.message || aigenAudioText('upload.failedRetry'), 'error');
        } finally {
          ((this._audioRefUploadPending = false),
            el39?.removeAttribute('aria-busy'),
            stopLoading(el39),
            (this._audioRefUploadInput.value = ''),
            (this._audioRefUploadSlot = ''),
            (this._audioRefUploadAnchorNodeId = ''),
            this._updateSubmitButtonState());
        }
      }));
    const el40 = document.createElement('div');
    ((el40.className = 'prompt-input-wrapper'),
      (this._promptInputWrap = el40),
      (this.promptEl = document.createElement('div')),
      (this.promptEl.className = 'prompt-textarea custom-textarea'),
      (this.promptEl.contentEditable = 'true'),
      (this.promptEl.spellcheck = false),
      syncAudioPromptPlaceholder(this.promptEl, this._getCurrentWorkflow().key),
      (this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
      this.promptEl.addEventListener('input', (value144) => {
        (schedulePromptHtmlCommit(this),
          checkSlashTrigger(value144, {
            promptEl: this.promptEl,
            nodeType: this._data.type,
            nodeId: this.nodeId,
            onGenerate: (value145, value146) => this._onGenerate(value145, value146),
          }),
          _checkAtTrigger(this, value144));
        if (shouldSkipPromptTriggerForBulkInput(value144)) return;
        (_syncEdgesOrderFromPills(this), this._updateSubmitButtonState());
      }),
      this.promptEl.addEventListener('blur', () => {
        flushPromptHtmlCommit(this);
      }),
      this.promptEl.addEventListener('mouseover', (value147) => _handlePillHover(value147, this)),
      this.promptEl.addEventListener('mouseout', (value148) => _handlePillOut(value148, this)),
      this.promptEl.addEventListener('keydown', (event22) => {
        if (handlePromptSelectAll(this, event22)) return;
        if (_handleMentionMenuKeyboard(event22)) return;
        if (handleSlashKeyboardNavigation(event22)) return;
        if (shouldSubmitPromptByKeyboard(event22)) {
          (event22.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
          return;
        }
        _handlePillKeyboard(this, event22);
      }),
      this.promptEl.addEventListener('paste', (value149) => {
        handlePromptPaste(this, value149);
      }));
    !this._rendererDetailsDeferred &&
      this._data.prompt &&
      ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)),
      _rehydratePromptPills(this));
    (el40.appendChild(this.promptEl),
      panel.appendChild(el40),
      (this._promptPresetTrigger = createPromptPresetTriggerController({
        panel: panel,
        getPromptEl: () => this.promptEl,
        getNodeType: () => this._data?.type,
        getNodeId: () => this.nodeId,
        onGenerate: (value150, value151) => this._onGenerate(value150, value151),
      })));
    !this._rendererDetailsDeferred &&
      (this._syncPromptBoxSizeFromData(this._data),
      this._setupPromptBoxResize(),
      this._syncWorkflowDefaults(),
      this._syncPromptInputVisibility(),
      this._syncAudioPromptHelpTip());
    const value152 = document.createElement('div');
    ((value152.className = 'prompt-panel-footer'),
      this._renderInitialFooter(value152),
      (this._docClickHandler = null),
      panel.appendChild(value152),
      el31.appendChild(panel),
      attachNodePromptExpansion(this, { panel: panel }));
    const el41 = el31.querySelector('.node-floating-toolbar');
    if (el41) {
      el41.addEventListener('pointerdown', (event23) => event23.stopPropagation());
      const el42 = el41.querySelector('.act-clip, .clip-btn'),
        button = el41.querySelector('.act-separate, .separate-btn'),
        button2 = el41.querySelector('.act-voice-studio'),
        el43 = el41.querySelector('.act-speed, .speed-btn'),
        button3 = el41.querySelector('.act-upload'),
        button4 = el41.querySelector('.act-download, .download-btn'),
        list15 = [1, 1.25, 1.5, 2];
      (el42?.addEventListener('pointerdown', (event24) => {
        (event24.stopPropagation(), AudioClipController.init(this.nodeId));
      }),
        this._toolbarActionCleanups.push(
          bindRunningHubToolbarTaskButton({
            button: button,
            getTask: () => getRunningAudioSeparationTaskForNode(this.nodeId),
            cancelTask: () => cancelAudioSeparationTaskForNode(this.nodeId, { notify: true }),
            cancelTooltip: aigenAudioText('toolbar.cancelAudioSeparation'),
            eventTypes: ['pointerdown', 'click'],
          }),
        ),
        button?.addEventListener('pointerdown', (event25) => {
          if (getRunningAudioSeparationTaskForNode(this.nodeId)) {
            (event25.preventDefault(),
              event25.stopPropagation(),
              void cancelAudioSeparationTaskForNode(this.nodeId, { notify: true }));
            return;
          }
          (event25.stopPropagation(), void runAudioSeparationFromNode(this.nodeId));
        }),
        el43?.addEventListener('pointerdown', (event26) => {
          (event26.stopPropagation(),
            (this._speedIdx = (this._speedIdx + 1) % list15.length));
          const value153 = list15[this._speedIdx];
          if (this.audioEl) this.audioEl.playbackRate = value153;
          el43.textContent = value153.toFixed(1) + 'x';
        }),
        this._toolbarActionCleanups.push(
          bindPreviewUploadToolbarAction({ button: button3 }),
          bindAudioDownloadAction({
            button: button4,
            getNodeData: () => appStore.getState().nodes?.[this.nodeId] || this._data || {},
            getAudioElement: () => this.audioEl,
            notifyMissing: () => window.showToast?.(aigenAudioText('download.missingAudio'), 'warn'),
          }),
          bindAudioVoiceStudioAction({ button: button2, getNodeId: () => this.nodeId }),
        ));
    }
    if (!this._rendererDetailsDeferred) this._renderRefBar();
    (this._assetMentionRegistryUnsubscribe?.(),
      (this._assetMentionRegistryUnsubscribe = subscribeAssetMentionRegistry(() => {
        if (this._assetMentionRegistryRefreshPending) return;
        ((this._assetMentionRegistryRefreshPending = true),
          queueMicrotask(() => {
            this._assetMentionRegistryRefreshPending = false;
            if (!appStore.getState().nodes?.[this.nodeId]) return;
            if (this._rendererDetailsDeferred) return;
            (_rehydratePromptPills(this), this._renderRefBar(), this._updateSubmitButtonState());
          }));
      })),
      this._syncPickConnectVisualState());
    if (!this._rendererDetailsDeferred) this._syncLocaleTexts();
    return (
      (this._unsubscribeLocale = onLocaleChange(() => {
        this._syncLocaleTexts({ rerenderRefs: true });
      })),
      queueMicrotask(() => {
        appStore.getState().nodes?.[this.nodeId] && this._maybeResumeRunningHubTask();
      }),
      el31
    );
  }
  ['hydrateDeferredDetails']() {
    if (this._rendererDetailsDeferred !== true) return false;
    ((this._rendererDetailsDeferred = false),
      (this._data = appStore.getState?.()?.nodes?.[this.nodeId] || this._data),
      this._syncWorkflowDefaults(),
      (this._data = appStore.getState?.()?.nodes?.[this.nodeId] || this._data));
    if (
      this.promptEl &&
      document.activeElement !== this.promptEl &&
      this._data?.prompt !== undefined
    ) {
      if (!isVirtualizedPromptEditorCurrent(this, this._data.prompt)) {
        const sanitizePromptHtml2 = sanitizePromptHtml(this._data.prompt || '');
        this.promptEl.innerHTML !== sanitizePromptHtml2 &&
          (clearVirtualizedPromptCommit(this),
          (this.promptEl.innerHTML = sanitizePromptHtml2),
          _rehydratePromptPills(this));
      }
    }
    return (
      this._syncPromptBoxSizeFromData(this._data),
      this._setupPromptBoxResize(),
      this._syncPromptInputVisibility(),
      this._syncAudioPromptHelpTip(),
      this._syncModelProviderProfileControl(),
      this._renderFooter(this.footerEl),
      this._renderRefBar(),
      this._syncPickConnectVisualState(),
      this._syncLocaleTexts(),
      true
    );
  }
  ['_syncLocaleTexts'](options4 = {}) {
    if (this._rendererDetailsDeferred) return;
    (this.promptEl && syncAudioPromptPlaceholder(this.promptEl, this._getCurrentWorkflow().key),
      this._root
        ?.querySelector?.('.debug-wrench-btn')
        ?.setAttribute?.('title', aigenAudioText('debug.buttonTitle')),
      options4.rerenderRefs === true &&
        this.refBarEl &&
        ((this._refBarWorkflowKey = ''), this._renderRefBar()),
      this._updateSubmitButtonState());
  }
  ['_updateSubmitButtonState']() {
    if (!this.btnEl) return;
    const storeSnapshot5 = getStoreSnapshot().nodes?.[this.nodeId] || this._data || {},
      el44 = resolveGenerationButtonMode(storeSnapshot5, {
        cancellable: String(storeSnapshot5?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf',
        cancelInFlight: this._rhCancelInFlight === true,
      });
    if (el44.busy) {
      String(storeSnapshot5?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf'
        ? setGenerateButtonCancellableUi(this.btnEl, {
            title: aigenAudioText('buttons.generateCancellable'),
            tooltip: aigenAudioText('buttons.generateCancellable'),
            ariaLabel: aigenAudioText('buttons.cancelAudioGeneration'),
            color: 'var(--red)',
            busy: true,
          })
        : setGenerateButtonLoadingUi(this.btnEl, {
            title: aigenAudioText('buttons.generate'),
            disabled: true,
            ariaLabel: aigenAudioText('buttons.generate'),
          });
      ((this.btnEl.disabled = el44.disabled),
        (this.btnEl.style.cursor = el44.cursor));
      return;
    }
    (resetGenerateButtonIdleUi(this.btnEl, aigenAudioText('buttons.generate')),
      resetModelCredentialButtonState(this.btnEl));
    const { payload: payload4, validation: validation2 } = this._buildPayloadSnapshot(),
      enabled27 = validation2.ok && !!payload4.audioWorkflowKey && !this._audioRefUploadPending;
    !enabled27
      ? ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'))
      : ((this.btnEl.disabled = false),
        (this.btnEl.style.cursor = ''),
        applyModelCredentialButtonState(this.btnEl, {
          modelId: payload4.audioWorkflowKey || storeSnapshot5?.model,
          provider: payload4.provider || storeSnapshot5?.provider,
          providerProfileId:
            payload4.providerProfileId ||
            storeSnapshot5?.providerProfileId ||
            storeSnapshot5?.rhProviderProfileId,
          adapterType: payload4.adapterType,
        }));
  }
  ['_getAudioElementSource']() {
    return getMediaElementPlaybackSourceKey(this.audioEl);
  }
  ['_getAudioElementCurrentSource']() {
    return getMediaElementCurrentSource(this.audioEl);
  }
  ['_isAudioElementReady']() {
    if (!this.audioEl || !this._getAudioElementCurrentSource()) return false;
    const count7 = Number(this.audioEl.readyState || 0);
    return count7 >= 2;
  }
  ['_readAudioDurationSec']() {
    const audioDurationSec = normalizeAudioDurationSec(this.audioEl?.duration),
      storeSnapshot6 = getStoreSnapshot().nodes?.[this.nodeId],
      audioDurationSec2 = pickAudioDurationSec(
        storeSnapshot6?.audioDuration,
        !storeSnapshot6 ? this._data?.audioDuration : 0,
        !storeSnapshot6 ? this._data?.duration : 0,
      );
    if (audioDurationSec2 > 0) {
      if (!(audioDurationSec > 0)) return audioDurationSec2;
      const value154 = Math.max(1, audioDurationSec2 * 0.25);
      if (Math.abs(audioDurationSec2 - audioDurationSec) > value154) return audioDurationSec2;
    }
    return audioDurationSec;
  }
  ['_syncKnownAudioDurationUi']({ currentTime: currentTime = 0, showLine: showLine = false } = {}) {
    const duration3 = this._readAudioDurationSec();
    if (!(duration3 > 0)) return false;
    const value155 = Number(currentTime),
      currentTime4 = Number.isFinite(value155) ? Math.max(0, Math.min(value155, duration3)) : 0,
      enabled28 = this._progressController?.sync({
        currentTime: currentTime4,
        duration: duration3,
        force: true,
        showLine: showLine,
      });
    if (!showLine) this._progressController?.hideLine?.();
    return (
      !enabled28 &&
        this._timeEl &&
        (this._timeEl.textContent = this._fmtTime(currentTime4) + ' / ' + this._fmtTime(duration3)),
      true
    );
  }
  ['_applyResolvedAudioDuration'](value156, value157 = this._currentSrc) {
    if (value157 && this._currentSrc !== value157) return false;
    const audioDuration2 = normalizeAudioDurationSec(value156);
    if (!(audioDuration2 > 0)) return false;
    const storeSnapshot7 = getStoreSnapshot().nodes?.[this.nodeId],
      audioDurationSec3 = pickAudioDurationSec(
        storeSnapshot7?.audioDuration,
        this._data?.audioDuration,
        this._data?.duration,
      );
    if (audioDurationSec3 > 0) {
      if (Math.abs(audioDurationSec3 - audioDuration2) <= 0.001)
        return this._syncKnownAudioDurationUi({
          currentTime: this.audioEl?.currentTime || 0,
          showLine: Number(this.audioEl?.currentTime || 0) > 0,
        });
      const value158 = Math.max(1, audioDurationSec3 * 0.25);
      if (Math.abs(audioDurationSec3 - audioDuration2) > value158) return false;
    }
    return (
      storeSnapshot7
        ? (appStore.updateNodeData(this.nodeId, { audioDuration: audioDuration2 }),
          (this._data = { ...(this._data || {}), audioDuration: audioDuration2 }),
          this._syncKnownAudioDurationUi({
            currentTime: this.audioEl?.currentTime || 0,
            showLine: Number(this.audioEl?.currentTime || 0) > 0,
          }))
        : ((this._data = { ...(this._data || {}), audioDuration: audioDuration2 }),
          this._syncKnownAudioDurationUi({
            currentTime: this.audioEl?.currentTime || 0,
            showLine: Number(this.audioEl?.currentTime || 0) > 0,
          })),
      true
    );
  }
  ['_rememberAudioDuration'](value159 = this._currentSrc) {
    if (!this.audioEl || (value159 && this._currentSrc !== value159)) return;
    const count8 = this._readAudioDurationSec();
    if (!(count8 > 0)) return;
    this._applyResolvedAudioDuration(count8, value159);
  }
  ['_rewindEndedAudioIfNeeded']() {
    if (!this.audioEl) return;
    const duration4 = this._readAudioDurationSec();
    if (!(duration4 > 0)) return;
    const value160 = Number(this.audioEl.currentTime || 0),
      enabled29 = Number.isFinite(value160) && value160 >= duration4 - 0.05;
    if (this.audioEl.ended !== true && !enabled29) return;
    try {
      this.audioEl.currentTime = 0;
    } catch {}
    this._progressController?.sync({
      currentTime: 0,
      duration: duration4,
      force: true,
      showLine: true,
    });
  }
  ['_clearPlaybackResume']() {
    ((this._playbackResumeSource = ''), (this._playbackResumeTime = 0));
  }
  ['_restorePlaybackPosition'](value161) {
    if (
      !this.audioEl ||
      Number(this.audioEl.readyState || 0) < 1 ||
      this._currentSrc !== value161 ||
      this._playbackResumeSource !== value161
    )
      return false;
    const value162 = Number(this._playbackResumeTime || 0);
    let currentTime5 = Number.isFinite(value162) ? Math.max(0, value162) : 0;
    const duration5 = this._readAudioDurationSec();
    if (duration5 > 0) {
      currentTime5 = Math.min(currentTime5, duration5);
      if (currentTime5 >= duration5 - 0.05) currentTime5 = 0;
    }
    try {
      this.audioEl.currentTime = currentTime5;
    } catch {
      return false;
    }
    return (
      this._clearPlaybackResume(),
      duration5 > 0 &&
        this._progressController?.sync({
          currentTime: currentTime5,
          duration: duration5,
          force: true,
          showLine: currentTime5 > 0,
        }),
      true
    );
  }
  ['_clearAudioElementSource']() {
    (this._setPlaybackBuffering(false), (this._audioPlayPending = false));
    if (!this.audioEl) return;
    this._audioPlayAttemptToken = Number(this._audioPlayAttemptToken || 0) + 1;
    this._audioPlayDeadlineTimer &&
      (clearTimeout(this._audioPlayDeadlineTimer), (this._audioPlayDeadlineTimer = null));
    ((this._audioLoadToken = Number(this._audioLoadToken || 0) + 1),
      (this._audioLoadInFlightSource = ''),
      (this._audioLoadInFlightPreload = ''));
    try {
      this.audioEl.pause?.();
    } catch {}
    (this.audioEl.removeAttribute?.('src'),
      clearDesktopMediaPlaybackSourceMetadata(this.audioEl),
      (this.audioEl.preload = 'none'));
    try {
      this.audioEl.load?.();
    } catch {}
  }
  ['_bindAudioLoadHandlers'](value163) {
    if (!this.audioEl) return;
    const value164 = () => {
        this._currentSrc === value163 &&
          (this._rememberAudioDuration(value163), this._restorePlaybackPosition(value163));
      },
      value165 = () => {
        this._currentSrc === value163 &&
          (this._rememberAudioDuration(value163), this._setPlaybackBuffering(false));
      };
    ((this.audioEl.onloadedmetadata = value164),
      (this.audioEl.ondurationchange = value164),
      (this.audioEl.onloadeddata = value165),
      (this.audioEl.oncanplay = value165),
      (this.audioEl.onplaying = value165),
      (this.audioEl.onerror = () => {
        if (this._currentSrc === value163) this._setPlaybackBuffering(false);
      }));
  }
  ['_prepareAudio'](value166) {
    const enabled30 = String(value166 || '').trim();
    if (!enabled30)
      return (
        typeof this._cancelDeferredWaveform === 'function' &&
          (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
        this._cancelWaveformRequest(),
        this._clearAudioElementSource(),
        (this._currentSrc = null),
        this._clearPlaybackResume(),
        this._progressController?.reset(),
        (this._audioDurationProbeToken += 1),
        false
      );
    const value167 = this._currentSrc !== enabled30;
    ((this._currentSrc = enabled30), this._clearStatusOverlay());
    value167 && (this._progressController?.reset(), this._clearPlaybackResume());
    const value168 = !!this._getAudioElementCurrentSource(),
      enabled31 = value168 && isMediaElementPlaybackSource(this.audioEl, enabled30);
    this._getAudioElementSource() && !enabled31 && this._clearAudioElementSource();
    if (!enabled31) this.audioEl.preload = 'none';
    (this._bindAudioLoadHandlers(enabled30),
      this._syncKnownAudioDurationUi({ currentTime: 0, showLine: false }),
      stopLoading(this.previewEl),
      void this._ensureWaveform(enabled30));
    if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    return (this._setAudioPreviewResultState(true), this._syncStatusOverlay(this._data, true), true);
  }
  ['_prepareDeferredAudio'](value169) {
    const enabled32 = String(value169 || '').trim();
    if (!enabled32) return this._prepareAudio('');
    if (this._currentSrc !== enabled32) this._clearPlaybackResume();
    ((this._currentSrc = enabled32), (this._audioDurationProbeToken += 1));
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    (this._cancelWaveformRequest(),
      this._clearStatusOverlay(),
      this._progressController?.reset?.(),
      this._syncKnownAudioDurationUi({ currentTime: 0, showLine: false }));
    if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    (this._setAudioPreviewResultState(true), this._syncStatusOverlay(this._data, true));
    if (this._rendererWaveformVisible === true) void this._ensureWaveform(enabled32);
    return true;
  }
  ['prepareRendererVisibleAudioSurface']() {
    return this._rendererMediaDeferred === true && !!this.audioEl && !!this._currentSrc;
  }
  async ['hydrateDeferredMedia']() {
    if (this._rendererMediaDeferred) this._rendererMediaDeferred = false;
    const enabled33 = this._resolveNodeAudioUrl(this._data);
    return (
      enabled33
        ? (this._prepareAudio(enabled33),
          this._applyResultWideLayout(this._data, false),
          this._syncAudioMultiResultStack(this._data))
        : (this._setAudioPreviewResultState(false),
          this._syncStatusOverlay(this._data, false),
          this._syncAudioMultiResultStack(this._data)),
      !!enabled33 && !!this.audioEl
    );
  }
  async ['_loadAudio'](value170, { showLoading: showLoading = true, preload: preload = 'auto' } = {}) {
    const enabled34 = String(value170 || '').trim();
    if (!enabled34) return this._prepareAudio('');
    const preload2 = preload === 'metadata' ? 'metadata' : 'auto',
      value171 = this._currentSrc !== enabled34;
    ((this._currentSrc = enabled34), this._clearStatusOverlay());
    value171 && (this._progressController?.reset(), this._clearPlaybackResume());
    this._bindAudioLoadHandlers(enabled34);
    const value172 = Number(this._audioLoadToken || 0) + 1;
    ((this._audioLoadToken = value172),
      (this._audioLoadInFlightSource = enabled34),
      (this._audioLoadInFlightPreload = preload2));
    try {
      const enabled35 = !!this._getAudioElementCurrentSource(),
        enabled36 = !isMediaElementPlaybackSource(this.audioEl, enabled34) || !enabled35,
        count9 = Number(this.audioEl?.networkState || 0),
        count10 = Number(this.audioEl?.readyState || 0),
        value173 =
          !enabled36 && count10 === 0 && (count9 === 0 || count9 === 1 || count9 === 3);
      if (!enabled36 && this._isAudioElementReady())
        return (
          preload2 === 'auto' &&
            this.audioEl.preload !== 'auto' &&
            (this.audioEl.preload = 'auto'),
          this._setPlaybackBuffering(false),
          true
        );
      showLoading && (enabled36 || value173) && this._setPlaybackBuffering(true);
      if (!enabled36) {
        const value174 = preload2 === 'auto' || this.audioEl.preload === 'auto' ? 'auto' : 'metadata';
        this.audioEl.preload !== value174 && (this.audioEl.preload = value174);
        if (value173)
          try {
            this.audioEl.load?.();
          } catch {}
      } else
        await attachMediaElementPlaybackSource(this.audioEl, enabled34, {
          preload: preload2,
          warmRanges: false,
          shouldAssign: () =>
            this._audioLoadToken === value172 &&
            this._currentSrc === enabled34 &&
            this.audioEl?.isConnected !== false,
        });
      if (this._isAudioElementReady()) this._setPlaybackBuffering(false);
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
      return (
        this._setAudioPreviewResultState(true),
        this._syncStatusOverlay(this._data, true),
        true
      );
    } finally {
      this._audioLoadToken === value172 &&
        ((this._audioLoadInFlightSource = ''), (this._audioLoadInFlightPreload = ''));
    }
  }
  async ['_playAudio']() {
    if (!this.audioEl || !this._currentSrc || this._audioPlayPending === true) return;
    ((this._audioPlayPending = true), beginAudioPlayback(this.nodeId));
    const value175 = this._currentSrc,
      value176 = Number(this._audioPlayAttemptToken || 0) + 1;
    this._audioPlayAttemptToken = value176;
    if (this._audioPlayDeadlineTimer) clearTimeout(this._audioPlayDeadlineTimer);
    const run3 = () => {
      if (this._audioPlayAttemptToken !== value176) return;
      ((this._audioPlayPending = false),
        this._audioPlayDeadlineTimer &&
          (clearTimeout(this._audioPlayDeadlineTimer), (this._audioPlayDeadlineTimer = null)));
    };
    this._audioPlayDeadlineTimer = setTimeout(() => {
      if (this._audioPlayAttemptToken !== value176 || this._currentSrc !== value175) return;
      ((this._audioPlayDeadlineTimer = null),
        this._clearAudioElementSource(),
        this._setPlayIcon(true));
    }, AUDIO_PLAY_LOADING_DEADLINE_MS);
    let enabled37 = false;
    try {
      enabled37 = await this._loadAudio(value175, { showLoading: true, preload: 'metadata' });
    } catch (error3) {
      (run3(), this._setPlaybackBuffering(false));
      if (error3?.name !== 'AbortError') console.warn('[AIGenAudioNode] load failed:', error3);
      return;
    }
    if (!enabled37 || !this._getAudioElementCurrentSource()) {
      (run3(), this._setPlaybackBuffering(false));
      return;
    }
    (this._restorePlaybackPosition(value175), this._rewindEndedAudioIfNeeded());
    let promise;
    try {
      promise = this.audioEl.play();
    } catch (value177) {
      (run3(),
        this._setPlaybackBuffering(false),
        console.warn('[AIGenAudioNode] play failed:', value177));
      return;
    }
    promise && typeof promise.catch === 'function'
      ? promise.then(() => {
          (run3(), this._setPlaybackBuffering(false));
        }).catch((error4) => {
          (run3(), this._setPlaybackBuffering(false));
          if (error4?.name === 'AbortError') return;
          console.warn('[AIGenAudioNode] play failed:', error4);
        })
      : (run3(), this._setPlaybackBuffering(false));
  }
  ['_stopAudioForExternalPlayback']() {
    if (!this.audioEl) return;
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    const value178 = !!this._getAudioElementCurrentSource(),
      value179 = !!this._audioLoadInFlightSource;
    if (value178 && this._currentSrc) {
      const value180 = Number(this.audioEl.currentTime || 0),
        currentTime6 = Number.isFinite(value180) ? Math.max(0, value180) : 0;
      ((this._playbackResumeSource = this._currentSrc),
        (this._playbackResumeTime = currentTime6),
        this._syncKnownAudioDurationUi({ currentTime: currentTime6, showLine: currentTime6 > 0 }));
    }
    ((value178 || value179) &&
      (this._clearAudioElementSource(),
      value178 &&
        this._syncKnownAudioDurationUi({
          currentTime: this._playbackResumeTime,
          showLine: this._playbackResumeTime > 0,
        })),
      this._setPlaybackBuffering(false),
      this._setPlayIcon(true));
  }
  ['getRendererMediaState']() {
    return {
      deferred: this._rendererMediaDeferred === true,
      interactionActive: this._isSeeking === true,
    };
  }
  ['suspendRendererMedia']() {
    this.setRendererAudioSurfaceVisible(false);
    if (!this.audioEl || this.audioEl.paused === false) return false;
    return (this._stopAudioForExternalPlayback(), true);
  }
  ['_syncPromptBoxSizeFromData'](value181 = this._data) {
    if (!this.promptEl || this._isPromptBoxResizing) return;
    const promptBoxHeightBounds = getPromptBoxHeightBounds(this._promptPanel),
      promptBoxHeight = normalizePromptBoxHeight(value181?.promptBoxHeight, promptBoxHeightBounds);
    applyPromptBoxHeight(this.promptEl, promptBoxHeight);
  }
  ['_setupPromptBoxResize']() {
    if (!this._promptPanel || this._promptResizeHandle) return;
    this._promptResizeHandle = true;
    const value182 = 20,
      value183 = 10,
      handler = () =>
        getStoreSnapshot().ui?.promptBoxResizeEnabled !== false &&
        !this._promptPanel.classList.contains('is-prompt-expanded'),
      handler2 = (el45) => !!el45?.closest('.floating-menu, .img-model-menu'),
      handler3 = (value184) => {
        const box8 = this._promptPanel.getBoundingClientRect();
        return value184 >= box8.bottom - value182 && value184 <= box8.bottom + value183;
      },
      handler4 = (event27) => {
        if (!this._promptPanel) return;
        if (!handler()) {
          this._promptPanel.classList.remove('is-resize-hover');
          return;
        }
        if (this._isPromptBoxResizing) {
          this._promptPanel.classList.add('is-resize-hover');
          return;
        }
        const value185 = !handler2(event27?.target) && handler3(event27.clientY);
        this._promptPanel.classList.toggle('is-resize-hover', value185);
      };
    (this._promptPanel.addEventListener('pointermove', handler4),
      this._promptPanel.addEventListener('pointerleave', () => {
        !this._isPromptBoxResizing && this._promptPanel?.classList.remove('is-resize-hover');
      }));
    const value186 = (event28) => {
      if (!this._promptInputWrap || !this.promptEl) return;
      if (!handler()) return;
      if (event28.button !== 0) return;
      if (!handler3(event28.clientY)) return;
      if (event28.target?.closest('.prompt-submit') || handler2(event28.target)) return;
      (event28.stopPropagation(), event28.preventDefault());
      const promptBoxHeightBounds2 = getPromptBoxHeightBounds(this._promptPanel),
        value187 = event28.clientY,
        value188 = this.promptEl.getBoundingClientRect().height;
      ((this._isPromptBoxResizing = true),
        this._promptInputWrap.classList.add('is-resizing'),
        this._promptPanel.classList.add('is-resize-hover'));
      const value189 = (event29) => {
          event29.preventDefault();
          const promptBoxHeight2 = normalizePromptBoxHeight(
            value188 + (event29.clientY - value187),
            promptBoxHeightBounds2,
          );
          applyPromptBoxHeight(this.promptEl, promptBoxHeight2);
        },
        value190 = (event30) => {
          (event30.preventDefault(),
            window.removeEventListener('pointermove', value189),
            window.removeEventListener('pointerup', value190),
            window.removeEventListener('pointercancel', value190));
          const promptBoxHeight3 = normalizePromptBoxHeight(
            this.promptEl?.getBoundingClientRect().height,
            promptBoxHeightBounds2,
          );
          (applyPromptBoxHeight(this.promptEl, promptBoxHeight3),
            this._promptInputWrap.classList.remove('is-resizing'),
            (this._isPromptBoxResizing = false),
            this._promptPanel.classList.remove('is-resize-hover'),
            handler4(event30),
            appStore.updateNodeData(this.nodeId, { promptBoxHeight: promptBoxHeight3 }));
        };
      (window.addEventListener('pointermove', value189),
        window.addEventListener('pointerup', value190),
        window.addEventListener('pointercancel', value190),
        (this._promptResizeCleanup = () => {
          (this._promptPanel?.removeEventListener('pointerdown', value186),
            this._promptPanel?.removeEventListener('pointermove', handler4),
            window.removeEventListener('pointermove', value189),
            window.removeEventListener('pointerup', value190),
            window.removeEventListener('pointercancel', value190));
        }));
    };
    (this._promptPanel.addEventListener('pointerdown', value186),
      (this._promptResizeCleanup = () => {
        (this._promptPanel?.removeEventListener('pointerdown', value186),
          this._promptPanel?.removeEventListener('pointermove', handler4),
          this._promptPanel?.classList.remove('is-resize-hover'));
      }));
  }
  ['update'](value191) {
    ((this._data = value191),
      this._syncPromptBoxSizeFromData(value191),
      this._syncWorkflowDefaults());
    const value192 = this._getCurrentWorkflow().key;
    this._enforceWorkflowAudioInputLimit();
    const enabled38 = this._resolveNodeAudioUrl(value191);
    if (this._rendererMediaDeferred && enabled38)
      enabled38 !== this._currentSrc
        ? this._prepareDeferredAudio(enabled38)
        : (this._syncKnownAudioDurationUi({
            currentTime: this.audioEl?.currentTime || 0,
            showLine: Number(this.audioEl?.currentTime || 0) > 0,
          }),
          this._setAudioPreviewResultState(true),
          this._syncStatusOverlay(value191, true));
    else {
      if (enabled38 && enabled38 !== this._currentSrc && this.audioEl)
        (this._prepareAudio(enabled38),
          this._applyResultWideLayout(value191, false),
          this._syncStatusOverlay(value191, true));
      else {
        if (!enabled38 && this.audioEl)
          (typeof this._cancelDeferredWaveform === 'function' &&
            (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
            this._cancelWaveformRequest(),
            this._clearAudioElementSource(),
            (this._currentSrc = null),
            this._clearPlaybackResume(),
            this._progressController?.reset(),
            (this._audioDurationProbeToken += 1),
            this._setAudioPreviewResultState(false),
            this._syncStatusOverlay(value191, false));
        else
          enabled38
            ? (this._syncKnownAudioDurationUi({
                currentTime: this.audioEl?.currentTime || 0,
                showLine: Number(this.audioEl?.currentTime || 0) > 0,
              }),
              this._applyResultWideLayout(value191, false),
              this._setAudioPreviewResultState(true),
              this._syncStatusOverlay(value191, true))
            : this._syncStatusOverlay(value191, false);
      }
    }
    enabled38 &&
      String(value191?.waveformLocalPath || '').trim() !== this._waveformLocalPath &&
      void this._ensureWaveform(enabled38);
    if (!this._rendererMediaDeferred) this._syncAudioMultiResultStack(value191);
    shouldShowGenerationBusyUi(value191) &&
      ((this._isGenerating = true), startLoading(this.previewEl));
    if (this._rendererDetailsDeferred === true) {
      this._maybeResumeRunningHubTask();
      return;
    }
    if (
      doesAudioWorkflowAcceptTextInput(value192) &&
      document.activeElement !== this.promptEl &&
      value191.prompt !== undefined
    ) {
      if (!isVirtualizedPromptEditorCurrent(this, value191.prompt)) {
        const sanitizePromptHtml3 = sanitizePromptHtml(value191.prompt || '');
        this.promptEl?.innerHTML !== sanitizePromptHtml3 &&
          (clearVirtualizedPromptCommit(this),
          (this.promptEl.innerHTML = sanitizePromptHtml3),
          _rehydratePromptPills(this));
      }
    }
    this._refreshWorkflowUi();
    const args5 = appStore.getIncomingEdges(this.nodeId),
      list16 = [...args5],
      value193 = list16.map((value194) =>
        [
          String(value194?.id || ''),
          String(value194?.sourceId || ''),
          String(value194?.refSlot || ''),
          String(value194?.sourceMediaKey || ''),
        ].join(':'),
      ).join('|'),
      value195 = list16.map((value196) => {
        const value197 = appStore.getState().nodes?.[value196.sourceId] || {},
          value198 = Number(value197._bizRev || 0),
          value199 = Number.isFinite(Number(value197.mainVideoIndex))
            ? Math.max(0, Math.trunc(Number(value197.mainVideoIndex)))
            : 0,
          value200 = Array.isArray(value197.videos)
            ? value197.videos[value199] || value197.videos[0]
            : null,
          value201 = [
            String(value197.thumbId || ''),
            String(value197.thumbUrl || ''),
            String(value200?.thumbId || ''),
            String(value200?.thumbUrl || ''),
            String(value200?.localPath || ''),
            String(value200?.videoUrl || ''),
            String(value197.localPath || ''),
            String(value197.src || ''),
            String(value197.imageUrl || ''),
            String(value197.videoUrl || ''),
            String(value197.audioUrl || ''),
          ].join('|');
        return (
          value196.id +
          ':' +
          value196.sourceId +
          ':' +
          String(value196?.refSlot || '') +
          ':' +
          String(value196?.sourceMediaKey || '') +
          ':' +
          value198 +
          ':' +
          value201
        );
      }).join('||');
    ((value193 !== this._lastEdgeSig ||
      value195 !== this._lastRefMediaSig ||
      value192 !== this._lastWorkflowKey) &&
      ((this._lastEdgeSig = value193),
      (this._lastRefMediaSig = value195),
      (this._lastWorkflowKey = value192),
      this._renderRefBar()),
      this._syncPickConnectVisualState(),
      this._maybeResumeRunningHubTask(),
      this._updateSubmitButtonState());
  }
  async ['_buildPayload'](value202 = null) {
    (this._uiSchemaCleanup?.flushPendingTextCommits?.(), this._enforceWorkflowAudioInputLimit());
    const { payload: payload5, validation: validation3 } = this._buildPayloadSnapshot(value202);
    if (!validation3.ok) return (window.showToast?.(validation3.message, 'warn'), null);
    if (!(await this._validateAdvancedVoiceCloneDurations(payload5.audioRefs))) return null;
    return payload5;
  }
  ['_getPreviewGenerateButtonLoadingOptions']() {
    return createPreviewGenerateButtonCallbacks(this, aigenAudioText('buttons.generate'));
  }
  async ['_handleAudioTaskFailure'](error5, { payload: payload6, recovering: recovering = false } = {}) {
    if (recovering) return;
    if (String(error5?.code || '') === 'SUBSCRIPTION_REQUIRED') {
      const modelId3 =
        String(error5?.requiredModelId || '').trim() ||
        this._getCurrentGateModelId() ||
        this._data?.model ||
        '';
      if (typeof window.handleSubscriptionRequired === 'function')
        await window.handleSubscriptionRequired({
          modelId: modelId3,
          provider: 'runninghubwf',
          error: error5,
        });
      else
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: modelId3, provider: 'runninghubwf' })
          : window.showToast?.(error5?.message || aigenAudioText('vip.needSubscription'), 'warn');
      return;
    }
    console.error('[AIGenAudioNode] 生成失败:', error5);
    const showProviderApiKeyMissingToastForError2 = showProviderApiKeyMissingToastForError(error5, {
      providerId: payload6?.provider,
      model: payload6?.audioWorkflowKey,
      adapterType: payload6?.adapterType,
    });
    !showProviderApiKeyMissingToastForError2 &&
      window.showToast?.(
        aigenAudioText('generation.failedWithError', { error: error5?.message || error5 }),
        'error',
      );
  }
  async ['_onGenerate'](template2 = null, value203 = {}) {
    if (this._audioRefUploadPending) return;
    if (this._isGenerating) return;
    if (value203?.insertPrompt === true) {
      (insertPresetPromptIntoEditor({
        storeApi: appStore,
        nodeId: this.nodeId,
        promptEl: this.promptEl,
        template: template2,
        inEdges: appStore.getIncomingEdges(this.nodeId),
        nodes: appStore.getState().nodes || {},
        allowedAssetTypes: ['text', 'audio'],
      }),
        this._updateSubmitButtonState());
      return;
    }
    if (shouldUsePromptPreviewForPreset(template2)) {
      const promptText = await this._buildPayload(template2);
      if (!promptText) {
        this._updateSubmitButtonState();
        return;
      }
      (previewPresetPromptInEditor({
        storeApi: appStore,
        nodeId: this.nodeId,
        promptEl: this.promptEl,
        promptText: promptText.prompt,
      }),
        this._updateSubmitButtonState());
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
    if (!(await this._ensureVipAccessForCurrentWorkflow())) {
      this._updateSubmitButtonState();
      return;
    }
    const modelId4 = this._getCurrentWorkflow(),
      guardModelGenerationCredentials2 = guardModelGenerationCredentials({
        modelId: modelId4.key,
        provider: modelId4.provider,
        providerProfileId: this._data?.providerProfileId || this._data?.rhProviderProfileId,
        adapterType: modelId4.adapterType,
      });
    if (!guardModelGenerationCredentials2.ready) {
      this._updateSubmitButtonState();
      return;
    }
    const model = await this._buildPayload(template2);
    if (!model) {
      this._updateSubmitButtonState();
      return;
    }
    const value204 =
      String(model?.provider || '')
        .trim()
        .toLowerCase() === 'runninghub' &&
      String(model?.adapterType || '').trim() === 'modelApi';
    if (value204) {
      await ensureConfig();
      const providerConfig = getProviderConfig('runninghub') || {},
        enabled39 = String(providerConfig?.modelApiKey || model?.apiKey || '').trim();
      if (!enabled39) {
        (showProviderApiKeyMissingToast('请先填写 RunningHub 模型 API Key', {
          providerId: 'runninghub',
          keyType: 'modelApi',
          model: model?.audioWorkflowKey,
          adapterType: model?.adapterType,
        }),
          this._updateSubmitButtonState());
        return;
      }
      model.apiKey = enabled39;
    }
    return this._audioTaskOrchestration.runGeneration({ payload: model, startedAt: Date.now() });
  }
  ['_renderRefBar']() {
    if (!this.refBarEl) return;
    const workflowKey2 = this._getCurrentWorkflow().key;
    this._refBarWorkflowKey !== workflowKey2 &&
      ((this._refBarWorkflowKey = workflowKey2),
      (this.refBarEl.innerHTML = ''),
      this.refBarEl.classList.remove('active', 'rh-v5-refbar'));
    const list17 = getAudioWorkflowSlots(workflowKey2, { includeImages: true }),
      enabled40 = list17.length > 0,
      promptAttachmentButtonHTML = createPromptAttachmentButtonHTML(),
      list18 = appStore.getIncomingEdges(this.nodeId),
      value205 = appStore.getState().nodes || {},
      value206 = {},
      value207 = { text: 0, image: 0, video: 0, audio: 0 },
      value208 = {
        text: aigenAudioText('assetTypes.text'),
        image: aigenAudioText('assetTypes.image'),
        video: aigenAudioText('assetTypes.video'),
        audio: aigenAudioText('assetTypes.audio'),
      };
    if (!enabled40) {
      if (list18.length === 0) {
        const value209 = promptAttachmentButtonHTML;
        this._lastRefHTML !== value209 &&
          ((this._lastRefHTML = value209),
          this.refBarEl.classList.remove('active', 'rh-v5-refbar'),
          (this.refBarEl.innerHTML = value209));
        ((this._attachBtnIcon =
          this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || null),
          this._syncPickConnectVisualState(),
          _syncPillLabels(this, value206));
        return;
      }
      (this.refBarEl.classList.add('active'),
        this.refBarEl.classList.remove('rh-v5-refbar'));
      const list19 = [];
      for (const edgeId2 of list18) {
        const enabled41 = value205[edgeId2.sourceId];
        if (!enabled41) continue;
        const list20 = String(enabled41.type || '');
        let kind = 'image';
        if (list20.includes('text')) kind = 'text';
        else {
          if (list20.includes('video')) kind = 'video';
          else {
            if (list20.includes('audio')) kind = 'audio';
          }
        }
        (value207[kind]++,
          (value206[edgeId2.sourceId] = '@' + value208[kind] + value207[kind]));
        const list21 = [
            String(enabled41?.thumbUrl || '').trim(),
            String(enabled41?.imageUrl || '').trim(),
            String(enabled41?.src || '').trim(),
            toLocalAssetUrl(enabled41?.localPath),
            String(enabled41?.audioUrl || '').trim(),
          ].filter(Boolean),
          thumbnailUrl =
            (kind === 'video' ? resolveReferenceVideoThumbnail(enabled41, edgeId2).thumbUrl : '') ||
            list21.find((value210) => isLikelyImageUrl(value210)) ||
            '';
        if (thumbnailUrl) ensureThumbDecoded(thumbnailUrl);
        const sig =
          edgeId2.id + '|' + edgeId2.sourceId + '|' + (thumbnailUrl || kind + '-fallback');
        list19.push({
          edgeId: edgeId2.id,
          sourceId: edgeId2.sourceId,
          sig: sig,
          html: createReferenceInputThumbnailHtml({ kind: kind, thumbnailUrl: thumbnailUrl }),
        });
      }
      const value211 =
        promptAttachmentButtonHTML +
        '<div class="ref-thumb-container">' +
        list19.map(
          (value212) =>
            '<div class="ref-thumb-wrap" data-edge-id="' +
            value212.edgeId +
            '" data-source-id="' +
            value212.sourceId +
            '" data-sig="' +
            value212.sig +
            '" draggable="true">' +
            value212.html +
            '<button type="button" class="ref-thumb-delete" title="' +
            aigenAudioText('refs.remove') +
            '">&times;</button></div>',
        ).join('') +
        '</div>';
      this._lastRefHTML !== value211 &&
        ((this._lastRefHTML = value211), (this.refBarEl.innerHTML = value211));
      ((this._attachBtnIcon =
        this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || null),
        this._syncPickConnectVisualState(),
        _syncPillLabels(this, value206));
      return;
    }
    const audioRefs3 = [];
    for (const edgeId3 of list18) {
      const sourceNode = value205[edgeId3.sourceId];
      if (!sourceNode) continue;
      const sourceType2 = String(sourceNode.type || '');
      let value213 = 'image';
      if (sourceType2.includes('text')) value213 = 'text';
      else {
        if (sourceType2.includes('video')) value213 = 'video';
        else {
          if (sourceType2.includes('audio')) value213 = 'audio';
        }
      }
      (value207[value213]++,
        (value206[edgeId3.sourceId] = '@' + value208[value213] + value207[value213]),
        value213 === 'audio' &&
          audioRefs3.push({
            edgeId: edgeId3.id,
            sourceId: edgeId3.sourceId,
            sourceType: sourceType2,
            refSlot: String(edgeId3?.refSlot || ''),
            url: this._resolveAudioRefUrl(sourceNode),
            edge: edgeId3,
            sourceNode: sourceNode,
          }));
    }
    const nodeData4 = value205?.[this.nodeId] || this._data || {},
      audioWorkflowInputPlan = buildAudioWorkflowInputPlan({
        workflowKey: workflowKey2,
        audioRefs: audioRefs3,
        assetInputRefs: getAssetInputRefsFromPromptAndNode(this.promptEl, {
          nodeData: nodeData4,
          allowedTypes: ['audio'],
        }),
      }),
      value214 = {};
    list17.forEach((value215) => (value214[value215.slot] = null));
    const run4 = (value216, id3) => {
        const edgeId4 = id3?.edge || {
            id: id3?.edgeId,
            sourceId: id3?.sourceId,
          },
          enabled42 = id3?.sourceNode || value205[id3?.sourceId];
        if (!enabled42) return null;
        const list22 = [
            String(enabled42?.thumbUrl || '').trim(),
            String(enabled42?.imageUrl || '').trim(),
            String(enabled42?.src || '').trim(),
            toLocalAssetUrl(enabled42?.localPath),
            String(enabled42?.audioUrl || '').trim(),
          ].filter(Boolean),
          thumbnailUrl2 = list22.find((value217) => isLikelyImageUrl(value217)) || '';
        if (thumbnailUrl2) ensureThumbDecoded(thumbnailUrl2);
        const sig2 =
          value216 +
          '|' +
          edgeId4.id +
          '|' +
          edgeId4.sourceId +
          '|' +
          (thumbnailUrl2 || 'audio-fallback');
        return {
          edgeId: edgeId4.id,
          sourceId: edgeId4.sourceId,
          sig: sig2,
          html: createReferenceInputThumbnailHtml({
            kind: id3.kind || 'audio',
            thumbnailUrl: thumbnailUrl2,
          }),
        };
      },
      handler5 = (value218, value219) => {
        const value220 = value219?.assetInputRef || value219 || {},
          list23 = [
            String(value220?.thumbUrl || '').trim(),
            String(value220?.nodeData?.thumbUrl || '').trim(),
            String(value220?.nodeData?.imageUrl || '').trim(),
            String(value220?.nodeData?.src || '').trim(),
            toLocalAssetUrl(value220?.nodeData?.localPath),
          ].filter(Boolean),
          thumbnailUrl3 = list23.find((value221) => isLikelyImageUrl(value221)) || '';
        if (thumbnailUrl3) ensureThumbDecoded(thumbnailUrl3);
        const assetId2 = String(value220.assetId || ''),
          assetIndex = String(value220.itemIndex ?? ''),
          assetOccurrence = String(value220.assetMentionOccurrence ?? ''),
          assetRefSource = String(value220.assetRefSource || 'prompt'),
          sig3 =
            value218 +
            '|asset:' +
            assetId2 +
            ':' +
            assetIndex +
            ':' +
            assetOccurrence +
            '|' +
            (thumbnailUrl3 || 'audio-fallback');
        return {
          edgeId: '',
          sourceId: 'asset:' + assetId2 + ':' + assetIndex,
          sig: sig3,
          html: createReferenceInputThumbnailHtml({ kind: 'audio', thumbnailUrl: thumbnailUrl3 }),
          virtual: true,
          assetId: assetId2,
          assetIndex: assetIndex,
          assetOccurrence: assetOccurrence,
          assetRefSource: assetRefSource,
          refType: 'audio',
        };
      };
    Object.entries(audioWorkflowInputPlan.slotItems).forEach(([value222, enabled43]) => {
      if (!enabled43) return;
      value214[value222] =
        enabled43.origin === 'asset' ? handler5(value222, enabled43) : run4(value222, enabled43);
    });
    for (const value223 of buildAudioWorkflowImageSlotItems(workflowKey2, list18, value205)) {
      value214[value223.refSlot] = run4(value223.refSlot, value223);
    }
    this.refBarEl.classList.add('active', 'rh-v5-refbar');
    let container = this.refBarEl.querySelector('.rh-v5-ref-container');
    const value224 =
      !container ||
      !this.refBarEl.querySelector('.prompt-attachment-btn') ||
      container.querySelectorAll('[data-slot]').length !== list17.length;
    value224 &&
      ((this.refBarEl.innerHTML =
        promptAttachmentButtonHTML +
        ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="' +
        aigenAudioText('refs.inputAria') +
        '">\n        ' +
        list17.map(
          (value225) =>
            '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-slot="' +
            value225.slot +
            '" title="' +
            escapeInputSlotLabelHtml(value225.label) +
            '"><span class="ref-upload-label">' +
            formatInputSlotLabelHtml(value225.label) +
            '</span></button>',
        ).join('') +
        '\n      </div>'),
      (container = this.refBarEl.querySelector('.rh-v5-ref-container')));
    const run5 = (value226, enabled44, value227) => {
      if (!container) return;
      const el46 = container.querySelector('[data-slot="' + value226 + '"]');
      if (!enabled44) {
        if (
          el46 &&
          el46.tagName === 'BUTTON' &&
          el46.classList.contains('ref-upload-slot')
        )
          return;
        const el47 = document.createElement('button');
        ((el47.type = 'button'),
          (el47.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
          (el47.dataset.slot = value226),
          (el47.title = value227));
        const el48 = document.createElement('span');
        ((el48.className = 'ref-upload-label'),
          (el48.innerHTML = formatInputSlotLabelHtml(value227)),
          el47.appendChild(el48));
        if (el46) el46.replaceWith(el47);
        else container.appendChild(el47);
        return;
      }
      const el49 = document.createElement('div');
      ((el49.className =
        'ref-thumb-wrap rh-v5-ref-box' + (enabled44.virtual ? ' ref-thumb-wrap--asset' : '')),
        el49.setAttribute('draggable', enabled44.virtual ? 'false' : 'true'),
        (el49.dataset.slot = value226),
        (el49.dataset.edgeId = enabled44.edgeId),
        (el49.dataset.sourceId = enabled44.sourceId),
        (el49.dataset.sig = enabled44.sig),
        (el49.dataset.refOrigin = enabled44.virtual ? 'asset' : 'node'));
      enabled44.virtual &&
        ((el49.dataset.assetId = enabled44.assetId || ''),
        (el49.dataset.assetIndex = enabled44.assetIndex || ''),
        (el49.dataset.assetOccurrence = enabled44.assetOccurrence || ''),
        (el49.dataset.assetRefSource = enabled44.assetRefSource || 'prompt'),
        (el49.dataset.refType = enabled44.refType || 'audio'));
      ((el49.innerHTML =
        enabled44.html +
        '<button type="button" class="ref-thumb-delete" title="' +
        aigenAudioText('refs.remove') +
        '">&times;</button>'),
        revealRefThumbMedia(el49, enabled44.sig));
      if (el46) el46.replaceWith(el49);
      else container.appendChild(el49);
    };
    (list17.forEach((value228) =>
      run5(value228.slot, value214[value228.slot], value228.label),
    ),
      bindRefThumbFixedSlotDrag({
        owner: this,
        container: container,
        store: appStore,
        nodeId: this.nodeId,
        acceptMap: Object.fromEntries(
          list17.map((value229) => [value229.slot, value229.kind || 'audio']),
        ),
      }),
      (this._attachBtnIcon =
        this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || null),
      this._syncPickConnectVisualState(),
      _syncPillLabels(this, value206));
  }
  ['_clearToolbarActionBindings']() {
    if (!Array.isArray(this._toolbarActionCleanups)) {
      this._toolbarActionCleanups = [];
      return;
    }
    for (const run6 of this._toolbarActionCleanups.splice(0)) run6();
  }
  ['unmount']() {
    ((this._rendererWaveformVisible = false),
      this._releaseRendererPlaybackPin?.(),
      (this._releaseRendererPlaybackPin = null),
      this._clearToolbarActionBindings(),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      this._unregisterAudioPlaybackClient?.(),
      (this._unregisterAudioPlaybackClient = null),
      this._flushPromptHtmlCommit?.(),
      this._assetMentionRegistryUnsubscribe?.(),
      (this._assetMentionRegistryUnsubscribe = null),
      (this._assetMentionRegistryRefreshPending = false),
      this._audioTaskOrchestration.dispose({
        preserveTask: shouldPreserveGenerationTaskOnUnmount(this.nodeId),
      }),
      this._clearStatusOverlay(),
      this._clearAudioMultiResultStack(),
      this._closeModelMenu(),
      this._docClickHandler &&
        (document.removeEventListener('click', this._docClickHandler),
        (this._docClickHandler = null)),
      this._unbindRefThumbHoverPreview &&
        (this._unbindRefThumbHoverPreview(), (this._unbindRefThumbHoverPreview = null)),
      this._progressController?.destroy(),
      (this._progressController = null),
      typeof this._cancelDeferredWaveform === 'function' &&
        (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
      this._cancelWaveformRequest(),
      this._clearAudioElementSource(),
      this._promptResizeCleanup && (this._promptResizeCleanup(), (this._promptResizeCleanup = null)),
      this._uiSchemaCleanup?.(),
      (this._uiSchemaCleanup = null),
      this._footerControllerCleanup?.(),
      (this._footerControllerCleanup = null),
      this._generationNodeHelpTip?.remove(),
      (this._generationNodeHelpTip = null),
      this._promptPresetTrigger?.remove(),
      (this._promptPresetTrigger = null),
      this._promptExpansion?.remove(),
      (this._promptExpansion = null),
      this._modelProviderProfileControl?.remove(),
      (this._modelProviderProfileControl = null),
      this._promptPanel?.classList.remove('is-resize-hover'),
      this._promptInputWrap?.classList.remove('is-resizing'),
      (this._isPromptBoxResizing = false));
  }
}
