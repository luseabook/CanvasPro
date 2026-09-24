import test from 'node:test';
import assert from 'node:assert/strict';
import { createEpisode, createStoryWorkspace } from './storyWorkspaceModel.js';
import { createStoryAiQueueBatch } from './storyAiQueueModel.js';
import { createStoryAiQueueRunner } from './storyAiQueueRunner.js';
function jobs() {
  const workspace = createStoryWorkspace(); workspace.episodes[0].script = '正文一'; workspace.episodes.push(createEpisode('二', '正文二'));
  return createStoryAiQueueBatch(workspace, workspace.episodes.map(episode => episode.id), { provider: 'volcengine', model: 'volcengine/test' }, { count: 1 });
}
function response() { return { text: JSON.stringify({ schemaVersion: 'story-ai-shots.v1', shots: [{ start: 1, end: 1, duration: 5, size: '中景', scene: '', characters: [], description: '画面' }] }) }; }
function runner(execute, beforeRequest = () => {}) { const queue = createStoryAiQueueRunner({ ownerId: 'owner', execute, beforeRequest }); queue.replace(jobs()); return queue; }
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }

test('requests run serially and success is ready, never automatically applied', async () => {
  let active = 0, maximum = 0, calls = 0;
  const queue = runner(async () => { calls++; active++; maximum = Math.max(maximum, active); await Promise.resolve(); active--; return response(); });
  await queue.start(); assert.equal(calls, 2); assert.equal(maximum, 1); assert.deepEqual(queue.getJobs().map(job => job.status), ['ready', 'ready']);
});
test('pause prevents next dispatch but retains the already-started result', async () => {
  const wait = deferred(); let calls = 0;
  const queue = runner(() => { calls++; return wait.promise; }); const run = queue.start(); queue.pause();
  assert.equal(queue.isBusy(), true); assert.equal(queue.isRunning(), false); wait.resolve(response()); await run;
  assert.equal(calls, 1); assert.deepEqual(queue.getJobs().map(job => job.status), ['ready', 'queued']);
});
test('stop skips pending items without claiming cancellation of the running request', async () => {
  const wait = deferred(), queue = runner(() => wait.promise); const run = queue.start(); queue.stopPending();
  assert.deepEqual(queue.getJobs().map(job => job.status), ['running', 'cancelled']); wait.resolve(response()); await run;
  assert.deepEqual(queue.getJobs().map(job => job.status), ['ready', 'cancelled']);
});
test('double start and replacement during a request cannot duplicate dispatch', async () => {
  const wait = deferred(); let calls = 0; const queue = runner(() => { calls++; return wait.promise; });
  const run = queue.start(); await assert.rejects(queue.start()); assert.throws(() => queue.replace([]));
  queue.pause(); wait.resolve(response()); await run; assert.equal(calls, 1);
});
test('executor failure is uncertain, pauses the queue, and is not automatically retried', async () => {
  let calls = 0; const queue = runner(async () => { calls++; throw new Error('SECRET_PROVIDER_ERROR'); });
  await queue.start(); assert.equal(calls, 1); assert.deepEqual(queue.getJobs().map(job => job.status), ['unknown', 'queued']);
  assert.ok(!queue.snapshot().includes('SECRET_PROVIDER_ERROR'));
});
test('source or channel preflight failure spends no attempt and makes no request', async () => {
  let calls = 0; const queue = runner(async () => { calls++; return response(); }, () => { throw new Error('source changed'); });
  await queue.start(); assert.equal(calls, 0); assert.equal(queue.getJobs()[0].attempts, 0); assert.equal(queue.getJobs()[0].status, 'blocked');
});
test('bad JSON is retained for manual repair and stops automatic continuation', async () => {
  let calls = 0; const queue = runner(async () => { calls++; return { text: 'bad JSON' }; });
  await queue.start(); assert.equal(calls, 1); assert.equal(queue.getJobs()[0].status, 'invalid'); assert.equal(queue.getJobs()[0].raw, 'bad JSON');
  const id = queue.getJobs()[0].id; queue.editRaw(id, response().text); queue.validate(id);
  assert.equal(queue.getJobs()[0].status, 'ready'); assert.equal(calls, 1);
});
test('oversized response is rejected without automatic retry or storing the full body', async () => {
  let calls = 0; const queue = runner(async () => { calls++; return { text: 'x'.repeat(262145) }; });
  await queue.start(); assert.equal(calls, 1); assert.equal(queue.getJobs()[0].status, 'invalid'); assert.equal(queue.getJobs()[0].raw, '');
});
test('explicit requeue does not send; only a later start can send again', async () => {
  let calls = 0; const queue = runner(async () => { calls++; throw new Error('network'); }); await queue.start();
  const id = queue.getJobs()[0].id; queue.requeue(id); assert.equal(calls, 1); assert.equal(queue.getJobs()[0].status, 'queued');
  await queue.start(); assert.equal(calls, 2); assert.equal(queue.getJobs()[0].attempts, 2);
});
test('each job is limited to three explicit attempts', async () => {
  const queue = runner(async () => { throw new Error('network'); }); const id = queue.getJobs()[0].id;
  for (let i = 0; i < 3; i++) { if (i) queue.requeue(id); await queue.start(); }
  assert.throws(() => queue.requeue(id)); assert.equal(queue.getJobs()[0].attempts, 3);
});
test('restoring an old queued snapshot holds jobs and start sends nothing', async () => {
  let calls = 0; const queue = runner(async () => { calls++; return response(); }); const saved = queue.snapshot();
  queue.restore(saved); await queue.start(); assert.equal(calls, 0); assert.equal(queue.getJobs()[0].status, 'held');
});
test('an in-flight exported snapshot restores as uncertain, not runnable', async () => {
  const wait = deferred(), queue = runner(() => wait.promise); const run = queue.start(); const saved = queue.snapshot(); queue.pause(); wait.resolve(response()); await run;
  queue.restore(saved); assert.equal(queue.getJobs()[0].status, 'unknown'); assert.equal(queue.getJobs()[1].status, 'held');
});
test('invalid import leaves existing queue intact', () => {
  const queue = runner(async () => response()), saved = queue.snapshot(); assert.throws(() => queue.restore('{bad')); assert.equal(queue.snapshot(), saved);
});
test('applied results cannot be applied twice until explicitly reopened', async () => {
  const queue = runner(async () => response()); await queue.start(); const id = queue.getJobs()[0].id;
  assert.equal(queue.result(id).mode, 'shots'); queue.markApplied(id); assert.throws(() => queue.result(id));
  queue.reopenResult(id); assert.equal(queue.getJobs()[0].status, 'ready');
});
test('editing raw JSON invalidates a validated proposal', async () => {
  const queue = runner(async () => response()); await queue.start(); const id = queue.getJobs()[0].id;
  queue.editRaw(id, '{}'); assert.throws(() => queue.result(id)); assert.throws(() => queue.validate(id)); assert.equal(queue.getJobs()[0].status, 'invalid');
});
test('closing a runner prevents later dispatch but does not pretend to abort the executor', async () => {
  const wait = deferred(); let calls = 0; const queue = runner(() => { calls++; return wait.promise; }); const run = queue.start(); queue.dispose(); wait.resolve(response()); await run;
  assert.equal(calls, 1); await assert.rejects(queue.start());
});
test('listeners may pause immediately after dispatch, without losing its result', async () => {
  let calls = 0; const queue = runner(async () => { calls++; return response(); });
  queue.subscribe(() => { if (queue.getJobs().some(job => job.status === 'running') && queue.isRunning()) queue.pause(); });
  await queue.start(); assert.equal(calls, 1); assert.equal(queue.getJobs()[0].status, 'ready');
});
test('exposed input and model snapshots cannot be mutated in place', () => {
  const queue = runner(async () => response()), job = queue.getJobs()[0];
  assert.throws(() => { job.input.script = 'tamper'; }); assert.throws(() => { job.model.model = 'other'; });
  job.status = 'ready'; assert.equal(queue.getJobs()[0].status, 'queued');
});
