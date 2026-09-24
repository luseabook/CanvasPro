const DEFAULT_ANALYSIS_MAX_DIMENSION = 0x200;
function clamp(_0x1a834e, _0x3b52db, _0x56bbe9) {
  return Math['max'](_0x3b52db, Math['min'](_0x56bbe9, _0x1a834e));
}
function finite(_0x5ab6e2, _0x2efd11 = 0x0) {
  const _0x307540 = Number(_0x5ab6e2);
  return Number['isFinite'](_0x307540) ? _0x307540 : _0x2efd11;
}
function luminance(_0x1de222, _0x440506) {
  return (
    _0x1de222[_0x440506] * 0.2126 + _0x1de222[_0x440506 + 0x1] * 0.7152 + _0x1de222[_0x440506 + 0x2] * 0.0722
  );
}
function normalizedVerticalFov(_0x144c99, _0x28a2f9) {
  const _0x3752de = (clamp(finite(_0x144c99, 0x3c), 0xa, 0xaa) * Math['PI']) / 0xb4;
  return (0x2 * Math['atan'](Math['tan'](_0x3752de / 0x2) / Math['max'](0.1, _0x28a2f9)) * 0xb4) / Math['PI'];
}
function collectRowFeatures(_0x1368d6) {
  const { data: _0x5922ed, width: _0x41f066, height: _0xc5b6a4 } = _0x1368d6,
    _0x25e732 = new Float64Array(_0xc5b6a4),
    _0x261ec2 = new Float64Array(_0xc5b6a4),
    _0xc30b02 = new Float64Array(_0xc5b6a4);
  for (let _0x27ccb5 = 0x0; _0x27ccb5 < _0xc5b6a4; _0x27ccb5 += 0x1) {
    let _0x5d03eb = 0x0,
      _0x507e4c = 0x0,
      _0x3ecbca = 0x0,
      _0x47b6e0 = 0x0;
    for (let _0x210ff3 = 0x0; _0x210ff3 < _0x41f066; _0x210ff3 += 0x1) {
      const _0x3126bd = (_0x27ccb5 * _0x41f066 + _0x210ff3) * 0x4,
        _0x48b3cb = luminance(_0x5922ed, _0x3126bd);
      _0x5d03eb += _0x48b3cb;
      if (_0x210ff3 > 0x0) _0x507e4c += Math['abs'](_0x48b3cb - _0x47b6e0);
      (_0x27ccb5 > 0x0 &&
        (_0x3ecbca += Math['abs'](_0x48b3cb - luminance(_0x5922ed, _0x3126bd - _0x41f066 * 0x4))),
        (_0x47b6e0 = _0x48b3cb));
    }
    ((_0x25e732[_0x27ccb5] = _0x5d03eb / Math['max'](0x1, _0x41f066)),
      (_0x261ec2[_0x27ccb5] = _0x507e4c / Math['max'](0x1, _0x41f066 - 0x1)),
      (_0xc30b02[_0x27ccb5] = _0x3ecbca / Math['max'](0x1, _0x41f066)));
  }
  return { means: _0x25e732, textures: _0x261ec2, verticalEdges: _0xc30b02 };
}
function windowMean(_0x14154f, _0x88edc, _0x3a8133) {
  let _0x1cf418 = 0x0,
    _0x5a6224 = 0x0;
  for (
    let _0x4b301b = Math['max'](0x0, _0x88edc);
    _0x4b301b < Math['min'](_0x14154f['length'], _0x3a8133);
    _0x4b301b += 0x1
  ) {
    ((_0x1cf418 += _0x14154f[_0x4b301b]), (_0x5a6224 += 0x1));
  }
  return _0x5a6224 > 0x0 ? _0x1cf418 / _0x5a6224 : 0x0;
}
function estimateHorizon(_0x411506) {
  const { height: _0x36852a } = _0x411506,
    _0x3647f2 = collectRowFeatures(_0x411506),
    _0x50487b = Math['max'](0x2, Math['round'](_0x36852a * 0.018)),
    _0x386870 = Math['max'](_0x50487b, Math['round'](_0x36852a * 0.16)),
    _0x5d3d1e = Math['min'](_0x36852a - _0x50487b, Math['round'](_0x36852a * 0.8)),
    _0x4d8050 = [];
  for (let _0xb44c8b = _0x386870; _0xb44c8b < _0x5d3d1e; _0xb44c8b += 0x1) {
    const _0x37a191 = Math['abs'](
        windowMean(_0x3647f2['means'], _0xb44c8b - _0x50487b, _0xb44c8b) -
          windowMean(_0x3647f2['means'], _0xb44c8b, _0xb44c8b + _0x50487b),
      ),
      _0x132fdc = Math['abs'](
        windowMean(_0x3647f2['textures'], _0xb44c8b - _0x50487b, _0xb44c8b) -
          windowMean(_0x3647f2['textures'], _0xb44c8b, _0xb44c8b + _0x50487b),
      ),
      _0x11f77d = _0xb44c8b / _0x36852a,
      _0x2f48e1 = 0.62 + 0.38 * Math['exp'](-Math['pow']((_0x11f77d - 0.48) / 0.3, 0x2)),
      _0x65b58a =
        (_0x37a191 * 0.58 + _0x132fdc * 0.22 + _0x3647f2['verticalEdges'][_0xb44c8b] * 0.2) * _0x2f48e1;
    _0x4d8050['push']({ y: _0xb44c8b, score: _0x65b58a });
  }
  _0x4d8050['sort']((_0x41d840, _0xfb25ab) => _0xfb25ab['score'] - _0x41d840['score']);
  const _0x213c0a = _0x4d8050[0x0];
  if (!_0x213c0a || _0x213c0a['score'] < 0.5) return { horizonY: 0.5, confidence: 0.2 };
  const _0x2afc95 = _0x4d8050[Math['floor'](_0x4d8050['length'] / 0x2)]?.['score'] || 0x0,
    _0x5278 = _0x213c0a['score'] / Math['max'](0.1, _0x2afc95);
  return {
    horizonY: clamp(_0x213c0a['y'] / _0x36852a, 0.12, 0.88),
    confidence: clamp(0.28 + (_0x5278 - 0x1) * 0.12 + _0x213c0a['score'] / 0xdc, 0.25, 0.82),
  };
}
function estimateVanishingPointX(_0x247fcb, _0x1a8c30) {
  const { data: _0x50aee8, width: _0x154682, height: _0x27a3a0 } = _0x247fcb,
    _0x31cb1c = _0x1a8c30 * _0x27a3a0,
    _0x429ace = 0x60,
    _0x4018ee = new Float64Array(_0x429ace);
  let _0x4b1c31 = 0x0;
  for (
    let _0x153ce0 = Math['max'](0x2, Math['round'](_0x31cb1c + _0x27a3a0 * 0.025));
    _0x153ce0 < _0x27a3a0 - 0x2;
    _0x153ce0 += 0x2
  ) {
    for (let _0xd2a87b = 0x2; _0xd2a87b < _0x154682 - 0x2; _0xd2a87b += 0x2) {
      const _0x41d2fc = (_0x153ce0 * _0x154682 + _0xd2a87b) * 0x4,
        _0x3411c1 = luminance(_0x50aee8, _0x41d2fc + 0x4) - luminance(_0x50aee8, _0x41d2fc - 0x4),
        _0x50a0d3 =
          luminance(_0x50aee8, _0x41d2fc + _0x154682 * 0x4) -
          luminance(_0x50aee8, _0x41d2fc - _0x154682 * 0x4),
        _0x423479 = Math['hypot'](_0x3411c1, _0x50a0d3);
      if (_0x423479 < 0x26 || Math['abs'](_0x3411c1) < 0.00001) continue;
      const _0x16375b = -_0x50a0d3 / _0x3411c1,
        _0x584f0a = Math['abs'](_0x16375b);
      if (_0x584f0a < 0.08 || _0x584f0a > 3.5) continue;
      const _0x464457 = _0xd2a87b + (_0x31cb1c - _0x153ce0) * _0x16375b;
      if (_0x464457 < -_0x154682 * 0.35 || _0x464457 > _0x154682 * 1.35) continue;
      const _0xd73ada = clamp(_0x464457 / _0x154682, 0x0, 0.999999),
        _0x160c05 = Math['floor'](_0xd73ada * _0x429ace),
        _0x40e191 = Math['min'](0xff, _0x423479);
      ((_0x4018ee[_0x160c05] += _0x40e191), (_0x4b1c31 += _0x40e191));
    }
  }
  if (_0x4b1c31 <= 0x0) return { vanishingPointX: 0.5, confidence: 0.12 };
  const _0xcb2047 = Array['from'](
    _0x4018ee,
    (_0x139677, _0xb55a33) =>
      (_0x4018ee[_0xb55a33 - 0x1] || 0x0) * 0.25 +
      _0x4018ee[_0xb55a33] +
      (_0x4018ee[_0xb55a33 + 0x1] || 0x0) * 0.25,
  );
  let _0x577cc6 = 0x0;
  for (let _0x581f50 = 0x1; _0x581f50 < _0xcb2047['length']; _0x581f50 += 0x1) {
    if (_0xcb2047[_0x581f50] > _0xcb2047[_0x577cc6]) _0x577cc6 = _0x581f50;
  }
  const _0x251c54 = _0xcb2047[_0x577cc6] / Math['max'](0x1, _0x4b1c31);
  return {
    vanishingPointX: clamp((_0x577cc6 + 0.5) / _0x429ace, 0.05, 0.95),
    confidence: clamp(_0x251c54 * 0x5, 0.12, 0.7),
  };
}
export function extractStoryboard3DFocalLength35mmFromExif(_0x473eb) {
  const _0xe31974 = _0x473eb instanceof Uint8Array ? _0x473eb : new Uint8Array(_0x473eb || 0x0);
  if (_0xe31974['length'] < 0x10 || _0xe31974[0x0] !== 0xff || _0xe31974[0x1] !== 0xd8) return null;
  const _0x2e201a = new DataView(_0xe31974['buffer'], _0xe31974['byteOffset'], _0xe31974['byteLength']);
  let _0x43d8ef = 0x2;
  while (_0x43d8ef + 0x4 <= _0xe31974['length']) {
    if (_0xe31974[_0x43d8ef] !== 0xff) break;
    const _0x29997e = _0xe31974[_0x43d8ef + 0x1];
    if (_0x29997e === 0xda || _0x29997e === 0xd9) break;
    const _0x53d3ed = _0x2e201a['getUint16'](_0x43d8ef + 0x2, ![]);
    if (_0x53d3ed < 0x2 || _0x43d8ef + 0x2 + _0x53d3ed > _0xe31974['length']) break;
    if (
      _0x29997e === 0xe1 &&
      _0x53d3ed >= 0xe &&
      String['fromCharCode'](..._0xe31974['subarray'](_0x43d8ef + 0x4, _0x43d8ef + 0xa)) ===
        'Exif\u0000\u0000'
    ) {
      const _0x5a0fbf = _0x43d8ef + 0xa,
        _0x155e07 = String['fromCharCode'](_0xe31974[_0x5a0fbf], _0xe31974[_0x5a0fbf + 0x1]),
        _0x3ca370 = _0x155e07 === 'II';
      if (!_0x3ca370 && _0x155e07 !== 'MM') return null;
      const _0x17d0d2 = (_0x261d8e) => _0x2e201a['getUint16'](_0x261d8e, _0x3ca370),
        _0x4e13c3 = (_0x1af141) => _0x2e201a['getUint32'](_0x1af141, _0x3ca370),
        _0x2a4f1f = (_0xac5e06, _0x40177f) => {
          if (_0xac5e06 < _0x5a0fbf || _0xac5e06 + 0x2 > _0xe31974['length']) return null;
          const _0x19dc67 = _0x17d0d2(_0xac5e06);
          for (let _0x253d1e = 0x0; _0x253d1e < _0x19dc67; _0x253d1e += 0x1) {
            const _0x4b7657 = _0xac5e06 + 0x2 + _0x253d1e * 0xc;
            if (_0x4b7657 + 0xc > _0xe31974['length']) break;
            if (_0x17d0d2(_0x4b7657) === _0x40177f) return _0x4b7657;
          }
          return null;
        },
        _0x53f21a = _0x5a0fbf + _0x4e13c3(_0x5a0fbf + 0x4),
        _0x2f44f3 = _0x2a4f1f(_0x53f21a, 0x8769);
      if (!_0x2f44f3) return null;
      const _0x3ec361 = _0x5a0fbf + _0x4e13c3(_0x2f44f3 + 0x8),
        _0x548576 = _0x2a4f1f(_0x3ec361, 0xa405);
      if (!_0x548576) return null;
      const _0x387500 = _0x17d0d2(_0x548576 + 0x2),
        _0x3b9bf4 = _0x4e13c3(_0x548576 + 0x4);
      if (_0x3b9bf4 < 0x1) return null;
      const _0x18cacf =
        _0x387500 === 0x3 ? _0x17d0d2(_0x548576 + 0x8) : _0x387500 === 0x4 ? _0x4e13c3(_0x548576 + 0x8) : 0x0;
      return _0x18cacf > 0x0 ? _0x18cacf : null;
    }
    _0x43d8ef += 0x2 + _0x53d3ed;
  }
  return null;
}
export function estimateStoryboard3DBackgroundPerspective(
  _0x2e5333,
  {
    sourceWidth: sourceWidth = _0x2e5333?.['width'],
    sourceHeight: sourceHeight = _0x2e5333?.['height'],
    focalLength35mm: focalLength35mm = null,
  } = {},
) {
  const _0x51db18 = Math['max'](0x1, Math['round'](finite(_0x2e5333?.['width'], 0x1))),
    _0x1d2c96 = Math['max'](0x1, Math['round'](finite(_0x2e5333?.['height'], 0x1)));
  if (!_0x2e5333?.['data'] || _0x2e5333['data']['length'] < _0x51db18 * _0x1d2c96 * 0x4)
    throw new TypeError('Background\x20perspective\x20estimation\x20requires\x20RGBA\x20image\x20data.');
  const _0x599212 = estimateHorizon(_0x2e5333),
    _0x11acce = estimateVanishingPointX(_0x2e5333, _0x599212['horizonY']),
    _0x5d18d1 = Math['max'](0x1, Math['round'](finite(sourceWidth, _0x51db18))),
    _0x4ecfab = Math['max'](0x1, Math['round'](finite(sourceHeight, _0x1d2c96))),
    _0x404c1a = _0x5d18d1 / _0x4ecfab,
    _0x56abba =
      focalLength35mm > 0x0 ? (0x2 * Math['atan'](0x24 / (0x2 * focalLength35mm)) * 0xb4) / Math['PI'] : 0x3c,
    _0x4a4d48 = clamp(
      _0x599212['confidence'] * 0.7 + _0x11acce['confidence'] * 0.3,
      0.2,
      focalLength35mm > 0x0 ? 0.9 : 0.78,
    ),
    _0x491193 = clamp(_0x599212['horizonY'], 0x0, 0x1);
  return {
    horizontalFov: clamp(_0x56abba, 0xa, 0xaa),
    verticalFov: clamp(normalizedVerticalFov(_0x56abba, _0x404c1a), 0xa, 0xaa),
    horizonY: _0x491193,
    horizonSlope: 0x0,
    vanishingPoint: [_0x11acce['vanishingPointX'], _0x491193],
    cameraHeight: 1.6,
    imageWidth: _0x5d18d1,
    imageHeight: _0x4ecfab,
    groundRegion: [
      [0x0, _0x491193],
      [0x1, _0x491193],
      [0x1, 0x1],
      [0x0, 0x1],
    ],
    calibrationMethod: focalLength35mm > 0x0 ? 'exif-local-estimate' : 'local-image-estimate',
    calibrationConfidence: _0x4a4d48,
  };
}
async function readFocalLength35mm(_0x2babac) {
  if (!/^image\/jpe?g$/i['test'](String(_0x2babac?.['type'] || ''))) return null;
  if (typeof _0x2babac?.['arrayBuffer'] !== 'function') return null;
  try {
    return extractStoryboard3DFocalLength35mmFromExif(await _0x2babac['arrayBuffer']());
  } catch {
    return null;
  }
}
export async function analyzeStoryboard3DBackgroundImage(
  _0x4917f2,
  {
    documentObject: documentObject = globalThis['document'],
    imageBitmapFactory: imageBitmapFactory = typeof globalThis['createImageBitmap'] === 'function'
      ? globalThis['createImageBitmap']['bind'](globalThis)
      : null,
    maxDimension: maxDimension = DEFAULT_ANALYSIS_MAX_DIMENSION,
  } = {},
) {
  if (!_0x4917f2) throw new TypeError('Background image file is required.');
  if (typeof imageBitmapFactory !== 'function') throw new Error('当前浏览器不支持本地背景透视分析。');
  const _0x5e5330 = await imageBitmapFactory(_0x4917f2);
  try {
    const _0x4f05b6 = Math['max'](0x1, Number(_0x5e5330?.['width']) || 0x1),
      _0x2e6373 = Math['max'](0x1, Number(_0x5e5330?.['height']) || 0x1),
      _0xff0204 = Math['min'](
        0x1,
        Math['max'](0x40, Number(maxDimension) || DEFAULT_ANALYSIS_MAX_DIMENSION) /
          Math['max'](_0x4f05b6, _0x2e6373),
      ),
      _0x12cfb7 = Math['max'](0x1, Math['round'](_0x4f05b6 * _0xff0204)),
      _0x3e19e8 = Math['max'](0x1, Math['round'](_0x2e6373 * _0xff0204)),
      _0x49b8ec = documentObject?.['createElement']?.('canvas'),
      _0x2580f4 = _0x49b8ec?.['getContext']?.('2d', { willReadFrequently: !![] });
    if (!_0x49b8ec || !_0x2580f4) throw new Error('无法创建背景透视分析画布。');
    ((_0x49b8ec['width'] = _0x12cfb7),
      (_0x49b8ec['height'] = _0x3e19e8),
      _0x2580f4['drawImage'](_0x5e5330, 0x0, 0x0, _0x12cfb7, _0x3e19e8));
    const _0x8935b1 = _0x2580f4['getImageData'](0x0, 0x0, _0x12cfb7, _0x3e19e8);
    return estimateStoryboard3DBackgroundPerspective(_0x8935b1, {
      sourceWidth: _0x4f05b6,
      sourceHeight: _0x2e6373,
      focalLength35mm: await readFocalLength35mm(_0x4917f2),
    });
  } finally {
    _0x5e5330?.['close']?.();
  }
}
