import { t } from '../../../i18n/index.js';
function imageToolbarText(_0x274c44) {
  return t('nodeToolbar.image.' + _0x274c44);
}
export function bindImageFreeAngleAction(_0x1e9a80) {
  const {
      toolbarEl: _0x2e6592,
      nodeId: _0x10c3da,
      bindRunningHubToolbarTaskButton: _0x351042,
      cancelRunningHubResultTask: _0x55b612,
      findRunningHubToolbarTaskForNode: _0x56eb84,
    } = _0x1e9a80,
    _0x1a482f = _0x2e6592.querySelector('.act-multiangle');
  _0x1a482f &&
    (_0x351042({
      button: _0x1a482f,
      getTask: () => _0x56eb84(_0x10c3da, { taskTypes: ['image-free-angle'] }),
      cancelTask: (_0x4183d5) =>
        _0x55b612(_0x4183d5, {
          name: imageToolbarText('rotateCancelledName'),
          outputText: imageToolbarText('rotateCancelledOutput'),
          notifyMessage: imageToolbarText('rotateCancelledToast'),
        }),
      cancelTooltip: imageToolbarText('cancelRotate'),
    }),
    _0x1a482f.addEventListener('click', (_0x2d1cac) => {
      (_0x2d1cac.stopPropagation(),
        _0x2e6592.dispatchEvent(
          new CustomEvent('v2-node:free-angle', { bubbles: true, detail: { nodeId: _0x10c3da } }),
        ));
    }));
}
