import test from 'node:test';
import assert from 'node:assert/strict';
import { createDesktopEventPollClient } from './desktopEventPollApi.js';

/** 手动时钟：客户端只依赖 setTimeout/clearTimeout，用队列精确控制何时触发。 */
function createTimerHost() {
  let sequence = 0;
  const jobs = new Map();
  return {
    setTimeout(handler) {
      const id = ++sequence;
      jobs.set(id, handler);
      return id;
    },
    clearTimeout(id) {
      jobs.delete(id);
    },
    get pending() {
      return jobs.size;
    },
    async runAll() {
      for (let round = 0; round < 8 && jobs.size > 0; round += 1) {
        const pending = [...jobs.values()];
        jobs.clear();
        for (const handler of pending) await handler();
        await new Promise((resolve) => setImmediate(resolve));
      }
    },
  };
}

test('desktopEventPoll: 同一路径的多个订阅只发一次批量请求', async () => {
  const timerHost = createTimerHost();
  const batches = [];
  const client = createDesktopEventPollClient({
    timerHost: timerHost,
    requestBatch: async (payload) => {
      batches.push(payload);
      return { updates: { '/api/v2/desktop/media-task/list': { value: ['task-1'] } }, failed: [] };
    },
  });
  const first = client.read('/api/v2/desktop/media-task/list');
  const second = client.read('/api/v2/desktop/media-task/list');
  await timerHost.runAll();
  assert.deepEqual(await first, ['task-1']);
  assert.deepEqual(await second, ['task-1']);
  assert.equal(batches.length, 1, '两个订阅共享一次请求');
  assert.deepEqual(batches[0].paths, ['/api/v2/desktop/media-task/list']);
  assert.deepEqual(batches[0].known, {}, '首次没有已知 revision');
});

test('desktopEventPoll: 第二次读取带上上次 revision，后端回空值时沿用缓存', async () => {
  const timerHost = createTimerHost();
  const batches = [];
  let revision = 'r1';
  const client = createDesktopEventPollClient({
    timerHost: timerHost,
    requestBatch: async (payload) => {
      batches.push(payload);
      if (revision === 'r2')
        return { updates: { '/a': { revision: 'r2', value: ['new'] } }, failed: [] };
      return { updates: { '/a': { revision: 'r1', value: ['old'] } }, failed: [] };
    },
  });
  const first = client.read('/a');
  await timerHost.runAll();
  assert.deepEqual(await first, ['old']);

  revision = 'r2';
  const second = client.read('/a');
  await timerHost.runAll();
  assert.deepEqual(await second, ['new']);
  assert.equal(batches[1].known['/a'], 'r1', '要告诉后端上次拿到的是哪一版');
});

test('desktopEventPoll: 批量接口 404 时降级为逐路径快照，且只降一次', async () => {
  const timerHost = createTimerHost();
  let batchAttempts = 0;
  const snapshots = [];
  const client = createDesktopEventPollClient({
    timerHost: timerHost,
    requestBatch: async () => {
      batchAttempts += 1;
      throw Object.assign(new Error('not found'), { status: 404 });
    },
    requestSnapshot: async (path) => {
      snapshots.push(path);
      return ['snapshot-value'];
    },
  });
  const first = client.read('/a');
  await timerHost.runAll();
  assert.deepEqual(await first, ['snapshot-value'], '降级后要用快照值');
  assert.deepEqual(snapshots, ['/a']);

  const second = client.read('/b');
  await timerHost.runAll();
  assert.deepEqual(await second, ['snapshot-value']);
  assert.equal(batchAttempts, 1, '降级过一次就不该再打批量接口');
  assert.deepEqual(snapshots, ['/a', '/b']);
});

test('desktopEventPoll: 后端把路径列为 failed 时拒绝该路径的订阅者', async () => {
  const timerHost = createTimerHost();
  const client = createDesktopEventPollClient({
    timerHost: timerHost,
    requestBatch: async () => ({ updates: {}, failed: ['/a'] }),
  });
  const pending = client.read('/a');
  // 先挂断言再驱动时钟：拒绝发生在 flush 内部，晚挂会变成 unhandledRejection。
  const assertion = assert.rejects(pending, /Desktop event read failed/);
  await timerHost.runAll();
  await assertion;
});

test('desktopEventPoll: 中止后立即以 AbortError 拒绝，也不再发请求', async () => {
  const timerHost = createTimerHost();
  const batches = [];
  const client = createDesktopEventPollClient({
    timerHost: timerHost,
    requestBatch: async (payload) => {
      batches.push(payload);
      return { updates: {}, failed: [] };
    },
  });
  const controller = new AbortController();
  const pending = client.read('/a', { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error) => {
    assert.equal(error.name, 'AbortError');
    return true;
  });
  await timerHost.runAll();
  assert.equal(batches.length, 0, '中止发生在第一次请求之前，不该产生请求');
});
