import { post } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
const RH_PENDING_CODES = new Set([0x324, 0x32d]),
  RH_SUCCESS_STATUSES = new Set(['COMPLETED', 'SUCCEEDED', 'SUCCESS']),
  RH_PENDING_STATUSES = new Set(['RUNNING', 'PENDING', 'QUEUED', 'PROCESSING', '']),
  RH_FAILED_STATUSES = new Set(['FAILED', 'FAIL', 'ERROR', 'CANCELLED']);
function normalizeRhStatus(value) {
  return String(value || '')
    .trim()
    .toUpperCase();
}
function getRhStatus(response) {
  const response2 =
    response?.data && typeof response.data === 'object' && !Array.isArray(response.data)
      ? response.data
      : response;
  return normalizeRhStatus(response2?.status || response?.status || response?.taskStatus);
}
function getRhErrorMessage(error, item) {
  return String(error?.msg || error?.message || error?.error || error?.failure_reason || item);
}
function hasRhResult(enabled) {
  if (typeof enabled === 'string') return !!enabled.trim();
  if (Array.isArray(enabled?.data)) return enabled.data.some((item2) => hasRhResult(item2));
  const response3 =
    enabled?.data && typeof enabled.data === 'object' && !Array.isArray(enabled.data)
      ? enabled.data
      : enabled;
  if (Array.isArray(response3?.results)) return response3.results.some((item3) => hasRhResult(item3));
  return !!(response3?.url || response3?.videoUrl || response3?.fileUrl || response3?.download_url);
}
function getInstallId(key) {
  return String(
    key?.installId || globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '',
  ).trim();
}
function buildInstallIdHeaders(index) {
  const installId = getInstallId(index);
  return installId ? { 'X-AIC-Install-Id': installId } : {};
}
export async function runRunninghubWorkflow(result, signal = {}) {
  const { installId: installId2, ...args } = result || {},
    post2 = await post('/api/v2/runninghubwf/run', args, {
      provider: 'runninghubwf',
      signal: signal?.signal,
      headers: buildInstallIdHeaders(result),
    });
  return post2;
}
export async function runRunninghubAiApp(data, signal2 = {}) {
  const enabled2 = String(data?.appId || data?.workflowId || '').trim(),
    apiKey = String(data?.apiKey || '').trim();
  if (!enabled2) throw new Error('缺少 RunningHub appId');
  if (!apiKey) throw new Error('RunningHub API Key 未配置');
  const { appId: appId, workflowId: workflowId, installId: installId3, ...args2 } = data || {},
    post3 = await post(
      '/api/v2/proxy/image',
      {
        ...args2,
        apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + enabled2,
        apiKey: apiKey,
      },
      {
        provider: 'runninghubwf',
        signal: signal2?.signal,
        headers: buildInstallIdHeaders(data),
        timeout: 0xdbba0,
      },
    );
  return post3;
}
export async function queryRunninghubWorkflow(options, signal3 = {}) {
  const target = signal3?.useOpenapiQuery === true,
    post4 = await post(
      target ? '/api/v2/proxy/image' : '/api/v2/runninghubwf/query',
      target ? { apiUrl: 'https://www.runninghub.cn/openapi/v2/query', ...(options || {}) } : options || {},
      { provider: 'runninghubwf', signal: signal3?.signal },
    );
  return post4;
}
export async function resumeRunninghubWorkflowTask(source, next = {}) {
  const apiKey2 = String(source?.apiKey || '').trim(),
    taskId = String(source?.taskId || '').trim();
  if (!apiKey2) throw new Error('RunningHub API Key 未配置');
  if (!taskId) throw new Error('缺少 RunningHub 任务ID');
  return runTaskSingleFlight(
    {
      provider: 'runninghubwf',
      kind: String(next?.taskKind || next?.kind || 'video').trim() || 'video',
      taskId: taskId,
    },
    async () => resumeRunninghubWorkflowTaskOnce({ apiKey: apiKey2, taskId: taskId }, next),
  );
}
async function resumeRunninghubWorkflowTaskOnce(current, signal4 = {}) {
  const apiKey3 = String(current?.apiKey || '').trim(),
    taskId2 = String(current?.taskId || '').trim(),
    count = Math.max(0, Number(signal4?.pollIntervalMs) || 0x7d0),
    entry = Math.max(1, Number(signal4?.maxPolls) || 0x258);
  for (let record = 0; record < entry; record++) {
    if (signal4?.signal?.aborted) throw new Error('CANCELLED');
    if (count > 0) {
      await new Promise((payload) => setTimeout(payload, count));
      if (signal4?.signal?.aborted) throw new Error('CANCELLED');
    }
    const queryRunninghubWorkflow2 = await queryRunninghubWorkflow(
        { apiKey: apiKey3, taskId: taskId2 },
        { signal: signal4?.signal, useOpenapiQuery: signal4?.useOpenapiQuery === true },
      ),
      count2 = typeof queryRunninghubWorkflow2?.code === 'number' ? queryRunninghubWorkflow2.code : null;
    if (count2 !== null && RH_PENDING_CODES.has(count2)) continue;
    if (count2 !== null && count2 !== 0)
      throw new Error(getRhErrorMessage(queryRunninghubWorkflow2, '任务轮询失败 (code: ' + count2 + ')'));
    const rhStatus = getRhStatus(queryRunninghubWorkflow2);
    if (RH_FAILED_STATUSES.has(rhStatus))
      throw new Error(getRhErrorMessage(queryRunninghubWorkflow2, '任务执行失败'));
    if (RH_SUCCESS_STATUSES.has(rhStatus) || hasRhResult(queryRunninghubWorkflow2))
      return queryRunninghubWorkflow2;
    if (RH_PENDING_STATUSES.has(rhStatus)) continue;
  }
  throw new Error('任务超时，请稍后重试');
}
