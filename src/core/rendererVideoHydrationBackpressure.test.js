import test from 'node:test';
import assert from 'node:assert/strict';

import {
  __rendererVideoHydrationBackpressureForTest,
  createRendererVideoHydrationBackpressure,
} from './rendererVideoHydrationBackpressure.js';

function createFrameHarness() {
  let nextId = 1;
  const frames = new Map();
  const cancelled = [];
  return {
    cancelFrame(id) {
      cancelled.push(id);
      frames.delete(id);
    },
    cancelled,
    flushNext() {
      const entry = frames.entries().next().value;
      assert.ok(entry, 'expected a pending animation frame');
      const [id, callback] = entry;
      frames.delete(id);
      callback();
    },
    get size() {
      return frames.size;
    },
    requestFrame(callback) {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
  };
}

test('rendererVideoHydrationBackpressure: allows one non-priority acquisition per frame', () => {
  const frames = createFrameHarness();
  const backpressure = createRendererVideoHydrationBackpressure({
    now: () => 0,
    requestFrame: frames.requestFrame,
    cancelFrame: frames.cancelFrame,
  });

  assert.equal(backpressure.tryAcquire(), true);
  assert.equal(backpressure.tryAcquire(), false);
  frames.flushNext();
  assert.equal(backpressure.tryAcquire(), true);
  assert.equal(backpressure.tryAcquire(), false);
});

test('rendererVideoHydrationBackpressure: cools down after priority work and releases after a long block', () => {
  const frames = createFrameHarness();
  let now = 0;
  const backpressure = createRendererVideoHydrationBackpressure({
    now: () => now,
    requestFrame: frames.requestFrame,
    cancelFrame: frames.cancelFrame,
    priorityCooldownMs: 100,
    longFrameThresholdMs: 20,
    maxNonPriorityBlockMs: 150,
  });

  backpressure.markPriorityWork();
  assert.equal(backpressure.tryAcquire(), false);

  now = 100;
  frames.flushNext();
  assert.equal(frames.size, 1);

  now = 151;
  frames.flushNext();
  assert.equal(backpressure.tryAcquire(), true);
  assert.equal(frames.size, 1);
});

test('rendererVideoHydrationBackpressure: reset cancels pending frames and restores initial state', () => {
  const frames = createFrameHarness();
  const backpressure = createRendererVideoHydrationBackpressure({
    now: () => 0,
    requestFrame: frames.requestFrame,
    cancelFrame: frames.cancelFrame,
    priorityCooldownMs: 100,
  });

  backpressure.markPriorityWork();
  assert.equal(frames.size, 1);
  backpressure.reset();
  assert.equal(frames.size, 0);
  assert.equal(frames.cancelled.length, 1);
  assert.equal(backpressure.tryAcquire(), true);
  assert.equal(__rendererVideoHydrationBackpressureForTest.DEFAULT_MAX_NON_PRIORITY_BLOCK_MS, 160);
});
