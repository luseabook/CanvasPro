import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentModelRequestRuntime } from './agentModelRequestRuntime.js';

const historyOf = (count) =>
  Array.from({ length: count }, (_0x, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    content: '消息' + index,
    itemId: 'i' + index,
    ts: index,
  }));

// 摘要批次取 history.slice(0, length - recentMessageLimit)，至少要凑满 minBatchMessages(8) 条，
// 因此 20 条才能命中 8 条（i0..i7），10 条会被判为“量不足”而跳过摘要。
const NORMALIZED_OLD_DIGEST = {
  schemaVersion: 1,
  goal: '旧目标',
  constraints: [],
  decisions: [],
  completed: [],
  pending: [],
  coveredThroughItemId: '',
  coveredThroughTs: 0,
  coveredMessageCount: 0,
};

function make(over = {}) {
  const store = {
    history: over.history || [],
    conversationId: 'conversationId' in over ? over.conversationId : 'c1',
    digest: over.digest === undefined ? null : over.digest,
    setCalls: [],
    getHistory: () => store.history,
    getActiveConversation: () => (store.conversationId ? { id: store.conversationId } : null),
    getContextDigest: () => store.digest,
    setContextDigest: (digest, meta) => (store.setCalls.push({ digest, meta }), true),
    recordTrace: () => {},
  };
  const seen = { summarize: [], assistant: [], planner: [], memory: 0 };
  const runtime = createAgentModelRequestRuntime({
    sessionStore: store,
    projectMemoryStore:
      'memoryStore' in over && over.memoryStore === null
        ? null
        : {
            getMemory: () => (
              seen.memory++,
              { brandVoice: ['品牌语气A'], preferredModels: [], namingRules: [], preferences: [] }
            ),
          },
    getSettings: () => ({ model: 'seed-1', temperature: 0.5 }),
    getLocale: () => 'zh-CN',
    summarizeContext: async (input) => (
      seen.summarize.push(input),
      { goal: '目标X', pending: [], completed: [] }
    ),
    requestAssistant: async (input) => (seen.assistant.push(input), { reply: 'A' }),
    requestPlanner: async (input) => (seen.planner.push(input), { plan: 'P' }),
    ...(over.rt || {}),
  });
  return { runtime, store, seen };
}

const SETTINGS = { model: 'seed-1', temperature: 0.5, locale: 'zh-CN' };
const MEMORY = { brandVoice: ['品牌语气A'], preferredModels: [], namingRules: [], preferences: [] };

test('模型请求运行时：只暴露 assistant、planner 与 prepareContextDigest', () => {
  const { runtime } = make();
  assert.deepEqual(Object.keys(runtime), ['assistant', 'planner', 'prepareContextDigest']);
});

test('模型请求运行时：assistant 会先摘要上下文再把摘要·记忆·设置交给请求方', async () => {
  const { runtime, seen } = make();
  const result = await runtime.assistant({ message: '画一只猫', history: historyOf(20) });
  assert.deepEqual(result, { reply: 'A' });
  assert.equal(seen.planner.length, 0);
  assert.equal(seen.summarize.length, 1);
  assert.equal(seen.summarize[0].messages.length, 8);
  assert.deepEqual(
    seen.summarize[0].messages.map((entry) => entry.itemId),
    ['i0', 'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7'],
  );
  assert.equal(seen.summarize[0].existingDigest, null);
  assert.deepEqual(seen.summarize[0].projectMemory, MEMORY);
  assert.deepEqual(seen.summarize[0].settings, SETTINGS);
  const request = seen.assistant[0];
  assert.equal(request.message, '画一只猫');
  assert.equal(request.history.length, 20);
  assert.deepEqual(request.projectMemory, MEMORY);
  assert.deepEqual(request.settings, SETTINGS);
  assert.equal(request.contextDigest.goal, '目标X');
  assert.equal(request.contextDigest.coveredThroughItemId, 'i7');
  assert.equal(request.contextDigest.coveredMessageCount, 8);
});

test('模型请求运行时：对话量不足时不调用摘要，contextDigest 沿用旧值', async () => {
  const { runtime, seen } = make({ digest: NORMALIZED_OLD_DIGEST });
  await runtime.assistant({ message: 'x', history: historyOf(10) });
  assert.equal(seen.summarize.length, 0);
  assert.deepEqual(seen.assistant[0].contextDigest, NORMALIZED_OLD_DIGEST);
});

test('模型请求运行时：planner 与 assistant 共用同一条摘要管线', async () => {
  const { runtime, seen } = make();
  await runtime.planner({ message: '生成计划', history: historyOf(20) });
  assert.equal(seen.assistant.length, 0);
  assert.equal(seen.summarize.length, 1);
  assert.equal(seen.planner[0].contextDigest.goal, '目标X');
  assert.deepEqual(seen.planner[0].settings, SETTINGS);
});

test('模型请求运行时：无活动会话时跳过摘要并把 contextDigest 置空', async () => {
  const { runtime, seen, store } = make({ conversationId: '' });
  await runtime.assistant({ message: 'x', history: historyOf(20) });
  assert.equal(seen.summarize.length, 0);
  assert.equal(seen.assistant[0].contextDigest, null);
  assert.deepEqual(store.setCalls, []);
});

test('模型请求运行时：缺摘要函数时沿用旧摘要且不落库', async () => {
  const { runtime, seen, store } = make({
    digest: { schemaVersion: 1, goal: '旧目标', pending: [], completed: [] },
    rt: { summarizeContext: null },
  });
  await runtime.assistant({ message: 'x', history: historyOf(20) });
  assert.deepEqual(seen.assistant[0].contextDigest, NORMALIZED_OLD_DIGEST);
  assert.deepEqual(store.setCalls, []);
});

test('模型请求运行时：摘要失败会退回旧摘要但请求仍继续', async () => {
  const { runtime, seen, store } = make({
    digest: NORMALIZED_OLD_DIGEST,
    rt: {
      summarizeContext: async (input) => (
        seen.summarize.push(input),
        Promise.reject(new Error('摘要模型不可用'))
      ),
    },
  });
  const result = await runtime.assistant({ message: 'x', history: historyOf(20) });
  assert.deepEqual(result, { reply: 'A' });
  assert.equal(seen.summarize.length, 1);
  assert.deepEqual(seen.assistant[0].contextDigest, NORMALIZED_OLD_DIGEST);
  assert.deepEqual(store.setCalls, []);
});

test('模型请求运行时：设置与语言提供器可缺省，缺省时合并为空对象', async () => {
  const { runtime, seen } = make({ rt: { getSettings: null, getLocale: undefined } });
  await runtime.assistant({ message: 'x', history: historyOf(20) });
  assert.deepEqual(seen.assistant[0].settings, {});
  assert.deepEqual(seen.summarize[0].settings, {});
});

test('模型请求运行时：无记忆仓库时 projectMemory 恒为 null', async () => {
  const { runtime, seen } = make({ memoryStore: null });
  await runtime.assistant({ message: 'x', history: historyOf(20) });
  assert.equal(seen.assistant[0].projectMemory, null);
  assert.equal(seen.summarize[0].projectMemory, null);
});

test('模型请求运行时：prepareContextDigest 可直接调用并回写会话摘要', async () => {
  const { runtime, store } = make();
  const digest = await runtime.prepareContextDigest({ history: historyOf(20) });
  assert.equal(digest.goal, '目标X');
  assert.equal(digest.coveredThroughTs, 7);
  assert.equal(store.setCalls.length, 1);
  assert.deepEqual(store.setCalls[0].meta, { conversationId: 'c1' });
  assert.equal(store.digest, null);
});

test('模型请求运行时：入参对象不会被改写且缺省为空对象', async () => {
  const { runtime, seen } = make();
  const input = { message: 'x' };
  await runtime.assistant(input);
  assert.deepEqual(Object.keys(input), ['message']);
  await runtime.planner();
  assert.deepEqual(Object.keys(seen.assistant[0]), ['message', 'contextDigest', 'projectMemory', 'settings']);
  assert.deepEqual(Object.keys(seen.planner[0]), ['contextDigest', 'projectMemory', 'settings']);
});
