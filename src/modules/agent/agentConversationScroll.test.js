import assert from 'node:assert/strict';
import test from 'node:test';

import { scrollAgentMessageListTo, scrollAgentMessageListToEnd } from './agentConversationScroll.js';

function createList({ scrollHeight = 500, scrollTop = 0, style = {} } = {}) {
  const calls = [];
  const observedBehaviorAtWrite = [];
  const target = { scrollHeight, scrollTop };
  Object.defineProperty(target, 'scrollTop', {
    get: () => scrollTop,
    set: (value) => {
      scrollTop = value;
      observedBehaviorAtWrite.push(style.scrollBehavior);
    },
  });
  style.removeProperty = (name) => {
    calls.push(name);
    delete style[name === 'scroll-behavior' ? 'scrollBehavior' : name];
  };
  target.style = style;
  return { target, calls, observedBehaviorAtWrite };
}

test('消息列表滚动：null 元素直接返回不抛错', () => {
  assert.doesNotThrow(() => scrollAgentMessageListTo(null, 100));
  assert.doesNotThrow(() => scrollAgentMessageListToEnd(null));
});

test('消息列表滚动：ToEnd 落到 scrollHeight 尾部', () => {
  const { target, observedBehaviorAtWrite } = createList({ scrollHeight: 820 });
  scrollAgentMessageListToEnd(target);
  assert.equal(target.scrollTop, 820);
  assert.deepEqual(observedBehaviorAtWrite, ['auto']);
});

test('消息列表滚动：缺失 scrollHeight 时按 0 处理', () => {
  const { target } = createList({});
  target.scrollHeight = undefined;
  scrollAgentMessageListToEnd(target);
  assert.equal(target.scrollTop, 0);
});

test('消息列表滚动：写入期间强制 auto 以避免平滑动画', () => {
  const { target, observedBehaviorAtWrite } = createList({ style: { scrollBehavior: 'smooth' } });
  scrollAgentMessageListTo(target, 120);
  assert.deepEqual(observedBehaviorAtWrite, ['auto']);
  assert.equal(target.style.scrollBehavior, 'smooth');
});

test('消息列表滚动：原本无行为声明时调用 removeProperty 清理', () => {
  const { target, calls } = createList({});
  scrollAgentMessageListTo(target, 40);
  assert.equal(target.scrollTop, 40);
  assert.deepEqual(calls, ['scroll-behavior']);
  assert.equal(target.style.scrollBehavior, undefined);
});

test('消息列表滚动：无 removeProperty 时回退为空串', () => {
  const style = { scrollBehavior: '' };
  const list = { scrollHeight: 10, scrollTop: 0, style };
  scrollAgentMessageListTo(list, 7);
  assert.equal(list.scrollTop, 7);
  assert.equal(style.scrollBehavior, '');
});

test('消息列表滚动：完全没有 style 对象时仍写入 scrollTop', () => {
  const list = { scrollHeight: 99, scrollTop: 3 };
  scrollAgentMessageListTo(list, 99);
  assert.equal(list.scrollTop, 99);
  assert.equal(list.style, undefined);
});
