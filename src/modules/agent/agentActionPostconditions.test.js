import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAgentActionPostconditionPolicy,
  verifyAgentActionPostcondition,
  createAgentActionPostconditionHandler,
  AGENT_AUTO_REPAIRABLE_COMMANDS,
} from './agentActionPostconditions.js';

const state = (over = {}) => ({
  nodes: over.nodes || {},
  edges: over.edges || {},
  selectedNodeIds: over.selectedNodeIds || [],
});

const ctx = (over = {}) => ({ store: { getStateRaw: () => state(over) } });

const verify = (commandId, result, contextOver = {}, argsOver = {}) =>
  verifyAgentActionPostcondition({
    commandId,
    args: argsOver,
    response: { ok: true, result },
    commandContext: ctx(contextOver),
  });

test('策略表：store 41 项、result 5 项，其余一律 unclassified', () => {
  assert.equal(getAgentActionPostconditionPolicy('node.create'), 'store');
  assert.equal(getAgentActionPostconditionPolicy('clipboard.copy'), 'result');
  assert.equal(getAgentActionPostconditionPolicy('viewport.fitAll'), 'result');
  assert.equal(getAgentActionPostconditionPolicy('task.focusResult'), 'result');
  assert.equal(getAgentActionPostconditionPolicy('node.exportSelected'), 'result');
  assert.equal(getAgentActionPostconditionPolicy('viewport.focusNodes'), 'result');
  assert.equal(getAgentActionPostconditionPolicy('node.whatever'), 'unclassified');
  // 只做 trim，不做小写归一：大写形式视为未分类
  assert.equal(getAgentActionPostconditionPolicy(' NODE.Create '), 'unclassified');
  assert.equal(getAgentActionPostconditionPolicy(' graph.connect '), 'store');
  assert.equal(getAgentActionPostconditionPolicy(''), 'unclassified');
  assert.equal(getAgentActionPostconditionPolicy(), 'unclassified');
  assert.equal(getAgentActionPostconditionPolicy(null), 'unclassified');
});

test('可自动修复命令表：冻结的 16 项且全部属于 store 策略', () => {
  assert.ok(Array.isArray(AGENT_AUTO_REPAIRABLE_COMMANDS));
  assert.ok(Object.isFrozen(AGENT_AUTO_REPAIRABLE_COMMANDS));
  assert.equal(AGENT_AUTO_REPAIRABLE_COMMANDS.length, 16);
  assert.deepEqual(AGENT_AUTO_REPAIRABLE_COMMANDS, [...AGENT_AUTO_REPAIRABLE_COMMANDS].sort());
  for (const id of AGENT_AUTO_REPAIRABLE_COMMANDS)
    assert.equal(getAgentActionPostconditionPolicy(id), 'store', id);
});

test('response.ok 非严格 true 时状态视为 not_run 且仍然 ok', () => {
  for (const response of [{}, { ok: false }, { ok: undefined }, { ok: 'true' }]) {
    assert.deepEqual(
      verifyAgentActionPostcondition({
        commandId: 'node.create',
        args: {},
        response,
        commandContext: {},
      }),
      { ok: true, commandId: 'node.create', status: 'not_run' },
    );
  }
});

test('commandId 缺失时回落 response.commandId，只 trim 不改大小写', () => {
  assert.deepEqual(verifyAgentActionPostcondition({ response: { ok: false, commandId: ' node.delete ' } }), {
    ok: true,
    commandId: 'node.delete',
    status: 'not_run',
  });
  assert.deepEqual(verifyAgentActionPostcondition({ response: { ok: false } }), {
    ok: true,
    commandId: '',
    status: 'not_run',
  });
});

test('result 策略：视口类要求 focused 为真且 ids 非空', () => {
  assert.deepEqual(verify('viewport.focusNodes', { focused: true, ids: ['a', 'a', ''] }), {
    ok: true,
    nodeIds: ['a'],
    commandId: 'viewport.focusNodes',
    status: 'verified',
  });
  assert.deepEqual(verify('viewport.fitAll', { focused: true, nodeIds: ['b'] }).nodeIds, ['b']);
  assert.deepEqual(verify('task.focusResult', { focused: false, ids: ['a'] }), {
    ok: false,
    commandId: 'task.focusResult',
    reason: 'viewport_effect_not_acknowledged',
    details: { ids: ['a'] },
    status: 'failed',
  });
  // focused 为真但 ids 为空同样失败
  assert.equal(
    verify('viewport.fitAll', { focused: true, ids: [] }).reason,
    'viewport_effect_not_acknowledged',
  );
});

test('result 策略：clipboard.copy 要求 nodeCount 与去重后 ids 严格相等', () => {
  assert.deepEqual(verify('clipboard.copy', { ids: ['a', 'b'], nodeCount: 2 }).nodeIds, ['a', 'b']);
  const mismatch = verify('clipboard.copy', { ids: ['a', 'b', 'b'], nodeCount: 3 });
  assert.deepEqual(mismatch, {
    ok: false,
    commandId: 'clipboard.copy',
    reason: 'clipboard_result_mismatch',
    details: { ids: ['a', 'b'], nodeCount: 3 },
    status: 'failed',
  });
  // nodeCount 走 Math.trunc(Number(x) || 0)，非数字塌缩为 0
  assert.deepEqual(
    verify('clipboard.copy', { ids: [], nodeCount: 'abc' }).reason,
    'clipboard_result_mismatch',
  );
  // nodeCount 先 Math.trunc 再比较，1.9 与 1 等价
  assert.equal(verify('clipboard.copy', { ids: ['a'], nodeCount: 1.9 }).status, 'verified');
});

test('result 策略：node.exportSelected 需 success + exportedCount>0 + 路径', () => {
  assert.deepEqual(verify('node.exportSelected', { success: true, exportedCount: 2, path: ' /tmp/a ' }), {
    ok: true,
    path: '/tmp/a',
    exportedCount: 2,
    commandId: 'node.exportSelected',
    status: 'verified',
  });
  assert.deepEqual(
    verify('node.exportSelected', { success: true, exportedCount: 1, outputPath: 'b.png' }).path,
    'b.png',
  );
  const noPath = verify('node.exportSelected', { success: true, exportedCount: 1 });
  assert.deepEqual(noPath, {
    ok: false,
    commandId: 'node.exportSelected',
    reason: 'export_result_unverified',
    details: { exportedCount: 1, hasPath: false },
    status: 'failed',
  });
  assert.equal(
    verify('node.exportSelected', { success: true, exportedCount: 'x', path: 'p' }).details.exportedCount,
    0,
  );
});

test('store 策略没有画布状态时失败为 state_unavailable；未分类则 not_applicable', () => {
  assert.deepEqual(verifyAgentActionPostcondition({ commandId: 'node.select', response: { ok: true } }), {
    ok: false,
    commandId: 'node.select',
    reason: 'state_unavailable',
    details: {},
    status: 'failed',
  });
  assert.deepEqual(
    verifyAgentActionPostcondition({
      commandId: 'node.create',
      response: { ok: true },
      commandContext: { store: { getState: () => null } },
    }),
    { ok: false, commandId: 'node.create', reason: 'state_unavailable', details: {}, status: 'failed' },
  );
  // graphStore 是 store 的别名；getStateRaw 优先于 getState
  const raw = verifyAgentActionPostcondition({
    commandId: 'node.create',
    response: { ok: true, result: { nodeIds: ['a'] } },
    commandContext: {
      graphStore: { getStateRaw: () => state({ nodes: {} }), getState: () => state({ nodes: { a: {} } }) },
    },
  });
  assert.equal(raw.reason, 'nodes_not_committed');
  assert.deepEqual(verifyAgentActionPostcondition({ commandId: 'mystery.command', response: { ok: true } }), {
    ok: true,
    commandId: 'mystery.command',
    status: 'not_applicable',
  });
});

test('节点创建类：nodeId / node.id / nodeIds / ids 四路并集去重后必须全部落库', () => {
  const nodes = { a: {}, b: {}, c: {} };
  assert.deepEqual(
    verify('node.create', { nodeId: 'a', node: { id: 'b' }, nodeIds: ['c'], ids: ['a', ''] }, { nodes }),
    {
      ok: true,
      nodeIds: ['a', 'b', 'c'],
      commandId: 'node.create',
      status: 'verified',
    },
  );
  assert.deepEqual(verify('node.create', {}, { nodes }), {
    ok: false,
    commandId: 'node.create',
    reason: 'missing_result_node_ids',
    details: {},
    status: 'failed',
  });
  const missing = verify('node.create', { nodeIds: ['a', 'zz'] }, { nodes });
  assert.deepEqual(missing, {
    ok: false,
    commandId: 'node.create',
    reason: 'nodes_not_committed',
    details: { nodeIds: ['a', 'zz'], missingNodeIds: ['zz'] },
    status: 'failed',
  });
  // 创建类名单里的故事板/拼贴件走同一分支
  assert.equal(verify('storyboard.createFromImages', { nodeId: 'a' }, { nodes }).status, 'verified');
  assert.equal(verify('collage.createFromSelection', { ids: ['b'] }, { nodes }).ok, true);
});

test('媒体衍生类只看 result.nodeIds 是否落库', () => {
  const nodes = { m1: {}, m2: {} };
  assert.deepEqual(verify('video.reverse', { nodeIds: ['m1', 'm2'] }, { nodes }).nodeIds, ['m1', 'm2']);
  assert.equal(verify('audio.separate', {}, { nodes }).reason, 'missing_result_node_ids');
  assert.equal(verify('image.splitGrid', { nodeIds: ['nope'] }, { nodes }).reason, 'nodes_not_committed');
});

test('node.duplicate：份数由 sourceIds×copies 决定，非数字 copies 会让计数校验整体失效', () => {
  const nodes = { a: {}, b: {}, c: {} };
  assert.equal(
    verify('node.duplicate', { nodeIds: ['a', 'b'], sourceIds: ['x'] }, { nodes }).reason,
    'duplicate_count_mismatch',
  );
  assert.deepEqual(
    verify('node.duplicate', { nodeIds: ['a', 'b'], sourceIds: ['x'], copies: 2 }, { nodes }),
    { ok: true, nodeIds: ['a', 'b'], commandId: 'node.duplicate', status: 'verified' },
  );
  // copies 也接受 args 侧；args 优先级低于 result
  assert.equal(
    verify('node.duplicate', { nodeIds: ['a'] }, { nodes }, { copies: 1, ids: ['x'] }).status,
    'verified',
  );
  // 端口现状：Math.max(1, Math.trunc(NaN)) 仍是 NaN，NaN > 0 为假 ⇒ 跳过校验直接通过
  assert.equal(
    verify('node.duplicate', { nodeIds: ['a'], sourceIds: ['x', 'y'], copies: 'many' }, { nodes }).status,
    'verified',
  );
});

test('node.createConnected 与 graph.connect：边必须存在且逐字段字符串比较', () => {
  const edges = { e1: { sourceId: 'a', targetId: 'b', refSlot: 'in', type: 'flow' } };
  assert.deepEqual(
    verify('graph.connect', { edge: { id: ' e1 ', sourceId: 'a', targetId: 'b' } }, { edges }),
    { ok: true, edgeId: 'e1', commandId: 'graph.connect', status: 'verified' },
  );
  const mismatch = verify('graph.connect', { edgeId: 'e1', edge: { id: 'e1', type: 42 } }, { edges });
  assert.deepEqual(mismatch, {
    ok: false,
    commandId: 'graph.connect',
    reason: 'edge_state_mismatch',
    details: { edgeId: 'e1', field: 'type', expected: 42, actual: 'flow' },
    status: 'failed',
  });
  assert.equal(verify('graph.connect', {}, { edges }).reason, 'edge_not_committed');
  assert.deepEqual(verify('graph.connect', { edgeId: '' }, { edges }).details, { edgeId: '' });
  // node.createConnected 在没有 edge 字段时用 args/结果拼一条边
  const created = verify(
    'node.createConnected',
    { nodeId: 'b', sourceId: 'a' },
    { nodes: { a: {}, b: {} }, edges: { e1: { sourceId: 'a', targetId: 'b' } } },
  );
  assert.equal(created.reason, 'edge_not_committed');
  assert.equal(
    verify(
      'node.createConnected',
      { nodeId: 'b', edgeId: 'e1' },
      { nodes: { b: {} }, edges: { e1: { sourceId: 'a', targetId: 'b' } } },
    ).status,
    'verified',
  );
});

test('node.setInputSlot 用 refSlot 字段比对', () => {
  const edges = { e1: { refSlot: '3' } };
  assert.equal(verify('node.setInputSlot', { edge: { id: 'e1', refSlot: 3 } }, { edges }).status, 'verified');
  assert.deepEqual(verify('node.setInputSlot', { edgeId: 'e1', refSlot: 'other' }, { edges }), {
    ok: false,
    commandId: 'node.setInputSlot',
    reason: 'edge_state_mismatch',
    details: { edgeId: 'e1', field: 'refSlot', expected: 'other', actual: '3' },
    status: 'failed',
  });
});

test('node.select：期望为空也判失败，比对前双方都去重排序', () => {
  const context = { selectedNodeIds: ['b', 'a'] };
  assert.deepEqual(verify('node.select', { ids: ['a', 'b', 'b'] }, context), {
    ok: true,
    nodeIds: ['a', 'b'],
    commandId: 'node.select',
    status: 'verified',
  });
  assert.deepEqual(verify('node.select', {}, context), {
    ok: false,
    commandId: 'node.select',
    reason: 'selection_state_mismatch',
    details: { expectedIds: [], actualIds: ['b', 'a'] },
    status: 'failed',
  });
  assert.equal(verify('node.select', { nodeIds: ['a'] }, context).reason, 'selection_state_mismatch');
  assert.equal(verify('node.select', { ids: ['a'] }, { selectedNodeIds: null }).details.actualIds.join(), '');
});

test('node.group：组节点类型、子节点 parentId 与选中集三重校验', () => {
  const okNodes = { g: { type: 'group' }, c1: { parentId: 'g' }, c2: { parentId: 'g' } };
  assert.deepEqual(
    verify('node.group', { groupId: 'g', ids: ['c1', 'c2'] }, { nodes: okNodes, selectedNodeIds: ['g'] }),
    { ok: true, nodeIds: ['g', 'c1', 'c2'], commandId: 'node.group', status: 'verified' },
  );
  assert.equal(
    verify('node.group', { groupId: 'g', ids: ['c1', 'c2'] }, { nodes: okNodes, selectedNodeIds: ['c1'] })
      .reason,
    'selection_state_mismatch',
  );
  assert.equal(
    verify('node.group', { nodeId: 'g', ids: ['c1'] }, { nodes: { g: {}, c1: { parentId: 'g' } } }).reason,
    'group_state_mismatch',
  );
  assert.equal(
    verify('node.group', { groupId: 'g', ids: ['ghost'] }, { nodes: okNodes }).details.childMismatch,
    'ghost',
  );
  assert.equal(verify('node.group', { ids: ['c1'] }, { nodes: okNodes }).reason, 'missing_result_node_ids');
});

test('node.ungroup：组必须消失且子节点不再挂在任何被拆的组下', () => {
  assert.deepEqual(verify('node.ungroup', { groupIds: ['g'], childIds: ['c1'] }, { nodes: { c1: {} } }), {
    ok: true,
    nodeIds: ['c1'],
    commandId: 'node.ungroup',
    status: 'verified',
  });
  assert.deepEqual(
    verify(
      'node.ungroup',
      { groupIds: ['g'], childIds: ['c1'] },
      { nodes: { g: { type: 'group' }, c1: { parentId: 'g' } } },
    ),
    {
      ok: false,
      commandId: 'node.ungroup',
      reason: 'ungroup_state_mismatch',
      details: { groupIds: ['g'], childIds: ['c1'], remainingGroupIds: ['g'], attachedChildIds: ['c1'] },
      status: 'failed',
    },
  );
  assert.equal(
    verify('node.ungroup', { childIds: ['c1'] }, { nodes: { c1: {} } }).reason,
    'ungroup_state_mismatch',
  );
  assert.equal(
    verify(
      'node.ungroup',
      { groupIds: ['g'], childIds: ['ghost'] },
      { nodes: {} },
    ).details.attachedChildIds.join(),
    'ghost',
  );
});

test('clipboard.paste：节点、边都要落库且选中集等于粘贴出的节点', () => {
  const context = { nodes: { a: {} }, edges: { e1: {} }, selectedNodeIds: ['a'] };
  assert.deepEqual(verify('clipboard.paste', { nodeIds: ['a'], edgeIds: ['e1'] }, context), {
    ok: true,
    nodeIds: ['a'],
    edgeIds: ['e1'],
    commandId: 'clipboard.paste',
    status: 'verified',
  });
  // 没有 edgeIds 时边这一路完全不参与校验；ids 也可作为节点来源
  assert.equal(verify('clipboard.paste', { ids: ['a'] }, context).status, 'verified');
  assert.deepEqual(verify('clipboard.paste', { nodeIds: ['a'], edgeIds: ['gone'] }, context).details, {
    edgeIds: ['gone'],
    missingEdgeIds: ['gone'],
  });
  assert.equal(
    verify('clipboard.paste', { nodeIds: ['a'], edgeIds: [] }, { nodes: { a: {} }, selectedNodeIds: [] })
      .reason,
    'selection_state_mismatch',
  );
});

test('node.setPrompt / node.appendPrompt：节点存在且 prompt 字符串相等', () => {
  assert.deepEqual(
    verify('node.setPrompt', { nodeId: 'a', prompt: 'hi' }, { nodes: { a: { prompt: 'hi' } } }),
    {
      ok: true,
      nodeIds: ['a'],
      commandId: 'node.setPrompt',
      status: 'verified',
    },
  );
  assert.deepEqual(
    verify('node.appendPrompt', { nodeId: 'a', prompt: 'x' }, { nodes: { a: { prompt: null } } }),
    {
      ok: false,
      commandId: 'node.appendPrompt',
      reason: 'prompt_state_mismatch',
      details: { nodeId: 'a' },
      status: 'failed',
    },
  );
  // 两侧都过 String(x || '')，undefined 与空串等价
  assert.equal(verify('node.setPrompt', { nodeId: 'a' }, { nodes: { a: {} } }).status, 'verified');
  assert.equal(verify('node.setPrompt', {}, { nodes: { a: {} } }).reason, 'missing_result_node_ids');
});

test('node.setModel / node.changeModel：model、provider、params 三段校验', () => {
  const nodes = { a: { model: 'm1', provider: 'p', generationParams: { w: 1 } } };
  assert.equal(
    verify('node.changeModel', { nodeId: 'a', modelId: 'm1', provider: 'p', params: { w: 1 } }, { nodes }).ok,
    true,
  );
  // modelId 缺省时回落 model 字段
  assert.equal(verify('node.setModel', { nodeId: 'a', model: 'm1' }, { nodes }).ok, true);
  assert.equal(
    verify('node.setModel', { nodeId: 'a', modelId: 'other' }, { nodes }).reason,
    'model_state_mismatch',
  );
  assert.equal(
    verify('node.setModel', { nodeId: 'a', modelId: 'm1', provider: 'q' }, { nodes }).reason,
    'provider_state_mismatch',
  );
  // provider 显式为 undefined 时跳过该段
  assert.equal(
    verify('node.setModel', { nodeId: 'a', modelId: 'm1', provider: undefined }, { nodes }).ok,
    true,
  );
  assert.equal(
    verify('node.setModel', { nodeId: 'a', modelId: 'm1', params: { w: 2 } }, { nodes }).reason,
    'model_params_state_mismatch',
  );
  // 节点没有 generationParams 时与 {} 比较
  assert.equal(verify('node.setModel', { nodeId: 'b', params: {} }, { nodes: { b: {} } }).ok, true);
});

test('node.setParams 只比对 args 里出现的键，且数组按键递归比较', () => {
  const nodes = { a: { generationParams: { w: 1, tags: ['x', 'y'], extra: 9 } } };
  assert.equal(
    verify('node.setParams', { nodeId: 'a', params: { w: 1, tags: ['x', 'y'] } }, { nodes }).ok,
    true,
  );
  assert.deepEqual(verify('node.setParams', { nodeId: 'a', params: { tags: ['y', 'x'] } }, { nodes }), {
    ok: false,
    commandId: 'node.setParams',
    reason: 'params_state_mismatch',
    details: { nodeId: 'a' },
    status: 'failed',
  });
  assert.equal(verify('node.setParams', { nodeId: 'a' }, { nodes }).ok, true);
  // NaN 与 undefined 走 Object.is 分支，params 里的 NaN 无法匹配缺失键
  assert.equal(verify('node.setParams', { nodeId: 'a', params: { missing: NaN } }, { nodes }).ok, false);
});

test('layout.*：无 positions 时降级为 legacy_contract，有则按 1e-6 容差比对', () => {
  const nodes = { a: { x: 1, y: 2 }, b: { x: '3', y: 4 } };
  assert.deepEqual(verify('layout.align', { ids: ['a', 'b'] }, { nodes }), {
    ok: true,
    nodeIds: ['a', 'b'],
    status: 'legacy_contract',
    commandId: 'layout.align',
  });
  assert.equal(
    verify('layout.distribute', { movedIds: ['a'], positions: { a: { x: 1, y: 2 } } }, { nodes }).status,
    'verified',
  );
  // 字符串坐标经 Number 归一后可匹配；缺失节点报 layout_position_mismatch
  assert.equal(
    verify('layout.distribute', { ids: ['b'], positions: { b: { x: 3.0000000001, y: 4 } } }, { nodes })
      .status,
    'verified',
  );
  assert.deepEqual(verify('layout.distribute', { ids: ['a'], positions: { a: { x: 5, y: 2 } } }, { nodes }), {
    ok: false,
    commandId: 'layout.distribute',
    reason: 'layout_position_mismatch',
    details: { nodeId: 'a', expected: { x: 5, y: 2 }, actual: { x: 1, y: 2 } },
    status: 'failed',
  });
  assert.deepEqual(verify('layout.moveNearNode', { ids: ['ghost'] }, { nodes }).details, {
    nodeIds: ['ghost'],
    missingNodeIds: ['ghost'],
  });
  // 非对象 positions（字符串）等价于不传，走 legacy 分支
  assert.equal(
    verify('layout.arrangeGrid', { ids: ['a'], positions: 'no' }, { nodes }).status,
    'legacy_contract',
  );
  // 未分类的 layout.* 前缀同样进入布局分支（策略与分支解耦）
  assert.equal(getAgentActionPostconditionPolicy('layout.customThing'), 'unclassified');
  assert.equal(verify('layout.customThing', { ids: ['a'] }, { nodes }).status, 'legacy_contract');
});

test('generation.run：状态白名单、任务绑定与“无状态无任务即降级”三态', () => {
  const nodes = { a: {} };
  assert.equal(verify('generation.run', { status: 'completed', targetNodeId: 'a' }, { nodes }).ok, true);
  assert.equal(verify('generation.run', { status: 'queued', taskId: 't1', nodeId: 'a' }, { nodes }).ok, true);
  // failed 被特批：允许没有 taskId
  assert.deepEqual(verify('generation.run', { status: 'FAILED', nodeId: 'a' }, { nodes }), {
    ok: true,
    nodeIds: ['a'],
    commandId: 'generation.run',
    status: 'verified',
  });
  assert.equal(
    verify('generation.run', { status: 'weird', taskId: 't', nodeId: 'a' }, { nodes }).reason,
    'generation_status_unverified',
  );
  assert.deepEqual(verify('generation.run', { status: 'running', nodeId: 'a' }, { nodes }), {
    ok: false,
    commandId: 'generation.run',
    reason: 'generation_task_not_bound',
    details: { nodeId: 'a', status: 'running' },
    status: 'failed',
  });
  // 状态与 taskId 都为空：条目降级为 legacy_contract，但该标记被 runBatch 聚合层丢弃
  assert.deepEqual(verify('generation.run', {}, {}), {
    ok: true,
    nodeIds: [],
    commandId: 'generation.run',
    status: 'verified',
  });
  assert.equal(
    verify('generation.run', { status: 'completed', nodeId: 'ghost' }, { nodes }).reason,
    'nodes_not_committed',
  );
});

test('generation.runBatch 逐条校验并聚合 nodeIds；task.retry 复用单条入口', () => {
  const nodes = { a: {}, b: {} };
  assert.deepEqual(
    verify(
      'generation.runBatch',
      {
        results: [
          { status: 'completed', nodeId: 'a' },
          { status: 'queued', taskId: 't2', nodeId: 'b' },
        ],
      },
      { nodes },
    ),
    { ok: true, nodeIds: ['a', 'b'], commandId: 'generation.runBatch', status: 'verified' },
  );
  assert.equal(
    verify('generation.runBatch', { results: [] }, { nodes }).reason,
    'generation_results_missing',
  );
  assert.equal(verify('generation.runBatch', {}, { nodes }).reason, 'generation_results_missing');
  assert.equal(
    verify(
      'generation.runBatch',
      {
        results: [
          { status: 'completed', nodeId: 'a' },
          { status: 'bad', nodeId: 'b' },
        ],
      },
      { nodes },
    ).reason,
    'generation_status_unverified',
  );
  // 聚合 nodeIds 走原始 targetNodeId/nodeId，条目里无节点时得到空数组
  assert.deepEqual(verify('generation.runBatch', { results: [{}] }, { nodes }).nodeIds, []);
  assert.equal(verify('task.retry', { status: 'running', taskId: 't', nodeId: 'a' }, { nodes }).ok, true);
  assert.equal(
    verify('task.retry', { status: 'running', nodeId: 'a' }, { nodes }).reason,
    'generation_task_not_bound',
  );
});

test('generation.cancel/resume 与 scene.* 都只查 result.nodeId', () => {
  const nodes = { a: {} };
  assert.deepEqual(verify('generation.cancel', { nodeId: 'a' }, { nodes }), {
    ok: true,
    nodeIds: ['a'],
    commandId: 'generation.cancel',
    status: 'verified',
  });
  assert.equal(verify('generation.resume', {}, { nodes }).reason, 'missing_result_node_ids');
  assert.equal(verify('scene.compose', { nodeId: 'a' }, { nodes }).status, 'verified');
  assert.equal(
    verify('scene.camera.addKeyframe', { nodeId: 'ghost' }, { nodes }).reason,
    'nodes_not_committed',
  );
});

test('media.resetSize：只有 result.sizes 里出现过的节点参与宽高比对', () => {
  const nodes = { a: { width: 10, height: 20 }, b: { width: 1, height: 2 } };
  assert.deepEqual(
    verify('media.resetSize', { nodeIds: ['a', 'b'], sizes: { a: { width: 10, height: 20 } } }, { nodes }),
    { ok: true, nodeIds: ['a', 'b'], commandId: 'media.resetSize', status: 'verified' },
  );
  assert.deepEqual(
    verify('media.resetSize', { nodeIds: ['a'], sizes: { a: { width: 10, height: '21' } } }, { nodes }),
    {
      ok: false,
      commandId: 'media.resetSize',
      reason: 'node_size_mismatch',
      details: { nodeId: 'a' },
      status: 'failed',
    },
  );
  // sizes 缺省或不覆盖某节点 ⇒ 该节点完全不校验
  assert.equal(verify('media.resetSize', { nodeIds: ['a'] }, { nodes }).ok, true);
  assert.equal(verify('media.resetSize', {}, { nodes }).reason, 'missing_result_node_ids');
});

test('graph.disconnect 与 node.delete 是“必须消失”语义；空 id 列表都算失败', () => {
  assert.deepEqual(verify('graph.disconnect', { edgeIds: ['e1'] }, { edges: {} }), {
    ok: true,
    edgeIds: ['e1'],
    commandId: 'graph.disconnect',
    status: 'verified',
  });
  assert.deepEqual(verify('graph.disconnect', { edgeIds: ['e1'] }, { edges: { e1: {} } }), {
    ok: false,
    commandId: 'graph.disconnect',
    reason: 'edges_not_removed',
    details: { remainingEdgeIds: ['e1'] },
    status: 'failed',
  });
  assert.equal(verify('graph.disconnect', {}, { edges: {} }).ok, true);
  assert.deepEqual(verify('node.delete', { ids: ['a'] }, { nodes: {} }), {
    ok: true,
    nodeIds: ['a'],
    commandId: 'node.delete',
    status: 'verified',
  });
  assert.deepEqual(verify('node.delete', {}, { nodes: {} }), {
    ok: false,
    commandId: 'node.delete',
    reason: 'nodes_not_removed',
    details: { nodeIds: [], remainingNodeIds: [] },
    status: 'failed',
  });
});

test('node.rename：renamed 优先，否则由 ids 与 name/names 配对', () => {
  const nodes = { a: { name: 'A' }, b: { name: 'B' } };
  assert.deepEqual(verify('node.rename', { renamed: [{ nodeId: 'a', name: 'A' }] }, { nodes }), {
    ok: true,
    nodeIds: ['a'],
    commandId: 'node.rename',
    status: 'verified',
  });
  assert.deepEqual(verify('node.rename', { ids: ['a', 'b'], names: ['A', 'B'] }, { nodes }), {
    ok: true,
    nodeIds: ['a', 'b'],
    commandId: 'node.rename',
    status: 'verified',
  });
  // names 数组短于 ids 时，越界位为 undefined ⇒ 与真实名不等即失败
  assert.deepEqual(verify('node.rename', { ids: ['a', 'b'], names: ['A'] }, { nodes }), {
    ok: false,
    commandId: 'node.rename',
    reason: 'node_name_mismatch',
    details: { nodeId: 'b' },
    status: 'failed',
  });
  assert.equal(verify('node.rename', { nodeId: 'a', name: 'A' }, { nodes }).ok, true);
  assert.equal(verify('node.rename', { ids: ['ghost'], name: 'x' }, { nodes }).details.nodeId, 'ghost');
  assert.deepEqual(verify('node.rename', {}, { nodes }).nodeIds, []);
});

test('store 策略全覆盖：未落进任何分支的 store 命令才会得到 postcondition_policy_missing', () => {
  // 41 个 store 命令全部有对应分支，故该 reason 在 store 路径不可达；
  // 这里以未分类命令确认 not_applicable 才是真实兜底
  const fallback = verifyAgentActionPostcondition({
    commandId: 'unknown.thing',
    response: { ok: true, result: {} },
    commandContext: ctx({}),
  });
  assert.deepEqual(fallback, { ok: true, commandId: 'unknown.thing', status: 'not_applicable' });
});

test('处理器：非成功响应原样透传，成功即附 verification 且不重新执行命令', async () => {
  let executed = 0;
  const handler = createAgentActionPostconditionHandler({
    executeCommand: async () => {
      executed += 1;
      return { ok: true };
    },
  });
  const passthrough = { ok: false, message: 'nope' };
  assert.equal(
    await handler({ commandId: 'node.select', args: {}, response: passthrough, context: {} }),
    passthrough,
  );
  assert.equal(executed, 0);

  const verified = await handler({
    commandId: 'node.select',
    args: {},
    response: { ok: true, result: { ids: ['a'] } },
    context: ctx({ selectedNodeIds: ['a'] }),
  });
  assert.deepEqual(verified, {
    ok: true,
    result: { ids: ['a'] },
    verification: { status: 'verified', attempts: 0 },
  });
  assert.equal(executed, 0);
});

test('处理器：不可自动修复的失败直接短路，不回写执行', async () => {
  let executed = 0;
  const handler = createAgentActionPostconditionHandler({
    executeCommand: async () => {
      executed += 1;
      return { ok: true };
    },
  });
  const failed = await handler({
    commandId: 'node.create',
    args: {},
    response: { ok: true, result: {} },
    context: ctx({}),
  });
  assert.deepEqual(failed, {
    ok: false,
    commandId: 'node.create',
    errorCode: 'AGENT_POSTCONDITION_FAILED',
    message: 'node.create returned success, but its canvas result could not be verified.',
    details: { reason: 'missing_result_node_ids', repairAttempted: false },
    verification: { status: 'failed', attempts: 0, reason: 'missing_result_node_ids' },
  });
  assert.equal(executed, 0);
});

test('处理器：shouldContinue 否决修复时不带 repair 字段', async () => {
  let executed = 0;
  const seen = [];
  const handler = createAgentActionPostconditionHandler({
    shouldContinue: (meta) => {
      seen.push(meta);
      return false;
    },
    executeCommand: async () => {
      executed += 1;
      return { ok: true };
    },
  });
  const failed = await handler({
    commandId: 'node.select',
    args: { ids: ['a'] },
    response: { ok: true, result: { ids: ['a'] } },
    context: ctx({ selectedNodeIds: [] }),
  });
  assert.equal(failed.details.repairAttempted, false);
  assert.equal(executed, 0);
  assert.deepEqual(seen, [{ phase: 'postcondition_repair', commandId: 'node.select' }]);
});

test('处理器：修复成功返回重放响应并标记 repaired', async () => {
  const canvasState = state({ selectedNodeIds: [] });
  let calls = 0;
  const handler = createAgentActionPostconditionHandler({
    executeCommand: async (commandId, args) => {
      calls += 1;
      canvasState.selectedNodeIds = [...args.ids];
      return { ok: true, result: { ids: args.ids }, replayed: true };
    },
  });
  const result = await handler({
    commandId: 'node.select',
    args: { ids: ['a', 'b'] },
    response: { ok: true, result: { ids: ['a', 'b'] } },
    context: { store: { getStateRaw: () => canvasState } },
  });
  assert.deepEqual(result, {
    ok: true,
    result: { ids: ['a', 'b'] },
    replayed: true,
    verification: { status: 'repaired', attempts: 1, initialReason: 'selection_state_mismatch' },
  });
  assert.equal(calls, 1);
});

test('处理器：修复重放失败时把重放错误写进 details', async () => {
  const context = ctx({ selectedNodeIds: [] });
  const failing = createAgentActionPostconditionHandler({
    executeCommand: async () => ({ ok: false, errorCode: 'CMD_LOCKED', message: 'locked' }),
  });
  const outcome = await failing({
    commandId: 'node.select',
    args: {},
    response: { ok: true, result: { ids: ['a'] } },
    context,
  });
  assert.deepEqual(outcome.details, {
    reason: 'selection_state_mismatch',
    expectedIds: ['a'],
    actualIds: [],
    repairAttempted: true,
    repairErrorCode: 'CMD_LOCKED',
    repairMessage: 'locked',
  });
  assert.deepEqual(outcome.verification, {
    status: 'failed',
    attempts: 1,
    reason: 'selection_state_mismatch',
  });

  const replayedStillBad = createAgentActionPostconditionHandler({
    executeCommand: async () => ({ ok: true, result: { ids: ['a'] } }),
  });
  const second = await replayedStillBad({
    commandId: 'node.select',
    args: {},
    response: { ok: true, result: { ids: ['a'] } },
    context,
  });
  assert.equal(second.details.repairAttempted, true);
  assert.equal(second.details.repairErrorCode, '');
  assert.equal(second.details.repairMessage, '');
  assert.equal(second.errorCode, 'AGENT_POSTCONDITION_FAILED');
});

test('处理器：executeCommand 与 commandContext 都有缺省值', async () => {
  const handler = createAgentActionPostconditionHandler({});
  const passthrough = { ok: false };
  assert.equal(
    await handler({ commandId: 'node.rename', args: {}, response: passthrough, context: undefined }),
    passthrough,
  );
  // 未给 context 时用构造期的 commandContext；此处给一份可用状态使校验通过
  const okHandler = createAgentActionPostconditionHandler({
    commandContext: ctx({ nodes: { a: { name: 'A' } } }),
    executeCommand: async () => ({ ok: true }),
  });
  const verified = await okHandler({
    commandId: 'node.rename',
    args: {},
    response: { ok: true, result: { renamed: [{ nodeId: 'a', name: 'A' }] } },
    context: undefined,
  });
  assert.equal(verified.verification.status, 'verified');
});
