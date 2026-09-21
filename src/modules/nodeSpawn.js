import { findAvailablePosition } from '../core/math.js';
function toFiniteNumber(_0xc21c97, _0x54f6db) {
  const _0x4e9cf9 = Number(_0xc21c97);
  return Number.isFinite(_0x4e9cf9) ? _0x4e9cf9 : _0x54f6db;
}
function clampPositiveInteger(_0x3a1dcd, _0x558622) {
  const _0x363008 = Math.trunc(Number(_0x3a1dcd));
  return Number.isFinite(_0x363008) && _0x363008 > 0 ? _0x363008 : _0x558622;
}
function normalizeSpawnDirection(_0x5a191c) {
  if (_0x5a191c === 'down' || _0x5a191c === 'left') return _0x5a191c;
  return 'right';
}
export function getNodeSpawnPrefs() {
  const _0x1985f8 = globalThis.window || {};
  return {
    spacing: _0x1985f8.v2NodeSpacing ?? 120,
    direction: _0x1985f8.v2NodeDirection ?? 'right',
    avoidOverlap: _0x1985f8.v2NodeAvoidOverlap ?? true,
  };
}
export function calcSpawnStartFromAnchor(_0x579f1f, _0x3c26e0, _0xc352d4) {
  const _0x4a4386 = _0x579f1f?.x || 0,
    _0x2b8852 = _0x579f1f?.y || 0,
    _0x56ff38 = _0x579f1f?.width || 0x12c,
    _0x2e98d4 = _0x579f1f?.height || 0x12c;
  return {
    startX: _0x4a4386 + (_0xc352d4 === 'right' ? _0x56ff38 + _0x3c26e0 : 0),
    startY: _0x2b8852 + (_0xc352d4 === 'down' ? _0x2e98d4 + _0x3c26e0 : 0),
  };
}
export function calcSafeSpawnPosNearNode(_0x58608f, _0x1cbf39, _0x12b09a, _0x20a516) {
  const { spacing: _0x431583, direction: _0x297aaf, avoidOverlap: _0x1e5b14 } = getNodeSpawnPrefs(),
    _0x385351 = normalizeSpawnDirection(_0x297aaf),
    _0x25814b = _0x1cbf39?.x || 0,
    _0x32a6c5 = _0x1cbf39?.y || 0,
    _0x295166 = _0x1cbf39?.width || 0x12c,
    _0x2fb5a8 = _0x1cbf39?.height || 0x12c,
    _0x1f795f = Number(_0x12b09a) || 0x12c,
    _0x45c22f = Number(_0x20a516) || 0x12c,
    _0x3a5ce4 =
      _0x385351 === 'left'
        ? _0x25814b - _0x431583 - _0x1f795f
        : _0x25814b + (_0x385351 === 'right' ? _0x295166 + _0x431583 : 0),
    _0x2e6b51 = _0x32a6c5 + (_0x385351 === 'down' ? _0x2fb5a8 + _0x431583 : 0);
  if (!_0x1e5b14) return { x: _0x3a5ce4, y: _0x2e6b51 };
  return findAvailablePosition(_0x58608f, _0x3a5ce4, _0x2e6b51, _0x1f795f, _0x45c22f, _0x431583, _0x385351);
}
export function createBatchSpawnLayoutNearNode({
  nodes: nodes = {},
  anchorNode: _0x4e5120,
  itemCount: _0x2ef3d1,
  itemWidth: _0x495232,
  itemHeight: _0x496681,
  maxPerLine: maxPerLine = 5,
  padding: padding = 0,
  titleHeight: titleHeight = 0,
  itemGap: _0x29b3d8,
} = {}) {
  const _0x292e82 = getNodeSpawnPrefs(),
    _0x29e46b = Math.max(0, toFiniteNumber(_0x292e82.spacing, 120)),
    _0x140094 = normalizeSpawnDirection(_0x292e82.direction),
    _0x21dca1 = _0x292e82.avoidOverlap !== false,
    _0x4308de = clampPositiveInteger(_0x2ef3d1, 1),
    _0x569511 = Math.max(1, toFiniteNumber(_0x495232, 0x12c)),
    _0x928596 = Math.max(1, toFiniteNumber(_0x496681, 0x12c)),
    _0x5c1f91 = Math.max(0, toFiniteNumber(_0x29b3d8, _0x29e46b)),
    _0x3f0f1f = Math.max(0, toFiniteNumber(padding, 0)),
    _0x37a1b5 = Math.max(0, toFiniteNumber(titleHeight, 0)),
    _0x11f382 = Math.min(clampPositiveInteger(maxPerLine, 5), Math.max(1, Math.ceil(Math.sqrt(_0x4308de)))),
    _0x1c3047 = _0x140094 === 'down' ? Math.max(1, Math.ceil(_0x4308de / _0x11f382)) : _0x11f382,
    _0x1e2486 = _0x140094 === 'down' ? _0x11f382 : Math.max(1, Math.ceil(_0x4308de / _0x11f382)),
    _0x3e0ecd = _0x1c3047 * _0x569511 + (_0x1c3047 - 1) * _0x5c1f91 + _0x3f0f1f * 2,
    _0x3d4f1f = _0x1e2486 * _0x928596 + (_0x1e2486 - 1) * _0x5c1f91 + _0x3f0f1f * 2 + _0x37a1b5,
    _0x120b49 = toFiniteNumber(_0x4e5120?.x, 0),
    _0x344796 = toFiniteNumber(_0x4e5120?.y, 0),
    _0x56e2f7 = toFiniteNumber(_0x4e5120?.width, 0x12c),
    _0x31cad2 = toFiniteNumber(_0x4e5120?.height, 0x12c);
  let _0x5cd235 = _0x120b49 + _0x56e2f7 + _0x29e46b,
    _0x37063b = _0x344796;
  if (_0x140094 === 'down') ((_0x5cd235 = _0x120b49), (_0x37063b = _0x344796 + _0x31cad2 + _0x29e46b));
  else _0x140094 === 'left' && ((_0x5cd235 = _0x120b49 - _0x29e46b - _0x3e0ecd), (_0x37063b = _0x344796));
  if (_0x21dca1) {
    const _0x5b97f7 = findAvailablePosition(
      nodes,
      _0x5cd235,
      _0x37063b,
      _0x3e0ecd,
      _0x3d4f1f,
      _0x29e46b,
      _0x140094,
    );
    ((_0x5cd235 = _0x5b97f7.x), (_0x37063b = _0x5b97f7.y));
  }
  const _0x2c2ff1 = _0x5cd235 + _0x3f0f1f,
    _0x16e8fc = _0x37063b + _0x3f0f1f + _0x37a1b5,
    _0x396572 = (_0x33f547) => {
      const _0x49e629 = Math.max(0, Math.trunc(Number(_0x33f547)) || 0),
        _0x47ce59 = _0x140094 === 'down' ? Math.floor(_0x49e629 / _0x1e2486) : _0x49e629 % _0x1c3047,
        _0x3b1a27 = _0x140094 === 'down' ? _0x49e629 % _0x1e2486 : Math.floor(_0x49e629 / _0x1c3047);
      return {
        x: _0x2c2ff1 + _0x47ce59 * (_0x569511 + _0x5c1f91),
        y: _0x16e8fc + _0x3b1a27 * (_0x928596 + _0x5c1f91),
        col: _0x47ce59,
        row: _0x3b1a27,
      };
    };
  return {
    direction: _0x140094,
    spacing: _0x29e46b,
    itemGap: _0x5c1f91,
    columns: _0x1c3047,
    rows: _0x1e2486,
    groupX: _0x5cd235,
    groupY: _0x37063b,
    groupWidth: _0x3e0ecd,
    groupHeight: _0x3d4f1f,
    itemStartX: _0x2c2ff1,
    itemStartY: _0x16e8fc,
    getItemPosition: _0x396572,
  };
}
