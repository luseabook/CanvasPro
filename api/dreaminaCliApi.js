import { buildApiUrl, get, post, request } from './apiBase.js';
export const DREAMINA_CLI_STATUS_CHANGED_EVENT = 'aicanvas:dreamina-cli-status-changed';
let dreaminaCliStatusCache = null;
function notifyDreaminaCliStatusChanged() {
  const enabled = globalThis.window;
  if (!enabled || typeof enabled.dispatchEvent !== 'function') return;
  const value =
    typeof globalThis.CustomEvent === 'function'
      ? new globalThis.CustomEvent(DREAMINA_CLI_STATUS_CHANGED_EVENT)
      : { type: DREAMINA_CLI_STATUS_CHANGED_EVENT };
  enabled.dispatchEvent(value);
}
function rememberDreaminaCliStatus(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return args;
  if (
    !Object.prototype.hasOwnProperty.call(args, 'loggedIn') &&
    !Object.prototype.hasOwnProperty.call(args, 'installed')
  )
    return args;
  return ((dreaminaCliStatusCache = { ...args }), notifyDreaminaCliStatusChanged(), args);
}
function rememberDreaminaStatusFromPayload(response) {
  return (rememberDreaminaCliStatus(response?.status), response);
}
function rememberDreaminaLoginRuntime(runtime) {
  const item = String(runtime?.phase || '')
    .trim()
    .toLowerCase();
  return (
    ['success', 'reused', 'done'].includes(item) &&
      ((dreaminaCliStatusCache = {
        ...(dreaminaCliStatusCache || {}),
        loggedIn: true,
        runtime: runtime && typeof runtime === 'object' ? { ...runtime } : runtime,
      }),
      notifyDreaminaCliStatusChanged()),
    runtime
  );
}
export function getCachedDreaminaCliStatus() {
  return dreaminaCliStatusCache ? { ...dreaminaCliStatusCache } : null;
}
export function _resetDreaminaCliStatusCacheForTests() {
  dreaminaCliStatusCache = null;
}
export async function fetchDreaminaCliStatusFromServer(timer = {}) {
  const key = timer?.refresh ? '?refresh=1' : '',
    response2 = await get('/api/v2/dreamina/status' + key);
  if (!response2.success) throw new Error(response2.error || '获取 Dreamina CLI 状态失败');
  return rememberDreaminaCliStatus(response2.data || {});
}
export async function fetchDreaminaCliLoginRuntimeFromServer() {
  const response3 = await request('/api/v2/dreamina/login/runtime', {
    method: 'GET',
    cache: 'no-store',
  });
  if (!response3.success) throw new Error(response3.error || '获取 Dreamina 登录运行态失败');
  return rememberDreaminaLoginRuntime(response3.data || {});
}
export async function startDreaminaHeadlessLoginFromServer() {
  const response4 = await post('/api/v2/dreamina/login', { mode: 'headless' });
  if (!response4.success) throw new Error(response4.error || '发起 Dreamina headless 登录失败');
  return rememberDreaminaStatusFromPayload(response4.data || {});
}
export async function startDreaminaHeadlessReloginFromServer() {
  const response5 = await post('/api/v2/dreamina/relogin', { mode: 'headless' });
  if (!response5.success) throw new Error(response5.error || '发起 Dreamina headless 重新登录失败');
  return rememberDreaminaStatusFromPayload(response5.data || {});
}
export async function startDreaminaWebLoginFromServer(enabled2 = {}) {
  const response6 = await post('/api/v2/dreamina/login/web', { mode: 'web', force: !!enabled2?.force });
  if (!response6.success) throw new Error(response6.error || '发起 Dreamina OAuth 登录失败');
  return rememberDreaminaStatusFromPayload(response6.data || {});
}
export async function importDreaminaLoginResponseFromServer(loginResponse) {
  const response7 = await post('/api/v2/dreamina/login/import', { loginResponse: loginResponse });
  if (!response7.success) throw new Error(response7.error || '导入 Dreamina 登录态失败');
  return rememberDreaminaStatusFromPayload(response7.data || {});
}
export async function logoutDreaminaFromServer() {
  const response8 = await post('/api/v2/dreamina/logout', {});
  if (!response8.success) throw new Error(response8.error || '退出 Dreamina 登录失败');
  return rememberDreaminaStatusFromPayload(response8.data || {});
}
export function buildDreaminaQrImageUrl(index = 0) {
  const result = index ? '?v=' + encodeURIComponent(String(index)) : '';
  return buildApiUrl('/api/v2/dreamina/login/qr' + result);
}
