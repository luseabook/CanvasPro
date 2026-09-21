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
function _computeGenerationDuration(_0x55803d) {
  if (!_0x55803d) return 0;
  if (typeof _0x55803d.generationDuration === 'number') return _0x55803d.generationDuration;
  const _0x46f053 = Number(_0x55803d.generationStartTime);
  if (!Number.isFinite(_0x46f053) || _0x46f053 <= 0) return 0;
  return Math.max(0, Date.now() - _0x46f053);
}
function _isRunningHubTaskModel(_0x57333c, _0x171c64) {
  return isRunningHubImageTaskModel(_0x57333c, _0x171c64);
}
function _isDreaminaTaskModel(_0x67a444, _0x16f646) {
  return isDreaminaImageTaskModel(_0x67a444, _0x16f646);
}
function freeAngleText(_0x390b24, _0xe8d109 = {}) {
  return t('imageFreeAngle.' + _0x390b24, _0xe8d109);
}
function buildFreeAngleOutputText(
  _0x453e65,
  { rotation: _0x3a8b14, pitch: _0x1de04a, scale: _0x229027 } = {},
) {
  return freeAngleText('output.angle', {
    model: _0x453e65,
    rotation: _0x3a8b14,
    pitch: _0x1de04a,
    scale: _0x229027,
  });
}
function _resolveImageProvider(_0x4e7724, _0x11d7c0 = '') {
  return resolveImageTaskProvider(_0x4e7724, _0x11d7c0, 'grsai');
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
  const _0x40220f = {
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
    _0x1cb7ee = (_0x1a494e) => {
      if (!_0x1a494e || _0x40220f.originHtml) return;
      ((_0x40220f.originHtml = _0x1a494e.innerHTML),
        (_0x40220f.originColor = _0x1a494e.style.color || ''),
        (_0x40220f.originTooltip = _0x1a494e.dataset.tooltip || ''),
        (_0x40220f.originAria = _0x1a494e.getAttribute('aria-label') || ''),
        (_0x40220f.originTitle = _0x1a494e.title || ''));
    },
    _0x2bbb51 = (_0x187cda) => {
      if (!_0x187cda) return;
      (_0x1cb7ee(_0x187cda),
        (_0x187cda.style.color = 'var(--red)'),
        (_0x187cda.dataset.tooltip = freeAngleText('runningTask.clickCancel')),
        _0x187cda.setAttribute('aria-label', freeAngleText('runningTask.cancel')),
        (_0x187cda.title = freeAngleText('runningTask.clickCancelTask')),
        (_0x187cda.innerHTML = GENERATE_CANCEL_ICON_HTML));
    },
    _0x357594 = (_0x3cc0be) => {
      if (!_0x3cc0be) return;
      if (_0x40220f.originHtml) _0x3cc0be.innerHTML = _0x40220f.originHtml;
      _0x3cc0be.style.color = _0x40220f.originColor || '';
      if (_0x40220f.originTooltip) _0x3cc0be.dataset.tooltip = _0x40220f.originTooltip;
      else delete _0x3cc0be.dataset.tooltip;
      if (_0x40220f.originAria) _0x3cc0be.setAttribute('aria-label', _0x40220f.originAria);
      else _0x3cc0be.removeAttribute('aria-label');
      _0x3cc0be.title = _0x40220f.originTitle || '';
    },
    _0x510e20 = ({
      button: _0x12433f,
      apiKey: _0x505b44,
      abortController: _0x459099,
      outNodeId: _0x47d266,
    }) => {
      ((_0x40220f.active = true),
        (_0x40220f.cancelRequested = false),
        (_0x40220f.apiKey = _0x505b44 || ''),
        (_0x40220f.taskId = ''),
        (_0x40220f.abortController = _0x459099 || null),
        (_0x40220f.outNodeId = _0x47d266 || ''),
        _0x2bbb51(_0x12433f));
    },
    _0x17bbc9 = (_0x22562b) => {
      _0x40220f.taskId = _0x22562b ? String(_0x22562b) : '';
    },
    _0x30ec8a = () => !!_0x40220f.cancelRequested || !!_0x40220f.abortController?.signal?.aborted,
    _0x342665 = async () => {
      _0x40220f.cancelRequested = true;
      try {
        _0x40220f.abortController?.abort?.();
      } catch {}
      _0x40220f.apiKey &&
        _0x40220f.taskId &&
        (await cancelRunningHubTask({ apiKey: _0x40220f.apiKey, taskId: _0x40220f.taskId }));
    },
    _0x2eca87 = ({ nodeId: _0x459e07, name: _0x24d608, outputText: _0x12fd52 }) => {
      const _0x10be88 = _0x459e07 || _0x40220f.outNodeId;
      if (!_0x10be88) return;
      const _0x150459 = appStore.getState().nodes?.[_0x10be88];
      if (!_0x150459) return;
      const _0x6f1dc6 = _computeGenerationDuration(_0x150459);
      appStore.updateNodeData(_0x10be88, {
        ...buildGenerationCancelledPatch({ duration: _0x6f1dc6 }),
        name: _0x24d608,
        outputText: _0x12fd52,
        jobStatus: null,
      });
    },
    _0x58f01e = (_0x327a85) => {
      ((_0x40220f.active = false),
        (_0x40220f.cancelRequested = false),
        (_0x40220f.apiKey = ''),
        (_0x40220f.taskId = ''),
        (_0x40220f.abortController = null),
        (_0x40220f.outNodeId = ''),
        _0x357594(_0x327a85));
    };
  return {
    state: _0x40220f,
    bindButton: _0x1cb7ee,
    activate: _0x510e20,
    setTaskId: _0x17bbc9,
    isCancelled: _0x30ec8a,
    cancel: _0x342665,
    finalizeCancelledNode: _0x2eca87,
    reset: _0x58f01e,
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
  async render(_0x23eef3, _0x538321, _0x1288c1, _0xad10ff, _0x44d0c9) {
    const _0xa466ba = appStore.getStateRaw(),
      _0x43d227 = _0xa466ba.nodes?.[_0x23eef3];
    if (!_0x43d227) return;
    if (this.active && this.nodeId === _0x23eef3) return;
    this.active && this.nodeId !== _0x23eef3 && this._exit();
    ((this.active = true),
      (this.nodeId = _0x23eef3),
      (this.nodeData = _0x43d227),
      (this.containerEl = _0x538321),
      (this.onDone = _0x1288c1),
      (this.onGenerate = _0xad10ff),
      (this.triggerBtn = _0x44d0c9));
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
    const _0x314bdb = getDefaultImageFreeAngleModelState(this._modelCatalog);
    ((this._currentModel = _0x314bdb.model || 'nano-banana'),
      (this._currentProvider = _0x314bdb.provider || 'grsai'),
      await this._createUI(),
      this._bindEvents(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      this._syncLocaleTexts(),
      this._updateView());
  },
  async _createUI() {
    const _0x14fd21 = this.containerEl;
    _0x14fd21.innerHTML = '';
    const _0x532f40 = document.createElement('div');
    _0x532f40.className = 'v2-free-angle-embedded';
    let _0xc61008 =
      this.nodeData.imageUrl ||
      this.nodeData.sourceUrl ||
      this.nodeData.thumbUrl ||
      this.nodeData.src ||
      localPathToUrl(this.nodeData.localPath);
    if (this.nodeData.thumbId)
      try {
        const _0x4add21 = await getImage(this.nodeData.thumbId);
        if (_0x4add21) _0xc61008 = URL.createObjectURL(_0x4add21);
      } catch (_0x236b21) {
        console.error('FA load blob failed', _0x236b21);
      }
    const _0x50c440 = this._modelCatalog || buildImageFreeAngleModelCatalog();
    this._modelCatalog = _0x50c440;
    const _0x2cf4c7 = buildImageFunctionModelMenuHTML({
      activeModel: this._currentModel,
      activeProvider: this._currentProvider,
      modelCatalog: _0x50c440,
    });
    ((_0x532f40.innerHTML =
      '\n      <div class="fa-header">\n        <span class="fa-title">' +
      freeAngleText('panel.title') +
      '</span>\n        <button class="fa-close-btn">×</button>\n      </div>\n      <div class="fa-content">\n        <div class="fa-preview-area">\n          <button class="fa-reset-btn">' +
      freeAngleText('actions.reset') +
      '</button>\n          <div class="fa-cube-container">\n            <div class="fa-cube">\n              <div class="fa-cube-face face-front">\n                <img src="' +
      _0xc61008 +
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
      getImageFunctionModelDisplayName(this._currentModel, _0x50c440) +
      '</span>\n                <svg class="fa-model-chevron image-function-model-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>\n              </button>\n              <div class="fa-model-menu floating-menu image-function-model-menu">\n                ' +
      _0x2cf4c7 +
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
      (_0x532f40.querySelector('.fa-close-btn').onclick = () => this._exit()),
      _0x532f40.addEventListener('click', (_0x86a79b) => {
        _0x86a79b.stopPropagation();
      }),
      _0x532f40.addEventListener('mousedown', (_0x5604f6) => {
        _0x5604f6.stopPropagation();
      }),
      _0x14fd21.appendChild(_0x532f40),
      (this.cubeEl = _0x532f40.querySelector('.fa-cube')),
      (this.wrapperEl = _0x532f40));
  },
  _syncLocaleTexts() {
    this.triggerBtn?.classList?.contains('ftb-btn-exit') &&
      (this.triggerBtn.setAttribute('data-tooltip', freeAngleText('actions.exit')),
      this.triggerBtn.setAttribute('aria-label', freeAngleText('actions.exitControl')),
      this.triggerBtn.setAttribute('title', freeAngleText('actions.exitControl')));
    if (!this.wrapperEl) return;
    const _0x1e375b = (_0x101066, _0x3d6a6c) => {
        const _0x43cdf9 = this.wrapperEl.querySelector(_0x101066);
        if (_0x43cdf9) _0x43cdf9.textContent = _0x3d6a6c;
      },
      _0xeb1bc6 = (_0x29fd5e, _0x128cd1) => {
        const _0x41763f = this.wrapperEl.querySelector(_0x29fd5e);
        if (_0x41763f) _0x41763f.title = _0x128cd1;
      };
    (_0x1e375b('.fa-title', freeAngleText('panel.title')),
      _0x1e375b('.fa-reset-btn', freeAngleText('actions.reset')),
      _0x1e375b('.face-back', freeAngleText('cube.back')),
      _0x1e375b('.face-right', freeAngleText('cube.right')),
      _0x1e375b('.face-left', freeAngleText('cube.left')),
      _0x1e375b('.face-top', freeAngleText('cube.top')),
      _0x1e375b('.face-bottom', freeAngleText('cube.bottom')),
      _0x1e375b('.fa-label-rotation', freeAngleText('controls.rotation')),
      _0x1e375b('.fa-label-pitch', freeAngleText('controls.pitch')),
      _0x1e375b('.fa-label-distance', freeAngleText('controls.distance')),
      _0xeb1bc6('.fa-debug-btn', freeAngleText('actions.debugApiParams')),
      _0xeb1bc6('.fa-gen-btn', freeAngleText('actions.generate')));
  },
  _updateView() {
    if (!this.active) return;
    const { rotation: _0x4f8305, pitch: _0x296340, scale: _0x36990f } = this.state,
      _0xa3e514 = ((_0x4f8305 % 0x168) + 0x168) % 0x168;
    ((this.wrapperEl.querySelector('#val-rotation').textContent = _0xa3e514.toFixed(1) + '°'),
      (this.wrapperEl.querySelector('#val-pitch').textContent = _0x296340.toFixed(1) + '°'),
      (this.wrapperEl.querySelector('#val-scale').textContent = '' + _0x36990f.toFixed(2)),
      (this.wrapperEl.querySelector('#sld-rotation').value = _0xa3e514),
      (this.wrapperEl.querySelector('#sld-pitch').value = _0x296340),
      (this.wrapperEl.querySelector('#sld-scale').value = _0x36990f),
      (this.cubeEl.style.transform =
        'rotateX(' + -_0x296340 + 'deg) rotateY(' + (_0xa3e514 - 0x168) + 'deg)'));
    const _0x54f9ad =
      FREE_ANGLE_VISUAL_SCALE_MIN +
      (_0x36990f - FREE_ANGLE_DISTANCE_MIN) *
        ((FREE_ANGLE_PREVIOUS_DISTANCE_ONE_VISUAL_SCALE - FREE_ANGLE_VISUAL_SCALE_MIN) /
          (FREE_ANGLE_DISTANCE_MAX - FREE_ANGLE_DISTANCE_MIN));
    this.cubeEl.parentElement.style.transform = 'scale(' + _0x54f9ad + ')';
  },
  _bindEvents() {
    const _0x25f360 = this.wrapperEl;
    ((_0x25f360.querySelector('#sld-rotation').oninput = (_0x19e4c0) => {
      ((this.state.rotation = parseFloat(_0x19e4c0.target.value)), this._updateView());
    }),
      (_0x25f360.querySelector('#sld-pitch').oninput = (_0x5529a8) => {
        ((this.state.pitch = parseFloat(_0x5529a8.target.value)), this._updateView());
      }),
      (_0x25f360.querySelector('#sld-scale').oninput = (_0xa7509) => {
        ((this.state.scale = parseFloat(_0xa7509.target.value)), this._updateView());
      }),
      (_0x25f360.querySelector('.fa-reset-btn').onclick = () => {
        ((this.state = { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } }), this._updateView());
      }));
    const _0xc9c9d0 = _0x25f360.querySelector('.fa-preview-area');
    let _0x28003b = false,
      _0x15a41e = false,
      _0x186be2 = { x: 0, y: 0 };
    _0xc9c9d0.onmousedown = (_0x52c2df) => {
      _0x28003b = true;
      if (_0x52c2df.button === 2) _0x15a41e = true;
      ((_0x186be2 = { x: _0x52c2df.clientX, y: _0x52c2df.clientY }),
        _0x52c2df.preventDefault(),
        _0x52c2df.stopPropagation());
    };
    const _0x50c82f = (_0x2ed519) => {
        if (!_0x28003b) return;
        const _0x8a2471 = _0x2ed519.clientX - _0x186be2.x,
          _0x39e284 = _0x2ed519.clientY - _0x186be2.y;
        ((_0x186be2 = { x: _0x2ed519.clientX, y: _0x2ed519.clientY }),
          _0x15a41e && ((this.state.pan.x += _0x8a2471), (this.state.pan.y += _0x39e284)),
          !_0x15a41e &&
            ((this.state.rotation += _0x8a2471 * 0.5),
            (this.state.pitch += _0x39e284 * 0.5),
            (this.state.pitch = Math.max(-30, Math.min(60, this.state.pitch)))),
          this._updateView());
      },
      _0x20f222 = () => {
        ((_0x28003b = false), (_0x15a41e = false));
      };
    (window.addEventListener('mousemove', _0x50c82f),
      window.addEventListener('mouseup', _0x20f222),
      (this._cleanupHandlers = () => {
        (window.removeEventListener('mousemove', _0x50c82f),
          window.removeEventListener('mouseup', _0x20f222));
      }),
      (_0xc9c9d0.onwheel = (_0x1e7bf1) => {
        (_0x1e7bf1.preventDefault(), _0x1e7bf1.stopPropagation());
        const _0x1cd657 = _0x1e7bf1.deltaY > 0 ? -0.05 : 0.05;
        ((this.state.scale = Math.max(0.1, Math.min(2, this.state.scale + _0x1cd657))), this._updateView());
      }),
      (_0xc9c9d0.oncontextmenu = (_0x11394d) => _0x11394d.preventDefault()),
      (_0x25f360.querySelector('.fa-gen-btn').onclick = () => this._handleGenerate()),
      (_0x25f360.querySelector('.fa-debug-btn').onclick = (_0x965166) => {
        (_0x965166.stopPropagation(), this._handleDebug());
      }));
    const _0x272535 = _0x25f360.querySelector('.fa-model-btn'),
      _0x5ebb22 = _0x25f360.querySelector('.fa-model-menu'),
      _0x2857b8 = _0x25f360.querySelector('.fa-mode-btn'),
      _0x1d548c = _0x25f360.querySelector('.image-function-mode-menu'),
      _0x225e35 = this._modelCatalog || buildImageFreeAngleModelCatalog(),
      _0x34e1a9 = () => this.nodeData?.imageSize || '2K';
    _0x272535.onclick = (_0x5bfd90) => {
      _0x5bfd90.stopPropagation();
      const _0x31c85f = _0x5ebb22.style.display === 'block' || _0x5ebb22.style.display === 'flex';
      _0x31c85f
        ? ((_0x5ebb22.style.display = 'none'), closeImageFunctionModelSubmenus(_0x5ebb22))
        : ((_0x5ebb22.style.display = 'block'), _0x1d548c?.classList.remove('show'));
    };
    const _0x445a97 = () =>
        syncImageFunctionModeControl({
          root: _0x25f360,
          model: this._currentModel,
          provider: this._currentProvider,
          imageSize: _0x34e1a9(),
        }),
      _0x33a4df = (_0x15dfec, _0x18b47a) => {
        const _0x44ce6a = String(_0x15dfec || '').trim(),
          _0x18103e = _resolveImageProvider(_0x44ce6a, _0x18b47a);
        if (!_0x44ce6a || !_0x18103e) return;
        ((this._currentModel = _0x44ce6a), (this._currentProvider = _0x18103e));
        const _0x45aba0 = this._getModelIconHtml(_0x44ce6a, _0x18103e),
          _0x54c8d7 = getImageFunctionModelDisplayName(_0x44ce6a, _0x225e35);
        ((_0x272535.innerHTML =
          '\n        ' +
          _0x45aba0 +
          '\n        <span class="fa-model-label">' +
          _0x54c8d7 +
          '</span>\n        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"/></svg>\n      '),
          syncImageFunctionModelMenuActive({ modelMenu: _0x5ebb22, model: _0x44ce6a, provider: _0x18103e }),
          _0x445a97(),
          (_0x5ebb22.style.display = 'none'),
          closeImageFunctionModelSubmenus(_0x5ebb22),
          this.nodeId &&
            !isImageFreeAngleOnlyModel(_0x44ce6a) &&
            appStore.updateNodeData(this.nodeId, { model: _0x44ce6a, provider: _0x18103e }));
      },
      _0x150f76 = bindImageFunctionModelMenu({
        modelMenu: _0x5ebb22,
        onSelect: ({ model: _0x1b5b02, provider: _0x29ce1f }) => _0x33a4df(_0x1b5b02, _0x29ce1f),
        closeMenu: () => {
          _0x5ebb22.style.display = 'none';
        },
      }),
      _0x48ac45 = bindImageFunctionModeMenu({
        modeMenu: _0x1d548c,
        onSelect: ({ mode: _0x1a61b8 }) => {
          const _0x9fcee0 = resolveImageFunctionModelByMode({
            model: this._currentModel,
            provider: this._currentProvider,
            imageSize: _0x34e1a9(),
            mode: _0x1a61b8,
          });
          if (!_0x9fcee0?.model) return;
          (_0x33a4df(_0x9fcee0.model, _0x9fcee0.provider), _0x1d548c?.classList.remove('show'));
        },
      });
    ((this._cleanupSubmenuClick = () => {
      (_0x150f76?.(), _0x48ac45?.());
    }),
      _0x2857b8?.addEventListener('click', (_0x4e7be0) => {
        _0x4e7be0.stopPropagation();
        if (_0x2857b8.closest('.image-function-mode-wrap')?.classList.contains('is-hidden')) return;
        (_0x1d548c?.classList.toggle('show'),
          (_0x5ebb22.style.display = 'none'),
          closeImageFunctionModelSubmenus(_0x5ebb22));
      }),
      _0x445a97());
    const _0x12358c = (_0x57803d) => {
      !_0x272535.contains(_0x57803d.target) &&
        !_0x5ebb22.contains(_0x57803d.target) &&
        !_0x2857b8?.contains(_0x57803d.target) &&
        !_0x1d548c?.contains(_0x57803d.target) &&
        ((_0x5ebb22.style.display = 'none'),
        _0x1d548c?.classList.remove('show'),
        closeImageFunctionModelSubmenus(_0x5ebb22));
    };
    (document.addEventListener('mousedown', _0x12358c),
      (this._cleanupModelMenu = () => {
        document.removeEventListener('mousedown', _0x12358c);
      }));
  },
  _getModelIconHtml(_0x16b847, _0x130e61 = '') {
    return getImageFunctionModelTriggerIconHTML(
      _0x16b847,
      _resolveImageProvider(_0x16b847, _0x130e61),
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
    const { rotation: _0x123720, pitch: _0x502322, scale: _0x16e370 } = this.state;
    appStore.updateNodeData(this.nodeId, {
      cameraAngle: { rotation: _0x123720, pitch: _0x502322, scale: _0x16e370 },
    });
    const _0x163aae = appStore.getStateRaw(),
      _0x83cb29 = _0x163aae.nodes?.[this.nodeId];
    if (!_0x83cb29) return;
    let _0x343876 = this._currentModel || 'nano-banana-2';
    const _0x5c34ab = _resolveImageProvider(_0x343876, this._currentProvider || _0x83cb29.provider);
    let _0x4156aa = null;
    const _0x5b34c5 = document.getElementById(this.nodeId);
    if (_0x5b34c5) {
      const _0x5a681e = _0x5b34c5.querySelector('img');
      _0x5a681e && (_0x4156aa = _0x5a681e.src);
    }
    !_0x4156aa && _0x83cb29.imageUrl && (_0x4156aa = _0x83cb29.imageUrl);
    !_0x4156aa && _0x83cb29.outputImage && (_0x4156aa = _0x83cb29.outputImage);
    let _0x213daf = _0x83cb29.aspectRatio || '1:1';
    if (_0x213daf === '自适应' || _0x213daf === 'auto' || _0x213daf === '1:1') {
      if (_0x4156aa) {
        let _0x14b3fd = _0x83cb29.imgWidth || _0x83cb29.naturalWidth || 0,
          _0xa14629 = _0x83cb29.imgHeight || _0x83cb29.naturalHeight || 0;
        !_0x14b3fd &&
          _0x83cb29.src &&
          _0x83cb29.type === 'source-image' &&
          ((_0x14b3fd = _0x83cb29.originalWidth || 0), (_0xa14629 = _0x83cb29.originalHeight || 0));
        if (!_0x14b3fd || !_0xa14629) {
          const _0x3b84d9 = document.getElementById(this.nodeId);
          if (_0x3b84d9) {
            const _0x4816b8 = _0x3b84d9.querySelector('img');
            _0x4816b8 &&
              _0x4816b8.naturalWidth &&
              _0x4816b8.naturalHeight &&
              ((_0x14b3fd = _0x4816b8.naturalWidth), (_0xa14629 = _0x4816b8.naturalHeight));
          }
        }
        if (_0x14b3fd && _0xa14629) {
          const _0x2850f6 = _0x14b3fd / _0xa14629,
            _0x414e29 = [
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
          let _0xd5d214 = _0x414e29[0],
            _0x25598d = Math.abs(_0x2850f6 - _0xd5d214.calc);
          for (let _0x3ca122 = 1; _0x3ca122 < _0x414e29.length; _0x3ca122++) {
            const _0x52ce80 = Math.abs(_0x2850f6 - _0x414e29[_0x3ca122].calc);
            _0x52ce80 < _0x25598d && ((_0x25598d = _0x52ce80), (_0xd5d214 = _0x414e29[_0x3ca122]));
          }
          _0x213daf = _0xd5d214.label;
        }
      }
    }
    await ensureConfig();
    const _0x55417d = getProviderConfig(_0x5c34ab);
    let _0x126438 = '';
    if (_0x5c34ab === 'runninghub')
      _0x126438 = isRunningHubModelApiImageTask(_0x343876, _0x5c34ab)
        ? _0x55417d.modelApiKey || ''
        : _0x55417d.apiKey || '';
    else
      _0x5c34ab === 'runninghubwf'
        ? (_0x126438 = _0x55417d.apiKey || '')
        : (_0x126438 = _0x55417d.apiKey || window._appApiKey || '');
    const _0x5858c6 = {
        prompt: '',
        model: _0x343876,
        aspectRatio: _0x213daf,
        imageSize: _0x83cb29.imageSize || '2K',
        batchSize: 1,
        inputUrls: _0x4156aa ? [_0x4156aa] : [],
        apiKey: _0x126438,
        provider: _0x5c34ab,
        cameraAngle: { rotation: _0x123720, pitch: _0x502322, scale: _0x16e370 },
      },
      _0x24263c = Date.now(),
      _0x2e0057 = _isRunningHubTaskModel(_0x343876, _0x5c34ab),
      _0xa1a127 = _isDreaminaTaskModel(_0x343876, _0x5c34ab),
      _0x5727bf = !_0x2e0057 && !_0xa1a127,
      _0x2f9fab = String(_0x5c34ab || '')
        .trim()
        .toLowerCase(),
      _0x20a86b = shouldUseRunningHubOpenapiQuery(_0x343876, _0x5c34ab);
    let _0x3b646d = 0x120,
      _0x18a394 = 0x120;
    const _0x3285f3 = _0x213daf.split(':');
    if (_0x3285f3.length === 2) {
      const _0x3e5145 = parseFloat(_0x3285f3[0]),
        _0x62595c = parseFloat(_0x3285f3[1]);
      if (_0x3e5145 && _0x62595c) {
        const _0x3ebe29 = getAutoMediaSizeByShortSide(_0x3e5145, _0x62595c);
        ((_0x3b646d = _0x3ebe29.width), (_0x18a394 = _0x3ebe29.height));
      }
    }
    const { x: _0x1590e6, y: _0x1db6b8 } = calcSafeSpawnPosNearNode(
        _0x163aae.nodes,
        _0x83cb29,
        _0x3b646d,
        _0x18a394,
      ),
      _0x249927 = generateId('source-image-rotate'),
      _0x7ec737 = () => {
        return isTaskCancelled(appStore.getState().nodes?.[_0x249927]);
      },
      _0x74dc94 = getImageFunctionModelDisplayName(
        _0x343876,
        this._modelCatalog || buildImageFreeAngleModelCatalog(),
      );
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: _0x249927,
        type: 'source-image',
        x: _0x1590e6,
        y: _0x1db6b8,
        width: _0x3b646d,
        height: _0x18a394,
        name: freeAngleText('output.generatingName'),
        src: '',
        ...buildGenerationStartPatch({ startedAt: _0x24263c }),
        ...(_0x2e0057 || _0xa1a127 || _0x5727bf ? { provider: _0x5c34ab, model: _0x343876 } : {}),
        ...(_0x2e0057 ? { rhSourceNodeId: _0x83cb29.id, rhToolbarTaskType: 'image-free-angle' } : {}),
        ...(_0x2e0057
          ? _buildRunningHubTaskPatch({
              taskId: '',
              status: 'pending',
              startedAt: _0x24263c,
              recovering: false,
              useOpenapiQuery: _0x20a86b,
            })
          : {}),
        ...(_0xa1a127
          ? _buildDreaminaTaskPatch({
              submitId: '',
              status: 'pending',
              phase: 'generating',
              label: freeAngleText('task.submitting'),
              startedAt: _0x24263c,
              recovering: false,
            })
          : {}),
        ...(_0x5727bf
          ? _buildAsyncTaskPatch({
              provider: _0x2f9fab,
              kind: 'image',
              taskId: '',
              status: 'pending',
              startedAt: _0x24263c,
              recovering: false,
            })
          : {}),
        outputText: buildFreeAngleOutputText(_0x74dc94, {
          rotation: _0x123720,
          pitch: _0x502322,
          scale: _0x16e370,
        }),
      }),
    );
    (_0x2e0057 || _0xa1a127 || _0x5727bf) && _persistRunningHubResumeCache();
    appStore.setSelectedNodes([_0x249927]);
    typeof window.v2FocusOnNodes === 'function'
      ? window.v2FocusOnNodes([_0x83cb29.id, _0x249927])
      : window.v2FocusOnNode?.(_0x249927);
    try {
      const _0x30719e = await generateImage(_0x5858c6, {
        onTaskMeta: ({ taskId: _0x3f6ab6, useOpenapiQuery: _0x80e259, provider: _0x490deb }) => {
          const _0xea367c = String(_0x3f6ab6 || '').trim();
          if (!_0xea367c) return;
          const _0x529b36 = appStore.getState().nodes?.[_0x249927];
          if (!_0x529b36) return;
          if (_0x7ec737()) return;
          if (_0x2e0057) {
            (appStore.updateNodeData(_0x249927, {
              ..._buildRunningHubTaskPatch({
                taskId: _0xea367c,
                status: 'running',
                startedAt: _0x24263c,
                recovering: false,
                useOpenapiQuery: _0x80e259 === true,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (_0xa1a127) {
            (appStore.updateNodeData(_0x249927, {
              ..._buildDreaminaTaskPatch({
                submitId: _0xea367c,
                status: 'pending',
                phase: 'generating',
                label: freeAngleText('task.generating'),
                startedAt: _0x24263c,
                recovering: false,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          _0x5727bf &&
            (appStore.updateNodeData(_0x249927, {
              ..._buildAsyncTaskPatch({
                provider: String(_0x490deb || _0x529b36?.asyncTaskProvider || _0x2f9fab).trim(),
                kind: 'image',
                taskId: _0xea367c,
                status: 'running',
                startedAt: _0x24263c,
                recovering: false,
              }),
            }),
            _persistRunningHubResumeCache());
        },
        onTaskId: (_0x3dc3fc) => {
          const _0x5ab039 = String(_0x3dc3fc || '').trim();
          if (!_0x5ab039) return;
          const _0x28ce0c = appStore.getState().nodes?.[_0x249927];
          if (!_0x28ce0c) return;
          if (_0x7ec737()) return;
          if (_0x2e0057) {
            (appStore.updateNodeData(_0x249927, {
              ..._buildRunningHubTaskPatch({
                taskId: _0x5ab039,
                status: 'running',
                startedAt: _0x24263c,
                recovering: false,
                useOpenapiQuery: _0x28ce0c?.rhTaskUseOpenapiQuery === true || _0x20a86b,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (_0xa1a127) {
            (appStore.updateNodeData(_0x249927, {
              ..._buildDreaminaTaskPatch({
                submitId: _0x5ab039,
                status: 'pending',
                phase: 'generating',
                label: freeAngleText('task.generating'),
                startedAt: _0x24263c,
                recovering: false,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          _0x5727bf &&
            (appStore.updateNodeData(_0x249927, {
              ..._buildAsyncTaskPatch({
                provider: String(_0x28ce0c?.asyncTaskProvider || _0x2f9fab).trim(),
                kind: 'image',
                taskId: _0x5ab039,
                status: 'running',
                startedAt: _0x24263c,
                recovering: false,
              }),
            }),
            _persistRunningHubResumeCache());
        },
      });
      if (_0x7ec737()) return;
      const _0x70b9e0 =
        _0x30719e && _0x30719e.isBatch && Array.isArray(_0x30719e.images) && _0x30719e.images[0]
          ? _0x30719e.images[0]
          : _0x30719e;
      if (_0x70b9e0?.error) throw new Error(String(_0x70b9e0.error));
      const _0x4b4b85 = pickResultLocalPath(_0x70b9e0),
        _0x150044 =
          localPathToUrl(_0x4b4b85) || _0x70b9e0?.sourceUrl || _0x70b9e0?.imageUrl || _0x70b9e0?.url || '';
      if (!_0x150044) throw new Error(freeAngleText('errors.noGeneratedImageUrl'));
      const _0x211137 = (_0x2dee4a) => {
          const _0xa8331 = String(_0x2dee4a || ''),
            _0x51df86 = _0xa8331.split('/').pop() || '';
          return _0x51df86;
        },
        _0x2bc4f3 = appStore.getState().nodes?.[_0x249927],
        _0x5dd8fd = _0x2bc4f3?.generationStartTime ? Date.now() - _0x2bc4f3.generationStartTime : 0,
        _0x24b708 = buildImageGenerationResultPatch(
          {
            ..._0x70b9e0,
            localPath: _0x4b4b85,
            sourceUrl: _0x70b9e0?.sourceUrl || _0x70b9e0?.imageUrl || _0x150044,
            imageUrl: _0x70b9e0?.imageUrl || _0x70b9e0?.sourceUrl || _0x150044,
            thumbUrl: _0x70b9e0?.thumbUrl || _0x70b9e0?.sourceUrl || _0x70b9e0?.imageUrl || '',
          },
          { startedAt: _0x24263c, duration: _0x5dd8fd },
        );
      (appStore.updateNodeData(_0x249927, {
        ..._0x24b708,
        name: freeAngleText('output.resultName'),
        src: _0x150044,
        fileName: _0x4b4b85 ? _0x211137(_0x4b4b85) : '',
        ...(_0x2e0057
          ? _buildRunningHubTaskPatch({
              taskId: _0x2bc4f3?.rhTaskId || '',
              status: 'success',
              startedAt: _0x24263c,
              recovering: false,
              useOpenapiQuery: _0x2bc4f3?.rhTaskUseOpenapiQuery === true || _0x20a86b,
            })
          : {}),
        ...(_0xa1a127
          ? _buildDreaminaTaskPatch({
              submitId: _0x2bc4f3?.dreaminaSubmitId || '',
              status: 'success',
              phase: 'done',
              label: freeAngleText('task.completed'),
              startedAt: _0x24263c,
              recovering: false,
            })
          : {}),
        ...(_0x5727bf
          ? _buildAsyncTaskPatch({
              provider: _0x2bc4f3?.asyncTaskProvider || _0x2f9fab,
              kind: 'image',
              taskId: _0x2bc4f3?.asyncTaskId || '',
              status: 'success',
              startedAt: _0x24263c,
              recovering: false,
            })
          : {}),
      }),
        (_0x2e0057 || _0xa1a127 || _0x5727bf) && _persistRunningHubResumeCache(),
        window.showToast?.(freeAngleText('toasts.success'), 'success'));
    } catch (_0x48793f) {
      if (_0x7ec737()) return;
      const _0x19743f = appStore.getState().nodes?.[_0x249927];
      if (_0x19743f) {
        const _0x1d0223 = _0x19743f?.generationStartTime ? Date.now() - _0x19743f.generationStartTime : 0,
          _0x2164f7 = _0x48793f?.message || freeAngleText('errors.unknown');
        (appStore.updateNodeData(_0x249927, {
          ...buildImageGenerationFailurePatch({
            error: _0x2164f7,
            startedAt: _0x24263c,
            duration: _0x1d0223,
          }),
          name: freeAngleText('output.failedName'),
          src: '',
          ...(_0x2e0057
            ? _buildRunningHubTaskPatch({
                taskId: _0x19743f?.rhTaskId || '',
                status: 'failed',
                startedAt: _0x24263c,
                recovering: false,
                useOpenapiQuery: _0x19743f?.rhTaskUseOpenapiQuery === true || _0x20a86b,
              })
            : {}),
          ...(_0xa1a127
            ? _buildDreaminaTaskPatch({
                submitId: _0x19743f?.dreaminaSubmitId || '',
                status: 'failed',
                phase: 'failed',
                label: _0x2164f7 || freeAngleText('task.failed'),
                startedAt: _0x24263c,
                recovering: false,
              })
            : {}),
          ...(_0x5727bf
            ? _buildAsyncTaskPatch({
                provider: _0x19743f?.asyncTaskProvider || _0x2f9fab,
                kind: 'image',
                taskId: _0x19743f?.asyncTaskId || '',
                status: 'failed',
                startedAt: _0x24263c,
                recovering: false,
              })
            : {}),
          outputText: freeAngleText('output.failedReason', { error: _0x2164f7 }),
        }),
          (_0x2e0057 || _0xa1a127 || _0x5727bf) && _persistRunningHubResumeCache());
      }
      window.showToast?.(
        freeAngleText('toasts.failed', { error: _0x48793f?.message || freeAngleText('errors.unknown') }),
        'error',
      );
    }
  },
  async _handleDebug() {
    if (!this.nodeId) return;
    const _0x362225 = appStore.getStateRaw(),
      _0x9cf514 = _0x362225.nodes?.[this.nodeId];
    if (!_0x9cf514) return;
    let _0xe9ba6f = this._currentModel || 'nano-banana-2';
    const _0x35dbac = _resolveImageProvider(_0xe9ba6f, this._currentProvider || _0x9cf514.provider),
      { rotation: _0xd5432c, pitch: _0x4affa8, scale: _0x3f0a5b } = this.state;
    let _0x2ab02e = null;
    const _0x3279b0 = document.getElementById(this.nodeId);
    if (_0x3279b0) {
      const _0x4ddc12 = _0x3279b0.querySelector('img');
      _0x4ddc12 && (_0x2ab02e = _0x4ddc12.src);
    }
    !_0x2ab02e && _0x9cf514.imageUrl && (_0x2ab02e = _0x9cf514.imageUrl);
    !_0x2ab02e && _0x9cf514.outputImage && (_0x2ab02e = _0x9cf514.outputImage);
    let _0x2d7a6f = _0x9cf514.aspectRatio || '1:1';
    if (_0x2d7a6f === '自适应' || _0x2d7a6f === 'auto' || _0x2d7a6f === '1:1') {
      if (_0x2ab02e) {
        let _0x4178c5 = _0x9cf514.imgWidth || _0x9cf514.naturalWidth || 0,
          _0x553b02 = _0x9cf514.imgHeight || _0x9cf514.naturalHeight || 0;
        !_0x4178c5 &&
          _0x9cf514.src &&
          _0x9cf514.type === 'source-image' &&
          ((_0x4178c5 = _0x9cf514.originalWidth || 0), (_0x553b02 = _0x9cf514.originalHeight || 0));
        if (!_0x4178c5 || !_0x553b02) {
          if (_0x3279b0) {
            const _0x3c8a90 = _0x3279b0.querySelector('img');
            _0x3c8a90 &&
              _0x3c8a90.naturalWidth &&
              _0x3c8a90.naturalHeight &&
              ((_0x4178c5 = _0x3c8a90.naturalWidth), (_0x553b02 = _0x3c8a90.naturalHeight));
          }
        }
        if (_0x4178c5 && _0x553b02) {
          const _0x2ffd42 = _0x4178c5 / _0x553b02,
            _0xae7237 = [
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
          let _0x3899f4 = _0xae7237[0],
            _0x2c42fd = Math.abs(_0x2ffd42 - _0x3899f4.calc);
          for (let _0x2b7367 = 1; _0x2b7367 < _0xae7237.length; _0x2b7367++) {
            const _0x3a417b = Math.abs(_0x2ffd42 - _0xae7237[_0x2b7367].calc);
            _0x3a417b < _0x2c42fd && ((_0x2c42fd = _0x3a417b), (_0x3899f4 = _0xae7237[_0x2b7367]));
          }
          _0x2d7a6f = _0x3899f4.label;
        }
      }
    }
    await ensureConfig();
    const _0x176828 = getProviderConfig(_0x35dbac);
    let _0x361d1f = '';
    if (_0x35dbac === 'runninghub')
      _0x361d1f = isRunningHubModelApiImageTask(_0xe9ba6f, _0x35dbac)
        ? _0x176828.modelApiKey || ''
        : _0x176828.apiKey || '';
    else
      _0x35dbac === 'runninghubwf'
        ? (_0x361d1f = _0x176828.apiKey || '')
        : (_0x361d1f = _0x176828.apiKey || window._appApiKey || '');
    const _0x27aece = {
      prompt: '',
      model: _0xe9ba6f,
      aspectRatio: _0x2d7a6f,
      imageSize: _0x9cf514.imageSize || '2K',
      batchSize: 1,
      inputUrls: _0x2ab02e ? [_0x2ab02e] : [],
      apiKey: _0x361d1f,
      provider: _0x35dbac,
      cameraAngle: { rotation: _0xd5432c, pitch: _0x4affa8, scale: _0x3f0a5b },
    };
    try {
      const _0x539b2e = await buildGenerateImageRequest(_0x27aece),
        _0x52e86e = formatFinalApiDebugRequest(_0x539b2e),
        { x: _0x49832b, y: _0x417627 } = calcSafeSpawnPosNearNode(_0x362225.nodes, _0x9cf514, 0x17c, 0x12c);
      let _0x14670e = Object.values(_0x362225.nodes).find((_0x3067f6) => _0x3067f6.type === 'debug');
      !_0x14670e
        ? appStore.addNode({
            id: 'debug-' + Date.now(),
            type: 'debug',
            x: _0x49832b,
            y: _0x417627,
            width: 0x17c,
            height: 0x12c,
            name: freeAngleText('debug.nodeName'),
            outputText: _0x52e86e,
          })
        : appStore.updateNodeData(_0x14670e.id, { outputText: _0x52e86e, x: _0x49832b, y: _0x417627 });
    } catch (_0x445a15) {
      (console.error('[ImageFreeAngleController] 调试请求构建失败:', _0x445a15),
        window.showToast?.(
          freeAngleText('toasts.debugBuildFailed', {
            error: _0x445a15?.message || freeAngleText('errors.unknown'),
          }),
          'error',
        ));
    }
  },
};
export default ImageFreeAngleController;
