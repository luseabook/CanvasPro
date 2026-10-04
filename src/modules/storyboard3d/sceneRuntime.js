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
function finiteNumber(value, item = 0x0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function vectorFromArray(index, box) {
  const result = Array['isArray'](index) ? index : [];
  return {
    x: finiteNumber(result[0x0], box['x']),
    y: finiteNumber(result[0x1], box['y']),
    z: finiteNumber(result[0x2], box['z']),
  };
}
function scaleFromArray(data) {
  const box2 = vectorFromArray(data, { x: 0x1, y: 0x1, z: 0x1 });
  return {
    x: Math['max'](0.001, box2['x']),
    y: Math['max'](0.001, box2['y']),
    z: Math['max'](0.001, box2['z']),
  };
}
function transformToBridgePose(box3) {
  return {
    position: vectorFromArray(box3?.['position'], { x: 0x0, y: 0x0, z: 0x0 }),
    rotation: vectorFromArray(box3?.['rotation'], { x: 0x0, y: 0x0, z: 0x0 }),
    scale: scaleFromArray(box3?.['scale']),
  };
}
function convexHullXZ(options) {
  const map = new Map();
  for (const box4 of options || []) {
    const x = finiteNumber(box4?.['x']),
      z = finiteNumber(box4?.['z']);
    map['set'](x['toFixed'](0x6) + ':' + z['toFixed'](0x6), {
      x: x,
      z: z,
    });
  }
  const list = [...map['values']()]['sort']((box5, box6) => box5['x'] - box6['x'] || box5['z'] - box6['z']);
  if (list['length'] <= 0x2) return list;
  const run = (box7, box8, box9) =>
      (box8['x'] - box7['x']) * (box9['z'] - box7['z']) - (box8['z'] - box7['z']) * (box9['x'] - box7['x']),
    list2 = [];
  for (const target of list) {
    while (list2['length'] >= 0x2 && run(list2['at'](-0x2), list2['at'](-0x1), target) <= 0x0) {
      list2['pop']();
    }
    list2['push'](target);
  }
  const list3 = [];
  for (let count = list['length'] - 0x1; count >= 0x0; count -= 0x1) {
    const source = list[count];
    while (list3['length'] >= 0x2 && run(list3['at'](-0x2), list3['at'](-0x1), source) <= 0x0) {
      list3['pop']();
    }
    list3['push'](source);
  }
  return (list2['pop'](), list3['pop'](), [...list2, ...list3]);
}
function collectGeometryTopViewPoints(enabled, enabled2) {
  if (!enabled || !enabled2) return [];
  const next = enabled['attributes']?.['position'];
  if (next?.['count'] > 0x0) {
    const list4 = [],
      count2 = Math['max'](0x1, Math['floor'](next['count'] / 0x180));
    for (let current = 0x0; current < next['count']; current += count2) {
      const x2 = new threeRuntime['Vector3']()
        ['fromBufferAttribute'](next, current)
        ['applyMatrix4'](enabled2);
      list4['push']({ x: x2['x'], z: x2['z'] });
    }
    const entry = next['count'] - 0x1;
    if (entry % count2 !== 0x0) {
      const x3 = new threeRuntime['Vector3']()['fromBufferAttribute'](next, entry)['applyMatrix4'](enabled2);
      list4['push']({ x: x3['x'], z: x3['z'] });
    }
    return list4;
  }
  enabled['computeBoundingBox']?.();
  const enabled3 = enabled['boundingBox'];
  if (!enabled3 || enabled3['isEmpty']?.()) return [];
  const list5 = [];
  for (const record of [enabled3['min']['x'], enabled3['max']['x']]) {
    for (const payload of [enabled3['min']['y'], enabled3['max']['y']]) {
      for (const handle of [enabled3['min']['z'], enabled3['max']['z']]) {
        const x4 = new threeRuntime['Vector3'](record, payload, handle)['applyMatrix4'](enabled2);
        list5['push']({ x: x4['x'], z: x4['z'] });
      }
    }
  }
  return list5;
}
function collectObjectTopViewFootprint(enabled4) {
  if (!enabled4 || enabled4['visible'] === ![] || typeof enabled4['traverse'] !== 'function') return [];
  enabled4['updateMatrixWorld']?.(!![]);
  const list6 = [];
  return (
    enabled4['traverse']((enabled5) => {
      if (!enabled5?.['isMesh'] || enabled5['visible'] === ![] || !enabled5['geometry']) return;
      (enabled5['updateWorldMatrix']?.(!![], ![]),
        list6['push'](...collectGeometryTopViewPoints(enabled5['geometry'], enabled5['matrixWorld'])));
    }),
    convexHullXZ(list6)
  );
}
function collectInstanceTopViewFootprint(state, config) {
  const count3 = state?.['objectIds']?.['indexOf']?.(config) ?? -0x1,
    enabled6 = state?.['mesh'];
  if (count3 < 0x0 || !enabled6?.['geometry'] || typeof enabled6['getMatrixAt'] !== 'function') return [];
  enabled6['updateMatrixWorld']?.(!![]);
  const scope = new threeRuntime['Matrix4']();
  enabled6['getMatrixAt'](count3, scope);
  const input = enabled6['matrixWorld']['clone']()['multiply'](scope);
  return convexHullXZ(collectGeometryTopViewPoints(enabled6['geometry'], input));
}
function createFallbackTopViewFootprint(output) {
  const box10 = output?.['transform'] || {},
    x5 = vectorFromArray(box10['position'], { x: 0x0, y: 0x0, z: 0x0 }),
    box11 = vectorFromArray(box10['rotation'], { x: 0x0, y: 0x0, z: 0x0 }),
    box12 = scaleFromArray(box10['scale']),
    value2 = output?.['type'] === 'character' ? 0.65 : output?.['type'] === 'light' ? 0.4 : 0x1,
    value3 = output?.['type'] === 'character' ? 0.45 : output?.['type'] === 'light' ? 0.4 : 0x1,
    value4 = Math['max'](0.08, (value2 * box12['x']) / 0x2),
    value5 = Math['max'](0.08, (value3 * box12['z']) / 0x2),
    value6 = Math['cos'](box11['y']),
    value7 = Math['sin'](box11['y']);
  return [
    [-value4, -value5],
    [value4, -value5],
    [value4, value5],
    [-value4, value5],
  ]['map'](([value8, value9]) => ({
    x: x5['x'] + value8 * value6 + value9 * value7,
    z: x5['z'] - value8 * value7 + value9 * value6,
  }));
}
function cameraToSceneView(event) {
  const x6 = vectorFromArray(event?.['position'], { x: 0x5, y: 0x4, z: 0x7 }),
    target2 = vectorFromArray(event?.['target'], { x: 0x0, y: 1.2, z: 0x0 }),
    box13 = {
      x: x6['x'] - target2['x'],
      y: x6['y'] - target2['y'],
      z: x6['z'] - target2['z'],
    },
    orbitDistance = Math['max'](0.25, Math['hypot'](box13['x'], box13['y'], box13['z']));
  return {
    target: target2,
    orbitYaw: Math['atan2'](box13['x'], box13['z']),
    orbitPitch: Math['asin'](Math['max'](-0x1, Math['min'](0x1, box13['y'] / orbitDistance))),
    orbitDistance: orbitDistance,
  };
}
function resolveScene(value10, value11) {
  const list7 = Array['isArray'](value10?.['scenes']) ? value10['scenes'] : [];
  return (
    list7['find']((value12) => value12['id'] === value11) ||
    list7['find']((value13) => value13['id'] === value10?.['activeSceneId']) ||
    list7[0x0] ||
    null
  );
}
function resolveActiveShot(value14) {
  const list8 = Array['isArray'](value14?.['shots']) ? value14['shots'] : [];
  return list8['find']((value15) => value15['id'] === value14?.['activeShotId']) || list8[0x0] || null;
}
function bridgeObjectType(value16) {
  const value17 = value16 && typeof value16 === 'object' ? value16 : null,
    value18 = value17?.['type'] || value16;
  if (value18 === 'prop') return 'cube';
  if (value18 === 'character') return 'mannequin';
  if (value18 === 'camera') return 'camera';
  if (value18 === 'light' && value17?.['lightType'] !== 'ambient') return 'cube';
  return null;
}
function disposeOwnedObject3D(value19) {
  value19?.['traverse']?.((value20) => {
    value20['geometry']?.['dispose']?.();
    const list9 = Array['isArray'](value20['material']) ? value20['material'] : [value20['material']];
    list9['filter'](Boolean)['forEach']((value21) => value21['dispose']?.());
  });
}
function createImportedModelNormalizationRoot(value22) {
  const storyboard3DModelNormalization = readStoryboard3DModelNormalization(value22),
    error = new threeRuntime['Group']();
  return (
    (error['name'] = 'storyboard3d-model-normalization'),
    storyboard3DModelNormalization &&
      (error['position']['set'](
        storyboard3DModelNormalization['translation']['x'],
        storyboard3DModelNormalization['translation']['y'],
        storyboard3DModelNormalization['translation']['z'],
      ),
      error['scale']['setScalar'](storyboard3DModelNormalization['uniformScale'])),
    error['add'](value22['clone'](!![])),
    error
  );
}
function applyImportedNormalizationToTemplate(enabled7, value23) {
  const storyboard3DModelNormalization2 = readStoryboard3DModelNormalization(value23);
  if (!enabled7 || !storyboard3DModelNormalization2) return enabled7;
  const value24 = new threeRuntime['Matrix4']()['compose'](
    new threeRuntime['Vector3'](
      storyboard3DModelNormalization2['translation']['x'],
      storyboard3DModelNormalization2['translation']['y'],
      storyboard3DModelNormalization2['translation']['z'],
    ),
    new threeRuntime['Quaternion'](),
    new threeRuntime['Vector3'](
      storyboard3DModelNormalization2['uniformScale'],
      storyboard3DModelNormalization2['uniformScale'],
      storyboard3DModelNormalization2['uniformScale'],
    ),
  );
  return (enabled7['sourceMatrix']['premultiply'](value24), enabled7);
}
function createSelection(value25, value26, value27) {
  const list10 = (Array['isArray'](value26) ? value26 : [])
      ['map']((value28) => String(value28 || '')['trim']())
      ['filter'](Boolean),
    map2 = new Map((value25?.['objects'] || [])['map']((value29) => [value29['id'], value29])),
    selectedObjects = list10['map']((value30) => map2['get'](value30))
      ['filter'](Boolean)
      ['filter']((value31) => value31['visible'] !== ![] && value31['locked'] !== !![])
      ['filter']((value32) => canStoryboard3DObjectUseTransformTool(value32, value27))
      ['map']((objectId) => ({ objectType: bridgeObjectType(objectId), objectId: objectId['id'] }))
      ['filter']((value33) => value33['objectType']),
    selectedObjectType = selectedObjects[selectedObjects['length'] - 0x1] || null;
  return {
    selectedObjectType: selectedObjectType?.['objectType'] || null,
    selectedObjectId: selectedObjectType?.['objectId'] || null,
    selectedObjectIds: selectedObjectType
      ? selectedObjects['filter']((value34) => value34['objectType'] === selectedObjectType['objectType'])[
          'map'
        ]((value35) => value35['objectId'])
      : [],
    selectedObjects: selectedObjects,
    selectedGroupId: null,
  };
}
function mapSceneObjects(value36) {
  const list11 = (Array['isArray'](value36?.['objects']) ? value36['objects'] : [])['filter'](
      (value37) => value37?.['visible'] !== ![],
    ),
    mannequins = [],
    cubes = [],
    cameras = [];
  return (
    list11['forEach']((id, slot) => {
      const position = transformToBridgePose(id['transform']);
      if (id['type'] === 'prop') {
        cubes['push']({
          id: id['id'],
          assetId: id['assetId'],
          colorKey: id['tint'] || undefined,
          ...position,
        });
        return;
      }
      if (id['type'] === 'light' && id['lightType'] !== 'ambient') {
        cubes['push']({ id: id['id'], colorKey: id['color'] || undefined, ...position });
        return;
      }
      if (id['type'] === 'character') {
        const bodyPresetId =
            id['bodyPresetId'] === 'female'
              ? 'adult-female'
              : id['bodyPresetId'] === 'male'
                ? 'adult-male'
                : id['bodyPresetId'],
          bodyPresetId2 = resolveStoryboard3DCharacterPose({ ...id, bodyPresetId: bodyPresetId }),
          args = Object['fromEntries'](
            Object['entries'](bodyPresetId2['boneOverrides'] || {})['map'](([value38, value39]) => [
              value38,
              quaternionToStoryboard3DEuler(value39),
            ]),
          );
        mannequins['push']({
          id: id['id'],
          bodyPresetId: bodyPresetId2['state']['bodyPresetId'],
          colorKey: id['colorKey'] || 'blue',
          characterStyle: id['characterStyle'] === 'anatomical' ? 'anatomical' : 'articulated',
          bodyProfile: bodyPresetId2['body'],
          gender: bodyPresetId2['body']?.['gender'] === 'female' ? 'female' : 'male',
          poseId: bodyPresetId2['action']?.['poseId'] || undefined,
          bonePose: {
            ...(bodyPresetId2['baseBones'] || {}),
            ...(bodyPresetId2['handRotations'] || {}),
            ...args,
          },
          ...position,
        });
        return;
      }
      id['type'] === 'camera' &&
        cameras['push']({
          id: id['id'],
          slot: slot + 0x1,
          name: id['name'],
          position: position['position'],
          rotation: position['rotation'],
          focalLength: id['focalLength'],
        });
    }),
    { mannequins: mannequins, cubes: cubes, cameras: cameras }
  );
}
export function adaptStoryboard3DSceneToDirectorState({
  project: project,
  sceneId: sceneId,
  selectedObjectIds: selectedObjectIds = [],
  activeTool: activeTool = 'select',
} = {}) {
  const environmentMode = resolveScene(project, sceneId);
  if (!environmentMode) return null;
  const activeShot = resolveActiveShot(environmentMode),
    transformTool = TRANSFORM_TOOLS['has'](activeTool) ? activeTool : 'move',
    args2 = mapSceneObjects(environmentMode),
    value40 = {
      version: 0x2,
      mode: 'scene',
      environmentMode: environmentMode['environment']?.['type'] === 'outdoor' ? 'day' : 'night',
      viewport: {
        activeView: 'default',
        activeCameraId: null,
        sceneView: cameraToSceneView(activeShot?.['camera']),
      },
      panorama: { imageUrl: null, isLoaded: ![] },
      ...args2,
      selection: createSelection(environmentMode, selectedObjectIds, activeTool),
      groups: [],
      ui: {
        mouseTool: 'navigate',
        transformTool: transformTool,
        activeTool: transformTool,
        transformSpace: 'world',
        snapEnabled: ![],
        groundLock: ![],
        uniformScale: ![],
        isEditing: !![],
        showOutline: environmentMode['environment']?.['showOutline'] !== ![],
      },
    },
    state2 = normalizePanoramaSceneState(value40);
  return {
    scene: environmentMode,
    activeShot: activeShot,
    state: state2,
    focalLength: finiteNumber(activeShot?.['camera']?.['focalLength'], 0x23),
    unsupportedObjectIds: (environmentMode['objects'] || [])
      ['filter']((value41) => !bridgeObjectType(value41) && !['camera', 'light']['includes'](value41['type']))
      ['map']((value42) => value42['id']),
  };
}
export class Storyboard3DSceneRuntime {
  constructor({
    container: container,
    bridgeFactory: bridgeFactory,
    importedModelResolver: importedModelResolver,
    onVisualChange: onVisualChange,
  } = {}) {
    if (!container) throw new TypeError('Storyboard3DSceneRuntime requires a container');
    const run2 =
      typeof bridgeFactory === 'function' ? bridgeFactory : (value43) => new PanoramaScene3DBridge(value43);
    ((this['bridge'] = run2({ container: container })),
      (this['directorScene'] = new DirectorSceneRuntime(this)));
    if (!this['bridge'] || typeof this['bridge']['sync'] !== 'function')
      throw new TypeError('Storyboard3DSceneRuntime requires a compatible scene bridge');
    ((this['project'] = null),
      (this['container'] = container),
      (this['importedModelResolver'] =
        typeof importedModelResolver === 'function' ? importedModelResolver : null),
      (this['onVisualChange'] = typeof onVisualChange === 'function' ? onVisualChange : null),
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
    project: project2,
    sceneId: sceneId2,
    selectedObjectIds: selectedObjectIds2,
    activeTool: activeTool2,
  } = {}) {
    if (this['disposed']) throw new Error('Storyboard3DSceneRuntime has been disposed');
    if (project2 !== undefined) this['project'] = project2;
    if (sceneId2 !== undefined) this['sceneId'] = sceneId2;
    if (selectedObjectIds2 !== undefined) this['selectedObjectIds'] = [...selectedObjectIds2];
    if (activeTool2 !== undefined) this['activeTool'] = activeTool2;
    const value44 = this['adapted']?.['scene']?.['id'] || null,
      value45 = this['adapted']?.['activeShot']?.['id'] || null;
    this['adapted'] = adaptStoryboard3DSceneToDirectorState({
      project: this['project'],
      sceneId: this['sceneId'],
      selectedObjectIds: this['selectedObjectIds'],
      activeTool: this['activeTool'],
    });
    if (!this['adapted']) return null;
    ((value44 && value44 !== this['adapted']['scene']['id']) ||
      (value45 && value45 !== this['adapted']['activeShot']?.['id'])) &&
      (this['viewportFocalLengthOverride'] = null);
    value44 === this['adapted']['scene']['id'] &&
      value45 &&
      value45 !== this['adapted']['activeShot']?.['id'] &&
      this['viewOverrides']['delete'](this['adapted']['scene']['id']);
    const value46 = this['viewOverrides']['get'](this['adapted']['scene']['id']);
    if (value46) this['adapted']['state']['viewport']['sceneView'] = structuredClone(value46);
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
  ['_notifyVisualChange'](value47) {
    if (['set-selection', 'set-active-tool']['includes'](value47)) this['directorScene']?.['sync']();
    this['onVisualChange']?.({ reason: String(value47 || 'visual-change') });
  }
  ['_applyImportedModelTransform'](box14, value48) {
    const box15 = transformToBridgePose(value48);
    (box14?.['position']?.['set']?.(box15['position']['x'], box15['position']['y'], box15['position']['z']),
      box14?.['rotation']?.['set']?.(box15['rotation']['x'], box15['rotation']['y'], box15['rotation']['z']),
      box14?.['scale']?.['set']?.(box15['scale']['x'], box15['scale']['y'], box15['scale']['z']),
      box14?.['updateMatrixWorld']?.(!![]));
  }
  ['_clearImportedModels']() {
    const list12 = new Set([
      ...this['importedModelRoots']['keys'](),
      ...this['importedInstanceByObjectId']['keys'](),
      ...this['importedModelVisuals']['keys'](),
    ]);
    list12['forEach']((value49) => {
      this['bridge']['clearObjectVisualOverride']?.('cube', value49);
    });
    for (const value50 of this['importedModelRoots']['values']()) {
      (this['bridge']['scene']?.['remove']?.(value50),
        (value50['userData']?.['storyboardOwnedMaterials'] || [])['forEach']((value51) =>
          value51?.['dispose']?.(),
        ));
    }
    (this['importedModelRoots']['clear'](), this['importedModelVisuals']['clear']());
    for (const value52 of this['importedInstanceBatches']['values']()) {
      (this['bridge']['scene']?.['remove']?.(value52['mesh']), disposeStoryboard3DInstanceBatch(value52));
    }
    (this['importedInstanceBatches']['clear'](), this['importedInstanceByObjectId']['clear']());
  }
  ['_clearSceneLights']() {
    for (const [value53, value54] of this['lightRoots']) {
      (this['bridge']['clearObjectVisualOverride']?.('cube', value53),
        this['bridge']['scene']?.['remove']?.(value54),
        disposeOwnedObject3D(value54));
    }
    this['lightRoots']['clear']();
  }
  ['_syncSceneLights']() {
    this['_clearSceneLights']();
    if (!this['bridge']['scene']) return;
    for (const enabled8 of this['adapted']?.['scene']?.['objects'] || []) {
      if (enabled8['type'] !== 'light' || enabled8['visible'] === ![]) continue;
      const color = enabled8['color'] || 0xffffff,
        value55 = Math['max'](0x0, Number(enabled8['intensity']) || 0x0);
      let event2;
      if (enabled8['lightType'] === 'ambient') event2 = new threeRuntime['AmbientLight'](color, value55);
      else {
        if (enabled8['lightType'] === 'point')
          event2 = new threeRuntime['PointLight'](
            color,
            value55,
            Number(enabled8['distance']) || 0x0,
            Number(enabled8['decay']) || 0x2,
          );
        else {
          if (enabled8['lightType'] === 'spot')
            event2 = new threeRuntime['SpotLight'](
              color,
              value55,
              Number(enabled8['distance']) || 0x0,
              Number(enabled8['angle']) || Math['PI'] / 0x6,
            );
          else event2 = new threeRuntime['DirectionalLight'](color, value55);
        }
      }
      event2['castShadow'] = enabled8['castShadow'] === !![];
      const group = new threeRuntime['Group']();
      ((group['name'] = 'storyboard3d-light-' + enabled8['id']),
        (group['userData']['storyboardObjectId'] = enabled8['id']),
        group['add'](event2));
      if (
        enabled8['lightType'] === 'directional' ||
        enabled8['lightType'] === 'spot' ||
        !enabled8['lightType']
      ) {
        const value56 = new threeRuntime['Object3D']();
        (value56['position']['set'](0x0, 0x0, -0x1), group['add'](value56), (event2['target'] = value56));
      }
      if (enabled8['lightType'] !== 'ambient') {
        const value57 = new threeRuntime['Mesh'](
          new threeRuntime['SphereGeometry'](0.12, 0xc, 0x8),
          new threeRuntime['MeshBasicMaterial']({ color: color }),
        );
        ((value57['userData']['storyboardObjectId'] = enabled8['id']), group['add'](value57));
      }
      (this['_applyImportedModelTransform'](group, enabled8['transform']),
        this['bridge']['scene']['add'](group),
        this['lightRoots']['set'](enabled8['id'], group));
      if (enabled8['lightType'] !== 'ambient') {
        this['bridge']['setObjectVisualOverride']?.('cube', enabled8['id'], { group: group });
        const value58 = this['bridge']['_cubeMap']?.['get']?.(enabled8['id']);
        if (value58?.['group']) value58['group']['visible'] = ![];
      }
    }
    this['bridge']['requestRender']?.();
  }
  ['_syncBackgroundCameraLock']() {
    const args3 = normalizeStoryboard3DBackgroundCalibration(this['adapted']?.['scene']?.['background']);
    if (args3['lockedCamera'] && args3['lockedCameraSnapshot']) {
      const box16 = this['bridge']['renderer']?.['getSize']?.(new threeRuntime['Vector2']()),
        value59 = Math['max'](
          0.1,
          Number(box16?.['x']) / Math['max'](0x1, Number(box16?.['y'])) ||
            args3['imageWidth'] / Math['max'](0x1, args3['imageHeight']) ||
            0x10 / 0x9,
        );
      return (
        this['previewCamera']({
          ...args3['lockedCameraSnapshot'],
          fov: computeStoryboard3DVerticalFov(args3['horizontalFov'], value59),
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
    const value60 = this['adapted']?.['scene']?.['background'],
      enabled9 = String(value60?.['imageUrl'] || '')['trim']();
    this['bridge']['setGroundFillVisible']?.(!enabled9);
    if (!enabled9) {
      this['backgroundTextureToken'] += 0x1;
      this['bridge']['scene']?.['background'] === this['backgroundTexture'] &&
        (this['bridge']['scene']['background'] = null);
      (this['backgroundTexture']?.['dispose']?.(),
        (this['backgroundTexture'] = null),
        (this['backgroundTextureUrl'] = ''));
      return;
    }
    const run3 = (value61) => {
      const value62 = Math['max'](0.1, Math['min'](0xa, Number(value60['imageScale']) || 0x1)),
        value63 = Math['max'](0x1, Number(this['adapted']?.['focalLength']) || 0x23),
        value64 = (0x2 * Math['atan'](0x24 / (0x2 * value63)) * 0xb4) / Math['PI'],
        box17 = this['bridge']['renderer']?.['getSize']?.(new threeRuntime['Vector2']()),
        value65 = Math['max'](
          0.1,
          Number(box17?.['x']) / Math['max'](0x1, Number(box17?.['y'])) || 0x10 / 0x9,
        ),
        value66 =
          (0x2 * Math['atan'](Math['tan']((value64 * Math['PI']) / 0x168) / value65) * 0xb4) / Math['PI'],
        value67 = value60['lockedCamera'] === !![] && value60['lockedCameraSnapshot'],
        value68 = Math['max'](
          0.01,
          Math['min'](
            0xa,
            value67
              ? 0x1 / value62
              : value64 / Math['max'](0x1, Number(value60['horizontalFov']) || 0x3c) / value62,
          ),
        ),
        value69 = Math['max'](
          0.01,
          Math['min'](
            0xa,
            value67
              ? 0x1 / value62
              : value66 / Math['max'](0x1, Number(value60['verticalFov']) || value66) / value62,
          ),
        ),
        value70 = Array['isArray'](value60['vanishingPoint']) ? value60['vanishingPoint'] : [0.5, 0.5],
        value71 = Array['isArray'](value60['imageOffset']) ? value60['imageOffset'] : [0x0, 0x0];
      (value61['repeat']?.['set']?.(value68, value69),
        value61['offset']?.['set']?.(
          0.5 -
            value68 / 0x2 +
            (Number(value71[0x0]) || 0x0) +
            (value67 ? 0x0 : 0.5 - (Number(value70[0x0]) || 0.5)),
          0.5 -
            value69 / 0x2 +
            (Number(value71[0x1]) || 0x0) +
            (value67 ? 0x0 : 0.5 - (Number(value60['horizonY']) || 0.5)),
        ),
        (value61['needsUpdate'] = !![]),
        (this['bridge']['scene']['background'] = value61),
        this['bridge']['requestRender']?.());
    };
    if (enabled9 === this['backgroundTextureUrl'] && this['backgroundTexture']) {
      run3(this['backgroundTexture']);
      return;
    }
    const value72 = ++this['backgroundTextureToken'],
      value73 = new threeRuntime['TextureLoader']();
    (value73['setCrossOrigin']?.('anonymous'),
      value73['load'](
        enabled9,
        (background) => {
          void applyStoryboard3DTexturePolicy(
            { background: background },
            { renderer: this['bridge']['renderer'] },
          )
            ['catch'](() => null)
            ['then'](() => {
              if (value72 !== this['backgroundTextureToken'] || this['disposed']) {
                background['dispose']?.();
                return;
              }
              (this['backgroundTexture']?.['dispose']?.(),
                (this['backgroundTexture'] = background),
                (this['backgroundTextureUrl'] = enabled9),
                run3(background));
            });
        },
        undefined,
        () => {
          value72 === this['backgroundTextureToken'] &&
            ((this['backgroundTextureUrl'] = ''), this['bridge']['setGroundFillVisible']?.(!![]));
        },
      ));
  }
  ['_stopCharacterAnimation']() {
    this['characterAnimationFrame'] != null &&
      (globalThis['cancelAnimationFrame']?.(this['characterAnimationFrame']),
      (this['characterAnimationFrame'] = null));
    for (const value74 of this['adapted']?.['scene']?.['objects'] || []) {
      if (value74['type'] === 'character') this['bridge']['clearDraftMannequinBonePose']?.(value74['id']);
    }
  }
  ['_syncCharacterAnimation']() {
    this['_stopCharacterAnimation']();
    if (this['timelinePreviewActive']) return;
    const list13 = (this['adapted']?.['scene']?.['objects'] || [])['filter'](
      (value75) => value75['type'] === 'character' && value75['actionPlaying'] === !![],
    );
    if (list13['length'] === 0x0 || typeof globalThis['requestAnimationFrame'] !== 'function') return;
    const value76 = globalThis['performance']?.['now']?.() || Date['now'](),
      value77 = (value78) => {
        if (this['disposed']) return;
        const value79 = Math['max'](0x0, ((Number(value78) || Date['now']()) - value76) / 0x3e8);
        for (const args4 of list13) {
          const storyboard3DCharacterPose = resolveStoryboard3DCharacterPose({
              ...args4,
              actionTime: (Number(args4['actionTime']) || 0x0) + value79,
            }),
            args5 = Object['fromEntries'](
              Object['entries'](storyboard3DCharacterPose['boneOverrides'] || {})['map'](
                ([value80, value81]) => [value80, quaternionToStoryboard3DEuler(value81)],
              ),
            );
          this['bridge']['setDraftMannequinBonePose']?.(args4['id'], {
            ...(storyboard3DCharacterPose['baseBones'] || {}),
            ...(storyboard3DCharacterPose['handRotations'] || {}),
            ...args5,
          });
        }
        (this['bridge']['requestRender']?.(),
          (this['characterAnimationFrame'] = globalThis['requestAnimationFrame'](value77)));
      };
    this['characterAnimationFrame'] = globalThis['requestAnimationFrame'](value77);
  }
  ['_syncImportedModels']() {
    this['_clearImportedModels']();
    if (!this['importedModelResolver'] || !this['bridge']['scene']) return;
    const list14 = (this['adapted']?.['scene']?.['objects'] || [])['filter'](
        (value82) => value82['type'] === 'prop' && value82['visible'] !== ![],
      ),
      map3 = new Map();
    list14['forEach']((value83) => {
      const value84 = [
        value83['assetId'],
        value83['tint'] || '',
        value83['castShadow'] !== ![] ? 'cast' : 'no-cast',
        value83['receiveShadow'] !== ![] ? 'receive' : 'no-receive',
      ]['join']('|');
      if (!map3['has'](value84)) map3['set'](value84, []);
      map3['get'](value84)['push'](value83);
    });
    const map4 = new Set();
    for (const [value85, objects] of map3) {
      if (objects['length'] < STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT) continue;
      const value86 = this['importedModelResolver'](objects[0x0]['assetId']),
        template = applyImportedNormalizationToTemplate(findStoryboard3DInstancingTemplate(value86), value86);
      if (!template) continue;
      const storyboard3DInstanceBatch = createStoryboard3DInstanceBatch({
        template: template,
        objects: objects,
        tint: objects[0x0]['tint'] || '',
        castShadow: objects[0x0]['castShadow'] !== ![],
        receiveShadow: objects[0x0]['receiveShadow'] !== ![],
      });
      ((storyboard3DInstanceBatch['mesh']['name'] = 'storyboard3d-instances-' + objects[0x0]['assetId']),
        this['bridge']['scene']['add'](storyboard3DInstanceBatch['mesh']),
        this['importedInstanceBatches']['set'](value85, storyboard3DInstanceBatch),
        objects['forEach']((value87) => {
          (map4['add'](value87['id']),
            this['importedInstanceByObjectId']['set'](value87['id'], storyboard3DInstanceBatch),
            this['_syncImportedInstanceVisual'](value87, storyboard3DInstanceBatch, value87['transform']));
          const value88 = this['bridge']['_cubeMap']?.['get']?.(value87['id']);
          if (value88?.['group']) value88['group']['visible'] = ![];
        }));
    }
    for (const storyboardObjectId of list14) {
      if (map4['has'](storyboardObjectId['id'])) continue;
      const enabled10 = this['importedModelResolver'](storyboardObjectId['assetId']);
      if (!enabled10?.['clone']) continue;
      const group2 = new threeRuntime['Group']();
      ((group2['name'] = 'storyboard3d-imported-' + storyboardObjectId['id']),
        (group2['userData'] = {
          ...(group2['userData'] || {}),
          storyboardObjectId: storyboardObjectId['id'],
        }),
        group2['add'](createImportedModelNormalizationRoot(enabled10)));
      const list15 = [];
      (group2['traverse']?.((enabled11) => {
        if (!enabled11?.['isMesh']) return;
        ((enabled11['castShadow'] = storyboardObjectId['castShadow'] !== ![]),
          (enabled11['receiveShadow'] = storyboardObjectId['receiveShadow'] !== ![]));
        if (!storyboardObjectId['tint'] || !enabled11['material']) return;
        const list16 = Array['isArray'](enabled11['material'])
            ? enabled11['material']
            : [enabled11['material']],
          value89 = list16['map']((value90) => {
            const value91 = value90?.['clone']?.() || value90;
            if (value91 !== value90) list15['push'](value91);
            return (value91?.['color']?.['set']?.(storyboardObjectId['tint']), value91);
          });
        enabled11['material'] = Array['isArray'](enabled11['material']) ? value89 : value89[0x0];
      }),
        (group2['userData']['storyboardOwnedMaterials'] = list15),
        this['_applyImportedModelTransform'](group2, storyboardObjectId['transform']),
        this['bridge']['scene']['add'](group2),
        this['importedModelRoots']['set'](storyboardObjectId['id'], group2),
        this['bridge']['setObjectVisualOverride']?.('cube', storyboardObjectId['id'], { group: group2 }));
      const value92 = this['bridge']['_cubeMap']?.['get']?.(storyboardObjectId['id']);
      if (value92?.['group']) value92['group']['visible'] = ![];
    }
    this['bridge']['requestRender']?.();
  }
  ['_syncImportedInstanceVisual'](enabled12, enabled13, value93) {
    const enabled14 = enabled13?.['mesh']?.['geometry'];
    if (!enabled12?.['id'] || !enabled14 || !enabled13?.['mesh']?.['getMatrixAt']) return;
    enabled14['computeBoundingBox']?.();
    if (!enabled14['boundingBox'] || enabled14['boundingBox']['isEmpty']()) return;
    let enabled15 = this['importedModelVisuals']['get'](enabled12['id']);
    !enabled15 &&
      ((enabled15 = { group: new threeRuntime['Group'](), boundsBox: new threeRuntime['Box3']() }),
      this['importedModelVisuals']['set'](enabled12['id'], enabled15));
    this['_applyImportedModelTransform'](enabled15['group'], value93);
    const count4 = enabled13['objectIds']['indexOf'](enabled12['id']);
    if (count4 < 0x0) return;
    const value94 = new threeRuntime['Matrix4']();
    (enabled13['mesh']['getMatrixAt'](count4, value94), enabled13['mesh']['updateMatrixWorld']?.(!![]));
    const value95 = enabled13['mesh']['matrixWorld']['clone']()['multiply'](value94);
    (enabled15['boundsBox']['copy'](enabled14['boundingBox'])['applyMatrix4'](value95),
      this['bridge']['setObjectVisualOverride']?.('cube', enabled12['id'], enabled15));
  }
  ['_pickImportedModel'](value96, value97) {
    if (
      this['importedModelRoots']['size'] === 0x0 &&
      this['importedInstanceBatches']['size'] === 0x0 &&
      this['lightRoots']['size'] === 0x0
    )
      return null;
    if (!this['bridge']['camera']) return null;
    const box18 =
      this['bridge']['renderer']?.['domElement']?.['getBoundingClientRect']?.() ||
      this['container']?.['getBoundingClientRect']?.();
    if (!box18?.['width'] || !box18?.['height']) return null;
    const value98 = new threeRuntime['Raycaster']();
    value98['setFromCamera'](
      {
        x: ((value96 - box18['left']) / box18['width']) * 0x2 - 0x1,
        y: -((value97 - box18['top']) / box18['height']) * 0x2 + 0x1,
      },
      this['bridge']['camera'],
    );
    let objectId2 = null;
    for (const [objectId3, value99] of [...this['importedModelRoots'], ...this['lightRoots']]) {
      const args6 = value98['intersectObject'](value99, !![])[0x0];
      if (args6 && (!objectId2 || args6['distance'] < objectId2['distance']))
        objectId2 = { ...args6, objectId: objectId3 };
    }
    for (const value100 of this['importedInstanceBatches']['values']()) {
      const args7 = value98['intersectObject'](value100['mesh'], ![])[0x0],
        objectId4 = Number['isInteger'](args7?.['instanceId'])
          ? value100['objectIds'][args7['instanceId']]
          : null;
      objectId4 &&
        (!objectId2 || args7['distance'] < objectId2['distance']) &&
        (objectId2 = { ...args7, objectId: objectId4 });
    }
    return objectId2
      ? {
          objectType: 'cube',
          objectId: objectId2['objectId'],
          point: objectId2['point'],
          distance: objectId2['distance'],
        }
      : null;
  }
  ['_syncInteractionState'](value101) {
    if (!this['adapted']) return this['sync']();
    const transformTool2 = TRANSFORM_TOOLS['has'](this['activeTool']) ? this['activeTool'] : 'move';
    return (
      (this['adapted'] = {
        ...this['adapted'],
        state: {
          ...this['adapted']['state'],
          selection: createSelection(this['adapted']['scene'], this['selectedObjectIds'], this['activeTool']),
          ui: {
            ...this['adapted']['state']['ui'],
            transformTool: transformTool2,
            activeTool: transformTool2,
          },
        },
      }),
      this['directorScene']['prepareMaterials'](),
      this['bridge']['sync'](this['adapted']['state']),
      this['_notifyVisualChange'](value101),
      this['getSnapshot']()
    );
  }
  ['setSelection'](args8) {
    return (
      (this['selectedObjectIds'] = Array['isArray'](args8) ? [...args8] : []),
      this['_syncInteractionState']('set-selection')
    );
  }
  ['setActiveTool'](value102) {
    return ((this['activeTool'] = value102), this['_syncInteractionState']('set-active-tool'));
  }
  ['pick'](value103, value104) {
    const value105 = this['_pickImportedModel'](value103, value104),
      value106 = this['bridge']['pick']?.(value103, value104) || null,
      value107 =
        value106?.['point'] && this['bridge']['camera']?.['position']
          ? this['bridge']['camera']['position']['distanceTo']?.(value106['point'])
          : Number['POSITIVE_INFINITY'],
      args9 = value105 && value105['distance'] <= value107 ? value105 : value106 || value105;
    if (!args9) return null;
    const storyboardObjectId2 = this['adapted']?.['scene']?.['objects']?.['find'](
      (value108) => value108['id'] === args9['objectId'],
    );
    if (
      !storyboardObjectId2 ||
      storyboardObjectId2['visible'] === ![] ||
      storyboardObjectId2['locked'] === !![]
    )
      return null;
    return {
      ...args9,
      storyboardObjectId: storyboardObjectId2['id'],
      storyboardObjectType: storyboardObjectId2['type'],
    };
  }
  ['pickObjectsInRect'](value109) {
    const list17 = this['bridge']['pickObjectsInRect']?.(value109) || [],
      map5 = new Set(
        (this['adapted']?.['scene']?.['objects'] || [])
          ['filter']((value110) => value110['visible'] !== ![] && value110['locked'] !== !![])
          ['map']((value111) => value111['id']),
      );
    return list17['filter']((value112) => map5['has'](value112['objectId']));
  }
  ['resolveDollyAnchor'](value113, value114) {
    return this['bridge']['resolveDollyAnchor']?.(value113, value114) || null;
  }
  ['resolveGroundPosition'](value115, value116, value117 = 0x0) {
    const enabled16 = this['bridge']['camera'],
      box19 =
        this['bridge']['renderer']?.['domElement']?.['getBoundingClientRect']?.() ||
        this['container']?.['getBoundingClientRect']?.();
    if (!enabled16 || !box19?.['width'] || !box19?.['height']) return null;
    enabled16['updateMatrixWorld']?.();
    const enabled17 = new threeRuntime['Raycaster']();
    enabled17['setFromCamera'](
      {
        x: ((finiteNumber(value115) - box19['left']) / box19['width']) * 0x2 - 0x1,
        y: -((finiteNumber(value116) - box19['top']) / box19['height']) * 0x2 + 0x1,
      },
      enabled16,
    );
    const box20 = new threeRuntime['Vector3'](),
      value118 = new threeRuntime['Plane'](
        new threeRuntime['Vector3'](0x0, 0x1, 0x0),
        -finiteNumber(value117),
      );
    if (!enabled17['ray']['intersectPlane'](value118, box20)) return null;
    if (box20['distanceTo'](enabled16['position']) > 0x2710) return null;
    return [box20['x'], finiteNumber(value117), box20['z']];
  }
  ['resolveViewportGroundPosition'](value119 = 0x0) {
    const box21 =
      this['bridge']['renderer']?.['domElement']?.['getBoundingClientRect']?.() ||
      this['container']?.['getBoundingClientRect']?.();
    if (!box21?.['width'] || !box21?.['height']) return null;
    return this['resolveGroundPosition'](
      box21['left'] + box21['width'] / 0x2,
      box21['top'] + box21['height'] / 0x2,
      value119,
    );
  }
  ['resolveObjectGroundPosition'](value120) {
    const enabled18 = this['adapted']?.['scene']?.['objects']?.['find'](
      (value121) => value121['id'] === value120,
    );
    if (!enabled18 || !getStoryboard3DObjectTransformCapabilities(enabled18)['groundSnap']) return null;
    const enabled19 = this['importedModelVisuals']['get'](enabled18['id']),
      value122 = this['importedModelRoots']['get'](enabled18['id']),
      value123 =
        enabled18['type'] === 'character'
          ? this['bridge']['_mannequinMap']?.['get']?.(enabled18['id'])
          : this['bridge']['_cubeMap']?.['get']?.(enabled18['id']);
    let enabled20 =
      enabled19?.['boundsBox']?.['isBox3'] && !enabled19['boundsBox']['isEmpty']()
        ? enabled19['boundsBox']['clone']()
        : null;
    const value124 = value122 || value123?.['proxyRoot'] || value123?.['group'];
    if (!enabled20 && value124) {
      value124['updateMatrixWorld']?.(!![]);
      const enabled21 = new threeRuntime['Box3']()['setFromObject'](value124);
      if (!enabled21['isEmpty']()) enabled20 = enabled21;
    }
    if (!enabled20 || !Number['isFinite'](enabled20['min']['y'])) return null;
    const finiteNumber2 = finiteNumber(enabled18['transform']?.['position']?.[0x1]);
    return finiteNumber2 - enabled20['min']['y'];
  }
  ['resolveObjectGroundPositions'](value125) {
    return Object['fromEntries'](
      (Array['isArray'](value125) ? value125 : [])
        ['map']((value126) => [value126, this['resolveObjectGroundPosition'](value126)])
        ['filter'](([, value127]) => Number['isFinite'](value127)),
    );
  }
  ['previewObjectTransform'](value128, value129) {
    return this['previewObjectTransforms']({ [value128]: value129 });
  }
  ['previewTimelineSample'](args10) {
    if (!args10) return ![];
    if (!this['timelinePreviewActive']) this['_stopCharacterAnimation']();
    this['timelinePreviewActive'] = !![];
    if (args10['camera']) this['previewCamera'](args10['camera']);
    const map6 = new Set(Object['keys'](args10['objectTransforms'] || {}));
    for (const value130 of this['timelinePreviewObjectIds']) {
      if (!map6['has'](value130)) this['clearObjectTransformPreview'](value130);
    }
    ((this['timelinePreviewObjectIds'] = map6),
      this['previewObjectTransforms'](args10['objectTransforms'] || {}, { includeLocked: !![] }));
    for (const args11 of this['adapted']?.['scene']?.['objects'] || []) {
      if (args11['type'] !== 'character') continue;
      const args12 = resolveStoryboard3DCharacterPose({
        ...args11,
        ...args10['characterActions']?.[args11['id']],
      });
      this['bridge']['setDraftMannequinBonePose']?.(args11['id'], {
        ...args12['baseBones'],
        ...args12['handRotations'],
        ...Object['fromEntries'](
          Object['entries'](args12['boneOverrides'] || {})['map'](([value131, value132]) => [
            value131,
            quaternionToStoryboard3DEuler(value132),
          ]),
        ),
      });
    }
    return (this['bridge']['requestRender']?.(), !![]);
  }
  ['previewObjectTransforms'](options2 = {}, { includeLocked: includeLocked = ![] } = {}) {
    const list18 = new Set();
    let value133 = ![];
    (Object['entries'](options2)['forEach'](([value134, value135]) => {
      const value136 = this['adapted']?.['scene']?.['objects']?.['find'](
          (value137) => value137['id'] === value134,
        ),
        bridgeObjectType2 = bridgeObjectType(value136),
        enabled22 =
          this['importedModelRoots']['get'](value136?.['id']) || this['lightRoots']['get'](value136?.['id']),
        enabled23 = this['importedInstanceByObjectId']['get'](value136?.['id']);
      if (
        (!bridgeObjectType2 && !enabled22 && !enabled23) ||
        (!includeLocked && value136?.['locked'] === !![])
      )
        return;
      if (bridgeObjectType2)
        this['bridge']['setDraftObjectTransform']?.(
          bridgeObjectType2,
          value136['id'],
          transformToBridgePose(value135),
        );
      if (enabled22) this['_applyImportedModelTransform'](enabled22, value135);
      (enabled23 &&
        (updateStoryboard3DInstanceTransform(enabled23, value136['id'], value135, { recomputeBounds: ![] }),
        list18['add'](enabled23),
        this['_syncImportedInstanceVisual'](value136, enabled23, value135)),
        (value133 = !![]));
    }),
      list18['forEach']((value138) => refreshStoryboard3DInstanceBatchBounds(value138)));
    if (value133) this['_notifyVisualChange']('preview-object-transform');
    return value133;
  }
  ['clearObjectTransformPreview'](value139) {
    const value140 = this['adapted']?.['scene']?.['objects']?.['find'](
        (value141) => value141['id'] === value139,
      ),
      bridgeObjectType3 = bridgeObjectType(value140),
      enabled24 =
        this['importedModelRoots']['get'](value140?.['id']) || this['lightRoots']['get'](value140?.['id']),
      enabled25 = this['importedInstanceByObjectId']['get'](value140?.['id']);
    if (!bridgeObjectType3 && !enabled24 && !enabled25) return ![];
    if (bridgeObjectType3) this['bridge']['clearDraftObjectTransform']?.(bridgeObjectType3, value140['id']);
    if (enabled24) this['_applyImportedModelTransform'](enabled24, value140['transform']);
    return (
      enabled25 &&
        (updateStoryboard3DInstanceTransform(enabled25, value140['id'], value140['transform']),
        this['_syncImportedInstanceVisual'](value140, enabled25, value140['transform'])),
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
    const list19 = new Set();
    for (const value142 of this['adapted']?.['scene']?.['objects'] || []) {
      const value143 = this['importedModelRoots']['get'](value142['id']);
      if (value143) this['_applyImportedModelTransform'](value143, value142['transform']);
      const value144 = this['lightRoots']['get'](value142['id']);
      if (value144) this['_applyImportedModelTransform'](value144, value142['transform']);
      const value145 = this['importedInstanceByObjectId']['get'](value142['id']);
      value145 &&
        (updateStoryboard3DInstanceTransform(value145, value142['id'], value142['transform'], {
          recomputeBounds: ![],
        }),
        list19['add'](value145),
        this['_syncImportedInstanceVisual'](value142, value145, value142['transform']));
    }
    (list19['forEach']((value146) => refreshStoryboard3DInstanceBatchBounds(value146)),
      this['_notifyVisualChange']('clear-previews'));
  }
  ['getMiniMapFootprints']() {
    const list20 = (this['adapted']?.['scene']?.['objects'] || [])['filter'](
      (value147) =>
        value147?.['visible'] !== ![] && ['prop', 'character', 'light']['includes'](value147?.['type']),
    );
    return list20['map']((objectId5) => {
      const value148 = this['importedInstanceByObjectId']['get'](objectId5['id']),
        value149 =
          this['importedModelRoots']['get'](objectId5['id']) || this['lightRoots']['get'](objectId5['id']),
        value150 =
          objectId5['type'] === 'character'
            ? this['bridge']['_mannequinMap']?.['get']?.(objectId5['id'])
            : this['bridge']['_cubeMap']?.['get']?.(objectId5['id']);
      let points = value148
        ? collectInstanceTopViewFootprint(value148, objectId5['id'])
        : collectObjectTopViewFootprint(value149 || value150?.['group']);
      if (points['length'] < 0x3) points = createFallbackTopViewFootprint(objectId5);
      return { objectId: objectId5['id'], objectType: objectId5['type'], points: points };
    });
  }
  ['pickGizmoHandle'](value151, value152) {
    return this['bridge']['pickGizmoHandle']?.(value151, value152) || null;
  }
  ['beginGizmoDrag']({ handleKey: handleKey, clientX: clientX, clientY: clientY } = {}) {
    if (this['activeTool'] === 'rotate')
      return (
        this['bridge']['beginRotateGizmoDrag']?.({
          handleKey: handleKey,
          clientX: clientX,
          clientY: clientY,
        }) || null
      );
    if (this['activeTool'] === 'scale')
      return (
        this['bridge']['beginScaleGizmoDrag']?.({
          handleKey: handleKey,
          clientX: clientX,
          clientY: clientY,
        }) || null
      );
    return (
      this['bridge']['beginMoveGizmoDrag']?.({
        handleKey: handleKey,
        clientX: clientX,
        clientY: clientY,
      }) || null
    );
  }
  ['sampleGizmoDragPoint'](value153, value154, value155) {
    return this['bridge']['sampleMoveGizmoDragPoint']?.(value153, value154, value155) || null;
  }
  ['computeGizmoDragValue'](value156, value157) {
    if (value156?.['mode'] === 'rotate')
      return this['bridge']['computeRotateGizmoAngle']?.(value156, value157) ?? 0x0;
    if (String(value156?.['mode'] || '')['startsWith']('scale'))
      return this['bridge']['computeScaleGizmoFactor']?.(value156, value157) ?? 0x1;
    return this['bridge']['computeMoveGizmoDelta']?.(value156, value157) || null;
  }
  ['clearGizmoState']() {
    (this['bridge']['clearGizmoHandleState']?.(), this['bridge']['clearGizmoMoveGuideLine']?.());
  }
  ['setGizmoHoverHandle'](value158) {
    this['bridge']['setGizmoHoverHandle']?.(value158 || null);
  }
  ['setGizmoActiveHandle'](value159) {
    this['bridge']['setGizmoActiveHandle']?.(value159 || null);
  }
  ['setGizmoMoveGuideLine'](value160) {
    if (value160) this['bridge']['setGizmoMoveGuideLine']?.(value160);
    else this['bridge']['clearGizmoMoveGuideLine']?.();
  }
  ['resize'](value161, value162) {
    this['bridge']['resize']?.(value161, value162);
    if (this['backgroundCameraLockApplied']) this['_syncBackgroundCameraLock']();
  }
  ['renderNow']() {
    this['bridge']['renderNow']?.();
  }
  ['setViewProjection'](value163 = 'perspective', value164 = null) {
    const type = value163 === 'orthographic' ? 'orthographic' : 'perspective',
      options3 = type === 'orthographic' && value164 ? structuredClone(value164) : null;
    return (
      (this['viewProjection'] = { type: type, options: options3 }),
      this['bridge']['setViewProjection']?.({ type: type, ...(options3 || {}) }),
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
  ['setViewportUIPatch'](args13 = {}) {
    this['viewportUIPatch'] = { ...this['viewportUIPatch'], ...args13 };
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
  ['previewSceneView'](enabled26) {
    if (!enabled26) return ![];
    return (
      this['bridge']['setDraftView']?.({
        kind: 'scene-default',
        sceneView: structuredClone(enabled26),
        disableSmoothing: !![],
      }),
      !![]
    );
  }
  ['setViewportFocalLength'](value165) {
    if (!this['adapted']) return ![];
    const clampSceneFocalLength2 = clampSceneFocalLength(value165);
    ((this['viewportFocalLengthOverride'] = clampSceneFocalLength2),
      this['bridge']['setDefaultSceneFocalLength']?.(clampSceneFocalLength2));
    const value166 = this['getSceneView']();
    if (value166) this['previewSceneView'](value166);
    return !![];
  }
  ['getViewportFocalLength']() {
    if (!this['adapted']) return null;
    return clampSceneFocalLength(this['viewportFocalLengthOverride'] ?? this['adapted']['focalLength']);
  }
  ['getViewportFov']() {
    const value167 = this['getViewportFocalLength']();
    return value167 == null ? null : focalLengthToFov(value167);
  }
  ['previewCamera'](event3) {
    if (!event3) return ![];
    const box22 = vectorFromArray(event3['position'], { x: 0x5, y: 0x4, z: 0x7 }),
      box23 = vectorFromArray(event3['target'], { x: 0x0, y: 1.2, z: 0x0 }),
      x7 = new threeRuntime['Vector3'](box22['x'], box22['y'], box22['z']),
      x8 = new threeRuntime['Vector3'](box23['x'], box23['y'], box23['z']),
      value168 = new threeRuntime['Matrix4']()['lookAt'](x7, x8, new threeRuntime['Vector3'](0x0, 0x1, 0x0)),
      x9 = new threeRuntime['Quaternion']()['setFromRotationMatrix'](value168)['normalize'](),
      finiteNumber3 = finiteNumber(event3['roll'], 0x0);
    Math['abs'](finiteNumber3) > 1e-8 &&
      x9['multiply'](
        new threeRuntime['Quaternion']()['setFromAxisAngle'](
          new threeRuntime['Vector3'](0x0, 0x0, 0x1),
          finiteNumber3,
        ),
      )['normalize']();
    const x10 = new threeRuntime['Euler']()['setFromQuaternion'](x9, 'YXZ');
    return (
      this['bridge']['setDraftView']?.({
        kind: 'camera',
        position: { x: x7['x'], y: x7['y'], z: x7['z'] },
        target: { x: x8['x'], y: x8['y'], z: x8['z'] },
        quaternion: { x: x9['x'], y: x9['y'], z: x9['z'], w: x9['w'] },
        rotation: { x: x10['x'], y: x10['y'], z: x10['z'] },
        fov: Number['isFinite'](Number(event3['fov']))
          ? Number(event3['fov'])
          : focalLengthToFov(event3['focalLength']),
        disableSmoothing: !![],
      }),
      !![]
    );
  }
  ['commitSceneView'](enabled27) {
    if (!enabled27 || !this['adapted']?.['scene']?.['id']) return ![];
    const structuredClone2 = structuredClone(enabled27);
    return (
      this['viewOverrides']['set'](this['adapted']['scene']['id'], structuredClone2),
      (this['adapted']['state']['viewport']['sceneView'] = structuredClone(structuredClone2)),
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
  ['captureBlob'](value169) {
    return this['bridge']['captureBlob']?.(value169);
  }
  ['withCleanCaptureCanvas'](handler) {
    return this['bridge']['_withCleanCaptureFrame'](() => handler(this['bridge']['renderer']['domElement']));
  }
  async ['waitForCaptureReady']({ signal: signal, timeout: timeout = 0x7530 } = {}) {
    const value170 = Date['now']();
    while (!![]) {
      if (signal?.['aborted'] || this['disposed']) throw new DOMException('已取消录制', 'AbortError');
      const list21 = [...(this['bridge']['_mannequinMap']?.['values']() || [])],
        value171 = list21['find']((value172) => value172['modelLoadError']);
      if (value171) throw new Error('人偶加载失败：' + value171['modelLoadError']['message']);
      const value173 = this['adapted']?.['scene']?.['background'],
        enabled28 = Boolean(value173?.['imageUrl'] && !this['backgroundTexture']);
      if (this['directorScene']['error']) throw this['directorScene']['error'];
      if (
        list21['every']((value174) => value174['modelRoot']) &&
        !enabled28 &&
        !this['directorScene']['pending']
      )
        return;
      if (Date['now']() - value170 > timeout) throw new Error('场景资源加载超时，请检查模型与背景后重试。');
      await new Promise((value175) => globalThis['setTimeout'](value175, 0x32));
    }
  }
  ['getSnapshot']() {
    return this['adapted']
      ? {
          sceneId: this['adapted']['scene']['id'],
          activeShotId: this['adapted']['activeShot']?.['id'] || null,
          selectedObjectIds: this['adapted']['state']['selection']['selectedObjects']['map'](
            (value176) => value176['objectId'],
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
export function createStoryboard3DSceneRuntime(value177) {
  return new Storyboard3DSceneRuntime(value177);
}
