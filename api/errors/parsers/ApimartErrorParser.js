import { ApiError, ErrorType } from '../ApiError.js';
const APIMART_HTTP_STATUS_MAP = {
    0x190: {
      type: ErrorType.INVALID_PARAMS,
      message: '无效的请求参数：请检查请求参数是否正确',
      retryable: false,
    },
    0x191: { type: ErrorType.AUTH_ERROR, message: '认证失败：请检查 API Key 是否正确', retryable: false },
    0x192: { type: ErrorType.INSUFFICIENT_BALANCE, message: '余额不足：请充值', retryable: false },
    0x193: { type: ErrorType.FORBIDDEN, message: '没有访问权限：无法访问该资源', retryable: false },
    0x194: {
      type: ErrorType.MODEL_UNAVAILABLE,
      message: '找不到指定的模型：请检查模型 ID 是否正确',
      retryable: false,
    },
    0x1ad: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁：请稍后重试', retryable: true },
    0x1f4: { type: ErrorType.SERVER_ERROR, message: '服务器内部错误：请稍后重试', retryable: true },
    0x1f6: {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: '网关错误：服务暂时不可用，请稍后重试',
      retryable: true,
    },
    0x1f7: { type: ErrorType.SERVICE_UNAVAILABLE, message: '服务暂时不可用：请稍后重试', retryable: true },
  },
  APIMART_BUSINESS_CODES = {
    0x25d: {
      type: ErrorType.INSUFFICIENT_BALANCE,
      message: '账户余额不足：请充值或更换 API Key',
      retryable: false,
    },
  },
  APIMART_ERROR_KEYWORDS = {
    NOT_ENOUGH_BALANCE: { type: ErrorType.INSUFFICIENT_BALANCE, message: '账户余额不足' },
    INVALID_API_KEY: { type: ErrorType.AUTH_ERROR, message: 'API Key 无效' },
    RATE_LIMIT_EXCEEDED: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁' },
    INVALID_PARAMETERS: { type: ErrorType.INVALID_PARAMS, message: '请求参数错误' },
    MODEL_NOT_AVAILABLE: { type: ErrorType.MODEL_UNAVAILABLE, message: '模型不可用' },
    CONTENT_VIOLATION: { type: ErrorType.CONTENT_FILTERED, message: '内容违规' },
    TASK_FAILED: { type: ErrorType.TASK_FAILED, message: '任务执行失败' },
    INVALID_ARGUMENT: { type: ErrorType.INVALID_PARAMS, message: '无效的请求参数' },
  };
function extractErrorCode(_0x1fdbd6, _0x22b44f) {
  if (APIMART_HTTP_STATUS_MAP[_0x22b44f]) return _0x22b44f;
  const _0x1850f6 =
    _0x1fdbd6?.error?.code ??
    _0x1fdbd6?.code ??
    _0x1fdbd6?.errorCode ??
    _0x1fdbd6?.error_code ??
    _0x1fdbd6?.errCode ??
    _0x22b44f;
  return _0x1850f6;
}
function extractErrorMessage(_0x50c22c) {
  if (_0x50c22c?.error?.message) return _0x50c22c.error.message;
  return (
    _0x50c22c?.errorMessage ||
    _0x50c22c?.error_message ||
    _0x50c22c?.message ||
    _0x50c22c?.msg ||
    (typeof _0x50c22c?.error === 'string' ? _0x50c22c.error : '') ||
    ''
  );
}
function stringifyErrorValue(_0x4010f9) {
  if (_0x4010f9 == null) return '';
  if (typeof _0x4010f9 === 'string') return _0x4010f9.trim();
  if (typeof _0x4010f9 === 'number' || typeof _0x4010f9 === 'boolean') return String(_0x4010f9);
  if (typeof _0x4010f9 === 'object') {
    const _0x2463ad =
      _0x4010f9.message ||
      _0x4010f9.errorMessage ||
      _0x4010f9.error_message ||
      _0x4010f9.detail ||
      _0x4010f9.reason ||
      _0x4010f9.type ||
      _0x4010f9.status ||
      _0x4010f9.code;
    if (_0x2463ad) return stringifyErrorValue(_0x2463ad);
    try {
      return JSON.stringify(_0x4010f9);
    } catch {
      return String(_0x4010f9 || '').trim();
    }
  }
  return String(_0x4010f9 || '').trim();
}
function extractTaskStatus(_0x28c21c) {
  return String(
    _0x28c21c?.status ||
      _0x28c21c?.taskStatus ||
      _0x28c21c?.task_status ||
      _0x28c21c?.state ||
      _0x28c21c?.phase ||
      _0x28c21c?.data?.status ||
      _0x28c21c?.data?.taskStatus ||
      _0x28c21c?.data?.task_status ||
      '',
  )
    .trim()
    .toLowerCase();
}
function extractTaskFailureReason(_0x11943f) {
  const _0x3e0146 = [
    _0x11943f?.error?.message,
    _0x11943f?.error?.error?.message,
    _0x11943f?.errorMessage,
    _0x11943f?.error_message,
    _0x11943f?.message,
    _0x11943f?.failedReason,
    _0x11943f?.failReason,
    _0x11943f?.failure_reason,
    _0x11943f?.data?.error?.message,
    _0x11943f?.data?.error?.error?.message,
    _0x11943f?.data?.errorMessage,
    _0x11943f?.data?.error_message,
    _0x11943f?.data?.message,
    _0x11943f?.data?.failedReason,
    _0x11943f?.data?.failReason,
    _0x11943f?.data?.failure_reason,
    _0x11943f?.result?.error?.message,
    _0x11943f?.result?.errorMessage,
    _0x11943f?.result?.message,
  ];
  for (const _0xe43475 of _0x3e0146) {
    const _0x4a4eca = stringifyErrorValue(_0xe43475);
    if (_0x4a4eca) return _0x4a4eca;
  }
  return (
    stringifyErrorValue(_0x11943f?.error) ||
    stringifyErrorValue(_0x11943f?.data?.error) ||
    stringifyErrorValue(_0x11943f?.result?.error) ||
    ''
  );
}
export function parseError(_0x27c8e3, _0x4c6218) {
  if (!_0x27c8e3) return null;
  const _0x4fd2fe = extractErrorCode(_0x27c8e3, _0x4c6218),
    _0xecd0fd = extractErrorMessage(_0x27c8e3),
    _0x1fcb27 = String(_0xecd0fd).toUpperCase();
  if (APIMART_HTTP_STATUS_MAP[_0x4fd2fe]) {
    const _0x4cef4e = APIMART_HTTP_STATUS_MAP[_0x4fd2fe];
    return new ApiError({
      type: _0x4cef4e.type,
      provider: 'apimart',
      code: _0x4fd2fe,
      message: _0xecd0fd || _0x4cef4e.message,
      status: _0x4c6218,
      retryable: _0x4cef4e.retryable,
    });
  }
  if (APIMART_BUSINESS_CODES[_0x4fd2fe]) {
    const _0x423ad9 = APIMART_BUSINESS_CODES[_0x4fd2fe];
    return new ApiError({
      type: _0x423ad9.type,
      provider: 'apimart',
      code: _0x4fd2fe,
      message: _0xecd0fd || _0x423ad9.message,
      status: _0x4c6218,
      retryable: _0x423ad9.retryable,
    });
  }
  for (const [_0x540b59, _0x27ec10] of Object.entries(APIMART_ERROR_KEYWORDS)) {
    if (_0x1fcb27.includes(_0x540b59))
      return new ApiError({
        type: _0x27ec10.type,
        provider: 'apimart',
        code: _0x4fd2fe,
        message: _0xecd0fd || _0x27ec10.message,
        status: _0x4c6218,
        retryable: false,
      });
  }
  if (_0x4c6218 >= 0x190) return ApiError.fromHttpStatus(_0x4c6218, 'apimart', _0xecd0fd);
  return null;
}
export function parseTaskError(_0x367a56) {
  if (!_0x367a56) return null;
  const _0x412f5b = extractTaskStatus(_0x367a56);
  if (
    _0x412f5b === 'failed' ||
    _0x412f5b === 'fail' ||
    _0x412f5b === 'error' ||
    _0x412f5b === 'cancelled' ||
    _0x412f5b === 'canceled'
  ) {
    const _0xa5bbcf =
        extractTaskFailureReason(_0x367a56) ||
        (_0x412f5b === 'cancelled' || _0x412f5b === 'canceled' ? '任务已取消' : '未知错误'),
      _0x46cd00 = String(_0xa5bbcf).toUpperCase();
    for (const [_0x4ebdb1, _0x403b7b] of Object.entries(APIMART_ERROR_KEYWORDS)) {
      if (_0x46cd00.includes(_0x4ebdb1))
        return new ApiError({
          type: _0x403b7b.type,
          provider: 'apimart',
          message: _0x403b7b.message + ': ' + _0xa5bbcf,
          retryable: false,
        });
    }
    return ApiError.taskFailed('apimart', _0xa5bbcf);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
