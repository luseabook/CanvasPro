export function renderRunningHubInstanceControl(
  args,
  value,
  {
    escapeHtmlAttr: escapeHtmlAttr,
    getFieldValue: getFieldValue,
    isOptionHidden: isOptionHidden,
    manifestText: manifestText,
    renderDropdownControl: renderDropdownControl,
  },
) {
  const item = String(args?.['id'] || '')['trim'](),
    key = String(getFieldValue(value, args) || args?.['defaultValue'] || ''),
    list = (Array['isArray'](args?.['options']) ? args['options'] : [])['filter'](
      (index) => !isOptionHidden(index, value),
    ),
    result = Math['max'](
      0,
      list['findIndex']((el) => String(el?.['value'] ?? el) === key),
    ),
    el2 = list[result] || list[0] || {},
    el3 = list[(result + 1) % Math['max'](1, list['length'])] || el2,
    list2 = Array['isArray'](args?.['developerOptions'])
      ? args['developerOptions']['filter']((data) => !isOptionHidden(data, value))
      : [],
    list3 = list['map']((el4) => ({
      value: String(el4?.['value'] ?? el4),
      label: manifestText(el4?.['label'] ?? el4?.['value'] ?? el4),
    })),
    options = list2['map']((el5) => String(el5?.['value'] ?? el5)),
    target = list3['some']((el6) => el6['value'] === String(args?.['defaultValue'] ?? ''))
      ? String(args?.['defaultValue'] ?? '')
      : list3[0]?.['value'] || 'default',
    source = { ...args, options: [...list, ...list2], developerOptions: [] },
    next = list2['length']
      ? '<div class="ui-schema-instance-developer-control">' +
        renderDropdownControl(source, key, value, {
          titleHtml:
            '<div class="floating-menu-title ui-schema-floating-menu-title">' +
            escapeHtmlAttr(manifestText(args?.['label'] || '显存')) +
            '</div>',
        }) +
        '</div>'
      : '';
  return (
    '<div class="ui-schema-field rh-vram-wrap ui-schema-instance-toggle" data-ui-schema-field="' +
    escapeHtmlAttr(item) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(args?.['defaultValue'] ?? '') +
    '" data-ui-schema-normal-default="' +
    escapeHtmlAttr(target) +
    '" data-ui-schema-developer-mode="' +
    (globalThis['window']?.['DEV_MODE'] === !![] && list2['length'] ? 'true' : 'false') +
    '" data-ui-schema-normal-options="' +
    escapeHtmlAttr(JSON['stringify'](list3)) +
    '" data-ui-schema-developer-values="' +
    escapeHtmlAttr(JSON['stringify'](options)) +
    '">\n    <button type="button" class="img-pill-btn rh-vram-btn ui-schema-instance-normal-control" data-ui-schema-value="' +
    escapeHtmlAttr(el3?.['value'] ?? el3) +
    '">\n      <span class="rh-vram-label ui-schema-pill-label">' +
    escapeHtmlAttr(el2?.['label'] ?? el2?.['value'] ?? key) +
    '</span>\n    </button>\n    ' +
    next +
    '\n  </div>'
  );
}
export function syncRunningHubInstanceControl(el7, current) {
  if (!el7?.['classList']?.['contains']('ui-schema-instance-toggle')) return;
  let list4 = [];
  try {
    list4 = JSON['parse'](el7['dataset']['uiSchemaNormalOptions'] || '[]');
  } catch {
    list4 = [];
  }
  const count = list4['findIndex']((el8) => String(el8?.['value'] ?? '') === String(current ?? '')),
    entry = count >= 0 ? count : 0,
    record = list4[entry] || {},
    el9 = list4[(entry + 1) % Math['max'](1, list4['length'])] || record,
    el10 = el7['querySelector']('.ui-schema-instance-normal-control .ui-schema-pill-label');
  if (el10) el10['textContent'] = record?.['label'] || '24G';
  const el11 = el7['querySelector']('.ui-schema-instance-normal-control[data-ui-schema-value]');
  if (el11) el11['dataset']['uiSchemaValue'] = el9?.['value'] || 'default';
  const el12 = Array['from'](
      el7['querySelectorAll'](
        '.ui-schema-instance-developer-control .floating-menu-item[data-ui-schema-value]',
      ),
    )['find']((el13) => String(el13?.['dataset']?.['uiSchemaValue'] || '') === String(current ?? '')),
    el14 = el7['querySelector'](
      '.ui-schema-instance-developer-control .ui-schema-menu-trigger .ui-schema-pill-label',
    );
  el14 &&
    (el14['textContent'] =
      el12?.['dataset']?.['uiSchemaOptionLabel'] ||
      el12?.['textContent']?.['trim']?.() ||
      record?.['label'] ||
      '24G');
}
