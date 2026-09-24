import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeAgentToolResult,
  deriveAgentCapabilityDiscovery,
  buildAgentToolResult,
  deriveAgentRuntimeProvenance,
  fingerprintAgentAction,
} from './agentToolResult.js';

test('敏感/臃肿键在任意层级被剔除，其余键保留', () => {
  assert.deepEqual(
    sanitizeAgentToolResult({
      ok: true,
      token: 'secret',
      data: { a: 1 },
      nested: { Authorization: 'x', HeAdErS: 'y', keep: 2 },
    }),
    { ok: true, nested: { keep: 2 } },
  );
});

test('字符串按 800 字符截断（含省略号），数组按 12 项截断', () => {
  assert.equal(sanitizeAgentToolResult('x'.repeat(900)).length, 800);
  assert.equal(sanitizeAgentToolResult('x'.repeat(800)).length, 800);
  assert.equal(sanitizeAgentToolResult(Array.from({ length: 30 }, (_, i) => i)).length, 12);
});

test('null/数字/布尔原样返回；函数、symbol、bigint 转字符串', () => {
  assert.equal(sanitizeAgentToolResult(null), null);
  assert.equal(sanitizeAgentToolResult(0), 0);
  assert.equal(sanitizeAgentToolResult(false), false);
  assert.equal(sanitizeAgentToolResult(10n), '10');
  assert.equal(sanitizeAgentToolResult(Symbol('s')), 'Symbol(s)');
  assert.equal(typeof sanitizeAgentToolResult(function foo() {}), 'string');
});

test('超过 maxDepth 的容器值变 [truncated]，但标量不受深度影响', () => {
  const deep = { a: { a: { a: { a: { a: { a: 42 } } } } } };
  assert.deepEqual(sanitizeAgentToolResult(deep), { a: { a: { a: { a: { a: '[truncated]' } } } } });
  assert.deepEqual(sanitizeAgentToolResult(deep, { maxDepth: 2 }), { a: { a: '[truncated]' } });
  assert.equal(sanitizeAgentToolResult(deep, { depth: 99 }), '[truncated]');
  assert.equal(sanitizeAgentToolResult('text', { depth: 99 }), 'text');
  assert.equal(sanitizeAgentToolResult(7, { depth: 99 }), 7);
});

test('超出 maxChars 预算时折叠为摘要对象', () => {
  const big = {
    ok: true,
    status: 'success',
    commandId: 'node.create',
    message: 'm'.repeat(200),
    noise: 'n'.repeat(2000),
  };
  const out = sanitizeAgentToolResult(big, { maxChars: 300 });
  assert.deepEqual(Object.keys(out).sort(), [
    'commandId',
    'errorCode',
    'message',
    'ok',
    'status',
    'truncated',
  ]);
  assert.equal(out.truncated, true);
  assert.equal(out.noise, undefined);
  assert.ok(JSON.stringify(out).length <= 300);
});

test('摘要仍超预算时退化为最小四键', () => {
  const out = sanitizeAgentToolResult(
    { ok: false, status: 'failed', commandId: 'c', message: 'x'.repeat(5000) },
    { maxChars: 200 },
  );
  assert.deepEqual(out, { ok: false, status: 'failed', commandId: 'c', truncated: true });
});

test('buildAgentToolResult 取 results 末项并按回落到缺省', () => {
  const out = buildAgentToolResult({
    step: '3',
    action: { type: 'node.create', as: 'a2' },
    execution: {
      ok: true,
      results: [
        { commandId: 'old' },
        { commandId: 'last', result: { nodeId: 'n1', data: 'drop' }, verification: { v: 1 }, alias: 'a1' },
      ],
    },
  });
  assert.deepEqual(out, {
    step: 3,
    commandId: 'node.create',
    ok: true,
    status: 'success',
    errorCode: '',
    message: '',
    result: { nodeId: 'n1' },
    verification: { v: 1 },
    alias: 'a1',
  });
});

test('buildAgentToolResult 的 execution 无 results / 非 ok 时的缺省', () => {
  const out = buildAgentToolResult({ action: {}, execution: { ok: false, errorCode: 'E1' } });
  assert.equal(out.step, 0);
  assert.equal(out.commandId, '');
  assert.equal(out.status, 'failed');
  assert.equal(out.errorCode, 'E1');
  assert.equal(out.alias, '');
  assert.equal(out.result, undefined);
  assert.ok(!('result' in sanitizeAgentToolResult({})));
});

test('buildAgentToolResult 的别名回落到 action.as', () => {
  assert.equal(
    buildAgentToolResult({ action: { alias: '', as: 'a3' }, execution: { ok: true } }).alias,
    'a3',
  );
  assert.equal(
    buildAgentToolResult({ action: { alias: 'a1', as: 'a3' }, execution: { ok: true } }).alias,
    'a1',
  );
});

test('能力发现：非 ok 一律空集', () => {
  assert.deepEqual(
    deriveAgentCapabilityDiscovery({
      action: { type: 'agent.capabilities.search' },
      execution: { ok: false },
    }),
    {
      commandIds: [],
      modelIds: [],
    },
  );
});

test('能力发现：三类动作各取其列', () => {
  const ok = { ok: true, results: [{ result: { commandIds: [' a ', 'a', '', 'b'] } }] };
  assert.deepEqual(
    deriveAgentCapabilityDiscovery({ action: { type: 'agent.capabilities.search' }, execution: ok }),
    {
      commandIds: ['a', 'b'],
      modelIds: [],
    },
  );
  assert.deepEqual(
    deriveAgentCapabilityDiscovery({
      action: { type: 'agent.command.describe', args: { commandId: 'fromArgs' } },
      execution: { ok: true, results: [{ result: { found: true } }] },
    }),
    { commandIds: ['fromArgs'], modelIds: [] },
  );
  assert.deepEqual(
    deriveAgentCapabilityDiscovery({
      action: { type: 'agent.command.describe' },
      execution: { ok: true, results: [{ result: { found: false, commandId: 'x' } }] },
    }),
    { commandIds: [], modelIds: [] },
  );
  assert.deepEqual(
    deriveAgentCapabilityDiscovery({
      action: { type: 'agent.models.search' },
      execution: { ok: true, results: [{ result: { modelIds: ['m1'] } }] },
    }),
    { commandIds: [], modelIds: ['m1'] },
  );
  assert.deepEqual(deriveAgentCapabilityDiscovery({ action: { type: 'other' }, execution: { ok: true } }), {
    commandIds: [],
    modelIds: [],
  });
});

test('能力发现：results 缺失或为空时按空对象处理', () => {
  assert.deepEqual(
    deriveAgentCapabilityDiscovery({
      action: { type: 'agent.capabilities.search' },
      execution: { ok: true },
    }),
    { commandIds: [], modelIds: [] },
  );
  assert.deepEqual(
    deriveAgentCapabilityDiscovery({
      action: { type: 'agent.command.describe' },
      execution: { ok: true, results: [] },
    }),
    { commandIds: [], modelIds: [] },
  );
});

test('运行时溯源：合并 previous 并对四类创建动作收 nodeId/id/nodeIds/ids', () => {
  const out = deriveAgentRuntimeProvenance({
    action: { type: 'node.createConnected' },
    execution: { ok: true, results: [{ result: { nodeId: 'n2', id: 'n3', ids: ['n4', ' ', 'n2'] } }] },
    previous: { createdNodeIds: ['n1'], createdEdgeIds: ['e1'] },
  });
  assert.deepEqual(out, { createdNodeIds: ['n1', 'n2', 'n3', 'n4'], createdEdgeIds: ['e1'] });
});

test('运行时溯源：graph.connect 只收边，其它动作只透传 previous', () => {
  assert.deepEqual(
    deriveAgentRuntimeProvenance({
      action: { type: 'graph.connect' },
      execution: { ok: true, results: [{ result: { edgeId: 'e2', edgeIds: ['e3'], nodeId: 'ignored' } }] },
      previous: { createdNodeIds: ['n1'] },
    }),
    { createdNodeIds: ['n1'], createdEdgeIds: ['e2', 'e3'] },
  );
  assert.deepEqual(
    deriveAgentRuntimeProvenance({
      action: { type: 'layout.align' },
      execution: { ok: true, results: [{ result: { nodeId: 'x' } }] },
      previous: {},
    }),
    { createdNodeIds: [], createdEdgeIds: [] },
  );
  assert.deepEqual(
    deriveAgentRuntimeProvenance({
      action: { type: 'node.create' },
      execution: { ok: false, results: [{ result: { nodeId: 'x' } }] },
      previous: {},
    }),
    { createdNodeIds: [], createdEdgeIds: [] },
  );
});

test('动作指纹为 FNV-1a 小写十六进制且与序列化键序相关', () => {
  assert.equal(fingerprintAgentAction({ type: 'node.create', args: { a: 1 } }), 'agent-action-2c51199c');
  assert.equal(fingerprintAgentAction({ type: 'node.create', args: { a: 1 } }), 'agent-action-2c51199c');
  assert.match(fingerprintAgentAction({}), /^agent-action-[0-9a-f]{8}$/);
  assert.notEqual(
    fingerprintAgentAction({ args: { a: 1, b: 2 } }),
    fingerprintAgentAction({ args: { b: 2, a: 1 } }),
  );
  assert.equal(fingerprintAgentAction(), fingerprintAgentAction({ type: '', args: null }));
});
