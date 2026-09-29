import { t } from '../../../i18n/index.js';
function imageToolbarText(_0x30036a) {
  return t('nodeToolbar.image.' + _0x30036a);
}
export function bindImageLocalEditAction(_0x51a754) {
  const {
      toolbarEl: _0x38aa5a,
      nodeId: _0x4e7e2f,
      ImageAnnotateController: _0x554b7b,
      bindRunningHubToolbarTaskButton: _0x441390,
      cancelRunningHubResultTask: _0x58eb8c,
      findRunningHubToolbarTaskForNode: _0x1622f6,
    } = _0x51a754,
    _0x25f693 = _0x38aa5a['querySelector']('.act-local-edit');
  if (!_0x25f693) return;
  _0x441390({
    button: _0x25f693,
    getTask: () => _0x1622f6(_0x4e7e2f, { taskTypes: ['image-repaint', 'image-erase'] }),
    cancelTask: (_0x1e1014) => {
      const _0x37c7f3 = _0x1e1014['node']?.['rhToolbarTaskType'] === 'image-erase' ? 'erase' : 'repaint';
      return _0x58eb8c(_0x1e1014, {
        name: imageToolbarText(_0x37c7f3 + 'CancelledName'),
        outputText: imageToolbarText(_0x37c7f3 + 'CancelledOutput'),
        notifyMessage: imageToolbarText(_0x37c7f3 + 'CancelledToast'),
      });
    },
    cancelTooltip: imageToolbarText('cancelLocalEdit'),
    eventTypes: ['click', 'image-local-edit-open'],
  });
  const _0x2bf111 = (_0x284726) => {
    (_0x284726['stopPropagation'](), window['v2FocusOnNode']?.(_0x4e7e2f));
    const _0x21209d = _0x284726['detail']?.['scene'];
    _0x554b7b['init'](_0x4e7e2f, {
      scene: _0x21209d === 'repaint' || _0x21209d === 'erase' ? _0x21209d : 'local-edit',
      submitLabel: imageToolbarText('generate'),
      submitBusyLabel: imageToolbarText('generating'),
      submitNoop: !![],
    });
  };
  (_0x25f693['addEventListener']('click', _0x2bf111),
    _0x25f693['addEventListener']('image-local-edit-open', _0x2bf111));
}
