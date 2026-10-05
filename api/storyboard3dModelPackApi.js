import { buildApiUrl, fetchWithTimeoutWithSignal, get, post } from './apiBase.js';
const MODEL_PACK_API = '/api/v2/storyboard3d/model-pack',
  MODEL_PACK_ASSET_PREFIX = '/data/assets/storyboard3d-model-pack/';
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeInstallProgress(item) {
  const error = item && typeof item === 'object' ? item : {},
    downloadedBytes = Math['max'](0, Number(error['downloadedBytes']) || 0),
    totalBytes = Math['max'](0, Number(error['totalBytes']) || 0),
    key = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0;
  return {
    state: normalizeText(error['state']),
    downloadedBytes: downloadedBytes,
    totalBytes: totalBytes,
    percent: Math['min'](100, Math['max'](0, Number(error['percent']) || key)),
    currentSource: normalizeText(error['currentSource']),
    completedSources: Math['max'](0, Math['floor'](Number(error['completedSources']) || 0)),
    totalSources: Math['max'](0, Math['floor'](Number(error['totalSources']) || 0)),
    message: normalizeText(error['message']),
  };
}
function normalizeStatus(index) {
  const success = index && typeof index === 'object' ? index : {};
  return {
    success: success['success'] !== ![],
    installed: success['installed'] === !![],
    packId: normalizeText(success['packId']),
    version: normalizeText(success['version']),
    requiredVersion: normalizeText(success['requiredVersion']),
    downloadBytes: Math['max'](0, Number(success['downloadBytes']) || 0),
    assetCount: Math['max'](0, Math['floor'](Number(success['assetCount']) || 0)),
    assets: Array['isArray'](success['assets']) ? success['assets']['map']((args) => ({ ...args })) : [],
    installProgress: normalizeInstallProgress(success['installProgress']),
  };
}
function unwrap(response, result) {
  if (!response?.['success']) throw new Error(response?.['error'] || result);
  const response2 = response['data'];
  if (!response2 || typeof response2 !== 'object') throw new Error(result);
  if (response2['success'] === ![])
    throw new Error(response2['error']?.['message'] || response2['error'] || result);
  return normalizeStatus(response2);
}
export async function getStoryboard3DModelPackStatus() {
  return unwrap(await get(MODEL_PACK_API + '/status', 30000), '无法读取 3D 模型包状态。');
}
export async function installStoryboard3DModelPack() {
  return unwrap(await post(MODEL_PACK_API + '/install', {}, 15 * 60 * 1000), '3D 模型包安装失败。');
}
export async function fetchStoryboard3DModelPackAssetFile(response3, { signal: signal } = {}) {
  const text = normalizeText(response3?.['url'] || response3?.['source']?.['url']);
  if (!text['startsWith'](MODEL_PACK_ASSET_PREFIX)) throw new Error('模型包资产地址无效。');
  const response4 = await fetchWithTimeoutWithSignal(buildApiUrl(text), { method: 'GET' }, 120000, signal);
  if (!response4['ok']) throw new Error('模型包资产下载失败：HTTP ' + response4['status']);
  const data = await response4['blob'](),
    list = text['split']('?')[0],
    value2 =
      decodeURIComponent(list['slice'](list['lastIndexOf']('/') + 1)) ||
      'asset.' + (normalizeText(response3?.['format']) || 'obj'),
    type = response4['headers']?.['get']?.('content-type') || data['type'] || 'application/octet-stream';
  if (typeof File === 'function') return new File([data], value2, { type: type });
  const blob = new Blob([data], { type: type });
  return (Object['defineProperty'](blob, 'name', { value: value2 }), blob);
}
