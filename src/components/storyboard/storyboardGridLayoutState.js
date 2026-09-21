import { getStoryboardCellPixelBounds, resolveStoryboardGridLayout } from '../../core/storyboardCellUtils.js';
export function buildStoryboardActiveGridNode(_0x391079, _0x1f0f84) {
  const _0xa9f954 = resolveStoryboardGridLayout(_0x391079);
  return {
    ..._0x391079,
    cols: _0xa9f954.cols,
    rows: _0xa9f954.rows,
    gridGap: _0x1f0f84,
    gridLayout: { columns: _0xa9f954.columns, rows: _0xa9f954.rowTracks },
  };
}
export function buildStoryboardBaseGridLayout(_0x507070) {
  const _0x1c98d8 = Math.max(1, Number(_0x507070?.cols) || 1),
    _0x2c1652 = Math.max(1, Number(_0x507070?.rows) || 1);
  return {
    cols: _0x1c98d8,
    rows: _0x2c1652,
    columns: Array(_0x1c98d8).fill(1),
    rowTracks: Array(_0x2c1652).fill(1),
  };
}
export function getStoryboardActiveCellLayoutBounds(_0x2d122d, _0x3f722a, _0x1d713c) {
  return getStoryboardCellPixelBounds(buildStoryboardActiveGridNode(_0x2d122d, _0x1d713c), _0x3f722a, {
    width: _0x2d122d?.width,
    height: _0x2d122d?.height,
    inset: 0,
  });
}
export function getStoryboardBaseCellLayoutBounds(_0xfb2c32, _0x233554) {
  return getStoryboardCellPixelBounds({ ..._0xfb2c32, gridGap: 0, gridLayout: null }, _0x233554, {
    width: _0xfb2c32?.width,
    height: _0xfb2c32?.height,
    inset: 0,
    gap: 0,
  });
}
export function getStoryboardCellCutoutRect(_0x37be05, _0xe07f94, _0x129810) {
  const _0x16c64c = getStoryboardBaseCellLayoutBounds(_0x37be05, _0xe07f94),
    _0x100651 = getStoryboardActiveCellLayoutBounds(_0x37be05, _0xe07f94, _0x129810);
  if (!_0x16c64c || !_0x100651 || _0x16c64c.width <= 0 || _0x16c64c.height <= 0) return null;
  const _0x4c975f = Math.max(0, _0x100651.x0 - _0x16c64c.x0),
    _0x2c4c22 = Math.max(0, _0x100651.y0 - _0x16c64c.y0),
    _0x475536 = Math.min(_0x16c64c.width, _0x100651.x1 - _0x16c64c.x0),
    _0x27d495 = Math.min(_0x16c64c.height, _0x100651.y1 - _0x16c64c.y0);
  return {
    x: _0x4c975f,
    y: _0x2c4c22,
    width: Math.max(0, _0x475536 - _0x4c975f),
    height: Math.max(0, _0x27d495 - _0x2c4c22),
  };
}
export function isDefaultStoryboardTrackList(_0x11dea7) {
  return (_0x11dea7 || []).every((_0x5de0a8) => Math.abs(Number(_0x5de0a8) - 1) < 0.0001);
}
export function hasCustomStoryboardGridLayout(_0x44dcdb) {
  return (
    !isDefaultStoryboardTrackList(_0x44dcdb?.columns) || !isDefaultStoryboardTrackList(_0x44dcdb?.rowTracks)
  );
}
export function areStoryboardTrackListsEqual(_0x9d8a71 = [], _0x2f7158 = []) {
  if (!Array.isArray(_0x9d8a71) || !Array.isArray(_0x2f7158) || _0x9d8a71.length !== _0x2f7158.length)
    return false;
  return _0x9d8a71.every(
    (_0x3c44af, _0xb79f9d) => Math.abs(Number(_0x3c44af) - Number(_0x2f7158[_0xb79f9d])) < 0.0001,
  );
}
export function isSameStoryboardGridLayout(_0x51979b, _0x184215) {
  const _0x3a8431 = resolveStoryboardGridLayout(_0x51979b),
    _0x3b7c1c = resolveStoryboardGridLayout({
      cols: _0x51979b?.cols,
      rows: _0x51979b?.rows,
      gridLayout: _0x184215,
    });
  return (
    areStoryboardTrackListsEqual(_0x3a8431.columns, _0x3b7c1c.columns) &&
    areStoryboardTrackListsEqual(_0x3a8431.rowTracks, _0x3b7c1c.rowTracks)
  );
}
export function getStoryboardCustomGridLinePosition(_0x3f1c23, _0x2a5d3c) {
  const _0x1c8b40 = _0x2a5d3c > 0 ? _0x3f1c23 / _0x2a5d3c : 0;
  return Math.max(0, Math.min(1, _0x1c8b40)) * 100 + '%';
}
export function adjustAdjacentStoryboardGridTracks(_0x3fc513, _0x36af5a, _0x8988d9) {
  const _0x3542e5 = [..._0x3fc513];
  if (_0x36af5a < 0 || _0x36af5a >= _0x3542e5.length - 1) return _0x3542e5;
  const _0x597e01 = _0x3542e5[_0x36af5a] + _0x3542e5[_0x36af5a + 1],
    _0x3ca1be = Math.min(0.2, _0x597e01 / 2),
    _0x55a150 = Math.min(Math.max(_0x3542e5[_0x36af5a] + _0x8988d9, _0x3ca1be), _0x597e01 - _0x3ca1be);
  return (
    (_0x3542e5[_0x36af5a] = Math.round(_0x55a150 * 0x2710) / 0x2710),
    (_0x3542e5[_0x36af5a + 1] = Math.round((_0x597e01 - _0x55a150) * 0x2710) / 0x2710),
    _0x3542e5
  );
}
