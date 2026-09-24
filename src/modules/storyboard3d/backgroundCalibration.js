function finite(_0x5b1277, _0x22c4cc = 0x0) {
  const _0x4b519e = Number(_0x5b1277);
  return Number['isFinite'](_0x4b519e) ? _0x4b519e : _0x22c4cc;
}
function clamp(_0x1efa0a, _0x43daf7, _0xf9c305) {
  return Math['max'](_0x43daf7, Math['min'](_0xf9c305, _0x1efa0a));
}
function vector2(_0x5e03dd, _0x24b49a) {
  return [finite(_0x5e03dd?.[0x0], _0x24b49a[0x0]), finite(_0x5e03dd?.[0x1], _0x24b49a[0x1])];
}
function normalizeGroundRegion(_0x31a2f4, _0x51e220, _0x106f8d) {
  const _0x2f68e2 = [
    [0x0, clamp(_0x51e220 - _0x106f8d * 0.5, 0x0, 0x1)],
    [0x1, clamp(_0x51e220 + _0x106f8d * 0.5, 0x0, 0x1)],
    [0x1, 0x1],
    [0x0, 0x1],
  ];
  if (!Array['isArray'](_0x31a2f4) || _0x31a2f4['length'] < 0x3) return _0x2f68e2;
  return _0x31a2f4['slice'](0x0, 0x18)['map']((_0x42a42c) => {
    const _0x1041d2 = vector2(_0x42a42c, [0x0, 0x0]);
    return [clamp(_0x1041d2[0x0], 0x0, 0x1), clamp(_0x1041d2[0x1], 0x0, 0x1)];
  });
}
function aspectFromImage(_0x356ccb, _0x33dbde = 0x10 / 0x9) {
  const _0x2a0869 = Math['max'](0x0, finite(_0x356ccb?.['imageWidth'], 0x0)),
    _0x3b8b7d = Math['max'](0x0, finite(_0x356ccb?.['imageHeight'], 0x0));
  return _0x2a0869 > 0x0 && _0x3b8b7d > 0x0 ? _0x2a0869 / _0x3b8b7d : _0x33dbde;
}
export function computeStoryboard3DVerticalFov(_0x2bd8d0, _0x353662 = 0x10 / 0x9) {
  const _0x32e8e0 = (clamp(finite(_0x2bd8d0, 0x3c), 0xa, 0xaa) * Math['PI']) / 0xb4;
  return (
    (0x2 *
      Math['atan'](Math['tan'](_0x32e8e0 / 0x2) / Math['max'](0.1, finite(_0x353662, 0x10 / 0x9))) *
      0xb4) /
    Math['PI']
  );
}
export function computeStoryboard3DFocalLengthFromHorizontalFov(_0x23f641) {
  const _0x440a8f = (clamp(finite(_0x23f641, 0x3c), 0xa, 0xaa) * Math['PI']) / 0xb4;
  return 0x24 / (0x2 * Math['tan'](_0x440a8f / 0x2));
}
export function normalizeStoryboard3DBackgroundCalibration(_0x5ed7d3 = {}) {
  const _0x3ac92a = vector2(_0x5ed7d3['imageOffset'], [0x0, 0x0]),
    _0x48b9dc = vector2(_0x5ed7d3['vanishingPoint'], [0.5, 0.5]),
    _0x2ac84c = String(_0x5ed7d3['binaryAssetId'] || '')['trim'](),
    _0x582dc7 = clamp(finite(_0x5ed7d3['horizonY'], 0.5), 0x0, 0x1),
    _0x3b661f = clamp(finite(_0x5ed7d3['horizonSlope'], 0x0), -0x1, 0x1),
    _0x35bcc4 = Math['max'](0x0, Math['round'](finite(_0x5ed7d3['imageWidth'], 0x0))),
    _0x25f48f = Math['max'](0x0, Math['round'](finite(_0x5ed7d3['imageHeight'], 0x0))),
    _0x2902ba = String(_0x5ed7d3['calibrationMethod'] || 'manual')['trim']() || 'manual';
  return {
    imageUrl: String(_0x5ed7d3['imageUrl'] || '')['trim'](),
    ...(_0x2ac84c ? { binaryAssetId: _0x2ac84c } : {}),
    horizontalFov: clamp(finite(_0x5ed7d3['horizontalFov'], 0x3c), 0xa, 0xaa),
    verticalFov:
      _0x5ed7d3['verticalFov'] == null ? null : clamp(finite(_0x5ed7d3['verticalFov'], 0x28), 0xa, 0xaa),
    horizonY: _0x582dc7,
    horizonSlope: _0x3b661f,
    vanishingPoint: [clamp(_0x48b9dc[0x0], 0x0, 0x1), clamp(_0x48b9dc[0x1], 0x0, 0x1)],
    cameraHeight: clamp(finite(_0x5ed7d3['cameraHeight'], 1.6), 0.2, 0x14),
    imageWidth: _0x35bcc4,
    imageHeight: _0x25f48f,
    groundRegion: normalizeGroundRegion(_0x5ed7d3['groundRegion'], _0x582dc7, _0x3b661f),
    calibrationMethod: _0x2902ba,
    calibrationConfidence: clamp(
      finite(_0x5ed7d3['calibrationConfidence'], _0x2902ba === 'manual' ? 0x1 : 0x0),
      0x0,
      0x1,
    ),
    imageScale: clamp(finite(_0x5ed7d3['imageScale'], 0x1), 0.1, 0xa),
    imageOffset: [clamp(_0x3ac92a[0x0], -0x2, 0x2), clamp(_0x3ac92a[0x1], -0x2, 0x2)],
    lockedCamera: _0x5ed7d3['lockedCamera'] === !![],
    lockedCameraSnapshot: _0x5ed7d3['lockedCameraSnapshot']
      ? normalizeStoryboard3DBackgroundCamera(_0x5ed7d3['lockedCameraSnapshot'])
      : null,
  };
}
export function normalizeStoryboard3DBackgroundCamera(_0x2fa260 = {}) {
  const _0x7522c5 = clamp(finite(_0x2fa260['focalLength'], 0x32), 0x1, 0x12c);
  return {
    position: [0x0, 1.6, 0x5]['map']((_0x3c7474, _0x80f997) =>
      finite(_0x2fa260['position']?.[_0x80f997], _0x3c7474),
    ),
    target: [0x0, 1.2, 0x0]['map']((_0xc6d8a5, _0x4c3497) =>
      finite(_0x2fa260['target']?.[_0x4c3497], _0xc6d8a5),
    ),
    focalLength: _0x7522c5,
    fov: _0x2fa260['fov'] == null ? null : clamp(finite(_0x2fa260['fov'], 0x28), 0x1, 0xb3),
    roll: clamp(finite(_0x2fa260['roll'], 0x0), -Math['PI'], Math['PI']),
    near: Math['max'](0.001, finite(_0x2fa260['near'], 0.1)),
    far: Math['max'](0x1, finite(_0x2fa260['far'], 0x3e8)),
    aspectRatio: String(_0x2fa260['aspectRatio'] || '16:9'),
  };
}
export function deriveStoryboard3DBackgroundCamera(_0x4ccc5d, _0x4cbc3c = {}) {
  const _0xe3f39a = normalizeStoryboard3DBackgroundCalibration(_0x4ccc5d),
    _0x5a4681 = normalizeStoryboard3DBackgroundCamera(_0x4cbc3c),
    _0x4d59e8 = aspectFromImage(_0xe3f39a),
    _0x4e80de = (_0xe3f39a['horizontalFov'] * Math['PI']) / 0xb4,
    _0x461545 =
      _0xe3f39a['verticalFov'] || computeStoryboard3DVerticalFov(_0xe3f39a['horizontalFov'], _0x4d59e8),
    _0xe48d5e = (_0x461545 * Math['PI']) / 0xb4,
    _0x347fad = Math['atan']((0.5 - _0xe3f39a['horizonY']) * 0x2 * Math['tan'](_0xe48d5e / 0x2)),
    _0x17b346 = Math['atan']((_0xe3f39a['vanishingPoint'][0x0] - 0.5) * 0x2 * Math['tan'](_0x4e80de / 0x2)),
    _0x55a947 = Math['cos'](_0x347fad),
    _0x5a5305 = {
      x: Math['sin'](_0x17b346) * _0x55a947,
      y: -Math['sin'](_0x347fad),
      z: -Math['cos'](_0x17b346) * _0x55a947,
    },
    _0x121a7f = finite(_0x5a4681['target'][0x0], 0x0),
    _0x344c16 = finite(_0x5a4681['target'][0x2], 0x0),
    _0x124a72 = _0x347fad > 0.01 ? clamp(_0xe3f39a['cameraHeight'] / Math['tan'](_0x347fad), 1.5, 0x50) : 0xa,
    _0x123553 = [
      _0x121a7f - Math['sin'](_0x17b346) * _0x124a72,
      _0xe3f39a['cameraHeight'],
      _0x344c16 + Math['cos'](_0x17b346) * _0x124a72,
    ],
    _0x4534cd = _0x347fad > 0.01 ? _0x124a72 / Math['max'](0.001, _0x55a947) : 0xa,
    _0x599f60 = [
      _0x123553[0x0] + _0x5a5305['x'] * _0x4534cd,
      _0x123553[0x1] + _0x5a5305['y'] * _0x4534cd,
      _0x123553[0x2] + _0x5a5305['z'] * _0x4534cd,
    ],
    _0x3010df = _0xe3f39a['horizonSlope'] / Math['max'](0.1, _0x4d59e8);
  return normalizeStoryboard3DBackgroundCamera({
    ..._0x5a4681,
    position: _0x123553,
    target: _0x599f60,
    focalLength: computeStoryboard3DFocalLengthFromHorizontalFov(_0xe3f39a['horizontalFov']),
    fov: _0x461545,
    roll: -Math['atan'](_0x3010df),
  });
}
export function updateStoryboard3DBackgroundCalibration(_0x4d7267, _0x16d3f3 = {}) {
  const _0x3f8d6e = { ..._0x4d7267, ..._0x16d3f3 };
  return (
    (Object['prototype']['hasOwnProperty']['call'](_0x16d3f3, 'horizonY') ||
      Object['prototype']['hasOwnProperty']['call'](_0x16d3f3, 'horizonSlope')) &&
      !Object['prototype']['hasOwnProperty']['call'](_0x16d3f3, 'groundRegion') &&
      delete _0x3f8d6e['groundRegion'],
    normalizeStoryboard3DBackgroundCalibration(_0x3f8d6e)
  );
}
export function setStoryboard3DBackgroundCameraLock(_0x187ba5, _0x2874af, _0x48f8c1) {
  const _0xd72f80 = normalizeStoryboard3DBackgroundCalibration(_0x187ba5);
  return {
    ..._0xd72f80,
    lockedCamera: _0x2874af === !![],
    lockedCameraSnapshot: _0x2874af === !![] ? normalizeStoryboard3DBackgroundCamera(_0x48f8c1) : null,
  };
}
function camerasEqual(_0x575421, _0xcefcfb, _0x2e9365 = 0.000001) {
  const _0x27ccd7 = normalizeStoryboard3DBackgroundCamera(_0x575421),
    _0x54e71c = normalizeStoryboard3DBackgroundCamera(_0xcefcfb);
  return (
    [
      ..._0x27ccd7['position'],
      ..._0x27ccd7['target'],
      _0x27ccd7['focalLength'],
      _0x27ccd7['fov'] ?? 0x0,
      _0x27ccd7['roll'],
    ]['every'](
      (_0x1f5609, _0x487e77) =>
        Math['abs'](
          _0x1f5609 -
            [
              ..._0x54e71c['position'],
              ..._0x54e71c['target'],
              _0x54e71c['focalLength'],
              _0x54e71c['fov'] ?? 0x0,
              _0x54e71c['roll'],
            ][_0x487e77],
        ) <= _0x2e9365,
    ) && _0x27ccd7['aspectRatio'] === _0x54e71c['aspectRatio']
  );
}
export function guardStoryboard3DBackgroundCameraChange(_0x21d727, _0xfc9b6) {
  const _0xbbfeef = normalizeStoryboard3DBackgroundCalibration(_0x21d727);
  if (!_0xbbfeef['lockedCamera'] || !_0xbbfeef['lockedCameraSnapshot'])
    return { allowed: !![], camera: normalizeStoryboard3DBackgroundCamera(_0xfc9b6), reason: '' };
  if (camerasEqual(_0xbbfeef['lockedCameraSnapshot'], _0xfc9b6))
    return { allowed: !![], camera: normalizeStoryboard3DBackgroundCamera(_0xfc9b6), reason: '' };
  return {
    allowed: ![],
    camera: structuredClone(_0xbbfeef['lockedCameraSnapshot']),
    reason: '背景相机已锁定；请先解除锁定再修改机位、焦距或画幅。',
  };
}
export function computeStoryboard3DBackgroundProjection(_0x2d5ac4, _0x5b9b60 = {}) {
  const _0x11ff5d = normalizeStoryboard3DBackgroundCalibration(_0x2d5ac4),
    _0x3c38df = Math['max'](0x1, finite(_0x5b9b60['width'], 0x780)),
    _0xb4ecfd = Math['max'](0x1, finite(_0x5b9b60['height'], 0x438)),
    _0x1bbdd8 = (_0x11ff5d['horizontalFov'] * Math['PI']) / 0xb4,
    _0x575e1c = _0x3c38df / (0x2 * Math['tan'](_0x1bbdd8 / 0x2));
  return {
    focalPixels: _0x575e1c,
    horizonY: _0xb4ecfd * _0x11ff5d['horizonY'],
    horizonLine: [
      [0x0, _0xb4ecfd * clamp(_0x11ff5d['horizonY'] - _0x11ff5d['horizonSlope'] * 0.5, 0x0, 0x1)],
      [_0x3c38df, _0xb4ecfd * clamp(_0x11ff5d['horizonY'] + _0x11ff5d['horizonSlope'] * 0.5, 0x0, 0x1)],
    ],
    vanishingPoint: [
      _0x3c38df * _0x11ff5d['vanishingPoint'][0x0],
      _0xb4ecfd * _0x11ff5d['vanishingPoint'][0x1],
    ],
    groundRegion: _0x11ff5d['groundRegion']['map'](([_0x1e83eb, _0x309f47]) => [
      _0x3c38df * _0x1e83eb,
      _0xb4ecfd * _0x309f47,
    ]),
    calibrationConfidence: _0x11ff5d['calibrationConfidence'],
    imageScale: _0x11ff5d['imageScale'],
    imageOffsetPixels: [_0x3c38df * _0x11ff5d['imageOffset'][0x0], _0xb4ecfd * _0x11ff5d['imageOffset'][0x1]],
  };
}
