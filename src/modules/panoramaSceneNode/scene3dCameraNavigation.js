import * as threeRuntime from './threeRuntime.js';
import {
  PANORAMA_SCENE_CAMERA_CONSTRAINTS,
  resolveAdaptiveCameraClipPlanes,
} from '../../core/panoramaSceneMath.js';
import { estimateSceneAssetBoundingRadius } from './sceneAssetCatalog.js';
function resolveMaxScale(box) {
  if (Number['isFinite'](Number(box))) return Math['max'](0.01, Number(box));
  return Math['max'](0.01, Number(box?.['x']) || 0x1, Number(box?.['y']) || 0x1, Number(box?.['z']) || 0x1);
}
export function estimateSceneContentBounds(value) {
  const x2 = { center: { x: 0x0, y: 0x0, z: 0x0 }, radius: 0x10 },
    handler = (box2, item) => {
      const box3 = box2?.['position'] || {},
        key = item * resolveMaxScale(box2?.['scale']),
        box4 = {
          x: Number(box3['x']) || 0x0,
          y: Number(box3['y']) || 0x0,
          z: Number(box3['z']) || 0x0,
        },
        index = box4['x'] - x2['center']['x'],
        result = box4['y'] - x2['center']['y'],
        data = box4['z'] - x2['center']['z'],
        count = Math['hypot'](index, result, data);
      if (count + key <= x2['radius']) return;
      if (count + x2['radius'] <= key) {
        ((x2['center'] = box4), (x2['radius'] = key));
        return;
      }
      const options = (x2['radius'] + count + key) * 0.5,
        target = count > 1e-8 ? (options - x2['radius']) / count : 0x0;
      ((x2['center'] = {
        x: x2['center']['x'] + index * target,
        y: x2['center']['y'] + result * target,
        z: x2['center']['z'] + data * target,
      }),
        (x2['radius'] = options));
    };
  return (
    (value?.['cubes'] || [])['forEach']((source) => {
      handler(source, estimateSceneAssetBoundingRadius(source?.['assetId']));
    }),
    (value?.['mannequins'] || [])['forEach']((next) => handler(next, 1.25)),
    (value?.['cameras'] || [])['forEach']((current) => handler(current, 0.35)),
    x2
  );
}
export function estimateSceneContentExtent(entry) {
  const estimateSceneContentBounds2 = estimateSceneContentBounds(entry);
  return (
    Math['hypot'](
      estimateSceneContentBounds2['center']['x'],
      estimateSceneContentBounds2['center']['y'],
      estimateSceneContentBounds2['center']['z'],
    ) + estimateSceneContentBounds2['radius']
  );
}
export function readSceneObjectFrame({
  objectType: objectType,
  objectId: objectId,
  cubeMap: cubeMap,
  mannequinMap: mannequinMap,
  cameraMap: cameraMap,
  camera: camera,
} = {}) {
  const map = objectType === 'camera' ? cameraMap : objectType === 'mannequin' ? mannequinMap : cubeMap,
    record = map?.['get']?.(objectId),
    enabled =
      objectType === 'mannequin'
        ? record?.['modelRoot'] || record?.['proxyRoot'] || record?.['group']
        : objectType === 'camera'
          ? record?.['marker'] || record?.['group']
          : record?.['content'] || record?.['group'];
  if (!enabled) return null;
  enabled['updateWorldMatrix']?.(!![], !![]);
  const payload = new threeRuntime['Box3']()['setFromObject'](enabled, !![]);
  if (payload['isEmpty']()) return null;
  const x3 = payload['getBoundingSphere'](new threeRuntime['Sphere']());
  return {
    center: { x: x3['center']['x'], y: x3['center']['y'], z: x3['center']['z'] },
    radius: Math['max'](0.05, x3['radius']),
    aspect: Math['max'](0.1, Number(camera?.['aspect']) || 0x1),
    fov: Number(camera?.['fov']) || 0x3a,
  };
}
export function readSceneSelectionFrame({
  selectionObjects: selectionObjects,
  cubeMap: cubeMap2,
  mannequinMap: mannequinMap2,
  cameraMap: cameraMap2,
  camera: camera2,
} = {}) {
  const list = (selectionObjects || [])
    ['map'](({ objectType: objectType2, objectId: objectId2 }) =>
      readSceneObjectFrame({
        objectType: objectType2,
        objectId: objectId2,
        cubeMap: cubeMap2,
        mannequinMap: mannequinMap2,
        cameraMap: cameraMap2,
        camera: camera2,
      }),
    )
    ['filter'](Boolean);
  if (list['length'] <= 0x1) return list[0x0] || null;
  const handle = new threeRuntime['Box3']();
  list['forEach']((state) => {
    const config = new threeRuntime['Vector3'](
        state['center']['x'],
        state['center']['y'],
        state['center']['z'],
      ),
      scope = Math['max'](0.05, Number(state['radius']) || 0.5);
    (handle['expandByPoint'](config['clone']()['addScalar'](scope)),
      handle['expandByPoint'](config['clone']()['addScalar'](-scope)));
  });
  const x4 = handle['getBoundingSphere'](new threeRuntime['Sphere']());
  return {
    center: { x: x4['center']['x'], y: x4['center']['y'], z: x4['center']['z'] },
    radius: Math['max'](0.05, Number(x4['radius']) || 0.5),
    aspect: Math['max'](0.1, Number(camera2?.['aspect']) || 0x1),
    fov: Number(camera2?.['fov']) || 0x3a,
  };
}
export function resolvePointerDollyAnchor({
  raycaster: raycaster,
  pickRoots: pickRoots,
  sceneView: sceneView,
  camera: camera3,
} = {}) {
  if (!raycaster?.['ray']) return null;
  const list2 = Array['isArray'](pickRoots) ? pickRoots : [],
    x5 = list2['length'] > 0x0 ? raycaster['intersectObjects'](list2, ![])[0x0] : null;
  if (x5?.['point']) return { x: x5['point']['x'], y: x5['point']['y'], z: x5['point']['z'] };
  const input = PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene']['orbitDistance']['min'],
    output = PANORAMA_SCENE_CAMERA_CONSTRAINTS['scene']['orbitDistance']['max'],
    value2 = Math['min'](output, Math['max'](input, Number(sceneView?.['orbitDistance']) || 0x8)),
    x6 = new threeRuntime['Vector3'](),
    value3 = new threeRuntime['Plane'](new threeRuntime['Vector3'](0x0, 0x1, 0x0), 0x0),
    value4 = raycaster['ray']['intersectPlane'](value3, x6);
  if (value4 && camera3?.['position']?.['distanceTo']?.(x6) <= Math['max'](0x18, value2 * 0x6))
    return { x: x6['x'], y: x6['y'], z: x6['z'] };
  const x7 = raycaster['ray']['at'](value2, new threeRuntime['Vector3']());
  return { x: x7['x'], y: x7['y'], z: x7['z'] };
}
export function applyAdaptiveCameraProjection({
  camera: camera4,
  pose: pose,
  sceneState: sceneState,
  sceneContentExtent: sceneContentExtent,
  sceneContentBounds: sceneContentBounds,
  fallbackFov: fallbackFov = 0x3a,
} = {}) {
  if (!camera4 || !pose) return null;
  camera4['fov'] = Number['isFinite'](Number(pose['fov'])) ? Number(pose['fov']) : fallbackFov;
  const value5 = sceneState?.['viewport']?.['sceneView']?.['target'] || { x: 0x0, y: 0x0, z: 0x0 },
    box5 = pose['target'] || value5,
    focusDistance = Number['isFinite'](Number(pose['distance']))
      ? Number(pose['distance'])
      : Math['hypot'](
          (Number(pose?.['position']?.['x']) || 0x0) - (Number(box5?.['x']) || 0x0),
          (Number(pose?.['position']?.['y']) || 0x0) - (Number(box5?.['y']) || 0x0),
          (Number(pose?.['position']?.['z']) || 0x0) - (Number(box5?.['z']) || 0x0),
        ) || 0x8,
    box6 = sceneContentBounds?.['center'] || { x: 0x0, y: 0x0, z: 0x0 },
    value6 = Math['max'](0x0, Number(sceneContentBounds?.['radius']) || 0x0),
    sceneDistance = value6
      ? Math['hypot'](
          (Number(pose?.['position']?.['x']) || 0x0) - (Number(box6['x']) || 0x0),
          (Number(pose?.['position']?.['y']) || 0x0) - (Number(box6['y']) || 0x0),
          (Number(pose?.['position']?.['z']) || 0x0) - (Number(box6['z']) || 0x0),
        ) + value6
      : 0x0,
    adaptiveCameraClipPlanes = resolveAdaptiveCameraClipPlanes({
      focusDistance: focusDistance,
      sceneExtent: sceneContentExtent,
      sceneDistance: sceneDistance,
    });
  return (
    (camera4['near'] = adaptiveCameraClipPlanes['near']),
    (camera4['far'] = adaptiveCameraClipPlanes['far']),
    camera4['updateProjectionMatrix'](),
    adaptiveCameraClipPlanes
  );
}
