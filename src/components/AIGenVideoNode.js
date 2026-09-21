import appStore from '../core/stores/appStore.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import { fetchVideoMetaFromServer } from '../../api/videoMetaApi.js';
import {
  buildGenerateVideoRequest,
  cancelRunningHubVideoTask,
  generateVideo,
  resumeAsyncVideoTask,
  resumeDreaminaVideoTask,
  resumeRunningHubVideoTask,
} from '../../api/aiVideoApi.js';
import { getDisplayModelName, PROVIDERS_META } from '../modules/providers.js';
import {
  _handlePillHover,
  _handlePillOut,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  _checkAtTrigger,
  _populateMentionMenu,
  _insertMentionPill,
  _rehydratePromptPills,
  _handlePillKeyboard,
  _handleMentionMenuKeyboard,
  _getMentionMenu,
  _closeMentionMenu,
  flushPromptHtmlCommit,
  handlePromptPaste,
  handlePromptSelectAll,
  handleRefThumbDeleteClick,
  schedulePromptHtmlCommit,
  shouldSubmitPromptByKeyboard,
} from '../modules/nodePromptShared.js';
import { VIDEO_TOOLBAR_HTML, bindVideoToolbarEvents, showDevToast } from './NodeToolbarConfig.js';
import { getImage } from '../modules/storage.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import { bindRefThumbHoverPreview } from '../modules/refThumbHoverPreview.js';
import { ensureThumbDecoded, revealRefThumbMedia } from '../modules/refThumbMediaReveal.js';
import {
  getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide,
  buildSourceMediaNodePayload,
} from '../services/fileService.js';
import { buildApiUrl } from '../../api/apiBase.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { saveOutputBlob, uploadFile } from '../modules/project.js';
import { getNodeSpawnPrefs, calcSafeSpawnPosNearNode } from '../modules/nodeSpawn.js';
import {
  VIDEO_VIP_MODEL_IDS,
  isVipModel,
  getVipModelDisplayName,
  resolveVipGateModelId,
} from '../modules/subscriptionAccess.js';
import VideoKeyingController from '../modules/VideoKeyingController.js';
import { generateId, findAvailablePosition } from '../core/math.js';
import { getDisplayedMediaSizeFromNode, sanitizePromptHtml } from '../utils/dom.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation, closeSlashMenu } from '../modules/slashMenu.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import { stopPreviewNodeLoading, syncPreviewNodeLoading } from '../modules/previewMode.js';
import { isTaskTerminal, shouldShowGenerationBusyUi } from '../core/generationTaskUiState.js';
import { hasDisplayableVideoResult } from '../core/rendererNodeResultState.js';
import { videoUiRenderMixin } from './aigenVideo/uiRenderMixin.js';
import { videoStateSyncMixin } from './aigenVideo/stateSyncMixin.js';
import { videoTaskOrchestrationMixin } from './aigenVideo/taskOrchestrationMixin.js';
import { createVideoNodeReferenceInputModule } from './video-node/referenceInputModule.js';
import { subscribeAssetMentionRegistry } from '../modules/assetMentionRegistry.js';
import { removeCoveredAssetInputRefForConnection } from '../modules/promptAssetInputOverride.js';
import { localPathToUrl, pickResultLocalPath, urlToLocalPath } from '../utils/localMediaPath.js';
import {
  createGenerationNodeHelpTipController,
  getGenerationNodeHelpTooltip,
} from './generationNodeHelpTip.js';
import { hasModelUiSchema, syncModelUiSchemaControls } from './aigenImage/uiSchemaRenderer.js';
import {
  createVideoNodeParameterPanelModule,
  shouldShowVideoPromptInput,
} from './video-node/parameterPanelModule.js';
import {
  hasRunningHubVideoWorkflowUiField,
  hasRunningHubVideoWorkflowUiPlacement,
} from './video-node/runningHubVideoUiSchema.js';
import { createVideoNodeTaskOrchestrationModule } from './video-node/taskOrchestrationModule.js';
import { createVideoNodeResultRenderModule } from './video-node/resultRenderModule.js';
import { createVideoNodePreviewControlsModule } from './video-node/previewControlsModule.js';
import { resolveVideoMutedPreference } from './video-node/videoMuteState.js';
import { setupPromptBoxResize, syncPromptBoxSizeFromData } from './promptBoxResizeUi.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { createPromptAttachmentButtonHTML } from './refAttachmentButton.js';
import { getFixedInputSlotConfigFromManifest } from '../modules/fixedInputAssetRefs.js';
import { shouldDeferRendererMediaOnMount } from '../core/rendererDeferredMedia.js';
import { buildRunningHubVideoFixedSlotSummaryPatch } from './video-node/runningHubVideoSubmitPayload.js';
import {
  buildVideoFixedSlotEntriesForSummary,
  getFixedInputAcceptForKind,
  getFixedInputSlotKind,
  getFixedInputSlotsToReplace,
} from './video-node/fixedInputSlotHelpers.js';
const VIDEO_VIP_MODEL_ID_SET = new Set(VIDEO_VIP_MODEL_IDS),
  VIDEO_VIP_MODEL_NAME_MAP = VIDEO_VIP_MODEL_IDS.reduce((_0x45bbfb, _0x46801b) => {
    return ((_0x45bbfb[_0x46801b] = getVipModelDisplayName(_0x46801b)), _0x45bbfb);
  }, {});
let _vipSessionRecheckDone = false;
const AI_VIDEO_MIN_SIZE = 150,
  api = {
    buildGenerateVideoRequest: buildGenerateVideoRequest,
    cancelRunningHubWorkflowTask: cancelRunningHubVideoTask,
    fetchVideoFirstFrameThumbFromServer: fetchVideoFirstFrameThumbFromServer,
    fetchVideoMetaFromServer: fetchVideoMetaFromServer,
    generateVideo: generateVideo,
    resumeAsyncVideoTask: resumeAsyncVideoTask,
    resumeDreaminaVideoTask: resumeDreaminaVideoTask,
    resumeRunningHubVideoTask: resumeRunningHubVideoTask,
  };
function aigenVideoNodeText(_0x21df0f, _0x1cee6d = {}) {
  return t('aigenVideoNode.' + _0x21df0f, _0x1cee6d);
}
function getVideoAdaptiveRatioLabel() {
  return aigenVideoNodeText('ratio.adaptive');
}
function formatVideoNodeRatioResolutionLabel(_0x2bd5b3 = {}) {
  const _0x2f949c = String(_0x2bd5b3?.aspectRatio || '').trim(),
    _0x4b0e29 =
      !_0x2f949c || _0x2f949c === '自适应' || _0x2f949c === 'auto' || _0x2f949c === 'adaptive'
        ? getVideoAdaptiveRatioLabel()
        : _0x2f949c;
  return _0x4b0e29 + ' · ' + (_0x2bd5b3?.resolution || '1080p');
}
function readStoreState() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function isTerminalGenerationUiState(_0x2bf324) {
  return isTaskTerminal(_0x2bf324);
}
function isVideoVipModel(_0x2c221e, _0x182a17 = '') {
  return isVipModel(_0x2c221e, _0x182a17);
}
function getVideoVipModelName(_0x1bd2d0, _0x253154 = '') {
  const _0x3b2607 = resolveVipGateModelId(_0x1bd2d0, _0x253154);
  return VIDEO_VIP_MODEL_NAME_MAP[_0x3b2607] || _0x3b2607 || aigenVideoNodeText('vip.modelFallback');
}
async function ensureVipSessionRecheck(_0x22be24, _0x57c806 = '') {
  if (!isVideoVipModel(_0x22be24, _0x57c806)) return;
  if (_vipSessionRecheckDone) return;
  _vipSessionRecheckDone = true;
  if (typeof window.refreshSubscriptionState === 'function')
    try {
      await window.refreshSubscriptionState();
    } catch {}
}
const VIDEO_NODE_MODULE_DEPS = {
  store: appStore,
  api: api,
  getDisplayModelName: getDisplayModelName,
  PROVIDERS_META: PROVIDERS_META,
  _handlePillHover: _handlePillHover,
  _handlePillOut: _handlePillOut,
  _syncEdgesOrderFromPills: _syncEdgesOrderFromPills,
  _syncPillLabels: _syncPillLabels,
  _getMentionMenu: _getMentionMenu,
  _closeMentionMenu: _closeMentionMenu,
  VIDEO_TOOLBAR_HTML: VIDEO_TOOLBAR_HTML,
  bindVideoToolbarEvents: bindVideoToolbarEvents,
  showDevToast: showDevToast,
  getImage: getImage,
  startLoading: startLoading,
  stopLoading: stopLoading,
  bindRefThumbHoverPreview: bindRefThumbHoverPreview,
  ensureThumbDecoded: ensureThumbDecoded,
  revealRefThumbMedia: revealRefThumbMedia,
  buildApiUrl: buildApiUrl,
  ensureConfig: ensureConfig,
  getProviderConfig: getProviderConfig,
  saveOutputBlob: saveOutputBlob,
  uploadFile: uploadFile,
  getNodeSpawnPrefs: getNodeSpawnPrefs,
  getAIGenerationNodeSize: getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
  buildSourceMediaNodePayload: buildSourceMediaNodePayload,
  calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
  VideoKeyingController: VideoKeyingController,
  generateId: generateId,
  findAvailablePosition: findAvailablePosition,
  getDisplayedMediaSizeFromNode: getDisplayedMediaSizeFromNode,
  checkSlashTrigger: checkSlashTrigger,
  handleSlashKeyboardNavigation: handleSlashKeyboardNavigation,
  closeSlashMenu: closeSlashMenu,
  activateMenuKeyboard: activateMenuKeyboard,
  isVideoVipModel: isVideoVipModel,
  getVideoVipModelName: getVideoVipModelName,
  ensureVipSessionRecheck: ensureVipSessionRecheck,
  VIDEO_VIP_MODEL_IDS: VIDEO_VIP_MODEL_IDS,
  VIDEO_VIP_MODEL_ID_SET: VIDEO_VIP_MODEL_ID_SET,
  VIDEO_VIP_MODEL_NAME_MAP: VIDEO_VIP_MODEL_NAME_MAP,
};
export class AIGenVideoNode {
  constructor(_0x433a02) {
    ((this._data = _0x433a02),
      (this.nodeId = _0x433a02.id),
      (this.previewEl = null),
      (this.videoEl = null),
      (this.refBarEl = null),
      (this.promptEl = null),
      (this.btnEl = null),
      (this.footerEl = null),
      (this._promptPanel = null),
      (this._promptInputWrap = null),
      (this._promptResizeHandle = null),
      (this._isPromptBoxResizing = false),
      (this._promptResizeCleanup = null),
      (this._qualityBtns = []),
      (this._attachBtnIcon = null),
      (this._lastImgKey = null),
      (this._lastFooterSig = null),
      (this._lastEdgeSig = null),
      (this._lastRefModeSig = ''),
      (this._docClickBound = false),
      (this._v5RefUploadInput = null),
      (this._v5RefUploadSlot = ''),
      (this._v5RefUploadAnchorNodeId = ''),
      (this._fixedSlotRefThumbObjectUrls = new Map()),
      (this._ltxRefUploadInput = null),
      (this._ltxRefUploadSlot = ''),
      (this._ltxRefUploadAnchorNodeId = ''),
      (this._adaptiveSrcRetryToken = 0),
      (this._refThumbObjectUrls = new Map()),
      (this._lastSpecialModeSig = ''),
      (this._lastSubtractSubjectSig = ''),
      (this._renderRefBarLock = null),
      (this._renderRefBarPending = false),
      (this._ratioAnimTimer = null),
      (this._ratioFlipAnim = null),
      (this._rhAbortController = null),
      (this._rhTaskId = null),
      (this._rhApiKey = null),
      (this._rhCancelRequested = false),
      (this._rhResumeAbortController = null),
      (this._rhResumeTaskId = ''),
      (this._rhResumePromise = null),
      (this._asyncResumeAbortController = null),
      (this._asyncResumeTaskId = ''),
      (this._asyncResumePromise = null),
      (this._statusOverlayEl = null),
      (this._lastAdaptiveEdgeSig = null),
      (this._lastVideoViewSig = null),
      (this._lastHasInputConnections = null),
      (this._multiStackWrap = null),
      (this._multiLayerEls = []),
      (this._multiErrorEls = []),
      (this._multiToggleBtn = null),
      (this._multiVideosContainer = null),
      (this._cachedVideoUrls = new Map()),
      (this._lastVideosKeyStr = null),
      (this._lastMainIdx = null),
      (this._lastIsExpanded = null),
      (this._expandPanel = null),
      (this._isMuted = resolveVideoMutedPreference(_0x433a02)),
      (this._videoClickTimer = null),
      (this._muteBtnEl = null),
      (this._muteIconMutedEl = null),
      (this._muteIconUnmutedEl = null),
      (this._centerIndicatorEl = null),
      (this._centerIndicatorInnerEl = null),
      (this._centerIndicatorTimer = null),
      (this._controlsEl = null),
      (this._playBtnEl = null),
      (this._timeCurrentEl = null),
      (this._timeTotalEl = null),
      (this._progressBarEl = null),
      (this._progressFillEl = null),
      (this._snapBtnEl = null),
      (this._isProgressSeeking = false),
      (this._isProgressDragging = false),
      (this._progressSeekToken = 0),
      (this._isManualControl = false),
      (this._isHovered = false),
      (this._hoverManualPause = false),
      (this._isManualLoopPlayback = false),
      (this._autoPlayToken = 0),
      (this._metaFetchToken = 0),
      (this._videoThumbPending = new Set()),
      (this._blobResolveToken = 0),
      (this._resultThumbToken = 0),
      (this._isExpandedPickClosing = false),
      (this._vipSelectionRetryInProgress = false),
      (this._assetMentionRegistryUnsubscribe = null),
      (this._assetMentionRegistryRefreshPending = false),
      (this._generationNodeHelpTip = null),
      (this._uiSchemaCleanup = null),
      (this._footerControllerCleanup = null),
      (this._videoSubmitInFlight = false),
      (this._unsubscribeLocale = null),
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(_0x433a02)),
      (this._renderRefBarPendingWhenVisible = false),
      (this._deferredVideoViewRefreshPending = false));
  }
  get ['isNoResult']() {
    return !hasDisplayableVideoResult(this._data);
  }
  ['_syncNoResultClass']() {
    if (!this._root?.classList) return;
    this.isNoResult ? this._root.classList.add('no-result') : this._root.classList.remove('no-result');
  }
  ['_syncLocaleTexts']() {
    (this.promptEl && (this.promptEl.dataset.placeholder = aigenVideoNodeText('prompt.placeholder')),
      this._promptPanel
        ?.querySelector('.generation-node-help-tip')
        ?.setAttribute('aria-label', aigenVideoNodeText('help.ariaLabel')));
  }
  ['_deferVideoMediaRefresh']() {
    this._deferredVideoViewRefreshPending = true;
    if (this._placeholderEl) this._placeholderEl.style.display = 'flex';
    this._setVideoOverlaysVisible?.(false);
  }
  ['_loadVideoWhenMediaReady']() {
    if (this._rendererMediaDeferred === true) this._deferVideoMediaRefresh();
    else this._loadAndDisplayVideo();
  }
  ['_renderRefBarWhenMediaReady']() {
    if (this._rendererMediaDeferred === true) this._renderRefBarPendingWhenVisible = true;
    else this._renderRefBar();
  }
  ['mount']() {
    typeof this._normalizeDreaminaNodeData === 'function' &&
      (this._data = this._normalizeDreaminaNodeData(this._data, { syncStore: true }) || this._data);
    const _0xae78be = document.createElement('div');
    if (this.isNoResult) _0xae78be.classList.add('no-result');
    ((this._root = _0xae78be),
      Object.assign(_0xae78be.style, {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        pointerEvents: 'auto',
        cursor: 'default',
      }),
      _0xae78be.style.setProperty('overflow', 'visible', 'important'),
      (_0xae78be.innerHTML = VIDEO_TOOLBAR_HTML),
      (this.previewEl = document.createElement('div')),
      (this.previewEl.className = 'img-node-preview'),
      Object.assign(this.previewEl.style, {
        background: 'var(--white-05)',
        border: '1px solid var(--stroke-10)',
        borderRadius: '18px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        transition: 'none',
      }),
      this.previewEl.style.setProperty('width', '100%', 'important'),
      this.previewEl.style.setProperty('height', '100%', 'important'),
      this.previewEl.style.setProperty('min-height', '260px', 'important'));
    const _0x3fec68 = document.createElement('div');
    ((_0x3fec68.className = 'img-node-placeholder'),
      Object.assign(_0x3fec68.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        userSelect: 'none',
      }),
      (_0x3fec68.innerHTML =
        '\n            <svg class="placeholder-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="transition:all 0.2s;">\n                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>\n            </svg>'),
      this.previewEl.appendChild(_0x3fec68),
      (this._placeholderEl = _0x3fec68),
      syncPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions?.()),
      this._ensurePreviewVideoOverlays(),
      _0xae78be.appendChild(this.previewEl));
    const _0x3edce8 = document.createElement('div');
    ((_0x3edce8.className = 'node-resizer'),
      _0xae78be.appendChild(_0x3edce8),
      this._loadVideoWhenMediaReady());
    typeof this._maybeResumeDreaminaTaskImpl === 'function' &&
      queueMicrotask(() => {
        appStore.getState().nodes?.[this.nodeId] && this._maybeResumeDreaminaTaskImpl();
      });
    typeof this._maybeResumeRunningHubTaskImpl === 'function' &&
      queueMicrotask(() => {
        appStore.getState().nodes?.[this.nodeId] && this._maybeResumeRunningHubTaskImpl();
      });
    typeof this._maybeResumeAsyncTaskImpl === 'function' &&
      queueMicrotask(() => {
        appStore.getState().nodes?.[this.nodeId] && this._maybeResumeAsyncTaskImpl();
      });
    (this.previewEl.addEventListener('mouseenter', () => {
      const _0x5a4e12 = appStore.getState().videoClip;
      if (_0x5a4e12 && _0x5a4e12.active && _0x5a4e12.nodeId === this.nodeId) return;
      const _0x5e9897 = appStore.getState().nodes[this.nodeId] || this._data || {};
      if (_0x5e9897.isVideosExpanded) return;
      const _0xd09a0e = this._getActivePreviewVideoEl();
      if (!_0xd09a0e) return;
      this._isHovered = true;
      if (VideoKeyingController.isActiveFor(this.nodeId)) {
        _0xd09a0e.pause();
        return;
      }
      if (this._hoverManualPause) return;
      if (this._isManualLoopPlayback) return;
      _0xd09a0e.loop = true;
      const _0x5090bc = ++this._autoPlayToken;
      typeof this._logPreviewVideoPlaybackEvent === 'function' &&
        this._logPreviewVideoPlaybackEvent(_0xd09a0e, 'hover-enter', 'hover');
      const _0x49ed21 = () => {
        if (typeof this._playPreviewVideoWithRecovery === 'function') {
          void this._playPreviewVideoWithRecovery(_0xd09a0e, {
            reason: 'hover',
            shouldContinue: () => this._autoPlayToken === _0x5090bc && !this._hoverManualPause,
          });
          return;
        }
        if (this._autoPlayToken !== _0x5090bc) {
          _0xd09a0e.pause();
          return;
        }
        const _0x14068c = _0xd09a0e.play();
        if (_0x14068c && typeof _0x14068c.catch === 'function') _0x14068c.catch(() => {});
      };
      _0x49ed21();
    }),
      this.previewEl.addEventListener('mouseleave', () => {
        const _0x3ec3f8 = appStore.getState().videoClip;
        if (_0x3ec3f8 && _0x3ec3f8.active && _0x3ec3f8.nodeId === this.nodeId) return;
        const _0x4e0b22 = appStore.getState().nodes[this.nodeId] || this._data || {};
        if (_0x4e0b22.isVideosExpanded) return;
        const _0x3484f8 = this._getActivePreviewVideoEl();
        if (!_0x3484f8) return;
        const _0x273aa3 = this._isManualControl;
        ((this._isHovered = false), this._autoPlayToken++);
        if (!this._isManualLoopPlayback) _0x3484f8.loop = false;
        typeof this._logPreviewVideoPlaybackEvent === 'function' &&
          this._logPreviewVideoPlaybackEvent(_0x3484f8, 'hover-leave', 'hover');
        if (!_0x273aa3) _0x3484f8.pause();
        this._hoverManualPause = false;
        if (!this._isManualLoopPlayback) this._isManualControl = false;
      }));
    const _0x2ca7b6 = document.createElement('div');
    ((_0x2ca7b6.className = 'text-prompt-panel'),
      (this._promptPanel = _0x2ca7b6),
      _0x2ca7b6.addEventListener('pointerdown', (_0x4700f5) => {
        _0x4700f5.stopPropagation();
      }),
      (this.refBarEl = document.createElement('div')),
      (this.refBarEl.className = 'node-ref-bar'),
      (this.refBarEl.innerHTML = createPromptAttachmentButtonHTML({ stroke: 'var(--white-90)' })),
      _0x2ca7b6.appendChild(this.refBarEl),
      this.refBarEl.addEventListener('pointerdown', (_0x13786f) => {
        if (_0x13786f.target.closest('.prompt-attachment-btn, .ref-thumb-wrap, .ref-thumb-delete'))
          _0x13786f.stopPropagation();
      }),
      this.refBarEl.addEventListener('click', (_0x565740) => {
        if (handleRefThumbDeleteClick(this, _0x565740)) return;
        const _0x40b541 = _0x565740.target.closest('.prompt-attachment-btn');
        if (!_0x40b541) return;
        (_0x565740.stopPropagation(), _0x565740.preventDefault());
        const _0x538d6d = appStore.getState().pickConnectMode;
        _0x538d6d?.active && _0x538d6d.sourceNodeId === this.nodeId
          ? appStore.setPickConnectMode({ active: false })
          : appStore.setPickConnectMode({ active: true, sourceNodeId: this.nodeId, handleDirection: 'left' });
      }),
      (this._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(this.refBarEl)),
      (this._v5RefUploadInput = document.createElement('input')),
      (this._v5RefUploadInput.type = 'file'),
      (this._v5RefUploadInput.accept = '*/*'),
      (this._v5RefUploadInput.style.display = 'none'),
      _0x2ca7b6.appendChild(this._v5RefUploadInput),
      this._v5RefUploadInput.addEventListener('change', async (_0x160069) => {
        const _0x34828 = _0x160069.target.files?.[0],
          _0x39dccc = this._v5RefUploadSlot,
          _0x1f5319 = this._v5RefUploadAnchorNodeId;
        if (!_0x34828 || !_0x39dccc || !_0x1f5319) {
          this._v5RefUploadInput.value = '';
          return;
        }
        try {
          const _0x432454 = window.currentProjectId || 'default_v2_project',
            _0x4de589 = await uploadFile(_0x34828, _0x432454),
            _0x5c6de7 = _0x4de589?.url || '';
          if (!_0x5c6de7) throw new Error(aigenVideoNodeText('upload.noFileUrl'));
          const _0x1db463 = appStore.getState(),
            _0xa25546 = _0x1db463.nodes?.[_0x1f5319];
          if (!_0xa25546) throw new Error(aigenVideoNodeText('upload.anchorMissing'));
          const _0x8b4f80 = pickResultLocalPath(_0x4de589) || urlToLocalPath(_0x5c6de7),
            _0x36d3f7 = getFixedInputSlotKind(_0xa25546, _0x39dccc),
            _0x4bbc9c = _0x36d3f7 === 'video',
            _0x4b09e8 = _0x36d3f7 === 'image';
          if (_0x4bbc9c && !_0x34828.type.startsWith('video/'))
            throw new Error(aigenVideoNodeText('upload.videoOnly'));
          if (_0x4b09e8 && !_0x34828.type.startsWith('image/'))
            throw new Error(aigenVideoNodeText('upload.imageOnly'));
          if (!_0x4bbc9c && !_0x4b09e8) throw new Error(aigenVideoNodeText('upload.unsupportedAsset'));
          const _0x36148f = _0x4bbc9c ? 'source-video' : 'source-image';
          let _0x3dec0f = 0x12c,
            _0x11b1aa = 0x12c;
          if (_0x4bbc9c) {
            const _0x33d342 = document.createElement('video');
            ((_0x33d342.src = URL.createObjectURL(_0x34828)),
              await new Promise((_0x543244) => {
                ((_0x33d342.onloadedmetadata = () => {
                  const _0x2f8606 = _0x33d342.videoWidth || 0x1a4,
                    _0xf213f2 = _0x33d342.videoHeight || 0x104,
                    _0x591197 = Math.min(_0x2f8606, _0xf213f2),
                    _0x4e777b = 0x12c / (_0x591197 || 1);
                  ((_0x3dec0f = Math.round(_0x2f8606 * _0x4e777b)),
                    (_0x11b1aa = Math.round(_0xf213f2 * _0x4e777b)),
                    URL.revokeObjectURL(_0x33d342.src),
                    _0x543244());
                }),
                  (_0x33d342.onerror = () => {
                    (URL.revokeObjectURL(_0x33d342.src), _0x543244());
                  }));
              }));
          } else {
            if (_0x4b09e8) {
              const _0x38548c = new Image();
              await new Promise((_0x55f2cb) => {
                ((_0x38548c.onload = () => {
                  const _0x35924f = _0x38548c.naturalWidth || 0x104,
                    _0x3e419d = _0x38548c.naturalHeight || 0x104,
                    _0x4e07a0 = Math.min(_0x35924f, _0x3e419d),
                    _0x19324e = 0x12c / (_0x4e07a0 || 1);
                  ((_0x3dec0f = Math.round(_0x35924f * _0x19324e)),
                    (_0x11b1aa = Math.round(_0x3e419d * _0x19324e)),
                    _0x55f2cb());
                }),
                  (_0x38548c.onerror = () => {
                    _0x55f2cb();
                  }),
                  (_0x38548c.src = _0x5c6de7));
              });
            }
          }
          const { spacing: _0x296ab7, direction: _0x4dc2cd, avoidOverlap: _0x5e245d } = getNodeSpawnPrefs(),
            _0x5615cc = _0x4dc2cd === 'down' ? 'down' : 'left',
            _0x2aad94 = Number(_0xa25546.x) || 0,
            _0x457abf = Number(_0xa25546.y) || 0,
            _0x268f60 = Number(_0xa25546.width) || 0x168,
            _0x22fb9d = Number(_0xa25546.height) || 0x168,
            _0x372f35 = _0x2aad94 - _0x296ab7 - _0x3dec0f,
            _0x4a1db3 =
              _0x5615cc === 'down'
                ? _0x457abf + _0x22fb9d + _0x296ab7
                : _0x457abf + Math.round((_0x22fb9d - _0x11b1aa) / 2),
            _0x22a064 = _0x5e245d
              ? findAvailablePosition(
                  _0x1db463.nodes || {},
                  _0x372f35,
                  _0x4a1db3,
                  _0x3dec0f,
                  _0x11b1aa,
                  _0x296ab7,
                  _0x5615cc,
                )
              : { x: _0x372f35, y: _0x4a1db3 },
            _0x225f74 = getFixedInputSlotsToReplace(_0xa25546, _0x39dccc);
          (appStore.batch(() => {
            const _0x2aebf8 = appStore.getIncomingEdges(this.nodeId);
            for (const _0x4f8a60 of _0x2aebf8) {
              if (_0x225f74.has(String(_0x4f8a60?.refSlot || ''))) appStore.removeEdge(_0x4f8a60.id);
            }
            const _0x39409b = generateId('node'),
              _0x4f0b0c = {
                id: _0x39409b,
                type: _0x36148f,
                x: _0x22a064.x,
                y: _0x22a064.y,
                width: _0x3dec0f,
                height: _0x11b1aa,
                src: _0x5c6de7,
                localPath: _0x8b4f80,
                assetId: _0x4de589.assetId || '',
                originalLocalPath: _0x4de589.originalLocalPath || _0x4de589.localPath || '',
                posterLocalPath: _0x4de589.posterLocalPath || '',
                waveformLocalPath: _0x4de589.waveformLocalPath || '',
                derivativeStatus: _0x4de589.derivativeStatus || _0x4de589.status || '',
                mediaTaskId: _0x4de589.mediaTaskId || '',
                mediaTaskKind: _0x4de589.mediaTaskKind || '',
                mediaTaskStatus: _0x4de589.mediaTaskStatus || '',
                mediaTaskProgress: Number(_0x4de589.mediaTaskProgress || 0) || 0,
                mediaTaskError: _0x4de589.mediaTaskError || '',
                fileName: _0x4de589.filename || _0x34828.name || '',
                thumbUrl: _0x4de589.posterUrl || _0x4de589.thumbUrl || null,
              };
            if (_0x4bbc9c)
              _0x4f0b0c.name =
                _0x34828.name ||
                (_0x39dccc === 'videoMask'
                  ? aigenVideoNodeText('inputNames.maskVideo')
                  : aigenVideoNodeText('inputNames.sourceVideo'));
            (removeCoveredAssetInputRefForConnection({
              targetId: this.nodeId,
              sourceKind: _0x4bbc9c ? 'video' : 'image',
              refSlot: _0x39dccc,
            }),
              appStore.addNode(_0x4f0b0c),
              appStore.addEdge({
                id: generateId('edge'),
                sourceId: _0x39409b,
                targetId: this.nodeId,
                refSlot: _0x39dccc,
              }),
              appStore.setSelectedNodes([this.nodeId]));
          }),
            this._updateSubmitButtonState());
          if (_0x4bbc9c)
            try {
              const _0x48d47b = localPathToUrl(_0x8b4f80),
                _0x449560 = await fetchVideoFirstFrameThumbFromServer(_0x48d47b),
                _0x10f6c3 = String(_0x449560?.url || '').trim();
              if (_0x10f6c3) {
                const _0x50046d = appStore.getState().nodes?.[newNodeId];
                if (_0x50046d)
                  appStore.updateNodeData(newNodeId, { thumbUrl: _0x10f6c3, videoThumbSrc: _0x48d47b });
              }
            } catch {}
          if (!_0x4bbc9c) {
          }
        } catch (_0x2a50ce) {
          window.showToast?.(_0x2a50ce?.message || aigenVideoNodeText('upload.failedRetry'), 'error');
        } finally {
          ((this._v5RefUploadInput.value = ''),
            (this._v5RefUploadSlot = ''),
            (this._v5RefUploadAnchorNodeId = ''));
        }
      }),
      (this._ltxRefUploadInput = document.createElement('input')),
      (this._ltxRefUploadInput.type = 'file'),
      (this._ltxRefUploadInput.accept = '*/*'),
      (this._ltxRefUploadInput.style.display = 'none'),
      _0x2ca7b6.appendChild(this._ltxRefUploadInput),
      this._ltxRefUploadInput.addEventListener('change', async (_0x29d789) => {
        const _0x3671d1 = _0x29d789.target.files?.[0],
          _0x565e3b = this._ltxRefUploadSlot,
          _0x4ee167 = this._ltxRefUploadAnchorNodeId;
        if (!_0x3671d1 || !_0x565e3b || !_0x4ee167) {
          this._ltxRefUploadInput.value = '';
          return;
        }
        try {
          const _0x4c55c0 = window.currentProjectId || 'default_v2_project',
            _0x384d89 = await uploadFile(_0x3671d1, _0x4c55c0),
            _0xafdc30 = _0x384d89?.url || '';
          if (!_0xafdc30) throw new Error(aigenVideoNodeText('upload.noFileUrl'));
          const _0x30ae7b = appStore.getState(),
            _0x563a48 = _0x30ae7b.nodes?.[_0x4ee167];
          if (!_0x563a48) throw new Error(aigenVideoNodeText('upload.anchorMissing'));
          const _0x5dd7b0 = pickResultLocalPath(_0x384d89) || urlToLocalPath(_0xafdc30),
            _0x219976 = getFixedInputSlotKind(_0x563a48, _0x565e3b),
            _0x176efd = _0x219976 === 'image',
            _0x397954 = _0x219976 === 'video',
            _0x26da31 = _0x219976 === 'audio';
          if (_0x176efd && !_0x3671d1.type.startsWith('image/'))
            throw new Error(aigenVideoNodeText('upload.imageOnly'));
          if (_0x397954 && !_0x3671d1.type.startsWith('video/'))
            throw new Error(aigenVideoNodeText('upload.videoOnly'));
          if (_0x26da31 && !_0x3671d1.type.startsWith('audio/'))
            throw new Error(aigenVideoNodeText('upload.audioOnly'));
          if (!_0x176efd && !_0x397954 && !_0x26da31)
            throw new Error(aigenVideoNodeText('upload.unsupportedAsset'));
          const _0x577940 = _0x26da31 ? 'source-audio' : _0x397954 ? 'source-video' : 'source-image';
          let _0x583ca4 = _0x26da31 ? 0x140 : _0x397954 ? 0x168 : 0x12c,
            _0x738f96 = _0x26da31 ? 140 : _0x397954 ? 220 : 0x12c;
          if (_0x176efd) {
            const _0x1b3104 = new Image();
            await new Promise((_0x2ad5d6) => {
              ((_0x1b3104.onload = () => {
                const _0x2c4862 = _0x1b3104.naturalWidth || 0x104,
                  _0x305164 = _0x1b3104.naturalHeight || 0x104,
                  _0x382353 = Math.min(_0x2c4862, _0x305164),
                  _0x4722c7 = 0x12c / (_0x382353 || 1);
                ((_0x583ca4 = Math.round(_0x2c4862 * _0x4722c7)),
                  (_0x738f96 = Math.round(_0x305164 * _0x4722c7)),
                  _0x2ad5d6());
              }),
                (_0x1b3104.onerror = () => _0x2ad5d6()),
                (_0x1b3104.src = _0xafdc30));
            });
          }
          const { spacing: _0x6d749, direction: _0x399e6a, avoidOverlap: _0x54cf8e } = getNodeSpawnPrefs(),
            _0x2e2c3e = _0x399e6a === 'down' ? 'down' : 'left',
            _0x45da0b = Number(_0x563a48.x) || 0,
            _0xf1cd63 = Number(_0x563a48.y) || 0,
            _0x3e0907 = Number(_0x563a48.width) || 0x168,
            _0x49a609 = Number(_0x563a48.height) || 0x168,
            _0x593fae = _0x45da0b - _0x6d749 - _0x583ca4,
            _0x40aaf3 =
              _0x2e2c3e === 'down'
                ? _0xf1cd63 + _0x49a609 + _0x6d749
                : _0xf1cd63 + Math.round((_0x49a609 - _0x738f96) / 2),
            _0x272c84 = _0x54cf8e
              ? findAvailablePosition(
                  _0x30ae7b.nodes || {},
                  _0x593fae,
                  _0x40aaf3,
                  _0x583ca4,
                  _0x738f96,
                  _0x6d749,
                  _0x2e2c3e,
                )
              : { x: _0x593fae, y: _0x40aaf3 },
            _0x1cb4e7 = getFixedInputSlotsToReplace(_0x563a48, _0x565e3b);
          (appStore.batch(() => {
            const _0x1bac89 = appStore.getIncomingEdges(this.nodeId);
            for (const _0xe799a3 of _0x1bac89) {
              if (_0x1cb4e7.has(String(_0xe799a3?.refSlot || ''))) appStore.removeEdge(_0xe799a3.id);
            }
            const _0x3abe73 = generateId('node'),
              _0x197caf = {
                id: _0x3abe73,
                type: _0x577940,
                x: _0x272c84.x,
                y: _0x272c84.y,
                width: _0x583ca4,
                height: _0x738f96,
                src: _0xafdc30,
                localPath: _0x5dd7b0,
                assetId: _0x384d89.assetId || '',
                originalLocalPath: _0x384d89.originalLocalPath || _0x384d89.localPath || '',
                posterLocalPath: _0x384d89.posterLocalPath || '',
                waveformLocalPath: _0x384d89.waveformLocalPath || '',
                derivativeStatus: _0x384d89.derivativeStatus || _0x384d89.status || '',
                mediaTaskId: _0x384d89.mediaTaskId || '',
                mediaTaskKind: _0x384d89.mediaTaskKind || '',
                mediaTaskStatus: _0x384d89.mediaTaskStatus || '',
                mediaTaskProgress: Number(_0x384d89.mediaTaskProgress || 0) || 0,
                mediaTaskError: _0x384d89.mediaTaskError || '',
                fileName: _0x384d89.filename || _0x3671d1.name || '',
              };
            (_0x26da31 && (_0x197caf.name = _0x3671d1.name || aigenVideoNodeText('inputNames.sourceAudio')),
              _0x397954 && (_0x197caf.name = _0x3671d1.name || aigenVideoNodeText('inputNames.sourceVideo')),
              removeCoveredAssetInputRefForConnection({
                targetId: this.nodeId,
                sourceKind: _0x26da31 ? 'audio' : _0x397954 ? 'video' : 'image',
                refSlot: _0x565e3b,
              }),
              appStore.addNode(_0x197caf),
              appStore.addEdge({
                id: generateId('edge'),
                sourceId: _0x3abe73,
                targetId: this.nodeId,
                refSlot: _0x565e3b,
              }),
              appStore.setSelectedNodes([this.nodeId]));
          }),
            this._updateSubmitButtonState());
        } catch (_0x3c50a6) {
          window.showToast?.(_0x3c50a6?.message || aigenVideoNodeText('upload.failedRetry'), 'error');
        } finally {
          ((this._ltxRefUploadInput.value = ''),
            (this._ltxRefUploadSlot = ''),
            (this._ltxRefUploadAnchorNodeId = ''));
        }
      }),
      this.refBarEl.addEventListener('click', (_0x1e7dfa) => {
        const _0x4054f0 = _0x1e7dfa.target.closest('.rh-v5-ref-box');
        if (!_0x4054f0) return;
        const _0xbaa790 = appStore.getState().nodes?.[this.nodeId],
          _0x5a08a7 = getFixedInputSlotConfigFromManifest(_0xbaa790 || {});
        if (!_0x5a08a7) return;
        const _0x948fc9 = _0x1e7dfa.target.closest('.ref-thumb-delete');
        if (_0x948fc9) {
          (_0x1e7dfa.stopPropagation(), _0x1e7dfa.preventDefault());
          const _0x3c46c3 = _0x4054f0.dataset.edgeId || '';
          _0x3c46c3 && (appStore.removeEdge(_0x3c46c3), this._updateSubmitButtonState());
          return;
        }
        (_0x1e7dfa.stopPropagation(), _0x1e7dfa.preventDefault());
        const _0x3c03a3 = _0x4054f0.dataset.slot || '';
        if (!_0x3c03a3) return;
        const _0x4ac3d6 = _0x5a08a7.slotKindById?.[_0x3c03a3] || '';
        if (!_0x4ac3d6 || !_0x5a08a7.visibleSlots.includes(_0x3c03a3)) return;
        const _0x3ab74b = getFixedInputAcceptForKind(_0x4ac3d6);
        if (_0x4ac3d6 === 'audio') {
          ((this._ltxRefUploadSlot = _0x3c03a3),
            (this._ltxRefUploadAnchorNodeId = this.nodeId),
            (this._ltxRefUploadInput.accept = _0x3ab74b),
            this._ltxRefUploadInput.click());
          return;
        }
        ((this._v5RefUploadSlot = _0x3c03a3),
          (this._v5RefUploadAnchorNodeId = this.nodeId),
          (this._v5RefUploadInput.accept = _0x3ab74b),
          this._v5RefUploadInput.click());
      }));
    const _0x1a497f = document.createElement('div');
    ((_0x1a497f.className = 'prompt-input-wrapper'),
      _0x1a497f.classList.add('is-resizable'),
      (this._promptInputWrap = _0x1a497f),
      (this.promptEl = document.createElement('div')),
      (this.promptEl.className = 'prompt-textarea custom-textarea'),
      (this.promptEl.contentEditable = 'true'),
      (this.promptEl.spellcheck = false),
      (this.promptEl.dataset.placeholder = aigenVideoNodeText('prompt.placeholder')),
      (this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
      this.promptEl.addEventListener('input', (_0xc8e97b) => {
        (schedulePromptHtmlCommit(this),
          this._checkAtTrigger(_0xc8e97b),
          checkSlashTrigger(_0xc8e97b, {
            promptEl: this.promptEl,
            nodeType: this._data.type,
            nodeId: this.nodeId,
            onGenerate: (_0xe9f51e, _0x48b729) => this._onGenerate(_0xe9f51e, _0x48b729),
          }),
          _syncEdgesOrderFromPills(this),
          this._updateSubmitButtonState());
      }),
      this.promptEl.addEventListener('blur', () => {
        flushPromptHtmlCommit(this);
      }),
      this.promptEl.addEventListener('mouseover', (_0x5750ef) => {
        _handlePillHover(_0x5750ef, this);
      }),
      this.promptEl.addEventListener('mouseout', (_0x4b1ff0) => {
        _handlePillOut(_0x4b1ff0, this);
      }),
      this.promptEl.addEventListener('keydown', (_0x664dfd) => {
        if (handlePromptSelectAll(this, _0x664dfd)) return;
        if (_handleMentionMenuKeyboard(_0x664dfd)) return;
        if (handleSlashKeyboardNavigation(_0x664dfd)) return;
        if (shouldSubmitPromptByKeyboard(_0x664dfd)) {
          (_0x664dfd.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
          return;
        }
        _handlePillKeyboard(this, _0x664dfd);
      }),
      this.promptEl.addEventListener('paste', (_0x560515) => {
        handlePromptPaste(this, _0x560515);
      }),
      _0x1a497f.appendChild(this.promptEl),
      this._syncPromptBoxSizeFromData(this._data),
      this._setupPromptBoxResize());
    this._data.prompt &&
      ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), this._initPromptPills());
    (_0x2ca7b6.appendChild(_0x1a497f),
      this._syncPromptInputVisibility(this._data),
      this._syncGenerationNodeHelpTip(),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      this._syncLocaleTexts());
    const _0x56f1ff = document.createElement('div');
    ((_0x56f1ff.className = 'prompt-panel-footer'),
      (this.footerEl = _0x56f1ff),
      this._renderFooter(_0x56f1ff),
      _0x2ca7b6.appendChild(_0x56f1ff),
      _0xae78be.appendChild(_0x2ca7b6),
      this._renderRefBarWhenMediaReady(),
      this._assetMentionRegistryUnsubscribe?.(),
      (this._assetMentionRegistryUnsubscribe = subscribeAssetMentionRegistry(() => {
        if (this._assetMentionRegistryRefreshPending) return;
        ((this._assetMentionRegistryRefreshPending = true),
          queueMicrotask(() => {
            this._assetMentionRegistryRefreshPending = false;
            if (!appStore.getState().nodes?.[this.nodeId]) return;
            (_rehydratePromptPills(this), this._renderRefBar(), this._updateSubmitButtonState());
          }));
      })));
    const _0x4a853c = _0xae78be.querySelector('.node-floating-toolbar');
    return (
      bindVideoToolbarEvents(_0x4a853c, this._data),
      _0x3edce8 &&
        _0x3edce8.addEventListener('pointerdown', (_0x43fd20) => {
          const _0xa3e718 = appStore.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
            _0x513f3b = document
              .getElementById('v2-wrap')
              ?.classList.contains('v2-media-node-resize-enabled');
          if (!(_0xa3e718 && _0x513f3b)) return;
          if (_0x43fd20.button !== 0) return;
          startNodeResizePreview({
            event: _0x43fd20,
            nodeId: this.nodeId,
            getNode: () => appStore.getStateRaw().nodes?.[this.nodeId] || this._data,
            getViewport: () => appStore.getStateRaw().viewport,
            resolveSize: ({
              startWidth: _0x5515e2,
              startHeight: _0x375b8c,
              dx: _0x22981d,
              dy: _0x1a4a87,
            }) => {
              const _0x3f05e6 = _0x5515e2 / _0x375b8c,
                _0x487c15 = Math.max(_0x22981d / _0x5515e2, _0x1a4a87 / _0x375b8c),
                _0x21964d = Math.max(AI_VIDEO_MIN_SIZE / _0x5515e2, AI_VIDEO_MIN_SIZE / _0x375b8c),
                _0x12f1d0 = Math.max(_0x21964d, 1 + _0x487c15),
                _0x52744f = Math.max(AI_VIDEO_MIN_SIZE, Math.round(_0x5515e2 * _0x12f1d0)),
                _0x5b4bcf = Math.max(AI_VIDEO_MIN_SIZE, Math.round(_0x52744f / _0x3f05e6));
              return { width: _0x52744f, height: _0x5b4bcf };
            },
            buildFinalPatch: ({ startNode: _0x5e05d4 }) =>
              _0x5e05d4?.needsAutoResize ? { needsAutoResize: false } : {},
            applyPatch: (_0x1b3c56) => appStore.updateNodeData(this.nodeId, _0x1b3c56),
            commit: commit,
          });
        }),
      (this._attachBtnIcon = this.refBarEl.querySelector('.btn-icon')),
      this._updateSubmitButtonState(),
      _0xae78be
    );
  }
  ['_initPromptPills']() {
    _rehydratePromptPills(this);
  }
  ['_syncPromptBoxSizeFromData'](_0x532d32 = this._data) {
    syncPromptBoxSizeFromData(this, _0x532d32);
  }
  ['_setupPromptBoxResize']() {
    setupPromptBoxResize(this, {
      store: appStore,
      getStateSnapshot: () =>
        typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
    });
  }
  ['_syncPromptInputVisibility'](_0x25a512 = this._data) {
    if (!this._promptInputWrap) return true;
    const _0x5b5d47 =
        typeof this._resolveModelExecution === 'function'
          ? this._resolveModelExecution(_0x25a512?.model, _0x25a512?.provider)
          : null,
      _0x3ffa5f = shouldShowVideoPromptInput(_0x5b5d47?.modelManifest);
    return (
      (this._promptInputWrap.hidden = !_0x3ffa5f),
      this._promptInputWrap.classList?.toggle('is-hidden-by-model', !_0x3ffa5f),
      this.promptEl &&
        ((this.promptEl.contentEditable = _0x3ffa5f ? 'true' : 'false'),
        this.promptEl.setAttribute?.('aria-hidden', _0x3ffa5f ? 'false' : 'true'),
        !_0x3ffa5f && document.activeElement === this.promptEl && this.promptEl.blur?.()),
      _0x3ffa5f
    );
  }
  ['update'](_0x1d5d8c) {
    const _0x287bae = () => readStoreState()?.nodes?.[this.nodeId] || _0x1d5d8c;
    _0x1d5d8c = _0x287bae() || _0x1d5d8c;
    typeof this._normalizeDreaminaNodeData === 'function'
      ? (this._data = this._normalizeDreaminaNodeData(_0x1d5d8c, { syncStore: true }) || _0x1d5d8c)
      : (this._data = _0x1d5d8c);
    ((_0x1d5d8c = _0x287bae() || this._data), (this._data = _0x1d5d8c), (_0x1d5d8c = this._data));
    typeof this._syncMutedStateFromNodeData === 'function' && this._syncMutedStateFromNodeData(_0x1d5d8c);
    this._syncNoResultClass();
    if (shouldShowGenerationBusyUi(_0x1d5d8c)) {
      this._isGenerating = true;
      if (this.previewEl) startLoading(this.previewEl);
    } else {
      if (isTerminalGenerationUiState(_0x1d5d8c)) {
        ((this._isGenerating = false), stopPreviewNodeLoading(this.nodeId));
        if (this.previewEl) stopLoading(this.previewEl);
      }
    }
    const _0xaa2363 = String(_0x1d5d8c?.model || '').trim(),
      _0x3e82b9 = this._isRunninghubWorkflowModel(_0xaa2363, _0x1d5d8c?.provider),
      _0x14272a = getFixedInputSlotConfigFromManifest(_0x1d5d8c || {}),
      _0x135206 = !!_0x14272a,
      _0x419981 =
        (_0x14272a?.slotOrderByType?.video || []).includes('sourceVideo') &&
        (_0x14272a?.slotOrderByType?.image || []).includes('refImage');
    let _0xd296cb = appStore.getIncomingEdges(this.nodeId);
    _0x135206 && (_0xd296cb = _0xd296cb.filter((_0x5de4c7) => _0x5de4c7?.targetId === this.nodeId));
    const _0x2d9e79 = _0xd296cb.length > 0;
    if (_0x14272a) {
      const _0x57bbc3 = buildRunningHubVideoFixedSlotSummaryPatch({
          model: _0xaa2363,
          nodeData: _0x1d5d8c,
          slotEntries: buildVideoFixedSlotEntriesForSummary({
            fixedInputConfig: _0x14272a,
            inEdges: _0xd296cb,
            nodes: readStoreState().nodes || {},
            promptEl: this.promptEl,
            nodeData: _0x1d5d8c,
          }),
        }),
        _0x236bab =
          Object.entries(_0x57bbc3).some(([_0x587cb6, _0x19c14d]) => _0x1d5d8c?.[_0x587cb6] !== _0x19c14d) ||
          (_0x57bbc3.rhBerniniFunction &&
            _0x1d5d8c?.generationParams?.rhBerniniFunction !== _0x57bbc3.rhBerniniFunction);
      if (_0x236bab) {
        const _0x484476 = { ..._0x57bbc3 };
        if (_0x57bbc3.rhBerniniFunction) {
          const _0x1ac0d5 = {
            ...(_0x1d5d8c?.generationParams || {}),
            rhBerniniFunction: _0x57bbc3.rhBerniniFunction,
          };
          _0x484476.generationParams = _0x1ac0d5;
          const _0x571668 = String(_0x1d5d8c?.model || '').trim();
          _0x571668 &&
            (_0x484476.generationParamsByModel = {
              ...(_0x1d5d8c?.generationParamsByModel || {}),
              [_0x571668]: _0x1ac0d5,
            });
        }
        (appStore.updateNodeData(this.nodeId, _0x484476),
          (_0x1d5d8c = { ..._0x1d5d8c, ..._0x484476 }),
          (this._data = _0x1d5d8c));
      }
    }
    const _0x2d8a77 = Array.isArray(_0x1d5d8c?.videos) ? _0x1d5d8c.videos : [],
      _0x55f088 = JSON.stringify({
        videos: _0x2d8a77.map((_0x4e282d) => ({
          videoUrl: String(_0x4e282d?.videoUrl || ''),
          resultUrl: String(_0x4e282d?.resultUrl || ''),
          sourceUrl: String(_0x4e282d?.sourceUrl || ''),
          localPath: String(_0x4e282d?.localPath || ''),
          displayLocalPath: String(_0x4e282d?.displayLocalPath || ''),
          originalLocalPath: String(_0x4e282d?.originalLocalPath || ''),
          thumbId: String(_0x4e282d?.thumbId || ''),
          thumbUrl: String(_0x4e282d?.thumbUrl || ''),
          thumbLocalPath: String(_0x4e282d?.thumbLocalPath || ''),
          posterUrl: String(_0x4e282d?.posterUrl || ''),
          posterLocalPath: String(_0x4e282d?.posterLocalPath || ''),
          error: String(_0x4e282d?.error || ''),
          mediaUnavailable: _0x4e282d?.mediaUnavailable === true,
          mediaUnavailableSource: String(_0x4e282d?.mediaUnavailableSource || ''),
          videoWidth: Number(_0x4e282d?.videoWidth || _0x4e282d?.width || 0),
          videoHeight: Number(_0x4e282d?.videoHeight || _0x4e282d?.height || 0),
        })),
        videoUrl: String(_0x1d5d8c?.videoUrl || ''),
        resultUrl: String(_0x1d5d8c?.resultUrl || ''),
        sourceUrl: String(_0x1d5d8c?.sourceUrl || ''),
        localPath: String(_0x1d5d8c?.localPath || ''),
        displayLocalPath: String(_0x1d5d8c?.displayLocalPath || ''),
        originalLocalPath: String(_0x1d5d8c?.originalLocalPath || ''),
        thumbId: String(_0x1d5d8c?.thumbId || ''),
        thumbUrl: String(_0x1d5d8c?.thumbUrl || ''),
        thumbLocalPath: String(_0x1d5d8c?.thumbLocalPath || ''),
        posterUrl: String(_0x1d5d8c?.posterUrl || ''),
        posterLocalPath: String(_0x1d5d8c?.posterLocalPath || ''),
        selectedVideoWidth: Number(_0x1d5d8c?.selectedVideoWidth || 0),
        selectedVideoHeight: Number(_0x1d5d8c?.selectedVideoHeight || 0),
        videoWidth: Number(_0x1d5d8c?.videoWidth || 0),
        videoHeight: Number(_0x1d5d8c?.videoHeight || 0),
        mainVideoIndex: Number(_0x1d5d8c?.mainVideoIndex || 0),
        isVideosExpanded: !!_0x1d5d8c?.isVideosExpanded,
        isGenerating: _0x1d5d8c?.isGenerating === true,
        jobStatus: String(_0x1d5d8c?.jobStatus || ''),
        jobError: String(_0x1d5d8c?.jobError || ''),
        error: String(_0x1d5d8c?.error || ''),
        statusMessage: String(_0x1d5d8c?.statusMessage || ''),
        rhStatus: String(_0x1d5d8c?.rhStatus || ''),
        rhStatusMessage: String(_0x1d5d8c?.rhStatusMessage || ''),
        rhStatusCode: String(_0x1d5d8c?.rhStatusCode || ''),
        rhTaskId: String(_0x1d5d8c?.rhTaskId || ''),
        rhTaskStatus: String(_0x1d5d8c?.rhTaskStatus || ''),
        rhTaskStartedAt: Number(_0x1d5d8c?.rhTaskStartedAt || 0),
        rhTaskRecovering: !!_0x1d5d8c?.rhTaskRecovering,
        rhTaskUseOpenapiQuery: !!_0x1d5d8c?.rhTaskUseOpenapiQuery,
        dreaminaSubmitId: String(_0x1d5d8c?.dreaminaSubmitId || ''),
        dreaminaTaskStatus: String(_0x1d5d8c?.dreaminaTaskStatus || ''),
        dreaminaTaskPhase: String(_0x1d5d8c?.dreaminaTaskPhase || ''),
        dreaminaTaskLabel: String(_0x1d5d8c?.dreaminaTaskLabel || ''),
        dreaminaTaskStartedAt: Number(_0x1d5d8c?.dreaminaTaskStartedAt || 0),
        dreaminaTaskLastCheckedAt: Number(_0x1d5d8c?.dreaminaTaskLastCheckedAt || 0),
        dreaminaTaskRecovering: !!_0x1d5d8c?.dreaminaTaskRecovering,
        asyncTaskId: String(_0x1d5d8c?.asyncTaskId || ''),
        asyncTaskStatus: String(_0x1d5d8c?.asyncTaskStatus || ''),
        asyncTaskError: String(_0x1d5d8c?.asyncTaskError || ''),
        asyncTaskRecovering: !!_0x1d5d8c?.asyncTaskRecovering,
      }),
      _0x50d95b = _0x55f088 !== this._lastVideoViewSig;
    this._lastVideoViewSig = _0x55f088;
    const _0xc8868a = _0x2d9e79 !== this._lastHasInputConnections;
    this._lastHasInputConnections = _0x2d9e79;
    (_0x50d95b || _0xc8868a) && this._loadVideoWhenMediaReady();
    typeof this._maybeResumeDreaminaTaskImpl === 'function' && this._maybeResumeDreaminaTaskImpl();
    typeof this._maybeResumeRunningHubTaskImpl === 'function' && this._maybeResumeRunningHubTaskImpl();
    typeof this._maybeResumeAsyncTaskImpl === 'function' && this._maybeResumeAsyncTaskImpl();
    const _0x24116f = _0xd296cb
        .map((_0x4f1876) => String(_0x4f1876?.sourceId || '') + ':' + String(_0x4f1876?.refSlot || ''))
        .join('|'),
      _0x279320 = (_0x1faea8) => {
        const _0x11969c = String(_0x1faea8 || '')
          .trim()
          .toLowerCase();
        return !_0x11969c || _0x11969c === '自适应' || _0x11969c === 'auto' || _0x11969c === 'adaptive';
      },
      _0x3921e1 = (_0xfa907b) => {
        const _0x376874 =
            typeof this._getDreaminaEffectiveNodeData === 'function'
              ? this._getDreaminaEffectiveNodeData(_0xfa907b || {})
              : _0xfa907b || {},
          _0x2f1777 = _0x376874?.generationParams;
        return _0x2f1777 &&
          typeof _0x2f1777 === 'object' &&
          !Array.isArray(_0x2f1777) &&
          Object.prototype.hasOwnProperty.call(_0x2f1777, 'aspectRatio')
          ? _0x2f1777.aspectRatio
          : _0x376874?.aspectRatio;
      };
    if (this._lastAdaptiveEdgeSig !== null && _0x24116f !== this._lastAdaptiveEdgeSig) {
      const _0x1899bc = _0x3921e1(this._data);
      _0x279320(_0x1899bc) &&
        typeof this._runAdaptiveRatio === 'function' &&
        !_0x3e82b9 &&
        setTimeout(() => {
          if (readStoreState().nodes[this.nodeId]) this._runAdaptiveRatio();
        }, 50);
    }
    ((this._lastAdaptiveEdgeSig = _0x24116f),
      (_0x1d5d8c = _0x287bae() || this._data || _0x1d5d8c),
      (this._data = _0x1d5d8c));
    const _0x1c17ed =
        typeof this._isDreaminaVideoNode === 'function' && this._isDreaminaVideoNode(_0x1d5d8c)
          ? (_0x1d5d8c.dreaminaRouteMode || '') +
            '|' +
            (this._getDreaminaReferenceSummary?.(_0x1d5d8c)?.signature || '')
          : '',
      _0x3bce35 =
        (_0x1d5d8c.model || '') +
        '|' +
        (_0x1d5d8c.provider || '') +
        '|' +
        (_0x1d5d8c.rhSpecialMode || '') +
        '|' +
        (_0x1d5d8c.rhBerniniInputMode || '') +
        '|' +
        _0x1c17ed;
    let _0x128d22 = false;
    this.footerEl &&
      _0x3bce35 !== this._lastFooterSig &&
      ((this._lastFooterSig = _0x3bce35),
      this._renderFooter(this.footerEl),
      (_0x1d5d8c = _0x287bae() || this._data || _0x1d5d8c),
      (this._data = _0x1d5d8c),
      (_0x128d22 = true));
    if (
      _0x128d22 &&
      typeof this._isDreaminaVideoNode === 'function' &&
      this._isDreaminaVideoNode(_0x1d5d8c)
    ) {
      const _0x3524f0 = readStoreState().nodes?.[this.nodeId] || this._data || {};
      _0x279320(_0x3921e1(_0x3524f0)) &&
        typeof this._runAdaptiveRatio === 'function' &&
        setTimeout(() => {
          if (readStoreState().nodes[this.nodeId]) this._runAdaptiveRatio();
        }, 50);
    }
    const _0x145999 = readStoreState().pickConnectMode;
    if (this._placeholderEl) {
      const _0x521f56 = this._placeholderEl.querySelector('.placeholder-icon-svg');
      if (_0x521f56) {
        if (_0x145999?.active && _0x145999.sourceNodeId === this.nodeId)
          _0x521f56.classList.add('is-pick-connecting');
        else _0x521f56.classList.remove('is-pick-connecting');
      }
    }
    if (document.activeElement !== this.promptEl && _0x1d5d8c.prompt !== undefined) {
      const _0x5b37df = sanitizePromptHtml(_0x1d5d8c.prompt || '');
      this.promptEl.innerHTML !== _0x5b37df &&
        ((this.promptEl.innerHTML = _0x5b37df), this._initPromptPills());
    }
    typeof this._syncDreaminaPromptPlaceholder === 'function' &&
      this._syncDreaminaPromptPlaceholder(_0x1d5d8c);
    this._syncPromptInputVisibility(_0x1d5d8c) && this._syncPromptBoxSizeFromData(_0x1d5d8c);
    (this._syncGenerationNodeHelpTip(), (_0xd296cb = appStore.getIncomingEdges(this.nodeId)));
    _0x135206 && (_0xd296cb = _0xd296cb.filter((_0x39a07e) => _0x39a07e?.targetId === this.nodeId));
    const _0x555413 = readStoreState().nodes || {},
      _0x135f08 = _0xd296cb
        .map((_0x192699) => {
          const _0x1ba00d = _0x555413?.[_0x192699.sourceId] || null,
            _0x4e9d6d =
              typeof this._getRefSourceStateKey === 'function' ? this._getRefSourceStateKey(_0x1ba00d) : '';
          return (
            _0x192699.id +
            ':' +
            _0x192699.sourceId +
            ':' +
            (_0x192699.refSlot || '') +
            ':' +
            (_0x192699.sourceMediaKey || '') +
            ':' +
            _0x4e9d6d
          );
        })
        .join('|'),
      _0x5b733b = _0x14272a
        ? String(_0x14272a.visibilityLayoutKey || _0x14272a.visibleSlots?.join('|') || '')
        : '',
      _0x4c2df1 = (_0x1d5d8c?.model || '') + '|' + (_0x1d5d8c?.provider || '') + '|' + _0x5b733b,
      _0x5b3a50 = String(_0x1d5d8c?.rhSpecialMode || ''),
      _0x558bb7 = String(_0x1d5d8c?.rhSubtractSubject || '');
    if (
      _0x135f08 !== this._lastEdgeSig ||
      _0x4c2df1 !== this._lastRefModeSig ||
      _0x5b3a50 !== this._lastSpecialModeSig ||
      _0x558bb7 !== this._lastSubtractSubjectSig
    ) {
      ((this._lastEdgeSig = _0x135f08),
        (this._lastRefModeSig = _0x4c2df1),
        (this._lastSpecialModeSig = _0x5b3a50),
        (this._lastSubtractSubjectSig = _0x558bb7),
        this._renderRefBarWhenMediaReady());
      if (_0x2d9e79 && this._placeholderEl) {
        const _0x1e6b5f =
          (Array.isArray(_0x1d5d8c?.videos) && _0x1d5d8c.videos.length > 0) ||
          !!String(_0x1d5d8c?.videoUrl || '').trim() ||
          !!String(_0x1d5d8c?.localPath || '').trim() ||
          !!String(_0x1d5d8c?.thumbId || '').trim();
        ((this._placeholderEl.style.display = _0x1e6b5f ? 'none' : 'flex'),
          this._setVideoOverlaysVisible(_0x1e6b5f));
      }
      _0x419981 && this._loadVideoWhenMediaReady();
    } else this._syncBtnIconState();
    this._updateSubmitButtonState();
    if (this.footerEl) {
      ((_0x1d5d8c = _0x287bae() || this._data || _0x1d5d8c), (this._data = _0x1d5d8c));
      const _0x2d62d3 = String(_0x1d5d8c?.model || '').trim(),
        _0x2fd92d = this._isRunninghubWorkflowModel(_0x2d62d3, _0x1d5d8c?.provider),
        _0x542a7b = hasRunningHubVideoWorkflowUiPlacement(_0x2d62d3, 'videoParams'),
        _0xa9ea3f = hasRunningHubVideoWorkflowUiPlacement(_0x2d62d3, 'resolution'),
        _0x2425e3 = _0x2fd92d,
        _0x9cc297 = hasRunningHubVideoWorkflowUiPlacement(_0x2d62d3, 'videoAdvanced'),
        _0x1d16de =
          typeof this._resolveModelExecution === 'function'
            ? this._resolveModelExecution(_0x2d62d3, _0x1d5d8c?.provider)
            : null,
        _0x494bbb =
          _0x1d16de?.modelManifest?.adapterType === 'modelApi' && _0x1d16de?.modelManifest?.kind === 'video'
            ? String(_0x1d16de?.canonicalModelId || _0x1d16de?.modelManifest?.modelId || _0x2d62d3).trim()
            : '',
        _0x4c0be5 = !!_0x494bbb && hasModelUiSchema(_0x494bbb, { placement: 'advanced' }),
        _0x1928d0 = _0x9cc297 || _0x4c0be5;
      if (hasRunningHubVideoWorkflowUiField(_0x2d62d3, 'rhMaskExpand')) {
        const _0x597611 = _0x1d5d8c?.rhMaskExpandTouched === true,
          _0x27a80c = Number(_0x1d5d8c?.rhMaskExpand);
        Number.isFinite(_0x27a80c) &&
          _0x27a80c === 0 &&
          !_0x597611 &&
          appStore.updateNodeData(this.nodeId, { rhMaskExpand: 25 });
      }
      const _0x4aae0c = this.footerEl.querySelector('.rh-adv2-btn');
      if (_0x4aae0c) _0x4aae0c.style.display = _0x1928d0 ? '' : 'none';
      const _0x821c15 = this.footerEl.querySelector('.ui-schema-instance-slot');
      if (_0x821c15) _0x821c15.style.display = _0x2425e3 ? '' : 'none';
      const _0x1e7218 =
        typeof this._getRhVideoAdvancedSchemaNodeData === 'function'
          ? this._getRhVideoAdvancedSchemaNodeData(_0x1d5d8c)
          : _0x1d5d8c;
      syncModelUiSchemaControls(this.footerEl, _0x1e7218);
      const _0x1069c7 = this.footerEl.querySelector('.img-ratio-label');
      if (_0x1069c7 && !_0x542a7b && !_0xa9ea3f) {
        if (
          typeof this._isDreaminaVideoNode === 'function' &&
          this._isDreaminaVideoNode(_0x1d5d8c) &&
          typeof this._getDreaminaRatioDisplayState === 'function'
        ) {
          const _0xda44b5 = this._getDreaminaRatioDisplayState(_0x1d5d8c);
          _0x1069c7.textContent = _0xda44b5?.ratioLabelText || formatVideoNodeRatioResolutionLabel(_0x1d5d8c);
          const _0xcefa63 = this.footerEl.querySelector('.img-ratio-icon-slot');
          _0xcefa63 &&
            typeof this._getRatioIconHTML === 'function' &&
            (_0xcefa63.innerHTML = this._getRatioIconHTML(
              _0xda44b5?.ratioIconLabel || _0x1d5d8c?.aspectRatio || '自适应',
            ));
        } else _0x1069c7.textContent = formatVideoNodeRatioResolutionLabel(_0x1d5d8c);
      }
      const _0x11b493 = this.footerEl.querySelector('.rh-vram-adv-panel');
      if (_0x11b493 && !_0x1928d0) _0x11b493.classList.remove('show');
    }
  }
  ['_syncBtnIconStateImpl']() {
    const _0x3679bb = readStoreState().pickConnectMode,
      _0x5cc68c = this.refBarEl?.querySelector('.btn-icon');
    if (!_0x5cc68c) return;
    _0x3679bb?.active && _0x3679bb.sourceNodeId === this.nodeId
      ? ((_0x5cc68c.style.opacity = '0'), (_0x5cc68c.style.transform = 'scale(0.4)'))
      : ((_0x5cc68c.style.opacity = '1'), (_0x5cc68c.style.transform = 'scale(1)'));
  }
  ['_checkAtTrigger'](_0x5898c6) {
    return _checkAtTrigger(this, _0x5898c6);
  }
  ['_populateMentionMenu'](
    _0x1c0f55,
    _0x3e949b,
    _0x14cd7a,
    _0xf90955 = null,
    _0x3e1de6 = '',
    _0x427ef4 = -1,
  ) {
    return _populateMentionMenu(this, {
      x: _0x1c0f55,
      y: _0x3e949b,
      triggerRange: _0x14cd7a,
      pillToEdit: _0xf90955,
      query: _0x3e1de6,
      atIndex: _0x427ef4,
    });
  }
  ['_insertMentionPill'](_0x58da7f, _0x204c54, _0x54c372, _0x1c78d6 = -1) {
    return _insertMentionPill(this, {
      label: _0x58da7f,
      nodeId: _0x204c54,
      triggerRange: _0x54c372,
      atIndex: _0x1c78d6,
    });
  }
  ['_handlePillKeyboard'](_0x313585) {
    return _handlePillKeyboard(this, _0x313585);
  }
  ['_getGenerationNodeHelpText']() {
    const _0x235c60 = String(this._data?.model || '').trim();
    return getGenerationNodeHelpTooltip({
      kind: 'video',
      key: _0x235c60,
      model: _0x235c60,
      label: getDisplayModelName(_0x235c60),
      nodeData: this._data || {},
    });
  }
  ['_ensureGenerationNodeHelpTip']() {
    if (this._generationNodeHelpTip || !this._promptPanel) return this._generationNodeHelpTip;
    return (
      (this._generationNodeHelpTip = createGenerationNodeHelpTipController({
        panel: this._promptPanel,
        getHelpText: () => this._getGenerationNodeHelpText(),
        ariaLabel: aigenVideoNodeText('help.ariaLabel'),
      })),
      this._generationNodeHelpTip
    );
  }
  ['_syncGenerationNodeHelpTip']() {
    this._ensureGenerationNodeHelpTip()?.sync();
  }
  ['hydrateDeferredMedia']() {
    if (this._rendererMediaDeferred !== true) return;
    ((this._rendererMediaDeferred = false),
      (this._data = readStoreState()?.nodes?.[this.nodeId] || this._data),
      (this._deferredVideoViewRefreshPending = false),
      this._loadAndDisplayVideo(),
      this._renderRefBarPendingWhenVisible &&
        ((this._renderRefBarPendingWhenVisible = false), this._renderRefBar()),
      this._updateSubmitButtonState());
  }
  ['unmount']() {
    (this._flushPromptHtmlCommit?.(),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      this._assetMentionRegistryUnsubscribe?.(),
      (this._assetMentionRegistryUnsubscribe = null),
      (this._assetMentionRegistryRefreshPending = false));
    typeof this._stopDreaminaRecovery === 'function' && this._stopDreaminaRecovery(false);
    typeof this._stopRunningHubRecovery === 'function' && this._stopRunningHubRecovery(false);
    typeof this._stopAsyncRecovery === 'function' && this._stopAsyncRecovery(false);
    typeof this._promptResizeCleanup === 'function' &&
      (this._promptResizeCleanup(), (this._promptResizeCleanup = null));
    (this._generationNodeHelpTip?.remove(),
      (this._generationNodeHelpTip = null),
      this._uiSchemaCleanup?.(),
      (this._uiSchemaCleanup = null),
      this._footerControllerCleanup?.(),
      (this._footerControllerCleanup = null),
      (this._isPromptBoxResizing = false),
      this._blobResolveToken++);
    this._videoClickTimer && (clearTimeout(this._videoClickTimer), (this._videoClickTimer = null));
    this._centerIndicatorTimer &&
      (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null));
    this._isManualLoopPlayback = false;
    try {
      this.previewEl?.querySelectorAll('video').forEach((_0x1515bd) => {
        try {
          _0x1515bd.pause();
        } catch {}
        (_0x1515bd.removeAttribute('src'), _0x1515bd.load?.());
      });
    } catch {}
    for (const _0x25dd42 of this._cachedVideoUrls.values()) {
      if (_0x25dd42 && String(_0x25dd42).startsWith('blob:'))
        try {
          URL.revokeObjectURL(_0x25dd42);
        } catch {}
    }
    this._cachedVideoUrls.clear();
    const _0x47b342 = [this._fixedSlotRefThumbObjectUrls, this._refThumbObjectUrls];
    for (const _0x205e91 of _0x47b342) {
      if (!(_0x205e91 && typeof _0x205e91.entries === 'function')) continue;
      for (const _0x4bf8ce of _0x205e91.values()) {
        if (_0x4bf8ce && String(_0x4bf8ce).startsWith('blob:'))
          try {
            URL.revokeObjectURL(_0x4bf8ce);
          } catch {}
      }
      try {
        _0x205e91.clear();
      } catch {}
    }
    this._videoThumbPending.clear();
  }
}
const videoNodeReferenceInputModule = createVideoNodeReferenceInputModule(VIDEO_NODE_MODULE_DEPS),
  videoNodeParameterPanelModule = createVideoNodeParameterPanelModule(VIDEO_NODE_MODULE_DEPS),
  videoNodeTaskOrchestrationModule = createVideoNodeTaskOrchestrationModule(VIDEO_NODE_MODULE_DEPS),
  videoNodeResultRenderModule = createVideoNodeResultRenderModule(VIDEO_NODE_MODULE_DEPS),
  videoNodePreviewControlsModule = createVideoNodePreviewControlsModule(VIDEO_NODE_MODULE_DEPS);
function applyClassPrototypeMethods(_0x600389, _0x300983) {
  if (!_0x300983) return;
  const _0x3b84b0 = Object.getOwnPropertyDescriptors(_0x300983);
  (delete _0x3b84b0.constructor, Object.defineProperties(_0x600389, _0x3b84b0));
}
(applyClassPrototypeMethods(AIGenVideoNode.prototype, videoNodeReferenceInputModule),
  applyClassPrototypeMethods(AIGenVideoNode.prototype, videoNodeParameterPanelModule),
  applyClassPrototypeMethods(AIGenVideoNode.prototype, videoNodeTaskOrchestrationModule),
  applyClassPrototypeMethods(AIGenVideoNode.prototype, videoNodeResultRenderModule),
  applyClassPrototypeMethods(AIGenVideoNode.prototype, videoNodePreviewControlsModule),
  Object.assign(
    AIGenVideoNode.prototype,
    videoUiRenderMixin,
    videoStateSyncMixin,
    videoTaskOrchestrationMixin,
  ));
