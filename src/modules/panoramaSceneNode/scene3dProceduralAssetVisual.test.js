import test from 'node:test';
import assert from 'node:assert/strict';
import * as threeRuntime from './threeRuntime.js';
import { applySceneAssetColors, createSceneAssetVisual } from './scene3dProceduralAssetVisual.js';

const DEFAULT_COLOR = new threeRuntime.Color(0x101010);
const colorForKey = (key) => new threeRuntime.Color(key === 'k1' ? 0x00ff00 : key === 'k2' ? 0x0000ff : 0xff00ff);

const partOf = (extra = {}) => ({
  primitive: 'box',
  size: { x: 1, y: 1, z: 1 },
  position: { x: 1, y: 2, z: 3 },
  rotation: { x: 0, y: 0, z: 0 },
  ...extra,
});

test('scene3dProceduralAssetVisual: 返回结构里带上素材 id、两组与两张材质表', () => {
  const visual = createSceneAssetVisual({ id: 'a1', parts: [partOf({ colorKey: 'k1' })] }, DEFAULT_COLOR, colorForKey);

  assert.equal(visual.assetId, 'a1');
  assert.equal(visual.group instanceof threeRuntime.Group, true);
  assert.equal(visual.content instanceof threeRuntime.Group, true);
  assert.equal(visual.group.children.includes(visual.content), true);
  assert.equal(visual.materialsByColorKey instanceof Map, true);
  assert.equal(visual.edgeMaterialsByColorKey instanceof Map, true);
  assert.equal(visual.selectionRing != null, true);
  assert.equal(visual.group.children.includes(visual.selectionRing), true);
});

test('scene3dProceduralAssetVisual: 没有 id 时 assetId 为 null', () => {
  const visual = createSceneAssetVisual({ parts: [partOf()] }, DEFAULT_COLOR, colorForKey);
  assert.equal(visual.assetId, null);
});

test('scene3dProceduralAssetVisual: 每个部件出一个实体网格加一条描边', () => {
  const visual = createSceneAssetVisual(
    { id: 'a1', parts: [partOf({ colorKey: 'k1' }), partOf({ primitive: 'sphere', radius: 0.3 })] },
    DEFAULT_COLOR,
    colorForKey,
  );
  assert.equal(visual.content.children.length, 4, '两个部件各自 Mesh + LineSegments');
  assert.equal(visual.content.children.filter((child) => child instanceof threeRuntime.Mesh).length, 2);
});

test('scene3dProceduralAssetVisual: 部件缺省时补一个默认方块，材质落到 __default 键', () => {
  const visual = createSceneAssetVisual({ id: 'a2' }, DEFAULT_COLOR, colorForKey);
  assert.equal(visual.content.children.length, 2);
  assert.equal(visual.content.children[0].geometry instanceof threeRuntime.BoxGeometry, true);
  assert.equal(visual.materialsByColorKey.has('__default'), true);
  assert.equal(visual.materialsByColorKey.get('__default').color.getHex(), DEFAULT_COLOR.getHex());
});

test('scene3dProceduralAssetVisual: 按 primitive 选几何体，未知图元退回方块', () => {
  const geometryTypeOf = (part) =>
    createSceneAssetVisual({ id: 'x', parts: [part] }, DEFAULT_COLOR, colorForKey).content.children[0].geometry.type;

  assert.equal(geometryTypeOf(partOf({ primitive: 'box' })), 'BoxGeometry');
  assert.equal(geometryTypeOf(partOf({ primitive: 'cylinder', radiusTop: 0.2, radiusBottom: 0.4, height: 2 })), 'CylinderGeometry');
  assert.equal(geometryTypeOf(partOf({ primitive: 'sphere', radius: 0.6 })), 'SphereGeometry');
  assert.equal(geometryTypeOf(partOf({ primitive: 'torus', radius: 0.7, tube: 0.1 })), 'TorusGeometry');
  assert.equal(geometryTypeOf(partOf({ primitive: 'octahedron', size: { x: 2, y: 2, z: 2 } })), 'BoxGeometry');
});

test('scene3dProceduralAssetVisual: 部件的位移与旋转直接落到网格上', () => {
  const visual = createSceneAssetVisual(
    {
      id: 'a3',
      parts: [partOf({ colorKey: 'k1', position: { x: 5, y: 6, z: 7 }, rotation: { x: 0.1, y: 0.2, z: 0.3 } })],
    },
    DEFAULT_COLOR,
    colorForKey,
  );
  const mesh = visual.content.children[0];
  assert.deepEqual([mesh.position.x, mesh.position.y, mesh.position.z], [5, 6, 7]);
  assert.deepEqual([mesh.rotation.x, mesh.rotation.y, mesh.rotation.z], [0.1, 0.2, 0.3]);

  const edges = visual.content.children[1];
  assert.deepEqual(edges.position.toArray(), mesh.position.toArray(), '描边跟着实体一起摆');
  assert.deepEqual(edges.rotation.toArray().slice(0, 3), mesh.rotation.toArray().slice(0, 3));
});

test('scene3dProceduralAssetVisual: 每个 colorKey 只建一套材质，同一个键复用', () => {
  const visual = createSceneAssetVisual(
    { id: 'a4', parts: [partOf({ colorKey: 'k1' }), partOf({ colorKey: 'k1' }), partOf({ colorKey: 'k2' })] },
    DEFAULT_COLOR,
    colorForKey,
  );
  assert.deepEqual([...visual.materialsByColorKey.keys()], ['k1', 'k2']);
  assert.deepEqual([...visual.edgeMaterialsByColorKey.keys()], ['k1', 'k2']);

  const meshes = visual.content.children.filter((child) => child instanceof threeRuntime.Mesh);
  assert.equal(meshes[0].material, meshes[1].material, '同色键共用材质实例');
  assert.notEqual(meshes[0].material, meshes[2].material);
});

test('scene3dProceduralAssetVisual: 材质带上粗糙度 / 金属度，舞台类目金属度更高', () => {
  const stage = createSceneAssetVisual({ id: 's', category: 'stage', parts: [partOf({ colorKey: 'k1' })] }, DEFAULT_COLOR, colorForKey);
  const plain = createSceneAssetVisual({ id: 'p', category: 'prop', parts: [partOf({ colorKey: 'k1' })] }, DEFAULT_COLOR, colorForKey);

  assert.equal(stage.materialsByColorKey.get('k1').roughness, 0.55);
  assert.equal(stage.materialsByColorKey.get('k1').metalness, 0.14);
  assert.equal(plain.materialsByColorKey.get('k1').metalness, 0.04);
});

test('scene3dProceduralAssetVisual: 换色会重写实体与描边的颜色，__default 用默认色', () => {
  const visual = createSceneAssetVisual(
    { id: 'a5', parts: [partOf({ colorKey: 'k1' }), partOf()] },
    DEFAULT_COLOR,
    colorForKey,
  );
  applySceneAssetColors(visual, DEFAULT_COLOR, colorForKey);

  assert.equal(visual.materialsByColorKey.get('k1').color.getHex(), 0x00ff00);
  assert.equal(visual.materialsByColorKey.get('__default').color.getHex(), DEFAULT_COLOR.getHex());

  const edgeColor = visual.edgeMaterialsByColorKey.get('k1').color;
  const expectedEdge = new threeRuntime.Color(0x00ff00).offsetHSL(0, 0, -0.18);
  assert.equal(edgeColor.getHex(), expectedEdge.getHex());
  assert.notEqual(edgeColor.getHex(), 0x00ff00, '描边比实体暗一档');
});

test('scene3dProceduralAssetVisual: 换色函数对残缺入参不抛错', () => {
  assert.doesNotThrow(() => applySceneAssetColors(null, DEFAULT_COLOR, colorForKey));
  assert.doesNotThrow(() => applySceneAssetColors({}, DEFAULT_COLOR, colorForKey));
  assert.doesNotThrow(() => applySceneAssetColors({ materialsByColorKey: new Map() }, DEFAULT_COLOR, colorForKey));
});
