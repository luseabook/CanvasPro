function appendMenuIcon(_0xc6faba, _0x23b926, _0x11761a) {
  const _0x2ea32e = document.createElement('span');
  try {
    const _0x4f4642 = new DOMParser().parseFromString(_0x23b926, 'image/svg+xml'),
      _0x114059 = _0x4f4642.documentElement;
    _0x114059 &&
      _0x114059.tagName &&
      _0x114059.tagName.toLowerCase() === 'svg' &&
      _0x2ea32e.appendChild(document.importNode(_0x114059, true));
  } catch {}
  const _0x2f017c = document.createElement('span');
  ((_0x2f017c.textContent = _0x11761a), _0xc6faba.appendChild(_0x2ea32e), _0xc6faba.appendChild(_0x2f017c));
}
export function createStoryboardFloatingMenu(_0x21498b, _0x1a8354) {
  const _0x16347c = document.createElement('div');
  return (
    (_0x16347c.className = 'v2-canvas-ctx-menu v2-sb-dropdown'),
    _0x21498b.forEach((_0x486c71) => {
      const _0x4af6f2 = document.createElement('div');
      ((_0x4af6f2.className = 'v2-menu-row'),
        _0x486c71.icon
          ? (_0x4af6f2.replaceChildren(), appendMenuIcon(_0x4af6f2, _0x486c71.icon, _0x486c71.label))
          : (_0x4af6f2.textContent = _0x486c71.label),
        (_0x4af6f2.onclick = (_0x11ecd7) => {
          (_0x11ecd7.stopPropagation(), _0x486c71.action(), _0x1a8354?.());
        }),
        _0x16347c.appendChild(_0x4af6f2));
    }),
    _0x16347c
  );
}
function positionFixedMenu(_0xd48b5b, _0x72160e) {
  const _0x2e5e70 = _0x72160e?.getBoundingClientRect?.() || { left: 0, top: 0, bottom: 0, width: 0 },
    _0x52fec1 = Number(_0xd48b5b.offsetHeight) || 0;
  ((_0xd48b5b.style.left = _0x2e5e70.left + 'px'),
    (_0xd48b5b.style.top = _0x2e5e70.top - _0x52fec1 - 8 + 'px'));
}
function positionToolbarMenu(_0x2deea3, _0x309f30, _0x3b7379) {
  const _0x55b393 = Number(_0x2deea3.offsetWidth) || 0,
    _0x83863 = Number(_0x2deea3.offsetHeight) || 0,
    _0x17d340 = _0x3b7379.getBoundingClientRect?.() || { left: 0, top: 0, right: 0, bottom: 0, width: 0 },
    _0x2c7e77 = _0x309f30.getBoundingClientRect?.() || _0x17d340,
    _0x400f7a =
      (typeof window !== 'undefined' ? Number(window.innerWidth) : 0) ||
      Number(document.documentElement?.clientWidth) ||
      0,
    _0x3e6791 = 8;
  let _0x124e96 =
    (Number(_0x309f30.offsetLeft) || 0) +
    (Number(_0x309f30.offsetWidth) || Number(_0x2c7e77.width) || 0) / 2 -
    _0x55b393 / 2;
  if (_0x400f7a > 0 && Number.isFinite(_0x17d340.left)) {
    const _0x14ab05 = _0x17d340.left + _0x124e96,
      _0x28139c = _0x14ab05 + _0x55b393;
    if (_0x14ab05 < _0x3e6791) _0x124e96 += _0x3e6791 - _0x14ab05;
    else _0x28139c > _0x400f7a - _0x3e6791 && (_0x124e96 -= _0x28139c - (_0x400f7a - _0x3e6791));
  }
  const _0x3713e4 = Number(_0x17d340.top) >= _0x83863 + _0x3e6791;
  ((_0x2deea3.style.left = Math.max(0, Math.round(_0x124e96)) + 'px'),
    _0x3713e4
      ? ((_0x2deea3.style.top = 'auto'), (_0x2deea3.style.bottom = 'calc(100% + 8px)'))
      : ((_0x2deea3.style.bottom = 'auto'), (_0x2deea3.style.top = 'calc(100% + 8px)')));
}
export function mountStoryboardToolbarMenu(_0x3e1482, _0x156fca) {
  const _0x5549d3 = _0x156fca?.closest?.('.storyboard-toolbar') || null;
  if (!_0x5549d3)
    return (document.body.appendChild(_0x3e1482), positionFixedMenu(_0x3e1482, _0x156fca), _0x3e1482);
  return (
    _0x3e1482.classList.add('storyboard-toolbar-menu'),
    _0x5549d3.appendChild(_0x3e1482),
    positionToolbarMenu(_0x3e1482, _0x156fca, _0x5549d3),
    _0x3e1482
  );
}
export function closeStoryboardToolbarMenu({
  rootEl: _0x1d886d,
  menuEl: _0x2bda1a,
  activeMenu: _0x4c78db,
  isCustomGridEditing: isCustomGridEditing = false,
  dismissHandler: dismissHandler = null,
  force: force = false,
} = {}) {
  if (!force && _0x4c78db === 'split-lines' && isCustomGridEditing)
    return { menuEl: _0x2bda1a, activeMenu: _0x4c78db, dismissHandler: dismissHandler, blocked: true };
  (_0x2bda1a?.__commitPending?.(), _0x2bda1a?.remove?.());
  if (_0x4c78db) {
    const _0x2f19ef = _0x1d886d?.querySelector?.('.act-' + _0x4c78db);
    if (_0x2f19ef) {
      !(_0x4c78db === 'split-lines' && isCustomGridEditing) && _0x2f19ef.classList.remove('active');
      const _0x149c64 = _0x2f19ef.querySelector('.ftb-chevron');
      if (_0x149c64) _0x149c64.style.transform = 'rotate(0deg)';
    }
  }
  return (
    dismissHandler && document.removeEventListener('pointerdown', dismissHandler),
    { menuEl: null, activeMenu: null, dismissHandler: null, blocked: false }
  );
}
