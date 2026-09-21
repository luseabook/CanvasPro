import { t } from '../../../i18n/index.js';
function videoToolbarText(_0x579649) {
  return t('nodeToolbar.video.' + _0x579649);
}
export function bindVideoSeparateAvAction(_0x3ec7dc) {
  const {
      toolbarEl: _0x1d9d94,
      nodeData: _0x588397,
      getStateSnapshot: _0x3efd64,
      VideoClipController: _0x3c8b89,
      runVideoAudioSeparationFromNode: _0x2c27eb,
      VideoKeyingController: _0x9c678c,
    } = _0x3ec7dc,
    _0x45b1a3 = _0x1d9d94.querySelector('.act-separate-av');
  _0x45b1a3 &&
    _0x45b1a3.addEventListener('click', (_0x3314f4) => {
      _0x3314f4.stopPropagation();
      const _0x5033f9 = _0x3efd64();
      if (_0x5033f9.videoKeying?.active) {
        window.showToast?.(videoToolbarText('exitCurrentEditMode'), 'info');
        return;
      }
      if (_0x5033f9.videoClip?.active) {
        window.showToast?.(videoToolbarText('exitClipMode'), 'info');
        return;
      }
      (_0x3c8b89.exit({ silent: true }), _0x9c678c.exit({ silent: true }), void _0x2c27eb(_0x588397.id));
    });
}
