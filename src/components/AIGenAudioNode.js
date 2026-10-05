import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import {
  buildGenerateAudioRequest,
  cancelRunningHubAudioTask,
  generateAudio,
  resumeRunningHubAudioTask,
} from '../../api/aiAudioApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { uploadFile } from '../modules/project.js';
import { saveRemoteAudioLocallyDetailed } from '../modules/project.js';
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
  removeAssetMentionPillFromPrompt,
  removePromptAssetInputRefFromNode,
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
import { createReferenceFallbackThumbHtml } from '../modules/referenceThumbnailFallback.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation } from '../modules/slashMenu.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import { bindRefThumbHoverPreview } from '../modules/refThumbHoverPreview.js';
import { bindRefThumbFixedSlotDrag } from '../modules/refThumbDragController.js';
import {
  deferWaveformPathUntilAudioReady,
  getWaveformBarsPathFromPersistedUrl,
  getWaveformBarsPathFromUrl,
} from '../utils/audioWaveform.js';
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
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../utils/debugRequestPreview.js';
import { createPromptAttachmentButtonHTML } from './refAttachmentButton.js';
import { getModelManifest, RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID } from '../manifests/index.js';
import { isVipModel, resolveVipGateModelId } from '../modules/subscriptionAccess.js';
import {
  bindModelUiSchemaControls,
  buildModelUiSchemaDefaultParams,
  renderModelUiSchemaControls,
  syncModelUiSchemaControls,
} from './aigenImage/uiSchemaRenderer.js';
import {
  buildAudioModelMenuHtml,
  buildAudioModelTriggerHtml,
  buildAudioWorkflowItems,
} from './audio-node/audioModelMenuHelpers.js';
import { buildAudioGenerationResultPatch } from './audio-node/audioGenerationResultRenderer.js';
import { bindAudioDownloadAction } from './nodeToolbar/audioActions/downloadAction.js';
import { bindNodeFooterController, bindNodeModelMenuTrigger } from './shared/nodeFooterControls.js';
import {
  createGenerationNodeHelpTipController,
  getGenerationNodeHelpTooltip,
} from './generationNodeHelpTip.js';
import {
  getTaskMessage,
  resolveGenerationButtonMode,
  shouldAllowCancel,
  shouldShowGenerationBusyUi,
} from '../core/generationTaskUiState.js';
import { cancelTask, resumeTask, submitTask } from '../core/generationTaskRuntime.js';
const WAVE_PATH =
    'M10,40 L10,40 M20,20 L20,60 M30,25 L30,55 M40,30 L40,50 M50,22 L50,58 M60,28 L60,52 M70,24 L70,56 M80,20 L80,60 M90,26 L90,54 M100,22 L100,58 M110,30 L110,50 M120,15 L120,65 M130,35 L130,45 M140,30 L140,50 M150,40 L150,40 M160,30 L160,50 M170,22 L170,58 M180,28 L180,52 M190,24 L190,56',
  ADVANCED_VOICE_CLONE_WORKFLOW_KEY = RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  ADVANCED_VOICE_CLONE_MIN_SECONDS = 3,
  ADVANCED_VOICE_CLONE_MAX_SECONDS = 15.05;
function aigenAudioText(value, item = {}) {
  return t('aigenAudioNode.' + value, item);
}
const AUDIO_WORKFLOW_VALIDATORS = Object.freeze({
    indextts2_clone(key) {
      const list = Array.isArray(key?.audioRefs) ? key.audioRefs : [],
        enabled = list.some((item2) => String(item2?.refSlot || '') === 'audioRef');
      if (!enabled) return aigenAudioText('validation.referenceVoiceRequired');
      const enabled2 = list.some((item3) => String(item3?.refSlot || '') === 'audio2');
      if (!enabled2 && !String(key?.prompt || '').trim()) return aigenAudioText('validation.promptRequired');
      return '';
    },
    voice_convert(index) {
      const list2 = Array.isArray(index?.audioRefs) ? index.audioRefs : [],
        enabled3 = list2.some((item4) => String(item4?.refSlot || '') === 'audioRef'),
        enabled4 = list2.some((item5) => String(item5?.refSlot || '') === 'audioTarget');
      if (!enabled3 || !enabled4) return aigenAudioText('validation.voiceConvertRefsRequired');
      return '';
    },
    [ADVANCED_VOICE_CLONE_WORKFLOW_KEY](result) {
      if (!String(result?.prompt || '').trim()) return aigenAudioText('validation.promptRequired');
      return '';
    },
  }),
  AUDIO_WORKFLOW_ITEMS = buildAudioWorkflowItems(AUDIO_WORKFLOW_VALIDATORS),
  AUDIO_WORKFLOW_MAP = new Map(AUDIO_WORKFLOW_ITEMS.map((event) => [event.key, event])),
  AUDIO_WORKFLOW_LABEL_MAP = new Map(AUDIO_WORKFLOW_ITEMS.map((event2) => [event2.label, event2.key])),
  TEXT_INPUT_TYPES = new Set(['source-text', 'text', 'ai-text', 'custom-ai-text']),
  AUDIO_INPUT_TYPES = new Set(['source-audio', 'audio', 'ai-audio']),
  VIDEO_INPUT_TYPES = new Set(['source-video', 'video', 'ai-video']),
  AUDIO_RESULT_WIDTH = 420,
  AUDIO_RESULT_HEIGHT = 180,
  AUDIO_RESULT_RATIO = AUDIO_RESULT_WIDTH / AUDIO_RESULT_HEIGHT,
  getStoreSnapshot = () =>
    typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function getWorkflowAudioInputLimit(data) {
  return getWorkflowAudioSlots(data).length || 1;
}
function getWorkflowAudioSlots(options) {
  const list3 = getModelManifest(options)?.inputSlots?.fixedSlots;
  if (Array.isArray(list3) && list3.length > 0)
    return list3
      .map((item6) => ({
        slot: String(item6?.id || ''),
        label: String(item6?.label || item6?.id || ''),
      }))
      .filter((item7) => item7.slot);
  return [{ slot: 'audioRef', label: aigenAudioText('refs.referenceVoice') }];
}
function normalizeWorkflowAudioRefSlots(list4 = [], target) {
  const list5 = Array.isArray(list4) ? list4 : [],
    refSlot = getWorkflowAudioSlots(target).map((item8) => item8.slot);
  if (refSlot.length === 0) return list5;
  const map = new Set();
  return list5.map((args) => {
    const refSlot2 = String(args?.refSlot || '').trim();
    if (refSlot2 && refSlot.includes(refSlot2) && !map.has(refSlot2))
      return (map.add(refSlot2), { ...args, refSlot: refSlot2 });
    const refSlot3 = refSlot.find((item9) => !map.has(item9)) || '';
    if (!refSlot3) return { ...args, refSlot: refSlot.includes(refSlot2) ? refSlot2 : '' };
    return (map.add(refSlot3), { ...args, refSlot: refSlot3 });
  });
}
function getWorkflowGateModelId(source) {
  if (!isVipModel(source, 'runninghubwf')) return '';
  return resolveVipGateModelId(source, 'runninghubwf');
}
function getWorkflowByKey(next) {
  return AUDIO_WORKFLOW_MAP.get(String(next || '').trim());
}
function resolveWorkflowKeyFromNodeData(options2 = {}) {
  const current = [options2.audioWorkflowKey, options2.model, options2.audioWorkflowLabel].map((item10) =>
    String(item10 || '').trim(),
  );
  for (const enabled5 of current) {
    if (!enabled5) continue;
    const entry =
      (AUDIO_WORKFLOW_MAP.has(enabled5) ? enabled5 : '') || AUDIO_WORKFLOW_LABEL_MAP.get(enabled5) || '';
    if (entry) return entry;
  }
  return '';
}
function getDefaultWorkflow() {
  return AUDIO_WORKFLOW_ITEMS[0];
}
function getPlainGenerationParams(args2) {
  return args2 && typeof args2 === 'object' && !Array.isArray(args2) ? { ...args2 } : {};
}
function getWorkflowUiSchemaField(record, payload) {
  const list6 = getModelManifest(record)?.uiSchema?.fields;
  if (!Array.isArray(list6)) return null;
  return list6.find((item11) => String(item11?.id || '').trim() === payload) || null;
}
function resolveWorkflowSchemaParam(handle, state, config) {
  const workflowUiSchemaField = getWorkflowUiSchemaField(state, config);
  if (!workflowUiSchemaField) throw new Error('RunningHub audio manifest ' + state + ' missing ' + config);
  if (workflowUiSchemaField.defaultValue === undefined)
    throw new Error('RunningHub audio manifest ' + state + ' missing ' + config + ' defaultValue');
  const plainGenerationParams = getPlainGenerationParams(handle?.generationParams),
    scope = Object.prototype.hasOwnProperty.call(plainGenerationParams, config)
      ? plainGenerationParams[config]
      : workflowUiSchemaField.defaultValue;
  if (scope === undefined || scope === null || String(scope).trim() === '')
    throw new Error('RunningHub audio manifest ' + state + ' missing ' + config);
  return scope;
}
function buildWorkflowGenerationParamsPatch(input, output, value2 = {}) {
  const value3 = String(input?.model || input?.audioWorkflowKey || '').trim(),
    value4 = String(output || '').trim(),
    generationParamsByModel = getPlainGenerationParams(input?.generationParamsByModel);
  value3 && (generationParamsByModel[value3] = getPlainGenerationParams(input?.generationParams));
  const args3 = buildModelUiSchemaDefaultParams(value4),
    args4 = getPlainGenerationParams(generationParamsByModel[value4]),
    generationParams = { ...args3, ...args4, ...getPlainGenerationParams(value2) };
  if (value4) generationParamsByModel[value4] = generationParams;
  return { generationParams: generationParams, generationParamsByModel: generationParamsByModel };
}
function normalizePromptForBackend(value5, value6) {
  const value7 = String(value6 || '').trim();
  if (value5 !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY) return value7;
  return value7
    .replace(/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    .replace(/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]: ')
    .replace(/\s+(\[speaker_[12]\]:)/g, '\n$1')
    .trim();
}
function toLocalAssetUrl(value8) {
  return localPathToUrl(value8);
}
function isLikelyImageUrl(value9) {
  const enabled6 = String(value9 || '')
    .trim()
    .toLowerCase();
  if (!enabled6) return false;
  if (enabled6.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i.test(enabled6);
}
function localUrlFromPath(value10) {
  return localPathToUrl(value10);
}
function normalizeAudioRemoteUrl(value11) {
  const enabled7 = String(value11 || '').trim();
  if (!enabled7) return '';
  if (enabled7.startsWith('/')) return enabled7;
  if (/^data:/i.test(enabled7)) return enabled7;
  if (/^blob:/i.test(enabled7)) return enabled7;
  if (enabled7.startsWith('//')) return 'https:' + enabled7;
  if (/^https?:\/\//i.test(enabled7)) return enabled7;
  return 'https://' + enabled7.replace(/^\/+/, '');
}
export class AIGenAudioNode {
  constructor(value12) {
    ((this._data = value12),
      (this.nodeId = value12.id),
      (this.previewEl = null),
      (this.audioEl = null),
      (this._placeholderEl = null),
      (this.refBarEl = null),
      (this.promptEl = null),
      (this.btnEl = null),
      (this.modelWrap = null),
      (this._currentSrc = null),
      (this._lastEdgeSig = null),
      (this._isGenerating = false),
      (this._modelMenu = null),
      (this._runninghubSubmenu = null),
      (this._modelLabelEl = null),
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
      (this._waveBgEl = null),
      (this._wavePlayed = null),
      (this._progressLine = null),
      (this._bar = null),
      (this._controlsEl = null),
      (this._playBtn = null),
      (this._timeEl = null),
      (this._waveBgPath = null),
      (this._waveFgPath = null),
      (this._waveToken = 0),
      (this._cancelDeferredWaveform = null),
      (this._statusOverlayEl = null),
      (this._isSeeking = false),
      (this._progressController = null),
      (this._audioDurationProbeToken = 0),
      (this._promptPanel = null),
      (this._promptInputWrap = null),
      (this._isPromptBoxResizing = false),
      (this._promptResizeHandle = false),
      (this._promptResizeCleanup = null),
      (this._rhTaskId = ''),
      (this._rhApiKey = ''),
      (this._rhAbortController = null),
      (this._rhCancelRequested = false),
      (this._rhCancelInFlight = false),
      (this._rhRemoteCancelSent = false),
      (this._rhResumeAbortController = null),
      (this._rhResumeTaskId = ''),
      (this._rhResumePromise = null),
      (this._assetMentionRegistryUnsubscribe = null),
      (this._assetMentionRegistryRefreshPending = false),
      (this._vipInstallId = ''),
      (this._vipSelectionRetryInProgress = false),
      (this._generationNodeHelpTip = null),
      (this._uiSchemaCleanup = null),
      (this._footerControllerCleanup = null),
      (this._unsubscribeLocale = null));
  }
  ['_getCurrentWorkflow']() {
    const workflowKeyFromNodeData = resolveWorkflowKeyFromNodeData(this._data);
    return getWorkflowByKey(workflowKeyFromNodeData) || getDefaultWorkflow();
  }
  ['_syncWorkflowDefaults']() {
    const event3 = this._getCurrentWorkflow(),
      args5 = {};
    if (this._data.provider !== 'runninghubwf') args5.provider = 'runninghubwf';
    if (this._data.audioWorkflowKey !== event3.key) args5.audioWorkflowKey = event3.key;
    if (this._data.audioWorkflowLabel !== event3.label) args5.audioWorkflowLabel = event3.label;
    if (this._data.model !== event3.key) args5.model = event3.key;
    const workflowGenerationParamsPatch = buildWorkflowGenerationParamsPatch(this._data, event3.key);
    (JSON.stringify(workflowGenerationParamsPatch.generationParams) !==
      JSON.stringify(getPlainGenerationParams(this._data.generationParams)) ||
      JSON.stringify(workflowGenerationParamsPatch.generationParamsByModel) !==
        JSON.stringify(getPlainGenerationParams(this._data.generationParamsByModel))) &&
      ((args5.generationParams = workflowGenerationParamsPatch.generationParams),
      (args5.generationParamsByModel = workflowGenerationParamsPatch.generationParamsByModel));
    if (!Object.keys(args5).length) return;
    (appStore.updateNodeData(this.nodeId, args5), (this._data = { ...this._data, ...args5 }));
  }
  ['_setSelectedWorkflow'](value13) {
    const audioWorkflowKey = getWorkflowByKey(value13);
    if (!audioWorkflowKey) return;
    if (
      !this._guardVipWorkflowSelection(audioWorkflowKey.key, () => {
        this._vipSelectionRetryInProgress = true;
        try {
          this._setSelectedWorkflow(audioWorkflowKey.key);
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      })
    )
      return;
    const args6 = {
      provider: 'runninghubwf',
      audioWorkflowKey: audioWorkflowKey.key,
      audioWorkflowLabel: audioWorkflowKey.label,
      model: audioWorkflowKey.key,
      ...buildWorkflowGenerationParamsPatch(this._data, audioWorkflowKey.key),
    };
    (appStore.updateNodeData(this.nodeId, args6),
      (this._data = { ...this._data, ...args6 }),
      this._enforceWorkflowAudioInputLimit(),
      (this._lastEdgeSig = null),
      (this._lastRefMediaSig = ''),
      (this._lastWorkflowKey = ''),
      (this._refBarWorkflowKey = ''),
      this._renderRefBar(),
      this._refreshWorkflowUi(),
      this._updateSubmitButtonState());
  }
  ['_closeModelMenu']() {
    this._modelMenu?.classList.remove('show');
    if (this._runninghubSubmenu) this._runninghubSubmenu.style.display = 'none';
    this._submenuCloseTimer && (clearTimeout(this._submenuCloseTimer), (this._submenuCloseTimer = null));
  }
  ['_openSubmenu']() {
    if (!this._runninghubSubmenu) return;
    (this._submenuCloseTimer && (clearTimeout(this._submenuCloseTimer), (this._submenuCloseTimer = null)),
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
    const event4 = this._getCurrentWorkflow();
    if (this._modelLabelEl) this._modelLabelEl.textContent = event4.label;
    (this._syncAudioPromptHelpTip(event4.key),
      syncModelUiSchemaControls(this._root, this._data),
      this._runninghubSubmenu?.querySelectorAll('.floating-menu-item').forEach((el) => {
        el.classList.toggle('active', el.dataset.value === event4.key);
      }));
  }
  ['_getGenerationNodeHelpText'](key2 = this._getCurrentWorkflow().key) {
    return getGenerationNodeHelpTooltip({ kind: 'audio', key: key2 });
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
  ['_resolveAudioRefUrl'](value14) {
    return resolveCanvasAudioUrl(value14);
  }
  ['_resolveNodeAudioUrl'](value15) {
    return resolveCanvasAudioUrl(value15);
  }
  ['_resolveVideoRefUrl'](value16) {
    const value17 = Number.isFinite(Number(value16?.mainVideoIndex))
        ? Math.max(0, Math.trunc(Number(value16.mainVideoIndex)))
        : 0,
      value18 = Array.isArray(value16?.videos) ? value16.videos[value17] || value16.videos[0] : null;
    return resolveCanvasVideoUrl(value18) || resolveCanvasVideoUrl(value16);
  }
  async ['_persistAudioOutput'](value19) {
    const audioRemoteUrl = normalizeAudioRemoteUrl(value19);
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
        const audioDuration = pickAudioDurationSec(
          saveRemoteAudioLocallyDetailed2?.audioDuration,
          saveRemoteAudioLocallyDetailed2?.duration,
        );
        return {
          ...(saveRemoteAudioLocallyDetailed2 && typeof saveRemoteAudioLocallyDetailed2 === 'object'
            ? saveRemoteAudioLocallyDetailed2
            : {}),
          localPath: localPath3,
          audioUrl: localUrlFromPath(localPath3),
          ...(audioDuration > 0 ? { audioDuration: audioDuration } : {}),
        };
      }
    } catch (value20) {
      console.warn('[AIGenAudioNode] 音频落盘失败:', value20);
    }
    throw new Error(aigenAudioText('errors.localSaveGeneratedFailed'));
  }
  ['_persistRunningHubResumeCache']() {
    try {
      window._triggerLocalCacheSave?.();
    } catch {}
  }
  ['_isRunningHubRecoverableRunningTask'](value21 = this._data) {
    const value22 = String(value21?.provider || '')
      .trim()
      .toLowerCase();
    if (value22 !== 'runninghubwf') return false;
    const enabled8 = String(value21?.rhTaskId || '').trim();
    if (!enabled8) return false;
    const value23 = String(value21?.rhTaskStatus || '')
      .trim()
      .toLowerCase();
    if (value23 === 'success' || value23 === 'failed' || value23 === 'idle' || value23 === 'cancelled')
      return false;
    return true;
  }
  ['_buildRunningHubTaskPatch']({
    taskId: taskId = '',
    status: status = 'pending',
    startedAt: startedAt = 0,
    recovering: recovering = false,
    useOpenapiQuery: useOpenapiQuery = true,
  } = {}) {
    return {
      rhTaskId: String(taskId || '').trim(),
      rhTaskStatus: String(status || 'pending').trim() || 'pending',
      rhTaskStartedAt: Number(startedAt || 0),
      rhTaskRecovering: recovering === true,
      rhTaskUseOpenapiQuery: useOpenapiQuery === true,
    };
  }
  ['_stopRunningHubRecovery'](value24 = false) {
    this._rhResumeAbortController &&
      !this._rhResumeAbortController.signal.aborted &&
      this._rhResumeAbortController.abort();
    ((this._rhResumeAbortController = null), (this._rhResumeTaskId = ''), (this._rhResumePromise = null));
    if (value24) {
      const value25 = appStore.getState().nodes?.[this.nodeId];
      value25?.rhTaskRecovering &&
        (appStore.updateNodeData(this.nodeId, { rhTaskRecovering: false }),
        this._persistRunningHubResumeCache());
    }
  }
  ['_setGeneratingUi']() {
    if (!this.btnEl) return;
    const value26 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      cancellable = String(value26?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf',
      el2 = resolveGenerationButtonMode(value26, {
        cancellable: cancellable,
        cancelInFlight: this._rhCancelInFlight === true,
      });
    if (el2.busy) {
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
      ((this.btnEl.disabled = el2.disabled), (this.btnEl.style.cursor = el2.cursor));
      return;
    }
    (resetGenerateButtonIdleUi(this.btnEl, aigenAudioText('buttons.generate')),
      this._updateSubmitButtonState());
  }
  ['_guardVipWorkflowSelection'](value27, onSuccess = null) {
    const modelId = getWorkflowGateModelId(value27);
    if (!modelId) return true;
    const run = window.isModelAllowedBySubscription,
      value28 = typeof run === 'function' ? run(modelId, 'runninghubwf') : true;
    if (value28) return true;
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
    return this._cancelRunningHubWorkflowTask();
  }
  ['getGenerationStatus']() {
    const value29 = appStore.getState?.()?.nodes?.[this.nodeId] || this._data || {},
      jobStatus = String(
        value29.jobStatus || value29.rhTaskStatus || (this._isGenerating ? 'running' : 'idle'),
      );
    return {
      nodeId: this.nodeId,
      jobStatus: jobStatus,
      isGenerating: this._isGenerating === true || jobStatus === 'running' || jobStatus === 'pending',
      taskId: String(this._rhTaskId || value29.rhTaskId || value29.taskId || ''),
      cancellable: true,
      resumable: Boolean(value29.rhTaskId),
    };
  }
  async ['_handleGenerateOrCancel'](value30 = null) {
    const value31 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      value32 = String(value31?.provider || 'runninghubwf')
        .trim()
        .toLowerCase(),
      cancellable2 = value32 === 'runninghubwf';
    if (
      shouldAllowCancel(value31, {
        cancellable: cancellable2,
        cancelInFlight: this._rhCancelInFlight === true,
      })
    ) {
      await this._cancelRunningHubWorkflowTask();
      return;
    }
    await this._onGenerate(value30);
  }
  async ['_cancelRunningHubWorkflowTask']() {
    let apiKey = this._rhApiKey || '';
    const useOpenapiQuery2 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      taskId2 = String(this._rhTaskId || '').trim() || String(useOpenapiQuery2?.rhTaskId || '').trim(),
      value33 = Date.now(),
      count = Number(useOpenapiQuery2?.generationStartTime),
      generationDuration =
        useOpenapiQuery2?.generationDuration != null
          ? useOpenapiQuery2.generationDuration
          : Number.isFinite(count) && count > 0
            ? Math.max(0, value33 - count)
            : 0;
    this._rhCancelRequested = true;
    if (this._rhCancelInFlight) return;
    this._stopRunningHubRecovery(false);
    if (!apiKey)
      try {
        await ensureConfig();
        const providerConfig = getProviderConfig('runninghubwf');
        apiKey = String(providerConfig?.apiKey || '').trim();
      } catch {}
    if (apiKey) this._rhApiKey = apiKey;
    const rhStatusCode = !taskId2,
      cancelledBuilder = ({
        remoteResult: remoteResult,
        remoteError: remoteError,
        startedAt: startedAt2,
      }) => {
        const count2 = Number(remoteResult?.code),
          value34 = rhStatusCode ? aigenAudioText('cancel.interruptedMissingTaskId') : '',
          rhStatusMessage =
            value34 ||
            (remoteError
              ? remoteError.message || aigenAudioText('cancel.failed')
              : count2 === 0
                ? aigenAudioText('cancel.success')
                : count2 === 807
                  ? aigenAudioText('cancel.taskMissing')
                  : remoteResult?.msg || aigenAudioText('cancel.failed'));
        return {
          audioUrl: '',
          src: '',
          localPath: '',
          generationDuration: generationDuration,
          rhStatusMessage: rhStatusMessage,
          rhStatusCode: rhStatusCode ? 813 : Number.isFinite(count2) ? count2 : null,
          ...this._buildRunningHubTaskPatch({
            taskId: taskId2,
            status: 'cancelled',
            startedAt: Number(
              startedAt2 || useOpenapiQuery2?.rhTaskStartedAt || useOpenapiQuery2?.generationStartTime || 0,
            ),
            recovering: false,
            useOpenapiQuery: useOpenapiQuery2?.rhTaskUseOpenapiQuery === true,
          }),
        };
      };
    try {
      ((this._rhCancelInFlight = true),
        (this._rhRemoteCancelSent = true),
        await cancelTask(this.nodeId, {
          store: appStore,
          taskId: taskId2,
          cancellable: true,
          cancel: async ({ taskId: taskId3 }) => {
            if (!apiKey) throw new Error(aigenAudioText('cancel.missingApiKey'));
            return cancelRunningHubAudioTask({ apiKey: apiKey, taskId: taskId3 });
          },
          cancelledBuilder: cancelledBuilder,
          spec: {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'audio-generation',
            provider: 'runninghubwf',
            adapterType: 'workflow',
            modelId: useOpenapiQuery2?.audioWorkflowKey || useOpenapiQuery2?.model || '',
            executionId: 'runninghub.audio.' + (useOpenapiQuery2?.audioWorkflowKey || 'workflow'),
            payload: useOpenapiQuery2,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: cancelledBuilder,
          },
        }),
        this._persistRunningHubResumeCache());
    } finally {
      ((this._rhCancelInFlight = false),
        (this._rhRemoteCancelSent = false),
        (this._rhCancelRequested = false),
        (this._isGenerating = false),
        (this._rhAbortController = null),
        (this._rhTaskId = ''),
        (this._rhApiKey = ''),
        this._setGeneratingUi(),
        stopLoading(this.previewEl));
    }
  }
  async ['_applyAudioResultAndStore'](value35, startedAt3, { writeStore: writeStore = true } = {}) {
    const audioUrl = await buildAudioGenerationResultPatch(value35, {
      startedAt: startedAt3,
      persistAudioOutput: (value36) => this._persistAudioOutput(value36),
    });
    if (!audioUrl?.audioUrl || !audioUrl?.localPath)
      throw new Error(aigenAudioText('errors.localSaveGeneratedFailed'));
    writeStore && appStore.updateNodeData(this.nodeId, audioUrl);
    const finalUrl = {
      audioUrl: audioUrl.audioUrl,
      src: audioUrl.src,
      localPath: audioUrl.localPath,
      audioDuration: audioUrl.audioDuration,
      waveformLocalPath: audioUrl.waveformLocalPath,
      assetId: audioUrl.assetId,
      derivativeStatus: audioUrl.derivativeStatus,
      fileName: audioUrl.fileName,
    };
    return (
      this._dispatchGenerationHistoryAudio(finalUrl, startedAt3),
      this._applyResultWideLayout({ ...this._data, ...finalUrl }, true),
      { finalUrl: finalUrl.audioUrl, finalLocalPath: finalUrl.localPath, patch: audioUrl }
    );
  }
  ['_dispatchGenerationHistoryAudio'](enabled9, startedAt4) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    if (!enabled9 || typeof enabled9 !== 'object') return;
    if (!String(enabled9.audioUrl || enabled9.localPath || '').trim()) return;
    const nodeData = appStore.getState().nodes?.[this.nodeId] || this._data || {};
    try {
      window.dispatchEvent(
        new CustomEvent(GENERATION_HISTORY_EVENT, {
          detail: {
            kind: 'audio',
            sourceNodeId: this.nodeId,
            nodeData: nodeData,
            audios: [enabled9],
            startedAt: startedAt4,
            createdAt: Date.now(),
          },
        }),
      );
    } catch {}
  }
  async ['_maybeResumeRunningHubTask']() {
    const value37 = appStore.getState().nodes?.[this.nodeId] || this._data || {};
    if (this._isGenerating && value37?.rhTaskRecovering !== true) return;
    if (!this._isRunningHubRecoverableRunningTask(value37)) {
      this._stopRunningHubRecovery(false);
      return;
    }
    const taskId4 = String(value37?.rhTaskId || '').trim();
    if (!taskId4) {
      this._stopRunningHubRecovery(false);
      return;
    }
    if (this._rhResumeTaskId === taskId4 && this._rhResumePromise) return;
    this._stopRunningHubRecovery(false);
    const startedAt5 = Number(value37?.rhTaskStartedAt || value37?.generationStartTime || Date.now());
    this._rhResumeTaskId = taskId4;
    const value38 = (async () => {
      let signal = null;
      try {
        const modelId2 = await this._buildPayload();
        if (!modelId2) return;
        ((signal = new AbortController()),
          (this._rhResumeAbortController = signal),
          (this._rhTaskId = taskId4));
        let enabled10 = String(modelId2?.apiKey || '').trim() || this._rhApiKey || '';
        if (!enabled10)
          try {
            await ensureConfig();
            const providerConfig2 = getProviderConfig('runninghubwf');
            enabled10 = String(providerConfig2?.apiKey || '').trim();
          } catch {}
        ((this._rhApiKey = enabled10 || ''),
          (this._isGenerating = true),
          this._setGeneratingUi(),
          startLoading(this.previewEl));
        const response = await resumeTask(
          {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'audio-generation',
            provider: 'runninghubwf',
            adapterType: 'workflow',
            modelId: modelId2.audioWorkflowKey || value37?.model || '',
            executionId: 'runninghub.audio.' + (modelId2.audioWorkflowKey || 'workflow'),
            payload: modelId2,
            taskId: taskId4,
            cancellable: true,
            resumable: true,
            startBuilder: () => ({
              provider: modelId2.provider,
              audioWorkflowKey: modelId2.audioWorkflowKey,
              audioWorkflowLabel: modelId2.audioWorkflowLabel,
              model: modelId2.audioWorkflowKey,
              rhInstanceType: modelId2.rhInstanceType,
              rhTaskUseOpenapiQuery: true,
            }),
            onTaskStart: () => {
              this._persistRunningHubResumeCache();
            },
            poll: async () =>
              resumeRunningHubAudioTask(taskId4, modelId2, {
                signal: signal.signal,
                useOpenapiQuery: true,
              }),
            resultBuilder: async (value39, startedAt6) => {
              const args7 = await this._applyAudioResultAndStore(value39, startedAt6.startedAt, {
                writeStore: false,
              });
              return {
                ...args7.patch,
                rhStatusMessage: null,
                rhStatusCode: null,
                ...this._buildRunningHubTaskPatch({
                  taskId: taskId4,
                  status: 'success',
                  startedAt: startedAt6.startedAt,
                  recovering: false,
                  useOpenapiQuery: true,
                }),
              };
            },
            failureBuilder: (rhStatusMessage2, startedAt7) => ({
              rhStatusMessage: rhStatusMessage2?.message || aigenAudioText('generation.failed'),
              rhStatusCode: Number.isFinite(Number(rhStatusMessage2?.code))
                ? Number(rhStatusMessage2.code)
                : null,
              ...this._buildRunningHubTaskPatch({
                taskId: taskId4,
                status: 'failed',
                startedAt: startedAt7.startedAt,
                recovering: false,
                useOpenapiQuery: true,
              }),
            }),
            cancelledBuilder: (startedAt8) => ({
              audioUrl: '',
              src: '',
              localPath: '',
              rhStatusMessage: aigenAudioText('generation.interrupted'),
              rhStatusCode: null,
              ...this._buildRunningHubTaskPatch({
                taskId: taskId4,
                status: 'cancelled',
                startedAt: startedAt8.startedAt,
                recovering: false,
                useOpenapiQuery: true,
              }),
            }),
            parseError: (error) => error?.message || aigenAudioText('generation.failed'),
          },
          { store: appStore, startedAt: startedAt5, abortController: signal },
        );
        if (response.status === 'pending') {
          this._persistRunningHubResumeCache();
          return;
        }
        this._persistRunningHubResumeCache();
      } catch (rhStatusMessage3) {
        if (
          signal?.signal?.aborted ||
          rhStatusMessage3?.message === 'CANCELLED' ||
          rhStatusMessage3?.name === 'AbortError'
        )
          return;
        (appStore.updateNodeData(this.nodeId, {
          isGenerating: false,
          jobStatus: 'error',
          generationDuration: Math.max(0, Date.now() - startedAt5),
          rhStatusMessage: rhStatusMessage3?.message || aigenAudioText('generation.failed'),
          rhStatusCode: Number.isFinite(Number(rhStatusMessage3?.code))
            ? Number(rhStatusMessage3.code)
            : null,
          ...this._buildRunningHubTaskPatch({
            taskId: taskId4,
            status: 'failed',
            startedAt: startedAt5,
            recovering: false,
            useOpenapiQuery: true,
          }),
        }),
          this._persistRunningHubResumeCache());
      } finally {
        signal && this._rhResumeAbortController === signal && (this._rhResumeAbortController = null);
        this._rhResumeTaskId === taskId4 && (this._rhResumeTaskId = '');
        this._rhResumePromise = null;
        const value40 = appStore.getState().nodes?.[this.nodeId] || {},
          shouldShowGenerationBusyUi2 = shouldShowGenerationBusyUi(value40);
        ((this._isGenerating = shouldShowGenerationBusyUi2),
          (this._rhTaskId = shouldShowGenerationBusyUi2
            ? String(value40?.rhTaskId || taskId4 || '').trim()
            : ''),
          this._setGeneratingUi());
        if (!shouldShowGenerationBusyUi2) stopLoading(this.previewEl);
      }
    })();
    this._rhResumePromise = value38;
  }
  ['_applyResultWideLayout'](value41 = null, enabled11 = false) {
    const box = value41 || this._data || {},
      enabled12 = this._resolveNodeAudioUrl(box);
    if (!enabled12) return;
    const count3 = Number(box.width || 0),
      count4 = Number(box.height || 0);
    if (!enabled11 && count3 > 0 && count4 > 0) {
      const count5 = count3 / count4,
        value42 = count5 >= 2 && count3 >= AUDIO_RESULT_WIDTH - 20 && count4 <= AUDIO_RESULT_HEIGHT + 40,
        value43 = Math.abs(count5 - AUDIO_RESULT_RATIO) <= 0.08;
      if (value42 || value43) return;
    }
    const value44 = count3 > 0 ? count3 : AUDIO_RESULT_WIDTH,
      value45 = count4 > 0 ? count4 : AUDIO_RESULT_HEIGHT,
      value46 = Number(box.x || 0) + value44 / 2,
      value47 = Number(box.y || 0) + value45 / 2,
      x = Math.round(value46 - AUDIO_RESULT_WIDTH / 2),
      y = Math.round(value47 - AUDIO_RESULT_HEIGHT / 2);
    if (
      count3 === AUDIO_RESULT_WIDTH &&
      count4 === AUDIO_RESULT_HEIGHT &&
      Number(box.x || 0) === x &&
      Number(box.y || 0) === y
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
      nodes = appStore.getState().nodes || {},
      textInputs = [],
      list7 = [],
      videoRefs = [];
    inEdges.forEach((edgeId) => {
      const response2 = nodes[edgeId.sourceId];
      if (!response2) return;
      const sourceType = String(response2.type || '');
      if (TEXT_INPUT_TYPES.has(sourceType)) {
        const text = String(
          response2.outputText || response2.text || response2.content || response2.prompt || '',
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
        const url = this._resolveAudioRefUrl(response2);
        if (!url) return;
        list7.push({
          edgeId: edgeId.id,
          sourceId: edgeId.sourceId,
          sourceType: sourceType,
          refSlot: String(edgeId?.refSlot || ''),
          url: url,
        });
        return;
      }
      if (VIDEO_INPUT_TYPES.has(sourceType)) {
        const url2 = this._resolveVideoRefUrl(response2);
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
      presetPromptTextWithTextRefs = resolvePresetPromptTextWithTextRefs({
        template: template,
        promptEl: this.promptEl,
        inEdges: inEdges,
        nodes: nodes,
        assetInputRefs: assetInputRefs,
        assetMediaCounts: { image: 0, video: 0, audio: 0 },
        allowedAssetTypes: ['text', 'audio'],
      }),
      value48 = nodes?.[this.nodeId] || this._data || {};
    assetInputRefs.push(...getPromptAssetInputRefsFromNode(value48, { allowedTypes: ['audio'] }));
    const value49 = this._getCurrentWorkflow().key,
      list8 = getWorkflowAudioSlots(value49).map((item12) => item12.slot),
      audioRefs = normalizeWorkflowAudioRefSlots(list7, value49),
      map2 = new Set(
        audioRefs.map((item13) => String(item13?.refSlot || '')).filter((item14) => list8.includes(item14)),
      );
    return (
      assetInputRefs.forEach((url3) => {
        if (url3.type !== 'audio' || !url3.url) return;
        const refSlot4 = list8.find((item15) => !map2.has(item15)) || '';
        if (!refSlot4) return;
        (map2.add(refSlot4),
          audioRefs.push({
            edgeId: '',
            sourceId: '',
            sourceType: 'asset-audio',
            refSlot: refSlot4,
            url: url3.url,
            assetId: url3.assetId,
            assetIndex: url3.itemIndex,
          }));
      }),
      {
        prompt: String(presetPromptTextWithTextRefs || '').trim(),
        textInputs: textInputs,
        audioRefs: audioRefs,
        videoRefs: videoRefs,
      }
    );
  }
  ['_validatePayload'](value50) {
    const workflowByKey = getWorkflowByKey(value50?.audioWorkflowKey) || getDefaultWorkflow(),
      message = workflowByKey.validate(value50);
    return { ok: !message, message: message };
  }
  ['_buildPayloadSnapshot'](value51 = null) {
    const audioWorkflowKey2 = this._getCurrentWorkflow(),
      textInputs2 = this._collectInputs(value51),
      payload2 = {
        nodeId: this.nodeId,
        provider: 'runninghubwf',
        audioWorkflowKey: audioWorkflowKey2.key,
        audioWorkflowLabel: audioWorkflowKey2.label,
        rhInstanceType:
          String(resolveWorkflowSchemaParam(this._data, audioWorkflowKey2.key, 'rhInstanceType')) === 'plus'
            ? 'plus'
            : 'default',
        prompt: normalizePromptForBackend(audioWorkflowKey2.key, textInputs2.prompt),
        textInputs: textInputs2.textInputs.map((response3) => response3.text),
        audioRefs: textInputs2.audioRefs,
        videoRefs: textInputs2.videoRefs,
        installId: String(this._vipInstallId || window.__aicInstallId || '').trim(),
      },
      validation = this._validatePayload(payload2);
    return { payload: payload2, validation: validation };
  }
  ['_enforceWorkflowAudioInputLimit']() {
    const event5 = this._getCurrentWorkflow(),
      workflowAudioInputLimit = getWorkflowAudioInputLimit(event5.key),
      list9 = appStore.getIncomingEdges(this.nodeId),
      value52 = appStore.getState().nodes || {},
      list10 = list9.filter((item16) => {
        const value53 = value52[item16.sourceId];
        return AUDIO_INPUT_TYPES.has(String(value53?.type || ''));
      });
    if (list10.length <= workflowAudioInputLimit) return;
    const list11 = [...list10].sort((item17, value54) => {
        const value55 = Number(item17?.createdAt || 0),
          value56 = Number(value54?.createdAt || 0);
        return value55 - value56;
      }),
      list12 = list11.slice(0, Math.max(0, list11.length - workflowAudioInputLimit));
    if (!list12.length) return;
    appStore.batch(() => {
      list12.forEach((item18) => appStore.removeEdge(item18.id));
    });
  }
  ['_syncPickConnectVisualState']() {
    const value57 = appStore.getState().pickConnectMode || {},
      value58 = !!(value57.active && value57.sourceNodeId === this.nodeId),
      el3 = this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || this._attachBtnIcon;
    el3 &&
      ((this._attachBtnIcon = el3),
      (el3.style.transition = 'opacity 0.2s ease, transform 0.2s ease'),
      (el3.style.opacity = value58 ? '0' : ''),
      (el3.style.transform = value58 ? 'scale(0.4)' : ''),
      (el3.style.pointerEvents = value58 ? 'none' : ''));
    if (this._placeholderEl) {
      const el4 = this._placeholderEl.querySelector('.placeholder-icon-svg');
      if (el4) {
        if (value58) el4.classList.add('is-pick-connecting');
        else el4.classList.remove('is-pick-connecting');
      }
    }
  }
  ['_fmtTime'](enabled13) {
    if (!enabled13 || isNaN(enabled13)) return '0:00';
    return Math.floor(enabled13 / 60) + ':' + String(Math.floor(enabled13 % 60)).padStart(2, '0');
  }
  ['_setPlayIcon'](value59) {
    const el5 = this._playBtn?.querySelector?.('svg');
    if (!el5) return;
    const value60 = 'http://www.w3.org/2000/svg';
    while (el5.firstChild) el5.removeChild(el5.firstChild);
    if (value59) {
      const el6 = document.createElementNS(value60, 'polygon');
      (el6.setAttribute('points', '5 3 19 12 5 21 5 3'), el5.appendChild(el6));
      return;
    }
    const el7 = document.createElementNS(value60, 'rect');
    (el7.setAttribute('x', '6'),
      el7.setAttribute('y', '4'),
      el7.setAttribute('width', '4'),
      el7.setAttribute('height', '16'));
    const el8 = document.createElementNS(value60, 'rect');
    (el8.setAttribute('x', '14'),
      el8.setAttribute('y', '4'),
      el8.setAttribute('width', '4'),
      el8.setAttribute('height', '16'),
      el5.appendChild(el7),
      el5.appendChild(el8));
  }
  ['_seekTo'](value61) {
    const duration = this._readAudioDurationSec();
    if (!this.audioEl || duration <= 0 || !this._bar) return;
    const box2 = this._bar.getBoundingClientRect();
    if (!box2.width) return;
    let value62 = (value61 - box2.left) / box2.width;
    value62 = Math.max(0, Math.min(1, value62));
    const currentTime2 = value62 * duration;
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
          ((this._isSeeking = false), this._progressController?.sync({ force: true, showLine: true }));
        },
        { once: true },
      ));
  }
  ['_setAudioPreviewResultState'](enabled14) {
    const value63 = !!enabled14;
    if (this._waveBgEl) this._waveBgEl.style.display = value63 ? '' : 'none';
    if (this._wavePlayed) this._wavePlayed.style.display = value63 ? '' : 'none';
    if (this._progressLine) this._progressLine.style.display = value63 ? '' : 'none';
    if (this._bar) this._bar.style.display = value63 ? '' : 'none';
    if (this._controlsEl) this._controlsEl.style.display = value63 ? '' : 'none';
    if (this._placeholderEl) this._placeholderEl.style.display = value63 ? 'none' : '';
  }
  ['_getCurrentGateModelId']() {
    return getWorkflowGateModelId(this._getCurrentWorkflow().key);
  }
  async ['_ensureVipAccessForCurrentWorkflow']() {
    const modelId3 = this._getCurrentGateModelId();
    if (!modelId3) return ((this._vipInstallId = ''), true);
    const run2 = window.isModelAllowedBySubscription,
      enabled15 = typeof run2 === 'function' ? run2(modelId3, 'runninghubwf') : true;
    if (!enabled15)
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: modelId3, provider: 'runninghubwf' })
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
  async ['_resolveAudioDurationSec'](value64) {
    const enabled16 = String(value64 || '').trim();
    if (!enabled16) return 0;
    return await loadAudioDurationMetadataSec(enabled16, { timeoutMs: 5000 });
  }
  async ['_validateAdvancedVoiceCloneDurations'](list13 = []) {
    if (this._getCurrentWorkflow().key !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY) return true;
    const value65 = Array.isArray(list13) ? list13 : [];
    for (const response4 of value65) {
      const duration2 = await this._resolveAudioDurationSec(response4?.url);
      if (
        Number.isFinite(duration2) &&
        duration2 > 0 &&
        (duration2 < ADVANCED_VOICE_CLONE_MIN_SECONDS || duration2 > ADVANCED_VOICE_CLONE_MAX_SECONDS)
      ) {
        const label =
          String(response4?.refSlot || '') === 'audio2'
            ? aigenAudioText('refs.audio2')
            : aigenAudioText('refs.audio1');
        return (
          window.showToast?.(
            aigenAudioText('validation.advancedVoiceDuration', {
              label: label,
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
  ['_createStatusCard'](value66, value67) {
    const el9 = document.createElement('div');
    ((el9.className = 'gen-status-card'),
      Object.assign(el9.style, {
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
    const value68 = Number(value67) === 0,
      value69 = value68 ? 'var(--green)' : 'var(--white-80)';
    return (
      (el9.innerHTML =
        '\n      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
        value69 +
        '" stroke-width="2">\n        <circle cx="12" cy="12" r="10"/><path d="' +
        (value68 ? 'M8 12l2.5 2.5L16 9' : 'M12 8v5') +
        '" />' +
        (value68 ? '' : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
        '\n      </svg>\n      <span style="color:' +
        value69 +
        ';font-size:12px;font-weight:600;line-height:1.4;">' +
        value66 +
        '</span>\n    '),
      el9
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
  ['_syncStatusOverlay'](value70 = this._data, enabled17 = false) {
    const value71 =
        String(value70?.rhStatusMessage || '').trim() ||
        (String(value70?.jobStatus || '').toLowerCase() === 'error' ? getTaskMessage(value70) : ''),
      value72 = value70?.rhStatusCode;
    if (!enabled17 && value71) {
      const el10 = this._ensureStatusOverlayEl();
      ((el10.innerHTML = ''), el10.appendChild(this._createStatusCard(value71, value72)));
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
      return;
    }
    this._clearStatusOverlay();
  }
  async ['_ensureWaveform'](value73, { persistedOnly: persistedOnly = false } = {}) {
    const enabled18 = String(value73 || '').trim();
    if (!enabled18) return;
    const value74 = ++this._waveToken,
      url4 = localPathToUrl(this._data?.waveformLocalPath),
      value75 = { width: 200, height: 80, samples: 190 };
    let waveformBarsPathFromPersistedUrl = '';
    url4 && (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromPersistedUrl(url4, value75));
    !waveformBarsPathFromPersistedUrl &&
      !persistedOnly &&
      (waveformBarsPathFromPersistedUrl = await getWaveformBarsPathFromUrl(enabled18, value75));
    if (!this.audioEl || !this._root || !this._root.isConnected) return;
    if (value74 !== this._waveToken) return;
    if (!waveformBarsPathFromPersistedUrl) return;
    if (this._waveBgPath) this._waveBgPath.setAttribute('d', waveformBarsPathFromPersistedUrl);
    if (this._waveFgPath) this._waveFgPath.setAttribute('d', waveformBarsPathFromPersistedUrl);
  }
  ['mount']() {
    const el11 = document.createElement('div');
    (Object.assign(el11.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'visible',
      pointerEvents: 'auto',
      cursor: 'default',
    }),
      (this._root = el11),
      (el11.innerHTML = AUDIO_TOOLBAR_HTML),
      (this.previewEl = document.createElement('div')),
      (this.previewEl.className = 'node-card media-card audio-card aigen-audio-preview'),
      this.previewEl.style.setProperty('width', '100%', 'important'),
      this.previewEl.style.setProperty('height', '100%', 'important'),
      this.previewEl.style.setProperty('min-height', '160px', 'important'),
      this.previewEl.style.setProperty('flex-shrink', '0', 'important'),
      this.previewEl.style.setProperty('flex-grow', '0', 'important'),
      (this._audioCard = this.previewEl));
    const el12 = document.createElement('div');
    ((el12.className = 'waveform waveform-bg'),
      (el12.innerHTML =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      this.previewEl.appendChild(el12),
      (this._waveBgEl = el12));
    const el13 = document.createElement('div');
    ((el13.className = 'waveform waveform-unplayed'),
      (el13.innerHTML =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      this.previewEl.appendChild(el13),
      (this._wavePlayed = el13));
    const list14 = this.previewEl.querySelectorAll('.waveform-bg svg path'),
      list15 = this.previewEl.querySelectorAll('.waveform-unplayed svg path');
    ((this._waveBgPath = list14 && list14.length ? list14[0] : null),
      (this._waveFgPath = list15 && list15.length ? list15[0] : null));
    const value76 = document.createElement('div');
    ((value76.className = 'media-progress-line'),
      this.previewEl.appendChild(value76),
      (this._progressLine = value76));
    const value77 = document.createElement('div');
    ((value77.className = 'media-progress-bar'), this.previewEl.appendChild(value77), (this._bar = value77));
    const el14 = document.createElement('div');
    ((el14.className = 'audio-controls'),
      (el14.innerHTML =
        '\n      <button type="button" class="audio-play-btn">\n        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n      </button>\n      <div class="audio-time-wrap">\n        <span class="audio-time-display">0:00 / 0:00</span>\n      </div>'),
      this.previewEl.appendChild(el14),
      (this._controlsEl = el14),
      (this._playBtn = el14.querySelector('.audio-play-btn')),
      (this._timeEl = el14.querySelector('.audio-time-display')),
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
        formatTime: (value78) => this._fmtTime(value78),
        shouldSuppressSync: () => this._isSeeking,
      }).attach()));
    const el15 = document.createElement('div');
    ((el15.className = 'img-node-placeholder'),
      Object.assign(el15.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        userSelect: 'none',
      }),
      (el15.innerHTML =
        '\n            <svg class="placeholder-icon-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">\n                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>\n            </svg>'),
      (this._placeholderEl = el15),
      this.previewEl.appendChild(this.audioEl),
      this.previewEl.appendChild(el15),
      syncPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions()));
    let box3 = { x: 0, y: 0 };
    (this.previewEl.addEventListener('pointerdown', (x2) => {
      if (x2.target.closest('.media-progress-bar')) return;
      box3 = { x: x2.clientX, y: x2.clientY };
    }),
      this.previewEl.addEventListener('pointerup', (event6) => {
        if (
          event6.target.closest('.media-progress-bar') ||
          event6.target.closest('.audio-play-btn') ||
          event6.target.closest('.audio-controls')
        )
          return;
        const count6 = Math.hypot(event6.clientX - box3.x, event6.clientY - box3.y);
        if (count6 >= 5) return;
        if (!this.audioEl || !this.audioEl.duration) return;
        const box4 = this.previewEl.getBoundingClientRect(),
          value79 = Math.max(0, Math.min(1, (event6.clientX - box4.left) / box4.width)),
          currentTime3 = value79 * this.audioEl.duration;
        ((this.audioEl.currentTime = currentTime3),
          this._progressController?.sync({
            currentTime: currentTime3,
            duration: this.audioEl.duration,
            force: true,
            showLine: true,
          }));
      }),
      this._bar?.addEventListener('click', (event7) => {
        this._seekTo(event7.clientX);
      }),
      this._playBtn?.addEventListener('pointerdown', (event8) => {
        event8.stopPropagation();
        if (!this._currentSrc) return;
        if (this.audioEl.paused) this._playAudio();
        else this.audioEl.pause();
      }),
      this.audioEl.addEventListener('play', () => this._setPlayIcon(false)),
      this.audioEl.addEventListener('pause', () => this._setPlayIcon(true)),
      this._unregisterAudioPlaybackClient?.(),
      (this._unregisterAudioPlaybackClient = registerAudioPlaybackClient(this.nodeId, {
        stopForExternalPlayback: () => this._stopAudioForExternalPlayback(),
      })));
    const value80 = this._resolveNodeAudioUrl(this._data);
    value80
      ? (this._prepareAudio(value80),
        this._applyResultWideLayout(this._data, false),
        this._setAudioPreviewResultState(true))
      : (this._setAudioPreviewResultState(false), this._syncStatusOverlay(this._data, false));
    el11.appendChild(this.previewEl);
    const el16 = document.createElement('div');
    ((el16.className = 'text-prompt-panel'),
      (this._promptPanel = el16),
      el16.addEventListener('pointerdown', (event9) => {
        event9.stopPropagation();
      }),
      el16.addEventListener('dblclick', (event10) => {
        !event10.target.closest('.prompt-textarea') && (event10.preventDefault(), event10.stopPropagation());
      }),
      (this.refBarEl = document.createElement('div')),
      (this.refBarEl.className = 'node-ref-bar'),
      el16.appendChild(this.refBarEl),
      this.refBarEl.addEventListener('click', (event11) => {
        const el17 = event11.target.closest('.ref-thumb-delete');
        if (el17) {
          (event11.stopPropagation(), event11.preventDefault());
          const assetId = el17.closest('.ref-thumb-wrap');
          if (assetId?.dataset?.refOrigin === 'asset') {
            const value81 = {
                assetId: assetId.dataset.assetId,
                assetIndex: assetId.dataset.assetIndex,
                type: assetId.dataset.refType || assetId.dataset.kind || 'audio',
                occurrence: assetId.dataset.assetOccurrence,
              },
              value82 = String(assetId.dataset.assetRefSource || '').trim(),
              value83 =
                value82 === 'hidden'
                  ? removePromptAssetInputRefFromNode(this, value81)
                  : removeAssetMentionPillFromPrompt(this, value81) ||
                    removePromptAssetInputRefFromNode(this, value81);
            if (value83) return;
          }
          const value84 = assetId?.dataset.edgeId;
          if (value84) appStore.removeEdge(value84);
          return;
        }
        const el18 = event11.target.closest('.rh-v5-ref-box[data-slot]');
        if (el18) {
          (event11.stopPropagation(), event11.preventDefault());
          const enabled19 = String(el18.dataset.slot || '').trim();
          if (!enabled19 || !this._audioRefUploadInput) return;
          ((this._audioRefUploadSlot = enabled19),
            (this._audioRefUploadAnchorNodeId = this.nodeId),
            (this._audioRefUploadInput.accept = 'audio/*'),
            this._audioRefUploadInput.click());
          return;
        }
        const enabled20 = event11.target.closest('.prompt-attachment-btn');
        if (!enabled20 || event11._pickConnectHandled) return;
        (event11.stopPropagation(), event11.preventDefault());
        const value85 = appStore.getState().pickConnectMode;
        (value85 && value85.active && value85.sourceNodeId === this.nodeId
          ? appStore.setPickConnectMode({ active: false })
          : appStore.setPickConnectMode({
              active: true,
              sourceNodeId: this.nodeId,
              handleDirection: 'left',
              preferredRefSlot: undefined,
            }),
          this._syncPickConnectVisualState());
      }),
      this.refBarEl.addEventListener('pointerdown', (event12) => {
        if (
          event12.target.closest(
            '.prompt-attachment-btn, .ref-thumb-delete, .ref-upload-slot, .rh-v5-ref-box',
          )
        )
          event12.stopPropagation();
      }),
      (this._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(this.refBarEl)),
      (this._audioRefUploadInput = document.createElement('input')),
      (this._audioRefUploadInput.type = 'file'),
      (this._audioRefUploadInput.accept = 'audio/*'),
      (this._audioRefUploadInput.style.display = 'none'),
      el16.appendChild(this._audioRefUploadInput),
      this._audioRefUploadInput.addEventListener('change', async (event13) => {
        const name = event13.target.files?.[0],
          refSlot5 = String(this._audioRefUploadSlot || '').trim(),
          enabled21 = String(this._audioRefUploadAnchorNodeId || '').trim();
        if (!name || !refSlot5 || !enabled21) {
          this._audioRefUploadInput.value = '';
          return;
        }
        try {
          if (!String(name.type || '').startsWith('audio/'))
            throw new Error(aigenAudioText('upload.audioOnly'));
          const value86 = window.currentProjectId || 'default_v2_project',
            assetId2 = await uploadFile(name, value86),
            src = String(assetId2?.url || '').trim();
          if (!src) throw new Error(aigenAudioText('upload.missingUrl'));
          const value87 = appStore.getState(),
            box5 = value87.nodes?.[enabled21];
          if (!box5) throw new Error(aigenAudioText('upload.anchorMissing'));
          const localPath4 = pickResultLocalPath(assetId2) || normalizeLocalPath(src),
            width = 320,
            height = 140,
            { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
            y2 = direction === 'down' ? 'down' : 'left',
            value88 = Number(box5.x) || 0,
            value89 = Number(box5.y) || 0,
            value90 = Number(box5.width) || 360,
            value91 = Number(box5.height) || 360,
            value92 = value89 + Math.round((value91 - height) / 2);
          let value93 = value92;
          if (refSlot5 === 'audioRef' && this._getCurrentWorkflow().key === 'voice_convert')
            value93 = value92 - Math.round(height / 2) - 8;
          else
            refSlot5 === 'audioTarget' &&
              this._getCurrentWorkflow().key === 'voice_convert' &&
              (value93 = value92 + Math.round(height / 2) + 8);
          const x3 = value88 - spacing - width,
            x4 = avoidOverlap
              ? findAvailablePosition(
                  value87.nodes || {},
                  x3,
                  y2 === 'down' ? value89 + value91 + spacing : value93,
                  width,
                  height,
                  spacing,
                  y2,
                )
              : { x: x3, y: y2 === 'down' ? value89 + value91 + spacing : value93 };
          (appStore.batch(() => {
            const value94 = appStore.getIncomingEdges(this.nodeId);
            for (const value95 of value94) {
              if (String(value95?.refSlot || '') === refSlot5) appStore.removeEdge(value95.id);
            }
            removeCoveredAssetInputRefForConnection({
              targetId: this.nodeId,
              sourceKind: 'audio',
              refSlot: refSlot5,
            });
            const id = generateId('node');
            (appStore.addNode({
              id: id,
              type: 'source-audio',
              x: x4.x,
              y: x4.y,
              width: width,
              height: height,
              src: src,
              localPath: localPath4,
              assetId: assetId2.assetId || '',
              originalLocalPath: assetId2.originalLocalPath || assetId2.localPath || '',
              waveformLocalPath: assetId2.waveformLocalPath || '',
              derivativeStatus: assetId2.derivativeStatus || assetId2.status || '',
              mediaTaskId: assetId2.mediaTaskId || '',
              mediaTaskKind: assetId2.mediaTaskKind || '',
              mediaTaskStatus: assetId2.mediaTaskStatus || '',
              mediaTaskProgress: Number(assetId2.mediaTaskProgress || 0) || 0,
              mediaTaskError: assetId2.mediaTaskError || '',
              fileName: assetId2.filename || name.name || '',
              name: name.name || aigenAudioText('upload.sourceAudioName'),
            }),
              appStore.addEdge({
                id: generateId('edge'),
                sourceId: id,
                targetId: this.nodeId,
                refSlot: refSlot5,
                createdAt: Date.now(),
              }),
              appStore.setSelectedNodes([this.nodeId]));
          }),
            this._updateSubmitButtonState());
        } catch (error2) {
          window.showToast?.(error2?.message || aigenAudioText('upload.failedRetry'), 'error');
        } finally {
          ((this._audioRefUploadInput.value = ''),
            (this._audioRefUploadSlot = ''),
            (this._audioRefUploadAnchorNodeId = ''));
        }
      }));
    const el19 = document.createElement('div');
    ((el19.className = 'prompt-input-wrapper'),
      (this._promptInputWrap = el19),
      (this.promptEl = document.createElement('div')),
      (this.promptEl.className = 'prompt-textarea custom-textarea'),
      (this.promptEl.contentEditable = 'true'),
      (this.promptEl.spellcheck = false),
      (this.promptEl.dataset.placeholder = aigenAudioText('prompt.placeholder')),
      (this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
      this.promptEl.addEventListener('input', (value96) => {
        (schedulePromptHtmlCommit(this),
          checkSlashTrigger(value96, {
            promptEl: this.promptEl,
            nodeType: this._data.type,
            nodeId: this.nodeId,
            onGenerate: (value97, value98) => this._onGenerate(value97, value98),
          }),
          _checkAtTrigger(this, value96),
          _syncEdgesOrderFromPills(this),
          this._updateSubmitButtonState());
      }),
      this.promptEl.addEventListener('blur', () => {
        flushPromptHtmlCommit(this);
      }),
      this.promptEl.addEventListener('mouseover', (value99) => _handlePillHover(value99, this)),
      this.promptEl.addEventListener('mouseout', (value100) => _handlePillOut(value100, this)),
      this.promptEl.addEventListener('keydown', (event14) => {
        if (handlePromptSelectAll(this, event14)) return;
        if (_handleMentionMenuKeyboard(event14)) return;
        if (handleSlashKeyboardNavigation(event14)) return;
        if (shouldSubmitPromptByKeyboard(event14)) {
          (event14.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
          return;
        }
        _handlePillKeyboard(this, event14);
      }),
      this.promptEl.addEventListener('paste', (value101) => {
        handlePromptPaste(this, value101);
      }));
    this._data.prompt &&
      ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), _rehydratePromptPills(this));
    (el19.appendChild(this.promptEl),
      this._syncPromptBoxSizeFromData(this._data),
      this._setupPromptBoxResize(),
      el16.appendChild(el19),
      this._syncWorkflowDefaults(),
      this._syncAudioPromptHelpTip());
    const activeModel = this._getCurrentWorkflow(),
      renderModelUiSchemaControls2 = renderModelUiSchemaControls(activeModel.key, this._data, {
        placement: 'instance',
        variant: 'instanceToggle',
      }),
      audioModelMenuHtml = buildAudioModelMenuHtml({
        activeModel: activeModel.key,
        workflowItems: AUDIO_WORKFLOW_ITEMS,
      }),
      root = document.createElement('div');
    ((root.className = 'prompt-panel-footer'),
      (root.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap" style="position:relative;">\n              ' +
        buildAudioModelTriggerHtml({ label: activeModel.label }) +
        '\n              ' +
        audioModelMenuHtml +
        '\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        aigenAudioText('debug.buttonTitle') +
        '">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot" style="' +
        (renderModelUiSchemaControls2 ? '' : 'display:none;') +
        '">\n              ' +
        renderModelUiSchemaControls2 +
        '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" title="' +
        aigenAudioText('buttons.generate') +
        '">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
      (this.modelWrap = root.querySelector('.img-model-wrap')),
      (this.btnEl = root.querySelector('.img-gen-btn')));
    const el20 = root.querySelector('.debug-wrench-btn'),
      trigger = root.querySelector('.img-model-btn-trigger'),
      menu = root.querySelector('.img-model-menu'),
      el21 = root.querySelector('[data-runninghub-toggle]'),
      el22 = root.querySelector('.runninghub-submenu'),
      value102 = root.querySelector('.img-model-label');
    ((this._modelMenu = menu),
      (this._runninghubSubmenu = el22),
      (this._modelLabelEl = value102),
      this._footerControllerCleanup?.(),
      (this._footerControllerCleanup = bindNodeFooterController(root, {
        onOutsideClose: () => this._closeModelMenu(),
      })),
      this._uiSchemaCleanup?.(),
      (this._uiSchemaCleanup = bindModelUiSchemaControls(root, {
        nodeId: this.nodeId,
        nodeData: this._data,
        store: appStore,
      })),
      el20?.addEventListener('click', async (event15) => {
        (event15.stopPropagation(), flushPromptHtmlCommit(this));
        const enabled22 = await this._buildPayload();
        if (!enabled22) return;
        try {
          const generateAudioRequest = await buildGenerateAudioRequest(enabled22),
            outputText = formatFinalApiDebugRequest(generateAudioRequest),
            value103 = appStore.getState(),
            x5 = this._data.x + (this._data.width || 300) + 50,
            y3 = this._data.y;
          let enabled23 = Object.values(value103.nodes).find((item19) => item19.type === 'debug');
          if (!enabled23) {
            const id2 = 'debug-' + Date.now();
            appStore.addNode({
              id: id2,
              type: 'debug',
              x: x5,
              y: y3,
              width: 380,
              height: 300,
              name: aigenAudioText('debug.nodeName'),
              outputText: outputText,
            });
          } else appStore.updateNodeData(enabled23.id, { outputText: outputText, x: x5, y: y3 });
          window.showToast?.(aigenAudioText('debug.paramsShown'), 'warn');
        } catch (error3) {
          window.showToast?.(aigenAudioText('debug.buildRequestFailed', { error: error3.message }), 'error');
        }
      }),
      bindNodeModelMenuTrigger({
        root: root,
        trigger: trigger,
        menu: menu,
        activateMenuKeyboard: activateMenuKeyboard,
      }),
      el21?.addEventListener('click', (event16) => {
        event16.stopPropagation();
      }),
      el22?.querySelectorAll('.floating-menu-item').forEach((el23) => {
        el23.addEventListener('click', (event17) => {
          event17.stopPropagation();
          const value104 = this._getCurrentWorkflow().key;
          (this._setSelectedWorkflow(el23.dataset.value),
            this._getCurrentWorkflow().key !== value104 && this._closeModelMenu());
        });
      }),
      this.btnEl.addEventListener('click', () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      }),
      (this._docClickHandler = null),
      el16.appendChild(root),
      el11.appendChild(el16));
    const el24 = el11.querySelector('.node-floating-toolbar');
    if (el24) {
      el24.addEventListener('pointerdown', (event18) => event18.stopPropagation());
      const el25 = el24.querySelector('.act-clip, .clip-btn'),
        button = el24.querySelector('.act-separate, .separate-btn'),
        el26 = el24.querySelector('.act-speed, .speed-btn'),
        button2 = el24.querySelector('.act-download, .download-btn'),
        list16 = [1, 1.25, 1.5, 2];
      (el25?.addEventListener('pointerdown', (event19) => {
        (event19.stopPropagation(), AudioClipController.init(this.nodeId));
      }),
        bindRunningHubToolbarTaskButton({
          button: button,
          getTask: () => getRunningAudioSeparationTaskForNode(this.nodeId),
          cancelTask: () => cancelAudioSeparationTaskForNode(this.nodeId, { notify: true }),
          cancelTooltip: aigenAudioText('toolbar.cancelAudioSeparation'),
          eventTypes: ['pointerdown', 'click'],
        }),
        button?.addEventListener('pointerdown', (event20) => {
          if (getRunningAudioSeparationTaskForNode(this.nodeId)) {
            (event20.preventDefault(),
              event20.stopPropagation(),
              void cancelAudioSeparationTaskForNode(this.nodeId, { notify: true }));
            return;
          }
          (event20.stopPropagation(), void runAudioSeparationFromNode(this.nodeId));
        }),
        el26?.addEventListener('pointerdown', (event21) => {
          (event21.stopPropagation(), (this._speedIdx = (this._speedIdx + 1) % list16.length));
          const value105 = list16[this._speedIdx];
          if (this.audioEl) this.audioEl.playbackRate = value105;
          el26.textContent = value105.toFixed(1) + 'x';
        }),
        bindAudioDownloadAction({
          button: button2,
          getNodeData: () => appStore.getState().nodes?.[this.nodeId] || this._data || {},
          getAudioElement: () => this.audioEl,
          notifyMissing: () => window.showToast?.(aigenAudioText('download.missingAudio'), 'warn'),
        }));
    }
    return (
      this._renderRefBar(),
      this._assetMentionRegistryUnsubscribe?.(),
      (this._assetMentionRegistryUnsubscribe = subscribeAssetMentionRegistry(() => {
        if (this._assetMentionRegistryRefreshPending) return;
        ((this._assetMentionRegistryRefreshPending = true),
          queueMicrotask(() => {
            this._assetMentionRegistryRefreshPending = false;
            if (!appStore.getState().nodes?.[this.nodeId]) return;
            (_rehydratePromptPills(this), this._renderRefBar(), this._updateSubmitButtonState());
          }));
      })),
      this._syncPickConnectVisualState(),
      this._updateSubmitButtonState(),
      this._syncLocaleTexts(),
      (this._unsubscribeLocale = onLocaleChange(() => {
        this._syncLocaleTexts({ rerenderRefs: true });
      })),
      queueMicrotask(() => {
        appStore.getState().nodes?.[this.nodeId] && this._maybeResumeRunningHubTask();
      }),
      el11
    );
  }
  ['_syncLocaleTexts'](options4 = {}) {
    (this.promptEl && (this.promptEl.dataset.placeholder = aigenAudioText('prompt.placeholder')),
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
    const value106 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      el27 = resolveGenerationButtonMode(value106, {
        cancellable: String(value106?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf',
        cancelInFlight: this._rhCancelInFlight === true,
      });
    if (el27.busy) {
      String(value106?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf'
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
      ((this.btnEl.disabled = el27.disabled), (this.btnEl.style.cursor = el27.cursor));
      return;
    }
    resetGenerateButtonIdleUi(this.btnEl, aigenAudioText('buttons.generate'));
    const { payload: payload3, validation: validation2 } = this._buildPayloadSnapshot(),
      enabled24 = validation2.ok && !!payload3.audioWorkflowKey;
    !enabled24
      ? ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'))
      : ((this.btnEl.disabled = false), (this.btnEl.style.cursor = ''));
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
      enabled25 = appStore.getState().nodes?.[this.nodeId],
      audioDurationSec2 = pickAudioDurationSec(
        enabled25?.audioDuration,
        !enabled25 ? this._data?.audioDuration : 0,
        !enabled25 ? this._data?.duration : 0,
      );
    if (audioDurationSec2 > 0) {
      if (!(audioDurationSec > 0)) return audioDurationSec2;
      const value107 = Math.max(1, audioDurationSec2 * 0.25);
      if (Math.abs(audioDurationSec2 - audioDurationSec) > value107) return audioDurationSec2;
    }
    return audioDurationSec;
  }
  ['_syncKnownAudioDurationUi']({ currentTime: currentTime = 0, showLine: showLine = false } = {}) {
    const duration3 = this._readAudioDurationSec();
    if (!(duration3 > 0)) return false;
    const value108 = Number(currentTime),
      currentTime4 = Number.isFinite(value108) ? Math.max(0, Math.min(value108, duration3)) : 0,
      enabled26 = this._progressController?.sync({
        currentTime: currentTime4,
        duration: duration3,
        force: true,
        showLine: showLine,
      });
    if (!showLine) this._progressController?.hideLine?.();
    return (
      !enabled26 &&
        this._timeEl &&
        (this._timeEl.textContent = this._fmtTime(currentTime4) + ' / ' + this._fmtTime(duration3)),
      true
    );
  }
  ['_applyResolvedAudioDuration'](value109, value110 = this._currentSrc) {
    if (value110 && this._currentSrc !== value110) return false;
    const audioDuration2 = normalizeAudioDurationSec(value109);
    if (!(audioDuration2 > 0)) return false;
    const value111 = appStore.getState().nodes?.[this.nodeId],
      audioDurationSec3 = pickAudioDurationSec(
        value111?.audioDuration,
        this._data?.audioDuration,
        this._data?.duration,
      );
    if (audioDurationSec3 > 0) {
      if (Math.abs(audioDurationSec3 - audioDuration2) <= 0.001)
        return this._syncKnownAudioDurationUi({
          currentTime: this.audioEl?.currentTime || 0,
          showLine: Number(this.audioEl?.currentTime || 0) > 0,
        });
      const value112 = Math.max(1, audioDurationSec3 * 0.25);
      if (Math.abs(audioDurationSec3 - audioDuration2) > value112) return false;
    }
    return (
      value111
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
  ['_probeAudioDurationIfNeeded'](value113) {
    const enabled27 = String(value113 || '').trim();
    if (!enabled27 || this._readAudioDurationSec() > 0) return;
    const value114 = (this._audioDurationProbeToken || 0) + 1;
    ((this._audioDurationProbeToken = value114),
      void loadAudioDurationMetadataSec(enabled27).then((value115) => {
        if (this._audioDurationProbeToken !== value114 || this._currentSrc !== enabled27) return;
        this._applyResolvedAudioDuration(value115, enabled27);
      }));
  }
  ['_rememberAudioDuration'](value116 = this._currentSrc) {
    if (!this.audioEl || (value116 && this._currentSrc !== value116)) return;
    const count8 = this._readAudioDurationSec();
    if (!(count8 > 0)) return;
    this._applyResolvedAudioDuration(count8, value116);
  }
  ['_rewindEndedAudioIfNeeded']() {
    if (!this.audioEl) return;
    const duration4 = this._readAudioDurationSec();
    if (!(duration4 > 0)) return;
    const value117 = Number(this.audioEl.currentTime || 0),
      enabled28 = Number.isFinite(value117) && value117 >= duration4 - 0.05;
    if (this.audioEl.ended !== true && !enabled28) return;
    try {
      this.audioEl.currentTime = 0;
    } catch {}
    this._progressController?.sync({ currentTime: 0, duration: duration4, force: true, showLine: true });
  }
  ['_clearAudioElementSource']() {
    if (!this.audioEl) return;
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
  ['_bindAudioLoadHandlers'](value118) {
    if (!this.audioEl) return;
    const value119 = () => {
        if (this._currentSrc === value118) this._rememberAudioDuration(value118);
      },
      value120 = () => {
        this._currentSrc === value118 && (this._rememberAudioDuration(value118), stopLoading(this.previewEl));
      };
    ((this.audioEl.onloadedmetadata = value119),
      (this.audioEl.ondurationchange = value119),
      (this.audioEl.onloadeddata = value120),
      (this.audioEl.oncanplay = value120),
      (this.audioEl.onplaying = value120),
      (this.audioEl.onerror = () => {
        if (this._currentSrc === value118) stopLoading(this.previewEl);
      }));
  }
  ['_prepareAudio'](value121) {
    const enabled29 = String(value121 || '').trim();
    if (!enabled29)
      return (
        typeof this._cancelDeferredWaveform === 'function' &&
          (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
        this._clearAudioElementSource(),
        (this._currentSrc = null),
        this._progressController?.reset(),
        (this._audioDurationProbeToken += 1),
        false
      );
    const value122 = this._currentSrc !== enabled29;
    ((this._currentSrc = enabled29), this._clearStatusOverlay());
    if (value122) this._progressController?.reset();
    this._getAudioElementSource() && this._clearAudioElementSource();
    ((this.audioEl.preload = 'none'), this._bindAudioLoadHandlers(enabled29));
    !this._syncKnownAudioDurationUi({ currentTime: 0, showLine: false }) &&
      this._probeAudioDurationIfNeeded(enabled29);
    (stopLoading(this.previewEl), void this._ensureWaveform(enabled29, { persistedOnly: true }));
    if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    return (this._setAudioPreviewResultState(true), this._syncStatusOverlay(this._data, true), true);
  }
  async ['_loadAudio'](value123, { showLoading: showLoading = true } = {}) {
    const enabled30 = String(value123 || '').trim();
    if (!enabled30) return this._prepareAudio('');
    const value124 = this._currentSrc !== enabled30;
    ((this._currentSrc = enabled30), this._clearStatusOverlay());
    if (value124) this._progressController?.reset();
    this._bindAudioLoadHandlers(enabled30);
    const enabled31 = !!this._getAudioElementCurrentSource(),
      enabled32 = !isMediaElementPlaybackSource(this.audioEl, enabled30) || !enabled31;
    if (!enabled32 && this._isAudioElementReady()) {
      if (this.audioEl.preload !== 'auto') this.audioEl.preload = 'auto';
      return (stopLoading(this.previewEl), true);
    }
    if (showLoading && enabled32) startLoading(this.previewEl);
    if (!enabled32) {
      if (this.audioEl.preload !== 'auto') this.audioEl.preload = 'auto';
      try {
        this.audioEl.load?.();
      } catch {}
    } else
      await attachMediaElementPlaybackSource(this.audioEl, enabled30, { preload: 'auto', warmRanges: false });
    if (this._isAudioElementReady()) stopLoading(this.previewEl);
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    this._cancelDeferredWaveform = deferWaveformPathUntilAudioReady(this.audioEl, () => {
      this._cancelDeferredWaveform = null;
      if (this._currentSrc !== enabled30) return;
      void this._ensureWaveform(enabled30);
    });
    if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    return (this._setAudioPreviewResultState(true), this._syncStatusOverlay(this._data, true), true);
  }
  async ['_playAudio']() {
    if (!this.audioEl || !this._currentSrc) return;
    (beginAudioPlayback(this.nodeId),
      await this._loadAudio(this._currentSrc, { showLoading: true }),
      this._rewindEndedAudioIfNeeded());
    const promise = this.audioEl.play();
    promise && typeof promise.catch === 'function'
      ? promise
          .then(() => stopLoading(this.previewEl))
          .catch((error4) => {
            stopLoading(this.previewEl);
            if (error4?.name === 'AbortError') return;
            console.warn('[AIGenAudioNode] play failed:', error4);
          })
      : stopLoading(this.previewEl);
  }
  ['_stopAudioForExternalPlayback']() {
    if (!this.audioEl) return;
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    try {
      this.audioEl.pause?.();
    } catch {}
    (!this._getAudioElementCurrentSource() && this._progressController?.reset(),
      stopLoading(this.previewEl),
      this._setPlayIcon(true));
  }
  ['_syncPromptBoxSizeFromData'](value125 = this._data) {
    if (!this.promptEl || this._isPromptBoxResizing) return;
    const promptBoxHeightBounds = getPromptBoxHeightBounds(this._promptPanel),
      promptBoxHeight = normalizePromptBoxHeight(value125?.promptBoxHeight, promptBoxHeightBounds);
    applyPromptBoxHeight(this.promptEl, promptBoxHeight);
  }
  ['_setupPromptBoxResize']() {
    if (!this._promptPanel || this._promptResizeHandle) return;
    this._promptResizeHandle = true;
    const value126 = 20,
      value127 = 10,
      handler = () => getStoreSnapshot().ui?.promptBoxResizeEnabled !== false,
      handler2 = (el28) => !!el28?.closest('.floating-menu, .img-model-menu'),
      handler3 = (value128) => {
        const box6 = this._promptPanel.getBoundingClientRect();
        return value128 >= box6.bottom - value126 && value128 <= box6.bottom + value127;
      },
      handler4 = (event22) => {
        if (!this._promptPanel) return;
        if (!handler()) {
          this._promptPanel.classList.remove('is-resize-hover');
          return;
        }
        if (this._isPromptBoxResizing) {
          this._promptPanel.classList.add('is-resize-hover');
          return;
        }
        const value129 = !handler2(event22?.target) && handler3(event22.clientY);
        this._promptPanel.classList.toggle('is-resize-hover', value129);
      };
    (this._promptPanel.addEventListener('pointermove', handler4),
      this._promptPanel.addEventListener('pointerleave', () => {
        !this._isPromptBoxResizing && this._promptPanel?.classList.remove('is-resize-hover');
      }));
    const value130 = (event23) => {
      if (!this._promptInputWrap || !this.promptEl) return;
      if (!handler()) return;
      if (event23.button !== 0) return;
      if (!handler3(event23.clientY)) return;
      if (event23.target?.closest('.prompt-submit') || handler2(event23.target)) return;
      (event23.stopPropagation(), event23.preventDefault());
      const promptBoxHeightBounds2 = getPromptBoxHeightBounds(this._promptPanel),
        value131 = event23.clientY,
        value132 = this.promptEl.getBoundingClientRect().height;
      ((this._isPromptBoxResizing = true),
        this._promptInputWrap.classList.add('is-resizing'),
        this._promptPanel.classList.add('is-resize-hover'));
      const value133 = (event24) => {
          event24.preventDefault();
          const promptBoxHeight2 = normalizePromptBoxHeight(
            value132 + (event24.clientY - value131),
            promptBoxHeightBounds2,
          );
          applyPromptBoxHeight(this.promptEl, promptBoxHeight2);
        },
        value134 = (event25) => {
          (event25.preventDefault(),
            window.removeEventListener('pointermove', value133),
            window.removeEventListener('pointerup', value134),
            window.removeEventListener('pointercancel', value134));
          const promptBoxHeight3 = normalizePromptBoxHeight(
            this.promptEl?.getBoundingClientRect().height,
            promptBoxHeightBounds2,
          );
          (applyPromptBoxHeight(this.promptEl, promptBoxHeight3),
            this._promptInputWrap.classList.remove('is-resizing'),
            (this._isPromptBoxResizing = false),
            this._promptPanel.classList.remove('is-resize-hover'),
            handler4(event25),
            appStore.updateNodeData(this.nodeId, { promptBoxHeight: promptBoxHeight3 }));
        };
      (window.addEventListener('pointermove', value133),
        window.addEventListener('pointerup', value134),
        window.addEventListener('pointercancel', value134),
        (this._promptResizeCleanup = () => {
          (this._promptPanel?.removeEventListener('pointerdown', value130),
            this._promptPanel?.removeEventListener('pointermove', handler4),
            window.removeEventListener('pointermove', value133),
            window.removeEventListener('pointerup', value134),
            window.removeEventListener('pointercancel', value134));
        }));
    };
    (this._promptPanel.addEventListener('pointerdown', value130),
      (this._promptResizeCleanup = () => {
        (this._promptPanel?.removeEventListener('pointerdown', value130),
          this._promptPanel?.removeEventListener('pointermove', handler4),
          this._promptPanel?.classList.remove('is-resize-hover'));
      }));
  }
  ['update'](value135) {
    ((this._data = value135), this._syncPromptBoxSizeFromData(value135), this._syncWorkflowDefaults());
    const value136 = this._getCurrentWorkflow().key;
    this._enforceWorkflowAudioInputLimit();
    const enabled33 = this._resolveNodeAudioUrl(value135);
    if (enabled33 && enabled33 !== this._currentSrc && this.audioEl)
      (this._prepareAudio(enabled33),
        this._applyResultWideLayout(value135, false),
        this._syncStatusOverlay(value135, true));
    else {
      if (!enabled33 && this.audioEl)
        (typeof this._cancelDeferredWaveform === 'function' &&
          (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
          this._clearAudioElementSource(),
          (this._currentSrc = null),
          this._progressController?.reset(),
          (this._audioDurationProbeToken += 1),
          this._setAudioPreviewResultState(false),
          this._syncStatusOverlay(value135, false));
      else
        enabled33
          ? (!this._syncKnownAudioDurationUi({
              currentTime: this.audioEl?.currentTime || 0,
              showLine: Number(this.audioEl?.currentTime || 0) > 0,
            }) && this._probeAudioDurationIfNeeded(enabled33),
            this._applyResultWideLayout(value135, false),
            this._setAudioPreviewResultState(true),
            this._syncStatusOverlay(value135, true))
          : this._syncStatusOverlay(value135, false);
    }
    shouldShowGenerationBusyUi(value135) && ((this._isGenerating = true), startLoading(this.previewEl));
    if (document.activeElement !== this.promptEl && value135.prompt !== undefined) {
      const sanitizePromptHtml2 = sanitizePromptHtml(value135.prompt || '');
      this.promptEl?.innerHTML !== sanitizePromptHtml2 &&
        ((this.promptEl.innerHTML = sanitizePromptHtml2), _rehydratePromptPills(this));
    }
    this._refreshWorkflowUi();
    const args8 = appStore.getIncomingEdges(this.nodeId),
      list17 = [...args8],
      value137 = list17
        .map((item20) =>
          [
            String(item20?.id || ''),
            String(item20?.sourceId || ''),
            String(item20?.refSlot || ''),
            String(item20?.sourceMediaKey || ''),
          ].join(':'),
        )
        .join('|'),
      value138 = list17
        .map((item21) => {
          const value139 = appStore.getState().nodes?.[item21.sourceId] || {},
            value140 = Number(value139._bizRev || 0),
            value141 = Number.isFinite(Number(value139.mainVideoIndex))
              ? Math.max(0, Math.trunc(Number(value139.mainVideoIndex)))
              : 0,
            value142 = Array.isArray(value139.videos)
              ? value139.videos[value141] || value139.videos[0]
              : null,
            value143 = [
              String(value139.thumbId || ''),
              String(value139.thumbUrl || ''),
              String(value142?.thumbId || ''),
              String(value142?.thumbUrl || ''),
              String(value142?.localPath || ''),
              String(value142?.videoUrl || ''),
              String(value139.localPath || ''),
              String(value139.src || ''),
              String(value139.imageUrl || ''),
              String(value139.videoUrl || ''),
              String(value139.audioUrl || ''),
            ].join('|');
          return (
            item21.id +
            ':' +
            item21.sourceId +
            ':' +
            String(item21?.refSlot || '') +
            ':' +
            String(item21?.sourceMediaKey || '') +
            ':' +
            value140 +
            ':' +
            value143
          );
        })
        .join('||');
    ((value137 !== this._lastEdgeSig ||
      value138 !== this._lastRefMediaSig ||
      value136 !== this._lastWorkflowKey) &&
      ((this._lastEdgeSig = value137),
      (this._lastRefMediaSig = value138),
      (this._lastWorkflowKey = value136),
      this._renderRefBar()),
      this._syncPickConnectVisualState(),
      this._maybeResumeRunningHubTask(),
      this._updateSubmitButtonState());
  }
  async ['_buildPayload'](value144 = null) {
    this._enforceWorkflowAudioInputLimit();
    const { payload: payload4, validation: validation3 } = this._buildPayloadSnapshot(value144);
    if (!validation3.ok) return (window.showToast?.(validation3.message, 'warn'), null);
    if (!(await this._validateAdvancedVoiceCloneDurations(payload4.audioRefs))) return null;
    return payload4;
  }
  ['_getPreviewGenerateButtonLoadingOptions']() {
    return createPreviewGenerateButtonCallbacks(this, aigenAudioText('buttons.generate'));
  }
  async ['_onGenerate'](template2 = null, value145 = {}) {
    if (this._isGenerating) return;
    if (value145?.insertPrompt === true) {
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
        startPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions());
      return;
    }
    if (!(await this._ensureVipAccessForCurrentWorkflow())) {
      this._updateSubmitButtonState();
      return;
    }
    const modelId4 = await this._buildPayload(template2);
    if (!modelId4) {
      this._updateSubmitButtonState();
      return;
    }
    (this._stopRunningHubRecovery(true),
      (this._rhCancelRequested = false),
      (this._rhCancelInFlight = false),
      (this._rhRemoteCancelSent = false),
      (this._isGenerating = true),
      (this._rhAbortController = new AbortController()));
    const startedAt9 = Date.now();
    (this._setGeneratingUi(),
      startLoading(this.previewEl),
      (this._rhTaskId = ''),
      (this._rhApiKey = String(modelId4?.apiKey || '').trim()));
    let response5 = null;
    try {
      response5 = await submitTask(
        {
          sourceNodeId: this.nodeId,
          targetNodeId: this.nodeId,
          trigger: 'node',
          taskType: 'audio-generation',
          provider: 'runninghubwf',
          adapterType: 'workflow',
          modelId: modelId4.audioWorkflowKey || this._data?.model || '',
          executionId: 'runninghub.audio.' + (modelId4.audioWorkflowKey || 'workflow'),
          payload: modelId4,
          cancellable: true,
          resumable: true,
          startBuilder: () => ({
            provider: modelId4.provider,
            audioWorkflowKey: modelId4.audioWorkflowKey,
            audioWorkflowLabel: modelId4.audioWorkflowLabel,
            model: modelId4.audioWorkflowKey,
            rhInstanceType: modelId4.rhInstanceType,
            rhTaskUseOpenapiQuery: true,
          }),
          onTaskStart: () => {
            this._persistRunningHubResumeCache();
          },
          submit: async (value146, value147) => {
            return generateAudio(modelId4, {
              signal: this._rhAbortController.signal,
              onTaskMeta: ({ taskId: taskId5, useOpenapiQuery: useOpenapiQuery3, apiKey: apiKey2 }) => {
                const enabled34 = String(taskId5 || '').trim();
                if (!enabled34) return;
                ((this._rhTaskId = enabled34),
                  (this._rhApiKey =
                    String(apiKey2 || '').trim() ||
                    String(modelId4?.apiKey || '').trim() ||
                    this._rhApiKey ||
                    ''),
                  value147.onTaskId(enabled34),
                  appStore.updateNodeData(this.nodeId, { rhTaskUseOpenapiQuery: useOpenapiQuery3 === true }),
                  this._persistRunningHubResumeCache(),
                  this._rhCancelRequested &&
                    !this._rhCancelInFlight &&
                    !this._rhRemoteCancelSent &&
                    this._cancelRunningHubWorkflowTask());
              },
              onTaskId: (value148) => {
                const enabled35 = String(value148 || '').trim();
                if (!enabled35) return;
                ((this._rhTaskId = enabled35),
                  value147.onTaskId(enabled35),
                  appStore.updateNodeData(this.nodeId, { rhTaskUseOpenapiQuery: true }),
                  this._persistRunningHubResumeCache(),
                  this._rhCancelRequested &&
                    !this._rhCancelInFlight &&
                    !this._rhRemoteCancelSent &&
                    this._cancelRunningHubWorkflowTask());
              },
            });
          },
          cancel: async ({ taskId: taskId6 }) => {
            const apiKey3 = String(this._rhApiKey || modelId4?.apiKey || '').trim();
            if (!apiKey3 || !taskId6) return;
            await cancelRunningHubAudioTask({ apiKey: apiKey3, taskId: taskId6 });
          },
          resultBuilder: async (value149, value150) => {
            const args9 = await this._applyAudioResultAndStore(value149, value150.startedAt, {
              writeStore: false,
            });
            return { ...args9.patch, rhStatusMessage: null, rhStatusCode: null };
          },
          failureBuilder: (rhStatusMessage4) => ({
            rhStatusMessage: rhStatusMessage4?.message || aigenAudioText('generation.failed'),
            rhStatusCode: Number.isFinite(Number(rhStatusMessage4?.code))
              ? Number(rhStatusMessage4.code)
              : null,
          }),
          cancelledBuilder: () => ({
            audioUrl: '',
            src: '',
            localPath: '',
            rhStatusMessage: aigenAudioText('generation.interrupted'),
          }),
          parseError: (error5) => error5?.message || aigenAudioText('generation.failed'),
        },
        { store: appStore, startedAt: startedAt9, abortController: this._rhAbortController },
      );
      if (response5.status === 'success')
        return (
          this._persistRunningHubResumeCache(),
          window.showToast?.(aigenAudioText('generation.completed'), 'success'),
          response5
        );
      const error6 = response5.error;
      if (response5.status === 'failed' && String(error6?.code || '') === 'SUBSCRIPTION_REQUIRED') {
        const modelId5 =
          String(error6?.requiredModelId || '').trim() ||
          this._getCurrentGateModelId() ||
          this._data?.model ||
          '';
        if (typeof window.handleSubscriptionRequired === 'function')
          await window.handleSubscriptionRequired({
            modelId: modelId5,
            provider: 'runninghubwf',
            error: error6,
          });
        else
          typeof window.openSubscriptionDialog === 'function'
            ? window.openSubscriptionDialog({ modelId: modelId5, provider: 'runninghubwf' })
            : window.showToast?.(error6?.message || aigenAudioText('vip.needSubscription'), 'warn');
      } else
        response5.status === 'failed' &&
          (console.error('[AIGenAudioNode] 生成失败:', error6),
          window.showToast?.(
            aigenAudioText('generation.failedWithError', { error: error6?.message || error6 }),
            'error',
          ),
          this._persistRunningHubResumeCache());
      return response5;
    } finally {
      const value151 = appStore.getState().nodes?.[this.nodeId] || {},
        shouldShowGenerationBusyUi3 = shouldShowGenerationBusyUi(value151);
      ((this._isGenerating = shouldShowGenerationBusyUi3), (this._rhAbortController = null));
      if (shouldShowGenerationBusyUi3) {
        const value152 = String(value151?.rhTaskId || '').trim();
        if (value152) this._rhTaskId = value152;
      } else this._rhTaskId = '';
      if (!this._rhCancelRequested) this._rhApiKey = '';
      ((this._rhCancelRequested = false),
        (this._rhCancelInFlight = false),
        (this._rhRemoteCancelSent = false),
        this._setGeneratingUi());
      if (!shouldShowGenerationBusyUi3) stopLoading(this.previewEl);
    }
  }
  ['_renderRefBar']() {
    if (!this.refBarEl) return;
    const value153 = this._getCurrentWorkflow().key;
    this._refBarWorkflowKey !== value153 &&
      ((this._refBarWorkflowKey = value153),
      (this.refBarEl.innerHTML = ''),
      this.refBarEl.classList.remove('active', 'rh-v5-refbar'));
    const list18 = getWorkflowAudioSlots(value153),
      promptAttachmentButtonHTML = createPromptAttachmentButtonHTML(),
      value154 = appStore.getIncomingEdges(this.nodeId),
      value155 = appStore.getState().nodes || {},
      value156 = {},
      value157 = { text: 0, image: 0, video: 0, audio: 0 },
      value158 = {
        text: aigenAudioText('assetTypes.text'),
        image: aigenAudioText('assetTypes.image'),
        video: aigenAudioText('assetTypes.video'),
        audio: aigenAudioText('assetTypes.audio'),
      },
      enabled36 = {};
    list18.forEach((item22) => (enabled36[item22.slot] = null));
    const list19 = [...list18.map((item23) => item23.slot)],
      list20 = [];
    for (const edge of value154) {
      const src2 = value155[edge.sourceId];
      if (!src2) continue;
      const list21 = String(src2.type || '');
      let value159 = 'image';
      if (list21.includes('text')) value159 = 'text';
      else {
        if (list21.includes('video')) value159 = 'video';
        else {
          if (list21.includes('audio')) value159 = 'audio';
        }
      }
      (value157[value159]++, (value156[edge.sourceId] = '@' + value158[value159] + value157[value159]));
      if (value159 === 'audio') list20.push({ edge: edge, src: src2 });
    }
    for (const value160 of list20) {
      const { edge: edge2, src: src3 } = value160;
      let enabled37 = String(edge2?.refSlot || '');
      if (!enabled36[enabled37]) {
        if (!list19.includes(enabled37)) enabled37 = '';
      }
      !enabled37 && (enabled37 = list19.find((item24) => !enabled36[item24]) || '');
      if (!enabled37 || enabled36[enabled37]) continue;
      const list22 = [
          String(src3?.thumbUrl || '').trim(),
          String(src3?.imageUrl || '').trim(),
          String(src3?.src || '').trim(),
          toLocalAssetUrl(src3?.localPath),
          String(src3?.audioUrl || '').trim(),
        ].filter(Boolean),
        html = list22.find((item25) => isLikelyImageUrl(item25)) || '';
      if (html) ensureThumbDecoded(html);
      const sig = enabled37 + '|' + edge2.id + '|' + edge2.sourceId + '|' + (html || 'audio-fallback');
      enabled36[enabled37] = {
        edgeId: edge2.id,
        sourceId: edge2.sourceId,
        sig: sig,
        html: html
          ? '<img src="' + html + '" class="ref-thumb-media is-pending" draggable="false">'
          : createReferenceFallbackThumbHtml('audio'),
      };
    }
    const nodeData2 = value155?.[this.nodeId] || this._data || {};
    (getAssetInputRefsFromPromptAndNode(this.promptEl, {
      nodeData: nodeData2,
      allowedTypes: ['audio'],
    }).forEach((response6) => {
      const enabled38 = list19.find((item26) => !enabled36[item26]) || '';
      if (!enabled38 || !response6.url) return;
      const list23 = [
          String(response6?.thumbUrl || '').trim(),
          String(response6?.nodeData?.thumbUrl || '').trim(),
          String(response6?.nodeData?.imageUrl || '').trim(),
          String(response6?.nodeData?.src || '').trim(),
          toLocalAssetUrl(response6?.nodeData?.localPath),
        ].filter(Boolean),
        html2 = list23.find((item27) => isLikelyImageUrl(item27)) || '';
      if (html2) ensureThumbDecoded(html2);
      const assetId3 = String(response6.assetId || ''),
        assetIndex = String(response6.itemIndex ?? ''),
        assetOccurrence = String(response6.assetMentionOccurrence ?? ''),
        assetRefSource = String(response6.assetRefSource || 'prompt'),
        sig2 =
          enabled38 +
          '|asset:' +
          assetId3 +
          ':' +
          assetIndex +
          ':' +
          assetOccurrence +
          '|' +
          (html2 || 'audio-fallback');
      enabled36[enabled38] = {
        edgeId: '',
        sourceId: 'asset:' + assetId3 + ':' + assetIndex,
        sig: sig2,
        html: html2
          ? '<img src="' + html2 + '" class="ref-thumb-media is-pending" draggable="false">'
          : createReferenceFallbackThumbHtml('audio'),
        virtual: true,
        assetId: assetId3,
        assetIndex: assetIndex,
        assetOccurrence: assetOccurrence,
        assetRefSource: assetRefSource,
        refType: 'audio',
      };
    }),
      this.refBarEl.classList.add('active', 'rh-v5-refbar'));
    let container = this.refBarEl.querySelector('.rh-v5-ref-container');
    const value161 =
      !container ||
      !this.refBarEl.querySelector('.prompt-attachment-btn') ||
      container.querySelectorAll('[data-slot]').length !== list18.length;
    value161 &&
      ((this.refBarEl.innerHTML =
        promptAttachmentButtonHTML +
        ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="' +
        aigenAudioText('refs.inputAria') +
        '">\n        ' +
        list18
          .map(
            (item28) =>
              '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-slot="' +
              item28.slot +
              '" title="' +
              aigenAudioText('refs.connectAudio') +
              '"><span class="ref-upload-label">' +
              item28.label +
              '</span></button>',
          )
          .join('') +
        '\n      </div>'),
      (container = this.refBarEl.querySelector('.rh-v5-ref-container')));
    const run3 = (value162, enabled39, value163) => {
      if (!container) return;
      const el29 = container.querySelector('[data-slot="' + value162 + '"]');
      if (!enabled39) {
        if (el29 && el29.tagName === 'BUTTON' && el29.classList.contains('ref-upload-slot')) return;
        const el30 = document.createElement('button');
        ((el30.type = 'button'),
          (el30.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
          (el30.dataset.slot = value162),
          (el30.title = aigenAudioText('refs.connectAudio')));
        const el31 = document.createElement('span');
        ((el31.className = 'ref-upload-label'), (el31.textContent = value163), el30.appendChild(el31));
        if (el29) el29.replaceWith(el30);
        else container.appendChild(el30);
        return;
      }
      const el32 = document.createElement('div');
      ((el32.className =
        'ref-thumb-wrap rh-v5-ref-box' + (enabled39.virtual ? ' ref-thumb-wrap--asset' : '')),
        el32.setAttribute('draggable', enabled39.virtual ? 'false' : 'true'),
        (el32.dataset.slot = value162),
        (el32.dataset.edgeId = enabled39.edgeId),
        (el32.dataset.sourceId = enabled39.sourceId),
        (el32.dataset.sig = enabled39.sig),
        (el32.dataset.refOrigin = enabled39.virtual ? 'asset' : 'node'));
      enabled39.virtual &&
        ((el32.dataset.assetId = enabled39.assetId || ''),
        (el32.dataset.assetIndex = enabled39.assetIndex || ''),
        (el32.dataset.assetOccurrence = enabled39.assetOccurrence || ''),
        (el32.dataset.assetRefSource = enabled39.assetRefSource || 'prompt'),
        (el32.dataset.refType = enabled39.refType || 'audio'));
      ((el32.innerHTML =
        enabled39.html +
        '<button type="button" class="ref-thumb-delete" title="' +
        aigenAudioText('refs.remove') +
        '">&times;</button>'),
        revealRefThumbMedia(el32, enabled39.sig));
      if (el29) el29.replaceWith(el32);
      else container.appendChild(el32);
    };
    (list18.forEach((item29) => run3(item29.slot, enabled36[item29.slot], item29.label)),
      bindRefThumbFixedSlotDrag({
        owner: this,
        container: container,
        store: appStore,
        nodeId: this.nodeId,
        acceptMap: Object.fromEntries(list18.map((item30) => [item30.slot, 'audio'])),
      }),
      (this._attachBtnIcon = this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || null),
      this._syncPickConnectVisualState(),
      _syncPillLabels(this, value156));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      this._unregisterAudioPlaybackClient?.(),
      (this._unregisterAudioPlaybackClient = null),
      this._flushPromptHtmlCommit?.(),
      this._assetMentionRegistryUnsubscribe?.(),
      (this._assetMentionRegistryUnsubscribe = null),
      (this._assetMentionRegistryRefreshPending = false),
      this._stopRunningHubRecovery(false),
      this._rhAbortController && !this._rhAbortController.signal.aborted && this._rhAbortController.abort(),
      (this._rhAbortController = null),
      this._clearStatusOverlay(),
      this._closeModelMenu(),
      this._docClickHandler &&
        (document.removeEventListener('click', this._docClickHandler), (this._docClickHandler = null)),
      this._unbindRefThumbHoverPreview &&
        (this._unbindRefThumbHoverPreview(), (this._unbindRefThumbHoverPreview = null)),
      this._progressController?.destroy(),
      (this._progressController = null),
      typeof this._cancelDeferredWaveform === 'function' &&
        (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
      this._clearAudioElementSource(),
      this._promptResizeCleanup && (this._promptResizeCleanup(), (this._promptResizeCleanup = null)),
      this._uiSchemaCleanup?.(),
      (this._uiSchemaCleanup = null),
      this._footerControllerCleanup?.(),
      (this._footerControllerCleanup = null),
      this._generationNodeHelpTip?.remove(),
      (this._generationNodeHelpTip = null),
      this._promptPanel?.classList.remove('is-resize-hover'),
      this._promptInputWrap?.classList.remove('is-resizing'),
      (this._isPromptBoxResizing = false));
  }
}
