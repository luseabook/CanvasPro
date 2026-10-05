import { requester } from './requester.js';
const SUBSCRIPTION_STATUS_PATH = '/api/v2/subscription/status',
  SUBSCRIPTION_ACTIVATE_PATH = '/api/v2/subscription/activate',
  SUBSCRIPTION_CLEAR_AUTHORIZATION_PATH = '/api/v2/subscription/authorization/clear';
function buildDeviceIdHeaders(value) {
  const item = String(value || '').trim();
  return item ? { 'X-AIC-Device-Id': item } : {};
}
export async function fetchSubscriptionStatus(key, index = '') {
  const result = String(key || '').trim(),
    data = result ? '?installId=' + encodeURIComponent(result) : '';
  return await requester({
    url: '' + SUBSCRIPTION_STATUS_PATH + data,
    method: 'GET',
    provider: 'local',
    timeout: 15000,
    headers: buildDeviceIdHeaders(index),
  });
}
export async function activateCdkey(options) {
  const installId = String(options?.installId || '').trim(),
    cdkey = String(options?.cdkey || '').trim(),
    deviceId = String(options?.deviceId || '').trim();
  return await requester({
    url: SUBSCRIPTION_ACTIVATE_PATH,
    method: 'POST',
    provider: 'local',
    timeout: 20000,
    headers: { 'Content-Type': 'application/json', ...buildDeviceIdHeaders(deviceId) },
    body: JSON.stringify({
      installId: installId,
      cdkey: cdkey,
      ...(deviceId ? { deviceId: deviceId } : {}),
    }),
  });
}
export async function clearSubscriptionAuthorization(options2 = {}) {
  const installId2 = String(options2?.installId || '').trim(),
    deviceId2 = String(options2?.deviceId || '').trim();
  return await requester({
    url: SUBSCRIPTION_CLEAR_AUTHORIZATION_PATH,
    method: 'POST',
    provider: 'local',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json', ...buildDeviceIdHeaders(deviceId2) },
    body: JSON.stringify({
      ...(installId2 ? { installId: installId2 } : {}),
      ...(deviceId2 ? { deviceId: deviceId2 } : {}),
    }),
  });
}
