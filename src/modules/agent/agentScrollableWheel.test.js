import assert from 'node:assert/strict';
import test from 'node:test';

import { createAgentScrollableWheelHandler } from './agentScrollableWheel.js';

function createScrollable({ scrollHeight = 1000, clientHeight = 200, scrollTop = 0 } = {}) {
  return { scrollHeight, clientHeight, scrollTop };
}

function createWheel(deltaY, extra = {}) {
  const calls = [];
  return {
    event: {
      deltaY,
      preventDefault: () => calls.push('preventDefault'),
      stopPropagation: () => calls.push('stopPropagation'),
      ...extra,
    },
    calls,
  };
}

test('滚轮接管：deltaMode 缺省按 1 倍像素滚动', () => {
  const el = createScrollable();
  createAgentScrollableWheelHandler(el)(createWheel(-120).event);
  assert.equal(el.scrollTop, 0);
  createAgentScrollableWheelHandler(el)(createWheel(50).event);
  assert.equal(el.scrollTop, 50);
});

test('滚轮接管：deltaMode 1 按行因子 16 放大', () => {
  const el = createScrollable({ scrollTop: 10 });
  createAgentScrollableWheelHandler(el)(createWheel(3, { deltaMode: 1 }).event);
  assert.equal(el.scrollTop, 10 + 3 * 16);
});

test('滚轮接管：deltaMode 2 按 clientHeight 翻页', () => {
  const el = createScrollable();
  createAgentScrollableWheelHandler(el)(createWheel(1, { deltaMode: 2 }).event);
  assert.equal(el.scrollTop, 200);
});

test('滚轮接管：clientHeight 缺失或为 0 时页因子至少为 1', () => {
  const el = createScrollable({ clientHeight: 0, scrollTop: 5 });
  createAgentScrollableWheelHandler(el)(createWheel(2, { deltaMode: 2 }).event);
  assert.equal(el.scrollTop, 5 + 2 * 1);
});

test('滚轮接管：上下各钳制到可滚动区间', () => {
  const el = createScrollable({ scrollHeight: 1000, clientHeight: 200, scrollTop: 780 });
  createAgentScrollableWheelHandler(el)(createWheel(500).event);
  assert.equal(el.scrollTop, 800);
  createAgentScrollableWheelHandler(el)(createWheel(-500).event);
  assert.equal(el.scrollTop, 300);
});

test('滚轮接管：无滚动余量时不触发 preventDefault', () => {
  const el = createScrollable({ scrollHeight: 200, clientHeight: 200 });
  const { event, calls } = createWheel(60);
  createAgentScrollableWheelHandler(el)(event);
  assert.equal(el.scrollTop, 0);
  assert.deepEqual(calls, ['stopPropagation']);
});

test('滚轮接管：已在底部时向下滚同样不拦截默认行为', () => {
  const el = createScrollable({ scrollTop: 800 });
  const { event, calls } = createWheel(60);
  createAgentScrollableWheelHandler(el)(event);
  assert.equal(el.scrollTop, 800);
  assert.deepEqual(calls, ['stopPropagation']);
});

test('滚轮接管：deltaY 为 0 时回退到 deltaX', () => {
  const el = createScrollable();
  createAgentScrollableWheelHandler(el)(createWheel(0, { deltaX: 45 }).event);
  assert.equal(el.scrollTop, 45);
});

test('滚轮接管：元素尺寸字段缺失时按 0 处理且仍冒泡阻断', () => {
  const el = {};
  const { event, calls } = createWheel(30);
  createAgentScrollableWheelHandler(el)(event);
  assert.equal(el.scrollTop, undefined);
  assert.deepEqual(calls, ['stopPropagation']);
});

test('滚轮接管：事件缺少 preventDefault / stopPropagation 时不抛错', () => {
  const el = createScrollable();
  assert.doesNotThrow(() => createAgentScrollableWheelHandler(el)({ deltaY: 100 }));
  assert.equal(el.scrollTop, 100);
});
