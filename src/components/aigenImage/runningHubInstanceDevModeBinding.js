export function bindRunningHubInstanceDevMode(
  _0x33142,
  { commitValue: _0x2e1103, getNodeData: _0x3b846d, getNodeFieldValue: _0x5114a8 },
) {
  const _0x2c1483 = _0x33142?.['ownerDocument']?.['defaultView'] || globalThis['window'],
    _0x1f66d5 = (_0x43a273) => {
      const _0x5c5a21 = _0x43a273?.['detail']?.['enabled'] === !![];
      _0x33142?.['querySelectorAll']?.('.ui-schema-instance-toggle[data-ui-schema-developer-values]')?.[
        'forEach'
      ]?.((_0x1048fe) => {
        let _0x33038a = [];
        try {
          _0x33038a = JSON['parse'](_0x1048fe['dataset']['uiSchemaDeveloperValues'] || '[]')['map'](
            (_0x5bbe79) => String(_0x5bbe79),
          );
        } catch {
          _0x33038a = [];
        }
        _0x1048fe['dataset']['uiSchemaDeveloperMode'] = _0x5c5a21 && _0x33038a['length'] ? 'true' : 'false';
        if (_0x5c5a21) return;
        const _0x40312d = String(_0x1048fe['dataset']['uiSchemaField'] || '')['trim'](),
          _0xc66537 = typeof _0x3b846d === 'function' ? _0x3b846d() || {} : {},
          _0x51f791 = _0x5114a8(_0xc66537, _0x40312d, _0x1048fe['dataset']['uiSchemaDefault']);
        _0x40312d &&
          _0x33038a['includes'](String(_0x51f791 ?? '')) &&
          _0x2e1103(_0x40312d, _0x1048fe['dataset']['uiSchemaNormalDefault'] || 'default');
      });
    };
  return (
    _0x2c1483?.['addEventListener']?.('dev-mode-changed', _0x1f66d5),
    _0x1f66d5({ detail: { enabled: _0x2c1483?.['DEV_MODE'] === !![] } }),
    () => {
      _0x2c1483?.['removeEventListener']?.('dev-mode-changed', _0x1f66d5);
    }
  );
}
