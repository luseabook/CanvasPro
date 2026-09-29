import { positionAnchoredSubmenu } from '../../utils/submenuPosition.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
export function bindEditPopover(_0x13fcff, _0xe32281, { onOpen: _0x3e83c0, onClose: _0x26ba27 } = {}) {
  const _0x18cac8 = _0x13fcff['ownerDocument'],
    _0x4c8789 = _0x18cac8['defaultView'];
  let _0x194dcb = null;
  ((_0xe32281['tabIndex'] = -0x1),
    (_0xe32281['hidden'] = !![]),
    _0x18cac8['body']['append'](_0xe32281),
    _0x13fcff['setAttribute']('aria-expanded', 'false'),
    _0x13fcff['setAttribute']('aria-haspopup', 'dialog'));
  const _0x490925 = () => {
      if (_0xe32281['hidden']) return;
      const _0x594abe = _0x13fcff['getBoundingClientRect']();
      positionAnchoredSubmenu({
        submenu: _0xe32281,
        anchorRect: _0x594abe,
        position: 'fixed',
        horizontalPlacement: 'center',
        verticalPlacement: _0x594abe['top'] > _0xe32281['offsetHeight'] + 0x14 ? 'above' : 'below',
        verticalGap: 0x8,
        viewportWidth: _0x4c8789['innerWidth'],
        viewportHeight: _0x4c8789['innerHeight'],
      });
    },
    _0x26e4dc = (_0x4743d6 = ![], _0xd40658 = null) => {
      if (_0xe32281['hidden']) return;
      ((_0xe32281['hidden'] = !![]),
        _0x13fcff['setAttribute']('aria-expanded', 'false'),
        _0x13fcff['classList']['remove']('active'),
        _0x194dcb?.({ restoreFocus: ![] }),
        (_0x194dcb = null),
        _0x26ba27?.(_0xd40658));
      if (_0x4743d6) _0x13fcff['focus']();
    },
    _0x2966f9 = (_0xb18560) => {
      _0xb18560['stopPropagation']();
      if (!_0xe32281['hidden']) {
        _0x26e4dc();
        return;
      }
      (_0x3e83c0?.(),
        (_0xe32281['hidden'] = ![]),
        _0x13fcff['setAttribute']('aria-expanded', 'true'),
        _0x13fcff['classList']['add']('active'),
        _0x490925(),
        (_0x194dcb = beginModalInteraction({
          root: _0xe32281,
          returnFocus: _0x13fcff,
          onClose: () => _0x26e4dc(!![]),
        })));
    },
    _0x5cfa24 = (_0x11ff2f) => {
      if (!_0x13fcff['contains'](_0x11ff2f['target']) && !_0xe32281['contains'](_0x11ff2f['target']))
        _0x26e4dc(![], _0x11ff2f);
    },
    _0x133e70 = (_0x1fccb0) => {
      if (!_0xe32281['contains'](_0x1fccb0['target'])) _0x490925();
    };
  return (
    _0x13fcff['addEventListener']('click', _0x2966f9),
    _0x18cac8['addEventListener']('pointerdown', _0x5cfa24, !![]),
    _0x18cac8['addEventListener']('scroll', _0x133e70, !![]),
    _0x4c8789['addEventListener']('resize', _0x490925),
    {
      panel: _0xe32281,
      position: _0x490925,
      close: _0x26e4dc,
      destroy() {
        (_0x26e4dc(),
          _0x13fcff['removeEventListener']('click', _0x2966f9),
          _0x18cac8['removeEventListener']('pointerdown', _0x5cfa24, !![]),
          _0x18cac8['removeEventListener']('scroll', _0x133e70, !![]),
          _0x4c8789['removeEventListener']('resize', _0x490925),
          _0xe32281['remove']());
      },
    }
  );
}
