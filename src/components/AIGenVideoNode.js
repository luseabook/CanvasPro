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
  VIDEO_VIP_MODEL_NAME_MAP = VIDEO_VIP_MODEL_IDS.reduce((item, value) => {
    return ((item[value] = getVipModelDisplayName(value)), item);
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
function aigenVideoNodeText(key, index = {}) {
  return t('aigenVideoNode.' + key, index);
}
function getVideoAdaptiveRatioLabel() {
  return aigenVideoNodeText('ratio.adaptive');
}
function formatVideoNodeRatioResolutionLabel(options = {}) {
  const enabled = String(options?.aspectRatio || '').trim(),
    result =
      !enabled || enabled === '自适应' || enabled === 'auto' || enabled === 'adaptive'
        ? getVideoAdaptiveRatioLabel()
        : enabled;
  return result + ' · ' + (options?.resolution || '1080p');
}
function readStoreState() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function isTerminalGenerationUiState(data) {
  return isTaskTerminal(data);
}
function isVideoVipModel(target, source = '') {
  return isVipModel(target, source);
}
function getVideoVipModelName(next, current = '') {
  const vipGateModelId = resolveVipGateModelId(next, current);
  return (
    VIDEO_VIP_MODEL_NAME_MAP[vipGateModelId] || vipGateModelId || aigenVideoNodeText('vip.modelFallback')
  );
}
async function ensureVipSessionRecheck(entry, record = '') {
  if (!isVideoVipModel(entry, record)) return;
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
  constructor(payload) {
    ((this._data = payload),
      (this.nodeId = payload.id),
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
      (this._isMuted = resolveVideoMutedPreference(payload)),
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
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(payload)),
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
    const el = document.createElement('div');
    if (this.isNoResult) el.classList.add('no-result');
    ((this._root = el),
      Object.assign(el.style, {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        pointerEvents: 'auto',
        cursor: 'default',
      }),
      el.style.setProperty('overflow', 'visible', 'important'),
      (el.innerHTML = VIDEO_TOOLBAR_HTML),
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
    const el2 = document.createElement('div');
    ((el2.className = 'img-node-placeholder'),
      Object.assign(el2.style, {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        userSelect: 'none',
      }),
      (el2.innerHTML =
        '\n            <svg class="placeholder-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="transition:all 0.2s;">\n                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>\n            </svg>'),
      this.previewEl.appendChild(el2),
      (this._placeholderEl = el2),
      syncPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions?.()),
      this._ensurePreviewVideoOverlays(),
      el.appendChild(this.previewEl));
    const el3 = document.createElement('div');
    ((el3.className = 'node-resizer'), el.appendChild(el3), this._loadVideoWhenMediaReady());
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
      const handle = appStore.getState().videoClip;
      if (handle && handle.active && handle.nodeId === this.nodeId) return;
      const state = appStore.getState().nodes[this.nodeId] || this._data || {};
      if (state.isVideosExpanded) return;
      const enabled2 = this._getActivePreviewVideoEl();
      if (!enabled2) return;
      this._isHovered = true;
      if (VideoKeyingController.isActiveFor(this.nodeId)) {
        enabled2.pause();
        return;
      }
      if (this._hoverManualPause) return;
      if (this._isManualLoopPlayback) return;
      enabled2.loop = true;
      const config = ++this._autoPlayToken;
      typeof this._logPreviewVideoPlaybackEvent === 'function' &&
        this._logPreviewVideoPlaybackEvent(enabled2, 'hover-enter', 'hover');
      const run = () => {
        if (typeof this._playPreviewVideoWithRecovery === 'function') {
          void this._playPreviewVideoWithRecovery(enabled2, {
            reason: 'hover',
            shouldContinue: () => this._autoPlayToken === config && !this._hoverManualPause,
          });
          return;
        }
        if (this._autoPlayToken !== config) {
          enabled2.pause();
          return;
        }
        const promise = enabled2.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
      };
      run();
    }),
      this.previewEl.addEventListener('mouseleave', () => {
        const scope = appStore.getState().videoClip;
        if (scope && scope.active && scope.nodeId === this.nodeId) return;
        const input = appStore.getState().nodes[this.nodeId] || this._data || {};
        if (input.isVideosExpanded) return;
        const enabled3 = this._getActivePreviewVideoEl();
        if (!enabled3) return;
        const enabled4 = this._isManualControl;
        ((this._isHovered = false), this._autoPlayToken++);
        if (!this._isManualLoopPlayback) enabled3.loop = false;
        typeof this._logPreviewVideoPlaybackEvent === 'function' &&
          this._logPreviewVideoPlaybackEvent(enabled3, 'hover-leave', 'hover');
        if (!enabled4) enabled3.pause();
        this._hoverManualPause = false;
        if (!this._isManualLoopPlayback) this._isManualControl = false;
      }));
    const el4 = document.createElement('div');
    ((el4.className = 'text-prompt-panel'),
      (this._promptPanel = el4),
      el4.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
      }),
      (this.refBarEl = document.createElement('div')),
      (this.refBarEl.className = 'node-ref-bar'),
      (this.refBarEl.innerHTML = createPromptAttachmentButtonHTML({ stroke: 'var(--white-90)' })),
      el4.appendChild(this.refBarEl),
      this.refBarEl.addEventListener('pointerdown', (event2) => {
        if (event2.target.closest('.prompt-attachment-btn, .ref-thumb-wrap, .ref-thumb-delete'))
          event2.stopPropagation();
      }),
      this.refBarEl.addEventListener('click', (event3) => {
        if (handleRefThumbDeleteClick(this, event3)) return;
        const enabled5 = event3.target.closest('.prompt-attachment-btn');
        if (!enabled5) return;
        (event3.stopPropagation(), event3.preventDefault());
        const output = appStore.getState().pickConnectMode;
        output?.active && output.sourceNodeId === this.nodeId
          ? appStore.setPickConnectMode({ active: false })
          : appStore.setPickConnectMode({ active: true, sourceNodeId: this.nodeId, handleDirection: 'left' });
      }),
      (this._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(this.refBarEl)),
      (this._v5RefUploadInput = document.createElement('input')),
      (this._v5RefUploadInput.type = 'file'),
      (this._v5RefUploadInput.accept = '*/*'),
      (this._v5RefUploadInput.style.display = 'none'),
      el4.appendChild(this._v5RefUploadInput),
      this._v5RefUploadInput.addEventListener('change', async (event4) => {
        const error = event4.target.files?.[0],
          refSlot = this._v5RefUploadSlot,
          enabled6 = this._v5RefUploadAnchorNodeId;
        if (!error || !refSlot || !enabled6) {
          this._v5RefUploadInput.value = '';
          return;
        }
        try {
          const value2 = window.currentProjectId || 'default_v2_project',
            assetId = await uploadFile(error, value2),
            src = assetId?.url || '';
          if (!src) throw new Error(aigenVideoNodeText('upload.noFileUrl'));
          const value3 = appStore.getState(),
            box = value3.nodes?.[enabled6];
          if (!box) throw new Error(aigenVideoNodeText('upload.anchorMissing'));
          const localPath = pickResultLocalPath(assetId) || urlToLocalPath(src),
            fixedInputSlotKind = getFixedInputSlotKind(box, refSlot),
            sourceKind = fixedInputSlotKind === 'video',
            enabled7 = fixedInputSlotKind === 'image';
          if (sourceKind && !error.type.startsWith('video/'))
            throw new Error(aigenVideoNodeText('upload.videoOnly'));
          if (enabled7 && !error.type.startsWith('image/'))
            throw new Error(aigenVideoNodeText('upload.imageOnly'));
          if (!sourceKind && !enabled7) throw new Error(aigenVideoNodeText('upload.unsupportedAsset'));
          const type = sourceKind ? 'source-video' : 'source-image';
          let width = 0x12c,
            height = 0x12c;
          if (sourceKind) {
            const value4 = document.createElement('video');
            ((value4.src = URL.createObjectURL(error)),
              await new Promise((handler) => {
                ((value4.onloadedmetadata = () => {
                  const value5 = value4.videoWidth || 0x1a4,
                    value6 = value4.videoHeight || 0x104,
                    value7 = Math.min(value5, value6),
                    value8 = 0x12c / (value7 || 1);
                  ((width = Math.round(value5 * value8)),
                    (height = Math.round(value6 * value8)),
                    URL.revokeObjectURL(value4.src),
                    handler());
                }),
                  (value4.onerror = () => {
                    (URL.revokeObjectURL(value4.src), handler());
                  }));
              }));
          } else {
            if (enabled7) {
              const image = new Image();
              await new Promise((handler2) => {
                ((image.onload = () => {
                  const value9 = image.naturalWidth || 0x104,
                    value10 = image.naturalHeight || 0x104,
                    value11 = Math.min(value9, value10),
                    value12 = 0x12c / (value11 || 1);
                  ((width = Math.round(value9 * value12)),
                    (height = Math.round(value10 * value12)),
                    handler2());
                }),
                  (image.onerror = () => {
                    handler2();
                  }),
                  (image.src = src));
              });
            }
          }
          const { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
            value13 = direction === 'down' ? 'down' : 'left',
            value14 = Number(box.x) || 0,
            value15 = Number(box.y) || 0,
            value16 = Number(box.width) || 0x168,
            value17 = Number(box.height) || 0x168,
            x = value14 - spacing - width,
            y =
              value13 === 'down' ? value15 + value17 + spacing : value15 + Math.round((value17 - height) / 2),
            x2 = avoidOverlap
              ? findAvailablePosition(value3.nodes || {}, x, y, width, height, spacing, value13)
              : { x: x, y: y },
            map = getFixedInputSlotsToReplace(box, refSlot);
          (appStore.batch(() => {
            const value18 = appStore.getIncomingEdges(this.nodeId);
            for (const value19 of value18) {
              if (map.has(String(value19?.refSlot || ''))) appStore.removeEdge(value19.id);
            }
            const id = generateId('node'),
              error2 = {
                id: id,
                type: type,
                x: x2.x,
                y: x2.y,
                width: width,
                height: height,
                src: src,
                localPath: localPath,
                assetId: assetId.assetId || '',
                originalLocalPath: assetId.originalLocalPath || assetId.localPath || '',
                posterLocalPath: assetId.posterLocalPath || '',
                waveformLocalPath: assetId.waveformLocalPath || '',
                derivativeStatus: assetId.derivativeStatus || assetId.status || '',
                mediaTaskId: assetId.mediaTaskId || '',
                mediaTaskKind: assetId.mediaTaskKind || '',
                mediaTaskStatus: assetId.mediaTaskStatus || '',
                mediaTaskProgress: Number(assetId.mediaTaskProgress || 0) || 0,
                mediaTaskError: assetId.mediaTaskError || '',
                fileName: assetId.filename || error.name || '',
                thumbUrl: assetId.posterUrl || assetId.thumbUrl || null,
              };
            if (sourceKind)
              error2.name =
                error.name ||
                (refSlot === 'videoMask'
                  ? aigenVideoNodeText('inputNames.maskVideo')
                  : aigenVideoNodeText('inputNames.sourceVideo'));
            (removeCoveredAssetInputRefForConnection({
              targetId: this.nodeId,
              sourceKind: sourceKind ? 'video' : 'image',
              refSlot: refSlot,
            }),
              appStore.addNode(error2),
              appStore.addEdge({
                id: generateId('edge'),
                sourceId: id,
                targetId: this.nodeId,
                refSlot: refSlot,
              }),
              appStore.setSelectedNodes([this.nodeId]));
          }),
            this._updateSubmitButtonState());
          if (sourceKind)
            try {
              const videoThumbSrc = localPathToUrl(localPath),
                response = await fetchVideoFirstFrameThumbFromServer(videoThumbSrc),
                thumbUrl = String(response?.url || '').trim();
              if (thumbUrl) {
                const value20 = appStore.getState().nodes?.[newNodeId];
                if (value20)
                  appStore.updateNodeData(newNodeId, { thumbUrl: thumbUrl, videoThumbSrc: videoThumbSrc });
              }
            } catch {}
          if (!sourceKind) {
          }
        } catch (error3) {
          window.showToast?.(error3?.message || aigenVideoNodeText('upload.failedRetry'), 'error');
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
      el4.appendChild(this._ltxRefUploadInput),
      this._ltxRefUploadInput.addEventListener('change', async (event5) => {
        const error4 = event5.target.files?.[0],
          refSlot2 = this._ltxRefUploadSlot,
          enabled8 = this._ltxRefUploadAnchorNodeId;
        if (!error4 || !refSlot2 || !enabled8) {
          this._ltxRefUploadInput.value = '';
          return;
        }
        try {
          const value21 = window.currentProjectId || 'default_v2_project',
            assetId2 = await uploadFile(error4, value21),
            src2 = assetId2?.url || '';
          if (!src2) throw new Error(aigenVideoNodeText('upload.noFileUrl'));
          const value22 = appStore.getState(),
            box2 = value22.nodes?.[enabled8];
          if (!box2) throw new Error(aigenVideoNodeText('upload.anchorMissing'));
          const localPath2 = pickResultLocalPath(assetId2) || urlToLocalPath(src2),
            fixedInputSlotKind2 = getFixedInputSlotKind(box2, refSlot2),
            enabled9 = fixedInputSlotKind2 === 'image',
            enabled10 = fixedInputSlotKind2 === 'video',
            sourceKind2 = fixedInputSlotKind2 === 'audio';
          if (enabled9 && !error4.type.startsWith('image/'))
            throw new Error(aigenVideoNodeText('upload.imageOnly'));
          if (enabled10 && !error4.type.startsWith('video/'))
            throw new Error(aigenVideoNodeText('upload.videoOnly'));
          if (sourceKind2 && !error4.type.startsWith('audio/'))
            throw new Error(aigenVideoNodeText('upload.audioOnly'));
          if (!enabled9 && !enabled10 && !sourceKind2)
            throw new Error(aigenVideoNodeText('upload.unsupportedAsset'));
          const type2 = sourceKind2 ? 'source-audio' : enabled10 ? 'source-video' : 'source-image';
          let width2 = sourceKind2 ? 0x140 : enabled10 ? 0x168 : 0x12c,
            height2 = sourceKind2 ? 140 : enabled10 ? 220 : 0x12c;
          if (enabled9) {
            const image2 = new Image();
            await new Promise((handler3) => {
              ((image2.onload = () => {
                const value23 = image2.naturalWidth || 0x104,
                  value24 = image2.naturalHeight || 0x104,
                  value25 = Math.min(value23, value24),
                  value26 = 0x12c / (value25 || 1);
                ((width2 = Math.round(value23 * value26)),
                  (height2 = Math.round(value24 * value26)),
                  handler3());
              }),
                (image2.onerror = () => handler3()),
                (image2.src = src2));
            });
          }
          const {
              spacing: spacing2,
              direction: direction2,
              avoidOverlap: avoidOverlap2,
            } = getNodeSpawnPrefs(),
            value27 = direction2 === 'down' ? 'down' : 'left',
            value28 = Number(box2.x) || 0,
            value29 = Number(box2.y) || 0,
            value30 = Number(box2.width) || 0x168,
            value31 = Number(box2.height) || 0x168,
            x3 = value28 - spacing2 - width2,
            y2 =
              value27 === 'down'
                ? value29 + value31 + spacing2
                : value29 + Math.round((value31 - height2) / 2),
            x4 = avoidOverlap2
              ? findAvailablePosition(value22.nodes || {}, x3, y2, width2, height2, spacing2, value27)
              : { x: x3, y: y2 },
            map2 = getFixedInputSlotsToReplace(box2, refSlot2);
          (appStore.batch(() => {
            const value32 = appStore.getIncomingEdges(this.nodeId);
            for (const value33 of value32) {
              if (map2.has(String(value33?.refSlot || ''))) appStore.removeEdge(value33.id);
            }
            const id2 = generateId('node'),
              error5 = {
                id: id2,
                type: type2,
                x: x4.x,
                y: x4.y,
                width: width2,
                height: height2,
                src: src2,
                localPath: localPath2,
                assetId: assetId2.assetId || '',
                originalLocalPath: assetId2.originalLocalPath || assetId2.localPath || '',
                posterLocalPath: assetId2.posterLocalPath || '',
                waveformLocalPath: assetId2.waveformLocalPath || '',
                derivativeStatus: assetId2.derivativeStatus || assetId2.status || '',
                mediaTaskId: assetId2.mediaTaskId || '',
                mediaTaskKind: assetId2.mediaTaskKind || '',
                mediaTaskStatus: assetId2.mediaTaskStatus || '',
                mediaTaskProgress: Number(assetId2.mediaTaskProgress || 0) || 0,
                mediaTaskError: assetId2.mediaTaskError || '',
                fileName: assetId2.filename || error4.name || '',
              };
            (sourceKind2 && (error5.name = error4.name || aigenVideoNodeText('inputNames.sourceAudio')),
              enabled10 && (error5.name = error4.name || aigenVideoNodeText('inputNames.sourceVideo')),
              removeCoveredAssetInputRefForConnection({
                targetId: this.nodeId,
                sourceKind: sourceKind2 ? 'audio' : enabled10 ? 'video' : 'image',
                refSlot: refSlot2,
              }),
              appStore.addNode(error5),
              appStore.addEdge({
                id: generateId('edge'),
                sourceId: id2,
                targetId: this.nodeId,
                refSlot: refSlot2,
              }),
              appStore.setSelectedNodes([this.nodeId]));
          }),
            this._updateSubmitButtonState());
        } catch (error6) {
          window.showToast?.(error6?.message || aigenVideoNodeText('upload.failedRetry'), 'error');
        } finally {
          ((this._ltxRefUploadInput.value = ''),
            (this._ltxRefUploadSlot = ''),
            (this._ltxRefUploadAnchorNodeId = ''));
        }
      }),
      this.refBarEl.addEventListener('click', (event6) => {
        const el5 = event6.target.closest('.rh-v5-ref-box');
        if (!el5) return;
        const value34 = appStore.getState().nodes?.[this.nodeId],
          fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(value34 || {});
        if (!fixedInputSlotConfigFromManifest) return;
        const value35 = event6.target.closest('.ref-thumb-delete');
        if (value35) {
          (event6.stopPropagation(), event6.preventDefault());
          const value36 = el5.dataset.edgeId || '';
          value36 && (appStore.removeEdge(value36), this._updateSubmitButtonState());
          return;
        }
        (event6.stopPropagation(), event6.preventDefault());
        const enabled11 = el5.dataset.slot || '';
        if (!enabled11) return;
        const enabled12 = fixedInputSlotConfigFromManifest.slotKindById?.[enabled11] || '';
        if (!enabled12 || !fixedInputSlotConfigFromManifest.visibleSlots.includes(enabled11)) return;
        const fixedInputAcceptForKind = getFixedInputAcceptForKind(enabled12);
        if (enabled12 === 'audio') {
          ((this._ltxRefUploadSlot = enabled11),
            (this._ltxRefUploadAnchorNodeId = this.nodeId),
            (this._ltxRefUploadInput.accept = fixedInputAcceptForKind),
            this._ltxRefUploadInput.click());
          return;
        }
        ((this._v5RefUploadSlot = enabled11),
          (this._v5RefUploadAnchorNodeId = this.nodeId),
          (this._v5RefUploadInput.accept = fixedInputAcceptForKind),
          this._v5RefUploadInput.click());
      }));
    const el6 = document.createElement('div');
    ((el6.className = 'prompt-input-wrapper'),
      el6.classList.add('is-resizable'),
      (this._promptInputWrap = el6),
      (this.promptEl = document.createElement('div')),
      (this.promptEl.className = 'prompt-textarea custom-textarea'),
      (this.promptEl.contentEditable = 'true'),
      (this.promptEl.spellcheck = false),
      (this.promptEl.dataset.placeholder = aigenVideoNodeText('prompt.placeholder')),
      (this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
      this.promptEl.addEventListener('input', (value37) => {
        (schedulePromptHtmlCommit(this),
          this._checkAtTrigger(value37),
          checkSlashTrigger(value37, {
            promptEl: this.promptEl,
            nodeType: this._data.type,
            nodeId: this.nodeId,
            onGenerate: (value38, value39) => this._onGenerate(value38, value39),
          }),
          _syncEdgesOrderFromPills(this),
          this._updateSubmitButtonState());
      }),
      this.promptEl.addEventListener('blur', () => {
        flushPromptHtmlCommit(this);
      }),
      this.promptEl.addEventListener('mouseover', (value40) => {
        _handlePillHover(value40, this);
      }),
      this.promptEl.addEventListener('mouseout', (value41) => {
        _handlePillOut(value41, this);
      }),
      this.promptEl.addEventListener('keydown', (event7) => {
        if (handlePromptSelectAll(this, event7)) return;
        if (_handleMentionMenuKeyboard(event7)) return;
        if (handleSlashKeyboardNavigation(event7)) return;
        if (shouldSubmitPromptByKeyboard(event7)) {
          (event7.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
          return;
        }
        _handlePillKeyboard(this, event7);
      }),
      this.promptEl.addEventListener('paste', (value42) => {
        handlePromptPaste(this, value42);
      }),
      el6.appendChild(this.promptEl),
      this._syncPromptBoxSizeFromData(this._data),
      this._setupPromptBoxResize());
    this._data.prompt &&
      ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), this._initPromptPills());
    (el4.appendChild(el6),
      this._syncPromptInputVisibility(this._data),
      this._syncGenerationNodeHelpTip(),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      this._syncLocaleTexts());
    const value43 = document.createElement('div');
    ((value43.className = 'prompt-panel-footer'),
      (this.footerEl = value43),
      this._renderFooter(value43),
      el4.appendChild(value43),
      el.appendChild(el4),
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
    const value44 = el.querySelector('.node-floating-toolbar');
    return (
      bindVideoToolbarEvents(value44, this._data),
      el3 &&
        el3.addEventListener('pointerdown', (event8) => {
          const value45 = appStore.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
            value46 = document.getElementById('v2-wrap')?.classList.contains('v2-media-node-resize-enabled');
          if (!(value45 && value46)) return;
          if (event8.button !== 0) return;
          startNodeResizePreview({
            event: event8,
            nodeId: this.nodeId,
            getNode: () => appStore.getStateRaw().nodes?.[this.nodeId] || this._data,
            getViewport: () => appStore.getStateRaw().viewport,
            resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => {
              const value47 = startWidth / startHeight,
                value48 = Math.max(dx / startWidth, dy / startHeight),
                value49 = Math.max(AI_VIDEO_MIN_SIZE / startWidth, AI_VIDEO_MIN_SIZE / startHeight),
                value50 = Math.max(value49, 1 + value48),
                width3 = Math.max(AI_VIDEO_MIN_SIZE, Math.round(startWidth * value50)),
                height3 = Math.max(AI_VIDEO_MIN_SIZE, Math.round(width3 / value47));
              return { width: width3, height: height3 };
            },
            buildFinalPatch: ({ startNode: startNode }) =>
              startNode?.needsAutoResize ? { needsAutoResize: false } : {},
            applyPatch: (value51) => appStore.updateNodeData(this.nodeId, value51),
            commit: commit,
          });
        }),
      (this._attachBtnIcon = this.refBarEl.querySelector('.btn-icon')),
      this._updateSubmitButtonState(),
      el
    );
  }
  ['_initPromptPills']() {
    _rehydratePromptPills(this);
  }
  ['_syncPromptBoxSizeFromData'](value52 = this._data) {
    syncPromptBoxSizeFromData(this, value52);
  }
  ['_setupPromptBoxResize']() {
    setupPromptBoxResize(this, {
      store: appStore,
      getStateSnapshot: () =>
        typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
    });
  }
  ['_syncPromptInputVisibility'](value53 = this._data) {
    if (!this._promptInputWrap) return true;
    const value54 =
        typeof this._resolveModelExecution === 'function'
          ? this._resolveModelExecution(value53?.model, value53?.provider)
          : null,
      shouldShowVideoPromptInput2 = shouldShowVideoPromptInput(value54?.modelManifest);
    return (
      (this._promptInputWrap.hidden = !shouldShowVideoPromptInput2),
      this._promptInputWrap.classList?.toggle('is-hidden-by-model', !shouldShowVideoPromptInput2),
      this.promptEl &&
        ((this.promptEl.contentEditable = shouldShowVideoPromptInput2 ? 'true' : 'false'),
        this.promptEl.setAttribute?.('aria-hidden', shouldShowVideoPromptInput2 ? 'false' : 'true'),
        !shouldShowVideoPromptInput2 && document.activeElement === this.promptEl && this.promptEl.blur?.()),
      shouldShowVideoPromptInput2
    );
  }
  ['update'](nodeData) {
    const run2 = () => readStoreState()?.nodes?.[this.nodeId] || nodeData;
    nodeData = run2() || nodeData;
    typeof this._normalizeDreaminaNodeData === 'function'
      ? (this._data = this._normalizeDreaminaNodeData(nodeData, { syncStore: true }) || nodeData)
      : (this._data = nodeData);
    ((nodeData = run2() || this._data), (this._data = nodeData), (nodeData = this._data));
    typeof this._syncMutedStateFromNodeData === 'function' && this._syncMutedStateFromNodeData(nodeData);
    this._syncNoResultClass();
    if (shouldShowGenerationBusyUi(nodeData)) {
      this._isGenerating = true;
      if (this.previewEl) startLoading(this.previewEl);
    } else {
      if (isTerminalGenerationUiState(nodeData)) {
        ((this._isGenerating = false), stopPreviewNodeLoading(this.nodeId));
        if (this.previewEl) stopLoading(this.previewEl);
      }
    }
    const model = String(nodeData?.model || '').trim(),
      enabled13 = this._isRunninghubWorkflowModel(model, nodeData?.provider),
      fixedInputConfig = getFixedInputSlotConfigFromManifest(nodeData || {}),
      value55 = !!fixedInputConfig,
      value56 =
        (fixedInputConfig?.slotOrderByType?.video || []).includes('sourceVideo') &&
        (fixedInputConfig?.slotOrderByType?.image || []).includes('refImage');
    let inEdges = appStore.getIncomingEdges(this.nodeId);
    value55 && (inEdges = inEdges.filter((item2) => item2?.targetId === this.nodeId));
    const value57 = inEdges.length > 0;
    if (fixedInputConfig) {
      const rhBerniniFunction = buildRunningHubVideoFixedSlotSummaryPatch({
          model: model,
          nodeData: nodeData,
          slotEntries: buildVideoFixedSlotEntriesForSummary({
            fixedInputConfig: fixedInputConfig,
            inEdges: inEdges,
            nodes: readStoreState().nodes || {},
            promptEl: this.promptEl,
            nodeData: nodeData,
          }),
        }),
        value58 =
          Object.entries(rhBerniniFunction).some(([value59, value60]) => nodeData?.[value59] !== value60) ||
          (rhBerniniFunction.rhBerniniFunction &&
            nodeData?.generationParams?.rhBerniniFunction !== rhBerniniFunction.rhBerniniFunction);
      if (value58) {
        const args = { ...rhBerniniFunction };
        if (rhBerniniFunction.rhBerniniFunction) {
          const value61 = {
            ...(nodeData?.generationParams || {}),
            rhBerniniFunction: rhBerniniFunction.rhBerniniFunction,
          };
          args.generationParams = value61;
          const value62 = String(nodeData?.model || '').trim();
          value62 &&
            (args.generationParamsByModel = {
              ...(nodeData?.generationParamsByModel || {}),
              [value62]: value61,
            });
        }
        (appStore.updateNodeData(this.nodeId, args),
          (nodeData = { ...nodeData, ...args }),
          (this._data = nodeData));
      }
    }
    const videos = Array.isArray(nodeData?.videos) ? nodeData.videos : [],
      value63 = JSON.stringify({
        videos: videos.map((mediaUnavailable) => ({
          videoUrl: String(mediaUnavailable?.videoUrl || ''),
          resultUrl: String(mediaUnavailable?.resultUrl || ''),
          sourceUrl: String(mediaUnavailable?.sourceUrl || ''),
          localPath: String(mediaUnavailable?.localPath || ''),
          displayLocalPath: String(mediaUnavailable?.displayLocalPath || ''),
          originalLocalPath: String(mediaUnavailable?.originalLocalPath || ''),
          thumbId: String(mediaUnavailable?.thumbId || ''),
          thumbUrl: String(mediaUnavailable?.thumbUrl || ''),
          thumbLocalPath: String(mediaUnavailable?.thumbLocalPath || ''),
          posterUrl: String(mediaUnavailable?.posterUrl || ''),
          posterLocalPath: String(mediaUnavailable?.posterLocalPath || ''),
          error: String(mediaUnavailable?.error || ''),
          mediaUnavailable: mediaUnavailable?.mediaUnavailable === true,
          mediaUnavailableSource: String(mediaUnavailable?.mediaUnavailableSource || ''),
          videoWidth: Number(mediaUnavailable?.videoWidth || mediaUnavailable?.width || 0),
          videoHeight: Number(mediaUnavailable?.videoHeight || mediaUnavailable?.height || 0),
        })),
        videoUrl: String(nodeData?.videoUrl || ''),
        resultUrl: String(nodeData?.resultUrl || ''),
        sourceUrl: String(nodeData?.sourceUrl || ''),
        localPath: String(nodeData?.localPath || ''),
        displayLocalPath: String(nodeData?.displayLocalPath || ''),
        originalLocalPath: String(nodeData?.originalLocalPath || ''),
        thumbId: String(nodeData?.thumbId || ''),
        thumbUrl: String(nodeData?.thumbUrl || ''),
        thumbLocalPath: String(nodeData?.thumbLocalPath || ''),
        posterUrl: String(nodeData?.posterUrl || ''),
        posterLocalPath: String(nodeData?.posterLocalPath || ''),
        selectedVideoWidth: Number(nodeData?.selectedVideoWidth || 0),
        selectedVideoHeight: Number(nodeData?.selectedVideoHeight || 0),
        videoWidth: Number(nodeData?.videoWidth || 0),
        videoHeight: Number(nodeData?.videoHeight || 0),
        mainVideoIndex: Number(nodeData?.mainVideoIndex || 0),
        isVideosExpanded: !!nodeData?.isVideosExpanded,
        isGenerating: nodeData?.isGenerating === true,
        jobStatus: String(nodeData?.jobStatus || ''),
        jobError: String(nodeData?.jobError || ''),
        error: String(nodeData?.error || ''),
        statusMessage: String(nodeData?.statusMessage || ''),
        rhStatus: String(nodeData?.rhStatus || ''),
        rhStatusMessage: String(nodeData?.rhStatusMessage || ''),
        rhStatusCode: String(nodeData?.rhStatusCode || ''),
        rhTaskId: String(nodeData?.rhTaskId || ''),
        rhTaskStatus: String(nodeData?.rhTaskStatus || ''),
        rhTaskStartedAt: Number(nodeData?.rhTaskStartedAt || 0),
        rhTaskRecovering: !!nodeData?.rhTaskRecovering,
        rhTaskUseOpenapiQuery: !!nodeData?.rhTaskUseOpenapiQuery,
        dreaminaSubmitId: String(nodeData?.dreaminaSubmitId || ''),
        dreaminaTaskStatus: String(nodeData?.dreaminaTaskStatus || ''),
        dreaminaTaskPhase: String(nodeData?.dreaminaTaskPhase || ''),
        dreaminaTaskLabel: String(nodeData?.dreaminaTaskLabel || ''),
        dreaminaTaskStartedAt: Number(nodeData?.dreaminaTaskStartedAt || 0),
        dreaminaTaskLastCheckedAt: Number(nodeData?.dreaminaTaskLastCheckedAt || 0),
        dreaminaTaskRecovering: !!nodeData?.dreaminaTaskRecovering,
        asyncTaskId: String(nodeData?.asyncTaskId || ''),
        asyncTaskStatus: String(nodeData?.asyncTaskStatus || ''),
        asyncTaskError: String(nodeData?.asyncTaskError || ''),
        asyncTaskRecovering: !!nodeData?.asyncTaskRecovering,
      }),
      value64 = value63 !== this._lastVideoViewSig;
    this._lastVideoViewSig = value63;
    const value65 = value57 !== this._lastHasInputConnections;
    this._lastHasInputConnections = value57;
    (value64 || value65) && this._loadVideoWhenMediaReady();
    typeof this._maybeResumeDreaminaTaskImpl === 'function' && this._maybeResumeDreaminaTaskImpl();
    typeof this._maybeResumeRunningHubTaskImpl === 'function' && this._maybeResumeRunningHubTaskImpl();
    typeof this._maybeResumeAsyncTaskImpl === 'function' && this._maybeResumeAsyncTaskImpl();
    const value66 = inEdges
        .map((item3) => String(item3?.sourceId || '') + ':' + String(item3?.refSlot || ''))
        .join('|'),
      handler4 = (value67) => {
        const enabled14 = String(value67 || '')
          .trim()
          .toLowerCase();
        return !enabled14 || enabled14 === '自适应' || enabled14 === 'auto' || enabled14 === 'adaptive';
      },
      handler5 = (value68) => {
        const value69 =
            typeof this._getDreaminaEffectiveNodeData === 'function'
              ? this._getDreaminaEffectiveNodeData(value68 || {})
              : value68 || {},
          value70 = value69?.generationParams;
        return value70 &&
          typeof value70 === 'object' &&
          !Array.isArray(value70) &&
          Object.prototype.hasOwnProperty.call(value70, 'aspectRatio')
          ? value70.aspectRatio
          : value69?.aspectRatio;
      };
    if (this._lastAdaptiveEdgeSig !== null && value66 !== this._lastAdaptiveEdgeSig) {
      const value71 = handler5(this._data);
      handler4(value71) &&
        typeof this._runAdaptiveRatio === 'function' &&
        !enabled13 &&
        setTimeout(() => {
          if (readStoreState().nodes[this.nodeId]) this._runAdaptiveRatio();
        }, 50);
    }
    ((this._lastAdaptiveEdgeSig = value66),
      (nodeData = run2() || this._data || nodeData),
      (this._data = nodeData));
    const value72 =
        typeof this._isDreaminaVideoNode === 'function' && this._isDreaminaVideoNode(nodeData)
          ? (nodeData.dreaminaRouteMode || '') +
            '|' +
            (this._getDreaminaReferenceSummary?.(nodeData)?.signature || '')
          : '',
      value73 =
        (nodeData.model || '') +
        '|' +
        (nodeData.provider || '') +
        '|' +
        (nodeData.rhSpecialMode || '') +
        '|' +
        (nodeData.rhBerniniInputMode || '') +
        '|' +
        value72;
    let value74 = false;
    this.footerEl &&
      value73 !== this._lastFooterSig &&
      ((this._lastFooterSig = value73),
      this._renderFooter(this.footerEl),
      (nodeData = run2() || this._data || nodeData),
      (this._data = nodeData),
      (value74 = true));
    if (value74 && typeof this._isDreaminaVideoNode === 'function' && this._isDreaminaVideoNode(nodeData)) {
      const storeState = readStoreState().nodes?.[this.nodeId] || this._data || {};
      handler4(handler5(storeState)) &&
        typeof this._runAdaptiveRatio === 'function' &&
        setTimeout(() => {
          if (readStoreState().nodes[this.nodeId]) this._runAdaptiveRatio();
        }, 50);
    }
    const storeState2 = readStoreState().pickConnectMode;
    if (this._placeholderEl) {
      const el7 = this._placeholderEl.querySelector('.placeholder-icon-svg');
      if (el7) {
        if (storeState2?.active && storeState2.sourceNodeId === this.nodeId)
          el7.classList.add('is-pick-connecting');
        else el7.classList.remove('is-pick-connecting');
      }
    }
    if (document.activeElement !== this.promptEl && nodeData.prompt !== undefined) {
      const sanitizePromptHtml2 = sanitizePromptHtml(nodeData.prompt || '');
      this.promptEl.innerHTML !== sanitizePromptHtml2 &&
        ((this.promptEl.innerHTML = sanitizePromptHtml2), this._initPromptPills());
    }
    typeof this._syncDreaminaPromptPlaceholder === 'function' &&
      this._syncDreaminaPromptPlaceholder(nodeData);
    this._syncPromptInputVisibility(nodeData) && this._syncPromptBoxSizeFromData(nodeData);
    (this._syncGenerationNodeHelpTip(), (inEdges = appStore.getIncomingEdges(this.nodeId)));
    value55 && (inEdges = inEdges.filter((item4) => item4?.targetId === this.nodeId));
    const storeState3 = readStoreState().nodes || {},
      value75 = inEdges
        .map((item5) => {
          const value76 = storeState3?.[item5.sourceId] || null,
            value77 =
              typeof this._getRefSourceStateKey === 'function' ? this._getRefSourceStateKey(value76) : '';
          return (
            item5.id +
            ':' +
            item5.sourceId +
            ':' +
            (item5.refSlot || '') +
            ':' +
            (item5.sourceMediaKey || '') +
            ':' +
            value77
          );
        })
        .join('|'),
      value78 = fixedInputConfig
        ? String(fixedInputConfig.visibilityLayoutKey || fixedInputConfig.visibleSlots?.join('|') || '')
        : '',
      value79 = (nodeData?.model || '') + '|' + (nodeData?.provider || '') + '|' + value78,
      value80 = String(nodeData?.rhSpecialMode || ''),
      value81 = String(nodeData?.rhSubtractSubject || '');
    if (
      value75 !== this._lastEdgeSig ||
      value79 !== this._lastRefModeSig ||
      value80 !== this._lastSpecialModeSig ||
      value81 !== this._lastSubtractSubjectSig
    ) {
      ((this._lastEdgeSig = value75),
        (this._lastRefModeSig = value79),
        (this._lastSpecialModeSig = value80),
        (this._lastSubtractSubjectSig = value81),
        this._renderRefBarWhenMediaReady());
      if (value57 && this._placeholderEl) {
        const value82 =
          (Array.isArray(nodeData?.videos) && nodeData.videos.length > 0) ||
          !!String(nodeData?.videoUrl || '').trim() ||
          !!String(nodeData?.localPath || '').trim() ||
          !!String(nodeData?.thumbId || '').trim();
        ((this._placeholderEl.style.display = value82 ? 'none' : 'flex'),
          this._setVideoOverlaysVisible(value82));
      }
      value56 && this._loadVideoWhenMediaReady();
    } else this._syncBtnIconState();
    this._updateSubmitButtonState();
    if (this.footerEl) {
      ((nodeData = run2() || this._data || nodeData), (this._data = nodeData));
      const value83 = String(nodeData?.model || '').trim(),
        value84 = this._isRunninghubWorkflowModel(value83, nodeData?.provider),
        hasRunningHubVideoWorkflowUiPlacement2 = hasRunningHubVideoWorkflowUiPlacement(
          value83,
          'videoParams',
        ),
        hasRunningHubVideoWorkflowUiPlacement3 = hasRunningHubVideoWorkflowUiPlacement(value83, 'resolution'),
        value85 = value84,
        hasRunningHubVideoWorkflowUiPlacement4 = hasRunningHubVideoWorkflowUiPlacement(
          value83,
          'videoAdvanced',
        ),
        value86 =
          typeof this._resolveModelExecution === 'function'
            ? this._resolveModelExecution(value83, nodeData?.provider)
            : null,
        enabled15 =
          value86?.modelManifest?.adapterType === 'modelApi' && value86?.modelManifest?.kind === 'video'
            ? String(value86?.canonicalModelId || value86?.modelManifest?.modelId || value83).trim()
            : '',
        value87 = !!enabled15 && hasModelUiSchema(enabled15, { placement: 'advanced' }),
        enabled16 = hasRunningHubVideoWorkflowUiPlacement4 || value87;
      if (hasRunningHubVideoWorkflowUiField(value83, 'rhMaskExpand')) {
        const enabled17 = nodeData?.rhMaskExpandTouched === true,
          count = Number(nodeData?.rhMaskExpand);
        Number.isFinite(count) &&
          count === 0 &&
          !enabled17 &&
          appStore.updateNodeData(this.nodeId, { rhMaskExpand: 25 });
      }
      const el8 = this.footerEl.querySelector('.rh-adv2-btn');
      if (el8) el8.style.display = enabled16 ? '' : 'none';
      const el9 = this.footerEl.querySelector('.ui-schema-instance-slot');
      if (el9) el9.style.display = value85 ? '' : 'none';
      const value88 =
        typeof this._getRhVideoAdvancedSchemaNodeData === 'function'
          ? this._getRhVideoAdvancedSchemaNodeData(nodeData)
          : nodeData;
      syncModelUiSchemaControls(this.footerEl, value88);
      const el10 = this.footerEl.querySelector('.img-ratio-label');
      if (el10 && !hasRunningHubVideoWorkflowUiPlacement2 && !hasRunningHubVideoWorkflowUiPlacement3) {
        if (
          typeof this._isDreaminaVideoNode === 'function' &&
          this._isDreaminaVideoNode(nodeData) &&
          typeof this._getDreaminaRatioDisplayState === 'function'
        ) {
          const value89 = this._getDreaminaRatioDisplayState(nodeData);
          el10.textContent = value89?.ratioLabelText || formatVideoNodeRatioResolutionLabel(nodeData);
          const el11 = this.footerEl.querySelector('.img-ratio-icon-slot');
          el11 &&
            typeof this._getRatioIconHTML === 'function' &&
            (el11.innerHTML = this._getRatioIconHTML(
              value89?.ratioIconLabel || nodeData?.aspectRatio || '自适应',
            ));
        } else el10.textContent = formatVideoNodeRatioResolutionLabel(nodeData);
      }
      const el12 = this.footerEl.querySelector('.rh-vram-adv-panel');
      if (el12 && !enabled16) el12.classList.remove('show');
    }
  }
  ['_syncBtnIconStateImpl']() {
    const storeState4 = readStoreState().pickConnectMode,
      el13 = this.refBarEl?.querySelector('.btn-icon');
    if (!el13) return;
    storeState4?.active && storeState4.sourceNodeId === this.nodeId
      ? ((el13.style.opacity = '0'), (el13.style.transform = 'scale(0.4)'))
      : ((el13.style.opacity = '1'), (el13.style.transform = 'scale(1)'));
  }
  ['_checkAtTrigger'](value90) {
    return _checkAtTrigger(this, value90);
  }
  ['_populateMentionMenu'](x5, y3, triggerRange, pillToEdit = null, query = '', atIndex = -1) {
    return _populateMentionMenu(this, {
      x: x5,
      y: y3,
      triggerRange: triggerRange,
      pillToEdit: pillToEdit,
      query: query,
      atIndex: atIndex,
    });
  }
  ['_insertMentionPill'](label, nodeId, triggerRange2, atIndex2 = -1) {
    return _insertMentionPill(this, {
      label: label,
      nodeId: nodeId,
      triggerRange: triggerRange2,
      atIndex: atIndex2,
    });
  }
  ['_handlePillKeyboard'](value91) {
    return _handlePillKeyboard(this, value91);
  }
  ['_getGenerationNodeHelpText']() {
    const key2 = String(this._data?.model || '').trim();
    return getGenerationNodeHelpTooltip({
      kind: 'video',
      key: key2,
      model: key2,
      label: getDisplayModelName(key2),
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
      this.previewEl?.querySelectorAll('video').forEach((item6) => {
        try {
          item6.pause();
        } catch {}
        (item6.removeAttribute('src'), item6.load?.());
      });
    } catch {}
    for (const value92 of this._cachedVideoUrls.values()) {
      if (value92 && String(value92).startsWith('blob:'))
        try {
          URL.revokeObjectURL(value92);
        } catch {}
    }
    this._cachedVideoUrls.clear();
    const value93 = [this._fixedSlotRefThumbObjectUrls, this._refThumbObjectUrls];
    for (const map3 of value93) {
      if (!(map3 && typeof map3.entries === 'function')) continue;
      for (const value94 of map3.values()) {
        if (value94 && String(value94).startsWith('blob:'))
          try {
            URL.revokeObjectURL(value94);
          } catch {}
      }
      try {
        map3.clear();
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
function applyClassPrototypeMethods(value95, enabled18) {
  if (!enabled18) return;
  const value96 = Object.getOwnPropertyDescriptors(enabled18);
  (delete value96.constructor, Object.defineProperties(value95, value96));
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
