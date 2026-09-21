import { ApiError, ErrorType } from '../ApiError.js';
const MODEL_ERROR_CODE_MAP = {
    0x3e8: { type: ErrorType.SERVER_ERROR, message: '未知错误，请联系技术支持排查。', retryable: false },
    0x3e9: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求链接无效，请检查调用的 API Endpoint 是否正确。',
      retryable: false,
    },
    0x3ea: {
      type: ErrorType.AUTH_ERROR,
      message: 'API Key 无效，请检查 API Key 是否配置正确或已被禁用。',
      retryable: false,
    },
    0x3eb: { type: ErrorType.RATE_LIMIT, message: '请求频率超限，请降低并发请求频率。', retryable: true },
    0x3ec: {
      type: ErrorType.TASK_FAILED,
      message: '任务不存在或已过期，请确认任务 ID 是否正确。',
      retryable: false,
    },
    0x3ed: { type: ErrorType.SERVER_ERROR, message: '系统内部错误，请稍后重试。', retryable: true },
    0x3ee: { type: ErrorType.TASK_TIMEOUT, message: '任务执行超时，请尝试重新提交。', retryable: true },
    0x3ef: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求参数校验失败，请检查参数格式、类型或文件有效性。',
      retryable: false,
    },
    0x3f0: {
      type: ErrorType.INVALID_PARAMS,
      message: '文件大小超出限制，请参考文档中的文件大小上限。',
      retryable: false,
    },
    0x3f1: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求方法不支持，请确认请求方式是否正确。',
      retryable: false,
    },
    0x3f2: {
      type: ErrorType.SERVICE_UNAVAILABLE,
      message: '服务暂不可用，系统维护或临时故障，请稍后重试。',
      retryable: true,
    },
    0x3f3: { type: ErrorType.RATE_LIMIT, message: '模型负载较高，请稍后重试。', retryable: true },
    0x3f4: { type: ErrorType.SERVER_ERROR, message: '模型响应异常，请重试。', retryable: true },
    0x3f5: {
      type: ErrorType.SERVER_ERROR,
      message: '文件处理失败，请检查输入文件链接或文件完整性。',
      retryable: true,
    },
    0x3f6: {
      type: ErrorType.FORBIDDEN,
      message: '权限不足，标准模型 API 仅限企业级共享 API Key 调用。',
      retryable: false,
    },
    0x3f7: {
      type: ErrorType.TASK_FAILED,
      message: '生成失败，任务处理过程中出现异常，请尝试重新提交。',
      retryable: true,
    },
    0x5dd: {
      type: ErrorType.CONTENT_FILTERED,
      message: '内容安全审查未通过，请修改提示词或图片。',
      retryable: false,
    },
    0x5e0: { type: ErrorType.TIMEOUT, message: '模型响应超时，请稍后重试。', retryable: true },
    0x5e1: {
      type: ErrorType.CONTENT_FILTERED,
      message: '不支持真人图像处理，请修改提示词或参考图。',
      retryable: false,
    },
    0x5e2: {
      type: ErrorType.INVALID_PARAMS,
      message: '音频克隆 ID 重复，请更换唯一的 voiceId。',
      retryable: false,
    },
    0x5ec: {
      type: ErrorType.INVALID_PARAMS,
      message: '外部文件下载失败，请检查 URL 是否可访问后重试。',
      retryable: true,
    },
    0x5ed: { type: ErrorType.SERVER_ERROR, message: '文件上传失败，请重试。', retryable: true },
    0x5ee: {
      type: ErrorType.INVALID_PARAMS,
      message: 'Base64 解码失败，请检查 Base64 字符串格式。',
      retryable: false,
    },
    0x5ef: {
      type: ErrorType.SERVER_ERROR,
      message: '内容处理异常，处理输入内容时出现非预期错误，请重试。',
      retryable: true,
    },
    0x5f0: {
      type: ErrorType.RATE_LIMIT,
      message: '账号并发达到上限，请等待已有任务完成后再发起新请求。',
      retryable: true,
    },
  },
  MESSAGE_HINT_TO_CODE = {
    'UNKNOWN ERROR': 0x3e8,
    'INVALID URL': 0x3e9,
    'INVALID API KEY': 0x3ea,
    'RATE LIMIT EXCEEDED': 0x3eb,
    'TASK NOT FOUND': 0x3ec,
    'INTERNAL SERVER ERROR': 0x3ed,
    'TASK EXECUTION TIMED OUT': 0x3ee,
    'INVALID PARAMETERS': 0x3ef,
    'FILE SIZE LIMIT EXCEEDED': 0x3f0,
    'HTTP METHOD NOT SUPPORTED': 0x3f1,
    'SERVICE UNAVAILABLE': 0x3f2,
    'MODEL IS CURRENTLY BUSY': 0x3f3,
    'MODEL RESPONSE EXCEPTION': 0x3f4,
    'FILE PROCESSING FAILED': 0x3f5,
    'ACCESS DENIED': 0x3f6,
    'GENERATION FAILED': 0x3f7,
    'CONTENT SECURITY AUDIT FAILED': 0x5dd,
    'MODEL TIMED OUT': 0x5e0,
    'REAL PEOPLE PROHIBITED': 0x5e1,
    'VOICE ID DUPLICATE': 0x5e2,
    'EXTERNAL DOWNLOAD FAILED': 0x5ec,
    'UPLOAD FAILED': 0x5ed,
    'BASE64 DECODE FAILED': 0x5ee,
    'CONTENT PROCESSING EXCEPTION': 0x5ef,
    'CONCURRENCY LIMIT REACHED': 0x5f0,
  };
function toNumberCode(_0x43f13e) {
  if (typeof _0x43f13e === 'number' && Number.isFinite(_0x43f13e)) return _0x43f13e;
  if (typeof _0x43f13e === 'string') {
    const _0x3a0c1e = _0x43f13e.trim();
    if (/^\d+$/.test(_0x3a0c1e)) return Number(_0x3a0c1e);
  }
  return null;
}
function collectCandidateObjects(_0x4f47eb) {
  if (!_0x4f47eb || typeof _0x4f47eb !== 'object') return [];
  const _0x108243 = [_0x4f47eb],
    _0x46b47c = (_0x4a7f5d) => {
      if (_0x4a7f5d && typeof _0x4a7f5d === 'object') _0x108243.push(_0x4a7f5d);
    },
    _0x3a899e = (_0x407798) => {
      if (!Array.isArray(_0x407798)) return;
      for (const _0x3f8753 of _0x407798) {
        if (_0x3f8753 && typeof _0x3f8753 === 'object') _0x108243.push(_0x3f8753);
      }
    };
  return (
    _0x46b47c(_0x4f47eb.data),
    _0x46b47c(_0x4f47eb.result),
    _0x46b47c(_0x4f47eb.output),
    _0x46b47c(_0x4f47eb.response),
    _0x3a899e(_0x4f47eb.data),
    _0x3a899e(_0x4f47eb.results),
    _0x108243
  );
}
function extractMessage(_0x429aa5) {
  const _0x376f56 = collectCandidateObjects(_0x429aa5);
  for (const _0x280506 of _0x376f56) {
    const _0x44a371 = String(
      _0x280506?.errorMessage || _0x280506?.error || _0x280506?.message || _0x280506?.msg || '',
    ).trim();
    if (_0x44a371) return _0x44a371;
  }
  return '';
}
function extractErrorCode(_0x5232db) {
  const _0x402265 = collectCandidateObjects(_0x5232db);
  for (const _0x4723df of _0x402265) {
    const _0x1ca910 =
      toNumberCode(_0x4723df.code) ?? toNumberCode(_0x4723df.errorCode) ?? toNumberCode(_0x4723df.error_code);
    if (_0x1ca910 !== null) return _0x1ca910;
  }
  for (const _0x36ebd7 of _0x402265) {
    const _0x45acde = String(
      _0x36ebd7.errorMessage || _0x36ebd7.error || _0x36ebd7.message || _0x36ebd7.msg || '',
    ).toUpperCase();
    if (!_0x45acde) continue;
    for (const [_0x3bac01, _0x44c2c8] of Object.entries(MESSAGE_HINT_TO_CODE)) {
      if (_0x45acde.includes(_0x3bac01)) return _0x44c2c8;
    }
  }
  return null;
}
function buildMappedError(_0x17161a, _0x2d5648, _0xce277c) {
  const _0x2de0fa = MODEL_ERROR_CODE_MAP[_0x17161a];
  if (!_0x2de0fa) return null;
  return new ApiError({
    type: _0x2de0fa.type,
    provider: 'runninghub',
    code: _0x17161a,
    message: _0x2de0fa.message || _0xce277c,
    status: _0x2d5648,
    retryable: _0x2de0fa.retryable,
  });
}
export function parseError(_0x73e47d, _0x43013f) {
  if (!_0x73e47d) return null;
  const _0x4fe586 = extractErrorCode(_0x73e47d);
  if (_0x4fe586 !== null) {
    const _0xf8c5c0 = buildMappedError(_0x4fe586, _0x43013f);
    if (_0xf8c5c0) return _0xf8c5c0;
  }
  const _0x28f1c3 = extractMessage(_0x73e47d);
  if (_0x43013f >= 0x190) return ApiError.fromHttpStatus(_0x43013f, 'runninghub', _0x28f1c3);
  return null;
}
export function parseTaskError(_0x2445e4) {
  if (!_0x2445e4 || typeof _0x2445e4 !== 'object') return null;
  const _0x3c6e84 = extractErrorCode(_0x2445e4);
  if (_0x3c6e84 !== null) {
    const _0x1dd991 = buildMappedError(_0x3c6e84, null);
    if (_0x1dd991) return _0x1dd991;
  }
  const _0x2bb24c = collectCandidateObjects(_0x2445e4)
      .map((_0x26a4cb) =>
        String(_0x26a4cb.status || _0x26a4cb.taskStatus || _0x26a4cb.task_status || '').toUpperCase(),
      )
      .filter(Boolean),
    _0x1bb29e = _0x2bb24c[0] || '';
  if (_0x1bb29e === 'TIMEOUT') return ApiError.taskTimeout('runninghub');
  if (_0x1bb29e === 'FAILED' || _0x1bb29e === 'ERROR') {
    const _0x4f0936 = extractMessage(_0x2445e4) || '任务执行失败';
    return ApiError.taskFailed('runninghub', _0x4f0936);
  }
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
