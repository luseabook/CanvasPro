import { post } from './requester.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import {
  resolveRunningHubWorkflowQueueConfig,
  runWithRunningHubWorkflowQueue,
} from './runningHubWorkflowQueue.js';
import {
  getRunningHubProviderProfileId,
  normalizeRunningHubModelApiProfileId,
  resolveRunningHubModelApiBaseUrl,
} from '../src/modules/runningHubProviderProfiles.js';
import { formatRunningHubFailureMessage, parseTaskError } from './errors/parsers/RunningHubErrorParser.js';
import { resolveRunningHubTaskLifecycleStatus } from './runninghubTaskLifecycle.js';
import {
  hasRunningHubWorkflowPollingTimedOut,
  resolveRunningHubWorkflowPollingPolicy,
} from './runningHubWorkflowPollingPolicy.js';
const RH_PENDING_CODES = new Set([0x324, 0x32d]);
function getRhErrorMessage(value, item) {
  return formatRunningHubFailureMessage(value, item);
}
function hasRhResult(enabled) {
  if (typeof enabled === 'string') return !!enabled['trim']();
  if (Array['isArray'](enabled?.['data']))
    return enabled['data']['some']((key) => hasRhResult(key));
  const response =
    enabled?.['data'] && typeof enabled['data'] === 'object' && !Array['isArray'](enabled['data'])
      ? enabled['data']
      : enabled;
  if (Array['isArray'](response?.['results']))
    return response['results']['some']((index) => hasRhResult(index));
  return !!(
    response?.['url'] ||
    response?.['videoUrl'] ||
    response?.['fileUrl'] ||
    response?.['download_url']
  );
}
function getInstallId(result) {
  return String(
    result?.['installId'] ||
      globalThis['window']?.['__aicInstallId'] ||
      globalThis['__aicInstallId'] ||
      '',
  )['trim']();
}
function buildInstallIdHeaders(data) {
  const installId = getInstallId(data);
  return installId ? { 'X-AIC-Install-Id': installId } : {};
}
function getRunningHubWorkflowBaseUrl(options = {}) {
  const target = String(options?.['runningHubApiUrl'] || '')['trim']();
  if (target) return target['replace'](/\/+$/, '');
  const runningHubProviderProfileId = getRunningHubProviderProfileId(options),
    source = runningHubProviderProfileId ? normalizeRunningHubModelApiProfileId(runningHubProviderProfileId) : '';
  return resolveRunningHubModelApiBaseUrl(source);
}
export async function runRunninghubWorkflow(payload, concurrency = {}) {
  const { installId: installId2, ...args } = payload || {},
    args2 = resolveRunningHubWorkflowQueueConfig({
      payload: payload,
      concurrency: concurrency?.['runningHubWorkflowConcurrency'],
    });
  return runWithRunningHubWorkflowQueue(
    {
      ...args2,
      signal: concurrency?.['signal'],
      lease: concurrency?.['runningHubWorkflowQueueLease'],
      onQueueChange: concurrency?.['onRunningHubWorkflowQueueChange'],
      autoProbeConcurrency: concurrency?.['autoProbeConcurrency'],
      concurrencyProbe: concurrency?.['runningHubWorkflowConcurrencyProbe'],
    },
    () =>
      post('/api/v2/runninghubwf/run', args, {
        provider: 'runninghubwf',
        signal: concurrency?.['signal'],
        headers: buildInstallIdHeaders(payload),
      }),
  );
}
export async function runRunninghubAiApp(args3, concurrency2 = {}) {
  const enabled2 = String(args3?.['appId'] || args3?.['workflowId'] || '')['trim'](),
    apiKey = String(args3?.['apiKey'] || '')['trim']();
  if (!enabled2) throw new Error('缺少 RunningHub appId');
  if (!apiKey) throw new Error('RunningHub\x20API\x20Key\x20未配置');
  const { appId: appId, workflowId: workflowId, installId: installId3, ...args4 } = args3 || {},
    args5 = resolveRunningHubWorkflowQueueConfig({
      payload: { ...args3, apiKey: apiKey },
      concurrency: concurrency2?.['runningHubWorkflowConcurrency'],
    });
  return runWithRunningHubWorkflowQueue(
    {
      ...args5,
      signal: concurrency2?.['signal'],
      lease: concurrency2?.['runningHubWorkflowQueueLease'],
      onQueueChange: concurrency2?.['onRunningHubWorkflowQueueChange'],
      autoProbeConcurrency: concurrency2?.['autoProbeConcurrency'],
      concurrencyProbe: concurrency2?.['runningHubWorkflowConcurrencyProbe'],
    },
    () =>
      post(
        '/api/v2/proxy/image',
        {
          ...args4,
          apiUrl: getRunningHubWorkflowBaseUrl(args3) + '/openapi/v2/run/ai-app/' + enabled2,
          apiKey: apiKey,
        },
        {
          provider: 'runninghubwf',
          signal: concurrency2?.['signal'],
          headers: buildInstallIdHeaders(args3),
          timeout: 0xdbba0,
        },
      ),
  );
}
export async function queryRunninghubWorkflow(next, signal = {}) {
  const current = signal?.['useOpenapiQuery'] === !![],
    post2 = await post(
      current ? '/api/v2/proxy/image' : '/api/v2/runninghubwf/query',
      current
        ? { apiUrl: getRunningHubWorkflowBaseUrl(next) + '/openapi/v2/query', ...(next || {}) }
        : next || {},
      { provider: 'runninghubwf', signal: signal?.['signal'] },
    );
  return post2;
}
export async function resumeRunninghubWorkflowTask(runningHubApiUrl, entry = {}) {
  const taskId = String(runningHubApiUrl?.['taskId'] || '')['trim']();
  if (!taskId) throw new Error('缺少 RunningHub 任务ID');
  const enabled3 = String(runningHubApiUrl?.['apiKey'] || '')['trim']();
  if (!enabled3) await ensureConfig();
  const runningHubProviderProfileId2 = getRunningHubProviderProfileId(runningHubApiUrl),
    providerConfig = getProviderConfig(runningHubProviderProfileId2 || 'runninghubwf'),
    providerProfileId = String(runningHubProviderProfileId2 || providerConfig?.['providerProfileId'] || '')['trim'](),
    apiKey2 = String(enabled3 || providerConfig?.['apiKey'] || '')['trim']();
  if (!apiKey2) throw new Error('RunningHub API Key 未配置');
  return runTaskSingleFlight(
    {
      provider: 'runninghubwf',
      kind: String(entry?.['taskKind'] || entry?.['kind'] || 'video')['trim']() || 'video',
      taskId: taskId,
    },
    async () =>
      resumeRunninghubWorkflowTaskOnce(
        {
          apiKey: apiKey2,
          taskId: taskId,
          providerProfileId: providerProfileId,
          rhProviderProfileId: providerProfileId,
          runningHubApiUrl: runningHubApiUrl?.['runningHubApiUrl'] || providerConfig?.['apiUrl'],
        },
        entry,
      ),
  );
}
async function resumeRunninghubWorkflowTaskOnce(providerProfileId2, signal2 = {}) {
  const apiKey3 = String(providerProfileId2?.['apiKey'] || '')['trim'](),
    taskId2 = String(providerProfileId2?.['taskId'] || '')['trim'](),
    {
      pollIntervalMs: pollIntervalMs,
      pollTimeoutMs: pollTimeoutMs,
      maxPolls: maxPolls,
    } = resolveRunningHubWorkflowPollingPolicy(signal2),
    record = Date['now']();
  for (let handle = 0x0; handle < maxPolls; handle++) {
    if (hasRunningHubWorkflowPollingTimedOut(record, pollTimeoutMs)) break;
    if (signal2?.['signal']?.['aborted']) throw new Error('CANCELLED');
    if (pollIntervalMs > 0x0) {
      await new Promise((state) => setTimeout(state, pollIntervalMs));
      if (signal2?.['signal']?.['aborted']) throw new Error('CANCELLED');
      if (hasRunningHubWorkflowPollingTimedOut(record, pollTimeoutMs)) break;
    }
    const queryRunninghubWorkflow2 = await queryRunninghubWorkflow(
        {
          apiKey: apiKey3,
          taskId: taskId2,
          providerProfileId: providerProfileId2?.['providerProfileId'],
          rhProviderProfileId: providerProfileId2?.['rhProviderProfileId'],
          runningHubApiUrl: providerProfileId2?.['runningHubApiUrl'],
        },
        { signal: signal2?.['signal'], useOpenapiQuery: signal2?.['useOpenapiQuery'] === !![] },
      ),
      count = typeof queryRunninghubWorkflow2?.['code'] === 'number' ? queryRunninghubWorkflow2['code'] : null;
    if (count !== null && RH_PENDING_CODES['has'](count)) continue;
    if (count !== null && count !== 0x0)
      throw new Error(getRhErrorMessage(queryRunninghubWorkflow2, '任务轮询失败 (code: ' + count + ')'));
    const runningHubTaskLifecycleStatus = resolveRunningHubTaskLifecycleStatus(queryRunninghubWorkflow2);
    if (runningHubTaskLifecycleStatus === 'cancelled') throw new Error('CANCELLED');
    const taskError = parseTaskError(queryRunninghubWorkflow2);
    if (taskError) throw taskError;
    if (runningHubTaskLifecycleStatus === 'error') throw new Error(getRhErrorMessage(queryRunninghubWorkflow2, '任务执行失败'));
    if (runningHubTaskLifecycleStatus === 'success' || hasRhResult(queryRunninghubWorkflow2)) return queryRunninghubWorkflow2;
    if (runningHubTaskLifecycleStatus === 'running' || runningHubTaskLifecycleStatus === '') continue;
  }
  throw new Error('任务超时，请稍后重试');
}
