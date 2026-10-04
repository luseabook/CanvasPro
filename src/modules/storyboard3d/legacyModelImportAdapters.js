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
function requireReadableFile(value, item) {
  if (typeof value?.['arrayBuffer'] !== 'function')
    throw new Error(item['toUpperCase']() + ' file is unreadable.');
}
export function createThreeObjStoryboard3DParser() {
  return async function run(key) {
    requireReadableFile(key, 'obj');
    const textDecoder = new TextDecoder()['decode'](await key['arrayBuffer']()),
      scene = new OBJLoader()['parse'](textDecoder);
    return {
      scene: scene,
      scenes: [scene],
      animations: [],
      cameras: [],
      bounds: measureStoryboard3DImportedSceneBounds(scene),
      triangleCount: countStoryboard3DSceneTriangles(scene),
      materialLibraries: [...(scene['materialLibraries'] || [])],
    };
  };
}
export function createThreeStlStoryboard3DParser({
  materialFactory: materialFactory = (vertexColors) =>
    new threeRuntime['MeshStandardMaterial']({
      color: 0xb8bec8,
      vertexColors: vertexColors['hasAttribute']('color'),
      roughness: 0.72,
      metalness: 0.04,
    }),
} = {}) {
  return async function run2(error) {
    requireReadableFile(error, 'stl');
    const geometry = new STLLoader()['parse'](await error['arrayBuffer']());
    (geometry['computeBoundingBox'](), geometry['computeBoundingSphere']());
    const error2 = new threeRuntime['Mesh'](geometry, materialFactory(geometry));
    error2['name'] = String(error['name'] || 'STL\x20model')['replace'](/\.stl$/i, '');
    const scene2 = new threeRuntime['Group']();
    return (
      (scene2['name'] = error2['name']),
      scene2['add'](error2),
      {
        scene: scene2,
        scenes: [scene2],
        animations: [],
        cameras: [],
        geometry: geometry,
        bounds: measureStoryboard3DImportedSceneBounds(scene2),
        triangleCount: countStoryboard3DSceneTriangles(scene2),
      }
    );
  };
}
export function createThreeFbxStoryboard3DParser({ urlApi: urlApi = globalThis['URL'] } = {}) {
  return async function run3(index, { resources: resources = new Map() } = {}) {
    requireReadableFile(index, 'fbx');
    if (
      typeof urlApi?.['createObjectURL'] !== 'function' ||
      typeof urlApi?.['revokeObjectURL'] !== 'function'
    )
      throw new Error('Browser\x20object\x20URL\x20support\x20is\x20unavailable.');
    const result = new threeRuntime['LoadingManager'](),
      promise = createStoryboard3DResourceUrlScope(resources, urlApi);
    (result['setURLModifier']((data) => promise['resolve'](data)),
      (result['onLoad'] = () => promise['dispose']()),
      (result['onError'] = () => promise['dispose']()));
    try {
      const scene3 = new FBXLoader(result)['parse'](
        await index['arrayBuffer'](),
        STORYBOARD_3D_RESOURCE_BASE_URL,
      );
      return {
        scene: scene3,
        scenes: [scene3],
        animations: scene3['animations'] || [],
        cameras: [],
        bounds: measureStoryboard3DImportedSceneBounds(scene3),
        triangleCount: countStoryboard3DSceneTriangles(scene3),
        disposeResources: () => promise['dispose'](),
      };
    } catch (options) {
      promise['dispose']();
      throw options;
    }
  };
}
export function createThreeStoryboard3DModelParsers(options2 = {}) {
  return {
    gltf: createThreeGltfStoryboard3DParser(options2['gltf']),
    obj: createThreeObjStoryboard3DParser(options2['obj']),
    stl: createThreeStlStoryboard3DParser(options2['stl']),
    fbx: createThreeFbxStoryboard3DParser(options2['fbx']),
  };
}
