import { request } from './apiBase.js';
const DEFAULT_RUNNINGHUB_BASE_URL = 'https://www.runninghub.cn',
  DEFAULT_QUEUE_STATUS_TIMEOUT_MS = 0x7530;
function isPlainObject(_0x410d36) {
  return !!_0x410d36 && typeof _0x410d36 === 'object' && !Array['isArray'](_0x410d36);
}
function normalizeBaseUrl(_0x2cfc2a) {
  return String(_0x2cfc2a || '')
    ['trim']()
    ['replace'](/\/+$/, '');
}
function joinUrl(_0x1cd004, _0x1c65f2) {
  const _0x20507 = normalizeBaseUrl(_0x1cd004),
    _0x3e2740 = String(_0x1c65f2 || '')['replace'](/^\/+/, '');
  if (!_0x20507) return _0x3e2740;
  if (!_0x3e2740) return _0x20507;
  return _0x20507 + '/' + _0x3e2740;
}
function toFiniteNumber(_0x4b1c71) {
  const _0x439f3f = Number(_0x4b1c71);
  return Number['isFinite'](_0x439f3f) ? _0x439f3f : null;
}
export function buildRunningHubQueueStatusProbeUrl(_0x1de700) {
  const _0x3d5136 = normalizeBaseUrl(_0x1de700 || DEFAULT_RUNNINGHUB_BASE_URL)
    ['replace'](/\/openapi\/v2(?:\/.*)?$/i, '')
    ['replace'](/\/uc\/openapi\/accountStatus$/i, '');
  return joinUrl(_0x3d5136, 'openapi/v2/queue/status');
}
export function normalizeRunningHubQueueStatusPayload(_0x3676e9 = {}) {
  const _0x2ffca4 =
    isPlainObject(_0x3676e9?.['data']) && !Array['isArray'](_0x3676e9['data'])
      ? _0x3676e9['data']
      : _0x3676e9;
  if (!isPlainObject(_0x2ffca4)) return null;
  if (_0x2ffca4['success'] === ![]) return null;
  if (_0x2ffca4['code'] !== undefined && Number(_0x2ffca4['code']) !== 0x0) return null;
  const _0x55c170 =
      isPlainObject(_0x2ffca4['data']) && !Array['isArray'](_0x2ffca4['data'])
        ? _0x2ffca4['data']
        : _0x2ffca4,
    _0x159bfb = toFiniteNumber(_0x55c170['concurrentLimit'] ?? _0x55c170['concurrent_limit']);
  if (_0x159bfb === null) return null;
  return {
    apiKeyType: String(_0x55c170['apiKeyType'] || _0x55c170['api_key_type'] || '')['trim'](),
    concurrentLimit: _0x159bfb,
    runningCount: toFiniteNumber(_0x55c170['runningCount'] ?? _0x55c170['running_count']),
    queuedCount: toFiniteNumber(_0x55c170['queuedCount'] ?? _0x55c170['queued_count']),
    totalCurrentTasks: toFiniteNumber(_0x55c170['totalCurrentTasks'] ?? _0x55c170['total_current_tasks']),
  };
}
export async function fetchRunningHubWorkflowQueueStatus(_0xb033fa = {}, _0x438316 = {}) {
  const _0x5c7bb6 = String(_0xb033fa?.['apiKey'] || '')['trim']();
  if (!_0x5c7bb6) return null;
  const _0x3e50b6 = buildRunningHubQueueStatusProbeUrl(_0xb033fa?.['apiUrl']),
    _0x35117d = await request(
      '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x3e50b6),
      { method: 'GET', headers: { Authorization: 'Bearer ' + _0x5c7bb6 } },
      Math['max'](0x1, Number(_0x438316?.['timeoutMs']) || DEFAULT_QUEUE_STATUS_TIMEOUT_MS),
    );
  if (!_0x35117d['success']) return null;
  const _0x2925b2 = Number(_0x35117d['status'] || 0x0);
  if (_0x2925b2 && (_0x2925b2 < 0xc8 || _0x2925b2 >= 0x12c)) return null;
  return normalizeRunningHubQueueStatusPayload(_0x35117d['data']);
}
