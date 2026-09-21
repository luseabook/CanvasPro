let _activeMenuState = {
  menu: null,
  items: [],
  activeIndex: -1,
  submenu: null,
  parentItem: null,
  isSubmenu: false,
};
function _resetState() {
  _activeMenuState = {
    menu: null,
    items: [],
    activeIndex: -1,
    submenu: null,
    parentItem: null,
    isSubmenu: false,
  };
}
function _isActiveMenuUsable(_0x21ec1d) {
  return !!(_0x21ec1d && _0x21ec1d.isConnected !== false && _0x21ec1d.classList?.contains?.('show'));
}
function _isEditableEventTarget(_0x2d52a0) {
  let _0x53f8a4 = _0x2d52a0;
  while (_0x53f8a4) {
    const _0x2250a3 = String(_0x53f8a4.tagName || _0x53f8a4.nodeName || '').toLowerCase();
    if (_0x2250a3 === 'input' || _0x2250a3 === 'textarea' || _0x2250a3 === 'select') return true;
    if (_0x53f8a4.isContentEditable === true) return true;
    const _0x2449c2 =
      typeof _0x53f8a4.getAttribute === 'function' ? _0x53f8a4.getAttribute('contenteditable') : null;
    if (_0x2449c2 !== null && _0x2449c2 !== undefined) {
      const _0x133f26 = String(_0x2449c2).trim().toLowerCase();
      if (_0x133f26 === '' || _0x133f26 === 'true' || _0x133f26 === 'plaintext-only') return true;
    }
    if (typeof _0x53f8a4.closest === 'function') {
      const _0x34662a = _0x53f8a4.closest(
        'input, textarea, select, [data-ui-schema-input], .rh-stepper-input, [contenteditable]:not([contenteditable="false"])',
      );
      if (_0x34662a) return true;
    }
    _0x53f8a4 = _0x53f8a4.parentElement || _0x53f8a4.parentNode;
  }
  return false;
}
function _getSelectableItems(_0x103257) {
  if (!_0x103257) return [];
  return Array.from(
    _0x103257.querySelectorAll(
      '.floating-menu-item, [data-value], [data-grsai-toggle], [data-ppio-toggle], [data-apimart-toggle], [data-agnes-toggle], [data-custom-toggle]',
    ),
  ).filter((_0x568fb3) => {
    if (
      _0x568fb3.classList.contains('grsai-submenu') ||
      _0x568fb3.classList.contains('ppio-submenu') ||
      _0x568fb3.classList.contains('apimart-submenu') ||
      _0x568fb3.classList.contains('agnes-submenu') ||
      _0x568fb3.classList.contains('custom-submenu')
    )
      return false;
    if (_0x568fb3.offsetParent === null) return false;
    return true;
  });
}
function _updateActiveIndex(_0x9a8be3) {
  const { items: _0x456c82 } = _activeMenuState;
  if (_0x456c82.length === 0) return;
  if (_0x9a8be3 < 0) _0x9a8be3 = _0x456c82.length - 1;
  if (_0x9a8be3 >= _0x456c82.length) _0x9a8be3 = 0;
  ((_activeMenuState.activeIndex = _0x9a8be3),
    _0x456c82.forEach((_0x39a442, _0x5bb59e) => {
      _0x39a442.classList.toggle('active', _0x5bb59e === _0x9a8be3);
    }),
    _0x456c82[_0x9a8be3] && _0x456c82[_0x9a8be3].scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
}
function _openSubmenu(_0x4452b2) {
  if (!_0x4452b2) return false;
  let _0x23de05 = null;
  const _0x242613 = _0x4452b2.closest('.floating-menu, .img-model-menu');
  if (_0x4452b2.classList.contains('custom-group-header') || _0x4452b2.hasAttribute('data-custom-toggle'))
    _0x23de05 = _0x242613?.querySelector('.custom-submenu');
  else {
    if (_0x4452b2.classList.contains('grsai-group-header') || _0x4452b2.hasAttribute('data-grsai-toggle'))
      _0x23de05 = _0x242613?.querySelector('.grsai-submenu');
    else {
      if (_0x4452b2.classList.contains('ppio-group-header') || _0x4452b2.hasAttribute('data-ppio-toggle'))
        _0x23de05 = _0x242613?.querySelector('.ppio-submenu');
      else {
        if (
          _0x4452b2.classList.contains('apimart-group-header') ||
          _0x4452b2.hasAttribute('data-apimart-toggle')
        )
          _0x23de05 = _0x242613?.querySelector('.apimart-submenu');
        else
          (_0x4452b2.classList.contains('agnes-group-header') ||
            _0x4452b2.hasAttribute('data-agnes-toggle')) &&
            (_0x23de05 = _0x242613?.querySelector('.agnes-submenu'));
      }
    }
  }
  if (!_0x23de05 || _0x23de05.style.display === 'flex') return false;
  _0x23de05.style.display = 'flex';
  const _0x1c24f0 = _getSelectableItems(_0x23de05);
  if (_0x1c24f0.length === 0) return ((_0x23de05.style.display = 'none'), false);
  return (
    (_activeMenuState.parentItem = _0x4452b2),
    (_activeMenuState.submenu = _0x23de05),
    (_activeMenuState.isSubmenu = true),
    (_activeMenuState.items = _0x1c24f0),
    (_activeMenuState.activeIndex = 0),
    _0x1c24f0.forEach((_0x1ff562, _0x3602ff) => _0x1ff562.classList.toggle('active', _0x3602ff === 0)),
    true
  );
}
function _closeSubmenu() {
  const { submenu: _0x444636, parentItem: _0x4fd723, menu: _0x3d08e2 } = _activeMenuState;
  if (!_0x444636) return false;
  return (
    (_0x444636.style.display = 'none'),
    (_activeMenuState.isSubmenu = false),
    (_activeMenuState.submenu = null),
    (_activeMenuState.items = _getSelectableItems(_0x3d08e2)),
    _0x4fd723 &&
      ((_activeMenuState.activeIndex = _activeMenuState.items.indexOf(_0x4fd723)),
      _activeMenuState.items.forEach((_0x442e5e, _0x1eb458) => {
        _0x442e5e.classList.toggle('active', _0x1eb458 === _activeMenuState.activeIndex);
      })),
    (_activeMenuState.parentItem = null),
    true
  );
}
function _selectActiveItem() {
  const { items: _0x408f42, activeIndex: _0x20a2de, isSubmenu: _0x5e33f1 } = _activeMenuState;
  if (_0x20a2de < 0 || _0x20a2de >= _0x408f42.length) return false;
  const _0x4fb5a2 = _0x408f42[_0x20a2de],
    _0x290c7d =
      _0x4fb5a2.classList.contains('custom-group-header') ||
      _0x4fb5a2.classList.contains('grsai-group-header') ||
      _0x4fb5a2.classList.contains('ppio-group-header') ||
      _0x4fb5a2.classList.contains('apimart-group-header') ||
      _0x4fb5a2.classList.contains('agnes-group-header') ||
      _0x4fb5a2.hasAttribute('data-custom-toggle') ||
      _0x4fb5a2.hasAttribute('data-grsai-toggle') ||
      _0x4fb5a2.hasAttribute('data-ppio-toggle') ||
      _0x4fb5a2.hasAttribute('data-apimart-toggle') ||
      _0x4fb5a2.hasAttribute('data-agnes-toggle');
  return _0x290c7d && !_0x5e33f1 ? _openSubmenu(_0x4fb5a2) : (_0x4fb5a2.click(), true);
}
function _closeMenu() {
  const { menu: _0x3bc4e4 } = _activeMenuState;
  (_0x3bc4e4 &&
    (_0x3bc4e4.classList.remove('show'),
    _0x3bc4e4
      .querySelectorAll('.custom-submenu, .grsai-submenu, .ppio-submenu, .apimart-submenu, .agnes-submenu')
      .forEach((_0x1a0c26) => {
        _0x1a0c26.style.display = 'none';
      })),
    _resetState());
}
export function activateMenuKeyboard(_0x106624) {
  if (!_0x106624) return;
  (_resetState(),
    (_activeMenuState.menu = _0x106624),
    (_activeMenuState.items = _getSelectableItems(_0x106624)),
    (_activeMenuState.activeIndex = _activeMenuState.items.findIndex((_0x268f8d) =>
      _0x268f8d.classList.contains('active'),
    )),
    _activeMenuState.activeIndex < 0 &&
      _activeMenuState.items.length > 0 &&
      ((_activeMenuState.activeIndex = 0), _activeMenuState.items[0].classList.add('active')));
}
function _getVisibleSubmenu(_0x1168a5) {
  if (!_0x1168a5) return null;
  const _0x3a5918 = _0x1168a5.querySelectorAll(
    '.custom-submenu, .grsai-submenu, .ppio-submenu, .apimart-submenu, .agnes-submenu',
  );
  for (const _0x293bb1 of _0x3a5918) {
    if (_0x293bb1.style.display === 'flex' || _0x293bb1.style.display === 'block') return _0x293bb1;
  }
  return null;
}
export function handleFloatingMenuKeyboard(_0x2bfe96) {
  const { menu: _0x31f342, items: _0x406e34, activeIndex: _0x1d216b } = _activeMenuState;
  if (!_isActiveMenuUsable(_0x31f342)) return (_resetState(), false);
  if (_isEditableEventTarget(_0x2bfe96?.target)) return false;
  const _0x32d678 = _getVisibleSubmenu(_0x31f342),
    _0x1bd804 = !!_0x32d678;
  _0x1bd804 &&
    _0x32d678 !== _activeMenuState.submenu &&
    ((_activeMenuState.submenu = _0x32d678),
    (_activeMenuState.isSubmenu = true),
    (_activeMenuState.items = _getSelectableItems(_0x32d678)),
    (_activeMenuState.activeIndex = 0),
    _activeMenuState.items.forEach((_0x59dd50, _0x15288f) => {
      _0x59dd50.classList.toggle('active', _0x15288f === 0);
    }));
  switch (_0x2bfe96.key) {
    case 'ArrowDown':
      (_0x2bfe96.preventDefault(), _updateActiveIndex(_activeMenuState.activeIndex + 1));
      return true;
    case 'ArrowUp':
      (_0x2bfe96.preventDefault(), _updateActiveIndex(_activeMenuState.activeIndex - 1));
      return true;
    case 'ArrowRight':
      _0x2bfe96.preventDefault();
      !_activeMenuState.isSubmenu &&
        _activeMenuState.activeIndex >= 0 &&
        _openSubmenu(_activeMenuState.items[_activeMenuState.activeIndex]);
      return true;
    case 'ArrowLeft':
      _0x2bfe96.preventDefault();
      _activeMenuState.isSubmenu ? _closeSubmenu() : _closeMenu();
      return true;
    case 'Enter':
      (_0x2bfe96.preventDefault(), _selectActiveItem());
      return true;
    case 'Escape':
      _0x2bfe96.preventDefault();
      isSubmenu ? _closeSubmenu() : _closeMenu();
      return true;
    default:
      return false;
  }
}
export function hasActiveFloatingMenu() {
  if (!_isActiveMenuUsable(_activeMenuState.menu)) return (_resetState(), false);
  return true;
}
export function initFloatingMenuKeyboard() {
  document.addEventListener(
    'keydown',
    (_0x51f314) => {
      hasActiveFloatingMenu() && handleFloatingMenuKeyboard(_0x51f314);
    },
    true,
  );
}
