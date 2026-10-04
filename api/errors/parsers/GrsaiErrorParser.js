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
function extractErrorCode(value, count) {
  if (value?.code !== undefined && value?.code !== 0) return value.code;
  if (count >= 0x190) return count;
  return null;
}
function extractErrorMessage(error) {
  return error?.msg || error?.message || error?.error || error?.errorMessage || '';
}
export function parseError(enabled, status) {
  if (!enabled) return null;
  const code = extractErrorCode(enabled, status),
    message = extractErrorMessage(enabled),
    list = String(message).toUpperCase();
  if (code === 0 || code === '0') return null;
  if (GRSAI_OFFICIAL_CODES[code]) {
    const type = GRSAI_OFFICIAL_CODES[code];
    return new ApiError({
      type: type.type,
      provider: 'grsai',
      code: code,
      message: message || type.message,
      status: status,
      retryable: type.retryable,
    });
  }
  if (GRSAI_HTTP_STATUS_MAP[status]) {
    const type2 = GRSAI_HTTP_STATUS_MAP[status];
    return new ApiError({
      type: type2.type,
      provider: 'grsai',
      code: code || status,
      message: message || type2.message,
      status: status,
      retryable: type2.retryable,
    });
  }
  if (list.includes('BALANCE') || list.includes('余额')) return ApiError.insufficientBalance('grsai', code);
  if (list.includes('AUTH') || list.includes('API_KEY') || list.includes('KEY'))
    return ApiError.authError('grsai', code, message);
  if (list.includes('RATE') || list.includes('LIMIT') || list.includes('频繁'))
    return ApiError.rateLimit('grsai', code);
  if (list.includes('CONTENT') || list.includes('FILTER') || list.includes('审核'))
    return ApiError.contentFiltered('grsai', message);
  if (list.includes('NOT_FOUND') || list.includes('不存在') || code === -22)
    return new ApiError({
      type: ErrorType.TASK_FAILED,
      provider: 'grsai',
      code: code,
      message: message || '任务不存在',
      status: status,
      retryable: false,
    });
  if (status >= 0x190) return ApiError.fromHttpStatus(status, 'grsai', message);
  if (code !== null && code !== undefined)
    return new ApiError({
      type: ErrorType.UNKNOWN,
      provider: 'grsai',
      code: code,
      message: message || '未知错误 (code: ' + code + ')',
      status: status,
      retryable: false,
    });
  return null;
}
export function parseTaskError(error2) {
  if (!error2) return null;
  const item = String(error2.status || error2?.data?.status || '').toLowerCase(),
    error3 = Array.isArray(error2?.results) && error2.results.length > 0 ? error2.results[0] : null,
    key =
      error2.error ||
      error2.errorMessage ||
      error2.message ||
      error2.failure_reason ||
      error2?.data?.error ||
      error2?.data?.errorMessage ||
      error2?.data?.message ||
      error2?.data?.failure_reason ||
      error3?.error ||
      error3?.errorMessage ||
      error3?.message ||
      '',
    list2 = String(key || ''),
    list3 = list2.toUpperCase(),
    index =
      list3.includes('SENSITIVE') ||
      list3.includes('FLAGGED') ||
      list3.includes('CONTENT') ||
      list3.includes('FILTER') ||
      list3.includes('VIOLATION') ||
      list2.includes('违规') ||
      list2.includes('敏感') ||
      list2.includes('审核');
  if (index) return ApiError.contentFiltered('grsai', list2 || '输入或输出触发内容风控');
  if (item === 'failed' || item === 'error') return ApiError.taskFailed('grsai', list2 || '未知错误');
  const result = error2?.code ?? error2?.data?.code;
  if (String(result) === '-22') return ApiError.taskFailed('grsai', list2 || '任务不存在');
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
