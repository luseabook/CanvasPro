import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollaborationChangeFeed } from './collaborationChangeFeed.js';

// 用 node:test 的假计时器驱动 setTimeout 轮询
const tick = () => new Promise((resolve) => setImmediate(resolve));

function setup(t, over = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = { read: [], change: [], error: [] };
  const controller = 'signal' in over ? null : new AbortController();
  const responses = 'responses' in over ? [...over.responses] : [];
  const feed = createCollaborationChangeFeed({
    read: async (cursor) => {
      calls.read.push(cursor);
      const next = responses.shift();
      if (next instanceof Error) throw next;
      return next;
    },
    onChange: (payload, graphChanged) => calls.change.push({ payload, graphChanged }),
    onError: (error) => calls.error.push(error.message),
    signal: 'signal' in over ? over.signal : controller.signal,
  });
  return { feed, calls, controller };
}

test('createCollaborationChangeFeed：首轮游标为 null，首次通知总算图变化', async (t) => {
  const first = { cursor: { graph: 1 }, presence: [] };
  const { feed, calls } = setup(t, { responses: [first] });
  await feed.start();
  assert.deepEqual(calls.read, [null]);
  assert.equal(calls.change.length, 1);
  assert.equal(calls.change[0].payload, first);
  assert.equal(calls.change[0].graphChanged, true);
  feed.stop();
});

test('createCollaborationChangeFeed：成功后立刻（0ms）续读，并带上一轮游标；graph 相同时不算图变化', async (t) => {
  const c1 = { graph: 1, presence: 5 };
  const c2 = { graph: 1, presence: 6 };
  const c3 = { graph: 2 };
  const { feed, calls } = setup(t, {
    responses: [
      { cursor: c1, presence: [] },
      { cursor: c2, presence: [] },
      { cursor: c3, presence: [] },
    ],
  });
  await feed.start();
  t.mock.timers.tick(0);
  await tick();
  t.mock.timers.tick(0);
  await tick();
  assert.deepEqual(calls.read, [null, c1, c2]);
  assert.deepEqual(
    calls.change.map((c) => c.graphChanged),
    [true, false, true],
  );
  feed.stop();
});

test('createCollaborationChangeFeed：读失败或响应无效时报错并 1500ms 后重试', async (t) => {
  const { feed, calls } = setup(t, {
    responses: [
      new Error('网络错误'),
      { presence: [] },
      { cursor: { graph: 1 }, presence: {} },
      { cursor: { graph: 1 }, presence: [] },
    ],
  });
  await feed.start();
  assert.deepEqual(calls.error, ['网络错误']);
  t.mock.timers.tick(1499);
  await tick();
  assert.equal(calls.read.length, 1);
  t.mock.timers.tick(1);
  await tick();
  assert.equal(calls.read.length, 2);
  assert.deepEqual(calls.error, ['网络错误', '协作通知无效']);
  t.mock.timers.tick(1500);
  await tick();
  assert.deepEqual(calls.error, ['网络错误', '协作通知无效', '协作通知无效']);
  t.mock.timers.tick(1500);
  await tick();
  assert.equal(calls.change.length, 1);
  // 失败不推进游标
  assert.deepEqual(calls.read, [null, null, null, null]);
  feed.stop();
});

test('createCollaborationChangeFeed：stop 后不再回调也不再排期', async (t) => {
  let release;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const changes = [];
  const errors = [];
  const reads = [];
  const feed = createCollaborationChangeFeed({
    read: (cursor) => {
      reads.push(cursor);
      return new Promise((resolve) => (release = resolve));
    },
    onChange: (p) => changes.push(p),
    onError: (e) => errors.push(e),
    signal: new AbortController().signal,
  });
  const running = feed.start();
  feed.stop();
  release({ cursor: { graph: 1 }, presence: [] });
  await running;
  t.mock.timers.tick(5000);
  await tick();
  assert.equal(changes.length, 0);
  assert.equal(errors.length, 0);
  assert.equal(reads.length, 1);
  // 已停止时 start 直接返回
  await feed.start();
  assert.equal(reads.length, 1);
});

test('createCollaborationChangeFeed：signal 中止后吞掉错误、不回调', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const controller = new AbortController();
  const errors = [];
  let reads = 0;
  const feed = createCollaborationChangeFeed({
    read: async () => {
      reads++;
      controller.abort();
      throw new Error('aborted');
    },
    onChange: () => assert.fail('不应回调'),
    onError: (e) => errors.push(e),
    signal: controller.signal,
  });
  await feed.start();
  t.mock.timers.tick(5000);
  await tick();
  assert.equal(errors.length, 0);
  assert.equal(reads, 1);
  // 已中止时 start 不再读
  await feed.start();
  assert.equal(reads, 1);
});
