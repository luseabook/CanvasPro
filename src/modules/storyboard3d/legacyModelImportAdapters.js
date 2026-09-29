import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { FBXLoader } from '../../../vendor/three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from '../../../vendor/three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from '../../../vendor/three/examples/jsm/loaders/STLLoader.js';
import {
  STORYBOARD_3D_RESOURCE_BASE_URL,
  createStoryboard3DResourceUrlScope,
  measureStoryboard3DImportedSceneBounds,
  createThreeGltfStoryboard3DParser,
  countStoryboard3DSceneTriangles,
} from './gltfImportAdapter.js';
function requireReadableFile(_0x55a11f, _0x56d44c) {
  if (typeof _0x55a11f?.['arrayBuffer'] !== 'function')
    throw new Error(_0x56d44c['toUpperCase']() + ' file is unreadable.');
}
export function createThreeObjStoryboard3DParser() {
  return async function _0xf060d5(_0x2aff36) {
    requireReadableFile(_0x2aff36, 'obj');
    const _0xb2423c = new TextDecoder()['decode'](await _0x2aff36['arrayBuffer']()),
      _0x46760f = new OBJLoader()['parse'](_0xb2423c);
    return {
      scene: _0x46760f,
      scenes: [_0x46760f],
      animations: [],
      cameras: [],
      bounds: measureStoryboard3DImportedSceneBounds(_0x46760f),
      triangleCount: countStoryboard3DSceneTriangles(_0x46760f),
      materialLibraries: [...(_0x46760f['materialLibraries'] || [])],
    };
  };
}
export function createThreeStlStoryboard3DParser({
  materialFactory: materialFactory = (_0x1fd7b2) =>
    new threeRuntime['MeshStandardMaterial']({
      color: 0xb8bec8,
      vertexColors: _0x1fd7b2['hasAttribute']('color'),
      roughness: 0.72,
      metalness: 0.04,
    }),
} = {}) {
  return async function _0x53903f(_0x3e51f9) {
    requireReadableFile(_0x3e51f9, 'stl');
    const _0x1ca182 = new STLLoader()['parse'](await _0x3e51f9['arrayBuffer']());
    (_0x1ca182['computeBoundingBox'](), _0x1ca182['computeBoundingSphere']());
    const _0xb813d9 = new threeRuntime['Mesh'](_0x1ca182, materialFactory(_0x1ca182));
    _0xb813d9['name'] = String(_0x3e51f9['name'] || 'STL\x20model')['replace'](/\.stl$/i, '');
    const _0x48b447 = new threeRuntime['Group']();
    return (
      (_0x48b447['name'] = _0xb813d9['name']),
      _0x48b447['add'](_0xb813d9),
      {
        scene: _0x48b447,
        scenes: [_0x48b447],
        animations: [],
        cameras: [],
        geometry: _0x1ca182,
        bounds: measureStoryboard3DImportedSceneBounds(_0x48b447),
        triangleCount: countStoryboard3DSceneTriangles(_0x48b447),
      }
    );
  };
}
export function createThreeFbxStoryboard3DParser({ urlApi: urlApi = globalThis['URL'] } = {}) {
  return async function _0x2cb2d2(_0x52ecd3, { resources: resources = new Map() } = {}) {
    requireReadableFile(_0x52ecd3, 'fbx');
    if (
      typeof urlApi?.['createObjectURL'] !== 'function' ||
      typeof urlApi?.['revokeObjectURL'] !== 'function'
    )
      throw new Error('Browser\x20object\x20URL\x20support\x20is\x20unavailable.');
    const _0x147956 = new threeRuntime['LoadingManager'](),
      _0x2ca229 = createStoryboard3DResourceUrlScope(resources, urlApi);
    (_0x147956['setURLModifier']((_0x13ad17) => _0x2ca229['resolve'](_0x13ad17)),
      (_0x147956['onLoad'] = () => _0x2ca229['dispose']()),
      (_0x147956['onError'] = () => _0x2ca229['dispose']()));
    try {
      const _0xf2dcaf = new FBXLoader(_0x147956)['parse'](
        await _0x52ecd3['arrayBuffer'](),
        STORYBOARD_3D_RESOURCE_BASE_URL,
      );
      return {
        scene: _0xf2dcaf,
        scenes: [_0xf2dcaf],
        animations: _0xf2dcaf['animations'] || [],
        cameras: [],
        bounds: measureStoryboard3DImportedSceneBounds(_0xf2dcaf),
        triangleCount: countStoryboard3DSceneTriangles(_0xf2dcaf),
        disposeResources: () => _0x2ca229['dispose'](),
      };
    } catch (_0x49aff4) {
      _0x2ca229['dispose']();
      throw _0x49aff4;
    }
  };
}
export function createThreeStoryboard3DModelParsers(_0x203aeb = {}) {
  return {
    gltf: createThreeGltfStoryboard3DParser(_0x203aeb['gltf']),
    obj: createThreeObjStoryboard3DParser(_0x203aeb['obj']),
    stl: createThreeStlStoryboard3DParser(_0x203aeb['stl']),
    fbx: createThreeFbxStoryboard3DParser(_0x203aeb['fbx']),
  };
}
