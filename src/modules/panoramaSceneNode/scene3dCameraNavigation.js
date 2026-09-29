import * as threeRuntime from './threeRuntime.js';
import {
  PANORAMA_SCENE_CAMERA_CONSTRAINTS,
  resolveAdaptiveCameraClipPlanes,
} from '../../core/panoramaSceneMath.js';
import { estimateSceneAssetBoundingRadius } from './sceneAssetCatalog.js';
function resolveMaxScale(_0x1a69a7) {
  if (Number['isFinite'](Number(_0x1a69a7))) return Math['max'](0.01, Number(_0x1a69a7));
  return Math['max'](
    0.01,
    Number(_0x1a69a7?.['x']) || 0x1,
    Number(_0x1a69a7?.['y']) || 0x1,
    Number(_0x1a69a7?.['z']) || 0x1,
  );
}
export function estimateSceneContentBounds(_0x573050) {
  const _0x5b5851 = { center: { x: 0x0, y: 0x0, z: 0x0 }, radius: 0x10 },
    _0x25b9c6 = (_0x319bdc, _0x5235d7) => {
      const _0x4c9fac = _0x319bdc?.['position'] || {},
        _0xa5cd28 = _0x5235d7 * resolveMaxScale(_0x319bdc?.['scale']),
        _0x2e3744 = {
          x: Number(_0x4c9fac['x']) || 0x0,
          y: Number(_0x4c9fac['y']) || 0x0,
          z: Number(_0x4c9fac['z']) || 0x0,
        },
        _0x7adfdd = _0x2e3744['x'] - _0x5b5851['center']['x'],
        _0x43797c = _0x2e3744['y'] - _0x5b5851['center']['y'],
        _0x3d1720 = _0x2e3744['z'] - _0x5b5851['center']['z'],
        _0x582015 = Math['hypot'](_0x7adfdd, _0x43797c, _0x3d1720);
      if (_0x582015 + _0xa5cd28 <= _0x5b5851['radius']) return;
      if (_0x582015 + _0x5b5851['radius'] <= _0xa5cd28) {
        ((_0x5b5851['center'] = _0x2e3744), (_0x5b5851['radius'] = _0xa5cd28));
        return;
      }
      const _0x431937 = (_0x5b5851['radius'] + _0x582015 + _0xa5cd28) * 0.5,
        _0x240613 = _0x582015 > 1e-8 ? (_0x431937 - _0x5b5851['radius']) / _0x582015 : 0x0;
      ((_0x5b5851['center'] = {
        x: _0x5b5851['center']['x'] + _0x7adfdd * _0x240613,
        y: _0x5b5851['center']['y'] + _0x43797c * _0x240613,
        z: _0x5b5851['center']['z'] + _0x3d1720 * _0x240613,
      }),
        (_0x5b5851['radius'] = _0x431937));
    };
  return (
    (_0x573050?.['cubes'] || [])['forEach']((_0x349ad0) => {
      _0x25b9c6(_0x349ad0, estimateSceneAssetBoundingRadius(_0x349ad0?.['assetId']));
    }),
    (_0x573050?.['mannequins'] || [])['forEach']((_0x5d297f) => _0x25b9c6(_0x5d297f, 1.25)),
    (_0x573050?.['cameras'] || [])['forEach']((_0x1878bc) => _0x25b9c6(_0x1878bc, 0.35)),
    _0x5b5851
  );
}
export function estimateSceneContentExtent(_0x1b1c14) {
  const _0x29bcf6 = estimateSceneContentBounds(_0x1b1c14);
  return (
    Math['hypot'](_0x29bcf6['center']['x'], _0x29bcf6['center']['y'], _0x29bcf6['center']['z']) +
    _0x29bcf6['radius']
  );
}
export function readSceneObjectFrame({
  objectType: _0x34d3dc,
  objectId: _0x2bb103,
  cubeMap: _0x1d52ff,
  mannequinMap: _0x3821be,
  cameraMap: _0x23dbba,
  camera: _0x24fca2,
} = {}) {
  const _0x717137 = _0x34d3dc === 'camera' ? _0x23dbba : _0x34d3dc === 'mannequin' ? _0x3821be : _0x1d52ff,
    _0x49fa90 = _0x717137?.['get']?.(_0x2bb103),
    _0x5f2c91 =
      _0x34d3dc === 'mannequin'
        ? _0x49fa90?.['modelRoot'] || _0x49fa90?.['proxyRoot'] || _0x49fa90?.['group']
        : _0x34d3dc === 'camera'
          ? _0x49fa90?.['marker'] || _0x49fa90?.['group']
          : _0x49fa90?.['content'] || _0x49fa90?.['group'];
  if (!_0x5f2c91) return null;
  _0x5f2c91['updateWorldMatrix']?.(!![], !![]);
  const _0xa62e86 = new threeRuntime['Box3']()['setFromObject'](_0x5f2c91, !![]);
  if (_0xa62e86['isEmpty']()) return null;
  const _0x566a0c = _0xa62e86['getBoundingSphere'](new threeRuntime['Sphere']());
  return {
    center: { x: _0x566a0c['center']['x'], y: _0x566a0c['center']['y'], z: _0x566a0c['center']['z'] },
    radius: Math['max'](0.05, _0x566a0c['radius']),
    aspect: Math['max'](0.1, Number(_0x24fca2?.['aspect']) || 0x1),
    fov: Number(_0x24fca2?.['fov']) || 0x3a,
  };
}
export function readSceneSelectionFrame({
  selectionObjects: _0x34099e,
  cubeMap: _0x532245,
  mannequinMap: _0x3c680c,
  cameraMap: _0x17f62d,
  camera: _0x147588,
} = {}) {
  const _0x423c16 = (_0x34099e || [])
    ['map'](({ objectType: _0x20b221, objectId: _0x1eeca9 }) =>
      readSceneObjectFrame({
        objectType: _0x20b221,
        objectId: _0x1eeca9,
        cubeMap: _0x532245,
        mannequinMap: _0x3c680c,
        cameraMap: _0x17f62d,
        camera: _0x147588,
      }),
    )
    ['filter'](Boolean);
  if (_0x423c16['length'] <= 0x1) return _0x423c16[0x0] || null;
  const _0x217ee1 = new threeRuntime['Box3']();
  _0x423c16['forEach']((_0x1b794e) => {
    const _0x2ddbe6 = new threeRuntime['Vector3'](
        _0x1b794e['center']['x'],
        _0x1b794e['center']['y'],
        _0x1b794e['center']['z'],
      ),
      _0x2b702b = Math['max'](0.05, Number(_0x1b794e['radius']) || 0.5);
    (_0x217ee1['expandByPoint'](_0x2ddbe6['clone']()['addScalar'](_0x2b702b)),
      _0x217ee1['expandByPoint'](_0x2ddbe6['clone']()['addScalar'](-_0x2b702b)));
  });
  const _0x3a72bc = _0x217ee1['getBoundingSphere'](new threeRuntime['Sphere']());
  return {
    center: { x: _0x3a72bc['center']['x'], y: _0x3a72bc['center']['y'], z: _0x3a72bc['center']['z'] },
    radius: Math['max'](0.05, Number(_0x3a72bc['radius']) || 0.5),
    aspect: Math['max'](0.1, Number(_0x147588?.['aspect']) || 0x1),
    fov: Number(_0x147588?.['fov']) || 0x3a,
  };
}
export function resolvePointerDollyAnchor({
  raycaster: _0x48bd84,
  pickRoots: _0x171f61,
  sceneView: _0x57cc4d,
  camera: _0x2223d3,
} = {}) {
  if (!_0x48bd84?.['ray']) return null;
  const _0x917687 = Array['isArray'](_0x171f61) ? _0x171f61 : [],
    _0x492434 = _0x917687['length'] > 0x0 ? _0x48bd84['intersectObjects'](_0x917687, ![])[0x0] : null;
  if (_0x492434?.['point'])
    return { x: _0x492434['point']['x'], y: _0x492434['point']['y'], z: _0x492434['point']['z'] };
  const _0xff63a7 = PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene']['orbitDistance']['min'],
    _0x578a5e = PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene']['orbitDistance']['max'],
    _0x3c952d = Math['min'](_0x578a5e, Math['max'](_0xff63a7, Number(_0x57cc4d?.['orbitDistance']) || 0x8)),
    _0x56c915 = new threeRuntime['Vector3'](),
    _0x18bc10 = new threeRuntime['Plane'](new threeRuntime['Vector3'](0x0, 0x1, 0x0), 0x0),
    _0x435b23 = _0x48bd84['ray']['intersectPlane'](_0x18bc10, _0x56c915);
  if (_0x435b23 && _0x2223d3?.['position']?.['distanceTo']?.(_0x56c915) <= Math['max'](0x18, _0x3c952d * 0x6))
    return { x: _0x56c915['x'], y: _0x56c915['y'], z: _0x56c915['z'] };
  const _0x4a7f50 = _0x48bd84['ray']['at'](_0x3c952d, new threeRuntime['Vector3']());
  return { x: _0x4a7f50['x'], y: _0x4a7f50['y'], z: _0x4a7f50['z'] };
}
export function applyAdaptiveCameraProjection({
  camera: _0x28f3f0,
  pose: _0x3b5966,
  sceneState: _0x1994cd,
  sceneContentExtent: _0x367e58,
  sceneContentBounds: _0x568971,
  fallbackFov: fallbackFov = 0x3a,
} = {}) {
  if (!_0x28f3f0 || !_0x3b5966) return null;
  _0x28f3f0['fov'] = Number['isFinite'](Number(_0x3b5966['fov'])) ? Number(_0x3b5966['fov']) : fallbackFov;
  const _0x3dd25d = _0x1994cd?.['viewport']?.['sceneView']?.['target'] || { x: 0x0, y: 0x0, z: 0x0 },
    _0x2b922a = _0x3b5966['target'] || _0x3dd25d,
    _0x4a3a69 = Number['isFinite'](Number(_0x3b5966['distance']))
      ? Number(_0x3b5966['distance'])
      : Math['hypot'](
          (Number(_0x3b5966?.['position']?.['x']) || 0x0) - (Number(_0x2b922a?.['x']) || 0x0),
          (Number(_0x3b5966?.['position']?.['y']) || 0x0) - (Number(_0x2b922a?.['y']) || 0x0),
          (Number(_0x3b5966?.['position']?.['z']) || 0x0) - (Number(_0x2b922a?.['z']) || 0x0),
        ) || 0x8,
    _0x5a631f = _0x568971?.['center'] || { x: 0x0, y: 0x0, z: 0x0 },
    _0x4042db = Math['max'](0x0, Number(_0x568971?.['radius']) || 0x0),
    _0xdf1778 = _0x4042db
      ? Math['hypot'](
          (Number(_0x3b5966?.['position']?.['x']) || 0x0) - (Number(_0x5a631f['x']) || 0x0),
          (Number(_0x3b5966?.['position']?.['y']) || 0x0) - (Number(_0x5a631f['y']) || 0x0),
          (Number(_0x3b5966?.['position']?.['z']) || 0x0) - (Number(_0x5a631f['z']) || 0x0),
        ) + _0x4042db
      : 0x0,
    _0x35a5f4 = resolveAdaptiveCameraClipPlanes({
      focusDistance: _0x4a3a69,
      sceneExtent: _0x367e58,
      sceneDistance: _0xdf1778,
    });
  return (
    (_0x28f3f0['near'] = _0x35a5f4['near']),
    (_0x28f3f0['far'] = _0x35a5f4['far']),
    _0x28f3f0['updateProjectionMatrix'](),
    _0x35a5f4
  );
}
