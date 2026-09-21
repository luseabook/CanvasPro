function hidePopup(_0x32b993) {
  if (!_0x32b993) return;
  if (_0x32b993.classList?.contains('floating-menu')) {
    _0x32b993.classList.remove('show');
    return;
  }
  if (_0x32b993.classList?.contains('rh-adv-panel') || _0x32b993.classList?.contains('rh-vram-adv-panel')) {
    (_0x32b993.classList.remove('show'), (_0x32b993.style.display = ''));
    return;
  }
  _0x32b993.style.display = 'none';
}
function showPopup(_0xec2b70, _0x585d92 = 'block') {
  if (!_0xec2b70) return;
  if (_0xec2b70.classList?.contains('floating-menu')) {
    _0xec2b70.classList.add('show');
    return;
  }
  _0xec2b70.style.display = _0x585d92;
}
export function closeNodeFooterMenus(_0x1570d1, _0x38993f = null) {
  if (!_0x1570d1) return;
  (_0x1570d1
    .querySelectorAll('.node-model-menu, .img-model-menu, .floating-menu.show, .ui-schema-floating-menu.show')
    .forEach((_0x47cc67) => {
      if (_0x47cc67 !== _0x38993f) _0x47cc67.classList.remove('show');
    }),
    _0x1570d1
      .querySelectorAll(
        '.node-menu-submenu, .node-model-submenu, .ui-schema-popup, .img-ratio-popup, .rh-res-popup, .vid-duration-pop, .rh-adv-panel, .rh-vram-adv-panel',
      )
      .forEach((_0x557c89) => {
        if (_0x557c89 !== _0x38993f) hidePopup(_0x557c89);
      }));
}
export function positionNodeSubmenu(_0x1d6972, _0x3a3843) {
  if (!_0x1d6972 || !_0x3a3843) return;
  (showPopup(_0x3a3843, 'flex'), (_0x3a3843.style.top = '0px'));
  const _0x1f3792 = _0x1d6972.closest('.node-model-menu, .img-model-menu');
  if (!_0x1f3792) return;
  const _0x44ccf5 = _0x1d6972.offsetTop || 0,
    _0x13189a = Math.max(0, _0x1f3792.clientHeight - _0x3a3843.offsetHeight);
  _0x3a3843.style.top = Math.min(_0x44ccf5, _0x13189a) + 'px';
}
export function bindNodeModelMenuTrigger({
  root: _0x2a7a06,
  trigger: _0x140b19,
  menu: _0x154ef1,
  closeOthers: _0xbb9646,
  activateMenuKeyboard: _0x264f9b,
} = {}) {
  if (!_0x2a7a06 || !_0x140b19 || !_0x154ef1) return () => {};
  const _0x274e38 = (_0x175d3c) => {
    _0x175d3c.stopPropagation();
    const _0xd31c3d = !_0x154ef1.classList.contains('show');
    if (typeof _0xbb9646 === 'function') _0xbb9646(_0x154ef1);
    else closeNodeFooterMenus(_0x2a7a06, _0x154ef1);
    (_0x154ef1.classList.toggle('show', _0xd31c3d),
      _0xd31c3d && typeof _0x264f9b === 'function' && _0x264f9b(_0x154ef1));
  };
  return (
    _0x140b19.addEventListener('click', _0x274e38),
    () => _0x140b19.removeEventListener('click', _0x274e38)
  );
}
export function bindNodeSubmenus(_0x634a19, { delay: delay = 120 } = {}) {
  if (!_0x634a19) return () => {};
  const _0x5eeac0 = [],
    _0x21ee17 = new Map(),
    _0x173882 = _0x634a19.querySelectorAll('[data-node-menu-submenu]');
  return (
    _0x173882.forEach((_0x203c33) => {
      const _0x5dcb4b = _0x203c33.dataset.nodeMenuSubmenu || '',
        _0xe1ecfd = _0x5dcb4b ? _0x634a19.querySelector(_0x5dcb4b) : null;
      if (!_0xe1ecfd) return;
      const _0xe4eede = () => {
          (clearTimeout(_0x21ee17.get(_0xe1ecfd)), positionNodeSubmenu(_0x203c33, _0xe1ecfd));
        },
        _0x3e1358 = () => {
          (clearTimeout(_0x21ee17.get(_0xe1ecfd)),
            _0x21ee17.set(
              _0xe1ecfd,
              setTimeout(() => {
                (hidePopup(_0xe1ecfd), _0x21ee17.delete(_0xe1ecfd));
              }, delay),
            ));
        };
      (_0x203c33.addEventListener('mouseenter', _0xe4eede),
        _0x203c33.addEventListener('mouseleave', _0x3e1358),
        _0x203c33.addEventListener('click', _0xe4eede),
        _0xe1ecfd.addEventListener('mouseenter', _0xe4eede),
        _0xe1ecfd.addEventListener('mouseleave', _0x3e1358),
        _0x5eeac0.push(() => {
          (clearTimeout(_0x21ee17.get(_0xe1ecfd)),
            _0x203c33.removeEventListener('mouseenter', _0xe4eede),
            _0x203c33.removeEventListener('mouseleave', _0x3e1358),
            _0x203c33.removeEventListener('click', _0xe4eede),
            _0xe1ecfd.removeEventListener('mouseenter', _0xe4eede),
            _0xe1ecfd.removeEventListener('mouseleave', _0x3e1358));
        }));
    }),
    () => _0x5eeac0.forEach((_0x25c7f0) => _0x25c7f0())
  );
}
export function bindNodeFooterController(_0x288954, _0x4b219b = {}) {
  if (!_0x288954) return () => {};
  const _0x5423ff = [];
  _0x5423ff.push(bindNodeSubmenus(_0x288954));
  const _0x50b800 = () => closeNodeFooterMenus(_0x288954);
  (_0x288954.addEventListener('ui-schema-menu-before-open', _0x50b800),
    _0x5423ff.push(() => _0x288954.removeEventListener('ui-schema-menu-before-open', _0x50b800)));
  const _0x114715 = (_0xddbd51) => {
    if (_0x288954.contains(_0xddbd51.target)) return;
    closeNodeFooterMenus(_0x288954);
    if (typeof _0x4b219b.onOutsideClose === 'function') _0x4b219b.onOutsideClose();
  };
  return (
    document?.addEventListener?.('click', _0x114715),
    _0x5423ff.push(() => document?.removeEventListener?.('click', _0x114715)),
    () => _0x5423ff.forEach((_0xcc14b6) => _0xcc14b6())
  );
}
