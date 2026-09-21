const DEFAULT_TIMEOUT = 0x7530;
export function getApiBase() {
  try {
    if (typeof location !== 'undefined' && location.protocol === 'file:') return 'http://127.0.0.1:8777';
  } catch {}
  return '';
}
export function buildApiUrl(_0x4c388d) {
  const _0x14c316 = getApiBase(),
    _0x19b56e = String(_0x4c388d || '');
  if (!_0x19b56e) return _0x14c316 || '';
  if (!_0x19b56e.startsWith('/')) return _0x14c316 + '/' + _0x19b56e;
  return '' + _0x14c316 + _0x19b56e;
}
export function fetchWithTimeout(_0x43a12e, _0x374d48 = {}, _0x380fed = DEFAULT_TIMEOUT) {
  const _0x38509 = new AbortController(),
    _0x313931 = setTimeout(() => _0x38509.abort(), _0x380fed);
  return fetch(_0x43a12e, { ..._0x374d48, signal: _0x38509.signal }).finally(() => clearTimeout(_0x313931));
}
export function fetchWithTimeoutWithSignal(
  _0x59fd6a,
  _0x5a9374 = {},
  _0x26f1e0 = DEFAULT_TIMEOUT,
  _0x4ccc4e,
) {
  const _0x30f984 = new AbortController(),
    _0x5d7a01 = setTimeout(() => _0x30f984.abort(), _0x26f1e0);
  let _0x1e60ee = null;
  if (_0x4ccc4e) {
    if (_0x4ccc4e.aborted) _0x30f984.abort();
    else
      ((_0x1e60ee = () => _0x30f984.abort()), _0x4ccc4e.addEventListener('abort', _0x1e60ee, { once: true }));
  }
  return fetch(_0x59fd6a, { ..._0x5a9374, signal: _0x30f984.signal }).finally(() => {
    clearTimeout(_0x5d7a01);
    if (_0x4ccc4e && _0x1e60ee) _0x4ccc4e.removeEventListener('abort', _0x1e60ee);
  });
}
function stringifyErrorBodyValue(_0x17f439) {
  if (_0x17f439 === undefined || _0x17f439 === null) return '';
  if (typeof _0x17f439 === 'string') return _0x17f439;
  if (typeof _0x17f439 === 'number' || typeof _0x17f439 === 'boolean') return String(_0x17f439);
  if (_0x17f439 && typeof _0x17f439 === 'object') {
    const _0x27e8c7 =
      _0x17f439.message ||
      _0x17f439.errorMessage ||
      _0x17f439.error_message ||
      _0x17f439.reason ||
      _0x17f439.detail ||
      _0x17f439.details ||
      _0x17f439.msg;
    if (_0x27e8c7 !== undefined && _0x27e8c7 !== null && _0x27e8c7 !== _0x17f439) {
      const _0x4f6a28 = stringifyErrorBodyValue(_0x27e8c7);
      if (_0x4f6a28) return _0x4f6a28;
    }
    try {
      return JSON.stringify(_0x17f439);
    } catch {
      return '';
    }
  }
  return String(_0x17f439 || '');
}
async function parseErrorBody(_0x5cc680) {
  let _0x425b3a = '';
  try {
    _0x425b3a = await _0x5cc680.text();
    const _0x1a4b5d = JSON.parse(_0x425b3a);
    return stringifyErrorBodyValue(
      _0x1a4b5d.error?.message ||
        _0x1a4b5d.error ||
        _0x1a4b5d.message ||
        _0x1a4b5d.data?.error ||
        _0x1a4b5d.data?.message ||
        _0x425b3a,
    );
  } catch {
    return _0x425b3a || 'HTTP ' + _0x5cc680.status;
  }
}
export async function request(_0x142c44, _0x517187 = {}, _0x545795 = DEFAULT_TIMEOUT) {
  const _0x528a7c = _0x142c44.startsWith('http') ? _0x142c44 : buildApiUrl(_0x142c44);
  try {
    const _0x2d5b9b = await fetchWithTimeout(_0x528a7c, _0x517187, _0x545795);
    if (_0x2d5b9b.status === 0x194) return { success: true, data: null, status: 0x194 };
    if (!_0x2d5b9b.ok) {
      const _0x564bad = await parseErrorBody(_0x2d5b9b);
      return {
        success: false,
        error: '请求失败: HTTP ' + _0x2d5b9b.status + (_0x564bad ? ' — ' + _0x564bad : ''),
        status: _0x2d5b9b.status,
      };
    }
    const _0x290fde = _0x2d5b9b.headers.get('content-type') || '';
    let _0x3f638a;
    if (_0x290fde.includes('application/json')) _0x3f638a = await _0x2d5b9b.json();
    else {
      const _0x4ebc9d = await _0x2d5b9b.text();
      try {
        _0x3f638a = JSON.parse(_0x4ebc9d);
      } catch {
        _0x3f638a = _0x4ebc9d;
      }
    }
    return { success: true, data: _0x3f638a, status: _0x2d5b9b.status };
  } catch (_0x36b4f9) {
    if (_0x36b4f9.name === 'AbortError')
      return { success: false, error: '请求超时，请检查网络连接或服务器状态', status: 0 };
    if (_0x36b4f9.message?.includes('Failed to fetch'))
      return {
        success: false,
        error:
          '网络请求失败。请检查：\n1. 网络连接是否正常\n2. 本地 Python 服务器(server.py)是否已启动\n3. 浏览器是否可以访问 http://localhost:8777\n4. 是否有防火墙拦截了 8777 端口',
        status: 0,
      };
    return { success: false, error: _0x36b4f9.message || '未知网络错误', status: 0 };
  }
}
export function get(_0xa0b2d0, _0x39f30e) {
  return request(_0xa0b2d0, { method: 'GET' }, _0x39f30e);
}
export function post(_0x37835e, _0x275ce7, _0x344410) {
  const _0xef8ce9 = { method: 'POST', headers: {} };
  if (_0x275ce7 !== undefined) {
    if (_0x275ce7 instanceof FormData || _0x275ce7 instanceof Blob || _0x275ce7 instanceof ArrayBuffer)
      _0xef8ce9.body = _0x275ce7;
    else
      typeof _0x275ce7 === 'object'
        ? ((_0xef8ce9.headers['Content-Type'] = 'application/json'),
          (_0xef8ce9.body = JSON.stringify(_0x275ce7)))
        : (_0xef8ce9.body = _0x275ce7);
  }
  return request(_0x37835e, _0xef8ce9, _0x344410);
}
export function del(_0x166276, _0x296fa3) {
  return request(_0x166276, { method: 'DELETE' }, _0x296fa3);
}
