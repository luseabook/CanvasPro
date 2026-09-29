import test from 'node:test';
import assert from 'node:assert/strict';
import { registerTaskCommands } from './taskCommands.js';

function createRegistry() {
  const commands = new Map();
  return {
    commands,
    register(command) {
      commands.set(command.id, command);
      return this;
    },
  };
}

function setup(options = {}) {
  const nodes = options.nodes || {};
  const selectedNodeIds = options.selectedNodeIds || [];
  const calls = { focus: [], resolve: [], commits: 0 };
  const store = { getStateRaw: () => ({ nodes, selectedNodeIds }) };
  const host = {
    store,
    graphStore: store,
    commit: () => {
      calls.commits += 1;
    },
    nodeRuntimeRegistry: {
      resolve: (nodeId, resolveOptions) => {
        calls.resolve.push([nodeId, resolveOptions]);
        return (options.runtimes || {})[nodeId] || null;
      },
    },
  };
  if (options.hasFocus !== false) {
    host.focusNodes = (...args) => {
      calls.focus.push(args);
      return options.focusResult;
    };
  }
  const registry = createRegistry();
  registerTaskCommands(registry);
  return { registry, host, calls, command: (id) => registry.commands.get(id) };
}

test('taskCommands: 注册 2 条命令与 capability/return schema', () => {
  const { registry } = setup();
  assert.deepEqual([...registry.commands.keys()], ['task.focusResult', 'task.retry']);
  assert.deepEqual(
    [...registry.commands.values()].map((command) => command.riskLevel),
    ['safe', 'confirm'],
  );
  const focus = registry.commands.get('task.focusResult');
  assert.deepEqual(focus.argsSchema.defaults, { padding: 80, durationMs: 800 });
  assert.equal(focus.argsSchema.selectionFallback, true);
  assert.deepEqual(focus.capabilitySchema.reads, ['nodes', 'selection']);
  assert.deepEqual(focus.capabilitySchema.writes, ['viewport']);
  assert.deepEqual(focus.returnSchema.aliasFields, ['taskId', 'nodeIds', 'focused']);
  const retry = registry.commands.get('task.retry');
  assert.deepEqual(retry.capabilitySchema.reads, ['nodes', 'selection', 'nodeRuntimeRegistry']);
  assert.deepEqual(retry.capabilitySchema.writes, ['nodes', 'generationTasks']);
  assert.deepEqual(retry.returnSchema.aliasFields, ['nodeId', 'targetNodeId', 'status', 'taskId', 'value']);
});

test('taskCommands: task.focusResult 无 focusNodes 时返回 VIEWPORT_FOCUS_UNAVAILABLE', () => {
  const { host, command } = setup({ hasFocus: false, nodes: { n1: { type: 'ai-image' } } });
  const outcome = command('task.focusResult').validate({ nodeId: 'n1' }, host);
  assert.deepEqual(
    { ok: outcome.ok, errorCode: outcome.errorCode, message: outcome.message },
    {
      ok: false,
      errorCode: 'VIEWPORT_FOCUS_UNAVAILABLE',
      message: 'task.focusResult requires a viewport focus service.',
    },
  );
});

test('taskCommands: 目标节点解析覆盖 ids、别名、taskId 扫描与选区回退', () => {
  const { host, command } = setup({
    nodes: {
      n1: { type: 'ai-image' },
      n2: { type: 'ai-video' },
      n3: { type: 'ai-image' },
      t1: { type: 'ai-image', taskId: 'task-1' },
      deep: { type: 'ai-image', result: { submitId: 'task-2' } },
      hidden: { type: 'ai-image', l1: { l2: { l3: { l4: { l5: { taskId: 'task-hidden' } } } } } },
    },
    selectedNodeIds: [' n3 '],
  });
  const cmd = command('task.focusResult');
  const nodeIds = (args) => cmd.validate(args, host).args.nodeIds;
  assert.deepEqual(nodeIds({ ids: ['n1', 'n1', ''] }), ['n1']);
  assert.deepEqual(nodeIds({ ids: ['n1'], nodeId: 'n1' }), ['n1']);
  assert.deepEqual(nodeIds({ ids: ['n1'], nodeId: 'n2' }), ['n1', 'n2']);
  assert.deepEqual(nodeIds({ targetNodeId: 'n2' }), ['n2']);
  assert.deepEqual(nodeIds({ resultNodeId: 'n3' }), ['n3']);
  assert.deepEqual(nodeIds({ taskId: ' task-1 ' }), ['t1']);
  assert.deepEqual(nodeIds({ taskId: 'task-2' }), ['deep']);
  assert.deepEqual(nodeIds({}), ['n3']);
  const missing = cmd.validate({ nodeId: 'ghost' }, host);
  assert.deepEqual({ ok: missing.ok, errorCode: missing.errorCode }, { ok: false, errorCode: 'NODE_NOT_FOUND' });
  const noTarget = cmd.validate(
    {},
    { ...host, store: { getStateRaw: () => ({ nodes: {}, selectedNodeIds: [] }) } },
  );
  assert.equal(noTarget.ok, false);
  assert.equal(noTarget.errorCode, 'TASK_TARGET_NOT_FOUND');
  assert.deepEqual(noTarget.details, { taskId: '' });
  const hidden = cmd.validate({ taskId: 'task-hidden' }, host);
  assert.equal(hidden.ok, false);
  assert.equal(hidden.errorCode, 'TASK_TARGET_NOT_FOUND');
});

test('taskCommands: taskId 命中时不再回退选区', () => {
  const { host, command } = setup({
    nodes: { n1: { type: 'ai-image' } },
    selectedNodeIds: ['n1'],
  });
  const outcome = command('task.focusResult').validate({ taskId: 'nope' }, host);
  assert.equal(outcome.ok, false);
  assert.equal(outcome.errorCode, 'TASK_TARGET_NOT_FOUND');
});

test('taskCommands: padding/durationMs 归一为有限非负数，负数与非法值落回默认', () => {
  const { host, command } = setup({ nodes: { n1: { type: 'ai-image' } } });
  const cmd = command('task.focusResult');
  const args = (input) => cmd.validate(input, host).args;
  assert.deepEqual(
    { padding: args({ nodeId: 'n1' }).padding, durationMs: args({ nodeId: 'n1' }).durationMs },
    { padding: 80, durationMs: 800 },
  );
  assert.equal(args({ nodeId: 'n1', padding: 0, durationMs: 0 }).padding, 0);
  assert.equal(args({ nodeId: 'n1', padding: -3 }).padding, 80);
  assert.equal(args({ nodeId: 'n1', padding: 'x' }).padding, 80);
  assert.equal(args({ nodeId: 'n1', padding: null }).padding, 0);
  assert.equal(args({ nodeId: 'n1', padding: -0 }).padding === 0, true);
  assert.equal(Object.is(args({ nodeId: 'n1', padding: -0 }).padding, -0), true);
  assert.equal(args({ nodeId: 'n1', durationMs: 1500 }).durationMs, 1500);
  assert.equal(args({ nodeId: 'n1', durationMs: 240.7 }).durationMs, 240.7);
  assert.deepEqual(args({ nodeId: 'n1' }).options, {});
  assert.deepEqual(args({ nodeId: 'n1', options: [1] }).options, {});
  assert.deepEqual(args({ nodeId: 'n1', options: { zone: 2 } }).options, { zone: 2 });
});

test('taskCommands: task.focusResult execute 传参序列与 focused 判定', () => {
  const focusTrue = setup({ nodes: { n1: { type: 'ai-image' } }, focusResult: true });
  const cmd = focusTrue.command('task.focusResult');
  const args = cmd.validate({ nodeId: 'n1', padding: 10, durationMs: 20 }, focusTrue.host).args;
  const result = cmd.execute(args, focusTrue.host);
  assert.deepEqual(result, { taskId: '', nodeIds: ['n1'], focused: true });
  assert.deepEqual(focusTrue.calls.focus, [[['n1'], 10, 20, { source: 'task.focusResult', taskId: '' }]]);

  const focusFalse = setup({ nodes: { n1: { type: 'ai-image' } }, focusResult: false });
  const falseCmd = focusFalse.command('task.focusResult');
  const falseArgs = falseCmd.validate({ nodeId: 'n1', options: { source: 'custom', zoom: 3 } }, focusFalse.host).args;
  const falseResult = falseCmd.execute(falseArgs, focusFalse.host);
  assert.deepEqual(
    { focused: falseResult.focused, taskId: falseResult.taskId, nodeIds: falseResult.nodeIds },
    { focused: false, taskId: '', nodeIds: ['n1'] },
  );
  assert.deepEqual(focusFalse.calls.focus, [[['n1'], 80, 800, { source: 'custom', taskId: '', zoom: 3 }]]);

  const focusUndefined = setup({ nodes: { n1: { type: 'ai-image' } } });
  const undefinedCmd = focusUndefined.command('task.focusResult');
  const undefinedArgs = undefinedCmd.validate({ nodeId: 'n1' }, focusUndefined.host).args;
  assert.equal(undefinedCmd.execute(undefinedArgs, focusUndefined.host).focused, true);
});

test('taskCommands: task.retry validate 要求恰好一个目标节点', () => {
  const { host, command } = setup({
    nodes: { n1: { type: 'ai-image' }, n2: { type: 'ai-image' } },
    selectedNodeIds: [],
  });
  const cmd = command('task.retry');
  const ambiguous = cmd.validate({ ids: ['n1', 'n2'] }, host);
  assert.deepEqual(
    { ok: ambiguous.ok, errorCode: ambiguous.errorCode, details: ambiguous.details },
    { ok: false, errorCode: 'AMBIGUOUS_TASK_TARGET', details: { nodeIds: ['n1', 'n2'] } },
  );
  const single = cmd.validate({ ids: ['n1'] }, host).args;
  assert.deepEqual({ nodeId: single.nodeId, taskId: single.taskId, options: single.options }, {
    nodeId: 'n1',
    taskId: '',
    options: {},
  });
  const trimmed = cmd.validate({ nodeId: 'n1', taskId: ' t ' }, host).args;
  assert.equal(trimmed.taskId, 't');
  assert.deepEqual(cmd.validate({ nodeId: 'n1', options: 'x' }, host).args.options, {});
  const none = cmd.validate({}, host);
  assert.equal(none.ok, false);
  assert.equal(none.errorCode, 'TASK_TARGET_NOT_FOUND');
  const missing = cmd.validate({ ids: ['ghost'] }, host);
  assert.equal(missing.ok, false);
  assert.equal(missing.errorCode, 'NODE_NOT_FOUND');
  const selected = cmd.validate({}, { ...host, store: { getStateRaw: () => ({ nodes: { n1: { type: 'ai-image' } }, selectedNodeIds: ['n1'] }) } });
  assert.equal(selected.ok, undefined);
  assert.equal(selected.args.nodeId, 'n1');
});

test('taskCommands: task.retry execute 缺 runGeneration 时抛 TASK_RETRY_UNAVAILABLE', async () => {
  const emptyRuntime = setup({ nodes: { n1: { type: 'ai-image' } }, runtimes: { n1: {} } });
  const args = emptyRuntime.command('task.retry').validate({ nodeId: 'n1' }, emptyRuntime.host).args;
  await assert.rejects(
    () => emptyRuntime.command('task.retry').execute(args, emptyRuntime.host),
    (error) => error.errorCode === 'TASK_RETRY_UNAVAILABLE' && error.details.nodeId === 'n1',
  );
  const noRuntime = setup({ nodes: { n1: { type: 'ai-image' } }, runtimes: {} });
  const noRuntimeArgs = noRuntime.command('task.retry').validate({ nodeId: 'n1' }, noRuntime.host).args;
  await assert.rejects(
    () => noRuntime.command('task.retry').execute(noRuntimeArgs, noRuntime.host),
    (error) => error.errorCode === 'TASK_RETRY_UNAVAILABLE',
  );
});

test('taskCommands: task.retry execute 合并选项并按结果归一状态与任务号', async () => {
  const runArgs = [];
  const runtimeResult = { status: ' RUNNING ', taskId: 't9', targetNodeId: ' n2 ', extra: 1 };
  const { host, calls, command } = setup({
    nodes: { n1: { type: 'ai-image' } },
    runtimes: {
      n1: {
        runGeneration: async (options) => {
          runArgs.push(options);
          return runtimeResult;
        },
      },
    },
  });
  const cmd = command('task.retry');
  const args = cmd.validate({ nodeId: 'n1', taskId: 't1' }, host).args;
  const result = await cmd.execute(args, host);
  assert.deepEqual(runArgs, [{ source: 'task.retry', retry: true, taskId: 't1' }]);
  assert.deepEqual(calls.resolve, [['n1', { store: host.store }]]);
  assert.deepEqual(
    { nodeId: result.nodeId, targetNodeId: result.targetNodeId, status: result.status, taskId: result.taskId },
    { nodeId: 'n1', targetNodeId: 'n2', status: 'running', taskId: 't9' },
  );
  assert.equal(result.value, runtimeResult);
});

test('taskCommands: task.retry 的 source/taskId 由 options 优先，状态回落到节点字段', async () => {
  const runArgs = [];
  const nodes = { n1: { type: 'ai-image', jobStatus: ' Queued ', rhTaskId: ' node-task ' } };
  const { host, command } = setup({
    nodes,
    runtimes: {
      n1: {
        runGeneration: async (options) => {
          runArgs.push(options);
          return {};
        },
      },
    },
  });
  const cmd = command('task.retry');
  const args = cmd.validate({ nodeId: 'n1', taskId: 't1', options: { source: 'custom', taskId: 'opt-task' } }, host)
    .args;
  const result = await cmd.execute(args, host);
  assert.deepEqual(runArgs, [{ source: 'custom', taskId: 'opt-task', retry: true }]);
  assert.deepEqual(
    { targetNodeId: result.targetNodeId, status: result.status, taskId: result.taskId },
    { targetNodeId: 'n1', status: 'queued', taskId: 'node-task' },
  );
});

test('taskCommands: task.retry 状态与任务号的兜底分支', async () => {
  const failed = setup({
    nodes: { n1: { type: 'ai-image' } },
    runtimes: { n1: { runGeneration: async () => ({ ok: false }) } },
  });
  const failedArgs = failed.command('task.retry').validate({ nodeId: 'n1' }, failed.host).args;
  const failedResult = await failed.command('task.retry').execute(failedArgs, failed.host);
  assert.deepEqual({ status: failedResult.status, taskId: failedResult.taskId }, { status: 'failed', taskId: '' });

  const succeeded = setup({
    nodes: { n1: { type: 'ai-image' } },
    runtimes: { n1: { runGeneration: async () => ({ ok: true }) } },
  });
  const successArgs = succeeded.command('task.retry').validate({ nodeId: 'n1', taskId: ' fallback ' }, succeeded.host)
    .args;
  const successResult = await succeeded.command('task.retry').execute(successArgs, succeeded.host);
  assert.deepEqual(
    { status: successResult.status, taskId: successResult.taskId },
    { status: 'success', taskId: 'fallback' },
  );

  const noNode = setup({ runtimes: { n1: { runGeneration: async () => ({}) } } });
  const noNodeArgs = noNode.command('task.retry').validate({ ids: ['n1'] }, { ...noNode.host, store: { getStateRaw: () => ({ nodes: { n1: {} }, selectedNodeIds: [] }) } }).args;
  const noNodeResult = await noNode.command('task.retry').execute(noNodeArgs, noNode.host);
  assert.deepEqual({ status: noNodeResult.status, taskId: noNodeResult.taskId }, { status: '', taskId: '' });
});
