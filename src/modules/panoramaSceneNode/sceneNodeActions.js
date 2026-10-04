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
import {
  DEFAULT_MANNEQUIN_POSE_ID,
  createCustomMannequinPose,
  normalizeBonePose,
  normalizeCustomMannequinPose,
  resolveMannequinPose,
} from './poseCatalog.js';
import {
  normalizeCameraTimeline,
  removeCameraKeyframe,
  updateCameraTimelineSettings,
  upsertCameraKeyframe,
} from './cameraTimeline.js';
import { resolveSceneAsset } from './sceneAssetCatalog.js';
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
  if (!Number.isFinite(count) || !Number.isFinite(count2) || count <= 0 || count2 <= 0) return true;
  const data = count / count2;
  return Math.abs(data - EQUIRECTANGULAR_RATIO) <= EQUIRECTANGULAR_RATIO_TOLERANCE;
}
function getSceneState(options, target) {
  const storeNode = getStoreNode(options, target);
  if (!storeNode) return normalizeSceneOnlyPanoramaSceneState(null);
  const panoramaStateFieldByNodeType = getPanoramaStateFieldByNodeType(storeNode.type);
  return normalizeSceneStateByNode(
    storeNode,
    panoramaStateFieldByNodeType ? storeNode[panoramaStateFieldByNodeType] : null,
  );
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
  return (
    store2.updateNodeData(source, { [panoramaStateFieldByNodeType2]: sceneStateByNode2 }),
    sceneStateByNode2
  );
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
    quaternion = payload ? normalizeQuaternion(box2.quaternion, quaternionFromEulerXYZ(record)) : null,
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
  const x = Number(box3?.x),
    y = Number(box3?.y),
    z = Number(box3?.z),
    w = Number(box3?.w);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(w))
    return { ...args };
  const count3 = Math.hypot(x, y, z, w);
  if (count3 < 0.000001) return { ...args };
  return {
    x: x / count3,
    y: y / count3,
    z: z / count3,
    w: w / count3,
  };
}
function quaternionFromEulerYXZ(box4) {
  const handle = Number(box4?.x) || 0,
    state = Number(box4?.y) || 0,
    config = Number(box4?.z) || 0,
    y2 = Math.cos(handle / 2),
    scope = Math.cos(state / 2),
    input = Math.cos(config / 2),
    x2 = Math.sin(handle / 2),
    output = Math.sin(state / 2),
    value2 = Math.sin(config / 2);
  return normalizeQuaternion({
    x: x2 * scope * input + y2 * output * value2,
    y: y2 * output * input - x2 * scope * value2,
    z: y2 * scope * value2 - x2 * output * input,
    w: y2 * scope * input + x2 * output * value2,
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
    x3 = Math.asin(-clamp(value17, -1, 1));
  if (Math.abs(value17) < 0.9999999)
    return { x: x3, y: Math.atan2(value14, value19), z: Math.atan2(value15, value16) };
  return { x: x3, y: Math.atan2(-value18, value13), z: 0 };
}
function quaternionFromEulerXYZ(box6) {
  const value20 = Number(box6?.x) || 0,
    value21 = Number(box6?.y) || 0,
    value22 = Number(box6?.z) || 0,
    y3 = Math.cos(value20 / 2),
    value23 = Math.cos(value21 / 2),
    value24 = Math.cos(value22 / 2),
    x4 = Math.sin(value20 / 2),
    value25 = Math.sin(value21 / 2),
    value26 = Math.sin(value22 / 2);
  return normalizeQuaternion({
    x: x4 * value23 * value24 + y3 * value25 * value26,
    y: y3 * value25 * value24 - x4 * value23 * value26,
    z: y3 * value23 * value26 + x4 * value25 * value24,
    w: y3 * value23 * value24 - x4 * value25 * value26,
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
    y4 = Math.asin(clamp(value39, -1, 1));
  if (Math.abs(value39) < 0.9999999)
    return { x: Math.atan2(-value40, value41), y: y4, z: Math.atan2(-value38, value37) };
  return { x: Math.atan2(value42, value43), y: y4, z: 0 };
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
      if (list3.some((item2) => item2.camera?.id === camera2?.id)) return;
      const slot2 = run();
      if (!slot2) return;
      list3.push({ camera: camera2, slot: slot2 });
    }),
    list3.sort((item3, value49) => item3.slot - value49.slot)
  );
}
function resolveFirstFreeCameraSlot(list4 = []) {
  const map2 = new Set(resolveCameraSlotEntries(list4).map((item4) => item4.slot));
  for (let value50 = 1; value50 <= PANORAMA_SCENE_CAMERA_LIMIT; value50 += 1) {
    if (!map2.has(value50)) return value50;
  }
  return null;
}
function resolveCameraBySlot(list5 = [], value51) {
  const cameraSlot = normalizeCameraSlot(value51);
  if (!cameraSlot) return null;
  const camera3 = resolveCameraSlotEntries(list5).find((item5) => item5.slot === cameraSlot);
  return camera3 ? { camera: camera3.camera, slot: camera3.slot } : null;
}
function normalizeScaleVector(box8, value52 = 1) {
  if (Number.isFinite(box8)) {
    const x5 = Math.max(0.01, Number(box8) || Number(value52) || 1);
    return { x: x5, y: x5, z: x5 };
  }
  if (box8 && Number.isFinite(box8.x) && Number.isFinite(box8.y) && Number.isFinite(box8.z))
    return {
      x: Math.max(0.01, Number(box8.x) || 1),
      y: Math.max(0.01, Number(box8.y) || 1),
      z: Math.max(0.01, Number(box8.z) || 1),
    };
  const x6 = Math.max(0.01, Number(value52) || 1);
  return { x: x6, y: x6, z: x6 };
}
function composeCompatibleScale(value53, value54 = 1) {
  if (value53 == null) return value54;
  if (Number.isFinite(value53)) return Math.max(0.01, Math.min(8, Number(value53) || 1));
  const box9 = normalizeScaleVector(value53, value54),
    value55 = 0.0001;
  if (Math.abs(box9.x - box9.y) < value55 && Math.abs(box9.y - box9.z) < value55)
    return Math.max(0.01, Math.min(8, (box9.x + box9.y + box9.z) / 3));
  return {
    x: Math.max(0.01, Math.min(8, box9.x)),
    y: Math.max(0.01, Math.min(8, box9.y)),
    z: Math.max(0.01, Math.min(8, box9.z)),
  };
}
function clamp(value56, value57, value58) {
  return Math.min(value58, Math.max(value57, value56));
}
function computeCollapsedDimensions(value59, value60) {
  const value61 = Math.max(180, Number(value59) || PANORAMA_SCENE_DEFAULT_SIZE.width),
    value62 = Math.max(140, Number(value60) || PANORAMA_SCENE_DEFAULT_SIZE.height),
    value63 = Math.min(value61, value62),
    value64 = value63 > PANORAMA_SCENE_COLLAPSED_MAX_SIZE ? PANORAMA_SCENE_COLLAPSED_MAX_SIZE / value63 : 1;
  return { width: Math.round(value61 * value64), height: Math.round(value62 * value64) };
}
function getSelectedObject(value65) {
  const { selectedObjectType: selectedObjectType, selectedObjectId: selectedObjectId } =
    value65?.selection || {};
  if (!selectedObjectType || !selectedObjectId) return null;
  const list6 = getSceneObjectList(value65, selectedObjectType),
    item6 = list6.find((item7) => item7.id === selectedObjectId) || null;
  if (!item6) return null;
  return { objectType: selectedObjectType, item: item6 };
}
function getSceneObjectList(value66, value67) {
  if (value67 === 'camera') return Array.isArray(value66?.cameras) ? value66.cameras : [];
  if (value67 === 'cube') return Array.isArray(value66?.cubes) ? value66.cubes : [];
  return Array.isArray(value66?.mannequins) ? value66.mannequins : [];
}
function getSceneObjectHeightOffset(value68) {
  if (value68 === 'cube') return 0;
  if (value68 === 'mannequin') return 1.1;
  return 0;
}
function getSelectionPoolByType(value69, value70) {
  if (value70 === 'cube') return Array.isArray(value69?.cubes) ? value69.cubes : [];
  if (value70 === 'mannequin') return Array.isArray(value69?.mannequins) ? value69.mannequins : [];
  return [];
}
function normalizeSelectionObjectsInput(value71, value72 = []) {
  const map3 = new Set(),
    list7 = [],
    list8 = Array.isArray(value72) ? value72 : [];
  return (
    list8.forEach((item8) => {
      const objectType =
          item8?.objectType === 'cube' || item8?.objectType === 'mannequin' ? item8.objectType : null,
        objectId = String(item8?.objectId || '').trim();
      if (!objectType || !objectId) return;
      const selectionPoolByType = getSelectionPoolByType(value71, objectType).some(
        (item9) => item9.id === objectId,
      );
      if (!selectionPoolByType) return;
      const value73 = objectType + ':' + objectId;
      if (map3.has(value73)) return;
      (map3.add(value73), list7.push({ objectType: objectType, objectId: objectId }));
    }),
    list7
  );
}
function collectSelectionObjects(value74) {
  const list9 = normalizeSelectionObjectsInput(value74, value74?.selection?.selectedObjects || []);
  if (list9.length > 0) return list9;
  const objectType2 =
    value74?.selection?.selectedObjectType === 'cube' ||
    value74?.selection?.selectedObjectType === 'mannequin'
      ? value74.selection.selectedObjectType
      : null;
  if (!objectType2) return [];
  const list10 = Array.isArray(value74?.selection?.selectedObjectIds)
    ? value74.selection.selectedObjectIds
    : value74?.selection?.selectedObjectId
      ? [value74.selection.selectedObjectId]
      : [];
  return normalizeSelectionObjectsInput(
    value74,
    list10.map((objectId2) => ({ objectType: objectType2, objectId: objectId2 })),
  );
}
function clearSelection(value75) {
  ((value75.selection.selectedObjectType = null),
    (value75.selection.selectedObjectId = null),
    (value75.selection.selectedObjectIds = []),
    (value75.selection.selectedObjects = []),
    (value75.selection.selectedGroupId = null));
}
function setSelectionFromObjects(
  value76,
  value77,
  {
    preferredGroupId: preferredGroupId = null,
    preferredActiveType: preferredActiveType = null,
    preferredActiveId: preferredActiveId = null,
  } = {},
) {
  const list11 = normalizeSelectionObjectsInput(value76, value77);
  if (list11.length === 0) {
    clearSelection(value76);
    return;
  }
  const value78 = preferredGroupId ? String(preferredGroupId) : null;
  if (value78) {
    const args2 = (value76.groups || []).find((item10) => item10.id === value78);
    if (args2) {
      const list12 = list11
          .filter((item11) => item11.objectType === 'mannequin')
          .map((item12) => item12.objectId),
        map4 = new Set(list12),
        value79 =
          list11.every((item13) => item13.objectType === 'mannequin') &&
          args2.memberIds.length > 0 &&
          args2.memberIds.length === list12.length &&
          args2.memberIds.every((item14) => map4.has(item14));
      if (value79) {
        ((value76.selection.selectedObjectType = 'mannequin'),
          (value76.selection.selectedObjectId = args2.memberIds[0] || null),
          (value76.selection.selectedObjectIds = [...args2.memberIds]),
          (value76.selection.selectedObjects = args2.memberIds.map((objectId3) => ({
            objectType: 'mannequin',
            objectId: objectId3,
          }))),
          (value76.selection.selectedGroupId = value78));
        return;
      }
    }
  }
  const value80 =
      preferredActiveType === 'cube' || preferredActiveType === 'mannequin' ? preferredActiveType : null,
    value81 =
      value80 && list11.some((item15) => item15.objectType === value80) ? value80 : list11[0].objectType,
    value82 = list11.filter((item16) => item16.objectType === value81).map((item17) => item17.objectId),
    value83 =
      preferredActiveId &&
      list11.some((item18) => item18.objectType === value81 && item18.objectId === preferredActiveId)
        ? preferredActiveId
        : value82[0] || null;
  ((value76.selection.selectedObjectType = value81),
    (value76.selection.selectedObjectId = value83),
    (value76.selection.selectedObjectIds = value82),
    (value76.selection.selectedObjects = list11),
    (value76.selection.selectedGroupId = null));
}
function setSingleSelection(value84, objectType3, objectId4) {
  setSelectionFromObjects(
    value84,
    objectType3 && objectId4 ? [{ objectType: objectType3, objectId: objectId4 }] : [],
    { preferredActiveType: objectType3, preferredActiveId: objectId4 || null },
  );
}
function finalizeSelectedObjectRemoval(value85, value86, value87) {
  const preferredActiveType2 = cloneSceneState(value85),
    selectionObjects = collectSelectionObjects(preferredActiveType2).filter(
      (item19) => !(item19.objectType === value86 && item19.objectId === value87),
    );
  return (
    setSelectionFromObjects(preferredActiveType2, selectionObjects, {
      preferredActiveType: preferredActiveType2?.selection?.selectedObjectType || null,
      preferredActiveId: preferredActiveType2?.selection?.selectedObjectId || null,
      preferredGroupId: preferredActiveType2?.selection?.selectedGroupId || null,
    }),
    value86 === 'camera' &&
      preferredActiveType2.viewport.activeCameraId === value87 &&
      ((preferredActiveType2.viewport.activeCameraId = null),
      (preferredActiveType2.viewport.activeView = 'default')),
    preferredActiveType2
  );
}
function pruneGroups(list13, list14 = []) {
  if (!Array.isArray(list13)) return [];
  if (!Array.isArray(list14) || list14.length === 0) return list13;
  const map5 = new Set(list14);
  return list13
    .map((args3) => ({
      ...args3,
      memberIds: Array.isArray(args3.memberIds) ? args3.memberIds.filter((item20) => !map5.has(item20)) : [],
    }))
    .filter((item21) => item21.memberIds.length > 0);
}
function resolveGroupByMember(value88, value89, enabled2) {
  if (value89 !== 'mannequin' || !enabled2) return null;
  const list15 = Array.isArray(value88?.groups) ? value88.groups : [];
  return list15.find((item22) => item22.memberIds?.includes(enabled2)) || null;
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
  const value90 = Number(globalThis?.window?.v2NodeSpacing);
  return Number.isFinite(value90) ? Math.max(0, value90) : DEFAULT_NODE_SPAWN_SPACING;
}
function shouldAvoidNodeOverlap() {
  return globalThis?.window?.v2NodeAvoidOverlap !== false;
}
function isPanorama360IncomingImageSourceType(value91) {
  return PANORAMA_360_IMAGE_SOURCE_TYPES.has(String(value91 || '').trim());
}
function pickFirstNonEmptyString(...args4) {
  for (const value92 of args4) {
    const value93 = String(value92 || '').trim();
    if (value93) return value93;
  }
  return '';
}
function inferFileNameFromPath(value94) {
  const enabled3 = String(value94 || '').trim();
  if (!enabled3) return '';
  const value95 = enabled3.split('?')[0].split('#')[0],
    list16 = value95.split(/[\\/]/).filter(Boolean);
  return list16.length > 0 ? list16[list16.length - 1] : '';
}
function resolveMainImageEntry(value96) {
  const list17 = Array.isArray(value96?.images) ? value96.images : [];
  if (list17.length <= 0) return null;
  const value97 = Number(value96?.mainImageIndex),
    value98 = Number.isFinite(value97) ? Math.max(0, Math.min(list17.length - 1, Math.trunc(value97))) : 0;
  return list17[value98] || list17[0] || null;
}
function resolveMainImageIndex(value99) {
  const list18 = Array.isArray(value99?.images) ? value99.images : [];
  if (list18.length <= 0) return 0;
  const value100 = Number(value99?.mainImageIndex);
  if (!Number.isFinite(value100)) return 0;
  return Math.max(0, Math.min(list18.length - 1, Math.trunc(value100)));
}
function resolvePanoramaImagePayloadFromSourceNode(enabled4) {
  if (!enabled4 || !isPanorama360IncomingImageSourceType(enabled4.type)) return null;
  const response = resolveMainImageEntry(enabled4),
    localPath = pickFirstNonEmptyString(response?.localPath, enabled4.localPath),
    imageUrl = pickFirstNonEmptyString(
      response?.imageUrl,
      response?.src,
      response?.sourceUrl,
      response?.url,
      enabled4.imageUrl,
      enabled4.src,
      enabled4.sourceUrl,
      enabled4.thumbUrl,
    );
  if (!localPath && !imageUrl) return null;
  const fileName = pickFirstNonEmptyString(
    response?.fileName,
    enabled4.fileName,
    inferFileNameFromPath(localPath),
    inferFileNameFromPath(imageUrl),
  );
  return {
    localPath: localPath || null,
    imageUrl: imageUrl || null,
    fileName: fileName || null,
    mainImageIndex: resolveMainImageIndex(enabled4),
  };
}
function buildPanoramaSourceSignature(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object') return '';
  return JSON.stringify({
    localPath: String(enabled5.localPath || '').trim(),
    imageUrl: String(enabled5.imageUrl || '').trim(),
    fileName: String(enabled5.fileName || '').trim(),
    mainImageIndex: Number(enabled5.mainImageIndex || 0) || 0,
  });
}
function hasPersistentPanoramaLocalPath(value101) {
  const enabled6 = String(value101 || '').trim();
  if (!enabled6) return false;
  return !/^(blob:|data:|https?:)/i.test(enabled6);
}
function bumpPanorama360SyncVersion(value102) {
  const value103 = String(value102 || '').trim(),
    value104 = Number(_panorama360SyncVersionByNodeId.get(value103) || 0) + 1;
  return (_panorama360SyncVersionByNodeId.set(value103, value104), value104);
}
function isPanorama360SyncCurrent(value105, value106) {
  return (
    Number(_panorama360SyncVersionByNodeId.get(String(value105 || '').trim()) || 0) === Number(value106 || 0)
  );
}
function getPanoramaIncomingEdgeSortValue(value107) {
  const count5 = Number(value107?.createdAt);
  if (Number.isFinite(count5) && count5 > 0) return count5;
  const count6 = Number(value107?.updatedAt);
  if (Number.isFinite(count6) && count6 > 0) return count6;
  return 0;
}
function comparePanoramaIncomingCandidatesDesc(value108, value109) {
  const panoramaIncomingEdgeSortValue =
    getPanoramaIncomingEdgeSortValue(value109.edge) - getPanoramaIncomingEdgeSortValue(value108.edge);
  if (panoramaIncomingEdgeSortValue !== 0) return panoramaIncomingEdgeSortValue;
  return String(value109.edge?.id || '').localeCompare(String(value108.edge?.id || ''));
}
function buildPanoramaUploadSourceNodeData({
  storeInstance: storeInstance3,
  anchorNode: anchorNode,
  localPath: localPath2,
  imageUrl: imageUrl2,
  fileName: fileName2,
  uploadedSize: uploadedSize,
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
      fileName: fileName2 || '',
      ...(naturalWidth > 0 && naturalHeight > 0
        ? { naturalWidth: naturalWidth, naturalHeight: naturalHeight }
        : null),
    }),
    nodeSpawnSpacing = resolveNodeSpawnSpacing(),
    value110 = Number(anchorNode.x) || 0,
    value111 = Number(anchorNode.y) || 0,
    value112 = Number(anchorNode.height) || box10.height,
    x7 = value110 - box10.width - nodeSpawnSpacing,
    y5 = value111 + Math.round((value112 - box10.height) / 2),
    value113 = storeInstance3.getStateRaw?.().nodes || {},
    x8 = shouldAvoidNodeOverlap()
      ? findAvailablePosition(value113, x7, y5, box10.width, box10.height, nodeSpawnSpacing, 'left')
      : { x: x7, y: y5 };
  return { ...box10, id: generateId('source-image'), x: x8.x, y: x8.y };
}
export function setPanoramaSceneMode({
  nodeId: nodeId,
  mode: mode,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId, (value114, value115) => {
    const cloneSceneState2 = cloneSceneState(value114);
    return (
      (cloneSceneState2.mode = isPanorama360NodeType(value115?.type) ? 'panorama' : 'scene'),
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
  writeSceneState(storeInstance, nodeId2, (value116) => {
    const cloneSceneState3 = cloneSceneState(value116);
    return (
      (cloneSceneState3.environmentMode = environmentMode2 === 'night' ? 'night' : 'day'),
      cloneSceneState3
    );
  });
}
export function setPanoramaSceneTool({
  nodeId: nodeId3,
  tool: tool,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId3, (value117) => {
    const cloneSceneState4 = cloneSceneState(value117),
      value118 =
        tool === 'move' || tool === 'rotate' || tool === 'scale' || tool === 'box-select' ? tool : 'navigate';
    return (
      value118 === 'box-select' || value118 === 'navigate'
        ? (cloneSceneState4.ui.mouseTool = value118)
        : (cloneSceneState4.ui.transformTool = value118),
      (cloneSceneState4.ui.activeTool = value118),
      cloneSceneState4
    );
  });
}
export function setPanoramaSceneTransformSpace({
  nodeId: nodeId4,
  transformSpace: transformSpace,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId4, (value119) => {
    const cloneSceneState5 = cloneSceneState(value119);
    return ((cloneSceneState5.ui.transformSpace = 'local'), cloneSceneState5);
  });
}
export function setPanoramaScenePivotMode({
  nodeId: nodeId5,
  pivotMode: pivotMode,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId5, (value120) => {
    const cloneSceneState6 = cloneSceneState(value120);
    return ((cloneSceneState6.ui.pivotMode = 'active'), cloneSceneState6);
  });
}
export function setPanoramaSceneNavigationPreset({
  nodeId: nodeId6,
  navigationPreset: navigationPreset,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId6, (value121) => {
    const cloneSceneState7 = cloneSceneState(value121);
    return (
      (cloneSceneState7.ui.navigationPreset = navigationPreset === 'dcc' ? 'dcc' : 'dcc'),
      cloneSceneState7
    );
  });
}
export function setPanoramaSceneEditing({
  nodeId: nodeId7,
  isEditing: isEditing,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId7, (value122) => {
    const cloneSceneState8 = cloneSceneState(value122);
    return (
      (cloneSceneState8.ui.isEditing = isEditing === true),
      !cloneSceneState8.ui.isEditing && (cloneSceneState8.ui.showCameraList = false),
      cloneSceneState8
    );
  });
}
export function setPanoramaSceneSelection({
  nodeId: nodeId8,
  objectType: objectType4,
  objectId: objectId5,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId8, (value123) => {
    const cloneSceneState9 = cloneSceneState(value123);
    if (objectType4 === 'camera') return cloneSceneState9;
    const objectType5 = objectType4 === 'mannequin' || objectType4 === 'cube' ? objectType4 : null,
      preferredActiveId2 = objectId5 ? String(objectId5) : null;
    if (!objectType5 || !preferredActiveId2) return (clearSelection(cloneSceneState9), cloneSceneState9);
    const preferredGroupId2 = resolveGroupByMember(cloneSceneState9, objectType5, preferredActiveId2);
    if (preferredGroupId2)
      return (
        setSelectionFromObjects(
          cloneSceneState9,
          preferredGroupId2.memberIds.map((objectId6) => ({ objectType: 'mannequin', objectId: objectId6 })),
          {
            preferredGroupId: preferredGroupId2.id,
            preferredActiveType: 'mannequin',
            preferredActiveId: preferredActiveId2,
          },
        ),
        cloneSceneState9
      );
    return (
      setSelectionFromObjects(cloneSceneState9, [{ objectType: objectType5, objectId: preferredActiveId2 }], {
        preferredActiveType: objectType5,
        preferredActiveId: preferredActiveId2,
      }),
      cloneSceneState9
    );
  });
}
export function setPanoramaSceneSelectionBatch({
  nodeId: nodeId9,
  objectType: objectType6,
  objectIds: objectIds = [],
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId9, (value124) => {
    const cloneSceneState10 = cloneSceneState(value124);
    if (objectType6 === 'camera') return cloneSceneState10;
    const objectType7 = objectType6 === 'mannequin' || objectType6 === 'cube' ? objectType6 : null,
      preferredActiveId3 = [
        ...new Set(
          (Array.isArray(objectIds) ? objectIds : [])
            .map((item23) => String(item23 || '').trim())
            .filter(Boolean),
        ),
      ];
    if (!objectType7 || preferredActiveId3.length === 0)
      return (clearSelection(cloneSceneState10), cloneSceneState10);
    let preferredGroupId3 = groupId ? String(groupId) : null;
    if (preferredGroupId3) {
      const preferredActiveId4 = (cloneSceneState10.groups || []).find(
        (item24) => item24.id === preferredGroupId3,
      );
      if (!preferredActiveId4) preferredGroupId3 = null;
      else
        return (
          setSelectionFromObjects(
            cloneSceneState10,
            preferredActiveId4.memberIds.map((objectId7) => ({
              objectType: 'mannequin',
              objectId: objectId7,
            })),
            {
              preferredGroupId: preferredGroupId3,
              preferredActiveType: 'mannequin',
              preferredActiveId: preferredActiveId4.memberIds[0] || null,
            },
          ),
          cloneSceneState10
        );
    }
    return (
      setSelectionFromObjects(
        cloneSceneState10,
        preferredActiveId3.map((objectId8) => ({ objectType: objectType7, objectId: objectId8 })),
        { preferredActiveType: objectType7, preferredActiveId: preferredActiveId3[0] || null },
      ),
      cloneSceneState10
    );
  });
}
export function setPanoramaSceneSelectionObjects({
  nodeId: nodeId10,
  objects: objects = [],
  activeObjectType: activeObjectType = null,
  activeObjectId: activeObjectId = null,
  groupId: groupId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId10, (value125) => {
    const cloneSceneState11 = cloneSceneState(value125);
    return (
      setSelectionFromObjects(cloneSceneState11, objects, {
        preferredGroupId: groupId,
        preferredActiveType: activeObjectType,
        preferredActiveId: activeObjectId,
      }),
      cloneSceneState11
    );
  });
}
export function clearPanoramaSceneSelection({ nodeId: nodeId11, storeInstance: storeInstance = appStore }) {
  setPanoramaSceneSelection({
    nodeId: nodeId11,
    objectType: null,
    objectId: null,
    storeInstance: storeInstance,
  });
}
export function setPanoramaSceneCameraListVisible({
  nodeId: nodeId12,
  visible: visible,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId12, (value126) => {
    const cloneSceneState12 = cloneSceneState(value126);
    return ((cloneSceneState12.ui.showCameraList = visible === true), cloneSceneState12);
  });
}
export function setPanoramaSceneGridPlacement({
  nodeId: nodeId13,
  patch: patch2,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId13, (value127) => {
    const args5 = cloneSceneState(value127);
    return (
      (args5.gridPlacement = { ...args5.gridPlacement, ...(patch2 || {}) }),
      normalizePanoramaSceneState(args5)
    );
  });
}
export function resetPanoramaSceneView({ nodeId: nodeId14, storeInstance: storeInstance = appStore }) {
  writeSceneState(storeInstance, nodeId14, (value128) => {
    const cloneSceneState13 = cloneSceneState(value128);
    return (
      (cloneSceneState13.viewport.activeView = 'default'),
      (cloneSceneState13.viewport.activeCameraId = null),
      cloneSceneState13.mode === 'panorama'
        ? (cloneSceneState13.viewport.panoramaView = createDefaultPanoramaView())
        : (cloneSceneState13.viewport.sceneView = createDefaultSceneView()),
      cloneSceneState13
    );
  });
}
export function applyPanoramaSceneViewCommit({
  nodeId: nodeId15,
  sceneView: sceneView,
  panoramaView: panoramaView,
  activeView: activeView = 'default',
  activeCameraId: activeCameraId = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId15, (value129) => {
    const args6 = cloneSceneState(value129);
    return (
      (args6.viewport.activeView = activeView === 'camera' ? 'camera' : 'default'),
      (args6.viewport.activeCameraId =
        args6.viewport.activeView === 'camera' && activeCameraId ? String(activeCameraId) : null),
      sceneView && (args6.viewport.sceneView = { ...args6.viewport.sceneView, ...sceneView }),
      panoramaView && (args6.viewport.panoramaView = { ...args6.viewport.panoramaView, ...panoramaView }),
      normalizePanoramaSceneState(args6)
    );
  });
}
export function activatePanoramaSceneCamera({
  nodeId: nodeId16,
  cameraId: cameraId,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode3 = getStoreNode(storeInstance, nodeId16);
  if (isPanorama360NodeType(storeNode3?.type)) return;
  writeSceneState(storeInstance, nodeId16, (value130) => {
    const cloneSceneState14 = cloneSceneState(value130),
      enabled7 = cloneSceneState14.cameras.find((item25) => item25.id === cameraId) || null;
    if (!enabled7) return cloneSceneState14;
    return (
      cloneSceneState14.mode === 'panorama'
        ? ((cloneSceneState14.viewport.activeView = 'camera'),
          (cloneSceneState14.viewport.activeCameraId = String(cameraId)),
          (cloneSceneState14.viewport.panoramaView = cameraPoseToPanoramaView(enabled7)))
        : ((cloneSceneState14.viewport.activeView = 'default'),
          (cloneSceneState14.viewport.activeCameraId = null),
          (cloneSceneState14.viewport.sceneView = cameraPoseToSceneViewFromReference(
            enabled7,
            cloneSceneState14.viewport.sceneView || createDefaultSceneView(),
          ))),
      cloneSceneState14
    );
  });
}
export function setPanoramaSceneCaptureMode({
  nodeId: nodeId17,
  mode: mode2,
  showSafeFrame: showSafeFrame = true,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId17, (value131) => {
    const cloneSceneState15 = cloneSceneState(value131),
      value132 = mode2 === '9:16' || mode2 === '2.35:1' ? mode2 : 'adaptive';
    return (
      (cloneSceneState15.capture.mode = value132),
      (cloneSceneState15.capture.showSafeFrame = value132 === 'adaptive' ? false : showSafeFrame === true),
      normalizePanoramaSceneState(cloneSceneState15)
    );
  });
}
export function setPanoramaSceneSafeFrameVisible({
  nodeId: nodeId18,
  visible: visible2,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId18, (value133) => {
    const cloneSceneState16 = cloneSceneState(value133);
    return (
      (cloneSceneState16.capture.showSafeFrame = visible2 === true),
      normalizePanoramaSceneState(cloneSceneState16)
    );
  });
}
export function activatePanoramaSceneCameraSlot({
  nodeId: nodeId19,
  slot: slot3,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode4 = getStoreNode(storeInstance, nodeId19);
  if (isPanorama360NodeType(storeNode4?.type)) return null;
  const sceneState = getSceneState(storeInstance, nodeId19),
    cameraId2 = resolveCameraBySlot(sceneState.cameras, slot3);
  if (!cameraId2?.camera?.id) return null;
  return (
    activatePanoramaSceneCamera({
      nodeId: nodeId19,
      cameraId: cameraId2.camera.id,
      storeInstance: storeInstance,
    }),
    cameraId2.camera.id
  );
}
export function upsertPanoramaSceneCameraAtSlot({
  nodeId: nodeId20,
  slot: slot4,
  viewPose: viewPose2,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode5 = getStoreNode(storeInstance, nodeId20);
  if (isPanorama360NodeType(storeNode5?.type)) return null;
  const slot5 = normalizeCameraSlot(slot4);
  if (!slot5) return null;
  const sceneState2 = getSceneState(storeInstance, nodeId20),
    position2 = sanitizeCameraPose(viewPose2),
    cameraBySlot = resolveCameraBySlot(sceneState2.cameras, slot5);
  let value134 = cameraBySlot?.camera?.id || null,
    enabled8 = false;
  writeSceneState(storeInstance, nodeId20, (value135) => {
    const cloneSceneState17 = cloneSceneState(value135),
      cameraBySlot2 = resolveCameraBySlot(cloneSceneState17.cameras, slot5);
    if (cameraBySlot2?.camera?.id) {
      const value136 = cameraBySlot2.camera.id;
      return (
        (value134 = value136),
        (cloneSceneState17.cameras = cloneSceneState17.cameras.map((name) =>
          name.id === value136
            ? {
                ...name,
                slot: slot5,
                name:
                  name.name || panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(slot5) }),
                position: position2.position,
                quaternion: position2.quaternion,
                rotation: position2.rotation,
                focalLength: position2.focalLength,
              }
            : name,
        )),
        cloneSceneState17.mode === 'panorama' &&
          ((cloneSceneState17.viewport.activeCameraId = value136),
          (cloneSceneState17.viewport.activeView = 'camera')),
        (enabled8 = true),
        cloneSceneState17
      );
    }
    if (cloneSceneState17.cameras.length >= PANORAMA_SCENE_CAMERA_LIMIT) return cloneSceneState17;
    const id = generateId('scene-camera');
    return (
      (value134 = id),
      cloneSceneState17.cameras.push({
        id: id,
        slot: slot5,
        name: panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(slot5) }),
        position: position2.position,
        quaternion: position2.quaternion,
        rotation: position2.rotation,
        focalLength: position2.focalLength,
      }),
      cloneSceneState17.mode === 'panorama' &&
        ((cloneSceneState17.viewport.activeCameraId = id),
        (cloneSceneState17.viewport.activeView = 'camera')),
      (enabled8 = true),
      cloneSceneState17
    );
  });
  if (!enabled8)
    return (
      showWarning(panoramaSceneText('camera.limitWarning', { count: PANORAMA_SCENE_CAMERA_LIMIT })),
      null
    );
  return (commit(), value134);
}
export function activatePanoramaSceneDefaultView({
  nodeId: nodeId21,
  pose: pose,
  storeInstance: storeInstance = appStore,
}) {
  const sceneState3 = getSceneState(storeInstance, nodeId21);
  if (sceneState3.mode === 'panorama') {
    const panoramaView2 = pose ? cameraPoseToPanoramaView(pose) : sceneState3.viewport.panoramaView;
    applyPanoramaSceneViewCommit({
      nodeId: nodeId21,
      panoramaView: panoramaView2,
      activeView: 'default',
      activeCameraId: null,
      storeInstance: storeInstance,
    });
    return;
  }
  const sceneView2 = pose
    ? cameraPoseToSceneViewFromReference(pose, sceneState3.viewport.sceneView || createDefaultSceneView())
    : sceneState3.viewport.sceneView;
  applyPanoramaSceneViewCommit({
    nodeId: nodeId21,
    sceneView: sceneView2,
    activeView: 'default',
    activeCameraId: null,
    storeInstance: storeInstance,
  });
}
export async function uploadPanoramaSceneImage({
  nodeId: nodeId22,
  file: file,
  storeInstance: storeInstance = appStore,
  getCurrentProjectId: getCurrentProjectId = () => window.currentProjectId || 'default_v2_project',
}) {
  if (!file) return null;
  const anchorNode2 = getStoreNode(storeInstance, nodeId22);
  if (!anchorNode2) return null;
  if (!isPanorama360NodeType(anchorNode2.type))
    return (showWarning(panoramaSceneText('upload.unsupportedNode')), null);
  try {
    const response2 = await uploadFile(file, getCurrentProjectId()),
      fileName3 = response2.filename || file.name,
      localPath3 = pickResultLocalPath(response2),
      imageUrl3 = localPathToUrl(localPath3) || String(response2.url || '').trim() || null,
      width = await resolveOutputMediaSize({ localPath: localPath3, imageUrl: imageUrl3 });
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
        imageUrl: imageUrl3,
        fileName: fileName3,
        uploadedSize: width,
      }),
      createdAt = Date.now();
    return (
      storeInstance.batch(() => {
        (writeSceneState(storeInstance, nodeId22, (value137) => {
          const cloneSceneState18 = cloneSceneState(value137);
          return (
            (cloneSceneState18.mode = 'panorama'),
            (cloneSceneState18.viewport.activeView = 'default'),
            (cloneSceneState18.viewport.activeCameraId = null),
            (cloneSceneState18.panorama = {
              localPath: localPath3,
              imageUrl: imageUrl3,
              fileName: fileName3,
              sourceSignature: null,
              isLoaded: false,
              error: null,
            }),
            cloneSceneState18
          );
        }),
          sourceId &&
            (storeInstance.addNode(sourceId),
            storeInstance.addEdge({
              id: generateId('edge'),
              sourceId: sourceId.id,
              targetId: nodeId22,
              createdAt: createdAt,
            })),
          storeInstance.setSelectedNodes([nodeId22]));
      }),
      commit(),
      showSuccess(panoramaSceneText('upload.success')),
      { localPath: localPath3, imageUrl: imageUrl3, fileName: fileName3, sourceNodeId: sourceId?.id || null }
    );
  } catch (error2) {
    const error3 = String(error2?.message || panoramaSceneText('upload.failed'));
    return (
      writeSceneState(storeInstance, nodeId22, (value138) => {
        const cloneSceneState19 = cloneSceneState(value138);
        return (
          (cloneSceneState19.panorama.error = error3),
          (cloneSceneState19.panorama.isLoaded = false),
          cloneSceneState19
        );
      }),
      showError(panoramaSceneText('upload.failedWithError', { error: error3 })),
      null
    );
  }
}
export function syncPanorama360FromIncomingImageEdge({
  nodeId: nodeId23,
  storeInstance: storeInstance = appStore,
}) {
  const value139 = String(nodeId23 || '').trim(),
    storeNode6 = getStoreNode(storeInstance, value139);
  if (!storeNode6 || !isPanorama360NodeType(storeNode6.type))
    return (bumpPanorama360SyncVersion(value139), null);
  const value140 =
      typeof storeInstance?.getIncomingEdges === 'function'
        ? storeInstance.getIncomingEdges(value139)
        : Object.values(storeInstance.getStateRaw?.().edges || {}).filter(
            (item26) => item26?.targetId === value139,
          ),
    value141 = storeInstance.getStateRaw?.().nodes || {},
    value142 = (Array.isArray(value140) ? value140 : [])
      .map((edge) => {
        const sourceNode = value141[edge?.sourceId] || null,
          payload2 = resolvePanoramaImagePayloadFromSourceNode(sourceNode);
        if (!sourceNode || !payload2) return null;
        return { edge: edge, sourceNode: sourceNode, payload: payload2 };
      })
      .filter(Boolean)
      .sort(comparePanoramaIncomingCandidatesDesc),
    sourceNodeId = value142[0] || null;
  if (!sourceNodeId?.payload) return (bumpPanorama360SyncVersion(value139), null);
  const sourceSignature = buildPanoramaSourceSignature(sourceNodeId.payload),
    sceneState4 = getSceneState(storeInstance, value139),
    enabled9 = sceneState4?.panorama || {},
    value143 = enabled9.isLoaded === false && !enabled9.error,
    value144 =
      String(enabled9.sourceSignature || '') === sourceSignature &&
      hasPersistentPanoramaLocalPath(enabled9.localPath);
  if (value144) {
    const args7 = {
      localPath: String(enabled9.localPath || '').trim() || sourceNodeId.payload.localPath,
      imageUrl: String(enabled9.imageUrl || '').trim() || sourceNodeId.payload.imageUrl,
      fileName: String(enabled9.fileName || '').trim() || sourceNodeId.payload.fileName,
      sourceSignature: sourceSignature,
      isLoaded: false,
      error: null,
    };
    if (value143) return { ...args7, sourceNodeId: sourceNodeId.sourceNode.id, updated: false };
    return (
      writeSceneState(storeInstance, value139, (value145) => {
        const cloneSceneState20 = cloneSceneState(value145);
        return (
          (cloneSceneState20.mode = 'panorama'),
          (cloneSceneState20.viewport.activeView = 'default'),
          (cloneSceneState20.viewport.activeCameraId = null),
          (cloneSceneState20.panorama = args7),
          cloneSceneState20
        );
      }),
      { ...args7, sourceNodeId: sourceNodeId.sourceNode.id, updated: true }
    );
  }
  const value146 = _panorama360SyncInflightByNodeId.get(value139);
  if (value146?.signature === sourceSignature && value146?.promise) return value146.promise;
  const version = bumpPanorama360SyncVersion(value139),
    promise = (async () => {
      try {
        const localPath4 = await ensurePersistedPanoramaInputPng({
          localPath: sourceNodeId.payload.localPath,
          imageUrl: sourceNodeId.payload.imageUrl,
          fileName: sourceNodeId.payload.fileName,
          sourceSignature: sourceSignature,
        });
        if (!isPanorama360SyncCurrent(value139, version))
          return { ...localPath4, sourceNodeId: sourceNodeId.sourceNode.id, updated: false, stale: true };
        const storeNode7 = getStoreNode(storeInstance, value139);
        if (!storeNode7 || !isPanorama360NodeType(storeNode7.type)) return null;
        const sceneState5 = getSceneState(storeInstance, value139),
          enabled10 = sceneState5?.panorama || {},
          args8 = {
            localPath: localPath4.localPath,
            imageUrl: localPath4.imageUrl,
            fileName: localPath4.fileName,
            sourceSignature: sourceSignature,
            isLoaded: false,
            error: null,
          },
          value147 =
            String(enabled10.localPath || '') === String(args8.localPath || '') &&
            String(enabled10.imageUrl || '') === String(args8.imageUrl || '') &&
            String(enabled10.fileName || '') === String(args8.fileName || '') &&
            String(enabled10.sourceSignature || '') === sourceSignature,
          value148 = enabled10.isLoaded === false && !enabled10.error;
        if (value147 && value148)
          return { ...args8, sourceNodeId: sourceNodeId.sourceNode.id, updated: false };
        return (
          writeSceneState(storeInstance, value139, (value149) => {
            const cloneSceneState21 = cloneSceneState(value149);
            return (
              (cloneSceneState21.mode = 'panorama'),
              (cloneSceneState21.viewport.activeView = 'default'),
              (cloneSceneState21.viewport.activeCameraId = null),
              (cloneSceneState21.panorama = args8),
              cloneSceneState21
            );
          }),
          { ...args8, sourceNodeId: sourceNodeId.sourceNode.id, updated: true }
        );
      } catch (error4) {
        if (!isPanorama360SyncCurrent(value139, version))
          return {
            updated: false,
            stale: true,
            error: String(error4?.message || error4 || panoramaSceneText('errors.unknown')),
          };
        const error5 = String(error4?.message || panoramaSceneText('errors.pngNormalizeFailed'));
        return (showError(error5), { updated: false, error: error5 });
      } finally {
        const value150 = _panorama360SyncInflightByNodeId.get(value139);
        value150?.promise === promise && _panorama360SyncInflightByNodeId.delete(value139);
      }
    })();
  return (
    _panorama360SyncInflightByNodeId.set(value139, {
      signature: sourceSignature,
      version: version,
      promise: promise,
    }),
    promise
  );
}
export function updatePanoramaSceneLoadState({
  nodeId: nodeId24,
  isLoaded: isLoaded,
  error: error = null,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId24, (value151) => {
    const cloneSceneState22 = cloneSceneState(value151);
    return (
      (cloneSceneState22.panorama.isLoaded = isLoaded === true),
      (cloneSceneState22.panorama.error = error ? String(error) : null),
      cloneSceneState22
    );
  });
}
export function addPanoramaSceneMannequin({
  nodeId: nodeId25,
  gender: gender = 'male',
  colorKey: colorKey = 'blue',
  viewPose: viewPose3,
  storeInstance: storeInstance = appStore,
}) {
  const sceneMode = getSceneState(storeInstance, nodeId25),
    position3 = resolveObjectPlacementPoint({
      sceneMode: sceneMode.mode,
      sceneViewTarget: sceneMode?.viewport?.sceneView?.target,
      pose: viewPose3,
      groundY: 0,
      forwardDistance: MANNEQUIN_FORWARD_PLACEMENT_DISTANCE,
    }),
    y6 = pickFacingCameraYaw(viewPose3),
    id2 = generateId('mannequin');
  return (
    writeSceneState(storeInstance, nodeId25, (value152) => {
      const cloneSceneState23 = cloneSceneState(value152);
      return (
        cloneSceneState23.mannequins.push({
          id: id2,
          gender: gender === 'female' ? 'female' : 'male',
          colorKey: colorKey,
          position: position3,
          rotation: { x: 0, y: y6, z: 0 },
          scale: 1,
        }),
        (cloneSceneState23.gridPlacement.gender = gender === 'female' ? 'female' : 'male'),
        (cloneSceneState23.gridPlacement.colorKey = colorKey),
        setSingleSelection(cloneSceneState23, 'mannequin', id2),
        cloneSceneState23
      );
    }),
    commit(),
    id2
  );
}
export function addPanoramaSceneCube({
  nodeId: nodeId26,
  colorKey: colorKey = 'blue',
  viewPose: viewPose4,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode8 = getStoreNode(storeInstance, nodeId26);
  if (isPanorama360NodeType(storeNode8?.type)) return null;
  const sceneMode2 = getSceneState(storeInstance, nodeId26),
    x9 = resolveObjectPlacementPoint({
      sceneMode: sceneMode2.mode,
      sceneViewTarget: sceneMode2?.viewport?.sceneView?.target,
      pose: viewPose4,
      groundY: 0,
      forwardDistance: CUBE_FORWARD_PLACEMENT_DISTANCE,
    }),
    position4 = { x: x9.x, y: 0, z: x9.z },
    id3 = generateId('cube');
  return (
    writeSceneState(storeInstance, nodeId26, (value153) => {
      const cloneSceneState24 = cloneSceneState(value153);
      return (
        cloneSceneState24.cubes.push({
          id: id3,
          colorKey: colorKey,
          position: position4,
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
        }),
        setSingleSelection(cloneSceneState24, 'cube', id3),
        cloneSceneState24
      );
    }),
    commit(),
    id3
  );
}
export function addPanoramaSceneMannequinGrid({
  nodeId: nodeId27,
  viewPose: viewPose5,
  storeInstance: storeInstance = appStore,
}) {
  const sceneMode3 = getSceneState(storeInstance, nodeId27),
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
    writeSceneState(storeInstance, nodeId27, (value154) => {
      const gender2 = cloneSceneState(value154);
      for (const position5 of list19) {
        const id5 = generateId('mannequin');
        (preferredActiveId5.push(id5),
          gender2.mannequins.push({
            id: id5,
            gender: gender2.gridPlacement.gender,
            colorKey: gender2.gridPlacement.colorKey,
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
  nodeId: nodeId28,
  viewPose: viewPose6,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode9 = getStoreNode(storeInstance, nodeId28);
  if (isPanorama360NodeType(storeNode9?.type)) return null;
  const sceneState6 = getSceneState(storeInstance, nodeId28);
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
    writeSceneState(storeInstance, nodeId28, (value155) => {
      const cloneSceneState25 = cloneSceneState(value155);
      return (
        cloneSceneState25.cameras.push({
          id: id6,
          slot: slot6,
          name: panoramaSceneText('camera.defaultName', { slot: toCameraSlotLabel(slot6) }),
          position: position6.position,
          quaternion: position6.quaternion,
          rotation: position6.rotation,
          focalLength: position6.focalLength,
        }),
        cloneSceneState25.mode === 'panorama' &&
          ((cloneSceneState25.viewport.activeView = 'camera'),
          (cloneSceneState25.viewport.activeCameraId = id6)),
        cloneSceneState25
      );
    }),
    commit(),
    id6
  );
}
export function updatePanoramaSceneObjectTransform({
  nodeId: nodeId29,
  objectType: objectType8,
  objectId: objectId10,
  pose: pose2,
  targets: targets,
  storeInstance: storeInstance = appStore,
}) {
  const list20 = Array.isArray(targets) ? targets : [],
    position7 = pose2 ? sanitizeObjectPose(pose2) : null;
  (writeSceneState(storeInstance, nodeId29, (value156) => {
    const cloneSceneState26 = cloneSceneState(value156);
    if (list20.length > 0) {
      const map6 = new Map(),
        map7 = new Map();
      list20.forEach((enabled11) => {
        if (!enabled11?.objectId || !enabled11?.objectType || !enabled11?.pose) return;
        const sanitizeObjectPose2 = sanitizeObjectPose(enabled11.pose);
        if (enabled11.objectType === 'mannequin') map6.set(String(enabled11.objectId), sanitizeObjectPose2);
        else enabled11.objectType === 'cube' && map7.set(String(enabled11.objectId), sanitizeObjectPose2);
      });
      map6.size > 0 &&
        (cloneSceneState26.mannequins = cloneSceneState26.mannequins.map((box11) => {
          const position8 = map6.get(box11.id);
          if (!position8) return box11;
          const scale2 = composeCompatibleScale(position8.scale, box11.scale);
          return {
            ...box11,
            position: position8.position,
            rotation: position8.rotation,
            quaternion: position8.quaternion,
            scale: scale2,
          };
        }));
      map7.size > 0 &&
        (cloneSceneState26.cubes = cloneSceneState26.cubes.map((box12) => {
          const position9 = map7.get(box12.id);
          if (!position9) return box12;
          const scale3 = composeCompatibleScale(position9.scale, box12.scale);
          return {
            ...box12,
            position: position9.position,
            rotation: position9.rotation,
            quaternion: position9.quaternion,
            scale: scale3,
          };
        }));
      if (cloneSceneState26.selection.selectedGroupId) {
        const preferredGroupId4 = (cloneSceneState26.groups || []).find(
          (item27) => item27.id === cloneSceneState26.selection.selectedGroupId,
        );
        preferredGroupId4 &&
          setSelectionFromObjects(
            cloneSceneState26,
            preferredGroupId4.memberIds.map((objectId11) => ({
              objectType: 'mannequin',
              objectId: objectId11,
            })),
            {
              preferredGroupId: preferredGroupId4.id,
              preferredActiveType: 'mannequin',
              preferredActiveId: preferredGroupId4.memberIds[0] || null,
            },
          );
      }
      return cloneSceneState26;
    }
    if (objectType8 === 'camera') return cloneSceneState26;
    if (objectType8 === 'mannequin' && position7 && objectId10)
      ((cloneSceneState26.mannequins = cloneSceneState26.mannequins.map((box13) =>
        box13.id === objectId10
          ? {
              ...box13,
              position: position7.position,
              rotation: position7.rotation,
              quaternion: position7.quaternion,
              scale: composeCompatibleScale(position7.scale, box13.scale),
            }
          : box13,
      )),
        setSingleSelection(cloneSceneState26, 'mannequin', objectId10));
    else
      objectType8 === 'cube' &&
        position7 &&
        objectId10 &&
        ((cloneSceneState26.cubes = cloneSceneState26.cubes.map((box14) =>
          box14.id === objectId10
            ? {
                ...box14,
                position: position7.position,
                rotation: position7.rotation,
                quaternion: position7.quaternion,
                scale: composeCompatibleScale(position7.scale, box14.scale),
              }
            : box14,
        )),
        setSingleSelection(cloneSceneState26, 'cube', objectId10));
    return cloneSceneState26;
  }),
    commit());
}
export function deletePanoramaSceneCamera({
  nodeId: nodeId30,
  cameraId: cameraId3,
  storeInstance: storeInstance = appStore,
}) {
  const storeNode10 = getStoreNode(storeInstance, nodeId30);
  if (isPanorama360NodeType(storeNode10?.type)) return;
  const sceneState7 = getSceneState(storeInstance, nodeId30);
  if (!sceneState7.cameras.some((item28) => item28.id === cameraId3)) return;
  (writeSceneState(storeInstance, nodeId30, (value157) => {
    const finalizeSelectedObjectRemoval2 = finalizeSelectedObjectRemoval(value157, 'camera', cameraId3);
    return (
      (finalizeSelectedObjectRemoval2.cameras = finalizeSelectedObjectRemoval2.cameras.filter(
        (item29) => item29.id !== cameraId3,
      )),
      finalizeSelectedObjectRemoval2
    );
  }),
    commit());
}
export function deleteSelectedPanoramaSceneObject({
  nodeId: nodeId31,
  storeInstance: storeInstance = appStore,
}) {
  const sceneState8 = getSceneState(storeInstance, nodeId31),
    list21 = collectSelectionObjects(sceneState8),
    objectType9 = sceneState8.selection.selectedObjectType,
    objectId12 = sceneState8.selection.selectedObjectId,
    objectId13 =
      sceneState8?.viewport?.activeView === 'camera' && sceneState8?.viewport?.activeCameraId
        ? String(sceneState8.viewport.activeCameraId)
        : null,
    value158 = sceneState8.selection.selectedGroupId || null;
  if (value158) {
    (writeSceneState(storeInstance, nodeId31, (value159) => {
      const cloneSceneState27 = cloneSceneState(value159),
        enabled12 = (cloneSceneState27.groups || []).find((item30) => item30.id === value158);
      if (!enabled12) return (clearSelection(cloneSceneState27), cloneSceneState27);
      const map8 = new Set(enabled12.memberIds);
      return (
        (cloneSceneState27.mannequins = cloneSceneState27.mannequins.filter(
          (item31) => !map8.has(item31.id),
        )),
        (cloneSceneState27.groups = pruneGroups(cloneSceneState27.groups, [...map8]).filter(
          (item32) => item32.id !== value158,
        )),
        clearSelection(cloneSceneState27),
        cloneSceneState27
      );
    }),
      commit());
    return;
  }
  if (list21.length > 1) {
    (writeSceneState(storeInstance, nodeId31, (value160) => {
      const cloneSceneState28 = cloneSceneState(value160),
        map9 = new Set(
          list21.filter((item33) => item33.objectType === 'cube').map((item34) => item34.objectId),
        ),
        map10 = new Set(
          list21.filter((item35) => item35.objectType === 'mannequin').map((item36) => item36.objectId),
        );
      map9.size > 0 &&
        (cloneSceneState28.cubes = cloneSceneState28.cubes.filter((item37) => !map9.has(item37.id)));
      if (map10.size > 0) {
        const value161 = [...map10];
        ((cloneSceneState28.mannequins = cloneSceneState28.mannequins.filter(
          (item38) => !map10.has(item38.id),
        )),
          (cloneSceneState28.groups = pruneGroups(cloneSceneState28.groups, value161)));
      }
      return (clearSelection(cloneSceneState28), cloneSceneState28);
    }),
      commit());
    return;
  }
  const enabled13 =
    list21.length === 1
      ? list21[0]
      : objectType9 && objectId12
        ? { objectType: objectType9, objectId: objectId12 }
        : objectId13
          ? { objectType: 'camera', objectId: objectId13 }
          : null;
  if (!enabled13?.objectType || !enabled13?.objectId) return;
  (writeSceneState(storeInstance, nodeId31, (value162) => {
    const finalizeSelectedObjectRemoval3 = finalizeSelectedObjectRemoval(
      value162,
      enabled13.objectType,
      enabled13.objectId,
    );
    if (enabled13.objectType === 'camera')
      finalizeSelectedObjectRemoval3.cameras = finalizeSelectedObjectRemoval3.cameras.filter(
        (item39) => item39.id !== enabled13.objectId,
      );
    else
      enabled13.objectType === 'cube'
        ? (finalizeSelectedObjectRemoval3.cubes = finalizeSelectedObjectRemoval3.cubes.filter(
            (item40) => item40.id !== enabled13.objectId,
          ))
        : ((finalizeSelectedObjectRemoval3.mannequins = finalizeSelectedObjectRemoval3.mannequins.filter(
            (item41) => item41.id !== enabled13.objectId,
          )),
          (finalizeSelectedObjectRemoval3.groups = pruneGroups(finalizeSelectedObjectRemoval3.groups, [
            enabled13.objectId,
          ])));
    return finalizeSelectedObjectRemoval3;
  }),
    commit());
}
function createCapturePreviewUrl(enabled14) {
  const value163 = globalThis.window?.URL || globalThis.URL;
  if (!enabled14 || typeof value163?.createObjectURL !== 'function') return '';
  try {
    return value163.createObjectURL(enabled14);
  } catch {
    return '';
  }
}
function buildSavedCapturePatch(fileName4, box15 = {}) {
  const localPath5 = pickResultLocalPath(fileName4),
    src = localPathToUrl(localPath5) || String(fileName4?.url || '').trim();
  if (!localPath5 || !src) throw new Error(panoramaSceneText('capture.saveInvalidPath'));
  const value164 = {
      src: src,
      localPath: localPath5,
      originalLocalPath: normalizeLocalPath(fileName4?.originalLocalPath || localPath5),
      displayLocalPath: normalizeLocalPath(fileName4?.displayLocalPath),
      thumbLocalPath: normalizeLocalPath(fileName4?.thumbLocalPath),
      fileName: fileName4?.filename || box15.fileName || '',
      captureSavePending: false,
      captureSaveError: null,
    },
    count7 = Number(fileName4?.originalWidth || box15.originalWidth || box15.width || 0),
    count8 = Number(fileName4?.originalHeight || box15.originalHeight || box15.height || 0);
  if (count7 > 0) value164.originalWidth = count7;
  if (count8 > 0) value164.originalHeight = count8;
  return value164;
}
export async function capturePanoramaSceneViewport({
  nodeId: nodeId32,
  captureViewport: captureViewport,
  captureBlob: captureBlob,
  storeInstance: storeInstance = appStore,
  saveBlob: saveBlob = saveOutputBlob,
  createPreviewUrl: createPreviewUrl = createCapturePreviewUrl,
}) {
  const run2 =
    typeof captureBlob === 'function'
      ? captureBlob
      : typeof captureViewport === 'function'
        ? captureViewport
        : null;
  if (!run2) return null;
  const nodeActionContext = createNodeActionContext({ storeInstance: storeInstance }),
    storeNode11 = getStoreNode(nodeActionContext.storeInstance, nodeId32);
  if (!storeNode11) return null;
  const sceneState9 = getSceneState(nodeActionContext.storeInstance, nodeId32);
  if (sceneState9.capture.pending) return (showWarning(panoramaSceneText('capture.pending')), null);
  writeSceneState(nodeActionContext.storeInstance, nodeId32, (value165) => {
    const cloneSceneState29 = cloneSceneState(value165);
    return (
      (cloneSceneState29.capture.pending = true),
      (cloneSceneState29.capture.error = null),
      cloneSceneState29
    );
  });
  try {
    const enabled15 = await run2();
    if (!enabled15) throw new Error(panoramaSceneText('capture.noImage'));
    const fileName5 = 'scene_capture_' + Date.now() + '.png',
      width2 = buildSourceMediaNodePayload({
        id: '__seed__',
        type: 'source-image',
        x: 0,
        y: 0,
        name: panoramaSceneText('capture.nodeName'),
        fileName: fileName5,
      }),
      value166 = nodeActionContext.storeInstance.getStateRaw(),
      x10 = calcSafeSpawnPosNearNode(value166.nodes || {}, storeNode11, width2.width, width2.height),
      id7 = generateId('source-image'),
      capturePreviewUrl = createPreviewUrl(enabled15) || '';
    return (
      nodeActionContext.storeInstance.batch(() => {
        (writeSceneState(nodeActionContext.storeInstance, nodeId32, (value167) => {
          const cloneSceneState30 = cloneSceneState(value167);
          return (
            (cloneSceneState30.capture.pending = false),
            (cloneSceneState30.capture.error = null),
            (cloneSceneState30.capture.lastCaptureAt = Date.now()),
            cloneSceneState30
          );
        }),
          nodeActionContext.storeInstance.addNode(
            buildSourceMediaNodePayload({
              id: id7,
              type: 'source-image',
              x: x10.x,
              y: x10.y,
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
        .then(() => saveBlob(enabled15, { ext: 'png' }))
        .then((value168) => {
          if (!nodeActionContext.storeInstance.getStateRaw().nodes?.[id7]) return;
          nodeActionContext.storeInstance.updateNodeData(
            id7,
            buildSavedCapturePatch(value168, {
              fileName: fileName5,
              width: width2.width,
              height: width2.height,
            }),
          );
        })
        .catch((error6) => {
          const captureSaveError = String(error6?.message || panoramaSceneText('capture.localSaveFailed'));
          (console.warn('[PanoramaScene] save capture failed:', error6),
            nodeActionContext.storeInstance.getStateRaw().nodes?.[id7] &&
              nodeActionContext.storeInstance.updateNodeData(id7, {
                captureSavePending: false,
                captureSaveError: captureSaveError,
              }),
            showWarning(panoramaSceneText('capture.localSaveWarning')));
        }),
      id7
    );
  } catch (error7) {
    const error8 = String(error7?.message || panoramaSceneText('capture.failed'));
    return (
      writeSceneState(nodeActionContext.storeInstance, nodeId32, (value169) => {
        const cloneSceneState31 = cloneSceneState(value169);
        return (
          (cloneSceneState31.capture.pending = false),
          (cloneSceneState31.capture.error = error8),
          cloneSceneState31
        );
      }),
      showError(panoramaSceneText('capture.failedWithError', { error: error8 })),
      null
    );
  }
}
export function renamePanoramaSceneCamera({
  nodeId: nodeId33,
  cameraId: cameraId4,
  name: name2,
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId33, (value170) => {
    const cloneSceneState32 = cloneSceneState(value170);
    return (
      (cloneSceneState32.cameras = cloneSceneState32.cameras.map((error9) =>
        error9.id === cameraId4
          ? {
              ...error9,
              name:
                String(name2 || error9.name || panoramaSceneText('camera.fallbackName')).trim() ||
                error9.name,
            }
          : error9,
      )),
      cloneSceneState32
    );
  });
}
export function setPanoramaSceneCollapsed({
  nodeId: nodeId34,
  isCollapsed: isCollapsed,
  enterEditingOnExpand: enterEditingOnExpand = false,
  storeInstance: storeInstance = appStore,
}) {
  const box16 = getStoreNode(storeInstance, nodeId34);
  if (!box16) return;
  const isCollapsed2 = typeof isCollapsed === 'boolean' ? isCollapsed : box16.isCollapsed !== true;
  if (isCollapsed2 === (box16.isCollapsed === true)) return;
  const value171 = enterEditingOnExpand === true && isCollapsed2 === false,
    _originalWidth = Number(box16._originalWidth) || Number(box16.width) || PANORAMA_SCENE_DEFAULT_SIZE.width,
    _originalHeight =
      Number(box16._originalHeight) || Number(box16.height) || PANORAMA_SCENE_DEFAULT_SIZE.height,
    box17 = computeCollapsedDimensions(_originalWidth, _originalHeight);
  (storeInstance.batch(() => {
    (writeSceneState(storeInstance, nodeId34, (value172) => {
      const cloneSceneState33 = cloneSceneState(value172);
      return (
        (cloneSceneState33.ui.isEditing = value171),
        (cloneSceneState33.ui.showCameraList = false),
        cloneSceneState33
      );
    }),
      storeInstance.updateNodeData(nodeId34, {
        isCollapsed: isCollapsed2,
        _originalWidth: _originalWidth,
        _originalHeight: _originalHeight,
        width: isCollapsed2 ? box17.width : _originalWidth,
        height: isCollapsed2 ? box17.height : _originalHeight,
      }));
  }),
    commit());
}
export function focusPanoramaSceneSelection({ nodeId: nodeId35, storeInstance: storeInstance = appStore }) {
  const args9 = getSceneState(storeInstance, nodeId35),
    cameraId5 = getSelectedObject(args9);
  if (!cameraId5) return false;
  if (cameraId5.objectType === 'camera')
    return (
      activatePanoramaSceneCamera({
        nodeId: nodeId35,
        cameraId: cameraId5.item.id,
        storeInstance: storeInstance,
      }),
      true
    );
  const value173 = cameraId5.item,
    sceneObjectHeightOffset = getSceneObjectHeightOffset(cameraId5.objectType);
  if (args9.mode === 'panorama') {
    const value174 = (Number(value173.position?.y) || 0) + sceneObjectHeightOffset,
      value175 = Number(value173.position?.x) || 0,
      value176 = value174 - 1.6,
      value177 = Number(value173.position?.z) || 0,
      value178 = Math.hypot(value175, value176, value177) || 1;
    return (
      applyPanoramaSceneViewCommit({
        nodeId: nodeId35,
        panoramaView: {
          ...args9.viewport.panoramaView,
          yaw: Math.atan2(value175, value177 || 0.0001),
          pitch: clampPanoramaPitch(Math.asin(value176 / value178)),
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
      nodeId: nodeId35,
      sceneView: {
        ...args9.viewport.sceneView,
        target: {
          x: Number(value173.position?.x) || 0,
          y: (Number(value173.position?.y) || 0) + sceneObjectHeightOffset,
          z: Number(value173.position?.z) || 0,
        },
      },
      activeView: 'default',
      activeCameraId: null,
      storeInstance: storeInstance,
    }),
    true
  );
}
function resolvePanoramaThumbnailUrl(enabled16) {
  if (!enabled16 || typeof enabled16 !== 'object') return '';
  return pickFirstNonEmptyString(
    localPathToUrl(enabled16['thumbLocalPath']),
    localPathToUrl(enabled16['thumbnailLocalPath']),
    enabled16['thumbUrl'],
    enabled16['thumbnailUrl'],
  );
}

export function setPanoramaSceneInteractionOptions({
  nodeId: nodeId36,
  patch: patch = {},
  storeInstance: storeInstance = appStore,
}) {
  writeSceneState(storeInstance, nodeId36, (value179) => {
    const cloneSceneState34 = cloneSceneState(value179);
    return (
      Object['prototype']['hasOwnProperty']['call'](patch, 'transformSpace') &&
        (cloneSceneState34['ui']['transformSpace'] = patch['transformSpace'] === 'local' ? 'local' : 'world'),
      Object['prototype']['hasOwnProperty']['call'](patch, 'snapEnabled') &&
        (cloneSceneState34['ui']['snapEnabled'] = patch['snapEnabled'] === !![]),
      Number['isFinite'](Number(patch['translationSnap'])) &&
        (cloneSceneState34['ui']['translationSnap'] = Number(patch['translationSnap'])),
      Number['isFinite'](Number(patch['rotationSnap'])) &&
        (cloneSceneState34['ui']['rotationSnap'] = Number(patch['rotationSnap'])),
      Number['isFinite'](Number(patch['scaleSnap'])) &&
        (cloneSceneState34['ui']['scaleSnap'] = Number(patch['scaleSnap'])),
      Object['prototype']['hasOwnProperty']['call'](patch, 'groundLock') &&
        (cloneSceneState34['ui']['groundLock'] = patch['groundLock'] === !![]),
      Object['prototype']['hasOwnProperty']['call'](patch, 'uniformScale') &&
        (cloneSceneState34['ui']['uniformScale'] = patch['uniformScale'] === !![]),
      Object['prototype']['hasOwnProperty']['call'](patch, 'navigationMode') &&
        (cloneSceneState34['ui']['navigationMode'] = patch['navigationMode'] === 'fly' ? 'fly' : 'orbit'),
      Number['isFinite'](Number(patch['flySpeed'])) &&
        (cloneSceneState34['ui']['flySpeed'] = Math['max'](
          0.25,
          Math['min'](0x28, Number(patch['flySpeed'])),
        )),
      Object['prototype']['hasOwnProperty']['call'](patch, 'showTimeline') &&
        (cloneSceneState34['ui']['showTimeline'] = patch['showTimeline'] === !![]),
      cloneSceneState34
    );
  });
}

export function upsertPanoramaSceneCustomPose({
  nodeId: nodeId37,
  pose: pose3,
  storeInstance: storeInstance = appStore,
}) {
  const args10 = normalizeCustomMannequinPose(pose3),
    id8 = args10['id'] && args10['id'] !== 'custom' ? args10['id'] : generateId('mannequin-pose'),
    value180 = { ...args10, id: id8 };
  return (
    writeSceneState(storeInstance, nodeId37, (value181) => {
      const cloneSceneState35 = cloneSceneState(value181),
        list22 = Array['isArray'](cloneSceneState35['customPoses']) ? cloneSceneState35['customPoses'] : [];
      return (
        (cloneSceneState35['customPoses'] = [
          ...list22['filter']((value182) => value182['id'] !== id8),
          value180,
        ]),
        cloneSceneState35
      );
    }),
    commit(),
    value180
  );
}

export function applyPanoramaSceneMannequinPose({
  nodeId: nodeId38,
  mannequinId: mannequinId,
  poseId: poseId = DEFAULT_MANNEQUIN_POSE_ID,
  bonePose: bonePose = null,
  customPose: customPose = null,
  storeInstance: storeInstance = appStore,
}) {
  const enabled17 = String(mannequinId || '')['trim']();
  if (!enabled17) return null;
  let value183 = null;
  return (
    writeSceneState(storeInstance, nodeId38, (value184) => {
      const cloneSceneState36 = cloneSceneState(value184),
        error10 = customPose
          ? {
              ...normalizeCustomMannequinPose(customPose),
              id: String(customPose['id'] || '')['trim']() || generateId('mannequin-pose'),
            }
          : null;
      error10 &&
        (cloneSceneState36['customPoses'] = [
          ...(cloneSceneState36['customPoses'] || [])['filter'](
            (value185) => value185['id'] !== error10['id'],
          ),
          error10,
        ]);
      const value186 = error10?.['id'] || (poseId !== 'custom' ? String(poseId || '')['trim']() : ''),
        id9 = (cloneSceneState36['customPoses'] || [])['find']((value187) => value187['id'] === value186),
        poseId2 = bonePose
          ? createCustomMannequinPose({
              id: id9?.['id'] || error10?.['id'] || 'custom',
              name: id9?.['name'] || error10?.['name'] || 'Custom pose',
              bones: bonePose,
            })
          : id9 || resolveMannequinPose(poseId, error10);
      return (
        (value183 = poseId2),
        (cloneSceneState36['mannequins'] = cloneSceneState36['mannequins']['map']((args11) =>
          args11['id'] === enabled17
            ? {
                ...args11,
                poseId:
                  poseId2?.['category'] === 'custom'
                    ? 'custom'
                    : poseId2?.['id'] || DEFAULT_MANNEQUIN_POSE_ID,
                customPoseId: poseId2?.['category'] === 'custom' ? poseId2['id'] : null,
                bonePose: normalizeBonePose(poseId2?.['bones']),
              }
            : args11,
        )),
        setSingleSelection(cloneSceneState36, 'mannequin', enabled17),
        cloneSceneState36
      );
    }),
    commit(),
    value183
  );
}

export function addPanoramaSceneCameraKeyframe({
  nodeId: nodeId39,
  keyframe: keyframe = {},
  viewPose: viewPose = null,
  storeInstance: storeInstance = appStore,
}) {
  const sceneState10 = getSceneState(storeInstance, nodeId39),
    cameraTimeline2 = normalizeCameraTimeline(sceneState10['cameraTimeline']),
    compositionPoint = normalizeCompositionPoint(viewPose?.['position'], { x: 0x0, y: 1.6, z: 0x6 }),
    x11 = normalizeCompositionPoint(keyframe?.['position'], compositionPoint),
    box18 = normalizeCompositionPoint(viewPose?.['forward'], { x: 0x0, y: 0x0, z: -0x1 }),
    value188 = {
      x: x11['x'] + box18['x'] * 0x5,
      y: x11['y'] + box18['y'] * 0x5,
      z: x11['z'] + box18['z'] * 0x5,
    },
    target2 = normalizeCompositionPoint(keyframe?.['target'], value188),
    value189 = Number(keyframe['fov'] ?? viewPose?.['fov']),
    value190 = {
      id: String(keyframe['id'] || '')['trim']() || generateId('camera-keyframe'),
      time: Number['isFinite'](Number(keyframe['time']))
        ? Number(keyframe['time'])
        : cameraTimeline2['currentTime'],
      position: x11,
      target: target2,
      fov: Number['isFinite'](value189) ? value189 : 0x37,
      easing: keyframe['easing'] || 'ease-in-out',
    };
  return (
    writeSceneState(storeInstance, nodeId39, (value191) => {
      const cloneSceneState37 = cloneSceneState(value191);
      return (
        (cloneSceneState37['cameraTimeline'] = upsertCameraKeyframe(
          cloneSceneState37['cameraTimeline'],
          value190,
        )),
        cloneSceneState37
      );
    }),
    commit(),
    value190['id']
  );
}

export function updatePanoramaSceneCameraTimeline({
  nodeId: nodeId40,
  timeline: timeline = null,
  patch: patch = null,
  storeInstance: storeInstance = appStore,
}) {
  (writeSceneState(storeInstance, nodeId40, (value192) => {
    const cloneSceneState38 = cloneSceneState(value192);
    return (
      (cloneSceneState38['cameraTimeline'] = timeline
        ? normalizeCameraTimeline(timeline)
        : updateCameraTimelineSettings(cloneSceneState38['cameraTimeline'], patch || {})),
      cloneSceneState38
    );
  }),
    commit());
}

export function deletePanoramaSceneCameraKeyframe({
  nodeId: nodeId41,
  keyframeId: keyframeId,
  storeInstance: storeInstance = appStore,
}) {
  (writeSceneState(storeInstance, nodeId41, (value193) => {
    const cloneSceneState39 = cloneSceneState(value193);
    return (
      (cloneSceneState39['cameraTimeline'] = removeCameraKeyframe(
        cloneSceneState39['cameraTimeline'],
        keyframeId,
      )),
      cloneSceneState39
    );
  }),
    commit());
}

function normalizeCompositionPoint(box19, box20) {
  return {
    x: Number['isFinite'](Number(box19?.['x'])) ? Number(box19['x']) : box20['x'],
    y: Number['isFinite'](Number(box19?.['y'])) ? Number(box19['y']) : box20['y'],
    z: Number['isFinite'](Number(box19?.['z'])) ? Number(box19['z']) : box20['z'],
  };
}

export function composePanoramaScene({
  nodeId: nodeId42,
  assets: assets = [],
  mannequins: mannequins = [],
  cameraTimeline: cameraTimeline = null,
  environmentMode: environmentMode = null,
  replaceExisting: replaceExisting = ![],
  storeInstance: storeInstance = appStore,
}) {
  const storeNode12 = getStoreNode(storeInstance, nodeId42);
  if (!storeNode12 || isPanorama360NodeType(storeNode12['type'])) return null;
  const assetIds = [],
    mannequinIds = [];
  return (
    writeSceneState(storeInstance, nodeId42, (value194) => {
      const cloneSceneState40 = cloneSceneState(value194);
      replaceExisting &&
        ((cloneSceneState40['cubes'] = []),
        (cloneSceneState40['mannequins'] = []),
        (cloneSceneState40['groups'] = []),
        clearSelection(cloneSceneState40));
      environmentMode && (cloneSceneState40['environmentMode'] = environmentMode === 'day' ? 'day' : 'night');
      const list23 = Array['isArray'](assets) ? assets : [];
      list23['forEach']((colorKey2, value195) => {
        const assetId = resolveSceneAsset(colorKey2?.['assetId'] || colorKey2?.['id']);
        if (!assetId) return;
        const id10 = generateId('scene-asset');
        assetIds['push'](id10);
        const value196 = {
          x: ((value195 % 0x4) - Math['min'](1.5, (list23['length'] - 0x1) / 0x2)) * 2.2,
          y: 0x0,
          z: Math['floor'](value195 / 0x4) * 2.2,
        };
        cloneSceneState40['cubes']['push']({
          id: id10,
          assetId: assetId['id'],
          colorKey: colorKey2?.['colorKey'] || assetId['colorKey'] || 'blue',
          position: normalizeCompositionPoint(colorKey2?.['position'], value196),
          rotation: normalizeCompositionPoint(colorKey2?.['rotation'], { x: 0x0, y: 0x0, z: 0x0 }),
          scale: colorKey2?.['scale'] ?? 0x1,
        });
      });
      const list24 = Array['isArray'](mannequins) ? mannequins : [];
      list24['forEach']((bones, value197) => {
        const id11 = generateId('mannequin');
        mannequinIds['push'](id11);
        const poseId3 = bones?.['bonePose']
          ? createCustomMannequinPose({ bones: bones['bonePose'] })
          : resolveMannequinPose(bones?.['poseId']);
        cloneSceneState40['mannequins']['push']({
          id: id11,
          gender: bones?.['gender'] === 'female' ? 'female' : 'male',
          colorKey: bones?.['colorKey'] || 'blue',
          poseId:
            poseId3?.['category'] === 'custom' ? 'custom' : poseId3?.['id'] || DEFAULT_MANNEQUIN_POSE_ID,
          customPoseId: null,
          bonePose: normalizeBonePose(poseId3?.['bones']),
          position: normalizeCompositionPoint(bones?.['position'], {
            x: (value197 - (list24['length'] - 0x1) / 0x2) * 1.5,
            y: 0x0,
            z: 0x0,
          }),
          rotation: normalizeCompositionPoint(bones?.['rotation'], { x: 0x0, y: Math['PI'], z: 0x0 }),
          scale: bones?.['scale'] ?? 0x1,
        });
      });
      cameraTimeline && (cloneSceneState40['cameraTimeline'] = normalizeCameraTimeline(cameraTimeline));
      const value198 = mannequinIds['at'](-0x1),
        value199 = assetIds['at'](-0x1);
      if (value198) setSingleSelection(cloneSceneState40, 'mannequin', value198);
      else value199 && setSingleSelection(cloneSceneState40, 'cube', value199);
      return cloneSceneState40;
    }),
    commit(),
    { nodeId: nodeId42, assetIds: assetIds, mannequinIds: mannequinIds }
  );
}
