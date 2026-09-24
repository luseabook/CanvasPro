import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createWebPreviewRemoteInputQueue,
  __webPreviewRemoteInputQueueForTest,
} from './webPreviewRemoteInputQueue.js';

const { mergePendingInput } = __webPreviewRemoteInputQueueForTest;

const mouseMoved = (x, y) => ({ kind: 'mouse', type: 'mouseMoved', x: x, y: y });
const mouseWheel = (deltaX, deltaY) => ({
  kind: 'mouse',
  type: 'mouseWheel',
  deltaX: deltaX,
  deltaY: deltaY,
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const settleAll = async () => {
  for (let tick = 0; tick < 8; tick += 1) await settle();
};

function createAutoSend() {
  const calls = [];
  let active = 0,
    maxActive = 0;
  const send = async (input) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    calls.push(input);
    await settle();
    active -= 1;
  };
  return {
    send: send,
    get calls() {
      return calls;
    },
    get maxActive() {
      return maxActive;
    },
  };
}

function createManualSend() {
  const calls = [];
  const waiting = [];
  return {
    calls: calls,
    waiting: waiting,
    send: (input) => {
      calls.push(input);
      return new Promise((resolve, reject) => waiting.push({ resolve: resolve, reject: reject }));
    },
    async flush() {
      while (waiting.length > 0) {
        waiting.shift().resolve();
        await settle();
      }
      await settle();
    },
  };
}

test('requires a sender function', () => {
  assert.throws(() => createWebPreviewRemoteInputQueue(), {
    name: 'TypeError',
    message: 'Web preview remote input sender is required',
  });
  assert.throws(() => createWebPreviewRemoteInputQueue({}), {
    name: 'TypeError',
    message: 'Web preview remote input sender is required',
  });
  assert.throws(() => createWebPreviewRemoteInputQueue({ send: null }), {
    name: 'TypeError',
  });
  assert.throws(() => createWebPreviewRemoteInputQueue({ send: 'send' }), {
    name: 'TypeError',
  });
});

test('exposes only enqueue and dispose', () => {
  const queue = createWebPreviewRemoteInputQueue({ send: () => {} });
  assert.deepEqual(Object.keys(queue).sort(), ['dispose', 'enqueue']);
});

test('enqueue rejects disposed, non-object and falsy inputs', async () => {
  const harness = createAutoSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  assert.equal(queue.enqueue(null), false);
  assert.equal(queue.enqueue(0), false);
  assert.equal(queue.enqueue(''), false);
  assert.equal(queue.enqueue('mouseMoved'), false);
  assert.equal(queue.enqueue(true), false);
  assert.equal(queue.enqueue(mouseMoved(1, 1)), true);
  await settle();
  assert.equal(harness.calls.length, 1);
  queue.dispose();
  assert.equal(queue.enqueue(mouseMoved(2, 2)), false);
  await settle();
  assert.equal(harness.calls.length, 1);
});

test('enqueue without arguments still queues an empty input', async () => {
  const harness = createAutoSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  assert.equal(queue.enqueue(), true);
  await settle();
  assert.deepEqual(harness.calls, [{}]);
});

test('sends queued inputs serially and in order', async () => {
  const harness = createAutoSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  const first = { kind: 'key', type: 'keyDown', key: 'a' };
  const second = { kind: 'key', type: 'keyUp', key: 'a' };
  const third = { kind: 'mouse', type: 'mousePressed', button: 'left' };
  queue.enqueue(first);
  queue.enqueue(second);
  queue.enqueue(third);
  await settleAll();
  assert.deepEqual(harness.calls, [first, second, third]);
  assert.equal(harness.maxActive, 1);
});

test('enqueue copies the caller payload', async () => {
  const harness = createManualSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  const input = mouseMoved(1, 2);
  queue.enqueue(input);
  input.x = 99;
  await harness.flush();
  assert.deepEqual(harness.calls, [{ kind: 'mouse', type: 'mouseMoved', x: 1, y: 2 }]);
});

test('merges consecutive moves queued behind an in-flight input', async () => {
  const harness = createManualSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  queue.enqueue(mouseMoved(1, 1));
  queue.enqueue(mouseMoved(2, 2));
  queue.enqueue(mouseMoved(3, 3));
  await harness.flush();
  assert.deepEqual(harness.calls, [mouseMoved(1, 1), mouseMoved(3, 3)]);
});

test('sums wheel deltas and keeps the newer payload fields', async () => {
  const harness = createManualSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  queue.enqueue({ kind: 'mouse', type: 'mousePressed', button: 'left' });
  queue.enqueue({ kind: 'mouse', type: 'mouseWheel', deltaX: 4, deltaY: -8, modifiers: 1 });
  queue.enqueue({ kind: 'mouse', type: 'mouseWheel', deltaX: '6', deltaY: 2, note: 'next' });
  await harness.flush();
  assert.deepEqual(harness.calls, [
    { kind: 'mouse', type: 'mousePressed', button: 'left' },
    { kind: 'mouse', type: 'mouseWheel', deltaX: 10, deltaY: -6, note: 'next' },
  ]);
});

test('does not merge a move with a wheel and keeps both', async () => {
  const harness = createManualSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'x' });
  queue.enqueue(mouseMoved(1, 1));
  queue.enqueue(mouseWheel(1, 1));
  await harness.flush();
  assert.deepEqual(harness.calls, [
    { kind: 'key', type: 'keyDown', key: 'x' },
    mouseMoved(1, 1),
    mouseWheel(1, 1),
  ]);
});

test('never merges non-mouse inputs', async () => {
  const harness = createManualSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'a' });
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'a' });
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'b' });
  await harness.flush();
  assert.deepEqual(harness.calls, [
    { kind: 'key', type: 'keyDown', key: 'a' },
    { kind: 'key', type: 'keyDown', key: 'a' },
    { kind: 'key', type: 'keyDown', key: 'b' },
  ]);
});

test('a failing sender does not stall or reject the queue', async () => {
  const calls = [];
  const queue = createWebPreviewRemoteInputQueue({
    send: async (input) => {
      calls.push(input);
      if (input.type === 'mouseMoved') throw new Error('transport down');
    },
  });
  queue.enqueue(mouseMoved(1, 1));
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'a' });
  await settleAll();
  assert.deepEqual(calls, [mouseMoved(1, 1), { kind: 'key', type: 'keyDown', key: 'a' }]);
});

test('dispose drops pending inputs and stops the drain', async () => {
  const harness = createManualSend();
  const queue = createWebPreviewRemoteInputQueue({ send: harness.send });
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'a' });
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'b' });
  queue.enqueue({ kind: 'key', type: 'keyDown', key: 'c' });
  queue.dispose();
  await harness.flush();
  assert.deepEqual(harness.calls, [{ kind: 'key', type: 'keyDown', key: 'a' }]);
  assert.equal(queue.enqueue({ kind: 'key', type: 'keyDown', key: 'd' }), false);
  await settle();
  assert.equal(harness.calls.length, 1);
});

test('dispose is idempotent', () => {
  const queue = createWebPreviewRemoteInputQueue({ send: () => {} });
  queue.dispose();
  queue.dispose();
  assert.equal(queue.enqueue(mouseMoved(1, 1)), false);
});

test('two queues keep independent state', async () => {
  const first = createAutoSend();
  const second = createAutoSend();
  const queueA = createWebPreviewRemoteInputQueue({ send: first.send });
  const queueB = createWebPreviewRemoteInputQueue({ send: second.send });
  queueA.enqueue({ kind: 'key', type: 'keyDown', key: 'a' });
  queueA.enqueue({ kind: 'key', type: 'keyDown', key: 'b' });
  await settleAll();
  assert.equal(first.calls.length, 2);
  assert.deepEqual(second.calls, []);
  queueB.dispose();
  queueA.enqueue({ kind: 'key', type: 'keyDown', key: 'c' });
  await settleAll();
  assert.equal(first.calls.length, 3);
  assert.deepEqual(second.calls, []);
});

test('mergePendingInput only folds identical mouse kinds', () => {
  assert.deepEqual(mergePendingInput(mouseMoved(1, 1), mouseMoved(2, 2)), mouseMoved(2, 2));
  assert.deepEqual(mergePendingInput(mouseWheel(2, 3), mouseWheel(-1, 4)), {
    kind: 'mouse',
    type: 'mouseWheel',
    deltaX: 1,
    deltaY: 7,
  });
  assert.equal(mergePendingInput(mouseMoved(1, 1), mouseWheel(1, 1)), null);
  assert.equal(mergePendingInput(mouseWheel(1, 1), mouseMoved(1, 1)), null);
  assert.equal(mergePendingInput({ kind: 'key', type: 'mouseMoved' }, mouseMoved(1, 1)), null);
  assert.equal(mergePendingInput(mouseMoved(1, 1), { kind: 'mouse', type: 'mousePressed' }), null);
  assert.equal(mergePendingInput(null, mouseMoved(1, 1)), null);
  assert.equal(mergePendingInput(mouseMoved(1, 1), 'mouseMoved'), null);
});

test('mergePendingInput treats non-numeric wheel deltas as zero', () => {
  assert.deepEqual(mergePendingInput(mouseWheel(undefined, undefined), mouseWheel(2, 3)), {
    kind: 'mouse',
    type: 'mouseWheel',
    deltaX: 2,
    deltaY: 3,
  });
  assert.deepEqual(mergePendingInput(mouseWheel(2, 3), mouseWheel('x', null)), {
    kind: 'mouse',
    type: 'mouseWheel',
    deltaX: 2,
    deltaY: 3,
  });
  assert.deepEqual(mergePendingInput(mouseWheel(null, null), mouseWheel(undefined, undefined)), {
    kind: 'mouse',
    type: 'mouseWheel',
    deltaX: 0,
    deltaY: 0,
  });
});

test('mergePendingInput keeps the newer object untouched', () => {
  const previous = mouseMoved(1, 1);
  const next = mouseMoved(2, 2);
  const merged = mergePendingInput(previous, next);
  assert.notEqual(merged, previous);
  assert.notEqual(merged, next);
  assert.deepEqual(merged, mouseMoved(2, 2));
});
