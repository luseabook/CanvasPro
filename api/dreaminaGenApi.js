import { hasImageDerivativeFields } from '../src/services/imageDerivativeService.js';
import { buildCanvasLocalImageFields } from '../src/services/canvasMediaLocalService.js';
import { requester } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import {
  ensureDreaminaVideoModelForTask,
  getDreaminaVideoModelVersion,
  normalizeDreaminaVideoDuration,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaVideoModel,
  normalizeDreaminaVideoResolution,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaVideoTaskType,
  validateDreaminaVideoRouteSelection,
} from '../src/modules/dreaminaVideoModelHelper.js';
import { localPathToUrl, normalizeLocalPath } from '../src/utils/localMediaPath.js';
const DREAMINA_SUBMIT_TIMEOUT = 45000,
  DREAMINA_QUERY_TIMEOUT = 60000,
  DREAMINA_POLL_INTERVAL = 2000,
  DREAMINA_MAX_WAIT = 10 * 60 * 1000,
  DREAMINA_QUERY_RETRIES = 2,
  DREAMINA_QUERY_RETRY_DELAY = 350,
  DREAMINA_MAX_TRANSIENT_ERRORS = 12;
export const DREAMINA_POLL_TIMEOUT_CODE = 'DREAMINA_POLL_TIMEOUT';
const DREAMINA_QUEUE_HINTS = ['queue', 'queued', 'waiting', 'wait', 'pending'],
  DREAMINA_TRANSIENT_ERROR_HINTS = [
    'timeout',
    'time out',
    'timed out',
    '超时',
    '网络',
    'network',
    'connect',
    'connection',
    'socket',
    'econn',
    'enotfound',
    'eai_again',
    'temporary',
    'temporarily',
    '暂时',
    '稍后',
    'busy',
    'service unavailable',
    'rate limit',
    'too many requests',
    '429',
    '500',
    '502',
    '503',
    '504',
  ];
function toStatus(value) {
  const item = String(value || '')
    .trim()
    .toLowerCase();
  if (['success', 'succeeded', 'done', 'finish', 'finished'].includes(item)) return 'success';
  if (['fail', 'failed', 'error'].includes(item)) return 'failed';
  if (['cancelled', 'canceled'].includes(item)) return 'cancelled';
  return 'pending';
}
function collectPayloadObjects(...list) {
  const list2 = [],
    map = new Set(),
    handler = (list3, count = 0) => {
      if (!list3 || count > 5) return;
      if (Array.isArray(list3)) {
        list3.forEach((item2) => handler(item2, count + 1));
        return;
      }
      if (typeof list3 !== 'object') return;
      if (map.has(list3)) return;
      (map.add(list3),
        list2.push(list3),
        ['data', 'result', 'queryResult', 'listTask', 'task', 'tasks'].forEach((item3) =>
          handler(list3[item3], count + 1),
        ));
    };
  return (list.forEach((item4) => handler(item4, 0)), list2);
}
function firstPayloadString(key, index) {
  for (const result of key) {
    for (const data of index) {
      const options = String(result?.[data] || '').trim();
      if (options) return options;
    }
  }
  return '';
}
function extractDreaminaRawStatus(target, source) {
  const list4 = collectPayloadObjects(target, source)
    .map((item5) => firstPayloadString([item5], ['status', 'gen_status', 'genStatus']).toLowerCase())
    .filter(Boolean);
  if (list4.some((item6) => ['fail', 'failed', 'error'].includes(item6))) return 'failed';
  if (list4.some((item7) => ['success', 'succeeded', 'done', 'finish', 'finished'].includes(item7)))
    return 'success';
  return '';
}
function extractDreaminaRawFailReason(next, current) {
  return firstPayloadString(collectPayloadObjects(next, current), [
    'failReason',
    'fail_reason',
    'failureReason',
    'failure_reason',
  ]);
}
function extractDreaminaRawErrorMessage(entry, record) {
  return firstPayloadString(collectPayloadObjects(entry, record), [
    'error',
    'errorMessage',
    'message',
    'msg',
  ]);
}
function isDreaminaTerminalFailureMessage(payload) {
  const list5 = String(payload || '')
    .trim()
    .toLowerCase();
  if (!list5) return false;
  return [
    '失败',
    '审核未通过',
    '内容安全',
    '安全审核',
    '违规',
    '敏感',
    '不符合',
    '拦截',
    '风控',
    'failed',
    'failure',
    'error',
    'review failed',
    'content safety',
    'content filter',
    'violation',
    'sensitive',
    'flagged',
    'blocked',
    'not allowed',
  ].some((item8) => list5.includes(item8));
}
function normalizeResolutionType(handle) {
  const enabled = String(handle || '').trim();
  if (!enabled) return '';
  return enabled.toLowerCase();
}
function toTrimmedArray(list6) {
  if (!Array.isArray(list6)) return [];
  const list7 = [];
  return (
    list6.forEach((item9) => {
      const state = String(item9 || '').trim();
      if (state) list7.push(state);
    }),
    list7
  );
}
function basenameFromPath(config) {
  const enabled2 = String(config || '')
    .trim()
    .replace(/\\/g, '/');
  if (!enabled2) return '';
  return enabled2.split('/').filter(Boolean).pop() || '';
}
export function normalizeDreaminaErrorMessage(scope) {
  const enabled3 = String(scope || '').trim();
  if (!enabled3) return '';
  const list8 = enabled3.toLowerCase();
  if (
    list8.includes('do request:') &&
    (list8.includes('context deadline exceeded') ||
      list8.includes('client.timeout') ||
      list8.includes('awaiting headers'))
  )
    return '即梦官方生成接口响应超时，本次没有拿到任务ID。网页可用不代表 CLI 生成接口稳定，请稍后重试；如果连续出现，请切换网络/代理或重新登录即梦后再试。';
  let list9 = enabled3.match(
    /upload resource\s+"([^"]+)"\s*:\s*upload (video|audio)\s*:\s*duration\s+([0-9.]+)\s+seconds\s+is\s+out\s+of\s+allowed\s+range\s+\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/i,
  );
  !list9 &&
    ((list9 = enabled3.match(
      /upload (video|audio)\s*:\s*duration\s+([0-9.]+)\s+seconds\s+is\s+out\s+of\s+allowed\s+range\s+\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/i,
    )),
    list9 && (list9 = ['', '', ...list9.slice(1)]));
  if (list9) {
    const [, input, output, value2, value3, value4] = list9,
      value5 = String(output || '').toLowerCase() === 'audio',
      basenameFromPath2 = basenameFromPath(input),
      value6 = value5 ? '源音频' : '源视频',
      value7 = basenameFromPath2 ? '“' + basenameFromPath2 + '”' : value6,
      value8 = value5
        ? '请将音频裁剪到 ' + value4 + ' 秒以内后再上传。'
        : '请将视频裁剪到 ' + value4 + ' 秒以内，建议裁到 14.9 秒后再上传。';
    return (
      '上传' +
      value6 +
      '失败：' +
      value7 +
      '时长 ' +
      value2 +
      ' 秒，超出即梦允许范围（' +
      value3 +
      '-' +
      value4 +
      ' 秒）。' +
      value8
    );
  }
  return enabled3;
}
function normalizeDreaminaThrownError(error) {
  if (error && typeof error === 'object') {
    const dreaminaErrorMessage = normalizeDreaminaErrorMessage(error.message);
    if (dreaminaErrorMessage) error.message = dreaminaErrorMessage;
  }
  return error;
}
function normalizeModelVersion(value9) {
  const value10 = String(value9?.modelVersion || '').trim();
  if (value10) return value10;
  const list10 = String(value9?.model || '').trim();
  if (!list10.startsWith('dreamina/')) return '';
  const value11 = list10.slice('dreamina/'.length).trim();
  if (
    value11 === 'text2image' ||
    value11 === 'image2image' ||
    value11 === 'text2video' ||
    value11 === 'image2video'
  )
    return '';
  return value11;
}
function normalizeDreaminaRatio(value12, value13) {
  const enabled4 = String(value12?.aspectRatio || '').trim();
  if (!enabled4) return '';
  if (enabled4 === '自适应' || enabled4 === 'auto') return value13 ? '' : '1:1';
  return enabled4;
}
function toLocalPath(value14) {
  return normalizeLocalPath(value14);
}
function toLocalUrl(value15) {
  return localPathToUrl(value15);
}
function normalizeOutputsArray(value16) {
  const list11 = [],
    map2 = new Set(),
    map3 = new Set([
      'data',
      'result',
      'results',
      'output',
      'outputs',
      'raw',
      'queryResult',
      'image',
      'images',
      'image_list',
      'imageList',
      'image_infos',
      'imageInfos',
      'video',
      'videos',
      'video_list',
      'videoList',
      'video_infos',
      'videoInfos',
      'media',
      'medias',
      'media_list',
      'mediaList',
      'file',
      'files',
      'file_list',
      'fileList',
      'resource',
      'resources',
      'download',
      'downloads',
      'content',
      'contents',
    ]),
    value17 = [
      'url',
      'uri',
      'download_url',
      'downloadUrl',
      'file_url',
      'fileUrl',
      'media_url',
      'mediaUrl',
      'image_url',
      'imageUrl',
      'origin_image_url',
      'originImageUrl',
      'original_image_url',
      'originalImageUrl',
      'result_image_url',
      'resultImageUrl',
      'video_url',
      'videoUrl',
      'cover_url',
      'coverUrl',
      'src',
    ],
    value18 = [
      'local_path',
      'localPath',
      'path',
      'file_path',
      'filePath',
      'download_path',
      'downloadPath',
      'local_uri',
      'localUri',
    ],
    url = (value19, value20) => {
      for (const value21 of value20) {
        const value22 = String(value19?.[value21] || '').trim();
        if (value22) return value22;
      }
      return '';
    },
    handler2 = (enabled5) => {
      if (!enabled5 || typeof enabled5 !== 'object') return;
      const enabled6 = url(enabled5, value17),
        enabled7 = url(enabled5, value18),
        value23 = String(enabled5?.mimeType || enabled5?.mime_type || '').trim();
      if (!enabled6 && !enabled7) return;
      const value24 = [enabled6, enabled7, value23].join('|');
      if (map2.has(value24)) return;
      (map2.add(value24), list11.push(enabled5));
    },
    handler3 = (value25) => {
      const value26 = String(value25 || '').trim(),
        list12 = value26.toLowerCase();
      if (list12.includes('input') || list12.includes('reference') || list12.includes('prompt')) return false;
      return (
        map3.has(value26) ||
        list12.includes('output') ||
        list12.includes('result') ||
        list12.includes('image') ||
        list12.includes('video') ||
        list12.includes('media') ||
        list12.includes('file') ||
        list12.includes('url') ||
        list12.includes('uri')
      );
    },
    handler4 = (list13, count2 = 0) => {
      if (!list13 || count2 > 8) return;
      if (typeof list13 === 'string') {
        const url2 = list13.trim();
        if (/^https?:\/\//i.test(url2)) handler2({ url: url2 });
        return;
      }
      if (Array.isArray(list13)) {
        list13.forEach((item10) => handler4(item10, count2 + 1));
        return;
      }
      if (typeof list13 !== 'object') return;
      (handler2({
        url: url(list13, value17),
        localPath: url(list13, value18),
        mimeType: String(list13?.mimeType || list13?.mime_type || '').trim(),
      }),
        Object.entries(list13).forEach(([value27, value28]) => {
          if (handler3(value27)) handler4(value28, count2 + 1);
        }));
    };
  return (
    handler4(value16),
    list11
      .map((response) => {
        const localPath = toLocalPath(response?.localPath);
        return {
          url: String(response?.url || '').trim(),
          localPath: localPath,
          localUrl: toLocalUrl(localPath),
          mimeType: String(response?.mimeType || '').trim(),
        };
      })
      .filter((response2) => response2.url || response2.localPath)
  );
}
function hasDreaminaUsableOutputs(value29) {
  return normalizeOutputsArray(value29).length > 0;
}
function normalizeQueueMetric(value30) {
  const count3 = Number(value30);
  if (!Number.isFinite(count3) || count3 < 0) return null;
  return Math.trunc(count3);
}
function normalizeQueueStatus(value31) {
  return String(value31 || '')
    .trim()
    .toLowerCase();
}
function isDreaminaQueuedState(value32, list14) {
  if (value32 !== 'pending') return false;
  if (!list14) return false;
  return DREAMINA_QUEUE_HINTS.some((item11) => list14.includes(item11));
}
function phaseToLabel(value33, value34 = '') {
  if (value33 === 'queued') return '排队中';
  if (value33 === 'generating') return '生成中';
  if (value33 === 'syncing') return '正在同步结果';
  if (value33 === 'done') return '已完成';
  if (value33 === 'failed') return String(value34 || '').trim() || '查询失败';
  return '处理中';
}
function sleep(value35) {
  return new Promise((value36) => setTimeout(value36, value35));
}
function includesTransientHint(value37) {
  const list15 = String(value37 || '')
    .trim()
    .toLowerCase();
  if (!list15) return false;
  return DREAMINA_TRANSIENT_ERROR_HINTS.some((item12) => list15.includes(item12));
}
function isTransientDreaminaError(error2) {
  if (error2?.dreaminaReturnedError === true) return false;
  const value38 = String(error2?.code || '')
      .trim()
      .toUpperCase(),
    value39 = String(error2?.type || '')
      .trim()
      .toUpperCase(),
    count4 = Number(error2?.status);
  if (
    value38 === 'TIMEOUT' ||
    value38 === 'ETIMEDOUT' ||
    value38 === 'ECONNRESET' ||
    value38 === 'ECONNREFUSED' ||
    value38 === 'ENOTFOUND' ||
    value38 === 'EAI_AGAIN'
  )
    return true;
  if (
    value39 === 'TIMEOUT' ||
    value39 === 'NETWORK_ERROR' ||
    value39 === 'DNS_ERROR' ||
    value39 === 'RATE_LIMIT' ||
    value39 === 'SERVER_ERROR' ||
    value39 === 'SERVICE_UNAVAILABLE'
  )
    return true;
  if (count4 === 429 || count4 >= 500) return true;
  return includesTransientHint(error2?.message || error2);
}
export function normalizeDreaminaTaskSnapshot(response3, value40 = {}) {
  const submitId = String(value40?.submitId || response3?.submitId || response3?.raw?.submitId || '').trim(),
    outputs = normalizeOutputsArray(response3),
    toStatus2 = toStatus(response3?.status),
    raw =
      response3?.raw && typeof response3.raw === 'object' && !Array.isArray(response3.raw)
        ? response3.raw
        : {},
    extractDreaminaRawStatus2 = extractDreaminaRawStatus(response3, raw),
    queueStatus = normalizeQueueStatus(raw.queue_status || raw.queueStatus || response3?.queueStatus),
    queueIndex = normalizeQueueMetric(raw.queue_idx ?? raw.queueIndex ?? response3?.queueIndex),
    queueLength = normalizeQueueMetric(raw.queue_length ?? raw.queueLength ?? response3?.queueLength),
    extractDreaminaRawFailReason2 = extractDreaminaRawFailReason(response3, raw),
    extractDreaminaRawErrorMessage2 = extractDreaminaRawErrorMessage(response3, raw),
    value41 = extractDreaminaRawStatus2 === 'failed' || toStatus2 === 'failed',
    value42 =
      value41 || isDreaminaTerminalFailureMessage(extractDreaminaRawErrorMessage2)
        ? extractDreaminaRawErrorMessage2
        : '',
    failReason = extractDreaminaRawFailReason2 || value42,
    value43 = value41 || failReason ? 'failed' : extractDreaminaRawStatus2 || toStatus2;
  let phase = 'generating';
  if (value43 === 'failed') phase = 'failed';
  else {
    if (value43 === 'cancelled') phase = 'cancelled';
    else {
      if (value43 === 'success') phase = outputs.length > 0 ? 'done' : 'syncing';
      else isDreaminaQueuedState(value43, queueStatus) && (phase = 'queued');
    }
  }
  const status =
    value43 === 'failed'
      ? 'failed'
      : value43 === 'cancelled'
        ? 'cancelled'
        : value43 === 'success' && outputs.length > 0
          ? 'success'
          : 'pending';
  return {
    submitId: submitId,
    status: status,
    phase: phase,
    label: phaseToLabel(phase, failReason),
    queueStatus: queueStatus,
    queueIndex: queueIndex,
    queueLength: queueLength,
    outputs: outputs,
    failReason: failReason,
    raw: raw,
    isTerminal: phase === 'done' || phase === 'failed' || phase === 'cancelled',
    hasOutputs: outputs.length > 0,
    lastCheckedAt: Date.now(),
  };
}
function postJson(url3, value44) {
  return requester({
    url: url3,
    method: 'POST',
    provider: 'dreamina',
    timeout: DREAMINA_SUBMIT_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value44 || {}),
  });
}
export async function submitDreaminaText2Image(value45) {
  return postJson('/api/v2/dreamina/text2image', value45);
}
export async function submitDreaminaImage2Image(value46) {
  return postJson('/api/v2/dreamina/image2image', value46);
}
export async function submitDreaminaText2Video(value47) {
  return postJson('/api/v2/dreamina/text2video', value47);
}
export async function submitDreaminaImage2Video(value48) {
  return postJson('/api/v2/dreamina/image2video', value48);
}
export async function submitDreaminaFrames2Video(value49) {
  return postJson('/api/v2/dreamina/frames2video', value49);
}
export async function submitDreaminaMultiframe2Video(value50) {
  return postJson('/api/v2/dreamina/multiframe2video', value50);
}
export async function submitDreaminaMultimodal2Video(value51) {
  return postJson('/api/v2/dreamina/multimodal2video', value51);
}
export async function cancelDreaminaVideoQueueTask(value52) {
  const submitId2 = String(value52 || '').trim();
  if (!submitId2) throw new Error('submitId 不能为空');
  const error3 = await postJson('/api/v2/dreamina/video_queue/cancel', { submitId: submitId2 });
  if (error3?.success === false) throw new Error(error3?.message || '取消即梦视频队列任务失败');
  return error3 || {};
}
export async function queryDreaminaResult(value53, value54 = {}) {
  const submitId3 = String(value53 || '').trim();
  if (!submitId3) throw new Error('submitId 不能为空');
  const autoDownload = value54?.autoDownload !== false,
    uRLSearchParams = new URLSearchParams({ submitId: submitId3, autoDownload: autoDownload ? '1' : '0' }),
    error4 = await requester({
      url: '/api/v2/dreamina/query_result?' + uRLSearchParams.toString(),
      method: 'GET',
      provider: 'dreamina',
      timeout: DREAMINA_QUERY_TIMEOUT,
      retries: Number.isFinite(Number(value54?.retries))
        ? Math.max(0, Math.trunc(Number(value54.retries)))
        : DREAMINA_QUERY_RETRIES,
      retryDelay: Number.isFinite(Number(value54?.retryDelay))
        ? Math.max(0, Math.trunc(Number(value54.retryDelay)))
        : DREAMINA_QUERY_RETRY_DELAY,
    });
  if (error4?.success === false) {
    const error5 = new Error(normalizeDreaminaErrorMessage(error4?.message) || '即梦任务查询失败');
    ((error5.code = 'DREAMINA_RETURNED_ERROR'), (error5.dreaminaReturnedError = true));
    throw error5;
  }
  return error4 || {};
}
async function pollDreaminaUntilDoneOnce(submitId4, value55 = {}) {
  const count5 = Number(value55?.maxWaitMs || DREAMINA_MAX_WAIT),
    value56 = Number(value55?.intervalMs || DREAMINA_POLL_INTERVAL),
    value57 = Number.isFinite(Number(value55?.maxTransientErrors))
      ? Math.max(0, Math.trunc(Number(value55.maxTransientErrors)))
      : DREAMINA_MAX_TRANSIENT_ERRORS,
    value58 = Date.now();
  let queryDreaminaResult2 = null,
    value59 = 0;
  while (Date.now() - value58 < count5) {
    if (value55?.signal?.aborted) throw new Error('CANCELLED');
    let response4 = null;
    try {
      ((queryDreaminaResult2 = await queryDreaminaResult(submitId4, { autoDownload: true })),
        (response4 = normalizeDreaminaTaskSnapshot(queryDreaminaResult2, { submitId: submitId4 })));
    } catch (error6) {
      if (value55?.signal?.aborted || error6?.name === 'AbortError' || error6?.message === 'CANCELLED')
        throw error6;
      if (isTransientDreaminaError(error6)) {
        value59 += 1;
        if (value59 > value57) {
          const error7 = new Error('即梦任务查询连续异常（' + value59 + ' 次），请稍后重试');
          ((error7.code = 'DREAMINA_QUERY_TRANSIENT_EXHAUSTED'),
            (error7.submitId = String(submitId4 || '').trim()),
            (error7.cause = error6));
          throw error7;
        }
        await sleep(value56);
        continue;
      }
      throw error6;
    }
    value59 = 0;
    typeof value55?.onProgress === 'function' && (await value55.onProgress(response4));
    const toStatus3 = toStatus(response4?.status);
    if (toStatus3 === 'cancelled') throw new Error('CANCELLED');
    if (toStatus3 === 'failed') return queryDreaminaResult2;
    if (toStatus3 === 'success' && hasDreaminaUsableOutputs(queryDreaminaResult2))
      return queryDreaminaResult2;
    await sleep(value56);
  }
  try {
    const queryDreaminaResult3 = await queryDreaminaResult(submitId4, { autoDownload: true }),
      response5 = normalizeDreaminaTaskSnapshot(queryDreaminaResult3, { submitId: submitId4 });
    typeof value55?.onProgress === 'function' && (await value55.onProgress(response5));
    const toStatus4 = toStatus(response5?.status);
    if (toStatus4 === 'cancelled') throw new Error('CANCELLED');
    if (toStatus4 === 'failed') return queryDreaminaResult3;
    if (toStatus4 === 'success' && hasDreaminaUsableOutputs(queryDreaminaResult3))
      return queryDreaminaResult3;
    queryDreaminaResult2 = queryDreaminaResult3;
  } catch (value60) {
    throw value60;
  }
  const count6 = Number.isFinite(count5) && count5 > 0 ? Math.max(1, Math.ceil(count5 / 60000)) : 0,
    error8 = new Error(
      count6 > 0 ? '即梦任务处理超时（已等待约 ' + count6 + ' 分钟）' : '即梦任务处理超时，请稍后重试',
    );
  ((error8.code = DREAMINA_POLL_TIMEOUT_CODE), (error8.submitId = String(submitId4 || '').trim()));
  throw error8;
}
export async function pollDreaminaUntilDone(value61, value62 = {}) {
  const submitId5 = String(value61 || '').trim(),
    kind = String(value62?.taskKind || value62?.kind || 'task').trim() || 'task';
  return runTaskSingleFlight({ provider: 'dreamina', kind: kind, submitId: submitId5 }, () =>
    pollDreaminaUntilDoneOnce(submitId5, value62),
  );
}
export async function runDreaminaImageGeneration(value63, args = {}) {
  const prompt = String(value63?.prompt || '').trim(),
    images = Array.isArray(value63?.inputUrls) ? value63.inputUrls.filter(Boolean) : [],
    value64 = images.length > 0,
    dreaminaRatio = normalizeDreaminaRatio(value63, value64),
    resolutionType = normalizeResolutionType(value63?.imageSize),
    modelVersion = normalizeModelVersion(value63),
    args2 = { prompt: prompt };
  if (dreaminaRatio) args2.ratio = dreaminaRatio;
  if (resolutionType) args2.resolutionType = resolutionType;
  if (modelVersion) args2.modelVersion = modelVersion;
  let error9 = null;
  images.length > 0
    ? (error9 = await submitDreaminaImage2Image({ images: images, ...args2 }))
    : (error9 = await submitDreaminaText2Image({ ...args2 }));
  if (error9?.success === false)
    throw new Error(normalizeDreaminaErrorMessage(error9?.message) || '即梦图片任务提交失败');
  const taskId = String(error9?.submitId || '').trim();
  if (!taskId) throw new Error('即梦图片任务提交失败：未返回 submitId');
  (args?.onTaskMeta?.({ taskId: taskId, submitId: taskId, provider: 'dreamina', kind: 'image' }),
    args?.onTaskId?.(taskId));
  const pollDreaminaUntilDone2 = await pollDreaminaUntilDone(taskId, { ...args, taskKind: 'image' }),
    dreaminaTaskSnapshot = normalizeDreaminaTaskSnapshot(pollDreaminaUntilDone2, { submitId: taskId });
  if (dreaminaTaskSnapshot?.phase === 'failed')
    throw new Error(normalizeDreaminaErrorMessage(dreaminaTaskSnapshot?.failReason) || '即梦图片生成失败');
  const list16 = Array.isArray(dreaminaTaskSnapshot?.outputs) ? dreaminaTaskSnapshot.outputs : [];
  if (!list16.length) throw new Error('即梦图片生成完成，但没有可用输出');
  return list16.map((sourceUrl) => {
    const thumbUrl = sourceUrl.localUrl || sourceUrl.url;
    return {
      sourceId: null,
      thumbId: null,
      sourceUrl: sourceUrl.url || thumbUrl,
      thumbUrl: thumbUrl,
      imageUrl: thumbUrl,
      localPath: sourceUrl.localPath || '',
    };
  });
}
export function buildDreaminaVideoSubmitRequest(options2 = {}) {
  const imageCount = toTrimmedArray(
      Array.isArray(options2?.images) && options2.images.length ? options2.images : options2?.inputUrls,
    ),
    videoCount = toTrimmedArray(options2?.videos),
    audioCount = toTrimmedArray(options2?.audios),
    routeMode = normalizeDreaminaVideoRouteMode(options2?.dreaminaRouteMode, options2?.mode),
    taskType =
      String(options2?.dreaminaTaskType || '').trim() ||
      resolveDreaminaVideoTaskType({
        routeMode: routeMode,
        imageCount: imageCount.length,
        videoCount: videoCount.length,
        audioCount: audioCount.length,
      }),
    validateDreaminaVideoRouteSelection2 = validateDreaminaVideoRouteSelection({
      routeMode: routeMode,
      taskType: taskType,
      imageCount: imageCount.length,
      videoCount: videoCount.length,
      audioCount: audioCount.length,
    });
  if (validateDreaminaVideoRouteSelection2) throw new Error(validateDreaminaVideoRouteSelection2);
  const prompt2 = String(options2?.prompt || '').trim(),
    dreaminaVideoModel = normalizeDreaminaVideoModel(options2?.model, options2?.provider),
    dreaminaVideoModelForTask =
      ensureDreaminaVideoModelForTask(taskType, dreaminaVideoModel, 'dreamina') || dreaminaVideoModel,
    modelVersion2 =
      String(options2?.modelVersion || '').trim() ||
      getDreaminaVideoModelVersion(dreaminaVideoModelForTask, 'dreamina') ||
      normalizeModelVersion(options2),
    installId = String(options2?.installId || '').trim(),
    videoResolution = normalizeDreaminaVideoResolution(
      taskType,
      dreaminaVideoModelForTask,
      options2?.videoResolution || options2?.videoSize || options2?.resolution,
      'dreamina',
    ),
    ratio = normalizeDreaminaVideoAspectRatio(options2?.aspectRatio),
    duration = normalizeDreaminaVideoDuration(
      taskType,
      dreaminaVideoModelForTask,
      options2?.duration,
      'dreamina',
    );
  if (taskType === 'text2video') {
    if (!prompt2) throw new Error('文生视频需要填写提示词');
    return {
      taskType: taskType,
      url: '/api/v2/dreamina/text2video',
      body: {
        prompt: prompt2,
        duration: duration,
        ratio: ratio,
        videoResolution: videoResolution,
        ...(installId ? { installId: installId } : {}),
        ...(modelVersion2 ? { modelVersion: modelVersion2 } : {}),
      },
    };
  }
  if (taskType === 'image2video') {
    const image = String(options2?.image || imageCount[0] || '').trim();
    if (!prompt2) throw new Error('首帧生视频需要填写提示词');
    if (!image) throw new Error('首帧生视频至少需要 1 张图片');
    return {
      taskType: taskType,
      url: '/api/v2/dreamina/image2video',
      body: {
        image: image,
        prompt: prompt2,
        duration: duration,
        videoResolution: videoResolution,
        ...(installId ? { installId: installId } : {}),
        ...(modelVersion2 ? { modelVersion: modelVersion2 } : {}),
      },
    };
  }
  if (taskType === 'frames2video') {
    const first = String(options2?.first || imageCount[0] || '').trim(),
      last = String(options2?.last || imageCount[1] || '').trim();
    if (!prompt2) throw new Error('首尾帧模式需要填写提示词');
    if (!first || !last) throw new Error('首尾帧模式至少需要 2 张图片');
    return {
      taskType: taskType,
      url: '/api/v2/dreamina/frames2video',
      body: {
        first: first,
        last: last,
        prompt: prompt2,
        duration: duration,
        videoResolution: videoResolution,
        ...(installId ? { installId: installId } : {}),
        ...(modelVersion2 ? { modelVersion: modelVersion2 } : {}),
      },
    };
  }
  if (taskType === 'multiframe2video') {
    const images2 = imageCount.slice(0, 20);
    if (images2.length < 2) throw new Error('多帧叙事至少需要 2 张图片');
    const value65 = Array.isArray(options2?.transitionPrompts)
        ? options2.transitionPrompts.map((item13) => String(item13 || '').trim())
        : [],
      value66 = Array.isArray(options2?.transitionDurations) ? options2.transitionDurations : [],
      value67 = Math.max(0, images2.length - 1),
      list17 = [],
      list18 = [];
    for (let value68 = 0; value68 < value67; value68 += 1) {
      list17.push(String(value65[value68] || '').trim() || prompt2);
      const count7 = Number(value66[value68]);
      list18.push(Number.isFinite(count7) && count7 > 0 ? Math.max(1, Math.trunc(count7)) : 3);
    }
    const body = { images: images2 };
    if (installId) body.installId = installId;
    if (images2.length === 2) {
      if (!(list17[0] || prompt2)) throw new Error('两张图的多帧叙事需要提示词');
      ((body.prompt = list17[0] || prompt2), (body.duration = list18[0] || duration || 3));
    } else {
      if (!list17.every((item14) => String(item14 || '').trim()))
        throw new Error('多帧叙事的每段 transition prompt 都不能为空');
      ((body.transitionPrompts = list17), (body.transitionDurations = list18));
    }
    return { taskType: taskType, url: '/api/v2/dreamina/multiframe2video', body: body };
  }
  if (taskType === 'multimodal2video') {
    if (!imageCount.length && !videoCount.length) throw new Error('全能参考至少需要 1 个图片或视频参考');
    return {
      taskType: taskType,
      url: '/api/v2/dreamina/multimodal2video',
      body: {
        images: imageCount,
        videos: videoCount,
        audios: audioCount,
        prompt: prompt2,
        duration: duration,
        ratio: ratio,
        videoResolution: videoResolution,
        ...(installId ? { installId: installId } : {}),
        ...(modelVersion2 ? { modelVersion: modelVersion2 } : {}),
      },
    };
  }
  throw new Error('未识别的即梦视频任务类型');
}
export async function runDreaminaVideoGeneration(value69, args3 = {}) {
  const dom = buildDreaminaVideoSubmitRequest(value69 || {});
  let error10 = null;
  try {
    if (dom.url === '/api/v2/dreamina/text2video') error10 = await submitDreaminaText2Video(dom.body);
    else {
      if (dom.url === '/api/v2/dreamina/image2video') error10 = await submitDreaminaImage2Video(dom.body);
      else {
        if (dom.url === '/api/v2/dreamina/frames2video') error10 = await submitDreaminaFrames2Video(dom.body);
        else {
          if (dom.url === '/api/v2/dreamina/multiframe2video')
            error10 = await submitDreaminaMultiframe2Video(dom.body);
          else {
            if (dom.url === '/api/v2/dreamina/multimodal2video')
              error10 = await submitDreaminaMultimodal2Video(dom.body);
            else throw new Error('未知的即梦视频请求路由');
          }
        }
      }
    }
  } catch (value70) {
    throw normalizeDreaminaThrownError(value70);
  }
  if (error10?.success === false) {
    const error11 = new Error(normalizeDreaminaErrorMessage(error10?.message) || '即梦视频任务提交失败');
    if (error10?.code != null) error11.code = String(error10.code || '');
    error10?.requiredModelId != null &&
      (error11.requiredModelId = String(error10.requiredModelId || '').trim());
    error10?.subscriptionStatus != null &&
      (error11.subscriptionStatus = String(error10.subscriptionStatus || '').trim());
    error10?.reasonCode != null && (error11.reasonCode = String(error10.reasonCode || '').trim());
    ((error11.contactText = String(error10?.contactText || '').trim()),
      (error11.contactUrl = String(error10?.contactUrl || '').trim()));
    throw error11;
  }
  const taskId2 = String(error10?.submitId || '').trim();
  if (!taskId2) throw new Error('即梦视频任务提交失败：未返回 submitId');
  (args3?.onTaskMeta?.({ taskId: taskId2, submitId: taskId2, provider: 'dreamina', kind: 'video' }),
    args3?.onTaskId?.(taskId2));
  const pollDreaminaUntilDone3 = await pollDreaminaUntilDone(taskId2, { ...args3, taskKind: 'video' }),
    dreaminaTaskSnapshot2 = normalizeDreaminaTaskSnapshot(pollDreaminaUntilDone3, { submitId: taskId2 });
  if (dreaminaTaskSnapshot2?.phase === 'failed')
    throw new Error(normalizeDreaminaErrorMessage(dreaminaTaskSnapshot2?.failReason) || '即梦视频生成失败');
  const list19 = Array.isArray(dreaminaTaskSnapshot2?.outputs) ? dreaminaTaskSnapshot2.outputs : [];
  if (!list19.length) throw new Error('即梦视频生成完成，但没有可用输出');
  const isBatch = list19.map((videoUrl) => ({
    videoUrl: videoUrl.localUrl || videoUrl.url,
    localPath: videoUrl.localPath || '',
  }));
  return {
    isBatch: isBatch.length > 1,
    videos: isBatch,
    videoUrl: isBatch[0]?.videoUrl || '',
    localPath: isBatch[0]?.localPath || '',
  };
}

function normalizeDreaminaGenerateNum(options3 = {}) {
  const value71 = options3?.['generateNum'] ?? options3?.['generate_num'] ?? options3?.['batchSize'] ?? 1,
    value72 = Number['parseInt'](value71, 10);
  if (!Number['isFinite'](value72)) return 1;
  return Math['max'](1, Math['min'](10, value72));
}

export async function submitDreaminaImageUpscale(value73) {
  return postJson('/api/v2/dreamina/image_upscale', value73);
}

function getDreaminaImageUpscaleInputImage(options4 = {}) {
  const value74 = String(options4?.['inputUrlsBySlot']?.['image'] || '')['trim']();
  if (value74) return value74;
  const value75 = String(options4?.['image'] || options4?.['imageUrl'] || options4?.['inputImage'] || '')[
    'trim'
  ]();
  if (value75) return value75;
  const value76 = Array['isArray'](options4?.['inputUrls']) ? options4['inputUrls'] : [];
  return String(value76['find']((value77) => String(value77 || '')['trim']()) || '')['trim']();
}

function normalizeDreaminaImageUpscaleResolution(options5 = {}) {
  const resolutionType2 = normalizeResolutionType(
    options5?.['resolutionType'] ?? options5?.['resolution_type'] ?? options5?.['imageSize'],
  );
  if (resolutionType2 === '4k' || resolutionType2 === '8k') return resolutionType2;
  return '2k';
}

export function buildDreaminaImageUpscaleSubmitPayload(options6 = {}) {
  const dreaminaImageUpscaleInputImage = getDreaminaImageUpscaleInputImage(options6);
  if (!dreaminaImageUpscaleInputImage) throw new Error('即梦图片超清/放大需要 1 张输入图片');
  return {
    image: dreaminaImageUpscaleInputImage,
    resolutionType: normalizeDreaminaImageUpscaleResolution(options6),
  };
}

export async function runDreaminaImageUpscaleGeneration(value78, args4 = {}) {
  const submitDreaminaImageUpscale2 = await submitDreaminaImageUpscale(
    buildDreaminaImageUpscaleSubmitPayload(value78),
  );
  if (submitDreaminaImageUpscale2?.['success'] === false)
    throw new Error(
      normalizeDreaminaErrorMessage(submitDreaminaImageUpscale2?.['message']) ||
        '即梦图片超清/放大任务提交失败',
    );
  const enabled8 = String(submitDreaminaImageUpscale2?.['submitId'] || '')['trim']();
  if (!enabled8) throw new Error('即梦图片超清/放大任务提交失败：未返回 submitId');
  (args4?.['onTaskMeta']?.({ taskId: enabled8, submitId: enabled8, provider: 'dreamina', kind: 'image' }),
    args4?.['onTaskId']?.(enabled8));
  const pollDreaminaUntilDone4 = await pollDreaminaUntilDone(enabled8, { ...args4, taskKind: 'image' }),
    dreaminaTaskSnapshot3 = normalizeDreaminaTaskSnapshot(pollDreaminaUntilDone4, { submitId: enabled8 });
  if (dreaminaTaskSnapshot3?.['phase'] === 'failed')
    throw new Error(
      normalizeDreaminaErrorMessage(dreaminaTaskSnapshot3?.['failReason']) || '即梦图片超清/放大失败',
    );
  const enabled9 = Array['isArray'](dreaminaTaskSnapshot3?.['outputs'])
    ? dreaminaTaskSnapshot3['outputs']
    : [];
  if (!enabled9['length']) throw new Error('即梦图片超清/放大完成，但没有可用输出');
  return enabled9['map']((value79) => {
    const value80 = value79['localUrl'] || value79['url'];
    return {
      sourceId: null,
      thumbId: null,
      sourceUrl: value79['url'] || value80,
      thumbUrl: value80,
      imageUrl: value80,
      localPath: value79['localPath'] || '',
      ...(hasImageDerivativeFields(value79) ? buildCanvasLocalImageFields(value79) : {}),
    };
  });
}
