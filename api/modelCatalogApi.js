import { buildApiUrl, fetchWithTimeout } from './apiBase.js';
export const BINGHUO_MODEL_CATALOG_PATH = '/api/v2/model-catalog?provider=binghuo';
export class ModelCatalogApiError extends Error {
  constructor(_0xb1597a, { status: status = 0x0, cause: _0x2bacdc } = {}) {
    (super(String(_0xb1597a || '模型目录请求失败'), _0x2bacdc ? { cause: _0x2bacdc } : undefined),
      (this['name'] = 'ModelCatalogApiError'),
      (this['status'] = Number(status) || 0x0));
  }
}
function normalizeIdentity(_0x1239fd) {
  return String(_0x1239fd || '')['trim']();
}
function readResponseHeader(_0x13ed7e, _0x9f18ef) {
  return String(_0x13ed7e?.['headers']?.['get']?.(_0x9f18ef) || '')['trim']();
}
async function readErrorMessage(_0x2777ed) {
  try {
    const _0x5e3eaa = await _0x2777ed['text']();
    if (!_0x5e3eaa) return 'HTTP ' + _0x2777ed['status'];
    try {
      const _0x2b8426 = JSON['parse'](_0x5e3eaa);
      return String(_0x2b8426?.['message'] || _0x2b8426?.['error'] || _0x5e3eaa)['trim']();
    } catch {
      return _0x5e3eaa['trim']();
    }
  } catch {
    return 'HTTP ' + (_0x2777ed?.['status'] || 0x0);
  }
}
export async function fetchBinghuoModelCatalog({
  installId: _0x2b128b,
  deviceId: _0x3dcb98,
  etag: etag = '',
  timeout: timeout = 0x3a98,
} = {}) {
  const _0x3a9ae5 = normalizeIdentity(_0x2b128b),
    _0x132cac = normalizeIdentity(_0x3dcb98);
  if (!_0x3a9ae5 || !_0x132cac) throw new ModelCatalogApiError('缺少模型目录授权主体信息');
  const _0x416620 = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      'X-AIC-Install-Id': _0x3a9ae5,
      'X-AIC-Device-Id': _0x132cac,
    },
    _0x194376 = String(etag || '')['trim']();
  if (_0x194376) _0x416620['If-None-Match'] = _0x194376;
  let _0x395f39;
  try {
    _0x395f39 = await fetchWithTimeout(
      buildApiUrl(BINGHUO_MODEL_CATALOG_PATH),
      { method: 'GET', headers: _0x416620 },
      timeout,
    );
  } catch (_0x1178b0) {
    throw new ModelCatalogApiError(
      _0x1178b0?.['name'] === 'AbortError' ? '模型目录请求超时' : _0x1178b0?.['message'],
      { cause: _0x1178b0 },
    );
  }
  const _0x37ec79 = {
    httpStatus: Number(_0x395f39['status']) || 0x0,
    etag: readResponseHeader(_0x395f39, 'ETag'),
    cacheControl: readResponseHeader(_0x395f39, 'Cache-Control'),
    lastModified: readResponseHeader(_0x395f39, 'Last-Modified'),
  };
  if (_0x395f39['status'] === 0x130) return { status: 'not-modified', bundle: null, ..._0x37ec79 };
  if (!_0x395f39['ok'])
    throw new ModelCatalogApiError(await readErrorMessage(_0x395f39), {
      status: _0x395f39['status'],
    });
  let _0x1ac709;
  try {
    _0x1ac709 = await _0x395f39['json']();
  } catch (_0x28c4bc) {
    throw new ModelCatalogApiError('模型目录响应不是有效 JSON', {
      status: _0x395f39['status'],
      cause: _0x28c4bc,
    });
  }
  return { status: 'ok', bundle: _0x1ac709, ..._0x37ec79 };
}
