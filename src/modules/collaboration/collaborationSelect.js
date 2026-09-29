import { MATERIAL_TREE_CHEVRON_ICON_SVG } from '../../components/sharedIconMarkup.js';
export function createCollaborationSelect(_0x548041, _0xfb7324) {
  ((_0x548041['hidden'] = !![]), _0x548041['removeAttribute']('aria-label'));
  const _0x1e53ec = document['createElement']('div');
  _0x1e53ec['className'] = 'collaboration-select';
  const _0x15f5d6 = document['createElement']('button');
  ((_0x15f5d6['type'] = 'button'),
    (_0x15f5d6['className'] = 'collaboration-button collaboration-select-trigger'),
    _0x15f5d6['setAttribute']('aria-label', _0xfb7324),
    _0x15f5d6['setAttribute']('aria-haspopup', 'listbox'));
  const _0x55ded2 = document['createElement']('span'),
    _0xdf46e2 = document['createElement']('span');
  ((_0xdf46e2['innerHTML'] = MATERIAL_TREE_CHEVRON_ICON_SVG), _0x15f5d6['append'](_0x55ded2, _0xdf46e2));
  const _0x5c914b = document['createElement']('div');
  ((_0x5c914b['className'] = 'collaboration-select-menu'),
    _0x5c914b['setAttribute']('popover', 'manual'),
    _0x5c914b['setAttribute']('role', 'listbox'),
    _0x5c914b['setAttribute']('aria-label', _0xfb7324),
    (_0x5c914b['id'] = 'collaboration-select-' + crypto['randomUUID']()),
    _0x15f5d6['setAttribute']('aria-controls', _0x5c914b['id']),
    _0x548041['before'](_0x1e53ec),
    _0x1e53ec['append'](_0x548041, _0x15f5d6, _0x5c914b));
  let _0x1a982d = ![],
    _0x5e4fdb = 0x0,
    _0xb5a01a = '';
  function _0x559531(_0x3a48d6 = ![]) {
    if (!_0x1a982d) return;
    ((_0x1a982d = ![]),
      cancelAnimationFrame(_0x5e4fdb),
      _0x5c914b['hidePopover'](),
      _0x15f5d6['setAttribute']('aria-expanded', 'false'),
      document['removeEventListener']('pointerdown', _0x1f121f, !![]));
    if (_0x3a48d6 && _0x15f5d6['isConnected']) _0x15f5d6['focus']();
  }
  function _0x1f121f(_0x1d9cc8) {
    if (!_0x1e53ec['contains'](_0x1d9cc8['target'])) _0x559531();
  }
  function _0x346c0c() {
    if (!_0x1a982d) return;
    if (!_0x15f5d6['isConnected'] || !_0x15f5d6['checkVisibility']()) {
      _0x559531();
      return;
    }
    const _0x37a535 = _0x15f5d6['getBoundingClientRect'](),
      _0x283ff7 = Math['min'](Math['max'](_0x37a535['width'], 0x82), innerWidth - 0x18);
    ((_0x5c914b['style']['width'] = _0x283ff7 + 'px'),
      (_0x5c914b['style']['left'] =
        Math['max'](0xc, Math['min'](_0x37a535['right'] - _0x283ff7, innerWidth - _0x283ff7 - 0xc)) + 'px'));
    const _0x575210 = innerHeight - _0x37a535['bottom'] - 0x10,
      _0x4c0e5a = _0x37a535['top'] - 0x10,
      _0x69cf10 = _0x575210 < 0x78 && _0x4c0e5a > _0x575210;
    ((_0x5c914b['style']['maxHeight'] =
      Math['max'](0x28, Math['min'](0x118, _0x69cf10 ? _0x4c0e5a : _0x575210)) + 'px'),
      (_0x5c914b['style']['top'] = _0x69cf10 ? 'auto' : _0x37a535['bottom'] + 0x4 + 'px'),
      (_0x5c914b['style']['bottom'] = _0x69cf10 ? innerHeight - _0x37a535['top'] + 0x4 + 'px' : 'auto'),
      (_0x5e4fdb = requestAnimationFrame(_0x346c0c)));
  }
  function _0x4b37d5() {
    ((_0x15f5d6['disabled'] = _0x548041['disabled']),
      (_0x55ded2['textContent'] = _0x548041['selectedOptions'][0x0]?.['textContent'] || '请选择'));
    const _0x85a7b3 = JSON['stringify'](
      [..._0x548041['options']]['map']((_0x55692e) => [
        _0x55692e['value'],
        _0x55692e['textContent'],
        _0x55692e['disabled'],
        _0x55692e['hidden'],
      ]),
    );
    if (_0x85a7b3 !== _0xb5a01a) {
      ((_0xb5a01a = _0x85a7b3), _0x5c914b['replaceChildren']());
      for (const _0x2ac877 of _0x548041['options']) {
        if (_0x2ac877['hidden']) continue;
        const _0x3d601e = document['createElement']('button');
        ((_0x3d601e['type'] = 'button'),
          (_0x3d601e['className'] = 'collaboration-select-option'),
          _0x3d601e['setAttribute']('role', 'option'),
          (_0x3d601e['textContent'] = _0x2ac877['textContent']),
          (_0x3d601e['dataset']['value'] = _0x2ac877['value']),
          (_0x3d601e['disabled'] = _0x2ac877['disabled']),
          _0x3d601e['addEventListener']('click', () => {
            ((_0x548041['value'] = _0x2ac877['value']),
              _0x4b37d5(),
              _0x559531(!![]),
              _0x548041['dispatchEvent'](new Event('change', { bubbles: !![] })));
          }),
          _0x5c914b['append'](_0x3d601e));
      }
    }
    for (const _0x150e00 of _0x5c914b['children']) {
      const _0x3e7766 = _0x150e00['dataset']['value'] === _0x548041['value'];
      (_0x150e00['setAttribute']('aria-selected', String(_0x3e7766)),
        (_0x150e00['tabIndex'] = _0x3e7766 ? 0x0 : -0x1));
    }
  }
  function _0x1c4989() {
    if (_0x15f5d6['disabled']) return;
    (_0x4b37d5(),
      (_0x1a982d = !![]),
      _0x5c914b['showPopover'](),
      _0x15f5d6['setAttribute']('aria-expanded', 'true'),
      _0x346c0c(),
      document['addEventListener']('pointerdown', _0x1f121f, !![]),
      (_0x5c914b['querySelector']('[aria-selected="true"]') || _0x5c914b['firstElementChild'])?.['focus']());
  }
  return (
    _0x15f5d6['addEventListener']('click', () => (_0x1a982d ? _0x559531(!![]) : _0x1c4989())),
    _0x15f5d6['addEventListener']('keydown', (_0x2a4418) => {
      ['ArrowDown', 'ArrowUp']['includes'](_0x2a4418['key']) && (_0x2a4418['preventDefault'](), _0x1c4989());
    }),
    _0x5c914b['addEventListener']('keydown', (_0x4bed37) => {
      _0x4bed37['key'] === 'Escape' &&
        (_0x4bed37['preventDefault'](), _0x4bed37['stopPropagation'](), _0x559531(!![]));
      if (_0x4bed37['key'] === 'Tab') _0x559531();
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End']['includes'](_0x4bed37['key'])) return;
      _0x4bed37['preventDefault']();
      const _0x5ce41a = [..._0x5c914b['children']]['filter']((_0x20a08f) => !_0x20a08f['disabled']),
        _0x5bfd0a = _0x5ce41a['indexOf'](document['activeElement']),
        _0x28b001 =
          _0x4bed37['key'] === 'Home'
            ? 0x0
            : _0x4bed37['key'] === 'End'
              ? _0x5ce41a['length'] - 0x1
              : (_0x5bfd0a + (_0x4bed37['key'] === 'ArrowDown' ? 0x1 : -0x1) + _0x5ce41a['length']) %
                _0x5ce41a['length'];
      _0x5ce41a[_0x28b001]?.['focus']();
    }),
    _0x15f5d6['setAttribute']('aria-expanded', 'false'),
    _0x4b37d5(),
    {
      sync: _0x4b37d5,
      open: _0x1c4989,
      close: _0x559531,
      trigger: _0x15f5d6,
      destroy() {
        (_0x559531(), _0x1e53ec['remove']());
      },
    }
  );
}
