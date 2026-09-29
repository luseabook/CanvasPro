const GROUP_SELECTOR = '[data-person-replacement-export-group]',
  TRIGGER_SELECTOR = '[data-person-replacement-export-submenu-trigger]',
  SUBMENU_SELECTOR = '[data-person-replacement-export-submenu]';
function focusElement(_0x434f9a) {
  try {
    _0x434f9a?.['focus']?.({ preventScroll: !![] });
  } catch {
    _0x434f9a?.['focus']?.();
  }
}
export function createPersonReplacementExportSubmenuController({ root: _0x4c8e30 } = {}) {
  const _0x2a18b6 = () => (typeof _0x4c8e30 === 'function' ? _0x4c8e30() : _0x4c8e30),
    _0x48383b = (_0x1aedc0 = null) => {
      _0x2a18b6()
        ?.['querySelectorAll']?.(GROUP_SELECTOR)
        ?.['forEach']?.((_0x26ad05) => {
          if (_0x26ad05 === _0x1aedc0) return;
          (_0x26ad05['classList']?.['remove']?.('is-open'),
            _0x26ad05['querySelector']?.(TRIGGER_SELECTOR)?.['setAttribute']?.('aria-expanded', 'false'),
            _0x26ad05['querySelector']?.(SUBMENU_SELECTOR)?.['setAttribute']?.('aria-hidden', 'true'));
        });
    },
    _0x21cc99 = (_0x33ab86, _0x396cc5) => {
      if (!_0x33ab86) return ![];
      if (_0x396cc5) _0x48383b(_0x33ab86);
      return (
        _0x33ab86['classList']?.['toggle']?.('is-open', _0x396cc5),
        _0x33ab86['querySelector']?.(TRIGGER_SELECTOR)?.['setAttribute']?.(
          'aria-expanded',
          String(_0x396cc5),
        ),
        _0x33ab86['querySelector']?.(SUBMENU_SELECTOR)?.['setAttribute']?.('aria-hidden', String(!_0x396cc5)),
        !![]
      );
    },
    _0x3dbd33 = (_0x3d060e) => {
      const _0x348a8e = _0x3d060e?.['closest']?.(GROUP_SELECTOR);
      return _0x348a8e && _0x2a18b6()?.['contains']?.(_0x348a8e) ? _0x348a8e : null;
    },
    _0x40a43d = (_0xb7d5af) => {
      const _0x153f4c = _0xb7d5af?.['target']?.['closest']?.(TRIGGER_SELECTOR),
        _0x330774 = _0x3dbd33(_0x153f4c);
      if (!_0x330774 || _0x153f4c?.['disabled'] === !![]) return ![];
      return (_0xb7d5af['preventDefault']?.(), _0x21cc99(_0x330774, !![]), !![]);
    },
    _0x100ddb = (_0x40c7a4) => {
      const _0x70c530 = _0x3dbd33(_0x40c7a4?.['target']);
      if (!_0x70c530) return ![];
      return (_0x21cc99(_0x70c530, !![]), !![]);
    },
    _0x20dc26 = (_0xdb0fc5) => {
      const _0x28e83d = _0x3dbd33(_0xdb0fc5?.['target']);
      if (!_0x28e83d || _0x28e83d['contains']?.(_0xdb0fc5?.['relatedTarget'])) return ![];
      return (_0x21cc99(_0x28e83d, ![]), !![]);
    },
    _0x324a11 = (_0x1607ce) => {
      const _0x57e283 = _0x3dbd33(_0x1607ce?.['target']);
      if (!_0x57e283) return ![];
      return (_0x21cc99(_0x57e283, !![]), !![]);
    },
    _0x43eac5 = (_0x1c938f) => {
      const _0x437826 = _0x3dbd33(_0x1c938f?.['target']);
      if (!_0x437826 || _0x437826['contains']?.(_0x1c938f?.['relatedTarget'])) return ![];
      return (_0x21cc99(_0x437826, ![]), !![]);
    },
    _0x5a1d96 = (_0x429e73) => {
      const _0x5a5095 = _0x429e73?.['target']?.['closest']?.(TRIGGER_SELECTOR),
        _0x504f45 = _0x3dbd33(_0x429e73?.['target']);
      if (!_0x504f45) return ![];
      if (_0x5a5095 && ['ArrowRight', 'Enter', '\x20']['includes'](_0x429e73['key']))
        return (
          _0x429e73['preventDefault']?.(),
          _0x429e73['stopPropagation']?.(),
          _0x21cc99(_0x504f45, !![]),
          focusElement(
            _0x504f45['querySelector']?.(SUBMENU_SELECTOR + ' .story-canvas-sync-option:not(:disabled)'),
          ),
          !![]
        );
      if (_0x5a5095) return ![];
      const _0x55f0c3 = Array['from'](
          _0x504f45['querySelectorAll']?.(SUBMENU_SELECTOR + ' .story-canvas-sync-option') || [],
        )['filter'](
          (_0x18b6b9) =>
            _0x18b6b9['disabled'] !== !![] && _0x18b6b9['getAttribute']?.('aria-disabled') !== 'true',
        ),
        _0xf7dcb1 = _0x429e73['target']?.['closest']?.('.story-canvas-sync-option') || _0x429e73['target'],
        _0x208a52 = _0x55f0c3['indexOf'](_0xf7dcb1);
      if (['ArrowLeft', 'Escape']['includes'](_0x429e73['key']))
        return (
          _0x429e73['preventDefault']?.(),
          _0x429e73['stopPropagation']?.(),
          _0x21cc99(_0x504f45, ![]),
          focusElement(_0x504f45['querySelector']?.(TRIGGER_SELECTOR)),
          !![]
        );
      if (_0x208a52 < 0x0 || !_0x55f0c3['length']) return ![];
      let _0x486e07 = _0x208a52;
      if (_0x429e73['key'] === 'ArrowDown') _0x486e07 = (_0x208a52 + 0x1) % _0x55f0c3['length'];
      else {
        if (_0x429e73['key'] === 'ArrowUp')
          _0x486e07 = (_0x208a52 - 0x1 + _0x55f0c3['length']) % _0x55f0c3['length'];
        else {
          if (_0x429e73['key'] === 'Home') _0x486e07 = 0x0;
          else {
            if (_0x429e73['key'] === 'End') _0x486e07 = _0x55f0c3['length'] - 0x1;
            else return ![];
          }
        }
      }
      return (
        _0x429e73['preventDefault']?.(),
        _0x429e73['stopPropagation']?.(),
        focusElement(_0x55f0c3[_0x486e07]),
        !![]
      );
    };
  return Object['freeze']({
    close: _0x48383b,
    handleClick: _0x40a43d,
    handleFocusIn: _0x324a11,
    handleFocusOut: _0x43eac5,
    handleKeyDown: _0x5a1d96,
    handlePointerOut: _0x20dc26,
    handlePointerOver: _0x100ddb,
  });
}
