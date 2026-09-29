import test from 'node:test';
import assert from 'node:assert/strict';

import { createRendererViewportCommitGate } from './rendererViewportCommitGate.js';

test('rendererViewportCommitGate: requires a matching pan or zoom revision', () => {
  const calls = [];
  const gate = createRendererViewportCommitGate({
    delayMs: 40,
    shouldDefer(context) {
      calls.push(context);
      return true;
    },
  });

  assert.equal(gate.delayMs, 40);
  assert.equal(gate.consumeShouldDefer(2, 3, {}), false);
  gate.remember('idle', 2, 3);
  assert.equal(gate.consumeShouldDefer(2, 3, {}), false);
  gate.remember('panning', 2, 3);
  assert.equal(gate.consumeShouldDefer(2, 4, {}), false);
  assert.equal(gate.consumeShouldDefer(2, 3, { x: 1 }), true);
  assert.equal(gate.consumeShouldDefer(2, 3, { x: 1 }), false);
  assert.deepEqual(calls, [{ nodeCount: 2, edgesRev: 3, viewport: { x: 1 } }]);
});

test('rendererViewportCommitGate: reset clears both the revision and one-shot latch', () => {
  const gate = createRendererViewportCommitGate({ shouldDefer: () => true });
  gate.remember('zooming', 1, 2);
  assert.equal(gate.consumeShouldDefer(1, 2, {}), true);
  gate.remember('zooming', 1, 2);
  gate.reset();
  assert.equal(gate.consumeShouldDefer(1, 2, {}), false);
});
