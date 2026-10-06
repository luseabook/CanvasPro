import {
  createStoryboard3DShotAnimation,
  normalizeStoryboard3DShotAnimation,
  upsertStoryboard3DCameraKeyframe,
} from './shotAnimation.js';
import { DIRECTOR_CHARACTER_COLORS, normalizeDirectorPoseLibrary } from './directorCharacterAuthoring.js';
import { normalizeDirectorSceneSettings } from './directorSceneSettings.js';
import { normalizeDirectorRecycleBin } from './directorRecovery.js';
import {
  normalizeDirectorGeneratedLayers,
  normalizeDirectorGenerationJobs,
} from './directorGeneratedLayers.js';
export const STORYBOARD_3D_PROJECT_VERSION = 2;
export const STORYBOARD_3D_SHOT_SIZES = Object.freeze([
  'EST',
  'ELS',
  'LS',
  'MLS',
  'MED',
  'MCU',
  'CU',
  'ECU',
]);
export const STORYBOARD_3D_SHOT_ANGLES = Object.freeze([
  'eye',
  'high',
  'low',
  'top',
  'overShoulder',
  'profile',
  'rear',
]);
const SCENE_ENVIRONMENT_TYPES = new Set(['empty', 'outdoor', 'indoor', 'studio']),
  SCENE_OBJECT_TYPES = new Set(['prop', 'character', 'light', 'camera', 'group']),
  LIGHT_TYPES = new Set(['ambient', 'directional', 'point', 'spot']),
  SHOT_SIZE_SET = new Set(STORYBOARD_3D_SHOT_SIZES),
  SHOT_ANGLE_SET = new Set(STORYBOARD_3D_SHOT_ANGLES);
function toFiniteNumber(value, item) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function toPositiveNumber(index, result, data = 0.0001) {
  return Math.max(data, toFiniteNumber(index, result));
}
function normalizeString(options, target = '') {
  const source = String(options ?? '').trim();
  return source || target;
}
function normalizeOptionalString(next) {
  const current = String(next ?? '').trim();
  return current || undefined;
}
function normalizeVector3(entry, record) {
  const payload = Array.isArray(entry) ? entry : [];
  return [
    toFiniteNumber(payload[0], record[0]),
    toFiniteNumber(payload[1], record[1]),
    toFiniteNumber(payload[2], record[2]),
  ];
}
function normalizeVector2(handle, state) {
  const config = Array.isArray(handle) ? handle : [];
  return [toFiniteNumber(config[0], state[0]), toFiniteNumber(config[1], state[1])];
}
function normalizeVector2List(scope) {
  return (Array.isArray(scope) ? scope : [])
    .slice(0, 24)
    .filter((input) => Array.isArray(input))
    .map((output) => normalizeVector2(output, [0, 0]));
}
function createDefaultId(value2 = 'item') {
  const value3 = globalThis.crypto?.randomUUID?.();
  if (value3) return value2 + '_' + value3;
  return value2 + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
}
function resolveIdFactory(value4) {
  return typeof value4 === 'function' ? value4 : createDefaultId;
}
function normalizeTimestamp(value5, value6) {
  return Math.max(0, toFiniteNumber(value5, value6));
}
export function cloneStoryboard3DProject(value7) {
  if (typeof structuredClone === 'function') return structuredClone(value7);
  return JSON.parse(JSON.stringify(value7));
}
export function createDefaultStoryboard3DTransform() {
  return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
}
export function createDefaultStoryboard3DCameraState() {
  return {
    position: [5, 4, 7],
    target: [0, 1.2, 0],
    focalLength: 35,
    near: 0.1,
    far: 1000,
    aspectRatio: '16:9',
  };
}
function cameraRotationFromState(value8) {
  const vector3 = normalizeVector3(value8?.position, [5, 4, 7]),
    vector32 = normalizeVector3(value8?.target, [0, 1.2, 0]),
    args = vector32.map((value9, value10) => value9 - vector3[value10]),
    value11 = Math.max(0.0001, Math.hypot(...args));
  return [
    Math.asin(Math.max(-1, Math.min(1, args[1] / value11))),
    Math.atan2(-args[0], -args[2]),
    toFiniteNumber(value8?.roll, 0),
  ];
}
function cameraTargetFromRotation(value12, value13, value14) {
  const vector33 = normalizeVector3(value12, [5, 4, 7]),
    vector34 = normalizeVector3(value13, [0, 0, 0]),
    value15 = Math.max(0.25, toFiniteNumber(value14, 5)),
    value16 = Math.cos(vector34[0]);
  return [
    vector33[0] - Math.sin(vector34[1]) * value16 * value15,
    vector33[1] + Math.sin(vector34[0]) * value15,
    vector33[2] - Math.cos(vector34[1]) * value16 * value15,
  ];
}
function boundCameraName(value17) {
  return normalizeString(value17?.name, 'Shot') + ' 摄像机';
}
export function createStoryboard3DCameraObject({
  id: id,
  name: name2,
  camera: camera,
  visible: visible = true,
  locked: locked = false,
  idFactory: idFactory,
} = {}) {
  const run = resolveIdFactory(idFactory),
    args2 = normalizeCameraState(camera);
  return {
    id: normalizeString(id, run('camera')),
    type: 'camera',
    name: normalizeString(name2, '摄像机'),
    visible: visible !== false,
    locked: locked === true,
    transform: {
      position: [...args2.position],
      rotation: cameraRotationFromState(args2),
      scale: [1, 1, 1],
    },
    target: [...args2.target],
    focalLength: args2.focalLength,
    near: args2.near,
    far: args2.far,
    aspectRatio: args2.aspectRatio,
    ...(args2.fov != null ? { fov: args2.fov } : {}),
  };
}
export function getStoryboard3DCameraStateFromObject(value18, value19) {
  const event = normalizeCameraState(value19),
    cameraState = normalizeCameraState({
      ...event,
      position: value18?.transform?.position ?? event.position,
      target: value18?.target ?? event.target,
      focalLength: value18?.focalLength ?? event.focalLength,
      near: value18?.near ?? event.near,
      far: value18?.far ?? event.far,
      aspectRatio: value18?.aspectRatio ?? event.aspectRatio,
      fov: value18?.fov ?? event.fov,
      roll: value18?.transform?.rotation?.[2] ?? event.roll,
    });
  return (
    value19?.roll == null &&
      Math.abs(cameraState.roll || 0) < 0.000001 &&
      delete cameraState.roll,
    cameraState
  );
}
export function syncStoryboard3DCameraObjectFromShot(value20, enabled) {
  const count =
    value20?.objects?.findIndex?.(
      (value21) => value21.id === enabled?.cameraId && value21.type === 'camera',
    ) ?? -1;
  if (count < 0 || !enabled?.camera) return null;
  const args3 = value20.objects[count],
    args4 = normalizeCameraState(enabled.camera),
    value22 = {
      ...args3,
      name: boundCameraName(enabled),
      transform: {
        position: [...args4.position],
        rotation: cameraRotationFromState(args4),
        scale: [...(args3.transform?.scale || [1, 1, 1])],
      },
      target: [...args4.target],
      focalLength: args4.focalLength,
      near: args4.near,
      far: args4.far,
      aspectRatio: args4.aspectRatio,
    };
  if (args4.fov != null) value22.fov = args4.fov;
  else delete value22.fov;
  return ((value20.objects[count] = value22), value22);
}
export function syncStoryboard3DShotFromCameraObject(
  value23,
  value24,
  { previousTransform: previousTransform } = {},
) {
  const event2 = value23?.objects?.find?.(
      (value25) => value25.id === value24 && value25.type === 'camera',
    ),
    enabled2 = value23?.shots?.find?.((value26) => value26.cameraId === value24);
  if (!event2 || !enabled2) return null;
  if (previousTransform) {
    const vector35 = normalizeVector3(previousTransform.position, event2.transform.position),
      vector36 = normalizeVector3(event2.transform.position, vector35),
      vector37 = normalizeVector3(previousTransform.rotation, event2.transform.rotation),
      vector38 = normalizeVector3(event2.transform.rotation, vector37),
      value27 = vector38.some((value28, value29) => Math.abs(value28 - vector37[value29]) > 0.000001),
      value30 = Math.max(
        0.25,
        Math.hypot(
          ...normalizeVector3(event2.target, enabled2.camera.target).map(
            (value31, value32) => value31 - vector35[value32],
          ),
        ),
      );
    event2.target = value27
      ? cameraTargetFromRotation(vector36, vector38, value30)
      : normalizeVector3(event2.target, enabled2.camera.target).map(
          (value33, value34) => value33 + vector36[value34] - vector35[value34],
        );
  }
  const storyboard3DCameraStateFromObject = getStoryboard3DCameraStateFromObject(event2, enabled2.camera);
  return (
    (enabled2.camera = storyboard3DCameraStateFromObject),
    (enabled2.animation = upsertStoryboard3DCameraKeyframe(enabled2.animation, {
      time: 0,
      camera: storyboard3DCameraStateFromObject,
    })),
    enabled2
  );
}
export function createDefaultStoryboard3DEnvironment(value35 = 'empty') {
  return {
    type: SCENE_ENVIRONMENT_TYPES.has(value35) ? value35 : 'empty',
    showGrid: true,
    showOutline: true,
    enableShadows: true,
    groundSize: 100,
  };
}
export function createStoryboard3DShot({
  id: id2,
  sceneId: sceneId,
  name: name = 'Shot 1',
  description: description = '',
  camera: camera2,
  cameraId: cameraId,
  order: order = 0,
  now: now = Date.now(),
  idFactory: idFactory2,
} = {}) {
  const run2 = resolveIdFactory(idFactory2),
    cameraState2 = normalizeCameraState(camera2),
    value36 = {
      id: normalizeString(id2, run2('shot')),
      sceneId: normalizeString(sceneId, 'scene'),
      name: normalizeString(name, 'Shot 1'),
      description: String(description || ''),
      camera: cameraState2,
      animation: createStoryboard3DShotAnimation({ camera: cameraState2, idFactory: run2 }),
      shotSize: 'MED',
      shotAngle: 'eye',
      order: Math.max(0, Math.round(toFiniteNumber(order, 0))),
      createdAt: now,
      updatedAt: now,
    },
    optionalString = normalizeOptionalString(cameraId);
  if (optionalString) value36.cameraId = optionalString;
  return value36;
}
export function createStoryboard3DScene({
  id: id3,
  name: name = 'Scene 1',
  environmentType: environmentType = 'empty',
  shotName: shotName = 'Shot 1',
  now: now = Date.now(),
  idFactory: idFactory3,
} = {}) {
  const run3 = resolveIdFactory(idFactory3),
    string = normalizeString(id3, run3('scene')),
    defaultStoryboard3DCameraState = createDefaultStoryboard3DCameraState(),
    storyboard3DCameraObject = createStoryboard3DCameraObject({
      name: shotName + ' 摄像机',
      camera: defaultStoryboard3DCameraState,
      idFactory: run3,
    }),
    storyboard3DShot = createStoryboard3DShot({
      sceneId: string,
      name: shotName,
      camera: defaultStoryboard3DCameraState,
      cameraId: storyboard3DCameraObject.id,
      now: now,
      idFactory: run3,
    });
  return {
    id: string,
    name: normalizeString(name, 'Scene 1'),
    environment: createDefaultStoryboard3DEnvironment(environmentType),
    objects: [storyboard3DCameraObject],
    shots: [storyboard3DShot],
    activeShotId: storyboard3DShot.id,
  };
}
export function createStoryboard3DProject({
  id: id4,
  name: name = '3D Storyboard',
  sceneName: sceneName = 'Scene 1',
  shotName: shotName = 'Shot 1',
  environmentType: environmentType = 'empty',
  now: now = Date.now(),
  idFactory: idFactory4,
} = {}) {
  const run4 = resolveIdFactory(idFactory4),
    storyboard3DScene = createStoryboard3DScene({
      name: sceneName,
      shotName: shotName,
      environmentType: environmentType,
      now: now,
      idFactory: run4,
    });
  return {
    id: normalizeString(id4, run4('project')),
    name: normalizeString(name, '3D Storyboard'),
    version: STORYBOARD_3D_PROJECT_VERSION,
    scenes: [storyboard3DScene],
    activeSceneId: storyboard3DScene.id,
    createdAt: now,
    updatedAt: now,
  };
}
function normalizeTransform(value37) {
  return {
    position: normalizeVector3(value37?.position, [0, 0, 0]),
    rotation: normalizeVector3(value37?.rotation, [0, 0, 0]),
    scale: normalizeVector3(value37?.scale, [1, 1, 1]).map((value38) =>
      Math.max(0.001, value38),
    ),
  };
}
function normalizeSceneObject(error, { idFactory: idFactory5 } = {}) {
  if (!error || !SCENE_OBJECT_TYPES.has(error.type)) return null;
  const run5 = resolveIdFactory(idFactory5),
    args5 = {
      id: normalizeString(error.id, run5(error.type)),
      name: normalizeString(error.name, error.type),
      visible: error.visible !== false,
      locked: error.locked === true,
      transform: normalizeTransform(error.transform),
    },
    optionalString2 = normalizeOptionalString(error.parentId);
  if (optionalString2) args5.parentId = optionalString2;
  if (error.type === 'prop')
    return {
      ...args5,
      type: 'prop',
      assetId: normalizeString(error.assetId, 'missing-asset'),
      ...(normalizeOptionalString(error.tint) ? { tint: normalizeOptionalString(error.tint) } : {}),
      castShadow: error.castShadow !== false,
      receiveShadow: error.receiveShadow !== false,
    };
  if (error.type === 'character') {
    const args6 = Array.isArray(error.attachmentIds)
      ? error.attachmentIds.map((value39) => normalizeString(value39)).filter(Boolean)
      : [];
    return {
      ...args5,
      type: 'character',
      colorKey: DIRECTOR_CHARACTER_COLORS.includes(error.colorKey) ? error.colorKey : 'blue',
      ...(Number.isFinite(error.heightCm)
        ? { heightCm: Math.max(55, Math.min(230, error.heightCm)) }
        : {}),
      bodyPresetId: normalizeString(error.bodyPresetId, 'default'),
      characterStyle: error.characterStyle === 'anatomical' ? 'anatomical' : 'articulated',
      ...(normalizeOptionalString(error.actionId)
        ? { actionId: normalizeOptionalString(error.actionId) }
        : {}),
      ...(Number.isFinite(Number(error.actionTime))
        ? { actionTime: Math.max(0, Number(error.actionTime)) }
        : {}),
      actionPlaying: error.actionPlaying === true,
      ...(normalizeOptionalString(error.leftHandPoseId)
        ? { leftHandPoseId: normalizeOptionalString(error.leftHandPoseId) }
        : {}),
      ...(normalizeOptionalString(error.rightHandPoseId)
        ? { rightHandPoseId: normalizeOptionalString(error.rightHandPoseId) }
        : {}),
      ...(normalizeOptionalString(error.hairId)
        ? { hairId: normalizeOptionalString(error.hairId) }
        : {}),
      ...(args6.length > 0 ? { attachmentIds: args6 } : {}),
      ...(error.boneOverrides && typeof error.boneOverrides === 'object'
        ? { boneOverrides: cloneStoryboard3DProject(error.boneOverrides) }
        : {}),
    };
  }
  if (error.type === 'light')
    return {
      ...args5,
      type: 'light',
      lightType: LIGHT_TYPES.has(error.lightType) ? error.lightType : 'directional',
      color: normalizeString(error.color, '#ffffff'),
      intensity: Math.max(0, toFiniteNumber(error.intensity, 1)),
      ...(Number.isFinite(Number(error.distance))
        ? { distance: Math.max(0, Number(error.distance)) }
        : {}),
      ...(Number.isFinite(Number(error.decay))
        ? { decay: Math.max(0, Number(error.decay)) }
        : {}),
      ...(Number.isFinite(Number(error.angle))
        ? { angle: Math.max(0, Number(error.angle)) }
        : {}),
      castShadow: error.castShadow === true,
    };
  if (error.type === 'camera')
    return {
      ...args5,
      type: 'camera',
      focalLength: toPositiveNumber(error.focalLength, 35, 1),
      near: toPositiveNumber(error.near, 0.1, 0.001),
      far: toPositiveNumber(error.far, 1000, 1),
      target: normalizeVector3(error.target, [0, 1.2, 0]),
      aspectRatio: normalizeString(error.aspectRatio, '16:9'),
      ...(error.fov != null && Number.isFinite(Number(error.fov))
        ? { fov: Math.max(1, Math.min(179, Number(error.fov))) }
        : {}),
    };
  return { ...args5, type: 'group' };
}
function normalizeCameraState(value40) {
  const value41 = {
    position: normalizeVector3(value40?.position, [5, 4, 7]),
    target: normalizeVector3(value40?.target, [0, 1.2, 0]),
    focalLength: toPositiveNumber(value40?.focalLength, 35, 1),
    near: toPositiveNumber(value40?.near, 0.1, 0.001),
    far: toPositiveNumber(value40?.far, 1000, 1),
    aspectRatio: normalizeString(value40?.aspectRatio, '16:9'),
  };
  return (
    value40?.fov != null &&
      Number.isFinite(Number(value40.fov)) &&
      (value41.fov = Math.max(1, Math.min(179, Number(value40.fov)))),
    value40?.roll != null &&
      Number.isFinite(Number(value40.roll)) &&
      (value41.roll = Math.max(-Math.PI, Math.min(Math.PI, Number(value40.roll)))),
    value41
  );
}
function normalizeShot(
  value42,
  value43,
  value44,
  { now: now2, idFactory: idFactory6, objectIds: objectIds, objectTransforms: objectTransforms } = {},
) {
  const run6 = resolveIdFactory(idFactory6),
    timestamp = normalizeTimestamp(value42?.createdAt, now2),
    cameraState3 = normalizeCameraState(value42?.camera),
    storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(value42?.animation, {
      camera: cameraState3,
      objectIds: objectIds,
      objectTransforms: objectTransforms,
      idFactory: run6,
    }),
    cameraState4 = normalizeCameraState(
      storyboard3DShotAnimation.cameraKeyframes[0]?.camera || cameraState3,
    ),
    value45 = {
      id: normalizeString(value42?.id, run6('shot')),
      sceneId: value43,
      name: normalizeString(value42?.name, 'Shot ' + (value44 + 1)),
      description: String(value42?.description || ''),
      camera: cameraState4,
      animation: storyboard3DShotAnimation,
      shotSize: SHOT_SIZE_SET.has(value42?.shotSize) ? value42.shotSize : 'MED',
      shotAngle: SHOT_ANGLE_SET.has(value42?.shotAngle) ? value42.shotAngle : 'eye',
      order: Math.max(0, Math.round(toFiniteNumber(value42?.order, value44))),
      createdAt: timestamp,
      updatedAt: normalizeTimestamp(value42?.updatedAt, timestamp),
    },
    optionalString3 = normalizeOptionalString(value42?.cameraId);
  if (optionalString3) value45.cameraId = optionalString3;
  const optionalString4 = normalizeOptionalString(value42?.thumbnailUrl);
  if (optionalString4) value45.thumbnailUrl = optionalString4;
  return value45;
}
function normalizeBackground(args7) {
  const optionalString5 = normalizeOptionalString(args7?.imageUrl);
  if (!optionalString5) return undefined;
  const args8 = normalizeOptionalString(args7?.binaryAssetId),
    value46 = {
      imageUrl: optionalString5,
      ...(args8 ? { binaryAssetId: args8 } : {}),
      horizontalFov: toPositiveNumber(args7?.horizontalFov, 50, 1),
      ...(args7?.verticalFov != null && Number.isFinite(Number(args7.verticalFov))
        ? { verticalFov: toPositiveNumber(args7.verticalFov, 35, 1) }
        : {}),
      ...(Number.isFinite(Number(args7?.horizonY)) ? { horizonY: Number(args7.horizonY) } : {}),
      ...(Number.isFinite(Number(args7?.horizonSlope))
        ? { horizonSlope: Math.max(-1, Math.min(1, Number(args7.horizonSlope))) }
        : {}),
      ...(Array.isArray(args7?.vanishingPoint)
        ? { vanishingPoint: normalizeVector2(args7.vanishingPoint, [0.5, 0.5]) }
        : {}),
      cameraHeight: toPositiveNumber(args7?.cameraHeight, 1.6, 0.2),
      imageScale: toPositiveNumber(args7?.imageScale, 1, 0.01),
      imageOffset: normalizeVector2(args7?.imageOffset, [0, 0]),
      lockedCamera: args7?.lockedCamera === true,
      ...(args7?.lockedCameraSnapshot
        ? { lockedCameraSnapshot: normalizeCameraState(args7.lockedCameraSnapshot) }
        : {}),
    },
    count2 = Math.max(0, Math.round(toFiniteNumber(args7?.imageWidth, 0))),
    count3 = Math.max(0, Math.round(toFiniteNumber(args7?.imageHeight, 0)));
  if (count2 > 0) value46.imageWidth = count2;
  if (count3 > 0) value46.imageHeight = count3;
  const vector2List = normalizeVector2List(args7?.groundRegion);
  if (vector2List.length >= 3) value46.groundRegion = vector2List;
  const optionalString6 = normalizeOptionalString(args7?.calibrationMethod);
  if (optionalString6) value46.calibrationMethod = optionalString6;
  return (
    args7?.calibrationConfidence != null &&
      Number.isFinite(Number(args7.calibrationConfidence)) &&
      (value46.calibrationConfidence = Math.max(
        0,
        Math.min(1, Number(args7.calibrationConfidence)),
      )),
    value46
  );
}
function normalizeScene(value47, value48, { now: now3, idFactory: idFactory7 } = {}) {
  const run7 = resolveIdFactory(idFactory7),
    string2 = normalizeString(value47?.id, run7('scene')),
    value49 = (Array.isArray(value47?.objects) ? value47.objects : [])
      .map((value50) => normalizeSceneObject(value50, { idFactory: run7 }))
      .filter(Boolean),
    value51 = value49,
    value52 = new Set(
      value51.filter((value53) => value53.type !== 'camera').map((value54) => value54.id),
    ),
    value55 = Object.fromEntries(
      value51.filter((value56) => value56.type !== 'camera').map((value57) => [
        value57.id,
        value57.transform,
      ]),
    ),
    value58 = Array.isArray(value47?.shots) ? value47.shots : [],
    value59 = value58.map((value60, value61) =>
      normalizeShot(value60, string2, value61, {
        now: now3,
        idFactory: run7,
        objectIds: value52,
        objectTransforms: value55,
      }),
    ),
    enabled3 = new Set();
  (value59.forEach((value62) => {
    let storyboard3DCameraObject2 = value51.find(
      (value63) => value63.id === value62.cameraId && value63.type === 'camera',
    );
    ((!storyboard3DCameraObject2 || enabled3.has(storyboard3DCameraObject2.id)) &&
      ((storyboard3DCameraObject2 = createStoryboard3DCameraObject({
        name: boundCameraName(value62),
        camera: value62.camera,
        idFactory: run7,
      })),
      value51.push(storyboard3DCameraObject2),
      (value62.cameraId = storyboard3DCameraObject2.id)),
      enabled3.add(storyboard3DCameraObject2.id),
      syncStoryboard3DCameraObjectFromShot({ objects: value51 }, value62));
  }),
    value51.filter((value64) => value64.type === 'camera' && !enabled3.has(value64.id)).forEach((value65) => {
      const storyboard3DShot2 = createStoryboard3DShot({
        sceneId: string2,
        name: value65.name,
        camera: getStoryboard3DCameraStateFromObject(value65),
        cameraId: value65.id,
        order: value59.length,
        now: now3,
        idFactory: run7,
      });
      (value59.push(storyboard3DShot2),
        enabled3.add(value65.id),
        syncStoryboard3DCameraObjectFromShot({ objects: value51 }, storyboard3DShot2));
    }));
  const value66 = new Set(value59.map((value67) => value67.id)),
    value68 = SCENE_ENVIRONMENT_TYPES.has(value47?.environment?.type)
      ? value47.environment.type
      : 'empty',
    value69 = {
      ...createDefaultStoryboard3DEnvironment(value68),
      showGrid: value47?.environment?.showGrid !== false,
      showOutline: value47?.environment?.showOutline !== false,
      enableShadows: value47?.environment?.enableShadows !== false,
      groundSize: toPositiveNumber(value47?.environment?.groundSize, 100, 1),
    },
    optionalString7 = normalizeOptionalString(value47?.environment?.backgroundColor);
  if (optionalString7) value69.backgroundColor = optionalString7;
  const args9 = normalizeBackground(value47?.background);
  return {
    id: string2,
    name: normalizeString(value47?.name, 'Scene ' + (value48 + 1)),
    directorSettings: normalizeDirectorSceneSettings(value47?.directorSettings),
    generatedLayers: normalizeDirectorGeneratedLayers(value47?.generatedLayers, (value70) =>
      normalizeSceneObject(value70, { idFactory: run7 }),
    ),
    environment: value69,
    ...(args9 ? { background: args9 } : {}),
    objects: value51,
    shots: value59,
    activeShotId: value66.has(value47?.activeShotId)
      ? value47.activeShotId
      : value59[0]?.id || '',
  };
}
export function migrateStoryboard3DProject(
  enabled4,
  { now: now = Date.now(), idFactory: idFactory8, fallbackProject: fallbackProject } = {},
) {
  const run8 = resolveIdFactory(idFactory8);
  if (!enabled4 || typeof enabled4 !== 'object' || Array.isArray(enabled4))
    return fallbackProject
      ? cloneStoryboard3DProject(fallbackProject)
      : createStoryboard3DProject({ now: now, idFactory: run8 });
  const value71 = Math.max(1, Math.round(toFiniteNumber(enabled4.version, 1)));
  if (value71 > STORYBOARD_3D_PROJECT_VERSION)
    throw new Error('Unsupported 3D storyboard project version: ' + value71);
  const value72 = Array.isArray(enabled4.scenes) ? enabled4.scenes : [],
    value73 = value72.map((value74, value75) =>
      normalizeScene(value74, value75, { now: now, idFactory: run8 }),
    );
  value73.length === 0 && value73.push(createStoryboard3DScene({ now: now, idFactory: run8 }));
  const value76 = new Set(value73.map((value77) => value77.id)),
    timestamp2 = normalizeTimestamp(enabled4.createdAt, now);
  return {
    id: normalizeString(enabled4.id, run8('project')),
    name: normalizeString(enabled4.name, '3D Storyboard'),
    version: STORYBOARD_3D_PROJECT_VERSION,
    scenes: value73,
    poseLibrary: normalizeDirectorPoseLibrary(enabled4.poseLibrary),
    recycleBin: normalizeDirectorRecycleBin(enabled4.recycleBin, (value78, value79) =>
      normalizeScene(value78, value79, { now: now, idFactory: run8 }),
    ),
    generationJobs: normalizeDirectorGenerationJobs(enabled4.generationJobs),
    activeSceneId: value76.has(enabled4.activeSceneId) ? enabled4.activeSceneId : value73[0].id,
    createdAt: timestamp2,
    updatedAt: normalizeTimestamp(enabled4.updatedAt, timestamp2),
  };
}
export function summarizeStoryboard3DProject(value80) {
  const value81 = Array.isArray(value80?.scenes) ? value80.scenes : [];
  return {
    sceneCount: value81.length,
    shotCount: value81.reduce(
      (value82, value83) =>
        value82 + (Array.isArray(value83?.shots) ? value83.shots.length : 0),
      0,
    ),
    objectCount: value81.reduce(
      (value84, value85) =>
        value84 + (Array.isArray(value85?.objects) ? value85.objects.length : 0),
      0,
    ),
  };
}
export function getActiveStoryboard3DScene(value86) {
  const value87 = Array.isArray(value86?.scenes) ? value86.scenes : [];
  return value87.find((value88) => value88.id === value86?.activeSceneId) || value87[0] || null;
}
export function getActiveStoryboard3DShot(value89) {
  const activeStoryboard3DScene = getActiveStoryboard3DScene(value89);
  if (!activeStoryboard3DScene) return null;
  return (
    activeStoryboard3DScene.shots?.find(
      (value90) => value90.id === activeStoryboard3DScene.activeShotId,
    ) ||
    activeStoryboard3DScene.shots?.[0] ||
    null
  );
}
