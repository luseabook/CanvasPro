import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelStoryEpisodeSplitBatch,
  finalizeStoryEpisodeSplitBatch,
  resetStoryEpisodeSplitBatchState,
  runStoryEpisodeSplitBatchQueue,
} from './storyEpisodeSplitBatchExecution.js';

test('resetting clears the batch split fields', () => {
  const state = {
    episodeBatchSplitOperation: 'split',
    episodeBatchSplitStatus: 's',
    episodeBatchSplitId: 'b',
    episodeBatchSplitCancelRequested: true,
    other: 1,
  };
  resetStoryEpisodeSplitBatchState(state);
  assert.deepEqual(state, {
    episodeBatchSplitOperation: '',
    episodeBatchSplitStatus: '',
    episodeBatchSplitId: '',
    episodeBatchSplitCancelRequested: false,
    other: 1,
  });
});

test('the queue requires a runTarget function', async () => {
  await assert.rejects(runStoryEpisodeSplitBatchQueue({ targets: ['a'] }), {
    name: 'TypeError',
    message: 'runTarget 必须是函数。',
  });
});

test('targets run in order and each settlement reports what is left', async () => {
  const runs = [];
  const settled = [];
  const result = await runStoryEpisodeSplitBatchQueue({
    targets: ['a', 'b', 'c'],
    resolveTarget: (id) => ({ id }),
    runTarget: async (episode, context) => (runs.push([episode.id, context]), true),
    onTargetSettled: async (event) => settled.push([event.target, event.completed, event.pendingTargets]),
  });
  assert.deepEqual(result, {
    status: 'completed',
    completed: 3,
    failures: [],
    pendingTargets: [],
    cancelled: 0,
  });
  assert.deepEqual(runs[1], ['b', { target: 'b', index: 1, total: 3 }]);
  assert.deepEqual(settled, [
    ['a', 1, ['b', 'c']],
    ['b', 2, ['c']],
    ['c', 3, []],
  ]);
});

test('missing and failing targets are collected without stopping the queue', async () => {
  const boom = new Error('boom');
  const result = await runStoryEpisodeSplitBatchQueue({
    targets: ['a', 'missing', 'b'],
    resolveTarget: (id) => (id === 'missing' ? null : id),
    createMissingTargetError: (id) => new Error('no ' + id),
    runTarget: async (id) => {
      if (id === 'a') throw boom;
      return true;
    },
  });
  assert.equal(result.status, 'completed');
  assert.equal(result.completed, 1);
  assert.deepEqual(
    result.failures.map((failure) => [failure.target, failure.error.message]),
    [
      ['a', 'boom'],
      ['missing', 'no missing'],
    ],
  );
  const defaults = await runStoryEpisodeSplitBatchQueue({
    targets: ['x'],
    resolveTarget: () => null,
    runTarget: async () => true,
  });
  assert.equal(defaults.failures[0].error.message, '分集不存在，无法拆分。');
  assert.deepEqual(await runStoryEpisodeSplitBatchQueue({ targets: 'bad', runTarget: async () => true }), {
    status: 'completed',
    completed: 0,
    failures: [],
    pendingTargets: [],
    cancelled: 0,
  });
});

test('a falsy run result or a lost live check interrupts the queue', async () => {
  const falsy = await runStoryEpisodeSplitBatchQueue({
    targets: ['a', 'b'],
    runTarget: async (id) => id !== 'b',
  });
  assert.deepEqual(falsy, { status: 'interrupted', completed: 1, failures: [], pendingTargets: ['b'] });
  let live = true;
  const lost = await runStoryEpisodeSplitBatchQueue({
    targets: ['a', 'b', 'c'],
    isLive: () => live,
    runTarget: async () => true,
    onTargetSettled: () => {
      live = false;
    },
  });
  assert.deepEqual(lost, { status: 'interrupted', completed: 1, failures: [], pendingTargets: ['b', 'c'] });
});

test('cancellation stops after the current target', async () => {
  const cancelled = new Set();
  const runs = [];
  const result = await runStoryEpisodeSplitBatchQueue({
    targets: ['a', 'b', 'c'],
    batchId: 'batch-1',
    isCancellationRequested: (id) => cancelled.has(id),
    runTarget: async (id) => {
      runs.push(id);
      cancelled.add('batch-1');
      return true;
    },
  });
  assert.deepEqual(runs, ['a']);
  assert.deepEqual(result, {
    status: 'cancelled',
    completed: 1,
    failures: [],
    pendingTargets: ['b', 'c'],
    cancelled: 2,
  });
  const early = await runStoryEpisodeSplitBatchQueue({
    targets: ['a'],
    isCancellationRequested: () => true,
    runTarget: async () => assert.fail(),
  });
  assert.deepEqual(early, {
    status: 'cancelled',
    completed: 0,
    failures: [],
    pendingTargets: ['a'],
    cancelled: 1,
  });
});

test('a cancellation seen after settling wins over a live check lost in the same step', async () => {
  let live = true;
  let cancelled = false;
  const result = await runStoryEpisodeSplitBatchQueue({
    targets: ['a', 'b', 'c'],
    isLive: () => live,
    isCancellationRequested: () => cancelled,
    runTarget: async () => ((cancelled = true), true),
    onTargetSettled: () => {
      live = false;
    },
  });
  assert.deepEqual(result, {
    status: 'cancelled',
    completed: 1,
    failures: [],
    pendingTargets: ['b', 'c'],
    cancelled: 2,
  });
});

function cancelHarness(overrides = {}) {
  const log = [];
  const state = { episodeBatchSplitId: ' batch-1 ', episodeBatchSplitOperation: 'split' };
  const task = {
    batch: { id: 'batch-1', pendingEpisodeIds: ['e1', ' e2 ', '', 'e3'] },
    scope: { episodeId: 'e1' },
  };
  const options = {
    state,
    tasks: [{ batch: { id: 'other' } }, task],
    isTaskActive: () => true,
    requestCancellation: (id) => (log.push(['request', id]), true),
    updateBatch: (id, patch) => log.push(['update', id, patch]),
    setEpisodeRunning: (id, running) => log.push(['running', id, running]),
    showToast: (message, tone) => log.push(['toast', message, tone]),
    render: () => log.push(['render']),
    ...overrides,
  };
  return { log, state, task, options };
}

test('cancelling a batch drops queued episodes but lets the current one finish', () => {
  const { log, state, options } = cancelHarness();
  assert.equal(cancelStoryEpisodeSplitBatch(options), true);
  assert.deepEqual(log, [
    ['request', 'batch-1'],
    [
      'update',
      'batch-1',
      {
        cancelRequested: true,
        cancelledEpisodeIds: ['e2', 'e3'],
        pendingEpisodeIds: ['e1'],
        label: '已取消后续 2 集排队，正在完成当前集',
      },
    ],
    ['running', 'e2', false],
    ['running', 'e3', false],
    ['render'],
  ]);
  assert.equal(state.episodeBatchSplitCancelRequested, true);
  assert.equal(state.episodeBatchSplitStatus, '已取消后续 2 集排队，正在完成当前集');
});

test('cancelling is refused without a matching active batch or queued episodes', () => {
  assert.equal(cancelStoryEpisodeSplitBatch(), false);
  assert.equal(
    cancelStoryEpisodeSplitBatch(cancelHarness({ state: { episodeBatchSplitId: 'batch-1' } }).options),
    false,
  );
  assert.equal(cancelStoryEpisodeSplitBatch(cancelHarness({ isTaskActive: () => false }).options), false);
  const onlyCurrent = cancelHarness();
  onlyCurrent.task.batch.pendingEpisodeIds = ['e1'];
  assert.equal(cancelStoryEpisodeSplitBatch(onlyCurrent.options), false);
  assert.deepEqual(onlyCurrent.log, [['toast', '当前集正在拆分，暂无可取消的排队分集。', 'info']]);
  const refused = cancelHarness({ requestCancellation: () => false });
  assert.equal(cancelStoryEpisodeSplitBatch(refused.options), false);
  assert.equal(refused.state.episodeBatchSplitCancelRequested, undefined);
});

function finalizeHarness(result, extra = {}) {
  const log = [];
  const returned = finalizeStoryEpisodeSplitBatch({
    result,
    batch: { total: 3 },
    syncBatch: (patch) => log.push(['sync', patch]),
    persist: () => log.push(['persist']),
    showToast: (message, tone) => log.push(['toast', message, tone]),
    notifyFailure: (message, options) => log.push(['failure', message, options]),
    notifySuccess: (message, options) => log.push(['success', message, options]),
    ...extra,
  });
  return { returned, log };
}

test('finalizing a cancelled batch records the stop', () => {
  const { returned, log } = finalizeHarness({
    status: 'cancelled',
    completed: 1,
    pendingTargets: ['b', 'c'],
    cancelled: 2,
  });
  assert.equal(returned, true);
  assert.deepEqual(log, [
    [
      'sync',
      {
        completed: 1,
        cancelRequested: true,
        pendingEpisodeIds: [],
        cancelledEpisodeIds: ['b', 'c'],
        label: '已停止批量拆分 · 完成 1/3',
      },
    ],
    ['persist'],
    ['toast', '已停止后续 2 集拆分。', 'info'],
  ]);
});

test('finalizing reports the first failure or overall success', () => {
  const boom = new Error('boom');
  const failed = finalizeHarness({
    status: 'completed',
    completed: 1,
    failures: [{ error: boom }, { error: new Error('x') }],
  });
  assert.equal(failed.returned, false);
  assert.deepEqual(failed.log, [
    ['persist'],
    [
      'failure',
      '普通模式批量拆分已完成 1/3 集；boom',
      { notificationMessage: '批量分镜脚本生成结束：成功 1 集，失败 2 集。', tone: 'error', details: boom },
    ],
  ]);
  const experimental = finalizeHarness({ completed: 0, failures: [{ error: {} }] }, { experimental: true });
  assert.equal(experimental.log[1][1], '实验模式批量拆分已完成 0/3 集；分镜拆分失败。');
  const all = finalizeHarness({ status: 'completed', completed: 3, failures: [] });
  assert.equal(all.returned, true);
  assert.deepEqual(all.log[1], [
    'success',
    '已完成全部 3 集片段拆分。',
    { notificationMessage: '全部 3 集分镜脚本生成完成。' },
  ]);
  const selected = finalizeHarness({ completed: 2, failures: [] }, { selectionMode: true });
  assert.deepEqual(selected.log[1], [
    'success',
    '已完成 2 个选中分集的片段拆分。',
    { notificationMessage: '选中的 2 集分镜脚本生成完成。' },
  ]);
});
