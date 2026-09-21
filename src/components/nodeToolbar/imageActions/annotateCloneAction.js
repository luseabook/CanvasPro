import { t } from '../../../i18n/index.js';
function imageToolbarText(_0x2def3f) {
  return t('nodeToolbar.image.' + _0x2def3f);
}
export function bindImageAnnotateCloneActions(_0x352304) {
  const {
      toolbarEl: _0x104810,
      nodeId: _0x44f172,
      ImageAnnotateController: _0x4fbb8d,
      bindRunningHubToolbarTaskButton: _0xfb4940,
      cancelRunningHubResultTask: _0x2b72f5,
      findRunningHubToolbarTaskForNode: _0x4b5598,
    } = _0x352304,
    _0xcbea27 = [
      {
        act: 'repaint',
        scene: 'repaint',
        taskType: 'image-repaint',
        cancelName: imageToolbarText('repaintCancelledName'),
        cancelOutputText: imageToolbarText('repaintCancelledOutput'),
        cancelToast: imageToolbarText('repaintCancelledToast'),
        cancelTooltip: imageToolbarText('cancelRepaint'),
      },
      {
        act: 'erase',
        scene: 'erase',
        taskType: 'image-erase',
        cancelName: imageToolbarText('eraseCancelledName'),
        cancelOutputText: imageToolbarText('eraseCancelledOutput'),
        cancelToast: imageToolbarText('eraseCancelledToast'),
        cancelTooltip: imageToolbarText('cancelErase'),
      },
    ];
  _0xcbea27.forEach(
    ({
      act: _0x353558,
      scene: _0x3db2d2,
      taskType: _0x2ad980,
      cancelName: _0x456031,
      cancelOutputText: _0xdcdaa5,
      cancelToast: _0x1d554b,
      cancelTooltip: _0x13f48c,
    }) => {
      const _0x43003a = _0x104810.querySelector('.act-' + _0x353558);
      if (!_0x43003a) return;
      (_0xfb4940({
        button: _0x43003a,
        getTask: () => _0x4b5598(_0x44f172, { taskTypes: [_0x2ad980] }),
        cancelTask: (_0x31b2cc) =>
          _0x2b72f5(_0x31b2cc, { name: _0x456031, outputText: _0xdcdaa5, notifyMessage: _0x1d554b }),
        cancelTooltip: _0x13f48c,
      }),
        _0x43003a.addEventListener('click', (_0x2e4bb9) => {
          (_0x2e4bb9.stopPropagation(),
            window.v2FocusOnNode && window.v2FocusOnNode(_0x44f172),
            _0x4fbb8d.init(_0x44f172, {
              scene: _0x3db2d2,
              submitLabel: imageToolbarText('generate'),
              submitBusyLabel: imageToolbarText('generating'),
              submitNoop: true,
            }));
        }));
    },
  );
}
