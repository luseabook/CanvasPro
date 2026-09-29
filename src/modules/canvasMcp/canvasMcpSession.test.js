import test from 'node:test';
import assert from 'node:assert/strict';

import { createCanvasMcpSession } from './canvasMcpSession.js';

function createCommand(id, extra = {}) {
  return {
    id,
    description: id + ' 命令',
    riskLevel: 'safe',
    argsSchema: { properties: {}, required: [] },
    capabilitySchema: { writes: [] },
    ...extra,
  };
}

function createHarness({ commands = [], binding = 'canvas-1' } = {}) {
  const calls = { request: [], changes: [], executed: [] };
  let pollIndex = 0;
  let polls = ['HANG'];
  const bindingHolder = { current: binding };
  const harness = {
    calls,
    bindingHolder,
    setBinding(value) {
      bindingHolder.current = value;
    },
    setPolls(list) {
      polls = list;
    },
    request: async (payload) => {
      calls.request.push(payload);
      if (payload.action === 'enable') {
        return { id: 'sess-1', url: 'ws://bridge/session', token: 'tok-1', binding: bindingHolder.current };
      }
      if (payload.action === 'poll') {
        const response = polls[pollIndex];
        pollIndex += 1;
        if (response === 'HANG') return new Promise(() => {});
        return response ?? { request: null };
      }
      return {};
    },
    registry: {
      list: () => commands,
    },
    execute: async (id, args) => {
      calls.executed.push([id, args]);
      return { ok: true, executed: id };
    },
    getBinding: () => bindingHolder.current,
    listModels: () => [{ modelId: 'm1', displayName: '模型一' }],
    onChange: (state) => calls.changes.push(state),
    owner: 'owner-1',
  };
  return harness;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('canvasMcpSession: 没有打开画布时不能启用', async () => {
  const harness = createHarness({ binding: '' });
  const session = createCanvasMcpSession(harness);
  await assert.rejects(() => session.enable(), { message: 'Open a canvas before connecting' });
});

test('canvasMcpSession: 启用成功后广播连接信息，工具数含 models', async () => {
  const harness = createHarness({ commands: [createCommand('canvas.ping')] });
  const session = createCanvasMcpSession(harness);
  const info = await session.enable();

  assert.equal(info.id, 'sess-1');
  const change = harness.calls.changes.find((c) => c.enabled);
  assert.ok(change, '广播过启用态');
  assert.equal(change.url, 'ws://bridge/session');
  assert.equal(change.token, 'tok-1');
  assert.equal(change.binding, 'canvas-1');
  assert.equal(change.toolCount, 3, '1 个命令工具 + canvas_models，再加 1');
  await session.destroy();
  assert.deepEqual(harness.calls.changes[harness.calls.changes.length - 1], { enabled: false, reason: '' });
});

test('canvasMcpSession: 模型查询走只读路径并回报描述结果', async () => {
  const harness = createHarness();
  harness.setPolls([{ request: { requestId: 'r1', name: 'canvas_models', arguments: { limit: 1 } } }, 'HANG']);
  const session = createCanvasMcpSession(harness);
  await session.enable();
  await settle();
  await settle();

  const complete = harness.calls.request.find((p) => p.action === 'complete');
  assert.ok(complete, '回报了完成');
  assert.equal(complete.requestId, 'r1');
  // 完成载荷是 { ok, result } 双层包裹
  assert.equal(complete.result.result.total, 1);
  assert.equal(complete.result.result.models[0].modelId, 'm1');
  assert.equal(harness.calls.executed.length, 0, '模型查询不落命令执行');
  await session.destroy();
});

test('canvasMcpSession: 未登记的命令按未授权失败回报', async () => {
  const harness = createHarness();
  harness.setPolls([{ request: { requestId: 'r9', name: 'canvas_nope', arguments: {} } }, 'HANG']);
  const session = createCanvasMcpSession(harness);
  await session.enable();
  await settle();
  await settle();

  const complete = harness.calls.request.find((p) => p.action === 'complete');
  assert.deepEqual(complete.result, {
    ok: false,
    errorCode: 'CANVAS_COMMAND_FAILED',
    message: 'Unauthorized canvas command',
  });
  await session.destroy();
});

test('canvasMcpSession: 已登记的只读命令会执行并回报结果', async () => {
  const harness = createHarness({ commands: [createCommand('canvas.ping')] });
  harness.setPolls([
    { request: { requestId: 'r2', name: 'canvas_canvas_ping', arguments: { requestKey: '12345678' } } },
    'HANG',
  ]);
  const session = createCanvasMcpSession(harness);
  await session.enable();
  await settle();
  await settle();

  assert.deepEqual(harness.calls.executed, [['canvas.ping', { requestKey: '12345678' }]]);
  const complete = harness.calls.request.find((p) => p.action === 'complete');
  assert.deepEqual(complete.result, { ok: true, executed: 'canvas.ping' });
  await session.destroy();
});

test('canvasMcpSession: 超大结果被拒收，避免重放造成重复副作用', async () => {
  // sanitize 会把长字符串截断到 1.5 万字符，所以要用多个键凑出超过 25 万字符的净化后结果
  const harness = createHarness({ commands: [createCommand('canvas.ping')] });
  const blob = 'x'.repeat(15000);
  const big = { ok: true };
  for (let i = 0; i < 20; i += 1) big['part' + i] = blob;
  harness.execute = async () => big;
  harness.setPolls([
    { request: { requestId: 'r3', name: 'canvas_canvas_ping', arguments: { requestKey: '12345678' } } },
    'HANG',
  ]);
  const session = createCanvasMcpSession(harness);
  await session.enable();
  await settle();
  await settle();

  const complete = harness.calls.request.find((p) => p.action === 'complete');
  assert.equal(complete.result.ok, false);
  assert.equal(complete.result.errorCode, 'RESULT_TOO_LARGE');
  await session.destroy();
});

test('canvasMcpSession: destroy 之后不能再启用', async () => {
  const harness = createHarness();
  const session = createCanvasMcpSession(harness);
  await session.enable();
  await session.destroy();
  const enableCount = harness.calls.request.filter((p) => p.action === 'enable').length;
  assert.equal(await session.enable(), null);
  assert.equal(
    harness.calls.request.filter((p) => p.action === 'enable').length,
    enableCount,
    '销毁后不再发起新的启用',
  );
});

test('canvasMcpSession: 换绑画布会被检测并断开', async () => {
  const harness = createHarness();
  harness.setPolls(['HANG']);
  const session = createCanvasMcpSession(harness);
  await session.enable();
  await settle();

  harness.setBinding('canvas-2');
  session.checkBinding();
  await settle();
  const last = harness.calls.changes[harness.calls.changes.length - 1];
  assert.deepEqual(last, { enabled: false, reason: 'canvasChanged' });
  assert.ok(harness.calls.request.some((p) => p.action === 'disable' && p.sessionId === 'sess-1'));
  await session.destroy();
});
