import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureBackgroundTaskCanvas } from './backgroundTaskCanvasSnapshot.js';

function stateOf(over = {}) {
  return {
    id: over.id ?? 'state',
    _persistRev: over.persistRev ?? 5,
    _contentPersistRev: over.contentRev ?? 6,
    _nodeMembershipRev: over.membershipRev ?? 7,
    _edgesRev: over.edgesRev ?? 8,
  };
}

function storeOf({ state, serializeNode } = {}) {
  const store = {
    state,
    serializeCalls: 0,
    nodeCalls: [],
    getStateRaw() {
      return this.state;
    },
    serialize() {
      this.serializeCalls += 1;
      return { kind: 'full', id: this.state.id, revision: this.state._persistRev };
    },
  };
  if (serializeNode) {
    store.serializeNode = (nodeId) => {
      store.nodeCalls.push(nodeId);
      return serializeNode(nodeId);
    };
  }
  return store;
}

function canvasOf(id, nodes) {
  return { id, nodes, edges: [], viewport: { x: id } };
}

function advancedState(id) {
  return stateOf({ id, persistRev: 6, contentRev: 7, membershipRev: 7, edgesRev: 8 });
}

test('returns the stored snapshot plus the remember hook', () => {
  const store = storeOf({ state: stateOf() });
  const capture = captureBackgroundTaskCanvas(store, canvasOf('a', []), null);
  assert.deepEqual(Object.keys(capture).sort(), ['remember', 'snapshot']);
  assert.equal(typeof capture.remember, 'function');
});

test('falls back to a full serialize before any mirror exists', () => {
  const store = storeOf({ state: stateOf({ id: 'fresh' }) });
  const capture = captureBackgroundTaskCanvas(store, canvasOf('a', []), 'node-1');
  assert.deepEqual(capture.snapshot, { kind: 'full', id: 'fresh', revision: 5 });
  assert.equal(store.serializeCalls, 1);
  assert.deepEqual(store.nodeCalls, []);
});

test('reuses the mirrored canvas with a freshly serialized node', () => {
  const store = storeOf({
    state: stateOf({ persistRev: 5, contentRev: 6, membershipRev: 7, edgesRev: 8 }),
    serializeNode: (nodeId) => ({ id: nodeId, fresh: true }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1', stale: true }, { id: 'node-2' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 6, contentRev: 7, membershipRev: 7, edgesRev: 8 });
  const capture = captureBackgroundTaskCanvas(store, canvas, 'node-2');
  assert.deepEqual(store.nodeCalls, ['node-2']);
  assert.deepEqual(capture.snapshot.nodes, [
    { id: 'node-1', stale: true },
    { id: 'node-2', fresh: true },
  ]);
  assert.equal(store.serializeCalls, 1);
});

test('keeps the rest of the mirrored canvas and copies the node array', () => {
  const store = storeOf({
    state: stateOf(),
    serializeNode: () => ({ id: 'node-1', fresh: true }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1', stale: true }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = advancedState('a');
  const capture = captureBackgroundTaskCanvas(store, canvas, 'node-1');
  assert.equal(capture.snapshot.id, 'a');
  assert.deepEqual(capture.snapshot.viewport, { x: 'a' });
  assert.notEqual(capture.snapshot.nodes, canvas.nodes);
  assert.notEqual(capture.snapshot, canvas);
});

test('falls back to a full serialize when the persisted revision did not advance', () => {
  const store = storeOf({
    state: stateOf({ persistRev: 5 }),
    serializeNode: (nodeId) => ({ id: nodeId, fresh: true }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 5 });
  assert.deepEqual(captureBackgroundTaskCanvas(store, canvas, 'node-1').snapshot.kind, 'full');
  assert.deepEqual(store.nodeCalls, []);
});

test('falls back to a full serialize when the content revision did not advance', () => {
  const store = storeOf({
    state: stateOf(),
    serializeNode: (nodeId) => ({ id: nodeId }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 6, contentRev: 9 });
  assert.equal(captureBackgroundTaskCanvas(store, canvas, 'node-1').snapshot.kind, 'full');
});

test('falls back to a full serialize when the membership revision changed', () => {
  const store = storeOf({
    state: stateOf(),
    serializeNode: (nodeId) => ({ id: nodeId }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 6, contentRev: 7, membershipRev: 99 });
  assert.equal(captureBackgroundTaskCanvas(store, canvas, 'node-1').snapshot.kind, 'full');
});

test('falls back to a full serialize when the edge revision changed', () => {
  const store = storeOf({
    state: stateOf(),
    serializeNode: (nodeId) => ({ id: nodeId }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 6, contentRev: 7, edgesRev: 99 });
  assert.equal(captureBackgroundTaskCanvas(store, canvas, 'node-1').snapshot.kind, 'full');
});

test('falls back to a full serialize for an unknown node id', () => {
  const store = storeOf({
    state: stateOf(),
    serializeNode: (nodeId) => ({ id: nodeId }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 6 });
  assert.equal(captureBackgroundTaskCanvas(store, canvas, 'missing').snapshot.kind, 'full');
  assert.deepEqual(store.nodeCalls, []);
});

test('falls back to a full serialize for a missing node id', () => {
  const store = storeOf({
    state: stateOf(),
    serializeNode: (nodeId) => ({ id: nodeId }),
  });
  const canvas = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 6 });
  assert.equal(captureBackgroundTaskCanvas(store, canvas, null).snapshot.kind, 'full');
});

test('falls back to a full serialize when the mirrored canvas is a different one', () => {
  const store = storeOf({
    state: stateOf(),
    serializeNode: (nodeId) => ({ id: nodeId }),
  });
  const mirrored = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, mirrored, 'node-1').remember(mirrored);
  store.state = stateOf({ persistRev: 6 });
  const other = canvasOf('b', [{ id: 'node-1' }]);
  assert.equal(captureBackgroundTaskCanvas(store, other, 'node-1').snapshot.kind, 'full');
});

test('falls back to a full serialize when the store cannot serialize a single node', () => {
  const store = storeOf({ state: stateOf() });
  const canvas = canvasOf('a', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(store, canvas, 'node-1').remember(canvas);
  store.state = stateOf({ persistRev: 6 });
  assert.equal(captureBackgroundTaskCanvas(store, canvas, 'node-1').snapshot.kind, 'full');
});

test('keeps a separate mirror per store', () => {
  const first = storeOf({
    state: stateOf({ id: 'first' }),
    serializeNode: (nodeId) => ({ id: nodeId, from: 'first' }),
  });
  const second = storeOf({
    state: stateOf({ id: 'second' }),
    serializeNode: (nodeId) => ({ id: nodeId, from: 'second' }),
  });
  const firstCanvas = canvasOf('a', [{ id: 'node-1' }]);
  const secondCanvas = canvasOf('b', [{ id: 'node-1' }]);
  captureBackgroundTaskCanvas(first, firstCanvas, 'node-1').remember(firstCanvas);
  captureBackgroundTaskCanvas(second, secondCanvas, 'node-1').remember(secondCanvas);
  first.state = advancedState('first');
  second.state = advancedState('second');
  assert.deepEqual(captureBackgroundTaskCanvas(first, firstCanvas, 'node-1').snapshot.nodes, [
    { id: 'node-1', from: 'first' },
  ]);
  assert.deepEqual(captureBackgroundTaskCanvas(second, secondCanvas, 'node-1').snapshot.nodes, [
    { id: 'node-1', from: 'second' },
  ]);
});
