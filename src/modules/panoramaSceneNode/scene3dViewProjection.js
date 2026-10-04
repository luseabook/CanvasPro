import * as threeRuntime from './threeRuntime.js';
import { applyAdaptiveCameraProjection } from './scene3dCameraNavigation.js';
function positive(value, item, key = 0.001) {
  const count = Number(value);
  return Math['max'](key, Number['isFinite'](count) && count > 0x0 ? count : item);
}
export function createScene3DViewProjectionState(index) {
  return {
    viewport: { width: 0x1, height: 0x1 },
    view: {
      type: 'perspective',
      verticalSize: 0x14,
      near: positive(index?.['near'], 0.1),
      far: positive(index?.['far'], 0xfa, 0x1),
      axis: null,
      top: ![],
      center: null,
    },
    perspective: {
      fov: positive(index?.['fov'], 0x37, 0x1),
      near: positive(index?.['near'], 0.1),
      far: positive(index?.['far'], 0xfa, 0x1),
    },
  };
}
export function rememberScene3DPerspectiveProjection(enabled, enabled2) {
  if (!enabled || !enabled2?.['isPerspectiveCamera']) return;
  enabled['perspective'] = {
    fov: positive(enabled2['fov'], enabled['perspective']['fov'], 0x1),
    near: positive(enabled2['near'], enabled['perspective']['near']),
    far: positive(enabled2['far'], enabled['perspective']['far'], 0x1),
  };
}
export function applyScene3DViewProjectionSize(enabled3, box, result, data) {
  if (!enabled3 || !box) return;
  const width = positive(result, enabled3['viewport']['width'], 0x1),
    height = positive(data, enabled3['viewport']['height'], 0x1);
  enabled3['viewport'] = { width: width, height: height };
  const options = width / height;
  if (box['isOrthographicCamera']) {
    const positive2 = positive(enabled3['view']['verticalSize'], 0x14, 0.1) * 0.5,
      target = positive2 * options;
    ((box['left'] = -target),
      (box['right'] = target),
      (box['top'] = positive2),
      (box['bottom'] = -positive2));
  } else box['aspect'] = options;
  box['updateProjectionMatrix']();
}
export function switchScene3DViewProjection(source, next, type, args = {}) {
  const center = type && typeof type === 'object' ? type : { ...args, type: type },
    type2 =
      center['type'] === 'orthographic' || center['projection'] === 'orthographic'
        ? 'orthographic'
        : 'perspective';
  rememberScene3DPerspectiveProjection(source, next);
  const verticalSize = positive(center['verticalSize'], source['view']['verticalSize'], 0.1),
    current = type2 === 'orthographic' ? 0.01 : source['perspective']['near'],
    near = positive(center['near'], current),
    entry = type2 === 'orthographic' ? 0x3e8 : source['perspective']['far'],
    far = Math['max'](near + 0x1, positive(center['far'], entry, 0x1)),
    axis =
      type2 === 'orthographic'
        ? ['top', 'front', 'right']['includes'](center['axis'])
          ? center['axis']
          : center['top'] === !![]
            ? 'top'
            : null
        : null;
  source['view'] = {
    type: type2,
    verticalSize: verticalSize,
    near: near,
    far: far,
    axis: axis,
    top: axis === 'top',
    center: center['center'] ? { ...center['center'] } : null,
  };
  const enabled4 = type2 === 'orthographic' ? next?.['isOrthographicCamera'] : next?.['isPerspectiveCamera'];
  let record = next;
  return (
    !enabled4 &&
      ((record =
        type2 === 'orthographic'
          ? new threeRuntime['OrthographicCamera'](-0x1, 0x1, 0x1, -0x1, near, far)
          : new threeRuntime['PerspectiveCamera'](
              source['perspective']['fov'],
              0x1,
              source['perspective']['near'],
              source['perspective']['far'],
            )),
      (record['rotation']['order'] = 'YXZ'),
      record['position']['copy'](next['position']),
      record['quaternion']['copy'](next['quaternion']),
      record['up']['copy'](next['up'])),
    record['isOrthographicCamera'] && ((record['near'] = near), (record['far'] = far)),
    applyScene3DViewProjectionSize(source, record, source['viewport']['width'], source['viewport']['height']),
    record
  );
}
export function readScene3DViewProjection(center2) {
  return {
    ...center2['view'],
    center: center2['view']['center'] ? { ...center2['view']['center'] } : null,
  };
}
export function resolveScene3DOrthographicPose(payload, event, handle) {
  if (payload?.['view']?.['type'] !== 'orthographic') return null;
  const axis2 = ['top', 'front', 'right']['includes'](payload['view']['axis'])
    ? payload['view']['axis']
    : payload['view']['top'] === !![]
      ? 'top'
      : null;
  if (!axis2) return null;
  const target2 = payload['view']['center'] || event?.['target'] || { x: 0x0, y: 0x0, z: 0x0 };
  return {
    axis: axis2,
    target: target2,
    distance: Math['max'](0.1, Number(event?.['distance']) || Number(handle) || 0x14),
  };
}
export function resolveScene3DOrthographicTopPose(state, config, scope) {
  const scene3DOrthographicPose = resolveScene3DOrthographicPose(state, config, scope);
  return scene3DOrthographicPose?.['axis'] === 'top' ? scene3DOrthographicPose : null;
}
export function computeScene3DWorldUnitsPerPixel(box2, input, enabled5) {
  const positive3 = positive(input, 0x1, 0x1);
  if (box2?.['isOrthographicCamera'])
    return Math['abs'](box2['top'] - box2['bottom']) / positive(box2['zoom'], 0x1) / positive3;
  if (!box2?.['position'] || !enabled5) return 0x0;
  const output = Math['max'](0.001, box2['position']['distanceTo'](enabled5)),
    value2 = (positive(box2['fov'], 0x3a, 0x1) * Math['PI']) / 0xb4;
  return (0x2 * Math['tan'](value2 / 0x2) * output) / positive3;
}
function resolveBridgeState(enabled6) {
  return (
    !enabled6['_viewProjectionState'] &&
      (enabled6['_viewProjectionState'] = createScene3DViewProjectionState(enabled6['camera'])),
    enabled6['_viewProjectionState']
  );
}
export function resizeBridgeViewProjection(value3, value4, value5) {
  applyScene3DViewProjectionSize(resolveBridgeState(value3), value3['camera'], value4, value5);
}
export function switchBridgeViewProjection(value6, value7, value8) {
  return (
    (value6['camera'] = switchScene3DViewProjection(
      resolveBridgeState(value6),
      value6['camera'],
      value7,
      value8,
    )),
    readScene3DViewProjection(value6['_viewProjectionState'])
  );
}
export function readBridgeViewProjection(value9) {
  return readScene3DViewProjection(resolveBridgeState(value9));
}
export function readBridgePerspectiveFov(value10) {
  return value10['camera']?.['isPerspectiveCamera']
    ? value10['camera']['fov']
    : resolveBridgeState(value10)['perspective']['fov'];
}
export function applyBridgeCameraProjection(camera, pose, fallbackFov) {
  const bridgeState = resolveBridgeState(camera);
  camera['camera']['isPerspectiveCamera'] &&
    (applyAdaptiveCameraProjection({
      camera: camera['camera'],
      pose: pose,
      sceneState: camera['_sceneState'],
      sceneContentExtent: camera['_sceneContentExtent'],
      sceneContentBounds: camera['_sceneContentBounds'],
      fallbackFov: fallbackFov,
    }),
    rememberScene3DPerspectiveProjection(bridgeState, camera['camera']));
  const scene3DOrthographicPose2 = resolveScene3DOrthographicPose(
    bridgeState,
    pose,
    camera['_sceneContentExtent'],
  );
  if (scene3DOrthographicPose2) {
    const { axis: axis3, target: target3, distance: distance } = scene3DOrthographicPose2;
    return (
      axis3 === 'top'
        ? (camera['camera']['up']['set'](0x0, 0x0, -0x1),
          camera['camera']['position']['set'](target3['x'], target3['y'] + distance, target3['z']))
        : (camera['camera']['up']['set'](0x0, 0x1, 0x0),
          camera['camera']['position']['set'](
            axis3 === 'right' ? target3['x'] + distance : target3['x'],
            target3['y'],
            axis3 === 'front' ? target3['z'] + distance : target3['z'],
          )),
      camera['camera']['lookAt'](target3['x'], target3['y'], target3['z']),
      !![]
    );
  }
  return (camera['camera']['up']['set'](0x0, 0x1, 0x0), ![]);
}
