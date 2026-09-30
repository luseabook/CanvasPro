import test from 'node:test';
import assert from 'node:assert/strict';

import { createCanvasMcpAutoConnection } from './canvasMcpAutoConnection.js';

const settle = () => new Promise((resolve) => setImmediate(resolve));

function makeScheduler() {
  let counter = 0;
  const jobs = new Map();
  return {
    jobs,
    schedule(callback, delay) {
      const id = ++counter;
      jobs.set(id, { callback, delay });
      return id;
    },
    cancel(id) {
      jobs.delete(id);
    },
    take() {
      const entry = jobs.entries().next();
      if (entry.done) return null;
      jobs.delete(entry.value[0]);
      return entry.value[1];
    },
  };
}

function makeHarness(over = {}) {
  const scheduler = makeScheduler();
  const log = { check: 0, enable: [], disable: 0, destroy: 0, changes: [] };
  let emit = () => {};
  const session = {
    checkBinding() {
      log.check += 1;
    },
    async enable(options) {
      log.enable.push(options);
      if (over.enableThrows) throw new Error('boom');
      if (over.enableFails) return false;
      emit({ enabled: true, binding: over.bindingLabel ?? 'b' });
      return true;
    },
    async disable() {
      log.disable += 1;
      emit({ enabled: false });
    },
    async destroy() {
      log.destroy += 1;
    },
  };
  const connection = createCanvasMcpAutoConnection({
    createSession: (listener) => {
      emit = listener;
      return session;
    },
    getBinding: () => over.binding ?? 'binding-1',
    isReady: () => over.ready ?? true,
    onChange: (state) => log.changes.push(state),
    schedule: scheduler.schedule,
    cancel: scheduler.cancel,
  });
  return { connection, scheduler, log };
}

test('构造后立刻排一次零延迟检查且尚未通知', () => {
  const { scheduler, log } = makeHarness();
  assert.equal(scheduler.take().delay, 0);
  assert.deepEqual(log.changes, []);
});

test('绑定状态变化时把 allowGeneration 合并进通知', async () => {
  const { scheduler, log } = makeHarness();
  scheduler.take().callback();
  await settle();
  assert.deepEqual(log.changes, [{ enabled: true, binding: 'b', allowGeneration: false }]);
});

test('未就绪时不做启用并重排一秒', async () => {
  const { scheduler, log } = makeHarness({ ready: false });
  scheduler.take().callback();
  await settle();
  assert.deepEqual(log.enable, []);
  assert.equal(scheduler.take().delay, 1000);
});

test('就绪且拿到绑定后启用一次，随后相同状态不再重复启用', async () => {
  const { scheduler, log } = makeHarness();
  scheduler.take().callback();
  await settle();
  assert.deepEqual(log.enable, [{ allowGeneration: false }]);
  const next = scheduler.take();
  assert.equal(next.delay, 1000);
  next.callback();
  await settle();
  assert.equal(log.enable.length, 1);
  assert.equal(scheduler.take().delay, 1000);
});

test('绑定变化会触发重新启用', async () => {
  let binding = 'binding-1';
  const scheduler = makeScheduler();
  const log = { enable: [] };
  const session = {
    checkBinding() {},
    async enable(options) {
      log.enable.push(options);
      return true;
    },
    async disable() {},
    async destroy() {},
  };
  createCanvasMcpAutoConnection({
    createSession: () => session,
    getBinding: () => binding,
    isReady: () => true,
    onChange: () => {},
    schedule: scheduler.schedule,
    cancel: scheduler.cancel,
  });
  scheduler.take().callback();
  await settle();
  assert.equal(log.enable.length, 1);
  binding = 'binding-2';
  scheduler.take().callback();
  await settle();
  assert.equal(log.enable.length, 2);
});

test('setAllowGeneration 会先禁用再重排立即检查', async () => {
  const { connection, scheduler, log } = makeHarness();
  scheduler.take().callback();
  await settle();
  scheduler.take();
  connection.setAllowGeneration(true);
  assert.equal(log.disable, 1);
  await settle();
  assert.equal(scheduler.take().delay, 0);
});

test('setAllowGeneration 只认严格布尔真', async () => {
  const { connection, scheduler, log } = makeHarness();
  scheduler.take().callback();
  await settle();
  connection.setAllowGeneration(1);
  await settle();
  scheduler.take().callback();
  await settle();
  assert.deepEqual(log.enable.pop(), { allowGeneration: false });
});

test('启用后绑定消失会调用 disable 并重排', async () => {
  const over = { ready: true };
  const { connection, scheduler, log } = makeHarness(over);
  scheduler.take().callback();
  await settle();
  assert.deepEqual(log.enable, [{ allowGeneration: false }]);
  scheduler.take();
  over.ready = false;
  connection.refresh();
  scheduler.take().callback();
  await settle();
  assert.equal(log.disable, 1);
  assert.equal(scheduler.take().delay, 1000);
});

test('启用失败时记录原因并按五秒退避', async () => {
  const { scheduler, log } = makeHarness({ enableThrows: true });
  scheduler.take().callback();
  await settle();
  assert.deepEqual(log.changes.at(-1), {
    enabled: false,
    reason: 'boom',
    allowGeneration: false,
  });
  assert.equal(scheduler.take().delay, 5000);
});

test('enable 返回假值时不记录为已启用，下一轮会再试', async () => {
  const { scheduler, log } = makeHarness({ enableFails: true });
  scheduler.take().callback();
  await settle();
  const next = scheduler.take();
  assert.equal(next.delay, 1000);
  next.callback();
  await settle();
  assert.equal(log.enable.length, 2);
});

test('refresh 触发检查并重排立即任务', async () => {
  const { connection, scheduler, log } = makeHarness();
  scheduler.take();
  connection.refresh();
  assert.equal(log.check, 1);
  assert.equal(scheduler.take().delay, 0);
});

test('destroy 后不再排任务，并调用会话销毁', async () => {
  const { connection, scheduler, log } = makeHarness();
  scheduler.take();
  await connection.destroy();
  assert.equal(log.destroy, 1);
  assert.equal(scheduler.take(), null);
  connection.refresh();
  assert.equal(scheduler.take(), null);
});

test('上一轮启用未结算时跳过本轮并重排', async () => {
  let resolveEnable = null;
  const scheduler = makeScheduler();
  const log = { check: 0, enable: 0 };
  const session = {
    checkBinding() {
      log.check += 1;
    },
    enable() {
      log.enable += 1;
      return new Promise((resolve) => {
        resolveEnable = resolve;
      });
    },
    async disable() {},
    async destroy() {},
  };
  const connection = createCanvasMcpAutoConnection({
    createSession: () => session,
    getBinding: () => 'b',
    isReady: () => true,
    onChange: () => {},
    schedule: scheduler.schedule,
    cancel: scheduler.cancel,
  });
  scheduler.take().callback();
  await settle();
  assert.equal(log.enable, 1);
  connection.refresh();
  scheduler.take().callback();
  await settle();
  assert.equal(log.check, 3);
  assert.equal(log.enable, 1);
  assert.equal(scheduler.take().delay, 1000);
  resolveEnable(true);
  await settle();
  assert.equal(scheduler.take().delay, 1000);
});


for (const status of [401, 403, 404, 405, 501]) {
  test(`unsupported/unauthorized backend ${status} stops automatic retry`, async () => {
    const scheduler = makeScheduler(); let requests = 0;
    const connection = createCanvasMcpAutoConnection({
      isReady: () => true, getBinding: () => 'canvas',
      schedule: scheduler.schedule, cancel: scheduler.cancel,
      createSession: () => ({ checkBinding() {}, disable: async () => {}, destroy: async () => {},
        enable: async () => { requests++; throw Object.assign(new Error('unavailable'), { status }); } }),
    });
    scheduler.take().callback(); await settle();
    assert.equal(requests, 1); assert.equal(scheduler.jobs.size, 0);
    connection.refresh(); assert.equal(scheduler.jobs.size, 0);
    await connection.destroy();
  });
}
test('generation permission must be explicitly enabled', async () => {
  const { connection, scheduler, log } = makeHarness();
  scheduler.take().callback(); await settle();
  assert.equal(log.enable[0].allowGeneration, false);
  connection.setAllowGeneration(true);
  scheduler.take().callback(); await settle();
  assert.equal(log.enable.at(-1).allowGeneration, true);
  await connection.destroy();
});
