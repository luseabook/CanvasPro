export function calculateStoryboardDimsByAspect(_0x454cd, _0x28b389) {
  const _0x3dacc5 = String(_0x28b389 || '1:1')
      .split(':')
      .map(Number),
    _0x4f69da = _0x3dacc5[0],
    _0x34b0d3 = _0x3dacc5[1],
    _0x461faa = _0x454cd?.width || 0x320;
  return { w: _0x461faa, h: Math.round(_0x461faa * (_0x34b0d3 / _0x4f69da)) };
}
export function buildStoryboardCollapsePatch(_0x386993, _0x31553f) {
  const _0x3e688a = { isCollapsed: !!_0x31553f };
  if (_0x31553f) {
    const _0x381c3a = _0x386993?.aspectRatio || '1:1',
      _0x3e998f = _0x381c3a.split(':').map(Number),
      _0x195d00 = _0x3e998f[0],
      _0x32cb64 = _0x3e998f[1],
      _0x6c3036 = _0x195d00 / _0x32cb64;
    let _0xd34026, _0xa8bdd3;
    return (
      _0x6c3036 >= 1
        ? ((_0xa8bdd3 = 0x12c), (_0xd34026 = Math.round(_0xa8bdd3 * _0x6c3036)))
        : ((_0xd34026 = 0x12c), (_0xa8bdd3 = Math.round(_0xd34026 / _0x6c3036))),
      (_0x3e688a._originalWidth = _0x386993?.width),
      (_0x3e688a._originalHeight = _0x386993?.height),
      (_0x3e688a.width = _0xd34026),
      (_0x3e688a.height = _0xa8bdd3),
      _0x3e688a
    );
  }
  return (
    _0x386993?._originalWidth &&
      _0x386993?._originalHeight &&
      ((_0x3e688a.width = _0x386993._originalWidth), (_0x3e688a.height = _0x386993._originalHeight)),
    _0x3e688a
  );
}
