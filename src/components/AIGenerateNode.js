import appStore from '../core/stores/appStore.js';
import { getDisplayModelName } from '../modules/providers.js';
import {
  _handlePillHover,
  _handlePillOut,
  _syncEdgesOrderFromPills,
  _syncPillLabels,
  _checkAtTrigger,
  _populateMentionMenu,
  _insertMentionPill,
  _handlePillKeyboard,
  _rehydratePromptPills,
  _handleMentionMenuKeyboard,
} from '../modules/nodePromptShared.js';
import {
  TEXT_TOOLBAR_HTML,
  bindTextToolbarEvents,
  IMAGE_TOOLBAR_HTML,
  bindImageToolbarEvents,
  showDevToast,
} from './NodeToolbarConfig.js';
import { getImage } from '../modules/storage.js';
import { openNodeImagePreview } from '../modules/imagePreview.js';
import { getPromptPresets, openCustomPresetsManager } from '../modules/promptPresets.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import { bindRefThumbHoverPreview } from '../modules/refThumbHoverPreview.js';
import { ensureThumbDecoded, revealRefThumbMedia } from '../modules/refThumbMediaReveal.js';
import { getRefKindByNodeType } from '../modules/nodeMeta.js';
import { uploadFile } from '../modules/project.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import {
  buildGenerateImageRequest,
  cancelRunningHubImageTask,
  generateImage,
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from '../../api/aiImageApi.js';
import { fetchDreaminaCliStatusFromServer, getCachedDreaminaCliStatus } from '../../api/dreaminaCliApi.js';
import { generateId } from '../core/math.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation, closeSlashMenu } from '../modules/slashMenu.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import ImageFreeAngleController from '../modules/ImageFreeAngleController.js';
import { createAIGenerateNodeUiModule } from './aigenImage/uiModule.js';
import { hasAIGenMaskPreviewBaseImage } from './aigenImage/maskPreviewPolicy.js';
import { createAIGenerateNodeStateSyncModule } from './aigenImage/stateSyncModule.js';
import { createAIGenerateNodeSelectionStateModule } from './aigenImage/selectionStateModule.js';
import { createAIGenerateNodeTaskOrchestrationModule } from './aigenImage/taskOrchestrationModule.js';
import { createImageGenerationPresentationModule } from './aigenImage/imageGenerationPresentation.js';
import { shouldDeferRendererMediaOnMount } from '../core/rendererDeferredMedia.js';
const api = {
    buildGenerateImageRequest: buildGenerateImageRequest,
    cancelRunningHubWorkflowTask: cancelRunningHubImageTask,
    fetchDreaminaCliStatusFromServer: fetchDreaminaCliStatusFromServer,
    getCachedDreaminaCliStatus: getCachedDreaminaCliStatus,
    generateImage: generateImage,
    resumeAsyncImageTask: resumeAsyncImageTask,
    resumeDreaminaImageTask: resumeDreaminaImageTask,
    resumeRunningHubImageTask: resumeRunningHubImageTask,
  },
  AI_GENERATE_NODE_MODULE_DEPS = {
    store: appStore,
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
  };
export class AIGenerateNode {
  constructor(value) {
    ((this._data = value),
      (this.nodeId = value.id),
      (this.previewEl = null),
      (this.imgEl = null),
      (this.refBarEl = null),
      (this.promptEl = null),
      (this.btnEl = null),
      (this._dragSrcIdx = null),
      (this._dragBounds = []),
      (this._cachedThumbUrl = null),
      (this._currentThumbId = null),
      (this._cachedSourceUrl = null),
      (this._currentSourceId = null),
      (this._currentLocalPath = null),
      (this._thumbObjectUrls = new Map()),
      (this._refThumbObjectUrls = new Map()),
      (this._currentMaskPreview = null),
      (this._suppressedEmptyMaskPreview = null),
      (this._resolvedUrlsKey = null),
      (this._resolvedMainUrls = null),
      (this._resolvedAuxUrls = null),
      (this._lastImagesKeyStr = null),
      (this._lastMainIdx = null),
      (this._lastIsExpanded = null),
      (this._multiStackWrap = null),
      (this._multiLayerEls = []),
      (this._multiErrorEls = []),
      (this._multiToggleBtn = null),
      (this._maskOverlay = null),
      (this._qualityBtns = []),
      (this._attachBtnIcon = null),
      (this._lastEdgeSig = null),
      (this._renderRefBarLock = null),
      (this._ratioAnimTimer = null),
      (this._ratioFlipAnim = null),
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(value)),
      (this._rhAbortController = null),
      (this._rhTaskId = null),
      (this._rhApiKey = null),
      (this._rhCancelRequested = false),
      (this._rhResumeAbortController = null),
      (this._rhResumeTaskId = ''),
      (this._rhResumePromise = null),
      (this._dreaminaResumeAbortController = null),
      (this._dreaminaResumeSubmitId = ''),
      (this._dreaminaResumePromise = null),
      (this._dreaminaActiveSubmitId = ''),
      (this._asyncResumeAbortController = null),
      (this._asyncResumeTaskId = ''),
      (this._asyncResumePromise = null),
      (this._statusOverlayEl = null),
      (this._assetMentionRegistryUnsubscribe = null),
      (this._assetMentionRegistryRefreshPending = false),
      (this._generationNodeHelpTip = null),
      (this._footerControllerCleanup = null),
      (this._uiSchemaCleanup = null),
      (this._lowZoomHoverRefreshTimer = null));
  }
  ['_hideMaskPreview']() {
    if (!this._maskOverlay) return;
    ((this._maskOverlay.src = ''),
      (this._maskOverlay.style.display = 'none'),
      (this._currentMaskPreview = null));
  }
  ['_applyMaskPreview'](item) {
    if (!this._maskOverlay) return;
    const enabled = String(item || '').trim();
    if (!enabled) {
      ((this._suppressedEmptyMaskPreview = null), this._hideMaskPreview());
      return;
    }
    if (!hasAIGenMaskPreviewBaseImage(this._data)) {
      ((this._suppressedEmptyMaskPreview = enabled), this._hideMaskPreview());
      return;
    }
    if (this._suppressedEmptyMaskPreview === enabled) {
      this._hideMaskPreview();
      return;
    }
    this._suppressedEmptyMaskPreview = null;
    if (this._currentMaskPreview === enabled) return;
    const key =
      enabled.startsWith('blob:') || enabled.startsWith('data:') || enabled.startsWith('/')
        ? enabled
        : '/' + enabled.replace(/^\//, '');
    ((this._maskOverlay.src = encodeURI(key)),
      (this._maskOverlay.style.display = 'block'),
      (this._currentMaskPreview = enabled));
  }
  ['_checkAtTrigger'](index) {
    return _checkAtTrigger(this, index);
  }
  ['_populateMentionMenu'](x, y, triggerRange, pillToEdit = null, query = '', atIndex = -1) {
    return _populateMentionMenu(this, {
      x: x,
      y: y,
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
  ['_handlePillKeyboard'](result) {
    return _handlePillKeyboard(this, result);
  }
  ['_buildFloatingMenu'](data, options, target, list, handler) {
    const modelWrap = document.createElement('div');
    modelWrap.style.position = 'relative';
    const trig = document.createElement('button');
    ((trig.type = 'button'), (trig.className = 'img-pill-btn'), (trig.id = data));
    const el = document.createElement('span');
    ((el.className = options), (el.textContent = target), trig.appendChild(el));
    const el2 = document.createElement('svg');
    (el2.setAttribute('width', '10'),
      el2.setAttribute('height', '10'),
      el2.setAttribute('viewBox', '0 0 24 24'),
      el2.setAttribute('fill', 'none'),
      el2.setAttribute('stroke', 'currentColor'),
      el2.setAttribute('stroke-width', '2'),
      (el2.style.opacity = '0.5'),
      (el2.innerHTML = '<polyline points="6 9 12 15 18 9"/>'),
      trig.appendChild(el2));
    const menu = document.createElement('div');
    return (
      (menu.className = 'floating-menu'),
      list.forEach((item2) => {
        const el3 = document.createElement('div');
        ((el3.className = 'floating-menu-item' + (item2.v === target || item2.l === target ? ' active' : '')),
          (el3.dataset.value = item2.v),
          (el3.textContent = item2.l),
          el3.addEventListener('mousedown', (event) => {
            (event.preventDefault(),
              (el.textContent = item2.l),
              menu.querySelectorAll('.floating-menu-item').forEach((el4) => el4.classList.remove('active')),
              el3.classList.add('active'),
              menu.classList.remove('open'),
              handler(item2.v));
          }),
          menu.appendChild(el3));
      }),
      trig.addEventListener('mousedown', (event2) => {
        (event2.preventDefault(), event2.stopPropagation());
        const enabled2 = menu.classList.contains('open');
        document.querySelectorAll('.floating-menu.open').forEach((el5) => el5.classList.remove('open'));
        if (!enabled2) menu.classList.add('open');
      }),
      document.addEventListener(
        'mousedown',
        (event3) => {
          if (!modelWrap.contains(event3.target)) menu.classList.remove('open');
        },
        true,
      ),
      modelWrap.appendChild(trig),
      modelWrap.appendChild(menu),
      { modelWrap: modelWrap, trig: trig, menu: menu }
    );
  }
}
const aiGenerateNodeUiModule = createAIGenerateNodeUiModule(AI_GENERATE_NODE_MODULE_DEPS),
  aiGenerateNodeStateSyncModule = createAIGenerateNodeStateSyncModule(AI_GENERATE_NODE_MODULE_DEPS),
  aiGenerateNodeSelectionStateModule = createAIGenerateNodeSelectionStateModule(AI_GENERATE_NODE_MODULE_DEPS),
  aiGenerateNodeTaskOrchestrationModule = createAIGenerateNodeTaskOrchestrationModule(
    AI_GENERATE_NODE_MODULE_DEPS,
  );
function applyClassPrototypeMethods(source, enabled3) {
  if (!enabled3) return;
  const next = Object.getOwnPropertyDescriptors(enabled3);
  (delete next.constructor, Object.defineProperties(source, next));
}
(applyClassPrototypeMethods(AIGenerateNode.prototype, aiGenerateNodeUiModule),
  applyClassPrototypeMethods(AIGenerateNode.prototype, aiGenerateNodeStateSyncModule),
  applyClassPrototypeMethods(AIGenerateNode.prototype, aiGenerateNodeSelectionStateModule),
  applyClassPrototypeMethods(
    AIGenerateNode.prototype,
    createImageGenerationPresentationModule(
      AI_GENERATE_NODE_MODULE_DEPS,
      aiGenerateNodeTaskOrchestrationModule,
    ),
  ));
