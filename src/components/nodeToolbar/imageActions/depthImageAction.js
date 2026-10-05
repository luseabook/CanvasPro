import {
  bindAIGenImageModelSelector,
  renderAIGenImageModelSelectorMarkup,
} from '../../aigenImage/modelSelector.js';
import { openCanvasGenerationEditor } from '../../shared/canvasGenerationEditor.js';
import { RH_IMAGE_DEPTH_MODEL_ID } from '../../../manifests/image/runninghub/runningHubImageDepthManifest.js';
import { IMAGE_DEPTH_TASK_TYPE, imageDepthText, submitImageDepthTask } from './depthImageTask.js';
export function bindImageDepthAction(value) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      store: store,
      closeToolbarMoreMenu: closeToolbarMoreMenu,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      openDepthPanel: openDepthPanel = openCanvasGenerationEditor,
    } = value,
    button = toolbarEl['querySelector']('.act-depth-image');
  if (!button) return;
  let enabled = false;
  (bindRunningHubToolbarTaskButton({
    button: button,
    getTask: () =>
      findRunningHubToolbarTaskForNode(nodeId, {
        models: [RH_IMAGE_DEPTH_MODEL_ID],
        taskTypes: [IMAGE_DEPTH_TASK_TYPE],
      }),
    cancelTask: (item) => cancelRunningHubResultTask(item, { name: imageDepthText('cancelled') }),
    cancelTooltip: imageDepthText('cancel'),
  }),
    button['addEventListener']('click', async (event) => {
      (event['stopPropagation'](), event['preventDefault']());
      if (enabled) return;
      enabled = true;
      const key = globalThis['window']?.['currentProjectId'];
      let enabled2 = false;
      const index = () => {
        enabled2 = true;
      };
      window['addEventListener']('aicanvas:active-canvas-changed', index);
      const run = () => (store['getStateRaw']?.() || store['getState']())['nodes']?.[nodeId],
        handler = () => !enabled2 && globalThis['window']?.['currentProjectId'] === key && !!run();
      try {
        (closeToolbarMoreMenu?.(), window['v2FocusOnNode']?.(nodeId));
        const openDepthPanel2 = await openDepthPanel({
          store: store,
          sourceNodeId: nodeId,
          modelId: RH_IMAGE_DEPTH_MODEL_ID,
          returnFocus: button,
          settingsKey: 'imageDepthSettings',
          overlayDataKey: 'imageDepthEditor',
          renderSelector: renderAIGenImageModelSelectorMarkup,
          bindSelector: bindAIGenImageModelSelector,
          selectorOptions: { allowedWorkflowModelIds: [RH_IMAGE_DEPTH_MODEL_ID], showSchemaControls: true },
        });
        if (!openDepthPanel2 || !handler()) return;
        (button['setAttribute']('aria-busy', 'true'),
          button['querySelector']('svg')?.['classList']['add']('v2-spinning'));
        const response = await submitImageDepthTask(value, openDepthPanel2, run(), handler);
        if (response?.['status'] === 'failed') throw response['error'];
      } catch (error) {
        window['showToast']?.(error?.['message'] || String(error), 'error');
      } finally {
        ((enabled = false),
          button['removeAttribute']('aria-busy'),
          button['querySelector']('svg')?.['classList']['remove']('v2-spinning'),
          window['removeEventListener']('aicanvas:active-canvas-changed', index));
      }
    }));
}
