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
function getParser(_0x135297) {
  if (!_0x135297) return null;
  const _0x45b3c0 = _0x135297.toLowerCase().trim();
  return PARSERS[_0x45b3c0] || null;
}
function isPlainObject(_0x30d1b6) {
  return !!_0x30d1b6 && typeof _0x30d1b6 === 'object' && !Array.isArray(_0x30d1b6);
}
function stringifyErrorValue(_0x1f722f) {
  if (_0x1f722f === undefined || _0x1f722f === null) return '';
  if (typeof _0x1f722f === 'string') return _0x1f722f;
  if (typeof _0x1f722f === 'number' || typeof _0x1f722f === 'boolean') return String(_0x1f722f);
  if (isPlainObject(_0x1f722f)) {
    const _0x1c5b35 =
      _0x1f722f.message ||
      _0x1f722f.errorMessage ||
      _0x1f722f.error_message ||
      _0x1f722f.reason ||
      _0x1f722f.detail ||
      _0x1f722f.details ||
      _0x1f722f.msg;
    if (_0x1c5b35 !== undefined && _0x1c5b35 !== null && _0x1c5b35 !== _0x1f722f) {
      const _0x51d051 = stringifyErrorValue(_0x1c5b35);
      if (_0x51d051) return _0x51d051;
    }
    try {
      return JSON.stringify(_0x1f722f);
    } catch {
      return '';
    }
  }
  return String(_0x1f722f || '');
}
function firstErrorText(..._0xa148bc) {
  for (const _0x56531a of _0xa148bc) {
    const _0x3b7b7e = stringifyErrorValue(_0x56531a).trim();
    if (_0x3b7b7e) return _0x3b7b7e;
  }
  return '';
}
export function parseError(_0x5d9386, _0x327a34, _0x8e9b3a) {
  const _0x33ff44 = getParser(_0x5d9386);
  if (_0x33ff44?.parseError) {
    const _0x58747a = _0x33ff44.parseError(_0x327a34, _0x8e9b3a);
    if (_0x58747a) return _0x58747a;
  }
  return parseGenericError(_0x5d9386, _0x327a34, _0x8e9b3a);
}
export function parseTaskError(_0x48ba52, _0x6ebe2e) {
  const _0x5ada69 = getParser(_0x48ba52);
  if (_0x5ada69?.parseTaskError) return _0x5ada69.parseTaskError(_0x6ebe2e);
  if (_0x6ebe2e) {
    const _0x191dae = (_0x6ebe2e.status || '').toLowerCase();
    if (_0x191dae === 'failed' || _0x191dae === 'error') {
      const _0x4dc664 = firstErrorText(
        _0x6ebe2e.error,
        _0x6ebe2e.errorMessage,
        _0x6ebe2e.message,
        _0x6ebe2e.failure_reason,
        '未知错误',
      );
      return ApiError.taskFailed(_0x48ba52, _0x4dc664);
    }
  }
  return null;
}
export function parseNetworkError(_0x2da862, _0x5ae9e6, _0x3610b3) {
  const _0x448346 = _0x5ae9e6?.message || '';
  if (_0x5ae9e6?.name === 'AbortError' || _0x448346.includes('timeout') || _0x448346.includes('TIMEOUT'))
    return ApiError.timeout(_0x2da862, _0x3610b3);
  if (_0x448346.includes('DNS') || _0x448346.includes('ENOTFOUND') || _0x448346.includes('getaddrinfo'))
    return new ApiError({
      type: ErrorType.DNS_ERROR,
      provider: _0x2da862,
      message: '无法解析服务器地址，请检查网络配置',
      raw: _0x5ae9e6,
      retryable: true,
    });
  if (
    _0x448346.includes('Failed to fetch') ||
    _0x448346.includes('NETWORK') ||
    _0x448346.includes('ECONNREFUSED') ||
    _0x448346.includes('ECONNRESET')
  )
    return new ApiError({
      type: ErrorType.NETWORK_ERROR,
      provider: _0x2da862,
      message: '网络连接失败，请检查网络或代理设置',
      raw: _0x5ae9e6,
      retryable: true,
    });
  return ApiError.networkError(_0x2da862, _0x5ae9e6);
}
function parseGenericError(_0x790df8, _0x23af9e, _0x209aa0) {
  let _0x3c79f0 = '',
    _0x5bdf9e = _0x209aa0;
  if (typeof _0x23af9e === 'string') _0x3c79f0 = _0x23af9e;
  else
    _0x23af9e &&
      typeof _0x23af9e === 'object' &&
      ((_0x3c79f0 = firstErrorText(
        _0x23af9e.error?.message,
        _0x23af9e.error,
        _0x23af9e.message,
        _0x23af9e.errorMessage,
        _0x23af9e.error_message,
        _0x23af9e.failure_reason,
        _0x23af9e.reason,
        _0x23af9e,
      )),
      (_0x5bdf9e =
        _0x23af9e.code || _0x23af9e.error?.code || _0x23af9e.errorCode || _0x23af9e.error_code || _0x209aa0));
  const _0xea5540 = String(_0x3c79f0).toUpperCase();
  if (_0xea5540.includes('BALANCE') || _0xea5540.includes('余额') || _0xea5540.includes('QUOTA'))
    return ApiError.insufficientBalance(_0x790df8, _0x5bdf9e);
  if (_0xea5540.includes('RATE') || _0xea5540.includes('LIMIT') || _0x209aa0 === 0x1ad)
    return ApiError.rateLimit(_0x790df8, _0x5bdf9e);
  if (_0xea5540.includes('AUTH') || _0xea5540.includes('KEY') || _0x209aa0 === 0x191)
    return ApiError.authError(_0x790df8, _0x5bdf9e, _0x3c79f0);
  if (_0xea5540.includes('CONTENT') || _0xea5540.includes('FILTER') || _0xea5540.includes('SAFETY'))
    return ApiError.contentFiltered(_0x790df8, _0x3c79f0);
  if (_0x209aa0 >= 0x190) return ApiError.fromHttpStatus(_0x209aa0, _0x790df8, _0x3c79f0);
  return new ApiError({
    type: ErrorType.UNKNOWN,
    provider: _0x790df8,
    code: _0x5bdf9e,
    message: _0x3c79f0 || '未知错误',
    status: _0x209aa0,
  });
}
export function parseBatchErrors(_0x2bf211, _0x1f8960) {
  return _0x1f8960
    .map((_0x44e541, _0x12b54f) => {
      if (_0x44e541.success) return null;
      const _0x4a9b7f = parseError(_0x2bf211, _0x44e541.error, _0x44e541.status);
      return ((_0x4a9b7f.batchIndex = _0x12b54f), _0x4a9b7f);
    })
    .filter(Boolean);
}
export default {
  parseError: parseError,
  parseTaskError: parseTaskError,
  parseNetworkError: parseNetworkError,
  parseBatchErrors: parseBatchErrors,
};
