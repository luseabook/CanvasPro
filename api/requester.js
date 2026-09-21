import { buildApiUrl } from './apiUrl.js';
import { ApiError } from './errors/ApiError.js';
import { parseError, parseNetworkError } from './errors/ErrorParser.js';
import { logDiagnosticEvent } from '../src/services/diagnosticsService.js';
const DEFAULT_TIMEOUT = 0x7530;
function isAbsoluteUrl(_0x8d81d8) {
  return /^https?:\/\//i.test(_0x8d81d8);
}
function getRuntimeDeviceId() {
  return String(globalThis.window?.__aicDeviceId || globalThis.__aicDeviceId || '').trim();
}
function shouldAttachDeviceIdHeader(_0x455917, _0x2cacd0, _0x32f8c8) {
  if (
    String(_0x2cacd0 || '')
      .trim()
      .toLowerCase() === 'local'
  )
    return true;
  if (_0x32f8c8 === false) return false;
  return !isAbsoluteUrl(String(_0x455917 || ''));
}
function withDeviceIdHeader(_0x3ec476, _0x5e4797, _0x595208, _0x62f0bf) {
  const _0x4a2001 = getRuntimeDeviceId();
  if (!_0x4a2001 || !shouldAttachDeviceIdHeader(_0x5e4797, _0x595208, _0x62f0bf)) return _0x3ec476 || {};
  const _0x3f20e1 = 'X-AIC-Device-Id';
  if (typeof Headers !== 'undefined' && _0x3ec476 instanceof Headers) {
    const _0x19e5de = new Headers(_0x3ec476);
    if (!_0x19e5de.has(_0x3f20e1)) _0x19e5de.set(_0x3f20e1, _0x4a2001);
    return _0x19e5de;
  }
  const _0x3e278d = { ...(_0x3ec476 || {}) },
    _0x59fd1c = Object.keys(_0x3e278d).some(
      (_0x252036) => String(_0x252036 || '').toLowerCase() === _0x3f20e1.toLowerCase(),
    );
  if (!_0x59fd1c) _0x3e278d[_0x3f20e1] = _0x4a2001;
  return _0x3e278d;
}
function sleep(_0x4d0302) {
  return new Promise((_0x5d1f31) => setTimeout(_0x5d1f31, _0x4d0302));
}
function fetchWithTimeout(_0x3753e0, _0x1500e4 = {}, _0x349b32 = DEFAULT_TIMEOUT) {
  const _0x224624 = new AbortController(),
    _0x2e5a72 = setTimeout(() => _0x224624.abort(), _0x349b32);
  return fetch(_0x3753e0, { ..._0x1500e4, signal: _0x224624.signal }).finally(() => clearTimeout(_0x2e5a72));
}
function fetchWithTimeoutWithSignal(_0x2e1fb2, _0x2b1d19 = {}, _0x14b89b = DEFAULT_TIMEOUT, _0xbadb17) {
  const _0x2d8d7b = new AbortController(),
    _0x4c91b2 = setTimeout(() => _0x2d8d7b.abort(), _0x14b89b);
  let _0x5651f6 = null;
  if (_0xbadb17) {
    if (_0xbadb17.aborted) _0x2d8d7b.abort();
    else
      ((_0x5651f6 = () => _0x2d8d7b.abort()), _0xbadb17.addEventListener('abort', _0x5651f6, { once: true }));
  }
  return fetch(_0x2e1fb2, { ..._0x2b1d19, signal: _0x2d8d7b.signal }).finally(() => {
    clearTimeout(_0x4c91b2);
    if (_0xbadb17 && _0x5651f6) _0xbadb17.removeEventListener('abort', _0x5651f6);
  });
}
function shouldRetryError(_0x242896, _0x56a74b, _0x50f872, _0xc72844) {
  if (_0xc72844?.aborted) return false;
  return !!_0x242896?.retryable && _0x56a74b < _0x50f872;
}
function safeUrlForDiagnostics(_0x49b10d) {
  const _0x18d179 = String(_0x49b10d || '');
  try {
    const _0x6be294 = new URL(_0x18d179, 'http://local.invalid');
    if (_0x18d179.startsWith('/') || _0x18d179.startsWith('http://local.invalid')) return _0x6be294.pathname;
    return '' + _0x6be294.origin + _0x6be294.pathname;
  } catch {
    return _0x18d179.split(/[?#]/, 1)[0] || '';
  }
}
function reportRequestFailure({
  fullUrl: _0x57082a,
  method: _0x581ff2,
  provider: _0x1014ff,
  apiErr: _0x2e80f0,
  attempt: _0x2dd9a1,
  retries: _0x3f9d42,
}) {
  void logDiagnosticEvent({
    type: 'api.request_failed',
    level: 'warn',
    source: 'renderer',
    message: _0x2e80f0?.message || 'API request failed',
    context: {
      method: _0x581ff2,
      url: safeUrlForDiagnostics(_0x57082a),
      provider: _0x1014ff,
      status: _0x2e80f0?.status || _0x2e80f0?.statusCode || 0,
      errorType: _0x2e80f0?.type || _0x2e80f0?.name || '',
      retryable: Boolean(_0x2e80f0?.retryable),
      attempts: _0x2dd9a1 + 1,
      retries: _0x3f9d42,
    },
    stack: _0x2e80f0?.stack || '',
  });
}
async function parseResponseBody(_0x5ce0e0, _0x549b43) {
  if (_0x549b43 === 'blob') return await _0x5ce0e0.blob();
  if (_0x549b43 === 'text') return await _0x5ce0e0.text();
  if (_0x549b43 === 'auto') {
    const _0x65fb7e = _0x5ce0e0.headers.get('content-type') || '';
    if (_0x65fb7e.includes('application/json')) return await _0x5ce0e0.json();
    const _0x13ed31 = await _0x5ce0e0.text();
    try {
      return JSON.parse(_0x13ed31);
    } catch {
      return _0x13ed31;
    }
  }
  return await _0x5ce0e0.json();
}
async function parseErrorBody(_0x1bbe7c) {
  try {
    const _0x833a12 = await _0x1bbe7c.text();
    try {
      const _0x5cda45 = JSON.parse(_0x833a12);
      return _0x5cda45;
    } catch {
      return { error: _0x833a12 || 'HTTP ' + _0x1bbe7c.status };
    }
  } catch {
    return { error: 'HTTP ' + _0x1bbe7c.status };
  }
}
export async function requester(_0x37fa02) {
  const {
    url: _0x195e1f,
    method: method = 'GET',
    headers: headers = {},
    body: _0x5184ee,
    timeout: timeout = DEFAULT_TIMEOUT,
    signal: _0x302d07,
    retries: retries = 0,
    retryDelay: retryDelay = 0x258,
    responseType: responseType = 'auto',
    allow404Null: allow404Null = false,
    provider: provider = 'unknown',
    errorParser: _0x125cef,
    buildUrl: buildUrl = true,
    returnMeta: returnMeta = false,
  } = _0x37fa02 || {};
  let _0x30fe76 = _0x195e1f || '';
  buildUrl && !isAbsoluteUrl(_0x30fe76) && (_0x30fe76 = buildApiUrl(_0x30fe76));
  const _0x33d6f5 = withDeviceIdHeader(headers, _0x195e1f, provider, buildUrl),
    _0x45dd6c = _0x302d07 ? fetchWithTimeoutWithSignal : fetchWithTimeout;
  let _0x457649 = 0;
  while (true) {
    try {
      const _0x12c3da = await _0x45dd6c(
        _0x30fe76,
        { method: method, headers: _0x33d6f5, body: _0x5184ee },
        timeout,
        _0x302d07,
      );
      if (_0x12c3da.status === 0x194 && allow404Null)
        return returnMeta ? { data: null, status: 0x194, headers: _0x12c3da.headers } : null;
      if (!_0x12c3da.ok) {
        const _0x2c611c = await parseErrorBody(_0x12c3da),
          _0x480138 =
            typeof _0x125cef === 'function'
              ? _0x125cef(provider, _0x2c611c, _0x12c3da.status)
              : parseError(provider, _0x2c611c, _0x12c3da.status);
        if (_0x480138 && shouldRetryError(_0x480138, _0x457649, retries, _0x302d07)) {
          (_0x457649++, await sleep(retryDelay * _0x457649));
          continue;
        }
        reportRequestFailure({
          fullUrl: _0x30fe76,
          method: method,
          provider: provider,
          apiErr: _0x480138,
          attempt: _0x457649,
          retries: retries,
        });
        throw _0x480138 || ApiError.fromHttpStatus(_0x12c3da.status, provider);
      }
      const _0x302f7f = await parseResponseBody(_0x12c3da, responseType);
      return returnMeta
        ? { data: _0x302f7f, status: _0x12c3da.status, headers: _0x12c3da.headers }
        : _0x302f7f;
    } catch (_0x3da932) {
      const _0x251f71 =
        _0x3da932 instanceof ApiError ? _0x3da932 : parseNetworkError(provider, _0x3da932, timeout);
      if (shouldRetryError(_0x251f71, _0x457649, retries, _0x302d07)) {
        (_0x457649++, await sleep(retryDelay * _0x457649));
        continue;
      }
      reportRequestFailure({
        fullUrl: _0x30fe76,
        method: method,
        provider: provider,
        apiErr: _0x251f71,
        attempt: _0x457649,
        retries: retries,
      });
      throw _0x251f71;
    }
  }
}
export function get(_0x13d340, _0x11d908 = {}) {
  return requester({ url: _0x13d340, method: 'GET', ..._0x11d908 });
}
export function del(_0x20ba45, _0x1dfbab = {}) {
  return requester({ url: _0x20ba45, method: 'DELETE', ..._0x1dfbab });
}
export function post(_0x5c1a4f, _0x402bbb, _0x3260ef = {}) {
  const _0x5064c5 = { ...(_0x3260ef.headers || {}) };
  let _0x42a29c = _0x402bbb;
  return (
    _0x402bbb !== undefined &&
      !(_0x402bbb instanceof FormData) &&
      !(_0x402bbb instanceof Blob) &&
      !(_0x402bbb instanceof ArrayBuffer) &&
      ((_0x5064c5['Content-Type'] = _0x5064c5['Content-Type'] || 'application/json'),
      (_0x42a29c = typeof _0x402bbb === 'string' ? _0x402bbb : JSON.stringify(_0x402bbb))),
    requester({ url: _0x5c1a4f, method: 'POST', headers: _0x5064c5, body: _0x42a29c, ..._0x3260ef })
  );
}
