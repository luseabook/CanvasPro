// Synthetic in-memory handlers only; no ffmpeg, provider calls or user files.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MediaTaskQueue } from './mediaTaskQueue.js';

test('duplicate ID cannot replace a running task, change its cancel target or reuse a terminal ID', async () => {
  const releases = new Map();
  const terminal = new Map();
  const ended = id => new Promise(resolve => terminal.set(id, resolve));
  const queue = new MediaTaskQueue({
    concurrency: 2,
    handlers: { synthetic: task => new Promise(resolve => releases.set(task.id, resolve)) },
    onUpdate: snapshot => {
      if (['complete', 'failed', 'cancelled'].includes(snapshot.status)) terminal.get(snapshot.taskId)?.(snapshot);
    },
  });
  const endA = ended('first'), endB = ended('second');
  const first = queue.enqueue({ kind: 'synthetic', taskId: 'first' });
  queue.enqueue({ kind: 'synthetic', taskId: 'second' });
  assert.equal(first.status, 'processing');
  assert.throws(() => queue.enqueue({ kind: 'synthetic', taskId: 'first' }), /Duplicate media task ID/);
  assert.equal(queue.list({ taskId: 'first' }).length, 1);
  assert.equal(queue.cancel('first').task.taskId, 'first');
  assert.equal(queue.get('second').status, 'processing');
  releases.get('first')({ success: true });
  releases.get('second')({ success: true });
  assert.equal((await endA).status, 'cancelled');
  assert.equal((await endB).status, 'complete');
  assert.throws(() => queue.enqueue({ kind: 'synthetic', taskId: 'first' }), /Duplicate media task ID/);
  assert.equal(queue.get('first').status, 'cancelled');
  assert.equal(queue.get('second').status, 'complete');
});

test('invalid task IDs never enter the queue or invoke a handler', () => {
  let started = 0;
  const queue = new MediaTaskQueue({ handlers: { synthetic: () => { started++; return {}; } } });
  for (const taskId of ['bad/id', 'a\nb', '.hidden', 'a'.repeat(257)]) {
    assert.throws(() => queue.enqueue({ kind: 'synthetic', taskId }), /Invalid media task ID/);
  }
  const badFactory = new MediaTaskQueue({ idFactory: () => '../bad', handlers: { synthetic: () => { started++; return {}; } } });
  assert.throws(() => badFactory.enqueue({ kind: 'synthetic' }), /Invalid media task ID/);
  assert.equal(started, 0);
  assert.equal(queue.tasks.size, 0);
  assert.equal(badFactory.tasks.size, 0);
});
