import {
  getSlashPromptPresetEntries,
  openCustomPresetsManager,
  shouldInsertPromptForPreset,
} from './promptPresets.js';
import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import { createSafeSvg, sanitizePromptHtml } from '../utils/dom.js';
function slashMenuText(_0x5973ca, _0x1d6356 = {}) {
  return t('promptPresets.slash.' + _0x5973ca, _0x1d6356);
}
let _slashMenuEl = null;
export function getSlashMenu() {
  return (
    !_slashMenuEl &&
      ((_slashMenuEl = document.getElementById('v2-slash-menu')),
      !_slashMenuEl &&
        ((_slashMenuEl = document.createElement('div')),
        (_slashMenuEl.id = 'v2-slash-menu'),
        (_slashMenuEl.className = 'preset-slash-menu'),
        document.body.appendChild(_slashMenuEl))),
    _slashMenuEl
  );
}
let _subMenuState = { activeSubmenu: null, parentItem: null, subItems: [], subIndex: -1 },
  _slashViewportUnsubscribe = null,
  _slashOutsideDocClick = null,
  _slashOutsideDocClickTimer = 0,
  _slashPositionState = null;
function resetSubMenuState() {
  _subMenuState = { activeSubmenu: null, parentItem: null, subItems: [], subIndex: -1 };
}
function _appendPresetIcon(_0x5746c1, _0x829907) {
  if (!_0x5746c1 || !_0x829907) return;
  const _0x5a0f27 = String(_0x829907).trim();
  if (_0x5a0f27.startsWith('<svg')) {
    const _0x2d6c2e = createSafeSvg(_0x5a0f27);
    if (_0x2d6c2e) {
      (_0x5746c1.appendChild(_0x2d6c2e), _0x5746c1.appendChild(document.createTextNode(' ')));
      return;
    }
  }
  _0x5746c1.appendChild(document.createTextNode(String(_0x829907) + ' '));
}
function _getSlashPresetTriggerModeLabel(_0x124bc2 = {}) {
  return shouldInsertPromptForPreset(_0x124bc2)
    ? t('promptPresets.triggerModes.insertPrompt')
    : t('promptPresets.triggerModes.direct');
}
function _isSelectableSlashPreset(_0x4995a3 = {}) {
  return _0x4995a3 && Object.prototype.hasOwnProperty.call(_0x4995a3, 'template');
}
function _appendSlashPresetTriggerBadge(_0x29c26d, _0x425147 = {}) {
  if (!_0x29c26d) return;
  const _0xe71424 = document.createElement('span');
  ((_0xe71424.className = 'preset-slash-trigger-badge'),
    (_0xe71424.textContent = _getSlashPresetTriggerModeLabel(_0x425147)),
    _0x29c26d.appendChild(_0xe71424));
}
function _getSlashSubmenuPresetItems(_0x29bc55) {
  return Array.from(_0x29bc55?.querySelectorAll?.('.preset-slash-item') || []);
}
function _createSlashSubmenuItem({
  submenu: _0x229dea,
  sub: _0x589e15,
  promptEl: _0x4157c8,
  nodeId: _0x33e033,
  range: _0x5195f0,
  selection: _0x4cd9a0,
  onGenerate: _0x59f21a,
}) {
  const _0x1745a8 = document.createElement('div');
  _0x1745a8.className = 'preset-slash-item has-desc';
  _isSelectableSlashPreset(_0x589e15) && _0x1745a8.classList.add('has-trigger-badge');
  const _0x47d0cd = document.createElement('div');
  _0x47d0cd.className = 'preset-slash-title-wrap';
  const _0x3a2ba4 = document.createElement('div');
  _0x3a2ba4.className = 'preset-slash-title';
  _0x589e15.icon && _appendPresetIcon(_0x3a2ba4, _0x589e15.icon);
  _0x3a2ba4.appendChild(document.createTextNode(_0x589e15.title || ''));
  const _0x8a52e8 = document.createElement('div');
  return (
    (_0x8a52e8.className = 'preset-slash-desc'),
    (_0x8a52e8.textContent = _0x589e15.desc || _0x589e15.template || ''),
    _0x47d0cd.appendChild(_0x3a2ba4),
    _0x47d0cd.appendChild(_0x8a52e8),
    _0x1745a8.appendChild(_0x47d0cd),
    _isSelectableSlashPreset(_0x589e15) && _appendSlashPresetTriggerBadge(_0x1745a8, _0x589e15),
    _0x1745a8.addEventListener('mouseenter', () => {
      (_getSlashSubmenuPresetItems(_0x229dea).forEach((_0x271a58) => _0x271a58.classList.remove('active')),
        _0x1745a8.classList.add('active'));
    }),
    _0x1745a8.addEventListener('mousedown', (_0x3da216) => {
      (_0x3da216.preventDefault(),
        _0x3da216.stopPropagation(),
        _selectPromptPreset({
          promptEl: _0x4157c8,
          nodeId: _0x33e033,
          preset: _0x589e15,
          range: _0x5195f0,
          selection: _0x4cd9a0,
          onGenerate: _0x59f21a,
        }));
    }),
    _0x1745a8
  );
}
function _isSlashNodeConnected(_0x17eba1) {
  if (!_0x17eba1) return false;
  if (_0x17eba1.isConnected === true) return true;
  if (typeof document === 'undefined') return true;
  return typeof document.body?.contains === 'function' ? document.body.contains(_0x17eba1) : true;
}
function _clearSlashOutsideDocClick() {
  (_slashOutsideDocClickTimer && (clearTimeout(_slashOutsideDocClickTimer), (_slashOutsideDocClickTimer = 0)),
    _slashOutsideDocClick &&
      typeof document !== 'undefined' &&
      document.removeEventListener?.('mousedown', _slashOutsideDocClick),
    (_slashOutsideDocClick = null));
}
function _cleanupSlashMenuLifecycle() {
  (_clearSlashOutsideDocClick(),
    _slashViewportUnsubscribe && (_slashViewportUnsubscribe(), (_slashViewportUnsubscribe = null)),
    (_slashPositionState = null));
}
function _getSlashAnchorRect(_0xec9d3f) {
  if (
    !_0xec9d3f ||
    typeof _0xec9d3f.getBoundingClientRect !== 'function' ||
    !_isSlashNodeConnected(_0xec9d3f)
  )
    return null;
  return _0xec9d3f.getBoundingClientRect();
}
function _positionSlashSubmenu(_0x1b55cb, _0x367dbb) {
  if (!_0x1b55cb || !_0x367dbb || typeof _0x1b55cb.getBoundingClientRect !== 'function') return;
  const _0x576926 = _0x1b55cb.getBoundingClientRect();
  _0x367dbb.style.left = _0x576926.right + 6 + 'px';
  const _0x3d46c6 = window.innerHeight || document.documentElement?.clientHeight || 0,
    _0x55d2da = _0x367dbb.offsetHeight || _0x367dbb.getBoundingClientRect?.().height || 0;
  let _0x496298 = _0x576926.top;
  (_0x3d46c6 > 0 &&
    _0x55d2da > 0 &&
    ((_0x496298 = Math.min(_0x496298, _0x3d46c6 - _0x55d2da - 8)), (_0x496298 = Math.max(8, _0x496298))),
    (_0x367dbb.style.top = _0x496298 + 'px'));
}
function _syncOpenSlashSubmenus() {
  const _0xa76ad = _slashPositionState?.menu || _slashMenuEl;
  if (!_0xa76ad) return;
  document.querySelectorAll?.('.preset-slash-submenu').forEach((_0x4806c7) => {
    if (!_0x4806c7.classList?.contains('open')) return;
    const _0x8033f2 = _0x4806c7.dataset?.parentItem || '';
    if (!_0x8033f2) return;
    const _0x26b25a = Array.from(_0xa76ad.children || []).find(
      (_0x1dff2d) => _0x1dff2d.dataset?.itemId === _0x8033f2,
    );
    _positionSlashSubmenu(_0x26b25a, _0x4806c7);
  });
}
function _positionSlashMenu() {
  const _0x30fe97 = _slashPositionState,
    _0x8092eb = _0x30fe97?.menu;
  if (!_0x30fe97 || !_0x8092eb || !_0x8092eb.classList?.contains('open')) return;
  const _0x1e08f1 = _getSlashAnchorRect(_0x30fe97.anchorEl);
  if (!_0x1e08f1) {
    closeSlashMenu();
    return;
  }
  const _0xa4c4d0 = _0x8092eb.offsetHeight || _0x30fe97.menuHeight || 0x118;
  ((_0x30fe97.menuHeight = _0xa4c4d0),
    (_0x8092eb.style.left = _0x1e08f1.left + 'px'),
    (_0x8092eb.style.visibility = 'visible'),
    _0x1e08f1.top - _0xa4c4d0 < 0
      ? ((_0x8092eb.style.transformOrigin = 'top left'), (_0x8092eb.style.top = _0x1e08f1.bottom + 8 + 'px'))
      : ((_0x8092eb.style.transformOrigin = 'bottom left'),
        (_0x8092eb.style.top = _0x1e08f1.top - _0xa4c4d0 - 8 + 'px')),
    _syncOpenSlashSubmenus());
}
function _watchSlashViewport() {
  if (typeof appStore.subscribeSelector !== 'function') return;
  if (_slashViewportUnsubscribe) _slashViewportUnsubscribe();
  _slashViewportUnsubscribe = appStore.subscribeSelector(
    (_0x4038ef) => _0x4038ef.viewport,
    () => _positionSlashMenu(),
  );
}
function _bindSlashOutsideDocClick(_0xdb5aef) {
  (_clearSlashOutsideDocClick(),
    (_slashOutsideDocClick = (_0x2f7944) => {
      const _0x383262 = Array.from(document.querySelectorAll?.('.preset-slash-submenu') || []).some(
        (_0x295354) => _0x295354.contains?.(_0x2f7944.target),
      );
      !_0xdb5aef.contains(_0x2f7944.target) && !_0x383262 && closeSlashMenu();
    }),
    (_slashOutsideDocClickTimer = setTimeout(() => {
      ((_slashOutsideDocClickTimer = 0),
        _slashOutsideDocClick && document.addEventListener?.('mousedown', _slashOutsideDocClick));
    }, 10)));
}
export function closeSlashMenu() {
  _cleanupSlashMenuLifecycle();
  if (typeof document === 'undefined') {
    resetSubMenuState();
    return;
  }
  const _0x4462e3 = getSlashMenu();
  (_0x4462e3.classList.remove('open'),
    document.querySelectorAll('.preset-slash-submenu').forEach((_0x4cb4cc) => _0x4cb4cc.remove()),
    _0x4462e3.replaceChildren(),
    resetSubMenuState());
}
function _removeSlashTriggerText(_0xe370c9, _0x3fa999) {
  const _0x330652 = _0xe370c9?.startContainer;
  if (!_0x330652 || _0x330652.nodeType !== Node.TEXT_NODE) return;
  const _0x32e4e3 = _0x330652.textContent,
    _0xe506a5 = _0xe370c9.startOffset,
    _0x2e15b9 = _0x32e4e3.lastIndexOf('/', _0xe506a5 - 1);
  if (_0x2e15b9 === -1) return;
  ((_0x330652.textContent = _0x32e4e3.substring(0, _0x2e15b9) + _0x32e4e3.substring(_0xe506a5)),
    _0xe370c9.setStart(_0x330652, _0x2e15b9),
    _0xe370c9.setEnd(_0x330652, _0x2e15b9),
    _0x3fa999.removeAllRanges(),
    _0x3fa999.addRange(_0xe370c9));
}
function _selectPromptPreset({
  promptEl: _0x4c56f9,
  nodeId: _0x1a3be8,
  preset: _0x2a2fdb,
  range: _0x11bc5c,
  selection: _0x5cc312,
  onGenerate: _0x291aa5,
}) {
  (closeSlashMenu(),
    _removeSlashTriggerText(_0x11bc5c, _0x5cc312),
    _0x4c56f9.querySelectorAll('.preset-pill').forEach((_0x412d60) => _0x412d60.remove()),
    appStore.updateNodeData(_0x1a3be8, { prompt: sanitizePromptHtml(_0x4c56f9.innerHTML) }),
    setTimeout(() => {
      _0x291aa5?.(_0x2a2fdb?.template, { insertPrompt: shouldInsertPromptForPreset(_0x2a2fdb) });
    }, 50));
}
export function checkSlashTrigger(
  _0x4dd9ad,
  { promptEl: _0xae49a1, nodeType: _0x3db939, nodeId: _0x7337d5, onGenerate: _0x53a9d9 },
) {
  if (_0x4dd9ad.inputType === 'insertCompositionText') return;
  const _0x5f0c7b = window.getSelection();
  if (!_0x5f0c7b.rangeCount) return;
  const _0x5f3c86 = _0x5f0c7b.getRangeAt(0);
  if (_0x5f3c86.startContainer.nodeType !== Node.TEXT_NODE) {
    closeSlashMenu();
    return;
  }
  const _0x40b3d6 = _0x5f3c86.startContainer.textContent.slice(0, _0x5f3c86.startOffset),
    _0x1a2c2e = _0x40b3d6.lastIndexOf('/');
  if (_0x1a2c2e === -1 || _0x1a2c2e !== _0x40b3d6.length - 1) {
    closeSlashMenu();
    return;
  }
  const _0x1da878 = getSlashPromptPresetEntries(_0x3db939),
    _0x51008c = getSlashMenu();
  (_cleanupSlashMenuLifecycle(),
    document.querySelectorAll('.preset-slash-submenu').forEach((_0x5f2633) => _0x5f2633.remove()),
    _0x51008c.replaceChildren());
  if (_0x1da878.length > 0) {
    const _0x5c071b = document.createElement('div');
    ((_0x5c071b.className = 'preset-slash-header'),
      (_0x5c071b.textContent = slashMenuText('header')),
      _0x51008c.appendChild(_0x5c071b));
  }
  _0x1da878.forEach((_0x2d0df2, _0x515ad9) => {
    const _0x45e778 = document.createElement('div');
    _0x45e778.className = 'preset-slash-item has-desc' + (_0x515ad9 === 0 ? ' active' : '');
    const _0x426382 = 'slash-item-' + _0x515ad9;
    _0x45e778.dataset.itemId = _0x426382;
    const _0x39e362 = document.createElement('div');
    _0x39e362.className = 'preset-slash-title-wrap';
    const _0x3b906e = document.createElement('div');
    _0x3b906e.className = 'preset-slash-title';
    _0x2d0df2.icon && _appendPresetIcon(_0x3b906e, _0x2d0df2.icon);
    _0x3b906e.appendChild(document.createTextNode(_0x2d0df2.title || ''));
    if (_0x2d0df2.subItems) {
      const _0xfaffed = document.createElement('span');
      ((_0xfaffed.className = 'preset-slash-title-arrow'),
        (_0xfaffed.textContent = '>'),
        _0x3b906e.appendChild(_0xfaffed));
    }
    const _0x52e4dd = document.createElement('div');
    ((_0x52e4dd.className = 'preset-slash-desc'),
      (_0x52e4dd.textContent = _0x2d0df2.desc || _0x2d0df2.template || slashMenuText('subItemsDesc')),
      _0x39e362.appendChild(_0x3b906e),
      _0x39e362.appendChild(_0x52e4dd),
      _0x45e778.appendChild(_0x39e362));
    if (_0x2d0df2.subItems && _0x2d0df2.subItems.length > 0) {
      _0x45e778.style.overflow = 'visible';
      const _0x4a03d6 = document.createElement('div');
      ((_0x4a03d6.className = 'preset-slash-submenu'), (_0x4a03d6.dataset.parentItem = _0x426382));
      const _0x927496 = document.createElement('div');
      ((_0x927496.className = 'preset-slash-submenu-list'),
        _0x2d0df2.subItems.forEach((_0x21d405) => {
          _0x927496.appendChild(
            _createSlashSubmenuItem({
              submenu: _0x4a03d6,
              sub: _0x21d405,
              promptEl: _0xae49a1,
              nodeId: _0x7337d5,
              range: _0x5f3c86,
              selection: _0x5f0c7b,
              onGenerate: _0x53a9d9,
            }),
          );
        }),
        _0x4a03d6.appendChild(_0x927496),
        document.body.appendChild(_0x4a03d6));
      let _0x4a60af;
      (_0x45e778.addEventListener('mouseenter', () => {
        (Array.from(_0x51008c.children).forEach((_0xc606d1) => _0xc606d1.classList.remove('active')),
          _0x45e778.classList.add('active'),
          clearTimeout(_0x4a60af),
          _0x4a03d6.classList.add('open'),
          _positionSlashSubmenu(_0x45e778, _0x4a03d6));
      }),
        _0x45e778.addEventListener('mouseleave', () => {
          _0x4a60af = setTimeout(() => {
            _0x4a03d6.classList.remove('open');
          }, 100);
        }),
        _0x4a03d6.addEventListener('mouseenter', () => {
          clearTimeout(_0x4a60af);
        }),
        _0x4a03d6.addEventListener('mouseleave', () => {
          _0x4a60af = setTimeout(() => {
            _0x4a03d6.classList.remove('open');
          }, 100);
        }),
        _0x45e778.addEventListener('mousedown', (_0x4f842f) => {
          (_0x4f842f.preventDefault(), _0x4f842f.stopPropagation());
        }));
    } else
      (_isSelectableSlashPreset(_0x2d0df2) &&
        (_0x45e778.classList.add('has-trigger-badge'), _appendSlashPresetTriggerBadge(_0x45e778, _0x2d0df2)),
        _0x45e778.addEventListener('mouseenter', () => {
          (Array.from(_0x51008c.children).forEach((_0x412123) => _0x412123.classList?.remove('active')),
            _0x45e778.classList.add('active'));
        }),
        _0x45e778.addEventListener('mousedown', (_0x59a278) => {
          (_0x59a278.preventDefault(),
            _selectPromptPreset({
              promptEl: _0xae49a1,
              nodeId: _0x7337d5,
              preset: _0x2d0df2,
              range: _0x5f3c86,
              selection: _0x5f0c7b,
              onGenerate: _0x53a9d9,
            }));
        }));
    _0x51008c.appendChild(_0x45e778);
  });
  if (['ai-image', 'ai-text', 'ai-video', 'ai-audio'].includes(_0x3db939)) {
    const _0x22d942 = document.createElement('div');
    _0x22d942.className = 'preset-slash-item preset-slash-custom has-desc';
    _0x1da878.length === 0 && _0x22d942.classList.add('preset-slash-custom-first');
    const _0x22d8b8 = document.createElement('div');
    _0x22d8b8.className = 'preset-slash-title-wrap';
    const _0x411127 = document.createElement('div');
    _0x411127.className = 'preset-slash-title preset-slash-custom-header';
    const _0x340da9 = document.createElement('span');
    ((_0x340da9.className = 'preset-slash-custom-title'),
      (_0x340da9.textContent = slashMenuText('customTitle')));
    const _0x298bb7 = document.createElement('span');
    ((_0x298bb7.className = 'preset-slash-badge'),
      (_0x298bb7.textContent = slashMenuText('customBadge')),
      _0x411127.appendChild(_0x340da9),
      _0x411127.appendChild(_0x298bb7));
    const _0x876a58 = document.createElement('div');
    ((_0x876a58.className = 'preset-slash-desc'),
      (_0x876a58.textContent = slashMenuText('customDesc')),
      _0x22d8b8.appendChild(_0x411127),
      _0x22d8b8.appendChild(_0x876a58),
      _0x22d942.appendChild(_0x22d8b8),
      _0x22d942.addEventListener('mousedown', (_0x3b2dad) => {
        (_0x3b2dad.preventDefault(), closeSlashMenu(), openCustomPresetsManager({ nodeType: _0x3db939 }));
      }),
      _0x51008c.appendChild(_0x22d942));
  }
  ((_0x51008c.style.left = '-9999px'),
    (_0x51008c.style.top = '-9999px'),
    _0x51008c.classList.add('open'),
    (_0x51008c.style.visibility = 'hidden'),
    (_slashPositionState = {
      menu: _0x51008c,
      anchorEl: _0xae49a1.parentNode || _0xae49a1,
      menuHeight: _0x51008c.offsetHeight || 0x118,
    }),
    _positionSlashMenu(),
    _watchSlashViewport(),
    _bindSlashOutsideDocClick(_0x51008c));
}
function activateSubMenu(_0x48a4b2, _0x443e34) {
  const _0x2555ab = document.querySelectorAll('.preset-slash-submenu');
  (_0x2555ab.forEach((_0x55c88a) => {
    if (_0x55c88a !== _0x443e34) _0x55c88a.classList.remove('open');
  }),
    _0x443e34.classList.add('open'),
    _positionSlashSubmenu(_0x48a4b2, _0x443e34));
  const _0x427432 = _getSlashSubmenuPresetItems(_0x443e34);
  ((_subMenuState.activeSubmenu = _0x443e34),
    (_subMenuState.parentItem = _0x48a4b2),
    (_subMenuState.subItems = _0x427432),
    (_subMenuState.subIndex = 0),
    _0x427432.forEach((_0x1bc282, _0x21acf9) => _0x1bc282.classList.toggle('active', _0x21acf9 === 0)));
  if (_0x427432[0]) _0x427432[0].scrollIntoView({ block: 'nearest' });
}
function deactivateSubMenu() {
  if (_subMenuState.activeSubmenu) {
    _subMenuState.activeSubmenu.classList.remove('open');
    if (_subMenuState.parentItem) {
      const _0x301150 = Array.from(_subMenuState.parentItem.parentNode.children).filter(
        (_0x3965ed) => _0x3965ed.classList && _0x3965ed.classList.contains('preset-slash-item'),
      );
      (_0x301150.forEach((_0xee2d65) => _0xee2d65.classList.remove('active')),
        _subMenuState.parentItem.classList.add('active'));
    }
    resetSubMenuState();
  }
}
export function handleSlashKeyboardNavigation(_0x3889b1) {
  const _0x3349ce = getSlashMenu();
  if (!_0x3349ce.classList.contains('open')) return false;
  if (_subMenuState.activeSubmenu) {
    const { subItems: _0x482d73, subIndex: _0x3af2a1 } = _subMenuState;
    if (_0x3889b1.key === 'ArrowLeft') return (_0x3889b1.preventDefault(), deactivateSubMenu(), true);
    if (_0x3889b1.key === 'ArrowDown') {
      _0x3889b1.preventDefault();
      const _0x4bcb6d = _0x3af2a1 < _0x482d73.length - 1 ? _0x3af2a1 + 1 : 0;
      ((_subMenuState.subIndex = _0x4bcb6d),
        _0x482d73.forEach((_0x336ef1, _0x229c01) =>
          _0x336ef1.classList.toggle('active', _0x229c01 === _0x4bcb6d),
        ));
      if (_0x482d73[_0x4bcb6d]) _0x482d73[_0x4bcb6d].scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (_0x3889b1.key === 'ArrowUp') {
      _0x3889b1.preventDefault();
      const _0x5b2886 = _0x3af2a1 > 0 ? _0x3af2a1 - 1 : _0x482d73.length - 1;
      ((_subMenuState.subIndex = _0x5b2886),
        _0x482d73.forEach((_0x4bfe13, _0x4b949d) =>
          _0x4bfe13.classList.toggle('active', _0x4b949d === _0x5b2886),
        ));
      if (_0x482d73[_0x5b2886]) _0x482d73[_0x5b2886].scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (_0x3889b1.key === 'Enter')
      return (
        _0x3889b1.preventDefault(),
        _0x3af2a1 >= 0 &&
          _0x482d73[_0x3af2a1] &&
          _0x482d73[_0x3af2a1].dispatchEvent(new MouseEvent('mousedown')),
        resetSubMenuState(),
        true
      );
    if (_0x3889b1.key === 'Escape') return (_0x3889b1.preventDefault(), deactivateSubMenu(), true);
    return false;
  }
  const _0x3d1138 = Array.from(_0x3349ce.children).filter(
    (_0x1b0526) => _0x1b0526.classList && _0x1b0526.classList.contains('preset-slash-item'),
  );
  let _0x594479 = _0x3d1138.findIndex((_0x565bcf) => _0x565bcf.classList.contains('active'));
  if (_0x3889b1.key === 'ArrowDown') {
    (_0x3889b1.preventDefault(),
      (_0x594479 = _0x594479 < _0x3d1138.length - 1 ? _0x594479 + 1 : 0),
      _0x3d1138.forEach((_0x2ea51d, _0x23a5f5) =>
        _0x2ea51d.classList.toggle('active', _0x23a5f5 === _0x594479),
      ));
    if (_0x3d1138[_0x594479]) _0x3d1138[_0x594479].scrollIntoView({ block: 'nearest' });
    return true;
  }
  if (_0x3889b1.key === 'ArrowUp') {
    (_0x3889b1.preventDefault(),
      (_0x594479 = _0x594479 > 0 ? _0x594479 - 1 : _0x3d1138.length - 1),
      _0x3d1138.forEach((_0x4faed8, _0x1d8764) =>
        _0x4faed8.classList.toggle('active', _0x1d8764 === _0x594479),
      ));
    if (_0x3d1138[_0x594479]) _0x3d1138[_0x594479].scrollIntoView({ block: 'nearest' });
    return true;
  }
  if (_0x3889b1.key === 'ArrowRight') {
    _0x3889b1.preventDefault();
    if (_0x594479 >= 0 && _0x3d1138[_0x594479]) {
      const _0x82c8d1 = document.querySelector(
        '.preset-slash-submenu[data-parent-item="' + _0x3d1138[_0x594479].dataset.itemId + '"]',
      );
      if (_0x82c8d1) activateSubMenu(_0x3d1138[_0x594479], _0x82c8d1);
    }
    return true;
  }
  if (_0x3889b1.key === 'Enter') {
    _0x3889b1.preventDefault();
    if (_0x594479 >= 0) {
      const _0x5ad4c8 = document.querySelector(
        '.preset-slash-submenu[data-parent-item="' + _0x3d1138[_0x594479].dataset.itemId + '"]',
      );
      if (_0x5ad4c8) activateSubMenu(_0x3d1138[_0x594479], _0x5ad4c8);
      else _0x3d1138[_0x594479].dispatchEvent(new MouseEvent('mousedown'));
    }
    return true;
  }
  if (_0x3889b1.key === 'Escape') return (_0x3889b1.preventDefault(), closeSlashMenu(), true);
  return false;
}
