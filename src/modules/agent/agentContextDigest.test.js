import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_CONTEXT_DIGEST_MIN_BATCH_MESSAGES,
  AGENT_CONTEXT_DIGEST_RECENT_MESSAGE_LIMIT,
  AGENT_CONTEXT_DIGEST_SCHEMA_VERSION,
  attachAgentContextDigestCursor,
  compactAgentContextDigestForPrompt,
  normalizeAgentContextDigest,
  selectAgentContextDigestBatch,
} from './agentContextDigest.js';

function hist(n, offset = 0) {
  return Array.from({ length: n }, (_, i) => ({
    itemId: 'm' + (i + offset),
    role: i % 2 ? 'assistant' : 'user',
    content: 'c' + (i + offset),
    ts: 1000 + i + offset,
  }));
}

test('上下文摘要常量冻结当前世代取值', () => {
  assert.deepEqual(
    [
      AGENT_CONTEXT_DIGEST_SCHEMA_VERSION,
      AGENT_CONTEXT_DIGEST_RECENT_MESSAGE_LIMIT,
      AGENT_CONTEXT_DIGEST_MIN_BATCH_MESSAGES,
    ],
    [1, 12, 8],
  );
});

test('normalizeAgentContextDigest：null / 数组 / 字符串 / 空对象都归零为 null', () => {
  for (const input of [null, undefined, [], {}, 'text', 42]) {
    assert.equal(normalizeAgentContextDigest(input), null);
  }
});

test('normalizeAgentContextDigest：只有游标字段也算有效摘要，正文全空', () => {
  assert.deepEqual(normalizeAgentContextDigest({ coveredThroughItemId: 'i1' }), {
    schemaVersion: 1,
    goal: '',
    constraints: [],
    decisions: [],
    completed: [],
    pending: [],
    coveredThroughItemId: 'i1',
    coveredThroughTs: 0,
    coveredMessageCount: 0,
  });
});

test('normalizeAgentContextDigest：goal 截到 800，游标 itemId 截到 160，全文折叠空白', () => {
  const r = normalizeAgentContextDigest({ goal: 'g'.repeat(900), coveredThroughItemId: 'q'.repeat(200) });
  assert.equal(r.goal, 'g'.repeat(797) + '...');
  assert.equal(r.coveredThroughItemId.length, 160);
  assert.deepEqual(normalizeAgentContextDigest({ goal: 'a\n b', constraints: ['  x  y  '] }), {
    schemaVersion: 1,
    goal: 'a b',
    constraints: ['x y'],
    decisions: [],
    completed: [],
    pending: [],
    coveredThroughItemId: '',
    coveredThroughTs: 0,
    coveredMessageCount: 0,
  });
});

test('normalizeAgentContextDigest：四个条目数组去重、去空、每条 480 截断、整节最多 10 条', () => {
  const r = normalizeAgentContextDigest({
    goal: 'g',
    constraints: ['a', 'a', '  ', '  b  '],
    decisions: Array.from({ length: 15 }, (_, i) => 'd' + i),
    completed: ['z'.repeat(600)],
    pending: 'not-array',
  });
  assert.deepEqual(r.constraints, ['a', 'b']);
  assert.equal(r.decisions.length, 10);
  assert.deepEqual(r.decisions[9], 'd9');
  assert.equal(r.completed[0].length, 480);
  assert.deepEqual(r.pending, []);
});

test('normalizeAgentContextDigest：游标数值字段对 NaN / 负数一律钳 0', () => {
  const r = normalizeAgentContextDigest({ goal: 'g', coveredMessageCount: NaN, coveredThroughTs: -5 });
  assert.deepEqual([r.coveredThroughTs, r.coveredMessageCount], [0, 0]);
  assert.deepEqual(
    [
      normalizeAgentContextDigest({ goal: 'g', coveredThroughTs: '77' }).coveredThroughTs,
      normalizeAgentContextDigest({ goal: 'g', coveredMessageCount: 3.9 }).coveredMessageCount,
    ],
    [77, 3],
  );
});

test('selectAgentContextDigestBatch：无摘要时只保留尾部窗口之前的批次', () => {
  const r = selectAgentContextDigestBatch({ history: hist(20) });
  assert.deepEqual(
    r.messages.map((x) => x.itemId),
    hist(8).map((x) => x.itemId),
  );
  assert.deepEqual(r.coveredThrough, { itemId: 'm7', ts: 1007 });
  assert.equal(r.contextDigest, null);
});

test('selectAgentContextDigestBatch：游标定位失败时退回 0 起点，非数组历史返回空批次', () => {
  assert.deepEqual(
    selectAgentContextDigestBatch({ history: hist(20), contextDigest: { coveredThroughItemId: 'nope' } })
      .messages.length,
    8,
  );
  assert.deepEqual(selectAgentContextDigestBatch({ history: 'x' }), {
    contextDigest: null,
    messages: [],
    coveredThrough: null,
  });
});

test('selectAgentContextDigestBatch：不足 minBatchMessages 时整批作废，游标不前移', () => {
  const r = selectAgentContextDigestBatch({
    history: hist(20),
    contextDigest: { goal: 'g', coveredThroughItemId: 'm5' },
  });
  assert.deepEqual(r, { contextDigest: r.contextDigest, messages: [], coveredThrough: null });
  assert.equal(r.messages.length, 0);
});

test('selectAgentContextDigestBatch：itemId 游标优先于 ts 游标，两者都落空则不裁剪', () => {
  const byBoth = selectAgentContextDigestBatch({
    history: hist(30),
    contextDigest: { goal: 'g', coveredThroughItemId: 'm6', coveredThroughTs: 999999 },
  });
  assert.deepEqual(byBoth.messages.map((x) => x.itemId).slice(0, 3), ['m7', 'm8', 'm9']);
  const byTs = selectAgentContextDigestBatch({
    history: hist(30),
    contextDigest: { goal: 'g', coveredThroughTs: 1005 },
  });
  assert.equal(byTs.messages[0].itemId, 'm6');
  assert.equal(byTs.messages.length, 12);
});

test('selectAgentContextDigestBatch：ts 游标命中相同时间戳时取最靠后的一条', () => {
  const r = selectAgentContextDigestBatch({
    history: [
      { itemId: 'a', content: '1', ts: 5 },
      { itemId: 'b', content: '2', ts: 5 },
      { itemId: 'c', content: '3', ts: 5 },
      { itemId: 'd', content: '4', ts: 9 },
      { itemId: 'e', content: '5', ts: 10 },
      { itemId: 'f', content: '6', ts: 11 },
      { itemId: 'g', content: '7', ts: 12 },
      { itemId: 'h', content: '8', ts: 13 },
    ],
    contextDigest: { goal: 'g', coveredThroughTs: 5 },
    recentMessageLimit: 1,
    minBatchMessages: 1,
  });
  assert.deepEqual(
    r.messages.map((x) => x.itemId),
    ['d', 'e', 'f', 'g'],
  );
});

test('selectAgentContextDigestBatch：recentMessageLimit 为 0 时按 1 处理，minBatchMessages 为 0 时按 1 处理', () => {
  const r = selectAgentContextDigestBatch({
    history: [{ content: '1' }, { content: '2' }, { content: '3' }],
    recentMessageLimit: 0,
    minBatchMessages: 0,
  });
  assert.deepEqual(
    r.messages.map((x) => x.content),
    ['1', '2'],
  );
});

test('normalizeDigestMessage（经批次接口观察）：role 只认 user，其余全部归为 assistant', () => {
  const r = selectAgentContextDigestBatch({
    history: [
      { role: 'system', content: 'hi', itemId: 'x', ts: 'abc' },
      { role: 'user', content: 'u' },
      { role: 'tool', content: 't' },
      { role: 'USER', content: 'case' },
      { content: 'out-of-window' },
    ],
    recentMessageLimit: 1,
    minBatchMessages: 1,
  });
  assert.deepEqual(
    r.messages.map((x) => x.role),
    ['assistant', 'user', 'assistant', 'assistant'],
  );
  assert.deepEqual(
    r.messages.map((x) => x.content),
    ['hi', 'u', 't', 'case'],
  );
});

test('normalizeDigestMessage：正文按 content / reply / message / question 顺序取值', () => {
  const r = selectAgentContextDigestBatch({
    history: [
      { role: 'user', reply: 'r' },
      { role: 'assistant', message: 'ms' },
      { role: 'user', question: 'q' },
      { role: 'user', content: 'c', reply: 'ignored' },
      { role: 'user', content: 'out-of-window' },
    ],
    recentMessageLimit: 1,
    minBatchMessages: 1,
  });
  assert.deepEqual(
    r.messages.map((x) => x.content),
    ['r', 'ms', 'q', 'c'],
  );
});

test('normalizeDigestMessage：正文与状态皆空则整条丢弃，仅有状态时保留空正文', () => {
  const r = selectAgentContextDigestBatch({
    history: [
      { role: 'user', status: 'failed' },
      { role: 'user', content: '' },
      { role: 'user', content: '   ', status: '   ' },
      { role: 'user', status: 'ok', content: '' },
      { role: 'user', content: 'out-of-window' },
    ],
    recentMessageLimit: 1,
    minBatchMessages: 1,
  });
  assert.deepEqual(r.messages, [
    { role: 'user', content: '', status: 'failed', itemId: '', ts: 0 },
    { role: 'user', content: '   ', itemId: '', ts: 0 },
    { role: 'user', content: '', status: 'ok', itemId: '', ts: 0 },
  ]);
});

test('normalizeDigestMessage：正文 2000 上限触发中段省略，ts 非数值产出 NaN', () => {
  const r = selectAgentContextDigestBatch({
    history: [
      { content: 'k'.repeat(4000), ts: 'abc' },
      { content: 'b', itemId: '  i  ', ts: -9 },
      { content: 'c', itemId: 12.5, ts: 3.7 },
      { content: 'out-of-window' },
    ],
    recentMessageLimit: 1,
    minBatchMessages: 1,
  });
  assert.equal(r.messages[0].content.length, 2000);
  assert.ok(r.messages[0].content.includes('\n[… middle omitted …]\n'));
  assert.ok(r.messages[0].content.startsWith('k'.repeat(700)));
  assert.ok(r.messages[0].content.endsWith('k'.repeat(700)));
  assert.equal(
    normalizeAgentContextDigest({ goal: 'g', constraints: ['  keep  inner  '] }).constraints[0],
    'keep inner',
  );
  assert.ok(Number.isNaN(r.messages[0].ts));
  assert.deepEqual(r.messages[1], { role: 'assistant', content: 'b', itemId: 'i', ts: 0 });
  assert.deepEqual(r.messages[2], { role: 'assistant', content: 'c', itemId: '12.5', ts: 3 });
});

test('selectAgentContextDigestBatch：历史含 null 条目时抛 TypeError', () => {
  assert.throws(
    () =>
      selectAgentContextDigestBatch({
        history: [null, { content: 'y' }],
        recentMessageLimit: 1,
        minBatchMessages: 1,
      }),
    TypeError,
  );
});

test('attachAgentContextDigestCursor：累加上一轮计数并写回游标，空输入仍归 null', () => {
  assert.deepEqual(
    attachAgentContextDigestCursor(
      { goal: 'G', constraints: ['a'] },
      {
        previousDigest: { coveredMessageCount: 3 },
        coveredThrough: { itemId: 'i9', ts: 777 },
        messageCount: 4,
      },
    ),
    {
      schemaVersion: 1,
      goal: 'G',
      constraints: ['a'],
      decisions: [],
      completed: [],
      pending: [],
      coveredThroughItemId: 'i9',
      coveredThroughTs: 777,
      coveredMessageCount: 7,
    },
  );
  assert.equal(attachAgentContextDigestCursor(null, {}), null);
  assert.equal(
    attachAgentContextDigestCursor({ goal: 'G' }, { coveredThrough: { ts: 'abc' }, messageCount: -2 })
      .coveredThroughTs,
    0,
  );
});

test('compactAgentContextDigestForPrompt：只留六节 + 固定提示语，游标字段被丢弃', () => {
  assert.deepEqual(
    compactAgentContextDigestForPrompt({ goal: 'G', completed: ['a'], coveredMessageCount: 5, extra: 1 }),
    {
      schemaVersion: 1,
      goal: 'G',
      constraints: [],
      decisions: [],
      completed: ['a'],
      pending: [],
      instruction:
        'This summarizes earlier turns. Prefer newer explicit user instructions when they conflict.',
    },
  );
  assert.equal(compactAgentContextDigestForPrompt(null), null);
  assert.equal(compactAgentContextDigestForPrompt('nope'), null);
});

test('compactAgentContextDigestForPrompt：仅含游标的摘要也会产出空正文提示语', () => {
  const r = compactAgentContextDigestForPrompt({ coveredThroughItemId: 'only-cursor' });
  assert.deepEqual(
    [r.goal, r.constraints.length, r.instruction.startsWith('This summarizes')],
    ['', 0, true],
  );
});
