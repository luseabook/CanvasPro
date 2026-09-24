import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAgentRunEvent, replayAgentRunEvents } from './agentRunEventLog.js';

function ev(over = {}) {
  return { type: 'run.status', ts: 100, ...over };
}

test('normalizeAgentRunEvent：缺少 type 的事件一律判为无效', () => {
  assert.equal(normalizeAgentRunEvent({}), null);
  assert.equal(normalizeAgentRunEvent({ runId: 'r1', ts: 5 }), null);
  assert.equal(normalizeAgentRunEvent({ type: '   ' }), null);
  assert.equal(normalizeAgentRunEvent(), null);
  assert.throws(() => normalizeAgentRunEvent(null), TypeError);
});

test('normalizeAgentRunEvent：字段顺序与默认值是固定的扁平形状', () => {
  const r = normalizeAgentRunEvent({ type: 'tool.completed' }, 42);
  assert.deepEqual(Object.keys(r), [
    'id',
    'runId',
    'conversationId',
    'projectId',
    'type',
    'status',
    'step',
    'commandId',
    'ok',
    'errorCode',
    'message',
    'channel',
    'ts',
  ]);
  assert.deepEqual(
    { ...r },
    {
      id: '',
      runId: '',
      conversationId: '',
      projectId: '',
      type: 'tool.completed',
      status: '',
      step: 0,
      commandId: '',
      ok: null,
      errorCode: '',
      message: '',
      channel: '',
      ts: 42,
    },
  );
});

test('normalizeAgentRunEvent：type / status / id 仅做 trim，不做大小写归一', () => {
  const r = normalizeAgentRunEvent(ev({ type: '  Run.Started  ', status: ' ok ', id: ' E1 ' }));
  assert.equal(r.type, 'Run.Started');
  assert.equal(r.status, 'ok');
  assert.equal(r.id, 'E1');
});

test('normalizeAgentRunEvent：非有限或 <=0 的时间戳回落到第二参数', () => {
  for (const ts of [0, -1, NaN, Infinity, -Infinity, 'abc', undefined, null]) {
    assert.equal(normalizeAgentRunEvent(ev({ ts }), 555).ts, 555);
  }
  assert.equal(normalizeAgentRunEvent(ev({ ts: '900' }), 555).ts, 900);
  assert.equal(normalizeAgentRunEvent(ev({ ts: 12.9 }), 555).ts, 12.9);
  assert.equal(normalizeAgentRunEvent(ev({ ts: -3 }), 0).ts, 0);
  assert.notEqual(normalizeAgentRunEvent(ev({ ts: 0 })).ts, 0);
});

test('normalizeAgentRunEvent：step 截断取整且不夹紧上界', () => {
  assert.equal(normalizeAgentRunEvent(ev({ step: 2.7 })).step, 2);
  assert.equal(normalizeAgentRunEvent(ev({ step: -4 })).step, 0);
  assert.equal(normalizeAgentRunEvent(ev({ step: '9' })).step, 9);
  assert.equal(normalizeAgentRunEvent(ev({ step: 1e9 })).step, 1000000000);
});

test('normalizeAgentRunEvent：ok 是三态，任何非布尔真值都落为 null', () => {
  assert.equal(normalizeAgentRunEvent(ev({ ok: true })).ok, true);
  assert.equal(normalizeAgentRunEvent(ev({ ok: false })).ok, false);
  for (const ok of [1, 'true', {}, [], Infinity]) {
    assert.equal(normalizeAgentRunEvent(ev({ ok })).ok, null);
  }
});

test('normalizeAgentRunEvent：message 把空白串折叠成单空格并截到 320，优先取 message 再取 reason', () => {
  const r = normalizeAgentRunEvent(ev({ reason: '被忽略的原因', message: '  a \n b  ' }));
  assert.equal(r.message, 'a b');
  assert.equal(normalizeAgentRunEvent(ev({ reason: '只有 reason' })).message, '只有 reason');
  assert.equal(normalizeAgentRunEvent(ev({ message: 'x'.repeat(400) })).message, 'x'.repeat(317) + '...');
  assert.equal(normalizeAgentRunEvent(ev({ message: 'x'.repeat(320) })).message.length, 320);
  assert.equal(normalizeAgentRunEvent(ev({ message: 'a\t\nb' })).message, 'a b');
});

test('normalizeAgentRunEvent：channel 只 trim 首尾并截到 80，内部空白原样保留', () => {
  assert.equal(normalizeAgentRunEvent(ev({ channel: 'c'.repeat(90) })).channel.length, 80);
  assert.equal(normalizeAgentRunEvent(ev({ channel: ' a  b ' })).channel, 'a  b');
});

test('normalizeAgentRunEvent：四个 id 数组去重、丢空、上限 24，且为空时整键缺席', () => {
  const small = normalizeAgentRunEvent(ev({ commandIds: ['a', 'a', '  ', 1], modelIds: [] }));
  assert.deepEqual(small.commandIds, ['a', '1']);
  assert.equal('modelIds' in small, false);
  const big = normalizeAgentRunEvent(ev({ skillIds: Array.from({ length: 30 }, (_, i) => 's' + i) }));
  assert.equal(big.skillIds.length, 24);
  assert.deepEqual(normalizeAgentRunEvent(ev({ commandIds: 'not-array' })).commandIds, undefined);
});

test('normalizeAgentRunEvent：技能快照按 agentSkillUsage 的 id 键归一，写 skillId 会被整体丢弃', () => {
  assert.equal(
    'skillSnapshots' in normalizeAgentRunEvent(ev({ skillSnapshots: [{ skillId: 's1' }] })),
    false,
  );
  const r = normalizeAgentRunEvent(ev({ skillSnapshots: [{ id: 's1', title: 'T', source: 'installed' }] }));
  assert.equal(r.skillSnapshots.length, 1);
  assert.equal(r.skillSnapshots[0].id, 's1');
  assert.equal(r.skillSnapshots[0].title, 'T');
});

test('normalizeAgentRunEvent：confirmed 仅在严格 true 时出现', () => {
  assert.equal(normalizeAgentRunEvent(ev({ confirmed: true })).confirmed, true);
  assert.equal('confirmed' in normalizeAgentRunEvent(ev({ confirmed: false })), false);
  assert.equal('confirmed' in normalizeAgentRunEvent(ev({ confirmed: 1 })), false);
});

test('replayAgentRunEvents：事件数组中的 null 元素直接抛 TypeError（默认形参只兜 undefined）', () => {
  assert.throws(() => replayAgentRunEvents([null]), TypeError);
  assert.equal(replayAgentRunEvents([undefined, { nope: 1 }]).eventCount, 0);
});

test('replayAgentRunEvents：无事件时返回全零摘要', () => {
  for (const input of [[], 'nope', null, 42]) {
    const r = replayAgentRunEvents(input);
    assert.deepEqual(r, {
      runId: '',
      status: '',
      startedAt: 0,
      endedAt: 0,
      durationMs: 0,
      eventCount: 0,
      commandSequence: [],
      toolSuccessCount: 0,
      toolFailureCount: 0,
      approvalRequestedCount: 0,
      approvalConfirmedCount: 0,
      approvalCancelledCount: 0,
      discoveryCount: 0,
      errors: [],
      events: [],
    });
  }
});

test('replayAgentRunEvents：按 ts 升序排序，起止取首尾，时长为差值', () => {
  const r = replayAgentRunEvents([
    ev({ type: 'b', ts: 99 }),
    ev({ type: 'a', ts: 5 }),
    ev({ type: 'c', ts: 50 }),
  ]);
  assert.deepEqual(
    r.events.map((x) => x.type),
    ['a', 'c', 'b'],
  );
  assert.deepEqual([r.startedAt, r.endedAt, r.durationMs], [5, 99, 94]);
});

test('replayAgentRunEvents：runId 过滤只在传了 runId 时生效，否则跨 run 混算', () => {
  const events = [
    ev({ runId: 'r1', type: 'run.status', status: 'completed', ts: 10 }),
    ev({ runId: 'r2', type: 'run.status', status: 'failed', ts: 20 }),
  ];
  assert.equal(replayAgentRunEvents(events).eventCount, 2);
  const filtered = replayAgentRunEvents(events, { runId: 'r1' });
  assert.deepEqual([filtered.eventCount, filtered.status, filtered.durationMs], [1, 'completed', 0]);
  assert.equal(filtered.runId, 'r1');
  assert.equal(replayAgentRunEvents(events, { runId: 'r9' }).runId, 'r9');
  assert.equal(replayAgentRunEvents(events, { runId: 'r9' }).status, '');
});

test('replayAgentRunEvents：命令序列只收带 commandId 的 tool.completed', () => {
  const r = replayAgentRunEvents([
    ev({ type: 'tool.completed', commandId: 'c1', ok: true, step: 1, ts: 1 }),
    ev({ type: 'tool.completed', ok: true, ts: 2 }),
    ev({ type: 'tool.started', commandId: 'c0', ts: 3 }),
    ev({ type: 'tool.completed', commandId: 'c2', ok: false, step: 2, confirmed: true, ts: 4 }),
  ]);
  assert.deepEqual(r.commandSequence, [
    { commandId: 'c1', ok: true, step: 1, confirmed: false },
    { commandId: 'c2', ok: false, step: 2, confirmed: true },
  ]);
  assert.deepEqual([r.toolSuccessCount, r.toolFailureCount], [1, 1]);
});

test('replayAgentRunEvents：审批计数按 approval.* 前缀分桶', () => {
  const r = replayAgentRunEvents([
    ev({ type: 'approval.requested', ts: 1 }),
    ev({ type: 'approval.requested', ts: 2 }),
    ev({ type: 'approval.confirmed', ts: 3 }),
    ev({ type: 'approval.cancelled', ts: 4 }),
    ev({ type: 'approval.other', ts: 5 }),
    ev({ type: 'capability.discovered', ts: 6 }),
    ev({ type: 'capability.discovered', ts: 7 }),
  ]);
  assert.deepEqual(
    [r.approvalRequestedCount, r.approvalConfirmedCount, r.approvalCancelledCount, r.discoveryCount],
    [2, 1, 1, 2],
  );
});

test('replayAgentRunEvents：错误清单命中 ok=false / status=failed / 非空 errorCode 三种条件', () => {
  const r = replayAgentRunEvents([
    ev({ type: 'tool.completed', commandId: 'a', ok: false, ts: 1 }),
    ev({ type: 'run.status', status: 'failed', ts: 2 }),
    ev({ type: 'command.failed', errorCode: 'E1', message: '炸了', ts: 3 }),
    ev({ type: 'run.status', errorCode: '', ts: 4 }),
    ev({ type: 'ok.event', ok: true, ts: 5 }),
  ]);
  assert.deepEqual(r.errors, [
    { type: 'tool.completed', commandId: 'a', errorCode: '', message: '' },
    { type: 'run.status', commandId: '', errorCode: '', message: '' },
    { type: 'command.failed', commandId: '', errorCode: 'E1', message: '炸了' },
  ]);
});

test('replayAgentRunEvents：状态取时间序上最后一条带非空 status 的 run.status，与事件顺序无关', () => {
  const r = replayAgentRunEvents([
    ev({ type: 'run.status', status: 'running', ts: 1 }),
    ev({ type: 'run.status', status: 'completed', ts: 2 }),
    ev({ type: 'run.status', ts: 3 }),
    ev({ type: 'tool.completed', commandId: 'c', ts: 4 }),
  ]);
  assert.equal(r.status, 'completed');
});

test('replayAgentRunEvents：runId 缺省时回落到首条事件的 runId', () => {
  const r = replayAgentRunEvents([
    ev({ runId: 'autoA', type: 'run.status', status: 'running', ts: 1 }),
    ev({ runId: 'autoB', type: 'run.status', status: 'completed', ts: 2 }),
  ]);
  assert.equal(r.runId, 'autoA');
  assert.equal(r.eventCount, 2);
});
