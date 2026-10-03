import test from 'node:test';
import assert from 'node:assert/strict';
import { createRendererDeferredMediaController } from './rendererDeferredMedia.js';

test('deferred media pauses scheduled hydration and resumes the retained queue', () => {
  const requestDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestIdleCallback');
  const cancelDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'cancelIdleCallback');
  const callbacks = new Map();
  const hydrated = [];
  let nextHandle = 1;

  Object.defineProperty(globalThis, 'requestIdleCallback', {
    configurable: true,
    value(callback) {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      return handle;
    },
  });
  Object.defineProperty(globalThis, 'cancelIdleCallback', {
    configurable: true,
    value(handle) {
      callbacks.delete(handle);
    },
  });

  try {
    const controller = createRendererDeferredMediaController({
      batchSize: 2,
      getComponent: (id) => ({ hydrateDeferredMedia: () => hydrated.push(id) }),
    });

    controller.enqueue('first');
    controller.pause();
    controller.enqueue('second');

    assert.equal(callbacks.size, 0);
    assert.equal(controller.getQueuedCount(), 2);
    controller.flush();
    assert.deepEqual(hydrated, []);

    controller.resume();
    assert.equal(callbacks.size, 1);
    const [[handle, callback]] = callbacks;
    callbacks.delete(handle);
    callback({ didTimeout: true });

    assert.deepEqual(hydrated, ['first', 'second']);
    assert.equal(controller.getQueuedCount(), 0);
  } finally {
    if (requestDescriptor) Object.defineProperty(globalThis, 'requestIdleCallback', requestDescriptor);
    else delete globalThis.requestIdleCallback;
    if (cancelDescriptor) Object.defineProperty(globalThis, 'cancelIdleCallback', cancelDescriptor);
    else delete globalThis.cancelIdleCallback;
  }
});
