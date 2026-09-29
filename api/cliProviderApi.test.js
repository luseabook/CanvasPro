import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLI_PROVIDER_STATUS_CHANGED_EVENT,
  _resetCliProviderModelsCacheForTests,
  _resetCliProviderStatusesCacheForTests,
  fetchCliProviderModels,
  fetchCliProviderStatuses,
  generateImageWithCliProvider,
  generateTextWithCliProvider,
  getCachedCliProviderModels,
  getCachedCliProviderStatus,
  logoutCliProvider,
  startCliProviderLogin,
} from './cliProviderApi.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sseResponse(chunks) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function restoreGlobals(t, originals) {
  t.after(() => {
    globalThis.fetch = originals.fetch;
    if (originals.window === undefined) delete globalThis.window;
    else globalThis.window = originals.window;
    if (originals.CustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = originals.CustomEvent;
    _resetCliProviderStatusesCacheForTests();
    _resetCliProviderModelsCacheForTests();
  });
}

test('cliProviderApi: 状态拉取写入缓存并广播变更事件', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderStatusesCacheForTests();

  const events = [];
  globalThis.window = {
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init) {
      this.type = type;
      this.detail = init?.detail;
    }
  };

  const calls = [];
  const payload = {
    providers: {
      codex: { installed: true, version: 1 },
      claude: { installed: false },
    },
  };
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return jsonResponse(payload);
  };

  assert.deepEqual(await fetchCliProviderStatuses(), payload);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/v2/cli-providers/status');
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(events.length, 1);
  assert.equal(events[0].type, CLI_PROVIDER_STATUS_CHANGED_EVENT);

  const codex = getCachedCliProviderStatus(' Codex ');
  assert.deepEqual(codex, { installed: true, version: 1 });
  codex.installed = false;
  assert.deepEqual(getCachedCliProviderStatus('codex'), { installed: true, version: 1 });
  assert.equal(getCachedCliProviderStatus('missing'), null);
  assert.equal(getCachedCliProviderStatus(''), null);
});

test('cliProviderApi: 状态缓存兼容顶层 provider 键并忽略畸形值', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderStatusesCacheForTests();
  delete globalThis.window;

  globalThis.fetch = async () =>
    jsonResponse({
      codex: { installed: true },
      bad: 'x',
      list: [1],
    });

  await fetchCliProviderStatuses();
  assert.deepEqual(getCachedCliProviderStatus('codex'), { installed: true });
  assert.equal(getCachedCliProviderStatus('bad'), null);
  assert.equal(getCachedCliProviderStatus('list'), null);
});

test('cliProviderApi: 状态失败不写缓存也不广播', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderStatusesCacheForTests();

  const events = [];
  globalThis.window = {
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };
  globalThis.fetch = async () => jsonResponse({ error: 'status boom' }, 500);

  await assert.rejects(fetchCliProviderStatuses(), /status boom/);
  assert.equal(getCachedCliProviderStatus('codex'), null);
  assert.equal(events.length, 0);
});

test('cliProviderApi: 模型目录缓存、复制、强制刷新与并发去重', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderModelsCacheForTests();

  let calls = 0;
  globalThis.fetch = async (url, options = {}) => {
    calls += 1;
    assert.equal(String(url), '/api/v2/cli-providers/codex/models');
    assert.equal(options.method, 'GET');
    return jsonResponse({ version: calls, models: [{ id: `m${calls}` }] });
  };

  const first = await fetchCliProviderModels(' Codex ');
  assert.deepEqual(first, { version: 1, models: [{ id: 'm1' }] });
  first.models[0].id = 'mutated';
  assert.deepEqual(getCachedCliProviderModels('CODEX'), { version: 1, models: [{ id: 'm1' }] });

  assert.deepEqual(await fetchCliProviderModels('codex'), { version: 1, models: [{ id: 'm1' }] });
  assert.equal(calls, 1);

  assert.deepEqual(await fetchCliProviderModels('codex', { force: true }), {
    version: 2,
    models: [{ id: 'm2' }],
  });
  assert.equal(calls, 2);

  _resetCliProviderModelsCacheForTests();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let inFlightCalls = 0;
  globalThis.fetch = async () => {
    inFlightCalls += 1;
    await gate;
    return jsonResponse({ version: 9, models: [] });
  };

  const pendingA = fetchCliProviderModels('Codex');
  const pendingB = fetchCliProviderModels('codex');
  release();
  const [resultA, resultB] = await Promise.all([pendingA, pendingB]);
  assert.equal(inFlightCalls, 1);
  assert.deepEqual(resultA, { version: 9, models: [] });
  assert.deepEqual(resultB, { version: 9, models: [] });
});

test('cliProviderApi: 模型目录拒绝空 provider、失败响应与无效目录', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderModelsCacheForTests();

  await assert.rejects(fetchCliProviderModels('   '), /CLI provider 不能为空/);

  globalThis.fetch = async () => jsonResponse({ error: 'models boom' }, 500);
  await assert.rejects(fetchCliProviderModels('codex'), /models boom/);
  assert.equal(getCachedCliProviderModels('codex'), null);

  globalThis.fetch = async () => jsonResponse('not-a-catalog');
  await assert.rejects(fetchCliProviderModels('codex'), /CLI Provider 返回了无效的模型列表/);
  assert.equal(getCachedCliProviderModels('codex'), null);
});

test('cliProviderApi: 登录与退出使用规范化 provider，并清除模型缓存', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderModelsCacheForTests();

  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const path = String(url);
    calls.push({ url: path, options });
    if (path.endsWith('/models')) return jsonResponse({ models: [{ id: 'm1' }] });
    if (path.endsWith('/login')) return jsonResponse({ provider: 'codex', phase: 'ready' });
    if (path.endsWith('/logout')) return jsonResponse({ provider: 'codex', phase: 'missing' });
    throw new Error(`unexpected url: ${path}`);
  };

  await fetchCliProviderModels('codex');
  assert.notEqual(getCachedCliProviderModels('codex'), null);

  assert.deepEqual(await startCliProviderLogin(' Codex '), { provider: 'codex', phase: 'ready' });
  assert.equal(calls[1].url, '/api/v2/cli-providers/codex/login');
  assert.equal(calls[1].options.method, 'POST');
  assert.equal(calls[1].options.body, '{}');

  assert.deepEqual(await logoutCliProvider('CODEX'), { provider: 'codex', phase: 'missing' });
  assert.equal(calls[2].url, '/api/v2/cli-providers/codex/logout');
  assert.equal(calls[2].options.method, 'POST');
  assert.equal(getCachedCliProviderModels('codex'), null);
});

test('cliProviderApi: 文本生成非流式走 POST 并剥离 onText/signal', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);

  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return jsonResponse({ text: 'hello' });
  };

  assert.deepEqual(
    await generateTextWithCliProvider({
      provider: 'codex',
      prompt: 'hi',
      onText: undefined,
      signal: undefined,
      timeoutMs: 1000,
      temperature: 0.2,
    }),
    { text: 'hello' },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/v2/cli-providers/generate-text');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    provider: 'codex',
    prompt: 'hi',
    timeoutMs: 1000,
    temperature: 0.2,
  });
});

test('cliProviderApi: 文本生成传入 onText 时走 SSE 并回传累计文本', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);

  const chunks = [];
  globalThis.fetch = async (url, options = {}) => {
    assert.equal(String(url), '/api/v2/cli-providers/generate-text');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Accept, 'text/event-stream');
    assert.deepEqual(JSON.parse(options.body), { provider: 'codex', prompt: 'hi', stream: true });
    return sseResponse([
      'data: {"choices":[{"index":0,"delta":{"content":"你"}}]}\n\n',
      'data: {"choices":[{"index":0,"delta":{"content":"好"}}]}\n\n',
      'data: {"choices":[{"index":0,"finish_reason":"stop"}]}\n\n',
      'data: [DONE]\n\n',
    ]);
  };

  const result = await generateTextWithCliProvider({
    provider: 'codex',
    prompt: 'hi',
    onText: (text) => chunks.push(text),
  });
  assert.deepEqual(result, { text: '你好', provider: 'codex' });
  assert.deepEqual(chunks, ['你', '你好']);
});

test('cliProviderApi: 图像生成夹取超时并回传结果', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);

  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return jsonResponse({ images: [{ url: 'x' }] });
  };

  assert.deepEqual(await generateImageWithCliProvider({ provider: 'codex', prompt: 'p', timeoutMs: 5000 }), {
    images: [{ url: 'x' }],
  });
  assert.equal(calls[0].url, '/api/v2/cli-providers/generate-image');
  assert.equal(JSON.parse(calls[0].options.body).timeoutMs, 30000);

  await generateImageWithCliProvider({ provider: 'codex', prompt: 'p', timeoutMs: 1234567 });
  assert.equal(JSON.parse(calls[1].options.body).timeoutMs, 900000);

  await generateImageWithCliProvider({ provider: 'codex', prompt: 'p' });
  assert.equal(JSON.parse(calls[2].options.body).timeoutMs, 600000);
});

test('cliProviderApi: 失败响应把服务端错误原样抛出', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderStatusesCacheForTests();
  _resetCliProviderModelsCacheForTests();

  globalThis.fetch = async (url) => {
    const path = String(url);
    if (path.endsWith('/status')) return jsonResponse({ error: 'status failed' }, 500);
    if (path.endsWith('/models')) return jsonResponse({ error: 'models failed' }, 500);
    if (path.endsWith('/login')) return jsonResponse({ error: 'login failed' }, 500);
    if (path.endsWith('/logout')) return jsonResponse({ error: 'logout failed' }, 500);
    if (path.endsWith('/generate-text')) return jsonResponse({ error: 'text failed' }, 500);
    if (path.endsWith('/generate-image')) return jsonResponse({ error: 'image failed' }, 500);
    throw new Error(`unexpected url: ${path}`);
  };

  await assert.rejects(fetchCliProviderStatuses(), /status failed/);
  await assert.rejects(fetchCliProviderModels('codex'), /models failed/);
  await assert.rejects(startCliProviderLogin('codex'), /login failed/);
  await assert.rejects(logoutCliProvider('codex'), /logout failed/);
  await assert.rejects(generateTextWithCliProvider({ provider: 'codex', prompt: 'x' }), /text failed/);
  await assert.rejects(generateImageWithCliProvider({ provider: 'codex', prompt: 'x' }), /image failed/);
});

test('cliProviderApi: 测试重置函数清空状态与模型缓存', async (t) => {
  const originals = {
    fetch: globalThis.fetch,
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
  };
  restoreGlobals(t, originals);
  _resetCliProviderStatusesCacheForTests();
  _resetCliProviderModelsCacheForTests();

  globalThis.fetch = async (url) => {
    if (String(url).endsWith('/status')) return jsonResponse({ codex: { installed: true } });
    return jsonResponse({ models: [] });
  };

  await fetchCliProviderStatuses();
  await fetchCliProviderModels('codex');
  assert.notEqual(getCachedCliProviderStatus('codex'), null);
  assert.notEqual(getCachedCliProviderModels('codex'), null);

  _resetCliProviderStatusesCacheForTests();
  _resetCliProviderModelsCacheForTests();
  assert.equal(getCachedCliProviderStatus('codex'), null);
  assert.equal(getCachedCliProviderModels('codex'), null);
});
