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
  constructor(_0x40b7ef) {
    const {
      type: _0x369563,
      message: _0x5913ef,
      provider: _0x3fde10,
      code: _0x18c1c1,
      retryable: _0x258be8,
      raw: _0x29f650,
      status: _0x3f7f72,
    } = _0x40b7ef;
    (super(_0x5913ef || ERROR_MESSAGES[_0x369563] || ERROR_MESSAGES[ErrorType.UNKNOWN]),
      (this.name = 'ApiError'),
      (this.type = _0x369563 || ErrorType.UNKNOWN),
      (this.provider = _0x3fde10 || 'unknown'),
      (this.code = _0x18c1c1),
      (this.retryable = _0x258be8 ?? this._isRetryable(_0x369563)),
      (this.raw = _0x29f650),
      (this.status = _0x3f7f72),
      Error.captureStackTrace && Error.captureStackTrace(this, ApiError));
  }
  ['_isRetryable'](_0x550838) {
    const _0x706144 = [
      ErrorType.TIMEOUT,
      ErrorType.RATE_LIMIT,
      ErrorType.SERVER_ERROR,
      ErrorType.SERVICE_UNAVAILABLE,
      ErrorType.NETWORK_ERROR,
    ];
    return _0x706144.includes(_0x550838);
  }
  ['getUserMessage'](_0x5662cc = true) {
    let _0x17d3f4 = this.message;
    if (_0x5662cc && this.provider && this.provider !== 'unknown') {
      const _0xc92143 = {
          grsai: 'GRSAI',
          ppio: 'PPIO',
          apimart: 'APIMart',
          agnes: 'Agnes AI',
          runninghub: 'RunningHUB',
          gemini: 'Gemini',
          openai: 'OpenAI',
        },
        _0x242c7b = _0xc92143[this.provider] || this.provider;
      _0x17d3f4 = '[' + _0x242c7b + '] ' + _0x17d3f4;
    }
    return (this.code && (_0x17d3f4 += ' (错误码: ' + this.code + ')'), _0x17d3f4);
  }
  ['toLogString']() {
    return '[' + this.provider + '] ' + this.type + '(' + (this.code || 'N/A') + '): ' + this.message;
  }
  static ['networkError'](_0x298af9, _0x15473e) {
    return new ApiError({
      type: ErrorType.NETWORK_ERROR,
      provider: _0x298af9,
      message: '网络请求失败: ' + (_0x15473e?.message || '未知网络错误'),
      raw: _0x15473e,
      retryable: true,
    });
  }
  static ['timeout'](_0x2b4c1e, _0x4edefb) {
    return new ApiError({
      type: ErrorType.TIMEOUT,
      provider: _0x2b4c1e,
      message:
        '请求超时（' +
        (_0x4edefb ? Math.round(_0x4edefb / 0x3e8) + '秒' : '未知') +
        '），请检查网络连接或稍后重试',
      retryable: true,
    });
  }
  static ['insufficientBalance'](_0x4ec1b9, _0x506d44) {
    return new ApiError({
      type: ErrorType.INSUFFICIENT_BALANCE,
      provider: _0x4ec1b9,
      code: _0x506d44,
      message: '账户余额不足，请充值或更换 API Key',
      retryable: false,
    });
  }
  static ['authError'](_0x28eea0, _0x2793f4, _0x39c338) {
    return new ApiError({
      type: ErrorType.AUTH_ERROR,
      provider: _0x28eea0,
      code: _0x2793f4,
      message: _0x39c338 || 'API Key 无效或已过期',
      retryable: false,
    });
  }
  static ['rateLimit'](_0x14cf7e, _0x48d389) {
    return new ApiError({
      type: ErrorType.RATE_LIMIT,
      provider: _0x14cf7e,
      code: _0x48d389,
      message: '请求过于频繁，请稍后再试',
      retryable: true,
    });
  }
  static ['contentFiltered'](_0x2c4a86, _0x38f976) {
    return new ApiError({
      type: ErrorType.CONTENT_FILTERED,
      provider: _0x2c4a86,
      message: _0x38f976 || '生成内容被安全过滤，请修改提示词后重试',
      retryable: false,
    });
  }
  static ['taskFailed'](_0x3abcb2, _0x5b78bf) {
    return new ApiError({
      type: ErrorType.TASK_FAILED,
      provider: _0x3abcb2,
      message: '生成任务失败: ' + (_0x5b78bf || '未知原因'),
      retryable: false,
    });
  }
  static ['taskTimeout'](_0x5b12ee) {
    return new ApiError({
      type: ErrorType.TASK_TIMEOUT,
      provider: _0x5b12ee,
      message: '任务处理超时，请稍后查询结果',
      retryable: false,
    });
  }
  static ['fromHttpStatus'](_0xbb92e0, _0x350b71, _0x548aa3) {
    let _0x97c279 = ErrorType.UNKNOWN;
    switch (_0xbb92e0) {
      case 0x190:
        _0x97c279 = ErrorType.INVALID_PARAMS;
        break;
      case 0x191:
        _0x97c279 = ErrorType.AUTH_ERROR;
        break;
      case 0x193:
        _0x97c279 = ErrorType.FORBIDDEN;
        break;
      case 0x1ad:
        _0x97c279 = ErrorType.RATE_LIMIT;
        break;
      case 0x1f4:
        _0x97c279 = ErrorType.SERVER_ERROR;
        break;
      case 0x1f7:
        _0x97c279 = ErrorType.SERVICE_UNAVAILABLE;
        break;
    }
    return new ApiError({
      type: _0x97c279,
      provider: _0x350b71,
      status: _0xbb92e0,
      message: _0x548aa3 || ERROR_MESSAGES[_0x97c279],
      retryable: _0xbb92e0 >= 0x1f4 || _0xbb92e0 === 0x1ad,
    });
  }
}
export default ApiError;
