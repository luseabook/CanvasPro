import test from 'node:test';
import assert from 'node:assert/strict';
import { registerEditingCommands } from './editingCommands.js';

function makeNode(id, type, over = {}) {
  return {
    id,
    type,
    x: 0,
    y: 0,
    width: 120,
    height: 80,
    imageUrl: `data/uploads/${id}.png`,
    ...over,
  };
}

function fixture() {
  const nodes = {
    a: makeNode('a', 'source-image'),
    b: makeNode('b', 'source-image', { x: 200 }),
    group: makeNode('group', 'group'),
    child: makeNode('child', 'source-image', { parentId: 'group' }),
  };
  const calls = {
    added: [],
    grouped: [],
    selected: [],
    deleted: [],
    updated: [],
    cleared: 0,
    batches: 0,
    commits: 0,
    clipboard: [],
    focus: [],
    toast: [],
  };
  const store = {
    getStateRaw: () => ({ nodes, edges: {}, selectedNodeIds: ['a', 'b'] }),
    addNode(node) {
      calls.added.push(node);
      nodes[node.id] = node;
    },
    groupNodes(ids, groupId) {
      calls.grouped.push([ids, groupId]);
    },
    setSelectedNodes(ids) {
      calls.selected.push(ids);
    },
    deleteNodes(ids) {
      calls.deleted.push(ids);
    },
    updateNodeData(id, patch) {
      calls.updated.push([id, patch]);
    },
    clearSelection() {
      calls.cleared += 1;
    },
    batch(fn) {
      calls.batches += 1;
      return fn();
    },
  };
  let clipboard = [];
  let clipboardGraph = null;
  const host = {
    store,
    graphStore: store,
    clipboard: {
      getClipboard: () => clipboard,
      getClipboardGraph: () => clipboardGraph,
      setClipboard(nodesValue, { edges } = {}) {
        clipboard = nodesValue;
        clipboardGraph = { schemaVersion: 1, nodes: nodesValue, edges: edges || [] };
        calls.clipboard.push({ nodes: nodesValue, edges: edges || [] });
      },
    },
    translate(_key, fallback) {
      return fallback;
    },
    commit() {
      calls.commits += 1;
    },
    focusNodes(ids) {
      calls.focus.push(ids);
    },
    showToast(...args) {
      calls.toast.push(args);
    },
  };
  const registry = {
    commands: new Map(),
    register(command) {
      this.commands.set(command.id, command);
      return this;
    },
  };
  registerEditingCommands(registry);
  return { calls, command: (id) => registry.commands.get(id), host, nodes, registry };
}

test('editingCommands: registers the five editing commands with their risk levels', () => {
  const { registry } = fixture();
  assert.deepEqual(
    [...registry.commands.values()].map(({ id, riskLevel }) => [id, riskLevel]),
    [
      ['node.group', 'safe'],
      ['node.ungroup', 'safe'],
      ['clipboard.copy', 'safe'],
      ['clipboard.paste', 'confirm'],
      ['collage.createFromSelection', 'safe'],
    ],
  );
  assert.deepEqual(registry.commands.get('node.group').returnSchema.aliasFields, [
    'groupId',
    'nodeId',
    'ids',
  ]);
});

test('editingCommands: group validates node ids and wraps them in one batch', () => {
  const { calls, command, host } = fixture();
  const cmd = command('node.group');
  assert.deepEqual(cmd.validate({ ids: ['a', 'missing', 'a', 'b'] }, host).args.ids, ['a', 'b']);
  assert.equal(cmd.validate({}, host).ok, undefined);
  const invalid = cmd.validate({ ids: [] }, { ...host, store: { getStateRaw: () => ({ nodes: {} }) } });
  assert.deepEqual(
    { ok: invalid.ok, errorCode: invalid.errorCode },
    { ok: false, errorCode: 'MISSING_NODE_ID' },
  );
  const result = cmd.execute({ ids: ['a', 'b'], name: '  ' }, host);
  assert.equal(result.node.type, 'group');
  assert.equal(result.node.name, 'New group');
  assert.deepEqual(calls.grouped, [[['a', 'b'], result.groupId]]);
  assert.deepEqual(calls.selected, [[result.groupId]]);
  assert.equal(calls.batches, 1);
  assert.equal(calls.commits, 1);
});

test('editingCommands: ungroup keeps only group ids and clears selection', () => {
  const { calls, command, host } = fixture();
  const cmd = command('node.ungroup');
  assert.deepEqual(cmd.validate({ ids: ['a', 'group'] }, host).args.ids, ['group']);
  const result = cmd.execute({ ids: ['group'] }, host);
  assert.deepEqual(result, { groupIds: ['group'], childIds: ['child'] });
  assert.deepEqual(calls.grouped, [[['child'], null]]);
  assert.deepEqual(calls.deleted, [['group']]);
  assert.equal(calls.cleared, 1);
});

test('editingCommands: clipboard copy snapshots selected nodes and paste rehomes them', () => {
  const { calls, command, host } = fixture();
  const copy = command('clipboard.copy');
  const copied = copy.execute({ ids: ['a', 'b'] }, host);
  assert.deepEqual(copied, { ids: ['a', 'b'], nodeCount: 2, edgeCount: 0 });
  assert.equal(calls.clipboard.length, 1);
  const paste = command('clipboard.paste');
  const pasted = paste.execute({ x: 500, y: 600 }, host);
  assert.equal(pasted.ids.length, 2);
  assert.equal(pasted.nodeIds.length, 2);
  assert.deepEqual(pasted.edgeIds, []);
  assert.equal(calls.added.length, 2);
  assert.deepEqual(calls.selected.at(-1), pasted.ids);
  assert.equal(calls.commits, 1);
});

test('editingCommands: paste with an empty clipboard is a no-op', () => {
  const { calls, command, host } = fixture();
  assert.deepEqual(command('clipboard.paste').execute({ x: 1, y: 2 }, host), {
    ids: [],
    nodeIds: [],
    edgeIds: [],
    idMap: {},
  });
  assert.equal(calls.added.length, 0);
  assert.equal(calls.commits, 0);
});

test('editingCommands: collage filters non-images and creates a focused collage node', () => {
  const { calls, command, host } = fixture();
  const cmd = command('collage.createFromSelection');
  const validated = cmd.validate({ ids: ['a', 'group', 'b'] }, host).args;
  assert.deepEqual(validated.imageNodeIds, ['a', 'b']);
  const result = cmd.execute(validated, host);
  assert.equal(result.node.type, 'collage');
  assert.deepEqual(result.sourceNodeIds, ['a', 'b']);
  assert.deepEqual(calls.selected, [[result.nodeId]]);
  assert.deepEqual(calls.focus, [['a', 'b', result.nodeId]]);
  assert.deepEqual(calls.toast, [['Collage created.', 'success']]);
});
