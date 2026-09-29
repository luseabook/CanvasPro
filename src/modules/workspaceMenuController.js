function getEnabledOptions(_0xd097fc, _0x4ad817) {
  return Array['from'](_0xd097fc?.['querySelectorAll']?.(_0x4ad817) || [])['filter'](
    (_0x317459) =>
      _0x317459?.['disabled'] !== !![] && _0x317459?.['getAttribute']?.('aria-disabled') !== 'true',
  );
}
function focusMenuOption(_0x182c3c) {
  try {
    _0x182c3c?.['focus']?.({ preventScroll: !![] });
  } catch {
    _0x182c3c?.['focus']?.();
  }
  if (!_0x182c3c?.['ownerDocument'] || _0x182c3c['ownerDocument']['activeElement'] === _0x182c3c) return;
  const _0x380bc7 = _0x182c3c['ownerDocument']['defaultView'],
    _0x323c0a = () => {
      try {
        _0x182c3c?.['focus']?.({ preventScroll: !![] });
      } catch {
        _0x182c3c?.['focus']?.();
      }
    };
  _0x380bc7?.['requestAnimationFrame']?.(() => {
    _0x323c0a();
    if (_0x182c3c['ownerDocument']['activeElement'] === _0x182c3c) return;
    _0x380bc7?.['requestAnimationFrame']?.(_0x323c0a);
  });
}
export function syncWorkspaceInlineMenuExpandedWidth(_0x361a64) {
  const _0x267964 = Math['ceil'](Number(_0x361a64?.['scrollWidth']) || 0x0);
  if (_0x267964 <= 0x0) return 0x0;
  return (
    _0x361a64['style']?.['setProperty']?.('--workspace-inline-menu-expanded-width', _0x267964 + 'px'),
    _0x267964
  );
}
export function createWorkspaceMenuController({
  root: _0x47cdb9,
  wrapperSelector: _0x2ffc15,
  triggerSelector: _0x511e59,
  menuSelector: _0x35711a,
  optionSelector: _0x16d440,
  openClass: openClass = 'is-open',
} = {}) {
  const _0x41bb2d = () => (typeof _0x47cdb9 === 'function' ? _0x47cdb9() : _0x47cdb9),
    _0x44d971 = (_0x3eb616 = null) => {
      _0x41bb2d()
        ?.['querySelectorAll']?.(_0x2ffc15)
        ?.['forEach']?.((_0x5e26c5) => {
          if (_0x5e26c5 === _0x3eb616 || !_0x5e26c5['classList']?.['contains']?.(openClass)) return;
          (_0x5e26c5['classList']?.['remove']?.(openClass),
            _0x5e26c5['querySelector']?.(_0x511e59)?.['setAttribute']?.('aria-expanded', 'false'),
            _0x5e26c5['querySelector']?.(_0x35711a)?.['setAttribute']?.('aria-hidden', 'true'));
        });
    },
    _0x1d7099 = (_0x3594f3, _0x3e4c8b = _0x3594f3?.['querySelector']?.(_0x511e59)) => {
      const _0x3cc3b5 = _0x3594f3?.['querySelector']?.(_0x35711a);
      if (!_0x3594f3 || !_0x3e4c8b || !_0x3cc3b5 || _0x3e4c8b['disabled'] === !![]) return ![];
      return (
        _0x44d971(_0x3594f3),
        _0x3594f3['classList']?.['add']?.(openClass),
        _0x3e4c8b['setAttribute']?.('aria-expanded', 'true'),
        _0x3cc3b5['setAttribute']?.('aria-hidden', 'false'),
        !![]
      );
    },
    _0x34f5dc = (_0x2edd69) => {
      const _0x126885 = _0x2edd69?.['closest']?.(_0x2ffc15);
      if (!_0x126885 || _0x2edd69?.['disabled'] === !![]) return ![];
      if (_0x126885['classList']?.['contains']?.(openClass)) return (_0x44d971(), ![]);
      return _0x1d7099(_0x126885, _0x2edd69);
    },
    _0x406df1 = (_0x232923) => {
      const _0x2f281b = _0x232923?.['target']?.['closest']?.(_0x511e59),
        _0xa9b85e = _0x232923?.['target']?.['closest']?.(_0x16d440);
      if (_0x2f281b && ['ArrowDown', 'ArrowUp']['includes'](_0x232923['key'])) {
        const _0x50a988 = _0x2f281b['closest']?.(_0x2ffc15),
          _0x1ab783 = getEnabledOptions(_0x50a988, _0x16d440);
        if (!_0x1d7099(_0x50a988, _0x2f281b)) return ![];
        return (
          _0x232923['preventDefault']?.(),
          _0x232923['stopPropagation']?.(),
          focusMenuOption(_0x1ab783[_0x232923['key'] === 'ArrowUp' ? _0x1ab783['length'] - 0x1 : 0x0]),
          !![]
        );
      }
      const _0x4cba15 = _0xa9b85e?.['closest']?.(_0x2ffc15) || _0x2f281b?.['closest']?.(_0x2ffc15);
      if (_0x2f281b && _0x232923['key'] === 'Escape' && _0x4cba15?.['classList']?.['contains']?.(openClass))
        return (
          _0x232923['preventDefault']?.(),
          _0x232923['stopPropagation']?.(),
          _0x44d971(),
          _0x2f281b['focus']?.(),
          !![]
        );
      if (!_0xa9b85e || !_0x4cba15) return ![];
      if (_0x232923['key'] === 'Escape')
        return (
          _0x232923['preventDefault']?.(),
          _0x232923['stopPropagation']?.(),
          _0x44d971(),
          _0x4cba15['querySelector']?.(_0x511e59)?.['focus']?.(),
          !![]
        );
      const _0x1e28a6 = getEnabledOptions(_0x4cba15, _0x16d440),
        _0x18a6cd = _0x1e28a6['indexOf'](_0xa9b85e);
      if (_0x18a6cd < 0x0 || !_0x1e28a6['length']) return ![];
      let _0x8241bb = _0x18a6cd;
      if (_0x232923['key'] === 'ArrowDown') _0x8241bb = (_0x18a6cd + 0x1) % _0x1e28a6['length'];
      else {
        if (_0x232923['key'] === 'ArrowUp')
          _0x8241bb = (_0x18a6cd - 0x1 + _0x1e28a6['length']) % _0x1e28a6['length'];
        else {
          if (_0x232923['key'] === 'Home') _0x8241bb = 0x0;
          else {
            if (_0x232923['key'] === 'End') _0x8241bb = _0x1e28a6['length'] - 0x1;
            else return ![];
          }
        }
      }
      return (
        _0x232923['preventDefault']?.(),
        _0x232923['stopPropagation']?.(),
        focusMenuOption(_0x1e28a6[_0x8241bb]),
        !![]
      );
    };
  return Object['freeze']({ close: _0x44d971, open: _0x1d7099, toggle: _0x34f5dc, handleKeyDown: _0x406df1 });
}
