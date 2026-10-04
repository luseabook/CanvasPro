function escapeHtmlAttr(item) {
  return String(item ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeHtmlText(key) {
  return String(key ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function normalizeOptions(index) {
  return (Array.isArray(index) ? index : []).map((disabled2) => {
    if (disabled2 && typeof disabled2 === 'object' && !Array.isArray(disabled2)) {
      const value2 = String(disabled2.value ?? '');
      return {
        value: value2,
        label: String(disabled2.label ?? value2),
        selectedLabel: String(disabled2.selectedLabel ?? disabled2.displayLabel ?? disabled2.label ?? value2),
        tooltip: String(disabled2.tooltip || '').trim(),
        disabled: disabled2.disabled === true,
        attrs: disabled2.attrs && typeof disabled2.attrs === 'object' ? disabled2.attrs : {},
      };
    }
    const value3 = String(disabled2 ?? '');
    return {
      value: value3,
      label: value3,
      selectedLabel: value3,
      tooltip: '',
      disabled: false,
      attrs: {},
    };
  });
}
function getSelectedOption(list, result) {
  const data = String(result ?? '');
  return list.find((el) => el.value === data) || list[0] || null;
}
function renderExtraAttrs(options2 = {}) {
  return Object.entries(options2)
    .map(([target, source]) => {
      const enabled = String(target || '').trim();
      if (!enabled) return '';
      if (source === false || source === null || source === undefined) return '';
      if (source === true) return ' ' + escapeHtmlAttr(enabled);
      return ' ' + escapeHtmlAttr(enabled) + '="' + escapeHtmlAttr(source) + '"';
    })
    .join('');
}
function renderCaret() {
  return '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';
}
export function renderToolbarUpMenu({
  fieldId: fieldId = '',
  value: value = '',
  options: options = [],
  wrapClass: wrapClass = 'v2-expand-wrap',
  buttonClass: buttonClass = 'v2-expand-toolbar-btn',
  triggerClass: triggerClass = '',
  labelClass: labelClass = '',
  menuClass: menuClass = 'v2-expand-menu',
  itemClass: itemClass = 'v2-expand-menu-item',
  openClass: openClass = 'open',
  title: title = '',
  iconHtml: iconHtml = '',
  selectedLabel: selectedLabel = '',
  disabled: disabled = false,
  itemsOnly: itemsOnly = false,
  itemValueAttrs: itemValueAttrs = [],
} = {}) {
  const next = String(fieldId || '').trim(),
    list2 = normalizeOptions(options),
    selectedOption = getSelectedOption(list2, value),
    current = String(selectedLabel || selectedOption?.selectedLabel || selectedOption?.label || value || ''),
    list3 = Array.isArray(itemValueAttrs) ? itemValueAttrs : [],
    entry = list2
      .map((el2) => {
        const record = el2.value === String(value ?? ''),
          payload = disabled || el2.disabled,
          handle = el2.tooltip
            ? ' title="' +
              escapeHtmlAttr(el2.tooltip) +
              '" data-tooltip="' +
              escapeHtmlAttr(el2.tooltip) +
              '"'
            : '',
          state = list3
            .map((item2) => {
              const config = String(item2 || '').trim();
              return config ? ' ' + escapeHtmlAttr(config) + '="' + escapeHtmlAttr(el2.value) + '"' : '';
            })
            .join('');
        return (
          '<div class="floating-menu-item image-toolbar-up-menu-item ' +
          escapeHtmlAttr(itemClass) +
          ' ' +
          (record ? 'active' : '') +
          ' ' +
          (payload ? 'disabled' : '') +
          '" data-toolbar-up-menu-item data-toolbar-up-menu-field="' +
          escapeHtmlAttr(next) +
          '" data-toolbar-up-menu-value="' +
          escapeHtmlAttr(el2.value) +
          '" data-toolbar-up-menu-label="' +
          escapeHtmlAttr(el2.selectedLabel) +
          '" data-disabled="' +
          (payload ? 'true' : 'false') +
          '"' +
          state +
          handle +
          renderExtraAttrs(el2.attrs) +
          '><span class="floating-menu-label">' +
          escapeHtmlText(el2.label) +
          '</span></div>'
        );
      })
      .join('');
  if (itemsOnly) return entry;
  const scope = disabled ? ' disabled aria-disabled="true"' : '',
    input = title ? ' title="' + escapeHtmlAttr(title) + '"' : '';
  return (
    '\n    <div class="' +
    escapeHtmlAttr(wrapClass) +
    ' image-toolbar-up-menu" data-toolbar-up-menu="' +
    escapeHtmlAttr(next) +
    '">\n      <button type="button" class="' +
    escapeHtmlAttr(buttonClass) +
    ' ' +
    escapeHtmlAttr(triggerClass) +
    ' image-toolbar-up-menu-toggle ' +
    (disabled ? 'is-disabled' : '') +
    '" data-toolbar-up-menu-toggle="' +
    escapeHtmlAttr(next) +
    '"' +
    input +
    scope +
    '>\n        ' +
    iconHtml +
    '\n        <span class="' +
    escapeHtmlAttr(labelClass) +
    ' image-toolbar-up-menu-label" data-toolbar-up-menu-label>' +
    escapeHtmlText(current) +
    '</span>\n        ' +
    renderCaret() +
    '\n      </button>\n      <div class="floating-menu image-toolbar-up-menu-menu ' +
    escapeHtmlAttr(menuClass) +
    '" data-toolbar-up-menu-menu="' +
    escapeHtmlAttr(next) +
    '" data-toolbar-up-menu-open-class="' +
    escapeHtmlAttr(openClass) +
    '">\n        ' +
    entry +
    '\n      </div>\n    </div>'
  );
}
function getMenuOpenClass(el3) {
  return String(el3?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
}
function closeMenu(el4) {
  if (!el4?.classList) return;
  (el4.classList.remove(getMenuOpenClass(el4)), el4.classList.remove('open'), el4.classList.remove('show'));
}
function closeSiblingMenus(el5, output = null) {
  el5?.querySelectorAll?.('[data-toolbar-up-menu-menu]')?.forEach((item3) => {
    if (item3 !== output) closeMenu(item3);
  });
}
function syncMenuSelection({ menu: menu, item: item4, value: value4 }) {
  if (!menu || !item4) return;
  menu.querySelectorAll?.('[data-toolbar-up-menu-item]')?.forEach((el6) => {
    el6.classList?.toggle?.('active', String(el6.dataset?.toolbarUpMenuValue ?? '') === String(value4 ?? ''));
  });
  const el7 = item4.closest?.('[data-toolbar-up-menu]'),
    el8 = el7?.querySelector?.('[data-toolbar-up-menu-label]');
  el8 &&
    (el8.textContent = String(item4.dataset?.toolbarUpMenuLabel || item4.textContent || value4 || '').trim());
}
export function bindToolbarUpMenus(el9, { onSelect: onSelect, onBeforeOpen: onBeforeOpen } = {}) {
  if (!el9?.addEventListener) return () => {};
  const value5 = (event) => {
    const fieldId2 = event.target?.closest?.('[data-toolbar-up-menu-toggle]');
    if (fieldId2 && el9.contains?.(fieldId2)) {
      if (fieldId2.disabled === true) return;
      event.stopPropagation?.();
      const el10 = fieldId2.closest?.('[data-toolbar-up-menu]'),
        menu2 = el10?.querySelector?.('[data-toolbar-up-menu-menu]');
      if (!menu2) return;
      const menuOpenClass = getMenuOpenClass(menu2),
        shouldOpen = !menu2.classList?.contains?.(menuOpenClass);
      (onBeforeOpen?.({
        fieldId: fieldId2.dataset?.toolbarUpMenuToggle || '',
        trigger: fieldId2,
        menu: menu2,
        shouldOpen: shouldOpen,
      }),
        closeSiblingMenus(el9, menu2),
        menu2.classList?.toggle?.(menuOpenClass, shouldOpen));
      return;
    }
    const item5 = event.target?.closest?.('[data-toolbar-up-menu-item]');
    if (!item5 || !el9.contains?.(item5)) return;
    if (item5.dataset?.disabled === 'true') return;
    event.stopPropagation?.();
    const menu3 = item5.closest?.('[data-toolbar-up-menu-menu]'),
      value6 = item5.dataset?.toolbarUpMenuValue || '';
    (syncMenuSelection({ menu: menu3, item: item5, value: value6 }),
      closeMenu(menu3),
      onSelect?.({
        fieldId: item5.dataset?.toolbarUpMenuField || '',
        value: value6,
        item: item5,
        menu: menu3,
        event: event,
      }));
  };
  return (el9.addEventListener('click', value5), () => el9.removeEventListener('click', value5));
}
