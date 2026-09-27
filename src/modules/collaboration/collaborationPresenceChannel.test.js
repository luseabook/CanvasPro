import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationPresenceChannel } from './collaborationPresenceChannel.js';

const tick = () => new Promise((resolve) => setImmediate(resolve));

// 假时钟 now 与假计时器 setTimeout 分开控制：now 用于测延迟，setTimeout 用于排期
function setup(t, over = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const clock = { value: 0 };
  const sent = [];
  const updates = [];
  const errors = [];
  let local = 'local' in over ? over.local : { x: 1 };
  const replies = 'replies' in over ? [...over.replies] : [];
  const cost = 'cost' in over ? [...over.cost] : [];
  const channel = createCollaborationPresenceChannel({
    send: async (payload) => {
      sent.push(payload);
      clock.value += cost.length ? cost.shift() : 10;
      const reply = replies.length ? replies.shift() : { presence: [], locks: {} };
      if (reply instanceof Error) throw reply;
      return reply;
    },
    read: () => local,
    onUpdate: (u) => updates.push(u),
    onError: (e) => errors.push(e.message),
    signal: 'signal' in over ? over.signal : undefined,
    changeDriven: 'changeDriven' in over ? over.changeDriven : false,
    now: () => clock.value,
  });
  return {
    channel,
    sent,
    updates,
    errors,
    clock,
    setLocal: (v) => (local = v),
  };
}

test('createCollaborationPresenceChannel：发送本地状态，回调在线状态和取整后的延迟', async (t) => {
  const { channel, sent, updates } = setup(t, {
    replies: [{ presence: [{ id: 'a' }], locks: { n1: 'a' } }],
    cost: [20.4],
  });
  await channel.start();
  assert.deepEqual(sent, [{ x: 1 }]);
  assert.deepEqual(updates, [
    { presence: [{ id: 'a' }], locks: { n1: 'a' }, latencyMs: 20, presenceStatus: 'online' },
  ]);
  channel.stop();
});

test('createCollaborationPresenceChannel：延迟按 0.7 旧值 + 0.3 新值平滑', async (t) => {
  const { channel, updates } = setup(t, { cost: [100, 0, 0] });
  await channel.start();
  await channel.flush();
  await channel.flush();
  assert.deepEqual(
    updates.map((u) => u.latencyMs),
    [100, 70, 49],
  );
  channel.stop();
});

test('createCollaborationPresenceChannel：非事件驱动时下一次间隔为 max(0, 33 - 耗时)', async (t) => {
  const { channel, sent } = setup(t, { cost: [10, 50, 10] });
  await channel.start();
  t.mock.timers.tick(22);
  await tick();
  assert.equal(sent.length, 1);
  t.mock.timers.tick(1);
  await tick();
  assert.equal(sent.length, 2);
  // 第二次耗时 50ms，下一次立即（0ms）
  t.mock.timers.tick(0);
  await tick();
  assert.equal(sent.length, 3);
  channel.stop();
});

test('createCollaborationPresenceChannel：响应缺 presence 数组或 locks 时报错，1000ms 后重试', async (t) => {
  const { channel, sent, errors, updates } = setup(t, {
    replies: [{ presence: [] }, { presence: {}, locks: {} }, new Error('断网')],
  });
  await channel.start();
  assert.deepEqual(errors, ['鼠标同步响应无效']);
  t.mock.timers.tick(999);
  await tick();
  assert.equal(sent.length, 1);
  t.mock.timers.tick(1);
  await tick();
  assert.deepEqual(errors, ['鼠标同步响应无效', '鼠标同步响应无效']);
  t.mock.timers.tick(1000);
  await tick();
  assert.deepEqual(errors, ['鼠标同步响应无效', '鼠标同步响应无效', '断网']);
  assert.equal(updates.length, 0);
  channel.stop();
});

test('createCollaborationPresenceChannel：事件驱动且本地未变时 3000ms 心跳', async (t) => {
  const { channel, sent } = setup(t, { changeDriven: true });
  await channel.start();
  t.mock.timers.tick(2999);
  await tick();
  assert.equal(sent.length, 1);
  t.mock.timers.tick(1);
  await tick();
  assert.equal(sent.length, 2);
  channel.stop();
});

test('createCollaborationPresenceChannel：事件驱动时 changed 在本地变化后按 33ms 节流发送', async (t) => {
  const { channel, sent, clock, setLocal } = setup(t, { changeDriven: true, cost: [5, 5] });
  await channel.start();
  // 未变化时 changed 不排期
  channel.changed();
  setLocal({ x: 2 });
  clock.value = 20;
  channel.changed();
  t.mock.timers.tick(12);
  await tick();
  assert.equal(sent.length, 1);
  t.mock.timers.tick(1);
  await tick();
  assert.deepEqual(sent, [{ x: 1 }, { x: 2 }]);
  channel.stop();
});

test('createCollaborationPresenceChannel：发送期间本地又变了时按节流间隔再发，不等心跳', async (t) => {
  const state = { local: { x: 1 } };
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const sent = [];
  let now = 0;
  const channel = createCollaborationPresenceChannel({
    send: async (payload) => {
      sent.push(payload);
      now += 10;
      state.local = { x: 2 };
      return { presence: [], locks: {} };
    },
    read: () => state.local,
    onUpdate: () => {},
    onError: () => {},
    changeDriven: true,
    now: () => now,
  });
  await channel.start();
  t.mock.timers.tick(23);
  await tick();
  assert.equal(sent.length, 2);
  channel.stop();
});

test('createCollaborationPresenceChannel：changed 在非事件驱动或正在发送时忽略', async (t) => {
  const { channel, sent, setLocal } = setup(t, { changeDriven: false });
  await channel.start();
  setLocal({ x: 9 });
  channel.changed();
  t.mock.timers.tick(22);
  await tick();
  assert.equal(sent.length, 1);
  channel.stop();
});

test('createCollaborationPresenceChannel：进行中的发送被复用，flush 等它结束后再发一次', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const releases = [];
  const sent = [];
  const channel = createCollaborationPresenceChannel({
    send: (payload) =>
      new Promise((resolve) => {
        sent.push(payload);
        releases.push(() => resolve({ presence: [], locks: {} }));
      }),
    read: () => ({ x: sent.length }),
    onUpdate: () => {},
    onError: () => {},
    now: () => 0,
  });
  const first = channel.start();
  assert.equal(channel.start(), first);
  const flushed = channel.flush();
  releases.shift()();
  await first;
  await tick();
  assert.equal(sent.length, 2);
  releases.shift()();
  await flushed;
  channel.stop();
});

test('createCollaborationPresenceChannel：stop 或 signal 中止后不回调、不排期', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let release;
  const updates = [];
  const errors = [];
  let sends = 0;
  const channel = createCollaborationPresenceChannel({
    send: () => {
      sends++;
      return new Promise((resolve) => (release = resolve));
    },
    read: () => ({}),
    onUpdate: (u) => updates.push(u),
    onError: (e) => errors.push(e),
    now: () => 0,
  });
  const running = channel.start();
  channel.stop();
  release({ presence: [], locks: {} });
  await running;
  t.mock.timers.tick(5000);
  await tick();
  assert.equal(updates.length, 0);
  assert.equal(sends, 1);
  await channel.start();
  assert.equal(sends, 1);
  assert.equal(errors.length, 0);
});

test('createCollaborationPresenceChannel：signal 已中止时 start 不发送', async (t) => {
  const controller = new AbortController();
  controller.abort();
  const { channel, sent, errors } = setup(t, { signal: controller.signal });
  await channel.start();
  await channel.flush();
  assert.equal(sent.length, 0);
  assert.equal(errors.length, 0);
});

test('createCollaborationPresenceChannel：发送期间 signal 中止时吞掉错误、不再排期', async (t) => {
  const controller = new AbortController();
  const { channel, sent, errors } = setup(t, {
    signal: controller.signal,
    replies: [new Error('aborted')],
  });
  const running = channel.start();
  controller.abort();
  await running;
  t.mock.timers.tick(5000);
  await tick();
  assert.equal(sent.length, 1);
  assert.equal(errors.length, 0);
});
