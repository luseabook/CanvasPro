import appStore from '../../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../../core/math.js';
import {
  clampPanoramaPitch,
  SCENE_DEFAULT_FOCAL_LENGTH_MM,
  cameraPoseToPanoramaView,
  cameraPoseToSceneViewFromReference,
  clampSceneFocalLength,
  computeGridPlacement,
  computePerspectiveFrameDistance,
  resolveBatchPlacementOrigin,
  resolveObjectPlacementPoint,
} from '../../core/panoramaSceneMath.js';
import { buildSourceMediaNodePayload } from '../../services/fileService.js';
import { createFastImagePreview } from '../../services/fastImagePreviewService.js';
import { buildImageNodeStorageFields } from '../../services/imageDerivativeService.js';
import { resolveOutputMediaSize } from '../../services/mediaRatioService.js';
import { ensurePersistedPanoramaInputPng } from '../../services/panoramaInputImageService.js';
import { uploadFile, saveOutputBlob } from '../../services/projectService.js';
import { showError, showSuccess, showWarning } from '../../services/toastService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { t } from '../../i18n/index.js';
import { commit } from '../history.js';
import { resolveImageNodeDisplayUrl, resolveImageNodeOriginalUrl } from '../imageNodeImageUrl.js';
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
import {
  normalizeCameraTimeline,
  removeCameraKeyframe,
  updateCameraTimelineSettings,
  upsertCameraKeyframe,
} from './cameraTimeline.js';
import { estimateSceneAssetBoundingRadius, resolveSceneAsset } from './sceneAssetCatalog.js';
import {
  DEFAULT_MANNEQUIN_POSE_ID,
  createCustomMannequinPose,
  normalizeBonePose,
  normalizeCustomMannequinPose,
  resolveMannequinPose,
} from './poseCatalog.js';
function panoramaSceneText(value, item = {}) {
  return t('panoramaSceneNode.' + value, item);
}
function getStoreNode(store, key) {
  return store?.getStateRaw?.().nodes?.[key] || null;
}
function normalizeSceneStateByNode(index, result) {
  if (isPanorama360NodeType(index?.type)) return normalizePanorama360State(result);
  return normalizeSceneOnlyPanoramaSceneState(result);
}
const EQUIRECTANGULAR_RATIO = 2,
  EQUIRECTANGULAR_RATIO_TOLERANCE = 0.02,
  MANNEQUIN_FORWARD_PLACEMENT_DISTANCE = 3.2,
  CUBE_FORWARD_PLACEMENT_DISTANCE = 3,
  _panorama360SyncVersionByNodeId = new Map(),
  _panorama360SyncInflightByNodeId = new Map();
function isNearEquirectangularRatio(box) {
  const count = Number(box?.width),
    count2 = Number(box?.height);
  if (
    !Number.isFinite(count) ||
    !Number.isFinite(count2) ||
    count <= 0 ||
    count2 <= 0
  )
    return true;
  const data = count / count2;
  return Math.abs(data - EQUIRECTANGULAR_RATIO) <= EQUIRECTANGULAR_RATIO_TOLERANCE;
}
function getSceneState(options, target) {
  const storeNode = getStoreNode(options, target);
  if (!storeNode) return normalizeSceneOnlyPanoramaSceneState(null);
  const panoramaStateFieldByNodeType = getPanoramaStateFieldByNodeType(storeNode.type);
  return normalizeSceneStateByNode(storeNode, panoramaStateFieldByNodeType ? storeNode[panoramaStateFieldByNodeType] : null);
}
function writeSceneState(store2, source, handler) {
  const storeNode2 = getStoreNode(store2, source);
  if (!storeNode2) return null;
  const panoramaStateFieldByNodeType2 = getPanoramaStateFieldByNodeType(storeNode2.type);
  if (!panoramaStateFieldByNodeType2) return null;
  const sceneStateByNode = normalizeSceneStateByNode(storeNode2, storeNode2[panoramaStateFieldByNodeType2]),
    enabled = typeof handler === 'function' ? handler(sceneStateByNode, storeNode2) : handler;
  if (!enabled) return sceneStateByNode;
  const sceneStateByNode2 = normalizeSceneStateByNode(storeNode2, enabled);
  return (store2.updateNodeData(source, { [panoramaStateFieldByNodeType2]: sceneStateByNode2 }), sceneStateByNode2);
}
function cloneSceneState(next) {
  return normalizePanoramaSceneState(next);
}
function pickViewYaw(current) {
  if (Number.isFinite(current?.yaw)) return current.yaw;
  if (Number.isFinite(current?.rotation?.y)) return current.rotation.y;
  return 0;
}
function pickFacingCameraYaw(entry) {
  const viewYaw = pickViewYaw(entry) + Math.PI;
  return Math.atan2(Math.sin(viewYaw), Math.cos(viewYaw));
}
function sanitizeObjectPose(box2 = {}) {
  const record = {
      x: Number.isFinite(box2?.rotation?.x) ? box2.rotation.x : 0,
      y: Number.isFinite(box2?.rotation?.y) ? box2.rotation.y : 0,
      z: Number.isFinite(box2?.rotation?.z) ? box2.rotation.z : 0,
    },
    payload =
      Number.isFinite(Number(box2?.quaternion?.x)) &&
      Number.isFinite(Number(box2?.quaternion?.y)) &&
      Number.isFinite(Number(box2?.quaternion?.z)) &&
      Number.isFinite(Number(box2?.quaternion?.w)),
    quaternion = payload
      ? normalizeQuaternion(box2.quaternion, quaternionFromEulerXYZ(record))
      : null,
    rotation = payload ? eulerFromQuaternionXYZ(quaternion) : record,
    scale = Number.isFinite(box2?.scale)
      ? Math.max(0.01, Number(box2.scale) || 1)
      : box2?.scale &&
          Number.isFinite(box2.scale.x) &&
          Number.isFinite(box2.scale.y) &&
          Number.isFinite(box2.scale.z)
        ? {
            x: Math.max(0.01, Number(box2.scale.x) || 1),
            y: Math.max(0.01, Number(box2.scale.y) || 1),
            z: Math.max(0.01, Number(box2.scale.z) || 1),
          }
        : null;
  return {
    position: {
      x: Number.isFinite(box2?.position?.x) ? box2.position.x : 0,
      y: Number.isFinite(box2?.position?.y) ? box2.position.y : 0,
      z: Number.isFinite(box2?.position?.z) ? box2.position.z : 0,
    },
    rotation: rotation,
    quaternion: quaternion,
    fov: Number.isFinite(box2?.fov) ? box2.fov : 58,
    scale: scale,
  };
}
function normalizeQuaternion(box3, args = { x: 0, y: 0, z: 0, w: 1 }) {
  const x2 = Number(box3?.x),
    y2 = Number(box3?.y),
    z2 = Number(box3?.z),
    w = Number(box3?.w);
  if (
    !Number.isFinite(x2) ||
    !Number.isFinite(y2) ||
    !Number.isFinite(z2) ||
    !Number.isFinite(w)
  )
    return { ...args };
  const count3 = Math.hypot(x2, y2, z2, w);
  if (count3 < 0.000001) return { ...args };
  return {
    x: x2 / count3,
    y: y2 / count3,
    z: z2 / count3,
    w: w / count3,
  };
}
function quaternionFromEulerYXZ(box4) {
  const handle = Number(box4?.x) || 0,
    state = Number(box4?.y) || 0,
    config = Number(box4?.z) || 0,
    y3 = Math.cos(handle / 2),
    scope = Math.cos(state / 2),
    input = Math.cos(config / 2),
    x3 = Math.sin(handle / 2),
    output = Math.sin(state / 2),
    value2 = Math.sin(config / 2);
  return normalizeQuaternion({
    x: x3 * scope * input + y3 * output * value2,
    y: y3 * output * input - x3 * scope * value2,
    z: y3 * scope * value2 - x3 * output * input,
    w: y3 * scope * input + x3 * output * value2,
  });
}
function eulerFromQuaternionYXZ(value3) {
  const box5 = normalizeQuaternion(value3),
    value4 = box5.x * box5.x,
    value5 = box5.y * box5.y,
    value6 = box5.z * box5.z,
    value7 = box5.x * box5.y,
    value8 = box5.x * box5.z,
    value9 = box5.y * box5.z,
    value10 = box5.x * box5.w,
    value11 = box5.y * box5.w,
    value12 = box5.z * box5.w,
    value13 = 1 - 2 * (value5 + value6),
    value14 = 2 * (value8 + value11),
    value15 = 2 * (value7 + value12),
    value16 = 1 - 2 * (value4 + value6),
    value17 = 2 * (value9 - value10),
    value18 = 2 * (value8 - value11),
    value19 = 1 - 2 * (value4 + value5),
    x4 = Math.asin(-clamp(value17, -1, 1));
  if (Math.abs(value17) < 0.9999999)
    return { x: x4, y: Math.atan2(value14, value19), z: Math.atan2(value15, value16) };
  return { x: x4, y: Math.atan2(-value18, value13), z: 0 };
}
function quaternionFromEulerXYZ(box6) {
  const value20 = Number(box6?.x) || 0,
    value21 = Number(box6?.y) || 0,
    value22 = Number(box6?.z) || 0,
    y4 = Math.cos(value20 / 2),
    value23 = Math.cos(value21 / 2),
    value24 = Math.cos(value22 / 2),
    x5 = Math.sin(value20 / 2),
    value25 = Math.sin(value21 / 2),
    value26 = Math.sin(value22 / 2);
  return normalizeQuaternion({
    x: x5 * value23 * value24 + y4 * value25 * value26,
    y: y4 * value25 * value24 - x5 * value23 * value26,
    z: y4 * value23 * value26 + x5 * value25 * value24,
    w: y4 * value23 * value24 - x5 * value25 * value26,
  });
}
function eulerFromQuaternionXYZ(value27) {
  const box7 = normalizeQuaternion(value27),
    value28 = box7.x * box7.x,
    value29 = box7.y * box7.y,
    value30 = box7.z * box7.z,
    value31 = box7.x * box7.y,
    value32 = box7.x * box7.z,
    value33 = box7.y * box7.z,
    value34 = box7.x * box7.w,
    value35 = box7.y * box7.w,
    value36 = box7.z * box7.w,
    value37 = 1 - 2 * (value29 + value30),
    value38 = 2 * (value31 - value36),
    value39 = 2 * (value32 + value35),
    value40 = 2 * (value33 - value34),
    value41 = 1 - 2 * (value28 + value29),
    value42 = 2 * (value33 + value34),
    value43 = 1 - 2 * (value28 + value30),
    y5 = Math.asin(clamp(value39, -1, 1));
  if (Math.abs(value39) < 0.9999999)
    return { x: Math.atan2(-value40, value41), y: y5, z: Math.atan2(-value38, value37) };
  return { x: Math.atan2(value42, value43), y: y5, z: 0 };
}
function sanitizeCameraPose(options2 = {}) {
  const position = {
      x: Number.isFinite(options2?.position?.x) ? options2.position.x : 0,
      y: Number.isFinite(options2?.position?.y) ? options2.position.y : 0,
      z: Number.isFinite(options2?.position?.z) ? options2.position.z : 0,
    },
    value44 = {
      x: Number.isFinite(options2?.rotation?.x) ? options2.rotation.x : 0,
      y: Number.isFinite(options2?.rotation?.y) ? options2.rotation.y : 0,
      z: Number.isFinite(options2?.rotation?.z) ? options2.rotation.z : 0,
    },
    value45 =
      Number.isFinite(Number(options2?.quaternion?.x)) &&
      Number.isFinite(Number(options2?.quaternion?.y)) &&
      Number.isFinite(Number(options2?.quaternion?.z)) &&
      Number.isFinite(Number(options2?.quaternion?.w)),
    quaternion2 = value45
      ? normalizeQuaternion(options2.quaternion, quaternionFromEulerYXZ(value44))
      : quaternionFromEulerYXZ(value44),
    rotation2 = value45 ? eulerFromQuaternionYXZ(quaternion2) : value44;
  return {
    position: position,
    rotation: rotation2,
    quaternion: quaternion2,
    focalLength: Object.prototype.hasOwnProperty.call(options2 || {}, 'focalLength')
      ? clampSceneFocalLength(options2.focalLength)
      : Object.prototype.hasOwnProperty.call(options2 || {}, 'fov')
        ? SCENE_DEFAULT_FOCAL_LENGTH_MM
        : SCENE_DEFAULT_FOCAL_LENGTH_MM,
  };
}
function normalizeCameraSlot(value46) {
  const count4 = Number(value46);
  if (!Number.isInteger(count4)) return null;
  if (count4 < 1 || count4 > PANORAMA_SCENE_CAMERA_LIMIT) return null;
  return count4;
}
function toCameraSlotLabel(value47) {
  return String(Number(value47) || 1);
}
function resolveCameraSlotEntries(list = []) {
  const list2 = Array.isArray(list) ? list : [],
    map = new Set(),
    list3 = [];
  list2.forEach((camera) => {
    const slot = normalizeCameraSlot(camera?.slot);
    if (!slot || map.has(slot)) return;
    (map.add(slot), list3.push({ camera: camera, slot: slot }));
  });
  const run = () => {
    for (let value48 = 1; value48 <= PANORAMA_SCENE_CAMERA_LIMIT; value48 += 1) {
      if (!map.has(value48)) return (map.add(value48), value48);
    }
    return null;
  };
  return (
    list2.forEach((camera2) => {
      if (list3.some((value49) => value49.camera?.id === camera2?.id)) return;
      const slot2 = run();
      if (!slot2) return;
      list3.push({ camera: camera2, slot: slot2 });
    }),
    list3.sort((value50, value51) => value50.slot - value51.slot)
  );
}
function resolveFirstFreeCameraSlot(list4 = []) {
  const map2 = new Set(resolveCameraSlotEntries(list4).map((value52) => value52.slot));
  for (let value53 = 1; value53 <= PANORAMA_SCENE_CAMERA_LIMIT; value53 += 1) {
    if (!map2.has(value53)) return value53;
  }
  return null;
}
function resolveCameraBySlot(list5 = [], value54) {
  const cameraSlot = normalizeCameraSlot(value54);
  if (!cameraSlot) return null;
  const camera3 = resolveCameraSlotEntries(list5).find(
    (value55) => value55.slot === cameraSlot,
  );
  return camera3 ? { camera: camera3.camera, slot: camera3.slot } : null;
}
function normalizeScaleVector(box8, value56 = 1) {
  if (Number.isFinite(box8)) {
    const x6 = Math.max(0.01, Number(box8) || Number(value56) || 1);
    return { x: x6, y: x6, z: x6 };
  }
  if (
    box8 &&
    Number.isFinite(box8.x) &&
    Number.isFinite(box8.y) &&
    Number.isFinite(box8.z)
  )
    return {
      x: Math.max(0.01, Number(box8.x) || 1),
      y: Math.max(0.01, Number(box8.y) || 1),
      z: Math.max(0.01, Number(box8.z) || 1),
    };
  const x7 = Math.max(0.01, Number(value56) || 1);
  return { x: x7, y: x7, z: x7 };
}
function composeCompatibleScale(value57, value58 = 1) {
  if (value57 == null) return value58;
  if (Number.isFinite(value57)) return Math.max(0.01, Math.min(8, Number(value57) || 1));
  const box9 = normalizeScaleVector(value57, value58),
    value59 = 0.0001;
  if (
    Math.abs(box9.x - box9.y) < value59 &&
    Math.abs(box9.y - box9.z) < value59
  )
    return Math.max(0.01, Math.min(8, (box9.x + box9.y + box9.z) / 3));
  return {
    x: Math.max(0.01, Math.min(8, box9.x)),
    y: Math.max(0.01, Math.min(8, box9.y)),
    z: Math.max(0.01, Math.min(8, box9.z)),
  };
}
function clamp(value60, value61, value62) {
  return Math.min(value62, Math.max(value61, value60));
}
function computeCollapsedDimensions(value63, value64) {
  const value65 = Math.max(180, Number(value63) || PANORAMA_SCENE_DEFAULT_SIZE.width),
    value66 = Math.max(140, Number(value64) || PANORAMA_SCENE_DEFAULT_SIZE.height),
    value67 = Math.min(value65, value66),
    value68 =
      value67 > PANORAMA_SCENE_COLLAPSED_MAX_SIZE ? PANORAMA_SCENE_COLLAPSED_MAX_SIZE / value67 : 1;
  return { width: Math.round(value65 * value68), height: Math.round(value66 * value68) };
}
function getSelectedObject(value69) {
  const { selectedObjectType: selectedObjectType, selectedObjectId: selectedObjectId } = value69?.selection || {};
  if (!selectedObjectType || !selectedObjectId) return null;
  const list6 = getSceneObjectList(value69, selectedObjectType),
    item2 = list6.find((value70) => value70.id === selectedObjectId) || null;
  if (!item2) return null;
  return { objectType: selectedObjectType, item: item2 };
}
function getSceneObjectList(value71, value72) {
  if (value72 === 'camera') return Array.isArray(value71?.cameras) ? value71.cameras : [];
  if (value72 === 'cube') return Array.isArray(value71?.cubes) ? value71.cubes : [];
  return Array.isArray(value71?.mannequins) ? value71.mannequins : [];
}
function getSceneObjectHeightOffset(value73) {
  if (value73 === 'cube') return 0;
  if (value73 === 'mannequin') return 1.1;
  return 0;
}
function getSelectionPoolByType(value74, value75) {
  if (value75 === 'cube') return Array.isArray(value74?.cubes) ? value74.cubes : [];
  if (value75 === 'mannequin')
    return Array.isArray(value74?.mannequins) ? value74.mannequins : [];
  return [];
}
function normalizeSelectionObjectsInput(value76, value77 = []) {
  const map3 = new Set(),
    list7 = [],
    list8 = Array.isArray(value77) ? value77 : [];
  return (
    list8.forEach((value78) => {
      const objectType =
          value78?.objectType === 'cube' || value78?.objectType === 'mannequin'
            ? value78.objectType
            : null,
        objectId = String(value78?.objectId || '').trim();
      if (!objectType || !objectId) return;
      const selectionPoolByType = getSelectionPoolByType(value76, objectType).some(
        (value79) => value79.id === objectId,
      );
      if (!selectionPoolByType) return;
      const value80 = objectType + ':' + objectId;
      if (map3.has(value80)) return;
      (map3.add(value80), list7.push({ objectType: objectType, objectId: objectId }));
    }),
    list7
  );
}
function collectSelectionObjects(value81) {
  const list9 = normalizeSelectionObjectsInput(
    value81,
    value81?.selection?.selectedObjects || [],
  );
  if (list9.length > 0) return list9;
  const objectType2 =
    value81?.selection?.selectedObjectType === 'cube' ||
    value81?.selection?.selectedObjectType === 'mannequin'
      ? value81.selection.selectedObjectType
      : null;
  if (!objectType2) return [];
  const list10 = Array.isArray(value81?.selection?.selectedObjectIds)
    ? value81.selection.selectedObjectIds
    : value81?.selection?.selectedObjectId
      ? [value81.selection.selectedObjectId]
      : [];
  return normalizeSelectionObjectsInput(
    value81,
    list10.map((objectId2) => ({ objectType: objectType2, objectId: objectId2 })),
  );
}
function clearSelection(value82) {
  ((value82.selection.selectedObjectType = null),
    (value82.selection.selectedObjectId = null),
    (value82.selection.selectedObjectIds = []),
    (value82.selection.selectedObjects = []),
    (value82.selection.selectedGroupId = null));
}
function setSelectionFromObjects(
  value83,
  value84,
  {
    preferredGroupId: preferredGroupId = null,
    preferredActiveType: preferredActiveType = null,
    preferredActiveId: preferredActiveId = null,
  } = {},
) {
  const list11 = normalizeSelectionObjectsInput(value83, value84);
  if (list11.length === 0) {
    clearSelection(value83);
    return;
  }
  const value85 = preferredGroupId ? String(preferredGroupId) : null;
  if (value85) {
    const args2 = (value83.groups || []).find((value86) => value86.id === value85);
    if (args2) {
      const list12 = list11.filter((value87) => value87.objectType === 'mannequin').map(
          (value88) => value88.objectId,
        ),
        map4 = new Set(list12),
        value89 =
          list11.every((value90) => value90.objectType === 'mannequin') &&
          args2.memberIds.length > 0 &&
          args2.memberIds.length === list12.length &&
          args2.memberIds.every((value91) => map4.has(value91));
      if (value89) {
        ((value83.selection.selectedObjectType = 'mannequin'),
          (value83.selection.selectedObjectId = args2.memberIds[0] || null),
          (value83.selection.selectedObjectIds = [...args2.memberIds]),
          (value83.selection.selectedObjects = args2.memberIds.map((objectId3) => ({
            objectType: 'mannequin',
            objectId: objectId3,
          }))),
          (value83.selection.selectedGroupId = value85));
        return;
      }
    }
  }
  const value92 =
      preferredActiveType === 'cube' || preferredActiveType === 'mannequin' ? preferredActiveType : null,
    value93 =
      value92 && list11.some((value94) => value94.objectType === value92)
        ? value92
        : list11[0].objectType,
    value95 = list11.filter((value96) => value96.objectType === value93).map(
      (value97) => value97.objectId,
    ),
    value98 =
      preferredActiveId &&
      list11.some(
        (value99) => value99.objectType === value93 && value99.objectId === preferredActiveId,
      )
        ? preferredActiveId
        : value95[0] || null;
  ((value83.selection.selectedObjectType = value93),
    (value83.selection.selectedObjectId = value98),
    (value83.selection.selectedObjectIds = value95),
    (value83.selection.selectedObjects = list11),
    (value83.selection.selectedGroupId = null));
}
function setSingleSelection(value100, objectType3, objectId4) {
  setSelectionFromObjects(
    value100,
    objectType3 && objectId4 ? [{ objectType: objectType3, objectId: objectId4 }] : [],
    { preferredActiveType: objectType3, preferredActiveId: objectId4 || null },
  );
}
function finalizeSelectedObjectRemoval(value101, value102, value103) {
  const preferredActiveType2 = cloneSceneState(value101),
    selectionObjects = collectSelectionObjects(preferredActiveType2).filter(
      (value104) => !(value104.objectType === value102 && value104.objectId === value103),
    );
  return (
    setSelectionFromObjects(preferredActiveType2, selectionObjects, {
      preferredActiveType: preferredActiveType2?.selection?.selectedObjectType || null,
      preferredActiveId: preferredActiveType2?.selection?.selectedObjectId || null,
      preferredGroupId: preferredActiveType2?.selection?.selectedGroupId || null,
    }),
    value102 === 'camera' &&
      preferredActiveType2.viewport.activeCameraId === value103 &&
      ((preferredActiveType2.viewport.activeCameraId = null), (preferredActiveType2.viewport.activeView = 'default')),
    preferredActiveType2
  );
}
function pruneGroups(list13, list14 = []) {
  if (!Array.isArray(list13)) return [];
  if (!Array.isArray(list14) || list14.length === 0) return list13;
  const map5 = new Set(list14);
  return list13.map((args3) => ({
    ...args3,
    memberIds: Array.isArray(args3.memberIds)
      ? args3.memberIds.filter((value105) => !map5.has(value105))
      : [],
  })).filter((value106) => value106.memberIds.length > 0);
}
function resolveGroupByMember(value107, value108, enabled2) {
  if (value108 !== 'mannequin' || !enabled2) return null;
  const list15 = Array.isArray(value107?.groups) ? value107.groups : [];
  return list15.find((value109) => value109.memberIds?.includes(enabled2)) || null;
}
function createNodeActionContext(storeInstance2 = {}) {
  return {
    storeInstance: storeInstance2.storeInstance || appStore,
    getCurrentProjectId:
      storeInstance2.getCurrentProjectId || (() => window.currentProjectId || 'default_v2_project'),
  };
}
const DEFAULT_NODE_SPAWN_SPACING = 120,
  PANORAMA_360_IMAGE_SOURCE_TYPES = new Set(['source-image', 'ai-image', 'image']);
function resolveNodeSpawnSpacing() {
  const value110 = Number(globalThis?.window?.v2NodeSpacing);
  return Number.isFinite(value110) ? Math.max(0, value110) : DEFAULT_NODE_SPAWN_SPACING;
}
function shouldAvoidNodeOverlap() {
  return globalThis?.window?.v2NodeAvoidOverlap !== false;
}
function isPanorama360IncomingImageSourceType(value111) {
  return PANORAMA_360_IMAGE_SOURCE_TYPES.has(String(value111 || '').trim());
}
function pickFirstNonEmptyString(...args4) {
  for (const value112 of args4) {
    const value113 = String(value112 || '').trim();
    if (value113) return value113;
  }
  return '';
}
function inferFileNameFromPath(value114) {
  const enabled3 = String(value114 || '').trim();
  if (!enabled3) return '';
  const value115 = enabled3.split('?')[0].split('#')[0],
    list16 = value115.split(/[\\/]/).filter(Boolean);
  return list16.length > 0 ? list16[list16.length - 1] : '';
}
function resolveMainImageEntry(value116) {
  const list17 = Array.isArray(value116?.images) ? value116.images : [];
  if (list17.length <= 0) return null;
  const value117 = Number(value116?.mainImageIndex),
    value118 = Number.isFinite(value117)
      ? Math.max(0, Math.min(list17.length - 1, Math.trunc(value117)))
      : 0;
  return list17[value118] || list17[0] || null;
}
function resolveMainImageIndex(value119) {
  const list18 = Array.isArray(value119?.images) ? value119.images : [];
  if (list18.length <= 0) return 0;
  const value120 = Number(value119?.mainImageIndex);
  if (!Number.isFinite(value120)) return 0;
  return Math.max(0, Math.min(list18.length - 1, Math.trunc(value120)));
}
function resolvePanoramaThumbnailUrl(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return '';
  return pickFirstNonEmptyString(
    localPathToUrl(enabled4.thumbLocalPath),
    localPathToUrl(enabled4.thumbnailLocalPath),
    enabled4.thumbUrl,
    enabled4.thumbnailUrl,
  );
}
function resolvePanoramaImagePayloadFromSourceNode(enabled5) {
  if (!enabled5 || !isPanorama360IncomingImageSourceType(enabled5.type)) return null;
  const mainImageEntry = resolveMainImageEntry(enabled5),
    localPath = pickFirstNonEmptyString(
      mainImageEntry?.originalLocalPath,
      mainImageEntry?.localPath,
      enabled5.originalLocalPath,
      enabled5.localPath,
    ),
    imageUrl = pickFirstNonEmptyString(
      resolveImageNodeOriginalUrl(mainImageEntry || {}),
      resolveImageNodeOriginalUrl(enabled5),
    ),
    previewImageUrl = pickFirstNonEmptyString(
      resolvePanoramaThumbnailUrl(mainImageEntry),
      resolvePanoramaThumbnailUrl(enabled5),
      resolveImageNodeDisplayUrl(mainImageEntry || {}),
      resolveImageNodeDisplayUrl(enabled5),
      imageUrl,
    );
  if (!localPath && !imageUrl) return null;
  const fileName = pickFirstNonEmptyString(
    mainImageEntry?.fileName,
    enabled5.fileName,
    inferFileNameFromPath(localPath),
    inferFileNameFromPath(imageUrl),
  );
  return {
    localPath: localPath || null,
    imageUrl: imageUrl || null,
    previewImageUrl: previewImageUrl || null,
    fileName: fileName || null,
    mainImageIndex: resolveMainImageIndex(enabled5),
  };
}
function buildPanoramaSourceSignature(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object') return '';
  return JSON.stringify({
    localPath: String(enabled6.localPath || '').trim(),
    imageUrl: String(enabled6.imageUrl || '').trim(),
    fileName: String(enabled6.fileName || '').trim(),
    mainImageIndex: Number(enabled6.mainImageIndex || 0) || 0,
  });
}
function hasPersistentPanoramaLocalPath(value121) {
  const enabled7 = String(value121 || '').trim();
  if (!enabled7) return false;
  return !/^(blob:|data:|https?:)/i.test(enabled7);
}
function bumpPanorama360SyncVersion(value122) {
  const value123 = String(value122 || '').trim(),
    value124 = Number(_panorama360SyncVersionByNodeId.get(value123) || 0) + 1;
  return (_panorama360SyncVersionByNodeId.set(value123, value124), value124);
}
function isPanorama360SyncCurrent(value125, value126) {
  return (
    Number(_panorama360SyncVersionByNodeId.get(String(value125 || '').trim()) || 0) ===
    Number(value126 || 0)
  );
}
function getPanoramaIncomingEdgeSortValue(value127) {
  const count5 = Number(value127?.createdAt);
  if (Number.isFinite(count5) && count5 > 0) return count5;
  const count6 = Number(value127?.updatedAt);
  if (Number.isFinite(count6) && count6 > 0) return count6;
  return 0;
}
function comparePanoramaIncomingCandidatesDesc(value128, value129) {
  const panoramaIncomingEdgeSortValue =
    getPanoramaIncomingEdgeSortValue(value129.edge) - getPanoramaIncomingEdgeSortValue(value128.edge);
  if (panoramaIncomingEdgeSortValue !== 0) return panoramaIncomingEdgeSortValue;
  return String(value129.edge?.id || '').localeCompare(String(value128.edge?.id || ''));
}
function buildPanoramaUploadSourceNodeData({
  storeInstance: storeInstance3,
  anchorNode: anchorNode,
  localPath: localPath2,
  imageUrl: imageUrl2,
  fileName: fileName2,
  uploadedSize: uploadedSize,
  imageStorageFields: imageStorageFields,
}) {
  if (!storeInstance3 || !anchorNode) return null;
  const naturalWidth = Number(uploadedSize?.width),
    naturalHeight = Number(uploadedSize?.height),
    box10 = buildSourceMediaNodePayload({
      id: '__seed__',
      type: 'source-image',
      x: 0,
      y: 0,
      src: imageUrl2 || '',
      localPath: localPath2 || '',
      ...(imageStorageFields || {}),
      fileName: fileName2 || '',
      ...(naturalWidth > 0 && naturalHeight > 0 ? { naturalWidth: naturalWidth, naturalHeight: naturalHeight } : null),
    }),
    nodeSpawnSpacing = resolveNodeSpawnSpacing(),
    value130 = Number(anchorNode.x) || 0,
    value131 = Number(anchorNode.y) || 0,
    value132 = Number(anchorNode.height) || box10.height,
    x8 = value130 - box10.width - nodeSpawnSpacing,
    y6 = value131 + Math.round((value132 - box10.height) / 2),
    value133 = storeInstance3.getStateRaw?.().nodes || {},
    x9 = shouldAvoidNodeOverlap()
      ? findAvailablePosition(
          value133,
          x8,
          y6,
          box10.width,
          box10.height,
          nodeSpawnSpacing,
          'left',
        )
      : { x: x8, y: y6 };
  return { ...box10, id: generateId('source-image'), x: x9.x, y: x9.y };
}
export function setPanoramaSceneMode({
  nodeId: nodeId,
  mode: mode,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId, (value134, value135) => {
    const cloneSceneState2 = cloneSceneState(value134);
    return (
      (cloneSceneState2.mode = isPanorama360NodeType(value135?.type) ? 'panorama' : 'scene'),
      (cloneSceneState2.viewport.activeView = 'default'),
      (cloneSceneState2.viewport.activeCameraId = null),
      cloneSceneState2
    );
  });
}
export function setPanoramaSceneEnvironmentMode({
  nodeId: nodeId2,
  environmentMode: environmentMode2,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId2, (value136) => {
    const cloneSceneState3 = cloneSceneState(value136);
    return ((cloneSceneState3.environmentMode = environmentMode2 === 'night' ? 'night' : 'day'), cloneSceneState3);
  });
}
export function setPanoramaSceneTool({
  nodeId: nodeId3,
  tool: tool,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId3, (value137) => {
    const cloneSceneState4 = cloneSceneState(value137),
      value138 =
        tool === 'move' || tool === 'rotate' || tool === 'scale' || tool === 'box-select'
          ? tool
          : 'navigate';
    return (
      value138 === 'box-select' || value138 === 'navigate'
        ? (cloneSceneState4.ui.mouseTool = value138)
        : (cloneSceneState4.ui.transformTool = value138),
      (cloneSceneState4.ui.activeTool = value138),
      cloneSceneState4
    );
  });
}
export function setPanoramaSceneTransformSpace({
  nodeId: nodeId4,
  transformSpace: transformSpace,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId4, (value139) => {
    const cloneSceneState5 = cloneSceneState(value139);
    return ((cloneSceneState5.ui.transformSpace = transformSpace === 'local' ? 'local' : 'world'), cloneSceneState5);
  });
}
export function setPanoramaScenePivotMode({
  nodeId: nodeId5,
  pivotMode: pivotMode,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId5, (value140) => {
    const cloneSceneState6 = cloneSceneState(value140);
    return ((cloneSceneState6.ui.pivotMode = pivotMode === 'center' ? 'center' : 'active'), cloneSceneState6);
  });
}
export function setPanoramaSceneNavigationPreset({
  nodeId: nodeId6,
  navigationPreset: navigationPreset,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId6, (value141) => {
    const cloneSceneState7 = cloneSceneState(value141);
    return ((cloneSceneState7.ui.navigationPreset = navigationPreset === 'dcc' ? 'dcc' : 'dcc'), cloneSceneState7);
  });
}
export function setPanoramaSceneInteractionOptions({
  nodeId: nodeId7,
  patch: patch = {},
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId7, (value142) => {
    const cloneSceneState8 = cloneSceneState(value142);
    return (
      Object.prototype.hasOwnProperty.call(patch, 'transformSpace') &&
        (cloneSceneState8.ui.transformSpace = patch.transformSpace === 'local' ? 'local' : 'world'),
      Object.prototype.hasOwnProperty.call(patch, 'snapEnabled') &&
        (cloneSceneState8.ui.snapEnabled = patch.snapEnabled === true),
      Number.isFinite(Number(patch.translationSnap)) &&
        (cloneSceneState8.ui.translationSnap = Number(patch.translationSnap)),
      Number.isFinite(Number(patch.rotationSnap)) &&
        (cloneSceneState8.ui.rotationSnap = Number(patch.rotationSnap)),
      Number.isFinite(Number(patch.scaleSnap)) &&
        (cloneSceneState8.ui.scaleSnap = Number(patch.scaleSnap)),
      Object.prototype.hasOwnProperty.call(patch, 'groundLock') &&
        (cloneSceneState8.ui.groundLock = patch.groundLock === true),
      Object.prototype.hasOwnProperty.call(patch, 'uniformScale') &&
        (cloneSceneState8.ui.uniformScale = patch.uniformScale === true),
      Object.prototype.hasOwnProperty.call(patch, 'navigationMode') &&
        (cloneSceneState8.ui.navigationMode = patch.navigationMode === 'fly' ? 'fly' : 'orbit'),
      Number.isFinite(Number(patch.flySpeed)) &&
        (cloneSceneState8.ui.flySpeed = Math.max(0.25, Math.min(40, Number(patch.flySpeed)))),
      Object.prototype.hasOwnProperty.call(patch, 'showTimeline') &&
        (cloneSceneState8.ui.showTimeline = patch.showTimeline === true),
      cloneSceneState8
    );
  });
}
export function setPanoramaSceneEditing({
  nodeId: nodeId8,
  isEditing: isEditing,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId8, (value143) => {
    const cloneSceneState9 = cloneSceneState(value143);
    return (
      (cloneSceneState9.ui.isEditing = isEditing === true),
      !cloneSceneState9.ui.isEditing && (cloneSceneState9.ui.showCameraList = false),
      cloneSceneState9
    );
  });
}
export function setPanoramaSceneSelection({
  nodeId: nodeId9,
  objectType: objectType4,
  objectId: objectId5,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId9, (value144) => {
    const cloneSceneState10 = cloneSceneState(value144);
    if (objectType4 === 'camera') return cloneSceneState10;
    const objectType5 = objectType4 === 'mannequin' || objectType4 === 'cube' ? objectType4 : null,
      preferredActiveId2 = objectId5 ? String(objectId5) : null;
    if (!objectType5 || !preferredActiveId2) return (clearSelection(cloneSceneState10), cloneSceneState10);
    const preferredGroupId2 = resolveGroupByMember(cloneSceneState10, objectType5, preferredActiveId2);
    if (preferredGroupId2)
      return (
        setSelectionFromObjects(
          cloneSceneState10,
          preferredGroupId2.memberIds.map((objectId6) => ({ objectType: 'mannequin', objectId: objectId6 })),
          {
            preferredGroupId: preferredGroupId2.id,
            preferredActiveType: 'mannequin',
            preferredActiveId: preferredActiveId2,
          },
        ),
        cloneSceneState10
      );
    return (
      setSelectionFromObjects(cloneSceneState10, [{ objectType: objectType5, objectId: preferredActiveId2 }], {
        preferredActiveType: objectType5,
        preferredActiveId: preferredActiveId2,
      }),
      cloneSceneState10
    );
  });
}
export function setPanoramaSceneSelectionBatch({
  nodeId: nodeId10,
  objectType: objectType6,
  objectIds: objectIds = [],
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId10, (value145) => {
    const cloneSceneState11 = cloneSceneState(value145);
    if (objectType6 === 'camera') return cloneSceneState11;
    const objectType7 = objectType6 === 'mannequin' || objectType6 === 'cube' ? objectType6 : null,
      preferredActiveId3 = [
        ...new Set(
          (Array.isArray(objectIds) ? objectIds : [])
            .map((value146) => String(value146 || '').trim())
            .filter(Boolean),
        ),
      ];
    if (!objectType7 || preferredActiveId3.length === 0) return (clearSelection(cloneSceneState11), cloneSceneState11);
    let preferredGroupId3 = groupId ? String(groupId) : null;
    if (preferredGroupId3) {
      const preferredActiveId4 = (cloneSceneState11.groups || []).find((value147) => value147.id === preferredGroupId3);
      if (!preferredActiveId4) preferredGroupId3 = null;
      else
        return (
          setSelectionFromObjects(
            cloneSceneState11,
            preferredActiveId4.memberIds.map((objectId7) => ({ objectType: 'mannequin', objectId: objectId7 })),
            {
              preferredGroupId: preferredGroupId3,
              preferredActiveType: 'mannequin',
              preferredActiveId: preferredActiveId4.memberIds[0] || null,
            },
          ),
          cloneSceneState11
        );
    }
    return (
      setSelectionFromObjects(
        cloneSceneState11,
        preferredActiveId3.map((objectId8) => ({ objectType: objectType7, objectId: objectId8 })),
        { preferredActiveType: objectType7, preferredActiveId: preferredActiveId3[0] || null },
      ),
      cloneSceneState11
    );
  });
}
export function setPanoramaSceneSelectionObjects({
  nodeId: nodeId11,
  objects: objects = [],
  activeObjectType: activeObjectType = null,
  activeObjectId: activeObjectId = null,
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId11, (value148) => {
    const cloneSceneState12 = cloneSceneState(value148);
    return (
      setSelectionFromObjects(cloneSceneState12, objects, {
        preferredGroupId: groupId,
        preferredActiveType: activeObjectType,
        preferredActiveId: activeObjectId,
      }),
      cloneSceneState12
    );
  });
}
export function clearPanoramaSceneSelection({ nodeId: nodeId12, storeInstance: storeInstance = appStore }) {
  setPanoramaSceneSelection({
    nodeId: nodeId12,
    objectType: null,
    objectId: null,
    storeInstance: storeInstance,
  });
}
export function setPanoramaSceneCameraListVisible({
  nodeId: nodeId13,
  visible: visible,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId13, (value149) => {
    const cloneSceneState13 = cloneSceneState(value149);
    return ((cloneSceneState13.ui.showCameraList = visible === true), cloneSceneState13);
  });
}
export function setPanoramaSceneGridPlacement({
  nodeId: nodeId14,
  patch: patch2,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId14, (value150) => {
    const args5 = cloneSceneState(value150);
    return (
      (args5.gridPlacement = { ...args5.gridPlacement, ...(patch2 || {}) }),
      normalizePanoramaSceneState(args5)
    );
  });
}
export function resetPanoramaSceneView({ nodeId: nodeId15, storeInstance: storeInstance = appStore }) {
  writeSceneState(storeInstance, nodeId15, (value151) => {
    const cloneSceneState14 = cloneSceneState(value151);
    return (
      (cloneSceneState14.viewport.activeView = 'default'),
      (cloneSceneState14.viewport.activeCameraId = null),
      cloneSceneState14.mode === 'panorama'
        ? (cloneSceneState14.viewport.panoramaView = createDefaultPanoramaView())
        : (cloneSceneState14.viewport.sceneView = createDefaultSceneView()),
      cloneSceneState14
    );
  });
}
export function applyPanoramaSceneViewCommit({
  nodeId: nodeId16,
  sceneView: sceneView,
  panoramaView: panoramaView,
  activeView: activeView = 'default',
  activeCameraId: activeCameraId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId16, (value152) => {
    const args6 = cloneSceneState(value152);
    return (
      (args6.viewport.activeView = activeView === 'camera' ? 'camera' : 'default'),
      (args6.viewport.activeCameraId =
        args6.viewport.activeView === 'camera' && activeCameraId ? String(activeCameraId) : null),
      sceneView &&
        (args6.viewport.sceneView = { ...args6.viewport.sceneView, ...sceneView }),
      panoramaView &&
        (args6.viewport.panoramaView = { ...args6.viewport.panoramaView, ...panoramaView }),
      normalizePanoramaSceneState(args6)
    );
  });
}
export function activatePanoramaSceneCamera({
  nodeId: nodeId17,
  cameraId: cameraId,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode3 = getStoreNode(storeInstance, nodeId17);
  if (isPanorama360NodeType(storeNode3?.type)) return;
  writeSceneState(storeInstance, nodeId17, (value153) => {
    const cloneSceneState15 = cloneSceneState(value153),
      enabled8 = cloneSceneState15.cameras.find((value154) => value154.id === cameraId) || null;
    if (!enabled8) return cloneSceneState15;
    return (
      cloneSceneState15.mode === 'panorama'
        ? ((cloneSceneState15.viewport.activeView = 'camera'),
          (cloneSceneState15.viewport.activeCameraId = String(cameraId)),
          (cloneSceneState15.viewport.panoramaView = cameraPoseToPanoramaView(enabled8)))
        : ((cloneSceneState15.viewport.activeView = 'default'),
          (cloneSceneState15.viewport.activeCameraId = null),
          (cloneSceneState15.viewport.sceneView = cameraPoseToSceneViewFromReference(
            enabled8,
            cloneSceneState15.viewport.sceneView || createDefaultSceneView(),
          ))),
      cloneSceneState15
    );
  });
}
export function setPanoramaSceneCaptureMode({
  nodeId: nodeId18,
  mode: mode2,
  showSafeFrame: showSafeFrame = true,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId18, (value155) => {
    const cloneSceneState16 = cloneSceneState(value155),
      value156 = mode2 === '9:16' || mode2 === '2.35:1' ? mode2 : 'adaptive';
    return (
      (cloneSceneState16.capture.mode = value156),
      (cloneSceneState16.capture.showSafeFrame = value156 === 'adaptive' ? false : showSafeFrame === true),
      normalizePanoramaSceneState(cloneSceneState16)
    );
  });
}
export function setPanoramaSceneSafeFrameVisible({
  nodeId: nodeId19,
  visible: visible2,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId19, (value157) => {
    const cloneSceneState17 = cloneSceneState(value157);
    return (
      (cloneSceneState17.capture.showSafeFrame = visible2 === true),
      normalizePanoramaSceneState(cloneSceneState17)
    );
  });
}
export function activatePanoramaSceneCameraSlot({
  nodeId: nodeId20,
  slot: slot3,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode4 = getStoreNode(storeInstance, nodeId20);
  if (isPanorama360NodeType(storeNode4?.type)) return null;
  const sceneState = getSceneState(storeInstance, nodeId20),
    cameraId2 = resolveCameraBySlot(sceneState.cameras, slot3);
  if (!cameraId2?.camera?.id) return null;
  return (
    activatePanoramaSceneCamera({
      nodeId: nodeId20,
      cameraId: cameraId2.camera.id,
      storeInstance: storeInstance,
    }),
    cameraId2.camera.id
  );
}
export function upsertPanoramaSceneCameraAtSlot({
  nodeId: nodeId21,
  slot: slot4,
  viewPose: viewPose2,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode5 = getStoreNode(storeInstance, nodeId21);
  if (isPanorama360NodeType(storeNode5?.type)) return null;
  const slot5 = normalizeCameraSlot(slot4);
  if (!slot5) return null;
  const sceneState2 = getSceneState(storeInstance, nodeId21),
    position2 = sanitizeCameraPose(viewPose2),
    cameraBySlot = resolveCameraBySlot(sceneState2.cameras, slot5);
  let value158 = cameraBySlot?.camera?.id || null,
    enabled9 = false;
  writeSceneState(storeInstance, nodeId21, (value159) => {
    const cloneSceneState18 = cloneSceneState(value159),
      cameraBySlot2 = resolveCameraBySlot(cloneSceneState18.cameras, slot5);
    if (cameraBySlot2?.camera?.id) {
      const value160 = cameraBySlot2.camera.id;
      return (
        (value158 = value160),
        (cloneSceneState18.cameras = cloneSceneState18.cameras.map((name) =>
          name.id === value160
            ? {
                ...name,
                slot: slot5,
                name:
                  name.name ||
                  panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(slot5) }),
                position: position2.position,
                quaternion: position2.quaternion,
                rotation: position2.rotation,
                focalLength: position2.focalLength,
              }
            : name,
        )),
        cloneSceneState18.mode === 'panorama' &&
          ((cloneSceneState18.viewport.activeCameraId = value160),
          (cloneSceneState18.viewport.activeView = 'camera')),
        (enabled9 = true),
        cloneSceneState18
      );
    }
    if (cloneSceneState18.cameras.length >= PANORAMA_SCENE_CAMERA_LIMIT) return cloneSceneState18;
    const id = generateId('scene-camera');
    return (
      (value158 = id),
      cloneSceneState18.cameras.push({
        id: id,
        slot: slot5,
        name: panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(slot5) }),
        position: position2.position,
        quaternion: position2.quaternion,
        rotation: position2.rotation,
        focalLength: position2.focalLength,
      }),
      cloneSceneState18.mode === 'panorama' &&
        ((cloneSceneState18.viewport.activeCameraId = id),
        (cloneSceneState18.viewport.activeView = 'camera')),
      (enabled9 = true),
      cloneSceneState18
    );
  });
  if (!enabled9)
    return (
      showWarning(panoramaSceneText('camera.limitWarning', { count: PANORAMA_SCENE_CAMERA_LIMIT })),
      null
    );
  return (commit(), value158);
}
export function activatePanoramaSceneDefaultView({
  nodeId: nodeId22,
  pose: pose,
  storeInstance: storeInstance = appStore,
}) {
  const sceneState3 = getSceneState(storeInstance, nodeId22);
  if (sceneState3.mode === 'panorama') {
    const panoramaView2 = pose ? cameraPoseToPanoramaView(pose) : sceneState3.viewport.panoramaView;
    applyPanoramaSceneViewCommit({
      nodeId: nodeId22,
      panoramaView: panoramaView2,
      activeView: 'default',
      activeCameraId: null,
      storeInstance: storeInstance,
    });
    return;
  }
  const sceneView2 = pose
    ? cameraPoseToSceneViewFromReference(
        pose,
        sceneState3.viewport.sceneView || createDefaultSceneView(),
      )
    : sceneState3.viewport.sceneView;
  applyPanoramaSceneViewCommit({
    nodeId: nodeId22,
    sceneView: sceneView2,
    activeView: 'default',
    activeCameraId: null,
    storeInstance: storeInstance,
  });
}
export async function uploadPanoramaSceneImage({
  nodeId: nodeId23,
  file: file,
  storeInstance: storeInstance = appStore,
  getCurrentProjectId: getCurrentProjectId = () => window.currentProjectId || 'default_v2_project',
  createFastImagePreviewImpl: createFastImagePreviewImpl = createFastImagePreview,
  uploadFileImpl: uploadFileImpl = uploadFile,
  resolveOutputMediaSizeImpl: resolveOutputMediaSizeImpl = resolveOutputMediaSize,
}) {
  if (!file) return null;
  const anchorNode2 = getStoreNode(storeInstance, nodeId23);
  if (!anchorNode2) return null;
  if (!isPanorama360NodeType(anchorNode2.type))
    return (showWarning(panoramaSceneText('upload.unsupportedNode')), null);
  try {
    let box11 = null;
    try {
      box11 = await createFastImagePreviewImpl(file, { maxDimension: 1024 });
    } catch {}
    const imageUrl3 = String(box11?.thumbnailDataUrl || '').trim(),
      value161 =
        Number(box11?.width) > 0 && Number(box11?.height) > 0
          ? { width: Number(box11.width), height: Number(box11.height) }
          : null;
    imageUrl3 &&
      writeSceneState(storeInstance, nodeId23, (value162) => {
        const cloneSceneState19 = cloneSceneState(value162);
        return (
          (cloneSceneState19.mode = 'panorama'),
          (cloneSceneState19.viewport.activeView = 'default'),
          (cloneSceneState19.viewport.activeCameraId = null),
          (cloneSceneState19.panorama = {
            localPath: null,
            imageUrl: imageUrl3,
            previewImageUrl: imageUrl3,
            fileName: String(file.name || '').trim() || null,
            sourceSignature: null,
            isLoaded: false,
            error: null,
          }),
          cloneSceneState19
        );
      });
    box11?.image && ((box11.image.width = 0), (box11.image.height = 0));
    const response = await uploadFileImpl(file, getCurrentProjectId()),
      fileName3 = response.filename || file.name,
      localPath3 = pickResultLocalPath(response),
      imageUrl4 = localPathToUrl(localPath3) || String(response.url || '').trim() || null,
      imageStorageFields2 = buildImageNodeStorageFields(response),
      width =
        value161 || (await resolveOutputMediaSizeImpl({ localPath: localPath3, imageUrl: imageUrl4 }));
    if (width && !isNearEquirectangularRatio(width)) {
      const ratio = width.width / width.height;
      showWarning(
        panoramaSceneText('upload.ratioWarning', {
          width: width.width,
          height: width.height,
          ratio: ratio.toFixed(3),
        }),
      );
    }
    const sourceId = buildPanoramaUploadSourceNodeData({
        storeInstance: storeInstance,
        anchorNode: anchorNode2,
        localPath: localPath3,
        imageUrl: imageUrl4,
        fileName: fileName3,
        uploadedSize: width,
        imageStorageFields: imageStorageFields2,
      }),
      createdAt = Date.now();
    return (
      storeInstance.batch(() => {
        (writeSceneState(storeInstance, nodeId23, (value163) => {
          const cloneSceneState20 = cloneSceneState(value163);
          return (
            (cloneSceneState20.mode = 'panorama'),
            (cloneSceneState20.viewport.activeView = 'default'),
            (cloneSceneState20.viewport.activeCameraId = null),
            (cloneSceneState20.panorama = {
              localPath: localPath3,
              imageUrl: imageUrl4,
              previewImageUrl:
                pickFirstNonEmptyString(
                  response.thumbUrl,
                  localPathToUrl(response.thumbLocalPath),
                  response.displayUrl,
                  localPathToUrl(response.displayLocalPath),
                  imageUrl4,
                ) || null,
              fileName: fileName3,
              sourceSignature: null,
              isLoaded: false,
              error: null,
            }),
            cloneSceneState20
          );
        }),
          sourceId &&
            (storeInstance.addNode(sourceId),
            storeInstance.addEdge({
              id: generateId('edge'),
              sourceId: sourceId.id,
              targetId: nodeId23,
              createdAt: createdAt,
            })),
          storeInstance.setSelectedNodes([nodeId23]));
      }),
      commit(),
      showSuccess(panoramaSceneText('upload.success')),
      {
        localPath: localPath3,
        imageUrl: imageUrl4,
        fileName: fileName3,
        sourceNodeId: sourceId?.id || null,
      }
    );
  } catch (error2) {
    const error3 = String(error2?.message || panoramaSceneText('upload.failed'));
    return (
      writeSceneState(storeInstance, nodeId23, (value164) => {
        const cloneSceneState21 = cloneSceneState(value164);
        return (
          (cloneSceneState21.panorama.error = error3),
          (cloneSceneState21.panorama.isLoaded = false),
          cloneSceneState21
        );
      }),
      showError(panoramaSceneText('upload.failedWithError', { error: error3 })),
      null
    );
  }
}
export function syncPanorama360FromIncomingImageEdge({
  nodeId: nodeId24,
  storeInstance: storeInstance = appStore,
}) {
  const value165 = String(nodeId24 || '').trim(),
    storeNode6 = getStoreNode(storeInstance, value165);
  if (!storeNode6 || !isPanorama360NodeType(storeNode6.type))
    return (bumpPanorama360SyncVersion(value165), null);
  const value166 =
      typeof storeInstance?.getIncomingEdges === 'function'
        ? storeInstance.getIncomingEdges(value165)
        : Object.values(storeInstance.getStateRaw?.().edges || {}).filter(
            (value167) => value167?.targetId === value165,
          ),
    value168 = storeInstance.getStateRaw?.().nodes || {},
    value169 = (Array.isArray(value166) ? value166 : [])
      .map((edge) => {
        const sourceNode = value168[edge?.sourceId] || null,
          payload2 = resolvePanoramaImagePayloadFromSourceNode(sourceNode);
        if (!sourceNode || !payload2) return null;
        return { edge: edge, sourceNode: sourceNode, payload: payload2 };
      })
      .filter(Boolean)
      .sort(comparePanoramaIncomingCandidatesDesc),
    sourceNodeId = value169[0] || null;
  if (!sourceNodeId?.payload) return (bumpPanorama360SyncVersion(value165), null);
  const sourceSignature = buildPanoramaSourceSignature(sourceNodeId.payload),
    sceneState4 = getSceneState(storeInstance, value165),
    isLoaded = sceneState4?.panorama || {},
    value170 =
      String(isLoaded.sourceSignature || '') === sourceSignature &&
      hasPersistentPanoramaLocalPath(isLoaded.localPath);
  if (value170) {
    const previewImageUrl2 = sourceNodeId.payload.previewImageUrl || isLoaded.previewImageUrl,
      args7 = {
        localPath: String(isLoaded.localPath || '').trim() || sourceNodeId.payload.localPath,
        imageUrl: String(isLoaded.imageUrl || '').trim() || sourceNodeId.payload.imageUrl,
        previewImageUrl: previewImageUrl2 || null,
        fileName: String(isLoaded.fileName || '').trim() || sourceNodeId.payload.fileName,
        sourceSignature: sourceSignature,
        isLoaded: isLoaded.isLoaded === true,
        error: null,
      },
      value171 = String(isLoaded.previewImageUrl || '') === String(previewImageUrl2 || '');
    if (!isLoaded.error && value171)
      return { ...args7, sourceNodeId: sourceNodeId.sourceNode.id, updated: false };
    return (
      writeSceneState(storeInstance, value165, (value172) => {
        const cloneSceneState22 = cloneSceneState(value172);
        return (
          (cloneSceneState22.mode = 'panorama'),
          (cloneSceneState22.viewport.activeView = 'default'),
          (cloneSceneState22.viewport.activeCameraId = null),
          (cloneSceneState22.panorama = args7),
          cloneSceneState22
        );
      }),
      { ...args7, sourceNodeId: sourceNodeId.sourceNode.id, updated: true }
    );
  }
  const value173 = _panorama360SyncInflightByNodeId.get(value165);
  if (value173?.signature === sourceSignature && value173?.promise) return value173.promise;
  const version = bumpPanorama360SyncVersion(value165),
    imageUrl5 = pickFirstNonEmptyString(
      sourceNodeId.payload.previewImageUrl,
      sourceNodeId.payload.imageUrl,
      localPathToUrl(sourceNodeId.payload.localPath),
    );
  writeSceneState(storeInstance, value165, (value174) => {
    const cloneSceneState23 = cloneSceneState(value174);
    return (
      (cloneSceneState23.mode = 'panorama'),
      (cloneSceneState23.viewport.activeView = 'default'),
      (cloneSceneState23.viewport.activeCameraId = null),
      (cloneSceneState23.panorama = {
        localPath: null,
        imageUrl: imageUrl5 || null,
        previewImageUrl: imageUrl5 || null,
        fileName: sourceNodeId.payload.fileName,
        sourceSignature: sourceSignature,
        isLoaded: false,
        error: null,
      }),
      cloneSceneState23
    );
  });
  const promise = (async () => {
    try {
      const localPath4 = await ensurePersistedPanoramaInputPng({
        localPath: sourceNodeId.payload.localPath,
        imageUrl: sourceNodeId.payload.imageUrl,
        fileName: sourceNodeId.payload.fileName,
        sourceSignature: sourceSignature,
      });
      if (!isPanorama360SyncCurrent(value165, version))
        return { ...localPath4, sourceNodeId: sourceNodeId.sourceNode.id, updated: false, stale: true };
      const storeNode7 = getStoreNode(storeInstance, value165);
      if (!storeNode7 || !isPanorama360NodeType(storeNode7.type)) return null;
      const sceneState5 = getSceneState(storeInstance, value165),
        enabled10 = sceneState5?.panorama || {},
        args8 = {
          localPath: localPath4.localPath,
          imageUrl: localPath4.imageUrl,
          previewImageUrl: imageUrl5 || null,
          fileName: localPath4.fileName,
          sourceSignature: sourceSignature,
          isLoaded: false,
          error: null,
        },
        value175 =
          String(enabled10.localPath || '') === String(args8.localPath || '') &&
          String(enabled10.imageUrl || '') === String(args8.imageUrl || '') &&
          String(enabled10.fileName || '') === String(args8.fileName || '') &&
          String(enabled10.sourceSignature || '') === sourceSignature,
        value176 = enabled10.isLoaded === false && !enabled10.error;
      if (value175 && value176)
        return { ...args8, sourceNodeId: sourceNodeId.sourceNode.id, updated: false };
      return (
        writeSceneState(storeInstance, value165, (value177) => {
          const cloneSceneState24 = cloneSceneState(value177);
          return (
            (cloneSceneState24.mode = 'panorama'),
            (cloneSceneState24.viewport.activeView = 'default'),
            (cloneSceneState24.viewport.activeCameraId = null),
            (cloneSceneState24.panorama = args8),
            cloneSceneState24
          );
        }),
        { ...args8, sourceNodeId: sourceNodeId.sourceNode.id, updated: true }
      );
    } catch (error4) {
      if (!isPanorama360SyncCurrent(value165, version))
        return {
          updated: false,
          stale: true,
          error: String(error4?.message || error4 || panoramaSceneText('errors.unknown')),
        };
      const error5 = String(error4?.message || panoramaSceneText('errors.pngNormalizeFailed'));
      return (showError(error5), { updated: false, error: error5 });
    } finally {
      const value178 = _panorama360SyncInflightByNodeId.get(value165);
      value178?.promise === promise && _panorama360SyncInflightByNodeId.delete(value165);
    }
  })();
  return (
    _panorama360SyncInflightByNodeId.set(value165, {
      signature: sourceSignature,
      version: version,
      promise: promise,
    }),
    promise
  );
}
export function updatePanoramaSceneLoadState({
  nodeId: nodeId25,
  isLoaded: isLoaded2,
  error: error = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId25, (value179) => {
    const cloneSceneState25 = cloneSceneState(value179);
    return (
      (cloneSceneState25.panorama.isLoaded = isLoaded2 === true),
      (cloneSceneState25.panorama.error = error ? String(error) : null),
      cloneSceneState25
    );
  });
}
export function addPanoramaSceneMannequin({
  nodeId: nodeId26,
  gender: gender = 'male',
  colorKey: colorKey = 'blue',
  poseId: poseId = DEFAULT_MANNEQUIN_POSE_ID,
  bonePose: bonePose = null,
  viewPose: viewPose3,
  storeInstance: storeInstance = appStore,
}) {
  const sceneMode = getSceneState(storeInstance, nodeId26),
    position3 = resolveObjectPlacementPoint({
      sceneMode: sceneMode.mode,
      sceneViewTarget: sceneMode?.viewport?.sceneView?.target,
      pose: viewPose3,
      groundY: 0,
      forwardDistance: MANNEQUIN_FORWARD_PLACEMENT_DISTANCE,
    }),
    y7 = pickFacingCameraYaw(viewPose3),
    id2 = generateId('mannequin'),
    poseId2 = bonePose
      ? { id: 'custom', bones: normalizeBonePose(bonePose) }
      : resolveMannequinPose(poseId);
  return (
    writeSceneState(storeInstance, nodeId26, (value180) => {
      const cloneSceneState26 = cloneSceneState(value180);
      return (
        cloneSceneState26.mannequins.push({
          id: id2,
          gender: gender === 'female' ? 'female' : 'male',
          colorKey: colorKey,
          poseId: poseId2?.id || DEFAULT_MANNEQUIN_POSE_ID,
          bonePose: normalizeBonePose(poseId2?.bones),
          position: position3,
          rotation: { x: 0, y: y7, z: 0 },
          scale: 1,
        }),
        (cloneSceneState26.gridPlacement.gender = gender === 'female' ? 'female' : 'male'),
        (cloneSceneState26.gridPlacement.colorKey = colorKey),
        setSingleSelection(cloneSceneState26, 'mannequin', id2),
        cloneSceneState26
      );
    }),
    commit(),
    id2
  );
}
export function addPanoramaSceneCube({
  nodeId: nodeId27,
  assetId: assetId,
  colorKey: colorKey = null,
  viewPose: viewPose4,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode8 = getStoreNode(storeInstance, nodeId27);
  if (isPanorama360NodeType(storeNode8?.type)) return null;
  const assetId2 = resolveSceneAsset(assetId),
    colorKey2 = colorKey || assetId2?.colorKey || 'blue',
    sceneMode2 = getSceneState(storeInstance, nodeId27),
    forwardDistance = Math.max(
      CUBE_FORWARD_PLACEMENT_DISTANCE,
      estimateSceneAssetBoundingRadius(assetId2) + 2.5,
    ),
    x10 = resolveObjectPlacementPoint({
      sceneMode: sceneMode2.mode,
      sceneViewTarget: sceneMode2?.viewport?.sceneView?.target,
      pose: viewPose4,
      groundY: 0,
      forwardDistance: forwardDistance,
    }),
    position4 = { x: x10.x, y: 0, z: x10.z },
    id3 = generateId('cube');
  return (
    writeSceneState(storeInstance, nodeId27, (value181) => {
      const cloneSceneState27 = cloneSceneState(value181);
      return (
        cloneSceneState27.cubes.push({
          id: id3,
          assetId: assetId2?.id || null,
          colorKey: colorKey2,
          position: position4,
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
        }),
        setSingleSelection(cloneSceneState27, 'cube', id3),
        cloneSceneState27
      );
    }),
    commit(),
    id3
  );
}
export function addPanoramaSceneMannequinGrid({
  nodeId: nodeId28,
  viewPose: viewPose5,
  storeInstance: storeInstance = appStore,
}) {
  const sceneMode3 = getSceneState(storeInstance, nodeId28),
    yaw = pickFacingCameraYaw(viewPose5),
    origin = resolveBatchPlacementOrigin({
      sceneMode: sceneMode3.mode,
      sceneViewTarget: sceneMode3?.viewport?.sceneView?.target,
      pose: viewPose5,
      groundY: 0,
      forwardDistance: MANNEQUIN_FORWARD_PLACEMENT_DISTANCE,
    }),
    list19 = computeGridPlacement({
      rows: sceneMode3.gridPlacement.rows,
      cols: sceneMode3.gridPlacement.cols,
      spacingX: sceneMode3.gridPlacement.spacingX,
      spacingZ: sceneMode3.gridPlacement.spacingZ,
      origin: origin,
      yaw: yaw,
    });
  if (list19.length === 0) return [];
  const preferredActiveId5 = [],
    id4 = generateId('mannequin-group');
  return (
    writeSceneState(storeInstance, nodeId28, (value182) => {
      const gender2 = cloneSceneState(value182);
      for (const position5 of list19) {
        const id5 = generateId('mannequin');
        (preferredActiveId5.push(id5),
          gender2.mannequins.push({
            id: id5,
            gender: gender2.gridPlacement.gender,
            colorKey: gender2.gridPlacement.colorKey,
            poseId: DEFAULT_MANNEQUIN_POSE_ID,
            bonePose: {},
            position: position5,
            rotation: { x: 0, y: yaw, z: 0 },
            scale: 1,
          }));
      }
      return (
        (gender2.groups = Array.isArray(gender2.groups) ? gender2.groups : []),
        gender2.groups.push({
          id: id4,
          type: 'mannequin-grid',
          memberObjectType: 'mannequin',
          memberIds: [...preferredActiveId5],
        }),
        setSelectionFromObjects(
          gender2,
          preferredActiveId5.map((objectId9) => ({ objectType: 'mannequin', objectId: objectId9 })),
          {
            preferredGroupId: id4,
            preferredActiveType: 'mannequin',
            preferredActiveId: preferredActiveId5[0] || null,
          },
        ),
        gender2
      );
    }),
    commit(),
    preferredActiveId5
  );
}
export function addPanoramaSceneCamera({
  nodeId: nodeId29,
  viewPose: viewPose6,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode9 = getStoreNode(storeInstance, nodeId29);
  if (isPanorama360NodeType(storeNode9?.type)) return null;
  const sceneState6 = getSceneState(storeInstance, nodeId29);
  if (sceneState6.cameras.length >= PANORAMA_SCENE_CAMERA_LIMIT)
    return (
      showWarning(panoramaSceneText('camera.limitWarning', { count: PANORAMA_SCENE_CAMERA_LIMIT })),
      null
    );
  const position6 = sanitizeCameraPose(viewPose6),
    id6 = generateId('scene-camera'),
    slot6 = resolveFirstFreeCameraSlot(sceneState6.cameras);
  if (!slot6)
    return (
      showWarning(panoramaSceneText('camera.limitWarning', { count: PANORAMA_SCENE_CAMERA_LIMIT })),
      null
    );
  return (
    writeSceneState(storeInstance, nodeId29, (value183) => {
      const cloneSceneState28 = cloneSceneState(value183);
      return (
        cloneSceneState28.cameras.push({
          id: id6,
          slot: slot6,
          name: panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(slot6) }),
          position: position6.position,
          quaternion: position6.quaternion,
          rotation: position6.rotation,
          focalLength: position6.focalLength,
        }),
        cloneSceneState28.mode === 'panorama' &&
          ((cloneSceneState28.viewport.activeView = 'camera'),
          (cloneSceneState28.viewport.activeCameraId = id6)),
        cloneSceneState28
      );
    }),
    commit(),
    id6
  );
}
export function upsertPanoramaSceneCustomPose({
  nodeId: nodeId30,
  pose: pose2,
  storeInstance: storeInstance = appStore,
}) {
  const args9 = normalizeCustomMannequinPose(pose2),
    id7 =
      args9.id && args9.id !== 'custom' ? args9.id : generateId('mannequin-pose'),
    value184 = { ...args9, id: id7 };
  return (
    writeSceneState(storeInstance, nodeId30, (value185) => {
      const cloneSceneState29 = cloneSceneState(value185),
        list20 = Array.isArray(cloneSceneState29.customPoses) ? cloneSceneState29.customPoses : [];
      return (
        (cloneSceneState29.customPoses = [
          ...list20.filter((value186) => value186.id !== id7),
          value184,
        ]),
        cloneSceneState29
      );
    }),
    commit(),
    value184
  );
}
export function applyPanoramaSceneMannequinPose({
  nodeId: nodeId31,
  mannequinId: mannequinId,
  poseId: poseId = DEFAULT_MANNEQUIN_POSE_ID,
  bonePose: bonePose = null,
  customPose: customPose = null,
  storeInstance: storeInstance = appStore,
}) {
  const enabled11 = String(mannequinId || '').trim();
  if (!enabled11) return null;
  let value187 = null;
  return (
    writeSceneState(storeInstance, nodeId31, (value188) => {
      const cloneSceneState30 = cloneSceneState(value188),
        error6 = customPose
          ? {
              ...normalizeCustomMannequinPose(customPose),
              id: String(customPose.id || '').trim() || generateId('mannequin-pose'),
            }
          : null;
      error6 &&
        (cloneSceneState30.customPoses = [
          ...(cloneSceneState30.customPoses || []).filter((value189) => value189.id !== error6.id),
          error6,
        ]);
      const value190 = error6?.id || (poseId !== 'custom' ? String(poseId || '').trim() : ''),
        id8 = (cloneSceneState30.customPoses || []).find((value191) => value191.id === value190),
        poseId3 = bonePose
          ? createCustomMannequinPose({
              id: id8?.id || error6?.id || 'custom',
              name: id8?.name || error6?.name || 'Custom pose',
              bones: bonePose,
            })
          : id8 || resolveMannequinPose(poseId, error6);
      return (
        (value187 = poseId3),
        (cloneSceneState30.mannequins = cloneSceneState30.mannequins.map((args10) =>
          args10.id === enabled11
            ? {
                ...args10,
                poseId:
                  poseId3?.category === 'custom'
                    ? 'custom'
                    : poseId3?.id || DEFAULT_MANNEQUIN_POSE_ID,
                customPoseId: poseId3?.category === 'custom' ? poseId3.id : null,
                bonePose: normalizeBonePose(poseId3?.bones),
              }
            : args10,
        )),
        setSingleSelection(cloneSceneState30, 'mannequin', enabled11),
        cloneSceneState30
      );
    }),
    commit(),
    value187
  );
}
export function addPanoramaSceneCameraKeyframe({
  nodeId: nodeId32,
  keyframe: keyframe = {},
  viewPose: viewPose = null,
  storeInstance: storeInstance = appStore,
}) {
  const sceneState7 = getSceneState(storeInstance, nodeId32),
    cameraTimeline2 = normalizeCameraTimeline(sceneState7.cameraTimeline),
    compositionPoint = normalizeCompositionPoint(viewPose?.position, { x: 0, y: 1.6, z: 6 }),
    x11 = normalizeCompositionPoint(keyframe?.position, compositionPoint),
    box12 = normalizeCompositionPoint(viewPose?.forward, { x: 0, y: 0, z: -1 }),
    value192 = {
      x: x11.x + box12.x * 5,
      y: x11.y + box12.y * 5,
      z: x11.z + box12.z * 5,
    },
    target2 = normalizeCompositionPoint(keyframe?.target, value192),
    value193 = Number(keyframe.fov ?? viewPose?.fov),
    value194 = {
      id: String(keyframe.id || '').trim() || generateId('camera-keyframe'),
      time: Number.isFinite(Number(keyframe.time))
        ? Number(keyframe.time)
        : cameraTimeline2.currentTime,
      position: x11,
      target: target2,
      fov: Number.isFinite(value193) ? value193 : 55,
      easing: keyframe.easing || 'ease-in-out',
    };
  return (
    writeSceneState(storeInstance, nodeId32, (value195) => {
      const cloneSceneState31 = cloneSceneState(value195);
      return (
        (cloneSceneState31.cameraTimeline = upsertCameraKeyframe(cloneSceneState31.cameraTimeline, value194)),
        cloneSceneState31
      );
    }),
    commit(),
    value194.id
  );
}
export function updatePanoramaSceneCameraTimeline({
  nodeId: nodeId33,
  timeline: timeline = null,
  patch: patch = null,
  storeInstance: storeInstance = appStore,
}) {
  (writeSceneState(storeInstance, nodeId33, (value196) => {
    const cloneSceneState32 = cloneSceneState(value196);
    return (
      (cloneSceneState32.cameraTimeline = timeline
        ? normalizeCameraTimeline(timeline)
        : updateCameraTimelineSettings(cloneSceneState32.cameraTimeline, patch || {})),
      cloneSceneState32
    );
  }),
    commit());
}
export function deletePanoramaSceneCameraKeyframe({
  nodeId: nodeId34,
  keyframeId: keyframeId,
  storeInstance: storeInstance = appStore,
}) {
  (writeSceneState(storeInstance, nodeId34, (value197) => {
    const cloneSceneState33 = cloneSceneState(value197);
    return (
      (cloneSceneState33.cameraTimeline = removeCameraKeyframe(cloneSceneState33.cameraTimeline, keyframeId)),
      cloneSceneState33
    );
  }),
    commit());
}
function normalizeCompositionPoint(box13, box14) {
  return {
    x: Number.isFinite(Number(box13?.x)) ? Number(box13.x) : box14.x,
    y: Number.isFinite(Number(box13?.y)) ? Number(box13.y) : box14.y,
    z: Number.isFinite(Number(box13?.z)) ? Number(box13.z) : box14.z,
  };
}
export function composePanoramaScene({
  nodeId: nodeId35,
  assets: assets = [],
  mannequins: mannequins = [],
  cameraTimeline: cameraTimeline = null,
  environmentMode: environmentMode = null,
  replaceExisting: replaceExisting = false,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode10 = getStoreNode(storeInstance, nodeId35);
  if (!storeNode10 || isPanorama360NodeType(storeNode10.type)) return null;
  const assetIds = [],
    mannequinIds = [];
  return (
    writeSceneState(storeInstance, nodeId35, (value198) => {
      const cloneSceneState34 = cloneSceneState(value198);
      replaceExisting &&
        ((cloneSceneState34.cubes = []),
        (cloneSceneState34.mannequins = []),
        (cloneSceneState34.groups = []),
        clearSelection(cloneSceneState34));
      environmentMode && (cloneSceneState34.environmentMode = environmentMode === 'day' ? 'day' : 'night');
      const list21 = Array.isArray(assets) ? assets : [];
      list21.forEach((colorKey3, value199) => {
        const assetId3 = resolveSceneAsset(colorKey3?.assetId || colorKey3?.id);
        if (!assetId3) return;
        const id9 = generateId('scene-asset');
        assetIds.push(id9);
        const value200 = {
          x: ((value199 % 4) - Math.min(1.5, (list21.length - 1) / 2)) * 2.2,
          y: 0,
          z: Math.floor(value199 / 4) * 2.2,
        };
        cloneSceneState34.cubes.push({
          id: id9,
          assetId: assetId3.id,
          colorKey: colorKey3?.colorKey || assetId3.colorKey || 'blue',
          position: normalizeCompositionPoint(colorKey3?.position, value200),
          rotation: normalizeCompositionPoint(colorKey3?.rotation, { x: 0, y: 0, z: 0 }),
          scale: colorKey3?.scale ?? 1,
        });
      });
      const list22 = Array.isArray(mannequins) ? mannequins : [];
      list22.forEach((bones, value201) => {
        const id10 = generateId('mannequin');
        mannequinIds.push(id10);
        const poseId4 = bones?.bonePose
          ? createCustomMannequinPose({ bones: bones.bonePose })
          : resolveMannequinPose(bones?.poseId);
        cloneSceneState34.mannequins.push({
          id: id10,
          gender: bones?.gender === 'female' ? 'female' : 'male',
          colorKey: bones?.colorKey || 'blue',
          poseId:
            poseId4?.category === 'custom' ? 'custom' : poseId4?.id || DEFAULT_MANNEQUIN_POSE_ID,
          customPoseId: null,
          bonePose: normalizeBonePose(poseId4?.bones),
          position: normalizeCompositionPoint(bones?.position, {
            x: (value201 - (list22.length - 1) / 2) * 1.5,
            y: 0,
            z: 0,
          }),
          rotation: normalizeCompositionPoint(bones?.rotation, { x: 0, y: Math.PI, z: 0 }),
          scale: bones?.scale ?? 1,
        });
      });
      cameraTimeline && (cloneSceneState34.cameraTimeline = normalizeCameraTimeline(cameraTimeline));
      const value202 = mannequinIds.at(-1),
        value203 = assetIds.at(-1);
      if (value202) setSingleSelection(cloneSceneState34, 'mannequin', value202);
      else value203 && setSingleSelection(cloneSceneState34, 'cube', value203);
      return cloneSceneState34;
    }),
    commit(),
    { nodeId: nodeId35, assetIds: assetIds, mannequinIds: mannequinIds }
  );
}
export function updatePanoramaSceneObjectTransform({
  nodeId: nodeId36,
  objectType: objectType8,
  objectId: objectId10,
  pose: pose3,
  targets: targets,
  storeInstance: storeInstance = appStore,
}) {
  const list23 = Array.isArray(targets) ? targets : [],
    position7 = pose3 ? sanitizeObjectPose(pose3) : null;
  (writeSceneState(storeInstance, nodeId36, (value204) => {
    const cloneSceneState35 = cloneSceneState(value204);
    if (list23.length > 0) {
      const map6 = new Map(),
        map7 = new Map();
      list23.forEach((enabled12) => {
        if (!enabled12?.objectId || !enabled12?.objectType || !enabled12?.pose) return;
        const sanitizeObjectPose2 = sanitizeObjectPose(enabled12.pose);
        if (enabled12.objectType === 'mannequin')
          map6.set(String(enabled12.objectId), sanitizeObjectPose2);
        else enabled12.objectType === 'cube' && map7.set(String(enabled12.objectId), sanitizeObjectPose2);
      });
      map6.size > 0 &&
        (cloneSceneState35.mannequins = cloneSceneState35.mannequins.map((box15) => {
          const position8 = map6.get(box15.id);
          if (!position8) return box15;
          const scale2 = composeCompatibleScale(position8.scale, box15.scale);
          return {
            ...box15,
            position: position8.position,
            rotation: position8.rotation,
            quaternion: position8.quaternion,
            scale: scale2,
          };
        }));
      map7.size > 0 &&
        (cloneSceneState35.cubes = cloneSceneState35.cubes.map((box16) => {
          const position9 = map7.get(box16.id);
          if (!position9) return box16;
          const scale3 = composeCompatibleScale(position9.scale, box16.scale);
          return {
            ...box16,
            position: position9.position,
            rotation: position9.rotation,
            quaternion: position9.quaternion,
            scale: scale3,
          };
        }));
      if (cloneSceneState35.selection.selectedGroupId) {
        const preferredGroupId4 = (cloneSceneState35.groups || []).find(
          (value205) => value205.id === cloneSceneState35.selection.selectedGroupId,
        );
        preferredGroupId4 &&
          setSelectionFromObjects(
            cloneSceneState35,
            preferredGroupId4.memberIds.map((objectId11) => ({ objectType: 'mannequin', objectId: objectId11 })),
            {
              preferredGroupId: preferredGroupId4.id,
              preferredActiveType: 'mannequin',
              preferredActiveId: preferredGroupId4.memberIds[0] || null,
            },
          );
      }
      return cloneSceneState35;
    }
    if (objectType8 === 'camera') return cloneSceneState35;
    if (objectType8 === 'mannequin' && position7 && objectId10)
      ((cloneSceneState35.mannequins = cloneSceneState35.mannequins.map((box17) =>
        box17.id === objectId10
          ? {
              ...box17,
              position: position7.position,
              rotation: position7.rotation,
              quaternion: position7.quaternion,
              scale: composeCompatibleScale(position7.scale, box17.scale),
            }
          : box17,
      )),
        setSingleSelection(cloneSceneState35, 'mannequin', objectId10));
    else
      objectType8 === 'cube' &&
        position7 &&
        objectId10 &&
        ((cloneSceneState35.cubes = cloneSceneState35.cubes.map((box18) =>
          box18.id === objectId10
            ? {
                ...box18,
                position: position7.position,
                rotation: position7.rotation,
                quaternion: position7.quaternion,
                scale: composeCompatibleScale(position7.scale, box18.scale),
              }
            : box18,
        )),
        setSingleSelection(cloneSceneState35, 'cube', objectId10));
    return cloneSceneState35;
  }),
    commit());
}
export function deletePanoramaSceneCamera({
  nodeId: nodeId37,
  cameraId: cameraId3,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode11 = getStoreNode(storeInstance, nodeId37);
  if (isPanorama360NodeType(storeNode11?.type)) return;
  const sceneState8 = getSceneState(storeInstance, nodeId37);
  if (!sceneState8.cameras.some((value206) => value206.id === cameraId3)) return;
  (writeSceneState(storeInstance, nodeId37, (value207) => {
    const finalizeSelectedObjectRemoval2 = finalizeSelectedObjectRemoval(value207, 'camera', cameraId3);
    return (
      (finalizeSelectedObjectRemoval2.cameras = finalizeSelectedObjectRemoval2.cameras.filter((value208) => value208.id !== cameraId3)),
      finalizeSelectedObjectRemoval2
    );
  }),
    commit());
}
export function deleteSelectedPanoramaSceneObject({
  nodeId: nodeId38,
  storeInstance: storeInstance = appStore,
}) {
  const sceneState9 = getSceneState(storeInstance, nodeId38),
    list24 = collectSelectionObjects(sceneState9),
    objectType9 = sceneState9.selection.selectedObjectType,
    objectId12 = sceneState9.selection.selectedObjectId,
    objectId13 =
      sceneState9?.viewport?.activeView === 'camera' && sceneState9?.viewport?.activeCameraId
        ? String(sceneState9.viewport.activeCameraId)
        : null,
    value209 = sceneState9.selection.selectedGroupId || null;
  if (value209) {
    (writeSceneState(storeInstance, nodeId38, (value210) => {
      const cloneSceneState36 = cloneSceneState(value210),
        enabled13 = (cloneSceneState36.groups || []).find((value211) => value211.id === value209);
      if (!enabled13) return (clearSelection(cloneSceneState36), cloneSceneState36);
      const map8 = new Set(enabled13.memberIds);
      return (
        (cloneSceneState36.mannequins = cloneSceneState36.mannequins.filter(
          (value212) => !map8.has(value212.id),
        )),
        (cloneSceneState36.groups = pruneGroups(cloneSceneState36.groups, [...map8]).filter(
          (value213) => value213.id !== value209,
        )),
        clearSelection(cloneSceneState36),
        cloneSceneState36
      );
    }),
      commit());
    return;
  }
  if (list24.length > 1) {
    (writeSceneState(storeInstance, nodeId38, (value214) => {
      const cloneSceneState37 = cloneSceneState(value214),
        map9 = new Set(
          list24.filter((value215) => value215.objectType === 'cube').map(
            (value216) => value216.objectId,
          ),
        ),
        map10 = new Set(
          list24.filter((value217) => value217.objectType === 'mannequin').map(
            (value218) => value218.objectId,
          ),
        );
      map9.size > 0 &&
        (cloneSceneState37.cubes = cloneSceneState37.cubes.filter(
          (value219) => !map9.has(value219.id),
        ));
      if (map10.size > 0) {
        const value220 = [...map10];
        ((cloneSceneState37.mannequins = cloneSceneState37.mannequins.filter(
          (value221) => !map10.has(value221.id),
        )),
          (cloneSceneState37.groups = pruneGroups(cloneSceneState37.groups, value220)));
      }
      return (clearSelection(cloneSceneState37), cloneSceneState37);
    }),
      commit());
    return;
  }
  const enabled14 =
    list24.length === 1
      ? list24[0]
      : objectType9 && objectId12
        ? { objectType: objectType9, objectId: objectId12 }
        : objectId13
          ? { objectType: 'camera', objectId: objectId13 }
          : null;
  if (!enabled14?.objectType || !enabled14?.objectId) return;
  (writeSceneState(storeInstance, nodeId38, (value222) => {
    const finalizeSelectedObjectRemoval3 = finalizeSelectedObjectRemoval(
      value222,
      enabled14.objectType,
      enabled14.objectId,
    );
    if (enabled14.objectType === 'camera')
      finalizeSelectedObjectRemoval3.cameras = finalizeSelectedObjectRemoval3.cameras.filter(
        (value223) => value223.id !== enabled14.objectId,
      );
    else
      enabled14.objectType === 'cube'
        ? (finalizeSelectedObjectRemoval3.cubes = finalizeSelectedObjectRemoval3.cubes.filter(
            (value224) => value224.id !== enabled14.objectId,
          ))
        : ((finalizeSelectedObjectRemoval3.mannequins = finalizeSelectedObjectRemoval3.mannequins.filter(
            (value225) => value225.id !== enabled14.objectId,
          )),
          (finalizeSelectedObjectRemoval3.groups = pruneGroups(finalizeSelectedObjectRemoval3.groups, [enabled14.objectId])));
    return finalizeSelectedObjectRemoval3;
  }),
    commit());
}
function createCapturePreviewUrl(enabled15) {
  const value226 = globalThis.window?.URL || globalThis.URL;
  if (!enabled15 || typeof value226?.createObjectURL !== 'function') return '';
  try {
    return value226.createObjectURL(enabled15);
  } catch {
    return '';
  }
}
function buildSavedCapturePatch(fileName4, box19 = {}) {
  const localPath5 = pickResultLocalPath(fileName4),
    src = localPathToUrl(localPath5) || String(fileName4?.url || '').trim();
  if (!localPath5 || !src) throw new Error(panoramaSceneText('capture.saveInvalidPath'));
  const value227 = {
      src: src,
      localPath: localPath5,
      originalLocalPath: normalizeLocalPath(fileName4?.originalLocalPath || localPath5),
      displayLocalPath: normalizeLocalPath(fileName4?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(fileName4?.thumbLocalPath),
      fileName: fileName4?.filename || box19.fileName || '',
      captureSavePending: false,
      captureSaveError: null,
    },
    count7 = Number(
      fileName4?.originalWidth || box19.originalWidth || box19.width || 0,
    ),
    count8 = Number(
      fileName4?.originalHeight || box19.originalHeight || box19.height || 0,
    );
  if (count7 > 0) value227.originalWidth = count7;
  if (count8 > 0) value227.originalHeight = count8;
  return value227;
}
export async function capturePanoramaSceneViewport({
  nodeId: nodeId39,
  captureViewport: captureViewport,
  captureBlob: captureBlob,
  storeInstance: storeInstance = appStore,
  saveBlob: saveBlob = saveOutputBlob,
  createPreviewUrl: createPreviewUrl = createCapturePreviewUrl,
}) {
  const run2 =
    typeof captureBlob === 'function' ? captureBlob : typeof captureViewport === 'function' ? captureViewport : null;
  if (!run2) return null;
  const nodeActionContext = createNodeActionContext({ storeInstance: storeInstance }),
    storeNode12 = getStoreNode(nodeActionContext.storeInstance, nodeId39);
  if (!storeNode12) return null;
  const sceneState10 = getSceneState(nodeActionContext.storeInstance, nodeId39);
  if (sceneState10.capture.pending) return (showWarning(panoramaSceneText('capture.pending')), null);
  writeSceneState(nodeActionContext.storeInstance, nodeId39, (value228) => {
    const cloneSceneState38 = cloneSceneState(value228);
    return ((cloneSceneState38.capture.pending = true), (cloneSceneState38.capture.error = null), cloneSceneState38);
  });
  try {
    const enabled16 = await run2();
    if (!enabled16) throw new Error(panoramaSceneText('capture.noImage'));
    const fileName5 = 'scene_capture_' + Date.now() + '.png',
      width2 = buildSourceMediaNodePayload({
        id: '__seed__',
        type: 'source-image',
        x: 0,
        y: 0,
        name: panoramaSceneText('capture.nodeName'),
        fileName: fileName5,
      }),
      state2 = nodeActionContext.storeInstance.getStateRaw(),
      x12 = calcSafeSpawnPosNearNode(
        state2.nodes || {},
        storeNode12,
        width2.width,
        width2.height,
      ),
      id11 = generateId('source-image'),
      capturePreviewUrl = createPreviewUrl(enabled16) || '';
    return (
      nodeActionContext.storeInstance.batch(() => {
        (writeSceneState(nodeActionContext.storeInstance, nodeId39, (value229) => {
          const cloneSceneState39 = cloneSceneState(value229);
          return (
            (cloneSceneState39.capture.pending = false),
            (cloneSceneState39.capture.error = null),
            (cloneSceneState39.capture.lastCaptureAt = Date.now()),
            cloneSceneState39
          );
        }),
          nodeActionContext.storeInstance.addNode(
            buildSourceMediaNodePayload({
              id: id11,
              type: 'source-image',
              x: x12.x,
              y: x12.y,
              name: panoramaSceneText('capture.nodeName'),
              fileName: fileName5,
              capturePreviewUrl: capturePreviewUrl,
              captureSavePending: true,
              captureSaveError: null,
            }),
          ));
      }),
      commit(),
      showSuccess(panoramaSceneText('capture.success')),
      Promise.resolve()
        .then(() => saveBlob(enabled16, { ext: 'png' }))
        .then((value230) => {
          if (!nodeActionContext.storeInstance.getStateRaw().nodes?.[id11]) return;
          nodeActionContext.storeInstance.updateNodeData(
            id11,
            buildSavedCapturePatch(value230, {
              fileName: fileName5,
              width: width2.width,
              height: width2.height,
            }),
          );
        })
        .catch((error7) => {
          const captureSaveError = String(error7?.message || panoramaSceneText('capture.localSaveFailed'));
          (console.warn('[PanoramaScene] save capture failed:', error7),
            nodeActionContext.storeInstance.getStateRaw().nodes?.[id11] &&
              nodeActionContext.storeInstance.updateNodeData(id11, {
                captureSavePending: false,
                captureSaveError: captureSaveError,
              }),
            showWarning(panoramaSceneText('capture.localSaveWarning')));
        }),
      id11
    );
  } catch (error8) {
    const error9 = String(error8?.message || panoramaSceneText('capture.failed'));
    return (
      writeSceneState(nodeActionContext.storeInstance, nodeId39, (value231) => {
        const cloneSceneState40 = cloneSceneState(value231);
        return (
          (cloneSceneState40.capture.pending = false),
          (cloneSceneState40.capture.error = error9),
          cloneSceneState40
        );
      }),
      showError(panoramaSceneText('capture.failedWithError', { error: error9 })),
      null
    );
  }
}
export function renamePanoramaSceneCamera({
  nodeId: nodeId40,
  cameraId: cameraId4,
  name: name2,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId40, (value232) => {
    const cloneSceneState41 = cloneSceneState(value232);
    return (
      (cloneSceneState41.cameras = cloneSceneState41.cameras.map((error10) =>
        error10.id === cameraId4
          ? {
              ...error10,
              name:
                String(name2 || error10.name || panoramaSceneText('camera.fallbackName')).trim() || error10.name,
            }
          : error10,
      )),
      cloneSceneState41
    );
  });
}
export function setPanoramaSceneCollapsed({
  nodeId: nodeId41,
  isCollapsed: isCollapsed,
  enterEditingOnExpand: enterEditingOnExpand = false,
  storeInstance: storeInstance = appStore,
}) {
  const box20 = getStoreNode(storeInstance, nodeId41);
  if (!box20) return;
  const isCollapsed2 = typeof isCollapsed === 'boolean' ? isCollapsed : box20.isCollapsed !== true;
  if (isCollapsed2 === (box20.isCollapsed === true)) return;
  const value233 = enterEditingOnExpand === true && isCollapsed2 === false,
    _originalWidth =
      Number(box20._originalWidth) ||
      Number(box20.width) ||
      PANORAMA_SCENE_DEFAULT_SIZE.width,
    _originalHeight =
      Number(box20._originalHeight) ||
      Number(box20.height) ||
      PANORAMA_SCENE_DEFAULT_SIZE.height,
    box21 = computeCollapsedDimensions(_originalWidth, _originalHeight);
  (storeInstance.batch(() => {
    (writeSceneState(storeInstance, nodeId41, (value234) => {
      const cloneSceneState42 = cloneSceneState(value234);
      return (
        (cloneSceneState42.ui.isEditing = value233),
        (cloneSceneState42.ui.showCameraList = false),
        cloneSceneState42
      );
    }),
      storeInstance.updateNodeData(nodeId41, {
        isCollapsed: isCollapsed2,
        _originalWidth: _originalWidth,
        _originalHeight: _originalHeight,
        width: isCollapsed2 ? box21.width : _originalWidth,
        height: isCollapsed2 ? box21.height : _originalHeight,
      }));
  }),
    commit());
}
export function focusPanoramaSceneSelection({
  nodeId: nodeId42,
  frame: frame = null,
  storeInstance: storeInstance = appStore,
}) {
  const args11 = getSceneState(storeInstance, nodeId42),
    cameraId5 = getSelectedObject(args11);
  if (!cameraId5) return false;
  if (cameraId5.objectType === 'camera')
    return (
      activatePanoramaSceneCamera({
        nodeId: nodeId42,
        cameraId: cameraId5.item.id,
        storeInstance: storeInstance,
      }),
      true
    );
  const value235 = cameraId5.item,
    sceneObjectHeightOffset = getSceneObjectHeightOffset(cameraId5.objectType),
    value236 =
      Number.isFinite(Number(frame?.center?.x)) &&
      Number.isFinite(Number(frame?.center?.y)) &&
      Number.isFinite(Number(frame?.center?.z))
        ? {
            x: Number(frame.center.x),
            y: Number(frame.center.y),
            z: Number(frame.center.z),
          }
        : null,
    target3 = value236 || {
      x: Number(value235.position?.x) || 0,
      y: (Number(value235.position?.y) || 0) + sceneObjectHeightOffset,
      z: Number(value235.position?.z) || 0,
    };
  if (args11.mode === 'panorama') {
    const value237 = target3.x,
      value238 = target3.y - 1.6,
      value239 = target3.z,
      value240 = Math.hypot(value237, value238, value239) || 1;
    return (
      applyPanoramaSceneViewCommit({
        nodeId: nodeId42,
        panoramaView: {
          ...args11.viewport.panoramaView,
          yaw: Math.atan2(value237, value239 || 0.0001),
          pitch: clampPanoramaPitch(Math.asin(value238 / value240)),
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
      nodeId: nodeId42,
      sceneView: {
        ...args11.viewport.sceneView,
        target: target3,
        ...(Number.isFinite(Number(frame?.radius))
          ? {
              orbitDistance: computePerspectiveFrameDistance({
                radius: Number(frame.radius),
                fov: frame?.fov,
                aspect: frame?.aspect,
                padding: frame?.padding,
              }),
            }
          : {}),
      },
      activeView: 'default',
      activeCameraId: null,
      storeInstance: storeInstance,
    }),
    true
  );
}
