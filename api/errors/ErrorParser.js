import * as PpioErrorParser from './parsers/PpioErrorParser.js';
import * as ApimartErrorParser from './parsers/ApimartErrorParser.js';
import * as RunningHubErrorParser from './parsers/RunningHubErrorParser.js';
import * as RunningHubModelErrorParser from './parsers/RunningHubModelErrorParser.js';
import * as GrsaiErrorParser from './parsers/GrsaiErrorParser.js';
import * as AgnesErrorParser from './parsers/AgnesErrorParser.js';
import * as ComfyUiErrorParser from './parsers/ComfyUiErrorParser.js';
import * as VolcengineSpeechErrorParser from './parsers/VolcengineSpeechErrorParser.js';
import * as VolcengineErrorParser from './parsers/VolcengineErrorParser.js';
import { ApiError, ErrorType } from './ApiError.js';
const PARSERS = {
  ppio: PpioErrorParser,
  apimart: ApimartErrorParser,
  runninghub: RunningHubModelErrorParser,
  runninghubwf: RunningHubErrorParser,
  grsai: GrsaiErrorParser,
  agnes: AgnesErrorParser,
  comfyui: ComfyUiErrorParser,
  'volcengine-speech': VolcengineSpeechErrorParser,
  volcengine: VolcengineErrorParser,
  'ppio/gemini': PpioErrorParser,
  'runninghub-model': RunningHubModelErrorParser,
};
function getParser(enabled) {
  if (!enabled) return null;
  const value = enabled['toLowerCase']()['trim']();
  return PARSERS[value] || null;
}
function isPlainObject(enabled2) {
  return !!enabled2 && typeof enabled2 === 'object' && !Array['isArray'](enabled2);
}
function stringifyErrorValue(error) {
  if (error === undefined || error === null) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (isPlainObject(error)) {
    const item =
      error['message'] ||
      error['errorMessage'] ||
      error['error_message'] ||
      error['reason'] ||
      error['detail'] ||
      error['details'] ||
      error['msg'];
    if (item !== undefined && item !== null && item !== error) {
      const stringifyErrorValue2 = stringifyErrorValue(item);
      if (stringifyErrorValue2) return stringifyErrorValue2;
    }
    try {
      return JSON['stringify'](error);
    } catch {
      return '';
    }
  }
  return String(error || '');
}
function firstErrorText(...args) {
  for (const key of args) {
    const stringifyErrorValue3 = stringifyErrorValue(key)['trim']();
    if (stringifyErrorValue3) return stringifyErrorValue3;
  }
  return '';
}
function preserveRawErrorContext(response, index, result) {
  if (!response) return response;
  if (response['raw'] === undefined) response['raw'] = index;
  const data = Number(result);
  return (
    response['status'] == null &&
      result !== null &&
      result !== undefined &&
      result !== '' &&
      Number['isFinite'](data) &&
      (response['status'] = data),
    response
  );
}
export function parseError(options, target, source) {
  const parser = getParser(options);
  if (parser?.['parseError']) {
    const next = parser['parseError'](target, source);
    if (next) return preserveRawErrorContext(next, target, source);
    if (Number(source) < 400) return null;
  }
  return preserveRawErrorContext(parseGenericError(options, target, source), target, source);
}
export function parseTaskError(current, error2) {
  const parser2 = getParser(current);
  if (parser2?.['parseTaskError']) return parser2['parseTaskError'](error2);
  if (error2) {
    const entry = (error2['status'] || '')['toLowerCase']();
    if (entry === 'failed' || entry === 'error') {
      const errorText = firstErrorText(
        error2['error'],
        error2['errorMessage'],
        error2['message'],
        error2['failure_reason'],
        '未知错误',
      );
      return ApiError['taskFailed'](current, errorText);
    }
  }
  return null;
}
export function parseNetworkError(provider, raw, record) {
  const list = raw?.['message'] || '';
  if (
    raw?.['name'] === 'AbortError' ||
    list['includes']('timeout') ||
    list['includes']('TIMEOUT')
  ) {
    if (provider === 'local')
      return new ApiError({
        type: ErrorType['TIMEOUT'],
        provider: provider,
        message:
          '本地服务响应超时（' +
          (record ? Math['round'](record / 1000) + '秒' : '未知') +
          '），请稍后重试；若持续超时，请重启应用后再试',
        raw: raw,
        retryable: !![],
      });
    return ApiError['timeout'](provider, record);
  }
  if (
    list['includes']('DNS') ||
    list['includes']('ENOTFOUND') ||
    list['includes']('getaddrinfo')
  )
    return new ApiError({
      type: ErrorType['DNS_ERROR'],
      provider: provider,
      message: '无法解析服务器地址，请检查网络配置',
      raw: raw,
      retryable: !![],
    });
  if (
    list['includes']('Failed to fetch') ||
    list['includes']('NETWORK') ||
    list['includes']('ECONNREFUSED') ||
    list['includes']('ECONNRESET')
  )
    return new ApiError({
      type: ErrorType['NETWORK_ERROR'],
      provider: provider,
      message:
        provider === 'local'
          ? '无法连接本地服务，请稍后重试；若持续失败，请重启应用后再试'
          : '网络连接失败，请检查网络或代理设置',
      raw: raw,
      retryable: !![],
    });
  return ApiError['networkError'](provider, raw);
}
export function applyManifestErrorRules(code, list2, payload = {}) {
  if (!code || !Array['isArray'](list2) || list2['length'] === 0) return code;
  const handle = String(payload['phase'] || 'any')
      ['trim']()
      ['toLowerCase'](),
    provider2 = String(payload['provider'] || code['provider'] || 'unknown')['trim'](),
    state = Number(code['status'] ?? code['code']),
    status = Number['isInteger'](state) ? state : null,
    errorText2 = firstErrorText(
      code['message'],
      code['raw']?.['error']?.['message'],
      code['raw']?.['error'],
      code['raw']?.['message'],
      code['raw'],
    ),
    list3 = errorText2['toLocaleLowerCase']();
  for (const retryable of list2) {
    if (!retryable || typeof retryable !== 'object' || Array['isArray'](retryable)) continue;
    const config = String(retryable['phase'] || 'any')
      ['trim']()
      ['toLowerCase']();
    if (config !== 'any' && config !== handle) continue;
    const list4 = Array['isArray'](retryable['httpStatuses'])
      ? retryable['httpStatuses']['map'](Number)['filter'](Number['isInteger'])
      : [];
    if (list4['length'] > 0 && (status === null || !list4['includes'](status))) continue;
    const list5 = Array['isArray'](retryable['messageIncludesAny'])
      ? retryable['messageIncludesAny']
          ['map']((scope) =>
            String(scope || '')
              ['trim']()
              ['toLocaleLowerCase'](),
          )
          ['filter'](Boolean)
      : [];
    if (list5['length'] > 0 && !list5['some']((input) => list3['includes'](input)))
      continue;
    if (list4['length'] === 0 && list5['length'] === 0) continue;
    const output = String(retryable['userMessage'] || '')['trim'](),
      value2 = String(retryable['hint'] || '')['trim'](),
      list6 = output || errorText2 || code['message'] || '请求失败',
      message = value2 && !list6['includes'](value2) ? list6 + '；' + value2 : list6,
      apiError = new ApiError({
        type: String(retryable['type'] || ErrorType['UNKNOWN'])
          ['trim']()
          ['toUpperCase'](),
        provider: provider2,
        code: code['code'],
        status: status ?? code['status'],
        message: message,
        retryable: retryable['retryable'] === !![],
        raw: code['raw'] ?? code,
      });
    return ((apiError['hint'] = value2), (apiError['manifestRuleMatched'] = !![]), apiError);
  }
  return code;
}
function parseGenericError(provider3, error3, status2) {
  let message2 = '',
    code2 = status2 >= 400 ? status2 : undefined;
  if (typeof error3 === 'string') message2 = error3;
  else
    error3 &&
      typeof error3 === 'object' &&
      ((message2 = firstErrorText(
        error3['error']?.['message'],
        error3['error'],
        error3['message'],
        error3['errorMessage'],
        error3['error_message'],
        error3['failure_reason'],
        error3['reason'],
        error3['detail'],
        error3['details'],
        error3['msg'],
      )),
      (code2 =
        error3['code'] ||
        error3['error']?.['code'] ||
        error3['errorCode'] ||
        error3['error_code'] ||
        code2));
  const list7 = String(message2)['toUpperCase']();
  if (list7['includes']('BALANCE') || list7['includes']('余额') || list7['includes']('QUOTA'))
    return ApiError['insufficientBalance'](provider3, code2);
  if (
    status2 === 429 ||
    /\b(?:RATE[\s_-]*(?:LIMIT\w*|EXCEEDED)|TOO[\s_-]+MANY[\s_-]+REQUESTS|THROTTL(?:E|ED|ING))\b|请求过于频繁|限流/i[
      'test'
    ](message2)
  )
    return ApiError['rateLimit'](provider3, code2);
  if (list7['includes']('AUTH') || list7['includes']('KEY') || status2 === 401)
    return ApiError['authError'](provider3, code2, message2);
  if (list7['includes']('CONTENT') || list7['includes']('FILTER') || list7['includes']('SAFETY'))
    return ApiError['contentFiltered'](provider3, message2);
  if (status2 >= 400) return ApiError['fromHttpStatus'](status2, provider3, message2);
  return new ApiError({
    type: ErrorType['UNKNOWN'],
    provider: provider3,
    code: code2,
    message: message2 || '未知错误',
    status: status2,
  });
}
export function parseBatchErrors(value3, list8) {
  return list8['map']((response2, value4) => {
    if (response2['success']) return null;
    const error4 = parseError(value3, response2['error'], response2['status']);
    return ((error4['batchIndex'] = value4), error4);
  })['filter'](Boolean);
}
export default {
  parseError: parseError,
  parseTaskError: parseTaskError,
  parseNetworkError: parseNetworkError,
  applyManifestErrorRules: applyManifestErrorRules,
  parseBatchErrors: parseBatchErrors,
};
