import {
  buildSourceMediaNodePayload,
  getAIGenerationNodeSize,
  getAutoMediaSizeByShortSide,
} from '../../services/fileService.js';
import {
  buildImageNodeStorageFields,
  pickCanvasImageLocalPath,
  pickCanvasThumbLocalPath,
  toLocalPathUrl,
} from '../../services/imageDerivativeService.js';
import {
  isCanvasLowZoomActive,
  pickImageLodUrl,
  setNodeMediaLodHoverPromoted,
  shouldUseLowZoomImageThumbnail,
} from '../../modules/canvasImageLod.js';
import { preloadCanvasImage } from '../../modules/canvasMediaScheduler.js';
import { commit } from '../../modules/history.js';
import { startNodeResizePreview } from '../../modules/interaction/nodeResizePreview.js';
import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from '../promptBoxResize.js';
import {
  buildDreaminaImageNodeNormalizationPatch,
  bindDreaminaImageMenu,
  normalizeDreaminaImageModel,
} from './dreaminaModelMenuHelper.js';
import {
  getNanoBananaModeLabel,
  getNanoBananaModeOptions,
  getNanoBananaSelectionFromModel,
  getNanoBananaAllowedRatioLabels,
  isNanoBananaFamily,
  normalizeNanoBananaRatioForFamily,
} from '../../modules/nanoBananaModeRules.js';
import {
  buildMainImageRatioLabel,
  isImageSizeOptionDisabledForProviderModel,
  isRunningHubGptImage2OfficialModel,
  normalizeImageSizeForProviderModel,
  shouldDisableImageSizeControl,
} from '../../modules/imageModelCapabilities.js';
import { syncPreviewNodeLoading } from '../../modules/previewMode.js';
import { subscribeAssetMentionRegistry } from '../../modules/assetMentionRegistry.js';
import { removeCoveredAssetInputRefForConnection } from '../../modules/promptAssetInputOverride.js';
import {
  getExclusiveSlotsForFixedSlot,
  getFixedInputSlotConfigFromManifest,
} from '../../modules/fixedInputAssetRefs.js';
import {
  flushPromptHtmlCommit,
  getPromptAssetInputRefsFromNode,
  handlePromptPaste,
  handlePromptSelectAll,
  removeAssetMentionPillFromPrompt,
  removePromptAssetInputRefFromNode,
  resolvePromptTextWithTextRefs,
  schedulePromptHtmlCommit,
  shouldSubmitPromptByKeyboard,
} from '../../modules/nodePromptShared.js';
import {
  getTargetInputPolicy,
  isInputKindAllowed,
  isRhPersonReplaceV3Model,
  isRhPersonReplaceWorkflowModel,
  isRhQwenImageEditModel,
  resolveEffectiveInputKind,
  RH_QWEN_IMAGE_EDIT_MODEL,
} from '../../modules/modelInputPolicy.js';
import { isImageFreeAngleOnlyModel } from '../../modules/imageFunctionModelMenu.js';
import { sanitizePromptHtml } from '../../utils/dom.js';
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../../utils/debugRequestPreview.js';
import { createPromptAttachmentButtonHTML } from '../refAttachmentButton.js';
import { attachGenerationNodeHelpTip } from '../generationNodeHelpTip.js';
import { isVipModel } from '../../modules/subscriptionAccess.js';
import {
  AI_IMAGE_MIN_SIZE,
  bindImageModelMenuSubmenu,
  buildImageModelMenuHTML,
  buildNanoBananaModeMenuHTML,
  buildImageSchemaAspectRatioDisplayPatch,
  applyImageSchemaRatioResizeAnimation,
  buildRunningHubGptImage2OfficialPatch,
  escapeHtmlAttr,
  getImagePromptPlaceholderForModel,
  getImageSizeCapabilityProvider,
  isApimartGptImage2Selection,
  isGrsaiGptImage2Selection,
  isRunningHubGptImage2Selection,
  resolveApimartImageMenuSelection,
  resolveGrsaiImageMenuSelection,
  resolveRunningHubModelImageMenuSelection,
  resolveRunningHubWorkflowImageMenuSelection,
  resolveVolcengineImageMenuSelection,
  renderImageModelTriggerIconHTML,
  setImageModelTriggerIcon,
  shouldShowNanoBananaModeSelector,
} from './uiModuleModelHelpers.js';
import {
  buildImageInputGateClearPatch,
  getImageInputGateUploadedUrl,
  getImageNodeInputGate,
  getImageNodeRootClass,
  shouldUseImageWorkflowBusyButton,
} from './imageNodeManifestPolicies.js';
import {
  bindModelUiSchemaControls,
  buildModelUiSchemaDefaultParams,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  sanitizeModelUiSchemaParams,
  syncModelUiSchemaControls,
} from './uiSchemaRenderer.js';
import { bindNodeFooterController, closeNodeFooterMenus } from '../shared/nodeFooterControls.js';
import { bindResultImageDragOutGesture } from './resultImageDragOut.js';
import {
  MULTI_RESULT_BACKPLATE_CLASS,
  MULTI_RESULT_STACK_WRAP_CLASS,
  buildMultiResultBackplateItems,
  clearMultiResultStackClasses,
  createMultiResultBackplates,
  getMultiResultBackplateCount,
  getMultiResultBackplateKey,
  shouldRefreshMultiResultStackDom,
  syncMultiResultStackClasses,
} from './multiResultStackBackplates.js';
import { getModelManifest, isWorkflowModel } from '../../manifests/index.js';
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from '../../modules/previewGenerateButtonUi.js';
import { onLocaleChange, t } from '../../i18n/index.js';
import { getTaskMessage, resolveGenerationButtonMode } from '../../core/generationTaskUiState.js';
import { DEFAULT_IMAGE_NODE_MODEL, DEFAULT_IMAGE_NODE_PROVIDER } from './defaults.js';
const AIGEN_IMAGE_HIDDEN_SOURCE_CLEAR_DELAY_MS = 0x4b0,
  AIGEN_IMAGE_LOD_HOVER_REFRESH_DELAY_MS = 160;
function getPlainUiSchemaParams(_0x31ed0d) {
  return _0x31ed0d && typeof _0x31ed0d === 'object' && !Array.isArray(_0x31ed0d) ? _0x31ed0d : {};
}
function getUiSchemaNodeFieldValue(_0x28e8a7 = {}, _0x2f9156 = '', _0x28163b = '') {
  const _0x37f4fa = String(_0x2f9156 || '').trim();
  if (!_0x37f4fa) return _0x28163b;
  const _0x30a0fd = getPlainUiSchemaParams(_0x28e8a7?.generationParams);
  if (_0x30a0fd[_0x37f4fa] !== undefined) return _0x30a0fd[_0x37f4fa];
  if (
    _0x28e8a7 &&
    typeof _0x28e8a7 === 'object' &&
    !Array.isArray(_0x28e8a7) &&
    _0x28e8a7[_0x37f4fa] !== undefined
  )
    return _0x28e8a7[_0x37f4fa];
  return _0x28163b;
}
function collectUiSchemaVisibilityConditionFields(_0x5034cd, _0x4fd161) {
  if (Array.isArray(_0x5034cd))
    return (
      _0x5034cd.forEach((_0x559817) => collectUiSchemaVisibilityConditionFields(_0x559817, _0x4fd161)),
      _0x4fd161
    );
  if (!_0x5034cd || typeof _0x5034cd !== 'object') return _0x4fd161;
  Array.isArray(_0x5034cd.any) &&
    _0x5034cd.any.forEach((_0x34ed3b) => collectUiSchemaVisibilityConditionFields(_0x34ed3b, _0x4fd161));
  Array.isArray(_0x5034cd.all) &&
    _0x5034cd.all.forEach((_0xbd3d48) => collectUiSchemaVisibilityConditionFields(_0xbd3d48, _0x4fd161));
  const _0x9440c8 = String(_0x5034cd.field || _0x5034cd.param || '').trim();
  if (_0x9440c8) _0x4fd161.add(_0x9440c8);
  return _0x4fd161;
}
function collectUiSchemaVisibilityDependencyFields(_0x54093f = []) {
  const _0x575bac = new Set();
  return (
    (Array.isArray(_0x54093f) ? _0x54093f : []).forEach((_0x5b95c9) => {
      (collectUiSchemaVisibilityConditionFields(_0x5b95c9?.showWhen, _0x575bac),
        collectUiSchemaVisibilityConditionFields(_0x5b95c9?.hideWhen, _0x575bac));
      const _0x107577 = [
        ...(Array.isArray(_0x5b95c9?.options) ? _0x5b95c9.options : []),
        ...(Array.isArray(_0x5b95c9?.advancedOptions) ? _0x5b95c9.advancedOptions : []),
      ];
      _0x107577.forEach((_0x1e32fc) => {
        collectUiSchemaVisibilityConditionFields(_0x1e32fc?.hideWhen, _0x575bac);
      });
    }),
    _0x575bac
  );
}
function buildUiSchemaVisibilitySignature(_0x35360d, _0x2459bc = {}) {
  const _0x349c03 = String(_0x35360d || _0x2459bc?.model || '').trim(),
    _0x119e2d = getModelManifest(_0x349c03),
    _0x98cd23 = Array.isArray(_0x119e2d?.uiSchema?.fields) ? _0x119e2d.uiSchema.fields : [],
    _0x3f146f = collectUiSchemaVisibilityDependencyFields(_0x98cd23),
    _0xa6cb60 = new Map(
      _0x98cd23
        .map((_0x2ea7fe) => [String(_0x2ea7fe?.id || '').trim(), _0x2ea7fe?.defaultValue])
        .filter(([_0x41fd9a]) => _0x41fd9a),
    ),
    _0x3f1e1f = [..._0x3f146f]
      .sort()
      .map((_0x44fd63) => [
        _0x44fd63,
        getUiSchemaNodeFieldValue(_0x2459bc, _0x44fd63, _0xa6cb60.get(_0x44fd63)),
      ]);
  return JSON.stringify({ modelId: _0x349c03, dependencies: _0x3f1e1f });
}
export function hasImageInputForUiSchemaNodeData({
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  state: state = {},
  incomingEdges: incomingEdges = null,
} = {}) {
  if (!nodeData || typeof nodeData !== 'object') return false;
  if (nodeData.hasInputImages === true) return true;
  const _0x5a30d0 = [
    nodeData.inputUrls,
    nodeData.image_urls,
    nodeData.inputImageUrls,
    nodeData.referenceImageUrls,
  ];
  if (
    _0x5a30d0.some((_0x345294) =>
      Array.isArray(_0x345294)
        ? _0x345294.some((_0x34a4fe) => String(_0x34a4fe || '').trim())
        : String(_0x345294 || '').trim(),
    )
  )
    return true;
  if (
    getPromptAssetInputRefsFromNode(nodeData, { allowedTypes: ['image'] }).some((_0x58fe08) =>
      String(_0x58fe08?.url || '').trim(),
    )
  )
    return true;
  const _0x3e590e = state?.nodes || {},
    _0x15a917 = getTargetInputPolicy({ ...nodeData, type: nodeData.type || 'ai-image' }),
    _0xceca85 = Array.isArray(incomingEdges) ? incomingEdges : Object.values(state?.edges || {});
  return _0xceca85.some((_0x7cb49b) => {
    if (!_0x7cb49b || String(_0x7cb49b.targetId || '') !== String(nodeId || '')) return false;
    const _0x40c4d6 = _0x3e590e[_0x7cb49b.sourceId];
    if (!_0x40c4d6) return false;
    const _0x145838 = resolveEffectiveInputKind(_0x40c4d6, _0x7cb49b);
    return _0x145838 === 'image' && isInputKindAllowed(_0x15a917, _0x145838);
  });
}
export function createAIGenerateNodeUiModule(_0x42221e) {
  const {
    store: _0x34263a,
    api: _0x515c19,
    getDisplayModelName: _0x5859d4,
    _handlePillHover: _0x570ab9,
    _handlePillOut: _0x49424b,
    _syncEdgesOrderFromPills: _0x109ec7,
    _syncPillLabels: _0x5d669d,
    _checkAtTrigger: _0x4290af,
    _populateMentionMenu: _0x3f7dfa,
    _insertMentionPill: _0x19babf,
    _handlePillKeyboard: _0x53fccf,
    _rehydratePromptPills: _0x488098,
    _handleMentionMenuKeyboard: _0x1f702e,
    TEXT_TOOLBAR_HTML: _0x4d6cb0,
    bindTextToolbarEvents: _0x2ec0ef,
    IMAGE_TOOLBAR_HTML: _0x5db79f,
    bindImageToolbarEvents: _0x39dac6,
    showDevToast: _0x5da22f,
    getImage: _0xdfb594,
    openNodeImagePreview: _0x25e255,
    getPromptPresets: _0x5c5eec,
    openCustomPresetsManager: _0x2ea6e1,
    startLoading: _0xbc11fc,
    stopLoading: _0x3f23ab,
    bindRefThumbHoverPreview: _0x2c424a,
    ensureThumbDecoded: _0x464fa4,
    revealRefThumbMedia: _0x56c318,
    getRefKindByNodeType: _0x47780a,
    uploadFile: _0x2897b8,
    ensureConfig: _0x592022,
    getProviderConfig: _0x43aaea,
    generateId: _0x521b6a,
    checkSlashTrigger: _0x2315d7,
    handleSlashKeyboardNavigation: _0x193aa9,
    closeSlashMenu: _0x3ca146,
    activateMenuKeyboard: _0x3d07ce,
    ImageFreeAngleController: _0x5c3840,
  } = _0x42221e;
  class _0x10d534 {
    ['_getUiSchemaRenderNodeData'](_0x2dc983 = this._data) {
      return {
        ...(_0x2dc983 || {}),
        hasInputImages: hasImageInputForUiSchemaNodeData({
          nodeId: this.nodeId,
          nodeData: _0x2dc983 || {},
          state: _0x34263a.getState?.() || {},
        }),
      };
    }
    ['_shouldUseLowZoomThumbnail']() {
      return shouldUseLowZoomImageThumbnail({ nodeId: this.nodeId, rootEl: this._root, store: _0x34263a });
    }
    ['_pickImageDisplayUrl'](_0xef6ea7 = '', _0x55e885 = '', _0x19b1e6 = {}) {
      const _0x467da3 = _0x19b1e6 && Object.prototype.hasOwnProperty.call(_0x19b1e6, 'lowZoomThumbnail');
      return pickImageLodUrl({
        mainUrl: _0xef6ea7,
        thumbUrl: _0x55e885,
        lowZoomThumbnail: _0x467da3 ? !!_0x19b1e6.lowZoomThumbnail : this._shouldUseLowZoomThumbnail(),
      });
    }
    ['_applyImageElementLod'](_0x24488a, _0x11db8a = 'full') {
      if (!_0x24488a) return;
      _0x24488a.dataset.lodSrc = _0x11db8a === 'thumb' ? 'thumb' : 'full';
    }
    ['_ensureImageDisplayDecoded'](_0x38b648 = '') {
      const _0x1796bf = String(_0x38b648 || '').trim();
      if (!_0x1796bf || typeof Image !== 'function') return Promise.resolve(true);
      return preloadCanvasImage(_0x1796bf, { priority: 30, fetchPriority: 'auto' }).then(() => true);
    }
    ['_setImageElementDisplaySource'](_0x2d8287, _0xc26286 = {}, _0x2219ff = {}) {
      if (!_0x2d8287?.dataset) return;
      const _0x590bb8 = String(_0xc26286?.url || '').trim(),
        _0x448268 = _0xc26286?.lod === 'thumb' ? 'thumb' : 'full',
        _0x3def9b = _0x2219ff?.display !== false;
      if (!_0x590bb8) {
        this._clearLazyImageDisplaySource(_0x2d8287);
        if (_0x3def9b) _0x2d8287.style.display = 'none';
        return;
      }
      const _0x331b95 = String(_0x2d8287.getAttribute?.('src') || '').trim(),
        _0x5c1fb1 = !!_0x331b95 && _0x331b95 !== _0x590bb8 && _0x2d8287.style.display !== 'none',
        _0x254a60 = (Number(_0x2d8287._imageDisplayDecodeToken) || 0) + 1;
      _0x2d8287._imageDisplayDecodeToken = _0x254a60;
      const _0x140044 = () => {
        if (_0x2d8287._imageDisplayDecodeToken !== _0x254a60) return;
        (this._cancelLazyImageDisplayClear(_0x2d8287), this._applyImageElementLod(_0x2d8287, _0x448268));
        _0x2d8287.getAttribute?.('src') !== _0x590bb8 && (_0x2d8287.src = _0x590bb8);
        if (_0x3def9b) _0x2d8287.style.display = 'block';
      };
      if (_0x331b95 === _0x590bb8 || !_0x5c1fb1) {
        _0x140044();
        return;
      }
      this._ensureImageDisplayDecoded(_0x590bb8)
        .then(_0x140044)
        .catch(() => {});
    }
    ['_setLazyImageDisplaySource'](_0x1f87f5, _0x3b378f = {}) {
      if (!_0x1f87f5?.dataset) return;
      const _0x17a882 = String(_0x3b378f?.url || '').trim(),
        _0x413d4b = _0x3b378f?.lod === 'thumb' ? 'thumb' : 'full';
      if (_0x17a882) _0x1f87f5.dataset.lazySrc = _0x17a882;
      else delete _0x1f87f5.dataset.lazySrc;
      ((_0x1f87f5.dataset.lazyLodSrc = _0x413d4b), this._applyImageElementLod(_0x1f87f5, _0x413d4b));
    }
    ['_cancelLazyImageDisplayClear'](_0x172084) {
      if (!_0x172084?._lazyImageDisplayClearTimer) return;
      (clearTimeout(_0x172084._lazyImageDisplayClearTimer), (_0x172084._lazyImageDisplayClearTimer = null));
    }
    ['_loadLazyImageDisplaySource'](_0x141b7a) {
      if (!_0x141b7a?.dataset) return;
      const _0x8a90b2 = String(_0x141b7a.dataset.lazySrc || '').trim();
      if (!_0x8a90b2) {
        this._clearLazyImageDisplaySource(_0x141b7a);
        return;
      }
      (this._cancelLazyImageDisplayClear(_0x141b7a),
        this._setImageElementDisplaySource(_0x141b7a, {
          url: _0x8a90b2,
          lod: _0x141b7a.dataset.lazyLodSrc || 'full',
        }));
    }
    ['_clearLazyImageDisplaySource'](_0x525479) {
      if (!_0x525479) return;
      (this._cancelLazyImageDisplayClear(_0x525479),
        (_0x525479._imageDisplayDecodeToken = (Number(_0x525479._imageDisplayDecodeToken) || 0) + 1),
        typeof _0x525479.removeAttribute === 'function' && _0x525479.removeAttribute('src'));
    }
    ['_scheduleClearLazyImageDisplaySource'](_0x432aec, _0x71099b = 0) {
      if (!_0x432aec) return;
      this._cancelLazyImageDisplayClear(_0x432aec);
      const _0x11f4a7 = Math.max(0, Number(_0x71099b) || 0);
      _0x432aec._lazyImageDisplayClearTimer = setTimeout(() => {
        ((_0x432aec._lazyImageDisplayClearTimer = null), this._clearLazyImageDisplaySource(_0x432aec));
      }, _0x11f4a7);
    }
    ['_getResultImageDragOutNodeData']() {
      const _0x44bb18 =
        typeof _0x34263a.getStateRaw === 'function'
          ? _0x34263a.getStateRaw()
          : typeof _0x34263a.getState === 'function'
            ? _0x34263a.getState()
            : {};
      return _0x44bb18?.nodes?.[this.nodeId] || this._data || {};
    }
    ['_removeCurrentNodeFromSelection']() {
      const _0x2b2a11 =
          typeof _0x34263a.getStateRaw === 'function'
            ? _0x34263a.getStateRaw()
            : typeof _0x34263a.getState === 'function'
              ? _0x34263a.getState()
              : {},
        _0x4374f7 = Array.isArray(_0x2b2a11?.selectedNodeIds) ? _0x2b2a11.selectedNodeIds : [];
      if (!_0x4374f7.includes(this.nodeId)) return;
      _0x34263a.setSelectedNodes?.(_0x4374f7.filter((_0x30b8e6) => _0x30b8e6 !== this.nodeId));
    }
    ['_bindResultImageDragOut'](_0x52c141, _0x373df9 = {}) {
      if (!_0x52c141) return () => false;
      let _0x24c900 = false;
      const _0x398d06 = () => {
          ((_0x24c900 = true),
            setTimeout(() => {
              _0x24c900 = false;
            }, 0x1c2));
        },
        _0x4e8e23 = () => {
          const _0x51b64f = this._getResultImageDragOutNodeData(),
            _0x48c840 = Array.isArray(_0x51b64f?.images) ? _0x51b64f.images : [];
          return _0x48c840[_0x373df9.imageIndex] || null;
        },
        _0x427a24 = () => {
          const _0x51ee1f =
            typeof _0x373df9.getFallbackSize === 'function' ? _0x373df9.getFallbackSize() : null;
          return {
            width:
              Number(_0x51ee1f?.width) ||
              Number(this.previewEl?.offsetWidth) ||
              Number(this._data?.width) ||
              0x140,
            height:
              Number(_0x51ee1f?.height) ||
              Number(this.previewEl?.offsetHeight) ||
              Number(this._data?.height) ||
              0x140,
          };
        };
      return (
        bindResultImageDragOutGesture(_0x52c141, {
          image: _0x4e8e23,
          isEnabled: () => {
            const _0x597ea2 = this._getResultImageDragOutNodeData();
            return (
              !!_0x597ea2?.isImagesExpanded && Array.isArray(_0x597ea2.images) && _0x597ea2.images.length > 1
            );
          },
          getViewport: () => {
            const _0x4556ad =
              typeof _0x34263a.getStateRaw === 'function'
                ? _0x34263a.getStateRaw()
                : typeof _0x34263a.getState === 'function'
                  ? _0x34263a.getState()
                  : {};
            return _0x4556ad?.viewport || { x: 0, y: 0, zoom: 1 };
          },
          getGhostSourceElement: _0x373df9.getGhostSourceElement,
          getFallbackSrc: _0x373df9.getFallbackSrc,
          getGhostSize: () => {
            const _0x4a5a38 = _0x373df9.getGhostSourceElement?.() || _0x52c141;
            if (_0x4a5a38 && typeof _0x4a5a38.getBoundingClientRect === 'function') {
              const _0x51be3a = _0x4a5a38.getBoundingClientRect();
              if (_0x51be3a.width > 0 && _0x51be3a.height > 0)
                return { width: _0x51be3a.width, height: _0x51be3a.height };
            }
            return _0x427a24();
          },
          getNodeFallbackSize: _0x427a24,
          createId: () => _0x521b6a('source-image'),
          addNode: (_0x3eb251) => _0x34263a.addNode?.(_0x3eb251),
          setSelectedNodes: (_0x380174) => _0x34263a.setSelectedNodes?.(_0x380174),
          commit: commit,
          showToast: (_0x21e773, _0x5b55f8) => {
            if (typeof globalThis.window?.showToast === 'function')
              globalThis.window.showToast(_0x21e773, _0x5b55f8);
            else typeof _0x5da22f === 'function' && _0x5da22f(_0x21e773);
          },
          markClickSuppressed: _0x398d06,
          onDragStart: () => {
            _0x52c141.classList?.add('is-result-drag-source');
          },
          onDragEnd: () => {
            _0x52c141.classList?.remove('is-result-drag-source');
          },
        }),
        () => _0x24c900
      );
    }
    ['_runVipRetryOnce'](_0x511027) {
      let _0x13bb79 = false;
      return () => {
        if (_0x13bb79) return;
        ((_0x13bb79 = true), (this._vipSelectionRetryInProgress = true));
        try {
          _0x511027();
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      };
    }
    ['_guardVipSelection'](_0x13a9e3, _0x4cca9f = '', _0x17eb9c = null) {
      const _0x26bfc3 = String(_0x13a9e3 || '').trim(),
        _0x34a0ab = String(_0x4cca9f || '').trim();
      if (!isVipModel(_0x26bfc3, _0x34a0ab)) return true;
      const _0x32badd = window.isModelAllowedBySubscription,
        _0x4fefc5 = typeof _0x32badd === 'function' ? _0x32badd(_0x26bfc3, _0x34a0ab) : true;
      if (_0x4fefc5) return true;
      if (this._vipSelectionRetryInProgress) return false;
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: _0x26bfc3, provider: _0x34a0ab, onSuccess: _0x17eb9c })
          : window.showToast?.(t('aigenImage.access.vipRequired'), 'warn'),
        false
      );
    }
    ['mount']() {
      ((this._data = this._normalizeLegacySeedreamModel(this._data)),
        (this._data = this._normalizeDreaminaNodeData(this._data, { syncStore: false })));
      const _0x3a0bc3 = document.createElement('div');
      _0x3a0bc3.className = 'aigen-node-root aigen-image-node-root';
      if (this.isNoResult) _0x3a0bc3.classList.add('no-result');
      ((this._root = _0x3a0bc3),
        (_0x3a0bc3.innerHTML = _0x5db79f),
        (this.previewEl = document.createElement('div')),
        (this.previewEl.className = 'img-node-preview aigen-node-preview-fill aigen-image-preview'),
        (this.imgEl = document.createElement('img')),
        (this.imgEl.draggable = false),
        (this.imgEl.className = 'v2-media-preview aigen-image-media'));
      const _0x2b7a93 = document.createElement('div');
      ((_0x2b7a93.className = 'img-node-placeholder aigen-media-placeholder'),
        (_0x2b7a93.innerHTML =
          '\n            <svg class="placeholder-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="transition:all 0.2s;">\n                <rect x="3" y="3" width="18" height="18" rx="2"/>\n                <circle cx="8.5" cy="8.5" r="1.5"/>\n                <polyline points="21 15 16 10 5 21"/>\n            </svg>'),
        (this._maskOverlay = document.createElement('img')),
        (this._maskOverlay.className = 'node-img-mask-overlay aigen-image-mask-overlay'),
        this.previewEl.appendChild(this.imgEl),
        this.previewEl.appendChild(this._maskOverlay),
        this.previewEl.appendChild(_0x2b7a93),
        (this._placeholderEl = _0x2b7a93),
        syncPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions?.()),
        _0x3a0bc3.appendChild(this.previewEl));
      const _0x11e3ea = document.createElement('div');
      ((_0x11e3ea.className = 'node-resizer'),
        _0x3a0bc3.appendChild(_0x11e3ea),
        this._applyMaskPreview(this._data?.maskPreviewUrl || this._data?.maskPreview),
        this.imgEl.addEventListener('load', () => {
          if (this.imgEl?.dataset?.lodSrc === 'thumb') return;
          const _0x378b47 = Number(this.imgEl?.naturalWidth || 0),
            _0x1aa523 = Number(this.imgEl?.naturalHeight || 0);
          if (!(_0x378b47 > 0 && _0x1aa523 > 0)) return;
          const _0x1af2d3 = _0x34263a.getState().nodes?.[this.nodeId];
          if (!_0x1af2d3) return;
          if (
            Number(_0x1af2d3.imageWidth || 0) === _0x378b47 &&
            Number(_0x1af2d3.imageHeight || 0) === _0x1aa523
          )
            return;
          _0x34263a.updateNodeData(this.nodeId, { imageWidth: _0x378b47, imageHeight: _0x1aa523 });
        }));
      this._rendererMediaDeferred !== true && this._loadAndDisplayImage();
      const _0x25086b = () => {
        if (this._rendererMediaDeferred === true) return;
        const _0x3ba49d = Array.isArray(this._data?.images) ? this._data.images : [];
        _0x3ba49d.length > 1 && void this._loadAndDisplayImage({ force: true });
      };
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(_0x25086b)
        : setTimeout(_0x25086b, 0);
      const _0x59aaa1 = () => isCanvasLowZoomActive() || this.imgEl?.dataset?.lodSrc === 'thumb',
        _0x293acd = () => {
          if (!_0x59aaa1()) return;
          void this._loadAndDisplayImage({ force: true });
        },
        _0x901a4 = (_0x4d7e33 = 0) => {
          this._lowZoomHoverRefreshTimer &&
            (clearTimeout(this._lowZoomHoverRefreshTimer), (this._lowZoomHoverRefreshTimer = null));
          if (_0x4d7e33 > 0) {
            this._lowZoomHoverRefreshTimer = setTimeout(() => {
              ((this._lowZoomHoverRefreshTimer = null),
                _0x59aaa1() && setNodeMediaLodHoverPromoted(this._root, true),
                _0x293acd());
            }, _0x4d7e33);
            return;
          }
          (setNodeMediaLodHoverPromoted(this._root, false), _0x293acd());
        };
      (_0x3a0bc3.addEventListener('pointerenter', () => _0x901a4(AIGEN_IMAGE_LOD_HOVER_REFRESH_DELAY_MS)),
        _0x3a0bc3.addEventListener('pointerleave', () => _0x901a4(0)),
        this.imgEl.addEventListener('dblclick', async (_0x5e9142) => {
          (_0x5e9142.stopPropagation(), await _0x25e255(this._data));
        }));
      const _0x27d2d2 = document.createElement('div');
      ((_0x27d2d2.className = 'text-prompt-panel'),
        _0x27d2d2.addEventListener('pointerdown', (_0x35b5c6) => {
          _0x35b5c6.stopPropagation();
        }),
        (this._promptPanel = _0x27d2d2),
        _0x3a0bc3.addEventListener('v2-node:free-angle', (_0x294ce8) => {
          (_0x294ce8.stopPropagation(), this._switchToFreeAngle());
        }),
        _0x27d2d2.addEventListener('dblclick', (_0x443fed) => {
          !_0x443fed.target.closest('.prompt-textarea') &&
            (_0x443fed.preventDefault(), _0x443fed.stopPropagation());
        }),
        (this.refBarEl = document.createElement('div')),
        (this.refBarEl.className = 'node-ref-bar'),
        (this.refBarEl.innerHTML = createPromptAttachmentButtonHTML({ stroke: 'var(--white-90)' })),
        _0x27d2d2.appendChild(this.refBarEl),
        this.refBarEl.addEventListener('click', (_0x4aef52) => {
          const _0x20caeb = _0x4aef52.target.closest('.prompt-attachment-btn');
          if (!_0x20caeb) return;
          if (_0x4aef52._pickConnectHandled) return;
          (_0x4aef52.stopPropagation(), _0x4aef52.preventDefault());
          const _0x318f86 = _0x34263a.getState().pickConnectMode;
          _0x318f86 && _0x318f86.active && _0x318f86.sourceNodeId === this.nodeId
            ? _0x34263a.setPickConnectMode({ active: false })
            : _0x34263a.setPickConnectMode({
                active: true,
                sourceNodeId: this.nodeId,
                handleDirection: 'left',
              });
        }),
        this.refBarEl.addEventListener('pointerdown', (_0x5502ba) => {
          const _0xc9145f = _0x5502ba.target.closest('.prompt-attachment-btn');
          _0xc9145f && _0x5502ba.stopPropagation();
        }),
        (this._unbindRefThumbHoverPreview = _0x2c424a(this.refBarEl)),
        (this._refUploadInput = document.createElement('input')),
        (this._refUploadInput.type = 'file'),
        (this._refUploadInput.accept = 'image/*'),
        (this._refUploadInput.style.display = 'none'),
        _0x27d2d2.appendChild(this._refUploadInput),
        this._refUploadInput.addEventListener('change', async (_0xa0f0f2) => {
          const _0x3533da = _0xa0f0f2.target.files?.[0];
          if (!_0x3533da) return;
          try {
            const _0x504680 = window.currentProjectId || 'default_v2_project',
              _0x99a857 = await _0x2897b8(_0x3533da, _0x504680),
              _0x25ccbd = _0x99a857?.url || '';
            if (!_0x25ccbd) throw new Error(t('aigenImage.upload.missingUrl'));
            const _0x49cbb0 = _0x34263a.getState().nodes?.[this.nodeId],
              _0x30d531 = getImageNodeInputGate(_0x49cbb0?.model),
              _0x23bcdb = String(_0x30d531.kind || '') === 'image',
              _0x45eacf = isRhPersonReplaceWorkflowModel(_0x49cbb0?.model),
              _0x44f4ae = isRhQwenImageEditModel(_0x49cbb0?.model),
              _0x2fd910 = getFixedInputSlotConfigFromManifest(_0x49cbb0 || {}),
              _0x5e0d20 = Number(_0x49cbb0?.x) || 0,
              _0x4c22be = Number(_0x49cbb0?.y) || 0,
              _0x524d3a = Number(_0x49cbb0?.width) || 0x168,
              _0x5007bd = Number(_0x49cbb0?.height) || 0x168,
              _0x4d989e = _0x99a857.localPath || String(_0x25ccbd || '').replace(/^\//, ''),
              _0x472982 = buildImageNodeStorageFields(_0x99a857),
              _0x395a53 = _0x521b6a('source-image'),
              _0x363fc6 = 0x104,
              _0x13b0b0 = 0x104,
              _0x127881 = 24,
              _0x2d1fea = _0x5e0d20 - _0x127881 - _0x363fc6,
              _0xaa3d4b = _0x4c22be + Math.round((_0x5007bd - _0x13b0b0) / 2);
            let _0x39d244 = _0xaa3d4b;
            const _0x322306 = String(this._pendingRefSlot || '').trim();
            let _0x2cdea3 = _0x322306;
            const _0x24b586 = (_0x2fd910?.visibleSlots || []).filter(
                (_0x9c4066) => _0x2fd910?.slotKindById?.[_0x9c4066] === 'image',
              ),
              _0x1fec24 = !!_0x322306 && _0x24b586.includes(_0x322306);
            if (_0x45eacf) {
              const _0x461a09 = _0x322306 === 'replacedImage' ? 1 : 0,
                _0x5ac180 =
                  _0x461a09 === 0 ? -Math.round(_0x13b0b0 / 2) - 12 : Math.round(_0x13b0b0 / 2) + 12;
              _0x39d244 = _0xaa3d4b + _0x5ac180;
            } else {
              if (_0x1fec24) {
                const _0x570bde = Math.max(0, _0x24b586.indexOf(_0x322306)),
                  _0x4585e3 = (_0x24b586.length - 1) / 2;
                _0x39d244 = _0xaa3d4b + Math.round((_0x570bde - _0x4585e3) * (_0x13b0b0 + 24));
              }
            }
            (_0x34263a.batch(() => {
              const _0x37894a = _0x34263a.getIncomingEdges(this.nodeId);
              if (_0x23bcdb) {
                for (const _0x310969 of _0x37894a) _0x34263a.removeEdge(_0x310969.id);
              } else {
                if (_0x45eacf) {
                  const _0x20f9d0 = ['replaceTarget', 'replacedImage'];
                  let _0x2cb886 = _0x20f9d0.includes(_0x322306) ? _0x322306 : '';
                  if (!_0x2cb886) {
                    const _0x20dc9a = new Set(
                      _0x37894a
                        .map((_0x52a77d) => String(_0x52a77d.refSlot || ''))
                        .filter((_0x1a6da5) => _0x20f9d0.includes(_0x1a6da5)),
                    );
                    _0x2cb886 = _0x20f9d0.find((_0x3b00ef) => !_0x20dc9a.has(_0x3b00ef)) || '';
                    if (!_0x2cb886) {
                      let _0x504100 = null;
                      for (const _0x28b506 of _0x37894a) {
                        const _0x2f75ee = String(_0x28b506.refSlot || '');
                        if (!_0x20f9d0.includes(_0x2f75ee)) continue;
                        const _0x5652be = Number(_0x28b506.createdAt) || 0;
                        if (!_0x504100 || _0x5652be < (Number(_0x504100.createdAt) || 0))
                          _0x504100 = _0x28b506;
                      }
                      if (!_0x504100 && _0x37894a.length > 0) _0x504100 = _0x37894a[0];
                      _0x504100
                        ? ((_0x2cb886 = String(_0x504100.refSlot || '') || _0x20f9d0[0]),
                          _0x34263a.removeEdge(_0x504100.id))
                        : (_0x2cb886 = _0x20f9d0[0]);
                    }
                  } else
                    for (const _0xd10210 of _0x37894a) {
                      if (String(_0xd10210.refSlot || '') === _0x2cb886) _0x34263a.removeEdge(_0xd10210.id);
                    }
                  _0x2cdea3 = _0x2cb886;
                } else {
                  if (_0x1fec24) {
                    const _0x1f72f6 = getExclusiveSlotsForFixedSlot(_0x2fd910?.exclusiveGroups, _0x2cdea3),
                      _0x4ba2d0 = new Set(_0x1f72f6.length ? _0x1f72f6 : [_0x2cdea3]);
                    for (const _0x1ea02f of _0x37894a) {
                      if (_0x4ba2d0.has(String(_0x1ea02f.refSlot || ''))) _0x34263a.removeEdge(_0x1ea02f.id);
                    }
                  } else {
                    if (_0x44f4ae) {
                      const _0x44070b = _0x37894a.filter((_0x22b3d5) => {
                        const _0x3fdb74 = _0x34263a.getState().nodes?.[_0x22b3d5.sourceId];
                        return _0x47780a(_0x3fdb74?.type || '') === 'image';
                      });
                      if (_0x44070b.length >= 3) {
                        const _0x112979 = _0x44070b.reduce((_0x124573, _0x251293) =>
                          (Number(_0x251293.createdAt) || 0) < (Number(_0x124573.createdAt) || 0)
                            ? _0x251293
                            : _0x124573,
                        );
                        if (_0x112979?.id) _0x34263a.removeEdge(_0x112979.id);
                      }
                    } else {
                      for (const _0x1ecbf9 of _0x37894a) _0x34263a.removeEdge(_0x1ecbf9.id);
                    }
                  }
                }
              }
              (_0x23bcdb && _0x34263a.updateNodeData(this.nodeId, buildImageInputGateClearPatch(_0x30d531)),
                removeCoveredAssetInputRefForConnection({
                  targetId: this.nodeId,
                  sourceKind: 'image',
                  refSlot: _0x45eacf || _0x1fec24 ? _0x2cdea3 : '',
                }),
                _0x34263a.addNode(
                  buildSourceMediaNodePayload({
                    id: _0x395a53,
                    type: 'source-image',
                    x: _0x2d1fea,
                    y: _0x39d244,
                    width: _0x363fc6,
                    height: _0x13b0b0,
                    src: _0x25ccbd,
                    localPath: _0x4d989e,
                    assetId: _0x99a857.assetId || '',
                    derivativeStatus: _0x99a857.derivativeStatus || _0x99a857.status || '',
                    ..._0x472982,
                    fileName: _0x99a857.filename || _0x3533da.name || '',
                    thumbUrl: null,
                    needsAutoResize: true,
                  }),
                ),
                _0x34263a.addEdge({
                  id: _0x521b6a('edge'),
                  sourceId: _0x395a53,
                  targetId: this.nodeId,
                  ...((_0x45eacf || _0x1fec24) && _0x2cdea3
                    ? { refSlot: _0x2cdea3, createdAt: Date.now() }
                    : { createdAt: Date.now() }),
                }),
                _0x34263a.setSelectedNodes([this.nodeId]));
            }),
              await new Promise((_0x172af0) => {
                const _0x487b3d = new Image();
                ((_0x487b3d.onload = () => {
                  const _0x22e97c = _0x487b3d.naturalWidth || 0x3e8,
                    _0x45e927 = _0x487b3d.naturalHeight || 0x3e8,
                    { width: _0x12018d, height: _0x244682 } = getAutoMediaSizeByShortSide(
                      _0x22e97c,
                      _0x45e927,
                    );
                  (_0x34263a.getState().nodes?.[_0x395a53] &&
                    _0x34263a.updateNodeData(_0x395a53, {
                      width: _0x12018d,
                      height: _0x244682,
                      needsAutoResize: false,
                      x: _0x5e0d20 - _0x127881 - _0x12018d,
                      y:
                        (_0x45eacf || _0x1fec24) && _0x2cdea3
                          ? _0x39d244 + Math.round((_0x13b0b0 - _0x244682) / 2)
                          : _0x4c22be + Math.round((_0x5007bd - _0x244682) / 2),
                    }),
                    _0x172af0());
                }),
                  (_0x487b3d.onerror = () => _0x172af0()),
                  (_0x487b3d.src = _0x25ccbd));
              }));
          } catch (_0x536d2f) {
            window.showToast?.(_0x536d2f?.message || t('aigenImage.upload.failedRetry'), 'error');
          } finally {
            ((this._pendingRefSlot = ''), (this._refUploadInput.value = ''));
          }
        }),
        this.refBarEl.addEventListener('click', (_0x3e3dd8) => {
          const _0x349f66 = _0x3e3dd8.target.closest('.ref-thumb-delete');
          if (_0x349f66) {
            (_0x3e3dd8.stopPropagation(), _0x3e3dd8.preventDefault());
            const _0x2850c1 = _0x349f66.closest('.ref-thumb-wrap');
            if (_0x2850c1?.dataset?.refOrigin === 'asset') {
              const _0xa54958 = {
                  assetId: _0x2850c1.dataset.assetId,
                  assetIndex: _0x2850c1.dataset.assetIndex,
                  type: _0x2850c1.dataset.refType || _0x2850c1.dataset.type || _0x2850c1.dataset.kind,
                  occurrence: _0x2850c1.dataset.assetOccurrence,
                },
                _0x1b2e60 = String(_0x2850c1.dataset.assetRefSource || '').trim(),
                _0x5c5639 =
                  _0x1b2e60 === 'hidden'
                    ? removePromptAssetInputRefFromNode(this, _0xa54958)
                    : removeAssetMentionPillFromPrompt(this, _0xa54958) ||
                      removePromptAssetInputRefFromNode(this, _0xa54958);
              if (_0x5c5639) return;
            }
            const _0x1d8d7f = _0x2850c1?.dataset.edgeId;
            if (_0x1d8d7f) _0x34263a.removeEdge(_0x1d8d7f);
            return;
          }
          const _0x542056 = _0x3e3dd8.target.closest('.ref-upload-delete');
          if (_0x542056) {
            (_0x3e3dd8.stopPropagation(),
              _0x3e3dd8.preventDefault(),
              _0x34263a.updateNodeData(
                this.nodeId,
                buildImageInputGateClearPatch(getImageNodeInputGate(this._data?.model)),
              ));
            return;
          }
          const _0x1e4bd9 = _0x3e3dd8.target.closest('.ref-upload-slot');
          if (_0x1e4bd9) {
            (_0x3e3dd8.stopPropagation(), _0x3e3dd8.preventDefault());
            const _0x793cfb = _0x34263a.getState().nodes?.[this.nodeId],
              _0x5a2c17 = String(getImageNodeInputGate(_0x793cfb?.model).kind || '') === 'image',
              _0x407cb8 = isRhPersonReplaceWorkflowModel(_0x793cfb?.model),
              _0x951c5c = getFixedInputSlotConfigFromManifest(_0x793cfb || {}),
              _0x4d2486 = String(_0x1e4bd9.dataset.refSlot || _0x1e4bd9.dataset.slot || '').trim(),
              _0x50b8ee =
                !!_0x4d2486 &&
                _0x951c5c?.visibleSlots?.includes(_0x4d2486) &&
                _0x951c5c?.slotKindById?.[_0x4d2486] === 'image';
            (_0x5a2c17 || _0x407cb8 || _0x50b8ee) &&
              ((this._pendingRefSlot = _0x4d2486), this._refUploadInput?.click());
          }
        }),
        this.refBarEl.addEventListener('pointerdown', (_0x38c78b) => {
          _0x38c78b.target.closest(
            '.ref-thumb-wrap, .ref-upload-slot, .ref-upload-delete, .ref-thumb-delete',
          ) && _0x38c78b.stopPropagation();
        }));
      const _0x40a8fe = document.createElement('div');
      ((_0x40a8fe.className = 'prompt-input-wrapper'),
        _0x40a8fe.classList.add('is-resizable'),
        (this._promptInputWrap = _0x40a8fe),
        (this.promptEl = document.createElement('div')),
        (this.promptEl.className = 'prompt-textarea custom-textarea'),
        (this.promptEl.contentEditable = 'true'),
        (this.promptEl.spellcheck = false),
        this._syncPromptPlaceholder(this._data));
      if (!document.head.querySelector('#v2-gen-node-css')) {
        const _0x14bace = document.createElement('style');
        ((_0x14bace.id = 'v2-gen-node-css'),
          (_0x14bace.textContent =
            '\n                .prompt-textarea:empty::before {\n                    content: attr(data-placeholder);\n                    color: var(--text-placeholder);\n                    pointer-events: none;\n                }\n                .ref-pill {\n                    display: inline-flex; align-items: center; gap: 3px;\n                    background: transparent; border: none;\n                    border-radius: 4px; padding: 1px 6px; font-size: 14px; /* 原 12px -> 14px */\n                    color: var(--text-secondary); cursor: var(--pointer-cursor); user-select: text; -webkit-user-select: text; font-weight: 500;\n                    vertical-align: middle;\n                }\n                .ref-pill .pill-del {\n                    font-size: 16px; /* 原 14px -> 16px */ color: var(--text-muted);\n                    cursor: var(--link-cursor); margin-left: 2px; line-height: 1;\n                }\n                .ref-pill .pill-del:hover { color: var(--red); }\n                .ref-thumb-wrap.dragging { opacity: 0.3; }\n\n                .v2-slash-item {\n                    display: flex; flex-direction: column; justify-content: center;\n                    padding: 10px 12px; border-radius: 12px; cursor: var(--link-cursor);\n                    background: transparent; border: none;\n                    transition: all 0.2s; position: relative; height: 54px; overflow: hidden; box-sizing: border-box;\n                }\n                .v2-slash-item:hover, .v2-slash-item.active { background: var(--white-05); }\n                .v2-slash-title {\n                    color: var(--text-primary); font-size: 13px; font-weight: 600;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);\n                    transform: translateY(10px);\n                }\n                .v2-slash-desc {\n                    color: var(--text-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; margin-top: 4px;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;\n                    transform: translateY(16px);\n                    opacity: 0;\n                }\n                .v2-slash-item:hover > .v2-slash-title, .v2-slash-item.active > .v2-slash-title,\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    transform: translateY(0);\n                }\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    opacity: 1;\n                }\n            '),
          document.head.appendChild(_0x14bace));
      }
      ((this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
        this.promptEl.addEventListener('input', (_0x241d99) => {
          (schedulePromptHtmlCommit(this),
            this._checkAtTrigger(_0x241d99),
            _0x2315d7(_0x241d99, {
              promptEl: this.promptEl,
              nodeType: this._data.type,
              nodeId: this.nodeId,
              onGenerate: (_0x465b42, _0x4020a1) => this._onGenerate(_0x465b42, _0x4020a1),
            }),
            _0x109ec7(this),
            this._updateSubmitButtonState());
        }),
        this.promptEl.addEventListener('blur', () => {
          flushPromptHtmlCommit(this);
        }),
        this.promptEl.addEventListener('mouseover', (_0x12607c) => {
          _0x570ab9(_0x12607c, this);
        }),
        this.promptEl.addEventListener('mouseout', (_0x4d7dfa) => {
          _0x49424b(_0x4d7dfa, this);
        }),
        this.promptEl.addEventListener('keydown', (_0x36a1d0) => {
          if (handlePromptSelectAll(this, _0x36a1d0)) return;
          if (_0x1f702e(_0x36a1d0)) return;
          if (_0x193aa9(_0x36a1d0)) return;
          if (shouldSubmitPromptByKeyboard(_0x36a1d0)) {
            (_0x36a1d0.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
            return;
          }
          _0x53fccf(this, _0x36a1d0);
        }),
        this.promptEl.addEventListener('paste', (_0x5d9b63) => {
          handlePromptPaste(this, _0x5d9b63);
        }),
        _0x40a8fe.appendChild(this.promptEl),
        this._syncPromptBoxSizeFromData(this._data),
        this._setupPromptBoxResize());
      this._data.prompt &&
        ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), _0x488098(this));
      _0x27d2d2.appendChild(_0x40a8fe);
      if (isImageFreeAngleOnlyModel(this._data?.model)) {
        const _0x5ba66a = { model: DEFAULT_IMAGE_NODE_MODEL, provider: DEFAULT_IMAGE_NODE_PROVIDER };
        ((this._data = { ...this._data, ..._0x5ba66a }), _0x34263a.updateNodeData(this.nodeId, _0x5ba66a));
      }
      attachGenerationNodeHelpTip(this, {
        panel: _0x27d2d2,
        kind: 'image',
        getKey: () => this._data?.model,
        getLabel: () => _0x5859d4(this._data?.model),
      });
      const _0x2c0553 = document.createElement('div');
      ((_0x2c0553.className = 'prompt-panel-footer'), (this.footerEl = _0x2c0553));
      const _0x1a0cb1 = normalizeDreaminaImageModel(
          this._data.model || DEFAULT_IMAGE_NODE_MODEL,
          this._data?.provider,
        ),
        _0x498dd3 = isRhQwenImageEditModel(_0x1a0cb1),
        _0x4c03c3 =
          this._data?.generationParams &&
          typeof this._data.generationParams === 'object' &&
          !Array.isArray(this._data.generationParams)
            ? this._data.generationParams
            : {},
        _0x587b2c = _0x4c03c3.imageSize,
        _0x36376d =
          getNanoBananaSelectionFromModel(_0x1a0cb1, _0x587b2c || '2K', this._data?.provider) || null,
        _0x47edfd = this._getUiSchemaRenderNodeData(this._data),
        _0x16a2c3 = renderModelUiSchemaControls(_0x1a0cb1, _0x47edfd, {
          placement: 'mode',
          variant: 'pillMenu',
        }),
        _0xd0ab1c = renderModelUiSchemaControls(_0x1a0cb1, _0x47edfd, {
          placement: 'resolution',
          variant: 'resolutionPill',
        }),
        _0x157919 = renderModelUiSchemaControls(_0x1a0cb1, _0x47edfd, {
          placement: 'advanced',
          variant: 'advancedRow',
        }),
        _0x3acc18 = renderModelUiSchemaControls(_0x1a0cb1, _0x47edfd, {
          placement: 'instance',
          variant: 'instanceToggle',
        }),
        _0x45450d = renderModelUiSchemaControls(_0x1a0cb1, _0x47edfd, {
          placement: 'batch',
          variant: 'pillMenu',
        }),
        _0xec237a = hasModelUiSchema(_0x1a0cb1, { placement: 'advanced' });
      ((_0x2c0553.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap" style="position:relative;">\n              <button type="button" class="img-pill-btn img-model-btn-trigger">\n                ' +
        renderImageModelTriggerIconHTML({ model: _0x1a0cb1, provider: this._data?.provider }) +
        '\n                <span class="img-model-label">' +
        _0x5859d4(_0x1a0cb1) +
        '</span>\n              </button>\n              <span class="img-model-menu-lazy-anchor" data-lazy-model-menu="image"></span>\n            </div>\n            <div class="ui-schema-placement ui-schema-mode-slot" style="' +
        (_0x16a2c3 ? '' : 'display:none;') +
        '">\n              ' +
        _0x16a2c3 +
        '\n            </div>\n            <div class="ui-schema-placement ui-schema-resolution-slot" style="' +
        (_0xd0ab1c ? '' : 'display:none;') +
        '">\n              ' +
        _0xd0ab1c +
        '\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <div class="rh-adv-wrap" style="position:relative;' +
        (_0xec237a ? '' : 'display:none;') +
        '">\n              <button type="button" class="img-pill-btn rh-adv-btn">\n                <span class="rh-adv-btn-label">' +
        t('aigenImage.controls.advancedSettings') +
        '</span>\n              </button>\n            </div>\n            <div class="ui-schema-placement ui-schema-batch-slot" style="' +
        (_0x45450d ? '' : 'display:none;') +
        '">\n              ' +
        _0x45450d +
        '\n            </div>\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        t('aigenImage.controls.debugApiParams') +
        '">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot" style="' +
        (_0x3acc18 ? '' : 'display:none;') +
        '">\n              ' +
        _0x3acc18 +
        '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" title="' +
        t('aigenImage.controls.generate') +
        '">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
        _0x2c0553.insertAdjacentHTML(
          'beforeend',
          '\n            <div class="rh-adv-panel">\n              ' +
            _0x157919 +
            '\n            </div>\n      ',
        ));
      const _0x540493 = _0x2c0553.querySelector('.rh-adv-panel');
      ((this.rhAdvPanelEl = _0x540493),
        (this.modelWrap = _0x2c0553.querySelector('.img-model-wrap')),
        (this.rhAdvWrap = _0x2c0553.querySelector('.rh-adv-wrap')),
        (this.uiSchemaModeSlot = _0x2c0553.querySelector('.ui-schema-mode-slot')),
        (this.uiSchemaResolutionSlot = _0x2c0553.querySelector('.ui-schema-resolution-slot')),
        (this.uiSchemaInstanceSlot = _0x2c0553.querySelector('.ui-schema-instance-slot')),
        (this.uiSchemaBatchSlot = _0x2c0553.querySelector('.ui-schema-batch-slot')),
        (this.btnEl = _0x2c0553.querySelector('.img-gen-btn')));
      const _0x4632e3 = _0x2c0553.querySelector('.debug-wrench-btn');
      ((this._syncImageLocale = () => {
        (_0x2c0553
          .querySelector('.rh-adv-btn-label')
          ?.replaceChildren(document.createTextNode(t('aigenImage.controls.advancedSettings'))),
          _0x4632e3?.setAttribute('title', t('aigenImage.controls.debugApiParams')),
          this.btnEl?.setAttribute('title', t('aigenImage.controls.generate')),
          this._syncPromptPlaceholder?.(this._data),
          (this._lastRefHTML = ''),
          this._renderRefBar?.(),
          this._updateSubmitButtonState?.());
      }),
        this._unbindImageLocaleChange?.(),
        (this._unbindImageLocaleChange = onLocaleChange(() => this._syncImageLocale?.())),
        this._syncImageLocale(),
        this._uiSchemaCleanup?.(),
        (this._uiSchemaCleanup = bindModelUiSchemaControls(_0x2c0553, {
          nodeId: this.nodeId,
          nodeData: this._data,
          store: _0x34263a,
          buildPatch: (_0xa8872a, _0x37b10b, _0x58a96b) => {
            if (_0x37b10b !== 'aspectRatio') return {};
            return this._buildSchemaAspectRatioDisplayPatch(_0xa8872a, _0x58a96b);
          },
          decorateNodeData: (_0x58530b) => this._getUiSchemaRenderNodeData(_0x58530b),
        })),
        this._footerControllerCleanup?.(),
        (this._footerControllerCleanup = bindNodeFooterController(_0x2c0553)),
        (this._uiSchemaModel = _0x1a0cb1),
        this._applyModelParamVisibility(),
        _0x4632e3?.addEventListener('click', async (_0x11fcc2) => {
          (_0x11fcc2.stopPropagation(), flushPromptHtmlCommit(this));
          const _0x3b2d87 = await this._buildPayload();
          if (!_0x3b2d87) {
            window.showToast?.(t('aigenImage.debug.missingPayload'), 'warn');
            return;
          }
          try {
            const _0x386e6b = await _0x515c19.buildGenerateImageRequest(_0x3b2d87),
              _0x595645 = formatFinalApiDebugRequest(_0x386e6b),
              _0x4c1211 = _0x34263a.getState(),
              _0x14614a = this._data.x + (this._data.width || 0x17c) + 50,
              _0x6f6610 = this._data.y;
            let _0x41c195 = Object.values(_0x4c1211.nodes).find((_0x6cb9d6) => _0x6cb9d6.type === 'debug');
            (!_0x41c195
              ? _0x34263a.addNode({
                  id: 'debug-' + Date.now(),
                  type: 'debug',
                  x: _0x14614a,
                  y: _0x6f6610,
                  width: 0x17c,
                  height: 0x12c,
                  name: t('aigenImage.debug.nodeName'),
                  outputText: _0x595645,
                })
              : _0x34263a.updateNodeData(_0x41c195.id, { outputText: _0x595645, x: _0x14614a, y: _0x6f6610 }),
              window.showToast?.(t('aigenImage.debug.paramsShown'), 'warn'));
          } catch (_0x1709f0) {
            window.showToast?.(
              t('aigenImage.debug.buildRequestFailed', { error: _0x1709f0?.message || _0x1709f0 }),
              'error',
            );
          }
        }));
      const _0x16f8c8 = _0x2c0553.querySelector('.img-model-btn-trigger');
      let _0xa8cbc0 = null;
      const _0xc801de = _0x2c0553.querySelector('.img-model-label'),
        _0x4fdc9d = _0x2c0553.querySelector('.rh-res-popup'),
        _0x13eae0 = _0x2c0553.querySelector('.rh-adv-btn'),
        _0x4c1028 = () => {
          (_0x2c0553
            .querySelectorAll('.ui-schema-floating-menu')
            .forEach((_0x327992) => _0x327992.classList.remove('show')),
            _0x2c0553.querySelectorAll('.ui-schema-popup').forEach((_0x17bad7) => {
              _0x17bad7.style.display = 'none';
            }));
        },
        _0xb6caa4 = () => (_0xa8cbc0 && _0xa8cbc0.isConnected ? _0xa8cbc0 : null),
        _0x478649 = ({ keepModelMenu: keepModelMenu = false } = {}) => {
          if (!keepModelMenu) _0xb6caa4()?.classList.remove('show');
          if (_0x4fdc9d) _0x4fdc9d.style.display = 'none';
          if (_0x540493) _0x540493.classList.remove('show');
        },
        _0x52d689 = (_0x599c84) =>
          _0x599c84 && typeof _0x599c84 === 'object' && !Array.isArray(_0x599c84) ? { ..._0x599c84 } : {},
        _0x15b96e = (_0x2f322f, _0x28c3ee, _0x114bc0, _0x4f925b = {}) => {
          const _0x4c02fb = String(_0x2f322f?.model || '').trim(),
            _0x45584e = String(_0x28c3ee || '').trim(),
            _0xbf691d = _0x52d689(_0x2f322f?.generationParamsByModel);
          _0x4c02fb && (_0xbf691d[_0x4c02fb] = _0x52d689(_0x2f322f?.generationParams));
          const _0x1a106c = Object.prototype.hasOwnProperty.call(_0x4f925b, 'generationParams'),
            _0x205e02 = _0x1a106c ? _0x52d689(_0x4f925b.generationParams) : {},
            _0x173518 = _0x45584e ? _0xbf691d[_0x45584e] : undefined,
            _0x326ee1 = buildModelUiSchemaDefaultParams(_0x45584e),
            _0x175cb7 = getModelManifest(_0x45584e),
            _0x42aa85 = new Set(
              (_0x175cb7?.uiSchema?.fields || []).map((_0x4ec76d) => String(_0x4ec76d?.id || '').trim()),
            ),
            _0x41a047 = {};
          ['imageSize', 'aspectRatio', 'mode', 'batchSize'].forEach((_0x36ff43) => {
            _0x42aa85.has(_0x36ff43) &&
              Object.prototype.hasOwnProperty.call(_0x4f925b, _0x36ff43) &&
              (_0x41a047[_0x36ff43] = _0x4f925b[_0x36ff43]);
          });
          const _0x20365d = {
              ..._0x326ee1,
              ..._0x52d689(_0x173518),
              ...(_0x1a106c ? _0x205e02 : {}),
              ..._0x41a047,
            },
            _0x659a = sanitizeModelUiSchemaParams(
              _0x45584e,
              Object.fromEntries(Object.entries(_0x20365d).filter(([_0x434ad8]) => _0x42aa85.has(_0x434ad8))),
            ),
            { generationParams: _0x5a5350, ..._0x4720dc } = _0x4f925b,
            _0x271279 = { ..._0x4720dc };
          return (
            _0x42aa85.forEach((_0x4850f6) => {
              delete _0x271279[_0x4850f6];
            }),
            {
              ..._0x271279,
              model: _0x45584e,
              provider: _0x114bc0,
              generationParams: _0x659a,
              generationParamsByModel: _0xbf691d,
            }
          );
        };
      _0x2c0553.addEventListener('ui-schema-menu-before-open', () => {
        _0x478649();
      });
      const _0x455dd6 = (_0x4de08f) => {
          (bindImageModelMenuSubmenu({
            modelMenu: _0x4de08f,
            modelTrigger: _0x16f8c8,
            modelLabel: _0xc801de,
            nodeId: this.nodeId,
            store: _0x34263a,
            fallbackNodeData: this._data,
            toggleSelector: '[data-grsai-toggle]',
            submenuSelector: '.grsai-submenu',
            defaultProvider: 'grsai',
            buildModelPatch: _0x15b96e,
            resolveSelection: resolveGrsaiImageMenuSelection,
            afterSelect: ({ item: _0x18bb4a }) => setImageModelTriggerIcon(_0x16f8c8, 'grsai', _0x18bb4a),
          }),
            bindImageModelMenuSubmenu({
              modelMenu: _0x4de08f,
              modelTrigger: _0x16f8c8,
              modelLabel: _0xc801de,
              nodeId: this.nodeId,
              store: _0x34263a,
              fallbackNodeData: this._data,
              toggleSelector: '[data-ppio-toggle]',
              submenuSelector: '.ppio-submenu',
              defaultProvider: 'ppio',
              buildModelPatch: _0x15b96e,
              afterSelect: ({ item: _0x954997 }) => setImageModelTriggerIcon(_0x16f8c8, 'ppio', _0x954997),
            }),
            bindDreaminaImageMenu({
              modelMenu: _0x4de08f,
              modelTrigger: _0x16f8c8,
              modelLabel: _0xc801de,
              nodeId: this.nodeId,
              store: _0x34263a,
              buildModelPatch: _0x15b96e,
            }),
            bindImageModelMenuSubmenu({
              modelMenu: _0x4de08f,
              modelTrigger: _0x16f8c8,
              modelLabel: _0xc801de,
              nodeId: this.nodeId,
              store: _0x34263a,
              fallbackNodeData: this._data,
              toggleSelector: '[data-apimart-toggle]',
              submenuSelector: '.apimart-submenu',
              defaultProvider: 'apimart',
              buildModelPatch: _0x15b96e,
              resolveSelection: resolveApimartImageMenuSelection,
              afterSelect: ({ item: _0x4e1021 }) => setImageModelTriggerIcon(_0x16f8c8, 'apimart', _0x4e1021),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: _0x4de08f,
              modelTrigger: _0x16f8c8,
              modelLabel: _0xc801de,
              nodeId: this.nodeId,
              store: _0x34263a,
              fallbackNodeData: this._data,
              toggleSelector: '[data-agnes-toggle]',
              submenuSelector: '.agnes-submenu',
              defaultProvider: 'agnes',
              buildModelPatch: _0x15b96e,
              afterSelect: ({ item: _0x44977b }) => setImageModelTriggerIcon(_0x16f8c8, 'agnes', _0x44977b),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: _0x4de08f,
              modelTrigger: _0x16f8c8,
              modelLabel: _0xc801de,
              nodeId: this.nodeId,
              store: _0x34263a,
              fallbackNodeData: this._data,
              toggleSelector: '[data-volcengine-toggle]',
              submenuSelector: '.volcengine-submenu',
              defaultProvider: 'volcengine',
              buildModelPatch: _0x15b96e,
              resolveSelection: resolveVolcengineImageMenuSelection,
              afterSelect: ({ item: _0x4fd484 }) =>
                setImageModelTriggerIcon(_0x16f8c8, 'volcengine', _0x4fd484),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: _0x4de08f,
              modelTrigger: _0x16f8c8,
              modelLabel: _0xc801de,
              nodeId: this.nodeId,
              store: _0x34263a,
              fallbackNodeData: this._data,
              toggleSelector: '[data-runninghubwf-toggle]',
              submenuSelector: '.runninghubwf-submenu',
              defaultProvider: 'runninghubwf',
              buildModelPatch: _0x15b96e,
              resolveSelection: resolveRunningHubWorkflowImageMenuSelection,
              onDisabled: () =>
                window.showToast?.(
                  t('aigenImage.modelMenu.unavailable', {
                    model: t('aigenImage.modelMenu.personReplaceV3.title'),
                  }),
                  'warn',
                ),
              beforeSelect: ({ item: _0x3a7894, model: _0x43cb94, provider: _0x2869e6 }) => {
                const _0x3ef9ee = this._runVipRetryOnce(() => _0x3a7894.click());
                return this._guardVipSelection(_0x43cb94, _0x2869e6, _0x3ef9ee);
              },
              afterSelect: ({ item: _0x3d5916 }) =>
                setImageModelTriggerIcon(_0x16f8c8, 'runninghubwf', _0x3d5916),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: _0x4de08f,
              modelTrigger: _0x16f8c8,
              modelLabel: _0xc801de,
              nodeId: this.nodeId,
              store: _0x34263a,
              fallbackNodeData: this._data,
              toggleSelector: '[data-runninghub-toggle]',
              submenuSelector: '.runninghub-submenu',
              defaultProvider: 'runninghubwf',
              buildModelPatch: _0x15b96e,
              resolveSelection: resolveRunningHubModelImageMenuSelection,
              afterSelect: ({ item: _0x166b78, provider: _0x2310e9 }) =>
                setImageModelTriggerIcon(_0x16f8c8, _0x2310e9, _0x166b78),
            }));
        },
        _0x3f8d26 = () => {
          const _0x120627 = _0xb6caa4();
          if (_0x120627) return _0x120627;
          if (!this.modelWrap) return null;
          const _0x4d73ad = (_0x34263a.getState?.() || {}).nodes?.[this.nodeId] || this._data || {},
            _0x55ef22 = normalizeDreaminaImageModel(
              _0x4d73ad.model || DEFAULT_IMAGE_NODE_MODEL,
              _0x4d73ad.provider,
            ),
            _0xe3106a =
              _0x4d73ad?.generationParams &&
              typeof _0x4d73ad.generationParams === 'object' &&
              !Array.isArray(_0x4d73ad.generationParams)
                ? _0x4d73ad.generationParams
                : {},
            _0xc141d1 =
              getNanoBananaSelectionFromModel(_0x55ef22, _0xe3106a.imageSize || '2K', _0x4d73ad?.provider) ||
              null,
            _0x42f00b = document.createElement('template');
          _0x42f00b.innerHTML = buildImageModelMenuHTML({
            activeModel: _0x55ef22,
            nanoSelection: _0xc141d1,
          }).trim();
          const _0x30a4ce = _0x42f00b.content.firstElementChild;
          if (!_0x30a4ce) return null;
          const _0xc802b9 = this.modelWrap.querySelector("[data-lazy-model-menu='image']");
          return (
            _0xc802b9 ? _0xc802b9.replaceWith(_0x30a4ce) : this.modelWrap.appendChild(_0x30a4ce),
            (_0xa8cbc0 = _0x30a4ce),
            _0x455dd6(_0x30a4ce),
            _0x30a4ce
          );
        };
      _0x16f8c8?.addEventListener('click', (_0xfc672) => {
        _0xfc672.stopPropagation();
        const _0x3f046e = _0x3f8d26();
        if (!_0x3f046e) return;
        const _0x152a90 = !_0x3f046e.classList.contains('show');
        (closeNodeFooterMenus(_0x2c0553, _0x3f046e),
          _0x478649({ keepModelMenu: true }),
          _0x4c1028(),
          _0x3f046e.classList.toggle('show', _0x152a90),
          _0x152a90 && typeof _0x3d07ce === 'function' && _0x3d07ce(_0x3f046e));
      });
      _0x13eae0 &&
        _0x540493 &&
        (_0x13eae0.addEventListener('click', (_0x2043f8) => {
          (_0x2043f8.stopPropagation(),
            _0x540493.classList.toggle('show'),
            _0xb6caa4()?.classList.remove('show'));
          if (_0x4fdc9d) _0x4fdc9d.style.display = 'none';
          _0x4c1028();
        }),
        _0x540493.addEventListener('click', (_0x4bff6e) => _0x4bff6e.stopPropagation()));
      (this.btnEl.addEventListener('click', () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      }),
        document.addEventListener('click', () => {
          _0xb6caa4()?.classList.remove('show');
          if (_0x4fdc9d) _0x4fdc9d.style.display = 'none';
          _0x4c1028();
        }),
        _0x2c0553.appendChild(document.createTextNode('')),
        _0x27d2d2.appendChild(_0x2c0553),
        _0x3a0bc3.appendChild(_0x27d2d2));
      this._rendererMediaDeferred === true
        ? (this._renderRefBarPendingWhenVisible = true)
        : this._renderRefBar();
      (this._assetMentionRegistryUnsubscribe?.(),
        (this._assetMentionRegistryUnsubscribe = subscribeAssetMentionRegistry(() => {
          if (this._assetMentionRegistryRefreshPending) return;
          ((this._assetMentionRegistryRefreshPending = true),
            queueMicrotask(() => {
              this._assetMentionRegistryRefreshPending = false;
              if (!_0x34263a.getState().nodes?.[this.nodeId]) return;
              _0x488098(this);
              if (this._rendererMediaDeferred === true) {
                this._renderRefBarPendingWhenVisible = true;
                return;
              }
              (this._renderRefBar(), this._updateSubmitButtonState());
            }));
        })));
      const _0x33eb9f = getImageNodeRootClass(this._data?.model);
      if (_0x33eb9f) _0x3a0bc3.classList.add(_0x33eb9f);
      isRhPersonReplaceWorkflowModel(this._data?.model) &&
        _0x3a0bc3.classList.add('rh-person-replace-v3-node');
      const _0x2248dd = _0x3a0bc3.querySelector('.node-floating-toolbar');
      (_0x39dac6(_0x2248dd, this.nodeId),
        (this._qualityBtns = _0x3a0bc3
          ? Array.from(_0x3a0bc3.querySelectorAll('.img-rp-quality-item'))
          : []));
      const _0x570f4b = this.refBarEl?.querySelector('.prompt-attachment-btn');
      return (
        (this._attachBtnIcon = _0x570f4b ? _0x570f4b.querySelector('.btn-icon') : null),
        _0x11e3ea &&
          _0x11e3ea.addEventListener('pointerdown', (_0x324c7b) => {
            const _0x4645c7 = _0x34263a.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
              _0x166e6b = document
                .getElementById('v2-wrap')
                ?.classList.contains('v2-media-node-resize-enabled');
            if (!(_0x4645c7 && _0x166e6b)) return;
            if (_0x324c7b.button !== 0) return;
            (_0x324c7b.preventDefault(),
              _0x324c7b.stopPropagation(),
              startNodeResizePreview({
                event: _0x324c7b,
                nodeId: this.nodeId,
                getNode: () => _0x34263a.getStateRaw().nodes?.[this.nodeId] || this._data,
                getViewport: () => _0x34263a.getStateRaw().viewport,
                resolveSize: ({
                  startWidth: _0x419ffc,
                  startHeight: _0x3779fc,
                  dx: _0x16c6cc,
                  dy: _0x55d9a0,
                }) => {
                  const _0x7c7f47 = _0x419ffc / _0x3779fc,
                    _0x2e01de = Math.max(_0x16c6cc / _0x419ffc, _0x55d9a0 / _0x3779fc),
                    _0x1ebc81 = Math.max(AI_IMAGE_MIN_SIZE / _0x419ffc, AI_IMAGE_MIN_SIZE / _0x3779fc),
                    _0x858594 = Math.max(_0x1ebc81, 1 + _0x2e01de),
                    _0x5a1a4e = Math.max(AI_IMAGE_MIN_SIZE, Math.round(_0x419ffc * _0x858594)),
                    _0x5efb19 = Math.max(AI_IMAGE_MIN_SIZE, Math.round(_0x5a1a4e / _0x7c7f47));
                  return { width: _0x5a1a4e, height: _0x5efb19 };
                },
                buildFinalPatch: ({ startNode: _0x33d539 }) =>
                  _0x33d539?.needsAutoResize ? { needsAutoResize: false } : {},
                applyPatch: (_0x25786f) => _0x34263a.updateNodeData(this.nodeId, _0x25786f),
                commit: commit,
              }));
          }),
        this._updateSubmitButtonState(),
        typeof this._maybeResumeDreaminaTaskImpl === 'function' &&
          queueMicrotask(() => {
            _0x34263a.getState().nodes?.[this.nodeId] && this._maybeResumeDreaminaTaskImpl();
          }),
        typeof this._maybeResumeAsyncTaskImpl === 'function' &&
          queueMicrotask(() => {
            _0x34263a.getState().nodes?.[this.nodeId] && this._maybeResumeAsyncTaskImpl();
          }),
        typeof this._maybeResumeRunningHubTaskImpl === 'function' &&
          queueMicrotask(() => {
            _0x34263a.getState().nodes?.[this.nodeId] && this._maybeResumeRunningHubTaskImpl();
          }),
        _0x3a0bc3
      );
    }
    ['hydrateDeferredMedia']() {
      if (this._rendererMediaDeferred !== true) return;
      ((this._rendererMediaDeferred = false),
        void this._loadAndDisplayImage({ force: true }),
        this._applyMaskPreview(this._data?.maskPreviewUrl || this._data?.maskPreview),
        (this._renderRefBarPendingWhenVisible = false),
        this._renderRefBar?.());
    }
    async ['_switchToFreeAngle']() {
      if (!this._promptPanel) return;
      if (_0x5c3840.active && _0x5c3840.nodeId === this.nodeId) {
        _0x5c3840._exit();
        return;
      }
      if (window.v2FocusOnNodeAtZoomPercent) window.v2FocusOnNodeAtZoomPercent(this.nodeId, 60);
      const _0x512329 = this._root.querySelector('.act-multiangle');
      await _0x5c3840.render(
        this.nodeId,
        this._promptPanel,
        () => this._switchToPrompt(),
        () => this._onGenerate(),
        _0x512329,
      );
    }
    ['_switchToPrompt']() {
      if (!this._promptPanel) return;
      this._promptPanel.innerHTML = '';
      const _0x469bcb = this.modelWrap?.closest('.prompt-panel-footer'),
        _0x5ec704 = this.promptEl?.closest('.prompt-input-wrapper');
      if (this.refBarEl) this._promptPanel.appendChild(this.refBarEl);
      if (_0x5ec704) this._promptPanel.appendChild(_0x5ec704);
      if (_0x469bcb) this._promptPanel.appendChild(_0x469bcb);
      this._renderRefBar();
    }
    ['_updateSubmitButtonState']() {
      if (!this.btnEl) return;
      const _0x48d51c = typeof _0x34263a.getState === 'function' ? _0x34263a.getState() : {},
        _0x38c1cd = _0x48d51c?.nodes || {},
        _0x1a5d2b = _0x38c1cd?.[this.nodeId] || this._data || {},
        _0x1d04ee =
          typeof _0x34263a.getIncomingEdges === 'function' ? _0x34263a.getIncomingEdges(this.nodeId) : [],
        _0x5142a2 = resolvePromptTextWithTextRefs({
          promptEl: this.promptEl,
          inEdges: _0x1d04ee,
          nodes: _0x38c1cd,
        }),
        _0x3e5aba = Array.from(_0x5142a2).length,
        _0x565fdd = hasImageInputForUiSchemaNodeData({
          nodeId: this.nodeId,
          nodeData: _0x1a5d2b,
          state: _0x48d51c,
          incomingEdges: _0x1d04ee,
        }),
        _0x5c00a7 = String(_0x1a5d2b?.model || '').trim(),
        _0x352eac =
          _0x5c00a7 === 'runninghub-model/seedream-v4' ||
          _0x5c00a7 === 'runninghub-model/seedream-v4.5' ||
          _0x5c00a7 === 'runninghub-model/seedream-v5-lite',
        _0x44f2b3 = this._isRunninghubWorkflowModel(_0x1a5d2b?.model, _0x1a5d2b?.provider),
        _0x149629 = getImageNodeInputGate(_0x1a5d2b?.model),
        _0x570e4e = String(_0x149629.kind || '') === 'image',
        _0x468994 = shouldUseImageWorkflowBusyButton(_0x1a5d2b?.model),
        _0x57ad15 = resolveGenerationButtonMode(_0x1a5d2b, {
          cancellable: _0x44f2b3,
          cancelInFlight: this._rhCancelInFlight === true,
        });
      if (_0x57ad15.busy) {
        _0x44f2b3
          ? setGenerateButtonCancellableUi(this.btnEl, {
              title: t('aigenImage.controls.cancelTaskTooltip'),
              tooltip: t('aigenImage.controls.cancelTaskTooltip'),
              ariaLabel: t('aigenImage.controls.cancelGenerate'),
              busy: _0x468994,
            })
          : setGenerateButtonLoadingUi(this.btnEl, {
              title: t('aigenImage.controls.generate'),
              disabled: true,
              ariaLabel: t('aigenImage.controls.generate'),
            });
        ((this.btnEl.disabled = _0x57ad15.disabled), (this.btnEl.style.cursor = _0x57ad15.cursor));
        return;
      }
      resetGenerateButtonIdleUi(this.btnEl, t('aigenImage.controls.generate'));
      if (_0x44f2b3) {
        if (_0x570e4e) {
          const _0x26e08b = !!getImageInputGateUploadedUrl(_0x1a5d2b, _0x149629),
            _0x4251f7 = _0x1d04ee.some(
              (_0x252178) => _0x47780a(_0x38c1cd[_0x252178.sourceId]?.type || '') === 'image',
            ),
            _0x3cdd22 = _0x26e08b || _0x4251f7;
          ((this.btnEl.disabled = !_0x3cdd22),
            (this.btnEl.style.cursor = _0x3cdd22 ? '' : 'var(--unavailable-cursor)'));
          return;
        }
        ((this.btnEl.disabled = false), (this.btnEl.style.cursor = ''));
        return;
      }
      if (_0x352eac) {
        const _0x310efb = _0x3e5aba >= 5;
        ((this.btnEl.disabled = !_0x310efb),
          (this.btnEl.style.cursor = _0x310efb ? '' : 'var(--unavailable-cursor)'));
        return;
      }
      !_0x5142a2 && !_0x565fdd
        ? ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'))
        : ((this.btnEl.disabled = false), (this.btnEl.style.cursor = ''));
    }
    async ['_loadAndDisplayImage'](_0x2cc9d0 = {}) {
      if (this._rendererMediaDeferred === true && _0x2cc9d0?.force !== true) return;
      const _0x2d8473 = _0x2cc9d0?.force === true,
        _0x5d7344 = this._data.images || [];
      _0x5d7344.length === 0 &&
        (this._data.imageUrl || this._data.localPath || this._data.thumbUrl || this._data.thumbId) &&
        _0x5d7344.push({
          imageUrl: this._data.imageUrl,
          sourceUrl: this._data.sourceUrl,
          thumbUrl: this._data.thumbUrl,
          sourceId: this._data.sourceId,
          thumbId: this._data.thumbId,
          localPath: this._data.localPath,
          originalLocalPath: this._data.originalLocalPath,
          displayLocalPath: this._data.displayLocalPath,
          thumbLocalPath: this._data.thumbLocalPath,
        });
      const _0x3b1d4e =
          String(this._data.rhStatusMessage || '').trim() ||
          (String(this._data.jobStatus || '').toLowerCase() === 'error' ? getTaskMessage(this._data) : ''),
        _0x2fb795 = this._data.rhStatusCode;
      if (_0x3b1d4e && _0x5d7344.length === 0) {
        ((this.imgEl.style.display = 'none'), delete this.imgEl.dataset.lodSrc, (this.imgEl.src = ''));
        this._multiImagesContainer &&
          (this._multiImagesContainer.remove(), (this._multiImagesContainer = null));
        (clearMultiResultStackClasses({ previewEl: this.previewEl, stackWrap: this._multiStackWrap }),
          (this._multiStackWrap = null),
          (this._multiBackdropWrap = null),
          (this._multiBackplateKeyStr = ''));
        !this._statusOverlayEl &&
          ((this._statusOverlayEl = document.createElement('div')),
          Object.assign(this._statusOverlayEl.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }),
          this.previewEl.appendChild(this._statusOverlayEl));
        ((this._statusOverlayEl.innerHTML = ''),
          this._statusOverlayEl.appendChild(this._createStatusCard(_0x3b1d4e, _0x2fb795)));
        return;
      }
      this._statusOverlayEl && (this._statusOverlayEl.remove(), (this._statusOverlayEl = null));
      const _0xff5e6e = this._data.isImagesExpanded || false;
      let _0x1e6312 = this._data.mainImageIndex || 0;
      if (_0x1e6312 >= _0x5d7344.length) _0x1e6312 = 0;
      const _0x57b59c = _0x5d7344
          .map(
            (_0x3692d1) =>
              _0x3692d1.thumbId +
              '|' +
              _0x3692d1.localPath +
              '|' +
              _0x3692d1.originalLocalPath +
              '|' +
              _0x3692d1.displayLocalPath +
              '|' +
              _0x3692d1.thumbLocalPath +
              '|' +
              _0x3692d1.thumbUrl +
              '|' +
              _0x3692d1.imageUrl,
          )
          .join(','),
        _0x4ba828 = _0x57b59c !== this._lastImagesKeyStr,
        _0x16c8fe = _0x1e6312 !== this._lastMainIdx,
        _0x17ba60 = _0xff5e6e !== this._lastIsExpanded,
        _0x3dbd51 = this._shouldUseLowZoomThumbnail() ? 'thumb' : 'full',
        _0x59d59b = _0x3dbd51 !== this._lastImageLodMode,
        _0x3b7aa1 = shouldRefreshMultiResultStackDom({
          imageCount: _0x5d7344.length,
          previewEl: this.previewEl,
          containerEl: this._multiImagesContainer,
          stackWrap: this._multiStackWrap,
          backdropWrap: this._multiBackdropWrap,
        });
      if (!_0x2d8473 && !_0x4ba828 && !_0x16c8fe && !_0x17ba60 && !_0x59d59b && !_0x3b7aa1) return;
      ((this._lastImagesKeyStr = _0x57b59c),
        (this._lastMainIdx = _0x1e6312),
        (this._lastIsExpanded = _0xff5e6e),
        (this._lastImageLodMode = _0x3dbd51));
      (this._currentSourceId !== this._data.sourceId ||
        this._currentLocalPath !== pickCanvasImageLocalPath(this._data)) &&
        (this._cachedSourceUrl &&
          this._cachedSourceUrl.startsWith('blob:') &&
          URL.revokeObjectURL(this._cachedSourceUrl),
        (this._cachedSourceUrl = null),
        (this._currentSourceId = this._data.sourceId),
        (this._currentLocalPath = pickCanvasImageLocalPath(this._data)));
      if (_0x5d7344.length === 0) {
        ((this.imgEl.style.display = 'none'), delete this.imgEl.dataset.lodSrc, (this.imgEl.src = ''));
        if (this._placeholderEl) this._placeholderEl.style.display = 'flex';
        this._multiImagesContainer &&
          (this._multiImagesContainer.remove(), (this._multiImagesContainer = null));
        (clearMultiResultStackClasses({ previewEl: this.previewEl, stackWrap: this._multiStackWrap }),
          (this._multiStackWrap = null),
          (this._multiBackdropWrap = null),
          (this._multiBackplateKeyStr = ''));
        return;
      }
      if (this._placeholderEl) this._placeholderEl.style.display = 'none';
      if (_0x57b59c !== this._resolvedUrlsKey || !this._resolvedMainUrls || !this._resolvedAuxUrls) {
        const _0x19fb1a = new Set(_0x5d7344.map((_0x13aa71) => _0x13aa71.thumbId).filter(Boolean));
        for (const [_0xa76343, _0x28a5a5] of this._thumbObjectUrls.entries()) {
          !_0x19fb1a.has(_0xa76343) &&
            (_0x28a5a5 && String(_0x28a5a5).startsWith('blob:') && URL.revokeObjectURL(_0x28a5a5),
            this._thumbObjectUrls.delete(_0xa76343));
        }
        const _0xf6bb4b = [],
          _0x5dd11b = [];
        for (const _0x359cc2 of _0x5d7344) {
          const _0x54fc21 = toLocalPathUrl(pickCanvasImageLocalPath(_0x359cc2)),
            _0x2a2f58 = toLocalPathUrl(pickCanvasThumbLocalPath(_0x359cc2));
          let _0xd52306 = '';
          if (_0x359cc2.thumbId) {
            if (this._thumbObjectUrls.has(_0x359cc2.thumbId))
              _0xd52306 = this._thumbObjectUrls.get(_0x359cc2.thumbId);
            else {
              const _0x25c032 = await _0xdfb594(_0x359cc2.thumbId);
              if (_0x25c032) {
                const _0x3a378e = URL.createObjectURL(_0x25c032);
                (this._thumbObjectUrls.set(_0x359cc2.thumbId, _0x3a378e), (_0xd52306 = _0x3a378e));
              }
            }
          }
          const _0xea5f0d =
              _0x54fc21 ||
              _0xd52306 ||
              String(_0x359cc2.imageUrl || _0x359cc2.sourceUrl || _0x359cc2.thumbUrl || '').trim(),
            _0x10e747 =
              _0x2a2f58 ||
              _0xd52306 ||
              _0xea5f0d ||
              String(_0x359cc2.thumbUrl || _0x359cc2.imageUrl || _0x359cc2.sourceUrl || '').trim();
          (_0xf6bb4b.push(_0xea5f0d), _0x5dd11b.push(_0x10e747));
        }
        ((this._resolvedUrlsKey = _0x57b59c),
          (this._resolvedMainUrls = _0xf6bb4b),
          (this._resolvedAuxUrls = _0x5dd11b));
      }
      const _0x1354cd = this._resolvedMainUrls || [],
        _0x400f45 = this._resolvedAuxUrls || _0x1354cd;
      if (_0x5d7344.length === 1) {
        this._multiImagesContainer &&
          (this._multiImagesContainer.remove(), (this._multiImagesContainer = null));
        (clearMultiResultStackClasses({ previewEl: this.previewEl, stackWrap: this._multiStackWrap }),
          (this._multiStackWrap = null),
          (this._multiBackdropWrap = null),
          (this._multiBackplateKeyStr = ''));
        const _0x13120c = _0x5d7344[0];
        if (_0x13120c.error)
          ((this.imgEl.style.display = 'none'),
            delete this.imgEl.dataset.lodSrc,
            (this.imgEl.src = ''),
            (this._multiImagesContainer = document.createElement('div')),
            Object.assign(this._multiImagesContainer.style, {
              position: 'absolute',
              inset: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }),
            this._multiImagesContainer.appendChild(this._createErrorCard(_0x13120c.error)),
            this.previewEl.appendChild(this._multiImagesContainer));
        else {
          const _0x330b89 = this._pickImageDisplayUrl(_0x1354cd[0], _0x400f45[0]);
          this._setImageElementDisplaySource(this.imgEl, _0x330b89);
        }
        return;
      }
      ((this.imgEl.style.display = 'none'), this._root?.style.setProperty('overflow', 'visible'));
      const _0x4846b7 = this._pickImageDisplayUrl(_0x1354cd[_0x1e6312], _0x400f45[_0x1e6312]);
      this._setImageElementDisplaySource(this.imgEl, _0x4846b7, { display: false });
      !this._multiImagesContainer &&
        ((this._multiImagesContainer = document.createElement('div')),
        (this._multiImagesContainer.className = 'multi-images-container'),
        (this._multiImagesContainer.style.width = '100%'),
        (this._multiImagesContainer.style.height = '100%'),
        (this._multiImagesContainer.style.position = 'absolute'),
        (this._multiImagesContainer.style.top = '0'),
        (this._multiImagesContainer.style.left = '0'),
        this.previewEl.appendChild(this._multiImagesContainer));
      ((this._multiImagesContainer.style.width = '100%'),
        (this._multiImagesContainer.style.height = '100%'),
        (this._multiImagesContainer.style.display = 'block'));
      const _0x5ebd68 = _0x5d7344.length,
        _0x51560b = 0x1f4;
      let _0x49dec8 = () => {};
      const _0x3c1fed = buildMultiResultBackplateItems({ imageCount: _0x5ebd68, mainIndex: _0x1e6312 }),
        _0x57ae04 = getMultiResultBackplateKey(_0x3c1fed),
        _0x4592f6 = this._data.width || this._root.clientWidth || 0x140,
        _0x5098e3 = this._data.height || this._root.clientHeight || Math.round((_0x4592f6 * 9) / 16),
        _0x5347bc = (_0x170cc4) => {
          for (let _0x248ae3 = 0; _0x248ae3 < _0x5ebd68; _0x248ae3 += 1) {
            const _0x3b6930 = _0x248ae3 === _0x170cc4,
              _0x4c59e1 = this._multiLayerEls[_0x248ae3],
              _0x203ea3 = this._multiErrorEls[_0x248ae3];
            if (_0x4c59e1) {
              if (_0x3b6930) this._loadLazyImageDisplaySource(_0x4c59e1);
              else
                this._scheduleClearLazyImageDisplaySource(
                  _0x4c59e1,
                  AIGEN_IMAGE_HIDDEN_SOURCE_CLEAR_DELAY_MS,
                );
              ((_0x4c59e1.style.display = _0x3b6930 ? 'block' : 'none'),
                (_0x4c59e1.style.pointerEvents = _0x3b6930 ? '' : 'none'),
                _0x3b6930 &&
                  ((_0x4c59e1.style.transform = 'rotate(0deg) scale(1)'),
                  (_0x4c59e1.style.opacity = '1'),
                  (_0x4c59e1.style.zIndex = _0x5ebd68 + 1),
                  (_0x4c59e1.style.boxShadow = '0 4px 12px var(--black-40)')));
            }
            _0x203ea3 &&
              ((_0x203ea3.style.display = _0x3b6930 ? 'flex' : 'none'),
              (_0x203ea3.style.zIndex = _0x3b6930 ? _0x5ebd68 + 1 : _0x248ae3));
          }
          this._lastMainIdx = _0x170cc4;
        },
        _0x277fc0 = (_0x4de53e) => {
          const _0xaedc26 = _0x34263a.getState().nodes[this.nodeId],
            _0x6bc516 = _0xaedc26.images || [];
          if (_0x6bc516.length === 0) return;
          const _0x3c3ae1 = _0x6bc516[_0x4de53e] ? _0x4de53e : 0,
            _0x5002a4 = _0x6bc516[_0x3c3ae1] || _0x6bc516[0];
          (_0x5347bc(_0x3c3ae1),
            syncMultiResultStackClasses({
              previewEl: this.previewEl,
              stackWrap: this._multiStackWrap,
              isActive: _0x5ebd68 > 1,
              isExpanded: false,
            }),
            _0x1cdcc5(this._multiToggleBtn, false),
            _0x49dec8(false),
            setTimeout(() => {
              _0x34263a.updateNodeData(this.nodeId, {
                mainImageIndex: _0x3c3ae1,
                isImagesExpanded: false,
                imageUrl: _0x5002a4.imageUrl,
                sourceUrl: _0x5002a4.sourceUrl,
                thumbUrl: _0x5002a4.thumbUrl,
                sourceId: _0x5002a4.sourceId,
                thumbId: _0x5002a4.thumbId,
                localPath: _0x5002a4.localPath,
              });
            }, _0x51560b));
        },
        _0x1cdcc5 = (_0xddfe19, _0x5e03d3) => {
          if (!_0xddfe19) return;
          const _0x215820 = {
              bg: 'var(--black-45)',
              color: 'var(--white-90)',
              border: '1px solid var(--white-15)',
            },
            _0x46bd7b = { bg: 'var(--black-70)', color: 'var(--white-80)', border: '1px solid transparent' },
            _0x260c3c = _0x5e03d3 ? _0x46bd7b : _0x215820;
          ((_0xddfe19.innerHTML = _0x5e03d3
            ? '<span>' +
              t('aigenImage.result.imageCount', { count: _0x5ebd68 }) +
              '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
            : '<span>' +
              t('aigenImage.result.imageCount', { count: _0x5ebd68 }) +
              '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
            (_0xddfe19.style.background = _0x260c3c.bg),
            (_0xddfe19.style.color = _0x260c3c.color),
            (_0xddfe19.style.border = _0x260c3c.border));
        },
        _0x5434f9 = getMultiResultBackplateCount(_0x5ebd68),
        _0x4a3a39 = this._multiStackWrap?.parentNode === this._multiImagesContainer,
        _0x1cbe54 = Number(this._multiBackdropWrap?.children?.length) || 0,
        _0xa25971 =
          _0x4ba828 ||
          _0x16c8fe ||
          _0x59d59b ||
          !_0x4a3a39 ||
          _0x1cbe54 !== _0x5434f9 ||
          this._multiBackplateKeyStr !== _0x57ae04;
      if (_0xa25971) {
        ((this._multiImagesContainer.innerHTML = ''),
          (this._multiLayerEls = []),
          (this._multiErrorEls = []),
          (this._multiBackplateEls = []),
          (this._multiToggleBtn = null),
          (this._multiBackdropWrap = null),
          (this._multiStackCardsLaidOut = false),
          (this._multiStackWrap = document.createElement('div')),
          (this._multiStackWrap.className = MULTI_RESULT_STACK_WRAP_CLASS),
          Object.assign(this._multiStackWrap.style, { position: 'relative', width: '100%', height: '100%' }),
          (this._multiBackdropWrap = createMultiResultBackplates(document, _0x5ebd68, { items: _0x3c1fed })));
        this._multiBackdropWrap &&
          (this._multiStackWrap.appendChild(this._multiBackdropWrap),
          this._multiBackdropWrap
            .querySelectorAll('.' + MULTI_RESULT_BACKPLATE_CLASS)
            .forEach((_0x2380a3) => {
              const _0x32719f = Number(_0x2380a3.dataset?.imageIndex);
              if (!Number.isFinite(_0x32719f)) return;
              this._multiBackplateEls[_0x32719f] = _0x2380a3;
              const _0x2fc0fb = this._pickImageDisplayUrl(_0x1354cd[_0x32719f], _0x400f45[_0x32719f], {
                  lowZoomThumbnail: false,
                }),
                _0x55c49c = _0x5d7344[_0x32719f];
              if (!_0x55c49c?.error) {
                const _0x4d5fb4 = document.createElement('img');
                ((_0x4d5fb4.className = 'multi-stack-backplate-media'),
                  this._setLazyImageDisplaySource(_0x4d5fb4, _0x2fc0fb),
                  (_0x4d5fb4.decoding = 'async'),
                  (_0x4d5fb4.draggable = false),
                  _0x4d5fb4.addEventListener('dragstart', (_0x5a9220) => _0x5a9220.preventDefault()),
                  _0x2380a3.appendChild(_0x4d5fb4));
              }
              const _0x534f2f = this._bindResultImageDragOut(_0x2380a3, {
                imageIndex: _0x32719f,
                getGhostSourceElement: () => _0x2380a3.querySelector('img') || _0x2380a3,
                getFallbackSrc: () =>
                  _0x2380a3.querySelector('img')?.currentSrc ||
                  _0x2380a3.querySelector('img')?.src ||
                  _0x2fc0fb.url ||
                  '',
                getFallbackSize: () => ({
                  width: this.previewEl?.offsetWidth || this._data?.width || 0x140,
                  height: this.previewEl?.offsetHeight || this._data?.height || 0x140,
                }),
              });
              (_0x2380a3.addEventListener('pointerdown', (_0x19261e) => {
                const _0x37e588 = _0x34263a.getState().nodes[this.nodeId];
                _0x37e588?.isImagesExpanded && _0x19261e.stopPropagation();
              }),
                _0x2380a3.addEventListener('click', (_0x2910ce) => {
                  if (_0x534f2f()) {
                    (_0x2910ce.preventDefault(), _0x2910ce.stopPropagation());
                    return;
                  }
                  const _0xa71ab1 = _0x34263a.getState().nodes[this.nodeId];
                  if (!_0xa71ab1?.isImagesExpanded) return;
                  (_0x2910ce.stopPropagation(), _0x277fc0(_0x32719f));
                }));
            }));
        this._multiBackplateKeyStr = _0x57ae04;
        for (let _0x3f258e = _0x5ebd68 - 1; _0x3f258e >= 0; _0x3f258e--) {
          const _0x2d99c9 = document.createElement('img'),
            _0x5d370e = this._pickImageDisplayUrl(_0x1354cd[_0x3f258e], _0x400f45[_0x3f258e]);
          (this._setLazyImageDisplaySource(_0x2d99c9, _0x5d370e),
            this._applyImageElementLod(_0x2d99c9, _0x5d370e.lod),
            (_0x2d99c9.decoding = 'async'),
            (_0x2d99c9.draggable = false),
            _0x2d99c9.addEventListener('dragstart', (_0x580fcc) => _0x580fcc.preventDefault()),
            (_0x2d99c9.style.position = 'absolute'),
            (_0x2d99c9.style.top = '0'),
            (_0x2d99c9.style.left = '0'),
            (_0x2d99c9.style.width = '100%'),
            (_0x2d99c9.style.height = '100%'),
            (_0x2d99c9.style.objectFit = 'contain'),
            (_0x2d99c9.style.borderRadius = '18px'),
            (_0x2d99c9.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'),
            (_0x2d99c9.style.transformOrigin = 'top left'),
            _0x2d99c9.classList.add('v2-media-preview'));
          const _0x1e36ef = this._bindResultImageDragOut(_0x2d99c9, {
            imageIndex: _0x3f258e,
            getGhostSourceElement: () => _0x2d99c9,
            getFallbackSrc: () => _0x2d99c9.currentSrc || _0x2d99c9.src || '',
            getFallbackSize: () => ({
              width: this.previewEl?.offsetWidth || this._data?.width || 0x140,
              height: this.previewEl?.offsetHeight || this._data?.height || 0x140,
            }),
          });
          (_0x2d99c9.addEventListener('click', (_0x7d31d5) => {
            if (_0x1e36ef()) {
              (_0x7d31d5.preventDefault(), _0x7d31d5.stopPropagation());
              return;
            }
            const _0x146303 = _0x34263a.getState().nodes[this.nodeId];
            _0x146303.isImagesExpanded && (_0x7d31d5.stopPropagation(), _0x277fc0(this._lastMainIdx || 0));
          }),
            _0x2d99c9.addEventListener('dblclick', async (_0x10f121) => {
              _0x10f121.stopPropagation();
              const _0x31ddd2 = this._lastMainIdx || 0,
                _0x5eec9d = _0x34263a.getState().nodes[this.nodeId],
                _0x57f91b = _0x5eec9d.images || [],
                _0x5578a0 = _0x57f91b[_0x31ddd2] || _0x57f91b[0];
              await _0x25e255(_0x5578a0);
            }));
          if (_0x5d7344[_0x3f258e].error) {
            const _0x10b17a = this._createErrorCard(_0x5d7344[_0x3f258e].error);
            ((_0x10b17a.style.position = 'absolute'),
              (_0x10b17a.style.inset = '0'),
              (this._multiErrorEls[_0x3f258e] = _0x10b17a),
              this._multiStackWrap.appendChild(_0x10b17a));
          } else ((this._multiLayerEls[_0x3f258e] = _0x2d99c9), this._multiStackWrap.appendChild(_0x2d99c9));
        }
        ((this._multiToggleBtn = document.createElement('div')),
          (this._multiToggleBtn.className = 'multi-toggle-btn'),
          Object.assign(this._multiToggleBtn.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 0x3ed,
            padding: '6px 12px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: '15px',
            fontWeight: '500',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }),
          this._multiToggleBtn.addEventListener('pointerdown', (_0x5cf219) => {
            if (_0x5cf219.button !== 0) return;
            (_0x5cf219.preventDefault(), _0x5cf219.stopPropagation());
            const _0x412ddc = _0x34263a.getState().nodes[this.nodeId],
              _0x6060dc = !!_0x412ddc.isImagesExpanded;
            _0x6060dc
              ? _0x277fc0(_0x412ddc.mainImageIndex ?? this._lastMainIdx ?? 0)
              : (this._removeCurrentNodeFromSelection(),
                _0x34263a.updateNodeData(this.nodeId, { isImagesExpanded: true }));
          }),
          this._multiToggleBtn.addEventListener('mouseenter', () => _0x1cdcc5(this._multiToggleBtn, true)),
          this._multiToggleBtn.addEventListener('mouseleave', () => {
            const _0x3c7f26 = _0x34263a.getState().nodes[this.nodeId];
            _0x1cdcc5(this._multiToggleBtn, !!_0x3c7f26.isImagesExpanded);
          }),
          this._multiToggleBtn.addEventListener('click', (_0x536e7f) => {
            (_0x536e7f.preventDefault(), _0x536e7f.stopPropagation());
          }),
          this._multiStackWrap.appendChild(this._multiToggleBtn),
          this._multiImagesContainer.appendChild(this._multiStackWrap));
      }
      (syncMultiResultStackClasses({
        previewEl: this.previewEl,
        stackWrap: this._multiStackWrap,
        isActive: _0x5ebd68 > 1,
        isExpanded: _0xff5e6e,
      }),
        _0x1cdcc5(this._multiToggleBtn, _0xff5e6e));
      for (let _0x4fb580 = 0; _0x4fb580 < _0x5ebd68; _0x4fb580++) {
        const _0x59cd12 = _0x4fb580 === _0x1e6312,
          _0x248055 = this._multiLayerEls[_0x4fb580],
          _0x275e5b = this._multiErrorEls[_0x4fb580];
        if (_0x248055) {
          if (_0x59cd12) this._loadLazyImageDisplaySource(_0x248055);
          else this._scheduleClearLazyImageDisplaySource(_0x248055, AIGEN_IMAGE_HIDDEN_SOURCE_CLEAR_DELAY_MS);
          ((_0x248055.style.display = _0x59cd12 ? 'block' : 'none'),
            (_0x248055.style.pointerEvents = _0x59cd12 ? '' : 'none'),
            _0x59cd12 &&
              ((_0x248055.style.transform = 'rotate(0deg) scale(1)'),
              (_0x248055.style.opacity = '1'),
              (_0x248055.style.zIndex = _0x5ebd68 + 1),
              (_0x248055.style.boxShadow = '0 4px 12px var(--black-40)')));
        }
        _0x275e5b &&
          ((_0x275e5b.style.display = _0x59cd12 ? 'flex' : 'none'),
          (_0x275e5b.style.zIndex = _0x59cd12 ? _0x5ebd68 + 1 : _0x4fb580));
      }
      const _0x296935 = this.previewEl.offsetWidth || _0x4592f6,
        _0x3ba369 = this.previewEl.offsetHeight || _0x5098e3,
        _0x241aa3 = 12,
        _0xa222b1 = 38,
        _0x19fcba = 18,
        _0xbe8df1 = Math.max(1, _0x296935 - _0xa222b1 - 4),
        _0x5d02fe = Math.max(1, _0x3ba369 - _0x19fcba * 2),
        _0x5f1de9 = [
          { x: 10, y: 0, rotate: 4, scale: 0.99, opacity: 0.86 },
          { x: 22, y: 6, rotate: 8, scale: 0.975, opacity: 0.72 },
          { x: 34, y: 12, rotate: 12, scale: 0.955, opacity: 0.58 },
        ],
        _0x270341 = (_0x5469cc, _0x1c75a2) => {
          const _0x43a403 = Number.parseFloat(_0x5469cc);
          return Number.isFinite(_0x43a403) ? _0x43a403 : _0x1c75a2;
        },
        _0x14bbd0 = (_0x1d7a9e) =>
          'translate(' +
          _0x1d7a9e.x +
          'px, ' +
          _0x1d7a9e.y +
          'px) rotate(' +
          _0x1d7a9e.rotate +
          'deg) scale(' +
          _0x1d7a9e.scale +
          ')',
        _0x213597 = 'all 0.46s cubic-bezier(0.175, 0.885, 0.32, 1.27), filter 0.4s ease-out',
        _0x39fcb6 = (_0x318891, _0x48fbdf) => {
          Object.assign(_0x318891.style, {
            top: _0x48fbdf.top + 'px',
            left: _0x48fbdf.left + 'px',
            width: _0x48fbdf.width + 'px',
            height: _0x48fbdf.height + 'px',
            opacity: String(_0x48fbdf.opacity),
            pointerEvents: _0x48fbdf.pointerEvents,
            zIndex: String(_0x48fbdf.zIndex),
            borderRadius: _0x48fbdf.borderRadius,
            transform: _0x48fbdf.transform,
            filter: _0x48fbdf.filter,
            transformOrigin: _0x48fbdf.transformOrigin,
          });
        },
        _0xd460ee = ({ plate: _0xaf11ab, fromFrame: _0x4b1360, toFrame: _0x2bbebf }) => {
          if (!_0xaf11ab) return;
          ((_0xaf11ab.style.transition = 'none'),
            _0x39fcb6(_0xaf11ab, _0x4b1360),
            _0xaf11ab.getBoundingClientRect?.(),
            requestAnimationFrame(() => {
              ((_0xaf11ab.style.transition = _0x213597), _0x39fcb6(_0xaf11ab, _0x2bbebf));
            }));
        },
        _0x51c63c = () => {
          const _0x56f41d = _0x5ebd68 <= 2 ? _0x5ebd68 : 2,
            _0x2ced81 = Math.ceil(_0x5ebd68 / _0x56f41d),
            _0x4bd2a6 = _0x2ced81 - 1,
            _0x28b4f3 = 0,
            _0x31bc93 = [];
          for (let _0x156c13 = 0; _0x156c13 < _0x2ced81; _0x156c13 += 1) {
            for (let _0x469dc0 = 0; _0x469dc0 < _0x56f41d; _0x469dc0 += 1) {
              if (_0x156c13 === _0x4bd2a6 && _0x469dc0 === _0x28b4f3) continue;
              _0x31bc93.push({ r: _0x156c13, c: _0x469dc0 });
            }
          }
          _0x2ced81 === 2 &&
            _0x56f41d === 2 &&
            ((_0x31bc93.length = 0),
            _0x31bc93.push({ r: 1, c: 1 }),
            _0x31bc93.push({ r: 0, c: 0 }),
            _0x31bc93.push({ r: 0, c: 1 }));
          const _0x385b46 = new Map();
          let _0x1753df = 0;
          for (let _0x2e6876 = 0; _0x2e6876 < _0x5ebd68; _0x2e6876 += 1) {
            if (_0x2e6876 === _0x1e6312) continue;
            const _0xabab8f = _0x31bc93[_0x1753df];
            if (!_0xabab8f) break;
            (_0x385b46.set(_0x2e6876, {
              order: _0x1753df,
              top: (_0xabab8f.r - _0x4bd2a6) * (_0x3ba369 + _0x241aa3),
              left: _0xabab8f.c * (_0x296935 + _0x241aa3),
            }),
              (_0x1753df += 1));
          }
          return _0x385b46;
        };
      ((_0x49dec8 = (_0x154806) => {
        const _0x5516d3 = _0x51c63c(),
          _0x6108b7 = this._multiBackdropWrap?.querySelectorAll?.('.' + MULTI_RESULT_BACKPLATE_CLASS);
        (_0x6108b7?.forEach((_0x55c5d5) => {
          const _0x3d2a87 = Number(_0x55c5d5.dataset?.imageIndex),
            _0x33f003 = Math.max(1, Number(_0x55c5d5.dataset?.stackIndex) || 1),
            _0x5d8d23 = _0x5f1de9[_0x33f003 - 1] || _0x5f1de9[0],
            _0x1aed25 = _0x5516d3.get(_0x3d2a87),
            _0x31bb1a = !!_0x154806 && !!_0x1aed25,
            _0x18dca2 = _0x55c5d5.querySelector('.multi-stack-backplate-media'),
            _0x554cbc = _0x55c5d5.classList.contains('is-expanded-card'),
            _0x1aeca0 = {
              top: _0x270341(_0x55c5d5.style.top, _0x19fcba),
              left: _0x270341(_0x55c5d5.style.left, _0xa222b1),
              width: _0x270341(_0x55c5d5.style.width, _0xbe8df1),
              height: _0x270341(_0x55c5d5.style.height, _0x5d02fe),
            },
            _0x5d7fc5 = _0x14bbd0(_0x5d8d23),
            _0x598579 = {
              top: _0x19fcba,
              left: _0xa222b1,
              width: _0xbe8df1,
              height: _0x5d02fe,
              opacity: _0x5d8d23.opacity,
              pointerEvents: 'none',
              zIndex: _0x33f003,
              borderRadius: '0 var(--radius-16) var(--radius-16) 0',
              transform: _0x5d7fc5,
              filter: 'brightness(0.86) saturate(0.92)',
              transformOrigin: 'center right',
            },
            _0x45999d = {
              top: _0x31bb1a ? _0x1aed25.top : _0x1aeca0.top,
              left: _0x31bb1a ? _0x1aed25.left : _0x1aeca0.left,
              width: _0x296935,
              height: _0x3ba369,
              opacity: 1,
              pointerEvents: 'auto',
              zIndex: _0x31bb1a ? 2 + _0x1aed25.order : _0x33f003,
              borderRadius: '18px',
              transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
              filter: 'brightness(1) saturate(1)',
              transformOrigin: 'bottom left',
            },
            _0x123945 = _0x554cbc ? _0x45999d : _0x598579,
            _0x2e21cd = _0x31bb1a ? _0x45999d : _0x598579,
            _0x557847 = !!this._multiStackCardsLaidOut && _0x554cbc !== _0x31bb1a;
          (_0x55c5d5.classList.toggle('is-expanded-card', _0x31bb1a), (_0x55c5d5.style.display = 'block'));
          if (_0x18dca2) {
            if (_0x31bb1a) this._loadLazyImageDisplaySource(_0x18dca2);
            else
              _0x554cbc && this._multiStackCardsLaidOut
                ? this._scheduleClearLazyImageDisplaySource(_0x18dca2, _0x51560b)
                : this._clearLazyImageDisplaySource(_0x18dca2);
            ((_0x18dca2.style.opacity = _0x31bb1a ? '1' : '0'),
              (_0x18dca2.style.transform = _0x31bb1a ? 'scale(1)' : 'scale(1.02)'));
          }
          _0x557847
            ? _0xd460ee({ plate: _0x55c5d5, fromFrame: _0x123945, toFrame: _0x2e21cd })
            : ((_0x55c5d5.style.transition = _0x213597), _0x39fcb6(_0x55c5d5, _0x2e21cd));
        }),
          (this._multiStackCardsLaidOut = true));
      }),
        this._expandPanel &&
          this._expandPanel.parentNode &&
          this._expandPanel.parentNode.removeChild(this._expandPanel),
        (this._expandPanel = null),
        _0xff5e6e &&
          ((this._root.style.position = 'relative'), this._root.style.setProperty('overflow', 'visible')),
        _0x49dec8(_0xff5e6e));
    }
    ['_createErrorCard'](_0x2d1eea) {
      const _0x16fd50 = document.createElement('div');
      return (
        (_0x16fd50.className = 'gen-error-card'),
        Object.assign(_0x16fd50.style, {
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
        }),
        (_0x16fd50.innerHTML =
          '\n            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>\n            </svg>\n            <span style="color:var(--red);font-size:12px;font-weight:600;line-height:1.4;">' +
          t('aigenImage.result.restrictedOrFailed') +
          '</span>\n            <span style="color:var(--white-50);font-size:11px;line-height:1.5;word-break:break-all;">' +
          _0x2d1eea +
          '</span>\n        '),
        _0x16fd50
      );
    }
    ['_createStatusCard'](_0x3e26d5, _0x10675f) {
      const _0x5621f1 = document.createElement('div');
      ((_0x5621f1.className = 'gen-status-card'),
        Object.assign(_0x5621f1.style, {
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
      const _0x54f7c8 = Number(_0x10675f) === 0,
        _0x40ae5b = _0x54f7c8 ? 'var(--green)' : 'var(--white-80)',
        _0x26a0b9 = _0x3e26d5;
      return (
        (_0x5621f1.innerHTML =
          '\n            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
          _0x40ae5b +
          '" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><path d="' +
          (_0x54f7c8 ? 'M8 12l2.5 2.5L16 9' : 'M12 8v5') +
          '" />' +
          (_0x54f7c8 ? '' : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
          '\n            </svg>\n            <span style="color:' +
          _0x40ae5b +
          ';font-size:12px;font-weight:600;line-height:1.4;">' +
          _0x26a0b9 +
          '</span>\n        '),
        _0x5621f1
      );
    }
    ['_syncPromptPlaceholder'](_0xcd40e8 = this._data) {
      if (!this.promptEl) return;
      this.promptEl.dataset.placeholder = getImagePromptPlaceholderForModel(_0xcd40e8?.model);
    }
    ['_syncPromptBoxSizeFromData'](_0x5428a5 = this._data) {
      if (!this.promptEl || this._isPromptBoxResizing) return;
      const _0x418e42 = getPromptBoxHeightBounds(this._promptPanel),
        _0x433ce9 = normalizePromptBoxHeight(_0x5428a5?.promptBoxHeight, _0x418e42);
      applyPromptBoxHeight(this.promptEl, _0x433ce9);
    }
    ['_setupPromptBoxResize']() {
      if (!this._promptPanel || this._promptResizeHandle) return;
      this._promptResizeHandle = true;
      const _0x1d6871 = 20,
        _0x556783 = 10,
        _0x403c30 = () => _0x34263a.getStateRaw().ui?.promptBoxResizeEnabled !== false,
        _0x6cb7ca = (_0x3e1c8d) => !!_0x3e1c8d?.closest('.floating-menu, .img-model-menu'),
        _0xf23558 = (_0x443c6d) => {
          const _0x3c64b3 = this._promptPanel.getBoundingClientRect();
          return _0x443c6d >= _0x3c64b3.bottom - _0x1d6871 && _0x443c6d <= _0x3c64b3.bottom + _0x556783;
        },
        _0x29d170 = (_0x49c5b0) => {
          if (!this._promptPanel) return;
          if (!_0x403c30()) {
            this._promptPanel.classList.remove('is-resize-hover');
            return;
          }
          if (this._isPromptBoxResizing) {
            this._promptPanel.classList.add('is-resize-hover');
            return;
          }
          const _0x13b546 = !_0x6cb7ca(_0x49c5b0?.target) && _0xf23558(_0x49c5b0.clientY);
          this._promptPanel.classList.toggle('is-resize-hover', _0x13b546);
        };
      (this._promptPanel.addEventListener('pointermove', _0x29d170),
        this._promptPanel.addEventListener('pointerleave', () => {
          !this._isPromptBoxResizing && this._promptPanel?.classList.remove('is-resize-hover');
        }));
      const _0x38992f = (_0x15a5a1) => {
        if (!this._promptInputWrap || !this.promptEl) return;
        if (!_0x403c30()) return;
        if (_0x15a5a1.button !== 0) return;
        if (!_0xf23558(_0x15a5a1.clientY)) return;
        if (_0x15a5a1.target?.closest('.prompt-submit') || _0x6cb7ca(_0x15a5a1.target)) return;
        (_0x15a5a1.stopPropagation(), _0x15a5a1.preventDefault());
        const _0x3cec66 = getPromptBoxHeightBounds(this._promptPanel),
          _0xddc7bc = _0x15a5a1.clientY,
          _0x56c29d = this.promptEl.getBoundingClientRect().height;
        ((this._isPromptBoxResizing = true),
          this._promptInputWrap.classList.add('is-resizing'),
          this._promptPanel.classList.add('is-resize-hover'));
        const _0x241072 = (_0xc50036) => {
            _0xc50036.preventDefault();
            const _0x40670f = normalizePromptBoxHeight(
              _0x56c29d + (_0xc50036.clientY - _0xddc7bc),
              _0x3cec66,
            );
            applyPromptBoxHeight(this.promptEl, _0x40670f);
          },
          _0x16b56a = (_0x43c846) => {
            (_0x43c846.preventDefault(),
              window.removeEventListener('pointermove', _0x241072),
              window.removeEventListener('pointerup', _0x16b56a),
              window.removeEventListener('pointercancel', _0x16b56a));
            const _0x2de184 = normalizePromptBoxHeight(
              this.promptEl?.getBoundingClientRect().height,
              _0x3cec66,
            );
            (applyPromptBoxHeight(this.promptEl, _0x2de184),
              this._promptInputWrap.classList.remove('is-resizing'),
              (this._isPromptBoxResizing = false),
              this._promptPanel.classList.remove('is-resize-hover'),
              _0x29d170(_0x43c846),
              _0x34263a.updateNodeData(this.nodeId, { promptBoxHeight: _0x2de184 }));
          };
        (window.addEventListener('pointermove', _0x241072),
          window.addEventListener('pointerup', _0x16b56a),
          window.addEventListener('pointercancel', _0x16b56a));
      };
      this._promptPanel.addEventListener('pointerdown', _0x38992f);
    }
    ['_isRunninghubWorkflowModel'](_0x35dba4, _0x2df092) {
      return isWorkflowModel(_0x35dba4, _0x2df092 || 'runninghubwf');
    }
    ['_normalizeLegacySeedreamModel'](_0x1fe0d9, _0x1c9725 = {}) {
      const _0x45aa41 = _0x1c9725?.syncStore !== false,
        _0x4cde7f = _0x1fe0d9 || {},
        _0x38b404 = String(_0x4cde7f.model || '').trim(),
        _0x284ada = _0x38b404.toLowerCase();
      let _0xeef3dd = '',
        _0x193dec = '';
      if (_0x284ada.startsWith('apimart/seedream-')) return _0x1fe0d9;
      else {
        if (_0x284ada.startsWith('runninghub-model/seedream-'))
          ((_0xeef3dd = 'runninghub-model/rhart-image-v1'), (_0x193dec = 'runninghub'));
        else {
          if (_0x284ada.startsWith('ppio/seedream-')) ((_0xeef3dd = 'nano-banana-2'), (_0x193dec = 'grsai'));
          else return _0x1fe0d9;
        }
      }
      const _0x4da411 = {};
      _0x38b404 !== _0xeef3dd && (_0x4da411.model = _0xeef3dd);
      String(_0x4cde7f.provider || '').trim() !== _0x193dec && (_0x4da411.provider = _0x193dec);
      String(_0x4cde7f.imageSize || '')
        .trim()
        .toUpperCase() === '3K' && (_0x4da411.imageSize = '2K');
      if (Object.keys(_0x4da411).length === 0) return _0x4cde7f;
      const _0x2bc144 = { ..._0x4cde7f, ..._0x4da411 },
        _0x1cd6e1 = _0x34263a.getState().nodes?.[this.nodeId];
      return (_0x45aa41 && _0x1cd6e1 && _0x34263a.updateNodeData(this.nodeId, _0x4da411), _0x2bc144);
    }
    ['_normalizeDreaminaNodeData'](_0x55086f, _0x21f62f = {}) {
      const _0x2fe35a = _0x21f62f?.syncStore !== false,
        _0x612fd = this._normalizeLegacySeedreamModel(_0x55086f, { syncStore: _0x2fe35a }),
        _0x380dc6 = buildDreaminaImageNodeNormalizationPatch(_0x612fd);
      if (!_0x380dc6) return _0x612fd;
      const _0x3d7830 = { ...(_0x612fd || {}), ..._0x380dc6 },
        _0x237ec1 = _0x34263a.getState().nodes?.[this.nodeId];
      return (_0x2fe35a && _0x237ec1 && _0x34263a.updateNodeData(this.nodeId, _0x380dc6), _0x3d7830);
    }
    ['_buildSchemaAspectRatioDisplayPatch'](_0x1d7062, _0x225b7f) {
      const _0x5a058b = _0x1d7062 || (_0x34263a.getState?.() || {}).nodes?.[this.nodeId] || this._data || {},
        _0x11b148 = buildImageSchemaAspectRatioDisplayPatch({
          store: _0x34263a,
          nodeId: this.nodeId,
          nodeData: _0x5a058b,
          ratioValue: _0x225b7f,
          minSide: getAIGenerationNodeSize().width,
          getRefKindByNodeType: _0x47780a,
          resultMediaElement: this.imgEl,
        });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: _0x5a058b,
          patch: _0x11b148,
        }),
        _0x11b148
      );
    }
    ['runAdaptiveRatio']() {
      const _0x59808c = (_0x34263a.getState?.() || {}).nodes?.[this.nodeId] || this._data || {},
        _0x2e08c8 = this._buildSchemaAspectRatioDisplayPatch(_0x59808c, '自适应');
      Object.keys(_0x2e08c8).length > 0 && _0x34263a.updateNodeData(this.nodeId, _0x2e08c8);
    }
    ['_applyModelParamVisibility'](_0x5b4972 = this._data) {
      if (!_0x5b4972) return;
      const _0x3be97e = this._getUiSchemaRenderNodeData(_0x5b4972),
        _0x2b86f0 = buildUiSchemaVisibilitySignature(_0x5b4972.model, _0x3be97e),
        _0x1246ab = (_0x1a86c6, _0x7dd89) => {
          if (!_0x1a86c6) return;
          const _0x7da579 = renderModelUiSchemaControls(_0x5b4972.model, _0x3be97e, {
            placement: _0x7dd89,
            variant:
              _0x7dd89 === 'mode'
                ? 'pillMenu'
                : _0x7dd89 === 'resolution'
                  ? 'resolutionPill'
                  : _0x7dd89 === 'advanced'
                    ? 'advancedRow'
                    : _0x7dd89 === 'instance'
                      ? 'instanceToggle'
                      : _0x7dd89 === 'batch'
                        ? 'pillMenu'
                        : undefined,
          });
          ((_0x1a86c6.innerHTML = _0x7da579), (_0x1a86c6.style.display = _0x7da579 ? '' : 'none'));
        };
      (this._uiSchemaModel !== _0x5b4972.model || this._uiSchemaVisibilitySignature !== _0x2b86f0) &&
        (_0x1246ab(this.uiSchemaModeSlot, 'mode'),
        _0x1246ab(this.uiSchemaResolutionSlot, 'resolution'),
        _0x1246ab(this.rhAdvPanelEl, 'advanced'),
        _0x1246ab(this.uiSchemaInstanceSlot, 'instance'),
        _0x1246ab(this.uiSchemaBatchSlot, 'batch'),
        (this._uiSchemaModel = _0x5b4972.model),
        (this._uiSchemaVisibilitySignature = _0x2b86f0),
        (this._qwenFirstImageModeBtns = []));
      syncModelUiSchemaControls(this.modelWrap?.closest('.prompt-panel-footer'), _0x3be97e);
      const _0x4281d1 = hasModelUiSchema(_0x5b4972.model, { placement: 'advanced' });
      if (this.rhAdvWrap) this.rhAdvWrap.style.display = _0x4281d1 ? '' : 'none';
      if (this.rhAdvPanelEl && !_0x4281d1) this.rhAdvPanelEl.classList.remove('show');
    }
  }
  return _0x10d534.prototype;
}

const AIGEN_IMAGE_MULTI_STACK_MOTION_DURATION_MS = 0x1f4;
const AIGEN_IMAGE_BACKPLATE_MEDIA_HIDE_CLEAR_DELAY_MS = 0xb4;

export function shouldShowImagePromptInput(_0x1d9fde){if(!_0x1d9fde||typeof _0x1d9fde!=='object')return!![];if(_0x1d9fde?.["prompt"]?.['visible']===![])return![];if(_0x1d9fde?.["prompt"]?.['hidden']===!![])return![];return!![];}

function getRhAiAppImageResultMediaKey(_0x19d34e={}){const _0x30e820=Array['isArray'](_0x19d34e?.["images"])?_0x19d34e["images"]:[],_0x56b516=Number(_0x19d34e?.["mainImageIndex"]),_0x416691=Number["isFinite"](_0x56b516)?Math["max"](0x0,Math["trunc"](_0x56b516)):0x0,_0x52be7a=_0x30e820[Math["min"](_0x416691,Math['max'](0x0,_0x30e820["length"]-0x1))]||{};return[_0x52be7a["displayLocalPath"],_0x52be7a["localPath"],_0x52be7a["originalLocalPath"],_0x52be7a["imageUrl"],_0x52be7a['sourceUrl'],_0x52be7a["thumbUrl"],_0x52be7a['thumbId'],_0x19d34e?.["imageUrl"],_0x19d34e?.["sourceUrl"],_0x19d34e?.['thumbUrl']]["map"](_0x253925=>String(_0x253925||'')["trim"]())["find"](Boolean)||'';}

export function resolveUploadedImageReferenceUrl(_0x1b5363={}){const _0x3f01ab=buildImageNodeStorageFields(_0x1b5363);return String(_0x1b5363?.["displayUrl"]||'')["trim"]()||String(_0x1b5363?.["originalUrl"]||'')["trim"]()||String(_0x1b5363?.["url"]||'')["trim"]()||toLocalPathUrl(_0x3f01ab['displayLocalPath']||_0x3f01ab["originalLocalPath"]||_0x3f01ab["localPath"]);}

function flushAIGenImageReferenceUploadNodes(_0x272de6=[]){const _0x1027f9=Array["from"](new Set(_0x272de6["map"](_0x464285=>String(_0x464285||'')["trim"]())["filter"](Boolean)));if(_0x1027f9["length"]===0x0)return![];const _0x187ffc=globalThis["window"]?.["v2Renderer"];if(typeof _0x187ffc?.["flushNodes"]==="function")try{if(_0x187ffc["flushNodes"](_0x1027f9)===!![])return!![];}catch{}if(typeof _0x187ffc?.["flushNode"]!=="function")return![];let _0x342131=![];for(const _0x54b96f of _0x1027f9){try{_0x342131=_0x187ffc['flushNode'](_0x54b96f)===!![]||_0x342131;}catch{}}return _0x342131;}

function collectSubmitButtonInputRecords({latestNode:latestNode={},nodes:nodes={},inEdges:inEdges=[],imageInputGate:imageInputGate={}}={}){const _0x80e50f=getTargetInputPolicy({...latestNode,'type':latestNode?.["type"]||'ai-image'}),_0x47942f=String(imageInputGate?.["kind"]||'')["trim"](),_0x36f223=[];return _0x47942f==='image'&&getImageInputGateUploadedUrl(latestNode,imageInputGate)&&_0x36f223["push"]({'kind':'image','refSlot':''}),(Array["isArray"](inEdges)?inEdges:[])["forEach"](_0x5ef24a=>{const _0xa77721=nodes?.[_0x5ef24a?.['sourceId']];if(!_0xa77721)return;const _0x527879=resolveEffectiveInputKind(_0xa77721,_0x5ef24a);if(!_0x527879||!isInputKindAllowed(_0x80e50f,_0x527879))return;if(_0x47942f&&_0x527879!==_0x47942f)return;if(_0x527879==="text"){const _0x524f84=String(_0xa77721["outputText"]||_0xa77721['text']||_0xa77721["content"]||_0xa77721["prompt"]||_0xa77721['label']||'')['trim']();if(!_0x524f84)return;}_0x36f223["push"]({'kind':_0x527879,'refSlot':_0x5ef24a?.["refSlot"]||''});}),_0x36f223;}
