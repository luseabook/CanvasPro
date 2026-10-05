import { ApiError, ErrorType } from '../ApiError.js';
function getErrorText(error) {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return '';
  return String(
    error['message'] ||
      error['error']?.['message'] ||
      error['error'] ||
      error['errorMessage'] ||
      error['error_message'] ||
      error['reason'] ||
      error['msg'] ||
      '',
  );
}
function isAudioGenerationResourceDenied(value) {
  return (
    /resource[_\s-]*id\s*=\s*volc\.service_type\.10074/i['test'](value) &&
    /requested\s+resource\s+not\s+granted/i['test'](value)
  );
}
export function parseError(raw, status = 0) {
  const errorText = getErrorText(raw)['trim']();
  if (isAudioGenerationResourceDenied(errorText))
    return new ApiError({
      type: ErrorType['FORBIDDEN'],
      provider: 'volcengine-speech',
      status: status,
      raw: raw,
      retryable: false,
      message:
        '火山语音 Audio 1.0 接口权限未开通：当前 X-Api-Key 没有 doubao-seed-audio-1.0 的 API 白名单/资源权限。请确认使用的是火山语音 X-Api-Key，并在火山控制台为 Audio 1.0 开通接口访问权限；体验中心已开通不等于 API Key 已授权。',
    });
  return null;
}
export default { parseError: parseError };
