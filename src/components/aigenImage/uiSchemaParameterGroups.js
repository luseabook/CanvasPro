import { escapeHtmlAttr } from './uiModuleModelHelpers.js';
export function renderParameterGroups(_0x42ed22, _0x295330, _0x1245e0, _0x9f89) {
  const _0x44579f = [],
    _0x4464ec = new Map();
  for (const _0x18ef0b of _0x42ed22) {
    const _0x21308a = String(_0x18ef0b['footerGroup']?.['id'] || '')['trim']();
    if (!_0x21308a) {
      _0x44579f['push']({ fields: [_0x18ef0b] });
      continue;
    }
    if (!_0x4464ec['has'](_0x21308a)) {
      const _0x36192d = {
        id: _0x21308a,
        label: _0x18ef0b['footerGroup']['label'] || '参数组',
        description: _0x18ef0b['footerGroup']['description'] || '',
        fields: [],
      };
      (_0x4464ec['set'](_0x21308a, _0x36192d), _0x44579f['push'](_0x36192d));
    }
    _0x4464ec['get'](_0x21308a)['fields']['push'](_0x18ef0b);
  }
  return _0x44579f['map']((_0x1716ba) => {
    if (!_0x1716ba['id']) return _0x9f89(_0x1716ba['fields'][0x0], _0x295330, _0x1245e0);
    const _0x570de9 = escapeHtmlAttr('parameter-group:' + _0x1716ba['id']),
      _0x4bcd6c = escapeHtmlAttr(_0x1716ba['label']),
      _0x418068 = _0x1716ba['description']
        ? '<span class="rh-tip ui-schema-info-tip" tabindex="0" data-tooltip="' +
          escapeHtmlAttr(_0x1716ba['description']) +
          '\x22\x20aria-label=\x22' +
          escapeHtmlAttr(_0x1716ba['description']) +
          '">!</span>'
        : '',
      _0x170454 = _0x1716ba['fields']
        ['map']((_0x2107c0) =>
          _0x9f89({ ..._0x2107c0, variant: 'groupRow' }, _0x295330, { ..._0x1245e0, variant: 'groupRow' }),
        )
        ['join']('');
    return (
      '<div\x20class=\x22ui-schema-pill-menu\x20ui-schema-parameter-group\x22\x20data-ui-schema-composite-field=\x22' +
      _0x570de9 +
      '">\n      <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
      _0x570de9 +
      '" aria-expanded="false" aria-haspopup="dialog"><span class="ui-schema-pill-label">' +
      _0x4bcd6c +
      '</span></button>\n      <div class="floating-menu ui-schema-popup ui-schema-parameter-group-menu" role="dialog" aria-label="' +
      _0x4bcd6c +
      '" aria-hidden="true"><div class="ui-schema-floating-menu-title">' +
      _0x4bcd6c +
      '\x20' +
      _0x418068 +
      '</div>' +
      _0x170454 +
      '</div>\x0a\x20\x20\x20\x20</div>'
    );
  })['join']('');
}
