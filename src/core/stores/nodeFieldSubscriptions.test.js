import test from 'node:test';
import assert from 'node:assert/strict';

import { createNodeFieldSubscriptions } from './nodeFieldSubscriptions.js';

test('nodeFieldSubscriptions: emits initial values and updates only after flush', () => {
  const nodes = {
    a: { id: 'a', label: 'A' },
    b: { id: 'b', label: 'B' },
    c: { id: 'c' },
  };
  const subscriptions = createNodeFieldSubscriptions(() => nodes);
  const snapshots = [];
  const unsubscribe = subscriptions.subscribe('label', (labels) => snapshots.push(labels));

  assert.deepEqual(snapshots, [['A', 'B']]);
  nodes.a.label = 'Updated';
  subscriptions.touch('a');
  subscriptions.flush();
  assert.deepEqual(snapshots.at(-1), ['Updated', 'B']);
  subscriptions.flush();
  assert.equal(snapshots.length, 2);

  nodes.d = { id: 'd', label: 'D' };
  subscriptions.reload();
  subscriptions.flush();
  assert.deepEqual(snapshots.at(-1), ['Updated', 'B', 'D']);

  unsubscribe();
  nodes.a.label = 'Ignored';
  subscriptions.touch('a');
  subscriptions.flush();
  assert.equal(snapshots.length, 3);
});

test('nodeFieldSubscriptions: validates subscriptions and accepts fields absent from current nodes', () => {
  const subscriptions = createNodeFieldSubscriptions(() => [{ id: 'a', label: 'A' }]);
  assert.throws(() => subscriptions.subscribe('', () => {}), /Expected a node field and listener/);
  assert.throws(() => subscriptions.subscribe('label', null), /Expected a node field and listener/);

  const snapshots = [];
  const unsubscribe = subscriptions.subscribe('missing', (values) => snapshots.push(values));
  assert.deepEqual(snapshots, [[]]);
  unsubscribe();
});
