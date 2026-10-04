import { t } from '../../../i18n/index.js';
function videoToolbarText(value) {
  return t('nodeToolbar.video.' + value);
}
export function bindVideoClipAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      VideoClipController: VideoClipController,
      VideoKeyingController: VideoKeyingController,
      VIDEO_TOOLBAR_FOCUS_PADDING: VIDEO_TOOLBAR_FOCUS_PADDING,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: VIDEO_TOOLBAR_FOCUS_DURATION_MS,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: VIDEO_TOOLBAR_FOCUS_MAX_ZOOM,
    } = item,
    el = toolbarEl.querySelector('.act-clip');
  el &&
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const key = getStateSnapshot();
      if (key.videoKeying?.active) {
        window.showToast?.(videoToolbarText('exitKeyingMode'), 'info');
        return;
      }
      if (key.videoClip?.active) {
        window.showToast?.(videoToolbarText('exitClipMode'), 'info');
        return;
      }
      (VideoKeyingController.exit({ silent: true }),
        window.v2FocusOnNode
          ? (window.v2FocusOnNode(
              nodeData.id,
              VIDEO_TOOLBAR_FOCUS_PADDING,
              VIDEO_TOOLBAR_FOCUS_DURATION_MS,
              VIDEO_TOOLBAR_FOCUS_MAX_ZOOM,
            ),
            setTimeout(() => {
              VideoClipController.init(nodeData.id);
            }, VIDEO_TOOLBAR_FOCUS_DURATION_MS))
          : VideoClipController.init(nodeData.id));
    });
}
