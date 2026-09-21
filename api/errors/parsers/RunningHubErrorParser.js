import { ApiError, ErrorType } from '../ApiError.js';
const RH_ERROR_CODE_MAP = {
    0x12d: { type: ErrorType.INVALID_PARAMS, message: '参数错误：必填参数缺失或类型不符，请核对文档' },
    0x17c: { type: ErrorType.INVALID_PARAMS, message: '工作流不存在：指定的工作流 ID 无效' },
    0x19c: { type: ErrorType.INVALID_PARAMS, message: 'API 路径拼写错误：请检查接口 URL 是否正确' },
    0x19f: {
      type: ErrorType.RATE_LIMIT,
      message: '独占型 API 机器数不足：资源紧张，请等待 30-120 秒后重试',
      retryable: true,
    },
    0x1a0: {
      type: ErrorType.INSUFFICIENT_BALANCE,
      message: '钱包余额不足：账户余额不足，请充值',
      retryable: false,
    },
    0x1a5: {
      type: ErrorType.RATE_LIMIT,
      message: '共享型 API 并发上限：并发达上限，请自行排队或联系扩容',
      retryable: true,
    },
    0x1a7: {
      type: ErrorType.TASK_FAILED,
      message: '未找到指定任务：任务 ID 错误或已被清理',
      retryable: false,
    },
    0x1b1: {
      type: ErrorType.INVALID_PARAMS,
      message: '工作流校验未通过：节点参数或连接逻辑错误，请查看 msg 详情',
    },
    0x1b3: {
      type: ErrorType.INVALID_PARAMS,
      message: '未找到任务用户 API 实例：48G显存机器调用时请添加参数 "instanceType": "plus"',
    },
    0x1b4: { type: ErrorType.FORBIDDEN, message: '独占会员到期：独占资源服务已到期', retryable: false },
    0x1f4: { type: ErrorType.SERVER_ERROR, message: '未知错误：服务端异常，请联系技术支持', retryable: true },
    0x321: {
      type: ErrorType.FORBIDDEN,
      message: '免费用户不支持 API Key：请升级账户等级',
      retryable: false,
    },
    0x322: {
      type: ErrorType.AUTH_ERROR,
      message: 'API Key 未授权/已失效：密钥错误或已被禁用',
      retryable: false,
    },
    0x323: {
      type: ErrorType.INVALID_PARAMS,
      message: 'nodeInfoList 不匹配：节点 ID 或字段名与工作流定义不一致',
    },
    0x324: {
      type: ErrorType.INVALID_PARAMS,
      message: '任务正在运行中：请勿重复提交，建议轮询结果',
      retryable: false,
    },
    0x325: { type: ErrorType.TASK_FAILED, message: '任务状态异常：任务可能已被中断或取消', retryable: false },
    0x326: {
      type: ErrorType.AUTH_ERROR,
      message: '未找到对应用户：Key 关联的用户信息不存在',
      retryable: false,
    },
    0x327: {
      type: ErrorType.TASK_FAILED,
      message: '未找到对应任务：无法查询到该 ID 的任务记录',
      retryable: false,
    },
    0x328: { type: ErrorType.SERVER_ERROR, message: '文件上传失败：存储服务异常或网络中断', retryable: true },
    0x329: {
      type: ErrorType.INVALID_PARAMS,
      message: '文件大小超出限制：上传的文件体积过大',
      retryable: false,
    },
    0x32a: {
      type: ErrorType.INVALID_PARAMS,
      message: '未保存或未运行工作流：请在平台保存并手动运行一次该工作流',
      retryable: false,
    },
    0x32b: {
      type: ErrorType.AUTH_ERROR,
      message: '企业版 API Key 无效：密钥错误或无企业权限',
      retryable: false,
    },
    0x32c: {
      type: ErrorType.INSUFFICIENT_BALANCE,
      message: '企业版余额不足：企业账户资金耗尽',
      retryable: false,
    },
    0x32d: { type: ErrorType.INVALID_PARAMS, message: '任务已排队：任务已受理，无需重试', retryable: false },
    0x385: { type: ErrorType.INVALID_PARAMS, message: 'WebApp 不存在：关联的应用 ID 错误', retryable: false },
    0x3e8: { type: ErrorType.SERVER_ERROR, message: '未知错误：请重试或联系支持', retryable: true },
    0x3e9: { type: ErrorType.INVALID_PARAMS, message: '请求链接无效：请检查您的调用链接', retryable: false },
    0x3ea: { type: ErrorType.AUTH_ERROR, message: 'API Key 无效：请检查您的密钥', retryable: false },
    0x3eb: { type: ErrorType.RATE_LIMIT, message: '请求频率超限：请降低请求速度', retryable: true },
    0x3ec: { type: ErrorType.TASK_FAILED, message: '任务不存在或已过期：请检查任务 ID', retryable: false },
    0x3ed: { type: ErrorType.SERVER_ERROR, message: '系统内部错误：请稍后重试', retryable: true },
    0x3ee: { type: ErrorType.TASK_TIMEOUT, message: '任务执行超时：请重试', retryable: true },
    0x3ef: { type: ErrorType.INVALID_PARAMS, message: '参数校验失败：请检查输入参数', retryable: false },
    0x3f0: {
      type: ErrorType.INVALID_PARAMS,
      message: '文件大小超出限制：请压缩文件后重试',
      retryable: false,
    },
    0x3f1: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求方法不支持：请查阅文档确认 (GET/POST)',
      retryable: false,
    },
    0x3f2: { type: ErrorType.SERVICE_UNAVAILABLE, message: '服务暂不可用：请稍后重试', retryable: true },
    0x3f3: { type: ErrorType.RATE_LIMIT, message: '系统繁忙：请求量大，请稍后重试', retryable: true },
    0x3f4: {
      type: ErrorType.SERVER_ERROR,
      message: '上游服务响应异常：请联系技术支持或稍后重试',
      retryable: true,
    },
    0x3f5: { type: ErrorType.SERVER_ERROR, message: '文件处理失败：请检查链接或重新上传', retryable: true },
    0x3f6: {
      type: ErrorType.FORBIDDEN,
      message: '访问被拒绝：标准模型 API 仅限企业级-共享 API Key 调用',
      retryable: false,
    },
    0x3f7: { type: ErrorType.TASK_FAILED, message: '生成失败：请重试', retryable: true },
    0x44d: {
      type: ErrorType.INVALID_PARAMS,
      message: '节点信息异常：工作流节点数据解析错误',
      retryable: false,
    },
    0x5dd: {
      type: ErrorType.CONTENT_FILTERED,
      message: '内容审核未通过：请修改提示词或图片',
      retryable: false,
    },
    0x5e0: { type: ErrorType.TIMEOUT, message: '模型响应超时：请稍后重试', retryable: true },
    0x5e1: {
      type: ErrorType.CONTENT_FILTERED,
      message: '禁止生成真人：请修改提示词或参考图',
      retryable: false,
    },
  },
  RH_ERROR_MSG_MAP = {
    PARAMS_INVALID: 0x12d,
    WORKFLOW_NOT_EXISTS: 0x17c,
    TOKEN_INVALID: 0x19c,
    TASK_INSTANCE_MAXED: 0x19f,
    TASK_CREATE_FAILED_BY_NOT_ENOUGH_WALLET: 0x1a0,
    TASK_QUEUE_MAXED: 0x1a5,
    TASK_NOT_FOUNED: 0x1a7,
    VALIDATE_PROMPT_FAILED: 0x1b1,
    TASK_USER_EXCLAPI_INSTANCE_NOT_FOUND: 0x1b3,
    TASK_USER_EXCLAPI_REQUIRED: 0x1b4,
    UNKNOWN_ERROR: 0x1f4,
    APIKEY_UNSUPPORTED_FREE_USER: 0x321,
    APIKEY_UNAUTHORIZED: 0x322,
    APIKEY_INVALID_NODE_INFO: 0x323,
    APIKEY_TASK_IS_RUNNING: 0x324,
    APIKEY_TASK_STATUS_ERROR: 0x325,
    APIKEY_USER_NOT_FOUND: 0x326,
    APIKEY_TASK_NOT_FOUND: 0x327,
    APIKEY_UPLOAD_FAILED: 0x328,
    APIKEY_FILE_SIZE_EXCEEDED: 0x329,
    WORKFLOW_NOT_SAVED_OR_NOT_RUNNING: 0x32a,
    CORPAPIKEY_INVALID: 0x32b,
    CORPAPIKEY_INSUFFICIENT_FUNDS: 0x32c,
    APIKEY_TASK_IS_QUEUED: 0x32d,
    WEBAPP_NOT_EXISTS: 0x385,
  };
function isPlainObject(_0x4b6803) {
  return !!_0x4b6803 && typeof _0x4b6803 === 'object' && !Array.isArray(_0x4b6803);
}
function toNonEmptyString(_0x38c322) {
  const _0x5301c0 = String(_0x38c322 ?? '').trim();
  return _0x5301c0 || '';
}
function toMessageString(_0x38c242) {
  if (isPlainObject(_0x38c242))
    return toNonEmptyString(_0x38c242.errorMessage || _0x38c242.message || _0x38c242.error || _0x38c242.msg);
  return toNonEmptyString(_0x38c242);
}
function parseJsonObject(_0x53641f) {
  const _0x4fe543 = toNonEmptyString(_0x53641f);
  if (!_0x4fe543 || !/^[{[]/.test(_0x4fe543)) return null;
  try {
    const _0x74c5cc = JSON.parse(_0x4fe543);
    return _0x74c5cc && typeof _0x74c5cc === 'object' ? _0x74c5cc : null;
  } catch {
    return null;
  }
}
function collectCandidateObjects(_0x3c61a7) {
  if (!_0x3c61a7 || typeof _0x3c61a7 !== 'object') return [];
  const _0x8c42f0 = [],
    _0xf0dd32 = (_0x216264) => {
      if (isPlainObject(_0x216264)) _0x8c42f0.push(_0x216264);
    },
    _0x4c0259 = (_0x5507e0) => {
      if (!Array.isArray(_0x5507e0)) return;
      _0x5507e0.forEach(_0xf0dd32);
    };
  return (
    _0xf0dd32(_0x3c61a7),
    _0x4c0259(_0x3c61a7),
    _0xf0dd32(_0x3c61a7.data),
    _0xf0dd32(_0x3c61a7.result),
    _0xf0dd32(_0x3c61a7.output),
    _0xf0dd32(_0x3c61a7.response),
    _0x4c0259(_0x3c61a7.data),
    _0x4c0259(_0x3c61a7.results),
    _0x8c42f0
  );
}
function extractFailureBaseMessage(_0x406621, _0x51d5cb) {
  const _0x119a8a = collectCandidateObjects(_0x406621);
  for (const _0x3b1d9f of _0x119a8a) {
    const _0x57e6f7 = [
      _0x3b1d9f.errorMessage,
      _0x3b1d9f.error,
      _0x3b1d9f.message,
      _0x3b1d9f.msg,
      _0x3b1d9f.failure_reason,
    ];
    for (const _0x1a5b2d of _0x57e6f7) {
      const _0x402cd5 = toMessageString(_0x1a5b2d);
      if (_0x402cd5) return _0x402cd5;
    }
  }
  return toNonEmptyString(_0x51d5cb) || '任务执行失败';
}
function extractDetailFromText(_0xc85361) {
  const _0x50c45b = toNonEmptyString(_0xc85361);
  if (!_0x50c45b) return { nodeId: '', exceptionMessage: '' };
  const _0x4ee495 = _0x50c45b.match(/["']?node_id["']?\s*[:=]\s*["']?([^"',}\]\n\r]*)/i),
    _0x1917bf = _0x50c45b.match(/["']?exception_message["']?\s*[:=]\s*["']?([^"',}\]\n\r]*)/i);
  return { nodeId: toNonEmptyString(_0x4ee495?.[1]), exceptionMessage: toNonEmptyString(_0x1917bf?.[1]) };
}
function extractDetailFromValue(_0x28cfce) {
  const _0x3d7703 = parseJsonObject(_0x28cfce),
    _0x192cfe = _0x3d7703 || _0x28cfce;
  if (isPlainObject(_0x192cfe)) {
    const _0x504bf1 = toNonEmptyString(_0x192cfe.node_id || _0x192cfe.nodeId),
      _0x5ec658 = toNonEmptyString(_0x192cfe.exception_message || _0x192cfe.exceptionMessage);
    if (_0x504bf1 || _0x5ec658) return { nodeId: _0x504bf1, exceptionMessage: _0x5ec658 };
  }
  if (typeof _0x192cfe === 'string') return extractDetailFromText(_0x192cfe);
  return { nodeId: '', exceptionMessage: '' };
}
function extractFailedReasonDetails(_0x1a688c) {
  const _0x500421 = collectCandidateObjects(_0x1a688c);
  for (const _0xdab356 of _0x500421) {
    const _0x29afb9 = extractDetailFromValue(_0xdab356);
    if (_0x29afb9.nodeId || _0x29afb9.exceptionMessage) return _0x29afb9;
    const _0x3b6d40 = _0xdab356.failedReason ?? _0xdab356.failed_reason,
      _0x5eff0c = extractDetailFromValue(_0x3b6d40);
    if (_0x5eff0c.nodeId || _0x5eff0c.exceptionMessage) return _0x5eff0c;
    const _0x299398 = extractDetailFromValue(_0xdab356.data?.failedReason ?? _0xdab356.data?.failed_reason);
    if (_0x299398.nodeId || _0x299398.exceptionMessage) return _0x299398;
  }
  return { nodeId: '', exceptionMessage: '' };
}
export function appendRunningHubFailureDetails(_0xe6cd94, _0x930cbd) {
  const _0x66a563 = toNonEmptyString(_0xe6cd94) || '任务执行失败',
    { nodeId: _0x554756, exceptionMessage: _0x21fffa } = extractFailedReasonDetails(_0x930cbd),
    _0x3549a6 = [_0x66a563];
  if (_0x554756) _0x3549a6.push('node_id: ' + _0x554756);
  if (_0x21fffa) _0x3549a6.push('exception_message: ' + _0x21fffa);
  return _0x3549a6.join('\n');
}
export function formatRunningHubFailureMessage(_0x3faabf, _0xabcfe1 = '任务执行失败') {
  return appendRunningHubFailureDetails(extractFailureBaseMessage(_0x3faabf, _0xabcfe1), _0x3faabf);
}
function extractErrorCode(_0x3906e0) {
  if (_0x3906e0.code && typeof _0x3906e0.code === 'number') return _0x3906e0.code;
  const _0x45df4c = _0x3906e0.msg || _0x3906e0.message || _0x3906e0.errorMessage || _0x3906e0.error || '';
  for (const [_0x5269c1, _0x8d11cc] of Object.entries(RH_ERROR_MSG_MAP)) {
    if (_0x45df4c.includes(_0x5269c1)) return _0x8d11cc;
  }
  return null;
}
export function parseError(_0x1a9454, _0x388556) {
  if (!_0x1a9454) return null;
  const _0x4be2d8 = parseTaskError(_0x1a9454);
  if (_0x4be2d8) return _0x4be2d8;
  const _0x12bb9b = extractErrorCode(_0x1a9454);
  if (_0x12bb9b && RH_ERROR_CODE_MAP[_0x12bb9b]) {
    const _0x355912 = RH_ERROR_CODE_MAP[_0x12bb9b];
    return new ApiError({
      type: _0x355912.type,
      provider: 'runninghub',
      code: _0x12bb9b,
      message: appendRunningHubFailureDetails(_0x355912.message, _0x1a9454),
      status: _0x388556,
      retryable: _0x355912.retryable ?? (_0x12bb9b >= 0x3ed && _0x12bb9b !== 0x3f7),
    });
  }
  const _0x591684 = _0x1a9454.errorMessage || _0x1a9454.error || _0x1a9454.message || _0x1a9454.msg || '',
    _0x2bbae8 = String(_0x591684).toUpperCase();
  if (
    _0x2bbae8.includes('BALANCE') ||
    _0x2bbae8.includes('WALLET') ||
    _0x2bbae8.includes('余额') ||
    _0x2bbae8.includes('资金')
  )
    return ApiError.insufficientBalance('runninghub', _0x12bb9b || _0x388556);
  if (
    _0x388556 === 0x191 ||
    _0x2bbae8.includes('API_KEY') ||
    _0x2bbae8.includes('UNAUTHORIZED') ||
    _0x2bbae8.includes('AUTH')
  )
    return ApiError.authError('runninghub', _0x12bb9b || _0x388556, _0x591684);
  if (
    _0x388556 === 0x1ad ||
    _0x2bbae8.includes('RATE_LIMIT') ||
    _0x2bbae8.includes('TOO_MANY') ||
    _0x2bbae8.includes('繁忙')
  )
    return ApiError.rateLimit('runninghub', _0x12bb9b || _0x388556);
  if (
    _0x2bbae8.includes('CONTENT') ||
    _0x2bbae8.includes('审核') ||
    _0x2bbae8.includes('真人') ||
    _0x2bbae8.includes('PHOTOREALISTIC')
  )
    return ApiError.contentFiltered('runninghub', _0x591684);
  const _0x56e356 = (_0x1a9454.status || '').toUpperCase();
  if (_0x56e356 === 'FAILED' || _0x56e356 === 'ERROR')
    return ApiError.taskFailed(
      'runninghub',
      formatRunningHubFailureMessage(_0x1a9454, _0x591684 || '任务执行失败'),
    );
  if (_0x388556 >= 0x190) return ApiError.fromHttpStatus(_0x388556, 'runninghub', _0x591684);
  return null;
}
export function parseTaskError(_0x44e9ee) {
  if (!_0x44e9ee) return null;
  const _0x3898ee = collectCandidateObjects(_0x44e9ee).find((_0x14ba4c) => {
      const _0x273f30 = String(
        _0x14ba4c.status || _0x14ba4c.taskStatus || _0x14ba4c.task_status || '',
      ).toUpperCase();
      return _0x273f30 === 'FAILED' || _0x273f30 === 'ERROR';
    }),
    _0x4de2d0 = _0x3898ee ? 'FAILED' : (_0x44e9ee.status || _0x44e9ee.taskStatus || '').toUpperCase();
  if (_0x4de2d0 === 'FAILED' || _0x4de2d0 === 'ERROR') {
    const _0x5b1444 = _0x3898ee || _0x44e9ee,
      _0x330830 = extractFailureBaseMessage(_0x5b1444, '未知错误');
    for (const [_0x1ddf27, _0x365861] of Object.entries(RH_ERROR_MSG_MAP)) {
      if (_0x330830.includes(_0x1ddf27) && RH_ERROR_CODE_MAP[_0x365861]) {
        const _0xd30b85 = RH_ERROR_CODE_MAP[_0x365861];
        return new ApiError({
          type: _0xd30b85.type,
          provider: 'runninghub',
          code: _0x365861,
          message: appendRunningHubFailureDetails(_0xd30b85.message, _0x5b1444),
          retryable: _0xd30b85.retryable ?? false,
        });
      }
    }
    return ApiError.taskFailed('runninghub', formatRunningHubFailureMessage(_0x5b1444, _0x330830));
  }
  if (_0x4de2d0 === 'TIMEOUT') return ApiError.taskTimeout('runninghub');
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
