import { ApiError, ErrorType } from '../ApiError.js';
const MODEL_ERROR_CODE_MAP = {
    1000: { type: ErrorType.SERVER_ERROR, message: '未知错误，请联系技术支持排查。', retryable: false },
    1001: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求链接无效，请检查调用的 API Endpoint 是否正确。',
      retryable: false,
    },
    1002: {
      type: ErrorType.AUTH_ERROR,
      message: 'API Key 无效，请检查 API Key 是否配置正确或已被禁用。',
      retryable: false,
    },
    1003: { type: ErrorType.RATE_LIMIT, message: '请求频率超限，请降低并发请求频率。', retryable: true },
    1004: {
      type: ErrorType.TASK_FAILED,
      message: '任务不存在或已过期，请确认任务 ID 是否正确。',
      retryable: false,
    },
    1005: { type: ErrorType.SERVER_ERROR, message: '系统内部错误，请稍后重试。', retryable: true },
    1006: { type: ErrorType.TASK_TIMEOUT, message: '任务执行超时，请尝试重新提交。', retryable: true },
    1007: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求参数校验失败，请检查参数格式、类型或文件有效性。',
      retryable: false,
    },
    1008: {
      type: ErrorType.INVALID_PARAMS,
      message: '文件大小超出限制，请参考文档中的文件大小上限。',
      retryable: false,
    },
    1009: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求方法不支持，请确认请求方式是否正确。',
      retryable: false,
    },
    1010: {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: '服务暂不可用，系统维护或临时故障，请稍后重试。',
      retryable: true,
    },
    1011: { type: ErrorType.RATE_LIMIT, message: '模型负载较高，请稍后重试。', retryable: true },
    1012: { type: ErrorType.SERVER_ERROR, message: '模型响应异常，请重试。', retryable: true },
    1013: {
      type: ErrorType.SERVER_ERROR,
      message: '文件处理失败，请检查输入文件链接或文件完整性。',
      retryable: true,
    },
    1014: {
      type: ErrorType.FORBIDDEN,
      message: '权限不足，标准模型 API 仅限企业级共享 API Key 调用。',
      retryable: false,
    },
    1015: {
      type: ErrorType.TASK_FAILED,
      message: '生成失败，任务处理过程中出现异常，请尝试重新提交。',
      retryable: true,
    },
    1501: {
      type: ErrorType.CONTENT_FILTERED,
      message: '内容安全审查未通过，请修改提示词或图片。',
      retryable: false,
    },
    1504: { type: ErrorType.TIMEOUT, message: '模型响应超时，请稍后重试。', retryable: true },
    1505: {
      type: ErrorType.CONTENT_FILTERED,
      message: '不支持真人图像处理，请修改提示词或参考图。',
      retryable: false,
    },
    1506: {
      type: ErrorType.INVALID_PARAMS,
      message: '音频克隆 ID 重复，请更换唯一的 voiceId。',
      retryable: false,
    },
    1516: {
      type: ErrorType.INVALID_PARAMS,
      message: '外部文件下载失败，请检查 URL 是否可访问后重试。',
      retryable: true,
    },
    1517: { type: ErrorType.SERVER_ERROR, message: '文件上传失败，请重试。', retryable: true },
    1518: {
      type: ErrorType.INVALID_PARAMS,
      message: 'Base64 解码失败，请检查 Base64 字符串格式。',
      retryable: false,
    },
    1519: {
      type: ErrorType.SERVER_ERROR,
      message: '内容处理异常，处理输入内容时出现非预期错误，请重试。',
      retryable: true,
    },
    1520: {
      type: ErrorType.RATE_LIMIT,
      message: '账号并发达到上限，请等待已有任务完成后再发起新请求。',
      retryable: true,
    },
  },
  MESSAGE_HINT_TO_CODE = {
    'UNKNOWN ERROR': 1000,
    'INVALID URL': 1001,
    'INVALID API KEY': 1002,
    'RATE LIMIT EXCEEDED': 1003,
    'TASK NOT FOUND': 1004,
    'INTERNAL SERVER ERROR': 1005,
    'TASK EXECUTION TIMED OUT': 1006,
    'INVALID PARAMETERS': 1007,
    'FILE SIZE LIMIT EXCEEDED': 1008,
    'HTTP METHOD NOT SUPPORTED': 1009,
    'SERVICE UNAVAILABLE': 1010,
    'MODEL IS CURRENTLY BUSY': 1011,
    'MODEL RESPONSE EXCEPTION': 1012,
    'FILE PROCESSING FAILED': 1013,
    'ACCESS DENIED': 1014,
    'GENERATION FAILED': 1015,
    'CONTENT SECURITY AUDIT FAILED': 1501,
    'MODEL TIMED OUT': 1504,
    'REAL PEOPLE PROHIBITED': 1505,
    'VOICE ID DUPLICATE': 1506,
    'EXTERNAL DOWNLOAD FAILED': 1516,
    'UPLOAD FAILED': 1517,
    'BASE64 DECODE FAILED': 1518,
    'CONTENT PROCESSING EXCEPTION': 1519,
    'CONCURRENCY LIMIT REACHED': 1520,
  };
function toNumberCode(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const item = value.trim();
    if (/^\d+$/.test(item)) return Number(item);
  }
  return null;
}
function collectCandidateObjects(enabled) {
  if (!enabled || typeof enabled !== 'object') return [];
  const list = [enabled],
    handler = (key) => {
      if (key && typeof key === 'object') list.push(key);
    },
    handler2 = (index) => {
      if (!Array.isArray(index)) return;
      for (const result of index) {
        if (result && typeof result === 'object') list.push(result);
      }
    };
  return (
    handler(enabled.data),
    handler(enabled.result),
    handler(enabled.output),
    handler(enabled.response),
    handler2(enabled.data),
    handler2(enabled.results),
    list
  );
}
function extractMessage(data) {
  const candidateObjects = collectCandidateObjects(data);
  for (const error of candidateObjects) {
    const options = String(error?.errorMessage || error?.error || error?.message || error?.msg || '').trim();
    if (options) return options;
  }
  return '';
}
function extractErrorCode(target) {
  const candidateObjects2 = collectCandidateObjects(target);
  for (const source of candidateObjects2) {
    const toNumberCode2 =
      toNumberCode(source.code) ?? toNumberCode(source.errorCode) ?? toNumberCode(source.error_code);
    if (toNumberCode2 !== null) return toNumberCode2;
  }
  for (const error2 of candidateObjects2) {
    const list2 = String(
      error2.errorMessage || error2.error || error2.message || error2.msg || '',
    ).toUpperCase();
    if (!list2) continue;
    for (const [next, current] of Object.entries(MESSAGE_HINT_TO_CODE)) {
      if (list2.includes(next)) return current;
    }
  }
  return null;
}
function buildMappedError(code, status, entry) {
  const type = MODEL_ERROR_CODE_MAP[code];
  if (!type) return null;
  return new ApiError({
    type: type.type,
    provider: 'runninghub',
    code: code,
    message: type.message || entry,
    status: status,
    retryable: type.retryable,
  });
}
export function parseError(enabled2, count) {
  if (!enabled2) return null;
  const extractErrorCode2 = extractErrorCode(enabled2);
  if (extractErrorCode2 !== null) {
    const mappedError = buildMappedError(extractErrorCode2, count);
    if (mappedError) return mappedError;
  }
  const extractMessage2 = extractMessage(enabled2);
  if (count >= 400) return ApiError.fromHttpStatus(count, 'runninghub', extractMessage2);
  return null;
}
export function parseTaskError(enabled3) {
  if (!enabled3 || typeof enabled3 !== 'object') return null;
  const extractErrorCode3 = extractErrorCode(enabled3);
  if (extractErrorCode3 !== null) {
    const mappedError2 = buildMappedError(extractErrorCode3, null);
    if (mappedError2) return mappedError2;
  }
  const candidateObjects3 = collectCandidateObjects(enabled3)
      .map((response) =>
        String(response.status || response.taskStatus || response.task_status || '').toUpperCase(),
      )
      .filter(Boolean),
    record = candidateObjects3[0] || '';
  if (record === 'TIMEOUT') return ApiError.taskTimeout('runninghub');
  if (record === 'FAILED' || record === 'ERROR') {
    const extractMessage3 = extractMessage(enabled3) || '任务执行失败';
    return ApiError.taskFailed('runninghub', extractMessage3);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
