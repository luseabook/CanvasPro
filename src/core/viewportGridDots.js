const GRID_DOT_WORLD_SPACING = 0x16,
  MIN_GRID_DOT_SCREEN_SPACING = 0x12,
  GRID_DOTS_HIDE_AT_ZOOM = 0.25,
  GRID_DOTS_EMPHASIZE_AT_ZOOM = 1.5;
function toFiniteNumber(_0x490f60, _0x285235) {
  const _0x1e86c4 = Number(_0x490f60);
  return Number['isFinite'](_0x1e86c4) ? _0x1e86c4 : _0x285235;
}
function resolveScreenSpacing(_0x1e8f8e) {
  let _0x3ce10f = GRID_DOT_WORLD_SPACING * _0x1e8f8e;
  while (_0x3ce10f < MIN_GRID_DOT_SCREEN_SPACING) {
    _0x3ce10f *= 0x2;
  }
  return _0x3ce10f;
}
export function syncViewportGridDots(_0x1160ff, _0x1659c1 = {}) {
  const _0xf6b6ff = _0x1160ff?.['parentElement'];
  if (!_0xf6b6ff?.['style']?.['setProperty']) return ![];
  const _0x1ac9db = toFiniteNumber(_0x1659c1['x'], 0x0),
    _0x3c777f = toFiniteNumber(_0x1659c1['y'], 0x0),
    _0x46d5e8 = toFiniteNumber(_0x1659c1['zoom'], 0x1),
    _0x4a9e37 = _0x46d5e8 > 0x0 ? _0x46d5e8 : 0x1,
    _0x3a6d5b = _0x1ac9db + '|' + _0x3c777f + '|' + _0x4a9e37;
  if (_0xf6b6ff['_lastGridDotsViewport'] === _0x3a6d5b) return ![];
  const _0x40370c = resolveScreenSpacing(_0x4a9e37),
    _0xa28b38 = _0x1ac9db + 'px ' + _0x3c777f + 'px',
    _0x5659e3 = _0x40370c + 'px\x20' + _0x40370c + 'px',
    _0x41cde7 = _0x4a9e37 <= GRID_DOTS_HIDE_AT_ZOOM,
    _0x277825 = _0x4a9e37 >= GRID_DOTS_EMPHASIZE_AT_ZOOM;
  return (
    _0xf6b6ff['_lastGridDotsPosition'] !== _0xa28b38 &&
      (_0xf6b6ff['style']['setProperty']('background-position', _0xa28b38),
      (_0xf6b6ff['_lastGridDotsPosition'] = _0xa28b38)),
    _0xf6b6ff['_lastGridDotsSize'] !== _0x5659e3 &&
      (_0xf6b6ff['style']['setProperty']('background-size', _0x5659e3),
      (_0xf6b6ff['_lastGridDotsSize'] = _0x5659e3)),
    _0xf6b6ff['_lastGridDotsHidden'] !== _0x41cde7 &&
      (_0xf6b6ff['classList']?.['toggle']?.('is-grid-dots-hidden-by-zoom', _0x41cde7),
      (_0xf6b6ff['_lastGridDotsHidden'] = _0x41cde7)),
    _0xf6b6ff['_lastGridDotsEmphasized'] !== _0x277825 &&
      (_0xf6b6ff['classList']?.['toggle']?.('is-grid-dots-emphasized', _0x277825),
      (_0xf6b6ff['_lastGridDotsEmphasized'] = _0x277825)),
    (_0xf6b6ff['_lastGridDotsViewport'] = _0x3a6d5b),
    !![]
  );
}
