import { t } from '../../../i18n/index.js';
function imageToolbarText(value) {
  return t('nodeToolbar.image.' + value);
}
export function bindImageLocalEditAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      ImageAnnotateController: ImageAnnotateController,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
    } = item,
    button = toolbarEl['querySelector']('.act-local-edit');
  if (!button) return;
  bindRunningHubToolbarTaskButton({
    button: button,
    getTask: () => findRunningHubToolbarTaskForNode(nodeId, { taskTypes: ['image-repaint', 'image-erase'] }),
    cancelTask: (key) => {
      const index = key['node']?.['rhToolbarTaskType'] === 'image-erase' ? 'erase' : 'repaint';
      return cancelRunningHubResultTask(key, {
        name: imageToolbarText(index + 'CancelledName'),
        outputText: imageToolbarText(index + 'CancelledOutput'),
        notifyMessage: imageToolbarText(index + 'CancelledToast'),
      });
    },
    cancelTooltip: imageToolbarText('cancelLocalEdit'),
    eventTypes: ['click', 'image-local-edit-open'],
  });
  const result = (event) => {
    (event['stopPropagation'](), window['v2FocusOnNode']?.(nodeId));
    const scene = event['detail']?.['scene'];
    ImageAnnotateController['init'](nodeId, {
      scene: scene === 'repaint' || scene === 'erase' ? scene : 'local-edit',
      submitLabel: imageToolbarText('generate'),
      submitBusyLabel: imageToolbarText('generating'),
      submitNoop: true,
    });
  };
  (button['addEventListener']('click', result), button['addEventListener']('image-local-edit-open', result));
}
