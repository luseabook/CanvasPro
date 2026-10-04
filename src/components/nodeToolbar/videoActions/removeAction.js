import { t } from '../../../i18n/index.js';
function videoToolbarText(value) {
  return t('nodeToolbar.video.' + value);
}
export function bindVideoRemoveAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      VideoClipController: VideoClipController,
      VideoKeyingController: VideoKeyingController,
      VIDEO_TOOLBAR_FOCUS_PADDING: VIDEO_TOOLBAR_FOCUS_PADDING,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: VIDEO_TOOLBAR_FOCUS_DURATION_MS,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: VIDEO_TOOLBAR_FOCUS_MAX_ZOOM,
      bindRunningHubToolbarTaskButton: bindRunningHubToolbarTaskButton,
    } = item,
    button = toolbarEl.querySelector('.act-remove');
  button &&
    (bindRunningHubToolbarTaskButton({
      button: button,
      getTask: () => VideoKeyingController.getRunningRemoveTaskForNode?.(nodeData.id),
      cancelTask: () => VideoKeyingController.cancelRunningRemoveTaskForNode?.(nodeData.id, { notify: true }),
      cancelTooltip: videoToolbarText('cancelRemoveTask'),
    }),
    button.addEventListener('click', (event) => {
      if (VideoKeyingController.hasRunningRemoveTaskForNode?.(nodeData.id)) {
        (event.preventDefault(),
          event.stopPropagation(),
          void VideoKeyingController.cancelRunningRemoveTaskForNode?.(nodeData.id, { notify: true }));
        return;
      }
      event.stopPropagation();
      const key = getStateSnapshot();
      if (key.videoKeying?.active) {
        window.showToast?.(videoToolbarText('exitCurrentEditMode'), 'info');
        return;
      }
      if (key.videoClip?.active) {
        window.showToast?.(videoToolbarText('exitClipMode'), 'info');
        return;
      }
      (VideoClipController.exit({ silent: true }),
        window.v2FocusOnNode
          ? (window.v2FocusOnNode(
              nodeData.id,
              VIDEO_TOOLBAR_FOCUS_PADDING,
              VIDEO_TOOLBAR_FOCUS_DURATION_MS,
              VIDEO_TOOLBAR_FOCUS_MAX_ZOOM,
            ),
            setTimeout(() => {
              VideoKeyingController.init(nodeData.id, { uiMode: 'remove' });
            }, VIDEO_TOOLBAR_FOCUS_DURATION_MS))
          : VideoKeyingController.init(nodeData.id, { uiMode: 'remove' }));
    }));
}
