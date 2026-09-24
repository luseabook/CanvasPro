import test from 'node:test';
import assert from 'node:assert/strict';
import { createStoryAiRequestGate } from './storyAiRequestGate.js';

test('only one request is sent until the underlying promise settles', async () => {
  let release, calls = 0;
  const gate = createStoryAiRequestGate(() => { calls++; return new Promise(resolve => { release = resolve; }); });
  const first = gate.run({ prompt: 'test' }); assert.equal(gate.isPending(), true);
  await assert.rejects(gate.run({ prompt: 'duplicate' })); assert.equal(calls, 1);
  release({ text: 'done' }); assert.deepEqual(await first, { text: 'done' }); assert.equal(gate.isPending(), false);
});
test('a failed request is not automatically retried and the gate is released', async () => {
  let calls = 0;
  const gate = createStoryAiRequestGate(async () => { calls++; throw new Error('timeout'); });
  await assert.rejects(gate.run({})); assert.equal(calls, 1); assert.equal(gate.isPending(), false);
});
test('explicit later requests may run after settlement', async () => {
  let calls = 0;
  const gate = createStoryAiRequestGate(async () => ++calls);
  assert.equal(await gate.run({}), 1); assert.equal(await gate.run({}), 2);
});
