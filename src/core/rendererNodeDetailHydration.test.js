import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNodeDetailHydrationController,
  NODE_DETAIL_DEFERRED_CLASS,
} from './rendererNodeDetailHydration.js';

test('node detail hydration pauses without losing queued work and resumes it', () => {
  const requestDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'requestIdleCallback');
  const cancelDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'cancelIdleCallback');
  const callbacks = new Map();
  const hydrated = [];
  const classes = new Set();
  let nextHandle = 1;
  const wrapper = {
    classList: {
      add: (name) => classes.add(name),
      contains: (name) => classes.has(name),
      remove: (name) => classes.delete(name),
    },
    dataset: {},
    isConnected: true,
  };

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
    const controller = createNodeDetailHydrationController({
      getWrapper: () => wrapper,
      isMounted: () => true,
      onHydrateNodeDetails: (nodeId) => hydrated.push(nodeId),
    });

    controller.syncNodeDetailMountStage({
      wrapperEl: wrapper,
      node: { id: 'node-1' },
      nodeId: 'node-1',
      viewport: { zoom: 0.3 },
      mountCandidateCount: 1,
    });
    assert.equal(wrapper.classList.contains(NODE_DETAIL_DEFERRED_CLASS), true);

    controller.pause();
    assert.equal(callbacks.size, 0);
    controller.resumeNodeDetailHydration();
    assert.equal(callbacks.size, 1);

    const [[handle, callback]] = callbacks;
    callbacks.delete(handle);
    callback({ didTimeout: true });

    assert.deepEqual(hydrated, ['node-1']);
    assert.equal(wrapper.classList.contains(NODE_DETAIL_DEFERRED_CLASS), false);
    assert.equal(wrapper.dataset.detailStage, 'hydrated');
  } finally {
    if (requestDescriptor) Object.defineProperty(globalThis, 'requestIdleCallback', requestDescriptor);
    else delete globalThis.requestIdleCallback;
    if (cancelDescriptor) Object.defineProperty(globalThis, 'cancelIdleCallback', cancelDescriptor);
    else delete globalThis.cancelIdleCallback;
  }
});
