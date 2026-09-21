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
import { generateId } from '../core/math.js';
import { checkSlashTrigger, handleSlashKeyboardNavigation, closeSlashMenu } from '../modules/slashMenu.js';
import { activateMenuKeyboard } from '../modules/floatingMenuKeyboard.js';
import ImageFreeAngleController from '../modules/ImageFreeAngleController.js';
import { createAIGenerateNodeUiModule } from './aigenImage/uiModule.js';
import { hasAIGenMaskPreviewBaseImage } from './aigenImage/maskPreviewPolicy.js';
import { createAIGenerateNodeStateSyncModule } from './aigenImage/stateSyncModule.js';
import { createAIGenerateNodeTaskOrchestrationModule } from './aigenImage/taskOrchestrationModule.js';
import { shouldDeferRendererMediaOnMount } from '../core/rendererDeferredMedia.js';
const api = {
    buildGenerateImageRequest: buildGenerateImageRequest,
    cancelRunningHubWorkflowTask: cancelRunningHubImageTask,
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
  constructor(_0x3f5454) {
    ((this._data = _0x3f5454),
      (this.nodeId = _0x3f5454.id),
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
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(_0x3f5454)),
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
  ['_applyMaskPreview'](_0x4174b1) {
    if (!this._maskOverlay) return;
    const _0x316898 = String(_0x4174b1 || '').trim();
    if (!_0x316898) {
      ((this._suppressedEmptyMaskPreview = null), this._hideMaskPreview());
      return;
    }
    if (!hasAIGenMaskPreviewBaseImage(this._data)) {
      ((this._suppressedEmptyMaskPreview = _0x316898), this._hideMaskPreview());
      return;
    }
    if (this._suppressedEmptyMaskPreview === _0x316898) {
      this._hideMaskPreview();
      return;
    }
    this._suppressedEmptyMaskPreview = null;
    if (this._currentMaskPreview === _0x316898) return;
    const _0x230e33 =
      _0x316898.startsWith('blob:') || _0x316898.startsWith('data:') || _0x316898.startsWith('/')
        ? _0x316898
        : '/' + _0x316898.replace(/^\//, '');
    ((this._maskOverlay.src = encodeURI(_0x230e33)),
      (this._maskOverlay.style.display = 'block'),
      (this._currentMaskPreview = _0x316898));
  }
  ['_checkAtTrigger'](_0x48aac5) {
    return _checkAtTrigger(this, _0x48aac5);
  }
  ['_populateMentionMenu'](
    _0x4d1353,
    _0x4a6287,
    _0x4fea23,
    _0x4bee7e = null,
    _0x4792e7 = '',
    _0x277988 = -1,
  ) {
    return _populateMentionMenu(this, {
      x: _0x4d1353,
      y: _0x4a6287,
      triggerRange: _0x4fea23,
      pillToEdit: _0x4bee7e,
      query: _0x4792e7,
      atIndex: _0x277988,
    });
  }
  ['_insertMentionPill'](_0x15dbd7, _0xd14801, _0x140420, _0x7c0722 = -1) {
    return _insertMentionPill(this, {
      label: _0x15dbd7,
      nodeId: _0xd14801,
      triggerRange: _0x140420,
      atIndex: _0x7c0722,
    });
  }
  ['_handlePillKeyboard'](_0x31b86b) {
    return _handlePillKeyboard(this, _0x31b86b);
  }
  ['_buildFloatingMenu'](_0xe738e5, _0x3e402a, _0x436bda, _0x10ba0c, _0x5a7b07) {
    const _0x10b1ff = document.createElement('div');
    _0x10b1ff.style.position = 'relative';
    const _0x330231 = document.createElement('button');
    ((_0x330231.type = 'button'), (_0x330231.className = 'img-pill-btn'), (_0x330231.id = _0xe738e5));
    const _0x5f27af = document.createElement('span');
    ((_0x5f27af.className = _0x3e402a),
      (_0x5f27af.textContent = _0x436bda),
      _0x330231.appendChild(_0x5f27af));
    const _0x1714ab = document.createElement('svg');
    (_0x1714ab.setAttribute('width', '10'),
      _0x1714ab.setAttribute('height', '10'),
      _0x1714ab.setAttribute('viewBox', '0 0 24 24'),
      _0x1714ab.setAttribute('fill', 'none'),
      _0x1714ab.setAttribute('stroke', 'currentColor'),
      _0x1714ab.setAttribute('stroke-width', '2'),
      (_0x1714ab.style.opacity = '0.5'),
      (_0x1714ab.innerHTML = '<polyline points="6 9 12 15 18 9"/>'),
      _0x330231.appendChild(_0x1714ab));
    const _0x942415 = document.createElement('div');
    return (
      (_0x942415.className = 'floating-menu'),
      _0x10ba0c.forEach((_0x4e6eb0) => {
        const _0x7325a9 = document.createElement('div');
        ((_0x7325a9.className =
          'floating-menu-item' + (_0x4e6eb0.v === _0x436bda || _0x4e6eb0.l === _0x436bda ? ' active' : '')),
          (_0x7325a9.dataset.value = _0x4e6eb0.v),
          (_0x7325a9.textContent = _0x4e6eb0.l),
          _0x7325a9.addEventListener('mousedown', (_0x83aae5) => {
            (_0x83aae5.preventDefault(),
              (_0x5f27af.textContent = _0x4e6eb0.l),
              _0x942415
                .querySelectorAll('.floating-menu-item')
                .forEach((_0x277b6f) => _0x277b6f.classList.remove('active')),
              _0x7325a9.classList.add('active'),
              _0x942415.classList.remove('open'),
              _0x5a7b07(_0x4e6eb0.v));
          }),
          _0x942415.appendChild(_0x7325a9));
      }),
      _0x330231.addEventListener('mousedown', (_0x5504c0) => {
        (_0x5504c0.preventDefault(), _0x5504c0.stopPropagation());
        const _0x2917f7 = _0x942415.classList.contains('open');
        document
          .querySelectorAll('.floating-menu.open')
          .forEach((_0x67045b) => _0x67045b.classList.remove('open'));
        if (!_0x2917f7) _0x942415.classList.add('open');
      }),
      document.addEventListener(
        'mousedown',
        (_0xdf191a) => {
          if (!_0x10b1ff.contains(_0xdf191a.target)) _0x942415.classList.remove('open');
        },
        true,
      ),
      _0x10b1ff.appendChild(_0x330231),
      _0x10b1ff.appendChild(_0x942415),
      { modelWrap: _0x10b1ff, trig: _0x330231, menu: _0x942415 }
    );
  }
}
const aiGenerateNodeUiModule = createAIGenerateNodeUiModule(AI_GENERATE_NODE_MODULE_DEPS),
  aiGenerateNodeStateSyncModule = createAIGenerateNodeStateSyncModule(AI_GENERATE_NODE_MODULE_DEPS),
  aiGenerateNodeTaskOrchestrationModule = createAIGenerateNodeTaskOrchestrationModule(
    AI_GENERATE_NODE_MODULE_DEPS,
  );
function applyClassPrototypeMethods(_0x562abf, _0x5c26fd) {
  if (!_0x5c26fd) return;
  const _0x44329a = Object.getOwnPropertyDescriptors(_0x5c26fd);
  (delete _0x44329a.constructor, Object.defineProperties(_0x562abf, _0x44329a));
}
(applyClassPrototypeMethods(AIGenerateNode.prototype, aiGenerateNodeUiModule),
  applyClassPrototypeMethods(AIGenerateNode.prototype, aiGenerateNodeStateSyncModule),
  applyClassPrototypeMethods(AIGenerateNode.prototype, aiGenerateNodeTaskOrchestrationModule));
