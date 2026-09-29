import test from 'node:test';
import assert from 'node:assert/strict';

import { createViewportPreviewCoordinator } from './viewportPreviewCoordinator.js';

function makeCoordinator(over = {}) {
  const calls = { begin: [], update: [], flush: 0 };
  const coordinator = createViewportPreviewCoordinator({
    beginPreview: (viewport) => calls.begin.push(viewport),
    updatePreview: (viewport) => calls.update.push(viewport),
    flushPreview: () => {
      calls.flush += 1;
      return over.flushed;
    },
    getPreview: over.getPreview,
    isPreviewActive: over.isPreviewActive,
  });
  return { coordinator, calls };
}

test('acquire 缺少所有者时返回 null 且不登记', () => {
  const { coordinator, calls } = makeCoordinator();
  assert.equal(coordinator.acquire(null, { x: 1, y: 1 }), null);
  assert.equal(coordinator.acquire(undefined, { x: 1, y: 1 }), null);
  assert.equal(coordinator.getActiveOwner(), null);
  assert.deepEqual(calls.begin, []);
});

test('acquire 用兜底视口开始预览并返回副本', () => {
  const { coordinator, calls } = makeCoordinator();
  const fallback = { x: 10, y: 20 };
  const acquired = coordinator.acquire('drag', fallback);
  assert.deepEqual(acquired, { x: 10, y: 20 });
  assert.notEqual(acquired, fallback);
  assert.deepEqual(calls.begin, [{ x: 10, y: 20 }]);
  assert.equal(coordinator.getActiveOwner(), 'drag');
});

test('acquire 优先 getPreview 而不是兜底', () => {
  const { coordinator, calls } = makeCoordinator({ getPreview: () => ({ x: 1, y: 2 }) });
  assert.deepEqual(coordinator.acquire('pan', { x: 99, y: 99 }), { x: 1, y: 2 });
  assert.deepEqual(calls.begin, [{ x: 1, y: 2 }]);
});

test('同一所有者重复 acquire 只回副本，不重复 begin', () => {
  const { coordinator, calls } = makeCoordinator({ getPreview: () => ({ x: 5, y: 6 }) });
  coordinator.acquire('drag', { x: 1, y: 1 });
  const again = coordinator.acquire('drag', { x: 2, y: 2 });
  assert.deepEqual(again, { x: 5, y: 6 });
  assert.equal(calls.begin.length, 1);
});

test('已有外部预览在跑时 acquire 放弃接管', () => {
  const { coordinator, calls } = makeCoordinator({ isPreviewActive: () => true });
  assert.equal(coordinator.acquire('drag', { x: 1, y: 1 }), null);
  assert.equal(coordinator.getActiveOwner(), null);
  assert.deepEqual(calls.begin, []);
});

test('外部预览未在跑且无可用视口时 acquire 返回 null', () => {
  const { coordinator, calls } = makeCoordinator({ isPreviewActive: () => false });
  assert.equal(coordinator.acquire('drag', null), null);
  assert.equal(coordinator.getActiveOwner(), null);
  assert.deepEqual(calls.begin, []);
});

test('update 只接受当前所有者与非空视口', () => {
  const { coordinator, calls } = makeCoordinator();
  coordinator.acquire('drag', { x: 0, y: 0 });
  assert.equal(coordinator.update('other', { x: 1, y: 1 }), false);
  assert.equal(coordinator.update('drag', null), false);
  assert.deepEqual(calls.update, []);
  assert.equal(coordinator.update('drag', { x: 3, y: 4 }), true);
  assert.deepEqual(calls.update, [{ x: 3, y: 4 }]);
});

test('update 的快照与传入对象解耦', () => {
  const { coordinator, calls } = makeCoordinator();
  coordinator.acquire('drag', { x: 0, y: 0 });
  const live = { x: 7, y: 8 };
  coordinator.update('drag', live);
  live.x = 100;
  assert.deepEqual(calls.update[0], { x: 7, y: 8 });
});

test('commit 优先用 flushPreview 的结果并清空所有权', () => {
  const { coordinator, calls } = makeCoordinator({ flushed: { x: 30, y: 40 } });
  coordinator.acquire('drag', { x: 1, y: 1 });
  coordinator.update('drag', { x: 2, y: 2 });
  assert.deepEqual(coordinator.commit('drag'), { x: 30, y: 40 });
  assert.equal(calls.flush, 1);
  assert.equal(coordinator.getActiveOwner(), null);
});

test('flushPreview 无结果时 commit 回落到最后登记的快照', () => {
  const { coordinator } = makeCoordinator();
  coordinator.acquire('drag', { x: 1, y: 1 });
  coordinator.update('drag', { x: 2, y: 2 });
  assert.deepEqual(coordinator.commit('drag'), { x: 2, y: 2 });
});

test('非当前所有者的 commit 返回 null 且不动状态', () => {
  const { coordinator, calls } = makeCoordinator();
  coordinator.acquire('drag', { x: 1, y: 1 });
  assert.equal(coordinator.commit('other'), null);
  assert.equal(calls.flush, 0);
  assert.equal(coordinator.getActiveOwner(), 'drag');
});

test('commit 清空后再次 commit 返回 null', () => {
  const { coordinator } = makeCoordinator();
  coordinator.acquire('drag', { x: 1, y: 1 });
  assert.deepEqual(coordinator.commit('drag'), { x: 1, y: 1 });
  assert.equal(coordinator.commit('drag'), null);
});

test('update 自身也会刷新缓存，供后续 commit 复用', () => {
  const { coordinator } = makeCoordinator();
  coordinator.acquire('drag', { x: 1, y: 1 });
  coordinator.update('drag', { x: 11, y: 12 });
  assert.deepEqual(coordinator.acquire('drag'), { x: 11, y: 12 });
  assert.deepEqual(coordinator.commit('drag'), { x: 11, y: 12 });
});
