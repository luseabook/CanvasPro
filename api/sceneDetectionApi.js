import { requester } from './requester.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { ApiError, ErrorType, parseError, parseTaskError, parseNetworkError } from './errors/index.js';
const DETECTION_TIMEOUT = 5 * 60 * 0x3e8;
export async function buildSceneDetectionRequest(videoUrl) {
  await ensureConfig();
  const provider = videoUrl.provider || 'grsai',
    providerConfig = getProviderConfig(provider),
    apiUrl = providerConfig.apiUrl.replace(/\/+$/, ''),
    apiKey = videoUrl.apiKey || providerConfig.apiKey;
  if (!apiKey)
    throw ApiError.authError(
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
        videoUrl: videoUrl.videoUrl,
        sensitivity: videoUrl.sensitivity || 0.5,
      },
    };
  if (provider === 'runninghubwf')
    return {
      url: '/api/v2/runninghubwf/scene-detection',
      headers: { 'Content-Type': 'application/json' },
      body: { apiKey: apiKey, videoUrl: videoUrl.videoUrl, sensitivity: videoUrl.sensitivity || 0.5 },
    };
  throw new ApiError({
    type: 'UNSUPPORTED_PROVIDER',
    provider: provider,
    message: '暂不支持厂商 ' + provider + ' 的场景检测',
    retryable: false,
  });
}
async function pollSceneDetectionTask(taskId, provider2, apiKey2) {
  const providerConfig2 = getProviderConfig(provider2);
  for (let count = 0; count < 0x12c; count++) {
    await new Promise((value) => setTimeout(value, 0x7d0));
    const url =
      provider2 === 'runninghubwf'
        ? '/api/v2/runninghubwf/query'
        : providerConfig2.apiUrl + '/v1/tasks/' + taskId;
    try {
      const requester2 = await requester({
          url: url,
          method: 'POST',
          provider: provider2,
          timeout: 0x7530,
          headers: { 'Content-Type': 'application/json' },
          body:
            provider2 === 'runninghubwf'
              ? JSON.stringify({ apiKey: apiKey2, taskId: taskId })
              : JSON.stringify({ apiUrl: url, apiKey: apiKey2 }),
        }),
        response = requester2.data || requester2,
        error = parseError(provider2, response, 200);
      if (error) throw error;
      const item = (response.status || '').toUpperCase();
      if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(item)) return response;
    } catch (key) {
      if (key instanceof ApiError) {
        if (
          key.type === ErrorType.TASK_FAILED ||
          key.type === ErrorType.TASK_TIMEOUT ||
          key.type === ErrorType.AUTH_ERROR ||
          key.type === ErrorType.FORBIDDEN ||
          key.type === ErrorType.INVALID_PARAMS ||
          key.type === ErrorType.INSUFFICIENT_BALANCE
        )
          throw key;
      }
    }
  }
  throw ApiError.taskTimeout(provider2);
}
function extractSceneChanges(index) {
  if (index.result?.sceneChanges) return index.result.sceneChanges;
  else {
    if (index.data?.sceneChanges) return index.data.sceneChanges;
    else {
      if (index.sceneChanges) return index.sceneChanges;
    }
  }
  return [];
}
function processSceneDetectionResult(raw, provider3) {
  const sceneChanges = extractSceneChanges(raw);
  if (!Array.isArray(sceneChanges)) {
    const error2 = parseError(provider3, raw, 200);
    if (error2) throw error2;
    const message = parseTaskError(provider3, raw);
    if (message)
      throw new ApiError({
        type: 'TASK_FAILED',
        provider: provider3,
        message: message.getUserMessage(),
        retryable: false,
      });
    const message2 = raw.error || raw.errorMessage || raw.message || raw.failure_reason;
    if (message2)
      throw new ApiError({ type: 'TASK_FAILED', provider: provider3, message: message2, retryable: false });
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: provider3,
      message: '无法从服务器响应中提取场景检测结果',
      raw: raw,
      retryable: false,
    });
  }
  return { sceneChanges: sceneChanges, sceneCount: sceneChanges.length + 1 };
}
export async function detectScenes(result, data) {
  const provider4 = result.provider || 'grsai',
    url2 = await buildSceneDetectionRequest(result);
  let requester3;
  try {
    requester3 = await requester({
      url: url2.url,
      method: 'POST',
      provider: provider4,
      timeout: DETECTION_TIMEOUT,
      headers: url2.headers,
      body: JSON.stringify(url2.body),
    });
  } catch (options) {
    if (options instanceof ApiError) throw options;
    throw parseNetworkError(provider4, options, DETECTION_TIMEOUT);
  }
  let target = requester3,
    processSceneDetectionResult2 = null;
  if (target.task_id || target.taskId) {
    const source = target.task_id || target.taskId;
    data?.onTaskId?.(String(source));
    const providerConfig3 = getProviderConfig(provider4),
      next = result.apiKey || providerConfig3.apiKey,
      pollSceneDetectionTask2 = await pollSceneDetectionTask(source, provider4, next);
    processSceneDetectionResult2 = processSceneDetectionResult(pollSceneDetectionTask2, provider4);
  } else processSceneDetectionResult2 = processSceneDetectionResult(target, provider4);
  return processSceneDetectionResult2;
}
