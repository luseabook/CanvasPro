import { SAVE_OUTPUT_FROM_URL_TIMEOUT_MS } from './projectsV2Api.js';
import {
  getRunningHubTaskProviderProfileId,
  normalizeRunningHubModelApiProfileId,
  resolveRunningHubModelApiBaseUrl,
  resolveRunningHubModelApiProfileId,
} from '../src/modules/runningHubProviderProfiles.js';
import { normalizeModelProviderProfileId } from '../src/modules/modelProviderProfileSelection.js';
import { queryDreaminaResult } from './dreaminaGenApi.js';
import { ensureVideoResultThumbnail } from './videoResultThumbnailApi.js';
import { resolveOutputWithLocalization } from './outputLocalization.js';
import { applyManifestErrorRules } from './errors/index.js';
import * as RunningHubAdapter from './adapters/RunningHubAdapter.js';
import {
  buildVideoRequestFromManifest,
  resolveManifestTaskPolling,
} from './adapters/ModelApiManifestNormalizer.js';
import { resolveMappedResponseValue, resolveMappedResponseValues } from './adapters/modelApiMappingEngine.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
import { processInputImages } from './imageUploadApi.js';
import { processInputVideos } from './videoUploadApi.js';
import { processInputAudios } from './audioUploadApi.js';
import { uploadInputsToVolcengineFiles } from './volcengineFileApi.js';
import { fetchRemoteBlob } from './projectsV2Api.js';
import { cancelRunningHubTask } from './runninghubTaskApi.js';
import {
  buildDreaminaVideoSubmitRequest,
  normalizeDreaminaTaskSnapshot,
  pollDreaminaUntilDone,
  runDreaminaVideoGeneration,
} from './dreaminaGenApi.js';
import { isModelApiModel, normalizeProviderId, resolveModelExecution } from '../src/manifests/index.js';
import { localPathToUrl, pickResultLocalPath, urlToLocalPath } from '../src/utils/localMediaPath.js';
import { requester } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import { ApiError, ErrorType, parseError, parseTaskError, parseNetworkError } from './errors/index.js';
const GENERATION_TIMEOUT = 10 * 60 * 1000;
export async function cancelRunningHubVideoTask({ apiKey: apiKey, taskId: taskId } = {}) {
  return cancelRunningHubTask({ apiKey: apiKey, taskId: taskId });
}
function resolveVideoExecution(options = {}) {
  const providerHint = normalizeProviderId(options?.provider);
  return resolveModelExecution(options?.model, { providerHint: providerHint });
}
function resolveVideoProviderId(options2 = {}, value = null) {
  return normalizeProviderId(value?.modelManifest?.provider || options2?.provider);
}
function resolveVideoTaskRuntimeOptions(options3 = {}, item = '', enabled = {}) {
  const enabled2 = String(options3?.model || '').trim();
  if (!enabled2) return enabled || {};
  const providerHint2 = normalizeProviderId(item || options3?.provider),
    modelManifest = resolveModelExecution(enabled2, { providerHint: providerHint2 }),
    responseMapping = modelManifest?.executionManifest;
  if (!responseMapping || responseMapping.adapterType !== 'modelApi' || responseMapping.kind !== 'video')
    return enabled || {};
  const providerId = normalizeProviderId(responseMapping.provider || providerHint2),
    providerConfig = getProviderConfig(providerId),
    taskPolling = resolveManifestTaskPolling(providerId, providerConfig, responseMapping, {
      modelManifest: modelManifest?.modelManifest || null,
    });
  return {
    ...(enabled || {}),
    ...(!enabled?.responseMapping && responseMapping.responseMapping
      ? { responseMapping: responseMapping.responseMapping }
      : {}),
    ...(!enabled?.taskPolling && taskPolling ? { taskPolling: taskPolling } : {}),
  };
}
export async function buildGenerateVideoRequest(args) {
  const prompt = applyCameraAngleToPrompt(args.prompt, args.cameraAngle),
    videoExecution = resolveVideoExecution(args),
    provider = resolveVideoProviderId(args, videoExecution),
    enabled3 = videoExecution?.executionManifest,
    expectedProvider = videoExecution?.modelManifest;
  if (enabled3?.adapterType === 'localRuntime' && enabled3?.runtime === 'dreaminaVideo') {
    const url = buildDreaminaVideoSubmitRequest({ ...args, prompt: prompt });
    return { url: url.url, headers: { 'Content-Type': 'application/json' }, body: url.body };
  }
  if (!provider || !enabled3) {
    const key = String(args?.model || '').trim() || '(empty)';
    throw new Error('Video model API manifest missing: ' + key);
  }
  await ensureConfig();
  if (enabled3.adapterType === 'modelApi') {
    const videoRequestFromManifest = await buildVideoRequestFromManifest(
      args,
      prompt,
      {
        getProviderConfig: getProviderConfig,
        processInputImages: processInputImages,
        processInputVideos: processInputVideos,
        processInputAudios: processInputAudios,
        uploadInputsToVolcengineFiles: uploadInputsToVolcengineFiles,
      },
      { expectedProvider: expectedProvider?.provider || provider },
    );
    if (videoRequestFromManifest) return videoRequestFromManifest;
    throw new Error(
      (expectedProvider?.provider || provider) + ' video model API manifest missing: ' + args.model,
    );
  }
  if (enabled3.adapterType === 'workflow')
    return RunningHubAdapter.buildVideoRequest(args, prompt, {
      getProviderConfig: getProviderConfig,
      processInputImages: processInputImages,
      processInputVideos: processInputVideos,
    });
  throw new ApiError({
    type: 'UNSUPPORTED_PROVIDER',
    provider: provider,
    message: '暂不支持厂商 ' + provider + ' 的视频生成',
    retryable: false,
  });
}
async function pollRunningHubVideoTask(taskId2, index, provider2, result) {
  const isModelApiModel2 = isModelApiModel(index.model, 'runninghub'),
    url2 = result?.useOpenapiQuery === true || isModelApiModel2,
    providerConfig2 = getProviderConfig(isModelApiModel2 ? 'runninghub' : 'runninghubwf'),
    apiKey2 = isModelApiModel2
      ? providerConfig2.modelApiKey || index.apiKey
      : providerConfig2.apiKey || index.apiKey;
  for (let count = 0; count < 1200; count++) {
    if (result?.signal?.aborted) throw new Error('CANCELLED');
    await new Promise((data) => setTimeout(data, 2000));
    try {
      const raw = await requester({
        url: url2 ? '/api/v2/proxy/image' : '/api/v2/runninghubwf/query',
        method: 'POST',
        provider: provider2,
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          url2
            ? { apiUrl: 'https://www.runninghub.cn/openapi/v2/query', apiKey: apiKey2, taskId: taskId2 }
            : { apiKey: apiKey2, taskId: taskId2 },
        ),
      });
      if (url2) {
        const count2 = typeof raw?.code === 'number' ? raw.code : null;
        if (count2 === 804 || count2 === 813) continue;
        if (count2 !== null && count2 !== 0) throw parseError(provider2, raw, 200);
        if (extractVideoUrls(raw, result?.responseMapping).length > 0) return raw;
      }
      if (!url2) {
        const count3 = typeof raw?.code === 'number' ? raw.code : null;
        if (count3 === 0 && Array.isArray(raw.data) && raw.data.length > 0) {
          if (extractVideoUrls(raw, result?.responseMapping).length > 0) return raw;
          const list = raw.data
            .map((response) =>
              String(response?.status || response?.taskStatus || '')
                .trim()
                .toUpperCase(),
            )
            .filter(Boolean);
          if (list.some((item2) => ['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(item2))) {
            const error = parseError(provider2, raw, 200);
            throw (
              error ||
              new ApiError({
                type: 'TASK_FAILED',
                provider: provider2,
                message: '视频任务执行失败',
                raw: raw,
                retryable: false,
              })
            );
          }
          continue;
        }
        if (count3 === 804 || count3 === 813) continue;
        if (count3 !== null && count3 !== 0) throw parseError(provider2, raw, 200);
      }
      const response2 = raw.data && Object.keys(raw.data).length > 0 ? raw.data : raw;
      if (extractVideoUrls(response2, result?.responseMapping).length > 0) return response2;
      const taskError = parseTaskError(provider2, response2);
      if (taskError) throw taskError;
      const target = (response2.status || '').toUpperCase();
      if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(target)) {
        if (extractVideoUrls(response2, result?.responseMapping).length === 0) continue;
        return response2;
      }
    } catch (source) {
      if (source instanceof ApiError) {
        if (
          source.type === ErrorType.TASK_FAILED ||
          source.type === ErrorType.TASK_TIMEOUT ||
          source.type === ErrorType.AUTH_ERROR ||
          source.type === ErrorType.FORBIDDEN ||
          source.type === ErrorType.INVALID_PARAMS ||
          source.type === ErrorType.INSUFFICIENT_BALANCE
        )
          throw source;
      }
    }
  }
  throw ApiError.taskTimeout(provider2);
}
function parseVideoResponseData(enabled4) {
  if (!enabled4) return {};
  if (typeof enabled4 === 'object') return enabled4;
  const enabled5 = String(enabled4 || '').trim();
  if (!enabled5) return {};
  try {
    return JSON.parse(enabled5.replace(/^data:\s*/, ''));
  } catch {
    const list2 = extractSseJsonSnapshots(enabled5);
    if (list2.length > 0) {
      for (const next of list2) {
        if (resolveAsyncVideoTaskId(next)) return next;
      }
      return list2[list2.length - 1];
    }
    throw new ApiError({ type: 'PARSE_ERROR', message: '无法解析服务端响应', retryable: false });
  }
}
function extractSseJsonSnapshots(current) {
  const list3 = String(current || '')
    .split('\n')
    .filter((item3) => item3.trim().startsWith('data:'));
  if (list3.length === 0) return [];
  const list4 = [];
  for (const entry of list3) {
    const enabled6 = String(entry || '')
      .trim()
      .replace(/^data:\s*/, '')
      .trim();
    if (!enabled6 || enabled6 === '[DONE]') continue;
    try {
      list4.push(JSON.parse(enabled6));
    } catch {}
  }
  return list4;
}
function extractRunningHubTaskIdFromRawText(record) {
  const enabled7 = String(record || '');
  if (!enabled7) return '';
  const payload = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid)=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const handle of payload) {
    const state = enabled7.match(handle),
      config = String(state?.[1] || '')
        .replace(/,/g, '')
        .trim();
    if (config) return config;
  }
  return '';
}
function extractTaskIdFromResponseHeaders(list5) {
  if (!list5 || typeof list5.get !== 'function') return '';
  const scope = [
    'x-task-id',
    'x-taskid',
    'x-request-id',
    'x-requestid',
    'x-job-id',
    'x-jobid',
    'task-id',
    'taskid',
    'request-id',
    'requestid',
    'job-id',
    'jobid',
  ];
  for (const input of scope) {
    const output = String(list5.get(input) || '').trim();
    if (output) return output;
  }
  if (typeof list5.forEach === 'function') {
    let value2 = '';
    list5.forEach((item4, value3) => {
      if (value2) return;
      const list6 = String(value3 || '')
          .trim()
          .toLowerCase(),
        enabled8 = String(item4 || '').trim();
      if (!enabled8) return;
      ((list6.includes('task') && list6.includes('id')) ||
        (list6.includes('job') && list6.includes('id')) ||
        (list6.includes('request') && list6.includes('id'))) &&
        (value2 = enabled8);
    });
    if (value2) return value2;
  }
  return '';
}
function normalizeTaskIdValue(value4) {
  return String(value4 ?? '')
    .replace(/,/g, '')
    .trim();
}
function looksLikeTaskToken(value5) {
  const list7 = String(value5 ?? '').trim();
  if (!list7 || list7.length < 8) return false;
  const value6 = list7.toLowerCase();
  if (
    ['pending', 'running', 'success', 'succeeded', 'completed', 'failed', 'queued', 'submitted'].includes(
      value6,
    )
  )
    return false;
  return /^[a-zA-Z0-9._:-]+$/.test(list7);
}
function findFirstDeepValueByKeyPattern(value7, value8, value9 = 8) {
  if (!value7 || typeof value7 !== 'object') return '';
  const map = new WeakSet(),
    list8 = [{ value: value7, depth: 0 }];
  while (list8.length > 0) {
    const { value: value10, depth: depth } = list8.shift();
    if (!value10 || typeof value10 !== 'object') continue;
    if (map.has(value10)) continue;
    map.add(value10);
    if (depth > value9) continue;
    const value11 = Array.isArray(value10)
      ? value10.map((item5, value12) => [String(value12), item5])
      : Object.entries(value10);
    for (const [value13, value14] of value11) {
      const value15 = String(value13 || '')
        .trim()
        .toLowerCase();
      if (value8.test(value15)) {
        const value16 = String(value14 ?? '').trim();
        if (value16) return value16;
      }
      value14 && typeof value14 === 'object' && list8.push({ value: value14, depth: depth + 1 });
    }
  }
  return '';
}
function resolveRunningHubVideoTaskId(value17, value18 = '', value19 = null, value20 = null) {
  const mappedResponseValue = resolveMappedResponseValue(value17, value20?.taskIdPath);
  if (mappedResponseValue) return normalizeTaskIdValue(mappedResponseValue);
  const extractRunningHubTaskIdFromRawText2 = extractRunningHubTaskIdFromRawText(value18);
  if (extractRunningHubTaskIdFromRawText2) return extractRunningHubTaskIdFromRawText2;
  const asyncVideoTaskId = resolveAsyncVideoTaskId(value17, value20);
  if (asyncVideoTaskId) return normalizeTaskIdValue(asyncVideoTaskId);
  return normalizeTaskIdValue(extractTaskIdFromResponseHeaders(value19));
}
export async function resumeRunningHubVideoTask(value21, value22, args2 = {}) {
  const videoExecution2 = resolveVideoExecution(value22),
    provider3 = resolveVideoProviderId(value22, videoExecution2);
  if (provider3 !== 'runninghubwf') throw new Error('仅支持恢复 RunningHub 工作流视频任务');
  const taskId3 = String(value21 || '').trim();
  if (!taskId3) throw new Error('缺少 RunningHub 视频任务ID，无法恢复');
  const useOpenapiQuery = args2?.useOpenapiQuery === true;
  return runTaskSingleFlight({ provider: provider3, kind: 'video', taskId: taskId3 }, async () => {
    const pollRunningHubVideoTask2 = await pollRunningHubVideoTask(taskId3, value22 || {}, provider3, {
        ...args2,
        useOpenapiQuery: useOpenapiQuery,
      }),
      processVideoTaskResult2 = processVideoTaskResult(pollRunningHubVideoTask2, provider3, args2);
    return await postProcessVideoResult(processVideoTaskResult2, {
      providerId: provider3,
      taskKey: provider3 + ':video:' + taskId3,
    });
  });
}
export async function resumeAsyncVideoTask(value23, args3 = {}, value24 = {}) {
  const videoExecution3 = resolveVideoExecution(args3),
    provider4 = resolveVideoProviderId(args3, videoExecution3);
  if (provider4 === 'runninghubwf' || provider4 === 'dreamina')
    throw new Error('仅支持恢复非 RunningHub/Dreamina 的异步视频任务');
  const taskId4 = String(value23 || '').trim();
  if (!taskId4) throw new Error('缺少异步视频任务ID，无法恢复');
  await ensureConfig();
  const args4 = resolveVideoTaskRuntimeOptions(args3 || {}, provider4, value24),
    providerConfig3 = getProviderConfig(provider4),
    apiKey3 = String(
      args3?.apiKey ||
        (provider4 === 'runninghub' ? providerConfig3?.modelApiKey : '') ||
        providerConfig3?.apiKey ||
        '',
    ).trim();
  if (!apiKey3) throw new Error('API Key 未配置（厂商：' + provider4 + '），无法恢复视频任务');
  return runTaskSingleFlight({ provider: provider4, kind: 'video', taskId: taskId4 }, async () => {
    if (provider4 === 'runninghub') {
      const pollRunningHubVideoTask3 = await pollRunningHubVideoTask(
          taskId4,
          { ...args3, apiKey: apiKey3 },
          provider4,
          { ...args4, useOpenapiQuery: true },
        ),
        processVideoTaskResult3 = processVideoTaskResult(pollRunningHubVideoTask3, provider4, args4);
      return await postProcessVideoResult(processVideoTaskResult3, {
        providerId: provider4,
        taskKey: provider4 + ':video:' + taskId4,
      });
    }
    const pollVideoTask2 = await pollVideoTask(taskId4, provider4, apiKey3, args4);
    return await postProcessVideoResult(pollVideoTask2, {
      providerId: provider4,
      taskKey: provider4 + ':video:' + taskId4,
    });
  });
}
export async function resumeDreaminaVideoTask(value25, args5 = {}) {
  const submitId = String(value25 || '').trim();
  if (!submitId) throw new Error('缺少 Dreamina 提交ID，无法恢复视频任务');
  const pollDreaminaUntilDone2 = await pollDreaminaUntilDone(submitId, { ...args5, taskKind: 'video' }),
    dreaminaSnapshot = normalizeDreaminaTaskSnapshot(pollDreaminaUntilDone2, { submitId: submitId });
  if (dreaminaSnapshot?.phase === 'failed') {
    const error2 = new Error(dreaminaSnapshot?.failReason || dreaminaSnapshot?.label || '查询失败');
    error2.dreaminaSnapshot = dreaminaSnapshot;
    throw error2;
  }
  const list9 = Array.isArray(dreaminaSnapshot?.outputs) ? dreaminaSnapshot.outputs : [],
    isBatch = list9.map((response3) => {
      const localPath = pickResultLocalPath(response3);
      return {
        videoUrl: localPathToUrl(localPath) || response3.localUrl || response3.url,
        localPath: localPath,
      };
    });
  return {
    isBatch: isBatch.length > 1,
    dreaminaSnapshot: dreaminaSnapshot,
    videos: isBatch,
    videoUrl: localPathToUrl(pickResultLocalPath(list9[0])) || list9[0]?.localUrl || list9[0]?.url || '',
    localPath: pickResultLocalPath(list9[0]),
  };
}
function buildManifestVideoTaskPollUrl(value26, enabled9) {
  if (!enabled9 || typeof enabled9 !== 'object') return '';
  const enabled10 = String(enabled9.urlTemplate || '').trim();
  if (!enabled10) return '';
  return enabled10.replace('{taskId}', encodeURIComponent(String(value26)));
}
const ASYNC_VIDEO_SUCCESS_STATUSES = new Set([
  'completed',
  'complete',
  'done',
  'finished',
  'succeeded',
  'success',
]);
function shouldRethrowVideoPollingError(value27) {
  if (!(value27 instanceof ApiError)) return false;
  return (
    value27.type === ErrorType.TASK_FAILED ||
    value27.type === ErrorType.CONTENT_FILTERED ||
    value27.type === ErrorType.TASK_TIMEOUT ||
    value27.type === ErrorType.AUTH_ERROR ||
    value27.type === ErrorType.FORBIDDEN ||
    value27.type === ErrorType.INVALID_PARAMS ||
    value27.type === ErrorType.INSUFFICIENT_BALANCE ||
    value27.type === ErrorType.MODEL_UNAVAILABLE ||
    value27.type === 'PARSE_ERROR'
  );
}
async function pollVideoTask(value28, provider5, value29, signal = {}) {
  const providerConfig4 = getProviderConfig(provider5);
  for (let count4 = 0; count4 < 600; count4++) {
    if (signal?.signal?.aborted) throw new Error('CANCELLED');
    await new Promise((value30) => setTimeout(value30, 2000));
    if (signal?.signal?.aborted) throw new Error('CANCELLED');
    const encodeURIComponent2 = encodeURIComponent(String(value28)),
      value31 =
        String(providerConfig4.apiUrl || '').replace(/\/+$/, '') +
        '/v1/tasks/' +
        encodeURIComponent2 +
        (String(provider5 || '')
          .trim()
          .toLowerCase() === 'apimart'
          ? '?language=zh'
          : ''),
      manifestVideoTaskPollUrl = buildManifestVideoTaskPollUrl(value28, signal?.taskPolling) || value31;
    try {
      const requester2 = await requester({
          url: '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(manifestVideoTaskPollUrl),
          method: 'GET',
          headers: { Authorization: 'Bearer ' + value29 },
          provider: provider5,
          timeout: 30000,
          signal: signal?.signal,
        }),
        raw2 = normalizeAsyncVideoTaskInfo(requester2),
        asyncVideoTaskStatus = resolveAsyncVideoTaskStatus(raw2, signal?.responseMapping),
        taskError2 = parseTaskError(provider5, raw2);
      if (taskError2) throw taskError2;
      const extractVideoUrls2 = extractVideoUrls(raw2, signal?.responseMapping).length > 0;
      if (extractVideoUrls2) return processVideoTaskResult(raw2, provider5, signal);
      if (ASYNC_VIDEO_SUCCESS_STATUSES.has(asyncVideoTaskStatus))
        throw new ApiError({
          type: 'PARSE_ERROR',
          provider: provider5,
          message: '无法从服务器响应中提取视频地址',
          raw: raw2,
          retryable: false,
        });
      if (isAsyncVideoTaskFailureStatus(asyncVideoTaskStatus))
        throw ApiError.taskFailed(provider5, extractAsyncVideoTaskFailureReason(raw2) || '任务状态异常');
    } catch (value32) {
      if (shouldRethrowVideoPollingError(value32)) throw value32;
    }
  }
  throw ApiError.taskTimeout(provider5);
}
function normalizeTaskSnapshotPayload(value33) {
  if (value33 && typeof value33 === 'object') return value33;
  const rawText = String(value33 || '').trim();
  if (!rawText) return {};
  try {
    return JSON.parse(rawText);
  } catch {
    return { rawText: rawText };
  }
}
function normalizeAsyncVideoTaskInfo(value34) {
  const args6 = normalizeTaskSnapshotPayload(value34),
    value35 =
      args6 &&
      typeof args6 === 'object' &&
      args6.data &&
      typeof args6.data === 'object' &&
      !Array.isArray(args6.data);
  return value35 ? { ...args6, ...args6.data } : normalizeTaskSnapshotPayload(args6?.data || args6);
}
function resolveAsyncVideoTaskStatus(response4, value36 = null) {
  const mappedResponseValue2 = resolveMappedResponseValue(response4, value36?.statusPath);
  if (mappedResponseValue2) return String(mappedResponseValue2).trim().toLowerCase();
  const response5 = Array.isArray(response4?.data)
      ? response4.data[0]
      : response4?.data && typeof response4.data === 'object'
        ? response4.data
        : null,
    response6 = Array.isArray(response4?.results)
      ? response4.results[0]
      : response4?.results && typeof response4.results === 'object'
        ? response4.results
        : null,
    response7 = response4?.result && typeof response4.result === 'object' ? response4.result : null,
    response8 = response4?.output && typeof response4.output === 'object' ? response4.output : null;
  return String(
    response5?.status ||
      response4?.status ||
      response4?.taskStatus ||
      response4?.task_status ||
      response4?.data?.status ||
      response7?.status ||
      response7?.taskStatus ||
      response7?.task_status ||
      response8?.status ||
      response8?.taskStatus ||
      response8?.task_status ||
      response6?.status ||
      response4?.state ||
      response4?.phase ||
      '',
  )
    .trim()
    .toLowerCase();
}
function isAsyncVideoTaskFailureStatus(value37) {
  return ['failed', 'fail', 'error', 'cancelled', 'canceled', 'expired'].includes(
    String(value37 || '')
      .trim()
      .toLowerCase(),
  );
}
function stringifyTaskFailureValue(error3) {
  if (error3 == null) return '';
  if (typeof error3 === 'string') return error3.trim();
  if (typeof error3 === 'number' || typeof error3 === 'boolean') return String(error3);
  if (typeof error3 === 'object') {
    const value38 =
      error3.message ||
      error3.errorMessage ||
      error3.error_message ||
      error3.detail ||
      error3.reason ||
      error3.type ||
      error3.status ||
      error3.code;
    if (value38) return stringifyTaskFailureValue(value38);
    try {
      return JSON.stringify(error3);
    } catch {
      return String(error3 || '').trim();
    }
  }
  return String(error3 || '').trim();
}
function extractAsyncVideoTaskFailureReason(error4) {
  const value39 = [
    error4?.error?.message,
    error4?.error?.error?.message,
    error4?.errorMessage,
    error4?.error_message,
    error4?.message,
    error4?.failedReason,
    error4?.failReason,
    error4?.failure_reason,
    error4?.data?.error?.message,
    error4?.data?.error?.error?.message,
    error4?.data?.errorMessage,
    error4?.data?.error_message,
    error4?.data?.message,
    error4?.data?.failedReason,
    error4?.data?.failReason,
    error4?.data?.failure_reason,
    error4?.result?.error?.message,
    error4?.result?.errorMessage,
    error4?.result?.message,
    error4?.rawText,
  ];
  for (const value40 of value39) {
    const stringifyTaskFailureValue2 = stringifyTaskFailureValue(value40);
    if (stringifyTaskFailureValue2) return stringifyTaskFailureValue2;
  }
  return (
    stringifyTaskFailureValue(error4?.error) ||
    stringifyTaskFailureValue(error4?.data?.error) ||
    stringifyTaskFailureValue(error4?.result?.error) ||
    ''
  );
}
function isLikelyVideoUrl(value41) {
  const enabled11 = String(value41 || '').trim();
  if (!enabled11) return false;
  if (!/^https?:\/\//i.test(enabled11) && !enabled11.startsWith('/')) return false;
  return /\.(mp4|mov|webm|mkv|avi|m4v|m3u8)(\?|#|$)/i.test(enabled11);
}
const RESULT_MEDIA_KIND_FIELDS = [
  'mediaKind',
  'mediaType',
  'mimeType',
  'contentType',
  'fileType',
  'outputType',
  'type',
  'format',
  'extension',
  'ext',
];
function inferVideoResultMediaKind(enabled12 = {}, value42 = '') {
  const value43 = String(value42 || '').toLowerCase();
  if (/(^|[_-])video($|[_-])/.test(value43) || value43 === 'videourl') return 'video';
  if (/(^|[_-])audio($|[_-])/.test(value43) || value43 === 'audiourl') return 'audio';
  if (/(^|[_-])(image|img|thumb|thumbnail|poster|cover)($|[_-])/.test(value43)) return 'image';
  if (!enabled12 || typeof enabled12 !== 'object' || Array.isArray(enabled12)) return '';
  for (const value44 of RESULT_MEDIA_KIND_FIELDS) {
    const enabled13 = String(enabled12[value44] || '')
      .trim()
      .toLowerCase();
    if (!enabled13) continue;
    if (/video|mp4|mov|webm|mkv|avi|m4v|m3u8/.test(enabled13)) return 'video';
    if (/audio|mp3|wav|aac|m4a|flac|ogg/.test(enabled13)) return 'audio';
    if (/image|png|jpe?g|webp|gif/.test(enabled13)) return 'image';
  }
  return '';
}
function extractVideoResultEntries(value45) {
  const list10 = [],
    map2 = new WeakSet(),
    list11 = [
      'videoUrl',
      'video_url',
      'url',
      'fileUrl',
      'file_url',
      'downloadUrl',
      'download_url',
      'contentUrl',
      'content_url',
      'output',
      'mediaUrl',
      'media_url',
      'resultUrl',
      'result_url',
      'video',
    ],
    list12 = ['thumbUrl', 'thumbnailUrl', 'thumbnail_url', 'posterUrl', 'poster_url'],
    thumbUrl = (enabled14, value46 = '') => {
      if (!enabled14 || typeof enabled14 !== 'object' || Array.isArray(enabled14))
        return String(value46 || '').trim();
      for (const value47 of list12) {
        const value48 = String(enabled14[value47] || '').trim();
        if (value48) return value48;
      }
      return String(value46 || '').trim();
    },
    handler = (list13, value49 = {}, value50 = '') => {
      if (list13 == null) return;
      if (Array.isArray(list13)) {
        list13.forEach((item6) => handler(item6, value49, value50));
        return;
      }
      if (typeof list13 === 'object') {
        handler2(list13, value49);
        return;
      }
      const videoUrl = String(list13 || '').trim();
      if (!videoUrl) return;
      list10.push({
        videoUrl: videoUrl,
        thumbUrl: thumbUrl(value49),
        mediaKind: inferVideoResultMediaKind(value49, value50),
      });
    },
    handler2 = (list14, args7 = {}) => {
      if (list14 == null) return;
      if (Array.isArray(list14)) {
        list14.forEach((item7) => handler2(item7, args7));
        return;
      }
      if (typeof list14 !== 'object') return;
      if (map2.has(list14)) return;
      map2.add(list14);
      const value51 = {
        ...args7,
        ...list14,
        thumbUrl: thumbUrl(list14, thumbUrl(args7)),
        mediaKind: inferVideoResultMediaKind(list14) || inferVideoResultMediaKind(args7),
      };
      (list11.forEach((item8) => {
        Object.prototype.hasOwnProperty.call(list14, item8) && handler(list14[item8], value51, item8);
      }),
        Object.entries(list14).forEach(([value52, value53]) => {
          if (list11.includes(value52) || list12.includes(value52)) return;
          if (value53 && typeof value53 === 'object') handler2(value53, value51);
        }));
    };
  handler2(value45);
  const list15 = [],
    map3 = new Set();
  for (const value54 of list10) {
    const videoUrl2 = String(value54?.videoUrl || '').trim();
    if (!videoUrl2 || map3.has(videoUrl2)) continue;
    map3.add(videoUrl2);
    const thumbUrl2 = String(value54?.thumbUrl || '').trim();
    list15.push({
      videoUrl: videoUrl2,
      ...(thumbUrl2 ? { thumbUrl: thumbUrl2 } : {}),
      mediaKind: String(value54?.mediaKind || '').trim(),
    });
  }
  const list16 = list15.filter((item9) => item9.mediaKind === 'video' || isLikelyVideoUrl(item9.videoUrl)),
    list17 = list16.length ? list16 : list15;
  return list17.map(({ mediaKind: mediaKind, ...args8 }) => args8);
}
function resolveAsyncVideoTaskId(value55, value56 = null) {
  const mappedResponseValue3 = resolveMappedResponseValue(value55, value56?.taskIdPath);
  if (mappedResponseValue3) return mappedResponseValue3;
  if (typeof value55?.data === 'string' || typeof value55?.data === 'number') {
    const value57 = String(value55.data).trim();
    if (looksLikeTaskToken(value57)) return value57;
  }
  if (typeof value55 === 'string' || typeof value55 === 'number') {
    const value58 = String(value55).trim();
    if (looksLikeTaskToken(value58)) return value58;
  }
  const value59 = Array.isArray(value55?.data)
      ? value55.data[0]
      : value55?.data && typeof value55.data === 'object'
        ? value55.data
        : Array.isArray(value55?.results)
          ? value55.results[0]
          : value55?.results && typeof value55.results === 'object'
            ? value55.results
            : null,
    value60 = value55?.result && typeof value55.result === 'object' ? value55.result : null,
    value61 = value55?.output && typeof value55.output === 'object' ? value55.output : null,
    value62 = value55?.response && typeof value55.response === 'object' ? value55.response : null,
    value63 =
      value59?.task_id ||
      value59?.taskId ||
      value59?.id ||
      value55?.task_id ||
      value55?.taskId ||
      value55?.id ||
      value55?.data?.task_id ||
      value55?.data?.taskId ||
      value55?.data?.id ||
      value60?.task_id ||
      value60?.taskId ||
      value60?.id ||
      value61?.task_id ||
      value61?.taskId ||
      value61?.id ||
      value62?.task_id ||
      value62?.taskId ||
      value62?.id ||
      findFirstDeepValueByKeyPattern(value55, /^(task_?id|taskid|request_?id|requestid)$/i) ||
      findFirstDeepValueByKeyPattern(value55, /^id$/i) ||
      '';
  return String(value63 || '').trim();
}
function extractVideoUrls(response9, value64 = null) {
  const list18 = resolveMappedResponseValues(response9, value64?.resultPaths);
  if (list18.length > 0) return list18;
  const list19 = extractVideoResultEntries(response9);
  if (list19.length > 0) return list19.map((item10) => item10.videoUrl);
  const list20 = [],
    handler3 = (response10) => {
      if (response10 == null) return;
      if (Array.isArray(response10)) {
        for (const value65 of response10) handler3(value65);
        return;
      }
      if (typeof response10 === 'object') {
        handler3(
          response10.videoUrl ||
            response10.video_url ||
            response10.url ||
            response10.fileUrl ||
            response10.video ||
            response10.output ||
            response10.mediaUrl,
        );
        return;
      }
      const value66 = String(response10 || '').trim();
      if (value66) list20.push(value66);
    },
    handler4 = (value67) => {
      const list21 = [],
        map4 = new Set();
      let count5 = 0;
      const run = (enabled15, count6) => {
        if (count5 > 8000) return;
        if (count6 > 6) return;
        count5++;
        if (!enabled15) return;
        if (typeof enabled15 === 'string') {
          const value68 = enabled15.trim();
          isLikelyVideoUrl(value68) && !map4.has(value68) && (map4.add(value68), list21.push(value68));
          return;
        }
        if (Array.isArray(enabled15)) {
          for (const value69 of enabled15) run(value69, count6 + 1);
          return;
        }
        if (typeof enabled15 === 'object') {
          for (const value70 of Object.values(enabled15)) run(value70, count6 + 1);
        }
      };
      return (run(value67, 0), list21);
    };
  if (response9.result?.videos && Array.isArray(response9.result.videos)) {
    for (const response11 of response9.result.videos) handler3(response11?.url || response11);
  } else {
    if (response9.status === 'succeeded' && response9.results) {
      for (const value71 of response9.results) handler3(value71);
    } else {
      if (response9.data?.[0]?.url) {
        for (const value72 of response9.data) handler3(value72);
      } else {
        if (response9.data?.[0]?.fileUrl) {
          for (const value73 of response9.data) handler3(value73?.fileUrl);
        } else {
          if (response9.data?.results) {
            for (const value74 of response9.data.results) handler3(value74);
          } else {
            if (response9.data?.[0]?.video) {
              for (const value75 of response9.data) handler3(value75?.video);
            } else {
              if (Array.isArray(response9.data)) {
                for (const value76 of response9.data) handler3(value76);
              } else {
                if (Array.isArray(response9.videos)) {
                  for (const value77 of response9.videos) handler3(value77);
                } else {
                  if (response9.status === 'COMPLETED' && response9.results) {
                    for (const value78 of response9.results) handler3(value78);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  const list22 = list20.filter(Boolean),
    list23 = list22.filter(isLikelyVideoUrl);
  if (list23.length > 0) return Array.from(new Set(list23));
  if (list22.length > 0) return Array.from(new Set(list22));
  return handler4(response9);
}
function extractVideoEntries(value79, value80 = null) {
  const list24 = extractVideoResultEntries(value79);
  if (list24.length > 0) return list24;
  const list25 = resolveMappedResponseValues(value79, value80?.resultPaths);
  if (list25.length > 0)
    return list25
      .map((item11) => ({ videoUrl: String(item11 || '').trim() }))
      .filter((item12) => item12.videoUrl);
  return extractVideoUrls(value79, value80)
    .map((item13) => ({ videoUrl: String(item13 || '').trim() }))
    .filter((item14) => item14.videoUrl);
}
function processVideoTaskResult(raw3, provider6, value81 = {}) {
  const videoUrl3 = extractVideoEntries(raw3, value81?.responseMapping);
  if (videoUrl3.length === 0) {
    const error5 = parseError(provider6, raw3, 200);
    if (error5) throw error5;
    const message = parseTaskError(provider6, raw3);
    if (message)
      throw new ApiError({
        type: 'TASK_FAILED',
        provider: provider6,
        message: message.getUserMessage(),
        retryable: false,
      });
    const message2 = extractAsyncVideoTaskFailureReason(raw3);
    if (message2)
      throw new ApiError({ type: 'TASK_FAILED', provider: provider6, message: message2, retryable: false });
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: provider6,
      message: '无法从服务器响应中提取视频地址',
      raw: raw3,
      retryable: false,
    });
  }
  return {
    videoUrl: videoUrl3[0].videoUrl,
    thumbUrl: videoUrl3[0].thumbUrl,
    isBatch: videoUrl3.length > 1,
    videos: videoUrl3,
  };
}
function extractVideoUrl(response12) {
  return response12.videoUrl || response12.url || (response12.data && response12.data[0]?.url) || null;
}
function _normalizeRemoteUrl(value82) {
  const enabled16 = String(value82 || '').trim();
  if (!enabled16) return '';
  if (enabled16.startsWith('/')) return enabled16;
  if (/^data:/i.test(enabled16)) return enabled16;
  if (/^blob:/i.test(enabled16)) return enabled16;
  if (enabled16.startsWith('//')) return 'https:' + enabled16;
  if (/^https?:\/\//i.test(enabled16)) return enabled16;
  return 'https://' + enabled16.replace(/^\/+/, '');
}
function _guessExtFromUrl(value83, value84) {
  try {
    const uRL = new URL(String(value83 || ''), location?.href || undefined),
      value85 = String(uRL.pathname || ''),
      list26 = value85.split('/').filter(Boolean).pop() || '',
      count7 = list26.lastIndexOf('.');
    if (count7 > 0 && count7 < list26.length - 1) {
      const value86 = list26.slice(count7 + 1).toLowerCase();
      if (/^[a-z0-9]{1,5}$/.test(value86)) return value86;
    }
  } catch {}
  return value84;
}
function _toLocalPathIfSameOrigin(value87) {
  return urlToLocalPath(value87);
}
async function _trySaveOutputByClientDownload(value88, value89) {
  const value90 = String(value88 || '').trim();
  if (!(value90.startsWith('http://') || value90.startsWith('https://')))
    return { localPath: null, error: 'invalid url' };
  const signal2 = new AbortController(),
    setTimeout2 = setTimeout(() => signal2.abort(), 120000);
  let body = null;
  try {
    body = await fetchRemoteBlob(value90, { signal: signal2.signal });
  } catch (error6) {
    const error7 = error6 instanceof Error ? error6.message : String(error6 || '');
    return { localPath: null, error: error7 || 'client download failed' };
  } finally {
    clearTimeout(setTimeout2);
  }
  if (!body) return { localPath: null, error: 'empty blob' };
  const ext =
      String(value89 || '')
        .trim()
        .toLowerCase() || 'bin',
    uRLSearchParams = new URLSearchParams({ ext: ext });
  try {
    const requester3 = await requester({
      url: '/api/v2/save_output?' + uRLSearchParams.toString(),
      method: 'POST',
      provider: 'local',
      timeout: 8 * 60 * 1000,
      headers: { 'Content-Type': 'application/octet-stream' },
      body: body,
    });
    return { localPath: pickResultLocalPath(requester3) || null, error: null };
  } catch (error8) {
    const error9 = error8 instanceof Error ? error8.message : String(error8 || '');
    return { localPath: null, error: error9 || 'save failed' };
  }
}
async function trySaveOutputFromUrl(value91, dedupeKey = {}) {
  const localPath2 = _toLocalPathIfSameOrigin(value91);
  if (localPath2) return { localPath: localPath2, error: null };
  const url3 = _normalizeRemoteUrl(value91);
  if (!url3) return { localPath: null, error: 'empty url' };
  const ext2 = _guessExtFromUrl(url3, 'mp4');
  try {
    const requester4 = await requester({
      url: '/api/v2/save_output_from_url',
      method: 'POST',
      provider: 'local',
      timeout: 8 * 60 * 1000,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url3,
        ext: ext2,
        maxBytes: 1024 * 1024 * 1024,
        dedupeKey: dedupeKey?.dedupeKey,
      }),
    });
    return { localPath: pickResultLocalPath(requester4) || null, error: null };
  } catch (error10) {
    const error11 = error10 instanceof Error ? String(error10.message || '') : String(error10 || ''),
      count8 = error10 instanceof ApiError ? error10.status : null,
      value92 =
        count8 === 400 || count8 === 401 || count8 === 403 || count8 === 502 || count8 === 504;
    if (value92) {
      const _trySaveOutputByClientDownload2 = await _trySaveOutputByClientDownload(url3, ext2);
      if (_trySaveOutputByClientDownload2.localPath) return _trySaveOutputByClientDownload2;
      if (_trySaveOutputByClientDownload2.error)
        return {
          localPath: null,
          error:
            '' +
            error11 +
            (_trySaveOutputByClientDownload2.error
              ? '；浏览器兜底失败：' + _trySaveOutputByClientDownload2.error
              : ''),
        };
    }
    return { localPath: null, error: error11 || 'save failed' };
  }
}
function getVideoResultSourceUrl(response13) {
  if (typeof response13 === 'string') return String(response13 || '').trim();
  if (!response13 || typeof response13 !== 'object' || Array.isArray(response13)) return '';
  return String(
    response13.videoUrl ||
      response13.url ||
      response13.localUrl ||
      localPathToUrl(response13.localPath) ||
      '',
  ).trim();
}
function buildPostProcessedVideoItem(videoUrl4, value93 = {}) {
  const args9 =
      videoUrl4 && typeof videoUrl4 === 'object' && !Array.isArray(videoUrl4)
        ? videoUrl4
        : { videoUrl: videoUrl4 },
    videoResultSourceUrl = getVideoResultSourceUrl(args9),
    resultLocalPath = pickResultLocalPath(value93) || pickResultLocalPath(args9),
    url4 = localPathToUrl(resultLocalPath),
    videoUrl5 = url4 || videoResultSourceUrl,
    value94 = { ...args9, videoUrl: videoUrl5 };
  videoResultSourceUrl &&
    videoResultSourceUrl !== videoUrl5 &&
    !String(value94.sourceUrl || '').trim() &&
    (value94.sourceUrl = videoResultSourceUrl);
  if (resultLocalPath) value94.localPath = resultLocalPath;
  else delete value94.localPath;
  for (const value95 of [
    'displayLocalPath',
    'posterLocalPath',
    'thumbLocalPath',
    'videoProxyStatus',
    'videoCodec',
  ]) {
    if (value93?.[value95]) value94[value95] = value93[value95];
  }
  if (value93?.error) value94.saveError = value93.error;
  else delete value94.saveError;
  return value94;
}
async function postProcessVideoResult(raw4, dedupeKey2 = {}) {
  if (!raw4) return raw4;
  if (Array.isArray(raw4.videos)) {
    const videos = [];
    for (const value96 of raw4.videos) {
      const videoResultSourceUrl2 = getVideoResultSourceUrl(value96);
      if (!videoResultSourceUrl2) continue;
      const trySaveOutputFromUrl2 = await trySaveOutputFromUrl(videoResultSourceUrl2, {
        dedupeKey: dedupeKey2?.taskKey ? dedupeKey2.taskKey + ':' + videoResultSourceUrl2 : undefined,
      });
      videos.push(buildPostProcessedVideoItem(value96, trySaveOutputFromUrl2));
    }
    if (videos.length === 0 && getVideoResultSourceUrl(raw4)) {
      const value97 = { ...raw4 };
      return (
        delete value97.isBatch,
        delete value97.videos,
        await postProcessVideoResult(value97, dedupeKey2)
      );
    }
    if (videos.length === 0)
      throw new ApiError({
        type: 'PARSE_ERROR',
        provider: dedupeKey2?.providerId || 'unknown',
        message: '无法从服务器响应中提取视频地址',
        raw: raw4,
        retryable: false,
      });
    return {
      isBatch: Boolean(raw4.isBatch || videos.length > 1),
      videos: videos,
      videoUrl: videos[0]?.videoUrl,
      sourceUrl: videos[0]?.sourceUrl,
      thumbUrl: videos[0]?.thumbUrl,
      localPath: videos[0]?.localPath,
      displayLocalPath: videos[0]?.displayLocalPath,
      posterLocalPath: videos[0]?.posterLocalPath,
      videoProxyStatus: videos[0]?.videoProxyStatus,
      videoCodec: videos[0]?.videoCodec,
      saveError: videos[0]?.saveError,
    };
  }
  if (raw4.videoUrl) {
    const trySaveOutputFromUrl3 = await trySaveOutputFromUrl(raw4.videoUrl, {
      dedupeKey: dedupeKey2?.taskKey ? dedupeKey2.taskKey + ':' + raw4.videoUrl : undefined,
    });
    return buildPostProcessedVideoItem(raw4, trySaveOutputFromUrl3);
  }
  return raw4;
}
export async function generateVideo(args10, signal3) {
  const videoExecution4 = resolveVideoExecution(args10),
    provider7 = resolveVideoProviderId(args10, videoExecution4),
    value98 = videoExecution4?.executionManifest,
    value99 = value98?.adapterType === 'workflow';
  if (value98?.adapterType === 'localRuntime' && value98?.runtime === 'dreaminaVideo') {
    const value100 = {
      ...args10,
      prompt: applyCameraAngleToPrompt(args10.prompt, args10.cameraAngle),
    };
    return await runDreaminaVideoGeneration(value100, signal3);
  }
  const taskPolling2 = await buildGenerateVideoRequest(args10),
    responseMapping2 = taskPolling2?.responseMapping || null,
    args11 = {
      ...(signal3 || {}),
      ...(responseMapping2 ? { responseMapping: responseMapping2 } : {}),
      ...(taskPolling2?.taskPolling ? { taskPolling: taskPolling2.taskPolling } : {}),
    },
    headers = { ...(taskPolling2.headers || {}) },
    value101 = String(args10?.installId || '').trim();
  if (value101) headers['X-AIC-Install-Id'] = value101;
  let raw5,
    value102 = '',
    value103 = null;
  try {
    if (value99) {
      const response14 = await requester({
        url: taskPolling2.url,
        method: 'POST',
        provider: provider7,
        timeout: GENERATION_TIMEOUT,
        signal: signal3?.signal,
        headers: headers,
        body: JSON.stringify(taskPolling2.body),
        responseType: 'text',
        returnMeta: true,
      });
      ((value102 = String(response14?.data ?? '')),
        (value103 = response14?.headers || null),
        (raw5 = parseVideoResponseData(value102)));
    } else
      raw5 = await requester({
        url: taskPolling2.url,
        method: 'POST',
        provider: provider7,
        timeout: GENERATION_TIMEOUT,
        signal: signal3?.signal,
        headers: headers,
        body: JSON.stringify(taskPolling2.body),
      });
  } catch (value104) {
    if (value104 instanceof ApiError) throw value104;
    throw parseNetworkError(provider7, value104, GENERATION_TIMEOUT);
  }
  let processVideoTaskResult4 = null,
    taskKey = '';
  if (value99) {
    if (String(raw5?.code || '') === 'SUBSCRIPTION_REQUIRED') {
      const error12 = new Error(raw5?.message || '该模型为 VIP，请先激活 CDKEY/订阅');
      ((error12.code = 'SUBSCRIPTION_REQUIRED'),
        (error12.contactText = raw5?.contactText || ''),
        (error12.contactUrl = raw5?.contactUrl || ''));
      throw error12;
    }
    const count9 = typeof raw5?.code === 'number' ? raw5.code : null;
    if (count9 !== null && count9 !== 0) throw parseError(provider7, raw5, 200);
    const runningHubVideoTaskId =
      resolveRunningHubVideoTaskId(raw5, value102, value103, responseMapping2) || null;
    if (runningHubVideoTaskId) {
      const taskId5 = String(runningHubVideoTaskId);
      taskKey = provider7 + ':video:' + taskId5;
      const useOpenapiQuery2 =
        taskPolling2.useOpenapiQuery === true || taskPolling2.url === '/api/v2/proxy/image';
      (signal3?.onTaskMeta?.({ taskId: taskId5, useOpenapiQuery: useOpenapiQuery2 }),
        signal3?.onTaskId?.(taskId5));
      const pollRunningHubVideoTask4 = await pollRunningHubVideoTask(taskId5, args10, provider7, {
        ...args11,
        useOpenapiQuery: useOpenapiQuery2,
      });
      processVideoTaskResult4 = processVideoTaskResult(pollRunningHubVideoTask4, provider7, args11);
    }
  }
  if (!processVideoTaskResult4) {
    const asyncVideoTaskId2 = resolveAsyncVideoTaskId(raw5, responseMapping2);
    if (asyncVideoTaskId2) {
      const taskId6 = String(asyncVideoTaskId2);
      taskKey = provider7 + ':video:' + taskId6;
      const providerConfig5 = getProviderConfig(provider7),
        value105 =
          taskPolling2.useOpenapiQuery === true ||
          (provider7 === 'runninghub' && taskPolling2.url === '/api/v2/proxy/image'),
        apiKey4 =
          args10.apiKey ||
          (provider7 === 'runninghub' ? providerConfig5.modelApiKey : '') ||
          providerConfig5.apiKey;
      (signal3?.onTaskMeta?.({
        taskId: taskId6,
        provider: provider7,
        kind: 'video',
        ...(value105 ? { useOpenapiQuery: true } : {}),
      }),
        signal3?.onTaskId?.(taskId6));
      if (value105) {
        const pollRunningHubVideoTask5 = await pollRunningHubVideoTask(
          taskId6,
          { ...args10, apiKey: apiKey4 },
          provider7,
          { ...args11, useOpenapiQuery: true },
        );
        processVideoTaskResult4 = processVideoTaskResult(pollRunningHubVideoTask5, provider7, args11);
      } else processVideoTaskResult4 = await pollVideoTask(taskId6, provider7, apiKey4, args11);
    }
  }
  if (!processVideoTaskResult4) {
    const videoUrl6 = extractVideoUrls(raw5, responseMapping2)[0] || extractVideoUrl(raw5);
    if (!videoUrl6) {
      const error13 = parseError(provider7, raw5, 200);
      if (error13) throw new Error(error13.getUserMessage());
      throw new ApiError({
        type: 'PARSE_ERROR',
        provider: provider7,
        message: '无法获取视频地址',
        raw: raw5,
        retryable: false,
      });
    }
    processVideoTaskResult4 = { videoUrl: videoUrl6 };
  }
  return await postProcessVideoResult(processVideoTaskResult4, {
    providerId: provider7,
    ...(taskKey ? { taskKey: taskKey } : {}),
  });
}
export const __test__ = {
  extractVideoEntries: extractVideoEntries,
  extractVideoUrls: extractVideoUrls,
  processVideoTaskResult: processVideoTaskResult,
};

const VIDEO_RESULT_SAVE_TIMEOUT_MS = SAVE_OUTPUT_FROM_URL_TIMEOUT_MS;
const VIDEO_RESULT_SAVE_RETRIES = 3;
const VIDEO_RESULT_SAVE_RETRY_DELAY_MS = 1000;

function resolveVideoRuntimeProviderKey(options4 = {}, value106 = '') {
  const runningHubTaskProviderProfileId = getRunningHubTaskProviderProfileId(options4),
    videoExecution5 = resolveVideoExecution(options4),
    modelProviderProfileId = normalizeModelProviderProfileId(
      videoExecution5?.['modelManifest'] || options4?.['model'],
      runningHubTaskProviderProfileId,
    );
  if (modelProviderProfileId) return modelProviderProfileId;
  if (value106 === 'runninghubwf') {
    if (runningHubTaskProviderProfileId)
      return normalizeRunningHubModelApiProfileId(runningHubTaskProviderProfileId);
  }
  return value106 === 'runninghub' && isModelApiModel(options4?.['model'], 'runninghub')
    ? resolveRunningHubModelApiProfileId(
        videoExecution5?.['modelManifest']?.['modelId'] || options4?.['model'],
        runningHubTaskProviderProfileId,
      )
    : value106;
}

function resolveVideoProviderConfig(options5 = {}, value107 = '') {
  const videoRuntimeProviderKey = resolveVideoRuntimeProviderKey(options5, value107),
    args12 = getProviderConfig(videoRuntimeProviderKey) || {};
  return value107 === 'runninghub'
    ? { ...args12, apiUrl: resolveRunningHubModelApiBaseUrl(videoRuntimeProviderKey) }
    : args12;
}

function normalizeVideoSubmitDiagnosticToken(value108) {
  if (value108 === null || value108 === undefined || typeof value108 === 'object') return '';
  return String(value108)
    ['trim']()
    ['replace'](/[^a-zA-Z0-9._:-]/g, '')
    ['slice'](0, 80);
}

function getVideoSubmitDiagnosticCandidates(value109) {
  return [
    value109,
    value109?.['data'],
    value109?.['result'],
    value109?.['output'],
    value109?.['response'],
    value109?.['results'],
  ]
    ['flatMap']((value110) => (Array['isArray'](value110) ? value110 : [value110]))
    ['filter']((value111) => value111 && typeof value111 === 'object');
}

function getVideoSubmitDiagnosticToken(value112, value113 = []) {
  const videoSubmitDiagnosticCandidates = getVideoSubmitDiagnosticCandidates(value112);
  for (const value114 of videoSubmitDiagnosticCandidates) {
    for (const value115 of value113) {
      const videoSubmitDiagnosticToken = normalizeVideoSubmitDiagnosticToken(value114?.[value115]);
      if (videoSubmitDiagnosticToken) return videoSubmitDiagnosticToken;
    }
  }
  return '';
}

function isVideoSubmitSuccessCode(value116) {
  return ['', '0', '200', '201', '202', 'ok', 'success']['includes'](
    String(value116 || '')
      ['trim']()
      ['toLowerCase'](),
  );
}

function hasExplicitVideoSubmitFailureSignal(value117) {
  const videoSubmitDiagnosticCandidates2 = getVideoSubmitDiagnosticCandidates(value117),
    map5 = new Set(['failed', 'failure', 'error', 'cancelled', 'canceled', 'rejected', 'denied', 'expired']),
    enabled17 = new Set([
      'ok',
      'success',
      'succeeded',
      'submitted',
      'accepted',
      'queued',
      'running',
      'processing',
      '提交成功',
      '任务已提交',
      '已受理',
      '排队中',
      '处理中',
    ]);
  for (const response15 of videoSubmitDiagnosticCandidates2) {
    if (response15['success'] === ![] || response15['ok'] === ![]) return !![];
    const value118 = String(
      response15['status'] || response15['taskStatus'] || response15['task_status'] || '',
    )
      ['trim']()
      ['toLowerCase']();
    if (map5['has'](value118)) return !![];
    const videoSubmitDiagnosticToken2 = normalizeVideoSubmitDiagnosticToken(
      response15['errorCode'] ?? response15['error_code'],
    );
    if (videoSubmitDiagnosticToken2 && videoSubmitDiagnosticToken2 !== '0') return !![];
    const videoSubmitDiagnosticToken3 = normalizeVideoSubmitDiagnosticToken(response15['code']);
    if (videoSubmitDiagnosticToken3 && !isVideoSubmitSuccessCode(videoSubmitDiagnosticToken3)) return !![];
    for (const value119 of [
      'error',
      'errorMessage',
      'error_message',
      'failedReason',
      'failReason',
      'fail_reason',
      'failure_reason',
    ]) {
      const value120 = response15[value119];
      if (value120 !== null && value120 !== undefined && value120 !== '') return !![];
    }
    const value121 = String(response15['message'] || response15['msg'] || '')['trim']();
    if (value121 && !enabled17['has'](value121['toLowerCase']())) return !![];
  }
  return ![];
}

function buildVideoSubmitMissingResultError(
  value122,
  value123,
  { expectsTaskId: expectsTaskId = !![] } = {},
) {
  const videoSubmitDiagnosticToken4 = getVideoSubmitDiagnosticToken(value123, [
      'status',
      'taskStatus',
      'task_status',
    ]),
    videoSubmitDiagnosticToken5 = getVideoSubmitDiagnosticToken(value123, ['errorCode', 'error_code']),
    videoSubmitDiagnosticToken6 = getVideoSubmitDiagnosticToken(value123, ['code']),
    value124 =
      videoSubmitDiagnosticToken5 ||
      (!isVideoSubmitSuccessCode(videoSubmitDiagnosticToken6) ? videoSubmitDiagnosticToken6 : ''),
    value125 =
      value123 === null
        ? 'null'
        : value123 === undefined
          ? 'undefined'
          : Array['isArray'](value123)
            ? 'array-' + value123['length']
            : typeof value123,
    list27 =
      value123 && typeof value123 === 'object' && !Array['isArray'](value123)
        ? Object['keys'](value123)
            ['map']((value126) => normalizeVideoSubmitDiagnosticToken(value126))
            ['filter'](Boolean)
            ['slice'](0, 12)
        : [],
    list28 = [
      videoSubmitDiagnosticToken4 ? '状态：' + videoSubmitDiagnosticToken4 : '',
      value124 ? '错误码：' + value124 : '',
      '响应类型：' + value125,
      list27['length'] ? '响应字段：' + list27['join'](',') : '',
    ]['filter'](Boolean),
    value127 = expectsTaskId
      ? '任务创建响应异常：服务端未返回任务 ID'
      : '视频生成响应异常：服务端未返回视频结果';
  return new ApiError({
    type: 'PARSE_ERROR',
    provider: value122,
    code: value124 || undefined,
    message: '' + value127 + (list28['length'] ? '（' + list28['join']('；') + '）' : ''),
    raw: value123,
    retryable: ![],
  });
}

function normalizeDreaminaVideoTaskResult(value128, value129, { allowPending: allowPending = ![] } = {}) {
  const dreaminaTaskSnapshot = normalizeDreaminaTaskSnapshot(value128, { submitId: value129 });
  if (dreaminaTaskSnapshot?.['phase'] === 'failed') {
    const error14 = new Error(
      dreaminaTaskSnapshot?.['failReason'] || dreaminaTaskSnapshot?.['label'] || '查询失败',
    );
    error14['dreaminaSnapshot'] = dreaminaTaskSnapshot;
    throw error14;
  }
  if (allowPending && dreaminaTaskSnapshot?.['phase'] !== 'done')
    return {
      pending: !![],
      message: dreaminaTaskSnapshot?.['label'] || '',
      dreaminaSnapshot: dreaminaTaskSnapshot,
    };
  const value130 = Array['isArray'](dreaminaTaskSnapshot?.['outputs']) ? dreaminaTaskSnapshot['outputs'] : [],
    list29 = value130['map']((value131) => {
      const resultLocalPath2 = pickResultLocalPath(value131);
      return {
        videoUrl: localPathToUrl(resultLocalPath2) || value131['localUrl'] || value131['url'],
        localPath: resultLocalPath2,
      };
    });
  return {
    isBatch: list29['length'] > 1,
    dreaminaSnapshot: dreaminaTaskSnapshot,
    videos: list29,
    videoUrl:
      localPathToUrl(pickResultLocalPath(value130[0])) ||
      value130[0]?.['localUrl'] ||
      value130[0]?.['url'] ||
      '',
    localPath: pickResultLocalPath(value130[0]),
  };
}

export async function probeDreaminaVideoTask(value132, value133 = {}) {
  const enabled18 = String(value132 || '')['trim']();
  if (!enabled18) throw new Error('缺少 Dreamina 提交ID，无法核验视频任务');
  const queryDreaminaResult2 = await queryDreaminaResult(enabled18, {
    autoDownload: !![],
    retries: value133?.['retries'],
    retryDelay: value133?.['retryDelay'],
    signal: value133?.['signal'],
  });
  return normalizeDreaminaVideoTaskResult(queryDreaminaResult2, enabled18, { allowPending: !![] });
}

function buildManifestVideoTaskPollUrls(value134, value135) {
  const enabled19 = [],
    handler5 = (value136) => {
      const enabled20 = String(value136 || '')['trim']();
      if (!enabled20) return;
      const value137 = enabled20['replace']('{taskId}', encodeURIComponent(String(value134)));
      if (value137 && !enabled19['includes'](value137)) enabled19['push'](value137);
    };
  return (
    handler5(value135?.['urlTemplate']),
    Array['isArray'](value135?.['fallbackUrlTemplates']) &&
      value135['fallbackUrlTemplates']['forEach'](handler5),
    enabled19
  );
}

const ASYNC_VIDEO_FAILURE_STATUSES = new Set([
  'failed',
  'failure',
  'fail',
  'error',
  'cancelled',
  'canceled',
  'expired',
]);

function isAgnesTaskNotExistError(value138) {
  if (!(value138 instanceof ApiError)) return ![];
  const value139 = String(value138['message'] || '')
    ['trim']()
    ['toLowerCase']();
  return (
    value139['includes']('task_not_exist') ||
    value139['includes']('task not exist') ||
    value139['includes']('task not found') ||
    value139['includes']('video not found') ||
    value139['includes']('任务不存在') ||
    value139['includes']('任务或视频未找到')
  );
}

function isAgnesVideoId(value140) {
  return /^video_/i['test'](String(value140 || '')['trim']());
}

function shouldTryManifestPollFallback({
  err: err,
  pollIndex: pollIndex,
  pollUrls: pollUrls,
  providerId: providerId2,
  pollUrl: pollUrl,
  taskId: taskId7,
} = {}) {
  if (pollIndex >= pollUrls['length'] - 1 || !(err instanceof ApiError)) return ![];
  const value141 = String(providerId2 || '')
    ['trim']()
    ['toLowerCase']();
  if (value141 === 'agnes' && isAgnesVideoId(taskId7)) return ![];
  if (Number(err['status'] || err['code'] || 0) === 404) return !![];
  return (
    value141 === 'agnes' && String(pollUrl || '')['includes']('/agnesapi?') && isAgnesTaskNotExistError(err)
  );
}

function resolveVideoPollIntervalMs(options6 = {}) {
  const value142 = Number(
    options6?.['taskPolling']?.['pollIntervalMs'] || options6?.['pollIntervalMs'] || 2000,
  );
  if (!Number['isFinite'](value142)) return 2000;
  return Math['min'](30000, Math['max'](1000, Math['trunc'](value142)));
}

function resolveVideoPollAttempts(options7 = {}, value143 = 2000) {
  const count10 = Number(options7?.['taskPolling']?.['maxWaitMs'] || options7?.['maxWaitMs']);
  if (!Number['isFinite'](count10) || count10 <= 0) return 600;
  const value144 = Math['min'](2 * 60 * 60 * 1000, Math['max'](60 * 1000, Math['trunc'](count10)));
  return Math['max'](1, Math['ceil'](value144 / Math['max'](1, value143)));
}

function resolveVideoTransportErrorPolicy(options8 = {}) {
  const enabled21 = options8?.['taskPolling']?.['transportErrorPolicy'];
  if (!enabled21 || typeof enabled21 !== 'object' || Array['isArray'](enabled21)) return null;
  const run2 = (value145) =>
    new Set(
      (Array['isArray'](value145) ? value145 : [])
        ['map']((value146) => Number(value146))
        ['filter']((count11) => Number['isInteger'](count11) && count11 >= 400 && count11 <= 599),
    );
  return {
    maxConsecutiveErrors: Math['min'](
      10,
      Math['max'](1, Math['trunc'](Number(enabled21['maxConsecutiveErrors']) || 3)),
    ),
    retryableStatuses: run2(enabled21['retryableStatuses']),
    terminalStatuses: run2(enabled21['terminalStatuses']),
    surfaceLastError: enabled21['surfaceLastError'] !== ![],
  };
}

function getVideoPollingErrorStatus(value147) {
  const value148 = Number(value147?.['status'] ?? value147?.['code']);
  return Number['isInteger'](value148) ? value148 : null;
}

function resolveAsyncVideoTaskStatuses(value149, value150) {
  const value151 = Array['isArray'](value149)
    ? value149['map']((value152) =>
        String(value152 || '')
          ['trim']()
          ['toLowerCase'](),
      )['filter']((value153) => /^[a-z][a-z0-9_-]{0,63}$/['test'](value153))
    : [];
  return value151['length'] > 0 ? new Set(value151) : value150;
}

function isAsyncVideoTaskSuccessStatus(value154, value155 = null) {
  return resolveAsyncVideoTaskStatuses(value155, ASYNC_VIDEO_SUCCESS_STATUSES)['has'](
    String(value154 || '')
      ['trim']()
      ['toLowerCase'](),
  );
}

function _isRelativeApiUrl(value156) {
  const enabled22 = String(value156 || '')['trim']();
  return enabled22['startsWith']('/') && !enabled22['startsWith']('//');
}

function _canFetchOutputUrl(value157) {
  const value158 = String(value157 || '')['trim']();
  return (
    /^https?:\/\//i['test'](value158) ||
    /^data:/i['test'](value158) ||
    /^blob:/i['test'](value158) ||
    _isRelativeApiUrl(value158)
  );
}

async function _fetchOutputBlob(value159, value160, value161 = 120000) {
  if (_isRelativeApiUrl(value159))
    return await requester({
      url: value159,
      method: 'GET',
      provider: 'local',
      responseType: 'blob',
      signal: value160,
      timeout: value161,
    });
  return await fetchRemoteBlob(value159, { signal: value160, timeout: value161 });
}

async function finalizePostProcessedVideoItem(value162, value163 = {}) {
  const postProcessedVideoItem = buildPostProcessedVideoItem(value162, value163);
  try {
    return await ensureVideoResultThumbnail(postProcessedVideoItem);
  } catch {
    return postProcessedVideoItem;
  }
}

async function resolveVideoResultWithOutputLocalization(value164, value165 = {}, value166 = {}) {
  return await resolveOutputWithLocalization(
    value164,
    () => postProcessVideoResult(value164, value165),
    value166,
  );
}

function isComfyUiHistoryPolling(options9 = {}) {
  return String(options9?.['mode'] || '')['trim']() === 'comfyui-history';
}

async function pollComfyUiVideoTask(value167, value168 = {}) {
  const value169 = String(value167 || '')['trim'](),
    args13 = value168?.['taskPolling'] || {},
    args14 = String(args13['baseUrl'] || '')['trim']();
  for (let count12 = 0; count12 < 600; count12++) {
    if (value168?.['signal']?.['aborted']) throw new Error('CANCELLED');
    await new Promise((value170) => setTimeout(value170, 2000));
    if (value168?.['signal']?.['aborted']) throw new Error('CANCELLED');
    const uRLSearchParams2 = new URLSearchParams({
        promptId: value169,
        ...(args14 ? { baseUrl: args14 } : {}),
        ...(args13['allowCloudBaseUrl'] ? { allowCloudBaseUrl: '1' } : {}),
      }),
      requester5 = await requester({
        url: '/api/v2/comfyui/history?' + uRLSearchParams2['toString'](),
        method: 'GET',
        provider: 'comfyui',
        timeout: 30000,
        signal: value168?.['signal'],
      }),
      value171 =
        typeof value168?.['resultExtractor'] === 'function'
          ? value168['resultExtractor'](requester5)
          : requester5;
    if (extractVideoUrls(value171, value168?.['responseMapping'])['length'] > 0) return value171;
    const asyncVideoTaskStatus2 = resolveAsyncVideoTaskStatus(value171, value168?.['responseMapping']);
    if (isAsyncVideoTaskFailureStatus(asyncVideoTaskStatus2, value168?.['taskPolling']?.['failedStatuses'])) {
      const error15 = parseError('comfyui', value171, 200);
      if (error15) throw error15;
      throw ApiError['taskFailed'](
        'comfyui',
        extractAsyncVideoTaskFailureReason(value171, value168?.['responseMapping']) || 'ComfyUI 任务执行失败',
      );
    }
  }
  throw ApiError['taskTimeout']('comfyui');
}

async function generateVideoUnqueued(args15, args16 = {}) {
  const videoExecution6 = resolveVideoExecution(args15),
    videoProviderId = resolveVideoProviderId(args15, videoExecution6),
    value172 = videoExecution6?.['executionManifest'],
    value173 = value172?.['adapterType'] === 'workflow';
  if (value172?.['adapterType'] === 'localRuntime' && value172?.['runtime'] === 'dreaminaVideo') {
    const value174 = { ...args15, prompt: applyCameraAngleToPrompt(args15['prompt'], args15['cameraAngle']) };
    return await runDreaminaVideoGeneration(value174, args16);
  }
  const dom = await buildGenerateVideoRequest(args15),
    args17 = String(
      dom?.['providerProfileId'] ||
        dom?.['rhProviderProfileId'] ||
        args15?.['providerProfileId'] ||
        args15?.['rhProviderProfileId'] ||
        '',
    )['trim'](),
    value175 =
      videoProviderId === 'runninghubwf' && args17
        ? { ...args15, providerProfileId: args17, rhProviderProfileId: args17 }
        : args15,
    args18 = dom?.['responseMapping'] || null,
    args19 = {
      ...(args16 || {}),
      ...(args18 ? { responseMapping: args18 } : {}),
      ...(dom?.['taskPolling'] ? { taskPolling: dom['taskPolling'] } : {}),
      ...(Array['isArray'](dom?.['errorRules']) && dom['errorRules']['length'] > 0
        ? { errorRules: dom['errorRules'] }
        : {}),
      ...(typeof dom?.['resultExtractor'] === 'function' ? { resultExtractor: dom['resultExtractor'] } : {}),
    },
    value176 = { ...(dom['headers'] || {}) },
    value177 = String(args15?.['installId'] || '')['trim']();
  if (value177) value176['X-AIC-Install-Id'] = value177;
  let error16,
    value178 = '',
    value179 = null;
  try {
    if (value173) {
      const requester6 = await requester({
        url: dom['url'],
        method: 'POST',
        provider: videoProviderId,
        timeout: GENERATION_TIMEOUT,
        signal: args16?.['signal'],
        headers: value176,
        body: JSON['stringify'](dom['body']),
        responseType: 'text',
        returnMeta: !![],
      });
      ((value178 = String(requester6?.['data'] ?? '')),
        (value179 = requester6?.['headers'] || null),
        (error16 = parseVideoResponseData(value178)));
    } else
      error16 = await requester({
        url: dom['url'],
        method: 'POST',
        provider: videoProviderId,
        timeout: GENERATION_TIMEOUT,
        signal: args16?.['signal'],
        headers: value176,
        body: JSON['stringify'](dom['body']),
      });
  } catch (value180) {
    const value181 =
      value180 instanceof ApiError
        ? value180
        : parseNetworkError(videoProviderId, value180, GENERATION_TIMEOUT);
    throw applyManifestErrorRules(value181, args19['errorRules'], {
      provider: videoProviderId,
      phase: 'submit',
    });
  }
  let processVideoTaskResult5 = null,
    args20 = '';
  if (value173) {
    if (String(error16?.['code'] || '') === 'SUBSCRIPTION_REQUIRED') {
      const error17 = new Error(error16?.['message'] || '该模型为 VIP，请先激活 CDKEY/订阅');
      ((error17['code'] = 'SUBSCRIPTION_REQUIRED'),
        (error17['contactText'] = error16?.['contactText'] || ''),
        (error17['contactUrl'] = error16?.['contactUrl'] || ''));
      throw error17;
    }
    const value182 = Number(error16?.['code']),
      count13 =
        error16?.['code'] !== undefined && error16?.['code'] !== null && Number['isFinite'](value182)
          ? value182
          : null,
      runningHubVideoTaskId2 = resolveRunningHubVideoTaskId(error16, value178, value179, args18) || null,
      enabled23 = runningHubVideoTaskId2 && (count13 === 804 || count13 === 813);
    if (count13 !== null && count13 !== 0 && !enabled23) {
      const error18 = parseError(videoProviderId, error16, 200);
      throw (
        error18 ||
        new ApiError({
          type: 'TASK_FAILED',
          provider: videoProviderId,
          code: count13,
          message: String(error16?.['message'] || error16?.['msg'] || 'RunningHub 任务提交失败'),
          raw: error16,
          retryable: count13 === 421,
        })
      );
    }
    if (videoProviderId === 'comfyui') {
      const error19 = parseError(videoProviderId, error16, 200);
      if (error19) throw error19;
    }
    if (runningHubVideoTaskId2) {
      const value183 = String(runningHubVideoTaskId2);
      count13 === 813 &&
        args16?.['onRunningHubWorkflowQueueChange']?.({
          status: 'queued',
          queueIndex: 0,
          queueLength: 1,
          reason: 'provider-accepted-queue',
          taskId: value183,
        });
      args20 = resolveVideoRuntimeProviderKey(value175, videoProviderId) + ':video:' + value183;
      const value184 = dom['useOpenapiQuery'] === !![] || dom['url'] === '/api/v2/proxy/image';
      (args16?.['onTaskMeta']?.({
        taskId: value183,
        useOpenapiQuery: value184,
        ...(args17 ? { providerProfileId: args17, rhProviderProfileId: args17 } : {}),
      }),
        args16?.['onTaskId']?.(value183));
      const value185 =
        videoProviderId === 'comfyui' || isComfyUiHistoryPolling(args19['taskPolling'])
          ? await pollComfyUiVideoTask(value183, args19)
          : await pollRunningHubVideoTask(value183, value175, videoProviderId, {
              ...args19,
              useOpenapiQuery: value184,
            });
      processVideoTaskResult5 = processVideoTaskResult(value185, videoProviderId, args19);
    }
  }
  if (!processVideoTaskResult5) {
    const asyncVideoTaskId3 = resolveAsyncVideoTaskId(error16, args18);
    if (asyncVideoTaskId3) {
      const value186 = String(asyncVideoTaskId3);
      args20 = resolveVideoRuntimeProviderKey(args15, videoProviderId) + ':video:' + value186;
      const videoProviderConfig = resolveVideoProviderConfig(args15, videoProviderId),
        args21 =
          dom['useOpenapiQuery'] === !![] ||
          (videoProviderId === 'runninghub' && dom['url'] === '/api/v2/proxy/image'),
        value187 =
          args15['apiKey'] ||
          (videoProviderId === 'runninghub' ? videoProviderConfig['modelApiKey'] : '') ||
          videoProviderConfig['apiKey'];
      (args16?.['onTaskMeta']?.({
        taskId: value186,
        provider: videoProviderId,
        kind: 'video',
        ...(args21 ? { useOpenapiQuery: !![] } : {}),
      }),
        args16?.['onTaskId']?.(value186));
      if (args21) {
        const pollRunningHubVideoTask6 = await pollRunningHubVideoTask(
          value186,
          { ...args15, apiKey: value187 },
          videoProviderId,
          { ...args19, useOpenapiQuery: !![] },
        );
        processVideoTaskResult5 = processVideoTaskResult(pollRunningHubVideoTask6, videoProviderId, args19);
      } else processVideoTaskResult5 = await pollVideoTask(value186, videoProviderId, value187, args19);
    }
  }
  if (!processVideoTaskResult5) {
    const extractVideoUrls3 = extractVideoUrls(error16, args18)[0] || extractVideoUrl(error16);
    if (!extractVideoUrls3) {
      if (hasExplicitVideoSubmitFailureSignal(error16)) {
        const error20 = parseError(videoProviderId, error16, 200);
        if (error20) {
          error20['message'] = error20['getUserMessage']();
          throw error20;
        }
        const extractAsyncVideoTaskFailureReason2 = extractAsyncVideoTaskFailureReason(error16, args18);
        if (extractAsyncVideoTaskFailureReason2)
          throw new ApiError({
            type: 'TASK_FAILED',
            provider: videoProviderId,
            message: extractAsyncVideoTaskFailureReason2,
            raw: error16,
            retryable: ![],
          });
      }
      throw buildVideoSubmitMissingResultError(videoProviderId, error16, {
        expectsTaskId:
          value173 ||
          dom?.['isAsync'] === !![] ||
          Boolean(args19['taskPolling']) ||
          Boolean(args18?.['taskIdPath']),
      });
    }
    processVideoTaskResult5 = { videoUrl: extractVideoUrls3 };
  }
  return await resolveVideoResultWithOutputLocalization(
    processVideoTaskResult5,
    {
      providerId: videoProviderId,
      ...(args20 ? { taskKey: args20 } : {}),
      signal: args16?.['signal'],
      saveTimeoutMs: args16?.['saveTimeoutMs'],
    },
    args16,
  );
}

function createRunningHubWorkflowQueueChangeEmitter(handler6) {
  if (typeof handler6 !== 'function') return null;
  let value188 = '';
  return (options10 = {}) => {
    const value189 = String(options10?.['status'] || '')
        ['trim']()
        ['toLowerCase'](),
      value190 = Number(options10?.['queueIndex'] ?? -1),
      value191 = Number(options10?.['queueLength'] ?? 0),
      value192 = value189 + ':' + value190 + ':' + value191;
    if (value192 === value188) return ![];
    return ((value188 = value192), handler6(options10), !![]);
  };
}
