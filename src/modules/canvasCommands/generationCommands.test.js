import test from 'node:test';
import assert from 'node:assert/strict';
import { registerGenerationCommands } from './generationCommands.js';

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

const videoNode = (extra = {}) => ({ type: 'ai-video', isGenerating: false, ...extra });

function setup({ nodes = {}, runtime = {} } = {}) {
  const store = { getStateRaw: () => ({ nodes }) };
  const host = {
    store,
    graphStore: store,
    nodeRuntimeRegistry: { get: (nodeId) => runtime[nodeId] || null },
  };
  const registry = createRegistry();
  registerGenerationCommands(registry);
  return { registry, host, command: (id) => registry.commands.get(id) };
}

test('generationCommands: 注册 5 条命令，runBatch 排在最前且上限 12', () => {
  const { registry } = setup();
  assert.deepEqual(
    [...registry.commands.keys()],
    [
      'generation.runBatch',
      'generation.run',
      'generation.cancel',
      'generation.resume',
      'generation.getStatus',
    ],
    'runBatch 要在 run 之前注册（Agent 的批量场景优先匹配它）'
  );
  const command = registry.commands.get('generation.runBatch');
  assert.equal(command.riskLevel, 'confirm', '批量生成必须走确认');
  assert.equal(command.argsSchema.required[0], 'nodeIds');
  assert.equal(command.argsSchema.properties.nodeIds.maxItems, 12);
  assert.equal(command.capabilitySchema.requiresMountedRuntime, false, '检查已下沉到 execute');
  assert.deepEqual(command.returnSchema.aliasFields, ['nodeIds', 'status', 'results']);
});

test('generationCommands: runBatch validate 依次拦空/超量/不存在的节点', () => {
  const nodes = { a: videoNode(), b: videoNode() };
  const { command, host } = setup({ nodes });
  const validate = command('generation.runBatch').validate;

  assert.equal(validate({}, host).errorCode, 'MISSING_NODE_IDS');
  assert.equal(validate({ nodeIds: ['  ', ''] }, host).errorCode, 'MISSING_NODE_IDS');
  assert.equal(
    validate({ nodeIds: Array.from({ length: 13 }, (_, index) => 'n' + index) }, host).errorCode,
    'GENERATION_BATCH_TOO_LARGE'
  );
  assert.equal(validate({ nodeIds: ['a', 'ghost'] }, host).errorCode, 'NODE_NOT_FOUND');

  const accepted = validate({ nodeIds: [' a ', 'a', 'b'], options: { dryRun: true } }, host);
  assert.deepEqual(accepted.args.nodeIds, ['a', 'b'], '去空白并去重');
  assert.deepEqual(accepted.args.options, { dryRun: true });
});

test('generationCommands: runBatch 单点失败不打断整批，返回 partial_failed', async () => {
  const nodes = { a: videoNode(), b: videoNode() };
  const { command, host } = setup({
    nodes,
    runtime: {
      a: { runGeneration: async () => ({ status: 'submitted', taskId: 'task-a' }) },
      b: {
        runGeneration: async () => {
          throw new Error('provider rejected');
        },
      },
    },
  });
  const result = await command('generation.runBatch').execute(
    { nodeIds: ['a', 'b'], options: {} },
    host
  );
  assert.deepEqual(result.nodeIds, ['a', 'b']);
  assert.equal(result.status, 'partial_failed', '有失败时整批状态要能看出来');
  assert.equal(result.results[0].status, 'submitted');
  assert.equal(result.results[0].taskId, 'task-a');
  assert.equal(result.results[1].status, 'failed');
  assert.equal(result.results[1].message, 'provider rejected', '单点错误原因要保留');
});

test('generationCommands: runBatch 全军覆没才整体报错', async () => {
  const nodes = { a: videoNode() };
  const { command, host } = setup({
    nodes,
    runtime: {
      a: {
        runGeneration: async () => {
          const error = new Error('no credentials');
          error.errorCode = 'MISSING_CREDENTIALS';
          throw error;
        },
      },
    },
  });
  await assert.rejects(
    () => command('generation.runBatch').execute({ nodeIds: ['a'], options: {} }, host),
    (error) => {
      assert.equal(error.errorCode, 'GENERATION_BATCH_NOT_STARTED');
      assert.equal(
        error.details?.results?.[0]?.errorCode,
        'MISSING_CREDENTIALS',
        '原始错误码要透传'
      );
      return true;
    }
  );
});

test('generationCommands: 未挂载的节点在开跑前就被拦下', async () => {
  const nodes = { a: videoNode(), b: videoNode() };
  const { command, host } = setup({
    nodes,
    runtime: { a: { runGeneration: async () => ({ status: 'submitted', taskId: 't' }) } },
  });
  await assert.rejects(
    () => command('generation.runBatch').execute({ nodeIds: ['a', 'b'], options: {} }, host),
    (error) => {
      assert.equal(error.errorCode, 'GENERATION_NODE_NOT_MOUNTED');
      assert.equal(error.details?.nodeId, 'b');
      return true;
    }
  );
});

test('generationCommands: generation.run 失败要抛错，成功返回归一化结果', async () => {
  const nodes = { a: videoNode(), b: videoNode(), c: videoNode() };
  const { command, host } = setup({
    nodes,
    runtime: {
      a: { runGeneration: async () => ({ status: 'submitted', taskId: 'task-a' }) },
      b: { runGeneration: async () => ({ ok: false, message: 'quota exceeded' }) },
      c: { runGeneration: async () => ({}) },
    },
  });

  const okRun = await command('generation.run').execute({ nodeId: 'a', options: {} }, host);
  assert.deepEqual(
    { nodeId: okRun.nodeId, status: okRun.status, taskId: okRun.taskId },
    { nodeId: 'a', status: 'submitted', taskId: 'task-a' },
    '成功路径要把 status/taskId 提出来，调用方不用再猜'
  );

  await assert.rejects(
    () => command('generation.run').execute({ nodeId: 'b', options: {} }, host),
    (error) => {
      assert.equal(error.errorCode, 'GENERATION_RUN_FAILED');
      assert.equal(error.message, 'quota exceeded');
      return true;
    },
    '以前失败也被当成成功返回，Agent 后置校验看不见'
  );

  await assert.rejects(
    () => command('generation.run').execute({ nodeId: 'c', options: {} }, host),
    (error) => {
      assert.equal(error.errorCode, 'GENERATION_NOT_STARTED', '什么都没发生与「跑失败」要分开');
      return true;
    }
  );
});

test('generationCommands: 全成功时整批状态取一致值而不是 partial', async () => {
  const nodes = { a: videoNode(), b: videoNode() };
  const { command, host } = setup({
    nodes,
    runtime: {
      a: { runGeneration: async () => ({ status: 'submitted', taskId: 'ta' }) },
      b: { runGeneration: async () => ({ status: 'submitted', taskId: 'tb' }) },
    },
  });
  const result = await command('generation.runBatch').execute(
    { nodeIds: ['a', 'b'], options: {} },
    host
  );
  assert.equal(result.status, 'submitted');
  assert.equal(
    result.results.every((entry) => entry.status === 'submitted'),
    true
  );
});
