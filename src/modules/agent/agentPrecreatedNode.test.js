import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAgentPrecreatedNodeRuntime,
  deriveAgentPrecreatedNodeType,
  doesActionConsumePrecreatedNode,
  normalizeAgentPrecreatedNode,
} from './agentPrecreatedNode.js';

function makeRuntime(over = {}) {
  const calls = { execute: [], select: [], traces: [], pending: [], marked: [], options: [] };
  const runtime = createAgentPrecreatedNodeRuntime({
    plannerAvailable: () => ('plannerAvailable' in over ? over.plannerAvailable : true),
    hasCanvasActionIntent: () => ('hasIntent' in over ? over.hasIntent : true),
    readCanvasState: () => ('canvasState' in over ? over.canvasState : { selectedNodeIds: [], nodes: {} }),
    executeActions: async (actions, options) => {
      calls.options.push(options);
      if (actions[0].type === 'node.select') {
        calls.select.push([actions, options]);
        return { ok: true };
      }
      calls.execute.push([actions, options]);
      return 'execution' in over ? over.execution : { ok: true, createdNodeIds: ['n1'] };
    },
    buildExecutionOptions: (runId) => ({ runScoped: runId }),
    isActiveRun: () => ('isActiveRun' in over ? over.isActiveRun : true),
    sessionStore:
      'sessionStore' in over
        ? over.sessionStore
        : {
            recordTrace: (trace) => calls.traces.push(trace),
            setPendingLoopRun: (run) => calls.pending.push(run),
          },
    markUnfinishedOperation: (message) => calls.marked.push(message),
    commandContext: { ctx: 1 },
  });
  return { runtime, calls };
}

const run = (over = {}) => ({
  originalMessage: '创建一张图片',
  plannerExtra: {},
  runId: 'r1',
  ...over,
});

test('normalizeAgentPrecreatedNode 要求 nodeId 与 type 同时存在且只保留这两个字段', () => {
  assert.deepEqual(normalizeAgentPrecreatedNode({ nodeId: ' a ', type: ' ai-image ', x: 1 }), {
    nodeId: 'a',
    type: 'ai-image',
  });
  assert.deepEqual(normalizeAgentPrecreatedNode(), null);
  assert.deepEqual(normalizeAgentPrecreatedNode({ nodeId: 'a' }), null);
  assert.deepEqual(normalizeAgentPrecreatedNode({ type: 'ai-image' }), null);
  assert.deepEqual(normalizeAgentPrecreatedNode({ nodeId: '   ', type: 'ai-image' }), null);
  assert.deepEqual(normalizeAgentPrecreatedNode(['a', 'ai-image']), null);
  assert.deepEqual(normalizeAgentPrecreatedNode('ai-image'), null);
  // 非字符串标量按 String() 归一，不做类型白名单校验。
  assert.deepEqual(normalizeAgentPrecreatedNode({ nodeId: 12, type: true }), {
    nodeId: '12',
    type: 'true',
  });
});

test('derive 在无创建意图或显式否定时返回空串', () => {
  assert.equal(deriveAgentPrecreatedNodeType({ message: '' }), '');
  assert.equal(deriveAgentPrecreatedNodeType({ message: '帮我改一下这段文案' }), '');
  assert.equal(deriveAgentPrecreatedNodeType({ message: '不要创建图片节点' }), '');
  assert.equal(deriveAgentPrecreatedNodeType({ message: 'do not add an image' }), '');
});

test('derive 识别显式新建语句与 plannerExtra 目标种类', () => {
  assert.equal(deriveAgentPrecreatedNodeType({ message: '创建一张图片' }), 'ai-image');
  assert.equal(deriveAgentPrecreatedNodeType({ message: '新建一段视频' }), 'ai-video');
  assert.equal(
    deriveAgentPrecreatedNodeType({ message: 'create an audio', plannerExtra: { targetKind: 'audio' } }),
    'ai-audio',
  );
  assert.equal(
    deriveAgentPrecreatedNodeType({
      message: '新建一个文本节点',
      plannerExtra: { targetKind: 'text' },
    }),
    'ai-text',
  );
  // 目标种类白名单外（且句中无类型词）时不推导。
  assert.equal(
    deriveAgentPrecreatedNodeType({ message: '新建一个东西', plannerExtra: { targetKind: 'svg' } }),
    '',
  );
});

// derive 内部把 includeGenerateVerb 硬编码为 true：仅凭生成动词也算创建请求。
test('derive 内部开启 includeGenerateVerb，仅凭生成动词即可命中类型', () => {
  assert.equal(deriveAgentPrecreatedNodeType({ message: '生成一张图片' }), 'ai-image');
  assert.equal(deriveAgentPrecreatedNodeType({ message: '渲染一段视频' }), 'ai-video');
  assert.equal(deriveAgentPrecreatedNodeType({ message: '绘制产品海报' }), 'ai-image');
});

test('选中同类型节点且语句指向已有目标时不预创建', () => {
  const canvasState = { selectedNodeIds: ['n1'], nodes: { n1: { type: 'ai-image' } } };
  assert.equal(deriveAgentPrecreatedNodeType({ message: '重新生成这张图片', canvasState }), '');
  assert.equal(deriveAgentPrecreatedNodeType({ message: '优化当前节点的图片', canvasState }), '');
  assert.equal(deriveAgentPrecreatedNodeType({ message: 'regenerate this image', canvasState }), '');
});

test('已有目标语句同时含显式新建动词时仍然预创建', () => {
  const canvasState = { selectedNodeIds: ['n1'], nodes: { n1: { type: 'ai-image' } } };
  assert.equal(deriveAgentPrecreatedNodeType({ message: '重新生成并新建一张图片', canvasState }), 'ai-image');
});

test('节点名称命中已有节点时不预创建，名称过短则不参与命中', () => {
  const byName = { selectedNodeIds: [], nodes: { n9: { type: 'ai-image', name: '产品海报' } } };
  assert.equal(deriveAgentPrecreatedNodeType({ message: '把产品海报重新生成一下', canvasState: byName }), '');
  const tooShort = { selectedNodeIds: [], nodes: { n9: { type: 'ai-image', name: '图' } } };
  assert.equal(
    deriveAgentPrecreatedNodeType({ message: '把这张图片重新生成一下', canvasState: tooShort }),
    'ai-image',
  );
  const typeMismatch = {
    selectedNodeIds: [],
    nodes: { n9: { type: 'ai-video', name: '产品海报' } },
  };
  assert.equal(
    deriveAgentPrecreatedNodeType({ message: '把产品海报重新生成一下', canvasState: typeMismatch }),
    'ai-image',
  );
});

test('derive 容忍缺失或非数组的画布状态', () => {
  assert.equal(deriveAgentPrecreatedNodeType({ message: '创建一张图片' }), 'ai-image');
  assert.equal(
    deriveAgentPrecreatedNodeType({
      message: '创建一张图片',
      canvasState: { selectedNodeIds: 'n1', nodes: null },
    }),
    'ai-image',
  );
});

test('doesActionConsumePrecreatedNode 只认 node.create 且参数类型一致', () => {
  const precreated = { nodeId: 'n1', type: 'ai-image' };
  assert.equal(
    doesActionConsumePrecreatedNode({ type: 'node.create', args: { type: 'ai-image' } }, precreated),
    true,
  );
  assert.equal(
    doesActionConsumePrecreatedNode({ commandId: 'node.create', args: { type: 'ai-image' } }, precreated),
    true,
  );
  assert.equal(
    doesActionConsumePrecreatedNode({ type: 'node.create', args: { type: 'ai-video' } }, precreated),
    false,
  );
  assert.equal(
    doesActionConsumePrecreatedNode({ type: 'node.update', args: { type: 'ai-image' } }, precreated),
    false,
  );
  assert.equal(doesActionConsumePrecreatedNode({ type: 'node.create' }, precreated), false);
  assert.equal(
    doesActionConsumePrecreatedNode({ type: 'node.create', args: { type: 'ai-image' } }, null),
    false,
  );
  assert.equal(
    doesActionConsumePrecreatedNode({ type: 'node.create', args: { type: 'ai-image' } }, { nodeId: 'n1' }),
    false,
  );
  assert.equal(doesActionConsumePrecreatedNode({ type: 'node.create', args: { type: 'ai-image' } }), false);
});

test('reserve：planner 不可用或无画布动作意图时原样返回入参', async () => {
  const noPlanner = makeRuntime({ plannerAvailable: false });
  const input = run();
  assert.equal(await noPlanner.runtime.reserve(input), input);
  assert.deepEqual(noPlanner.calls.execute, []);

  const noIntent = makeRuntime({ hasIntent: false });
  assert.equal(await noIntent.runtime.reserve(input), input);
  assert.deepEqual(noIntent.calls.execute, []);
});

test('reserve：默认装配件（零配置）不预创建任何节点', async () => {
  const bare = createAgentPrecreatedNodeRuntime();
  const input = run();
  assert.equal(await bare.reserve(input), input);
  assert.deepEqual(await bare.reserve(), {});
});

test('reserve：无法推导类型时不调用 executeActions', async () => {
  const { runtime, calls } = makeRuntime();
  const input = run({ originalMessage: '帮我改一下这段文案' });
  assert.equal(await runtime.reserve(input), input);
  assert.deepEqual(calls.execute, []);
  assert.deepEqual(calls.traces, []);
});

test('reserve：选中同类型节点时跳过预创建', async () => {
  const { runtime, calls } = makeRuntime({
    canvasState: { selectedNodeIds: ['n5'], nodes: { n5: { type: 'ai-image' } } },
  });
  const input = run({ originalMessage: '重新生成这张图片' });
  assert.equal(await runtime.reserve(input), input);
  assert.deepEqual(calls.execute, []);
});

test('reserve：readCanvasState 返回假值时按空画布继续', async () => {
  const { runtime, calls } = makeRuntime({ canvasState: null });
  const result = await runtime.reserve(run());
  assert.deepEqual(calls.execute[0][0], [{ type: 'node.create', args: { type: 'ai-image' } }]);
  assert.deepEqual(result.precreatedNode, { nodeId: 'n1', type: 'ai-image' });
});

test('reserve：创建动作带 precreateReservation 标记与执行选项', async () => {
  const { runtime, calls } = makeRuntime({
    canvasState: { selectedNodeIds: ['n0'], nodes: {} },
  });
  await runtime.reserve(run());
  assert.deepEqual(calls.execute[0][1], {
    commandContext: { ctx: 1 },
    precreateReservation: true,
    runScoped: 'r1',
  });
  assert.deepEqual(calls.select[0][1], { commandContext: { ctx: 1 }, runScoped: 'r1' });
});

test('reserve：成功路径恢复原选中集、落 pendingLoopRun 并记录 ready trace', async () => {
  const { runtime, calls } = makeRuntime({
    canvasState: { selectedNodeIds: ['n0', 'n5'], nodes: {} },
    execution: { ok: true, createdNodeIds: ['n77'] },
  });
  const input = run();
  const result = await runtime.reserve(input);
  assert.deepEqual(calls.execute[0][0], [{ type: 'node.create', args: { type: 'ai-image' } }]);
  assert.deepEqual(calls.select[0][0], [{ type: 'node.select', args: { ids: ['n0', 'n5'] } }]);
  assert.deepEqual(result, { ...input, precreatedNode: { nodeId: 'n77', type: 'ai-image' } });
  assert.notEqual(result, input);
  assert.deepEqual(calls.pending, [{ ...result, pendingKind: 'interrupted' }]);
  assert.deepEqual(calls.marked, ['创建一张图片']);
  assert.deepEqual(calls.traces, [
    { type: 'agent_precreated_node_ready', commandId: 'node.create', nodeId: 'n77', nodeType: 'ai-image' },
  ]);
});

test('reserve：无历史选中节点时不补发 node.select', async () => {
  const { runtime, calls } = makeRuntime();
  await runtime.reserve(run());
  assert.deepEqual(calls.select, []);
  assert.equal(calls.execute.length, 1);
});

test('reserve：run 在等待期间停止时原样返回且不落库', async () => {
  const { runtime, calls } = makeRuntime({ isActiveRun: false });
  const input = run();
  assert.equal(await runtime.reserve(input), input);
  assert.equal(calls.execute.length, 1);
  assert.deepEqual(calls.select, []);
  assert.deepEqual(calls.pending, []);
  assert.deepEqual(calls.traces, []);
});

test('reserve：创建失败时记录 failed trace 并返回原 run', async () => {
  const { runtime, calls } = makeRuntime({
    execution: { ok: false, errorCode: 'NODE_CREATE_BLOCKED' },
  });
  const input = run();
  assert.equal(await runtime.reserve(input), input);
  assert.deepEqual(calls.traces, [
    {
      type: 'agent_precreated_node_failed',
      commandId: 'node.create',
      nodeType: 'ai-image',
      errorCode: 'NODE_CREATE_BLOCKED',
    },
  ]);
  assert.deepEqual(calls.pending, []);
  assert.deepEqual(calls.marked, []);
});

test('reserve：ok 非严格 true 或缺少 createdNodeIds 时按失败处理', async () => {
  const looseOk = makeRuntime({ execution: { ok: 1, createdNodeIds: ['n1'] } });
  const input = run();
  assert.equal(await looseOk.runtime.reserve(input), input);
  assert.equal(looseOk.calls.traces[0].type, 'agent_precreated_node_failed');
  assert.equal(looseOk.calls.traces[0].errorCode, '');
  assert.deepEqual(looseOk.calls.pending, []);
  assert.deepEqual(looseOk.calls.select, []);

  const noIds = makeRuntime({ execution: { ok: true } });
  assert.equal(await noIds.runtime.reserve(input), input);
  assert.deepEqual(noIds.calls.pending, []);
  assert.equal(noIds.calls.traces[0].type, 'agent_precreated_node_failed');
});

test('reserve：sessionStore 缺失时成功路径仍返回预创建节点', async () => {
  const { runtime, calls } = makeRuntime({ sessionStore: null });
  const result = await runtime.reserve(run());
  assert.deepEqual(result.precreatedNode, { nodeId: 'n1', type: 'ai-image' });
  assert.deepEqual(calls.traces, []);
  assert.deepEqual(calls.pending, []);
});
