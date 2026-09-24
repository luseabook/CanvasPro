import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRendererMediaRuntimePreparer,
  shouldPrebuildRendererMediaRuntime,
} from './rendererMediaRuntimePreparer.js';

const createHarness = (overrides = {}) => {
  const scheduled = [];
  const cancelled = [];
  const prepared = [];
  const errors = [];
  const disposed = [];
  let clock = 0;
  const preparer = createRendererMediaRuntimePreparer({
    isInteractionBusy: () => false,
    onPrepared: (info) => prepared.push(info),
    onPrepareError: (info) => errors.push(info),
    now: () => (clock += 10),
    scheduleTask: (cb, options) => {
      scheduled.push({ cb, options });
      return { handle: { id: scheduled.length }, type: 'timeout' };
    },
    cancelTask: (handle, type) => cancelled.push([handle, type]),
    ...overrides,
  });
  return { preparer, scheduled, cancelled, prepared, errors, disposed };
};

const taskFor = (nodeId, disposed, extra = {}) => ({
  nodeId,
  version: 1,
  variant: 'a',
  prepare: () => ({ id: `runtime-${nodeId}` }),
  dispose: (runtime) => disposed.push(runtime),
  ...extra,
});

test('rendererMediaRuntimePreparer: 预构建准入需同时满足全部条件', () => {
  const base = {
    node: { type: 'source-image' },
    nodeCount: 200,
    hasExactVisiblePreview: true,
    deferMediaOnMount: true,
  };
  const decide = (overrides) => shouldPrebuildRendererMediaRuntime({ ...base, ...overrides });
  assert.equal(decide({}), true);
  assert.equal(decide({ node: { type: 'source-video' } }), true);
  assert.equal(decide({ node: { type: ' Source-Image ' } }), true);
  assert.equal(decide({ node: { type: 'image' } }), false);
  assert.equal(decide({ node: null }), false);
  assert.equal(decide({ nodeCount: 119 }), false);
  assert.equal(decide({ nodeCount: 200, veryDenseNodeCount: 200 }), true);
  assert.equal(decide({ hasExactVisiblePreview: false }), false);
  assert.equal(decide({ interactionBusy: true }), false);
  assert.equal(decide({ interactionPriority: true }), false);
  assert.equal(decide({ deferMediaOnMount: false }), false);
  assert.equal(decide({ viewportPriorityMediaOnly: true }), false);
  assert.equal(decide({ idlePreparationSupported: false }), false);
  assert.equal(shouldPrebuildRendererMediaRuntime(), false);
});

test('rendererMediaRuntimePreparer: 入队与 flush 产出运行时并可 take 取走', () => {
  const { preparer, scheduled, prepared, disposed } = createHarness();
  assert.equal(preparer.enqueue(taskFor('n1', disposed)), true);
  assert.deepEqual(preparer.getStats(), { queued: 1, physicalQueued: 1, prepared: 0, paused: false });
  assert.equal(scheduled.length, 1);
  assert.deepEqual(scheduled[0].options, { timeoutMs: 240, delayMs: 32 });
  preparer.flush();
  assert.deepEqual(preparer.getStats(), { queued: 0, physicalQueued: 0, prepared: 1, paused: false });
  assert.deepEqual(prepared, [{ nodeId: 'n1', durationMs: 10 }]);
  assert.deepEqual(preparer.take('n1', 1, 'a'), { id: 'runtime-n1' });
  assert.equal(preparer.take('n1', 1, 'a'), null);
  assert.equal(preparer.getStats().prepared, 0);
});

test('rendererMediaRuntimePreparer: 非法任务与重复有效任务被拒绝且不重复排期', () => {
  const { preparer, scheduled, disposed } = createHarness();
  assert.equal(preparer.enqueue({ nodeId: 'no-prepare' }), false);
  assert.equal(preparer.enqueue({ nodeId: '   ', prepare: () => 1 }), false);
  assert.equal(preparer.enqueue({ nodeId: 'invalid', isValid: () => false, prepare: () => 1 }), false);
  assert.equal(preparer.enqueue(taskFor('n1', disposed)), true);
  assert.equal(scheduled.length, 1);
  preparer.flush();
  assert.equal(preparer.enqueue(taskFor('n1', disposed)), true);
  assert.equal(preparer.getStats().queued, 0);
  assert.equal(scheduled.length, 1);
  assert.equal(preparer.enqueue(taskFor('n1', disposed)), true);
  assert.equal(preparer.getStats().prepared, 1);
});

test('rendererMediaRuntimePreparer: 队列上限与已备上限的淘汰语义', () => {
  const queued = createHarness({ maxQueued: 1 });
  assert.equal(queued.preparer.enqueue(taskFor('n1', queued.disposed)), true);
  assert.equal(queued.preparer.enqueue(taskFor('n2', queued.disposed)), false);
  assert.equal(queued.preparer.getStats().queued, 1);

  const preparedCap = createHarness({ maxPrepared: 1 });
  preparedCap.preparer.enqueue(taskFor('n1', preparedCap.disposed));
  preparedCap.preparer.flush();
  assert.equal(preparedCap.preparer.getStats().prepared, 1);
  preparedCap.preparer.enqueue(taskFor('n2', preparedCap.disposed));
  preparedCap.preparer.flush();
  assert.deepEqual(preparedCap.disposed, [{ id: 'runtime-n1' }]);
  assert.deepEqual(preparedCap.preparer.getStats(), {
    queued: 0,
    physicalQueued: 0,
    prepared: 1,
    paused: false,
  });
  assert.equal(preparedCap.preparer.take('n2', 1, 'a').id, 'runtime-n2');
});

test('rendererMediaRuntimePreparer: prepare 抛错回调 onPrepareError，返回空值不入已备', () => {
  const { preparer, errors } = createHarness();
  const boom = new Error('prepare exploded');
  preparer.enqueue({
    nodeId: 'boom',
    prepare: () => {
      throw boom;
    },
  });
  preparer.flush();
  assert.equal(errors.length, 1);
  assert.equal(errors[0].nodeId, 'boom');
  assert.equal(errors[0].error, boom);
  assert.equal(preparer.getStats().prepared, 0);
  assert.equal(preparer.getStats().queued, 0);
  preparer.enqueue({ nodeId: 'nil', prepare: () => null });
  preparer.flush();
  assert.equal(preparer.getStats().prepared, 0);
  assert.deepEqual(preparer.take('nil', undefined, ''), null);
});

test('rendererMediaRuntimePreparer: flush 时失效任务被跳过，hasPrepared 拒绝版本不符', () => {
  const { preparer, disposed } = createHarness();
  let valid = true;
  preparer.enqueue(taskFor('n1', disposed, { isValid: () => valid }));
  valid = false;
  preparer.flush();
  assert.equal(preparer.getStats().prepared, 0);
  assert.equal(preparer.getStats().queued, 0);

  valid = true;
  preparer.enqueue(taskFor('n2', disposed));
  preparer.flush();
  assert.equal(preparer.hasPrepared('n2', 1, 'a'), true);
  assert.equal(preparer.hasPrepared('n2', 2, 'a'), false);
  assert.equal(preparer.getStats().prepared, 0);
  assert.equal(preparer.hasPrepared('missing', 1, 'a'), false);
});

test('rendererMediaRuntimePreparer: 版本变更时旧运行时被释放并重新入队', () => {
  const { preparer, disposed } = createHarness();
  preparer.enqueue(taskFor('n1', disposed, { version: 1 }));
  preparer.flush();
  assert.equal(preparer.getStats().prepared, 1);
  assert.equal(preparer.enqueue(taskFor('n1', disposed, { version: 2 })), true);
  assert.deepEqual(disposed, [{ id: 'runtime-n1' }]);
  assert.deepEqual(preparer.getStats(), { queued: 1, physicalQueued: 1, prepared: 0, paused: false });
});

test('rendererMediaRuntimePreparer: pause 期间不排期也不 flush，resume 后恢复', () => {
  const { preparer, scheduled, cancelled, disposed } = createHarness();
  preparer.enqueue(taskFor('n1', disposed));
  assert.equal(scheduled.length, 1);
  preparer.pause();
  assert.deepEqual(cancelled[0], [{ id: 1 }, 'timeout']);
  assert.equal(preparer.getStats().paused, true);
  preparer.flush();
  assert.equal(preparer.getStats().queued, 1);
  preparer.resume();
  assert.equal(scheduled.length, 2);
  preparer.flush();
  assert.equal(preparer.getStats().prepared, 1);
  assert.equal(preparer.getStats().paused, false);
});

test('rendererMediaRuntimePreparer: forget/prune/clear 释放对应运行时', () => {
  const forgot = createHarness();
  forgot.preparer.enqueue(taskFor('n1', forgot.disposed));
  forgot.preparer.flush();
  forgot.preparer.forget('n1');
  assert.deepEqual(forgot.disposed, [{ id: 'runtime-n1' }]);
  assert.equal(forgot.preparer.getStats().prepared, 0);

  const pruned = createHarness();
  pruned.preparer.enqueue(taskFor('a1', pruned.disposed));
  pruned.preparer.enqueue(taskFor('a2', pruned.disposed));
  pruned.preparer.flush();
  assert.equal(pruned.preparer.getStats().prepared, 1);
  assert.equal(pruned.preparer.getStats().queued, 1);
  pruned.preparer.prune(['a1']);
  assert.equal(pruned.preparer.getStats().queued, 0);
  assert.equal(pruned.preparer.getStats().prepared, 1);
  assert.deepEqual(pruned.disposed, []);

  const cleared = createHarness();
  cleared.preparer.enqueue(taskFor('c1', cleared.disposed));
  cleared.preparer.flush();
  cleared.preparer.enqueue(taskFor('c2', cleared.disposed));
  cleared.preparer.clear();
  assert.deepEqual(cleared.preparer.getStats(), { queued: 0, physicalQueued: 0, prepared: 0, paused: false });
  assert.deepEqual(cleared.disposed, [{ id: 'runtime-c1' }]);
});

test('rendererMediaRuntimePreparer: 交互繁忙与空余预算不足时改期重试', () => {
  let busy = true;
  const busyHarness = createHarness({ isInteractionBusy: () => busy });
  busyHarness.preparer.enqueue(taskFor('n1', busyHarness.disposed));
  busyHarness.preparer.flush();
  assert.equal(busyHarness.preparer.getStats().queued, 1);
  assert.equal(busyHarness.scheduled.length, 2);
  assert.equal(busyHarness.scheduled[1].options.delayMs, 120);
  busy = false;
  busyHarness.preparer.flush();
  assert.equal(busyHarness.preparer.getStats().prepared, 1);

  const budget = createHarness();
  budget.preparer.enqueue(taskFor('k1', budget.disposed));
  budget.preparer.flush({ didTimeout: false, timeRemaining: () => 5 });
  assert.equal(budget.preparer.getStats().queued, 1);
  assert.equal(budget.scheduled.length, 2);
  assert.equal(budget.scheduled[1].options.delayMs, 32);
  budget.preparer.flush({ didTimeout: true, timeRemaining: () => 5 });
  assert.equal(budget.preparer.getStats().prepared, 1);
});
