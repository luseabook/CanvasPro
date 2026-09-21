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
    0x190: { type: ErrorType.INVALID_PARAMS, message: '请求参数错误', retryable: false },
    0x191: { type: ErrorType.AUTH_ERROR, message: '认证失败', retryable: false },
    0x193: { type: ErrorType.FORBIDDEN, message: '没有访问权限', retryable: false },
    0x194: { type: ErrorType.MODEL_UNAVAILABLE, message: '资源不存在', retryable: false },
    0x1ad: { type: ErrorType.RATE_LIMIT, message: '请求过于频繁，请稍后重试', retryable: true },
    0x1f4: { type: ErrorType.SERVER_ERROR, message: '服务器内部错误', retryable: true },
    0x1f6: { type: ErrorType.SERVICE_UNAVAILABLE, message: '网关错误', retryable: true },
    0x1f7: { type: ErrorType.SERVICE_UNAVAILABLE, message: '服务不可用', retryable: true },
  };
function extractErrorCode(_0x43d557, _0x18cdf7) {
  const _0x261315 = _0x43d557?.error || _0x43d557,
    _0x3b4ee5 = _0x261315?.code || _0x261315?.error_code || _0x261315?.error_name || '';
  if (_0x3b4ee5 && typeof _0x3b4ee5 === 'string') return _0x3b4ee5;
  const _0x3539a3 = _0x261315?.code || _0x261315?.status || _0x18cdf7;
  if (_0x3539a3 && typeof _0x3539a3 === 'number') return _0x3539a3;
  return _0x18cdf7;
}
function extractErrorMessage(_0x9ef0b1) {
  const _0x1c80ca = _0x9ef0b1?.error || _0x9ef0b1;
  return _0x1c80ca?.message || _0x1c80ca?.error_message || _0x1c80ca?.msg || _0x9ef0b1?.message || '';
}
export function parseError(_0x1c9643, _0x3aaef4) {
  if (!_0x1c9643) return null;
  const _0x24f7d4 = extractErrorCode(_0x1c9643, _0x3aaef4),
    _0x3f7f3c = extractErrorMessage(_0x1c9643),
    _0x9661ec = String(_0x24f7d4).toUpperCase(),
    _0x1edaf5 = String(_0x3f7f3c).toUpperCase();
  if (PP_ALL_ERROR_CODES[_0x24f7d4]) {
    const _0x181374 = PP_ALL_ERROR_CODES[_0x24f7d4];
    return new ApiError({
      type: _0x181374.type,
      provider: 'ppio',
      code: _0x24f7d4,
      message: _0x3f7f3c || _0x181374.message,
      status: _0x3aaef4,
      retryable: _0x181374.retryable,
    });
  }
  if (PP_ALL_ERROR_CODES[_0x9661ec]) {
    const _0x2be519 = PP_ALL_ERROR_CODES[_0x9661ec];
    return new ApiError({
      type: _0x2be519.type,
      provider: 'ppio',
      code: _0x24f7d4,
      message: _0x3f7f3c || _0x2be519.message,
      status: _0x3aaef4,
      retryable: _0x2be519.retryable,
    });
  }
  if (PP_HTTP_STATUS_MAP[_0x3aaef4]) {
    const _0x1e8af3 = PP_HTTP_STATUS_MAP[_0x3aaef4];
    return new ApiError({
      type: _0x1e8af3.type,
      provider: 'ppio',
      code: _0x3aaef4,
      message: _0x3f7f3c || _0x1e8af3.message,
      status: _0x3aaef4,
      retryable: _0x1e8af3.retryable,
    });
  }
  if (_0x1edaf5.includes('BALANCE') || _0x1edaf5.includes('余额') || _0x1edaf5.includes('QUOTA'))
    return ApiError.insufficientBalance('ppio', _0x24f7d4);
  if (_0x1edaf5.includes('RATE') || _0x1edaf5.includes('LIMIT') || _0x1edaf5.includes('频繁'))
    return ApiError.rateLimit('ppio', _0x24f7d4);
  if (_0x1edaf5.includes('AUTH') || _0x1edaf5.includes('API_KEY') || _0x1edaf5.includes('认证'))
    return ApiError.authError('ppio', _0x24f7d4, _0x3f7f3c);
  if (_0x1edaf5.includes('CONTENT') || _0x1edaf5.includes('PROMPT') || _0x1edaf5.includes('不适宜'))
    return ApiError.contentFiltered('ppio', _0x3f7f3c);
  if (_0x3aaef4 >= 0x190) return ApiError.fromHttpStatus(_0x3aaef4, 'ppio', _0x3f7f3c);
  return null;
}
export function parseTaskError(_0x57ac54) {
  if (!_0x57ac54) return null;
  const _0x4db441 = (_0x57ac54.status || '').toLowerCase();
  if (_0x4db441 === 'failed' || _0x4db441 === 'error') {
    const _0x69f3bd = _0x57ac54.error || _0x57ac54.errorMessage || _0x57ac54.message || '未知错误',
      _0x52d7ad = String(_0x69f3bd).toUpperCase();
    for (const [_0x147aeb, _0x2b94bf] of Object.entries(PP_ALL_ERROR_CODES)) {
      if (_0x52d7ad.includes(_0x147aeb))
        return new ApiError({
          type: _0x2b94bf.type,
          provider: 'ppio',
          message: _0x2b94bf.message + ': ' + _0x69f3bd,
          retryable: _0x2b94bf.retryable,
        });
    }
    return ApiError.taskFailed('ppio', _0x69f3bd);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
