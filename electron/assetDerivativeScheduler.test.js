import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAssetDerivativeScheduler } from './assetDerivativeScheduler.js';

function createRig(overrides = {}) {
  const calls = { updated: [], published: [], enqueued: [] },
    records = new Map(),
    runningTasks = new Map();
  const rig = {
    calls: calls,
    records: records,
    runningTasks: runningTasks,
    scheduler: createAssetDerivativeScheduler({
      readAssetRecord: (assetId) => records.get(assetId) || null,
      getQueue: () => ({
        get: (taskId) => runningTasks.get(taskId) || undefined,
        enqueue: (payload) => {
          calls.enqueued.push(payload);
          if (overrides.enqueueThrows) throw new Error('Unsupported media task kind: videoPoster');
          return { taskId: payload.taskId, kind: payload.kind, status: 'waiting', progress: 0 };
        },
      }),
      updateAssetRecord: (assetId, fields, options) => {
        calls.updated.push({ assetId, fields, options });
        const existing = records.get(assetId);
        if (!existing) return null;
        if (options?.expectedMediaTaskId && existing.mediaTaskId !== options.expectedMediaTaskId)
          return null;
        const next = { ...existing, ...fields, assetId: assetId };
        records.set(assetId, next);
        return next;
      },
      sendAssetUpdated: (record) => calls.published.push(record),
      createTaskId: (kind, record) => `${kind}-for-${record.assetId}`,
    }),
  };
  return rig;
}

test('every dependency is required', () => {
  for (const missing of ['readAssetRecord', 'getQueue', 'updateAssetRecord', 'sendAssetUpdated', 'createTaskId']) {
    const deps = {
      readAssetRecord: () => null,
      getQueue: () => ({}),
      updateAssetRecord: () => null,
      sendAssetUpdated: () => {},
      createTaskId: () => 'id',
    };
    delete deps[missing];
    assert.throws(
      () => createAssetDerivativeScheduler(deps),
      new RegExp(`${missing} must be a function`),
    );
  }
});

test('assets without an id, ready assets and non media assets are skipped', () => {
  const { scheduler, records } = createRig();
  assert.equal(scheduler(undefined), undefined);
  assert.equal(scheduler({}), undefined);
  records.set('r', { assetId: 'r', kind: 'video', status: 'ready' });
  assert.equal(scheduler({ assetId: 'r' }), undefined);
  records.set('i', { assetId: 'i', kind: 'image', status: 'processing' });
  assert.equal(scheduler({ assetId: 'i' }), undefined);
  records.set('f', { assetId: 'f', kind: 'file', status: 'processing' });
  assert.equal(scheduler({ assetId: 'f' }), undefined);
});

test('a video asset schedules a poster task and reports the new record', () => {
  const { scheduler, records, calls } = createRig();
  records.set('v1', {
    assetId: 'v1',
    kind: 'video',
    status: 'processing',
    originalLocalPath: 'data/assets/original/v1.mp4',
  });
  const task = scheduler({ assetId: 'v1' });
  assert.deepEqual(calls.enqueued, [
    {
      kind: 'videoPoster',
      taskId: 'videoPoster-for-v1',
      assetId: 'v1',
      src: 'data/assets/original/v1.mp4',
      originalLocalPath: 'data/assets/original/v1.mp4',
    },
  ]);
  assert.equal(task.status, 'waiting');
  assert.deepEqual(calls.updated, [
    {
      assetId: 'v1',
      fields: {
        status: 'processing',
        error: '',
        mediaTaskId: 'videoPoster-for-v1',
        mediaTaskKind: 'videoPoster',
        mediaTaskStatus: 'waiting',
        mediaTaskProgress: 0,
        mediaTaskError: '',
      },
      options: undefined,
    },
  ]);
  assert.equal(calls.published.length, 1);
  assert.equal(calls.published[0].mediaTaskId, 'videoPoster-for-v1');
});

test('an audio asset schedules a waveform task', () => {
  const { scheduler, records, calls } = createRig();
  records.set('a1', {
    assetId: 'a1',
    kind: 'audio',
    status: 'processing',
    originalLocalPath: 'data/assets/original/a1.mp3',
  });
  scheduler({ assetId: 'a1' });
  assert.equal(calls.enqueued[0].kind, 'audioWaveform');
  assert.equal(calls.enqueued[0].taskId, 'audioWaveform-for-a1');
});

test('the incoming payload is used when the index has no record yet', () => {
  const { scheduler, calls } = createRig();
  scheduler({
    assetId: 'orphan',
    kind: 'video',
    status: 'processing',
    originalLocalPath: 'data/assets/original/orphan.mp4',
  });
  assert.equal(calls.enqueued[0].assetId, 'orphan');
});

test('an in-flight task for the same kind is reused instead of re-enqueued', () => {
  const { scheduler, records, runningTasks, calls } = createRig();
  records.set('v2', {
    assetId: 'v2',
    kind: 'video',
    status: 'processing',
    mediaTaskId: 'task-v2',
    mediaTaskKind: 'videoPoster',
  });
  runningTasks.set('task-v2', { taskId: 'task-v2', status: 'processing' });
  const running = scheduler({ assetId: 'v2' });
  assert.equal(running.taskId, 'task-v2');
  assert.deepEqual(calls.enqueued, []);
  assert.deepEqual(calls.updated, []);

  runningTasks.set('task-v2', { taskId: 'task-v2', status: 'waiting' });
  assert.equal(scheduler({ assetId: 'v2' }).status, 'waiting');
  assert.deepEqual(calls.enqueued, []);
});

test('a finished task with a stale id is replaced by a fresh one', () => {
  const { scheduler, records, runningTasks, calls } = createRig();
  records.set('v3', {
    assetId: 'v3',
    kind: 'video',
    status: 'processing',
    mediaTaskId: 'task-old',
    mediaTaskKind: 'videoPoster',
    originalLocalPath: 'data/assets/original/v3.mp4',
  });
  runningTasks.set('task-old', { taskId: 'task-old', status: 'complete' });
  scheduler({ assetId: 'v3' });
  assert.equal(calls.enqueued.length, 1);
  assert.equal(calls.enqueued[0].taskId, 'videoPoster-for-v3');
});

test('a task of a different kind never satisfies the running check', () => {
  const { scheduler, records, runningTasks, calls } = createRig();
  records.set('v4', {
    assetId: 'v4',
    kind: 'video',
    status: 'processing',
    mediaTaskId: 'task-other',
    mediaTaskKind: 'videoCut',
    originalLocalPath: 'data/assets/original/v4.mp4',
  });
  runningTasks.set('task-other', { taskId: 'task-other', status: 'processing' });
  scheduler({ assetId: 'v4' });
  assert.equal(calls.enqueued.length, 1);
});

test('an enqueue failure marks the asset partial under the attempted task id and rethrows', () => {
  const { scheduler, records, calls } = createRig({ enqueueThrows: true });
  records.set('v5', {
    assetId: 'v5',
    kind: 'video',
    status: 'processing',
    originalLocalPath: 'data/assets/original/v5.mp4',
  });
  assert.throws(() => scheduler({ assetId: 'v5' }), /Unsupported media task kind: videoPoster/);
  assert.deepEqual(calls.updated[1], {
    assetId: 'v5',
    fields: {
      status: 'partial',
      error: 'Unsupported media task kind: videoPoster',
      mediaTaskStatus: 'failed',
      mediaTaskError: 'Unsupported media task kind: videoPoster',
    },
    options: { expectedMediaTaskId: 'videoPoster-for-v5' },
  });
  assert.equal(calls.published.length, 2);
  assert.equal(calls.published[1].status, 'partial');
});
