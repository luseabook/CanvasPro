import {
  getSlashPromptPresetEntries,
  openCustomPresetsManager,
  shouldInsertPromptForPreset,
} from './promptPresets.js';
import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import { createSafeSvg, sanitizePromptHtml } from '../utils/dom.js';
function slashMenuText(value, item = {}) {
  return t('promptPresets.slash.' + value, item);
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
function _appendPresetIcon(el, enabled) {
  if (!el || !enabled) return;
  const key = String(enabled).trim();
  if (key.startsWith('<svg')) {
    const safeSvg = createSafeSvg(key);
    if (safeSvg) {
      (el.appendChild(safeSvg), el.appendChild(document.createTextNode(' ')));
      return;
    }
  }
  el.appendChild(document.createTextNode(String(enabled) + ' '));
}
function _getSlashPresetTriggerModeLabel(options = {}) {
  return shouldInsertPromptForPreset(options)
    ? t('promptPresets.triggerModes.insertPrompt')
    : t('promptPresets.triggerModes.direct');
}
function _isSelectableSlashPreset(options2 = {}) {
  return options2 && Object.prototype.hasOwnProperty.call(options2, 'template');
}
function _appendSlashPresetTriggerBadge(el2, index = {}) {
  if (!el2) return;
  const el3 = document.createElement('span');
  ((el3.className = 'preset-slash-trigger-badge'),
    (el3.textContent = _getSlashPresetTriggerModeLabel(index)),
    el2.appendChild(el3));
}
function _getSlashSubmenuPresetItems(el4) {
  return Array.from(el4?.querySelectorAll?.('.preset-slash-item') || []);
}
function _createSlashSubmenuItem({
  submenu: submenu,
  sub: sub,
  promptEl: promptEl,
  nodeId: nodeId,
  range: range,
  selection: selection,
  onGenerate: onGenerate,
}) {
  const el5 = document.createElement('div');
  el5.className = 'preset-slash-item has-desc';
  _isSelectableSlashPreset(sub) && el5.classList.add('has-trigger-badge');
  const el6 = document.createElement('div');
  el6.className = 'preset-slash-title-wrap';
  const el7 = document.createElement('div');
  el7.className = 'preset-slash-title';
  sub.icon && _appendPresetIcon(el7, sub.icon);
  el7.appendChild(document.createTextNode(sub.title || ''));
  const el8 = document.createElement('div');
  return (
    (el8.className = 'preset-slash-desc'),
    (el8.textContent = sub.desc || sub.template || ''),
    el6.appendChild(el7),
    el6.appendChild(el8),
    el5.appendChild(el6),
    _isSelectableSlashPreset(sub) && _appendSlashPresetTriggerBadge(el5, sub),
    el5.addEventListener('mouseenter', () => {
      (_getSlashSubmenuPresetItems(submenu).forEach((el9) => el9.classList.remove('active')),
        el5.classList.add('active'));
    }),
    el5.addEventListener('mousedown', (event) => {
      (event.preventDefault(),
        event.stopPropagation(),
        _selectPromptPreset({
          promptEl: promptEl,
          nodeId: nodeId,
          preset: sub,
          range: range,
          selection: selection,
          onGenerate: onGenerate,
        }));
    }),
    el5
  );
}
function _isSlashNodeConnected(el10) {
  if (!el10) return false;
  if (el10.isConnected === true) return true;
  if (typeof document === 'undefined') return true;
  return typeof document.body?.contains === 'function' ? document.body.contains(el10) : true;
}
function _clearSlashOutsideDocClick() {
  (_slashOutsideDocClickTimer && (clearTimeout(_slashOutsideDocClickTimer), (_slashOutsideDocClickTimer = 0)),
    _slashOutsideDocClick &&
      typeof document !== 'undefined' &&
      document.removeEventListener?.('mousedown', _slashOutsideDocClick),
    (_slashOutsideDocClick = null));
}
function _cleanupSlashMenuLifecycle() {
  const result = _slashPositionState?.onOpenChange;
  (_clearSlashOutsideDocClick(),
    _slashViewportUnsubscribe && (_slashViewportUnsubscribe(), (_slashViewportUnsubscribe = null)),
    (_slashPositionState = null),
    result?.(false));
}
function _getSlashAnchorRect(el11) {
  if (!el11 || typeof el11.getBoundingClientRect !== 'function' || !_isSlashNodeConnected(el11)) return null;
  return el11.getBoundingClientRect();
}
function _positionSlashSubmenu(el12, el13) {
  if (!el12 || !el13 || typeof el12.getBoundingClientRect !== 'function') return;
  const box = el12.getBoundingClientRect();
  el13.style.left = box.right + 6 + 'px';
  const count = window.innerHeight || document.documentElement?.clientHeight || 0,
    count2 = el13.offsetHeight || el13.getBoundingClientRect?.().height || 0;
  let data = box.top;
  (count > 0 && count2 > 0 && ((data = Math.min(data, count - count2 - 8)), (data = Math.max(8, data))),
    (el13.style.top = data + 'px'));
}
function _syncOpenSlashSubmenus() {
  const el14 = _slashPositionState?.menu || _slashMenuEl;
  if (!el14) return;
  document.querySelectorAll?.('.preset-slash-submenu').forEach((el15) => {
    if (!el15.classList?.contains('open')) return;
    const enabled2 = el15.dataset?.parentItem || '';
    if (!enabled2) return;
    const target = Array.from(el14.children || []).find((el16) => el16.dataset?.itemId === enabled2);
    _positionSlashSubmenu(target, el15);
  });
}
function _positionSlashMenu() {
  const enabled3 = _slashPositionState,
    el17 = enabled3?.menu;
  if (!enabled3 || !el17 || !el17.classList?.contains('open')) return;
  const box2 = _getSlashAnchorRect(enabled3.anchorEl);
  if (!box2) {
    closeSlashMenu();
    return;
  }
  const count3 = el17.offsetHeight || enabled3.menuHeight || 0x118;
  ((enabled3.menuHeight = count3),
    (el17.style.left = box2.left + 'px'),
    (el17.style.visibility = 'visible'),
    box2.top - count3 < 0
      ? ((el17.style.transformOrigin = 'top left'), (el17.style.top = box2.bottom + 8 + 'px'))
      : ((el17.style.transformOrigin = 'bottom left'), (el17.style.top = box2.top - count3 - 8 + 'px')),
    _syncOpenSlashSubmenus());
}
function _watchSlashViewport() {
  if (typeof appStore.subscribeSelector !== 'function') return;
  if (_slashViewportUnsubscribe) _slashViewportUnsubscribe();
  _slashViewportUnsubscribe = appStore.subscribeSelector(
    (source) => source.viewport,
    () => _positionSlashMenu(),
  );
}
function _bindSlashOutsideDocClick(enabled4) {
  (_clearSlashOutsideDocClick(),
    (_slashOutsideDocClick = (event2) => {
      const enabled5 = Array.from(document.querySelectorAll?.('.preset-slash-submenu') || []).some((item2) =>
        item2.contains?.(event2.target),
      );
      !enabled4.contains(event2.target) && !enabled5 && closeSlashMenu();
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
  const el18 = getSlashMenu();
  (el18.classList.remove('open'),
    document.querySelectorAll('.preset-slash-submenu').forEach((el19) => el19.remove()),
    el18.replaceChildren(),
    resetSubMenuState());
}
function _removeSlashTriggerText(next, current) {
  const el20 = next?.startContainer;
  if (!el20 || el20.nodeType !== Node.TEXT_NODE) return;
  const entry = el20.textContent,
    record = next.startOffset,
    payload = entry.lastIndexOf('/', record - 1);
  if (payload === -1) return;
  ((el20.textContent = entry.substring(0, payload) + entry.substring(record)),
    next.setStart(el20, payload),
    next.setEnd(el20, payload),
    current.removeAllRanges(),
    current.addRange(next));
}
function _selectPromptPreset({
  promptEl: promptEl2,
  nodeId: nodeId2,
  preset: preset,
  range: range2,
  selection: selection2,
  onGenerate: onGenerate2,
}) {
  (closeSlashMenu(),
    _removeSlashTriggerText(range2, selection2),
    promptEl2.querySelectorAll('.preset-pill').forEach((el21) => el21.remove()),
    appStore.updateNodeData(nodeId2, { prompt: sanitizePromptHtml(promptEl2.innerHTML) }),
    setTimeout(() => {
      onGenerate2?.(preset?.template, { insertPrompt: shouldInsertPromptForPreset(preset) });
    }, 50));
}
export function checkSlashTrigger(handle, args = {}) {
  if (handle?.inputType === 'insertCompositionText') return;
  const selection3 = window.getSelection();
  if (!selection3.rangeCount) return;
  const range3 = selection3.getRangeAt(0);
  if (range3.startContainer.nodeType !== Node.TEXT_NODE) {
    closeSlashMenu();
    return;
  }
  const list = range3.startContainer.textContent.slice(0, range3.startOffset),
    state = list.lastIndexOf('/');
  if (state === -1 || state !== list.length - 1) {
    closeSlashMenu();
    return;
  }
  return _renderSlashMenu({ ...args, range: range3, selection: selection3 });
}
export function openPromptPresetMenu(options3 = {}) {
  return _renderSlashMenu(options3);
}
function _renderSlashMenu({
  promptEl: promptEl3,
  nodeType: nodeType,
  nodeId: nodeId3,
  onGenerate: onGenerate3,
  range: range3 = null,
  selection: selection3 = null,
  anchorEl: anchorEl = null,
  placement: placement = 'auto-start',
  onOpenChange: onOpenChange = null,
  onPromptCommit: onPromptCommit = null,
}) {
  const list2 = getSlashPromptPresetEntries(nodeType),
    menu = getSlashMenu();
  (_cleanupSlashMenuLifecycle(),
    document.querySelectorAll('.preset-slash-submenu').forEach((el22) => el22.remove()),
    menu.replaceChildren());
  if (list2.length > 0) {
    const el23 = document.createElement('div');
    ((el23.className = 'preset-slash-header'),
      (el23.textContent = slashMenuText('header')),
      menu.appendChild(el23));
  }
  list2.forEach((preset2, count4) => {
    const el24 = document.createElement('div');
    el24.className = 'preset-slash-item has-desc' + (count4 === 0 ? ' active' : '');
    const config = 'slash-item-' + count4;
    el24.dataset.itemId = config;
    const el25 = document.createElement('div');
    el25.className = 'preset-slash-title-wrap';
    const el26 = document.createElement('div');
    el26.className = 'preset-slash-title';
    preset2.icon && _appendPresetIcon(el26, preset2.icon);
    el26.appendChild(document.createTextNode(preset2.title || ''));
    if (preset2.subItems) {
      const el27 = document.createElement('span');
      ((el27.className = 'preset-slash-title-arrow'), (el27.textContent = '>'), el26.appendChild(el27));
    }
    const el28 = document.createElement('div');
    ((el28.className = 'preset-slash-desc'),
      (el28.textContent = preset2.desc || preset2.template || slashMenuText('subItemsDesc')),
      el25.appendChild(el26),
      el25.appendChild(el28),
      el24.appendChild(el25));
    if (preset2.subItems && preset2.subItems.length > 0) {
      el24.style.overflow = 'visible';
      const submenu2 = document.createElement('div');
      ((submenu2.className = 'preset-slash-submenu'), (submenu2.dataset.parentItem = config));
      const el29 = document.createElement('div');
      ((el29.className = 'preset-slash-submenu-list'),
        preset2.subItems.forEach((sub2) => {
          el29.appendChild(
            _createSlashSubmenuItem({
              submenu: submenu2,
              sub: sub2,
              promptEl: promptEl3,
              nodeId: nodeId3,
              range: range3,
              selection: selection3,
              onGenerate: onGenerate3,
              onPromptCommit: onPromptCommit,
            }),
          );
        }),
        submenu2.appendChild(el29),
        document.body.appendChild(submenu2));
      let setTimeout2;
      (el24.addEventListener('mouseenter', () => {
        (Array.from(menu.children).forEach((el30) => el30.classList.remove('active')),
          el24.classList.add('active'),
          clearTimeout(setTimeout2),
          submenu2.classList.add('open'),
          _positionSlashSubmenu(el24, submenu2));
      }),
        el24.addEventListener('mouseleave', () => {
          setTimeout2 = setTimeout(() => {
            submenu2.classList.remove('open');
          }, 100);
        }),
        submenu2.addEventListener('mouseenter', () => {
          clearTimeout(setTimeout2);
        }),
        submenu2.addEventListener('mouseleave', () => {
          setTimeout2 = setTimeout(() => {
            submenu2.classList.remove('open');
          }, 100);
        }),
        el24.addEventListener('mousedown', (event3) => {
          (event3.preventDefault(), event3.stopPropagation());
        }));
    } else
      (_isSelectableSlashPreset(preset2) &&
        (el24.classList.add('has-trigger-badge'), _appendSlashPresetTriggerBadge(el24, preset2)),
        el24.addEventListener('mouseenter', () => {
          (Array.from(menu.children).forEach((el31) => el31.classList?.remove('active')),
            el24.classList.add('active'));
        }),
        el24.addEventListener('mousedown', (event4) => {
          (event4.preventDefault(),
            _selectPromptPreset({
              promptEl: promptEl3,
              nodeId: nodeId3,
              preset: preset2,
              range: range3,
              selection: selection3,
              onGenerate: onGenerate3,
              onPromptCommit: onPromptCommit,
            }));
        }));
    menu.appendChild(el24);
  });
  if (['ai-image', 'ai-text', 'ai-video', 'ai-audio'].includes(nodeType)) {
    const el32 = document.createElement('div');
    el32.className = 'preset-slash-item preset-slash-custom has-desc';
    list2.length === 0 && el32.classList.add('preset-slash-custom-first');
    const el33 = document.createElement('div');
    el33.className = 'preset-slash-title-wrap';
    const el34 = document.createElement('div');
    el34.className = 'preset-slash-title preset-slash-custom-header';
    const el35 = document.createElement('span');
    ((el35.className = 'preset-slash-custom-title'), (el35.textContent = slashMenuText('customTitle')));
    const el36 = document.createElement('span');
    ((el36.className = 'preset-slash-badge'),
      (el36.textContent = slashMenuText('customBadge')),
      el34.appendChild(el35),
      el34.appendChild(el36));
    const el37 = document.createElement('div');
    ((el37.className = 'preset-slash-desc'),
      (el37.textContent = slashMenuText('customDesc')),
      el33.appendChild(el34),
      el33.appendChild(el37),
      el32.appendChild(el33),
      el32.addEventListener('mousedown', (event5) => {
        (event5.preventDefault(), closeSlashMenu(), openCustomPresetsManager({ nodeType: nodeType }));
      }),
      menu.appendChild(el32));
  }
  ((menu.style.left = '-9999px'),
    (menu.style.top = '-9999px'),
    menu.classList.add('open'),
    (menu.style.visibility = 'hidden'),
    (_slashPositionState = {
      menu: menu,
      anchorEl: anchorEl || promptEl3.parentNode || promptEl3,
      placement: ['above-end', 'expanded-panel'].includes(placement) ? placement : 'auto-start',
      menuHeight: menu.offsetHeight || 0x118,
      onOpenChange: onOpenChange,
    }),
    _positionSlashMenu(),
    _watchSlashViewport(),
    _bindSlashOutsideDocClick(menu),
    onOpenChange?.(true));
}
function activateSubMenu(scope, el38) {
  const list3 = document.querySelectorAll('.preset-slash-submenu');
  (list3.forEach((el39) => {
    if (el39 !== el38) el39.classList.remove('open');
  }),
    el38.classList.add('open'),
    _positionSlashSubmenu(scope, el38));
  const list4 = _getSlashSubmenuPresetItems(el38);
  ((_subMenuState.activeSubmenu = el38),
    (_subMenuState.parentItem = scope),
    (_subMenuState.subItems = list4),
    (_subMenuState.subIndex = 0),
    list4.forEach((el40, count5) => el40.classList.toggle('active', count5 === 0)));
  if (list4[0]) list4[0].scrollIntoView({ block: 'nearest' });
}
function deactivateSubMenu() {
  if (_subMenuState.activeSubmenu) {
    _subMenuState.activeSubmenu.classList.remove('open');
    if (_subMenuState.parentItem) {
      const list5 = Array.from(_subMenuState.parentItem.parentNode.children).filter(
        (el41) => el41.classList && el41.classList.contains('preset-slash-item'),
      );
      (list5.forEach((el42) => el42.classList.remove('active')),
        _subMenuState.parentItem.classList.add('active'));
    }
    resetSubMenuState();
  }
}
export function handleSlashKeyboardNavigation(event6) {
  const el43 = getSlashMenu();
  if (!el43.classList.contains('open')) return false;
  if (_subMenuState.activeSubmenu) {
    const { subItems: subItems, subIndex: subIndex } = _subMenuState;
    if (event6.key === 'ArrowLeft') return (event6.preventDefault(), deactivateSubMenu(), true);
    if (event6.key === 'ArrowDown') {
      event6.preventDefault();
      const input = subIndex < subItems.length - 1 ? subIndex + 1 : 0;
      ((_subMenuState.subIndex = input),
        subItems.forEach((el44, output) => el44.classList.toggle('active', output === input)));
      if (subItems[input]) subItems[input].scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (event6.key === 'ArrowUp') {
      event6.preventDefault();
      const value2 = subIndex > 0 ? subIndex - 1 : subItems.length - 1;
      ((_subMenuState.subIndex = value2),
        subItems.forEach((el45, value3) => el45.classList.toggle('active', value3 === value2)));
      if (subItems[value2]) subItems[value2].scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (event6.key === 'Enter')
      return (
        event6.preventDefault(),
        subIndex >= 0 && subItems[subIndex] && subItems[subIndex].dispatchEvent(new MouseEvent('mousedown')),
        resetSubMenuState(),
        true
      );
    if (event6.key === 'Escape') return (event6.preventDefault(), deactivateSubMenu(), true);
    return false;
  }
  const list6 = Array.from(el43.children).filter(
    (el46) => el46.classList && el46.classList.contains('preset-slash-item'),
  );
  let count6 = list6.findIndex((el47) => el47.classList.contains('active'));
  if (event6.key === 'ArrowDown') {
    (event6.preventDefault(),
      (count6 = count6 < list6.length - 1 ? count6 + 1 : 0),
      list6.forEach((el48, value4) => el48.classList.toggle('active', value4 === count6)));
    if (list6[count6]) list6[count6].scrollIntoView({ block: 'nearest' });
    return true;
  }
  if (event6.key === 'ArrowUp') {
    (event6.preventDefault(),
      (count6 = count6 > 0 ? count6 - 1 : list6.length - 1),
      list6.forEach((el49, value5) => el49.classList.toggle('active', value5 === count6)));
    if (list6[count6]) list6[count6].scrollIntoView({ block: 'nearest' });
    return true;
  }
  if (event6.key === 'ArrowRight') {
    event6.preventDefault();
    if (count6 >= 0 && list6[count6]) {
      const value6 = document.querySelector(
        '.preset-slash-submenu[data-parent-item="' + list6[count6].dataset.itemId + '"]',
      );
      if (value6) activateSubMenu(list6[count6], value6);
    }
    return true;
  }
  if (event6.key === 'Enter') {
    event6.preventDefault();
    if (count6 >= 0) {
      const value7 = document.querySelector(
        '.preset-slash-submenu[data-parent-item="' + list6[count6].dataset.itemId + '"]',
      );
      if (value7) activateSubMenu(list6[count6], value7);
      else list6[count6].dispatchEvent(new MouseEvent('mousedown'));
    }
    return true;
  }
  if (event6.key === 'Escape') return (event6.preventDefault(), closeSlashMenu(), true);
  return false;
}
