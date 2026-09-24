import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentExternalInformationRuntime } from './agentExternalInformationRuntime.js';
import { AGENT_EXTERNAL_INFORMATION_TOOL_ID } from './agentExternalInformation.js';
import { AGENT_EXTERNAL_DOCUMENT_TOOL_ID } from './agentDocumentInput.js';

function makeRegistry(results, over = {}) {
  const calls = [];
  let i = 0;
  return {
    calls,
    has: (id) => !(over.missing || [])['includes'](id),
    execute: (arg) => {
      calls.push(arg);
      const item = Array.isArray(results) ? results[i++] : results;
      return Promise.resolve(item === undefined ? { ok: true, result: {} } : item);
    },
  };
}

function makeStore() {
  const traces = [];
  const events = [];
  return {
    traces,
    events,
    recordTrace: (t) => traces.push(t),
    recordRunEvent: (e) => events.push(e),
    getCurrentRun: () => ({ id: 'run-1' }),
  };
}

const URL_MSG = '请阅读 https://a.com/x 并总结';
const DOC = { name: 'spec.pdf' };
const TWO_URL_MSG = '请阅读 https://a.com/x 和 https://b.com/y';

test('外部信息运行时：只暴露 prepare，且无链接无文档时返回 null 且不发任何轨迹', async () => {
  const registry = makeRegistry([]);
  const sessionStore = makeStore();
  const runtime = createAgentExternalInformationRuntime({ toolRegistry: registry, sessionStore });
  assert.deepEqual(Object.keys(runtime), ['prepare']);
  assert.equal(await runtime.prepare({ message: '你好' }), null);
  assert.deepEqual(sessionStore.traces, []);
  assert.deepEqual(registry.calls, []);
});

test('外部信息运行时：单工具时 selected 轨迹用该 toolId，多工具改为批次聚合名', async () => {
  const single = makeStore();
  const r1 = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([{ ok: true, result: { content: 'c', finalUrl: 'https://a.com/x' } }]),
    sessionStore: single,
  });
  await r1.prepare({ message: URL_MSG });
  assert.deepEqual(single.traces[0], {
    type: 'external_tool.selected',
    status: 'running',
    toolId: AGENT_EXTERNAL_INFORMATION_TOOL_ID,
    toolIds: [AGENT_EXTERNAL_INFORMATION_TOOL_ID],
    sourceCount: 1,
  });

  const multi = makeStore();
  const registry = makeRegistry([
    { ok: true, result: { content: 'doc', displayName: 'spec.pdf' } },
    { ok: true, result: { content: 'web', finalUrl: 'https://a.com/x' } },
  ]);
  const r2 = createAgentExternalInformationRuntime({ toolRegistry: registry, sessionStore: multi });
  await r2.prepare({ message: URL_MSG, documentFiles: [DOC] });
  assert.equal(multi.traces[0].toolId, 'external-information.batch');
  assert.deepEqual(multi.traces[0].toolIds, [
    AGENT_EXTERNAL_DOCUMENT_TOOL_ID,
    AGENT_EXTERNAL_INFORMATION_TOOL_ID,
  ]);
  assert.equal(multi.traces[0].sourceCount, 2);
});

test('外部信息运行时：每条请求按 toolId/args/signal 交给注册表执行', async () => {
  const registry = makeRegistry([
    { ok: true, result: { content: 'doc', displayName: 'spec.pdf' } },
    { ok: true, result: { content: 'web', finalUrl: 'https://a.com/x' } },
  ]);
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: registry,
    sessionStore: makeStore(),
  });
  const signal = { aborted: false };
  await runtime.prepare({ message: URL_MSG, documentFiles: [DOC], signal });
  assert.deepEqual(registry.calls, [
    { toolId: AGENT_EXTERNAL_DOCUMENT_TOOL_ID, args: { file: DOC }, signal },
    { toolId: AGENT_EXTERNAL_INFORMATION_TOOL_ID, args: { url: 'https://a.com/x' }, signal },
  ]);
});

test('外部信息运行时：缺工具时抛 EXTERNAL_TOOL_UNAVAILABLE 中文错误并记 failed 轨迹', async () => {
  const sessionStore = makeStore();
  const registry = makeRegistry([], { missing: [AGENT_EXTERNAL_INFORMATION_TOOL_ID] });
  const runtime = createAgentExternalInformationRuntime({ toolRegistry: registry, sessionStore });
  await assert.rejects(
    () => runtime.prepare({ message: URL_MSG }),
    (err) => {
      assert.equal(err.message, '当前运行环境不支持读取该外部信息。');
      assert.equal(err.code, 'EXTERNAL_TOOL_UNAVAILABLE');
      return true;
    },
  );
  assert.deepEqual(registry.calls, []);
  assert.deepEqual(sessionStore.traces.at(-1), {
    type: 'external_tool.completed',
    status: 'failed',
    toolId: AGENT_EXTERNAL_INFORMATION_TOOL_ID,
    ok: false,
    errorCode: 'EXTERNAL_TOOL_UNAVAILABLE',
    message: '当前运行环境不支持读取该外部信息。',
  });
});

test('外部信息运行时：任一工具非 ok 即以首个失败项抛错，code 回落固定错误码', async () => {
  const sessionStore = makeStore();
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([
      { ok: true, result: { content: 'a', finalUrl: 'https://a.com/x' } },
      { ok: false, status: 'timeout', errorCode: 'NET_TIMEOUT', message: '读取超时', toolId: 'web.read_url' },
    ]),
    sessionStore,
  });
  await assert.rejects(
    () => runtime.prepare({ message: TWO_URL_MSG }),
    (err) => {
      assert.deepEqual([err.message, err.code], ['读取超时', 'NET_TIMEOUT']);
      return true;
    },
  );
  assert.deepEqual(sessionStore.traces.at(-1), {
    type: 'external_tool.completed',
    status: 'timeout',
    toolId: 'web.read_url',
    ok: false,
    errorCode: 'NET_TIMEOUT',
    message: '读取超时',
  });
});

test('外部信息运行时：失败项缺 message/errorCode/toolId 时三处各自回落默认值', async () => {
  const sessionStore = makeStore();
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([{ ok: false }]),
    sessionStore,
  });
  await assert.rejects(() => runtime.prepare({ message: URL_MSG }), /外部信息读取失败。/);
  assert.equal(sessionStore.traces.at(-1).errorCode, 'EXTERNAL_INFORMATION_READ_FAILED');
  assert.equal(sessionStore.traces.at(-1).status, 'failed');
  assert.equal(sessionStore.traces.at(-1).toolId, AGENT_EXTERNAL_INFORMATION_TOOL_ID);
});

test('外部信息运行时：成功结果取 result.source（无则 result 本身）并补三类标识', async () => {
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([
      { ok: true, result: { source: { content: 'wrapped', finalUrl: 'https://a.com/x', title: 'T' } } },
    ]),
    sessionStore: makeStore(),
  });
  const r = await runtime.prepare({ message: URL_MSG });
  assert.equal(r.sources.length, 1);
  assert.deepEqual(
    {
      id: r.sources[0].sourceId,
      tool: r.sources[0].toolId,
      url: r.sources[0].requestedUrl,
      content: r.sources[0].content,
    },
    { id: 'url-1', tool: AGENT_EXTERNAL_INFORMATION_TOOL_ID, url: 'https://a.com/x', content: 'wrapped' },
  );
});

test('外部信息运行时：来源映射不写 sourceKind，文档条目在压缩阶段被当作 URL 并整批丢弃', async () => {
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([
      { ok: true, result: { content: 'd1', displayName: 'a.pdf' } },
      { ok: true, result: { content: 'd2', displayName: 'b.pdf' } },
      { ok: true, result: { content: 'u1', finalUrl: 'https://a.com/x' } },
    ]),
    sessionStore: makeStore(),
  });
  const r = await runtime.prepare({
    message: URL_MSG,
    documentFiles: [{ name: 'a.pdf' }, { name: 'b.pdf' }],
  });
  // 运行时的映射只补 sourceId / toolId / requestedUrl，不回填 sourceKind；
  // 压缩函数因此按 URL 形态要求 finalUrl，两条文档来源被静默过滤
  assert.deepEqual(
    r.sources.map((s) => [s.sourceId, s.sourceKind, 'requestedUrl' in s]),
    [['url-3', 'url', true]],
  );
});

test('外部信息运行时：返回值只含 reason 与 sources 两键，reason 来自意图判定', async () => {
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([{ ok: true, result: { content: 'c', finalUrl: 'https://a.com/x' } }]),
    sessionStore: makeStore(),
  });
  const r = await runtime.prepare({ message: URL_MSG });
  assert.deepEqual(Object.keys(r), ['reason', 'sources']);
  assert.ok(['explicit-url-reading', 'url-only-message'].includes(r.reason));
});

test('外部信息运行时：成功轨迹记录压缩后的来源数（空正文条目已被剔除）', async () => {
  const sessionStore = makeStore();
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([
      { ok: true, result: { content: 'keep', finalUrl: 'https://a.com/x' } },
      { ok: true, result: { content: '   ', finalUrl: 'https://b.com/y' } },
    ]),
    sessionStore,
  });
  const r = await runtime.prepare({ message: TWO_URL_MSG });
  assert.equal(r.sources.length, 1);
  assert.deepEqual(sessionStore.traces.at(-1), {
    type: 'external_tool.completed',
    status: 'success',
    toolId: AGENT_EXTERNAL_INFORMATION_TOOL_ID,
    toolIds: [AGENT_EXTERNAL_INFORMATION_TOOL_ID],
    ok: true,
    sourceCount: 1,
  });
});

test('外部信息运行时：每条轨迹同时转写为运行事件，runId 取当前运行', async () => {
  const sessionStore = makeStore();
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([{ ok: true, result: { content: 'c', finalUrl: 'https://a.com/x' } }]),
    sessionStore,
  });
  await runtime.prepare({ message: URL_MSG });
  assert.deepEqual(sessionStore.events, [
    {
      runId: 'run-1',
      type: 'external_tool.selected',
      status: 'running',
      commandId: AGENT_EXTERNAL_INFORMATION_TOOL_ID,
      ok: undefined,
      errorCode: undefined,
      message: undefined,
    },
    {
      runId: 'run-1',
      type: 'external_tool.completed',
      status: 'success',
      commandId: AGENT_EXTERNAL_INFORMATION_TOOL_ID,
      ok: true,
      errorCode: undefined,
      message: undefined,
    },
  ]);
});

test('外部信息运行时：无当前运行时 runId 回落空串，注册表缺席即按缺工具抛错', async () => {
  const sessionStore = makeStore();
  sessionStore.getCurrentRun = () => null;
  const runtime = createAgentExternalInformationRuntime({ toolRegistry: null, sessionStore });
  await assert.rejects(() => runtime.prepare({ message: URL_MSG }), /不支持读取该外部信息/);
  assert.equal(sessionStore.events[0].runId, '');
});

test('外部信息运行时：sessionStore 缺席时不写轨迹但仍完成读取', async () => {
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: makeRegistry([{ ok: true, result: { content: 'c', finalUrl: 'https://a.com/x' } }]),
  });
  const r = await runtime.prepare({ message: URL_MSG });
  assert.equal(r.sources[0].content, 'c');
});

test('外部信息运行时：prepare 无实参时按空消息处理并返回 null', async () => {
  const registry = makeRegistry([]);
  const runtime = createAgentExternalInformationRuntime({
    toolRegistry: registry,
    sessionStore: makeStore(),
  });
  assert.equal(await runtime.prepare(), null);
  assert.deepEqual(registry.calls, []);
});
