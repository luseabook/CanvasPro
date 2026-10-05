import { ApiError, ErrorType } from '../ApiError.js';
const RH_ERROR_CODE_MAP = {
    301: { type: ErrorType.INVALID_PARAMS, message: '参数错误：必填参数缺失或类型不符，请核对文档' },
    380: { type: ErrorType.INVALID_PARAMS, message: '工作流不存在：指定的工作流 ID 无效' },
    412: { type: ErrorType.INVALID_PARAMS, message: 'API 路径拼写错误：请检查接口 URL 是否正确' },
    415: {
      type: ErrorType.RATE_LIMIT,
      message: '独占型 API 机器数不足：资源紧张，请等待 30-120 秒后重试',
      retryable: true,
    },
    416: {
      type: ErrorType.INSUFFICIENT_BALANCE,
      message: '钱包余额不足：账户余额不足，请充值',
      retryable: false,
    },
    421: {
      type: ErrorType.RATE_LIMIT,
      message: '共享型 API 并发上限：并发达上限，请自行排队或联系扩容',
      retryable: true,
    },
    423: {
      type: ErrorType.TASK_FAILED,
      message: '未找到指定任务：任务 ID 错误或已被清理',
      retryable: false,
    },
    433: {
      type: ErrorType.INVALID_PARAMS,
      message: '工作流校验未通过：节点参数或连接逻辑错误，请查看 msg 详情',
    },
    435: {
      type: ErrorType.INVALID_PARAMS,
      message: '未找到任务用户 API 实例：48G显存机器调用时请添加参数 "instanceType": "plus"',
    },
    436: { type: ErrorType.FORBIDDEN, message: '独占会员到期：独占资源服务已到期', retryable: false },
    500: { type: ErrorType.SERVER_ERROR, message: '未知错误：服务端异常，请联系技术支持', retryable: true },
    801: {
      type: ErrorType.FORBIDDEN,
      message: '免费用户不支持 API Key：请升级账户等级',
      retryable: false,
    },
    802: {
      type: ErrorType.AUTH_ERROR,
      message: 'API Key 未授权/已失效：密钥错误或已被禁用',
      retryable: false,
    },
    803: {
      type: ErrorType.INVALID_PARAMS,
      message: 'nodeInfoList 不匹配：节点 ID 或字段名与工作流定义不一致',
    },
    804: {
      type: ErrorType.INVALID_PARAMS,
      message: '任务正在运行中：请勿重复提交，建议轮询结果',
      retryable: false,
    },
    805: { type: ErrorType.TASK_FAILED, message: '任务状态异常：任务可能已被中断或取消', retryable: false },
    806: {
      type: ErrorType.AUTH_ERROR,
      message: '未找到对应用户：Key 关联的用户信息不存在',
      retryable: false,
    },
    807: {
      type: ErrorType.TASK_FAILED,
      message: '未找到对应任务：无法查询到该 ID 的任务记录',
      retryable: false,
    },
    808: { type: ErrorType.SERVER_ERROR, message: '文件上传失败：存储服务异常或网络中断', retryable: true },
    809: {
      type: ErrorType.INVALID_PARAMS,
      message: '文件大小超出限制：上传的文件体积过大',
      retryable: false,
    },
    810: {
      type: ErrorType.INVALID_PARAMS,
      message: '未保存或未运行工作流：请在平台保存并手动运行一次该工作流',
      retryable: false,
    },
    811: {
      type: ErrorType.AUTH_ERROR,
      message: '企业版 API Key 无效：密钥错误或无企业权限',
      retryable: false,
    },
    812: {
      type: ErrorType.INSUFFICIENT_BALANCE,
      message: '企业版余额不足：企业账户资金耗尽',
      retryable: false,
    },
    813: { type: ErrorType.INVALID_PARAMS, message: '任务已排队：任务已受理，无需重试', retryable: false },
    901: { type: ErrorType.INVALID_PARAMS, message: 'WebApp 不存在：关联的应用 ID 错误', retryable: false },
    1000: { type: ErrorType.SERVER_ERROR, message: '未知错误：请重试或联系支持', retryable: true },
    1001: { type: ErrorType.INVALID_PARAMS, message: '请求链接无效：请检查您的调用链接', retryable: false },
    1002: { type: ErrorType.AUTH_ERROR, message: 'API Key 无效：请检查您的密钥', retryable: false },
    1003: { type: ErrorType.RATE_LIMIT, message: '请求频率超限：请降低请求速度', retryable: true },
    1004: { type: ErrorType.TASK_FAILED, message: '任务不存在或已过期：请检查任务 ID', retryable: false },
    1005: { type: ErrorType.SERVER_ERROR, message: '系统内部错误：请稍后重试', retryable: true },
    1006: { type: ErrorType.TASK_TIMEOUT, message: '任务执行超时：请重试', retryable: true },
    1007: { type: ErrorType.INVALID_PARAMS, message: '参数校验失败：请检查输入参数', retryable: false },
    1008: {
      type: ErrorType.INVALID_PARAMS,
      message: '文件大小超出限制：请压缩文件后重试',
      retryable: false,
    },
    1009: {
      type: ErrorType.INVALID_PARAMS,
      message: '请求方法不支持：请查阅文档确认 (GET/POST)',
      retryable: false,
    },
    1010: { type: ErrorType.SERVICE_UNAVAILABLE, message: '服务暂不可用：请稍后重试', retryable: true },
    1011: { type: ErrorType.RATE_LIMIT, message: '系统繁忙：请求量大，请稍后重试', retryable: true },
    1012: {
      type: ErrorType.SERVER_ERROR,
      message: '上游服务响应异常：请联系技术支持或稍后重试',
      retryable: true,
    },
    1013: { type: ErrorType.SERVER_ERROR, message: '文件处理失败：请检查链接或重新上传', retryable: true },
    1014: {
      type: ErrorType.FORBIDDEN,
      message: '访问被拒绝：标准模型 API 仅限企业级-共享 API Key 调用',
      retryable: false,
    },
    1015: { type: ErrorType.TASK_FAILED, message: '生成失败：请重试', retryable: true },
    1101: {
      type: ErrorType.INVALID_PARAMS,
      message: '节点信息异常：工作流节点数据解析错误',
      retryable: false,
    },
    1501: {
      type: ErrorType.CONTENT_FILTERED,
      message: '内容审核未通过：请修改提示词或图片',
      retryable: false,
    },
    1504: { type: ErrorType.TIMEOUT, message: '模型响应超时：请稍后重试', retryable: true },
    1505: {
      type: ErrorType.CONTENT_FILTERED,
      message: '禁止生成真人：请修改提示词或参考图',
      retryable: false,
    },
  },
  RH_ERROR_MSG_MAP = {
    PARAMS_INVALID: 301,
    WORKFLOW_NOT_EXISTS: 380,
    TOKEN_INVALID: 412,
    TASK_INSTANCE_MAXED: 415,
    TASK_CREATE_FAILED_BY_NOT_ENOUGH_WALLET: 416,
    TASK_QUEUE_MAXED: 421,
    TASK_NOT_FOUNED: 423,
    VALIDATE_PROMPT_FAILED: 433,
    TASK_USER_EXCLAPI_INSTANCE_NOT_FOUND: 435,
    TASK_USER_EXCLAPI_REQUIRED: 436,
    UNKNOWN_ERROR: 500,
    APIKEY_UNSUPPORTED_FREE_USER: 801,
    APIKEY_UNAUTHORIZED: 802,
    APIKEY_INVALID_NODE_INFO: 803,
    APIKEY_TASK_IS_RUNNING: 804,
    APIKEY_TASK_STATUS_ERROR: 805,
    APIKEY_USER_NOT_FOUND: 806,
    APIKEY_TASK_NOT_FOUND: 807,
    APIKEY_UPLOAD_FAILED: 808,
    APIKEY_FILE_SIZE_EXCEEDED: 809,
    WORKFLOW_NOT_SAVED_OR_NOT_RUNNING: 810,
    CORPAPIKEY_INVALID: 811,
    CORPAPIKEY_INSUFFICIENT_FUNDS: 812,
    APIKEY_TASK_IS_QUEUED: 813,
    WEBAPP_NOT_EXISTS: 901,
  };
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function toNonEmptyString(value) {
  const item = String(value ?? '').trim();
  return item || '';
}
function toMessageString(error) {
  if (isPlainObject(error))
    return toNonEmptyString(error.errorMessage || error.message || error.error || error.msg);
  return toNonEmptyString(error);
}
function parseJsonObject(key) {
  const toNonEmptyString2 = toNonEmptyString(key);
  if (!toNonEmptyString2 || !/^[{[]/.test(toNonEmptyString2)) return null;
  try {
    const index = JSON.parse(toNonEmptyString2);
    return index && typeof index === 'object' ? index : null;
  } catch {
    return null;
  }
}
function collectCandidateObjects(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return [];
  const list = [],
    handler = (result) => {
      if (isPlainObject(result)) list.push(result);
    },
    handler2 = (list2) => {
      if (!Array.isArray(list2)) return;
      list2.forEach(handler);
    };
  return (
    handler(enabled2),
    handler2(enabled2),
    handler(enabled2.data),
    handler(enabled2.result),
    handler(enabled2.output),
    handler(enabled2.response),
    handler2(enabled2.data),
    handler2(enabled2.results),
    list
  );
}
function extractFailureBaseMessage(data, options) {
  const candidateObjects = collectCandidateObjects(data);
  for (const error2 of candidateObjects) {
    const target = [error2.errorMessage, error2.error, error2.message, error2.msg, error2.failure_reason];
    for (const source of target) {
      const toMessageString2 = toMessageString(source);
      if (toMessageString2) return toMessageString2;
    }
  }
  return toNonEmptyString(options) || '任务执行失败';
}
function extractDetailFromText(next) {
  const toNonEmptyString3 = toNonEmptyString(next);
  if (!toNonEmptyString3) return { nodeId: '', exceptionMessage: '' };
  const current = toNonEmptyString3.match(/["']?node_id["']?\s*[:=]\s*["']?([^"',}\]\n\r]*)/i),
    entry = toNonEmptyString3.match(/["']?exception_message["']?\s*[:=]\s*["']?([^"',}\]\n\r]*)/i);
  return { nodeId: toNonEmptyString(current?.[1]), exceptionMessage: toNonEmptyString(entry?.[1]) };
}
function extractDetailFromValue(record) {
  const jsonObject = parseJsonObject(record),
    payload = jsonObject || record;
  if (isPlainObject(payload)) {
    const nodeId = toNonEmptyString(payload.node_id || payload.nodeId),
      exceptionMessage = toNonEmptyString(payload.exception_message || payload.exceptionMessage);
    if (nodeId || exceptionMessage) return { nodeId: nodeId, exceptionMessage: exceptionMessage };
  }
  if (typeof payload === 'string') return extractDetailFromText(payload);
  return { nodeId: '', exceptionMessage: '' };
}
function extractFailedReasonDetails(handle) {
  const candidateObjects2 = collectCandidateObjects(handle);
  for (const state of candidateObjects2) {
    const extractDetailFromValue2 = extractDetailFromValue(state);
    if (extractDetailFromValue2.nodeId || extractDetailFromValue2.exceptionMessage)
      return extractDetailFromValue2;
    const config = state.failedReason ?? state.failed_reason,
      extractDetailFromValue3 = extractDetailFromValue(config);
    if (extractDetailFromValue3.nodeId || extractDetailFromValue3.exceptionMessage)
      return extractDetailFromValue3;
    const extractDetailFromValue4 = extractDetailFromValue(
      state.data?.failedReason ?? state.data?.failed_reason,
    );
    if (extractDetailFromValue4.nodeId || extractDetailFromValue4.exceptionMessage)
      return extractDetailFromValue4;
  }
  return { nodeId: '', exceptionMessage: '' };
}
export function appendRunningHubFailureDetails(scope, input) {
  const toNonEmptyString4 = toNonEmptyString(scope) || '任务执行失败',
    { nodeId: nodeId2, exceptionMessage: exceptionMessage2 } = extractFailedReasonDetails(input),
    list3 = [toNonEmptyString4];
  if (nodeId2) list3.push('node_id: ' + nodeId2);
  if (exceptionMessage2) list3.push('exception_message: ' + exceptionMessage2);
  return list3.join('\n');
}
export function formatRunningHubFailureMessage(output, value2 = '任务执行失败') {
  return appendRunningHubFailureDetails(extractFailureBaseMessage(output, value2), output);
}
function extractErrorCode(error3) {
  if (error3.code && typeof error3.code === 'number') return error3.code;
  const list4 = error3.msg || error3.message || error3.errorMessage || error3.error || '';
  for (const [value3, value4] of Object.entries(RH_ERROR_MSG_MAP)) {
    if (list4.includes(value3)) return value4;
  }
  return null;
}
export function parseError(error4, status) {
  if (!error4) return null;
  const taskError = parseTaskError(error4);
  if (taskError) return taskError;
  const code = extractErrorCode(error4);
  if (code && RH_ERROR_CODE_MAP[code]) {
    const type = RH_ERROR_CODE_MAP[code];
    return new ApiError({
      type: type.type,
      provider: 'runninghub',
      code: code,
      message: appendRunningHubFailureDetails(type.message, error4),
      status: status,
      retryable: type.retryable ?? (code >= 1005 && code !== 1015),
    });
  }
  const value5 = error4.errorMessage || error4.error || error4.message || error4.msg || '',
    list5 = String(value5).toUpperCase();
  if (
    list5.includes('BALANCE') ||
    list5.includes('WALLET') ||
    list5.includes('余额') ||
    list5.includes('资金')
  )
    return ApiError.insufficientBalance('runninghub', code || status);
  if (
    status === 401 ||
    list5.includes('API_KEY') ||
    list5.includes('UNAUTHORIZED') ||
    list5.includes('AUTH')
  )
    return ApiError.authError('runninghub', code || status, value5);
  if (
    status === 429 ||
    list5.includes('RATE_LIMIT') ||
    list5.includes('TOO_MANY') ||
    list5.includes('繁忙')
  )
    return ApiError.rateLimit('runninghub', code || status);
  if (
    list5.includes('CONTENT') ||
    list5.includes('审核') ||
    list5.includes('真人') ||
    list5.includes('PHOTOREALISTIC')
  )
    return ApiError.contentFiltered('runninghub', value5);
  const value6 = (error4.status || '').toUpperCase();
  if (value6 === 'FAILED' || value6 === 'ERROR')
    return ApiError.taskFailed(
      'runninghub',
      formatRunningHubFailureMessage(error4, value5 || '任务执行失败'),
    );
  if (status >= 400) return ApiError.fromHttpStatus(status, 'runninghub', value5);
  return null;
}
export function parseTaskError(response) {
  if (!response) return null;
  const candidateObjects3 = collectCandidateObjects(response).find((response2) => {
      const value7 = String(
        response2.status || response2.taskStatus || response2.task_status || '',
      ).toUpperCase();
      return value7 === 'FAILED' || value7 === 'ERROR';
    }),
    value8 = candidateObjects3 ? 'FAILED' : (response.status || response.taskStatus || '').toUpperCase();
  if (value8 === 'FAILED' || value8 === 'ERROR') {
    const value9 = candidateObjects3 || response,
      list6 = extractFailureBaseMessage(value9, '未知错误');
    for (const [value10, code2] of Object.entries(RH_ERROR_MSG_MAP)) {
      if (list6.includes(value10) && RH_ERROR_CODE_MAP[code2]) {
        const type2 = RH_ERROR_CODE_MAP[code2];
        return new ApiError({
          type: type2.type,
          provider: 'runninghub',
          code: code2,
          message: appendRunningHubFailureDetails(type2.message, value9),
          retryable: type2.retryable ?? false,
        });
      }
    }
    return ApiError.taskFailed('runninghub', formatRunningHubFailureMessage(value9, list6));
  }
  if (value8 === 'TIMEOUT') return ApiError.taskTimeout('runninghub');
  return null;
}
export default { parseError: parseError, parseTaskError: parseTaskError };
