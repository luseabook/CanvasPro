import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TransformInteractionAdapter,
  applyTransformInteractionOptions,
  normalizeTransformInteractionOptions,
} from './transformInteractionAdapter.js';

const QUARTER_TURN = Math.PI / 12;

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, 'expected ' + actual + ' to be近 ' + expected);
}

function closeVector(actual, expected) {
  closeTo(actual.x, expected.x);
  closeTo(actual.y, expected.y);
  closeTo(actual.z, expected.z);
}

test('选项规范化给出平移、世界系、自由约束与开启的吸附', () => {
  assert.deepEqual(normalizeTransformInteractionOptions(), {
    mode: 'translate',
    space: 'world',
    constraint: 'free',
    uniformScale: true,
    groundLock: true,
    snap: {
      enabled: false,
      translation: 0.25,
      rotation: QUARTER_TURN,
      scale: 0.1,
    },
  });
});

test('模式、坐标系与约束的别名与非法值回落', () => {
  assert.equal(normalizeTransformInteractionOptions({ mode: 'move' }).mode, 'translate');
  assert.equal(normalizeTransformInteractionOptions({ mode: ' rotate ' }).mode, 'rotate');
  assert.equal(normalizeTransformInteractionOptions({ mode: 'bogus' }).mode, 'translate');
  assert.equal(normalizeTransformInteractionOptions({ space: 'LOCAL' }).space, 'world');
  assert.equal(normalizeTransformInteractionOptions({ space: ' local ' }).space, 'local');
  assert.equal(normalizeTransformInteractionOptions({ constraint: ' XZ ' }).constraint, 'xz');
  assert.equal(normalizeTransformInteractionOptions({ constraint: 'bogus' }).constraint, 'free');
});

test('等比缩放与地面锁定默认开启，显式 false 才关闭', () => {
  assert.equal(normalizeTransformInteractionOptions({}).uniformScale, true);
  assert.equal(normalizeTransformInteractionOptions({}).groundLock, true);
  assert.equal(normalizeTransformInteractionOptions({ uniformScale: false }).uniformScale, false);
  assert.equal(normalizeTransformInteractionOptions({ groundLock: 0 }).groundLock, true);
});

test('吸附开关为严格真值，步长按正数收敛', () => {
  const off = normalizeTransformInteractionOptions({ snap: { enabled: 1 } });
  assert.equal(off.snap.enabled, false);
  const on = normalizeTransformInteractionOptions({ snap: { enabled: true } });
  assert.equal(on.snap.enabled, true);
  assert.equal(on.snap.translation, 0.25);
  assert.equal(on.snap.scale, 0.1);
  const custom = normalizeTransformInteractionOptions({
    snap: { enabled: true, translation: '0.5', rotation: -3, scale: 0 },
  });
  assert.equal(custom.snap.translation, 0.5);
  assert.equal(custom.snap.rotation, 0);
  assert.equal(custom.snap.scale, 0);
  const invalid = normalizeTransformInteractionOptions({ snap: { translation: 'abc' } });
  assert.equal(invalid.snap.translation, 0.25);
});

test('姿态规范化补齐缺省字段并保持四元数为空', () => {
  assert.deepEqual(applyTransformInteractionOptions(), {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    quaternion: null,
    scale: { x: 1, y: 1, z: 1 },
  });
});

test('姿态规范化收敛非法数值与缩放', () => {
  const pose = applyTransformInteractionOptions(
    {
      position: { x: 'abc', y: 2, z: -1 },
      rotation: { x: NaN, y: 0.5, z: 'z' },
      scale: { x: 0, y: 'abc', z: -5 },
    },
    { groundLock: false },
  );
  assert.deepEqual(pose.position, { x: 0, y: 2, z: -1 });
  assert.deepEqual(pose.rotation, { x: 0, y: 0.5, z: 0 });
  assert.deepEqual(pose.scale, { x: 0.01, y: 1, z: 0.01 });
  const scalar = applyTransformInteractionOptions({ scale: 2 });
  assert.deepEqual(scalar.scale, { x: 2, y: 2, z: 2 });
  const flooredScalar = applyTransformInteractionOptions({ scale: 0.005 });
  assert.deepEqual(flooredScalar.scale, { x: 0.01, y: 0.01, z: 0.01 });
});

test('平移模式下地面锁定把 y 归零', () => {
  const locked = applyTransformInteractionOptions({ position: { x: 3, y: 7, z: -2 } });
  assert.equal(locked.position.y, 0);
  assert.deepEqual(locked.position, { x: 3, y: 0, z: -2 });
  const free = applyTransformInteractionOptions({ position: { x: 3, y: 7, z: -2 } }, { groundLock: false });
  assert.equal(free.position.y, 7);
  const rotating = applyTransformInteractionOptions({ position: { x: 3, y: 7, z: -2 } }, { mode: 'rotate' });
  assert.equal(rotating.position.y, 7);
});

test('缩放模式按约束轴取等比基准', () => {
  const pose = { scale: { x: 1.5, y: 0.2, z: 3 } };
  assert.deepEqual(applyTransformInteractionOptions(pose, { mode: 'scale' }).scale, {
    x: 1.5,
    y: 1.5,
    z: 1.5,
  });
  const byY = applyTransformInteractionOptions(pose, { mode: 'scale', constraint: 'yz' });
  assert.deepEqual(byY.scale, { x: 0.2, y: 0.2, z: 0.2 });
  const independent = applyTransformInteractionOptions(pose, {
    mode: 'scale',
    uniformScale: false,
  });
  assert.deepEqual(independent.scale, { x: 1.5, y: 0.2, z: 3 });
});

test('平移吸附把坐标对齐到步长', () => {
  const pose = { position: { x: 0.3, y: 1.1, z: -0.6 } };
  const options = { groundLock: false, snap: { enabled: true, translation: 0.25 } };
  closeVector(applyTransformInteractionOptions(pose, options).position, { x: 0.25, y: 1, z: -0.5 });
  const grounded = applyTransformInteractionOptions(pose, { snap: { enabled: true, translation: 0.25 } });
  closeVector(grounded.position, { x: 0.25, y: 0, z: -0.5 });
});

test('旋转吸附对齐角度并清空四元数', () => {
  const pose = {
    rotation: { x: 0.1, y: 1.6, z: -0.05 },
    quaternion: { x: 0, y: 0, z: 0.1, w: 0.995 },
  };
  const result = applyTransformInteractionOptions(pose, {
    mode: 'rotate',
    snap: { enabled: true },
  });
  closeVector(result.rotation, { x: 0, y: Math.PI / 2, z: 0 });
  assert.equal(result.quaternion, null);
  const untouched = applyTransformInteractionOptions(pose, { mode: 'rotate' });
  assert.deepEqual(untouched.rotation, { x: 0.1, y: 1.6, z: -0.05 });
  assert.deepEqual(untouched.quaternion, { x: 0, y: 0, z: 0.1, w: 0.995 });
});

test('缩放吸附对齐步长并遵守 0.01 下限', () => {
  const pose = { scale: { x: 1.04, y: 0.97, z: 1.5 } };
  const uniform = applyTransformInteractionOptions(pose, {
    mode: 'scale',
    snap: { enabled: true, scale: 0.1 },
  });
  closeVector(uniform.scale, { x: 1, y: 1, z: 1 });
  const independent = applyTransformInteractionOptions(pose, {
    mode: 'scale',
    uniformScale: false,
    snap: { enabled: true, scale: 0.1 },
  });
  closeVector(independent.scale, { x: 1, y: 1, z: 1.5 });
  const floored = applyTransformInteractionOptions(
    { scale: { x: 0.02, y: 0.02, z: 0.02 } },
    { mode: 'scale', uniformScale: false, snap: { enabled: true, scale: 0.5 } },
  );
  assert.equal(floored.scale.x, 0.01);
  assert.equal(floored.scale.y, 0.01);
  assert.equal(floored.scale.z, 0.01);
});

test('吸附关闭时仍然执行地面锁定与等比缩放', () => {
  const translated = applyTransformInteractionOptions(
    { position: { x: 0.31, y: 4, z: 0.44 } },
    { snap: { enabled: false } },
  );
  assert.deepEqual(translated.position, { x: 0.31, y: 0, z: 0.44 });
  const scaled = applyTransformInteractionOptions(
    { scale: { x: 1.5, y: 0.2, z: 3 } },
    { mode: 'scale', snap: { enabled: false } },
  );
  assert.deepEqual(scaled.scale, { x: 1.5, y: 1.5, z: 1.5 });
});

test('适配器默认状态为未拖拽且参数为缺省值', () => {
  const adapter = new TransformInteractionAdapter();
  assert.deepEqual(adapter.getState(), {
    options: normalizeTransformInteractionOptions(),
    dragging: false,
    objectType: null,
    objectId: null,
  });
});

test('适配器 begin 拒绝缺少对象类型或 id 的调用', () => {
  const adapter = new TransformInteractionAdapter();
  assert.equal(adapter.begin(), false);
  assert.equal(adapter.begin({ objectType: 'prop' }), false);
  assert.equal(adapter.begin({ objectId: 'p1' }), false);
  assert.equal(adapter.getState().dragging, false);
});

test('适配器 begin 关闭轨道控制并接住约束配置', () => {
  const orbit = [];
  const adapter = new TransformInteractionAdapter({ setOrbitEnabled: (value) => orbit.push(value) });
  assert.equal(adapter.begin({ objectType: 'prop', objectId: 'p1', constraint: 'xz' }), true);
  assert.deepEqual(orbit, [false]);
  const state = adapter.getState();
  assert.equal(state.dragging, true);
  assert.equal(state.objectType, 'prop');
  assert.equal(state.objectId, 'p1');
  assert.equal(state.options.constraint, 'xz');
});

test('适配器 begin 会先取消进行中的拖拽', () => {
  const cancelled = [];
  const adapter = new TransformInteractionAdapter({ onCancel: (info) => cancelled.push(info) });
  adapter.begin({ objectType: 'prop', objectId: 'p1', pose: { position: { x: 1, y: 1, z: 1 } } });
  adapter.begin({ objectType: 'light', objectId: 'l1' });
  assert.equal(cancelled.length, 1);
  assert.equal(cancelled[0].objectType, 'prop');
  assert.equal(cancelled[0].objectId, 'p1');
  assert.deepEqual(cancelled[0].pose.position, { x: 1, y: 1, z: 1 });
  assert.equal(adapter.getState().objectId, 'l1');
});

test('适配器 preview 在未拖拽时返回 null，否则回传应用后的姿态', () => {
  const previews = [];
  const adapter = new TransformInteractionAdapter({ onPreview: (info) => previews.push(info) });
  assert.equal(adapter.preview({ position: { x: 1, y: 1, z: 1 } }), null);
  adapter.begin({ objectType: 'prop', objectId: 'p1' });
  const applied = adapter.preview({ position: { x: 2, y: 5, z: -3 } });
  assert.deepEqual(applied.position, { x: 2, y: 0, z: -3 });
  assert.equal(previews.length, 1);
  assert.equal(previews[0].objectType, 'prop');
  assert.equal(previews[0].objectId, 'p1');
  assert.equal(previews[0].pose, applied);
  assert.deepEqual(previews[0].options, adapter.getState().options);
});

test('适配器 commit 提交预览姿态、恢复轨道控制并清空拖拽', () => {
  const orbit = [];
  const commits = [];
  const adapter = new TransformInteractionAdapter({
    setOrbitEnabled: (value) => orbit.push(value),
    onCommit: (info) => commits.push(info),
  });
  assert.equal(adapter.commit(), null);
  adapter.begin({ objectType: 'prop', objectId: 'p1', pose: { position: { x: 0, y: 0, z: 0 } } });
  adapter.preview({ position: { x: 4, y: 9, z: 0 } });
  const result = adapter.commit();
  assert.deepEqual(result.pose.position, { x: 4, y: 0, z: 0 });
  assert.equal(result.objectType, 'prop');
  assert.equal(result.objectId, 'p1');
  assert.deepEqual(commits, [result]);
  assert.deepEqual(orbit, [false, true]);
  assert.equal(adapter.getState().dragging, false);
  assert.equal(adapter.commit(), null);
});

test('适配器 commit 在未 preview 时提交基准姿态', () => {
  const adapter = new TransformInteractionAdapter();
  adapter.begin({ objectType: 'prop', objectId: 'p1', pose: { position: { x: 1, y: 2, z: 3 } } });
  const result = adapter.commit();
  assert.deepEqual(result.pose.position, { x: 1, y: 2, z: 3 });
});

test('适配器 cancel 回到基准姿态并同时通知预览与取消', () => {
  const orbit = [];
  const previews = [];
  const cancels = [];
  const base = { position: { x: 1, y: 2, z: 3 } };
  const adapter = new TransformInteractionAdapter({
    setOrbitEnabled: (value) => orbit.push(value),
    onPreview: (info) => previews.push(info),
    onCancel: (info) => cancels.push(info),
  });
  assert.equal(adapter.cancel(), null);
  adapter.begin({ objectType: 'prop', objectId: 'p1', pose: base });
  adapter.preview({ position: { x: 9, y: 9, z: 9 } });
  const result = adapter.cancel();
  assert.deepEqual(result.pose.position, { x: 1, y: 2, z: 3 });
  assert.equal(previews.length, 2);
  assert.deepEqual(previews[1].pose, result.pose);
  assert.deepEqual(cancels, [result]);
  assert.deepEqual(orbit, [false, true]);
  assert.equal(adapter.getState().dragging, false);
});

test('适配器 configure 合并选项与吸附步长', () => {
  const adapter = new TransformInteractionAdapter();
  adapter.configure({ mode: 'scale', snap: { enabled: true, scale: 0.5 } });
  const state = adapter.getState();
  assert.equal(state.options.mode, 'scale');
  assert.equal(state.options.snap.enabled, true);
  assert.equal(state.options.snap.scale, 0.5);
  assert.equal(state.options.snap.translation, 0.25);
  assert.equal(state.options.space, 'world');
});

test('适配器 configure 的结果作用到后续 preview', () => {
  const adapter = new TransformInteractionAdapter();
  adapter.configure({ snap: { enabled: true, translation: 1 } });
  adapter.begin({ objectType: 'prop', objectId: 'p1' });
  const applied = adapter.preview({ position: { x: 1.4, y: 2.6, z: 0 } });
  assert.deepEqual(applied.position, { x: 1, y: 0, z: 0 });
});
