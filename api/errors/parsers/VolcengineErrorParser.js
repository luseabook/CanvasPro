import { ApiError, ErrorType } from '../ApiError.js';
const PROVIDER = 'volcengine';
function getErrorText(error) {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return '';
  return String(
    error['error']?.['message'] ||
      error['message'] ||
      error['errorMessage'] ||
      error['error_message'] ||
      error['error'] ||
      error['reason'] ||
      error['msg'] ||
      '',
  );
}
function parseModelActivationError(value) {
  if (
    !/has\s+not\s+activated\s+the\s+model/i['test'](value) ||
    !/activate\s+the\s+model\s+service/i['test'](value)
  )
    return null;
  const item = value['match'](/activated\s+the\s+model\s+([^.,\s]+)/i)?.[1] || '',
    key = value['match'](/request\s*id\s*:\s*([^\s]+)/i)?.[1] || '',
    index = item ? '「' + item + '」' : '该模型',
    result = key ? ' 请求 ID：' + key : '';
  return (
    '火山方舟当前账号尚未开通模型' +
    index +
    '。请先前往火山方舟控制台开通该模型服务，并在“API Key 管理”中创建或申请 API Key，然后回到设置 > API Key > 火山方舟填写。' +
    result
  );
}
export function parseError(raw, status = 0) {
  const errorText = getErrorText(raw)['trim'](),
    message = parseModelActivationError(errorText);
  if (!message) return null;
  return new ApiError({
    type: ErrorType['MODEL_UNAVAILABLE'],
    provider: PROVIDER,
    status: status,
    raw: raw,
    retryable: ![],
    message: message,
  });
}
export default { parseError: parseError };
