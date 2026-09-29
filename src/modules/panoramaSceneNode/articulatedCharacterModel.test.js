import test from 'node:test';
import assert from 'node:assert/strict';
import * as threeRuntime from './threeRuntime.js';
import { buildArticulatedCharacterShell, createCharacterClayMaterial } from './articulatedCharacterModel.js';

test('articulatedCharacterModel: 陶土材质用克隆的颜色，参数固定为粗糙无金属且启用顶点色', () => {
  const color = new threeRuntime.Color(0x123456);
  const material = createCharacterClayMaterial(color);

  assert.equal(material instanceof threeRuntime.MeshStandardMaterial, true);
  assert.equal(material.color.getHex(), 0x123456);
  assert.notEqual(material.color, color, '传入颜色会被克隆一份');
  assert.equal(material.roughness, 0.72);
  assert.equal(material.metalness, 0);
  assert.equal(material.vertexColors, true);
});

test('articulatedCharacterModel: 传进制式值而不是颜色对象时也构造得出来', () => {
  const material = createCharacterClayMaterial(0xff0000);
  assert.equal(material.color.getHex(), 0xff0000);
  assert.equal(material.vertexColors, true);
});

test('articulatedCharacterModel: 先强制刷新世界矩阵，再遍历模型', () => {
  const calls = [];
  const root = {
    updateMatrixWorld(force) {
      calls.push(force);
    },
    traverse() {},
  };

  assert.throws(() => buildArticulatedCharacterShell(root), /人偶模型缺少骨骼/);
  assert.deepEqual(calls, [true]);
});

test('articulatedCharacterModel: 有网格但没有蒙皮骨骼时也报缺骨骼', () => {
  const root = {
    updateMatrixWorld() {},
    traverse(callback) {
      callback({ isMesh: true });
      callback({ isGroup: true });
    },
  };

  assert.throws(() => buildArticulatedCharacterShell(root), /人偶模型缺少骨骼/);
});

test('articulatedCharacterModel: 根节点缺遍历能力时同样抛错而不是静默通过', () => {
  assert.throws(() => buildArticulatedCharacterShell({ updateMatrixWorld() {} }), TypeError);
});
