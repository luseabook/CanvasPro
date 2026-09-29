import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waitForImageElementReady } from './imageOverlayReadiness.js';

function fakeImage(over = {}) {
  const listeners = new Map();
  return {
    complete: 'complete' in over ? over.complete : false,
    naturalWidth: 'naturalWidth' in over ? over.naturalWidth : 0,
    listeners,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      const kept = (listeners.get(type) || []).filter((entry) => entry !== handler);
      listeners.set(type, kept);
    },
  };
}

function fire(image, type) {
  for (const handler of [...(image.listeners.get(type) || [])]) handler();
}

function fakeTimers() {
  const pending = new Map();
  let nextId = 1;
  return {
    pending,
    setTimeoutFn: (fn, delay) => {
      const id = nextId;
      nextId += 1;
      pending.set(id, { fn, delay });
      return id;
    },
    clearTimeoutFn: (id) => {
      pending.delete(id);
    },
    runAll() {
      const entries = [...pending.entries()];
      pending.clear();
      for (const [, entry] of entries) entry.fn();
    },
  };
}

test('reports an error when no image element is supplied', () => {
  const events = [];
  const timers = fakeTimers();
  const cleanup = waitForImageElementReady({
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  assert.deepEqual(events, ['error']);
  assert.equal(timers.pending.size, 0);
  assert.equal(typeof cleanup, 'function');
});

test('routes the timeout fallback through onError by default', () => {
  const events = [];
  const timers = fakeTimers();
  const image = fakeImage();
  waitForImageElementReady({
    image,
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    timeoutMs: 250,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  assert.equal(events.length, 0);
  assert.deepEqual(
    [...timers.pending.values()].map((entry) => entry.delay),
    [250],
  );
  timers.runAll();
  assert.deepEqual(events, ['error']);
});

test('calls onTimeout when one is supplied', () => {
  const events = [];
  const timers = fakeTimers();
  waitForImageElementReady({
    image: fakeImage(),
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    onTimeout: () => events.push('timeout'),
    timeoutMs: 100,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  timers.runAll();
  assert.deepEqual(events, ['timeout']);
});

test('skips the timer for a non-positive timeout', () => {
  for (const timeoutMs of [0, -5, 'nope']) {
    const timers = fakeTimers();
    waitForImageElementReady({
      image: fakeImage(),
      onError: () => {},
      timeoutMs,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });
    assert.equal(timers.pending.size, 0);
  }
});

test('settles immediately for an already-loaded image', () => {
  const events = [];
  const image = fakeImage({ complete: true, naturalWidth: 320 });
  waitForImageElementReady({
    image,
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    timeoutMs: 1000,
    setTimeoutFn: () => 1,
    clearTimeoutFn: () => {},
  });
  assert.deepEqual(events, ['ready']);
  assert.equal(image.listeners.get('load').length, 0);
  assert.equal(image.listeners.get('error').length, 0);
});

test('reports an error for a completed image with no pixels', () => {
  const events = [];
  const image = fakeImage({ complete: true, naturalWidth: 0 });
  waitForImageElementReady({
    image,
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    timeoutMs: 1000,
    setTimeoutFn: () => 1,
    clearTimeoutFn: () => {},
  });
  assert.deepEqual(events, ['error']);
});

test('resolves on the load event and then ignores later events', () => {
  const events = [];
  const timers = fakeTimers();
  const image = fakeImage();
  waitForImageElementReady({
    image,
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    timeoutMs: 500,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  fire(image, 'load');
  assert.deepEqual(events, ['ready']);
  assert.equal(timers.pending.size, 0);
  assert.equal(image.listeners.get('load').length, 0);
  fire(image, 'error');
  assert.deepEqual(events, ['ready']);
});

test('resolves with an error on the error event', () => {
  const events = [];
  const timers = fakeTimers();
  const image = fakeImage();
  waitForImageElementReady({
    image,
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    timeoutMs: 500,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  fire(image, 'error');
  assert.deepEqual(events, ['error']);
});

test('ignores the timeout once the image already settled', () => {
  const events = [];
  let captured;
  const image = fakeImage();
  waitForImageElementReady({
    image,
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    onTimeout: () => events.push('timeout'),
    timeoutMs: 500,
    setTimeoutFn: (fn) => {
      captured = fn;
      return 7;
    },
    clearTimeoutFn: () => {},
  });
  fire(image, 'load');
  captured();
  assert.deepEqual(events, ['ready']);
});

test('the returned cleanup detaches listeners and cancels the timer', () => {
  const cleared = [];
  const timers = fakeTimers();
  const image = fakeImage();
  const cleanup = waitForImageElementReady({
    image,
    onReady: () => {},
    onError: () => {},
    timeoutMs: 500,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: (id) => {
      cleared.push(id);
      timers.clearTimeoutFn(id);
    },
  });
  assert.equal(image.listeners.get('load').length, 1);
  cleanup();
  assert.equal(image.listeners.get('load').length, 0);
  assert.equal(image.listeners.get('error').length, 0);
  assert.equal(cleared.length, 1);
  assert.equal(timers.pending.size, 0);
});

test('calling the cleanup twice does not clear a second timer', () => {
  const cleared = [];
  const image = fakeImage();
  const cleanup = waitForImageElementReady({
    image,
    onError: () => {},
    timeoutMs: 500,
    setTimeoutFn: () => 11,
    clearTimeoutFn: (id) => cleared.push(id),
  });
  cleanup();
  cleanup();
  assert.deepEqual(cleared, [11]);
});

test('tolerates an image stub without listener methods', () => {
  const events = [];
  const timers = fakeTimers();
  waitForImageElementReady({
    image: { complete: false, naturalWidth: 0 },
    onReady: () => events.push('ready'),
    onError: () => events.push('error'),
    timeoutMs: 50,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn,
  });
  assert.deepEqual(events, []);
  timers.runAll();
  assert.deepEqual(events, ['error']);
});
