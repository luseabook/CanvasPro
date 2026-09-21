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
const GENERATION_TIMEOUT = 10 * 60 * 0x3e8;
export async function cancelRunningHubVideoTask({ apiKey: _0x5cd63a, taskId: _0x2b669d } = {}) {
  return cancelRunningHubTask({ apiKey: _0x5cd63a, taskId: _0x2b669d });
}
function resolveVideoExecution(_0x51cee0 = {}) {
  const _0x1bc61b = normalizeProviderId(_0x51cee0?.provider);
  return resolveModelExecution(_0x51cee0?.model, { providerHint: _0x1bc61b });
}
function resolveVideoProviderId(_0x338bdf = {}, _0x5df2f1 = null) {
  return normalizeProviderId(_0x5df2f1?.modelManifest?.provider || _0x338bdf?.provider);
}
function resolveVideoTaskRuntimeOptions(_0x396c26 = {}, _0x4c7da5 = '', _0x1e95f5 = {}) {
  const _0x1186a5 = String(_0x396c26?.model || '').trim();
  if (!_0x1186a5) return _0x1e95f5 || {};
  const _0x5e810e = normalizeProviderId(_0x4c7da5 || _0x396c26?.provider),
    _0x3e3b2a = resolveModelExecution(_0x1186a5, { providerHint: _0x5e810e }),
    _0x4c7724 = _0x3e3b2a?.executionManifest;
  if (!_0x4c7724 || _0x4c7724.adapterType !== 'modelApi' || _0x4c7724.kind !== 'video')
    return _0x1e95f5 || {};
  const _0x227c1f = normalizeProviderId(_0x4c7724.provider || _0x5e810e),
    _0x2cff30 = getProviderConfig(_0x227c1f),
    _0x1014ad = resolveManifestTaskPolling(_0x227c1f, _0x2cff30, _0x4c7724, {
      modelManifest: _0x3e3b2a?.modelManifest || null,
    });
  return {
    ...(_0x1e95f5 || {}),
    ...(!_0x1e95f5?.responseMapping && _0x4c7724.responseMapping
      ? { responseMapping: _0x4c7724.responseMapping }
      : {}),
    ...(!_0x1e95f5?.taskPolling && _0x1014ad ? { taskPolling: _0x1014ad } : {}),
  };
}
export async function buildGenerateVideoRequest(_0xd01e9f) {
  const _0x8bbe5f = applyCameraAngleToPrompt(_0xd01e9f.prompt, _0xd01e9f.cameraAngle),
    _0x5897b7 = resolveVideoExecution(_0xd01e9f),
    _0xf0c30e = resolveVideoProviderId(_0xd01e9f, _0x5897b7),
    _0x577444 = _0x5897b7?.executionManifest,
    _0x57966b = _0x5897b7?.modelManifest;
  if (_0x577444?.adapterType === 'localRuntime' && _0x577444?.runtime === 'dreaminaVideo') {
    const _0x286e35 = buildDreaminaVideoSubmitRequest({ ..._0xd01e9f, prompt: _0x8bbe5f });
    return { url: _0x286e35.url, headers: { 'Content-Type': 'application/json' }, body: _0x286e35.body };
  }
  if (!_0xf0c30e || !_0x577444) {
    const _0x2fc045 = String(_0xd01e9f?.model || '').trim() || '(empty)';
    throw new Error('Video model API manifest missing: ' + _0x2fc045);
  }
  await ensureConfig();
  if (_0x577444.adapterType === 'modelApi') {
    const _0x1bfd42 = await buildVideoRequestFromManifest(
      _0xd01e9f,
      _0x8bbe5f,
      {
        getProviderConfig: getProviderConfig,
        processInputImages: processInputImages,
        processInputVideos: processInputVideos,
        processInputAudios: processInputAudios,
        uploadInputsToVolcengineFiles: uploadInputsToVolcengineFiles,
      },
      { expectedProvider: _0x57966b?.provider || _0xf0c30e },
    );
    if (_0x1bfd42) return _0x1bfd42;
    throw new Error(
      (_0x57966b?.provider || _0xf0c30e) + ' video model API manifest missing: ' + _0xd01e9f.model,
    );
  }
  if (_0x577444.adapterType === 'workflow')
    return RunningHubAdapter.buildVideoRequest(_0xd01e9f, _0x8bbe5f, {
      getProviderConfig: getProviderConfig,
      processInputImages: processInputImages,
      processInputVideos: processInputVideos,
    });
  throw new ApiError({
    type: 'UNSUPPORTED_PROVIDER',
    provider: _0xf0c30e,
    message: '暂不支持厂商 ' + _0xf0c30e + ' 的视频生成',
    retryable: false,
  });
}
async function pollRunningHubVideoTask(_0x29d860, _0x5e13c8, _0x289c5f, _0x6e9cae) {
  const _0x2c4d5a = isModelApiModel(_0x5e13c8.model, 'runninghub'),
    _0x3cfda5 = _0x6e9cae?.useOpenapiQuery === true || _0x2c4d5a,
    _0x5399ad = getProviderConfig(_0x2c4d5a ? 'runninghub' : 'runninghubwf'),
    _0x14e5e9 = _0x2c4d5a ? _0x5399ad.modelApiKey || _0x5e13c8.apiKey : _0x5399ad.apiKey || _0x5e13c8.apiKey;
  for (let _0x2fc071 = 0; _0x2fc071 < 0x4b0; _0x2fc071++) {
    if (_0x6e9cae?.signal?.aborted) throw new Error('CANCELLED');
    await new Promise((_0x15fc82) => setTimeout(_0x15fc82, 0x7d0));
    try {
      const _0x42bcde = await requester({
        url: _0x3cfda5 ? '/api/v2/proxy/image' : '/api/v2/runninghubwf/query',
        method: 'POST',
        provider: _0x289c5f,
        timeout: 0x7530,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          _0x3cfda5
            ? { apiUrl: 'https://www.runninghub.cn/openapi/v2/query', apiKey: _0x14e5e9, taskId: _0x29d860 }
            : { apiKey: _0x14e5e9, taskId: _0x29d860 },
        ),
      });
      if (_0x3cfda5) {
        const _0x48f5d8 = typeof _0x42bcde?.code === 'number' ? _0x42bcde.code : null;
        if (_0x48f5d8 === 0x324 || _0x48f5d8 === 0x32d) continue;
        if (_0x48f5d8 !== null && _0x48f5d8 !== 0) throw parseError(_0x289c5f, _0x42bcde, 200);
        if (extractVideoUrls(_0x42bcde, _0x6e9cae?.responseMapping).length > 0) return _0x42bcde;
      }
      if (!_0x3cfda5) {
        const _0x56be18 = typeof _0x42bcde?.code === 'number' ? _0x42bcde.code : null;
        if (_0x56be18 === 0 && Array.isArray(_0x42bcde.data) && _0x42bcde.data.length > 0) {
          if (extractVideoUrls(_0x42bcde, _0x6e9cae?.responseMapping).length > 0) return _0x42bcde;
          const _0x317334 = _0x42bcde.data
            .map((_0x20a2c3) =>
              String(_0x20a2c3?.status || _0x20a2c3?.taskStatus || '')
                .trim()
                .toUpperCase(),
            )
            .filter(Boolean);
          if (
            _0x317334.some((_0x58aa67) =>
              ['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(_0x58aa67),
            )
          ) {
            const _0x5424cc = parseError(_0x289c5f, _0x42bcde, 200);
            throw (
              _0x5424cc ||
              new ApiError({
                type: 'TASK_FAILED',
                provider: _0x289c5f,
                message: '视频任务执行失败',
                raw: _0x42bcde,
                retryable: false,
              })
            );
          }
          continue;
        }
        if (_0x56be18 === 0x324 || _0x56be18 === 0x32d) continue;
        if (_0x56be18 !== null && _0x56be18 !== 0) throw parseError(_0x289c5f, _0x42bcde, 200);
      }
      const _0x4bb291 = _0x42bcde.data && Object.keys(_0x42bcde.data).length > 0 ? _0x42bcde.data : _0x42bcde;
      if (extractVideoUrls(_0x4bb291, _0x6e9cae?.responseMapping).length > 0) return _0x4bb291;
      const _0x23f62d = parseTaskError(_0x289c5f, _0x4bb291);
      if (_0x23f62d) throw _0x23f62d;
      const _0x9ee349 = (_0x4bb291.status || '').toUpperCase();
      if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(_0x9ee349)) {
        if (extractVideoUrls(_0x4bb291, _0x6e9cae?.responseMapping).length === 0) continue;
        return _0x4bb291;
      }
    } catch (_0x3fb9df) {
      if (_0x3fb9df instanceof ApiError) {
        if (
          _0x3fb9df.type === ErrorType.TASK_FAILED ||
          _0x3fb9df.type === ErrorType.TASK_TIMEOUT ||
          _0x3fb9df.type === ErrorType.AUTH_ERROR ||
          _0x3fb9df.type === ErrorType.FORBIDDEN ||
          _0x3fb9df.type === ErrorType.INVALID_PARAMS ||
          _0x3fb9df.type === ErrorType.INSUFFICIENT_BALANCE
        )
          throw _0x3fb9df;
      }
    }
  }
  throw ApiError.taskTimeout(_0x289c5f);
}
function parseVideoResponseData(_0x1e8d01) {
  if (!_0x1e8d01) return {};
  if (typeof _0x1e8d01 === 'object') return _0x1e8d01;
  const _0x328df8 = String(_0x1e8d01 || '').trim();
  if (!_0x328df8) return {};
  try {
    return JSON.parse(_0x328df8.replace(/^data:\s*/, ''));
  } catch {
    const _0x4cb6f8 = extractSseJsonSnapshots(_0x328df8);
    if (_0x4cb6f8.length > 0) {
      for (const _0x3b70c1 of _0x4cb6f8) {
        if (resolveAsyncVideoTaskId(_0x3b70c1)) return _0x3b70c1;
      }
      return _0x4cb6f8[_0x4cb6f8.length - 1];
    }
    throw new ApiError({ type: 'PARSE_ERROR', message: '无法解析服务端响应', retryable: false });
  }
}
function extractSseJsonSnapshots(_0x1af880) {
  const _0x266364 = String(_0x1af880 || '')
    .split('\n')
    .filter((_0x5f1e9b) => _0x5f1e9b.trim().startsWith('data:'));
  if (_0x266364.length === 0) return [];
  const _0x4d8a45 = [];
  for (const _0x3b7242 of _0x266364) {
    const _0x3558c1 = String(_0x3b7242 || '')
      .trim()
      .replace(/^data:\s*/, '')
      .trim();
    if (!_0x3558c1 || _0x3558c1 === '[DONE]') continue;
    try {
      _0x4d8a45.push(JSON.parse(_0x3558c1));
    } catch {}
  }
  return _0x4d8a45;
}
function extractRunningHubTaskIdFromRawText(_0x6982b) {
  const _0x49c9cd = String(_0x6982b || '');
  if (!_0x49c9cd) return '';
  const _0xe07d08 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid)=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const _0x567939 of _0xe07d08) {
    const _0x266369 = _0x49c9cd.match(_0x567939),
      _0x4151c6 = String(_0x266369?.[1] || '')
        .replace(/,/g, '')
        .trim();
    if (_0x4151c6) return _0x4151c6;
  }
  return '';
}
function extractTaskIdFromResponseHeaders(_0x1ffd46) {
  if (!_0x1ffd46 || typeof _0x1ffd46.get !== 'function') return '';
  const _0x1b7ad8 = [
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
  for (const _0x50ad03 of _0x1b7ad8) {
    const _0x40fc88 = String(_0x1ffd46.get(_0x50ad03) || '').trim();
    if (_0x40fc88) return _0x40fc88;
  }
  if (typeof _0x1ffd46.forEach === 'function') {
    let _0x4309d8 = '';
    _0x1ffd46.forEach((_0x57f6fd, _0x8a1b8) => {
      if (_0x4309d8) return;
      const _0x5c3c81 = String(_0x8a1b8 || '')
          .trim()
          .toLowerCase(),
        _0xaaa5ce = String(_0x57f6fd || '').trim();
      if (!_0xaaa5ce) return;
      ((_0x5c3c81.includes('task') && _0x5c3c81.includes('id')) ||
        (_0x5c3c81.includes('job') && _0x5c3c81.includes('id')) ||
        (_0x5c3c81.includes('request') && _0x5c3c81.includes('id'))) &&
        (_0x4309d8 = _0xaaa5ce);
    });
    if (_0x4309d8) return _0x4309d8;
  }
  return '';
}
function normalizeTaskIdValue(_0x7e9d05) {
  return String(_0x7e9d05 ?? '')
    .replace(/,/g, '')
    .trim();
}
function looksLikeTaskToken(_0x512f50) {
  const _0x34bc98 = String(_0x512f50 ?? '').trim();
  if (!_0x34bc98 || _0x34bc98.length < 8) return false;
  const _0x34b934 = _0x34bc98.toLowerCase();
  if (
    ['pending', 'running', 'success', 'succeeded', 'completed', 'failed', 'queued', 'submitted'].includes(
      _0x34b934,
    )
  )
    return false;
  return /^[a-zA-Z0-9._:-]+$/.test(_0x34bc98);
}
function findFirstDeepValueByKeyPattern(_0x3d571d, _0x10e51a, _0x29fa06 = 8) {
  if (!_0x3d571d || typeof _0x3d571d !== 'object') return '';
  const _0x2a6ccc = new WeakSet(),
    _0x49dd13 = [{ value: _0x3d571d, depth: 0 }];
  while (_0x49dd13.length > 0) {
    const { value: _0x97edc2, depth: _0x26f739 } = _0x49dd13.shift();
    if (!_0x97edc2 || typeof _0x97edc2 !== 'object') continue;
    if (_0x2a6ccc.has(_0x97edc2)) continue;
    _0x2a6ccc.add(_0x97edc2);
    if (_0x26f739 > _0x29fa06) continue;
    const _0xea7756 = Array.isArray(_0x97edc2)
      ? _0x97edc2.map((_0x3b0f34, _0x572d19) => [String(_0x572d19), _0x3b0f34])
      : Object.entries(_0x97edc2);
    for (const [_0x5c260d, _0x341cd8] of _0xea7756) {
      const _0x125722 = String(_0x5c260d || '')
        .trim()
        .toLowerCase();
      if (_0x10e51a.test(_0x125722)) {
        const _0x27b845 = String(_0x341cd8 ?? '').trim();
        if (_0x27b845) return _0x27b845;
      }
      _0x341cd8 &&
        typeof _0x341cd8 === 'object' &&
        _0x49dd13.push({ value: _0x341cd8, depth: _0x26f739 + 1 });
    }
  }
  return '';
}
function resolveRunningHubVideoTaskId(_0x58a7cb, _0x466c91 = '', _0x1366d1 = null, _0x5ab709 = null) {
  const _0x54df21 = resolveMappedResponseValue(_0x58a7cb, _0x5ab709?.taskIdPath);
  if (_0x54df21) return normalizeTaskIdValue(_0x54df21);
  const _0x31997a = extractRunningHubTaskIdFromRawText(_0x466c91);
  if (_0x31997a) return _0x31997a;
  const _0x14cf62 = resolveAsyncVideoTaskId(_0x58a7cb, _0x5ab709);
  if (_0x14cf62) return normalizeTaskIdValue(_0x14cf62);
  return normalizeTaskIdValue(extractTaskIdFromResponseHeaders(_0x1366d1));
}
export async function resumeRunningHubVideoTask(_0x2f14c2, _0x589d1f, _0x195e17 = {}) {
  const _0x8b689a = resolveVideoExecution(_0x589d1f),
    _0x17fac3 = resolveVideoProviderId(_0x589d1f, _0x8b689a);
  if (_0x17fac3 !== 'runninghubwf') throw new Error('仅支持恢复 RunningHub 工作流视频任务');
  const _0x104642 = String(_0x2f14c2 || '').trim();
  if (!_0x104642) throw new Error('缺少 RunningHub 视频任务ID，无法恢复');
  const _0x8bf026 = _0x195e17?.useOpenapiQuery === true;
  return runTaskSingleFlight({ provider: _0x17fac3, kind: 'video', taskId: _0x104642 }, async () => {
    const _0x2987a1 = await pollRunningHubVideoTask(_0x104642, _0x589d1f || {}, _0x17fac3, {
        ..._0x195e17,
        useOpenapiQuery: _0x8bf026,
      }),
      _0x420a1d = processVideoTaskResult(_0x2987a1, _0x17fac3, _0x195e17);
    return await postProcessVideoResult(_0x420a1d, {
      providerId: _0x17fac3,
      taskKey: _0x17fac3 + ':video:' + _0x104642,
    });
  });
}
export async function resumeAsyncVideoTask(_0x4807cd, _0x149be7 = {}, _0x1aeba8 = {}) {
  const _0xd193a = resolveVideoExecution(_0x149be7),
    _0x262eea = resolveVideoProviderId(_0x149be7, _0xd193a);
  if (_0x262eea === 'runninghubwf' || _0x262eea === 'dreamina')
    throw new Error('仅支持恢复非 RunningHub/Dreamina 的异步视频任务');
  const _0x5dece1 = String(_0x4807cd || '').trim();
  if (!_0x5dece1) throw new Error('缺少异步视频任务ID，无法恢复');
  await ensureConfig();
  const _0x43eb9f = resolveVideoTaskRuntimeOptions(_0x149be7 || {}, _0x262eea, _0x1aeba8),
    _0x5e94cd = getProviderConfig(_0x262eea),
    _0x45a345 = String(
      _0x149be7?.apiKey ||
        (_0x262eea === 'runninghub' ? _0x5e94cd?.modelApiKey : '') ||
        _0x5e94cd?.apiKey ||
        '',
    ).trim();
  if (!_0x45a345) throw new Error('API Key 未配置（厂商：' + _0x262eea + '），无法恢复视频任务');
  return runTaskSingleFlight({ provider: _0x262eea, kind: 'video', taskId: _0x5dece1 }, async () => {
    if (_0x262eea === 'runninghub') {
      const _0x3b4459 = await pollRunningHubVideoTask(
          _0x5dece1,
          { ..._0x149be7, apiKey: _0x45a345 },
          _0x262eea,
          { ..._0x43eb9f, useOpenapiQuery: true },
        ),
        _0x55da3f = processVideoTaskResult(_0x3b4459, _0x262eea, _0x43eb9f);
      return await postProcessVideoResult(_0x55da3f, {
        providerId: _0x262eea,
        taskKey: _0x262eea + ':video:' + _0x5dece1,
      });
    }
    const _0x2ae3e8 = await pollVideoTask(_0x5dece1, _0x262eea, _0x45a345, _0x43eb9f);
    return await postProcessVideoResult(_0x2ae3e8, {
      providerId: _0x262eea,
      taskKey: _0x262eea + ':video:' + _0x5dece1,
    });
  });
}
export async function resumeDreaminaVideoTask(_0x35a3b2, _0xfd2980 = {}) {
  const _0x33eec9 = String(_0x35a3b2 || '').trim();
  if (!_0x33eec9) throw new Error('缺少 Dreamina 提交ID，无法恢复视频任务');
  const _0x784fcd = await pollDreaminaUntilDone(_0x33eec9, { ..._0xfd2980, taskKind: 'video' }),
    _0x1b690f = normalizeDreaminaTaskSnapshot(_0x784fcd, { submitId: _0x33eec9 });
  if (_0x1b690f?.phase === 'failed') {
    const _0xddd224 = new Error(_0x1b690f?.failReason || _0x1b690f?.label || '查询失败');
    _0xddd224.dreaminaSnapshot = _0x1b690f;
    throw _0xddd224;
  }
  const _0x9bc6af = Array.isArray(_0x1b690f?.outputs) ? _0x1b690f.outputs : [],
    _0x5171ea = _0x9bc6af.map((_0x46cd25) => {
      const _0x314be4 = pickResultLocalPath(_0x46cd25);
      return {
        videoUrl: localPathToUrl(_0x314be4) || _0x46cd25.localUrl || _0x46cd25.url,
        localPath: _0x314be4,
      };
    });
  return {
    isBatch: _0x5171ea.length > 1,
    dreaminaSnapshot: _0x1b690f,
    videos: _0x5171ea,
    videoUrl:
      localPathToUrl(pickResultLocalPath(_0x9bc6af[0])) || _0x9bc6af[0]?.localUrl || _0x9bc6af[0]?.url || '',
    localPath: pickResultLocalPath(_0x9bc6af[0]),
  };
}
function buildManifestVideoTaskPollUrl(_0x319672, _0x1dd851) {
  if (!_0x1dd851 || typeof _0x1dd851 !== 'object') return '';
  const _0x2ea921 = String(_0x1dd851.urlTemplate || '').trim();
  if (!_0x2ea921) return '';
  return _0x2ea921.replace('{taskId}', encodeURIComponent(String(_0x319672)));
}
const ASYNC_VIDEO_SUCCESS_STATUSES = new Set([
  'completed',
  'complete',
  'done',
  'finished',
  'succeeded',
  'success',
]);
function shouldRethrowVideoPollingError(_0xae76c5) {
  if (!(_0xae76c5 instanceof ApiError)) return false;
  return (
    _0xae76c5.type === ErrorType.TASK_FAILED ||
    _0xae76c5.type === ErrorType.CONTENT_FILTERED ||
    _0xae76c5.type === ErrorType.TASK_TIMEOUT ||
    _0xae76c5.type === ErrorType.AUTH_ERROR ||
    _0xae76c5.type === ErrorType.FORBIDDEN ||
    _0xae76c5.type === ErrorType.INVALID_PARAMS ||
    _0xae76c5.type === ErrorType.INSUFFICIENT_BALANCE ||
    _0xae76c5.type === ErrorType.MODEL_UNAVAILABLE ||
    _0xae76c5.type === 'PARSE_ERROR'
  );
}
async function pollVideoTask(_0x899982, _0x1ba1cc, _0x490a2a, _0x1a02d3 = {}) {
  const _0x2778c8 = getProviderConfig(_0x1ba1cc);
  for (let _0x30927d = 0; _0x30927d < 0x258; _0x30927d++) {
    if (_0x1a02d3?.signal?.aborted) throw new Error('CANCELLED');
    await new Promise((_0x52cf21) => setTimeout(_0x52cf21, 0x7d0));
    if (_0x1a02d3?.signal?.aborted) throw new Error('CANCELLED');
    const _0xa01a85 = encodeURIComponent(String(_0x899982)),
      _0x209c72 =
        String(_0x2778c8.apiUrl || '').replace(/\/+$/, '') +
        '/v1/tasks/' +
        _0xa01a85 +
        (String(_0x1ba1cc || '')
          .trim()
          .toLowerCase() === 'apimart'
          ? '?language=zh'
          : ''),
      _0x510545 = buildManifestVideoTaskPollUrl(_0x899982, _0x1a02d3?.taskPolling) || _0x209c72;
    try {
      const _0x445f3f = await requester({
          url: '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x510545),
          method: 'GET',
          headers: { Authorization: 'Bearer ' + _0x490a2a },
          provider: _0x1ba1cc,
          timeout: 0x7530,
          signal: _0x1a02d3?.signal,
        }),
        _0x5bc5fe = normalizeAsyncVideoTaskInfo(_0x445f3f),
        _0x4c3d47 = resolveAsyncVideoTaskStatus(_0x5bc5fe, _0x1a02d3?.responseMapping),
        _0x2497e4 = parseTaskError(_0x1ba1cc, _0x5bc5fe);
      if (_0x2497e4) throw _0x2497e4;
      const _0xe87a11 = extractVideoUrls(_0x5bc5fe, _0x1a02d3?.responseMapping).length > 0;
      if (_0xe87a11) return processVideoTaskResult(_0x5bc5fe, _0x1ba1cc, _0x1a02d3);
      if (ASYNC_VIDEO_SUCCESS_STATUSES.has(_0x4c3d47))
        throw new ApiError({
          type: 'PARSE_ERROR',
          provider: _0x1ba1cc,
          message: '无法从服务器响应中提取视频地址',
          raw: _0x5bc5fe,
          retryable: false,
        });
      if (isAsyncVideoTaskFailureStatus(_0x4c3d47))
        throw ApiError.taskFailed(_0x1ba1cc, extractAsyncVideoTaskFailureReason(_0x5bc5fe) || '任务状态异常');
    } catch (_0x5914bd) {
      if (shouldRethrowVideoPollingError(_0x5914bd)) throw _0x5914bd;
    }
  }
  throw ApiError.taskTimeout(_0x1ba1cc);
}
function normalizeTaskSnapshotPayload(_0x13585c) {
  if (_0x13585c && typeof _0x13585c === 'object') return _0x13585c;
  const _0x5bac3d = String(_0x13585c || '').trim();
  if (!_0x5bac3d) return {};
  try {
    return JSON.parse(_0x5bac3d);
  } catch {
    return { rawText: _0x5bac3d };
  }
}
function normalizeAsyncVideoTaskInfo(_0x327cf2) {
  const _0x598f50 = normalizeTaskSnapshotPayload(_0x327cf2),
    _0x41cacf =
      _0x598f50 &&
      typeof _0x598f50 === 'object' &&
      _0x598f50.data &&
      typeof _0x598f50.data === 'object' &&
      !Array.isArray(_0x598f50.data);
  return _0x41cacf
    ? { ..._0x598f50, ..._0x598f50.data }
    : normalizeTaskSnapshotPayload(_0x598f50?.data || _0x598f50);
}
function resolveAsyncVideoTaskStatus(_0x4f2237, _0x40815a = null) {
  const _0x77e81f = resolveMappedResponseValue(_0x4f2237, _0x40815a?.statusPath);
  if (_0x77e81f) return String(_0x77e81f).trim().toLowerCase();
  const _0x58213f = Array.isArray(_0x4f2237?.data)
      ? _0x4f2237.data[0]
      : _0x4f2237?.data && typeof _0x4f2237.data === 'object'
        ? _0x4f2237.data
        : null,
    _0x1daea8 = Array.isArray(_0x4f2237?.results)
      ? _0x4f2237.results[0]
      : _0x4f2237?.results && typeof _0x4f2237.results === 'object'
        ? _0x4f2237.results
        : null,
    _0x473e27 = _0x4f2237?.result && typeof _0x4f2237.result === 'object' ? _0x4f2237.result : null,
    _0x233c79 = _0x4f2237?.output && typeof _0x4f2237.output === 'object' ? _0x4f2237.output : null;
  return String(
    _0x58213f?.status ||
      _0x4f2237?.status ||
      _0x4f2237?.taskStatus ||
      _0x4f2237?.task_status ||
      _0x4f2237?.data?.status ||
      _0x473e27?.status ||
      _0x473e27?.taskStatus ||
      _0x473e27?.task_status ||
      _0x233c79?.status ||
      _0x233c79?.taskStatus ||
      _0x233c79?.task_status ||
      _0x1daea8?.status ||
      _0x4f2237?.state ||
      _0x4f2237?.phase ||
      '',
  )
    .trim()
    .toLowerCase();
}
function isAsyncVideoTaskFailureStatus(_0x53deb0) {
  return ['failed', 'fail', 'error', 'cancelled', 'canceled', 'expired'].includes(
    String(_0x53deb0 || '')
      .trim()
      .toLowerCase(),
  );
}
function stringifyTaskFailureValue(_0xb94659) {
  if (_0xb94659 == null) return '';
  if (typeof _0xb94659 === 'string') return _0xb94659.trim();
  if (typeof _0xb94659 === 'number' || typeof _0xb94659 === 'boolean') return String(_0xb94659);
  if (typeof _0xb94659 === 'object') {
    const _0x231f86 =
      _0xb94659.message ||
      _0xb94659.errorMessage ||
      _0xb94659.error_message ||
      _0xb94659.detail ||
      _0xb94659.reason ||
      _0xb94659.type ||
      _0xb94659.status ||
      _0xb94659.code;
    if (_0x231f86) return stringifyTaskFailureValue(_0x231f86);
    try {
      return JSON.stringify(_0xb94659);
    } catch {
      return String(_0xb94659 || '').trim();
    }
  }
  return String(_0xb94659 || '').trim();
}
function extractAsyncVideoTaskFailureReason(_0x1e4241) {
  const _0x260a68 = [
    _0x1e4241?.error?.message,
    _0x1e4241?.error?.error?.message,
    _0x1e4241?.errorMessage,
    _0x1e4241?.error_message,
    _0x1e4241?.message,
    _0x1e4241?.failedReason,
    _0x1e4241?.failReason,
    _0x1e4241?.failure_reason,
    _0x1e4241?.data?.error?.message,
    _0x1e4241?.data?.error?.error?.message,
    _0x1e4241?.data?.errorMessage,
    _0x1e4241?.data?.error_message,
    _0x1e4241?.data?.message,
    _0x1e4241?.data?.failedReason,
    _0x1e4241?.data?.failReason,
    _0x1e4241?.data?.failure_reason,
    _0x1e4241?.result?.error?.message,
    _0x1e4241?.result?.errorMessage,
    _0x1e4241?.result?.message,
    _0x1e4241?.rawText,
  ];
  for (const _0x5417dc of _0x260a68) {
    const _0x193747 = stringifyTaskFailureValue(_0x5417dc);
    if (_0x193747) return _0x193747;
  }
  return (
    stringifyTaskFailureValue(_0x1e4241?.error) ||
    stringifyTaskFailureValue(_0x1e4241?.data?.error) ||
    stringifyTaskFailureValue(_0x1e4241?.result?.error) ||
    ''
  );
}
function isLikelyVideoUrl(_0x2e8404) {
  const _0x3dfcc2 = String(_0x2e8404 || '').trim();
  if (!_0x3dfcc2) return false;
  if (!/^https?:\/\//i.test(_0x3dfcc2) && !_0x3dfcc2.startsWith('/')) return false;
  return /\.(mp4|mov|webm|mkv|avi|m4v|m3u8)(\?|#|$)/i.test(_0x3dfcc2);
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
function inferVideoResultMediaKind(_0x418312 = {}, _0x131db6 = '') {
  const _0x25bd17 = String(_0x131db6 || '').toLowerCase();
  if (/(^|[_-])video($|[_-])/.test(_0x25bd17) || _0x25bd17 === 'videourl') return 'video';
  if (/(^|[_-])audio($|[_-])/.test(_0x25bd17) || _0x25bd17 === 'audiourl') return 'audio';
  if (/(^|[_-])(image|img|thumb|thumbnail|poster|cover)($|[_-])/.test(_0x25bd17)) return 'image';
  if (!_0x418312 || typeof _0x418312 !== 'object' || Array.isArray(_0x418312)) return '';
  for (const _0x3f3e54 of RESULT_MEDIA_KIND_FIELDS) {
    const _0x450d9e = String(_0x418312[_0x3f3e54] || '')
      .trim()
      .toLowerCase();
    if (!_0x450d9e) continue;
    if (/video|mp4|mov|webm|mkv|avi|m4v|m3u8/.test(_0x450d9e)) return 'video';
    if (/audio|mp3|wav|aac|m4a|flac|ogg/.test(_0x450d9e)) return 'audio';
    if (/image|png|jpe?g|webp|gif/.test(_0x450d9e)) return 'image';
  }
  return '';
}
function extractVideoResultEntries(_0x9e1bc9) {
  const _0x1abbc7 = [],
    _0x3a90bd = new WeakSet(),
    _0x3d23d6 = [
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
    _0x1c94a7 = ['thumbUrl', 'thumbnailUrl', 'thumbnail_url', 'posterUrl', 'poster_url'],
    _0x557b3d = (_0x477fe3, _0x9b4804 = '') => {
      if (!_0x477fe3 || typeof _0x477fe3 !== 'object' || Array.isArray(_0x477fe3))
        return String(_0x9b4804 || '').trim();
      for (const _0x512fdd of _0x1c94a7) {
        const _0x35eac9 = String(_0x477fe3[_0x512fdd] || '').trim();
        if (_0x35eac9) return _0x35eac9;
      }
      return String(_0x9b4804 || '').trim();
    },
    _0x122381 = (_0x59dfa7, _0x386139 = {}, _0x52898d = '') => {
      if (_0x59dfa7 == null) return;
      if (Array.isArray(_0x59dfa7)) {
        _0x59dfa7.forEach((_0x1e2dbc) => _0x122381(_0x1e2dbc, _0x386139, _0x52898d));
        return;
      }
      if (typeof _0x59dfa7 === 'object') {
        _0x3b78fd(_0x59dfa7, _0x386139);
        return;
      }
      const _0x4c38f2 = String(_0x59dfa7 || '').trim();
      if (!_0x4c38f2) return;
      _0x1abbc7.push({
        videoUrl: _0x4c38f2,
        thumbUrl: _0x557b3d(_0x386139),
        mediaKind: inferVideoResultMediaKind(_0x386139, _0x52898d),
      });
    },
    _0x3b78fd = (_0x14f5d9, _0x5d1bc6 = {}) => {
      if (_0x14f5d9 == null) return;
      if (Array.isArray(_0x14f5d9)) {
        _0x14f5d9.forEach((_0x56eaf2) => _0x3b78fd(_0x56eaf2, _0x5d1bc6));
        return;
      }
      if (typeof _0x14f5d9 !== 'object') return;
      if (_0x3a90bd.has(_0x14f5d9)) return;
      _0x3a90bd.add(_0x14f5d9);
      const _0x124db3 = {
        ..._0x5d1bc6,
        ..._0x14f5d9,
        thumbUrl: _0x557b3d(_0x14f5d9, _0x557b3d(_0x5d1bc6)),
        mediaKind: inferVideoResultMediaKind(_0x14f5d9) || inferVideoResultMediaKind(_0x5d1bc6),
      };
      (_0x3d23d6.forEach((_0x462c00) => {
        Object.prototype.hasOwnProperty.call(_0x14f5d9, _0x462c00) &&
          _0x122381(_0x14f5d9[_0x462c00], _0x124db3, _0x462c00);
      }),
        Object.entries(_0x14f5d9).forEach(([_0x15ee4e, _0x32f35e]) => {
          if (_0x3d23d6.includes(_0x15ee4e) || _0x1c94a7.includes(_0x15ee4e)) return;
          if (_0x32f35e && typeof _0x32f35e === 'object') _0x3b78fd(_0x32f35e, _0x124db3);
        }));
    };
  _0x3b78fd(_0x9e1bc9);
  const _0x4059d8 = [],
    _0x95c2ad = new Set();
  for (const _0x28cb44 of _0x1abbc7) {
    const _0x1118cf = String(_0x28cb44?.videoUrl || '').trim();
    if (!_0x1118cf || _0x95c2ad.has(_0x1118cf)) continue;
    _0x95c2ad.add(_0x1118cf);
    const _0x2012fb = String(_0x28cb44?.thumbUrl || '').trim();
    _0x4059d8.push({
      videoUrl: _0x1118cf,
      ...(_0x2012fb ? { thumbUrl: _0x2012fb } : {}),
      mediaKind: String(_0x28cb44?.mediaKind || '').trim(),
    });
  }
  const _0x2f00e9 = _0x4059d8.filter(
      (_0x33ecdc) => _0x33ecdc.mediaKind === 'video' || isLikelyVideoUrl(_0x33ecdc.videoUrl),
    ),
    _0x47a884 = _0x2f00e9.length ? _0x2f00e9 : _0x4059d8;
  return _0x47a884.map(({ mediaKind: _0x40f6a3, ..._0x468cad }) => _0x468cad);
}
function resolveAsyncVideoTaskId(_0x2a5f38, _0x536509 = null) {
  const _0x177bea = resolveMappedResponseValue(_0x2a5f38, _0x536509?.taskIdPath);
  if (_0x177bea) return _0x177bea;
  if (typeof _0x2a5f38?.data === 'string' || typeof _0x2a5f38?.data === 'number') {
    const _0x45ce75 = String(_0x2a5f38.data).trim();
    if (looksLikeTaskToken(_0x45ce75)) return _0x45ce75;
  }
  if (typeof _0x2a5f38 === 'string' || typeof _0x2a5f38 === 'number') {
    const _0x5273a9 = String(_0x2a5f38).trim();
    if (looksLikeTaskToken(_0x5273a9)) return _0x5273a9;
  }
  const _0x18ac59 = Array.isArray(_0x2a5f38?.data)
      ? _0x2a5f38.data[0]
      : _0x2a5f38?.data && typeof _0x2a5f38.data === 'object'
        ? _0x2a5f38.data
        : Array.isArray(_0x2a5f38?.results)
          ? _0x2a5f38.results[0]
          : _0x2a5f38?.results && typeof _0x2a5f38.results === 'object'
            ? _0x2a5f38.results
            : null,
    _0x1c6d94 = _0x2a5f38?.result && typeof _0x2a5f38.result === 'object' ? _0x2a5f38.result : null,
    _0x341272 = _0x2a5f38?.output && typeof _0x2a5f38.output === 'object' ? _0x2a5f38.output : null,
    _0x3965e4 = _0x2a5f38?.response && typeof _0x2a5f38.response === 'object' ? _0x2a5f38.response : null,
    _0x59ccff =
      _0x18ac59?.task_id ||
      _0x18ac59?.taskId ||
      _0x18ac59?.id ||
      _0x2a5f38?.task_id ||
      _0x2a5f38?.taskId ||
      _0x2a5f38?.id ||
      _0x2a5f38?.data?.task_id ||
      _0x2a5f38?.data?.taskId ||
      _0x2a5f38?.data?.id ||
      _0x1c6d94?.task_id ||
      _0x1c6d94?.taskId ||
      _0x1c6d94?.id ||
      _0x341272?.task_id ||
      _0x341272?.taskId ||
      _0x341272?.id ||
      _0x3965e4?.task_id ||
      _0x3965e4?.taskId ||
      _0x3965e4?.id ||
      findFirstDeepValueByKeyPattern(_0x2a5f38, /^(task_?id|taskid|request_?id|requestid)$/i) ||
      findFirstDeepValueByKeyPattern(_0x2a5f38, /^id$/i) ||
      '';
  return String(_0x59ccff || '').trim();
}
function extractVideoUrls(_0x33a338, _0x43c06f = null) {
  const _0x2dd5d8 = resolveMappedResponseValues(_0x33a338, _0x43c06f?.resultPaths);
  if (_0x2dd5d8.length > 0) return _0x2dd5d8;
  const _0x4d1f0b = extractVideoResultEntries(_0x33a338);
  if (_0x4d1f0b.length > 0) return _0x4d1f0b.map((_0x533786) => _0x533786.videoUrl);
  const _0x256555 = [],
    _0x1e7cac = (_0x5c8b49) => {
      if (_0x5c8b49 == null) return;
      if (Array.isArray(_0x5c8b49)) {
        for (const _0x4e5b2f of _0x5c8b49) _0x1e7cac(_0x4e5b2f);
        return;
      }
      if (typeof _0x5c8b49 === 'object') {
        _0x1e7cac(
          _0x5c8b49.videoUrl ||
            _0x5c8b49.video_url ||
            _0x5c8b49.url ||
            _0x5c8b49.fileUrl ||
            _0x5c8b49.video ||
            _0x5c8b49.output ||
            _0x5c8b49.mediaUrl,
        );
        return;
      }
      const _0x5903ec = String(_0x5c8b49 || '').trim();
      if (_0x5903ec) _0x256555.push(_0x5903ec);
    },
    _0x852ad0 = (_0x46b789) => {
      const _0x4a43b5 = [],
        _0x25a438 = new Set();
      let _0x18fd41 = 0;
      const _0x12c33e = (_0x2b4404, _0x147f63) => {
        if (_0x18fd41 > 0x1f40) return;
        if (_0x147f63 > 6) return;
        _0x18fd41++;
        if (!_0x2b4404) return;
        if (typeof _0x2b4404 === 'string') {
          const _0x163a4f = _0x2b4404.trim();
          isLikelyVideoUrl(_0x163a4f) &&
            !_0x25a438.has(_0x163a4f) &&
            (_0x25a438.add(_0x163a4f), _0x4a43b5.push(_0x163a4f));
          return;
        }
        if (Array.isArray(_0x2b4404)) {
          for (const _0x19167b of _0x2b4404) _0x12c33e(_0x19167b, _0x147f63 + 1);
          return;
        }
        if (typeof _0x2b4404 === 'object') {
          for (const _0x4ec4d4 of Object.values(_0x2b4404)) _0x12c33e(_0x4ec4d4, _0x147f63 + 1);
        }
      };
      return (_0x12c33e(_0x46b789, 0), _0x4a43b5);
    };
  if (_0x33a338.result?.videos && Array.isArray(_0x33a338.result.videos)) {
    for (const _0x5315b6 of _0x33a338.result.videos) _0x1e7cac(_0x5315b6?.url || _0x5315b6);
  } else {
    if (_0x33a338.status === 'succeeded' && _0x33a338.results) {
      for (const _0x5e4949 of _0x33a338.results) _0x1e7cac(_0x5e4949);
    } else {
      if (_0x33a338.data?.[0]?.url) {
        for (const _0x105ae6 of _0x33a338.data) _0x1e7cac(_0x105ae6);
      } else {
        if (_0x33a338.data?.[0]?.fileUrl) {
          for (const _0x564ae1 of _0x33a338.data) _0x1e7cac(_0x564ae1?.fileUrl);
        } else {
          if (_0x33a338.data?.results) {
            for (const _0x1ea47b of _0x33a338.data.results) _0x1e7cac(_0x1ea47b);
          } else {
            if (_0x33a338.data?.[0]?.video) {
              for (const _0x5aa69b of _0x33a338.data) _0x1e7cac(_0x5aa69b?.video);
            } else {
              if (Array.isArray(_0x33a338.data)) {
                for (const _0x543ad4 of _0x33a338.data) _0x1e7cac(_0x543ad4);
              } else {
                if (Array.isArray(_0x33a338.videos)) {
                  for (const _0x17fd01 of _0x33a338.videos) _0x1e7cac(_0x17fd01);
                } else {
                  if (_0x33a338.status === 'COMPLETED' && _0x33a338.results) {
                    for (const _0x13dee6 of _0x33a338.results) _0x1e7cac(_0x13dee6);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  const _0x25dbc6 = _0x256555.filter(Boolean),
    _0x4d2e50 = _0x25dbc6.filter(isLikelyVideoUrl);
  if (_0x4d2e50.length > 0) return Array.from(new Set(_0x4d2e50));
  if (_0x25dbc6.length > 0) return Array.from(new Set(_0x25dbc6));
  return _0x852ad0(_0x33a338);
}
function extractVideoEntries(_0x501d4a, _0x4cdc39 = null) {
  const _0x5ef4ca = extractVideoResultEntries(_0x501d4a);
  if (_0x5ef4ca.length > 0) return _0x5ef4ca;
  const _0x51f43a = resolveMappedResponseValues(_0x501d4a, _0x4cdc39?.resultPaths);
  if (_0x51f43a.length > 0)
    return _0x51f43a
      .map((_0x213d8f) => ({ videoUrl: String(_0x213d8f || '').trim() }))
      .filter((_0x551d60) => _0x551d60.videoUrl);
  return extractVideoUrls(_0x501d4a, _0x4cdc39)
    .map((_0x4c7626) => ({ videoUrl: String(_0x4c7626 || '').trim() }))
    .filter((_0x5b70ed) => _0x5b70ed.videoUrl);
}
function processVideoTaskResult(_0x4f3757, _0x1a4328, _0xba6a4f = {}) {
  const _0x5bfced = extractVideoEntries(_0x4f3757, _0xba6a4f?.responseMapping);
  if (_0x5bfced.length === 0) {
    const _0x4b007f = parseError(_0x1a4328, _0x4f3757, 200);
    if (_0x4b007f) throw _0x4b007f;
    const _0x33830b = parseTaskError(_0x1a4328, _0x4f3757);
    if (_0x33830b)
      throw new ApiError({
        type: 'TASK_FAILED',
        provider: _0x1a4328,
        message: _0x33830b.getUserMessage(),
        retryable: false,
      });
    const _0x1eed3b = extractAsyncVideoTaskFailureReason(_0x4f3757);
    if (_0x1eed3b)
      throw new ApiError({ type: 'TASK_FAILED', provider: _0x1a4328, message: _0x1eed3b, retryable: false });
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: _0x1a4328,
      message: '无法从服务器响应中提取视频地址',
      raw: _0x4f3757,
      retryable: false,
    });
  }
  return {
    videoUrl: _0x5bfced[0].videoUrl,
    thumbUrl: _0x5bfced[0].thumbUrl,
    isBatch: _0x5bfced.length > 1,
    videos: _0x5bfced,
  };
}
function extractVideoUrl(_0x1ae42a) {
  return _0x1ae42a.videoUrl || _0x1ae42a.url || (_0x1ae42a.data && _0x1ae42a.data[0]?.url) || null;
}
function _normalizeRemoteUrl(_0x1f5f76) {
  const _0x519abb = String(_0x1f5f76 || '').trim();
  if (!_0x519abb) return '';
  if (_0x519abb.startsWith('/')) return _0x519abb;
  if (/^data:/i.test(_0x519abb)) return _0x519abb;
  if (/^blob:/i.test(_0x519abb)) return _0x519abb;
  if (_0x519abb.startsWith('//')) return 'https:' + _0x519abb;
  if (/^https?:\/\//i.test(_0x519abb)) return _0x519abb;
  return 'https://' + _0x519abb.replace(/^\/+/, '');
}
function _guessExtFromUrl(_0x49536c, _0x22c1e0) {
  try {
    const _0x49a98c = new URL(String(_0x49536c || ''), location?.href || undefined),
      _0x1c0151 = String(_0x49a98c.pathname || ''),
      _0x2d0c58 = _0x1c0151.split('/').filter(Boolean).pop() || '',
      _0x3b5fae = _0x2d0c58.lastIndexOf('.');
    if (_0x3b5fae > 0 && _0x3b5fae < _0x2d0c58.length - 1) {
      const _0x47bd43 = _0x2d0c58.slice(_0x3b5fae + 1).toLowerCase();
      if (/^[a-z0-9]{1,5}$/.test(_0x47bd43)) return _0x47bd43;
    }
  } catch {}
  return _0x22c1e0;
}
function _toLocalPathIfSameOrigin(_0x39bb08) {
  return urlToLocalPath(_0x39bb08);
}
async function _trySaveOutputByClientDownload(_0x22c13f, _0x576e03) {
  const _0x505a64 = String(_0x22c13f || '').trim();
  if (!(_0x505a64.startsWith('http://') || _0x505a64.startsWith('https://')))
    return { localPath: null, error: 'invalid url' };
  const _0x20291a = new AbortController(),
    _0x261ea6 = setTimeout(() => _0x20291a.abort(), 0x1d4c0);
  let _0x1102f1 = null;
  try {
    _0x1102f1 = await fetchRemoteBlob(_0x505a64, { signal: _0x20291a.signal });
  } catch (_0x2637ff) {
    const _0x3ee0e5 = _0x2637ff instanceof Error ? _0x2637ff.message : String(_0x2637ff || '');
    return { localPath: null, error: _0x3ee0e5 || 'client download failed' };
  } finally {
    clearTimeout(_0x261ea6);
  }
  if (!_0x1102f1) return { localPath: null, error: 'empty blob' };
  const _0x544a81 =
      String(_0x576e03 || '')
        .trim()
        .toLowerCase() || 'bin',
    _0x15d905 = new URLSearchParams({ ext: _0x544a81 });
  try {
    const _0x266c43 = await requester({
      url: '/api/v2/save_output?' + _0x15d905.toString(),
      method: 'POST',
      provider: 'local',
      timeout: 8 * 60 * 0x3e8,
      headers: { 'Content-Type': 'application/octet-stream' },
      body: _0x1102f1,
    });
    return { localPath: pickResultLocalPath(_0x266c43) || null, error: null };
  } catch (_0x24fd9f) {
    const _0x57a795 = _0x24fd9f instanceof Error ? _0x24fd9f.message : String(_0x24fd9f || '');
    return { localPath: null, error: _0x57a795 || 'save failed' };
  }
}
async function trySaveOutputFromUrl(_0xfbc122, _0x45d4d1 = {}) {
  const _0x5c1b27 = _toLocalPathIfSameOrigin(_0xfbc122);
  if (_0x5c1b27) return { localPath: _0x5c1b27, error: null };
  const _0x27e0a8 = _normalizeRemoteUrl(_0xfbc122);
  if (!_0x27e0a8) return { localPath: null, error: 'empty url' };
  const _0x15ede6 = _guessExtFromUrl(_0x27e0a8, 'mp4');
  try {
    const _0x4aa7e4 = await requester({
      url: '/api/v2/save_output_from_url',
      method: 'POST',
      provider: 'local',
      timeout: 8 * 60 * 0x3e8,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: _0x27e0a8,
        ext: _0x15ede6,
        maxBytes: 0x400 * 0x400 * 0x400,
        dedupeKey: _0x45d4d1?.dedupeKey,
      }),
    });
    return { localPath: pickResultLocalPath(_0x4aa7e4) || null, error: null };
  } catch (_0x352680) {
    const _0x4c1804 = _0x352680 instanceof Error ? String(_0x352680.message || '') : String(_0x352680 || ''),
      _0x166642 = _0x352680 instanceof ApiError ? _0x352680.status : null,
      _0x3d982c =
        _0x166642 === 0x190 ||
        _0x166642 === 0x191 ||
        _0x166642 === 0x193 ||
        _0x166642 === 0x1f6 ||
        _0x166642 === 0x1f8;
    if (_0x3d982c) {
      const _0x577d1b = await _trySaveOutputByClientDownload(_0x27e0a8, _0x15ede6);
      if (_0x577d1b.localPath) return _0x577d1b;
      if (_0x577d1b.error)
        return {
          localPath: null,
          error: '' + _0x4c1804 + (_0x577d1b.error ? '；浏览器兜底失败：' + _0x577d1b.error : ''),
        };
    }
    return { localPath: null, error: _0x4c1804 || 'save failed' };
  }
}
function getVideoResultSourceUrl(_0x4416fc) {
  if (typeof _0x4416fc === 'string') return String(_0x4416fc || '').trim();
  if (!_0x4416fc || typeof _0x4416fc !== 'object' || Array.isArray(_0x4416fc)) return '';
  return String(
    _0x4416fc.videoUrl || _0x4416fc.url || _0x4416fc.localUrl || localPathToUrl(_0x4416fc.localPath) || '',
  ).trim();
}
function buildPostProcessedVideoItem(_0x5c0001, _0x447df9 = {}) {
  const _0x5e41f0 =
      _0x5c0001 && typeof _0x5c0001 === 'object' && !Array.isArray(_0x5c0001)
        ? _0x5c0001
        : { videoUrl: _0x5c0001 },
    _0xa3f917 = getVideoResultSourceUrl(_0x5e41f0),
    _0x16a7ab = pickResultLocalPath(_0x447df9) || pickResultLocalPath(_0x5e41f0),
    _0x3adbff = localPathToUrl(_0x16a7ab),
    _0xf664b2 = _0x3adbff || _0xa3f917,
    _0x51a6da = { ..._0x5e41f0, videoUrl: _0xf664b2 };
  _0xa3f917 &&
    _0xa3f917 !== _0xf664b2 &&
    !String(_0x51a6da.sourceUrl || '').trim() &&
    (_0x51a6da.sourceUrl = _0xa3f917);
  if (_0x16a7ab) _0x51a6da.localPath = _0x16a7ab;
  else delete _0x51a6da.localPath;
  for (const _0x13073e of [
    'displayLocalPath',
    'posterLocalPath',
    'thumbLocalPath',
    'videoProxyStatus',
    'videoCodec',
  ]) {
    if (_0x447df9?.[_0x13073e]) _0x51a6da[_0x13073e] = _0x447df9[_0x13073e];
  }
  if (_0x447df9?.error) _0x51a6da.saveError = _0x447df9.error;
  else delete _0x51a6da.saveError;
  return _0x51a6da;
}
async function postProcessVideoResult(_0x396bc3, _0x22ed16 = {}) {
  if (!_0x396bc3) return _0x396bc3;
  if (Array.isArray(_0x396bc3.videos)) {
    const _0x23a91b = [];
    for (const _0x4f2a37 of _0x396bc3.videos) {
      const _0x4ff189 = getVideoResultSourceUrl(_0x4f2a37);
      if (!_0x4ff189) continue;
      const _0x3b6a92 = await trySaveOutputFromUrl(_0x4ff189, {
        dedupeKey: _0x22ed16?.taskKey ? _0x22ed16.taskKey + ':' + _0x4ff189 : undefined,
      });
      _0x23a91b.push(buildPostProcessedVideoItem(_0x4f2a37, _0x3b6a92));
    }
    if (_0x23a91b.length === 0 && getVideoResultSourceUrl(_0x396bc3)) {
      const _0x153eff = { ..._0x396bc3 };
      return (
        delete _0x153eff.isBatch,
        delete _0x153eff.videos,
        await postProcessVideoResult(_0x153eff, _0x22ed16)
      );
    }
    if (_0x23a91b.length === 0)
      throw new ApiError({
        type: 'PARSE_ERROR',
        provider: _0x22ed16?.providerId || 'unknown',
        message: '无法从服务器响应中提取视频地址',
        raw: _0x396bc3,
        retryable: false,
      });
    return {
      isBatch: Boolean(_0x396bc3.isBatch || _0x23a91b.length > 1),
      videos: _0x23a91b,
      videoUrl: _0x23a91b[0]?.videoUrl,
      sourceUrl: _0x23a91b[0]?.sourceUrl,
      thumbUrl: _0x23a91b[0]?.thumbUrl,
      localPath: _0x23a91b[0]?.localPath,
      displayLocalPath: _0x23a91b[0]?.displayLocalPath,
      posterLocalPath: _0x23a91b[0]?.posterLocalPath,
      videoProxyStatus: _0x23a91b[0]?.videoProxyStatus,
      videoCodec: _0x23a91b[0]?.videoCodec,
      saveError: _0x23a91b[0]?.saveError,
    };
  }
  if (_0x396bc3.videoUrl) {
    const _0x17215f = await trySaveOutputFromUrl(_0x396bc3.videoUrl, {
      dedupeKey: _0x22ed16?.taskKey ? _0x22ed16.taskKey + ':' + _0x396bc3.videoUrl : undefined,
    });
    return buildPostProcessedVideoItem(_0x396bc3, _0x17215f);
  }
  return _0x396bc3;
}
export async function generateVideo(_0x27c014, _0x2c6792) {
  const _0x4365a1 = resolveVideoExecution(_0x27c014),
    _0x3e4b70 = resolveVideoProviderId(_0x27c014, _0x4365a1),
    _0x3cbd0c = _0x4365a1?.executionManifest,
    _0x5426b8 = _0x3cbd0c?.adapterType === 'workflow';
  if (_0x3cbd0c?.adapterType === 'localRuntime' && _0x3cbd0c?.runtime === 'dreaminaVideo') {
    const _0x180ff9 = {
      ..._0x27c014,
      prompt: applyCameraAngleToPrompt(_0x27c014.prompt, _0x27c014.cameraAngle),
    };
    return await runDreaminaVideoGeneration(_0x180ff9, _0x2c6792);
  }
  const _0x41173e = await buildGenerateVideoRequest(_0x27c014),
    _0x209a57 = _0x41173e?.responseMapping || null,
    _0x56b9b2 = {
      ...(_0x2c6792 || {}),
      ...(_0x209a57 ? { responseMapping: _0x209a57 } : {}),
      ...(_0x41173e?.taskPolling ? { taskPolling: _0x41173e.taskPolling } : {}),
    },
    _0x122ba7 = { ...(_0x41173e.headers || {}) },
    _0x49b380 = String(_0x27c014?.installId || '').trim();
  if (_0x49b380) _0x122ba7['X-AIC-Install-Id'] = _0x49b380;
  let _0xaeb2dc,
    _0x4951d4 = '',
    _0x45e9e1 = null;
  try {
    if (_0x5426b8) {
      const _0x177500 = await requester({
        url: _0x41173e.url,
        method: 'POST',
        provider: _0x3e4b70,
        timeout: GENERATION_TIMEOUT,
        signal: _0x2c6792?.signal,
        headers: _0x122ba7,
        body: JSON.stringify(_0x41173e.body),
        responseType: 'text',
        returnMeta: true,
      });
      ((_0x4951d4 = String(_0x177500?.data ?? '')),
        (_0x45e9e1 = _0x177500?.headers || null),
        (_0xaeb2dc = parseVideoResponseData(_0x4951d4)));
    } else
      _0xaeb2dc = await requester({
        url: _0x41173e.url,
        method: 'POST',
        provider: _0x3e4b70,
        timeout: GENERATION_TIMEOUT,
        signal: _0x2c6792?.signal,
        headers: _0x122ba7,
        body: JSON.stringify(_0x41173e.body),
      });
  } catch (_0x301238) {
    if (_0x301238 instanceof ApiError) throw _0x301238;
    throw parseNetworkError(_0x3e4b70, _0x301238, GENERATION_TIMEOUT);
  }
  let _0x17f5df = null,
    _0x10245c = '';
  if (_0x5426b8) {
    if (String(_0xaeb2dc?.code || '') === 'SUBSCRIPTION_REQUIRED') {
      const _0x51a4bd = new Error(_0xaeb2dc?.message || '该模型为 VIP，请先激活 CDKEY/订阅');
      ((_0x51a4bd.code = 'SUBSCRIPTION_REQUIRED'),
        (_0x51a4bd.contactText = _0xaeb2dc?.contactText || ''),
        (_0x51a4bd.contactUrl = _0xaeb2dc?.contactUrl || ''));
      throw _0x51a4bd;
    }
    const _0x33532e = typeof _0xaeb2dc?.code === 'number' ? _0xaeb2dc.code : null;
    if (_0x33532e !== null && _0x33532e !== 0) throw parseError(_0x3e4b70, _0xaeb2dc, 200);
    const _0x47654c = resolveRunningHubVideoTaskId(_0xaeb2dc, _0x4951d4, _0x45e9e1, _0x209a57) || null;
    if (_0x47654c) {
      const _0x469077 = String(_0x47654c);
      _0x10245c = _0x3e4b70 + ':video:' + _0x469077;
      const _0x3a2467 = _0x41173e.useOpenapiQuery === true || _0x41173e.url === '/api/v2/proxy/image';
      (_0x2c6792?.onTaskMeta?.({ taskId: _0x469077, useOpenapiQuery: _0x3a2467 }),
        _0x2c6792?.onTaskId?.(_0x469077));
      const _0x5344f8 = await pollRunningHubVideoTask(_0x469077, _0x27c014, _0x3e4b70, {
        ..._0x56b9b2,
        useOpenapiQuery: _0x3a2467,
      });
      _0x17f5df = processVideoTaskResult(_0x5344f8, _0x3e4b70, _0x56b9b2);
    }
  }
  if (!_0x17f5df) {
    const _0x3cf0c7 = resolveAsyncVideoTaskId(_0xaeb2dc, _0x209a57);
    if (_0x3cf0c7) {
      const _0x992783 = String(_0x3cf0c7);
      _0x10245c = _0x3e4b70 + ':video:' + _0x992783;
      const _0x13687b = getProviderConfig(_0x3e4b70),
        _0x5e4474 =
          _0x41173e.useOpenapiQuery === true ||
          (_0x3e4b70 === 'runninghub' && _0x41173e.url === '/api/v2/proxy/image'),
        _0x14739d =
          _0x27c014.apiKey || (_0x3e4b70 === 'runninghub' ? _0x13687b.modelApiKey : '') || _0x13687b.apiKey;
      (_0x2c6792?.onTaskMeta?.({
        taskId: _0x992783,
        provider: _0x3e4b70,
        kind: 'video',
        ...(_0x5e4474 ? { useOpenapiQuery: true } : {}),
      }),
        _0x2c6792?.onTaskId?.(_0x992783));
      if (_0x5e4474) {
        const _0x233de1 = await pollRunningHubVideoTask(
          _0x992783,
          { ..._0x27c014, apiKey: _0x14739d },
          _0x3e4b70,
          { ..._0x56b9b2, useOpenapiQuery: true },
        );
        _0x17f5df = processVideoTaskResult(_0x233de1, _0x3e4b70, _0x56b9b2);
      } else _0x17f5df = await pollVideoTask(_0x992783, _0x3e4b70, _0x14739d, _0x56b9b2);
    }
  }
  if (!_0x17f5df) {
    const _0x368cd4 = extractVideoUrls(_0xaeb2dc, _0x209a57)[0] || extractVideoUrl(_0xaeb2dc);
    if (!_0x368cd4) {
      const _0x14a102 = parseError(_0x3e4b70, _0xaeb2dc, 200);
      if (_0x14a102) throw new Error(_0x14a102.getUserMessage());
      throw new ApiError({
        type: 'PARSE_ERROR',
        provider: _0x3e4b70,
        message: '无法获取视频地址',
        raw: _0xaeb2dc,
        retryable: false,
      });
    }
    _0x17f5df = { videoUrl: _0x368cd4 };
  }
  return await postProcessVideoResult(_0x17f5df, {
    providerId: _0x3e4b70,
    ...(_0x10245c ? { taskKey: _0x10245c } : {}),
  });
}
export const __test__ = {
  extractVideoEntries: extractVideoEntries,
  extractVideoUrls: extractVideoUrls,
  processVideoTaskResult: processVideoTaskResult,
};
