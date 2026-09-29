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
const MAX_SEMANTIC_PEOPLE = 0x64,
  DEFAULT_CHARACTER_SPACING = 1.5,
  CHARACTER_COLOR_CYCLE = Object['freeze'](['blue', 'purple', 'red', 'green', 'yellow', 'cyan']);
function finiteNumber(_0x371932, _0x5a25b2 = 0x0) {
  const _0x16dcf7 = Number(_0x371932);
  return Number['isFinite'](_0x16dcf7) ? _0x16dcf7 : _0x5a25b2;
}
function clamp(_0x3710a0, _0x1ddb08, _0x57f733) {
  return Math['max'](_0x1ddb08, Math['min'](_0x57f733, _0x3710a0));
}
function normalizePoint(_0x55ae7a, _0x5ebf69 = { x: 0x0, y: 0x0, z: 0x0 }) {
  return {
    x: finiteNumber(_0x55ae7a?.['x'], _0x5ebf69['x']),
    y: finiteNumber(_0x55ae7a?.['y'], _0x5ebf69['y']),
    z: finiteNumber(_0x55ae7a?.['z'], _0x5ebf69['z']),
  };
}
function vector3Schema() {
  return {
    type: 'object',
    properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
  };
}
function getState(_0x366c45) {
  return _0x366c45['store']?.['getStateRaw']?.() || _0x366c45['store']?.['getState']?.() || {};
}
function getStore(_0x13ce29) {
  return _0x13ce29['graphStore'] || _0x13ce29['store'];
}
function resolveSceneNodeId(_0x3fb2bf = {}, _0x469910 = {}) {
  const _0x27fd20 = getState(_0x469910),
    _0x406116 = String(_0x3fb2bf['nodeId'] || '')['trim'](),
    _0x421d23 = _0x406116
      ? [_0x406116]
      : Array['isArray'](_0x27fd20['selectedNodeIds'])
        ? _0x27fd20['selectedNodeIds']
        : [],
    _0x26683f = _0x421d23['find'](
      (_0x3ac462) => _0x27fd20['nodes']?.[_0x3ac462]?.['type'] === 'panorama-scene',
    );
  if (!_0x26683f)
    throw createCanvasCommandError(
      'PANORAMA_SCENE_NOT_FOUND',
      'A\x20panorama-scene\x20nodeId\x20or\x20selected\x203D\x20Stage\x20node\x20is\x20required.',
    );
  return _0x26683f;
}
function validateSceneNode(_0x27451b, _0x1ff2cf) {
  try {
    return { args: { ..._0x27451b, nodeId: resolveSceneNodeId(_0x27451b, _0x1ff2cf) } };
  } catch (_0xd9669b) {
    return {
      ok: ![],
      errorCode: _0xd9669b['errorCode'] || 'PANORAMA_SCENE_NOT_FOUND',
      message: _0xd9669b['message'],
      details: _0xd9669b['details'],
    };
  }
}
function summarizeAsset(_0x18f9f6) {
  return {
    id: _0x18f9f6['id'],
    name: _0x18f9f6['name'],
    category: _0x18f9f6['category'],
    tags: [..._0x18f9f6['tags']],
    kind: _0x18f9f6['kind'],
  };
}
function normalizeSemanticAssetEntry(_0x4f8af9, _0x8f7745 = 0x0) {
  const _0x1bd809 = typeof _0x4f8af9 === 'string' ? { query: _0x4f8af9 } : _0x4f8af9 || {},
    _0x3da6c1 = String(_0x1bd809['assetId'] || _0x1bd809['id'] || '')['trim']();
  let _0x3f62d7 = _0x3da6c1 ? findSceneAsset(_0x3da6c1) : null;
  const _0x2151ec = String(_0x1bd809['query'] || _0x1bd809['assetQuery'] || _0x3da6c1 || '')['trim']();
  if (!_0x3f62d7 && _0x2151ec) {
    const _0x43863d = searchSceneAssets({
        query: _0x2151ec,
        category: _0x1bd809['category'] || 'all',
        limit: 0x78,
      }),
      _0x5994e7 = Math['max'](0x0, Math['trunc'](finiteNumber(_0x1bd809['variantIndex'], _0x8f7745)));
    _0x3f62d7 = _0x43863d['length'] > 0x0 ? _0x43863d[_0x5994e7 % _0x43863d['length']] : null;
  }
  if (!_0x3f62d7) return null;
  let _0x57e4a7 = _0x1bd809['position'];
  if (!_0x57e4a7 && _0x3f62d7['familyId'] === 'building')
    _0x57e4a7 = { x: 0x0, y: 0x0, z: -(estimateSceneAssetBoundingRadius(_0x3f62d7) + 1.5) };
  else
    !_0x57e4a7 &&
      (_0x3f62d7['familyId'] === 'dance-floor' || _0x3f62d7['familyId'] === 'stage') &&
      (_0x57e4a7 = { x: 0x0, y: _0x3f62d7['familyId'] === 'dance-floor' ? 0.02 : 0x0, z: 0x0 });
  return { ..._0x1bd809, assetId: _0x3f62d7['id'], ...(_0x57e4a7 ? { position: _0x57e4a7 } : null) };
}
function normalizeSemanticMannequinEntry(_0x5360ae, _0x329220 = 0x0) {
  const _0x5dc513 = typeof _0x5360ae === 'string' ? { poseQuery: _0x5360ae } : _0x5360ae || {};
  if (_0x5dc513['bonePose'] && typeof _0x5dc513['bonePose'] === 'object') return _0x5dc513;
  const _0x42e755 = String(_0x5dc513['poseId'] || '')['trim']();
  let _0x3c9239 = _0x42e755 ? findMannequinPosePreset(_0x42e755) : null;
  const _0x2a6c1f = String(
      _0x5dc513['poseQuery'] || _0x5dc513['activity'] || (!_0x3c9239 ? _0x42e755 : '') || '',
    )['trim'](),
    _0x154dd4 = String(_0x5dc513['poseCategory'] || _0x5dc513['category'] || 'all')['trim']() || 'all';
  if (!_0x3c9239 && (_0x2a6c1f || _0x154dd4 !== 'all')) {
    const _0x38453b = listMannequinPosePresets({ query: _0x2a6c1f, category: _0x154dd4 });
    _0x3c9239 = _0x38453b['length'] > 0x0 ? _0x38453b[_0x329220 % _0x38453b['length']] : null;
  }
  !_0x3c9239 && !_0x42e755 && !_0x2a6c1f && (_0x3c9239 = findMannequinPosePreset('neutral'));
  if (!_0x3c9239) return null;
  return { ..._0x5dc513, poseId: _0x3c9239['id'] };
}
function expandSemanticPeople(_0x2db384 = {}) {
  const _0x569068 = _0x2db384 && typeof _0x2db384 === 'object' ? _0x2db384 : {},
    _0x3d6098 = clamp(Math['trunc'](finiteNumber(_0x569068['count'], 0x0)), 0x0, MAX_SEMANTIC_PEOPLE);
  if (_0x3d6098 <= 0x0) return [];
  const _0x18cc96 = normalizePoint(_0x569068['center'], { x: 0x0, y: 0x0, z: 0x0 }),
    _0x4f9081 = clamp(finiteNumber(_0x569068['spacing'], DEFAULT_CHARACTER_SPACING), 0.25, 0x14),
    _0x2a3cd5 = String(_0x569068['activity'] || _0x569068['poseQuery'] || 'neutral')['trim']() || 'neutral',
    _0x5ba80a = String(_0x569068['genderPattern'] || 'alternate')
      ['trim']()
      ['toLowerCase'](),
    _0x38ff10 =
      Array['isArray'](_0x569068['colorKeys']) && _0x569068['colorKeys']['length'] > 0x0
        ? _0x569068['colorKeys']['map']((_0x285a85) => String(_0x285a85 || '')['trim']())['filter'](Boolean)
        : CHARACTER_COLOR_CYCLE,
    _0x527cbb = _0x3d6098 <= 0x8 ? _0x3d6098 : Math['ceil'](Math['sqrt'](_0x3d6098)),
    _0xa5b6fc = Math['ceil'](_0x3d6098 / _0x527cbb);
  return Array['from']({ length: _0x3d6098 }, (_0x5b3f33, _0x487c75) => {
    const _0x46c1a4 = _0x487c75 % _0x527cbb,
      _0xcac728 = Math['floor'](_0x487c75 / _0x527cbb),
      _0x13423e =
        _0x5ba80a === 'female'
          ? 'female'
          : _0x5ba80a === 'male'
            ? 'male'
            : _0x487c75 % 0x2 === 0x0
              ? 'female'
              : 'male';
    return {
      gender: _0x13423e,
      colorKey: _0x38ff10[_0x487c75 % _0x38ff10['length']] || 'blue',
      poseQuery: _0x2a3cd5,
      position: {
        x: _0x18cc96['x'] + (_0x46c1a4 - (_0x527cbb - 0x1) / 0x2) * _0x4f9081,
        y: _0x18cc96['y'],
        z: _0x18cc96['z'] + (_0xcac728 - (_0xa5b6fc - 0x1) / 0x2) * _0x4f9081,
      },
      rotation: normalizePoint(_0x569068['rotation'], { x: 0x0, y: Math['PI'], z: 0x0 }),
      scale: _0x569068['scale'] ?? 0x1,
    };
  });
}
function resolveCompositionTarget(_0x480a96, _0x55444d, _0x4d5475) {
  if (_0x480a96?.['target']) return normalizePoint(_0x480a96['target'], { x: 0x0, y: 1.4, z: 0x0 });
  const _0x1298ed = _0x55444d['length'] > 0x0 ? _0x55444d : _0x4d5475,
    _0x4fa127 = _0x1298ed['map']((_0x2181d7) => _0x2181d7?.['position'])['filter'](
      (_0x27efd6) => _0x27efd6 && typeof _0x27efd6 === 'object',
    );
  if (_0x4fa127['length'] === 0x0) return { x: 0x0, y: 1.4, z: 0x0 };
  const _0x2eb903 = _0x4fa127['reduce'](
    (_0x3eacb2, _0x5d240e) => ({
      x: _0x3eacb2['x'] + finiteNumber(_0x5d240e['x']),
      y: _0x3eacb2['y'] + finiteNumber(_0x5d240e['y']),
      z: _0x3eacb2['z'] + finiteNumber(_0x5d240e['z']),
    }),
    { x: 0x0, y: 0x0, z: 0x0 },
  );
  return {
    x: _0x2eb903['x'] / _0x4fa127['length'],
    y: _0x2eb903['y'] / _0x4fa127['length'] + 1.4,
    z: _0x2eb903['z'] / _0x4fa127['length'],
  };
}
function buildSemanticCameraTimeline(_0x3c3e2f, _0x140cec, _0xb01abf) {
  if (!_0x3c3e2f) return null;
  const _0x4f5206 = typeof _0x3c3e2f === 'string' ? { preset: _0x3c3e2f } : _0x3c3e2f,
    _0x39b503 = String(_0x4f5206?.['preset'] || 'orbit')
      ['trim']()
      ['toLowerCase'](),
    _0x376835 = clamp(finiteNumber(_0x4f5206?.['duration'], 0x6), 0.1, 0xe10),
    _0x1e8b76 = clamp(Math['round'](finiteNumber(_0x4f5206?.['fps'], 0x18)), 0x1, 0x78),
    _0x5c32b2 = clamp(finiteNumber(_0x4f5206?.['distance'], 0x8), 0x1, 0x64),
    _0x20aa4a = clamp(finiteNumber(_0x4f5206?.['height'], 2.2), 0.1, 0x64),
    _0x1568bd = resolveCompositionTarget(_0x4f5206, _0x140cec, _0xb01abf),
    _0x5613e8 = String(_0x4f5206?.['easing'] || 'ease-in-out'),
    _0x5271b0 = clamp(finiteNumber(_0x4f5206?.['fov'], 0x30), 0xa, 0x78),
    _0x24e23f = (_0x2b188d, _0x358773, _0x4ce056, _0xec5ea6 = _0x5271b0) => ({
      id: _0x2b188d,
      time: _0x358773,
      position: {
        x: _0x1568bd['x'] + _0x4ce056['x'],
        y: _0x1568bd['y'] + _0x4ce056['y'],
        z: _0x1568bd['z'] + _0x4ce056['z'],
      },
      target: _0x1568bd,
      fov: _0xec5ea6,
      easing: _0x5613e8,
    });
  let _0x7afc6b;
  if (_0x39b503 === 'dolly-in')
    _0x7afc6b = [
      _0x24e23f('dolly-wide', 0x0, { x: 0x0, y: _0x20aa4a, z: _0x5c32b2 * 1.35 }, _0x5271b0 + 0x8),
      _0x24e23f(
        'dolly-close',
        _0x376835,
        { x: 0x0, y: _0x20aa4a * 0.75, z: _0x5c32b2 * 0.55 },
        _0x5271b0 - 0x8,
      ),
    ];
  else {
    if (_0x39b503 === 'pan-left' || _0x39b503 === 'pan-right') {
      const _0xbc55ee = _0x39b503 === 'pan-left' ? 0x1 : -0x1;
      _0x7afc6b = [
        _0x24e23f('pan-start', 0x0, { x: -_0x5c32b2 * 0.7 * _0xbc55ee, y: _0x20aa4a, z: _0x5c32b2 * 0.8 }),
        _0x24e23f('pan-end', _0x376835, { x: _0x5c32b2 * 0.7 * _0xbc55ee, y: _0x20aa4a, z: _0x5c32b2 * 0.8 }),
      ];
    } else {
      if (_0x39b503 === 'crane-up')
        _0x7afc6b = [
          _0x24e23f('crane-low', 0x0, { x: 0x0, y: _0x20aa4a * 0.45, z: _0x5c32b2 * 0.8 }),
          _0x24e23f('crane-high', _0x376835, { x: 0x0, y: _0x20aa4a * 2.2, z: _0x5c32b2 * 0.65 }),
        ];
      else
        _0x39b503 === 'static'
          ? (_0x7afc6b = [_0x24e23f('static', 0x0, { x: 0x0, y: _0x20aa4a, z: _0x5c32b2 })])
          : (_0x7afc6b = [
              _0x24e23f('orbit-front', 0x0, { x: 0x0, y: _0x20aa4a, z: _0x5c32b2 }),
              _0x24e23f('orbit-right', _0x376835 / 0x3, { x: _0x5c32b2, y: _0x20aa4a, z: 0x0 }),
              _0x24e23f('orbit-back', (_0x376835 * 0x2) / 0x3, { x: 0x0, y: _0x20aa4a, z: -_0x5c32b2 }),
              _0x24e23f('orbit-return', _0x376835, { x: 0x0, y: _0x20aa4a, z: _0x5c32b2 }),
            ]);
    }
  }
  return normalizeCameraTimeline({
    duration: _0x376835,
    fps: _0x1e8b76,
    loop: _0x4f5206?.['loop'] ?? _0x39b503 === 'orbit',
    keyframes: _0x7afc6b,
  });
}
export function registerPanoramaSceneCommands(_0x1bdbf4) {
  (_0x1bdbf4['register']({
    id: 'scene.catalog.search',
    description: 'Search the procedural 3D asset catalog for scene composition.',
    riskLevel: 'safe',
    argsSchema: {
      properties: {
        query: { type: 'string' },
        category: { type: 'string', enum: ['all', ...getSceneAssetCategories()] },
        limit: { type: 'number' },
      },
      defaults: { category: 'all', limit: 0x1e },
    },
    capabilitySchema: { reads: ['sceneAssetCatalog'], writes: [] },
    execute(_0x4a82f1) {
      const _0x301488 = searchSceneAssets({
        query: _0x4a82f1['query'],
        category: _0x4a82f1['category'],
        limit: _0x4a82f1['limit'],
      })['map'](summarizeAsset);
      return { assets: _0x301488, count: _0x301488['length'] };
    },
  }),
    _0x1bdbf4['register']({
      id: 'scene.pose.list',
      description: 'List built-in mannequin poses, including dance and action poses.',
      riskLevel: 'safe',
      argsSchema: { properties: { query: { type: 'string' }, category: { type: 'string' } } },
      capabilitySchema: { reads: ['mannequinPoseCatalog'], writes: [] },
      execute(_0x18a02d) {
        const _0x9bf95f = listMannequinPosePresets(_0x18a02d)['map']((_0x23fda0) => ({
          id: _0x23fda0['id'],
          name: _0x23fda0['name'],
          category: _0x23fda0['category'],
          tags: [..._0x23fda0['tags']],
        }));
        return { poses: _0x9bf95f, count: _0x9bf95f['length'] };
      },
    }),
    _0x1bdbf4['register']({
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
              'Shorthand\x20for\x20a\x20posed\x20character\x20group\x20when\x20mannequins\x20is\x20omitted.',
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
            description: 'Camera-motion\x20shorthand\x20converted\x20to\x20editable\x20keyframes.',
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
      validate(_0x3078cf = {}, _0x2b2169 = {}) {
        const _0x32191c = validateSceneNode(_0x3078cf, _0x2b2169);
        if (_0x32191c['ok'] === ![]) return _0x32191c;
        const _0x48675b = Array['isArray'](_0x3078cf['assets']) ? _0x3078cf['assets'] : [],
          _0x1dc62b = [];
        for (let _0x1ae1b9 = 0x0; _0x1ae1b9 < _0x48675b['length']; _0x1ae1b9 += 0x1) {
          const _0x4a43af = _0x48675b[_0x1ae1b9],
            _0x3aaf2a = normalizeSemanticAssetEntry(_0x4a43af, _0x1ae1b9);
          if (!_0x3aaf2a) {
            const _0x464917 =
              typeof _0x4a43af === 'string'
                ? _0x4a43af
                : _0x4a43af?.['assetId'] ||
                  _0x4a43af?.['id'] ||
                  _0x4a43af?.['query'] ||
                  _0x4a43af?.['assetQuery'];
            return {
              ok: ![],
              errorCode: 'SCENE_ASSET_NOT_FOUND',
              message: 'Unknown scene asset: ' + String(_0x464917 || '(empty)'),
            };
          }
          _0x1dc62b['push'](_0x3aaf2a);
        }
        const _0x11d89a = Array['isArray'](_0x3078cf['mannequins']) ? _0x3078cf['mannequins'] : [],
          _0x27dc03 = _0x11d89a['length'] > 0x0 ? _0x11d89a : expandSemanticPeople(_0x3078cf['people']),
          _0x48854b = [];
        for (let _0x2726c2 = 0x0; _0x2726c2 < _0x27dc03['length']; _0x2726c2 += 0x1) {
          const _0x37114b = _0x27dc03[_0x2726c2],
            _0x5478e3 = normalizeSemanticMannequinEntry(_0x37114b, _0x2726c2);
          if (!_0x5478e3) {
            const _0x11415c =
              typeof _0x37114b === 'string'
                ? _0x37114b
                : _0x37114b?.['poseId'] || _0x37114b?.['poseQuery'] || _0x37114b?.['activity'];
            return {
              ok: ![],
              errorCode: 'MANNEQUIN_POSE_NOT_FOUND',
              message: 'Unknown mannequin pose: ' + String(_0x11415c || '(empty)'),
            };
          }
          _0x48854b['push'](_0x5478e3);
        }
        const _0xe03b13 = _0x3078cf['cameraTimeline']
          ? normalizeCameraTimeline(_0x3078cf['cameraTimeline'])
          : buildSemanticCameraTimeline(_0x3078cf['cameraMotion'], _0x48854b, _0x1dc62b);
        return {
          args: {
            ..._0x3078cf,
            ..._0x32191c['args'],
            assets: _0x1dc62b,
            mannequins: _0x48854b,
            cameraTimeline: _0xe03b13,
          },
        };
      },
      execute(_0x18d8ba, _0x2c365e) {
        return composePanoramaScene({ ..._0x18d8ba, storeInstance: getStore(_0x2c365e) });
      },
    }),
    _0x1bdbf4['register']({
      id: 'scene.mannequin.setPose',
      description:
        'Apply\x20a\x20built-in\x20or\x20custom\x20bone\x20pose\x20to\x20a\x20mannequin\x20in\x20a\x203D\x20Stage.',
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
      validate(_0x310593 = {}, _0x4f82b6 = {}) {
        const _0xc783c8 = validateSceneNode(_0x310593, _0x4f82b6);
        if (_0xc783c8['ok'] === ![]) return _0xc783c8;
        if (!String(_0x310593['mannequinId'] || '')['trim']())
          return { ok: ![], errorCode: 'MANNEQUIN_ID_REQUIRED', message: 'mannequinId\x20is\x20required.' };
        return { args: { ..._0x310593, ..._0xc783c8['args'] } };
      },
      execute(_0x39058e, _0x433ea6) {
        const _0x255af2 = applyPanoramaSceneMannequinPose({
          ..._0x39058e,
          storeInstance: getStore(_0x433ea6),
        });
        return { nodeId: _0x39058e['nodeId'], mannequinId: _0x39058e['mannequinId'], pose: _0x255af2 };
      },
    }),
    _0x1bdbf4['register']({
      id: 'scene.camera.addKeyframe',
      description: 'Add or update a camera keyframe in a 3D Stage timeline.',
      riskLevel: 'safe',
      argsSchema: { properties: { nodeId: { type: 'string' }, keyframe: { type: 'object' } } },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes', 'history'] },
      validate: validateSceneNode,
      execute(_0x2dd086, _0x1d567c) {
        const _0x51df91 = addPanoramaSceneCameraKeyframe({
          nodeId: _0x2dd086['nodeId'],
          keyframe: _0x2dd086['keyframe'],
          storeInstance: getStore(_0x1d567c),
        });
        return { nodeId: _0x2dd086['nodeId'], keyframeId: _0x51df91 };
      },
    }),
    _0x1bdbf4['register']({
      id: 'scene.camera.updateTimeline',
      description:
        'Update\x20duration,\x20FPS,\x20loop,\x20current\x20time,\x20or\x20all\x20camera\x20keyframes.',
      riskLevel: 'safe',
      argsSchema: {
        properties: { nodeId: { type: 'string' }, timeline: { type: 'object' }, patch: { type: 'object' } },
      },
      capabilitySchema: { reads: ['nodes', 'selection'], writes: ['nodes'] },
      validate: validateSceneNode,
      execute(_0x531cbe, _0xdc0d84) {
        return (
          updatePanoramaSceneCameraTimeline({
            nodeId: _0x531cbe['nodeId'],
            timeline: _0x531cbe['timeline'],
            patch: _0x531cbe['patch'],
            storeInstance: getStore(_0xdc0d84),
          }),
          { nodeId: _0x531cbe['nodeId'] }
        );
      },
    }));
}
