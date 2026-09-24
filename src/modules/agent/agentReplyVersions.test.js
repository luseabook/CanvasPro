import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_REPLY_VERSION_LIMIT,
  agentMessageKey,
  normalizeAgentReplyVersions,
  normalizeAgentReplyVersionChange,
  createAgentReplyVersionChange,
  applyAgentReplyVersionChange,
  getAgentEditableTurn,
  appendAgentReplyVersion,
  selectAgentReplyVersion,
} from './agentReplyVersions.js';

function version(prompt, reply, extra = {}) {
  return { prompt, reply, ...extra };
}

function turnHistory(assistantExtra = {}, userExtra = {}) {
  return [
    { role: 'user', content: '原始提问', itemId: 'u1', ...userExtra },
    {
      role: 'assistant',
      content: '原始回答',
      itemId: 'a1',
      status: 'chat',
      assistantContext: { skillIds: [] },
      ...assistantExtra,
    },
  ];
}

test('版本上限常量：20，且与端口十六进制 0x14 一致', () => {
  assert.equal(AGENT_REPLY_VERSION_LIMIT, 20);
});

test('消息键：有 itemId 直接用，否则退到 ts:role 拼接，缺字段时拼出字面量 undefined', () => {
  assert.equal(agentMessageKey({ itemId: 'x' }), 'x');
  assert.equal(agentMessageKey({ ts: 100, role: 'assistant' }), '100:assistant');
  assert.equal(agentMessageKey({}), 'undefined:undefined');
  assert.equal(agentMessageKey(undefined), 'undefined:undefined');
  assert.equal(agentMessageKey({ itemId: '', ts: 7, role: 'user' }), '7:user');
});

test('版本归一：versions 非数组（含缺失 / 字符串 / 对象）一律 null', () => {
  for (const bad of [null, undefined, {}, { versions: 'x' }, { versions: { 0: {} } }, [version('p', 'r')]]) {
    assert.equal(normalizeAgentReplyVersions(bad), null, JSON.stringify(bad));
  }
  assert.equal(normalizeAgentReplyVersions({ versions: [] }), null);
});

test('版本归一：每版本键序固定为 prompt/reply/status/assistantContext，缺 status 落 chat', () => {
  const out = normalizeAgentReplyVersions({ versions: [version('p', 'r')] });
  assert.deepEqual(Object.keys(out.versions[0]), ['prompt', 'reply', 'status', 'assistantContext']);
  assert.equal(out.versions[0].status, 'chat');
  assert.deepEqual(out.versions[0].assistantContext, { skillIds: [] });
});

test('版本归一：status 白名单 chat/stopped/failed，其余（含流式中）回落 chat（端口现状）', () => {
  for (const ok of ['chat', 'stopped', 'failed']) {
    assert.equal(
      normalizeAgentReplyVersions({ versions: [version('p', 'r', { status: ok })] }).versions[0].status,
      ok,
    );
  }
  for (const bad of ['streaming', 'pending', '', null, undefined, 0, 'CHAT']) {
    assert.equal(
      normalizeAgentReplyVersions({ versions: [version('p', 'r', { status: bad })] }).versions[0].status,
      'chat',
      JSON.stringify(bad),
    );
  }
});

test('版本归一：assistantContext 走会话上下文归一，非 skillIds 字段被丢弃（端口现状）', () => {
  const out = normalizeAgentReplyVersions({
    versions: [version('p', 'r', { assistantContext: { skillIds: ['s1'], styleHints: ['h'] } })],
  });
  assert.deepEqual(out.versions[0].assistantContext, { skillIds: ['s1'] });
});

test('版本归一：prompt 或 reply 为空的版本被整条过滤，全空则 null', () => {
  const out = normalizeAgentReplyVersions({
    versions: [version('', 'r'), version('p', ''), version('p2', 'r2'), { prompt: 'p3' }],
  });
  assert.equal(out.versions.length, 1);
  assert.equal(out.versions[0].prompt, 'p2');
  assert.equal(normalizeAgentReplyVersions({ versions: [version('', '')] }), null);
});

test('版本归一：超出 20 条被静默截断，activeIndex 同步钳到末位', () => {
  const many = Array.from({ length: 25 }, (_, i) => version('p' + i, 'r' + i));
  const out = normalizeAgentReplyVersions({ versions: many, activeIndex: 24 });
  assert.equal(out.versions.length, AGENT_REPLY_VERSION_LIMIT);
  assert.equal(out.versions.at(-1).prompt, 'p19');
  assert.equal(out.activeIndex, 19);
});

test('版本归一：activeIndex 走 Number + trunc + 区间钳制，负数归 0、小数截断、非法串归 0', () => {
  const vs = [version('p1', 'r1'), version('p2', 'r2')];
  assert.equal(normalizeAgentReplyVersions({ versions: vs, activeIndex: -5 }).activeIndex, 0);
  assert.equal(normalizeAgentReplyVersions({ versions: vs, activeIndex: 1.9 }).activeIndex, 1);
  assert.equal(normalizeAgentReplyVersions({ versions: vs, activeIndex: 'abc' }).activeIndex, 0);
  assert.equal(normalizeAgentReplyVersions({ versions: vs, activeIndex: '1' }).activeIndex, 1);
  assert.equal(normalizeAgentReplyVersions({ versions: vs }).activeIndex, 0);
});

test('增量归一：append 非数组即 null，合法时空数组仍返回结构', () => {
  assert.equal(normalizeAgentReplyVersionChange(null), null);
  assert.equal(normalizeAgentReplyVersionChange({ append: 'x' }), null);
  assert.deepEqual(normalizeAgentReplyVersionChange({ append: [], activeIndex: 3 }), {
    activeIndex: 3,
    append: [],
  });
});

test('增量归一：append 内条目按版本规则清洗，activeIndex 上限钳到 19', () => {
  const out = normalizeAgentReplyVersionChange({
    append: [version('p', 'r', { status: 'weird' })],
    activeIndex: 77,
  });
  assert.equal(out.activeIndex, AGENT_REPLY_VERSION_LIMIT - 1);
  assert.equal(out.append.length, 1);
  assert.equal(out.append[0].status, 'chat');
  assert.deepEqual(Object.keys(out.append[0]), ['prompt', 'reply', 'status', 'assistantContext']);
});

test('增量构造：源版本非法即 null，否则从 next 已有条数之后切片', () => {
  const prev = {
    replyVersions: {
      activeIndex: 2,
      versions: [version('p1', 'r1'), version('p2', 'r2'), version('p3', 'r3')],
    },
  };
  const next = { replyVersions: { activeIndex: 1, versions: [version('p1', 'r1')] } };
  const change = createAgentReplyVersionChange(prev, next);
  assert.equal(change.activeIndex, 2);
  assert.deepEqual(
    change.append.map((v) => v.prompt),
    ['p2', 'p3'],
  );
  assert.equal(createAgentReplyVersionChange({}, next), null);
  assert.equal(createAgentReplyVersionChange(prev, {}).append.length, 3, 'next 非法时按 0 条已有版本处理');
});

test('增量应用：拼接现有与新增后整体重归一，无现有版本时只用 append', () => {
  const merged = applyAgentReplyVersionChange(
    { replyVersions: { versions: [version('p0', 'r0')] } },
    { activeIndex: 1, append: [version('p1', 'r1')] },
  );
  assert.deepEqual(
    merged.versions.map((v) => v.prompt),
    ['p0', 'p1'],
  );
  assert.equal(merged.activeIndex, 1);
  assert.equal(applyAgentReplyVersionChange({}, { activeIndex: 0, append: [] }), null);
});

test('可编辑轮次：末两条须为 user + 带上下文的 assistant', () => {
  const history = turnHistory();
  const turn = getAgentEditableTurn(history);
  assert.equal(turn.user, history[0]);
  assert.equal(turn.assistant, history[1]);
  assert.equal(turn.itemId, 'a1');
  assert.equal(getAgentEditableTurn([]), null);
  assert.equal(getAgentEditableTurn([history[1]]), null);
  assert.equal(getAgentEditableTurn([history[1], history[0]]), null);
});

test('可编辑轮次：缺 assistantContext、状态非白名单、带入参、非 text 消息类型都判不可编辑', () => {
  assert.equal(getAgentEditableTurn(turnHistory({ assistantContext: null })), null);
  assert.equal(getAgentEditableTurn(turnHistory({ status: 'streaming' })), null);
  assert.equal(getAgentEditableTurn(turnHistory({}, { inputRefs: [{ id: 'n1' }] })), null);
  assert.equal(getAgentEditableTurn(turnHistory({}, { messageType: 'image' })), null);
  assert.equal(getAgentEditableTurn(turnHistory({ messageType: 'image' })), null);
  assert.notEqual(getAgentEditableTurn(turnHistory({ messageType: 'text' })), null);
  assert.notEqual(getAgentEditableTurn(turnHistory({}, { messageType: 'text' })), null);
});

test('可编辑轮次：默认参数为空数组，字符串入参因 at() 可用而不抛、只判否（端口现状）', () => {
  assert.equal(getAgentEditableTurn(), null);
  assert.equal(getAgentEditableTurn('ab'), null);
  assert.throws(() => getAgentEditableTurn(null), TypeError);
  assert.throws(() => getAgentEditableTurn(42), TypeError);
});

test('追加版本：无历史版本时用当前问答合成首版，再把新问答追加为活动版本', () => {
  const turn = getAgentEditableTurn(turnHistory());
  const out = appendAgentReplyVersion(turn, '第二个提问', {
    content: '第二个回答',
    status: 'stopped',
    assistantContext: { skillIds: ['x'] },
  });
  assert.equal(out.activeIndex, 1);
  assert.deepEqual(
    out.versions.map((v) => [v.prompt, v.reply]),
    [
      ['原始提问', '原始回答'],
      ['第二个提问', '第二个回答'],
    ],
  );
  assert.equal(out.versions[1].status, 'stopped');
  assert.deepEqual(out.versions[1].assistantContext, { skillIds: ['x'] });
  assert.equal(out.versions[0].status, 'chat');
});

test('追加版本：已有版本时保留并追加，索引指向末条', () => {
  const turn = getAgentEditableTurn(
    turnHistory({
      replyVersions: { activeIndex: 0, versions: [version('p1', 'r1'), version('p2', 'r2')] },
    }),
  );
  const out = appendAgentReplyVersion(turn, 'p3', { content: 'r3', status: 'failed' });
  assert.equal(out.activeIndex, 2);
  assert.deepEqual(
    out.versions.map((v) => v.prompt),
    ['p1', 'p2', 'p3'],
  );
  assert.equal(out.versions[2].status, 'failed');
});

test('追加版本：达到 20 条上限时抛中文提示，不静默丢弃', () => {
  const capped = Array.from({ length: AGENT_REPLY_VERSION_LIMIT }, (_, i) => version('p' + i, 'r' + i));
  const turn = getAgentEditableTurn(turnHistory({ replyVersions: { activeIndex: 19, versions: capped } }));
  assert.throws(() => appendAgentReplyVersion(turn, 'p21', { content: 'r21' }), /回答版本已达上限/);
});

test('切换版本：itemId 不符 / 索引非整数 / 越界都返回 null', () => {
  const history = turnHistory({
    replyVersions: {
      activeIndex: 1,
      versions: [
        version('Q1', 'A1', { status: 'chat' }),
        version('Q1b', 'A2', { status: 'stopped', assistantContext: { skillIds: ['x'] } }),
      ],
    },
  });
  assert.equal(selectAgentReplyVersion(history, 'nope', 0), null);
  assert.equal(selectAgentReplyVersion(history, 'a1', 1.5), null);
  assert.equal(selectAgentReplyVersion(history, 'a1', 5), null);
  assert.equal(selectAgentReplyVersion(history, 'a1', -1), null);
  assert.equal(selectAgentReplyVersion([], 'a1', 0), null);
});

test('切换版本：返回新数组并整条替换末两条，原历史与 activeIndex 不被就地改写', () => {
  const history = turnHistory({
    replyVersions: {
      activeIndex: 1,
      versions: [version('Q1', 'A1', { status: 'chat' }), version('Q1b', 'A2', { status: 'stopped' })],
    },
  });
  const next = selectAgentReplyVersion(history, 'a1', 0);
  assert.notEqual(next, history);
  assert.equal(next[0].content, 'Q1');
  assert.equal(next[1].content, 'A1');
  assert.equal(next[1].status, 'chat');
  assert.equal(next[1].replyVersions.activeIndex, 0);
  assert.equal(history[1].content, '原始回答');
  assert.equal(history[1].status, 'chat');
  assert.equal(history[1].replyVersions.activeIndex, 1);
  assert.equal(history[0].content, '原始提问');
});

test('切换版本：只替换末两条，更早历史原样保留且引用不变', () => {
  const history = [
    { role: 'user', content: 'first', itemId: 'u0' },
    {
      role: 'assistant',
      content: 'second',
      itemId: 'a0',
      status: 'chat',
      assistantContext: { skillIds: [] },
    },
    ...turnHistory({
      replyVersions: { activeIndex: 0, versions: [version('Q1', 'A1'), version('Q2', 'A2')] },
    }),
  ];
  const next = selectAgentReplyVersion(history, 'a1', 1);
  assert.equal(next.length, 4);
  assert.equal(next[0], history[0]);
  assert.equal(next[1], history[1]);
  assert.equal(next[3].content, 'A2');
});

test('切换版本：assistantContext 随版本切换一起替换', () => {
  const history = turnHistory({
    replyVersions: {
      activeIndex: 0,
      versions: [
        version('Q1', 'A1'),
        version('Q2', 'A2', { status: 'failed', assistantContext: { skillIds: ['deep'] } }),
      ],
    },
  });
  const next = selectAgentReplyVersion(history, 'a1', 1);
  assert.deepEqual(next[1].assistantContext, { skillIds: ['deep'] });
  assert.equal(next[1].status, 'failed');
});
