import { t } from '../../../i18n/index.js';
function videoToolbarText(_0x317b11) {
  return t('nodeToolbar.video.' + _0x317b11);
}
export function bindVideoKeyingAction(_0x531364) {
  const {
      toolbarEl: _0x243409,
      nodeData: _0x3f5350,
      getStateSnapshot: _0x3b11c5,
      store: _0x1ab1ff,
      VideoClipController: _0x52a0d3,
      VideoKeyingController: _0x3a50eb,
      VIDEO_TOOLBAR_FOCUS_PADDING: _0x428f9c,
      VIDEO_TOOLBAR_FOCUS_DURATION_MS: _0x4c7d1b,
      VIDEO_TOOLBAR_FOCUS_MAX_ZOOM: _0x3c767c,
      KEYING_CANCEL_ICON_HTML: _0x141c42,
    } = _0x531364,
    _0x218fc8 = _0x243409.querySelector('.act-keying');
  if (_0x218fc8) {
    const _0x1604f5 = {
        html: _0x218fc8.innerHTML,
        tooltip: _0x218fc8.dataset.tooltip || '',
        aria: _0x218fc8.getAttribute('aria-label') || '',
        title: _0x218fc8.title || '',
      },
      _0x381444 = () => String(_0x3f5350?.id || '').trim(),
      _0x210c3b = () => {
        if (_0x243409.isConnected === false) {
          window.removeEventListener?.(_0x3a50eb.TASK_CHANGE_EVENT, _0x210c3b);
          return;
        }
        const _0xc9cb97 = _0x3a50eb.hasRunningKeyingTaskForNode(_0x381444());
        _0x218fc8.classList.toggle('is-task-cancel', _0xc9cb97);
        if (_0xc9cb97) {
          ((_0x218fc8.innerHTML = _0x141c42),
            (_0x218fc8.dataset.tooltip = videoToolbarText('cancelKeyingTask')),
            _0x218fc8.setAttribute('aria-label', videoToolbarText('cancelKeyingTask')),
            (_0x218fc8.title = videoToolbarText('cancelKeyingTask')));
          return;
        }
        ((_0x218fc8.innerHTML = _0x1604f5.html),
          _0x1604f5.tooltip
            ? (_0x218fc8.dataset.tooltip = _0x1604f5.tooltip)
            : delete _0x218fc8.dataset.tooltip,
          _0x1604f5.aria
            ? _0x218fc8.setAttribute('aria-label', _0x1604f5.aria)
            : _0x218fc8.removeAttribute('aria-label'),
          (_0x218fc8.title = _0x1604f5.title));
      };
    window.addEventListener?.(_0x3a50eb.TASK_CHANGE_EVENT, _0x210c3b);
    const _0x1ad836 =
      typeof _0x1ab1ff.subscribeSelector === 'function'
        ? _0x1ab1ff.subscribeSelector(
            (_0x2b7506) => _0x2b7506.nodes,
            () => _0x210c3b(),
          )
        : null;
    ((_0x218fc8._cleanupKeyingButtonState = () => {
      (window.removeEventListener?.(_0x3a50eb.TASK_CHANGE_EVENT, _0x210c3b), _0x1ad836?.());
    }),
      _0x210c3b(),
      _0x218fc8.addEventListener('click', (_0x34d95d) => {
        (_0x34d95d.preventDefault(), _0x34d95d.stopPropagation());
        if (_0x3a50eb.hasRunningKeyingTaskForNode(_0x381444())) {
          void _0x3a50eb.cancelRunningKeyingTaskForNode(_0x381444(), { notify: true }).finally(_0x210c3b);
          return;
        }
        const _0x44212b = _0x3b11c5();
        if (_0x44212b.videoKeying?.active) {
          window.showToast?.(videoToolbarText('exitKeyingMode'), 'info');
          return;
        }
        if (_0x44212b.videoClip?.active) {
          window.showToast?.(videoToolbarText('exitClipMode'), 'info');
          return;
        }
        (_0x52a0d3.exit({ silent: true }),
          window.v2FocusOnNode
            ? (window.v2FocusOnNode(_0x3f5350.id, _0x428f9c, _0x4c7d1b, _0x3c767c),
              setTimeout(() => {
                _0x3a50eb.init(_0x3f5350.id);
              }, _0x4c7d1b))
            : _0x3a50eb.init(_0x3f5350.id));
      }));
  }
}
