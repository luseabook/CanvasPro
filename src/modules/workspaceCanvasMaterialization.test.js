import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceCanvasMaterializationAdapter } from './workspaceCanvasMaterialization.js';

const BINDING_POLICY = {
  getProjectId: (node) => node?.projectId,
  findProjectAnchor: ({ projectId }) => (projectId === 'p1' ? { x: 500, y: 600 } : null),
};

function createHarness({ canvas = {}, ...dependencyOverrides } = {}) {
  const calls = {
    addCanvas: 0,
    switchTo: [],
    renameCanvas: [],
    deleteCanvas: [],
    createNodeAtCursor: [],
    updateNodeData: [],
    moveNode: [],
    deleteNodes: [],
    connectNodes: [],
    groupNodes: [],
    focusNodes: [],
    commit: 0,
  };

  const graph = { nodes: {}, edges: [] };

  const canvasTabManager = {
    activeCanvasId: 'c1',
    canvases: [{ id: 'c1' }, { id: 'c2' }],
    addCanvas() {
      calls.addCanvas += 1;
      canvasTabManager.activeCanvasId = 'c-new';
    },
    getActiveCanvasId: () => canvasTabManager.activeCanvasId,
    switchTo(id) {
      calls.switchTo.push(id);
      canvasTabManager.activeCanvasId = id;
      return true;
    },
    renameCanvas(id, name) {
      calls.renameCanvas.push([id, name]);
    },
    deleteCanvas(id, options) {
      calls.deleteCanvas.push([id, options]);
      return true;
    },
    getMultiDataSnapshot: () => ({ canvases: canvasTabManager.canvases }),
    ...canvas,
  };

  let nodeSeq = 0;
  const dependencies = {
    canvasTabManager,
    createNodeAtCursor(type, width, height, name, options) {
      calls.createNodeAtCursor.push([type, width, height, name, options]);
      nodeSeq += 1;
      const node = { id: 'new-' + nodeSeq, type, x: 0, y: 0, width, height, name };
      graph.nodes[node.id] = node;
      return node;
    },
    getGraphState: () => graph,
    getNodeSize: () => ({ width: 240, height: 120 }),
    updateNodeData(id, patch) {
      calls.updateNodeData.push([id, patch]);
      graph.nodes[id] = { ...graph.nodes[id], ...patch };
    },
    moveNode(id, dx, dy) {
      calls.moveNode.push([id, dx, dy]);
      graph.nodes[id].x += dx;
      graph.nodes[id].y += dy;
    },
    deleteNodes(ids) {
      calls.deleteNodes.push(ids);
      for (const id of ids) delete graph.nodes[id];
    },
    connectNodes(edge) {
      calls.connectNodes.push(edge);
      graph.edges.push(edge);
      return true;
    },
    groupNodes(ids, parentId) {
      calls.groupNodes.push([ids, parentId]);
      return true;
    },
    focusNodes(...args) {
      calls.focusNodes.push(args);
      return true;
    },
    projectBindingPolicies: [BINDING_POLICY],
    commit() {
      calls.commit += 1;
    },
    getGraphSnapshot: () => ({ nodes: Object.keys(graph.nodes) }),
    restoreGraphSnapshot: (snapshot) => snapshot?.nodes?.length > 0,
    ...dependencyOverrides,
  };

  const put = (id, extra = {}) => {
    graph.nodes[id] = { id, type: 'ai-image', x: 0, y: 0, width: 240, height: 120, ...extra };
    return graph.nodes[id];
  };

  return {
    calls,
    graph,
    canvasTabManager,
    put,
    adapter: createWorkspaceCanvasMaterializationAdapter(dependencies),
  };
}

const REQUIRED_DEPS = () => ({
  canvasTabManager: { addCanvas() {}, getActiveCanvasId: () => 'c' },
  createNodeAtCursor: () => ({ id: 'n' }),
  getGraphState: () => ({ nodes: {} }),
  updateNodeData() {},
  moveNode() {},
  projectBindingPolicies: [BINDING_POLICY],
});

test('workspaceCanvasMaterialization: 画布管理器或图依赖不全时直接抛错', () => {
  assert.throws(() => createWorkspaceCanvasMaterializationAdapter(), /dependencies are incomplete/);
  assert.throws(
    () =>
      createWorkspaceCanvasMaterializationAdapter({
        canvasTabManager: { addCanvas() {}, getActiveCanvasId: () => 'c' },
        createNodeAtCursor: () => ({ id: 'n' }),
        getGraphState: () => ({ nodes: {} }),
        updateNodeData() {},
      }),
    /dependencies are incomplete/,
  );
  assert.throws(
    () => createWorkspaceCanvasMaterializationAdapter({ ...REQUIRED_DEPS(), createNodeAtCursor: 'nope' }),
    /dependencies are incomplete/,
  );
});

test('workspaceCanvasMaterialization: 项目绑定策略必须是非空且每个都带两个方法', () => {
  assert.throws(
    () => createWorkspaceCanvasMaterializationAdapter({ ...REQUIRED_DEPS(), projectBindingPolicies: [{ getProjectId: () => 'p1' }] }),
    /binding policies are incomplete/,
  );
  assert.throws(
    () => createWorkspaceCanvasMaterializationAdapter({ ...REQUIRED_DEPS(), projectBindingPolicies: [null] }),
    /binding policies are incomplete/,
  );
  assert.throws(
    () => createWorkspaceCanvasMaterializationAdapter({ ...REQUIRED_DEPS(), projectBindingPolicies: [] }),
    /binding policies are incomplete/,
    '空数组同样算不完整，策略列表是必填的',
  );

  const { projectBindingPolicies, ...withoutPolicies } = REQUIRED_DEPS();
  assert.throws(() => createWorkspaceCanvasMaterializationAdapter(withoutPolicies), /binding policies are incomplete/);
  assert.ok(createWorkspaceCanvasMaterializationAdapter(REQUIRED_DEPS()));
  assert.ok(createWorkspaceCanvasMaterializationAdapter({ ...REQUIRED_DEPS(), projectBindingPolicies: [BINDING_POLICY, BINDING_POLICY] }), '可以给多条策略');
});

test('workspaceCanvasMaterialization: 返回的适配器方法齐全', () => {
  const { adapter } = createHarness();
  const expected = [
    'canvasExists',
    'switchCanvas',
    'createCanvas',
    'renameCanvas',
    'nodeExists',
    'getNode',
    'createNode',
    'updateNode',
    'deleteNodes',
    'createMutationSnapshot',
    'restoreMutationSnapshot',
    'deleteCanvas',
    'setNodeParent',
    'connectNodes',
    'focusNodes',
    'commit',
  ];
  for (const name of expected) {
    assert.equal(typeof adapter[name], 'function', name + ' 应该是函数');
  }
});

test('workspaceCanvasMaterialization: 画布存在性优先查多画布快照，缺快照时退回当前画布', () => {
  const harness = createHarness();
  assert.equal(harness.adapter.canvasExists(''), false);
  assert.equal(harness.adapter.canvasExists('   '), false);
  assert.equal(harness.adapter.canvasExists('c1'), true);
  assert.equal(harness.adapter.canvasExists('c2'), true);
  assert.equal(harness.adapter.canvasExists('c9'), false);

  const fallback = createHarness({ canvas: { getMultiDataSnapshot: undefined } });
  assert.equal(fallback.adapter.canvasExists('c1'), true, '没有快照就用当前画布 id 比较');
  assert.equal(fallback.adapter.canvasExists('c2'), false);
});

test('workspaceCanvasMaterialization: 切换画布在已就位时零调用，切不动时返回 false', async () => {
  const harness = createHarness();
  assert.equal(await harness.adapter.switchCanvas(''), false);
  assert.equal(await harness.adapter.switchCanvas('c1'), true);
  assert.deepEqual(harness.calls.switchTo, [], '目标就是当前画布时不切');

  assert.equal(await harness.adapter.switchCanvas('c2'), true);
  assert.deepEqual(harness.calls.switchTo, ['c2']);

  const noSwitch = createHarness({ canvas: { switchTo: undefined } });
  assert.equal(await noSwitch.adapter.switchCanvas('c2'), false);

  const rejected = createHarness({ canvas: { switchTo: () => false } });
  assert.equal(await rejected.adapter.switchCanvas('c2'), false);
});

test('workspaceCanvasMaterialization: 新建画布会等到新的活动 id，并顺手改名', async () => {
  const harness = createHarness();
  const id = await harness.adapter.createCanvas('项目画布');
  assert.equal(id, 'c-new');
  assert.equal(harness.calls.addCanvas, 1);
  assert.deepEqual(harness.calls.renameCanvas, [['c-new', '项目画布']]);

  const stuck = createHarness({ canvas: { addCanvas() {}, getActiveCanvasId: () => '' } });
  await assert.rejects(() => stuck.adapter.createCanvas('x'), /未获得活动画布 ID/);
});

test('workspaceCanvasMaterialization: 改名直接透传给画布管理器', () => {
  const harness = createHarness();
  harness.adapter.renameCanvas('c1', '新名');
  assert.deepEqual(harness.calls.renameCanvas, [['c1', '新名']]);
});

test('workspaceCanvasMaterialization: 节点存在性与读取都落到当前图状态', () => {
  const harness = createHarness();
  const created = harness.put('n1');
  assert.equal(harness.adapter.nodeExists(' n1 '), true);
  assert.equal(harness.adapter.getNode('n1'), created);
  assert.equal(harness.adapter.nodeExists('missing'), false);
  assert.equal(harness.adapter.getNode('missing'), null);
  assert.equal(harness.adapter.getNode(''), null);
});

test('workspaceCanvasMaterialization: 新建节点会把非 type 字段写回，尺寸取自选项或 getNodeSize', async () => {
  const harness = createHarness();
  const result = await harness.adapter.createNode({ type: 'ai-image', name: '结果图', prompt: 'hello' });

  assert.equal(harness.calls.createNodeAtCursor.length, 1);
  const [type, width, height, name, options] = harness.calls.createNodeAtCursor[0];
  assert.deepEqual([type, width, height, name], ['ai-image', 240, 120, '结果图'], '没给尺寸就用 getNodeSize 的结果');
  assert.deepEqual(options, { placement: 'viewport-center-sequence', sequenceKey: undefined, skipCommit: true });

  assert.equal(harness.calls.updateNodeData.length, 1);
  const [updatedId, patch] = harness.calls.updateNodeData[0];
  assert.equal(updatedId, result.id);
  assert.equal(Object.hasOwn(patch, 'type'), false, 'type 不参与写回');
  assert.equal(patch.prompt, 'hello');
  assert.equal(harness.adapter.getNode(result.id), result);

  const sized = createHarness();
  await sized.adapter.createNode({ type: 'ai-image' }, { width: 300, height: 200, sequenceKey: 'seq' });
  const [, sizedWidth, sizedHeight, , sizedOptions] = sized.calls.createNodeAtCursor[0];
  assert.deepEqual([sizedWidth, sizedHeight], [300, 200], '选项里的尺寸优先');
  assert.equal(sizedOptions.sequenceKey, 'seq');
});

test('workspaceCanvasMaterialization: 抽不到新节点 id 时报错', async () => {
  const harness = createHarness({ createNodeAtCursor: () => ({}) });
  await assert.rejects(() => harness.adapter.createNode({ type: 'ai-image', name: '无名' }), /创建项目画布节点失败：无名/);
});

test('workspaceCanvasMaterialization: 有项目锚点时以锚点为基准摆位', async () => {
  const harness = createHarness();
  const result = await harness.adapter.createNode({ type: 'ai-image', projectId: 'p1' });

  assert.equal(harness.calls.moveNode.length, 1);
  const [movedId, dx, dy] = harness.calls.moveNode[0];
  assert.equal(movedId, result.id);
  assert.deepEqual([dx, dy], [500, 600], '锚点就是默认节点的落点');
  assert.deepEqual([harness.graph.nodes[result.id].x, harness.graph.nodes[result.id].y], [500, 600]);
});

test('workspaceCanvasMaterialization: 相对位移叠加在锚点上，且会避开已占位置', async () => {
  const offset = createHarness();
  await offset.adapter.createNode({ type: 'ai-image', projectId: 'p1' }, { position: { x: 30, y: -40 } });
  assert.deepEqual(offset.calls.moveNode[0].slice(1), [530, 560]);

  const occupied = createHarness();
  occupied.put('blocker', { x: 500, y: 600 });
  const placed = await occupied.adapter.createNode({ type: 'ai-image', projectId: 'p1' });
  assert.equal(occupied.graph.nodes[placed.id].x > 500, true, '会避开已占位置的节点');
});

test('workspaceCanvasMaterialization: 更新节点会补上宽高与相对位移，空 id 直接返回 null', async () => {
  const harness = createHarness();
  harness.put('n9', { x: 10, y: 10, width: 100, height: 50 });

  assert.equal(await harness.adapter.updateNode('', { prompt: 'x' }), null);
  assert.equal(harness.calls.updateNodeData.length, 0);

  const updated = await harness.adapter.updateNode(
    ' n9 ',
    { prompt: 'y', type: 'ai-image' },
    { width: 400, height: 300, position: { x: 5, y: 7 } },
  );
  assert.equal(updated.id, 'n9');
  const [id, patch] = harness.calls.updateNodeData[0];
  assert.equal(id, 'n9');
  assert.equal(Object.hasOwn(patch, 'type'), false);
  assert.equal(patch.width, 400);
  assert.equal(patch.height, 300);
  assert.deepEqual(harness.calls.moveNode[0], ['n9', 5, 7]);
});

test('workspaceCanvasMaterialization: 更新节点不给宽高和位置时就只写数据', async () => {
  const harness = createHarness();
  harness.put('n1');
  await harness.adapter.updateNode('n1', { prompt: 'z' }, { width: 0, height: -5 });
  const [, patch] = harness.calls.updateNodeData[0];
  assert.deepEqual(Object.keys(patch), ['prompt'], '非正数宽高不会被写进去');
  assert.deepEqual(harness.calls.moveNode, []);
});

test('workspaceCanvasMaterialization: 删除节点会过滤不存在的项并去重，缺依赖时返回 false', () => {
  const harness = createHarness();
  harness.put('a');
  harness.put('b');

  assert.equal(harness.adapter.deleteNodes([]), true);
  assert.equal(harness.adapter.deleteNodes(['a', ' a ', 'missing']), true);
  assert.deepEqual(harness.calls.deleteNodes, [['a']]);

  assert.equal(harness.adapter.deleteNodes(['b']), true);
  assert.deepEqual(harness.calls.deleteNodes[1], ['b']);
  assert.equal(harness.adapter.deleteNodes(), true, '缺参数就当空数组');

  const noDependency = createHarness({ deleteNodes: undefined });
  assert.equal(noDependency.adapter.deleteNodes(['x']), false);
});

test('workspaceCanvasMaterialization: 连线在边上已存在时短路，缺依赖时返回 false', () => {
  const harness = createHarness();
  harness.graph.edges.push({ sourceId: 'a', targetId: 'b' });

  assert.equal(harness.adapter.connectNodes(' a ', 'b'), true);
  assert.equal(harness.calls.connectNodes.length, 0, '已有边不重复创建');
  assert.equal(harness.adapter.connectNodes('', 'b'), false);
  assert.equal(harness.adapter.connectNodes('a', 'c', { preferredRefSlot: ' 1 ' }), true);
  assert.deepEqual(harness.calls.connectNodes[0], { sourceId: 'a', targetId: 'c', preferredRefSlot: '1' });

  const noDependency = createHarness({ connectNodes: undefined });
  assert.equal(noDependency.adapter.connectNodes('a', 'b'), false);
});

test('workspaceCanvasMaterialization: 设父级在已经是该父级时短路，缺依赖时返回 false', () => {
  const harness = createHarness();
  harness.put('child', { parentId: 'parent' });

  assert.equal(harness.adapter.setNodeParent('child', 'parent'), true);
  assert.equal(harness.calls.groupNodes.length, 0);
  assert.equal(harness.adapter.setNodeParent('', 'parent'), false);
  assert.equal(harness.adapter.setNodeParent('child', '   '), false);
  assert.equal(harness.adapter.setNodeParent('child', 'other'), true);
  assert.deepEqual(harness.calls.groupNodes[0], [['child'], 'other']);

  const noDependency = createHarness({ groupNodes: undefined });
  assert.equal(noDependency.adapter.setNodeParent('child', 'other'), false);
});

test('workspaceCanvasMaterialization: 快照与恢复按依赖可用性给出确定结果', () => {
  const harness = createHarness();
  harness.put('a');
  assert.deepEqual(harness.adapter.createMutationSnapshot(), { nodes: ['a'] });
  assert.equal(harness.adapter.restoreMutationSnapshot({ nodes: ['a'] }), true);
  assert.equal(harness.adapter.restoreMutationSnapshot(null), false);
  assert.equal(harness.adapter.restoreMutationSnapshot({ nodes: [] }), false);

  const noSnapshot = createHarness({ getGraphSnapshot: undefined, restoreGraphSnapshot: undefined });
  assert.equal(noSnapshot.adapter.createMutationSnapshot(), null);
  assert.equal(noSnapshot.adapter.restoreMutationSnapshot({ nodes: ['a'] }), false);
});

test('workspaceCanvasMaterialization: 删除画布带跳过脏确认，缺依赖时返回 false', async () => {
  const harness = createHarness();
  assert.equal(await harness.adapter.deleteCanvas(' c2 '), true);
  assert.deepEqual(harness.calls.deleteCanvas, [['c2', { skipDirtyConfirm: true }]]);
  assert.equal(await harness.adapter.deleteCanvas(''), false);

  const noDependency = createHarness({ canvas: { deleteCanvas: undefined } });
  assert.equal(await noDependency.adapter.deleteCanvas('c1'), false);

  const refused = createHarness({ canvas: { deleteCanvas: () => false } });
  assert.equal(await refused.adapter.deleteCanvas('c1'), false);
});

test('workspaceCanvasMaterialization: 聚焦节点会规整 id 并透传摆放参数', () => {
  const harness = createHarness();
  assert.equal(harness.adapter.focusNodes([], {}), false);
  assert.equal(harness.adapter.focusNodes([' a ', '', 'b'], { padding: 20, durationMs: 300 }), true);
  assert.deepEqual(harness.calls.focusNodes[0], [['a', 'b'], 20, 300, { padding: 20, durationMs: 300 }]);

  const noDependency = createHarness({ focusNodes: undefined });
  assert.equal(noDependency.adapter.focusNodes(['a'], {}), false);
});

test('workspaceCanvasMaterialization: commit 就是注入进来的那个回调，没注入时是空操作', () => {
  const harness = createHarness();
  harness.adapter.commit();
  assert.equal(harness.calls.commit, 1);

  const bare = createHarness({ commit: undefined });
  assert.equal(bare.adapter.commit(), undefined);
});
