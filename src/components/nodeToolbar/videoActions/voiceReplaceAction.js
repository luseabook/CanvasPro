import { AUDIO_VOICE_PANEL_OPEN_EVENT } from '../../../modules/audioVoicePanelEvents.js';
import { t } from '../../../i18n/index.js';
function videoToolbarText(_0x2f62b2) {
  return t('nodeToolbar.video.' + _0x2f62b2);
}
export function bindVideoVoiceReplaceAction(_0x38c354) {
  const {
      toolbarEl: _0x493e46,
      nodeData: _0x14af42,
      getStateSnapshot: _0x2c2128,
      VideoClipController: _0x2ea029,
      VideoKeyingController: _0x1b1a88,
    } = _0x38c354,
    _0x4b25ae = _0x493e46['querySelector']('.act-voice-replace');
  if (!_0x4b25ae) return;
  _0x4b25ae['addEventListener']('click', (_0x2bb226) => {
    _0x2bb226['stopPropagation']();
    const _0x2672c5 = _0x2c2128();
    if (_0x2672c5['videoKeying']?.['active']) {
      window['showToast']?.(videoToolbarText('exitCurrentEditMode'), 'info');
      return;
    }
    if (_0x2672c5['videoClip']?.['active']) {
      window['showToast']?.(videoToolbarText('exitClipMode'), 'info');
      return;
    }
    (_0x2ea029['exit']({ silent: !![] }),
      _0x1b1a88['exit']({ silent: !![] }),
      window['dispatchEvent'](
        new CustomEvent(AUDIO_VOICE_PANEL_OPEN_EVENT, { detail: { sourceNodeId: _0x14af42?.['id'] || '' } }),
      ));
  });
}
