import test from 'node:test';
import assert from 'node:assert/strict';

import { emitNodeDeletions, subscribeNodeDeletions } from './nodeDeletionEvents.js';

test('nodeDeletionEvents: requires listeners and ignores empty deletion batches', () => {
  assert.throws(() => subscribeNodeDeletions(null), /requires a listener/);
  assert.equal(emitNodeDeletions(), false);
  assert.equal(emitNodeDeletions([]), false);
  assert.equal(emitNodeDeletions('not-an-array'), false);
});

test('nodeDeletionEvents: broadcasts to every live listener and isolates failures', () => {
  const seen = [];
  const originalError = console.error;
  console.error = () => {};
  const unsubscribeThrowing = subscribeNodeDeletions(() => {
    throw new Error('listener failed');
  });
  const unsubscribe = subscribeNodeDeletions((ids) => seen.push(ids));
  try {
    const ids = ['a', 'b'];
    assert.equal(emitNodeDeletions(ids), true);
    assert.deepEqual(seen, [ids]);
    unsubscribe();
    assert.equal(emitNodeDeletions(['c']), true);
    assert.deepEqual(seen, [ids]);
  } finally {
    unsubscribeThrowing();
    console.error = originalError;
  }
});
