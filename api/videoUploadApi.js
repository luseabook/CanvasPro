import { buildApiUrl } from './apiBase.js';
import { post, get } from './requester.js';
import { isApimartReusableUrl, uploadVideoToApimart } from './apimartUploadApi.js';
export async function uploadVideoToRunningHub(_0x10b027, _0x2f47a8) {
  if (!_0x2f47a8) throw new Error('RunningHUB API Key 未配置，无法上传视频');
  if (!_0x10b027) throw new Error('视频文件不能为空');
  const _0x109ca6 = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    _0x10d959 = buildApiUrl('/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(_0x109ca6)),
    _0x186753 = new FormData(),
    _0xd26565 = _0x10b027.name || 'video.mp4';
  _0x186753.append('file', _0x10b027, _0xd26565);
  const _0x3638d0 = await post(_0x10d959, _0x186753, {
    headers: { Authorization: 'Bearer ' + _0x2f47a8 },
    provider: 'runninghub',
    buildUrl: false,
  });
  if (_0x3638d0.code !== 0) throw new Error('RunningHUB 视频上传失败: ' + (_0x3638d0.message || '未知错误'));
  const _0xeae081 = _0x3638d0.data?.download_url;
  if (!_0xeae081) throw new Error('RunningHUB 返回的视频URL为空');
  return _0xeae081;
}
export async function uploadVideoToApimartCdn(_0x29e448, _0x2e810f = {}) {
  if (!_0x29e448) throw new Error('视频文件不能为空');
  return await uploadVideoToApimart(_0x29e448, _0x2e810f);
}
async function processInputVideosOrdered(_0x4739f8, _0x4c59f5, _0x142a27 = {}) {
  if (!_0x4739f8 || _0x4739f8.length === 0) return [];
  const _0x1b507d = String(_0x142a27.provider || 'runninghub').trim() || 'runninghub',
    _0x1e19c6 = _0x142a27.strictUpload === true,
    _0x42ddd3 = new Array(_0x4739f8.length).fill('');
  for (let _0xb30bf7 = 0; _0xb30bf7 < _0x4739f8.length; _0xb30bf7++) {
    const _0x281fb5 = String(_0x4739f8[_0xb30bf7] || '').trim();
    if (!_0x281fb5) continue;
    try {
      if (_0x1b507d === 'runninghub' && _0x281fb5.includes('runninghub.cn')) {
        _0x42ddd3[_0xb30bf7] = _0x281fb5;
        continue;
      }
      if (_0x1b507d === 'apimart' && isApimartReusableUrl(_0x281fb5)) {
        _0x42ddd3[_0xb30bf7] = _0x281fb5;
        continue;
      }
      const _0x15ece3 = /^https?:\/\//.test(_0x281fb5)
          ? _0x281fb5
          : buildApiUrl(_0x281fb5.startsWith('/') ? _0x281fb5 : '/' + _0x281fb5),
        _0x4fbe0f = await get(_0x15ece3, { provider: 'remote', buildUrl: false, responseType: 'blob' }),
        _0x2f5afc =
          _0x1b507d === 'apimart'
            ? await uploadVideoToApimart(_0x4fbe0f, { ..._0x142a27, apiKey: _0x4c59f5 })
            : await uploadVideoToRunningHub(_0x4fbe0f, _0x4c59f5);
      _0x42ddd3[_0xb30bf7] = _0x2f5afc;
    } catch (_0xf37c98) {
      if (_0x1e19c6) throw _0xf37c98;
    }
  }
  return _0x42ddd3;
}
export async function processInputVideos(_0x5caade, _0x3607bf, _0x207e8b = {}) {
  const _0x223678 = await processInputVideosOrdered(_0x5caade, _0x3607bf, _0x207e8b);
  return _0x223678.filter(Boolean);
}
export async function processInputVideosPreserveOrder(_0x136092, _0x5e0451, _0x5a3ac7 = {}) {
  return await processInputVideosOrdered(_0x136092, _0x5e0451, _0x5a3ac7);
}
