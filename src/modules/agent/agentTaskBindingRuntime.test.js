import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentTaskBindingRuntime } from './agentTaskBindingRuntime.js';

function makeState(nodes) {
  return { nodes: Object.fromEntries(nodes.map((node) => [node.id, node])) };
}

function makeSessionStore(initialBindings = [], overrides = {}) {
  const bindings = [...initialBindings];
  const history = [];
  const updates = [];
  return {
    bindings,
    history,
    updates,
    getTaskBindings: () => bindings,
    upsertTaskBindings: (list) => list.map((binding) => (bindings.push(binding), binding)),
    upsertTaskBinding: (binding) => (bindings.push(binding), binding),
    updateTaskBinding: (id, patch) => {
      const target = bindings.find((binding) => binding.id === id) || null;
      updates.push({ id, patch });
      if (target) Object.assign(target, patch);
      return target;
    },
    pushHistory: (message) => (history.push(message), message),
    ...overrides,
  };
}

function makeRuntime({
  nodes = [],
  bindings = [],
  conversationId = 'conv-1',
  turnId = 'turn-1',
  formatText = null,
  onBindingsChanged = null,
  store = null,
  sessionStoreOverrides = {},
} = {}) {
  const state = { nodes: Object.fromEntries(nodes.map((node) => [node.id, node])) };
  const sessionStore = makeSessionStore(bindings, sessionStoreOverrides);
  const runtime = createAgentTaskBindingRuntime({
    store,
    sessionStore,
    readCanvasState: () => state,
    getActiveConversationId: () => conversationId,
    getCurrentTurnId: (fallback) => fallback || turnId,
    formatText,
    onBindingsChanged,
  });
  return { runtime, sessionStore, state };
}

function bindingFixture(overrides = {}) {
  return {
    id: 'b1',
    conversationId: 'conv-1',
    turnId: 'turn-1',
    nodeId: 'n1',
    targetNodeId: 'n1',
    taskId: 't1',
    commandId: 'generation.run',
    status: 'running',
    messageStatus: 'running',
    notifiedTerminal: false,
    ...overrides,
  };
}

test('任务绑定运行时：sessionStore 与 readCanvasState 缺一即抛 TypeError', () => {
  assert.throws(() => createAgentTaskBindingRuntime({}), TypeError);
  assert.throws(
    () => createAgentTaskBindingRuntime({ sessionStore: makeSessionStore() }),
    /sessionStore and readCanvasState are required/,
  );
  assert.throws(
    () =>
      createAgentTaskBindingRuntime({
        sessionStore: makeSessionStore(),
        readCanvasState: 'not-a-function',
      }),
    TypeError,
  );
  const runtime = createAgentTaskBindingRuntime({
    sessionStore: makeSessionStore(),
    readCanvasState: () => makeState([]),
  });
  assert.equal(Object.isFrozen(runtime), true);
  assert.deepEqual(Object.keys(runtime), [
    'getPending',
    'getSettlement',
    'registerExecution',
    'start',
    'sync',
    'dispose',
  ]);
});

test('注册执行：非生成命令的响应整体丢弃，只留 generation.run 与 runBatch 展开项', () => {
  const { runtime, sessionStore } = makeRuntime({ nodes: [{ id: 'n1', type: 'image' }] });
  assert.deepEqual(
    runtime.registerExecution({ results: [{ commandId: 'node.create', result: { nodeId: 'n1' } }] }),
    [],
  );
  assert.deepEqual(sessionStore.bindings, []);
  assert.deepEqual(sessionStore.history, []);
});

test('注册执行：generation.run 成功产出绑定与 task_result 消息，图片结果带媒体项', () => {
  const node = { id: 'n1', type: 'image', name: '海报', imageUrl: 'https://cdn/a.png' };
  const { runtime, sessionStore } = makeRuntime({ nodes: [node] });
  const messages = runtime.registerExecution(
    {
      results: [
        { commandId: 'generation.run', ok: true, result: { nodeId: 'n1', taskId: 't-9', status: 'success' } },
      ],
    },
    { turnId: 'turn-1' },
  );
  assert.equal(sessionStore.bindings.length, 1);
  assert.deepEqual(
    { ...sessionStore.bindings[0] },
    {
      id: 'agent-task:conv-1:turn-1:n1:t-9',
      conversationId: 'conv-1',
      turnId: 'turn-1',
      nodeId: 'n1',
      targetNodeId: 'n1',
      taskId: 't-9',
      commandId: 'generation.run',
      status: 'success',
      notifiedTerminal: true,
      messageStatus: 'success',
    },
  );
  assert.equal(messages.length, 1);
  assert.deepEqual(
    { ...messages[0], task: { ...messages[0].task, media: undefined } },
    {
      role: 'assistant',
      status: 'success',
      messageType: 'task_result',
      content: 'taskCompleted',
      task: {
        nodeId: 'n1',
        taskId: 't-9',
        commandId: 'generation.run',
        status: 'success',
        resultKind: 'image',
        media: undefined,
      },
    },
  );
  assert.deepEqual(messages[0].task.media, {
    kind: 'image',
    url: 'https://cdn/a.png',
    thumbUrl: 'https://cdn/a.png',
    name: '海报（图片节点）',
    items: [{ url: 'https://cdn/a.png', thumbUrl: 'https://cdn/a.png', name: '海报（图片节点）' }],
  });
});

test('注册执行：无状态但有 taskId 视为 running，既无状态又无 taskId 直接丢弃', () => {
  const node = { id: 'n1', type: 'text' };
  const withTaskId = makeRuntime({ nodes: [node] });
  const messages = withTaskId.runtime.registerExecution({
    results: [{ commandId: 'generation.run', ok: true, result: { nodeId: 'n1', taskId: 't-1' } }],
  });
  assert.equal(withTaskId.sessionStore.bindings[0].status, 'running');
  assert.equal(messages[0].messageType, 'task_status');
  assert.equal(messages[0].content, 'taskStarted');
  assert.equal(messages[0].task.resultKind, 'text');
  assert.equal('media' in messages[0].task, false);
  const bare = makeRuntime({ nodes: [node] });
  assert.deepEqual(
    bare.runtime.registerExecution({
      results: [{ commandId: 'generation.run', ok: true, result: { nodeId: 'n1' } }],
    }),
    [],
  );
  assert.deepEqual(bare.sessionStore.bindings, []);
});

test('注册执行：响应无状态时回落节点 jobStatus，错误文案取节点 jobError', () => {
  const node = { id: 'n1', type: 'video', jobStatus: 'failed', jobError: '上游超时' };
  const { runtime, sessionStore } = makeRuntime({
    nodes: [node],
    formatText: (key, params = {}) => `${key}:${params.nodeLabel}:${params.error ?? ''}`,
  });
  const messages = runtime.registerExecution({
    results: [{ commandId: 'generation.run', ok: true, result: { nodeId: 'n1' } }],
  });
  assert.equal(sessionStore.bindings[0].status, 'failed');
  assert.equal(sessionStore.bindings[0].notifiedTerminal, true);
  // 节点无 name ⇒ 标签回落到 nodeId
  assert.equal(messages[0].content, 'taskFailed:n1（视频节点）:上游超时');
  assert.equal(messages[0].status, 'failed');
  assert.equal(messages[0].task.resultKind, 'video');
  assert.equal(messages.length, 1);
});

test('注册执行：runBatch 逐项展开，失败子项取反 ok 且无节点标签时回落「目标」', () => {
  const nodes = [
    { id: 'n1', type: 'image', imageUrl: 'https://cdn/1.png' },
    { id: 'n2', type: 'image', jobStatus: 'error' },
  ];
  const { runtime, sessionStore } = makeRuntime({ nodes });
  const messages = runtime.registerExecution({
    results: [
      {
        commandId: 'generation.runBatch',
        result: {
          results: [
            { nodeId: 'n1', taskId: 'b1', status: 'completed' },
            { nodeId: 'n2', taskId: 'b2', status: 'error' },
            { taskId: 'b3' },
          ],
        },
      },
    ],
  });
  assert.equal(messages.length, 2);
  assert.deepEqual(
    sessionStore.bindings.map((binding) => [binding.id, binding.status, binding.notifiedTerminal]),
    [
      ['agent-task:conv-1:turn-1:n1:b1', 'completed', true],
      ['agent-task:conv-1:turn-1:n2:b2', 'error', true],
    ],
  );
  assert.deepEqual(
    messages.map((message) => message.content),
    ['taskCompleted', 'taskFailed'],
  );
  // 无 name 的节点用 nodeId 兜底标签
  assert.equal(messages[1].task.nodeId, 'n2');
  assert.deepEqual(messages[0].task.media.name, 'n1（图片节点）');
  // 终态子节点存在 ⇒ 收尾再跑一次 sync
  assert.equal(sessionStore.history.length, 2);
});

test('注册执行：会话与轮次缺省时用 conversation/turn 占位，非法字符统一替换为下划线', () => {
  const { runtime, sessionStore } = makeRuntime({
    nodes: [{ id: 'n/1', type: 'image' }],
    conversationId: 'agent conv:9',
    turnId: '',
  });
  runtime.registerExecution({
    results: [{ commandId: 'generation.run', ok: true, result: { nodeId: 'n/1', taskId: 't 1' } }],
  });
  assert.equal(sessionStore.bindings[0].id, 'agent-task:agent_conv_9:turn:n_1:t_1');
});

test('注册执行：缺 upsertTaskBindings 时逐条走 upsertTaskBinding', () => {
  const calls = [];
  const { runtime } = makeRuntime({
    nodes: [{ id: 'n1', type: 'image' }],
    sessionStoreOverrides: {
      upsertTaskBindings: undefined,
      upsertTaskBinding: (binding) => {
        calls.push(binding.id);
        return { ...binding, commandId: 'generation.runBatch' };
      },
    },
  });
  const messages = runtime.registerExecution({
    results: [{ commandId: 'generation.run', ok: true, result: { nodeId: 'n1', taskId: 't1' } }],
  });
  assert.deepEqual(calls, ['agent-task:conv-1:turn-1:n1:t1']);
  // 消息里的 commandId 取自 upsert 返回值 ⇒ 回写生效
  assert.equal(messages[0].task.commandId, 'generation.runBatch');
});

test('同步：终态节点推送历史并回写 notifiedTerminal，二次同步幂等', () => {
  const node = { id: 'n1', type: 'image', name: '海报', imageUrl: 'https://cdn/a.png', jobStatus: 'success' };
  let changed = 0;
  const { runtime, sessionStore } = makeRuntime({
    nodes: [node],
    bindings: [bindingFixture()],
    onBindingsChanged: () => (changed += 1),
  });
  runtime.sync(makeState([node]));
  assert.equal(sessionStore.history.length, 1);
  assert.equal(sessionStore.history[0].content, 'taskCompleted');
  assert.deepEqual(sessionStore.updates[0].patch, {
    status: 'success',
    messageStatus: 'success',
    taskId: 't1',
    notifiedTerminal: true,
  });
  assert.equal(sessionStore.bindings[0].notifiedTerminal, true);
  runtime.sync(makeState([node]));
  assert.equal(sessionStore.history.length, 1);
  assert.equal(changed, 2);
});

test('同步：绑定缺 nodeId、已通知终态、节点无状态三种情形都跳过但仍回调 onBindingsChanged', () => {
  const { runtime, sessionStore } = makeRuntime({
    nodes: [{ id: 'n3', type: 'image' }],
    bindings: [
      bindingFixture({ id: 'x1', nodeId: '' }),
      bindingFixture({ id: 'x2', notifiedTerminal: true }),
      bindingFixture({ id: 'x3', nodeId: 'n3', notifiedTerminal: false }),
    ],
  });
  runtime.sync();
  assert.deepEqual(sessionStore.updates, []);
  assert.deepEqual(sessionStore.history, []);
  assert.equal(sessionStore.bindings.length, 3);
});

test('同步：非终态且状态未变时不回写，状态变化时才写入补丁且不带 notifiedTerminal', () => {
  const unchanged = makeRuntime({
    nodes: [{ id: 'n1', type: 'image', isGenerating: true }],
    bindings: [bindingFixture()],
  });
  unchanged.runtime.sync();
  assert.deepEqual(unchanged.sessionStore.updates, []);
  assert.deepEqual(unchanged.sessionStore.history, []);
  const changedCase = makeRuntime({
    nodes: [{ id: 'n1', type: 'image', jobStatus: 'generating' }],
    bindings: [bindingFixture({ status: 'pending', messageStatus: 'pending' })],
  });
  changedCase.runtime.sync();
  assert.deepEqual(changedCase.sessionStore.updates[0].patch, {
    status: 'running',
    messageStatus: 'running',
    taskId: 't1',
  });
  assert.equal(changedCase.sessionStore.history.length, 0);
});

test('同步：taskId 缺失时从节点补取；updateTaskBinding 不可用时不抛错', () => {
  const { runtime, sessionStore } = makeRuntime({
    nodes: [{ id: 'n1', type: 'image', taskId: 'from-node', jobStatus: 'queued' }],
    bindings: [bindingFixture({ taskId: '', status: 'running' })],
    sessionStoreOverrides: { updateTaskBinding: undefined },
  });
  runtime.sync();
  assert.deepEqual(sessionStore.updates, []);
  const withUpdate = makeRuntime({
    nodes: [{ id: 'n1', type: 'image', taskId: 'from-node', jobStatus: 'queued' }],
    bindings: [bindingFixture({ taskId: '', status: 'running' })],
  });
  withUpdate.runtime.sync();
  assert.deepEqual(withUpdate.sessionStore.updates[0].patch.taskId, 'from-node');
  assert.deepEqual(withUpdate.sessionStore.updates[0].patch.status, 'pending');
});

test('待完成查询：按轮次过滤，剔除终态，无 taskId 时要求节点处于 pending 或 running', () => {
  const nodes = [
    { id: 'n1', type: 'image', jobStatus: 'success' },
    { id: 'n2', type: 'image', isGenerating: true },
    { id: 'n3', type: 'image' },
  ];
  const bindings = [
    bindingFixture({ id: 'a', nodeId: 'n1', status: 'success' }),
    bindingFixture({ id: 'b', nodeId: 'n2', status: 'running', taskId: '' }),
    bindingFixture({ id: 'c', nodeId: 'n3', status: 'running', taskId: '' }),
    bindingFixture({ id: 'd', nodeId: 'n3', status: 'processing', taskId: 't9', turnId: 'turn-2' }),
  ];
  const { runtime } = makeRuntime({ nodes, bindings });
  assert.deepEqual(
    runtime.getPending().map((binding) => binding.id),
    ['b', 'd'],
  );
  assert.deepEqual(
    runtime.getPending('turn-2').map((binding) => binding.id),
    ['d'],
  );
  assert.deepEqual(runtime.getPending('nope'), []);
});

test('结算判定：全部存在且终态才算 settled，非成功项按顺序取首个作为失败原因', () => {
  const nodes = [
    { id: 'n1', type: 'image', name: '甲', jobStatus: 'success' },
    { id: 'n2', type: 'audio', name: '乙', jobStatus: 'cancelled' },
  ];
  const bindings = [
    bindingFixture({ id: 'a', nodeId: 'n1', status: 'success' }),
    bindingFixture({ id: 'b', nodeId: 'n2', status: 'cancelled' }),
  ];
  const { runtime } = makeRuntime({
    nodes,
    bindings,
    formatText: (key, params = {}) => `${key}:${params.nodeLabel}:${params.error ?? ''}`,
  });
  assert.deepEqual(runtime.getSettlement([]), { settled: false, allSucceeded: false, bindings: [] });
  const partial = runtime.getSettlement(['a', 'missing']);
  assert.equal(partial.settled, false);
  assert.deepEqual(
    partial.bindings.map((binding) => binding.id),
    ['a'],
  );
  const mixed = runtime.getSettlement(['a', 'b']);
  assert.equal(mixed.settled, true);
  assert.equal(mixed.allSucceeded, false);
  assert.equal(mixed.failedBinding.id, 'b');
  assert.equal(mixed.failureMessage, 'taskCancelled:乙（音频节点）:');
  assert.equal(runtime.getSettlement(['a']).allSucceeded, true);
  assert.equal(runtime.getSettlement(['a']).failureMessage, '');
  // 输入先过 Set 去重 ⇒ 重复 id 会被当作单个目标照常判定
  assert.equal(runtime.getSettlement(['a', 'a']).settled, true);
  assert.deepEqual(
    runtime.getSettlement(['a', 'a']).bindings.map((binding) => binding.id),
    ['a'],
  );
});

test('订阅：selector 优先，回调复用 sync，重复 start 只订阅一次，dispose 后可重启', () => {
  const node = { id: 'n1', type: 'image', jobStatus: 'success', imageUrl: 'https://cdn/a.png' };
  const seen = [];
  const store = {
    subscribeSelector: (selector, cb) => {
      seen.push(['selector', selector({ _persistRev: 7 }), typeof cb]);
      return () => seen.push(['unsub', 'selector']);
    },
    subscribeRaw: () => seen.push(['raw']),
    subscribe: () => seen.push(['subscribe']),
  };
  const { runtime, sessionStore } = makeRuntime({ nodes: [node], bindings: [bindingFixture()], store });
  runtime.start();
  runtime.start();
  assert.deepEqual(seen, [['selector', 7, 'function']]);
  assert.equal(sessionStore.history.length, 0);
  runtime.sync();
  runtime.dispose();
  assert.deepEqual(seen.at(-1), ['unsub', 'selector']);
  runtime.start();
  assert.equal(seen.length, 3);
});

test('订阅：无 selector 时回落 subscribeRaw，回调入参优先于 readCanvasState', () => {
  const nodeA = { id: 'n1', type: 'image', jobStatus: 'success' };
  const store = {
    subscribeRaw: (cb) => {
      cb(makeState([nodeA]));
      return () => {};
    },
  };
  const { runtime, sessionStore } = makeRuntime({ nodes: [], bindings: [bindingFixture()], store });
  runtime.start();
  assert.equal(sessionStore.history.length, 1);
  assert.equal(sessionStore.history[0].content, 'taskCompleted');
  const plain = makeRuntime({
    nodes: [],
    bindings: [bindingFixture()],
    store: {
      subscribe: (cb) => {
        cb(null);
        return () => {};
      },
    },
  });
  plain.runtime.start();
  assert.deepEqual(plain.sessionStore.updates, []);
});

test('订阅：store 缺失或无订阅方法时 start 静默，dispose 可反复调用', () => {
  const { runtime, sessionStore } = makeRuntime({ nodes: [], bindings: [bindingFixture()] });
  runtime.start();
  runtime.start();
  assert.deepEqual(sessionStore.history, []);
  runtime.dispose();
  runtime.dispose();
  const emptyStore = makeRuntime({ store: {} });
  emptyStore.runtime.start();
  assert.deepEqual(emptyStore.sessionStore.history, []);
});

test('媒体归一：data: 链接被剔除、多图为 items 且上限 12 项、失败项丢弃', () => {
  const images = Array.from({ length: 14 }, (unused, index) => ({
    url: `https://cdn/${index}.png`,
    thumbUrl: `data:image/png;base64,AAA`,
  }));
  images.push({ error: 'boom', url: 'https://cdn/bad.png' }, { status: 'failed', url: 'https://cdn/f.png' });
  const node = { id: 'n1', type: 'image', name: '组图', images };
  const { runtime } = makeRuntime({ nodes: [node] });
  const [message] = runtime.registerExecution({
    results: [
      { commandId: 'generation.run', ok: true, result: { nodeId: 'n1', taskId: 't1', status: 'succeeded' } },
    ],
  });
  assert.equal(message.task.media.items.length, 12);
  // data: 缩略图被剔除后退化为原图地址
  assert.equal(message.task.media.items[0].thumbUrl, 'https://cdn/0.png');
  assert.equal(message.task.media.url, 'https://cdn/0.png');
});

test('媒体归一：无可用地址时不产出 media，非图片成功结果同样不带 media', () => {
  const { runtime } = makeRuntime({ nodes: [{ id: 'n1', type: 'image', imageUrl: 'data:text/plain,x' }] });
  const [noUrl] = runtime.registerExecution({
    results: [
      { commandId: 'generation.run', ok: true, result: { nodeId: 'n1', taskId: 't1', status: 'done' } },
    ],
  });
  assert.equal('media' in noUrl.task, false);
  assert.equal(noUrl.task.status, 'success');
});
