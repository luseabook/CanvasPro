import { t } from '../../../i18n/index.js';
function imageToolbarText(value) {
  return t('nodeToolbar.image.' + value);
}
export function bindImageAnnotateCloneActions(item) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      ImageAnnotateController: ImageAnnotateController,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
      cancelRunningHubResultTask: cancelRunningHubResultTask,
      findRunningHubToolbarTaskForNode: findRunningHubToolbarTaskForNode,
    } = item,
    list = [
      {
        act: 'repaint',
        scene: 'repaint',
        taskType: 'image-repaint',
        cancelName: imageToolbarText('repaintCancelledName'),
        cancelOutputText: imageToolbarText('repaintCancelledOutput'),
        cancelToast: imageToolbarText('repaintCancelledToast'),
        cancelTooltip: imageToolbarText('cancelRepaint'),
      },
      {
        act: 'erase',
        scene: 'erase',
        taskType: 'image-erase',
        cancelName: imageToolbarText('eraseCancelledName'),
        cancelOutputText: imageToolbarText('eraseCancelledOutput'),
        cancelToast: imageToolbarText('eraseCancelledToast'),
        cancelTooltip: imageToolbarText('cancelErase'),
      },
    ];
  list.forEach(
    ({
      act: act,
      scene: scene,
      taskType: taskType,
      cancelName: cancelName,
      cancelOutputText: cancelOutputText,
      cancelToast: cancelToast,
      cancelTooltip: cancelTooltip,
    }) => {
      const button = toolbarEl.querySelector('.act-' + act);
      if (!button) return;
      (bindRunningHubToolbarTaskButton({
        button: button,
        getTask: () => findRunningHubToolbarTaskForNode(nodeId, { taskTypes: [taskType] }),
        cancelTask: (key) =>
          cancelRunningHubResultTask(key, {
            name: cancelName,
            outputText: cancelOutputText,
            notifyMessage: cancelToast,
          }),
        cancelTooltip: cancelTooltip,
      }),
        button.addEventListener('click', (event) => {
          (event.stopPropagation(),
            window.v2FocusOnNode && window.v2FocusOnNode(nodeId),
            ImageAnnotateController.init(nodeId, {
              scene: scene,
              submitLabel: imageToolbarText('generate'),
              submitBusyLabel: imageToolbarText('generating'),
              submitNoop: true,
            }));
        }));
    },
  );
}
