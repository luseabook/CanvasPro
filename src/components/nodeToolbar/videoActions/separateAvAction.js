import { t } from '../../../i18n/index.js';
function videoToolbarText(value) {
  return t('nodeToolbar.video.' + value);
}
export function bindVideoSeparateAvAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      VideoClipController: VideoClipController,
      runVideoAudioSeparationFromNode: runVideoAudioSeparationFromNode,
      VideoKeyingController: VideoKeyingController,
    } = item,
    el = toolbarEl.querySelector('.act-separate-av');
  el &&
    el.addEventListener('click', (event) => {
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
        VideoKeyingController.exit({ silent: true }),
        void runVideoAudioSeparationFromNode(nodeData.id));
    });
}
