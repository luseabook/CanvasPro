const DEFAULT_TIMEOUT = 0x7530;
export function getApiBase() {
  try {
    if (typeof location !== 'undefined' && location.protocol === 'file:') return 'http://127.0.0.1:8777';
  } catch {}
  return '';
}
export function buildApiUrl(value) {
  const apiBase = getApiBase(),
    enabled = String(value || '');
  if (!enabled) return apiBase || '';
  if (!enabled.startsWith('/')) return apiBase + '/' + enabled;
  return '' + apiBase + enabled;
}
export function fetchWithTimeout(item, args = {}, key = DEFAULT_TIMEOUT) {
  const signal = new AbortController(),
    setTimeout2 = setTimeout(() => signal.abort(), key);
  return fetch(item, { ...args, signal: signal.signal }).finally(() => clearTimeout(setTimeout2));
}
export function fetchWithTimeoutWithSignal(index, args2 = {}, result = DEFAULT_TIMEOUT, el) {
  const signal2 = new AbortController(),
    setTimeout3 = setTimeout(() => signal2.abort(), result);
  let data = null;
  if (el) {
    if (el.aborted) signal2.abort();
    else ((data = () => signal2.abort()), el.addEventListener('abort', data, { once: true }));
  }
  return fetch(index, { ...args2, signal: signal2.signal }).finally(() => {
    clearTimeout(setTimeout3);
    if (el && data) el.removeEventListener('abort', data);
  });
}
function stringifyErrorBodyValue(error) {
  if (error === undefined || error === null) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (error && typeof error === 'object') {
    const options =
      error.message ||
      error.errorMessage ||
      error.error_message ||
      error.reason ||
      error.detail ||
      error.details ||
      error.msg;
    if (options !== undefined && options !== null && options !== error) {
      const stringifyErrorBodyValue2 = stringifyErrorBodyValue(options);
      if (stringifyErrorBodyValue2) return stringifyErrorBodyValue2;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return '';
    }
  }
  return String(error || '');
}
async function parseErrorBody(response) {
  let target = '';
  try {
    target = await response.text();
    const error2 = JSON.parse(target);
    return stringifyErrorBodyValue(
      error2.error?.message ||
        error2.error ||
        error2.message ||
        error2.data?.error ||
        error2.data?.message ||
        target,
    );
  } catch {
    return target || 'HTTP ' + response.status;
  }
}
export async function request(source, next = {}, current = DEFAULT_TIMEOUT) {
  const entry = source.startsWith('http') ? source : buildApiUrl(source);
  try {
    const status = await fetchWithTimeout(entry, next, current);
    if (status.status === 0x194) return { success: true, data: null, status: 0x194 };
    if (!status.ok) {
      const errorBody = await parseErrorBody(status);
      return {
        success: false,
        error: '请求失败: HTTP ' + status.status + (errorBody ? ' — ' + errorBody : ''),
        status: status.status,
      };
    }
    const list = status.headers.get('content-type') || '';
    let data2;
    if (list.includes('application/json')) data2 = await status.json();
    else {
      const record = await status.text();
      try {
        data2 = JSON.parse(record);
      } catch {
        data2 = record;
      }
    }
    return { success: true, data: data2, status: status.status };
  } catch (error3) {
    if (error3.name === 'AbortError')
      return { success: false, error: '请求超时，请检查网络连接或服务器状态', status: 0 };
    if (error3.message?.includes('Failed to fetch'))
      return {
        success: false,
        error:
          '网络请求失败。请检查：\n1. 网络连接是否正常\n2. 本地 Python 服务器(server.py)是否已启动\n3. 浏览器是否可以访问 http://localhost:8777\n4. 是否有防火墙拦截了 8777 端口',
        status: 0,
      };
    return { success: false, error: error3.message || '未知网络错误', status: 0 };
  }
}
export function get(payload, handle) {
  return request(payload, { method: 'GET' }, handle);
}
export function post(state, config, scope) {
  const dom = { method: 'POST', headers: {} };
  if (config !== undefined) {
    if (config instanceof FormData || config instanceof Blob || config instanceof ArrayBuffer)
      dom.body = config;
    else
      typeof config === 'object'
        ? ((dom.headers['Content-Type'] = 'application/json'), (dom.body = JSON.stringify(config)))
        : (dom.body = config);
  }
  return request(state, dom, scope);
}
export function del(input, output) {
  return request(input, { method: 'DELETE' }, output);
}
