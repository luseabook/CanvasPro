import { buildApiUrl, fetchWithTimeout } from './apiBase.js';
export const BINGHUO_MODEL_CATALOG_PATH = '/api/v2/model-catalog?provider=binghuo';
export class ModelCatalogApiError extends Error {
  constructor(value, { status: status = 0, cause: cause } = {}) {
    (super(String(value || '模型目录请求失败'), cause ? { cause: cause } : undefined),
      (this.name = 'ModelCatalogApiError'),
      (this.status = Number(status) || 0));
  }
}
function normalizeIdentity(item) {
  return String(item || '').trim();
}
function readResponseHeader(response, key) {
  return String(response?.headers?.get?.(key) || '').trim();
}
async function readErrorMessage(response2) {
  try {
    const enabled = await response2.text();
    if (!enabled) return 'HTTP ' + response2.status;
    try {
      const error = JSON.parse(enabled);
      return String(error?.message || error?.error || enabled).trim();
    } catch {
      return enabled.trim();
    }
  } catch {
    return 'HTTP ' + (response2?.status || 0);
  }
}
export async function fetchBinghuoModelCatalog({
  installId: installId,
  deviceId: deviceId,
  etag: etag = '',
  timeout: timeout = 15000,
} = {}) {
  const identity = normalizeIdentity(installId),
    identity2 = normalizeIdentity(deviceId);
  if (!identity || !identity2) throw new ModelCatalogApiError('缺少模型目录授权主体信息');
  const headers = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      'X-AIC-Install-Id': identity,
      'X-AIC-Device-Id': identity2,
    },
    index = String(etag || '').trim();
  if (index) headers['If-None-Match'] = index;
  let status2;
  try {
    status2 = await fetchWithTimeout(
      buildApiUrl(BINGHUO_MODEL_CATALOG_PATH),
      { method: 'GET', headers: headers },
      timeout,
    );
  } catch (cause2) {
    throw new ModelCatalogApiError(
      cause2?.name === 'AbortError' ? '模型目录请求超时' : cause2?.message,
      { cause: cause2 },
    );
  }
  const args = {
    httpStatus: Number(status2.status) || 0,
    etag: readResponseHeader(status2, 'ETag'),
    cacheControl: readResponseHeader(status2, 'Cache-Control'),
    lastModified: readResponseHeader(status2, 'Last-Modified'),
  };
  if (status2.status === 304) return { status: 'not-modified', bundle: null, ...args };
  if (!status2.ok)
    throw new ModelCatalogApiError(await readErrorMessage(status2), {
      status: status2.status,
    });
  let bundle;
  try {
    bundle = await status2.json();
  } catch (cause3) {
    throw new ModelCatalogApiError('模型目录响应不是有效 JSON', {
      status: status2.status,
      cause: cause3,
    });
  }
  return { status: 'ok', bundle: bundle, ...args };
}
