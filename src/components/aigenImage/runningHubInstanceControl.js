export function renderRunningHubInstanceControl(
  _0x1e4db9,
  _0x4496fd,
  {
    escapeHtmlAttr: _0x119be3,
    getFieldValue: _0x453d1a,
    isOptionHidden: _0x9d31ca,
    manifestText: _0x9043bd,
    renderDropdownControl: _0x3111c5,
  },
) {
  const _0x2101fd = String(_0x1e4db9?.['id'] || '')['trim'](),
    _0x5bb708 = String(_0x453d1a(_0x4496fd, _0x1e4db9) || _0x1e4db9?.['defaultValue'] || ''),
    _0x591891 = (Array['isArray'](_0x1e4db9?.['options']) ? _0x1e4db9['options'] : [])['filter'](
      (_0x490316) => !_0x9d31ca(_0x490316, _0x4496fd),
    ),
    _0x305d0c = Math['max'](
      0x0,
      _0x591891['findIndex']((_0x13fdd7) => String(_0x13fdd7?.['value'] ?? _0x13fdd7) === _0x5bb708),
    ),
    _0x40e404 = _0x591891[_0x305d0c] || _0x591891[0x0] || {},
    _0x10ea56 = _0x591891[(_0x305d0c + 0x1) % Math['max'](0x1, _0x591891['length'])] || _0x40e404,
    _0x38cc39 = Array['isArray'](_0x1e4db9?.['developerOptions'])
      ? _0x1e4db9['developerOptions']['filter']((_0x5c19c4) => !_0x9d31ca(_0x5c19c4, _0x4496fd))
      : [],
    _0x44c32d = _0x591891['map']((_0x33aa62) => ({
      value: String(_0x33aa62?.['value'] ?? _0x33aa62),
      label: _0x9043bd(_0x33aa62?.['label'] ?? _0x33aa62?.['value'] ?? _0x33aa62),
    })),
    _0x99dc71 = _0x38cc39['map']((_0x424566) => String(_0x424566?.['value'] ?? _0x424566)),
    _0x497677 = _0x44c32d['some'](
      (_0x363829) => _0x363829['value'] === String(_0x1e4db9?.['defaultValue'] ?? ''),
    )
      ? String(_0x1e4db9?.['defaultValue'] ?? '')
      : _0x44c32d[0x0]?.['value'] || 'default',
    _0x574129 = { ..._0x1e4db9, options: [..._0x591891, ..._0x38cc39], developerOptions: [] },
    _0x27e911 = _0x38cc39['length']
      ? '<div class="ui-schema-instance-developer-control">' +
        _0x3111c5(_0x574129, _0x5bb708, _0x4496fd, {
          titleHtml:
            '<div class="floating-menu-title ui-schema-floating-menu-title">' +
            _0x119be3(_0x9043bd(_0x1e4db9?.['label'] || '显存')) +
            '</div>',
        }) +
        '</div>'
      : '';
  return (
    '<div\x20class=\x22ui-schema-field\x20rh-vram-wrap\x20ui-schema-instance-toggle\x22\x20data-ui-schema-field=\x22' +
    _0x119be3(_0x2101fd) +
    '\x22\x20data-ui-schema-type=\x22segmented\x22\x20data-ui-schema-default=\x22' +
    _0x119be3(_0x1e4db9?.['defaultValue'] ?? '') +
    '" data-ui-schema-normal-default="' +
    _0x119be3(_0x497677) +
    '" data-ui-schema-developer-mode="' +
    (globalThis['window']?.['DEV_MODE'] === !![] && _0x38cc39['length'] ? 'true' : 'false') +
    '" data-ui-schema-normal-options="' +
    _0x119be3(JSON['stringify'](_0x44c32d)) +
    '" data-ui-schema-developer-values="' +
    _0x119be3(JSON['stringify'](_0x99dc71)) +
    '">\n    <button type="button" class="img-pill-btn rh-vram-btn ui-schema-instance-normal-control" data-ui-schema-value="' +
    _0x119be3(_0x10ea56?.['value'] ?? _0x10ea56) +
    '">\n      <span class="rh-vram-label ui-schema-pill-label">' +
    _0x119be3(_0x40e404?.['label'] ?? _0x40e404?.['value'] ?? _0x5bb708) +
    '</span>\n    </button>\n    ' +
    _0x27e911 +
    '\n  </div>'
  );
}
export function syncRunningHubInstanceControl(_0x1f9ede, _0x5d7d61) {
  if (!_0x1f9ede?.['classList']?.['contains']('ui-schema-instance-toggle')) return;
  let _0x1925e5 = [];
  try {
    _0x1925e5 = JSON['parse'](_0x1f9ede['dataset']['uiSchemaNormalOptions'] || '[]');
  } catch {
    _0x1925e5 = [];
  }
  const _0x4f9401 = _0x1925e5['findIndex'](
      (_0x47b594) => String(_0x47b594?.['value'] ?? '') === String(_0x5d7d61 ?? ''),
    ),
    _0x24a47f = _0x4f9401 >= 0x0 ? _0x4f9401 : 0x0,
    _0x31b2e8 = _0x1925e5[_0x24a47f] || {},
    _0x44d9b7 = _0x1925e5[(_0x24a47f + 0x1) % Math['max'](0x1, _0x1925e5['length'])] || _0x31b2e8,
    _0x1ec8cc = _0x1f9ede['querySelector']('.ui-schema-instance-normal-control .ui-schema-pill-label');
  if (_0x1ec8cc) _0x1ec8cc['textContent'] = _0x31b2e8?.['label'] || '24G';
  const _0x5682b7 = _0x1f9ede['querySelector']('.ui-schema-instance-normal-control[data-ui-schema-value]');
  if (_0x5682b7) _0x5682b7['dataset']['uiSchemaValue'] = _0x44d9b7?.['value'] || 'default';
  const _0x1c3044 = Array['from'](
      _0x1f9ede['querySelectorAll'](
        '.ui-schema-instance-developer-control .floating-menu-item[data-ui-schema-value]',
      ),
    )['find'](
      (_0x31234f) => String(_0x31234f?.['dataset']?.['uiSchemaValue'] || '') === String(_0x5d7d61 ?? ''),
    ),
    _0x383431 = _0x1f9ede['querySelector'](
      '.ui-schema-instance-developer-control .ui-schema-menu-trigger .ui-schema-pill-label',
    );
  _0x383431 &&
    (_0x383431['textContent'] =
      _0x1c3044?.['dataset']?.['uiSchemaOptionLabel'] ||
      _0x1c3044?.['textContent']?.['trim']?.() ||
      _0x31b2e8?.['label'] ||
      '24G');
}
