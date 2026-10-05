import { ApiError, ErrorType } from '../ApiError.js';
const PP_MEDIA_ERROR_CODES = {
    INVALID_REQUEST_BODY: { type: ErrorType.INVALID_PARAMS, message: '请求参数校验失败', retryable: false },
    IMAGE_FILE_EXCEEDS_MAX_SIZE: {
      type: ErrorType.INVALID_PARAMS,
      message: '图片大小超出限制',
      retryable: false,
    },
    INVALID_IMAGE_FORMAT: { type: ErrorType.INVALID_PARAMS, message: '图片格式与要求不符', retryable: false },
    IMAGE_EXCEEDS_MAX_RESOLUTION: {
      type: ErrorType.INVALID_PARAMS,
      message: '图片分辨率超出限制',
      retryable: false,
    },
    INVALID_IMAGE_SIZE: { type: ErrorType.INVALID_PARAMS, message: '图片长或宽超出限制', retryable: false },
    IMAGE_NO_FACE_DETECTED: { type: ErrorType.INVALID_PARAMS, message: '未检测到人脸', retryable: false },
    INVALID_CUSTOM_OUTPUT_PATH: {
      type: ErrorType.INVALID_PARAMS,
      message: 'OSS 路径不合法',
      retryable: false,
    },
    ILLEGAL_PROMPT: { type: ErrorType.CONTENT_FILTERED, message: 'Prompt 含不适宜内容', retryable: false },
    ILLEGAL_IMAGE_CONTENT: {
      type: ErrorType.CONTENT_FILTERED,
      message: '图片含不适宜内容',
      retryable: false,
    },
    INVALID_AUDIO_FILE: { type: ErrorType.INVALID_PARAMS, message: '输入音频不合法', retryable: false },
    BILLING_BALANCE_NOT_ENOUGH: {
      type: ErrorType.INSUFFICIENT_BALANCE,
      message: '余额不足',
      retryable: false,
    },
    MISSING_API_KEY: { type: ErrorType.AUTH_ERROR, message: '未提供 API Key', retryable: false },
    BILLING_AUTH_FAILED: { type: ErrorType.AUTH_ERROR, message: '计费服务鉴权失败', retryable: false },
    INVALID_API_KEY: { type: ErrorType.AUTH_ERROR, message: 'API Key 校验失败', retryable: false },
    FEATURE_NOT_ALLOWED: { type: ErrorType.FORBIDDEN, message: '没有模型上传权限', retryable: false },
    API_NOT_ALLOWED: { type: ErrorType.FORBIDDEN, message: '无权限使用该 API', retryable: false },
    NEED_REAL_NAME_VERIFY: { type: ErrorType.FORBIDDEN, message: '未完成企业认证', retryable: false },
    API_NOT_FOUND: { type: ErrorType.MODEL_UNAVAILABLE, message: 'API 不存在', retryable: false },
    TASK_NOT_FOUND: { type: ErrorType.TASK_FAILED, message: '任务不存在', retryable: false },
    RATE_LIMIT_EXCEEDED: {
      type: ErrorType.RATE_LIMIT,
      message: '触发频率控制限制，请稍后重试',
      retryable: true,
    },
    BILLING_FAILED: { type: ErrorType.SERVER_ERROR, message: '计费服务异常，请稍后重试', retryable: true },
    CREATE_TASK_FAILED: {
      type: ErrorType.SERVER_ERROR,
      message: '创建任务失败，请稍后重试',
      retryable: true,
    },
    GET_RESULT_FAILED: {
      type: ErrorType.SERVER_ERROR,
      message: '获取任务结果失败，请稍后重试',
      retryable: true,
    },
    TASK_FAILED: { type: ErrorType.TASK_FAILED, message: '任务执行失败', retryable: false },
  },
  PP_LLM_ERROR_CODES = {
    INVALID_REQUEST_BODY: { type: ErrorType.INVALID_PARAMS, message: '请求体格式错误', retryable: false },
    FAILED_TO_AUTH: { type: ErrorType.AUTH_ERROR, message: '认证失败', retryable: false },
    INVALID_API_KEY: { type: ErrorType.AUTH_ERROR, message: '未提供 API Key', retryable: false },
    NOT_ENOUGH_BALANCE: { type: ErrorType.INSUFFICIENT_BALANCE, message: '余额不足', retryable: false },
    ACCESS_DENY: { type: ErrorType.FORBIDDEN, message: '无权限访问', retryable: false },
    MODEL_NOT_FOUND: { type: ErrorType.MODEL_UNAVAILABLE, message: '模型不存在', retryable: false },
    RATE_LIMIT_EXCEEDED: { type: ErrorType.RATE_LIMIT, message: '请求过快，请稍后重试', retryable: true },
    TOKEN_LIMIT_EXCEEDED: {
      type: ErrorType.RATE_LIMIT,
      message: 'Token 数超限，请稍后重试',
      retryable: true,
    },
    SERVICE_NOT_AVAILABLE: {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: '服务不可用，请稍后重试',
      retryable: true,
    },
  },
  PP_BILLING_ERROR_CODES = {
    UNKNOWN: { type: ErrorType.SERVER_ERROR, message: '未知错误，请联系我们', retryable: false },
    LIST_BILL_TOO_FAST: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁，请稍后重试', retryable: true },
    INVALID_PRODUCT_CATEGORY: {
      type: ErrorType.INVALID_PARAMS,
      message: 'productCategory 参数错误',
      retryable: false,
    },
    INVALID_BILL_CYCLE: { type: ErrorType.INVALID_PARAMS, message: 'cycle 参数错误', retryable: false },
    LIST_BILL_ERROR: { type: ErrorType.SERVER_ERROR, message: '查询错误，请联系我们', retryable: false },
  },
  PP_ALL_ERROR_CODES = {
    ...PP_MEDIA_ERROR_CODES,
    ...PP_LLM_ERROR_CODES,
    ...PP_BILLING_ERROR_CODES,
    insufficient_quota: { type: ErrorType.INSUFFICIENT_BALANCE, message: '额度不足', retryable: false },
    rate_limit_exceeded: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁', retryable: true },
    invalid_api_key: { type: ErrorType.AUTH_ERROR, message: 'API Key 无效', retryable: false },
    invalid_request_error: { type: ErrorType.INVALID_PARAMS, message: '请求参数错误', retryable: false },
    model_not_found: { type: ErrorType.MODEL_UNAVAILABLE, message: '模型不存在', retryable: false },
    server_error: { type: ErrorType.SERVER_ERROR, message: '服务器错误', retryable: true },
    timeout: { type: ErrorType.TIMEOUT, message: '请求超时', retryable: true },
  },
  PP_HTTP_STATUS_MAP = {
    400: { type: ErrorType.INVALID_PARAMS, message: '请求参数错误', retryable: false },
    401: { type: ErrorType.AUTH_ERROR, message: '认证失败', retryable: false },
    403: { type: ErrorType.FORBIDDEN, message: '没有访问权限', retryable: false },
    404: { type: ErrorType.MODEL_UNAVAILABLE, message: '资源不存在', retryable: false },
    429: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁，请稍后重试', retryable: true },
    500: { type: ErrorType.SERVER_ERROR, message: '服务器内部错误', retryable: true },
    502: { type: ErrorType.SERVICE_UNAVAILABLE, message: '网关错误', retryable: true },
    503: { type: ErrorType.SERVICE_UNAVAILABLE, message: '服务不可用', retryable: true },
  };
function extractErrorCode(value, item) {
  const response = value?.error || value,
    key = response?.code || response?.error_code || response?.error_name || '';
  if (key && typeof key === 'string') return key;
  const index = response?.code || response?.status || item;
  if (index && typeof index === 'number') return index;
  return item;
}
function extractErrorMessage(error) {
  const error2 = error?.error || error;
  return error2?.message || error2?.error_message || error2?.msg || error?.message || '';
}
export function parseError(enabled, status) {
  if (!enabled) return null;
  const code = extractErrorCode(enabled, status),
    message = extractErrorMessage(enabled),
    result = String(code).toUpperCase(),
    list = String(message).toUpperCase();
  if (PP_ALL_ERROR_CODES[code]) {
    const type = PP_ALL_ERROR_CODES[code];
    return new ApiError({
      type: type.type,
      provider: 'ppio',
      code: code,
      message: message || type.message,
      status: status,
      retryable: type.retryable,
    });
  }
  if (PP_ALL_ERROR_CODES[result]) {
    const type2 = PP_ALL_ERROR_CODES[result];
    return new ApiError({
      type: type2.type,
      provider: 'ppio',
      code: code,
      message: message || type2.message,
      status: status,
      retryable: type2.retryable,
    });
  }
  if (PP_HTTP_STATUS_MAP[status]) {
    const type3 = PP_HTTP_STATUS_MAP[status];
    return new ApiError({
      type: type3.type,
      provider: 'ppio',
      code: status,
      message: message || type3.message,
      status: status,
      retryable: type3.retryable,
    });
  }
  if (list.includes('BALANCE') || list.includes('余额') || list.includes('QUOTA'))
    return ApiError.insufficientBalance('ppio', code);
  if (list.includes('RATE') || list.includes('LIMIT') || list.includes('频繁'))
    return ApiError.rateLimit('ppio', code);
  if (list.includes('AUTH') || list.includes('API_KEY') || list.includes('认证'))
    return ApiError.authError('ppio', code, message);
  if (list.includes('CONTENT') || list.includes('PROMPT') || list.includes('不适宜'))
    return ApiError.contentFiltered('ppio', message);
  if (status >= 400) return ApiError.fromHttpStatus(status, 'ppio', message);
  return null;
}
export function parseTaskError(error3) {
  if (!error3) return null;
  const data = (error3.status || '').toLowerCase();
  if (data === 'failed' || data === 'error') {
    const options = error3.error || error3.errorMessage || error3.message || '未知错误',
      list2 = String(options).toUpperCase();
    for (const [target, type4] of Object.entries(PP_ALL_ERROR_CODES)) {
      if (list2.includes(target))
        return new ApiError({
          type: type4.type,
          provider: 'ppio',
          message: type4.message + ': ' + options,
          retryable: type4.retryable,
        });
    }
    return ApiError.taskFailed('ppio', options);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
