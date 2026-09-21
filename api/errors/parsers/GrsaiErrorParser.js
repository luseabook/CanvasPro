import { ApiError, ErrorType } from '../ApiError.js';
const GRSAI_OFFICIAL_CODES = {
    0: null,
    '-22': { type: ErrorType.TASK_FAILED, message: '任务不存在', retryable: false },
  },
  GRSAI_HTTP_STATUS_MAP = {
    0x190: { type: ErrorType.INVALID_PARAMS, message: '请求参数错误', retryable: false },
    0x191: { type: ErrorType.AUTH_ERROR, message: 'API Key 无效或已过期', retryable: false },
    0x193: { type: ErrorType.FORBIDDEN, message: '没有访问权限', retryable: false },
    0x194: { type: ErrorType.MODEL_UNAVAILABLE, message: '模型或任务不存在', retryable: false },
    0x1ad: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁，请稍后重试', retryable: true },
    0x1f4: { type: ErrorType.SERVER_ERROR, message: '服务器内部错误，请稍后重试', retryable: true },
    0x1f6: { type: ErrorType.SERVICE_UNAVAILABLE, message: '网关错误，请稍后重试', retryable: true },
    0x1f7: { type: ErrorType.SERVICE_UNAVAILABLE, message: '服务暂时不可用，请稍后重试', retryable: true },
  };
function extractErrorCode(_0x1ee832, _0x44f624) {
  if (_0x1ee832?.code !== undefined && _0x1ee832?.code !== 0) return _0x1ee832.code;
  if (_0x44f624 >= 0x190) return _0x44f624;
  return null;
}
function extractErrorMessage(_0x267e17) {
  return _0x267e17?.msg || _0x267e17?.message || _0x267e17?.error || _0x267e17?.errorMessage || '';
}
export function parseError(_0x3099fa, _0x14222e) {
  if (!_0x3099fa) return null;
  const _0x412fe0 = extractErrorCode(_0x3099fa, _0x14222e),
    _0xe8280b = extractErrorMessage(_0x3099fa),
    _0x3206db = String(_0xe8280b).toUpperCase();
  if (_0x412fe0 === 0 || _0x412fe0 === '0') return null;
  if (GRSAI_OFFICIAL_CODES[_0x412fe0]) {
    const _0x1202a4 = GRSAI_OFFICIAL_CODES[_0x412fe0];
    return new ApiError({
      type: _0x1202a4.type,
      provider: 'grsai',
      code: _0x412fe0,
      message: _0xe8280b || _0x1202a4.message,
      status: _0x14222e,
      retryable: _0x1202a4.retryable,
    });
  }
  if (GRSAI_HTTP_STATUS_MAP[_0x14222e]) {
    const _0x5845af = GRSAI_HTTP_STATUS_MAP[_0x14222e];
    return new ApiError({
      type: _0x5845af.type,
      provider: 'grsai',
      code: _0x412fe0 || _0x14222e,
      message: _0xe8280b || _0x5845af.message,
      status: _0x14222e,
      retryable: _0x5845af.retryable,
    });
  }
  if (_0x3206db.includes('BALANCE') || _0x3206db.includes('余额'))
    return ApiError.insufficientBalance('grsai', _0x412fe0);
  if (_0x3206db.includes('AUTH') || _0x3206db.includes('API_KEY') || _0x3206db.includes('KEY'))
    return ApiError.authError('grsai', _0x412fe0, _0xe8280b);
  if (_0x3206db.includes('RATE') || _0x3206db.includes('LIMIT') || _0x3206db.includes('频繁'))
    return ApiError.rateLimit('grsai', _0x412fe0);
  if (_0x3206db.includes('CONTENT') || _0x3206db.includes('FILTER') || _0x3206db.includes('审核'))
    return ApiError.contentFiltered('grsai', _0xe8280b);
  if (_0x3206db.includes('NOT_FOUND') || _0x3206db.includes('不存在') || _0x412fe0 === -22)
    return new ApiError({
      type: ErrorType.TASK_FAILED,
      provider: 'grsai',
      code: _0x412fe0,
      message: _0xe8280b || '任务不存在',
      status: _0x14222e,
      retryable: false,
    });
  if (_0x14222e >= 0x190) return ApiError.fromHttpStatus(_0x14222e, 'grsai', _0xe8280b);
  if (_0x412fe0 !== null && _0x412fe0 !== undefined)
    return new ApiError({
      type: ErrorType.UNKNOWN,
      provider: 'grsai',
      code: _0x412fe0,
      message: _0xe8280b || '未知错误 (code: ' + _0x412fe0 + ')',
      status: _0x14222e,
      retryable: false,
    });
  return null;
}
export function parseTaskError(_0x1abe7d) {
  if (!_0x1abe7d) return null;
  const _0x4802d5 = String(_0x1abe7d.status || _0x1abe7d?.data?.status || '').toLowerCase(),
    _0x54b751 =
      Array.isArray(_0x1abe7d?.results) && _0x1abe7d.results.length > 0 ? _0x1abe7d.results[0] : null,
    _0x3a8b27 =
      _0x1abe7d.error ||
      _0x1abe7d.errorMessage ||
      _0x1abe7d.message ||
      _0x1abe7d.failure_reason ||
      _0x1abe7d?.data?.error ||
      _0x1abe7d?.data?.errorMessage ||
      _0x1abe7d?.data?.message ||
      _0x1abe7d?.data?.failure_reason ||
      _0x54b751?.error ||
      _0x54b751?.errorMessage ||
      _0x54b751?.message ||
      '',
    _0x4d0a06 = String(_0x3a8b27 || ''),
    _0x2e5972 = _0x4d0a06.toUpperCase(),
    _0x10ad8b =
      _0x2e5972.includes('SENSITIVE') ||
      _0x2e5972.includes('FLAGGED') ||
      _0x2e5972.includes('CONTENT') ||
      _0x2e5972.includes('FILTER') ||
      _0x2e5972.includes('VIOLATION') ||
      _0x4d0a06.includes('违规') ||
      _0x4d0a06.includes('敏感') ||
      _0x4d0a06.includes('审核');
  if (_0x10ad8b) return ApiError.contentFiltered('grsai', _0x4d0a06 || '输入或输出触发内容风控');
  if (_0x4802d5 === 'failed' || _0x4802d5 === 'error')
    return ApiError.taskFailed('grsai', _0x4d0a06 || '未知错误');
  const _0x43b610 = _0x1abe7d?.code ?? _0x1abe7d?.data?.code;
  if (String(_0x43b610) === '-22') return ApiError.taskFailed('grsai', _0x4d0a06 || '任务不存在');
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
