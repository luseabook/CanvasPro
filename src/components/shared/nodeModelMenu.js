import { translateManifestText } from '../../i18n/manifestText.js';
const RIGHT_CHEVRON_HTML =
  '<svg class="node-menu-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
export function escapeNodeMenuHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function renderBadge(el = {}) {
  if (el.badgeHtml) return el.badgeHtml;
  if (el.vip) return '<span class="floating-menu-badge floating-menu-badge-warning">VIP</span>';
  if (el.disabled)
    return (
      '<span class="floating-menu-badge floating-menu-badge-danger">' +
      escapeNodeMenuHtml(translateManifestText('不可用')) +
      '</span>'
    );
  return '';
}
function renderIcon(enabled = {}, item = 20) {
  if (enabled.iconHtml) return enabled.iconHtml;
  if (!enabled.icon) return '';
  const count = Number(item) || 20,
    key = count <= 12 ? 'node-menu-icon-small' : 'node-menu-icon';
  return (
    '<img src="' +
    escapeNodeMenuHtml(enabled.icon) +
    '" class="' +
    key +
    '" alt="' +
    escapeNodeMenuHtml(enabled.iconAlt || enabled.label || '') +
    '">'
  );
}
function attrsFromObject(options = {}) {
  return Object.entries(options)
    .filter(([, index]) => index !== undefined && index !== null && index !== false)
    .map(([result, data]) =>
      data === true
        ? ' ' + escapeNodeMenuHtml(result)
        : ' ' + escapeNodeMenuHtml(result) + '="' + escapeNodeMenuHtml(data) + '"',
    )
    .join('');
}
export function renderNodeMenuItem(el2 = {}, target = {}) {
  const source = String(target.activeModel || ''),
    enabled2 = String(el2.modelId ?? el2.value ?? ''),
    next = String(el2.provider ?? ''),
    current =
      el2.active === true ||
      (!!enabled2 && source === enabled2) ||
      (Array.isArray(el2.aliases) && el2.aliases.includes(source)),
    entry = [
      'floating-menu-item',
      'node-menu-item',
      el2.className || '',
      current ? 'active' : '',
      el2.disabled ? 'disabled' : '',
    ]
      .filter(Boolean)
      .join(' '),
    record = {
      'data-value': enabled2 || undefined,
      'data-provider': next || undefined,
      'data-disabled': el2.disabledValue || (el2.disabled ? 'true' : undefined),
      ...el2.attrs,
    },
    escapeNodeMenuHtml2 = escapeNodeMenuHtml(translateManifestText(el2.label ?? enabled2)),
    translateManifestText2 = translateManifestText(el2.subtitle || el2.description || '');
  return (
    '<div class="' +
    entry +
    '"' +
    attrsFromObject(record) +
    '>\n    ' +
    renderIcon(el2) +
    '\n    <div class="fmi-content">\n      <div class="fmi-title">' +
    escapeNodeMenuHtml2 +
    '</div>\n      ' +
    (translateManifestText2
      ? '<div class="fmi-sub">' + escapeNodeMenuHtml(translateManifestText2) + '</div>'
      : '') +
    '\n    </div>\n    ' +
    renderBadge(el2) +
    '\n  </div>'
  );
}
export function renderNodeMenuGroup(args = {}, payload = {}) {
  const handle = String(args.id || '').trim(),
    state = args.submenuClass || handle + '-submenu',
    config = args.headerClass || handle + '-group-header',
    scope = args.toggleAttr || 'data-' + handle + '-toggle',
    input = [config, 'floating-menu-item', 'node-menu-group-header', args.className || '']
      .filter(Boolean)
      .join(' '),
    output = { [scope]: true, 'data-node-menu-submenu': '.' + state, ...args.attrs },
    value2 =
      args.itemsHtml ||
      (Array.isArray(args.items)
        ? args.items.map((item2) => renderNodeMenuItem(item2, payload)).join('')
        : '');
  return (
    '\n    <div class="' +
    input +
    '"' +
    attrsFromObject(output) +
    '>\n      ' +
    renderIcon(args) +
    '\n      <div class="fmi-content">\n        <div class="fmi-title">' +
    escapeNodeMenuHtml(translateManifestText(args.label || handle)) +
    '</div>\n        ' +
    (args.subtitle
      ? '<div class="fmi-sub">' + escapeNodeMenuHtml(translateManifestText(args.subtitle)) + '</div>'
      : '') +
    '\n      </div>\n      ' +
    renderBadge(args) +
    '\n      ' +
    (args.chevron === false ? '' : RIGHT_CHEVRON_HTML) +
    '\n    </div>\n    <div class="node-model-submenu node-menu-submenu ' +
    escapeNodeMenuHtml(state) +
    '">\n      ' +
    value2 +
    '\n    </div>'
  );
}
export function renderNodeModelMenu(options2 = {}) {
  const activeModel = String(options2.activeModel || ''),
    list = Array.isArray(options2.groups) ? options2.groups : [],
    list2 = Array.isArray(options2.items) ? options2.items : [],
    value3 = [
      ...list2.map((item3) => renderNodeMenuItem(item3, { activeModel: activeModel })),
      ...list.map((item4) => renderNodeMenuGroup(item4, { activeModel: activeModel })),
    ].join(''),
    value4 = ['floating-menu', 'img-model-menu', 'node-model-menu', options2.className || '']
      .filter(Boolean)
      .join(' ');
  return (
    '<div class="' +
    value4 +
    '" data-node-menu-kind="' +
    escapeNodeMenuHtml(options2.kind || '') +
    '">' +
    value3 +
    '</div>'
  );
}
export function renderNodeModelTrigger({
  iconHtml: iconHtml = '',
  label: label = '',
  className: className = '',
  caretHtml: caretHtml = '',
} = {}) {
  const value5 = ['img-pill-btn', 'img-model-btn-trigger', 'node-model-trigger', className]
    .filter(Boolean)
    .join(' ');
  return (
    '<button type="button" class="' +
    value5 +
    '">\n    ' +
    iconHtml +
    '\n    <span class="img-model-label">' +
    escapeNodeMenuHtml(label) +
    '</span>\n    ' +
    caretHtml +
    '\n  </button>'
  );
}
