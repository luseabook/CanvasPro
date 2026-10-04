import { t } from '../../../i18n/index.js';
function videoToolbarText(value) {
  return t('nodeToolbar.video.' + value);
}
export function bindVideoKeyingAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      store: store,
      VideoClipController: VideoClipController,
      VideoKeyingController: VideoKeyingController,
      VIDEO_TOOLBAR_FOCUS_PADDING: VIDEO_TOOLBAR_FOCUS_PADDING,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: VIDEO_TOOLBAR_FOCUS_DURATION_MS,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: VIDEO_TOOLBAR_FOCUS_MAX_ZOOM,
      KEYING_CANCEL_ICON_HTML: KEYING_CANCEL_ICON_HTML,
    } = item,
    html = toolbarEl.querySelector('.act-keying');
  if (html) {
    const key = {
        html: html.innerHTML,
        tooltip: html.dataset.tooltip || '',
        aria: html.getAttribute('aria-label') || '',
        title: html.title || '',
      },
      handler = () => String(nodeData?.id || '').trim(),
      handler2 = () => {
        if (toolbarEl.isConnected === false) {
          window.removeEventListener?.(VideoKeyingController.TASK_CHANGE_EVENT, handler2);
          return;
        }
        const index = VideoKeyingController.hasRunningKeyingTaskForNode(handler());
        html.classList.toggle('is-task-cancel', index);
        if (index) {
          ((html.innerHTML = KEYING_CANCEL_ICON_HTML),
            (html.dataset.tooltip = videoToolbarText('cancelKeyingTask')),
            html.setAttribute('aria-label', videoToolbarText('cancelKeyingTask')),
            (html.title = videoToolbarText('cancelKeyingTask')));
          return;
        }
        ((html.innerHTML = key.html),
          key.tooltip ? (html.dataset.tooltip = key.tooltip) : delete html.dataset.tooltip,
          key.aria ? html.setAttribute('aria-label', key.aria) : html.removeAttribute('aria-label'),
          (html.title = key.title));
      };
    window.addEventListener?.(VideoKeyingController.TASK_CHANGE_EVENT, handler2);
    const result =
      typeof store.subscribeSelector === 'function'
        ? store.subscribeSelector(
            (data) => data.nodes,
            () => handler2(),
          )
        : null;
    ((html._cleanupKeyingButtonState = () => {
      (window.removeEventListener?.(VideoKeyingController.TASK_CHANGE_EVENT, handler2), result?.());
    }),
      handler2(),
      html.addEventListener('click', (event) => {
        (event.preventDefault(), event.stopPropagation());
        if (VideoKeyingController.hasRunningKeyingTaskForNode(handler())) {
          void VideoKeyingController.cancelRunningKeyingTaskForNode(handler(), { notify: true }).finally(
            handler2,
          );
          return;
        }
        const options = getStateSnapshot();
        if (options.videoKeying?.active) {
          window.showToast?.(videoToolbarText('exitKeyingMode'), 'info');
          return;
        }
        if (options.videoClip?.active) {
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
                VideoKeyingController.init(nodeData.id);
              }, VIDEO_TOOLBAR_FOCUS_DURATION_MS))
            : VideoKeyingController.init(nodeData.id));
      }));
  }
}
