import test from 'node:test';
import assert from 'node:assert/strict';
import { runCleanupSteps, registerPageTeardown } from './cleanupSteps.js';

test('cleanup failures and logger failures do not skip later controllers', () => {
  const calls = [];
  const errors = runCleanupSteps([
    () => { calls.push(1); throw new Error('fixture failure'); },
    () => calls.push(2),
    () => calls.push(3),
  ], { onError() { throw new Error('logger failure'); } });
  assert.deepEqual(calls, [1,2,3]);
  assert.equal(errors.length, 1);
});
test('cleanup is not registered on cancelable unload and survives BFCache', () => {
  const handlers = new Map(); let calls = 0;
  const window = { addEventListener: (n,f) => handlers.set(n,f), removeEventListener: n => handlers.delete(n) };
  registerPageTeardown(window, () => calls++);
  assert.equal(handlers.has('beforeunload'), false);
  handlers.get('pagehide')({ persisted: true });
  assert.equal(calls, 0); assert.equal(handlers.has('pagehide'), true);
  handlers.get('pagehide')({ persisted: false });
  assert.equal(calls, 1); assert.equal(handlers.size, 0);
});
