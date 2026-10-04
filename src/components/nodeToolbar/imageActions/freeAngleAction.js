import { t } from '../../../i18n/index.js';
function imageToolbarText(value) {
  return t('nodeToolbar.image.' + value);
}
export function bindImageFreeAngleAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
    } = item,
    button = toolbarEl.querySelector('.act-multiangle');
  button &&
    (bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () => findRunningHubToolbarTaskForNode(nodeId, { taskTypes: ['image-free-angle'] }),
      cancelTask: (key) =>
        cancelRunningHubResultTask(key, {
          name: imageToolbarText('rotateCancelledName'),
          outputText: imageToolbarText('rotateCancelledOutput'),
          notifyMessage: imageToolbarText('rotateCancelledToast'),
        }),
      cancelTooltip: imageToolbarText('cancelRotate'),
    }),
    button.addEventListener('click', (event) => {
      (event.stopPropagation(),
        toolbarEl.dispatchEvent(
          new CustomEvent('v2-node:free-angle', { bubbles: true, detail: { nodeId: nodeId } }),
        ));
    }));
}
