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
function clamp(_0x32f179, _0x1c4080, _0x3d25c7) {
  return Math.min(_0x3d25c7, Math.max(_0x1c4080, _0x32f179));
}
function resolveFullFrameSensorHeight(_0x53bfae = SCENE_SENSOR_WIDTH_MM) {
  const _0x32b88f = Math.max(1, Number(_0x53bfae) || SCENE_SENSOR_WIDTH_MM);
  return _0x32b88f * (2 / 3);
}
function smoothstep(_0x209bfa, _0xbf4d50, _0x372860) {
  if (!(_0x372860 > _0xbf4d50)) return _0x209bfa >= _0x372860 ? 1 : 0;
  const _0x336338 = clamp((_0x209bfa - _0xbf4d50) / (_0x372860 - _0xbf4d50), 0, 1);
  return _0x336338 * _0x336338 * (3 - 2 * _0x336338);
}
function computeSceneOrbitDistanceResponse(_0x4703f4) {
  const _0x30e332 = 1 - 0.35 * (1 - smoothstep(_0x4703f4, SCENE_ORBIT_DISTANCE_MIN, 0.6)),
    _0x3eb8a2 = 1 - 0.22 * smoothstep(_0x4703f4, 18, 90);
  return _0x30e332 * _0x3eb8a2;
}
function normalizeVector3(_0x5926c7, _0x2f8fe1 = { x: 0, y: 0, z: 0 }) {
  return {
    x: Number.isFinite(_0x5926c7?.x) ? _0x5926c7.x : _0x2f8fe1.x,
    y: Number.isFinite(_0x5926c7?.y) ? _0x5926c7.y : _0x2f8fe1.y,
    z: Number.isFinite(_0x5926c7?.z) ? _0x5926c7.z : _0x2f8fe1.z,
  };
}
function normalizeQuaternion(_0x531767, _0x583af8 = { x: 0, y: 0, z: 0, w: 1 }) {
  const _0x582a7e = Number(_0x531767?.x),
    _0x436a87 = Number(_0x531767?.y),
    _0x33eae1 = Number(_0x531767?.z),
    _0x5cc75f = Number(_0x531767?.w);
  if (
    !Number.isFinite(_0x582a7e) ||
    !Number.isFinite(_0x436a87) ||
    !Number.isFinite(_0x33eae1) ||
    !Number.isFinite(_0x5cc75f)
  )
    return { ..._0x583af8 };
  const _0xae6f4 = Math.hypot(_0x582a7e, _0x436a87, _0x33eae1, _0x5cc75f);
  if (_0xae6f4 < 0.000001) return { ..._0x583af8 };
  return {
    x: _0x582a7e / _0xae6f4,
    y: _0x436a87 / _0xae6f4,
    z: _0x33eae1 / _0xae6f4,
    w: _0x5cc75f / _0xae6f4,
  };
}
function quaternionToForwardVector(_0x72674e) {
  const _0x38c4b6 = normalizeQuaternion(_0x72674e);
  return {
    x: -(2 * (_0x38c4b6.x * _0x38c4b6.z + _0x38c4b6.w * _0x38c4b6.y)),
    y: -(2 * (_0x38c4b6.y * _0x38c4b6.z - _0x38c4b6.w * _0x38c4b6.x)),
    z: -(1 - 2 * (_0x38c4b6.x * _0x38c4b6.x + _0x38c4b6.y * _0x38c4b6.y)),
  };
}
function resolvePoseForwardVector(_0x45357c, _0x2fb8d5) {
  if (_0x45357c?.quaternion)
    return normalizeVector3(quaternionToForwardVector(_0x45357c.quaternion), _0x2fb8d5);
  if (_0x45357c?.rotation) return normalizeVector3(rotationToForwardVector(_0x45357c.rotation), _0x2fb8d5);
  if (_0x45357c?.forward) return normalizeVector3(_0x45357c.forward, _0x2fb8d5);
  return { ..._0x2fb8d5 };
}
function lengthXZ(_0x42df2c) {
  return Math.hypot(_0x42df2c.x, _0x42df2c.z);
}
function length3(_0x22315b) {
  return Math.hypot(_0x22315b.x, _0x22315b.y, _0x22315b.z);
}
function normalize3(_0xec64ad, _0x315d61 = { x: 0, y: 0, z: 0 }) {
  const _0x18a04e = length3(_0xec64ad) || 0;
  if (_0x18a04e < 0.000001) return { ..._0x315d61 };
  return { x: _0xec64ad.x / _0x18a04e, y: _0xec64ad.y / _0x18a04e, z: _0xec64ad.z / _0x18a04e };
}
function cross(_0x36ed05, _0x3d12bd) {
  return {
    x: _0x36ed05.y * _0x3d12bd.z - _0x36ed05.z * _0x3d12bd.y,
    y: _0x36ed05.z * _0x3d12bd.x - _0x36ed05.x * _0x3d12bd.z,
    z: _0x36ed05.x * _0x3d12bd.y - _0x36ed05.y * _0x3d12bd.x,
  };
}
function dot(_0x1dbb99, _0xd6dafe) {
  return (
    (Number(_0x1dbb99?.x) || 0) * (Number(_0xd6dafe?.x) || 0) +
    (Number(_0x1dbb99?.y) || 0) * (Number(_0xd6dafe?.y) || 0) +
    (Number(_0x1dbb99?.z) || 0) * (Number(_0xd6dafe?.z) || 0)
  );
}
function subtract(_0xd1082d, _0x57d598) {
  return {
    x: (Number(_0xd1082d?.x) || 0) - (Number(_0x57d598?.x) || 0),
    y: (Number(_0xd1082d?.y) || 0) - (Number(_0x57d598?.y) || 0),
    z: (Number(_0xd1082d?.z) || 0) - (Number(_0x57d598?.z) || 0),
  };
}
function scale(_0x3227b3, _0xdd89f2) {
  const _0x5818e6 = Number(_0xdd89f2) || 0;
  return {
    x: (Number(_0x3227b3?.x) || 0) * _0x5818e6,
    y: (Number(_0x3227b3?.y) || 0) * _0x5818e6,
    z: (Number(_0x3227b3?.z) || 0) * _0x5818e6,
  };
}
function subtractProjection(_0x46fa57, _0x5ee1ce) {
  const _0x5387d6 = normalize3(_0x5ee1ce, { x: 0, y: 1, z: 0 }),
    _0x3c10cb = scale(_0x5387d6, dot(_0x46fa57, _0x5387d6));
  return subtract(_0x46fa57, _0x3c10cb);
}
function safeLength(_0x1ebdca) {
  return Math.hypot(Number(_0x1ebdca?.x) || 0, Number(_0x1ebdca?.y) || 0, Number(_0x1ebdca?.z) || 0);
}
export function clampPanoramaPitch(_0x5b95be) {
  return clamp(Number(_0x5b95be) || 0, -PANORAMA_PITCH_LIMIT, PANORAMA_PITCH_LIMIT);
}
export function clampSceneOrbitPitch(_0x1c784c) {
  return clamp(Number(_0x1c784c) || 0, SCENE_PITCH_MIN, SCENE_PITCH_MAX);
}
export function normalizeAngle(_0x3377b1) {
  const _0x1be9b8 = Number(_0x3377b1) || 0,
    _0x2a9669 = (((_0x1be9b8 + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  return _0x2a9669 - Math.PI;
}
export function computeStableGridSnap(_0x2c5644, _0x5c619f, _0x3b91de = null, _0x56012b = 0.12) {
  const _0x160ab4 = Math.max(0.0001, Number(_0x5c619f) || 1),
    _0x470ede = Number(_0x2c5644) || 0,
    _0x10b48e = Math.round(_0x470ede / _0x160ab4) * _0x160ab4,
    _0x39423b = Number(_0x3b91de);
  if (!Number.isFinite(_0x39423b)) return _0x10b48e;
  if (Math.abs(_0x10b48e - _0x39423b) < 0.000001) return _0x39423b;
  const _0x4f246c = clamp(Number(_0x56012b) || 0, 0, 0.45),
    _0x21a5f6 = _0x160ab4 * (0.5 + _0x4f246c);
  return Math.abs(_0x470ede - _0x39423b) < _0x21a5f6 ? _0x39423b : _0x10b48e;
}
export function computeDampingFactor(_0x4f1fea, _0x433e79 = 120) {
  const _0x116cd1 = Math.max(0, Number(_0x4f1fea) || 0),
    _0x73f453 = Math.max(1, Number(_0x433e79) || 120);
  return 1 - Math.exp(-_0x116cd1 / _0x73f453);
}
export function dampScalar(_0xebe01e, _0x5280fd, _0x93a9cc, _0x280457 = 120) {
  const _0x4ae513 = computeDampingFactor(_0x93a9cc, _0x280457),
    _0x4bef62 = Number(_0xebe01e) || 0,
    _0x1da34e = Number(_0x5280fd) || 0;
  return _0x4bef62 + (_0x1da34e - _0x4bef62) * _0x4ae513;
}
export function dampAngle(_0x5c92ca, _0x36903d, _0x4f058c, _0x39cbcb = 120) {
  const _0x454a5f = computeDampingFactor(_0x4f058c, _0x39cbcb),
    _0x294967 = Number(_0x5c92ca) || 0,
    _0x1ec0e3 = Number(_0x36903d) || 0,
    _0x49d799 = normalizeAngle(_0x1ec0e3 - _0x294967);
  return normalizeAngle(_0x294967 + _0x49d799 * _0x454a5f);
}
export function forwardVectorFromYawPitch(_0x38e8c9, _0x25913a = 0) {
  const _0x179113 = Number(_0x38e8c9) || 0,
    _0x130fc4 = Number(_0x25913a) || 0,
    _0x173410 = Math.cos(_0x130fc4);
  return { x: Math.sin(_0x179113) * _0x173410, y: Math.sin(_0x130fc4), z: Math.cos(_0x179113) * _0x173410 };
}
export function rotationToForwardVector(_0x5926b9) {
  const _0x2d5ee7 = Number(_0x5926b9?.x) || 0,
    _0x3ffc2b = Number(_0x5926b9?.y) || 0;
  return forwardVectorFromYawPitch(_0x3ffc2b, -_0x2d5ee7);
}
export function clampSceneFocalLength(_0x19ea9b) {
  return clamp(
    Number(_0x19ea9b) || SCENE_DEFAULT_FOCAL_LENGTH_MM,
    SCENE_FOCAL_LENGTH_MIN_MM,
    SCENE_FOCAL_LENGTH_MAX_MM,
  );
}
export function focalLengthToFov(_0x3170fa, _0x153dea = SCENE_SENSOR_WIDTH_MM) {
  const _0x28689b = clampSceneFocalLength(_0x3170fa),
    _0x565714 = resolveFullFrameSensorHeight(_0x153dea),
    _0x8e4716 = 2 * Math.atan(_0x565714 / (2 * _0x28689b));
  return (_0x8e4716 * 180) / Math.PI;
}
export function fovToFocalLength(_0x18c467, _0xa20add = SCENE_SENSOR_WIDTH_MM) {
  const _0xead9f5 = clamp(Number(_0x18c467) || focalLengthToFov(SCENE_DEFAULT_FOCAL_LENGTH_MM), 18, 100),
    _0x4c8f68 = resolveFullFrameSensorHeight(_0xa20add),
    _0x5a37b3 = _0x4c8f68 / (2 * Math.tan((_0xead9f5 * Math.PI) / 180 / 2));
  return clampSceneFocalLength(_0x5a37b3);
}
export function resolveSceneCameraPose(_0x2f81bc, _0x426000 = 58) {
  const _0x23e443 = normalizeVector3(_0x2f81bc?.target, { x: 0, y: 1.2, z: 0 }),
    _0x133e85 = Math.max(SCENE_ORBIT_DISTANCE_MIN, Number(_0x2f81bc?.orbitDistance) || 8),
    _0x1e08db = Number(_0x2f81bc?.orbitYaw) || 0,
    _0x404eda = clampSceneOrbitPitch(_0x2f81bc?.orbitPitch),
    _0x153621 = Math.cos(_0x404eda),
    _0xd197bf = {
      x: _0x23e443.x + _0x133e85 * Math.sin(_0x1e08db) * _0x153621,
      y: _0x23e443.y + _0x133e85 * Math.sin(_0x404eda),
      z: _0x23e443.z + _0x133e85 * Math.cos(_0x1e08db) * _0x153621,
    };
  return {
    kind: 'scene-default',
    position: _0xd197bf,
    target: _0x23e443,
    yaw: _0x1e08db,
    pitch: _0x404eda,
    distance: _0x133e85,
    fov: Math.max(1, Number(_0x426000) || 58),
  };
}
export function resolvePanoramaViewPose(_0x456c88, _0x5999c0 = { x: 0, y: 0, z: 0 }) {
  const _0x5a14db = Number(_0x456c88?.yaw) || 0,
    _0x3d3a3c = clampPanoramaPitch(_0x456c88?.pitch);
  return {
    kind: 'panorama-default',
    position: normalizeVector3(_0x5999c0, { x: 0, y: 0, z: 0 }),
    yaw: _0x5a14db,
    pitch: _0x3d3a3c,
    fov: Math.max(
      PANORAMA_FOV_MIN,
      Math.min(PANORAMA_FOV_MAX, Number(_0x456c88?.fov) || PANORAMA_FOV_DEFAULT),
    ),
  };
}
export function applyOrbitDelta(_0x1f7b87, _0x193b0c, _0x18b33b, _0x11107d) {
  const _0xfc2973 = Math.max(120, Number(_0x11107d?.width) || 1),
    _0x37535b = Math.max(120, Number(_0x11107d?.height) || 1),
    _0x238c95 = (_0x193b0c / _0xfc2973) * Math.PI * 1.75,
    _0x4138a3 = (_0x18b33b / _0x37535b) * Math.PI * 1.25;
  return {
    orbitYaw: normalizeAngle((Number(_0x1f7b87?.orbitYaw) || 0) - _0x238c95),
    orbitPitch: clampSceneOrbitPitch((Number(_0x1f7b87?.orbitPitch) || 0) + _0x4138a3),
  };
}
export function applyPanoramaLookDelta(_0x244f5d, _0x2469a0, _0x4e9e15, _0x437551) {
  const _0x20da2c = Math.max(120, Number(_0x437551?.width) || 1),
    _0x14da24 = Math.max(120, Number(_0x437551?.height) || 1),
    _0x1062e0 = (_0x2469a0 / _0x20da2c) * Math.PI * 1.75,
    _0x58b222 = (_0x4e9e15 / _0x14da24) * Math.PI * 1.25;
  return {
    yaw: normalizeAngle((Number(_0x244f5d?.yaw) || 0) - _0x1062e0),
    pitch: clampPanoramaPitch((Number(_0x244f5d?.pitch) || 0) + _0x58b222),
  };
}
export function applyScenePanDelta(_0x551e49, _0x679127, _0x24f2b4, _0x4c6889, _0x1c531e) {
  const _0x12edd0 = Math.max(120, Number(_0x1c531e?.height) || 1),
    _0x2fd5d7 = Math.max(
      SCENE_ORBIT_DISTANCE_MIN,
      Number(_0x551e49?.orbitDistance) || Number(_0x679127?.distance) || 8,
    ),
    _0x39cea2 = ((Number(_0x679127?.fov) || 58) * Math.PI) / 180,
    _0x2ac23c = (2 * Math.tan(_0x39cea2 / 2) * _0x2fd5d7) / _0x12edd0,
    _0x6241a7 = smoothstep(_0x2fd5d7, SCENE_ORBIT_DISTANCE_MIN, 0.25),
    _0x54acb0 = 0.92 + _0x6241a7 * 0.18,
    _0x3fed51 = 1 - 0.28 * smoothstep(_0x2fd5d7, 6, 24),
    _0x4c1355 = _0x2ac23c * _0x54acb0 * _0x3fed51,
    _0x16253a = normalize3(
      normalizeVector3(_0x679127?.forward || forwardVectorFromYawPitch(_0x679127?.yaw, _0x679127?.pitch), {
        x: 0,
        y: 0,
        z: 1,
      }),
      { x: 0, y: 0, z: 1 },
    ),
    _0x4ef615 = { x: 0, y: 1, z: 0 },
    _0x21efb0 = { x: 0, y: 0, z: 1 },
    _0x137345 = cross(_0x4ef615, _0x16253a),
    _0x1d3ac3 = cross(_0x21efb0, _0x16253a),
    _0x510961 =
      length3(_0x137345) > 0.000001
        ? normalize3(_0x137345, { x: 1, y: 0, z: 0 })
        : normalize3(_0x1d3ac3, { x: 1, y: 0, z: 0 }),
    _0x15a09a = cross(_0x16253a, _0x510961),
    _0x40610b =
      length3(_0x15a09a) > 0.000001 ? normalize3(_0x15a09a, { x: 0, y: 1, z: 0 }) : { x: 0, y: 1, z: 0 },
    _0x534638 = _0x24f2b4 * _0x4c1355,
    _0x4f63e5 = _0x4c6889 * _0x4c1355,
    _0x35929c = normalizeVector3(_0x551e49?.target, { x: 0, y: 1.2, z: 0 });
  return {
    target: {
      x: _0x35929c.x + _0x510961.x * _0x534638 + _0x40610b.x * _0x4f63e5,
      y: _0x35929c.y + _0x510961.y * _0x534638 + _0x40610b.y * _0x4f63e5,
      z: _0x35929c.z + _0x510961.z * _0x534638 + _0x40610b.z * _0x4f63e5,
    },
  };
}
function applySceneOrbitDistanceDelta(_0x30aa28, _0x138453, _0x29e1dc) {
  const _0x36156e = clamp(
      Number(_0x30aa28?.orbitDistance) || 8,
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    ),
    _0x42e54a = computeSceneOrbitDistanceResponse(_0x36156e),
    _0x27e26f = clamp(
      _0x36156e * Math.exp((Number(_0x138453) || 0) * _0x29e1dc * _0x42e54a),
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    );
  return { orbitDistance: _0x27e26f };
}
export function applySceneZoomDelta(_0x244195, _0x19c537) {
  return applySceneOrbitDistanceDelta(_0x244195, _0x19c537, SCENE_WHEEL_DOLLY_FACTOR);
}
export function applySceneDollyDelta(_0x29a5a1, _0x5b32b2) {
  return applySceneOrbitDistanceDelta(_0x29a5a1, _0x5b32b2, SCENE_DRAG_DOLLY_FACTOR);
}
export function applyPanoramaZoomDelta(_0x130683, _0x4b098f) {
  return {
    fov: clamp(
      (Number(_0x130683?.fov) || PANORAMA_FOV_DEFAULT) * Math.exp((Number(_0x4b098f) || 0) * 0.00045),
      PANORAMA_FOV_MIN,
      PANORAMA_FOV_MAX,
    ),
  };
}
export function computeForwardPlacement({
  pose: _0x2a33e8,
  distance: distance = 3,
  groundY: groundY = 0,
  eyeHeight: eyeHeight = 1.6,
} = {}) {
  const _0x33992d = normalizeVector3(_0x2a33e8?.position, { x: 0, y: eyeHeight, z: 0 }),
    _0x418aec = normalizeVector3(
      _0x2a33e8?.forward ||
        (_0x2a33e8?.rotation
          ? rotationToForwardVector(_0x2a33e8.rotation)
          : forwardVectorFromYawPitch(_0x2a33e8?.yaw, _0x2a33e8?.pitch)),
      { x: 0, y: 0, z: 1 },
    ),
    _0x5cd6d0 = lengthXZ(_0x418aec),
    _0x891c9c =
      _0x5cd6d0 > 0.0001
        ? { x: _0x418aec.x / _0x5cd6d0, y: 0, z: _0x418aec.z / _0x5cd6d0 }
        : { x: 0, y: 0, z: 1 },
    _0x4f4d48 = Math.max(0.6, Number(distance) || 3);
  return { x: _0x33992d.x + _0x891c9c.x * _0x4f4d48, y: groundY, z: _0x33992d.z + _0x891c9c.z * _0x4f4d48 };
}
export function computeSceneCenterGroundPlacement({
  pose: _0x2300d6,
  groundY: groundY = 0,
  minDistance: minDistance = 0.6,
  maxDistance: maxDistance = 80,
} = {}) {
  const _0x2a31f6 = normalizeVector3(_0x2300d6?.position, { x: 0, y: 1.6, z: 0 }),
    _0x39bcf2 = normalize3(
      normalizeVector3(
        _0x2300d6?.forward ||
          (_0x2300d6?.rotation
            ? rotationToForwardVector(_0x2300d6.rotation)
            : forwardVectorFromYawPitch(_0x2300d6?.yaw, _0x2300d6?.pitch)),
        { x: 0, y: -0.5, z: 1 },
      ),
      { x: 0, y: -0.5, z: 1 },
    ),
    _0x50aef5 = 0.00001;
  if (Math.abs(_0x39bcf2.y) <= _0x50aef5) return null;
  const _0x4dbd60 = (groundY - _0x2a31f6.y) / _0x39bcf2.y;
  if (!Number.isFinite(_0x4dbd60) || _0x4dbd60 <= minDistance) return null;
  const _0x5870bb = Math.min(_0x4dbd60, Math.max(minDistance, maxDistance));
  return { x: _0x2a31f6.x + _0x39bcf2.x * _0x5870bb, y: groundY, z: _0x2a31f6.z + _0x39bcf2.z * _0x5870bb };
}
function resolveSceneViewTargetGroundPoint(_0x3b0ff9, _0x4f082e = 0) {
  return { x: Number(_0x3b0ff9?.x) || 0, y: _0x4f082e, z: Number(_0x3b0ff9?.z) || 0 };
}
export function resolveObjectPlacementPoint({
  sceneMode: sceneMode = 'scene',
  sceneViewTarget: sceneViewTarget = null,
  pose: _0x5a33f6,
  groundY: groundY = 0,
  forwardDistance: forwardDistance = 3,
} = {}) {
  const _0xf58bc =
    sceneMode === 'scene'
      ? resolveSceneViewTargetGroundPoint(sceneViewTarget, groundY)
      : computeForwardPlacement({ pose: _0x5a33f6, distance: forwardDistance, groundY: groundY });
  if (sceneMode !== 'scene') return _0xf58bc;
  return computeSceneCenterGroundPlacement({ pose: _0x5a33f6, groundY: groundY }) || _0xf58bc;
}
export function resolveBatchPlacementOrigin(_0xf894bd = {}) {
  return resolveObjectPlacementPoint({ forwardDistance: 3.2, ..._0xf894bd });
}
export function computeGridPlacement({
  rows: rows = 1,
  cols: cols = 1,
  spacingX: spacingX = 1.8,
  spacingZ: spacingZ = 1.8,
  origin: origin = { x: 0, y: 0, z: 0 },
  yaw: yaw = 0,
} = {}) {
  const _0x16e7db = Math.max(1, Math.round(Number(rows) || 1)),
    _0x5e22a0 = Math.max(1, Math.round(Number(cols) || 1)),
    _0x4b786a = Math.max(0.5, Number(spacingX) || 1.8),
    _0x3a913a = Math.max(0.5, Number(spacingZ) || 1.8),
    _0x1d5eaa = normalizeVector3(origin, { x: 0, y: 0, z: 0 }),
    _0x5ca997 = forwardVectorFromYawPitch(yaw, 0),
    _0x245e58 = lengthXZ(_0x5ca997),
    _0x21d15c =
      _0x245e58 > 0.0001
        ? { x: _0x5ca997.x / _0x245e58, y: 0, z: _0x5ca997.z / _0x245e58 }
        : { x: 0, y: 0, z: 1 },
    _0x19ded6 = { x: _0x21d15c.z, y: 0, z: -_0x21d15c.x },
    _0x404e9f = [];
  for (let _0x332afd = 0; _0x332afd < _0x16e7db; _0x332afd++) {
    for (let _0x438d53 = 0; _0x438d53 < _0x5e22a0; _0x438d53++) {
      const _0x54ed09 = (_0x438d53 - (_0x5e22a0 - 1) / 2) * _0x4b786a,
        _0x1e7738 = (_0x332afd - (_0x16e7db - 1) / 2) * _0x3a913a;
      _0x404e9f.push({
        x: _0x1d5eaa.x + _0x19ded6.x * _0x54ed09 + _0x21d15c.x * _0x1e7738,
        y: _0x1d5eaa.y,
        z: _0x1d5eaa.z + _0x19ded6.z * _0x54ed09 + _0x21d15c.z * _0x1e7738,
      });
    }
  }
  return _0x404e9f;
}
export function cameraPoseToSceneView(_0x2573a7, _0x2c6ea1 = 8) {
  const _0x3e13dc = normalizeVector3(_0x2573a7?.position, { x: 0, y: 1.6, z: 4 }),
    _0x3bb481 = resolvePoseForwardVector(_0x2573a7, { x: 0, y: 0, z: -1 }),
    _0x3acf15 = Math.max(SCENE_ORBIT_DISTANCE_MIN, Number(_0x2c6ea1) || 8),
    _0x1ace42 = Math.hypot(_0x3bb481.x, _0x3bb481.y, _0x3bb481.z) || 1,
    _0x4e2fdc = { x: _0x3bb481.x / _0x1ace42, y: _0x3bb481.y / _0x1ace42, z: _0x3bb481.z / _0x1ace42 },
    _0x249ff2 = {
      x: _0x3e13dc.x + _0x4e2fdc.x * _0x3acf15,
      y: _0x3e13dc.y + _0x4e2fdc.y * _0x3acf15,
      z: _0x3e13dc.z + _0x4e2fdc.z * _0x3acf15,
    },
    _0x19691d = Math.atan2(-_0x4e2fdc.x, -_0x4e2fdc.z),
    _0x3d8237 = Math.asin(clamp(-_0x4e2fdc.y, -1, 1));
  return {
    target: _0x249ff2,
    orbitYaw: normalizeAngle(_0x19691d),
    orbitPitch: clampSceneOrbitPitch(_0x3d8237),
    orbitDistance: _0x3acf15,
  };
}
export function cameraPoseToSceneViewFromReference(_0x5c21dc, _0x2dcb7f) {
  const _0x2478df = normalizeVector3(_0x5c21dc?.position, { x: 0, y: 1.6, z: 4 }),
    _0x19c654 = normalizeVector3(_0x2dcb7f?.target, { x: 0, y: 1.2, z: 0 }),
    _0x34508b = clamp(
      Number(_0x2dcb7f?.orbitDistance) || 8,
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    ),
    _0x401fba = resolvePoseForwardVector(_0x5c21dc, { x: 0, y: 0, z: -1 }),
    _0x319a61 = normalize3(_0x401fba, { x: 0, y: 0, z: -1 }),
    _0x1d07fd = dot(subtract(_0x19c654, _0x2478df), _0x319a61),
    _0x5d0210 =
      Number.isFinite(_0x1d07fd) && _0x1d07fd > SCENE_ORBIT_DISTANCE_MIN
        ? clamp(_0x1d07fd, SCENE_ORBIT_DISTANCE_MIN, SCENE_ORBIT_DISTANCE_MAX)
        : _0x34508b,
    _0x5c618e = {
      x: _0x2478df.x + _0x319a61.x * _0x5d0210,
      y: _0x2478df.y + _0x319a61.y * _0x5d0210,
      z: _0x2478df.z + _0x319a61.z * _0x5d0210,
    },
    _0x27b128 = Math.atan2(-_0x319a61.x, -_0x319a61.z),
    _0x5df09b = Math.asin(clamp(-_0x319a61.y, -1, 1));
  return {
    target: _0x5c618e,
    orbitYaw: normalizeAngle(_0x27b128),
    orbitPitch: clampSceneOrbitPitch(_0x5df09b),
    orbitDistance: _0x5d0210,
  };
}
export function cameraPoseToPanoramaView(_0x3f64dd) {
  const _0x1d671 = resolvePoseForwardVector(_0x3f64dd, { x: 0, y: 0, z: -1 }),
    _0x1f497c = Math.hypot(_0x1d671.x, _0x1d671.y, _0x1d671.z) || 1,
    _0x567a4a = { x: _0x1d671.x / _0x1f497c, y: _0x1d671.y / _0x1f497c, z: _0x1d671.z / _0x1f497c };
  return {
    yaw: normalizeAngle(Math.atan2(_0x567a4a.x, _0x567a4a.z)),
    pitch: clampPanoramaPitch(Math.asin(clamp(_0x567a4a.y, -1, 1))),
    fov: clamp(Number(_0x3f64dd?.fov) || PANORAMA_FOV_DEFAULT, PANORAMA_FOV_MIN, PANORAMA_FOV_MAX),
  };
}
export function computeConstrainedMoveDelta({
  startPoint: _0x2a8ab1,
  currentPoint: _0x4dd4ff,
  axis: _0x4b54f7,
  planeNormal: _0x226e99,
  mode: mode = 'plane',
} = {}) {
  const _0x294447 = normalizeVector3(_0x2a8ab1, { x: 0, y: 0, z: 0 }),
    _0x35d487 = normalizeVector3(_0x4dd4ff, _0x294447),
    _0xab678b = subtract(_0x35d487, _0x294447);
  if (mode === 'axis') {
    const _0xe99c57 = normalize3(_0x4b54f7, { x: 1, y: 0, z: 0 }),
      _0x5976c1 = dot(_0xab678b, _0xe99c57);
    return scale(_0xe99c57, _0x5976c1);
  }
  return subtractProjection(_0xab678b, _0x226e99);
}
export function computeSignedRotationDelta({
  startPoint: _0x2f18ea,
  currentPoint: _0x30f17b,
  pivot: _0x2e1498,
  axis: _0x3ce54a,
} = {}) {
  const _0x3866f6 = normalizeVector3(_0x2e1498, { x: 0, y: 0, z: 0 }),
    _0x400607 = normalize3(_0x3ce54a, { x: 0, y: 1, z: 0 }),
    _0x5b055d = subtractProjection(subtract(_0x2f18ea, _0x3866f6), _0x400607),
    _0x1824cd = subtractProjection(subtract(_0x30f17b, _0x3866f6), _0x400607),
    _0x226e62 = safeLength(_0x5b055d),
    _0x1544a4 = safeLength(_0x1824cd);
  if (_0x226e62 < 0.000001 || _0x1544a4 < 0.000001) return 0;
  const _0x4d025f = scale(_0x5b055d, 1 / _0x226e62),
    _0x2b9c1f = scale(_0x1824cd, 1 / _0x1544a4),
    _0x474367 = cross(_0x4d025f, _0x2b9c1f),
    _0x3e5678 = dot(_0x474367, _0x400607),
    _0x25cfd1 = clamp(dot(_0x4d025f, _0x2b9c1f), -1, 1);
  return Math.atan2(_0x3e5678, _0x25cfd1);
}
export function computeAxisScaleFactor({
  startPoint: _0x25a39,
  currentPoint: _0x2d866f,
  pivot: _0xab206e,
  axis: _0x36f7d1,
  dragDirection: dragDirection = null,
  referenceDistance: referenceDistance = 1,
} = {}) {
  const _0x2391e2 = normalize3(dragDirection || _0x36f7d1, { x: 1, y: 0, z: 0 }),
    _0x177e74 = normalizeVector3(_0xab206e, { x: 0, y: 0, z: 0 }),
    _0x13cc60 = subtract(normalizeVector3(_0x25a39, { x: 0, y: 0, z: 0 }), _0x177e74),
    _0x46b2ae = subtract(normalizeVector3(_0x2d866f, { x: 0, y: 0, z: 0 }), _0x177e74),
    _0x5223b8 = dot(_0x46b2ae, _0x2391e2) - dot(_0x13cc60, _0x2391e2),
    _0x10e727 = Math.max(0.2, Number(referenceDistance) || 1);
  return clamp(1 + _0x5223b8 / _0x10e727, 0.01, 8);
}
export function computeAxisScaleFactorFromScreenDelta({
  startX: startX = 0,
  startY: startY = 0,
  currentX: currentX = 0,
  currentY: currentY = 0,
  axisDirection: _0x16effe,
  referencePixels: referencePixels = 96,
} = {}) {
  const _0x1d1365 = Number(_0x16effe?.x),
    _0x16a90f = Number(_0x16effe?.y),
    _0x3b7c70 = Math.hypot(_0x1d1365, _0x16a90f);
  if (!Number.isFinite(_0x3b7c70) || _0x3b7c70 < 0.000001) return 1;
  const _0x5bfe84 = (Number(currentX) || 0) - (Number(startX) || 0),
    _0x5934a2 = (Number(currentY) || 0) - (Number(startY) || 0),
    _0x6d63b8 = (_0x5bfe84 * _0x1d1365 + _0x5934a2 * _0x16a90f) / _0x3b7c70,
    _0x6ab1ab = Math.max(12, Number(referencePixels) || 96);
  return clamp(1 + _0x6d63b8 / _0x6ab1ab, 0.01, 8);
}
export function computeUniformScaleFactor({
  startPoint: _0xd9fb43,
  currentPoint: _0x4de008,
  pivot: _0x20ecc7,
  minDistance: minDistance = 0.2,
} = {}) {
  const _0x59b8ad = normalizeVector3(_0x20ecc7, { x: 0, y: 0, z: 0 }),
    _0x83b91d = Math.max(Number(minDistance) || 0.2, safeLength(subtract(_0xd9fb43, _0x59b8ad))),
    _0x4598d5 = Math.max(0.0001, safeLength(subtract(_0x4de008, _0x59b8ad)));
  return clamp(_0x4598d5 / _0x83b91d, 0.01, 8);
}
