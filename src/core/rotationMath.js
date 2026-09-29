export function normalizeRotationDegrees(_0x11295c) {
  const _0x5f2da2 = Number(_0x11295c);
  if (!Number['isFinite'](_0x5f2da2)) return 0x0;
  return Math['round'](((((_0x5f2da2 % 0x168) + 0x21c) % 0x168) - 0xb4) * 0xa) / 0xa;
}
export function getRotatedSize(_0x142590, _0x5251c2, _0x12bea9) {
  const _0x16cce5 = (normalizeRotationDegrees(_0x12bea9) * Math['PI']) / 0xb4,
    _0x1166e3 = Math['abs'](Math['cos'](_0x16cce5)),
    _0x4f0e9e = Math['abs'](Math['sin'](_0x16cce5));
  return {
    width: Math['ceil'](_0x142590 * _0x1166e3 + _0x5251c2 * _0x4f0e9e - 1e-8),
    height: Math['ceil'](_0x142590 * _0x4f0e9e + _0x5251c2 * _0x1166e3 - 1e-8),
  };
}
export function rotatePointAroundCenter(_0x312594, _0x4a8edf, _0x591505) {
  const _0x4f67c4 = (normalizeRotationDegrees(_0x591505) * Math['PI']) / 0xb4,
    _0x9fcb2c = Math['cos'](_0x4f67c4),
    _0x452be4 = Math['sin'](_0x4f67c4),
    _0x48e633 = _0x312594['x'] - _0x4a8edf['x'],
    _0x226ab6 = _0x312594['y'] - _0x4a8edf['y'];
  return {
    x: _0x4a8edf['x'] + _0x48e633 * _0x9fcb2c - _0x226ab6 * _0x452be4,
    y: _0x4a8edf['y'] + _0x48e633 * _0x452be4 + _0x226ab6 * _0x9fcb2c,
  };
}
export function getImageRotationLayout(_0x4a758b, _0x5b7d40, _0x5148db, _0x5f1e96 = ![]) {
  const _0x1e71e9 = getRotatedSize(_0x4a758b, _0x5b7d40, _0x5148db);
  return _0x5f1e96
    ? {
        width: _0x4a758b,
        height: _0x5b7d40,
        scale: Math['min'](_0x4a758b / _0x1e71e9['width'], _0x5b7d40 / _0x1e71e9['height']),
      }
    : { ..._0x1e71e9, scale: 0x1 };
}
export function inverseImageRotationPoint(_0x47124a, _0x4c128a, _0x360b62, _0x35982e, _0x54dc71 = ![]) {
  const { scale: _0x3b2f14 } = getImageRotationLayout(_0x4c128a, _0x360b62, _0x35982e, _0x54dc71),
    _0xf87d14 = { x: _0x4c128a / 0x2, y: _0x360b62 / 0x2 };
  return rotatePointAroundCenter(
    {
      x: _0xf87d14['x'] + (_0x47124a['x'] - _0xf87d14['x']) / _0x3b2f14,
      y: _0xf87d14['y'] + (_0x47124a['y'] - _0xf87d14['y']) / _0x3b2f14,
    },
    _0xf87d14,
    -_0x35982e,
  );
}
