import assert from 'node:assert/strict';
import test from 'node:test';

import * as three from '../panoramaSceneNode/threeRuntime.js';
import {
  STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT,
  createStoryboard3DInstanceBatch,
  createStoryboard3DInstanceMatrix,
  disposeStoryboard3DInstanceBatch,
  findStoryboard3DInstancingTemplate,
  refreshStoryboard3DInstanceBatchBounds,
  updateStoryboard3DInstanceTransform,
} from './instanceBatching.js';

const IDENTITY_ELEMENTS = new three.Matrix4().elements;

function makeMesh() {
  return new three.Mesh(new three.BoxGeometry(1, 1, 1), new three.MeshBasicMaterial({ color: 0xffffff }));
}

function matrixTranslation(matrix) {
  return [matrix.elements[12], matrix.elements[13], matrix.elements[14]];
}

function readInstanceTranslation(batch, index) {
  const matrix = new three.Matrix4();
  batch.mesh.getMatrixAt(index, matrix);
  return matrixTranslation(matrix);
}

test('实例批处理：最小批量常量', () => {
  assert.equal(STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT, 3);
});

test('实例批处理：实例矩阵默认单位阵并夹取缩放', () => {
  assert.deepEqual(createStoryboard3DInstanceMatrix().elements, IDENTITY_ELEMENTS);

  const zeroScaled = createStoryboard3DInstanceMatrix({ scale: [0, 0, 0] });
  assert.equal(zeroScaled.elements[0], 0.001);
  assert.equal(zeroScaled.elements[5], 0.001);
  assert.equal(zeroScaled.elements[10], 0.001);

  const fallback = createStoryboard3DInstanceMatrix({ position: ['a', null, undefined], scale: [1, 1, 1] });
  assert.deepEqual(matrixTranslation(fallback), [0, 0, 0]);
});

test('实例批处理：实例矩阵可乘父矩阵', () => {
  const parent = new three.Matrix4().makeTranslation(5, 0, 0);
  const composed = createStoryboard3DInstanceMatrix({ position: [1, 2, 3] }, parent);
  assert.deepEqual(matrixTranslation(composed), [6, 2, 3]);
});

test('实例批处理：单网格可作模板，多网格与蒙皮网格返回 null', () => {
  assert.equal(findStoryboard3DInstancingTemplate(null), null);
  assert.equal(findStoryboard3DInstancingTemplate({}), null);

  const mesh = makeMesh();
  const template = findStoryboard3DInstancingTemplate(mesh);
  assert.ok(template);
  assert.equal(template.geometry, mesh.geometry);
  assert.equal(template.material, mesh.material);
  assert.deepEqual(template.sourceMatrix.elements, mesh.matrixWorld.elements);

  const group = new three.Group();
  group.add(makeMesh(), makeMesh());
  assert.equal(findStoryboard3DInstancingTemplate(group), null);

  const skinned = new three.SkinnedMesh(new three.BoxGeometry(1, 1, 1), new three.MeshBasicMaterial());
  assert.equal(findStoryboard3DInstancingTemplate(skinned), null);
});

test('实例批处理：创建批次复用模板材质', () => {
  const mesh = makeMesh();
  const template = findStoryboard3DInstancingTemplate(mesh);
  const batch = createStoryboard3DInstanceBatch({
    template,
    objects: [
      { id: 'a', transform: { position: [1, 0, 0] } },
      { id: 'b', transform: { position: [2, 0, 0] } },
    ],
  });
  assert.equal(batch.mesh.isInstancedMesh, true);
  assert.equal(batch.mesh.count, 2);
  assert.equal(batch.mesh.name, 'storyboard3d-instance-batch');
  assert.equal(batch.mesh.castShadow, true);
  assert.equal(batch.mesh.receiveShadow, true);
  assert.deepEqual(batch.objectIds, ['a', 'b']);
  assert.deepEqual(batch.mesh.userData.storyboardObjectIds, ['a', 'b']);
  assert.equal(batch.ownedMaterials.length, 0);
  assert.equal(batch.mesh.material, template.material);
  assert.deepEqual(batch.sourceMatrix.elements, template.sourceMatrix.elements);
  assert.deepEqual(readInstanceTranslation(batch, 0), [1, 0, 0]);
  assert.deepEqual(readInstanceTranslation(batch, 1), [2, 0, 0]);
});

test('实例批处理：染色时克隆材质并登记自有材质', () => {
  const mesh = makeMesh();
  const template = findStoryboard3DInstancingTemplate(mesh);
  const batch = createStoryboard3DInstanceBatch({
    template,
    objects: [{ id: 'a' }],
    tint: '#ff0000',
    castShadow: false,
    receiveShadow: false,
  });
  assert.equal(batch.ownedMaterials.length, 1);
  assert.notEqual(batch.mesh.material, template.material);
  assert.equal(batch.mesh.material.color.getHexString(), 'ff0000');
  assert.equal(batch.mesh.castShadow, false);
  assert.equal(batch.mesh.receiveShadow, false);
});

test('实例批处理：模板与对象缺失时抛错', () => {
  assert.throws(() => createStoryboard3DInstanceBatch({}), TypeError);
  assert.throws(() => createStoryboard3DInstanceBatch({}), /An instancing template is required/);

  const template = findStoryboard3DInstancingTemplate(makeMesh());
  assert.throws(
    () => createStoryboard3DInstanceBatch({ template }),
    /At least one storyboard object is required/,
  );
  assert.throws(
    () => createStoryboard3DInstanceBatch({ template, objects: [{ position: [0, 0, 0] }] }),
    /At least one storyboard object is required/,
  );
});

test('实例批处理：刷新包围盒与更新单实例变换', () => {
  const template = findStoryboard3DInstancingTemplate(makeMesh());
  const batch = createStoryboard3DInstanceBatch({
    template,
    objects: [
      { id: 'a', transform: { position: [0, 0, 0] } },
      { id: 'b', transform: { position: [1, 0, 0] } },
    ],
  });
  assert.equal(refreshStoryboard3DInstanceBatchBounds(batch), true);
  assert.equal(refreshStoryboard3DInstanceBatchBounds({}), false);
  assert.equal(refreshStoryboard3DInstanceBatchBounds(null), false);

  assert.equal(updateStoryboard3DInstanceTransform(batch, 'b', { position: [9, 0, 0] }), true);
  assert.deepEqual(readInstanceTranslation(batch, 1), [9, 0, 0]);
  assert.equal(updateStoryboard3DInstanceTransform(batch, 'missing', { position: [1, 1, 1] }), false);
  assert.equal(updateStoryboard3DInstanceTransform(null, 'b', { position: [1, 1, 1] }), false);
  assert.equal(
    updateStoryboard3DInstanceTransform({ objectIds: ['b'] }, 'b', { position: [1, 1, 1] }),
    false,
  );
});

test('实例批处理：销毁释放网格与自有材质', () => {
  const calls = [];
  const batch = {
    mesh: {
      removeFromParent: () => calls.push('removeFromParent'),
      dispose: () => calls.push('mesh.dispose'),
    },
    ownedMaterials: [{ dispose: () => calls.push('material.dispose') }],
  };
  disposeStoryboard3DInstanceBatch(batch);
  assert.deepEqual(calls, ['removeFromParent', 'mesh.dispose', 'material.dispose']);

  disposeStoryboard3DInstanceBatch(null);
  disposeStoryboard3DInstanceBatch({});
  assert.deepEqual(calls, ['removeFromParent', 'mesh.dispose', 'material.dispose']);
});
