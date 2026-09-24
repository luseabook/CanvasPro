import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { GLTFLoader } from '../../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
export const STORYBOARD_3D_RESOURCE_BASE_URL = 'storyboard3d-resource:///';
export const STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES = Object['freeze']({
  glb: Object['freeze']({
    format: 'glb',
    inspection: !![],
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
    inspection: !![],
    parsing: 'available',
    parserId: 'gltf',
    limitations: Object['freeze']([
      '支持同一次选择中提供的外部 bin 与纹理资源。',
      'Draco、Meshopt 和 KTX2 资源需要调用方额外配置对应解码器。',
    ]),
  }),
  fbx: Object['freeze']({
    format: 'fbx',
    inspection: !![],
    parsing: 'available',
    parserId: 'fbx',
    reason: '使用官方 Three r180 FBXLoader。',
    limitations: Object['freeze'](['FBX 版本需满足官方 FBXLoader 要求；外部贴图需与模型同批选择。']),
  }),
  obj: Object['freeze']({
    format: 'obj',
    inspection: !![],
    parsing: 'available',
    parserId: 'obj',
    reason: '使用官方\x20Three\x20r180\x20OBJLoader。',
    limitations: Object['freeze']([
      '当前\x20adapter\x20不解析独立\x20MTL\x20文件，OBJ\x20会使用\x20loader\x20默认材质。',
    ]),
  }),
  stl: Object['freeze']({
    format: 'stl',
    inspection: !![],
    parsing: 'available',
    parserId: 'stl',
    reason: '使用官方 Three r180 STLLoader。',
    limitations: Object['freeze'](['STL\x20不携带完整材质，adapter\x20会创建默认标准材质。']),
  }),
});
export function getStoryboard3DModelImportCapability(_0x13db14) {
  return (
    STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES[
      String(_0x13db14 || '')
        ['trim']()
        ['toLowerCase']()
    ] || null
  );
}
function normalizeResourceKey(_0x4e27fa) {
  let _0x463b84 = String(_0x4e27fa || '')['trim']();
  if (_0x463b84['startsWith'](STORYBOARD_3D_RESOURCE_BASE_URL))
    _0x463b84 = _0x463b84['slice'](STORYBOARD_3D_RESOURCE_BASE_URL['length']);
  try {
    _0x463b84 = decodeURIComponent(_0x463b84);
  } catch {}
  return _0x463b84['replaceAll']('\x5c', '/')['split'](/[?#]/, 0x1)[0x0]['replace'](/^\.\//, '');
}
function findResource(_0xfbbad9, _0x15ca0e) {
  const _0x14822a = normalizeResourceKey(_0x15ca0e);
  return _0xfbbad9?.['get']?.(_0x14822a) || _0xfbbad9?.['get']?.(_0x14822a['split']('/')['at'](-0x1)) || null;
}
export function createStoryboard3DResourceUrlScope(_0x3b84d3, _0x52c010) {
  const _0x3c69b9 = new Map();
  return {
    resolve(_0x4ec2e5) {
      if (/^(blob:|data:|https?:)/i['test'](_0x4ec2e5)) return _0x4ec2e5;
      const _0x597605 = findResource(_0x3b84d3, _0x4ec2e5);
      if (!_0x597605) return _0x4ec2e5;
      if (!_0x3c69b9['has'](_0x597605)) _0x3c69b9['set'](_0x597605, _0x52c010['createObjectURL'](_0x597605));
      return _0x3c69b9['get'](_0x597605);
    },
    dispose() {
      for (const _0x4f9ac6 of _0x3c69b9['values']()) _0x52c010['revokeObjectURL'](_0x4f9ac6);
      _0x3c69b9['clear']();
    },
  };
}
export function measureStoryboard3DImportedSceneBounds(_0x444db2) {
  if (!_0x444db2) return null;
  _0x444db2['updateMatrixWorld']?.(!![]);
  const _0x56bd9c = new threeRuntime['Box3']()['setFromObject'](_0x444db2),
    _0x35dac8 = [
      _0x56bd9c['min']['x'],
      _0x56bd9c['min']['y'],
      _0x56bd9c['min']['z'],
      _0x56bd9c['max']['x'],
      _0x56bd9c['max']['y'],
      _0x56bd9c['max']['z'],
    ];
  if (!_0x35dac8['every'](Number['isFinite']) || _0x56bd9c['isEmpty']()) return null;
  return {
    min: { x: _0x56bd9c['min']['x'], y: _0x56bd9c['min']['y'], z: _0x56bd9c['min']['z'] },
    max: { x: _0x56bd9c['max']['x'], y: _0x56bd9c['max']['y'], z: _0x56bd9c['max']['z'] },
  };
}
export function countStoryboard3DSceneTriangles(_0x4c6338) {
  let _0x2c252b = 0x0;
  return (
    _0x4c6338?.['traverse']?.((_0x135033) => {
      if (!_0x135033?.['isMesh'] || !_0x135033['geometry']) return;
      const _0x7984e6 = _0x135033['geometry'],
        _0x20ee91 = Math['max'](
          0x0,
          Number(_0x7984e6['index']?.['count'] ?? _0x7984e6['getAttribute']?.('position')?.['count']) || 0x0,
        ),
        _0x1999a7 = Math['max'](
          0x0,
          Math['min'](_0x20ee91, Number(_0x7984e6['drawRange']?.['start']) || 0x0),
        ),
        _0x4ca3f7 = Number(_0x7984e6['drawRange']?.['count']),
        _0x2aa7e1 = Number['isFinite'](_0x4ca3f7)
          ? Math['max'](0x0, Math['min'](_0x20ee91 - _0x1999a7, _0x4ca3f7))
          : _0x20ee91 - _0x1999a7,
        _0x5bf080 = _0x135033['isInstancedMesh'] ? Math['max'](0x0, Number(_0x135033['count']) || 0x0) : 0x1;
      _0x2c252b += Math['floor'](_0x2aa7e1 / 0x3) * _0x5bf080;
    }),
    _0x2c252b
  );
}
export function createThreeGltfStoryboard3DParser({
  urlApi: urlApi = globalThis['URL'],
  configureLoader: configureLoader = null,
} = {}) {
  return async function _0x1a596b(_0x4be73c, { resources: resources = new Map() } = {}) {
    if (typeof _0x4be73c?.['arrayBuffer'] !== 'function') throw new Error('GLB/glTF file is unreadable.');
    if (
      typeof urlApi?.['createObjectURL'] !== 'function' ||
      typeof urlApi?.['revokeObjectURL'] !== 'function'
    )
      throw new Error('Browser object URL support is unavailable.');
    const _0x57215b = new threeRuntime['LoadingManager'](),
      _0xe73560 = createStoryboard3DResourceUrlScope(resources, urlApi);
    _0x57215b['setURLModifier']((_0x45b30d) => _0xe73560['resolve'](_0x45b30d));
    const _0x39e425 = new GLTFLoader(_0x57215b);
    if (typeof configureLoader === 'function') configureLoader(_0x39e425);
    try {
      const _0x1a03da = await _0x4be73c['arrayBuffer'](),
        _0x45db90 = String(_0x4be73c['name'] || '')
          ['toLowerCase']()
          ['endsWith']('.gltf'),
        _0x441ec1 = _0x45db90 ? new TextDecoder()['decode'](_0x1a03da) : _0x1a03da,
        _0x2babc2 = await _0x39e425['parseAsync'](_0x441ec1, STORYBOARD_3D_RESOURCE_BASE_URL);
      if (!_0x2babc2?.['scene'])
        throw new Error('GLB/glTF\x20did\x20not\x20contain\x20a\x20default\x20scene.');
      return {
        scene: _0x2babc2['scene'],
        scenes: _0x2babc2['scenes'] || [_0x2babc2['scene']],
        animations: _0x2babc2['animations'] || [],
        cameras: _0x2babc2['cameras'] || [],
        asset: _0x2babc2['asset'] || null,
        userData: _0x2babc2['userData'] || {},
        bounds: measureStoryboard3DImportedSceneBounds(_0x2babc2['scene']),
        triangleCount: countStoryboard3DSceneTriangles(_0x2babc2['scene']),
      };
    } finally {
      _0xe73560['dispose']();
    }
  };
}
export const parseStoryboard3DGltfFile = createThreeGltfStoryboard3DParser();
