import appStore from '../core/stores/appStore.js';
import { shouldPreserveGenerationTaskOnUnmount } from '../core/generationTaskRuntime.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import { fetchVideoMetaFromServer } from '../../api/videoMetaApi.js';
import {
  buildGenerateVideoRequest,
  cancelRunningHubVideoTask,
  generateVideo,
  probeDreaminaVideoTask,
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
import { buildCanvasLocalImageFields } from '../services/canvasMediaLocalService.js';
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
import { checkLocalMediaExists, saveOutputBlob, uploadFile } from '../modules/project.js';
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
import { shouldSkipPromptTriggerForBulkInput } from '../modules/promptTriggerComposition.js';
import { clearVirtualizedPromptCommit } from '../modules/promptPasteVirtualization.js';
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
import { createPromptPresetTriggerController } from './promptPresetTrigger.js';
import { attachNodePromptExpansion } from './nodePromptExpansion.js';
import { createModelProviderProfileControl } from './shared/modelProviderProfileControl.js';
import { syncModelUiSchemaControls } from './aigenImage/uiSchemaRenderer.js';
import { buildUiSchemaVisibilitySignature } from './aigenImage/uiSchemaVisibility.js';
import {
  disposeImageSchemaRatioResizeAnimation,
  GENERATION_MANUAL_DISPLAY_SIZE_FIELD,
} from './shared/generationDisplayPolicy.js';
import { createVideoNodeParameterPanelModule } from './video-node/parameterPanelModule.js';
import { shouldShowVideoPromptInput } from './video-node/parameterPanelPresentationPolicy.js';
import {
  hasRunningHubVideoWorkflowUiField,
  hasRunningHubVideoWorkflowUiPlacement,
} from './video-node/runningHubVideoUiSchema.js';
import { createVideoNodeTaskOrchestrationModule } from './video-node/taskOrchestrationModule.js';
import { createVideoNodeResultRenderModule } from './video-node/resultRenderModule.js';
import { createVideoNodePreviewControlsModule } from './video-node/previewControlsModule.js';
import {
  hydrateDeferredVideoNodeToolbar,
  hydrateVideoNodeDeferredDetails,
  initializeVideoNodePromptDetailsOnMount,
  renderInitialVideoNodeFooter,
  disposeVideoNodePromptDetails,
} from './video-node/deferredDetailsHydration.js';
import { createVideoNodeUpdatePerf } from './video-node/videoNodeUpdatePerf.js';
import {
  buildVideoNodeFooterControlSig,
  buildVideoNodePromptBoxSizeSig,
  buildVideoNodePromptUiSig,
  buildVideoNodeSubmitButtonSig,
  buildVideoNodeVideoViewSig,
} from './video-node/videoNodeUpdateSignatures.js';
import { initializeVideoNodeMediaRuntimeState } from './video-node/mediaRuntimeState.js';
import { setupPromptBoxResize, syncPromptBoxSizeFromData } from './promptBoxResizeUi.js';
import { createVideoPromptEditorElements } from './video-node/promptInputSurface.js';
import { mountSegmentRetakeController } from './video-node/segmentRetakeController.js';
import {
  decorateSegmentRetakeParameterNodeData,
  isSegmentRetakeEditing,
} from '../modules/videoRetake/segmentRetakeModelPolicy.js';
import { syncNodeFooterAdvancedButtonState } from './shared/nodeFooterControls.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { createPromptAttachmentButtonHTML } from './refAttachmentButton.js';
import { getFixedInputSlotConfigFromManifest } from '../modules/fixedInputAssetRefs.js';
import {
  getFixedInputAcceptForKind,
  getFixedInputSlotKind,
  getFixedInputSlotsToReplace,
} from './video-node/fixedInputSlotHelpers.js';
import { syncVideoNodeFixedInputSummary } from './video-node/fixedInputSummarySync.js';
import { getGenerationRatioMediaSize } from '../modules/generationRatioSource.js';
const VIDEO_VIP_MODEL_ID_SET = new Set(VIDEO_VIP_MODEL_IDS),
  VIDEO_VIP_MODEL_NAME_MAP = VIDEO_VIP_MODEL_IDS['reduce']((value, item) => {
    return ((value[item] = getVipModelDisplayName(item)), value);
  }, {});
let _vipSessionRecheckDone = ![];
const AI_VIDEO_MIN_SIZE = 150,
  api = {
    buildGenerateVideoRequest: buildGenerateVideoRequest,
    cancelRunningHubWorkflowTask: cancelRunningHubVideoTask,
    fetchVideoFirstFrameThumbFromServer: fetchVideoFirstFrameThumbFromServer,
    fetchVideoMetaFromServer: fetchVideoMetaFromServer,
    generateVideo: generateVideo,
    probeDreaminaVideoTask: probeDreaminaVideoTask,
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
  const enabled = String(options?.['aspectRatio'] || '')['trim'](),
    result =
      !enabled || enabled === '自适应' || enabled === 'auto' || enabled === 'adaptive'
        ? getVideoAdaptiveRatioLabel()
        : enabled;
  return result + ' · ' + (options?.['resolution'] || '1080p');
}
function readStoreState() {
  return typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
}
function isTerminalGenerationUiState(data) {
  return isTaskTerminal(data);
}
function isVideoVipModel(target, source = '') {
  return isVipModel(target, source);
}
function getVideoVipModelName(next, current = '') {
  const vipGateModelId = resolveVipGateModelId(next, current);
  return VIDEO_VIP_MODEL_NAME_MAP[vipGateModelId] || vipGateModelId || aigenVideoNodeText('vip.modelFallback');
}
async function ensureVipSessionRecheck(entry, record = '') {
  if (!isVideoVipModel(entry, record)) return;
  if (_vipSessionRecheckDone) return;
  _vipSessionRecheckDone = !![];
  if (typeof window['refreshSubscriptionState'] === 'function')
    try {
      await window['refreshSubscriptionState']();
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
  checkLocalMediaExists: checkLocalMediaExists,
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
  readStoreState: readStoreState,
};
export class AIGenVideoNode {
  constructor(payload) {
    ((this['_data'] = payload),
      (this['nodeId'] = payload['id']),
      (this['previewEl'] = null),
      (this['videoEl'] = null),
      (this['refBarEl'] = null),
      (this['promptEl'] = null),
      (this['btnEl'] = null),
      (this['footerEl'] = null),
      (this['_promptPanel'] = null),
      (this['_promptInputWrap'] = null),
      (this['_promptResizeHandle'] = null),
      (this['_isPromptBoxResizing'] = ![]),
      (this['_promptResizeCleanup'] = null),
      (this['_qualityBtns'] = []),
      (this['_attachBtnIcon'] = null),
      (this['_lastImgKey'] = null),
      (this['_lastFooterSig'] = null),
      (this['_lastFooterControlSig'] = null),
      (this['_lastPromptContentSig'] = null),
      (this['_lastPromptUiSig'] = null),
      (this['_lastPromptBoxSizeSig'] = null),
      (this['_lastSubmitButtonSig'] = null),
      (this['_lastEdgeSig'] = null),
      (this['_lastRefModeSig'] = ''),
      (this['_v5RefUploadInput'] = null),
      (this['_v5RefUploadSlot'] = ''),
      (this['_v5RefUploadAnchorNodeId'] = ''),
      (this['_fixedSlotRefThumbObjectUrls'] = new Map()),
      (this['_ltxRefUploadInput'] = null),
      (this['_ltxRefUploadSlot'] = ''),
      (this['_ltxRefUploadAnchorNodeId'] = ''),
      (this['_adaptiveSrcRetryToken'] = 0),
      (this['_refThumbObjectUrls'] = new Map()),
      (this['_lastSpecialModeSig'] = ''),
      (this['_lastSubtractSubjectSig'] = ''),
      (this['_renderRefBarLock'] = null),
      (this['_renderRefBarPending'] = ![]),
      (this['_ratioAnimTimer'] = null),
      (this['_ratioFlipAnim'] = null),
      (this['_rhAbortController'] = null),
      (this['_rhTaskId'] = null),
      (this['_rhApiKey'] = null),
      (this['_rhCancelRequested'] = ![]),
      (this['_rhResumeAbortController'] = null),
      (this['_rhResumeTaskId'] = ''),
      (this['_rhResumePromise'] = null),
      (this['_asyncResumeAbortController'] = null),
      (this['_asyncResumeTaskId'] = ''),
      (this['_asyncResumePromise'] = null),
      (this['_statusOverlayEl'] = null),
      (this['_lastAdaptiveEdgeSig'] = null),
      (this['_lastVideoViewSig'] = null),
      (this['_lastHasInputConnections'] = null),
      initializeVideoNodeMediaRuntimeState(this, payload, appStore),
      (this['_vipSelectionRetryInProgress'] = ![]),
      (this['_assetMentionRegistryUnsubscribe'] = null),
      (this['_assetMentionRegistryRefreshPending'] = ![]),
      (this['_generationNodeHelpTip'] = null),
      (this['_modelProviderProfileControl'] = null),
      (this['_uiSchemaCleanup'] = null),
      (this['_footerControllerCleanup'] = null),
      (this['_videoSubmitInFlight'] = ![]),
      (this['_unsubscribeLocale'] = null),
      (this['_videoToolbarCleanup'] = null));
  }
  get ['isNoResult']() {
    return !hasDisplayableVideoResult(this['_data']);
  }
  ['_syncNoResultClass']() {
    if (!this['_root']?.['classList']) return;
    this['isNoResult']
      ? this['_root']['classList']['add']('no-result')
      : this['_root']['classList']['remove']('no-result');
  }
  ['_syncLocaleTexts']() {
    (this['promptEl'] &&
      (this['promptEl']['dataset']['placeholder'] = aigenVideoNodeText('prompt.placeholder')),
      this['_promptPanel']
        ?.['querySelector']('.generation-node-help-tip')
        ?.['setAttribute']('aria-label', aigenVideoNodeText('help.ariaLabel')),
      this['_syncPreviewControlLocaleTexts']?.());
  }
  ['_deferVideoMediaRefresh']() {
    this['_deferredVideoViewRefreshPending'] = !![];
    const enabled2 = this['_showDeferredVideoPosterPreview']?.() === !![];
    (!enabled2 && this['_placeholderEl'] && (this['_placeholderEl']['style']['display'] = 'flex'),
      this['_setVideoOverlaysVisible']?.(![]));
  }
  ['_loadVideoWhenMediaReady']() {
    const handle =
      this['_rendererMediaDeferred'] === !![] && !this['_mustRenderTerminalVideoState']?.(this['_data']);
    if (handle) return this['_deferVideoMediaRefresh']();
    this['_loadAndDisplayVideo']();
  }
  ['_schedulePreviewVideoOverlays']() {
    const state = () => {
      this['_rendererMediaDeferred'] !== !![] &&
        this['previewEl']?.['isConnected'] !== ![] &&
        this['_ensurePreviewVideoOverlays']();
    };
    typeof globalThis['requestIdleCallback'] === 'function'
      ? globalThis['requestIdleCallback'](state, { timeout: 1200 })
      : (globalThis['requestAnimationFrame'] || globalThis['setTimeout'])(state);
  }
  ['_renderRefBarWhenMediaReady']() {
    if (this['_rendererMediaDeferred'] === !![] || this['_rendererDetailsDeferred'] === !![])
      this['_renderRefBarPendingWhenVisible'] = !![];
    else this['_renderRefBar']();
  }
  ['mount']() {
    (this['_videoToolbarCleanup']?.(), (this['_videoToolbarCleanup'] = null));
    typeof this['_normalizeDreaminaNodeData'] === 'function' &&
      (this['_data'] =
        this['_normalizeDreaminaNodeData'](this['_data'], { syncStore: !![] }) || this['_data']);
    const root = document['createElement']('div');
    if (this['isNoResult']) root['classList']['add']('no-result');
    ((this['_root'] = root), root['classList']['add']('aigen-node-root', 'aigen-video-root'));
    this['_rendererThinVideoHydration'] === !![]
      ? (this['_deferredToolbarMarkupPending'] = !![])
      : (root['innerHTML'] = VIDEO_TOOLBAR_HTML);
    ((this['previewEl'] = document['createElement']('div')),
      (this['previewEl']['className'] = 'img-node-preview aigen-node-preview-fill aigen-video-preview'));
    const el = document['createElement']('div');
    ((el['className'] = 'img-node-placeholder'),
      Object['assign'](el['style'], {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        userSelect: 'none',
      }),
      (el['innerHTML'] =
        '\n            <svg class="placeholder-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="transition:all 0.2s;">\n                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>\n            </svg>'),
      this['previewEl']['appendChild'](el),
      (this['_placeholderEl'] = el),
      syncPreviewNodeLoading(
        this['nodeId'],
        this['previewEl'],
        this['_getPreviewGenerateButtonLoadingOptions']?.(),
      ));
    if (this['_rendererMediaDeferred'] !== !![]) {
      if (this['_rendererThinVideoHydration'] !== !![]) this['_ensurePreviewVideoOverlays']();
    }
    root['appendChild'](this['previewEl']);
    const el2 = document['createElement']('div');
    ((el2['className'] = 'node-resizer'), root['appendChild'](el2));
    !isSegmentRetakeEditing(this['_data']) && this['_loadVideoWhenMediaReady']();
    typeof this['_maybeResumeDreaminaTaskImpl'] === 'function' &&
      queueMicrotask(() => {
        readStoreState()['nodes']?.[this['nodeId']] && this['_maybeResumeDreaminaTaskImpl']();
      });
    typeof this['_maybeResumeRunningHubTaskImpl'] === 'function' &&
      queueMicrotask(() => {
        readStoreState()['nodes']?.[this['nodeId']] && this['_maybeResumeRunningHubTaskImpl']();
      });
    typeof this['_maybeResumeAsyncTaskImpl'] === 'function' &&
      queueMicrotask(() => {
        readStoreState()['nodes']?.[this['nodeId']] && this['_maybeResumeAsyncTaskImpl']();
      });
    (this['previewEl']['addEventListener']('mouseenter', () => {
      this['activatePreviewHoverPlayback']();
    }),
      this['previewEl']['addEventListener']('mouseleave', () => {
        const storeState = readStoreState(),
          config = storeState['videoClip'];
        if (config && config['active'] && config['nodeId'] === this['nodeId']) return;
        const scope = storeState['nodes'][this['nodeId']] || this['_data'] || {};
        if (scope['isVideosExpanded']) return;
        this['_deactivatePreviewHoverPlayback']();
      }));
    const panel = document['createElement']('div');
    ((panel['className'] = 'text-prompt-panel'),
      (this['_promptPanel'] = panel),
      panel['addEventListener']('pointerdown', (event) => {
        event['stopPropagation']();
      }),
      (this['refBarEl'] = document['createElement']('div')),
      (this['refBarEl']['className'] = 'node-ref-bar'),
      (this['refBarEl']['innerHTML'] = createPromptAttachmentButtonHTML({ stroke: 'var(--white-90)' })),
      panel['appendChild'](this['refBarEl']),
      this['refBarEl']['addEventListener']('pointerdown', (event2) => {
        if (event2['target']['closest']('.prompt-attachment-btn, .ref-thumb-wrap, .ref-thumb-delete'))
          event2['stopPropagation']();
      }),
      this['refBarEl']['addEventListener']('click', (event3) => {
        if (handleRefThumbDeleteClick(this, event3)) return;
        const enabled3 = event3['target']['closest']('.prompt-attachment-btn');
        if (!enabled3) return;
        (event3['stopPropagation'](), event3['preventDefault']());
        const input = appStore['getState']()['pickConnectMode'];
        input?.['active'] && input['sourceNodeId'] === this['nodeId']
          ? appStore['setPickConnectMode']({ active: ![] })
          : appStore['setPickConnectMode']({
              active: !![],
              sourceNodeId: this['nodeId'],
              handleDirection: 'left',
            });
      }),
      (this['_unbindRefThumbHoverPreview'] = bindRefThumbHoverPreview(this['refBarEl'])),
      (this['_v5RefUploadInput'] = document['createElement']('input')),
      (this['_v5RefUploadInput']['type'] = 'file'),
      (this['_v5RefUploadInput']['accept'] = '*/*'),
      (this['_v5RefUploadInput']['style']['display'] = 'none'),
      panel['appendChild'](this['_v5RefUploadInput']),
      this['_v5RefUploadInput']['addEventListener']('change', async (event4) => {
        const error = event4['target']['files']?.[0],
          refSlot = this['_v5RefUploadSlot'],
          enabled4 = this['_v5RefUploadAnchorNodeId'];
        if (!error || !refSlot || !enabled4) {
          this['_v5RefUploadInput']['value'] = '';
          return;
        }
        try {
          const output = window['currentProjectId'] || 'default_v2_project',
            assetId = await uploadFile(error, output),
            src = assetId?.['url'] || '';
          if (!src) throw new Error(aigenVideoNodeText('upload.noFileUrl'));
          const state2 = appStore['getState'](),
            box = state2['nodes']?.[enabled4];
          if (!box) throw new Error(aigenVideoNodeText('upload.anchorMissing'));
          const localPath = pickResultLocalPath(assetId) || urlToLocalPath(src),
            fixedInputSlotKind = getFixedInputSlotKind(box, refSlot),
            sourceKind = fixedInputSlotKind === 'video',
            enabled5 = fixedInputSlotKind === 'image';
          if (sourceKind && !error['type']['startsWith']('video/'))
            throw new Error(aigenVideoNodeText('upload.videoOnly'));
          if (enabled5 && !error['type']['startsWith']('image/'))
            throw new Error(aigenVideoNodeText('upload.imageOnly'));
          if (!sourceKind && !enabled5) throw new Error(aigenVideoNodeText('upload.unsupportedAsset'));
          const type = sourceKind ? 'source-video' : 'source-image';
          let width = 300,
            height = 300;
          if (sourceKind) {
            const value2 = document['createElement']('video');
            ((value2['src'] = URL['createObjectURL'](error)),
              await new Promise((handler) => {
                ((value2['onloadedmetadata'] = () => {
                  const value3 = value2['videoWidth'] || 420,
                    value4 = value2['videoHeight'] || 260,
                    value5 = Math['min'](value3, value4),
                    value6 = 300 / (value5 || 1);
                  ((width = Math['round'](value3 * value6)),
                    (height = Math['round'](value4 * value6)),
                    URL['revokeObjectURL'](value2['src']),
                    handler());
                }),
                  (value2['onerror'] = () => {
                    (URL['revokeObjectURL'](value2['src']), handler());
                  }));
              }));
          } else {
            if (enabled5) {
              const image = new Image();
              await new Promise((handler2) => {
                ((image['onload'] = () => {
                  const value7 = image['naturalWidth'] || 260,
                    value8 = image['naturalHeight'] || 260,
                    value9 = Math['min'](value7, value8),
                    value10 = 300 / (value9 || 1);
                  ((width = Math['round'](value7 * value10)),
                    (height = Math['round'](value8 * value10)),
                    handler2());
                }),
                  (image['onerror'] = () => {
                    handler2();
                  }),
                  (image['src'] = src));
              });
            }
          }
          const { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
            value11 = direction === 'down' ? 'down' : 'left',
            value12 = Number(box['x']) || 0,
            value13 = Number(box['y']) || 0,
            value14 = Number(box['width']) || 360,
            value15 = Number(box['height']) || 360,
            x = value12 - spacing - width,
            y =
              value11 === 'down'
                ? value13 + value15 + spacing
                : value13 + Math['round']((value15 - height) / 2),
            x2 = avoidOverlap
              ? findAvailablePosition(
                  state2['nodes'] || {},
                  x,
                  y,
                  width,
                  height,
                  spacing,
                  value11,
                )
              : { x: x, y: y },
            map = getFixedInputSlotsToReplace(box, refSlot);
          (appStore['batch'](() => {
            const value16 = appStore['getIncomingEdges'](this['nodeId']);
            for (const value17 of value16) {
              if (map['has'](String(value17?.['refSlot'] || '')))
                appStore['removeEdge'](value17['id']);
            }
            const id = generateId('node'),
              error2 = {
                id: id,
                type: type,
                x: x2['x'],
                y: x2['y'],
                width: width,
                height: height,
                src: src,
                localPath: localPath,
                assetId: assetId['assetId'] || '',
                originalLocalPath: assetId['originalLocalPath'] || assetId['localPath'] || '',
                posterLocalPath: assetId['posterLocalPath'] || '',
                waveformLocalPath: assetId['waveformLocalPath'] || '',
                derivativeStatus: assetId['derivativeStatus'] || assetId['status'] || '',
                mediaTaskId: assetId['mediaTaskId'] || '',
                mediaTaskKind: assetId['mediaTaskKind'] || '',
                mediaTaskStatus: assetId['mediaTaskStatus'] || '',
                mediaTaskProgress: Number(assetId['mediaTaskProgress'] || 0) || 0,
                mediaTaskError: assetId['mediaTaskError'] || '',
                fileName: assetId['filename'] || error['name'] || '',
                thumbUrl: assetId['posterUrl'] || assetId['thumbUrl'] || null,
                ...(!sourceKind ? buildCanvasLocalImageFields(assetId, { includeSrc: !![] }) : {}),
              };
            if (sourceKind)
              error2['name'] =
                error['name'] ||
                (refSlot === 'videoMask'
                  ? aigenVideoNodeText('inputNames.maskVideo')
                  : aigenVideoNodeText('inputNames.sourceVideo'));
            (removeCoveredAssetInputRefForConnection({
              targetId: this['nodeId'],
              sourceKind: sourceKind ? 'video' : 'image',
              refSlot: refSlot,
            }),
              appStore['addNode'](error2),
              appStore['addEdge']({
                id: generateId('edge'),
                sourceId: id,
                targetId: this['nodeId'],
                refSlot: refSlot,
              }),
              appStore['setSelectedNodes']([this['nodeId']]));
          }),
            this['_updateSubmitButtonState']());
          if (sourceKind)
            try {
              const videoThumbSrc = localPathToUrl(localPath),
                response = await fetchVideoFirstFrameThumbFromServer(videoThumbSrc),
                thumbUrl = String(response?.['url'] || '')['trim']();
              if (thumbUrl) {
                const value18 = appStore['getState']()['nodes']?.[newNodeId];
                if (value18)
                  appStore['updateNodeData'](newNodeId, { thumbUrl: thumbUrl, videoThumbSrc: videoThumbSrc });
              }
            } catch {}
          if (!sourceKind) {
          }
        } catch (error3) {
          window['showToast']?.(error3?.['message'] || aigenVideoNodeText('upload.failedRetry'), 'error');
        } finally {
          ((this['_v5RefUploadInput']['value'] = ''),
            (this['_v5RefUploadSlot'] = ''),
            (this['_v5RefUploadAnchorNodeId'] = ''));
        }
      }),
      (this['_ltxRefUploadInput'] = document['createElement']('input')),
      (this['_ltxRefUploadInput']['type'] = 'file'),
      (this['_ltxRefUploadInput']['accept'] = '*/*'),
      (this['_ltxRefUploadInput']['style']['display'] = 'none'),
      panel['appendChild'](this['_ltxRefUploadInput']),
      this['_ltxRefUploadInput']['addEventListener']('change', async (event5) => {
        const error4 = event5['target']['files']?.[0],
          refSlot2 = this['_ltxRefUploadSlot'],
          enabled6 = this['_ltxRefUploadAnchorNodeId'];
        if (!error4 || !refSlot2 || !enabled6) {
          this['_ltxRefUploadInput']['value'] = '';
          return;
        }
        try {
          const value19 = window['currentProjectId'] || 'default_v2_project',
            assetId2 = await uploadFile(error4, value19),
            src2 = assetId2?.['url'] || '';
          if (!src2) throw new Error(aigenVideoNodeText('upload.noFileUrl'));
          const state3 = appStore['getState'](),
            box2 = state3['nodes']?.[enabled6];
          if (!box2) throw new Error(aigenVideoNodeText('upload.anchorMissing'));
          const localPath2 = pickResultLocalPath(assetId2) || urlToLocalPath(src2),
            fixedInputSlotKind2 = getFixedInputSlotKind(box2, refSlot2),
            enabled7 = fixedInputSlotKind2 === 'image',
            enabled8 = fixedInputSlotKind2 === 'video',
            sourceKind2 = fixedInputSlotKind2 === 'audio';
          if (enabled7 && !error4['type']['startsWith']('image/'))
            throw new Error(aigenVideoNodeText('upload.imageOnly'));
          if (enabled8 && !error4['type']['startsWith']('video/'))
            throw new Error(aigenVideoNodeText('upload.videoOnly'));
          if (sourceKind2 && !error4['type']['startsWith']('audio/'))
            throw new Error(aigenVideoNodeText('upload.audioOnly'));
          if (!enabled7 && !enabled8 && !sourceKind2)
            throw new Error(aigenVideoNodeText('upload.unsupportedAsset'));
          const type2 = sourceKind2 ? 'source-audio' : enabled8 ? 'source-video' : 'source-image';
          let width2 = sourceKind2 ? 320 : enabled8 ? 360 : 300,
            height2 = sourceKind2 ? 140 : enabled8 ? 220 : 300;
          if (enabled7) {
            const image2 = new Image();
            await new Promise((handler3) => {
              ((image2['onload'] = () => {
                const value20 = image2['naturalWidth'] || 260,
                  value21 = image2['naturalHeight'] || 260,
                  value22 = Math['min'](value20, value21),
                  value23 = 300 / (value22 || 1);
                ((width2 = Math['round'](value20 * value23)),
                  (height2 = Math['round'](value21 * value23)),
                  handler3());
              }),
                (image2['onerror'] = () => handler3()),
                (image2['src'] = src2));
            });
          }
          const { spacing: spacing2, direction: direction2, avoidOverlap: avoidOverlap2 } = getNodeSpawnPrefs(),
            value24 = direction2 === 'down' ? 'down' : 'left',
            value25 = Number(box2['x']) || 0,
            value26 = Number(box2['y']) || 0,
            value27 = Number(box2['width']) || 360,
            value28 = Number(box2['height']) || 360,
            x3 = value25 - spacing2 - width2,
            y2 =
              value24 === 'down'
                ? value26 + value28 + spacing2
                : value26 + Math['round']((value28 - height2) / 2),
            x4 = avoidOverlap2
              ? findAvailablePosition(
                  state3['nodes'] || {},
                  x3,
                  y2,
                  width2,
                  height2,
                  spacing2,
                  value24,
                )
              : { x: x3, y: y2 },
            map2 = getFixedInputSlotsToReplace(box2, refSlot2);
          (appStore['batch'](() => {
            const value29 = appStore['getIncomingEdges'](this['nodeId']);
            for (const value30 of value29) {
              if (map2['has'](String(value30?.['refSlot'] || '')))
                appStore['removeEdge'](value30['id']);
            }
            const id2 = generateId('node'),
              error5 = {
                id: id2,
                type: type2,
                x: x4['x'],
                y: x4['y'],
                width: width2,
                height: height2,
                src: src2,
                localPath: localPath2,
                assetId: assetId2['assetId'] || '',
                originalLocalPath: assetId2['originalLocalPath'] || assetId2['localPath'] || '',
                posterLocalPath: assetId2['posterLocalPath'] || '',
                waveformLocalPath: assetId2['waveformLocalPath'] || '',
                derivativeStatus: assetId2['derivativeStatus'] || assetId2['status'] || '',
                mediaTaskId: assetId2['mediaTaskId'] || '',
                mediaTaskKind: assetId2['mediaTaskKind'] || '',
                mediaTaskStatus: assetId2['mediaTaskStatus'] || '',
                mediaTaskProgress: Number(assetId2['mediaTaskProgress'] || 0) || 0,
                mediaTaskError: assetId2['mediaTaskError'] || '',
                fileName: assetId2['filename'] || error4['name'] || '',
              };
            if (!sourceKind2 && !enabled8)
              Object['assign'](error5, buildCanvasLocalImageFields(assetId2, { includeSrc: !![] }));
            (sourceKind2 &&
              (error5['name'] = error4['name'] || aigenVideoNodeText('inputNames.sourceAudio')),
              enabled8 &&
                (error5['name'] = error4['name'] || aigenVideoNodeText('inputNames.sourceVideo')),
              removeCoveredAssetInputRefForConnection({
                targetId: this['nodeId'],
                sourceKind: sourceKind2 ? 'audio' : enabled8 ? 'video' : 'image',
                refSlot: refSlot2,
              }),
              appStore['addNode'](error5),
              appStore['addEdge']({
                id: generateId('edge'),
                sourceId: id2,
                targetId: this['nodeId'],
                refSlot: refSlot2,
              }),
              appStore['setSelectedNodes']([this['nodeId']]));
          }),
            this['_updateSubmitButtonState']());
        } catch (error6) {
          window['showToast']?.(error6?.['message'] || aigenVideoNodeText('upload.failedRetry'), 'error');
        } finally {
          ((this['_ltxRefUploadInput']['value'] = ''),
            (this['_ltxRefUploadSlot'] = ''),
            (this['_ltxRefUploadAnchorNodeId'] = ''));
        }
      }),
      this['refBarEl']['addEventListener']('click', (event6) => {
        const el3 = event6['target']['closest']('.rh-v5-ref-box');
        if (!el3) return;
        const value31 = appStore['getState']()['nodes']?.[this['nodeId']],
          fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(value31 || {});
        if (!fixedInputSlotConfigFromManifest) return;
        const value32 = event6['target']['closest']('.ref-thumb-delete');
        if (value32) {
          (event6['stopPropagation'](), event6['preventDefault']());
          const value33 = el3['dataset']['edgeId'] || '';
          value33 && (appStore['removeEdge'](value33), this['_updateSubmitButtonState']());
          return;
        }
        (event6['stopPropagation'](), event6['preventDefault']());
        const enabled9 = el3['dataset']['slot'] || '';
        if (!enabled9) return;
        const enabled10 = fixedInputSlotConfigFromManifest['slotKindById']?.[enabled9] || '';
        if (!enabled10 || !fixedInputSlotConfigFromManifest['visibleSlots']['includes'](enabled9)) return;
        const fixedInputAcceptForKind = getFixedInputAcceptForKind(enabled10);
        if (enabled10 === 'audio') {
          ((this['_ltxRefUploadSlot'] = enabled9),
            (this['_ltxRefUploadAnchorNodeId'] = this['nodeId']),
            (this['_ltxRefUploadInput']['accept'] = fixedInputAcceptForKind),
            this['_ltxRefUploadInput']['click']());
          return;
        }
        ((this['_v5RefUploadSlot'] = enabled9),
          (this['_v5RefUploadAnchorNodeId'] = this['nodeId']),
          (this['_v5RefUploadInput']['accept'] = fixedInputAcceptForKind),
          this['_v5RefUploadInput']['click']());
      }));
    const { inputWrap: inputWrap, promptEl: promptEl } = createVideoPromptEditorElements({
      documentObject: document,
      placeholder: aigenVideoNodeText('prompt.placeholder'),
    });
    ((this['_promptInputWrap'] = inputWrap),
      (this['promptEl'] = promptEl),
      (this['_flushPromptHtmlCommit'] = () => flushPromptHtmlCommit(this)),
      this['promptEl']['addEventListener']('input', (value34) => {
        (schedulePromptHtmlCommit(this),
          this['_checkAtTrigger'](value34),
          checkSlashTrigger(value34, {
            promptEl: this['promptEl'],
            nodeType: this['_data']['type'],
            nodeId: this['nodeId'],
            onGenerate: (value35, value36) => this['_onGenerate'](value35, value36),
          }));
        if (shouldSkipPromptTriggerForBulkInput(value34)) return;
        (_syncEdgesOrderFromPills(this), this['_updateSubmitButtonState']());
      }),
      this['promptEl']['addEventListener']('blur', () => {
        flushPromptHtmlCommit(this);
      }),
      this['promptEl']['addEventListener']('mouseover', (value37) => {
        _handlePillHover(value37, this);
      }),
      this['promptEl']['addEventListener']('mouseout', (value38) => {
        _handlePillOut(value38, this);
      }),
      this['promptEl']['addEventListener']('keydown', (event7) => {
        if (handlePromptSelectAll(this, event7)) return;
        if (_handleMentionMenuKeyboard(event7)) return;
        if (handleSlashKeyboardNavigation(event7)) return;
        if (shouldSubmitPromptByKeyboard(event7)) {
          (event7['preventDefault'](), flushPromptHtmlCommit(this), this['btnEl']?.['click']());
          return;
        }
        _handlePillKeyboard(this, event7);
      }),
      this['promptEl']['addEventListener']('paste', (value39) => {
        handlePromptPaste(this, value39);
      }),
      panel['appendChild'](inputWrap),
      (this['_promptPresetTrigger'] = createPromptPresetTriggerController({
        panel: panel,
        getPromptEl: () => this['promptEl'],
        getNodeType: () => this['_data']?.['type'],
        getNodeId: () => this['nodeId'],
        onGenerate: (value40, value41) => this['_onGenerate'](value40, value41),
      })),
      this['_unsubscribeLocale']?.(),
      (this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']())),
      initializeVideoNodePromptDetailsOnMount(this, { sanitizePromptHtml: sanitizePromptHtml }),
      (this['_data'] =
        syncVideoNodeFixedInputSummary({
          nodeId: this['nodeId'],
          nodeData: this['_data'],
          promptEl: this['promptEl'],
          syncStore: ![],
        })['nodeData'] || this['_data']));
    const value42 = document['createElement']('div');
    ((value42['className'] = 'prompt-panel-footer'),
      (this['footerEl'] = value42),
      renderInitialVideoNodeFooter(this, value42),
      panel['appendChild'](value42),
      root['appendChild'](panel),
      attachNodePromptExpansion(this, { panel: panel }));
    isSegmentRetakeEditing(this['_data']) &&
      mountSegmentRetakeController(this, { root: root, promptPanel: panel });
    this['_renderRefBarWhenMediaReady']();
    !this['_rendererDetailsDeferred'] && this['_syncInitialUpdateSignatures'](this['_data']);
    (this['_assetMentionRegistryUnsubscribe']?.(),
      (this['_assetMentionRegistryUnsubscribe'] = subscribeAssetMentionRegistry(() => {
        if (this['_assetMentionRegistryRefreshPending']) return;
        ((this['_assetMentionRegistryRefreshPending'] = !![]),
          queueMicrotask(() => {
            this['_assetMentionRegistryRefreshPending'] = ![];
            if (!appStore['getState']()['nodes']?.[this['nodeId']]) return;
            if (this['_rendererDetailsDeferred']) return;
            (_rehydratePromptPills(this), this['_renderRefBar'](), this['_updateSubmitButtonState']());
          }));
      })));
    const value43 = root['querySelector']('.node-floating-toolbar');
    if (this['_rendererDetailsDeferred']) this['_deferredToolbarEl'] = value43;
    else this['_videoToolbarCleanup'] = bindVideoToolbarEvents(value43, this['_data']);
    el2 &&
      el2['addEventListener']('pointerdown', (event8) => {
        const value44 = appStore['getStateRaw']()['ui']?.['imageVideoNodeResizeEnabled'] === !![],
          value45 = document['getElementById']('v2-wrap')?.['classList']['contains'](
            'v2-media-node-resize-enabled',
          );
        if (!(value44 && value45)) return;
        if (event8['button'] !== 0) return;
        startNodeResizePreview({
          event: event8,
          nodeId: this['nodeId'],
          getNode: () => appStore['getStateRaw']()['nodes']?.[this['nodeId']] || this['_data'],
          getViewport: () => appStore['getStateRaw']()['viewport'],
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => {
            const value46 = startWidth / startHeight,
              value47 = Math['max'](dx / startWidth, dy / startHeight),
              value48 = Math['max'](AI_VIDEO_MIN_SIZE / startWidth, AI_VIDEO_MIN_SIZE / startHeight),
              value49 = Math['max'](value48, 1 + value47),
              width3 = Math['max'](AI_VIDEO_MIN_SIZE, Math['round'](startWidth * value49)),
              height3 = Math['max'](AI_VIDEO_MIN_SIZE, Math['round'](width3 / value46));
            return { width: width3, height: height3 };
          },
          buildFinalPatch: ({ startNode: startNode, startSize: startSize, finalSize: finalSize }) => {
            const value50 =
              Math['round'](Number(startSize?.['width']) || 0) !==
                Math['round'](Number(finalSize?.['width']) || 0) ||
              Math['round'](Number(startSize?.['height']) || 0) !==
                Math['round'](Number(finalSize?.['height']) || 0);
            return {
              ...(startNode?.['needsAutoResize'] ? { needsAutoResize: ![] } : {}),
              ...(value50 ? { [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: !![] } : {}),
            };
          },
          applyPatch: (value51) => appStore['updateNodeData'](this['nodeId'], value51),
          commit: commit,
        });
      });
    this['_attachBtnIcon'] = this['refBarEl']['querySelector']('.btn-icon');
    if (!this['_rendererDetailsDeferred']) this['_updateSubmitButtonState']();
    return root;
  }
  ['_initPromptPills']() {
    _rehydratePromptPills(this);
  }
  ['_syncPromptBoxSizeFromData'](value52 = this['_data']) {
    syncPromptBoxSizeFromData(this, value52);
  }
  ['_setupPromptBoxResize']() {
    setupPromptBoxResize(this, {
      store: appStore,
      getStateSnapshot: () =>
        typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState'](),
    });
  }
  ['_syncPromptInputVisibility'](value53 = this['_data']) {
    if (!this['_promptInputWrap']) return !![];
    const value54 =
        typeof this['_resolveModelExecution'] === 'function'
          ? this['_resolveModelExecution'](value53?.['model'], value53?.['provider'])
          : null,
      shouldShowVideoPromptInput2 = shouldShowVideoPromptInput(value54?.['modelManifest']);
    this['_promptInputWrap']['hidden'] !== !shouldShowVideoPromptInput2 && (this['_promptInputWrap']['hidden'] = !shouldShowVideoPromptInput2);
    this['_promptInputWrap']['classList']?.['contains']?.('is-hidden-by-model') !== !shouldShowVideoPromptInput2 &&
      this['_promptInputWrap']['classList']?.['toggle']('is-hidden-by-model', !shouldShowVideoPromptInput2);
    if (this['promptEl']) {
      const value55 = shouldShowVideoPromptInput2 ? 'true' : 'false',
        value56 = shouldShowVideoPromptInput2 ? 'false' : 'true';
      (this['promptEl']['contentEditable'] !== value55 && (this['promptEl']['contentEditable'] = value55),
        this['promptEl']['getAttribute']?.('aria-hidden') !== value56 &&
          this['promptEl']['setAttribute']?.('aria-hidden', value56),
        !shouldShowVideoPromptInput2 && document['activeElement'] === this['promptEl'] && this['promptEl']['blur']?.());
    }
    return shouldShowVideoPromptInput2;
  }
  ['_buildFooterSig'](value57 = this['_data']) {
    const value58 =
      typeof this['_isDreaminaVideoNode'] === 'function' && this['_isDreaminaVideoNode'](value57)
        ? (value57['dreaminaRouteMode'] || '') +
          '|' +
          (this['_getDreaminaReferenceSummary']?.(value57)?.['signature'] || '')
        : '';
    return (
      (value57['model'] || '') +
      '|' +
      (value57['provider'] || '') +
      '|' +
      (value57['rhSpecialMode'] || '') +
      '|' +
      (value57['rhBerniniInputMode'] || '') +
      '|' +
      value58 +
      '|' +
      (value57?.['segmentRetake']?.['phase'] || '') +
      '|' +
      buildUiSchemaVisibilitySignature(value57['model'], value57)
    );
  }
  ['refreshModelRegistryUi']() {
    if (this['_rendererDetailsDeferred'] === !![] || !this['footerEl']) return ![];
    return (
      this['_renderFooter'](this['footerEl']),
      (this['_lastFooterSig'] = this['_buildFooterSig'](this['_data'])),
      this['_updateSubmitButtonState'](),
      !![]
    );
  }
  ['_buildRefBarSignatures'](value59 = this['_data'], value60 = null) {
    let inEdges = appStore['getIncomingEdges'](this['nodeId']);
    value60 && (inEdges = inEdges['filter']((value61) => value61?.['targetId'] === this['nodeId']));
    const storeState2 = readStoreState()['nodes'] || {},
      sig = inEdges['map']((value62) => {
        const value63 = storeState2?.[value62['sourceId']] || null,
          value64 =
            typeof this['_getRefSourceStateKey'] === 'function'
              ? this['_getRefSourceStateKey'](value63, value62)
              : '';
        return (
          value62['id'] +
          ':' +
          value62['sourceId'] +
          ':' +
          (value62['refSlot'] || '') +
          ':' +
          (value62['sourceMediaKey'] || '') +
          ':' +
          value64
        );
      })['join']('|'),
      value65 = value60
        ? String(value60['visibilityLayoutKey'] || value60['visibleSlots']?.['join']('|') || '')
        : '';
    return {
      inEdges: inEdges,
      sig: sig,
      refModeSig: (value59?.['model'] || '') + '|' + (value59?.['provider'] || '') + '|' + value65,
      specialModeSig: String(value59?.['rhSpecialMode'] || ''),
      subtractSubjectSig: String(value59?.['rhSubtractSubject'] || ''),
    };
  }
  ['_syncInitialUpdateSignatures'](nodeData = this['_data']) {
    const syncVideoNodeFixedInputSummary2 = syncVideoNodeFixedInputSummary({
        nodeId: this['nodeId'],
        nodeData: nodeData || {},
        promptEl: this['promptEl'],
        syncStore: ![],
      }),
      value66 = syncVideoNodeFixedInputSummary2['nodeData'] || nodeData || {},
      value67 = syncVideoNodeFixedInputSummary2['fixedInputConfig'],
      value68 = this['_buildRefBarSignatures'](value66, value67),
      value69 = this['_buildFooterSig'](value66),
      value70 =
        typeof this['_getRhVideoAdvancedSchemaNodeData'] === 'function'
          ? this['_getRhVideoAdvancedSchemaNodeData'](value66)
          : value66;
    ((this['_data'] = value66),
      (this['_lastVideoViewSig'] = buildVideoNodeVideoViewSig(value66)),
      (this['_lastHasInputConnections'] = value68['inEdges']['length'] > 0),
      (this['_lastFooterSig'] = value69),
      (this['_lastEdgeSig'] = value68['sig']),
      (this['_lastRefModeSig'] = value68['refModeSig']),
      (this['_lastSpecialModeSig'] = value68['specialModeSig']),
      (this['_lastSubtractSubjectSig'] = value68['subtractSubjectSig']),
      (this['_lastPromptUiSig'] = buildVideoNodePromptUiSig(value66)),
      (this['_lastPromptBoxSizeSig'] = buildVideoNodePromptBoxSizeSig(value66)));
    if (value66['prompt'] !== undefined) this['_lastPromptContentSig'] = String(value66['prompt'] || '');
    ((this['_lastSubmitButtonSig'] = buildVideoNodeSubmitButtonSig(value66, value68['sig'], {
      rhCancelInFlight: this['_rhCancelInFlight'],
    })),
      (this['_lastFooterControlSig'] = buildVideoNodeFooterControlSig(value70, value69)));
  }
  ['update'](nodeData2) {
    const run = () => readStoreState()?.['nodes']?.[this['nodeId']] || nodeData2;
    nodeData2 = run() || nodeData2;
    typeof this['_normalizeDreaminaNodeData'] === 'function'
      ? (this['_data'] = this['_normalizeDreaminaNodeData'](nodeData2, { syncStore: !![] }) || nodeData2)
      : (this['_data'] = nodeData2);
    ((nodeData2 = run() || this['_data']), (this['_data'] = nodeData2), (nodeData2 = this['_data']));
    const videoNodeUpdatePerf = createVideoNodeUpdatePerf();
    typeof this['_syncMutedStateFromNodeData'] === 'function' &&
      this['_syncMutedStateFromNodeData'](nodeData2);
    this['_syncNoResultClass']();
    if (shouldShowGenerationBusyUi(nodeData2)) {
      this['_isGenerating'] = !![];
      if (this['previewEl']) startLoading(this['previewEl']);
    } else {
      if (isTerminalGenerationUiState(nodeData2)) {
        ((this['_isGenerating'] = ![]), stopPreviewNodeLoading(this['nodeId']));
        if (this['previewEl']) stopLoading(this['previewEl']);
      }
    }
    videoNodeUpdatePerf?.['mark']('state');
    const syncVideoNodeFixedInputSummary3 = syncVideoNodeFixedInputSummary({
      nodeId: this['nodeId'],
      nodeData: nodeData2,
      promptEl: this['promptEl'],
      syncStore: !![],
    });
    ((nodeData2 = syncVideoNodeFixedInputSummary3['nodeData'] || nodeData2), (this['_data'] = nodeData2));
    const value71 = syncVideoNodeFixedInputSummary3['fixedInputConfig'],
      value72 =
        (value71?.['slotOrderByType']?.['video'] || [])['includes']('sourceVideo') &&
        (value71?.['slotOrderByType']?.['image'] || [])['includes']('refImage');
    let list = syncVideoNodeFixedInputSummary3['inEdges'] || appStore['getIncomingEdges'](this['nodeId']);
    const value73 = list['length'] > 0,
      videoNodeVideoViewSig = buildVideoNodeVideoViewSig(nodeData2),
      value74 = videoNodeVideoViewSig !== this['_lastVideoViewSig'];
    this['_lastVideoViewSig'] = videoNodeVideoViewSig;
    const value75 = value73 !== this['_lastHasInputConnections'];
    this['_lastHasInputConnections'] = value73;
    !isSegmentRetakeEditing(nodeData2) && (value74 || value75) && this['_loadVideoWhenMediaReady']();
    typeof this['_maybeResumeDreaminaTaskImpl'] === 'function' && this['_maybeResumeDreaminaTaskImpl']();
    typeof this['_maybeResumeRunningHubTaskImpl'] === 'function' && this['_maybeResumeRunningHubTaskImpl']();
    typeof this['_maybeResumeAsyncTaskImpl'] === 'function' && this['_maybeResumeAsyncTaskImpl']();
    videoNodeUpdatePerf?.['mark']('media-task');
    const storeState3 = readStoreState()['nodes'] || {},
      value76 = list['map']((value77) => {
        const value78 = storeState3?.[value77?.['sourceId']] || null,
          box3 = getGenerationRatioMediaSize(value78, value77, { includeNodeFrame: !![] });
        return [
          value77?.['id'],
          value77?.['sourceId'],
          value77?.['refSlot'],
          value77?.['sourceMediaKey'],
          value78?.['_bizRev'],
          value78?.['thumbId'],
          value78?.['mainImageIndex'],
          value78?.['mainVideoIndex'],
          box3?.['width'],
          box3?.['height'],
          value78?.['localPath'],
          value78?.['imageUrl'],
          value78?.['videoUrl'],
        ]
          ['map']((value79) => value79 ?? '')
          ['join'](':');
      })['join']('|'),
      handler4 = (value80) => {
        const enabled11 = String(value80 || '')
          ['trim']()
          ['toLowerCase']();
        return !enabled11 || enabled11 === '自适应' || enabled11 === 'auto' || enabled11 === 'adaptive';
      },
      handler5 = (value81) => {
        const value82 =
            typeof this['_getDreaminaEffectiveNodeData'] === 'function'
              ? this['_getDreaminaEffectiveNodeData'](value81 || {})
              : value81 || {},
          value83 = value82?.['generationParams'];
        return value83 &&
          typeof value83 === 'object' &&
          !Array['isArray'](value83) &&
          Object['prototype']['hasOwnProperty']['call'](value83, 'aspectRatio')
          ? value83['aspectRatio']
          : value82?.['aspectRatio'];
      };
    if (this['_lastAdaptiveEdgeSig'] !== null && value76 !== this['_lastAdaptiveEdgeSig']) {
      const value84 = handler5(this['_data']);
      handler4(value84) &&
        typeof this['_runAdaptiveRatio'] === 'function' &&
        setTimeout(() => {
          if (readStoreState()['nodes'][this['nodeId']]) this['_runAdaptiveRatio']();
        }, 50);
    }
    ((this['_lastAdaptiveEdgeSig'] = value76),
      (nodeData2 = run() || this['_data'] || nodeData2),
      (this['_data'] = nodeData2));
    const value85 = this['_buildFooterSig'](nodeData2),
      value86 = this['_lastFooterSig'];
    let value87 = ![];
    this['_rendererDetailsDeferred'] !== !![] &&
      this['footerEl'] &&
      value85 !== value86 &&
      (videoNodeUpdatePerf?.['detail']('footerSigFrom', value86),
      videoNodeUpdatePerf?.['detail']('footerSigTo', value85),
      (this['_lastFooterSig'] = value85),
      this['_renderFooter'](this['footerEl']),
      (nodeData2 = run() || this['_data'] || nodeData2),
      (this['_data'] = nodeData2),
      (value87 = !![]));
    if (value87) {
      const storeState4 = readStoreState()['nodes']?.[this['nodeId']] || this['_data'] || {};
      handler4(handler5(storeState4)) &&
        typeof this['_runAdaptiveRatio'] === 'function' &&
        setTimeout(() => {
          if (readStoreState()['nodes'][this['nodeId']]) this['_runAdaptiveRatio']();
        }, 50);
    }
    videoNodeUpdatePerf?.['mark']('footer-render');
    const storeState5 = readStoreState()['pickConnectMode'];
    if (this['_placeholderEl']) {
      const el4 = this['_placeholderEl']['querySelector']('.placeholder-icon-svg');
      if (el4) {
        if (storeState5?.['active'] && storeState5['sourceNodeId'] === this['nodeId'])
          el4['classList']['add']('is-pick-connecting');
        else el4['classList']['remove']('is-pick-connecting');
      }
    }
    if (
      this['_rendererDetailsDeferred'] !== !![] &&
      document['activeElement'] !== this['promptEl'] &&
      nodeData2['prompt'] !== undefined &&
      String(nodeData2['prompt'] || '') !== this['_lastPromptContentSig']
    ) {
      const sanitizePromptHtml2 = sanitizePromptHtml(nodeData2['prompt'] || '');
      (this['promptEl']['innerHTML'] !== sanitizePromptHtml2 &&
        (clearVirtualizedPromptCommit(this),
        (this['promptEl']['innerHTML'] = sanitizePromptHtml2),
        this['_initPromptPills']()),
        (this['_lastPromptContentSig'] = String(nodeData2['prompt'] || '')));
    }
    const videoNodePromptUiSig = buildVideoNodePromptUiSig(nodeData2);
    videoNodePromptUiSig !== this['_lastPromptUiSig'] &&
      (videoNodeUpdatePerf?.['detail']('promptUiSigFrom', this['_lastPromptUiSig']),
      videoNodeUpdatePerf?.['detail']('promptUiSigTo', videoNodePromptUiSig),
      (this['_lastPromptUiSig'] = videoNodePromptUiSig),
      this['_rendererDetailsDeferred'] !== !![] &&
        (typeof this['_syncDreaminaPromptPlaceholder'] === 'function' &&
          this['_syncDreaminaPromptPlaceholder'](nodeData2),
        this['_syncPromptInputVisibility'](nodeData2),
        this['_syncGenerationNodeHelpTip']()));
    this['_rendererDetailsDeferred'] !== !![] && this['_syncModelProviderProfileControl']();
    const videoNodePromptBoxSizeSig = buildVideoNodePromptBoxSizeSig(nodeData2);
    videoNodePromptBoxSizeSig !== this['_lastPromptBoxSizeSig'] &&
      (videoNodeUpdatePerf?.['detail']('promptBoxSizeSigFrom', this['_lastPromptBoxSizeSig']),
      videoNodeUpdatePerf?.['detail']('promptBoxSizeSigTo', videoNodePromptBoxSizeSig),
      (this['_lastPromptBoxSizeSig'] = videoNodePromptBoxSizeSig),
      this['_rendererDetailsDeferred'] !== !![] && this['_syncPromptBoxSizeFromData'](nodeData2));
    videoNodeUpdatePerf?.['mark']('prompt-ui');
    const value88 = this['_buildRefBarSignatures'](nodeData2, value71);
    list = value88['inEdges'];
    const {
      sig: sig2,
      refModeSig: refModeSig,
      specialModeSig: specialModeSig,
      subtractSubjectSig: subtractSubjectSig,
    } = value88;
    if (
      sig2 !== this['_lastEdgeSig'] ||
      refModeSig !== this['_lastRefModeSig'] ||
      specialModeSig !== this['_lastSpecialModeSig'] ||
      subtractSubjectSig !== this['_lastSubtractSubjectSig']
    ) {
      ((this['_lastEdgeSig'] = sig2),
        (this['_lastRefModeSig'] = refModeSig),
        (this['_lastSpecialModeSig'] = specialModeSig),
        (this['_lastSubtractSubjectSig'] = subtractSubjectSig),
        this['_renderRefBarWhenMediaReady']());
      if (value73 && this['_placeholderEl']) {
        const hasDisplayableVideoResult2 = hasDisplayableVideoResult(nodeData2),
          enabled12 = this['_mustRenderTerminalVideoState'](nodeData2),
          value89 = !isSegmentRetakeEditing(nodeData2) && !hasDisplayableVideoResult2 && !enabled12;
        ((this['_placeholderEl']['style']['display'] = value89 ? 'flex' : 'none'),
          this['_setVideoOverlaysVisible'](hasDisplayableVideoResult2 && !enabled12));
      }
      value72 && this['_loadVideoWhenMediaReady']();
    } else this['_syncBtnIconState']();
    videoNodeUpdatePerf?.['mark']('refbar');
    const videoNodeSubmitButtonSig = buildVideoNodeSubmitButtonSig(nodeData2, sig2, {
      rhCancelInFlight: this['_rhCancelInFlight'],
    });
    (videoNodeSubmitButtonSig !== this['_lastSubmitButtonSig'] || value87) &&
      ((this['_lastSubmitButtonSig'] = videoNodeSubmitButtonSig), this['_updateSubmitButtonState']());
    const value90 = !!this['footerEl'] && this['_rendererDetailsDeferred'] !== !![],
      decorateSegmentRetakeParameterNodeData2 = decorateSegmentRetakeParameterNodeData(
        value90 && typeof this['_getRhVideoAdvancedSchemaNodeData'] === 'function'
          ? this['_getRhVideoAdvancedSchemaNodeData'](nodeData2)
          : nodeData2,
      ),
      value91 = value90
        ? buildVideoNodeFooterControlSig(decorateSegmentRetakeParameterNodeData2, value85)
        : this['_lastFooterControlSig'];
    if (value90 && (value87 || value91 !== this['_lastFooterControlSig'])) {
      ((this['_lastFooterControlSig'] = value91),
        (nodeData2 = run() || this['_data'] || nodeData2),
        (this['_data'] = nodeData2));
      const value92 = String(nodeData2?.['model'] || '')['trim'](),
        value93 = this['_isRunninghubWorkflowModel'](value92, nodeData2?.['provider']),
        hasRunningHubVideoWorkflowUiPlacement2 = hasRunningHubVideoWorkflowUiPlacement(value92, 'videoParams'),
        hasRunningHubVideoWorkflowUiPlacement3 = hasRunningHubVideoWorkflowUiPlacement(value92, 'resolution'),
        value94 = value93,
        enabled13 =
          typeof this['_hasVisibleVideoAdvancedControls'] === 'function'
            ? this['_hasVisibleVideoAdvancedControls'](nodeData2)
            : ![];
      if (hasRunningHubVideoWorkflowUiField(value92, 'rhMaskExpand')) {
        const enabled14 = nodeData2?.['rhMaskExpandTouched'] === !![],
          count = Number(nodeData2?.['rhMaskExpand']);
        Number['isFinite'](count) &&
          count === 0 &&
          !enabled14 &&
          appStore['updateNodeData'](this['nodeId'], { rhMaskExpand: 25 });
      }
      const el5 = this['footerEl']['querySelector']('.rh-adv2-btn');
      el5 && ((el5['hidden'] = !enabled13), (el5['style']['display'] = ''));
      const el6 = this['footerEl']['querySelector']('.ui-schema-instance-slot');
      if (el6) el6['style']['display'] = value94 ? '' : 'none';
      syncModelUiSchemaControls(this['footerEl'], decorateSegmentRetakeParameterNodeData2);
      const el7 = this['footerEl']['querySelector']('.img-ratio-label');
      if (el7 && !hasRunningHubVideoWorkflowUiPlacement2 && !hasRunningHubVideoWorkflowUiPlacement3) {
        if (
          typeof this['_isDreaminaVideoNode'] === 'function' &&
          this['_isDreaminaVideoNode'](nodeData2) &&
          typeof this['_getDreaminaRatioDisplayState'] === 'function'
        ) {
          const value95 = this['_getDreaminaRatioDisplayState'](nodeData2);
          el7['textContent'] =
            value95?.['ratioLabelText'] || formatVideoNodeRatioResolutionLabel(nodeData2);
          const el8 = this['footerEl']['querySelector']('.img-ratio-icon-slot');
          el8 &&
            typeof this['_getRatioIconHTML'] === 'function' &&
            (el8['innerHTML'] = this['_getRatioIconHTML'](
              value95?.['ratioIconLabel'] || nodeData2?.['aspectRatio'] || '自适应',
            ));
        } else el7['textContent'] = formatVideoNodeRatioResolutionLabel(nodeData2);
      }
      const el9 = this['footerEl']['querySelector']('.rh-vram-adv-panel');
      if (el9 && !enabled13) el9['classList']['remove']('show');
      syncNodeFooterAdvancedButtonState(this['footerEl']);
    }
    (videoNodeUpdatePerf?.['mark']('controls'),
      this['_segmentRetakeController']?.['update']?.(nodeData2),
      (this['_lastUpdatePerfBreakdown'] = videoNodeUpdatePerf?.['finish']() || null));
  }
  ['_syncBtnIconStateImpl']() {
    const storeState6 = readStoreState()['pickConnectMode'],
      el10 = this['refBarEl']?.['querySelector']('.btn-icon');
    if (!el10) return;
    storeState6?.['active'] && storeState6['sourceNodeId'] === this['nodeId']
      ? ((el10['style']['opacity'] = '0'), (el10['style']['transform'] = 'scale(0.4)'))
      : ((el10['style']['opacity'] = '1'), (el10['style']['transform'] = 'scale(1)'));
  }
  ['_checkAtTrigger'](value96) {
    return _checkAtTrigger(this, value96);
  }
  ['_populateMentionMenu'](
    x5,
    y3,
    triggerRange,
    pillToEdit = null,
    query = '',
    atIndex = -1,
  ) {
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
  ['_handlePillKeyboard'](value97) {
    return _handlePillKeyboard(this, value97);
  }
  ['_getGenerationNodeHelpText']() {
    const key2 = String(this['_data']?.['model'] || '')['trim']();
    return getGenerationNodeHelpTooltip({
      kind: 'video',
      key: key2,
      model: key2,
      label: getDisplayModelName(key2),
      nodeData: this['_data'] || {},
    });
  }
  ['_ensureGenerationNodeHelpTip']() {
    if (this['_generationNodeHelpTip'] || !this['_promptPanel']) return this['_generationNodeHelpTip'];
    return (
      (this['_generationNodeHelpTip'] = createGenerationNodeHelpTipController({
        panel: this['_promptPanel'],
        getHelpText: () => this['_getGenerationNodeHelpText'](),
        ariaLabel: aigenVideoNodeText('help.ariaLabel'),
      })),
      this['_generationNodeHelpTip']
    );
  }
  ['_syncGenerationNodeHelpTip']() {
    this['_ensureGenerationNodeHelpTip']()?.['sync']();
  }
  ['_ensureModelProviderProfileControl']() {
    if (this['_modelProviderProfileControl'] || !this['_promptPanel'])
      return this['_modelProviderProfileControl'];
    return (
      (this['_modelProviderProfileControl'] = createModelProviderProfileControl({
        panel: this['_promptPanel'],
        getNodeData: () => readStoreState()['nodes']?.[this['nodeId']] || this['_data'] || {},
        onChange: (value98) => appStore['updateNodeData'](this['nodeId'], value98),
      })),
      this['_modelProviderProfileControl']
    );
  }
  ['_syncModelProviderProfileControl']() {
    this['_ensureModelProviderProfileControl']()?.['sync']();
  }
  ['prepareRendererVisibleVideoPreview']() {
    return ((this['_rendererEagerVideoPreview'] = ![]), ![]);
  }
  ['getRendererMediaState']() {
    return {
      deferred: this['_rendererMediaDeferred'] === !![],
      interactionActive: !!(
        this['_isHovered'] ||
        this['_isManualControl'] ||
        this['_isManualLoopPlayback'] ||
        this['_isSeeking']
      ),
    };
  }
  ['hydrateDeferredMedia']() {
    if (this['_rendererMediaDeferred'] !== !![]) return;
    ((this['_rendererMediaDeferred'] = ![]),
      (this['_rendererEagerVideoPreview'] = ![]),
      (this['_data'] = readStoreState()?.['nodes']?.[this['nodeId']] || this['_data']),
      (this['_deferredVideoViewRefreshPending'] = ![]),
      this['_loadAndDisplayVideo'](),
      this['_schedulePreviewVideoOverlays'](),
      this['_renderRefBarPendingWhenVisible'] &&
        this['_rendererDetailsDeferred'] !== !![] &&
        ((this['_renderRefBarPendingWhenVisible'] = ![]), this['_renderRefBar']()),
      this['_updateSubmitButtonState']());
  }
  ['_hydrateDeferredToolbarEvents']() {
    return (
      !this['_deferredToolbarEl'] &&
        this['_deferredToolbarMarkupPending'] === !![] &&
        this['_root']?.['insertAdjacentHTML'] &&
        (this['_root']['insertAdjacentHTML']('afterbegin', VIDEO_TOOLBAR_HTML),
        (this['_deferredToolbarEl'] = this['_root']['querySelector']?.('.node-floating-toolbar')),
        (this['_deferredToolbarMarkupPending'] = ![])),
      hydrateDeferredVideoNodeToolbar(this, bindVideoToolbarEvents)
    );
  }
  ['hydrateDeferredDetails']() {
    hydrateVideoNodeDeferredDetails(this, {
      readStoreState: readStoreState,
      sanitizePromptHtml: sanitizePromptHtml,
    });
  }
  ['unmount']() {
    (this['_segmentRetakeController']?.['dispose']?.(),
      (this['_segmentRetakeController'] = null),
      (this['_videoRenderEpoch'] += 1),
      (this['_videoSourceAttachToken'] += 1),
      (this['_autoPlayToken'] += 1),
      (this['_fullscreenOpenEpoch'] = Number(this['_fullscreenOpenEpoch'] || 0) + 1),
      (this['_pendingFullscreenResultIdentity'] = ''),
      (this['_isHovered'] = ![]),
      (this['_previewHoverActivationPending'] = ![]),
      this['_cancelPreviewHoverRetryTimers']?.(),
      this['_hoverPlaybackLifecycle']?.['dispose']?.(),
      (this['_hoverPlaybackResumeState'] = null),
      this['_disposeVideoProgressInteraction']?.(),
      this['_videoToolbarCleanup']?.(),
      (this['_videoToolbarCleanup'] = null),
      (this['_deferredToolbarEl'] = null),
      (this['_deferredToolbarMarkupPending'] = ![]));
    try {
      this['_activeFullscreenCleanup']?.();
    } catch {}
    ((this['_activeFullscreenCleanup'] = null),
      (this['_activeFullscreenVideoEl'] = null),
      (this['_activeFullscreenResultIdentity'] = ''),
      this['_releaseLocalVideoPlaybackObjectUrl']?.());
    const shouldPreserveGenerationTaskOnUnmount2 = shouldPreserveGenerationTaskOnUnmount(this['nodeId']);
    (disposeImageSchemaRatioResizeAnimation(this, { nodeId: this['nodeId'], previewEl: this['previewEl'] }),
      this['_flushPromptHtmlCommit']?.(),
      this['_unsubscribeLocale']?.(),
      (this['_unsubscribeLocale'] = null),
      this['_assetMentionRegistryUnsubscribe']?.(),
      (this['_assetMentionRegistryUnsubscribe'] = null),
      (this['_assetMentionRegistryRefreshPending'] = ![]));
    !shouldPreserveGenerationTaskOnUnmount2 && typeof this['_stopDreaminaRecovery'] === 'function' && this['_stopDreaminaRecovery'](![]);
    !shouldPreserveGenerationTaskOnUnmount2 &&
      typeof this['_stopRunningHubRecovery'] === 'function' &&
      this['_stopRunningHubRecovery'](![]);
    !shouldPreserveGenerationTaskOnUnmount2 && typeof this['_stopAsyncRecovery'] === 'function' && this['_stopAsyncRecovery'](![]);
    typeof this['_promptResizeCleanup'] === 'function' &&
      (this['_promptResizeCleanup'](), (this['_promptResizeCleanup'] = null));
    (disposeVideoNodePromptDetails(this),
      this['_uiSchemaCleanup']?.(),
      (this['_uiSchemaCleanup'] = null),
      this['_footerControllerCleanup']?.(),
      (this['_footerControllerCleanup'] = null),
      (this['_isPromptBoxResizing'] = ![]));
    this['_videoClickTimer'] && (clearTimeout(this['_videoClickTimer']), (this['_videoClickTimer'] = null));
    this['_centerIndicatorTimer'] &&
      (clearTimeout(this['_centerIndicatorTimer']), (this['_centerIndicatorTimer'] = null));
    (this['_cancelVideoProgressLoop']?.(),
      this['_setManualLoopPlayback']?.(![], this['_getActivePreviewVideoEl']?.()));
    try {
      this['previewEl']?.['querySelectorAll']('video')['forEach']((value99) => {
        this['_detachPreviewVideoRecovery']?.(value99);
        try {
          value99['pause']();
        } catch {}
        (value99['removeAttribute']('src'), value99['load']?.());
      });
    } catch {}
    this['_disposeCachedVideoObjectUrls']?.();
    const value100 = [this['_fixedSlotRefThumbObjectUrls'], this['_refThumbObjectUrls']];
    for (const map3 of value100) {
      if (!(map3 && typeof map3['entries'] === 'function')) continue;
      for (const value101 of map3['values']()) {
        if (value101 && String(value101)['startsWith']('blob:'))
          try {
            URL['revokeObjectURL'](value101);
          } catch {}
      }
      try {
        map3['clear']();
      } catch {}
    }
    this['_videoThumbPending']['clear']();
  }
}
const videoNodeReferenceInputModule = createVideoNodeReferenceInputModule(VIDEO_NODE_MODULE_DEPS),
  videoNodeParameterPanelModule = createVideoNodeParameterPanelModule(VIDEO_NODE_MODULE_DEPS),
  videoNodeTaskOrchestrationModule = createVideoNodeTaskOrchestrationModule(VIDEO_NODE_MODULE_DEPS),
  videoNodeResultRenderModule = createVideoNodeResultRenderModule(VIDEO_NODE_MODULE_DEPS),
  videoNodePreviewControlsModule = createVideoNodePreviewControlsModule(VIDEO_NODE_MODULE_DEPS);
function applyClassPrototypeMethods(value102, enabled15) {
  if (!enabled15) return;
  const value103 = Object['getOwnPropertyDescriptors'](enabled15);
  (delete value103['constructor'], Object['defineProperties'](value102, value103));
}
(applyClassPrototypeMethods(AIGenVideoNode['prototype'], videoNodeReferenceInputModule),
  applyClassPrototypeMethods(AIGenVideoNode['prototype'], videoNodeParameterPanelModule),
  applyClassPrototypeMethods(AIGenVideoNode['prototype'], videoNodeTaskOrchestrationModule),
  applyClassPrototypeMethods(AIGenVideoNode['prototype'], videoNodeResultRenderModule),
  applyClassPrototypeMethods(AIGenVideoNode['prototype'], videoNodePreviewControlsModule),
  Object['assign'](
    AIGenVideoNode['prototype'],
    videoUiRenderMixin,
    videoStateSyncMixin,
    videoTaskOrchestrationMixin,
  ));
