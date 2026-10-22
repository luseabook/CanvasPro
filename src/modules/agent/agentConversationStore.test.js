import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentConversationStore, AGENT_CONVERSATION_STORAGE_KEY } from './agentConversationStore.js';
import { createAgentSessionStore } from './agentSessionStore.js';
function createMemoryPersistence(initialState = null) {
  let state = initialState,
    writes = 0,
    flushes = 0;
  return {
    persistence: {
      read: () => (writes === 0 && state === null ? {} : state || {}),
      write: (nextState) => {
        writes += 1;
        state = JSON.parse(JSON.stringify(nextState));
      },
      flush: async () => {
        flushes += 1;
      },
    },
    getState: () => state,
    getWrites: () => writes,
    getFlushes: () => flushes,
  };
}
function createLocalStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    _store: store,
  };
}
let nextId = 0;
function createStore(options = {}) {
  return createAgentConversationStore({
    now: options.now || (() => 1_700_000_000_000 + nextId++),
    idFactory: options.idFactory || (() => 'conv-' + nextId++),
    projectId: options.projectId,
    ...options,
  });
}
test('agent conversation store: 空状态自动建会话并设为活跃', () => {
  const { persistence } = createMemoryPersistence();
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const activeConversation = store.ensureActiveConversation();
  (assert.ok(activeConversation.id),
    assert.equal(activeConversation.projectId, 'proj-a'),
    assert.equal(activeConversation.title, '新对话'),
    assert.deepEqual(activeConversation.messages, []),
    assert.equal(store.getActiveConversationId(), activeConversation.id));
});
test('agent conversation store: preferLatestWithMessages 切到有内容的会话', () => {
  const { persistence, getState } = createMemoryPersistence();
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const emptyConversation = store.ensureActiveConversation();
  store.createConversation({ title: '有内容' });
  const targetConversation = store.ensureActiveConversation();
  store.appendMessage(targetConversation.id, { role: 'user', content: '历史消息' });
  const selected = store.ensureActiveConversation({ preferLatestWithMessages: true });
  (assert.equal(selected.id, targetConversation.id),
    assert.notEqual(selected.id, emptyConversation.id),
    assert.equal(getState().activeByProjectId['proj-a'], targetConversation.id));
});
test('agent conversation store: 追加消息补 itemId、标题与 sessionEvent', () => {
  const { persistence, getState } = createMemoryPersistence();
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const conversation = store.ensureActiveConversation();
  const updated = store.appendMessage(conversation.id, { role: 'user', content: '帮我画一只猫' });
  (assert.equal(updated.messages.length, 1),
    assert.equal(updated.messages[0].itemId, conversation.id + ':message:1'),
    assert.equal(updated.title, '帮我画一只猫'),
    assert.equal(updated.sessionEvents.length, 1),
    assert.equal(updated.sessionEvents[0].seq, 1),
    assert.equal(getState().conversations[0].messages.length, 1));
});
test('agent conversation store: 追加运行事件落 runEvents 与事件流', () => {
  const { persistence } = createMemoryPersistence();
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const conversation = store.ensureActiveConversation();
  const updated = store.appendRunEvent(conversation.id, { runId: 'run-1', type: 'run.started' });
  (assert.equal(updated.runEvents.length, 1),
    assert.equal(updated.runEvents[0].type, 'run.started'),
    assert.equal(updated.sessionEvents.length, 1));
  // 无 type 的事件被忽略，但返回当前快照而非 null。
  const unchanged = store.appendRunEvent(conversation.id, { runId: 'run-1' });
  (assert.equal(unchanged.runEvents.length, 1), assert.equal(unchanged.sessionEvents.length, 1));
  assert.equal(store.appendRunEvent('conv-missing', { type: 'run.started' }), null);
});
test('agent conversation store: 更新未带事件流时按字段差异自动补事件', () => {
  const { persistence } = createMemoryPersistence();
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const conversation = store.ensureActiveConversation();
  store.appendMessage(conversation.id, { role: 'user', content: '第一句' });
  const before = store.getConversation(conversation.id).sessionEvents.length;
  // 改变消息内容 → 补一条 message 事件。
  const updated = store.updateConversation(conversation.id, {
    messages: [{ ...store.getConversation(conversation.id).messages[0], content: '改过的句子' }],
  });
  (assert.equal(updated.sessionEvents.length, before + 1),
    assert.equal(updated.messages[0].content, '改过的句子'));
  // 内容没变 → 不补事件。
  const untouched = store.updateConversation(conversation.id, {
    messages: store.getConversation(conversation.id).messages,
  });
  assert.equal(untouched.sessionEvents.length, updated.sessionEvents.length);
  // 显式传空事件流：会被当作「老数据」，从消息历史重建等价事件（上游语义）。
  const rebuilt = store.updateConversation(conversation.id, { sessionEvents: [] });
  assert.equal(rebuilt.sessionEvents.length, 1);
});
test('agent conversation store: 老 schema 数据迁移补出事件流与待澄清', () => {
  const legacyState = {
    schemaVersion: 1,
    activeByProjectId: { 'proj-a': 'legacy-1' },
    conversations: [
      {
        id: 'legacy-1',
        projectId: 'proj-a',
        title: '旧会话',
        createdAt: 1,
        updatedAt: 2,
        messages: [
          { role: 'user', content: '做个视频' },
          { role: 'assistant', content: '你要几秒？', status: 'need_clarification' },
        ],
      },
    ],
  };
  const { persistence } = createMemoryPersistence(legacyState);
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const conversation = store.ensureActiveConversation();
  (assert.ok(conversation.sessionEvents.length > 0),
    assert.equal(conversation.messages.length, 2),
    // 没有 pendingClarification 字段时从消息历史推断出来。
    assert.equal(conversation.pendingClarification.question, '你要几秒？'),
    assert.equal(conversation.pendingClarification.originalMessage, '做个视频'),
    assert.deepEqual(conversation.operationLedger, []));
});
test('agent conversation store: 持久化注入的 write/flush 都被调用', async () => {
  const { persistence, getWrites, getFlushes } = createMemoryPersistence();
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const conversation = store.ensureActiveConversation();
  store.appendMessage(conversation.id, { role: 'user', content: '写一条' });
  (assert.ok(getWrites() > 0), assert.equal(getFlushes(), 0));
  await store.flushPersistence();
  assert.equal(getFlushes(), 1);
});
test('agent conversation store: 存储失败后暴露错误并可重试恢复', () => {
  const localStorage = createLocalStorage();
  let failWrites = true;
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = (key, value) => {
    if (failWrites) throw new Error('QuotaExceededError');
    originalSetItem(key, value);
  };
  const store = createStore({ windowObject: { localStorage: localStorage } });
  // 首次写入失败：内容留在内存，错误信息对外可见。
  const conversation = store.ensureActiveConversation();
  store.appendMessage(conversation.id, { role: 'user', content: '配额满了' });
  assert.match(store.getPersistenceError(), /暂存于内存/);
  (failWrites = false), assert.equal(store.retryPersistence(), true);
  (assert.equal(store.getPersistenceError(), ''),
    assert.ok(localStorage._store.get(AGENT_CONVERSATION_STORAGE_KEY)));
});
test('agent conversation store: 关键写入失败时抛错而不是静默丢数据', () => {
  const localStorage = createLocalStorage();
  localStorage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  const store = createStore({ windowObject: { localStorage: localStorage } });
  const conversation = store.ensureActiveConversation();
  // 带 replyVersions 的消息属于关键写入，必须要求写成功。
  assert.throws(
    () =>
      store.updateConversation(conversation.id, {
        messages: [
          {
            role: 'assistant',
            content: '版本化回复',
            replyVersions: [{ id: 'v1', content: '版本化回复' }],
          },
        ],
      }),
    /存储空间不足或不可用/,
  );
});
test('agent conversation store: 删除会话后回落到剩余会话', () => {
  const { persistence } = createMemoryPersistence();
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const firstConversation = store.ensureActiveConversation();
  const secondConversation = store.createConversation({ title: '第二个' });
  const fallbackConversation = store.deleteConversation(secondConversation.id);
  (assert.notEqual(fallbackConversation.id, secondConversation.id),
    assert.equal(store.getConversation(secondConversation.id), null),
    // 空 id 删除等价于「确保有活跃会话」。
    assert.ok(store.deleteConversation('').id));
  assert.notEqual(firstConversation.id, undefined);
});
test('agent conversation store: 跨项目会话不能设为活跃', () => {
  const { persistence } = createMemoryPersistence({
    activeByProjectId: {},
    conversations: [
      {
        id: 'other-project-conv',
        projectId: 'proj-b',
        title: '别人的会话',
        createdAt: 1,
        updatedAt: 1,
        messages: [],
      },
    ],
  });
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  assert.equal(store.setActiveConversationId('other-project-conv'), null);
  assert.equal(store.getConversation('other-project-conv').projectId, 'proj-b');
});
test('agent conversation store: 归档会话不出现在列表且不会被自动选中', () => {
  const { persistence } = createMemoryPersistence({
    activeByProjectId: {},
    conversations: [
      {
        id: 'archived-conv',
        projectId: 'proj-a',
        title: '已归档',
        archived: true,
        createdAt: 1,
        updatedAt: 9,
        messages: [{ role: 'user', content: '旧内容' }],
      },
    ],
  });
  const store = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  (assert.equal(store.listConversations().length, 0),
    assert.notEqual(store.ensureActiveConversation().id, 'archived-conv'));
});
test('agent conversation store: 与 session store 联通后事件流闭合', () => {
  const { persistence, getState } = createMemoryPersistence();
  const conversationStore = createStore({ persistence: persistence, getProjectId: () => 'proj-a' });
  const sessionStore = createAgentSessionStore({ conversationStore: conversationStore });
  const conversation = conversationStore.ensureActiveConversation();
  sessionStore.setCurrentRun({ id: 'run-1', status: 'running', step: 1 });
  sessionStore.recordRunEvent({ runId: 'run-1', type: 'tool.completed', commandId: 'canvas.addNode' });
  const persistedConversation = getState().conversations.find(
    (entry) => entry.id === conversation.id,
  );
  // 运行事件必须真的落进会话的事件流，而不是只活在 session store 内存里。
  (assert.ok(persistedConversation.runEvents.length >= 1),
    assert.ok(
      persistedConversation.sessionEvents.some(
        (sessionEvent) => sessionEvent.payload?.runEvent?.type === 'tool.completed',
      ),
    ),
    assert.equal(sessionStore.getRunEvents({ runId: 'run-1' }).length >= 1, true));
  const parity = sessionStore.getState().sessionProjectionParity;
  assert.equal(parity.ok, true, '投影与内存态应完全一致：' + parity.mismatches.join(','));
});
