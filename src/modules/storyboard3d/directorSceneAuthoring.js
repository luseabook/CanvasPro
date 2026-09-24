import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
export const DIRECTOR_AXIS_VIEWS = [
  ['front', '前', 0x0, 0x0],
  ['back', '后', Math['PI'], 0x0],
  ['left', '左', -Math['PI'] / 0x2, 0x0],
  ['right', '右', Math['PI'] / 0x2, 0x0],
  ['top', '上', 0x0, Math['PI'] / 0x2 - 0.0001],
  ['bottom', '下', 0x0, -Math['PI'] / 0x2 + 0.0001],
];
export function sampleDirectorGroundRoute(_0x2446b6, _0x55e456, _0x5ce33f = 0x0, _0x5268d0 = 0.25) {
  const _0x3a287a = _0x2446b6['slice'](0x1)['map']((_0x345f3d, _0x6e6eac) =>
      Math['hypot'](_0x345f3d[0x0] - _0x2446b6[_0x6e6eac][0x0], _0x345f3d[0x2] - _0x2446b6[_0x6e6eac][0x2]),
    ),
    _0x5e951b =
      0x1 +
      _0x3a287a['reduce'](
        (_0x5eb966, _0x488279) => _0x5eb966 + Math['max'](0x1, Math['ceil'](_0x488279 / _0x5268d0)),
        0x0,
      );
  if (_0x5e951b > 0x64) throw new Error('路径过长，精细贴地采样超过 100 点，请分段编排。');
  const _0x503061 = [];
  return (
    _0x2446b6['slice'](0x1)['forEach']((_0x584e51, _0x15050b) => {
      const _0x3adb32 = Math['max'](0x1, Math['ceil'](_0x3a287a[_0x15050b] / _0x5268d0));
      for (let _0x4729d6 = _0x15050b ? 0x1 : 0x0; _0x4729d6 <= _0x3adb32; _0x4729d6++) {
        const _0x513fec =
            _0x2446b6[_0x15050b][0x0] +
            ((_0x584e51[0x0] - _0x2446b6[_0x15050b][0x0]) * _0x4729d6) / _0x3adb32,
          _0x5c5dd7 =
            _0x2446b6[_0x15050b][0x2] +
            ((_0x584e51[0x2] - _0x2446b6[_0x15050b][0x2]) * _0x4729d6) / _0x3adb32;
        _0x503061['push']([_0x513fec, _0x55e456(_0x513fec, _0x5c5dd7) + _0x5ce33f, _0x5c5dd7]);
      }
    }),
    _0x503061
  );
}
export function transformDirectorScene(
  _0x97828f,
  { x: x = 0x0, y: y = 0x0, z: z = 0x0, yaw: yaw = 0x0, scale: scale = 0x1 } = {},
) {
  if (![x, y, z, yaw, scale]['every'](Number['isFinite']) || scale < 0.01 || scale > 0x64)
    throw new Error('整体变换参数无效，缩放应为 0.01–100。');
  if (_0x97828f['objects']['some']((_0x43dd4c) => _0x43dd4c['locked']))
    throw new Error('场景含锁定对象，请先解锁再整体变换。');
  const _0x4fb5f5 = structuredClone(_0x97828f),
    _0x47dafa = new threeRuntime['Quaternion']()['setFromAxisAngle'](
      new threeRuntime['Vector3'](0x0, 0x1, 0x0),
      (yaw * Math['PI']) / 0xb4,
    ),
    _0x5789ed = new threeRuntime['Matrix4']()['compose'](
      new threeRuntime['Vector3'](x, y, z),
      _0x47dafa,
      new threeRuntime['Vector3'](scale, scale, scale),
    ),
    _0x5dae5b = (_0x2890e5) =>
      new threeRuntime['Vector3'](..._0x2890e5)['applyMatrix4'](_0x5789ed)['toArray'](),
    _0x14b07a = (_0x33357b) =>
      new threeRuntime['Vector3'](..._0x33357b)
        ['applyQuaternion'](_0x47dafa)
        ['multiplyScalar'](scale)
        ['toArray'](),
    _0x46ada3 = (_0x1c9344) => {
      const _0x18af6b = new threeRuntime['Quaternion']()['setFromEuler'](
          new threeRuntime['Euler'](..._0x1c9344),
        ),
        _0x4c35bd = new threeRuntime['Euler']()['setFromQuaternion'](
          _0x47dafa['clone']()['multiply'](_0x18af6b),
        );
      return [_0x4c35bd['x'], _0x4c35bd['y'], _0x4c35bd['z']];
    },
    _0x53f0be = (_0x12a5fa) => {
      ((_0x12a5fa['position'] = _0x5dae5b(_0x12a5fa['position'])),
        (_0x12a5fa['target'] = _0x5dae5b(_0x12a5fa['target'])));
    };
  for (const _0x62ecb8 of _0x4fb5f5['objects']) {
    ((_0x62ecb8['transform']['position'] = _0x5dae5b(_0x62ecb8['transform']['position'])),
      (_0x62ecb8['transform']['rotation'] = _0x46ada3(_0x62ecb8['transform']['rotation'])),
      (_0x62ecb8['transform']['scale'] = _0x62ecb8['transform']['scale']['map'](
        (_0x2af841) => _0x2af841 * scale,
      )));
    if (_0x62ecb8['target']) _0x62ecb8['target'] = _0x5dae5b(_0x62ecb8['target']);
  }
  for (const _0x14cf48 of _0x4fb5f5['shots']) {
    _0x53f0be(_0x14cf48['camera']);
    for (const _0x20febf of _0x14cf48['animation']['cameraKeyframes']) {
      _0x53f0be(_0x20febf['camera']);
      for (const _0x4cffc4 of ['inTangent', 'outTangent'])
        if (_0x20febf[_0x4cffc4]) _0x20febf[_0x4cffc4] = _0x14b07a(_0x20febf[_0x4cffc4]);
    }
    for (const _0x37a2d2 of _0x14cf48['animation']['objectTracks']) {
      for (const _0x1607b3 of _0x37a2d2['positionKeyframes']) {
        _0x1607b3['value'] = _0x5dae5b(_0x1607b3['value']);
        for (const _0x58d755 of ['inTangent', 'outTangent'])
          if (_0x1607b3[_0x58d755]) _0x1607b3[_0x58d755] = _0x14b07a(_0x1607b3[_0x58d755]);
      }
      for (const _0x17bb45 of _0x37a2d2['rotationKeyframes'])
        _0x17bb45['value'] = _0x46ada3(_0x17bb45['value']);
      for (const _0x4f68e9 of _0x37a2d2['scaleKeyframes'])
        _0x4f68e9['value'] = _0x4f68e9['value']['map']((_0x34e05c) => _0x34e05c * scale);
    }
    for (const _0x4e1128 of [
      _0x14cf48['animation']['cameraConstraint'],
      ...(_0x14cf48['animation']['cameraConstraintClips'] || []),
    ]) {
      ((_0x4e1128['followOffset'] = _0x14b07a(_0x4e1128['followOffset'] || [0x0, 0x0, 0x0])),
        (_0x4e1128['lookAtOffset'] = _0x14b07a(_0x4e1128['lookAtOffset'])));
    }
  }
  return (
    (_0x4fb5f5['directorSettings']['groundHeight'] =
      _0x4fb5f5['directorSettings']['groundHeight'] * scale + y),
    _0x4fb5f5
  );
}
export function findDirectorObstacleRoute(
  _0x32d901,
  _0x5c51a4,
  _0x4dbe8d,
  { clearance: clearance = 0.4, step: step = 0.5 } = {},
) {
  ((step = Math['max'](0.1, Number(step) || 0.5)), (clearance = Math['max'](0x0, Number(clearance) || 0x0)));
  const _0x509a1d = Math['max'](0x3, clearance * 0x4),
    _0xc95c0 =
      Math['min'](_0x32d901[0x0], _0x5c51a4[0x0], ..._0x4dbe8d['map']((_0x288f7f) => _0x288f7f['min'][0x0])) -
      _0x509a1d,
    _0x30d575 =
      Math['min'](_0x32d901[0x2], _0x5c51a4[0x2], ..._0x4dbe8d['map']((_0x5a5e08) => _0x5a5e08['min'][0x2])) -
      _0x509a1d,
    _0x30be15 =
      Math['max'](_0x32d901[0x0], _0x5c51a4[0x0], ..._0x4dbe8d['map']((_0x3b0db3) => _0x3b0db3['max'][0x0])) +
      _0x509a1d,
    _0x20c86a =
      Math['max'](_0x32d901[0x2], _0x5c51a4[0x2], ..._0x4dbe8d['map']((_0x22a620) => _0x22a620['max'][0x2])) +
      _0x509a1d,
    _0x3ef3fc = Math['ceil']((_0x30be15 - _0xc95c0) / step) + 0x1,
    _0x348b5c = Math['ceil']((_0x20c86a - _0x30d575) / step) + 0x1;
  if (_0x3ef3fc * _0x348b5c > 0x186a0) throw new Error('避障区域过大，请减小场景范围或增大采样步长。');
  const _0x42dbcb = (_0x58f87e) => [
      Math['round']((_0x58f87e[0x0] - _0xc95c0) / step),
      Math['round']((_0x58f87e[0x2] - _0x30d575) / step),
    ],
    _0x34f936 = (_0x4dc766, _0x2854d4) => [
      _0xc95c0 + _0x4dc766 * step,
      _0x32d901[0x1],
      _0x30d575 + _0x2854d4 * step,
    ],
    _0x4d64fe = (_0x53d7b8, _0x35347d) => {
      const _0x3b09c4 = _0x34f936(_0x53d7b8, _0x35347d);
      return _0x4dbe8d['some'](
        (_0x2ca63b) =>
          _0x2ca63b['max'][0x1] > _0x32d901[0x1] + 0.1 &&
          _0x2ca63b['min'][0x1] < _0x32d901[0x1] + 1.8 &&
          _0x3b09c4[0x0] >= _0x2ca63b['min'][0x0] - clearance &&
          _0x3b09c4[0x0] <= _0x2ca63b['max'][0x0] + clearance &&
          _0x3b09c4[0x2] >= _0x2ca63b['min'][0x2] - clearance &&
          _0x3b09c4[0x2] <= _0x2ca63b['max'][0x2] + clearance,
      );
    },
    [_0x18f850, _0x5b71d2] = _0x42dbcb(_0x32d901),
    [_0x394e0a, _0x350f78] = _0x42dbcb(_0x5c51a4),
    _0x18091f = (_0x1df754, _0x4c4a47) => _0x4c4a47 * _0x3ef3fc + _0x1df754,
    _0x5d4d35 = _0x18091f(_0x394e0a, _0x350f78);
  if (_0x4d64fe(_0x18f850, _0x5b71d2) || _0x4d64fe(_0x394e0a, _0x350f78))
    throw new Error('路线起点或终点位于障碍物内，请先移开控制点。');
  const _0x58629c = new Map([[_0x18091f(_0x18f850, _0x5b71d2), null]]),
    _0x11ea2e = [[_0x18f850, _0x5b71d2]];
  for (let _0x47a113 = 0x0; _0x47a113 < _0x11ea2e['length']; _0x47a113++) {
    const [_0x75aa6c, _0x35b7e4] = _0x11ea2e[_0x47a113],
      _0x4bd813 = _0x18091f(_0x75aa6c, _0x35b7e4);
    if (_0x4bd813 === _0x5d4d35) break;
    for (const [_0x297b0a, _0x58c59d] of [
      [0x1, 0x0],
      [-0x1, 0x0],
      [0x0, 0x1],
      [0x0, -0x1],
    ]) {
      const _0x10a0a4 = _0x75aa6c + _0x297b0a,
        _0x6d808b = _0x35b7e4 + _0x58c59d,
        _0x129839 = _0x18091f(_0x10a0a4, _0x6d808b);
      if (
        _0x10a0a4 < 0x0 ||
        _0x6d808b < 0x0 ||
        _0x10a0a4 >= _0x3ef3fc ||
        _0x6d808b >= _0x348b5c ||
        _0x58629c['has'](_0x129839) ||
        _0x4d64fe(_0x10a0a4, _0x6d808b)
      )
        continue;
      (_0x58629c['set'](_0x129839, _0x4bd813), _0x11ea2e['push']([_0x10a0a4, _0x6d808b]));
    }
  }
  if (!_0x58629c['has'](_0x5d4d35)) throw new Error('当前障碍与间距下找不到可通行路线。');
  const _0x5ecb32 = [];
  for (let _0x2e0b48 = _0x5d4d35; _0x2e0b48 != null; _0x2e0b48 = _0x58629c['get'](_0x2e0b48))
    _0x5ecb32['push'](_0x34f936(_0x2e0b48 % _0x3ef3fc, Math['floor'](_0x2e0b48 / _0x3ef3fc)));
  (_0x5ecb32['reverse'](),
    (_0x5ecb32[0x0] = [..._0x32d901]),
    (_0x5ecb32[_0x5ecb32['length'] - 0x1] = [..._0x5c51a4]));
  const _0x3258a4 = _0x5ecb32['filter'](
    (_0x3b4cc0, _0x3000c1) =>
      _0x3000c1 === 0x0 ||
      _0x3000c1 === _0x5ecb32['length'] - 0x1 ||
      (_0x3b4cc0[0x0] - _0x5ecb32[_0x3000c1 - 0x1][0x0]) *
        (_0x5ecb32[_0x3000c1 + 0x1][0x2] - _0x3b4cc0[0x2]) !==
        (_0x3b4cc0[0x2] - _0x5ecb32[_0x3000c1 - 0x1][0x2]) *
          (_0x5ecb32[_0x3000c1 + 0x1][0x0] - _0x3b4cc0[0x0]),
  );
  if (_0x3258a4['length'] > 0x64) throw new Error('避障路径控制点超过 100 个，请调整障碍布局。');
  return _0x3258a4;
}
