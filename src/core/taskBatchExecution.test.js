import test from 'node:test';
import assert from 'node:assert/strict';

import { createTaskBatchCancellationController, runTaskBatchQueue } from './taskBatchExecution.js';

const waitTurn = () => new Promise((resolve) => setImmediate(resolve));

test('taskBatchExecution: cancellation controller latches the first request', () => {
  const cancellation = createTaskBatchCancellationController();

  assert.equal(cancellation.isRequested(), false);
  assert.equal(cancellation.request(), true);
  assert.equal(cancellation.request(), false);
  assert.equal(cancellation.isRequested(), true);
});

test('taskBatchExecution: runs with bounded concurrency and preserves result order', async () => {
  const pending = new Map();
  const starts = [];
  const settled = [];
  const queuePromise = runTaskBatchQueue({
    targets: ['a', 'b', 'c', 'd'],
    concurrency: 2,
    runTarget: (target) =>
      new Promise((resolve, reject) => {
        pending.set(target, { resolve, reject });
      }),
    onTargetStart: ({ target, index, total }) => starts.push({ target, index, total }),
    onTargetSettled: ({ target, status, index }) => settled.push({ target, status, index }),
  });

  await waitTurn();
  assert.deepEqual(
    starts.map(({ target }) => target),
    ['a', 'b'],
  );

  const failure = new Error('b failed');
  pending.get('b').reject(failure);
  await waitTurn();
  assert.deepEqual(
    starts.map(({ target }) => target),
    ['a', 'b', 'c'],
  );

  pending.get('a').resolve(1);
  await waitTurn();
  assert.deepEqual(
    starts.map(({ target }) => target),
    ['a', 'b', 'c', 'd'],
  );
  pending.get('c').resolve(3);
  pending.get('d').resolve(4);

  const results = await queuePromise;
  assert.deepEqual(
    results.map(({ target, status }) => [target, status]),
    [
      ['a', 'fulfilled'],
      ['b', 'rejected'],
      ['c', 'fulfilled'],
      ['d', 'fulfilled'],
    ],
  );
  assert.equal(results[1].reason, failure);
  assert.deepEqual(settled, [
    { target: 'b', status: 'rejected', index: 1 },
    { target: 'a', status: 'fulfilled', index: 0 },
    { target: 'c', status: 'fulfilled', index: 2 },
    { target: 'd', status: 'fulfilled', index: 3 },
  ]);
});

test('taskBatchExecution: marks unstarted work cancelled when the stop predicate closes', async () => {
  let shouldStop = false;
  const results = await runTaskBatchQueue({
    targets: ['a', 'b', 'c'],
    concurrency: 1,
    shouldStop: () => shouldStop,
    runTarget: async (target) => target.toUpperCase(),
    onTargetSettled: () => {
      shouldStop = true;
    },
  });

  assert.deepEqual(
    results.map(({ target, status }) => [target, status]),
    [
      ['a', 'fulfilled'],
      ['b', 'cancelled'],
      ['c', 'cancelled'],
    ],
  );
});
