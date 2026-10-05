import {
  buildDreaminaImageUpscaleSubmitPayload,
  runDreaminaImageUpscaleGeneration,
} from './dreaminaGenApi.js';
import { buildOpenAiCliImageSubmitRequest, runOpenAiCliImageGeneration } from './openAiCliImageGenApi.js';
import {
  getRunningHubTaskProviderProfileId,
  normalizeRunningHubModelApiProfileId,
  resolveRunningHubModelApiProfileId,
} from '../src/modules/runningHubProviderProfiles.js';
import { saveImage } from '../src/modules/storage.js';
import { compressImage } from '../src/modules/imageUtils.js';
import * as RunningHubAdapter from './adapters/RunningHubAdapter.js';
import {
  buildImageRequestFromManifest,
  resolveManifestTaskPolling,
} from './adapters/ModelApiManifestNormalizer.js';
import { resolveMappedResponseValue, resolveMappedResponseValues } from './adapters/modelApiMappingEngine.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
import { processInputImages, processInputImagesPreserveOrder } from './imageUploadApi.js';
import { normalizeApimartBaseUrl } from './apimartUploadApi.js';
import { uploadInputsToVolcengineFiles } from './volcengineFileApi.js';
import { cancelRunningHubTask } from './runninghubTaskApi.js';
import {
  runDreaminaImageGeneration,
  pollDreaminaUntilDone,
  normalizeDreaminaTaskSnapshot,
} from './dreaminaGenApi.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../src/utils/localMediaPath.js';
import { isModelApiModel, resolveModelExecution, resolveModelProvider } from '../src/manifests/index.js';
import { requester } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import { ApiError, ErrorType, parseError, parseTaskError, parseNetworkError } from './errors/index.js';
const GENERATION_TIMEOUT = 10 * 60 * 1000;
export async function cancelRunningHubImageTask({ apiKey: apiKey, taskId: taskId } = {}) {
  return cancelRunningHubTask({ apiKey: apiKey, taskId: taskId });
}
const GENERATION_RETRIES = 2,
  GENERATION_RETRY_DELAY = 1000;
function getProviderId(value) {
  return resolveModelProvider(value?.model, value?.provider);
}
function resolveModelApiExecutionForPayload(item, key) {
  const providerHint = String(key || '')
      .trim()
      .toLowerCase(),
    enabled = String(item?.model || '').trim();
  if (!enabled) return null;
  const modelExecution = resolveModelExecution(enabled, { providerHint: providerHint }),
    enabled2 = modelExecution?.executionManifest;
  if (!enabled2 || enabled2.adapterType !== 'modelApi' || enabled2.kind !== 'image') return null;
  return enabled2;
}
function resolveImageTaskRuntimeOptions(options = {}, index = '', enabled3 = {}) {
  const enabled4 = String(options?.model || '').trim();
  if (!enabled4) return enabled3 || {};
  const providerHint2 = String(index || getProviderId(options) || '')
      .trim()
      .toLowerCase(),
    modelManifest = resolveModelExecution(enabled4, { providerHint: providerHint2 }),
    responseMapping = modelManifest?.executionManifest;
  if (!responseMapping || responseMapping.adapterType !== 'modelApi' || responseMapping.kind !== 'image')
    return enabled3 || {};
  const result = String(responseMapping.provider || providerHint2)
      .trim()
      .toLowerCase(),
    providerConfig = getProviderConfig(result),
    taskPolling = resolveManifestTaskPolling(result, providerConfig, responseMapping, {
      modelManifest: modelManifest?.modelManifest || null,
    });
  return {
    ...(enabled3 || {}),
    ...(!enabled3?.responseMapping && responseMapping.responseMapping
      ? { responseMapping: responseMapping.responseMapping }
      : {}),
    ...(!enabled3?.taskPolling && taskPolling ? { taskPolling: taskPolling } : {}),
  };
}
function shouldSubmitProviderBatchOnce(data, target, source) {
  if (!(Number.parseInt(source, 10) > 1)) return false;
  const modelApiExecutionForPayload = resolveModelApiExecutionForPayload(data, target),
    el = modelApiExecutionForPayload?.extensions?.batchSubmitMode;
  if (el === 'providerN') return true;
  if (!el || typeof el !== 'object' || Array.isArray(el)) return false;
  if (String(el.type || '').trim() !== 'providerN') return false;
  if (el.requiresInputImages === true) {
    const list = [data?.inputUrls, data?.image_urls, data?.imageUrls, data?.images],
      enabled5 = list.some((list2) =>
        Array.isArray(list2) ? list2.some((item2) => String(item2 || '').trim()) : String(list2 || '').trim(),
      );
    if (!enabled5) return false;
  }
  const enabled6 = String(el.field || '').trim();
  if (!enabled6) return true;
  const list3 = Array.isArray(el.values) ? el.values : [el.value],
    list4 = list3
      .map((item3) =>
        String(item3 ?? '')
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
  if (list4.length === 0) return true;
  const next = String(data?.[enabled6] ?? '')
    .trim()
    .toLowerCase();
  return list4.includes(next);
}
function resolveImageGenerationBatchSize(current, entry) {
  const record = parseInt(current?.batchSize, 10) || 1,
    modelApiExecutionForPayload2 = resolveModelApiExecutionForPayload(current, entry),
    count = Number.parseInt(modelApiExecutionForPayload2?.extensions?.fixedBatchSize, 10);
  if (Number.isFinite(count) && count >= 1) return count;
  const count2 = Number.parseInt(modelApiExecutionForPayload2?.extensions?.maxBatchSize, 10);
  if (Number.isFinite(count2) && count2 >= 1) return Math.min(record, count2);
  return record;
}
function isRunningHubOpenApiV2AiApp(payload) {
  const handle = String(payload?.model || ''),
    modelExecution2 = resolveModelExecution(handle)?.executionManifest;
  if (
    modelExecution2?.adapterType === 'workflow' &&
    modelExecution2?.submitMode === 'openapi-v2-ai-app' &&
    modelExecution2?.queryMode === 'openapi-v2-query'
  )
    return true;
  return false;
}
function getDreaminaModelVersion(state) {
  const config = String(state?.modelVersion || '').trim();
  if (config) return config;
  const scope = String(state?.model || '').trim();
  if (resolveModelProvider(scope, state?.provider) !== 'dreamina') return '';
  const input = (scope.split('/')[1] || '').trim();
  return /^(4\.0|4\.1|4\.5|5\.0)$/.test(input) ? input : '';
}
function getDreaminaAspectRatio(output, value2) {
  const value3 = String(output?.resolvedRatioLabel || '').trim();
  if (value3) return value3;
  const enabled7 = String(output?.aspectRatio || '').trim();
  if (!enabled7) return '';
  if (enabled7 === '自适应' || enabled7 === 'auto') return value2 ? '' : '1:1';
  return enabled7;
}
function buildDreaminaImageSubmitRequest(value4, prompt) {
  const images = Array.isArray(value4.inputUrls) ? value4.inputUrls.filter(Boolean) : [],
    value5 = images.length > 0,
    dreaminaModelVersion = getDreaminaModelVersion(value4),
    dreaminaAspectRatio = getDreaminaAspectRatio(value4, value5),
    value6 = String(value4.imageSize || '')
      .trim()
      .toLowerCase(),
    body = { prompt: prompt };
  if (dreaminaAspectRatio) body.ratio = dreaminaAspectRatio;
  if (value6) body.resolutionType = value6;
  if (dreaminaModelVersion) body.modelVersion = dreaminaModelVersion;
  if (images.length > 0)
    return {
      url: '/api/v2/dreamina/image2image',
      headers: { 'Content-Type': 'application/json' },
      body: { ...body, images: images },
    };
  return {
    url: '/api/v2/dreamina/text2image',
    headers: { 'Content-Type': 'application/json' },
    body: body,
  };
}
function getImageExecution(value7, providerHint3) {
  return resolveModelExecution(value7?.model, { providerHint: providerHint3 });
}
function createMissingImageManifestError(value8, value9) {
  const value10 = String(value8?.model || '').trim() || '(empty)',
    value11 = String(value9 || '')
      .trim()
      .toLowerCase();
  if (value11 === 'runninghubwf')
    return new Error(
      'RunningHub workflow manifest missing: ' + value10 + '; RunningHUB request requires a manifest',
    );
  if (value11 === 'runninghub') return new Error('RunningHub model API manifest missing: ' + value10);
  const value12 = {
      agnes: 'Agnes AI',
      apimart: 'APIMart',
      grsai: 'GRSAI',
      ppio: 'PPIO',
      volcengine: 'Volcengine',
    },
    value13 = value12[value11];
  if (value13) return new Error(value13 + ' image model API manifest missing: ' + value10);
  return new Error('Image model API manifest missing: ' + value10);
}
function collectDeepMediaUrls(list5, count3 = 0, map = new WeakSet()) {
  if (list5 === undefined || list5 === null || count3 > 8) return [];
  if (typeof list5 === 'string') {
    const value14 = list5.trim();
    return /^https?:\/\//i.test(value14) ? [value14] : [];
  }
  if (Array.isArray(list5)) return list5.flatMap((item4) => collectDeepMediaUrls(item4, count3 + 1, map));
  if (typeof list5 !== 'object') return [];
  if (map.has(list5)) return [];
  map.add(list5);
  const value15 = ['url', 'imageUrl', 'image_url', 'fileUrl', 'file_url', 'downloadUrl', 'download_url'],
    list6 = [];
  for (const value16 of value15) {
    list6.push(...collectDeepMediaUrls(list5[value16], count3 + 1, map));
  }
  const value17 = ['results', 'result', 'images', 'image', 'outputs', 'output', 'data'];
  for (const value18 of value17) {
    list6.push(...collectDeepMediaUrls(list5[value18], count3 + 1, map));
  }
  return Array.from(new Set(list6.filter(Boolean)));
}
function extractImageUrls(response, value19 = null) {
  const list7 = resolveMappedResponseValues(response, value19?.resultPaths);
  if (list7.length > 0) return list7;
  const list8 = [];
  if (response.data?.result?.images && Array.isArray(response.data.result.images))
    list8.push(
      ...response.data.result.images.map((response2) =>
        Array.isArray(response2.url) ? response2.url[0] : response2.url,
      ),
    );
  else {
    if (response.result?.images && Array.isArray(response.result.images))
      list8.push(
        ...response.result.images.map((response3) =>
          Array.isArray(response3.url) ? response3.url[0] : response3.url,
        ),
      );
    else {
      if (response.status === 'succeeded' && response.results)
        list8.push(...response.results.map((response4) => response4.url));
      else {
        if (response.data?.[0]?.url) list8.push(...response.data.map((response5) => response5.url));
        else {
          if (response.data?.[0]?.fileUrl) list8.push(...response.data.map((item5) => item5.fileUrl));
          else {
            if (response.data?.results)
              list8.push(...response.data.results.map((response6) => response6.url));
            else {
              if (response.data?.[0]?.image) list8.push(...response.data.map((item6) => item6.image));
              else {
                if (Array.isArray(response.images))
                  list8.push(
                    ...response.images.map((response7) =>
                      typeof response7 === 'string' ? response7 : response7.url || response7.image_url,
                    ),
                  );
                else {
                  if (Array.isArray(response.image_urls))
                    list8.push(
                      ...response.image_urls.map((response8) =>
                        typeof response8 === 'string' ? response8 : response8.url,
                      ),
                    );
                  else {
                    if (Array.isArray(response.results))
                      list8.push(
                        ...response.results.map(
                          (response9) =>
                            response9.url || response9.imageUrl || response9.image_url || response9.image,
                        ),
                      );
                    else
                      (response.url ||
                        response.image_url ||
                        response.fileUrl ||
                        response.file_url ||
                        response.image) &&
                        list8.push(
                          response.url ||
                            response.image_url ||
                            response.fileUrl ||
                            response.file_url ||
                            response.image,
                        );
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return (
    list8.length === 0 && list8.push(...collectDeepMediaUrls(response)),
    Array.from(new Set(list8.filter(Boolean)))
  );
}
function firstNonEmptyText(...args) {
  for (const error of args) {
    let nonEmptyText = '';
    error && typeof error === 'object'
      ? (nonEmptyText =
          firstNonEmptyText(
            error.message,
            error.errorMessage,
            error.error_message,
            error.reason,
            error.detail,
            error.details,
            error.msg,
          ) ||
          (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return '';
            }
          })())
      : (nonEmptyText = String(error || '').trim());
    if (nonEmptyText) return nonEmptyText;
  }
  return '';
}
function pickImageUrlFromResultItem(enabled8) {
  if (typeof enabled8 === 'string') {
    const value20 = enabled8.trim();
    return /^https?:\/\//i.test(value20) ? value20 : '';
  }
  if (!enabled8 || typeof enabled8 !== 'object') return '';
  for (const value21 of [
    'url',
    'imageUrl',
    'image_url',
    'fileUrl',
    'file_url',
    'downloadUrl',
    'download_url',
    'image',
  ]) {
    const value22 = enabled8[value21],
      value23 = Array.isArray(value22) ? value22[0] : value22,
      value24 = String(value23 || '').trim();
    if (/^https?:\/\//i.test(value24)) return value24;
  }
  return collectDeepMediaUrls(enabled8)[0] || '';
}
function pickImageResultError(error2) {
  if (!error2 || typeof error2 !== 'object') return '';
  const nonEmptyText2 = firstNonEmptyText(
    error2.error,
    error2.errorMessage,
    error2.message,
    error2.failure_reason,
    error2.failReason,
    error2.reason,
    error2.statusReason,
    error2?.data?.error,
    error2?.data?.errorMessage,
    error2?.data?.message,
    error2?.data?.failure_reason,
  );
  if (nonEmptyText2) return nonEmptyText2;
  const value25 = String(error2.status || error2.taskStatus || error2.task_status || error2.state || '')
    .trim()
    .toLowerCase();
  if (
    [
      'failed',
      'fail',
      'error',
      'rejected',
      'blocked',
      'filtered',
      'content_filtered',
      'content-filtered',
      'sensitive',
      'violation',
    ].includes(value25)
  )
    return '生成失败';
  return '';
}
function getArrayAtPath(value26, value27) {
  const value28 = String(value27 || '')
    .split('.')
    .filter(Boolean)
    .reduce((item7, value29) => {
      if (item7 === undefined || item7 === null) return undefined;
      return item7[value29];
    }, value26);
  return Array.isArray(value28) ? value28 : null;
}
function collectImageResultRecordArrays(value30) {
  const list9 = [],
    handler = (value31) => {
      if (!Array.isArray(value31) || list9.includes(value31)) return;
      list9.push(value31);
    };
  for (const value32 of [
    'data.result.images',
    'result.images',
    'results',
    'data.results',
    'data',
    'images',
    'image_urls',
    'outputs',
    'output.images',
    'output.results',
  ]) {
    handler(getArrayAtPath(value30, value32));
  }
  return list9;
}
function normalizeImageResultRecordItem(fullData) {
  const sourceUrl = pickImageUrlFromResultItem(fullData),
    error3 = sourceUrl ? '' : pickImageResultError(fullData);
  if (!sourceUrl && !error3) return null;
  return {
    sourceUrl: sourceUrl,
    error: error3,
    fullData: fullData && typeof fullData === 'object' ? fullData : undefined,
  };
}
function extractImageResultRecords(value33, value34 = null) {
  for (const list10 of collectImageResultRecordArrays(value33)) {
    const list11 = list10.map((item8) => normalizeImageResultRecordItem(item8)).filter(Boolean);
    if (list11.length > 0) return list11;
  }
  const list12 = resolveMappedResponseValues(value33, value34?.resultPaths);
  if (list12.length > 0) return list12.map((sourceUrl2) => ({ sourceUrl: sourceUrl2, error: '' }));
  return extractImageUrls(value33, value34).map((sourceUrl3) => ({ sourceUrl: sourceUrl3, error: '' }));
}
function hasImageResultOutput(value35, value36 = null) {
  return extractImageResultRecords(value35, value36).some((item9) => String(item9?.sourceUrl || '').trim());
}
export async function buildGenerateImageRequest(value37) {
  await ensureConfig();
  const prompt2 = applyCameraAngleToPrompt(value37.prompt, value37.cameraAngle),
    providerId = getProviderId(value37 || {}),
    imageExecution = getImageExecution(value37, providerId),
    value38 = imageExecution?.executionManifest,
    expectedProvider = imageExecution?.modelManifest;
  if (value38?.adapterType === 'localRuntime' && value38?.runtime === 'dreaminaImage')
    return buildDreaminaImageSubmitRequest(value37, prompt2);
  const value39 = {
    getProviderConfig: getProviderConfig,
    processInputImages: processInputImages,
    processInputImagesPreserveOrder: processInputImagesPreserveOrder,
    uploadInputsToVolcengineFiles: uploadInputsToVolcengineFiles,
  };
  if (value38?.adapterType === 'modelApi') {
    const imageRequestFromManifest = await buildImageRequestFromManifest(value37, prompt2, value39, {
      expectedProvider: expectedProvider?.provider || providerId,
    });
    if (imageRequestFromManifest) return imageRequestFromManifest;
    throw new Error(
      (expectedProvider?.provider || providerId) + ' image model API manifest missing: ' + value37.model,
    );
  }
  if (value38?.adapterType === 'workflow')
    return RunningHubAdapter.buildImageRequest(value37, prompt2, value39);
  throw createMissingImageManifestError(value37, providerId);
}
function parseResponseData(value40) {
  const value41 = value40.trim().replace(/^data:\s*/, '');
  try {
    return JSON.parse(value41);
  } catch {
    const list13 = extractSseJsonSnapshots(value40);
    if (list13.length > 0) {
      for (const value42 of list13) {
        if (resolveAsyncImageTaskId(value42)) return value42;
      }
      return list13[list13.length - 1];
    }
    throw new ApiError({ type: 'PARSE_ERROR', message: '无法解析服务端响应', retryable: false });
  }
}
function extractSseJsonSnapshots(value43) {
  const list14 = String(value43 || '')
    .split('\n')
    .filter((item10) => item10.trim().startsWith('data:'));
  if (list14.length === 0) return [];
  const list15 = [];
  for (const value44 of list14) {
    const enabled9 = String(value44 || '')
      .trim()
      .replace(/^data:\s*/, '')
      .trim();
    if (!enabled9 || enabled9 === '[DONE]') continue;
    try {
      list15.push(JSON.parse(enabled9));
    } catch {}
  }
  return list15;
}
function resolveDirectOutputSnapshotFromRawText(value45) {
  const list16 = extractSseJsonSnapshots(value45);
  for (let count4 = list16.length - 1; count4 >= 0; count4 -= 1) {
    const value46 = list16[count4];
    if (hasImageResultOutput(value46)) return value46;
  }
  return null;
}
function extractTaskIdFromRawText(value47) {
  const enabled10 = String(value47 || '');
  if (!enabled10) return '';
  const value48 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"submit_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"submitId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"job_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"jobId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"request_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"requestId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"task"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"job"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"request"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"submit"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"id"\s*:\s*"([^"]+)"/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\bsubmit[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\bjob[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\brequest[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid|job_id|request_id)=([a-zA-Z0-9._:-]+)/i,
    /\bid\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]{8,})["']?/i,
  ];
  for (const value49 of value48) {
    const value50 = enabled10.match(value49),
      value51 = String(value50?.[1] || '').trim();
    if (value51) return value51;
  }
  return '';
}
function extractRunningHubTaskIdFromRawText(value52) {
  const enabled11 = String(value52 || '');
  if (!enabled11) return '';
  const value53 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid)=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const value54 of value53) {
    const value55 = enabled11.match(value54),
      value56 = String(value55?.[1] || '')
        .replace(/,/g, '')
        .trim();
    if (value56) return value56;
  }
  return '';
}
function extractTaskIdFromResponseHeaders(list17) {
  if (!list17 || typeof list17.get !== 'function') return '';
  const value57 = [
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
  for (const value58 of value57) {
    const value59 = String(list17.get(value58) || '').trim();
    if (value59) return value59;
  }
  if (typeof list17.forEach === 'function') {
    let value60 = '';
    list17.forEach((item11, value61) => {
      if (value60) return;
      const list18 = String(value61 || '')
          .trim()
          .toLowerCase(),
        enabled12 = String(item11 || '').trim();
      if (!enabled12) return;
      ((list18.includes('task') && list18.includes('id')) ||
        (list18.includes('job') && list18.includes('id')) ||
        (list18.includes('request') && list18.includes('id')) ||
        (list18.includes('submit') && list18.includes('id'))) &&
        (value60 = enabled12);
    });
    if (value60) return value60;
  }
  return '';
}
function normalizeTaskIdValue(value62) {
  return String(value62 ?? '')
    .replace(/,/g, '')
    .trim();
}
function resolveRunningHubTaskId(value63, value64, value65) {
  const extractRunningHubTaskIdFromRawText2 = extractRunningHubTaskIdFromRawText(value64);
  if (extractRunningHubTaskIdFromRawText2) return extractRunningHubTaskIdFromRawText2;
  const value66 = Array.isArray(value63?.data)
      ? value63.data[0]
      : value63?.data && typeof value63.data === 'object'
        ? value63.data
        : null,
    value67 = Array.isArray(value63?.results)
      ? value63.results[0]
      : value63?.results && typeof value63.results === 'object'
        ? value63.results
        : null,
    value68 = value63?.result && typeof value63.result === 'object' ? value63.result : null,
    value69 = value63?.output && typeof value63.output === 'object' ? value63.output : null,
    value70 = value63?.response && typeof value63.response === 'object' ? value63.response : null,
    value71 = [
      value63?.taskId,
      value63?.task_id,
      value63?.data?.taskId,
      value63?.data?.task_id,
      value66?.taskId,
      value66?.task_id,
      value68?.taskId,
      value68?.task_id,
      value69?.taskId,
      value69?.task_id,
      value70?.taskId,
      value70?.task_id,
      value67?.taskId,
      value67?.task_id,
    ];
  for (const value72 of value71) {
    const taskIdValue = normalizeTaskIdValue(value72);
    if (taskIdValue) return taskIdValue;
  }
  return normalizeTaskIdValue(extractTaskIdFromResponseHeaders(value65));
}
function looksLikeTaskToken(value73) {
  const list19 = String(value73 ?? '').trim();
  if (!list19) return false;
  if (list19.length < 8) return false;
  const value74 = list19.toLowerCase();
  if (
    value74 === 'pending' ||
    value74 === 'running' ||
    value74 === 'success' ||
    value74 === 'failed' ||
    value74 === 'queued' ||
    value74 === 'submitted'
  )
    return false;
  return /^[a-zA-Z0-9._:-]+$/.test(list19);
}
function resolveAsyncImageTaskIdLoose(enabled13) {
  if (!enabled13 || typeof enabled13 !== 'object') return '';
  const value75 = [
    enabled13?.data,
    enabled13?.task,
    enabled13?.job,
    enabled13?.request,
    enabled13?.submit,
    enabled13?.payload?.task,
    enabled13?.payload?.task_id,
    enabled13?.payload?.taskId,
  ];
  for (const value76 of value75) {
    if (typeof value76 === 'string' || typeof value76 === 'number') {
      const value77 = String(value76).trim();
      if (looksLikeTaskToken(value77)) return value77;
    }
  }
  const firstDeepValueByKeyPattern = findFirstDeepValueByKeyPattern(
    enabled13,
    /^(task|job|request|submit|task_?id|job_?id|request_?id|submit_?id)$/i,
  );
  if (looksLikeTaskToken(firstDeepValueByKeyPattern)) return firstDeepValueByKeyPattern;
  return '';
}
function findFirstDeepValueByKeyPattern(value78, value79, value80 = 8) {
  if (!value78 || typeof value78 !== 'object') return '';
  const map2 = new WeakSet(),
    list20 = [{ value: value78, depth: 0 }];
  while (list20.length > 0) {
    const { value: value81, depth: depth } = list20.shift();
    if (!value81 || typeof value81 !== 'object') continue;
    if (map2.has(value81)) continue;
    map2.add(value81);
    if (depth > value80) continue;
    const value82 = Array.isArray(value81)
      ? value81.map((item12, value83) => [String(value83), item12])
      : Object.entries(value81);
    for (const [value84, value85] of value82) {
      const value86 = String(value84 || '')
        .trim()
        .toLowerCase();
      if (value79.test(value86)) {
        const value87 = String(value85 ?? '').trim();
        if (value87) return value87;
      }
      value85 && typeof value85 === 'object' && list20.push({ value: value85, depth: depth + 1 });
    }
  }
  return '';
}
function extractTaskStatusFromRawText(value88) {
  const enabled14 = String(value88 || '');
  if (!enabled14) return '';
  const value89 = [
    /"status"\s*:\s*"([^"]+)"/i,
    /"taskStatus"\s*:\s*"([^"]+)"/i,
    /"task_status"\s*:\s*"([^"]+)"/i,
    /"phase"\s*:\s*"([^"]+)"/i,
    /"state"\s*:\s*"([^"]+)"/i,
    /\bstatus\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
    /\bphase\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
    /\bstate\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
  ];
  for (const value90 of value89) {
    const value91 = enabled14.match(value90),
      value92 = String(value91?.[1] || '').trim();
    if (value92) return value92.toLowerCase();
  }
  return '';
}
function resolveAsyncImageTaskId(value93, value94 = null) {
  const mappedResponseValue = resolveMappedResponseValue(value93, value94?.taskIdPath);
  if (mappedResponseValue) return mappedResponseValue;
  const value95 = Array.isArray(value93?.data)
      ? value93.data[0]
      : value93?.data && typeof value93.data === 'object'
        ? value93.data
        : null,
    value96 = Array.isArray(value93?.results)
      ? value93.results[0]
      : value93?.results && typeof value93.results === 'object'
        ? value93.results
        : null,
    value97 = value93?.result && typeof value93.result === 'object' ? value93.result : null,
    value98 = value93?.output && typeof value93.output === 'object' ? value93.output : null,
    value99 = value93?.response && typeof value93.response === 'object' ? value93.response : null,
    value100 =
      value95?.task_id ||
      value95?.taskId ||
      value95?.id ||
      value97?.task_id ||
      value97?.taskId ||
      value97?.id ||
      value98?.task_id ||
      value98?.taskId ||
      value98?.id ||
      value99?.task_id ||
      value99?.taskId ||
      value99?.id ||
      value93?.task_id ||
      value93?.taskId ||
      value93?.data?.task_id ||
      value93?.data?.taskId ||
      value93?.data?.id ||
      value93?.id ||
      value96?.task_id ||
      value96?.taskId ||
      value96?.id ||
      findFirstDeepValueByKeyPattern(value93, /^(task_?id|taskid|request_?id|requestid)$/i) ||
      findFirstDeepValueByKeyPattern(value93, /^id$/i) ||
      '';
  return String(value100 || '').trim();
}
function resolveApimartTaskIdStrict(value101) {
  const value102 = Array.isArray(value101?.data)
      ? value101.data[0]
      : value101?.data && typeof value101.data === 'object'
        ? value101.data
        : null,
    value103 = Array.isArray(value101?.results)
      ? value101.results[0]
      : value101?.results && typeof value101.results === 'object'
        ? value101.results
        : null,
    value104 = value101?.result && typeof value101.result === 'object' ? value101.result : null,
    value105 = value101?.output && typeof value101.output === 'object' ? value101.output : null,
    value106 = value101?.response && typeof value101.response === 'object' ? value101.response : null,
    value107 =
      value102?.task_id ||
      value102?.taskId ||
      value104?.task_id ||
      value104?.taskId ||
      value105?.task_id ||
      value105?.taskId ||
      value106?.task_id ||
      value106?.taskId ||
      value101?.task_id ||
      value101?.taskId ||
      value101?.data?.task_id ||
      value101?.data?.taskId ||
      value103?.task_id ||
      value103?.taskId ||
      findFirstDeepValueByKeyPattern(value101, /^(task_?id|taskid)$/i) ||
      '';
  return String(value107 || '').trim();
}
function collectApimartFallbackTaskIdCandidates(value108) {
  const list21 = [],
    handler2 = (value109) => {
      const enabled15 = String(value109 || '').trim();
      if (!enabled15 || list21.includes(enabled15)) return;
      list21.push(enabled15);
    },
    value110 = Array.isArray(value108?.data)
      ? value108.data[0]
      : value108?.data && typeof value108.data === 'object'
        ? value108.data
        : null,
    value111 = Array.isArray(value108?.results)
      ? value108.results[0]
      : value108?.results && typeof value108.results === 'object'
        ? value108.results
        : null,
    value112 = value108?.result && typeof value108.result === 'object' ? value108.result : null,
    value113 = value108?.output && typeof value108.output === 'object' ? value108.output : null,
    value114 = value108?.response && typeof value108.response === 'object' ? value108.response : null;
  return (
    handler2(value110?.id),
    handler2(value112?.id),
    handler2(value113?.id),
    handler2(value114?.id),
    handler2(value111?.id),
    handler2(value108?.data?.id),
    handler2(value108?.id),
    list21
  );
}
function extractApimartTaskIdFromRawText(value115) {
  const enabled16 = String(value115 || '');
  if (!enabled16) return '';
  const value116 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)task_id=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const value117 of value116) {
    const value118 = enabled16.match(value117),
      value119 = String(value118?.[1] || '').trim();
    if (value119) return value119;
  }
  return '';
}
function buildApimartTaskStatusUrl(value120, value121 = null, value122 = '') {
  const value123 = String(value120 || '').trim(),
    response10 = buildManifestPollCandidate(value123, value121);
  if (response10?.url) return response10.url;
  const apimartBaseUrl = normalizeApimartBaseUrl(value122);
  return apimartBaseUrl + '/v1/tasks/' + encodeURIComponent(value123) + '?language=zh';
}
async function probeApimartTaskIdCandidate(value124, value125, signal = {}) {
  const enabled17 = String(value124 || '').trim();
  if (!enabled17) return '';
  const providerConfig2 = getProviderConfig('apimart'),
    enabled18 = String(value125?.apiKey || providerConfig2?.apiKey || '').trim();
  if (!enabled18) return '';
  try {
    const requester2 = await requester({
        url:
          '/api/v2/proxy/task?apiUrl=' +
          encodeURIComponent(
            buildApimartTaskStatusUrl(enabled17, signal?.taskPolling, providerConfig2?.apiUrl),
          ),
        method: 'GET',
        headers: { Authorization: 'Bearer ' + enabled18 },
        provider: 'apimart',
        timeout: 30000,
        signal: signal?.signal,
      }),
      args2 = normalizeTaskSnapshotPayload(requester2),
      value126 =
        args2 &&
        typeof args2 === 'object' &&
        args2.data &&
        typeof args2.data === 'object' &&
        !Array.isArray(args2.data),
      value127 = value126
        ? { ...args2, ...args2.data }
        : normalizeTaskSnapshotPayload(requester2?.data || requester2),
      taskError = parseTaskError('apimart', value127);
    if (taskError) return '';
    return enabled17;
  } catch {
    return '';
  }
}
async function resolveApimartTaskIdByProbe(value128, value129, value130 = {}) {
  const apimartFallbackTaskIdCandidates = collectApimartFallbackTaskIdCandidates(value128);
  for (const value131 of apimartFallbackTaskIdCandidates) {
    const probeApimartTaskIdCandidate2 = await probeApimartTaskIdCandidate(value131, value129, value130);
    if (probeApimartTaskIdCandidate2) return probeApimartTaskIdCandidate2;
  }
  return '';
}
function resolveAsyncImageTaskStatus(response11) {
  const response12 = Array.isArray(response11?.data)
      ? response11.data[0]
      : response11?.data && typeof response11.data === 'object'
        ? response11.data
        : null,
    response13 = Array.isArray(response11?.results)
      ? response11.results[0]
      : response11?.results && typeof response11.results === 'object'
        ? response11.results
        : null,
    response14 = response11?.result && typeof response11.result === 'object' ? response11.result : null,
    response15 = response11?.output && typeof response11.output === 'object' ? response11.output : null,
    response16 = response11?.response && typeof response11.response === 'object' ? response11.response : null;
  return String(
    response12?.status ||
      response11?.status ||
      response11?.taskStatus ||
      response11?.task_status ||
      response11?.data?.status ||
      response14?.status ||
      response14?.taskStatus ||
      response14?.task_status ||
      response15?.status ||
      response15?.taskStatus ||
      response15?.task_status ||
      response16?.status ||
      response16?.taskStatus ||
      response16?.task_status ||
      response13?.status ||
      response11?.state ||
      response11?.phase ||
      findFirstDeepValueByKeyPattern(response11, /^(task_?status|taskstatus|status|state|phase)$/i) ||
      '',
  )
    .trim()
    .toLowerCase();
}
function normalizeTaskSnapshotPayload(value132) {
  if (value132 && typeof value132 === 'object') return value132;
  const rawText = String(value132 || '').trim();
  if (!rawText) return {};
  try {
    return parseResponseData(rawText);
  } catch {
    try {
      return JSON.parse(rawText);
    } catch {
      return { rawText: rawText };
    }
  }
}
function isAsyncTaskTerminalStatus(value133) {
  const value134 = String(value133 || '')
    .trim()
    .toLowerCase();
  return [
    'success',
    'succeeded',
    'completed',
    'complete',
    'finished',
    'finish',
    'done',
    'failed',
    'fail',
    'error',
    'cancelled',
    'canceled',
    'idle',
  ].includes(value134);
}
function isAsyncTaskPendingStatus(value135) {
  const value136 = String(value135 || '')
    .trim()
    .toLowerCase();
  return [
    'submitted',
    'pending',
    'queued',
    'waiting',
    'running',
    'processing',
    'querying',
    'in_progress',
  ].includes(value136);
}
function isAsyncTaskFailureStatus(value137) {
  const value138 = String(value137 || '')
    .trim()
    .toLowerCase();
  return ['failed', 'fail', 'error', 'cancelled', 'canceled', 'idle'].includes(value138);
}
function supportsAsyncImageTaskPolling(value139, value140 = {}) {
  const value141 = String(value139 || '')
    .trim()
    .toLowerCase();
  if (['apimart', 'ppio', 'grsai'].includes(value141)) return true;
  const value142 = value140?.taskPolling;
  return !!(value142 && typeof value142 === 'object' && String(value142.urlTemplate || '').trim());
}
function buildManifestPollCandidate(value143, enabled19) {
  if (!enabled19 || typeof enabled19 !== 'object') return null;
  const url = String(enabled19.urlTemplate || '').trim();
  if (!url) return null;
  return {
    method:
      String(enabled19.method || 'GET')
        .trim()
        .toUpperCase() || 'GET',
    mode: String(enabled19.mode || 'task-proxy').trim() || 'task-proxy',
    url: url.replace('{taskId}', encodeURIComponent(value143)),
  };
}
async function pollAsyncImageTask(value144, value145, value146, signal2 = {}) {
  const enabled20 = String(value144 || '').trim();
  if (!enabled20) throw new Error('缺少异步图片任务 ID');
  const provider = String(value146 || '')
      .trim()
      .toLowerCase(),
    providerConfig3 = getProviderConfig(provider),
    apiKey2 = String(value145?.apiKey || providerConfig3?.apiKey || '').trim();
  if (!apiKey2)
    throw ApiError.authError(provider, null, 'API Key 未配置（厂商：' + provider + '），无法轮询任务');
  for (let count5 = 0; count5 < 450; count5++) {
    if (signal2?.signal?.aborted) throw new Error('CANCELLED');
    await new Promise((value147) => setTimeout(value147, 2000));
    if (signal2?.signal?.aborted) throw new Error('CANCELLED');
    const url2 = String(providerConfig3?.apiUrl || '').replace(/\/+$/, ''),
      manifestPollCandidate = buildManifestPollCandidate(enabled20, signal2?.taskPolling),
      value148 =
        provider === 'apimart'
          ? [
              {
                method: 'GET',
                mode: 'task-proxy',
                url: buildApimartTaskStatusUrl(enabled20, null, providerConfig3?.apiUrl),
              },
            ]
          : provider === 'ppio'
            ? [{ method: 'GET', mode: 'task-proxy', url: url2 + '/v1/tasks/' + enabled20 }]
            : [],
      list22 = manifestPollCandidate ? [manifestPollCandidate] : value148;
    if (list22.length === 0) throw new Error('异步图片任务查询配置缺失（厂商：' + provider + '）');
    try {
      let requester3 = null,
        value149 = null;
      for (const apiUrl of list22) {
        try {
          apiUrl.mode === 'image-proxy'
            ? (requester3 = await requester({
                url: '/api/v2/proxy/image',
                method: 'POST',
                provider: provider,
                timeout: 30000,
                signal: signal2?.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiUrl: apiUrl.url, apiKey: apiKey2, ...(apiUrl.body || {}) }),
              }))
            : (requester3 = await requester({
                url: '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(apiUrl.url),
                method: 'GET',
                headers: { Authorization: 'Bearer ' + apiKey2 },
                provider: provider,
                timeout: 30000,
                signal: signal2?.signal,
              }));
          value149 = null;
          break;
        } catch (value150) {
          value149 = value150;
          if (value150 instanceof ApiError) {
            if (
              value150.type === ErrorType.AUTH_ERROR ||
              value150.type === ErrorType.FORBIDDEN ||
              value150.type === ErrorType.INSUFFICIENT_BALANCE ||
              value150.type === ErrorType.MODEL_UNAVAILABLE
            )
              throw value150;
            if (value150.type === ErrorType.INVALID_PARAMS) throw value150;
          }
        }
      }
      if (!requester3) {
        if (value149 instanceof ApiError) throw value149;
        continue;
      }
      const args3 = normalizeTaskSnapshotPayload(requester3),
        value151 =
          args3 &&
          typeof args3 === 'object' &&
          args3.data &&
          typeof args3.data === 'object' &&
          !Array.isArray(args3.data),
        error4 = value151
          ? { ...args3, ...args3.data }
          : normalizeTaskSnapshotPayload(requester3.data || requester3),
        hasImageResultOutput2 = hasImageResultOutput(error4, signal2?.responseMapping);
      if (hasImageResultOutput2) return error4;
      const taskError2 = parseTaskError(provider, error4);
      if (taskError2) throw taskError2;
      const asyncImageTaskStatus = resolveAsyncImageTaskStatus(error4);
      if (['completed', 'succeeded', 'success'].includes(asyncImageTaskStatus)) return error4;
      if (isAsyncTaskPendingStatus(asyncImageTaskStatus)) continue;
      if (isAsyncTaskTerminalStatus(asyncImageTaskStatus)) {
        const value152 = String(error4?.rawText || '');
        throw ApiError.taskFailed(
          provider,
          String(
            error4?.error ||
              error4?.errorMessage ||
              error4?.message ||
              extractTaskStatusFromRawText(value152) ||
              '任务状态异常',
          ),
        );
      }
    } catch (value153) {
      if (value153 instanceof ApiError) {
        if (
          value153.type === ErrorType.TASK_FAILED ||
          value153.type === ErrorType.CONTENT_FILTERED ||
          value153.type === ErrorType.TASK_TIMEOUT ||
          value153.type === ErrorType.AUTH_ERROR ||
          value153.type === ErrorType.FORBIDDEN ||
          value153.type === ErrorType.INVALID_PARAMS ||
          value153.type === ErrorType.INSUFFICIENT_BALANCE
        )
          throw value153;
      }
    }
  }
  throw ApiError.taskTimeout(provider);
}
async function pollRunningHubTask(taskId2, value154, provider2, value155) {
  const isModelApiModel2 = isModelApiModel(value154.model, 'runninghub'),
    url3 = value155?.useOpenapiQuery === true || isModelApiModel2 || isRunningHubOpenApiV2AiApp(value154),
    count6 =
      value155?.pollIntervalMs === undefined ? 2000 : Math.max(0, Number(value155.pollIntervalMs) || 0),
    value156 = Math.max(1, Number(value155?.maxPolls) || 450),
    value157 = value155?.softTimeout === true,
    providerConfig4 = getProviderConfig(isModelApiModel2 ? 'runninghub' : 'runninghubwf'),
    apiKey3 = isModelApiModel2
      ? providerConfig4.modelApiKey || value154.apiKey
      : providerConfig4.apiKey || value154.apiKey;
  for (let value158 = 0; value158 < value156; value158++) {
    if (value155?.signal?.aborted) throw new Error('CANCELLED');
    count6 > 0 && (await new Promise((value159) => setTimeout(value159, count6)));
    if (value155?.signal?.aborted) throw new Error('CANCELLED');
    try {
      const requester4 = await requester({
          url: url3 ? '/api/v2/proxy/image' : '/api/v2/runninghubwf/query',
          method: 'POST',
          provider: provider2,
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            url3
              ? { apiUrl: 'https://www.runninghub.cn/openapi/v2/query', apiKey: apiKey3, taskId: taskId2 }
              : { apiKey: apiKey3, taskId: taskId2 },
          ),
        }),
        count7 = typeof requester4?.code === 'number' ? requester4.code : null;
      if (count7 === 804 || count7 === 813) continue;
      if (count7 !== null && count7 !== 0) throw parseError(provider2, requester4, 200);
      if (url3 && hasImageResultOutput(requester4, value155?.responseMapping)) return requester4;
      if (count7 === 0 && Array.isArray(requester4.data)) {
        const list23 = requester4.data.filter((item13) => item13 && typeof item13 === 'object');
        if (list23.length === 0) continue;
        const value160 = list23.some((item14) => hasImageResultOutput(item14, value155?.responseMapping));
        if (value160) return requester4;
        for (const value161 of list23) {
          const taskError3 = parseTaskError(provider2, value161);
          if (taskError3) throw taskError3;
        }
        const list24 = list23
            .map((response17) =>
              String(response17?.status || response17?.taskStatus || response17?.task_status || '')
                .trim()
                .toUpperCase(),
            )
            .filter(Boolean),
          error5 = list23.find((response18) =>
            ['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(
              String(response18?.status || response18?.taskStatus || response18?.task_status || '')
                .trim()
                .toUpperCase(),
            ),
          );
        if (error5)
          throw ApiError.taskFailed(
            provider2,
            String(error5?.errorMessage || error5?.error || error5?.message || '任务执行失败'),
          );
        if (list24.some((item15) => ['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(item15))) continue;
        if (
          list24.some((item16) =>
            ['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED', 'PROCESSING'].includes(item16),
          )
        )
          continue;
      }
      const error6 =
          requester4.data && Object.keys(requester4.data).length > 0 ? requester4.data : requester4,
        hasImageResultOutput3 = hasImageResultOutput(error6, value155?.responseMapping);
      if (hasImageResultOutput3) return error6;
      const taskError4 = parseTaskError(provider2, error6);
      if (taskError4) throw taskError4;
      const value162 = (error6.status || '').toUpperCase();
      if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(value162))
        throw ApiError.taskFailed(
          provider2,
          String(error6?.errorMessage || error6?.error || error6?.message || '任务执行失败'),
        );
      if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(value162)) {
        if (!hasImageResultOutput(error6, value155?.responseMapping)) continue;
        return error6;
      }
      if (['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED', 'PROCESSING'].includes(value162)) continue;
    } catch (value163) {
      if (value163 instanceof ApiError) {
        if (value163.type === ErrorType.TIMEOUT) continue;
        if (
          value163.type === ErrorType.TASK_FAILED ||
          value163.type === ErrorType.TASK_TIMEOUT ||
          value163.type === ErrorType.AUTH_ERROR ||
          value163.type === ErrorType.FORBIDDEN ||
          value163.type === ErrorType.INVALID_PARAMS ||
          value163.type === ErrorType.CONTENT_FILTERED ||
          value163.type === ErrorType.INSUFFICIENT_BALANCE ||
          (value163.provider === 'runninghub' && value163.code !== null && value163.code !== undefined)
        )
          throw value163;
      }
    }
  }
  if (value157)
    return {
      pending: true,
      taskId: String(taskId2 || '').trim(),
      status: 'running',
      message: '任务仍在 RunningHub 生成中',
    };
  throw ApiError.taskTimeout(provider2);
}
async function doGenerateOnce(value164, provider3, enabled21) {
  const taskPolling2 = await buildGenerateImageRequest(value164),
    responseMapping2 = taskPolling2?.responseMapping || null,
    args4 = {
      ...(enabled21 || {}),
      ...(responseMapping2 ? { responseMapping: responseMapping2 } : {}),
      ...(taskPolling2?.taskPolling ? { taskPolling: taskPolling2.taskPolling } : {}),
    },
    enabled22 = provider3 === 'runninghubwf' || provider3 === 'runninghub',
    list25 = String(taskPolling2?.body?.apiUrl || ''),
    useOpenapiQuery =
      enabled21?.useOpenapiQuery === true ||
      taskPolling2?.useOpenapiQuery === true ||
      (provider3 === 'runninghubwf' &&
        taskPolling2?.url === '/api/v2/proxy/image' &&
        (typeof taskPolling2?.pollUrlBuilder === 'function' || list25.includes('/openapi/v2/run/ai-app/'))) ||
      isModelApiModel(value164?.model, provider3) ||
      isRunningHubOpenApiV2AiApp(value164),
    signal3 = !!enabled21?.signal && provider3 !== 'runninghubwf',
    value165 = String(
      value164?.installId || globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '',
    ).trim(),
    headers = {
      ...(taskPolling2.headers || { 'Content-Type': 'application/json' }),
      ...(value165 ? { 'X-AIC-Install-Id': value165 } : {}),
    },
    value166 = taskPolling2.body;
  let value167,
    list26 = null;
  try {
    const response19 = await requester({
      url: taskPolling2.url,
      method: 'POST',
      provider: provider3,
      timeout: GENERATION_TIMEOUT,
      retries: GENERATION_RETRIES,
      retryDelay: GENERATION_RETRY_DELAY,
      signal: signal3 ? enabled21?.signal : undefined,
      headers: headers,
      body: JSON.stringify(value166),
      responseType: 'text',
      returnMeta: true,
    });
    ((value167 = String(response19?.data ?? '')), (list26 = response19?.headers || null));
  } catch (value168) {
    if (value168 instanceof ApiError) throw value168;
    throw parseNetworkError(provider3, value168, GENERATION_TIMEOUT);
  }
  let parsedKeys = {},
    value169 = null;
  try {
    parsedKeys = parseResponseData(value167);
  } catch (value170) {
    ((value169 = value170), (parsedKeys = {}));
  }
  if (provider3 === 'runninghubwf') {
    const count8 = typeof parsedKeys?.code === 'number' ? parsedKeys.code : null;
    if (count8 !== null && count8 !== 0) throw parseError(provider3, parsedKeys, 200);
    const taskId3 = resolveRunningHubTaskId(parsedKeys, value167, list26);
    if (taskId3) {
      const taskKey = provider3 + ':image:' + taskId3;
      (enabled21?.onTaskMeta?.({ taskId: taskId3, useOpenapiQuery: useOpenapiQuery }),
        enabled21?.onTaskId?.(taskId3));
      const pollRunningHubTask2 = await pollRunningHubTask(taskId3, value164, provider3, {
        ...args4,
        useOpenapiQuery: useOpenapiQuery,
      });
      return processTaskResult(pollRunningHubTask2, provider3, { ...args4, taskKey: taskKey });
    }
  }
  let taskId4 =
      provider3 === 'apimart'
        ? resolveApimartTaskIdStrict(parsedKeys)
        : resolveAsyncImageTaskId(parsedKeys, responseMapping2),
    asyncTaskStatus = resolveAsyncImageTaskStatus(parsedKeys);
  !taskId4 && provider3 !== 'apimart' && (taskId4 = resolveAsyncImageTaskIdLoose(parsedKeys));
  !taskId4 &&
    (taskId4 =
      provider3 === 'apimart'
        ? extractApimartTaskIdFromRawText(value167)
        : extractTaskIdFromRawText(value167));
  if (taskId4 && provider3 === 'apimart') {
    const probeApimartTaskIdCandidate3 = await probeApimartTaskIdCandidate(taskId4, value164, args4);
    if (!probeApimartTaskIdCandidate3) taskId4 = '';
  }
  !taskId4 &&
    provider3 === 'apimart' &&
    (taskId4 = await resolveApimartTaskIdByProbe(parsedKeys, value164, args4));
  !taskId4 && provider3 !== 'apimart' && (taskId4 = extractTaskIdFromResponseHeaders(list26));
  !asyncTaskStatus && (asyncTaskStatus = extractTaskStatusFromRawText(value167));
  const extractImageUrls2 = extractImageUrls(parsedKeys, responseMapping2).length > 0;
  if (
    extractImageUrls2 &&
    (provider3 === 'grsai' || provider3 === 'volcengine') &&
    !isAsyncTaskFailureStatus(asyncTaskStatus)
  )
    return processTaskResult(parsedKeys, provider3, args4);
  if (!extractImageUrls2 && provider3 === 'grsai') {
    const directOutputSnapshotFromRawText = resolveDirectOutputSnapshotFromRawText(value167);
    if (directOutputSnapshotFromRawText)
      return processTaskResult(directOutputSnapshotFromRawText, provider3, args4);
  }
  taskId4 && !supportsAsyncImageTaskPolling(provider3, args4) && (taskId4 = '');
  if (!enabled22 && taskId4 && !isAsyncTaskFailureStatus(asyncTaskStatus)) {
    (enabled21?.onTaskMeta?.({ taskId: taskId4, provider: provider3, kind: 'image' }),
      enabled21?.onTaskId?.(taskId4));
    if (
      extractImageUrls2 &&
      ['success', 'succeeded', 'completed', 'complete', 'done'].includes(
        String(asyncTaskStatus || '').toLowerCase(),
      )
    )
      return processTaskResult(parsedKeys, provider3, args4);
    const pollAsyncImageTask2 = await pollAsyncImageTask(taskId4, value164, provider3, args4);
    return processTaskResult(pollAsyncImageTask2, provider3, args4);
  }
  if (
    !enabled22 &&
    (provider3 === 'ppio' || provider3 === 'grsai') &&
    (!taskId4 || isAsyncTaskPendingStatus(asyncTaskStatus))
  ) {
    const previewText = String(value167 || '').slice(0, 400);
    let headerSnapshot = {};
    if (list26 && typeof list26.forEach === 'function') {
      const value171 = {};
      (list26.forEach((item17, value172) => {
        const list27 = String(value172 || '').toLowerCase();
        (list27.includes('task') ||
          list27.includes('job') ||
          list27.includes('request') ||
          list27.includes('submit')) &&
          (value171[value172] = String(item17 || ''));
      }),
        (headerSnapshot = value171));
    }
    console.warn('[aiImageApi] async submit missing taskId', {
      providerId: provider3,
      asyncTaskStatus: asyncTaskStatus,
      previewText: previewText,
      headerSnapshot: headerSnapshot,
      parsedKeys:
        parsedKeys && typeof parsedKeys === 'object' && !Array.isArray(parsedKeys)
          ? Object.keys(parsedKeys).slice(0, 20)
          : [],
    });
  }
  if (value169 && !enabled22) throw value169;
  const enabled23 = String(parsedKeys.status || parsedKeys?.data?.status || '').toUpperCase(),
    runningHubTaskId = resolveRunningHubTaskId(parsedKeys, value167, list26);
  if (
    enabled22 &&
    runningHubTaskId &&
    (!enabled23 || ['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED'].includes(enabled23))
  ) {
    const taskId5 = runningHubTaskId,
      taskKey2 = provider3 + ':image:' + taskId5;
    (enabled21?.onTaskMeta?.({ taskId: taskId5, useOpenapiQuery: useOpenapiQuery }),
      enabled21?.onTaskId?.(taskId5));
    const pollRunningHubTask3 = await pollRunningHubTask(taskId5, value164, provider3, {
      ...args4,
      useOpenapiQuery: useOpenapiQuery,
    });
    return processTaskResult(pollRunningHubTask3, provider3, { ...args4, taskKey: taskKey2 });
  }
  return processTaskResult(parsedKeys, provider3, args4);
}
export async function resumeDreaminaImageTask(value173, value174 = {}, args5 = {}) {
  const providerId2 = getProviderId(value174 || {});
  if (providerId2 !== 'dreamina') throw new Error('仅支持恢复 Dreamina 图片任务');
  const submitId = String(value173 || '').trim();
  if (!submitId) throw new Error('缺少 Dreamina 提交ID，无法恢复');
  const pollDreaminaUntilDone2 = await pollDreaminaUntilDone(submitId, { ...args5, taskKind: 'image' }),
    dreaminaTaskSnapshot = normalizeDreaminaTaskSnapshot(pollDreaminaUntilDone2, { submitId: submitId });
  if (dreaminaTaskSnapshot?.phase === 'failed')
    throw new Error(dreaminaTaskSnapshot.failReason || '即梦图片任务恢复失败');
  const list28 = Array.isArray(dreaminaTaskSnapshot?.outputs) ? dreaminaTaskSnapshot.outputs : [];
  if (list28.length === 0) throw new Error('即梦图片任务恢复失败：无可用输出');
  const images2 = list28.map((sourceUrl4) => {
    const thumbUrl = sourceUrl4.localUrl || sourceUrl4.url;
    return {
      sourceId: null,
      thumbId: null,
      sourceUrl: sourceUrl4.url || thumbUrl,
      thumbUrl: thumbUrl,
      imageUrl: thumbUrl,
      localPath: sourceUrl4.localPath || '',
    };
  });
  return images2.length === 1 ? images2[0] : { isBatch: true, images: images2 };
}
export async function resumeAsyncImageTask(value175, value176 = {}, value177 = {}) {
  await ensureConfig();
  const provider4 = getProviderId(value176 || {});
  if (provider4 === 'runninghubwf' || provider4 === 'runninghub' || provider4 === 'dreamina')
    throw new Error('仅支持恢复 APIMart/PPIO/GRSAI 等异步图片任务');
  const taskId6 = String(value175 || '').trim();
  if (!taskId6) throw new Error('缺少异步图片任务ID，无法恢复');
  return runTaskSingleFlight({ provider: provider4, kind: 'image', taskId: taskId6 }, async () => {
    const responseMapping3 = resolveImageTaskRuntimeOptions(value176 || {}, provider4, value177),
      pollAsyncImageTask3 = await pollAsyncImageTask(taskId6, value176 || {}, provider4, responseMapping3),
      images3 = await processTaskResult(pollAsyncImageTask3, provider4, {
        taskKey: provider4 + ':image:' + taskId6,
        ...(responseMapping3?.responseMapping ? { responseMapping: responseMapping3.responseMapping } : {}),
      });
    if (images3.length === 1 && images3[0]?.error) throw new Error(images3[0].error || '图片任务恢复失败');
    return images3.length === 1 ? images3[0] : { isBatch: true, images: images3 };
  });
}
export async function resumeRunningHubImageTask(value178, value179, args6 = {}) {
  const provider5 = getProviderId(value179 || {});
  if (provider5 !== 'runninghubwf' && provider5 !== 'runninghub')
    throw new Error('仅支持恢复 RunningHub 图片任务');
  const taskId7 = String(value178 || '').trim();
  if (!taskId7) throw new Error('缺少 RunningHub 任务ID，无法恢复');
  const useOpenapiQuery2 =
    args6?.useOpenapiQuery === true ||
    isModelApiModel(value179?.model, provider5) ||
    isRunningHubOpenApiV2AiApp(value179);
  return runTaskSingleFlight({ provider: provider5, kind: 'image', taskId: taskId7 }, async () => {
    const pollRunningHubTask4 = await pollRunningHubTask(taskId7, value179 || {}, provider5, {
      ...args6,
      useOpenapiQuery: useOpenapiQuery2,
    });
    if (pollRunningHubTask4?.pending) return pollRunningHubTask4;
    const images4 = await processTaskResult(pollRunningHubTask4, provider5, {
      taskKey: provider5 + ':image:' + taskId7,
    });
    if (images4.length === 1 && images4[0]?.error) throw new Error(images4[0].error || '图片任务恢复失败');
    return images4.length === 1 ? images4[0] : { isBatch: true, images: images4 };
  });
}
async function processTaskResult(fullData2, provider6, value180 = {}) {
  const list29 = extractImageResultRecords(fullData2, value180?.responseMapping),
    enabled24 = list29.some((item18) => String(item18?.sourceUrl || '').trim()),
    value181 = list29.some((item19) => String(item19?.error || '').trim());
  if (!enabled24) {
    if (value181) return await processImageResultRecords(list29, value180);
    const error7 = parseError(provider6, fullData2, 200);
    if (error7) return [{ error: error7.getUserMessage(), fullData: fullData2 }];
    const error8 = parseTaskError(provider6, fullData2);
    if (error8) return [{ error: error8.getUserMessage(), fullData: fullData2 }];
    const error9 = fullData2.error || fullData2.errorMessage || fullData2.message || fullData2.failure_reason;
    if (error9) return [{ error: error9, fullData: fullData2 }];
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: provider6,
      message: '无法从服务器响应中提取图片地址',
      raw: fullData2,
      retryable: false,
    });
  }
  return await processImageResultRecords(list29, value180);
}
async function processImages(value182, value183 = {}) {
  return await processImageResultRecords(
    (Array.isArray(value182) ? value182 : []).map((sourceUrl5) => ({ sourceUrl: sourceUrl5, error: '' })),
    value183,
  );
}
async function processImageResultRecords(value184, taskKey3 = {}) {
  const list30 = [],
    value185 = window.currentProjectId || 'default_v2_project';
  for (const fullData3 of Array.isArray(value184) ? value184 : []) {
    const sourceUrl6 = String(fullData3?.sourceUrl || '').trim(),
      error10 = String(fullData3?.error || '').trim();
    if (!sourceUrl6) {
      error10 &&
        list30.push({
          sourceUrl: '',
          thumbUrl: '',
          imageUrl: '',
          localPath: '',
          error: error10,
          ...(fullData3?.fullData !== undefined ? { fullData: fullData3.fullData } : {}),
        });
      continue;
    }
    try {
      const { saveRemoteImageLocallyDetailed: saveRemoteImageLocallyDetailed } =
          await import('../src/modules/project.js'),
        value186 = await saveRemoteImageLocallyDetailed(sourceUrl6, value185, {
          taskKey: taskKey3?.taskKey,
          dedupeKey: taskKey3?.taskKey ? taskKey3.taskKey + ':' + sourceUrl6 : undefined,
        }),
        localPath = pickResultLocalPath(value186),
        value187 = String(value186?.localUrl || '').trim() || localPathToUrl(localPath);
      list30.push({
        sourceId: null,
        thumbId: null,
        sourceUrl: sourceUrl6,
        thumbUrl:
          String(value186?.thumbUrl || '').trim() || String(value186?.displayUrl || '').trim() || value187,
        imageUrl: String(value186?.displayUrl || '').trim() || value187,
        localPath: localPath,
        originalLocalPath: normalizeLocalPath(value186?.originalLocalPath || value186?.localPath),
        displayLocalPath: normalizeLocalPath(value186?.displayLocalPath),
        thumbLocalPath: normalizeLocalPath(value186?.thumbLocalPath),
        originalWidth: Number(value186?.originalWidth || 0) || undefined,
        originalHeight: Number(value186?.originalHeight || 0) || undefined,
      });
    } catch (value188) {
      list30.push({
        sourceUrl: sourceUrl6,
        thumbUrl: '',
        imageUrl: '',
        localPath: '',
        error: '保存到本地失败，请重试生成',
      });
    }
  }
  return list30;
}
export async function generateImage(value189, value190) {
  const providerId3 = getProviderId(value189),
    imageExecution2 = getImageExecution(value189, providerId3)?.executionManifest,
    imageGenerationBatchSize = resolveImageGenerationBatchSize(value189, providerId3),
    shouldSubmitProviderBatchOnce2 = shouldSubmitProviderBatchOnce(
      value189,
      providerId3,
      imageGenerationBatchSize,
    );
  if (imageExecution2?.adapterType === 'localRuntime' && imageExecution2?.runtime === 'dreaminaImage') {
    if (imageGenerationBatchSize <= 1) {
      const images5 = await runDreaminaImageGeneration(value189, value190);
      return images5.length === 1 ? images5[0] : { isBatch: true, images: images5 };
    }
    const images6 = [];
    for (let value191 = 0; value191 < imageGenerationBatchSize; value191++) {
      try {
        const args7 = await runDreaminaImageGeneration(value189, value190);
        images6.push(...args7);
      } catch (error11) {
        images6.push({
          error: error11?.message || '即梦图片生成失败',
          status: 'failed',
          retryable: false,
        });
      }
    }
    if (images6.length === 1) return images6[0];
    return { isBatch: true, images: images6 };
  }
  if (imageGenerationBatchSize <= 1 || shouldSubmitProviderBatchOnce2)
    try {
      const doGenerateOnce2 = await doGenerateOnce(value189, providerId3, value190),
        images7 = Array.isArray(doGenerateOnce2) ? doGenerateOnce2 : [doGenerateOnce2];
      if (images7.length === 1 && images7[0].error) throw new Error(images7[0].error);
      return images7.length === 1 ? images7[0] : { isBatch: true, images: images7 };
    } catch (value192) {
      if (value192 instanceof ApiError) throw new Error(value192.getUserMessage());
      throw value192;
    }
  const images8 = [];
  for (let value193 = 0; value193 < imageGenerationBatchSize; value193++) {
    try {
      const args8 = await doGenerateOnce(value189, providerId3, value190);
      images8.push(...args8);
    } catch (error12) {
      error12 instanceof ApiError
        ? images8.push({
            error: error12.getUserMessage(),
            status: 'failed',
            retryable: error12.retryable,
          })
        : images8.push({ error: error12.message || '未知错误', status: 'failed', retryable: false });
    }
  }
  if (images8.length === 0) throw new Error('批量生成全部失败');
  if (images8.length === 1) return images8[0];
  return { isBatch: true, images: images8 };
}

const MAX_MANIFEST_GENERATION_TIMEOUT = 60 * 60 * 1000;

const APIMART_MIDJOURNEY_MODEL_ID = 'apimart/midjourney';
const APIMART_MIDJOURNEY_UPSCALE_RESPONSE_MAPPING = Object['freeze']({
  taskIdPath: Object['freeze'](['data[].task_id', 'task_id', 'taskId']),
  statusPath: 'status',
  errorPath: 'error',
  resultPaths: Object['freeze']([
    'image_urls[]',
    'image_url',
    'grid_image_url',
    'data.image_urls[]',
    'data.image_url',
    'data.grid_image_url',
    'data.result.images[].url',
    'result.images[].url',
    'data[].url',
    'results[].url',
    'results[].imageUrl',
    'url',
  ]),
});

function resolveGenerationRequestTimeout(value194) {
  const count9 = Number(value194?.['requestTimeoutMs']);
  if (!Number['isFinite'](count9) || count9 <= 0) return GENERATION_TIMEOUT;
  return Math['min'](MAX_MANIFEST_GENERATION_TIMEOUT, Math['max'](30000, Math['trunc'](count9)));
}

function buildApimartMidjourneyTaskPolling(value195 = '') {
  const apimartBaseUrl2 = normalizeApimartBaseUrl(value195);
  return {
    mode: 'task-proxy',
    method: 'GET',
    urlTemplate: apimartBaseUrl2 + '/v1/midjourney/{taskId}',
    headersMode: 'bearer',
  };
}

function createImageBatchAttemptContext(value196) {
  const count10 = Number['parseInt'](value196, 10);
  if (!Number['isFinite'](count10) || count10 <= 1) return null;
  return { __aicBatchSize: count10, __aicBatchSeedNonce: Math['floor'](Math['random']() * 1000000000) };
}

function buildImageBatchAttemptPayload(args9, args10, value197) {
  if (!args10) return args9;
  return { ...args9, ...args10, __aicBatchIndex: value197 };
}

function normalizeDreaminaImageGenerateNum(options2 = {}) {
  const value198 = options2?.['generateNum'] ?? options2?.['generate_num'] ?? options2?.['batchSize'] ?? 1,
    value199 = Number['parseInt'](value198, 10);
  if (!Number['isFinite'](value199)) return 1;
  return Math['max'](1, Math['min'](10, value199));
}

function buildDreaminaImageUpscaleSubmitRequest(value200) {
  return {
    url: '/api/v2/dreamina/image_upscale',
    headers: { 'Content-Type': 'application/json' },
    body: buildDreaminaImageUpscaleSubmitPayload(value200),
  };
}

const LOCAL_IMAGE_RUNTIME_HANDLERS = Object['freeze']({
  dreaminaImage: Object['freeze']({
    buildSubmitRequest: ({
      payload: payload2,
      finalPrompt: finalPrompt,
      executionManifest: executionManifest,
    }) => buildDreaminaImageSubmitRequest(payload2, finalPrompt, executionManifest),
    run: ({
      payload: payload3,
      options: options3,
      batchSize: batchSize,
      executionManifest: executionManifest2,
    }) => {
      const dreaminaImageGenerateNum = normalizeDreaminaImageGenerateNum({
          ...payload3,
          batchSize: batchSize,
        }),
        args11 = getDreaminaModelVersion(payload3, executionManifest2);
      return runDreaminaImageGeneration(
        { ...payload3, ...(args11 ? { modelVersion: args11 } : {}), generateNum: dreaminaImageGenerateNum },
        options3,
      );
    },
  }),
  dreaminaImageUpscale: Object['freeze']({
    buildSubmitRequest: ({ payload: payload4 }) => buildDreaminaImageUpscaleSubmitRequest(payload4),
    run: ({ payload: payload5, options: options4 }) => runDreaminaImageUpscaleGeneration(payload5, options4),
  }),
  openAiCliImage: Object['freeze']({
    buildSubmitRequest: ({
      payload: payload6,
      finalPrompt: finalPrompt2,
      executionManifest: executionManifest3,
    }) => buildOpenAiCliImageSubmitRequest(payload6, finalPrompt2, executionManifest3),
    run: ({ payload: payload7, executionManifest: executionManifest4 }) =>
      runOpenAiCliImageGeneration(payload7, executionManifest4),
  }),
});

function getLocalImageRuntimeHandler(value201) {
  if (value201?.['adapterType'] !== 'localRuntime') return null;
  const value202 = String(value201?.['runtime'] || '')['trim']();
  return LOCAL_IMAGE_RUNTIME_HANDLERS[value202] || null;
}

function cloneRecordMetadata(args12) {
  return args12?.['metadata'] && typeof args12['metadata'] === 'object' ? { ...args12['metadata'] } : {};
}

function firstApimartMidjourneySourceValue(...args13) {
  for (const value203 of args13) {
    if (value203 === true || value203 === false) return value203;
    const value204 = String(value203 ?? '')['trim']();
    if (value204) return value204;
  }
  return '';
}

function normalizeApimartMidjourneySourceBoolean(value205) {
  if (value205 === true || value205 === false) return value205;
  const enabled25 = String(value205 ?? '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled25) return false;
  return enabled25 === 'true' || enabled25 === '1' || enabled25 === 'yes';
}

function resolveApimartMidjourneySourceMetadata(options5 = {}) {
  const value206 =
      options5?.['generationParams'] &&
      typeof options5['generationParams'] === 'object' &&
      !Array['isArray'](options5['generationParams'])
        ? options5['generationParams']
        : {},
    args14 = String(
      firstApimartMidjourneySourceValue(
        options5?.['mjModel'],
        options5?.['midjourneyModel'],
        options5?.['version'],
        value206['mjModel'],
        value206['midjourneyModel'],
        value206['version'],
      ),
    )['trim'](),
    args15 = String(firstApimartMidjourneySourceValue(options5?.['speed'], value206['speed']))
      ['trim']()
      ['toLowerCase'](),
    args16 = String(firstApimartMidjourneySourceValue(options5?.['prompt'], value206['prompt']))['trim'](),
    args17 = String(
      firstApimartMidjourneySourceValue(
        options5?.['action'],
        options5?.['mjAction'],
        value206['action'],
        value206['mjAction'],
      ),
    )
      ['trim']()
      ['toUpperCase'](),
    apimartMidjourneySourceValue = firstApimartMidjourneySourceValue(
      options5?.['hd'],
      options5?.['isHd'],
      value206['hd'],
      value206['isHd'],
    ),
    value207 = {
      ...(args14 ? { mjModel: args14 } : {}),
      ...(args15 === 'relax' || args15 === 'fast' || args15 === 'turbo' ? { speed: args15 } : {}),
      ...(args16 ? { prompt: args16 } : {}),
      ...(args17 ? { action: args17 } : {}),
    };
  return (
    apimartMidjourneySourceValue !== '' &&
      (value207['hd'] = normalizeApimartMidjourneySourceBoolean(apimartMidjourneySourceValue)),
    value207
  );
}

function isApimartMidjourneyResponseMapping(value208 = null) {
  const list31 = Array['isArray'](value208?.['resultPaths']) ? value208['resultPaths'] : [];
  return list31['includes']('image_urls[]') && list31['includes']('grid_image_url');
}

function normalizeApimartMidjourneyButtons(value209) {
  if (!Array['isArray'](value209)) return [];
  return value209['map']((response20) => {
    if (!response20 || typeof response20 !== 'object') return null;
    const args18 = String(
        response20['customId'] || response20['custom_id'] || response20['customID'] || response20['id'] || '',
      )['trim'](),
      args19 = String(
        response20['label'] || response20['name'] || response20['text'] || response20['emoji'] || '',
      )['trim'](),
      value210 = { ...(args18 ? { customId: args18 } : {}), ...(args19 ? { label: args19 } : {}) };
    return Object['keys'](value210)['length'] > 0 ? value210 : null;
  })['filter'](Boolean);
}

function extractApimartMidjourneyImageRecords(args20, value211 = null, value212 = {}) {
  if (!isApimartMidjourneyResponseMapping(value211)) return [];
  const value213 =
      args20?.['data'] && typeof args20['data'] === 'object' && !Array['isArray'](args20['data'])
        ? { ...args20, ...args20['data'] }
        : args20,
    list32 =
      Array['isArray'](value213?.['image_urls']) && value213['image_urls']['length'] > 0
        ? value213['image_urls']
        : String(value213?.['image_url'] || '')['trim']()
          ? [value213['image_url']]
          : [];
  if (list32['length'] === 0) return [];
  const value214 = String(
      resolveApimartTaskIdStrict(value213) ||
        resolveAsyncImageTaskId(value213, value211) ||
        value213?.['id'] ||
        '',
    )['trim'](),
    args21 = String(value213?.['grid_image_url'] || '')['trim'](),
    value215 = String(value213?.['action'] || '')['trim'](),
    args22 = normalizeApimartMidjourneyButtons(value213?.['buttons']),
    args23 = resolveApimartMidjourneySourceMetadata(value212),
    args24 = value215 || args23['action'] || '';
  return list32['map']((value216, value217) => {
    const enabled26 = String(value216 || '')['trim']();
    if (!enabled26) return null;
    return {
      sourceUrl: enabled26,
      error: '',
      metadata: {
        provider: 'apimart',
        model: APIMART_MIDJOURNEY_MODEL_ID,
        apimartMidjourney: {
          taskId: value214,
          index: value217 + 1,
          ...args23,
          ...(args21 ? { gridImageUrl: args21 } : {}),
          ...(args24 ? { action: args24 } : {}),
          ...(args22['length'] > 0 ? { buttons: args22 } : {}),
        },
      },
    };
  })['filter'](Boolean);
}

function isComfyUiHistoryPolling(options6 = {}) {
  return String(options6?.['mode'] || '')['trim']() === 'comfyui-history';
}

async function pollComfyUiImageTask(value218, value219 = {}) {
  const value220 = String(value218 || '')['trim'](),
    args25 = value219?.['taskPolling'] || {},
    args26 = String(args25['baseUrl'] || '')['trim']();
  for (let count11 = 0; count11 < 450; count11++) {
    if (value219?.['signal']?.['aborted']) throw new Error('CANCELLED');
    await new Promise((value221) => setTimeout(value221, 2000));
    if (value219?.['signal']?.['aborted']) throw new Error('CANCELLED');
    const uRLSearchParams = new URLSearchParams({
        promptId: value220,
        ...(args26 ? { baseUrl: args26 } : {}),
        ...(args25['allowCloudBaseUrl'] ? { allowCloudBaseUrl: '1' } : {}),
      }),
      requester5 = await requester({
        url: '/api/v2/comfyui/history?' + uRLSearchParams['toString'](),
        method: 'GET',
        provider: 'comfyui',
        timeout: 30000,
        signal: value219?.['signal'],
      }),
      value222 =
        typeof value219?.['resultExtractor'] === 'function'
          ? value219['resultExtractor'](requester5)
          : requester5,
      hasImageResultOutput4 = hasImageResultOutput(value222, value219?.['responseMapping']);
    if (hasImageResultOutput4) return value222;
    const asyncImageTaskStatus2 = resolveAsyncImageTaskStatus(value222);
    if (isAsyncTaskFailureStatus(asyncImageTaskStatus2))
      throw ApiError['taskFailed'](
        'comfyui',
        String(value222?.['error'] || value222?.['message'] || 'ComfyUI 任务执行失败'),
      );
  }
  throw ApiError['taskTimeout']('comfyui');
}

function resolveRunningHubImageTaskProviderKey(value223, value224 = {}) {
  if (value223 === 'runninghubwf') {
    const runningHubTaskProviderProfileId = getRunningHubTaskProviderProfileId(value224);
    if (runningHubTaskProviderProfileId)
      return normalizeRunningHubModelApiProfileId(runningHubTaskProviderProfileId);
  }
  if (value223 === 'runninghub' && isModelApiModel(value224?.['model'], 'runninghub'))
    return resolveRunningHubModelApiProfileId(
      resolveModelExecution(value224?.['model'], { providerHint: 'runninghub' })?.['modelManifest']?.[
        'modelId'
      ] || value224?.['model'],
      getRunningHubTaskProviderProfileId(value224),
    );
  return value223;
}

function buildRunningHubImageTaskKey(value225, value226, value227) {
  return resolveRunningHubImageTaskProviderKey(value225, value226) + ':image:' + value227;
}

function normalizeApimartMidjourneyUpscaleSpeed(value228) {
  const value229 = String(value228 || '')
    ['trim']()
    ['toLowerCase']();
  return ['relax', 'fast', 'turbo']['includes'](value229) ? value229 : 'fast';
}

function normalizeApimartMidjourneyUpscaleIndex(value230) {
  const count12 = Number['parseInt'](value230, 10);
  if (!Number['isFinite'](count12)) return 0;
  return count12 >= 1 && count12 <= 4 ? count12 : 0;
}

function normalizeApimartMidjourneyVariationMode(value231) {
  const value232 = String(value231 || '')
    ['trim']()
    ['toLowerCase']();
  if (['weak', 'low', 'low-variation']['includes'](value232)) return 'weak';
  if (['strong', 'high', 'high-variation']['includes'](value232)) return 'strong';
  return 'medium';
}

function normalizeApimartMidjourneyVersion(value233) {
  return String(value233 || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/^v/, '');
}

function isApimartMidjourneyRemixVersion(value234) {
  const apimartMidjourneyVersion = normalizeApimartMidjourneyVersion(value234);
  return apimartMidjourneyVersion === '8.2' || apimartMidjourneyVersion === '8.1';
}

function getApimartMidjourneyVariationEndpoint(value235, value236 = '') {
  if (isApimartMidjourneyRemixVersion(value236))
    return normalizeApimartMidjourneyVariationMode(value235) === 'strong' ? 'remix-strong' : 'remix-subtle';
  switch (normalizeApimartMidjourneyVariationMode(value235)) {
    case 'weak':
      return 'low-variation';
    case 'strong':
      return 'high-variation';
    default:
      return 'variation';
  }
}

export async function submitApimartMidjourneyUpscaleRequest(options7 = {}) {
  await ensureConfig();
  const providerConfig5 = getProviderConfig('apimart'),
    enabled27 = String(options7?.['apiKey'] || providerConfig5?.['apiKey'] || '')['trim']();
  if (!enabled27)
    throw ApiError['authError']('apimart', null, 'APIMart API Key 未配置，无法发起 Midjourney 二次操作');
  const enabled28 = String(
    options7?.['taskId'] || options7?.['parentTaskId'] || options7?.['mjTaskId'] || '',
  )['trim']();
  if (!enabled28) throw new Error('缺少 APIMart Midjourney task_id');
  const args27 = String(options7?.['customId'] || options7?.['custom_id'] || '')['trim'](),
    apimartMidjourneyUpscaleIndex = normalizeApimartMidjourneyUpscaleIndex(options7?.['index']);
  if (!args27 && !apimartMidjourneyUpscaleIndex)
    throw new Error('APIMart Midjourney upscale 需要 index 或 custom_id');
  const apimartBaseUrl3 = normalizeApimartBaseUrl(providerConfig5?.['apiUrl']),
    value237 = {
      apiUrl: apimartBaseUrl3 + '/v1/midjourney/generations/upscale',
      apiKey: enabled27,
      task_id: enabled28,
      ...(args27 ? { custom_id: args27 } : { index: apimartMidjourneyUpscaleIndex }),
      ...(args27 && String(options7?.['prompt'] || '')['trim']()
        ? { prompt: String(options7['prompt'] || '')['trim']() }
        : {}),
      ...(args27 ? {} : { speed: normalizeApimartMidjourneyUpscaleSpeed(options7?.['speed']) }),
    },
    requester6 = await requester({
      url: '/api/v2/proxy/image',
      method: 'POST',
      provider: 'apimart',
      timeout: GENERATION_TIMEOUT,
      retries: GENERATION_RETRIES,
      retryDelay: GENERATION_RETRY_DELAY,
      signal: options7?.['signal'],
      headers: { 'Content-Type': 'application/json' },
      body: JSON['stringify'](value237),
      responseType: 'text',
    }),
    value238 = typeof requester6 === 'string' ? parseResponseData(requester6) : requester6 || {},
    error13 = parseError('apimart', value238, 200);
  if (error13) throw error13;
  const enabled29 = String(
    resolveApimartTaskIdStrict(value238) ||
      resolveAsyncImageTaskId(value238, APIMART_MIDJOURNEY_UPSCALE_RESPONSE_MAPPING) ||
      extractApimartTaskIdFromRawText(String(requester6 || '')) ||
      '',
  )['trim']();
  if (!enabled29) throw new Error('APIMart Midjourney upscale 未返回 task_id');
  return {
    taskId: enabled29,
    parentTaskId: enabled28,
    ...(args27 ? { customId: args27 } : { index: apimartMidjourneyUpscaleIndex }),
  };
}

export async function submitApimartMidjourneyVariationRequest(options8 = {}) {
  await ensureConfig();
  const providerConfig6 = getProviderConfig('apimart'),
    enabled30 = String(options8?.['apiKey'] || providerConfig6?.['apiKey'] || '')['trim']();
  if (!enabled30)
    throw ApiError['authError']('apimart', null, 'APIMart API Key 未配置，无法发起 Midjourney 变体操作');
  const enabled31 = String(
    options8?.['taskId'] || options8?.['parentTaskId'] || options8?.['mjTaskId'] || '',
  )['trim']();
  if (!enabled31) throw new Error('缺少 APIMart Midjourney task_id');
  const enabled32 = String(options8?.['customId'] || options8?.['custom_id'] || '')['trim'](),
    apimartMidjourneyUpscaleIndex2 = normalizeApimartMidjourneyUpscaleIndex(options8?.['index']);
  if (!enabled32 && !apimartMidjourneyUpscaleIndex2)
    throw new Error('APIMart Midjourney variation 需要 index 或 custom_id');
  const apimartMidjourneyVariationMode = normalizeApimartMidjourneyVariationMode(
      options8?.['variationMode'] || options8?.['mode'] || options8?.['strength'],
    ),
    args28 = String(
      options8?.['mjModel'] ||
        options8?.['midjourneyModel'] ||
        options8?.['model'] ||
        options8?.['version'] ||
        '',
    )['trim'](),
    args29 = isApimartMidjourneyRemixVersion(args28);
  if (args29 && !apimartMidjourneyUpscaleIndex2)
    throw new Error('APIMart Midjourney remix 需要 index');
  const apimartBaseUrl4 = normalizeApimartBaseUrl(providerConfig6?.['apiUrl']),
    value239 = {
      apiUrl:
        apimartBaseUrl4 +
        '/v1/midjourney/generations/' +
        getApimartMidjourneyVariationEndpoint(apimartMidjourneyVariationMode, args28),
      apiKey: enabled30,
      task_id: enabled31,
      speed: normalizeApimartMidjourneyUpscaleSpeed(options8?.['speed']),
      ...(args29
        ? { index: apimartMidjourneyUpscaleIndex2 }
        : enabled32
          ? { custom_id: enabled32 }
          : { index: apimartMidjourneyUpscaleIndex2 }),
    },
    requester7 = await requester({
      url: '/api/v2/proxy/image',
      method: 'POST',
      provider: 'apimart',
      timeout: GENERATION_TIMEOUT,
      retries: GENERATION_RETRIES,
      retryDelay: GENERATION_RETRY_DELAY,
      signal: options8?.['signal'],
      headers: { 'Content-Type': 'application/json' },
      body: JSON['stringify'](value239),
      responseType: 'text',
    }),
    value240 = typeof requester7 === 'string' ? parseResponseData(requester7) : requester7 || {},
    error14 = parseError('apimart', value240, 200);
  if (error14) throw error14;
  const enabled33 = String(
    resolveApimartTaskIdStrict(value240) ||
      resolveAsyncImageTaskId(value240, APIMART_MIDJOURNEY_UPSCALE_RESPONSE_MAPPING) ||
      extractApimartTaskIdFromRawText(String(requester7 || '')) ||
      '',
  )['trim']();
  if (!enabled33) throw new Error('APIMart Midjourney variation 未返回 task_id');
  return {
    taskId: enabled33,
    parentTaskId: enabled31,
    variationMode: apimartMidjourneyVariationMode,
    ...(args28 ? { mjModel: args28 } : {}),
    ...(args29
      ? { index: apimartMidjourneyUpscaleIndex2 }
      : enabled32
        ? { customId: enabled32 }
        : { index: apimartMidjourneyUpscaleIndex2 }),
  };
}

export async function resumeApimartMidjourneyUpscaleTask(value241, args30 = {}, args31 = {}) {
  await ensureConfig();
  const enabled34 = String(value241 || '')['trim']();
  if (!enabled34) throw new Error('缺少 APIMart Midjourney 任务ID，无法恢复');
  const providerConfig7 = getProviderConfig('apimart'),
    value242 = {
      ...(args30 && typeof args30 === 'object' ? args30 : {}),
      provider: 'apimart',
      model: APIMART_MIDJOURNEY_MODEL_ID,
    },
    args32 = {
      ...args31,
      responseMapping: args31?.['responseMapping'] || APIMART_MIDJOURNEY_UPSCALE_RESPONSE_MAPPING,
      taskPolling: args31?.['taskPolling'] || buildApimartMidjourneyTaskPolling(providerConfig7?.['apiUrl']),
    };
  return runTaskSingleFlight({ provider: 'apimart', kind: 'image', taskId: enabled34 }, async () => {
    const pollAsyncImageTask4 = await pollAsyncImageTask(enabled34, value242, 'apimart', args32);
    if (pollAsyncImageTask4?.['pending']) return pollAsyncImageTask4;
    const processTaskResult2 = await processTaskResult(pollAsyncImageTask4, 'apimart', {
      taskKey: 'apimart:image:' + enabled34,
      responseMapping: args32['responseMapping'],
      ...(args32['apimartMidjourneySource']
        ? { apimartMidjourneySource: args32['apimartMidjourneySource'] }
        : {}),
    });
    if (processTaskResult2['length'] === 1 && processTaskResult2[0]?.['error'])
      throw new Error(processTaskResult2[0]['error'] || 'Midjourney 二次操作恢复失败');
    return processTaskResult2['length'] === 1
      ? processTaskResult2[0]
      : { isBatch: true, images: processTaskResult2 };
  });
}

const IMAGE_LOCAL_SAVE_FAILURE_MESSAGE = '图片已返回，但保存到本地失败';

function getReadableErrorMessage(enabled35) {
  if (!enabled35) return '';
  if (typeof enabled35['getUserMessage'] === 'function')
    try {
      const value243 = String(enabled35['getUserMessage']() || '')['trim']();
      if (value243) return value243;
    } catch {}
  if (typeof enabled35 === 'string') return enabled35['trim']();
  const value244 =
    enabled35?.['message'] ||
    enabled35?.['errorMessage'] ||
    enabled35?.['error_message'] ||
    enabled35?.['reason'] ||
    enabled35?.['detail'] ||
    enabled35?.['details'] ||
    enabled35?.['error'];
  if (value244 !== undefined && value244 !== null && value244 !== enabled35) {
    const readableErrorMessage = getReadableErrorMessage(value244);
    if (readableErrorMessage) return readableErrorMessage;
  }
  try {
    return JSON['stringify'](enabled35);
  } catch {
    return String(enabled35 || '')['trim']();
  }
}

function formatLocalSaveFailureMessage(value245) {
  const list33 = getReadableErrorMessage(value245);
  if (!list33) return IMAGE_LOCAL_SAVE_FAILURE_MESSAGE;
  if (list33['includes']('保存到本地失败')) return list33;
  return IMAGE_LOCAL_SAVE_FAILURE_MESSAGE + '：' + list33;
}

async function generateImageUnqueued(value246, value247) {
  const providerId4 = getProviderId(value246),
    imageExecution3 = getImageExecution(value246, providerId4)?.['executionManifest'],
    imageGenerationBatchSize2 = resolveImageGenerationBatchSize(value246, providerId4),
    shouldSubmitProviderBatchOnce3 = shouldSubmitProviderBatchOnce(
      value246,
      providerId4,
      imageGenerationBatchSize2,
    ),
    localImageRuntimeHandler = getLocalImageRuntimeHandler(imageExecution3);
  if (localImageRuntimeHandler) {
    const list34 = await localImageRuntimeHandler['run']({
      payload: value246,
      options: value247,
      batchSize: imageGenerationBatchSize2,
      executionManifest: imageExecution3,
    });
    return list34['length'] === 1 ? list34[0] : { isBatch: true, images: list34 };
  }
  if (imageGenerationBatchSize2 <= 1 || shouldSubmitProviderBatchOnce3)
    try {
      const doGenerateOnce3 = await doGenerateOnce(value246, providerId4, value247),
        value248 = Array['isArray'](doGenerateOnce3) ? doGenerateOnce3 : [doGenerateOnce3];
      if (value248['length'] === 1 && value248[0]['error'])
        throw new Error(value248[0]['error'], { cause: value248[0]['cause'] });
      return value248['length'] === 1 ? value248[0] : { isBatch: true, images: value248 };
    } catch (value249) {
      if (value249 instanceof ApiError) throw new Error(value249['getUserMessage'](), { cause: value249 });
      throw value249;
    }
  const list35 = [],
    imageBatchAttemptContext = createImageBatchAttemptContext(imageGenerationBatchSize2);
  for (let value250 = 0; value250 < imageGenerationBatchSize2; value250++) {
    try {
      const args33 = await doGenerateOnce(
        buildImageBatchAttemptPayload(value246, imageBatchAttemptContext, value250),
        providerId4,
        value247,
      );
      list35['push'](...args33);
    } catch (value251) {
      value251 instanceof ApiError
        ? list35['push']({
            error: value251['getUserMessage'](),
            status: 'failed',
            retryable: value251['retryable'],
          })
        : list35['push']({ error: value251['message'] || '未知错误', status: 'failed', retryable: false });
    }
  }
  if (list35['length'] === 0) throw new Error('批量生成全部失败');
  if (list35['length'] === 1) return list35[0];
  return { isBatch: true, images: list35 };
}
