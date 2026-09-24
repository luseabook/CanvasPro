import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAgentExternalToolRegistry,
  createDefaultAgentExternalToolRegistry,
} from './agentExternalToolRegistry.js';

const goodTool = (over = {}) => {
  const value = (key, fallback) => (key in over ? over[key] : fallback);
  return {
    id: value('id', 'web.read_url'),
    title: value('title', 'Read URL'),
    description: value('description', 'read one url'),
    execute: value('execute', () => ({ ok: true, value: 1 })),
  };
};

const makeSignal = () => {
  const signal = {
    aborted: false,
    listeners: [],
    removed: [],
    addEventListener(kind, fn, options) {
      signal.listeners.push({ kind, fn, options });
    },
    removeEventListener(kind, fn) {
      signal.removed.push(kind + ':' + (fn ? 'fn' : 'null'));
      signal.listeners = signal.listeners.filter((entry) => entry.fn !== fn);
    },
    fire() {
      signal.aborted = true;
      [...signal.listeners].forEach((entry) => entry.fn());
    },
  };
  return signal;
};

test('id 规则：先 trim+toLowerCase 再校验，必须至少含一个分隔符段', () => {
  const registry = createAgentExternalToolRegistry();
  assert.equal(registry.register(goodTool({ id: ' WEB.Read_Url ' })), 'web.read_url');
  assert.equal(registry.get('web.read_url').title, 'Read URL');

  assert.throws(() => registry.register(goodTool({ id: '' })), {
    name: 'TypeError',
    message: 'Invalid Agent external tool id: <empty>',
  });
  assert.throws(() => registry.register(goodTool({ id: null })), {
    name: 'TypeError',
    message: 'Invalid Agent external tool id: <empty>',
  });
  // 无分隔符、以数字开头、以分隔符结尾都不合法
  for (const bad of ['plain', '1bad.id', 'bad.id-', '.bad.id']) {
    assert.throws(() => createAgentExternalToolRegistry().register(goodTool({ id: bad })), {
      name: 'TypeError',
    });
  }
});

test('execute 必须是函数，错误文案里带的是规范化后的 id', () => {
  const registry = createAgentExternalToolRegistry();
  assert.throws(() => registry.register({ id: 'Web.Read' }), {
    name: 'TypeError',
    message: 'Agent external tool web.read must provide execute()',
  });
  assert.throws(() => registry.register(goodTool({ execute: 'nope' })), {
    name: 'TypeError',
    message: 'Agent external tool web.read_url must provide execute()',
  });
});

test('定义冻结：register 只返回 id，title 回落 id、长度截断、riskLevel 恒为 read_only、schema 深拷贝', () => {
  const registry = createAgentExternalToolRegistry();
  const schema = { type: 'object', properties: { url: { type: 'string' } } };
  const registered = registry.register({
    id: 'a.b',
    title: 'x'.repeat(150),
    description: 'y'.repeat(600),
    inputSchema: schema,
    execute: () => ({}),
  });
  assert.equal(registered, 'a.b');
  const definition = registry.get('a.b');

  assert.equal(definition.title.length, 120);
  assert.equal(definition.description.length, 500);
  assert.equal(definition.riskLevel, 'read_only');
  assert.equal(definition.trust, 'untrusted_external');
  assert.equal(definition.validate, null);
  assert.deepEqual(definition.inputSchema, schema);
  assert.notEqual(definition.inputSchema, schema);
  assert.ok(Object.isFrozen(definition));

  schema.properties.url = 'mutated';
  assert.deepEqual(registry.get('a.b').inputSchema.properties, { url: { type: 'string' } });
});

test('title/description/inputSchema 缺省时回落 id 与空对象 schema', () => {
  const registry = createAgentExternalToolRegistry();
  registry.register({ id: 'only.execute', execute: () => ({}) });
  const definition = registry.get('only.execute');
  assert.equal(definition.title, 'only.execute');
  assert.equal(definition.description, '');
  assert.deepEqual(definition.inputSchema, { type: 'object', properties: {}, additionalProperties: false });

  // 只要 typeof === 'object' 就走克隆分支，数组同样是合法 schema；字符串才回落默认
  registry.register({ id: 'arr.schema', inputSchema: [1, 2], execute: () => ({}) });
  assert.deepEqual(registry.get('arr.schema').inputSchema, [1, 2]);
  assert.equal(Array.isArray(registry.get('arr.schema').inputSchema), true);
  registry.register({ id: 'str.schema', inputSchema: 'nope', execute: () => ({}) });
  assert.deepEqual(registry.get('str.schema').inputSchema, {
    type: 'object',
    properties: {},
    additionalProperties: false,
  });
});

test('重复注册抛错，且归一化后同 id 也算重复', () => {
  const registry = createAgentExternalToolRegistry({ tools: [goodTool()] });
  assert.throws(() => registry.register(goodTool({ id: 'Web.READ_URL' })), {
    name: 'Error',
    message: 'Agent external tool already registered: web.read_url',
  });
});

test('构造期 tools：非数组忽略，数组逐个注册', () => {
  assert.deepEqual(createAgentExternalToolRegistry({ tools: 'nope' }).list(), []);
  assert.deepEqual(createAgentExternalToolRegistry({ tools: null }).list(), []);
  const registry = createAgentExternalToolRegistry({
    tools: [goodTool(), goodTool({ id: 'doc.read' })],
  });
  assert.deepEqual(
    registry.list().map((entry) => entry.id),
    ['web.read_url', 'doc.read'],
  );
});

test('has/get 归一化入参，未知 id 返回 null 而不是 undefined', () => {
  const registry = createAgentExternalToolRegistry({ tools: [goodTool()] });
  assert.equal(registry.has('  WEB.Read_Url  '), true);
  assert.equal(registry.has('missing'), false);
  assert.equal(registry.has(), false);
  assert.equal(registry.get('missing'), null);
  assert.equal(registry.get(undefined), null);
  assert.equal(registry.get('web.read_url').id, 'web.read_url');
});

test('list 只暴露摘要，执行回调不外泄且 schema 为克隆体', () => {
  const registry = createAgentExternalToolRegistry({ tools: [goodTool()] });
  const [summary] = registry.list();
  assert.deepEqual(Object.keys(summary), ['id', 'title', 'description', 'inputSchema', 'riskLevel', 'trust']);
  assert.equal('execute' in summary, false);
  summary.inputSchema.injected = true;
  assert.equal(registry.list()[0].inputSchema.injected, undefined);
});

test('执行未注册工具：EXTERNAL_TOOL_NOT_FOUND 且 toolId 保留原样大小写', async () => {
  const registry = createAgentExternalToolRegistry();
  assert.deepEqual(await registry.execute({ toolId: 'Nope.Not_Found' }), {
    ok: false,
    status: 'failed',
    toolId: 'Nope.Not_Found',
    errorCode: 'EXTERNAL_TOOL_NOT_FOUND',
    message: 'External tool is not registered.',
  });
  assert.deepEqual(await registry.execute(), {
    ok: false,
    status: 'failed',
    toolId: '',
    errorCode: 'EXTERNAL_TOOL_NOT_FOUND',
    message: 'External tool is not registered.',
  });
});

test('已 abort 的 signal 直接返回 cancelled，不触碰 validate/execute', async () => {
  let touched = 0;
  const registry = createAgentExternalToolRegistry({
    tools: [
      {
        id: 'a.b',
        validate: () => {
          touched += 1;
          return true;
        },
        execute: () => {
          touched += 1;
          return {};
        },
      },
    ],
  });
  const result = await registry.execute({ toolId: 'a.b', signal: { aborted: true } });
  assert.deepEqual(result, {
    ok: false,
    status: 'cancelled',
    toolId: 'a.b',
    errorCode: 'EXTERNAL_TOOL_ABORTED',
    message: 'External tool request was cancelled.',
  });
  assert.equal(touched, 0);
});

test('validate 的三种拒绝形状与缺省放行', async () => {
  const run = async (validate) => {
    const registry = createAgentExternalToolRegistry({
      tools: [{ id: 'a.b', validate, execute: () => ({ ok: true }) }],
    });
    return registry.execute({ toolId: 'a.b' });
  };
  assert.deepEqual(await run(() => false), {
    ok: false,
    status: 'failed',
    toolId: 'a.b',
    errorCode: 'INVALID_EXTERNAL_TOOL_INPUT',
    message: 'External tool input is invalid.',
  });
  const shaped = await run(() => ({ ok: false, errorCode: 'custom_code', message: 'custom msg' }));
  assert.deepEqual(shaped, {
    ok: false,
    status: 'failed',
    toolId: 'a.b',
    errorCode: 'custom_code',
    message: 'custom msg',
  });
  // 只有 ok === false 才算拒绝；undefined / true / {ok:true} 均放行
  assert.equal((await run(() => undefined)).ok, true);
  assert.equal((await run(() => true)).ok, true);
  assert.equal((await run(() => ({ ok: true, note: 'x' }))).ok, true);
});

test('返回值里的 success:false / ok:false 转成 failed，message 回落 error 字段', async () => {
  const run = async (execute) => {
    const registry = createAgentExternalToolRegistry({ tools: [{ id: 'a.b', execute }] });
    return registry.execute({ toolId: 'a.b' });
  };
  assert.deepEqual(await run(() => ({ success: false, errorCode: 'E1', message: 'M1' })), {
    ok: false,
    status: 'failed',
    toolId: 'a.b',
    errorCode: 'E1',
    message: 'M1',
  });
  const onlyError = await run(() => ({ ok: false, error: 'from error field' }));
  assert.equal(onlyError.errorCode, 'EXTERNAL_TOOL_FAILED');
  assert.equal(onlyError.message, 'from error field');
  // 没有显式 success/ok 为 false 的返回值一律算成功，原样塞进 result
  assert.deepEqual(await run(() => ({})), { ok: true, status: 'success', toolId: 'a.b', result: {} });
  assert.equal((await run(() => ({ success: true, payload: 1 }))).result.payload, 1);
  assert.equal((await run(() => 'plain string')).ok, true);
});

test('抛异常时 code 优先、errorCode 次之，空 message 回落默认文案', async () => {
  const run = async (throwable) => {
    const registry = createAgentExternalToolRegistry({
      tools: [
        {
          id: 'a.b',
          execute: () => {
            throw throwable;
          },
        },
      ],
    });
    return registry.execute({ toolId: 'a.b' });
  };
  const coded = new Error('boom');
  coded.code = 'TOOL_CODE';
  const fromCode = await run(coded);
  assert.deepEqual(fromCode, {
    ok: false,
    status: 'failed',
    toolId: 'a.b',
    errorCode: 'TOOL_CODE',
    message: 'boom',
  });

  const named = new Error('second');
  named.errorCode = 'FROM_ERRORCODE';
  assert.equal((await run(named)).errorCode, 'FROM_ERRORCODE');

  const silent = new Error('');
  const fromSilent = await run(silent);
  assert.equal(fromSilent.errorCode, 'EXTERNAL_TOOL_FAILED');
  assert.equal(fromSilent.message, 'External tool failed.');

  const bare = await run({});
  assert.equal(bare.errorCode, 'EXTERNAL_TOOL_FAILED');
  assert.equal(bare.message, 'External tool failed.');
});

test('无 addEventListener 的 signal 原样透传给 execute，不装监听器', async () => {
  const seen = [];
  const registry = createAgentExternalToolRegistry({
    tools: [
      {
        id: 'a.b',
        execute: (args, context) => {
          seen.push({ args, context });
          return { ok: true };
        },
      },
    ],
  });
  await registry.execute({ toolId: 'a.b', args: { url: 'https://x' }, signal: { aborted: false } });
  assert.deepEqual(seen, [{ args: { url: 'https://x' }, context: { signal: { aborted: false } } }]);

  // 同步抛错在 Promise.resolve 求值阶段逃逸，仍被 execute 的 try/catch 收到
  const syncThrow = createAgentExternalToolRegistry({
    tools: [
      {
        id: 'c.d',
        execute: () => {
          throw new Error('sync boom');
        },
      },
    ],
  });
  const failed = await syncThrow.execute({ toolId: 'c.d' });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.message, 'sync boom');
});

test('可监听 signal：成功与失败路径都会摘掉 abort 监听，once 选项为 true', async () => {
  const okSignal = makeSignal();
  const registry = createAgentExternalToolRegistry({
    tools: [{ id: 'a.b', execute: () => ({ ok: true }) }],
  });
  assert.equal((await registry.execute({ toolId: 'a.b', signal: okSignal })).ok, true);
  assert.deepEqual(okSignal.removed, ['abort:fn']);
  assert.equal(okSignal.listeners.length, 0);

  const failSignal = makeSignal();
  const failing = createAgentExternalToolRegistry({
    tools: [
      {
        id: 'a.b',
        execute: async () => {
          throw new Error('late boom');
        },
      },
    ],
  });
  const result = await failing.execute({ toolId: 'a.b', signal: failSignal });
  assert.deepEqual(result, {
    ok: false,
    status: 'failed',
    toolId: 'a.b',
    errorCode: 'EXTERNAL_TOOL_FAILED',
    message: 'late boom',
  });
  assert.equal(failSignal.listeners.length, 0);

  // 监听器以 {once:true} 注册，成功路径再手动摘除一次
  const shapeSignal = makeSignal();
  const shape = createAgentExternalToolRegistry({
    tools: [
      {
        id: 'a.b',
        execute: (_args, context) => {
          shapeSignal.pushedListeners = [...context.signal.listeners];
          return {};
        },
      },
    ],
  });
  await shape.execute({ toolId: 'a.b', signal: shapeSignal });
  assert.equal(shapeSignal.pushedListeners.length, 1);
  assert.deepEqual(shapeSignal.pushedListeners[0], {
    kind: 'abort',
    fn: shapeSignal.pushedListeners[0].fn,
    options: { once: true },
  });
  assert.deepEqual(shapeSignal.listeners, []);
});

test('执行中 abort：拒绝为 EXTERNAL_TOOL_ABORTED 且状态按 signal.aborted 判定', async () => {
  const signal = makeSignal();
  const registry = createAgentExternalToolRegistry({
    tools: [
      {
        id: 'a.b',
        execute: async (_args, context) => {
          context.signal.fire();
          return { ok: true };
        },
      },
    ],
  });
  assert.deepEqual(await registry.execute({ toolId: 'a.b', signal }), {
    ok: false,
    status: 'cancelled',
    toolId: 'a.b',
    errorCode: 'EXTERNAL_TOOL_ABORTED',
    message: 'External tool request was cancelled.',
  });
});

test('真实 AbortController 也能中止：监听器在 abort 事件里被调用', async () => {
  const controller = new AbortController();
  const registry = createAgentExternalToolRegistry({
    tools: [
      {
        id: 'a.b',
        execute: (_args, context) =>
          new Promise((resolve) => {
            context.signal.addEventListener('abort', () => resolve({ never: true }));
            controller.abort();
          }),
      },
    ],
  });
  const result = await registry.execute({ toolId: 'a.b', signal: controller.signal });
  assert.equal(result.status, 'cancelled');
  assert.equal(result.errorCode, 'EXTERNAL_TOOL_ABORTED');
});

test('默认注册表只有 web.read_url 与 document.read_file 两个只读外部工具', () => {
  const registry = createDefaultAgentExternalToolRegistry();
  assert.deepEqual(registry.list(), [
    {
      id: 'web.read_url',
      title: 'Read URL',
      description: 'Read bounded text content from one public HTTP or HTTPS URL.',
      inputSchema: {
        type: 'object',
        properties: { url: { type: 'string', format: 'uri' } },
        required: ['url'],
        additionalProperties: false,
      },
      riskLevel: 'read_only',
      trust: 'untrusted_external',
    },
    {
      id: 'document.read_file',
      title: 'Read document',
      description: 'Extract bounded text from one attached TXT, DOCX, or text-based PDF file.',
      inputSchema: {
        type: 'object',
        properties: { file: { type: 'object' } },
        required: ['file'],
        additionalProperties: false,
      },
      riskLevel: 'read_only',
      trust: 'untrusted_external',
    },
  ]);
});

test('默认注册表：读取器缺省时分别返回 URL_READER_UNAVAILABLE / DOCUMENT_READER_UNAVAILABLE', async () => {
  const registry = createDefaultAgentExternalToolRegistry();
  assert.deepEqual(await registry.execute({ toolId: 'web.read_url', args: { url: 'https://a' } }), {
    ok: false,
    status: 'failed',
    toolId: 'web.read_url',
    errorCode: 'URL_READER_UNAVAILABLE',
    message: 'URL reading is unavailable in this runtime.',
  });
  const documentFailure = await registry.execute({
    toolId: 'document.read_file',
    args: { file: { name: 'a.txt' } },
  });
  assert.equal(documentFailure.errorCode, 'DOCUMENT_READER_UNAVAILABLE');
  assert.equal(documentFailure.message, '文档读取在当前运行环境中不可用。');
});

test('web.read_url：空白 url 报 URL_REQUIRED，非空时只转发 {url}', async () => {
  const calls = [];
  const registry = createDefaultAgentExternalToolRegistry({
    readUrl: async (input) => {
      calls.push(input);
      return { ok: true, text: 'page' };
    },
  });
  for (const args of [{}, { url: '   ' }, { url: null }]) {
    const result = await registry.execute({ toolId: 'web.read_url', args });
    assert.deepEqual(result, {
      ok: false,
      status: 'failed',
      toolId: 'web.read_url',
      errorCode: 'URL_REQUIRED',
      message: 'URL is required.',
    });
  }
  assert.deepEqual(calls, []);
  const success = await registry.execute({ toolId: 'web.read_url', args: { url: ' https://a ' } });
  assert.equal(success.ok, true);
  assert.deepEqual(calls, [{ url: ' https://a ' }]);
});

test('document.read_file：校验失败码固定，文档校验器的中文错误可折叠改写', async () => {
  const noValidator = await createDefaultAgentExternalToolRegistry().execute({
    toolId: 'document.read_file',
    args: {},
  });
  assert.deepEqual(noValidator, {
    ok: false,
    status: 'failed',
    toolId: 'document.read_file',
    errorCode: 'DOCUMENT_FILE_INVALID',
    message: '请选择文档。',
  });

  const registry = createDefaultAgentExternalToolRegistry({
    validateDocument: (file) => (file?.ok === true ? { ok: true } : { ok: false, error: '作为剧本读取失败' }),
    readDocument: async () => ({ text: 'body' }),
  });
  const rejected = await registry.execute({ toolId: 'document.read_file', args: { file: { ok: false } } });
  assert.equal(rejected.errorCode, 'DOCUMENT_FILE_INVALID');
  assert.equal(rejected.message, '作为文档读取失败');
  const accepted = await registry.execute({ toolId: 'document.read_file', args: { file: { ok: true } } });
  assert.equal(accepted.ok, true);
});

test('document.read_file 成功时包装为 {success:true, source}，signal 透传给读取器', async () => {
  const seen = [];
  const registry = createDefaultAgentExternalToolRegistry({
    validateDocument: () => ({ ok: true }),
    readDocument: async (file, options) => {
      seen.push({ file, options });
      return { fileName: file.name, text: 'hello', characterCount: 5, pageCount: 2, warnings: ['w', ''] };
    },
  });
  const signal = { aborted: false };
  const result = await registry.execute({
    toolId: 'document.read_file',
    args: { file: { name: 'note.txt' } },
    signal,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(seen, [{ file: { name: 'note.txt' }, options: { signal } }]);
  assert.deepEqual(result.result, {
    success: true,
    source: {
      sourceKind: 'document',
      displayName: 'note.txt',
      title: 'note.txt',
      contentType: 'text/plain',
      extension: 'txt',
      content: 'hello',
      characterCount: 5,
      pageCount: 2,
      warnings: ['w'],
      truncated: false,
    },
  });
});
