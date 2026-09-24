import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryMediaBatchRunner } from './storyMediaBatchRunner.js';

function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
function fixture(count = 2, overrides = {}) {
  const calls = [], lease = { release: () => calls.push('release'), verify: () => {}, assertNoLocalRunning: () => {},
    markAttempt: id => calls.push(`mark:${id}`), invoke: async id => calls.push(`invoke:${id}`),
    inspect: () => ({ state: 'succeeded', message: 'result' }), ...overrides };
  const runner = createStoryMediaBatchRunner({ items: Array.from({ length: count }, (_, i) => ({ nodeId: `n${i}` })),
    prepare: async () => lease, assertCurrent: () => {}, ...overrides.options });
  return { runner, calls, lease };
}
test('rejects empty, oversized and duplicate batches', () => {
  for (const items of [[], Array(7).fill({ nodeId: 'n' }), [{ nodeId: 'n' }, { nodeId: 'n' }]]) assert.throws(() => createStoryMediaBatchRunner({ items }));
});
test('prepare and opening a batch do not invoke generation', async () => {
  const { runner, calls } = fixture(); assert.equal(await runner.start(), false); await runner.prepare();
  assert.deepEqual(calls, []); assert.equal(runner.snapshot().prepared, true); runner.dispose();
});
test('marks before each invocation and serially waits for the previous Promise', async () => {
  const first = deferred(), calls = [];
  const { runner } = fixture(2, { markAttempt: id => calls.push(`mark:${id}`), invoke: id => { calls.push(`run:${id}`); return id === 'n0' ? first.promise : Promise.resolve(); } });
  await runner.prepare(); const pending = runner.start();
  assert.deepEqual(calls, ['mark:n0', 'run:n0']); first.resolve(); await pending;
  assert.deepEqual(calls, ['mark:n0', 'run:n0', 'mark:n1', 'run:n1']); runner.dispose();
});
test('double start does not duplicate an in-flight invocation', async () => {
  const wait = deferred(); let count = 0;
  const { runner } = fixture(1, { invoke: () => { count++; return wait.promise; } });
  await runner.prepare(); const pending = runner.start(); assert.equal(await runner.start(), false);
  wait.resolve(); await pending; assert.equal(count, 1); runner.dispose();
});
test('a second page-local runner is blocked while the first awaits', async () => {
  const wait = deferred(), a = fixture(1, { invoke: () => wait.promise }), b = fixture(1);
  await a.runner.prepare(); await b.runner.prepare(); const pending = a.runner.start();
  await assert.rejects(b.runner.start(), /另一个/); wait.resolve(); await pending;
  await b.runner.start(); a.runner.dispose(); b.runner.dispose();
});
test('pause stops only later items, then explicit start can continue held items', async () => {
  const wait = deferred(), calls = [];
  const { runner } = fixture(2, { invoke: id => { calls.push(id); return id === 'n0' ? wait.promise : Promise.resolve(); } });
  await runner.prepare(); const pending = runner.start(); runner.pause(); wait.resolve(); await pending;
  assert.deepEqual(calls, ['n0']); assert.equal(runner.snapshot().jobs[1].state, 'held');
  await runner.start(); assert.deepEqual(calls, ['n0', 'n1']); runner.dispose();
});
test('unknown outcome pauses rather than resending or advancing automatically', async () => {
  const { runner, calls } = fixture(2, { inspect: () => ({ state: 'unknown', message: 'check vendor' }) });
  await runner.prepare(); await runner.start();
  assert.deepEqual(calls, ['mark:n0', 'invoke:n0']); assert.equal(runner.snapshot().jobs[1].state, 'held');
  await runner.start(); assert.deepEqual(calls, ['mark:n0', 'invoke:n0', 'mark:n1', 'invoke:n1']); runner.dispose();
});
test('partial results pause the batch without discarding already returned results', async () => {
  const { runner, calls } = fixture(2, { inspect: () => ({ state: 'attention', message: 'partial' }) });
  await runner.prepare(); await runner.start(); assert.equal(runner.snapshot().jobs[0].state, 'attention');
  assert.equal(calls.filter(item => item.startsWith('invoke')).length, 1); runner.dispose();
});
test('native rejection is unknown, never automatically retried', async () => {
  const { runner, calls } = fixture(2, { invoke: async () => { throw new Error('private credential-like payload'); } });
  await runner.prepare(); await runner.start();
  assert.equal(runner.snapshot().jobs[0].state, 'unknown');
  assert.equal(JSON.stringify(runner.snapshot()).includes('private credential'), false); assert.deepEqual(calls, ['mark:n0']); runner.dispose();
});
test('attempt marker/commit failure prevents native invocation', async () => {
  const { runner, calls } = fixture(1, { markAttempt: () => { throw new Error('history failed'); } });
  await runner.prepare(); await runner.start(); assert.deepEqual(calls, []);
  assert.equal(runner.snapshot().jobs[0].state, 'blocked'); await runner.start(); assert.deepEqual(calls, []); runner.dispose();
});
test('whole-batch preflight failure prevents even the first request', async () => {
  const { runner, calls } = fixture(2, { verify: id => { if (id === 'n1') throw Error('changed'); } });
  await runner.prepare(); await runner.start(); assert.deepEqual(calls, []); runner.dispose();
});
test('each item is rechecked after the preceding request', async () => {
  let changed = false;
  const { runner, calls } = fixture(2, { invoke: async () => { changed = true; }, verify: () => { if (changed) throw Error('source changed'); } });
  await runner.prepare(); await runner.start(); assert.deepEqual(calls, ['mark:n0']);
  assert.equal(runner.snapshot().jobs[1].state, 'blocked'); runner.dispose();
});
test('continuation refuses a locally running task even if runGeneration returned early', async () => {
  let busy = false;
  const { runner, calls } = fixture(2, { invoke: async () => { busy = true; }, inspect: () => ({ state: 'unknown', message: 'still running' }),
    assertNoLocalRunning: () => { if (busy) throw Error('busy'); } });
  await runner.prepare(); await runner.start(); await runner.start();
  assert.deepEqual(calls, ['mark:n0']); runner.dispose();
});
test('dispose during a call defers unpin until settlement and never starts later jobs', async () => {
  const wait = deferred(), { runner, calls } = fixture(2, { invoke: () => wait.promise });
  await runner.prepare(); const pending = runner.start(); runner.dispose();
  assert.equal(calls.includes('release'), false); wait.resolve(); await pending;
  assert.deepEqual(calls, ['mark:n0', 'release']); assert.equal(await runner.start(), false);
});
test('dispose while preparing releases a late lease without generating', async () => {
  const wait = deferred(); let released = 0;
  const { runner } = fixture(1, { options: { prepare: () => wait.promise } });
  const pending = runner.prepare(); runner.dispose(); wait.resolve({ release: () => released++ });
  assert.equal(await pending, false); assert.equal(released, 1);
});
test('source context failure after return prevents further dispatch', async () => {
  let valid = true;
  const { runner, calls } = fixture(2, { invoke: async () => { valid = false; }, options: { assertCurrent: () => { if (!valid) throw Error('canvas changed'); } } });
  await runner.prepare(); await runner.start(); assert.deepEqual(calls, ['mark:n0']);
  assert.equal(runner.snapshot().jobs[0].state, 'unknown'); runner.dispose();
});
test('view callback exceptions cannot skip the attempt boundary or trigger a retry', async () => {
  const { runner, calls } = fixture(1, { options: { onChange: () => { throw Error('view removed'); } } });
  await runner.prepare(); await runner.start(); assert.deepEqual(calls, ['mark:n0', 'invoke:n0']); runner.dispose();
});
