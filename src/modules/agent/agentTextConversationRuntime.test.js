import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentTextConversationRuntime } from './agentTextConversationRuntime.js';

function deferred() {
  let resolve;
  const promise = new Promise((fn) => (resolve = fn));
  return { promise, resolve };
}

function makeStore(over = {}) {
  let seq = 0;
  const store = {
    history: [],
    run: null,
    runStates: [],
    events: [],
    stops: 0,
    switches: [],
    deletes: [],
    news: 0,
    activeId: over.activeId || 'c1',
    conversations: over.conversations || [{ id: 'c1' }, { id: 'c2' }],
    getHistory: () => store.history,
    getActiveConversation: () => store.conversations.find((entry) => entry.id === store.activeId) || null,
    getCurrentRun: () => store.run,
    setCurrentRun: (run) => ((store.run = run), store.runStates.push(run.status), true),
    stopCurrentRun: () => (
      store.stops++,
      (store.run = { id: store.run?.id, status: 'stopped', stopped: true }),
      true
    ),
    emitAssistantStream: (event) => store.events.push(event.type),
    pushHistory: (entry) => (store.history.push({ ...entry, itemId: 'm' + ++seq }), store.history.at(-1)),
    replaceConversationMessages: (list) => (
      (store.history.length = 0),
      store.history.push(...list.map((entry) => ({ ...entry }))),
      true
    ),
    isConversationLoaded: () => true,
    listConversations: () => store.conversations,
    startNewConversation: () => ({ started: ++store.news }),
    switchConversation: (id) => ((store.activeId = id), { switched: id }),
    deleteConversation: (id) => ({ deleted: id }),
    recordTrace: () => {},
    setHistory: (list) => (store.history = list),
  };
  return store;
}

function make(over = {}) {
  const sessionStore = over.sessionStore || makeStore(over);
  const seen = [];
  const gate = over.gate || null;
  const replyFor = (input) => {
    if (typeof over.reply === 'function') return over.reply(input);
    if (over.reply && typeof over.reply === 'object') return over.reply;
    return { reply: 'reply' in over ? over.reply : '好的' };
  };
  const assistant =
    over.assistant ||
    (async (input) => {
      seen.push(input);
      if (over.streamOn === seen.length) {
        input.onText('已经写了一半');
        over.streamed?.resolve();
      }
      if (gate && seen.length === (over.gateAt || 1)) await gate.promise;
      if (input.message === 'boom' || over.throwOnAny) throw over.error || new Error('模型不可用');
      return replyFor(input);
    });
  let contexts = 0;
  const runtime = createAgentTextConversationRuntime({
    sessionStore,
    assistant,
    getContext: over.getContext || (() => ({ nodes: ++contexts, canvas: 'demo' })),
  });
  return { runtime, sessionStore, seen, gate };
}

const CHOICE_REPLY = {
  reply: '要哪种风格',
  choice: {
    question: '要哪种风格',
    options: [
      { id: 'bright', label: '明亮' },
      { id: 'dark', label: '暗黑' },
    ],
  },
};

test('文本对话运行时：对外只暴露固定 13 个键', () => {
  const { runtime, sessionStore } = make();
  assert.deepEqual(Object.keys(runtime), [
    'sessionStore',
    'handleUserMessage',
    'stop',
    'getPendingAssistantChoice',
    'answerAssistantChoice',
    'reviseAssistantTurn',
    'selectAssistantVersion',
    'listConversations',
    'getActiveConversation',
    'startNewConversation',
    'switchConversation',
    'deleteConversation',
    'dispose',
  ]);
  assert.equal(runtime.sessionStore, sessionStore);
});

test('文本对话运行时：正常发送会写入用户消息并把运行状态从 planning 推进到 chat', async () => {
  const { runtime, sessionStore } = make();
  const result = await runtime.handleUserMessage('画一只猫');
  assert.deepEqual(result, {
    ok: true,
    status: 'chat',
    reply: '好的',
    assistantHandled: true,
    responseChannel: 'assistant.message',
  });
  assert.deepEqual(
    sessionStore.history.map((entry) => [entry.role, entry.status]),
    [
      ['user', undefined],
      ['assistant', 'chat'],
    ],
  );
  assert.equal(sessionStore.run.id, 'agent-text-1');
  assert.deepEqual(sessionStore.runStates, ['planning', 'chat']);
  assert.deepEqual(sessionStore.events, ['start', 'end']);
});

test('文本对话运行时：回复器入参按固定顺序组装，context 取自注入器、history 回退会话历史', async () => {
  const { runtime, seen, sessionStore } = make();
  await runtime.handleUserMessage('画一只猫');
  const input = seen[0];
  assert.deepEqual(Object.keys(input), [
    'externalInformation',
    'signal',
    'onSkillsSelected',
    'onText',
    'message',
    'context',
    'history',
  ]);
  assert.equal(input.message, '画一只猫');
  assert.deepEqual(input.context, { nodes: 1, canvas: 'demo' });
  assert.equal(input.history, sessionStore.history);
  assert.deepEqual(
    input.history.map((entry) => [entry.role, entry.content]),
    [
      ['user', '画一只猫'],
      ['assistant', '好的'],
    ],
  );
  assert.equal(input.externalInformation, null);
  assert.equal(input.signal.constructor.name, 'AbortSignal');
  assert.equal(input.signal.aborted, false);
  assert.equal(typeof input.onSkillsSelected, 'function');
  assert.equal(typeof input.onText, 'function');
});

test('文本对话运行时：runId 只在真正开跑时递增，空消息不占用序号', async () => {
  const { runtime, sessionStore } = make();
  assert.deepEqual(await runtime.handleUserMessage('   '), {
    ok: false,
    status: 'failed',
    reply: '请输入创作要求',
  });
  assert.deepEqual(sessionStore.history, []);
  assert.equal(sessionStore.run, null);
  const result = await runtime.handleUserMessage('第一');
  assert.equal(sessionStore.run.id, 'agent-text-1');
  assert.equal(result.reply, '好的');
  await runtime.handleUserMessage('第二');
  assert.equal(sessionStore.run.id, 'agent-text-2');
});

test('文本对话运行时：上一轮仍在 planning 时拒绝并发发送', async () => {
  const gate = deferred();
  const { runtime, sessionStore } = make({ gate });
  const first = runtime.handleUserMessage('慢请求');
  assert.equal(sessionStore.run.status, 'planning');
  assert.deepEqual(await runtime.handleUserMessage('再来一条'), {
    ok: false,
    status: 'failed',
    reply: '请等待当前回复或先停止',
  });
  gate.resolve();
  await first;
  assert.equal(sessionStore.history.filter((entry) => entry.role === 'user').length, 1);
});

test('文本对话运行时：无在途运行时 stop 只回固定话术且不写历史', async () => {
  const { runtime, sessionStore } = make();
  assert.deepEqual(await runtime.stop(), { ok: true, status: 'stopped', reply: '已停止生成' });
  assert.equal(sessionStore.stops, 1);
  assert.deepEqual(sessionStore.history, []);
});

test('文本对话运行时：停止在途请求会把已生成部分按 stopped 落盘，原请求以 stale 收尾', async () => {
  const gate = deferred();
  const { runtime, sessionStore } = make({ gate });
  const first = runtime.handleUserMessage('画一只猫');
  const stopped = await runtime.stop();
  assert.deepEqual(stopped, { ok: true, status: 'stopped', reply: '已停止生成' });
  assert.deepEqual(sessionStore.history.at(-1), {
    role: 'assistant',
    status: 'stopped',
    content: '已停止生成',
    assistantContext: { skillIds: [] },
    itemId: 'm2',
  });
  assert.equal(sessionStore.run.status, 'stopped');
  gate.resolve();
  assert.deepEqual(await first, {
    ok: true,
    status: 'stopped',
    reply: '已停止生成',
    assistantHandled: true,
    stale: true,
  });
  assert.deepEqual(sessionStore.events, ['start', 'end']);
});

test('文本对话运行时：停止在途修订时把内部异常透传为 notice 且不落半成品', async () => {
  const gate = deferred();
  const streamed = deferred();
  const { runtime, sessionStore } = make({
    gate,
    gateAt: 2,
    streamOn: 2,
    streamed,
    reply: (input) => ({ reply: input.message === '原问题' ? '原回答' : '新回答' }),
  });
  await runtime.handleUserMessage('原问题');
  const revising = runtime.reviseAssistantTurn({ itemId: 'm2', message: '换个说法' });
  await streamed.promise;
  sessionStore.setHistory([{ role: 'user', content: '插队消息', itemId: 'm9' }]);
  const stopped = await runtime.stop();
  assert.equal(stopped.reply, '已停止生成');
  assert.equal(stopped.notice, '对话内容已变化，请重新发送消息');
  assert.deepEqual(sessionStore.history, [{ role: 'user', content: '插队消息', itemId: 'm9' }]);
  assert.deepEqual(stopped, {
    ok: true,
    status: 'stopped',
    reply: '已停止生成',
    notice: '对话内容已变化，请重新发送消息',
  });
  gate.resolve();
  assert.deepEqual(await revising, {
    ok: true,
    status: 'stopped',
    reply: '已停止生成',
    assistantHandled: true,
    stale: true,
  });
});

test('文本对话运行时：修订轮会复用管线并追加回答版本', async () => {
  const { runtime, sessionStore, seen } = make({
    reply: (input) => ({ reply: input.message === '原问题' ? '原回答' : '新回答' }),
  });
  await runtime.handleUserMessage('原问题');
  const result = await runtime.reviseAssistantTurn({ itemId: 'm2', message: '换个说法' });
  assert.equal(result.reply, '新回答');
  assert.equal(sessionStore.run.id, 'agent-text-2');
  assert.deepEqual(
    seen[1].history.map((entry) => entry.content),
    ['换个说法'],
  );
  assert.notEqual(seen[1].history, sessionStore.history);
  assert.equal(seen[1].assistantChoice, true);
  const assistantMessage = sessionStore.history.at(-1);
  assert.equal(assistantMessage.content, '新回答');
  assert.equal(assistantMessage.replyVersions.activeIndex, 1);
  assert.deepEqual(
    assistantMessage.replyVersions.versions.map((entry) => entry.prompt),
    ['原问题', '换个说法'],
  );
});

test('文本对话运行时：修订入参缺 itemId 或空文案时按文本层话术失败', async () => {
  const { runtime } = make({ reply: '原回答' });
  await runtime.handleUserMessage('原问题');
  assert.deepEqual(await runtime.reviseAssistantTurn({ itemId: 'other', message: 'x' }), {
    ok: false,
    status: 'failed',
    reply: '当前对话已变化，请重新发送',
  });
  assert.deepEqual(await runtime.reviseAssistantTurn({ itemId: 'm2', message: '  ' }), {
    ok: false,
    status: 'failed',
    reply: '请输入创作要求',
  });
});

test('文本对话运行时：选择项回答会把用户消息再推一轮，且忽略第二参 meta', async () => {
  const { runtime, sessionStore, seen } = make({
    reply: (input) => (input.message === '帮我起标题' ? CHOICE_REPLY : { reply: '明亮风格' }),
  });
  await runtime.handleUserMessage('帮我起标题');
  const pending = runtime.getPendingAssistantChoice();
  assert.equal(pending.questionId, 'm2:0');
  assert.deepEqual(
    pending.options.map((entry) => entry.id),
    ['bright', 'dark'],
  );
  const result = await runtime.answerAssistantChoice('bright', { questionId: 'm2:0' });
  assert.equal(result.reply, '明亮风格');
  assert.equal(sessionStore.run.id, 'agent-text-2');
  assert.deepEqual(Object.keys(seen[1]), Object.keys(seen[0]));
  assert.equal(seen[1].message, '明亮');
  assert.equal(seen[1].context.nodes, 2);
  assert.equal(seen[1].history, sessionStore.history);
  assert.deepEqual(
    sessionStore.history.map((entry) => entry.role),
    ['user', 'assistant', 'user', 'assistant'],
  );
  assert.equal(seen[1].assistantChoice, undefined);
});

test('文本对话运行时：无待选项时 answerAssistantChoice 走文本层兜底话术', async () => {
  const { runtime } = make();
  assert.deepEqual(await runtime.answerAssistantChoice('bright', { questionId: 'x' }), {
    ok: false,
    status: 'failed',
    reply: '当前对话已变化，请重新发送',
  });
});

test('文本对话运行时：回复器抛错会落一条 failed 消息并把异常当回复', async () => {
  const { runtime, sessionStore } = make({ error: new Error('上游超时') });
  const result = await runtime.handleUserMessage('boom');
  assert.deepEqual(result, {
    ok: false,
    status: 'failed',
    reply: '上游超时',
    assistantHandled: true,
    notice: '上游超时',
    responseChannel: 'assistant.message',
  });
  assert.equal(sessionStore.history.at(-1).status, 'failed');
  assert.equal(sessionStore.history.at(-1).content, '上游超时');
  assert.deepEqual(sessionStore.runStates, ['planning', 'failed']);
});

test('文本对话运行时：空回复会改写成 plannerFailed 话术', async () => {
  const { runtime, sessionStore } = make({ reply: '' });
  const result = await runtime.handleUserMessage('说点什么');
  assert.equal(result.reply, '回复失败，请重试');
  assert.equal(result.status, 'failed');
  assert.equal(sessionStore.history.at(-1).content, '回复失败，请重试');
});

test('文本对话运行时：会话委托会先停止当前生成', async () => {
  const { runtime, sessionStore } = make();
  assert.deepEqual(runtime.listConversations(), [{ id: 'c1' }, { id: 'c2' }]);
  assert.deepEqual(runtime.getActiveConversation(), { id: 'c1' });
  assert.deepEqual(runtime.startNewConversation(), { started: 1 });
  assert.deepEqual(runtime.switchConversation('c2'), { switched: 'c2' });
  assert.deepEqual(sessionStore.events, []);
});

test('文本对话运行时：deleteConversation 只在删除当前会话时停止', async () => {
  const { runtime, sessionStore } = make();
  assert.deepEqual(await runtime.deleteConversation('c2'), { deleted: 'c2' });
  assert.equal(sessionStore.stops, 0);
  assert.deepEqual(await runtime.deleteConversation('c1'), { deleted: 'c1' });
  assert.equal(sessionStore.stops, 1);
});

test('文本对话运行时：dispose 之后再发消息一律按会话已关闭处理', async () => {
  const { runtime, sessionStore } = make();
  runtime.dispose();
  runtime.dispose();
  assert.deepEqual(await runtime.handleUserMessage('还能发吗'), {
    ok: false,
    status: 'failed',
    reply: '会话已关闭',
  });
  assert.deepEqual(sessionStore.history, []);
  assert.deepEqual(await runtime.stop(), { ok: true, status: 'stopped', reply: '已停止生成' });
});

test('文本对话运行时：在途期间 dispose 会中断请求并以 stopped 落盘', async () => {
  const gate = deferred();
  const { runtime, sessionStore } = make({ gate });
  const first = runtime.handleUserMessage('画一只猫');
  runtime.dispose();
  gate.resolve();
  const result = await first;
  assert.equal(result.status, 'stopped');
  assert.equal(result.stale, true);
  assert.equal(sessionStore.history.at(-1).status, 'stopped');
});
