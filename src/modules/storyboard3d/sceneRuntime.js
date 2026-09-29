import { PanoramaScene3DBridge } from '../panoramaSceneNode/scene3dBridge.js';
import { DirectorSceneRuntime } from './directorSceneRuntime.js';
import { DirectorViewportRuntime } from './directorViewportRuntime.js';
import { normalizePanoramaSceneState } from '../panoramaSceneNode/sceneNode.js';
import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { clampSceneFocalLength, focalLengthToFov } from '../../core/panoramaSceneMath.js';
import { quaternionToStoryboard3DEuler, resolveStoryboard3DCharacterPose } from './characterRig.js';
import {
  STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT,
  createStoryboard3DInstanceBatch,
  disposeStoryboard3DInstanceBatch,
  findStoryboard3DInstancingTemplate,
  refreshStoryboard3DInstanceBatchBounds,
  updateStoryboard3DInstanceTransform,
} from './instanceBatching.js';
import { applyStoryboard3DTexturePolicy } from './texturePolicy.js';
import { readStoryboard3DModelNormalization } from './modelImport.js';
import {
  computeStoryboard3DVerticalFov,
  normalizeStoryboard3DBackgroundCalibration,
} from './backgroundCalibration.js';
import {
  canStoryboard3DObjectUseTransformTool,
  getStoryboard3DObjectTransformCapabilities,
} from './objectTransformCapabilities.js';
const TRANSFORM_TOOLS = new Set(['move', 'rotate', 'scale']);
function finiteNumber(_0x49e115, _0x26ecb7 = 0x0) {
  const _0x424bc9 = Number(_0x49e115);
  return Number['isFinite'](_0x424bc9) ? _0x424bc9 : _0x26ecb7;
}
function vectorFromArray(_0x127631, _0x2fdf67) {
  const _0x683ead = Array['isArray'](_0x127631) ? _0x127631 : [];
  return {
    x: finiteNumber(_0x683ead[0x0], _0x2fdf67['x']),
    y: finiteNumber(_0x683ead[0x1], _0x2fdf67['y']),
    z: finiteNumber(_0x683ead[0x2], _0x2fdf67['z']),
  };
}
function scaleFromArray(_0x5b87f2) {
  const _0x5d8df4 = vectorFromArray(_0x5b87f2, { x: 0x1, y: 0x1, z: 0x1 });
  return {
    x: Math['max'](0.001, _0x5d8df4['x']),
    y: Math['max'](0.001, _0x5d8df4['y']),
    z: Math['max'](0.001, _0x5d8df4['z']),
  };
}
function transformToBridgePose(_0xd8e99b) {
  return {
    position: vectorFromArray(_0xd8e99b?.['position'], { x: 0x0, y: 0x0, z: 0x0 }),
    rotation: vectorFromArray(_0xd8e99b?.['rotation'], { x: 0x0, y: 0x0, z: 0x0 }),
    scale: scaleFromArray(_0xd8e99b?.['scale']),
  };
}
function convexHullXZ(_0x4a39ec) {
  const _0x4fb1c7 = new Map();
  for (const _0x24b8bc of _0x4a39ec || []) {
    const _0x403148 = finiteNumber(_0x24b8bc?.['x']),
      _0x287a3e = finiteNumber(_0x24b8bc?.['z']);
    _0x4fb1c7['set'](_0x403148['toFixed'](0x6) + ':' + _0x287a3e['toFixed'](0x6), {
      x: _0x403148,
      z: _0x287a3e,
    });
  }
  const _0x3d1e54 = [..._0x4fb1c7['values']()]['sort'](
    (_0x390957, _0x1c6e70) => _0x390957['x'] - _0x1c6e70['x'] || _0x390957['z'] - _0x1c6e70['z'],
  );
  if (_0x3d1e54['length'] <= 0x2) return _0x3d1e54;
  const _0x4ed5f9 = (_0xd1c210, _0x3a0931, _0x453515) =>
      (_0x3a0931['x'] - _0xd1c210['x']) * (_0x453515['z'] - _0xd1c210['z']) -
      (_0x3a0931['z'] - _0xd1c210['z']) * (_0x453515['x'] - _0xd1c210['x']),
    _0x204743 = [];
  for (const _0x51ee9f of _0x3d1e54) {
    while (
      _0x204743['length'] >= 0x2 &&
      _0x4ed5f9(_0x204743['at'](-0x2), _0x204743['at'](-0x1), _0x51ee9f) <= 0x0
    ) {
      _0x204743['pop']();
    }
    _0x204743['push'](_0x51ee9f);
  }
  const _0x2c990b = [];
  for (let _0x4703f5 = _0x3d1e54['length'] - 0x1; _0x4703f5 >= 0x0; _0x4703f5 -= 0x1) {
    const _0xa1410c = _0x3d1e54[_0x4703f5];
    while (
      _0x2c990b['length'] >= 0x2 &&
      _0x4ed5f9(_0x2c990b['at'](-0x2), _0x2c990b['at'](-0x1), _0xa1410c) <= 0x0
    ) {
      _0x2c990b['pop']();
    }
    _0x2c990b['push'](_0xa1410c);
  }
  return (_0x204743['pop'](), _0x2c990b['pop'](), [..._0x204743, ..._0x2c990b]);
}
function collectGeometryTopViewPoints(_0x19b506, _0xaae94b) {
  if (!_0x19b506 || !_0xaae94b) return [];
  const _0x16e93e = _0x19b506['attributes']?.['position'];
  if (_0x16e93e?.['count'] > 0x0) {
    const _0x4f27e3 = [],
      _0x434530 = Math['max'](0x1, Math['floor'](_0x16e93e['count'] / 0x180));
    for (let _0x124d25 = 0x0; _0x124d25 < _0x16e93e['count']; _0x124d25 += _0x434530) {
      const _0xf27287 = new threeRuntime['Vector3']()
        ['fromBufferAttribute'](_0x16e93e, _0x124d25)
        ['applyMatrix4'](_0xaae94b);
      _0x4f27e3['push']({ x: _0xf27287['x'], z: _0xf27287['z'] });
    }
    const _0x3f8586 = _0x16e93e['count'] - 0x1;
    if (_0x3f8586 % _0x434530 !== 0x0) {
      const _0x93235c = new threeRuntime['Vector3']()
        ['fromBufferAttribute'](_0x16e93e, _0x3f8586)
        ['applyMatrix4'](_0xaae94b);
      _0x4f27e3['push']({ x: _0x93235c['x'], z: _0x93235c['z'] });
    }
    return _0x4f27e3;
  }
  _0x19b506['computeBoundingBox']?.();
  const _0x8c650 = _0x19b506['boundingBox'];
  if (!_0x8c650 || _0x8c650['isEmpty']?.()) return [];
  const _0x41cc24 = [];
  for (const _0x5a4bc8 of [_0x8c650['min']['x'], _0x8c650['max']['x']]) {
    for (const _0x34a741 of [_0x8c650['min']['y'], _0x8c650['max']['y']]) {
      for (const _0x458a24 of [_0x8c650['min']['z'], _0x8c650['max']['z']]) {
        const _0x18a5c7 = new threeRuntime['Vector3'](_0x5a4bc8, _0x34a741, _0x458a24)['applyMatrix4'](
          _0xaae94b,
        );
        _0x41cc24['push']({ x: _0x18a5c7['x'], z: _0x18a5c7['z'] });
      }
    }
  }
  return _0x41cc24;
}
function collectObjectTopViewFootprint(_0x3c15f0) {
  if (!_0x3c15f0 || _0x3c15f0['visible'] === ![] || typeof _0x3c15f0['traverse'] !== 'function') return [];
  _0x3c15f0['updateMatrixWorld']?.(!![]);
  const _0x102960 = [];
  return (
    _0x3c15f0['traverse']((_0x4ea01e) => {
      if (!_0x4ea01e?.['isMesh'] || _0x4ea01e['visible'] === ![] || !_0x4ea01e['geometry']) return;
      (_0x4ea01e['updateWorldMatrix']?.(!![], ![]),
        _0x102960['push'](...collectGeometryTopViewPoints(_0x4ea01e['geometry'], _0x4ea01e['matrixWorld'])));
    }),
    convexHullXZ(_0x102960)
  );
}
function collectInstanceTopViewFootprint(_0x47ab4a, _0x260ed3) {
  const _0x2897e9 = _0x47ab4a?.['objectIds']?.['indexOf']?.(_0x260ed3) ?? -0x1,
    _0x1b4d8e = _0x47ab4a?.['mesh'];
  if (_0x2897e9 < 0x0 || !_0x1b4d8e?.['geometry'] || typeof _0x1b4d8e['getMatrixAt'] !== 'function')
    return [];
  _0x1b4d8e['updateMatrixWorld']?.(!![]);
  const _0x2c7c1e = new threeRuntime['Matrix4']();
  _0x1b4d8e['getMatrixAt'](_0x2897e9, _0x2c7c1e);
  const _0x1ffdac = _0x1b4d8e['matrixWorld']['clone']()['multiply'](_0x2c7c1e);
  return convexHullXZ(collectGeometryTopViewPoints(_0x1b4d8e['geometry'], _0x1ffdac));
}
function createFallbackTopViewFootprint(_0x2da825) {
  const _0x421790 = _0x2da825?.['transform'] || {},
    _0x53eb9c = vectorFromArray(_0x421790['position'], { x: 0x0, y: 0x0, z: 0x0 }),
    _0x4b6c0f = vectorFromArray(_0x421790['rotation'], { x: 0x0, y: 0x0, z: 0x0 }),
    _0x3bcce4 = scaleFromArray(_0x421790['scale']),
    _0x4373e8 = _0x2da825?.['type'] === 'character' ? 0.65 : _0x2da825?.['type'] === 'light' ? 0.4 : 0x1,
    _0x375799 = _0x2da825?.['type'] === 'character' ? 0.45 : _0x2da825?.['type'] === 'light' ? 0.4 : 0x1,
    _0x3a007b = Math['max'](0.08, (_0x4373e8 * _0x3bcce4['x']) / 0x2),
    _0x201f91 = Math['max'](0.08, (_0x375799 * _0x3bcce4['z']) / 0x2),
    _0x48dddd = Math['cos'](_0x4b6c0f['y']),
    _0x5ca906 = Math['sin'](_0x4b6c0f['y']);
  return [
    [-_0x3a007b, -_0x201f91],
    [_0x3a007b, -_0x201f91],
    [_0x3a007b, _0x201f91],
    [-_0x3a007b, _0x201f91],
  ]['map'](([_0x353105, _0x4fc84f]) => ({
    x: _0x53eb9c['x'] + _0x353105 * _0x48dddd + _0x4fc84f * _0x5ca906,
    z: _0x53eb9c['z'] - _0x353105 * _0x5ca906 + _0x4fc84f * _0x48dddd,
  }));
}
function cameraToSceneView(_0x5830cb) {
  const _0x50b599 = vectorFromArray(_0x5830cb?.['position'], { x: 0x5, y: 0x4, z: 0x7 }),
    _0x3ae2cf = vectorFromArray(_0x5830cb?.['target'], { x: 0x0, y: 1.2, z: 0x0 }),
    _0x111868 = {
      x: _0x50b599['x'] - _0x3ae2cf['x'],
      y: _0x50b599['y'] - _0x3ae2cf['y'],
      z: _0x50b599['z'] - _0x3ae2cf['z'],
    },
    _0x1cfa70 = Math['max'](0.25, Math['hypot'](_0x111868['x'], _0x111868['y'], _0x111868['z']));
  return {
    target: _0x3ae2cf,
    orbitYaw: Math['atan2'](_0x111868['x'], _0x111868['z']),
    orbitPitch: Math['asin'](Math['max'](-0x1, Math['min'](0x1, _0x111868['y'] / _0x1cfa70))),
    orbitDistance: _0x1cfa70,
  };
}
function resolveScene(_0x49d7e7, _0x5943b0) {
  const _0x311bc5 = Array['isArray'](_0x49d7e7?.['scenes']) ? _0x49d7e7['scenes'] : [];
  return (
    _0x311bc5['find']((_0x5d4def) => _0x5d4def['id'] === _0x5943b0) ||
    _0x311bc5['find']((_0x1b81be) => _0x1b81be['id'] === _0x49d7e7?.['activeSceneId']) ||
    _0x311bc5[0x0] ||
    null
  );
}
function resolveActiveShot(_0x189773) {
  const _0xca0b59 = Array['isArray'](_0x189773?.['shots']) ? _0x189773['shots'] : [];
  return (
    _0xca0b59['find']((_0x177baf) => _0x177baf['id'] === _0x189773?.['activeShotId']) ||
    _0xca0b59[0x0] ||
    null
  );
}
function bridgeObjectType(_0x1d9f50) {
  const _0x103757 = _0x1d9f50 && typeof _0x1d9f50 === 'object' ? _0x1d9f50 : null,
    _0x54a6d4 = _0x103757?.['type'] || _0x1d9f50;
  if (_0x54a6d4 === 'prop') return 'cube';
  if (_0x54a6d4 === 'character') return 'mannequin';
  if (_0x54a6d4 === 'camera') return 'camera';
  if (_0x54a6d4 === 'light' && _0x103757?.['lightType'] !== 'ambient') return 'cube';
  return null;
}
function disposeOwnedObject3D(_0x20aa12) {
  _0x20aa12?.['traverse']?.((_0x20028a) => {
    _0x20028a['geometry']?.['dispose']?.();
    const _0x86a629 = Array['isArray'](_0x20028a['material'])
      ? _0x20028a['material']
      : [_0x20028a['material']];
    _0x86a629['filter'](Boolean)['forEach']((_0x3f520b) => _0x3f520b['dispose']?.());
  });
}
function createImportedModelNormalizationRoot(_0x3b37b9) {
  const _0x2cda12 = readStoryboard3DModelNormalization(_0x3b37b9),
    _0x1f065d = new threeRuntime['Group']();
  return (
    (_0x1f065d['name'] = 'storyboard3d-model-normalization'),
    _0x2cda12 &&
      (_0x1f065d['position']['set'](
        _0x2cda12['translation']['x'],
        _0x2cda12['translation']['y'],
        _0x2cda12['translation']['z'],
      ),
      _0x1f065d['scale']['setScalar'](_0x2cda12['uniformScale'])),
    _0x1f065d['add'](_0x3b37b9['clone'](!![])),
    _0x1f065d
  );
}
function applyImportedNormalizationToTemplate(_0xa90421, _0x2b6829) {
  const _0x5c1c31 = readStoryboard3DModelNormalization(_0x2b6829);
  if (!_0xa90421 || !_0x5c1c31) return _0xa90421;
  const _0x13d731 = new threeRuntime['Matrix4']()['compose'](
    new threeRuntime['Vector3'](
      _0x5c1c31['translation']['x'],
      _0x5c1c31['translation']['y'],
      _0x5c1c31['translation']['z'],
    ),
    new threeRuntime['Quaternion'](),
    new threeRuntime['Vector3'](
      _0x5c1c31['uniformScale'],
      _0x5c1c31['uniformScale'],
      _0x5c1c31['uniformScale'],
    ),
  );
  return (_0xa90421['sourceMatrix']['premultiply'](_0x13d731), _0xa90421);
}
function createSelection(_0x2b247e, _0x20ec28, _0x5d0eec) {
  const _0x43222a = (Array['isArray'](_0x20ec28) ? _0x20ec28 : [])
      ['map']((_0x1cddae) => String(_0x1cddae || '')['trim']())
      ['filter'](Boolean),
    _0x5be83f = new Map((_0x2b247e?.['objects'] || [])['map']((_0x404894) => [_0x404894['id'], _0x404894])),
    _0x1b0015 = _0x43222a['map']((_0x373b7c) => _0x5be83f['get'](_0x373b7c))
      ['filter'](Boolean)
      ['filter']((_0xbc6574) => _0xbc6574['visible'] !== ![] && _0xbc6574['locked'] !== !![])
      ['filter']((_0x3a982e) => canStoryboard3DObjectUseTransformTool(_0x3a982e, _0x5d0eec))
      ['map']((_0xcca52a) => ({ objectType: bridgeObjectType(_0xcca52a), objectId: _0xcca52a['id'] }))
      ['filter']((_0x2532ae) => _0x2532ae['objectType']),
    _0x404e34 = _0x1b0015[_0x1b0015['length'] - 0x1] || null;
  return {
    selectedObjectType: _0x404e34?.['objectType'] || null,
    selectedObjectId: _0x404e34?.['objectId'] || null,
    selectedObjectIds: _0x404e34
      ? _0x1b0015['filter']((_0x1c66e5) => _0x1c66e5['objectType'] === _0x404e34['objectType'])['map'](
          (_0x43aadd) => _0x43aadd['objectId'],
        )
      : [],
    selectedObjects: _0x1b0015,
    selectedGroupId: null,
  };
}
function mapSceneObjects(_0x54ac6b) {
  const _0x3cbfc6 = (Array['isArray'](_0x54ac6b?.['objects']) ? _0x54ac6b['objects'] : [])['filter'](
      (_0x4d7246) => _0x4d7246?.['visible'] !== ![],
    ),
    _0x143182 = [],
    _0x20f33c = [],
    _0x1ab2d7 = [];
  return (
    _0x3cbfc6['forEach']((_0x20e055, _0x4f76d9) => {
      const _0x110ce3 = transformToBridgePose(_0x20e055['transform']);
      if (_0x20e055['type'] === 'prop') {
        _0x20f33c['push']({
          id: _0x20e055['id'],
          assetId: _0x20e055['assetId'],
          colorKey: _0x20e055['tint'] || undefined,
          ..._0x110ce3,
        });
        return;
      }
      if (_0x20e055['type'] === 'light' && _0x20e055['lightType'] !== 'ambient') {
        _0x20f33c['push']({ id: _0x20e055['id'], colorKey: _0x20e055['color'] || undefined, ..._0x110ce3 });
        return;
      }
      if (_0x20e055['type'] === 'character') {
        const _0x128349 =
            _0x20e055['bodyPresetId'] === 'female'
              ? 'adult-female'
              : _0x20e055['bodyPresetId'] === 'male'
                ? 'adult-male'
                : _0x20e055['bodyPresetId'],
          _0x1be191 = resolveStoryboard3DCharacterPose({ ..._0x20e055, bodyPresetId: _0x128349 }),
          _0x558bfb = Object['fromEntries'](
            Object['entries'](_0x1be191['boneOverrides'] || {})['map'](([_0x2c050a, _0x24aa98]) => [
              _0x2c050a,
              quaternionToStoryboard3DEuler(_0x24aa98),
            ]),
          );
        _0x143182['push']({
          id: _0x20e055['id'],
          bodyPresetId: _0x1be191['state']['bodyPresetId'],
          colorKey: _0x20e055['colorKey'] || 'blue',
          characterStyle: _0x20e055['characterStyle'] === 'anatomical' ? 'anatomical' : 'articulated',
          bodyProfile: _0x1be191['body'],
          gender: _0x1be191['body']?.['gender'] === 'female' ? 'female' : 'male',
          poseId: _0x1be191['action']?.['poseId'] || undefined,
          bonePose: {
            ...(_0x1be191['baseBones'] || {}),
            ...(_0x1be191['handRotations'] || {}),
            ..._0x558bfb,
          },
          ..._0x110ce3,
        });
        return;
      }
      _0x20e055['type'] === 'camera' &&
        _0x1ab2d7['push']({
          id: _0x20e055['id'],
          slot: _0x4f76d9 + 0x1,
          name: _0x20e055['name'],
          position: _0x110ce3['position'],
          rotation: _0x110ce3['rotation'],
          focalLength: _0x20e055['focalLength'],
        });
    }),
    { mannequins: _0x143182, cubes: _0x20f33c, cameras: _0x1ab2d7 }
  );
}
export function adaptStoryboard3DSceneToDirectorState({
  project: _0x130f75,
  sceneId: _0x46a8e3,
  selectedObjectIds: selectedObjectIds = [],
  activeTool: activeTool = 'select',
} = {}) {
  const _0x43b44c = resolveScene(_0x130f75, _0x46a8e3);
  if (!_0x43b44c) return null;
  const _0x3480c8 = resolveActiveShot(_0x43b44c),
    _0x45f369 = TRANSFORM_TOOLS['has'](activeTool) ? activeTool : 'move',
    _0x22ed9b = mapSceneObjects(_0x43b44c),
    _0x382cf9 = {
      version: 0x2,
      mode: 'scene',
      environmentMode: _0x43b44c['environment']?.['type'] === 'outdoor' ? 'day' : 'night',
      viewport: {
        activeView: 'default',
        activeCameraId: null,
        sceneView: cameraToSceneView(_0x3480c8?.['camera']),
      },
      panorama: { imageUrl: null, isLoaded: ![] },
      ..._0x22ed9b,
      selection: createSelection(_0x43b44c, selectedObjectIds, activeTool),
      groups: [],
      ui: {
        mouseTool: 'navigate',
        transformTool: _0x45f369,
        activeTool: _0x45f369,
        transformSpace: 'world',
        snapEnabled: ![],
        groundLock: ![],
        uniformScale: ![],
        isEditing: !![],
        showOutline: _0x43b44c['environment']?.['showOutline'] !== ![],
      },
    },
    _0x227541 = normalizePanoramaSceneState(_0x382cf9);
  return {
    scene: _0x43b44c,
    activeShot: _0x3480c8,
    state: _0x227541,
    focalLength: finiteNumber(_0x3480c8?.['camera']?.['focalLength'], 0x23),
    unsupportedObjectIds: (_0x43b44c['objects'] || [])
      ['filter'](
        (_0x5a7f22) => !bridgeObjectType(_0x5a7f22) && !['camera', 'light']['includes'](_0x5a7f22['type']),
      )
      ['map']((_0x528d51) => _0x528d51['id']),
  };
}
export class Storyboard3DSceneRuntime {
  constructor({
    container: _0x279895,
    bridgeFactory: _0x36332a,
    importedModelResolver: _0x14d8a9,
    onVisualChange: _0x53e38e,
  } = {}) {
    if (!_0x279895) throw new TypeError('Storyboard3DSceneRuntime requires a container');
    const _0x453da4 =
      typeof _0x36332a === 'function' ? _0x36332a : (_0x545f06) => new PanoramaScene3DBridge(_0x545f06);
    ((this['bridge'] = _0x453da4({ container: _0x279895 })),
      (this['directorScene'] = new DirectorSceneRuntime(this)));
    if (!this['bridge'] || typeof this['bridge']['sync'] !== 'function')
      throw new TypeError('Storyboard3DSceneRuntime requires a compatible scene bridge');
    ((this['project'] = null),
      (this['container'] = _0x279895),
      (this['importedModelResolver'] = typeof _0x14d8a9 === 'function' ? _0x14d8a9 : null),
      (this['onVisualChange'] = typeof _0x53e38e === 'function' ? _0x53e38e : null),
      (this['importedModelRoots'] = new Map()),
      (this['importedModelVisuals'] = new Map()),
      (this['importedInstanceBatches'] = new Map()),
      (this['importedInstanceByObjectId'] = new Map()),
      (this['lightRoots'] = new Map()),
      (this['viewOverrides'] = new Map()),
      (this['viewportFocalLengthOverride'] = null),
      (this['viewProjection'] = { type: 'perspective', options: null }),
      (this['viewportUIPatch'] = {}),
      (this['backgroundTexture'] = null),
      (this['backgroundTextureUrl'] = ''),
      (this['backgroundTextureToken'] = 0x0),
      (this['backgroundCameraLockApplied'] = ![]),
      (this['characterAnimationFrame'] = null),
      (this['timelinePreviewObjectIds'] = new Set()),
      (this['sceneId'] = null),
      (this['selectedObjectIds'] = []),
      (this['activeTool'] = 'select'),
      (this['adapted'] = null),
      (this['disposed'] = ![]));
  }
  ['sync']({
    project: _0x1e8603,
    sceneId: _0x58d5ca,
    selectedObjectIds: _0x2960e9,
    activeTool: _0x31799a,
  } = {}) {
    if (this['disposed']) throw new Error('Storyboard3DSceneRuntime has been disposed');
    if (_0x1e8603 !== undefined) this['project'] = _0x1e8603;
    if (_0x58d5ca !== undefined) this['sceneId'] = _0x58d5ca;
    if (_0x2960e9 !== undefined) this['selectedObjectIds'] = [..._0x2960e9];
    if (_0x31799a !== undefined) this['activeTool'] = _0x31799a;
    const _0x5984a1 = this['adapted']?.['scene']?.['id'] || null,
      _0xcc5230 = this['adapted']?.['activeShot']?.['id'] || null;
    this['adapted'] = adaptStoryboard3DSceneToDirectorState({
      project: this['project'],
      sceneId: this['sceneId'],
      selectedObjectIds: this['selectedObjectIds'],
      activeTool: this['activeTool'],
    });
    if (!this['adapted']) return null;
    ((_0x5984a1 && _0x5984a1 !== this['adapted']['scene']['id']) ||
      (_0xcc5230 && _0xcc5230 !== this['adapted']['activeShot']?.['id'])) &&
      (this['viewportFocalLengthOverride'] = null);
    _0x5984a1 === this['adapted']['scene']['id'] &&
      _0xcc5230 &&
      _0xcc5230 !== this['adapted']['activeShot']?.['id'] &&
      this['viewOverrides']['delete'](this['adapted']['scene']['id']);
    const _0x3f7400 = this['viewOverrides']['get'](this['adapted']['scene']['id']);
    if (_0x3f7400) this['adapted']['state']['viewport']['sceneView'] = structuredClone(_0x3f7400);
    return (
      (this['adapted']['state']['ui'] = { ...this['adapted']['state']['ui'], ...this['viewportUIPatch'] }),
      this['bridge']['setDefaultSceneFocalLength']?.(
        this['viewportFocalLengthOverride'] ?? this['adapted']['focalLength'],
      ),
      this['bridge']['setGridVisible']?.(this['adapted']['scene']['environment']?.['showGrid'] !== ![]),
      this['directorScene']['prepareMaterials'](),
      this['bridge']['sync'](this['adapted']['state']),
      this['_syncBackgroundCameraLock'](),
      this['bridge']['renderer']?.['shadowMap'] &&
        (this['bridge']['renderer']['shadowMap']['enabled'] =
          this['adapted']['scene']['environment']?.['enableShadows'] !== ![]),
      this['_syncImportedModels'](),
      this['_syncSceneLights'](),
      this['_syncFlatBackground'](),
      this['_syncCharacterAnimation'](),
      this['directorScene']['sync'](),
      this['_notifyVisualChange']('sync'),
      this['getSnapshot']()
    );
  }
  ['_notifyVisualChange'](_0x326ff7) {
    if (['set-selection', 'set-active-tool']['includes'](_0x326ff7)) this['directorScene']?.['sync']();
    this['onVisualChange']?.({ reason: String(_0x326ff7 || 'visual-change') });
  }
  ['_applyImportedModelTransform'](_0x490853, _0xdc191a) {
    const _0x15a012 = transformToBridgePose(_0xdc191a);
    (_0x490853?.['position']?.['set']?.(
      _0x15a012['position']['x'],
      _0x15a012['position']['y'],
      _0x15a012['position']['z'],
    ),
      _0x490853?.['rotation']?.['set']?.(
        _0x15a012['rotation']['x'],
        _0x15a012['rotation']['y'],
        _0x15a012['rotation']['z'],
      ),
      _0x490853?.['scale']?.['set']?.(
        _0x15a012['scale']['x'],
        _0x15a012['scale']['y'],
        _0x15a012['scale']['z'],
      ),
      _0x490853?.['updateMatrixWorld']?.(!![]));
  }
  ['_clearImportedModels']() {
    const _0x3d22ba = new Set([
      ...this['importedModelRoots']['keys'](),
      ...this['importedInstanceByObjectId']['keys'](),
      ...this['importedModelVisuals']['keys'](),
    ]);
    _0x3d22ba['forEach']((_0x4b7d93) => {
      this['bridge']['clearObjectVisualOverride']?.('cube', _0x4b7d93);
    });
    for (const _0x4d04f2 of this['importedModelRoots']['values']()) {
      (this['bridge']['scene']?.['remove']?.(_0x4d04f2),
        (_0x4d04f2['userData']?.['storyboardOwnedMaterials'] || [])['forEach']((_0x5293da) =>
          _0x5293da?.['dispose']?.(),
        ));
    }
    (this['importedModelRoots']['clear'](), this['importedModelVisuals']['clear']());
    for (const _0x1ee340 of this['importedInstanceBatches']['values']()) {
      (this['bridge']['scene']?.['remove']?.(_0x1ee340['mesh']), disposeStoryboard3DInstanceBatch(_0x1ee340));
    }
    (this['importedInstanceBatches']['clear'](), this['importedInstanceByObjectId']['clear']());
  }
  ['_clearSceneLights']() {
    for (const [_0x338dd5, _0x26795f] of this['lightRoots']) {
      (this['bridge']['clearObjectVisualOverride']?.('cube', _0x338dd5),
        this['bridge']['scene']?.['remove']?.(_0x26795f),
        disposeOwnedObject3D(_0x26795f));
    }
    this['lightRoots']['clear']();
  }
  ['_syncSceneLights']() {
    this['_clearSceneLights']();
    if (!this['bridge']['scene']) return;
    for (const _0x34edfd of this['adapted']?.['scene']?.['objects'] || []) {
      if (_0x34edfd['type'] !== 'light' || _0x34edfd['visible'] === ![]) continue;
      const _0x535139 = _0x34edfd['color'] || 0xffffff,
        _0x34049e = Math['max'](0x0, Number(_0x34edfd['intensity']) || 0x0);
      let _0x4efd19;
      if (_0x34edfd['lightType'] === 'ambient')
        _0x4efd19 = new threeRuntime['AmbientLight'](_0x535139, _0x34049e);
      else {
        if (_0x34edfd['lightType'] === 'point')
          _0x4efd19 = new threeRuntime['PointLight'](
            _0x535139,
            _0x34049e,
            Number(_0x34edfd['distance']) || 0x0,
            Number(_0x34edfd['decay']) || 0x2,
          );
        else {
          if (_0x34edfd['lightType'] === 'spot')
            _0x4efd19 = new threeRuntime['SpotLight'](
              _0x535139,
              _0x34049e,
              Number(_0x34edfd['distance']) || 0x0,
              Number(_0x34edfd['angle']) || Math['PI'] / 0x6,
            );
          else _0x4efd19 = new threeRuntime['DirectionalLight'](_0x535139, _0x34049e);
        }
      }
      _0x4efd19['castShadow'] = _0x34edfd['castShadow'] === !![];
      const _0x580a43 = new threeRuntime['Group']();
      ((_0x580a43['name'] = 'storyboard3d-light-' + _0x34edfd['id']),
        (_0x580a43['userData']['storyboardObjectId'] = _0x34edfd['id']),
        _0x580a43['add'](_0x4efd19));
      if (
        _0x34edfd['lightType'] === 'directional' ||
        _0x34edfd['lightType'] === 'spot' ||
        !_0x34edfd['lightType']
      ) {
        const _0x5add0f = new threeRuntime['Object3D']();
        (_0x5add0f['position']['set'](0x0, 0x0, -0x1),
          _0x580a43['add'](_0x5add0f),
          (_0x4efd19['target'] = _0x5add0f));
      }
      if (_0x34edfd['lightType'] !== 'ambient') {
        const _0x2fa6ce = new threeRuntime['Mesh'](
          new threeRuntime['SphereGeometry'](0.12, 0xc, 0x8),
          new threeRuntime['MeshBasicMaterial']({ color: _0x535139 }),
        );
        ((_0x2fa6ce['userData']['storyboardObjectId'] = _0x34edfd['id']), _0x580a43['add'](_0x2fa6ce));
      }
      (this['_applyImportedModelTransform'](_0x580a43, _0x34edfd['transform']),
        this['bridge']['scene']['add'](_0x580a43),
        this['lightRoots']['set'](_0x34edfd['id'], _0x580a43));
      if (_0x34edfd['lightType'] !== 'ambient') {
        this['bridge']['setObjectVisualOverride']?.('cube', _0x34edfd['id'], { group: _0x580a43 });
        const _0x5be39e = this['bridge']['_cubeMap']?.['get']?.(_0x34edfd['id']);
        if (_0x5be39e?.['group']) _0x5be39e['group']['visible'] = ![];
      }
    }
    this['bridge']['requestRender']?.();
  }
  ['_syncBackgroundCameraLock']() {
    const _0x2b2dba = normalizeStoryboard3DBackgroundCalibration(this['adapted']?.['scene']?.['background']);
    if (_0x2b2dba['lockedCamera'] && _0x2b2dba['lockedCameraSnapshot']) {
      const _0x2dadd3 = this['bridge']['renderer']?.['getSize']?.(new threeRuntime['Vector2']()),
        _0x31e565 = Math['max'](
          0.1,
          Number(_0x2dadd3?.['x']) / Math['max'](0x1, Number(_0x2dadd3?.['y'])) ||
            _0x2b2dba['imageWidth'] / Math['max'](0x1, _0x2b2dba['imageHeight']) ||
            0x10 / 0x9,
        );
      return (
        this['previewCamera']({
          ..._0x2b2dba['lockedCameraSnapshot'],
          fov: computeStoryboard3DVerticalFov(_0x2b2dba['horizontalFov'], _0x31e565),
        }),
        (this['backgroundCameraLockApplied'] = !![]),
        !![]
      );
    }
    return (
      this['backgroundCameraLockApplied'] &&
        (this['bridge']['clearDraftView']?.(), (this['backgroundCameraLockApplied'] = ![])),
      ![]
    );
  }
  ['_syncFlatBackground']() {
    const _0x3ac2ce = this['adapted']?.['scene']?.['background'],
      _0x2c1a28 = String(_0x3ac2ce?.['imageUrl'] || '')['trim']();
    this['bridge']['setGroundFillVisible']?.(!_0x2c1a28);
    if (!_0x2c1a28) {
      this['backgroundTextureToken'] += 0x1;
      this['bridge']['scene']?.['background'] === this['backgroundTexture'] &&
        (this['bridge']['scene']['background'] = null);
      (this['backgroundTexture']?.['dispose']?.(),
        (this['backgroundTexture'] = null),
        (this['backgroundTextureUrl'] = ''));
      return;
    }
    const _0x58f852 = (_0x349db1) => {
      const _0x1c6102 = Math['max'](0.1, Math['min'](0xa, Number(_0x3ac2ce['imageScale']) || 0x1)),
        _0x15a1e6 = Math['max'](0x1, Number(this['adapted']?.['focalLength']) || 0x23),
        _0xda44cb = (0x2 * Math['atan'](0x24 / (0x2 * _0x15a1e6)) * 0xb4) / Math['PI'],
        _0x564af2 = this['bridge']['renderer']?.['getSize']?.(new threeRuntime['Vector2']()),
        _0x5bd723 = Math['max'](
          0.1,
          Number(_0x564af2?.['x']) / Math['max'](0x1, Number(_0x564af2?.['y'])) || 0x10 / 0x9,
        ),
        _0x201861 =
          (0x2 * Math['atan'](Math['tan']((_0xda44cb * Math['PI']) / 0x168) / _0x5bd723) * 0xb4) / Math['PI'],
        _0xb61429 = _0x3ac2ce['lockedCamera'] === !![] && _0x3ac2ce['lockedCameraSnapshot'],
        _0x43e032 = Math['max'](
          0.01,
          Math['min'](
            0xa,
            _0xb61429
              ? 0x1 / _0x1c6102
              : _0xda44cb / Math['max'](0x1, Number(_0x3ac2ce['horizontalFov']) || 0x3c) / _0x1c6102,
          ),
        ),
        _0x82cdd8 = Math['max'](
          0.01,
          Math['min'](
            0xa,
            _0xb61429
              ? 0x1 / _0x1c6102
              : _0x201861 / Math['max'](0x1, Number(_0x3ac2ce['verticalFov']) || _0x201861) / _0x1c6102,
          ),
        ),
        _0x1f67b2 = Array['isArray'](_0x3ac2ce['vanishingPoint']) ? _0x3ac2ce['vanishingPoint'] : [0.5, 0.5],
        _0x3c293d = Array['isArray'](_0x3ac2ce['imageOffset']) ? _0x3ac2ce['imageOffset'] : [0x0, 0x0];
      (_0x349db1['repeat']?.['set']?.(_0x43e032, _0x82cdd8),
        _0x349db1['offset']?.['set']?.(
          0.5 -
            _0x43e032 / 0x2 +
            (Number(_0x3c293d[0x0]) || 0x0) +
            (_0xb61429 ? 0x0 : 0.5 - (Number(_0x1f67b2[0x0]) || 0.5)),
          0.5 -
            _0x82cdd8 / 0x2 +
            (Number(_0x3c293d[0x1]) || 0x0) +
            (_0xb61429 ? 0x0 : 0.5 - (Number(_0x3ac2ce['horizonY']) || 0.5)),
        ),
        (_0x349db1['needsUpdate'] = !![]),
        (this['bridge']['scene']['background'] = _0x349db1),
        this['bridge']['requestRender']?.());
    };
    if (_0x2c1a28 === this['backgroundTextureUrl'] && this['backgroundTexture']) {
      _0x58f852(this['backgroundTexture']);
      return;
    }
    const _0x563659 = ++this['backgroundTextureToken'],
      _0x311cad = new threeRuntime['TextureLoader']();
    (_0x311cad['setCrossOrigin']?.('anonymous'),
      _0x311cad['load'](
        _0x2c1a28,
        (_0x3d204e) => {
          void applyStoryboard3DTexturePolicy(
            { background: _0x3d204e },
            { renderer: this['bridge']['renderer'] },
          )
            ['catch'](() => null)
            ['then'](() => {
              if (_0x563659 !== this['backgroundTextureToken'] || this['disposed']) {
                _0x3d204e['dispose']?.();
                return;
              }
              (this['backgroundTexture']?.['dispose']?.(),
                (this['backgroundTexture'] = _0x3d204e),
                (this['backgroundTextureUrl'] = _0x2c1a28),
                _0x58f852(_0x3d204e));
            });
        },
        undefined,
        () => {
          _0x563659 === this['backgroundTextureToken'] &&
            ((this['backgroundTextureUrl'] = ''), this['bridge']['setGroundFillVisible']?.(!![]));
        },
      ));
  }
  ['_stopCharacterAnimation']() {
    this['characterAnimationFrame'] != null &&
      (globalThis['cancelAnimationFrame']?.(this['characterAnimationFrame']),
      (this['characterAnimationFrame'] = null));
    for (const _0x32f547 of this['adapted']?.['scene']?.['objects'] || []) {
      if (_0x32f547['type'] === 'character') this['bridge']['clearDraftMannequinBonePose']?.(_0x32f547['id']);
    }
  }
  ['_syncCharacterAnimation']() {
    this['_stopCharacterAnimation']();
    if (this['timelinePreviewActive']) return;
    const _0x4e4580 = (this['adapted']?.['scene']?.['objects'] || [])['filter'](
      (_0x41d2dc) => _0x41d2dc['type'] === 'character' && _0x41d2dc['actionPlaying'] === !![],
    );
    if (_0x4e4580['length'] === 0x0 || typeof globalThis['requestAnimationFrame'] !== 'function') return;
    const _0x10a688 = globalThis['performance']?.['now']?.() || Date['now'](),
      _0xdd1a99 = (_0x18633d) => {
        if (this['disposed']) return;
        const _0x4f2b48 = Math['max'](0x0, ((Number(_0x18633d) || Date['now']()) - _0x10a688) / 0x3e8);
        for (const _0x15adef of _0x4e4580) {
          const _0x5b7d18 = resolveStoryboard3DCharacterPose({
              ..._0x15adef,
              actionTime: (Number(_0x15adef['actionTime']) || 0x0) + _0x4f2b48,
            }),
            _0x347f7c = Object['fromEntries'](
              Object['entries'](_0x5b7d18['boneOverrides'] || {})['map'](([_0x24a97e, _0x27f115]) => [
                _0x24a97e,
                quaternionToStoryboard3DEuler(_0x27f115),
              ]),
            );
          this['bridge']['setDraftMannequinBonePose']?.(_0x15adef['id'], {
            ...(_0x5b7d18['baseBones'] || {}),
            ...(_0x5b7d18['handRotations'] || {}),
            ..._0x347f7c,
          });
        }
        (this['bridge']['requestRender']?.(),
          (this['characterAnimationFrame'] = globalThis['requestAnimationFrame'](_0xdd1a99)));
      };
    this['characterAnimationFrame'] = globalThis['requestAnimationFrame'](_0xdd1a99);
  }
  ['_syncImportedModels']() {
    this['_clearImportedModels']();
    if (!this['importedModelResolver'] || !this['bridge']['scene']) return;
    const _0x35c5a9 = (this['adapted']?.['scene']?.['objects'] || [])['filter'](
        (_0x5b1b0b) => _0x5b1b0b['type'] === 'prop' && _0x5b1b0b['visible'] !== ![],
      ),
      _0x39f36c = new Map();
    _0x35c5a9['forEach']((_0x39b7d2) => {
      const _0x5938e7 = [
        _0x39b7d2['assetId'],
        _0x39b7d2['tint'] || '',
        _0x39b7d2['castShadow'] !== ![] ? 'cast' : 'no-cast',
        _0x39b7d2['receiveShadow'] !== ![] ? 'receive' : 'no-receive',
      ]['join']('|');
      if (!_0x39f36c['has'](_0x5938e7)) _0x39f36c['set'](_0x5938e7, []);
      _0x39f36c['get'](_0x5938e7)['push'](_0x39b7d2);
    });
    const _0x5da21e = new Set();
    for (const [_0x120a86, _0x48bcab] of _0x39f36c) {
      if (_0x48bcab['length'] < STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT) continue;
      const _0x2529ed = this['importedModelResolver'](_0x48bcab[0x0]['assetId']),
        _0x51025d = applyImportedNormalizationToTemplate(
          findStoryboard3DInstancingTemplate(_0x2529ed),
          _0x2529ed,
        );
      if (!_0x51025d) continue;
      const _0x266379 = createStoryboard3DInstanceBatch({
        template: _0x51025d,
        objects: _0x48bcab,
        tint: _0x48bcab[0x0]['tint'] || '',
        castShadow: _0x48bcab[0x0]['castShadow'] !== ![],
        receiveShadow: _0x48bcab[0x0]['receiveShadow'] !== ![],
      });
      ((_0x266379['mesh']['name'] = 'storyboard3d-instances-' + _0x48bcab[0x0]['assetId']),
        this['bridge']['scene']['add'](_0x266379['mesh']),
        this['importedInstanceBatches']['set'](_0x120a86, _0x266379),
        _0x48bcab['forEach']((_0x348b95) => {
          (_0x5da21e['add'](_0x348b95['id']),
            this['importedInstanceByObjectId']['set'](_0x348b95['id'], _0x266379),
            this['_syncImportedInstanceVisual'](_0x348b95, _0x266379, _0x348b95['transform']));
          const _0x3da4fb = this['bridge']['_cubeMap']?.['get']?.(_0x348b95['id']);
          if (_0x3da4fb?.['group']) _0x3da4fb['group']['visible'] = ![];
        }));
    }
    for (const _0x4b1e9e of _0x35c5a9) {
      if (_0x5da21e['has'](_0x4b1e9e['id'])) continue;
      const _0x5a3692 = this['importedModelResolver'](_0x4b1e9e['assetId']);
      if (!_0x5a3692?.['clone']) continue;
      const _0x5498f4 = new threeRuntime['Group']();
      ((_0x5498f4['name'] = 'storyboard3d-imported-' + _0x4b1e9e['id']),
        (_0x5498f4['userData'] = { ...(_0x5498f4['userData'] || {}), storyboardObjectId: _0x4b1e9e['id'] }),
        _0x5498f4['add'](createImportedModelNormalizationRoot(_0x5a3692)));
      const _0x2b145d = [];
      (_0x5498f4['traverse']?.((_0x39872e) => {
        if (!_0x39872e?.['isMesh']) return;
        ((_0x39872e['castShadow'] = _0x4b1e9e['castShadow'] !== ![]),
          (_0x39872e['receiveShadow'] = _0x4b1e9e['receiveShadow'] !== ![]));
        if (!_0x4b1e9e['tint'] || !_0x39872e['material']) return;
        const _0x8a2cbf = Array['isArray'](_0x39872e['material'])
            ? _0x39872e['material']
            : [_0x39872e['material']],
          _0x12e795 = _0x8a2cbf['map']((_0x365c23) => {
            const _0x1ffa32 = _0x365c23?.['clone']?.() || _0x365c23;
            if (_0x1ffa32 !== _0x365c23) _0x2b145d['push'](_0x1ffa32);
            return (_0x1ffa32?.['color']?.['set']?.(_0x4b1e9e['tint']), _0x1ffa32);
          });
        _0x39872e['material'] = Array['isArray'](_0x39872e['material']) ? _0x12e795 : _0x12e795[0x0];
      }),
        (_0x5498f4['userData']['storyboardOwnedMaterials'] = _0x2b145d),
        this['_applyImportedModelTransform'](_0x5498f4, _0x4b1e9e['transform']),
        this['bridge']['scene']['add'](_0x5498f4),
        this['importedModelRoots']['set'](_0x4b1e9e['id'], _0x5498f4),
        this['bridge']['setObjectVisualOverride']?.('cube', _0x4b1e9e['id'], { group: _0x5498f4 }));
      const _0xf00471 = this['bridge']['_cubeMap']?.['get']?.(_0x4b1e9e['id']);
      if (_0xf00471?.['group']) _0xf00471['group']['visible'] = ![];
    }
    this['bridge']['requestRender']?.();
  }
  ['_syncImportedInstanceVisual'](_0x531415, _0x444cc0, _0x4609fd) {
    const _0x3680d1 = _0x444cc0?.['mesh']?.['geometry'];
    if (!_0x531415?.['id'] || !_0x3680d1 || !_0x444cc0?.['mesh']?.['getMatrixAt']) return;
    _0x3680d1['computeBoundingBox']?.();
    if (!_0x3680d1['boundingBox'] || _0x3680d1['boundingBox']['isEmpty']()) return;
    let _0x239ec7 = this['importedModelVisuals']['get'](_0x531415['id']);
    !_0x239ec7 &&
      ((_0x239ec7 = { group: new threeRuntime['Group'](), boundsBox: new threeRuntime['Box3']() }),
      this['importedModelVisuals']['set'](_0x531415['id'], _0x239ec7));
    this['_applyImportedModelTransform'](_0x239ec7['group'], _0x4609fd);
    const _0x168cae = _0x444cc0['objectIds']['indexOf'](_0x531415['id']);
    if (_0x168cae < 0x0) return;
    const _0x1fa271 = new threeRuntime['Matrix4']();
    (_0x444cc0['mesh']['getMatrixAt'](_0x168cae, _0x1fa271), _0x444cc0['mesh']['updateMatrixWorld']?.(!![]));
    const _0x400a58 = _0x444cc0['mesh']['matrixWorld']['clone']()['multiply'](_0x1fa271);
    (_0x239ec7['boundsBox']['copy'](_0x3680d1['boundingBox'])['applyMatrix4'](_0x400a58),
      this['bridge']['setObjectVisualOverride']?.('cube', _0x531415['id'], _0x239ec7));
  }
  ['_pickImportedModel'](_0x216111, _0x479242) {
    if (
      this['importedModelRoots']['size'] === 0x0 &&
      this['importedInstanceBatches']['size'] === 0x0 &&
      this['lightRoots']['size'] === 0x0
    )
      return null;
    if (!this['bridge']['camera']) return null;
    const _0x2d0f7d =
      this['bridge']['renderer']?.['domElement']?.['getBoundingClientRect']?.() ||
      this['container']?.['getBoundingClientRect']?.();
    if (!_0x2d0f7d?.['width'] || !_0x2d0f7d?.['height']) return null;
    const _0x4df800 = new threeRuntime['Raycaster']();
    _0x4df800['setFromCamera'](
      {
        x: ((_0x216111 - _0x2d0f7d['left']) / _0x2d0f7d['width']) * 0x2 - 0x1,
        y: -((_0x479242 - _0x2d0f7d['top']) / _0x2d0f7d['height']) * 0x2 + 0x1,
      },
      this['bridge']['camera'],
    );
    let _0x135443 = null;
    for (const [_0x1186a9, _0x36c1ef] of [...this['importedModelRoots'], ...this['lightRoots']]) {
      const _0x34ac9d = _0x4df800['intersectObject'](_0x36c1ef, !![])[0x0];
      if (_0x34ac9d && (!_0x135443 || _0x34ac9d['distance'] < _0x135443['distance']))
        _0x135443 = { ..._0x34ac9d, objectId: _0x1186a9 };
    }
    for (const _0x300e07 of this['importedInstanceBatches']['values']()) {
      const _0x4ea42e = _0x4df800['intersectObject'](_0x300e07['mesh'], ![])[0x0],
        _0x5ed369 = Number['isInteger'](_0x4ea42e?.['instanceId'])
          ? _0x300e07['objectIds'][_0x4ea42e['instanceId']]
          : null;
      _0x5ed369 &&
        (!_0x135443 || _0x4ea42e['distance'] < _0x135443['distance']) &&
        (_0x135443 = { ..._0x4ea42e, objectId: _0x5ed369 });
    }
    return _0x135443
      ? {
          objectType: 'cube',
          objectId: _0x135443['objectId'],
          point: _0x135443['point'],
          distance: _0x135443['distance'],
        }
      : null;
  }
  ['_syncInteractionState'](_0xec4f58) {
    if (!this['adapted']) return this['sync']();
    const _0x22715e = TRANSFORM_TOOLS['has'](this['activeTool']) ? this['activeTool'] : 'move';
    return (
      (this['adapted'] = {
        ...this['adapted'],
        state: {
          ...this['adapted']['state'],
          selection: createSelection(this['adapted']['scene'], this['selectedObjectIds'], this['activeTool']),
          ui: { ...this['adapted']['state']['ui'], transformTool: _0x22715e, activeTool: _0x22715e },
        },
      }),
      this['directorScene']['prepareMaterials'](),
      this['bridge']['sync'](this['adapted']['state']),
      this['_notifyVisualChange'](_0xec4f58),
      this['getSnapshot']()
    );
  }
  ['setSelection'](_0x48f595) {
    return (
      (this['selectedObjectIds'] = Array['isArray'](_0x48f595) ? [..._0x48f595] : []),
      this['_syncInteractionState']('set-selection')
    );
  }
  ['setActiveTool'](_0x52428d) {
    return ((this['activeTool'] = _0x52428d), this['_syncInteractionState']('set-active-tool'));
  }
  ['pick'](_0x2aabf7, _0x527fec) {
    const _0x497747 = this['_pickImportedModel'](_0x2aabf7, _0x527fec),
      _0x5f5215 = this['bridge']['pick']?.(_0x2aabf7, _0x527fec) || null,
      _0x1b7a7d =
        _0x5f5215?.['point'] && this['bridge']['camera']?.['position']
          ? this['bridge']['camera']['position']['distanceTo']?.(_0x5f5215['point'])
          : Number['POSITIVE_INFINITY'],
      _0x36935a = _0x497747 && _0x497747['distance'] <= _0x1b7a7d ? _0x497747 : _0x5f5215 || _0x497747;
    if (!_0x36935a) return null;
    const _0x1c5bef = this['adapted']?.['scene']?.['objects']?.['find'](
      (_0xeccbfd) => _0xeccbfd['id'] === _0x36935a['objectId'],
    );
    if (!_0x1c5bef || _0x1c5bef['visible'] === ![] || _0x1c5bef['locked'] === !![]) return null;
    return { ..._0x36935a, storyboardObjectId: _0x1c5bef['id'], storyboardObjectType: _0x1c5bef['type'] };
  }
  ['pickObjectsInRect'](_0x437d51) {
    const _0x4ef1f5 = this['bridge']['pickObjectsInRect']?.(_0x437d51) || [],
      _0x60998d = new Set(
        (this['adapted']?.['scene']?.['objects'] || [])
          ['filter']((_0x25f300) => _0x25f300['visible'] !== ![] && _0x25f300['locked'] !== !![])
          ['map']((_0x3d992e) => _0x3d992e['id']),
      );
    return _0x4ef1f5['filter']((_0x31e734) => _0x60998d['has'](_0x31e734['objectId']));
  }
  ['resolveDollyAnchor'](_0x4fbabe, _0x1006b3) {
    return this['bridge']['resolveDollyAnchor']?.(_0x4fbabe, _0x1006b3) || null;
  }
  ['resolveGroundPosition'](_0x57095a, _0x4b76f3, _0x3ca1e7 = 0x0) {
    const _0x401b1e = this['bridge']['camera'],
      _0x421768 =
        this['bridge']['renderer']?.['domElement']?.['getBoundingClientRect']?.() ||
        this['container']?.['getBoundingClientRect']?.();
    if (!_0x401b1e || !_0x421768?.['width'] || !_0x421768?.['height']) return null;
    _0x401b1e['updateMatrixWorld']?.();
    const _0x5bb44e = new threeRuntime['Raycaster']();
    _0x5bb44e['setFromCamera'](
      {
        x: ((finiteNumber(_0x57095a) - _0x421768['left']) / _0x421768['width']) * 0x2 - 0x1,
        y: -((finiteNumber(_0x4b76f3) - _0x421768['top']) / _0x421768['height']) * 0x2 + 0x1,
      },
      _0x401b1e,
    );
    const _0x243e1a = new threeRuntime['Vector3'](),
      _0x526ef1 = new threeRuntime['Plane'](
        new threeRuntime['Vector3'](0x0, 0x1, 0x0),
        -finiteNumber(_0x3ca1e7),
      );
    if (!_0x5bb44e['ray']['intersectPlane'](_0x526ef1, _0x243e1a)) return null;
    if (_0x243e1a['distanceTo'](_0x401b1e['position']) > 0x2710) return null;
    return [_0x243e1a['x'], finiteNumber(_0x3ca1e7), _0x243e1a['z']];
  }
  ['resolveViewportGroundPosition'](_0xa3ccc2 = 0x0) {
    const _0x52de45 =
      this['bridge']['renderer']?.['domElement']?.['getBoundingClientRect']?.() ||
      this['container']?.['getBoundingClientRect']?.();
    if (!_0x52de45?.['width'] || !_0x52de45?.['height']) return null;
    return this['resolveGroundPosition'](
      _0x52de45['left'] + _0x52de45['width'] / 0x2,
      _0x52de45['top'] + _0x52de45['height'] / 0x2,
      _0xa3ccc2,
    );
  }
  ['resolveObjectGroundPosition'](_0x1011df) {
    const _0x3053db = this['adapted']?.['scene']?.['objects']?.['find'](
      (_0x1e4b3c) => _0x1e4b3c['id'] === _0x1011df,
    );
    if (!_0x3053db || !getStoryboard3DObjectTransformCapabilities(_0x3053db)['groundSnap']) return null;
    const _0x38911d = this['importedModelVisuals']['get'](_0x3053db['id']),
      _0xab705b = this['importedModelRoots']['get'](_0x3053db['id']),
      _0x5c3700 =
        _0x3053db['type'] === 'character'
          ? this['bridge']['_mannequinMap']?.['get']?.(_0x3053db['id'])
          : this['bridge']['_cubeMap']?.['get']?.(_0x3053db['id']);
    let _0x9b2431 =
      _0x38911d?.['boundsBox']?.['isBox3'] && !_0x38911d['boundsBox']['isEmpty']()
        ? _0x38911d['boundsBox']['clone']()
        : null;
    const _0x12f4f1 = _0xab705b || _0x5c3700?.['proxyRoot'] || _0x5c3700?.['group'];
    if (!_0x9b2431 && _0x12f4f1) {
      _0x12f4f1['updateMatrixWorld']?.(!![]);
      const _0x3483ec = new threeRuntime['Box3']()['setFromObject'](_0x12f4f1);
      if (!_0x3483ec['isEmpty']()) _0x9b2431 = _0x3483ec;
    }
    if (!_0x9b2431 || !Number['isFinite'](_0x9b2431['min']['y'])) return null;
    const _0x5ae13a = finiteNumber(_0x3053db['transform']?.['position']?.[0x1]);
    return _0x5ae13a - _0x9b2431['min']['y'];
  }
  ['resolveObjectGroundPositions'](_0x39169f) {
    return Object['fromEntries'](
      (Array['isArray'](_0x39169f) ? _0x39169f : [])
        ['map']((_0x4ce15c) => [_0x4ce15c, this['resolveObjectGroundPosition'](_0x4ce15c)])
        ['filter'](([, _0x2d7450]) => Number['isFinite'](_0x2d7450)),
    );
  }
  ['previewObjectTransform'](_0x43a074, _0x2f17e3) {
    return this['previewObjectTransforms']({ [_0x43a074]: _0x2f17e3 });
  }
  ['previewTimelineSample'](_0x566a11) {
    if (!_0x566a11) return ![];
    if (!this['timelinePreviewActive']) this['_stopCharacterAnimation']();
    this['timelinePreviewActive'] = !![];
    if (_0x566a11['camera']) this['previewCamera'](_0x566a11['camera']);
    const _0x747fb4 = new Set(Object['keys'](_0x566a11['objectTransforms'] || {}));
    for (const _0x941f0f of this['timelinePreviewObjectIds']) {
      if (!_0x747fb4['has'](_0x941f0f)) this['clearObjectTransformPreview'](_0x941f0f);
    }
    ((this['timelinePreviewObjectIds'] = _0x747fb4),
      this['previewObjectTransforms'](_0x566a11['objectTransforms'] || {}, { includeLocked: !![] }));
    for (const _0x4989d6 of this['adapted']?.['scene']?.['objects'] || []) {
      if (_0x4989d6['type'] !== 'character') continue;
      const _0x142552 = resolveStoryboard3DCharacterPose({
        ..._0x4989d6,
        ..._0x566a11['characterActions']?.[_0x4989d6['id']],
      });
      this['bridge']['setDraftMannequinBonePose']?.(_0x4989d6['id'], {
        ..._0x142552['baseBones'],
        ..._0x142552['handRotations'],
        ...Object['fromEntries'](
          Object['entries'](_0x142552['boneOverrides'] || {})['map'](([_0x1db37, _0x4d1b39]) => [
            _0x1db37,
            quaternionToStoryboard3DEuler(_0x4d1b39),
          ]),
        ),
      });
    }
    return (this['bridge']['requestRender']?.(), !![]);
  }
  ['previewObjectTransforms'](_0x2af581 = {}, { includeLocked: includeLocked = ![] } = {}) {
    const _0x224107 = new Set();
    let _0x4eac62 = ![];
    (Object['entries'](_0x2af581)['forEach'](([_0x4943a7, _0x46008b]) => {
      const _0x3fca35 = this['adapted']?.['scene']?.['objects']?.['find'](
          (_0x40d09b) => _0x40d09b['id'] === _0x4943a7,
        ),
        _0x135433 = bridgeObjectType(_0x3fca35),
        _0x4d790b =
          this['importedModelRoots']['get'](_0x3fca35?.['id']) ||
          this['lightRoots']['get'](_0x3fca35?.['id']),
        _0x312c01 = this['importedInstanceByObjectId']['get'](_0x3fca35?.['id']);
      if ((!_0x135433 && !_0x4d790b && !_0x312c01) || (!includeLocked && _0x3fca35?.['locked'] === !![]))
        return;
      if (_0x135433)
        this['bridge']['setDraftObjectTransform']?.(
          _0x135433,
          _0x3fca35['id'],
          transformToBridgePose(_0x46008b),
        );
      if (_0x4d790b) this['_applyImportedModelTransform'](_0x4d790b, _0x46008b);
      (_0x312c01 &&
        (updateStoryboard3DInstanceTransform(_0x312c01, _0x3fca35['id'], _0x46008b, { recomputeBounds: ![] }),
        _0x224107['add'](_0x312c01),
        this['_syncImportedInstanceVisual'](_0x3fca35, _0x312c01, _0x46008b)),
        (_0x4eac62 = !![]));
    }),
      _0x224107['forEach']((_0x3d7c8b) => refreshStoryboard3DInstanceBatchBounds(_0x3d7c8b)));
    if (_0x4eac62) this['_notifyVisualChange']('preview-object-transform');
    return _0x4eac62;
  }
  ['clearObjectTransformPreview'](_0x380153) {
    const _0x5f480e = this['adapted']?.['scene']?.['objects']?.['find'](
        (_0x20d4b3) => _0x20d4b3['id'] === _0x380153,
      ),
      _0x38217d = bridgeObjectType(_0x5f480e),
      _0x316f0e =
        this['importedModelRoots']['get'](_0x5f480e?.['id']) || this['lightRoots']['get'](_0x5f480e?.['id']),
      _0x2c2487 = this['importedInstanceByObjectId']['get'](_0x5f480e?.['id']);
    if (!_0x38217d && !_0x316f0e && !_0x2c2487) return ![];
    if (_0x38217d) this['bridge']['clearDraftObjectTransform']?.(_0x38217d, _0x5f480e['id']);
    if (_0x316f0e) this['_applyImportedModelTransform'](_0x316f0e, _0x5f480e['transform']);
    return (
      _0x2c2487 &&
        (updateStoryboard3DInstanceTransform(_0x2c2487, _0x5f480e['id'], _0x5f480e['transform']),
        this['_syncImportedInstanceVisual'](_0x5f480e, _0x2c2487, _0x5f480e['transform'])),
      this['_notifyVisualChange']('clear-object-transform-preview'),
      !![]
    );
  }
  ['clearPreviews']() {
    ((this['timelinePreviewActive'] = ![]),
      this['timelinePreviewObjectIds']['clear'](),
      this['bridge']['clearAllDrafts']?.(),
      this['_syncCharacterAnimation']());
    if (this['backgroundCameraLockApplied']) this['_syncBackgroundCameraLock']();
    const _0x2eab99 = new Set();
    for (const _0x22888a of this['adapted']?.['scene']?.['objects'] || []) {
      const _0xe0826c = this['importedModelRoots']['get'](_0x22888a['id']);
      if (_0xe0826c) this['_applyImportedModelTransform'](_0xe0826c, _0x22888a['transform']);
      const _0x5a82c2 = this['lightRoots']['get'](_0x22888a['id']);
      if (_0x5a82c2) this['_applyImportedModelTransform'](_0x5a82c2, _0x22888a['transform']);
      const _0x29b1f4 = this['importedInstanceByObjectId']['get'](_0x22888a['id']);
      _0x29b1f4 &&
        (updateStoryboard3DInstanceTransform(_0x29b1f4, _0x22888a['id'], _0x22888a['transform'], {
          recomputeBounds: ![],
        }),
        _0x2eab99['add'](_0x29b1f4),
        this['_syncImportedInstanceVisual'](_0x22888a, _0x29b1f4, _0x22888a['transform']));
    }
    (_0x2eab99['forEach']((_0x441779) => refreshStoryboard3DInstanceBatchBounds(_0x441779)),
      this['_notifyVisualChange']('clear-previews'));
  }
  ['getMiniMapFootprints']() {
    const _0x3eaf6d = (this['adapted']?.['scene']?.['objects'] || [])['filter'](
      (_0x4dd0be) =>
        _0x4dd0be?.['visible'] !== ![] && ['prop', 'character', 'light']['includes'](_0x4dd0be?.['type']),
    );
    return _0x3eaf6d['map']((_0x269b71) => {
      const _0x2bc509 = this['importedInstanceByObjectId']['get'](_0x269b71['id']),
        _0x2a8317 =
          this['importedModelRoots']['get'](_0x269b71['id']) || this['lightRoots']['get'](_0x269b71['id']),
        _0x566756 =
          _0x269b71['type'] === 'character'
            ? this['bridge']['_mannequinMap']?.['get']?.(_0x269b71['id'])
            : this['bridge']['_cubeMap']?.['get']?.(_0x269b71['id']);
      let _0x2a4c2d = _0x2bc509
        ? collectInstanceTopViewFootprint(_0x2bc509, _0x269b71['id'])
        : collectObjectTopViewFootprint(_0x2a8317 || _0x566756?.['group']);
      if (_0x2a4c2d['length'] < 0x3) _0x2a4c2d = createFallbackTopViewFootprint(_0x269b71);
      return { objectId: _0x269b71['id'], objectType: _0x269b71['type'], points: _0x2a4c2d };
    });
  }
  ['pickGizmoHandle'](_0x310a0f, _0xd83d3d) {
    return this['bridge']['pickGizmoHandle']?.(_0x310a0f, _0xd83d3d) || null;
  }
  ['beginGizmoDrag']({ handleKey: _0x4f71cc, clientX: _0x5d16e1, clientY: _0x582e53 } = {}) {
    if (this['activeTool'] === 'rotate')
      return (
        this['bridge']['beginRotateGizmoDrag']?.({
          handleKey: _0x4f71cc,
          clientX: _0x5d16e1,
          clientY: _0x582e53,
        }) || null
      );
    if (this['activeTool'] === 'scale')
      return (
        this['bridge']['beginScaleGizmoDrag']?.({
          handleKey: _0x4f71cc,
          clientX: _0x5d16e1,
          clientY: _0x582e53,
        }) || null
      );
    return (
      this['bridge']['beginMoveGizmoDrag']?.({
        handleKey: _0x4f71cc,
        clientX: _0x5d16e1,
        clientY: _0x582e53,
      }) || null
    );
  }
  ['sampleGizmoDragPoint'](_0x51d27a, _0x3ec5f0, _0x2537f0) {
    return this['bridge']['sampleMoveGizmoDragPoint']?.(_0x51d27a, _0x3ec5f0, _0x2537f0) || null;
  }
  ['computeGizmoDragValue'](_0x22f1d8, _0x4a830f) {
    if (_0x22f1d8?.['mode'] === 'rotate')
      return this['bridge']['computeRotateGizmoAngle']?.(_0x22f1d8, _0x4a830f) ?? 0x0;
    if (String(_0x22f1d8?.['mode'] || '')['startsWith']('scale'))
      return this['bridge']['computeScaleGizmoFactor']?.(_0x22f1d8, _0x4a830f) ?? 0x1;
    return this['bridge']['computeMoveGizmoDelta']?.(_0x22f1d8, _0x4a830f) || null;
  }
  ['clearGizmoState']() {
    (this['bridge']['clearGizmoHandleState']?.(), this['bridge']['clearGizmoMoveGuideLine']?.());
  }
  ['setGizmoHoverHandle'](_0xf3332f) {
    this['bridge']['setGizmoHoverHandle']?.(_0xf3332f || null);
  }
  ['setGizmoActiveHandle'](_0x3b3700) {
    this['bridge']['setGizmoActiveHandle']?.(_0x3b3700 || null);
  }
  ['setGizmoMoveGuideLine'](_0x56ae5c) {
    if (_0x56ae5c) this['bridge']['setGizmoMoveGuideLine']?.(_0x56ae5c);
    else this['bridge']['clearGizmoMoveGuideLine']?.();
  }
  ['resize'](_0x1a1392, _0x3b0faf) {
    this['bridge']['resize']?.(_0x1a1392, _0x3b0faf);
    if (this['backgroundCameraLockApplied']) this['_syncBackgroundCameraLock']();
  }
  ['renderNow']() {
    this['bridge']['renderNow']?.();
  }
  ['setViewProjection'](_0x24b3a4 = 'perspective', _0x5857e6 = null) {
    const _0x2682d = _0x24b3a4 === 'orthographic' ? 'orthographic' : 'perspective',
      _0x2d5cb1 = _0x2682d === 'orthographic' && _0x5857e6 ? structuredClone(_0x5857e6) : null;
    return (
      (this['viewProjection'] = { type: _0x2682d, options: _0x2d5cb1 }),
      this['bridge']['setViewProjection']?.({ type: _0x2682d, ...(_0x2d5cb1 || {}) }),
      this['getViewProjection']()
    );
  }
  ['getViewProjection']() {
    return {
      type: this['viewProjection']['type'],
      options: this['viewProjection']['options'] ? structuredClone(this['viewProjection']['options']) : null,
    };
  }
  ['getSceneView']() {
    return this['adapted']?.['state']?.['viewport']?.['sceneView']
      ? structuredClone(this['adapted']['state']['viewport']['sceneView'])
      : null;
  }
  ['setViewportUIPatch'](_0x361398 = {}) {
    this['viewportUIPatch'] = { ...this['viewportUIPatch'], ..._0x361398 };
    if (!this['adapted']) return ![];
    return (
      (this['adapted']['state']['ui'] = { ...this['adapted']['state']['ui'], ...this['viewportUIPatch'] }),
      this['directorScene']['prepareMaterials'](),
      this['bridge']['sync'](this['adapted']['state']),
      this['_syncBackgroundCameraLock'](),
      this['_syncImportedModels'](),
      this['_syncSceneLights'](),
      this['_syncFlatBackground'](),
      this['directorScene']['sync'](),
      !![]
    );
  }
  ['previewSceneView'](_0x5c7fe7) {
    if (!_0x5c7fe7) return ![];
    return (
      this['bridge']['setDraftView']?.({
        kind: 'scene-default',
        sceneView: structuredClone(_0x5c7fe7),
        disableSmoothing: !![],
      }),
      !![]
    );
  }
  ['setViewportFocalLength'](_0x205a79) {
    if (!this['adapted']) return ![];
    const _0x444f08 = clampSceneFocalLength(_0x205a79);
    ((this['viewportFocalLengthOverride'] = _0x444f08),
      this['bridge']['setDefaultSceneFocalLength']?.(_0x444f08));
    const _0x5bd8e1 = this['getSceneView']();
    if (_0x5bd8e1) this['previewSceneView'](_0x5bd8e1);
    return !![];
  }
  ['getViewportFocalLength']() {
    if (!this['adapted']) return null;
    return clampSceneFocalLength(this['viewportFocalLengthOverride'] ?? this['adapted']['focalLength']);
  }
  ['getViewportFov']() {
    const _0x1053ad = this['getViewportFocalLength']();
    return _0x1053ad == null ? null : focalLengthToFov(_0x1053ad);
  }
  ['previewCamera'](_0x5b33eb) {
    if (!_0x5b33eb) return ![];
    const _0x57cdae = vectorFromArray(_0x5b33eb['position'], { x: 0x5, y: 0x4, z: 0x7 }),
      _0x2d593f = vectorFromArray(_0x5b33eb['target'], { x: 0x0, y: 1.2, z: 0x0 }),
      _0x1f534d = new threeRuntime['Vector3'](_0x57cdae['x'], _0x57cdae['y'], _0x57cdae['z']),
      _0x1f864c = new threeRuntime['Vector3'](_0x2d593f['x'], _0x2d593f['y'], _0x2d593f['z']),
      _0x22f4e8 = new threeRuntime['Matrix4']()['lookAt'](
        _0x1f534d,
        _0x1f864c,
        new threeRuntime['Vector3'](0x0, 0x1, 0x0),
      ),
      _0x201261 = new threeRuntime['Quaternion']()['setFromRotationMatrix'](_0x22f4e8)['normalize'](),
      _0x393639 = finiteNumber(_0x5b33eb['roll'], 0x0);
    Math['abs'](_0x393639) > 1e-8 &&
      _0x201261['multiply'](
        new threeRuntime['Quaternion']()['setFromAxisAngle'](
          new threeRuntime['Vector3'](0x0, 0x0, 0x1),
          _0x393639,
        ),
      )['normalize']();
    const _0x121339 = new threeRuntime['Euler']()['setFromQuaternion'](_0x201261, 'YXZ');
    return (
      this['bridge']['setDraftView']?.({
        kind: 'camera',
        position: { x: _0x1f534d['x'], y: _0x1f534d['y'], z: _0x1f534d['z'] },
        target: { x: _0x1f864c['x'], y: _0x1f864c['y'], z: _0x1f864c['z'] },
        quaternion: { x: _0x201261['x'], y: _0x201261['y'], z: _0x201261['z'], w: _0x201261['w'] },
        rotation: { x: _0x121339['x'], y: _0x121339['y'], z: _0x121339['z'] },
        fov: Number['isFinite'](Number(_0x5b33eb['fov']))
          ? Number(_0x5b33eb['fov'])
          : focalLengthToFov(_0x5b33eb['focalLength']),
        disableSmoothing: !![],
      }),
      !![]
    );
  }
  ['commitSceneView'](_0x56ced4) {
    if (!_0x56ced4 || !this['adapted']?.['scene']?.['id']) return ![];
    const _0x24608b = structuredClone(_0x56ced4);
    return (
      this['viewOverrides']['set'](this['adapted']['scene']['id'], _0x24608b),
      (this['adapted']['state']['viewport']['sceneView'] = structuredClone(_0x24608b)),
      this['directorScene']['prepareMaterials'](),
      this['bridge']['sync'](this['adapted']['state']),
      this['_syncBackgroundCameraLock'](),
      this['_syncImportedModels'](),
      this['_syncSceneLights'](),
      this['_syncFlatBackground'](),
      this['bridge']['clearDraftView']?.(),
      this['directorScene']['sync'](),
      !![]
    );
  }
  ['readCurrentCamera']() {
    return this['bridge']['readCurrentViewPose']?.() || null;
  }
  ['getDirectorViewport']() {
    return (this['directorViewport'] ||= new DirectorViewportRuntime(this['bridge']));
  }
  ['captureBlob'](_0x22af66) {
    return this['bridge']['captureBlob']?.(_0x22af66);
  }
  ['withCleanCaptureCanvas'](_0x411dc5) {
    return this['bridge']['_withCleanCaptureFrame'](() =>
      _0x411dc5(this['bridge']['renderer']['domElement']),
    );
  }
  async ['waitForCaptureReady']({ signal: _0x1f1e92, timeout: timeout = 0x7530 } = {}) {
    const _0x2a401b = Date['now']();
    while (!![]) {
      if (_0x1f1e92?.['aborted'] || this['disposed']) throw new DOMException('已取消录制', 'AbortError');
      const _0x30eec7 = [...(this['bridge']['_mannequinMap']?.['values']() || [])],
        _0x5b1bef = _0x30eec7['find']((_0x49284c) => _0x49284c['modelLoadError']);
      if (_0x5b1bef) throw new Error('人偶加载失败：' + _0x5b1bef['modelLoadError']['message']);
      const _0x456f03 = this['adapted']?.['scene']?.['background'],
        _0x181642 = Boolean(_0x456f03?.['imageUrl'] && !this['backgroundTexture']);
      if (this['directorScene']['error']) throw this['directorScene']['error'];
      if (
        _0x30eec7['every']((_0x4c6be2) => _0x4c6be2['modelRoot']) &&
        !_0x181642 &&
        !this['directorScene']['pending']
      )
        return;
      if (Date['now']() - _0x2a401b > timeout) throw new Error('场景资源加载超时，请检查模型与背景后重试。');
      await new Promise((_0x5270de) => globalThis['setTimeout'](_0x5270de, 0x32));
    }
  }
  ['getSnapshot']() {
    return this['adapted']
      ? {
          sceneId: this['adapted']['scene']['id'],
          activeShotId: this['adapted']['activeShot']?.['id'] || null,
          selectedObjectIds: this['adapted']['state']['selection']['selectedObjects']['map'](
            (_0x4c8741) => _0x4c8741['objectId'],
          ),
          activeTool: this['activeTool'],
          projection: this['getViewProjection'](),
          unsupportedObjectIds: [...this['adapted']['unsupportedObjectIds']],
        }
      : null;
  }
  ['dispose']() {
    if (this['disposed']) return;
    ((this['disposed'] = !![]),
      this['directorScene']['dispose'](),
      this['directorViewport']?.['disposeMonitor'](),
      this['_clearImportedModels'](),
      this['_clearSceneLights'](),
      (this['backgroundTextureToken'] += 0x1),
      this['backgroundTexture']?.['dispose']?.(),
      (this['backgroundTexture'] = null),
      this['_stopCharacterAnimation'](),
      this['viewOverrides']['clear'](),
      this['bridge']['dispose']?.(),
      (this['adapted'] = null),
      (this['project'] = null));
  }
}
export function createStoryboard3DSceneRuntime(_0x59ecc9) {
  return new Storyboard3DSceneRuntime(_0x59ecc9);
}
