import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryWorkspace, createEpisode } from './storyWorkspaceModel.js';
import { createStoryAiQueueBatch } from './storyAiQueueModel.js';
import { createStoryAiQueueRunner } from './storyAiQueueRunner.js';
import { createStoryQueuePersistence } from './storyAiQueuePersistence.js';
import { createStoryQueueDatabase, getStoryQueueStorageScope } from './storyAiQueueStorage.js';
function host(project = 'project', canvas = 'canvas') { return { currentProjectId: project, _v2CurrentFile: project + '.aicanvas', CanvasTabManager: { getActiveCanvasId: () => canvas } }; }
function response() { return { text: JSON.stringify({ schemaVersion: 'story-ai-shots.v1', shots: [{ start: 1, end: 1, duration: 5, size: '中景', scene: '', characters: [], description: '画面' }] }) }; }
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function database() {
  const records = new Map(), held = new Set(); let serial = 0;
  return {
    records, held, writes: [], failWrite: false,
    async read(key) { return records.get(key) || null; },
    async write(key, raw, expected) {
      if (this.failWrite) throw new Error('quota');
      if ((records.get(key)?.revision ?? null) !== expected) throw new Error('conflict');
      const value = { key, raw, revision: 'revision-' + ++serial, updatedAt: serial };
      this.writes.push(value); records.set(key, value); return value;
    },
    async remove(key, expected) { if ((records.get(key)?.revision ?? null) !== expected) throw new Error('conflict'); records.delete(key); },
    async lock(key) { if (held.has(key)) throw new Error('locked'); held.add(key); return () => held.delete(key); },
  };
}
function harness(db = database(), execute = async () => response()) {
  const workspace = createStoryWorkspace(); workspace.episodes[0].script = '正文一'; workspace.episodes.push(createEpisode('第二集', '正文二'));
  let persistence, current = true;
  const scope = getStoryQueueStorageScope(host(), 'owner');
  const queue = createStoryAiQueueRunner({ ownerId: 'owner', execute, beforeRequest: () => { if (!current) throw new Error('source changed'); }, checkpoint: () => persistence.checkpoint() });
  queue.replace(createStoryAiQueueBatch(workspace, workspace.episodes.map(e => e.id), { provider: 'volcengine', model: 'volcengine/test' }, { count: 1 }));
  persistence = createStoryQueuePersistence({ queue, scope, isCurrent: () => current, database: db, delay: 10000 });
  return { queue, persistence, scope, db, changeSource() { current = false; } };
}
async function close(h) { h.queue.dispose(); await h.persistence.finish().catch(() => {}); }

test('scope separates project, canvas and workspace node identities', () => {
  const key = getStoryQueueStorageScope(host(), 'owner').key;
  assert.notEqual(getStoryQueueStorageScope(host('other'), 'owner').key, key);
  assert.notEqual(getStoryQueueStorageScope(host('project', 'other'), 'owner').key, key);
  assert.notEqual(getStoryQueueStorageScope(host(), 'other').key, key);
});
test('unidentified default projects and missing canvas disable automatic storage', () => {
  assert.equal(getStoryQueueStorageScope({ currentProjectId: 'default_v2_project', CanvasTabManager: { getActiveCanvasId: () => 'c' } }, 'n'), null);
  assert.equal(getStoryQueueStorageScope({ currentProjectId: 'p' }, 'n'), null);
});
test('unsupported database and lock fail explicitly without fallback success', async () => {
  const db = createStoryQueueDatabase({ indexedDB: null, locks: null });
  await assert.rejects(db.read('key')); await assert.rejects(db.lock('key'));
  assert.throws(() => db.write('key', 'x'.repeat(8 * 1024 * 1024 + 1), null));
});
test('no snapshot is persisted until explicitly enabled', async () => {
  const h = harness(); await h.persistence.probe(); await h.queue.start();
  assert.equal(h.db.writes.length, 0); assert.equal(h.persistence.getInfo().enabled, false); await close(h);
});
test('enable submits current queue and reports committed, not merely scheduled', async () => {
  const h = harness(); await h.persistence.enable();
  assert.equal(h.db.writes.length, 1); assert.equal(h.persistence.getInfo().dirty, false); assert.ok(h.persistence.getInfo().savedAt); await close(h);
});
test('a running marker is committed before the billable executor is called', async () => {
  const db = database(); let h, calls = 0;
  h = harness(db, async () => { calls++; const row = db.records.get(h.scope.key); assert.ok(JSON.parse(row.raw).jobs.some(job => job.status === 'running')); return response(); });
  await h.persistence.enable(); await h.queue.start();
  assert.equal(calls, 2); assert.ok(JSON.parse(db.records.get(h.scope.key).raw).jobs.every(job => job.status === 'ready')); await close(h);
});
test('failed pre-dispatch checkpoint prevents model calls and refunds the local attempt', async () => {
  let calls = 0; const h = harness(database(), async () => { calls++; return response(); }); await h.persistence.enable(); h.db.failWrite = true;
  await h.queue.start(); assert.equal(calls, 0); assert.equal(h.queue.getJobs()[0].status, 'blocked'); assert.equal(h.queue.getJobs()[0].attempts, 0);
  assert.ok(h.persistence.getInfo().error); await close(h);
});
test('post-response save failure keeps the result in memory and stops the next request', async () => {
  let h, calls = 0; h = harness(database(), async () => { calls++; h.db.failWrite = true; return response(); });
  await h.persistence.enable(); await h.queue.start();
  assert.equal(calls, 1); assert.equal(h.queue.getJobs()[0].status, 'ready'); assert.ok(h.queue.getJobs()[0].raw); assert.equal(h.queue.getJobs()[1].status, 'queued'); await close(h);
});
test('repairing storage saves latest memory state but never resumes generation', async () => {
  let calls = 0; const h = harness(database(), async () => { calls++; return response(); }); await h.persistence.enable(); h.db.failWrite = true; await h.queue.start();
  h.db.failWrite = false; await h.persistence.retry(); assert.equal(calls, 0); assert.equal(h.persistence.getInfo().dirty, false); await close(h);
});
test('existing records cannot be overwritten by enabling an empty/new session', async () => {
  const db = database(), first = harness(db); await first.persistence.enable(); await first.persistence.disable();
  const raw = db.records.get(first.scope.key).raw, second = harness(db); await assert.rejects(second.persistence.enable());
  assert.equal(db.records.get(first.scope.key).raw, raw); await close(first); await close(second);
});
test('recovery holds pending jobs and never invokes the executor', async () => {
  const db = database(), first = harness(db); await first.persistence.enable(); await first.persistence.disable();
  let calls = 0; const second = harness(db, async () => { calls++; return response(); }); await second.persistence.recover();
  assert.ok(second.queue.getJobs().every(job => job.status === 'held')); await second.queue.start(); assert.equal(calls, 0); await close(second); await close(first);
});
test('active storage leases prevent another auto-save session from acquiring the same scope', async () => {
  const db = database(), first = harness(db), second = harness(db); await first.persistence.enable();
  await assert.rejects(second.persistence.recover()); assert.equal(second.persistence.getInfo().enabled, false); await close(first); await close(second);
});
test('record revision conflict refuses overwrite and pauses rather than auto-accepting newer data', async () => {
  const h = harness(); await h.persistence.enable(); const current = h.db.records.get(h.scope.key);
  h.db.records.set(h.scope.key, { ...current, revision: 'foreign' }); h.queue.stopPending(); await assert.rejects(h.persistence.checkpoint());
  assert.equal(h.db.records.get(h.scope.key).revision, 'foreign'); assert.ok(h.persistence.getInfo().error); await close(h);
});
test('disabling leaves the committed record intact and requires explicit memory-only operation', async () => {
  const h = harness(); await h.persistence.enable(); await h.persistence.disable(); const raw = h.db.records.get(h.scope.key).raw;
  await h.queue.start(); assert.equal(h.db.records.get(h.scope.key).raw, raw); assert.equal(h.persistence.getInfo().enabled, false); await close(h);
});
test('deleting local copy disables saving but preserves queue jobs in memory', async () => {
  const h = harness(); await h.persistence.enable(); await h.persistence.remove();
  assert.equal(h.db.records.size, 0); assert.equal(h.queue.getJobs().length, 2); assert.equal(h.persistence.getInfo().enabled, false); await close(h);
});
test('finish retains lease until the outstanding request and final checkpoint settle', async () => {
  const wait = deferred(), dispatched = deferred();
  const h = harness(database(), () => { dispatched.resolve(); return wait.promise; }); await h.persistence.enable();
  const run = h.queue.start(); await dispatched.promise;
  h.queue.pause(); h.queue.dispose(); const finish = h.persistence.finish();
  assert.equal(h.db.held.size, 1); wait.resolve(response()); await run; await finish; assert.equal(h.db.held.size, 0);
});
test('source context is checked again after asynchronous pre-dispatch persistence', async () => {
  let calls = 0, h; h = harness(database(), async () => { calls++; return response(); }); await h.persistence.enable();
  const original = h.db.write.bind(h.db); h.db.write = async (...args) => { const record = await original(...args); h.changeSource(); return record; };
  await h.queue.start(); assert.equal(calls, 0); assert.equal(h.queue.getJobs()[0].status, 'blocked'); await close(h);
});
test('pause during pre-dispatch persistence prevents the executor from starting', async () => {
  let calls = 0, h; h = harness(database(), async () => { calls++; return response(); }); await h.persistence.enable();
  const original = h.db.write.bind(h.db); h.db.write = async (...args) => { const result = await original(...args); h.queue.pause(); return result; };
  await h.queue.start(); assert.equal(calls, 0); assert.equal(h.queue.getJobs()[0].attempts, 0); await close(h);
});
test('stale probe cannot replace metadata after a successful enable', async () => {
  const h = harness(), wait = deferred(); const original = h.db.read.bind(h.db); let first = true;
  h.db.read = async key => { if (first) { first = false; return wait.promise; } return original(key); };
  const probe = h.persistence.probe(); await h.persistence.enable(); wait.resolve(null); await probe;
  assert.equal(h.persistence.getInfo().hasRecord, true); assert.ok(h.persistence.getInfo().savedAt); await close(h);
});
test('corrupt saved JSON cannot partially replace the memory queue', async () => {
  const h = harness(), before = h.queue.snapshot();
  h.db.records.set(h.scope.key, { revision: 'bad', updatedAt: 1, raw: '{bad' }); await assert.rejects(h.persistence.recover());
  assert.equal(h.queue.snapshot(), before); assert.equal(h.db.held.size, 0); await close(h);
});
