function escapeHtmlAttr(_0x2fec72) {
  return String(_0x2fec72 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeHtmlText(_0x181335) {
  return String(_0x181335 ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function normalizeOptions(_0x154a04) {
  return (Array.isArray(_0x154a04) ? _0x154a04 : []).map((_0x45e7ec) => {
    if (_0x45e7ec && typeof _0x45e7ec === 'object' && !Array.isArray(_0x45e7ec)) {
      const _0x1f12a4 = String(_0x45e7ec.value ?? '');
      return {
        value: _0x1f12a4,
        label: String(_0x45e7ec.label ?? _0x1f12a4),
        selectedLabel: String(
          _0x45e7ec.selectedLabel ?? _0x45e7ec.displayLabel ?? _0x45e7ec.label ?? _0x1f12a4,
        ),
        tooltip: String(_0x45e7ec.tooltip || '').trim(),
        disabled: _0x45e7ec.disabled === true,
        attrs: _0x45e7ec.attrs && typeof _0x45e7ec.attrs === 'object' ? _0x45e7ec.attrs : {},
      };
    }
    const _0x3b63cb = String(_0x45e7ec ?? '');
    return {
      value: _0x3b63cb,
      label: _0x3b63cb,
      selectedLabel: _0x3b63cb,
      tooltip: '',
      disabled: false,
      attrs: {},
    };
  });
}
function getSelectedOption(_0x47ad47, _0x51c4de) {
  const _0x5edfbc = String(_0x51c4de ?? '');
  return _0x47ad47.find((_0x5b9a26) => _0x5b9a26.value === _0x5edfbc) || _0x47ad47[0] || null;
}
function renderExtraAttrs(_0x431735 = {}) {
  return Object.entries(_0x431735)
    .map(([_0x5de76f, _0x2f43cd]) => {
      const _0x51fc08 = String(_0x5de76f || '').trim();
      if (!_0x51fc08) return '';
      if (_0x2f43cd === false || _0x2f43cd === null || _0x2f43cd === undefined) return '';
      if (_0x2f43cd === true) return ' ' + escapeHtmlAttr(_0x51fc08);
      return ' ' + escapeHtmlAttr(_0x51fc08) + '="' + escapeHtmlAttr(_0x2f43cd) + '"';
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
  const _0x445adf = String(fieldId || '').trim(),
    _0x27b1a2 = normalizeOptions(options),
    _0x812d9e = getSelectedOption(_0x27b1a2, value),
    _0x2a8e13 = String(selectedLabel || _0x812d9e?.selectedLabel || _0x812d9e?.label || value || ''),
    _0x162813 = Array.isArray(itemValueAttrs) ? itemValueAttrs : [],
    _0x2e639f = _0x27b1a2
      .map((_0x23a6a7) => {
        const _0xe82f6f = _0x23a6a7.value === String(value ?? ''),
          _0x2d701a = disabled || _0x23a6a7.disabled,
          _0x16af93 = _0x23a6a7.tooltip
            ? ' title="' +
              escapeHtmlAttr(_0x23a6a7.tooltip) +
              '" data-tooltip="' +
              escapeHtmlAttr(_0x23a6a7.tooltip) +
              '"'
            : '',
          _0xe16501 = _0x162813
            .map((_0x51229b) => {
              const _0x2724fd = String(_0x51229b || '').trim();
              return _0x2724fd
                ? ' ' + escapeHtmlAttr(_0x2724fd) + '="' + escapeHtmlAttr(_0x23a6a7.value) + '"'
                : '';
            })
            .join('');
        return (
          '<div class="floating-menu-item image-toolbar-up-menu-item ' +
          escapeHtmlAttr(itemClass) +
          ' ' +
          (_0xe82f6f ? 'active' : '') +
          ' ' +
          (_0x2d701a ? 'disabled' : '') +
          '" data-toolbar-up-menu-item data-toolbar-up-menu-field="' +
          escapeHtmlAttr(_0x445adf) +
          '" data-toolbar-up-menu-value="' +
          escapeHtmlAttr(_0x23a6a7.value) +
          '" data-toolbar-up-menu-label="' +
          escapeHtmlAttr(_0x23a6a7.selectedLabel) +
          '" data-disabled="' +
          (_0x2d701a ? 'true' : 'false') +
          '"' +
          _0xe16501 +
          _0x16af93 +
          renderExtraAttrs(_0x23a6a7.attrs) +
          '><span class="floating-menu-label">' +
          escapeHtmlText(_0x23a6a7.label) +
          '</span></div>'
        );
      })
      .join('');
  if (itemsOnly) return _0x2e639f;
  const _0x524585 = disabled ? ' disabled aria-disabled="true"' : '',
    _0x41cd09 = title ? ' title="' + escapeHtmlAttr(title) + '"' : '';
  return (
    '\n    <div class="' +
    escapeHtmlAttr(wrapClass) +
    ' image-toolbar-up-menu" data-toolbar-up-menu="' +
    escapeHtmlAttr(_0x445adf) +
    '">\n      <button type="button" class="' +
    escapeHtmlAttr(buttonClass) +
    ' ' +
    escapeHtmlAttr(triggerClass) +
    ' image-toolbar-up-menu-toggle ' +
    (disabled ? 'is-disabled' : '') +
    '" data-toolbar-up-menu-toggle="' +
    escapeHtmlAttr(_0x445adf) +
    '"' +
    _0x41cd09 +
    _0x524585 +
    '>\n        ' +
    iconHtml +
    '\n        <span class="' +
    escapeHtmlAttr(labelClass) +
    ' image-toolbar-up-menu-label" data-toolbar-up-menu-label>' +
    escapeHtmlText(_0x2a8e13) +
    '</span>\n        ' +
    renderCaret() +
    '\n      </button>\n      <div class="floating-menu image-toolbar-up-menu-menu ' +
    escapeHtmlAttr(menuClass) +
    '" data-toolbar-up-menu-menu="' +
    escapeHtmlAttr(_0x445adf) +
    '" data-toolbar-up-menu-open-class="' +
    escapeHtmlAttr(openClass) +
    '">\n        ' +
    _0x2e639f +
    '\n      </div>\n    </div>'
  );
}
function getMenuOpenClass(_0x170659) {
  return String(_0x170659?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
}
function closeMenu(_0x3ba971) {
  if (!_0x3ba971?.classList) return;
  (_0x3ba971.classList.remove(getMenuOpenClass(_0x3ba971)),
    _0x3ba971.classList.remove('open'),
    _0x3ba971.classList.remove('show'));
}
function closeSiblingMenus(_0x457624, _0x426959 = null) {
  _0x457624?.querySelectorAll?.('[data-toolbar-up-menu-menu]')?.forEach((_0x233c07) => {
    if (_0x233c07 !== _0x426959) closeMenu(_0x233c07);
  });
}
function syncMenuSelection({ menu: _0x44bc52, item: _0x5d3842, value: _0x9f2309 }) {
  if (!_0x44bc52 || !_0x5d3842) return;
  _0x44bc52.querySelectorAll?.('[data-toolbar-up-menu-item]')?.forEach((_0x21d13a) => {
    _0x21d13a.classList?.toggle?.(
      'active',
      String(_0x21d13a.dataset?.toolbarUpMenuValue ?? '') === String(_0x9f2309 ?? ''),
    );
  });
  const _0xdcd37c = _0x5d3842.closest?.('[data-toolbar-up-menu]'),
    _0x45d83f = _0xdcd37c?.querySelector?.('[data-toolbar-up-menu-label]');
  _0x45d83f &&
    (_0x45d83f.textContent = String(
      _0x5d3842.dataset?.toolbarUpMenuLabel || _0x5d3842.textContent || _0x9f2309 || '',
    ).trim());
}
export function bindToolbarUpMenus(_0x5b699d, { onSelect: _0x48212e, onBeforeOpen: _0x28447b } = {}) {
  if (!_0x5b699d?.addEventListener) return () => {};
  const _0x4ffefc = (_0x58e50a) => {
    const _0x43c98f = _0x58e50a.target?.closest?.('[data-toolbar-up-menu-toggle]');
    if (_0x43c98f && _0x5b699d.contains?.(_0x43c98f)) {
      if (_0x43c98f.disabled === true) return;
      _0x58e50a.stopPropagation?.();
      const _0x35e216 = _0x43c98f.closest?.('[data-toolbar-up-menu]'),
        _0x23e6c8 = _0x35e216?.querySelector?.('[data-toolbar-up-menu-menu]');
      if (!_0x23e6c8) return;
      const _0x3670c2 = getMenuOpenClass(_0x23e6c8),
        _0xb3027 = !_0x23e6c8.classList?.contains?.(_0x3670c2);
      (_0x28447b?.({
        fieldId: _0x43c98f.dataset?.toolbarUpMenuToggle || '',
        trigger: _0x43c98f,
        menu: _0x23e6c8,
        shouldOpen: _0xb3027,
      }),
        closeSiblingMenus(_0x5b699d, _0x23e6c8),
        _0x23e6c8.classList?.toggle?.(_0x3670c2, _0xb3027));
      return;
    }
    const _0xef0fe5 = _0x58e50a.target?.closest?.('[data-toolbar-up-menu-item]');
    if (!_0xef0fe5 || !_0x5b699d.contains?.(_0xef0fe5)) return;
    if (_0xef0fe5.dataset?.disabled === 'true') return;
    _0x58e50a.stopPropagation?.();
    const _0x556d8a = _0xef0fe5.closest?.('[data-toolbar-up-menu-menu]'),
      _0xcdc42d = _0xef0fe5.dataset?.toolbarUpMenuValue || '';
    (syncMenuSelection({ menu: _0x556d8a, item: _0xef0fe5, value: _0xcdc42d }),
      closeMenu(_0x556d8a),
      _0x48212e?.({
        fieldId: _0xef0fe5.dataset?.toolbarUpMenuField || '',
        value: _0xcdc42d,
        item: _0xef0fe5,
        menu: _0x556d8a,
        event: _0x58e50a,
      }));
  };
  return (
    _0x5b699d.addEventListener('click', _0x4ffefc),
    () => _0x5b699d.removeEventListener('click', _0x4ffefc)
  );
}
