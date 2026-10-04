import {
  focalLengthToFov,
  SCENE_FOCAL_LENGTH_MAX_MM,
  SCENE_FOCAL_LENGTH_MIN_MM,
  SCENE_SENSOR_WIDTH_MM,
} from '../../core/panoramaSceneMath.js';
import {
  cloneStoryboard3DProject,
  createStoryboard3DCameraObject,
  createStoryboard3DShot,
  syncStoryboard3DCameraObjectFromShot,
} from './projectModel.js';
import { normalizeStoryboard3DShotAnimation, upsertStoryboard3DCameraKeyframe } from './shotAnimation.js';
export const STORYBOARD_3D_FOCAL_LENGTH_PRESETS = Object['freeze']([
  0xf, 0x23, 0x37, 0x4b, 0x69, 0x87, 0x9b, 0xc8,
]);
const SHOT_SIZE_BY_MIN_COVERAGE = Object['freeze']([
    [1.08, 'ECU'],
    [0.84, 'CU'],
    [0.66, 'MCU'],
    [0.48, 'MED'],
    [0.34, 'MLS'],
    [0.22, 'LS'],
    [0.12, 'ELS'],
    [0x0, 'EST'],
  ]),
  STORYBOARD_FOCAL_LENGTH_MIN_MM = 0xf,
  STORYBOARD_FOCAL_LENGTH_MAX_MM = 0xc8;
function finite(value, item = 0x0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function clamp(index, result, data) {
  return Math['min'](data, Math['max'](result, index));
}
function vector3(box, options = [0x0, 0x0, 0x0]) {
  if (Array['isArray'](box))
    return [finite(box[0x0], options[0x0]), finite(box[0x1], options[0x1]), finite(box[0x2], options[0x2])];
  return [
    finite(box?.['x'], options[0x0]),
    finite(box?.['y'], options[0x1]),
    finite(box?.['z'], options[0x2]),
  ];
}
function length3(target) {
  return Math['hypot'](target[0x0], target[0x1], target[0x2]);
}
function normalize3(source, args = [0x0, 0x0, 0x1]) {
  const length32 = length3(source);
  return length32 > 1e-8 ? source['map']((next) => next / length32) : [...args];
}
function subtract3(current, entry) {
  return [current[0x0] - entry[0x0], current[0x1] - entry[0x1], current[0x2] - entry[0x2]];
}
function dot3(record, payload) {
  return record[0x0] * payload[0x0] + record[0x1] * payload[0x1] + record[0x2] * payload[0x2];
}
function normalizeCamera(options2 = {}) {
  const handle = Math['max'](0.001, finite(options2['near'], 0.1));
  return {
    position: vector3(options2['position'], [0x5, 0x4, 0x7]),
    target: vector3(options2['target'], [0x0, 1.2, 0x0]),
    focalLength: clamp(
      finite(options2['focalLength'], 0x23),
      STORYBOARD_FOCAL_LENGTH_MIN_MM,
      STORYBOARD_FOCAL_LENGTH_MAX_MM,
    ),
    near: handle,
    far: Math['max'](handle + 0.001, finite(options2['far'], 0x3e8)),
    aspectRatio: normalizeAspectRatio(options2['aspectRatio']),
  };
}
export function normalizeStoryboard3DCameraState(options3 = {}) {
  return normalizeCamera(options3);
}
export function setStoryboard3DCameraFocalLength(args2, state) {
  return normalizeCamera({ ...args2, focalLength: state });
}
export function restoreStoryboard3DCameraFromShot(enabled) {
  if (!enabled?.['camera']) throw new Error('A\x20shot\x20camera\x20is\x20required');
  return normalizeCamera(enabled['camera']);
}
function normalizeBounds(enabled2) {
  if (!enabled2) return null;
  const vector32 = vector3(enabled2['min'], [0x0, 0x0, 0x0]),
    vector33 = vector3(enabled2['max'], vector32),
    config = vector32['map']((scope, input) => Math['min'](scope, vector33[input])),
    list = vector33['map']((output, value2) => Math['max'](output, vector32[value2])),
    value3 = config['map']((value4, value5) => (value4 + list[value5]) / 0x2);
  return {
    min: config,
    max: list,
    center: value3,
    size: list['map']((value6, value7) => value6 - config[value7]),
  };
}
function nextShotName(value8) {
  return 'Shot\x20' + ((Array['isArray'](value8?.['shots']) ? value8['shots']['length'] : 0x0) + 0x1);
}
function normalizeShotOrders(value9) {
  return value9['map']((args3, value10) => ({ ...args3, order: value10 }));
}
function cloneScene(value11) {
  return cloneStoryboard3DProject(value11);
}
function bindNewCameraToShot(args4, value12, { idFactory: idFactory } = {}) {
  const storyboard3DCameraObject = createStoryboard3DCameraObject({
    name: value12['name'] + '\x20摄像机',
    camera: value12['camera'],
    idFactory: idFactory,
  });
  return (
    (value12['cameraId'] = storyboard3DCameraObject['id']),
    (args4['objects'] = [...(args4['objects'] || []), storyboard3DCameraObject]),
    syncStoryboard3DCameraObjectFromShot(args4, value12),
    value12
  );
}
export function normalizeAspectRatio(value13 = '16:9') {
  const value14 = String(value13 || '16:9')['trim'](),
    enabled3 = value14['match'](/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!enabled3) return '16:9';
  const count = Number(enabled3[0x1]),
    count2 = Number(enabled3[0x2]);
  if (!(count > 0x0) || !(count2 > 0x0)) return '16:9';
  return count + ':' + count2;
}
export function aspectRatioToNumber(value15 = '16:9') {
  const aspectRatio = normalizeAspectRatio(value15),
    [value16, value17] = aspectRatio['split'](':')['map'](Number);
  return value16 / value17;
}
export function deriveStoryboard3DCameraOptics(options4 = {}) {
  const camera = normalizeCamera(options4),
    number = aspectRatioToNumber(camera['aspectRatio']),
    value18 =
      camera['focalLength'] >= SCENE_FOCAL_LENGTH_MIN_MM && camera['focalLength'] <= SCENE_FOCAL_LENGTH_MAX_MM
        ? focalLengthToFov(camera['focalLength'])
        : (0x2 * Math['atan']((SCENE_SENSOR_WIDTH_MM * (0x2 / 0x3)) / (0x2 * camera['focalLength'])) * 0xb4) /
          Math['PI'],
    value19 = (0x2 * Math['atan'](Math['tan']((value18 * Math['PI']) / 0x168) * number) * 0xb4) / Math['PI'];
  return {
    focalLength: camera['focalLength'],
    aspectRatio: camera['aspectRatio'],
    aspect: number,
    horizontalFov: value19,
    verticalFov: value18,
  };
}
export function inferStoryboard3DShotSize({ camera: camera2, subjectBounds: subjectBounds } = {}) {
  const camera3 = normalizeCamera(camera2),
    bounds = normalizeBounds(subjectBounds);
  if (!bounds || bounds['size'][0x1] <= 0.0001) {
    const count3 = camera3['focalLength'];
    if (count3 >= 0x64) return 'ECU';
    if (count3 >= 0x55) return 'CU';
    if (count3 >= 0x41) return 'MCU';
    if (count3 >= 0x2d) return 'MED';
    if (count3 >= 0x20) return 'MLS';
    if (count3 >= 0x18) return 'LS';
    if (count3 >= 0x12) return 'ELS';
    return 'EST';
  }
  const value20 = Math['max'](0.001, length3(subtract3(bounds['center'], camera3['position']))),
    value21 = 0x2 * Math['atan'](bounds['size'][0x1] / (0x2 * value20)),
    storyboard3DCameraOptics = (deriveStoryboard3DCameraOptics(camera3)['verticalFov'] * Math['PI']) / 0xb4,
    value22 = value21 / Math['max'](0.001, storyboard3DCameraOptics);
  return SHOT_SIZE_BY_MIN_COVERAGE['find'](([value23]) => value22 >= value23)?.[0x1] || 'EST';
}
export function inferStoryboard3DShotAngle({
  camera: camera4,
  subjectBounds: subjectBounds2,
  subjectForward: subjectForward,
  compositionHint: compositionHint,
} = {}) {
  if (compositionHint === 'overShoulder') return 'overShoulder';
  const camera5 = normalizeCamera(camera4),
    bounds2 = normalizeBounds(subjectBounds2),
    value24 = bounds2?.['center'] || camera5['target'],
    subtract32 = subtract3(camera5['position'], value24),
    value25 = Math['hypot'](subtract32[0x0], subtract32[0x2]),
    value26 = Math['atan2'](subtract32[0x1], Math['max'](0.0001, value25));
  if (value26 >= Math['PI'] / 0x3) return 'top';
  if (value26 >= Math['PI'] / 0xc) return 'high';
  if (value26 <= -Math['PI'] / 0xe) return 'low';
  if (subjectForward) {
    const v3 = normalize3(vector3(subjectForward, [0x0, 0x0, 0x1])),
      v32 = normalize3([subtract32[0x0], 0x0, subtract32[0x2]]),
      dot32 = dot3(v3, v32);
    if (dot32 <= -0.72) return 'rear';
    if (Math['abs'](dot32) <= 0.38) return 'profile';
  }
  return 'eye';
}
export function analyzeStoryboard3DCamera({
  camera: camera6,
  subjectBounds: subjectBounds3,
  subjectForward: subjectForward2,
  compositionHint: compositionHint2,
} = {}) {
  const camera7 = normalizeCamera(camera6);
  return {
    camera: camera7,
    optics: deriveStoryboard3DCameraOptics(camera7),
    shotSize: inferStoryboard3DShotSize({ camera: camera7, subjectBounds: subjectBounds3 }),
    shotAngle: inferStoryboard3DShotAngle({
      camera: camera7,
      subjectBounds: subjectBounds3,
      subjectForward: subjectForward2,
      compositionHint: compositionHint2,
    }),
  };
}
export function createShotFromCurrentView({
  scene: scene,
  camera: camera8,
  name: name,
  description: description = '',
  subjectBounds: subjectBounds4,
  subjectForward: subjectForward3,
  compositionHint: compositionHint3,
  now: now = Date['now'](),
  idFactory: idFactory2,
} = {}) {
  if (!scene?.['id']) throw new Error('A scene is required to create a shot');
  const analyzeStoryboard3DCamera2 = analyzeStoryboard3DCamera({
      camera: camera8,
      subjectBounds: subjectBounds4,
      subjectForward: subjectForward3,
      compositionHint: compositionHint3,
    }),
    storyboard3DShot = createStoryboard3DShot({
      sceneId: scene['id'],
      name: String(name || '')['trim']() || nextShotName(scene),
      description: description,
      camera: analyzeStoryboard3DCamera2['camera'],
      order: Array['isArray'](scene['shots']) ? scene['shots']['length'] : 0x0,
      now: now,
      idFactory: idFactory2,
    });
  return (
    (storyboard3DShot['shotSize'] = analyzeStoryboard3DCamera2['shotSize']),
    (storyboard3DShot['shotAngle'] = analyzeStoryboard3DCamera2['shotAngle']),
    storyboard3DShot
  );
}
export function appendShotFromCurrentView(args5 = {}) {
  const args6 = cloneScene(args5['scene']),
    shotFromCurrentView = createShotFromCurrentView({ ...args5, scene: args6 });
  return (
    bindNewCameraToShot(args6, shotFromCurrentView, args5),
    (args6['shots'] = normalizeShotOrders([...(args6['shots'] || []), shotFromCurrentView])),
    (args6['activeShotId'] = shotFromCurrentView['id']),
    args6
  );
}
export function appendStoryboard3DShotCandidate(
  value27,
  enabled4,
  { idFactory: idFactory3, now: now = Date['now'](), name: name2, description: description = '' } = {},
) {
  if (!enabled4?.['camera']) throw new Error('A shot candidate camera is required');
  const args7 = cloneScene(value27),
    storyboard3DShot2 = createStoryboard3DShot({
      sceneId: args7['id'],
      name: String(name2 || '')['trim']() || nextShotName(args7),
      description: description,
      camera: enabled4['camera'],
      order: Array['isArray'](args7['shots']) ? args7['shots']['length'] : 0x0,
      now: now,
      idFactory: idFactory3,
    });
  return (
    bindNewCameraToShot(args7, storyboard3DShot2, { idFactory: idFactory3 }),
    (storyboard3DShot2['shotSize'] = enabled4['shotSize'] || storyboard3DShot2['shotSize']),
    (storyboard3DShot2['shotAngle'] = enabled4['shotAngle'] || storyboard3DShot2['shotAngle']),
    (args7['shots'] = normalizeShotOrders([...(args7['shots'] || []), storyboard3DShot2])),
    (args7['activeShotId'] = storyboard3DShot2['id']),
    args7
  );
}
export function duplicateStoryboard3DShot(
  value28,
  value29,
  { idFactory: idFactory4, now: now = Date['now'](), name: name3 } = {},
) {
  const cloneScene2 = cloneScene(value28),
    list2 = Array['isArray'](cloneScene2['shots']) ? cloneScene2['shots'] : [],
    count4 = list2['findIndex']((value30) => value30['id'] === value29);
  if (count4 < 0x0) return cloneScene2;
  const value31 = list2[count4],
    storyboard3DShot3 = createStoryboard3DShot({
      sceneId: cloneScene2['id'],
      name: String(name3 || '')['trim']() || value31['name'] + ' Copy',
      description: value31['description'],
      camera: value31['camera'],
      order: count4 + 0x1,
      now: now,
      idFactory: idFactory4,
    });
  (bindNewCameraToShot(cloneScene2, storyboard3DShot3, { idFactory: idFactory4 }),
    (storyboard3DShot3['shotSize'] = value31['shotSize']),
    (storyboard3DShot3['shotAngle'] = value31['shotAngle']),
    (storyboard3DShot3['animation'] = normalizeStoryboard3DShotAnimation(value31['animation'], {
      camera: value31['camera'],
    })));
  if (value31['thumbnailUrl']) storyboard3DShot3['thumbnailUrl'] = value31['thumbnailUrl'];
  return (
    list2['splice'](count4 + 0x1, 0x0, storyboard3DShot3),
    (cloneScene2['shots'] = normalizeShotOrders(list2)),
    (cloneScene2['activeShotId'] = storyboard3DShot3['id']),
    cloneScene2
  );
}
export function deleteStoryboard3DShot(value32, value33) {
  const cloneScene3 = cloneScene(value32),
    list3 = Array['isArray'](cloneScene3['shots']) ? cloneScene3['shots'] : [],
    count5 = list3['findIndex']((value34) => value34['id'] === value33);
  if (count5 < 0x0) return cloneScene3;
  const [value35] = list3['slice'](count5, count5 + 0x1);
  return (
    list3['splice'](count5, 0x1),
    (cloneScene3['objects'] = (cloneScene3['objects'] || [])['filter'](
      (value36) => value36['id'] !== value35['cameraId'],
    )),
    (cloneScene3['shots'] = normalizeShotOrders(list3)),
    cloneScene3['activeShotId'] === value33 &&
      (cloneScene3['activeShotId'] = list3[Math['min'](count5, list3['length'] - 0x1)]?.['id'] || ''),
    cloneScene3
  );
}
export function reorderStoryboard3DShot(value37, value38, value39) {
  const cloneScene4 = cloneScene(value37),
    value40 = Array['isArray'](cloneScene4['shots']) ? cloneScene4['shots'] : [],
    count6 = value40['findIndex']((value41) => value41['id'] === value38);
  if (count6 < 0x0) return cloneScene4;
  const clamp2 = clamp(Math['round'](finite(value39, count6)), 0x0, value40['length'] - 0x1),
    [value42] = value40['splice'](count6, 0x1);
  return (
    value40['splice'](clamp2, 0x0, value42),
    (cloneScene4['shots'] = normalizeShotOrders(value40)),
    cloneScene4
  );
}
export function renameStoryboard3DShot(value43, value44, value45, { now: now = Date['now']() } = {}) {
  const enabled5 = String(value45 || '')['trim']();
  if (!enabled5) return cloneScene(value43);
  return updateShot(value43, value44, (args8) => ({ ...args8, name: enabled5, updatedAt: now }));
}
export function describeStoryboard3DShot(value46, value47, value48, { now: now = Date['now']() } = {}) {
  return updateShot(value46, value47, (args9) => ({
    ...args9,
    description: String(value48 || ''),
    updatedAt: now,
  }));
}
export function replaceStoryboard3DShotCamera(
  value49,
  value50,
  value51,
  {
    subjectBounds: subjectBounds5,
    subjectForward: subjectForward4,
    compositionHint: compositionHint4,
    now: now = Date['now'](),
  } = {},
) {
  const analyzeStoryboard3DCamera3 = analyzeStoryboard3DCamera({
    camera: value51,
    subjectBounds: subjectBounds5,
    subjectForward: subjectForward4,
    compositionHint: compositionHint4,
  });
  return updateShot(value49, value50, (args10) => ({
    ...args10,
    camera: analyzeStoryboard3DCamera3['camera'],
    animation: upsertStoryboard3DCameraKeyframe(args10['animation'], {
      time: 0x0,
      camera: analyzeStoryboard3DCamera3['camera'],
    }),
    shotSize: analyzeStoryboard3DCamera3['shotSize'],
    shotAngle: analyzeStoryboard3DCamera3['shotAngle'],
    updatedAt: now,
  }));
}
export function replaceStoryboard3DShotWithCandidate(
  value52,
  value53,
  enabled6,
  { now: now = Date['now']() } = {},
) {
  if (!enabled6?.['camera']) throw new Error('A shot candidate camera is required');
  return updateShot(value52, value53, (args11) => {
    const value54 = {
      ...args11,
      camera: normalizeCamera(enabled6['camera']),
      animation: upsertStoryboard3DCameraKeyframe(args11['animation'], {
        time: 0x0,
        camera: enabled6['camera'],
      }),
      shotSize: enabled6['shotSize'] || args11['shotSize'],
      shotAngle: enabled6['shotAngle'] || args11['shotAngle'],
      updatedAt: now,
    };
    return (delete value54['thumbnailUrl'], value54);
  });
}
export function updateShot(value55, value56, handler) {
  const cloneScene5 = cloneScene(value55),
    value57 = Array['isArray'](cloneScene5['shots']) ? cloneScene5['shots'] : [],
    count7 = value57['findIndex']((value58) => value58['id'] === value56);
  return (
    count7 >= 0x0 &&
      typeof handler === 'function' &&
      ((value57[count7] = handler(value57[count7])),
      syncStoryboard3DCameraObjectFromShot(cloneScene5, value57[count7])),
    cloneScene5
  );
}
export function createShotThumbnailRenderRequest(
  enabled7,
  {
    width: width = 0x280,
    height: height = 0x168,
    format: format = 'image/webp',
    quality: quality = 0.86,
  } = {},
) {
  if (!enabled7?.['id'] || !enabled7?.['camera']) throw new Error('A persisted shot camera is required');
  const value59 = ['image/png', 'image/jpeg', 'image/webp']['includes'](format) ? format : 'image/webp';
  return {
    kind: 'storyboard3d-shot-thumbnail',
    version: 0x1,
    shotId: String(enabled7['id']),
    sceneId: String(enabled7['sceneId'] || ''),
    camera: normalizeCamera(enabled7['camera']),
    output: {
      width: clamp(Math['round'](finite(width, 0x280)), 0x40, 0x1000),
      height: clamp(Math['round'](finite(height, 0x168)), 0x40, 0x1000),
      format: value59,
      quality: clamp(finite(quality, 0.86), 0.1, 0x1),
    },
  };
}
export async function executeShotThumbnailRenderRequest(value60, value61) {
  if (value60?.['kind'] !== 'storyboard3d-shot-thumbnail' || value60?.['version'] !== 0x1)
    throw new Error('Unsupported shot thumbnail render request');
  if (typeof value61?.['renderShotThumbnail'] !== 'function')
    throw new Error('A renderShotThumbnail adapter is required');
  const enabled8 = await value61['renderShotThumbnail'](cloneStoryboard3DProject(value60));
  if (!enabled8 || typeof enabled8 !== 'object') throw new Error('The thumbnail renderer returned no result');
  return enabled8;
}
