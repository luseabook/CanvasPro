import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentContextDigestRuntime } from './agentContextDigestRuntime.js';

function makeStore(active = { id: 'c1', contextDigest: null }, digest = null) {
  const s = {
    active,
    sets: [],
    getActiveConversation: () => s.active,
    getContextDigest: () => digest,
    setContextDigest: (d, meta) => s.sets.push([d, meta]),
  };
  return s;
}

function history(n = 6) {
  return Array.from({ length: n }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user',
    content: 'm' + i,
    itemId: 'i' + i,
    ts: 100 + i,
  }));
}

function make(over = {}) {
  const sessionStore = makeStore(
    'active' in over ? over.active : { id: 'c1' },
    'digest' in over ? over.digest : null,
  );
  const traces = [];
  const calls = [];
  const runtime = createAgentContextDigestRuntime({
    sessionStore,
    summarize:
      'summarize' in over
        ? over.summarize
        : async (payload) => {
            calls.push(payload);
            return 'summary' in over
              ? over.summary
              : { goal: 'g', constraints: ['a'], decisions: [], completed: [], pending: [] };
          },
    recentMessageLimit: over.recentMessageLimit ?? 2,
    minBatchMessages: over.minBatchMessages ?? 1,
  });
  return { runtime, sessionStore, traces, calls, onTrace: (t) => traces.push(t) };
}

test('上下文摘要运行时：只暴露 prepare 一个入口', () => {
  const { runtime } = make();
  assert.deepEqual(Object.keys(runtime), ['prepare']);
  assert.equal(typeof runtime.prepare, 'function');
});

test('上下文摘要运行时：无活动会话即早退，不调模型且原样回吐归一结果（无摘要时为 null）', async () => {
  for (const active of [null, {}, { id: '  ' }, { id: 0 }]) {
    const { runtime, calls } = make({ active });
    assert.equal(await runtime.prepare({ history: history() }), null);
    assert.deepEqual(calls, []);
  }
  const kept = make({ active: { id: '' }, digest: { goal: 'old' } });
  assert.equal((await kept.runtime.prepare({ history: history() })).goal, 'old');
  assert.deepEqual(kept.calls, []);
});

test('上下文摘要运行时：summarize 非函数时早退并返回归一后的既有摘要', async () => {
  const { runtime, calls } = make({ summarize: null, digest: { goal: 'old' } });
  const r = await runtime.prepare({ history: history() });
  assert.equal(r.goal, 'old');
  assert.deepEqual(calls, []);
});

test('上下文摘要运行时：批次为空（历史全落在最近窗口内）时不调模型', async () => {
  const { runtime, calls, sessionStore } = make({ recentMessageLimit: 2, minBatchMessages: 1, digest: null });
  sessionStore.active = { id: 'c1' };
  const r = await runtime.prepare({ history: history(2) });
  assert.equal(r, null);
  assert.deepEqual(calls, []);
  assert.deepEqual(sessionStore.sets, []);
});

test('上下文摘要运行时：minBatchMessages 拦下过小批次', async () => {
  const { runtime, calls } = make({ minBatchMessages: 5 });
  await runtime.prepare({ history: history(4) });
  assert.deepEqual(calls, []);
});

test('上下文摘要运行时：成功路径按顺序写回摘要并发出 started/completed 两条轨迹', async () => {
  const { runtime, sessionStore, calls } = make();
  const r = await runtime.prepare({ history: history() });
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0]), [
    'existingDigest',
    'messages',
    'projectMemory',
    'signal',
    'onTrace',
  ]);
  assert.equal(calls[0].projectMemory, null);
  assert.equal(calls[0].signal, null);
  assert.deepEqual(
    calls[0].messages.map((m) => m.content),
    ['m0', 'm1', 'm2', 'm3'],
  );
  assert.equal(r.goal, 'g');
  assert.equal(r.coveredMessageCount, 4);
  assert.equal(sessionStore.sets.length, 1);
  assert.equal(sessionStore.sets[0][1].conversationId, 'c1');
});

test('上下文摘要运行时：started 与 completed 轨迹带消息数与覆盖数', async () => {
  const { runtime } = make();
  const traces = [];
  await runtime.prepare({ history: history(), onTrace: (t) => traces.push(t) });
  assert.deepEqual(traces, [
    { type: 'agent_context_digest_started', conversationId: 'c1', messageCount: 4 },
    { type: 'agent_context_digest_completed', conversationId: 'c1', coveredMessageCount: 4 },
  ]);
});

test('上下文摘要运行时：projectMemory 与 signal 原样透传给 summarize', async () => {
  const { runtime, calls } = make();
  const signal = { aborted: false };
  const pm = { facts: ['x'] };
  await runtime.prepare({ history: history(), projectMemory: pm, signal });
  assert.equal(calls[0].projectMemory, pm);
  assert.equal(calls[0].signal, signal);
});

test('上下文摘要运行时：模型抛错只发 failed 轨迹并回落到既有摘要，reason 截 240', async () => {
  const existing = { goal: 'old', coveredThroughTs: 50, coveredMessageCount: 2 };
  const long = 'e'.repeat(400);
  const { runtime, sessionStore } = make({
    digest: existing,
    summarize: async () => {
      throw new Error(long);
    },
  });
  const traces = [];
  const r = await runtime.prepare({ history: history(), onTrace: (t) => traces.push(t) });
  assert.equal(r.goal, 'old');
  assert.equal(r.coveredMessageCount, 2);
  assert.deepEqual(sessionStore.sets, []);
  assert.deepEqual(
    traces.map((t) => t.type),
    ['agent_context_digest_started', 'agent_context_digest_failed'],
  );
  assert.equal(traces[1].reason.length, 240);
  assert.equal(traces[1].conversationId, 'c1');
});

test('上下文摘要运行时：抛非 Error 值时 reason 走字符串化，空值回落固定文案', async () => {
  const capture = async (thrown) => {
    const { runtime } = make({
      summarize: async () => {
        throw thrown;
      },
    });
    const traces = [];
    await runtime.prepare({ history: history(), onTrace: (t) => traces.push(t) });
    return traces[1].reason;
  };
  assert.equal(await capture(42), '42');
  assert.equal(await capture(''), 'context digest failed');
  assert.equal(await capture(null), 'context digest failed');
});

test('上下文摘要运行时：模型返回非法摘要仍被当作有效游标落盘，正文段全空', async () => {
  for (const bad of [null, undefined, 'text', 42, {}, []]) {
    const { runtime, sessionStore } = make({ summary: bad, digest: { goal: 'old' } });
    const traces = [];
    const r = await runtime.prepare({ history: history(), onTrace: (t) => traces.push(t) });
    // attachAgentContextDigestCursor 对任何输入都产出对象 ⇒ 「空摘要」会被写回并覆盖旧摘要
    assert.equal(r.goal, '');
    assert.equal(r.coveredMessageCount, 4);
    assert.equal(sessionStore.sets.length, 1);
    assert.deepEqual(
      traces.map((t) => t.type),
      ['agent_context_digest_started', 'agent_context_digest_completed'],
    );
  }
});

test('上下文摘要运行时：游标由批次覆盖点累加，coveredThroughTs 取本批末条 ts', async () => {
  const { runtime } = make({ digest: { coveredThroughTs: 100, coveredMessageCount: 3 } });
  const r = await runtime.prepare({ history: history() });
  // 批次窗口从 coveredThroughTs=100 之后开始：i1(ts101) 起、末两条留作原文
  assert.equal(r.coveredThroughTs, 103);
});

test('上下文摘要运行时：同一会话的并发第二次调用复用首次结果（外层 async 包装使 Promise 身份不同）', async () => {
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let n = 0;
  const { runtime } = make({
    summarize: async () => {
      n += 1;
      await gate;
      return { goal: 'g' + n };
    },
  });
  const p1 = runtime.prepare({ history: history() });
  const p2 = runtime.prepare({ history: history(8) });
  release();
  // 第二次调用即使在飞的批次键不同（8 条历史）也直接复用首次结果
  const [a, b] = await Promise.all([p1, p2]);
  assert.equal(a.goal, 'g1');
  assert.equal(b.goal, 'g1');
  assert.equal(a, b);
  assert.equal(n, 1);
  assert.equal((await runtime.prepare({ history: history() })).goal, 'g2');
});

test('上下文摘要运行时：活动会话 id 也可来自 activeConversation.contextDigest', async () => {
  const { runtime } = make({
    active: { id: 'c1', contextDigest: { goal: 'from-conversation' } },
    digest: null,
    summarize: async ({ existingDigest }) => {
      assert.equal(existingDigest.goal, 'from-conversation');
      return { goal: 'g' };
    },
  });
  await runtime.prepare({ history: history() });
});

test('上下文摘要运行时：sessionStore 全缺时不抛，早退返回 null', async () => {
  const runtime = createAgentContextDigestRuntime({ summarize: async () => ({ goal: 'g' }) });
  assert.equal(await runtime.prepare({ history: history() }), null);
  assert.equal(await runtime.prepare(), null);
});
