import test from 'node:test';
import assert from 'node:assert/strict';

import { applyCharacterBodyProfile, captureCharacterModelBodyProfileBase } from './characterBodyProfile.js';

function makeVec(x = 1, y = 1, z = 1) {
  return {
    x,
    y,
    z,
    set(nextX, nextY, nextZ) {
      this.x = nextX;
      this.y = nextY;
      this.z = nextZ;
      return this;
    },
    multiplyScalar(scale) {
      this.x *= scale;
      this.y *= scale;
      this.z *= scale;
      return this;
    },
  };
}

function xyz(vector) {
  return { x: vector.x, y: vector.y, z: vector.z };
}

function makeScene(over = {}) {
  const proxyRoot = { scale: makeVec() };
  const headPart = { scale: makeVec() };
  const scene = {
    proxyRoot,
    parts: { head: headPart },
    ...over,
  };
  return { scene, proxyRoot, headPart };
}

test('captureCharacterModelBodyProfileBase 读取根缩放，无 Head 时头部缩放为 null', () => {
  const modelRoot = {
    scale: makeVec(1.5, 2, 0.5),
    getObjectByName: () => null,
  };
  assert.deepEqual(captureCharacterModelBodyProfileBase(modelRoot), {
    rootScale: { x: 1.5, y: 2, z: 0.5 },
    headScale: null,
  });
  assert.deepEqual(captureCharacterModelBodyProfileBase(null), {
    rootScale: { x: 1, y: 1, z: 1 },
    headScale: null,
  });
});

test('captureCharacterModelBodyProfileBase 对非法缩放回落为 1', () => {
  const modelRoot = {
    scale: { x: 0, y: 'abc', z: undefined },
    getObjectByName: () => ({ scale: { x: 0, y: NaN, z: 3 } }),
  };
  assert.deepEqual(captureCharacterModelBodyProfileBase(modelRoot), {
    rootScale: { x: 1, y: 1, z: 1 },
    headScale: { x: 1, y: 1, z: 3 },
  });
});

test('applyCharacterBodyProfile 默认外形等比保持原状', () => {
  const { scene, proxyRoot, headPart } = makeScene();
  applyCharacterBodyProfile(scene);
  assert.deepEqual(xyz(proxyRoot.scale), { x: 1, y: 1, z: 1 });
  assert.deepEqual(xyz(headPart.scale), { x: 1, y: 1, z: 1 });
  assert.equal(scene.modelBodyProfileBase, undefined);
});

test('applyCharacterBodyProfile 按身高与基准身高之比缩放', () => {
  const { scene, proxyRoot } = makeScene();
  applyCharacterBodyProfile(scene, { height: 0.96 });
  assert.deepEqual(xyz(proxyRoot.scale), { x: 0.5, y: 0.5, z: 0.5 });
});

test('applyCharacterBodyProfile 肩宽与胯宽取平均后再乘身高比', () => {
  const { scene, proxyRoot } = makeScene();
  applyCharacterBodyProfile(scene, { height: 1.92, shoulderScale: 1.2, hipScale: 0.8 });
  assert.deepEqual(xyz(proxyRoot.scale), { x: 1, y: 1, z: 1 });
  const wider = makeScene();
  applyCharacterBodyProfile(wider.scene, { shoulderScale: 2, hipScale: 1.9 });
  assert.deepEqual(xyz(wider.proxyRoot.scale), { x: 1.35, y: 1, z: 1 });
});

test('applyCharacterBodyProfile 身高按上下限收敛', () => {
  const low = makeScene();
  applyCharacterBodyProfile(low.scene, { height: 0.1 });
  assert.ok(Math.abs(low.proxyRoot.scale.x - 0.55 / 1.92) < 1e-12);
  assert.equal(low.proxyRoot.scale.x, low.proxyRoot.scale.y);
  const high = makeScene();
  applyCharacterBodyProfile(high.scene, { height: 99 });
  assert.ok(Math.abs(high.proxyRoot.scale.y - 2.3 / 1.92) < 1e-12);
});

test('applyCharacterBodyProfile 深度与头身比例按上下限收敛', () => {
  const shallow = makeScene();
  applyCharacterBodyProfile(shallow.scene, { depthScale: 0.1, headScale: 0.1 });
  assert.deepEqual(xyz(shallow.proxyRoot.scale), { x: 1, y: 1, z: 0.75 });
  assert.deepEqual(xyz(shallow.headPart.scale), { x: 0.85, y: 0.85, z: 0.85 });
  const deep = makeScene();
  applyCharacterBodyProfile(deep.scene, { depthScale: 9, headScale: 9 });
  assert.deepEqual(xyz(deep.proxyRoot.scale), { x: 1, y: 1, z: 1.25 });
  assert.deepEqual(xyz(deep.headPart.scale), { x: 1.45, y: 1.45, z: 1.45 });
});

test('applyCharacterBodyProfile 对非法外形参数回落默认值', () => {
  const { scene, proxyRoot } = makeScene();
  applyCharacterBodyProfile(scene, {
    height: 'abc',
    shoulderScale: {},
    hipScale: 'abc',
    depthScale: NaN,
    headScale: undefined,
  });
  assert.deepEqual(xyz(proxyRoot.scale), { x: 1, y: 1, z: 1 });
  const coerced = makeScene();
  applyCharacterBodyProfile(coerced.scene, { hipScale: null, headScale: [] });
  assert.deepEqual(xyz(coerced.proxyRoot.scale), { x: 0.825, y: 1, z: 1 });
  assert.deepEqual(xyz(coerced.headPart.scale), { x: 0.85, y: 0.85, z: 0.85 });
});

test('applyCharacterBodyProfile 无模型根时只改代理骨骼', () => {
  const { scene, proxyRoot, headPart } = makeScene();
  applyCharacterBodyProfile(scene, { height: 1.92, headScale: 1.2 });
  assert.deepEqual(xyz(proxyRoot.scale), { x: 1, y: 1, z: 1 });
  assert.deepEqual(xyz(headPart.scale), { x: 1.2, y: 1.2, z: 1.2 });
  assert.equal('modelRoot' in scene, false);
});

test('applyCharacterBodyProfile 传入空对象时直接返回', () => {
  assert.equal(applyCharacterBodyProfile(null), undefined);
  assert.equal(applyCharacterBodyProfile(undefined, { height: 2 }), undefined);
});

test('applyCharacterBodyProfile 用捕获的基准缩放驱动模型根', () => {
  const headObj = { scale: makeVec(1, 1, 1) };
  const modelRoot = {
    scale: makeVec(1, 1, 1),
    getObjectByName: (name) => (name === 'Head' ? headObj : null),
    matrixUpdates: [],
    updateMatrixWorld(force) {
      this.matrixUpdates.push(force);
    },
  };
  const { scene } = makeScene({ modelRoot });
  applyCharacterBodyProfile(scene, { height: 0.96, headScale: 2 });
  assert.deepEqual(xyz(modelRoot.scale), { x: 0.5, y: 0.5, z: 0.5 });
  assert.deepEqual(xyz(headObj.scale), { x: 1.45, y: 1.45, z: 1.45 });
  assert.deepEqual(modelRoot.matrixUpdates, [true]);
  assert.deepEqual(scene.modelBodyProfileBase, {
    rootScale: { x: 1, y: 1, z: 1 },
    headScale: { x: 1, y: 1, z: 1 },
  });
});

test('applyCharacterBodyProfile 用 Head 骨骼的基准缩放乘上头身比例', () => {
  const headObj = { scale: makeVec(2, 4, 8) };
  const modelRoot = { scale: makeVec(1, 1, 1), getObjectByName: () => headObj };
  const { scene } = makeScene({ modelRoot });
  applyCharacterBodyProfile(scene, { height: 1.92, headScale: 1.25 });
  assert.deepEqual(xyz(headObj.scale), { x: 2.5, y: 5, z: 10 });
  assert.deepEqual(scene.modelBodyProfileBase.headScale, { x: 2, y: 4, z: 8 });
});

test('applyCharacterBodyProfile 基准缩放只捕获一次', () => {
  const modelRoot = { scale: makeVec(2, 2, 2), getObjectByName: () => null };
  const { scene } = makeScene({ modelRoot });
  applyCharacterBodyProfile(scene, { height: 1.92 });
  assert.deepEqual(xyz(modelRoot.scale), { x: 2, y: 2, z: 2 });
  modelRoot.scale = makeVec(9, 9, 9);
  applyCharacterBodyProfile(scene, { height: 1.92 });
  assert.deepEqual(xyz(modelRoot.scale), { x: 2, y: 2, z: 2 });
  assert.deepEqual(scene.modelBodyProfileBase.rootScale, { x: 2, y: 2, z: 2 });
});

test('applyCharacterBodyProfile 模型根无 Head 子对象时只缩放根', () => {
  const modelRoot = { scale: makeVec(1, 1, 1), getObjectByName: () => null };
  const { scene } = makeScene({ modelRoot });
  applyCharacterBodyProfile(scene, { height: 1.92, headScale: 1.3 });
  assert.deepEqual(xyz(modelRoot.scale), { x: 1, y: 1, z: 1 });
  assert.equal(scene.modelBodyProfileBase.headScale, null);
});

test('applyCharacterBodyProfile 对缺少 updateMatrixWorld 的模型根保持容错', () => {
  const modelRoot = { scale: makeVec(1, 1, 1), getObjectByName: () => null };
  const { scene } = makeScene({ modelRoot });
  assert.equal(applyCharacterBodyProfile(scene, { height: 1.92 }), undefined);
  assert.deepEqual(xyz(modelRoot.scale), { x: 1, y: 1, z: 1 });
});
