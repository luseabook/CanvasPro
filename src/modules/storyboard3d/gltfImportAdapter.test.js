import assert from 'node:assert/strict';
import test from 'node:test';

import * as three from '../panoramaSceneNode/threeRuntime.js';
import {
  STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES,
  STORYBOARD_3D_RESOURCE_BASE_URL,
  countStoryboard3DSceneTriangles,
  createStoryboard3DResourceUrlScope,
  createThreeGltfStoryboard3DParser,
  getStoryboard3DModelImportCapability,
  measureStoryboard3DImportedSceneBounds,
  parseStoryboard3DGltfFile,
} from './gltfImportAdapter.js';

// Node 无浏览器 FileLoader 事件类型；仅补齐 ProgressEvent 以便离线解析 data: 资源。
if (typeof globalThis.ProgressEvent !== 'function') {
  globalThis.ProgressEvent = class ProgressEvent extends Event {
    constructor(type, init = {}) {
      super(type);
      this.lengthComputable = Boolean(init.lengthComputable);
      this.loaded = Number(init.loaded) || 0;
      this.total = Number(init.total) || 0;
    }
  };
}

function makeUrlApi() {
  const created = [];
  const revoked = [];
  return {
    created,
    revoked,
    createObjectURL: (blob) => {
      created.push(blob);
      return 'blob:mock/' + created.length;
    },
    revokeObjectURL: (url) => revoked.push(url),
  };
}

function triangleDocument() {
  const floats = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const base64 = Buffer.from(floats.buffer).toString('base64');
  return {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ uri: 'data:application/octet-stream;base64,' + base64, byteLength: floats.byteLength }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: floats.byteLength }],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] },
    ],
  };
}

function gluedFile() {
  const json = JSON.stringify(triangleDocument());
  return { name: 'triangle.gltf', arrayBuffer: async () => new TextEncoder().encode(json).buffer };
}

function binaryFile() {
  const floats = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const bin = new Uint8Array(floats.buffer);
  const document = triangleDocument();
  document.buffers = [{ byteLength: bin.length }];
  const jsonBytes = new TextEncoder().encode(JSON.stringify(document));
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunk = new Uint8Array(jsonBytes.length + jsonPad);
  jsonChunk.set(jsonBytes);
  jsonChunk.fill(32, jsonBytes.length);
  const binPad = (4 - (bin.length % 4)) % 4;
  const binChunk = new Uint8Array(bin.length + binPad);
  binChunk.set(bin);

  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonChunk.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(jsonChunk, 20);
  view.setUint32(20 + jsonChunk.length, binChunk.length, true);
  view.setUint32(24 + jsonChunk.length, 0x004e4942, true);
  bytes.set(binChunk, 28 + jsonChunk.length);
  return { name: 'triangle.glb', arrayBuffer: async () => bytes.buffer };
}

test('GLTF 导入：资源基址与能力表冻结', () => {
  assert.equal(STORYBOARD_3D_RESOURCE_BASE_URL, 'storyboard3d-resource:///');
  assert.ok(Object.isFrozen(STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES));
  assert.deepEqual(Object.keys(STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES).sort(), [
    'fbx',
    'glb',
    'gltf',
    'obj',
    'stl',
  ]);
  for (const capability of Object.values(STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES)) {
    assert.ok(Object.isFrozen(capability));
    assert.ok(Object.isFrozen(capability.limitations));
    assert.equal(capability.inspection, true);
    assert.equal(capability.parsing, 'available');
    assert.equal(typeof capability.parserId, 'string');
  }
  assert.equal(STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES.glb.parserId, 'gltf');
  assert.equal(STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES.fbx.parserId, 'fbx');
});

test('GLTF 导入：能力查询归一化', () => {
  assert.equal(getStoryboard3DModelImportCapability('GLB'), STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES.glb);
  assert.equal(getStoryboard3DModelImportCapability('  gltf '), STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES.gltf);
  assert.equal(getStoryboard3DModelImportCapability('Obj'), STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES.obj);
  assert.equal(getStoryboard3DModelImportCapability('nope'), null);
  assert.equal(getStoryboard3DModelImportCapability(''), null);
  assert.equal(getStoryboard3DModelImportCapability(null), null);
  assert.equal(getStoryboard3DModelImportCapability(undefined), null);
});

test('GLTF 导入：资源地址作用域缓存、归一化与释放', () => {
  const blobA = { id: 'a' };
  const blobB = { id: 'b' };
  const resources = new Map([
    ['textures/a.png', blobA],
    ['a.png', blobB],
  ]);
  const urlApi = makeUrlApi();
  const scope = createStoryboard3DResourceUrlScope(resources, urlApi);

  const first = scope.resolve('storyboard3d-resource:///textures/a.png');
  assert.match(first, /^blob:mock\//);
  assert.equal(scope.resolve('textures/a.png'), first);
  assert.equal(scope.resolve('textures\\a.png'), first);
  assert.equal(scope.resolve('textures/a.png?v=2'), first);
  assert.equal(scope.resolve('textures/a.png#frag'), first);
  assert.equal(scope.resolve('textures/a%2Epng'), first);
  assert.equal(scope.resolve('./textures/a.png'), first);
  assert.deepEqual(urlApi.created, [blobA]);

  const viaBasename = scope.resolve('nested/deep/a.png');
  assert.notEqual(viaBasename, first);
  assert.deepEqual(urlApi.created, [blobA, blobB]);

  assert.equal(scope.resolve('https://cdn.example/x.png'), 'https://cdn.example/x.png');
  assert.equal(scope.resolve('HTTPS://cdn.example/x.png'), 'HTTPS://cdn.example/x.png');
  assert.equal(scope.resolve('data:image/png;base64,AA=='), 'data:image/png;base64,AA==');
  assert.equal(scope.resolve('blob:https://origin/abc'), 'blob:https://origin/abc');
  assert.equal(scope.resolve('not-there.png'), 'not-there.png');
  assert.equal(urlApi.created.length, 2);

  scope.dispose();
  assert.deepEqual(urlApi.revoked, [first, viaBasename]);
  assert.equal(scope.resolve('textures/a.png').startsWith('blob:mock/'), true);
  assert.equal(urlApi.created.length, 3);
});

test('GLTF 导入：包围盒测量', () => {
  const mesh = new three.Mesh(new three.BoxGeometry(2, 2, 2), new three.MeshBasicMaterial());
  assert.deepEqual(measureStoryboard3DImportedSceneBounds(mesh), {
    min: { x: -1, y: -1, z: -1 },
    max: { x: 1, y: 1, z: 1 },
  });
  assert.equal(measureStoryboard3DImportedSceneBounds(null), null);
  assert.equal(measureStoryboard3DImportedSceneBounds(undefined), null);
  assert.equal(measureStoryboard3DImportedSceneBounds(new three.Object3D()), null);
});

test('GLTF 导入：三角面计数支持 drawRange 与实例倍数', () => {
  assert.equal(countStoryboard3DSceneTriangles(null), 0);
  assert.equal(countStoryboard3DSceneTriangles(new three.Object3D()), 0);

  const mesh = new three.Mesh(new three.BoxGeometry(1, 1, 1), new three.MeshBasicMaterial());
  assert.equal(countStoryboard3DSceneTriangles(mesh), 12);

  const instancedGeometry = new three.BoxGeometry(1, 1, 1);
  const instanced = new three.InstancedMesh(instancedGeometry, new three.MeshBasicMaterial(), 3);
  assert.equal(countStoryboard3DSceneTriangles(instanced), 36);

  mesh.geometry.drawRange = { start: 0, count: 6 };
  assert.equal(countStoryboard3DSceneTriangles(mesh), 2);
});

test('GLTF 导入：解析器守卫', async () => {
  const parser = createThreeGltfStoryboard3DParser();
  await assert.rejects(() => parser(null), /GLB\/glTF file is unreadable/);
  await assert.rejects(() => parser({ name: 'x.gltf' }), /GLB\/glTF file is unreadable/);

  const noUrlParser = createThreeGltfStoryboard3DParser({ urlApi: {} });
  await assert.rejects(
    () => noUrlParser({ name: 'x.gltf', arrayBuffer: async () => new ArrayBuffer(8) }),
    /Browser object URL support is unavailable/,
  );
});

test('GLTF 导入：端到端解析最小 glTF（.gltf 文本通道）', async () => {
  const result = await parseStoryboard3DGltfFile(gluedFile());
  assert.ok(result.scene);
  assert.equal(result.triangleCount, 1);
  assert.deepEqual(result.bounds, { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 0 } });
  assert.deepEqual(result.asset, { version: '2.0' });
  assert.deepEqual(result.animations, []);
  assert.deepEqual(result.cameras, []);
  assert.equal(result.scenes.length, 1);
  assert.equal(result.scene.children.length, 1);
});

test('GLTF 导入：端到端解析最小 GLB（二进制通道）', async () => {
  const result = await parseStoryboard3DGltfFile(binaryFile());
  assert.ok(result.scene);
  assert.equal(result.triangleCount, 1);
  assert.deepEqual(result.bounds, { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 0 } });
});

test('GLTF 导入：configureLoader 注入与资源作用域释放', async () => {
  const seen = [];
  const parser = createThreeGltfStoryboard3DParser({
    configureLoader: (loader) => {
      seen.push(loader);
      loader.setCrossOrigin('anonymous');
    },
  });
  const result = await parser(gluedFile(), { resources: new Map() });
  assert.equal(seen.length, 1);
  assert.equal(typeof seen[0].parseAsync, 'function');
  assert.equal(result.triangleCount, 1);
});

test('GLTF 导入：默认实例可直接解析', async () => {
  assert.equal(typeof parseStoryboard3DGltfFile, 'function');
  const result = await parseStoryboard3DGltfFile(gluedFile(), { resources: new Map() });
  assert.equal(result.triangleCount, 1);
});
