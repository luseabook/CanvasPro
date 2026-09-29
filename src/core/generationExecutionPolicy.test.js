import test from 'node:test';
import assert from 'node:assert/strict';

import { acquireGenerationExecution, setGenerationExecutionPolicy } from './generationExecutionPolicy.js';

test('generationExecutionPolicy: acquires the active policy and releases only its own binding', () => {
  const host = {};
  const releaseA = () => {};
  const releaseB = () => {};
  const setA = setGenerationExecutionPolicy(host, {
    acquire(kind, options) {
      assert.equal(kind, 'image');
      assert.deepEqual(options, { taskId: 'a' });
      return releaseA;
    },
  });

  assert.equal(acquireGenerationExecution(host, 'image', { taskId: 'a' }), releaseA);
  setGenerationExecutionPolicy(host, { acquire: () => releaseB });
  setA();
  assert.equal(acquireGenerationExecution(host, 'image'), releaseB);

  assert.equal(acquireGenerationExecution(host, 'image'), releaseB);
  assert.equal(typeof acquireGenerationExecution({}, 'image'), 'function');
});

test('generationExecutionPolicy: a later policy can replace an earlier one', () => {
  const host = {};
  const releaseA = () => {};
  const releaseB = () => {};
  setGenerationExecutionPolicy(host, { acquire: () => releaseA });
  setGenerationExecutionPolicy(host, { acquire: () => releaseB });

  assert.equal(acquireGenerationExecution(host), releaseB);
});
