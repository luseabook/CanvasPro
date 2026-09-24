// These offline cases use a disposable temp directory; they do not touch user media or run handlers.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { MediaTaskHistoryStore } from './mediaTaskHistoryStore.js';
import { MediaTaskQueue } from './mediaTaskQueue.js';

async function fixture(t, options = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canvas-task-history-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = new MediaTaskHistoryStore({ storageRoot: root, debounceMs: 60_000, ...options });
  t.after(() => clearTimeout(store.timer));
  await store.ready;
  return { root, store, file: path.join(root, 'MediaTaskHistory', 'history.json') };
}
async function configure(store, enabled) {
  const status = await store.status();
  return store.configure({ enabled, expectedSession: status.sessionId, expectedControlRevision: status.controlRevision });
}
function snapshot(patch = {}) {
  return { taskId: 'task-1', nodeId: 'node-1', kind: 'mediaClipExport', status: 'complete',
    createdAt: 10, startedAt: 11, finishedAt: 20, result: {
      success: true, localPath: 'output/ClipVideo/a.mp4', videoDuration: 5 }, ...patch };
}

test('default-off status/read have no history file and never start a queue', async t => {
  const { store, file } = await fixture(t);
  const status = await store.status();
  assert.equal(status.enabled, false);
  assert.equal(status.persistedEnabled, false);
  assert.equal((await store.read()).total, 0);
  store.observe(snapshot(), {});
  assert.equal((await store.read()).total, 0);
  await assert.rejects(fs.stat(file), { code: 'ENOENT' });
});
test('explicit enable, bounded observation, readback and restart preserve only whitelisted output', async t => {
  const { root, store, file } = await fixture(t);
  const receipt = await configure(store, true);
  assert.equal(receipt.enabled, true);
  assert.equal(receipt.persistedEnabled, true);
  const identity = {};
  store.observe(snapshot({ payload: { apiKey: 'TOP-SECRET', prompt: 'PRIVATE-PROMPT' },
    error: 'PRIVATE-ERROR', result: { ...snapshot().result, providerResponse: 'RAW-PRIVATE' } }), identity);
  // A later update to the same native object replaces its record, not a second taskId record.
  store.observe(snapshot({ payload: { password: 'ANOTHER-SECRET' } }), identity);
  await store.flush();
  const bytes = await fs.readFile(file, 'utf8');
  for (const forbidden of ['TOP-SECRET', 'PRIVATE-PROMPT', 'PRIVATE-ERROR', 'RAW-PRIVATE', 'ANOTHER-SECRET']) {
    assert.equal(bytes.includes(forbidden), false);
  }
  assert.equal((await store.read()).total, 1);
  const restarted = new MediaTaskHistoryStore({ storageRoot: root });
  await restarted.ready;
  assert.equal((await restarted.status()).enabled, true);
  const rows = (await restarted.read()).rows;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].result.localPath, 'output/ClipVideo/a.mp4');
  assert.equal(rows[0].history.durable, true);
});
test('waiting and processing snapshots after restart are held/unknown without replaying handlers', async t => {
  const { root, store } = await fixture(t);
  await configure(store, true);
  store.observe(snapshot({ taskId: 'waiting', status: 'waiting', startedAt: 0, finishedAt: 0, result: null }), {});
  store.observe(snapshot({ taskId: 'running', status: 'processing', finishedAt: 0, result: null }), {});
  await store.flush();
  const restarted = new MediaTaskHistoryStore({ storageRoot: root });
  await restarted.ready;
  const rows = (await restarted.read()).rows;
  assert.deepEqual(new Set(rows.map(row => row.status)), new Set(['held', 'unknown']));
  assert.ok(rows.every(row => row.result === null));
  assert.equal((await restarted.status()).pending, false);
});
test('reused taskId remains separate when native task object identity changes', async t => {
  const { store } = await fixture(t);
  await configure(store, true);
  store.observe(snapshot({ status: 'failed', result: null }), {});
  store.observe(snapshot(), {});
  await store.flush();
  const rows = (await store.read({ taskId: 'task-1' })).rows;
  assert.equal(rows.length, 2);
  assert.notEqual(rows[0].history.recordId, rows[1].history.recordId);
});
test('external history edits stop reading and writing instead of overwriting the file', async t => {
  const { store, file } = await fixture(t);
  await configure(store, true);
  await fs.writeFile(file, '{"modified":"externally"}', 'utf8');
  await assert.rejects(store.read(), /历史/);
  assert.equal((await store.status()).canWrite, false);
  await assert.rejects(store.flush());
  assert.equal(await fs.readFile(file, 'utf8'), '{"modified":"externally"}');
});
test('corrupt or invalid existing file cannot be treated as an empty disabled history', async t => {
  const { root, file } = await fixture(t);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const invalid = '{"schema":"canvas.media-task-history.v1","revision":0,"enabled":true,"savedAt":0,"droppedCount":0,"records":[]}';
  await fs.writeFile(file, invalid, 'utf8');
  const restarted = new MediaTaskHistoryStore({ storageRoot: root });
  await restarted.ready;
  const status = await restarted.status();
  assert.equal(status.canWrite, false);
  assert.equal(status.persistedEnabled, null);
  await assert.rejects(restarted.read());
  assert.equal(await fs.readFile(file, 'utf8'), invalid);
});
test('a lock from another instance is never removed or stolen', async t => {
  const { root, store, file } = await fixture(t);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const lock = path.join(path.dirname(file), 'history.lock');
  await fs.writeFile(lock, 'another-instance', 'utf8');
  await assert.rejects(configure(store, true), /写锁/);
  assert.equal(await fs.readFile(lock, 'utf8'), 'another-instance');
  assert.equal((await store.status()).enabled, false);
});
test('two instances detect changed file hash and never silently merge or overwrite', async t => {
  const { root, store, file } = await fixture(t);
  const second = new MediaTaskHistoryStore({ storageRoot: root });
  await second.ready;
  await configure(store, true);
  const original = await fs.readFile(file, 'utf8');
  await assert.rejects(configure(second, true), /其他实例|修改/);
  assert.equal((await second.status()).canWrite, false);
  assert.equal(await fs.readFile(file, 'utf8'), original);
});
test('write failure has no success receipt, pauses new observations and leaves original tasks intact', async t => {
  const noRename = { ...fs, rename: async () => { const error = new Error('disk full'); error.code = 'ENOSPC'; throw error; } };
  const { store, file } = await fixture(t, { fs: noRename });
  await assert.rejects(configure(store, true), /空间不足/);
  const status = await store.status();
  assert.equal(status.enabled, false);
  assert.equal(status.persistedEnabled, false);
  assert.equal(status.problemCode, 'disk-full');
  store.observe(snapshot(), {});
  await assert.rejects(fs.stat(file), { code: 'ENOENT' });
});
test('observer failures are isolated from queue updates (no enqueue, cancel or retry)', () => {
  const updates = [];
  const queue = new MediaTaskQueue({ onSnapshot: () => { throw new Error('history unavailable'); },
    onUpdate: value => updates.push(value) });
  queue._emit({ id: 'task-1', nodeId: 'node-1', kind: 'videoReverse', payload: {},
    status: 'waiting', progress: 0, createdAt: 10, startedAt: 0, finishedAt: 0, result: null });
  assert.equal(updates.length, 1);
  assert.equal(updates[0].taskId, 'task-1');
  assert.equal(queue.tasks.size, 0);
});
