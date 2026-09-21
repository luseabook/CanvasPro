import { buildApiUrl, get, post } from './apiBase.js';
export async function fetchDreaminaCliStatusFromServer(_0x3f5e5c = {}) {
  const _0x5117ef = _0x3f5e5c?.refresh ? '?refresh=1' : '',
    _0x4ec10c = await get('/api/v2/dreamina/status' + _0x5117ef);
  if (!_0x4ec10c.success) throw new Error(_0x4ec10c.error || '获取 Dreamina CLI 状态失败');
  return _0x4ec10c.data || {};
}
export async function fetchDreaminaCliLoginRuntimeFromServer() {
  const _0x50a805 = await get('/api/v2/dreamina/login/runtime');
  if (!_0x50a805.success) throw new Error(_0x50a805.error || '获取 Dreamina 登录运行态失败');
  return _0x50a805.data || {};
}
export async function startDreaminaHeadlessLoginFromServer() {
  const _0x5d0d31 = await post('/api/v2/dreamina/login', { mode: 'headless' });
  if (!_0x5d0d31.success) throw new Error(_0x5d0d31.error || '发起 Dreamina headless 登录失败');
  return _0x5d0d31.data || {};
}
export async function startDreaminaHeadlessReloginFromServer() {
  const _0x8c39e0 = await post('/api/v2/dreamina/relogin', { mode: 'headless' });
  if (!_0x8c39e0.success) throw new Error(_0x8c39e0.error || '发起 Dreamina headless 重新登录失败');
  return _0x8c39e0.data || {};
}
export async function startDreaminaWebLoginFromServer(_0x16abd3 = {}) {
  const _0x156c06 = await post('/api/v2/dreamina/login/web', { mode: 'web', force: !!_0x16abd3?.force });
  if (!_0x156c06.success) throw new Error(_0x156c06.error || '发起 Dreamina OAuth 登录失败');
  return _0x156c06.data || {};
}
export async function importDreaminaLoginResponseFromServer(_0x3ba8af) {
  const _0x3c0944 = await post('/api/v2/dreamina/login/import', { loginResponse: _0x3ba8af });
  if (!_0x3c0944.success) throw new Error(_0x3c0944.error || '导入 Dreamina 登录态失败');
  return _0x3c0944.data || {};
}
export async function logoutDreaminaFromServer() {
  const _0x2958b7 = await post('/api/v2/dreamina/logout', {});
  if (!_0x2958b7.success) throw new Error(_0x2958b7.error || '退出 Dreamina 登录失败');
  return _0x2958b7.data || {};
}
export function buildDreaminaQrImageUrl(_0x4d1818 = 0) {
  const _0x38419d = _0x4d1818 ? '?v=' + encodeURIComponent(String(_0x4d1818)) : '';
  return buildApiUrl('/api/v2/dreamina/login/qr' + _0x38419d);
}
