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
const AIGEN_IMAGE_HIDDEN_SOURCE_CLEAR_DELAY_MS = 1200,
  AIGEN_IMAGE_LOD_HOVER_REFRESH_DELAY_MS = 160;
function getPlainUiSchemaParams(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function getUiSchemaNodeFieldValue(options = {}, item = '', key = '') {
  const enabled = String(item || '').trim();
  if (!enabled) return key;
  const plainUiSchemaParams = getPlainUiSchemaParams(options?.generationParams);
  if (plainUiSchemaParams[enabled] !== undefined) return plainUiSchemaParams[enabled];
  if (options && typeof options === 'object' && !Array.isArray(options) && options[enabled] !== undefined)
    return options[enabled];
  return key;
}
function collectUiSchemaVisibilityConditionFields(list, index) {
  if (Array.isArray(list))
    return (list.forEach((item2) => collectUiSchemaVisibilityConditionFields(item2, index)), index);
  if (!list || typeof list !== 'object') return index;
  Array.isArray(list.any) &&
    list.any.forEach((item3) => collectUiSchemaVisibilityConditionFields(item3, index));
  Array.isArray(list.all) &&
    list.all.forEach((item4) => collectUiSchemaVisibilityConditionFields(item4, index));
  const result = String(list.field || list.param || '').trim();
  if (result) index.add(result);
  return index;
}
function collectUiSchemaVisibilityDependencyFields(list2 = []) {
  const data = new Set();
  return (
    (Array.isArray(list2) ? list2 : []).forEach((item5) => {
      (collectUiSchemaVisibilityConditionFields(item5?.showWhen, data),
        collectUiSchemaVisibilityConditionFields(item5?.hideWhen, data));
      const list3 = [
        ...(Array.isArray(item5?.options) ? item5.options : []),
        ...(Array.isArray(item5?.advancedOptions) ? item5.advancedOptions : []),
      ];
      list3.forEach((item6) => {
        collectUiSchemaVisibilityConditionFields(item6?.hideWhen, data);
      });
    }),
    data
  );
}
function buildUiSchemaVisibilitySignature(target, source = {}) {
  const modelId = String(target || source?.model || '').trim(),
    modelManifest = getModelManifest(modelId),
    list4 = Array.isArray(modelManifest?.uiSchema?.fields) ? modelManifest.uiSchema.fields : [],
    args = collectUiSchemaVisibilityDependencyFields(list4),
    map = new Map(
      list4.map((item7) => [String(item7?.id || '').trim(), item7?.defaultValue]).filter(([next]) => next),
    ),
    dependencies = [...args]
      .sort()
      .map((item8) => [item8, getUiSchemaNodeFieldValue(source, item8, map.get(item8))]);
  return JSON.stringify({ modelId: modelId, dependencies: dependencies });
}
export function hasImageInputForUiSchemaNodeData({
  nodeId: nodeId = '',
  nodeData: nodeData = {},
  state: state = {},
  incomingEdges: incomingEdges = null,
} = {}) {
  if (!nodeData || typeof nodeData !== 'object') return false;
  if (nodeData.hasInputImages === true) return true;
  const list5 = [
    nodeData.inputUrls,
    nodeData.image_urls,
    nodeData.inputImageUrls,
    nodeData.referenceImageUrls,
  ];
  if (
    list5.some((list6) =>
      Array.isArray(list6) ? list6.some((item9) => String(item9 || '').trim()) : String(list6 || '').trim(),
    )
  )
    return true;
  if (
    getPromptAssetInputRefsFromNode(nodeData, { allowedTypes: ['image'] }).some((response) =>
      String(response?.url || '').trim(),
    )
  )
    return true;
  const current = state?.nodes || {},
    targetInputPolicy = getTargetInputPolicy({ ...nodeData, type: nodeData.type || 'ai-image' }),
    list7 = Array.isArray(incomingEdges) ? incomingEdges : Object.values(state?.edges || {});
  return list7.some((enabled2) => {
    if (!enabled2 || String(enabled2.targetId || '') !== String(nodeId || '')) return false;
    const enabled3 = current[enabled2.sourceId];
    if (!enabled3) return false;
    const effectiveInputKind = resolveEffectiveInputKind(enabled3, enabled2);
    return effectiveInputKind === 'image' && isInputKindAllowed(targetInputPolicy, effectiveInputKind);
  });
}
export function createAIGenerateNodeUiModule(entry) {
  const {
    store: store,
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
  } = entry;
  class record {
    ['_getUiSchemaRenderNodeData'](nodeData2 = this._data) {
      return {
        ...(nodeData2 || {}),
        hasInputImages: hasImageInputForUiSchemaNodeData({
          nodeId: this.nodeId,
          nodeData: nodeData2 || {},
          state: store.getState?.() || {},
        }),
      };
    }
    ['_shouldUseLowZoomThumbnail']() {
      return shouldUseLowZoomImageThumbnail({ nodeId: this.nodeId, rootEl: this._root, store: store });
    }
    ['_pickImageDisplayUrl'](mainUrl = '', thumbUrl = '', enabled4 = {}) {
      const lowZoomThumbnail = enabled4 && Object.prototype.hasOwnProperty.call(enabled4, 'lowZoomThumbnail');
      return pickImageLodUrl({
        mainUrl: mainUrl,
        thumbUrl: thumbUrl,
        lowZoomThumbnail: lowZoomThumbnail ? !!enabled4.lowZoomThumbnail : this._shouldUseLowZoomThumbnail(),
      });
    }
    ['_applyImageElementLod'](el, payload = 'full') {
      if (!el) return;
      el.dataset.lodSrc = payload === 'thumb' ? 'thumb' : 'full';
    }
    ['_ensureImageDisplayDecoded'](handle = '') {
      const enabled5 = String(handle || '').trim();
      if (!enabled5 || typeof Image !== 'function') return Promise.resolve(true);
      return preloadCanvasImage(enabled5, { priority: 30, fetchPriority: 'auto' }).then(() => true);
    }
    ['_setImageElementDisplaySource'](el2, response2 = {}, config = {}) {
      if (!el2?.dataset) return;
      const enabled6 = String(response2?.url || '').trim(),
        scope = response2?.lod === 'thumb' ? 'thumb' : 'full',
        input = config?.display !== false;
      if (!enabled6) {
        this._clearLazyImageDisplaySource(el2);
        if (input) el2.style.display = 'none';
        return;
      }
      const enabled7 = String(el2.getAttribute?.('src') || '').trim(),
        enabled8 = !!enabled7 && enabled7 !== enabled6 && el2.style.display !== 'none',
        output = (Number(el2._imageDisplayDecodeToken) || 0) + 1;
      el2._imageDisplayDecodeToken = output;
      const run = () => {
        if (el2._imageDisplayDecodeToken !== output) return;
        (this._cancelLazyImageDisplayClear(el2), this._applyImageElementLod(el2, scope));
        el2.getAttribute?.('src') !== enabled6 && (el2.src = enabled6);
        if (input) el2.style.display = 'block';
      };
      if (enabled7 === enabled6 || !enabled8) {
        run();
        return;
      }
      this._ensureImageDisplayDecoded(enabled6)
        .then(run)
        .catch(() => {});
    }
    ['_setLazyImageDisplaySource'](el3, response3 = {}) {
      if (!el3?.dataset) return;
      const value2 = String(response3?.url || '').trim(),
        value3 = response3?.lod === 'thumb' ? 'thumb' : 'full';
      if (value2) el3.dataset.lazySrc = value2;
      else delete el3.dataset.lazySrc;
      ((el3.dataset.lazyLodSrc = value3), this._applyImageElementLod(el3, value3));
    }
    ['_cancelLazyImageDisplayClear'](enabled9) {
      if (!enabled9?._lazyImageDisplayClearTimer) return;
      (clearTimeout(enabled9._lazyImageDisplayClearTimer), (enabled9._lazyImageDisplayClearTimer = null));
    }
    ['_loadLazyImageDisplaySource'](lod) {
      if (!lod?.dataset) return;
      const url = String(lod.dataset.lazySrc || '').trim();
      if (!url) {
        this._clearLazyImageDisplaySource(lod);
        return;
      }
      (this._cancelLazyImageDisplayClear(lod),
        this._setImageElementDisplaySource(lod, {
          url: url,
          lod: lod.dataset.lazyLodSrc || 'full',
        }));
    }
    ['_clearLazyImageDisplaySource'](enabled10) {
      if (!enabled10) return;
      (this._cancelLazyImageDisplayClear(enabled10),
        (enabled10._imageDisplayDecodeToken = (Number(enabled10._imageDisplayDecodeToken) || 0) + 1),
        typeof enabled10.removeAttribute === 'function' && enabled10.removeAttribute('src'));
    }
    ['_scheduleClearLazyImageDisplaySource'](enabled11, value4 = 0) {
      if (!enabled11) return;
      this._cancelLazyImageDisplayClear(enabled11);
      const value5 = Math.max(0, Number(value4) || 0);
      enabled11._lazyImageDisplayClearTimer = setTimeout(() => {
        ((enabled11._lazyImageDisplayClearTimer = null), this._clearLazyImageDisplaySource(enabled11));
      }, value5);
    }
    ['_getResultImageDragOutNodeData']() {
      const value6 =
        typeof store.getStateRaw === 'function'
          ? store.getStateRaw()
          : typeof store.getState === 'function'
            ? store.getState()
            : {};
      return value6?.nodes?.[this.nodeId] || this._data || {};
    }
    ['_removeCurrentNodeFromSelection']() {
      const value7 =
          typeof store.getStateRaw === 'function'
            ? store.getStateRaw()
            : typeof store.getState === 'function'
              ? store.getState()
              : {},
        list8 = Array.isArray(value7?.selectedNodeIds) ? value7.selectedNodeIds : [];
      if (!list8.includes(this.nodeId)) return;
      store.setSelectedNodes?.(list8.filter((item10) => item10 !== this.nodeId));
    }
    ['_bindResultImageDragOut'](el4, getGhostSourceElement = {}) {
      if (!el4) return () => false;
      let value8 = false;
      const markClickSuppressed = () => {
          ((value8 = true),
            setTimeout(() => {
              value8 = false;
            }, 450));
        },
        image = () => {
          const value9 = this._getResultImageDragOutNodeData(),
            value10 = Array.isArray(value9?.images) ? value9.images : [];
          return value10[getGhostSourceElement.imageIndex] || null;
        },
        getNodeFallbackSize = () => {
          const box =
            typeof getGhostSourceElement.getFallbackSize === 'function'
              ? getGhostSourceElement.getFallbackSize()
              : null;
          return {
            width:
              Number(box?.width) || Number(this.previewEl?.offsetWidth) || Number(this._data?.width) || 320,
            height:
              Number(box?.height) ||
              Number(this.previewEl?.offsetHeight) ||
              Number(this._data?.height) ||
              320,
          };
        };
      return (
        bindResultImageDragOutGesture(el4, {
          image: image,
          isEnabled: () => {
            const enabled12 = this._getResultImageDragOutNodeData();
            return (
              !!enabled12?.isImagesExpanded && Array.isArray(enabled12.images) && enabled12.images.length > 1
            );
          },
          getViewport: () => {
            const value11 =
              typeof store.getStateRaw === 'function'
                ? store.getStateRaw()
                : typeof store.getState === 'function'
                  ? store.getState()
                  : {};
            return value11?.viewport || { x: 0, y: 0, zoom: 1 };
          },
          getGhostSourceElement: getGhostSourceElement.getGhostSourceElement,
          getFallbackSrc: getGhostSourceElement.getFallbackSrc,
          getGhostSize: () => {
            const el5 = getGhostSourceElement.getGhostSourceElement?.() || el4;
            if (el5 && typeof el5.getBoundingClientRect === 'function') {
              const width = el5.getBoundingClientRect();
              if (width.width > 0 && width.height > 0) return { width: width.width, height: width.height };
            }
            return getNodeFallbackSize();
          },
          getNodeFallbackSize: getNodeFallbackSize,
          createId: () => generateId('source-image'),
          addNode: (value12) => store.addNode?.(value12),
          setSelectedNodes: (value13) => store.setSelectedNodes?.(value13),
          commit: commit,
          showToast: (value14, value15) => {
            if (typeof globalThis.window?.showToast === 'function')
              globalThis.window.showToast(value14, value15);
            else typeof showDevToast === 'function' && showDevToast(value14);
          },
          markClickSuppressed: markClickSuppressed,
          onDragStart: () => {
            el4.classList?.add('is-result-drag-source');
          },
          onDragEnd: () => {
            el4.classList?.remove('is-result-drag-source');
          },
        }),
        () => value8
      );
    }
    ['_runVipRetryOnce'](handler) {
      let value16 = false;
      return () => {
        if (value16) return;
        ((value16 = true), (this._vipSelectionRetryInProgress = true));
        try {
          handler();
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      };
    }
    ['_guardVipSelection'](value17, value18 = '', onSuccess = null) {
      const modelId2 = String(value17 || '').trim(),
        provider = String(value18 || '').trim();
      if (!isVipModel(modelId2, provider)) return true;
      const run2 = window.isModelAllowedBySubscription,
        value19 = typeof run2 === 'function' ? run2(modelId2, provider) : true;
      if (value19) return true;
      if (this._vipSelectionRetryInProgress) return false;
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({ modelId: modelId2, provider: provider, onSuccess: onSuccess })
          : window.showToast?.(t('aigenImage.access.vipRequired'), 'warn'),
        false
      );
    }
    ['mount']() {
      ((this._data = this._normalizeLegacySeedreamModel(this._data)),
        (this._data = this._normalizeDreaminaNodeData(this._data, { syncStore: false })));
      const el6 = document.createElement('div');
      el6.className = 'aigen-node-root aigen-image-node-root';
      if (this.isNoResult) el6.classList.add('no-result');
      ((this._root = el6),
        (el6.innerHTML = IMAGE_TOOLBAR_HTML),
        (this.previewEl = document.createElement('div')),
        (this.previewEl.className = 'img-node-preview aigen-node-preview-fill aigen-image-preview'),
        (this.imgEl = document.createElement('img')),
        (this.imgEl.draggable = false),
        (this.imgEl.className = 'v2-media-preview aigen-image-media'));
      const el7 = document.createElement('div');
      ((el7.className = 'img-node-placeholder aigen-media-placeholder'),
        (el7.innerHTML =
          '\n            <svg class="placeholder-icon-svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="transition:all 0.2s;">\n                <rect x="3" y="3" width="18" height="18" rx="2"/>\n                <circle cx="8.5" cy="8.5" r="1.5"/>\n                <polyline points="21 15 16 10 5 21"/>\n            </svg>'),
        (this._maskOverlay = document.createElement('img')),
        (this._maskOverlay.className = 'node-img-mask-overlay aigen-image-mask-overlay'),
        this.previewEl.appendChild(this.imgEl),
        this.previewEl.appendChild(this._maskOverlay),
        this.previewEl.appendChild(el7),
        (this._placeholderEl = el7),
        syncPreviewNodeLoading(this.nodeId, this.previewEl, this._getPreviewGenerateButtonLoadingOptions?.()),
        el6.appendChild(this.previewEl));
      const el8 = document.createElement('div');
      ((el8.className = 'node-resizer'),
        el6.appendChild(el8),
        this._applyMaskPreview(this._data?.maskPreviewUrl || this._data?.maskPreview),
        this.imgEl.addEventListener('load', () => {
          if (this.imgEl?.dataset?.lodSrc === 'thumb') return;
          const imageWidth = Number(this.imgEl?.naturalWidth || 0),
            imageHeight = Number(this.imgEl?.naturalHeight || 0);
          if (!(imageWidth > 0 && imageHeight > 0)) return;
          const enabled13 = store.getState().nodes?.[this.nodeId];
          if (!enabled13) return;
          if (
            Number(enabled13.imageWidth || 0) === imageWidth &&
            Number(enabled13.imageHeight || 0) === imageHeight
          )
            return;
          store.updateNodeData(this.nodeId, { imageWidth: imageWidth, imageHeight: imageHeight });
        }));
      this._rendererMediaDeferred !== true && this._loadAndDisplayImage();
      const value20 = () => {
        if (this._rendererMediaDeferred === true) return;
        const list9 = Array.isArray(this._data?.images) ? this._data.images : [];
        list9.length > 1 && void this._loadAndDisplayImage({ force: true });
      };
      typeof requestAnimationFrame === 'function' ? requestAnimationFrame(value20) : setTimeout(value20, 0);
      const run3 = () => isCanvasLowZoomActive() || this.imgEl?.dataset?.lodSrc === 'thumb',
        handler2 = () => {
          if (!run3()) return;
          void this._loadAndDisplayImage({ force: true });
        },
        handler3 = (count = 0) => {
          this._lowZoomHoverRefreshTimer &&
            (clearTimeout(this._lowZoomHoverRefreshTimer), (this._lowZoomHoverRefreshTimer = null));
          if (count > 0) {
            this._lowZoomHoverRefreshTimer = setTimeout(() => {
              ((this._lowZoomHoverRefreshTimer = null),
                run3() && setNodeMediaLodHoverPromoted(this._root, true),
                handler2());
            }, count);
            return;
          }
          (setNodeMediaLodHoverPromoted(this._root, false), handler2());
        };
      (el6.addEventListener('pointerenter', () => handler3(AIGEN_IMAGE_LOD_HOVER_REFRESH_DELAY_MS)),
        el6.addEventListener('pointerleave', () => handler3(0)),
        this.imgEl.addEventListener('dblclick', async (event) => {
          (event.stopPropagation(), await openNodeImagePreview(this._data));
        }));
      const panel = document.createElement('div');
      ((panel.className = 'text-prompt-panel'),
        panel.addEventListener('pointerdown', (event2) => {
          event2.stopPropagation();
        }),
        (this._promptPanel = panel),
        el6.addEventListener('v2-node:free-angle', (event3) => {
          (event3.stopPropagation(), this._switchToFreeAngle());
        }),
        panel.addEventListener('dblclick', (event4) => {
          !event4.target.closest('.prompt-textarea') && (event4.preventDefault(), event4.stopPropagation());
        }),
        (this.refBarEl = document.createElement('div')),
        (this.refBarEl.className = 'node-ref-bar'),
        (this.refBarEl.innerHTML = createPromptAttachmentButtonHTML({ stroke: 'var(--white-90)' })),
        panel.appendChild(this.refBarEl),
        this.refBarEl.addEventListener('click', (event5) => {
          const enabled14 = event5.target.closest('.prompt-attachment-btn');
          if (!enabled14) return;
          if (event5._pickConnectHandled) return;
          (event5.stopPropagation(), event5.preventDefault());
          const value21 = store.getState().pickConnectMode;
          value21 && value21.active && value21.sourceNodeId === this.nodeId
            ? store.setPickConnectMode({ active: false })
            : store.setPickConnectMode({
                active: true,
                sourceNodeId: this.nodeId,
                handleDirection: 'left',
              });
        }),
        this.refBarEl.addEventListener('pointerdown', (event6) => {
          const value22 = event6.target.closest('.prompt-attachment-btn');
          value22 && event6.stopPropagation();
        }),
        (this._unbindRefThumbHoverPreview = bindRefThumbHoverPreview(this.refBarEl)),
        (this._refUploadInput = document.createElement('input')),
        (this._refUploadInput.type = 'file'),
        (this._refUploadInput.accept = 'image/*'),
        (this._refUploadInput.style.display = 'none'),
        panel.appendChild(this._refUploadInput),
        this._refUploadInput.addEventListener('change', async (event7) => {
          const error = event7.target.files?.[0];
          if (!error) return;
          try {
            const value23 = window.currentProjectId || 'default_v2_project',
              assetId = await uploadFile(error, value23),
              src = assetId?.url || '';
            if (!src) throw new Error(t('aigenImage.upload.missingUrl'));
            const box2 = store.getState().nodes?.[this.nodeId],
              imageNodeInputGate = getImageNodeInputGate(box2?.model),
              value24 = String(imageNodeInputGate.kind || '') === 'image',
              refSlot = isRhPersonReplaceWorkflowModel(box2?.model),
              isRhQwenImageEditModel2 = isRhQwenImageEditModel(box2?.model),
              fixedInputSlotConfigFromManifest = getFixedInputSlotConfigFromManifest(box2 || {}),
              x2 = Number(box2?.x) || 0,
              value25 = Number(box2?.y) || 0,
              value26 = Number(box2?.width) || 360,
              value27 = Number(box2?.height) || 360,
              localPath = assetId.localPath || String(src || '').replace(/^\//, ''),
              args2 = buildImageNodeStorageFields(assetId),
              id = generateId('source-image'),
              width2 = 260,
              height = 260,
              value28 = 24,
              x3 = x2 - value28 - width2,
              value29 = value25 + Math.round((value27 - height) / 2);
            let y2 = value29;
            const enabled15 = String(this._pendingRefSlot || '').trim();
            let refSlot2 = enabled15;
            const list10 = (fixedInputSlotConfigFromManifest?.visibleSlots || []).filter(
                (item11) => fixedInputSlotConfigFromManifest?.slotKindById?.[item11] === 'image',
              ),
              value30 = !!enabled15 && list10.includes(enabled15);
            if (refSlot) {
              const count2 = enabled15 === 'replacedImage' ? 1 : 0,
                value31 = count2 === 0 ? -Math.round(height / 2) - 12 : Math.round(height / 2) + 12;
              y2 = value29 + value31;
            } else {
              if (value30) {
                const value32 = Math.max(0, list10.indexOf(enabled15)),
                  value33 = (list10.length - 1) / 2;
                y2 = value29 + Math.round((value32 - value33) * (height + 24));
              }
            }
            (store.batch(() => {
              const list11 = store.getIncomingEdges(this.nodeId);
              if (value24) {
                for (const value34 of list11) store.removeEdge(value34.id);
              } else {
                if (refSlot) {
                  const list12 = ['replaceTarget', 'replacedImage'];
                  let enabled16 = list12.includes(enabled15) ? enabled15 : '';
                  if (!enabled16) {
                    const map2 = new Set(
                      list11
                        .map((item12) => String(item12.refSlot || ''))
                        .filter((item13) => list12.includes(item13)),
                    );
                    enabled16 = list12.find((item14) => !map2.has(item14)) || '';
                    if (!enabled16) {
                      let enabled17 = null;
                      for (const value35 of list11) {
                        const value36 = String(value35.refSlot || '');
                        if (!list12.includes(value36)) continue;
                        const value37 = Number(value35.createdAt) || 0;
                        if (!enabled17 || value37 < (Number(enabled17.createdAt) || 0)) enabled17 = value35;
                      }
                      if (!enabled17 && list11.length > 0) enabled17 = list11[0];
                      enabled17
                        ? ((enabled16 = String(enabled17.refSlot || '') || list12[0]),
                          store.removeEdge(enabled17.id))
                        : (enabled16 = list12[0]);
                    }
                  } else
                    for (const value38 of list11) {
                      if (String(value38.refSlot || '') === enabled16) store.removeEdge(value38.id);
                    }
                  refSlot2 = enabled16;
                } else {
                  if (value30) {
                    const list13 = getExclusiveSlotsForFixedSlot(
                        fixedInputSlotConfigFromManifest?.exclusiveGroups,
                        refSlot2,
                      ),
                      map3 = new Set(list13.length ? list13 : [refSlot2]);
                    for (const value39 of list11) {
                      if (map3.has(String(value39.refSlot || ''))) store.removeEdge(value39.id);
                    }
                  } else {
                    if (isRhQwenImageEditModel2) {
                      const list14 = list11.filter((item15) => {
                        const value40 = store.getState().nodes?.[item15.sourceId];
                        return getRefKindByNodeType(value40?.type || '') === 'image';
                      });
                      if (list14.length >= 3) {
                        const value41 = list14.reduce((item16, value42) =>
                          (Number(value42.createdAt) || 0) < (Number(item16.createdAt) || 0)
                            ? value42
                            : item16,
                        );
                        if (value41?.id) store.removeEdge(value41.id);
                      }
                    } else {
                      for (const value43 of list11) store.removeEdge(value43.id);
                    }
                  }
                }
              }
              (value24 &&
                store.updateNodeData(this.nodeId, buildImageInputGateClearPatch(imageNodeInputGate)),
                removeCoveredAssetInputRefForConnection({
                  targetId: this.nodeId,
                  sourceKind: 'image',
                  refSlot: refSlot || value30 ? refSlot2 : '',
                }),
                store.addNode(
                  buildSourceMediaNodePayload({
                    id: id,
                    type: 'source-image',
                    x: x3,
                    y: y2,
                    width: width2,
                    height: height,
                    src: src,
                    localPath: localPath,
                    assetId: assetId.assetId || '',
                    derivativeStatus: assetId.derivativeStatus || assetId.status || '',
                    ...args2,
                    fileName: assetId.filename || error.name || '',
                    thumbUrl: null,
                    needsAutoResize: true,
                  }),
                ),
                store.addEdge({
                  id: generateId('edge'),
                  sourceId: id,
                  targetId: this.nodeId,
                  ...((refSlot || value30) && refSlot2
                    ? { refSlot: refSlot2, createdAt: Date.now() }
                    : { createdAt: Date.now() }),
                }),
                store.setSelectedNodes([this.nodeId]));
            }),
              await new Promise((handler4) => {
                const image2 = new Image();
                ((image2.onload = () => {
                  const value44 = image2.naturalWidth || 1000,
                    value45 = image2.naturalHeight || 1000,
                    { width: width3, height: height2 } = getAutoMediaSizeByShortSide(value44, value45);
                  (store.getState().nodes?.[id] &&
                    store.updateNodeData(id, {
                      width: width3,
                      height: height2,
                      needsAutoResize: false,
                      x: x2 - value28 - width3,
                      y:
                        (refSlot || value30) && refSlot2
                          ? y2 + Math.round((height - height2) / 2)
                          : value25 + Math.round((value27 - height2) / 2),
                    }),
                    handler4());
                }),
                  (image2.onerror = () => handler4()),
                  (image2.src = src));
              }));
          } catch (error2) {
            window.showToast?.(error2?.message || t('aigenImage.upload.failedRetry'), 'error');
          } finally {
            ((this._pendingRefSlot = ''), (this._refUploadInput.value = ''));
          }
        }),
        this.refBarEl.addEventListener('click', (event8) => {
          const el9 = event8.target.closest('.ref-thumb-delete');
          if (el9) {
            (event8.stopPropagation(), event8.preventDefault());
            const assetId2 = el9.closest('.ref-thumb-wrap');
            if (assetId2?.dataset?.refOrigin === 'asset') {
              const value46 = {
                  assetId: assetId2.dataset.assetId,
                  assetIndex: assetId2.dataset.assetIndex,
                  type: assetId2.dataset.refType || assetId2.dataset.type || assetId2.dataset.kind,
                  occurrence: assetId2.dataset.assetOccurrence,
                },
                value47 = String(assetId2.dataset.assetRefSource || '').trim(),
                value48 =
                  value47 === 'hidden'
                    ? removePromptAssetInputRefFromNode(this, value46)
                    : removeAssetMentionPillFromPrompt(this, value46) ||
                      removePromptAssetInputRefFromNode(this, value46);
              if (value48) return;
            }
            const value49 = assetId2?.dataset.edgeId;
            if (value49) store.removeEdge(value49);
            return;
          }
          const value50 = event8.target.closest('.ref-upload-delete');
          if (value50) {
            (event8.stopPropagation(),
              event8.preventDefault(),
              store.updateNodeData(
                this.nodeId,
                buildImageInputGateClearPatch(getImageNodeInputGate(this._data?.model)),
              ));
            return;
          }
          const el10 = event8.target.closest('.ref-upload-slot');
          if (el10) {
            (event8.stopPropagation(), event8.preventDefault());
            const value51 = store.getState().nodes?.[this.nodeId],
              value52 = String(getImageNodeInputGate(value51?.model).kind || '') === 'image',
              isRhPersonReplaceWorkflowModel2 = isRhPersonReplaceWorkflowModel(value51?.model),
              fixedInputSlotConfigFromManifest2 = getFixedInputSlotConfigFromManifest(value51 || {}),
              enabled18 = String(el10.dataset.refSlot || el10.dataset.slot || '').trim(),
              value53 =
                !!enabled18 &&
                fixedInputSlotConfigFromManifest2?.visibleSlots?.includes(enabled18) &&
                fixedInputSlotConfigFromManifest2?.slotKindById?.[enabled18] === 'image';
            (value52 || isRhPersonReplaceWorkflowModel2 || value53) &&
              ((this._pendingRefSlot = enabled18), this._refUploadInput?.click());
          }
        }),
        this.refBarEl.addEventListener('pointerdown', (event9) => {
          event9.target.closest('.ref-thumb-wrap, .ref-upload-slot, .ref-upload-delete, .ref-thumb-delete') &&
            event9.stopPropagation();
        }));
      const el11 = document.createElement('div');
      ((el11.className = 'prompt-input-wrapper'),
        el11.classList.add('is-resizable'),
        (this._promptInputWrap = el11),
        (this.promptEl = document.createElement('div')),
        (this.promptEl.className = 'prompt-textarea custom-textarea'),
        (this.promptEl.contentEditable = 'true'),
        (this.promptEl.spellcheck = false),
        this._syncPromptPlaceholder(this._data));
      if (!document.head.querySelector('#v2-gen-node-css')) {
        const el12 = document.createElement('style');
        ((el12.id = 'v2-gen-node-css'),
          (el12.textContent =
            '\n                .prompt-textarea:empty::before {\n                    content: attr(data-placeholder);\n                    color: var(--text-placeholder);\n                    pointer-events: none;\n                }\n                .ref-pill {\n                    display: inline-flex; align-items: center; gap: 3px;\n                    background: transparent; border: none;\n                    border-radius: 4px; padding: 1px 6px; font-size: 14px; /* 原 12px -> 14px */\n                    color: var(--text-secondary); cursor: var(--pointer-cursor); user-select: text; -webkit-user-select: text; font-weight: 500;\n                    vertical-align: middle;\n                }\n                .ref-pill .pill-del {\n                    font-size: 16px; /* 原 14px -> 16px */ color: var(--text-muted);\n                    cursor: var(--link-cursor); margin-left: 2px; line-height: 1;\n                }\n                .ref-pill .pill-del:hover { color: var(--red); }\n                .ref-thumb-wrap.dragging { opacity: 0.3; }\n\n                .v2-slash-item {\n                    display: flex; flex-direction: column; justify-content: center;\n                    padding: 10px 12px; border-radius: 12px; cursor: var(--link-cursor);\n                    background: transparent; border: none;\n                    transition: all 0.2s; position: relative; height: 54px; overflow: hidden; box-sizing: border-box;\n                }\n                .v2-slash-item:hover, .v2-slash-item.active { background: var(--white-05); }\n                .v2-slash-title {\n                    color: var(--text-primary); font-size: 13px; font-weight: 600;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);\n                    transform: translateY(10px);\n                }\n                .v2-slash-desc {\n                    color: var(--text-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; margin-top: 4px;\n                    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s;\n                    transform: translateY(16px);\n                    opacity: 0;\n                }\n                .v2-slash-item:hover > .v2-slash-title, .v2-slash-item.active > .v2-slash-title,\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    transform: translateY(0);\n                }\n                .v2-slash-item:hover > .v2-slash-desc, .v2-slash-item.active > .v2-slash-desc {\n                    opacity: 1;\n                }\n            '),
          document.head.appendChild(el12));
      }
      ((this._flushPromptHtmlCommit = () => flushPromptHtmlCommit(this)),
        this.promptEl.addEventListener('input', (value54) => {
          (schedulePromptHtmlCommit(this),
            this._checkAtTrigger(value54),
            checkSlashTrigger(value54, {
              promptEl: this.promptEl,
              nodeType: this._data.type,
              nodeId: this.nodeId,
              onGenerate: (value55, value56) => this._onGenerate(value55, value56),
            }),
            _syncEdgesOrderFromPills(this),
            this._updateSubmitButtonState());
        }),
        this.promptEl.addEventListener('blur', () => {
          flushPromptHtmlCommit(this);
        }),
        this.promptEl.addEventListener('mouseover', (value57) => {
          _handlePillHover(value57, this);
        }),
        this.promptEl.addEventListener('mouseout', (value58) => {
          _handlePillOut(value58, this);
        }),
        this.promptEl.addEventListener('keydown', (event10) => {
          if (handlePromptSelectAll(this, event10)) return;
          if (_handleMentionMenuKeyboard(event10)) return;
          if (handleSlashKeyboardNavigation(event10)) return;
          if (shouldSubmitPromptByKeyboard(event10)) {
            (event10.preventDefault(), flushPromptHtmlCommit(this), this.btnEl?.click());
            return;
          }
          _handlePillKeyboard(this, event10);
        }),
        this.promptEl.addEventListener('paste', (value59) => {
          handlePromptPaste(this, value59);
        }),
        el11.appendChild(this.promptEl),
        this._syncPromptBoxSizeFromData(this._data),
        this._setupPromptBoxResize());
      this._data.prompt &&
        ((this.promptEl.innerHTML = sanitizePromptHtml(this._data.prompt)), _rehydratePromptPills(this));
      panel.appendChild(el11);
      if (isImageFreeAngleOnlyModel(this._data?.model)) {
        const args3 = { model: DEFAULT_IMAGE_NODE_MODEL, provider: DEFAULT_IMAGE_NODE_PROVIDER };
        ((this._data = { ...this._data, ...args3 }), store.updateNodeData(this.nodeId, args3));
      }
      attachGenerationNodeHelpTip(this, {
        panel: panel,
        kind: 'image',
        getKey: () => this._data?.model,
        getLabel: () => getDisplayModelName(this._data?.model),
      });
      const el13 = document.createElement('div');
      ((el13.className = 'prompt-panel-footer'), (this.footerEl = el13));
      const model = normalizeDreaminaImageModel(
          this._data.model || DEFAULT_IMAGE_NODE_MODEL,
          this._data?.provider,
        ),
        isRhQwenImageEditModel3 = isRhQwenImageEditModel(model),
        value60 =
          this._data?.generationParams &&
          typeof this._data.generationParams === 'object' &&
          !Array.isArray(this._data.generationParams)
            ? this._data.generationParams
            : {},
        value61 = value60.imageSize,
        nanoBananaSelectionFromModel =
          getNanoBananaSelectionFromModel(model, value61 || '2K', this._data?.provider) || null,
        value62 = this._getUiSchemaRenderNodeData(this._data),
        renderModelUiSchemaControls2 = renderModelUiSchemaControls(model, value62, {
          placement: 'mode',
          variant: 'pillMenu',
        }),
        renderModelUiSchemaControls3 = renderModelUiSchemaControls(model, value62, {
          placement: 'resolution',
          variant: 'resolutionPill',
        }),
        renderModelUiSchemaControls4 = renderModelUiSchemaControls(model, value62, {
          placement: 'advanced',
          variant: 'advancedRow',
        }),
        renderModelUiSchemaControls5 = renderModelUiSchemaControls(model, value62, {
          placement: 'instance',
          variant: 'instanceToggle',
        }),
        renderModelUiSchemaControls6 = renderModelUiSchemaControls(model, value62, {
          placement: 'batch',
          variant: 'pillMenu',
        }),
        hasModelUiSchema2 = hasModelUiSchema(model, { placement: 'advanced' });
      ((el13.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap" style="position:relative;">\n              <button type="button" class="img-pill-btn img-model-btn-trigger">\n                ' +
        renderImageModelTriggerIconHTML({ model: model, provider: this._data?.provider }) +
        '\n                <span class="img-model-label">' +
        getDisplayModelName(model) +
        '</span>\n              </button>\n              <span class="img-model-menu-lazy-anchor" data-lazy-model-menu="image"></span>\n            </div>\n            <div class="ui-schema-placement ui-schema-mode-slot" style="' +
        (renderModelUiSchemaControls2 ? '' : 'display:none;') +
        '">\n              ' +
        renderModelUiSchemaControls2 +
        '\n            </div>\n            <div class="ui-schema-placement ui-schema-resolution-slot" style="' +
        (renderModelUiSchemaControls3 ? '' : 'display:none;') +
        '">\n              ' +
        renderModelUiSchemaControls3 +
        '\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <div class="rh-adv-wrap" style="position:relative;' +
        (hasModelUiSchema2 ? '' : 'display:none;') +
        '">\n              <button type="button" class="img-pill-btn rh-adv-btn">\n                <span class="rh-adv-btn-label">' +
        t('aigenImage.controls.advancedSettings') +
        '</span>\n              </button>\n            </div>\n            <div class="ui-schema-placement ui-schema-batch-slot" style="' +
        (renderModelUiSchemaControls6 ? '' : 'display:none;') +
        '">\n              ' +
        renderModelUiSchemaControls6 +
        '\n            </div>\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        t('aigenImage.controls.debugApiParams') +
        '">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot" style="' +
        (renderModelUiSchemaControls5 ? '' : 'display:none;') +
        '">\n              ' +
        renderModelUiSchemaControls5 +
        '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" title="' +
        t('aigenImage.controls.generate') +
        '">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>'),
        el13.insertAdjacentHTML(
          'beforeend',
          '\n            <div class="rh-adv-panel">\n              ' +
            renderModelUiSchemaControls4 +
            '\n            </div>\n      ',
        ));
      const el14 = el13.querySelector('.rh-adv-panel');
      ((this.rhAdvPanelEl = el14),
        (this.modelWrap = el13.querySelector('.img-model-wrap')),
        (this.rhAdvWrap = el13.querySelector('.rh-adv-wrap')),
        (this.uiSchemaModeSlot = el13.querySelector('.ui-schema-mode-slot')),
        (this.uiSchemaResolutionSlot = el13.querySelector('.ui-schema-resolution-slot')),
        (this.uiSchemaInstanceSlot = el13.querySelector('.ui-schema-instance-slot')),
        (this.uiSchemaBatchSlot = el13.querySelector('.ui-schema-batch-slot')),
        (this.btnEl = el13.querySelector('.img-gen-btn')));
      const el15 = el13.querySelector('.debug-wrench-btn');
      ((this._syncImageLocale = () => {
        (el13
          .querySelector('.rh-adv-btn-label')
          ?.replaceChildren(document.createTextNode(t('aigenImage.controls.advancedSettings'))),
          el15?.setAttribute('title', t('aigenImage.controls.debugApiParams')),
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
        (this._uiSchemaCleanup = bindModelUiSchemaControls(el13, {
          nodeId: this.nodeId,
          nodeData: this._data,
          store: store,
          buildPatch: (value63, value64, value65) => {
            if (value64 !== 'aspectRatio') return {};
            return this._buildSchemaAspectRatioDisplayPatch(value63, value65);
          },
          decorateNodeData: (value66) => this._getUiSchemaRenderNodeData(value66),
        })),
        this._footerControllerCleanup?.(),
        (this._footerControllerCleanup = bindNodeFooterController(el13)),
        (this._uiSchemaModel = model),
        this._applyModelParamVisibility(),
        el15?.addEventListener('click', async (event11) => {
          (event11.stopPropagation(), flushPromptHtmlCommit(this));
          const enabled19 = await this._buildPayload();
          if (!enabled19) {
            window.showToast?.(t('aigenImage.debug.missingPayload'), 'warn');
            return;
          }
          try {
            const value67 = await api.buildGenerateImageRequest(enabled19),
              outputText = formatFinalApiDebugRequest(value67),
              value68 = store.getState(),
              x4 = this._data.x + (this._data.width || 380) + 50,
              y3 = this._data.y;
            let enabled20 = Object.values(value68.nodes).find((item17) => item17.type === 'debug');
            (!enabled20
              ? store.addNode({
                  id: 'debug-' + Date.now(),
                  type: 'debug',
                  x: x4,
                  y: y3,
                  width: 380,
                  height: 300,
                  name: t('aigenImage.debug.nodeName'),
                  outputText: outputText,
                })
              : store.updateNodeData(enabled20.id, { outputText: outputText, x: x4, y: y3 }),
              window.showToast?.(t('aigenImage.debug.paramsShown'), 'warn'));
          } catch (error3) {
            window.showToast?.(
              t('aigenImage.debug.buildRequestFailed', { error: error3?.message || error3 }),
              'error',
            );
          }
        }));
      const modelTrigger = el13.querySelector('.img-model-btn-trigger');
      let el16 = null;
      const modelLabel = el13.querySelector('.img-model-label'),
        el17 = el13.querySelector('.rh-res-popup'),
        el18 = el13.querySelector('.rh-adv-btn'),
        handler5 = () => {
          (el13.querySelectorAll('.ui-schema-floating-menu').forEach((el19) => el19.classList.remove('show')),
            el13.querySelectorAll('.ui-schema-popup').forEach((el20) => {
              el20.style.display = 'none';
            }));
        },
        handler6 = () => (el16 && el16.isConnected ? el16 : null),
        handler7 = ({ keepModelMenu: keepModelMenu = false } = {}) => {
          if (!keepModelMenu) handler6()?.classList.remove('show');
          if (el17) el17.style.display = 'none';
          if (el14) el14.classList.remove('show');
        },
        handler8 = (args4) =>
          args4 && typeof args4 === 'object' && !Array.isArray(args4) ? { ...args4 } : {},
        buildModelPatch = (value69, value70, provider2, value71 = {}) => {
          const value72 = String(value69?.model || '').trim(),
            model2 = String(value70 || '').trim(),
            generationParamsByModel = handler8(value69?.generationParamsByModel);
          value72 && (generationParamsByModel[value72] = handler8(value69?.generationParams));
          const value73 = Object.prototype.hasOwnProperty.call(value71, 'generationParams'),
            value74 = value73 ? handler8(value71.generationParams) : {},
            value75 = model2 ? generationParamsByModel[model2] : undefined,
            args5 = buildModelUiSchemaDefaultParams(model2),
            modelManifest2 = getModelManifest(model2),
            list15 = new Set(
              (modelManifest2?.uiSchema?.fields || []).map((item18) => String(item18?.id || '').trim()),
            ),
            args6 = {};
          ['imageSize', 'aspectRatio', 'mode', 'batchSize'].forEach((item19) => {
            list15.has(item19) &&
              Object.prototype.hasOwnProperty.call(value71, item19) &&
              (args6[item19] = value71[item19]);
          });
          const value76 = {
              ...args5,
              ...handler8(value75),
              ...(value73 ? value74 : {}),
              ...args6,
            },
            generationParams = sanitizeModelUiSchemaParams(
              model2,
              Object.fromEntries(Object.entries(value76).filter(([value77]) => list15.has(value77))),
            ),
            { generationParams: generationParams2, ...args7 } = value71,
            args8 = { ...args7 };
          return (
            list15.forEach((item20) => {
              delete args8[item20];
            }),
            {
              ...args8,
              model: model2,
              provider: provider2,
              generationParams: generationParams,
              generationParamsByModel: generationParamsByModel,
            }
          );
        };
      el13.addEventListener('ui-schema-menu-before-open', () => {
        handler7();
      });
      const run4 = (modelMenu) => {
          (bindImageModelMenuSubmenu({
            modelMenu: modelMenu,
            modelTrigger: modelTrigger,
            modelLabel: modelLabel,
            nodeId: this.nodeId,
            store: store,
            fallbackNodeData: this._data,
            toggleSelector: '[data-grsai-toggle]',
            submenuSelector: '.grsai-submenu',
            defaultProvider: 'grsai',
            buildModelPatch: buildModelPatch,
            resolveSelection: resolveGrsaiImageMenuSelection,
            afterSelect: ({ item: item21 }) => setImageModelTriggerIcon(modelTrigger, 'grsai', item21),
          }),
            bindImageModelMenuSubmenu({
              modelMenu: modelMenu,
              modelTrigger: modelTrigger,
              modelLabel: modelLabel,
              nodeId: this.nodeId,
              store: store,
              fallbackNodeData: this._data,
              toggleSelector: '[data-ppio-toggle]',
              submenuSelector: '.ppio-submenu',
              defaultProvider: 'ppio',
              buildModelPatch: buildModelPatch,
              afterSelect: ({ item: item22 }) => setImageModelTriggerIcon(modelTrigger, 'ppio', item22),
            }),
            bindDreaminaImageMenu({
              modelMenu: modelMenu,
              modelTrigger: modelTrigger,
              modelLabel: modelLabel,
              nodeId: this.nodeId,
              store: store,
              buildModelPatch: buildModelPatch,
            }),
            bindImageModelMenuSubmenu({
              modelMenu: modelMenu,
              modelTrigger: modelTrigger,
              modelLabel: modelLabel,
              nodeId: this.nodeId,
              store: store,
              fallbackNodeData: this._data,
              toggleSelector: '[data-apimart-toggle]',
              submenuSelector: '.apimart-submenu',
              defaultProvider: 'apimart',
              buildModelPatch: buildModelPatch,
              resolveSelection: resolveApimartImageMenuSelection,
              afterSelect: ({ item: item23 }) => setImageModelTriggerIcon(modelTrigger, 'apimart', item23),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: modelMenu,
              modelTrigger: modelTrigger,
              modelLabel: modelLabel,
              nodeId: this.nodeId,
              store: store,
              fallbackNodeData: this._data,
              toggleSelector: '[data-agnes-toggle]',
              submenuSelector: '.agnes-submenu',
              defaultProvider: 'agnes',
              buildModelPatch: buildModelPatch,
              afterSelect: ({ item: item24 }) => setImageModelTriggerIcon(modelTrigger, 'agnes', item24),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: modelMenu,
              modelTrigger: modelTrigger,
              modelLabel: modelLabel,
              nodeId: this.nodeId,
              store: store,
              fallbackNodeData: this._data,
              toggleSelector: '[data-volcengine-toggle]',
              submenuSelector: '.volcengine-submenu',
              defaultProvider: 'volcengine',
              buildModelPatch: buildModelPatch,
              resolveSelection: resolveVolcengineImageMenuSelection,
              afterSelect: ({ item: item25 }) => setImageModelTriggerIcon(modelTrigger, 'volcengine', item25),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: modelMenu,
              modelTrigger: modelTrigger,
              modelLabel: modelLabel,
              nodeId: this.nodeId,
              store: store,
              fallbackNodeData: this._data,
              toggleSelector: '[data-runninghubwf-toggle]',
              submenuSelector: '.runninghubwf-submenu',
              defaultProvider: 'runninghubwf',
              buildModelPatch: buildModelPatch,
              resolveSelection: resolveRunningHubWorkflowImageMenuSelection,
              onDisabled: () =>
                window.showToast?.(
                  t('aigenImage.modelMenu.unavailable', {
                    model: t('aigenImage.modelMenu.personReplaceV3.title'),
                  }),
                  'warn',
                ),
              beforeSelect: ({ item: item26, model: model3, provider: provider3 }) => {
                const value78 = this._runVipRetryOnce(() => item26.click());
                return this._guardVipSelection(model3, provider3, value78);
              },
              afterSelect: ({ item: item27 }) =>
                setImageModelTriggerIcon(modelTrigger, 'runninghubwf', item27),
            }),
            bindImageModelMenuSubmenu({
              modelMenu: modelMenu,
              modelTrigger: modelTrigger,
              modelLabel: modelLabel,
              nodeId: this.nodeId,
              store: store,
              fallbackNodeData: this._data,
              toggleSelector: '[data-runninghub-toggle]',
              submenuSelector: '.runninghub-submenu',
              defaultProvider: 'runninghubwf',
              buildModelPatch: buildModelPatch,
              resolveSelection: resolveRunningHubModelImageMenuSelection,
              afterSelect: ({ item: item28, provider: provider4 }) =>
                setImageModelTriggerIcon(modelTrigger, provider4, item28),
            }));
        },
        handler9 = () => {
          const value79 = handler6();
          if (value79) return value79;
          if (!this.modelWrap) return null;
          const value80 = (store.getState?.() || {}).nodes?.[this.nodeId] || this._data || {},
            activeModel = normalizeDreaminaImageModel(
              value80.model || DEFAULT_IMAGE_NODE_MODEL,
              value80.provider,
            ),
            value81 =
              value80?.generationParams &&
              typeof value80.generationParams === 'object' &&
              !Array.isArray(value80.generationParams)
                ? value80.generationParams
                : {},
            nanoSelection =
              getNanoBananaSelectionFromModel(activeModel, value81.imageSize || '2K', value80?.provider) ||
              null,
            el21 = document.createElement('template');
          el21.innerHTML = buildImageModelMenuHTML({
            activeModel: activeModel,
            nanoSelection: nanoSelection,
          }).trim();
          const enabled21 = el21.content.firstElementChild;
          if (!enabled21) return null;
          const value82 = this.modelWrap.querySelector("[data-lazy-model-menu='image']");
          return (
            value82 ? value82.replaceWith(enabled21) : this.modelWrap.appendChild(enabled21),
            (el16 = enabled21),
            run4(enabled21),
            enabled21
          );
        };
      modelTrigger?.addEventListener('click', (event12) => {
        event12.stopPropagation();
        const el22 = handler9();
        if (!el22) return;
        const value83 = !el22.classList.contains('show');
        (closeNodeFooterMenus(el13, el22),
          handler7({ keepModelMenu: true }),
          handler5(),
          el22.classList.toggle('show', value83),
          value83 && typeof activateMenuKeyboard === 'function' && activateMenuKeyboard(el22));
      });
      el18 &&
        el14 &&
        (el18.addEventListener('click', (event13) => {
          (event13.stopPropagation(), el14.classList.toggle('show'), handler6()?.classList.remove('show'));
          if (el17) el17.style.display = 'none';
          handler5();
        }),
        el14.addEventListener('click', (event14) => event14.stopPropagation()));
      (this.btnEl.addEventListener('click', () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      }),
        document.addEventListener('click', () => {
          handler6()?.classList.remove('show');
          if (el17) el17.style.display = 'none';
          handler5();
        }),
        el13.appendChild(document.createTextNode('')),
        panel.appendChild(el13),
        el6.appendChild(panel));
      this._rendererMediaDeferred === true
        ? (this._renderRefBarPendingWhenVisible = true)
        : this._renderRefBar();
      (this._assetMentionRegistryUnsubscribe?.(),
        (this._assetMentionRegistryUnsubscribe = subscribeAssetMentionRegistry(() => {
          if (this._assetMentionRegistryRefreshPending) return;
          ((this._assetMentionRegistryRefreshPending = true),
            queueMicrotask(() => {
              this._assetMentionRegistryRefreshPending = false;
              if (!store.getState().nodes?.[this.nodeId]) return;
              _rehydratePromptPills(this);
              if (this._rendererMediaDeferred === true) {
                this._renderRefBarPendingWhenVisible = true;
                return;
              }
              (this._renderRefBar(), this._updateSubmitButtonState());
            }));
        })));
      const imageNodeRootClass = getImageNodeRootClass(this._data?.model);
      if (imageNodeRootClass) el6.classList.add(imageNodeRootClass);
      isRhPersonReplaceWorkflowModel(this._data?.model) && el6.classList.add('rh-person-replace-v3-node');
      const value84 = el6.querySelector('.node-floating-toolbar');
      (bindImageToolbarEvents(value84, this.nodeId),
        (this._qualityBtns = el6 ? Array.from(el6.querySelectorAll('.img-rp-quality-item')) : []));
      const el23 = this.refBarEl?.querySelector('.prompt-attachment-btn');
      return (
        (this._attachBtnIcon = el23 ? el23.querySelector('.btn-icon') : null),
        el8 &&
          el8.addEventListener('pointerdown', (event15) => {
            const value85 = store.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
              value86 = document
                .getElementById('v2-wrap')
                ?.classList.contains('v2-media-node-resize-enabled');
            if (!(value85 && value86)) return;
            if (event15.button !== 0) return;
            (event15.preventDefault(),
              event15.stopPropagation(),
              startNodeResizePreview({
                event: event15,
                nodeId: this.nodeId,
                getNode: () => store.getStateRaw().nodes?.[this.nodeId] || this._data,
                getViewport: () => store.getStateRaw().viewport,
                resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => {
                  const value87 = startWidth / startHeight,
                    value88 = Math.max(dx / startWidth, dy / startHeight),
                    value89 = Math.max(AI_IMAGE_MIN_SIZE / startWidth, AI_IMAGE_MIN_SIZE / startHeight),
                    value90 = Math.max(value89, 1 + value88),
                    width4 = Math.max(AI_IMAGE_MIN_SIZE, Math.round(startWidth * value90)),
                    height3 = Math.max(AI_IMAGE_MIN_SIZE, Math.round(width4 / value87));
                  return { width: width4, height: height3 };
                },
                buildFinalPatch: ({ startNode: startNode }) =>
                  startNode?.needsAutoResize ? { needsAutoResize: false } : {},
                applyPatch: (value91) => store.updateNodeData(this.nodeId, value91),
                commit: commit,
              }));
          }),
        this._updateSubmitButtonState(),
        typeof this._maybeResumeDreaminaTaskImpl === 'function' &&
          queueMicrotask(() => {
            store.getState().nodes?.[this.nodeId] && this._maybeResumeDreaminaTaskImpl();
          }),
        typeof this._maybeResumeAsyncTaskImpl === 'function' &&
          queueMicrotask(() => {
            store.getState().nodes?.[this.nodeId] && this._maybeResumeAsyncTaskImpl();
          }),
        typeof this._maybeResumeRunningHubTaskImpl === 'function' &&
          queueMicrotask(() => {
            store.getState().nodes?.[this.nodeId] && this._maybeResumeRunningHubTaskImpl();
          }),
        el6
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
      if (ImageFreeAngleController.active && ImageFreeAngleController.nodeId === this.nodeId) {
        ImageFreeAngleController._exit();
        return;
      }
      if (window.v2FocusOnNodeAtZoomPercent) window.v2FocusOnNodeAtZoomPercent(this.nodeId, 60);
      const value92 = this._root.querySelector('.act-multiangle');
      await ImageFreeAngleController.render(
        this.nodeId,
        this._promptPanel,
        () => this._switchToPrompt(),
        () => this._onGenerate(),
        value92,
      );
    }
    ['_switchToPrompt']() {
      if (!this._promptPanel) return;
      this._promptPanel.innerHTML = '';
      const value93 = this.modelWrap?.closest('.prompt-panel-footer'),
        value94 = this.promptEl?.closest('.prompt-input-wrapper');
      if (this.refBarEl) this._promptPanel.appendChild(this.refBarEl);
      if (value94) this._promptPanel.appendChild(value94);
      if (value93) this._promptPanel.appendChild(value93);
      this._renderRefBar();
    }
    ['_updateSubmitButtonState']() {
      if (!this.btnEl) return;
      const state2 = typeof store.getState === 'function' ? store.getState() : {},
        nodes2 = state2?.nodes || {},
        nodeData3 = nodes2?.[this.nodeId] || this._data || {},
        inEdges2 = typeof store.getIncomingEdges === 'function' ? store.getIncomingEdges(this.nodeId) : [],
        promptTextWithTextRefs = resolvePromptTextWithTextRefs({
          promptEl: this.promptEl,
          inEdges: inEdges2,
          nodes: nodes2,
        }),
        count3 = Array.from(promptTextWithTextRefs).length,
        hasImageInputForUiSchemaNodeData2 = hasImageInputForUiSchemaNodeData({
          nodeId: this.nodeId,
          nodeData: nodeData3,
          state: state2,
          incomingEdges: inEdges2,
        }),
        value95 = String(nodeData3?.model || '').trim(),
        value96 =
          value95 === 'runninghub-model/seedream-v4' ||
          value95 === 'runninghub-model/seedream-v4.5' ||
          value95 === 'runninghub-model/seedream-v5-lite',
        cancellable = this._isRunninghubWorkflowModel(nodeData3?.model, nodeData3?.provider),
        imageNodeInputGate2 = getImageNodeInputGate(nodeData3?.model),
        value97 = String(imageNodeInputGate2.kind || '') === 'image',
        busy = shouldUseImageWorkflowBusyButton(nodeData3?.model),
        el24 = resolveGenerationButtonMode(nodeData3, {
          cancellable: cancellable,
          cancelInFlight: this._rhCancelInFlight === true,
        });
      if (el24.busy) {
        cancellable
          ? setGenerateButtonCancellableUi(this.btnEl, {
              title: t('aigenImage.controls.cancelTaskTooltip'),
              tooltip: t('aigenImage.controls.cancelTaskTooltip'),
              ariaLabel: t('aigenImage.controls.cancelGenerate'),
              busy: busy,
            })
          : setGenerateButtonLoadingUi(this.btnEl, {
              title: t('aigenImage.controls.generate'),
              disabled: true,
              ariaLabel: t('aigenImage.controls.generate'),
            });
        ((this.btnEl.disabled = el24.disabled), (this.btnEl.style.cursor = el24.cursor));
        return;
      }
      resetGenerateButtonIdleUi(this.btnEl, t('aigenImage.controls.generate'));
      if (cancellable) {
        if (value97) {
          const value98 = !!getImageInputGateUploadedUrl(nodeData3, imageNodeInputGate2),
            value99 = inEdges2.some(
              (item29) => getRefKindByNodeType(nodes2[item29.sourceId]?.type || '') === 'image',
            ),
            enabled22 = value98 || value99;
          ((this.btnEl.disabled = !enabled22),
            (this.btnEl.style.cursor = enabled22 ? '' : 'var(--unavailable-cursor)'));
          return;
        }
        ((this.btnEl.disabled = false), (this.btnEl.style.cursor = ''));
        return;
      }
      if (value96) {
        const enabled23 = count3 >= 5;
        ((this.btnEl.disabled = !enabled23),
          (this.btnEl.style.cursor = enabled23 ? '' : 'var(--unavailable-cursor)'));
        return;
      }
      !promptTextWithTextRefs && !hasImageInputForUiSchemaNodeData2
        ? ((this.btnEl.disabled = true), (this.btnEl.style.cursor = 'var(--unavailable-cursor)'))
        : ((this.btnEl.disabled = false), (this.btnEl.style.cursor = ''));
    }
    async ['_loadAndDisplayImage'](options2 = {}) {
      if (this._rendererMediaDeferred === true && options2?.force !== true) return;
      const enabled24 = options2?.force === true,
        imageCount = this._data.images || [];
      imageCount.length === 0 &&
        (this._data.imageUrl || this._data.localPath || this._data.thumbUrl || this._data.thumbId) &&
        imageCount.push({
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
      const value100 =
          String(this._data.rhStatusMessage || '').trim() ||
          (String(this._data.jobStatus || '').toLowerCase() === 'error' ? getTaskMessage(this._data) : ''),
        value101 = this._data.rhStatusCode;
      if (value100 && imageCount.length === 0) {
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
          this._statusOverlayEl.appendChild(this._createStatusCard(value100, value101)));
        return;
      }
      this._statusOverlayEl && (this._statusOverlayEl.remove(), (this._statusOverlayEl = null));
      const isExpanded = this._data.isImagesExpanded || false;
      let mainIndex = this._data.mainImageIndex || 0;
      if (mainIndex >= imageCount.length) mainIndex = 0;
      const value102 = imageCount
          .map(
            (item30) =>
              item30.thumbId +
              '|' +
              item30.localPath +
              '|' +
              item30.originalLocalPath +
              '|' +
              item30.displayLocalPath +
              '|' +
              item30.thumbLocalPath +
              '|' +
              item30.thumbUrl +
              '|' +
              item30.imageUrl,
          )
          .join(','),
        enabled25 = value102 !== this._lastImagesKeyStr,
        enabled26 = mainIndex !== this._lastMainIdx,
        enabled27 = isExpanded !== this._lastIsExpanded,
        value103 = this._shouldUseLowZoomThumbnail() ? 'thumb' : 'full',
        enabled28 = value103 !== this._lastImageLodMode,
        shouldRefreshMultiResultStackDom2 = shouldRefreshMultiResultStackDom({
          imageCount: imageCount.length,
          previewEl: this.previewEl,
          containerEl: this._multiImagesContainer,
          stackWrap: this._multiStackWrap,
          backdropWrap: this._multiBackdropWrap,
        });
      if (
        !enabled24 &&
        !enabled25 &&
        !enabled26 &&
        !enabled27 &&
        !enabled28 &&
        !shouldRefreshMultiResultStackDom2
      )
        return;
      ((this._lastImagesKeyStr = value102),
        (this._lastMainIdx = mainIndex),
        (this._lastIsExpanded = isExpanded),
        (this._lastImageLodMode = value103));
      (this._currentSourceId !== this._data.sourceId ||
        this._currentLocalPath !== pickCanvasImageLocalPath(this._data)) &&
        (this._cachedSourceUrl &&
          this._cachedSourceUrl.startsWith('blob:') &&
          URL.revokeObjectURL(this._cachedSourceUrl),
        (this._cachedSourceUrl = null),
        (this._currentSourceId = this._data.sourceId),
        (this._currentLocalPath = pickCanvasImageLocalPath(this._data)));
      if (imageCount.length === 0) {
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
      if (value102 !== this._resolvedUrlsKey || !this._resolvedMainUrls || !this._resolvedAuxUrls) {
        const map4 = new Set(imageCount.map((item31) => item31.thumbId).filter(Boolean));
        for (const [value104, value105] of this._thumbObjectUrls.entries()) {
          !map4.has(value104) &&
            (value105 && String(value105).startsWith('blob:') && URL.revokeObjectURL(value105),
            this._thumbObjectUrls.delete(value104));
        }
        const list16 = [],
          list17 = [];
        for (const value106 of imageCount) {
          const toLocalPathUrl2 = toLocalPathUrl(pickCanvasImageLocalPath(value106)),
            toLocalPathUrl3 = toLocalPathUrl(pickCanvasThumbLocalPath(value106));
          let value107 = '';
          if (value106.thumbId) {
            if (this._thumbObjectUrls.has(value106.thumbId))
              value107 = this._thumbObjectUrls.get(value106.thumbId);
            else {
              const value108 = await getImage(value106.thumbId);
              if (value108) {
                const value109 = URL.createObjectURL(value108);
                (this._thumbObjectUrls.set(value106.thumbId, value109), (value107 = value109));
              }
            }
          }
          const value110 =
              toLocalPathUrl2 ||
              value107 ||
              String(value106.imageUrl || value106.sourceUrl || value106.thumbUrl || '').trim(),
            value111 =
              toLocalPathUrl3 ||
              value107 ||
              value110 ||
              String(value106.thumbUrl || value106.imageUrl || value106.sourceUrl || '').trim();
          (list16.push(value110), list17.push(value111));
        }
        ((this._resolvedUrlsKey = value102),
          (this._resolvedMainUrls = list16),
          (this._resolvedAuxUrls = list17));
      }
      const value112 = this._resolvedMainUrls || [],
        value113 = this._resolvedAuxUrls || value112;
      if (imageCount.length === 1) {
        this._multiImagesContainer &&
          (this._multiImagesContainer.remove(), (this._multiImagesContainer = null));
        (clearMultiResultStackClasses({ previewEl: this.previewEl, stackWrap: this._multiStackWrap }),
          (this._multiStackWrap = null),
          (this._multiBackdropWrap = null),
          (this._multiBackplateKeyStr = ''));
        const value114 = imageCount[0];
        if (value114.error)
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
            this._multiImagesContainer.appendChild(this._createErrorCard(value114.error)),
            this.previewEl.appendChild(this._multiImagesContainer));
        else {
          const value115 = this._pickImageDisplayUrl(value112[0], value113[0]);
          this._setImageElementDisplaySource(this.imgEl, value115);
        }
        return;
      }
      ((this.imgEl.style.display = 'none'), this._root?.style.setProperty('overflow', 'visible'));
      const value116 = this._pickImageDisplayUrl(value112[mainIndex], value113[mainIndex]);
      this._setImageElementDisplaySource(this.imgEl, value116, { display: false });
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
      const imageCount2 = imageCount.length,
        value117 = 500;
      let run5 = () => {};
      const items = buildMultiResultBackplateItems({ imageCount: imageCount2, mainIndex: mainIndex }),
        multiResultBackplateKey = getMultiResultBackplateKey(items),
        value118 = this._data.width || this._root.clientWidth || 320,
        value119 = this._data.height || this._root.clientHeight || Math.round((value118 * 9) / 16),
        handler10 = (value120) => {
          for (let value121 = 0; value121 < imageCount2; value121 += 1) {
            const value122 = value121 === value120,
              el25 = this._multiLayerEls[value121],
              el26 = this._multiErrorEls[value121];
            if (el25) {
              if (value122) this._loadLazyImageDisplaySource(el25);
              else this._scheduleClearLazyImageDisplaySource(el25, AIGEN_IMAGE_HIDDEN_SOURCE_CLEAR_DELAY_MS);
              ((el25.style.display = value122 ? 'block' : 'none'),
                (el25.style.pointerEvents = value122 ? '' : 'none'),
                value122 &&
                  ((el25.style.transform = 'rotate(0deg) scale(1)'),
                  (el25.style.opacity = '1'),
                  (el25.style.zIndex = imageCount2 + 1),
                  (el25.style.boxShadow = '0 4px 12px var(--black-40)')));
            }
            el26 &&
              ((el26.style.display = value122 ? 'flex' : 'none'),
              (el26.style.zIndex = value122 ? imageCount2 + 1 : value121));
          }
          this._lastMainIdx = value120;
        },
        handler11 = (value123) => {
          const value124 = store.getState().nodes[this.nodeId],
            list18 = value124.images || [];
          if (list18.length === 0) return;
          const mainImageIndex = list18[value123] ? value123 : 0,
            imageUrl = list18[mainImageIndex] || list18[0];
          (handler10(mainImageIndex),
            syncMultiResultStackClasses({
              previewEl: this.previewEl,
              stackWrap: this._multiStackWrap,
              isActive: imageCount2 > 1,
              isExpanded: false,
            }),
            handler12(this._multiToggleBtn, false),
            run5(false),
            setTimeout(() => {
              store.updateNodeData(this.nodeId, {
                mainImageIndex: mainImageIndex,
                isImagesExpanded: false,
                imageUrl: imageUrl.imageUrl,
                sourceUrl: imageUrl.sourceUrl,
                thumbUrl: imageUrl.thumbUrl,
                sourceId: imageUrl.sourceId,
                thumbId: imageUrl.thumbId,
                localPath: imageUrl.localPath,
              });
            }, value117));
        },
        handler12 = (el27, value125) => {
          if (!el27) return;
          const value126 = {
              bg: 'var(--black-45)',
              color: 'var(--white-90)',
              border: '1px solid var(--white-15)',
            },
            value127 = { bg: 'var(--black-70)', color: 'var(--white-80)', border: '1px solid transparent' },
            value128 = value125 ? value127 : value126;
          ((el27.innerHTML = value125
            ? '<span>' +
              t('aigenImage.result.imageCount', { count: imageCount2 }) +
              '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>'
            : '<span>' +
              t('aigenImage.result.imageCount', { count: imageCount2 }) +
              '</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>'),
            (el27.style.background = value128.bg),
            (el27.style.color = value128.color),
            (el27.style.border = value128.border));
        },
        multiResultBackplateCount = getMultiResultBackplateCount(imageCount2),
        enabled29 = this._multiStackWrap?.parentNode === this._multiImagesContainer,
        value129 = Number(this._multiBackdropWrap?.children?.length) || 0,
        value130 =
          enabled25 ||
          enabled26 ||
          enabled28 ||
          !enabled29 ||
          value129 !== multiResultBackplateCount ||
          this._multiBackplateKeyStr !== multiResultBackplateKey;
      if (value130) {
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
          (this._multiBackdropWrap = createMultiResultBackplates(document, imageCount2, { items: items })));
        this._multiBackdropWrap &&
          (this._multiStackWrap.appendChild(this._multiBackdropWrap),
          this._multiBackdropWrap.querySelectorAll('.' + MULTI_RESULT_BACKPLATE_CLASS).forEach((el28) => {
            const imageIndex = Number(el28.dataset?.imageIndex);
            if (!Number.isFinite(imageIndex)) return;
            this._multiBackplateEls[imageIndex] = el28;
            const response4 = this._pickImageDisplayUrl(value112[imageIndex], value113[imageIndex], {
                lowZoomThumbnail: false,
              }),
              enabled30 = imageCount[imageIndex];
            if (!enabled30?.error) {
              const el29 = document.createElement('img');
              ((el29.className = 'multi-stack-backplate-media'),
                this._setLazyImageDisplaySource(el29, response4),
                (el29.decoding = 'async'),
                (el29.draggable = false),
                el29.addEventListener('dragstart', (event16) => event16.preventDefault()),
                el28.appendChild(el29));
            }
            const run6 = this._bindResultImageDragOut(el28, {
              imageIndex: imageIndex,
              getGhostSourceElement: () => el28.querySelector('img') || el28,
              getFallbackSrc: () =>
                el28.querySelector('img')?.currentSrc ||
                el28.querySelector('img')?.src ||
                response4.url ||
                '',
              getFallbackSize: () => ({
                width: this.previewEl?.offsetWidth || this._data?.width || 320,
                height: this.previewEl?.offsetHeight || this._data?.height || 320,
              }),
            });
            (el28.addEventListener('pointerdown', (event17) => {
              const value131 = store.getState().nodes[this.nodeId];
              value131?.isImagesExpanded && event17.stopPropagation();
            }),
              el28.addEventListener('click', (event18) => {
                if (run6()) {
                  (event18.preventDefault(), event18.stopPropagation());
                  return;
                }
                const enabled31 = store.getState().nodes[this.nodeId];
                if (!enabled31?.isImagesExpanded) return;
                (event18.stopPropagation(), handler11(imageIndex));
              }));
          }));
        this._multiBackplateKeyStr = multiResultBackplateKey;
        for (let imageIndex2 = imageCount2 - 1; imageIndex2 >= 0; imageIndex2--) {
          const el30 = document.createElement('img'),
            value132 = this._pickImageDisplayUrl(value112[imageIndex2], value113[imageIndex2]);
          (this._setLazyImageDisplaySource(el30, value132),
            this._applyImageElementLod(el30, value132.lod),
            (el30.decoding = 'async'),
            (el30.draggable = false),
            el30.addEventListener('dragstart', (event19) => event19.preventDefault()),
            (el30.style.position = 'absolute'),
            (el30.style.top = '0'),
            (el30.style.left = '0'),
            (el30.style.width = '100%'),
            (el30.style.height = '100%'),
            (el30.style.objectFit = 'contain'),
            (el30.style.borderRadius = '18px'),
            (el30.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'),
            (el30.style.transformOrigin = 'top left'),
            el30.classList.add('v2-media-preview'));
          const run7 = this._bindResultImageDragOut(el30, {
            imageIndex: imageIndex2,
            getGhostSourceElement: () => el30,
            getFallbackSrc: () => el30.currentSrc || el30.src || '',
            getFallbackSize: () => ({
              width: this.previewEl?.offsetWidth || this._data?.width || 320,
              height: this.previewEl?.offsetHeight || this._data?.height || 320,
            }),
          });
          (el30.addEventListener('click', (event20) => {
            if (run7()) {
              (event20.preventDefault(), event20.stopPropagation());
              return;
            }
            const value133 = store.getState().nodes[this.nodeId];
            value133.isImagesExpanded && (event20.stopPropagation(), handler11(this._lastMainIdx || 0));
          }),
            el30.addEventListener('dblclick', async (event21) => {
              event21.stopPropagation();
              const value134 = this._lastMainIdx || 0,
                value135 = store.getState().nodes[this.nodeId],
                value136 = value135.images || [],
                value137 = value136[value134] || value136[0];
              await openNodeImagePreview(value137);
            }));
          if (imageCount[imageIndex2].error) {
            const el31 = this._createErrorCard(imageCount[imageIndex2].error);
            ((el31.style.position = 'absolute'),
              (el31.style.inset = '0'),
              (this._multiErrorEls[imageIndex2] = el31),
              this._multiStackWrap.appendChild(el31));
          } else ((this._multiLayerEls[imageIndex2] = el30), this._multiStackWrap.appendChild(el30));
        }
        ((this._multiToggleBtn = document.createElement('div')),
          (this._multiToggleBtn.className = 'multi-toggle-btn'),
          Object.assign(this._multiToggleBtn.style, {
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 1005,
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
          this._multiToggleBtn.addEventListener('pointerdown', (event22) => {
            if (event22.button !== 0) return;
            (event22.preventDefault(), event22.stopPropagation());
            const enabled32 = store.getState().nodes[this.nodeId],
              value138 = !!enabled32.isImagesExpanded;
            value138
              ? handler11(enabled32.mainImageIndex ?? this._lastMainIdx ?? 0)
              : (this._removeCurrentNodeFromSelection(),
                store.updateNodeData(this.nodeId, { isImagesExpanded: true }));
          }),
          this._multiToggleBtn.addEventListener('mouseenter', () => handler12(this._multiToggleBtn, true)),
          this._multiToggleBtn.addEventListener('mouseleave', () => {
            const enabled33 = store.getState().nodes[this.nodeId];
            handler12(this._multiToggleBtn, !!enabled33.isImagesExpanded);
          }),
          this._multiToggleBtn.addEventListener('click', (event23) => {
            (event23.preventDefault(), event23.stopPropagation());
          }),
          this._multiStackWrap.appendChild(this._multiToggleBtn),
          this._multiImagesContainer.appendChild(this._multiStackWrap));
      }
      (syncMultiResultStackClasses({
        previewEl: this.previewEl,
        stackWrap: this._multiStackWrap,
        isActive: imageCount2 > 1,
        isExpanded: isExpanded,
      }),
        handler12(this._multiToggleBtn, isExpanded));
      for (let value139 = 0; value139 < imageCount2; value139++) {
        const value140 = value139 === mainIndex,
          el32 = this._multiLayerEls[value139],
          el33 = this._multiErrorEls[value139];
        if (el32) {
          if (value140) this._loadLazyImageDisplaySource(el32);
          else this._scheduleClearLazyImageDisplaySource(el32, AIGEN_IMAGE_HIDDEN_SOURCE_CLEAR_DELAY_MS);
          ((el32.style.display = value140 ? 'block' : 'none'),
            (el32.style.pointerEvents = value140 ? '' : 'none'),
            value140 &&
              ((el32.style.transform = 'rotate(0deg) scale(1)'),
              (el32.style.opacity = '1'),
              (el32.style.zIndex = imageCount2 + 1),
              (el32.style.boxShadow = '0 4px 12px var(--black-40)')));
        }
        el33 &&
          ((el33.style.display = value140 ? 'flex' : 'none'),
          (el33.style.zIndex = value140 ? imageCount2 + 1 : value139));
      }
      const width5 = this.previewEl.offsetWidth || value118,
        height4 = this.previewEl.offsetHeight || value119,
        value141 = 12,
        left = 38,
        top = 18,
        width6 = Math.max(1, width5 - left - 4),
        height5 = Math.max(1, height4 - top * 2),
        value142 = [
          { x: 10, y: 0, rotate: 4, scale: 0.99, opacity: 0.86 },
          { x: 22, y: 6, rotate: 8, scale: 0.975, opacity: 0.72 },
          { x: 34, y: 12, rotate: 12, scale: 0.955, opacity: 0.58 },
        ],
        top2 = (value143, value144) => {
          const value145 = Number.parseFloat(value143);
          return Number.isFinite(value145) ? value145 : value144;
        },
        handler13 = (box3) =>
          'translate(' +
          box3.x +
          'px, ' +
          box3.y +
          'px) rotate(' +
          box3.rotate +
          'deg) scale(' +
          box3.scale +
          ')',
        value146 = 'all 0.46s cubic-bezier(0.175, 0.885, 0.32, 1.27), filter 0.4s ease-out',
        handler14 = (el34, top3) => {
          Object.assign(el34.style, {
            top: top3.top + 'px',
            left: top3.left + 'px',
            width: top3.width + 'px',
            height: top3.height + 'px',
            opacity: String(top3.opacity),
            pointerEvents: top3.pointerEvents,
            zIndex: String(top3.zIndex),
            borderRadius: top3.borderRadius,
            transform: top3.transform,
            filter: top3.filter,
            transformOrigin: top3.transformOrigin,
          });
        },
        handler15 = ({ plate: plate, fromFrame: fromFrame, toFrame: toFrame }) => {
          if (!plate) return;
          ((plate.style.transition = 'none'),
            handler14(plate, fromFrame),
            plate.getBoundingClientRect?.(),
            requestAnimationFrame(() => {
              ((plate.style.transition = value146), handler14(plate, toFrame));
            }));
        },
        handler16 = () => {
          const count4 = imageCount2 <= 2 ? imageCount2 : 2,
            count5 = Math.ceil(imageCount2 / count4),
            value147 = count5 - 1,
            value148 = 0,
            list19 = [];
          for (let r = 0; r < count5; r += 1) {
            for (let c = 0; c < count4; c += 1) {
              if (r === value147 && c === value148) continue;
              list19.push({ r: r, c: c });
            }
          }
          count5 === 2 &&
            count4 === 2 &&
            ((list19.length = 0),
            list19.push({ r: 1, c: 1 }),
            list19.push({ r: 0, c: 0 }),
            list19.push({ r: 0, c: 1 }));
          const map5 = new Map();
          let order = 0;
          for (let value149 = 0; value149 < imageCount2; value149 += 1) {
            if (value149 === mainIndex) continue;
            const left2 = list19[order];
            if (!left2) break;
            (map5.set(value149, {
              order: order,
              top: (left2.r - value147) * (height4 + value141),
              left: left2.c * (width5 + value141),
            }),
              (order += 1));
          }
          return map5;
        };
      ((run5 = (enabled34) => {
        const map6 = handler16(),
          list20 = this._multiBackdropWrap?.querySelectorAll?.('.' + MULTI_RESULT_BACKPLATE_CLASS);
        (list20?.forEach((plate2) => {
          const value150 = Number(plate2.dataset?.imageIndex),
            zIndex = Math.max(1, Number(plate2.dataset?.stackIndex) || 1),
            opacity = value142[zIndex - 1] || value142[0],
            box4 = map6.get(value150),
            top4 = !!enabled34 && !!box4,
            el35 = plate2.querySelector('.multi-stack-backplate-media'),
            value151 = plate2.classList.contains('is-expanded-card'),
            box5 = {
              top: top2(plate2.style.top, top),
              left: top2(plate2.style.left, left),
              width: top2(plate2.style.width, width6),
              height: top2(plate2.style.height, height5),
            },
            transform = handler13(opacity),
            value152 = {
              top: top,
              left: left,
              width: width6,
              height: height5,
              opacity: opacity.opacity,
              pointerEvents: 'none',
              zIndex: zIndex,
              borderRadius: '0 var(--radius-16) var(--radius-16) 0',
              transform: transform,
              filter: 'brightness(0.86) saturate(0.92)',
              transformOrigin: 'center right',
            },
            value153 = {
              top: top4 ? box4.top : box5.top,
              left: top4 ? box4.left : box5.left,
              width: width5,
              height: height4,
              opacity: 1,
              pointerEvents: 'auto',
              zIndex: top4 ? 2 + box4.order : zIndex,
              borderRadius: '18px',
              transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
              filter: 'brightness(1) saturate(1)',
              transformOrigin: 'bottom left',
            },
            fromFrame2 = value151 ? value153 : value152,
            toFrame2 = top4 ? value153 : value152,
            value154 = !!this._multiStackCardsLaidOut && value151 !== top4;
          (plate2.classList.toggle('is-expanded-card', top4), (plate2.style.display = 'block'));
          if (el35) {
            if (top4) this._loadLazyImageDisplaySource(el35);
            else
              value151 && this._multiStackCardsLaidOut
                ? this._scheduleClearLazyImageDisplaySource(el35, value117)
                : this._clearLazyImageDisplaySource(el35);
            ((el35.style.opacity = top4 ? '1' : '0'),
              (el35.style.transform = top4 ? 'scale(1)' : 'scale(1.02)'));
          }
          value154
            ? handler15({ plate: plate2, fromFrame: fromFrame2, toFrame: toFrame2 })
            : ((plate2.style.transition = value146), handler14(plate2, toFrame2));
        }),
          (this._multiStackCardsLaidOut = true));
      }),
        this._expandPanel &&
          this._expandPanel.parentNode &&
          this._expandPanel.parentNode.removeChild(this._expandPanel),
        (this._expandPanel = null),
        isExpanded &&
          ((this._root.style.position = 'relative'), this._root.style.setProperty('overflow', 'visible')),
        run5(isExpanded));
    }
    ['_createErrorCard'](value155) {
      const el36 = document.createElement('div');
      return (
        (el36.className = 'gen-error-card'),
        Object.assign(el36.style, {
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
        (el36.innerHTML =
          '\n            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>\n            </svg>\n            <span style="color:var(--red);font-size:12px;font-weight:600;line-height:1.4;">' +
          t('aigenImage.result.restrictedOrFailed') +
          '</span>\n            <span style="color:var(--white-50);font-size:11px;line-height:1.5;word-break:break-all;">' +
          value155 +
          '</span>\n        '),
        el36
      );
    }
    ['_createStatusCard'](value156, value157) {
      const el37 = document.createElement('div');
      ((el37.className = 'gen-status-card'),
        Object.assign(el37.style, {
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
      const value158 = Number(value157) === 0,
        value159 = value158 ? 'var(--green)' : 'var(--white-80)',
        value160 = value156;
      return (
        (el37.innerHTML =
          '\n            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' +
          value159 +
          '" stroke-width="2">\n                <circle cx="12" cy="12" r="10"/><path d="' +
          (value158 ? 'M8 12l2.5 2.5L16 9' : 'M12 8v5') +
          '" />' +
          (value158 ? '' : '<line x1="12" y1="16" x2="12.01" y2="16" />') +
          '\n            </svg>\n            <span style="color:' +
          value159 +
          ';font-size:12px;font-weight:600;line-height:1.4;">' +
          value160 +
          '</span>\n        '),
        el37
      );
    }
    ['_syncPromptPlaceholder'](value161 = this._data) {
      if (!this.promptEl) return;
      this.promptEl.dataset.placeholder = getImagePromptPlaceholderForModel(value161?.model);
    }
    ['_syncPromptBoxSizeFromData'](value162 = this._data) {
      if (!this.promptEl || this._isPromptBoxResizing) return;
      const promptBoxHeightBounds = getPromptBoxHeightBounds(this._promptPanel),
        promptBoxHeight = normalizePromptBoxHeight(value162?.promptBoxHeight, promptBoxHeightBounds);
      applyPromptBoxHeight(this.promptEl, promptBoxHeight);
    }
    ['_setupPromptBoxResize']() {
      if (!this._promptPanel || this._promptResizeHandle) return;
      this._promptResizeHandle = true;
      const value163 = 20,
        value164 = 10,
        handler17 = () => store.getStateRaw().ui?.promptBoxResizeEnabled !== false,
        handler18 = (el38) => !!el38?.closest('.floating-menu, .img-model-menu'),
        handler19 = (value165) => {
          const box6 = this._promptPanel.getBoundingClientRect();
          return value165 >= box6.bottom - value163 && value165 <= box6.bottom + value164;
        },
        handler20 = (event24) => {
          if (!this._promptPanel) return;
          if (!handler17()) {
            this._promptPanel.classList.remove('is-resize-hover');
            return;
          }
          if (this._isPromptBoxResizing) {
            this._promptPanel.classList.add('is-resize-hover');
            return;
          }
          const value166 = !handler18(event24?.target) && handler19(event24.clientY);
          this._promptPanel.classList.toggle('is-resize-hover', value166);
        };
      (this._promptPanel.addEventListener('pointermove', handler20),
        this._promptPanel.addEventListener('pointerleave', () => {
          !this._isPromptBoxResizing && this._promptPanel?.classList.remove('is-resize-hover');
        }));
      const value167 = (event25) => {
        if (!this._promptInputWrap || !this.promptEl) return;
        if (!handler17()) return;
        if (event25.button !== 0) return;
        if (!handler19(event25.clientY)) return;
        if (event25.target?.closest('.prompt-submit') || handler18(event25.target)) return;
        (event25.stopPropagation(), event25.preventDefault());
        const promptBoxHeightBounds2 = getPromptBoxHeightBounds(this._promptPanel),
          value168 = event25.clientY,
          value169 = this.promptEl.getBoundingClientRect().height;
        ((this._isPromptBoxResizing = true),
          this._promptInputWrap.classList.add('is-resizing'),
          this._promptPanel.classList.add('is-resize-hover'));
        const value170 = (event26) => {
            event26.preventDefault();
            const promptBoxHeight2 = normalizePromptBoxHeight(
              value169 + (event26.clientY - value168),
              promptBoxHeightBounds2,
            );
            applyPromptBoxHeight(this.promptEl, promptBoxHeight2);
          },
          value171 = (event27) => {
            (event27.preventDefault(),
              window.removeEventListener('pointermove', value170),
              window.removeEventListener('pointerup', value171),
              window.removeEventListener('pointercancel', value171));
            const promptBoxHeight3 = normalizePromptBoxHeight(
              this.promptEl?.getBoundingClientRect().height,
              promptBoxHeightBounds2,
            );
            (applyPromptBoxHeight(this.promptEl, promptBoxHeight3),
              this._promptInputWrap.classList.remove('is-resizing'),
              (this._isPromptBoxResizing = false),
              this._promptPanel.classList.remove('is-resize-hover'),
              handler20(event27),
              store.updateNodeData(this.nodeId, { promptBoxHeight: promptBoxHeight3 }));
          };
        (window.addEventListener('pointermove', value170),
          window.addEventListener('pointerup', value171),
          window.addEventListener('pointercancel', value171));
      };
      this._promptPanel.addEventListener('pointerdown', value167);
    }
    ['_isRunninghubWorkflowModel'](value172, value173) {
      return isWorkflowModel(value172, value173 || 'runninghubwf');
    }
    ['_normalizeLegacySeedreamModel'](value174, value175 = {}) {
      const value176 = value175?.syncStore !== false,
        args9 = value174 || {},
        value177 = String(args9.model || '').trim(),
        value178 = value177.toLowerCase();
      let value179 = '',
        value180 = '';
      if (value178.startsWith('apimart/seedream-')) return value174;
      else {
        if (value178.startsWith('runninghub-model/seedream-'))
          ((value179 = 'runninghub-model/rhart-image-v1'), (value180 = 'runninghub'));
        else {
          if (value178.startsWith('ppio/seedream-')) ((value179 = 'nano-banana-2'), (value180 = 'grsai'));
          else return value174;
        }
      }
      const args10 = {};
      value177 !== value179 && (args10.model = value179);
      String(args9.provider || '').trim() !== value180 && (args10.provider = value180);
      String(args9.imageSize || '')
        .trim()
        .toUpperCase() === '3K' && (args10.imageSize = '2K');
      if (Object.keys(args10).length === 0) return args9;
      const value181 = { ...args9, ...args10 },
        value182 = store.getState().nodes?.[this.nodeId];
      return (value176 && value182 && store.updateNodeData(this.nodeId, args10), value181);
    }
    ['_normalizeDreaminaNodeData'](value183, value184 = {}) {
      const syncStore = value184?.syncStore !== false,
        value185 = this._normalizeLegacySeedreamModel(value183, { syncStore: syncStore }),
        args11 = buildDreaminaImageNodeNormalizationPatch(value185);
      if (!args11) return value185;
      const value186 = { ...(value185 || {}), ...args11 },
        value187 = store.getState().nodes?.[this.nodeId];
      return (syncStore && value187 && store.updateNodeData(this.nodeId, args11), value186);
    }
    ['_buildSchemaAspectRatioDisplayPatch'](value188, ratioValue) {
      const nodeData4 = value188 || (store.getState?.() || {}).nodes?.[this.nodeId] || this._data || {},
        patch = buildImageSchemaAspectRatioDisplayPatch({
          store: store,
          nodeId: this.nodeId,
          nodeData: nodeData4,
          ratioValue: ratioValue,
          minSide: getAIGenerationNodeSize().width,
          getRefKindByNodeType: getRefKindByNodeType,
          resultMediaElement: this.imgEl,
        });
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: nodeData4,
          patch: patch,
        }),
        patch
      );
    }
    ['runAdaptiveRatio']() {
      const value189 = (store.getState?.() || {}).nodes?.[this.nodeId] || this._data || {},
        value190 = this._buildSchemaAspectRatioDisplayPatch(value189, '自适应');
      Object.keys(value190).length > 0 && store.updateNodeData(this.nodeId, value190);
    }
    ['_applyModelParamVisibility'](enabled35 = this._data) {
      if (!enabled35) return;
      const value191 = this._getUiSchemaRenderNodeData(enabled35),
        uiSchemaVisibilitySignature = buildUiSchemaVisibilitySignature(enabled35.model, value191),
        handler21 = (el39, placement) => {
          if (!el39) return;
          const renderModelUiSchemaControls7 = renderModelUiSchemaControls(enabled35.model, value191, {
            placement: placement,
            variant:
              placement === 'mode'
                ? 'pillMenu'
                : placement === 'resolution'
                  ? 'resolutionPill'
                  : placement === 'advanced'
                    ? 'advancedRow'
                    : placement === 'instance'
                      ? 'instanceToggle'
                      : placement === 'batch'
                        ? 'pillMenu'
                        : undefined,
          });
          ((el39.innerHTML = renderModelUiSchemaControls7),
            (el39.style.display = renderModelUiSchemaControls7 ? '' : 'none'));
        };
      (this._uiSchemaModel !== enabled35.model ||
        this._uiSchemaVisibilitySignature !== uiSchemaVisibilitySignature) &&
        (handler21(this.uiSchemaModeSlot, 'mode'),
        handler21(this.uiSchemaResolutionSlot, 'resolution'),
        handler21(this.rhAdvPanelEl, 'advanced'),
        handler21(this.uiSchemaInstanceSlot, 'instance'),
        handler21(this.uiSchemaBatchSlot, 'batch'),
        (this._uiSchemaModel = enabled35.model),
        (this._uiSchemaVisibilitySignature = uiSchemaVisibilitySignature),
        (this._qwenFirstImageModeBtns = []));
      syncModelUiSchemaControls(this.modelWrap?.closest('.prompt-panel-footer'), value191);
      const hasModelUiSchema3 = hasModelUiSchema(enabled35.model, { placement: 'advanced' });
      if (this.rhAdvWrap) this.rhAdvWrap.style.display = hasModelUiSchema3 ? '' : 'none';
      if (this.rhAdvPanelEl && !hasModelUiSchema3) this.rhAdvPanelEl.classList.remove('show');
    }
  }
  return record.prototype;
}

const AIGEN_IMAGE_MULTI_STACK_MOTION_DURATION_MS = 500;
const AIGEN_IMAGE_BACKPLATE_MEDIA_HIDE_CLEAR_DELAY_MS = 180;

export function shouldShowImagePromptInput(enabled36) {
  if (!enabled36 || typeof enabled36 !== 'object') return !![];
  if (enabled36?.['prompt']?.['visible'] === ![]) return ![];
  if (enabled36?.['prompt']?.['hidden'] === !![]) return ![];
  return !![];
}

function getRhAiAppImageResultMediaKey(options3 = {}) {
  const value192 = Array['isArray'](options3?.['images']) ? options3['images'] : [],
    value193 = Number(options3?.['mainImageIndex']),
    value194 = Number['isFinite'](value193) ? Math['max'](0, Math['trunc'](value193)) : 0,
    value195 = value192[Math['min'](value194, Math['max'](0, value192['length'] - 1))] || {};
  return (
    [
      value195['displayLocalPath'],
      value195['localPath'],
      value195['originalLocalPath'],
      value195['imageUrl'],
      value195['sourceUrl'],
      value195['thumbUrl'],
      value195['thumbId'],
      options3?.['imageUrl'],
      options3?.['sourceUrl'],
      options3?.['thumbUrl'],
    ]
      ['map']((value196) => String(value196 || '')['trim']())
      ['find'](Boolean) || ''
  );
}

export function resolveUploadedImageReferenceUrl(options4 = {}) {
  const imageNodeStorageFields = buildImageNodeStorageFields(options4);
  return (
    String(options4?.['displayUrl'] || '')['trim']() ||
    String(options4?.['originalUrl'] || '')['trim']() ||
    String(options4?.['url'] || '')['trim']() ||
    toLocalPathUrl(
      imageNodeStorageFields['displayLocalPath'] ||
        imageNodeStorageFields['originalLocalPath'] ||
        imageNodeStorageFields['localPath'],
    )
  );
}

function flushAIGenImageReferenceUploadNodes(list21 = []) {
  const value197 = Array['from'](
    new Set(list21['map']((value198) => String(value198 || '')['trim']())['filter'](Boolean)),
  );
  if (value197['length'] === 0) return ![];
  const value199 = globalThis['window']?.['v2Renderer'];
  if (typeof value199?.['flushNodes'] === 'function')
    try {
      if (value199['flushNodes'](value197) === !![]) return !![];
    } catch {}
  if (typeof value199?.['flushNode'] !== 'function') return ![];
  let value200 = ![];
  for (const value201 of value197) {
    try {
      value200 = value199['flushNode'](value201) === !![] || value200;
    } catch {}
  }
  return value200;
}

function collectSubmitButtonInputRecords({
  latestNode: latestNode = {},
  nodes: nodes = {},
  inEdges: inEdges = [],
  imageInputGate: imageInputGate = {},
} = {}) {
  const targetInputPolicy2 = getTargetInputPolicy({
      ...latestNode,
      type: latestNode?.['type'] || 'ai-image',
    }),
    value202 = String(imageInputGate?.['kind'] || '')['trim'](),
    value203 = [];
  return (
    value202 === 'image' &&
      getImageInputGateUploadedUrl(latestNode, imageInputGate) &&
      value203['push']({ kind: 'image', refSlot: '' }),
    (Array['isArray'](inEdges) ? inEdges : [])['forEach']((value204) => {
      const response5 = nodes?.[value204?.['sourceId']];
      if (!response5) return;
      const effectiveInputKind2 = resolveEffectiveInputKind(response5, value204);
      if (!effectiveInputKind2 || !isInputKindAllowed(targetInputPolicy2, effectiveInputKind2)) return;
      if (value202 && effectiveInputKind2 !== value202) return;
      if (effectiveInputKind2 === 'text') {
        const enabled37 = String(
          response5['outputText'] ||
            response5['text'] ||
            response5['content'] ||
            response5['prompt'] ||
            response5['label'] ||
            '',
        )['trim']();
        if (!enabled37) return;
      }
      value203['push']({ kind: effectiveInputKind2, refSlot: value204?.['refSlot'] || '' });
    }),
    value203
  );
}
