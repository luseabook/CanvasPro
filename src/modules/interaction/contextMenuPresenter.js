export function removeContextMenus({ includeNodePicker: includeNodePicker = true } = {}) {
  (document.querySelectorAll('.v2-canvas-ctx-menu').forEach((_0x58464f) => _0x58464f.remove()),
    includeNodePicker && document.querySelector('.v2-node-picker')?.remove());
}
function placeMenu(_0x366ee5, _0x57add6, _0xe6bf9c) {
  document.body.appendChild(_0x366ee5);
  const _0x516000 = _0x366ee5.offsetWidth || 240,
    _0x56fc28 = _0x366ee5.offsetHeight || 200,
    _0x6be6e8 = _0x57add6 + _0x516000 > window.innerWidth ? _0x57add6 - _0x516000 : _0x57add6,
    _0x3aea0f = _0xe6bf9c + _0x56fc28 > window.innerHeight ? _0xe6bf9c - _0x56fc28 : _0xe6bf9c;
  ((_0x366ee5.style.left = _0x6be6e8 + 'px'), (_0x366ee5.style.top = _0x3aea0f + 'px'));
}
function placeSubmenu(_0x4481da, _0x480d58) {
  const _0x5a562c = _0x480d58.getBoundingClientRect(),
    _0x111b62 = 214,
    _0x15c484 =
      _0x5a562c.right + 4 + _0x111b62 > window.innerWidth
        ? _0x5a562c.left - _0x111b62 - 4
        : _0x5a562c.right + 4,
    _0x30b745 = Math.min(_0x5a562c.top, window.innerHeight - _0x4481da.offsetHeight - 8);
  ((_0x4481da.style.left = _0x15c484 + 'px'), (_0x4481da.style.top = _0x30b745 + 'px'));
}
function createSeparator(_0x4bde60) {
  const _0x39b819 = document.createElement('div');
  return (
    (_0x39b819.className = 'v2-menu-sep'),
    _0x39b819.addEventListener('mouseenter', _0x4bde60),
    _0x39b819
  );
}
function createMenuRow(_0x520325, { onActivate: _0x5b230e, onEnter: _0x313db8 }) {
  const _0xe9462f = Array.isArray(_0x520325.subItems) && _0x520325.subItems.length > 0,
    _0x1e358f = !!_0x520325.kbd,
    _0x17d9db = String(_0x520325.desc || _0x520325.subtitle || '').trim(),
    _0x226a21 = document.createElement('div');
  _0x226a21.className = [
    'v2-menu-row',
    _0x1e358f || _0xe9462f ? 'v2-menu-row-split' : '',
    _0x17d9db ? 'has-desc' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const _0x258fd1 = document.createElement('span');
  ((_0x258fd1.className = [_0xe9462f ? 'v2-menu-rowlabel' : '', _0x17d9db ? 'v2-menu-lbl' : '']
    .filter(Boolean)
    .join(' ')),
    (_0x258fd1.textContent = _0x520325.label || ''));
  if (_0x520325.badge) {
    const _0x17c934 = document.createElement('span');
    ((_0x17c934.textContent = _0x520325.badge),
      (_0x17c934.className = 'v2-badge-beta'),
      _0x258fd1.appendChild(_0x17c934));
  }
  if (_0x17d9db) {
    const _0x252842 = document.createElement('span');
    _0x252842.className = 'v2-menu-txt-wrap';
    const _0x151500 = document.createElement('span');
    ((_0x151500.className = 'v2-menu-sub'),
      (_0x151500.textContent = _0x17d9db),
      _0x252842.appendChild(_0x258fd1),
      _0x252842.appendChild(_0x151500),
      _0x226a21.appendChild(_0x252842));
  } else _0x226a21.appendChild(_0x258fd1);
  if (_0xe9462f) {
    const _0x49139f = document.createElement('span');
    ((_0x49139f.textContent = '▶'),
      (_0x49139f.className = 'v2-menu-arrow v2-menu-arrow-ml8'),
      _0x226a21.appendChild(_0x49139f));
  } else {
    if (_0x1e358f) {
      const _0x5d8080 = document.createElement('span');
      ((_0x5d8080.className = 'v2-menu-kbd'),
        (_0x5d8080.textContent = _0x520325.kbd),
        _0x226a21.appendChild(_0x5d8080));
    }
  }
  return (
    _0x226a21.addEventListener('mouseenter', () => _0x313db8(_0x226a21, _0x520325)),
    !_0xe9462f &&
      _0x226a21.addEventListener('pointerdown', (_0x2937b0) => {
        (_0x2937b0.stopPropagation(), _0x5b230e(_0x520325, _0x2937b0));
      }),
    _0x226a21
  );
}
function markSidebarSubmenuOwner(_0x26374f, _0x29ba64) {
  const _0x22ac99 = String(_0x29ba64 || '').trim();
  if (_0x22ac99) _0x26374f.dataset.sidebarSubmenuOwner = _0x22ac99;
}
export function showContextMenu(_0x572157, _0x8302c3, _0xab1f0b, _0xbb4797 = {}) {
  removeContextMenus({ includeNodePicker: _0xbb4797.includeNodePicker !== false });
  const _0x252bde = document.createElement('div');
  ((_0x252bde.className = _0xbb4797.className || 'v2-canvas-ctx-menu'),
    markSidebarSubmenuOwner(_0x252bde, _0xbb4797.sidebarSubmenuOwner));
  const _0x463027 = [],
    _0x376b5d = 180;
  let _0x3e36d0 = null;
  const _0x57c282 = () => {
      if (_0x3e36d0 === null) return;
      (clearTimeout(_0x3e36d0), (_0x3e36d0 = null));
    },
    _0x22973c = (_0x28b2b3 = 0) => {
      _0x57c282();
      for (let _0x276aa2 = _0x463027.length - 1; _0x276aa2 >= _0x28b2b3; _0x276aa2--) {
        _0x463027[_0x276aa2]?.remove();
      }
      _0x463027.splice(_0x28b2b3);
    },
    _0x222d6a = (_0x57d98b = 0) => {
      (_0x57c282(),
        (_0x3e36d0 = setTimeout(() => {
          ((_0x3e36d0 = null), _0x22973c(_0x57d98b));
        }, _0x376b5d)));
    },
    _0x2cd608 = (_0xbef45a) =>
      !!_0xbef45a &&
      (_0x252bde.contains(_0xbef45a) || _0x463027.some((_0x5d7c46) => _0x5d7c46?.contains(_0xbef45a))),
    _0x2e575b = () => {
      (_0x57c282(), _0x22973c(0), _0x252bde.remove());
    },
    _0x5e4587 = (_0xe3a985, _0x1835de, _0x216eda) => {
      _0x22973c(_0x216eda);
      const _0x70579e = document.createElement('div');
      ((_0x70579e.className = 'v2-canvas-ctx-menu v2-submenu'),
        markSidebarSubmenuOwner(_0x70579e, _0xbb4797.sidebarSubmenuOwner),
        _0x70579e.addEventListener('mouseenter', _0x57c282),
        _0xe3a985.forEach((_0x28cef1) => {
          if (_0x28cef1 === 'sep' || _0x28cef1?.type === 'separator') {
            _0x70579e.appendChild(createSeparator(() => _0x22973c(_0x216eda + 1)));
            return;
          }
          _0x70579e.appendChild(
            createMenuRow(_0x28cef1, {
              onEnter: (_0xa516ea, _0x27796b) => {
                Array.isArray(_0x27796b.subItems) && _0x27796b.subItems.length > 0
                  ? _0x5e4587(_0x27796b.subItems, _0xa516ea, _0x216eda + 1)
                  : _0x22973c(_0x216eda + 1);
              },
              onActivate: (_0x225bc4, _0x4bec49) => {
                (_0x2e575b(), _0x225bc4.action?.(_0x4bec49));
              },
            }),
          );
        }),
        document.body.appendChild(_0x70579e),
        (_0x463027[_0x216eda] = _0x70579e),
        placeSubmenu(_0x70579e, _0x1835de));
    };
  (_0xab1f0b.forEach((_0xe171b9) => {
    if (_0xe171b9 === 'sep' || _0xe171b9?.type === 'separator') {
      _0x252bde.appendChild(createSeparator(() => _0x22973c(0)));
      return;
    }
    _0x252bde.appendChild(
      createMenuRow(_0xe171b9, {
        onEnter: (_0x4e26ac, _0x3e6c88) => {
          Array.isArray(_0x3e6c88.subItems) && _0x3e6c88.subItems.length > 0
            ? _0x5e4587(_0x3e6c88.subItems, _0x4e26ac, 0)
            : _0x22973c(0);
        },
        onActivate: (_0x3b43db, _0x5e4420) => {
          (_0x2e575b(), _0x3b43db.action?.(_0x5e4420));
        },
      }),
    );
  }),
    _0x252bde.addEventListener('mouseenter', _0x57c282),
    _0x252bde.addEventListener('mouseleave', (_0x38e900) => {
      !_0x2cd608(_0x38e900.relatedTarget) && _0x222d6a(0);
    }),
    placeMenu(_0x252bde, _0x572157, _0x8302c3));
  const _0x4366f2 = (_0x5c32af) => {
    const _0xc49f3 =
      _0x252bde.contains(_0x5c32af.target) ||
      _0x463027.some((_0x1b646e) => _0x1b646e?.contains(_0x5c32af.target));
    !_0xc49f3 && (_0x2e575b(), document.removeEventListener('pointerdown', _0x4366f2, true));
  };
  return (
    requestAnimationFrame(() => document.addEventListener('pointerdown', _0x4366f2, true)),
    { menu: _0x252bde, close: _0x2e575b }
  );
}
