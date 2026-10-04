import appStore from '../core/stores/appStore.js';
import { generateId } from '../core/math.js';
import { getImage } from './storage.js';
import { buildGenerateImageRequest, generateImage } from '../../api/aiImageApi.js';
import { cancelRunningHubTask } from '../../api/runninghubTaskApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import {
  bindImageFunctionModeMenu,
  buildImageFreeAngleModelCatalog,
  bindImageFunctionModelMenu,
  buildImageFunctionModeControlHTML,
  buildImageFunctionModelMenuHTML,
  closeImageFunctionModelSubmenus,
  getDefaultImageFreeAngleModelState,
  getImageFunctionModelDisplayName,
  getImageFunctionModelTriggerIconHTML,
  isImageFreeAngleOnlyModel,
  resolveImageFunctionModelByMode,
  syncImageFunctionModeControl,
  syncImageFunctionModelMenuActive,
} from './imageFunctionModelMenu.js';
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../utils/debugRequestPreview.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { GENERATE_CANCEL_ICON_HTML } from './previewGenerateButtonUi.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../components/aigenImage/imageGenerationResultRenderer.js';
import { buildGenerationCancelledPatch, buildGenerationStartPatch } from '../core/generationTaskLifecycle.js';
import { isTaskCancelled } from '../core/generationTaskUiState.js';
import {
  isDreaminaImageTaskModel,
  isRunningHubImageTaskModel,
  isRunningHubModelApiImageTask,
  resolveImageTaskProvider,
  shouldUseRunningHubOpenapiQuery,
} from './imageTaskModelResolver.js';
import { onLocaleChange, t } from '../i18n/index.js';
const FREE_ANGLE_DISTANCE_MIN = 0.1,
  FREE_ANGLE_DISTANCE_MAX = 2,
  FREE_ANGLE_VISUAL_SCALE_MIN = 0.7,
  FREE_ANGLE_PREVIOUS_DISTANCE_ONE_VISUAL_SCALE =
    FREE_ANGLE_VISUAL_SCALE_MIN +
    (1 - FREE_ANGLE_DISTANCE_MIN) * (2.65 / (FREE_ANGLE_DISTANCE_MAX - FREE_ANGLE_DISTANCE_MIN));
function _computeGenerationDuration(enabled) {
  if (!enabled) return 0;
  if (typeof enabled.generationDuration === 'number') return enabled.generationDuration;
  const count = Number(enabled.generationStartTime);
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.max(0, Date.now() - count);
}
function _isRunningHubTaskModel(value, item) {
  return isRunningHubImageTaskModel(value, item);
}
function _isDreaminaTaskModel(key, index) {
  return isDreaminaImageTaskModel(key, index);
}
function freeAngleText(result, data = {}) {
  return t('imageFreeAngle.' + result, data);
}
function buildFreeAngleOutputText(model, { rotation: rotation, pitch: pitch, scale: scale } = {}) {
  return freeAngleText('output.angle', {
    model: model,
    rotation: rotation,
    pitch: pitch,
    scale: scale,
  });
}
function _resolveImageProvider(options, target = '') {
  return resolveImageTaskProvider(options, target, 'grsai');
}
function _buildRunningHubTaskPatch({
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
  useOpenapiQuery: useOpenapiQuery = false,
} = {}) {
  return {
    rhTaskId: String(taskId || '').trim(),
    rhTaskStatus: String(status || 'pending').trim() || 'pending',
    rhTaskStartedAt: Number(startedAt || 0),
    rhTaskRecovering: recovering === true,
    rhTaskUseOpenapiQuery: useOpenapiQuery === true,
  };
}
function _buildDreaminaTaskPatch({
  submitId: submitId = '',
  status: status = 'pending',
  phase: phase = 'generating',
  label: label = freeAngleText('task.generating'),
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return {
    dreaminaSubmitId: String(submitId || '').trim(),
    dreaminaTaskStatus: String(status || 'pending').trim() || 'pending',
    dreaminaTaskPhase: String(phase || 'generating').trim() || 'generating',
    dreaminaTaskLabel:
      String(label || freeAngleText('task.generating')).trim() || freeAngleText('task.generating'),
    dreaminaTaskStartedAt: Number(startedAt || 0),
    dreaminaTaskLastCheckedAt: Date.now(),
    dreaminaTaskRecovering: recovering === true,
    dreaminaTaskLastRaw: {},
  };
}
function _buildAsyncTaskPatch({
  provider: provider = '',
  kind: kind = 'image',
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return {
    asyncTaskProvider: String(provider || '').trim(),
    asyncTaskKind: String(kind || 'image').trim() || 'image',
    asyncTaskId: String(taskId || '').trim(),
    asyncTaskStatus: String(status || 'pending').trim() || 'pending',
    asyncTaskStartedAt: Number(startedAt || 0),
    asyncTaskRecovering: recovering === true,
  };
}
function _persistRunningHubResumeCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
export function createRunningHubTaskStateMachine() {
  const apiKey = {
      active: false,
      cancelRequested: false,
      apiKey: '',
      taskId: '',
      abortController: null,
      outNodeId: '',
      originHtml: '',
      originColor: '',
      originTooltip: '',
      originAria: '',
      originTitle: '',
    },
    bindButton = (el) => {
      if (!el || apiKey.originHtml) return;
      ((apiKey.originHtml = el.innerHTML),
        (apiKey.originColor = el.style.color || ''),
        (apiKey.originTooltip = el.dataset.tooltip || ''),
        (apiKey.originAria = el.getAttribute('aria-label') || ''),
        (apiKey.originTitle = el.title || ''));
    },
    handler = (el2) => {
      if (!el2) return;
      (bindButton(el2),
        (el2.style.color = 'var(--red)'),
        (el2.dataset.tooltip = freeAngleText('runningTask.clickCancel')),
        el2.setAttribute('aria-label', freeAngleText('runningTask.cancel')),
        (el2.title = freeAngleText('runningTask.clickCancelTask')),
        (el2.innerHTML = GENERATE_CANCEL_ICON_HTML));
    },
    handler2 = (el3) => {
      if (!el3) return;
      if (apiKey.originHtml) el3.innerHTML = apiKey.originHtml;
      el3.style.color = apiKey.originColor || '';
      if (apiKey.originTooltip) el3.dataset.tooltip = apiKey.originTooltip;
      else delete el3.dataset.tooltip;
      if (apiKey.originAria) el3.setAttribute('aria-label', apiKey.originAria);
      else el3.removeAttribute('aria-label');
      el3.title = apiKey.originTitle || '';
    },
    activate = ({
      button: button,
      apiKey: apiKey2,
      abortController: abortController,
      outNodeId: outNodeId,
    }) => {
      ((apiKey.active = true),
        (apiKey.cancelRequested = false),
        (apiKey.apiKey = apiKey2 || ''),
        (apiKey.taskId = ''),
        (apiKey.abortController = abortController || null),
        (apiKey.outNodeId = outNodeId || ''),
        handler(button));
    },
    setTaskId = (source) => {
      apiKey.taskId = source ? String(source) : '';
    },
    isCancelled = () => !!apiKey.cancelRequested || !!apiKey.abortController?.signal?.aborted,
    cancel = async () => {
      apiKey.cancelRequested = true;
      try {
        apiKey.abortController?.abort?.();
      } catch {}
      apiKey.apiKey &&
        apiKey.taskId &&
        (await cancelRunningHubTask({ apiKey: apiKey.apiKey, taskId: apiKey.taskId }));
    },
    finalizeCancelledNode = ({ nodeId: nodeId, name: name, outputText: outputText }) => {
      const enabled2 = nodeId || apiKey.outNodeId;
      if (!enabled2) return;
      const enabled3 = appStore.getState().nodes?.[enabled2];
      if (!enabled3) return;
      const duration = _computeGenerationDuration(enabled3);
      appStore.updateNodeData(enabled2, {
        ...buildGenerationCancelledPatch({ duration: duration }),
        name: name,
        outputText: outputText,
        jobStatus: null,
      });
    },
    reset = (next) => {
      ((apiKey.active = false),
        (apiKey.cancelRequested = false),
        (apiKey.apiKey = ''),
        (apiKey.taskId = ''),
        (apiKey.abortController = null),
        (apiKey.outNodeId = ''),
        handler2(next));
    };
  return {
    state: apiKey,
    bindButton: bindButton,
    activate: activate,
    setTaskId: setTaskId,
    isCancelled: isCancelled,
    cancel: cancel,
    finalizeCancelledNode: finalizeCancelledNode,
    reset: reset,
  };
}
const ImageFreeAngleController = {
  active: false,
  nodeId: null,
  nodeData: null,
  state: { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } },
  containerEl: null,
  cubeEl: null,
  imageWrapEl: null,
  onDone: null,
  _unsubscribeLocale: null,
  async render(current, entry, record, payload, handle) {
    const state = appStore.getStateRaw(),
      enabled4 = state.nodes?.[current];
    if (!enabled4) return;
    if (this.active && this.nodeId === current) return;
    this.active && this.nodeId !== current && this._exit();
    ((this.active = true),
      (this.nodeId = current),
      (this.nodeData = enabled4),
      (this.containerEl = entry),
      (this.onDone = record),
      (this.onGenerate = payload),
      (this.triggerBtn = handle));
    this.triggerBtn &&
      ((this._oldTriggerContent = this.triggerBtn.innerHTML),
      (this._oldTriggerTooltip = this.triggerBtn.getAttribute('data-tooltip')),
      (this._oldTriggerAriaLabel = this.triggerBtn.getAttribute('aria-label')),
      (this._oldTriggerTitle = this.triggerBtn.getAttribute('title')),
      (this.triggerBtn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'),
      this.triggerBtn.setAttribute('data-tooltip', freeAngleText('actions.exit')),
      this.triggerBtn.setAttribute('aria-label', freeAngleText('actions.exitControl')),
      this.triggerBtn.setAttribute('title', freeAngleText('actions.exitControl')),
      this.triggerBtn.classList.add('ftb-btn-exit'));
    ((this.state = { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } }),
      (this._modelCatalog = buildImageFreeAngleModelCatalog()));
    const defaultImageFreeAngleModelState = getDefaultImageFreeAngleModelState(this._modelCatalog);
    ((this._currentModel = defaultImageFreeAngleModelState.model || 'nano-banana'),
      (this._currentProvider = defaultImageFreeAngleModelState.provider || 'grsai'),
      await this._createUI(),
      this._bindEvents(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      this._syncLocaleTexts(),
      this._updateView());
  },
  async _createUI() {
    const el4 = this.containerEl;
    el4.innerHTML = '';
    const el5 = document.createElement('div');
    el5.className = 'v2-free-angle-embedded';
    let config =
      this.nodeData.imageUrl ||
      this.nodeData.sourceUrl ||
      this.nodeData.thumbUrl ||
      this.nodeData.src ||
      localPathToUrl(this.nodeData.localPath);
    if (this.nodeData.thumbId)
      try {
        const image = await getImage(this.nodeData.thumbId);
        if (image) config = URL.createObjectURL(image);
      } catch (scope) {
        console.error('FA load blob failed', scope);
      }
    const modelCatalog = this._modelCatalog || buildImageFreeAngleModelCatalog();
    this._modelCatalog = modelCatalog;
    const imageFunctionModelMenuHTML = buildImageFunctionModelMenuHTML({
      activeModel: this._currentModel,
      activeProvider: this._currentProvider,
      modelCatalog: modelCatalog,
    });
    ((el5.innerHTML =
      '\n      <div class="fa-header">\n        <span class="fa-title">' +
      freeAngleText('panel.title') +
      '</span>\n        <button class="fa-close-btn">×</button>\n      </div>\n      <div class="fa-content">\n        <div class="fa-preview-area">\n          <button class="fa-reset-btn">' +
      freeAngleText('actions.reset') +
      '</button>\n          <div class="fa-cube-container">\n            <div class="fa-cube">\n              <div class="fa-cube-face face-front">\n                <img src="' +
      config +
      '" class="fa-face-img" />\n              </div>\n              <div class="fa-cube-face face-back">' +
      freeAngleText('cube.back') +
      '</div>\n              <div class="fa-cube-face face-right">' +
      freeAngleText('cube.right') +
      '</div>\n              <div class="fa-cube-face face-left">' +
      freeAngleText('cube.left') +
      '</div>\n              <div class="fa-cube-face face-top">' +
      freeAngleText('cube.top') +
      '</div>\n              <div class="fa-cube-face face-bottom">' +
      freeAngleText('cube.bottom') +
      '</div>\n            </div>\n          </div>\n        </div>\n        <div class="fa-controls">\n          <div class="fa-control-item">\n            <div class="fa-control-label-row" style="display:flex;justify-content:space-between;">\n              <span class="fa-label fa-label-rotation">' +
      freeAngleText('controls.rotation') +
      '</span>\n              <span class="fa-value" id="val-rotation">35.0°</span>\n            </div>\n            <input type="range" class="fa-slider" id="sld-rotation" min="0" max="360" step="0.5" value="35">\n          </div>\n          <div class="fa-control-item">\n            <div class="fa-control-label-row" style="display:flex;justify-content:space-between;">\n              <span class="fa-label fa-label-pitch">' +
      freeAngleText('controls.pitch') +
      '</span>\n              <span class="fa-value" id="val-pitch">20.0°</span>\n            </div>\n            <input type="range" class="fa-slider" id="sld-pitch" min="-30" max="60" step="0.5" value="20">\n          </div>\n          <div class="fa-control-item">\n             <div class="fa-control-label-row" style="display:flex;justify-content:space-between;">\n              <span class="fa-label fa-label-distance">' +
      freeAngleText('controls.distance') +
      '</span>\n              <span class="fa-value" id="val-scale">0.50</span>\n            </div>\n            <input type="range" class="fa-slider" id="sld-scale" min="0.1" max="2" step="0.05" value="0.5">\n          </div>\n          <div class="fa-footer">\n            <div class="fa-model-select image-function-model-select">\n              <button type="button" class="fa-model-btn img-pill-btn image-function-model-trigger">\n                ' +
      this._getModelIconHtml(this._currentModel, this._currentProvider) +
      '\n                <span class="fa-model-label">' +
      getImageFunctionModelDisplayName(this._currentModel, modelCatalog) +
      '</span>\n                <svg class="fa-model-chevron image-function-model-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>\n              </button>\n              <div class="fa-model-menu floating-menu image-function-model-menu">\n                ' +
      imageFunctionModelMenuHTML +
      '\n              </div>\n            </div>\n            ' +
      buildImageFunctionModeControlHTML({
        model: this._currentModel,
        provider: this._currentProvider,
        imageSize: this.nodeData?.imageSize || '2K',
        wrapClass: 'fa-mode-select',
        buttonClass: 'fa-mode-btn img-pill-btn',
      }) +
      '\n            <div class="fa-footer-actions">\n              <button type="button" class="fa-debug-btn debug-wrench-btn" title="' +
      freeAngleText('actions.debugApiParams') +
      '">\n                ' +
      DEBUG_WRENCH_ICON_HTML +
      '\n              </button>\n              <button class="fa-gen-btn img-gen-btn" title="' +
      freeAngleText('actions.generate') +
      '">\n                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n              </button>\n            </div>\n          </div>\n        </div>\n      </div>\n    '),
      (el5.querySelector('.fa-close-btn').onclick = () => this._exit()),
      el5.addEventListener('click', (event) => {
        event.stopPropagation();
      }),
      el5.addEventListener('mousedown', (event2) => {
        event2.stopPropagation();
      }),
      el4.appendChild(el5),
      (this.cubeEl = el5.querySelector('.fa-cube')),
      (this.wrapperEl = el5));
  },
  _syncLocaleTexts() {
    this.triggerBtn?.classList?.contains('ftb-btn-exit') &&
      (this.triggerBtn.setAttribute('data-tooltip', freeAngleText('actions.exit')),
      this.triggerBtn.setAttribute('aria-label', freeAngleText('actions.exitControl')),
      this.triggerBtn.setAttribute('title', freeAngleText('actions.exitControl')));
    if (!this.wrapperEl) return;
    const run = (input, output) => {
        const el6 = this.wrapperEl.querySelector(input);
        if (el6) el6.textContent = output;
      },
      handler3 = (value2, value3) => {
        const value4 = this.wrapperEl.querySelector(value2);
        if (value4) value4.title = value3;
      };
    (run('.fa-title', freeAngleText('panel.title')),
      run('.fa-reset-btn', freeAngleText('actions.reset')),
      run('.face-back', freeAngleText('cube.back')),
      run('.face-right', freeAngleText('cube.right')),
      run('.face-left', freeAngleText('cube.left')),
      run('.face-top', freeAngleText('cube.top')),
      run('.face-bottom', freeAngleText('cube.bottom')),
      run('.fa-label-rotation', freeAngleText('controls.rotation')),
      run('.fa-label-pitch', freeAngleText('controls.pitch')),
      run('.fa-label-distance', freeAngleText('controls.distance')),
      handler3('.fa-debug-btn', freeAngleText('actions.debugApiParams')),
      handler3('.fa-gen-btn', freeAngleText('actions.generate')));
  },
  _updateView() {
    if (!this.active) return;
    const { rotation: rotation2, pitch: pitch2, scale: scale2 } = this.state,
      value5 = ((rotation2 % 0x168) + 0x168) % 0x168;
    ((this.wrapperEl.querySelector('#val-rotation').textContent = value5.toFixed(1) + '°'),
      (this.wrapperEl.querySelector('#val-pitch').textContent = pitch2.toFixed(1) + '°'),
      (this.wrapperEl.querySelector('#val-scale').textContent = '' + scale2.toFixed(2)),
      (this.wrapperEl.querySelector('#sld-rotation').value = value5),
      (this.wrapperEl.querySelector('#sld-pitch').value = pitch2),
      (this.wrapperEl.querySelector('#sld-scale').value = scale2),
      (this.cubeEl.style.transform = 'rotateX(' + -pitch2 + 'deg) rotateY(' + (value5 - 0x168) + 'deg)'));
    const value6 =
      FREE_ANGLE_VISUAL_SCALE_MIN +
      (scale2 - FREE_ANGLE_DISTANCE_MIN) *
        ((FREE_ANGLE_PREVIOUS_DISTANCE_ONE_VISUAL_SCALE - FREE_ANGLE_VISUAL_SCALE_MIN) /
          (FREE_ANGLE_DISTANCE_MAX - FREE_ANGLE_DISTANCE_MIN));
    this.cubeEl.parentElement.style.transform = 'scale(' + value6 + ')';
  },
  _bindEvents() {
    const root = this.wrapperEl;
    ((root.querySelector('#sld-rotation').oninput = (event3) => {
      ((this.state.rotation = parseFloat(event3.target.value)), this._updateView());
    }),
      (root.querySelector('#sld-pitch').oninput = (event4) => {
        ((this.state.pitch = parseFloat(event4.target.value)), this._updateView());
      }),
      (root.querySelector('#sld-scale').oninput = (event5) => {
        ((this.state.scale = parseFloat(event5.target.value)), this._updateView());
      }),
      (root.querySelector('.fa-reset-btn').onclick = () => {
        ((this.state = { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } }), this._updateView());
      }));
    const value7 = root.querySelector('.fa-preview-area');
    let enabled5 = false,
      enabled6 = false,
      box = { x: 0, y: 0 };
    value7.onmousedown = (x) => {
      enabled5 = true;
      if (x.button === 2) enabled6 = true;
      ((box = { x: x.clientX, y: x.clientY }), x.preventDefault(), x.stopPropagation());
    };
    const value8 = (x2) => {
        if (!enabled5) return;
        const value9 = x2.clientX - box.x,
          value10 = x2.clientY - box.y;
        ((box = { x: x2.clientX, y: x2.clientY }),
          enabled6 && ((this.state.pan.x += value9), (this.state.pan.y += value10)),
          !enabled6 &&
            ((this.state.rotation += value9 * 0.5),
            (this.state.pitch += value10 * 0.5),
            (this.state.pitch = Math.max(-30, Math.min(60, this.state.pitch)))),
          this._updateView());
      },
      value11 = () => {
        ((enabled5 = false), (enabled6 = false));
      };
    (window.addEventListener('mousemove', value8),
      window.addEventListener('mouseup', value11),
      (this._cleanupHandlers = () => {
        (window.removeEventListener('mousemove', value8), window.removeEventListener('mouseup', value11));
      }),
      (value7.onwheel = (event6) => {
        (event6.preventDefault(), event6.stopPropagation());
        const value12 = event6.deltaY > 0 ? -0.05 : 0.05;
        ((this.state.scale = Math.max(0.1, Math.min(2, this.state.scale + value12))), this._updateView());
      }),
      (value7.oncontextmenu = (event7) => event7.preventDefault()),
      (root.querySelector('.fa-gen-btn').onclick = () => this._handleGenerate()),
      (root.querySelector('.fa-debug-btn').onclick = (event8) => {
        (event8.stopPropagation(), this._handleDebug());
      }));
    const el7 = root.querySelector('.fa-model-btn'),
      modelMenu = root.querySelector('.fa-model-menu'),
      el8 = root.querySelector('.fa-mode-btn'),
      modeMenu = root.querySelector('.image-function-mode-menu'),
      value13 = this._modelCatalog || buildImageFreeAngleModelCatalog(),
      imageSize = () => this.nodeData?.imageSize || '2K';
    el7.onclick = (event9) => {
      event9.stopPropagation();
      const value14 = modelMenu.style.display === 'block' || modelMenu.style.display === 'flex';
      value14
        ? ((modelMenu.style.display = 'none'), closeImageFunctionModelSubmenus(modelMenu))
        : ((modelMenu.style.display = 'block'), modeMenu?.classList.remove('show'));
    };
    const run2 = () =>
        syncImageFunctionModeControl({
          root: root,
          model: this._currentModel,
          provider: this._currentProvider,
          imageSize: imageSize(),
        }),
      handler4 = (value15, value16) => {
        const model2 = String(value15 || '').trim(),
          provider2 = _resolveImageProvider(model2, value16);
        if (!model2 || !provider2) return;
        ((this._currentModel = model2), (this._currentProvider = provider2));
        const value17 = this._getModelIconHtml(model2, provider2),
          imageFunctionModelDisplayName = getImageFunctionModelDisplayName(model2, value13);
        ((el7.innerHTML =
          '\n        ' +
          value17 +
          '\n        <span class="fa-model-label">' +
          imageFunctionModelDisplayName +
          '</span>\n        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"/></svg>\n      '),
          syncImageFunctionModelMenuActive({ modelMenu: modelMenu, model: model2, provider: provider2 }),
          run2(),
          (modelMenu.style.display = 'none'),
          closeImageFunctionModelSubmenus(modelMenu),
          this.nodeId &&
            !isImageFreeAngleOnlyModel(model2) &&
            appStore.updateNodeData(this.nodeId, { model: model2, provider: provider2 }));
      },
      bindImageFunctionModelMenu2 = bindImageFunctionModelMenu({
        modelMenu: modelMenu,
        onSelect: ({ model: model3, provider: provider3 }) => handler4(model3, provider3),
        closeMenu: () => {
          modelMenu.style.display = 'none';
        },
      }),
      bindImageFunctionModeMenu2 = bindImageFunctionModeMenu({
        modeMenu: modeMenu,
        onSelect: ({ mode: mode }) => {
          const imageFunctionModelByMode = resolveImageFunctionModelByMode({
            model: this._currentModel,
            provider: this._currentProvider,
            imageSize: imageSize(),
            mode: mode,
          });
          if (!imageFunctionModelByMode?.model) return;
          (handler4(imageFunctionModelByMode.model, imageFunctionModelByMode.provider),
            modeMenu?.classList.remove('show'));
        },
      });
    ((this._cleanupSubmenuClick = () => {
      (bindImageFunctionModelMenu2?.(), bindImageFunctionModeMenu2?.());
    }),
      el8?.addEventListener('click', (event10) => {
        event10.stopPropagation();
        if (el8.closest('.image-function-mode-wrap')?.classList.contains('is-hidden')) return;
        (modeMenu?.classList.toggle('show'),
          (modelMenu.style.display = 'none'),
          closeImageFunctionModelSubmenus(modelMenu));
      }),
      run2());
    const value18 = (event11) => {
      !el7.contains(event11.target) &&
        !modelMenu.contains(event11.target) &&
        !el8?.contains(event11.target) &&
        !modeMenu?.contains(event11.target) &&
        ((modelMenu.style.display = 'none'),
        modeMenu?.classList.remove('show'),
        closeImageFunctionModelSubmenus(modelMenu));
    };
    (document.addEventListener('mousedown', value18),
      (this._cleanupModelMenu = () => {
        document.removeEventListener('mousedown', value18);
      }));
  },
  _getModelIconHtml(value19, value20 = '') {
    return getImageFunctionModelTriggerIconHTML(
      value19,
      _resolveImageProvider(value19, value20),
      this._modelCatalog || buildImageFreeAngleModelCatalog(),
    );
  },
  _exit() {
    if (!this.active) return;
    ((this.active = false), (this.nodeId = null));
    this._unsubscribeLocale && (this._unsubscribeLocale(), (this._unsubscribeLocale = null));
    if (this._cleanupHandlers) this._cleanupHandlers();
    if (this._cleanupModelMenu) this._cleanupModelMenu();
    if (this._cleanupSubmenuClick) this._cleanupSubmenuClick();
    if (this.containerEl) this.containerEl.innerHTML = '';
    this.triggerBtn &&
      ((this.triggerBtn.innerHTML = this._oldTriggerContent),
      this._oldTriggerTooltip != null
        ? this.triggerBtn.setAttribute('data-tooltip', this._oldTriggerTooltip)
        : this.triggerBtn.removeAttribute('data-tooltip'),
      this._oldTriggerAriaLabel != null
        ? this.triggerBtn.setAttribute('aria-label', this._oldTriggerAriaLabel)
        : this.triggerBtn.removeAttribute('aria-label'),
      this._oldTriggerTitle != null
        ? this.triggerBtn.setAttribute('title', this._oldTriggerTitle)
        : this.triggerBtn.removeAttribute('title'),
      this.triggerBtn.classList.remove('ftb-btn-exit'));
    ((this._oldTriggerContent = null),
      (this._oldTriggerTooltip = null),
      (this._oldTriggerAriaLabel = null),
      (this._oldTriggerTitle = null),
      (this._modelCatalog = null));
    if (this.onDone) this.onDone();
  },
  async _handleGenerate() {
    if (!this.nodeId) return;
    const { rotation: rotation3, pitch: pitch3, scale: scale3 } = this.state;
    appStore.updateNodeData(this.nodeId, {
      cameraAngle: { rotation: rotation3, pitch: pitch3, scale: scale3 },
    });
    const value21 = appStore.getStateRaw(),
      imageSize2 = value21.nodes?.[this.nodeId];
    if (!imageSize2) return;
    let model4 = this._currentModel || 'nano-banana-2';
    const provider4 = _resolveImageProvider(model4, this._currentProvider || imageSize2.provider);
    let inputUrls = null;
    const el9 = document.getElementById(this.nodeId);
    if (el9) {
      const value22 = el9.querySelector('img');
      value22 && (inputUrls = value22.src);
    }
    !inputUrls && imageSize2.imageUrl && (inputUrls = imageSize2.imageUrl);
    !inputUrls && imageSize2.outputImage && (inputUrls = imageSize2.outputImage);
    let aspectRatio = imageSize2.aspectRatio || '1:1';
    if (aspectRatio === '自适应' || aspectRatio === 'auto' || aspectRatio === '1:1') {
      if (inputUrls) {
        let enabled7 = imageSize2.imgWidth || imageSize2.naturalWidth || 0,
          enabled8 = imageSize2.imgHeight || imageSize2.naturalHeight || 0;
        !enabled7 &&
          imageSize2.src &&
          imageSize2.type === 'source-image' &&
          ((enabled7 = imageSize2.originalWidth || 0), (enabled8 = imageSize2.originalHeight || 0));
        if (!enabled7 || !enabled8) {
          const el10 = document.getElementById(this.nodeId);
          if (el10) {
            const value23 = el10.querySelector('img');
            value23 &&
              value23.naturalWidth &&
              value23.naturalHeight &&
              ((enabled7 = value23.naturalWidth), (enabled8 = value23.naturalHeight));
          }
        }
        if (enabled7 && enabled8) {
          const value24 = enabled7 / enabled8,
            list = [
              { label: '1:1', calc: 1 / 1 },
              { label: '9:16', calc: 9 / 16 },
              { label: '16:9', calc: 16 / 9 },
              { label: '3:4', calc: 3 / 4 },
              { label: '4:3', calc: 4 / 3 },
              { label: '3:2', calc: 3 / 2 },
              { label: '2:3', calc: 2 / 3 },
              { label: '5:4', calc: 5 / 4 },
              { label: '4:5', calc: 4 / 5 },
              { label: '21:9', calc: 21 / 9 },
            ];
          let value25 = list[0],
            value26 = Math.abs(value24 - value25.calc);
          for (let value27 = 1; value27 < list.length; value27++) {
            const value28 = Math.abs(value24 - list[value27].calc);
            value28 < value26 && ((value26 = value28), (value25 = list[value27]));
          }
          aspectRatio = value25.label;
        }
      }
    }
    await ensureConfig();
    const providerConfig = getProviderConfig(provider4);
    let apiKey3 = '';
    if (provider4 === 'runninghub')
      apiKey3 = isRunningHubModelApiImageTask(model4, provider4)
        ? providerConfig.modelApiKey || ''
        : providerConfig.apiKey || '';
    else
      provider4 === 'runninghubwf'
        ? (apiKey3 = providerConfig.apiKey || '')
        : (apiKey3 = providerConfig.apiKey || window._appApiKey || '');
    const value29 = {
        prompt: '',
        model: model4,
        aspectRatio: aspectRatio,
        imageSize: imageSize2.imageSize || '2K',
        batchSize: 1,
        inputUrls: inputUrls ? [inputUrls] : [],
        apiKey: apiKey3,
        provider: provider4,
        cameraAngle: { rotation: rotation3, pitch: pitch3, scale: scale3 },
      },
      startedAt2 = Date.now(),
      _isRunningHubTaskModel2 = _isRunningHubTaskModel(model4, provider4),
      _isDreaminaTaskModel2 = _isDreaminaTaskModel(model4, provider4),
      value30 = !_isRunningHubTaskModel2 && !_isDreaminaTaskModel2,
      provider5 = String(provider4 || '')
        .trim()
        .toLowerCase(),
      useOpenapiQuery2 = shouldUseRunningHubOpenapiQuery(model4, provider4);
    let width = 0x120,
      height = 0x120;
    const list2 = aspectRatio.split(':');
    if (list2.length === 2) {
      const value31 = parseFloat(list2[0]),
        value32 = parseFloat(list2[1]);
      if (value31 && value32) {
        const box2 = getAutoMediaSizeByShortSide(value31, value32);
        ((width = box2.width), (height = box2.height));
      }
    }
    const { x: x3, y: y } = calcSafeSpawnPosNearNode(value21.nodes, imageSize2, width, height),
      id = generateId('source-image-rotate'),
      handler5 = () => {
        return isTaskCancelled(appStore.getState().nodes?.[id]);
      },
      imageFunctionModelDisplayName2 = getImageFunctionModelDisplayName(
        model4,
        this._modelCatalog || buildImageFreeAngleModelCatalog(),
      );
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: id,
        type: 'source-image',
        x: x3,
        y: y,
        width: width,
        height: height,
        name: freeAngleText('output.generatingName'),
        src: '',
        ...buildGenerationStartPatch({ startedAt: startedAt2 }),
        ...(_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value30
          ? { provider: provider4, model: model4 }
          : {}),
        ...(_isRunningHubTaskModel2
          ? { rhSourceNodeId: imageSize2.id, rhToolbarTaskType: 'image-free-angle' }
          : {}),
        ...(_isRunningHubTaskModel2
          ? _buildRunningHubTaskPatch({
              taskId: '',
              status: 'pending',
              startedAt: startedAt2,
              recovering: false,
              useOpenapiQuery: useOpenapiQuery2,
            })
          : {}),
        ...(_isDreaminaTaskModel2
          ? _buildDreaminaTaskPatch({
              submitId: '',
              status: 'pending',
              phase: 'generating',
              label: freeAngleText('task.submitting'),
              startedAt: startedAt2,
              recovering: false,
            })
          : {}),
        ...(value30
          ? _buildAsyncTaskPatch({
              provider: provider5,
              kind: 'image',
              taskId: '',
              status: 'pending',
              startedAt: startedAt2,
              recovering: false,
            })
          : {}),
        outputText: buildFreeAngleOutputText(imageFunctionModelDisplayName2, {
          rotation: rotation3,
          pitch: pitch3,
          scale: scale3,
        }),
      }),
    );
    (_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value30) && _persistRunningHubResumeCache();
    appStore.setSelectedNodes([id]);
    typeof window.v2FocusOnNodes === 'function'
      ? window.v2FocusOnNodes([imageSize2.id, id])
      : window.v2FocusOnNode?.(id);
    try {
      const generateImage2 = await generateImage(value29, {
        onTaskMeta: ({ taskId: taskId2, useOpenapiQuery: useOpenapiQuery3, provider: provider6 }) => {
          const taskId3 = String(taskId2 || '').trim();
          if (!taskId3) return;
          const enabled9 = appStore.getState().nodes?.[id];
          if (!enabled9) return;
          if (handler5()) return;
          if (_isRunningHubTaskModel2) {
            (appStore.updateNodeData(id, {
              ..._buildRunningHubTaskPatch({
                taskId: taskId3,
                status: 'running',
                startedAt: startedAt2,
                recovering: false,
                useOpenapiQuery: useOpenapiQuery3 === true,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (_isDreaminaTaskModel2) {
            (appStore.updateNodeData(id, {
              ..._buildDreaminaTaskPatch({
                submitId: taskId3,
                status: 'pending',
                phase: 'generating',
                label: freeAngleText('task.generating'),
                startedAt: startedAt2,
                recovering: false,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          value30 &&
            (appStore.updateNodeData(id, {
              ..._buildAsyncTaskPatch({
                provider: String(provider6 || enabled9?.asyncTaskProvider || provider5).trim(),
                kind: 'image',
                taskId: taskId3,
                status: 'running',
                startedAt: startedAt2,
                recovering: false,
              }),
            }),
            _persistRunningHubResumeCache());
        },
        onTaskId: (value33) => {
          const taskId4 = String(value33 || '').trim();
          if (!taskId4) return;
          const useOpenapiQuery4 = appStore.getState().nodes?.[id];
          if (!useOpenapiQuery4) return;
          if (handler5()) return;
          if (_isRunningHubTaskModel2) {
            (appStore.updateNodeData(id, {
              ..._buildRunningHubTaskPatch({
                taskId: taskId4,
                status: 'running',
                startedAt: startedAt2,
                recovering: false,
                useOpenapiQuery: useOpenapiQuery4?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (_isDreaminaTaskModel2) {
            (appStore.updateNodeData(id, {
              ..._buildDreaminaTaskPatch({
                submitId: taskId4,
                status: 'pending',
                phase: 'generating',
                label: freeAngleText('task.generating'),
                startedAt: startedAt2,
                recovering: false,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          value30 &&
            (appStore.updateNodeData(id, {
              ..._buildAsyncTaskPatch({
                provider: String(useOpenapiQuery4?.asyncTaskProvider || provider5).trim(),
                kind: 'image',
                taskId: taskId4,
                status: 'running',
                startedAt: startedAt2,
                recovering: false,
              }),
            }),
            _persistRunningHubResumeCache());
        },
      });
      if (handler5()) return;
      const sourceUrl =
        generateImage2 &&
        generateImage2.isBatch &&
        Array.isArray(generateImage2.images) &&
        generateImage2.images[0]
          ? generateImage2.images[0]
          : generateImage2;
      if (sourceUrl?.error) throw new Error(String(sourceUrl.error));
      const localPath = pickResultLocalPath(sourceUrl),
        src =
          localPathToUrl(localPath) || sourceUrl?.sourceUrl || sourceUrl?.imageUrl || sourceUrl?.url || '';
      if (!src) throw new Error(freeAngleText('errors.noGeneratedImageUrl'));
      const run3 = (value34) => {
          const value35 = String(value34 || ''),
            value36 = value35.split('/').pop() || '';
          return value36;
        },
        taskId5 = appStore.getState().nodes?.[id],
        duration2 = taskId5?.generationStartTime ? Date.now() - taskId5.generationStartTime : 0,
        args = buildImageGenerationResultPatch(
          {
            ...sourceUrl,
            localPath: localPath,
            sourceUrl: sourceUrl?.sourceUrl || sourceUrl?.imageUrl || src,
            imageUrl: sourceUrl?.imageUrl || sourceUrl?.sourceUrl || src,
            thumbUrl: sourceUrl?.thumbUrl || sourceUrl?.sourceUrl || sourceUrl?.imageUrl || '',
          },
          { startedAt: startedAt2, duration: duration2 },
        );
      (appStore.updateNodeData(id, {
        ...args,
        name: freeAngleText('output.resultName'),
        src: src,
        fileName: localPath ? run3(localPath) : '',
        ...(_isRunningHubTaskModel2
          ? _buildRunningHubTaskPatch({
              taskId: taskId5?.rhTaskId || '',
              status: 'success',
              startedAt: startedAt2,
              recovering: false,
              useOpenapiQuery: taskId5?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
            })
          : {}),
        ...(_isDreaminaTaskModel2
          ? _buildDreaminaTaskPatch({
              submitId: taskId5?.dreaminaSubmitId || '',
              status: 'success',
              phase: 'done',
              label: freeAngleText('task.completed'),
              startedAt: startedAt2,
              recovering: false,
            })
          : {}),
        ...(value30
          ? _buildAsyncTaskPatch({
              provider: taskId5?.asyncTaskProvider || provider5,
              kind: 'image',
              taskId: taskId5?.asyncTaskId || '',
              status: 'success',
              startedAt: startedAt2,
              recovering: false,
            })
          : {}),
      }),
        (_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value30) && _persistRunningHubResumeCache(),
        window.showToast?.(freeAngleText('toasts.success'), 'success'));
    } catch (error) {
      if (handler5()) return;
      const taskId6 = appStore.getState().nodes?.[id];
      if (taskId6) {
        const duration3 = taskId6?.generationStartTime ? Date.now() - taskId6.generationStartTime : 0,
          error2 = error?.message || freeAngleText('errors.unknown');
        (appStore.updateNodeData(id, {
          ...buildImageGenerationFailurePatch({
            error: error2,
            startedAt: startedAt2,
            duration: duration3,
          }),
          name: freeAngleText('output.failedName'),
          src: '',
          ...(_isRunningHubTaskModel2
            ? _buildRunningHubTaskPatch({
                taskId: taskId6?.rhTaskId || '',
                status: 'failed',
                startedAt: startedAt2,
                recovering: false,
                useOpenapiQuery: taskId6?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
              })
            : {}),
          ...(_isDreaminaTaskModel2
            ? _buildDreaminaTaskPatch({
                submitId: taskId6?.dreaminaSubmitId || '',
                status: 'failed',
                phase: 'failed',
                label: error2 || freeAngleText('task.failed'),
                startedAt: startedAt2,
                recovering: false,
              })
            : {}),
          ...(value30
            ? _buildAsyncTaskPatch({
                provider: taskId6?.asyncTaskProvider || provider5,
                kind: 'image',
                taskId: taskId6?.asyncTaskId || '',
                status: 'failed',
                startedAt: startedAt2,
                recovering: false,
              })
            : {}),
          outputText: freeAngleText('output.failedReason', { error: error2 }),
        }),
          (_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value30) && _persistRunningHubResumeCache());
      }
      window.showToast?.(
        freeAngleText('toasts.failed', { error: error?.message || freeAngleText('errors.unknown') }),
        'error',
      );
    }
  },
  async _handleDebug() {
    if (!this.nodeId) return;
    const value37 = appStore.getStateRaw(),
      imageSize3 = value37.nodes?.[this.nodeId];
    if (!imageSize3) return;
    let model5 = this._currentModel || 'nano-banana-2';
    const provider7 = _resolveImageProvider(model5, this._currentProvider || imageSize3.provider),
      { rotation: rotation4, pitch: pitch4, scale: scale4 } = this.state;
    let inputUrls2 = null;
    const el11 = document.getElementById(this.nodeId);
    if (el11) {
      const value38 = el11.querySelector('img');
      value38 && (inputUrls2 = value38.src);
    }
    !inputUrls2 && imageSize3.imageUrl && (inputUrls2 = imageSize3.imageUrl);
    !inputUrls2 && imageSize3.outputImage && (inputUrls2 = imageSize3.outputImage);
    let aspectRatio2 = imageSize3.aspectRatio || '1:1';
    if (aspectRatio2 === '自适应' || aspectRatio2 === 'auto' || aspectRatio2 === '1:1') {
      if (inputUrls2) {
        let enabled10 = imageSize3.imgWidth || imageSize3.naturalWidth || 0,
          enabled11 = imageSize3.imgHeight || imageSize3.naturalHeight || 0;
        !enabled10 &&
          imageSize3.src &&
          imageSize3.type === 'source-image' &&
          ((enabled10 = imageSize3.originalWidth || 0), (enabled11 = imageSize3.originalHeight || 0));
        if (!enabled10 || !enabled11) {
          if (el11) {
            const value39 = el11.querySelector('img');
            value39 &&
              value39.naturalWidth &&
              value39.naturalHeight &&
              ((enabled10 = value39.naturalWidth), (enabled11 = value39.naturalHeight));
          }
        }
        if (enabled10 && enabled11) {
          const value40 = enabled10 / enabled11,
            list3 = [
              { label: '1:1', calc: 1 / 1 },
              { label: '9:16', calc: 9 / 16 },
              { label: '16:9', calc: 16 / 9 },
              { label: '3:4', calc: 3 / 4 },
              { label: '4:3', calc: 4 / 3 },
              { label: '3:2', calc: 3 / 2 },
              { label: '2:3', calc: 2 / 3 },
              { label: '5:4', calc: 5 / 4 },
              { label: '4:5', calc: 4 / 5 },
              { label: '21:9', calc: 21 / 9 },
            ];
          let value41 = list3[0],
            value42 = Math.abs(value40 - value41.calc);
          for (let value43 = 1; value43 < list3.length; value43++) {
            const value44 = Math.abs(value40 - list3[value43].calc);
            value44 < value42 && ((value42 = value44), (value41 = list3[value43]));
          }
          aspectRatio2 = value41.label;
        }
      }
    }
    await ensureConfig();
    const providerConfig2 = getProviderConfig(provider7);
    let apiKey4 = '';
    if (provider7 === 'runninghub')
      apiKey4 = isRunningHubModelApiImageTask(model5, provider7)
        ? providerConfig2.modelApiKey || ''
        : providerConfig2.apiKey || '';
    else
      provider7 === 'runninghubwf'
        ? (apiKey4 = providerConfig2.apiKey || '')
        : (apiKey4 = providerConfig2.apiKey || window._appApiKey || '');
    const value45 = {
      prompt: '',
      model: model5,
      aspectRatio: aspectRatio2,
      imageSize: imageSize3.imageSize || '2K',
      batchSize: 1,
      inputUrls: inputUrls2 ? [inputUrls2] : [],
      apiKey: apiKey4,
      provider: provider7,
      cameraAngle: { rotation: rotation4, pitch: pitch4, scale: scale4 },
    };
    try {
      const generateImageRequest = await buildGenerateImageRequest(value45),
        outputText2 = formatFinalApiDebugRequest(generateImageRequest),
        { x: x4, y: y2 } = calcSafeSpawnPosNearNode(value37.nodes, imageSize3, 0x17c, 0x12c);
      let enabled12 = Object.values(value37.nodes).find((item2) => item2.type === 'debug');
      !enabled12
        ? appStore.addNode({
            id: 'debug-' + Date.now(),
            type: 'debug',
            x: x4,
            y: y2,
            width: 0x17c,
            height: 0x12c,
            name: freeAngleText('debug.nodeName'),
            outputText: outputText2,
          })
        : appStore.updateNodeData(enabled12.id, { outputText: outputText2, x: x4, y: y2 });
    } catch (error3) {
      (console.error('[ImageFreeAngleController] 调试请求构建失败:', error3),
        window.showToast?.(
          freeAngleText('toasts.debugBuildFailed', {
            error: error3?.message || freeAngleText('errors.unknown'),
          }),
          'error',
        ));
    }
  },
};
export default ImageFreeAngleController;
