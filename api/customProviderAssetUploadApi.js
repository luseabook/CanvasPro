import { post } from './requester.js';
import { isConfiguredObjectStorageEnabled, uploadToConfiguredObjectStorage } from './objectStorageApi.js';
const CUSTOM_PROVIDER_ASSET_MAX_BYTES = 0x64 * 0x400 * 0x400;
function normalizeUploadProvider(_0x14ac9e) {
  return String(_0x14ac9e || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/[\s_-]+/g, '');
}
function normalizeCustomProviderAssetExtensions(_0x404b4a) {
  if (!Array['isArray'](_0x404b4a)) return [];
  return [
    ...new Set(
      _0x404b4a['map']((_0x4ab2e2) =>
        String(_0x4ab2e2 || '')
          ['trim']()
          ['toLowerCase']()
          ['replace'](/^\./, ''),
      )['filter']((_0x1e5f06) => /^[a-z0-9]{1,10}$/['test'](_0x1e5f06)),
    ),
  ]['slice'](0x0, 0x10);
}
function resolveCustomProviderAssetOptions(_0x391f02 = {}) {
  const _0x5cc8c2 = String(_0x391f02['apiUrl'] || '')['trim']();
  if (!/^https?:\/\//i['test'](_0x5cc8c2)) throw new Error('中转站素材上传缺少安全的上传地址');
  const _0x1a70fc = String(_0x391f02['multipartField'] || 'file')['trim']();
  if (!/^[A-Za-z_][A-Za-z0-9_-]{0,63}$/['test'](_0x1a70fc)) throw new Error('中转站素材上传字段无效');
  const _0x5a2d02 = String(_0x391f02['responsePath'] || 'url')['trim']();
  if (!/^[A-Za-z0-9_.\[\]-]{1,160}$/['test'](_0x5a2d02)) throw new Error('中转站素材上传返回路径无效');
  const _0x3c63b3 = Number(_0x391f02['maxBytes']);
  return {
    apiUrl: _0x5cc8c2,
    multipartField: _0x1a70fc,
    responsePath: _0x5a2d02,
    formFields: Object['fromEntries'](
      Object['entries'](_0x391f02['formFields'] || {})['filter'](
        ([_0x43fb29, _0x1472ad]) =>
          ['model', 'purpose']['includes'](_0x43fb29) &&
          typeof _0x1472ad === 'string' &&
          _0x1472ad['length'] > 0x0 &&
          _0x1472ad['length'] <= 0xc0,
      ),
    ),
    allowedExtensions: normalizeCustomProviderAssetExtensions(_0x391f02['allowedExtensions']),
    maxBytes:
      Number['isFinite'](_0x3c63b3) && _0x3c63b3 > 0x0
        ? Math['min'](CUSTOM_PROVIDER_ASSET_MAX_BYTES, Math['trunc'](_0x3c63b3))
        : 0x0,
    filename: String(_0x391f02['filename'] || '')['trim'](),
    timeout: Number(_0x391f02['uploadTimeout'] || _0x391f02['timeout'] || 0xea60),
  };
}
function getBlobFileExtension(_0x3e1913, _0xc2e3ea = 'bin') {
  const _0x68f431 = String(_0x3e1913?.['name'] || '')['trim'](),
    _0x3988f8 = _0x68f431['match'](/\.([A-Za-z0-9]{1,10})$/);
  if (_0x3988f8) {
    const _0x36964f = _0x3988f8[0x1]['toLowerCase']();
    return _0x36964f === 'jpeg' ? 'jpg' : _0x36964f;
  }
  const _0x3490d9 = String(_0x3e1913?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x466361 = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'video/mp4': 'mp4',
    }[_0x3490d9];
  return _0x466361 || _0xc2e3ea;
}
function getFilenameExtension(_0x19ab6c) {
  const _0x425e41 = String(_0x19ab6c || '')
    ['trim']()
    ['match'](/\.([A-Za-z0-9]{1,10})$/);
  if (!_0x425e41) return '';
  const _0x4848a7 = _0x425e41[0x1]['toLowerCase']();
  return _0x4848a7 === 'jpeg' ? 'jpg' : _0x4848a7;
}
function resolveCustomProviderAssetResponseValue(_0x33b878, _0x2518d5) {
  const _0x251cbd = String(_0x2518d5 || '')['match'](/[^.\[\]]+|\[(\d+)\]/g) || [];
  let _0x4d73f1 = _0x33b878;
  for (const _0x1cf2bd of _0x251cbd) {
    const _0x3d8112 = _0x1cf2bd['startsWith']('[') ? _0x1cf2bd['slice'](0x1, -0x1) : _0x1cf2bd;
    if (
      !_0x4d73f1 ||
      typeof _0x4d73f1 !== 'object' ||
      !Object['prototype']['hasOwnProperty']['call'](_0x4d73f1, _0x3d8112)
    )
      return '';
    _0x4d73f1 = _0x4d73f1[_0x3d8112];
  }
  const _0x4142ab = String(_0x4d73f1 || '')['trim']();
  return /^https?:\/\//i['test'](_0x4142ab) ? _0x4142ab : '';
}
export function isCustomProviderAssetUploadProvider(_0x26b71b) {
  return normalizeUploadProvider(_0x26b71b) === 'customproviderasset';
}
export function isReusableCustomProviderAssetUrl(_0x57d050, _0x3cb2c9) {
  try {
    const _0x1791a3 = new URL(String(_0x57d050 || '')['trim']()),
      _0x3ce188 = new URL(String(_0x3cb2c9 || '')['trim']());
    return (
      _0x1791a3['origin'] === _0x3ce188['origin'] && /\/assets\/uploads\//i['test'](_0x1791a3['pathname'])
    );
  } catch {
    return ![];
  }
}
export async function uploadToCustomProviderAsset(_0x19412d, _0x542a3c, _0x102112 = {}) {
  if (!_0x19412d) throw new Error('中转站素材上传失败：文件不能为空');
  if (isConfiguredObjectStorageEnabled() && _0x102112['forceProviderUpload'] !== !![])
    return await uploadToConfiguredObjectStorage(_0x19412d, _0x102112);
  if (!_0x542a3c) throw new Error('中转站素材上传失败：API Key 未配置');
  const _0x291865 = resolveCustomProviderAssetOptions(_0x102112);
  if (_0x291865['maxBytes'] && Number(_0x19412d['size'] || 0x0) > _0x291865['maxBytes'])
    throw new Error(
      '中转站素材上传失败：文件超过 ' + Math['ceil'](_0x291865['maxBytes'] / (0x400 * 0x400)) + 'MB 限制',
    );
  const _0x3e5871 = getFilenameExtension(_0x291865['filename']),
    _0x54fdaa = getBlobFileExtension(_0x19412d, _0x3e5871 || 'bin');
  if (
    _0x291865['allowedExtensions']['length'] > 0x0 &&
    !_0x291865['allowedExtensions']['includes'](_0x54fdaa)
  )
    throw new Error('中转站素材上传失败：不支持 .' + _0x54fdaa + ' 格式');
  const _0x27a57a = _0x3e5871 === _0x54fdaa ? _0x291865['filename'] : 'asset.' + _0x54fdaa,
    _0x626ffa = new FormData();
  _0x626ffa['append'](_0x291865['multipartField'], _0x19412d, _0x27a57a);
  for (const [_0x428d19, _0x2d3f7c] of Object['entries'](_0x291865['formFields'])) {
    _0x626ffa['append'](_0x428d19, _0x2d3f7c);
  }
  const _0x3777d5 = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(_0x291865['apiUrl']),
    _0x5c711a = await post(_0x3777d5, _0x626ffa, {
      headers: { Authorization: 'Bearer ' + _0x542a3c },
      provider: 'custom-provider-asset',
      timeout:
        Number['isFinite'](_0x291865['timeout']) && _0x291865['timeout'] > 0x0
          ? Math['min'](0x5 * 0x3c * 0x3e8, Math['trunc'](_0x291865['timeout']))
          : 0xea60,
    }),
    _0x129b4c = resolveCustomProviderAssetResponseValue(_0x5c711a, _0x291865['responsePath']);
  if (!_0x129b4c) throw new Error('中转站素材上传失败：未返回可用 URL');
  return _0x129b4c;
}
