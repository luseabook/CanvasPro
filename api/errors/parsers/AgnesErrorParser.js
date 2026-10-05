import { ApiError, ErrorType } from '../ApiError.js';
const PROVIDER = 'agnes',
  AGNES_HTTP_STATUS_MAP = {
    400: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求参数错误，请检查提示词、图片 URL 和视频参数',
      retryable: false,
    },
    401: {
      type: ErrorType.AUTH_ERROR,
      message: 'API Key 无效或未授权，请检查 Agnes AI 配置',
      retryable: false,
    },
    404: {
      type: ErrorType.INVALID_PARAMS,
      message: '任务不存在或已过期，请重新提交生成任务',
      retryable: false,
    },
    500: { type: ErrorType.SERVER_ERROR, message: 'Agnes AI 服务器内部错误，请稍后重试', retryable: true },
    503: {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: 'Agnes AI 服务繁忙，请稍后重试',
      retryable: true,
    },
  };
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function stringifyErrorValue(error) {
  if (error === undefined || error === null) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (isPlainObject(error)) {
    const value =
      error.message ||
      error.errorMessage ||
      error.error_message ||
      error.reason ||
      error.detail ||
      error.details ||
      error.msg;
    if (value !== undefined && value !== null && value !== error) {
      const stringifyErrorValue2 = stringifyErrorValue(value);
      if (stringifyErrorValue2) return stringifyErrorValue2;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return '';
    }
  }
  return String(error || '');
}
function firstErrorText(...args) {
  for (const item of args) {
    const stringifyErrorValue3 = stringifyErrorValue(item).trim();
    if (stringifyErrorValue3) return stringifyErrorValue3;
  }
  return '';
}
function extractErrorMessage(error2) {
  return firstErrorText(
    error2?.error?.message,
    error2?.error,
    error2?.message,
    error2?.errorMessage,
    error2?.error_message,
    error2?.failure_reason,
    error2?.reason,
    error2?.detail,
    error2,
  );
}
function extractErrorCode(key, index) {
  return key?.error?.code ?? key?.code ?? key?.errorCode ?? key?.error_code ?? index;
}
function buildKeywordError(result, data) {
  const list = String(result || '').toUpperCase();
  if (list.includes('BALANCE') || list.includes('QUOTA')) return ApiError.insufficientBalance(PROVIDER, data);
  if (list.includes('RATE') || list.includes('LIMIT')) return ApiError.rateLimit(PROVIDER, data);
  if (
    list.includes('AUTH') ||
    list.includes('UNAUTHORIZED') ||
    list.includes('API KEY') ||
    list.includes('API_KEY')
  )
    return ApiError.authError(PROVIDER, data, result);
  if (
    list.includes('CONTENT') ||
    list.includes('SAFETY') ||
    list.includes('FILTER') ||
    list.includes('POLICY')
  )
    return ApiError.contentFiltered(PROVIDER, result);
  return null;
}
function extractTaskStatus(response) {
  const response2 = Array.isArray(response?.data) ? response.data[0] : null;
  return String(
    response?.status ||
      response?.taskStatus ||
      response?.task_status ||
      response?.data?.status ||
      response?.data?.taskStatus ||
      response?.data?.task_status ||
      response?.output?.status ||
      response?.output?.taskStatus ||
      response?.output?.task_status ||
      response2?.status ||
      response2?.taskStatus ||
      response2?.task_status ||
      '',
  )
    .trim()
    .toLowerCase();
}
export function parseError(raw, status) {
  if (!raw && status < 400) return null;
  const message = extractErrorMessage(raw),
    code = extractErrorCode(raw, status),
    keywordError = buildKeywordError(message, code);
  if (keywordError) return keywordError;
  const type = AGNES_HTTP_STATUS_MAP[status];
  if (type)
    return new ApiError({
      type: type.type,
      provider: PROVIDER,
      code: code,
      status: status,
      message: message || type.message,
      raw: raw,
      retryable: type.retryable,
    });
  if (status >= 400) return ApiError.fromHttpStatus(status, PROVIDER, message);
  return null;
}
export function parseTaskError(enabled2) {
  if (!enabled2) return null;
  const extractTaskStatus2 = extractTaskStatus(enabled2);
  if (extractTaskStatus2 !== 'failed' && extractTaskStatus2 !== 'fail' && extractTaskStatus2 !== 'error')
    return null;
  const extractErrorMessage2 =
    extractErrorMessage(enabled2) ||
    firstErrorText(enabled2?.output?.error, enabled2?.output?.message) ||
    '未知错误';
  return ApiError.taskFailed(PROVIDER, extractErrorMessage2);
}
export default { parseError: parseError, parseTaskError: parseTaskError };
