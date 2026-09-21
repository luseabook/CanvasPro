import { t } from '../../../i18n/index.js';
function videoToolbarText(_0x3f10b6) {
  return t('nodeToolbar.video.' + _0x3f10b6);
}
export function bindVideoRemoveAction(_0xf68eb9) {
  const {
      toolbarEl: _0x34ad73,
      nodeData: _0x5255f2,
      getStateSnapshot: _0x5ec154,
      VideoClipController: _0xa2bdf9,
      VideoKeyingController: _0x4dd3a9,
      VIDEO_TOOLBAR_FOCUS_PADDING: _0x3161ab,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: _0xfc1593,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: _0x11f97a,
      bindRunningHubToolbarTaskButton: _0x1e89f5,
    } = _0xf68eb9,
    _0x1ef90f = _0x34ad73.querySelector('.act-remove');
  _0x1ef90f &&
    (_0x1e89f5({
      button: _0x1ef90f,
      getTask: () => _0x4dd3a9.getRunningRemoveTaskForNode?.(_0x5255f2.id),
      cancelTask: () => _0x4dd3a9.cancelRunningRemoveTaskForNode?.(_0x5255f2.id, { notify: true }),
      cancelTooltip: videoToolbarText('cancelRemoveTask'),
    }),
    _0x1ef90f.addEventListener('click', (_0x303ae1) => {
      if (_0x4dd3a9.hasRunningRemoveTaskForNode?.(_0x5255f2.id)) {
        (_0x303ae1.preventDefault(),
          _0x303ae1.stopPropagation(),
          void _0x4dd3a9.cancelRunningRemoveTaskForNode?.(_0x5255f2.id, { notify: true }));
        return;
      }
      _0x303ae1.stopPropagation();
      const _0x59ac77 = _0x5ec154();
      if (_0x59ac77.videoKeying?.active) {
        window.showToast?.(videoToolbarText('exitCurrentEditMode'), 'info');
        return;
      }
      if (_0x59ac77.videoClip?.active) {
        window.showToast?.(videoToolbarText('exitClipMode'), 'info');
        return;
      }
      (_0xa2bdf9.exit({ silent: true }),
        window.v2FocusOnNode
          ? (window.v2FocusOnNode(_0x5255f2.id, _0x3161ab, _0xfc1593, _0x11f97a),
            setTimeout(() => {
              _0x4dd3a9.init(_0x5255f2.id, { uiMode: 'remove' });
            }, _0xfc1593))
          : _0x4dd3a9.init(_0x5255f2.id, { uiMode: 'remove' }));
    }));
}
