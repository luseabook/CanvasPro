import { t } from '../../../i18n/index.js';
function imageToolbarText(value) {
  return t('nodeToolbar.image.' + value);
}
export function bindImageExpandAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      ImageExpandController: ImageExpandController,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
    } = item,
    button = toolbarEl.querySelector('.act-expand');
  button &&
    (bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () => findRunningHubToolbarTaskForNode(nodeId, { taskTypes: ['image-expand'] }),
      cancelTask: (key) =>
        cancelRunningHubResultTask(key, {
          name: imageToolbarText('expandCancelledName'),
          outputText: imageToolbarText('expandCancelledOutput'),
          notifyMessage: imageToolbarText('expandCancelledToast'),
        }),
      cancelTooltip: imageToolbarText('cancelExpand'),
    }),
    button.addEventListener('click', (event) => {
      (event.stopPropagation(),
        window.v2FocusOnNode && window.v2FocusOnNode(nodeId, 260, 1200),
        ImageExpandController.init(nodeId));
    }));
}
