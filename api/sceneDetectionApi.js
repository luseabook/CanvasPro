import { requester } from './requester.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { ApiError, ErrorType, parseError, parseTaskError, parseNetworkError } from './errors/index.js';
import {
  hasRunningHubWorkflowPollingTimedOut,
  resolveRunningHubWorkflowPollingPolicy,
} from './runningHubWorkflowPollingPolicy.js';
const DETECTION_TIMEOUT = 5 * 60 * 1000;
export async function buildSceneDetectionRequest(videoUrl) {
  await ensureConfig();
  const provider = videoUrl['provider'] || 'grsai',
    providerConfig = getProviderConfig(provider),
    apiUrl = providerConfig['apiUrl']['replace'](/\/+$/, ''),
    apiKey = videoUrl['apiKey'] || providerConfig['apiKey'];
  if (!apiKey)
    throw ApiError['authError'](
      provider,
      null,
      'API Key 未配置（厂商：' + provider + '），无法发起场景检测请求',
    );
  if (provider === 'grsai')
    return {
      url: '/api/v2/proxy/image',
      headers: { 'Content-Type': 'application/json' },
      body: {
        apiUrl: apiUrl + '/v1/video/scene-detection',
        apiKey: apiKey,
        videoUrl: videoUrl['videoUrl'],
        sensitivity: videoUrl['sensitivity'] || 0.5,
      },
    };
  if (provider === 'runninghubwf')
    return {
      url: '/api/v2/runninghubwf/scene-detection',
      headers: { 'Content-Type': 'application/json' },
      body: {
        apiKey: apiKey,
        videoUrl: videoUrl['videoUrl'],
        sensitivity: videoUrl['sensitivity'] || 0.5,
      },
    };
  throw new ApiError({
    type: 'UNSUPPORTED_PROVIDER',
    provider: provider,
    message: '暂不支持厂商 ' + provider + ' 的场景检测',
    retryable: ![],
  });
}
async function pollSceneDetectionTask(taskId, provider2, apiKey2, value = {}) {
  const providerConfig2 = getProviderConfig(provider2),
    item = provider2 === 'runninghubwf' ? resolveRunningHubWorkflowPollingPolicy(value) : null,
    count = item?.['pollIntervalMs'] ?? 2000,
    key = item?.['pollTimeoutMs'] ?? null,
    index = item?.['maxPolls'] ?? 300,
    result = Date['now']();
  for (let data = 0; data < index; data++) {
    if (key !== null && hasRunningHubWorkflowPollingTimedOut(result, key)) break;
    count > 0 && (await new Promise((options) => setTimeout(options, count)));
    if (key !== null && hasRunningHubWorkflowPollingTimedOut(result, key)) break;
    const url =
      provider2 === 'runninghubwf'
        ? '/api/v2/runninghubwf/query'
        : providerConfig2['apiUrl'] + '/v1/tasks/' + taskId;
    try {
      const requester2 = await requester({
          url: url,
          method: 'POST',
          provider: provider2,
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' },
          body:
            provider2 === 'runninghubwf'
              ? JSON['stringify']({ apiKey: apiKey2, taskId: taskId })
              : JSON['stringify']({ apiUrl: url, apiKey: apiKey2 }),
        }),
        response = requester2['data'] || requester2,
        error = parseError(provider2, response, 200);
      if (error) throw error;
      const target = (response['status'] || '')['toUpperCase']();
      if (['COMPLETED', 'SUCCEEDED', 'SUCCESS']['includes'](target)) return response;
    } catch (source) {
      if (source instanceof ApiError) {
        if (
          source['type'] === ErrorType['TASK_FAILED'] ||
          source['type'] === ErrorType['TASK_TIMEOUT'] ||
          source['type'] === ErrorType['AUTH_ERROR'] ||
          source['type'] === ErrorType['FORBIDDEN'] ||
          source['type'] === ErrorType['INVALID_PARAMS'] ||
          source['type'] === ErrorType['INSUFFICIENT_BALANCE']
        )
          throw source;
      }
    }
  }
  throw ApiError['taskTimeout'](provider2);
}
function extractSceneChanges(next) {
  if (next['result']?.['sceneChanges']) return next['result']['sceneChanges'];
  else {
    if (next['data']?.['sceneChanges']) return next['data']['sceneChanges'];
    else {
      if (next['sceneChanges']) return next['sceneChanges'];
    }
  }
  return [];
}
function processSceneDetectionResult(raw, provider3) {
  const sceneChanges = extractSceneChanges(raw);
  if (!Array['isArray'](sceneChanges)) {
    const error2 = parseError(provider3, raw, 200);
    if (error2) throw error2;
    const message = parseTaskError(provider3, raw);
    if (message)
      throw new ApiError({
        type: 'TASK_FAILED',
        provider: provider3,
        message: message['getUserMessage'](),
        retryable: ![],
      });
    const message2 =
      raw['error'] || raw['errorMessage'] || raw['message'] || raw['failure_reason'];
    if (message2)
      throw new ApiError({ type: 'TASK_FAILED', provider: provider3, message: message2, retryable: ![] });
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: provider3,
      message: '无法从服务器响应中提取场景检测结果',
      raw: raw,
      retryable: ![],
    });
  }
  return { sceneChanges: sceneChanges, sceneCount: sceneChanges['length'] + 1 };
}
export async function detectScenes(current, entry) {
  const provider4 = current['provider'] || 'grsai',
    url2 = await buildSceneDetectionRequest(current);
  let requester3;
  try {
    requester3 = await requester({
      url: url2['url'],
      method: 'POST',
      provider: provider4,
      timeout: DETECTION_TIMEOUT,
      headers: url2['headers'],
      body: JSON['stringify'](url2['body']),
    });
  } catch (record) {
    if (record instanceof ApiError) throw record;
    throw parseNetworkError(provider4, record, DETECTION_TIMEOUT);
  }
  let payload = requester3,
    processSceneDetectionResult2 = null;
  if (payload['task_id'] || payload['taskId']) {
    const handle = payload['task_id'] || payload['taskId'];
    entry?.['onTaskId']?.(String(handle));
    const providerConfig3 = getProviderConfig(provider4),
      state = current['apiKey'] || providerConfig3['apiKey'],
      pollSceneDetectionTask2 = await pollSceneDetectionTask(handle, provider4, state, entry);
    processSceneDetectionResult2 = processSceneDetectionResult(pollSceneDetectionTask2, provider4);
  } else processSceneDetectionResult2 = processSceneDetectionResult(payload, provider4);
  return processSceneDetectionResult2;
}
