import {
  PANORAMA_SCENE_CAMERA_CONSTRAINTS,
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  SCENE_ORBIT_DISTANCE_MAX,
  SCENE_ORBIT_DISTANCE_MIN,
  clampPanoramaPitch,
  clampSceneFocalLength,
  clampSceneOrbitPitch,
} from '../../core/panoramaSceneMath.js';
import { t } from '../../i18n/index.js';
function panoramaSceneText(_0x53153e, _0x2485c6 = {}) {
  return t('panoramaSceneNode.' + _0x53153e, _0x2485c6);
}
const PANORAMA_SCENE_NODE_TYPE = 'panorama-scene',
  PANORAMA_SCENE_NODE_ALIASES = ['panorama_scene'],
  PANORAMA_360_NODE_TYPE = 'panorama-360',
  PANORAMA_360_NODE_ALIASES = ['panorama_360', 'panorama360'],
  PANORAMA_SCENE_CAMERA_LIMIT = 10,
  PANORAMA_SCENE_DEFAULT_SIZE = Object.freeze({ width: 0x400, height: 0x240 }),
  PANORAMA_SCENE_COLLAPSED_MAX_SIZE = 0x120,
  PANORAMA_SCENE_DEFAULT_NAME = '3D导演台',
  PANORAMA_360_DEFAULT_NAME = '360全景图';
function getPanoramaSceneDefaultName() {
  return panoramaSceneText('defaults.sceneNodeName');
}
function getPanorama360DefaultName() {
  return panoramaSceneText('defaults.panorama360NodeName');
}
const PANORAMA_SCENE_COLOR_TOKENS = Object.freeze({
    red: '--red',
    blue: '--blue',
    green: '--green',
    yellow: '--gold',
    purple: '--purple',
    cyan: '--cyan',
    black: '--black',
    white: '--white',
  }),
  DEFAULT_SCENE_VIEW = Object.freeze({
    target: Object.freeze({ x: 0, y: 1.2, z: 0 }),
    orbitYaw: Math.PI / 4,
    orbitPitch: Math.PI / 4,
    orbitDistance: 9,
  }),
  DEFAULT_PANORAMA_VIEW = Object.freeze({
    yaw: 0,
    pitch: PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.pitch.default,
    fov: PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.default,
  }),
  DEFAULT_GRID_PLACEMENT = Object.freeze({
    rows: 2,
    cols: 3,
    spacingX: 1.8,
    spacingZ: 1.8,
    gender: 'male',
    colorKey: 'blue',
  });
function toFiniteNumber(_0x5c141d, _0x504a84) {
  const _0x55e2ea = Number(_0x5c141d);
  return Number.isFinite(_0x55e2ea) ? _0x55e2ea : _0x504a84;
}
function normalizeVector3(_0x5afb92, _0x489cf7) {
  return {
    x: toFiniteNumber(_0x5afb92?.x, _0x489cf7.x),
    y: toFiniteNumber(_0x5afb92?.y, _0x489cf7.y),
    z: toFiniteNumber(_0x5afb92?.z, _0x489cf7.z),
  };
}
function normalizeEuler(_0x362318, _0x593493) {
  return {
    x: toFiniteNumber(_0x362318?.x, _0x593493.x),
    y: toFiniteNumber(_0x362318?.y, _0x593493.y),
    z: toFiniteNumber(_0x362318?.z, _0x593493.z),
  };
}
function normalizeScaleValue(_0x418be8, _0x4ed1db = 1) {
  if (Number.isFinite(_0x418be8)) return Math.max(0.01, Number(_0x418be8) || 1);
  if (
    _0x418be8 &&
    Number.isFinite(_0x418be8.x) &&
    Number.isFinite(_0x418be8.y) &&
    Number.isFinite(_0x418be8.z)
  )
    return {
      x: Math.max(0.01, Number(_0x418be8.x) || 1),
      y: Math.max(0.01, Number(_0x418be8.y) || 1),
      z: Math.max(0.01, Number(_0x418be8.z) || 1),
    };
  if (
    _0x4ed1db &&
    Number.isFinite(_0x4ed1db.x) &&
    Number.isFinite(_0x4ed1db.y) &&
    Number.isFinite(_0x4ed1db.z)
  )
    return {
      x: Math.max(0.01, Number(_0x4ed1db.x) || 1),
      y: Math.max(0.01, Number(_0x4ed1db.y) || 1),
      z: Math.max(0.01, Number(_0x4ed1db.z) || 1),
    };
  return Math.max(0.01, Number(_0x4ed1db) || 1);
}
function clamp(_0x411233, _0x43e49e, _0x49107d) {
  return Math.min(_0x49107d, Math.max(_0x43e49e, _0x411233));
}
function normalizeQuaternion(_0x5d8848, _0xf8aefa = { x: 0, y: 0, z: 0, w: 1 }) {
  const _0x7c2e46 = Number(_0x5d8848?.x),
    _0x4f791e = Number(_0x5d8848?.y),
    _0x4c7f52 = Number(_0x5d8848?.z),
    _0x4a949d = Number(_0x5d8848?.w);
  if (
    !Number.isFinite(_0x7c2e46) ||
    !Number.isFinite(_0x4f791e) ||
    !Number.isFinite(_0x4c7f52) ||
    !Number.isFinite(_0x4a949d)
  )
    return { ..._0xf8aefa };
  const _0x42145e = Math.hypot(_0x7c2e46, _0x4f791e, _0x4c7f52, _0x4a949d);
  if (_0x42145e < 0.000001) return { ..._0xf8aefa };
  return {
    x: _0x7c2e46 / _0x42145e,
    y: _0x4f791e / _0x42145e,
    z: _0x4c7f52 / _0x42145e,
    w: _0x4a949d / _0x42145e,
  };
}
function quaternionFromEulerYXZ(_0x593e78) {
  const _0xbfc9d7 = Number(_0x593e78?.x) || 0,
    _0x132dbf = Number(_0x593e78?.y) || 0,
    _0x303946 = Number(_0x593e78?.z) || 0,
    _0x1ca260 = Math.cos(_0xbfc9d7 / 2),
    _0x59a50e = Math.cos(_0x132dbf / 2),
    _0x557379 = Math.cos(_0x303946 / 2),
    _0x424a0d = Math.sin(_0xbfc9d7 / 2),
    _0x20d499 = Math.sin(_0x132dbf / 2),
    _0x8d10de = Math.sin(_0x303946 / 2);
  return normalizeQuaternion({
    x: _0x424a0d * _0x59a50e * _0x557379 + _0x1ca260 * _0x20d499 * _0x8d10de,
    y: _0x1ca260 * _0x20d499 * _0x557379 - _0x424a0d * _0x59a50e * _0x8d10de,
    z: _0x1ca260 * _0x59a50e * _0x8d10de - _0x424a0d * _0x20d499 * _0x557379,
    w: _0x1ca260 * _0x59a50e * _0x557379 + _0x424a0d * _0x20d499 * _0x8d10de,
  });
}
function eulerFromQuaternionYXZ(_0x57374c) {
  const _0x51569a = normalizeQuaternion(_0x57374c),
    _0x29537d = _0x51569a.x * _0x51569a.x,
    _0x17ef95 = _0x51569a.y * _0x51569a.y,
    _0x1feae2 = _0x51569a.z * _0x51569a.z,
    _0x550014 = _0x51569a.x * _0x51569a.y,
    _0x4e754b = _0x51569a.x * _0x51569a.z,
    _0x3e4904 = _0x51569a.y * _0x51569a.z,
    _0x5bab59 = _0x51569a.x * _0x51569a.w,
    _0x17b91e = _0x51569a.y * _0x51569a.w,
    _0x587ecb = _0x51569a.z * _0x51569a.w,
    _0x2ca036 = 1 - 2 * (_0x17ef95 + _0x1feae2),
    _0x1ea30b = 2 * (_0x4e754b + _0x17b91e),
    _0x55f08a = 2 * (_0x550014 + _0x587ecb),
    _0x4e6249 = 1 - 2 * (_0x29537d + _0x1feae2),
    _0x274fbf = 2 * (_0x3e4904 - _0x5bab59),
    _0xf11481 = 2 * (_0x4e754b - _0x17b91e),
    _0x506c95 = 1 - 2 * (_0x29537d + _0x17ef95),
    _0xce4dea = Math.asin(-clamp(_0x274fbf, -1, 1));
  if (Math.abs(_0x274fbf) < 0.9999999)
    return { x: _0xce4dea, y: Math.atan2(_0x1ea30b, _0x506c95), z: Math.atan2(_0x55f08a, _0x4e6249) };
  return { x: _0xce4dea, y: Math.atan2(-_0xf11481, _0x2ca036), z: 0 };
}
function quaternionFromEulerXYZ(_0xffa72e) {
  const _0x5c6b1a = Number(_0xffa72e?.x) || 0,
    _0x28b5e5 = Number(_0xffa72e?.y) || 0,
    _0x168a03 = Number(_0xffa72e?.z) || 0,
    _0xe92295 = Math.cos(_0x5c6b1a / 2),
    _0x4bff9d = Math.cos(_0x28b5e5 / 2),
    _0x2d1564 = Math.cos(_0x168a03 / 2),
    _0x6f612f = Math.sin(_0x5c6b1a / 2),
    _0x46d40a = Math.sin(_0x28b5e5 / 2),
    _0x52ef5a = Math.sin(_0x168a03 / 2);
  return normalizeQuaternion({
    x: _0x6f612f * _0x4bff9d * _0x2d1564 + _0xe92295 * _0x46d40a * _0x52ef5a,
    y: _0xe92295 * _0x46d40a * _0x2d1564 - _0x6f612f * _0x4bff9d * _0x52ef5a,
    z: _0xe92295 * _0x4bff9d * _0x52ef5a + _0x6f612f * _0x46d40a * _0x2d1564,
    w: _0xe92295 * _0x4bff9d * _0x2d1564 - _0x6f612f * _0x46d40a * _0x52ef5a,
  });
}
function eulerFromQuaternionXYZ(_0x1ec0a5) {
  const _0x30b6d6 = normalizeQuaternion(_0x1ec0a5),
    _0x3599c6 = _0x30b6d6.x * _0x30b6d6.x,
    _0x3f4118 = _0x30b6d6.y * _0x30b6d6.y,
    _0x478d7f = _0x30b6d6.z * _0x30b6d6.z,
    _0x22226b = _0x30b6d6.x * _0x30b6d6.y,
    _0x23e027 = _0x30b6d6.x * _0x30b6d6.z,
    _0x3076c3 = _0x30b6d6.y * _0x30b6d6.z,
    _0x240e09 = _0x30b6d6.x * _0x30b6d6.w,
    _0x53c8fd = _0x30b6d6.y * _0x30b6d6.w,
    _0x3b8cee = _0x30b6d6.z * _0x30b6d6.w,
    _0x652c3b = 1 - 2 * (_0x3f4118 + _0x478d7f),
    _0x142b39 = 2 * (_0x22226b - _0x3b8cee),
    _0x1fcc57 = 2 * (_0x23e027 + _0x53c8fd),
    _0x39bc7b = 2 * (_0x3076c3 - _0x240e09),
    _0xe64e70 = 1 - 2 * (_0x3599c6 + _0x3f4118),
    _0x4e2e5d = 2 * (_0x3076c3 + _0x240e09),
    _0x2901a6 = 1 - 2 * (_0x3599c6 + _0x478d7f),
    _0x283453 = Math.asin(clamp(_0x1fcc57, -1, 1));
  if (Math.abs(_0x1fcc57) < 0.9999999)
    return { x: Math.atan2(-_0x39bc7b, _0xe64e70), y: _0x283453, z: Math.atan2(-_0x142b39, _0x652c3b) };
  return { x: Math.atan2(_0x4e2e5d, _0x2901a6), y: _0x283453, z: 0 };
}
function normalizeMode(_0x41a328) {
  return _0x41a328 === 'panorama' ? 'panorama' : 'scene';
}
function normalizeNodeTypeValue(_0x116f0a) {
  return String(_0x116f0a || '').trim();
}
export function isPanoramaSceneNodeType(_0x6e94a3) {
  const _0x5b8bb5 = normalizeNodeTypeValue(_0x6e94a3);
  return _0x5b8bb5 === PANORAMA_SCENE_NODE_TYPE || PANORAMA_SCENE_NODE_ALIASES.includes(_0x5b8bb5);
}
export function isPanorama360NodeType(_0x5655dd) {
  const _0x20645e = normalizeNodeTypeValue(_0x5655dd);
  return _0x20645e === PANORAMA_360_NODE_TYPE || PANORAMA_360_NODE_ALIASES.includes(_0x20645e);
}
export function isPanoramaGraphNodeType(_0x4c7450) {
  return isPanoramaSceneNodeType(_0x4c7450) || isPanorama360NodeType(_0x4c7450);
}
export function getPanoramaStateFieldByNodeType(_0xa9d591) {
  if (isPanorama360NodeType(_0xa9d591)) return 'panorama360Node';
  if (isPanoramaSceneNodeType(_0xa9d591)) return 'sceneNode';
  return '';
}
function normalizeEnvironmentMode(_0x4779a6) {
  return _0x4779a6 === 'night' ? 'night' : 'day';
}
function normalizeActiveView(_0x1bf446) {
  return _0x1bf446 === 'camera' ? 'camera' : 'default';
}
function normalizeSelectionType(_0x2966ec) {
  return _0x2966ec === 'mannequin' || _0x2966ec === 'cube' ? _0x2966ec : null;
}
function normalizeGender(_0xaa0f2) {
  return _0xaa0f2 === 'female' ? 'female' : 'male';
}
function normalizeColorKey(_0x49042a) {
  return PANORAMA_SCENE_COLOR_TOKENS[_0x49042a] ? _0x49042a : 'blue';
}
function normalizeLegacyTool(_0x48829b) {
  return _0x48829b === 'move' || _0x48829b === 'rotate' || _0x48829b === 'scale' || _0x48829b === 'box-select'
    ? _0x48829b
    : 'navigate';
}
function normalizeMouseTool(_0x51336a) {
  return _0x51336a === 'box-select' ? 'box-select' : 'navigate';
}
function normalizeTransformTool(_0x30e276) {
  return _0x30e276 === 'move' || _0x30e276 === 'rotate' || _0x30e276 === 'scale' ? _0x30e276 : 'move';
}
function normalizeTransformSpace(_0x28408c) {
  return 'local';
}
function normalizePivotMode(_0x2146da) {
  return 'active';
}
function normalizeNavigationPreset(_0x5c497e) {
  return _0x5c497e === 'dcc' ? 'dcc' : 'dcc';
}
function normalizeCaptureMode(_0xc258f6) {
  const _0x291082 = String(_0xc258f6 || '').trim();
  if (_0x291082 === '9:16' || _0x291082 === '2.35:1') return _0x291082;
  return 'adaptive';
}
export function createDefaultSceneView() {
  return {
    target: { ...DEFAULT_SCENE_VIEW.target },
    orbitYaw: DEFAULT_SCENE_VIEW.orbitYaw,
    orbitPitch: DEFAULT_SCENE_VIEW.orbitPitch,
    orbitDistance: DEFAULT_SCENE_VIEW.orbitDistance,
  };
}
export function createDefaultPanoramaView() {
  return { ...DEFAULT_PANORAMA_VIEW };
}
export function createDefaultGridPlacement() {
  return { ...DEFAULT_GRID_PLACEMENT };
}
export function createDefaultPanoramaSceneState() {
  return {
    version: 1,
    mode: 'scene',
    environmentMode: 'night',
    viewport: {
      activeView: 'default',
      activeCameraId: null,
      sceneView: createDefaultSceneView(),
      panoramaView: createDefaultPanoramaView(),
    },
    panorama: {
      localPath: null,
      imageUrl: null,
      fileName: null,
      sourceSignature: null,
      isLoaded: false,
      error: null,
    },
    mannequins: [],
    cubes: [],
    cameras: [],
    selection: {
      selectedObjectType: null,
      selectedObjectId: null,
      selectedObjectIds: [],
      selectedObjects: [],
      selectedGroupId: null,
    },
    groups: [],
    gridPlacement: createDefaultGridPlacement(),
    capture: { pending: false, lastCaptureAt: null, error: null, mode: 'adaptive', showSafeFrame: false },
    ui: {
      mouseTool: 'navigate',
      transformTool: 'move',
      activeTool: 'navigate',
      transformSpace: 'local',
      pivotMode: 'active',
      navigationPreset: 'dcc',
      showCameraList: false,
      isEditing: false,
    },
  };
}
export function createDefaultPanorama360State() {
  const _0x5c0b22 = createDefaultPanoramaSceneState();
  return (
    (_0x5c0b22.mode = 'panorama'),
    (_0x5c0b22.viewport.activeView = 'default'),
    (_0x5c0b22.viewport.activeCameraId = null),
    (_0x5c0b22.cubes = []),
    (_0x5c0b22.cameras = []),
    (_0x5c0b22.ui.showCameraList = false),
    _0x5c0b22
  );
}
export function normalizePanoramaSceneState(_0x406057) {
  const _0x1f088e = createDefaultPanoramaSceneState(),
    _0x391358 = { ..._0x1f088e.viewport.sceneView, ...(_0x406057?.viewport?.sceneView || {}) };
  (delete _0x391358.fov,
    (_0x391358.target = normalizeVector3(
      _0x406057?.viewport?.sceneView?.target,
      _0x1f088e.viewport.sceneView.target,
    )),
    (_0x391358.orbitYaw = toFiniteNumber(
      _0x406057?.viewport?.sceneView?.orbitYaw,
      _0x1f088e.viewport.sceneView.orbitYaw,
    )),
    (_0x391358.orbitPitch = clampSceneOrbitPitch(
      toFiniteNumber(_0x406057?.viewport?.sceneView?.orbitPitch, _0x1f088e.viewport.sceneView.orbitPitch),
    )),
    (_0x391358.orbitDistance = clamp(
      toFiniteNumber(
        _0x406057?.viewport?.sceneView?.orbitDistance,
        _0x1f088e.viewport.sceneView.orbitDistance,
      ),
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    )));
  const _0x533633 = { ..._0x1f088e.viewport.panoramaView, ...(_0x406057?.viewport?.panoramaView || {}) };
  ((_0x533633.yaw = toFiniteNumber(
    _0x406057?.viewport?.panoramaView?.yaw,
    _0x1f088e.viewport.panoramaView.yaw,
  )),
    (_0x533633.pitch = clampPanoramaPitch(
      toFiniteNumber(_0x406057?.viewport?.panoramaView?.pitch, _0x1f088e.viewport.panoramaView.pitch),
    )),
    (_0x533633.fov = Math.max(
      PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.min,
      Math.min(
        PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.max,
        toFiniteNumber(_0x406057?.viewport?.panoramaView?.fov, _0x1f088e.viewport.panoramaView.fov),
      ),
    )));
  const _0x438a58 = Array.isArray(_0x406057?.mannequins)
      ? _0x406057.mannequins
          .filter((_0x39c1d9) => _0x39c1d9 && _0x39c1d9.id)
          .map((_0x62d4d) => {
            const _0x4877f7 = normalizeEuler(_0x62d4d.rotation, { x: 0, y: 0, z: 0 }),
              _0x4eb848 =
                Number.isFinite(Number(_0x62d4d?.quaternion?.x)) &&
                Number.isFinite(Number(_0x62d4d?.quaternion?.y)) &&
                Number.isFinite(Number(_0x62d4d?.quaternion?.z)) &&
                Number.isFinite(Number(_0x62d4d?.quaternion?.w)),
              _0x34822b = _0x4eb848
                ? normalizeQuaternion(_0x62d4d.quaternion, quaternionFromEulerXYZ(_0x4877f7))
                : quaternionFromEulerXYZ(_0x4877f7),
              _0x3a07f1 = _0x4eb848 ? eulerFromQuaternionXYZ(_0x34822b) : _0x4877f7;
            return {
              id: _0x62d4d.id,
              gender: normalizeGender(_0x62d4d.gender),
              colorKey: normalizeColorKey(_0x62d4d.colorKey || _0x62d4d.color),
              position: normalizeVector3(_0x62d4d.position, { x: 0, y: 0, z: 0 }),
              rotation: _0x3a07f1,
              quaternion: _0x34822b,
              scale: normalizeScaleValue(_0x62d4d.scale, 1),
            };
          })
      : [],
    _0x389293 = Array.isArray(_0x406057?.cubes)
      ? _0x406057.cubes
          .filter((_0x414cf7) => _0x414cf7 && _0x414cf7.id)
          .map((_0x2b6b24) => {
            const _0x2712db = normalizeEuler(_0x2b6b24.rotation, { x: 0, y: 0, z: 0 }),
              _0x32368d =
                Number.isFinite(Number(_0x2b6b24?.quaternion?.x)) &&
                Number.isFinite(Number(_0x2b6b24?.quaternion?.y)) &&
                Number.isFinite(Number(_0x2b6b24?.quaternion?.z)) &&
                Number.isFinite(Number(_0x2b6b24?.quaternion?.w)),
              _0x3f895f = _0x32368d
                ? normalizeQuaternion(_0x2b6b24.quaternion, quaternionFromEulerXYZ(_0x2712db))
                : quaternionFromEulerXYZ(_0x2712db),
              _0x4650a5 = _0x32368d ? eulerFromQuaternionXYZ(_0x3f895f) : _0x2712db;
            return {
              id: _0x2b6b24.id,
              colorKey: normalizeColorKey(_0x2b6b24.colorKey || _0x2b6b24.color),
              position: normalizeVector3(_0x2b6b24.position, { x: 0, y: 0, z: 0 }),
              rotation: _0x4650a5,
              quaternion: _0x3f895f,
              scale: normalizeScaleValue(_0x2b6b24.scale, 1),
            };
          })
      : [],
    _0x551bc6 = Array.isArray(_0x406057?.cameras)
      ? _0x406057.cameras
          .filter((_0x20778e) => _0x20778e && _0x20778e.id)
          .slice(0, PANORAMA_SCENE_CAMERA_LIMIT)
          .map((_0xbfac70, _0x5ccdb3) => {
            const _0x13ea38 = normalizeEuler(_0xbfac70.rotation, { x: 0, y: 0, z: 0 }),
              _0x48e007 =
                Number.isFinite(Number(_0xbfac70?.quaternion?.x)) &&
                Number.isFinite(Number(_0xbfac70?.quaternion?.y)) &&
                Number.isFinite(Number(_0xbfac70?.quaternion?.z)) &&
                Number.isFinite(Number(_0xbfac70?.quaternion?.w)),
              _0x56671e = _0x48e007
                ? normalizeQuaternion(_0xbfac70.quaternion, quaternionFromEulerYXZ(_0x13ea38))
                : quaternionFromEulerYXZ(_0x13ea38),
              _0x2fc7a3 = _0x48e007 ? eulerFromQuaternionYXZ(_0x56671e) : _0x13ea38;
            return {
              id: _0xbfac70.id,
              slot: Number.isInteger(Number(_0xbfac70.slot))
                ? Math.max(1, Math.min(PANORAMA_SCENE_CAMERA_LIMIT, Number(_0xbfac70.slot)))
                : null,
              name:
                String(
                  _0xbfac70.name || panoramaSceneText('camera.defaultName', { slot: _0x5ccdb3 + 1 }),
                ).trim() || panoramaSceneText('camera.defaultName', { slot: _0x5ccdb3 + 1 }),
              position: normalizeVector3(_0xbfac70.position, { x: 0, y: 1.6, z: 4 }),
              quaternion: _0x56671e,
              rotation: _0x2fc7a3,
              focalLength: clampSceneFocalLength(
                Object.prototype.hasOwnProperty.call(_0xbfac70 || {}, 'focalLength')
                  ? toFiniteNumber(_0xbfac70.focalLength, SCENE_DEFAULT_FOCAL_LENGTH_MM)
                  : SCENE_DEFAULT_FOCAL_LENGTH_MM,
              ),
            };
          })
      : [],
    _0x31f867 = new Set(_0x438a58.map((_0x1bb4e7) => _0x1bb4e7.id)),
    _0x275d36 = new Set(_0x389293.map((_0x1d3b3f) => _0x1d3b3f.id)),
    _0x4425f6 = Array.isArray(_0x406057?.groups)
      ? _0x406057.groups
          .filter((_0x44d5ca) => _0x44d5ca && _0x44d5ca.id)
          .map((_0x1f832b) => {
            const _0x374b18 = Array.isArray(_0x1f832b.memberIds)
                ? [
                    ...new Set(
                      _0x1f832b.memberIds.map((_0x3ef718) => String(_0x3ef718 || '').trim()).filter(Boolean),
                    ),
                  ]
                : [],
              _0x371b52 = _0x374b18.filter((_0x2a8de8) => _0x31f867.has(_0x2a8de8));
            return {
              id: String(_0x1f832b.id),
              type: _0x1f832b.type === 'mannequin-grid' ? 'mannequin-grid' : 'mannequin-grid',
              memberObjectType: _0x1f832b.memberObjectType === 'mannequin' ? 'mannequin' : 'mannequin',
              memberIds: _0x371b52,
            };
          })
          .filter((_0x109af3) => _0x109af3.memberIds.length > 0)
      : [],
    _0x20370b = String(_0x406057?.viewport?.activeCameraId || '').trim() || null,
    _0x2bb3f4 = _0x20370b ? _0x551bc6.some((_0x3b486e) => _0x3b486e.id === _0x20370b) : false,
    _0x5d6ff1 = normalizeSelectionType(_0x406057?.selection?.selectedObjectType),
    _0x4286b0 = _0x406057?.selection?.selectedObjectId ? String(_0x406057.selection.selectedObjectId) : null,
    _0x245dda = Array.isArray(_0x406057?.selection?.selectedObjectIds)
      ? [
          ...new Set(
            _0x406057.selection.selectedObjectIds
              .map((_0x3c75cc) => String(_0x3c75cc || '').trim())
              .filter(Boolean),
          ),
        ]
      : _0x4286b0
        ? [_0x4286b0]
        : [],
    _0xded51 = _0x406057?.selection?.selectedGroupId
      ? String(_0x406057.selection.selectedGroupId).trim()
      : null,
    _0x2a27d4 = _0xded51 ? _0x4425f6.find((_0x53f045) => _0x53f045.id === _0xded51) || null : null,
    _0x3e26b4 = new Set(_0x551bc6.map((_0x583e69) => _0x583e69.id)),
    _0x3775af = Array.isArray(_0x406057?.selection?.selectedObjects)
      ? _0x406057.selection.selectedObjects
      : [],
    _0x41885a = [],
    _0x23a789 = new Set();
  _0x3775af.forEach((_0x4cf923) => {
    const _0x169325 = normalizeSelectionType(_0x4cf923?.objectType),
      _0xc40c22 = String(_0x4cf923?.objectId || '').trim();
    if (!_0x169325 || !_0xc40c22) return;
    const _0x513b26 = _0x169325 === 'cube' ? _0x275d36.has(_0xc40c22) : _0x31f867.has(_0xc40c22);
    if (!_0x513b26) return;
    const _0xb3ecb5 = _0x169325 + ':' + _0xc40c22;
    if (_0x23a789.has(_0xb3ecb5)) return;
    (_0x23a789.add(_0xb3ecb5), _0x41885a.push({ objectType: _0x169325, objectId: _0xc40c22 }));
  });
  const _0x3a0264 = _0x5d6ff1,
    _0x51fcb2 =
      _0x3a0264 === 'camera'
        ? _0x4286b0 && _0x3e26b4.has(_0x4286b0)
          ? _0x4286b0
          : null
        : _0x3a0264 === 'cube'
          ? _0x4286b0 && _0x275d36.has(_0x4286b0)
            ? _0x4286b0
            : null
          : _0x4286b0 && _0x31f867.has(_0x4286b0)
            ? _0x4286b0
            : null;
  let _0x565a6e = _0x245dda.filter((_0x22e1a9) =>
      _0x3a0264 === 'camera'
        ? _0x3e26b4.has(_0x22e1a9)
        : _0x3a0264 === 'cube'
          ? _0x275d36.has(_0x22e1a9)
          : _0x31f867.has(_0x22e1a9),
    ),
    _0x30a28b = _0x3a0264,
    _0x1dc82e = _0x51fcb2,
    _0x4e33fc = _0x2a27d4 ? _0x2a27d4.id : null;
  if (!_0x30a28b && _0x565a6e.length > 0) {
    const _0x14f27b = _0x565a6e[0];
    _0x275d36.has(_0x14f27b)
      ? ((_0x30a28b = 'cube'), (_0x565a6e = _0x565a6e.filter((_0x1c10cf) => _0x275d36.has(_0x1c10cf))))
      : ((_0x30a28b = 'mannequin'), (_0x565a6e = _0x565a6e.filter((_0x2e6ce8) => _0x31f867.has(_0x2e6ce8))));
  }
  if (_0x2a27d4)
    ((_0x30a28b = 'mannequin'),
      (_0x565a6e = [..._0x2a27d4.memberIds]),
      (_0x1dc82e = _0x2a27d4.memberIds[0] || null));
  else {
    if (_0x565a6e.length > 0)
      ((_0x1dc82e = _0x565a6e.includes(_0x1dc82e) && _0x1dc82e ? _0x1dc82e : _0x565a6e[0]),
        _0x30a28b !== 'mannequin' && (_0x4e33fc = null));
    else _0x1dc82e ? (_0x565a6e = [_0x1dc82e]) : ((_0x1dc82e = null), (_0x30a28b = null), (_0x4e33fc = null));
  }
  let _0x376fca = _0x41885a;
  if (_0x376fca.length === 0) {
    if (_0x2a27d4)
      _0x376fca = _0x2a27d4.memberIds.map((_0xafdf31) => ({ objectType: 'mannequin', objectId: _0xafdf31 }));
    else {
      if (_0x30a28b === 'cube' || _0x30a28b === 'mannequin') {
        const _0x85136d = _0x565a6e.length > 0 ? _0x565a6e : _0x1dc82e ? [_0x1dc82e] : [];
        _0x376fca = _0x85136d.map((_0x2b1870) => ({ objectType: _0x30a28b, objectId: _0x2b1870 }));
      }
    }
  }
  let _0x33f213 = null,
    _0x1f86ae = null,
    _0x3de384 = [];
  if (_0x376fca.length > 0) {
    const _0x9d7417 = _0x30a28b === 'cube' || _0x30a28b === 'mannequin' ? _0x30a28b : null,
      _0xdeec9d = _0x9d7417 ? _0x376fca.some((_0x30f47a) => _0x30f47a.objectType === _0x9d7417) : false;
    ((_0x33f213 = _0xdeec9d ? _0x9d7417 : _0x376fca[0].objectType),
      (_0x3de384 = _0x376fca
        .filter((_0x330746) => _0x330746.objectType === _0x33f213)
        .map((_0x31933a) => _0x31933a.objectId)));
    const _0xb81345 =
      _0x1dc82e &&
      _0x376fca.some((_0x17ed3d) => _0x17ed3d.objectType === _0x33f213 && _0x17ed3d.objectId === _0x1dc82e);
    _0x1f86ae = _0xb81345 ? _0x1dc82e : _0x3de384[0] || null;
  } else _0x4e33fc = null;
  if (_0x4e33fc) {
    const _0x136673 = _0x4425f6.find((_0x41e064) => _0x41e064.id === _0x4e33fc) || null;
    if (!_0x136673) _0x4e33fc = null;
    else {
      const _0x264f2b = new Set(
          _0x376fca
            .filter((_0x5d0927) => _0x5d0927.objectType === 'mannequin')
            .map((_0x35d008) => _0x35d008.objectId),
        ),
        _0x5da8bc =
          _0x376fca.every((_0x412a7e) => _0x412a7e.objectType === 'mannequin') &&
          _0x136673.memberIds.length > 0 &&
          _0x136673.memberIds.every((_0x1c242c) => _0x264f2b.has(_0x1c242c)) &&
          _0x136673.memberIds.length === _0x376fca.length;
      !_0x5da8bc
        ? (_0x4e33fc = null)
        : ((_0x33f213 = 'mannequin'),
          (_0x3de384 = [..._0x136673.memberIds]),
          (_0x1f86ae = _0x136673.memberIds[0] || null),
          (_0x376fca = _0x136673.memberIds.map((_0x515d73) => ({
            objectType: 'mannequin',
            objectId: _0x515d73,
          }))));
    }
  }
  const _0x41a1a5 = normalizeLegacyTool(_0x406057?.ui?.activeTool),
    _0x5bba0f = normalizeMouseTool(
      _0x406057?.ui?.mouseTool != null
        ? _0x406057.ui.mouseTool
        : _0x41a1a5 === 'box-select'
          ? 'box-select'
          : 'navigate',
    ),
    _0x268269 = normalizeTransformTool(
      _0x406057?.ui?.transformTool != null
        ? _0x406057.ui.transformTool
        : _0x41a1a5 === 'move' || _0x41a1a5 === 'rotate' || _0x41a1a5 === 'scale'
          ? _0x41a1a5
          : 'move',
    );
  return {
    version: 1,
    mode: normalizeMode(_0x406057?.mode),
    environmentMode: normalizeEnvironmentMode(_0x406057?.environmentMode),
    viewport: {
      activeView:
        normalizeActiveView(_0x406057?.viewport?.activeView) === 'camera' && _0x2bb3f4 ? 'camera' : 'default',
      activeCameraId: _0x2bb3f4 ? _0x20370b : null,
      sceneView: _0x391358,
      panoramaView: _0x533633,
    },
    panorama: {
      localPath: _0x406057?.panorama?.localPath ? String(_0x406057.panorama.localPath).trim() : null,
      imageUrl: _0x406057?.panorama?.imageUrl ? String(_0x406057.panorama.imageUrl).trim() : null,
      fileName: _0x406057?.panorama?.fileName ? String(_0x406057.panorama.fileName).trim() : null,
      sourceSignature: _0x406057?.panorama?.sourceSignature
        ? String(_0x406057.panorama.sourceSignature).trim()
        : null,
      isLoaded: _0x406057?.panorama?.isLoaded === true,
      error: _0x406057?.panorama?.error ? String(_0x406057.panorama.error) : null,
    },
    mannequins: _0x438a58,
    cubes: _0x389293,
    cameras: _0x551bc6,
    selection: {
      selectedObjectType: _0x33f213,
      selectedObjectId: _0x1f86ae,
      selectedObjectIds: _0x3de384,
      selectedObjects: _0x376fca,
      selectedGroupId: _0x4e33fc,
    },
    groups: _0x4425f6,
    gridPlacement: {
      rows: Math.max(
        1,
        Math.min(
          12,
          Math.round(toFiniteNumber(_0x406057?.gridPlacement?.rows, _0x1f088e.gridPlacement.rows)),
        ),
      ),
      cols: Math.max(
        1,
        Math.min(
          12,
          Math.round(toFiniteNumber(_0x406057?.gridPlacement?.cols, _0x1f088e.gridPlacement.cols)),
        ),
      ),
      spacingX: Math.max(
        0.5,
        Math.min(8, toFiniteNumber(_0x406057?.gridPlacement?.spacingX, _0x1f088e.gridPlacement.spacingX)),
      ),
      spacingZ: Math.max(
        0.5,
        Math.min(8, toFiniteNumber(_0x406057?.gridPlacement?.spacingZ, _0x1f088e.gridPlacement.spacingZ)),
      ),
      gender: normalizeGender(_0x406057?.gridPlacement?.gender),
      colorKey: normalizeColorKey(_0x406057?.gridPlacement?.colorKey || _0x406057?.gridPlacement?.color),
    },
    capture: {
      pending: _0x406057?.capture?.pending === true,
      lastCaptureAt:
        _0x406057?.capture?.lastCaptureAt == null
          ? null
          : toFiniteNumber(_0x406057.capture.lastCaptureAt, null),
      error: _0x406057?.capture?.error ? String(_0x406057.capture.error) : null,
      mode: normalizeCaptureMode(_0x406057?.capture?.mode),
      showSafeFrame: _0x406057?.capture?.showSafeFrame === true,
    },
    ui: {
      mouseTool: _0x5bba0f,
      transformTool: _0x268269,
      activeTool: _0x41a1a5,
      transformSpace: normalizeTransformSpace(_0x406057?.ui?.transformSpace),
      pivotMode: normalizePivotMode(_0x406057?.ui?.pivotMode),
      navigationPreset: normalizeNavigationPreset(_0x406057?.ui?.navigationPreset),
      showCameraList: _0x406057?.ui?.showCameraList === true,
      isEditing: _0x406057?.ui?.isEditing === true,
    },
  };
}
export function normalizeSceneOnlyPanoramaSceneState(_0x2a32ee) {
  const _0x1f552a = normalizePanoramaSceneState(_0x2a32ee),
    _0x10daeb = String(_0x1f552a?.viewport?.activeCameraId || '').trim() || null,
    _0x2f5341 = _0x10daeb
      ? Array.isArray(_0x1f552a.cameras) && _0x1f552a.cameras.some((_0x4029a7) => _0x4029a7.id === _0x10daeb)
      : false;
  return {
    ..._0x1f552a,
    mode: 'scene',
    viewport: {
      ..._0x1f552a.viewport,
      activeView: _0x1f552a.viewport?.activeView === 'camera' && _0x2f5341 ? 'camera' : 'default',
      activeCameraId: _0x2f5341 ? _0x10daeb : null,
    },
  };
}
export function normalizePanorama360State(_0x20475f) {
  const _0x452f18 = normalizePanoramaSceneState(_0x20475f),
    _0x1cc0dc = new Set(
      (Array.isArray(_0x452f18.mannequins) ? _0x452f18.mannequins : [])
        .map((_0xa557ba) => String(_0xa557ba?.id || '').trim())
        .filter(Boolean),
    ),
    _0x2eb624 = Array.isArray(_0x452f18.groups) ? _0x452f18.groups : [];
  let _0x431005 = (
    Array.isArray(_0x452f18.selection?.selectedObjects) ? _0x452f18.selection.selectedObjects : []
  )
    .map((_0x267aaa) => ({
      objectType: String(_0x267aaa?.objectType || '').trim(),
      objectId: String(_0x267aaa?.objectId || '').trim(),
    }))
    .filter((_0xd98960) => _0xd98960.objectType === 'mannequin' && _0x1cc0dc.has(_0xd98960.objectId));
  const _0x2febf9 = String(_0x452f18.selection?.selectedGroupId || '').trim(),
    _0x4e0ee6 =
      _0x2febf9 && _0x2eb624.length > 0
        ? _0x2eb624.find((_0x1aebb1) => String(_0x1aebb1?.id || '').trim() === _0x2febf9) || null
        : null;
  let _0x1b013a = null;
  _0x4e0ee6 &&
    ((_0x1b013a = _0x4e0ee6.id),
    (_0x431005 = _0x4e0ee6.memberIds
      .map((_0x5376a9) => String(_0x5376a9 || '').trim())
      .filter((_0x2e15a3) => _0x1cc0dc.has(_0x2e15a3))
      .map((_0x14e28f) => ({ objectType: 'mannequin', objectId: _0x14e28f }))));
  if (_0x431005.length === 0) {
    const _0x5a4edf = String(_0x452f18.selection?.selectedObjectId || '').trim();
    String(_0x452f18.selection?.selectedObjectType || '').trim() === 'mannequin' &&
      _0x5a4edf &&
      _0x1cc0dc.has(_0x5a4edf) &&
      (_0x431005 = [{ objectType: 'mannequin', objectId: _0x5a4edf }]);
  }
  const _0x54c62c = new Set();
  _0x431005 = _0x431005.filter((_0x1e2885) => {
    const _0x5ed143 = _0x1e2885.objectType + ':' + _0x1e2885.objectId;
    if (_0x54c62c.has(_0x5ed143)) return false;
    return (_0x54c62c.add(_0x5ed143), true);
  });
  const _0x1f1960 = _0x431005.map((_0x3674a5) => _0x3674a5.objectId),
    _0x5e5ae8 = String(_0x452f18.selection?.selectedObjectId || '').trim(),
    _0x143c19 = _0x5e5ae8 && _0x1f1960.includes(_0x5e5ae8) ? _0x5e5ae8 : _0x1f1960[0] || null;
  return {
    ..._0x452f18,
    mode: 'panorama',
    cubes: [],
    cameras: [],
    viewport: { ..._0x452f18.viewport, activeView: 'default', activeCameraId: null },
    selection: {
      selectedObjectType: _0x143c19 ? 'mannequin' : null,
      selectedObjectId: _0x143c19,
      selectedObjectIds: _0x1f1960,
      selectedObjects: _0x431005,
      selectedGroupId: _0x1b013a && _0x431005.length > 0 ? _0x1b013a : null,
    },
    ui: { ..._0x452f18.ui, showCameraList: false },
  };
}
export function createPanoramaSceneNodeData({
  id: _0x5af505,
  x: x = 0,
  y: y = 0,
  width: width = PANORAMA_SCENE_DEFAULT_SIZE.width,
  height: height = PANORAMA_SCENE_DEFAULT_SIZE.height,
  name: name = getPanoramaSceneDefaultName(),
} = {}) {
  return {
    id: _0x5af505,
    type: PANORAMA_SCENE_NODE_TYPE,
    x: x,
    y: y,
    width: width,
    height: height,
    name: name,
    sceneNode: createDefaultPanoramaSceneState(),
  };
}
export function createPanorama360NodeData({
  id: _0x533dd4,
  x: x = 0,
  y: y = 0,
  width: width = PANORAMA_SCENE_DEFAULT_SIZE.width,
  height: height = PANORAMA_SCENE_DEFAULT_SIZE.height,
  name: name = getPanorama360DefaultName(),
} = {}) {
  return {
    id: _0x533dd4,
    type: PANORAMA_360_NODE_TYPE,
    x: x,
    y: y,
    width: width,
    height: height,
    name: name,
    panorama360Node: createDefaultPanorama360State(),
  };
}
export {
  PANORAMA_SCENE_NODE_TYPE,
  PANORAMA_SCENE_NODE_ALIASES,
  PANORAMA_360_NODE_TYPE,
  PANORAMA_360_NODE_ALIASES,
  PANORAMA_SCENE_CAMERA_LIMIT,
  PANORAMA_SCENE_DEFAULT_SIZE,
  PANORAMA_SCENE_COLLAPSED_MAX_SIZE,
  PANORAMA_SCENE_DEFAULT_NAME,
  PANORAMA_360_DEFAULT_NAME,
  getPanoramaSceneDefaultName,
  getPanorama360DefaultName,
  PANORAMA_SCENE_COLOR_TOKENS,
};
