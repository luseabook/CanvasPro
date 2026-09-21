import { requester } from './requester.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { ApiError, ErrorType, parseError, parseTaskError, parseNetworkError } from './errors/index.js';
const DETECTION_TIMEOUT = 5 * 60 * 0x3e8;
export async function buildSceneDetectionRequest(_0x314a44) {
  await ensureConfig();
  const _0x10b6a7 = _0x314a44.provider || 'grsai',
    _0x4d51ed = getProviderConfig(_0x10b6a7),
    _0x5f4d5a = _0x4d51ed.apiUrl.replace(/\/+$/, ''),
    _0x912fa = _0x314a44.apiKey || _0x4d51ed.apiKey;
  if (!_0x912fa)
    throw ApiError.authError(
      _0x10b6a7,
      null,
      'API Key 未配置（厂商：' + _0x10b6a7 + '），无法发起场景检测请求',
    );
  if (_0x10b6a7 === 'grsai')
    return {
      url: '/api/v2/proxy/image',
      headers: { 'Content-Type': 'application/json' },
      body: {
        apiUrl: _0x5f4d5a + '/v1/video/scene-detection',
        apiKey: _0x912fa,
        videoUrl: _0x314a44.videoUrl,
        sensitivity: _0x314a44.sensitivity || 0.5,
      },
    };
  if (_0x10b6a7 === 'runninghubwf')
    return {
      url: '/api/v2/runninghubwf/scene-detection',
      headers: { 'Content-Type': 'application/json' },
      body: { apiKey: _0x912fa, videoUrl: _0x314a44.videoUrl, sensitivity: _0x314a44.sensitivity || 0.5 },
    };
  throw new ApiError({
    type: 'UNSUPPORTED_PROVIDER',
    provider: _0x10b6a7,
    message: '暂不支持厂商 ' + _0x10b6a7 + ' 的场景检测',
    retryable: false,
  });
}
async function pollSceneDetectionTask(_0x47a26f, _0x1b6ab2, _0x4e887b) {
  const _0x4ae632 = getProviderConfig(_0x1b6ab2);
  for (let _0x11f12f = 0; _0x11f12f < 0x12c; _0x11f12f++) {
    await new Promise((_0xb416af) => setTimeout(_0xb416af, 0x7d0));
    const _0x3d4bf2 =
      _0x1b6ab2 === 'runninghubwf'
        ? '/api/v2/runninghubwf/query'
        : _0x4ae632.apiUrl + '/v1/tasks/' + _0x47a26f;
    try {
      const _0x1dfa2a = await requester({
          url: _0x3d4bf2,
          method: 'POST',
          provider: _0x1b6ab2,
          timeout: 0x7530,
          headers: { 'Content-Type': 'application/json' },
          body:
            _0x1b6ab2 === 'runninghubwf'
              ? JSON.stringify({ apiKey: _0x4e887b, taskId: _0x47a26f })
              : JSON.stringify({ apiUrl: _0x3d4bf2, apiKey: _0x4e887b }),
        }),
        _0x25a258 = _0x1dfa2a.data || _0x1dfa2a,
        _0x2421d9 = parseError(_0x1b6ab2, _0x25a258, 200);
      if (_0x2421d9) throw _0x2421d9;
      const _0x185e18 = (_0x25a258.status || '').toUpperCase();
      if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(_0x185e18)) return _0x25a258;
    } catch (_0x3ee18b) {
      if (_0x3ee18b instanceof ApiError) {
        if (
          _0x3ee18b.type === ErrorType.TASK_FAILED ||
          _0x3ee18b.type === ErrorType.TASK_TIMEOUT ||
          _0x3ee18b.type === ErrorType.AUTH_ERROR ||
          _0x3ee18b.type === ErrorType.FORBIDDEN ||
          _0x3ee18b.type === ErrorType.INVALID_PARAMS ||
          _0x3ee18b.type === ErrorType.INSUFFICIENT_BALANCE
        )
          throw _0x3ee18b;
      }
    }
  }
  throw ApiError.taskTimeout(_0x1b6ab2);
}
function extractSceneChanges(_0x3176e2) {
  if (_0x3176e2.result?.sceneChanges) return _0x3176e2.result.sceneChanges;
  else {
    if (_0x3176e2.data?.sceneChanges) return _0x3176e2.data.sceneChanges;
    else {
      if (_0x3176e2.sceneChanges) return _0x3176e2.sceneChanges;
    }
  }
  return [];
}
function processSceneDetectionResult(_0x4d8726, _0x2f9fc9) {
  const _0x39fd7a = extractSceneChanges(_0x4d8726);
  if (!Array.isArray(_0x39fd7a)) {
    const _0x32f755 = parseError(_0x2f9fc9, _0x4d8726, 200);
    if (_0x32f755) throw _0x32f755;
    const _0x549153 = parseTaskError(_0x2f9fc9, _0x4d8726);
    if (_0x549153)
      throw new ApiError({
        type: 'TASK_FAILED',
        provider: _0x2f9fc9,
        message: _0x549153.getUserMessage(),
        retryable: false,
      });
    const _0x52569e =
      _0x4d8726.error || _0x4d8726.errorMessage || _0x4d8726.message || _0x4d8726.failure_reason;
    if (_0x52569e)
      throw new ApiError({ type: 'TASK_FAILED', provider: _0x2f9fc9, message: _0x52569e, retryable: false });
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: _0x2f9fc9,
      message: '无法从服务器响应中提取场景检测结果',
      raw: _0x4d8726,
      retryable: false,
    });
  }
  return { sceneChanges: _0x39fd7a, sceneCount: _0x39fd7a.length + 1 };
}
export async function detectScenes(_0x3c05dc, _0x313f06) {
  const _0x5c6fa7 = _0x3c05dc.provider || 'grsai',
    _0x4e4783 = await buildSceneDetectionRequest(_0x3c05dc);
  let _0x1cc690;
  try {
    _0x1cc690 = await requester({
      url: _0x4e4783.url,
      method: 'POST',
      provider: _0x5c6fa7,
      timeout: DETECTION_TIMEOUT,
      headers: _0x4e4783.headers,
      body: JSON.stringify(_0x4e4783.body),
    });
  } catch (_0x12a283) {
    if (_0x12a283 instanceof ApiError) throw _0x12a283;
    throw parseNetworkError(_0x5c6fa7, _0x12a283, DETECTION_TIMEOUT);
  }
  let _0x206e9b = _0x1cc690,
    _0x51dfea = null;
  if (_0x206e9b.task_id || _0x206e9b.taskId) {
    const _0x43866b = _0x206e9b.task_id || _0x206e9b.taskId;
    _0x313f06?.onTaskId?.(String(_0x43866b));
    const _0xf29627 = getProviderConfig(_0x5c6fa7),
      _0x186719 = _0x3c05dc.apiKey || _0xf29627.apiKey,
      _0xbb579f = await pollSceneDetectionTask(_0x43866b, _0x5c6fa7, _0x186719);
    _0x51dfea = processSceneDetectionResult(_0xbb579f, _0x5c6fa7);
  } else _0x51dfea = processSceneDetectionResult(_0x206e9b, _0x5c6fa7);
  return _0x51dfea;
}
