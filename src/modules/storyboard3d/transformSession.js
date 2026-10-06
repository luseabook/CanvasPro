import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
const TRANSFORM_TOOLS = new Set(['move', 'rotate', 'scale']),
  AXIS_NAMES = ['x', 'y', 'z'];
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function cleanNumber(index) {
  const finiteNumber2 = finiteNumber(index);
  return Math.abs(finiteNumber2) < 1e-12 ? 0 : finiteNumber2;
}
function cloneVector(result, data) {
  const list = Array.isArray(result) ? result : data;
  return list.map((options, target) => finiteNumber(options, data[target]));
}
function cloneTransform(box = {}) {
  return {
    position: cloneVector(box.position, [0, 0, 0]),
    rotation: cloneVector(box.rotation, [0, 0, 0]),
    scale: cloneVector(box.scale, [1, 1, 1]).map((source) => Math.max(0.001, source)),
  };
}
function cloneTransforms(options2 = {}) {
  return Object.fromEntries(
    Object.entries(options2).map(([next, current]) => [next, cloneTransform(current)]),
  );
}
function toThreeVector3(box2, box3 = { x: 0, y: 0, z: 0 }) {
  return new threeRuntime.Vector3(
    finiteNumber(box2?.x, box3.x),
    finiteNumber(box2?.y, box3.y),
    finiteNumber(box2?.z, box3.z),
  );
}
function toThreeQuaternion(box4) {
  const entry = new threeRuntime.Quaternion(
    finiteNumber(box4?.x),
    finiteNumber(box4?.y),
    finiteNumber(box4?.z),
    finiteNumber(box4?.w, 1),
  );
  return entry.lengthSq() > 1e-12 ? entry.normalize() : new threeRuntime.Quaternion();
}
function normalizeConstraint(record) {
  const list2 = [
    ...new Set(
      String(record || '')
        .toLowerCase()
        .match(/[xyz]/g) || [],
    ),
  ].filter((payload) => AXIS_NAMES.includes(payload));
  return AXIS_NAMES.filter((handle) => list2.includes(handle)).join('');
}
export function resolveStoryboard3DTransformConstraint(options3 = {}) {
  const constraint = normalizeConstraint(options3.constraint);
  if (constraint) return constraint;
  const state = String(options3.handleKey || '').toLowerCase();
  if (options3.mode === 'scale-uniform' || state === 'scale-uniform') return 'xyz';
  const config = state.match(/(?:scale-)?plane-([xyz]{2})$/);
  if (config) return normalizeConstraint(config[1]);
  const scope = state.match(/(?:axis|scale|rotate)-([xyz])$/);
  if (scope) return scope[1];
  return 'xyz';
}
function normalizeSettings(groundLock = {}) {
  const groundPositions =
    groundLock.groundPositions && typeof groundLock.groundPositions === 'object'
      ? Object.fromEntries(
          Object.entries(groundLock.groundPositions)
            .map(([input, output]) => [input, Number(output)])
            .filter(([, value2]) => Number.isFinite(value2)),
        )
      : {};
  return {
    groundLock: groundLock.groundLock === true,
    groundPositions: groundPositions,
    uniformScale: groundLock.uniformScale === true,
    snapEnabled: groundLock.snapEnabled === true || groundLock.snap?.enabled === true,
    translationSnap: Math.max(
      0.0001,
      finiteNumber(groundLock.translationSnap ?? groundLock.snap?.translation, 0.25),
    ),
    rotationSnap: Math.max(
      0.0001,
      finiteNumber(groundLock.rotationSnap ?? groundLock.snap?.rotation, Math.PI / 12),
    ),
    scaleSnap: Math.max(
      0.0001,
      finiteNumber(groundLock.scaleSnap ?? groundLock.snap?.scale, 0.1),
    ),
  };
}
function transformsShareOrientation(value3) {
  const list3 = Object.values(value3);
  if (list3.length < 2) return true;
  const value4 = new threeRuntime.Quaternion().setFromEuler(
    new threeRuntime.Euler(...list3[0].rotation, 'XYZ'),
  );
  return list3.slice(1).every((args) => {
    const value5 = new threeRuntime.Quaternion().setFromEuler(
      new threeRuntime.Euler(...args.rotation, 'XYZ'),
    );
    return Math.abs(1 - Math.abs(value4.dot(value5))) < 0.00001;
  });
}
export function createStoryboard3DTransformSession({
  sceneId: sceneId,
  activeTool: activeTool,
  initialTransforms: initialTransforms,
  dragState: dragState,
  settings: settings,
} = {}) {
  const activeTool2 = TRANSFORM_TOOLS.has(activeTool) ? activeTool : 'move',
    initialTransforms2 = cloneTransforms(initialTransforms);
  if (Object.keys(initialTransforms2).length === 0) return null;
  return {
    sceneId: String(sceneId || ''),
    activeTool: activeTool2,
    initialTransforms: initialTransforms2,
    latestTransforms: cloneTransforms(initialTransforms2),
    dragState: dragState || {},
    constraint: resolveStoryboard3DTransformConstraint(dragState),
    pivot: toThreeVector3(dragState?.pivot),
    axisWorld: toThreeVector3(dragState?.axisWorld || dragState?.axis, { x: 1, y: 0, z: 0 }).normalize(),
    gizmoQuaternion: toThreeQuaternion(dragState?.gizmoQuaternion),
    settings: normalizeSettings(settings),
    forcedUniformScale: activeTool2 === 'scale' && !transformsShareOrientation(initialTransforms2),
  };
}
function resolveSnapEnabled(enabled, value6) {
  return value6 ? !enabled.snapEnabled : enabled.snapEnabled;
}
function snapDelta(value7, value8) {
  return Math.round(value7 / value8) * value8;
}
function updateMoveSession(value9, value10, { precision: precision2, toggleSnap: toggleSnap2 }) {
  let box5 = toThreeVector3(value10);
  if (precision2) box5.multiplyScalar(0.1);
  if (resolveSnapEnabled(value9.settings, toggleSnap2)) {
    const map = new Set(value9.constraint || 'xyz');
    ((box5 = box5.applyQuaternion(value9.gizmoQuaternion.clone().invert())),
      AXIS_NAMES.forEach((value11) => {
        box5[value11] = map.has(value11)
          ? snapDelta(box5[value11], value9.settings.translationSnap)
          : 0;
      }),
      box5.applyQuaternion(value9.gizmoQuaternion));
  }
  return Object.fromEntries(
    Object.entries(value9.initialTransforms).map(([value12, value13]) => {
      const cloneTransform2 = cloneTransform(value13);
      cloneTransform2.position = cloneTransform2.position.map((value14, value15) =>
        cleanNumber(value14 + [box5.x, box5.y, box5.z][value15]),
      );
      const value16 = value9.settings.groundPositions[value12];
      if (value9.settings.groundLock && Number.isFinite(value16))
        cloneTransform2.position[1] = value16;
      return [value12, cloneTransform2];
    }),
  );
}
function updateRotateSession(value17, value18, { precision: precision3, toggleSnap: toggleSnap3 }) {
  let finiteNumber3 = finiteNumber(value18);
  if (precision3) finiteNumber3 *= 0.1;
  resolveSnapEnabled(value17.settings, toggleSnap3) &&
    (finiteNumber3 = snapDelta(finiteNumber3, value17.settings.rotationSnap));
  const value19 = new threeRuntime.Quaternion().setFromAxisAngle(value17.axisWorld, finiteNumber3);
  return Object.fromEntries(
    Object.entries(value17.initialTransforms).map(([value20, args2]) => {
      const cloneTransform3 = cloneTransform(args2),
        value21 = new threeRuntime.Vector3(...args2.position)
          .sub(value17.pivot)
          .applyQuaternion(value19)
          .add(value17.pivot),
        value22 = new threeRuntime.Quaternion().setFromEuler(
          new threeRuntime.Euler(...args2.rotation, 'XYZ'),
        ),
        box6 = new threeRuntime.Euler().setFromQuaternion(
          value19.clone().multiply(value22).normalize(),
          'XYZ',
        );
      return (
        (cloneTransform3.position = value21.toArray().map(cleanNumber)),
        (cloneTransform3.rotation = [box6.x, box6.y, box6.z].map(cleanNumber)),
        [value20, cloneTransform3]
      );
    }),
  );
}
function updateScaleSession(value23, value24, { precision: precision4, toggleSnap: toggleSnap4 }) {
  let value25 = Math.max(0.001, finiteNumber(value24, 1));
  if (precision4) value25 = 1 + (value25 - 1) * 0.1;
  resolveSnapEnabled(value23.settings, toggleSnap4) &&
    (value25 = 1 + snapDelta(value25 - 1, value23.settings.scaleSnap));
  value25 = Math.max(0.001, value25);
  const value26 =
      value23.settings.uniformScale || value23.forcedUniformScale ? 'xyz' : value23.constraint,
    map2 = new Set(value26 || 'xyz'),
    value27 = Object.keys(value23.initialTransforms).length > 1,
    value28 = value23.gizmoQuaternion.clone().invert();
  return Object.fromEntries(
    Object.entries(value23.initialTransforms).map(([value29, args3]) => {
      const box7 = cloneTransform(args3);
      box7.scale = box7.scale.map((value30, value31) =>
        map2.has(AXIS_NAMES[value31]) ? Math.max(0.001, cleanNumber(value30 * value25)) : value30,
      );
      if (value27) {
        const value32 = new threeRuntime.Vector3(...args3.position)
          .sub(value23.pivot)
          .applyQuaternion(value28);
        (AXIS_NAMES.forEach((value33) => {
          if (map2.has(value33)) value32[value33] *= value25;
        }),
          (box7.position = value32.applyQuaternion(value23.gizmoQuaternion)
            .add(value23.pivot)
            .toArray()
            .map(cleanNumber)));
      }
      return [value29, box7];
    }),
  );
}
export function updateStoryboard3DTransformSession(
  enabled2,
  value34,
  { precision: precision = false, toggleSnap: toggleSnap = false } = {},
) {
  if (!enabled2) return {};
  const value35 = { precision: precision === true, toggleSnap: toggleSnap === true },
    value36 =
      enabled2.activeTool === 'move'
        ? updateMoveSession(enabled2, value34, value35)
        : enabled2.activeTool === 'rotate'
          ? updateRotateSession(enabled2, value34, value35)
          : updateScaleSession(enabled2, value34, value35);
  return ((enabled2.latestTransforms = cloneTransforms(value36)), value36);
}
