import test from 'node:test';
import assert from 'node:assert/strict';
import { canvasCommandRegistry, executeCanvasCommand } from './index.js';

function createMemoryStore() {
  const state = { nodes: {}, selectedNodeIds: [] };
  return {
    getStateRaw: () => state,
    getState: () => state,
    addNode: (node) => {
      state.nodes[node.id] = node;
    },
    setSelectedNodes: (ids) => {
      state.selectedNodeIds = [...ids];
    },
    updateNodeData: (id, patch) => {
      state.nodes[id] = { ...state.nodes[id], ...patch };
    },
    snapshot: () => state,
  };
}

function createContext({ createNodeAtCursor: cursorImpl } = {}) {
  const store = createMemoryStore();
  const calls = { cursor: [], commit: 0, updateNodeData: [] };
  const cursor =
    cursorImpl ||
    ((type, width, height, name, options) => {
      calls.cursor.push({ type, width, height, name, options });
      const node = { id: 'node-' + calls.cursor.length, type, width, height, name };
      store.addNode(node);
      store.setSelectedNodes([node.id]);
      return node;
    });
  const context = {
    store,
    graphStore: store,
    commit: () => {
      calls.commit += 1;
    },
    createNodeAtCursor: cursor,
  };
  return { context, store, calls };
}

test('node.create advertises the placement and sequence fields the capture bridge sends', () => {
  const command = canvasCommandRegistry.get('node.create');
  for (const field of ['placement', 'sequenceKey', 'x', 'y']) {
    assert.ok(command.argsSchema.properties[field], 'missing arg schema for ' + field);
  }
  assert.equal(command.argsSchema.defaults.placement, 'viewport-center-sequence');
  assert.deepEqual(command.returnSchema.aliasFields, ['nodeId', 'node']);
});

test('node.create reports NODE_CREATE_UNAVAILABLE when the context cannot create or build nodes', () => {
  const command = canvasCommandRegistry.get('node.create');
  const outcome = command.validate({ type: 'source-text' }, {});
  assert.equal(outcome.ok, false);
  assert.equal(outcome.errorCode, 'NODE_CREATE_UNAVAILABLE');
});

test('node.create accepts an explicit position even without a cursor creation flow', () => {
  const command = canvasCommandRegistry.get('node.create');
  const outcome = command.validate(
    { type: 'source-text', x: 0, y: 0 },
    { buildNodeData: () => ({ id: 'n1' }) },
  );
  assert.ok(outcome.args, 'expected validation to pass');
  assert.equal(outcome.args.type, 'source-text');
});

test('node.create still rejects unsupported node types', () => {
  const command = canvasCommandRegistry.get('node.create');
  const outcome = command.validate({ type: 'not-a-node' }, { createNodeAtCursor: () => ({}) });
  assert.equal(outcome.ok, false);
  assert.equal(outcome.errorCode, 'UNSUPPORTED_NODE_TYPE');
});

test('node.create forwards the capture placement and sequence key to the cursor flow', async () => {
  const { context, calls } = createContext();
  const outcome = await executeCanvasCommand(
    'node.create',
    {
      type: 'source-text',
      name: 'globally selected text',
      content: 'hello',
      placement: 'viewport-center-sequence',
      sequenceKey: 'global-capture',
    },
    context,
  );
  assert.equal(outcome.ok, true);
  assert.equal(calls.cursor.length, 1);
  assert.deepEqual(calls.cursor[0].options, {
    placement: 'viewport-center-sequence',
    sequenceKey: 'global-capture',
  });
  assert.equal(calls.cursor[0].name, 'globally selected text');
  assert.equal(outcome.result.nodeId, 'node-1');
  assert.equal(outcome.result.node.type, 'source-text');
});

test('node.create defaults placement to viewport-center-sequence when the caller omits it', async () => {
  const { context, calls } = createContext();
  const outcome = await executeCanvasCommand('node.create', { type: 'source-text' }, context);
  assert.equal(outcome.ok, true);
  assert.deepEqual(calls.cursor[0].options, { placement: 'viewport-center-sequence', sequenceKey: '' });
});

test('node.create falls back to the context sequence key when the caller omits one', async () => {
  const { context, calls } = createContext();
  context.createNodeSequenceKey = 'context-sequence';
  const outcome = await executeCanvasCommand('node.create', { type: 'source-text' }, context);
  assert.equal(outcome.ok, true);
  assert.equal(calls.cursor[0].options.sequenceKey, 'context-sequence');
});

test('node.create maps the captured text onto the field each capture action expects', async () => {
  const { context, store } = createContext();
  const textOutcome = await executeCanvasCommand(
    'node.create',
    { type: 'source-text', content: 'captured text' },
    context,
  );
  assert.equal(store.snapshot().nodes[textOutcome.result.nodeId].content, 'captured text');

  const promptOutcome = await executeCanvasCommand(
    'node.create',
    { type: 'ai-text', prompt: 'captured prompt' },
    context,
  );
  assert.equal(store.snapshot().nodes[promptOutcome.result.nodeId].prompt, 'captured prompt');
});

test('node.create builds an explicitly positioned node through the node factory', async () => {
  const { context, store, calls } = createContext();
  const requested = [];
  context.buildNodeData = (payload) => {
    requested.push(payload);
    const node = { ...payload, id: 'factory-1' };
    store.addNode(node);
    return node;
  };
  const outcome = await executeCanvasCommand(
    'node.create',
    { type: 'source-text', x: 120, y: 240, name: 'positioned' },
    context,
  );
  assert.equal(outcome.ok, true);
  assert.equal(calls.cursor.length, 0);
  assert.equal(requested.length, 1);
  assert.equal(requested[0].x, 120);
  assert.equal(requested[0].y, 240);
  assert.equal(requested[0].name, 'positioned');
  assert.equal(outcome.result.nodeId, 'factory-1');
  assert.equal(store.snapshot().nodes['factory-1'].id, 'factory-1');
  assert.equal(calls.commit, 1);
});

test('node.create surfaces NODE_CREATE_FAILED when the node factory returns a non-object', async () => {
  const { context } = createContext();
  context.buildNodeData = () => null;
  const outcome = await executeCanvasCommand('node.create', { type: 'source-text', x: 1, y: 2 }, context);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.errorCode, 'NODE_CREATE_FAILED');
});

test('node.create reuses an existing node when reuseNodeId matches the requested type', async () => {
  const { context, store, calls } = createContext();
  store.addNode({ id: 'existing-1', type: 'source-text', name: 'old', content: '' });
  const outcome = await executeCanvasCommand(
    'node.create',
    { type: 'source-text', name: 'new name', reuseNodeId: 'existing-1' },
    context,
  );
  assert.equal(outcome.ok, true);
  assert.equal(calls.cursor.length, 0);
  assert.equal(outcome.result.reused, true);
  assert.equal(outcome.result.nodeId, 'existing-1');
  assert.equal(store.snapshot().nodes['existing-1'].name, 'new name');
});

test('node.create restores the pre-reserved selection for agent reservations', async () => {
  const { context, store } = createContext();
  store.setSelectedNodes(['kept-1', 'kept-2']);
  const outcome = await executeCanvasCommand(
    'node.create',
    { type: 'source-text', agentReservation: true },
    context,
  );
  assert.equal(outcome.ok, true);
  assert.deepEqual(store.snapshot().selectedNodeIds, ['kept-1', 'kept-2']);
  assert.notEqual(outcome.result.nodeId, '');
});

test('generation.run resolves the node runtime and returns the run value', async () => {
  const { context, store } = createContext();
  store.addNode({ id: 'node-1', type: 'ai-text' });
  context.nodeRuntimeRegistry = {
    get: () => ({ runGeneration: async () => 'task-1' }),
  };
  const outcome = await executeCanvasCommand('generation.run', { nodeId: 'node-1' }, context);
  assert.equal(outcome.ok, true);
  assert.deepEqual(outcome.result, { nodeId: 'node-1', value: 'task-1' });
});

test('generation.run fails with GENERATION_NODE_NOT_MOUNTED when no runtime is registered', async () => {
  const { context, store } = createContext();
  store.addNode({ id: 'node-1', type: 'ai-text' });
  context.nodeRuntimeRegistry = { get: () => null };
  const outcome = await executeCanvasCommand('generation.run', { nodeId: 'node-1' }, context);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.errorCode, 'GENERATION_NODE_NOT_MOUNTED');
});
