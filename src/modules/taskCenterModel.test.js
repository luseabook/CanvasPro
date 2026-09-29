import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVE_TASK_STATUSES,
  TERMINAL_TASK_STATUSES,
  normalizeTaskCenterStatus,
  pruneTaskCenterRecords,
} from './taskCenterModel.js';

test('exposes the active and terminal status sets', () => {
  assert.deepEqual([...ACTIVE_TASK_STATUSES].sort(), ['processing', 'waiting']);
  assert.deepEqual([...TERMINAL_TASK_STATUSES].sort(), ['cancelled', 'complete', 'failed', 'untracked']);
});

test('keeps the untracked status verbatim', () => {
  assert.equal(normalizeTaskCenterStatus('untracked'), 'untracked');
  assert.equal(normalizeTaskCenterStatus('  Untracked '), 'untracked');
});

test('maps every queued-style status onto waiting', () => {
  for (const status of ['waiting', 'queued', 'paused', 'WAITING', ' queued ']) {
    assert.equal(normalizeTaskCenterStatus(status), 'waiting');
  }
});

test('maps every in-flight status onto processing', () => {
  for (const status of [
    'processing',
    'running',
    'submitting',
    'pending',
    'recovering',
    'uploading',
    'cutting',
    'extracting-keyframes',
    'detecting',
    'identifying',
  ]) {
    assert.equal(normalizeTaskCenterStatus(status), 'processing');
  }
});

test('maps success aliases onto complete', () => {
  for (const status of ['complete', 'completed', 'success', 'succeeded']) {
    assert.equal(normalizeTaskCenterStatus(status), 'complete');
  }
});

test('maps failure aliases onto failed and cancel aliases onto cancelled', () => {
  for (const status of ['failed', 'error', 'interrupted']) {
    assert.equal(normalizeTaskCenterStatus(status), 'failed');
  }
  for (const status of ['cancelled', 'canceled']) {
    assert.equal(normalizeTaskCenterStatus(status), 'cancelled');
  }
});

test('returns an empty status for unknown or nullish input', () => {
  for (const value of ['paused-forever', '', '   ', null, undefined, 0, {}]) {
    assert.equal(normalizeTaskCenterStatus(value), '');
  }
});

test('keeps every active record in input order ahead of the terminal ones', () => {
  const records = [
    { id: 'done-1', status: 'complete', finishedAt: 100 },
    { id: 'live-1', status: 'processing', finishedAt: 1 },
    { id: 'done-2', status: 'failed', finishedAt: 300 },
    { id: 'live-2', status: 'waiting', finishedAt: 2 },
  ];
  const pruned = pruneTaskCenterRecords(records, 10);
  assert.deepEqual(
    pruned.map((record) => record.id),
    ['live-1', 'live-2', 'done-2', 'done-1'],
  );
});

test('sorts terminal records by finish time, newest first', () => {
  const records = [
    { id: 'a', status: 'complete', finishedAt: 10 },
    { id: 'b', status: 'complete', finishedAt: 30 },
    { id: 'c', status: 'complete', finishedAt: 20 },
  ];
  assert.deepEqual(
    pruneTaskCenterRecords(records, 3).map((record) => record.id),
    ['b', 'c', 'a'],
  );
});

test('falls back to createdAt when finishedAt is missing or zero', () => {
  const records = [
    { id: 'no-times', status: 'complete' },
    { id: 'zero-finish', status: 'complete', finishedAt: 0, createdAt: 50 },
    { id: 'created-only', status: 'complete', createdAt: 70 },
    { id: 'zero-finished-at', status: 'complete', finishedAt: 0, createdAt: 60 },
  ];
  assert.deepEqual(
    pruneTaskCenterRecords(records, 4).map((record) => record.id),
    ['created-only', 'zero-finished-at', 'zero-finish', 'no-times'],
  );
});

test('keeps all active records regardless of how small the terminal limit is', () => {
  const records = [
    { id: 'live-1', status: 'waiting' },
    { id: 'live-2', status: 'processing' },
    { id: 'done-1', status: 'complete', finishedAt: 1 },
    { id: 'done-2', status: 'complete', finishedAt: 2 },
  ];
  assert.deepEqual(
    pruneTaskCenterRecords(records, 1).map((record) => record.id),
    ['live-1', 'live-2', 'done-2'],
  );
});

test('defaults the terminal cap to 120 records', () => {
  const records = Array.from({ length: 130 }, (_, index) => ({
    id: `done-${index}`,
    status: 'complete',
    finishedAt: index,
  }));
  const pruned = pruneTaskCenterRecords(records);
  assert.equal(pruned.length, 120);
  assert.equal(pruned[0].id, 'done-129');
  assert.equal(pruned[119].id, 'done-10');
});

test('does not reorder or drop entries in the caller-owned array', () => {
  const records = [
    { id: 'a', status: 'complete', finishedAt: 1 },
    { id: 'b', status: 'complete', finishedAt: 2 },
  ];
  pruneTaskCenterRecords(records, 1);
  assert.deepEqual(
    records.map((record) => record.id),
    ['a', 'b'],
  );
});
