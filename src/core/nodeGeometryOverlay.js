function normalizeOverrideSize(_0x513a7d) {
  const _0x55d5cb = Number(_0x513a7d?.['width']),
    _0x1c2f22 = Number(_0x513a7d?.['height']),
    _0x5032a6 = Number(_0x513a7d?.['x']),
    _0x375fec = Number(_0x513a7d?.['y']),
    _0x2734e9 = {};
  if (Number['isFinite'](_0x55d5cb) && Number['isFinite'](_0x1c2f22))
    Object['assign'](_0x2734e9, { width: _0x55d5cb, height: _0x1c2f22 });
  if (Number['isFinite'](_0x5032a6) && Number['isFinite'](_0x375fec))
    Object['assign'](_0x2734e9, { x: _0x5032a6, y: _0x375fec });
  return Object['keys'](_0x2734e9)['length'] ? _0x2734e9 : null;
}
export function createNodeGeometryOverlay(_0xcc10b7, _0x20ae6d) {
  const _0x2e31b1 = _0xcc10b7 && typeof _0xcc10b7 === 'object' ? _0xcc10b7 : {};
  if (!_0x20ae6d || typeof _0x20ae6d !== 'object') return _0x2e31b1;
  let _0xe986d5 = null;
  for (const [_0x21cc61, _0x339cb5] of Object['entries'](_0x20ae6d)) {
    const _0x56dcad = _0x2e31b1[_0x21cc61],
      _0x4bd4f3 = normalizeOverrideSize(_0x339cb5);
    if (!_0x56dcad || !_0x4bd4f3) continue;
    if (!_0xe986d5) _0xe986d5 = Object['create'](_0x2e31b1);
    Object['defineProperty'](_0xe986d5, _0x21cc61, {
      configurable: !![],
      enumerable: !![],
      value: { ..._0x56dcad, ..._0x4bd4f3 },
      writable: !![],
    });
  }
  return _0xe986d5 || _0x2e31b1;
}
