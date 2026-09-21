import { compressImage } from '../src/modules/imageUtils.js';
import { post, get } from './requester.js';
import { resolveImageInputUploadQualityOptions } from '../src/services/imageInputUploadQualityService.js';
import { isApimartReusableUrl, uploadImageToApimart } from './apimartUploadApi.js';
import { uploadToFreeImageHost } from './freeImageHostApi.js';
function _createLimiter(_0x4e43ba) {
  let _0x5c8ae9 = 0;
  const _0x5e217c = [];
  return function _0x4e2a90(_0x56d6dd) {
    return new Promise((_0x2570a9, _0x44b090) => {
      const _0x4174bc = () => {
        (_0x5c8ae9++,
          Promise.resolve()
            .then(_0x56d6dd)
            .then(
              (_0x246343) => {
                _0x5c8ae9--;
                if (_0x5e217c.length && _0x5c8ae9 < _0x4e43ba) _0x5e217c.shift()();
                _0x2570a9(_0x246343);
              },
              (_0x14d2b9) => {
                _0x5c8ae9--;
                if (_0x5e217c.length && _0x5c8ae9 < _0x4e43ba) _0x5e217c.shift()();
                _0x44b090(_0x14d2b9);
              },
            ));
      };
      if (_0x5c8ae9 < _0x4e43ba) _0x4174bc();
      else _0x5e217c.push(_0x4174bc);
    });
  };
}
const _runLimited = _createLimiter(3),
  _inflight = new Map();
function _buildKey(_0x3ba636, _0x245d55, _0x1a6396) {
  const {
      compress: compress = true,
      maxDim: maxDim = 0x800,
      quality: quality = 0.9,
      provider: provider = 'grsai',
      preferFree: preferFree = false,
    } = _0x1a6396 || {},
    _0x22b139 = Math.round(quality * 0x3e8),
    _0xa3282a = _0x245d55 ? 1 : 0,
    _0x1bf96c = compress ? 1 : 0,
    _0x739135 = preferFree ? 1 : 0;
  return [_0x3ba636, provider, _0x1bf96c, maxDim, _0x22b139, _0xa3282a, _0x739135].join('|');
}
function _getUploadPromise(_0x50ffb9, _0x33cd2e, _0x109a8e) {
  const _0x2ee251 = _buildKey(_0x50ffb9, _0x33cd2e, _0x109a8e);
  let _0x33afa6 = _inflight.get(_0x2ee251);
  return (
    !_0x33afa6 &&
      ((_0x33afa6 = _runLimited(() => _processSingle(_0x50ffb9, _0x33cd2e, _0x109a8e))),
      _inflight.set(_0x2ee251, _0x33afa6),
      _0x33afa6
        .finally(() => {
          _inflight.delete(_0x2ee251);
        })
        .catch(() => {})),
    _0x33afa6
  );
}
async function _processSingle(_0x55ab98, _0x38bbf7, _0x404e92) {
  const {
    compress: compress = true,
    maxDim: maxDim = 0x800,
    quality: quality = 0.9,
    provider: provider = 'grsai',
    fallbackCompressOnError: fallbackCompressOnError = false,
    fallbackMaxDim: fallbackMaxDim = 0x800,
    fallbackQuality: fallbackQuality = 0.9,
  } = _0x404e92 || {};
  if (provider === 'runninghub' && _0x55ab98.includes('runninghub.cn')) return _0x55ab98;
  if (provider === 'apimart' && isApimartReusableUrl(_0x55ab98)) return _0x55ab98;
  const _0x4074de = async (_0xf1c50a) => {
    if (provider === 'runninghub') return await uploadToRunningHub(_0xf1c50a, _0x38bbf7);
    if (provider === 'apimart')
      return await uploadImageToApimart(_0xf1c50a, { ...(_0x404e92 || {}), apiKey: _0x38bbf7 });
    if (isFreeImageHostProvider(provider)) return await uploadToFreeImageHost(_0xf1c50a, _0x404e92 || {});
    return await uploadImageToBed(_0xf1c50a, _0x38bbf7, _0x404e92 || {});
  };
  if (compress) {
    let _0x34ac1c;
    try {
      _0x34ac1c = await compressImage(_0x55ab98, maxDim, quality);
    } catch (_0x538007) {
      _0x34ac1c = await get(_0x55ab98, { provider: 'remote', buildUrl: false, responseType: 'blob' });
    }
    return await _0x4074de(_0x34ac1c);
  }
  if (fallbackCompressOnError)
    try {
      const _0x407d20 = await get(_0x55ab98, { provider: 'remote', buildUrl: false, responseType: 'blob' });
      return await _0x4074de(_0x407d20);
    } catch (_0x4fe94a) {
      const _0x343c87 = await compressImage(_0x55ab98, fallbackMaxDim, fallbackQuality);
      return await _0x4074de(_0x343c87);
    }
  const _0x5414ff = await get(_0x55ab98, { provider: 'remote', buildUrl: false, responseType: 'blob' });
  return await _0x4074de(_0x5414ff);
}
async function uploadToTelegraph(_0x219dde) {
  const _0x44315b = new FormData();
  _0x44315b.append('file', _0x219dde, 'image.png');
  const _0x4f1ae1 = 'https://telegra.ph/upload',
    _0x113f8c = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(_0x4f1ae1),
    _0x557af5 = await post(_0x113f8c, _0x44315b, { provider: 'telegraph' });
  if (Array.isArray(_0x557af5) && _0x557af5[0]?.src) return 'https://telegra.ph' + _0x557af5[0].src;
  throw new Error('Telegraph 返回格式异常');
}
function isFreeImageHostProvider(_0x13867b) {
  const _0x39c230 = String(_0x13867b || '').trim(),
    _0xb83990 = _0x39c230.toLowerCase().replace(/[\s_-]+/g, '');
  return _0x39c230 === '免费图床' || _0xb83990 === 'freeimagehost';
}
async function uploadToQiniu(_0x136293, _0x314422) {
  const _0x2171f7 = { 'Content-Type': 'application/json' };
  if (_0x314422) _0x2171f7.Authorization = 'Bearer ' + _0x314422;
  const _0x4f1070 = await post(
    'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH',
    { sux: 'png' },
    { provider: 'grsai', buildUrl: false, headers: _0x2171f7 },
  );
  if (!_0x4f1070.data) throw new Error('GRSAI 返回了无效的上传凭证');
  const { token: _0x666c1d, key: _0x140277, url: _0x12c1d8, domain: _0x454986 } = _0x4f1070.data,
    _0x1d2da8 = new FormData();
  return (
    _0x1d2da8.append('token', _0x666c1d),
    _0x1d2da8.append('key', _0x140277),
    _0x1d2da8.append('file', _0x136293, 'image.png'),
    await post(_0x12c1d8, _0x1d2da8, { provider: 'qiniu', buildUrl: false }),
    _0x454986 + '/' + _0x140277
  );
}
export async function uploadImageToBed(_0x517d56, _0x4ea588, _0x2fd16b = {}) {
  const { preferFree: preferFree = false } = _0x2fd16b;
  if (preferFree)
    try {
      return await uploadToFreeImageHost(_0x517d56, _0x2fd16b);
    } catch (_0xe2a863) {
      try {
        return await uploadToTelegraph(_0x517d56);
      } catch (_0x91abef) {
        if (!_0x4ea588)
          throw new Error(
            '免费图床上传失败，且无 GRSAI API Key 备用：' +
              (_0x91abef?.message || _0xe2a863?.message || '未知错误'),
          );
      }
    }
  if (_0x4ea588)
    try {
      return await uploadToQiniu(_0x517d56, _0x4ea588);
    } catch (_0x16e6c8) {
      if (!preferFree) return await uploadToTelegraph(_0x517d56);
      throw _0x16e6c8;
    }
  return await uploadToTelegraph(_0x517d56);
}
export async function uploadToRunningHub(_0x40d68a, _0x20f256) {
  if (!_0x20f256) throw new Error('RunningHUB API Key 未配置，无法上传图片');
  const _0x447c86 = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    _0x53cd63 = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(_0x447c86),
    _0xe23df4 = new FormData();
  _0xe23df4.append('file', _0x40d68a, 'image.png');
  const _0x3760f7 = await post(_0x53cd63, _0xe23df4, {
      headers: { Authorization: 'Bearer ' + _0x20f256 },
      provider: 'runninghub',
    }),
    _0x7d303d = Number(_0x3760f7?.code);
  if (Number.isFinite(_0x7d303d) && _0x7d303d !== 0)
    throw new Error('RunningHUB 上传失败: ' + getRunningHubUploadErrorMessage(_0x3760f7));
  const _0x491d3a = getRunningHubUploadUrl(_0x3760f7);
  if (!_0x491d3a) throw new Error('RunningHUB 上传失败: 未返回可用文件 URL');
  return _0x491d3a;
}
function pickFirstUploadMessage(_0x2c856d) {
  for (const _0x5c8ccf of _0x2c856d) {
    if (typeof _0x5c8ccf === 'string' && _0x5c8ccf.trim()) return _0x5c8ccf.trim();
  }
  return '';
}
function getRunningHubUploadErrorMessage(_0x2f2338) {
  const _0x4194dd = _0x2f2338?.code,
    _0x1f423b = pickFirstUploadMessage([
      _0x2f2338?.message,
      _0x2f2338?.msg,
      _0x2f2338?.errorMessage,
      _0x2f2338?.error,
      _0x2f2338?.data?.message,
      _0x2f2338?.data?.msg,
      _0x2f2338?.data?.errorMessage,
      _0x2f2338?.data?.error,
    ]);
  if (_0x1f423b) return _0x4194dd === undefined ? _0x1f423b : _0x1f423b + ' (code: ' + _0x4194dd + ')';
  return _0x4194dd === undefined ? '未知错误' : '未知错误 (code: ' + _0x4194dd + ')';
}
function getRunningHubUploadUrl(_0x3f8b32) {
  return String(
    _0x3f8b32?.data?.download_url ||
      _0x3f8b32?.data?.downloadUrl ||
      _0x3f8b32?.data?.fileUrl ||
      _0x3f8b32?.data?.file_url ||
      _0x3f8b32?.data?.url ||
      _0x3f8b32?.download_url ||
      _0x3f8b32?.downloadUrl ||
      _0x3f8b32?.fileUrl ||
      _0x3f8b32?.file_url ||
      _0x3f8b32?.url ||
      '',
  ).trim();
}
async function _processInputImagesOrdered(_0x69093, _0x214fbd, _0x290ac6 = {}) {
  const _0x2192c7 =
      _0x290ac6?.applyInputQualityProfile === true
        ? resolveImageInputUploadQualityOptions(_0x290ac6)
        : _0x290ac6 || {},
    {
      compress: compress = true,
      maxDim: maxDim = 0x800,
      quality: quality = 0.9,
      provider: provider = 'grsai',
    } = _0x2192c7;
  if (!_0x69093 || _0x69093.length === 0) return [];
  const _0x2678b8 = {
      ..._0x2192c7,
      compress: compress,
      maxDim: maxDim,
      quality: quality,
      provider: provider,
    },
    _0x3510d0 = _0x2678b8.strictUpload === true,
    _0x4ff35c = new Array(_0x69093.length).fill(''),
    _0x3e009d = [];
  for (let _0x34f1e0 = 0; _0x34f1e0 < _0x69093.length; _0x34f1e0++) {
    const _0x17c25e = String(_0x69093[_0x34f1e0] || '').trim();
    if (!_0x17c25e) continue;
    if (provider === 'runninghub' && _0x17c25e.includes('runninghub.cn')) {
      _0x4ff35c[_0x34f1e0] = _0x17c25e;
      continue;
    }
    if (provider === 'apimart' && isApimartReusableUrl(_0x17c25e)) {
      _0x4ff35c[_0x34f1e0] = _0x17c25e;
      continue;
    }
    const _0x535844 = _getUploadPromise(_0x17c25e, _0x214fbd, _0x2678b8),
      _0x3cde6d = _0x535844.then((_0x3d0f8c) => {
        _0x4ff35c[_0x34f1e0] = String(_0x3d0f8c || '').trim();
      });
    _0x3e009d.push(
      _0x3510d0
        ? _0x3cde6d
        : _0x3cde6d.catch(() => {
            _0x4ff35c[_0x34f1e0] = '';
          }),
    );
  }
  if (_0x3e009d.length > 0) {
    if (_0x3510d0) await Promise.all(_0x3e009d);
    else await Promise.allSettled(_0x3e009d);
  }
  return _0x4ff35c;
}
export async function processInputImages(_0x485d12, _0xdee43, _0xd4fc0c = {}) {
  const _0x1ec344 = await _processInputImagesOrdered(_0x485d12, _0xdee43, _0xd4fc0c);
  return _0x1ec344.filter(Boolean);
}
export async function processInputImagesPreserveOrder(_0x213b15, _0x87b0c6, _0x31fe1c = {}) {
  return await _processInputImagesOrdered(_0x213b15, _0x87b0c6, _0x31fe1c);
}
