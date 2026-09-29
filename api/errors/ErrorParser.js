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

function preserveRawErrorContext(_0x4bfbc4,_0x5f0375,_0x445a96){if(!_0x4bfbc4)return _0x4bfbc4;if(_0x4bfbc4["raw"]===undefined)_0x4bfbc4["raw"]=_0x5f0375;const _0x40a672=Number(_0x445a96);return _0x4bfbc4["status"]==null&&_0x445a96!==null&&_0x445a96!==undefined&&_0x445a96!==''&&Number['isFinite'](_0x40a672)&&(_0x4bfbc4["status"]=_0x40a672),_0x4bfbc4;}

export function applyManifestErrorRules(_0x458cf2,_0x5e1a5b,_0x53779c={}){if(!_0x458cf2||!Array["isArray"](_0x5e1a5b)||_0x5e1a5b["length"]===0x0)return _0x458cf2;const _0x305bf2=String(_0x53779c["phase"]||"any")["trim"]()["toLowerCase"](),_0x5b9c13=String(_0x53779c["provider"]||_0x458cf2["provider"]||'unknown')["trim"](),_0x9007ab=Number(_0x458cf2["status"]??_0x458cf2["code"]),_0x3dec4c=Number["isInteger"](_0x9007ab)?_0x9007ab:null,_0x294c3c=firstErrorText(_0x458cf2['message'],_0x458cf2['raw']?.["error"]?.["message"],_0x458cf2["raw"]?.["error"],_0x458cf2["raw"]?.["message"],_0x458cf2["raw"]),_0x21502a=_0x294c3c['toLocaleLowerCase']();for(const _0x2e3dc8 of _0x5e1a5b){if(!_0x2e3dc8||typeof _0x2e3dc8!=="object"||Array["isArray"](_0x2e3dc8))continue;const _0x5d1987=String(_0x2e3dc8["phase"]||"any")['trim']()["toLowerCase"]();if(_0x5d1987!=="any"&&_0x5d1987!==_0x305bf2)continue;const _0x4ba856=Array['isArray'](_0x2e3dc8["httpStatuses"])?_0x2e3dc8["httpStatuses"]["map"](Number)["filter"](Number['isInteger']):[];if(_0x4ba856["length"]>0x0&&(_0x3dec4c===null||!_0x4ba856["includes"](_0x3dec4c)))continue;const _0x9dcefc=Array['isArray'](_0x2e3dc8["messageIncludesAny"])?_0x2e3dc8["messageIncludesAny"]["map"](_0x3af0fd=>String(_0x3af0fd||'')["trim"]()['toLocaleLowerCase']())["filter"](Boolean):[];if(_0x9dcefc['length']>0x0&&!_0x9dcefc["some"](_0x597ff3=>_0x21502a["includes"](_0x597ff3)))continue;if(_0x4ba856['length']===0x0&&_0x9dcefc['length']===0x0)continue;const _0x4dca5a=String(_0x2e3dc8["userMessage"]||'')["trim"](),_0x242c3d=String(_0x2e3dc8["hint"]||'')["trim"](),_0x5b743c=_0x4dca5a||_0x294c3c||_0x458cf2["message"]||"请求失败",_0x2cab26=_0x242c3d&&!_0x5b743c['includes'](_0x242c3d)?_0x5b743c+'；'+_0x242c3d:_0x5b743c,_0x58fc33=new ApiError({'type':String(_0x2e3dc8["type"]||ErrorType["UNKNOWN"])["trim"]()["toUpperCase"](),'provider':_0x5b9c13,'code':_0x458cf2["code"],'status':_0x3dec4c??_0x458cf2['status'],'message':_0x2cab26,'retryable':_0x2e3dc8["retryable"]===!![],'raw':_0x458cf2["raw"]??_0x458cf2});return _0x58fc33['hint']=_0x242c3d,_0x58fc33["manifestRuleMatched"]=!![],_0x58fc33;}return _0x458cf2;}
