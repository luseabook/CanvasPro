import * as threeRuntime from './threeRuntime.js';
import { applyAdaptiveCameraProjection } from './scene3dCameraNavigation.js';
function positive(_0x9b04fa, _0x10a2f5, _0x3e69f8 = 0.001) {
  const _0x133708 = Number(_0x9b04fa);
  return Math['max'](_0x3e69f8, Number['isFinite'](_0x133708) && _0x133708 > 0x0 ? _0x133708 : _0x10a2f5);
}
export function createScene3DViewProjectionState(_0xe648ec) {
  return {
    viewport: { width: 0x1, height: 0x1 },
    view: {
      type: 'perspective',
      verticalSize: 0x14,
      near: positive(_0xe648ec?.['near'], 0.1),
      far: positive(_0xe648ec?.['far'], 0xfa, 0x1),
      axis: null,
      top: ![],
      center: null,
    },
    perspective: {
      fov: positive(_0xe648ec?.['fov'], 0x37, 0x1),
      near: positive(_0xe648ec?.['near'], 0.1),
      far: positive(_0xe648ec?.['far'], 0xfa, 0x1),
    },
  };
}
export function rememberScene3DPerspectiveProjection(_0x2ffdc5, _0x4d9a57) {
  if (!_0x2ffdc5 || !_0x4d9a57?.['isPerspectiveCamera']) return;
  _0x2ffdc5['perspective'] = {
    fov: positive(_0x4d9a57['fov'], _0x2ffdc5['perspective']['fov'], 0x1),
    near: positive(_0x4d9a57['near'], _0x2ffdc5['perspective']['near']),
    far: positive(_0x4d9a57['far'], _0x2ffdc5['perspective']['far'], 0x1),
  };
}
export function applyScene3DViewProjectionSize(_0x4a685a, _0x14dd1, _0x385078, _0x16df63) {
  if (!_0x4a685a || !_0x14dd1) return;
  const _0x3cb280 = positive(_0x385078, _0x4a685a['viewport']['width'], 0x1),
    _0x59690e = positive(_0x16df63, _0x4a685a['viewport']['height'], 0x1);
  _0x4a685a['viewport'] = { width: _0x3cb280, height: _0x59690e };
  const _0x4add40 = _0x3cb280 / _0x59690e;
  if (_0x14dd1['isOrthographicCamera']) {
    const _0x3e12fc = positive(_0x4a685a['view']['verticalSize'], 0x14, 0.1) * 0.5,
      _0x2c5166 = _0x3e12fc * _0x4add40;
    ((_0x14dd1['left'] = -_0x2c5166),
      (_0x14dd1['right'] = _0x2c5166),
      (_0x14dd1['top'] = _0x3e12fc),
      (_0x14dd1['bottom'] = -_0x3e12fc));
  } else _0x14dd1['aspect'] = _0x4add40;
  _0x14dd1['updateProjectionMatrix']();
}
export function switchScene3DViewProjection(_0x1a7531, _0x568218, _0x2909ea, _0x5b846e = {}) {
  const _0x30c399 =
      _0x2909ea && typeof _0x2909ea === 'object' ? _0x2909ea : { ..._0x5b846e, type: _0x2909ea },
    _0x5a9dfc =
      _0x30c399['type'] === 'orthographic' || _0x30c399['projection'] === 'orthographic'
        ? 'orthographic'
        : 'perspective';
  rememberScene3DPerspectiveProjection(_0x1a7531, _0x568218);
  const _0x3d1b5f = positive(_0x30c399['verticalSize'], _0x1a7531['view']['verticalSize'], 0.1),
    _0xc11939 = _0x5a9dfc === 'orthographic' ? 0.01 : _0x1a7531['perspective']['near'],
    _0x1a412b = positive(_0x30c399['near'], _0xc11939),
    _0x1914fb = _0x5a9dfc === 'orthographic' ? 0x3e8 : _0x1a7531['perspective']['far'],
    _0x338b4e = Math['max'](_0x1a412b + 0x1, positive(_0x30c399['far'], _0x1914fb, 0x1)),
    _0x175d45 =
      _0x5a9dfc === 'orthographic'
        ? ['top', 'front', 'right']['includes'](_0x30c399['axis'])
          ? _0x30c399['axis']
          : _0x30c399['top'] === !![]
            ? 'top'
            : null
        : null;
  _0x1a7531['view'] = {
    type: _0x5a9dfc,
    verticalSize: _0x3d1b5f,
    near: _0x1a412b,
    far: _0x338b4e,
    axis: _0x175d45,
    top: _0x175d45 === 'top',
    center: _0x30c399['center'] ? { ..._0x30c399['center'] } : null,
  };
  const _0x469666 =
    _0x5a9dfc === 'orthographic' ? _0x568218?.['isOrthographicCamera'] : _0x568218?.['isPerspectiveCamera'];
  let _0x3668b4 = _0x568218;
  return (
    !_0x469666 &&
      ((_0x3668b4 =
        _0x5a9dfc === 'orthographic'
          ? new threeRuntime['OrthographicCamera'](-0x1, 0x1, 0x1, -0x1, _0x1a412b, _0x338b4e)
          : new threeRuntime['PerspectiveCamera'](
              _0x1a7531['perspective']['fov'],
              0x1,
              _0x1a7531['perspective']['near'],
              _0x1a7531['perspective']['far'],
            )),
      (_0x3668b4['rotation']['order'] = 'YXZ'),
      _0x3668b4['position']['copy'](_0x568218['position']),
      _0x3668b4['quaternion']['copy'](_0x568218['quaternion']),
      _0x3668b4['up']['copy'](_0x568218['up'])),
    _0x3668b4['isOrthographicCamera'] && ((_0x3668b4['near'] = _0x1a412b), (_0x3668b4['far'] = _0x338b4e)),
    applyScene3DViewProjectionSize(
      _0x1a7531,
      _0x3668b4,
      _0x1a7531['viewport']['width'],
      _0x1a7531['viewport']['height'],
    ),
    _0x3668b4
  );
}
export function readScene3DViewProjection(_0x410843) {
  return {
    ..._0x410843['view'],
    center: _0x410843['view']['center'] ? { ..._0x410843['view']['center'] } : null,
  };
}
export function resolveScene3DOrthographicPose(_0x4128e3, _0x48747b, _0x4626fe) {
  if (_0x4128e3?.['view']?.['type'] !== 'orthographic') return null;
  const _0x2573a3 = ['top', 'front', 'right']['includes'](_0x4128e3['view']['axis'])
    ? _0x4128e3['view']['axis']
    : _0x4128e3['view']['top'] === !![]
      ? 'top'
      : null;
  if (!_0x2573a3) return null;
  const _0x3bef10 = _0x4128e3['view']['center'] || _0x48747b?.['target'] || { x: 0x0, y: 0x0, z: 0x0 };
  return {
    axis: _0x2573a3,
    target: _0x3bef10,
    distance: Math['max'](0.1, Number(_0x48747b?.['distance']) || Number(_0x4626fe) || 0x14),
  };
}
export function resolveScene3DOrthographicTopPose(_0x4a17d6, _0x5cbee4, _0x5e6a17) {
  const _0x37ff3f = resolveScene3DOrthographicPose(_0x4a17d6, _0x5cbee4, _0x5e6a17);
  return _0x37ff3f?.['axis'] === 'top' ? _0x37ff3f : null;
}
export function computeScene3DWorldUnitsPerPixel(_0x2ae5d6, _0x2be0a1, _0x1154ca) {
  const _0x5cb75b = positive(_0x2be0a1, 0x1, 0x1);
  if (_0x2ae5d6?.['isOrthographicCamera'])
    return Math['abs'](_0x2ae5d6['top'] - _0x2ae5d6['bottom']) / positive(_0x2ae5d6['zoom'], 0x1) / _0x5cb75b;
  if (!_0x2ae5d6?.['position'] || !_0x1154ca) return 0x0;
  const _0x54567f = Math['max'](0.001, _0x2ae5d6['position']['distanceTo'](_0x1154ca)),
    _0x304053 = (positive(_0x2ae5d6['fov'], 0x3a, 0x1) * Math['PI']) / 0xb4;
  return (0x2 * Math['tan'](_0x304053 / 0x2) * _0x54567f) / _0x5cb75b;
}
function resolveBridgeState(_0x36eef6) {
  return (
    !_0x36eef6['_viewProjectionState'] &&
      (_0x36eef6['_viewProjectionState'] = createScene3DViewProjectionState(_0x36eef6['camera'])),
    _0x36eef6['_viewProjectionState']
  );
}
export function resizeBridgeViewProjection(_0x4c25f9, _0x319599, _0x23dc95) {
  applyScene3DViewProjectionSize(resolveBridgeState(_0x4c25f9), _0x4c25f9['camera'], _0x319599, _0x23dc95);
}
export function switchBridgeViewProjection(_0x580a0a, _0x150406, _0xbaeb35) {
  return (
    (_0x580a0a['camera'] = switchScene3DViewProjection(
      resolveBridgeState(_0x580a0a),
      _0x580a0a['camera'],
      _0x150406,
      _0xbaeb35,
    )),
    readScene3DViewProjection(_0x580a0a['_viewProjectionState'])
  );
}
export function readBridgeViewProjection(_0x5c5e68) {
  return readScene3DViewProjection(resolveBridgeState(_0x5c5e68));
}
export function readBridgePerspectiveFov(_0x984805) {
  return _0x984805['camera']?.['isPerspectiveCamera']
    ? _0x984805['camera']['fov']
    : resolveBridgeState(_0x984805)['perspective']['fov'];
}
export function applyBridgeCameraProjection(_0x5d1711, _0x36470c, _0x40328d) {
  const _0x20cd0d = resolveBridgeState(_0x5d1711);
  _0x5d1711['camera']['isPerspectiveCamera'] &&
    (applyAdaptiveCameraProjection({
      camera: _0x5d1711['camera'],
      pose: _0x36470c,
      sceneState: _0x5d1711['_sceneState'],
      sceneContentExtent: _0x5d1711['_sceneContentExtent'],
      sceneContentBounds: _0x5d1711['_sceneContentBounds'],
      fallbackFov: _0x40328d,
    }),
    rememberScene3DPerspectiveProjection(_0x20cd0d, _0x5d1711['camera']));
  const _0x9697bc = resolveScene3DOrthographicPose(_0x20cd0d, _0x36470c, _0x5d1711['_sceneContentExtent']);
  if (_0x9697bc) {
    const { axis: _0x4ba026, target: _0x53a371, distance: _0x3bb3e8 } = _0x9697bc;
    return (
      _0x4ba026 === 'top'
        ? (_0x5d1711['camera']['up']['set'](0x0, 0x0, -0x1),
          _0x5d1711['camera']['position']['set'](_0x53a371['x'], _0x53a371['y'] + _0x3bb3e8, _0x53a371['z']))
        : (_0x5d1711['camera']['up']['set'](0x0, 0x1, 0x0),
          _0x5d1711['camera']['position']['set'](
            _0x4ba026 === 'right' ? _0x53a371['x'] + _0x3bb3e8 : _0x53a371['x'],
            _0x53a371['y'],
            _0x4ba026 === 'front' ? _0x53a371['z'] + _0x3bb3e8 : _0x53a371['z'],
          )),
      _0x5d1711['camera']['lookAt'](_0x53a371['x'], _0x53a371['y'], _0x53a371['z']),
      !![]
    );
  }
  return (_0x5d1711['camera']['up']['set'](0x0, 0x1, 0x0), ![]);
}
