import test from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('./agentSessionEventLog.js');
const {
  normalizeAgentSessionEvent,
  createAgentMessageSessionEvent,
  createAgentRunSessionEvent,
  createAgentOperationSessionEvent,
  createAgentTaskSessionEvent,
  projectAgentSessionEvents,
  compareAgentSessionProjection,
  createAgentSessionEventsFromLegacyState,
} = mod;

const T = 1000;

function messageEvent(overrides = {}) {
  return normalizeAgentSessionEvent(
    {
      id: 'e1',
      conversationId: 'c1',
      type: 'item.completed',
      itemType: 'message',
      status: 'chat',
      ts: T,
      payload: { message: { role: 'user', content: '画一只猫', ts: T } },
      ...overrides,
    },
    { fallbackTs: T },
  );
}

function operation(id, status, extra = {}) {
  return { id, runId: 'r1', commandId: 'cmd', status, startedAt: T, ...extra };
}

function taskBinding(id, status, extra = {}) {
  return { id, nodeId: 'n1', turnId: 'r1', status, ...extra };
}

test('会话事件日志：八个导出（模块命名空间按键名序排列）', () => {
  assert.deepEqual(Object.keys(mod), [
    'compareAgentSessionProjection',
    'createAgentMessageSessionEvent',
    'createAgentOperationSessionEvent',
    'createAgentRunSessionEvent',
    'createAgentSessionEventsFromLegacyState',
    'createAgentTaskSessionEvent',
    'normalizeAgentSessionEvent',
    'projectAgentSessionEvents',
  ]);
});

test('会话事件日志：四类非法输入一律归一为 null', () => {
  assert.equal(normalizeAgentSessionEvent(null), null);
  assert.equal(normalizeAgentSessionEvent([]), null);
  assert.equal(normalizeAgentSessionEvent('x'), null);
  assert.equal(normalizeAgentSessionEvent(undefined), null);
  assert.equal(messageEvent({ id: '  ' }), null);
  assert.equal(messageEvent({ conversationId: '' }), null);
  assert.equal(messageEvent({ type: 'turn.unknown' }), null);
  assert.equal(messageEvent({ itemType: 'unknown' }), null);
});

test('会话事件日志：itemType 缺省走 audit 通道，audit 载荷缺 runEvent 即整条丢弃', () => {
  const bare = normalizeAgentSessionEvent(
    { id: 'e', conversationId: 'c', type: 'audit.recorded', payload: {} },
    { fallbackTs: T },
  );
  assert.equal(bare, null);
  const withRun = normalizeAgentSessionEvent(
    {
      id: 'e',
      conversationId: 'c',
      type: 'audit.recorded',
      payload: { runEvent: { runId: 'r1', type: 'run.status', status: 'planning', ts: T } },
    },
    { fallbackTs: T },
  );
  assert.equal(withRun.itemType, 'audit');
  assert.equal(withRun.payload.runEvent.type, 'run.status');
});

test('会话事件日志：ts 与 seq 只认正有限数，否则取注入的兜底值', () => {
  const bad = normalizeAgentSessionEvent(
    {
      id: 'e',
      conversationId: 'c',
      type: 'turn.updated',
      ts: -5,
      seq: 0,
      payload: { runEvent: { runId: 'r1', type: 'x', status: 'y' } },
    },
    { fallbackTs: 77, fallbackSeq: 9 },
  );
  assert.equal(bad.ts, 77);
  assert.equal(bad.seq, 9);
  assert.equal(bad.payload.runEvent.ts, 77);
  const floaty = normalizeAgentSessionEvent(
    {
      id: 'e',
      conversationId: 'c',
      type: 'turn.updated',
      ts: '12.9',
      seq: '4.7',
      payload: { runEvent: { runId: 'r1', type: 'x', status: 'y' } },
    },
    { fallbackTs: 1, fallbackSeq: 1 },
  );
  assert.equal(floaty.ts, 12.9);
  assert.equal(floaty.seq, 4, 'seq 截断而 ts 只要求有限正数');
});

test('会话事件日志：status 截 80 字符、五个字符串字段一律 trim', () => {
  const event = messageEvent({
    status: 'z'.repeat(100),
    projectId: ' p ',
    turnId: ' t ',
    itemId: ' i ',
  });
  assert.equal(event.status.length, 80);
  assert.deepEqual(
    { projectId: event.projectId, turnId: event.turnId, itemId: event.itemId },
    { projectId: 'p', turnId: 't', itemId: 'i' },
  );
});

test('会话事件日志：消息快照按 content→reply→message→question 取值，正文与状态全空即丢弃', () => {
  const pick = (message) =>
    normalizeAgentSessionEvent(
      { id: 'e', conversationId: 'c', type: 'item.completed', itemType: 'message', payload: { message } },
      { fallbackTs: T },
    );
  assert.equal(pick({}), null);
  assert.deepEqual(
    pick({ reply: 'R' }).payload.message,
    { role: 'assistant', content: 'R', status: '', ts: T },
    'role 缺省 assistant，正文空但状态空仍可保留',
  );
  assert.equal(pick({ message: 'M' }).payload.message.content, 'M');
  assert.equal(pick({ question: 'Q' }).payload.message.content, 'Q');
  assert.equal(pick({ status: ' stopped ' }).payload.message.status, 'stopped');
});

test('会话事件日志：消息快照按角色分叉携带 inputRefs / diagnostic / assistantContext / replyVersions', () => {
  const withMessage = (message) =>
    normalizeAgentSessionEvent(
      {
        id: 'e',
        conversationId: 'c',
        type: 'item.completed',
        itemType: 'message',
        payload: { message },
      },
      { fallbackTs: T },
    ).payload.message;
  const user = withMessage({
    role: 'user',
    content: 'q',
    inputRefs: Array.from({ length: 15 }, (_, i) => 'r' + i),
    diagnostic: { code: 'X' },
    assistantContext: { skillIds: ['s'] },
    replyVersions: { versions: [{ prompt: 'q', reply: 'a' }] },
  });
  assert.equal(user.inputRefs.length, 12);
  assert.equal(user.diagnostic, undefined);
  assert.equal(user.assistantContext, undefined);
  assert.equal(user.replyVersions, undefined);
  const assistant = withMessage({
    role: 'assistant',
    content: 'a',
    inputRefs: ['r1'],
    diagnostic: { code: 'X' },
    assistantContext: { skillIds: ['s', null] },
    replyVersions: { versions: [{ prompt: 'q', reply: 'a', status: 'weird' }] },
  });
  assert.equal(assistant.inputRefs, undefined);
  assert.deepEqual(assistant.diagnostic, { code: 'X' });
  assert.deepEqual(assistant.assistantContext, { skillIds: ['s'] });
  assert.deepEqual(assistant.replyVersions.versions[0].status, 'chat');
});

test('会话事件日志：messageType 只在非 text 时出现并截 40 字符，task 仅随 messageType 落盘', () => {
  const withMessage = (message) =>
    normalizeAgentSessionEvent(
      { id: 'e', conversationId: 'c', type: 'item.completed', itemType: 'message', payload: { message } },
      { fallbackTs: T },
    ).payload.message;
  assert.equal(withMessage({ content: 'a', messageType: 'text' }).messageType, undefined);
  assert.equal(withMessage({ content: 'a', type: 'x'.repeat(60) }).messageType.length, 40);
  assert.deepEqual(withMessage({ content: 'a', messageType: 'plan', task: { id: 'k' } }).task, { id: 'k' });
  assert.equal(withMessage({ content: 'a', task: { id: 'k' } }).task, undefined);
});

test('会话事件日志：tool/task 通道分别要求 operation 与 taskBinding 可归一', () => {
  const build = (itemType, payload) =>
    normalizeAgentSessionEvent(
      { id: 'e', conversationId: 'c', type: 'item.completed', itemType, payload },
      { fallbackTs: T },
    );
  assert.equal(build('tool', { operation: operation('', 'running') }), null);
  assert.equal(
    build('tool', { operation: { id: 'o1', runId: 'r1', status: 'running' } }),
    null,
    '缺 commandId',
  );
  assert.equal(build('tool', { operation: operation('o1', 'running') }).payload.operation.commandId, 'cmd');
  assert.equal(build('task', { taskBinding: taskBinding('b1', 'queued') }).payload.taskBinding.nodeId, 'n1');
  assert.equal(build('task', { taskBinding: { id: 'b1', status: 'queued' } }), null, '缺 nodeId');
  assert.equal(build('approval', {}), null);
});

test('会话事件日志：消息事件把 replyVersions 从载荷里摘出去改为增量', () => {
  const previous = {
    role: 'assistant',
    content: 'v0',
    status: 'chat',
    ts: T,
    replyVersions: { activeIndex: 0, versions: [{ prompt: 'q', reply: 'v0' }] },
  };
  const next = {
    role: 'assistant',
    content: 'v1',
    status: 'chat',
    ts: T,
    replyVersions: {
      activeIndex: 1,
      versions: [
        { prompt: 'q', reply: 'v0' },
        { prompt: 'q', reply: 'v1' },
      ],
    },
  };
  const event = createAgentMessageSessionEvent({
    id: 'e5',
    conversationId: 'c1',
    itemId: 'm1',
    message: next,
    previousMessage: previous,
  });
  assert.equal(event.type, 'item.completed');
  assert.equal(event.payload.message.replyVersions, undefined);
  assert.deepEqual(event.payload.replyVersionChange, {
    activeIndex: 1,
    append: [{ prompt: 'q', reply: 'v1', status: 'chat', assistantContext: { skillIds: [] } }],
  });
  assert.equal(
    createAgentMessageSessionEvent({
      id: 'e',
      conversationId: 'c',
      message: { role: 'assistant', content: 'a', ts: T },
    }).status,
    'completed',
  );
});

test('会话事件日志：运行事件按 run.status 与 approval 三类映射到轮次/条目通道', () => {
  const run = (runEvent) =>
    createAgentRunSessionEvent({ id: 'e', conversationId: 'c', runEvent: { ...runEvent, ts: T } });
  const shape = (event) => ({ type: event.type, itemType: event.itemType, itemId: event.itemId });
  assert.deepEqual(shape(run({ runId: 'r1', type: 'run.status', status: 'planning' })), {
    type: 'turn.started',
    itemType: 'audit',
    itemId: '',
  });
  assert.equal(run({ runId: 'r1', type: 'run.status', status: 'chat' }).type, 'turn.completed');
  assert.equal(run({ runId: 'r1', type: 'run.status', status: 'streaming' }).type, 'turn.updated');
  assert.deepEqual(shape(run({ runId: 'r1', type: 'approval.requested', status: 'pending', step: 2 })), {
    type: 'item.started',
    itemType: 'approval',
    itemId: 'r1:approval:2:plan',
  });
  assert.equal(
    shape(run({ runId: 'r1', type: 'approval.confirmed', status: 'success', commandId: 'cmd' })).itemId,
    'r1:approval:0:cmd',
  );
  assert.deepEqual(shape(run({ runId: 'r1', type: 'tool.started', status: 'running' })), {
    type: 'audit.recorded',
    itemType: 'audit',
    itemId: '',
  });
  assert.equal(run({ runId: 'r1', type: 'run.status', status: '未知状态' }).type, 'turn.updated');
  assert.equal(createAgentRunSessionEvent({ id: 'e', conversationId: 'c', itemId: 'given' }), null);
});

test('会话事件日志：条目生命周期类型三态判定', () => {
  const opType = (status) =>
    createAgentOperationSessionEvent({
      id: 'e',
      conversationId: 'c',
      operation: operation('o1', status),
    }).type;
  assert.equal(opType('completed'), 'item.completed');
  assert.equal(opType('undone'), 'item.completed');
  assert.equal(opType('submitted'), 'item.started');
  assert.equal(opType('processing'), 'item.updated');
  const taskType = (status) =>
    createAgentTaskSessionEvent({
      id: 'e',
      conversationId: 'c',
      taskBinding: taskBinding('b1', status),
    }).type;
  assert.equal(taskType('running'), 'item.started');
  assert.equal(taskType('error'), 'item.completed');
  assert.equal(taskType(''), 'item.updated');
});

test('会话事件日志：operation 与 taskBinding 事件的时间取值优先级', () => {
  assert.equal(
    createAgentOperationSessionEvent({
      id: 'e',
      conversationId: 'c',
      operation: operation('o1', 'running', { completedAt: 555, startedAt: 111 }),
    }).ts,
    555,
  );
  assert.equal(
    createAgentTaskSessionEvent({
      id: 'e',
      conversationId: 'c',
      taskBinding: taskBinding('b1', 'running', { updatedAt: 777, createdAt: 111 }),
    }).ts,
    777,
  );
});

test('会话事件日志：投影按 seq→ts→id 三级排序并回填缺省 seq', () => {
  const events = [
    {
      id: 'b',
      conversationId: 'c',
      type: 'audit.recorded',
      ts: 5,
      payload: { runEvent: { runId: 'r', type: 'x', status: 'y' } },
    },
    {
      id: 'a',
      conversationId: 'c',
      type: 'audit.recorded',
      ts: 5,
      seq: 2,
      payload: { runEvent: { runId: 'r', type: 'x', status: 'y' } },
    },
    {
      id: 'c',
      conversationId: 'c',
      type: 'audit.recorded',
      ts: 1,
      seq: 2,
      payload: { runEvent: { runId: 'r', type: 'x', status: 'y' } },
    },
  ];
  const projection = projectAgentSessionEvents(events);
  assert.deepEqual(
    projection.events.map((event) => [event.id, event.seq]),
    [
      ['b', 1],
      ['c', 2],
      ['a', 2],
    ],
    '缺 seq 时按输入位置回填，故 b 得 1；同为 2 时按 ts 再排',
  );
  assert.deepEqual(
    projection.events.map((event) => event.id),
    ['b', 'c', 'a'],
  );
  assert.deepEqual(projectAgentSessionEvents('nope').events, []);
});

test('会话事件日志：投影聚合 turns/items，条目状态与时间各自推进', () => {
  const events = [
    normalizeAgentSessionEvent(
      {
        id: 'e1',
        seq: 1,
        conversationId: 'c',
        turnId: 'r1',
        itemId: 'i1',
        type: 'turn.started',
        itemType: 'message',
        status: 'planning',
        ts: 10,
        payload: { message: { role: 'user', content: 'q', ts: 10 } },
      },
      { fallbackTs: 10 },
    ),
    normalizeAgentSessionEvent(
      {
        id: 'e2',
        seq: 2,
        conversationId: 'c',
        turnId: 'r1',
        itemId: 'i1',
        type: 'item.completed',
        itemType: 'message',
        status: 'chat',
        ts: 20,
        payload: { message: { role: 'user', content: 'q2', ts: 20 } },
      },
      { fallbackTs: 20 },
    ),
  ];
  const projection = projectAgentSessionEvents(events);
  assert.deepEqual(projection.turns, [
    {
      id: 'r1',
      status: 'chat',
      startedAt: 10,
      updatedAt: 20,
      completedAt: 0,
      itemIds: ['i1'],
    },
  ]);
  assert.deepEqual(projection.items, [
    {
      id: 'i1',
      turnId: 'r1',
      type: 'message',
      status: 'chat',
      startedAt: 10,
      updatedAt: 20,
      completedAt: 20,
    },
  ]);
  assert.deepEqual(
    projection.messages.map((message) => message.content),
    ['q2'],
  );
});

test('会话事件日志：投影把 replyVersionChange 增量累积回消息', () => {
  const base = { role: 'assistant', content: 'v0', status: 'chat', ts: T };
  const first = createAgentMessageSessionEvent({
    id: 'e1',
    seq: 1,
    conversationId: 'c',
    itemId: 'm1',
    message: { ...base, replyVersions: { activeIndex: 0, versions: [{ prompt: 'q', reply: 'v0' }] } },
  });
  const second = createAgentMessageSessionEvent({
    id: 'e2',
    seq: 2,
    conversationId: 'c',
    itemId: 'm1',
    message: {
      ...base,
      content: 'v1',
      replyVersions: {
        activeIndex: 1,
        versions: [
          { prompt: 'q', reply: 'v0' },
          { prompt: 'q', reply: 'v1' },
        ],
      },
    },
    previousMessage: { ...base, replyVersions: { activeIndex: 0, versions: [{ prompt: 'q', reply: 'v0' }] } },
  });
  const projection = projectAgentSessionEvents([first, second]);
  assert.equal(projection.messages.length, 1);
  const versions = projection.messages[0].replyVersions;
  assert.deepEqual(
    versions.versions.map((item) => item.reply),
    ['v0', 'v1'],
  );
  assert.equal(versions.activeIndex, 1);
});

test('会话事件日志：投影分别截 120 条运行事件·120 条操作与 24 条任务绑定', () => {
  const events = [];
  for (let i = 0; i < 130; i += 1) {
    events.push(
      createAgentRunSessionEvent({
        id: 'r' + i,
        seq: i,
        conversationId: 'c',
        runEvent: { runId: 'run', type: 'tool.started', status: 'running', ts: T },
      }),
    );
  }
  for (let i = 0; i < 130; i += 1) {
    events.push(
      createAgentOperationSessionEvent({
        id: 'o' + i,
        seq: 200 + i,
        conversationId: 'c',
        operation: operation('op' + i, 'running'),
      }),
    );
  }
  for (let i = 0; i < 30; i += 1) {
    events.push(
      createAgentTaskSessionEvent({
        id: 't' + i,
        seq: 400 + i,
        conversationId: 'c',
        taskBinding: taskBinding('tb' + i, 'running'),
      }),
    );
  }
  const projection = projectAgentSessionEvents(events);
  assert.equal(projection.runEvents.length, 120);
  assert.equal(projection.runEvents[0].step, 0);
  assert.equal(projection.operationLedger.length, 120);
  assert.equal(projection.operationLedger[0].id, 'op10');
  assert.equal(projection.taskBindings.length, 24);
});

test('会话事件日志：投影返回克隆，改写投影不影响后续读取', () => {
  const events = [messageEvent({ id: 'e', seq: 1, itemId: 'i' })];
  const projection = projectAgentSessionEvents(events);
  projection.events[0].id = 'hacked';
  projection.messages[0].content = 'hacked';
  assert.equal(projectAgentSessionEvents(events).events[0].id, 'e');
});

test('会话事件日志：投影比对四路各自报告不一致项', () => {
  const events = [
    createAgentMessageSessionEvent({
      id: 'e1',
      seq: 1,
      conversationId: 'c',
      itemId: 'm1',
      message: { role: 'assistant', content: 'a', status: 'chat', ts: T },
    }),
    createAgentRunSessionEvent({
      id: 'e2',
      seq: 2,
      conversationId: 'c',
      runEvent: { runId: 'r1', type: 'tool.started', status: 'running', ts: T },
    }),
  ];
  const projection = projectAgentSessionEvents(events);
  assert.deepEqual(
    compareAgentSessionProjection({
      projection,
      messages: projection.messages,
      runEvents: projection.runEvents,
      operationLedger: projection.operationLedger,
      taskBindings: projection.taskBindings,
    }),
    {
      messages: true,
      runEvents: true,
      operationLedger: true,
      taskBindings: true,
      ok: true,
      mismatches: [],
    },
  );
  const drifted = compareAgentSessionProjection({
    projection,
    messages: [...projection.messages, { role: 'user', content: 'extra', ts: T }],
    runEvents: [],
  });
  assert.equal(drifted.ok, false);
  assert.deepEqual(drifted.mismatches, ['messages', 'runEvents']);
  assert.deepEqual(Object.keys(compareAgentSessionProjection({ projection })), [
    'messages',
    'runEvents',
    'operationLedger',
    'taskBindings',
    'ok',
    'mismatches',
  ]);
});

test('会话事件日志：旧状态迁移按四类顺序编号，无效条目仍占号', () => {
  const events = createAgentSessionEventsFromLegacyState({
    conversationId: 'c1',
    projectId: 'p1',
    messages: [{ role: 'assistant', content: 'a', status: 'chat', ts: T }, {}],
    runEvents: [{ runId: 'r1', type: 'run.status', status: 'planning', ts: T }],
    operationLedger: [{ id: '', status: 'running' }],
    taskBindings: [taskBinding('b1', 'running')],
  });
  assert.deepEqual(
    events.map((event) => [event.id, event.seq, event.itemType, event.itemId]),
    [
      ['c1:migrated:message:1', 1, 'message', 'c1:message:1'],
      ['c1:migrated:run:1', 3, 'audit', ''],
      ['c1:migrated:task:1', 5, 'task', 'b1'],
    ],
  );
  assert.deepEqual(createAgentSessionEventsFromLegacyState({ conversationId: 'c' }).length, 0);
});

test('会话事件日志：旧状态迁移遇 null 消息直接抛错，不像投影那样容错', () => {
  assert.throws(
    () =>
      createAgentSessionEventsFromLegacyState({
        conversationId: 'c1',
        messages: [null],
      }),
    TypeError,
  );
});
