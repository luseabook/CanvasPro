import test from 'node:test';
import assert from 'node:assert/strict';
function mockFetchOnceJson(value) {
  globalThis.fetch = async (item) => {
    if (String(item) !== '/api/config') throw new Error('unexpected fetch url: ' + String(item));
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => value,
      text: async () => JSON.stringify(value),
    };
  };
}
function installSecureSettingsStub(
  key,
  {
    available: available = true,
    initialValues: initialValues = {},
    failSetKeys: failSetKeys = [],
    failDeleteKeys: failDeleteKeys = [],
  } = {},
) {
  const index = globalThis.window,
    values = { ...initialValues },
    calls = [],
    map = new Set(failSetKeys),
    map2 = new Set(failDeleteKeys);
  return (
    (globalThis.window = {
      electronAPI: {
        secureSettings: {
          async get(payload = {}) {
            calls.push({ method: 'get', payload: payload });
            const list = Array.isArray(payload.keys) ? payload.keys : [payload.key].filter(Boolean);
            return {
              ok: true,
              available: available,
              values: Object.fromEntries(
                list
                  .filter((item2) => Object.prototype.hasOwnProperty.call(values, item2))
                  .map((item3) => [item3, values[item3]]),
              ),
            };
          },
          async set(payload2 = {}) {
            calls.push({ method: 'set', payload: payload2 });
            if (!available) return { ok: false, available: available };
            if (map.has(payload2.key)) return { ok: false, available: available, error: 'set failed' };
            return (
              (values[payload2.key] = String(payload2.value || '')),
              { ok: true, available: available }
            );
          },
          async delete(payload3 = {}) {
            calls.push({ method: 'delete', payload: payload3 });
            if (!available) return { ok: false, available: available };
            if (map2.has(payload3.key)) return { ok: false, available: available, error: 'delete failed' };
            return (delete values[payload3.key], { ok: true, available: available });
          },
        },
      },
    }),
    key.after(() => {
      globalThis.window = index;
    }),
    { values: values, calls: calls }
  );
}
function installFetchSequence(result, { getData: getData = {}, postOk: postOk = true } = {}) {
  const data = globalThis.fetch,
    posts = [];
  return (
    (globalThis.fetch = async (options, dom = {}) => {
      if (String(options) !== '/api/config') throw new Error('unexpected fetch url: ' + String(options));
      const target = String(dom.method || 'GET').toUpperCase();
      if (target === 'POST')
        return (
          posts.push(JSON.parse(String(dom.body || '{}'))),
          {
            ok: postOk,
            status: postOk ? 200 : 500,
            headers: { get: () => 'application/json' },
            json: async () => ({ success: postOk }),
            text: async () => JSON.stringify({ success: postOk }),
          }
        );
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => getData,
        text: async () => JSON.stringify(getData),
      };
    }),
    result.after(() => {
      globalThis.fetch = data;
    }),
    { posts: posts }
  );
}
(test('configApi: grsai provider 配置优先于 apiUrlInput/apiKeyInput', async () => {
  const source = globalThis.fetch;
  try {
    mockFetchOnceJson({
      apiUrlInput: 'https://api.grsai.example.com///',
      apiKeyInput: 'k_grsai',
      providers: { grsai: { apiUrl: 'https://grsai.example2.com/', apiKey: 'k_grsai2' } },
    });
    const {
      ensureConfig: ensureConfig,
      getProviderConfig: getProviderConfig,
      clearApiConfig: clearApiConfig,
    } = await import('./configApi.js');
    (clearApiConfig(), await ensureConfig());
    const next = getProviderConfig('grsai');
    (assert.equal(next.apiUrl, 'https://grsai.example2.com'), assert.equal(next.apiKey, 'k_grsai2'));
  } finally {
    globalThis.fetch = source;
  }
}),
  test('configApi: APIMart 缺省线路使用国内1', async () => {
    const current = globalThis.fetch;
    try {
      mockFetchOnceJson({ providers: { apimart: { apiKey: 'k_apimart' } } });
      const {
        ensureConfig: ensureConfig2,
        getProviderConfig: getProviderConfig2,
        clearApiConfig: clearApiConfig2,
      } = await import('./configApi.js');
      (clearApiConfig2(), await ensureConfig2());
      const entry = getProviderConfig2('apimart');
      (assert.equal(entry.apiUrl, 'https://api.apib.ai'),
        assert.equal(entry.routeId, 'domestic1'),
        assert.equal(entry.apiKey, 'k_apimart'));
    } finally {
      globalThis.fetch = current;
    }
  }),
  test('configApi: APIMart 可按 routeId 解析国内2线路', async () => {
    const record = globalThis.fetch;
    try {
      mockFetchOnceJson({ providers: { apimart: { routeId: 'domestic2', apiKey: 'k_apimart' } } });
      const {
        ensureConfig: ensureConfig3,
        getProviderConfig: getProviderConfig3,
        clearApiConfig: clearApiConfig3,
      } = await import('./configApi.js');
      (clearApiConfig3(), await ensureConfig3());
      const handle = getProviderConfig3('apimart');
      (assert.equal(handle.apiUrl, 'https://api.aishuch.com'), assert.equal(handle.routeId, 'domestic2'));
    } finally {
      globalThis.fetch = record;
    }
  }),
  test('configApi: APIMart apiUrl 优先反推线路', async () => {
    const state = globalThis.fetch;
    try {
      mockFetchOnceJson({
        providers: {
          apimart: { routeId: 'domestic1', apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
        },
      });
      const {
        ensureConfig: ensureConfig4,
        getProviderConfig: getProviderConfig4,
        clearApiConfig: clearApiConfig4,
      } = await import('./configApi.js');
      (clearApiConfig4(), await ensureConfig4());
      const config = getProviderConfig4('apimart');
      (assert.equal(config.apiUrl, 'https://api.apimart.ai'), assert.equal(config.routeId, 'overseas'));
    } finally {
      globalThis.fetch = state;
    }
  }),
  test(
    'configApi: Electron secureSettings 会迁移旧明文 API Key 并回写去敏配置',
    { concurrency: false },
    async (scope) => {
      const { values: values2 } = installSecureSettingsStub(scope),
        { posts: posts2 } = installFetchSequence(scope, {
          getData: {
            apiUrlInput: 'https://api.grsai.example.com///',
            apiKeyInput: 'legacy-grsai-key',
            providers: { runninghub: { apiKey: 'rh-workflow-key', modelApiKey: 'rh-model-key' } },
          },
        }),
        { fetchApiConfigFromServer: fetchApiConfigFromServer, clearApiConfig: clearApiConfig5 } =
          await import('./configApi.js');
      clearApiConfig5();
      const input = await fetchApiConfigFromServer();
      (assert.equal(input.providers.grsai.apiKey, 'legacy-grsai-key'),
        assert.equal(input.providers.runninghub.apiKey, 'rh-workflow-key'),
        assert.equal(input.providers.runninghub.modelApiKey, 'rh-model-key'),
        assert.equal(values2['apiConfig.providers.grsai.apiKey'], 'legacy-grsai-key'),
        assert.equal(values2['apiConfig.providers.runninghub.apiKey'], 'rh-workflow-key'),
        assert.equal(values2['apiConfig.providers.runninghub.modelApiKey'], 'rh-model-key'),
        assert.equal(posts2.length, 1),
        assert.equal(posts2[0].apiKeyInput, undefined),
        assert.equal(posts2[0].providers.runninghub.apiKey, undefined),
        assert.equal(posts2[0].providers.runninghub.modelApiKey, undefined));
    },
  ),
  test(
    'configApi: Agnes API Key 可以从 Electron secureSettings 回填',
    { concurrency: false },
    async (output) => {
      (installSecureSettingsStub(output, {
        initialValues: { 'apiConfig.providers.agnes.apiKey': 'agnes-key' },
      }),
        installFetchSequence(output, { getData: { providers: { agnes: {} } } }));
      const {
        fetchApiConfigFromServer: fetchApiConfigFromServer2,
        getProviderConfig: getProviderConfig5,
        clearApiConfig: clearApiConfig6,
      } = await import('./configApi.js');
      clearApiConfig6();
      const value2 = await fetchApiConfigFromServer2();
      (assert.equal(value2.providers.agnes.apiKey, 'agnes-key'),
        assert.equal(getProviderConfig5('agnes').apiKey, 'agnes-key'));
    },
  ),
  test(
    'configApi: Electron secureSettings 保存时只把非敏感配置写入 config.json',
    { concurrency: false },
    async (value3) => {
      const { values: values3 } = installSecureSettingsStub(value3),
        { posts: posts3 } = installFetchSequence(value3),
        { saveApiConfigToServer: saveApiConfigToServer, clearApiConfig: clearApiConfig7 } =
          await import('./configApi.js');
      (clearApiConfig7(),
        await saveApiConfigToServer({
          providers: {
            apimart: { apiKey: 'am-key', apiUrl: 'https://api.apimart.ai' },
            runninghub: { apiKey: 'rh-key', modelApiKey: 'rh-model-key' },
          },
        }),
        assert.equal(values3['apiConfig.providers.apimart.apiKey'], 'am-key'),
        assert.equal(values3['apiConfig.providers.runninghub.apiKey'], 'rh-key'),
        assert.equal(values3['apiConfig.providers.runninghub.modelApiKey'], 'rh-model-key'),
        assert.equal(posts3.length, 1),
        assert.deepEqual(posts3[0], {
          providers: { apimart: { apiUrl: 'https://api.apimart.ai' }, runninghub: {} },
        }));
    },
  ),
  test(
    'configApi: secureSettings 写入 Agnes Key 失败时保留明文配置',
    { concurrency: false },
    async (value4) => {
      installSecureSettingsStub(value4, { failSetKeys: ['apiConfig.providers.agnes.apiKey'] });
      const { posts: posts4 } = installFetchSequence(value4),
        { saveApiConfigToServer: saveApiConfigToServer2, clearApiConfig: clearApiConfig8 } =
          await import('./configApi.js');
      (clearApiConfig8(),
        await saveApiConfigToServer2({
          providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'agnes-key' } },
        }),
        assert.deepEqual(posts4, [
          { providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'agnes-key' } } },
        ]));
    },
  ),
  test('configApi: secureSettings 不可用时保持明文配置兼容行为', { concurrency: false }, async (value5) => {
    installSecureSettingsStub(value5, { available: false });
    const { posts: posts5 } = installFetchSequence(value5),
      { saveApiConfigToServer: saveApiConfigToServer3, clearApiConfig: clearApiConfig9 } =
        await import('./configApi.js');
    (clearApiConfig9(),
      await saveApiConfigToServer3({ providers: { grsai: { apiKey: 'plain-key' } } }),
      assert.deepEqual(posts5, [{ providers: { grsai: { apiKey: 'plain-key' } } }]));
  }),
  test('configApi: grsai 无 provider 配置时使用 apiUrlInput/apiKeyInput', async () => {
    const value6 = globalThis.fetch;
    try {
      mockFetchOnceJson({
        apiUrlInput: 'https://api.grsai.example.com///',
        apiKeyInput: 'k_grsai',
        providers: {
          ppio: { apiUrl: 'https://ppio.example.com/', apiKey: 'k_ppio' },
          runninghub: {
            apiUrl: 'https://runninghub.example.com/',
            apiKey: 'k_rhwf',
            modelApiKey: 'k_rhmodel',
          },
        },
      });
      const {
        ensureConfig: ensureConfig5,
        getProviderConfig: getProviderConfig6,
        clearApiConfig: clearApiConfig10,
      } = await import('./configApi.js');
      (clearApiConfig10(), await ensureConfig5());
      const value7 = getProviderConfig6('grsai');
      (assert.equal(value7.apiUrl, 'https://api.grsai.example.com'), assert.equal(value7.apiKey, 'k_grsai'));
      const value8 = getProviderConfig6('ppio');
      (assert.equal(value8.apiUrl, 'https://ppio.example.com'), assert.equal(value8.apiKey, 'k_ppio'));
      const value9 = getProviderConfig6('runninghub');
      (assert.equal(value9.apiKey, 'k_rhwf'), assert.equal(value9.modelApiKey, 'k_rhmodel'));
      const value10 = getProviderConfig6('runninghubwf');
      (assert.equal(value10.apiKey, 'k_rhwf'), assert.equal(value10.modelApiKey, ''));
    } finally {
      globalThis.fetch = value6;
    }
  }));
