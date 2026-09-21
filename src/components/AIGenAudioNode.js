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
function aigenAudioText(_0x28fe1e, _0x5d3df0 = {}) {
  return t('aigenAudioNode.' + _0x28fe1e, _0x5d3df0);
}
const AUDIO_WORKFLOW_VALIDATORS = Object.freeze({
    indextts2_clone(_0x5d3c8e) {
      const _0x580e1f = Array.isArray(_0x5d3c8e?.audioRefs) ? _0x5d3c8e.audioRefs : [],
        _0x208e37 = _0x580e1f.some((_0x34a9c8) => String(_0x34a9c8?.refSlot || '') === 'audioRef');
      if (!_0x208e37) return aigenAudioText('validation.referenceVoiceRequired');
      const _0x36033c = _0x580e1f.some((_0x152bc5) => String(_0x152bc5?.refSlot || '') === 'audio2');
      if (!_0x36033c && !String(_0x5d3c8e?.prompt || '').trim())
        return aigenAudioText('validation.promptRequired');
      return '';
    },
    voice_convert(_0x33ce11) {
      const _0x2d272c = Array.isArray(_0x33ce11?.audioRefs) ? _0x33ce11.audioRefs : [],
        _0x279909 = _0x2d272c.some((_0x409ea9) => String(_0x409ea9?.refSlot || '') === 'audioRef'),
        _0x6156c0 = _0x2d272c.some((_0x555890) => String(_0x555890?.refSlot || '') === 'audioTarget');
      if (!_0x279909 || !_0x6156c0) return aigenAudioText('validation.voiceConvertRefsRequired');
      return '';
    },
    [ADVANCED_VOICE_CLONE_WORKFLOW_KEY](_0x518418) {
      if (!String(_0x518418?.prompt || '').trim()) return aigenAudioText('validation.promptRequired');
      return '';
    },
  }),
  AUDIO_WORKFLOW_ITEMS = buildAudioWorkflowItems(AUDIO_WORKFLOW_VALIDATORS),
  AUDIO_WORKFLOW_MAP = new Map(AUDIO_WORKFLOW_ITEMS.map((_0xd5040a) => [_0xd5040a.key, _0xd5040a])),
  AUDIO_WORKFLOW_LABEL_MAP = new Map(
    AUDIO_WORKFLOW_ITEMS.map((_0x13d895) => [_0x13d895.label, _0x13d895.key]),
  ),
  TEXT_INPUT_TYPES = new Set(['source-text', 'text', 'ai-text', 'custom-ai-text']),
  AUDIO_INPUT_TYPES = new Set(['source-audio', 'audio', 'ai-audio']),
  VIDEO_INPUT_TYPES = new Set(['source-video', 'video', 'ai-video']),
  AUDIO_RESULT_WIDTH = 0x1a4,
  AUDIO_RESULT_HEIGHT = 180,
  AUDIO_RESULT_RATIO = AUDIO_RESULT_WIDTH / AUDIO_RESULT_HEIGHT,
  getStoreSnapshot = () =>
    typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function getWorkflowAudioInputLimit(_0x51b331) {
  return getWorkflowAudioSlots(_0x51b331).length || 1;
}
function getWorkflowAudioSlots(_0x1a2938) {
  const _0x278e56 = getModelManifest(_0x1a2938)?.inputSlots?.fixedSlots;
  if (Array.isArray(_0x278e56) && _0x278e56.length > 0)
    return _0x278e56
      .map((_0x4b2201) => ({
        slot: String(_0x4b2201?.id || ''),
        label: String(_0x4b2201?.label || _0x4b2201?.id || ''),
      }))
      .filter((_0x11e78c) => _0x11e78c.slot);
  return [{ slot: 'audioRef', label: aigenAudioText('refs.referenceVoice') }];
}
function normalizeWorkflowAudioRefSlots(_0x2c1a65 = [], _0x19530b) {
  const _0x115198 = Array.isArray(_0x2c1a65) ? _0x2c1a65 : [],
    _0x3c9de7 = getWorkflowAudioSlots(_0x19530b).map((_0x3575ca) => _0x3575ca.slot);
  if (_0x3c9de7.length === 0) return _0x115198;
  const _0x493ceb = new Set();
  return _0x115198.map((_0x193de9) => {
    const _0x4e0f7e = String(_0x193de9?.refSlot || '').trim();
    if (_0x4e0f7e && _0x3c9de7.includes(_0x4e0f7e) && !_0x493ceb.has(_0x4e0f7e))
      return (_0x493ceb.add(_0x4e0f7e), { ..._0x193de9, refSlot: _0x4e0f7e });
    const _0x256f8c = _0x3c9de7.find((_0x1c4d02) => !_0x493ceb.has(_0x1c4d02)) || '';
    if (!_0x256f8c) return { ..._0x193de9, refSlot: _0x3c9de7.includes(_0x4e0f7e) ? _0x4e0f7e : '' };
    return (_0x493ceb.add(_0x256f8c), { ..._0x193de9, refSlot: _0x256f8c });
  });
}
function getWorkflowGateModelId(_0xd9c41a) {
  if (!isVipModel(_0xd9c41a, 'runninghubwf')) return '';
  return resolveVipGateModelId(_0xd9c41a, 'runninghubwf');
}
function getWorkflowByKey(_0xce4eb) {
  return AUDIO_WORKFLOW_MAP.get(String(_0xce4eb || '').trim());
}
function resolveWorkflowKeyFromNodeData(_0x249f4f = {}) {
  const _0x534ed7 = [_0x249f4f.audioWorkflowKey, _0x249f4f.model, _0x249f4f.audioWorkflowLabel].map(
    (_0x1882af) => String(_0x1882af || '').trim(),
  );
  for (const _0x13fd48 of _0x534ed7) {
    if (!_0x13fd48) continue;
    const _0x498d89 =
      (AUDIO_WORKFLOW_MAP.has(_0x13fd48) ? _0x13fd48 : '') || AUDIO_WORKFLOW_LABEL_MAP.get(_0x13fd48) || '';
    if (_0x498d89) return _0x498d89;
  }
  return '';
}
function getDefaultWorkflow() {
  return AUDIO_WORKFLOW_ITEMS[0];
}
function getPlainGenerationParams(_0x1b6061) {
  return _0x1b6061 && typeof _0x1b6061 === 'object' && !Array.isArray(_0x1b6061) ? { ..._0x1b6061 } : {};
}
function getWorkflowUiSchemaField(_0x24e485, _0x24951b) {
  const _0x46c8a1 = getModelManifest(_0x24e485)?.uiSchema?.fields;
  if (!Array.isArray(_0x46c8a1)) return null;
  return _0x46c8a1.find((_0x285203) => String(_0x285203?.id || '').trim() === _0x24951b) || null;
}
function resolveWorkflowSchemaParam(_0x5cf33e, _0x5408d2, _0x3ec77a) {
  const _0x4b128e = getWorkflowUiSchemaField(_0x5408d2, _0x3ec77a);
  if (!_0x4b128e) throw new Error('RunningHub audio manifest ' + _0x5408d2 + ' missing ' + _0x3ec77a);
  if (_0x4b128e.defaultValue === undefined)
    throw new Error('RunningHub audio manifest ' + _0x5408d2 + ' missing ' + _0x3ec77a + ' defaultValue');
  const _0x3354aa = getPlainGenerationParams(_0x5cf33e?.generationParams),
    _0x53dee1 = Object.prototype.hasOwnProperty.call(_0x3354aa, _0x3ec77a)
      ? _0x3354aa[_0x3ec77a]
      : _0x4b128e.defaultValue;
  if (_0x53dee1 === undefined || _0x53dee1 === null || String(_0x53dee1).trim() === '')
    throw new Error('RunningHub audio manifest ' + _0x5408d2 + ' missing ' + _0x3ec77a);
  return _0x53dee1;
}
function buildWorkflowGenerationParamsPatch(_0x441af2, _0x49263d, _0x3bc0cc = {}) {
  const _0x3637f3 = String(_0x441af2?.model || _0x441af2?.audioWorkflowKey || '').trim(),
    _0x2321d1 = String(_0x49263d || '').trim(),
    _0x59c5a7 = getPlainGenerationParams(_0x441af2?.generationParamsByModel);
  _0x3637f3 && (_0x59c5a7[_0x3637f3] = getPlainGenerationParams(_0x441af2?.generationParams));
  const _0x142bbf = buildModelUiSchemaDefaultParams(_0x2321d1),
    _0x4bbebe = getPlainGenerationParams(_0x59c5a7[_0x2321d1]),
    _0x5322d8 = { ..._0x142bbf, ..._0x4bbebe, ...getPlainGenerationParams(_0x3bc0cc) };
  if (_0x2321d1) _0x59c5a7[_0x2321d1] = _0x5322d8;
  return { generationParams: _0x5322d8, generationParamsByModel: _0x59c5a7 };
}
function normalizePromptForBackend(_0xce0d83, _0x15e204) {
  const _0x1a6353 = String(_0x15e204 || '').trim();
  if (_0xce0d83 !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY) return _0x1a6353;
  return _0x1a6353
    .replace(/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    .replace(/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]: ')
    .replace(/\s+(\[speaker_[12]\]:)/g, '\n$1')
    .trim();
}
function toLocalAssetUrl(_0x4b2cab) {
  return localPathToUrl(_0x4b2cab);
}
function isLikelyImageUrl(_0x3a7b18) {
  const _0x1d6448 = String(_0x3a7b18 || '')
    .trim()
    .toLowerCase();
  if (!_0x1d6448) return false;
  if (_0x1d6448.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|bmp|svg|avif)(\?|#|$)/i.test(_0x1d6448);
}
function localUrlFromPath(_0x5dd066) {
  return localPathToUrl(_0x5dd066);
}
function normalizeAudioRemoteUrl(_0x451f5a) {
  const _0x20e66c = String(_0x451f5a || '').trim();
  if (!_0x20e66c) return '';
  if (_0x20e66c.startsWith('/')) return _0x20e66c;
  if (/^data:/i.test(_0x20e66c)) return _0x20e66c;
  if (/^blob:/i.test(_0x20e66c)) return _0x20e66c;
  if (_0x20e66c.startsWith('//')) return 'https:' + _0x20e66c;
  if (/^https?:\/\//i.test(_0x20e66c)) return _0x20e66c;
  return 'https://' + _0x20e66c.replace(/^\/+/, '');
}
export class AIGenAudioNode {
  constructor(_0x2bc875) {
    ((this._data = _0x2bc875),
      (this.nodeId = _0x2bc875.id),
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
    const _0x34d7f4 = resolveWorkflowKeyFromNodeData(this._data);
    return getWorkflowByKey(_0x34d7f4) || getDefaultWorkflow();
  }
  ['_syncWorkflowDefaults']() {
    const _0x97127a = this._getCurrentWorkflow(),
      _0xce06be = {};
    if (this._data.provider !== 'runninghubwf') _0xce06be.provider = 'runninghubwf';
    if (this._data.audioWorkflowKey !== _0x97127a.key) _0xce06be.audioWorkflowKey = _0x97127a.key;
    if (this._data.audioWorkflowLabel !== _0x97127a.label) _0xce06be.audioWorkflowLabel = _0x97127a.label;
    if (this._data.model !== _0x97127a.key) _0xce06be.model = _0x97127a.key;
    const _0x31a8c9 = buildWorkflowGenerationParamsPatch(this._data, _0x97127a.key);
    (JSON.stringify(_0x31a8c9.generationParams) !==
      JSON.stringify(getPlainGenerationParams(this._data.generationParams)) ||
      JSON.stringify(_0x31a8c9.generationParamsByModel) !==
        JSON.stringify(getPlainGenerationParams(this._data.generationParamsByModel))) &&
      ((_0xce06be.generationParams = _0x31a8c9.generationParams),
      (_0xce06be.generationParamsByModel = _0x31a8c9.generationParamsByModel));
    if (!Object.keys(_0xce06be).length) return;
    (appStore.updateNodeData(this.nodeId, _0xce06be), (this._data = { ...this._data, ..._0xce06be }));
  }
  ['_setSelectedWorkflow'](_0x3ea47d) {
    const _0x83766e = getWorkflowByKey(_0x3ea47d);
    if (!_0x83766e) return;
    if (
      !this._guardVipWorkflowSelection(_0x83766e.key, () => {
        this._vipSelectionRetryInProgress = true;
        try {
          this._setSelectedWorkflow(_0x83766e.key);
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      })
    )
      return;
    const _0x35794c = {
      provider: 'runninghubwf',
      audioWorkflowKey: _0x83766e.key,
      audioWorkflowLabel: _0x83766e.label,
      model: _0x83766e.key,
      ...buildWorkflowGenerationParamsPatch(this._data, _0x83766e.key),
    };
    (appStore.updateNodeData(this.nodeId, _0x35794c),
      (this._data = { ...this._data, ..._0x35794c }),
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
    const _0x5748e7 = this._getCurrentWorkflow();
    if (this._modelLabelEl) this._modelLabelEl.textContent = _0x5748e7.label;
    (this._syncAudioPromptHelpTip(_0x5748e7.key),
      syncModelUiSchemaControls(this._root, this._data),
      this._runninghubSubmenu?.querySelectorAll('.floating-menu-item').forEach((_0x53ae79) => {
        _0x53ae79.classList.toggle('active', _0x53ae79.dataset.value === _0x5748e7.key);
      }));
  }
  ['_getGenerationNodeHelpText'](_0x181a21 = this._getCurrentWorkflow().key) {
    return getGenerationNodeHelpTooltip({ kind: 'audio', key: _0x181a21 });
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
  ['_resolveAudioRefUrl'](_0x38503a) {
    return resolveCanvasAudioUrl(_0x38503a);
  }
  ['_resolveNodeAudioUrl'](_0x4b0a91) {
    return resolveCanvasAudioUrl(_0x4b0a91);
  }
  ['_resolveVideoRefUrl'](_0x5ae5bd) {
    const _0x3e4e91 = Number.isFinite(Number(_0x5ae5bd?.mainVideoIndex))
        ? Math.max(0, Math.trunc(Number(_0x5ae5bd.mainVideoIndex)))
        : 0,
      _0xedc98e = Array.isArray(_0x5ae5bd?.videos)
        ? _0x5ae5bd.videos[_0x3e4e91] || _0x5ae5bd.videos[0]
        : null;
    return resolveCanvasVideoUrl(_0xedc98e) || resolveCanvasVideoUrl(_0x5ae5bd);
  }
  async ['_persistAudioOutput'](_0x41aaab) {
    const _0x5f1dab = normalizeAudioRemoteUrl(_0x41aaab);
    if (!_0x5f1dab) return { localPath: '', audioUrl: '' };
    const _0x47340b = normalizeLocalPath(_0x5f1dab);
    if (_0x47340b) {
      const _0xfb30cc = _0x47340b;
      return { localPath: _0xfb30cc, audioUrl: localUrlFromPath(_0xfb30cc) };
    }
    try {
      const _0x25b886 = await saveRemoteAudioLocallyDetailed(_0x5f1dab),
        _0x3f6ba3 = pickResultLocalPath(_0x25b886);
      if (_0x3f6ba3) {
        const _0x59a725 = pickAudioDurationSec(_0x25b886?.audioDuration, _0x25b886?.duration);
        return {
          ...(_0x25b886 && typeof _0x25b886 === 'object' ? _0x25b886 : {}),
          localPath: _0x3f6ba3,
          audioUrl: localUrlFromPath(_0x3f6ba3),
          ...(_0x59a725 > 0 ? { audioDuration: _0x59a725 } : {}),
        };
      }
    } catch (_0x58129d) {
      console.warn('[AIGenAudioNode] 音频落盘失败:', _0x58129d);
    }
    throw new Error(aigenAudioText('errors.localSaveGeneratedFailed'));
  }
  ['_persistRunningHubResumeCache']() {
    try {
      window._triggerLocalCacheSave?.();
    } catch {}
  }
  ['_isRunningHubRecoverableRunningTask'](_0x2b4ca1 = this._data) {
    const _0x4da0e7 = String(_0x2b4ca1?.provider || '')
      .trim()
      .toLowerCase();
    if (_0x4da0e7 !== 'runninghubwf') return false;
    const _0x51cae2 = String(_0x2b4ca1?.rhTaskId || '').trim();
    if (!_0x51cae2) return false;
    const _0x552f92 = String(_0x2b4ca1?.rhTaskStatus || '')
      .trim()
      .toLowerCase();
    if (
      _0x552f92 === 'success' ||
      _0x552f92 === 'failed' ||
      _0x552f92 === 'idle' ||
      _0x552f92 === 'cancelled'
    )
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
  ['_stopRunningHubRecovery'](_0x30178f = false) {
    this._rhResumeAbortController &&
      !this._rhResumeAbortController.signal.aborted &&
      this._rhResumeAbortController.abort();
    ((this._rhResumeAbortController = null), (this._rhResumeTaskId = ''), (this._rhResumePromise = null));
    if (_0x30178f) {
      const _0x4ae248 = appStore.getState().nodes?.[this.nodeId];
      _0x4ae248?.rhTaskRecovering &&
        (appStore.updateNodeData(this.nodeId, { rhTaskRecovering: false }),
        this._persistRunningHubResumeCache());
    }
  }
  ['_setGeneratingUi']() {
    if (!this.btnEl) return;
    const _0x1272b8 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      _0x28c8bc = String(_0x1272b8?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf',
      _0x4161a4 = resolveGenerationButtonMode(_0x1272b8, {
        cancellable: _0x28c8bc,
        cancelInFlight: this._rhCancelInFlight === true,
      });
    if (_0x4161a4.busy) {
      _0x28c8bc
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
      ((this.btnEl.disabled = _0x4161a4.disabled), (this.btnEl.style.cursor = _0x4161a4.cursor));
      return;
    }
    (resetGenerateButtonIdleUi(this.btnEl, aigenAudioText('buttons.generate')),
      this._updateSubmitButtonState());
  }
  ['_guardVipWorkflowSelection'](_0x4da07b, _0x483ced = null) {
    const _0x244a44 = getWorkflowGateModelId(_0x4da07b);
    if (!_0x244a44) return true;
    const _0x2192eb = window.isModelAllowedBySubscription,
      _0x38eda3 = typeof _0x2192eb === 'function' ? _0x2192eb(_0x244a44, 'runninghubwf') : true;
    if (_0x38eda3) return true;
    if (this._vipSelectionRetryInProgress) return false;
    return (
      typeof window.openSubscriptionDialog === 'function'
        ? window.openSubscriptionDialog({
            modelId: _0x244a44,
            provider: 'runninghubwf',
            onSuccess: _0x483ced,
          })
        : window.showToast?.(aigenAudioText('vip.needAuthorization'), 'warn'),
      false
    );
  }
  async ['runGeneration'](_0x20c733 = {}) {
    return this._onGenerate(null, _0x20c733);
  }
  async ['cancelGeneration']() {
    return this._cancelRunningHubWorkflowTask();
  }
  ['getGenerationStatus']() {
    const _0x8150e5 = appStore.getState?.()?.nodes?.[this.nodeId] || this._data || {},
      _0x21cb75 = String(
        _0x8150e5.jobStatus || _0x8150e5.rhTaskStatus || (this._isGenerating ? 'running' : 'idle'),
      );
    return {
      nodeId: this.nodeId,
      jobStatus: _0x21cb75,
      isGenerating: this._isGenerating === true || _0x21cb75 === 'running' || _0x21cb75 === 'pending',
      taskId: String(this._rhTaskId || _0x8150e5.rhTaskId || _0x8150e5.taskId || ''),
      cancellable: true,
      resumable: Boolean(_0x8150e5.rhTaskId),
    };
  }
  async ['_handleGenerateOrCancel'](_0x4575f8 = null) {
    const _0x245073 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      _0x348a9c = String(_0x245073?.provider || 'runninghubwf')
        .trim()
        .toLowerCase(),
      _0x4034e5 = _0x348a9c === 'runninghubwf';
    if (
      shouldAllowCancel(_0x245073, {
        cancellable: _0x4034e5,
        cancelInFlight: this._rhCancelInFlight === true,
      })
    ) {
      await this._cancelRunningHubWorkflowTask();
      return;
    }
    await this._onGenerate(_0x4575f8);
  }
  async ['_cancelRunningHubWorkflowTask']() {
    let _0xc345c1 = this._rhApiKey || '';
    const _0x5de768 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      _0xeb0cad = String(this._rhTaskId || '').trim() || String(_0x5de768?.rhTaskId || '').trim(),
      _0x525440 = Date.now(),
      _0x189257 = Number(_0x5de768?.generationStartTime),
      _0x1b57db =
        _0x5de768?.generationDuration != null
          ? _0x5de768.generationDuration
          : Number.isFinite(_0x189257) && _0x189257 > 0
            ? Math.max(0, _0x525440 - _0x189257)
            : 0;
    this._rhCancelRequested = true;
    if (this._rhCancelInFlight) return;
    this._stopRunningHubRecovery(false);
    if (!_0xc345c1)
      try {
        await ensureConfig();
        const _0x550163 = getProviderConfig('runninghubwf');
        _0xc345c1 = String(_0x550163?.apiKey || '').trim();
      } catch {}
    if (_0xc345c1) this._rhApiKey = _0xc345c1;
    const _0x119e54 = !_0xeb0cad,
      _0x150132 = ({ remoteResult: _0x41eca1, remoteError: _0x382fae, startedAt: _0x359b75 }) => {
        const _0x28bfd9 = Number(_0x41eca1?.code),
          _0x136e51 = _0x119e54 ? aigenAudioText('cancel.interruptedMissingTaskId') : '',
          _0x5916d8 =
            _0x136e51 ||
            (_0x382fae
              ? _0x382fae.message || aigenAudioText('cancel.failed')
              : _0x28bfd9 === 0
                ? aigenAudioText('cancel.success')
                : _0x28bfd9 === 0x327
                  ? aigenAudioText('cancel.taskMissing')
                  : _0x41eca1?.msg || aigenAudioText('cancel.failed'));
        return {
          audioUrl: '',
          src: '',
          localPath: '',
          generationDuration: _0x1b57db,
          rhStatusMessage: _0x5916d8,
          rhStatusCode: _0x119e54 ? 0x32d : Number.isFinite(_0x28bfd9) ? _0x28bfd9 : null,
          ...this._buildRunningHubTaskPatch({
            taskId: _0xeb0cad,
            status: 'cancelled',
            startedAt: Number(_0x359b75 || _0x5de768?.rhTaskStartedAt || _0x5de768?.generationStartTime || 0),
            recovering: false,
            useOpenapiQuery: _0x5de768?.rhTaskUseOpenapiQuery === true,
          }),
        };
      };
    try {
      ((this._rhCancelInFlight = true),
        (this._rhRemoteCancelSent = true),
        await cancelTask(this.nodeId, {
          store: appStore,
          taskId: _0xeb0cad,
          cancellable: true,
          cancel: async ({ taskId: _0x49f694 }) => {
            if (!_0xc345c1) throw new Error(aigenAudioText('cancel.missingApiKey'));
            return cancelRunningHubAudioTask({ apiKey: _0xc345c1, taskId: _0x49f694 });
          },
          cancelledBuilder: _0x150132,
          spec: {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'audio-generation',
            provider: 'runninghubwf',
            adapterType: 'workflow',
            modelId: _0x5de768?.audioWorkflowKey || _0x5de768?.model || '',
            executionId: 'runninghub.audio.' + (_0x5de768?.audioWorkflowKey || 'workflow'),
            payload: _0x5de768,
            cancellable: true,
            resumable: true,
            resultBuilder: () => ({}),
            cancelledBuilder: _0x150132,
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
  async ['_applyAudioResultAndStore'](_0x39cbc5, _0x40c630, { writeStore: writeStore = true } = {}) {
    const _0x261c51 = await buildAudioGenerationResultPatch(_0x39cbc5, {
      startedAt: _0x40c630,
      persistAudioOutput: (_0x5eac04) => this._persistAudioOutput(_0x5eac04),
    });
    if (!_0x261c51?.audioUrl || !_0x261c51?.localPath)
      throw new Error(aigenAudioText('errors.localSaveGeneratedFailed'));
    writeStore && appStore.updateNodeData(this.nodeId, _0x261c51);
    const _0x361316 = {
      audioUrl: _0x261c51.audioUrl,
      src: _0x261c51.src,
      localPath: _0x261c51.localPath,
      audioDuration: _0x261c51.audioDuration,
      waveformLocalPath: _0x261c51.waveformLocalPath,
      assetId: _0x261c51.assetId,
      derivativeStatus: _0x261c51.derivativeStatus,
      fileName: _0x261c51.fileName,
    };
    return (
      this._dispatchGenerationHistoryAudio(_0x361316, _0x40c630),
      this._applyResultWideLayout({ ...this._data, ..._0x361316 }, true),
      { finalUrl: _0x361316.audioUrl, finalLocalPath: _0x361316.localPath, patch: _0x261c51 }
    );
  }
  ['_dispatchGenerationHistoryAudio'](_0x13baaa, _0x1df9bc) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
    if (!_0x13baaa || typeof _0x13baaa !== 'object') return;
    if (!String(_0x13baaa.audioUrl || _0x13baaa.localPath || '').trim()) return;
    const _0x17f2d6 = appStore.getState().nodes?.[this.nodeId] || this._data || {};
    try {
      window.dispatchEvent(
        new CustomEvent(GENERATION_HISTORY_EVENT, {
          detail: {
            kind: 'audio',
            sourceNodeId: this.nodeId,
            nodeData: _0x17f2d6,
            audios: [_0x13baaa],
            startedAt: _0x1df9bc,
            createdAt: Date.now(),
          },
        }),
      );
    } catch {}
  }
  async ['_maybeResumeRunningHubTask']() {
    const _0x1b9087 = appStore.getState().nodes?.[this.nodeId] || this._data || {};
    if (this._isGenerating && _0x1b9087?.rhTaskRecovering !== true) return;
    if (!this._isRunningHubRecoverableRunningTask(_0x1b9087)) {
      this._stopRunningHubRecovery(false);
      return;
    }
    const _0x1f7d7e = String(_0x1b9087?.rhTaskId || '').trim();
    if (!_0x1f7d7e) {
      this._stopRunningHubRecovery(false);
      return;
    }
    if (this._rhResumeTaskId === _0x1f7d7e && this._rhResumePromise) return;
    this._stopRunningHubRecovery(false);
    const _0x31e405 = Number(_0x1b9087?.rhTaskStartedAt || _0x1b9087?.generationStartTime || Date.now());
    this._rhResumeTaskId = _0x1f7d7e;
    const _0x49ab87 = (async () => {
      let _0x1df422 = null;
      try {
        const _0xb8fa03 = await this._buildPayload();
        if (!_0xb8fa03) return;
        ((_0x1df422 = new AbortController()),
          (this._rhResumeAbortController = _0x1df422),
          (this._rhTaskId = _0x1f7d7e));
        let _0x25c9ee = String(_0xb8fa03?.apiKey || '').trim() || this._rhApiKey || '';
        if (!_0x25c9ee)
          try {
            await ensureConfig();
            const _0x328ec1 = getProviderConfig('runninghubwf');
            _0x25c9ee = String(_0x328ec1?.apiKey || '').trim();
          } catch {}
        ((this._rhApiKey = _0x25c9ee || ''),
          (this._isGenerating = true),
          this._setGeneratingUi(),
          startLoading(this.previewEl));
        const _0x373a11 = await resumeTask(
          {
            sourceNodeId: this.nodeId,
            targetNodeId: this.nodeId,
            trigger: 'node',
            taskType: 'audio-generation',
            provider: 'runninghubwf',
            adapterType: 'workflow',
            modelId: _0xb8fa03.audioWorkflowKey || _0x1b9087?.model || '',
            executionId: 'runninghub.audio.' + (_0xb8fa03.audioWorkflowKey || 'workflow'),
            payload: _0xb8fa03,
            taskId: _0x1f7d7e,
            cancellable: true,
            resumable: true,
            startBuilder: () => ({
              provider: _0xb8fa03.provider,
              audioWorkflowKey: _0xb8fa03.audioWorkflowKey,
              audioWorkflowLabel: _0xb8fa03.audioWorkflowLabel,
              model: _0xb8fa03.audioWorkflowKey,
              rhInstanceType: _0xb8fa03.rhInstanceType,
              rhTaskUseOpenapiQuery: true,
            }),
            onTaskStart: () => {
              this._persistRunningHubResumeCache();
            },
            poll: async () =>
              resumeRunningHubAudioTask(_0x1f7d7e, _0xb8fa03, {
                signal: _0x1df422.signal,
                useOpenapiQuery: true,
              }),
            resultBuilder: async (_0x3ffbbc, _0x1cf8b0) => {
              const _0x132cd5 = await this._applyAudioResultAndStore(_0x3ffbbc, _0x1cf8b0.startedAt, {
                writeStore: false,
              });
              return {
                ..._0x132cd5.patch,
                rhStatusMessage: null,
                rhStatusCode: null,
                ...this._buildRunningHubTaskPatch({
                  taskId: _0x1f7d7e,
                  status: 'success',
                  startedAt: _0x1cf8b0.startedAt,
                  recovering: false,
                  useOpenapiQuery: true,
                }),
              };
            },
            failureBuilder: (_0x1a6711, _0x13f8e5) => ({
              rhStatusMessage: _0x1a6711?.message || aigenAudioText('generation.failed'),
              rhStatusCode: Number.isFinite(Number(_0x1a6711?.code)) ? Number(_0x1a6711.code) : null,
              ...this._buildRunningHubTaskPatch({
                taskId: _0x1f7d7e,
                status: 'failed',
                startedAt: _0x13f8e5.startedAt,
                recovering: false,
                useOpenapiQuery: true,
              }),
            }),
            cancelledBuilder: (_0x7fb0fc) => ({
              audioUrl: '',
              src: '',
              localPath: '',
              rhStatusMessage: aigenAudioText('generation.interrupted'),
              rhStatusCode: null,
              ...this._buildRunningHubTaskPatch({
                taskId: _0x1f7d7e,
                status: 'cancelled',
                startedAt: _0x7fb0fc.startedAt,
                recovering: false,
                useOpenapiQuery: true,
              }),
            }),
            parseError: (_0xf7fa61) => _0xf7fa61?.message || aigenAudioText('generation.failed'),
          },
          { store: appStore, startedAt: _0x31e405, abortController: _0x1df422 },
        );
        if (_0x373a11.status === 'pending') {
          this._persistRunningHubResumeCache();
          return;
        }
        this._persistRunningHubResumeCache();
      } catch (_0xdb12a3) {
        if (
          _0x1df422?.signal?.aborted ||
          _0xdb12a3?.message === 'CANCELLED' ||
          _0xdb12a3?.name === 'AbortError'
        )
          return;
        (appStore.updateNodeData(this.nodeId, {
          isGenerating: false,
          jobStatus: 'error',
          generationDuration: Math.max(0, Date.now() - _0x31e405),
          rhStatusMessage: _0xdb12a3?.message || aigenAudioText('generation.failed'),
          rhStatusCode: Number.isFinite(Number(_0xdb12a3?.code)) ? Number(_0xdb12a3.code) : null,
          ...this._buildRunningHubTaskPatch({
            taskId: _0x1f7d7e,
            status: 'failed',
            startedAt: _0x31e405,
            recovering: false,
            useOpenapiQuery: true,
          }),
        }),
          this._persistRunningHubResumeCache());
      } finally {
        _0x1df422 && this._rhResumeAbortController === _0x1df422 && (this._rhResumeAbortController = null);
        this._rhResumeTaskId === _0x1f7d7e && (this._rhResumeTaskId = '');
        this._rhResumePromise = null;
        const _0x1af4b9 = appStore.getState().nodes?.[this.nodeId] || {},
          _0x4ce2d0 = shouldShowGenerationBusyUi(_0x1af4b9);
        ((this._isGenerating = _0x4ce2d0),
          (this._rhTaskId = _0x4ce2d0 ? String(_0x1af4b9?.rhTaskId || _0x1f7d7e || '').trim() : ''),
          this._setGeneratingUi());
        if (!_0x4ce2d0) stopLoading(this.previewEl);
      }
    })();
    this._rhResumePromise = _0x49ab87;
  }
  ['_applyResultWideLayout'](_0x1186b6 = null, _0x2a1e0c = false) {
    const _0x1b49e9 = _0x1186b6 || this._data || {},
      _0x5c9dc2 = this._resolveNodeAudioUrl(_0x1b49e9);
    if (!_0x5c9dc2) return;
    const _0x16c5f0 = Number(_0x1b49e9.width || 0),
      _0x91cc91 = Number(_0x1b49e9.height || 0);
    if (!_0x2a1e0c && _0x16c5f0 > 0 && _0x91cc91 > 0) {
      const _0x262471 = _0x16c5f0 / _0x91cc91,
        _0x377c82 =
          _0x262471 >= 2 && _0x16c5f0 >= AUDIO_RESULT_WIDTH - 20 && _0x91cc91 <= AUDIO_RESULT_HEIGHT + 40,
        _0x549945 = Math.abs(_0x262471 - AUDIO_RESULT_RATIO) <= 0.08;
      if (_0x377c82 || _0x549945) return;
    }
    const _0x51d649 = _0x16c5f0 > 0 ? _0x16c5f0 : AUDIO_RESULT_WIDTH,
      _0x27bc22 = _0x91cc91 > 0 ? _0x91cc91 : AUDIO_RESULT_HEIGHT,
      _0x5313ea = Number(_0x1b49e9.x || 0) + _0x51d649 / 2,
      _0x317bf1 = Number(_0x1b49e9.y || 0) + _0x27bc22 / 2,
      _0x295ab4 = Math.round(_0x5313ea - AUDIO_RESULT_WIDTH / 2),
      _0x369c1e = Math.round(_0x317bf1 - AUDIO_RESULT_HEIGHT / 2);
    if (
      _0x16c5f0 === AUDIO_RESULT_WIDTH &&
      _0x91cc91 === AUDIO_RESULT_HEIGHT &&
      Number(_0x1b49e9.x || 0) === _0x295ab4 &&
      Number(_0x1b49e9.y || 0) === _0x369c1e
    )
      return;
    appStore.updateNodeData(this.nodeId, {
      width: AUDIO_RESULT_WIDTH,
      height: AUDIO_RESULT_HEIGHT,
      x: _0x295ab4,
      y: _0x369c1e,
    });
  }
  ['_collectInputs'](_0x5ccba5 = null) {
    const _0x2612be = appStore.getIncomingEdges(this.nodeId),
      _0x3a0c0a = appStore.getState().nodes || {},
      _0x462808 = [],
      _0x13ff5f = [],
      _0x2c9887 = [];
    _0x2612be.forEach((_0xa9624f) => {
      const _0x36fdbd = _0x3a0c0a[_0xa9624f.sourceId];
      if (!_0x36fdbd) return;
      const _0x4fe151 = String(_0x36fdbd.type || '');
      if (TEXT_INPUT_TYPES.has(_0x4fe151)) {
        const _0x25be37 = String(
          _0x36fdbd.outputText || _0x36fdbd.text || _0x36fdbd.content || _0x36fdbd.prompt || '',
        ).trim();
        if (!_0x25be37) return;
        _0x462808.push({
          edgeId: _0xa9624f.id,
          sourceId: _0xa9624f.sourceId,
          sourceType: _0x4fe151,
          text: _0x25be37,
        });
        return;
      }
      if (AUDIO_INPUT_TYPES.has(_0x4fe151)) {
        const _0x4bff1f = this._resolveAudioRefUrl(_0x36fdbd);
        if (!_0x4bff1f) return;
        _0x13ff5f.push({
          edgeId: _0xa9624f.id,
          sourceId: _0xa9624f.sourceId,
          sourceType: _0x4fe151,
          refSlot: String(_0xa9624f?.refSlot || ''),
          url: _0x4bff1f,
        });
        return;
      }
      if (VIDEO_INPUT_TYPES.has(_0x4fe151)) {
        const _0x308127 = this._resolveVideoRefUrl(_0x36fdbd);
        if (!_0x308127) return;
        _0x2c9887.push({
          edgeId: _0xa9624f.id,
          sourceId: _0xa9624f.sourceId,
          sourceType: _0x4fe151,
          url: _0x308127,
        });
      }
    });
    const _0x25f4ce = [],
      _0x5bbad3 = resolvePresetPromptTextWithTextRefs({
        template: _0x5ccba5,
        promptEl: this.promptEl,
        inEdges: _0x2612be,
        nodes: _0x3a0c0a,
        assetInputRefs: _0x25f4ce,
        assetMediaCounts: { image: 0, video: 0, audio: 0 },
        allowedAssetTypes: ['text', 'audio'],
      }),
      _0x525f2e = _0x3a0c0a?.[this.nodeId] || this._data || {};
    _0x25f4ce.push(...getPromptAssetInputRefsFromNode(_0x525f2e, { allowedTypes: ['audio'] }));
    const _0x39fce1 = this._getCurrentWorkflow().key,
      _0x54369f = getWorkflowAudioSlots(_0x39fce1).map((_0x8add3e) => _0x8add3e.slot),
      _0x590507 = normalizeWorkflowAudioRefSlots(_0x13ff5f, _0x39fce1),
      _0x20d611 = new Set(
        _0x590507
          .map((_0x2fffb7) => String(_0x2fffb7?.refSlot || ''))
          .filter((_0x1c8253) => _0x54369f.includes(_0x1c8253)),
      );
    return (
      _0x25f4ce.forEach((_0x12823f) => {
        if (_0x12823f.type !== 'audio' || !_0x12823f.url) return;
        const _0x4cb07b = _0x54369f.find((_0x742162) => !_0x20d611.has(_0x742162)) || '';
        if (!_0x4cb07b) return;
        (_0x20d611.add(_0x4cb07b),
          _0x590507.push({
            edgeId: '',
            sourceId: '',
            sourceType: 'asset-audio',
            refSlot: _0x4cb07b,
            url: _0x12823f.url,
            assetId: _0x12823f.assetId,
            assetIndex: _0x12823f.itemIndex,
          }));
      }),
      {
        prompt: String(_0x5bbad3 || '').trim(),
        textInputs: _0x462808,
        audioRefs: _0x590507,
        videoRefs: _0x2c9887,
      }
    );
  }
  ['_validatePayload'](_0x3c7033) {
    const _0x10eaad = getWorkflowByKey(_0x3c7033?.audioWorkflowKey) || getDefaultWorkflow(),
      _0x55b2b2 = _0x10eaad.validate(_0x3c7033);
    return { ok: !_0x55b2b2, message: _0x55b2b2 };
  }
  ['_buildPayloadSnapshot'](_0x467f3b = null) {
    const _0x26bfab = this._getCurrentWorkflow(),
      _0x5ccc25 = this._collectInputs(_0x467f3b),
      _0x267ad3 = {
        nodeId: this.nodeId,
        provider: 'runninghubwf',
        audioWorkflowKey: _0x26bfab.key,
        audioWorkflowLabel: _0x26bfab.label,
        rhInstanceType:
          String(resolveWorkflowSchemaParam(this._data, _0x26bfab.key, 'rhInstanceType')) === 'plus'
            ? 'plus'
            : 'default',
        prompt: normalizePromptForBackend(_0x26bfab.key, _0x5ccc25.prompt),
        textInputs: _0x5ccc25.textInputs.map((_0x44a6dd) => _0x44a6dd.text),
        audioRefs: _0x5ccc25.audioRefs,
        videoRefs: _0x5ccc25.videoRefs,
        installId: String(this._vipInstallId || window.__aicInstallId || '').trim(),
      },
      _0x24cda5 = this._validatePayload(_0x267ad3);
    return { payload: _0x267ad3, validation: _0x24cda5 };
  }
  ['_enforceWorkflowAudioInputLimit']() {
    const _0x4b81d9 = this._getCurrentWorkflow(),
      _0x55410f = getWorkflowAudioInputLimit(_0x4b81d9.key),
      _0x109e56 = appStore.getIncomingEdges(this.nodeId),
      _0x4bf456 = appStore.getState().nodes || {},
      _0x4df845 = _0x109e56.filter((_0x134953) => {
        const _0x29f121 = _0x4bf456[_0x134953.sourceId];
        return AUDIO_INPUT_TYPES.has(String(_0x29f121?.type || ''));
      });
    if (_0x4df845.length <= _0x55410f) return;
    const _0x39b6eb = [..._0x4df845].sort((_0x22a77a, _0x3047f3) => {
        const _0x1e7e55 = Number(_0x22a77a?.createdAt || 0),
          _0x255699 = Number(_0x3047f3?.createdAt || 0);
        return _0x1e7e55 - _0x255699;
      }),
      _0x2f835b = _0x39b6eb.slice(0, Math.max(0, _0x39b6eb.length - _0x55410f));
    if (!_0x2f835b.length) return;
    appStore.batch(() => {
      _0x2f835b.forEach((_0x3c6401) => appStore.removeEdge(_0x3c6401.id));
    });
  }
  ['_syncPickConnectVisualState']() {
    const _0x4bed42 = appStore.getState().pickConnectMode || {},
      _0x2afa48 = !!(_0x4bed42.active && _0x4bed42.sourceNodeId === this.nodeId),
      _0x55dac7 = this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || this._attachBtnIcon;
    _0x55dac7 &&
      ((this._attachBtnIcon = _0x55dac7),
      (_0x55dac7.style.transition = 'opacity 0.2s ease, transform 0.2s ease'),
      (_0x55dac7.style.opacity = _0x2afa48 ? '0' : ''),
      (_0x55dac7.style.transform = _0x2afa48 ? 'scale(0.4)' : ''),
      (_0x55dac7.style.pointerEvents = _0x2afa48 ? 'none' : ''));
    if (this._placeholderEl) {
      const _0x3651bd = this._placeholderEl.querySelector('.placeholder-icon-svg');
      if (_0x3651bd) {
        if (_0x2afa48) _0x3651bd.classList.add('is-pick-connecting');
        else _0x3651bd.classList.remove('is-pick-connecting');
      }
    }
  }
  ['_fmtTime'](_0x57bcca) {
    if (!_0x57bcca || isNaN(_0x57bcca)) return '0:00';
    return Math.floor(_0x57bcca / 60) + ':' + String(Math.floor(_0x57bcca % 60)).padStart(2, '0');
  }
  ['_setPlayIcon'](_0x1a54b2) {
    const _0x26a89d = this._playBtn?.querySelector?.('svg');
    if (!_0x26a89d) return;
    const _0x5ff0a9 = 'http://www.w3.org/2000/svg';
    while (_0x26a89d.firstChild) _0x26a89d.removeChild(_0x26a89d.firstChild);
    if (_0x1a54b2) {
      const _0x733e73 = document.createElementNS(_0x5ff0a9, 'polygon');
      (_0x733e73.setAttribute('points', '5 3 19 12 5 21 5 3'), _0x26a89d.appendChild(_0x733e73));
      return;
    }
    const _0x3d2168 = document.createElementNS(_0x5ff0a9, 'rect');
    (_0x3d2168.setAttribute('x', '6'),
      _0x3d2168.setAttribute('y', '4'),
      _0x3d2168.setAttribute('width', '4'),
      _0x3d2168.setAttribute('height', '16'));
    const _0x4967c0 = document.createElementNS(_0x5ff0a9, 'rect');
    (_0x4967c0.setAttribute('x', '14'),
      _0x4967c0.setAttribute('y', '4'),
      _0x4967c0.setAttribute('width', '4'),
      _0x4967c0.setAttribute('height', '16'),
      _0x26a89d.appendChild(_0x3d2168),
      _0x26a89d.appendChild(_0x4967c0));
  }
  ['_seekTo'](_0x26c1fa) {
    const _0x769298 = this._readAudioDurationSec();
    if (!this.audioEl || _0x769298 <= 0 || !this._bar) return;
    const _0x37ca42 = this._bar.getBoundingClientRect();
    if (!_0x37ca42.width) return;
    let _0x1d0bdc = (_0x26c1fa - _0x37ca42.left) / _0x37ca42.width;
    _0x1d0bdc = Math.max(0, Math.min(1, _0x1d0bdc));
    const _0x5f5a2e = _0x1d0bdc * _0x769298;
    if (!isFinite(_0x5f5a2e)) return;
    ((this._isSeeking = true),
      (this.audioEl.currentTime = _0x5f5a2e),
      this._progressController?.sync({
        currentTime: _0x5f5a2e,
        duration: _0x769298,
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
  ['_setAudioPreviewResultState'](_0x453fe2) {
    const _0x3b419b = !!_0x453fe2;
    if (this._waveBgEl) this._waveBgEl.style.display = _0x3b419b ? '' : 'none';
    if (this._wavePlayed) this._wavePlayed.style.display = _0x3b419b ? '' : 'none';
    if (this._progressLine) this._progressLine.style.display = _0x3b419b ? '' : 'none';
    if (this._bar) this._bar.style.display = _0x3b419b ? '' : 'none';
    if (this._controlsEl) this._controlsEl.style.display = _0x3b419b ? '' : 'none';
    if (this._placeholderEl) this._placeholderEl.style.display = _0x3b419b ? 'none' : '';
  }
  ['_getCurrentGateModelId']() {
    return getWorkflowGateModelId(this._getCurrentWorkflow().key);
  }
  async ['_ensureVipAccessForCurrentWorkflow']() {
    const _0xa0318 = this._getCurrentGateModelId();
    if (!_0xa0318) return ((this._vipInstallId = ''), true);
    const _0x5b204f = window.isModelAllowedBySubscription,
      _0x44a018 = typeof _0x5b204f === 'function' ? _0x5b204f(_0xa0318, 'runninghubwf') : true;
    if (!_0x44a018)
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: _0xa0318, provider: 'runninghubwf' })
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
  async ['_resolveAudioDurationSec'](_0x56811f) {
    const _0x509560 = String(_0x56811f || '').trim();
    if (!_0x509560) return 0;
    return await loadAudioDurationMetadataSec(_0x509560, { timeoutMs: 0x1388 });
  }
  async ['_validateAdvancedVoiceCloneDurations'](_0x346025 = []) {
    if (this._getCurrentWorkflow().key !== ADVANCED_VOICE_CLONE_WORKFLOW_KEY) return true;
    const _0x317e44 = Array.isArray(_0x346025) ? _0x346025 : [];
    for (const _0x2c1121 of _0x317e44) {
      const _0x587da7 = await this._resolveAudioDurationSec(_0x2c1121?.url);
      if (
        Number.isFinite(_0x587da7) &&
        _0x587da7 > 0 &&
        (_0x587da7 < ADVANCED_VOICE_CLONE_MIN_SECONDS || _0x587da7 > ADVANCED_VOICE_CLONE_MAX_SECONDS)
      ) {
        const _0x21fac5 =
          String(_0x2c1121?.refSlot || '') === 'audio2'
            ? aigenAudioText('refs.audio2')
            : aigenAudioText('refs.audio1');
        return (
          window.showToast?.(
            aigenAudioText('validation.advancedVoiceDuration', {
              label: _0x21fac5,
              duration: _0x587da7.toFixed(1),
            }),
            'warn',
          ),
          false
        );
      }
    }
    return true;
  }
  ['_createStatusCard'](_0x210fe1, _0x198be9) {
    const _0x336a65 = document.createElement('div');
    ((_0x336a65.className = 'gen-status-card'),
      Object.assign(_0x336a65.style, {
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
    const _0x1a360a = Number(_0x198be9) === 0,
      _0x57abd2 = _0x1a360a ? 'var(--green)' : 'var(--white-80)';
    return (
      (_0x336a65.innerHTML =
        '\n      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
        _0x57abd2 +
        '" stroke-width="2">\n        <circle cx="12" cy="12" r="10"/><path d="' +
        (_0x1a360a ? 'M8 12l2.5 2.5L16 9' : 'M12 8v5') +
        '" />' +
        (_0x1a360a ? '' : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
        '\n      </svg>\n      <span style="color:' +
        _0x57abd2 +
        ';font-size:12px;font-weight:600;line-height:1.4;">' +
        _0x210fe1 +
        '</span>\n    '),
      _0x336a65
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
  ['_syncStatusOverlay'](_0x4b0082 = this._data, _0x546da2 = false) {
    const _0x2abec5 =
        String(_0x4b0082?.rhStatusMessage || '').trim() ||
        (String(_0x4b0082?.jobStatus || '').toLowerCase() === 'error' ? getTaskMessage(_0x4b0082) : ''),
      _0x464bdc = _0x4b0082?.rhStatusCode;
    if (!_0x546da2 && _0x2abec5) {
      const _0x2c1fbe = this._ensureStatusOverlayEl();
      ((_0x2c1fbe.innerHTML = ''), _0x2c1fbe.appendChild(this._createStatusCard(_0x2abec5, _0x464bdc)));
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
      return;
    }
    this._clearStatusOverlay();
  }
  async ['_ensureWaveform'](_0xac6c61, { persistedOnly: persistedOnly = false } = {}) {
    const _0x35bed3 = String(_0xac6c61 || '').trim();
    if (!_0x35bed3) return;
    const _0xbff853 = ++this._waveToken,
      _0x4ea95e = localPathToUrl(this._data?.waveformLocalPath),
      _0x32a44b = { width: 200, height: 80, samples: 190 };
    let _0x14a3b8 = '';
    _0x4ea95e && (_0x14a3b8 = await getWaveformBarsPathFromPersistedUrl(_0x4ea95e, _0x32a44b));
    !_0x14a3b8 && !persistedOnly && (_0x14a3b8 = await getWaveformBarsPathFromUrl(_0x35bed3, _0x32a44b));
    if (!this.audioEl || !this._root || !this._root.isConnected) return;
    if (_0xbff853 !== this._waveToken) return;
    if (!_0x14a3b8) return;
    if (this._waveBgPath) this._waveBgPath.setAttribute('d', _0x14a3b8);
    if (this._waveFgPath) this._waveFgPath.setAttribute('d', _0x14a3b8);
  }
  ['mount']() {
    const _0xb2c773 = document.createElement('div');
    (Object.assign(_0xb2c773.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'visible',
      pointerEvents: 'auto',
      cursor: 'default',
    }),
      (this._root = _0xb2c773),
      (_0xb2c773.innerHTML = AUDIO_TOOLBAR_HTML),
      (this.previewEl = document.createElement('div')),
      (this.previewEl.className = 'node-card media-card audio-card aigen-audio-preview'),
      this.previewEl.style.setProperty('width', '100%', 'important'),
      this.previewEl.style.setProperty('height', '100%', 'important'),
      this.previewEl.style.setProperty('min-height', '160px', 'important'),
      this.previewEl.style.setProperty('flex-shrink', '0', 'important'),
      this.previewEl.style.setProperty('flex-grow', '0', 'important'),
      (this._audioCard = this.previewEl));
    const _0x208c45 = document.createElement('div');
    ((_0x208c45.className = 'waveform waveform-bg'),
      (_0x208c45.innerHTML =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      this.previewEl.appendChild(_0x208c45),
      (this._waveBgEl = _0x208c45));
    const _0x33df9e = document.createElement('div');
    ((_0x33df9e.className = 'waveform waveform-unplayed'),
      (_0x33df9e.innerHTML =
        '<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">\n      <path d="' +
        WAVE_PATH +
        '" stroke="var(--blue)" stroke-width="2" stroke-linecap="round"/>\n      <path d="M0,40 L200,40" stroke="var(--blue)" stroke-width="1" stroke-dasharray="2 4" opacity="0.4"/>\n    </svg>'),
      this.previewEl.appendChild(_0x33df9e),
      (this._wavePlayed = _0x33df9e));
    const _0x6915b2 = this.previewEl.querySelectorAll('.waveform-bg svg path'),
      _0x2b4e10 = this.previewEl.querySelectorAll('.waveform-unplayed svg path');
    ((this._waveBgPath = _0x6915b2 && _0x6915b2.length ? _0x6915b2[0] : null),
      (this._waveFgPath = _0x2b4e10 && _0x2b4e10.length ? _0x2b4e10[0] : null));
    const _0x254d81 = document.createElement('div');
    ((_0x254d81.className = 'media-progress-line'),
      this.previewEl.appendChild(_0x254d81),
      (this._progressLine = _0x254d81));
    const _0x45612f = document.createElement('div');
    ((_0x45612f.className = 'media-progress-bar'),
      this.previewEl.appendChild(_0x45612f),
      (this._bar = _0x45612f));
    const _0x2489ea = document.createElement('div');
    ((_0x2489ea.className = 'audio-controls'),
      (_0x2489ea.innerHTML =
        '\n      <button type="button" class="audio-play-btn">\n        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n      </button>\n      <div class="audio-time-wrap">\n        <span class="audio-time-display">0:00 / 0:00</span>\n      </div>'),
      this.previewEl.appendChild(_0x2489ea),
      (this._controlsEl = _0x2489ea),
      (this._playBtn = _0x2489ea.querySelector('.audio-play-btn')),
      (this._timeEl = _0x2489ea.querySelector('.audio-time-display')),
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
        formatTime: (_0x29e6ea) => this._fmtTime(_0x29e6ea),
        shouldSuppressSync: () => this._isSeeking,
      }).attach()));
    const _0x58ef52 = document.createElement('div');
    ((_0x58ef52.className = 'img-node-placeholder'),
      Object.assign(_0x58ef52.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        userSelect: 'none',
      }),
      (_0x58ef52.innerHTML =
        '\n            <svg class="placeholder-icon-svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">\n                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>\n            </svg>'),
      (this._placeholderEl = _0x58ef52),
      this.previewEl.appendChild(this.audioEl),
      this.previewEl.appendChild(_0x58ef52),
      syncPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions()));
    let _0x32b7b8 = { x: 0, y: 0 };
    (this.previewEl.addEventListener('pointerdown', (_0x2d2ddc) => {
      if (_0x2d2ddc.target.closest('.media-progress-bar')) return;
      _0x32b7b8 = { x: _0x2d2ddc.clientX, y: _0x2d2ddc.clientY };
    }),
      this.previewEl.addEventListener('pointerup', (_0x376bb4) => {
        if (
          _0x376bb4.target.closest('.media-progress-bar') ||
          _0x376bb4.target.closest('.audio-play-btn') ||
          _0x376bb4.target.closest('.audio-controls')
        )
          return;
        const _0x35a779 = Math.hypot(_0x376bb4.clientX - _0x32b7b8.x, _0x376bb4.clientY - _0x32b7b8.y);
        if (_0x35a779 >= 5) return;
        if (!this.audioEl || !this.audioEl.duration) return;
        const _0xbff915 = this.previewEl.getBoundingClientRect(),
          _0x37be3e = Math.max(0, Math.min(1, (_0x376bb4.clientX - _0xbff915.left) / _0xbff915.width)),
          _0x3ca241 = _0x37be3e * this.audioEl.duration;
        ((this.audioEl.currentTime = _0x3ca241),
          this._progressController?.sync({
            currentTime: _0x3ca241,
            duration: this.audioEl.duration,
            force: true,
            showLine: true,
          }));
      }),
      this._bar?.addEventListener('click', (_0x13069c) => {
        this._seekTo(_0x13069c.clientX);
      }),
      this._playBtn?.addEventListener('pointerdown', (_0x55f011) => {
        _0x55f011.stopPropagation();
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
    const _0x48d531 = this._resolveNodeAudioUrl(this._data);
    _0x48d531
      ? (this._prepareAudio(_0x48d531),
        this._applyResultWideLayout(this._data, false),
        this._setAudioPreviewResultState(true))
      : (this._setAudioPreviewResultState(false), this._syncStatusOverlay(this._data, false));
    _0xb2c773.appendChild(this.previewEl);
    const _0x33fb42 = document.createElement('div');
    ((_0x33fb42.className = 'text-prompt-panel'),
      (this._promptPanel = _0x33fb42),
      _0x33fb42.addEventListener('pointerdown', (_0x854fa8) => {
        _0x854fa8.stopPropagation();
      }),
      _0x33fb42.addEventListener('dblclick', (_0x3e1b50) => {
        !_0x3e1b50.target.closest('.prompt-textarea') &&
          (_0x3e1b50.preventDefault(), _0x3e1b50.stopPropagation());
      }),
      (this.refBarEl = document.createElement('div')),
      (this.refBarEl.className = 'node-ref-bar'),
      _0x33fb42.appendChild(this.refBarEl),
      this.refBarEl.addEventListener('click', (_0x1d8dc1) => {
        const _0x126ae4 = _0x1d8dc1.target.closest('.ref-thumb-delete');
        if (_0x126ae4) {
          (_0x1d8dc1.stopPropagation(), _0x1d8dc1.preventDefault());
          const _0x1ebc6b = _0x126ae4.closest('.ref-thumb-wrap');
          if (_0x1ebc6b?.dataset?.refOrigin === 'asset') {
            const _0x4297ad = {
                assetId: _0x1ebc6b.dataset.assetId,
                assetIndex: _0x1ebc6b.dataset.assetIndex,
                type: _0x1ebc6b.dataset.refType || _0x1ebc6b.dataset.kind || 'audio',
                occurrence: _0x1ebc6b.dataset.assetOccurrence,
              },
              _0x141bff = String(_0x1ebc6b.dataset.assetRefSource || '').trim(),
              _0x3668cd =
                _0x141bff === 'hidden'
                  ? removePromptAssetInputRefFromNode(this, _0x4297ad)
                  : removeAssetMentionPillFromPrompt(this, _0x4297ad) ||
                    removePromptAssetInputRefFromNode(this, _0x4297ad);
            if (_0x3668cd) return;
          }
          const _0x262ccb = _0x1ebc6b?.dataset.edgeId;
          if (_0x262ccb) appStore.removeEdge(_0x262ccb);
          return;
        }
        const _0x30fe1d = _0x1d8dc1.target.closest('.rh-v5-ref-box[data-slot]');
        if (_0x30fe1d) {
          (_0x1d8dc1.stopPropagation(), _0x1d8dc1.preventDefault());
          const _0x9a4483 = String(_0x30fe1d.dataset.slot || '').trim();
          if (!_0x9a4483 || !this._audioRefUploadInput) return;
          ((this._audioRefUploadSlot = _0x9a4483),
            (this._audioRefUploadAnchorNodeId = this.nodeId),
            (this._audioRefUploadInput.accept = 'audio/*'),
            this._audioRefUploadInput.click());
          return;
        }
        const _0x45da31 = _0x1d8dc1.target.closest('.prompt-attachment-btn');
        if (!_0x45da31 || _0x1d8dc1._pickConnectHandled) return;
        (_0x1d8dc1.stopPropagation(), _0x1d8dc1.preventDefault());
        const _0x4f30a6 = appStore.getState().pickConnectMode;
        (_0x4f30a6 && _0x4f30a6.active && _0x4f30a6.sourceNodeId === this.nodeId
          ? appStore.setPickConnectMode({ active: false })
          : appStore.setPickConnectMode({
              active: true,
              sourceNodeId: this.nodeId,
              handleDirection: 'left',
              preferredRefSlot: undefined,
            }),
          this._syncPickConnectVisualState());
      }),
      this.refBarEl.addEventListener('pointerdown', (_0x40b22c) => {
        if (
          _0x40b22c.target.closest(
            '.prompt-attachment-btn, .ref-thumb-delete, .ref-upload-slot, .rh-v5-ref-box',
          )
        )
          _0x40b22c.stopPropagation();
      }),
      (this._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(this.refBarEl)),
      (this._audioRefUploadInput = document.createElement('input')),
      (this._audioRefUploadInput.type = 'file'),
      (this._audioRefUploadInput.accept = 'audio/*'),
      (this._audioRefUploadInput.style.display = 'none'),
      _0x33fb42.appendChild(this._audioRefUploadInput),
      this._audioRefUploadInput.addEventListener('change', async (_0x5265eb) => {
        const _0x15185d = _0x5265eb.target.files?.[0],
          _0x46d07c = String(this._audioRefUploadSlot || '').trim(),
          _0x57c02a = String(this._audioRefUploadAnchorNodeId || '').trim();
        if (!_0x15185d || !_0x46d07c || !_0x57c02a) {
          this._audioRefUploadInput.value = '';
          return;
        }
        try {
          if (!String(_0x15185d.type || '').startsWith('audio/'))
            throw new Error(aigenAudioText('upload.audioOnly'));
          const _0x4c9376 = window.currentProjectId || 'default_v2_project',
            _0x141f01 = await uploadFile(_0x15185d, _0x4c9376),
            _0x393fbd = String(_0x141f01?.url || '').trim();
          if (!_0x393fbd) throw new Error(aigenAudioText('upload.missingUrl'));
          const _0x45590c = appStore.getState(),
            _0xb52c96 = _0x45590c.nodes?.[_0x57c02a];
          if (!_0xb52c96) throw new Error(aigenAudioText('upload.anchorMissing'));
          const _0x551ff7 = pickResultLocalPath(_0x141f01) || normalizeLocalPath(_0x393fbd),
            _0x9dc98 = 0x140,
            _0x32d45a = 140,
            { spacing: _0x2a54c1, direction: _0x485cf9, avoidOverlap: _0x46f713 } = getNodeSpawnPrefs(),
            _0x194182 = _0x485cf9 === 'down' ? 'down' : 'left',
            _0x48ac85 = Number(_0xb52c96.x) || 0,
            _0x37175c = Number(_0xb52c96.y) || 0,
            _0x1fa838 = Number(_0xb52c96.width) || 0x168,
            _0x438459 = Number(_0xb52c96.height) || 0x168,
            _0x4852b3 = _0x37175c + Math.round((_0x438459 - _0x32d45a) / 2);
          let _0x4c19b2 = _0x4852b3;
          if (_0x46d07c === 'audioRef' && this._getCurrentWorkflow().key === 'voice_convert')
            _0x4c19b2 = _0x4852b3 - Math.round(_0x32d45a / 2) - 8;
          else
            _0x46d07c === 'audioTarget' &&
              this._getCurrentWorkflow().key === 'voice_convert' &&
              (_0x4c19b2 = _0x4852b3 + Math.round(_0x32d45a / 2) + 8);
          const _0x482ae9 = _0x48ac85 - _0x2a54c1 - _0x9dc98,
            _0x2f1a47 = _0x46f713
              ? findAvailablePosition(
                  _0x45590c.nodes || {},
                  _0x482ae9,
                  _0x194182 === 'down' ? _0x37175c + _0x438459 + _0x2a54c1 : _0x4c19b2,
                  _0x9dc98,
                  _0x32d45a,
                  _0x2a54c1,
                  _0x194182,
                )
              : { x: _0x482ae9, y: _0x194182 === 'down' ? _0x37175c + _0x438459 + _0x2a54c1 : _0x4c19b2 };
          (appStore.batch(() => {
            const _0x297720 = appStore.getIncomingEdges(this.nodeId);
            for (const _0x2eed5b of _0x297720) {
              if (String(_0x2eed5b?.refSlot || '') === _0x46d07c) appStore.removeEdge(_0x2eed5b.id);
            }
            removeCoveredAssetInputRefForConnection({
              targetId: this.nodeId,
              sourceKind: 'audio',
              refSlot: _0x46d07c,
            });
            const _0x2e21d3 = generateId('node');
            (appStore.addNode({
              id: _0x2e21d3,
              type: 'source-audio',
              x: _0x2f1a47.x,
              y: _0x2f1a47.y,
              width: _0x9dc98,
              height: _0x32d45a,
              src: _0x393fbd,
              localPath: _0x551ff7,
              assetId: _0x141f01.assetId || '',
              originalLocalPath: _0x141f01.originalLocalPath || _0x141f01.localPath || '',
              waveformLocalPath: _0x141f01.waveformLocalPath || '',
              derivativeStatus: _0x141f01.derivativeStatus || _0x141f01.status || '',
              mediaTaskId: _0x141f01.mediaTaskId || '',
              mediaTaskKind: _0x141f01.mediaTaskKind || '',
              mediaTaskStatus: _0x141f01.mediaTaskStatus || '',
              mediaTaskProgress: Number(_0x141f01.mediaTaskProgress || 0) || 0,
              mediaTaskError: _0x141f01.mediaTaskError || '',
              fileName: _0x141f01.filename || _0x15185d.name || '',
              name: _0x15185d.name || aigenAudioText('upload.sourceAudioName'),
            }),
              appStore.addEdge({
                id: generateId('edge'),
                sourceId: _0x2e21d3,
                targetId: this.nodeId,
                refSlot: _0x46d07c,
                createdAt: Date.now(),
              }),
              appStore.setSelectedNodes([this.nodeId]));
          }),
            this._updateSubmitButtonState());
        } catch (_0xdc1343) {
          window.showToast?.(_0xdc1343?.message || aigenAudioText('upload.failedRetry'), 'error');
        } finally {
          ((this._audioRefUploadInput.value = ''),
            (this._audioRefUploadSlot = ''),
            (this._audioRefUploadAnchorNodeId = ''));
        }
      }));
    const _0xc9a808 = document.createElement('div');
    ((_0xc9a808.className = 'prompt-input-wrapper'),
      (this._promptInputWrap = _0xc9a808),
      (this.promptEl = document.createElement('div')),
      (this.promptEl.className = 'prompt-textarea custom-textarea'),
      (this.promptEl.contentEditable = 'true'),
      (this.promptEl.spellcheck = false),
      (this.promptEl.dataset.placeholder = aigenAudioText('prompt.placeholder')),
      (this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
      this.promptEl.addEventListener('input', (_0x3473d8) => {
        (schedulePromptHtmlCommit(this),
          checkSlashTrigger(_0x3473d8, {
            promptEl: this.promptEl,
            nodeType: this._data.type,
            nodeId: this.nodeId,
            onGenerate: (_0x2a225c, _0x54f5bd) => this._onGenerate(_0x2a225c, _0x54f5bd),
          }),
          _checkAtTrigger(this, _0x3473d8),
          _syncEdgesOrderFromPills(this),
          this._updateSubmitButtonState());
      }),
      this.promptEl.addEventListener('blur', () => {
        flushPromptHtmlCommit(this);
      }),
      this.promptEl.addEventListener('mouseover', (_0x5af281) => _handlePillHover(_0x5af281, this)),
      this.promptEl.addEventListener('mouseout', (_0x5eb9d0) => _handlePillOut(_0x5eb9d0, this)),
      this.promptEl.addEventListener('keydown', (_0x4cb9a4) => {
        if (handlePromptSelectAll(this, _0x4cb9a4)) return;
        if (_handleMentionMenuKeyboard(_0x4cb9a4)) return;
        if (handleSlashKeyboardNavigation(_0x4cb9a4)) return;
        if (shouldSubmitPromptByKeyboard(_0x4cb9a4)) {
          (_0x4cb9a4.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
          return;
        }
        _handlePillKeyboard(this, _0x4cb9a4);
      }),
      this.promptEl.addEventListener('paste', (_0x5d0c63) => {
        handlePromptPaste(this, _0x5d0c63);
      }));
    this._data.prompt &&
      ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), _rehydratePromptPills(this));
    (_0xc9a808.appendChild(this.promptEl),
      this._syncPromptBoxSizeFromData(this._data),
      this._setupPromptBoxResize(),
      _0x33fb42.appendChild(_0xc9a808),
      this._syncWorkflowDefaults(),
      this._syncAudioPromptHelpTip());
    const _0x59a00a = this._getCurrentWorkflow(),
      _0x7ad705 = renderModelUiSchemaControls(_0x59a00a.key, this._data, {
        placement: 'instance',
        variant: 'instanceToggle',
      }),
      _0x42e42a = buildAudioModelMenuHtml({
        activeModel: _0x59a00a.key,
        workflowItems: AUDIO_WORKFLOW_ITEMS,
      }),
      _0x255246 = document.createElement('div');
    ((_0x255246.className = 'prompt-panel-footer'),
      (_0x255246.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap" style="position:relative;">\n              ' +
        buildAudioModelTriggerHtml({ label: _0x59a00a.label }) +
        '\n              ' +
        _0x42e42a +
        '\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        aigenAudioText('debug.buttonTitle') +
        '">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot" style="' +
        (_0x7ad705 ? '' : 'display:none;') +
        '">\n              ' +
        _0x7ad705 +
        '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" title="' +
        aigenAudioText('buttons.generate') +
        '">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
      (this.modelWrap = _0x255246.querySelector('.img-model-wrap')),
      (this.btnEl = _0x255246.querySelector('.img-gen-btn')));
    const _0x3d3a79 = _0x255246.querySelector('.debug-wrench-btn'),
      _0x34de84 = _0x255246.querySelector('.img-model-btn-trigger'),
      _0x27b3d3 = _0x255246.querySelector('.img-model-menu'),
      _0x400404 = _0x255246.querySelector('[data-runninghub-toggle]'),
      _0x3da4a6 = _0x255246.querySelector('.runninghub-submenu'),
      _0x24db54 = _0x255246.querySelector('.img-model-label');
    ((this._modelMenu = _0x27b3d3),
      (this._runninghubSubmenu = _0x3da4a6),
      (this._modelLabelEl = _0x24db54),
      this._footerControllerCleanup?.(),
      (this._footerControllerCleanup = bindNodeFooterController(_0x255246, {
        onOutsideClose: () => this._closeModelMenu(),
      })),
      this._uiSchemaCleanup?.(),
      (this._uiSchemaCleanup = bindModelUiSchemaControls(_0x255246, {
        nodeId: this.nodeId,
        nodeData: this._data,
        store: appStore,
      })),
      _0x3d3a79?.addEventListener('click', async (_0x311542) => {
        (_0x311542.stopPropagation(), flushPromptHtmlCommit(this));
        const _0x2480be = await this._buildPayload();
        if (!_0x2480be) return;
        try {
          const _0x3a0312 = await buildGenerateAudioRequest(_0x2480be),
            _0x189bab = formatFinalApiDebugRequest(_0x3a0312),
            _0x4035a3 = appStore.getState(),
            _0x129da5 = this._data.x + (this._data.width || 0x12c) + 50,
            _0x483dae = this._data.y;
          let _0x1dc6cf = Object.values(_0x4035a3.nodes).find((_0x7a4426) => _0x7a4426.type === 'debug');
          if (!_0x1dc6cf) {
            const _0x4e18fc = 'debug-' + Date.now();
            appStore.addNode({
              id: _0x4e18fc,
              type: 'debug',
              x: _0x129da5,
              y: _0x483dae,
              width: 0x17c,
              height: 0x12c,
              name: aigenAudioText('debug.nodeName'),
              outputText: _0x189bab,
            });
          } else appStore.updateNodeData(_0x1dc6cf.id, { outputText: _0x189bab, x: _0x129da5, y: _0x483dae });
          window.showToast?.(aigenAudioText('debug.paramsShown'), 'warn');
        } catch (_0x11469c) {
          window.showToast?.(
            aigenAudioText('debug.buildRequestFailed', { error: _0x11469c.message }),
            'error',
          );
        }
      }),
      bindNodeModelMenuTrigger({
        root: _0x255246,
        trigger: _0x34de84,
        menu: _0x27b3d3,
        activateMenuKeyboard: activateMenuKeyboard,
      }),
      _0x400404?.addEventListener('click', (_0x3b37dd) => {
        _0x3b37dd.stopPropagation();
      }),
      _0x3da4a6?.querySelectorAll('.floating-menu-item').forEach((_0x29897a) => {
        _0x29897a.addEventListener('click', (_0x5c0f5a) => {
          _0x5c0f5a.stopPropagation();
          const _0x5cb7ae = this._getCurrentWorkflow().key;
          (this._setSelectedWorkflow(_0x29897a.dataset.value),
            this._getCurrentWorkflow().key !== _0x5cb7ae && this._closeModelMenu());
        });
      }),
      this.btnEl.addEventListener('click', () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      }),
      (this._docClickHandler = null),
      _0x33fb42.appendChild(_0x255246),
      _0xb2c773.appendChild(_0x33fb42));
    const _0x22145e = _0xb2c773.querySelector('.node-floating-toolbar');
    if (_0x22145e) {
      _0x22145e.addEventListener('pointerdown', (_0x2a9ed4) => _0x2a9ed4.stopPropagation());
      const _0x35c211 = _0x22145e.querySelector('.act-clip, .clip-btn'),
        _0x47f8b5 = _0x22145e.querySelector('.act-separate, .separate-btn'),
        _0x1770f7 = _0x22145e.querySelector('.act-speed, .speed-btn'),
        _0xf9d6c4 = _0x22145e.querySelector('.act-download, .download-btn'),
        _0x150c48 = [1, 1.25, 1.5, 2];
      (_0x35c211?.addEventListener('pointerdown', (_0x408638) => {
        (_0x408638.stopPropagation(), AudioClipController.init(this.nodeId));
      }),
        bindRunningHubToolbarTaskButton({
          button: _0x47f8b5,
          getTask: () => getRunningAudioSeparationTaskForNode(this.nodeId),
          cancelTask: () => cancelAudioSeparationTaskForNode(this.nodeId, { notify: true }),
          cancelTooltip: aigenAudioText('toolbar.cancelAudioSeparation'),
          eventTypes: ['pointerdown', 'click'],
        }),
        _0x47f8b5?.addEventListener('pointerdown', (_0x159fc3) => {
          if (getRunningAudioSeparationTaskForNode(this.nodeId)) {
            (_0x159fc3.preventDefault(),
              _0x159fc3.stopPropagation(),
              void cancelAudioSeparationTaskForNode(this.nodeId, { notify: true }));
            return;
          }
          (_0x159fc3.stopPropagation(), void runAudioSeparationFromNode(this.nodeId));
        }),
        _0x1770f7?.addEventListener('pointerdown', (_0x1c416e) => {
          (_0x1c416e.stopPropagation(), (this._speedIdx = (this._speedIdx + 1) % _0x150c48.length));
          const _0x11e83f = _0x150c48[this._speedIdx];
          if (this.audioEl) this.audioEl.playbackRate = _0x11e83f;
          _0x1770f7.textContent = _0x11e83f.toFixed(1) + 'x';
        }),
        bindAudioDownloadAction({
          button: _0xf9d6c4,
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
      _0xb2c773
    );
  }
  ['_syncLocaleTexts'](_0x54b685 = {}) {
    (this.promptEl && (this.promptEl.dataset.placeholder = aigenAudioText('prompt.placeholder')),
      this._root
        ?.querySelector?.('.debug-wrench-btn')
        ?.setAttribute?.('title', aigenAudioText('debug.buttonTitle')),
      _0x54b685.rerenderRefs === true &&
        this.refBarEl &&
        ((this._refBarWorkflowKey = ''), this._renderRefBar()),
      this._updateSubmitButtonState());
  }
  ['_updateSubmitButtonState']() {
    if (!this.btnEl) return;
    const _0x1800f0 = appStore.getState().nodes?.[this.nodeId] || this._data || {},
      _0x5342bc = resolveGenerationButtonMode(_0x1800f0, {
        cancellable: String(_0x1800f0?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf',
        cancelInFlight: this._rhCancelInFlight === true,
      });
    if (_0x5342bc.busy) {
      String(_0x1800f0?.provider || 'runninghubwf').toLowerCase() === 'runninghubwf'
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
      ((this.btnEl.disabled = _0x5342bc.disabled), (this.btnEl.style.cursor = _0x5342bc.cursor));
      return;
    }
    resetGenerateButtonIdleUi(this.btnEl, aigenAudioText('buttons.generate'));
    const { payload: _0x537d3d, validation: _0x504590 } = this._buildPayloadSnapshot(),
      _0x1a4662 = _0x504590.ok && !!_0x537d3d.audioWorkflowKey;
    !_0x1a4662
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
    const _0x4996f5 = Number(this.audioEl.readyState || 0);
    return _0x4996f5 >= 2;
  }
  ['_readAudioDurationSec']() {
    const _0x475fc8 = normalizeAudioDurationSec(this.audioEl?.duration),
      _0x56c0ab = appStore.getState().nodes?.[this.nodeId],
      _0x649022 = pickAudioDurationSec(
        _0x56c0ab?.audioDuration,
        !_0x56c0ab ? this._data?.audioDuration : 0,
        !_0x56c0ab ? this._data?.duration : 0,
      );
    if (_0x649022 > 0) {
      if (!(_0x475fc8 > 0)) return _0x649022;
      const _0x319597 = Math.max(1, _0x649022 * 0.25);
      if (Math.abs(_0x649022 - _0x475fc8) > _0x319597) return _0x649022;
    }
    return _0x475fc8;
  }
  ['_syncKnownAudioDurationUi']({ currentTime: currentTime = 0, showLine: showLine = false } = {}) {
    const _0x1e05f5 = this._readAudioDurationSec();
    if (!(_0x1e05f5 > 0)) return false;
    const _0x230de6 = Number(currentTime),
      _0x5cbd99 = Number.isFinite(_0x230de6) ? Math.max(0, Math.min(_0x230de6, _0x1e05f5)) : 0,
      _0x597ee8 = this._progressController?.sync({
        currentTime: _0x5cbd99,
        duration: _0x1e05f5,
        force: true,
        showLine: showLine,
      });
    if (!showLine) this._progressController?.hideLine?.();
    return (
      !_0x597ee8 &&
        this._timeEl &&
        (this._timeEl.textContent = this._fmtTime(_0x5cbd99) + ' / ' + this._fmtTime(_0x1e05f5)),
      true
    );
  }
  ['_applyResolvedAudioDuration'](_0x24d461, _0x5858c5 = this._currentSrc) {
    if (_0x5858c5 && this._currentSrc !== _0x5858c5) return false;
    const _0x1f56cb = normalizeAudioDurationSec(_0x24d461);
    if (!(_0x1f56cb > 0)) return false;
    const _0x5a0028 = appStore.getState().nodes?.[this.nodeId],
      _0x506779 = pickAudioDurationSec(
        _0x5a0028?.audioDuration,
        this._data?.audioDuration,
        this._data?.duration,
      );
    if (_0x506779 > 0) {
      if (Math.abs(_0x506779 - _0x1f56cb) <= 0.001)
        return this._syncKnownAudioDurationUi({
          currentTime: this.audioEl?.currentTime || 0,
          showLine: Number(this.audioEl?.currentTime || 0) > 0,
        });
      const _0x4a390a = Math.max(1, _0x506779 * 0.25);
      if (Math.abs(_0x506779 - _0x1f56cb) > _0x4a390a) return false;
    }
    return (
      _0x5a0028
        ? (appStore.updateNodeData(this.nodeId, { audioDuration: _0x1f56cb }),
          (this._data = { ...(this._data || {}), audioDuration: _0x1f56cb }),
          this._syncKnownAudioDurationUi({
            currentTime: this.audioEl?.currentTime || 0,
            showLine: Number(this.audioEl?.currentTime || 0) > 0,
          }))
        : ((this._data = { ...(this._data || {}), audioDuration: _0x1f56cb }),
          this._syncKnownAudioDurationUi({
            currentTime: this.audioEl?.currentTime || 0,
            showLine: Number(this.audioEl?.currentTime || 0) > 0,
          })),
      true
    );
  }
  ['_probeAudioDurationIfNeeded'](_0x5e37d0) {
    const _0x53d7e0 = String(_0x5e37d0 || '').trim();
    if (!_0x53d7e0 || this._readAudioDurationSec() > 0) return;
    const _0x4b6015 = (this._audioDurationProbeToken || 0) + 1;
    ((this._audioDurationProbeToken = _0x4b6015),
      void loadAudioDurationMetadataSec(_0x53d7e0).then((_0x4b46d4) => {
        if (this._audioDurationProbeToken !== _0x4b6015 || this._currentSrc !== _0x53d7e0) return;
        this._applyResolvedAudioDuration(_0x4b46d4, _0x53d7e0);
      }));
  }
  ['_rememberAudioDuration'](_0x1e6f8a = this._currentSrc) {
    if (!this.audioEl || (_0x1e6f8a && this._currentSrc !== _0x1e6f8a)) return;
    const _0x3d85e4 = this._readAudioDurationSec();
    if (!(_0x3d85e4 > 0)) return;
    this._applyResolvedAudioDuration(_0x3d85e4, _0x1e6f8a);
  }
  ['_rewindEndedAudioIfNeeded']() {
    if (!this.audioEl) return;
    const _0x3b6f04 = this._readAudioDurationSec();
    if (!(_0x3b6f04 > 0)) return;
    const _0x1102d1 = Number(this.audioEl.currentTime || 0),
      _0xda2a0a = Number.isFinite(_0x1102d1) && _0x1102d1 >= _0x3b6f04 - 0.05;
    if (this.audioEl.ended !== true && !_0xda2a0a) return;
    try {
      this.audioEl.currentTime = 0;
    } catch {}
    this._progressController?.sync({ currentTime: 0, duration: _0x3b6f04, force: true, showLine: true });
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
  ['_bindAudioLoadHandlers'](_0xb5a13f) {
    if (!this.audioEl) return;
    const _0x463395 = () => {
        if (this._currentSrc === _0xb5a13f) this._rememberAudioDuration(_0xb5a13f);
      },
      _0x10970b = () => {
        this._currentSrc === _0xb5a13f &&
          (this._rememberAudioDuration(_0xb5a13f), stopLoading(this.previewEl));
      };
    ((this.audioEl.onloadedmetadata = _0x463395),
      (this.audioEl.ondurationchange = _0x463395),
      (this.audioEl.onloadeddata = _0x10970b),
      (this.audioEl.oncanplay = _0x10970b),
      (this.audioEl.onplaying = _0x10970b),
      (this.audioEl.onerror = () => {
        if (this._currentSrc === _0xb5a13f) stopLoading(this.previewEl);
      }));
  }
  ['_prepareAudio'](_0x54bc77) {
    const _0x2ad110 = String(_0x54bc77 || '').trim();
    if (!_0x2ad110)
      return (
        typeof this._cancelDeferredWaveform === 'function' &&
          (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
        this._clearAudioElementSource(),
        (this._currentSrc = null),
        this._progressController?.reset(),
        (this._audioDurationProbeToken += 1),
        false
      );
    const _0x39fea2 = this._currentSrc !== _0x2ad110;
    ((this._currentSrc = _0x2ad110), this._clearStatusOverlay());
    if (_0x39fea2) this._progressController?.reset();
    this._getAudioElementSource() && this._clearAudioElementSource();
    ((this.audioEl.preload = 'none'), this._bindAudioLoadHandlers(_0x2ad110));
    !this._syncKnownAudioDurationUi({ currentTime: 0, showLine: false }) &&
      this._probeAudioDurationIfNeeded(_0x2ad110);
    (stopLoading(this.previewEl), void this._ensureWaveform(_0x2ad110, { persistedOnly: true }));
    if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    return (this._setAudioPreviewResultState(true), this._syncStatusOverlay(this._data, true), true);
  }
  async ['_loadAudio'](_0x1942ac, { showLoading: showLoading = true } = {}) {
    const _0xd1f52c = String(_0x1942ac || '').trim();
    if (!_0xd1f52c) return this._prepareAudio('');
    const _0x58f9c6 = this._currentSrc !== _0xd1f52c;
    ((this._currentSrc = _0xd1f52c), this._clearStatusOverlay());
    if (_0x58f9c6) this._progressController?.reset();
    this._bindAudioLoadHandlers(_0xd1f52c);
    const _0xeaec13 = !!this._getAudioElementCurrentSource(),
      _0xb55ed = !isMediaElementPlaybackSource(this.audioEl, _0xd1f52c) || !_0xeaec13;
    if (!_0xb55ed && this._isAudioElementReady()) {
      if (this.audioEl.preload !== 'auto') this.audioEl.preload = 'auto';
      return (stopLoading(this.previewEl), true);
    }
    if (showLoading && _0xb55ed) startLoading(this.previewEl);
    if (!_0xb55ed) {
      if (this.audioEl.preload !== 'auto') this.audioEl.preload = 'auto';
      try {
        this.audioEl.load?.();
      } catch {}
    } else
      await attachMediaElementPlaybackSource(this.audioEl, _0xd1f52c, { preload: 'auto', warmRanges: false });
    if (this._isAudioElementReady()) stopLoading(this.previewEl);
    typeof this._cancelDeferredWaveform === 'function' &&
      (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null));
    this._cancelDeferredWaveform = deferWaveformPathUntilAudioReady(this.audioEl, () => {
      this._cancelDeferredWaveform = null;
      if (this._currentSrc !== _0xd1f52c) return;
      void this._ensureWaveform(_0xd1f52c);
    });
    if (this._placeholderEl) this._placeholderEl.style.display = 'none';
    return (this._setAudioPreviewResultState(true), this._syncStatusOverlay(this._data, true), true);
  }
  async ['_playAudio']() {
    if (!this.audioEl || !this._currentSrc) return;
    (beginAudioPlayback(this.nodeId),
      await this._loadAudio(this._currentSrc, { showLoading: true }),
      this._rewindEndedAudioIfNeeded());
    const _0x3d25b7 = this.audioEl.play();
    _0x3d25b7 && typeof _0x3d25b7.catch === 'function'
      ? _0x3d25b7
          .then(() => stopLoading(this.previewEl))
          .catch((_0x3b2429) => {
            stopLoading(this.previewEl);
            if (_0x3b2429?.name === 'AbortError') return;
            console.warn('[AIGenAudioNode] play failed:', _0x3b2429);
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
  ['_syncPromptBoxSizeFromData'](_0x4e22f0 = this._data) {
    if (!this.promptEl || this._isPromptBoxResizing) return;
    const _0x1fe22c = getPromptBoxHeightBounds(this._promptPanel),
      _0x52857a = normalizePromptBoxHeight(_0x4e22f0?.promptBoxHeight, _0x1fe22c);
    applyPromptBoxHeight(this.promptEl, _0x52857a);
  }
  ['_setupPromptBoxResize']() {
    if (!this._promptPanel || this._promptResizeHandle) return;
    this._promptResizeHandle = true;
    const _0x14d840 = 20,
      _0x3c9d4b = 10,
      _0x3e7eae = () => getStoreSnapshot().ui?.promptBoxResizeEnabled !== false,
      _0x1eec8f = (_0x319a28) => !!_0x319a28?.closest('.floating-menu, .img-model-menu'),
      _0x1f585e = (_0x20d641) => {
        const _0x2ca1dd = this._promptPanel.getBoundingClientRect();
        return _0x20d641 >= _0x2ca1dd.bottom - _0x14d840 && _0x20d641 <= _0x2ca1dd.bottom + _0x3c9d4b;
      },
      _0x4f33a5 = (_0x5673f2) => {
        if (!this._promptPanel) return;
        if (!_0x3e7eae()) {
          this._promptPanel.classList.remove('is-resize-hover');
          return;
        }
        if (this._isPromptBoxResizing) {
          this._promptPanel.classList.add('is-resize-hover');
          return;
        }
        const _0x3e4962 = !_0x1eec8f(_0x5673f2?.target) && _0x1f585e(_0x5673f2.clientY);
        this._promptPanel.classList.toggle('is-resize-hover', _0x3e4962);
      };
    (this._promptPanel.addEventListener('pointermove', _0x4f33a5),
      this._promptPanel.addEventListener('pointerleave', () => {
        !this._isPromptBoxResizing && this._promptPanel?.classList.remove('is-resize-hover');
      }));
    const _0x17af08 = (_0x48a12d) => {
      if (!this._promptInputWrap || !this.promptEl) return;
      if (!_0x3e7eae()) return;
      if (_0x48a12d.button !== 0) return;
      if (!_0x1f585e(_0x48a12d.clientY)) return;
      if (_0x48a12d.target?.closest('.prompt-submit') || _0x1eec8f(_0x48a12d.target)) return;
      (_0x48a12d.stopPropagation(), _0x48a12d.preventDefault());
      const _0xa66fb0 = getPromptBoxHeightBounds(this._promptPanel),
        _0x5c91e0 = _0x48a12d.clientY,
        _0x1e3291 = this.promptEl.getBoundingClientRect().height;
      ((this._isPromptBoxResizing = true),
        this._promptInputWrap.classList.add('is-resizing'),
        this._promptPanel.classList.add('is-resize-hover'));
      const _0x53484f = (_0x18b97d) => {
          _0x18b97d.preventDefault();
          const _0xbd6ca1 = normalizePromptBoxHeight(_0x1e3291 + (_0x18b97d.clientY - _0x5c91e0), _0xa66fb0);
          applyPromptBoxHeight(this.promptEl, _0xbd6ca1);
        },
        _0x4ae269 = (_0x3cb11f) => {
          (_0x3cb11f.preventDefault(),
            window.removeEventListener('pointermove', _0x53484f),
            window.removeEventListener('pointerup', _0x4ae269),
            window.removeEventListener('pointercancel', _0x4ae269));
          const _0x562dc4 = normalizePromptBoxHeight(
            this.promptEl?.getBoundingClientRect().height,
            _0xa66fb0,
          );
          (applyPromptBoxHeight(this.promptEl, _0x562dc4),
            this._promptInputWrap.classList.remove('is-resizing'),
            (this._isPromptBoxResizing = false),
            this._promptPanel.classList.remove('is-resize-hover'),
            _0x4f33a5(_0x3cb11f),
            appStore.updateNodeData(this.nodeId, { promptBoxHeight: _0x562dc4 }));
        };
      (window.addEventListener('pointermove', _0x53484f),
        window.addEventListener('pointerup', _0x4ae269),
        window.addEventListener('pointercancel', _0x4ae269),
        (this._promptResizeCleanup = () => {
          (this._promptPanel?.removeEventListener('pointerdown', _0x17af08),
            this._promptPanel?.removeEventListener('pointermove', _0x4f33a5),
            window.removeEventListener('pointermove', _0x53484f),
            window.removeEventListener('pointerup', _0x4ae269),
            window.removeEventListener('pointercancel', _0x4ae269));
        }));
    };
    (this._promptPanel.addEventListener('pointerdown', _0x17af08),
      (this._promptResizeCleanup = () => {
        (this._promptPanel?.removeEventListener('pointerdown', _0x17af08),
          this._promptPanel?.removeEventListener('pointermove', _0x4f33a5),
          this._promptPanel?.classList.remove('is-resize-hover'));
      }));
  }
  ['update'](_0x56a29e) {
    ((this._data = _0x56a29e), this._syncPromptBoxSizeFromData(_0x56a29e), this._syncWorkflowDefaults());
    const _0xe166c9 = this._getCurrentWorkflow().key;
    this._enforceWorkflowAudioInputLimit();
    const _0xb3c5a1 = this._resolveNodeAudioUrl(_0x56a29e);
    if (_0xb3c5a1 && _0xb3c5a1 !== this._currentSrc && this.audioEl)
      (this._prepareAudio(_0xb3c5a1),
        this._applyResultWideLayout(_0x56a29e, false),
        this._syncStatusOverlay(_0x56a29e, true));
    else {
      if (!_0xb3c5a1 && this.audioEl)
        (typeof this._cancelDeferredWaveform === 'function' &&
          (this._cancelDeferredWaveform(), (this._cancelDeferredWaveform = null)),
          this._clearAudioElementSource(),
          (this._currentSrc = null),
          this._progressController?.reset(),
          (this._audioDurationProbeToken += 1),
          this._setAudioPreviewResultState(false),
          this._syncStatusOverlay(_0x56a29e, false));
      else
        _0xb3c5a1
          ? (!this._syncKnownAudioDurationUi({
              currentTime: this.audioEl?.currentTime || 0,
              showLine: Number(this.audioEl?.currentTime || 0) > 0,
            }) && this._probeAudioDurationIfNeeded(_0xb3c5a1),
            this._applyResultWideLayout(_0x56a29e, false),
            this._setAudioPreviewResultState(true),
            this._syncStatusOverlay(_0x56a29e, true))
          : this._syncStatusOverlay(_0x56a29e, false);
    }
    shouldShowGenerationBusyUi(_0x56a29e) && ((this._isGenerating = true), startLoading(this.previewEl));
    if (document.activeElement !== this.promptEl && _0x56a29e.prompt !== undefined) {
      const _0xf06013 = sanitizePromptHtml(_0x56a29e.prompt || '');
      this.promptEl?.innerHTML !== _0xf06013 &&
        ((this.promptEl.innerHTML = _0xf06013), _rehydratePromptPills(this));
    }
    this._refreshWorkflowUi();
    const _0x316c9c = appStore.getIncomingEdges(this.nodeId),
      _0x5cfd65 = [..._0x316c9c],
      _0x412fd3 = _0x5cfd65
        .map((_0x362545) =>
          [
            String(_0x362545?.id || ''),
            String(_0x362545?.sourceId || ''),
            String(_0x362545?.refSlot || ''),
            String(_0x362545?.sourceMediaKey || ''),
          ].join(':'),
        )
        .join('|'),
      _0x562769 = _0x5cfd65
        .map((_0x3fe652) => {
          const _0x50e231 = appStore.getState().nodes?.[_0x3fe652.sourceId] || {},
            _0x5cbed0 = Number(_0x50e231._bizRev || 0),
            _0x991d70 = Number.isFinite(Number(_0x50e231.mainVideoIndex))
              ? Math.max(0, Math.trunc(Number(_0x50e231.mainVideoIndex)))
              : 0,
            _0x440ff9 = Array.isArray(_0x50e231.videos)
              ? _0x50e231.videos[_0x991d70] || _0x50e231.videos[0]
              : null,
            _0xdd9613 = [
              String(_0x50e231.thumbId || ''),
              String(_0x50e231.thumbUrl || ''),
              String(_0x440ff9?.thumbId || ''),
              String(_0x440ff9?.thumbUrl || ''),
              String(_0x440ff9?.localPath || ''),
              String(_0x440ff9?.videoUrl || ''),
              String(_0x50e231.localPath || ''),
              String(_0x50e231.src || ''),
              String(_0x50e231.imageUrl || ''),
              String(_0x50e231.videoUrl || ''),
              String(_0x50e231.audioUrl || ''),
            ].join('|');
          return (
            _0x3fe652.id +
            ':' +
            _0x3fe652.sourceId +
            ':' +
            String(_0x3fe652?.refSlot || '') +
            ':' +
            String(_0x3fe652?.sourceMediaKey || '') +
            ':' +
            _0x5cbed0 +
            ':' +
            _0xdd9613
          );
        })
        .join('||');
    ((_0x412fd3 !== this._lastEdgeSig ||
      _0x562769 !== this._lastRefMediaSig ||
      _0xe166c9 !== this._lastWorkflowKey) &&
      ((this._lastEdgeSig = _0x412fd3),
      (this._lastRefMediaSig = _0x562769),
      (this._lastWorkflowKey = _0xe166c9),
      this._renderRefBar()),
      this._syncPickConnectVisualState(),
      this._maybeResumeRunningHubTask(),
      this._updateSubmitButtonState());
  }
  async ['_buildPayload'](_0x100cee = null) {
    this._enforceWorkflowAudioInputLimit();
    const { payload: _0x3c0d5f, validation: _0xe2915f } = this._buildPayloadSnapshot(_0x100cee);
    if (!_0xe2915f.ok) return (window.showToast?.(_0xe2915f.message, 'warn'), null);
    if (!(await this._validateAdvancedVoiceCloneDurations(_0x3c0d5f.audioRefs))) return null;
    return _0x3c0d5f;
  }
  ['_getPreviewGenerateButtonLoadingOptions']() {
    return createPreviewGenerateButtonCallbacks(this, aigenAudioText('buttons.generate'));
  }
  async ['_onGenerate'](_0x5c5a4d = null, _0x1c60b2 = {}) {
    if (this._isGenerating) return;
    if (_0x1c60b2?.insertPrompt === true) {
      (insertPresetPromptIntoEditor({
        storeApi: appStore,
        nodeId: this.nodeId,
        promptEl: this.promptEl,
        template: _0x5c5a4d,
        inEdges: appStore.getIncomingEdges(this.nodeId),
        nodes: appStore.getState().nodes || {},
        allowedAssetTypes: ['text', 'audio'],
      }),
        this._updateSubmitButtonState());
      return;
    }
    if (shouldUsePromptPreviewForPreset(_0x5c5a4d)) {
      const _0x30e9b2 = await this._buildPayload(_0x5c5a4d);
      if (!_0x30e9b2) {
        this._updateSubmitButtonState();
        return;
      }
      (previewPresetPromptInEditor({
        storeApi: appStore,
        nodeId: this.nodeId,
        promptEl: this.promptEl,
        promptText: _0x30e9b2.prompt,
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
    const _0x4e104a = await this._buildPayload(_0x5c5a4d);
    if (!_0x4e104a) {
      this._updateSubmitButtonState();
      return;
    }
    (this._stopRunningHubRecovery(true),
      (this._rhCancelRequested = false),
      (this._rhCancelInFlight = false),
      (this._rhRemoteCancelSent = false),
      (this._isGenerating = true),
      (this._rhAbortController = new AbortController()));
    const _0x1bbcfd = Date.now();
    (this._setGeneratingUi(),
      startLoading(this.previewEl),
      (this._rhTaskId = ''),
      (this._rhApiKey = String(_0x4e104a?.apiKey || '').trim()));
    let _0xb203d7 = null;
    try {
      _0xb203d7 = await submitTask(
        {
          sourceNodeId: this.nodeId,
          targetNodeId: this.nodeId,
          trigger: 'node',
          taskType: 'audio-generation',
          provider: 'runninghubwf',
          adapterType: 'workflow',
          modelId: _0x4e104a.audioWorkflowKey || this._data?.model || '',
          executionId: 'runninghub.audio.' + (_0x4e104a.audioWorkflowKey || 'workflow'),
          payload: _0x4e104a,
          cancellable: true,
          resumable: true,
          startBuilder: () => ({
            provider: _0x4e104a.provider,
            audioWorkflowKey: _0x4e104a.audioWorkflowKey,
            audioWorkflowLabel: _0x4e104a.audioWorkflowLabel,
            model: _0x4e104a.audioWorkflowKey,
            rhInstanceType: _0x4e104a.rhInstanceType,
            rhTaskUseOpenapiQuery: true,
          }),
          onTaskStart: () => {
            this._persistRunningHubResumeCache();
          },
          submit: async (_0x7e96c5, _0x21a00f) => {
            return generateAudio(_0x4e104a, {
              signal: this._rhAbortController.signal,
              onTaskMeta: ({ taskId: _0x37229d, useOpenapiQuery: _0x54af54, apiKey: _0x3efa44 }) => {
                const _0x1c903f = String(_0x37229d || '').trim();
                if (!_0x1c903f) return;
                ((this._rhTaskId = _0x1c903f),
                  (this._rhApiKey =
                    String(_0x3efa44 || '').trim() ||
                    String(_0x4e104a?.apiKey || '').trim() ||
                    this._rhApiKey ||
                    ''),
                  _0x21a00f.onTaskId(_0x1c903f),
                  appStore.updateNodeData(this.nodeId, { rhTaskUseOpenapiQuery: _0x54af54 === true }),
                  this._persistRunningHubResumeCache(),
                  this._rhCancelRequested &&
                    !this._rhCancelInFlight &&
                    !this._rhRemoteCancelSent &&
                    this._cancelRunningHubWorkflowTask());
              },
              onTaskId: (_0x1ec06) => {
                const _0x2bd255 = String(_0x1ec06 || '').trim();
                if (!_0x2bd255) return;
                ((this._rhTaskId = _0x2bd255),
                  _0x21a00f.onTaskId(_0x2bd255),
                  appStore.updateNodeData(this.nodeId, { rhTaskUseOpenapiQuery: true }),
                  this._persistRunningHubResumeCache(),
                  this._rhCancelRequested &&
                    !this._rhCancelInFlight &&
                    !this._rhRemoteCancelSent &&
                    this._cancelRunningHubWorkflowTask());
              },
            });
          },
          cancel: async ({ taskId: _0x11be94 }) => {
            const _0x4752f4 = String(this._rhApiKey || _0x4e104a?.apiKey || '').trim();
            if (!_0x4752f4 || !_0x11be94) return;
            await cancelRunningHubAudioTask({ apiKey: _0x4752f4, taskId: _0x11be94 });
          },
          resultBuilder: async (_0x2d6ee9, _0x543b58) => {
            const _0x39904b = await this._applyAudioResultAndStore(_0x2d6ee9, _0x543b58.startedAt, {
              writeStore: false,
            });
            return { ..._0x39904b.patch, rhStatusMessage: null, rhStatusCode: null };
          },
          failureBuilder: (_0x54f345) => ({
            rhStatusMessage: _0x54f345?.message || aigenAudioText('generation.failed'),
            rhStatusCode: Number.isFinite(Number(_0x54f345?.code)) ? Number(_0x54f345.code) : null,
          }),
          cancelledBuilder: () => ({
            audioUrl: '',
            src: '',
            localPath: '',
            rhStatusMessage: aigenAudioText('generation.interrupted'),
          }),
          parseError: (_0x3db466) => _0x3db466?.message || aigenAudioText('generation.failed'),
        },
        { store: appStore, startedAt: _0x1bbcfd, abortController: this._rhAbortController },
      );
      if (_0xb203d7.status === 'success')
        return (
          this._persistRunningHubResumeCache(),
          window.showToast?.(aigenAudioText('generation.completed'), 'success'),
          _0xb203d7
        );
      const _0x21d494 = _0xb203d7.error;
      if (_0xb203d7.status === 'failed' && String(_0x21d494?.code || '') === 'SUBSCRIPTION_REQUIRED') {
        const _0x460399 =
          String(_0x21d494?.requiredModelId || '').trim() ||
          this._getCurrentGateModelId() ||
          this._data?.model ||
          '';
        if (typeof window.handleSubscriptionRequired === 'function')
          await window.handleSubscriptionRequired({
            modelId: _0x460399,
            provider: 'runninghubwf',
            error: _0x21d494,
          });
        else
          typeof window.openSubscriptionDialog === 'function'
            ? window.openSubscriptionDialog({ modelId: _0x460399, provider: 'runninghubwf' })
            : window.showToast?.(_0x21d494?.message || aigenAudioText('vip.needSubscription'), 'warn');
      } else
        _0xb203d7.status === 'failed' &&
          (console.error('[AIGenAudioNode] 生成失败:', _0x21d494),
          window.showToast?.(
            aigenAudioText('generation.failedWithError', { error: _0x21d494?.message || _0x21d494 }),
            'error',
          ),
          this._persistRunningHubResumeCache());
      return _0xb203d7;
    } finally {
      const _0xa7e0a1 = appStore.getState().nodes?.[this.nodeId] || {},
        _0x4dbaad = shouldShowGenerationBusyUi(_0xa7e0a1);
      ((this._isGenerating = _0x4dbaad), (this._rhAbortController = null));
      if (_0x4dbaad) {
        const _0xf105c5 = String(_0xa7e0a1?.rhTaskId || '').trim();
        if (_0xf105c5) this._rhTaskId = _0xf105c5;
      } else this._rhTaskId = '';
      if (!this._rhCancelRequested) this._rhApiKey = '';
      ((this._rhCancelRequested = false),
        (this._rhCancelInFlight = false),
        (this._rhRemoteCancelSent = false),
        this._setGeneratingUi());
      if (!_0x4dbaad) stopLoading(this.previewEl);
    }
  }
  ['_renderRefBar']() {
    if (!this.refBarEl) return;
    const _0x22ffc1 = this._getCurrentWorkflow().key;
    this._refBarWorkflowKey !== _0x22ffc1 &&
      ((this._refBarWorkflowKey = _0x22ffc1),
      (this.refBarEl.innerHTML = ''),
      this.refBarEl.classList.remove('active', 'rh-v5-refbar'));
    const _0x183aad = getWorkflowAudioSlots(_0x22ffc1),
      _0x2f75a4 = createPromptAttachmentButtonHTML(),
      _0x304bc4 = appStore.getIncomingEdges(this.nodeId),
      _0x617681 = appStore.getState().nodes || {},
      _0x17d4a5 = {},
      _0x42f7e4 = { text: 0, image: 0, video: 0, audio: 0 },
      _0x15c239 = {
        text: aigenAudioText('assetTypes.text'),
        image: aigenAudioText('assetTypes.image'),
        video: aigenAudioText('assetTypes.video'),
        audio: aigenAudioText('assetTypes.audio'),
      },
      _0x4a9d27 = {};
    _0x183aad.forEach((_0x2ace81) => (_0x4a9d27[_0x2ace81.slot] = null));
    const _0x38391b = [..._0x183aad.map((_0x1ae889) => _0x1ae889.slot)],
      _0x536077 = [];
    for (const _0x5ab312 of _0x304bc4) {
      const _0x2bf371 = _0x617681[_0x5ab312.sourceId];
      if (!_0x2bf371) continue;
      const _0x446815 = String(_0x2bf371.type || '');
      let _0x42433a = 'image';
      if (_0x446815.includes('text')) _0x42433a = 'text';
      else {
        if (_0x446815.includes('video')) _0x42433a = 'video';
        else {
          if (_0x446815.includes('audio')) _0x42433a = 'audio';
        }
      }
      (_0x42f7e4[_0x42433a]++,
        (_0x17d4a5[_0x5ab312.sourceId] = '@' + _0x15c239[_0x42433a] + _0x42f7e4[_0x42433a]));
      if (_0x42433a === 'audio') _0x536077.push({ edge: _0x5ab312, src: _0x2bf371 });
    }
    for (const _0x45997d of _0x536077) {
      const { edge: _0x25bb8b, src: _0x26a968 } = _0x45997d;
      let _0x29693a = String(_0x25bb8b?.refSlot || '');
      if (!_0x4a9d27[_0x29693a]) {
        if (!_0x38391b.includes(_0x29693a)) _0x29693a = '';
      }
      !_0x29693a && (_0x29693a = _0x38391b.find((_0x21107c) => !_0x4a9d27[_0x21107c]) || '');
      if (!_0x29693a || _0x4a9d27[_0x29693a]) continue;
      const _0xc4334d = [
          String(_0x26a968?.thumbUrl || '').trim(),
          String(_0x26a968?.imageUrl || '').trim(),
          String(_0x26a968?.src || '').trim(),
          toLocalAssetUrl(_0x26a968?.localPath),
          String(_0x26a968?.audioUrl || '').trim(),
        ].filter(Boolean),
        _0x3a6070 = _0xc4334d.find((_0x1226b2) => isLikelyImageUrl(_0x1226b2)) || '';
      if (_0x3a6070) ensureThumbDecoded(_0x3a6070);
      const _0x37018f =
        _0x29693a + '|' + _0x25bb8b.id + '|' + _0x25bb8b.sourceId + '|' + (_0x3a6070 || 'audio-fallback');
      _0x4a9d27[_0x29693a] = {
        edgeId: _0x25bb8b.id,
        sourceId: _0x25bb8b.sourceId,
        sig: _0x37018f,
        html: _0x3a6070
          ? '<img src="' + _0x3a6070 + '" class="ref-thumb-media is-pending" draggable="false">'
          : createReferenceFallbackThumbHtml('audio'),
      };
    }
    const _0x38c491 = _0x617681?.[this.nodeId] || this._data || {};
    (getAssetInputRefsFromPromptAndNode(this.promptEl, {
      nodeData: _0x38c491,
      allowedTypes: ['audio'],
    }).forEach((_0x29c13b) => {
      const _0x30e325 = _0x38391b.find((_0x266fa4) => !_0x4a9d27[_0x266fa4]) || '';
      if (!_0x30e325 || !_0x29c13b.url) return;
      const _0x147533 = [
          String(_0x29c13b?.thumbUrl || '').trim(),
          String(_0x29c13b?.nodeData?.thumbUrl || '').trim(),
          String(_0x29c13b?.nodeData?.imageUrl || '').trim(),
          String(_0x29c13b?.nodeData?.src || '').trim(),
          toLocalAssetUrl(_0x29c13b?.nodeData?.localPath),
        ].filter(Boolean),
        _0x4ef5b4 = _0x147533.find((_0x59d245) => isLikelyImageUrl(_0x59d245)) || '';
      if (_0x4ef5b4) ensureThumbDecoded(_0x4ef5b4);
      const _0x1f8fe8 = String(_0x29c13b.assetId || ''),
        _0x10be65 = String(_0x29c13b.itemIndex ?? ''),
        _0x3e1414 = String(_0x29c13b.assetMentionOccurrence ?? ''),
        _0x4d7620 = String(_0x29c13b.assetRefSource || 'prompt'),
        _0x1b112d =
          _0x30e325 +
          '|asset:' +
          _0x1f8fe8 +
          ':' +
          _0x10be65 +
          ':' +
          _0x3e1414 +
          '|' +
          (_0x4ef5b4 || 'audio-fallback');
      _0x4a9d27[_0x30e325] = {
        edgeId: '',
        sourceId: 'asset:' + _0x1f8fe8 + ':' + _0x10be65,
        sig: _0x1b112d,
        html: _0x4ef5b4
          ? '<img src="' + _0x4ef5b4 + '" class="ref-thumb-media is-pending" draggable="false">'
          : createReferenceFallbackThumbHtml('audio'),
        virtual: true,
        assetId: _0x1f8fe8,
        assetIndex: _0x10be65,
        assetOccurrence: _0x3e1414,
        assetRefSource: _0x4d7620,
        refType: 'audio',
      };
    }),
      this.refBarEl.classList.add('active', 'rh-v5-refbar'));
    let _0x192b19 = this.refBarEl.querySelector('.rh-v5-ref-container');
    const _0x371e45 =
      !_0x192b19 ||
      !this.refBarEl.querySelector('.prompt-attachment-btn') ||
      _0x192b19.querySelectorAll('[data-slot]').length !== _0x183aad.length;
    _0x371e45 &&
      ((this.refBarEl.innerHTML =
        _0x2f75a4 +
        ' <div class="ref-thumb-container rh-v5-ref-container" aria-label="' +
        aigenAudioText('refs.inputAria') +
        '">\n        ' +
        _0x183aad
          .map(
            (_0x13d91b) =>
              '<button type="button" class="ref-thumb-wrap ref-upload-slot rh-v5-ref-box" data-slot="' +
              _0x13d91b.slot +
              '" title="' +
              aigenAudioText('refs.connectAudio') +
              '"><span class="ref-upload-label">' +
              _0x13d91b.label +
              '</span></button>',
          )
          .join('') +
        '\n      </div>'),
      (_0x192b19 = this.refBarEl.querySelector('.rh-v5-ref-container')));
    const _0x3710a0 = (_0x4e743b, _0x3a5420, _0x3530c0) => {
      if (!_0x192b19) return;
      const _0x29f03b = _0x192b19.querySelector('[data-slot="' + _0x4e743b + '"]');
      if (!_0x3a5420) {
        if (_0x29f03b && _0x29f03b.tagName === 'BUTTON' && _0x29f03b.classList.contains('ref-upload-slot'))
          return;
        const _0x346d5d = document.createElement('button');
        ((_0x346d5d.type = 'button'),
          (_0x346d5d.className = 'ref-thumb-wrap ref-upload-slot rh-v5-ref-box'),
          (_0x346d5d.dataset.slot = _0x4e743b),
          (_0x346d5d.title = aigenAudioText('refs.connectAudio')));
        const _0x30747e = document.createElement('span');
        ((_0x30747e.className = 'ref-upload-label'),
          (_0x30747e.textContent = _0x3530c0),
          _0x346d5d.appendChild(_0x30747e));
        if (_0x29f03b) _0x29f03b.replaceWith(_0x346d5d);
        else _0x192b19.appendChild(_0x346d5d);
        return;
      }
      const _0x4fda03 = document.createElement('div');
      ((_0x4fda03.className =
        'ref-thumb-wrap rh-v5-ref-box' + (_0x3a5420.virtual ? ' ref-thumb-wrap--asset' : '')),
        _0x4fda03.setAttribute('draggable', _0x3a5420.virtual ? 'false' : 'true'),
        (_0x4fda03.dataset.slot = _0x4e743b),
        (_0x4fda03.dataset.edgeId = _0x3a5420.edgeId),
        (_0x4fda03.dataset.sourceId = _0x3a5420.sourceId),
        (_0x4fda03.dataset.sig = _0x3a5420.sig),
        (_0x4fda03.dataset.refOrigin = _0x3a5420.virtual ? 'asset' : 'node'));
      _0x3a5420.virtual &&
        ((_0x4fda03.dataset.assetId = _0x3a5420.assetId || ''),
        (_0x4fda03.dataset.assetIndex = _0x3a5420.assetIndex || ''),
        (_0x4fda03.dataset.assetOccurrence = _0x3a5420.assetOccurrence || ''),
        (_0x4fda03.dataset.assetRefSource = _0x3a5420.assetRefSource || 'prompt'),
        (_0x4fda03.dataset.refType = _0x3a5420.refType || 'audio'));
      ((_0x4fda03.innerHTML =
        _0x3a5420.html +
        '<button type="button" class="ref-thumb-delete" title="' +
        aigenAudioText('refs.remove') +
        '">&times;</button>'),
        revealRefThumbMedia(_0x4fda03, _0x3a5420.sig));
      if (_0x29f03b) _0x29f03b.replaceWith(_0x4fda03);
      else _0x192b19.appendChild(_0x4fda03);
    };
    (_0x183aad.forEach((_0x440dd3) => _0x3710a0(_0x440dd3.slot, _0x4a9d27[_0x440dd3.slot], _0x440dd3.label)),
      bindRefThumbFixedSlotDrag({
        owner: this,
        container: _0x192b19,
        store: appStore,
        nodeId: this.nodeId,
        acceptMap: Object.fromEntries(_0x183aad.map((_0x508bfc) => [_0x508bfc.slot, 'audio'])),
      }),
      (this._attachBtnIcon = this.refBarEl?.querySelector('.prompt-attachment-btn .btn-icon') || null),
      this._syncPickConnectVisualState(),
      _syncPillLabels(this, _0x17d4a5));
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
