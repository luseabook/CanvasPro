import { translateManifestText } from '../../i18n/manifestText.js';
const RIGHT_CHEVRON_HTML =
  '<svg class="node-menu-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
export function escapeNodeMenuHtml(_0x1e61fb) {
  return String(_0x1e61fb ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function renderBadge(_0x278096 = {}) {
  if (_0x278096.badgeHtml) return _0x278096.badgeHtml;
  if (_0x278096.vip) return '<span class="floating-menu-badge floating-menu-badge-warning">VIP</span>';
  if (_0x278096.disabled)
    return (
      '<span class="floating-menu-badge floating-menu-badge-danger">' +
      escapeNodeMenuHtml(translateManifestText('不可用')) +
      '</span>'
    );
  return '';
}
function renderIcon(_0x2cb706 = {}, _0x5ab62a = 20) {
  if (_0x2cb706.iconHtml) return _0x2cb706.iconHtml;
  if (!_0x2cb706.icon) return '';
  const _0x1bf515 = Number(_0x5ab62a) || 20,
    _0x4c327d = _0x1bf515 <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return (
    '<img src="' +
    escapeNodeMenuHtml(_0x2cb706.icon) +
    '" class="' +
    _0x4c327d +
    '" alt="' +
    escapeNodeMenuHtml(_0x2cb706.iconAlt || _0x2cb706.label || '') +
    '">'
  );
}
function attrsFromObject(_0x2d9963 = {}) {
  return Object.entries(_0x2d9963)
    .filter(([, _0x2a6de3]) => _0x2a6de3 !== undefined && _0x2a6de3 !== null && _0x2a6de3 !== false)
    .map(([_0x2b9a79, _0x3a537c]) =>
      _0x3a537c === true
        ? ' ' + escapeNodeMenuHtml(_0x2b9a79)
        : ' ' + escapeNodeMenuHtml(_0x2b9a79) + '="' + escapeNodeMenuHtml(_0x3a537c) + '"',
    )
    .join('');
}
export function renderNodeMenuItem(_0x5e5000 = {}, _0x43265d = {}) {
  const _0x28f174 = String(_0x43265d.activeModel || ''),
    _0x47e55b = String(_0x5e5000.modelId ?? _0x5e5000.value ?? ''),
    _0x45dbdb = String(_0x5e5000.provider ?? ''),
    _0x5d80e8 =
      _0x5e5000.active === true ||
      (!!_0x47e55b && _0x28f174 === _0x47e55b) ||
      (Array.isArray(_0x5e5000.aliases) && _0x5e5000.aliases.includes(_0x28f174)),
    _0x437178 = [
      'floating-menu-item',
      'node-menu-item',
      _0x5e5000.className || '',
      _0x5d80e8 ? 'active' : '',
      _0x5e5000.disabled ? 'disabled' : '',
    ]
      .filter(Boolean)
      .join(' '),
    _0x2d2c63 = {
      'data-value': _0x47e55b || undefined,
      'data-provider': _0x45dbdb || undefined,
      'data-disabled': _0x5e5000.disabledValue || (_0x5e5000.disabled ? 'true' : undefined),
      ..._0x5e5000.attrs,
    },
    _0x2dc759 = escapeNodeMenuHtml(translateManifestText(_0x5e5000.label ?? _0x47e55b)),
    _0xfb7867 = translateManifestText(_0x5e5000.subtitle || _0x5e5000.description || '');
  return (
    '<div class="' +
    _0x437178 +
    '"' +
    attrsFromObject(_0x2d2c63) +
    '>\n    ' +
    renderIcon(_0x5e5000) +
    '\n    <div class="fmi-content">\n      <div class="fmi-title">' +
    _0x2dc759 +
    '</div>\n      ' +
    (_0xfb7867 ? '<div class="fmi-sub">' + escapeNodeMenuHtml(_0xfb7867) + '</div>' : '') +
    '\n    </div>\n    ' +
    renderBadge(_0x5e5000) +
    '\n  </div>'
  );
}
export function renderNodeMenuGroup(_0x34a4ae = {}, _0xe7a5c2 = {}) {
  const _0x4dee0d = String(_0x34a4ae.id || '').trim(),
    _0x4b6ed2 = _0x34a4ae.submenuClass || _0x4dee0d + '-submenu',
    _0x5df764 = _0x34a4ae.headerClass || _0x4dee0d + '-group-header',
    _0x4cf9ee = _0x34a4ae.toggleAttr || 'data-' + _0x4dee0d + '-toggle',
    _0xeca88b = [_0x5df764, 'floating-menu-item', 'node-menu-group-header', _0x34a4ae.className || '']
      .filter(Boolean)
      .join(' '),
    _0x531b5d = { [_0x4cf9ee]: true, 'data-node-menu-submenu': '.' + _0x4b6ed2, ..._0x34a4ae.attrs },
    _0x34c6f0 =
      _0x34a4ae.itemsHtml ||
      (Array.isArray(_0x34a4ae.items)
        ? _0x34a4ae.items.map((_0x253778) => renderNodeMenuItem(_0x253778, _0xe7a5c2)).join('')
        : '');
  return (
    '\n    <div class="' +
    _0xeca88b +
    '"' +
    attrsFromObject(_0x531b5d) +
    '>\n      ' +
    renderIcon(_0x34a4ae) +
    '\n      <div class="fmi-content">\n        <div class="fmi-title">' +
    escapeNodeMenuHtml(translateManifestText(_0x34a4ae.label || _0x4dee0d)) +
    '</div>\n        ' +
    (_0x34a4ae.subtitle
      ? '<div class="fmi-sub">' + escapeNodeMenuHtml(translateManifestText(_0x34a4ae.subtitle)) + '</div>'
      : '') +
    '\n      </div>\n      ' +
    renderBadge(_0x34a4ae) +
    '\n      ' +
    (_0x34a4ae.chevron === false ? '' : RIGHT_CHEVRON_HTML) +
    '\n    </div>\n    <div class="node-model-submenu node-menu-submenu ' +
    escapeNodeMenuHtml(_0x4b6ed2) +
    '">\n      ' +
    _0x34c6f0 +
    '\n    </div>'
  );
}
export function renderNodeModelMenu(_0xd8db0d = {}) {
  const _0x1761ee = String(_0xd8db0d.activeModel || ''),
    _0x4f1fce = Array.isArray(_0xd8db0d.groups) ? _0xd8db0d.groups : [],
    _0x2d2719 = Array.isArray(_0xd8db0d.items) ? _0xd8db0d.items : [],
    _0x12f4bc = [
      ..._0x2d2719.map((_0x3ecb34) => renderNodeMenuItem(_0x3ecb34, { activeModel: _0x1761ee })),
      ..._0x4f1fce.map((_0x39a637) => renderNodeMenuGroup(_0x39a637, { activeModel: _0x1761ee })),
    ].join(''),
    _0x304a87 = ['floating-menu', 'img-model-menu', 'node-model-menu', _0xd8db0d.className || '']
      .filter(Boolean)
      .join(' ');
  return (
    '<div class="' +
    _0x304a87 +
    '" data-node-menu-kind="' +
    escapeNodeMenuHtml(_0xd8db0d.kind || '') +
    '">' +
    _0x12f4bc +
    '</div>'
  );
}
export function renderNodeModelTrigger({
  iconHtml: iconHtml = '',
  label: label = '',
  className: className = '',
  caretHtml: caretHtml = '',
} = {}) {
  const _0x47f3f8 = ['img-pill-btn', 'img-model-btn-trigger', 'node-model-trigger', className]
    .filter(Boolean)
    .join(' ');
  return (
    '<button type="button" class="' +
    _0x47f3f8 +
    '">\n    ' +
    iconHtml +
    '\n    <span class="img-model-label">' +
    escapeNodeMenuHtml(label) +
    '</span>\n    ' +
    caretHtml +
    '\n  </button>'
  );
}
