import test from 'node:test';
import assert from 'node:assert/strict';

import { captureShortcutGraph, insertShortcutGraph, prepareShortcutGraph } from './shortcutGraph.js';
import { validateShortcutGraph } from './shortcutCatalog.js';

function node(id, extra = {}) {
  return { id, type: 'ai-image', x: 0, y: 0, width: 100, height: 60, parentId: null, ...extra };
}

function createStore(nodes, edges = [], selected = []) {
  const state = { selectedNodeIds: selected, nodes: Object.fromEntries(nodes.map((n) => [n.id, n])), edges: Object.fromEntries(edges.map((e) => [e.id, e])) };
  const calls = { added: [], removed: [], selected: [], commit: 0 };
  return {
    state,
    calls,
    getState: () => ({ selectedNodeIds: state.selectedNodeIds }),
    serialize: () => ({ nodes: Object.values(state.nodes), edges: Object.values(state.edges) }),
    batch: (fn) => fn(),
    addNode: (n) => {
      calls.added.push(n.id);
      state.nodes[n.id] = n;
    },
    addEdge: (e) => {
      state.edges[e.id] = e;
    },
    removeEdge: (id) => {
      calls.removed.push(id);
      delete state.edges[id];
    },
    deleteNodes: (ids) => {
      for (const id of ids) delete state.nodes[id];
    },
    setSelectedNodes: (ids) => {
      calls.selected.push([...ids]);
      state.selectedNodeIds = [...ids];
    },
  };
}

const NESTED = [
  node('a'),
  node('b', { parentId: 'a' }),
  node('c', { parentId: 'b' }),
  node('d'),
];

test('shortcutGraph: 没有选中时抛出明确错误', () => {
  const store = createStore(NESTED, [], []);
  assert.throws(() => captureShortcutGraph(store), { message: '请先在画布中选中需要保存的节点' });
});

test('shortcutGraph: 捕获会带出子节点，并把脱离选择树的父指针清空', () => {
  const edges = [
    { id: 'e1', sourceId: 'a', targetId: 'b' },
    { id: 'e2', sourceId: 'a', targetId: 'd' },
    { id: 'e3', sourceId: 'c', targetId: 'd' },
  ];
  const store = createStore(NESTED, edges, ['a']);
  const graph = captureShortcutGraph(store);

  assert.deepEqual(graph.nodes.map((n) => n.id).sort(), ['a', 'b', 'c'], 'a 的整棵子树都进来');
  assert.equal(graph.nodes.find((n) => n.id === 'b').parentId, 'a');
  for (const n of graph.nodes) assert.equal(n.parentId === 'd', false, 'd 不在选择树里');
  assert.deepEqual(graph.edges.map((e) => e.id).sort(), ['e1'], '两端都在选择里的边才保留');
  assert.equal(typeof graph.schemaVersion, 'number');
});

test('shortcutGraph: 显式传入 id 集合时以传入为准', () => {
  const store = createStore(NESTED, [], ['d']);
  const graph = captureShortcutGraph(store, ['d']);
  assert.deepEqual(graph.nodes.map((n) => n.id), ['d']);
});

test('shortcutGraph: prepare 以中心点为锚重新摆放并重映射 id', () => {
  const graph = validateShortcutGraph({ nodes: [node('a', { x: 100, y: 200 })], edges: [] });
  const paste = prepareShortcutGraph(graph, { x: 1000, y: 1000 });
  const pasted = paste.nodes[0];
  assert.equal(pasted.x, 950, '中心对齐：x − 宽/2');
  assert.equal(pasted.y, 970);
  assert.notEqual(pasted.id, 'a', '粘贴副本换新 id');
  assert.equal(paste.idMap.a, pasted.id, 'idMap 记录新旧映射');
  assert.deepEqual(paste.newIds, [pasted.id]);
});

test('shortcutGraph: insert 逐项落库、选中新节点并提交，返回新 id', () => {
  const graph = validateShortcutGraph({
    nodes: [node('a'), node('b')],
    edges: [{ id: 'e1', sourceId: 'a', targetId: 'b' }],
  });
  const store = createStore(NESTED, [], ['d']);
  const commits = [];
  const newIds = insertShortcutGraph({ store, graph, center: { x: 0, y: 0 }, commit: () => commits.push(1) });

  assert.equal(newIds.length, 2);
  assert.ok(newIds.every((id) => id !== 'a' && id !== 'b'), '插入的是重映射后的新 id');
  assert.deepEqual(store.calls.selected, [[...newIds]]);
  assert.equal(commits.length, 1);
});

test('shortcutGraph: 插入中途抛错会回滚新节点并恢复原选择', () => {
  const graph = validateShortcutGraph({ nodes: [node('a'), node('b')], edges: [] });
  const store = createStore(NESTED, [], ['d']);
  const before = Object.keys(store.state.nodes).length;
  const boom = new Error('写入失败');
  store.updateNodeData = () => {
    throw boom;
  };
  store.updateNodeData.exists = true;
  // insertShortcutGraph 本身不调 updateNodeData；这里用 batch 抛错模拟中途失败
  store.batch = (fn) => {
    throw boom;
  };
  assert.throws(() => insertShortcutGraph({ store, graph, center: { x: 0, y: 0 }, commit: () => {} }), boom);
  assert.equal(Object.keys(store.state.nodes).length, before, '没有留下半截节点');
  assert.deepEqual(store.state.selectedNodeIds, ['d']);
});
