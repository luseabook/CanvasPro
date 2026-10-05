import { ApiError, ErrorType } from '../ApiError.js';
const PROVIDER = 'comfyui',
  MAX_NODE_ERRORS = 4,
  MAX_ERROR_TEXT = 520;
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
function normalizeText(error) {
  if (error === undefined || error === null) return '';
  if (typeof error === 'string') return error['trim']();
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (isPlainObject(error)) {
    const value =
      error['message'] ||
      error['details'] ||
      error['detail'] ||
      error['errorMessage'] ||
      error['error_message'] ||
      error['reason'] ||
      error['type'];
    if (value !== undefined && value !== null && value !== error) {
      const text = normalizeText(value);
      if (text) return text;
    }
    try {
      return JSON['stringify'](error);
    } catch {
      return '';
    }
  }
  return String(error || '')['trim']();
}
function firstText(...args) {
  for (const item of args) {
    const text2 = normalizeText(item);
    if (text2) return text2;
  }
  return '';
}
function truncateText(key, index = MAX_ERROR_TEXT) {
  const list = String(key || '')
    ['replace'](/\s+/g, ' ')
    ['trim']();
  if (list['length'] <= index) return list;
  return list['slice'](0, Math['max'](0, index - 1))['trim']() + '...';
}
function simplifyComfyUiDetail(result) {
  const truncateText2 = truncateText(result);
  return truncateText2['replace'](/\s+not in\s+\[[\s\S]*$/i, ' not in current ComfyUI list');
}
function getNodeErrors(data) {
  if (isPlainObject(data?.['node_errors']) && Object['keys'](data['node_errors'])['length'] > 0)
    return data['node_errors'];
  if (isPlainObject(data?.['nodeErrors']) && Object['keys'](data['nodeErrors'])['length'] > 0)
    return data['nodeErrors'];
  if (
    isPlainObject(data?.['error']?.['node_errors']) &&
    Object['keys'](data['error']['node_errors'])['length'] > 0
  )
    return data['error']['node_errors'];
  if (
    isPlainObject(data?.['error']?.['nodeErrors']) &&
    Object['keys'](data['error']['nodeErrors'])['length'] > 0
  )
    return data['error']['nodeErrors'];
  return null;
}
function formatNodeError(options, target) {
  const error2 = isPlainObject(target) ? target : {},
    text3 = firstText(
      error2['class_type'],
      error2['classType'],
      error2['type'],
      error2['title'],
      error2['name'],
    ),
    source = [text3 || 'node', options]['filter'](Boolean)['join'](' '),
    list2 = Array['isArray'](error2['errors']) ? error2['errors'] : [],
    list3 = list2['slice'](0, 2)
      ['map']((error3) => {
        const text4 = firstText(
          error3?.['extra_info']?.['input_name'],
          error3?.['extraInfo']?.['inputName'],
          error3?.['input_name'],
          error3?.['inputName'],
        );
        let list4 = simplifyComfyUiDetail(
          firstText(error3?.['details'], error3?.['detail'], error3?.['message'], error3?.['type']),
        );
        return (text4 && list4 && !list4['includes'](text4) && (list4 = text4 + ': ' + list4), list4);
      })
      ['filter'](Boolean),
    simplifyComfyUiDetail2 = simplifyComfyUiDetail(
      firstText(error2['message'], error2['error'], error2['details'], error2['detail'], error2),
    ),
    next = list3['length'] ? list3['join']('；') : simplifyComfyUiDetail2;
  return next ? source + ': ' + next : '';
}
function formatNodeErrors(current) {
  const nodeErrors = getNodeErrors(current);
  if (!nodeErrors) return '';
  const list5 = Object['entries'](nodeErrors)
      ['slice'](0, MAX_NODE_ERRORS)
      ['map'](([entry, record]) => formatNodeError(entry, record))
      ['filter'](Boolean),
    count = Math['max'](0, Object['keys'](nodeErrors)['length'] - list5['length']);
  return (count > 0 && list5['push']('另有 ' + count + ' 个节点错误'), list5['join']('；'));
}
function hasComfyUiErrorShape(error4) {
  if (!error4 || typeof error4 !== 'object') return false;
  return Boolean(
    error4['error'] ||
    error4['message'] ||
    error4['errorMessage'] ||
    error4['error_message'] ||
    getNodeErrors(error4),
  );
}
function resolveErrorType(payload, count2, handle) {
  const list6 = String(payload?.['error']?.['type'] || payload?.['type'] || '')['toLowerCase'](),
    list7 = String(handle || '')['toLowerCase']();
  if (
    count2 === 400 ||
    list6['includes']('validation') ||
    list6['includes']('invalid') ||
    list7['includes']('failed validation') ||
    list7['includes']('value not in list') ||
    list7['includes']('not in current comfyui list')
  )
    return ErrorType['INVALID_PARAMS'];
  if (count2 >= 500) return ErrorType['SERVER_ERROR'];
  return ErrorType['TASK_FAILED'];
}
function buildComfyUiErrorMessage(error5, state = 'ComfyUI 工作流执行失败') {
  const text5 = firstText(
      error5?.['error']?.['message'],
      error5?.['message'],
      error5?.['errorMessage'],
      error5?.['error_message'],
      error5?.['error']?.['type'],
    ),
    text6 = firstText(error5?.['error']?.['details'], error5?.['details'], error5?.['detail']),
    formatNodeErrors2 = formatNodeErrors(error5),
    list8 = [];
  if (text5) list8['push'](truncateText(text5));
  if (text6 && text6 !== text5) list8['push'](simplifyComfyUiDetail(text6));
  if (formatNodeErrors2) list8['push'](formatNodeErrors2);
  const config = list8['join']('；') || normalizeText(error5) || state;
  return config['startsWith']('ComfyUI') ? config : 'ComfyUI 工作流报错：' + config;
}
export function parseError(raw, status = 0) {
  if (!hasComfyUiErrorShape(raw) && Number(status) < 400) return null;
  const message = buildComfyUiErrorMessage(raw, 'ComfyUI 请求失败');
  return new ApiError({
    type: resolveErrorType(raw, Number(status) || 0, message),
    provider: PROVIDER,
    status: status,
    message: message,
    raw: raw,
    retryable: Number(status) >= 500,
  });
}
export function parseTaskError(raw2) {
  if (!hasComfyUiErrorShape(raw2)) return null;
  const scope = String(raw2?.['status'] || raw2?.['state'] || '')['toLowerCase']();
  if (scope && !['failed', 'fail', 'error', 'cancelled', 'canceled']['includes'](scope)) return null;
  return new ApiError({
    type: ErrorType['TASK_FAILED'],
    provider: PROVIDER,
    message: buildComfyUiErrorMessage(raw2),
    raw: raw2,
    retryable: false,
  });
}
export default { parseError: parseError, parseTaskError: parseTaskError };
