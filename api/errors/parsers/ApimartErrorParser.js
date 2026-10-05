import { ApiError, ErrorType } from '../ApiError.js';
const APIMART_HTTP_STATUS_MAP = {
    400: {
      type: ErrorType.INVALID_PARAMS,
      message: '无效的请求参数：请检查请求参数是否正确',
      retryable: false,
    },
    401: { type: ErrorType.AUTH_ERROR, message: '认证失败：请检查 API Key 是否正确', retryable: false },
    402: { type: ErrorType.INSUFFICIENT_BALANCE, message: '余额不足：请充值', retryable: false },
    403: { type: ErrorType.FORBIDDEN, message: '没有访问权限：无法访问该资源', retryable: false },
    404: {
      type: ErrorType.MODEL_UNAVAILABLE,
      message: '找不到指定的模型：请检查模型 ID 是否正确',
      retryable: false,
    },
    429: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁：请稍后重试', retryable: true },
    500: { type: ErrorType.SERVER_ERROR, message: '服务器内部错误：请稍后重试', retryable: true },
    502: {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: '网关错误：服务暂时不可用，请稍后重试',
      retryable: true,
    },
    503: { type: ErrorType.SERVICE_UNAVAILABLE, message: '服务暂时不可用：请稍后重试', retryable: true },
  },
  APIMART_BUSINESS_CODES = {
    605: {
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
function extractErrorCode(value, item) {
  if (APIMART_HTTP_STATUS_MAP[item]) return item;
  const key =
    value?.error?.code ?? value?.code ?? value?.errorCode ?? value?.error_code ?? value?.errCode ?? item;
  return key;
}
function extractErrorMessage(error) {
  if (error?.error?.message) return error.error.message;
  return (
    error?.errorMessage ||
    error?.error_message ||
    error?.message ||
    error?.msg ||
    (typeof error?.error === 'string' ? error.error : '') ||
    ''
  );
}
function stringifyErrorValue(error2) {
  if (error2 == null) return '';
  if (typeof error2 === 'string') return error2.trim();
  if (typeof error2 === 'number' || typeof error2 === 'boolean') return String(error2);
  if (typeof error2 === 'object') {
    const index =
      error2.message ||
      error2.errorMessage ||
      error2.error_message ||
      error2.detail ||
      error2.reason ||
      error2.type ||
      error2.status ||
      error2.code;
    if (index) return stringifyErrorValue(index);
    try {
      return JSON.stringify(error2);
    } catch {
      return String(error2 || '').trim();
    }
  }
  return String(error2 || '').trim();
}
function extractTaskStatus(response) {
  return String(
    response?.status ||
      response?.taskStatus ||
      response?.task_status ||
      response?.state ||
      response?.phase ||
      response?.data?.status ||
      response?.data?.taskStatus ||
      response?.data?.task_status ||
      '',
  )
    .trim()
    .toLowerCase();
}
function extractTaskFailureReason(error3) {
  const result = [
    error3?.error?.message,
    error3?.error?.error?.message,
    error3?.errorMessage,
    error3?.error_message,
    error3?.message,
    error3?.failedReason,
    error3?.failReason,
    error3?.failure_reason,
    error3?.data?.error?.message,
    error3?.data?.error?.error?.message,
    error3?.data?.errorMessage,
    error3?.data?.error_message,
    error3?.data?.message,
    error3?.data?.failedReason,
    error3?.data?.failReason,
    error3?.data?.failure_reason,
    error3?.result?.error?.message,
    error3?.result?.errorMessage,
    error3?.result?.message,
  ];
  for (const data of result) {
    const stringifyErrorValue2 = stringifyErrorValue(data);
    if (stringifyErrorValue2) return stringifyErrorValue2;
  }
  return (
    stringifyErrorValue(error3?.error) ||
    stringifyErrorValue(error3?.data?.error) ||
    stringifyErrorValue(error3?.result?.error) ||
    ''
  );
}
export function parseError(enabled, status) {
  if (!enabled) return null;
  const code = extractErrorCode(enabled, status),
    message = extractErrorMessage(enabled),
    list = String(message).toUpperCase();
  if (APIMART_HTTP_STATUS_MAP[code]) {
    const type = APIMART_HTTP_STATUS_MAP[code];
    return new ApiError({
      type: type.type,
      provider: 'apimart',
      code: code,
      message: message || type.message,
      status: status,
      retryable: type.retryable,
    });
  }
  if (APIMART_BUSINESS_CODES[code]) {
    const type2 = APIMART_BUSINESS_CODES[code];
    return new ApiError({
      type: type2.type,
      provider: 'apimart',
      code: code,
      message: message || type2.message,
      status: status,
      retryable: type2.retryable,
    });
  }
  for (const [options, type3] of Object.entries(APIMART_ERROR_KEYWORDS)) {
    if (list.includes(options))
      return new ApiError({
        type: type3.type,
        provider: 'apimart',
        code: code,
        message: message || type3.message,
        status: status,
        retryable: false,
      });
  }
  if (status >= 400) return ApiError.fromHttpStatus(status, 'apimart', message);
  return null;
}
export function parseTaskError(enabled2) {
  if (!enabled2) return null;
  const extractTaskStatus2 = extractTaskStatus(enabled2);
  if (
    extractTaskStatus2 === 'failed' ||
    extractTaskStatus2 === 'fail' ||
    extractTaskStatus2 === 'error' ||
    extractTaskStatus2 === 'cancelled' ||
    extractTaskStatus2 === 'canceled'
  ) {
    const extractTaskFailureReason2 =
        extractTaskFailureReason(enabled2) ||
        (extractTaskStatus2 === 'cancelled' || extractTaskStatus2 === 'canceled' ? '任务已取消' : '未知错误'),
      list2 = String(extractTaskFailureReason2).toUpperCase();
    for (const [target, type4] of Object.entries(APIMART_ERROR_KEYWORDS)) {
      if (list2.includes(target))
        return new ApiError({
          type: type4.type,
          provider: 'apimart',
          message: type4.message + ': ' + extractTaskFailureReason2,
          retryable: false,
        });
    }
    return ApiError.taskFailed('apimart', extractTaskFailureReason2);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
