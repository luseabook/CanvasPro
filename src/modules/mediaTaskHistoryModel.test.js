// Source-only regression cases for the opt-in host history; not a renderer acceptance test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MEDIA_TASK_HISTORY_SCHEMA, captureMediaTaskHistory, emptyMediaTaskHistory,
  historyTaskView, normalizeMediaTaskHistoryQuery, selectMediaTaskHistory,
  validateMediaTaskHistoryFile, validateMediaTaskHistoryRecord,
} from './mediaTaskHistoryModel.js';
import { createMediaTaskHistoryReader, readMediaTaskHistory } from '../../api/mediaTaskHistoryApi.js';
import { buildRecoveredMediaFields, describeRecoverableTask, hasRecoveredMediaTask, recoverMediaTaskResult } from './mediaTaskRecoveryModel.js';

const SESSION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FIRST = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SECOND = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
function task(patch = {}) {
  return { taskId: 'task-1', nodeId: 'old-clip', kind: 'storySequenceExport',
    status: 'complete', createdAt: 10, startedAt: 11, finishedAt: 20,
    result: { success: true, localPath: 'output/ClipVideo/a.mp4', videoDuration: 5,
      videoWidth: 1920, videoHeight: 1080, fps: 30 }, ...patch };
}
function record(snapshot = task(), recordId = FIRST, observedAt = 30) {
  return captureMediaTaskHistory(snapshot, { recordId, sessionId: SESSION, now: observedAt });
}
function file(records, extra = {}) {
  return { schema: MEDIA_TASK_HISTORY_SCHEMA, revision: 1, enabled: true,
    savedAt: 40, droppedCount: 0, records, ...extra };
}
function apiFor(reader) {
  return { status: () => assert.fail('listing must use only read'),
    read: reader, configure: () => assert.fail('listing must not enable recording'),
    flush: () => assert.fail('listing must not write history') };
}

test('default in-memory history is empty and disabled, but is not an on-disk opt-in receipt', () => {
  const initial = emptyMediaTaskHistory();
  assert.equal(initial.enabled, false);
  assert.deepEqual(selectMediaTaskHistory(initial).rows, []);
  assert.throws(() => validateMediaTaskHistoryFile(initial));
  assert.throws(() => validateMediaTaskHistoryFile({ ...initial, enabled: true }));
});
test('only a bounded local result summary is captured, never payload, keys or errors', () => {
  const snapshot = task({ payload: { apiKey: 'SECRET-KEY', prompt: 'PRIVATE-PROMPT' },
    error: 'SECRET-ERROR', result: { ...task().result, apiKey: 'SECRET-KEY', stderr: 'SECRET-ERROR' } });
  const captured = record(snapshot);
  assert.deepEqual(captured.result, { success: true, localPath: 'output/ClipVideo/a.mp4',
    videoDuration: 5, videoWidth: 1920, videoHeight: 1080, fps: 30 });
  for (const forbidden of ['SECRET-KEY', 'PRIVATE-PROMPT', 'SECRET-ERROR']) {
    assert.equal(JSON.stringify(captured).includes(forbidden), false);
  }
  assert.deepEqual(validateMediaTaskHistoryRecord(captured), captured);
});
test('only the four verified kinds may retain a recoverable local result', () => {
  for (const kind of ['storySequenceExport', 'mediaClipExport', 'videoReverse']) {
    assert.equal(record(task({ kind })).result.localPath, 'output/ClipVideo/a.mp4');
  }
  const audio = record(task({ kind: 'audioCompose', result: { success: true, localPath: 'output/ComposeAudio/a.mp3' } }));
  assert.equal(audio.result.audioDuration, 0);
  for (const snapshot of [task({ kind: 'unknown' }), task({ status: 'processing', finishedAt: 0 }),
    task({ result: { success: true, localPath: 'output/../a.mp4', videoDuration: 5 } })]) {
    assert.equal(record(snapshot).result, null);
  }
});
test('schema, exact fields, identity and output-path validation fail closed', () => {
  const good = record();
  assert.equal(validateMediaTaskHistoryFile(file([good])).records.length, 1);
  assert.throws(() => validateMediaTaskHistoryFile(file([good, good])));
  assert.throws(() => validateMediaTaskHistoryFile(file([good], { secret: 'do not ingest' })));
  assert.throws(() => validateMediaTaskHistoryFile(file([good], { schema: 'newer-schema' })));
  assert.throws(() => validateMediaTaskHistoryRecord({ ...good, recordId: 'not-uuid' }));
  assert.throws(() => validateMediaTaskHistoryRecord({ ...good, payload: { apiKey: 'x' } }));
  assert.throws(() => validateMediaTaskHistoryRecord({ ...good, result: { ...good.result, localPath: 'output/../a.mp4' } }));
});
test('restart views are held/unknown, never a replay or invented completion', () => {
  const waiting = record(task({ status: 'waiting', startedAt: 0, finishedAt: 0, result: null }), FIRST);
  const running = record(task({ status: 'processing', finishedAt: 0, result: null }), SECOND);
  const rows = selectMediaTaskHistory(file([waiting, running])).rows;
  assert.deepEqual(new Set(rows.map(row => row.status)), new Set(['held', 'unknown']));
  for (const row of rows) {
    assert.equal(row.result, null);
    assert.equal(row.history.durable, true);
    assert.throws(() => describeRecoverableTask(row));
  }
});
test('taskId reuse yields distinct records; query and pagination pin recordId', () => {
  const old = record(task(), FIRST, 30);
  const newer = record(task({ result: { ...task().result, localPath: 'output/ClipVideo/b.mp4' } }), SECOND, 35);
  const disk = file([old, newer]);
  assert.deepEqual(selectMediaTaskHistory(disk, { offset: 0, limit: 1 }).rows.map(row => row.history.recordId), [SECOND]);
  assert.deepEqual(selectMediaTaskHistory(disk, { recordId: FIRST }).rows.map(row => row.result.localPath), ['output/ClipVideo/a.mp4']);
  assert.equal(selectMediaTaskHistory(disk, { taskId: 'missing' }).total, 0);
  for (const query of [{ offset: -1 }, { limit: 51 }, { taskId: '../x' }, { recordId: 'invalid' }, { path: '/tmp/a' }]) {
    assert.throws(() => normalizeMediaTaskHistoryQuery(query));
  }
});
test('history reader refuses missing/reused record; does not fall back to first taskId', async () => {
  const view = historyTaskView(record(), 40);
  const calls = [];
  const api = apiFor(query => { calls.push(query); return { version: 1, ok: true, rows: [view], total: 1 }; });
  const reader = createMediaTaskHistoryReader(api, FIRST);
  assert.equal((await reader.list({ taskId: 'task-1' }))[0].history.recordId, FIRST);
  assert.deepEqual(calls, [{ recordId: FIRST, limit: 1 }]);
  await assert.rejects(reader.list({ taskId: 'another-task' }), /任务ID不符/);
  const wrong = apiFor(() => ({ version: 1, ok: true, rows: [{ ...view, history: { ...view.history, recordId: SECOND } }], total: 1 }));
  await assert.rejects(createMediaTaskHistoryReader(wrong, FIRST).list({ taskId: 'task-1' }));
  await assert.rejects(readMediaTaskHistory(apiFor(() => ({ version: 1, ok: true, rows: {}, total: 0 })), { limit: 1 }));
});
test('pinned historical recovery performs two fresh reads and only an explicitly confirmed canvas write', async () => {
  const view = historyTaskView(record(), 40);
  let reads = 0, writes = 0, confirmations = 0;
  const api = apiFor(() => { reads++; return { version: 1, ok: true, rows: [view], total: 1 }; });
  const reader = createMediaTaskHistoryReader(api, FIRST);
  const nodes = {};
  const store = { getStateRaw: () => ({ nodes }), batch: fn => fn(), addNode: node => { nodes[node.id] = node; writes++; }, setSelectedNodes: () => {} };
  const preview = (await reader.list({ taskId: 'task-1' }))[0];
  const node = await recoverMediaTaskResult({ api: reader, preview, store, confirm: () => { confirmations++; return true; },
    buildNode: description => buildRecoveredMediaFields(description, 'recovered'), commit: () => {} });
  assert.equal(reads, 3);
  assert.equal(confirmations, 1);
  assert.equal(writes, 1);
  assert.equal(node.mediaTaskRecovery.historyRecordId, FIRST);
  assert.equal(hasRecoveredMediaTask(nodes, describeRecoverableTask(view)), true);
});
test('a changed pinned result during confirmation cannot add a canvas node', async () => {
  const view = historyTaskView(record(), 40);
  let reads = 0, writes = 0;
  const altered = { ...view, result: { ...view.result, localPath: 'output/ClipVideo/changed.mp4' } };
  const api = apiFor(() => ({ version: 1, ok: true, rows: [++reads === 3 ? altered : view], total: 1 }));
  const reader = createMediaTaskHistoryReader(api, FIRST);
  const nodes = {};
  const store = { getStateRaw: () => ({ nodes }), batch: fn => fn(), addNode: () => { writes++; }, setSelectedNodes: () => {} };
  const preview = (await reader.list({ taskId: 'task-1' }))[0];
  await assert.rejects(recoverMediaTaskResult({ api: reader, preview, store, confirm: () => true,
    buildNode: description => buildRecoveredMediaFields(description, 'recovered'), commit: () => {} }), /变化/);
  assert.equal(reads, 3);
  assert.equal(writes, 0);
});
