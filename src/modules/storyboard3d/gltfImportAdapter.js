import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { GLTFLoader } from '../../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
export const STORYBOARD_3D_RESOURCE_BASE_URL = 'storyboard3d-resource:///';
export const STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES = Object['freeze']({
  glb: Object['freeze']({
    format: 'glb',
    inspection: true,
    parsing: 'available',
    parserId: 'gltf',
    limitations: Object['freeze']([
      'Draco 压缩模型需要调用方配置 DRACOLoader。',
      'Meshopt 压缩模型需要调用方配置 MeshoptDecoder。',
      'KTX2 纹理需要调用方配置 KTX2Loader。',
    ]),
  }),
  gltf: Object['freeze']({
    format: 'gltf',
    inspection: true,
    parsing: 'available',
    parserId: 'gltf',
    limitations: Object['freeze']([
      '支持同一次选择中提供的外部 bin 与纹理资源。',
      'Draco、Meshopt 和 KTX2 资源需要调用方额外配置对应解码器。',
    ]),
  }),
  fbx: Object['freeze']({
    format: 'fbx',
    inspection: true,
    parsing: 'available',
    parserId: 'fbx',
    reason: '使用官方 Three r180 FBXLoader。',
    limitations: Object['freeze'](['FBX 版本需满足官方 FBXLoader 要求；外部贴图需与模型同批选择。']),
  }),
  obj: Object['freeze']({
    format: 'obj',
    inspection: true,
    parsing: 'available',
    parserId: 'obj',
    reason: '使用官方 Three r180 OBJLoader。',
    limitations: Object['freeze']([
      '当前 adapter 不解析独立 MTL 文件，OBJ 会使用 loader 默认材质。',
    ]),
  }),
  stl: Object['freeze']({
    format: 'stl',
    inspection: true,
    parsing: 'available',
    parserId: 'stl',
    reason: '使用官方 Three r180 STLLoader。',
    limitations: Object['freeze'](['STL 不携带完整材质，adapter 会创建默认标准材质。']),
  }),
});
export function getStoryboard3DModelImportCapability(value) {
  return (
    STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES[
      String(value || '')
        ['trim']()
        ['toLowerCase']()
    ] || null
  );
}
function normalizeResourceKey(item) {
  let list = String(item || '')['trim']();
  if (list['startsWith'](STORYBOARD_3D_RESOURCE_BASE_URL))
    list = list['slice'](STORYBOARD_3D_RESOURCE_BASE_URL['length']);
  try {
    list = decodeURIComponent(list);
  } catch {}
  return list['replaceAll']('\\', '/')['split'](/[?#]/, 1)[0]['replace'](/^\.\//, '');
}
function findResource(map, key) {
  const resourceKey = normalizeResourceKey(key);
  return map?.['get']?.(resourceKey) || map?.['get']?.(resourceKey['split']('/')['at'](-1)) || null;
}
export function createStoryboard3DResourceUrlScope(index, result) {
  const map2 = new Map();
  return {
    resolve(data) {
      if (/^(blob:|data:|https?:)/i['test'](data)) return data;
      const resource = findResource(index, data);
      if (!resource) return data;
      if (!map2['has'](resource)) map2['set'](resource, result['createObjectURL'](resource));
      return map2['get'](resource);
    },
    dispose() {
      for (const options of map2['values']()) result['revokeObjectURL'](options);
      map2['clear']();
    },
  };
}
export function measureStoryboard3DImportedSceneBounds(enabled) {
  if (!enabled) return null;
  enabled['updateMatrixWorld']?.(true);
  const x = new threeRuntime['Box3']()['setFromObject'](enabled),
    list2 = [x['min']['x'], x['min']['y'], x['min']['z'], x['max']['x'], x['max']['y'], x['max']['z']];
  if (!list2['every'](Number['isFinite']) || x['isEmpty']()) return null;
  return {
    min: { x: x['min']['x'], y: x['min']['y'], z: x['min']['z'] },
    max: { x: x['max']['x'], y: x['max']['y'], z: x['max']['z'] },
  };
}
export function countStoryboard3DSceneTriangles(target) {
  let source = 0;
  return (
    target?.['traverse']?.((enabled2) => {
      if (!enabled2?.['isMesh'] || !enabled2['geometry']) return;
      const next = enabled2['geometry'],
        current = Math['max'](
          0,
          Number(next['index']?.['count'] ?? next['getAttribute']?.('position')?.['count']) || 0,
        ),
        entry = Math['max'](0, Math['min'](current, Number(next['drawRange']?.['start']) || 0)),
        record = Number(next['drawRange']?.['count']),
        payload = Number['isFinite'](record)
          ? Math['max'](0, Math['min'](current - entry, record))
          : current - entry,
        handle = enabled2['isInstancedMesh'] ? Math['max'](0, Number(enabled2['count']) || 0) : 1;
      source += Math['floor'](payload / 3) * handle;
    }),
    source
  );
}
export function createThreeGltfStoryboard3DParser({
  urlApi: urlApi = globalThis['URL'],
  configureLoader: configureLoader = null,
} = {}) {
  return async function run(error, { resources: resources = new Map() } = {}) {
    if (typeof error?.['arrayBuffer'] !== 'function') throw new Error('GLB/glTF file is unreadable.');
    if (
      typeof urlApi?.['createObjectURL'] !== 'function' ||
      typeof urlApi?.['revokeObjectURL'] !== 'function'
    )
      throw new Error('Browser object URL support is unavailable.');
    const state = new threeRuntime['LoadingManager'](),
      promise = createStoryboard3DResourceUrlScope(resources, urlApi);
    state['setURLModifier']((config) => promise['resolve'](config));
    const gLTFLoader = new GLTFLoader(state);
    if (typeof configureLoader === 'function') configureLoader(gLTFLoader);
    try {
      const scope = await error['arrayBuffer'](),
        input = String(error['name'] || '')
          ['toLowerCase']()
          ['endsWith']('.gltf'),
        output = input ? new TextDecoder()['decode'](scope) : scope,
        scene = await gLTFLoader['parseAsync'](output, STORYBOARD_3D_RESOURCE_BASE_URL);
      if (!scene?.['scene']) throw new Error('GLB/glTF did not contain a default scene.');
      return {
        scene: scene['scene'],
        scenes: scene['scenes'] || [scene['scene']],
        animations: scene['animations'] || [],
        cameras: scene['cameras'] || [],
        asset: scene['asset'] || null,
        userData: scene['userData'] || {},
        bounds: measureStoryboard3DImportedSceneBounds(scene['scene']),
        triangleCount: countStoryboard3DSceneTriangles(scene['scene']),
      };
    } finally {
      promise['dispose']();
    }
  };
}
export const parseStoryboard3DGltfFile = createThreeGltfStoryboard3DParser();
