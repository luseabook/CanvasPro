import test from 'node:test';
import assert from 'node:assert/strict';

import { withGraphMutationBoundary } from './graphMutationBoundary.js';

function createStore() {
  const calls = [];
  return {
    calls,
    getStateRaw: () => ({
      nodes: { a: { id: 'a' }, b: { id: 'b' } },
      edges: {},
      _parentToChildren: {},
    }),
    updateNodePosition(...args) {
      calls.push(['updateNodePosition', ...args]);
      return 'moved';
    },
    loadState(...args) {
      calls.push(['loadState', ...args]);
      return 'loaded';
    },
  };
}

test('graphMutationBoundary wraps mutations and replacements with policy hooks', () => {
  const store = createStore();
  const boundary = withGraphMutationBoundary(store);
  const before = [];
  const after = [];
  const beforeReplace = [];
  boundary.setGraphMutationPolicy({
    before: (mutation) => {
      before.push(mutation);
    },
    after: (mutation) => {
      after.push(mutation);
    },
    beforeReplace: (name, args) => {
      beforeReplace.push([name, args]);
    },
  });

  assert.equal(boundary.updateNodePosition('a', 3, 4), 'moved');
  assert.equal(before[0].name, 'updateNodePosition');
  assert.deepEqual(before[0].nodeIds, ['a']);
  assert.deepEqual(after, before);

  assert.equal(boundary.loadState({ nodes: {} }), 'loaded');
  assert.equal(beforeReplace[0][0], 'loadState');
});

test('graphMutationBoundary supports policy veto and bypass', () => {
  const store = createStore();
  const boundary = withGraphMutationBoundary(store);
  let beforeCalls = 0;
  boundary.setGraphMutationPolicy({
    before: () => {
      beforeCalls += 1;
      return false;
    },
    beforeReplace: () => false,
  });

  assert.throws(() => boundary.updateNodePosition('a', 1, 1), /不可编辑/u);
  assert.throws(() => boundary.loadState({ nodes: {} }), /协作/u);
  assert.equal(
    boundary.withGraphMutationBypass(() => boundary.updateNodePosition('a', 2, 2)),
    'moved',
  );
  assert.equal(beforeCalls, 1);
  assert.deepEqual(boundary.getGraphMutationPolicy().before !== undefined, true);
});

test('graphMutationBoundary rejects conflicting policies and can uninstall', () => {
  const boundary = withGraphMutationBoundary(createStore());
  const first = {};
  const second = {};
  const uninstall = boundary.setGraphMutationPolicy(first);
  assert.throws(() => boundary.setGraphMutationPolicy(second), /already installed/u);
  uninstall();
  assert.equal(boundary.getGraphMutationPolicy(), null);
  assert.doesNotThrow(() => boundary.setGraphMutationPolicy(second));
});
