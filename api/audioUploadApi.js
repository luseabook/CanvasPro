import { buildApiUrl } from './apiBase.js';
import { post, get } from './requester.js';
import { isApimartReusableUrl, uploadBlobToApimart } from './apimartUploadApi.js';
export async function uploadAudioToRunningHub(_0xddeecd, _0x202ce3) {
  if (!_0x202ce3) throw new Error('RunningHUB API Key 未配置，无法上传音频');
  if (!_0xddeecd) throw new Error('音频文件不能为空');
  const _0x52bb35 = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    _0xe43b17 = buildApiUrl('/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(_0x52bb35)),
    _0x1a1180 = new FormData(),
    _0x52d1b5 = _0xddeecd.name || 'audio.mp3';
  _0x1a1180.append('file', _0xddeecd, _0x52d1b5);
  const _0x409967 = await post(_0xe43b17, _0x1a1180, {
    headers: { Authorization: 'Bearer ' + _0x202ce3 },
    provider: 'runninghub',
    buildUrl: false,
  });
  if (_0x409967.code !== 0) throw new Error('RunningHUB 音频上传失败: ' + (_0x409967.message || '未知错误'));
  const _0x248a32 = _0x409967.data?.download_url;
  if (!_0x248a32) throw new Error('RunningHUB 返回的音频URL为空');
  return _0x248a32;
}
function guessAudioExtension(_0x285713, _0x230b3a = 'mp3') {
  try {
    const _0xfaeb45 = new URL(String(_0x285713 || ''), 'https://local.invalid'),
      _0x3452b4 =
        String(_0xfaeb45.pathname || '')
          .split('/')
          .pop() || '',
      _0x5e14af = _0x3452b4.includes('.') ? _0x3452b4.split('.').pop().toLowerCase() : '';
    if (/^(mp3|wav|m4a|aac|ogg|flac|webm|mp4)$/.test(_0x5e14af)) return _0x5e14af;
  } catch {}
  return _0x230b3a;
}
export async function uploadAudioToApimart(_0xa4d453, _0x3224df = {}) {
  return await uploadBlobToApimart(_0xa4d453, {
    ..._0x3224df,
    contentType: _0x3224df.contentType || _0xa4d453?.type || 'audio/mpeg',
    fileExtension: _0x3224df.fileExtension || 'mp3',
  });
}
async function processInputAudiosOrdered(_0x101f6b, _0x1e982b, _0xa5a416 = {}) {
  if (!_0x101f6b || _0x101f6b.length === 0) return [];
  const _0x2554e6 = String(_0xa5a416.provider || 'runninghub')
      .trim()
      .toLowerCase(),
    _0x4a909f = _0xa5a416.strictUpload === true,
    _0x19e3b3 = new Array(_0x101f6b.length).fill('');
  for (let _0xd7bd38 = 0; _0xd7bd38 < _0x101f6b.length; _0xd7bd38++) {
    const _0x133e17 = String(_0x101f6b[_0xd7bd38] || '').trim();
    if (!_0x133e17) continue;
    try {
      if (_0x2554e6 === 'apimart') {
        if (isApimartReusableUrl(_0x133e17)) {
          _0x19e3b3[_0xd7bd38] = _0x133e17;
          continue;
        }
        const _0x13d7a8 = /^https?:\/\//.test(_0x133e17)
            ? _0x133e17
            : buildApiUrl(_0x133e17.startsWith('/') ? _0x133e17 : '/' + _0x133e17),
          _0xc34304 = await get(_0x13d7a8, { provider: 'remote', buildUrl: false, responseType: 'blob' }),
          _0x40b6f5 = guessAudioExtension(_0x133e17);
        _0x19e3b3[_0xd7bd38] = await uploadAudioToApimart(_0xc34304, {
          ..._0xa5a416,
          apiKey: _0x1e982b,
          contentType: _0xc34304?.type || 'audio/mpeg',
          fileExtension: _0x40b6f5,
          filename: 'audio.' + _0x40b6f5,
        });
        continue;
      }
      if (_0x133e17.includes('runninghub.cn')) {
        _0x19e3b3[_0xd7bd38] = _0x133e17;
        continue;
      }
      const _0x18708e = /^https?:\/\//.test(_0x133e17)
          ? _0x133e17
          : buildApiUrl(_0x133e17.startsWith('/') ? _0x133e17 : '/' + _0x133e17),
        _0x59a376 = await get(_0x18708e, { provider: 'remote', buildUrl: false, responseType: 'blob' }),
        _0x186a7d = await uploadAudioToRunningHub(_0x59a376, _0x1e982b);
      _0x19e3b3[_0xd7bd38] = _0x186a7d;
    } catch (_0x14dea4) {
      if (_0x4a909f) throw _0x14dea4;
    }
  }
  return _0x19e3b3;
}
export async function processInputAudios(_0x4dafb4, _0xc60b51, _0x18e3bd = {}) {
  const _0x127a5b = await processInputAudiosOrdered(_0x4dafb4, _0xc60b51, _0x18e3bd);
  return _0x127a5b.filter(Boolean);
}
export async function processInputAudiosPreserveOrder(_0x1356f5, _0x5b55cd, _0x57b174 = {}) {
  return await processInputAudiosOrdered(_0x1356f5, _0x5b55cd, _0x57b174);
}
