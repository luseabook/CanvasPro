export function appendToolbarActionMenuTitle(_0x39d049, _0x4f819c) {
  const _0x136b37 = document.createElement('div');
  return (
    (_0x136b37.className = 'node-toolbar-action-menu-title'),
    (_0x136b37.textContent = _0x4f819c),
    _0x39d049.appendChild(_0x136b37),
    _0x136b37
  );
}
export function createToolbarActionMenuItem(_0x1ecb86 = '') {
  const _0x1e2207 = document.createElement('div');
  return (
    (_0x1e2207.className = ['node-toolbar-action-menu-item', _0x1ecb86].filter(Boolean).join(' ')),
    _0x1e2207
  );
}
export function createToolbarActionMenuIcon() {
  const _0x5d8c75 = document.createElement('div');
  return ((_0x5d8c75.className = 'node-toolbar-action-menu-icon'), _0x5d8c75);
}
export function createRunningHubActionIcon() {
  const _0x19afe9 = createToolbarActionMenuIcon(),
    _0x1c6c2b = document.createElement('img');
  return (
    (_0x1c6c2b.className = 'node-toolbar-action-provider-logo'),
    (_0x1c6c2b.src = 'images/RH.png'),
    (_0x1c6c2b.alt = 'runninghub'),
    _0x19afe9.appendChild(_0x1c6c2b),
    _0x19afe9
  );
}
export function createToolbarActionMenuBody() {
  const _0xed61f9 = document.createElement('div');
  return ((_0xed61f9.className = 'node-toolbar-action-menu-body'), _0xed61f9);
}
export function createToolbarActionTitleRow() {
  const _0x131c8f = document.createElement('div');
  return ((_0x131c8f.className = 'node-toolbar-action-title-row'), _0x131c8f);
}
export function createToolbarActionTitle(_0x1ad7c0) {
  const _0x2f1bb9 = document.createElement('span');
  return (
    (_0x2f1bb9.className = 'node-toolbar-action-menu-item-title'),
    (_0x2f1bb9.textContent = _0x1ad7c0),
    _0x2f1bb9
  );
}
export function createToolbarActionDescription(_0x34a315) {
  const _0x51378a = document.createElement('span');
  return (
    (_0x51378a.className = 'node-toolbar-action-menu-item-desc'),
    (_0x51378a.textContent = _0x34a315),
    _0x51378a
  );
}
export function createToolbarActionVipBadge(_0x25c9ec = 'VIP') {
  const _0x243b8b = document.createElement('span');
  return (
    (_0x243b8b.className = 'node-toolbar-action-vip-badge'),
    (_0x243b8b.textContent = _0x25c9ec),
    _0x243b8b
  );
}
export function createToolbarActionPopupAnchorPositionGetter(_0x176133, _0x2c7f22 = {}) {
  const _0x19f0ca = Number.isFinite(Number(_0x2c7f22.gap)) ? Number(_0x2c7f22.gap) : 12,
    _0x3e7176 = (_0x3f2c33) => {
      const _0x282e89 = _0x3f2c33?.getBoundingClientRect?.();
      if (!_0x282e89) return null;
      const _0x35fd4e = Number(_0x282e89.width) || 0,
        _0x42aa35 = Number(_0x282e89.height) || 0;
      return {
        left: Number(_0x282e89.left) || 0,
        top: Number(_0x282e89.top) || 0,
        width: _0x35fd4e,
        height: _0x42aa35,
        right: Number(_0x282e89.right) || (Number(_0x282e89.left) || 0) + _0x35fd4e,
        bottom: Number(_0x282e89.bottom) || (Number(_0x282e89.top) || 0) + _0x42aa35,
      };
    },
    _0x5331e7 = (_0x3d5cad) => Boolean(_0x3d5cad && _0x3d5cad.width > 0 && _0x3d5cad.height > 0),
    _0x806911 = () => _0x3e7176(_0x176133?.closest?.('.v2-img-toolbar-more-menu')),
    _0x4da827 = () => _0x3e7176(_0x176133),
    _0x459fed = () => {
      const _0x267f00 = _0x4da827() || { left: 0, top: 0, width: 0, height: 0 },
        _0x291c0b = _0x806911();
      return {
        left: _0x267f00.left + _0x267f00.width / 2,
        top: (_0x5331e7(_0x291c0b) ? _0x291c0b.top : _0x267f00.top) - _0x19f0ca,
      };
    };
  return ((_0x459fed.hasVisibleAnchor = () => _0x5331e7(_0x4da827())), _0x459fed);
}
