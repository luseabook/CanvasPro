import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
export function createCollaborationNicknameEditor({
  row: _0x290dda,
  controls: _0x4d3760,
  element: _0x404421,
  button: _0x57e8d6,
  run: _0x100e36,
  actions: _0x21f9eb,
  getState: _0xc5873e,
  person: _0x557459,
}) {
  let _0x238924 = _0x557459['name'],
    _0x135340 = ![],
    _0x2258e7 = ![];
  const _0x354e2a = _0xc5873e()['session'],
    _0x24a873 = () =>
      !_0x2258e7 &&
      _0xc5873e()['session']?.['roomId'] === _0x354e2a['roomId'] &&
      _0xc5873e()['actorId'] === _0x557459['id'],
    _0x50534b = _0x404421('form', 'collaboration-nickname-editor');
  _0x50534b['hidden'] = !![];
  const _0x1ec043 = _0x404421('input', 'collaboration-input');
  ((_0x1ec043['maxLength'] = 0x20),
    (_0x1ec043['required'] = !![]),
    _0x1ec043['setAttribute']('aria-label', '新的协作昵称'),
    (_0x1ec043['autocomplete'] = 'off'));
  const _0x57fa92 = _0x57e8d6(
    '',
    () => {
      ((_0x1ec043['value'] = _0x238924),
        (_0x50534b['hidden'] = ![]),
        (_0x57fa92['hidden'] = !![]),
        _0x1ec043['focus'](),
        _0x1ec043['select']());
    },
    _0x4d3760,
    ![],
  );
  (_0x57fa92['setAttribute']('aria-label', '修改我的协作昵称'),
    _0x57fa92['append'](createContextMenuIcon('edit')));
  const _0x256de2 = _0x404421('button', 'collaboration-button', '保存');
  _0x256de2['type'] = 'submit';
  const _0x4c818a = _0x404421('button', 'collaboration-button', '取消');
  _0x4c818a['type'] = 'button';
  function _0x7cfff2(_0x37c554 = ![]) {
    ((_0x50534b['hidden'] = !![]), (_0x57fa92['hidden'] = ![]));
    if (_0x37c554 && _0x24a873()) _0x57fa92['focus']();
  }
  return (
    _0x4c818a['addEventListener']('click', () => {
      if (!_0x135340) _0x7cfff2(!![]);
    }),
    _0x1ec043['addEventListener']('input', () => _0x1ec043['setCustomValidity']('')),
    _0x50534b['addEventListener']('keydown', (_0x5287c4) => {
      if (_0x5287c4['isComposing'] || _0x5287c4['keyCode'] === 0xe5) {
        if (_0x5287c4['key'] === 'Enter') _0x5287c4['preventDefault']();
        return;
      }
      if (_0x5287c4['key'] === 'Escape') {
        (_0x5287c4['preventDefault'](), _0x5287c4['stopPropagation']());
        if (!_0x135340) _0x7cfff2(!![]);
      }
    }),
    _0x50534b['addEventListener']('submit', async (_0x368e89) => {
      _0x368e89['preventDefault']();
      if (!_0x24a873() || _0x135340) return;
      const _0x384a9a = _0x1ec043['value']['trim']();
      if (!_0x384a9a) {
        (_0x1ec043['setCustomValidity']('请输入昵称'), _0x1ec043['reportValidity']());
        return;
      }
      if (_0x384a9a === _0x238924) {
        _0x7cfff2(!![]);
        return;
      }
      await _0x100e36(
        _0x256de2,
        async () => {
          ((_0x135340 = !![]),
            (_0x1ec043['disabled'] = !![]),
            (_0x4c818a['disabled'] = !![]),
            (_0x57fa92['disabled'] = !![]));
          try {
            (await _0x21f9eb['renameSelf'](_0x384a9a),
              _0x24a873() &&
                ((_0x238924 = _0x384a9a), (_0x57fa92['disabled'] = ![]), _0x7cfff2(!_0x50534b['hidden'])));
          } finally {
            ((_0x135340 = ![]),
              (_0x1ec043['disabled'] = ![]),
              (_0x4c818a['disabled'] = ![]),
              (_0x57fa92['disabled'] = ![]));
          }
        },
        '正在更新昵称…',
      );
    }),
    _0x50534b['append'](_0x1ec043, _0x256de2, _0x4c818a),
    _0x290dda['append'](_0x50534b),
    {
      update(_0x48000d) {
        _0x238924 = _0x48000d;
      },
      close() {
        _0x7cfff2();
      },
      destroy() {
        _0x2258e7 = !![];
      },
    }
  );
}
