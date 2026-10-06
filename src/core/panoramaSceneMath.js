export const PANORAMA_SCENE_CAMERA_CONSTRAINTS = Object.freeze({
  panorama: Object.freeze({
    pitch: Object.freeze({ min: (-85 * Math.PI) / 180, max: (85 * Math.PI) / 180, default: 0 }),
    fov: Object.freeze({ min: 35, max: 80, default: 55 }),
  }),
  scene: Object.freeze({
    orbitPitch: Object.freeze({ min: -1.35, max: 1.35 }),
    orbitDistance: Object.freeze({ min: 0.05, max: 120 }),
    focalLength: Object.freeze({ min: 16, max: 135, default: 50 }),
    sensorWidthMm: 36,
  }),
});
const PANORAMA_PITCH_LIMIT = PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.pitch.max,
  SCENE_PITCH_MIN = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.orbitPitch.min,
  SCENE_PITCH_MAX = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.orbitPitch.max,
  PANORAMA_FOV_DEFAULT = PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.default,
  PANORAMA_FOV_MIN = PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.min,
  PANORAMA_FOV_MAX = PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.max;
export const SCENE_ORBIT_DISTANCE_MIN = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.orbitDistance.min;
export const SCENE_ORBIT_DISTANCE_MAX = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.orbitDistance.max;
const SCENE_WHEEL_DOLLY_FACTOR = 0.0012,
  SCENE_DRAG_DOLLY_FACTOR = SCENE_WHEEL_DOLLY_FACTOR * 8;
export const SCENE_SENSOR_WIDTH_MM = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.sensorWidthMm;
export const SCENE_DEFAULT_FOCAL_LENGTH_MM = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.focalLength.default;
export const SCENE_FOCAL_LENGTH_MIN_MM = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.focalLength.min;
export const SCENE_FOCAL_LENGTH_MAX_MM = PANORAMA_SCENE_CAMERA_CONSTRAINTS.scene.focalLength.max;
function clamp(value, item, key) {
  return Math.min(key, Math.max(item, value));
}
function resolveFullFrameSensorHeight(index = SCENE_SENSOR_WIDTH_MM) {
  const result = Math.max(1, Number(index) || SCENE_SENSOR_WIDTH_MM);
  return result * (2 / 3);
}
function smoothstep(data, options, target) {
  if (!(target > options)) return data >= target ? 1 : 0;
  const clamp2 = clamp((data - options) / (target - options), 0, 1);
  return clamp2 * clamp2 * (3 - 2 * clamp2);
}
function computeSceneOrbitDistanceResponse(source) {
  const next = 1 - 0.35 * (1 - smoothstep(source, SCENE_ORBIT_DISTANCE_MIN, 0.6)),
    current = 1 - 0.22 * smoothstep(source, 18, 90);
  return next * current;
}
function normalizeVector3(box, box2 = { x: 0, y: 0, z: 0 }) {
  return {
    x: Number.isFinite(box?.x) ? box.x : box2.x,
    y: Number.isFinite(box?.y) ? box.y : box2.y,
    z: Number.isFinite(box?.z) ? box.z : box2.z,
  };
}
function normalizeQuaternion(box3, args = { x: 0, y: 0, z: 0, w: 1 }) {
  const x = Number(box3?.x),
    y = Number(box3?.y),
    z = Number(box3?.z),
    w = Number(box3?.w);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(w))
    return { ...args };
  const count = Math.hypot(x, y, z, w);
  if (count < 0.000001) return { ...args };
  return {
    x: x / count,
    y: y / count,
    z: z / count,
    w: w / count,
  };
}
function quaternionToForwardVector(entry) {
  const box4 = normalizeQuaternion(entry);
  return {
    x: -(2 * (box4.x * box4.z + box4.w * box4.y)),
    y: -(2 * (box4.y * box4.z - box4.w * box4.x)),
    z: -(1 - 2 * (box4.x * box4.x + box4.y * box4.y)),
  };
}
function resolvePoseForwardVector(record, args2) {
  if (record?.quaternion) return normalizeVector3(quaternionToForwardVector(record.quaternion), args2);
  if (record?.rotation) return normalizeVector3(rotationToForwardVector(record.rotation), args2);
  if (record?.forward) return normalizeVector3(record.forward, args2);
  return { ...args2 };
}
function lengthXZ(box5) {
  return Math.hypot(box5.x, box5.z);
}
function length3(box6) {
  return Math.hypot(box6.x, box6.y, box6.z);
}
function normalize3(x2, args3 = { x: 0, y: 0, z: 0 }) {
  const length32 = length3(x2) || 0;
  if (length32 < 0.000001) return { ...args3 };
  return { x: x2.x / length32, y: x2.y / length32, z: x2.z / length32 };
}
function cross(x3, box7) {
  return {
    x: x3.y * box7.z - x3.z * box7.y,
    y: x3.z * box7.x - x3.x * box7.z,
    z: x3.x * box7.y - x3.y * box7.x,
  };
}
function dot(box8, box9) {
  return (
    (Number(box8?.x) || 0) * (Number(box9?.x) || 0) +
    (Number(box8?.y) || 0) * (Number(box9?.y) || 0) +
    (Number(box8?.z) || 0) * (Number(box9?.z) || 0)
  );
}
function subtract(box10, box11) {
  return {
    x: (Number(box10?.x) || 0) - (Number(box11?.x) || 0),
    y: (Number(box10?.y) || 0) - (Number(box11?.y) || 0),
    z: (Number(box10?.z) || 0) - (Number(box11?.z) || 0),
  };
}
function scale(box12, payload) {
  const handle = Number(payload) || 0;
  return {
    x: (Number(box12?.x) || 0) * handle,
    y: (Number(box12?.y) || 0) * handle,
    z: (Number(box12?.z) || 0) * handle,
  };
}
function subtractProjection(state, config) {
  const v3 = normalize3(config, { x: 0, y: 1, z: 0 }),
    scale2 = scale(v3, dot(state, v3));
  return subtract(state, scale2);
}
function safeLength(box13) {
  return Math.hypot(Number(box13?.x) || 0, Number(box13?.y) || 0, Number(box13?.z) || 0);
}
export function clampPanoramaPitch(scope) {
  return clamp(Number(scope) || 0, -PANORAMA_PITCH_LIMIT, PANORAMA_PITCH_LIMIT);
}
export function clampSceneOrbitPitch(input) {
  return clamp(Number(input) || 0, SCENE_PITCH_MIN, SCENE_PITCH_MAX);
}
export function normalizeAngle(output) {
  const value2 = Number(output) || 0,
    value3 = (((value2 + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return value3 - Math.PI;
}
export function computeStableGridSnap(value4, value5, value6 = null, value7 = 0.12) {
  const value8 = Math.max(0.0001, Number(value5) || 1),
    value9 = Number(value4) || 0,
    value10 = Math.round(value9 / value8) * value8,
    value11 = Number(value6);
  if (!Number.isFinite(value11)) return value10;
  if (Math.abs(value10 - value11) < 0.000001) return value11;
  const clamp3 = clamp(Number(value7) || 0, 0, 0.45),
    value12 = value8 * (0.5 + clamp3);
  return Math.abs(value9 - value11) < value12 ? value11 : value10;
}
export function computeDampingFactor(value13, value14 = 120) {
  const value15 = Math.max(0, Number(value13) || 0),
    value16 = Math.max(1, Number(value14) || 120);
  return 1 - Math.exp(-value15 / value16);
}
export function dampScalar(value17, value18, value19, value20 = 120) {
  const dampingFactor = computeDampingFactor(value19, value20),
    value21 = Number(value17) || 0,
    value22 = Number(value18) || 0;
  return value21 + (value22 - value21) * dampingFactor;
}
export function dampAngle(value23, value24, value25, value26 = 120) {
  const dampingFactor2 = computeDampingFactor(value25, value26),
    value27 = Number(value23) || 0,
    value28 = Number(value24) || 0,
    angle = normalizeAngle(value28 - value27);
  return normalizeAngle(value27 + angle * dampingFactor2);
}
export function forwardVectorFromYawPitch(value29, value30 = 0) {
  const value31 = Number(value29) || 0,
    value32 = Number(value30) || 0,
    value33 = Math.cos(value32);
  return { x: Math.sin(value31) * value33, y: Math.sin(value32), z: Math.cos(value31) * value33 };
}
export function rotationToForwardVector(box14) {
  const value34 = Number(box14?.x) || 0,
    value35 = Number(box14?.y) || 0;
  return forwardVectorFromYawPitch(value35, -value34);
}
export function clampSceneFocalLength(value36) {
  return clamp(
    Number(value36) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
    SCENE_FOCAL_LENGTH_MIN_MM,
    SCENE_FOCAL_LENGTH_MAX_MM,
  );
}
export function focalLengthToFov(value37, value38 = SCENE_SENSOR_WIDTH_MM) {
  const clampSceneFocalLength2 = clampSceneFocalLength(value37),
    fullFrameSensorHeight = resolveFullFrameSensorHeight(value38),
    value39 = 2 * Math.atan(fullFrameSensorHeight / (2 * clampSceneFocalLength2));
  return (value39 * 180) / Math.PI;
}
export function fovToFocalLength(value40, value41 = SCENE_SENSOR_WIDTH_MM) {
  const clamp4 = clamp(Number(value40) || focalLengthToFov(SCENE_DEFAULT_FOCAL_LENGTH_MM), 18, 100),
    fullFrameSensorHeight2 = resolveFullFrameSensorHeight(value41),
    value42 = fullFrameSensorHeight2 / (2 * Math.tan((clamp4 * Math.PI) / 180 / 2));
  return clampSceneFocalLength(value42);
}
export function resolveSceneCameraPose(event, value43 = 58) {
  const x4 = normalizeVector3(event?.target, { x: 0, y: 1.2, z: 0 }),
    distance2 = Math.max(SCENE_ORBIT_DISTANCE_MIN, Number(event?.orbitDistance) || 8),
    yaw2 = Number(event?.orbitYaw) || 0,
    pitch = clampSceneOrbitPitch(event?.orbitPitch),
    value44 = Math.cos(pitch),
    position = {
      x: x4.x + distance2 * Math.sin(yaw2) * value44,
      y: x4.y + distance2 * Math.sin(pitch),
      z: x4.z + distance2 * Math.cos(yaw2) * value44,
    };
  return {
    kind: 'scene-default',
    position: position,
    target: x4,
    yaw: yaw2,
    pitch: pitch,
    distance: distance2,
    fov: Math.max(1, Number(value43) || 58),
  };
}
export function resolvePanoramaViewPose(value45, value46 = { x: 0, y: 0, z: 0 }) {
  const yaw3 = Number(value45?.yaw) || 0,
    pitch2 = clampPanoramaPitch(value45?.pitch);
  return {
    kind: 'panorama-default',
    position: normalizeVector3(value46, { x: 0, y: 0, z: 0 }),
    yaw: yaw3,
    pitch: pitch2,
    fov: Math.max(PANORAMA_FOV_MIN, Math.min(PANORAMA_FOV_MAX, Number(value45?.fov) || PANORAMA_FOV_DEFAULT)),
  };
}
export function applyOrbitDelta(value47, value48, value49, box15) {
  const value50 = Math.max(120, Number(box15?.width) || 1),
    value51 = Math.max(120, Number(box15?.height) || 1),
    value52 = (value48 / value50) * Math.PI * 1.75,
    value53 = (value49 / value51) * Math.PI * 1.25;
  return {
    orbitYaw: normalizeAngle((Number(value47?.orbitYaw) || 0) - value52),
    orbitPitch: clampSceneOrbitPitch((Number(value47?.orbitPitch) || 0) + value53),
  };
}
export function applyPanoramaLookDelta(value54, value55, value56, box16) {
  const value57 = Math.max(120, Number(box16?.width) || 1),
    value58 = Math.max(120, Number(box16?.height) || 1),
    value59 = (value55 / value57) * Math.PI * 1.75,
    value60 = (value56 / value58) * Math.PI * 1.25;
  return {
    yaw: normalizeAngle((Number(value54?.yaw) || 0) - value59),
    pitch: clampPanoramaPitch((Number(value54?.pitch) || 0) + value60),
  };
}
export function applyScenePanDelta(event2, value61, value62, value63, box17) {
  const value64 = Math.max(120, Number(box17?.height) || 1),
    value65 = Math.max(
      SCENE_ORBIT_DISTANCE_MIN,
      Number(event2?.orbitDistance) || Number(value61?.distance) || 8,
    ),
    value66 = ((Number(value61?.fov) || 58) * Math.PI) / 180,
    value67 = (2 * Math.tan(value66 / 2) * value65) / value64,
    smoothstep2 = smoothstep(value65, SCENE_ORBIT_DISTANCE_MIN, 0.25),
    value68 = 0.92 + smoothstep2 * 0.18,
    value69 = 1 - 0.28 * smoothstep(value65, 6, 24),
    value70 = value67 * value68 * value69,
    v32 = normalize3(
      normalizeVector3(value61?.forward || forwardVectorFromYawPitch(value61?.yaw, value61?.pitch), {
        x: 0,
        y: 0,
        z: 1,
      }),
      { x: 0, y: 0, z: 1 },
    ),
    value71 = { x: 0, y: 1, z: 0 },
    value72 = { x: 0, y: 0, z: 1 },
    cross2 = cross(value71, v32),
    cross3 = cross(value72, v32),
    box18 =
      length3(cross2) > 0.000001
        ? normalize3(cross2, { x: 1, y: 0, z: 0 })
        : normalize3(cross3, { x: 1, y: 0, z: 0 }),
    cross4 = cross(v32, box18),
    box19 = length3(cross4) > 0.000001 ? normalize3(cross4, { x: 0, y: 1, z: 0 }) : { x: 0, y: 1, z: 0 },
    value73 = value62 * value70,
    value74 = value63 * value70,
    x5 = normalizeVector3(event2?.target, { x: 0, y: 1.2, z: 0 });
  return {
    target: {
      x: x5.x + box18.x * value73 + box19.x * value74,
      y: x5.y + box18.y * value73 + box19.y * value74,
      z: x5.z + box18.z * value73 + box19.z * value74,
    },
  };
}
function applySceneOrbitDistanceDelta(value75, value76, value77) {
  const clamp5 = clamp(
      Number(value75?.orbitDistance) || 8,
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    ),
    sceneOrbitDistanceResponse = computeSceneOrbitDistanceResponse(clamp5),
    orbitDistance = clamp(
      clamp5 * Math.exp((Number(value76) || 0) * value77 * sceneOrbitDistanceResponse),
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    );
  return { orbitDistance: orbitDistance };
}
export function applySceneZoomDelta(value78, value79) {
  return applySceneOrbitDistanceDelta(value78, value79, SCENE_WHEEL_DOLLY_FACTOR);
}
export function applySceneDollyDelta(value80, value81) {
  return applySceneOrbitDistanceDelta(value80, value81, SCENE_DRAG_DOLLY_FACTOR);
}
export function applyPanoramaZoomDelta(value82, value83) {
  return {
    fov: clamp(
      (Number(value82?.fov) || PANORAMA_FOV_DEFAULT) * Math.exp((Number(value83) || 0) * 0.00045),
      PANORAMA_FOV_MIN,
      PANORAMA_FOV_MAX,
    ),
  };
}
export function computeForwardPlacement({
  pose: pose,
  distance: distance = 3,
  groundY: groundY = 0,
  eyeHeight: eyeHeight = 1.6,
} = {}) {
  const x6 = normalizeVector3(pose?.position, { x: 0, y: eyeHeight, z: 0 }),
    x7 = normalizeVector3(
      pose?.forward ||
        (pose?.rotation
          ? rotationToForwardVector(pose.rotation)
          : forwardVectorFromYawPitch(pose?.yaw, pose?.pitch)),
      { x: 0, y: 0, z: 1 },
    ),
    lengthXZ2 = lengthXZ(x7),
    box20 = lengthXZ2 > 0.0001 ? { x: x7.x / lengthXZ2, y: 0, z: x7.z / lengthXZ2 } : { x: 0, y: 0, z: 1 },
    value84 = Math.max(0.6, Number(distance) || 3);
  return { x: x6.x + box20.x * value84, y: groundY, z: x6.z + box20.z * value84 };
}
export function computeSceneCenterGroundPlacement({
  pose: pose2,
  groundY: groundY = 0,
  minDistance: minDistance = 0.6,
  maxDistance: maxDistance = 80,
} = {}) {
  const x8 = normalizeVector3(pose2?.position, { x: 0, y: 1.6, z: 0 }),
    box21 = normalize3(
      normalizeVector3(
        pose2?.forward ||
          (pose2?.rotation
            ? rotationToForwardVector(pose2.rotation)
            : forwardVectorFromYawPitch(pose2?.yaw, pose2?.pitch)),
        { x: 0, y: -0.5, z: 1 },
      ),
      { x: 0, y: -0.5, z: 1 },
    ),
    value85 = 0.00001;
  if (Math.abs(box21.y) <= value85) return null;
  const value86 = (groundY - x8.y) / box21.y;
  if (!Number.isFinite(value86) || value86 <= minDistance) return null;
  const value87 = Math.min(value86, Math.max(minDistance, maxDistance));
  return { x: x8.x + box21.x * value87, y: groundY, z: x8.z + box21.z * value87 };
}
function resolveSceneViewTargetGroundPoint(box22, y2 = 0) {
  return { x: Number(box22?.x) || 0, y: y2, z: Number(box22?.z) || 0 };
}
export function resolveObjectPlacementPoint({
  sceneMode: sceneMode = 'scene',
  sceneViewTarget: sceneViewTarget = null,
  pose: pose3,
  groundY: groundY = 0,
  forwardDistance: forwardDistance = 3,
} = {}) {
  const value88 =
    sceneMode === 'scene'
      ? resolveSceneViewTargetGroundPoint(sceneViewTarget, groundY)
      : computeForwardPlacement({ pose: pose3, distance: forwardDistance, groundY: groundY });
  if (sceneMode !== 'scene') return value88;
  return computeSceneCenterGroundPlacement({ pose: pose3, groundY: groundY }) || value88;
}
export function resolveBatchPlacementOrigin(args4 = {}) {
  return resolveObjectPlacementPoint({ forwardDistance: 3.2, ...args4 });
}
export function computeGridPlacement({
  rows: rows = 1,
  cols: cols = 1,
  spacingX: spacingX = 1.8,
  spacingZ: spacingZ = 1.8,
  origin: origin = { x: 0, y: 0, z: 0 },
  yaw: yaw = 0,
} = {}) {
  const value89 = Math.max(1, Math.round(Number(rows) || 1)),
    value90 = Math.max(1, Math.round(Number(cols) || 1)),
    value91 = Math.max(0.5, Number(spacingX) || 1.8),
    value92 = Math.max(0.5, Number(spacingZ) || 1.8),
    x9 = normalizeVector3(origin, { x: 0, y: 0, z: 0 }),
    x10 = forwardVectorFromYawPitch(yaw, 0),
    lengthXZ3 = lengthXZ(x10),
    x11 = lengthXZ3 > 0.0001 ? { x: x10.x / lengthXZ3, y: 0, z: x10.z / lengthXZ3 } : { x: 0, y: 0, z: 1 },
    box23 = { x: x11.z, y: 0, z: -x11.x },
    list = [];
  for (let value93 = 0; value93 < value89; value93++) {
    for (let value94 = 0; value94 < value90; value94++) {
      const value95 = (value94 - (value90 - 1) / 2) * value91,
        value96 = (value93 - (value89 - 1) / 2) * value92;
      list.push({
        x: x9.x + box23.x * value95 + x11.x * value96,
        y: x9.y,
        z: x9.z + box23.z * value95 + x11.z * value96,
      });
    }
  }
  return list;
}
export function cameraPoseToSceneView(value97, value98 = 8) {
  const x12 = normalizeVector3(value97?.position, { x: 0, y: 1.6, z: 4 }),
    x13 = resolvePoseForwardVector(value97, { x: 0, y: 0, z: -1 }),
    orbitDistance2 = Math.max(SCENE_ORBIT_DISTANCE_MIN, Number(value98) || 8),
    value99 = Math.hypot(x13.x, x13.y, x13.z) || 1,
    box24 = { x: x13.x / value99, y: x13.y / value99, z: x13.z / value99 },
    target2 = {
      x: x12.x + box24.x * orbitDistance2,
      y: x12.y + box24.y * orbitDistance2,
      z: x12.z + box24.z * orbitDistance2,
    },
    value100 = Math.atan2(-box24.x, -box24.z),
    value101 = Math.asin(clamp(-box24.y, -1, 1));
  return {
    target: target2,
    orbitYaw: normalizeAngle(value100),
    orbitPitch: clampSceneOrbitPitch(value101),
    orbitDistance: orbitDistance2,
  };
}
export function cameraPoseToSceneViewFromReference(value102, event3) {
  const x14 = normalizeVector3(value102?.position, { x: 0, y: 1.6, z: 4 }),
    vector3 = normalizeVector3(event3?.target, { x: 0, y: 1.2, z: 0 }),
    clamp6 = clamp(Number(event3?.orbitDistance) || 8, SCENE_ORBIT_DISTANCE_MIN, SCENE_ORBIT_DISTANCE_MAX),
    poseForwardVector = resolvePoseForwardVector(value102, { x: 0, y: 0, z: -1 }),
    box25 = normalize3(poseForwardVector, { x: 0, y: 0, z: -1 }),
    dot2 = dot(subtract(vector3, x14), box25),
    orbitDistance3 =
      Number.isFinite(dot2) && dot2 > SCENE_ORBIT_DISTANCE_MIN
        ? clamp(dot2, SCENE_ORBIT_DISTANCE_MIN, SCENE_ORBIT_DISTANCE_MAX)
        : clamp6,
    target3 = {
      x: x14.x + box25.x * orbitDistance3,
      y: x14.y + box25.y * orbitDistance3,
      z: x14.z + box25.z * orbitDistance3,
    },
    value103 = Math.atan2(-box25.x, -box25.z),
    value104 = Math.asin(clamp(-box25.y, -1, 1));
  return {
    target: target3,
    orbitYaw: normalizeAngle(value103),
    orbitPitch: clampSceneOrbitPitch(value104),
    orbitDistance: orbitDistance3,
  };
}
export function cameraPoseToPanoramaView(value105) {
  const x15 = resolvePoseForwardVector(value105, { x: 0, y: 0, z: -1 }),
    value106 = Math.hypot(x15.x, x15.y, x15.z) || 1,
    box26 = { x: x15.x / value106, y: x15.y / value106, z: x15.z / value106 };
  return {
    yaw: normalizeAngle(Math.atan2(box26.x, box26.z)),
    pitch: clampPanoramaPitch(Math.asin(clamp(box26.y, -1, 1))),
    fov: clamp(Number(value105?.fov) || PANORAMA_FOV_DEFAULT, PANORAMA_FOV_MIN, PANORAMA_FOV_MAX),
  };
}
export function computeConstrainedMoveDelta({
  startPoint: startPoint,
  currentPoint: currentPoint,
  axis: axis,
  planeNormal: planeNormal,
  mode: mode = 'plane',
} = {}) {
  const vector32 = normalizeVector3(startPoint, { x: 0, y: 0, z: 0 }),
    vector33 = normalizeVector3(currentPoint, vector32),
    subtract2 = subtract(vector33, vector32);
  if (mode === 'axis') {
    const v33 = normalize3(axis, { x: 1, y: 0, z: 0 }),
      dot3 = dot(subtract2, v33);
    return scale(v33, dot3);
  }
  return subtractProjection(subtract2, planeNormal);
}
export function computeSignedRotationDelta({
  startPoint: startPoint2,
  currentPoint: currentPoint2,
  pivot: pivot,
  axis: axis2,
} = {}) {
  const vector34 = normalizeVector3(pivot, { x: 0, y: 0, z: 0 }),
    v34 = normalize3(axis2, { x: 0, y: 1, z: 0 }),
    subtractProjection2 = subtractProjection(subtract(startPoint2, vector34), v34),
    subtractProjection3 = subtractProjection(subtract(currentPoint2, vector34), v34),
    safeLength2 = safeLength(subtractProjection2),
    safeLength3 = safeLength(subtractProjection3);
  if (safeLength2 < 0.000001 || safeLength3 < 0.000001) return 0;
  const scale3 = scale(subtractProjection2, 1 / safeLength2),
    scale4 = scale(subtractProjection3, 1 / safeLength3),
    cross5 = cross(scale3, scale4),
    dot4 = dot(cross5, v34),
    clamp7 = clamp(dot(scale3, scale4), -1, 1);
  return Math.atan2(dot4, clamp7);
}
export function computeAxisScaleFactor({
  startPoint: startPoint3,
  currentPoint: currentPoint3,
  pivot: pivot2,
  axis: axis3,
  dragDirection: dragDirection = null,
  referenceDistance: referenceDistance = 1,
} = {}) {
  const v35 = normalize3(dragDirection || axis3, { x: 1, y: 0, z: 0 }),
    vector35 = normalizeVector3(pivot2, { x: 0, y: 0, z: 0 }),
    subtract3 = subtract(normalizeVector3(startPoint3, { x: 0, y: 0, z: 0 }), vector35),
    subtract4 = subtract(normalizeVector3(currentPoint3, { x: 0, y: 0, z: 0 }), vector35),
    dot5 = dot(subtract4, v35) - dot(subtract3, v35),
    value107 = Math.max(0.2, Number(referenceDistance) || 1);
  return clamp(1 + dot5 / value107, 0.01, 8);
}
export function computeAxisScaleFactorFromScreenDelta({
  startX: startX = 0,
  startY: startY = 0,
  currentX: currentX = 0,
  currentY: currentY = 0,
  axisDirection: axisDirection,
  referencePixels: referencePixels = 96,
} = {}) {
  const value108 = Number(axisDirection?.x),
    value109 = Number(axisDirection?.y),
    count2 = Math.hypot(value108, value109);
  if (!Number.isFinite(count2) || count2 < 0.000001) return 1;
  const value110 = (Number(currentX) || 0) - (Number(startX) || 0),
    value111 = (Number(currentY) || 0) - (Number(startY) || 0),
    value112 = (value110 * value108 + value111 * value109) / count2,
    value113 = Math.max(12, Number(referencePixels) || 96);
  return clamp(1 + value112 / value113, 0.01, 8);
}
export function computeUniformScaleFactor({
  startPoint: startPoint4,
  currentPoint: currentPoint4,
  pivot: pivot3,
  minDistance: minDistance = 0.2,
} = {}) {
  const vector36 = normalizeVector3(pivot3, { x: 0, y: 0, z: 0 }),
    value114 = Math.max(Number(minDistance) || 0.2, safeLength(subtract(startPoint4, vector36))),
    value115 = Math.max(0.0001, safeLength(subtract(currentPoint4, vector36)));
  return clamp(value115 / value114, 0.01, 8);
}
const SCENE_ORBIT_POLE_MARGIN = 0.01;

export const SCENE_NAVIGATION_REFERENCE_FOCAL_LENGTH_MM = 35;

const SCENE_PAN_SCREEN_GAIN = 0.9,
  SCENE_CLOSE_PAN_SCREEN_GAIN = 0.82,
  WHEEL_LINE_HEIGHT_PX = 16,
  WHEEL_DELTA_LIMIT_PX = 240;

export function computePerspectiveFrameDistance({
  radius: radius,
  fov: fov = 58,
  aspect: aspect = 1,
  padding: padding = 1.18,
  minDistance: minDistance = SCENE_ORBIT_DISTANCE_MIN,
  maxDistance: maxDistance = SCENE_ORBIT_DISTANCE_MAX,
} = {}) {
  const value116 = Math.max(0.01, Number(radius) || 0.5),
    value117 = (clamp(Number(fov) || 58, 1, 179) * Math.PI) / 360,
    value118 = Math.max(0.1, Number(aspect) || 1),
    value119 = Math.atan(Math.tan(value117) * value118),
    value120 = Math.max(0.01, Math.min(value117, value119)),
    value121 = (value116 / Math.sin(value120)) * Math.max(1, Number(padding) || 1);
  return clamp(value121, minDistance, maxDistance);
}

export function resolveAdaptiveCameraClipPlanes({
  focusDistance: focusDistance,
  sceneExtent: sceneExtent = 0,
  sceneDistance: sceneDistance = 0,
} = {}) {
  const value122 = Math.max(SCENE_ORBIT_DISTANCE_MIN, Number(focusDistance) || 8),
    value123 = Math.max(0, Number(sceneExtent) || 0),
    value124 = Math.max(0, Number(sceneDistance) || 0),
    far = clamp(Math.max(250, value122 * 32, value123 * 4, value124 * 1.25), 250, 5000);
  return { near: clamp(Math.max(value122 * 0.01, far / 50000), 0.015, 0.25), far: far };
}

function resolveSceneOrbitProjectionGain(value125) {
  const fov2 = focalLengthToFov(SCENE_NAVIGATION_REFERENCE_FOCAL_LENGTH_MM),
    clamp8 = clamp(Number(value125) || fov2, 1, 179);
  return Math.tan((clamp8 * Math.PI) / 360) / Math.tan((fov2 * Math.PI) / 360);
}

export function applySceneFlyLookDelta(value126, value127, value128, value129, value130 = {}) {
  const x16 = resolveSceneCameraPose(value126),
    args5 = applyOrbitDelta(value126, value127, value128, value129, value130),
    x17 = Math.max(SCENE_ORBIT_DISTANCE_MIN, Number(value126?.orbitDistance) || x16.distance || 8),
    value131 = Math.cos(args5.orbitPitch),
    box27 = {
      x: x17 * Math.sin(args5.orbitYaw) * value131,
      y: x17 * Math.sin(args5.orbitPitch),
      z: x17 * Math.cos(args5.orbitYaw) * value131,
    };
  return {
    ...args5,
    target: {
      x: x16.position.x - box27.x,
      y: x16.position.y - box27.y,
      z: x16.position.z - box27.z,
    },
  };
}

export function applySceneFlyMovement(
  event4,
  box28 = {},
  value132 = 0,
  { speed: speed = 4, boostMultiplier: boostMultiplier = 4, minimumCameraY: minimumCameraY = 0.2 } = {},
) {
  const sceneCameraPose = resolveSceneCameraPose(event4),
    x18 = normalizeVector3(event4?.target, { x: 0, y: 1.2, z: 0 }),
    x19 = normalize3(subtract(x18, sceneCameraPose.position), { x: 0, y: 0, z: -1 }),
    value133 = { x: 0, y: 1, z: 0 },
    box29 = normalize3(cross(x19, value133), { x: 1, y: 0, z: 0 }),
    value134 = {
      x: x19.x * (Number(box28.forward) || 0) + box29.x * (Number(box28.right) || 0),
      y:
        x19.y * (Number(box28.forward) || 0) +
        box29.y * (Number(box28.right) || 0) +
        (Number(box28.vertical) || 0),
      z: x19.z * (Number(box28.forward) || 0) + box29.z * (Number(box28.right) || 0),
    },
    length33 = length3(value134),
    value135 = length33 > 1 ? normalize3(value134) : value134,
    value136 = box28.boost === true ? Math.max(1, Number(boostMultiplier) || 1) : 1,
    value137 =
      Math.max(0, Math.min(0.1, Number(value132) || 0)) * Math.max(0.01, Number(speed) || 4) * value136,
    box30 = scale(value135, value137),
    value138 = sceneCameraPose.position.y + box30.y;
  return (
    value138 < minimumCameraY && (box30.y += minimumCameraY - value138),
    {
      target: {
        x: x18.x + box30.x,
        y: x18.y + box30.y,
        z: x18.z + box30.z,
      },
    }
  );
}

function hasFiniteVector3(box31) {
  return (
    Number.isFinite(Number(box31?.x)) &&
    Number.isFinite(Number(box31?.y)) &&
    Number.isFinite(Number(box31?.z))
  );
}

export function normalizeWheelDelta(value139, value140 = 0, value141 = 800) {
  const value142 = Number(value139) || 0,
    count3 = Number(value140) || 0,
    value143 =
      count3 === 1
        ? WHEEL_LINE_HEIGHT_PX
        : count3 === 2
          ? Math.max(120, Number(value141) || 800)
          : 1;
  return clamp(value142 * value143, -WHEEL_DELTA_LIMIT_PX, WHEEL_DELTA_LIMIT_PX);
}
