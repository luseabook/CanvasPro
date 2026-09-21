import { ApiError, ErrorType } from '../ApiError.js';
const PROVIDER = 'agnes',
  AGNES_HTTP_STATUS_MAP = {
    0x190: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求参数错误，请检查提示词、图片 URL 和视频参数',
      retryable: false,
    },
    0x191: {
      type: ErrorType.AUTH_ERROR,
      message: 'API Key 无效或未授权，请检查 Agnes AI 配置',
      retryable: false,
    },
    0x194: {
      type: ErrorType.INVALID_PARAMS,
      message: '任务不存在或已过期，请重新提交生成任务',
      retryable: false,
    },
    0x1f4: { type: ErrorType.SERVER_ERROR, message: 'Agnes AI 服务器内部错误，请稍后重试', retryable: true },
    0x1f7: {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: 'Agnes AI 服务繁忙，请稍后重试',
      retryable: true,
    },
  };
function isPlainObject(_0x1135b4) {
  return !!_0x1135b4 && typeof _0x1135b4 === 'object' && !Array.isArray(_0x1135b4);
}
function stringifyErrorValue(_0x45f92f) {
  if (_0x45f92f === undefined || _0x45f92f === null) return '';
  if (typeof _0x45f92f === 'string') return _0x45f92f;
  if (typeof _0x45f92f === 'number' || typeof _0x45f92f === 'boolean') return String(_0x45f92f);
  if (isPlainObject(_0x45f92f)) {
    const _0x1db10c =
      _0x45f92f.message ||
      _0x45f92f.errorMessage ||
      _0x45f92f.error_message ||
      _0x45f92f.reason ||
      _0x45f92f.detail ||
      _0x45f92f.details ||
      _0x45f92f.msg;
    if (_0x1db10c !== undefined && _0x1db10c !== null && _0x1db10c !== _0x45f92f) {
      const _0xda276 = stringifyErrorValue(_0x1db10c);
      if (_0xda276) return _0xda276;
    }
    try {
      return JSON.stringify(_0x45f92f);
    } catch {
      return '';
    }
  }
  return String(_0x45f92f || '');
}
function firstErrorText(..._0x3c69e6) {
  for (const _0x12e718 of _0x3c69e6) {
    const _0x53d51a = stringifyErrorValue(_0x12e718).trim();
    if (_0x53d51a) return _0x53d51a;
  }
  return '';
}
function extractErrorMessage(_0x344f75) {
  return firstErrorText(
    _0x344f75?.error?.message,
    _0x344f75?.error,
    _0x344f75?.message,
    _0x344f75?.errorMessage,
    _0x344f75?.error_message,
    _0x344f75?.failure_reason,
    _0x344f75?.reason,
    _0x344f75?.detail,
    _0x344f75,
  );
}
function extractErrorCode(_0x398467, _0x16e72a) {
  return (
    _0x398467?.error?.code ?? _0x398467?.code ?? _0x398467?.errorCode ?? _0x398467?.error_code ?? _0x16e72a
  );
}
function buildKeywordError(_0x799f63, _0x5cc812) {
  const _0x4586d8 = String(_0x799f63 || '').toUpperCase();
  if (_0x4586d8.includes('BALANCE') || _0x4586d8.includes('QUOTA'))
    return ApiError.insufficientBalance(PROVIDER, _0x5cc812);
  if (_0x4586d8.includes('RATE') || _0x4586d8.includes('LIMIT'))
    return ApiError.rateLimit(PROVIDER, _0x5cc812);
  if (
    _0x4586d8.includes('AUTH') ||
    _0x4586d8.includes('UNAUTHORIZED') ||
    _0x4586d8.includes('API KEY') ||
    _0x4586d8.includes('API_KEY')
  )
    return ApiError.authError(PROVIDER, _0x5cc812, _0x799f63);
  if (
    _0x4586d8.includes('CONTENT') ||
    _0x4586d8.includes('SAFETY') ||
    _0x4586d8.includes('FILTER') ||
    _0x4586d8.includes('POLICY')
  )
    return ApiError.contentFiltered(PROVIDER, _0x799f63);
  return null;
}
function extractTaskStatus(_0x397505) {
  const _0x3e5831 = Array.isArray(_0x397505?.data) ? _0x397505.data[0] : null;
  return String(
    _0x397505?.status ||
      _0x397505?.taskStatus ||
      _0x397505?.task_status ||
      _0x397505?.data?.status ||
      _0x397505?.data?.taskStatus ||
      _0x397505?.data?.task_status ||
      _0x397505?.output?.status ||
      _0x397505?.output?.taskStatus ||
      _0x397505?.output?.task_status ||
      _0x3e5831?.status ||
      _0x3e5831?.taskStatus ||
      _0x3e5831?.task_status ||
      '',
  )
    .trim()
    .toLowerCase();
}
export function parseError(_0x42b92e, _0x102ca4) {
  if (!_0x42b92e && _0x102ca4 < 0x190) return null;
  const _0x4004e7 = extractErrorMessage(_0x42b92e),
    _0x45df29 = extractErrorCode(_0x42b92e, _0x102ca4),
    _0x2dc944 = buildKeywordError(_0x4004e7, _0x45df29);
  if (_0x2dc944) return _0x2dc944;
  const _0x35e290 = AGNES_HTTP_STATUS_MAP[_0x102ca4];
  if (_0x35e290)
    return new ApiError({
      type: _0x35e290.type,
      provider: PROVIDER,
      code: _0x45df29,
      status: _0x102ca4,
      message: _0x4004e7 || _0x35e290.message,
      raw: _0x42b92e,
      retryable: _0x35e290.retryable,
    });
  if (_0x102ca4 >= 0x190) return ApiError.fromHttpStatus(_0x102ca4, PROVIDER, _0x4004e7);
  return null;
}
export function parseTaskError(_0x486991) {
  if (!_0x486991) return null;
  const _0x5d4574 = extractTaskStatus(_0x486991);
  if (_0x5d4574 !== 'failed' && _0x5d4574 !== 'fail' && _0x5d4574 !== 'error') return null;
  const _0x2b8be7 =
    extractErrorMessage(_0x486991) ||
    firstErrorText(_0x486991?.output?.error, _0x486991?.output?.message) ||
    '未知错误';
  return ApiError.taskFailed(PROVIDER, _0x2b8be7);
}
export default { parseError: parseError, parseTaskError: parseTaskError };
