import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PASSED_PROVIDER_CONNECTION_STATUS,
  formatProviderDiagnosticDetail,
  isProviderConnectionVerified,
  shouldPersistProviderConnectionResult,
  reconcileProviderConnectionVerification,
  mergePassedProviderApiConfig,
  mergeCurrentProviderConnectionResults,
} from './providerConnectionVerification.js';

test('通过态常量', () => {
  assert.equal(PASSED_PROVIDER_CONNECTION_STATUS, 'passed');
});

test('formatProviderDiagnosticDetail：首行取 suggestion > summary > error > detail 的短路优先级', () => {
  assert.equal(formatProviderDiagnosticDetail({}), '');
  assert.equal(formatProviderDiagnosticDetail({ detail: 'd' }), 'd\nd');
  assert.equal(
    formatProviderDiagnosticDetail({ error: 'e', detail: 'd' }),
    'e\nd',
    'error 命中首行，detail 仍由 else 分支补一行',
  );
  assert.equal(formatProviderDiagnosticDetail({ summary: 's', error: 'e', detail: 'd' }), 's\nd');
  assert.equal(
    formatProviderDiagnosticDetail({ suggestion: 'g', summary: 's', error: 'e', detail: 'd' }),
    'g\nd',
  );
  assert.equal(formatProviderDiagnosticDetail({ suggestion: '' }), '');
});

test('formatProviderDiagnosticDetail：steps 为空数组或非数组时都走 else 分支（detail 会被写两次）', () => {
  assert.equal(
    formatProviderDiagnosticDetail({ steps: [], detail: 'd' }),
    'd\nd',
    '首行短路到 detail，else 分支再补一次',
  );
  assert.equal(formatProviderDiagnosticDetail({ steps: 'x', detail: 'd' }), 'd\nd');
  assert.equal(formatProviderDiagnosticDetail({ steps: [], suggestion: 'g', detail: 'd' }), 'g\nd');
  assert.equal(formatProviderDiagnosticDetail({ steps: [{ ok: true }] }), '步骤：通过');
  assert.equal(formatProviderDiagnosticDetail({ steps: [{ id: 'a', ok: true }] }), 'a：通过');
});

test('formatProviderDiagnosticDetail：步骤标签取 label > id > overrides.step > 「步骤」', () => {
  assert.equal(formatProviderDiagnosticDetail({ steps: [{ label: 'L', id: 'i', ok: true }] }), 'L：通过');
  assert.equal(formatProviderDiagnosticDetail({ steps: [{ id: 'i', ok: false }] }), 'i：失败');
  assert.equal(formatProviderDiagnosticDetail({ steps: [{}] }, { step: '检查项' }), '检查项：失败');
});

test('formatProviderDiagnosticDetail：三态文案可被第二参数覆盖，skipped 优先于 ok', () => {
  const steps = [
    { id: 'a', ok: true, skipped: true },
    { id: 'b', ok: true },
    { id: 'c', ok: false },
  ];
  assert.equal(formatProviderDiagnosticDetail({ steps }), 'a：跳过\nb：通过\nc：失败');
  assert.equal(
    formatProviderDiagnosticDetail({ steps }, { skipped: 'S', passed: 'P', failed: 'F' }),
    'a：S\nb：P\nc：F',
  );
  assert.equal(
    formatProviderDiagnosticDetail({ steps }, { passed: 0 }),
    'a：跳过\nb：通过\nc：失败',
    '覆盖值为假值时回落内置中文',
  );
});

test('formatProviderDiagnosticDetail：步骤的 message 与 detail 用「 · 」拼接并按首次出现去重', () => {
  assert.equal(
    formatProviderDiagnosticDetail({ steps: [{ id: 'a', ok: false, message: 'm', detail: 'dd' }] }),
    'a：失败 - m · dd',
  );
  assert.equal(
    formatProviderDiagnosticDetail({ steps: [{ id: 'a', ok: false, message: ' x ', detail: 'x' }] }),
    'a：失败 - x',
  );
  assert.equal(
    formatProviderDiagnosticDetail({ steps: [{ id: 'a', ok: false, detail: 'only' }] }),
    'a：失败 - only',
  );
  assert.equal(
    formatProviderDiagnosticDetail({ steps: [{ id: 'a', ok: false, message: {}, detail: 0 }] }),
    'a：失败 - [object Object]',
  );
});

test('isProviderConnectionVerified：只认 passed 且 provider id 做 trim+小写归一', () => {
  const state = { providers: { openai: { connectionVerification: { status: 'passed' } } } };
  assert.equal(isProviderConnectionVerified(state, ' OPENAI '), true);
  assert.equal(isProviderConnectionVerified(state, 'unknown'), false);
  assert.equal(isProviderConnectionVerified(state), false);
  assert.equal(isProviderConnectionVerified({}, 'openai'), false);
  assert.equal(isProviderConnectionVerified(), false);
  assert.equal(
    isProviderConnectionVerified(
      { providers: { p: { connectionVerification: { status: 'partial' } } } },
      'p',
    ),
    false,
  );
});

test('shouldPersistProviderConnectionResult：ok 为真一律落盘，与 provider id 无关', () => {
  assert.equal(shouldPersistProviderConnectionResult('', { ok: true }), true);
  assert.equal(shouldPersistProviderConnectionResult('whatever', { ok: true, steps: [] }), true);
  assert.equal(shouldPersistProviderConnectionResult('x', { ok: 1 }), false);
});

test('shouldPersistProviderConnectionResult：非 RunningHub/ComfyUI 一律不落盘', () => {
  assert.equal(shouldPersistProviderConnectionResult('openai', { steps: [{ id: 'auth', ok: true }] }), false);
  assert.equal(shouldPersistProviderConnectionResult('', { steps: [{ id: 'service', ok: true }] }), false);
});

test('shouldPersistProviderConnectionResult：comfyui 只看步骤 id 且忽略 ok，runninghub 还要求 ok 为真', () => {
  assert.equal(
    shouldPersistProviderConnectionResult('comfyui', { steps: [{ id: 'service', ok: false }] }),
    true,
  );
  assert.equal(
    shouldPersistProviderConnectionResult('comfyui', { steps: [{ id: 'cloud', skipped: true }] }),
    false,
  );
  assert.equal(
    shouldPersistProviderConnectionResult('comfyui', { steps: [{ id: 'auth', ok: true }] }),
    false,
  );
  assert.equal(shouldPersistProviderConnectionResult('comfyui'), false);
  for (const id of ['runninghub', ' RUNNINGHUB-International ']) {
    assert.equal(shouldPersistProviderConnectionResult(id, { steps: [{ id: 'model', ok: true }] }), true);
    assert.equal(shouldPersistProviderConnectionResult(id, { steps: [{ id: 'upload', ok: false }] }), false);
    assert.equal(shouldPersistProviderConnectionResult(id, { steps: [{ id: 'service', ok: true }] }), false);
  }
});

test('reconcile：非对象第二参数被换成新对象，返回体永远是新副本', () => {
  for (const next of [undefined, null, 'x', 5]) {
    const r = reconcileProviderConnectionVerification({}, next, 'openai');
    assert.deepEqual(r, {});
    assert.notEqual(r, next);
  }
  const base = { apiUrl: 'a' };
  assert.notEqual(reconcileProviderConnectionVerification({}, base, 'openai'), base);
});

test('reconcile：runninghub 无历史校验结果时原样返回副本', () => {
  const next = { apiUrl: 'a', apiKey: 'k' };
  const r = reconcileProviderConnectionVerification({ apiUrl: 'a', apiKey: 'k' }, next, 'runninghub');
  assert.deepEqual(r, next);
});

test('reconcile：runninghub 凭据未变时保留旧能力并按保留结果重算状态', () => {
  const prev = {
    apiUrl: 'a',
    apiKey: 'k',
    modelApiKey: 'm',
    connectionVerification: {
      status: 'passed',
      verifiedAt: 1,
      capabilities: { workflow: { status: 'passed', verifiedAt: 1 } },
    },
  };
  const r = reconcileProviderConnectionVerification(prev, { ...prev }, 'runninghub-international');
  assert.equal(r.connectionVerification.status, 'partial');
  assert.deepEqual(Object.keys(r.connectionVerification.capabilities), ['workflow']);
  assert.equal(r.connectionVerification.verifiedAt, 1);
});

test('reconcile：runninghub 凭据变更后没有任何可保留能力时直接删键', () => {
  const prev = {
    apiUrl: 'a',
    apiKey: 'k',
    connectionVerification: { status: 'passed', capabilities: { workflow: { status: 'passed' } } },
  };
  const r = reconcileProviderConnectionVerification(prev, { ...prev, apiKey: 'k2' }, 'runninghub');
  assert.equal('connectionVerification' in r, false);
  assert.equal(r.apiKey, 'k2');
});

test('reconcile：comfyui 按 apiUrl / cloudApiUrl 分别决定 local / cloud 能力是否保留', () => {
  const prev = {
    apiUrl: 'a',
    cloudApiUrl: 'c',
    connectionVerification: {
      status: 'passed',
      capabilities: {
        local: { status: 'passed', verifiedAt: 2 },
        cloud: { status: 'passed', verifiedAt: 3 },
      },
    },
  };
  const both = reconcileProviderConnectionVerification(prev, { ...prev }, 'comfyUI');
  assert.deepEqual(Object.keys(both.connectionVerification.capabilities).sort(), ['cloud', 'local']);
  assert.equal(both.connectionVerification.status, 'passed');
  const onlyLocal = reconcileProviderConnectionVerification(prev, { ...prev, cloudApiUrl: 'zzz' }, 'comfyui');
  assert.deepEqual(Object.keys(onlyLocal.connectionVerification.capabilities), ['local']);
  assert.equal(
    onlyLocal.connectionVerification.status,
    'partial',
    'cloudApiUrl 仍非空 ⇒ cloud 计入已配置能力但状态 unknown ⇒ 非全 passed',
  );
  const none = reconcileProviderConnectionVerification(
    prev,
    { ...prev, apiUrl: 'x', cloudApiUrl: 'y' },
    'comfyui',
  );
  assert.equal('connectionVerification' in none, false);
});

test('reconcile：其它 provider 只在连接标识变化时删键，apimart 额外把 routeId 计入标识', () => {
  const prev = { apiUrl: 'a', apiKey: 'k', connectionVerification: { status: 'passed' } };
  assert.equal(
    reconcileProviderConnectionVerification(prev, { ...prev }, 'openai').connectionVerification.status,
    'passed',
  );
  assert.equal(
    'connectionVerification' in
      reconcileProviderConnectionVerification(prev, { ...prev, apiKey: 'z' }, 'openai'),
    false,
  );
  const am = { apiUrl: 'a', apiKey: 'k', routeId: 'r1', connectionVerification: { status: 'passed' } };
  assert.deepEqual(reconcileProviderConnectionVerification(am, { ...am, routeId: 'r2' }, 'apimart'), {
    apiUrl: 'a',
    apiKey: 'k',
    routeId: 'r2',
  });
  assert.equal(
    'connectionVerification' in
      reconcileProviderConnectionVerification(am, { ...am, apiKey: 'other' }, 'apimart'),
    false,
    'apimart 的标识同样含 apiKey，故改 key 会删掉旧校验结果',
  );
});

test('mergePassedProviderApiConfig：普通 provider 直接写 passed + verifiedAt，且返回新对象不改写入参', () => {
  const base = { theme: 'd', providers: { openai: { apiKey: 'k' } } };
  const r = mergePassedProviderApiConfig(base, { providers: {} }, ['OpenAI'], new Map(), { verifiedAt: 7 });
  assert.deepEqual(r, {
    theme: 'd',
    providers: { openai: { apiKey: 'k', connectionVerification: { status: 'passed', verifiedAt: 7 } } },
  });
  assert.equal('connectionVerification' in base.providers.openai, false);
});

test('mergePassedProviderApiConfig：空/未知 id 被跳过，verifiedAt 非数字时回落当前时间', () => {
  const r = mergePassedProviderApiConfig({}, {}, ['', '   ', null], new Map(), { verifiedAt: 0 });
  assert.deepEqual(r, { providers: {} });
  const r2 = mergePassedProviderApiConfig({}, {}, ['x'], new Map(), {});
  assert.ok(Number.isFinite(r2.providers.x.connectionVerification.verifiedAt));
});

test('mergePassedProviderApiConfig：入参三层合并优先级 base < next < override map，非 Map 第四参数视作空', () => {
  const base = { providers: { p: { apiKey: 'b', keep: 1 } } };
  const next = { providers: { p: { apiKey: 'n' } } };
  const r = mergePassedProviderApiConfig(base, next, ['p'], new Map([['p', { apiKey: 'o' }]]), {
    verifiedAt: 1,
  });
  assert.deepEqual(r.providers.p, {
    apiKey: 'o',
    keep: 1,
    connectionVerification: { status: 'passed', verifiedAt: 1 },
  });
  const r2 = mergePassedProviderApiConfig(base, next, ['p'], { p: { apiKey: 'o' } }, { verifiedAt: 1 });
  assert.equal(r2.providers.p.apiKey, 'n');
});

test('mergePassedProviderApiConfig：runninghub 由步骤映射到能力并综合已配置凭据算状态', () => {
  const next = { providers: { runninghub: { apiUrl: 'a', apiKey: 'k', modelApiKey: 'm' } } };
  const results = {
    runninghub: {
      steps: [
        { id: 'auth', ok: true },
        { id: 'model', ok: true },
      ],
    },
  };
  const r = mergePassedProviderApiConfig({}, next, ['runninghub'], new Map(), {
    verifiedAt: 5,
    providerResults: results,
  });
  assert.deepEqual(r.providers.runninghub.connectionVerification, {
    status: 'passed',
    verifiedAt: 5,
    capabilities: {
      workflow: { status: 'passed', verifiedAt: 5 },
      modelApi: { status: 'passed', verifiedAt: 5 },
    },
  });
});

test('mergePassedProviderApiConfig：只配了一半凭据时得 partial，步骤缺失算 unknown', () => {
  const next = { providers: { runninghub: { apiUrl: 'a', apiKey: 'k', modelApiKey: 'm' } } };
  const r = mergePassedProviderApiConfig({}, next, ['runninghub'], new Map(), {
    verifiedAt: 5,
    providerResults: { runninghub: { steps: [{ id: 'auth', ok: true }] } },
  });
  assert.equal(r.providers.runninghub.connectionVerification.status, 'partial');
  assert.deepEqual(Object.keys(r.providers.runninghub.connectionVerification.capabilities), ['workflow']);
  const none = mergePassedProviderApiConfig({}, next, ['runninghub'], new Map(), { verifiedAt: 5 });
  assert.equal(none.providers.runninghub.connectionVerification.status, 'failed');
  assert.equal('capabilities' in none.providers.runninghub.connectionVerification, false);
});

test('mergePassedProviderApiConfig：无凭据时 runninghub 恒 failed，skipped 步骤被忽略', () => {
  const r = mergePassedProviderApiConfig(
    {},
    { providers: { runninghub: { apiUrl: 'a', apiKey: '  ', modelApiKey: '' } } },
    ['runninghub'],
    new Map(),
    {
      verifiedAt: 9,
      providerResults: {
        runninghub: {
          steps: [
            { id: 'model', ok: true },
            { id: 'auth', ok: true, skipped: true },
          ],
        },
      },
    },
  );
  assert.deepEqual(r.providers.runninghub.connectionVerification, {
    status: 'failed',
    verifiedAt: 9,
    capabilities: { modelApi: { status: 'passed', verifiedAt: 9 } },
  });
});

test('mergePassedProviderApiConfig：comfyui 的 local 恒被计入，cloud 取决于 cloudApiUrl', () => {
  const results = {
    comfyui: {
      steps: [
        { id: 'service', ok: true },
        { id: 'cloud', ok: false },
      ],
    },
  };
  const local = mergePassedProviderApiConfig(
    {},
    { providers: { comfyui: { apiUrl: 'u' } } },
    ['comfyui'],
    new Map(),
    {
      verifiedAt: 3,
      providerResults: results,
    },
  );
  assert.deepEqual(local.providers.comfyui.connectionVerification, {
    status: 'passed',
    verifiedAt: 3,
    capabilities: {
      local: { status: 'passed', verifiedAt: 3 },
      cloud: { status: 'failed', verifiedAt: 3 },
    },
  });
  const both = mergePassedProviderApiConfig(
    {},
    { providers: { comfyui: { apiUrl: 'u', cloudApiUrl: 'c' } } },
    ['comfyui'],
    new Map(),
    { verifiedAt: 3, providerResults: results },
  );
  assert.equal(both.providers.comfyui.connectionVerification.status, 'partial');
  assert.deepEqual(Object.keys(both.providers.comfyui.connectionVerification.capabilities).sort(), [
    'cloud',
    'local',
  ]);
});

test('mergePassedProviderApiConfig：comfyui 保留 base 的旧能力（标识未变时）', () => {
  const base = {
    providers: {
      comfyui: {
        apiUrl: 'u',
        cloudApiUrl: 'c',
        connectionVerification: { capabilities: { cloud: { status: 'passed', verifiedAt: 1 } } },
      },
    },
  };
  const next = { providers: { comfyui: { apiUrl: 'u', cloudApiUrl: 'c' } } };
  const r = mergePassedProviderApiConfig(base, next, ['comfyui'], new Map(), {
    verifiedAt: 4,
    providerResults: { comfyui: { steps: [{ id: 'service', ok: true }] } },
  });
  assert.deepEqual(r.providers.comfyui.connectionVerification.capabilities.cloud, {
    status: 'passed',
    verifiedAt: 1,
  });
  assert.equal(r.providers.comfyui.connectionVerification.status, 'passed');
});

test('mergePassedProviderApiConfig：volcengine-speech 步骤 id 白名单 asr/tts/audioGeneration，标识变化则不继承旧能力', () => {
  const opts = {
    verifiedAt: 6,
    providerResults: {
      'volcengine-speech': {
        steps: [
          { id: 'tts', ok: true },
          { id: 'other', ok: true },
          { id: 'asr', ok: false },
        ],
      },
    },
  };
  const base = {
    providers: {
      'volcengine-speech': {
        apiUrl: 'a',
        apiKey: 'k',
        connectionVerification: { capabilities: { asr: { status: 'passed', verifiedAt: 0 } } },
      },
    },
  };
  const same = mergePassedProviderApiConfig(base, base, ['Volcengine-Speech'], new Map(), opts);
  assert.deepEqual(same.providers['volcengine-speech'].connectionVerification, {
    status: 'passed',
    verifiedAt: 6,
    capabilities: {
      asr: { status: 'failed', verifiedAt: 6 },
      tts: { status: 'passed', verifiedAt: 6 },
    },
  });
  const changed = mergePassedProviderApiConfig(
    base,
    { providers: { 'volcengine-speech': { apiUrl: 'a', apiKey: 'zz' } } },
    ['volcengine-speech'],
    new Map(),
    opts,
  );
  assert.deepEqual(Object.keys(changed.providers['volcengine-speech'].connectionVerification.capabilities), [
    'tts',
    'asr',
  ]);
  const noSteps = mergePassedProviderApiConfig(
    {},
    { providers: { 'volcengine-speech': {} } },
    ['volcengine-speech'],
    new Map(),
    {
      verifiedAt: 6,
    },
  );
  assert.deepEqual(noSteps.providers['volcengine-speech'].connectionVerification, {
    status: 'passed',
    verifiedAt: 6,
  });
});

test('mergeCurrentProviderConnectionResults：按连接标识把 provider 分成 applied 与 stale 两部分', () => {
  const cfg = {
    providers: {
      openai: { apiUrl: 'a', apiKey: 'k' },
      runninghub: { apiUrl: 'r', apiKey: 'k' },
    },
  };
  const pending = {
    providers: {
      openai: { apiUrl: 'a', apiKey: 'k' },
      runninghub: { apiUrl: 'r', apiKey: 'CHANGED' },
    },
  };
  const r = mergeCurrentProviderConnectionResults(cfg, pending, ['openai', 'runninghub'], new Map(), {
    verifiedAt: 8,
  });
  assert.deepEqual(r.appliedProviderIds, ['openai']);
  assert.deepEqual(r.staleProviderIds, ['runninghub']);
  assert.deepEqual(Object.keys(r.config.providers), ['openai', 'runninghub']);
  assert.equal('connectionVerification' in r.config.providers.runninghub, false);
  assert.equal(r.config.providers.openai.connectionVerification.verifiedAt, 8);
});

test('mergeCurrentProviderConnectionResults：comfyui 指定 capability 时只比对该 URL 字段', () => {
  const cfg = { providers: { comfyui: { apiUrl: 'a', cloudApiUrl: 'c1' } } };
  const pending = { providers: { comfyui: { apiUrl: 'B', cloudApiUrl: 'c1' } } };
  const cloud = mergeCurrentProviderConnectionResults(cfg, pending, ['comfyui'], new Map(), {
    verifiedAt: 2,
    connectionCapabilities: { comfyui: 'CLOUD' },
  });
  assert.deepEqual(cloud.appliedProviderIds, ['comfyui']);
  const local = mergeCurrentProviderConnectionResults(cfg, pending, ['comfyui'], new Map(), {
    verifiedAt: 2,
    connectionCapabilities: { comfyui: 'local' },
  });
  assert.deepEqual(local.appliedProviderIds, []);
  assert.deepEqual(local.staleProviderIds, ['comfyui']);
  const other = mergeCurrentProviderConnectionResults(cfg, pending, ['comfyui'], new Map(), {
    verifiedAt: 2,
    connectionCapabilities: { comfyui: 'whatever' },
  });
  assert.deepEqual(other.staleProviderIds, ['comfyui'], '非 local/cloud 时回到整体标识比较');
});

test('mergeCurrentProviderConnectionResults：空 id 被丢弃，标识两侧同为空的未知 provider 仍算 current', () => {
  const r = mergeCurrentProviderConnectionResults({}, {}, ['', null, '  ', 'x'], new Map(), {});
  assert.deepEqual(Object.keys(r).sort(), ['appliedProviderIds', 'config', 'staleProviderIds']);
  assert.deepEqual(r.appliedProviderIds, ['x']);
  assert.deepEqual(r.staleProviderIds, []);
  assert.deepEqual(Object.keys(r.config), ['providers']);
  assert.deepEqual(Object.keys(r.config.providers), ['x']);
  assert.equal(r.config.providers.x.connectionVerification.status, 'passed');
});
