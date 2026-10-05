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
function panoramaSceneText(value, item = {}) {
  return t('panoramaSceneNode.' + value, item);
}
const PANORAMA_SCENE_NODE_TYPE = 'panorama-scene',
  PANORAMA_SCENE_NODE_ALIASES = ['panorama_scene'],
  PANORAMA_360_NODE_TYPE = 'panorama-360',
  PANORAMA_360_NODE_ALIASES = ['panorama_360', 'panorama360'],
  PANORAMA_SCENE_CAMERA_LIMIT = 10,
  PANORAMA_SCENE_DEFAULT_SIZE = Object.freeze({ width: 1024, height: 576 }),
  PANORAMA_SCENE_COLLAPSED_MAX_SIZE = 288,
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
function toFiniteNumber(key, index) {
  const result = Number(key);
  return Number.isFinite(result) ? result : index;
}
function normalizeVector3(box, box2) {
  return {
    x: toFiniteNumber(box?.x, box2.x),
    y: toFiniteNumber(box?.y, box2.y),
    z: toFiniteNumber(box?.z, box2.z),
  };
}
function normalizeEuler(box3, box4) {
  return {
    x: toFiniteNumber(box3?.x, box4.x),
    y: toFiniteNumber(box3?.y, box4.y),
    z: toFiniteNumber(box3?.z, box4.z),
  };
}
function normalizeScaleValue(box5, box6 = 1) {
  if (Number.isFinite(box5)) return Math.max(0.01, Number(box5) || 1);
  if (box5 && Number.isFinite(box5.x) && Number.isFinite(box5.y) && Number.isFinite(box5.z))
    return {
      x: Math.max(0.01, Number(box5.x) || 1),
      y: Math.max(0.01, Number(box5.y) || 1),
      z: Math.max(0.01, Number(box5.z) || 1),
    };
  if (box6 && Number.isFinite(box6.x) && Number.isFinite(box6.y) && Number.isFinite(box6.z))
    return {
      x: Math.max(0.01, Number(box6.x) || 1),
      y: Math.max(0.01, Number(box6.y) || 1),
      z: Math.max(0.01, Number(box6.z) || 1),
    };
  return Math.max(0.01, Number(box6) || 1);
}
function clamp(data, options, target) {
  return Math.min(target, Math.max(options, data));
}
function normalizeQuaternion(box7, args = { x: 0, y: 0, z: 0, w: 1 }) {
  const x2 = Number(box7?.x),
    y2 = Number(box7?.y),
    z = Number(box7?.z),
    w = Number(box7?.w);
  if (!Number.isFinite(x2) || !Number.isFinite(y2) || !Number.isFinite(z) || !Number.isFinite(w))
    return { ...args };
  const count = Math.hypot(x2, y2, z, w);
  if (count < 0.000001) return { ...args };
  return {
    x: x2 / count,
    y: y2 / count,
    z: z / count,
    w: w / count,
  };
}
function quaternionFromEulerYXZ(box8) {
  const source = Number(box8?.x) || 0,
    next = Number(box8?.y) || 0,
    current = Number(box8?.z) || 0,
    y3 = Math.cos(source / 2),
    entry = Math.cos(next / 2),
    record = Math.cos(current / 2),
    x3 = Math.sin(source / 2),
    payload = Math.sin(next / 2),
    handle = Math.sin(current / 2);
  return normalizeQuaternion({
    x: x3 * entry * record + y3 * payload * handle,
    y: y3 * payload * record - x3 * entry * handle,
    z: y3 * entry * handle - x3 * payload * record,
    w: y3 * entry * record + x3 * payload * handle,
  });
}
function eulerFromQuaternionYXZ(state) {
  const box9 = normalizeQuaternion(state),
    config = box9.x * box9.x,
    scope = box9.y * box9.y,
    input = box9.z * box9.z,
    output = box9.x * box9.y,
    value2 = box9.x * box9.z,
    value3 = box9.y * box9.z,
    value4 = box9.x * box9.w,
    value5 = box9.y * box9.w,
    value6 = box9.z * box9.w,
    value7 = 1 - 2 * (scope + input),
    value8 = 2 * (value2 + value5),
    value9 = 2 * (output + value6),
    value10 = 1 - 2 * (config + input),
    value11 = 2 * (value3 - value4),
    value12 = 2 * (value2 - value5),
    value13 = 1 - 2 * (config + scope),
    x4 = Math.asin(-clamp(value11, -1, 1));
  if (Math.abs(value11) < 0.9999999)
    return { x: x4, y: Math.atan2(value8, value13), z: Math.atan2(value9, value10) };
  return { x: x4, y: Math.atan2(-value12, value7), z: 0 };
}
function quaternionFromEulerXYZ(box10) {
  const value14 = Number(box10?.x) || 0,
    value15 = Number(box10?.y) || 0,
    value16 = Number(box10?.z) || 0,
    y4 = Math.cos(value14 / 2),
    value17 = Math.cos(value15 / 2),
    value18 = Math.cos(value16 / 2),
    x5 = Math.sin(value14 / 2),
    value19 = Math.sin(value15 / 2),
    value20 = Math.sin(value16 / 2);
  return normalizeQuaternion({
    x: x5 * value17 * value18 + y4 * value19 * value20,
    y: y4 * value19 * value18 - x5 * value17 * value20,
    z: y4 * value17 * value20 + x5 * value19 * value18,
    w: y4 * value17 * value18 - x5 * value19 * value20,
  });
}
function eulerFromQuaternionXYZ(value21) {
  const box11 = normalizeQuaternion(value21),
    value22 = box11.x * box11.x,
    value23 = box11.y * box11.y,
    value24 = box11.z * box11.z,
    value25 = box11.x * box11.y,
    value26 = box11.x * box11.z,
    value27 = box11.y * box11.z,
    value28 = box11.x * box11.w,
    value29 = box11.y * box11.w,
    value30 = box11.z * box11.w,
    value31 = 1 - 2 * (value23 + value24),
    value32 = 2 * (value25 - value30),
    value33 = 2 * (value26 + value29),
    value34 = 2 * (value27 - value28),
    value35 = 1 - 2 * (value22 + value23),
    value36 = 2 * (value27 + value28),
    value37 = 1 - 2 * (value22 + value24),
    y5 = Math.asin(clamp(value33, -1, 1));
  if (Math.abs(value33) < 0.9999999)
    return { x: Math.atan2(-value34, value35), y: y5, z: Math.atan2(-value32, value31) };
  return { x: Math.atan2(value36, value37), y: y5, z: 0 };
}
function normalizeMode(value38) {
  return value38 === 'panorama' ? 'panorama' : 'scene';
}
function normalizeNodeTypeValue(value39) {
  return String(value39 || '').trim();
}
export function isPanoramaSceneNodeType(value40) {
  const nodeTypeValue = normalizeNodeTypeValue(value40);
  return nodeTypeValue === PANORAMA_SCENE_NODE_TYPE || PANORAMA_SCENE_NODE_ALIASES.includes(nodeTypeValue);
}
export function isPanorama360NodeType(value41) {
  const nodeTypeValue2 = normalizeNodeTypeValue(value41);
  return nodeTypeValue2 === PANORAMA_360_NODE_TYPE || PANORAMA_360_NODE_ALIASES.includes(nodeTypeValue2);
}
export function isPanoramaGraphNodeType(value42) {
  return isPanoramaSceneNodeType(value42) || isPanorama360NodeType(value42);
}
export function getPanoramaStateFieldByNodeType(value43) {
  if (isPanorama360NodeType(value43)) return 'panorama360Node';
  if (isPanoramaSceneNodeType(value43)) return 'sceneNode';
  return '';
}
function normalizeEnvironmentMode(value44) {
  return value44 === 'night' ? 'night' : 'day';
}
function normalizeActiveView(value45) {
  return value45 === 'camera' ? 'camera' : 'default';
}
function normalizeSelectionType(value46) {
  return value46 === 'mannequin' || value46 === 'cube' ? value46 : null;
}
function normalizeGender(value47) {
  return value47 === 'female' ? 'female' : 'male';
}
function normalizeColorKey(value48) {
  return PANORAMA_SCENE_COLOR_TOKENS[value48] ? value48 : 'blue';
}
function normalizeLegacyTool(value49) {
  return value49 === 'move' || value49 === 'rotate' || value49 === 'scale' || value49 === 'box-select'
    ? value49
    : 'navigate';
}
function normalizeMouseTool(value50) {
  return value50 === 'box-select' ? 'box-select' : 'navigate';
}
function normalizeTransformTool(value51) {
  return value51 === 'move' || value51 === 'rotate' || value51 === 'scale' ? value51 : 'move';
}
function normalizeTransformSpace(value52) {
  return 'local';
}
function normalizePivotMode(value53) {
  return 'active';
}
function normalizeNavigationPreset(value54) {
  return value54 === 'dcc' ? 'dcc' : 'dcc';
}
function normalizeCaptureMode(value55) {
  const value56 = String(value55 || '').trim();
  if (value56 === '9:16' || value56 === '2.35:1') return value56;
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
  const defaultPanoramaSceneState = createDefaultPanoramaSceneState();
  return (
    (defaultPanoramaSceneState.mode = 'panorama'),
    (defaultPanoramaSceneState.viewport.activeView = 'default'),
    (defaultPanoramaSceneState.viewport.activeCameraId = null),
    (defaultPanoramaSceneState.cubes = []),
    (defaultPanoramaSceneState.cameras = []),
    (defaultPanoramaSceneState.ui.showCameraList = false),
    defaultPanoramaSceneState
  );
}
export function normalizePanoramaSceneState(localPath) {
  const args2 = createDefaultPanoramaSceneState(),
    sceneView = { ...args2.viewport.sceneView, ...(localPath?.viewport?.sceneView || {}) };
  (delete sceneView.fov,
    (sceneView.target = normalizeVector3(
      localPath?.viewport?.sceneView?.target,
      args2.viewport.sceneView.target,
    )),
    (sceneView.orbitYaw = toFiniteNumber(
      localPath?.viewport?.sceneView?.orbitYaw,
      args2.viewport.sceneView.orbitYaw,
    )),
    (sceneView.orbitPitch = clampSceneOrbitPitch(
      toFiniteNumber(localPath?.viewport?.sceneView?.orbitPitch, args2.viewport.sceneView.orbitPitch),
    )),
    (sceneView.orbitDistance = clamp(
      toFiniteNumber(localPath?.viewport?.sceneView?.orbitDistance, args2.viewport.sceneView.orbitDistance),
      SCENE_ORBIT_DISTANCE_MIN,
      SCENE_ORBIT_DISTANCE_MAX,
    )));
  const panoramaView = { ...args2.viewport.panoramaView, ...(localPath?.viewport?.panoramaView || {}) };
  ((panoramaView.yaw = toFiniteNumber(
    localPath?.viewport?.panoramaView?.yaw,
    args2.viewport.panoramaView.yaw,
  )),
    (panoramaView.pitch = clampPanoramaPitch(
      toFiniteNumber(localPath?.viewport?.panoramaView?.pitch, args2.viewport.panoramaView.pitch),
    )),
    (panoramaView.fov = Math.max(
      PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.min,
      Math.min(
        PANORAMA_SCENE_CAMERA_CONSTRAINTS.panorama.fov.max,
        toFiniteNumber(localPath?.viewport?.panoramaView?.fov, args2.viewport.panoramaView.fov),
      ),
    )));
  const mannequins = Array.isArray(localPath?.mannequins)
      ? localPath.mannequins
          .filter((item2) => item2 && item2.id)
          .map((id) => {
            const euler = normalizeEuler(id.rotation, { x: 0, y: 0, z: 0 }),
              value57 =
                Number.isFinite(Number(id?.quaternion?.x)) &&
                Number.isFinite(Number(id?.quaternion?.y)) &&
                Number.isFinite(Number(id?.quaternion?.z)) &&
                Number.isFinite(Number(id?.quaternion?.w)),
              quaternion = value57
                ? normalizeQuaternion(id.quaternion, quaternionFromEulerXYZ(euler))
                : quaternionFromEulerXYZ(euler),
              rotation = value57 ? eulerFromQuaternionXYZ(quaternion) : euler;
            return {
              id: id.id,
              gender: normalizeGender(id.gender),
              colorKey: normalizeColorKey(id.colorKey || id.color),
              position: normalizeVector3(id.position, { x: 0, y: 0, z: 0 }),
              rotation: rotation,
              quaternion: quaternion,
              scale: normalizeScaleValue(id.scale, 1),
            };
          })
      : [],
    cubes = Array.isArray(localPath?.cubes)
      ? localPath.cubes
          .filter((item3) => item3 && item3.id)
          .map((id2) => {
            const euler2 = normalizeEuler(id2.rotation, { x: 0, y: 0, z: 0 }),
              value58 =
                Number.isFinite(Number(id2?.quaternion?.x)) &&
                Number.isFinite(Number(id2?.quaternion?.y)) &&
                Number.isFinite(Number(id2?.quaternion?.z)) &&
                Number.isFinite(Number(id2?.quaternion?.w)),
              quaternion2 = value58
                ? normalizeQuaternion(id2.quaternion, quaternionFromEulerXYZ(euler2))
                : quaternionFromEulerXYZ(euler2),
              rotation2 = value58 ? eulerFromQuaternionXYZ(quaternion2) : euler2;
            return {
              id: id2.id,
              colorKey: normalizeColorKey(id2.colorKey || id2.color),
              position: normalizeVector3(id2.position, { x: 0, y: 0, z: 0 }),
              rotation: rotation2,
              quaternion: quaternion2,
              scale: normalizeScaleValue(id2.scale, 1),
            };
          })
      : [],
    cameras = Array.isArray(localPath?.cameras)
      ? localPath.cameras
          .filter((item4) => item4 && item4.id)
          .slice(0, PANORAMA_SCENE_CAMERA_LIMIT)
          .map((id3, slot) => {
            const euler3 = normalizeEuler(id3.rotation, { x: 0, y: 0, z: 0 }),
              value59 =
                Number.isFinite(Number(id3?.quaternion?.x)) &&
                Number.isFinite(Number(id3?.quaternion?.y)) &&
                Number.isFinite(Number(id3?.quaternion?.z)) &&
                Number.isFinite(Number(id3?.quaternion?.w)),
              quaternion3 = value59
                ? normalizeQuaternion(id3.quaternion, quaternionFromEulerYXZ(euler3))
                : quaternionFromEulerYXZ(euler3),
              rotation3 = value59 ? eulerFromQuaternionYXZ(quaternion3) : euler3;
            return {
              id: id3.id,
              slot: Number.isInteger(Number(id3.slot))
                ? Math.max(1, Math.min(PANORAMA_SCENE_CAMERA_LIMIT, Number(id3.slot)))
                : null,
              name:
                String(id3.name || panoramaSceneText('camera.defaultName', { slot: slot + 1 })).trim() ||
                panoramaSceneText('camera.defaultName', { slot: slot + 1 }),
              position: normalizeVector3(id3.position, { x: 0, y: 1.6, z: 4 }),
              quaternion: quaternion3,
              rotation: rotation3,
              focalLength: clampSceneFocalLength(
                Object.prototype.hasOwnProperty.call(id3 || {}, 'focalLength')
                  ? toFiniteNumber(id3.focalLength, SCENE_DEFAULT_FOCAL_LENGTH_MM)
                  : SCENE_DEFAULT_FOCAL_LENGTH_MM,
              ),
            };
          })
      : [],
    map = new Set(mannequins.map((item5) => item5.id)),
    map2 = new Set(cubes.map((item6) => item6.id)),
    groups = Array.isArray(localPath?.groups)
      ? localPath.groups
          .filter((item7) => item7 && item7.id)
          .map((type) => {
            const list = Array.isArray(type.memberIds)
                ? [...new Set(type.memberIds.map((item8) => String(item8 || '').trim()).filter(Boolean))]
                : [],
              memberIds = list.filter((item9) => map.has(item9));
            return {
              id: String(type.id),
              type: type.type === 'mannequin-grid' ? 'mannequin-grid' : 'mannequin-grid',
              memberObjectType: type.memberObjectType === 'mannequin' ? 'mannequin' : 'mannequin',
              memberIds: memberIds,
            };
          })
          .filter((item10) => item10.memberIds.length > 0)
      : [],
    value60 = String(localPath?.viewport?.activeCameraId || '').trim() || null,
    activeCameraId = value60 ? cameras.some((item11) => item11.id === value60) : false,
    selectionType = normalizeSelectionType(localPath?.selection?.selectedObjectType),
    value61 = localPath?.selection?.selectedObjectId ? String(localPath.selection.selectedObjectId) : null,
    list2 = Array.isArray(localPath?.selection?.selectedObjectIds)
      ? [
          ...new Set(
            localPath.selection.selectedObjectIds
              .map((item12) => String(item12 || '').trim())
              .filter(Boolean),
          ),
        ]
      : value61
        ? [value61]
        : [],
    value62 = localPath?.selection?.selectedGroupId
      ? String(localPath.selection.selectedGroupId).trim()
      : null,
    args3 = value62 ? groups.find((item13) => item13.id === value62) || null : null,
    map3 = new Set(cameras.map((item14) => item14.id)),
    list3 = Array.isArray(localPath?.selection?.selectedObjects) ? localPath.selection.selectedObjects : [],
    list4 = [],
    map4 = new Set();
  list3.forEach((item15) => {
    const objectType = normalizeSelectionType(item15?.objectType),
      objectId = String(item15?.objectId || '').trim();
    if (!objectType || !objectId) return;
    const enabled = objectType === 'cube' ? map2.has(objectId) : map.has(objectId);
    if (!enabled) return;
    const value63 = objectType + ':' + objectId;
    if (map4.has(value63)) return;
    (map4.add(value63), list4.push({ objectType: objectType, objectId: objectId }));
  });
  const value64 = selectionType,
    value65 =
      value64 === 'camera'
        ? value61 && map3.has(value61)
          ? value61
          : null
        : value64 === 'cube'
          ? value61 && map2.has(value61)
            ? value61
            : null
          : value61 && map.has(value61)
            ? value61
            : null;
  let list5 = list2.filter((item16) =>
      value64 === 'camera' ? map3.has(item16) : value64 === 'cube' ? map2.has(item16) : map.has(item16),
    ),
    objectType2 = value64,
    value66 = value65,
    selectedGroupId = args3 ? args3.id : null;
  if (!objectType2 && list5.length > 0) {
    const value67 = list5[0];
    map2.has(value67)
      ? ((objectType2 = 'cube'), (list5 = list5.filter((item17) => map2.has(item17))))
      : ((objectType2 = 'mannequin'), (list5 = list5.filter((item18) => map.has(item18))));
  }
  if (args3)
    ((objectType2 = 'mannequin'), (list5 = [...args3.memberIds]), (value66 = args3.memberIds[0] || null));
  else {
    if (list5.length > 0)
      ((value66 = list5.includes(value66) && value66 ? value66 : list5[0]),
        objectType2 !== 'mannequin' && (selectedGroupId = null));
    else value66 ? (list5 = [value66]) : ((value66 = null), (objectType2 = null), (selectedGroupId = null));
  }
  let selectedObjects = list4;
  if (selectedObjects.length === 0) {
    if (args3)
      selectedObjects = args3.memberIds.map((objectId2) => ({
        objectType: 'mannequin',
        objectId: objectId2,
      }));
    else {
      if (objectType2 === 'cube' || objectType2 === 'mannequin') {
        const list6 = list5.length > 0 ? list5 : value66 ? [value66] : [];
        selectedObjects = list6.map((objectId3) => ({ objectType: objectType2, objectId: objectId3 }));
      }
    }
  }
  let selectedObjectType = null,
    selectedObjectId = null,
    selectedObjectIds = [];
  if (selectedObjects.length > 0) {
    const value68 = objectType2 === 'cube' || objectType2 === 'mannequin' ? objectType2 : null,
      value69 = value68 ? selectedObjects.some((item19) => item19.objectType === value68) : false;
    ((selectedObjectType = value69 ? value68 : selectedObjects[0].objectType),
      (selectedObjectIds = selectedObjects
        .filter((item20) => item20.objectType === selectedObjectType)
        .map((item21) => item21.objectId)));
    const value70 =
      value66 &&
      selectedObjects.some(
        (item22) => item22.objectType === selectedObjectType && item22.objectId === value66,
      );
    selectedObjectId = value70 ? value66 : selectedObjectIds[0] || null;
  } else selectedGroupId = null;
  if (selectedGroupId) {
    const args4 = groups.find((item23) => item23.id === selectedGroupId) || null;
    if (!args4) selectedGroupId = null;
    else {
      const map5 = new Set(
          selectedObjects
            .filter((item24) => item24.objectType === 'mannequin')
            .map((item25) => item25.objectId),
        ),
        enabled2 =
          selectedObjects.every((item26) => item26.objectType === 'mannequin') &&
          args4.memberIds.length > 0 &&
          args4.memberIds.every((item27) => map5.has(item27)) &&
          args4.memberIds.length === selectedObjects.length;
      !enabled2
        ? (selectedGroupId = null)
        : ((selectedObjectType = 'mannequin'),
          (selectedObjectIds = [...args4.memberIds]),
          (selectedObjectId = args4.memberIds[0] || null),
          (selectedObjects = args4.memberIds.map((objectId4) => ({
            objectType: 'mannequin',
            objectId: objectId4,
          }))));
    }
  }
  const activeTool = normalizeLegacyTool(localPath?.ui?.activeTool),
    mouseTool = normalizeMouseTool(
      localPath?.ui?.mouseTool != null
        ? localPath.ui.mouseTool
        : activeTool === 'box-select'
          ? 'box-select'
          : 'navigate',
    ),
    transformTool = normalizeTransformTool(
      localPath?.ui?.transformTool != null
        ? localPath.ui.transformTool
        : activeTool === 'move' || activeTool === 'rotate' || activeTool === 'scale'
          ? activeTool
          : 'move',
    );
  return {
    version: 1,
    mode: normalizeMode(localPath?.mode),
    environmentMode: normalizeEnvironmentMode(localPath?.environmentMode),
    viewport: {
      activeView:
        normalizeActiveView(localPath?.viewport?.activeView) === 'camera' && activeCameraId
          ? 'camera'
          : 'default',
      activeCameraId: activeCameraId ? value60 : null,
      sceneView: sceneView,
      panoramaView: panoramaView,
    },
    panorama: {
      localPath: localPath?.panorama?.localPath ? String(localPath.panorama.localPath).trim() : null,
      imageUrl: localPath?.panorama?.imageUrl ? String(localPath.panorama.imageUrl).trim() : null,
      fileName: localPath?.panorama?.fileName ? String(localPath.panorama.fileName).trim() : null,
      sourceSignature: localPath?.panorama?.sourceSignature
        ? String(localPath.panorama.sourceSignature).trim()
        : null,
      isLoaded: localPath?.panorama?.isLoaded === true,
      error: localPath?.panorama?.error ? String(localPath.panorama.error) : null,
    },
    mannequins: mannequins,
    cubes: cubes,
    cameras: cameras,
    selection: {
      selectedObjectType: selectedObjectType,
      selectedObjectId: selectedObjectId,
      selectedObjectIds: selectedObjectIds,
      selectedObjects: selectedObjects,
      selectedGroupId: selectedGroupId,
    },
    groups: groups,
    gridPlacement: {
      rows: Math.max(
        1,
        Math.min(12, Math.round(toFiniteNumber(localPath?.gridPlacement?.rows, args2.gridPlacement.rows))),
      ),
      cols: Math.max(
        1,
        Math.min(12, Math.round(toFiniteNumber(localPath?.gridPlacement?.cols, args2.gridPlacement.cols))),
      ),
      spacingX: Math.max(
        0.5,
        Math.min(8, toFiniteNumber(localPath?.gridPlacement?.spacingX, args2.gridPlacement.spacingX)),
      ),
      spacingZ: Math.max(
        0.5,
        Math.min(8, toFiniteNumber(localPath?.gridPlacement?.spacingZ, args2.gridPlacement.spacingZ)),
      ),
      gender: normalizeGender(localPath?.gridPlacement?.gender),
      colorKey: normalizeColorKey(localPath?.gridPlacement?.colorKey || localPath?.gridPlacement?.color),
    },
    capture: {
      pending: localPath?.capture?.pending === true,
      lastCaptureAt:
        localPath?.capture?.lastCaptureAt == null
          ? null
          : toFiniteNumber(localPath.capture.lastCaptureAt, null),
      error: localPath?.capture?.error ? String(localPath.capture.error) : null,
      mode: normalizeCaptureMode(localPath?.capture?.mode),
      showSafeFrame: localPath?.capture?.showSafeFrame === true,
    },
    ui: {
      mouseTool: mouseTool,
      transformTool: transformTool,
      activeTool: activeTool,
      transformSpace: normalizeTransformSpace(localPath?.ui?.transformSpace),
      pivotMode: normalizePivotMode(localPath?.ui?.pivotMode),
      navigationPreset: normalizeNavigationPreset(localPath?.ui?.navigationPreset),
      showCameraList: localPath?.ui?.showCameraList === true,
      isEditing: localPath?.ui?.isEditing === true,
    },
  };
}
export function normalizeSceneOnlyPanoramaSceneState(value71) {
  const activeView = normalizePanoramaSceneState(value71),
    value72 = String(activeView?.viewport?.activeCameraId || '').trim() || null,
    activeCameraId2 = value72
      ? Array.isArray(activeView.cameras) && activeView.cameras.some((item28) => item28.id === value72)
      : false;
  return {
    ...activeView,
    mode: 'scene',
    viewport: {
      ...activeView.viewport,
      activeView: activeView.viewport?.activeView === 'camera' && activeCameraId2 ? 'camera' : 'default',
      activeCameraId: activeCameraId2 ? value72 : null,
    },
  };
}
export function normalizePanorama360State(value73) {
  const args5 = normalizePanoramaSceneState(value73),
    map6 = new Set(
      (Array.isArray(args5.mannequins) ? args5.mannequins : [])
        .map((item29) => String(item29?.id || '').trim())
        .filter(Boolean),
    ),
    list7 = Array.isArray(args5.groups) ? args5.groups : [];
  let selectedObjects2 = (
    Array.isArray(args5.selection?.selectedObjects) ? args5.selection.selectedObjects : []
  )
    .map((item30) => ({
      objectType: String(item30?.objectType || '').trim(),
      objectId: String(item30?.objectId || '').trim(),
    }))
    .filter((item31) => item31.objectType === 'mannequin' && map6.has(item31.objectId));
  const value74 = String(args5.selection?.selectedGroupId || '').trim(),
    value75 =
      value74 && list7.length > 0
        ? list7.find((item32) => String(item32?.id || '').trim() === value74) || null
        : null;
  let selectedGroupId2 = null;
  value75 &&
    ((selectedGroupId2 = value75.id),
    (selectedObjects2 = value75.memberIds
      .map((item33) => String(item33 || '').trim())
      .filter((item34) => map6.has(item34))
      .map((objectId5) => ({ objectType: 'mannequin', objectId: objectId5 }))));
  if (selectedObjects2.length === 0) {
    const objectId6 = String(args5.selection?.selectedObjectId || '').trim();
    String(args5.selection?.selectedObjectType || '').trim() === 'mannequin' &&
      objectId6 &&
      map6.has(objectId6) &&
      (selectedObjects2 = [{ objectType: 'mannequin', objectId: objectId6 }]);
  }
  const map7 = new Set();
  selectedObjects2 = selectedObjects2.filter((item35) => {
    const value76 = item35.objectType + ':' + item35.objectId;
    if (map7.has(value76)) return false;
    return (map7.add(value76), true);
  });
  const selectedObjectIds2 = selectedObjects2.map((item36) => item36.objectId),
    value77 = String(args5.selection?.selectedObjectId || '').trim(),
    selectedObjectType2 =
      value77 && selectedObjectIds2.includes(value77) ? value77 : selectedObjectIds2[0] || null;
  return {
    ...args5,
    mode: 'panorama',
    cubes: [],
    cameras: [],
    viewport: { ...args5.viewport, activeView: 'default', activeCameraId: null },
    selection: {
      selectedObjectType: selectedObjectType2 ? 'mannequin' : null,
      selectedObjectId: selectedObjectType2,
      selectedObjectIds: selectedObjectIds2,
      selectedObjects: selectedObjects2,
      selectedGroupId: selectedGroupId2 && selectedObjects2.length > 0 ? selectedGroupId2 : null,
    },
    ui: { ...args5.ui, showCameraList: false },
  };
}
export function createPanoramaSceneNodeData({
  id: id4,
  x: x = 0,
  y: y = 0,
  width: width = PANORAMA_SCENE_DEFAULT_SIZE.width,
  height: height = PANORAMA_SCENE_DEFAULT_SIZE.height,
  name: name = getPanoramaSceneDefaultName(),
} = {}) {
  return {
    id: id4,
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
  id: id5,
  x: x = 0,
  y: y = 0,
  width: width = PANORAMA_SCENE_DEFAULT_SIZE.width,
  height: height = PANORAMA_SCENE_DEFAULT_SIZE.height,
  name: name = getPanorama360DefaultName(),
} = {}) {
  return {
    id: id5,
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
