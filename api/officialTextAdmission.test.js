import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOfficialTextPendingRequest, snapshotOfficialTextPendingRequest } from './officialTextAdmission.js';

test('official text admission: 白名单路由与代理标记齐全才准入', () => {
  const validRequest = {
    accountId: 'acc-1',
    gatewayEnvironment: '',
    billingPurpose: 'chat',
    request: { url: '/api/v2/chat', isProxy: true, body: { model: 'gpt' } },
  };
  const normalized = normalizeOfficialTextPendingRequest(validRequest);
  (assert.equal(normalized.accountId, 'acc-1'),
    assert.equal(normalized.billingPurpose, 'chat'),
    assert.equal(normalized.request.url, '/api/v2/chat'),
    assert.equal(normalized.request.isProxy, true));
  // 路由不在白名单。
  assert.equal(
    normalizeOfficialTextPendingRequest({
      ...validRequest,
      request: { ...validRequest.request, url: '/api/v2/evil' },
    }),
    null,
  );
  // 非代理请求不得入队。
  assert.equal(
    normalizeOfficialTextPendingRequest({
      ...validRequest,
      request: { ...validRequest.request, isProxy: false },
    }),
    null,
  );
  // 缺 accountId。
  assert.equal(normalizeOfficialTextPendingRequest({ ...validRequest, accountId: '' }), null);
  // body 必须是对象。
  assert.equal(
    normalizeOfficialTextPendingRequest({
      ...validRequest,
      request: { ...validRequest.request, body: 'raw-string' },
    }),
    null,
  );
});
test('official text admission: 网关环境只接受空值与 local-test', () => {
  const baseRequest = {
    accountId: 'acc-1',
    request: { url: '/api/v2/proxy/completions', isProxy: true, body: {} },
  };
  (assert.ok(normalizeOfficialTextPendingRequest({ ...baseRequest, gatewayEnvironment: 'local-test' })),
    assert.ok(normalizeOfficialTextPendingRequest({ ...baseRequest, gatewayEnvironment: '' })),
    assert.equal(
      normalizeOfficialTextPendingRequest({ ...baseRequest, gatewayEnvironment: 'production' }),
      null,
    ));
});
test('official text admission: body 与 responseMapping 里的凭据一律剥离', () => {
  const normalized = normalizeOfficialTextPendingRequest({
    accountId: 'acc-1',
    gatewayEnvironment: '',
    request: {
      url: '/api/v2/chat',
      isProxy: true,
      body: {
        model: 'gpt',
        apiKey: 'sk-should-be-stripped',
        headers: { Authorization: 'Bearer secret', ModelApiKey: 'mk', keep: 'yes' },
        nested: { credentialHandle: 'handle-1', value: 1 },
      },
      responseMapping: { choices: '$.choices', authorization: 'nope' },
    },
  });
  const bodyJson = JSON.stringify(normalized.request.body);
  (assert.equal(bodyJson.includes('sk-should-be-stripped'), false),
    assert.equal(bodyJson.includes('Bearer secret'), false),
    assert.equal(bodyJson.includes('handle-1'), false),
    assert.equal(bodyJson.includes('nope'), false),
    // 非敏感字段完整保留。
    assert.equal(normalized.request.body.model, 'gpt'),
    assert.equal(normalized.request.body.headers.keep, 'yes'),
    assert.equal(normalized.request.responseMapping.choices, '$.choices'));
});
test('official text admission: snapshot 非法时抛出可读错误', () => {
  assert.throws(
    () => snapshotOfficialTextPendingRequest({ url: '/api/v2/not-allowed', isProxy: true, body: {} }, 'acc-1', '', ''),
    /未能保存等待中的文本任务/,
  );
  const snapshot = snapshotOfficialTextPendingRequest(
    { url: '/api/v2/chat', isProxy: true, body: { model: 'gpt' } },
    'acc-1',
    'chat',
    '',
  );
  (assert.equal(snapshot.accountId, 'acc-1'), assert.equal(snapshot.billingPurpose, 'chat'));
});
