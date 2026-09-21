import { t } from '../../../i18n/index.js';
function imageToolbarText(_0x2d48dc) {
  return t('nodeToolbar.image.' + _0x2d48dc);
}
export function bindImageExpandAction(_0x60a8b7) {
  const {
      toolbarEl: _0x3c378b,
      nodeId: _0x4f5658,
      ImageExpandController: _0x1d35b3,
      bindRunningHubToolbarTaskButton: _0x5c7c5f,
      cancelRunningHubResultTask: _0x37a580,
      findRunningHubToolbarTaskForNode: _0x3df2da,
    } = _0x60a8b7,
    _0x1975b6 = _0x3c378b.querySelector('.act-expand');
  _0x1975b6 &&
    (_0x5c7c5f({
      button: _0x1975b6,
      getTask: () => _0x3df2da(_0x4f5658, { taskTypes: ['image-expand'] }),
      cancelTask: (_0x1f3255) =>
        _0x37a580(_0x1f3255, {
          name: imageToolbarText('expandCancelledName'),
          outputText: imageToolbarText('expandCancelledOutput'),
          notifyMessage: imageToolbarText('expandCancelledToast'),
        }),
      cancelTooltip: imageToolbarText('cancelExpand'),
    }),
    _0x1975b6.addEventListener('click', (_0x2c99cc) => {
      (_0x2c99cc.stopPropagation(),
        window.v2FocusOnNode && window.v2FocusOnNode(_0x4f5658, 0x104, 0x4b0),
        _0x1d35b3.init(_0x4f5658));
    }));
}
