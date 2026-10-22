// 官方文本任务的准入白名单 + 敏感字段净化。
// 待恢复任务会随会话持久化，所以写入前必须保证 body 里不含任何凭据。
const ALLOWED_REQUEST_ROUTES = new Set([
    '/api/v2/chat',
    '/api/v2/proxy/completions',
    '/api/v2/local-gateway-test/chat',
    '/api/v2/local-gateway-test/completions',
  ]),
  SECRET_FIELD_NAMES = new Set(['apikey', 'modelapikey', 'authorization', 'credentialhandle']);
function stripSecrets(value) {
  return JSON.parse(
    JSON.stringify(value, (key, fieldValue) =>
      SECRET_FIELD_NAMES.has(key.toLowerCase()) ? undefined : fieldValue,
    ),
  );
}
export function normalizeOfficialTextPendingRequest(pendingRequest) {
  if (
    !pendingRequest ||
    typeof pendingRequest !== 'object' ||
    typeof pendingRequest.accountId !== 'string' ||
    !pendingRequest.accountId ||
    !ALLOWED_REQUEST_ROUTES.has(pendingRequest.request?.url) ||
    pendingRequest.request?.isProxy !== true ||
    !pendingRequest.request?.body ||
    typeof pendingRequest.request.body !== 'object' ||
    Array.isArray(pendingRequest.request.body) ||
    !['', 'local-test'].includes(pendingRequest.gatewayEnvironment)
  )
    return null;
  return {
    accountId: pendingRequest.accountId,
    gatewayEnvironment: pendingRequest.gatewayEnvironment,
    billingPurpose: String(pendingRequest.billingPurpose || ''),
    request: {
      url: pendingRequest.request.url,
      isProxy: true,
      body: stripSecrets(pendingRequest.request.body),
      ...(pendingRequest.request.responseMapping
        ? { responseMapping: stripSecrets(pendingRequest.request.responseMapping) }
        : {}),
    },
  };
}
export function snapshotOfficialTextPendingRequest(
  request,
  accountId,
  billingPurpose,
  gatewayEnvironment,
) {
  const snapshot = normalizeOfficialTextPendingRequest({
    accountId: accountId,
    request: request,
    billingPurpose: billingPurpose,
    gatewayEnvironment: gatewayEnvironment,
  });
  if (!snapshot) throw new Error('未能保存等待中的文本任务，请重新登录后重试；本次未开始生成。');
  return snapshot;
}
