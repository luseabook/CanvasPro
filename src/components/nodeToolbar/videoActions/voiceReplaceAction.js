import { AUDIO_VOICE_PANEL_OPEN_EVENT } from '../../../modules/audioVoicePanelEvents.js';
import { t } from '../../../i18n/index.js';
function videoToolbarText(value) {
  return t('nodeToolbar.video.' + value);
}
export function bindVideoVoiceReplaceAction(item) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      VideoClipController: VideoClipController,
      VideoKeyingController: VideoKeyingController,
    } = item,
    el = toolbarEl.querySelector('.act-voice-replace');
  if (!el) return;
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
      window.dispatchEvent(
        new CustomEvent(AUDIO_VOICE_PANEL_OPEN_EVENT, { detail: { sourceNodeId: nodeData?.id || '' } }),
      ));
  });
}
