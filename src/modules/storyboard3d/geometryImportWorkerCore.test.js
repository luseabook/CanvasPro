import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectStoryboard3DGeometryTransferables,
  parseStoryboard3DObjGeometry,
  parseStoryboard3DStlGeometry,
  parseStoryboard3DWorkerGeometry,
} from './geometryImportWorkerCore.js';

const encoder = new TextEncoder();

function bytes(text) {
  return encoder.encode(text);
}

const QUAD_OBJ = [
  '# 场景',
  'mtllib lib.mtl',
  'v 0 0 0',
  'v 1 0 0',
  'v 0 1 0',
  'v 0 0 1',
  'vn 0 0 1',
  'vt 0 0',
  'o Quad',
  'usemtl mat1',
  'f 1/1/1 2/1/1 3/1/1 4/1/1',
].join('\n');

const TRI_OBJ = ['v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'f 1 2 3'].join('\n');

const ASCII_STL = [
  'solid test',
  'facet normal 0 0 1',
  'outer loop',
  'vertex 0 0 0',
  'vertex 1 0 0',
  'vertex 0 1 0',
  'endloop',
  'endfacet',
  'endsolid test',
].join('\n');

function binaryStl() {
  const buffer = new ArrayBuffer(84 + 50);
  const view = new DataView(buffer);
  view.setUint32(80, 1, true);
  [0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0].forEach((value, index) => {
    view.setFloat32(84 + index * 4, value, true);
  });
  return buffer;
}

test('几何导入：OBJ 四边形三角化、材质与包围盒', () => {
  const progress = [];
  const geometry = parseStoryboard3DObjGeometry(bytes(QUAD_OBJ), {
    onProgress: (value) => progress.push(value),
  });
  assert.equal(geometry.format, 'obj');
  assert.equal(geometry.name, 'OBJ model');
  assert.equal(geometry.triangleCount, 2);
  assert.deepEqual(geometry.materialLibraries, ['lib.mtl']);
  assert.deepEqual(geometry.bounds, {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 1 },
  });

  assert.equal(geometry.meshes.length, 1);
  const mesh = geometry.meshes[0];
  assert.equal(mesh.name, 'Quad');
  assert.equal(mesh.materialName, 'mat1');
  assert.equal(mesh.triangleCount, 2);
  assert.equal(mesh.attributes.position.itemSize, 3);
  assert.equal(mesh.attributes.position.count, 6);
  assert.equal(mesh.attributes.normal.count, 6);
  assert.equal(mesh.attributes.uv.itemSize, 2);
  assert.equal(mesh.attributes.uv.count, 6);
  assert.ok(mesh.attributes.position.array instanceof ArrayBuffer);
  assert.deepEqual(progress, [0.08, 1]);
});

test('几何导入：OBJ 名称参数去除扩展名并支持负索引', () => {
  const named = parseStoryboard3DObjGeometry(bytes(TRI_OBJ), { name: 'tower.obj' });
  assert.equal(named.name, 'tower');
  assert.equal(named.meshes[0].name, 'tower');
  assert.equal(named.meshes[0].triangleCount, 1);
  assert.equal(named.meshes[0].attributes.normal, undefined);
  assert.equal(named.meshes[0].attributes.uv, undefined);

  const negative = parseStoryboard3DObjGeometry(
    bytes(['v 0 0 0', 'v 1 0 0', 'v 2 0 0', 'v 3 0 0', 'f -4 -3 -2'].join('\n')),
  );
  assert.equal(negative.triangleCount, 1);
  assert.deepEqual(negative.bounds, {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 2, y: 0, z: 0 },
  });
  assert.deepEqual(
    Array.from(new Float32Array(negative.meshes[0].attributes.position.array)),
    [0, 0, 0, 1, 0, 0, 2, 0, 0],
  );
});

test('几何导入：OBJ 混合法线使整网格丢弃法线属性', () => {
  const geometry = parseStoryboard3DObjGeometry(
    bytes(['v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'vn 0 0 1', 'f 1//1 2//1 3//1', 'f 1 2 3'].join('\n')),
  );
  assert.equal(geometry.triangleCount, 2);
  assert.equal(geometry.meshes[0].attributes.position.count, 6);
  assert.equal(geometry.meshes[0].attributes.normal, undefined);
  assert.equal(geometry.meshes[0].attributes.uv, undefined);
});

test('几何导入：OBJ 无有效面时报错', () => {
  assert.throws(() => parseStoryboard3DObjGeometry(bytes('')), /OBJ did not contain any triangle faces\./);
  assert.throws(
    () => parseStoryboard3DObjGeometry(bytes(['v 0 0 0', 'v 1 0 0', 'v 0 1 0'].join('\n'))),
    /OBJ did not contain any triangle faces\./,
  );
  assert.throws(
    () => parseStoryboard3DObjGeometry(bytes(['v 0 0 0', 'v 1 0 0', 'v 0 1 0', 'f 1 2 9'].join('\n'))),
    /OBJ did not contain any triangle faces\./,
  );
  assert.throws(
    () => parseStoryboard3DObjGeometry(bytes(['v 0 0 0', 'v 1 0 0', 'f 1 2'].join('\n'))),
    /OBJ did not contain any triangle faces\./,
  );
});

test('几何导入：ASCII STL 解析面片与法线', () => {
  const progress = [];
  const geometry = parseStoryboard3DStlGeometry(bytes(ASCII_STL), {
    name: 'part.stl',
    onProgress: (value) => progress.push(value),
  });
  assert.equal(geometry.format, 'stl');
  assert.equal(geometry.name, 'part');
  assert.equal(geometry.triangleCount, 1);
  assert.deepEqual(geometry.materialLibraries, []);
  assert.deepEqual(geometry.bounds, {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 0 },
  });
  const mesh = geometry.meshes[0];
  assert.equal(mesh.attributes.position.count, 3);
  assert.equal(mesh.attributes.normal.count, 3);
  assert.deepEqual(Array.from(new Float32Array(mesh.attributes.normal.array)), [0, 0, 1, 0, 0, 1, 0, 0, 1]);
  assert.deepEqual(progress, [0.08, 1]);
});

test('几何导入：二进制 STL 识别与解析', () => {
  const geometry = parseStoryboard3DStlGeometry(binaryStl());
  assert.equal(geometry.format, 'stl');
  assert.equal(geometry.triangleCount, 1);
  assert.deepEqual(geometry.bounds, {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 2, y: 3, z: 0 },
  });
  assert.deepEqual(
    Array.from(new Float32Array(geometry.meshes[0].attributes.position.array)),
    [0, 0, 0, 2, 0, 0, 0, 3, 0],
  );
});

test('几何导入：STL 无面片时报错', () => {
  assert.throws(
    () => parseStoryboard3DStlGeometry(bytes('solid empty\nendsolid empty\n')),
    /STL did not contain any triangle facets\./,
  );
});

test('几何导入：Worker 入口校验缓冲类型并分派格式', () => {
  assert.throws(() => parseStoryboard3DWorkerGeometry(), TypeError);
  assert.throws(
    () => parseStoryboard3DWorkerGeometry({ format: 'obj', buffer: bytes(TRI_OBJ) }),
    (error) => {
      assert.ok(error instanceof TypeError);
      assert.equal(error.message, 'Worker geometry import requires an ArrayBuffer.');
      return true;
    },
  );

  const obj = parseStoryboard3DWorkerGeometry({
    format: 'obj',
    buffer: bytes(QUAD_OBJ).buffer,
    name: 'worker',
  });
  assert.equal(obj.format, 'obj');
  assert.equal(obj.name, 'worker');
  const stl = parseStoryboard3DWorkerGeometry({ format: 'stl', buffer: binaryStl() });
  assert.equal(stl.format, 'stl');
  assert.equal(stl.triangleCount, 1);

  assert.throws(
    () => parseStoryboard3DWorkerGeometry({ format: 'fbx', buffer: new ArrayBuffer(8) }),
    /Worker geometry import does not support FBX\./,
  );
  assert.throws(
    () => parseStoryboard3DWorkerGeometry({ buffer: new ArrayBuffer(8) }),
    /Worker geometry import does not support UNKNOWN\./,
  );
});

test('几何导入：可转移对象收集属性与索引缓冲', () => {
  const quad = parseStoryboard3DObjGeometry(bytes(QUAD_OBJ));
  const quadTransferables = collectStoryboard3DGeometryTransferables(quad);
  assert.equal(quadTransferables.length, 3);
  assert.ok(quadTransferables.every((entry) => entry instanceof ArrayBuffer));

  const stlTransferables = collectStoryboard3DGeometryTransferables(
    parseStoryboard3DStlGeometry(binaryStl()),
  );
  assert.equal(stlTransferables.length, 2);

  const position = new ArrayBuffer(4);
  const index = new ArrayBuffer(4);
  assert.deepEqual(
    collectStoryboard3DGeometryTransferables({
      meshes: [{ attributes: { position: { array: position } }, index: { array: index } }],
    }),
    [position, index],
  );
  assert.deepEqual(
    collectStoryboard3DGeometryTransferables({
      meshes: [{ attributes: { position: { array: new Float32Array(3) } } }],
    }),
    [],
  );
  assert.deepEqual(collectStoryboard3DGeometryTransferables(null), []);
  assert.deepEqual(collectStoryboard3DGeometryTransferables({}), []);
});
