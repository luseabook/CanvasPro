import { request } from './apiBase.js';
const DEFAULT_RUNNINGHUB_BASE_URL = 'https://www.runninghub.cn',
  DEFAULT_QUEUE_STATUS_TIMEOUT_MS = 30000;
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function normalizeBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}
function joinUrl(item, key) {
  const baseUrl = normalizeBaseUrl(item),
    enabled2 = String(key || '').replace(/^\/+/, '');
  if (!baseUrl) return enabled2;
  if (!enabled2) return baseUrl;
  return baseUrl + '/' + enabled2;
}
function toFiniteNumber(index) {
  const result = Number(index);
  return Number.isFinite(result) ? result : null;
}
export function buildRunningHubQueueStatusProbeUrl(data) {
  const baseUrl2 = normalizeBaseUrl(data || DEFAULT_RUNNINGHUB_BASE_URL)
    .replace(/\/openapi\/v2(?:\/.*)?$/i, '')
    .replace(/\/uc\/openapi\/accountStatus$/i, '');
  return joinUrl(baseUrl2, 'openapi/v2/queue/status');
}
export function normalizeRunningHubQueueStatusPayload(options = {}) {
  const response =
    isPlainObject(options?.data) && !Array.isArray(options.data) ? options.data : options;
  if (!isPlainObject(response)) return null;
  if (response.success === false) return null;
  if (response.code !== undefined && Number(response.code) !== 0) return null;
  const isPlainObject2 =
      isPlainObject(response.data) && !Array.isArray(response.data) ? response.data : response,
    concurrentLimit = toFiniteNumber(isPlainObject2.concurrentLimit ?? isPlainObject2.concurrent_limit);
  if (concurrentLimit === null) return null;
  return {
    apiKeyType: String(isPlainObject2.apiKeyType || isPlainObject2.api_key_type || '').trim(),
    concurrentLimit: concurrentLimit,
    runningCount: toFiniteNumber(isPlainObject2.runningCount ?? isPlainObject2.running_count),
    queuedCount: toFiniteNumber(isPlainObject2.queuedCount ?? isPlainObject2.queued_count),
    totalCurrentTasks: toFiniteNumber(
      isPlainObject2.totalCurrentTasks ?? isPlainObject2.total_current_tasks,
    ),
  };
}
export async function fetchRunningHubWorkflowQueueStatus(options2 = {}, target = {}) {
  const enabled3 = String(options2?.apiKey || '').trim();
  if (!enabled3) return null;
  const runningHubQueueStatusProbeUrl = buildRunningHubQueueStatusProbeUrl(options2?.apiUrl),
    response2 = await request(
      '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(runningHubQueueStatusProbeUrl),
      { method: 'GET', headers: { Authorization: 'Bearer ' + enabled3 } },
      Math.max(1, Number(target?.timeoutMs) || DEFAULT_QUEUE_STATUS_TIMEOUT_MS),
    );
  if (!response2.success) return null;
  const count = Number(response2.status || 0);
  if (count && (count < 200 || count >= 300)) return null;
  return normalizeRunningHubQueueStatusPayload(response2.data);
}
