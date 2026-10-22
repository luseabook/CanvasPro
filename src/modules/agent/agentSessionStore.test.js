import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentSessionStore } from './agentSessionStore.js';
function createConversation(overrides = {}) {
  return {
    id: 'conv-1',
    projectId: 'proj-1',
    title: '新对话',
    messages: [],
    runEvents: [],
    sessionEvents: [],
    operationLedger: [],
    taskBindings: [],
    ...overrides,
  };
}
// 最小会话仓库：只实现 sessionStore 会调用到的那几个入口，可注入失败/旁路行为。
function createConversationStore(initial = {}) {
  const conversations = new Map([['conv-1', createConversation(initial)]]);
  let activeId = 'conv-1',
    appendRunEventCalls = 0,
    flushCalls = 0;
  const store = {
    getPersistenceError: () => '',
    retryPersistence: () => true,
    listConversations: () => [...conversations.values()],
    getConversation: (id) => (conversations.has(id) ? conversations.get(id) : null),
    createConversation: () => {
      const created = createConversation({ id: 'conv-new', messages: [] });
      return (conversations.set(created.id, created), (activeId = created.id), created);
    },
    updateConversation: (id, patch) => {
      const current = conversations.get(id);
      if (!current) return null;
      const updated = { ...current, ...patch };
      return (conversations.set(id, updated), updated);
    },
    appendMessage: (id, message) => {
      const current = conversations.get(id);
      if (!current) return null;
      const updated = { ...current, messages: [...current.messages, message] };
      return (conversations.set(id, updated), updated);
    },
    appendRunEvent: (id, runEvent) => {
      appendRunEventCalls += 1;
      const current = conversations.get(id);
      if (!current) return null;
      const updated = {
        ...current,
        runEvents: [...current.runEvents, runEvent],
        sessionEvents: [
          ...current.sessionEvents,
          {
            id: id + ':event:' + (current.sessionEvents.length + 1),
            seq: current.sessionEvents.length + 1,
            conversationId: id,
            projectId: current.projectId,
            type: 'run.event',
            ts: runEvent.ts,
            runEvent: runEvent,
          },
        ],
      };
      return (conversations.set(id, updated), updated);
    },
    deleteConversation: (id) => {
      conversations.delete(id);
      return conversations.get('conv-1') || null;
    },
    setActiveConversationId: (id) => {
      if (!conversations.has(id)) return null;
      return ((activeId = id), conversations.get(id));
    },
    getActiveConversationId: () => activeId,
    ensureActiveConversation: () => conversations.get(activeId) || null,
    flushPersistence: async () => {
      flushCalls += 1;
    },
  };
  return {
    store: store,
    conversations: conversations,
    getAppendRunEventCalls: () => appendRunEventCalls,
    getFlushCalls: () => flushCalls,
  };
}
test('agent session store: subscribe 立即回调一次并提供退订', () => {
  const { store } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  const received = [];
  const unsubscribe = sessionStore.subscribe((snapshot, meta) => received.push({ snapshot, meta }));
  assert.equal(received.length, 1);
  assert.equal(received[0].snapshot, null);
  assert.equal(received[0].meta.type, 'init');
  sessionStore.pushHistory({ role: 'user', content: '你好' });
  assert.equal(received.length, 2);
  assert.equal(received[1].meta.type, 'history');
  (unsubscribe(), sessionStore.pushHistory({ role: 'user', content: '再来一次' }));
  assert.equal(received.length, 2);
  assert.throws(() => sessionStore.subscribe(null), TypeError);
});
test('agent session store: 无活跃会话时消息落为 session 事件并递增 seq', () => {
  const sessionStore = createAgentSessionStore({ conversationStore: null });
  (sessionStore.pushHistory({ role: 'user', content: '第一条', itemId: 'item-1' }),
    sessionStore.pushHistory({ role: 'assistant', content: '第二条', itemId: 'item-2' }));
  const sessionEvents = sessionStore.getSessionEvents();
  (assert.equal(sessionEvents.length, 2),
    assert.equal(sessionEvents[0].seq, 1),
    assert.equal(sessionEvents[1].seq, 2),
    assert.equal(sessionEvents[0].conversationId, 'in-memory'),
    assert.equal(sessionStore.getHistory().length, 2));
  // 投影应能还原出两条消息，且与内存态一致。
  assert.equal(sessionStore.getSessionProjection().messages.length, 2);
  assert.equal(sessionStore.getState().sessionProjectionParity.messages, true);
});
test('agent session store: 运行事件经会话仓库落盘后同步事件流', () => {
  const { store, getAppendRunEventCalls } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  const recorded = sessionStore.recordRunEvent({ runId: 'run-1', type: 'run.started', step: 1 });
  (assert.equal(recorded.type, 'run.started'),
    assert.equal(recorded.conversationId, 'conv-1'),
    assert.equal(recorded.projectId, 'proj-1'),
    assert.equal(getAppendRunEventCalls(), 1),
    assert.equal(sessionStore.getRunEvents({ runId: 'run-1' }).length, 1),
    assert.equal(sessionStore.getSessionEvents().length, 1),
    // 空 type 不落事件。
    assert.equal(sessionStore.recordRunEvent({ runId: 'run-1' }), null));
  assert.equal(sessionStore.replayRun('run-1').events.length, 1);
});
test('agent session store: 运行事件按上限截断', () => {
  const sessionStore = createAgentSessionStore({ conversationStore: null, runEventLimit: 3 });
  for (let index = 0; index < 5; index += 1)
    sessionStore.recordRunEvent({ runId: 'run-x', type: 'step', step: index });
  const runEvents = sessionStore.getRunEvents();
  (assert.equal(runEvents.length, 3), assert.deepEqual(runEvents.map((event) => event.step), [2, 3, 4]));
});
test('agent session store: trace 事件转运行事件且技能注入去重', () => {
  const { store } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  sessionStore.setCurrentRun({ id: 'run-2', status: 'running', step: 2 });
  sessionStore.recordTrace({ type: 'agent_loop_tool_result', commandId: 'canvas.addNode', ok: true });
  const toolEvents = sessionStore.getRunEvents().filter((event) => event.type === 'tool.completed');
  assert.equal(toolEvents.length, 1);
  assert.equal(toolEvents[0].commandId, 'canvas.addNode');
  assert.equal(toolEvents[0].ok, true);
  // 同一 run 内相同技能快照只记一次。
  const skillTrace = {
    type: 'agent_skill_context_injected',
    channel: 'system',
    skillIds: ['skill-1'],
    skills: [{ id: 'skill-1', name: 'Skill One' }],
  };
  (sessionStore.recordTrace(skillTrace), sessionStore.recordTrace(skillTrace));
  assert.equal(
    sessionStore.getRunEvents().filter((event) => event.type === 'skill.injected').length,
    1,
  );
  // 无当前运行时直接忽略技能注入。
  sessionStore.setCurrentRun(null);
  sessionStore.recordTrace(skillTrace);
  assert.equal(
    sessionStore.getRunEvents().filter((event) => event.type === 'skill.injected').length,
    1,
  );
});
test('agent session store: 操作账本合并同 id 并限制在 120 条', () => {
  const { store } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  const first = sessionStore.upsertOperation({
    id: 'op-1',
    runId: 'run-1',
    commandId: 'generation.run',
    status: 'running',
    conversationId: 'conv-1',
  });
  assert.equal(first.id, 'op-1');
  const merged = sessionStore.upsertOperation({
    id: 'op-1',
    runId: 'run-1',
    commandId: 'generation.run',
    status: 'done',
  });
  (assert.equal(merged.status, 'done'), assert.equal(sessionStore.getOperationLedger().length, 1));
  for (let index = 0; index < 130; index += 1)
    sessionStore.upsertOperation({
      id: 'op-bulk-' + index,
      runId: 'run-1',
      commandId: 'generation.run',
      status: 'running',
    });
  assert.equal(sessionStore.getOperationLedger().length, 120);
});
test('agent session store: 跨会话操作只更新既有条目，不新建', () => {
  const { store, conversations } = createConversationStore();
  conversations.set('conv-2', createConversation({ id: 'conv-2', operationLedger: [] }));
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  // 目标会话没有该操作 → 拒绝。
  assert.equal(
    sessionStore.upsertOperation({
      id: 'op-x',
      runId: 'run-1',
      commandId: 'generation.run',
      conversationId: 'conv-2',
    }),
    null,
  );
  conversations
    .get('conv-2')
    .operationLedger.push({ id: 'op-x', runId: 'run-1', commandId: 'generation.run', status: 'running' });
  const updated = sessionStore.upsertOperation({
    id: 'op-x',
    runId: 'run-1',
    commandId: 'generation.run',
    conversationId: 'conv-2',
    status: 'done',
  });
  (assert.equal(updated.status, 'done'),
    assert.equal(conversations.get('conv-2').operationLedger[0].status, 'done'));
});
test('agent session store: 待确认计划与运行状态都留下运行事件', () => {
  const { store } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  (sessionStore.setCurrentRun({ id: 'run-3', status: 'running', step: 1 }),
    sessionStore.setPendingPlan({ steps: ['a'] }));
  const types = sessionStore.getRunEvents().map((event) => event.type);
  (assert.ok(types.includes('run.status')), assert.ok(types.includes('approval.requested')));
  const stopped = sessionStore.stopCurrentRun();
  (assert.equal(stopped.status, 'stopped'),
    assert.equal(
      sessionStore.getRunEvents().filter((event) => event.status === 'stopped').length,
      1,
    ));
});
test('agent session store: 待澄清与续跑检查点持久化到会话', () => {
  const { store, conversations } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  (sessionStore.setPendingClarification({ question: '要哪个模型？' }),
    assert.deepEqual(conversations.get('conv-1').pendingClarification, { question: '要哪个模型？' }),
    sessionStore.clearPendingClarification(),
    assert.equal(conversations.get('conv-1').pendingClarification, null));
  (sessionStore.setPendingLoopRun({ turnId: 'turn-1', pendingSteps: 2 }),
    assert.equal(sessionStore.getPendingLoopRun().pendingSteps, 2),
    assert.equal(conversations.get('conv-1').resumeCheckpoint.pendingSteps, 2),
    sessionStore.clearPendingLoopRun(),
    assert.equal(conversations.get('conv-1').resumeCheckpoint, null));
});
test('agent session store: 消息原位替换要求同会话且长度一致', () => {
  const { store } = createConversationStore({ messages: [{ role: 'user', content: '原始' }] });
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  assert.equal(
    sessionStore.replaceConversationMessages([{ role: 'user', content: '改' }], {
      conversationId: 'conv-other',
    }),
    false,
  );
  assert.equal(
    sessionStore.replaceConversationMessages([{ role: 'user', content: '改' }], {
      conversationId: 'conv-1',
    }),
    true,
  );
  assert.equal(sessionStore.getHistory()[0].content, '改');
  assert.equal(
    sessionStore.replaceConversationMessages(
      [
        { role: 'user', content: 'a' },
        { role: 'user', content: 'b' },
      ],
      { conversationId: 'conv-1' },
    ),
    false,
  );
});
test('agent session store: 任务绑定合并、更新与 getState 快照', () => {
  const { store } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  const created = sessionStore.upsertTaskBinding({
    id: 'bind-1',
    nodeId: 'node-1',
    status: 'running',
  });
  (assert.equal(created.id, 'bind-1'), assert.equal(created.commandId, 'generation.run'));
  const upserted = sessionStore.upsertTaskBindings([
    { id: 'bind-1', nodeId: 'node-1', status: 'done' },
    { id: 'bind-2', nodeId: 'node-2', status: 'running' },
  ]);
  (assert.equal(upserted.length, 2),
    assert.equal(sessionStore.getTaskBindings().length, 2),
    assert.equal(sessionStore.getTaskBindings()[0].status, 'done'));
  const patched = sessionStore.updateTaskBinding('bind-2', { notifiedTerminal: true });
  (assert.equal(patched.notifiedTerminal, true),
    assert.equal(sessionStore.updateTaskBinding('bind-missing', {}), null));
  // 缺 id 或 nodeId 的绑定被丢弃。
  assert.deepEqual(sessionStore.upsertTaskBindings([{ id: '', nodeId: 'node-3' }]), []);
  const snapshot = sessionStore.getState();
  (assert.equal(snapshot.taskBindings.length, 2),
    assert.equal(snapshot.contextDigest, null),
    assert.equal(typeof snapshot.sessionProjectionParity.ok, 'boolean'));
});
test('agent session store: 上下文摘要读写走会话持久化', () => {
  const { store, conversations } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  const written = sessionStore.setContextDigest({ turns: 2 }, { conversationId: 'conv-1' });
  (assert.deepEqual(written, { turns: 2 }),
    assert.deepEqual(conversations.get('conv-1').contextDigest, { turns: 2 }),
    assert.deepEqual(sessionStore.getContextDigest(), { turns: 2 }));
  // 写其它会话时不动当前内存态。
  conversations.set('conv-2', createConversation({ id: 'conv-2' }));
  sessionStore.setContextDigest({ turns: 9 }, { conversationId: 'conv-2' });
  assert.deepEqual(sessionStore.getContextDigest(), { turns: 2 });
});
test('agent session store: 无会话仓库时上下文摘要只留在内存态', () => {
  const sessionStore = createAgentSessionStore({ conversationStore: null });
  (assert.deepEqual(sessionStore.setContextDigest({ turns: 1 }), { turns: 1 }),
    assert.deepEqual(sessionStore.getContextDigest(), { turns: 1 }));
});
test('agent session store: isConversationLoaded 只在指纹匹配时为真', () => {
  const { store } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  (assert.equal(sessionStore.isConversationLoaded('conv-1'), true),
    assert.equal(sessionStore.isConversationLoaded('conv-other'), false));
  sessionStore.switchConversation('conv-1');
  assert.equal(sessionStore.isConversationLoaded('conv-1'), true);
});
test('agent session store: 助手流订阅与退订', () => {
  const sessionStore = createAgentSessionStore({ conversationStore: null });
  const chunks = [];
  const unsubscribe = sessionStore.subscribeAssistantStream((chunk) => chunks.push(chunk));
  (sessionStore.emitAssistantStream({ delta: 'a' }),
    sessionStore.emitAssistantStream({ delta: 'b' }),
    assert.equal(chunks.length, 2),
    unsubscribe(),
    sessionStore.emitAssistantStream({ delta: 'c' }),
    assert.equal(chunks.length, 2));
});
test('agent session store: setAssistantTextTask 无持久化时抛错，有则落盘并刷新', async () => {
  const bare = createAgentSessionStore({ conversationStore: null });
  await assert.rejects(() => bare.setAssistantTextTask({ id: 'task-1' }), /缺少持久化存储/);
  const { store, conversations, getFlushCalls } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  await sessionStore.setAssistantTextTask({ id: 'task-2' });
  (assert.deepEqual(conversations.get('conv-1').assistantTextTask, { id: 'task-2' }),
    assert.equal(getFlushCalls(), 1),
    assert.deepEqual(sessionStore.getAssistantTextTask(), { id: 'task-2' }));
});
test('agent session store: 切会话清空运行时但保留事件流', () => {
  const { store } = createConversationStore();
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  (sessionStore.recordCommand({ commandId: 'cmd-1', result: { ok: true } }),
    sessionStore.setCurrentRun({ id: 'run-9', status: 'running' }),
    sessionStore.setPendingPlan({ steps: ['x'] }));
  sessionStore.startNewConversation();
  const snapshot = sessionStore.getState();
  (assert.equal(snapshot.recentCommands.length, 0),
    assert.equal(snapshot.currentRun, null),
    assert.equal(snapshot.pendingPlan, null),
    assert.equal(sessionStore.getActiveConversation().id, 'conv-new'));
});
test('agent session store: 删除非当前会话不动运行时状态', () => {
  const { store, conversations } = createConversationStore();
  conversations.set('conv-2', createConversation({ id: 'conv-2' }));
  const sessionStore = createAgentSessionStore({ conversationStore: store });
  (sessionStore.recordCommand({ commandId: 'cmd-keep', result: { ok: true } }),
    sessionStore.deleteConversation('conv-2'));
  assert.equal(sessionStore.getRecentCommands().length, 1);
});
