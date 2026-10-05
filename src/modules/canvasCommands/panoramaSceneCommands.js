import { createCanvasCommandError } from './commandRegistry.js';
import {
  addPanoramaSceneCameraKeyframe,
  applyPanoramaSceneMannequinPose,
  composePanoramaScene,
  updatePanoramaSceneCameraTimeline,
} from '../panoramaSceneNode/sceneNodeActions.js';
import {
  estimateSceneAssetBoundingRadius,
  findSceneAsset,
  getSceneAssetCategories,
  searchSceneAssets,
} from '../panoramaSceneNode/sceneAssetCatalog.js';
import { findMannequinPosePreset, listMannequinPosePresets } from '../panoramaSceneNode/poseCatalog.js';
import { normalizeCameraTimeline } from '../panoramaSceneNode/cameraTimeline.js';
const MAX_SEMANTIC_PEOPLE = 100,
  DEFAULT_CHARACTER_SPACING = 1.5,
  CHARACTER_COLOR_CYCLE = Object['freeze'](['blue', 'purple', 'red', 'green', 'yellow', 'cyan']);
function finiteNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function clamp(index, result, data) {
  return Math['max'](result, Math['min'](data, index));
}
function normalizePoint(box, box2 = { x: 0, y: 0, z: 0 }) {
  return {
    x: finiteNumber(box?.['x'], box2['x']),
    y: finiteNumber(box?.['y'], box2['y']),
    z: finiteNumber(box?.['z'], box2['z']),
  };
}
function vector3Schema() {
  return {
    type: 'object',
    properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
  };
}
function getState(options) {
  return options['store']?.['getStateRaw']?.() || options['store']?.['getState']?.() || {};
}
function getStore(target) {
  return target['graphStore'] || target['store'];
}
function resolveSceneNodeId(options2 = {}, source = {}) {
  const state = getState(source),
    next = String(options2['nodeId'] || '')['trim'](),
    list = next ? [next] : Array['isArray'](state['selectedNodeIds']) ? state['selectedNodeIds'] : [],
    enabled = list['find']((current) => state['nodes']?.[current]?.['type'] === 'panorama-scene');
  if (!enabled)
    throw createCanvasCommandError(
      'PANORAMA_SCENE_NOT_FOUND',
      'A panorama-scene nodeId or selected 3D Stage node is required.',
    );
  return enabled;
}
function validateSceneNode(args, entry) {
  try {
    return { args: { ...args, nodeId: resolveSceneNodeId(args, entry) } };
  } catch (errorCode) {
    return {
      ok: ![],
      errorCode: errorCode['errorCode'] || 'PANORAMA_SCENE_NOT_FOUND',
      message: errorCode['message'],
      details: errorCode['details'],
    };
  }
}
function summarizeAsset(id) {
  return {
    id: id['id'],
    name: id['name'],
    category: id['category'],
    tags: [...id['tags']],
    kind: id['kind'],
  };
}
function normalizeSemanticAssetEntry(query, record = 0) {
  const category = typeof query === 'string' ? { query: query } : query || {},
    payload = String(category['assetId'] || category['id'] || '')['trim']();
  let y = payload ? findSceneAsset(payload) : null;
  const query2 = String(category['query'] || category['assetQuery'] || payload || '')['trim']();
  if (!y && query2) {
    const list2 = searchSceneAssets({
        query: query2,
        category: category['category'] || 'all',
        limit: 120,
      }),
      handle = Math['max'](0, Math['trunc'](finiteNumber(category['variantIndex'], record)));
    y = list2['length'] > 0 ? list2[handle % list2['length']] : null;
  }
  if (!y) return null;
  let position = category['position'];
  if (!position && y['familyId'] === 'building')
    position = { x: 0, y: 0, z: -(estimateSceneAssetBoundingRadius(y) + 1.5) };
  else
    !position &&
      (y['familyId'] === 'dance-floor' || y['familyId'] === 'stage') &&
      (position = { x: 0, y: y['familyId'] === 'dance-floor' ? 0.02 : 0, z: 0 });
  return { ...category, assetId: y['id'], ...(position ? { position: position } : null) };
}
function normalizeSemanticMannequinEntry(poseQuery, config = 0) {
  const args2 = typeof poseQuery === 'string' ? { poseQuery: poseQuery } : poseQuery || {};
  if (args2['bonePose'] && typeof args2['bonePose'] === 'object') return args2;
  const enabled2 = String(args2['poseId'] || '')['trim']();
  let poseId = enabled2 ? findMannequinPosePreset(enabled2) : null;
  const query3 = String(args2['poseQuery'] || args2['activity'] || (!poseId ? enabled2 : '') || '')['trim'](),
    category2 = String(args2['poseCategory'] || args2['category'] || 'all')['trim']() || 'all';
  if (!poseId && (query3 || category2 !== 'all')) {
    const list3 = listMannequinPosePresets({ query: query3, category: category2 });
    poseId = list3['length'] > 0 ? list3[config % list3['length']] : null;
  }
  !poseId && !enabled2 && !query3 && (poseId = findMannequinPosePreset('neutral'));
  if (!poseId) return null;
  return { ...args2, poseId: poseId['id'] };
}
function expandSemanticPeople(options3 = {}) {
  const scale = options3 && typeof options3 === 'object' ? options3 : {},
    length = clamp(Math['trunc'](finiteNumber(scale['count'], 0)), 0, MAX_SEMANTIC_PEOPLE);
  if (length <= 0) return [];
  const x = normalizePoint(scale['center'], { x: 0, y: 0, z: 0 }),
    clamp2 = clamp(finiteNumber(scale['spacing'], DEFAULT_CHARACTER_SPACING), 0.25, 20),
    poseQuery2 = String(scale['activity'] || scale['poseQuery'] || 'neutral')['trim']() || 'neutral',
    scope = String(scale['genderPattern'] || 'alternate')
      ['trim']()
      ['toLowerCase'](),
    colorKey =
      Array['isArray'](scale['colorKeys']) && scale['colorKeys']['length'] > 0
        ? scale['colorKeys']['map']((input) => String(input || '')['trim']())['filter'](Boolean)
        : CHARACTER_COLOR_CYCLE,
    output = length <= 8 ? length : Math['ceil'](Math['sqrt'](length)),
    value2 = Math['ceil'](length / output);
  return Array['from']({ length: length }, (value3, value4) => {
    const value5 = value4 % output,
      value6 = Math['floor'](value4 / output),
      gender =
        scope === 'female' ? 'female' : scope === 'male' ? 'male' : value4 % 2 === 0 ? 'female' : 'male';
    return {
      gender: gender,
      colorKey: colorKey[value4 % colorKey['length']] || 'blue',
      poseQuery: poseQuery2,
      position: {
        x: x['x'] + (value5 - (output - 1) / 2) * clamp2,
        y: x['y'],
        z: x['z'] + (value6 - (value2 - 1) / 2) * clamp2,
      },
      rotation: normalizePoint(scale['rotation'], { x: 0, y: Math['PI'], z: 0 }),
      scale: scale['scale'] ?? 1,
    };
  });
}
function resolveCompositionTarget(event, list4, value7) {
  if (event?.['target']) return normalizePoint(event['target'], { x: 0, y: 1.4, z: 0 });
  const list5 = list4['length'] > 0 ? list4 : value7,
    list6 = list5['map']((value8) => value8?.['position'])['filter'](
      (value9) => value9 && typeof value9 === 'object',
    );
  if (list6['length'] === 0) return { x: 0, y: 1.4, z: 0 };
  const x2 = list6['reduce'](
    (x3, box3) => ({
      x: x3['x'] + finiteNumber(box3['x']),
      y: x3['y'] + finiteNumber(box3['y']),
      z: x3['z'] + finiteNumber(box3['z']),
    }),
    { x: 0, y: 0, z: 0 },
  );
  return {
    x: x2['x'] / list6['length'],
    y: x2['y'] / list6['length'] + 1.4,
    z: x2['z'] / list6['length'],
  };
}
function buildSemanticCameraTimeline(preset, value10, value11) {
  if (!preset) return null;
  const loop = typeof preset === 'string' ? { preset: preset } : preset,
    value12 = String(loop?.['preset'] || 'orbit')
      ['trim']()
      ['toLowerCase'](),
    duration = clamp(finiteNumber(loop?.['duration'], 6), 0.1, 3600),
    fps = clamp(Math['round'](finiteNumber(loop?.['fps'], 24)), 1, 120),
    z = clamp(finiteNumber(loop?.['distance'], 8), 1, 100),
    y2 = clamp(finiteNumber(loop?.['height'], 2.2), 0.1, 100),
    x4 = resolveCompositionTarget(loop, value10, value11),
    easing = String(loop?.['easing'] || 'ease-in-out'),
    clamp3 = clamp(finiteNumber(loop?.['fov'], 48), 10, 120),
    handler = (id2, time, box4, fov = clamp3) => ({
      id: id2,
      time: time,
      position: {
        x: x4['x'] + box4['x'],
        y: x4['y'] + box4['y'],
        z: x4['z'] + box4['z'],
      },
      target: x4,
      fov: fov,
      easing: easing,
    });
  let keyframes;
  if (value12 === 'dolly-in')
    keyframes = [
      handler('dolly-wide', 0, { x: 0, y: y2, z: z * 1.35 }, clamp3 + 8),
      handler('dolly-close', duration, { x: 0, y: y2 * 0.75, z: z * 0.55 }, clamp3 - 8),
    ];
  else {
    if (value12 === 'pan-left' || value12 === 'pan-right') {
      const value13 = value12 === 'pan-left' ? 1 : -1;
      keyframes = [
        handler('pan-start', 0, { x: -z * 0.7 * value13, y: y2, z: z * 0.8 }),
        handler('pan-end', duration, { x: z * 0.7 * value13, y: y2, z: z * 0.8 }),
      ];
    } else {
      if (value12 === 'crane-up')
        keyframes = [
          handler('crane-low', 0, { x: 0, y: y2 * 0.45, z: z * 0.8 }),
          handler('crane-high', duration, { x: 0, y: y2 * 2.2, z: z * 0.65 }),
        ];
      else
        value12 === 'static'
          ? (keyframes = [handler('static', 0, { x: 0, y: y2, z: z })])
          : (keyframes = [
              handler('orbit-front', 0, { x: 0, y: y2, z: z }),
              handler('orbit-right', duration / 3, { x: z, y: y2, z: 0 }),
              handler('orbit-back', (duration * 2) / 3, { x: 0, y: y2, z: -z }),
              handler('orbit-return', duration, { x: 0, y: y2, z: z }),
            ]);
    }
  }
  return normalizeCameraTimeline({
    duration: duration,
    fps: fps,
    loop: loop?.['loop'] ?? value12 === 'orbit',
    keyframes: keyframes,
  });
}
export function registerPanoramaSceneCommands(value14) {
  (value14['register']({
    id: 'scene.catalog.search',
    description: 'Search the procedural 3D asset catalog for scene composition.',
    riskLevel: 'safe',
    argsSchema: {
      properties: {
        query: { type: 'string' },
        category: { type: 'string', enum: ['all', ...getSceneAssetCategories()] },
        limit: { type: 'number' },
      },
      defaults: { category: 'all', limit: 30 },
    },
    capabilitySchema: { reads: ['sceneAssetCatalog'], writes: [] },
    execute(query4) {
      const assets = searchSceneAssets({
        query: query4['query'],
        category: query4['category'],
        limit: query4['limit'],
      })['map'](summarizeAsset);
      return { assets: assets, count: assets['length'] };
    },
  }),
    value14['register']({
      id: 'scene.pose.list',
      description: 'List built-in mannequin poses, including dance and action poses.',
      riskLevel: 'safe',
      argsSchema: { properties: { query: { type: 'string' }, category: { type: 'string' } } },
      capabilitySchema: { reads: ['mannequinPoseCatalog'], writes: [] },
      execute(value15) {
        const poses = listMannequinPosePresets(value15)['map']((id3) => ({
          id: id3['id'],
          name: id3['name'],
          category: id3['category'],
          tags: [...id3['tags']],
        }));
        return { poses: poses, count: poses['length'] };
      },
    }),
    value14['register']({
      id: 'scene.compose',
      description:
        'Compose or replace a 3D Stage with procedural assets, posed mannequins, and a camera keyframe timeline.',
      riskLevel: 'safe',
      argsSchema: {
        properties: {
          nodeId: { type: 'string' },
          environmentMode: { type: 'string', enum: ['day', 'night'] },
          replaceExisting: { type: 'boolean' },
          assets: {
            type: 'array',
            description: 'Scene assets. Use assetId when known, or query/category for semantic lookup.',
            items: {
              type: 'object',
              properties: {
                assetId: { type: 'string' },
                query: { type: 'string' },
                category: { type: 'string', enum: ['all', ...getSceneAssetCategories()] },
                variantIndex: { type: 'number' },
                position: vector3Schema(),
                rotation: vector3Schema(),
                scale: { oneOf: [{ type: 'number' }, vector3Schema()] },
                colorKey: { type: 'string' },
              },
            },
          },
          mannequins: {
            type: 'array',
            description: 'Explicit characters. poseQuery/activity can semantically choose a pose.',
            items: {
              type: 'object',
              properties: {
                gender: { type: 'string', enum: ['male', 'female'] },
                colorKey: { type: 'string' },
                poseId: { type: 'string' },
                poseQuery: { type: 'string' },
                poseCategory: { type: 'string' },
                bonePose: { type: 'object' },
                position: vector3Schema(),
                rotation: vector3Schema(),
                scale: { oneOf: [{ type: 'number' }, vector3Schema()] },
              },
            },
          },
          people: {
            type: 'object',
            description:
              'Shorthand for a posed character group when mannequins is omitted.',
            properties: {
              count: { type: 'number' },
              activity: { type: 'string' },
              genderPattern: { type: 'string', enum: ['alternate', 'male', 'female'] },
              colorKeys: { type: 'array', items: { type: 'string' } },
              center: vector3Schema(),
              rotation: vector3Schema(),
              spacing: { type: 'number' },
              scale: { type: 'number' },
            },
          },
          cameraTimeline: {
            type: 'object',
            properties: {
              duration: { type: 'number' },
              fps: { type: 'number' },
              loop: { type: 'boolean' },
              keyframes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    time: { type: 'number' },
                    position: vector3Schema(),
                    target: vector3Schema(),
                    fov: { type: 'number' },
                    easing: { type: 'string', enum: ['linear', 'ease-in', 'ease-out', 'ease-in-out'] },
                  },
                },
              },
            },
          },
          cameraMotion: {
            type: 'object',
            description: 'Camera-motion shorthand converted to editable keyframes.',
            properties: {
              preset: {
                type: 'string',
                enum: ['orbit', 'dolly-in', 'pan-left', 'pan-right', 'crane-up', 'static'],
              },
              duration: { type: 'number' },
              fps: { type: 'number' },
              loop: { type: 'boolean' },
              distance: { type: 'number' },
              height: { type: 'number' },
              fov: { type: 'number' },
              target: vector3Schema(),
              easing: { type: 'string', enum: ['linear', 'ease-in', 'ease-out', 'ease-in-out'] },
            },
          },
        },
        defaults: { replaceExisting: ![] },
      },
      capabilitySchema: {
        reads: ['nodes', 'selection', 'sceneAssetCatalog', 'mannequinPoseCatalog'],
        writes: ['nodes', 'selection', 'history'],
        selectionFallback: !![],
      },
      validate(args3 = {}, value16 = {}) {
        const response = validateSceneNode(args3, value16);
        if (response['ok'] === ![]) return response;
        const list7 = Array['isArray'](args3['assets']) ? args3['assets'] : [],
          assets2 = [];
        for (let value17 = 0; value17 < list7['length']; value17 += 1) {
          const value18 = list7[value17],
            semanticAssetEntry = normalizeSemanticAssetEntry(value18, value17);
          if (!semanticAssetEntry) {
            const value19 =
              typeof value18 === 'string'
                ? value18
                : value18?.['assetId'] || value18?.['id'] || value18?.['query'] || value18?.['assetQuery'];
            return {
              ok: ![],
              errorCode: 'SCENE_ASSET_NOT_FOUND',
              message: 'Unknown scene asset: ' + String(value19 || '(empty)'),
            };
          }
          assets2['push'](semanticAssetEntry);
        }
        const list8 = Array['isArray'](args3['mannequins']) ? args3['mannequins'] : [],
          list9 = list8['length'] > 0 ? list8 : expandSemanticPeople(args3['people']),
          mannequins = [];
        for (let value20 = 0; value20 < list9['length']; value20 += 1) {
          const value21 = list9[value20],
            semanticMannequinEntry = normalizeSemanticMannequinEntry(value21, value20);
          if (!semanticMannequinEntry) {
            const value22 =
              typeof value21 === 'string'
                ? value21
                : value21?.['poseId'] || value21?.['poseQuery'] || value21?.['activity'];
            return {
              ok: ![],
              errorCode: 'MANNEQUIN_POSE_NOT_FOUND',
              message: 'Unknown mannequin pose: ' + String(value22 || '(empty)'),
            };
          }
          mannequins['push'](semanticMannequinEntry);
        }
        const cameraTimeline = args3['cameraTimeline']
          ? normalizeCameraTimeline(args3['cameraTimeline'])
          : buildSemanticCameraTimeline(args3['cameraMotion'], mannequins, assets2);
        return {
          args: {
            ...args3,
            ...response['args'],
            assets: assets2,
            mannequins: mannequins,
            cameraTimeline: cameraTimeline,
          },
        };
      },
      execute(args4, value23) {
        return composePanoramaScene({ ...args4, storeInstance: getStore(value23) });
      },
    }),
    value14['register']({
      id: 'scene.mannequin.setPose',
      description:
        'Apply a built-in or custom bone pose to a mannequin in a 3D Stage.',
      riskLevel: 'safe',
      argsSchema: {
        required: ['mannequinId'],
        properties: {
          nodeId: { type: 'string' },
          mannequinId: { type: 'string' },
          poseId: { type: 'string' },
          bonePose: { type: 'object' },
          customPose: { type: 'object' },
        },
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes', 'history'] },
      validate(args5 = {}, value24 = {}) {
        const response2 = validateSceneNode(args5, value24);
        if (response2['ok'] === ![]) return response2;
        if (!String(args5['mannequinId'] || '')['trim']())
          return { ok: ![], errorCode: 'MANNEQUIN_ID_REQUIRED', message: 'mannequinId is required.' };
        return { args: { ...args5, ...response2['args'] } };
      },
      execute(nodeId, value25) {
        const pose = applyPanoramaSceneMannequinPose({
          ...nodeId,
          storeInstance: getStore(value25),
        });
        return { nodeId: nodeId['nodeId'], mannequinId: nodeId['mannequinId'], pose: pose };
      },
    }),
    value14['register']({
      id: 'scene.camera.addKeyframe',
      description: 'Add or update a camera keyframe in a 3D Stage timeline.',
      riskLevel: 'safe',
      argsSchema: { properties: { nodeId: { type: 'string' }, keyframe: { type: 'object' } } },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes', 'history'] },
      validate: validateSceneNode,
      execute(nodeId2, value26) {
        const keyframeId = addPanoramaSceneCameraKeyframe({
          nodeId: nodeId2['nodeId'],
          keyframe: nodeId2['keyframe'],
          storeInstance: getStore(value26),
        });
        return { nodeId: nodeId2['nodeId'], keyframeId: keyframeId };
      },
    }),
    value14['register']({
      id: 'scene.camera.updateTimeline',
      description:
        'Update duration, FPS, loop, current time, or all camera keyframes.',
      riskLevel: 'safe',
      argsSchema: {
        properties: { nodeId: { type: 'string' }, timeline: { type: 'object' }, patch: { type: 'object' } },
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'] },
      validate: validateSceneNode,
      execute(nodeId3, value27) {
        return (
          updatePanoramaSceneCameraTimeline({
            nodeId: nodeId3['nodeId'],
            timeline: nodeId3['timeline'],
            patch: nodeId3['patch'],
            storeInstance: getStore(value27),
          }),
          { nodeId: nodeId3['nodeId'] }
        );
      },
    }));
}
