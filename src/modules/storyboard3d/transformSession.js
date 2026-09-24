import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
const TRANSFORM_TOOLS = new Set(['move', 'rotate', 'scale']),
  AXIS_NAMES = ['x', 'y', 'z'];
function finiteNumber(_0x155baa, _0x470cbf = 0x0) {
  const _0x4497f9 = Number(_0x155baa);
  return Number['isFinite'](_0x4497f9) ? _0x4497f9 : _0x470cbf;
}
function cleanNumber(_0x470114) {
  const _0x2e85e5 = finiteNumber(_0x470114);
  return Math['abs'](_0x2e85e5) < 1e-12 ? 0x0 : _0x2e85e5;
}
function cloneVector(_0xecfcac, _0x5b2f8c) {
  const _0x53f88e = Array['isArray'](_0xecfcac) ? _0xecfcac : _0x5b2f8c;
  return _0x53f88e['map']((_0x5200b4, _0x1a9545) => finiteNumber(_0x5200b4, _0x5b2f8c[_0x1a9545]));
}
function cloneTransform(_0x1b2822 = {}) {
  return {
    position: cloneVector(_0x1b2822['position'], [0x0, 0x0, 0x0]),
    rotation: cloneVector(_0x1b2822['rotation'], [0x0, 0x0, 0x0]),
    scale: cloneVector(_0x1b2822['scale'], [0x1, 0x1, 0x1])['map']((_0x4da943) =>
      Math['max'](0.001, _0x4da943),
    ),
  };
}
function cloneTransforms(_0x1cf352 = {}) {
  return Object['fromEntries'](
    Object['entries'](_0x1cf352)['map'](([_0x34eecb, _0x4364a1]) => [_0x34eecb, cloneTransform(_0x4364a1)]),
  );
}
function toThreeVector3(_0x5c6dd4, _0x4092b9 = { x: 0x0, y: 0x0, z: 0x0 }) {
  return new threeRuntime['Vector3'](
    finiteNumber(_0x5c6dd4?.['x'], _0x4092b9['x']),
    finiteNumber(_0x5c6dd4?.['y'], _0x4092b9['y']),
    finiteNumber(_0x5c6dd4?.['z'], _0x4092b9['z']),
  );
}
function toThreeQuaternion(_0x52b949) {
  const _0x3749de = new threeRuntime['Quaternion'](
    finiteNumber(_0x52b949?.['x']),
    finiteNumber(_0x52b949?.['y']),
    finiteNumber(_0x52b949?.['z']),
    finiteNumber(_0x52b949?.['w'], 0x1),
  );
  return _0x3749de['lengthSq']() > 1e-12 ? _0x3749de['normalize']() : new threeRuntime['Quaternion']();
}
function normalizeConstraint(_0x17f736) {
  const _0x3f7952 = [
    ...new Set(
      String(_0x17f736 || '')
        ['toLowerCase']()
        ['match'](/[xyz]/g) || [],
    ),
  ]['filter']((_0x5a0762) => AXIS_NAMES['includes'](_0x5a0762));
  return AXIS_NAMES['filter']((_0x376470) => _0x3f7952['includes'](_0x376470))['join']('');
}
export function resolveStoryboard3DTransformConstraint(_0x366bd0 = {}) {
  const _0x1441d2 = normalizeConstraint(_0x366bd0['constraint']);
  if (_0x1441d2) return _0x1441d2;
  const _0x5e7e2d = String(_0x366bd0['handleKey'] || '')['toLowerCase']();
  if (_0x366bd0['mode'] === 'scale-uniform' || _0x5e7e2d === 'scale-uniform') return 'xyz';
  const _0x4c040a = _0x5e7e2d['match'](/(?:scale-)?plane-([xyz]{2})$/);
  if (_0x4c040a) return normalizeConstraint(_0x4c040a[0x1]);
  const _0x485799 = _0x5e7e2d['match'](/(?:axis|scale|rotate)-([xyz])$/);
  if (_0x485799) return _0x485799[0x1];
  return 'xyz';
}
function normalizeSettings(_0x28f7d2 = {}) {
  const _0x49f39e =
    _0x28f7d2['groundPositions'] && typeof _0x28f7d2['groundPositions'] === 'object'
      ? Object['fromEntries'](
          Object['entries'](_0x28f7d2['groundPositions'])
            ['map'](([_0x1f9bbb, _0x2548bd]) => [_0x1f9bbb, Number(_0x2548bd)])
            ['filter'](([, _0x514470]) => Number['isFinite'](_0x514470)),
        )
      : {};
  return {
    groundLock: _0x28f7d2['groundLock'] === !![],
    groundPositions: _0x49f39e,
    uniformScale: _0x28f7d2['uniformScale'] === !![],
    snapEnabled: _0x28f7d2['snapEnabled'] === !![] || _0x28f7d2['snap']?.['enabled'] === !![],
    translationSnap: Math['max'](
      0.0001,
      finiteNumber(_0x28f7d2['translationSnap'] ?? _0x28f7d2['snap']?.['translation'], 0.25),
    ),
    rotationSnap: Math['max'](
      0.0001,
      finiteNumber(_0x28f7d2['rotationSnap'] ?? _0x28f7d2['snap']?.['rotation'], Math['PI'] / 0xc),
    ),
    scaleSnap: Math['max'](0.0001, finiteNumber(_0x28f7d2['scaleSnap'] ?? _0x28f7d2['snap']?.['scale'], 0.1)),
  };
}
function transformsShareOrientation(_0x13f667) {
  const _0x585a9f = Object['values'](_0x13f667);
  if (_0x585a9f['length'] < 0x2) return !![];
  const _0x3ab998 = new threeRuntime['Quaternion']()['setFromEuler'](
    new threeRuntime['Euler'](..._0x585a9f[0x0]['rotation'], 'XYZ'),
  );
  return _0x585a9f['slice'](0x1)['every']((_0x2660b5) => {
    const _0x557874 = new threeRuntime['Quaternion']()['setFromEuler'](
      new threeRuntime['Euler'](..._0x2660b5['rotation'], 'XYZ'),
    );
    return Math['abs'](0x1 - Math['abs'](_0x3ab998['dot'](_0x557874))) < 0.00001;
  });
}
export function createStoryboard3DTransformSession({
  sceneId: _0x57ce4c,
  activeTool: _0x555528,
  initialTransforms: _0x51b3f0,
  dragState: _0x302e80,
  settings: _0x1b6eca,
} = {}) {
  const _0x3d1bee = TRANSFORM_TOOLS['has'](_0x555528) ? _0x555528 : 'move',
    _0x3d314c = cloneTransforms(_0x51b3f0);
  if (Object['keys'](_0x3d314c)['length'] === 0x0) return null;
  return {
    sceneId: String(_0x57ce4c || ''),
    activeTool: _0x3d1bee,
    initialTransforms: _0x3d314c,
    latestTransforms: cloneTransforms(_0x3d314c),
    dragState: _0x302e80 || {},
    constraint: resolveStoryboard3DTransformConstraint(_0x302e80),
    pivot: toThreeVector3(_0x302e80?.['pivot']),
    axisWorld: toThreeVector3(_0x302e80?.['axisWorld'] || _0x302e80?.['axis'], { x: 0x1, y: 0x0, z: 0x0 })[
      'normalize'
    ](),
    gizmoQuaternion: toThreeQuaternion(_0x302e80?.['gizmoQuaternion']),
    settings: normalizeSettings(_0x1b6eca),
    forcedUniformScale: _0x3d1bee === 'scale' && !transformsShareOrientation(_0x3d314c),
  };
}
function resolveSnapEnabled(_0x3c4eb1, _0x529da9) {
  return _0x529da9 ? !_0x3c4eb1['snapEnabled'] : _0x3c4eb1['snapEnabled'];
}
function snapDelta(_0x505455, _0x3cddd0) {
  return Math['round'](_0x505455 / _0x3cddd0) * _0x3cddd0;
}
function updateMoveSession(_0x4229d4, _0x556545, { precision: _0x2b8d55, toggleSnap: _0x496b8c }) {
  let _0x2c1c33 = toThreeVector3(_0x556545);
  if (_0x2b8d55) _0x2c1c33['multiplyScalar'](0.1);
  if (resolveSnapEnabled(_0x4229d4['settings'], _0x496b8c)) {
    const _0x1819c4 = new Set(_0x4229d4['constraint'] || 'xyz');
    ((_0x2c1c33 = _0x2c1c33['applyQuaternion'](_0x4229d4['gizmoQuaternion']['clone']()['invert']())),
      AXIS_NAMES['forEach']((_0x4a5617) => {
        _0x2c1c33[_0x4a5617] = _0x1819c4['has'](_0x4a5617)
          ? snapDelta(_0x2c1c33[_0x4a5617], _0x4229d4['settings']['translationSnap'])
          : 0x0;
      }),
      _0x2c1c33['applyQuaternion'](_0x4229d4['gizmoQuaternion']));
  }
  return Object['fromEntries'](
    Object['entries'](_0x4229d4['initialTransforms'])['map'](([_0x244f09, _0x257b53]) => {
      const _0x57a3c9 = cloneTransform(_0x257b53);
      _0x57a3c9['position'] = _0x57a3c9['position']['map']((_0x3960c0, _0x800d0d) =>
        cleanNumber(_0x3960c0 + [_0x2c1c33['x'], _0x2c1c33['y'], _0x2c1c33['z']][_0x800d0d]),
      );
      const _0x18be2a = _0x4229d4['settings']['groundPositions'][_0x244f09];
      if (_0x4229d4['settings']['groundLock'] && Number['isFinite'](_0x18be2a))
        _0x57a3c9['position'][0x1] = _0x18be2a;
      return [_0x244f09, _0x57a3c9];
    }),
  );
}
function updateRotateSession(_0x4b0c2c, _0x54d01c, { precision: _0x18ff94, toggleSnap: _0x18f4a5 }) {
  let _0x144eb5 = finiteNumber(_0x54d01c);
  if (_0x18ff94) _0x144eb5 *= 0.1;
  resolveSnapEnabled(_0x4b0c2c['settings'], _0x18f4a5) &&
    (_0x144eb5 = snapDelta(_0x144eb5, _0x4b0c2c['settings']['rotationSnap']));
  const _0x47ffb3 = new threeRuntime['Quaternion']()['setFromAxisAngle'](_0x4b0c2c['axisWorld'], _0x144eb5);
  return Object['fromEntries'](
    Object['entries'](_0x4b0c2c['initialTransforms'])['map'](([_0x196fd7, _0x372405]) => {
      const _0xe28573 = cloneTransform(_0x372405),
        _0xb1282c = new threeRuntime['Vector3'](..._0x372405['position'])
          ['sub'](_0x4b0c2c['pivot'])
          ['applyQuaternion'](_0x47ffb3)
          ['add'](_0x4b0c2c['pivot']),
        _0x1978a8 = new threeRuntime['Quaternion']()['setFromEuler'](
          new threeRuntime['Euler'](..._0x372405['rotation'], 'XYZ'),
        ),
        _0x19c994 = new threeRuntime['Euler']()['setFromQuaternion'](
          _0x47ffb3['clone']()['multiply'](_0x1978a8)['normalize'](),
          'XYZ',
        );
      return (
        (_0xe28573['position'] = _0xb1282c['toArray']()['map'](cleanNumber)),
        (_0xe28573['rotation'] = [_0x19c994['x'], _0x19c994['y'], _0x19c994['z']]['map'](cleanNumber)),
        [_0x196fd7, _0xe28573]
      );
    }),
  );
}
function updateScaleSession(_0x53358d, _0x252dc2, { precision: _0x7bd4e3, toggleSnap: _0x2e4c40 }) {
  let _0x1d536c = Math['max'](0.001, finiteNumber(_0x252dc2, 0x1));
  if (_0x7bd4e3) _0x1d536c = 0x1 + (_0x1d536c - 0x1) * 0.1;
  resolveSnapEnabled(_0x53358d['settings'], _0x2e4c40) &&
    (_0x1d536c = 0x1 + snapDelta(_0x1d536c - 0x1, _0x53358d['settings']['scaleSnap']));
  _0x1d536c = Math['max'](0.001, _0x1d536c);
  const _0x485aa2 =
      _0x53358d['settings']['uniformScale'] || _0x53358d['forcedUniformScale']
        ? 'xyz'
        : _0x53358d['constraint'],
    _0x48daed = new Set(_0x485aa2 || 'xyz'),
    _0x247a1a = Object['keys'](_0x53358d['initialTransforms'])['length'] > 0x1,
    _0x11aac9 = _0x53358d['gizmoQuaternion']['clone']()['invert']();
  return Object['fromEntries'](
    Object['entries'](_0x53358d['initialTransforms'])['map'](([_0x46bc94, _0x180b26]) => {
      const _0x44868d = cloneTransform(_0x180b26);
      _0x44868d['scale'] = _0x44868d['scale']['map']((_0x29bde8, _0x112579) =>
        _0x48daed['has'](AXIS_NAMES[_0x112579])
          ? Math['max'](0.001, cleanNumber(_0x29bde8 * _0x1d536c))
          : _0x29bde8,
      );
      if (_0x247a1a) {
        const _0x30ca4f = new threeRuntime['Vector3'](..._0x180b26['position'])
          ['sub'](_0x53358d['pivot'])
          ['applyQuaternion'](_0x11aac9);
        (AXIS_NAMES['forEach']((_0x1c02bf) => {
          if (_0x48daed['has'](_0x1c02bf)) _0x30ca4f[_0x1c02bf] *= _0x1d536c;
        }),
          (_0x44868d['position'] = _0x30ca4f['applyQuaternion'](_0x53358d['gizmoQuaternion'])
            ['add'](_0x53358d['pivot'])
            ['toArray']()
            ['map'](cleanNumber)));
      }
      return [_0x46bc94, _0x44868d];
    }),
  );
}
export function updateStoryboard3DTransformSession(
  _0x5b36ee,
  _0xfa2f9b,
  { precision: precision = ![], toggleSnap: toggleSnap = ![] } = {},
) {
  if (!_0x5b36ee) return {};
  const _0x26ebdf = { precision: precision === !![], toggleSnap: toggleSnap === !![] },
    _0x58be39 =
      _0x5b36ee['activeTool'] === 'move'
        ? updateMoveSession(_0x5b36ee, _0xfa2f9b, _0x26ebdf)
        : _0x5b36ee['activeTool'] === 'rotate'
          ? updateRotateSession(_0x5b36ee, _0xfa2f9b, _0x26ebdf)
          : updateScaleSession(_0x5b36ee, _0xfa2f9b, _0x26ebdf);
  return ((_0x5b36ee['latestTransforms'] = cloneTransforms(_0x58be39)), _0x58be39);
}
