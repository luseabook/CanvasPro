import test from 'node:test';
import assert from 'node:assert/strict';

import { createAgentConversationCanvasTransferRuntime } from './agentConversationCanvasTransferRuntime.js';

const PROMPT_REPLACE = '把这段文案写入选中节点的提示词';
const PROMPT_APPEND = '把这段文案追加到选中节点的提示词';
const TEXT_NODE = '把这段文案保存到画布的文本节点';
const TRANSFERRED = '这是第一版文案';

function make(over = {}) {
  const ports = {
    pushed: [],
    runs: [],
    traces: [],
    actions: [],
    plans: [],
    guards: [],
  };
  const sessionStore = {
    pushHistory: (entry) => ports.pushed.push(entry),
    setCurrentRun: (run) => ports.runs.push(run),
    recordTrace: (trace) => ports.traces.push(trace),
    getHistory: () =>
      'history' in over
        ? over.history
        : [{ role: 'assistant', status: 'chat', content: TRANSFERRED, itemId: 'i1', turnId: 't1' }],
    ...(over.sessionStore || {}),
  };
  const runtime = createAgentConversationCanvasTransferRuntime({
    sessionStore,
    readCanvasState: () =>
      'canvasState' in over ? over.canvasState : { selectedNodeIds: ['n1'], nodes: {} },
    executeActions: async (actions, options) => {
      ports.actions.push([actions, options]);
      return 'execution' in over ? over.execution : { ok: true };
    },
    handlePlan: async (plan, meta) => {
      ports.plans.push([plan, meta]);
      return 'planResult' in over ? over.planResult : { ok: true, status: 'success', reply: 'planned' };
    },
    buildExecutionGuard: (turnId) => {
      ports.guards.push(turnId);
      return { guardFor: turnId };
    },
    isActiveRun: () => ('isActiveRun' in over ? over.isActiveRun : true),
    createStoppedReply: () => ({ ok: false, status: 'stopped', reply: 'T:stopped' }),
    commandContext: { ctx: 1 },
    text: (key) => 'T:' + key,
  });
  return { runtime, ports };
}

test('非搬运语句返回 null，不记录 trace 也不触碰任何端口', async () => {
  const { runtime, ports } = make();
  assert.equal(await runtime.handle('帮我生成一张图片', 'turn-1'), null);
  assert.deepEqual(ports.traces, []);
  assert.deepEqual(ports.actions, []);
  assert.deepEqual(ports.plans, []);
  assert.deepEqual(ports.pushed, []);
});

test('文本搬运：创建 ai-text 节点，并带上 commandContext 与执行护栏', async () => {
  const { runtime, ports } = make();
  const result = await runtime.handle(TEXT_NODE, 'turn-1');
  assert.deepEqual(ports.actions[0][0], [
    { type: 'node.create', args: { type: 'ai-text', prompt: TRANSFERRED } },
  ]);
  assert.deepEqual(ports.actions[0][1], { commandContext: { ctx: 1 }, guardFor: 'turn-1' });
  assert.deepEqual(ports.guards, ['turn-1']);
  assert.equal(result.ok, true);
  assert.equal(result.status, 'success');
  assert.equal(result.reply, 'T:textPlacedOnCanvas');
  assert.equal(result.message, 'T:textPlacedOnCanvas');
  assert.equal(result.responseChannel, 'canvas.tool');
});

test('文本搬运写回会话历史与当前 run，并回带 plan/execution 证据', async () => {
  const execution = { ok: true, createdNodeIds: ['n9'] };
  const { runtime: rt, ports: p } = make({ execution });
  const result = await rt.handle(TEXT_NODE, 'turn-2');
  const action = { type: 'node.create', args: { type: 'ai-text', prompt: TRANSFERRED } };
  assert.deepEqual(p.pushed, [
    {
      role: 'assistant',
      status: 'success',
      content: 'T:textPlacedOnCanvas',
      plan: { status: 'ready', reply: 'T:textPlacedOnCanvas', actions: [action] },
      execution,
    },
  ]);
  assert.deepEqual(p.runs, [{ id: 'turn-2', status: 'success', stopped: false }]);
  assert.equal(result.execution, execution);
  assert.deepEqual(p.traces, [
    { type: 'agent_turn_routed', channel: 'canvas.tool', reason: 'conversation-text-transfer' },
  ]);
});

test('执行失败时优先用端口返回的 message，缺省回退统一失败文案', async () => {
  const withMessage = make({ execution: { ok: false, message: '画布拒绝了这次创建' } });
  const first = await withMessage.runtime.handle(TEXT_NODE, 'turn-3');
  assert.equal(first.ok, false);
  assert.equal(first.status, 'failed');
  assert.equal(first.reply, '画布拒绝了这次创建');
  assert.deepEqual(withMessage.ports.runs, [{ id: 'turn-3', status: 'failed', stopped: false }]);

  const bare = make({ execution: { ok: false } });
  const second = await bare.runtime.handle(TEXT_NODE, 'turn-4');
  assert.equal(second.reply, 'T:actionExecutionFailed');
});

test('run 在等待期间停止时直接返回 createStoppedReply，不写会话历史', async () => {
  const { runtime, ports } = make({ isActiveRun: false });
  assert.deepEqual(await runtime.handle(TEXT_NODE, 'turn-5'), {
    ok: false,
    status: 'stopped',
    reply: 'T:stopped',
  });
  assert.equal(ports.actions.length, 1);
  assert.deepEqual(ports.pushed, []);
  assert.deepEqual(ports.runs, []);
});

test('trace 的 reason 区分两条搬运通道', async () => {
  const textChannel = make();
  await textChannel.runtime.handle(TEXT_NODE, 'turn-6');
  assert.deepEqual(textChannel.ports.traces, [
    {
      type: 'agent_turn_routed',
      channel: 'canvas.tool',
      reason: 'conversation-text-transfer',
    },
  ]);
  const promptChannel = make();
  await promptChannel.runtime.handle(PROMPT_REPLACE, 'turn-7');
  assert.deepEqual(promptChannel.ports.traces, [
    {
      type: 'agent_turn_routed',
      channel: 'canvas.tool',
      reason: 'conversation-prompt-transfer',
    },
  ]);
});

// 端口现状：没有可用的 assistant 历史时，解析器把 null 交给 getAssistantText 而抛 TypeError，
// 因此 textSourceMissing 分支与 agent_turn_routed trace 都不可达，handle 直接以异常退出。
test('没有可用历史时搬运以 TypeError 退出，不记录 trace 也不执行动作', async () => {
  for (const history of [[], undefined, null]) {
    const { runtime, ports } = make({ history });
    await assert.rejects(() => runtime.handle(TEXT_NODE, 'turn-8'), {
      name: 'TypeError',
      message: "Cannot read properties of null (reading 'content')",
    });
    assert.deepEqual(ports.actions, []);
    assert.deepEqual(ports.plans, []);
    assert.deepEqual(ports.pushed, []);
    assert.deepEqual(ports.traces, []);
  }
});

test('历史里没有 chat 态 assistant 文案时同样抛错：非 assistant、failed 与纯空白条目都被过滤', async () => {
  const { runtime } = make({
    history: [
      { role: 'user', content: TRANSFERRED },
      { role: 'assistant', status: 'failed', content: TRANSFERRED },
      { role: 'assistant', status: 'chat', content: '   ' },
    ],
  });
  await assert.rejects(() => runtime.handle(PROMPT_REPLACE, 'turn-8b'), TypeError);
});

test('提示词搬运需要恰好一个选中节点：无选中时只回提示', async () => {
  const { runtime, ports } = make({ canvasState: { selectedNodeIds: [], nodes: {} } });
  const result = await runtime.handle(PROMPT_REPLACE, 'turn-9');
  assert.equal(result.reply, 'T:promptTransferTargetRequired');
  assert.equal(result.status, 'chat');
  assert.deepEqual(ports.plans, []);
  assert.deepEqual(ports.runs, [{ id: 'turn-9', status: 'chat', stopped: false }]);
});

test('选中节点 id 会去空白并去重后再计数', async () => {
  const single = make({ canvasState: { selectedNodeIds: [' a ', 'a', '', null], nodes: {} } });
  await single.runtime.handle(PROMPT_REPLACE, 'turn-10');
  assert.equal(single.ports.plans.length, 1);

  const multi = make({ canvasState: { selectedNodeIds: ['a', 'b', 'b'], nodes: {} } });
  const result = await multi.runtime.handle(PROMPT_REPLACE, 'turn-11');
  assert.equal(result.reply, 'T:promptTransferTargetRequired');
  assert.deepEqual(multi.ports.plans, []);
});

test('提示词替换走 handlePlan：映射为 node.setPrompt 并补齐确认/完成文案', async () => {
  const { runtime, ports } = make();
  const result = await runtime.handle(PROMPT_REPLACE, 'turn-12');
  const [plan, meta] = ports.plans[0];
  assert.deepEqual(plan, {
    status: 'ready',
    reply: 'T:promptTransferCompleted',
    actions: [{ type: 'node.setPrompt', args: { nodeId: 'n1', text: TRANSFERRED } }],
  });
  assert.deepEqual(meta, {
    agentContext: {},
    userMessage: PROMPT_REPLACE,
    turnId: 'turn-12',
    confirmationReply: 'T:promptTransferConfirmation',
    completionReply: 'T:promptTransferCompleted',
  });
  assert.equal(result.reply, 'planned');
  assert.equal(result.responseChannel, 'canvas.tool');
  assert.deepEqual(ports.runs, [{ id: 'turn-12', status: 'success', stopped: false }]);
});

test('append 语义映射为 node.appendPrompt，且始终使用首个选中节点', async () => {
  const { runtime, ports } = make({ canvasState: { selectedNodeIds: ['n7'], nodes: {} } });
  await runtime.handle(PROMPT_APPEND, 'turn-13');
  assert.deepEqual(ports.plans[0][0].actions, [
    { type: 'node.appendPrompt', args: { nodeId: 'n7', text: TRANSFERRED } },
  ]);
});

test('plan 落地后若 run 已停止则不再回写当前 run', async () => {
  const { runtime, ports } = make({ isActiveRun: false });
  const result = await runtime.handle(PROMPT_REPLACE, 'turn-14');
  assert.equal(result.reply, 'planned');
  assert.deepEqual(ports.plans.length, 1);
  assert.deepEqual(ports.runs, []);
  assert.deepEqual(ports.pushed, []);
});

test('plan 返回的 status 原样写入当前 run', async () => {
  const { runtime, ports } = make({
    planResult: { ok: false, status: 'needs_confirmation', reply: '要确认' },
  });
  const result = await runtime.handle(PROMPT_REPLACE, 'turn-15');
  assert.equal(result.status, 'needs_confirmation');
  assert.deepEqual(ports.runs, [{ id: 'turn-15', status: 'needs_confirmation', stopped: false }]);
});

test('sessionStore 缺少可选方法时全流程不抛错', async () => {
  const { runtime } = make({
    sessionStore: { getHistory: () => [{ role: 'assistant', status: 'chat', content: TRANSFERRED }] },
  });
  assert.equal((await runtime.handle(TEXT_NODE, 'turn-16')).reply, 'T:textPlacedOnCanvas');
  assert.equal((await runtime.handle(PROMPT_REPLACE, 'turn-17')).reply, 'planned');
});

test('readCanvasState 缺失或返回非对象时按无选中处理', async () => {
  const { runtime } = make({ canvasState: undefined });
  const local = createAgentConversationCanvasTransferRuntime({
    sessionStore: { getHistory: () => [{ role: 'assistant', content: TRANSFERRED }] },
    handlePlan: async () => ({ ok: true, status: 'success', reply: 'planned' }),
    text: (key) => 'T:' + key,
  });
  assert.equal((await local.handle(PROMPT_REPLACE, 'turn-18')).reply, 'T:promptTransferTargetRequired');
  assert.equal((await runtime.handle(PROMPT_REPLACE, 'turn-19')).reply, 'T:promptTransferTargetRequired');
});
