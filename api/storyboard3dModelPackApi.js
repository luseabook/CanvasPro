import { buildApiUrl, fetchWithTimeoutWithSignal, get, post } from './apiBase.js';
const MODEL_PACK_API = '/api/v2/storyboard3d/model-pack',
  MODEL_PACK_ASSET_PREFIX = '/data/assets/storyboard3d-model-pack/';
function normalizeText(_0x452913) {
  return String(_0x452913 || '')['trim']();
}
function normalizeInstallProgress(_0x469e83) {
  const _0x189bc3 = _0x469e83 && typeof _0x469e83 === 'object' ? _0x469e83 : {},
    _0x521b61 = Math['max'](0x0, Number(_0x189bc3['downloadedBytes']) || 0x0),
    _0x45fedd = Math['max'](0x0, Number(_0x189bc3['totalBytes']) || 0x0),
    _0x3ef020 = _0x45fedd > 0x0 ? (_0x521b61 / _0x45fedd) * 0x64 : 0x0;
  return {
    state: normalizeText(_0x189bc3['state']),
    downloadedBytes: _0x521b61,
    totalBytes: _0x45fedd,
    percent: Math['min'](0x64, Math['max'](0x0, Number(_0x189bc3['percent']) || _0x3ef020)),
    currentSource: normalizeText(_0x189bc3['currentSource']),
    completedSources: Math['max'](0x0, Math['floor'](Number(_0x189bc3['completedSources']) || 0x0)),
    totalSources: Math['max'](0x0, Math['floor'](Number(_0x189bc3['totalSources']) || 0x0)),
    message: normalizeText(_0x189bc3['message']),
  };
}
function normalizeStatus(_0x7ccd04) {
  const _0x406034 = _0x7ccd04 && typeof _0x7ccd04 === 'object' ? _0x7ccd04 : {};
  return {
    success: _0x406034['success'] !== ![],
    installed: _0x406034['installed'] === !![],
    packId: normalizeText(_0x406034['packId']),
    version: normalizeText(_0x406034['version']),
    requiredVersion: normalizeText(_0x406034['requiredVersion']),
    downloadBytes: Math['max'](0x0, Number(_0x406034['downloadBytes']) || 0x0),
    assetCount: Math['max'](0x0, Math['floor'](Number(_0x406034['assetCount']) || 0x0)),
    assets: Array['isArray'](_0x406034['assets'])
      ? _0x406034['assets']['map']((_0x2f0fd4) => ({ ..._0x2f0fd4 }))
      : [],
    installProgress: normalizeInstallProgress(_0x406034['installProgress']),
  };
}
function unwrap(_0x4c3735, _0x2b1b0d) {
  if (!_0x4c3735?.['success']) throw new Error(_0x4c3735?.['error'] || _0x2b1b0d);
  const _0x19f580 = _0x4c3735['data'];
  if (!_0x19f580 || typeof _0x19f580 !== 'object') throw new Error(_0x2b1b0d);
  if (_0x19f580['success'] === ![])
    throw new Error(_0x19f580['error']?.['message'] || _0x19f580['error'] || _0x2b1b0d);
  return normalizeStatus(_0x19f580);
}
export async function getStoryboard3DModelPackStatus() {
  return unwrap(await get(MODEL_PACK_API + '/status', 0x7530), '无法读取\x203D\x20模型包状态。');
}
export async function installStoryboard3DModelPack() {
  return unwrap(await post(MODEL_PACK_API + '/install', {}, 0xf * 0x3c * 0x3e8), '3D 模型包安装失败。');
}
export async function fetchStoryboard3DModelPackAssetFile(_0x4fe19b, { signal: _0x508ca4 } = {}) {
  const _0x5a7e91 = normalizeText(_0x4fe19b?.['url'] || _0x4fe19b?.['source']?.['url']);
  if (!_0x5a7e91['startsWith'](MODEL_PACK_ASSET_PREFIX)) throw new Error('模型包资产地址无效。');
  const _0x491cda = await fetchWithTimeoutWithSignal(
    buildApiUrl(_0x5a7e91),
    { method: 'GET' },
    0x1d4c0,
    _0x508ca4,
  );
  if (!_0x491cda['ok']) throw new Error('模型包资产下载失败：HTTP ' + _0x491cda['status']);
  const _0x2651d6 = await _0x491cda['blob'](),
    _0x2d9cfc = _0x5a7e91['split']('?')[0x0],
    _0x1eb7ef =
      decodeURIComponent(_0x2d9cfc['slice'](_0x2d9cfc['lastIndexOf']('/') + 0x1)) ||
      'asset.' + (normalizeText(_0x4fe19b?.['format']) || 'obj'),
    _0x694ac =
      _0x491cda['headers']?.['get']?.('content-type') || _0x2651d6['type'] || 'application/octet-stream';
  if (typeof File === 'function') return new File([_0x2651d6], _0x1eb7ef, { type: _0x694ac });
  const _0x45f687 = new Blob([_0x2651d6], { type: _0x694ac });
  return (Object['defineProperty'](_0x45f687, 'name', { value: _0x1eb7ef }), _0x45f687);
}
