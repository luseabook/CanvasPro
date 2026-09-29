import { getObjectStorageConfig } from './configApi.js';
import { OBJECT_STORAGE_KEY_PREFIX, resolveObjectStorageConfig } from './objectStorageProfiles.js';
import { post } from './requester.js';
export const OBJECT_STORAGE_UPLOAD_PATH = '/api/v2/object-storage/upload';
export const OBJECT_STORAGE_TEST_PATH = '/api/v2/object-storage/test';
export const OBJECT_STORAGE_UPLOAD_PROVIDER = 'object-storage';
export { OBJECT_STORAGE_KEY_PREFIX };
export const DEFAULT_OBJECT_STORAGE_CONFIG = Object['freeze'](resolveObjectStorageConfig({}));
const OBJECT_STORAGE_MEDIA_DEFAULTS = Object['freeze']({
  image: Object['freeze']({ fileName: 'image.png', timeout: 0x2bf20 }),
  video: Object['freeze']({ fileName: 'video.mp4', timeout: 0x927c0 }),
  audio: Object['freeze']({ fileName: 'audio.mp3', timeout: 0x493e0 }),
});
export function normalizeObjectStorageConfig(_0x1398af = {}) {
  return resolveObjectStorageConfig(_0x1398af);
}
function assertHttpUrl(_0x2f06a4, _0x1e5a73) {
  try {
    const _0x18babc = new URL(String(_0x2f06a4 || ''));
    if (_0x18babc['protocol'] !== 'http:' && _0x18babc['protocol'] !== 'https:') throw new Error();
  } catch {
    throw new Error(_0x1e5a73 + '格式无效');
  }
}
export function validateObjectStorageConfig(_0x1d6570 = {}, { requireEnabled: requireEnabled = !![] } = {}) {
  const _0x3924f0 = normalizeObjectStorageConfig(_0x1d6570);
  if (requireEnabled && !_0x3924f0['enabled']) throw new Error('请先启用自定义对象存储');
  if (['tencent-cos', 'aliyun-oss']['includes'](_0x3924f0['providerId']) && !_0x3924f0['location'])
    throw new Error('请填写 Region');
  (assertHttpUrl(_0x3924f0['endpoint'], 'S3 API（Endpoint）'),
    assertHttpUrl(_0x3924f0['publicBaseUrl'], '公开访问地址'));
  if (!_0x3924f0['bucket']) throw new Error('请填写存储桶（Bucket）');
  if (_0x3924f0['providerId'] === 'tencent-cos' && !/-\d+$/['test'](_0x3924f0['bucket']))
    throw new Error('腾讯云 COS 的存储桶名称需要包含 APPID');
  if (!_0x3924f0['region']) throw new Error('请填写 Region');
  if (!_0x3924f0['accessKeyId']) throw new Error('请填写访问密钥 ID（Access Key ID）');
  if (!_0x3924f0['secretAccessKey']) throw new Error('请填写秘密访问密钥（Secret Access Key）');
  return _0x3924f0;
}
export function isConfiguredObjectStorageEnabled() {
  return normalizeObjectStorageConfig(getObjectStorageConfig())['enabled'] === !![];
}
export function isConfiguredObjectStoragePublicUrl(_0x219be5, _0x52cdf4 = getObjectStorageConfig()) {
  const _0x3a6e1c = normalizeObjectStorageConfig(_0x52cdf4);
  if (!_0x3a6e1c['enabled'] || !_0x3a6e1c['publicBaseUrl']) return ![];
  try {
    const _0x56a3b8 = new URL(String(_0x219be5 || '')['trim']()),
      _0x250084 = new URL(_0x3a6e1c['publicBaseUrl']);
    if (
      !['http:', 'https:']['includes'](_0x56a3b8['protocol']) ||
      _0x56a3b8['origin'] !== _0x250084['origin']
    )
      return ![];
    const _0x4b6917 = _0x250084['pathname']['replace'](/\/+$/, '');
    if (!_0x4b6917 || _0x4b6917 === '/') return _0x56a3b8['pathname']['startsWith']('/');
    return _0x56a3b8['pathname'] === _0x4b6917 || _0x56a3b8['pathname']['startsWith'](_0x4b6917 + '/');
  } catch {
    return ![];
  }
}
function inferObjectStorageMediaKind(_0x54cbcd, _0x1e264e = {}) {
  const _0x464ee7 = String(_0x1e264e['mediaKind'] || _0x1e264e['kind'] || '')
    ['trim']()
    ['toLowerCase']();
  if (OBJECT_STORAGE_MEDIA_DEFAULTS[_0x464ee7]) return _0x464ee7;
  if (_0x464ee7) throw new Error('对象存储上传失败：不支持 ' + _0x464ee7 + ' 媒体类型');
  const _0x5256a8 = String(_0x54cbcd?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x534060 = _0x5256a8['split']('/', 0x1)[0x0];
  return OBJECT_STORAGE_MEDIA_DEFAULTS[_0x534060] ? _0x534060 : 'image';
}
function resolveUploadFileName(_0xb1f2d9, _0x4372d0, _0x976b97 = {}) {
  const _0x2b7628 =
      OBJECT_STORAGE_MEDIA_DEFAULTS[_0x4372d0]?.['fileName'] ||
      OBJECT_STORAGE_MEDIA_DEFAULTS['image']['fileName'],
    _0x4f06f3 = String(_0x976b97['fileName'] || _0x976b97['filename'] || _0xb1f2d9?.['name'] || _0x2b7628)[
      'trim'
    ]();
  return _0x4f06f3 || _0x2b7628;
}
export async function uploadToConfiguredObjectStorage(_0x491eae, _0x4f55be = {}) {
  if (!_0x491eae) throw new Error('对象存储上传失败：文件不能为空');
  const _0x45a0d1 = inferObjectStorageMediaKind(_0x491eae, _0x4f55be),
    _0x1b533f = validateObjectStorageConfig(_0x4f55be['config'] || getObjectStorageConfig()),
    _0x15d265 = new FormData();
  (_0x15d265['append']('config', JSON['stringify'](_0x1b533f)),
    _0x15d265['append']('mediaKind', _0x45a0d1),
    _0x15d265['append']('file', _0x491eae, resolveUploadFileName(_0x491eae, _0x45a0d1, _0x4f55be)));
  const _0x47d68a = await post(OBJECT_STORAGE_UPLOAD_PATH, _0x15d265, {
      provider: OBJECT_STORAGE_UPLOAD_PROVIDER,
      timeout: Number(_0x4f55be['timeout'] || OBJECT_STORAGE_MEDIA_DEFAULTS[_0x45a0d1]['timeout']),
      responseType: 'auto',
    }),
    _0x190846 = String(_0x47d68a?.['url'] || '')['trim']();
  if (!_0x190846) throw new Error('对象存储上传失败：未返回可用 URL');
  return _0x190846;
}
export async function uploadPublicMediaToConfiguredObjectStorage(_0x3e1ff5, _0x1a4f78, _0x2a3aa2 = {}) {
  return await uploadToConfiguredObjectStorage(_0x1a4f78, { ..._0x2a3aa2, mediaKind: _0x3e1ff5 });
}
export async function testObjectStorageConnection(_0x1d78f1 = {}) {
  const _0x308c13 = validateObjectStorageConfig(_0x1d78f1, { requireEnabled: ![] }),
    _0x3e058b = await post(
      OBJECT_STORAGE_TEST_PATH,
      { config: _0x308c13 },
      { provider: OBJECT_STORAGE_UPLOAD_PROVIDER, timeout: 0x1d4c0, responseType: 'auto' },
    );
  if (_0x3e058b?.['success'] !== !![]) throw new Error(_0x3e058b?.['error'] || '对象存储连接测试失败');
  return _0x3e058b;
}
