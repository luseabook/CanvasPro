import { request } from './apiBase.js';
import {
  buildProviderModelsUrl,
  normalizeProviderModelListPayload,
} from '../src/modules/settings/providerModelCatalog.js';

export const PROVIDER_MODEL_LIST_TIMEOUT_MS = 30000;

/**
 * 读取厂商的真实模型清单。
 *
 * 走本地 server.py 的通用代理（/api/v2/proxy/task），而不是浏览器直连厂商：
 *   - 厂商接口的 CORS 策略不受我们控制，直连在 Web 版会被拦；
 *   - 密钥不经过第三方中转，只发往用户自己填的那条线路。
 */
export async function fetchProviderModelList({
  providerId,
  apiUrl,
  apiKey,
  timeoutMs = PROVIDER_MODEL_LIST_TIMEOUT_MS,
} = {}) {
  const modelsUrl = buildProviderModelsUrl(providerId, apiUrl),
    key = String(apiKey || '')
      .trim()
      .replace(/^Bearer\s+/i, '');
  if (!modelsUrl)
    return { success: false, error: 'MODEL_LIST_URL_UNSUPPORTED', models: [], modelsUrl: '', status: 0 };
  if (!key)
    return { success: false, error: 'MODEL_LIST_API_KEY_MISSING', models: [], modelsUrl, status: 0 };
  const response = await request(
    '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(modelsUrl),
    { method: 'GET', headers: { Authorization: 'Bearer ' + key } },
    timeoutMs,
  );
  if (!response?.success)
    return {
      success: false,
      error: response?.error || 'MODEL_LIST_REQUEST_FAILED',
      models: [],
      modelsUrl,
      status: response?.status || 0,
    };
  return {
    success: true,
    error: '',
    models: normalizeProviderModelListPayload(response.data),
    modelsUrl,
    status: response.status || 200,
  };
}
