import test from 'node:test';
import assert from 'node:assert/strict';
function jsonResponse(_0x76b925, _0x58bfbc = 200) {
  return {
    ok: _0x58bfbc >= 200 && _0x58bfbc < 0x12c,
    status: _0x58bfbc,
    headers: { get: () => 'application/json' },
    json: async () => _0x76b925,
    text: async () => JSON.stringify(_0x76b925),
  };
}
(test('providerConnectionTestApi: probes APIMart with models endpoint', async (_0x32f735) => {
  const _0x2d48ea = globalThis.fetch,
    _0x28f665 = [];
  ((globalThis.fetch = async (_0x31632f, _0x19a5d6 = {}) => {
    _0x28f665.push({ url: String(_0x31632f), options: _0x19a5d6 });
    if (decodeURIComponent(String(_0x31632f)).includes('/v1/user/balance'))
      return jsonResponse({ success: true, remain_balance: 100.5, used_balance: 25, unlimited_quota: false });
    if (String(_0x31632f).endsWith('/api/v2/proxy/apimart-upload')) {
      const _0x4878e6 = Object.fromEntries(_0x19a5d6.body.entries());
      return (
        assert.equal(_0x4878e6.apiKey, 'am-key'),
        assert.equal(_0x4878e6.apiUrl, 'https://api.apimart.ai'),
        jsonResponse({ cdnUrl: 'https://upload.apimart.ai/aic-test.png' })
      );
    }
    return jsonResponse({ data: [{ id: 'demo' }] });
  }),
    _0x32f735.after(() => {
      globalThis.fetch = _0x2d48ea;
    }));
  const { testProviderConnection: _0x137d99 } = await import('./providerConnectionTestApi.js'),
    _0xb7cb7b = await _0x137d99('apimart', { apiUrl: 'https://api.apimart.ai', apiKey: 'am-key' });
  (assert.equal(_0xb7cb7b.ok, true),
    assert.equal(_0x28f665.length, 3),
    assert.equal(_0xb7cb7b.balance?.displayText, '余额 100.5 美元'),
    assert.equal(_0xb7cb7b.balance?.remaining, 100.5),
    assert.deepEqual(
      _0xb7cb7b.steps.map((_0x2f4159) => _0x2f4159.id),
      ['config', 'auth', 'model', 'balance', 'upload'],
    ),
    assert.equal(_0x28f665[0].options.method, 'GET'),
    assert.equal(_0x28f665[0].options.headers.Authorization, 'Bearer am-key'),
    assert.ok(
      decodeURIComponent(_0x28f665[0].url).includes(
        '/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/models',
      ),
    ),
    assert.equal(
      _0xb7cb7b.steps.find((_0x20c9f9) => _0x20c9f9.id === 'model')?.message,
      '模型列表可访问，未执行额外模型调用',
    ),
    assert.ok(
      decodeURIComponent(_0x28f665[1].url).includes(
        '/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/user/balance',
      ),
    ));
}),
  test('providerConnectionTestApi: strips APIMart /v1 before upload probe', async (_0x4b9be6) => {
    const _0xed8035 = globalThis.fetch;
    ((globalThis.fetch = async (_0x4b50bb, _0x3064b0 = {}) => {
      const _0x1758e8 = String(_0x4b50bb);
      if (_0x1758e8.endsWith('/api/v2/proxy/apimart-upload')) {
        const _0x2ae146 = Object.fromEntries(_0x3064b0.body.entries());
        return (
          assert.equal(_0x2ae146.apiUrl, 'https://api.apimart.ai'),
          jsonResponse({ url: 'https://upload.apimart.ai/aic-test.png' })
        );
      }
      if (decodeURIComponent(_0x1758e8).includes('/v1/user/balance'))
        return jsonResponse({ success: true, remain_balance: 1 });
      return jsonResponse({ data: [{ id: 'demo' }] });
    }),
      _0x4b9be6.after(() => {
        globalThis.fetch = _0xed8035;
      }));
    const { testProviderConnection: _0x503494 } = await import('./providerConnectionTestApi.js'),
      _0x1c1711 = await _0x503494('apimart', { apiUrl: 'https://api.apimart.ai/v1', apiKey: 'am-key' });
    assert.equal(_0x1c1711.ok, true);
  }),
  test('providerConnectionTestApi: APIMart 默认使用国内1线路', async (_0xd8976d) => {
    const _0x2fedcd = globalThis.fetch,
      _0x2fa5af = [];
    ((globalThis.fetch = async (_0x123eb1, _0x1f64f4 = {}) => {
      _0x2fa5af.push({ url: String(_0x123eb1), options: _0x1f64f4 });
      const _0xa8d4a7 = decodeURIComponent(String(_0x123eb1));
      if (_0xa8d4a7.includes('/v1/user/balance')) return jsonResponse({ success: true, remain_balance: 1 });
      if (String(_0x123eb1).endsWith('/api/v2/proxy/apimart-upload')) {
        const _0x5390d5 = Object.fromEntries(_0x1f64f4.body.entries());
        return (
          assert.equal(_0x5390d5.apiUrl, 'https://api.apib.ai'),
          jsonResponse({ cdnUrl: 'https://upload.apib.ai/aic-test.png' })
        );
      }
      return jsonResponse({ data: [{ id: 'demo' }] });
    }),
      _0xd8976d.after(() => {
        globalThis.fetch = _0x2fedcd;
      }));
    const { testProviderConnection: _0x99c470 } = await import('./providerConnectionTestApi.js'),
      _0x22fd62 = await _0x99c470('apimart', { apiKey: 'am-key' });
    (assert.equal(_0x22fd62.ok, true),
      assert.ok(
        decodeURIComponent(_0x2fa5af[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.apib.ai/v1/models',
        ),
      ),
      assert.ok(
        decodeURIComponent(_0x2fa5af[1].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.apib.ai/v1/user/balance',
        ),
      ));
  }),
  test('providerConnectionTestApi: APIMart routeId domestic2 uses aishuch endpoints', async (_0x31d19c) => {
    const _0x221433 = globalThis.fetch,
      _0x1fe9e4 = [];
    ((globalThis.fetch = async (_0x2008c2, _0x15c860 = {}) => {
      _0x1fe9e4.push({ url: String(_0x2008c2), options: _0x15c860 });
      const _0x2e5a61 = decodeURIComponent(String(_0x2008c2));
      if (_0x2e5a61.includes('/v1/user/balance')) return jsonResponse({ success: true, remain_balance: 1 });
      if (String(_0x2008c2).endsWith('/api/v2/proxy/apimart-upload')) {
        const _0x230e4b = Object.fromEntries(_0x15c860.body.entries());
        return (
          assert.equal(_0x230e4b.apiUrl, 'https://api.aishuch.com'),
          jsonResponse({ cdnUrl: 'https://upload.aishuch.com/aic-test.png' })
        );
      }
      return jsonResponse({ data: [{ id: 'demo' }] });
    }),
      _0x31d19c.after(() => {
        globalThis.fetch = _0x221433;
      }));
    const { testProviderConnection: _0x4dfd8d } = await import('./providerConnectionTestApi.js'),
      _0x3715ed = await _0x4dfd8d('apimart', { routeId: 'domestic2', apiKey: 'am-key' });
    (assert.equal(_0x3715ed.ok, true),
      assert.ok(
        decodeURIComponent(_0x1fe9e4[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.aishuch.com/v1/models',
        ),
      ),
      assert.ok(
        decodeURIComponent(_0x1fe9e4[1].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.aishuch.com/v1/user/balance',
        ),
      ));
  }),
  test('providerConnectionTestApi: probes Agnes with models then chat fallback', async (_0x211872) => {
    const _0x2a5c67 = globalThis.fetch,
      _0x5e1dab = [];
    ((globalThis.fetch = async (_0x171c7f, _0x4937f5 = {}) => {
      _0x5e1dab.push({ url: String(_0x171c7f), options: _0x4937f5 });
      if (String(_0x171c7f).endsWith('/api/v2/proxy/completions')) {
        const _0x473385 = JSON.parse(_0x4937f5.body);
        return (
          assert.equal(_0x473385.apiUrl, 'https://apihub.agnes-ai.com/v1'),
          assert.equal(_0x473385.apiKey, 'agnes-key'),
          assert.equal(_0x473385.model, 'agnes-3.0-flash'),
          assert.equal(_0x473385.max_tokens, 1),
          jsonResponse({ choices: [{ message: { content: 'ok' } }] })
        );
      }
      return jsonResponse({ data: [{ id: 'agnes-3.0-flash' }, { id: 'agnes-image-2.1-flash' }] });
    }),
      _0x211872.after(() => {
        globalThis.fetch = _0x2a5c67;
      }));
    const { testProviderConnection: _0x2b9d48 } = await import('./providerConnectionTestApi.js'),
      _0x3d0aeb = await _0x2b9d48('agnes', {
        apiUrl: 'https://apihub.agnes-ai.com',
        apiKey: 'Bearer agnes-key',
      });
    (assert.equal(_0x3d0aeb.ok, true),
      assert.equal(_0x5e1dab.length, 2),
      assert.deepEqual(
        _0x3d0aeb.steps.map((_0x48e5c4) => _0x48e5c4.id),
        ['config', 'auth', 'model', 'upload'],
      ),
      assert.equal(_0x5e1dab[0].options.method, 'GET'),
      assert.equal(_0x5e1dab[0].options.headers.Authorization, 'Bearer agnes-key'),
      assert.ok(
        decodeURIComponent(_0x5e1dab[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://apihub.agnes-ai.com/v1/models',
        ),
      ),
      assert.equal(_0x3d0aeb.steps.find((_0xed5772) => _0xed5772.id === 'upload')?.skipped, true));
  }),
  test('providerConnectionTestApi: normalizes APIMart unlimited balance payloads', async () => {
    const { normalizeApimartBalancePayload: _0x34d673 } = await import('./providerConnectionTestApi.js'),
      _0x2cfe2f = _0x34d673({
        data: { success: true, unlimited_quota: true, remain_balance: -1, used_balance: '12.75' },
      });
    (assert.equal(_0x2cfe2f.displayText, '余额 不限'),
      assert.equal(_0x2cfe2f.unlimited, true),
      assert.equal(_0x2cfe2f.remaining, null),
      assert.equal(_0x2cfe2f.used, 12.75),
      assert.match(_0x2cfe2f.detailText, /额度不限/),
      assert.doesNotMatch(_0x2cfe2f.detailText, /-1/),
      assert.doesNotMatch(_0x2cfe2f.detailText, /已用余额/));
  }),
  test('providerConnectionTestApi: normalizes RunningHUB account status balances', async () => {
    const { normalizeRunningHubBalancePayload: _0x54a608 } = await import('./providerConnectionTestApi.js'),
      _0x3f2354 = _0x54a608({
        workflow: {
          code: 0,
          msg: 'success',
          data: { remainCoins: '99999', remainMoney: '5', currency: 'CNY' },
        },
        model: { code: 0, msg: 'success', data: { remainCoins: '12', remainMoney: '999', currency: 'CNY' } },
      });
    (assert.equal(_0x3f2354.displayText, '积分 99,999 · 钱包 999 人民币'),
      assert.equal(_0x3f2354.workflowCredits, 0x1869f),
      assert.equal(_0x3f2354.modelWallet, 0x3e7),
      assert.equal(_0x3f2354.currencyLabel, '人民币'),
      assert.match(_0x3f2354.detailText, /工作流积分：99,999/),
      assert.match(_0x3f2354.detailText, /模型钱包：999 人民币/));
  }),
  test('providerConnectionTestApi: normalizes GRSAI API key credits payloads', async () => {
    const { normalizeGrsaiBalancePayload: _0xe02fb4 } = await import('./providerConnectionTestApi.js'),
      _0x5a92e9 = _0xe02fb4({ code: 0, data: { credits: '4321.25' } });
    (assert.equal(_0x5a92e9.displayText, '积分 4,321.25'),
      assert.equal(_0x5a92e9.credits, 4321.25),
      assert.equal(_0x5a92e9.source, 'account'),
      assert.match(_0x5a92e9.detailText, /账户积分：4,321.25/));
    const _0x32ae2b = _0xe02fb4({ code: 200, data: '8765' }, { source: 'apiKey' });
    (assert.equal(_0x32ae2b.displayText, '积分 8,765'), assert.equal(_0x32ae2b.source, 'apiKey'));
  }),
  test('providerConnectionTestApi: probes GRSAI with domestic chat completions directly', async (_0x12d7cc) => {
    const _0x462095 = globalThis.fetch,
      _0x943062 = [];
    ((globalThis.fetch = async (_0x157bd3, _0x37dc5d = {}) => {
      _0x943062.push({ url: String(_0x157bd3), options: _0x37dc5d });
      if (String(_0x157bd3).endsWith('/api/v2/proxy/completions'))
        return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
      if (String(_0x157bd3).endsWith('/client/openapi/getCredits'))
        return jsonResponse({ code: 0, data: { credits: '4321.25' } });
      if (String(_0x157bd3).endsWith('/client/resource/newUploadTokenZH'))
        return jsonResponse({
          data: {
            token: 'qiniu-token',
            key: 'aic-test.png',
            url: 'https://upload.qiniu.example.com',
            domain: 'https://cdn.qiniu.example.com',
          },
        });
      return jsonResponse({ ok: true });
    }),
      _0x12d7cc.after(() => {
        globalThis.fetch = _0x462095;
      }));
    const { testProviderConnection: _0x54ce49 } = await import('./providerConnectionTestApi.js'),
      _0x4d0b53 = await _0x54ce49('grsai', { apiUrl: 'https://grsaiapi.com', apiKey: 'grsai-key' });
    (assert.equal(_0x4d0b53.ok, true),
      assert.equal(_0x943062.length, 4),
      assert.deepEqual(
        _0x4d0b53.steps.map((_0x4f0549) => _0x4f0549.id),
        ['config', 'model', 'balance', 'upload'],
      ),
      assert.equal(_0x4d0b53.balance?.displayText, '积分 4,321.25'),
      assert.equal(_0x4d0b53.balance?.credits, 4321.25),
      assert.equal(_0x4d0b53.balance?.source, 'account'),
      assert.equal(_0x943062[0].url, '/api/v2/proxy/completions'));
    const _0x468ed3 = JSON.parse(_0x943062[0].options.body);
    (assert.equal(_0x468ed3.apiUrl, 'https://grsai.dakka.com.cn/v1'),
      assert.equal(_0x468ed3.apiKey, 'grsai-key'),
      assert.equal(_0x468ed3.model, 'gemini-3.1-pro'),
      assert.equal(_0x468ed3.max_tokens, undefined),
      assert.deepEqual(_0x468ed3.messages, [{ role: 'user', content: '你好' }]),
      assert.equal(_0x943062[1].url, 'https://grsai.dakka.com.cn/client/openapi/getCredits'),
      assert.equal(_0x943062[1].options.method, 'POST'),
      assert.equal(_0x943062[1].options.headers.Authorization, undefined),
      assert.deepEqual(JSON.parse(_0x943062[1].options.body), { token: 'grsai-key' }));
  }),
  test('providerConnectionTestApi: GRSAI falls back when API key credits are zero', async (_0x3172d6) => {
    const _0x555781 = globalThis.fetch,
      _0x565570 = [];
    ((globalThis.fetch = async (_0x4fd034, _0x4484ff = {}) => {
      _0x565570.push({ url: String(_0x4fd034), options: _0x4484ff });
      if (String(_0x4fd034).endsWith('/api/v2/proxy/completions'))
        return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
      if (String(_0x4fd034).endsWith('/client/openapi/getCredits'))
        return jsonResponse({ code: 0, data: { credits: '0' } });
      if (String(_0x4fd034).includes('/client/common/getCredits?'))
        return jsonResponse({ code: 0, data: { credits: '9876' } });
      if (String(_0x4fd034).endsWith('/client/resource/newUploadTokenZH'))
        return jsonResponse({
          data: {
            token: 'qiniu-token',
            key: 'aic-test.png',
            url: 'https://upload.qiniu.example.com',
            domain: 'https://cdn.qiniu.example.com',
          },
        });
      return jsonResponse({ ok: true });
    }),
      _0x3172d6.after(() => {
        globalThis.fetch = _0x555781;
      }));
    const { testProviderConnection: _0x2aca62 } = await import('./providerConnectionTestApi.js'),
      _0x4c0cfa = await _0x2aca62('grsai', { apiUrl: 'https://grsaiapi.com', apiKey: 'grsai-key' });
    (assert.equal(_0x4c0cfa.ok, true),
      assert.equal(_0x4c0cfa.balance?.displayText, '积分 9,876'),
      assert.equal(_0x4c0cfa.balance?.source, 'account'),
      assert.ok(_0x565570[2].url.includes('/client/common/getCredits?apikey=grsai-key')));
  }),
  test('providerConnectionTestApi: PPIO uses official models endpoint without model-specific fallback', async (_0x1edc68) => {
    const _0x41e36a = globalThis.fetch,
      _0x109d26 = [];
    ((globalThis.fetch = async (_0x353556, _0x366903 = {}) => {
      return (
        _0x109d26.push({ url: String(_0x353556), options: _0x366903 }),
        jsonResponse({ data: [{ id: 'deepseek/deepseek-v3-0324' }] })
      );
    }),
      _0x1edc68.after(() => {
        globalThis.fetch = _0x41e36a;
      }));
    const { testProviderConnection: _0x1eccf7 } = await import('./providerConnectionTestApi.js'),
      _0x5eaf9c = await _0x1eccf7('ppio', { apiUrl: 'https://api.ppio.com', apiKey: 'Bearer ppio-key' });
    (assert.equal(_0x5eaf9c.ok, true),
      assert.equal(_0x109d26.length, 1),
      assert.equal(_0x5eaf9c.steps.find((_0xdfaab) => _0xdfaab.id === 'model')?.skipped, true),
      assert.equal(_0x5eaf9c.steps.find((_0x29147) => _0x29147.id === 'upload')?.skipped, true),
      assert.equal(_0x109d26[0].options.headers.Authorization, 'Bearer ppio-key'),
      assert.ok(
        decodeURIComponent(_0x109d26[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.ppio.com/openai/v1/models',
        ),
      ));
  }),
  test('providerConnectionTestApi: volcengine uses Ark ping endpoint', async (_0x2593ef) => {
    const _0x8c5a3d = globalThis.fetch,
      _0x4803a9 = [];
    ((globalThis.fetch = async (_0x396f72, _0x58dc5e = {}) => {
      return (_0x4803a9.push({ url: String(_0x396f72), options: _0x58dc5e }), jsonResponse('pong'));
    }),
      _0x2593ef.after(() => {
        globalThis.fetch = _0x8c5a3d;
      }));
    const { testProviderConnection: _0x433e1b } = await import('./providerConnectionTestApi.js'),
      _0x26841d = await _0x433e1b('volcengine', {
        apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: 'ark-key',
      });
    (assert.equal(_0x26841d.ok, true),
      assert.equal(_0x4803a9.length, 1),
      assert.deepEqual(
        _0x26841d.steps.map((_0x24e789) => _0x24e789.id),
        ['config', 'auth', 'upload'],
      ),
      assert.equal(_0x4803a9[0].options.method, 'GET'),
      assert.equal(_0x4803a9[0].options.headers.Authorization, 'Bearer ark-key'),
      assert.ok(
        decodeURIComponent(_0x4803a9[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://ark.cn-beijing.volces.com/ping',
        ),
      ));
  }),
  test('providerConnectionTestApi: runninghub treats invalid task response as credential pass', async (_0x25fc24) => {
    const _0x16306c = globalThis.fetch,
      _0x55c5c9 = [];
    ((globalThis.fetch = async (_0xee73c2, _0x58cd1e = {}) => {
      _0x55c5c9.push({ url: String(_0xee73c2), options: _0x58cd1e });
      if (String(_0xee73c2) === '/api/v2/proxy/image') {
        const _0x428d47 = JSON.parse(String(_0x58cd1e.body || '{}'));
        if (String(_0x428d47.apiUrl || '').endsWith('/uc/openapi/accountStatus'))
          return jsonResponse({
            code: 0,
            msg: 'success',
            data: { remainCoins: '12345', remainMoney: '0', currency: 'CNY' },
          });
      }
      if (String(_0xee73c2).startsWith('/api/v2/proxy/upload?'))
        return jsonResponse({ code: 0, data: { download_url: 'https://www.runninghub.cn/aic-test.png' } });
      return jsonResponse({ code: 0x324, message: 'task not found' });
    }),
      _0x25fc24.after(() => {
        globalThis.fetch = _0x16306c;
      }));
    const { testProviderConnection: _0x3415c4 } = await import('./providerConnectionTestApi.js'),
      _0x81e9a2 = await _0x3415c4('runninghub', { apiKey: 'rh-workflow-key' });
    (assert.equal(_0x81e9a2.ok, true),
      assert.equal(_0x55c5c9.length, 2),
      assert.equal(_0x81e9a2.balance?.displayText, '积分 12,345'),
      assert.equal(_0x81e9a2.balance?.workflowCredits, 0x3039),
      assert.equal(_0x55c5c9[0].url, '/api/v2/runninghubwf/query'),
      assert.deepEqual(JSON.parse(_0x55c5c9[0].options.body), {
        apiKey: 'rh-workflow-key',
        taskId: 'aic-connection-test',
      }),
      assert.equal(_0x81e9a2.steps.find((_0x31fbd4) => _0x31fbd4.id === 'upload')?.skipped, true));
  }),
  test('providerConnectionTestApi: runninghub upload probe uses modelApiKey', async (_0xd39398) => {
    const _0x95d37f = globalThis.fetch,
      _0x4d0a15 = [];
    ((globalThis.fetch = async (_0x498066, _0x48951d = {}) => {
      _0x4d0a15.push({ url: String(_0x498066), options: _0x48951d });
      if (String(_0x498066) === '/api/v2/proxy/image') {
        const _0x14e36b = JSON.parse(String(_0x48951d.body || '{}'));
        if (String(_0x14e36b.apiUrl || '').endsWith('/uc/openapi/accountStatus'))
          return jsonResponse({
            code: 0,
            msg: 'success',
            data: {
              remainCoins: _0x14e36b.apikey === 'rh-workflow-key' ? '54321' : '0',
              remainMoney: _0x14e36b.apikey === 'rh-model-key' ? '888.5' : '0',
              currency: 'CNY',
            },
          });
      }
      if (String(_0x498066).startsWith('/api/v2/proxy/upload?'))
        return jsonResponse({ code: 0, data: { download_url: 'https://www.runninghub.cn/aic-test.png' } });
      return jsonResponse({ code: 0x324, message: 'task not found' });
    }),
      _0xd39398.after(() => {
        globalThis.fetch = _0x95d37f;
      }));
    const { testProviderConnection: _0x49389c } = await import('./providerConnectionTestApi.js'),
      _0x183394 = await _0x49389c('runninghub', { apiKey: 'rh-workflow-key', modelApiKey: 'rh-model-key' });
    (assert.equal(_0x183394.ok, true),
      assert.equal(_0x4d0a15.length, 5),
      assert.equal(_0x183394.balance?.displayText, '积分 54,321 · 钱包 888.5 人民币'));
    const _0x29511a = _0x4d0a15.find((_0x5025ff) => _0x5025ff.url === '/api/v2/runninghubwf/query'),
      _0x24bca6 = _0x4d0a15.find((_0x1b2b4b) => {
        if (_0x1b2b4b.url !== '/api/v2/proxy/image') return false;
        const _0x59c6f9 = JSON.parse(String(_0x1b2b4b.options.body || '{}'));
        return String(_0x59c6f9.apiUrl || '').endsWith('/openapi/v2/query');
      }),
      _0x58e14e = _0x4d0a15.filter((_0x5d7f6f) => {
        if (_0x5d7f6f.url !== '/api/v2/proxy/image') return false;
        const _0x2f160c = JSON.parse(String(_0x5d7f6f.options.body || '{}'));
        return String(_0x2f160c.apiUrl || '').endsWith('/uc/openapi/accountStatus');
      }),
      _0xfb63a5 = _0x4d0a15.find((_0x49a26d) => _0x49a26d.url.startsWith('/api/v2/proxy/upload?'));
    (assert.deepEqual(JSON.parse(_0x29511a.options.body), {
      apiKey: 'rh-workflow-key',
      taskId: 'aic-connection-test',
    }),
      assert.equal(JSON.parse(_0x24bca6.options.body).apiKey, 'rh-model-key'),
      assert.deepEqual(
        _0x58e14e.map((_0x4ca647) => JSON.parse(String(_0x4ca647.options.body || '{}')).apikey),
        ['rh-workflow-key', 'rh-model-key'],
      ),
      assert.equal(_0xfb63a5.options.headers.Authorization, 'Bearer rh-model-key'));
  }),
  test('providerConnectionTestApi: missing provider key fails before fetch', async (_0x353283) => {
    const _0x211135 = globalThis.fetch;
    ((globalThis.fetch = async () => {
      throw new Error('fetch should not be called');
    }),
      _0x353283.after(() => {
        globalThis.fetch = _0x211135;
      }));
    const { testProviderConnection: _0x5ab773 } = await import('./providerConnectionTestApi.js'),
      _0x457080 = await _0x5ab773('openai', { apiUrl: 'https://api.openai.com', apiKey: '' });
    (assert.equal(_0x457080.ok, false), assert.match(_0x457080.error, /API Key/));
  }),
  test('providerConnectionTestApi: explains auth failures in human language', async (_0x3125ee) => {
    const _0x249381 = globalThis.fetch;
    ((globalThis.fetch = async () => jsonResponse({ error: 'invalid api key' }, 0x191)),
      _0x3125ee.after(() => {
        globalThis.fetch = _0x249381;
      }));
    const { testProviderConnection: _0x10fd9d } = await import('./providerConnectionTestApi.js'),
      _0x2e6c40 = await _0x10fd9d('openai', { apiUrl: 'https://api.openai.com', apiKey: 'bad-key' });
    (assert.equal(_0x2e6c40.ok, false),
      assert.equal(_0x2e6c40.category, 'auth_failed'),
      assert.match(_0x2e6c40.suggestion, /API Key/));
  }),
  test('providerConnectionTestApi: reports upload chain separately', async (_0xdd08e9) => {
    const _0x39551f = globalThis.fetch,
      _0x107a2d = [];
    ((globalThis.fetch = async (_0x126f5a, _0x440cd9 = {}) => {
      _0x107a2d.push({ url: String(_0x126f5a), options: _0x440cd9 });
      if (String(_0x126f5a).includes('/proxy/task?')) return jsonResponse({ data: [{ id: 'demo' }] });
      if (String(_0x126f5a).endsWith('/api/v2/proxy/completions'))
        return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
      return jsonResponse({ error: 'upload service unavailable' }, 0x1f4);
    }),
      _0xdd08e9.after(() => {
        globalThis.fetch = _0x39551f;
      }));
    const { testProviderConnection: _0x217a7a } = await import('./providerConnectionTestApi.js'),
      _0x2ff35d = await _0x217a7a('apimart', { apiUrl: 'https://api.apimart.ai', apiKey: 'am-key' });
    (assert.equal(_0x2ff35d.ok, false),
      assert.equal(_0x2ff35d.partial, true),
      assert.equal(_0x2ff35d.category, 'upload_failed'),
      assert.equal(_0x2ff35d.steps.find((_0x9b7bb6) => _0x9b7bb6.id === 'upload')?.ok, false),
      assert.match(_0x2ff35d.suggestion, /上传链路/),
      assert.equal(_0x107a2d.length, 4));
  }));
