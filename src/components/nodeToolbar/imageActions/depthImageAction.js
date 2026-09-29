import {
  bindAIGenImageModelSelector,
  renderAIGenImageModelSelectorMarkup,
} from '../../aigenImage/modelSelector.js';
import { openCanvasGenerationEditor } from '../../shared/canvasGenerationEditor.js';
import { RH_IMAGE_DEPTH_MODEL_ID } from '../../../manifests/image/runninghub/runningHubImageDepthManifest.js';
import { IMAGE_DEPTH_TASK_TYPE, imageDepthText, submitImageDepthTask } from './depthImageTask.js';
export function bindImageDepthAction(_0x85e746) {
  const {
      toolbarEl: _0x217d48,
      nodeId: _0x1de8a3,
      store: _0x47bd67,
      closeToolbarMoreMenu: _0x4c65e1,
      bindRunningHubToolbarTaskButton: _0x12c3f7,
      findRunningHubToolbarTaskForNode: _0x466e13,
      cancelRunningHubResultTask: _0x3e45e0,
      openDepthPanel: openDepthPanel = openCanvasGenerationEditor,
    } = _0x85e746,
    _0x5d7abd = _0x217d48['querySelector']('.act-depth-image');
  if (!_0x5d7abd) return;
  let _0x352bd2 = ![];
  (_0x12c3f7({
    button: _0x5d7abd,
    getTask: () =>
      _0x466e13(_0x1de8a3, { models: [RH_IMAGE_DEPTH_MODEL_ID], taskTypes: [IMAGE_DEPTH_TASK_TYPE] }),
    cancelTask: (_0x329610) => _0x3e45e0(_0x329610, { name: imageDepthText('cancelled') }),
    cancelTooltip: imageDepthText('cancel'),
  }),
    _0x5d7abd['addEventListener']('click', async (_0x219851) => {
      (_0x219851['stopPropagation'](), _0x219851['preventDefault']());
      if (_0x352bd2) return;
      _0x352bd2 = !![];
      const _0x2289b2 = globalThis['window']?.['currentProjectId'];
      let _0x11ba24 = ![];
      const _0x6fdc9f = () => {
        _0x11ba24 = !![];
      };
      window['addEventListener']('aicanvas:active-canvas-changed', _0x6fdc9f);
      const _0x428fe3 = () => (_0x47bd67['getStateRaw']?.() || _0x47bd67['getState']())['nodes']?.[_0x1de8a3],
        _0x5ab4db = () =>
          !_0x11ba24 && globalThis['window']?.['currentProjectId'] === _0x2289b2 && !!_0x428fe3();
      try {
        (_0x4c65e1?.(), window['v2FocusOnNode']?.(_0x1de8a3));
        const _0x5c591d = await openDepthPanel({
          store: _0x47bd67,
          sourceNodeId: _0x1de8a3,
          modelId: RH_IMAGE_DEPTH_MODEL_ID,
          returnFocus: _0x5d7abd,
          settingsKey: 'imageDepthSettings',
          overlayDataKey: 'imageDepthEditor',
          renderSelector: renderAIGenImageModelSelectorMarkup,
          bindSelector: bindAIGenImageModelSelector,
          selectorOptions: { allowedWorkflowModelIds: [RH_IMAGE_DEPTH_MODEL_ID], showSchemaControls: !![] },
        });
        if (!_0x5c591d || !_0x5ab4db()) return;
        (_0x5d7abd['setAttribute']('aria-busy', 'true'),
          _0x5d7abd['querySelector']('svg')?.['classList']['add']('v2-spinning'));
        const _0x4a6e85 = await submitImageDepthTask(_0x85e746, _0x5c591d, _0x428fe3(), _0x5ab4db);
        if (_0x4a6e85?.['status'] === 'failed') throw _0x4a6e85['error'];
      } catch (_0x435da8) {
        window['showToast']?.(_0x435da8?.['message'] || String(_0x435da8), 'error');
      } finally {
        ((_0x352bd2 = ![]),
          _0x5d7abd['removeAttribute']('aria-busy'),
          _0x5d7abd['querySelector']('svg')?.['classList']['remove']('v2-spinning'),
          window['removeEventListener']('aicanvas:active-canvas-changed', _0x6fdc9f));
      }
    }));
}
