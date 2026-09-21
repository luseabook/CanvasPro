import { requester } from './requester.js';
const SUBSCRIPTION_STATUS_PATH = '/api/v2/subscription/status',
  SUBSCRIPTION_ACTIVATE_PATH = '/api/v2/subscription/activate',
  SUBSCRIPTION_CLEAR_AUTHORIZATION_PATH = '/api/v2/subscription/authorization/clear';
function buildDeviceIdHeaders(_0x380c00) {
  const _0x46bf0f = String(_0x380c00 || '').trim();
  return _0x46bf0f ? { 'X-AIC-Device-Id': _0x46bf0f } : {};
}
export async function fetchSubscriptionStatus(_0x5f4507, _0xef5699 = '') {
  const _0x339600 = String(_0x5f4507 || '').trim(),
    _0x2d3278 = _0x339600 ? '?installId=' + encodeURIComponent(_0x339600) : '';
  return await requester({
    url: '' + SUBSCRIPTION_STATUS_PATH + _0x2d3278,
    method: 'GET',
    provider: 'local',
    timeout: 0x3a98,
    headers: buildDeviceIdHeaders(_0xef5699),
  });
}
export async function activateCdkey(_0x27e34c) {
  const _0x3ecef1 = String(_0x27e34c?.installId || '').trim(),
    _0x4c7bd1 = String(_0x27e34c?.cdkey || '').trim(),
    _0x2beb8a = String(_0x27e34c?.deviceId || '').trim();
  return await requester({
    url: SUBSCRIPTION_ACTIVATE_PATH,
    method: 'POST',
    provider: 'local',
    timeout: 0x4e20,
    headers: { 'Content-Type': 'application/json', ...buildDeviceIdHeaders(_0x2beb8a) },
    body: JSON.stringify({
      installId: _0x3ecef1,
      cdkey: _0x4c7bd1,
      ...(_0x2beb8a ? { deviceId: _0x2beb8a } : {}),
    }),
  });
}
export async function clearSubscriptionAuthorization(_0x5c32fb = {}) {
  const _0x44aa70 = String(_0x5c32fb?.installId || '').trim(),
    _0x414e44 = String(_0x5c32fb?.deviceId || '').trim();
  return await requester({
    url: SUBSCRIPTION_CLEAR_AUTHORIZATION_PATH,
    method: 'POST',
    provider: 'local',
    timeout: 0x3a98,
    headers: { 'Content-Type': 'application/json', ...buildDeviceIdHeaders(_0x414e44) },
    body: JSON.stringify({
      ...(_0x44aa70 ? { installId: _0x44aa70 } : {}),
      ...(_0x414e44 ? { deviceId: _0x414e44 } : {}),
    }),
  });
}
