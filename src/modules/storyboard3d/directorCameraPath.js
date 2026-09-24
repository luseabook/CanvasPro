export function normalizeDirectorCameraPath(_0x20e933, _0xec9de9) {
  const _0x4bffb7 = new Set(Array['isArray'](_0x20e933?.['pointIds']) ? _0x20e933['pointIds'] : []);
  return {
    pointIds: _0xec9de9['filter']((_0x51dbbc) => _0x4bffb7['has'](_0x51dbbc['id']))['map'](
      (_0x37251b) => _0x37251b['id'],
    ),
  };
}
export function readDirectorCameraPath(_0x5ce6bc) {
  const _0x22aeb5 = new Set(_0x5ce6bc?.['cameraPath']?.['pointIds'] || []);
  return (_0x5ce6bc?.['cameraKeyframes'] || [])['filter']((_0x23ddad) => _0x22aeb5['has'](_0x23ddad['id']));
}
export function addDirectorCameraPathPoint(_0x164005, _0x430335) {
  const _0x91cc23 = readDirectorCameraPath(_0x164005),
    _0x39230a = _0x91cc23['length']
      ? _0x91cc23['at'](-0x1)['time'] + 0x1
      : Math['max'](0x0, ..._0x164005['cameraKeyframes']['map']((_0x10e844) => _0x10e844['time'])) + 0x1;
  if (_0x39230a > 0xe10) throw new Error('轨道已达到镜头时长上限。');
  if (_0x91cc23['length'] >= 0x64) throw new Error('每条轨道最多 100 个控制点。');
  const _0xcafbbf = structuredClone(_0x164005);
  if (!_0x91cc23['length'])
    _0xcafbbf['cameraPath'] = { pointIds: [_0xcafbbf['cameraKeyframes']['at'](-0x1)['id']] };
  const _0x226cf4 = {
    id: 'camera-path-' + globalThis['crypto']['randomUUID'](),
    time: _0x39230a,
    camera: structuredClone(_0x430335),
    easing: 'linear',
  };
  return (
    _0xcafbbf['cameraKeyframes']['push'](_0x226cf4),
    _0xcafbbf['cameraPath']['pointIds']['push'](_0x226cf4['id']),
    (_0xcafbbf['duration'] = Math['max'](_0xcafbbf['duration'], _0x39230a)),
    _0xcafbbf
  );
}
export function updateDirectorCameraPathPoint(_0x4ad9fd, _0x87923b, _0x29690d) {
  const _0x456332 = structuredClone(_0x4ad9fd),
    _0x1dc90b = _0x456332['cameraKeyframes']['find']((_0x4406b0) => _0x4406b0['id'] === _0x87923b);
  if (!_0x1dc90b) return _0x456332;
  if (_0x29690d['time'] != null) {
    const _0x3ef5a7 = Math['round'](Number(_0x29690d['time']) * _0x456332['fps']) / _0x456332['fps'];
    if (!Number['isFinite'](_0x3ef5a7) || _0x3ef5a7 < 0x0 || _0x3ef5a7 > 0xe10)
      throw new Error('控制点时间必须在\x200–3600\x20秒之间。');
    if (
      _0x456332['cameraKeyframes']['some'](
        (_0x10aeb3) =>
          _0x10aeb3['id'] !== _0x87923b &&
          Math['abs'](_0x10aeb3['time'] - _0x3ef5a7) < 0.5 / _0x456332['fps'],
      )
    )
      throw new Error('该帧已有摄像机控制点。');
    _0x1dc90b['time'] = _0x3ef5a7;
  }
  if (_0x29690d['camera']) _0x1dc90b['camera'] = structuredClone(_0x29690d['camera']);
  _0x29690d['easing'] && ((_0x1dc90b['easing'] = _0x29690d['easing']), delete _0x1dc90b['easingCurve']);
  for (const _0x234a81 of ['inTangent', 'outTangent', 'easingCurve']) {
    if (Object['hasOwn'](_0x29690d, _0x234a81)) {
      if (_0x29690d[_0x234a81]) _0x1dc90b[_0x234a81] = [..._0x29690d[_0x234a81]];
      else delete _0x1dc90b[_0x234a81];
    }
  }
  return (
    _0x456332['cameraKeyframes']['sort'](
      (_0x8ce1a6, _0x5cd2be) =>
        _0x8ce1a6['time'] - _0x5cd2be['time'] || _0x8ce1a6['id']['localeCompare'](_0x5cd2be['id']),
    ),
    (_0x456332['cameraPath'] = normalizeDirectorCameraPath(
      _0x456332['cameraPath'],
      _0x456332['cameraKeyframes'],
    )),
    _0x456332
  );
}
export function removeDirectorCameraPathPoint(_0x32b9c5, _0x5a25f1) {
  if (_0x32b9c5['cameraKeyframes']['length'] <= 0x1) throw new Error('至少保留一个摄像机控制点。');
  const _0x11ccfb = structuredClone(_0x32b9c5);
  return (
    (_0x11ccfb['cameraKeyframes'] = _0x11ccfb['cameraKeyframes']['filter'](
      (_0x36b427) => _0x36b427['id'] !== _0x5a25f1,
    )),
    (_0x11ccfb['cameraPath'] = normalizeDirectorCameraPath(
      _0x11ccfb['cameraPath'],
      _0x11ccfb['cameraKeyframes'],
    )),
    _0x11ccfb
  );
}
