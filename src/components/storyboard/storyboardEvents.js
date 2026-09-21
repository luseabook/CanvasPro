export function bindStoryboardNodeEvents(
  _0x1fc6f2,
  { store: _0x15f3c3, normalizeEmptyCell: _0x492ce8 } = {},
) {
  const _0x65195a = _0x1fc6f2.el,
    _0x36713a = _0x65195a.querySelector('.act-aspect'),
    _0x3ef58c = _0x65195a.querySelector('.act-grid'),
    _0x5e551e = _0x65195a.querySelector('.act-split-lines'),
    _0x141346 = _0x65195a.querySelector('.act-edit'),
    _0x51acf0 = _0x65195a.querySelector('.act-compose'),
    _0x585cf7 = _0x65195a.querySelector('.act-clear'),
    _0x55ffae = _0x65195a.querySelector('.act-collapse');
  [_0x36713a, _0x3ef58c, _0x5e551e, _0x141346, _0x51acf0, _0x585cf7, _0x55ffae].forEach((_0x158425) => {
    if (!_0x158425) return;
    (_0x158425.addEventListener('pointerdown', (_0x1b89df) => _0x1b89df.stopPropagation()),
      _0x158425.addEventListener('dblclick', (_0x4fc979) => _0x4fc979.stopPropagation()));
  });
  _0x5e551e &&
    (_0x5e551e.onclick = async (_0x195bc7) => {
      (_0x195bc7.stopPropagation(), _0x195bc7.target.closest('button')?.blur());
      if (_0x1fc6f2._isCustomGridEditing) {
        await _0x1fc6f2._confirmCustomGridEdit();
        if (!_0x1fc6f2._isCustomGridEditing) _0x1fc6f2._closeMenu();
        return;
      }
      _0x1fc6f2._enterCustomGridEdit() && _0x1fc6f2._showSplitLinesMenu(_0x5e551e);
    });
  _0x141346 &&
    (_0x141346.onclick = (_0x2c505a) => {
      (_0x2c505a.stopPropagation(),
        _0x2c505a.target.closest('button')?.blur(),
        _0x1fc6f2._toggleEdit(!_0x1fc6f2._isEditing));
    });
  _0x1fc6f2._container &&
    (_0x1fc6f2._container.ondblclick = (_0x5578fa) => {
      (_0x5578fa.stopPropagation(), _0x1fc6f2._toggleEdit(true));
    });
  _0x36713a &&
    (_0x36713a.onclick = (_0x177b18) => {
      (_0x177b18.stopPropagation(), _0x177b18.target.closest('button')?.blur());
      if (_0x1fc6f2._isCustomGridEditing) return;
      _0x1fc6f2._activeMenu === 'aspect' ? _0x1fc6f2._closeMenu() : _0x1fc6f2._showAspectMenu(_0x36713a);
    });
  _0x3ef58c &&
    (_0x3ef58c.onclick = (_0x2d34f4) => {
      (_0x2d34f4.stopPropagation(), _0x2d34f4.target.closest('button')?.blur());
      if (_0x1fc6f2._isCustomGridEditing) return;
      _0x1fc6f2._activeMenu === 'grid' ? _0x1fc6f2._closeMenu() : _0x1fc6f2._showGridMenu(_0x3ef58c);
    });
  _0x51acf0 &&
    (_0x51acf0.onclick = async (_0x407a71) => {
      (_0x407a71.stopPropagation(), _0x407a71.target.closest('button')?.blur());
      if (_0x1fc6f2._isComposing) return;
      await _0x1fc6f2._compose();
    });
  _0x585cf7 &&
    (_0x585cf7.onclick = (_0x320e06) => {
      (_0x320e06.stopPropagation(), _0x320e06.target.closest('button')?.blur());
      const _0x44cdc3 = _0x1fc6f2._data.cells.map((_0x330a25) => _0x492ce8(_0x330a25));
      _0x15f3c3.updateNodeData(_0x1fc6f2.id, { cells: _0x44cdc3 });
    });
  _0x55ffae &&
    (_0x55ffae.onclick = (_0x348f47) => {
      (_0x348f47.stopPropagation(),
        _0x348f47.target.closest('button')?.blur(),
        _0x1fc6f2._toggleCollapse(!_0x1fc6f2._isCollapsed));
    });
  const _0x6d1437 = _0x1fc6f2.el.querySelector('.sb-collapsed-badge');
  _0x6d1437 &&
    (_0x6d1437.addEventListener('click', (_0x6e689d) => {
      (_0x6e689d.stopPropagation(), _0x1fc6f2._toggleCollapse(false));
    }),
    _0x6d1437.addEventListener('mouseenter', () => {
      _0x6d1437.style.background = 'var(--black-80)';
    }),
    _0x6d1437.addEventListener('mouseleave', () => {
      _0x6d1437.style.background = 'var(--black-60)';
    }));
}
