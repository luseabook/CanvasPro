import { openImageHdEditor } from './imageHdEditor.js';
import { imageHdText, imageHdOutputText, submitImageHdTask } from './imageHdTask.js';
import { getImageHdModelIds } from '../../../modules/imageHdModelMenu.js';
export function bindImageHdAction(value) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      store: store,
      _hdTaskMachine: _hdTaskMachine,
      _hdState: _hdState,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      closeToolbarMoreMenu: closeToolbarMoreMenu,
      openHdPanel: openHdPanel = openImageHdEditor,
      submitHdTask: submitHdTask = submitImageHdTask,
    } = value,
    outputText = (item) => {
      const outputText2 = (store['getStateRaw']?.() || store['getState']())['nodes']?.[item]?.[
        'outputText'
      ];
      return outputText2
        ? imageHdText('outputTextWithStatus', {
            outputText: outputText2,
            status: imageHdText('status.cancelled'),
          })
        : imageHdOutputText({ status: imageHdText('status.cancelled') });
    };
  let enabled = ![];
  const button = toolbarEl['querySelector']('.act-hd');
  button &&
    (_hdTaskMachine['bindButton'](button),
    bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () =>
        findRunningHubToolbarTaskForNode(nodeId, {
          models: getImageHdModelIds(),
          taskTypes: ['image-hd'],
          outputTextIncludes: [imageHdText('modelLabel'), 'RH高清放大'],
        }),
      cancelTask: async (key) => {
        try {
          if (_hdState['active'] && String(_hdState['outNodeId'] || '') === key['outId'])
            try {
              await _hdTaskMachine['cancel']();
            } catch (index) {
              console['warn']('[ImageHD]\x20cancel\x20request\x20failed:', index);
            }
          return await cancelRunningHubResultTask(key, {
            name: imageHdText('cancelledName'),
            outputText: outputText(key['outId']),
            notifyMessage: imageHdText('cancelledToast'),
          });
        } finally {
          _hdState['active'] &&
            String(_hdState['outNodeId'] || '') === key['outId'] &&
            _hdTaskMachine['reset'](button);
        }
      },
      cancelTooltip: imageHdText('cancelTooltip'),
    }),
    button['addEventListener']('click', async (event) => {
      (event['stopPropagation'](), event['preventDefault']());
      if (_hdState['active']) {
        (async () => {
          let result = null;
          try {
            const data = _hdState['outNodeId']
              ? {
                  outId: _hdState['outNodeId'],
                  targetNodeId: _hdState['outNodeId'],
                  taskId: _hdState['taskId'],
                  apiKey: _hdState['apiKey'],
                  sourceNodeId: nodeId,
                }
              : null;
            data
              ? await cancelRunningHubResultTask(data, {
                  name: imageHdText('cancelledName'),
                  outputText: outputText(data['outId']),
                  notifyMessage: imageHdText('cancelledToast'),
                })
              : (await _hdTaskMachine['cancel'](), window['showToast']?.(imageHdText('taskCancelled'), 'info'));
          } catch (options) {
            result = options;
          }
          try {
            result && console['warn']('[ImageHD] cancel request failed:', result);
          } finally {
            _hdTaskMachine['reset'](button);
          }
        })();
        return;
      }
      if (enabled) return;
      enabled = !![];
      const target = window['currentProjectId'];
      let enabled2 = ![];
      const source = () => {
          enabled2 = !![];
        },
        handler = () =>
          !enabled2 &&
          window['currentProjectId'] === target &&
          !!(store['getStateRaw']?.() || store['getState']())['nodes']?.[nodeId];
      window['addEventListener']('aicanvas:active-canvas-changed', source);
      try {
        closeToolbarMoreMenu?.();
        const openHdPanel2 = await openHdPanel({
          store: store,
          sourceNodeId: nodeId,
          returnFocus: button,
        });
        if (!openHdPanel2 || !handler()) return;
        await submitHdTask(value, openHdPanel2, handler);
      } catch (error) {
        window['showToast']?.(error?.['message'] || String(error), 'error');
      } finally {
        ((enabled = ![]), window['removeEventListener']('aicanvas:active-canvas-changed', source));
      }
    }));
}
