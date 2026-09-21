import { t } from '../../../i18n/index.js';
function videoToolbarText(_0x7ca9fe) {
  return t('nodeToolbar.video.' + _0x7ca9fe);
}
export function bindVideoClipAction(_0x4a072a) {
  const {
      toolbarEl: _0x204e5c,
      nodeData: _0x374813,
      getStateSnapshot: _0x32be49,
      VideoClipController: _0x24d276,
      VideoKeyingController: _0x37e9e3,
      VIDEO_TOOLBAR_FOCUS_PADDING: _0x1cebe6,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: _0x5b0d2e,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: _0x22ba5e,
    } = _0x4a072a,
    _0x4b2443 = _0x204e5c.querySelector('.act-clip');
  _0x4b2443 &&
    _0x4b2443.addEventListener('click', (_0x4c0456) => {
      _0x4c0456.stopPropagation();
      const _0x5ab97d = _0x32be49();
      if (_0x5ab97d.videoKeying?.active) {
        window.showToast?.(videoToolbarText('exitKeyingMode'), 'info');
        return;
      }
      if (_0x5ab97d.videoClip?.active) {
        window.showToast?.(videoToolbarText('exitClipMode'), 'info');
        return;
      }
      (_0x37e9e3.exit({ silent: true }),
        window.v2FocusOnNode
          ? (window.v2FocusOnNode(_0x374813.id, _0x1cebe6, _0x5b0d2e, _0x22ba5e),
            setTimeout(() => {
              _0x24d276.init(_0x374813.id);
            }, _0x5b0d2e))
          : _0x24d276.init(_0x374813.id));
    });
}
