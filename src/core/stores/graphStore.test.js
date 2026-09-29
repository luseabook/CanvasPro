import test from 'node:test';
import assert from 'node:assert/strict';

import { GRAPH_ACTION_NAMES, createGraphStore } from './graphStore.js';

test('graphStore: exposes node field subscriptions without slicing their payload', () => {
  const calls = [];
  const unsubscribe = () => {};
  const coreStore = {
    subscribe: () => () => {},
    subscribeRaw: () => () => {},
    subscribeSelector: () => () => {},
    getState: () => ({}),
    getStateRaw: () => ({}),
    subscribeNodeField: (field, listener) => {
      calls.push([field, listener]);
      return unsubscribe;
    },
  };
  const listener = () => {};
  const store = createGraphStore(coreStore);

  assert.equal(GRAPH_ACTION_NAMES.includes('subscribeNodeField'), true);
  assert.equal(store.subscribeNodeField('rhAiAppManifestBundle', listener), unsubscribe);
  assert.deepEqual(calls, [['rhAiAppManifestBundle', listener]]);
});
