import test from 'node:test';
import assert from 'node:assert/strict';
function jsonResponse(value, ok = 200) {
  return {
    ok: ok >= 200 && ok < 0x12c,
    status: ok,
    headers: { get: () => 'application/json' },
    json: async () => value,
    text: async () => JSON.stringify(value),
  };
}
(test('providerConnectionTestApi: probes APIMart with models endpoint', async (item) => {
  const key = globalThis.fetch,
    list = [];
  ((globalThis.fetch = async (index, options = {}) => {
    list.push({ url: String(index), options: options });
    if (decodeURIComponent(String(index)).includes('/v1/user/balance'))
      return jsonResponse({ success: true, remain_balance: 100.5, used_balance: 25, unlimited_quota: false });
    if (String(index).endsWith('/api/v2/proxy/apimart-upload')) {
      const result = Object.fromEntries(options.body.entries());
      return (
        assert.equal(result.apiKey, 'am-key'),
        assert.equal(result.apiUrl, 'https://api.apimart.ai'),
        jsonResponse({ cdnUrl: 'https://upload.apimart.ai/aic-test.png' })
      );
    }
    return jsonResponse({ data: [{ id: 'demo' }] });
  }),
    item.after(() => {
      globalThis.fetch = key;
    }));
  const { testProviderConnection: testProviderConnection } = await import('./providerConnectionTestApi.js'),
    response = await testProviderConnection('apimart', {
      apiUrl: 'https://api.apimart.ai',
      apiKey: 'am-key',
    });
  (assert.equal(response.ok, true),
    assert.equal(list.length, 3),
    assert.equal(response.balance?.displayText, '余额 100.5 美元'),
    assert.equal(response.balance?.remaining, 100.5),
    assert.deepEqual(
      response.steps.map((item2) => item2.id),
      ['config', 'auth', 'model', 'balance', 'upload'],
    ),
    assert.equal(list[0].options.method, 'GET'),
    assert.equal(list[0].options.headers.Authorization, 'Bearer am-key'),
    assert.ok(
      decodeURIComponent(list[0].url).includes('/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/models'),
    ),
    assert.equal(
      response.steps.find((item3) => item3.id === 'model')?.message,
      '模型列表可访问，未执行额外模型调用',
    ),
    assert.ok(
      decodeURIComponent(list[1].url).includes(
        '/api/v2/proxy/task?apiUrl=https://api.apimart.ai/v1/user/balance',
      ),
    ));
}),
  test('providerConnectionTestApi: strips APIMart /v1 before upload probe', async (data) => {
    const target = globalThis.fetch;
    ((globalThis.fetch = async (source, dom = {}) => {
      const next = String(source);
      if (next.endsWith('/api/v2/proxy/apimart-upload')) {
        const current = Object.fromEntries(dom.body.entries());
        return (
          assert.equal(current.apiUrl, 'https://api.apimart.ai'),
          jsonResponse({ url: 'https://upload.apimart.ai/aic-test.png' })
        );
      }
      if (decodeURIComponent(next).includes('/v1/user/balance'))
        return jsonResponse({ success: true, remain_balance: 1 });
      return jsonResponse({ data: [{ id: 'demo' }] });
    }),
      data.after(() => {
        globalThis.fetch = target;
      }));
    const { testProviderConnection: testProviderConnection2 } =
        await import('./providerConnectionTestApi.js'),
      response2 = await testProviderConnection2('apimart', {
        apiUrl: 'https://api.apimart.ai/v1',
        apiKey: 'am-key',
      });
    assert.equal(response2.ok, true);
  }),
  test('providerConnectionTestApi: APIMart 默认使用国内1线路', async (entry) => {
    const record = globalThis.fetch,
      list2 = [];
    ((globalThis.fetch = async (payload, options2 = {}) => {
      list2.push({ url: String(payload), options: options2 });
      const list3 = decodeURIComponent(String(payload));
      if (list3.includes('/v1/user/balance')) return jsonResponse({ success: true, remain_balance: 1 });
      if (String(payload).endsWith('/api/v2/proxy/apimart-upload')) {
        const handle = Object.fromEntries(options2.body.entries());
        return (
          assert.equal(handle.apiUrl, 'https://api.apib.ai'),
          jsonResponse({ cdnUrl: 'https://upload.apib.ai/aic-test.png' })
        );
      }
      return jsonResponse({ data: [{ id: 'demo' }] });
    }),
      entry.after(() => {
        globalThis.fetch = record;
      }));
    const { testProviderConnection: testProviderConnection3 } =
        await import('./providerConnectionTestApi.js'),
      response3 = await testProviderConnection3('apimart', { apiKey: 'am-key' });
    (assert.equal(response3.ok, true),
      assert.ok(
        decodeURIComponent(list2[0].url).includes('/api/v2/proxy/task?apiUrl=https://api.apib.ai/v1/models'),
      ),
      assert.ok(
        decodeURIComponent(list2[1].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.apib.ai/v1/user/balance',
        ),
      ));
  }),
  test('providerConnectionTestApi: APIMart routeId domestic2 uses aishuch endpoints', async (state) => {
    const config = globalThis.fetch,
      list4 = [];
    ((globalThis.fetch = async (scope, options3 = {}) => {
      list4.push({ url: String(scope), options: options3 });
      const list5 = decodeURIComponent(String(scope));
      if (list5.includes('/v1/user/balance')) return jsonResponse({ success: true, remain_balance: 1 });
      if (String(scope).endsWith('/api/v2/proxy/apimart-upload')) {
        const input = Object.fromEntries(options3.body.entries());
        return (
          assert.equal(input.apiUrl, 'https://api.aishuch.com'),
          jsonResponse({ cdnUrl: 'https://upload.aishuch.com/aic-test.png' })
        );
      }
      return jsonResponse({ data: [{ id: 'demo' }] });
    }),
      state.after(() => {
        globalThis.fetch = config;
      }));
    const { testProviderConnection: testProviderConnection4 } =
        await import('./providerConnectionTestApi.js'),
      response4 = await testProviderConnection4('apimart', { routeId: 'domestic2', apiKey: 'am-key' });
    (assert.equal(response4.ok, true),
      assert.ok(
        decodeURIComponent(list4[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.aishuch.com/v1/models',
        ),
      ),
      assert.ok(
        decodeURIComponent(list4[1].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.aishuch.com/v1/user/balance',
        ),
      ));
  }),
  test('providerConnectionTestApi: probes Agnes with models then chat fallback', async (output) => {
    const value2 = globalThis.fetch,
      list6 = [];
    ((globalThis.fetch = async (value3, options4 = {}) => {
      list6.push({ url: String(value3), options: options4 });
      if (String(value3).endsWith('/api/v2/proxy/completions')) {
        const value4 = JSON.parse(options4.body);
        return (
          assert.equal(value4.apiUrl, 'https://apihub.agnes-ai.com/v1'),
          assert.equal(value4.apiKey, 'agnes-key'),
          assert.equal(value4.model, 'agnes-3.0-flash'),
          assert.equal(value4.max_tokens, 1),
          jsonResponse({ choices: [{ message: { content: 'ok' } }] })
        );
      }
      return jsonResponse({ data: [{ id: 'agnes-3.0-flash' }, { id: 'agnes-image-2.1-flash' }] });
    }),
      output.after(() => {
        globalThis.fetch = value2;
      }));
    const { testProviderConnection: testProviderConnection5 } =
        await import('./providerConnectionTestApi.js'),
      response5 = await testProviderConnection5('agnes', {
        apiUrl: 'https://apihub.agnes-ai.com',
        apiKey: 'Bearer agnes-key',
      });
    (assert.equal(response5.ok, true),
      assert.equal(list6.length, 2),
      assert.deepEqual(
        response5.steps.map((item4) => item4.id),
        ['config', 'auth', 'model', 'upload'],
      ),
      assert.equal(list6[0].options.method, 'GET'),
      assert.equal(list6[0].options.headers.Authorization, 'Bearer agnes-key'),
      assert.ok(
        decodeURIComponent(list6[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://apihub.agnes-ai.com/v1/models',
        ),
      ),
      assert.equal(response5.steps.find((item5) => item5.id === 'upload')?.skipped, true));
  }),
  test('providerConnectionTestApi: normalizes APIMart unlimited balance payloads', async () => {
    const { normalizeApimartBalancePayload: normalizeApimartBalancePayload } =
        await import('./providerConnectionTestApi.js'),
      value5 = normalizeApimartBalancePayload({
        data: { success: true, unlimited_quota: true, remain_balance: -1, used_balance: '12.75' },
      });
    (assert.equal(value5.displayText, '余额 不限'),
      assert.equal(value5.unlimited, true),
      assert.equal(value5.remaining, null),
      assert.equal(value5.used, 12.75),
      assert.match(value5.detailText, /额度不限/),
      assert.doesNotMatch(value5.detailText, /-1/),
      assert.doesNotMatch(value5.detailText, /已用余额/));
  }),
  test('providerConnectionTestApi: normalizes RunningHUB account status balances', async () => {
    const { normalizeRunningHubBalancePayload: normalizeRunningHubBalancePayload } =
        await import('./providerConnectionTestApi.js'),
      value6 = normalizeRunningHubBalancePayload({
        workflow: {
          code: 0,
          msg: 'success',
          data: { remainCoins: '99999', remainMoney: '5', currency: 'CNY' },
        },
        model: { code: 0, msg: 'success', data: { remainCoins: '12', remainMoney: '999', currency: 'CNY' } },
      });
    (assert.equal(value6.displayText, '积分 99,999 · 钱包 999 人民币'),
      assert.equal(value6.workflowCredits, 0x1869f),
      assert.equal(value6.modelWallet, 0x3e7),
      assert.equal(value6.currencyLabel, '人民币'),
      assert.match(value6.detailText, /工作流积分：99,999/),
      assert.match(value6.detailText, /模型钱包：999 人民币/));
  }),
  test('providerConnectionTestApi: normalizes GRSAI API key credits payloads', async () => {
    const { normalizeGrsaiBalancePayload: normalizeGrsaiBalancePayload } =
        await import('./providerConnectionTestApi.js'),
      value7 = normalizeGrsaiBalancePayload({ code: 0, data: { credits: '4321.25' } });
    (assert.equal(value7.displayText, '积分 4,321.25'),
      assert.equal(value7.credits, 4321.25),
      assert.equal(value7.source, 'account'),
      assert.match(value7.detailText, /账户积分：4,321.25/));
    const value8 = normalizeGrsaiBalancePayload({ code: 200, data: '8765' }, { source: 'apiKey' });
    (assert.equal(value8.displayText, '积分 8,765'), assert.equal(value8.source, 'apiKey'));
  }),
  test('providerConnectionTestApi: probes GRSAI with domestic chat completions directly', async (value9) => {
    const value10 = globalThis.fetch,
      list7 = [];
    ((globalThis.fetch = async (value11, options5 = {}) => {
      list7.push({ url: String(value11), options: options5 });
      if (String(value11).endsWith('/api/v2/proxy/completions'))
        return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
      if (String(value11).endsWith('/client/openapi/getCredits'))
        return jsonResponse({ code: 0, data: { credits: '4321.25' } });
      if (String(value11).endsWith('/client/resource/newUploadTokenZH'))
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
      value9.after(() => {
        globalThis.fetch = value10;
      }));
    const { testProviderConnection: testProviderConnection6 } =
        await import('./providerConnectionTestApi.js'),
      response6 = await testProviderConnection6('grsai', {
        apiUrl: 'https://grsaiapi.com',
        apiKey: 'grsai-key',
      });
    (assert.equal(response6.ok, true),
      assert.equal(list7.length, 4),
      assert.deepEqual(
        response6.steps.map((item6) => item6.id),
        ['config', 'model', 'balance', 'upload'],
      ),
      assert.equal(response6.balance?.displayText, '积分 4,321.25'),
      assert.equal(response6.balance?.credits, 4321.25),
      assert.equal(response6.balance?.source, 'account'),
      assert.equal(list7[0].url, '/api/v2/proxy/completions'));
    const value12 = JSON.parse(list7[0].options.body);
    (assert.equal(value12.apiUrl, 'https://grsai.dakka.com.cn/v1'),
      assert.equal(value12.apiKey, 'grsai-key'),
      assert.equal(value12.model, 'gemini-3.1-pro'),
      assert.equal(value12.max_tokens, undefined),
      assert.deepEqual(value12.messages, [{ role: 'user', content: '你好' }]),
      assert.equal(list7[1].url, 'https://grsai.dakka.com.cn/client/openapi/getCredits'),
      assert.equal(list7[1].options.method, 'POST'),
      assert.equal(list7[1].options.headers.Authorization, undefined),
      assert.deepEqual(JSON.parse(list7[1].options.body), { token: 'grsai-key' }));
  }),
  test('providerConnectionTestApi: GRSAI falls back when API key credits are zero', async (value13) => {
    const value14 = globalThis.fetch,
      list8 = [];
    ((globalThis.fetch = async (value15, options6 = {}) => {
      list8.push({ url: String(value15), options: options6 });
      if (String(value15).endsWith('/api/v2/proxy/completions'))
        return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
      if (String(value15).endsWith('/client/openapi/getCredits'))
        return jsonResponse({ code: 0, data: { credits: '0' } });
      if (String(value15).includes('/client/common/getCredits?'))
        return jsonResponse({ code: 0, data: { credits: '9876' } });
      if (String(value15).endsWith('/client/resource/newUploadTokenZH'))
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
      value13.after(() => {
        globalThis.fetch = value14;
      }));
    const { testProviderConnection: testProviderConnection7 } =
        await import('./providerConnectionTestApi.js'),
      response7 = await testProviderConnection7('grsai', {
        apiUrl: 'https://grsaiapi.com',
        apiKey: 'grsai-key',
      });
    (assert.equal(response7.ok, true),
      assert.equal(response7.balance?.displayText, '积分 9,876'),
      assert.equal(response7.balance?.source, 'account'),
      assert.ok(list8[2].url.includes('/client/common/getCredits?apikey=grsai-key')));
  }),
  test('providerConnectionTestApi: PPIO uses official models endpoint without model-specific fallback', async (value16) => {
    const value17 = globalThis.fetch,
      list9 = [];
    ((globalThis.fetch = async (value18, options7 = {}) => {
      return (
        list9.push({ url: String(value18), options: options7 }),
        jsonResponse({ data: [{ id: 'deepseek/deepseek-v3-0324' }] })
      );
    }),
      value16.after(() => {
        globalThis.fetch = value17;
      }));
    const { testProviderConnection: testProviderConnection8 } =
        await import('./providerConnectionTestApi.js'),
      response8 = await testProviderConnection8('ppio', {
        apiUrl: 'https://api.ppio.com',
        apiKey: 'Bearer ppio-key',
      });
    (assert.equal(response8.ok, true),
      assert.equal(list9.length, 1),
      assert.equal(response8.steps.find((item7) => item7.id === 'model')?.skipped, true),
      assert.equal(response8.steps.find((item8) => item8.id === 'upload')?.skipped, true),
      assert.equal(list9[0].options.headers.Authorization, 'Bearer ppio-key'),
      assert.ok(
        decodeURIComponent(list9[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://api.ppio.com/openai/v1/models',
        ),
      ));
  }),
  test('providerConnectionTestApi: volcengine uses Ark ping endpoint', async (value19) => {
    const value20 = globalThis.fetch,
      list10 = [];
    ((globalThis.fetch = async (value21, options8 = {}) => {
      return (list10.push({ url: String(value21), options: options8 }), jsonResponse('pong'));
    }),
      value19.after(() => {
        globalThis.fetch = value20;
      }));
    const { testProviderConnection: testProviderConnection9 } =
        await import('./providerConnectionTestApi.js'),
      response9 = await testProviderConnection9('volcengine', {
        apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: 'ark-key',
      });
    (assert.equal(response9.ok, true),
      assert.equal(list10.length, 1),
      assert.deepEqual(
        response9.steps.map((item9) => item9.id),
        ['config', 'auth', 'upload'],
      ),
      assert.equal(list10[0].options.method, 'GET'),
      assert.equal(list10[0].options.headers.Authorization, 'Bearer ark-key'),
      assert.ok(
        decodeURIComponent(list10[0].url).includes(
          '/api/v2/proxy/task?apiUrl=https://ark.cn-beijing.volces.com/ping',
        ),
      ));
  }),
  test('providerConnectionTestApi: runninghub treats invalid task response as credential pass', async (value22) => {
    const value23 = globalThis.fetch,
      list11 = [];
    ((globalThis.fetch = async (value24, options9 = {}) => {
      list11.push({ url: String(value24), options: options9 });
      if (String(value24) === '/api/v2/proxy/image') {
        const value25 = JSON.parse(String(options9.body || '{}'));
        if (String(value25.apiUrl || '').endsWith('/uc/openapi/accountStatus'))
          return jsonResponse({
            code: 0,
            msg: 'success',
            data: { remainCoins: '12345', remainMoney: '0', currency: 'CNY' },
          });
      }
      if (String(value24).startsWith('/api/v2/proxy/upload?'))
        return jsonResponse({ code: 0, data: { download_url: 'https://www.runninghub.cn/aic-test.png' } });
      return jsonResponse({ code: 0x324, message: 'task not found' });
    }),
      value22.after(() => {
        globalThis.fetch = value23;
      }));
    const { testProviderConnection: testProviderConnection10 } =
        await import('./providerConnectionTestApi.js'),
      response10 = await testProviderConnection10('runninghub', { apiKey: 'rh-workflow-key' });
    (assert.equal(response10.ok, true),
      assert.equal(list11.length, 2),
      assert.equal(response10.balance?.displayText, '积分 12,345'),
      assert.equal(response10.balance?.workflowCredits, 0x3039),
      assert.equal(list11[0].url, '/api/v2/runninghubwf/query'),
      assert.deepEqual(JSON.parse(list11[0].options.body), {
        apiKey: 'rh-workflow-key',
        taskId: 'aic-connection-test',
      }),
      assert.equal(response10.steps.find((item10) => item10.id === 'upload')?.skipped, true));
  }),
  test('providerConnectionTestApi: runninghub upload probe uses modelApiKey', async (value26) => {
    const value27 = globalThis.fetch,
      list12 = [];
    ((globalThis.fetch = async (value28, options10 = {}) => {
      list12.push({ url: String(value28), options: options10 });
      if (String(value28) === '/api/v2/proxy/image') {
        const remainCoins = JSON.parse(String(options10.body || '{}'));
        if (String(remainCoins.apiUrl || '').endsWith('/uc/openapi/accountStatus'))
          return jsonResponse({
            code: 0,
            msg: 'success',
            data: {
              remainCoins: remainCoins.apikey === 'rh-workflow-key' ? '54321' : '0',
              remainMoney: remainCoins.apikey === 'rh-model-key' ? '888.5' : '0',
              currency: 'CNY',
            },
          });
      }
      if (String(value28).startsWith('/api/v2/proxy/upload?'))
        return jsonResponse({ code: 0, data: { download_url: 'https://www.runninghub.cn/aic-test.png' } });
      return jsonResponse({ code: 0x324, message: 'task not found' });
    }),
      value26.after(() => {
        globalThis.fetch = value27;
      }));
    const { testProviderConnection: testProviderConnection11 } =
        await import('./providerConnectionTestApi.js'),
      response11 = await testProviderConnection11('runninghub', {
        apiKey: 'rh-workflow-key',
        modelApiKey: 'rh-model-key',
      });
    (assert.equal(response11.ok, true),
      assert.equal(list12.length, 5),
      assert.equal(response11.balance?.displayText, '积分 54,321 · 钱包 888.5 人民币'));
    const value29 = list12.find((response12) => response12.url === '/api/v2/runninghubwf/query'),
      value30 = list12.find((response13) => {
        if (response13.url !== '/api/v2/proxy/image') return false;
        const value31 = JSON.parse(String(response13.options.body || '{}'));
        return String(value31.apiUrl || '').endsWith('/openapi/v2/query');
      }),
      list13 = list12.filter((response14) => {
        if (response14.url !== '/api/v2/proxy/image') return false;
        const value32 = JSON.parse(String(response14.options.body || '{}'));
        return String(value32.apiUrl || '').endsWith('/uc/openapi/accountStatus');
      }),
      value33 = list12.find((response15) => response15.url.startsWith('/api/v2/proxy/upload?'));
    (assert.deepEqual(JSON.parse(value29.options.body), {
      apiKey: 'rh-workflow-key',
      taskId: 'aic-connection-test',
    }),
      assert.equal(JSON.parse(value30.options.body).apiKey, 'rh-model-key'),
      assert.deepEqual(
        list13.map((item11) => JSON.parse(String(item11.options.body || '{}')).apikey),
        ['rh-workflow-key', 'rh-model-key'],
      ),
      assert.equal(value33.options.headers.Authorization, 'Bearer rh-model-key'));
  }),
  test('providerConnectionTestApi: missing provider key fails before fetch', async (value34) => {
    const value35 = globalThis.fetch;
    ((globalThis.fetch = async () => {
      throw new Error('fetch should not be called');
    }),
      value34.after(() => {
        globalThis.fetch = value35;
      }));
    const { testProviderConnection: testProviderConnection12 } =
        await import('./providerConnectionTestApi.js'),
      response16 = await testProviderConnection12('openai', { apiUrl: 'https://api.openai.com', apiKey: '' });
    (assert.equal(response16.ok, false), assert.match(response16.error, /API Key/));
  }),
  test('providerConnectionTestApi: explains auth failures in human language', async (value36) => {
    const value37 = globalThis.fetch;
    ((globalThis.fetch = async () => jsonResponse({ error: 'invalid api key' }, 0x191)),
      value36.after(() => {
        globalThis.fetch = value37;
      }));
    const { testProviderConnection: testProviderConnection13 } =
        await import('./providerConnectionTestApi.js'),
      response17 = await testProviderConnection13('openai', {
        apiUrl: 'https://api.openai.com',
        apiKey: 'bad-key',
      });
    (assert.equal(response17.ok, false),
      assert.equal(response17.category, 'auth_failed'),
      assert.match(response17.suggestion, /API Key/));
  }),
  test('providerConnectionTestApi: reports upload chain separately', async (value38) => {
    const value39 = globalThis.fetch,
      list14 = [];
    ((globalThis.fetch = async (value40, options11 = {}) => {
      list14.push({ url: String(value40), options: options11 });
      if (String(value40).includes('/proxy/task?')) return jsonResponse({ data: [{ id: 'demo' }] });
      if (String(value40).endsWith('/api/v2/proxy/completions'))
        return jsonResponse({ choices: [{ message: { content: 'ok' } }] });
      return jsonResponse({ error: 'upload service unavailable' }, 0x1f4);
    }),
      value38.after(() => {
        globalThis.fetch = value39;
      }));
    const { testProviderConnection: testProviderConnection14 } =
        await import('./providerConnectionTestApi.js'),
      response18 = await testProviderConnection14('apimart', {
        apiUrl: 'https://api.apimart.ai',
        apiKey: 'am-key',
      });
    (assert.equal(response18.ok, false),
      assert.equal(response18.partial, true),
      assert.equal(response18.category, 'upload_failed'),
      assert.equal(response18.steps.find((item12) => item12.id === 'upload')?.ok, false),
      assert.match(response18.suggestion, /上传链路/),
      assert.equal(list14.length, 4));
  }));
