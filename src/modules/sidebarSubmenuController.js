const sidebarSubmenus = new Map();
let activeKey = '',
  globalsInstalled = false;
function containsTarget(_0x43c49d, _0x4156eb) {
  return !!_0x43c49d && (_0x43c49d === _0x4156eb || _0x43c49d.contains?.(_0x4156eb));
}
function shouldIgnorePointerDown(_0x17c852, _0x571671) {
  if (typeof _0x17c852?.ignorePointerDown !== 'function') return false;
  return _0x17c852.ignorePointerDown(_0x571671) === true;
}
function isEntryOpen(_0x272eaf) {
  if (!_0x272eaf) return false;
  if (typeof _0x272eaf.isOpen === 'function') return _0x272eaf.isOpen();
  return _0x272eaf.panel?.classList?.contains(_0x272eaf.openClass) === true;
}
function applyDefaultOpen(_0x4b981f) {
  (_0x4b981f.panel?.classList?.add(_0x4b981f.openClass),
    _0x4b981f.button?.classList?.add(_0x4b981f.activeClass),
    _0x4b981f.button?.setAttribute?.('aria-expanded', 'true'));
}
function applyDefaultClose(_0x2023d2) {
  (_0x2023d2.panel?.classList?.remove(_0x2023d2.openClass),
    _0x2023d2.button?.classList?.remove(_0x2023d2.activeClass),
    _0x2023d2.button?.setAttribute?.('aria-expanded', 'false'));
}
function closeEntry(_0x39b7e3) {
  if (!_0x39b7e3) return;
  if (typeof _0x39b7e3.close === 'function') _0x39b7e3.close();
  else applyDefaultClose(_0x39b7e3);
  (_0x39b7e3.button?.classList?.remove(_0x39b7e3.activeClass),
    _0x39b7e3.button?.setAttribute?.('aria-expanded', 'false'));
  if (activeKey === _0x39b7e3.key) activeKey = '';
}
function installGlobals() {
  if (globalsInstalled) return;
  ((globalsInstalled = true),
    document.addEventListener(
      'pointerdown',
      (_0x19dd57) => {
        const _0x42e58e = sidebarSubmenus.get(activeKey);
        if (!_0x42e58e) return;
        if (containsTarget(_0x42e58e.button, _0x19dd57.target)) return;
        if (containsTarget(_0x42e58e.panel, _0x19dd57.target)) return;
        if (shouldIgnorePointerDown(_0x42e58e, _0x19dd57)) return;
        closeEntry(_0x42e58e);
      },
      true,
    ),
    document.addEventListener('keydown', (_0x18bc23) => {
      if (_0x18bc23.key !== 'Escape') return;
      const _0x21b735 = sidebarSubmenus.get(activeKey);
      if (!_0x21b735) return;
      closeEntry(_0x21b735);
    }));
}
export function closeSidebarSubmenu(_0x3245f1) {
  closeEntry(sidebarSubmenus.get(_0x3245f1));
}
export function closeAllSidebarSubmenus(_0x5e6ce4 = '') {
  for (const [_0x2d7d95, _0x38c804] of sidebarSubmenus.entries()) {
    if (_0x2d7d95 !== _0x5e6ce4) closeEntry(_0x38c804);
  }
}
export function openSidebarSubmenu(_0x48c532) {
  const _0x296e7f = sidebarSubmenus.get(_0x48c532);
  if (!_0x296e7f) return;
  (closeAllSidebarSubmenus(_0x48c532), (activeKey = _0x48c532));
  if (typeof _0x296e7f.open === 'function') _0x296e7f.open();
  else applyDefaultOpen(_0x296e7f);
  (_0x296e7f.button?.classList?.add(_0x296e7f.activeClass),
    _0x296e7f.button?.setAttribute?.('aria-expanded', 'true'));
}
export function toggleSidebarSubmenu(_0x2c819d) {
  const _0x59dd9c = sidebarSubmenus.get(_0x2c819d);
  if (!_0x59dd9c) return;
  if (activeKey === _0x2c819d && isEntryOpen(_0x59dd9c)) {
    closeEntry(_0x59dd9c);
    return;
  }
  openSidebarSubmenu(_0x2c819d);
}
export function registerSidebarSubmenu({
  key: _0x14c398,
  button: _0x124f77,
  panel: _0x2681f5,
  open: _0x519bbf,
  close: _0x1371f6,
  isOpen: _0x1ed309,
  ignorePointerDown: _0x546de8,
  openClass: openClass = 'show',
  activeClass: activeClass = 'active',
} = {}) {
  if (!_0x14c398 || !_0x124f77 || !_0x2681f5) return;
  installGlobals();
  const _0x4f05a6 = sidebarSubmenus.get(_0x14c398);
  _0x4f05a6?.button &&
    _0x4f05a6.clickHandler &&
    _0x4f05a6.button.removeEventListener?.('click', _0x4f05a6.clickHandler);
  _0x4f05a6?.button &&
    _0x4f05a6.dblClickHandler &&
    _0x4f05a6.button.removeEventListener?.('dblclick', _0x4f05a6.dblClickHandler);
  const _0x24f63f = {
    key: _0x14c398,
    button: _0x124f77,
    panel: _0x2681f5,
    open: _0x519bbf,
    close: _0x1371f6,
    isOpen: _0x1ed309,
    ignorePointerDown: _0x546de8,
    openClass: openClass,
    activeClass: activeClass,
    clickHandler: null,
    dblClickHandler: null,
  };
  ((_0x24f63f.clickHandler = (_0x57e4b8) => {
    (_0x57e4b8.preventDefault(), _0x57e4b8.stopPropagation());
    if (Number(_0x57e4b8.detail || 0) > 1) return;
    toggleSidebarSubmenu(_0x14c398);
  }),
    (_0x24f63f.dblClickHandler = (_0x2d272a) => {
      (_0x2d272a.preventDefault(), _0x2d272a.stopPropagation(), closeEntry(_0x24f63f));
    }),
    sidebarSubmenus.set(_0x14c398, _0x24f63f),
    _0x124f77.setAttribute?.('aria-haspopup', 'menu'),
    _0x124f77.setAttribute?.('aria-expanded', isEntryOpen(_0x24f63f) ? 'true' : 'false'),
    _0x124f77.addEventListener('click', _0x24f63f.clickHandler),
    _0x124f77.addEventListener('dblclick', _0x24f63f.dblClickHandler));
}
