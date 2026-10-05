import { get, post } from './apiBase.js';
import { requestCliTextStream } from './cliTextStream.js';
export const CLI_PROVIDER_STATUS_CHANGED_EVENT = 'aicanvas:cli-provider-status-changed';
let cliProviderStatusesCache = null;
const cliProviderModelsCache = new Map(),
  cliProviderModelsRequests = new Map();
function cloneStatuses(enabled) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return null;
  return JSON['parse'](JSON['stringify'](enabled));
}
function cloneModelCatalog(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object' || Array['isArray'](enabled2)) return null;
  return JSON['parse'](JSON['stringify'](enabled2));
}
function notifyCliProviderStatusChanged() {
  const enabled3 = globalThis['window'];
  if (!enabled3 || typeof enabled3['dispatchEvent'] !== 'function') return;
  const value =
    typeof globalThis['CustomEvent'] === 'function'
      ? new globalThis['CustomEvent'](CLI_PROVIDER_STATUS_CHANGED_EVENT)
      : { type: CLI_PROVIDER_STATUS_CHANGED_EVENT };
  enabled3['dispatchEvent'](value);
}
function rememberCliProviderStatuses(item) {
  const cloneStatuses2 = cloneStatuses(item);
  if (!cloneStatuses2) return item;
  return ((cliProviderStatusesCache = cloneStatuses2), notifyCliProviderStatusChanged(), item);
}
function normalizeCliProvider(key) {
  const enabled4 = String(key || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled4) throw new TypeError('CLI provider 不能为空');
  return encodeURIComponent(enabled4);
}
function unwrapCliProviderResult(response, index) {
  if (!response['success']) throw new Error(response['error'] || index);
  return response['data'] || {};
}
export async function fetchCliProviderStatuses() {
  const get2 = await get('/api/v2/cli-providers/status');
  return rememberCliProviderStatuses(unwrapCliProviderResult(get2, '获取 CLI Provider 状态失败'));
}
export function getCachedCliProviderStatus(result) {
  const enabled5 = String(result || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled5 || !cliProviderStatusesCache) return null;
  const data = cliProviderStatusesCache['providers'],
    args =
      data && typeof data === 'object' && !Array['isArray'](data)
        ? data[enabled5]
        : cliProviderStatusesCache[enabled5];
  return args && typeof args === 'object' && !Array['isArray'](args) ? { ...args } : null;
}
export function _resetCliProviderStatusesCacheForTests() {
  cliProviderStatusesCache = null;
}
export function getCachedCliProviderModels(options) {
  const enabled6 = String(options || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled6) return null;
  return cloneModelCatalog(cliProviderModelsCache['get'](enabled6));
}
export function _resetCliProviderModelsCacheForTests() {
  (cliProviderModelsCache['clear'](), cliProviderModelsRequests['clear']());
}
export async function fetchCliProviderModels(target, { force: force = false } = {}) {
  const decodeURIComponent2 = decodeURIComponent(normalizeCliProvider(target)),
    source = cliProviderModelsRequests['get'](decodeURIComponent2);
  if (source) return source;
  if (!force) {
    const cachedCliProviderModels = getCachedCliProviderModels(decodeURIComponent2);
    if (cachedCliProviderModels) return cachedCliProviderModels;
  }
  const get3 = get('/api/v2/cli-providers/' + encodeURIComponent(decodeURIComponent2) + '/models')
    ['then']((next) => unwrapCliProviderResult(next, '获取 CLI Provider 模型列表失败'))
    ['then']((current) => {
      const cloneModelCatalog2 = cloneModelCatalog(current);
      if (!cloneModelCatalog2) throw new Error('CLI Provider 返回了无效的模型列表');
      return (
        cliProviderModelsCache['set'](decodeURIComponent2, cloneModelCatalog2),
        cloneModelCatalog(cloneModelCatalog2)
      );
    })
    ['finally'](() => {
      cliProviderModelsRequests['get'](decodeURIComponent2) === get3 &&
        cliProviderModelsRequests['delete'](decodeURIComponent2);
    });
  return (cliProviderModelsRequests['set'](decodeURIComponent2, get3), get3);
}
export async function startCliProviderLogin(entry) {
  const cliProvider = normalizeCliProvider(entry),
    post2 = await post('/api/v2/cli-providers/' + cliProvider + '/login', {});
  return unwrapCliProviderResult(post2, '发起 CLI Provider 登录失败');
}
export async function logoutCliProvider(record) {
  const cliProvider2 = normalizeCliProvider(record),
    post3 = await post('/api/v2/cli-providers/' + cliProvider2 + '/logout', {}),
    unwrapCliProviderResult2 = unwrapCliProviderResult(post3, '退出 CLI Provider 登录失败');
  return (cliProviderModelsCache['delete'](decodeURIComponent(cliProvider2)), unwrapCliProviderResult2);
}
export async function generateTextWithCliProvider(payload) {
  const { onText: onText, signal: signal, ...args2 } = payload || {},
    count = Number(payload?.['timeoutMs']),
    timeoutMs =
      payload?.['disableRequestTimeout'] === true
        ? null
        : Number['isFinite'](count) && count > 0
          ? Math['max'](30000, Math['trunc'](count) + 5000)
          : undefined;
  if (typeof onText === 'function')
    return requestCliTextStream(args2, { onText: onText, signal: signal, timeoutMs: timeoutMs });
  const post4 = await post('/api/v2/cli-providers/generate-text', args2, timeoutMs);
  return unwrapCliProviderResult(post4, 'CLI Provider 文本生成失败');
}
export async function generateImageWithCliProvider(args3) {
  const count2 = Number(args3?.['timeoutMs']),
    timeoutMs2 =
      Number['isFinite'](count2) && count2 > 0
        ? Math['max'](30000, Math['min'](900000, Math['trunc'](count2 / 1000) * 1000))
        : 600000,
    post5 = await post(
      '/api/v2/cli-providers/generate-image',
      { ...args3, timeoutMs: timeoutMs2 },
      timeoutMs2 + 5000,
    );
  return unwrapCliProviderResult(post5, 'OpenAI CLI 图像生成失败');
}
