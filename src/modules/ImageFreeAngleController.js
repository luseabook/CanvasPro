import { openDebugRequestWindow } from './debugRequestWindow.js';
import appStore from '../core/stores/appStore.js';
import {
  bindImageFunctionControls,
  getImageFunctionRequestSettings,
  getImageFunctionSelection,
  renderImageFunctionControls,
} from './imageFunctionControls.js';
import { generateId } from '../core/math.js';
import { getImage } from './storage.js';
import { buildGenerateImageRequest, generateImage } from '../../api/aiImageApi.js';
import { isAdaptiveRatioLabel } from '../../api/imageRatioPolicy.js';
import { cancelRunningHubTask } from '../../api/runninghubTaskApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import {
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
  getNodeDefaultSize,
} from '../services/fileService.js';
import {
  buildImageFreeAngleModelCatalog,
  getDefaultImageFreeAngleModelState,
  getImageFunctionModelDisplayName,
  isImageFreeAngleOnlyModel,
} from './imageFunctionModelMenu.js';
import { DEBUG_WRENCH_ICON_HTML, buildFinalApiDebugPreview } from '../utils/debugRequestPreview.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { GENERATE_CANCEL_ICON_HTML } from './previewGenerateButtonUi.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../components/aigenImage/imageGenerationResultRenderer.js';
import { buildGenerationCancelledPatch, buildGenerationStartPatch } from '../core/generationTaskLifecycle.js';
import {
  buildAsyncTaskPatch,
  buildDreaminaTaskPatch,
  buildRunningHubTaskPatch,
} from '../core/generationTaskProtocolState.js';
import { isTaskCancelled } from '../core/generationTaskUiState.js';
import {
  isDreaminaImageTaskModel,
  isRunningHubImageTaskModel,
  isRunningHubModelApiImageTask,
  resolveImageTaskProvider,
  shouldUseRunningHubOpenapiQuery,
} from './imageTaskModelResolver.js';
import { onLocaleChange, t } from '../i18n/index.js';
import {
  resolveImageFreeAngleAspectRatio,
  resolveImageFreeAngleSourceSize,
} from './imageFreeAngleAspectRatio.js';
const FREE_ANGLE_DISTANCE_MIN = 0.1,
  FREE_ANGLE_DISTANCE_MAX = 2,
  FREE_ANGLE_VISUAL_SCALE_MIN = 0.7,
  FREE_ANGLE_PREVIOUS_DISTANCE_ONE_VISUAL_SCALE =
    FREE_ANGLE_VISUAL_SCALE_MIN +
    (1 - FREE_ANGLE_DISTANCE_MIN) * (2.65 / (FREE_ANGLE_DISTANCE_MAX - FREE_ANGLE_DISTANCE_MIN));
function _computeGenerationDuration(enabled) {
  if (!enabled) return 0;
  if (typeof enabled['generationDuration'] === 'number') return enabled['generationDuration'];
  const count = Number(enabled['generationStartTime']);
  if (!Number['isFinite'](count) || count <= 0) return 0;
  return Math['max'](0, Date['now']() - count);
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
function buildFreeAngleOutputText(
  model,
  { rotation: rotation, pitch: pitch, scale: scale } = {},
) {
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
  recovering: recovering = ![],
  useOpenapiQuery: useOpenapiQuery = ![],
} = {}) {
  return buildRunningHubTaskPatch({
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
    useOpenapiQuery: useOpenapiQuery,
  });
}
function _buildDreaminaTaskPatch({
  submitId: submitId = '',
  status: status = 'pending',
  phase: phase = 'generating',
  label: label = freeAngleText('task.generating'),
  startedAt: startedAt = 0,
  recovering: recovering = ![],
} = {}) {
  return buildDreaminaTaskPatch({
    submitId: submitId,
    status: status,
    phase: phase,
    label: label,
    startedAt: startedAt,
    recovering: recovering,
    defaultLabel: freeAngleText('task.generating'),
  });
}
function _buildAsyncTaskPatch({
  provider: provider = '',
  kind: kind = 'image',
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = ![],
} = {}) {
  return buildAsyncTaskPatch({
    provider: provider,
    kind: kind,
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
  });
}
function _persistRunningHubResumeCache() {
  try {
    window['_triggerLocalCacheSave']?.();
  } catch {}
}
export function createRunningHubTaskStateMachine() {
  const apiKey = {
      active: ![],
      cancelRequested: ![],
      apiKey: '',
      providerProfileId: '',
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
      if (!el || apiKey['originHtml']) return;
      ((apiKey['originHtml'] = el['innerHTML']),
        (apiKey['originColor'] = el['style']['color'] || ''),
        (apiKey['originTooltip'] = el['dataset']['tooltip'] || ''),
        (apiKey['originAria'] = el['getAttribute']('aria-label') || ''),
        (apiKey['originTitle'] = el['title'] || ''));
    },
    handler = (el2) => {
      if (!el2) return;
      (bindButton(el2),
        (el2['style']['color'] = 'var(--red)'),
        (el2['dataset']['tooltip'] = freeAngleText('runningTask.clickCancel')),
        el2['setAttribute']('aria-label', freeAngleText('runningTask.cancel')),
        (el2['title'] = freeAngleText('runningTask.clickCancelTask')),
        (el2['innerHTML'] = GENERATE_CANCEL_ICON_HTML));
    },
    handler2 = (el3) => {
      if (!el3) return;
      if (apiKey['originHtml']) el3['innerHTML'] = apiKey['originHtml'];
      el3['style']['color'] = apiKey['originColor'] || '';
      if (apiKey['originTooltip']) el3['dataset']['tooltip'] = apiKey['originTooltip'];
      else delete el3['dataset']['tooltip'];
      if (apiKey['originAria']) el3['setAttribute']('aria-label', apiKey['originAria']);
      else el3['removeAttribute']('aria-label');
      el3['title'] = apiKey['originTitle'] || '';
    },
    activate = ({
      button: button,
      apiKey: apiKey2,
      providerProfileId: providerProfileId,
      abortController: abortController,
      outNodeId: outNodeId,
    }) => {
      ((apiKey['active'] = !![]),
        (apiKey['cancelRequested'] = ![]),
        (apiKey['apiKey'] = apiKey2 || ''),
        (apiKey['providerProfileId'] = String(providerProfileId || '')['trim']()),
        (apiKey['taskId'] = ''),
        (apiKey['abortController'] = abortController || null),
        (apiKey['outNodeId'] = outNodeId || ''),
        handler(button));
    },
    setTaskId = (source) => {
      apiKey['taskId'] = source ? String(source) : '';
    },
    isCancelled = () =>
      !!apiKey['cancelRequested'] || !!apiKey['abortController']?.['signal']?.['aborted'],
    cancel = async () => {
      apiKey['cancelRequested'] = !![];
      try {
        apiKey['abortController']?.['abort']?.();
      } catch {}
      apiKey['apiKey'] &&
        apiKey['taskId'] &&
        (await cancelRunningHubTask({
          apiKey: apiKey['apiKey'],
          taskId: apiKey['taskId'],
          providerProfileId: apiKey['providerProfileId'],
        }));
    },
    finalizeCancelledNode = ({ nodeId: nodeId, name: name, outputText: outputText }) => {
      const enabled2 = nodeId || apiKey['outNodeId'];
      if (!enabled2) return;
      const enabled3 = appStore['getState']()['nodes']?.[enabled2];
      if (!enabled3) return;
      const duration = _computeGenerationDuration(enabled3);
      appStore['updateNodeData'](enabled2, {
        ...buildGenerationCancelledPatch({ duration: duration }),
        name: name,
        outputText: outputText,
        jobStatus: null,
      });
    },
    reset = (next) => {
      ((apiKey['active'] = ![]),
        (apiKey['cancelRequested'] = ![]),
        (apiKey['apiKey'] = ''),
        (apiKey['providerProfileId'] = ''),
        (apiKey['taskId'] = ''),
        (apiKey['abortController'] = null),
        (apiKey['outNodeId'] = ''),
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
  active: ![],
  nodeId: null,
  nodeData: null,
  state: { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } },
  containerEl: null,
  cubeEl: null,
  imageWrapEl: null,
  onDone: null,
  _unsubscribeLocale: null,
  async render(current, entry, record, payload, handle) {
    const state = appStore['getStateRaw'](),
      enabled4 = state['nodes']?.[current];
    if (!enabled4) return;
    if (this['active'] && this['nodeId'] === current) return;
    this['active'] && this['nodeId'] !== current && this['_exit']();
    ((this['active'] = !![]),
      (this['nodeId'] = current),
      (this['nodeData'] = enabled4),
      (this['containerEl'] = entry),
      (this['onDone'] = record),
      (this['onGenerate'] = payload),
      (this['triggerBtn'] = handle));
    this['triggerBtn'] &&
      ((this['_oldTriggerContent'] = this['triggerBtn']['innerHTML']),
      (this['_oldTriggerTooltip'] = this['triggerBtn']['getAttribute']('data-tooltip')),
      (this['_oldTriggerAriaLabel'] = this['triggerBtn']['getAttribute']('aria-label')),
      (this['_oldTriggerTitle'] = this['triggerBtn']['getAttribute']('title')),
      (this['triggerBtn']['innerHTML'] =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'),
      this['triggerBtn']['setAttribute']('data-tooltip', freeAngleText('actions.exit')),
      this['triggerBtn']['setAttribute']('aria-label', freeAngleText('actions.exitControl')),
      this['triggerBtn']['setAttribute']('title', freeAngleText('actions.exitControl')),
      this['triggerBtn']['classList']['add']('ftb-btn-exit'));
    ((this['state'] = { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } }),
      (this['_modelCatalog'] = buildImageFreeAngleModelCatalog()));
    const defaultImageFreeAngleModelState = getDefaultImageFreeAngleModelState(this['_modelCatalog']);
    ((this['_currentModel'] = defaultImageFreeAngleModelState['model'] || 'nano-banana-2-lite'),
      (this['_currentProvider'] = defaultImageFreeAngleModelState['provider'] || 'grsai'),
      this['_createUI'](),
      this['_bindEvents'](),
      (this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']())),
      this['_syncLocaleTexts'](),
      this['_updateView']());
  },
  _createUI() {
    const el4 = this['containerEl'];
    el4['innerHTML'] = '';
    const el5 = document['createElement']('div');
    el5['className'] = 'v2-free-angle-embedded';
    let config =
      this['nodeData']['imageUrl'] ||
      this['nodeData']['sourceUrl'] ||
      this['nodeData']['thumbUrl'] ||
      this['nodeData']['src'] ||
      localPathToUrl(this['nodeData']['localPath']);
    const scope = this['_modelCatalog'] || buildImageFreeAngleModelCatalog();
    ((this['_modelCatalog'] = scope),
      (this['_functionSelection'] = getImageFunctionSelection(
        this['_currentModel'],
        this['nodeData'],
        this['nodeData']['imageSize'] || '2K',
      )),
      (el5['innerHTML'] =
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
        '</span>\n              <span class="fa-value" id="val-scale">0.50</span>\n            </div>\n            <input type="range" class="fa-slider" id="sld-scale" min="0.1" max="2" step="0.05" value="0.5">\n          </div>\n          <div class="fa-footer">\n            ' +
        renderImageFunctionControls(this['_functionSelection'], scope) +
        '\n            <div class="fa-footer-actions">\n              <button type="button" class="fa-debug-btn debug-wrench-btn" title="' +
        freeAngleText('actions.debugApiParams') +
        '">\n                ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n              </button>\n              <button class="fa-gen-btn img-gen-btn" title="' +
        freeAngleText('actions.generate') +
        '">\n                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n              </button>\n            </div>\n          </div>\n        </div>\n      </div>\n    '),
      (el5['querySelector']('.fa-close-btn')['onclick'] = () => this['_exit']()),
      el5['addEventListener']('click', (event) => {
        event['stopPropagation']();
      }),
      el5['addEventListener']('mousedown', (event2) => {
        event2['stopPropagation']();
      }),
      el4['appendChild'](el5),
      (this['cubeEl'] = el5['querySelector']('.fa-cube')),
      (this['wrapperEl'] = el5));
    const imageEl = el5['querySelector']('.fa-face-img');
    this['nodeData']['thumbId'] &&
      imageEl &&
      void this['_hydrateFaceImageFromStorage']({
        nodeId: this['nodeId'],
        thumbId: this['nodeData']['thumbId'],
        imageEl: imageEl,
      });
  },
  async _hydrateFaceImageFromStorage({ nodeId: nodeId2, thumbId: thumbId, imageEl: imageEl2 }) {
    try {
      const image = await getImage(thumbId);
      if (!image) return;
      const input = URL['createObjectURL'](image);
      if (!this['active'] || this['nodeId'] !== nodeId2 || imageEl2?.['isConnected'] === ![]) {
        URL['revokeObjectURL'](input);
        return;
      }
      (String(this['_faceImageObjectUrl'] || '')['startsWith']('blob:') &&
        URL['revokeObjectURL'](this['_faceImageObjectUrl']),
        (this['_faceImageObjectUrl'] = input),
        (imageEl2['src'] = input));
    } catch (output) {}
  },
  _syncLocaleTexts() {
    this['triggerBtn']?.['classList']?.['contains']('ftb-btn-exit') &&
      (this['triggerBtn']['setAttribute']('data-tooltip', freeAngleText('actions.exit')),
      this['triggerBtn']['setAttribute']('aria-label', freeAngleText('actions.exitControl')),
      this['triggerBtn']['setAttribute']('title', freeAngleText('actions.exitControl')));
    if (!this['wrapperEl']) return;
    const run = (value2, value3) => {
        const el6 = this['wrapperEl']['querySelector'](value2);
        if (el6) el6['textContent'] = value3;
      },
      handler3 = (value4, value5) => {
        const value6 = this['wrapperEl']['querySelector'](value4);
        if (value6) value6['title'] = value5;
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
    if (!this['active']) return;
    const { rotation: rotation2, pitch: pitch2, scale: scale2 } = this['state'],
      value7 = ((rotation2 % 360) + 360) % 360;
    ((this['wrapperEl']['querySelector']('#val-rotation')['textContent'] = value7['toFixed'](1) + '°'),
      (this['wrapperEl']['querySelector']('#val-pitch')['textContent'] = pitch2['toFixed'](1) + '°'),
      (this['wrapperEl']['querySelector']('#val-scale')['textContent'] = '' + scale2['toFixed'](2)),
      (this['wrapperEl']['querySelector']('#sld-rotation')['value'] = value7),
      (this['wrapperEl']['querySelector']('#sld-pitch')['value'] = pitch2),
      (this['wrapperEl']['querySelector']('#sld-scale')['value'] = scale2),
      (this['cubeEl']['style']['transform'] =
        'rotateX(' + -pitch2 + 'deg) rotateY(' + (value7 - 360) + 'deg)'));
    const value8 =
      FREE_ANGLE_VISUAL_SCALE_MIN +
      (scale2 - FREE_ANGLE_DISTANCE_MIN) *
        ((FREE_ANGLE_PREVIOUS_DISTANCE_ONE_VISUAL_SCALE - FREE_ANGLE_VISUAL_SCALE_MIN) /
          (FREE_ANGLE_DISTANCE_MAX - FREE_ANGLE_DISTANCE_MIN));
    this['cubeEl']['parentElement']['style']['transform'] = 'scale(' + value8 + ')';
  },
  _bindEvents() {
    const el7 = this['wrapperEl'];
    ((el7['querySelector']('#sld-rotation')['oninput'] = (event3) => {
      ((this['state']['rotation'] = parseFloat(event3['target']['value'])), this['_updateView']());
    }),
      (el7['querySelector']('#sld-pitch')['oninput'] = (event4) => {
        ((this['state']['pitch'] = parseFloat(event4['target']['value'])), this['_updateView']());
      }),
      (el7['querySelector']('#sld-scale')['oninput'] = (event5) => {
        ((this['state']['scale'] = parseFloat(event5['target']['value'])), this['_updateView']());
      }),
      (el7['querySelector']('.fa-reset-btn')['onclick'] = () => {
        ((this['state'] = { rotation: 35, pitch: 20, scale: 0.5, pan: { x: 0, y: 0 } }),
          this['_updateView']());
      }));
    const value9 = el7['querySelector']('.fa-preview-area');
    let enabled5 = ![],
      enabled6 = ![],
      box = { x: 0, y: 0 };
    value9['onmousedown'] = (x) => {
      enabled5 = !![];
      if (x['button'] === 2) enabled6 = !![];
      ((box = { x: x['clientX'], y: x['clientY'] }),
        x['preventDefault'](),
        x['stopPropagation']());
    };
    const value10 = (x2) => {
        if (!enabled5) return;
        const value11 = x2['clientX'] - box['x'],
          value12 = x2['clientY'] - box['y'];
        ((box = { x: x2['clientX'], y: x2['clientY'] }),
          enabled6 && ((this['state']['pan']['x'] += value11), (this['state']['pan']['y'] += value12)),
          !enabled6 &&
            ((this['state']['rotation'] += value11 * 0.5),
            (this['state']['pitch'] += value12 * 0.5),
            (this['state']['pitch'] = Math['max'](-30, Math['min'](60, this['state']['pitch'])))),
          this['_updateView']());
      },
      value13 = () => {
        ((enabled5 = ![]), (enabled6 = ![]));
      };
    (window['addEventListener']('mousemove', value10),
      window['addEventListener']('mouseup', value13),
      (this['_cleanupHandlers'] = () => {
        (window['removeEventListener']('mousemove', value10),
          window['removeEventListener']('mouseup', value13));
      }),
      (value9['onwheel'] = (event6) => {
        (event6['preventDefault'](), event6['stopPropagation']());
        const value14 = event6['deltaY'] > 0 ? -0.05 : 0.05;
        ((this['state']['scale'] = Math['max'](0.1, Math['min'](2, this['state']['scale'] + value14))),
          this['_updateView']());
      }),
      (value9['oncontextmenu'] = (event7) => event7['preventDefault']()),
      (el7['querySelector']('.fa-gen-btn')['onclick'] = () => this['_handleGenerate']()),
      (el7['querySelector']('.fa-debug-btn')['onclick'] = (event8) => {
        (event8['stopPropagation'](), this['_handleDebug']());
      }),
      (this['_functionControls'] = bindImageFunctionControls(el7, {
        selection: this['_functionSelection'],
        onChange: (model2) => {
          ((this['_functionSelection'] = model2),
            (this['_currentModel'] = model2['modelId']),
            (this['_currentProvider'] = model2['provider']),
            !isImageFreeAngleOnlyModel(model2['modelId']) &&
              appStore['updateNodeData'](this['nodeId'], {
                model: model2['modelId'],
                provider: model2['provider'],
                generationParams: model2['generationParams'],
                generationParamsByModel: model2['generationParamsByModel'],
                providerProfileId: model2['providerProfileId'],
                providerProfileIdByModel: model2['providerProfileIdByModel'],
              }));
        },
      })));
  },
  _exit() {
    if (!this['active']) return;
    (this['_functionControls']?.['destroy'](),
      (this['_functionControls'] = null),
      (this['active'] = ![]),
      (this['nodeId'] = null));
    String(this['_faceImageObjectUrl'] || '')['startsWith']('blob:') &&
      URL['revokeObjectURL'](this['_faceImageObjectUrl']);
    this['_faceImageObjectUrl'] = '';
    this['_unsubscribeLocale'] && (this['_unsubscribeLocale'](), (this['_unsubscribeLocale'] = null));
    if (this['_cleanupHandlers']) this['_cleanupHandlers']();
    if (this['_cleanupModelMenu']) this['_cleanupModelMenu']();
    if (this['_cleanupSubmenuClick']) this['_cleanupSubmenuClick']();
    if (this['containerEl']) this['containerEl']['innerHTML'] = '';
    this['triggerBtn'] &&
      ((this['triggerBtn']['innerHTML'] = this['_oldTriggerContent']),
      this['_oldTriggerTooltip'] != null
        ? this['triggerBtn']['setAttribute']('data-tooltip', this['_oldTriggerTooltip'])
        : this['triggerBtn']['removeAttribute']('data-tooltip'),
      this['_oldTriggerAriaLabel'] != null
        ? this['triggerBtn']['setAttribute']('aria-label', this['_oldTriggerAriaLabel'])
        : this['triggerBtn']['removeAttribute']('aria-label'),
      this['_oldTriggerTitle'] != null
        ? this['triggerBtn']['setAttribute']('title', this['_oldTriggerTitle'])
        : this['triggerBtn']['removeAttribute']('title'),
      this['triggerBtn']['classList']['remove']('ftb-btn-exit'));
    ((this['_oldTriggerContent'] = null),
      (this['_oldTriggerTooltip'] = null),
      (this['_oldTriggerAriaLabel'] = null),
      (this['_oldTriggerTitle'] = null),
      (this['_modelCatalog'] = null));
    if (this['onDone']) this['onDone']();
  },
  async _handleGenerate() {
    if (!this['nodeId']) return;
    const { rotation: rotation3, pitch: pitch3, scale: scale3 } = this['state'];
    appStore['updateNodeData'](this['nodeId'], {
      cameraAngle: { rotation: rotation3, pitch: pitch3, scale: scale3 },
    });
    const state2 = appStore['getStateRaw'](),
      imageSize = state2['nodes']?.[this['nodeId']];
    if (!imageSize) return;
    let model3 = this['_currentModel'] || 'nano-banana-2';
    const imageSize2 = getImageFunctionRequestSettings(this['_functionSelection']),
      provider2 = _resolveImageProvider(model3, this['_currentProvider'] || imageSize['provider']);
    let inputUrls = null;
    const el8 = document['getElementById'](this['nodeId']);
    if (el8) {
      const value15 = el8['querySelector']('img');
      value15 && (inputUrls = value15['src']);
    }
    !inputUrls && imageSize['imageUrl'] && (inputUrls = imageSize['imageUrl']);
    !inputUrls && imageSize['outputImage'] && (inputUrls = imageSize['outputImage']);
    const aspectRatio = imageSize['aspectRatio'] || '',
      isAdaptiveRatioLabel2 = isAdaptiveRatioLabel(aspectRatio),
      sourceSize = resolveImageFreeAngleSourceSize(imageSize, el8?.['querySelector']('img')),
      aspectRatio2 = resolveImageFreeAngleAspectRatio({
        aspectRatio: aspectRatio,
        provider: provider2,
        model: model3,
        imageSize: imageSize2['imageSize'] || imageSize['imageSize'] || '2K',
        sourceSize: sourceSize,
      });
    await ensureConfig();
    const providerConfig = getProviderConfig(imageSize2['providerProfileId'] || provider2);
    let apiKey3 = '';
    if (provider2 === 'runninghub')
      apiKey3 = isRunningHubModelApiImageTask(model3, provider2)
        ? providerConfig['modelApiKey'] || ''
        : providerConfig['apiKey'] || '';
    else
      provider2 === 'runninghubwf'
        ? (apiKey3 = providerConfig['apiKey'] || '')
        : (apiKey3 = providerConfig['apiKey'] || window['_appApiKey'] || '');
    const value16 = {
        prompt: '',
        model: model3,
        aspectRatio: aspectRatio2,
        imageSize: imageSize['imageSize'] || '2K',
        ...imageSize2,
        batchSize: 1,
        inputUrls: inputUrls ? [inputUrls] : [],
        apiKey: apiKey3,
        provider: provider2,
        cameraAngle: { rotation: rotation3, pitch: pitch3, scale: scale3 },
      },
      startedAt2 = Date['now'](),
      _isRunningHubTaskModel2 = _isRunningHubTaskModel(model3, provider2),
      _isDreaminaTaskModel2 = _isDreaminaTaskModel(model3, provider2),
      value17 = !_isRunningHubTaskModel2 && !_isDreaminaTaskModel2,
      provider3 = String(provider2 || '')
        ['trim']()
        ['toLowerCase'](),
      useOpenapiQuery2 = shouldUseRunningHubOpenapiQuery(model3, provider2);
    let width = 288,
      height = 288;
    const value18 = aspectRatio2['split'](':'),
      box2 =
        isAdaptiveRatioLabel2 && sourceSize
          ? sourceSize
          : { width: parseFloat(value18[0]), height: parseFloat(value18[1]) };
    if (box2['width'] > 0 && box2['height'] > 0) {
      const box3 = getAutoMediaSizeByShortSide(box2['width'], box2['height']);
      ((width = box3['width']), (height = box3['height']));
    }
    const { x: x3, y: y } = calcSafeSpawnPosNearNode(
        state2['nodes'],
        imageSize,
        width,
        height,
      ),
      id = generateId('source-image-rotate'),
      handler4 = () => {
        return isTaskCancelled(appStore['getState']()['nodes']?.[id]);
      },
      imageFunctionModelDisplayName = getImageFunctionModelDisplayName(
        model3,
        this['_modelCatalog'] || buildImageFreeAngleModelCatalog(),
      );
    appStore['addNode'](
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
        ...(_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value17 ? { provider: provider2, model: model3 } : {}),
        ...(_isRunningHubTaskModel2 ? { rhSourceNodeId: imageSize['id'], rhToolbarTaskType: 'image-free-angle' } : {}),
        ...(_isRunningHubTaskModel2
          ? _buildRunningHubTaskPatch({
              taskId: '',
              status: 'pending',
              startedAt: startedAt2,
              recovering: ![],
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
              recovering: ![],
            })
          : {}),
        ...(value17
          ? _buildAsyncTaskPatch({
              provider: provider3,
              kind: 'image',
              taskId: '',
              status: 'pending',
              startedAt: startedAt2,
              recovering: ![],
            })
          : {}),
        outputText: buildFreeAngleOutputText(imageFunctionModelDisplayName, {
          rotation: rotation3,
          pitch: pitch3,
          scale: scale3,
        }),
      }),
    );
    (_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value17) && _persistRunningHubResumeCache();
    appStore['setSelectedNodes']([id]);
    try {
      const generateImage2 = await generateImage(value16, {
        onTaskMeta: ({
          taskId: taskId2,
          useOpenapiQuery: useOpenapiQuery3,
          provider: provider4,
          providerProfileId: providerProfileId2,
          rhProviderProfileId: rhProviderProfileId,
        }) => {
          const taskId3 = String(taskId2 || '')['trim']();
          if (!taskId3) return;
          const enabled7 = appStore['getState']()['nodes']?.[id];
          if (!enabled7) return;
          if (handler4()) return;
          if (_isRunningHubTaskModel2) {
            const taskProviderProfileId = String(providerProfileId2 || rhProviderProfileId || '')['trim']();
            (appStore['updateNodeData'](id, {
              ...(taskProviderProfileId
                ? {
                    taskProviderProfileId: taskProviderProfileId,
                    providerProfileId: taskProviderProfileId,
                    rhProviderProfileId: taskProviderProfileId,
                  }
                : {}),
              ..._buildRunningHubTaskPatch({
                taskId: taskId3,
                status: 'running',
                startedAt: startedAt2,
                recovering: ![],
                useOpenapiQuery: useOpenapiQuery3 === !![],
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (_isDreaminaTaskModel2) {
            (appStore['updateNodeData'](id, {
              ..._buildDreaminaTaskPatch({
                submitId: taskId3,
                status: 'pending',
                phase: 'generating',
                label: freeAngleText('task.generating'),
                startedAt: startedAt2,
                recovering: ![],
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          value17 &&
            (appStore['updateNodeData'](id, {
              ..._buildAsyncTaskPatch({
                provider: String(provider4 || enabled7?.['asyncTaskProvider'] || provider3)['trim'](),
                kind: 'image',
                taskId: taskId3,
                status: 'running',
                startedAt: startedAt2,
                recovering: ![],
              }),
            }),
            _persistRunningHubResumeCache());
        },
        onTaskId: (value19) => {
          const taskId4 = String(value19 || '')['trim']();
          if (!taskId4) return;
          const useOpenapiQuery4 = appStore['getState']()['nodes']?.[id];
          if (!useOpenapiQuery4) return;
          if (handler4()) return;
          if (_isRunningHubTaskModel2) {
            (appStore['updateNodeData'](id, {
              ..._buildRunningHubTaskPatch({
                taskId: taskId4,
                status: 'running',
                startedAt: startedAt2,
                recovering: ![],
                useOpenapiQuery: useOpenapiQuery4?.['rhTaskUseOpenapiQuery'] === !![] || useOpenapiQuery2,
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          if (_isDreaminaTaskModel2) {
            (appStore['updateNodeData'](id, {
              ..._buildDreaminaTaskPatch({
                submitId: taskId4,
                status: 'pending',
                phase: 'generating',
                label: freeAngleText('task.generating'),
                startedAt: startedAt2,
                recovering: ![],
              }),
            }),
              _persistRunningHubResumeCache());
            return;
          }
          value17 &&
            (appStore['updateNodeData'](id, {
              ..._buildAsyncTaskPatch({
                provider: String(useOpenapiQuery4?.['asyncTaskProvider'] || provider3)['trim'](),
                kind: 'image',
                taskId: taskId4,
                status: 'running',
                startedAt: startedAt2,
                recovering: ![],
              }),
            }),
            _persistRunningHubResumeCache());
        },
      });
      if (handler4()) return;
      const sourceUrl =
        generateImage2 && generateImage2['isBatch'] && Array['isArray'](generateImage2['images']) && generateImage2['images'][0]
          ? generateImage2['images'][0]
          : generateImage2;
      if (sourceUrl?.['error']) throw new Error(String(sourceUrl['error']));
      const localPath = pickResultLocalPath(sourceUrl),
        src =
          localPathToUrl(localPath) ||
          sourceUrl?.['sourceUrl'] ||
          sourceUrl?.['imageUrl'] ||
          sourceUrl?.['url'] ||
          '';
      if (!src) throw new Error(freeAngleText('errors.noGeneratedImageUrl'));
      const run2 = (value20) => {
          const value21 = String(value20 || ''),
            value22 = value21['split']('/')['pop']() || '';
          return value22;
        },
        taskId5 = appStore['getState']()['nodes']?.[id],
        duration2 = taskId5?.['generationStartTime']
          ? Date['now']() - taskId5['generationStartTime']
          : 0,
        args = buildImageGenerationResultPatch(
          {
            ...sourceUrl,
            localPath: localPath,
            sourceUrl: sourceUrl?.['sourceUrl'] || sourceUrl?.['imageUrl'] || src,
            imageUrl: sourceUrl?.['imageUrl'] || sourceUrl?.['sourceUrl'] || src,
            thumbUrl: sourceUrl?.['thumbUrl'] || sourceUrl?.['sourceUrl'] || sourceUrl?.['imageUrl'] || '',
          },
          { startedAt: startedAt2, duration: duration2 },
        );
      (appStore['updateNodeData'](id, {
        ...args,
        name: freeAngleText('output.resultName'),
        src: src,
        fileName: localPath ? run2(localPath) : '',
        ...(_isRunningHubTaskModel2
          ? _buildRunningHubTaskPatch({
              taskId: taskId5?.['rhTaskId'] || '',
              status: 'success',
              startedAt: startedAt2,
              recovering: ![],
              useOpenapiQuery: taskId5?.['rhTaskUseOpenapiQuery'] === !![] || useOpenapiQuery2,
            })
          : {}),
        ...(_isDreaminaTaskModel2
          ? _buildDreaminaTaskPatch({
              submitId: taskId5?.['dreaminaSubmitId'] || '',
              status: 'success',
              phase: 'done',
              label: freeAngleText('task.completed'),
              startedAt: startedAt2,
              recovering: ![],
            })
          : {}),
        ...(value17
          ? _buildAsyncTaskPatch({
              provider: taskId5?.['asyncTaskProvider'] || provider3,
              kind: 'image',
              taskId: taskId5?.['asyncTaskId'] || '',
              status: 'success',
              startedAt: startedAt2,
              recovering: ![],
            })
          : {}),
      }),
        (_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value17) && _persistRunningHubResumeCache(),
        window['showToast']?.(freeAngleText('toasts.success'), 'success'));
    } catch (error) {
      if (handler4()) return;
      const taskId6 = appStore['getState']()['nodes']?.[id];
      if (taskId6) {
        const duration3 = taskId6?.['generationStartTime']
            ? Date['now']() - taskId6['generationStartTime']
            : 0,
          error2 = error?.['message'] || freeAngleText('errors.unknown');
        (appStore['updateNodeData'](id, {
          ...buildImageGenerationFailurePatch({
            error: error2,
            startedAt: startedAt2,
            duration: duration3,
          }),
          name: freeAngleText('output.failedName'),
          src: '',
          ...(_isRunningHubTaskModel2
            ? _buildRunningHubTaskPatch({
                taskId: taskId6?.['rhTaskId'] || '',
                status: 'failed',
                startedAt: startedAt2,
                recovering: ![],
                useOpenapiQuery: taskId6?.['rhTaskUseOpenapiQuery'] === !![] || useOpenapiQuery2,
              })
            : {}),
          ...(_isDreaminaTaskModel2
            ? _buildDreaminaTaskPatch({
                submitId: taskId6?.['dreaminaSubmitId'] || '',
                status: 'failed',
                phase: 'failed',
                label: error2 || freeAngleText('task.failed'),
                startedAt: startedAt2,
                recovering: ![],
              })
            : {}),
          ...(value17
            ? _buildAsyncTaskPatch({
                provider: taskId6?.['asyncTaskProvider'] || provider3,
                kind: 'image',
                taskId: taskId6?.['asyncTaskId'] || '',
                status: 'failed',
                startedAt: startedAt2,
                recovering: ![],
              })
            : {}),
          outputText: freeAngleText('output.failedReason', { error: error2 }),
        }),
          (_isRunningHubTaskModel2 || _isDreaminaTaskModel2 || value17) && _persistRunningHubResumeCache());
      }
      window['showToast']?.(
        freeAngleText('toasts.failed', { error: error?.['message'] || freeAngleText('errors.unknown') }),
        'error',
      );
    }
  },
  async _handleDebug() {
    if (!this['nodeId']) return;
    const state3 = appStore['getStateRaw'](),
      aspectRatio3 = state3['nodes']?.[this['nodeId']];
    if (!aspectRatio3) return;
    let model4 = this['_currentModel'] || 'nano-banana-2';
    const imageSize3 = getImageFunctionRequestSettings(this['_functionSelection']),
      provider5 = _resolveImageProvider(model4, this['_currentProvider'] || aspectRatio3['provider']),
      { rotation: rotation4, pitch: pitch4, scale: scale4 } = this['state'];
    let inputUrls2 = null;
    const el9 = document['getElementById'](this['nodeId']);
    if (el9) {
      const value23 = el9['querySelector']('img');
      value23 && (inputUrls2 = value23['src']);
    }
    !inputUrls2 && aspectRatio3['imageUrl'] && (inputUrls2 = aspectRatio3['imageUrl']);
    !inputUrls2 && aspectRatio3['outputImage'] && (inputUrls2 = aspectRatio3['outputImage']);
    const sourceSize2 = resolveImageFreeAngleSourceSize(aspectRatio3, el9?.['querySelector']('img')),
      aspectRatio4 = resolveImageFreeAngleAspectRatio({
        aspectRatio: aspectRatio3['aspectRatio'] || '',
        provider: provider5,
        model: model4,
        imageSize: imageSize3['imageSize'] || aspectRatio3['imageSize'] || '2K',
        sourceSize: sourceSize2,
      });
    await ensureConfig();
    const providerConfig2 = getProviderConfig(imageSize3['providerProfileId'] || provider5);
    let apiKey4 = '';
    if (provider5 === 'runninghub')
      apiKey4 = isRunningHubModelApiImageTask(model4, provider5)
        ? providerConfig2['modelApiKey'] || ''
        : providerConfig2['apiKey'] || '';
    else
      provider5 === 'runninghubwf'
        ? (apiKey4 = providerConfig2['apiKey'] || '')
        : (apiKey4 = providerConfig2['apiKey'] || window['_appApiKey'] || '');
    const value24 = {
      prompt: '',
      model: model4,
      aspectRatio: aspectRatio4,
      imageSize: aspectRatio3['imageSize'] || '2K',
      ...imageSize3,
      batchSize: 1,
      inputUrls: inputUrls2 ? [inputUrls2] : [],
      apiKey: apiKey4,
      provider: provider5,
      cameraAngle: { rotation: rotation4, pitch: pitch4, scale: scale4 },
    };
    try {
      const generateImageRequest = await buildGenerateImageRequest(value24);
      openDebugRequestWindow(buildFinalApiDebugPreview(generateImageRequest));
    } catch (error3) {
      (console['error']('[ImageFreeAngleController] 调试请求构建失败:', error3),
        window['showToast']?.(
          freeAngleText('toasts.debugBuildFailed', {
            error: error3?.['message'] || freeAngleText('errors.unknown'),
          }),
          'error',
        ));
    }
  },
};
export default ImageFreeAngleController;
