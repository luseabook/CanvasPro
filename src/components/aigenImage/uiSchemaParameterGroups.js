import { escapeHtmlAttr } from './uiModuleModelHelpers.js';
export function renderParameterGroups(fields, context, renderContext, renderField) {
  const groups = [],
    groupsById = new Map();
  for (const field of fields) {
    const groupId = String(field['footerGroup']?.['id'] || '')['trim']();
    if (!groupId) {
      groups['push']({ fields: [field] });
      continue;
    }
    if (!groupsById['has'](groupId)) {
      const group = {
        id: groupId,
        label: field['footerGroup']['label'] || '参数组',
        description: field['footerGroup']['description'] || '',
        fields: [],
      };
      (groupsById['set'](groupId, group), groups['push'](group));
    }
    groupsById['get'](groupId)['fields']['push'](field);
  }
  return groups['map']((group) => {
    if (!group['id']) return renderField(group['fields'][0], context, renderContext);
    const menuTriggerId = escapeHtmlAttr('parameter-group:' + group['id']),
      labelHtml = escapeHtmlAttr(group['label']),
      infoHtml = group['description']
        ? '<span class="rh-tip ui-schema-info-tip" tabindex="0" data-tooltip="' +
          escapeHtmlAttr(group['description']) +
          '" aria-label="' +
          escapeHtmlAttr(group['description']) +
          '">!</span>'
        : '',
      fieldsHtml = group['fields']
        ['map']((field) =>
          renderField({ ...field, variant: 'groupRow' }, context, { ...renderContext, variant: 'groupRow' }),
        )
        ['join']('');
    return (
      '<div class="ui-schema-pill-menu ui-schema-parameter-group" data-ui-schema-composite-field="' +
      menuTriggerId +
      '">\n      <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
      menuTriggerId +
      '" aria-expanded="false" aria-haspopup="dialog"><span class="ui-schema-pill-label">' +
      labelHtml +
      '</span></button>\n      <div class="floating-menu ui-schema-popup ui-schema-parameter-group-menu" role="dialog" aria-label="' +
      labelHtml +
      '" aria-hidden="true"><div class="ui-schema-floating-menu-title">' +
      labelHtml +
      ' ' +
      infoHtml +
      '</div>' +
      fieldsHtml +
      '</div>\n    </div>'
    );
  })['join']('');
}
