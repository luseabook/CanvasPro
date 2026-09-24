// Offline safety contracts, not a real Electron/DOM opening test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { captureExternalProjectTarget, createSerialExternalProjectOpener, runGuardedExternalProjectOpen } from './externalProjectOpen.js';

function target() {
  return { manager: {}, nodes: {}, canvases: [{}], key: 'project:path:canvas' };
}
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test('target guard rejects an unready project instead of replacing a blank editor', () => {
  assert.throws(() => captureExternalProjectTarget(() => ({ manager: null, nodes: {}, canvases: [], key: '' })), /尚未就绪/);
});
test('target guard detects project identity, canvas selection, store and tab changes', () => {
  const initial = target();
  for (const changed of [
    { ...initial, key: 'other-project' },
    { ...initial, nodes: {} },
    { ...initial, canvases: [{}] },
    { ...initial, manager: {} },
  ]) {
    let current = initial;
    const assertCurrent = captureExternalProjectTarget(() => current);
    assert.doesNotThrow(assertCurrent);
    current = changed;
    assert.throws(assertCurrent, /已改变/);
  }
});
test('external open refuses a changed canvas before consent and before any apply', async () => {
  let current = target(), confirmations = 0, applies = 0;
  const gate = deferred();
  const pending = runGuardedExternalProjectOpen({ response: { filename: 'external.aicanvas' }, readTarget: () => current,
    prepare: () => gate.promise, confirmReplace: () => { confirmations++; return true; },
    apply: () => { applies++; return true; } });
  current = { ...current, nodes: {} };
  gate.resolve();
  await assert.rejects(pending, /已改变/);
  assert.equal(confirmations, 0);
  assert.equal(applies, 0);
});
test('consent happens after async preparation; cancel leaves the project unchanged', async () => {
  const current = target();
  let dirty = false, checks = 0, applies = 0;
  const response = { filename: 'external.aicanvas' };
  const cancelled = await runGuardedExternalProjectOpen({ response, readTarget: () => current,
    prepare: async () => { dirty = true; }, confirmReplace: value => { assert.equal(value, response); checks++; assert.equal(dirty, true); return false; },
    apply: () => { applies++; return true; } });
  assert.equal(cancelled, false);
  assert.equal(checks, 1);
  assert.equal(applies, 0);
});
test('a synchronous change inside confirmation also prevents replacement', async () => {
  let current = target(), applies = 0;
  await assert.rejects(runGuardedExternalProjectOpen({ response: {}, readTarget: () => current,
    prepare: async () => {}, confirmReplace: () => { current = { ...current, key: 'other-canvas' }; return true; },
    apply: () => { applies++; return true; } }), /已改变/);
  assert.equal(applies, 0);
});
test('unchanged target opens once only after explicit consent', async () => {
  const current = target();
  let applied = 0;
  const opened = await runGuardedExternalProjectOpen({ response: { filename: 'a.aicanvas' }, readTarget: () => current,
    prepare: async () => {}, confirmReplace: () => true, apply: () => { applied++; return true; } });
  assert.equal(opened, true);
  assert.equal(applied, 1);
});
test('startup drain and OS event batches serialize, and one failure does not drop the rest', async () => {
  const gate = deferred(), events = [], errors = [];
  const queue = createSerialExternalProjectOpener(async item => {
    events.push('start:' + item);
    if (item === 'first') await gate.promise;
    if (item === 'bad') throw new Error('bad request');
    events.push('end:' + item);
  }, error => errors.push(error.message));
  const a = queue(['first', 'bad']);
  const b = queue(['second']);
  await Promise.resolve();
  assert.deepEqual(events, ['start:first']);
  gate.resolve();
  await Promise.all([a, b]);
  assert.deepEqual(events, ['start:first', 'end:first', 'start:bad', 'start:second', 'end:second']);
  assert.deepEqual(errors, ['bad request']);
});
