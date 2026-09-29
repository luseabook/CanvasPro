function isPlainObject(_0x35da99) {
  return !!_0x35da99 && typeof _0x35da99 === 'object' && !Array['isArray'](_0x35da99);
}
export function applyUiSchemaFieldOverrides(_0x27e65f, _0x12ea9a) {
  const _0x586272 = isPlainObject(_0x12ea9a) ? _0x12ea9a : {};
  return (Array['isArray'](_0x27e65f) ? _0x27e65f : [])['map']((_0x24a3ec) => {
    const _0x337fef = String(_0x24a3ec?.['id'] || '')['trim'](),
      _0x9fa92f = _0x586272[_0x337fef];
    if (!_0x337fef || !isPlainObject(_0x9fa92f)) return _0x24a3ec;
    return { ..._0x24a3ec, ..._0x9fa92f, id: _0x337fef };
  });
}
