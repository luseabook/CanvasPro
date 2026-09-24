import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProjectSaveQueue } from './projectSaveQueue.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeHarness(resolveValue = null) {
  const calls = [];
  const gates = [];
  const saver = (snapshot) => {
    calls.push(snapshot);
    return new Promise((resolve, reject) => gates.push({ resolve, reject }));
  };
  const queue = createProjectSaveQueue(saver);
  return { calls, gates, queue };
}

test('首次入队立即同步开跑，返回值是 Promise', () => {
  const { calls, queue } = makeHarness();
  const p = queue('proj-a', { v: 1 });
  assert.deepEqual(calls, [{ v: 1 }], 'saver 在 queue() 同步阶段就被调用');
  assert.ok(p instanceof Promise);
});

test('同一 id 的后续快照只保留一格，被顶替者立刻拿到 superseded', async () => {
  const { calls, gates, queue } = makeHarness();
  const p1 = queue('a', 1);
  const p2 = queue('a', 2);
  const p3 = queue('a', 3);
  assert.deepEqual(calls, [1], '队列未排空前不会开第二次保存');
  assert.deepEqual(await p2, { success: false, canceled: true, superseded: true });
  gates[0].resolve('R1');
  await tick();
  assert.deepEqual(calls, [1, 3], '取走的是最新快照，中间快照被合并掉');
  gates[1].resolve('R3');
  assert.equal(await p1, 'R1');
  assert.equal(await p3, 'R3');
});

test('saver 抛错只 reject 当次请求，不阻塞后续快照', async () => {
  const { calls, gates, queue } = makeHarness();
  const boom = new Error('disk full');
  const p1 = queue('a', 1);
  const p2 = queue('a', 2);
  const checked = assert.rejects(
    () => p1,
    (err) => err === boom,
    'reject 前先挂上处理器，否则 Node 记为 unhandled rejection',
  );
  gates[0].reject(boom);
  await checked;
  assert.deepEqual(calls, [1, 2]);
  gates[1].resolve('ok2');
  assert.equal(await p2, 'ok2');
});

test('不同 id 各自独立排队，互不合并', async () => {
  const { calls, gates, queue } = makeHarness();
  const pa = queue('a', 'A1');
  const pb = queue('b', 'B1');
  assert.deepEqual(calls, ['A1', 'B1']);
  gates[0].resolve('ra');
  gates[1].resolve('rb');
  assert.equal(await pa, 'ra');
  assert.equal(await pb, 'rb');
});

test('排空后同 id 会重新成为活动队列（条目已 delete）', async () => {
  const { calls, gates, queue } = makeHarness();
  const p1 = queue('a', 1);
  gates[0].resolve('r1');
  assert.equal(await p1, 'r1');
  await tick();
  const p2 = queue('a', 2);
  assert.deepEqual(calls, [1, 2], '第二次调用再次同步开跑而非排队');
  gates[1].resolve('r2');
  assert.equal(await p2, 'r2');
});

test('多次顶替：中间格各自拿到一次 superseded，最后一格照常落盘', async () => {
  const { calls, gates, queue } = makeHarness();
  const p1 = queue('a', 1);
  const p2 = queue('a', 2);
  const p3 = queue('a', 3);
  const p4 = queue('a', 4);
  assert.deepEqual(calls, [1]);
  for (const p of [p2, p3]) assert.deepEqual(await p, { success: false, canceled: true, superseded: true });
  gates[0].resolve('r1');
  await tick();
  assert.deepEqual(calls, [1, 4], '只有最后一格存活下来');
  gates[1].resolve('r4');
  assert.equal(await p1, 'r1');
  assert.equal(await p4, 'r4');
});
