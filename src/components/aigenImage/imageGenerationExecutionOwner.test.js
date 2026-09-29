import test from 'node:test';
import assert from 'node:assert/strict';

import { createImageGenerationExecutionOwner } from './imageGenerationExecutionOwner.js';

function createStore(nodeId) {
  const state = {
    nodes: {
      [nodeId]: {
        id: nodeId,
        type: 'ai-image',
        model: 'test-image-model',
      },
    },
    edges: {},
  };
  return {
    state,
    getStateRaw() {
      return state;
    },
    getState() {
      return state;
    },
    getIncomingEdges() {
      return [];
    },
    updateNodeData(id, patch) {
      state.nodes[id] = { ...state.nodes[id], ...patch };
    },
    subscribeRaw() {
      return () => {};
    },
  };
}

test('imageGenerationExecutionOwner: validates required dependencies', () => {
  assert.throws(() => createImageGenerationExecutionOwner({}), /Store/);
  assert.throws(() => createImageGenerationExecutionOwner({ store: createStore('node-1') }), /canvas scope/);
});

test('imageGenerationExecutionOwner: cancels work after the scope changes', async () => {
  const nodeId = 'node-scope-bound-image';
  const scope = { value: 'canvas-a' };
  const owner = createImageGenerationExecutionOwner({
    store: createStore(nodeId),
    getScopeId: () => scope.value,
  });
  const runtime = owner.resolve(nodeId);

  assert.ok(runtime);
  assert.equal(runtime.isReusable(), true);
  assert.equal(runtime.isPending(), false);

  scope.value = 'canvas-b';
  assert.equal(runtime.buildPayload({}), null);
  assert.deepEqual(await runtime.runGeneration({}), {
    ok: false,
    status: 'cancelled',
    reason: 'target-changed',
    targetNodeId: nodeId,
  });

  runtime.reconcile();
  assert.equal(runtime.isReusable(), false);
  assert.notEqual(owner.resolve(nodeId), runtime);
});

test('imageGenerationExecutionOwner: attaches presentation state and disposes cleanly', () => {
  const nodeId = 'node-presentation-image';
  const owner = createImageGenerationExecutionOwner({
    store: createStore(nodeId),
    getScopeId: () => 'canvas-presentation',
  });
  const runtime = owner.resolve(nodeId);
  const states = [];
  let flushes = 0;

  const detach = runtime.attachPresentation({
    flushPrompt() {
      flushes += 1;
    },
    onStateChange(state) {
      states.push(state);
    },
  });

  assert.equal(states.length, 1);
  assert.equal(states[0].nodeId, nodeId);
  detach();
  runtime.dispose();

  assert.equal(runtime.isReusable(), false);
  const replacement = owner.resolve(nodeId);
  assert.notEqual(replacement, runtime);
  assert.equal(replacement.isReusable(), true);
  owner.dispose();
  assert.equal(owner.resolve(nodeId), null);
  assert.equal(flushes, 0);
});

test('imageGenerationExecutionOwner: ignores non-image nodes and disposed resolvers', () => {
  const store = createStore('node-image');
  store.state.nodes['node-text'] = { id: 'node-text', type: 'ai-text' };
  const owner = createImageGenerationExecutionOwner({
    store,
    getScopeId: () => 'canvas-image',
  });

  assert.equal(owner.resolve('node-text'), null);
  assert.ok(owner.resolve('node-image'));

  owner.dispose();
  assert.equal(owner.resolve('node-image'), null);
});
