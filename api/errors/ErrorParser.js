import * as PpioErrorParser from './parsers/PpioErrorParser.js';
import * as ApimartErrorParser from './parsers/ApimartErrorParser.js';
import * as RunningHubErrorParser from './parsers/RunningHubErrorParser.js';
import * as RunningHubModelErrorParser from './parsers/RunningHubModelErrorParser.js';
import * as GrsaiErrorParser from './parsers/GrsaiErrorParser.js';
import * as AgnesErrorParser from './parsers/AgnesErrorParser.js';
import { ApiError, ErrorType } from './ApiError.js';
const PARSERS = {
  ppio: PpioErrorParser,
  apimart: ApimartErrorParser,
  runninghub: RunningHubModelErrorParser,
  runninghubwf: RunningHubErrorParser,
  grsai: GrsaiErrorParser,
  agnes: AgnesErrorParser,
  'ppio/gemini': PpioErrorParser,
  'runninghub-model': RunningHubModelErrorParser,
};
function getParser(enabled) {
  if (!enabled) return null;
  const value = enabled.toLowerCase().trim();
  return PARSERS[value] || null;
}
function isPlainObject(enabled2) {
  return !!enabled2 && typeof enabled2 === 'object' && !Array.isArray(enabled2);
}
function stringifyErrorValue(error) {
  if (error === undefined || error === null) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (isPlainObject(error)) {
    const item =
      error.message ||
      error.errorMessage ||
      error.error_message ||
      error.reason ||
      error.detail ||
      error.details ||
      error.msg;
    if (item !== undefined && item !== null && item !== error) {
      const stringifyErrorValue2 = stringifyErrorValue(item);
      if (stringifyErrorValue2) return stringifyErrorValue2;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return '';
    }
  }
  return String(error || '');
}
function firstErrorText(...args) {
  for (const key of args) {
    const stringifyErrorValue3 = stringifyErrorValue(key).trim();
    if (stringifyErrorValue3) return stringifyErrorValue3;
  }
  return '';
}
export function parseError(index, result, data) {
  const parser = getParser(index);
  if (parser?.parseError) {
    const options = parser.parseError(result, data);
    if (options) return options;
  }
  return parseGenericError(index, result, data);
}
export function parseTaskError(target, error2) {
  const parser2 = getParser(target);
  if (parser2?.parseTaskError) return parser2.parseTaskError(error2);
  if (error2) {
    const source = (error2.status || '').toLowerCase();
    if (source === 'failed' || source === 'error') {
      const errorText = firstErrorText(
        error2.error,
        error2.errorMessage,
        error2.message,
        error2.failure_reason,
        '未知错误',
      );
      return ApiError.taskFailed(target, errorText);
    }
  }
  return null;
}
export function parseNetworkError(provider, raw, next) {
  const list = raw?.message || '';
  if (raw?.name === 'AbortError' || list.includes('timeout') || list.includes('TIMEOUT'))
    return ApiError.timeout(provider, next);
  if (list.includes('DNS') || list.includes('ENOTFOUND') || list.includes('getaddrinfo'))
    return new ApiError({
      type: ErrorType.DNS_ERROR,
      provider: provider,
      message: '无法解析服务器地址，请检查网络配置',
      raw: raw,
      retryable: true,
    });
  if (
    list.includes('Failed to fetch') ||
    list.includes('NETWORK') ||
    list.includes('ECONNREFUSED') ||
    list.includes('ECONNRESET')
  )
    return new ApiError({
      type: ErrorType.NETWORK_ERROR,
      provider: provider,
      message: '网络连接失败，请检查网络或代理设置',
      raw: raw,
      retryable: true,
    });
  return ApiError.networkError(provider, raw);
}
function parseGenericError(provider2, error3, status) {
  let message = '',
    code = status;
  if (typeof error3 === 'string') message = error3;
  else
    error3 &&
      typeof error3 === 'object' &&
      ((message = firstErrorText(
        error3.error?.message,
        error3.error,
        error3.message,
        error3.errorMessage,
        error3.error_message,
        error3.failure_reason,
        error3.reason,
        error3,
      )),
      (code = error3.code || error3.error?.code || error3.errorCode || error3.error_code || status));
  const list2 = String(message).toUpperCase();
  if (list2.includes('BALANCE') || list2.includes('余额') || list2.includes('QUOTA'))
    return ApiError.insufficientBalance(provider2, code);
  if (list2.includes('RATE') || list2.includes('LIMIT') || status === 0x1ad)
    return ApiError.rateLimit(provider2, code);
  if (list2.includes('AUTH') || list2.includes('KEY') || status === 0x191)
    return ApiError.authError(provider2, code, message);
  if (list2.includes('CONTENT') || list2.includes('FILTER') || list2.includes('SAFETY'))
    return ApiError.contentFiltered(provider2, message);
  if (status >= 0x190) return ApiError.fromHttpStatus(status, provider2, message);
  return new ApiError({
    type: ErrorType.UNKNOWN,
    provider: provider2,
    code: code,
    message: message || '未知错误',
    status: status,
  });
}
export function parseBatchErrors(current, list3) {
  return list3
    .map((response, entry) => {
      if (response.success) return null;
      const error4 = parseError(current, response.error, response.status);
      return ((error4.batchIndex = entry), error4);
    })
    .filter(Boolean);
}
export default {
  parseError: parseError,
  parseTaskError: parseTaskError,
  parseNetworkError: parseNetworkError,
  parseBatchErrors: parseBatchErrors,
};

function preserveRawErrorContext(enabled3, record, payload) {
  if (!enabled3) return enabled3;
  if (enabled3['raw'] === undefined) enabled3['raw'] = record;
  const handle = Number(payload);
  return (
    enabled3['status'] == null &&
      payload !== null &&
      payload !== undefined &&
      payload !== '' &&
      Number['isFinite'](handle) &&
      (enabled3['status'] = handle),
    enabled3
  );
}

export function applyManifestErrorRules(error5, state, config = {}) {
  if (!error5 || !Array['isArray'](state) || state['length'] === 0x0) return error5;
  const scope = String(config['phase'] || 'any')
      ['trim']()
      ['toLowerCase'](),
    input = String(config['provider'] || error5['provider'] || 'unknown')['trim'](),
    output = Number(error5['status'] ?? error5['code']),
    value2 = Number['isInteger'](output) ? output : null,
    errorText2 = firstErrorText(
      error5['message'],
      error5['raw']?.['error']?.['message'],
      error5['raw']?.['error'],
      error5['raw']?.['message'],
      error5['raw'],
    ),
    value3 = errorText2['toLocaleLowerCase']();
  for (const enabled4 of state) {
    if (!enabled4 || typeof enabled4 !== 'object' || Array['isArray'](enabled4)) continue;
    const value4 = String(enabled4['phase'] || 'any')
      ['trim']()
      ['toLowerCase']();
    if (value4 !== 'any' && value4 !== scope) continue;
    const list4 = Array['isArray'](enabled4['httpStatuses'])
      ? enabled4['httpStatuses']['map'](Number)['filter'](Number['isInteger'])
      : [];
    if (list4['length'] > 0x0 && (value2 === null || !list4['includes'](value2))) continue;
    const list5 = Array['isArray'](enabled4['messageIncludesAny'])
      ? enabled4['messageIncludesAny']
          ['map']((value5) =>
            String(value5 || '')
              ['trim']()
              ['toLocaleLowerCase'](),
          )
          ['filter'](Boolean)
      : [];
    if (list5['length'] > 0x0 && !list5['some']((value6) => value3['includes'](value6))) continue;
    if (list4['length'] === 0x0 && list5['length'] === 0x0) continue;
    const value7 = String(enabled4['userMessage'] || '')['trim'](),
      value8 = String(enabled4['hint'] || '')['trim'](),
      list6 = value7 || errorText2 || error5['message'] || '请求失败',
      value9 = value8 && !list6['includes'](value8) ? list6 + '；' + value8 : list6,
      apiError = new ApiError({
        type: String(enabled4['type'] || ErrorType['UNKNOWN'])
          ['trim']()
          ['toUpperCase'](),
        provider: input,
        code: error5['code'],
        status: value2 ?? error5['status'],
        message: value9,
        retryable: enabled4['retryable'] === !![],
        raw: error5['raw'] ?? error5,
      });
    return ((apiError['hint'] = value8), (apiError['manifestRuleMatched'] = !![]), apiError);
  }
  return error5;
}
