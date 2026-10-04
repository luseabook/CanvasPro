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
function _isActiveMenuUsable(el) {
  return !!(el && el.isConnected !== false && el.classList?.contains?.('show'));
}
function _isEditableEventTarget(value) {
  let el2 = value;
  while (el2) {
    const item = String(el2.tagName || el2.nodeName || '').toLowerCase();
    if (item === 'input' || item === 'textarea' || item === 'select') return true;
    if (el2.isContentEditable === true) return true;
    const key = typeof el2.getAttribute === 'function' ? el2.getAttribute('contenteditable') : null;
    if (key !== null && key !== undefined) {
      const index = String(key).trim().toLowerCase();
      if (index === '' || index === 'true' || index === 'plaintext-only') return true;
    }
    if (typeof el2.closest === 'function') {
      const result = el2.closest(
        'input, textarea, select, [data-ui-schema-input], .rh-stepper-input, [contenteditable]:not([contenteditable="false"])',
      );
      if (result) return true;
    }
    el2 = el2.parentElement || el2.parentNode;
  }
  return false;
}
function _getSelectableItems(el3) {
  if (!el3) return [];
  return Array.from(
    el3.querySelectorAll(
      '.floating-menu-item, [data-value], [data-grsai-toggle], [data-ppio-toggle], [data-apimart-toggle], [data-agnes-toggle], [data-custom-toggle]',
    ),
  ).filter((el4) => {
    if (
      el4.classList.contains('grsai-submenu') ||
      el4.classList.contains('ppio-submenu') ||
      el4.classList.contains('apimart-submenu') ||
      el4.classList.contains('agnes-submenu') ||
      el4.classList.contains('custom-submenu')
    )
      return false;
    if (el4.offsetParent === null) return false;
    return true;
  });
}
function _updateActiveIndex(count) {
  const { items: items } = _activeMenuState;
  if (items.length === 0) return;
  if (count < 0) count = items.length - 1;
  if (count >= items.length) count = 0;
  ((_activeMenuState.activeIndex = count),
    items.forEach((el5, data) => {
      el5.classList.toggle('active', data === count);
    }),
    items[count] && items[count].scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
}
function _openSubmenu(el6) {
  if (!el6) return false;
  let el7 = null;
  const el8 = el6.closest('.floating-menu, .img-model-menu');
  if (el6.classList.contains('custom-group-header') || el6.hasAttribute('data-custom-toggle'))
    el7 = el8?.querySelector('.custom-submenu');
  else {
    if (el6.classList.contains('grsai-group-header') || el6.hasAttribute('data-grsai-toggle'))
      el7 = el8?.querySelector('.grsai-submenu');
    else {
      if (el6.classList.contains('ppio-group-header') || el6.hasAttribute('data-ppio-toggle'))
        el7 = el8?.querySelector('.ppio-submenu');
      else {
        if (el6.classList.contains('apimart-group-header') || el6.hasAttribute('data-apimart-toggle'))
          el7 = el8?.querySelector('.apimart-submenu');
        else
          (el6.classList.contains('agnes-group-header') || el6.hasAttribute('data-agnes-toggle')) &&
            (el7 = el8?.querySelector('.agnes-submenu'));
      }
    }
  }
  if (!el7 || el7.style.display === 'flex') return false;
  el7.style.display = 'flex';
  const list = _getSelectableItems(el7);
  if (list.length === 0) return ((el7.style.display = 'none'), false);
  return (
    (_activeMenuState.parentItem = el6),
    (_activeMenuState.submenu = el7),
    (_activeMenuState.isSubmenu = true),
    (_activeMenuState.items = list),
    (_activeMenuState.activeIndex = 0),
    list.forEach((el9, count2) => el9.classList.toggle('active', count2 === 0)),
    true
  );
}
function _closeSubmenu() {
  const { submenu: submenu, parentItem: parentItem, menu: menu } = _activeMenuState;
  if (!submenu) return false;
  return (
    (submenu.style.display = 'none'),
    (_activeMenuState.isSubmenu = false),
    (_activeMenuState.submenu = null),
    (_activeMenuState.items = _getSelectableItems(menu)),
    parentItem &&
      ((_activeMenuState.activeIndex = _activeMenuState.items.indexOf(parentItem)),
      _activeMenuState.items.forEach((el10, options) => {
        el10.classList.toggle('active', options === _activeMenuState.activeIndex);
      })),
    (_activeMenuState.parentItem = null),
    true
  );
}
function _selectActiveItem() {
  const { items: items2, activeIndex: activeIndex, isSubmenu: isSubmenu2 } = _activeMenuState;
  if (activeIndex < 0 || activeIndex >= items2.length) return false;
  const el11 = items2[activeIndex],
    target =
      el11.classList.contains('custom-group-header') ||
      el11.classList.contains('grsai-group-header') ||
      el11.classList.contains('ppio-group-header') ||
      el11.classList.contains('apimart-group-header') ||
      el11.classList.contains('agnes-group-header') ||
      el11.hasAttribute('data-custom-toggle') ||
      el11.hasAttribute('data-grsai-toggle') ||
      el11.hasAttribute('data-ppio-toggle') ||
      el11.hasAttribute('data-apimart-toggle') ||
      el11.hasAttribute('data-agnes-toggle');
  return target && !isSubmenu2 ? _openSubmenu(el11) : (el11.click(), true);
}
function _closeMenu() {
  const { menu: menu2 } = _activeMenuState;
  (menu2 &&
    (menu2.classList.remove('show'),
    menu2
      .querySelectorAll('.custom-submenu, .grsai-submenu, .ppio-submenu, .apimart-submenu, .agnes-submenu')
      .forEach((el12) => {
        el12.style.display = 'none';
      })),
    _resetState());
}
export function activateMenuKeyboard(enabled) {
  if (!enabled) return;
  (_resetState(),
    (_activeMenuState.menu = enabled),
    (_activeMenuState.items = _getSelectableItems(enabled)),
    (_activeMenuState.activeIndex = _activeMenuState.items.findIndex((el13) =>
      el13.classList.contains('active'),
    )),
    _activeMenuState.activeIndex < 0 &&
      _activeMenuState.items.length > 0 &&
      ((_activeMenuState.activeIndex = 0), _activeMenuState.items[0].classList.add('active')));
}
function _getVisibleSubmenu(el14) {
  if (!el14) return null;
  const source = el14.querySelectorAll(
    '.custom-submenu, .grsai-submenu, .ppio-submenu, .apimart-submenu, .agnes-submenu',
  );
  for (const el15 of source) {
    if (el15.style.display === 'flex' || el15.style.display === 'block') return el15;
  }
  return null;
}
export function handleFloatingMenuKeyboard(event) {
  const { menu: menu3, items: items3, activeIndex: activeIndex2 } = _activeMenuState;
  if (!_isActiveMenuUsable(menu3)) return (_resetState(), false);
  if (_isEditableEventTarget(event?.target)) return false;
  const _getVisibleSubmenu2 = _getVisibleSubmenu(menu3),
    next = !!_getVisibleSubmenu2;
  next &&
    _getVisibleSubmenu2 !== _activeMenuState.submenu &&
    ((_activeMenuState.submenu = _getVisibleSubmenu2),
    (_activeMenuState.isSubmenu = true),
    (_activeMenuState.items = _getSelectableItems(_getVisibleSubmenu2)),
    (_activeMenuState.activeIndex = 0),
    _activeMenuState.items.forEach((el16, count3) => {
      el16.classList.toggle('active', count3 === 0);
    }));
  switch (event.key) {
    case 'ArrowDown':
      (event.preventDefault(), _updateActiveIndex(_activeMenuState.activeIndex + 1));
      return true;
    case 'ArrowUp':
      (event.preventDefault(), _updateActiveIndex(_activeMenuState.activeIndex - 1));
      return true;
    case 'ArrowRight':
      event.preventDefault();
      !_activeMenuState.isSubmenu &&
        _activeMenuState.activeIndex >= 0 &&
        _openSubmenu(_activeMenuState.items[_activeMenuState.activeIndex]);
      return true;
    case 'ArrowLeft':
      event.preventDefault();
      _activeMenuState.isSubmenu ? _closeSubmenu() : _closeMenu();
      return true;
    case 'Enter':
      (event.preventDefault(), _selectActiveItem());
      return true;
    case 'Escape':
      event.preventDefault();
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
    (current) => {
      hasActiveFloatingMenu() && handleFloatingMenuKeyboard(current);
    },
    true,
  );
}
