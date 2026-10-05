import { buildApiUrl } from './apiUrl.js';
import { ApiError } from './errors/ApiError.js';
import { parseError, parseNetworkError } from './errors/ErrorParser.js';
import { logDiagnosticEvent } from '../src/services/diagnosticsService.js';
const DEFAULT_TIMEOUT = 30000;
function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(value);
}
function getRuntimeDeviceId() {
  return String(globalThis.window?.__aicDeviceId || globalThis.__aicDeviceId || '').trim();
}
function shouldAttachDeviceIdHeader(item, key, index) {
  if (
    String(key || '')
      .trim()
      .toLowerCase() === 'local'
  )
    return true;
  if (index === false) return false;
  return !isAbsoluteUrl(String(item || ''));
}
function withDeviceIdHeader(result, data, options, target) {
  const runtimeDeviceId = getRuntimeDeviceId();
  if (!runtimeDeviceId || !shouldAttachDeviceIdHeader(data, options, target)) return result || {};
  const source = 'X-AIC-Device-Id';
  if (typeof Headers !== 'undefined' && result instanceof Headers) {
    const map = new Headers(result);
    if (!map.has(source)) map.set(source, runtimeDeviceId);
    return map;
  }
  const next = { ...(result || {}) },
    enabled = Object.keys(next).some((item2) => String(item2 || '').toLowerCase() === source.toLowerCase());
  if (!enabled) next[source] = runtimeDeviceId;
  return next;
}
function sleep(current) {
  return new Promise((entry) => setTimeout(entry, current));
}
function fetchWithTimeout(record, args = {}, payload = DEFAULT_TIMEOUT) {
  const signal = new AbortController(),
    setTimeout2 = setTimeout(() => signal.abort(), payload);
  return fetch(record, { ...args, signal: signal.signal }).finally(() => clearTimeout(setTimeout2));
}
function fetchWithTimeoutWithSignal(handle, args2 = {}, state = DEFAULT_TIMEOUT, el) {
  const signal2 = new AbortController(),
    setTimeout3 = setTimeout(() => signal2.abort(), state);
  let config = null;
  if (el) {
    if (el.aborted) signal2.abort();
    else ((config = () => signal2.abort()), el.addEventListener('abort', config, { once: true }));
  }
  return fetch(handle, { ...args2, signal: signal2.signal }).finally(() => {
    clearTimeout(setTimeout3);
    if (el && config) el.removeEventListener('abort', config);
  });
}
function shouldRetryError(enabled2, scope, input, output) {
  if (output?.aborted) return false;
  return !!enabled2?.retryable && scope < input;
}
function safeUrlForDiagnostics(value2) {
  const value3 = String(value2 || '');
  try {
    const uRL = new URL(value3, 'http://local.invalid');
    if (value3.startsWith('/') || value3.startsWith('http://local.invalid')) return uRL.pathname;
    return '' + uRL.origin + uRL.pathname;
  } catch {
    return value3.split(/[?#]/, 1)[0] || '';
  }
}
function reportRequestFailure({
  fullUrl: fullUrl,
  method: method2,
  provider: provider2,
  apiErr: apiErr,
  attempt: attempt,
  retries: retries2,
}) {
  void logDiagnosticEvent({
    type: 'api.request_failed',
    level: 'warn',
    source: 'renderer',
    message: apiErr?.message || 'API request failed',
    context: {
      method: method2,
      url: safeUrlForDiagnostics(fullUrl),
      provider: provider2,
      status: apiErr?.status || apiErr?.statusCode || 0,
      errorType: apiErr?.type || apiErr?.name || '',
      retryable: Boolean(apiErr?.retryable),
      attempts: attempt + 1,
      retries: retries2,
    },
    stack: apiErr?.stack || '',
  });
}
async function parseResponseBody(response, value4) {
  if (value4 === 'blob') return await response.blob();
  if (value4 === 'text') return await response.text();
  if (value4 === 'auto') {
    const list = response.headers.get('content-type') || '';
    if (list.includes('application/json')) return await response.json();
    const value5 = await response.text();
    try {
      return JSON.parse(value5);
    } catch {
      return value5;
    }
  }
  return await response.json();
}
async function parseErrorBody(response2) {
  try {
    const error = await response2.text();
    try {
      const value6 = JSON.parse(error);
      return value6;
    } catch {
      return { error: error || 'HTTP ' + response2.status };
    }
  } catch {
    return { error: 'HTTP ' + response2.status };
  }
}
export async function requester(value7) {
  const {
    url: url,
    method: method = 'GET',
    headers: headers = {},
    body: body,
    timeout: timeout = DEFAULT_TIMEOUT,
    signal: signal3,
    retries: retries = 0,
    retryDelay: retryDelay = 600,
    responseType: responseType = 'auto',
    allow404Null: allow404Null = false,
    provider: provider = 'unknown',
    errorParser: errorParser,
    buildUrl: buildUrl = true,
    returnMeta: returnMeta = false,
  } = value7 || {};
  let fullUrl2 = url || '';
  buildUrl && !isAbsoluteUrl(fullUrl2) && (fullUrl2 = buildApiUrl(fullUrl2));
  const headers2 = withDeviceIdHeader(headers, url, provider, buildUrl),
    handler = signal3 ? fetchWithTimeoutWithSignal : fetchWithTimeout;
  let attempt2 = 0;
  while (true) {
    try {
      const headers3 = await handler(
        fullUrl2,
        { method: method, headers: headers2, body: body },
        timeout,
        signal3,
      );
      if (headers3.status === 404 && allow404Null)
        return returnMeta ? { data: null, status: 404, headers: headers3.headers } : null;
      if (!headers3.ok) {
        const errorBody = await parseErrorBody(headers3),
          apiErr2 =
            typeof errorParser === 'function'
              ? errorParser(provider, errorBody, headers3.status)
              : parseError(provider, errorBody, headers3.status);
        if (apiErr2 && shouldRetryError(apiErr2, attempt2, retries, signal3)) {
          (attempt2++, await sleep(retryDelay * attempt2));
          continue;
        }
        reportRequestFailure({
          fullUrl: fullUrl2,
          method: method,
          provider: provider,
          apiErr: apiErr2,
          attempt: attempt2,
          retries: retries,
        });
        throw apiErr2 || ApiError.fromHttpStatus(headers3.status, provider);
      }
      const data2 = await parseResponseBody(headers3, responseType);
      return returnMeta ? { data: data2, status: headers3.status, headers: headers3.headers } : data2;
    } catch (value8) {
      const apiErr3 = value8 instanceof ApiError ? value8 : parseNetworkError(provider, value8, timeout);
      if (shouldRetryError(apiErr3, attempt2, retries, signal3)) {
        (attempt2++, await sleep(retryDelay * attempt2));
        continue;
      }
      reportRequestFailure({
        fullUrl: fullUrl2,
        method: method,
        provider: provider,
        apiErr: apiErr3,
        attempt: attempt2,
        retries: retries,
      });
      throw apiErr3;
    }
  }
}
export function get(url2, args3 = {}) {
  return requester({ url: url2, method: 'GET', ...args3 });
}
export function del(url3, args4 = {}) {
  return requester({ url: url3, method: 'DELETE', ...args4 });
}
export function post(url4, value9, response3 = {}) {
  const headers4 = { ...(response3.headers || {}) };
  let body2 = value9;
  return (
    value9 !== undefined &&
      !(value9 instanceof FormData) &&
      !(value9 instanceof Blob) &&
      !(value9 instanceof ArrayBuffer) &&
      ((headers4['Content-Type'] = headers4['Content-Type'] || 'application/json'),
      (body2 = typeof value9 === 'string' ? value9 : JSON.stringify(value9))),
    requester({ url: url4, method: 'POST', headers: headers4, body: body2, ...response3 })
  );
}
