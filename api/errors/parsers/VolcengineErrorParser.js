import { ApiError, ErrorType } from '../ApiError.js';
const PROVIDER = 'volcengine';
function getErrorText(_0x59f564) {
  if (typeof _0x59f564 === 'string') return _0x59f564;
  if (!_0x59f564 || typeof _0x59f564 !== 'object') return '';
  return String(
    _0x59f564['error']?.['message'] ||
      _0x59f564['message'] ||
      _0x59f564['errorMessage'] ||
      _0x59f564['error_message'] ||
      _0x59f564['error'] ||
      _0x59f564['reason'] ||
      _0x59f564['msg'] ||
      '',
  );
}
function parseModelActivationError(_0x499674) {
  if (
    !/has\s+not\s+activated\s+the\s+model/i['test'](_0x499674) ||
    !/activate\s+the\s+model\s+service/i['test'](_0x499674)
  )
    return null;
  const _0x39a847 = _0x499674['match'](/activated\s+the\s+model\s+([^.,\s]+)/i)?.[0x1] || '',
    _0x17fd19 = _0x499674['match'](/request\s*id\s*:\s*([^\s]+)/i)?.[0x1] || '',
    _0x17a50f = _0x39a847 ? '「' + _0x39a847 + '」' : '该模型',
    _0x5d58ae = _0x17fd19 ? ' 请求 ID：' + _0x17fd19 : '';
  return (
    '火山方舟当前账号尚未开通模型' +
    _0x17a50f +
    '。请先前往火山方舟控制台开通该模型服务，并在“API Key 管理”中创建或申请 API Key，然后回到设置 > API Key > 火山方舟填写。' +
    _0x5d58ae
  );
}
export function parseError(_0xb2f00e, _0x30867b = 0x0) {
  const _0x3b2587 = getErrorText(_0xb2f00e)['trim'](),
    _0x3c14cc = parseModelActivationError(_0x3b2587);
  if (!_0x3c14cc) return null;
  return new ApiError({
    type: ErrorType['MODEL_UNAVAILABLE'],
    provider: PROVIDER,
    status: _0x30867b,
    raw: _0xb2f00e,
    retryable: ![],
    message: _0x3c14cc,
  });
}
export default { parseError: parseError };
