import { get, post } from './apiBase.js';
import { requestCliTextStream } from './cliTextStream.js';
export const CLI_PROVIDER_STATUS_CHANGED_EVENT = 'aicanvas:cli-provider-status-changed';
let cliProviderStatusesCache = null;
const cliProviderModelsCache = new Map(),
  cliProviderModelsRequests = new Map();
function cloneStatuses(_0x25497f) {
  if (!_0x25497f || typeof _0x25497f !== 'object' || Array['isArray'](_0x25497f)) return null;
  return JSON['parse'](JSON['stringify'](_0x25497f));
}
function cloneModelCatalog(_0xf24b68) {
  if (!_0xf24b68 || typeof _0xf24b68 !== 'object' || Array['isArray'](_0xf24b68)) return null;
  return JSON['parse'](JSON['stringify'](_0xf24b68));
}
function notifyCliProviderStatusChanged() {
  const _0x1cce54 = globalThis['window'];
  if (!_0x1cce54 || typeof _0x1cce54['dispatchEvent'] !== 'function') return;
  const _0x34e14d =
    typeof globalThis['CustomEvent'] === 'function'
      ? new globalThis['CustomEvent'](CLI_PROVIDER_STATUS_CHANGED_EVENT)
      : { type: CLI_PROVIDER_STATUS_CHANGED_EVENT };
  _0x1cce54['dispatchEvent'](_0x34e14d);
}
function rememberCliProviderStatuses(_0x1ad4f3) {
  const _0xb28cd7 = cloneStatuses(_0x1ad4f3);
  if (!_0xb28cd7) return _0x1ad4f3;
  return ((cliProviderStatusesCache = _0xb28cd7), notifyCliProviderStatusChanged(), _0x1ad4f3);
}
function normalizeCliProvider(_0x2ea26a) {
  const _0x2e6a6f = String(_0x2ea26a || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x2e6a6f) throw new TypeError('CLI provider 不能为空');
  return encodeURIComponent(_0x2e6a6f);
}
function unwrapCliProviderResult(_0x173f6c, _0x554c50) {
  if (!_0x173f6c['success']) throw new Error(_0x173f6c['error'] || _0x554c50);
  return _0x173f6c['data'] || {};
}
export async function fetchCliProviderStatuses() {
  const _0xac66c1 = await get('/api/v2/cli-providers/status');
  return rememberCliProviderStatuses(unwrapCliProviderResult(_0xac66c1, '获取 CLI Provider 状态失败'));
}
export function getCachedCliProviderStatus(_0x1c8585) {
  const _0x47ad83 = String(_0x1c8585 || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x47ad83 || !cliProviderStatusesCache) return null;
  const _0xc06c97 = cliProviderStatusesCache['providers'],
    _0xec312c =
      _0xc06c97 && typeof _0xc06c97 === 'object' && !Array['isArray'](_0xc06c97)
        ? _0xc06c97[_0x47ad83]
        : cliProviderStatusesCache[_0x47ad83];
  return _0xec312c && typeof _0xec312c === 'object' && !Array['isArray'](_0xec312c) ? { ..._0xec312c } : null;
}
export function _resetCliProviderStatusesCacheForTests() {
  cliProviderStatusesCache = null;
}
export function getCachedCliProviderModels(_0x25bb6b) {
  const _0x4cef75 = String(_0x25bb6b || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x4cef75) return null;
  return cloneModelCatalog(cliProviderModelsCache['get'](_0x4cef75));
}
export function _resetCliProviderModelsCacheForTests() {
  (cliProviderModelsCache['clear'](), cliProviderModelsRequests['clear']());
}
export async function fetchCliProviderModels(_0x31a0c8, { force: force = ![] } = {}) {
  const _0x3f20e8 = decodeURIComponent(normalizeCliProvider(_0x31a0c8)),
    _0x426a6b = cliProviderModelsRequests['get'](_0x3f20e8);
  if (_0x426a6b) return _0x426a6b;
  if (!force) {
    const _0x4c69fb = getCachedCliProviderModels(_0x3f20e8);
    if (_0x4c69fb) return _0x4c69fb;
  }
  const _0x8c3449 = get('/api/v2/cli-providers/' + encodeURIComponent(_0x3f20e8) + '/models')
    ['then']((_0x3ce9a2) => unwrapCliProviderResult(_0x3ce9a2, '获取 CLI Provider 模型列表失败'))
    ['then']((_0x5067eb) => {
      const _0x528f44 = cloneModelCatalog(_0x5067eb);
      if (!_0x528f44) throw new Error('CLI Provider 返回了无效的模型列表');
      return (cliProviderModelsCache['set'](_0x3f20e8, _0x528f44), cloneModelCatalog(_0x528f44));
    })
    ['finally'](() => {
      cliProviderModelsRequests['get'](_0x3f20e8) === _0x8c3449 &&
        cliProviderModelsRequests['delete'](_0x3f20e8);
    });
  return (cliProviderModelsRequests['set'](_0x3f20e8, _0x8c3449), _0x8c3449);
}
export async function startCliProviderLogin(_0x3a6d3c) {
  const _0x755969 = normalizeCliProvider(_0x3a6d3c),
    _0x42de6f = await post('/api/v2/cli-providers/' + _0x755969 + '/login', {});
  return unwrapCliProviderResult(_0x42de6f, '发起 CLI Provider 登录失败');
}
export async function logoutCliProvider(_0x190451) {
  const _0x1c27c2 = normalizeCliProvider(_0x190451),
    _0x23a3ab = await post('/api/v2/cli-providers/' + _0x1c27c2 + '/logout', {}),
    _0x279c92 = unwrapCliProviderResult(_0x23a3ab, '退出 CLI Provider 登录失败');
  return (cliProviderModelsCache['delete'](decodeURIComponent(_0x1c27c2)), _0x279c92);
}
export async function generateTextWithCliProvider(_0x287a21) {
  const { onText: _0x4786c1, signal: _0x111669, ..._0x45d5c8 } = _0x287a21 || {},
    _0x6b4112 = Number(_0x287a21?.['timeoutMs']),
    _0x4939dd =
      _0x287a21?.['disableRequestTimeout'] === !![]
        ? null
        : Number['isFinite'](_0x6b4112) && _0x6b4112 > 0x0
          ? Math['max'](0x7530, Math['trunc'](_0x6b4112) + 0x1388)
          : undefined;
  if (typeof _0x4786c1 === 'function')
    return requestCliTextStream(_0x45d5c8, { onText: _0x4786c1, signal: _0x111669, timeoutMs: _0x4939dd });
  const _0x34063d = await post('/api/v2/cli-providers/generate-text', _0x45d5c8, _0x4939dd);
  return unwrapCliProviderResult(_0x34063d, 'CLI Provider 文本生成失败');
}
export async function generateImageWithCliProvider(_0x3ead78) {
  const _0x49693f = Number(_0x3ead78?.['timeoutMs']),
    _0x1c2c54 =
      Number['isFinite'](_0x49693f) && _0x49693f > 0x0
        ? Math['max'](0x7530, Math['min'](0xdbba0, Math['trunc'](_0x49693f / 0x3e8) * 0x3e8))
        : 0x927c0,
    _0x4aa91b = await post(
      '/api/v2/cli-providers/generate-image',
      { ..._0x3ead78, timeoutMs: _0x1c2c54 },
      _0x1c2c54 + 0x1388,
    );
  return unwrapCliProviderResult(_0x4aa91b, 'OpenAI\x20CLI\x20图像生成失败');
}
