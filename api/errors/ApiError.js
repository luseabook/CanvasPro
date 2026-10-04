export const ErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  DNS_ERROR: 'DNS_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT: 'RATE_LIMIT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_PARAMS: 'INVALID_PARAMS',
  CONTENT_FILTERED: 'CONTENT_FILTERED',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TASK_FAILED: 'TASK_FAILED',
  TASK_TIMEOUT: 'TASK_TIMEOUT',
  UNKNOWN: 'UNKNOWN',
};
const ERROR_MESSAGES = {
  [ErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络或代理设置',
  [ErrorType.TIMEOUT]: '请求超时，请稍后重试',
  [ErrorType.DNS_ERROR]: '无法解析服务器地址，请检查网络配置',
  [ErrorType.AUTH_ERROR]: 'API Key 无效或已过期，请检查配置',
  [ErrorType.FORBIDDEN]: '权限不足，无法访问该资源',
  [ErrorType.RATE_LIMIT]: '请求过于频繁，请稍后再试',
  [ErrorType.INSUFFICIENT_BALANCE]: '账户余额不足，请充值',
  [ErrorType.INVALID_PARAMS]: '请求参数错误，请检查输入',
  [ErrorType.CONTENT_FILTERED]: '生成内容被安全过滤，请修改提示词',
  [ErrorType.MODEL_UNAVAILABLE]: '当前模型不可用，请更换模型或稍后再试',
  [ErrorType.SERVER_ERROR]: '服务器内部错误，请稍后再试',
  [ErrorType.SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后再试',
  [ErrorType.TASK_FAILED]: '生成任务执行失败',
  [ErrorType.TASK_TIMEOUT]: '任务处理超时，请稍后查询结果',
  [ErrorType.UNKNOWN]: '发生未知错误，请稍后重试',
};
export class ApiError extends Error {
  constructor(value) {
    const {
      type: type,
      message: message,
      provider: provider,
      code: code,
      retryable: retryable,
      raw: raw,
      status: status,
    } = value;
    (super(message || ERROR_MESSAGES[type] || ERROR_MESSAGES[ErrorType.UNKNOWN]),
      (this.name = 'ApiError'),
      (this.type = type || ErrorType.UNKNOWN),
      (this.provider = provider || 'unknown'),
      (this.code = code),
      (this.retryable = retryable ?? this._isRetryable(type)),
      (this.raw = raw),
      (this.status = status),
      Error.captureStackTrace && Error.captureStackTrace(this, ApiError));
  }
  ['_isRetryable'](item) {
    const list = [
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
      ErrorType.SERVER_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.NETWORK_ERROR,
    ];
    return list.includes(item);
  }
  ['getUserMessage'](key = true) {
    let index = this.message;
    if (key && this.provider && this.provider !== 'unknown') {
      const result = {
          grsai: 'GRSAI',
          ppio: 'PPIO',
          apimart: 'APIMart',
          agnes: 'Agnes AI',
          runninghub: 'RunningHUB',
          gemini: 'Gemini',
          openai: 'OpenAI',
        },
        data = result[this.provider] || this.provider;
      index = '[' + data + '] ' + index;
    }
    return (this.code && (index += ' (错误码: ' + this.code + ')'), index);
  }
  ['toLogString']() {
    return '[' + this.provider + '] ' + this.type + '(' + (this.code || 'N/A') + '): ' + this.message;
  }
  static ['networkError'](provider2, raw2) {
    return new ApiError({
      type: ErrorType.NETWORK_ERROR,
      provider: provider2,
      message: '网络请求失败: ' + (raw2?.message || '未知网络错误'),
      raw: raw2,
      retryable: true,
    });
  }
  static ['timeout'](provider3, options) {
    return new ApiError({
      type: ErrorType.TIMEOUT,
      provider: provider3,
      message:
        '请求超时（' +
        (options ? Math.round(options / 0x3e8) + '秒' : '未知') +
        '），请检查网络连接或稍后重试',
      retryable: true,
    });
  }
  static ['insufficientBalance'](provider4, code2) {
    return new ApiError({
      type: ErrorType.INSUFFICIENT_BALANCE,
      provider: provider4,
      code: code2,
      message: '账户余额不足，请充值或更换 API Key',
      retryable: false,
    });
  }
  static ['authError'](provider5, code3, message2) {
    return new ApiError({
      type: ErrorType.AUTH_ERROR,
      provider: provider5,
      code: code3,
      message: message2 || 'API Key 无效或已过期',
      retryable: false,
    });
  }
  static ['rateLimit'](provider6, code4) {
    return new ApiError({
      type: ErrorType.RATE_LIMIT,
      provider: provider6,
      code: code4,
      message: '请求过于频繁，请稍后再试',
      retryable: true,
    });
  }
  static ['contentFiltered'](provider7, message3) {
    return new ApiError({
      type: ErrorType.CONTENT_FILTERED,
      provider: provider7,
      message: message3 || '生成内容被安全过滤，请修改提示词后重试',
      retryable: false,
    });
  }
  static ['taskFailed'](provider8, target) {
    return new ApiError({
      type: ErrorType.TASK_FAILED,
      provider: provider8,
      message: '生成任务失败: ' + (target || '未知原因'),
      retryable: false,
    });
  }
  static ['taskTimeout'](provider9) {
    return new ApiError({
      type: ErrorType.TASK_TIMEOUT,
      provider: provider9,
      message: '任务处理超时，请稍后查询结果',
      retryable: false,
    });
  }
  static ['fromHttpStatus'](status2, provider10, message4) {
    let type2 = ErrorType.UNKNOWN;
    switch (status2) {
      case 0x190:
        type2 = ErrorType.INVALID_PARAMS;
        break;
      case 0x191:
        type2 = ErrorType.AUTH_ERROR;
        break;
      case 0x193:
        type2 = ErrorType.FORBIDDEN;
        break;
      case 0x1ad:
        type2 = ErrorType.RATE_LIMIT;
        break;
      case 0x1f4:
        type2 = ErrorType.SERVER_ERROR;
        break;
      case 0x1f7:
        type2 = ErrorType.SERVICE_UNAVAILABLE;
        break;
    }
    return new ApiError({
      type: type2,
      provider: provider10,
      status: status2,
      message: message4 || ERROR_MESSAGES[type2],
      retryable: status2 >= 0x1f4 || status2 === 0x1ad,
    });
  }
}
export default ApiError;
