import appStore from '../../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../../core/math.js';
import {
  clampPanoramaPitch,
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  cameraPoseToPanoramaView,
  cameraPoseToSceneViewFromReference,
  clampSceneFocalLength,
  computeGridPlacement,
  resolveBatchPlacementOrigin,
  resolveObjectPlacementPoint,
} from '../../core/panoramaSceneMath.js';
import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { resolveOutputMediaSize } from '../../services/mediaRatioService.js';
import { ensurePersistedPanoramaInputPng } from '../../services/panoramaInputImageService.js';
import { uploadFile, saveOutputBlob } from '../../services/projectService.js';
import { showError, showSuccess, showWarning } from '../../services/toastService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
import { commit } from '../history.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import {
  PANORAMA_SCENE_CAMERA_LIMIT,
  PANORAMA_SCENE_COLLAPSED_MAX_SIZE,
  PANORAMA_SCENE_DEFAULT_SIZE,
  createDefaultPanoramaView,
  createDefaultSceneView,
  getPanoramaStateFieldByNodeType,
  isPanorama360NodeType,
  normalizePanorama360State,
  normalizePanoramaSceneState,
  normalizeSceneOnlyPanoramaSceneState,
} from './sceneNode.js';
function panoramaSceneText(_0x2a5123, _0x1c2d45 = {}) {
  return t('panoramaSceneNode.' + _0x2a5123, _0x1c2d45);
}
function getStoreNode(_0xf1f3ea, _0x328992) {
  return _0xf1f3ea?.getStateRaw?.().nodes?.[_0x328992] || null;
}
function normalizeSceneStateByNode(_0x23f27b, _0x472ba3) {
  if (isPanorama360NodeType(_0x23f27b?.type)) return normalizePanorama360State(_0x472ba3);
  return normalizeSceneOnlyPanoramaSceneState(_0x472ba3);
}
const EQUIRECTANGULAR_RATIO = 2,
  EQUIRECTANGULAR_RATIO_TOLERANCE = 0.02,
  MANNEQUIN_FORWARD_PLACEMENT_DISTANCE = 3.2,
  CUBE_FORWARD_PLACEMENT_DISTANCE = 3,
  _panorama360SyncVersionByNodeId = new Map(),
  _panorama360SyncInflightByNodeId = new Map();
function isNearEquirectangularRatio(_0x1a1002) {
  const _0x245cd4 = Number(_0x1a1002?.width),
    _0x82bd3d = Number(_0x1a1002?.height);
  if (!Number.isFinite(_0x245cd4) || !Number.isFinite(_0x82bd3d) || _0x245cd4 <= 0 || _0x82bd3d <= 0)
    return true;
  const _0x50a9ef = _0x245cd4 / _0x82bd3d;
  return Math.abs(_0x50a9ef - EQUIRECTANGULAR_RATIO) <= EQUIRECTANGULAR_RATIO_TOLERANCE;
}
function getSceneState(_0x4d62d4, _0x177e41) {
  const _0x1cc954 = getStoreNode(_0x4d62d4, _0x177e41);
  if (!_0x1cc954) return normalizeSceneOnlyPanoramaSceneState(null);
  const _0x44b3da = getPanoramaStateFieldByNodeType(_0x1cc954.type);
  return normalizeSceneStateByNode(_0x1cc954, _0x44b3da ? _0x1cc954[_0x44b3da] : null);
}
function writeSceneState(_0x433ba1, _0x45c57c, _0x6cd3b) {
  const _0x488a47 = getStoreNode(_0x433ba1, _0x45c57c);
  if (!_0x488a47) return null;
  const _0x2689f5 = getPanoramaStateFieldByNodeType(_0x488a47.type);
  if (!_0x2689f5) return null;
  const _0x21a49b = normalizeSceneStateByNode(_0x488a47, _0x488a47[_0x2689f5]),
    _0x620ead = typeof _0x6cd3b === 'function' ? _0x6cd3b(_0x21a49b, _0x488a47) : _0x6cd3b;
  if (!_0x620ead) return _0x21a49b;
  const _0xed02be = normalizeSceneStateByNode(_0x488a47, _0x620ead);
  return (_0x433ba1.updateNodeData(_0x45c57c, { [_0x2689f5]: _0xed02be }), _0xed02be);
}
function cloneSceneState(_0x48c3ff) {
  return normalizePanoramaSceneState(_0x48c3ff);
}
function pickViewYaw(_0x2398b6) {
  if (Number.isFinite(_0x2398b6?.yaw)) return _0x2398b6.yaw;
  if (Number.isFinite(_0x2398b6?.rotation?.y)) return _0x2398b6.rotation.y;
  return 0;
}
function pickFacingCameraYaw(_0x182542) {
  const _0xf45b2e = pickViewYaw(_0x182542) + Math.PI;
  return Math.atan2(Math.sin(_0xf45b2e), Math.cos(_0xf45b2e));
}
function sanitizeObjectPose(_0x5c7096 = {}) {
  const _0x38bf8c = {
      x: Number.isFinite(_0x5c7096?.rotation?.x) ? _0x5c7096.rotation.x : 0,
      y: Number.isFinite(_0x5c7096?.rotation?.y) ? _0x5c7096.rotation.y : 0,
      z: Number.isFinite(_0x5c7096?.rotation?.z) ? _0x5c7096.rotation.z : 0,
    },
    _0x2f56cb =
      Number.isFinite(Number(_0x5c7096?.quaternion?.x)) &&
      Number.isFinite(Number(_0x5c7096?.quaternion?.y)) &&
      Number.isFinite(Number(_0x5c7096?.quaternion?.z)) &&
      Number.isFinite(Number(_0x5c7096?.quaternion?.w)),
    _0x5b4ff3 = _0x2f56cb
      ? normalizeQuaternion(_0x5c7096.quaternion, quaternionFromEulerXYZ(_0x38bf8c))
      : null,
    _0x49f961 = _0x2f56cb ? eulerFromQuaternionXYZ(_0x5b4ff3) : _0x38bf8c,
    _0x1b6928 = Number.isFinite(_0x5c7096?.scale)
      ? Math.max(0.01, Number(_0x5c7096.scale) || 1)
      : _0x5c7096?.scale &&
          Number.isFinite(_0x5c7096.scale.x) &&
          Number.isFinite(_0x5c7096.scale.y) &&
          Number.isFinite(_0x5c7096.scale.z)
        ? {
            x: Math.max(0.01, Number(_0x5c7096.scale.x) || 1),
            y: Math.max(0.01, Number(_0x5c7096.scale.y) || 1),
            z: Math.max(0.01, Number(_0x5c7096.scale.z) || 1),
          }
        : null;
  return {
    position: {
      x: Number.isFinite(_0x5c7096?.position?.x) ? _0x5c7096.position.x : 0,
      y: Number.isFinite(_0x5c7096?.position?.y) ? _0x5c7096.position.y : 0,
      z: Number.isFinite(_0x5c7096?.position?.z) ? _0x5c7096.position.z : 0,
    },
    rotation: _0x49f961,
    quaternion: _0x5b4ff3,
    fov: Number.isFinite(_0x5c7096?.fov) ? _0x5c7096.fov : 58,
    scale: _0x1b6928,
  };
}
function normalizeQuaternion(_0x4fb819, _0x421df4 = { x: 0, y: 0, z: 0, w: 1 }) {
  const _0x496882 = Number(_0x4fb819?.x),
    _0x7880f7 = Number(_0x4fb819?.y),
    _0x35fd0e = Number(_0x4fb819?.z),
    _0x19bb05 = Number(_0x4fb819?.w);
  if (
    !Number.isFinite(_0x496882) ||
    !Number.isFinite(_0x7880f7) ||
    !Number.isFinite(_0x35fd0e) ||
    !Number.isFinite(_0x19bb05)
  )
    return { ..._0x421df4 };
  const _0x545ab0 = Math.hypot(_0x496882, _0x7880f7, _0x35fd0e, _0x19bb05);
  if (_0x545ab0 < 0.000001) return { ..._0x421df4 };
  return {
    x: _0x496882 / _0x545ab0,
    y: _0x7880f7 / _0x545ab0,
    z: _0x35fd0e / _0x545ab0,
    w: _0x19bb05 / _0x545ab0,
  };
}
function quaternionFromEulerYXZ(_0x19cdb0) {
  const _0xab6948 = Number(_0x19cdb0?.x) || 0,
    _0x5db88c = Number(_0x19cdb0?.y) || 0,
    _0x576797 = Number(_0x19cdb0?.z) || 0,
    _0x59ab65 = Math.cos(_0xab6948 / 2),
    _0x3213eb = Math.cos(_0x5db88c / 2),
    _0x4aaa01 = Math.cos(_0x576797 / 2),
    _0x3c8f13 = Math.sin(_0xab6948 / 2),
    _0x5c6f78 = Math.sin(_0x5db88c / 2),
    _0x5442e4 = Math.sin(_0x576797 / 2);
  return normalizeQuaternion({
    x: _0x3c8f13 * _0x3213eb * _0x4aaa01 + _0x59ab65 * _0x5c6f78 * _0x5442e4,
    y: _0x59ab65 * _0x5c6f78 * _0x4aaa01 - _0x3c8f13 * _0x3213eb * _0x5442e4,
    z: _0x59ab65 * _0x3213eb * _0x5442e4 - _0x3c8f13 * _0x5c6f78 * _0x4aaa01,
    w: _0x59ab65 * _0x3213eb * _0x4aaa01 + _0x3c8f13 * _0x5c6f78 * _0x5442e4,
  });
}
function eulerFromQuaternionYXZ(_0xbf5ee5) {
  const _0x5667a9 = normalizeQuaternion(_0xbf5ee5),
    _0x139da8 = _0x5667a9.x * _0x5667a9.x,
    _0x3fb163 = _0x5667a9.y * _0x5667a9.y,
    _0x1e5093 = _0x5667a9.z * _0x5667a9.z,
    _0x30c8eb = _0x5667a9.x * _0x5667a9.y,
    _0x44a005 = _0x5667a9.x * _0x5667a9.z,
    _0x284bf1 = _0x5667a9.y * _0x5667a9.z,
    _0x3e15e9 = _0x5667a9.x * _0x5667a9.w,
    _0xf8d679 = _0x5667a9.y * _0x5667a9.w,
    _0x395ed7 = _0x5667a9.z * _0x5667a9.w,
    _0x1ad077 = 1 - 2 * (_0x3fb163 + _0x1e5093),
    _0x3f8bc2 = 2 * (_0x44a005 + _0xf8d679),
    _0x118ae2 = 2 * (_0x30c8eb + _0x395ed7),
    _0x107bc3 = 1 - 2 * (_0x139da8 + _0x1e5093),
    _0x1199fc = 2 * (_0x284bf1 - _0x3e15e9),
    _0x1c777f = 2 * (_0x44a005 - _0xf8d679),
    _0x2aaa1e = 1 - 2 * (_0x139da8 + _0x3fb163),
    _0x12ed82 = Math.asin(-clamp(_0x1199fc, -1, 1));
  if (Math.abs(_0x1199fc) < 0.9999999)
    return { x: _0x12ed82, y: Math.atan2(_0x3f8bc2, _0x2aaa1e), z: Math.atan2(_0x118ae2, _0x107bc3) };
  return { x: _0x12ed82, y: Math.atan2(-_0x1c777f, _0x1ad077), z: 0 };
}
function quaternionFromEulerXYZ(_0x1ef8b2) {
  const _0x5c581e = Number(_0x1ef8b2?.x) || 0,
    _0x50e69b = Number(_0x1ef8b2?.y) || 0,
    _0x55cbc6 = Number(_0x1ef8b2?.z) || 0,
    _0x37ea85 = Math.cos(_0x5c581e / 2),
    _0x4007b4 = Math.cos(_0x50e69b / 2),
    _0x32ea62 = Math.cos(_0x55cbc6 / 2),
    _0x31d3c3 = Math.sin(_0x5c581e / 2),
    _0x61811d = Math.sin(_0x50e69b / 2),
    _0x5be761 = Math.sin(_0x55cbc6 / 2);
  return normalizeQuaternion({
    x: _0x31d3c3 * _0x4007b4 * _0x32ea62 + _0x37ea85 * _0x61811d * _0x5be761,
    y: _0x37ea85 * _0x61811d * _0x32ea62 - _0x31d3c3 * _0x4007b4 * _0x5be761,
    z: _0x37ea85 * _0x4007b4 * _0x5be761 + _0x31d3c3 * _0x61811d * _0x32ea62,
    w: _0x37ea85 * _0x4007b4 * _0x32ea62 - _0x31d3c3 * _0x61811d * _0x5be761,
  });
}
function eulerFromQuaternionXYZ(_0x1fe641) {
  const _0x5c233d = normalizeQuaternion(_0x1fe641),
    _0x41e034 = _0x5c233d.x * _0x5c233d.x,
    _0x4fb11c = _0x5c233d.y * _0x5c233d.y,
    _0x2cc5df = _0x5c233d.z * _0x5c233d.z,
    _0x301e5e = _0x5c233d.x * _0x5c233d.y,
    _0x1621a = _0x5c233d.x * _0x5c233d.z,
    _0x2b8e30 = _0x5c233d.y * _0x5c233d.z,
    _0x46c08c = _0x5c233d.x * _0x5c233d.w,
    _0x563312 = _0x5c233d.y * _0x5c233d.w,
    _0x3f6681 = _0x5c233d.z * _0x5c233d.w,
    _0x327fa0 = 1 - 2 * (_0x4fb11c + _0x2cc5df),
    _0x1276f2 = 2 * (_0x301e5e - _0x3f6681),
    _0x2de6a0 = 2 * (_0x1621a + _0x563312),
    _0x41da66 = 2 * (_0x2b8e30 - _0x46c08c),
    _0x100283 = 1 - 2 * (_0x41e034 + _0x4fb11c),
    _0x3b09db = 2 * (_0x2b8e30 + _0x46c08c),
    _0x2e4050 = 1 - 2 * (_0x41e034 + _0x2cc5df),
    _0x299602 = Math.asin(clamp(_0x2de6a0, -1, 1));
  if (Math.abs(_0x2de6a0) < 0.9999999)
    return { x: Math.atan2(-_0x41da66, _0x100283), y: _0x299602, z: Math.atan2(-_0x1276f2, _0x327fa0) };
  return { x: Math.atan2(_0x3b09db, _0x2e4050), y: _0x299602, z: 0 };
}
function sanitizeCameraPose(_0x587304 = {}) {
  const _0x1a0521 = {
      x: Number.isFinite(_0x587304?.position?.x) ? _0x587304.position.x : 0,
      y: Number.isFinite(_0x587304?.position?.y) ? _0x587304.position.y : 0,
      z: Number.isFinite(_0x587304?.position?.z) ? _0x587304.position.z : 0,
    },
    _0x339228 = {
      x: Number.isFinite(_0x587304?.rotation?.x) ? _0x587304.rotation.x : 0,
      y: Number.isFinite(_0x587304?.rotation?.y) ? _0x587304.rotation.y : 0,
      z: Number.isFinite(_0x587304?.rotation?.z) ? _0x587304.rotation.z : 0,
    },
    _0x301762 =
      Number.isFinite(Number(_0x587304?.quaternion?.x)) &&
      Number.isFinite(Number(_0x587304?.quaternion?.y)) &&
      Number.isFinite(Number(_0x587304?.quaternion?.z)) &&
      Number.isFinite(Number(_0x587304?.quaternion?.w)),
    _0x3f089a = _0x301762
      ? normalizeQuaternion(_0x587304.quaternion, quaternionFromEulerYXZ(_0x339228))
      : quaternionFromEulerYXZ(_0x339228),
    _0x3b7326 = _0x301762 ? eulerFromQuaternionYXZ(_0x3f089a) : _0x339228;
  return {
    position: _0x1a0521,
    rotation: _0x3b7326,
    quaternion: _0x3f089a,
    focalLength: Object.prototype.hasOwnProperty.call(_0x587304 || {}, 'focalLength')
      ? clampSceneFocalLength(_0x587304.focalLength)
      : Object.prototype.hasOwnProperty.call(_0x587304 || {}, 'fov')
        ? SCENE_DEFAULT_FOCAL_LENGTH_MM
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
  };
}
function normalizeCameraSlot(_0xcef21f) {
  const _0x52c981 = Number(_0xcef21f);
  if (!Number.isInteger(_0x52c981)) return null;
  if (_0x52c981 < 1 || _0x52c981 > PANORAMA_SCENE_CAMERA_LIMIT) return null;
  return _0x52c981;
}
function toCameraSlotLabel(_0x4b4199) {
  return String(Number(_0x4b4199) || 1);
}
function resolveCameraSlotEntries(_0x245309 = []) {
  const _0x26b2bc = Array.isArray(_0x245309) ? _0x245309 : [],
    _0xb09014 = new Set(),
    _0x322c62 = [];
  _0x26b2bc.forEach((_0xb9024b) => {
    const _0x3a9f77 = normalizeCameraSlot(_0xb9024b?.slot);
    if (!_0x3a9f77 || _0xb09014.has(_0x3a9f77)) return;
    (_0xb09014.add(_0x3a9f77), _0x322c62.push({ camera: _0xb9024b, slot: _0x3a9f77 }));
  });
  const _0x3f0f7b = () => {
    for (let _0x519a48 = 1; _0x519a48 <= PANORAMA_SCENE_CAMERA_LIMIT; _0x519a48 += 1) {
      if (!_0xb09014.has(_0x519a48)) return (_0xb09014.add(_0x519a48), _0x519a48);
    }
    return null;
  };
  return (
    _0x26b2bc.forEach((_0x39bf97) => {
      if (_0x322c62.some((_0x33d61c) => _0x33d61c.camera?.id === _0x39bf97?.id)) return;
      const _0x17a37d = _0x3f0f7b();
      if (!_0x17a37d) return;
      _0x322c62.push({ camera: _0x39bf97, slot: _0x17a37d });
    }),
    _0x322c62.sort((_0x1cbffb, _0x268354) => _0x1cbffb.slot - _0x268354.slot)
  );
}
function resolveFirstFreeCameraSlot(_0x40f5e2 = []) {
  const _0x52655f = new Set(resolveCameraSlotEntries(_0x40f5e2).map((_0xc1c3e6) => _0xc1c3e6.slot));
  for (let _0x482811 = 1; _0x482811 <= PANORAMA_SCENE_CAMERA_LIMIT; _0x482811 += 1) {
    if (!_0x52655f.has(_0x482811)) return _0x482811;
  }
  return null;
}
function resolveCameraBySlot(_0x47b3ad = [], _0x49f65e) {
  const _0xcd7052 = normalizeCameraSlot(_0x49f65e);
  if (!_0xcd7052) return null;
  const _0xcb3441 = resolveCameraSlotEntries(_0x47b3ad).find((_0x7d6d36) => _0x7d6d36.slot === _0xcd7052);
  return _0xcb3441 ? { camera: _0xcb3441.camera, slot: _0xcb3441.slot } : null;
}
function normalizeScaleVector(_0x24eddb, _0x2625c5 = 1) {
  if (Number.isFinite(_0x24eddb)) {
    const _0x586011 = Math.max(0.01, Number(_0x24eddb) || Number(_0x2625c5) || 1);
    return { x: _0x586011, y: _0x586011, z: _0x586011 };
  }
  if (
    _0x24eddb &&
    Number.isFinite(_0x24eddb.x) &&
    Number.isFinite(_0x24eddb.y) &&
    Number.isFinite(_0x24eddb.z)
  )
    return {
      x: Math.max(0.01, Number(_0x24eddb.x) || 1),
      y: Math.max(0.01, Number(_0x24eddb.y) || 1),
      z: Math.max(0.01, Number(_0x24eddb.z) || 1),
    };
  const _0x250992 = Math.max(0.01, Number(_0x2625c5) || 1);
  return { x: _0x250992, y: _0x250992, z: _0x250992 };
}
function composeCompatibleScale(_0x196203, _0x184387 = 1) {
  if (_0x196203 == null) return _0x184387;
  if (Number.isFinite(_0x196203)) return Math.max(0.01, Math.min(8, Number(_0x196203) || 1));
  const _0x2aa6a7 = normalizeScaleVector(_0x196203, _0x184387),
    _0x27f2c5 = 0.0001;
  if (Math.abs(_0x2aa6a7.x - _0x2aa6a7.y) < _0x27f2c5 && Math.abs(_0x2aa6a7.y - _0x2aa6a7.z) < _0x27f2c5)
    return Math.max(0.01, Math.min(8, (_0x2aa6a7.x + _0x2aa6a7.y + _0x2aa6a7.z) / 3));
  return {
    x: Math.max(0.01, Math.min(8, _0x2aa6a7.x)),
    y: Math.max(0.01, Math.min(8, _0x2aa6a7.y)),
    z: Math.max(0.01, Math.min(8, _0x2aa6a7.z)),
  };
}
function clamp(_0x2a78d9, _0x79f25b, _0x469652) {
  return Math.min(_0x469652, Math.max(_0x79f25b, _0x2a78d9));
}
function computeCollapsedDimensions(_0x334ee9, _0x49199a) {
  const _0x23e625 = Math.max(180, Number(_0x334ee9) || PANORAMA_SCENE_DEFAULT_SIZE.width),
    _0x455f29 = Math.max(140, Number(_0x49199a) || PANORAMA_SCENE_DEFAULT_SIZE.height),
    _0x6f8a9b = Math.min(_0x23e625, _0x455f29),
    _0x2c4f37 =
      _0x6f8a9b > PANORAMA_SCENE_COLLAPSED_MAX_SIZE ? PANORAMA_SCENE_COLLAPSED_MAX_SIZE / _0x6f8a9b : 1;
  return { width: Math.round(_0x23e625 * _0x2c4f37), height: Math.round(_0x455f29 * _0x2c4f37) };
}
function getSelectedObject(_0x13559e) {
  const { selectedObjectType: _0x625e8e, selectedObjectId: _0x529645 } = _0x13559e?.selection || {};
  if (!_0x625e8e || !_0x529645) return null;
  const _0x282253 = getSceneObjectList(_0x13559e, _0x625e8e),
    _0x3133e2 = _0x282253.find((_0x35db85) => _0x35db85.id === _0x529645) || null;
  if (!_0x3133e2) return null;
  return { objectType: _0x625e8e, item: _0x3133e2 };
}
function getSceneObjectList(_0x35a61c, _0x252c50) {
  if (_0x252c50 === 'camera') return Array.isArray(_0x35a61c?.cameras) ? _0x35a61c.cameras : [];
  if (_0x252c50 === 'cube') return Array.isArray(_0x35a61c?.cubes) ? _0x35a61c.cubes : [];
  return Array.isArray(_0x35a61c?.mannequins) ? _0x35a61c.mannequins : [];
}
function getSceneObjectHeightOffset(_0x5dc86f) {
  if (_0x5dc86f === 'cube') return 0;
  if (_0x5dc86f === 'mannequin') return 1.1;
  return 0;
}
function getSelectionPoolByType(_0x2636ff, _0x35989a) {
  if (_0x35989a === 'cube') return Array.isArray(_0x2636ff?.cubes) ? _0x2636ff.cubes : [];
  if (_0x35989a === 'mannequin') return Array.isArray(_0x2636ff?.mannequins) ? _0x2636ff.mannequins : [];
  return [];
}
function normalizeSelectionObjectsInput(_0x3f91bd, _0x1c086f = []) {
  const _0x1c125e = new Set(),
    _0x5cc425 = [],
    _0x316c53 = Array.isArray(_0x1c086f) ? _0x1c086f : [];
  return (
    _0x316c53.forEach((_0xd11f8c) => {
      const _0x531fca =
          _0xd11f8c?.objectType === 'cube' || _0xd11f8c?.objectType === 'mannequin'
            ? _0xd11f8c.objectType
            : null,
        _0x2ccfea = String(_0xd11f8c?.objectId || '').trim();
      if (!_0x531fca || !_0x2ccfea) return;
      const _0x4eba0 = getSelectionPoolByType(_0x3f91bd, _0x531fca).some(
        (_0x5e3054) => _0x5e3054.id === _0x2ccfea,
      );
      if (!_0x4eba0) return;
      const _0x213c2e = _0x531fca + ':' + _0x2ccfea;
      if (_0x1c125e.has(_0x213c2e)) return;
      (_0x1c125e.add(_0x213c2e), _0x5cc425.push({ objectType: _0x531fca, objectId: _0x2ccfea }));
    }),
    _0x5cc425
  );
}
function collectSelectionObjects(_0xd9a055) {
  const _0x2fbed8 = normalizeSelectionObjectsInput(_0xd9a055, _0xd9a055?.selection?.selectedObjects || []);
  if (_0x2fbed8.length > 0) return _0x2fbed8;
  const _0x48ae54 =
    _0xd9a055?.selection?.selectedObjectType === 'cube' ||
    _0xd9a055?.selection?.selectedObjectType === 'mannequin'
      ? _0xd9a055.selection.selectedObjectType
      : null;
  if (!_0x48ae54) return [];
  const _0x5b332c = Array.isArray(_0xd9a055?.selection?.selectedObjectIds)
    ? _0xd9a055.selection.selectedObjectIds
    : _0xd9a055?.selection?.selectedObjectId
      ? [_0xd9a055.selection.selectedObjectId]
      : [];
  return normalizeSelectionObjectsInput(
    _0xd9a055,
    _0x5b332c.map((_0x205b06) => ({ objectType: _0x48ae54, objectId: _0x205b06 })),
  );
}
function clearSelection(_0x4c3090) {
  ((_0x4c3090.selection.selectedObjectType = null),
    (_0x4c3090.selection.selectedObjectId = null),
    (_0x4c3090.selection.selectedObjectIds = []),
    (_0x4c3090.selection.selectedObjects = []),
    (_0x4c3090.selection.selectedGroupId = null));
}
function setSelectionFromObjects(
  _0x41ea37,
  _0x314e51,
  {
    preferredGroupId: preferredGroupId = null,
    preferredActiveType: preferredActiveType = null,
    preferredActiveId: preferredActiveId = null,
  } = {},
) {
  const _0x494d2a = normalizeSelectionObjectsInput(_0x41ea37, _0x314e51);
  if (_0x494d2a.length === 0) {
    clearSelection(_0x41ea37);
    return;
  }
  const _0x494969 = preferredGroupId ? String(preferredGroupId) : null;
  if (_0x494969) {
    const _0x68658f = (_0x41ea37.groups || []).find((_0x48b831) => _0x48b831.id === _0x494969);
    if (_0x68658f) {
      const _0x584028 = _0x494d2a
          .filter((_0x17f1fb) => _0x17f1fb.objectType === 'mannequin')
          .map((_0x3e53f4) => _0x3e53f4.objectId),
        _0x4a282e = new Set(_0x584028),
        _0x1d1d36 =
          _0x494d2a.every((_0x1d7504) => _0x1d7504.objectType === 'mannequin') &&
          _0x68658f.memberIds.length > 0 &&
          _0x68658f.memberIds.length === _0x584028.length &&
          _0x68658f.memberIds.every((_0x3e1558) => _0x4a282e.has(_0x3e1558));
      if (_0x1d1d36) {
        ((_0x41ea37.selection.selectedObjectType = 'mannequin'),
          (_0x41ea37.selection.selectedObjectId = _0x68658f.memberIds[0] || null),
          (_0x41ea37.selection.selectedObjectIds = [..._0x68658f.memberIds]),
          (_0x41ea37.selection.selectedObjects = _0x68658f.memberIds.map((_0x1e9539) => ({
            objectType: 'mannequin',
            objectId: _0x1e9539,
          }))),
          (_0x41ea37.selection.selectedGroupId = _0x494969));
        return;
      }
    }
  }
  const _0x42fff1 =
      preferredActiveType === 'cube' || preferredActiveType === 'mannequin' ? preferredActiveType : null,
    _0x11f0ec =
      _0x42fff1 && _0x494d2a.some((_0x500972) => _0x500972.objectType === _0x42fff1)
        ? _0x42fff1
        : _0x494d2a[0].objectType,
    _0xd6c2ad = _0x494d2a
      .filter((_0x5c498f) => _0x5c498f.objectType === _0x11f0ec)
      .map((_0xd1c3c2) => _0xd1c3c2.objectId),
    _0x925a53 =
      preferredActiveId &&
      _0x494d2a.some(
        (_0x4417e9) => _0x4417e9.objectType === _0x11f0ec && _0x4417e9.objectId === preferredActiveId,
      )
        ? preferredActiveId
        : _0xd6c2ad[0] || null;
  ((_0x41ea37.selection.selectedObjectType = _0x11f0ec),
    (_0x41ea37.selection.selectedObjectId = _0x925a53),
    (_0x41ea37.selection.selectedObjectIds = _0xd6c2ad),
    (_0x41ea37.selection.selectedObjects = _0x494d2a),
    (_0x41ea37.selection.selectedGroupId = null));
}
function setSingleSelection(_0x5e0a0f, _0x3940f7, _0x553e4a) {
  setSelectionFromObjects(
    _0x5e0a0f,
    _0x3940f7 && _0x553e4a ? [{ objectType: _0x3940f7, objectId: _0x553e4a }] : [],
    { preferredActiveType: _0x3940f7, preferredActiveId: _0x553e4a || null },
  );
}
function finalizeSelectedObjectRemoval(_0x38c335, _0x429ffc, _0x378439) {
  const _0x32e1e4 = cloneSceneState(_0x38c335),
    _0x30a549 = collectSelectionObjects(_0x32e1e4).filter(
      (_0x1e5f63) => !(_0x1e5f63.objectType === _0x429ffc && _0x1e5f63.objectId === _0x378439),
    );
  return (
    setSelectionFromObjects(_0x32e1e4, _0x30a549, {
      preferredActiveType: _0x32e1e4?.selection?.selectedObjectType || null,
      preferredActiveId: _0x32e1e4?.selection?.selectedObjectId || null,
      preferredGroupId: _0x32e1e4?.selection?.selectedGroupId || null,
    }),
    _0x429ffc === 'camera' &&
      _0x32e1e4.viewport.activeCameraId === _0x378439 &&
      ((_0x32e1e4.viewport.activeCameraId = null), (_0x32e1e4.viewport.activeView = 'default')),
    _0x32e1e4
  );
}
function pruneGroups(_0xa4cfd1, _0x35ca1d = []) {
  if (!Array.isArray(_0xa4cfd1)) return [];
  if (!Array.isArray(_0x35ca1d) || _0x35ca1d.length === 0) return _0xa4cfd1;
  const _0x4a2580 = new Set(_0x35ca1d);
  return _0xa4cfd1
    .map((_0x50ed4a) => ({
      ..._0x50ed4a,
      memberIds: Array.isArray(_0x50ed4a.memberIds)
        ? _0x50ed4a.memberIds.filter((_0x407eae) => !_0x4a2580.has(_0x407eae))
        : [],
    }))
    .filter((_0x282068) => _0x282068.memberIds.length > 0);
}
function resolveGroupByMember(_0x651480, _0x3c0190, _0x578f6a) {
  if (_0x3c0190 !== 'mannequin' || !_0x578f6a) return null;
  const _0x3e0944 = Array.isArray(_0x651480?.groups) ? _0x651480.groups : [];
  return _0x3e0944.find((_0x299da3) => _0x299da3.memberIds?.includes(_0x578f6a)) || null;
}
function createNodeActionContext(_0x2b6ac0 = {}) {
  return {
    storeInstance: _0x2b6ac0.storeInstance || appStore,
    getCurrentProjectId:
      _0x2b6ac0.getCurrentProjectId || (() => window.currentProjectId || 'default_v2_project'),
  };
}
const DEFAULT_NODE_SPAWN_SPACING = 120,
  PANORAMA_360_IMAGE_SOURCE_TYPES = new Set(['source-image', 'ai-image', 'image']);
function resolveNodeSpawnSpacing() {
  const _0x1b112f = Number(globalThis?.window?.v2NodeSpacing);
  return Number.isFinite(_0x1b112f) ? Math.max(0, _0x1b112f) : DEFAULT_NODE_SPAWN_SPACING;
}
function shouldAvoidNodeOverlap() {
  return globalThis?.window?.v2NodeAvoidOverlap !== false;
}
function isPanorama360IncomingImageSourceType(_0x2ea93b) {
  return PANORAMA_360_IMAGE_SOURCE_TYPES.has(String(_0x2ea93b || '').trim());
}
function pickFirstNonEmptyString(..._0x272012) {
  for (const _0x9e8503 of _0x272012) {
    const _0x9e5781 = String(_0x9e8503 || '').trim();
    if (_0x9e5781) return _0x9e5781;
  }
  return '';
}
function inferFileNameFromPath(_0x583274) {
  const _0x30d110 = String(_0x583274 || '').trim();
  if (!_0x30d110) return '';
  const _0x446be2 = _0x30d110.split('?')[0].split('#')[0],
    _0x1e470a = _0x446be2.split(/[\\/]/).filter(Boolean);
  return _0x1e470a.length > 0 ? _0x1e470a[_0x1e470a.length - 1] : '';
}
function resolveMainImageEntry(_0xbc661e) {
  const _0x379146 = Array.isArray(_0xbc661e?.images) ? _0xbc661e.images : [];
  if (_0x379146.length <= 0) return null;
  const _0x1f2532 = Number(_0xbc661e?.mainImageIndex),
    _0x4970ec = Number.isFinite(_0x1f2532)
      ? Math.max(0, Math.min(_0x379146.length - 1, Math.trunc(_0x1f2532)))
      : 0;
  return _0x379146[_0x4970ec] || _0x379146[0] || null;
}
function resolveMainImageIndex(_0x3f62a1) {
  const _0x1c1660 = Array.isArray(_0x3f62a1?.images) ? _0x3f62a1.images : [];
  if (_0x1c1660.length <= 0) return 0;
  const _0xb40865 = Number(_0x3f62a1?.mainImageIndex);
  if (!Number.isFinite(_0xb40865)) return 0;
  return Math.max(0, Math.min(_0x1c1660.length - 1, Math.trunc(_0xb40865)));
}
function resolvePanoramaImagePayloadFromSourceNode(_0x37a1c1) {
  if (!_0x37a1c1 || !isPanorama360IncomingImageSourceType(_0x37a1c1.type)) return null;
  const _0xa8837a = resolveMainImageEntry(_0x37a1c1),
    _0x16a78a = pickFirstNonEmptyString(_0xa8837a?.localPath, _0x37a1c1.localPath),
    _0x10ba24 = pickFirstNonEmptyString(
      _0xa8837a?.imageUrl,
      _0xa8837a?.src,
      _0xa8837a?.sourceUrl,
      _0xa8837a?.url,
      _0x37a1c1.imageUrl,
      _0x37a1c1.src,
      _0x37a1c1.sourceUrl,
      _0x37a1c1.thumbUrl,
    );
  if (!_0x16a78a && !_0x10ba24) return null;
  const _0xbd2f8a = pickFirstNonEmptyString(
    _0xa8837a?.fileName,
    _0x37a1c1.fileName,
    inferFileNameFromPath(_0x16a78a),
    inferFileNameFromPath(_0x10ba24),
  );
  return {
    localPath: _0x16a78a || null,
    imageUrl: _0x10ba24 || null,
    fileName: _0xbd2f8a || null,
    mainImageIndex: resolveMainImageIndex(_0x37a1c1),
  };
}
function buildPanoramaSourceSignature(_0x2a2622) {
  if (!_0x2a2622 || typeof _0x2a2622 !== 'object') return '';
  return JSON.stringify({
    localPath: String(_0x2a2622.localPath || '').trim(),
    imageUrl: String(_0x2a2622.imageUrl || '').trim(),
    fileName: String(_0x2a2622.fileName || '').trim(),
    mainImageIndex: Number(_0x2a2622.mainImageIndex || 0) || 0,
  });
}
function hasPersistentPanoramaLocalPath(_0x20b99a) {
  const _0x5b7d4f = String(_0x20b99a || '').trim();
  if (!_0x5b7d4f) return false;
  return !/^(blob:|data:|https?:)/i.test(_0x5b7d4f);
}
function bumpPanorama360SyncVersion(_0x35aeaa) {
  const _0x8efaf3 = String(_0x35aeaa || '').trim(),
    _0xc816e5 = Number(_panorama360SyncVersionByNodeId.get(_0x8efaf3) || 0) + 1;
  return (_panorama360SyncVersionByNodeId.set(_0x8efaf3, _0xc816e5), _0xc816e5);
}
function isPanorama360SyncCurrent(_0x26f722, _0x29433f) {
  return (
    Number(_panorama360SyncVersionByNodeId.get(String(_0x26f722 || '').trim()) || 0) ===
    Number(_0x29433f || 0)
  );
}
function getPanoramaIncomingEdgeSortValue(_0x4cf998) {
  const _0x41064a = Number(_0x4cf998?.createdAt);
  if (Number.isFinite(_0x41064a) && _0x41064a > 0) return _0x41064a;
  const _0x4b439e = Number(_0x4cf998?.updatedAt);
  if (Number.isFinite(_0x4b439e) && _0x4b439e > 0) return _0x4b439e;
  return 0;
}
function comparePanoramaIncomingCandidatesDesc(_0x355130, _0x5e744d) {
  const _0x20727e =
    getPanoramaIncomingEdgeSortValue(_0x5e744d.edge) - getPanoramaIncomingEdgeSortValue(_0x355130.edge);
  if (_0x20727e !== 0) return _0x20727e;
  return String(_0x5e744d.edge?.id || '').localeCompare(String(_0x355130.edge?.id || ''));
}
function buildPanoramaUploadSourceNodeData({
  storeInstance: _0x2125c9,
  anchorNode: _0x1dabfb,
  localPath: _0x718295,
  imageUrl: _0x473d0b,
  fileName: _0x5a817f,
  uploadedSize: _0x389459,
}) {
  if (!_0x2125c9 || !_0x1dabfb) return null;
  const _0x374234 = Number(_0x389459?.width),
    _0x3706c5 = Number(_0x389459?.height),
    _0x159b38 = buildSourceMediaNodePayload({
      id: '__seed__',
      type: 'source-image',
      x: 0,
      y: 0,
      src: _0x473d0b || '',
      localPath: _0x718295 || '',
      fileName: _0x5a817f || '',
      ...(_0x374234 > 0 && _0x3706c5 > 0 ? { naturalWidth: _0x374234, naturalHeight: _0x3706c5 } : null),
    }),
    _0x4ad28b = resolveNodeSpawnSpacing(),
    _0x4ce9cf = Number(_0x1dabfb.x) || 0,
    _0x1e176b = Number(_0x1dabfb.y) || 0,
    _0x11521d = Number(_0x1dabfb.height) || _0x159b38.height,
    _0x39e55d = _0x4ce9cf - _0x159b38.width - _0x4ad28b,
    _0x1c5e23 = _0x1e176b + Math.round((_0x11521d - _0x159b38.height) / 2),
    _0x16619a = _0x2125c9.getStateRaw?.().nodes || {},
    _0x5321d1 = shouldAvoidNodeOverlap()
      ? findAvailablePosition(
          _0x16619a,
          _0x39e55d,
          _0x1c5e23,
          _0x159b38.width,
          _0x159b38.height,
          _0x4ad28b,
          'left',
        )
      : { x: _0x39e55d, y: _0x1c5e23 };
  return { ..._0x159b38, id: generateId('source-image'), x: _0x5321d1.x, y: _0x5321d1.y };
}
export function setPanoramaSceneMode({
  nodeId: _0x527366,
  mode: _0x2cabbb,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x527366, (_0x30f1ba, _0x563049) => {
    const _0x4fe65b = cloneSceneState(_0x30f1ba);
    return (
      (_0x4fe65b.mode = isPanorama360NodeType(_0x563049?.type) ? 'panorama' : 'scene'),
      (_0x4fe65b.viewport.activeView = 'default'),
      (_0x4fe65b.viewport.activeCameraId = null),
      _0x4fe65b
    );
  });
}
export function setPanoramaSceneEnvironmentMode({
  nodeId: _0x40088a,
  environmentMode: _0x72d8a0,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x40088a, (_0x581f17) => {
    const _0x1f91f3 = cloneSceneState(_0x581f17);
    return ((_0x1f91f3.environmentMode = _0x72d8a0 === 'night' ? 'night' : 'day'), _0x1f91f3);
  });
}
export function setPanoramaSceneTool({
  nodeId: _0x3834fb,
  tool: _0x14b945,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x3834fb, (_0x4b0c0f) => {
    const _0x4ff7e8 = cloneSceneState(_0x4b0c0f),
      _0xf6641b =
        _0x14b945 === 'move' || _0x14b945 === 'rotate' || _0x14b945 === 'scale' || _0x14b945 === 'box-select'
          ? _0x14b945
          : 'navigate';
    return (
      _0xf6641b === 'box-select' || _0xf6641b === 'navigate'
        ? (_0x4ff7e8.ui.mouseTool = _0xf6641b)
        : (_0x4ff7e8.ui.transformTool = _0xf6641b),
      (_0x4ff7e8.ui.activeTool = _0xf6641b),
      _0x4ff7e8
    );
  });
}
export function setPanoramaSceneTransformSpace({
  nodeId: _0x237a61,
  transformSpace: _0x3dfde9,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x237a61, (_0x25a22d) => {
    const _0x415dae = cloneSceneState(_0x25a22d);
    return ((_0x415dae.ui.transformSpace = 'local'), _0x415dae);
  });
}
export function setPanoramaScenePivotMode({
  nodeId: _0x2afe40,
  pivotMode: _0x50be00,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x2afe40, (_0x2087f7) => {
    const _0x33708e = cloneSceneState(_0x2087f7);
    return ((_0x33708e.ui.pivotMode = 'active'), _0x33708e);
  });
}
export function setPanoramaSceneNavigationPreset({
  nodeId: _0x36e391,
  navigationPreset: _0x3ca4f4,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x36e391, (_0x4c5469) => {
    const _0x933539 = cloneSceneState(_0x4c5469);
    return ((_0x933539.ui.navigationPreset = _0x3ca4f4 === 'dcc' ? 'dcc' : 'dcc'), _0x933539);
  });
}
export function setPanoramaSceneEditing({
  nodeId: _0x44ccdb,
  isEditing: _0x3b7b14,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x44ccdb, (_0x1ee91) => {
    const _0x305787 = cloneSceneState(_0x1ee91);
    return (
      (_0x305787.ui.isEditing = _0x3b7b14 === true),
      !_0x305787.ui.isEditing && (_0x305787.ui.showCameraList = false),
      _0x305787
    );
  });
}
export function setPanoramaSceneSelection({
  nodeId: _0x3e9d6c,
  objectType: _0x2eee02,
  objectId: _0x542064,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x3e9d6c, (_0x22bd1d) => {
    const _0x213b76 = cloneSceneState(_0x22bd1d);
    if (_0x2eee02 === 'camera') return _0x213b76;
    const _0x5eca80 = _0x2eee02 === 'mannequin' || _0x2eee02 === 'cube' ? _0x2eee02 : null,
      _0x3302e1 = _0x542064 ? String(_0x542064) : null;
    if (!_0x5eca80 || !_0x3302e1) return (clearSelection(_0x213b76), _0x213b76);
    const _0x186f31 = resolveGroupByMember(_0x213b76, _0x5eca80, _0x3302e1);
    if (_0x186f31)
      return (
        setSelectionFromObjects(
          _0x213b76,
          _0x186f31.memberIds.map((_0x253c7c) => ({ objectType: 'mannequin', objectId: _0x253c7c })),
          { preferredGroupId: _0x186f31.id, preferredActiveType: 'mannequin', preferredActiveId: _0x3302e1 },
        ),
        _0x213b76
      );
    return (
      setSelectionFromObjects(_0x213b76, [{ objectType: _0x5eca80, objectId: _0x3302e1 }], {
        preferredActiveType: _0x5eca80,
        preferredActiveId: _0x3302e1,
      }),
      _0x213b76
    );
  });
}
export function setPanoramaSceneSelectionBatch({
  nodeId: _0x299da0,
  objectType: _0x3d9e33,
  objectIds: objectIds = [],
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x299da0, (_0x1937c9) => {
    const _0x5a8e8c = cloneSceneState(_0x1937c9);
    if (_0x3d9e33 === 'camera') return _0x5a8e8c;
    const _0x2d5b6d = _0x3d9e33 === 'mannequin' || _0x3d9e33 === 'cube' ? _0x3d9e33 : null,
      _0x2b9841 = [
        ...new Set(
          (Array.isArray(objectIds) ? objectIds : [])
            .map((_0x3c9c26) => String(_0x3c9c26 || '').trim())
            .filter(Boolean),
        ),
      ];
    if (!_0x2d5b6d || _0x2b9841.length === 0) return (clearSelection(_0x5a8e8c), _0x5a8e8c);
    let _0x4b0581 = groupId ? String(groupId) : null;
    if (_0x4b0581) {
      const _0x5636d6 = (_0x5a8e8c.groups || []).find((_0x1b149d) => _0x1b149d.id === _0x4b0581);
      if (!_0x5636d6) _0x4b0581 = null;
      else
        return (
          setSelectionFromObjects(
            _0x5a8e8c,
            _0x5636d6.memberIds.map((_0x5290cc) => ({ objectType: 'mannequin', objectId: _0x5290cc })),
            {
              preferredGroupId: _0x4b0581,
              preferredActiveType: 'mannequin',
              preferredActiveId: _0x5636d6.memberIds[0] || null,
            },
          ),
          _0x5a8e8c
        );
    }
    return (
      setSelectionFromObjects(
        _0x5a8e8c,
        _0x2b9841.map((_0xd830dc) => ({ objectType: _0x2d5b6d, objectId: _0xd830dc })),
        { preferredActiveType: _0x2d5b6d, preferredActiveId: _0x2b9841[0] || null },
      ),
      _0x5a8e8c
    );
  });
}
export function setPanoramaSceneSelectionObjects({
  nodeId: _0x1e9b32,
  objects: objects = [],
  activeObjectType: activeObjectType = null,
  activeObjectId: activeObjectId = null,
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x1e9b32, (_0x72a2f) => {
    const _0x782123 = cloneSceneState(_0x72a2f);
    return (
      setSelectionFromObjects(_0x782123, objects, {
        preferredGroupId: groupId,
        preferredActiveType: activeObjectType,
        preferredActiveId: activeObjectId,
      }),
      _0x782123
    );
  });
}
export function clearPanoramaSceneSelection({ nodeId: _0x3c00c7, storeInstance: storeInstance = appStore }) {
  setPanoramaSceneSelection({
    nodeId: _0x3c00c7,
    objectType: null,
    objectId: null,
    storeInstance: storeInstance,
  });
}
export function setPanoramaSceneCameraListVisible({
  nodeId: _0x2ec526,
  visible: _0x61bedd,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x2ec526, (_0x56583d) => {
    const _0xd82b94 = cloneSceneState(_0x56583d);
    return ((_0xd82b94.ui.showCameraList = _0x61bedd === true), _0xd82b94);
  });
}
export function setPanoramaSceneGridPlacement({
  nodeId: _0x13648c,
  patch: _0x573a27,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x13648c, (_0x32a551) => {
    const _0x15b344 = cloneSceneState(_0x32a551);
    return (
      (_0x15b344.gridPlacement = { ..._0x15b344.gridPlacement, ...(_0x573a27 || {}) }),
      normalizePanoramaSceneState(_0x15b344)
    );
  });
}
export function resetPanoramaSceneView({ nodeId: _0x3981a6, storeInstance: storeInstance = appStore }) {
  writeSceneState(storeInstance, _0x3981a6, (_0x193957) => {
    const _0x1965a2 = cloneSceneState(_0x193957);
    return (
      (_0x1965a2.viewport.activeView = 'default'),
      (_0x1965a2.viewport.activeCameraId = null),
      _0x1965a2.mode === 'panorama'
        ? (_0x1965a2.viewport.panoramaView = createDefaultPanoramaView())
        : (_0x1965a2.viewport.sceneView = createDefaultSceneView()),
      _0x1965a2
    );
  });
}
export function applyPanoramaSceneViewCommit({
  nodeId: _0x3967c6,
  sceneView: _0x2b29d2,
  panoramaView: _0x3eaad5,
  activeView: activeView = 'default',
  activeCameraId: activeCameraId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x3967c6, (_0x3b3d1a) => {
    const _0x579a85 = cloneSceneState(_0x3b3d1a);
    return (
      (_0x579a85.viewport.activeView = activeView === 'camera' ? 'camera' : 'default'),
      (_0x579a85.viewport.activeCameraId =
        _0x579a85.viewport.activeView === 'camera' && activeCameraId ? String(activeCameraId) : null),
      _0x2b29d2 && (_0x579a85.viewport.sceneView = { ..._0x579a85.viewport.sceneView, ..._0x2b29d2 }),
      _0x3eaad5 && (_0x579a85.viewport.panoramaView = { ..._0x579a85.viewport.panoramaView, ..._0x3eaad5 }),
      normalizePanoramaSceneState(_0x579a85)
    );
  });
}
export function activatePanoramaSceneCamera({
  nodeId: _0x5c07a3,
  cameraId: _0x862c9c,
  storeInstance: storeInstance = appStore,
}) {
  const _0xff4c53 = getStoreNode(storeInstance, _0x5c07a3);
  if (isPanorama360NodeType(_0xff4c53?.type)) return;
  writeSceneState(storeInstance, _0x5c07a3, (_0x4d81a5) => {
    const _0x3475ea = cloneSceneState(_0x4d81a5),
      _0x4f5dc2 = _0x3475ea.cameras.find((_0x36796a) => _0x36796a.id === _0x862c9c) || null;
    if (!_0x4f5dc2) return _0x3475ea;
    return (
      _0x3475ea.mode === 'panorama'
        ? ((_0x3475ea.viewport.activeView = 'camera'),
          (_0x3475ea.viewport.activeCameraId = String(_0x862c9c)),
          (_0x3475ea.viewport.panoramaView = cameraPoseToPanoramaView(_0x4f5dc2)))
        : ((_0x3475ea.viewport.activeView = 'default'),
          (_0x3475ea.viewport.activeCameraId = null),
          (_0x3475ea.viewport.sceneView = cameraPoseToSceneViewFromReference(
            _0x4f5dc2,
            _0x3475ea.viewport.sceneView || createDefaultSceneView(),
          ))),
      _0x3475ea
    );
  });
}
export function setPanoramaSceneCaptureMode({
  nodeId: _0x295e3e,
  mode: _0x1fb353,
  showSafeFrame: showSafeFrame = true,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x295e3e, (_0x2bca66) => {
    const _0xea18b7 = cloneSceneState(_0x2bca66),
      _0x1a999c = _0x1fb353 === '9:16' || _0x1fb353 === '2.35:1' ? _0x1fb353 : 'adaptive';
    return (
      (_0xea18b7.capture.mode = _0x1a999c),
      (_0xea18b7.capture.showSafeFrame = _0x1a999c === 'adaptive' ? false : showSafeFrame === true),
      normalizePanoramaSceneState(_0xea18b7)
    );
  });
}
export function setPanoramaSceneSafeFrameVisible({
  nodeId: _0x5aea4a,
  visible: _0x37a150,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x5aea4a, (_0x48eb0e) => {
    const _0x2b865d = cloneSceneState(_0x48eb0e);
    return ((_0x2b865d.capture.showSafeFrame = _0x37a150 === true), normalizePanoramaSceneState(_0x2b865d));
  });
}
export function activatePanoramaSceneCameraSlot({
  nodeId: _0xb23676,
  slot: _0x2c2733,
  storeInstance: storeInstance = appStore,
}) {
  const _0x439fbb = getStoreNode(storeInstance, _0xb23676);
  if (isPanorama360NodeType(_0x439fbb?.type)) return null;
  const _0x4d94ad = getSceneState(storeInstance, _0xb23676),
    _0x3c86f1 = resolveCameraBySlot(_0x4d94ad.cameras, _0x2c2733);
  if (!_0x3c86f1?.camera?.id) return null;
  return (
    activatePanoramaSceneCamera({
      nodeId: _0xb23676,
      cameraId: _0x3c86f1.camera.id,
      storeInstance: storeInstance,
    }),
    _0x3c86f1.camera.id
  );
}
export function upsertPanoramaSceneCameraAtSlot({
  nodeId: _0x1e3007,
  slot: _0x2eb9ad,
  viewPose: _0x489e69,
  storeInstance: storeInstance = appStore,
}) {
  const _0x1588f5 = getStoreNode(storeInstance, _0x1e3007);
  if (isPanorama360NodeType(_0x1588f5?.type)) return null;
  const _0x121e48 = normalizeCameraSlot(_0x2eb9ad);
  if (!_0x121e48) return null;
  const _0x260ed5 = getSceneState(storeInstance, _0x1e3007),
    _0x1a46f1 = sanitizeCameraPose(_0x489e69),
    _0x46cbbe = resolveCameraBySlot(_0x260ed5.cameras, _0x121e48);
  let _0x3d563 = _0x46cbbe?.camera?.id || null,
    _0x5b84b0 = false;
  writeSceneState(storeInstance, _0x1e3007, (_0x333abc) => {
    const _0x441aef = cloneSceneState(_0x333abc),
      _0x128a85 = resolveCameraBySlot(_0x441aef.cameras, _0x121e48);
    if (_0x128a85?.camera?.id) {
      const _0x145782 = _0x128a85.camera.id;
      return (
        (_0x3d563 = _0x145782),
        (_0x441aef.cameras = _0x441aef.cameras.map((_0x5c606e) =>
          _0x5c606e.id === _0x145782
            ? {
                ..._0x5c606e,
                slot: _0x121e48,
                name:
                  _0x5c606e.name ||
                  panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(_0x121e48) }),
                position: _0x1a46f1.position,
                quaternion: _0x1a46f1.quaternion,
                rotation: _0x1a46f1.rotation,
                focalLength: _0x1a46f1.focalLength,
              }
            : _0x5c606e,
        )),
        _0x441aef.mode === 'panorama' &&
          ((_0x441aef.viewport.activeCameraId = _0x145782), (_0x441aef.viewport.activeView = 'camera')),
        (_0x5b84b0 = true),
        _0x441aef
      );
    }
    if (_0x441aef.cameras.length >= PANORAMA_SCENE_CAMERA_LIMIT) return _0x441aef;
    const _0x289e07 = generateId('scene-camera');
    return (
      (_0x3d563 = _0x289e07),
      _0x441aef.cameras.push({
        id: _0x289e07,
        slot: _0x121e48,
        name: panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(_0x121e48) }),
        position: _0x1a46f1.position,
        quaternion: _0x1a46f1.quaternion,
        rotation: _0x1a46f1.rotation,
        focalLength: _0x1a46f1.focalLength,
      }),
      _0x441aef.mode === 'panorama' &&
        ((_0x441aef.viewport.activeCameraId = _0x289e07), (_0x441aef.viewport.activeView = 'camera')),
      (_0x5b84b0 = true),
      _0x441aef
    );
  });
  if (!_0x5b84b0)
    return (
      showWarning(panoramaSceneText('camera.limitWarning', { count: PANORAMA_SCENE_CAMERA_LIMIT })),
      null
    );
  return (commit(), _0x3d563);
}
export function activatePanoramaSceneDefaultView({
  nodeId: _0x3e3f9e,
  pose: _0x380f8b,
  storeInstance: storeInstance = appStore,
}) {
  const _0x1b4d78 = getSceneState(storeInstance, _0x3e3f9e);
  if (_0x1b4d78.mode === 'panorama') {
    const _0x1e22a0 = _0x380f8b ? cameraPoseToPanoramaView(_0x380f8b) : _0x1b4d78.viewport.panoramaView;
    applyPanoramaSceneViewCommit({
      nodeId: _0x3e3f9e,
      panoramaView: _0x1e22a0,
      activeView: 'default',
      activeCameraId: null,
      storeInstance: storeInstance,
    });
    return;
  }
  const _0x1cd0d1 = _0x380f8b
    ? cameraPoseToSceneViewFromReference(_0x380f8b, _0x1b4d78.viewport.sceneView || createDefaultSceneView())
    : _0x1b4d78.viewport.sceneView;
  applyPanoramaSceneViewCommit({
    nodeId: _0x3e3f9e,
    sceneView: _0x1cd0d1,
    activeView: 'default',
    activeCameraId: null,
    storeInstance: storeInstance,
  });
}
export async function uploadPanoramaSceneImage({
  nodeId: _0xba2e98,
  file: _0x45fb8b,
  storeInstance: storeInstance = appStore,
  getCurrentProjectId: getCurrentProjectId = () => window.currentProjectId || 'default_v2_project',
}) {
  if (!_0x45fb8b) return null;
  const _0x3069f8 = getStoreNode(storeInstance, _0xba2e98);
  if (!_0x3069f8) return null;
  if (!isPanorama360NodeType(_0x3069f8.type))
    return (showWarning(panoramaSceneText('upload.unsupportedNode')), null);
  try {
    const _0x509745 = await uploadFile(_0x45fb8b, getCurrentProjectId()),
      _0x45063c = _0x509745.filename || _0x45fb8b.name,
      _0x400d60 = pickResultLocalPath(_0x509745),
      _0x98167d = localPathToUrl(_0x400d60) || String(_0x509745.url || '').trim() || null,
      _0x14fa5e = await resolveOutputMediaSize({ localPath: _0x400d60, imageUrl: _0x98167d });
    if (_0x14fa5e && !isNearEquirectangularRatio(_0x14fa5e)) {
      const _0x5dceb4 = _0x14fa5e.width / _0x14fa5e.height;
      showWarning(
        panoramaSceneText('upload.ratioWarning', {
          width: _0x14fa5e.width,
          height: _0x14fa5e.height,
          ratio: _0x5dceb4.toFixed(3),
        }),
      );
    }
    const _0x46bf39 = buildPanoramaUploadSourceNodeData({
        storeInstance: storeInstance,
        anchorNode: _0x3069f8,
        localPath: _0x400d60,
        imageUrl: _0x98167d,
        fileName: _0x45063c,
        uploadedSize: _0x14fa5e,
      }),
      _0x24fd02 = Date.now();
    return (
      storeInstance.batch(() => {
        (writeSceneState(storeInstance, _0xba2e98, (_0x449b88) => {
          const _0x10678b = cloneSceneState(_0x449b88);
          return (
            (_0x10678b.mode = 'panorama'),
            (_0x10678b.viewport.activeView = 'default'),
            (_0x10678b.viewport.activeCameraId = null),
            (_0x10678b.panorama = {
              localPath: _0x400d60,
              imageUrl: _0x98167d,
              fileName: _0x45063c,
              sourceSignature: null,
              isLoaded: false,
              error: null,
            }),
            _0x10678b
          );
        }),
          _0x46bf39 &&
            (storeInstance.addNode(_0x46bf39),
            storeInstance.addEdge({
              id: generateId('edge'),
              sourceId: _0x46bf39.id,
              targetId: _0xba2e98,
              createdAt: _0x24fd02,
            })),
          storeInstance.setSelectedNodes([_0xba2e98]));
      }),
      commit(),
      showSuccess(panoramaSceneText('upload.success')),
      { localPath: _0x400d60, imageUrl: _0x98167d, fileName: _0x45063c, sourceNodeId: _0x46bf39?.id || null }
    );
  } catch (_0x302853) {
    const _0x310018 = String(_0x302853?.message || panoramaSceneText('upload.failed'));
    return (
      writeSceneState(storeInstance, _0xba2e98, (_0x39c7b1) => {
        const _0x344c32 = cloneSceneState(_0x39c7b1);
        return ((_0x344c32.panorama.error = _0x310018), (_0x344c32.panorama.isLoaded = false), _0x344c32);
      }),
      showError(panoramaSceneText('upload.failedWithError', { error: _0x310018 })),
      null
    );
  }
}
export function syncPanorama360FromIncomingImageEdge({
  nodeId: _0x20f869,
  storeInstance: storeInstance = appStore,
}) {
  const _0x351d4c = String(_0x20f869 || '').trim(),
    _0x2030e2 = getStoreNode(storeInstance, _0x351d4c);
  if (!_0x2030e2 || !isPanorama360NodeType(_0x2030e2.type))
    return (bumpPanorama360SyncVersion(_0x351d4c), null);
  const _0x3a51c8 =
      typeof storeInstance?.getIncomingEdges === 'function'
        ? storeInstance.getIncomingEdges(_0x351d4c)
        : Object.values(storeInstance.getStateRaw?.().edges || {}).filter(
            (_0x2a829d) => _0x2a829d?.targetId === _0x351d4c,
          ),
    _0x487f53 = storeInstance.getStateRaw?.().nodes || {},
    _0x2f71de = (Array.isArray(_0x3a51c8) ? _0x3a51c8 : [])
      .map((_0x35ce9a) => {
        const _0x4e629 = _0x487f53[_0x35ce9a?.sourceId] || null,
          _0x23a80c = resolvePanoramaImagePayloadFromSourceNode(_0x4e629);
        if (!_0x4e629 || !_0x23a80c) return null;
        return { edge: _0x35ce9a, sourceNode: _0x4e629, payload: _0x23a80c };
      })
      .filter(Boolean)
      .sort(comparePanoramaIncomingCandidatesDesc),
    _0x4d8e10 = _0x2f71de[0] || null;
  if (!_0x4d8e10?.payload) return (bumpPanorama360SyncVersion(_0x351d4c), null);
  const _0xf64e43 = buildPanoramaSourceSignature(_0x4d8e10.payload),
    _0x4001a3 = getSceneState(storeInstance, _0x351d4c),
    _0x577738 = _0x4001a3?.panorama || {},
    _0x5adaa2 = _0x577738.isLoaded === false && !_0x577738.error,
    _0x4a62dd =
      String(_0x577738.sourceSignature || '') === _0xf64e43 &&
      hasPersistentPanoramaLocalPath(_0x577738.localPath);
  if (_0x4a62dd) {
    const _0x57c61e = {
      localPath: String(_0x577738.localPath || '').trim() || _0x4d8e10.payload.localPath,
      imageUrl: String(_0x577738.imageUrl || '').trim() || _0x4d8e10.payload.imageUrl,
      fileName: String(_0x577738.fileName || '').trim() || _0x4d8e10.payload.fileName,
      sourceSignature: _0xf64e43,
      isLoaded: false,
      error: null,
    };
    if (_0x5adaa2) return { ..._0x57c61e, sourceNodeId: _0x4d8e10.sourceNode.id, updated: false };
    return (
      writeSceneState(storeInstance, _0x351d4c, (_0x2b4b0d) => {
        const _0x44c384 = cloneSceneState(_0x2b4b0d);
        return (
          (_0x44c384.mode = 'panorama'),
          (_0x44c384.viewport.activeView = 'default'),
          (_0x44c384.viewport.activeCameraId = null),
          (_0x44c384.panorama = _0x57c61e),
          _0x44c384
        );
      }),
      { ..._0x57c61e, sourceNodeId: _0x4d8e10.sourceNode.id, updated: true }
    );
  }
  const _0x2399bf = _panorama360SyncInflightByNodeId.get(_0x351d4c);
  if (_0x2399bf?.signature === _0xf64e43 && _0x2399bf?.promise) return _0x2399bf.promise;
  const _0x13e0f3 = bumpPanorama360SyncVersion(_0x351d4c),
    _0x1ffa58 = (async () => {
      try {
        const _0x358cc4 = await ensurePersistedPanoramaInputPng({
          localPath: _0x4d8e10.payload.localPath,
          imageUrl: _0x4d8e10.payload.imageUrl,
          fileName: _0x4d8e10.payload.fileName,
          sourceSignature: _0xf64e43,
        });
        if (!isPanorama360SyncCurrent(_0x351d4c, _0x13e0f3))
          return { ..._0x358cc4, sourceNodeId: _0x4d8e10.sourceNode.id, updated: false, stale: true };
        const _0x5ed7c3 = getStoreNode(storeInstance, _0x351d4c);
        if (!_0x5ed7c3 || !isPanorama360NodeType(_0x5ed7c3.type)) return null;
        const _0x59e917 = getSceneState(storeInstance, _0x351d4c),
          _0x2e95fd = _0x59e917?.panorama || {},
          _0x2566e1 = {
            localPath: _0x358cc4.localPath,
            imageUrl: _0x358cc4.imageUrl,
            fileName: _0x358cc4.fileName,
            sourceSignature: _0xf64e43,
            isLoaded: false,
            error: null,
          },
          _0x5dbf92 =
            String(_0x2e95fd.localPath || '') === String(_0x2566e1.localPath || '') &&
            String(_0x2e95fd.imageUrl || '') === String(_0x2566e1.imageUrl || '') &&
            String(_0x2e95fd.fileName || '') === String(_0x2566e1.fileName || '') &&
            String(_0x2e95fd.sourceSignature || '') === _0xf64e43,
          _0x1777e8 = _0x2e95fd.isLoaded === false && !_0x2e95fd.error;
        if (_0x5dbf92 && _0x1777e8)
          return { ..._0x2566e1, sourceNodeId: _0x4d8e10.sourceNode.id, updated: false };
        return (
          writeSceneState(storeInstance, _0x351d4c, (_0x5f38ac) => {
            const _0x4efd58 = cloneSceneState(_0x5f38ac);
            return (
              (_0x4efd58.mode = 'panorama'),
              (_0x4efd58.viewport.activeView = 'default'),
              (_0x4efd58.viewport.activeCameraId = null),
              (_0x4efd58.panorama = _0x2566e1),
              _0x4efd58
            );
          }),
          { ..._0x2566e1, sourceNodeId: _0x4d8e10.sourceNode.id, updated: true }
        );
      } catch (_0x28abf3) {
        if (!isPanorama360SyncCurrent(_0x351d4c, _0x13e0f3))
          return {
            updated: false,
            stale: true,
            error: String(_0x28abf3?.message || _0x28abf3 || panoramaSceneText('errors.unknown')),
          };
        const _0x3b44d7 = String(_0x28abf3?.message || panoramaSceneText('errors.pngNormalizeFailed'));
        return (showError(_0x3b44d7), { updated: false, error: _0x3b44d7 });
      } finally {
        const _0x307734 = _panorama360SyncInflightByNodeId.get(_0x351d4c);
        _0x307734?.promise === _0x1ffa58 && _panorama360SyncInflightByNodeId.delete(_0x351d4c);
      }
    })();
  return (
    _panorama360SyncInflightByNodeId.set(_0x351d4c, {
      signature: _0xf64e43,
      version: _0x13e0f3,
      promise: _0x1ffa58,
    }),
    _0x1ffa58
  );
}
export function updatePanoramaSceneLoadState({
  nodeId: _0x2e8170,
  isLoaded: _0x267aa1,
  error: error = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x2e8170, (_0x42c7fc) => {
    const _0x418b69 = cloneSceneState(_0x42c7fc);
    return (
      (_0x418b69.panorama.isLoaded = _0x267aa1 === true),
      (_0x418b69.panorama.error = error ? String(error) : null),
      _0x418b69
    );
  });
}
export function addPanoramaSceneMannequin({
  nodeId: _0x2af587,
  gender: gender = 'male',
  colorKey: colorKey = 'blue',
  viewPose: _0xbe2dc6,
  storeInstance: storeInstance = appStore,
}) {
  const _0x429d14 = getSceneState(storeInstance, _0x2af587),
    _0x5a84f5 = resolveObjectPlacementPoint({
      sceneMode: _0x429d14.mode,
      sceneViewTarget: _0x429d14?.viewport?.sceneView?.target,
      pose: _0xbe2dc6,
      groundY: 0,
      forwardDistance: MANNEQUIN_FORWARD_PLACEMENT_DISTANCE,
    }),
    _0x3d62d2 = pickFacingCameraYaw(_0xbe2dc6),
    _0xa260f9 = generateId('mannequin');
  return (
    writeSceneState(storeInstance, _0x2af587, (_0x35fedd) => {
      const _0x43d1ec = cloneSceneState(_0x35fedd);
      return (
        _0x43d1ec.mannequins.push({
          id: _0xa260f9,
          gender: gender === 'female' ? 'female' : 'male',
          colorKey: colorKey,
          position: _0x5a84f5,
          rotation: { x: 0, y: _0x3d62d2, z: 0 },
          scale: 1,
        }),
        (_0x43d1ec.gridPlacement.gender = gender === 'female' ? 'female' : 'male'),
        (_0x43d1ec.gridPlacement.colorKey = colorKey),
        setSingleSelection(_0x43d1ec, 'mannequin', _0xa260f9),
        _0x43d1ec
      );
    }),
    commit(),
    _0xa260f9
  );
}
export function addPanoramaSceneCube({
  nodeId: _0x22f9da,
  colorKey: colorKey = 'blue',
  viewPose: _0x3c2aa2,
  storeInstance: storeInstance = appStore,
}) {
  const _0x42e45c = getStoreNode(storeInstance, _0x22f9da);
  if (isPanorama360NodeType(_0x42e45c?.type)) return null;
  const _0x509a75 = getSceneState(storeInstance, _0x22f9da),
    _0x419d79 = resolveObjectPlacementPoint({
      sceneMode: _0x509a75.mode,
      sceneViewTarget: _0x509a75?.viewport?.sceneView?.target,
      pose: _0x3c2aa2,
      groundY: 0,
      forwardDistance: CUBE_FORWARD_PLACEMENT_DISTANCE,
    }),
    _0x33d69a = { x: _0x419d79.x, y: 0, z: _0x419d79.z },
    _0x376191 = generateId('cube');
  return (
    writeSceneState(storeInstance, _0x22f9da, (_0x24984e) => {
      const _0x52bf28 = cloneSceneState(_0x24984e);
      return (
        _0x52bf28.cubes.push({
          id: _0x376191,
          colorKey: colorKey,
          position: _0x33d69a,
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
        }),
        setSingleSelection(_0x52bf28, 'cube', _0x376191),
        _0x52bf28
      );
    }),
    commit(),
    _0x376191
  );
}
export function addPanoramaSceneMannequinGrid({
  nodeId: _0xfdf4b7,
  viewPose: _0x4474dc,
  storeInstance: storeInstance = appStore,
}) {
  const _0x493e58 = getSceneState(storeInstance, _0xfdf4b7),
    _0x464bef = pickFacingCameraYaw(_0x4474dc),
    _0x217a24 = resolveBatchPlacementOrigin({
      sceneMode: _0x493e58.mode,
      sceneViewTarget: _0x493e58?.viewport?.sceneView?.target,
      pose: _0x4474dc,
      groundY: 0,
      forwardDistance: MANNEQUIN_FORWARD_PLACEMENT_DISTANCE,
    }),
    _0x1bc216 = computeGridPlacement({
      rows: _0x493e58.gridPlacement.rows,
      cols: _0x493e58.gridPlacement.cols,
      spacingX: _0x493e58.gridPlacement.spacingX,
      spacingZ: _0x493e58.gridPlacement.spacingZ,
      origin: _0x217a24,
      yaw: _0x464bef,
    });
  if (_0x1bc216.length === 0) return [];
  const _0x2c3d50 = [],
    _0x260418 = generateId('mannequin-group');
  return (
    writeSceneState(storeInstance, _0xfdf4b7, (_0x36a744) => {
      const _0x43ab0a = cloneSceneState(_0x36a744);
      for (const _0x12c52f of _0x1bc216) {
        const _0x1c06c1 = generateId('mannequin');
        (_0x2c3d50.push(_0x1c06c1),
          _0x43ab0a.mannequins.push({
            id: _0x1c06c1,
            gender: _0x43ab0a.gridPlacement.gender,
            colorKey: _0x43ab0a.gridPlacement.colorKey,
            position: _0x12c52f,
            rotation: { x: 0, y: _0x464bef, z: 0 },
            scale: 1,
          }));
      }
      return (
        (_0x43ab0a.groups = Array.isArray(_0x43ab0a.groups) ? _0x43ab0a.groups : []),
        _0x43ab0a.groups.push({
          id: _0x260418,
          type: 'mannequin-grid',
          memberObjectType: 'mannequin',
          memberIds: [..._0x2c3d50],
        }),
        setSelectionFromObjects(
          _0x43ab0a,
          _0x2c3d50.map((_0xdef642) => ({ objectType: 'mannequin', objectId: _0xdef642 })),
          {
            preferredGroupId: _0x260418,
            preferredActiveType: 'mannequin',
            preferredActiveId: _0x2c3d50[0] || null,
          },
        ),
        _0x43ab0a
      );
    }),
    commit(),
    _0x2c3d50
  );
}
export function addPanoramaSceneCamera({
  nodeId: _0x4d008f,
  viewPose: _0x288e59,
  storeInstance: storeInstance = appStore,
}) {
  const _0x2c017a = getStoreNode(storeInstance, _0x4d008f);
  if (isPanorama360NodeType(_0x2c017a?.type)) return null;
  const _0x4d38b0 = getSceneState(storeInstance, _0x4d008f);
  if (_0x4d38b0.cameras.length >= PANORAMA_SCENE_CAMERA_LIMIT)
    return (
      showWarning(panoramaSceneText('camera.limitWarning', { count: PANORAMA_SCENE_CAMERA_LIMIT })),
      null
    );
  const _0x427e30 = sanitizeCameraPose(_0x288e59),
    _0x529390 = generateId('scene-camera'),
    _0x3d08a8 = resolveFirstFreeCameraSlot(_0x4d38b0.cameras);
  if (!_0x3d08a8)
    return (
      showWarning(panoramaSceneText('camera.limitWarning', { count: PANORAMA_SCENE_CAMERA_LIMIT })),
      null
    );
  return (
    writeSceneState(storeInstance, _0x4d008f, (_0x1f4e7f) => {
      const _0x245414 = cloneSceneState(_0x1f4e7f);
      return (
        _0x245414.cameras.push({
          id: _0x529390,
          slot: _0x3d08a8,
          name: panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(_0x3d08a8) }),
          position: _0x427e30.position,
          quaternion: _0x427e30.quaternion,
          rotation: _0x427e30.rotation,
          focalLength: _0x427e30.focalLength,
        }),
        _0x245414.mode === 'panorama' &&
          ((_0x245414.viewport.activeView = 'camera'), (_0x245414.viewport.activeCameraId = _0x529390)),
        _0x245414
      );
    }),
    commit(),
    _0x529390
  );
}
export function updatePanoramaSceneObjectTransform({
  nodeId: _0x552f64,
  objectType: _0x4c1e9b,
  objectId: _0x12f95a,
  pose: _0x2fa75c,
  targets: _0x2f1dd8,
  storeInstance: storeInstance = appStore,
}) {
  const _0x362af9 = Array.isArray(_0x2f1dd8) ? _0x2f1dd8 : [],
    _0x411e57 = _0x2fa75c ? sanitizeObjectPose(_0x2fa75c) : null;
  (writeSceneState(storeInstance, _0x552f64, (_0x1ec72c) => {
    const _0x45abc1 = cloneSceneState(_0x1ec72c);
    if (_0x362af9.length > 0) {
      const _0x323ae1 = new Map(),
        _0x5adf98 = new Map();
      _0x362af9.forEach((_0x9a5abc) => {
        if (!_0x9a5abc?.objectId || !_0x9a5abc?.objectType || !_0x9a5abc?.pose) return;
        const _0x2fdf37 = sanitizeObjectPose(_0x9a5abc.pose);
        if (_0x9a5abc.objectType === 'mannequin') _0x323ae1.set(String(_0x9a5abc.objectId), _0x2fdf37);
        else _0x9a5abc.objectType === 'cube' && _0x5adf98.set(String(_0x9a5abc.objectId), _0x2fdf37);
      });
      _0x323ae1.size > 0 &&
        (_0x45abc1.mannequins = _0x45abc1.mannequins.map((_0x173ec8) => {
          const _0x39e000 = _0x323ae1.get(_0x173ec8.id);
          if (!_0x39e000) return _0x173ec8;
          const _0xf31059 = composeCompatibleScale(_0x39e000.scale, _0x173ec8.scale);
          return {
            ..._0x173ec8,
            position: _0x39e000.position,
            rotation: _0x39e000.rotation,
            quaternion: _0x39e000.quaternion,
            scale: _0xf31059,
          };
        }));
      _0x5adf98.size > 0 &&
        (_0x45abc1.cubes = _0x45abc1.cubes.map((_0x507759) => {
          const _0x2ab54d = _0x5adf98.get(_0x507759.id);
          if (!_0x2ab54d) return _0x507759;
          const _0x1db484 = composeCompatibleScale(_0x2ab54d.scale, _0x507759.scale);
          return {
            ..._0x507759,
            position: _0x2ab54d.position,
            rotation: _0x2ab54d.rotation,
            quaternion: _0x2ab54d.quaternion,
            scale: _0x1db484,
          };
        }));
      if (_0x45abc1.selection.selectedGroupId) {
        const _0x16945e = (_0x45abc1.groups || []).find(
          (_0x14a6fc) => _0x14a6fc.id === _0x45abc1.selection.selectedGroupId,
        );
        _0x16945e &&
          setSelectionFromObjects(
            _0x45abc1,
            _0x16945e.memberIds.map((_0x38edd4) => ({ objectType: 'mannequin', objectId: _0x38edd4 })),
            {
              preferredGroupId: _0x16945e.id,
              preferredActiveType: 'mannequin',
              preferredActiveId: _0x16945e.memberIds[0] || null,
            },
          );
      }
      return _0x45abc1;
    }
    if (_0x4c1e9b === 'camera') return _0x45abc1;
    if (_0x4c1e9b === 'mannequin' && _0x411e57 && _0x12f95a)
      ((_0x45abc1.mannequins = _0x45abc1.mannequins.map((_0x1c0aa2) =>
        _0x1c0aa2.id === _0x12f95a
          ? {
              ..._0x1c0aa2,
              position: _0x411e57.position,
              rotation: _0x411e57.rotation,
              quaternion: _0x411e57.quaternion,
              scale: composeCompatibleScale(_0x411e57.scale, _0x1c0aa2.scale),
            }
          : _0x1c0aa2,
      )),
        setSingleSelection(_0x45abc1, 'mannequin', _0x12f95a));
    else
      _0x4c1e9b === 'cube' &&
        _0x411e57 &&
        _0x12f95a &&
        ((_0x45abc1.cubes = _0x45abc1.cubes.map((_0x1a200a) =>
          _0x1a200a.id === _0x12f95a
            ? {
                ..._0x1a200a,
                position: _0x411e57.position,
                rotation: _0x411e57.rotation,
                quaternion: _0x411e57.quaternion,
                scale: composeCompatibleScale(_0x411e57.scale, _0x1a200a.scale),
              }
            : _0x1a200a,
        )),
        setSingleSelection(_0x45abc1, 'cube', _0x12f95a));
    return _0x45abc1;
  }),
    commit());
}
export function deletePanoramaSceneCamera({
  nodeId: _0x5d469d,
  cameraId: _0x5e2ace,
  storeInstance: storeInstance = appStore,
}) {
  const _0x5c02e8 = getStoreNode(storeInstance, _0x5d469d);
  if (isPanorama360NodeType(_0x5c02e8?.type)) return;
  const _0x256fe5 = getSceneState(storeInstance, _0x5d469d);
  if (!_0x256fe5.cameras.some((_0x4c30a7) => _0x4c30a7.id === _0x5e2ace)) return;
  (writeSceneState(storeInstance, _0x5d469d, (_0x3b9b71) => {
    const _0x3a9478 = finalizeSelectedObjectRemoval(_0x3b9b71, 'camera', _0x5e2ace);
    return (
      (_0x3a9478.cameras = _0x3a9478.cameras.filter((_0x848b69) => _0x848b69.id !== _0x5e2ace)),
      _0x3a9478
    );
  }),
    commit());
}
export function deleteSelectedPanoramaSceneObject({
  nodeId: _0x1677ed,
  storeInstance: storeInstance = appStore,
}) {
  const _0x735d0d = getSceneState(storeInstance, _0x1677ed),
    _0x45b2e2 = collectSelectionObjects(_0x735d0d),
    _0x5507b3 = _0x735d0d.selection.selectedObjectType,
    _0x22d828 = _0x735d0d.selection.selectedObjectId,
    _0x5586a3 =
      _0x735d0d?.viewport?.activeView === 'camera' && _0x735d0d?.viewport?.activeCameraId
        ? String(_0x735d0d.viewport.activeCameraId)
        : null,
    _0x3702de = _0x735d0d.selection.selectedGroupId || null;
  if (_0x3702de) {
    (writeSceneState(storeInstance, _0x1677ed, (_0x525793) => {
      const _0x3f4577 = cloneSceneState(_0x525793),
        _0x22ab53 = (_0x3f4577.groups || []).find((_0x3b9218) => _0x3b9218.id === _0x3702de);
      if (!_0x22ab53) return (clearSelection(_0x3f4577), _0x3f4577);
      const _0x2ab98f = new Set(_0x22ab53.memberIds);
      return (
        (_0x3f4577.mannequins = _0x3f4577.mannequins.filter((_0x61821a) => !_0x2ab98f.has(_0x61821a.id))),
        (_0x3f4577.groups = pruneGroups(_0x3f4577.groups, [..._0x2ab98f]).filter(
          (_0x1cf006) => _0x1cf006.id !== _0x3702de,
        )),
        clearSelection(_0x3f4577),
        _0x3f4577
      );
    }),
      commit());
    return;
  }
  if (_0x45b2e2.length > 1) {
    (writeSceneState(storeInstance, _0x1677ed, (_0x63862e) => {
      const _0xd1bd09 = cloneSceneState(_0x63862e),
        _0xa0d259 = new Set(
          _0x45b2e2
            .filter((_0x5c0a27) => _0x5c0a27.objectType === 'cube')
            .map((_0x4d4f0d) => _0x4d4f0d.objectId),
        ),
        _0x46a538 = new Set(
          _0x45b2e2
            .filter((_0x4510f2) => _0x4510f2.objectType === 'mannequin')
            .map((_0x1f3af0) => _0x1f3af0.objectId),
        );
      _0xa0d259.size > 0 &&
        (_0xd1bd09.cubes = _0xd1bd09.cubes.filter((_0x5b5df4) => !_0xa0d259.has(_0x5b5df4.id)));
      if (_0x46a538.size > 0) {
        const _0x5753dc = [..._0x46a538];
        ((_0xd1bd09.mannequins = _0xd1bd09.mannequins.filter((_0x13484d) => !_0x46a538.has(_0x13484d.id))),
          (_0xd1bd09.groups = pruneGroups(_0xd1bd09.groups, _0x5753dc)));
      }
      return (clearSelection(_0xd1bd09), _0xd1bd09);
    }),
      commit());
    return;
  }
  const _0x5e5446 =
    _0x45b2e2.length === 1
      ? _0x45b2e2[0]
      : _0x5507b3 && _0x22d828
        ? { objectType: _0x5507b3, objectId: _0x22d828 }
        : _0x5586a3
          ? { objectType: 'camera', objectId: _0x5586a3 }
          : null;
  if (!_0x5e5446?.objectType || !_0x5e5446?.objectId) return;
  (writeSceneState(storeInstance, _0x1677ed, (_0x277bc1) => {
    const _0x46ab1d = finalizeSelectedObjectRemoval(_0x277bc1, _0x5e5446.objectType, _0x5e5446.objectId);
    if (_0x5e5446.objectType === 'camera')
      _0x46ab1d.cameras = _0x46ab1d.cameras.filter((_0x3d0068) => _0x3d0068.id !== _0x5e5446.objectId);
    else
      _0x5e5446.objectType === 'cube'
        ? (_0x46ab1d.cubes = _0x46ab1d.cubes.filter((_0x36e7f7) => _0x36e7f7.id !== _0x5e5446.objectId))
        : ((_0x46ab1d.mannequins = _0x46ab1d.mannequins.filter(
            (_0x533359) => _0x533359.id !== _0x5e5446.objectId,
          )),
          (_0x46ab1d.groups = pruneGroups(_0x46ab1d.groups, [_0x5e5446.objectId])));
    return _0x46ab1d;
  }),
    commit());
}
function createCapturePreviewUrl(_0x38546d) {
  const _0x33bdc8 = globalThis.window?.URL || globalThis.URL;
  if (!_0x38546d || typeof _0x33bdc8?.createObjectURL !== 'function') return '';
  try {
    return _0x33bdc8.createObjectURL(_0x38546d);
  } catch {
    return '';
  }
}
function buildSavedCapturePatch(_0x37a59c, _0x1f488c = {}) {
  const _0x359cc1 = pickResultLocalPath(_0x37a59c),
    _0x1b9b6b = localPathToUrl(_0x359cc1) || String(_0x37a59c?.url || '').trim();
  if (!_0x359cc1 || !_0x1b9b6b) throw new Error(panoramaSceneText('capture.saveInvalidPath'));
  const _0x40aad8 = {
      src: _0x1b9b6b,
      localPath: _0x359cc1,
      originalLocalPath: normalizeLocalPath(_0x37a59c?.originalLocalPath || _0x359cc1),
      displayLocalPath: normalizeLocalPath(_0x37a59c?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(_0x37a59c?.thumbLocalPath),
      fileName: _0x37a59c?.filename || _0x1f488c.fileName || '',
      captureSavePending: false,
      captureSaveError: null,
    },
    _0x1dd2db = Number(_0x37a59c?.originalWidth || _0x1f488c.originalWidth || _0x1f488c.width || 0),
    _0x2507ac = Number(_0x37a59c?.originalHeight || _0x1f488c.originalHeight || _0x1f488c.height || 0);
  if (_0x1dd2db > 0) _0x40aad8.originalWidth = _0x1dd2db;
  if (_0x2507ac > 0) _0x40aad8.originalHeight = _0x2507ac;
  return _0x40aad8;
}
export async function capturePanoramaSceneViewport({
  nodeId: _0x2ff06b,
  captureViewport: _0x3fe0bf,
  captureBlob: _0xa79015,
  storeInstance: storeInstance = appStore,
  saveBlob: saveBlob = saveOutputBlob,
  createPreviewUrl: createPreviewUrl = createCapturePreviewUrl,
}) {
  const _0x54cf46 =
    typeof _0xa79015 === 'function' ? _0xa79015 : typeof _0x3fe0bf === 'function' ? _0x3fe0bf : null;
  if (!_0x54cf46) return null;
  const _0x25c4a2 = createNodeActionContext({ storeInstance: storeInstance }),
    _0x6b4262 = getStoreNode(_0x25c4a2.storeInstance, _0x2ff06b);
  if (!_0x6b4262) return null;
  const _0x12e422 = getSceneState(_0x25c4a2.storeInstance, _0x2ff06b);
  if (_0x12e422.capture.pending) return (showWarning(panoramaSceneText('capture.pending')), null);
  writeSceneState(_0x25c4a2.storeInstance, _0x2ff06b, (_0x2f9566) => {
    const _0x1a1375 = cloneSceneState(_0x2f9566);
    return ((_0x1a1375.capture.pending = true), (_0x1a1375.capture.error = null), _0x1a1375);
  });
  try {
    const _0x116421 = await _0x54cf46();
    if (!_0x116421) throw new Error(panoramaSceneText('capture.noImage'));
    const _0xe8deeb = 'scene_capture_' + Date.now() + '.png',
      _0x53bc0f = buildSourceMediaNodePayload({
        id: '__seed__',
        type: 'source-image',
        x: 0,
        y: 0,
        name: panoramaSceneText('capture.nodeName'),
        fileName: _0xe8deeb,
      }),
      _0x9f2d32 = _0x25c4a2.storeInstance.getStateRaw(),
      _0x4378b4 = calcSafeSpawnPosNearNode(
        _0x9f2d32.nodes || {},
        _0x6b4262,
        _0x53bc0f.width,
        _0x53bc0f.height,
      ),
      _0x566647 = generateId('source-image'),
      _0x35e8f5 = createPreviewUrl(_0x116421) || '';
    return (
      _0x25c4a2.storeInstance.batch(() => {
        (writeSceneState(_0x25c4a2.storeInstance, _0x2ff06b, (_0x21e14b) => {
          const _0x3eff45 = cloneSceneState(_0x21e14b);
          return (
            (_0x3eff45.capture.pending = false),
            (_0x3eff45.capture.error = null),
            (_0x3eff45.capture.lastCaptureAt = Date.now()),
            _0x3eff45
          );
        }),
          _0x25c4a2.storeInstance.addNode(
            buildSourceMediaNodePayload({
              id: _0x566647,
              type: 'source-image',
              x: _0x4378b4.x,
              y: _0x4378b4.y,
              name: panoramaSceneText('capture.nodeName'),
              fileName: _0xe8deeb,
              capturePreviewUrl: _0x35e8f5,
              captureSavePending: true,
              captureSaveError: null,
            }),
          ));
      }),
      commit(),
      showSuccess(panoramaSceneText('capture.success')),
      Promise.resolve()
        .then(() => saveBlob(_0x116421, { ext: 'png' }))
        .then((_0x41e0ce) => {
          if (!_0x25c4a2.storeInstance.getStateRaw().nodes?.[_0x566647]) return;
          _0x25c4a2.storeInstance.updateNodeData(
            _0x566647,
            buildSavedCapturePatch(_0x41e0ce, {
              fileName: _0xe8deeb,
              width: _0x53bc0f.width,
              height: _0x53bc0f.height,
            }),
          );
        })
        .catch((_0x57b6e3) => {
          const _0xb38d06 = String(_0x57b6e3?.message || panoramaSceneText('capture.localSaveFailed'));
          (console.warn('[PanoramaScene] save capture failed:', _0x57b6e3),
            _0x25c4a2.storeInstance.getStateRaw().nodes?.[_0x566647] &&
              _0x25c4a2.storeInstance.updateNodeData(_0x566647, {
                captureSavePending: false,
                captureSaveError: _0xb38d06,
              }),
            showWarning(panoramaSceneText('capture.localSaveWarning')));
        }),
      _0x566647
    );
  } catch (_0x4c6d58) {
    const _0x4427db = String(_0x4c6d58?.message || panoramaSceneText('capture.failed'));
    return (
      writeSceneState(_0x25c4a2.storeInstance, _0x2ff06b, (_0xa0c59b) => {
        const _0x1f63c4 = cloneSceneState(_0xa0c59b);
        return ((_0x1f63c4.capture.pending = false), (_0x1f63c4.capture.error = _0x4427db), _0x1f63c4);
      }),
      showError(panoramaSceneText('capture.failedWithError', { error: _0x4427db })),
      null
    );
  }
}
export function renamePanoramaSceneCamera({
  nodeId: _0x25d76e,
  cameraId: _0x2a60cc,
  name: _0x56a1ca,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, _0x25d76e, (_0x452e68) => {
    const _0x2a35dc = cloneSceneState(_0x452e68);
    return (
      (_0x2a35dc.cameras = _0x2a35dc.cameras.map((_0x44157f) =>
        _0x44157f.id === _0x2a60cc
          ? {
              ..._0x44157f,
              name:
                String(_0x56a1ca || _0x44157f.name || panoramaSceneText('camera.fallbackName')).trim() ||
                _0x44157f.name,
            }
          : _0x44157f,
      )),
      _0x2a35dc
    );
  });
}
export function setPanoramaSceneCollapsed({
  nodeId: _0x40b72b,
  isCollapsed: _0x28e912,
  enterEditingOnExpand: enterEditingOnExpand = false,
  storeInstance: storeInstance = appStore,
}) {
  const _0x571e12 = getStoreNode(storeInstance, _0x40b72b);
  if (!_0x571e12) return;
  const _0x11cc57 = typeof _0x28e912 === 'boolean' ? _0x28e912 : _0x571e12.isCollapsed !== true;
  if (_0x11cc57 === (_0x571e12.isCollapsed === true)) return;
  const _0x5d6ae1 = enterEditingOnExpand === true && _0x11cc57 === false,
    _0x230f22 =
      Number(_0x571e12._originalWidth) || Number(_0x571e12.width) || PANORAMA_SCENE_DEFAULT_SIZE.width,
    _0x4615d6 =
      Number(_0x571e12._originalHeight) || Number(_0x571e12.height) || PANORAMA_SCENE_DEFAULT_SIZE.height,
    _0x3441fe = computeCollapsedDimensions(_0x230f22, _0x4615d6);
  (storeInstance.batch(() => {
    (writeSceneState(storeInstance, _0x40b72b, (_0x13f790) => {
      const _0x522225 = cloneSceneState(_0x13f790);
      return ((_0x522225.ui.isEditing = _0x5d6ae1), (_0x522225.ui.showCameraList = false), _0x522225);
    }),
      storeInstance.updateNodeData(_0x40b72b, {
        isCollapsed: _0x11cc57,
        _originalWidth: _0x230f22,
        _originalHeight: _0x4615d6,
        width: _0x11cc57 ? _0x3441fe.width : _0x230f22,
        height: _0x11cc57 ? _0x3441fe.height : _0x4615d6,
      }));
  }),
    commit());
}
export function focusPanoramaSceneSelection({ nodeId: _0x3b16c0, storeInstance: storeInstance = appStore }) {
  const _0x4dd737 = getSceneState(storeInstance, _0x3b16c0),
    _0x4adf36 = getSelectedObject(_0x4dd737);
  if (!_0x4adf36) return false;
  if (_0x4adf36.objectType === 'camera')
    return (
      activatePanoramaSceneCamera({
        nodeId: _0x3b16c0,
        cameraId: _0x4adf36.item.id,
        storeInstance: storeInstance,
      }),
      true
    );
  const _0x51a73b = _0x4adf36.item,
    _0x289df7 = getSceneObjectHeightOffset(_0x4adf36.objectType);
  if (_0x4dd737.mode === 'panorama') {
    const _0x3bf2a9 = (Number(_0x51a73b.position?.y) || 0) + _0x289df7,
      _0x69c25d = Number(_0x51a73b.position?.x) || 0,
      _0x342a0c = _0x3bf2a9 - 1.6,
      _0x40861c = Number(_0x51a73b.position?.z) || 0,
      _0x49a91e = Math.hypot(_0x69c25d, _0x342a0c, _0x40861c) || 1;
    return (
      applyPanoramaSceneViewCommit({
        nodeId: _0x3b16c0,
        panoramaView: {
          ..._0x4dd737.viewport.panoramaView,
          yaw: Math.atan2(_0x69c25d, _0x40861c || 0.0001),
          pitch: clampPanoramaPitch(Math.asin(_0x342a0c / _0x49a91e)),
        },
        activeView: 'default',
        activeCameraId: null,
        storeInstance: storeInstance,
      }),
      true
    );
  }
  return (
    applyPanoramaSceneViewCommit({
      nodeId: _0x3b16c0,
      sceneView: {
        ..._0x4dd737.viewport.sceneView,
        target: {
          x: Number(_0x51a73b.position?.x) || 0,
          y: (Number(_0x51a73b.position?.y) || 0) + _0x289df7,
          z: Number(_0x51a73b.position?.z) || 0,
        },
      },
      activeView: 'default',
      activeCameraId: null,
      storeInstance: storeInstance,
    }),
    true
  );
}
