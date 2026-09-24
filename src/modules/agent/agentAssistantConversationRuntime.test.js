import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentAssistantConversationRuntime } from './agentAssistantConversationRuntime.js';
import { agentConversationActionText } from './agentConversationActionText.js';

const CHOICE_JSON =
  '{"question":"选哪个？","options":[{"id":"watercolor","label":"水彩"},{"id":"ink","label":"水墨"}]}';

function makeStore(over = {}) {
  const store = {
    history: over.history || [],
    conversationId: 'conversationId' in over ? over.conversationId : 'c1',
    runId: over.runId || 'r1',
    events: [],
    pushes: [],
    replacements: [],
    runStates: [],
    pending: over.pending || {},
    getHistory: () => store.history,
    getActiveConversation: () => (store.conversationId ? { id: store.conversationId } : null),
    getCurrentRun: () => ({ id: store.runId }),
    emitAssistantStream: (event) => (store.events.push(event), true),
    pushHistory: (entry) => (store.pushes.push(entry), store.history.push(entry), true),
    replaceConversationMessages: (next, meta) => (
      store.replacements.push({ next, meta }),
      (store.history = next),
      true
    ),
    setCurrentRun: (run) => (store.runStates.push(run), (store.runId = run?.id ?? store.runId), true),
    getPendingPlan: () => store.pending.plan ?? null,
    getPendingLoopRun: () => store.pending.loopRun ?? null,
    getPendingClarification: () => store.pending.clarification ?? null,
    isConversationLoaded: (id) => Boolean(store.conversationId) && id === store.conversationId,
  };
  return store;
}

function make(over = {}) {
  const sessionStore = makeStore(over.store);
  const seen = { external: [], reply: [] };
  const runtime = createAgentAssistantConversationRuntime({
    sessionStore,
    text: (key) => 'T:' + key,
    createStoppedReply: () => ({
      ok: false,
      status: 'stopped',
      reply: '已停止',
      responseChannel: 'assistant.stopped',
    }),
    createFailedReply: (message, options = {}) => ({
      ok: false,
      status: 'failed',
      reply: message,
      ...options,
    }),
    startRun: () => 'r1',
    isActiveRun: () => true,
    getSignal: () => null,
    prepareExternalInformation: async (input) => (seen.external.push(input), null),
    replyFromMessage: async (message, options) => (seen.reply.push({ message, options }), '默认回复'),
    handleUserMessage: (label, meta) => ({ via: 'handleUserMessage', label, meta }),
    ...(over.rt || {}),
  });
  return { runtime, sessionStore, seen };
}

const EDITABLE_HISTORY = () => [
  { role: 'user', content: '原问题', itemId: 'u1' },
  {
    role: 'assistant',
    status: 'chat',
    content: '原回答',
    itemId: 'a1',
    assistantContext: { skillIds: ['cat-fact'] },
  },
];

const CHOICE_HISTORY = () => [
  { role: 'user', content: '帮我选风格', itemId: 'u1' },
  {
    role: 'assistant',
    status: 'chat',
    content: '选哪个？',
    itemId: 'q1',
    assistantContext: {
      skillIds: [],
      choice: {
        question: '选哪个？',
        options: [
          { id: 'watercolor', label: '水彩' },
          { id: 'ink', label: '水墨' },
        ],
      },
    },
  },
];

function versionsOf(count) {
  return {
    activeIndex: 0,
    versions: Array.from({ length: count }, (_0x, index) => ({
      prompt: '问题' + index,
      reply: '回答' + index,
      status: 'chat',
      assistantContext: { skillIds: [] },
    })),
  };
}

test('助手会话运行时：只暴露六个入口且 handle 为异步', () => {
  const { runtime } = make();
  assert.deepEqual(Object.keys(runtime), [
    'getPendingChoice',
    'stop',
    'revise',
    'selectVersion',
    'answerChoice',
    'handle',
  ]);
  assert.equal(runtime.handle.constructor.name, 'AsyncFunction');
});

test('助手会话运行时：挂起选项取自末条助手消息并带 questionId', () => {
  const { runtime } = make();
  assert.equal(runtime.getPendingChoice(), null);
  const { runtime: withChoice } = make({ store: { history: CHOICE_HISTORY() } });
  const pending = withChoice.getPendingChoice();
  assert.deepEqual(
    { question: pending.question, options: pending.options, questionId: pending.questionId },
    {
      question: '选哪个？',
      options: [
        { id: 'watercolor', label: '水彩' },
        { id: 'ink', label: '水墨' },
      ],
      questionId: 'q1:0',
    },
  );
  assert.equal(pending.responseChannel, 'assistant.message');
  const { runtime: notChat } = make({
    store: { history: [{ role: 'assistant', status: 'failed', content: 'x', assistantContext: {} }] },
  });
  assert.equal(notChat.getPendingChoice(), null);
});

test('助手会话运行时：无进行中任务时 stop 返回布尔 false', () => {
  const { runtime, sessionStore } = make();
  assert.equal(runtime.stop(), false);
  assert.deepEqual(sessionStore.events, []);
});

test('助手会话运行时：handle 成功时按 start/text/end 顺序广播并落一条助手消息', async () => {
  const { runtime, sessionStore, seen } = make();
  const result = await runtime.handle('帮我画一只猫', { documentFiles: [{ name: 'a.txt' }] }, 'r1');
  assert.deepEqual(result, {
    ok: true,
    status: 'chat',
    reply: '默认回复',
    assistantHandled: true,
    responseChannel: 'assistant.message',
  });
  assert.deepEqual(seen.external, [
    { message: '帮我画一只猫', documentFiles: [{ name: 'a.txt' }], signal: null },
  ]);
  const options = seen.reply[0].options;
  assert.equal(options.externalInformation, null);
  assert.equal(options.signal, null);
  assert.equal(typeof options.onText, 'function');
  assert.equal(typeof options.onSkillsSelected, 'function');
  assert.deepEqual(sessionStore.pushes, [
    { role: 'assistant', status: 'chat', content: '默认回复', assistantContext: { skillIds: [] } },
  ]);
  assert.deepEqual(sessionStore.runStates, [{ id: 'r1', status: 'chat', stopped: false }]);
  assert.deepEqual(
    sessionStore.events.map((event) => event.type),
    ['start', 'end'],
  );
  assert.deepEqual(sessionStore.events[0], { type: 'start', runId: 'r1', revision: false });
  assert.deepEqual(
    {
      runId: sessionStore.events[1].runId,
      discard: sessionStore.events[1].discard,
      revision: sessionStore.events[1].revision,
    },
    { runId: 'r1', discard: false, revision: undefined },
  );
  assert.equal(sessionStore.events[1].history, sessionStore.history);
});

test('助手会话运行时：onText 会裁掉 agent-choice 围栏后再广播', async () => {
  const { runtime, sessionStore } = make({
    rt: {
      replyFromMessage: async (_message, options) => {
        options.onText('先说结论\n```agent-choice\n' + CHOICE_JSON + '\n```');
        return '先说结论';
      },
    },
  });
  const result = await runtime.handle('给我一个结论', {}, 'r1');
  assert.equal(result.reply, '先说结论');
  const textEvents = sessionStore.events.filter((event) => event.type === 'text');
  assert.deepEqual(textEvents, [{ type: 'text', runId: 'r1', text: '先说结论' }]);
});

test('助手会话运行时：agent-choice 围栏回复转成挂起选项并把问题并回正文', async () => {
  const { runtime, sessionStore } = make({
    rt: { replyFromMessage: async () => '我给了两个方向\n\n```agent-choice\n' + CHOICE_JSON + '\n```' },
  });
  const result = await runtime.handle('给我两个方向', {}, 'r1');
  assert.equal(result.reply, '我给了两个方向\n\n选哪个？');
  assert.deepEqual(result.options, [
    { id: 'watercolor', label: '水彩' },
    { id: 'ink', label: '水墨' },
  ]);
  assert.equal(result.question, '选哪个？');
  assert.deepEqual(sessionStore.pushes[0].assistantContext, {
    skillIds: [],
    choice: {
      question: '选哪个？',
      options: [
        { id: 'watercolor', label: '水彩' },
        { id: 'ink', label: '水墨' },
      ],
    },
  });
  assert.equal(runtime.getPendingChoice().questionId, 'undefined:1:0');
});

test('助手会话运行时：成功回复的 skillIds 原样入库，仅在读取挂起项时归一', async () => {
  const { runtime, sessionStore } = make({
    rt: {
      replyFromMessage: async () => ({
        reply: '好的',
        selectedSkillIds: ['cat-fact', 'NOT_VALID', 'cat-fact', 'third-skill'],
      }),
    },
  });
  await runtime.handle('用技能回答', {}, 'r1');
  assert.deepEqual(sessionStore.pushes[0].assistantContext, {
    skillIds: ['cat-fact', 'NOT_VALID', 'cat-fact', 'third-skill'],
  });
});

test('助手会话运行时：空回复按 plannerFailed 落一条失败消息', async () => {
  const { runtime, sessionStore } = make({ rt: { replyFromMessage: async () => '   ' } });
  const result = await runtime.handle('说点什么', {}, 'r1');
  assert.deepEqual(
    { ok: result.ok, status: result.status, reply: result.reply, notice: result.notice },
    { ok: false, status: 'failed', reply: 'T:plannerFailed', notice: 'T:plannerFailed' },
  );
  assert.equal(result.responseChannel, 'assistant.message');
  assert.equal(result.assistantHandled, true);
  assert.deepEqual(sessionStore.pushes, [
    { role: 'assistant', status: 'failed', content: 'T:plannerFailed', assistantContext: { skillIds: [] } },
  ]);
  assert.deepEqual(sessionStore.runStates, [{ id: 'r1', status: 'failed', stopped: false }]);
});

test('助手会话运行时：失败回复会保留已流出的正文与已选技能', async () => {
  const { runtime, sessionStore } = make({
    rt: {
      replyFromMessage: async (_message, options) => {
        options.onSkillsSelected([{ id: 'cat-fact' }, { id: 'dog-fact' }]);
        options.onText('已经写了一半');
        throw new Error('模型调用失败');
      },
    },
  });
  const result = await runtime.handle('讲个故事', {}, 'r1');
  assert.equal(result.reply, '模型调用失败');
  assert.deepEqual(sessionStore.pushes, [
    {
      role: 'assistant',
      status: 'failed',
      content: '已经写了一半',
      assistantContext: { skillIds: ['cat-fact', 'dog-fact'] },
    },
  ]);
  assert.equal(sessionStore.events.at(-1).discard, false);
});

test('助手会话运行时：修订轮失败且无正文时不落历史并以 discard 收尾', async () => {
  const { runtime, sessionStore } = make({
    store: { history: EDITABLE_HISTORY() },
    rt: {
      replyFromMessage: async () => {
        throw new Error('模型调用失败');
      },
    },
  });
  const before = sessionStore.history.slice();
  const result = await runtime.revise({ itemId: 'a1' });
  assert.equal(result.reply, '模型调用失败');
  assert.equal(result.assistantHandled, true);
  assert.deepEqual(sessionStore.pushes, []);
  assert.deepEqual(sessionStore.replacements, []);
  assert.deepEqual(sessionStore.history, before);
  assert.deepEqual(
    { type: sessionStore.events.at(-1).type, discard: sessionStore.events.at(-1).discard },
    { type: 'end', discard: true },
  );
});

test('助手会话运行时：外部信息阶段切换会话时按 stale 停止且不落历史', async () => {
  const { runtime, sessionStore } = make({
    rt: {
      prepareExternalInformation: async () => {
        sessionStore.conversationId = 'c2';
        return null;
      },
    },
  });
  const result = await runtime.handle('读一下 https://a.com/x', {}, 'r1');
  assert.deepEqual(result, {
    ok: false,
    status: 'stopped',
    reply: '已停止',
    responseChannel: 'assistant.stopped',
    assistantHandled: true,
    stale: true,
  });
  assert.deepEqual(sessionStore.pushes, []);
  assert.deepEqual(sessionStore.runStates, []);
  assert.deepEqual(
    sessionStore.events.map((event) => event.type),
    ['start'],
  );
  // 已知的飞行记录泄漏：stale 分支既不广播 end 也不清理内部在飞记录
  assert.deepEqual(runtime.stop(), { error: null });
  assert.deepEqual(
    { history: sessionStore.events.at(-1).history, discard: sessionStore.events.at(-1).discard },
    { history: null, discard: true },
  );
  assert.equal(runtime.stop(), false);
  assert.equal(sessionStore.events.length, 2);
  assert.deepEqual(sessionStore.pushes, []);
});

test('助手会话运行时：signal 已 abort 时同样按 stale 收尾', async () => {
  const controller = { aborted: false };
  const { runtime, sessionStore } = make({
    rt: {
      getSignal: () => controller,
      prepareExternalInformation: async () => {
        controller.aborted = true;
        return null;
      },
    },
  });
  const result = await runtime.handle('你好', {}, 'r1');
  assert.equal(result.stale, true);
  assert.equal(result.status, 'stopped');
  assert.deepEqual(sessionStore.pushes, []);
});

test('助手会话运行时：run 已不活跃时返回 createStoppedReply 形状', async () => {
  const { runtime, sessionStore } = make({ rt: { isActiveRun: () => false } });
  const result = await runtime.handle('你好', {}, 'r1');
  assert.deepEqual(result, {
    ok: false,
    status: 'stopped',
    reply: '已停止',
    responseChannel: 'assistant.stopped',
    assistantHandled: true,
    stale: true,
  });
  assert.equal(sessionStore.history.length, 0);
});

test('助手会话运行时：isConversationLoaded 为真时正文仍会广播，但结果按 stale 丢弃', async () => {
  const { runtime, sessionStore } = make({
    rt: {
      replyFromMessage: async (_message, options) => {
        sessionStore.runId = 'other-run';
        options.onText('半路正文');
        return '最终回复';
      },
    },
  });
  const result = await runtime.handle('你好', {}, 'r1');
  assert.equal(result.stale, true);
  assert.deepEqual(
    sessionStore.events.map((event) => event.type),
    ['start', 'text'],
  );
  assert.equal(sessionStore.events[1].text, '半路正文');
  assert.deepEqual(sessionStore.pushes, []);
});

test('助手会话运行时：stop 在飞行中会落一条 stopped 消息并让 handle 以 stale 返回', async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { runtime, sessionStore } = make({
    rt: {
      prepareExternalInformation: async () => {
        await gate;
        return null;
      },
    },
  });
  const running = runtime.handle('你好', {}, 'r1');
  const stopped = runtime.stop();
  release();
  const result = await running;
  assert.deepEqual(stopped, { error: null });
  assert.deepEqual(sessionStore.pushes, [
    { role: 'assistant', status: 'stopped', content: 'T:runStopped', assistantContext: { skillIds: [] } },
  ]);
  assert.equal(result.stale, true);
  assert.deepEqual(
    sessionStore.events.map((event) => event.type),
    ['start', 'end'],
  );
  assert.deepEqual(
    { runId: sessionStore.events[1].runId, discard: sessionStore.events[1].discard },
    { runId: 'r1', discard: false },
  );
});

test('助手会话运行时：stop 会保留已流出的正文而不是替换为停止文案', async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  const { runtime, sessionStore } = make({
    rt: {
      replyFromMessage: async (_message, options) => {
        options.onText('已经生成的段落');
        await gate;
        return '不该出现';
      },
    },
  });
  const running = runtime.handle('你好', {}, 'r1');
  await new Promise((resolve) => setImmediate(resolve));
  const stopped = runtime.stop();
  release();
  const result = await running;
  assert.deepEqual(stopped, { error: null });
  assert.equal(sessionStore.pushes[0].content, '已经生成的段落');
  assert.equal(sessionStore.pushes[0].status, 'stopped');
  assert.equal(result.stale, true);
  assert.equal(sessionStore.pushes.length, 1);
});

test('助手会话运行时：revise 成功会在原位替换并追加一个回答版本', async () => {
  const { runtime, sessionStore, seen } = make({ store: { history: EDITABLE_HISTORY() } });
  const result = await runtime.revise({ itemId: 'a1', message: '新问题' });
  assert.equal(result.ok, true);
  assert.equal(result.reply, '默认回复');
  const meta = seen.reply[0].options;
  assert.equal(meta.assistantChoice, true);
  assert.deepEqual(meta.selectedSkillIds, ['cat-fact']);
  assert.equal(meta.revision.itemId, 'a1');
  assert.deepEqual(meta.history, [{ role: 'user', content: '新问题', itemId: 'u1' }]);
  assert.deepEqual(meta.conversationHistory, meta.history);
  assert.deepEqual(
    sessionStore.replacements.map((item) => item.meta),
    [{ conversationId: 'c1' }],
  );
  assert.deepEqual(sessionStore.pushes, []);
  const [user, assistant] = sessionStore.history;
  assert.equal(user.content, '新问题');
  assert.equal(assistant.content, '默认回复');
  assert.deepEqual(assistant.replyVersions, {
    activeIndex: 1,
    versions: [
      { prompt: '原问题', reply: '原回答', status: 'chat', assistantContext: { skillIds: ['cat-fact'] } },
      { prompt: '新问题', reply: '默认回复', status: 'chat', assistantContext: { skillIds: [] } },
    ],
  });
});

test('助手会话运行时：revise 缺省 message 时沿用原提问文本', async () => {
  const { runtime, seen } = make({ store: { history: EDITABLE_HISTORY() } });
  await runtime.revise({ itemId: 'a1' });
  assert.equal(seen.reply[0].message, '原问题');
});

test('助手会话运行时：revise 在 itemId 不匹配或有其它挂起项时返回 noPendingClarification', async () => {
  const mismatched = make({ store: { history: EDITABLE_HISTORY() } });
  assert.equal(
    (await mismatched.runtime.revise({ itemId: 'nope', message: 'x' })).reply,
    'T:noPendingClarification',
  );
  assert.deepEqual(mismatched.seen.reply, []);
  const busy = make({
    store: { history: EDITABLE_HISTORY(), pending: { clarification: { question: 'q' } } },
  });
  assert.equal((await busy.runtime.revise({ itemId: 'a1', message: 'x' })).reply, 'T:noPendingClarification');
  const notEditable = make({ store: { history: [{ role: 'user', content: '只有提问' }] } });
  assert.equal(
    (await notEditable.runtime.revise({ itemId: 'a1', message: 'x' })).reply,
    'T:noPendingClarification',
  );
});

test('助手会话运行时：revise 空提问与超过版本上限各自返回对应文案', async () => {
  const blank = make({ store: { history: EDITABLE_HISTORY() } });
  assert.equal((await blank.runtime.revise({ itemId: 'a1', message: '   ' })).reply, 'T:emptyMessage');
  const capped = make({
    store: {
      history: [EDITABLE_HISTORY()[0], { ...EDITABLE_HISTORY()[1], replyVersions: versionsOf(20) }],
    },
  });
  assert.equal(
    (await capped.runtime.revise({ itemId: 'a1', message: '再答一次' })).reply,
    agentConversationActionText('limit'),
  );
  assert.deepEqual(capped.seen.reply, []);
});

test('助手会话运行时：修订期间对话被改动时以“对话内容已变化”失败且不落历史', async () => {
  const { runtime, sessionStore } = make({
    store: { history: EDITABLE_HISTORY() },
    rt: {
      replyFromMessage: async (_message, options) => {
        sessionStore.history.push({ role: 'user', content: '外部插入的新提问', itemId: 'u2' });
        options.onText('半路正文');
        return '新回答';
      },
    },
  });
  const result = await runtime.revise({ itemId: 'a1', message: '新问题' });
  assert.equal(result.reply, '对话内容已变化，请重新发送消息');
  assert.equal(result.notice, '对话内容已变化，请重新发送消息');
  assert.equal(result.responseChannel, 'assistant.message');
  assert.deepEqual(sessionStore.replacements, []);
  assert.deepEqual(sessionStore.pushes, []);
  assert.deepEqual(sessionStore.runStates, [{ id: 'r1', status: 'failed', stopped: false }]);
  assert.equal(sessionStore.events.at(-1).discard, true);
});

test('助手会话运行时：selectVersion 原位切回历史版本并更新 activeIndex', async () => {
  const history = [
    { role: 'user', content: '问题A', itemId: 'u1' },
    {
      role: 'assistant',
      status: 'chat',
      content: '回答B',
      itemId: 'a1',
      assistantContext: { skillIds: [] },
      replyVersions: versionsOf(2),
    },
  ];
  const { runtime, sessionStore } = make({ store: { history } });
  const result = await runtime.selectVersion({ itemId: 'a1', index: 0 });
  assert.deepEqual(
    { ok: result.ok, status: result.status, assistantHandled: result.assistantHandled },
    { ok: true, status: 'chat', assistantHandled: true },
  );
  assert.equal(sessionStore.history[0].content, '问题0');
  assert.deepEqual(
    sessionStore.replacements.map((item) => item.meta),
    [{ conversationId: 'c1' }],
  );
  const assistant = sessionStore.history[1];
  assert.equal(assistant.content, '回答0');
  assert.equal(assistant.status, 'chat');
  assert.equal(assistant.replyVersions.activeIndex, 0);
  assert.equal(assistant.replyVersions.versions.length, 2);
});

test('助手会话运行时：selectVersion 对非法序号、缺失挂起项与写入失败一律回退为 noPendingClarification', async () => {
  const history = [
    { role: 'user', content: '问题A', itemId: 'u1' },
    {
      role: 'assistant',
      status: 'chat',
      content: '回答B',
      itemId: 'a1',
      assistantContext: { skillIds: [] },
      replyVersions: versionsOf(2),
    },
  ];
  const badIndex = make({ store: { history } });
  assert.equal(
    (await badIndex.runtime.selectVersion({ itemId: 'a1', index: 1.5 })).reply,
    'T:noPendingClarification',
  );
  assert.equal(
    (await badIndex.runtime.selectVersion({ itemId: 'a1', index: 9 })).reply,
    'T:noPendingClarification',
  );
  assert.equal(
    (await badIndex.runtime.selectVersion({ itemId: 'other', index: 0 })).reply,
    'T:noPendingClarification',
  );
  assert.deepEqual(badIndex.sessionStore.replacements, []);
  const writable = make({
    store: { history },
    rt: {},
  });
  writable.sessionStore.replaceConversationMessages = () => false;
  assert.equal(
    (await writable.runtime.selectVersion({ itemId: 'a1', index: 0 })).reply,
    'T:noPendingClarification',
  );
  const noStore = make({ store: { history, pending: { plan: { id: 'p' } } } });
  assert.equal(
    (await noStore.runtime.selectVersion({ itemId: 'a1', index: 0 })).reply,
    'T:noPendingClarification',
  );
});

test('助手会话运行时：answerChoice 命中选项时转交 handleUserMessage，校验不过则回退', async () => {
  const { runtime } = make({ store: { history: CHOICE_HISTORY() } });
  assert.deepEqual(await runtime.answerChoice('ink', { questionId: 'q1:0' }), {
    via: 'handleUserMessage',
    label: '水墨',
    meta: { assistantChoice: true },
  });
  assert.equal((await runtime.answerChoice('ink', { questionId: 'q1:1' })).reply, 'T:noPendingClarification');
  assert.equal(
    (await runtime.answerChoice('unknown', { questionId: 'q1:0' })).reply,
    'T:noPendingClarification',
  );
  assert.equal((await runtime.answerChoice()).reply, 'T:noPendingClarification');
});

test('助手会话运行时：handle 第二个参数为必填，缺省直接抛出 TypeError', async () => {
  const { runtime } = make();
  await assert.rejects(() => runtime.handle('你好', undefined, 'r1'), TypeError);
});

test('助手会话运行时：裸构造时仅 stop 可用，其余入口都要求宿主注入 sessionStore', () => {
  const bare = createAgentAssistantConversationRuntime();
  assert.equal(bare.stop(), false);
  assert.throws(() => bare.getPendingChoice(), TypeError);
  assert.throws(() => bare.revise({ itemId: 'a1', message: 'x' }), TypeError);
  assert.throws(() => bare.selectVersion({ itemId: 'a1', index: 0 }), TypeError);
  assert.throws(() => bare.answerChoice('a', { questionId: 'a1:0' }), TypeError);
});
