import { ApiError, ErrorType } from '../ApiError.js';
function getErrorText(_0x217773) {
  if (typeof _0x217773 === 'string') return _0x217773;
  if (!_0x217773 || typeof _0x217773 !== 'object') return '';
  return String(
    _0x217773['message'] ||
      _0x217773['error']?.['message'] ||
      _0x217773['error'] ||
      _0x217773['errorMessage'] ||
      _0x217773['error_message'] ||
      _0x217773['reason'] ||
      _0x217773['msg'] ||
      '',
  );
}
function isAudioGenerationResourceDenied(_0x1b329f) {
  return (
    /resource[_\s-]*id\s*=\s*volc\.service_type\.10074/i['test'](_0x1b329f) &&
    /requested\s+resource\s+not\s+granted/i['test'](_0x1b329f)
  );
}
export function parseError(_0x3877b4, _0xc646e2 = 0x0) {
  const _0x4a0d72 = getErrorText(_0x3877b4)['trim']();
  if (isAudioGenerationResourceDenied(_0x4a0d72))
    return new ApiError({
      type: ErrorType['FORBIDDEN'],
      provider: 'volcengine-speech',
      status: _0xc646e2,
      raw: _0x3877b4,
      retryable: ![],
      message:
        '火山语音 Audio 1.0 接口权限未开通：当前 X-Api-Key 没有 doubao-seed-audio-1.0 的 API 白名单/资源权限。请确认使用的是火山语音 X-Api-Key，并在火山控制台为 Audio 1.0 开通接口访问权限；体验中心已开通不等于 API Key 已授权。',
    });
  return null;
}
export default { parseError: parseError };
