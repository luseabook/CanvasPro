import {
  normalizeDirectorMotion,
  applyDirectorCameraConstraint,
  sampleDirectorActions,
  directorConstraintAt,
} from './directorMotion.js';
import { normalizeDirectorCameraPath } from './directorCameraPath.js';
import {
  normalizeCurveVector,
  normalizeEasingCurve,
  sampleBezierEase,
  sampleSpatialCurve,
} from './directorCurves.js';
import { normalizeDirectorClips, resolveDirectorClipSample } from './directorClips.js';
const DEFAULT_DURATION_SECONDS = 6,
  DEFAULT_FPS = 24,
  MIN_DURATION_SECONDS = 0.1,
  MAX_DURATION_SECONDS = 3600,
  MIN_FPS = 1,
  MAX_FPS = 120,
  EASING_VALUES = new Set(['linear', 'ease-in', 'ease-out', 'ease-in-out']);
export const STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES = Object.freeze(['position', 'rotation', 'scale']);
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function clamp(index, result, data) {
  return Math.min(data, Math.max(result, index));
}
function normalizeVector3(options, target) {
  const source = Array.isArray(options) ? options : [];
  return [0, 1, 2].map((next) => finiteNumber(source[next], target[next]));
}
function normalizeScale(current) {
  return normalizeVector3(current, [1, 1, 1]).map((entry) => Math.max(0.001, entry));
}
function normalizeTransform(options2 = {}) {
  return {
    position: normalizeVector3(options2.position, [0, 0, 0]),
    rotation: normalizeVector3(options2.rotation, [0, 0, 0]),
    scale: normalizeScale(options2.scale),
  };
}
function normalizeCamera(options3 = {}) {
  const record = Math.max(0.001, finiteNumber(options3.near, 0.1)),
    payload = {
      position: normalizeVector3(options3.position, [5, 4, 7]),
      target: normalizeVector3(options3.target, [0, 1.2, 0]),
      focalLength: clamp(finiteNumber(options3.focalLength, 35), 1, 500),
      near: record,
      far: Math.max(record + 0.001, finiteNumber(options3.far, 1000)),
      aspectRatio: String(options3.aspectRatio || '16:9'),
    };
  return (
    options3.fov != null &&
      Number.isFinite(Number(options3.fov)) &&
      (payload.fov = clamp(Number(options3.fov), 1, 179)),
    options3.roll != null &&
      Number.isFinite(Number(options3.roll)) &&
      (payload.roll = clamp(Number(options3.roll), -Math.PI, Math.PI)),
    payload
  );
}
function normalizeEasing(handle) {
  const state = String(handle || 'ease-in-out')
    .trim()
    .toLowerCase();
  return EASING_VALUES.has(state) ? state : 'ease-in-out';
}
function createKeyframeId(config = 'keyframe', handler) {
  if (typeof handler === 'function') return String(handler(config));
  const scope = globalThis.crypto;
  if (typeof scope?.randomUUID === 'function') return config + '-' + scope.randomUUID();
  return config + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}
function normalizeCameraKeyframe(input, output, value2) {
  return {
    ...(normalizeCurveVector(input?.inTangent)
      ? { inTangent: normalizeCurveVector(input.inTangent) }
      : {}),
    ...(normalizeCurveVector(input?.outTangent)
      ? { outTangent: normalizeCurveVector(input.outTangent) }
      : {}),
    ...(normalizeEasingCurve(input?.easingCurve)
      ? { easingCurve: normalizeEasingCurve(input.easingCurve) }
      : {}),
    id: String(input?.id || 'camera-keyframe-' + (output + 1)),
    time: Math.max(0, finiteNumber(input?.time, output)),
    camera: normalizeCamera(input?.camera || value2),
    easing: normalizeEasing(input?.easing),
  };
}
function normalizePropertyKeyframe(value3, value4, args, value5) {
  const transform = normalizeTransform(value5)[args],
    value6 =
      args === 'scale' ? normalizeScale(value3?.value) : normalizeVector3(value3?.value, transform);
  return {
    ...(args === 'position' && normalizeCurveVector(value3?.inTangent)
      ? { inTangent: normalizeCurveVector(value3.inTangent) }
      : {}),
    ...(args === 'position' && normalizeCurveVector(value3?.outTangent)
      ? { outTangent: normalizeCurveVector(value3.outTangent) }
      : {}),
    ...(normalizeEasingCurve(value3?.easingCurve)
      ? { easingCurve: normalizeEasingCurve(value3.easingCurve) }
      : {}),
    id: String(value3?.id || args + '-keyframe-' + (value4 + 1)),
    time: Math.max(0, finiteNumber(value3?.time, value4)),
    value: value6,
    easing: normalizeEasing(value3?.easing),
  };
}
function uniqueSortedKeyframes(value7, handler2) {
  const map = new Map();
  return (
    (Array.isArray(value7) ? value7 : []).forEach((value8, value9) => {
      const value10 = handler2(value8, value9);
      if (value10.id) map.set(value10.id, value10);
    }),
    [...map.values()].sort(
      (value11, value12) =>
        value11.time - value12.time || value11.id.localeCompare(value12.id),
    )
  );
}
function normalizeObjectTrack(value13, value14, value15) {
  const value16 = { objectId: value14 };
  return (
    STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES.forEach((value17) => {
      const value18 = value17 + 'Keyframes';
      value16[value18] = uniqueSortedKeyframes(value13?.[value18], (value19, value20) =>
        normalizePropertyKeyframe(value19, value20, value17, value15),
      );
    }),
    value16
  );
}
export function createStoryboard3DShotAnimation({
  camera: camera,
  duration: duration = DEFAULT_DURATION_SECONDS,
  fps: fps = DEFAULT_FPS,
  idFactory: idFactory,
} = {}) {
  return {
    duration: clamp(
      finiteNumber(duration, DEFAULT_DURATION_SECONDS),
      MIN_DURATION_SECONDS,
      MAX_DURATION_SECONDS,
    ),
    fps: clamp(Math.round(finiteNumber(fps, DEFAULT_FPS)), MIN_FPS, MAX_FPS),
    loop: false,
    cameraKeyframes: [
      {
        id: createKeyframeId('camera-keyframe', idFactory),
        time: 0,
        camera: normalizeCamera(camera),
        easing: 'ease-in-out',
      },
    ],
    objectTracks: [],
    ...normalizeDirectorMotion(),
  };
}
export function normalizeStoryboard3DShotAnimation(
  options4 = {},
  {
    camera: camera2,
    objectIds: objectIds,
    objectTransforms: objectTransforms = {},
    idFactory: idFactory2,
  } = {},
) {
  const map2 = objectIds instanceof Set ? objectIds : Array.isArray(objectIds) ? new Set(objectIds) : null,
    args2 = uniqueSortedKeyframes(options4?.cameraKeyframes, (value21, value22) =>
      normalizeCameraKeyframe(value21, value22, camera2),
    );
  args2.length === 0 &&
    args2.push({
      id: createKeyframeId('camera-keyframe', idFactory2),
      time: 0,
      camera: normalizeCamera(camera2),
      easing: 'ease-in-out',
    });
  const args3 = (Array.isArray(options4?.objectTracks) ? options4.objectTracks : [])
      .map((value23) => {
        const enabled = String(value23?.objectId || '').trim();
        if (!enabled || (map2 && !map2.has(enabled))) return null;
        return normalizeObjectTrack(value23, enabled, objectTransforms[enabled]);
      })
      .filter(Boolean),
    args4 = normalizeDirectorMotion(options4, map2),
    args5 = normalizeDirectorClips(options4?.motionClips, {
      cameraKeyframes: args2,
      objectTracks: args3,
    }),
    value24 = Math.max(
      0,
      ...args4.actionClips.map((value25) => value25.end),
      ...args4.cameraConstraintClips.map((value26) => value26.end),
      ...args5.map((value27) => value27.end),
      ...args2.map((value28) => value28.time),
      ...args3.flatMap((value29) =>
        STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES.flatMap((value30) =>
          value29[value30 + 'Keyframes'].map((value31) => value31.time),
        ),
      ),
    );
  return {
    duration: clamp(
      Math.max(
        MIN_DURATION_SECONDS,
        finiteNumber(options4?.duration, DEFAULT_DURATION_SECONDS),
        value24,
      ),
      MIN_DURATION_SECONDS,
      MAX_DURATION_SECONDS,
    ),
    fps: clamp(Math.round(finiteNumber(options4?.fps, DEFAULT_FPS)), MIN_FPS, MAX_FPS),
    loop: options4?.loop === true,
    cameraKeyframes: args2,
    cameraPath: normalizeDirectorCameraPath(options4?.cameraPath, args2),
    objectPaths: Object.fromEntries(
      args3.filter((value32) => options4?.objectPaths?.[value32.objectId]).map((value33) => [
        value33.objectId,
        normalizeDirectorCameraPath(
          options4.objectPaths[value33.objectId],
          value33.positionKeyframes,
        ),
      ]),
    ),
    objectTracks: args3,
    motionClips: args5,
    ...args4,
  };
}
function upsertAtTime(list, args6, value34) {
  const value35 = 0.5 / Math.max(MIN_FPS, value34),
    value36 = list.find((value37) => Math.abs(value37.time - args6.time) <= value35),
    value38 = list.filter((value39) => value39.id !== value36?.id && value39.id !== args6.id);
  return (
    value38.push({ ...args6, id: value36?.id || args6.id }),
    value38.sort(
      (value40, value41) =>
        value40.time - value41.time || value40.id.localeCompare(value41.id),
    )
  );
}
export function upsertStoryboard3DCameraKeyframe(
  value42,
  { time: time = 0, camera: camera3, easing: easing = 'ease-in-out' } = {},
  { idFactory: idFactory3 } = {},
) {
  const storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(value42, {
      camera: camera3,
      idFactory: idFactory3,
    }),
    cameraKeyframe = normalizeCameraKeyframe(
      { id: createKeyframeId('camera-keyframe', idFactory3), time: time, camera: camera3, easing: easing },
      storyboard3DShotAnimation.cameraKeyframes.length,
      camera3,
    );
  return (
    (storyboard3DShotAnimation.cameraKeyframes = upsertAtTime(
      storyboard3DShotAnimation.cameraKeyframes,
      cameraKeyframe,
      storyboard3DShotAnimation.fps,
    )),
    (storyboard3DShotAnimation.duration = Math.max(
      storyboard3DShotAnimation.duration,
      cameraKeyframe.time,
    )),
    storyboard3DShotAnimation
  );
}
export function upsertStoryboard3DObjectKeyframe(
  value43,
  {
    objectId: objectId,
    property: property,
    time: time = 0,
    transform: transform2,
    value: value44,
    easing: easing = 'ease-in-out',
  } = {},
  { idFactory: idFactory4 } = {},
) {
  const enabled2 = String(objectId || '').trim();
  if (!enabled2) throw new Error('An object id is required for an object keyframe');
  if (!STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES.includes(property))
    throw new Error('Unsupported object animation property: ' + property);
  const storyboard3DShotAnimation2 = normalizeStoryboard3DShotAnimation(value43, { idFactory: idFactory4 });
  let objectTrack = storyboard3DShotAnimation2.objectTracks.find(
    (value45) => value45.objectId === enabled2,
  );
  !objectTrack &&
    ((objectTrack = normalizeObjectTrack({}, enabled2, transform2)),
    storyboard3DShotAnimation2.objectTracks.push(objectTrack));
  const value46 = property + 'Keyframes',
    propertyKeyframe = normalizePropertyKeyframe(
      {
        id: createKeyframeId(property + '-keyframe', idFactory4),
        time: time,
        value: value44 || transform2?.[property],
        easing: easing,
      },
      objectTrack[value46].length,
      property,
      transform2,
    );
  return (
    (objectTrack[value46] = upsertAtTime(
      objectTrack[value46],
      propertyKeyframe,
      storyboard3DShotAnimation2.fps,
    )),
    (storyboard3DShotAnimation2.duration = Math.max(
      storyboard3DShotAnimation2.duration,
      propertyKeyframe.time,
    )),
    storyboard3DShotAnimation2
  );
}
export function removeStoryboard3DAnimationKeyframe(
  value47,
  { type: type, objectId: objectId2, property: property2, keyframeId: keyframeId } = {},
) {
  const storyboard3DShotAnimation3 = normalizeStoryboard3DShotAnimation(value47),
    enabled3 = String(keyframeId || '').trim();
  if (!enabled3) return storyboard3DShotAnimation3;
  if (type === 'camera') {
    if (storyboard3DShotAnimation3.cameraKeyframes.length <= 1) return storyboard3DShotAnimation3;
    return (
      (storyboard3DShotAnimation3.cameraKeyframes = storyboard3DShotAnimation3.cameraKeyframes.filter((value48) => value48.id !== enabled3)),
      storyboard3DShotAnimation3
    );
  }
  const enabled4 = storyboard3DShotAnimation3.objectTracks.find(
    (value49) => value49.objectId === String(objectId2 || ''),
  );
  if (!enabled4 || !STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES.includes(property2))
    return storyboard3DShotAnimation3;
  const value50 = property2 + 'Keyframes';
  return (
    (enabled4[value50] = enabled4[value50].filter((value51) => value51.id !== enabled3)),
    storyboard3DShotAnimation3
  );
}
export function updateStoryboard3DShotAnimationSettings(args7, args8 = {}) {
  return normalizeStoryboard3DShotAnimation({
    ...args7,
    ...args8,
    cameraKeyframes: args7?.cameraKeyframes,
    objectTracks: args7?.objectTracks,
  });
}
export function applyStoryboard3DAnimationEasing(value52, value53 = 'linear') {
  const clamp2 = clamp(finiteNumber(value52), 0, 1);
  switch (normalizeEasing(value53)) {
    case 'ease-in':
      return clamp2 * clamp2;
    case 'ease-out':
      return 1 - (1 - clamp2) * (1 - clamp2);
    case 'ease-in-out':
      return clamp2 < 0.5 ? 2 * clamp2 * clamp2 : 1 - Math.pow(-2 * clamp2 + 2, 2) / 2;
    default:
      return clamp2;
  }
}
function interpolateNumber(value54, value55, value56) {
  return value54 + (value55 - value54) * value56;
}
function interpolateAngle(value57, value58, value59) {
  const value60 =
    ((((value58 - value57 + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) -
    Math.PI;
  return value57 + value60 * value59;
}
function interpolateVector(value61, value62, value63, { angles: angles = false } = {}) {
  return value61.map((value64, value65) =>
    angles
      ? interpolateAngle(value64, value62[value65], value63)
      : interpolateNumber(value64, value62[value65], value63),
  );
}
function sampleKeyframes(list2, value66, handler3) {
  if (!Array.isArray(list2) || list2.length === 0) return null;
  if (list2.length === 1 || value66 <= list2[0].time) return { ...list2[0], progress: 0 };
  const args9 = list2.at(-1);
  if (value66 >= args9.time) return { ...args9, progress: 0 };
  let args10 = list2[0],
    value67 = list2[1];
  for (let value68 = 1; value68 < list2.length; value68 += 1) {
    value67 = list2[value68];
    if (value66 <= value67.time) break;
    args10 = value67;
  }
  const value69 = Math.max(1e-8, value67.time - args10.time),
    value70 = (value66 - args10.time) / value69,
    value71 = args10.easingCurve
      ? sampleBezierEase(value70, args10.easingCurve)
      : applyStoryboard3DAnimationEasing(value70, args10.easing);
  return {
    ...args10,
    value: handler3(args10, value67, value71),
    fromKeyframeId: args10.id,
    toKeyframeId: value67.id,
    progress: value71,
  };
}
function sampleCameraKeyframes(value72, value73) {
  const sampleKeyframes2 = sampleKeyframes(value72, value73, (value74, value75, count) => ({
    position: sampleSpatialCurve(value74, value75, count, 'camera'),
    target: interpolateVector(value74.camera.target, value75.camera.target, count),
    focalLength: interpolateNumber(value74.camera.focalLength, value75.camera.focalLength, count),
    roll: interpolateAngle(value74.camera.roll || 0, value75.camera.roll || 0, count),
    near: interpolateNumber(value74.camera.near, value75.camera.near, count),
    far: interpolateNumber(value74.camera.far, value75.camera.far, count),
    aspectRatio: count < 0.5 ? value74.camera.aspectRatio : value75.camera.aspectRatio,
  }));
  if (!sampleKeyframes2) return null;
  return sampleKeyframes2.value || sampleKeyframes2.camera;
}
export function sampleStoryboard3DShotAnimation(
  value76,
  value77,
  { camera: camera4, objectTransforms: objectTransforms = {}, objects: objects = [] } = {},
) {
  const storyboard3DShotAnimation4 = normalizeStoryboard3DShotAnimation(value76, {
    camera: camera4,
    objectTransforms: objectTransforms,
  });
  let finiteNumber2 = finiteNumber(value77);
  storyboard3DShotAnimation4.loop && storyboard3DShotAnimation4.duration > 0
    ? (finiteNumber2 =
        ((finiteNumber2 % storyboard3DShotAnimation4.duration) + storyboard3DShotAnimation4.duration) %
        storyboard3DShotAnimation4.duration)
    : (finiteNumber2 = clamp(finiteNumber2, 0, storyboard3DShotAnimation4.duration));
  const value78 = {};
  storyboard3DShotAnimation4.objectTracks.forEach((value79) => {
    const args11 = normalizeTransform(objectTransforms[value79.objectId]),
      value80 = { ...args11 };
    let value81 = false;
    STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES.forEach((value82) => {
      const directorClipSample = resolveDirectorClipSample(
          storyboard3DShotAnimation4.motionClips,
          value79[value82 + 'Keyframes'],
          finiteNumber2,
        ),
        sampleKeyframes3 = sampleKeyframes(
          directorClipSample.keys,
          directorClipSample.time,
          (value83, el, value84) =>
            value82 === 'position'
              ? sampleSpatialCurve(value83, el, value84)
              : interpolateVector(value83.value, el.value, value84, { angles: value82 === 'rotation' }),
        );
      sampleKeyframes3 && ((value80[value82] = sampleKeyframes3.value), (value81 = true));
    });
    if (value81) value78[value79.objectId] = value80;
  });
  const directorClipSample2 = resolveDirectorClipSample(
    storyboard3DShotAnimation4.motionClips,
    storyboard3DShotAnimation4.cameraKeyframes,
    finiteNumber2,
  );
  return {
    time: finiteNumber2,
    camera: applyDirectorCameraConstraint(
      sampleCameraKeyframes(directorClipSample2.keys, directorClipSample2.time) ||
        normalizeCamera(camera4),
      directorConstraintAt(storyboard3DShotAnimation4, finiteNumber2),
      value78,
      objectTransforms,
    ),
    objectTransforms: value78,
    characterActions: sampleDirectorActions(
      storyboard3DShotAnimation4.actionClips,
      finiteNumber2,
      objects,
    ),
  };
}
export function getStoryboard3DObjectAnimationTrack(value85, value86) {
  return (
    normalizeStoryboard3DShotAnimation(value85).objectTracks.find(
      (value87) => value87.objectId === String(value86 || ''),
    ) || null
  );
}
export function remapStoryboard3DAnimationObjectIds(value88, map3) {
  const args12 = normalizeStoryboard3DShotAnimation(value88),
    handler4 = (value89) => map3.get(value89) || '';
  return normalizeStoryboard3DShotAnimation({
    ...args12,
    objectTracks: args12.objectTracks.map((args13) => ({
      ...args13,
      objectId: handler4(args13.objectId),
    })),
    actionClips: args12.actionClips.map((args14) => ({
      ...args14,
      objectId: handler4(args14.objectId),
    })),
    objectPaths: Object.fromEntries(
      Object.entries(args12.objectPaths || {}).map(([value90, value91]) => [
        handler4(value90),
        value91,
      ]),
    ),
    cameraConstraintClips: args12.cameraConstraintClips.map((args15) => ({
      ...args15,
      followObjectId: handler4(args15.followObjectId),
      lookAtObjectId: handler4(args15.lookAtObjectId),
    })),
    cameraConstraint: {
      ...args12.cameraConstraint,
      followObjectId: handler4(args12.cameraConstraint.followObjectId),
      lookAtObjectId: handler4(args12.cameraConstraint.lookAtObjectId),
    },
  });
}
