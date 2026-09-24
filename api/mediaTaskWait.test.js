// Offline fake bridge only; none of these cases launches a host job or media process.
import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForExactMediaTask } from './mediaTaskWait.js';

function fixture() {
  const listeners = new Set();
  const calls = { list: [], unsubscribe: 0, enqueue: 0, cancel: 0 };
  return {
    calls,
    onUpdate(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); calls.unsubscribe++; };
    },
    list(request) { calls.list.push(request); return []; },
    enqueue() { calls.enqueue++; throw new Error('must not enqueue'); },
    cancel() { calls.cancel++; throw new Error('must not cancel'); },
    emit(task) { for (const listener of [...listeners]) listener(task); },
  };
}
const completed = (taskId, value = 1) => ({ taskId, status: 'complete', result: { value } });

test('exact host read closes the enqueue-reply/event-subscription gap without another job', async () => {
  const b = fixture();
  b.list = request => { b.calls.list.push(request); return [completed('other', 99), completed('mine', 7)]; };
  assert.deepEqual(await waitForExactMediaTask(b, 'mine', { timeout: 1000 }), { value: 7 });
  assert.deepEqual(b.calls.list, [{ taskId: 'mine' }]);
  assert.equal(b.calls.unsubscribe, 1);
  assert.equal(b.calls.enqueue + b.calls.cancel, 0);
});

test('live terminal event wins over a late and stale list response', async () => {
  const b = fixture(); let reply;
  b.list = request => { b.calls.list.push(request); return new Promise(resolve => { reply = resolve; }); };
  const pending = waitForExactMediaTask(b, 'mine', { timeout: 1000 });
  await Promise.resolve(); // read started after subscribing
  b.emit(completed('mine', 4));
  reply([completed('mine', 99)]);
  assert.deepEqual(await pending, { value: 4 });
  assert.equal(b.calls.unsubscribe, 1);
});

test('another task ID never supplies a result; exact live event still works', async () => {
  const b = fixture();
  b.list = () => [completed('other', 99)];
  const pending = waitForExactMediaTask(b, 'mine', { timeout: 1000 });
  await Promise.resolve(); await Promise.resolve();
  b.emit(completed('mine', 3));
  assert.deepEqual(await pending, { value: 3 });
});

test('duplicate exact task ID in a legacy list is ambiguous, not a result', async () => {
  const b = fixture(); const failures = [];
  b.list = () => [completed('mine'), completed('mine', 2)];
  await assert.rejects(waitForExactMediaTask(b, 'mine', {
    timeout: 1000, onFailure: failure => failures.push(failure),
  }), /Ambiguous media task ID/);
  assert.equal(failures[0].status, 'ambiguous');
  assert.equal(b.calls.unsubscribe, 1);
  assert.equal(b.calls.enqueue + b.calls.cancel, 0);
});

test('failed read keeps listening; timeout never calls cancel or enqueue', async () => {
  const b = fixture(); b.list = () => Promise.reject(new Error('read unavailable'));
  const pending = waitForExactMediaTask(b, 'mine', { timeout: 1000 });
  await Promise.resolve(); await Promise.resolve();
  b.emit(completed('mine', 5));
  assert.deepEqual(await pending, { value: 5 });
  const silent = fixture();
  await assert.rejects(waitForExactMediaTask(silent, 'missing', { timeout: 5 }), /may still be running/);
  assert.equal(silent.calls.unsubscribe, 1);
  assert.equal(silent.calls.enqueue + silent.calls.cancel, 0);
});

test('cancel and failure are distinct from timeout, and synchronous delivery cleans up', async () => {
  const failures = [];
  for (const [status, message] of [['cancelled', 'Media task cancelled'], ['failed', 'bad input']]) {
    const b = fixture(); b.list = () => [{ taskId: 'mine', status, error: 'bad input' }];
    await assert.rejects(waitForExactMediaTask(b, 'mine', {
      timeout: 1000, onFailure: failure => failures.push(failure),
    }), error => error.message === message);
    assert.equal(b.calls.unsubscribe, 1);
  }
  assert.deepEqual(failures.map(f => f.status), ['cancelled', 'failed']);
  let removed = 0;
  const immediate = { onUpdate(fn) { fn(completed('now', 2)); return () => { removed++; }; },
    list() { throw new Error('already settled; no query'); } };
  assert.deepEqual(await waitForExactMediaTask(immediate, 'now'), { value: 2 });
  assert.equal(removed, 1);
});
