export function resolveNormalizedMediaCrop(_0xe785af, _0x15273e, _0x376750) {
  if (!_0xe785af) return { x: 0x0, y: 0x0, width: _0x15273e, height: _0x376750 };
  const { x: _0x6c11b6, y: _0x4bce8b, width: _0x2cdf5e, height: _0x3cc2df } = _0xe785af;
  if (
    ![_0x6c11b6, _0x4bce8b, _0x2cdf5e, _0x3cc2df]['every'](Number['isFinite']) ||
    _0x6c11b6 < 0x0 ||
    _0x4bce8b < 0x0 ||
    _0x2cdf5e <= 0x0 ||
    _0x3cc2df <= 0x0 ||
    _0x6c11b6 + _0x2cdf5e > 1.000001 ||
    _0x4bce8b + _0x3cc2df > 1.000001
  )
    throw new Error('裁剪范围无效');
  const _0xd805ca = Math['min'](_0x15273e - 0x1, Math['floor'](_0x6c11b6 * _0x15273e)),
    _0x450d6b = Math['min'](_0x376750 - 0x1, Math['floor'](_0x4bce8b * _0x376750));
  return {
    x: _0xd805ca,
    y: _0x450d6b,
    width: Math['max'](0x1, Math['min'](_0x15273e - _0xd805ca, Math['round'](_0x2cdf5e * _0x15273e))),
    height: Math['max'](0x1, Math['min'](_0x376750 - _0x450d6b, Math['round'](_0x3cc2df * _0x376750))),
  };
}
export function normalizedMediaDragRect(_0x242990, _0x58e833, _0x34a67e) {
  const _0x5d0f96 = (_0x256ffb) => Math['min'](0x1, Math['max'](0x0, _0x256ffb)),
    _0x16d737 = {
      x: _0x5d0f96((_0x58e833['x'] - _0x242990['left']) / _0x242990['width']),
      y: _0x5d0f96((_0x58e833['y'] - _0x242990['top']) / _0x242990['height']),
    },
    _0x8ee57a = {
      x: _0x5d0f96((_0x34a67e['x'] - _0x242990['left']) / _0x242990['width']),
      y: _0x5d0f96((_0x34a67e['y'] - _0x242990['top']) / _0x242990['height']),
    };
  return {
    x: Math['min'](_0x16d737['x'], _0x8ee57a['x']),
    y: Math['min'](_0x16d737['y'], _0x8ee57a['y']),
    width: Math['abs'](_0x16d737['x'] - _0x8ee57a['x']),
    height: Math['abs'](_0x16d737['y'] - _0x8ee57a['y']),
  };
}
