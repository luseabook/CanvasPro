import test from 'node:test';
import assert from 'node:assert/strict';

import { createRendererPresentationSubscription } from './rendererPresentationSubscription.js';

function createFrameHarness() {
  let nextId = 1;
  const frames = new Map();
  const cancelled = [];
  return {
    cancelled,
    requestFrame(callback) {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      cancelled.push(id);
      frames.delete(id);
    },
    flush() {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback());
    },
    get size() {
      return frames.size;
    },
  };
}

test('rendererPresentationSubscription: coalesces snapshots, suspends and resumes', () => {
  const frameHarness = createFrameHarness();
  const events = [];
  let rawListener;
  let unsubscribed = false;
  const subscription = createRendererPresentationSubscription({
    onSnapshot: (snapshot) => events.push(['snapshot', snapshot]),
    render: (snapshot) => events.push(['render', snapshot]),
    onSuspend: () => events.push(['suspend']),
    onResume: () => events.push(['resume']),
    requestFrame: frameHarness.requestFrame,
    cancelFrame: frameHarness.cancelFrame,
  });

  subscription.connect({
    subscribeRaw(listener) {
      rawListener = listener;
      return () => {
        unsubscribed = true;
      };
    },
  });
  assert.deepEqual(events, [['resume']]);
  assert.equal(subscription.isActive(), true);

  rawListener('first');
  rawListener('second');
  assert.deepEqual(events, [['resume'], ['snapshot', 'first'], ['snapshot', 'second']]);
  assert.equal(subscription.hasPendingFrame(), true);
  assert.equal(frameHarness.size, 1);

  frameHarness.flush();
  assert.deepEqual(events.at(-1), ['render', 'second']);
  assert.equal(subscription.hasPendingFrame(), false);

  subscription.setActive(false);
  assert.deepEqual(events.at(-1), ['suspend']);
  assert.equal(subscription.isActive(), false);
  rawListener('while-suspended');
  assert.deepEqual(events.at(-1), ['snapshot', 'while-suspended']);
  assert.equal(subscription.hasPendingFrame(), false);

  subscription.setActive(true);
  assert.equal(events.at(-2)[0], 'resume');
  assert.deepEqual(events.at(-1), ['snapshot', 'while-suspended']);
  frameHarness.flush();
  assert.deepEqual(events.at(-1), ['render', 'while-suspended']);

  subscription.dispose();
  assert.equal(unsubscribed, true);
  assert.equal(subscription.isActive(), false);
});

test('rendererPresentationSubscription: selection flush can stop snapshot rendering', () => {
  const frameHarness = createFrameHarness();
  let rawListener;
  const snapshots = [];
  const subscription = createRendererPresentationSubscription({
    onSnapshot: (snapshot) => snapshots.push(snapshot),
    flushSelection: () => true,
    render: () => assert.fail('render must not run'),
    requestFrame: frameHarness.requestFrame,
    cancelFrame: frameHarness.cancelFrame,
  });
  subscription.connect({
    subscribeRaw(listener) {
      rawListener = listener;
      return () => {};
    },
  });

  rawListener('selection-only');
  assert.deepEqual(snapshots, []);
  assert.equal(subscription.hasPendingFrame(), false);
  assert.equal(frameHarness.size, 0);
});

test('rendererPresentationSubscription: clearing a pending snapshot preserves the scheduled frame', () => {
  const frameHarness = createFrameHarness();
  let rawListener;
  const renders = [];
  const subscription = createRendererPresentationSubscription({
    onSnapshot: () => {},
    render: (snapshot) => renders.push(snapshot),
    requestFrame: frameHarness.requestFrame,
    cancelFrame: frameHarness.cancelFrame,
  });
  subscription.connect({
    subscribeRaw(listener) {
      rawListener = listener;
      return () => {};
    },
  });

  rawListener('discarded');
  subscription.clearPendingSnapshot();
  frameHarness.flush();
  assert.deepEqual(renders, [null]);
});
