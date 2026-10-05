import { cloneStoryboard3DProject, createDefaultStoryboard3DEnvironment } from './projectModel.js';
import { normalizeStoryboard3DCameraState, replaceStoryboard3DShotCamera } from './cameraShotSystem.js';
import { remapStoryboard3DAnimationObjectIds } from './shotAnimation.js';
export const STORYBOARD_3D_ENVIRONMENT_PRESETS = Object['freeze']({
  empty: Object['freeze']({ ...createDefaultStoryboard3DEnvironment('empty') }),
  outdoor: Object['freeze']({
    ...createDefaultStoryboard3DEnvironment('outdoor'),
    groundSize: 200,
    backgroundColor: '#8fb5d9',
  }),
  indoor: Object['freeze']({
    ...createDefaultStoryboard3DEnvironment('indoor'),
    groundSize: 50,
    backgroundColor: '#24262b',
  }),
  studio: Object['freeze']({
    ...createDefaultStoryboard3DEnvironment('studio'),
    groundSize: 30,
    backgroundColor: '#15161a',
  }),
});
function finite(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function clamp(index, result, data) {
  return Math['min'](data, Math['max'](result, index));
}
function normalizeName(options) {
  return String(options || '')['trim']();
}
function resolveNow(target, source) {
  return Math['max'](0, finite(source, finite(target?.['updatedAt'], 0)));
}
function collectProjectIds(next) {
  const current = new Set();
  if (next?.['id']) current['add'](String(next['id']));
  return (
    (Array['isArray'](next?.['scenes']) ? next['scenes'] : [])['forEach']((entry) => {
      if (entry?.['id']) current['add'](String(entry['id']));
      ((Array['isArray'](entry?.['objects']) ? entry['objects'] : [])['forEach']((record) => {
        if (record?.['id']) current['add'](String(record['id']));
      }),
        (Array['isArray'](entry?.['shots']) ? entry['shots'] : [])['forEach']((payload) => {
          if (payload?.['id']) current['add'](String(payload['id']));
        }));
    }),
    current
  );
}
function createUniqueId({ prefix: prefix, sourceId: sourceId, usedIds: usedIds, idFactory: idFactory }) {
  if (typeof idFactory === 'function') {
    let count = 0;
    while (count < 1000) {
      const name = normalizeName(idFactory(prefix));
      if (name && !usedIds['has'](name)) return (usedIds['add'](name), name);
      count += 1;
    }
    throw new Error('Unable to create a unique ' + prefix + ' id');
  }
  const handle = (normalizeName(sourceId) || prefix) + '-copy';
  let state = handle,
    config = 2;
  while (usedIds['has'](state)) {
    ((state = handle + '-' + config), (config += 1));
  }
  return (usedIds['add'](state), state);
}
function cloneSceneWithNewIds(
  scope,
  { usedIds: usedIds2, idFactory: idFactory2, name: name2, now: now, identityMap: identityMap } = {},
) {
  const error = cloneStoryboard3DProject(scope),
    input = String(error['id'] || 'scene'),
    uniqueId = createUniqueId({ prefix: 'scene', sourceId: input, usedIds: usedIds2, idFactory: idFactory2 }),
    map = new Map(),
    args = new Map();
  ((error['id'] = uniqueId),
    (error['name'] = normalizeName(name2) || (error['name'] || 'Scene') + ' Copy'),
    (error['objects'] = (Array['isArray'](error['objects']) ? error['objects'] : [])['map']((args2) => {
      const output = String(args2['id'] || args2['type'] || 'object'),
        uniqueId2 = createUniqueId({
          prefix: args2['type'] || 'object',
          sourceId: output,
          usedIds: usedIds2,
          idFactory: idFactory2,
        });
      return (map['set'](output, uniqueId2), { ...args2, id: uniqueId2 });
    })),
    (error['objects'] = error['objects']['map']((args3) => ({
      ...args3,
      ...(args3['parentId'] && map['has'](String(args3['parentId']))
        ? { parentId: map['get'](String(args3['parentId'])) }
        : {}),
      ...(Array['isArray'](args3['attachmentIds'])
        ? {
            attachmentIds: args3['attachmentIds']['map'](
              (value2) => map['get'](String(value2)) || String(value2),
            ),
          }
        : {}),
    }))),
    (error['shots'] = (Array['isArray'](error['shots']) ? error['shots'] : [])['map']((args4, value3) => {
      const value4 = String(args4['id'] || 'shot-' + (value3 + 1)),
        uniqueId3 = createUniqueId({
          prefix: 'shot',
          sourceId: value4,
          usedIds: usedIds2,
          idFactory: idFactory2,
        });
      return (
        args['set'](value4, uniqueId3),
        {
          ...args4,
          id: uniqueId3,
          sceneId: uniqueId,
          ...(args4['animation']
            ? { animation: remapStoryboard3DAnimationObjectIds(args4['animation'], map) }
            : {}),
          ...(args4['cameraId']
            ? { cameraId: map['get'](String(args4['cameraId'])) || String(args4['cameraId']) }
            : {}),
          order: value3,
          createdAt: now,
          updatedAt: now,
        }
      );
    })),
    (error['activeShotId'] =
      args['get'](String(error['activeShotId'] || '')) || error['shots'][0]?.['id'] || ''));
  const value5 = new Map([[input, uniqueId], ...map, ...args]);
  if (error['generatedLayers'])
    error['generatedLayers'] = remapDirectorIdentities(error['generatedLayers'], value5);
  if (error['directorSettings'])
    error['directorSettings'] = remapDirectorIdentities(error['directorSettings'], value5);
  if (identityMap) {
    for (const [value6, value7] of value5) identityMap['set'](value6, value7);
  }
  return error;
}
function remapDirectorIdentities(list, value8) {
  if (typeof list === 'string') return value8['get'](list) || list;
  if (Array['isArray'](list)) return list['map']((value9) => remapDirectorIdentities(value9, value8));
  if (list && typeof list === 'object')
    return Object['fromEntries'](
      Object['entries'](list)['map'](([value10, value11]) => [
        value8['get'](value10) || value10,
        remapDirectorIdentities(value11, value8),
      ]),
    );
  return list;
}
function updateProject(value12, handler, value13) {
  const cloneStoryboard3DProject2 = cloneStoryboard3DProject(value12),
    value14 = handler(cloneStoryboard3DProject2) !== false;
  if (value14) cloneStoryboard3DProject2['updatedAt'] = resolveNow(value12, value13);
  return cloneStoryboard3DProject2;
}
function findScene(value15, value16) {
  return (Array['isArray'](value15?.['scenes']) ? value15['scenes'] : [])['find'](
    (value17) => value17['id'] === value16,
  );
}
function findShot(value18, value19) {
  return (Array['isArray'](value18?.['shots']) ? value18['shots'] : [])['find'](
    (value20) => value20['id'] === value19,
  );
}
function stableCameraSignature(value21) {
  const event = normalizeStoryboard3DCameraState(value21);
  return JSON['stringify']([
    event['position'],
    event['target'],
    event['focalLength'],
    event['near'],
    event['far'],
    event['aspectRatio'],
  ]);
}
export function saveStoryboard3DProjectAsCopy(
  value22,
  { id: id, name: name3, now: now2, idFactory: idFactory3 } = {},
) {
  const args5 = cloneStoryboard3DProject(value22),
    now3 = resolveNow(args5, now2),
    projectIds = collectProjectIds(args5),
    value23 = String(args5['id'] || 'project'),
    name4 =
      normalizeName(id) ||
      createUniqueId({ prefix: 'project', sourceId: value23, usedIds: projectIds, idFactory: idFactory3 }),
    map2 = new Map(),
    value24 = new Map([[value23, name4]]),
    value25 = (Array['isArray'](args5['scenes']) ? args5['scenes'] : [])['map']((value26) => {
      const cloneSceneWithNewIds2 = cloneSceneWithNewIds(value26, {
        usedIds: projectIds,
        idFactory: idFactory3,
        name: value26['name'],
        now: now3,
        identityMap: value24,
      });
      return (map2['set'](String(value26['id']), cloneSceneWithNewIds2['id']), cloneSceneWithNewIds2);
    });
  return {
    ...args5,
    id: name4,
    name: normalizeName(name3) || (args5['name'] || '3D Storyboard') + ' Copy',
    scenes: value25,
    ...(args5['recycleBin'] ? { recycleBin: remapDirectorIdentities(args5['recycleBin'], value24) } : {}),
    ...(args5['generationJobs']
      ? {
          generationJobs: remapDirectorIdentities(args5['generationJobs'], value24)['map']((response) =>
            response['status'] === 'running'
              ? { ...response, status: 'failed', message: '此任务运行于原项目，副本不重复提交。' }
              : response,
          ),
        }
      : {}),
    activeSceneId: map2['get'](String(args5['activeSceneId'] || '')) || value25[0]?.['id'] || '',
    createdAt: now3,
    updatedAt: now3,
  };
}
export function renameStoryboard3DScene(value27, value28, value29, { now: now4 } = {}) {
  const name5 = normalizeName(value29);
  return updateProject(
    value27,
    (value30) => {
      const scene = findScene(value30, value28);
      if (!scene || !name5 || scene['name'] === name5) return false;
      return ((scene['name'] = name5), true);
    },
    now4,
  );
}
export function duplicateStoryboard3DScene(
  value31,
  value32,
  { name: name6, now: now5, idFactory: idFactory4 } = {},
) {
  const now6 = resolveNow(value31, now5),
    projectIds2 = collectProjectIds(value31);
  return updateProject(
    value31,
    (value33) => {
      const count2 = value33['scenes']['findIndex']((value34) => value34['id'] === value32);
      if (count2 < 0) return false;
      const cloneSceneWithNewIds3 = cloneSceneWithNewIds(value33['scenes'][count2], {
        usedIds: projectIds2,
        idFactory: idFactory4,
        name: name6,
        now: now6,
      });
      return (
        value33['scenes']['splice'](count2 + 1, 0, cloneSceneWithNewIds3),
        (value33['activeSceneId'] = cloneSceneWithNewIds3['id']),
        true
      );
    },
    now6,
  );
}
export function deleteStoryboard3DScene(value35, value36, { now: now7 } = {}) {
  return updateProject(
    value35,
    (value37) => {
      if (!Array['isArray'](value37['scenes']) || value37['scenes']['length'] <= 1) return false;
      const count3 = value37['scenes']['findIndex']((value38) => value38['id'] === value36);
      if (count3 < 0) return false;
      return (
        value37['scenes']['splice'](count3, 1),
        value37['activeSceneId'] === value36 &&
          (value37['activeSceneId'] =
            value37['scenes'][Math['min'](count3, value37['scenes']['length'] - 1)]['id']),
        true
      );
    },
    now7,
  );
}
export function reorderStoryboard3DScene(value39, value40, value41, { now: now8 } = {}) {
  return updateProject(
    value39,
    (value42) => {
      const count4 = value42['scenes']['findIndex']((value43) => value43['id'] === value40);
      if (count4 < 0) return false;
      const clamp2 = clamp(Math['round'](finite(value41, count4)), 0, value42['scenes']['length'] - 1);
      if (clamp2 === count4) return false;
      const [value44] = value42['scenes']['splice'](count4, 1);
      return (value42['scenes']['splice'](clamp2, 0, value44), true);
    },
    now8,
  );
}
export function applyStoryboard3DEnvironmentPreset(
  value45,
  value46,
  value47,
  { overrides: overrides = {}, now: now9 } = {},
) {
  const enabled = STORYBOARD_3D_ENVIRONMENT_PRESETS[value47];
  if (!enabled) throw new Error('Unsupported 3D environment preset: ' + value47);
  return updateProject(
    value45,
    (value48) => {
      const scene2 = findScene(value48, value46);
      if (!scene2) return false;
      return (
        (scene2['environment'] = {
          ...cloneStoryboard3DProject(enabled),
          ...(overrides && typeof overrides === 'object' ? overrides : {}),
          type: enabled['type'],
          groundSize: Math['max'](1, finite(overrides?.['groundSize'], enabled['groundSize'])),
          showGrid: overrides?.['showGrid'] !== false,
          showOutline: overrides?.['showOutline'] !== false,
          enableShadows: overrides?.['enableShadows'] !== false,
        }),
        !normalizeName(scene2['environment']['backgroundColor']) &&
          delete scene2['environment']['backgroundColor'],
        true
      );
    },
    now9,
  );
}
export function replaceStoryboard3DShotFromCurrentView(
  value49,
  {
    sceneId: sceneId,
    shotId: shotId,
    camera: camera,
    subjectBounds: subjectBounds,
    subjectForward: subjectForward,
    compositionHint: compositionHint,
    now: now10,
  } = {},
) {
  const now11 = resolveNow(value49, now10);
  return updateProject(
    value49,
    (value50) => {
      const count5 = value50['scenes']['findIndex']((value51) => value51['id'] === sceneId);
      if (count5 < 0 || !findShot(value50['scenes'][count5], shotId)) return false;
      const replaceStoryboard3DShotCamera2 = replaceStoryboard3DShotCamera(
          value50['scenes'][count5],
          shotId,
          camera,
          {
            subjectBounds: subjectBounds,
            subjectForward: subjectForward,
            compositionHint: compositionHint,
            now: now11,
          },
        ),
        shot = findShot(replaceStoryboard3DShotCamera2, shotId);
      if (shot) delete shot['thumbnailUrl'];
      return ((value50['scenes'][count5] = replaceStoryboard3DShotCamera2), true);
    },
    now11,
  );
}
export function createStoryboard3DShotThumbnailToken(enabled2, enabled3) {
  if (!enabled2 || !enabled3?.['id'] || !enabled3?.['camera'])
    throw new Error('A scene id and persisted shot camera are required');
  return {
    kind: 'storyboard3d-shot-thumbnail-token',
    version: 1,
    sceneId: String(enabled2),
    shotId: String(enabled3['id']),
    cameraSignature: stableCameraSignature(enabled3['camera']),
    shotUpdatedAt: Math['max'](0, finite(enabled3['updatedAt'], 0)),
  };
}
export function applyStoryboard3DShotThumbnail(value52, value53, value54, { now: now12 } = {}) {
  const cloneStoryboard3DProject3 = cloneStoryboard3DProject(value52);
  if (value53?.['kind'] !== 'storyboard3d-shot-thumbnail-token' || value53?.['version'] !== 1)
    return { project: cloneStoryboard3DProject3, applied: false, reason: 'invalid-token' };
  const scene3 = findScene(cloneStoryboard3DProject3, value53['sceneId']),
    shot2 = findShot(scene3, value53['shotId']);
  if (!shot2) return { project: cloneStoryboard3DProject3, applied: false, reason: 'shot-not-found' };
  if (
    stableCameraSignature(shot2['camera']) !== value53['cameraSignature'] ||
    Math['max'](0, finite(shot2['updatedAt'], 0)) !== value53['shotUpdatedAt']
  )
    return { project: cloneStoryboard3DProject3, applied: false, reason: 'stale-token' };
  const name7 = normalizeName(value54);
  if (!name7) return { project: cloneStoryboard3DProject3, applied: false, reason: 'invalid-thumbnail' };
  return (
    (shot2['thumbnailUrl'] = name7),
    (shot2['updatedAt'] = resolveNow(value52, now12)),
    (cloneStoryboard3DProject3['updatedAt'] = shot2['updatedAt']),
    { project: cloneStoryboard3DProject3, applied: true, reason: 'applied' }
  );
}
