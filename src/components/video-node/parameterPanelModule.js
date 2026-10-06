import { openDebugRequestWindow } from '../../modules/debugRequestWindow.js';
import {
  APIMART_DREAMINA_VIDEO_DEFAULT_MODEL,
  buildDreaminaStyleVideoNodeNormalizationPatch,
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDurationRange,
  getDreaminaStyleVideoResolutionOptions,
  getDreaminaVideoTaskParamVisibility,
  isApimartDreaminaVideoModel,
  isDreaminaStyleVideoModel,
  isDreaminaVideoRouteModeEnabled,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaStyleVideoDuration,
  getDreaminaStyleVideoDefaultModel,
  normalizeDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from '../../modules/dreaminaVideoModelHelper.js';
import { normalizeProviderId, resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import {
  buildFixedInputAssetSlotMap,
  getFixedInputSlotConfigFromManifest,
  resolveFixedInputSlotForRef,
} from '../../modules/fixedInputAssetRefs.js';
import { flushPromptHtmlCommit, resolvePromptTextWithTextRefs } from '../../modules/nodePromptShared.js';
import { resolveEffectiveInputKind } from '../../modules/modelInputPolicy.js';
import { getGenerationRatioSizeWithDom } from '../../modules/generationRatioSource.js';
import { DEBUG_WRENCH_ICON_HTML, buildFinalApiDebugPreview } from '../../utils/debugRequestPreview.js';
import { getNodeDefaultSize } from '../../services/fileService.js';
import { releasePayloadObjectUrlLease } from '../../services/payloadObjectUrlLease.js';
import { resolveGenerationButtonMode } from '../../core/generationTaskUiState.js';
import { showRunningHubMediaUploadGuideForError } from '../../modules/runningHubMediaUploadGuide.js';
import {
  applyModelCredentialButtonState,
  bindModelCredentialMenu,
  resetModelCredentialButtonState,
  syncModelCredentialMenu,
} from '../../modules/modelCredentialUi.js';
import {
  resetGenerateButtonIdleUi,
  setGenerateButtonCancellableUi,
  setGenerateButtonLoadingUi,
} from '../../modules/previewGenerateButtonUi.js';
import { evaluateGenerationPromptBoundary } from '../../modules/generationPromptPolicy.js';
import { getSegmentRetakeValidation } from '../../modules/videoRetake/segmentRetakeSession.js';
import {
  decorateSegmentRetakeParameterNodeData,
  decorateSegmentRetakeParameterSchemaFields,
  getSegmentRetakeAllowedModelIdsForNode,
  isSegmentRetakeEditing,
} from '../../modules/videoRetake/segmentRetakeModelPolicy.js';
import { rememberSegmentRetakeModelSelection } from '../../modules/videoRetake/segmentRetakeModelPreference.js';
import {
  buildUiSchemaParamPatch,
  bindUiSchemaFieldControls,
  bindModelUiSchemaControls,
  hasVisibleModelUiSchema,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
  syncModelUiSchemaControls,
} from '../aigenImage/uiSchemaRenderer.js';
import {
  applyImageSchemaRatioResizeAnimation,
  animateImageSchemaRatioResizeFlip,
  armImageSchemaRatioResizeAnimation,
  buildGenerationModelSelectionPayload,
  buildImageSchemaAspectRatioDisplayPatch,
  GENERATION_MANUAL_DISPLAY_SIZE_FIELD,
  GENERATION_RATIO_RESIZE_ANIMATION_MS,
} from '../shared/generationDisplayPolicy.js';
import {
  VIDEO_DISPLAY_RATIO_RESULT_FIELDS,
  buildVideoSchemaAspectRatioDisplayPatch,
} from './videoSchemaAspectRatioDisplayPatch.js';
import {
  restoreLegacyVideoRatioPopupAfterSync,
  syncLegacyVideoRatioFooter,
} from './legacyVideoRatioPopup.js';
import {
  isRunningHubVideoWorkflowModel,
  resolveVideoAdvancedSchemaTarget,
} from './videoAdvancedSchemaTarget.js';
import { renderNodeModelTrigger } from '../shared/nodeModelMenu.js';
import {
  bindLazyVideoModelMenu,
  buildVideoModelMenuHTML,
  renderVideoModelTriggerIconHTML,
} from './modelSelectorShared.js';
import {
  bindNodeFooterController,
  closeNodeFooterMenus,
  syncNodeFooterAdvancedButtonState,
  positionNodeAdvancedPanel,
} from '../shared/nodeFooterControls.js';
import { ADVANCED_SETTINGS_TUNE_ICON_MARKUP } from '../sharedIconMarkup.js';
import { bindGenerationNodeFooterLifecycle } from '../shared/generationNodeFooterLifecycle.js';
import {
  RH_AI_APP_PERSISTENT_ADVANCED_CLASS,
  isRunningHubAiAppManifest,
  shouldAllowEmptyCustomAiAppInputs,
} from '../shared/rhAiAppNodeBehavior.js';
import {
  buildVideoWorkflowDisplayParamsPatch,
  buildVideoWorkflowGenerationParamsPatch,
  buildVideoWorkflowModelSelectionPatch,
  getRunningHubVideoWorkflowFpsOptions,
  getRunningHubVideoParameterPanelPolicy,
  getPlainGenerationParams,
  hasRunningHubVideoWorkflowUiPlacement,
  isRunningHubVideoWorkflowManifest,
} from './runningHubVideoUiSchema.js';
import {
  arePlainObjectsEqual,
  buildAgnesVideoLogoHTML,
  buildAgnesVideoMenuItemsHtml,
  buildApimartVideoMenuItemsHtml,
  buildApimartVideoLogoHTML,
  buildCustomProviderVideoLogoHTML,
  buildCustomProviderVideoMenuGroups,
  getComfyUiVideoWorkflowIconHtml,
  buildComfyUiVideoWorkflowMenuGroups,
  buildDreaminaVideoLogoHTML,
  buildDreaminaOfficialVideoMenuItems,
  buildDreaminaTaskModelMenuHtml,
  buildRunningHubVideoModelApiMenuItems,
  buildRunningHubVideoWorkflowMenuItems,
  buildRhAiAppVideoMenuItems,
  buildVolcengineOfficialVideoMenuItems,
  buildVolcengineVideoLogoHTML,
  getDefaultRunningHubVideoWorkflowModelId,
  getDreaminaTaskModelMenuItems,
  getDreaminaTaskModelMenuMeta,
  getRhV54FpsOptions,
  normalizeRhStandardFps,
  normalizeRhV54Fps,
} from './parameterPanelModelHelpers.js';
import {
  buildDreaminaParamPatch,
  buildDreaminaModelSelectionParamPatch,
  buildDreaminaParamSchemaFields,
  buildDreaminaRouteModeUpdate,
  buildDreaminaStorePatchFromNormalization,
  getDreaminaEffectiveNodeData,
  resolveDreaminaRememberedRouteModel,
} from './dreaminaParameterSchema.js';
import { renderVideoFooterShell } from './footerShell.js';
import {
  buildRhWorkflowFieldPatch,
  buildVideoModelApiModelSelectionPatch,
  getManifestInputPolicyEdgeIdsToRemove,
  getPanelModelManifest,
  isHappyHorsePanelModel,
} from './parameterPanelModelSelectionPolicy.js';
import {
  DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER,
  VIDEO_MODE_ALL_REFERENCE_VALUE,
  VIDEO_MODE_FIRST_LAST_VALUE,
  formatVideoRatioResolutionLabel,
  getDreaminaProviderLabel,
  getVideoCancelTooltip,
  getVideoGenerateTitle,
  getVideoModeLabel,
  manifestFixedSlotVisibilityReferencesField,
  manifestHelpVariantsReferenceField,
  manifestPromptVariantsReferenceField,
  resolveVideoAdaptiveRatioSource,
  resolveVideoModelApiFooterPlacementOrder,
  resolveVideoPromptPlaceholder,
  shouldShowVideoPromptInput,
  videoPanelText,
  wrapUiSchemaPlacementControls,
} from './parameterPanelPresentationPolicy.js';
function bindVideoPanelEvent(el, value, item, key) {
  if (!el || typeof key !== 'function') return;
  const index = '__videoPanel_' + value + '_' + item,
    result = el[index];
  if (result) el.removeEventListener(value, result);
  ((el[index] = key), el.addEventListener(value, key));
}
function bindVideoPanelClick(data, options, target) {
  bindVideoPanelEvent(data, 'click', options, target);
}
function bindVideoPanelInput(source, next, current) {
  bindVideoPanelEvent(source, 'input', next, current);
}
function getDefaultVideoModelId() {
  return getDefaultRunningHubVideoWorkflowModelId();
}
function normalizeRhVideoFpsByPolicy(entry, record) {
  return entry?.sourceFrameCountFps === 'v54'
    ? normalizeRhV54Fps(record)
    : normalizeRhStandardFps(record);
}
function findPreferredVideoEdge(list, payload) {
  return list.find((handle) => {
    const state = payload?.nodes?.[handle?.sourceId],
      config = String(state?.type || '');
    return config === 'source-video' || config === 'video' || config === 'ai-video';
  });
}
export function createVideoNodeParameterPanelModule(scope) {
  const {
    store: store,
    api: api,
    getDisplayModelName: getDisplayModelName,
    PROVIDERS_META: PROVIDERS_META,
    getAIGenerationNodeSize: getAIGenerationNodeSize,
    getDisplayedMediaSizeFromNode: getDisplayedMediaSizeFromNode,
    activateMenuKeyboard: activateMenuKeyboard,
    isVideoVipModel: isVideoVipModel,
    readStoreState: readStoreState = () => store.getStateRaw?.() || store.getState?.() || {},
  } = scope;
  class input {
    ['_getRhVideoAdvancedSchemaNodeData'](options2 = {}) {
      const output = String(options2?.model || '').trim(),
        runningHubVideoParameterPanelPolicy = getRunningHubVideoParameterPanelPolicy(output);
      let args = options2;
      if (runningHubVideoParameterPanelPolicy.sourceFrameCountFps) {
        const rhVideoFpsByPolicy = normalizeRhVideoFpsByPolicy(runningHubVideoParameterPanelPolicy, options2?.rhVideoFps);
        args = {
          ...args,
          rhVideoSourceFrameCount: this._getRhV5SourceVideoFrameCount?.(rhVideoFpsByPolicy) || 0,
        };
      }
      if (runningHubVideoParameterPanelPolicy.maskVideoDisablesSubtractSubject !== true) return args;
      const enabled = (store.getIncomingEdges(this.nodeId) || []).some((value2) => {
        const value3 = String(value2?.refSlot || '').trim();
        return value3 === 'videoMask' || value3 === 'maskVideo';
      });
      if (!enabled) return args;
      return {
        ...args,
        rhV54HasMaskVideo: true,
        rhSubtractSubject: false,
        generationParams: {
          ...getPlainGenerationParams(args?.generationParams),
          rhSubtractSubject: false,
        },
      };
    }
    ['_buildVideoModelMenuHtml'](activeModel = '') {
      const allowedModelIds = getSegmentRetakeAllowedModelIdsForNode(this._data);
      return buildVideoModelMenuHTML({
        activeModel: activeModel || this._data?.model,
        provider: this._data?.provider,
        subscriptionState:
          (typeof store.getStateRaw === 'function'
            ? store.getStateRaw()
            : store.getState())?.subscription || {},
        allowedModelIds: allowedModelIds,
      });
    }
    ['_getVideoAdvancedSchemaTarget'](value4 = this._data) {
      return resolveVideoAdvancedSchemaTarget(value4, {
        fallbackNodeData: this._data,
        buildRunningHubNodeData: (value5) => this._getRhVideoAdvancedSchemaNodeData(value5),
      });
    }
    ['_renderVideoAdvancedControlsHtml'](value6 = this._data) {
      const placement = this._getVideoAdvancedSchemaTarget(value6);
      return placement
        ? renderModelUiSchemaControls(placement.modelId, placement.nodeData, {
            placement: placement.placement,
          })
        : '';
    }
    ['_hasVisibleVideoAdvancedControls'](value7 = this._data) {
      const placement2 = this._getVideoAdvancedSchemaTarget(value7);
      return (
        !!placement2 &&
        hasVisibleModelUiSchema(placement2.modelId, placement2.nodeData, {
          placement: placement2.placement,
        })
      );
    }
    ['_renderFooterShell'](value8) {
      renderVideoFooterShell(this, value8, {
        DEBUG_WRENCH_ICON_HTML: DEBUG_WRENCH_ICON_HTML,
        getDefaultVideoModelId: getDefaultVideoModelId,
        getDisplayModelName: getDisplayModelName,
        getVideoCancelTooltip: getVideoCancelTooltip,
        getVideoGenerateTitle: getVideoGenerateTitle,
        renderNodeModelTrigger: renderNodeModelTrigger,
        videoPanelText: videoPanelText,
      });
    }
    ['_renderFooterImpl'](el2) {
      if (el2?.dataset) delete el2.dataset.deferredDetailsShell;
      let value9 = false;
      const el3 = el2.querySelector('.rh-vram-adv-panel');
      el3 && (value9 = el3.classList.contains('show'));
      const decorateSegmentRetakeParameterNodeData2 = decorateSegmentRetakeParameterNodeData(this._data),
        value10 = this._isDreaminaVideoNode(decorateSegmentRetakeParameterNodeData2)
          ? this._syncDreaminaTaskState(decorateSegmentRetakeParameterNodeData2, { syncStore: !decorateSegmentRetakeParameterNodeData2?.segmentRetake })
          : null;
      if (value10?.nodeData)
        this._data = decorateSegmentRetakeParameterNodeData(value10.nodeData);
      const decorateSegmentRetakeParameterNodeData3 = decorateSegmentRetakeParameterNodeData(this._data),
        enabled2 = Boolean(value10),
        model = String(this._data.model || '').trim() || getDefaultVideoModelId(),
        panelModelManifest = getPanelModelManifest({ ...this._data, model: model }),
        isRunningHubAiAppManifest2 = isRunningHubAiAppManifest(panelModelManifest),
        value11 = !enabled2 && isRunningHubAiAppManifest2;
      if (isRunningHubVideoWorkflowManifest(model)) {
        const args2 = buildVideoWorkflowGenerationParamsPatch(this._data, model),
          args3 = buildVideoWorkflowDisplayParamsPatch(model, args2.generationParams, {
            v54FpsOptions: getRhV54FpsOptions(),
          }),
          value12 = Object.entries(args3).some(
            ([value13, value14]) => this._data?.[value13] !== value14,
          );
        if (
          args2.generationParams &&
          (!arePlainObjectsEqual(
            args2.generationParams,
            getPlainGenerationParams(this._data.generationParams),
          ) ||
            !arePlainObjectsEqual(
              args2.generationParamsByModel,
              getPlainGenerationParams(this._data.generationParamsByModel),
            ) ||
            value12)
        ) {
          const args4 = { ...args2, ...args3 };
          (store.updateNodeData(this.nodeId, args4),
            (this._data = { ...this._data, ...args4 }));
        }
      }
      const value15 = model.includes('seedance'),
        value16 =
          value10?.nodeData?.resolution ||
          this._data.resolution ||
          (value15 ? '720p' : '1080p'),
        value17 = this._getModelParamVisibility(model, this._data.provider),
        enabled3 = this._isRunninghubWorkflowModel(model, this._data.provider),
        value18 = this._resolveModelExecution(model, this._data.provider),
        enabled4 = !enabled2 && panelModelManifest?.kind !== 'video',
        enabled5 =
          !enabled2 &&
          !enabled3 &&
          value18?.modelManifest?.adapterType === 'modelApi' &&
          value18?.modelManifest?.kind === 'video',
        value19 = !enabled2 && !enabled3 && !isRunningHubAiAppManifest2 && !enabled5 && !enabled4,
        value20 = enabled5
          ? String(value18?.canonicalModelId || value18?.modelManifest?.modelId || model).trim()
          : model,
        value21 = enabled3,
        value22 = value21
          ? renderModelUiSchemaControls(model, this._data, {
              placement: 'instance',
              variant: 'instanceToggle',
            })
          : '',
        hasRunningHubVideoWorkflowUiPlacement2 = hasRunningHubVideoWorkflowUiPlacement(model, 'videoParams'),
        hasRunningHubVideoWorkflowUiPlacement3 = hasRunningHubVideoWorkflowUiPlacement(model, 'resolution'),
        value23 = hasRunningHubVideoWorkflowUiPlacement2 ? this._getRhVideoAdvancedSchemaNodeData(this._data) : this._data,
        value24 = hasRunningHubVideoWorkflowUiPlacement2
          ? renderModelUiSchemaControls(model, value23, {
              placement: 'videoParams',
              unwrap: true,
              rhVideoFpsOptions: getRunningHubVideoWorkflowFpsOptions(model, {
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            })
          : '',
        value25 = hasRunningHubVideoWorkflowUiPlacement3
          ? renderModelUiSchemaControls(model, value23, { placement: 'resolution' })
          : '',
        value26 = enabled5 ? renderModelUiSchemaControls(value20, decorateSegmentRetakeParameterNodeData3, { placement: 'mode' }) : '',
        value27 = enabled5
          ? renderModelUiSchemaControls(value20, decorateSegmentRetakeParameterNodeData3, { placement: 'resolution' })
          : '',
        value28 =
          enabled3 || isRunningHubAiAppManifest2
            ? renderModelUiSchemaControls(model, this._data, { placement: 'mode' })
            : '',
        value29 = this._hasVisibleVideoAdvancedControls(this._data),
        value30 = value29 ? this._renderVideoAdvancedControlsHtml(this._data) : '',
        iconHtml = this._getModelIconHTML(model, this._data.provider),
        value31 = this._getRatioIconHTML(this._data.aspectRatio || '自适应'),
        formatVideoRatioResolutionLabel2 = formatVideoRatioResolutionLabel(this._data.aspectRatio, value16),
        value32 =
          '\n                <div class="img-rp-quality-area">\n                  <div class="img-rp-section-label">' +
          videoPanelText('resolution') +
          '</div>\n                  <div class="img-rp-quality-segmented">\n                    <button type="button" class="img-rp-quality-item ' +
          (value16 === '480p' ? 'active' : '') +
          ' ' +
          (value15 ? 'is-disabled' : '') +
          '" data-value="480p" ' +
          (value15 ? 'disabled title="' + videoPanelText('resolutionUnavailable') + '"' : '') +
          '>480p</button>\n                    <button type="button" class="img-rp-quality-item ' +
          (value16 === '720p' ? 'active' : '') +
          '" data-value="720p">720p</button>\n                    <button type="button" class="img-rp-quality-item ' +
          (value16 === '1080p' ? 'active' : '') +
          ' ' +
          (value15 ? 'is-disabled' : '') +
          '" data-value="1080p" ' +
          (value15 ? 'disabled title="' + videoPanelText('resolutionUnavailable') + '"' : '') +
          '>1080p</button>\n                  </div>\n                </div>\n                <div class="img-rp-ratio-area">\n                  <div class="img-rp-section-label">' +
          videoPanelText('aspectRatio') +
          '</div>\n                  <div class="img-rp-ratio-split">\n                    <div class="img-rp-ratio-left">\n                      <button type="button" class="img-rp-large-adaptive active" data-label="自适应" data-w="1" data-h="1">\n                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n                        <span>' +
          videoPanelText('adaptive') +
          '</span>\n                      </button>\n                    </div>\n                    <div class="img-rp-ratio-right">\n                      <button type="button" class="img-rp-ratio-item" data-label="1:1" data-w="1" data-h="1"><span class="img-rp-icon img-rp-sq"></span><span>1:1</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="9:16" data-w="9" data-h="16"><span class="img-rp-icon img-rp-tall"></span><span>9:16</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="16:9" data-w="16" data-h="9"><span class="img-rp-icon img-rp-wide"></span><span>16:9</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="3:4" data-w="3" data-h="4"><span class="img-rp-icon img-rp-p34"></span><span>3:4</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="4:3" data-w="4" data-h="3"><span class="img-rp-icon img-rp-l43"></span><span>4:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="3:2" data-w="3" data-h="2" disabled><span class="img-rp-icon img-rp-l32"></span><span>3:2</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="2:3" data-w="2" data-h="3" disabled><span class="img-rp-icon img-rp-p23"></span><span>2:3</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="5:4" data-w="5" data-h="4" disabled><span class="img-rp-icon img-rp-l54"></span><span>5:4</span></button>\n                      <button type="button" class="img-rp-ratio-item is-disabled" data-label="4:5" data-w="4" data-h="5" disabled><span class="img-rp-icon img-rp-p45"></span><span>4:5</span></button>\n                      <button type="button" class="img-rp-ratio-item" data-label="21:9" data-w="21" data-h="9"><span class="img-rp-icon img-rp-ultra"></span><span>21:9</span></button>\n                    </div>\n                  </div>\n                </div>\n      ',
        list2 = enabled5
          ? resolveVideoModelApiFooterPlacementOrder(value18?.modelManifest)
          : DEFAULT_VIDEO_MODEL_API_FOOTER_PLACEMENT_ORDER,
        count = list2.indexOf('mode'),
        count2 = list2.indexOf('resolution'),
        value33 = enabled5 && value26 && count >= 0 && count2 >= 0 && count < count2,
        wrapUiSchemaPlacementControls2 = wrapUiSchemaPlacementControls(value26),
        wrapUiSchemaPlacementControls3 = wrapUiSchemaPlacementControls(value27),
        wrapUiSchemaPlacementControls4 = wrapUiSchemaPlacementControls(value28);
      el2.innerHTML =
        '\n          <div class="img-model-pills">\n            <div class="img-model-wrap">\n              ' +
        renderNodeModelTrigger({ iconHtml: iconHtml, label: getDisplayModelName(model) }) +
        '\n              <div class="floating-menu img-model-menu node-model-menu" data-node-menu-kind="video" data-lazy-model-menu="video"></div>\n            </div>\n            ' +
        (enabled4
          ? '<button type="button" class="img-pill-btn" data-video-model-unavailable="true" disabled aria-disabled="true" title="' +
            videoPanelText('modelUnavailable') +
            '">' +
            videoPanelText('modelUnavailable') +
            '</button>'
          : '') +
        '\n            ' +
        (enabled2 ? '' : wrapUiSchemaPlacementControls4) +
        '\n            ' +
        (enabled2 || value11 ? '' : value33 ? wrapUiSchemaPlacementControls2 : '') +
        '\n            ' +
        (enabled2 || value11 ? '' : hasRunningHubVideoWorkflowUiPlacement2 && value24 ? value24 : '') +
        '\n            ' +
        (enabled2 || value11
          ? ''
          : value25
            ? wrapUiSchemaPlacementControls(value25)
            : !hasRunningHubVideoWorkflowUiPlacement2 && value27
              ? wrapUiSchemaPlacementControls3
              : value19
                ? '<div class="img-ratio-wrap"' +
                  (value17.ratio ? '' : ' hidden') +
                  '>\n              <button type="button" class="img-pill-btn img-ratio-btn">\n                <span class="img-ratio-icon-slot">' +
                  value31 +
                  '</span>\n                <span class="img-ratio-label">' +
                  formatVideoRatioResolutionLabel2 +
                  '</span>\n              </button>\n              <div class="img-ratio-popup">\n                ' +
                  value32 +
                  '\n              </div>\n            </div>'
                : '') +
        '\n            ' +
        (enabled2 || value11 || enabled4
          ? ''
          : enabled5
            ? value33
              ? ''
              : value26
                ? wrapUiSchemaPlacementControls2
                : ''
            : value19
              ? '<div class="vid-mode-wrap"' +
                (value17.mode ? '' : ' hidden') +
                '>\n              <button type="button" class="img-pill-btn vid-mode-btn">\n                <span class="vid-mode-label">' +
                getVideoModeLabel(this._data.mode) +
                '</span>\n              </button>\n              <div class="floating-menu vid-mode-menu">\n                <div class="floating-menu-item video-mode-item ' +
                (!this._data.mode || this._data.mode === VIDEO_MODE_ALL_REFERENCE_VALUE
                  ? 'active'
                  : '') +
                '" data-value="' +
                VIDEO_MODE_ALL_REFERENCE_VALUE +
                '">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>\n                  <span class="floating-menu-label">' +
                videoPanelText('mode.allReference') +
                '</span>\n                </div>\n                <div class="floating-menu-item video-mode-item ' +
                (this._data.mode === VIDEO_MODE_FIRST_LAST_VALUE ? 'active' : '') +
                '" data-value="' +
                VIDEO_MODE_FIRST_LAST_VALUE +
                '">\n                  <svg class="video-mode-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 17h10"/></svg>\n                  <span class="floating-menu-label">' +
                videoPanelText('mode.firstLastFrame') +
                '</span>\n                </div>\n              </div>\n            </div>'
              : '') +
        '\n            ' +
        (value19
          ? '<div class="vid-duration-wrap"' +
            (value17.duration ? '' : ' hidden') +
            '>\n              <button type="button" class="img-pill-btn vid-duration-btn">\n                <span class="vid-duration-label">' +
            (this._data.duration || '5') +
            'S</span>\n              </button>\n              <div class="floating-menu vid-duration-pop">\n                <div class="vid-duration-title">' +
            videoPanelText('duration') +
            '</div>\n                <input type="range" class="vid-duration-slider" min="4" max="15" step="1" value="' +
            (this._data.duration || 5) +
            '">\n                <div class="vid-duration-bounds">\n                  <span class="vid-duration-min">4S</span>\n                  <span class="vid-duration-max">15S</span>\n                </div>\n              </div>\n            </div>'
          : '') +
        '\n          </div>\n          <div class="prompt-actions">\n            <button type="button" class="img-pill-btn rh-adv2-btn advanced-settings-icon-button" data-tooltip="' +
        videoPanelText('advancedSettings') +
        '" aria-label="' +
        videoPanelText('advancedSettings') +
        '" aria-expanded="false"' +
        (value29 ? '' : ' hidden') +
        '>' +
        ADVANCED_SETTINGS_TUNE_ICON_MARKUP +
        '</button>\n            <div class="ui-schema-placement ui-schema-instance-slot"' +
        (value21 && value22 ? '' : ' hidden') +
        '>\n              ' +
        value22 +
        '\n            </div>\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
        videoPanelText('debugApiParams') +
        '">\n              ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n            </button>\n                  <button type="button" class="prompt-submit img-gen-btn" ' +
        (enabled4
          ? 'disabled aria-disabled="true" title="' +
            videoPanelText('modelUnavailable') +
            '"'
          : enabled3
            ? 'data-tooltip="' + getVideoCancelTooltip() + '"'
            : 'title="' + getVideoGenerateTitle() + '"') +
        '>\n                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n                  </button>\n          </div>';
      const value34 = value30
        ? '\n          <div class="rh-vram-adv-panel">\n            ' +
          value30 +
          '\n          </div>\n        '
        : '';
      value10 && this._decorateDreaminaFooter(el2, value10);
      if (value34) el2.insertAdjacentHTML('beforeend', value34);
      ((this.rhVramAdvPanelEl = el2.querySelector('.rh-vram-adv-panel')),
        this._uiSchemaCleanup?.(),
        (this._uiSchemaCleanup = value10
          ? bindUiSchemaFieldControls(el2, {
              getNodeData: () =>
                decorateSegmentRetakeParameterNodeData(
                  this._getDreaminaEffectiveNodeData(
                    store.getState?.().nodes?.[this.nodeId] || this._data || {},
                  ),
                ),
              commitFieldValue: (value35, value36, value37) =>
                this._commitDreaminaSchemaField(value35, value36, value37),
            })
          : bindModelUiSchemaControls(el2, {
              nodeId: this.nodeId,
              nodeData: this._data,
              store: store,
              decorateNodeData: (value38) =>
                decorateSegmentRetakeParameterNodeData(this._getRhVideoAdvancedSchemaNodeData(value38)),
              buildPatch: (latest, value39, value40, value41) => {
                const fieldId = String(value39 || '').trim(),
                  nodes = store.getState?.() || {},
                  remove = getManifestInputPolicyEdgeIdsToRemove({
                    latest: latest,
                    fieldId: fieldId,
                    value: value40,
                    inEdges: store.getIncomingEdges?.(this.nodeId) || [],
                    nodes: nodes.nodes || {},
                  }),
                  list3 = Array.isArray(remove) ? remove : [];
                if (list3.length > 0) {
                  const run = () => {
                    list3.forEach((value42) => store.removeEdge?.(value42));
                  };
                  if (typeof store.batch === 'function') store.batch(run);
                  else run();
                }
                return {
                  ...buildRhWorkflowFieldPatch(latest, value39, value40, value41),
                  ...this._buildModelApiAspectRatioDisplayPatch(
                    latest,
                    value39,
                    value40,
                    value41,
                  ),
                  ...this._buildRunningHubWorkflowAspectRatioDisplayPatch(
                    latest,
                    value39,
                    value40,
                    value41,
                  ),
                };
              },
              afterCommit: (value43, value44, value45) => {
                const value46 = String(value43 || '').trim(),
                  panelModelManifest2 = getPanelModelManifest(value45),
                  manifestHelpVariantsReferenceField2 = manifestHelpVariantsReferenceField(panelModelManifest2, value46),
                  manifestPromptVariantsReferenceField2 = manifestPromptVariantsReferenceField(panelModelManifest2, value46),
                  manifestFixedSlotVisibilityReferencesField2 = manifestFixedSlotVisibilityReferencesField(panelModelManifest2, value46);
                (manifestHelpVariantsReferenceField2 || manifestPromptVariantsReferenceField2 || manifestFixedSlotVisibilityReferencesField2) &&
                  ((this._data = { ...(this._data || {}), ...(value45 || {}) }),
                  manifestHelpVariantsReferenceField2 && this._syncGenerationNodeHelpTip?.(),
                  manifestPromptVariantsReferenceField2 && this._syncDreaminaPromptPlaceholder?.(this._data),
                  manifestFixedSlotVisibilityReferencesField2 && this._renderRefBar?.(),
                  this._updateSubmitButtonState?.());
              },
            })),
        value9 &&
          value29 &&
          this.rhVramAdvPanelEl &&
          this.rhVramAdvPanelEl.classList.add('show'),
        syncNodeFooterAdvancedButtonState(el2),
        (this.btnEl = el2.querySelector('.img-gen-btn')),
        this._bindFooterEvents(el2));
    }
    ['_ensureVideoAdvancedPanel'](el4) {
      if (!el4) return null;
      const el5 =
          (this.rhVramAdvPanelEl &&
          (typeof el4.contains !== 'function' || el4.contains(this.rhVramAdvPanelEl))
            ? this.rhVramAdvPanelEl
            : null) || el4.querySelector?.('.rh-vram-adv-panel'),
        value47 = store.getState?.().nodes?.[this.nodeId] || this._data || {};
      if (!this._hasVisibleVideoAdvancedControls(value47))
        return (
          el5?.classList?.remove('show', RH_AI_APP_PERSISTENT_ADVANCED_CLASS),
          syncNodeFooterAdvancedButtonState(el4),
          null
        );
      if (el5) return ((this.rhVramAdvPanelEl = el5), el5);
      const value48 = this._renderVideoAdvancedControlsHtml(value47);
      return (
        el4.insertAdjacentHTML?.(
          'beforeend',
          '\n          <div class="rh-vram-adv-panel">\n            ' +
            value48 +
            '\n          </div>\n        ',
        ),
        (this.rhVramAdvPanelEl = el4.querySelector?.('.rh-vram-adv-panel') || null),
        this.rhVramAdvPanelEl
      );
    }
    ['_runVipRetryOnce'](handler) {
      let value49 = false;
      return () => {
        if (value49) return;
        ((value49 = true), (this._vipSelectionRetryInProgress = true));
        try {
          handler();
        } finally {
          this._vipSelectionRetryInProgress = false;
        }
      };
    }
    ['_guardVipSelection'](value50, value51 = null, value52 = null) {
      const modelId = String(value50 || '');
      let provider = '',
        onSuccess = value52;
      typeof value51 === 'function'
        ? (onSuccess = value51)
        : (provider = String(value51 || '').trim());
      if (!isVideoVipModel(modelId, provider)) return true;
      const run2 = window.isModelAllowedBySubscription,
        value53 = typeof run2 === 'function' ? run2(modelId, provider) : true;
      if (value53) return true;
      if (this._vipSelectionRetryInProgress) return false;
      return (
        typeof window.openSubscriptionDialog === 'function'
          ? window.openSubscriptionDialog({
              modelId: modelId,
              provider: provider,
              onSuccess: onSuccess,
            })
          : window.showToast?.(videoPanelText('vipRequired'), 'warn'),
        false
      );
    }
    ['_bindFooterEvents'](el6) {
      this._footerControllerCleanup?.();
      const trigger = el6.querySelector('.img-model-btn-trigger'),
        menu = el6.querySelector('.img-model-menu'),
        value54 = {
          listenConfigChanges: false,
          getProviderProfileId: () => {
            const value55 = store.getState?.()?.nodes?.[this.nodeId] || this._data || {};
            return value55.providerProfileId || value55.rhProviderProfileId || '';
          },
        };
      (this._modelCredentialMenuCleanup?.(),
        (this._modelCredentialMenuCleanup = bindModelCredentialMenu(menu, value54)));
      const el7 = el6.querySelector('.dreamina-task-model-btn'),
        el8 = el6.querySelector('.dreamina-task-model-menu'),
        el9 = el6.querySelector('.img-ratio-btn:not([data-ui-schema-menu-trigger])'),
        fallbackPopup = el6.querySelector('.img-ratio-popup'),
        fallbackLabel = el6.querySelector('.img-ratio-label'),
        fallbackIconSlot = el6.querySelector('.img-ratio-icon-slot'),
        value56 = el6.querySelector('.vid-mode-btn'),
        el10 = el6.querySelector('.vid-mode-menu'),
        el11 = el6.querySelector('.vid-mode-label'),
        value57 = el6.querySelector('.vid-duration-btn'),
        el12 = el6.querySelector('.vid-duration-pop'),
        el13 = el6.querySelector('.vid-duration-slider'),
        el14 = el6.querySelector('.vid-duration-label'),
        el15 = el6.querySelector('.rh-adv2-btn'),
        handler2 = () => this._ensureVideoAdvancedPanel(el6),
        handler3 = () => {
          fallbackPopup?.classList.remove('show');
        },
        handler4 = () => {
          el12?.classList.remove('show');
        },
        enabled6 = this._isDreaminaVideoNode(this._data),
        decorateSegmentRetakeParameterNodeData4 = decorateSegmentRetakeParameterNodeData(
          enabled6
            ? this._getDreaminaEffectiveNodeData(this._data)
            : this._getRhVideoAdvancedSchemaNodeData(this._data),
        );
      syncModelUiSchemaControls(el6, decorateSegmentRetakeParameterNodeData4);
      const run3 = (payload2) => {
          const nodeData = store.getState().nodes?.[this.nodeId] || this._data || {},
            { payload: payload3, displayPatch: displayPatch = {} } = buildGenerationModelSelectionPayload({
              payload: payload2,
              store: store,
              nodeId: this.nodeId,
              nodeData: nodeData,
              fallbackNodeData: this._data,
              minSide: getAIGenerationNodeSize().width,
              inputKinds: ['image', 'video'],
              resultMediaElement: this.videoEl,
              resultFields: VIDEO_DISPLAY_RATIO_RESULT_FIELDS,
            });
          Object.keys(displayPatch).length > 0 &&
            applyImageSchemaRatioResizeAnimation(this, {
              nodeId: this.nodeId,
              previewEl: this.previewEl,
              nodeData: nodeData,
              patch: displayPatch,
            });
          const value58 = {
            ...(store.getState().nodes?.[this.nodeId] || this._data || {}),
            ...payload3,
          };
          return (
            store.updateNodeData(this.nodeId, payload3),
            (this._data = value58),
            rememberSegmentRetakeModelSelection(nodeData, value58.model),
            (this._lastFooterSig = ''),
            this._renderFooter(el6),
            value58
          );
        },
        handler5 = () => store.getState().nodes?.[this.nodeId] || this._data || {},
        handler6 = ({
          model: model2,
          provider: provider2,
          useRememberedRouteModel: useRememberedRouteModel = false,
        } = {}) => {
          const enabled7 = String(model2 || '').trim();
          if (!enabled7) return null;
          const value59 = handler5(),
            value60 = this._getDreaminaEffectiveNodeData(value59),
            value61 = this._syncDreaminaTaskState(value59, { syncStore: false }),
            aspectRatio = value61?.nodeData || value60 || value59,
            provider3 = resolveDreaminaStyleVideoProvider(
              enabled7,
              provider2 || aspectRatio?.provider || 'dreamina',
            ),
            taskType =
              value61?.resolvedTaskType ||
              this._getResolvedDreaminaTaskType(aspectRatio, value61?.summary),
            routeMode =
              value61?.routeMode ||
              normalizeDreaminaVideoRouteMode(aspectRatio?.dreaminaRouteMode, aspectRatio?.mode),
            list4 = value59?.segmentRetake
              ? getDreaminaTaskModelMenuItems(taskType, provider3, {
                  allowedModelIds: getSegmentRetakeAllowedModelIdsForNode(value59),
                })
              : [],
            value62 = list4.some((value63) => value63.model === enabled7)
              ? enabled7
              : list4[0]?.model || enabled7,
            fallbackModel = ensureDreaminaStyleVideoModelForTask(taskType, value62, provider3) || value62,
            model3 = list4.length
              ? value62
              : useRememberedRouteModel
                ? resolveDreaminaRememberedRouteModel(aspectRatio, {
                    provider: provider3,
                    routeMode: routeMode,
                    taskType: taskType,
                    fallbackModel: fallbackModel,
                  }) || fallbackModel
                : fallbackModel,
            resolution = normalizeDreaminaStyleVideoResolution(
              taskType,
              model3,
              aspectRatio?.resolution || aspectRatio?.videoSize,
              provider3,
            ),
            duration = normalizeDreaminaStyleVideoDuration(
              taskType,
              model3,
              aspectRatio?.duration,
              provider3,
            ),
            args5 = { provider: provider3, model: model3 };
          return run3({
            ...args5,
            ...this._buildDreaminaModelSelectionParamPatch(aspectRatio, {
              model: model3,
              provider: provider3,
              taskType: taskType,
              fallbackValues: {
                dreaminaRouteMode: routeMode,
                aspectRatio: aspectRatio?.aspectRatio,
                ...(resolution ? { resolution: resolution } : {}),
                duration: duration,
              },
            }),
          });
        },
        bindLazyVideoModelMenu2 = bindLazyVideoModelMenu({
          trigger: trigger,
          menu: menu,
          getActiveModel: () =>
            String(handler5()?.model || this._data?.model || '').trim() ||
            getDefaultVideoModelId(),
          renderMenuHtml: (value64) => this._buildVideoModelMenuHtml(value64),
          onPrepared: (value65) => {
            void syncModelCredentialMenu(value65, value54);
          },
        });
      trigger &&
        menu &&
        trigger.addEventListener('click', (event) => {
          event.stopPropagation();
          const el16 = bindLazyVideoModelMenu2.prepareNow();
          if (!el16) return;
          const value66 = !el16.classList.contains('show');
          (closeNodeFooterMenus(el6, menu),
            el8?.classList.remove('show'),
            el16.classList.toggle('show', value66));
          if (value66) activateMenuKeyboard(el16);
        });
      el9 &&
        fallbackPopup &&
        bindVideoPanelClick(el9, 'ratio-trigger', (event2) => {
          event2.stopPropagation();
          if (el9.disabled || !String(fallbackPopup.innerHTML || '').trim()) return;
          (fallbackPopup.classList.toggle('show'),
            menu.classList.remove('show'),
            el8?.classList.remove('show'));
          if (el10) el10.classList.remove('show');
          (handler4(), handler2()?.classList.remove('show'));
        });
      el7 &&
        el8 &&
        bindVideoPanelClick(el7, 'dreamina-task-model-trigger', (event3) => {
          event3.stopPropagation();
          if (el7.disabled) return;
          (el8.classList.toggle('show'), menu.classList.remove('show'), handler3());
          if (el10) el10.classList.remove('show');
          (handler4(),
            handler2()?.classList.remove('show'),
            el8.classList.contains('show') && activateMenuKeyboard(el8));
        });
      value56 &&
        el10 &&
        bindVideoPanelClick(value56, 'mode-trigger', (event4) => {
          (event4.stopPropagation(),
            el10.classList.toggle('show'),
            menu.classList.remove('show'),
            el8?.classList.remove('show'),
            handler3(),
            handler4(),
            handler2()?.classList.remove('show'),
            el10.classList.contains('show') && activateMenuKeyboard(el10));
        });
      value57 &&
        el12 &&
        bindVideoPanelClick(value57, 'duration-trigger', (event5) => {
          (event5.stopPropagation(),
            el12.classList.toggle('show'),
            menu.classList.remove('show'),
            el8?.classList.remove('show'),
            handler3());
          if (el10) el10.classList.remove('show');
          handler2()?.classList.remove('show');
        });
      const run4 = () => {
        closeNodeFooterMenus(el6);
      };
      (menu?.addEventListener('click', (event6) => {
        event6.stopPropagation();
        const providerProfileId = event6.target?.closest?.('.floating-menu-item');
        if (!providerProfileId || !menu.contains(providerProfileId)) return;
        if (providerProfileId.hasAttribute('data-node-menu-submenu')) return;
        if (providerProfileId.closest('.apimart-video-submenu')) {
          const model4 = providerProfileId.dataset.value || APIMART_DREAMINA_VIDEO_DEFAULT_MODEL;
          if (isApimartDreaminaVideoModel(model4, 'apimart')) {
            handler6({ model: model4, provider: 'apimart', useRememberedRouteModel: true });
            return;
          }
        }
        if (providerProfileId.closest('.runninghub-submenu')) {
          if (providerProfileId.dataset.disabled === 'true') {
            (window.showToast?.(videoPanelText('videoGenerationUnavailable'), 'warn'), run4());
            return;
          }
          const model5 = providerProfileId.dataset.value;
          if (!model5) return;
          const value67 = this._runVipRetryOnce(() => providerProfileId.click());
          if (!this._guardVipSelection(model5, value67)) {
            run4();
            return;
          }
          const provider4 = providerProfileId.dataset.provider || null,
            value68 = store.getState().nodes?.[this.nodeId] || {},
            value69 = {
              model: model5,
              provider: provider4,
              providerProfileId: providerProfileId.dataset.credentialResolvedProviderProfileId || undefined,
            };
          if (this._isRunninghubWorkflowModel(model5, provider4))
            Object.assign(
              value69,
              buildVideoWorkflowModelSelectionPatch(value68, model5, {
                preserveMaskTouchedState: true,
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            );
          else {
            const modelExecution = resolveModelExecution(model5, { providerHint: provider4 });
            modelExecution?.modelManifest?.kind === 'video' &&
              modelExecution?.modelManifest?.adapterType === 'modelApi' &&
              Object.assign(
                value69,
                buildVideoModelApiModelSelectionPatch(
                  value68,
                  modelExecution.canonicalModelId || model5,
                  provider4 || modelExecution?.modelManifest?.provider || null,
                  value69,
                ),
              );
          }
          run3(value69);
          return;
        }
        if (providerProfileId.dataset.disabled === 'true') {
          (window.showToast?.(videoPanelText('videoGenerationUnavailable'), 'warn'), run4());
          return;
        }
        const model6 = providerProfileId.dataset.value;
        if (!model6) return;
        const value70 = providerProfileId.dataset.provider || 'dreamina';
        if (isDreaminaStyleVideoModel(model6, value70)) {
          const provider5 = resolveDreaminaStyleVideoProvider(model6, value70),
            value71 = this._runVipRetryOnce(() => providerProfileId.click());
          if (!this._guardVipSelection(model6, provider5, value71)) {
            run4();
            return;
          }
          handler6({ model: model6, provider: provider5, useRememberedRouteModel: true });
          return;
        }
        const value72 = this._runVipRetryOnce(() => providerProfileId.click());
        if (!this._guardVipSelection(model6, value72)) {
          run4();
          return;
        }
        const providerHint = { model: model6 };
        providerHint.provider = providerProfileId.dataset.provider || null;
        const value73 = store.getState().nodes?.[this.nodeId] || {};
        if (this._isRunninghubWorkflowModel(model6, providerHint.provider))
          Object.assign(
            providerHint,
            buildVideoWorkflowModelSelectionPatch(value73, model6, {
              v54FpsOptions: getRhV54FpsOptions(),
            }),
          );
        else {
          const modelExecution2 = resolveModelExecution(model6, { providerHint: providerHint.provider });
          modelExecution2?.modelManifest?.kind === 'video' &&
            modelExecution2?.modelManifest?.adapterType === 'modelApi' &&
            Object.assign(
              providerHint,
              buildVideoModelApiModelSelectionPatch(
                value73,
                modelExecution2.canonicalModelId || model6,
                providerHint.provider || modelExecution2?.modelManifest?.provider || null,
                providerHint,
              ),
            );
        }
        (model6.includes('seedance') &&
          (!this._data.resolution || this._data.resolution !== '720p') &&
          (providerHint.resolution = '720p'),
          run3(providerHint));
      }),
        el8?.querySelectorAll('.floating-menu-item').forEach((el17) =>
          bindVideoPanelClick(el17, 'dreamina-task-model-item', () => {
            if (el17.dataset.disabled === 'true') {
              (window.showToast?.(videoPanelText('smartMultiframeUnavailable'), 'warn'),
                el8.classList.remove('show'));
              return;
            }
            const model7 = String(el17.dataset.value || '').trim();
            if (!model7) return;
            const provider6 = resolveDreaminaStyleVideoProvider(
                model7,
                el17.dataset.provider || this._data?.provider || 'dreamina',
              ),
              value74 = this._runVipRetryOnce(() => el17.click());
            if (!this._guardVipSelection(model7, provider6, value74)) {
              el8.classList.remove('show');
              return;
            }
            handler6({ model: model7, provider: provider6, useRememberedRouteModel: false });
          }),
        ));
      if (el15) {
        bindVideoPanelClick(el15, 'rh-advanced-trigger', (event7) => {
          event7.stopPropagation();
          const el18 = handler2();
          if (!el18) return;
          const value75 = !el18.classList.contains('show');
          el18.classList.toggle('show', value75);
          if (value75) positionNodeAdvancedPanel(el18);
          (el15.setAttribute?.('aria-expanded', String(value75)),
            menu.classList.remove('show'),
            handler3());
          if (el10) el10.classList.remove('show');
          handler4();
        });
        const value76 = handler2();
        value76 &&
          bindVideoPanelClick(value76, 'rh-advanced-panel-stop', (event8) =>
            event8.stopPropagation(),
          );
      }
      el10 &&
        el11 &&
        el10.querySelectorAll('.floating-menu-item').forEach((el19) =>
          bindVideoPanelClick(el19, 'mode-item', () => {
            if (enabled6) {
              const dreaminaVideoRouteMode = normalizeDreaminaVideoRouteMode(
                el19.dataset.routeMode || el19.dataset.value,
              );
              if (!dreaminaVideoRouteMode) return;
              (this._commitDreaminaRouteMode(dreaminaVideoRouteMode, this._data),
                el10.classList.remove('show'));
              return;
            }
            const mode = el19.dataset.value;
            (store.updateNodeData(this.nodeId, { mode: mode }),
              (el11.textContent = getVideoModeLabel(mode)),
              el10.classList.remove('show'),
              el10.querySelectorAll('.floating-menu-item').forEach((el20) =>
                el20.classList.toggle('active', el20 === el19),
              ));
          }),
        );
      if (enabled6 && el10) {
        const value77 = () => {
          const dreaminaTransitionPrompts = [];
          el10.querySelectorAll('.dreamina-transition-prompt').forEach((el21) => {
            const value78 = Number(el21.dataset.index);
            Number.isFinite(value78) && (dreaminaTransitionPrompts[value78] = el21.value);
          });
          const dreaminaTransitionDurations = [];
          (el10.querySelectorAll('.dreamina-transition-duration').forEach((el22) => {
            const value79 = Number(el22.dataset.index);
            Number.isFinite(value79) && (dreaminaTransitionDurations[value79] = el22.value);
          }),
            store.updateNodeData(this.nodeId, {
              dreaminaTransitionPrompts: dreaminaTransitionPrompts,
              dreaminaTransitionDurations: dreaminaTransitionDurations,
            }));
        };
        (el10.querySelectorAll('.dreamina-transition-prompt').forEach((el23) => {
          (el23.addEventListener('input', value77),
            el23.addEventListener('click', (event9) => event9.stopPropagation()));
        }),
          el10.querySelectorAll('.dreamina-transition-duration').forEach((el24) => {
            (el24.addEventListener('input', value77),
              el24.addEventListener('change', value77),
              el24.addEventListener('click', (event10) => event10.stopPropagation()));
          }));
      }
      el13 &&
        el14 &&
        bindVideoPanelInput(el13, 'duration-slider', () => {
          if (enabled6) {
            const value80 = this._syncDreaminaTaskState(this._data, { syncStore: false }),
              value81 = value80?.resolvedTaskType || this._getResolvedDreaminaTaskType(),
              dreaminaStyleVideoProvider = resolveDreaminaStyleVideoProvider(
                this._data?.model,
                this._data?.provider,
              ),
              dreaminaStyleVideoModelForTask = ensureDreaminaStyleVideoModelForTask(
                value81,
                this._data?.model,
                dreaminaStyleVideoProvider,
              ),
              duration2 = normalizeDreaminaStyleVideoDuration(
                value81,
                dreaminaStyleVideoModelForTask,
                el13.value,
                dreaminaStyleVideoProvider,
              );
            ((el14.textContent = duration2 + 'S'),
              this._commitDreaminaParamValues({ duration: duration2 }, this._data));
            return;
          }
          const value82 = el13.value;
          ((el14.textContent = value82 + 'S'),
            store.updateNodeData(this.nodeId, { duration: parseInt(value82, 10) }));
        });
      fallbackLabel &&
        fallbackPopup?.querySelectorAll('.img-rp-quality-item').forEach((resolution2) =>
          bindVideoPanelClick(resolution2, 'ratio-quality-item', () => {
            if (resolution2.hasAttribute('disabled')) return;
            if (resolution2.closest('[data-ui-schema-field]')) return;
            if (enabled6 && resolution2.dataset.dreaminaKind === 'resolution') {
              const resolution3 = String(resolution2.dataset.value || '').trim();
              if (!resolution3) return;
              this._commitDreaminaParamValues({ resolution: resolution3 }, this._data);
              const value83 = {
                  ...this._getDreaminaEffectiveNodeData(
                    store.getState().nodes?.[this.nodeId] || this._data || {},
                  ),
                },
                value84 = this._getDreaminaRatioDisplayState(value83);
              fallbackLabel.textContent =
                value84?.ratioLabelText ||
                formatVideoRatioResolutionLabel(value83.aspectRatio || '1:1', resolution3);
              fallbackIconSlot &&
                (fallbackIconSlot.innerHTML = this._getRatioIconHTML(
                  value84?.ratioIconLabel || value83.aspectRatio || '1:1',
                ));
              const el25 = resolution2.parentElement;
              (el25?.querySelectorAll('.img-rp-quality-item').forEach((el26) =>
                el26.classList.remove('active'),
              ),
                resolution2.classList.add('active'));
              return;
            }
            (store.updateNodeData(this.nodeId, { resolution: resolution2.dataset.value }),
              (fallbackLabel.textContent = formatVideoRatioResolutionLabel(
                this._data.aspectRatio,
                resolution2.dataset.value,
              )));
            const el27 = resolution2.parentElement;
            (el27?.querySelectorAll('.img-rp-quality-item').forEach((el28) =>
              el28.classList.remove('active'),
            ),
              resolution2.classList.add('active'));
          }),
        );
      const run5 = (value85) => {
          const enabled8 = String(value85 || '').trim();
          if (!enabled8 || enabled8 === '自适应') return { w: 1, h: 1, label: '自适应' };
          const label = enabled8.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
          if (!label) return null;
          return {
            w: parseFloat(label[1]),
            h: parseFloat(label[2]),
            label: label[1] + ':' + label[2],
          };
        },
        handler7 = (value86 = '', enabled9 = false) => {
          const value87 = String(value86 || '').trim(),
            value88 = !!enabled9 || value87 === '自适应';
          el6.querySelectorAll(
            '.img-rp-ratio-item:not([data-ui-schema-value]),.img-rp-large-adaptive:not([data-ui-schema-value])',
          ).forEach((el29) => el29.classList.remove('active'));
          if (value88) {
            el6.querySelector('.img-rp-large-adaptive:not([data-ui-schema-value])')?.classList.add('active');
            return;
          }
          el6.querySelectorAll('.img-rp-ratio-item:not([data-ui-schema-value])').forEach(
            (el30) =>
              el30.classList.toggle(
                'active',
                String(el30.dataset.label || '').trim() === value87,
              ),
          );
        },
        handler8 = (value89, value90, aspectRatio2, value91 = {}) => {
          const value92 = value91?.persistAspectRatio !== false,
            enabled10 = value91?.forceManualDisplaySize === true,
            box = store.getState().nodes?.[this.nodeId] || this._data || {};
          if (!enabled10 && box?.[GENERATION_MANUAL_DISPLAY_SIZE_FIELD] === true) return;
          const width = box.width || this._data.width || 300,
            height = box.height || this._data.height || 300,
            box2 = getAIGenerationNodeSize(value89, value90),
            width2 = box2.width,
            height2 = box2.height,
            count3 = width2 - width,
            count4 = height2 - height;
          (count3 !== 0 || count4 !== 0) &&
            armImageSchemaRatioResizeAnimation(this, this.nodeId, GENERATION_RATIO_RESIZE_ANIMATION_MS);
          const args6 = {
            width: width2,
            height: height2,
            x: Math.round((box.x ?? this._data.x ?? 0) - count3 / 2),
            y: Math.round((box.y ?? this._data.y ?? 0) - count4),
          };
          enabled10 && (args6[GENERATION_MANUAL_DISPLAY_SIZE_FIELD] = false);
          value92 &&
            (this._isDreaminaVideoNode(this._data)
              ? Object.assign(
                  args6,
                  this._buildDreaminaParamPatch(this._data, { aspectRatio: aspectRatio2 }),
                )
              : (args6.aspectRatio = aspectRatio2));
          store.updateNodeData(this.nodeId, args6);
          const value93 = store.getState().nodes?.[this.nodeId] || {
            ...box,
            ...args6,
          };
          this._data = value93;
          const value94 = this._getDreaminaRatioDisplayState(value93),
            footer = this.footerEl || el6,
            labelText =
              value94?.ratioLabelText ||
              formatVideoRatioResolutionLabel(aspectRatio2, value93.resolution || '1080p'),
            iconHtml2 = this._getRatioIconHTML(value94?.ratioIconLabel || aspectRatio2);
          (syncLegacyVideoRatioFooter({
            footer: footer,
            fallbackLabel: fallbackLabel,
            fallbackIconSlot: fallbackIconSlot,
            labelText: labelText,
            iconHtml: iconHtml2,
          }),
            restoreLegacyVideoRatioPopupAfterSync({ footer: footer, fallbackPopup: fallbackPopup }),
            animateImageSchemaRatioResizeFlip(this, {
              nodeId: this.nodeId,
              previewEl: this.previewEl,
              nodeData: { width: width, height: height },
              patch: { width: width2, height: height2 },
              ms: GENERATION_RATIO_RESIZE_ANIMATION_MS,
              deferStart: false,
            }));
        },
        handler9 = (value95, value96 = {}) => {
          const enabled11 = run5(value95);
          if (!enabled11) return;
          (handler8(enabled11.w, enabled11.h, enabled11.label, value96),
            handler7(enabled11.label, false));
        };
      !enabled6 &&
        el6.querySelectorAll('.img-rp-ratio-item:not([data-ui-schema-value])').forEach(
          (el31) =>
            bindVideoPanelClick(el31, 'ratio-item', () => {
              if (
                el31.hasAttribute('disabled') ||
                el31.classList.contains('disabled') ||
                el31.getAttribute('aria-disabled') === 'true'
              )
                return;
              handler9(el31.dataset.label, { forceManualDisplaySize: true });
            }),
        );
      const run6 = (options3 = {}) => {
        const nodes2 = store.getState(),
          nodeData2 = nodes2.nodes?.[this.nodeId],
          value97 = String(nodeData2?.model || ''),
          adaptivePolicy = getRunningHubVideoParameterPanelPolicy(value97).adaptiveRatio || {};
        let inEdges = store.getIncomingEdges(this.nodeId);
        adaptivePolicy.scopeTargetEdges === true &&
          (inEdges = inEdges.filter((value98) => value98?.targetId === this.nodeId));
        inEdges = inEdges.filter((value99) => {
          const list5 = String(value99?.refSlot || '').toLowerCase();
          if (list5.includes('mask')) return false;
          const effectiveInputKind = resolveEffectiveInputKind(
            nodes2.nodes?.[value99?.sourceId],
            value99,
          );
          return effectiveInputKind === 'image' || effectiveInputKind === 'video';
        });
        const run7 = (value100, value101) => {
          const count5 = Number(value100),
            count6 = Number(value101);
          if (!(Number.isFinite(count5) && count5 > 0)) return false;
          if (!(Number.isFinite(count6) && count6 > 0)) return false;
          return (handler8(count5, count6, '自适应', options3), true);
        };
        if (inEdges.length > 0) {
          const videoAdaptiveRatioSource = resolveVideoAdaptiveRatioSource({
            inEdges: inEdges,
            nodes: nodes2.nodes,
            nodeData: nodeData2,
            adaptivePolicy: adaptivePolicy,
          });
          if (videoAdaptiveRatioSource.fallbackSquare) {
            handler8(1, 1, '自适应', options3);
            return;
          }
          const edge = videoAdaptiveRatioSource.edge;
          if (!edge) return;
          const nodeId = edge.sourceId,
            nodeData3 = nodes2.nodes[nodeId],
            box3 = getGenerationRatioSizeWithDom({
              nodeId: nodeId,
              nodeData: nodeData3,
              edge: edge,
              includeNodeFrame: true,
            });
          if (run7(box3?.width, box3?.height)) return;
          const value102 = String(nodeData3?.type || ''),
            value103 = value102 === 'ai-video' || value102 === 'source-video' || value102 === 'video';
          if (value103) {
            const value104 = getDisplayedMediaSizeFromNode(nodeId, 'video'),
              value105 = Number(value104?.w || 0),
              value106 = Number(value104?.h || 0);
            if (run7(value105, value106)) return;
            const value107 = Number(edge?.sourceMediaW || 0),
              value108 = Number(edge?.sourceMediaH || 0);
            if (run7(value107, value108)) return;
            const value109 = Number(nodeData3?.mainVideoIndex),
              value110 = Number.isFinite(value109) ? Math.max(0, Math.trunc(value109)) : 0,
              list6 = Array.isArray(nodeData3?.videos) ? nodeData3.videos : [];
            let value111 = value110;
            const value112 = String(edge?.sourceMediaKey || '').trim();
            if (value112 && list6.length) {
              const count7 = list6.findIndex((value113) => {
                const value114 =
                  String(value113?.localPath || '').trim() ||
                  String(value113?.videoUrl || '').trim();
                return value114 === value112;
              });
              if (count7 >= 0) value111 = count7;
            }
            const value115 = list6[value111],
              value116 = Number(value115?.videoWidth || 0),
              value117 = Number(value115?.videoHeight || 0);
            if (run7(value116, value117)) return;
            const value118 = Number(nodeData3?.selectedVideoWidth || 0),
              value119 = Number(nodeData3?.selectedVideoHeight || 0);
            if (run7(value118, value119)) return;
            const value120 = ++this._adaptiveSrcRetryToken;
            (setTimeout(() => {
              if (value120 !== this._adaptiveSrcRetryToken) return;
              const enabled12 = store.getState().nodes?.[this.nodeId];
              if (!enabled12) return;
              const value121 = this._getDreaminaEffectiveNodeData(enabled12);
              if (String(value121.aspectRatio || '自适应') !== '自适应') return;
              const value122 = store.getState().nodes?.[nodeId];
              if (value122) {
                const value123 = Number(edge?.sourceMediaW || 0),
                  value124 = Number(edge?.sourceMediaH || 0);
                if (run7(value123, value124)) return;
                const value125 = Number(value122.mainVideoIndex),
                  value126 = Number.isFinite(value125)
                    ? Math.max(0, Math.trunc(value125))
                    : 0,
                  list7 = Array.isArray(value122.videos) ? value122.videos : [];
                let value127 = value126;
                const value128 = String(edge?.sourceMediaKey || '').trim();
                if (value128 && list7.length) {
                  const count8 = list7.findIndex((value129) => {
                    const value130 =
                      String(value129?.localPath || '').trim() ||
                      String(value129?.videoUrl || '').trim();
                    return value130 === value128;
                  });
                  if (count8 >= 0) value127 = count8;
                }
                const value131 = list7[value127],
                  value132 = Number(value131?.videoWidth || 0),
                  value133 = Number(value131?.videoHeight || 0);
                if (run7(value132, value133)) return;
                const value134 = Number(value122.selectedVideoWidth || 0),
                  value135 = Number(value122.selectedVideoHeight || 0);
                if (run7(value134, value135)) return;
              }
              const value136 = getDisplayedMediaSizeFromNode(nodeId, 'video'),
                count9 = Number(value136?.w || 0),
                count10 = Number(value136?.h || 0);
              if (count9 > 0 && count10 > 0) handler8(count9, count10, '自适应', options3);
            }, 160),
              handler8(1, 1, '自适应', options3));
            return;
          }
          const value137 = getDisplayedMediaSizeFromNode(nodeId, 'image'),
            value138 = Number(value137?.w || 0),
            value139 = Number(value137?.h || 0);
          if (run7(value138, value139)) return;
          if (nodeData3) {
            const value140 = Number(nodeData3.width || 0),
              value141 = Number(nodeData3.height || 0);
            if (run7(value140, value141)) return;
          }
          handler8(1, 1, '自适应', options3);
          return;
        }
        const value142 = Boolean(
          (nodeData2?.videos && nodeData2.videos.length) ||
          nodeData2?.localPath ||
          nodeData2?.thumbUrl ||
          nodeData2?.videoUrl ||
          nodeData2?.src,
        );
        if (value142) {
          const value143 = this.videoEl?.videoWidth || 0,
            value144 = this.videoEl?.videoHeight || 0;
          if (run7(value143, value144)) return;
          return;
        }
        handler8(1, 1, '自适应', options3);
      };
      ((this._runAdaptiveRatio = (options4 = {}) => {
        const value145 = store.getState().nodes?.[this.nodeId] || this._data || {},
          el32 = el6.querySelector('.img-rp-large-adaptive:not([data-ui-schema-value])');
        if (this._isDreaminaVideoNode(value145)) {
          (this._commitDreaminaSchemaAspectRatio('自适应', value145, options4),
            handler7('自适应', true),
            el32?.classList.add('active'));
          return;
        }
        (run6(options4), handler7('自适应', true), el32?.classList.add('active'));
      }),
        (this._applyStoredAspectRatio = () => {
          const value146 = store.getState().nodes?.[this.nodeId] || this._data || {},
            value147 = this._getDreaminaRatioDisplayState(value146),
            value148 = String(value147?.currentRatio || '').trim() || '自适应';
          if (value148 === '自适应') {
            this._runAdaptiveRatio?.();
            return;
          }
          handler9(value148, { persistAspectRatio: true });
        }),
        (this._applyDreaminaSchemaAspectRatio = (value149) => {
          const value150 = store.getState().nodes?.[this.nodeId] || this._data || {};
          this._commitDreaminaSchemaAspectRatio(value149, value150, { forceManualDisplaySize: true });
        }));
      const value151 = el6.querySelector('.img-rp-large-adaptive:not([data-ui-schema-value])');
      value151 &&
        !enabled6 &&
        bindVideoPanelClick(value151, 'adaptive-ratio', () =>
          this._runAdaptiveRatio({ forceManualDisplaySize: true }),
        );
      bindVideoPanelClick(this.btnEl, 'submit', () => {
        (flushPromptHtmlCommit(this), this._handleGenerateOrCancel());
      });
      const el33 = el6.querySelector('.debug-wrench-btn');
      el33?.addEventListener('click', (event11) => {
        event11.stopPropagation();
        if (globalThis.window?.DEV_MODE !== true) return;
        (flushPromptHtmlCommit(this),
          openDebugRequestWindow({
            prepare: async () => {
              const enabled13 = await this._buildPayload();
              if (!enabled13) throw new Error('请先填写提示词或连接参考素材。');
              try {
                return buildFinalApiDebugPreview(await api.buildGenerateVideoRequest(enabled13));
              } finally {
                releasePayloadObjectUrlLease(enabled13);
              }
            },
          }));
      });
      const run8 = bindNodeFooterController(el6, {
          onDocumentClick: (value152, { isInsideRoot: isInsideRoot }) => {
            const el34 = this.footerEl;
            if (!el34) return;
            if (isInsideRoot) closeNodeFooterMenus(el34);
            (el34.querySelector('.img-model-menu')?.classList.remove('show'),
              el34.querySelector('.dreamina-task-model-menu')?.classList.remove('show'));
            const el35 = el34.querySelector('.img-ratio-popup');
            (el35?.classList.remove('show'),
              el34.querySelector('.vid-mode-menu')?.classList.remove('show'));
            const el36 = el34.querySelector('.vid-duration-pop');
            el36?.classList.remove('show');
            const el37 = el34.querySelector('.rh-vram-adv-panel');
            (!el37?.classList?.contains?.(RH_AI_APP_PERSISTENT_ADVANCED_CLASS) &&
              el37?.classList.remove('show'),
              syncNodeFooterAdvancedButtonState(el34));
          },
        }),
        value153 = () => {
          (bindLazyVideoModelMenu2.destroy(), run8());
        };
      this._footerControllerCleanup = bindGenerationNodeFooterLifecycle(this, value153);
      if (fallbackPopup)
        bindVideoPanelClick(fallbackPopup, 'ratio-popup-stop', (event12) => event12.stopPropagation());
      if (el12)
        bindVideoPanelClick(el12, 'duration-popup-stop', (event13) => event13.stopPropagation());
      if (el10)
        bindVideoPanelClick(el10, 'mode-menu-stop', (event14) => event14.stopPropagation());
      if (el8)
        bindVideoPanelClick(el8, 'dreamina-task-model-menu-stop', (event15) =>
          event15.stopPropagation(),
        );
    }
    ['_isDreaminaVideoNode'](value154 = this._data) {
      return isDreaminaStyleVideoModel(value154?.model, value154?.provider);
    }
    ['_getDreaminaEffectiveNodeData'](value155 = this._data) {
      return getDreaminaEffectiveNodeData(value155);
    }
    ['_buildDreaminaParamPatch'](value156 = this._data, value157 = {}) {
      return buildDreaminaParamPatch(value156, value157);
    }
    ['_buildDreaminaModelSelectionParamPatch'](value158 = this._data, value159 = {}) {
      return buildDreaminaModelSelectionParamPatch(value158, value159);
    }
    ['_commitDreaminaParamValues'](options5 = {}, value160 = this._data, args7 = {}) {
      const args8 =
          this._getDreaminaEffectiveNodeData(value160) ||
          this._getDreaminaEffectiveNodeData(
            store.getState().nodes?.[this.nodeId] || this._data || {},
          ),
        value161 = { ...args8, ...args7 },
        args9 = this._buildDreaminaParamPatch(value161, options5),
        args10 = { ...(args7 && typeof args7 === 'object' ? args7 : {}), ...args9 };
      return (
        store.updateNodeData(this.nodeId, args10),
        (this._data = this._getDreaminaEffectiveNodeData({ ...args8, ...args10 })),
        this._data
      );
    }
    ['_commitDreaminaRouteMode'](nextRouteMode, baseNodeData = this._data) {
      const nodes3 = store.getState(),
        el38 = buildDreaminaRouteModeUpdate({
          nextRouteMode: nextRouteMode,
          baseNodeData: baseNodeData,
          incoming: store.getIncomingEdges(this.nodeId) || [],
          nodes: nodes3.nodes || {},
        });
      if (el38.disabled)
        return (
          window.showToast?.(videoPanelText('smartMultiframeUnavailable'), 'warn'),
          (this._data = el38.nodeData),
          this._data
        );
      const list8 = Array.isArray(el38.edgeIdsToRemove) ? el38.edgeIdsToRemove : [],
        args11 = el38.patch || {};
      return (
        (list8.length > 0 || Object.keys(args11).length > 0) &&
          store.batch(() => {
            (list8.forEach((value162) => store.removeEdge(value162)),
              Object.keys(args11).length > 0 &&
                store.updateNodeData(this.nodeId, args11));
          }),
        (this._data =
          el38.nodeData || this._getDreaminaEffectiveNodeData({ ...baseNodeData, ...args11 })),
        this._data
      );
    }
    ['_commitDreaminaSchemaField'](value163, value164, value165 = this._data) {
      const value166 = String(value163 || '').trim(),
        args12 = this._getDreaminaEffectiveNodeData(value165);
      if (value166 === 'dreaminaRouteMode') return this._commitDreaminaRouteMode(value164, args12);
      const value167 = this._getResolvedDreaminaTaskType(args12),
        dreaminaStyleVideoProvider2 = resolveDreaminaStyleVideoProvider(args12?.model, args12?.provider),
        dreaminaStyleVideoModelForTask2 = ensureDreaminaStyleVideoModelForTask(value167, args12?.model, dreaminaStyleVideoProvider2);
      if (value166 === 'resolution') {
        const resolution4 = normalizeDreaminaStyleVideoResolution(value167, dreaminaStyleVideoModelForTask2, value164, dreaminaStyleVideoProvider2);
        return this._commitDreaminaParamValues({ resolution: resolution4 }, args12);
      }
      if (value166 === 'duration') {
        const duration3 = normalizeDreaminaStyleVideoDuration(value167, dreaminaStyleVideoModelForTask2, value164, dreaminaStyleVideoProvider2);
        return this._commitDreaminaParamValues({ duration: duration3 }, args12);
      }
      if (value166 === 'aspectRatio')
        return this._commitDreaminaSchemaAspectRatio(value164, args12, {
          forceManualDisplaySize: true,
        });
      const args13 = buildUiSchemaParamPatch(args12, value166, value164);
      return (
        store.updateNodeData(this.nodeId, args13),
        (this._data = this._getDreaminaEffectiveNodeData({ ...args12, ...args13 })),
        this._data
      );
    }
    ['_normalizeDreaminaNodeData'](value168, value169 = {}) {
      const value170 = value169?.syncStore !== false,
        args14 = this._getDreaminaEffectiveNodeData(value168),
        dreaminaStyleVideoNodeNormalizationPatch = buildDreaminaStyleVideoNodeNormalizationPatch(args14);
      if (!dreaminaStyleVideoNodeNormalizationPatch) return args14;
      const args15 = buildDreaminaStorePatchFromNormalization(args14, dreaminaStyleVideoNodeNormalizationPatch),
        value171 = this._getDreaminaEffectiveNodeData({ ...args14, ...args15 }),
        storeState = readStoreState().nodes?.[this.nodeId];
      return (
        value170 &&
          storeState &&
          Object.keys(args15).length > 0 &&
          store.updateNodeData(this.nodeId, args15),
        value171
      );
    }
    ['_getDreaminaReferenceSummary'](value172 = this._data) {
      const value173 = store.getIncomingEdges(this.nodeId) || [],
        storeState2 = readStoreState().nodes || {},
        items = [];
      for (const value174 of value173) {
        const response = storeState2?.[value174.sourceId];
        if (!response) continue;
        const list9 = String(response.type || '');
        let kind = '';
        if (list9.includes('video')) kind = 'video';
        else {
          if (list9.includes('audio')) kind = 'audio';
          else {
            if (list9.includes('image')) kind = 'image';
            else {
              if (list9.includes('text')) kind = 'text';
            }
          }
        }
        if (!kind) continue;
        if (kind === 'image') {
          const enabled14 =
            !!response.thumbId ||
            !!response.thumbUrl ||
            !!response.imageUrl ||
            !!response.src ||
            !!response.localPath;
          if (!enabled14) continue;
        } else {
          if (kind === 'video') {
            const enabled15 =
              (Array.isArray(response.videos) && response.videos.length > 0) ||
              !!response.thumbId ||
              !!response.thumbUrl ||
              !!response.videoUrl ||
              !!response.src ||
              !!response.localPath;
            if (!enabled15) continue;
          } else {
            if (kind === 'audio') {
              const enabled16 = !!response.audioUrl || !!response.src || !!response.localPath;
              if (!enabled16) continue;
            } else {
              if (kind === 'text') {
                const enabled17 = !!String(
                  response.outputText || response.text || response.content || '',
                ).trim();
                if (!enabled17) continue;
              }
            }
          }
        }
        items.push({
          edgeId: String(value174.id || ''),
          sourceId: String(value174.sourceId || ''),
          kind: kind,
          refSlot: String(value174.refSlot || ''),
        });
      }
      const images = items.filter((value175) => value175.kind === 'image'),
        videos = items.filter((value176) => value176.kind === 'video'),
        audios = items.filter((value177) => value177.kind === 'audio'),
        texts = items.filter((value178) => value178.kind === 'text');
      return {
        items: items,
        images: images,
        videos: videos,
        audios: audios,
        texts: texts,
        imageCount: images.length,
        videoCount: videos.length,
        audioCount: audios.length,
        textCount: texts.length,
        signature: items.map(
          (value179, value180) =>
            value180 +
            ':' +
            value179.edgeId +
            ':' +
            value179.sourceId +
            ':' +
            value179.kind +
            ':' +
            value179.refSlot,
        ).join('|'),
      };
    }
    ['_getResolvedDreaminaTaskType'](value181 = this._data, value182 = null) {
      if (!this._isDreaminaVideoNode(value181)) return '';
      const value183 = this._getDreaminaEffectiveNodeData(value181),
        imageCount = value182 || this._getDreaminaReferenceSummary(value183);
      return resolveDreaminaVideoTaskType({
        routeMode: normalizeDreaminaVideoRouteMode(value183?.dreaminaRouteMode, value183?.mode),
        imageCount: imageCount.imageCount,
        videoCount: imageCount.videoCount,
        audioCount: imageCount.audioCount,
      });
    }
    ['_commitDreaminaSchemaAspectRatio'](value184, value185 = this._data, value186 = {}) {
      const nodeData4 = this._getDreaminaEffectiveNodeData(value185),
        enabled18 = value186?.forceManualDisplaySize === true,
        aspectRatio3 = normalizeDreaminaVideoAspectRatio(value184, { preserveAdaptive: true });
      if (!enabled18 && nodeData4?.[GENERATION_MANUAL_DISPLAY_SIZE_FIELD] === true) {
        const args16 = this._buildDreaminaParamPatch(nodeData4, { aspectRatio: aspectRatio3 });
        return (
          store.updateNodeData(this.nodeId, args16),
          (this._data = this._getDreaminaEffectiveNodeData({ ...nodeData4, ...args16 })),
          this._data
        );
      }
      const patch = buildImageSchemaAspectRatioDisplayPatch({
          store: store,
          nodeId: this.nodeId,
          nodeData: nodeData4,
          fallbackNodeData: this._data,
          ratioValue: aspectRatio3,
          minSide: getAIGenerationNodeSize().width,
          inputKinds: ['image', 'video'],
          resultMediaElement: this.videoEl,
          resultFields: VIDEO_DISPLAY_RATIO_RESULT_FIELDS,
        }),
        args17 = this._buildDreaminaParamPatch(nodeData4, { aspectRatio: aspectRatio3 }),
        args18 = {
          ...(enabled18 ? { [GENERATION_MANUAL_DISPLAY_SIZE_FIELD]: false } : {}),
          ...patch,
          ...args17,
        };
      return (
        applyImageSchemaRatioResizeAnimation(this, {
          nodeId: this.nodeId,
          previewEl: this.previewEl,
          nodeData: nodeData4,
          patch: patch,
        }),
        store.updateNodeData(this.nodeId, args18),
        (this._data = this._getDreaminaEffectiveNodeData({ ...nodeData4, ...args18 })),
        this._data
      );
    }
    ['_buildModelApiAspectRatioDisplayPatch'](latestNodeData, fieldId2, value187, schemaPatch = {}) {
      const resolved = this._resolveModelExecution(latestNodeData?.model, latestNodeData?.provider);
      return buildVideoSchemaAspectRatioDisplayPatch({
        owner: this,
        store: store,
        nodeId: this.nodeId,
        latestNodeData: latestNodeData,
        fallbackNodeData: this._data,
        resolved: resolved,
        fieldId: fieldId2,
        value: value187,
        schemaPatch: schemaPatch,
        adapterType: 'modelApi',
        minSide: getAIGenerationNodeSize().width,
        previewEl: this.previewEl,
        resultMediaElement: this.videoEl,
      });
    }
    ['_buildRunningHubWorkflowAspectRatioDisplayPatch'](latestNodeData2, fieldId3, value188, schemaPatch2 = {}) {
      const resolved2 = this._resolveModelExecution(latestNodeData2?.model, latestNodeData2?.provider);
      return buildVideoSchemaAspectRatioDisplayPatch({
        owner: this,
        store: store,
        nodeId: this.nodeId,
        latestNodeData: latestNodeData2,
        fallbackNodeData: this._data,
        resolved: resolved2,
        fieldId: fieldId3,
        value: value188,
        schemaPatch: schemaPatch2,
        adapterType: 'workflow',
        minSide: getAIGenerationNodeSize().width,
        previewEl: this.previewEl,
        resultMediaElement: this.videoEl,
      });
    }
    ['_getDreaminaRatioDisplayState'](value189 = this._data, value190 = null) {
      if (!this._isDreaminaVideoNode(value189)) return null;
      const value191 = value190 || this._syncDreaminaTaskState(value189, { syncStore: false }),
        nodeData5 = value191?.nodeData || value189,
        summary = value191?.summary || this._getDreaminaReferenceSummary(nodeData5),
        resolvedTaskType =
          value191?.resolvedTaskType || this._getResolvedDreaminaTaskType(nodeData5, summary),
        currentModel =
          ensureDreaminaStyleVideoModelForTask(resolvedTaskType, nodeData5?.model, nodeData5?.provider) ||
          normalizeDreaminaStyleVideoModel(nodeData5?.model, nodeData5?.provider),
        currentResolution = normalizeDreaminaStyleVideoResolution(
          resolvedTaskType,
          currentModel,
          nodeData5?.resolution || nodeData5?.videoSize,
          nodeData5?.provider,
        ),
        value192 = String(nodeData5?.aspectRatio || '').trim(),
        currentRatio =
          value192 === '自适应' || value192 === '自适应' || value192 === 'auto'
            ? '自适应'
            : value192 === '5:4'
              ? '4:3'
              : value192 === '4:5'
                ? '3:4'
                : value192
                  ? normalizeDreaminaVideoAspectRatio(value192)
                  : '自适应',
        resolutionOptions = getDreaminaStyleVideoResolutionOptions(resolvedTaskType, currentModel, nodeData5?.provider),
        hasImageRefs = Number(summary?.imageCount || 0) > 0;
      return {
        nodeData: nodeData5,
        summary: summary,
        resolvedTaskType: resolvedTaskType,
        currentModel: currentModel,
        currentResolution: currentResolution,
        currentRatio: currentRatio,
        resolutionOptions: resolutionOptions,
        hasImageRefs: hasImageRefs,
        ratioLabelText: formatVideoRatioResolutionLabel(currentRatio, currentResolution || '720p'),
        ratioIconLabel: currentRatio,
      };
    }
    ['_syncDreaminaTaskState'](nodeData6 = this._data, value193 = {}) {
      if (!this._isDreaminaVideoNode(nodeData6))
        return {
          nodeData: nodeData6,
          summary: this._getDreaminaReferenceSummary(nodeData6),
          resolvedTaskType: '',
          routeMode: '',
        };
      const syncStore = value193?.syncStore !== false;
      let nodeData7 = this._normalizeDreaminaNodeData(nodeData6, { syncStore: syncStore });
      const imageCount2 = this._getDreaminaReferenceSummary(nodeData7),
        routeMode2 = normalizeDreaminaVideoRouteMode(nodeData7?.dreaminaRouteMode, nodeData7?.mode),
        resolvedTaskType2 = resolveDreaminaVideoTaskType({
          routeMode: routeMode2,
          imageCount: imageCount2.imageCount,
          videoCount: imageCount2.videoCount,
          audioCount: imageCount2.audioCount,
        }),
        value194 = {};
      if (resolvedTaskType2 !== 'multiframe2video') {
        const dreaminaStyleVideoProvider3 = resolveDreaminaStyleVideoProvider(nodeData7?.model, nodeData7?.provider),
          dreaminaStyleVideoModelForTask3 = ensureDreaminaStyleVideoModelForTask(resolvedTaskType2, nodeData7?.model, dreaminaStyleVideoProvider3);
        dreaminaStyleVideoModelForTask3 &&
          dreaminaStyleVideoModelForTask3 !== String(nodeData7?.model || '').trim() &&
          (value194.model = dreaminaStyleVideoModelForTask3);
        const dreaminaStyleVideoResolution = normalizeDreaminaStyleVideoResolution(
          resolvedTaskType2,
          dreaminaStyleVideoModelForTask3 || nodeData7?.model,
          nodeData7?.resolution || nodeData7?.videoSize,
          dreaminaStyleVideoProvider3,
        );
        dreaminaStyleVideoResolution &&
          dreaminaStyleVideoResolution !== String(nodeData7?.resolution || '').trim() &&
          (value194.resolution = dreaminaStyleVideoResolution);
        const dreaminaStyleVideoDuration = normalizeDreaminaStyleVideoDuration(
          resolvedTaskType2,
          dreaminaStyleVideoModelForTask3 || nodeData7?.model,
          nodeData7?.duration,
          dreaminaStyleVideoProvider3,
        );
        Number(dreaminaStyleVideoDuration) !== Number(nodeData7?.duration) && (value194.duration = dreaminaStyleVideoDuration);
      }
      if (imageCount2.imageCount <= 0) {
        const dreaminaVideoAspectRatio = normalizeDreaminaVideoAspectRatio(nodeData7?.aspectRatio, {
          preserveAdaptive: true,
        });
        dreaminaVideoAspectRatio !== String(nodeData7?.aspectRatio || '').trim() &&
          String(nodeData7?.aspectRatio || '').trim() &&
          (value194.aspectRatio = dreaminaVideoAspectRatio);
      }
      routeMode2 !== String(nodeData7?.dreaminaRouteMode || '').trim() &&
        (value194.dreaminaRouteMode = routeMode2);
      const dreaminaStyleVideoProvider4 = resolveDreaminaStyleVideoProvider(nodeData7?.model, nodeData7?.provider);
      String(nodeData7?.provider || '')
        .trim()
        .toLowerCase() !== dreaminaStyleVideoProvider4 && (value194.provider = dreaminaStyleVideoProvider4);
      if (Object.keys(value194).length > 0) {
        const args19 = buildDreaminaStorePatchFromNormalization(nodeData7, value194);
        nodeData7 = this._getDreaminaEffectiveNodeData({ ...nodeData7, ...args19 });
        const value195 = store.getState().nodes?.[this.nodeId];
        syncStore && value195 && store.updateNodeData(this.nodeId, args19);
      }
      return { nodeData: nodeData7, summary: imageCount2, resolvedTaskType: resolvedTaskType2, routeMode: routeMode2 };
    }
    ['_syncDreaminaPromptPlaceholder'](value196 = this._data) {
      if (!this.promptEl) return;
      const value197 = this.promptEl.dataset || (this.promptEl.dataset = {});
      if (!this._isDreaminaVideoNode(value196)) {
        const value198 = this._resolveModelExecution(value196?.model, value196?.provider);
        value197.placeholder = resolveVideoPromptPlaceholder(value198?.modelManifest, value196);
        return;
      }
      const value199 = this._getDreaminaEffectiveNodeData(value196),
        dreaminaVideoRouteMode2 = normalizeDreaminaVideoRouteMode(value199?.dreaminaRouteMode, value199?.mode);
      value197.placeholder =
        dreaminaVideoRouteMode2 === 'frames2video'
          ? videoPanelText('dreaminaPrompt.frames2video')
          : videoPanelText('dreaminaPrompt.reference');
    }
    ['_decorateDreaminaFooter'](el39, value200) {
      const value201 =
          value200 ||
          this._syncDreaminaTaskState(decorateSegmentRetakeParameterNodeData(this._data), {
            syncStore: false,
          }),
        args20 = decorateSegmentRetakeParameterNodeData(value201?.nodeData || this._data),
        resolutionOptions2 = this._getDreaminaRatioDisplayState(args20, value201),
        value202 = resolutionOptions2?.resolvedTaskType || value201?.resolvedTaskType || 'text2video',
        dreaminaRouteMode = args20?.dreaminaRouteMode || value201?.routeMode || 'auto',
        value203 =
          resolutionOptions2?.summary || value201?.summary || this._getDreaminaReferenceSummary(args20),
        dreaminaVideoTaskParamVisibility = getDreaminaVideoTaskParamVisibility(value202),
        provider7 = resolveDreaminaStyleVideoProvider(args20?.model, args20?.provider),
        model8 =
          resolutionOptions2?.currentModel ||
          ensureDreaminaStyleVideoModelForTask(value202, args20?.model, provider7) ||
          normalizeDreaminaStyleVideoModel(args20?.model, provider7),
        resolution5 = isSegmentRetakeEditing(args20)
          ? args20?.resolution
          : resolutionOptions2?.currentResolution ||
            normalizeDreaminaStyleVideoResolution(
              value202,
              model8,
              args20?.resolution || args20?.videoSize,
              provider7,
            ),
        aspectRatio4 =
          resolutionOptions2?.currentRatio || normalizeDreaminaVideoAspectRatio(args20?.aspectRatio),
        duration4 = isSegmentRetakeEditing(args20)
          ? args20?.duration
          : normalizeDreaminaStyleVideoDuration(value202, model8, args20?.duration, provider7),
        durationRange = getDreaminaStyleVideoDurationRange(value202, model8, provider7),
        el40 = el39.querySelector('.img-model-pills'),
        el41 = el39.querySelector('.img-model-wrap'),
        value204 = el39.querySelector('.img-model-btn-trigger'),
        el42 = el39.querySelector('.img-model-label'),
        el43 = el39.querySelector('.img-model-menu');
      if (el41) el41.hidden = false;
      el42 && (el42.textContent = getDreaminaProviderLabel(provider7));
      if (value204) {
        const value205 = this._getModelIconHTML(model8, provider7),
          value206 = value204.firstElementChild;
        if (value206) value206.outerHTML = value205;
        else value204.insertAdjacentHTML('afterbegin', value205);
      }
      el43?.querySelectorAll('.floating-menu-item').forEach((el44) => {
        const value207 = String(el44.dataset.value || '').trim(),
          value208 = String(el44.dataset.provider || '')
            .trim()
            .toLowerCase(),
          value209 =
            provider7 === 'dreamina'
              ? value208 === 'dreamina' || value207 === 'dreamina/text2video'
              : provider7 === 'apimart'
                ? value208 === 'apimart' && isApimartDreaminaVideoModel(value207, value208)
                : value208 === provider7 && isDreaminaStyleVideoModel(value207, value208);
        el44.classList.toggle('active', value209);
      });
      let el45 = el39.querySelector('.dreamina-task-model-wrap');
      !el45 &&
        ((el45 = document.createElement('div')),
        (el45.className = 'dreamina-task-model-wrap'),
        (el45.innerHTML =
          '\n        <button type="button" class="img-pill-btn dreamina-task-model-btn">\n          <span class="dreamina-task-model-label"></span>\n        </button>\n        <div class="floating-menu dreamina-task-model-menu"></div>\n      '),
        el41?.insertAdjacentElement('afterend', el45));
      const el46 = el45.querySelector('.dreamina-task-model-btn'),
        el47 = el45.querySelector('.dreamina-task-model-label'),
        el48 = el45.querySelector('.dreamina-task-model-menu'),
        allowedModelIds2 = getSegmentRetakeAllowedModelIdsForNode(args20),
        dreaminaTaskModelMenuMeta = getDreaminaTaskModelMenuMeta(model8, provider7);
      el47 &&
        (el47.textContent =
          dreaminaTaskModelMenuMeta?.title ||
          getDisplayModelName(model8 || getDreaminaStyleVideoDefaultModel(value202, provider7)));
      el48 &&
        (el48.innerHTML = buildDreaminaTaskModelMenuHtml(model8, value202, provider7, {
          allowedModelIds: allowedModelIds2,
        }));
      const value210 =
        !isDreaminaVideoRouteModeEnabled(dreaminaRouteMode) ||
        getDreaminaTaskModelMenuItems(value202, provider7, { allowedModelIds: allowedModelIds2 }).length <= 0;
      el46 && (el46.disabled = value210);
      (el39.querySelector('.img-ratio-wrap')?.remove(),
        el39.querySelector('.vid-mode-wrap')?.remove(),
        el39.querySelector('.vid-duration-wrap')?.remove(),
        el39.querySelectorAll('[data-dreamina-video-param-schema]').forEach((el49) =>
          el49.remove(),
        ));
      const decorateSegmentRetakeParameterNodeData5 = decorateSegmentRetakeParameterNodeData(
          this._getDreaminaEffectiveNodeData({
            ...args20,
            provider: provider7,
            model: model8,
            generationParams: {
              ...getPlainGenerationParams(args20?.generationParams),
              dreaminaRouteMode: dreaminaRouteMode,
              aspectRatio: aspectRatio4,
              duration: duration4,
              ...(resolution5 ? { resolution: resolution5 } : {}),
            },
          }),
        ),
        dreaminaParamSchemaFields = buildDreaminaParamSchemaFields({
          routeMode: dreaminaRouteMode,
          currentRatio: aspectRatio4,
          currentResolution: resolution5,
          currentDuration: duration4,
          durationRange: durationRange,
          resolutionOptions: resolutionOptions2?.resolutionOptions || [],
        }),
        decorateSegmentRetakeParameterSchemaFields2 = decorateSegmentRetakeParameterSchemaFields(args20, dreaminaParamSchemaFields),
        handler10 = (value211, list10, args21 = {}) => {
          if (!list10.length) return null;
          const renderUiSchemaFields2 = renderUiSchemaFields(list10, decorateSegmentRetakeParameterNodeData5, {
            sourceId: 'dreamina-video-normal-params',
            ...args21,
          });
          if (!renderUiSchemaFields2) return null;
          const el50 = document.createElement('div');
          return (
            (el50.className = 'ui-schema-placement ' + value211),
            (el50.dataset.dreaminaVideoParamSchema = '1'),
            (el50.innerHTML = renderUiSchemaFields2),
            el50
          );
        },
        value212 = dreaminaVideoTaskParamVisibility.mode ? handler10('dreamina-video-mode-schema', [decorateSegmentRetakeParameterSchemaFields2.mode]) : null,
        value213 = dreaminaVideoTaskParamVisibility.ratio
          ? handler10('dreamina-video-ratio-schema', [decorateSegmentRetakeParameterSchemaFields2.resolution, decorateSegmentRetakeParameterSchemaFields2.aspectRatio], {
              placement: 'resolution',
            })
          : null,
        value214 = dreaminaVideoTaskParamVisibility.duration
          ? handler10('dreamina-video-duration-schema', [decorateSegmentRetakeParameterSchemaFields2.duration])
          : null;
      if (el40) {
        const list11 = [el41, el45, value212, value213, value214].filter(Boolean);
        list11.forEach((value215) => el40.appendChild(value215));
      }
      this._syncDreaminaPromptPlaceholder(decorateSegmentRetakeParameterNodeData5);
    }
    ['_resolveModelExecution'](value216, providerHint2) {
      return (
        resolveModelExecution(value216, { providerHint: providerHint2 }) ||
        resolveModelExecution(value216) ||
        null
      );
    }
    ['_getModelProviderId'](value217, value218) {
      const value219 = this._resolveModelExecution(value217, value218),
        providerId = normalizeProviderId(value219?.modelManifest?.provider);
      if (providerId) return providerId;
      return resolveModelProvider(value217, value218, { allowPrefixInference: false }) || null;
    }
    ['_isRunninghubWorkflowModel'](value220, value221) {
      return isRunningHubVideoWorkflowModel(value220, value221);
    }
    ['_getModelIconHTML'](model9, provider8) {
      return renderVideoModelTriggerIconHTML({
        model: model9,
        provider: provider8,
        providersMeta: PROVIDERS_META,
        resolveExecution: (value222, value223) => this._resolveModelExecution(value222, value223),
        resolveProviderId: (value224, value225) => this._getModelProviderId(value224, value225),
      });
    }
    ['_getModelParamVisibility'](value226, value227) {
      if (isDreaminaStyleVideoModel(value226, value227)) {
        const value228 = this._getResolvedDreaminaTaskType();
        return getDreaminaVideoTaskParamVisibility(value228);
      }
      const value229 = this._getModelProviderId(value226, value227);
      if (value229 === 'runninghub' || value229 === 'runninghubwf')
        return { ratio: true, mode: false, duration: false };
      return { ratio: true, mode: true, duration: true };
    }
    ['_getRatioIconHTML'](value230) {
      if (value230 === '自适应')
        return '<svg class="video-ratio-auto-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>';
      const value231 = {
          '1:1': 'img-rp-sq',
          '9:16': 'img-rp-tall',
          '16:9': 'img-rp-wide',
          '3:4': 'img-rp-p34',
          '4:3': 'img-rp-l43',
          '3:2': 'img-rp-l32',
          '2:3': 'img-rp-p23',
          '5:4': 'img-rp-l54',
          '4:5': 'img-rp-p45',
          '21:9': 'img-rp-ultra',
        },
        value232 = value231[value230] || 'img-rp-sq';
      return '<span class="img-rp-icon video-ratio-icon ' + value232 + '"></span>';
    }
    ['_updateSubmitButtonState']() {
      if (!this.btnEl) return;
      if (this._segmentRetakePreparing === true) {
        const title = getVideoGenerateTitle();
        (setGenerateButtonLoadingUi(this.btnEl, {
          title: title,
          disabled: true,
          ariaLabel: title,
        }),
          this.btnEl.setAttribute?.('aria-busy', 'true'));
        return;
      }
      const value233 =
          typeof store.getStateRaw === 'function'
            ? store.getStateRaw()
            : typeof store.getState === 'function'
              ? store.getState()
              : {},
        nodes4 = value233?.nodes || {},
        inEdges2 =
          typeof store.getIncomingEdges === 'function'
            ? store.getIncomingEdges(this.nodeId)
            : [],
        modelId2 = decorateSegmentRetakeParameterNodeData(
          nodes4?.[this.nodeId] || this._data || {},
        ),
        cancellable = this._isRunninghubWorkflowModel(modelId2?.model, modelId2?.provider),
        el51 = resolveGenerationButtonMode(modelId2, {
          cancellable: cancellable,
          cancelInFlight: this._rhCancelInFlight === true,
        });
      if (el51.busy) {
        if (cancellable) {
          const title2 = getVideoCancelTooltip();
          setGenerateButtonCancellableUi(this.btnEl, {
            title: title2,
            tooltip: title2,
            ariaLabel: videoPanelText('cancelGenerateAria'),
            color: 'var(--red)',
            busy: true,
          });
        } else {
          const title3 = getVideoGenerateTitle();
          setGenerateButtonLoadingUi(this.btnEl, {
            title: title3,
            disabled: true,
            ariaLabel: title3,
          });
        }
        this.btnEl.disabled = el51.disabled;
        return;
      }
      (resetGenerateButtonIdleUi(this.btnEl, getVideoGenerateTitle()),
        resetModelCredentialButtonState(this.btnEl));
      const run9 = () =>
        applyModelCredentialButtonState(this.btnEl, {
          modelId: modelId2?.model,
          provider: modelId2?.provider,
          providerProfileId: modelId2?.providerProfileId || modelId2?.rhProviderProfileId,
        });
      if (
        !this._isDreaminaVideoNode(modelId2) &&
        getPanelModelManifest(modelId2)?.kind !== 'video'
      ) {
        const videoPanelText2 = videoPanelText('modelUnavailable');
        ((this.btnEl.disabled = true),
          (this.btnEl.title = videoPanelText2),
          this.btnEl.setAttribute?.('aria-label', videoPanelText2));
        return;
      }
      const promptText = resolvePromptTextWithTextRefs({
        promptEl: this.promptEl,
        inEdges: inEdges2,
        nodes: nodes4,
      });
      if (modelId2.segmentRetake && !getSegmentRetakeValidation(modelId2.segmentRetake).ok) {
        this.btnEl.disabled = true;
        return;
      }
      if (this._isDreaminaVideoNode(modelId2)) {
        const value234 = this._syncDreaminaTaskState(modelId2, {
          syncStore: !modelId2?.segmentRetake,
        });
        this._data = decorateSegmentRetakeParameterNodeData(value234.nodeData || this._data);
        const imageCount3 = value234.summary || this._getDreaminaReferenceSummary(),
          taskType2 = value234.resolvedTaskType || this._getResolvedDreaminaTaskType(),
          routeMode3 = value234.routeMode || 'multimodal2video';
        if (!isDreaminaVideoRouteModeEnabled(routeMode3)) {
          this.btnEl.disabled = true;
          return;
        }
        const validateDreaminaVideoRouteSelection2 = validateDreaminaVideoRouteSelection({
          routeMode: routeMode3,
          taskType: taskType2,
          model: modelId2?.model,
          provider: modelId2?.provider,
          imageCount: imageCount3.imageCount,
          videoCount: imageCount3.videoCount,
          audioCount: imageCount3.audioCount,
        });
        let enabled19 = !validateDreaminaVideoRouteSelection2;
        if (enabled19) {
          if (taskType2 === 'text2video') enabled19 = !!promptText;
          else {
            if (taskType2 === 'image2video') enabled19 = !!promptText && imageCount3.imageCount === 1;
            else {
              if (taskType2 === 'frames2video') enabled19 = !!promptText && imageCount3.imageCount === 2;
              else {
                if (taskType2 === 'multiframe2video') enabled19 = false;
                else
                  taskType2 === 'multimodal2video' &&
                    (enabled19 =
                      !!promptText &&
                      (imageCount3.imageCount > 0 ||
                        imageCount3.videoCount > 0 ||
                        imageCount3.audioCount > 0));
              }
            }
          }
        }
        this.btnEl.disabled = !enabled19;
        if (enabled19) run9();
        return;
      }
      const run10 = () =>
        inEdges2.length > 0 ||
        evaluateGenerationPromptBoundary({
          model: modelId2?.model,
          provider: modelId2?.provider,
          promptText: promptText,
          hasInput: inEdges2.length > 0,
        }).ok;
      if (isHappyHorsePanelModel(modelId2)) {
        this.btnEl.disabled = !promptText;
        if (promptText) run9();
        return;
      }
      const shouldAllowEmptyCustomAiAppInputs2 = shouldAllowEmptyCustomAiAppInputs(getPanelModelManifest(modelId2)),
        fixedInputConfig = getFixedInputSlotConfigFromManifest(this._data || {}),
        list12 = (fixedInputConfig?.fixedSlots || []).filter(
          (value235) => value235?.required === true,
        ),
        list13 = (fixedInputConfig?.exclusiveGroups || []).filter(
          (value236) => value236?.required === true || Number(value236?.min || 0) > 0,
        );
      if (!shouldAllowEmptyCustomAiAppInputs2 && (list12.length > 0 || list13.length > 0)) {
        const nodeData8 = nodes4?.[this.nodeId] || this._data || {},
          occupiedSlots = new Set(),
          map = new Set(fixedInputConfig.visibleSlots || []);
        for (const refSlot of inEdges2) {
          const sourceNode = nodes4[refSlot.sourceId];
          if (!sourceNode) continue;
          const kind2 = resolveEffectiveInputKind(sourceNode, refSlot),
            { slot: slot } = resolveFixedInputSlotForRef({
              fixedInputConfig: fixedInputConfig,
              refSlot: refSlot?.refSlot,
              kind: kind2,
              occupiedSlots: occupiedSlots,
              sourceNode: sourceNode,
            });
          if (slot && map.has(slot)) occupiedSlots.add(slot);
        }
        const fixedInputAssetSlotMap = buildFixedInputAssetSlotMap(this.promptEl, {
            slotOrderByType: fixedInputConfig.slotOrderByType,
            visibleSlots: fixedInputConfig.visibleSlots,
            exclusiveGroups: fixedInputConfig.exclusiveGroups,
            slotById: fixedInputConfig.slotById,
            occupiedSlots: occupiedSlots,
            nodeData: nodeData8,
          }),
          value237 = list12.every((value238) => {
            const enabled20 = String(value238?.id || '').trim();
            return !!enabled20 && (occupiedSlots.has(enabled20) || !!fixedInputAssetSlotMap[enabled20]);
          }),
          value239 = list13.every((value240) => {
            const list14 = Array.isArray(value240?.slots) ? value240.slots : [];
            return list14.some((value241) => occupiedSlots.has(value241) || !!fixedInputAssetSlotMap[value241]);
          }),
          value242 = value237 && value239;
        this.btnEl.disabled = !(value242 && run10());
        if (this.btnEl.style)
          this.btnEl.style.cursor = this.btnEl.disabled ? 'var(--unavailable-cursor)' : '';
        if (!this.btnEl.disabled) run9();
        return;
      }
      this.btnEl.disabled = !run10();
      if (!this.btnEl.disabled && this.btnEl.style) this.btnEl.style.cursor = '';
      if (!this.btnEl.disabled) run9();
    }
  }
  return input.prototype;
}
