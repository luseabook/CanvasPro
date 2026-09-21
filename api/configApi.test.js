import test from 'node:test';
import assert from 'node:assert/strict';
function mockFetchOnceJson(_0x29944e) {
  globalThis.fetch = async (_0x1ebc26) => {
    if (String(_0x1ebc26) !== '/api/config') throw new Error('unexpected fetch url: ' + String(_0x1ebc26));
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => _0x29944e,
      text: async () => JSON.stringify(_0x29944e),
    };
  };
}
function installSecureSettingsStub(
  _0x4fb64e,
  {
    available: available = true,
    initialValues: initialValues = {},
    failSetKeys: failSetKeys = [],
    failDeleteKeys: failDeleteKeys = [],
  } = {},
) {
  const _0xe8be3b = globalThis.window,
    _0x116732 = { ...initialValues },
    _0x2ecc72 = [],
    _0x3e49b5 = new Set(failSetKeys),
    _0x2758fd = new Set(failDeleteKeys);
  return (
    (globalThis.window = {
      electronAPI: {
        secureSettings: {
          async get(_0x5956f6 = {}) {
            _0x2ecc72.push({ method: 'get', payload: _0x5956f6 });
            const _0x97ebeb = Array.isArray(_0x5956f6.keys)
              ? _0x5956f6.keys
              : [_0x5956f6.key].filter(Boolean);
            return {
              ok: true,
              available: available,
              values: Object.fromEntries(
                _0x97ebeb
                  .filter((_0x27cdf0) => Object.prototype.hasOwnProperty.call(_0x116732, _0x27cdf0))
                  .map((_0x267842) => [_0x267842, _0x116732[_0x267842]]),
              ),
            };
          },
          async set(_0x2a2e37 = {}) {
            _0x2ecc72.push({ method: 'set', payload: _0x2a2e37 });
            if (!available) return { ok: false, available: available };
            if (_0x3e49b5.has(_0x2a2e37.key)) return { ok: false, available: available, error: 'set failed' };
            return (
              (_0x116732[_0x2a2e37.key] = String(_0x2a2e37.value || '')),
              { ok: true, available: available }
            );
          },
          async delete(_0x4916a7 = {}) {
            _0x2ecc72.push({ method: 'delete', payload: _0x4916a7 });
            if (!available) return { ok: false, available: available };
            if (_0x2758fd.has(_0x4916a7.key))
              return { ok: false, available: available, error: 'delete failed' };
            return (delete _0x116732[_0x4916a7.key], { ok: true, available: available });
          },
        },
      },
    }),
    _0x4fb64e.after(() => {
      globalThis.window = _0xe8be3b;
    }),
    { values: _0x116732, calls: _0x2ecc72 }
  );
}
function installFetchSequence(_0xec1ac9, { getData: getData = {}, postOk: postOk = true } = {}) {
  const _0x2ef442 = globalThis.fetch,
    _0x342840 = [];
  return (
    (globalThis.fetch = async (_0x149160, _0x3aa58d = {}) => {
      if (String(_0x149160) !== '/api/config') throw new Error('unexpected fetch url: ' + String(_0x149160));
      const _0x24a08a = String(_0x3aa58d.method || 'GET').toUpperCase();
      if (_0x24a08a === 'POST')
        return (
          _0x342840.push(JSON.parse(String(_0x3aa58d.body || '{}'))),
          {
            ok: postOk,
            status: postOk ? 200 : 0x1f4,
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
    _0xec1ac9.after(() => {
      globalThis.fetch = _0x2ef442;
    }),
    { posts: _0x342840 }
  );
}
(test('configApi: grsai provider 配置优先于 apiUrlInput/apiKeyInput', async () => {
  const _0x456d7c = globalThis.fetch;
  try {
    mockFetchOnceJson({
      apiUrlInput: 'https://api.grsai.example.com///',
      apiKeyInput: 'k_grsai',
      providers: { grsai: { apiUrl: 'https://grsai.example2.com/', apiKey: 'k_grsai2' } },
    });
    const {
      ensureConfig: _0x306df2,
      getProviderConfig: _0x29adcc,
      clearApiConfig: _0x235736,
    } = await import('./configApi.js');
    (_0x235736(), await _0x306df2());
    const _0x39a01b = _0x29adcc('grsai');
    (assert.equal(_0x39a01b.apiUrl, 'https://grsai.example2.com'),
      assert.equal(_0x39a01b.apiKey, 'k_grsai2'));
  } finally {
    globalThis.fetch = _0x456d7c;
  }
}),
  test('configApi: APIMart 缺省线路使用国内1', async () => {
    const _0x47c6f8 = globalThis.fetch;
    try {
      mockFetchOnceJson({ providers: { apimart: { apiKey: 'k_apimart' } } });
      const {
        ensureConfig: _0x1bd485,
        getProviderConfig: _0x394b6c,
        clearApiConfig: _0x538fc5,
      } = await import('./configApi.js');
      (_0x538fc5(), await _0x1bd485());
      const _0x1beee9 = _0x394b6c('apimart');
      (assert.equal(_0x1beee9.apiUrl, 'https://api.apib.ai'),
        assert.equal(_0x1beee9.routeId, 'domestic1'),
        assert.equal(_0x1beee9.apiKey, 'k_apimart'));
    } finally {
      globalThis.fetch = _0x47c6f8;
    }
  }),
  test('configApi: APIMart 可按 routeId 解析国内2线路', async () => {
    const _0x556ad0 = globalThis.fetch;
    try {
      mockFetchOnceJson({ providers: { apimart: { routeId: 'domestic2', apiKey: 'k_apimart' } } });
      const {
        ensureConfig: _0x236d92,
        getProviderConfig: _0x2a1f9d,
        clearApiConfig: _0x13d110,
      } = await import('./configApi.js');
      (_0x13d110(), await _0x236d92());
      const _0x127867 = _0x2a1f9d('apimart');
      (assert.equal(_0x127867.apiUrl, 'https://api.aishuch.com'),
        assert.equal(_0x127867.routeId, 'domestic2'));
    } finally {
      globalThis.fetch = _0x556ad0;
    }
  }),
  test('configApi: APIMart apiUrl 优先反推线路', async () => {
    const _0x247367 = globalThis.fetch;
    try {
      mockFetchOnceJson({
        providers: {
          apimart: { routeId: 'domestic1', apiUrl: 'https://api.apimart.ai', apiKey: 'k_apimart' },
        },
      });
      const {
        ensureConfig: _0x5a3889,
        getProviderConfig: _0x4bc392,
        clearApiConfig: _0x453f16,
      } = await import('./configApi.js');
      (_0x453f16(), await _0x5a3889());
      const _0x2e9a19 = _0x4bc392('apimart');
      (assert.equal(_0x2e9a19.apiUrl, 'https://api.apimart.ai'), assert.equal(_0x2e9a19.routeId, 'overseas'));
    } finally {
      globalThis.fetch = _0x247367;
    }
  }),
  test(
    'configApi: Electron secureSettings 会迁移旧明文 API Key 并回写去敏配置',
    { concurrency: false },
    async (_0x33ab4a) => {
      const { values: _0x4d2ed8 } = installSecureSettingsStub(_0x33ab4a),
        { posts: _0x481394 } = installFetchSequence(_0x33ab4a, {
          getData: {
            apiUrlInput: 'https://api.grsai.example.com///',
            apiKeyInput: 'legacy-grsai-key',
            providers: { runninghub: { apiKey: 'rh-workflow-key', modelApiKey: 'rh-model-key' } },
          },
        }),
        { fetchApiConfigFromServer: _0x11a900, clearApiConfig: _0x2db80e } = await import('./configApi.js');
      _0x2db80e();
      const _0x1980d4 = await _0x11a900();
      (assert.equal(_0x1980d4.providers.grsai.apiKey, 'legacy-grsai-key'),
        assert.equal(_0x1980d4.providers.runninghub.apiKey, 'rh-workflow-key'),
        assert.equal(_0x1980d4.providers.runninghub.modelApiKey, 'rh-model-key'),
        assert.equal(_0x4d2ed8['apiConfig.providers.grsai.apiKey'], 'legacy-grsai-key'),
        assert.equal(_0x4d2ed8['apiConfig.providers.runninghub.apiKey'], 'rh-workflow-key'),
        assert.equal(_0x4d2ed8['apiConfig.providers.runninghub.modelApiKey'], 'rh-model-key'),
        assert.equal(_0x481394.length, 1),
        assert.equal(_0x481394[0].apiKeyInput, undefined),
        assert.equal(_0x481394[0].providers.runninghub.apiKey, undefined),
        assert.equal(_0x481394[0].providers.runninghub.modelApiKey, undefined));
    },
  ),
  test(
    'configApi: Agnes API Key 可以从 Electron secureSettings 回填',
    { concurrency: false },
    async (_0x34906a) => {
      (installSecureSettingsStub(_0x34906a, {
        initialValues: { 'apiConfig.providers.agnes.apiKey': 'agnes-key' },
      }),
        installFetchSequence(_0x34906a, { getData: { providers: { agnes: {} } } }));
      const {
        fetchApiConfigFromServer: _0x2ec577,
        getProviderConfig: _0x520a51,
        clearApiConfig: _0x360a5f,
      } = await import('./configApi.js');
      _0x360a5f();
      const _0x43fc6f = await _0x2ec577();
      (assert.equal(_0x43fc6f.providers.agnes.apiKey, 'agnes-key'),
        assert.equal(_0x520a51('agnes').apiKey, 'agnes-key'));
    },
  ),
  test(
    'configApi: Electron secureSettings 保存时只把非敏感配置写入 config.json',
    { concurrency: false },
    async (_0xe57b2f) => {
      const { values: _0x3ebe51 } = installSecureSettingsStub(_0xe57b2f),
        { posts: _0x55ac4f } = installFetchSequence(_0xe57b2f),
        { saveApiConfigToServer: _0x16138a, clearApiConfig: _0x30f514 } = await import('./configApi.js');
      (_0x30f514(),
        await _0x16138a({
          providers: {
            apimart: { apiKey: 'am-key', apiUrl: 'https://api.apimart.ai' },
            runninghub: { apiKey: 'rh-key', modelApiKey: 'rh-model-key' },
          },
        }),
        assert.equal(_0x3ebe51['apiConfig.providers.apimart.apiKey'], 'am-key'),
        assert.equal(_0x3ebe51['apiConfig.providers.runninghub.apiKey'], 'rh-key'),
        assert.equal(_0x3ebe51['apiConfig.providers.runninghub.modelApiKey'], 'rh-model-key'),
        assert.equal(_0x55ac4f.length, 1),
        assert.deepEqual(_0x55ac4f[0], {
          providers: { apimart: { apiUrl: 'https://api.apimart.ai' }, runninghub: {} },
        }));
    },
  ),
  test(
    'configApi: secureSettings 写入 Agnes Key 失败时保留明文配置',
    { concurrency: false },
    async (_0x3a03a4) => {
      installSecureSettingsStub(_0x3a03a4, { failSetKeys: ['apiConfig.providers.agnes.apiKey'] });
      const { posts: _0x1d5d1a } = installFetchSequence(_0x3a03a4),
        { saveApiConfigToServer: _0x4435ec, clearApiConfig: _0x45cc81 } = await import('./configApi.js');
      (_0x45cc81(),
        await _0x4435ec({
          providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'agnes-key' } },
        }),
        assert.deepEqual(_0x1d5d1a, [
          { providers: { agnes: { apiUrl: 'https://apihub.agnes-ai.com', apiKey: 'agnes-key' } } },
        ]));
    },
  ),
  test(
    'configApi: secureSettings 不可用时保持明文配置兼容行为',
    { concurrency: false },
    async (_0x4ef6cb) => {
      installSecureSettingsStub(_0x4ef6cb, { available: false });
      const { posts: _0x41c3c6 } = installFetchSequence(_0x4ef6cb),
        { saveApiConfigToServer: _0x537cb1, clearApiConfig: _0x384dd5 } = await import('./configApi.js');
      (_0x384dd5(),
        await _0x537cb1({ providers: { grsai: { apiKey: 'plain-key' } } }),
        assert.deepEqual(_0x41c3c6, [{ providers: { grsai: { apiKey: 'plain-key' } } }]));
    },
  ),
  test('configApi: grsai 无 provider 配置时使用 apiUrlInput/apiKeyInput', async () => {
    const _0x22bb67 = globalThis.fetch;
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
        ensureConfig: _0x566c77,
        getProviderConfig: _0x195b1e,
        clearApiConfig: _0x5e0a86,
      } = await import('./configApi.js');
      (_0x5e0a86(), await _0x566c77());
      const _0x4b14c2 = _0x195b1e('grsai');
      (assert.equal(_0x4b14c2.apiUrl, 'https://api.grsai.example.com'),
        assert.equal(_0x4b14c2.apiKey, 'k_grsai'));
      const _0x305f34 = _0x195b1e('ppio');
      (assert.equal(_0x305f34.apiUrl, 'https://ppio.example.com'), assert.equal(_0x305f34.apiKey, 'k_ppio'));
      const _0x3b94ab = _0x195b1e('runninghub');
      (assert.equal(_0x3b94ab.apiKey, 'k_rhwf'), assert.equal(_0x3b94ab.modelApiKey, 'k_rhmodel'));
      const _0x1da0aa = _0x195b1e('runninghubwf');
      (assert.equal(_0x1da0aa.apiKey, 'k_rhwf'), assert.equal(_0x1da0aa.modelApiKey, ''));
    } finally {
      globalThis.fetch = _0x22bb67;
    }
  }));
