import { getObjectStorageConfig } from './configApi.js';
import { OBJECT_STORAGE_KEY_PREFIX, resolveObjectStorageConfig } from './objectStorageProfiles.js';
import { post } from './requester.js';
export const OBJECT_STORAGE_UPLOAD_PATH = '/api/v2/object-storage/upload';
export const OBJECT_STORAGE_TEST_PATH = '/api/v2/object-storage/test';
export const OBJECT_STORAGE_UPLOAD_PROVIDER = 'object-storage';
export { OBJECT_STORAGE_KEY_PREFIX };
export const DEFAULT_OBJECT_STORAGE_CONFIG = Object['freeze'](resolveObjectStorageConfig({}));
const OBJECT_STORAGE_MEDIA_DEFAULTS = Object['freeze']({
  image: Object['freeze']({ fileName: 'image.png', timeout: 180000 }),
  video: Object['freeze']({ fileName: 'video.mp4', timeout: 600000 }),
  audio: Object['freeze']({ fileName: 'audio.mp3', timeout: 300000 }),
});
export function normalizeObjectStorageConfig(options = {}) {
  return resolveObjectStorageConfig(options);
}
function assertHttpUrl(value, item) {
  try {
    const uRL = new URL(String(value || ''));
    if (uRL['protocol'] !== 'http:' && uRL['protocol'] !== 'https:') throw new Error();
  } catch {
    throw new Error(item + '格式无效');
  }
}
export function validateObjectStorageConfig(options2 = {}, { requireEnabled: requireEnabled = true } = {}) {
  const objectStorageConfig = normalizeObjectStorageConfig(options2);
  if (requireEnabled && !objectStorageConfig['enabled']) throw new Error('请先启用自定义对象存储');
  if (
    ['tencent-cos', 'aliyun-oss']['includes'](objectStorageConfig['providerId']) &&
    !objectStorageConfig['location']
  )
    throw new Error('请填写 Region');
  (assertHttpUrl(objectStorageConfig['endpoint'], 'S3 API（Endpoint）'),
    assertHttpUrl(objectStorageConfig['publicBaseUrl'], '公开访问地址'));
  if (!objectStorageConfig['bucket']) throw new Error('请填写存储桶（Bucket）');
  if (objectStorageConfig['providerId'] === 'tencent-cos' && !/-\d+$/['test'](objectStorageConfig['bucket']))
    throw new Error('腾讯云 COS 的存储桶名称需要包含 APPID');
  if (!objectStorageConfig['region']) throw new Error('请填写 Region');
  if (!objectStorageConfig['accessKeyId']) throw new Error('请填写访问密钥 ID（Access Key ID）');
  if (!objectStorageConfig['secretAccessKey']) throw new Error('请填写秘密访问密钥（Secret Access Key）');
  return objectStorageConfig;
}
export function isConfiguredObjectStorageEnabled() {
  return normalizeObjectStorageConfig(getObjectStorageConfig())['enabled'] === true;
}
export function isConfiguredObjectStoragePublicUrl(key, objectStorageConfig2 = getObjectStorageConfig()) {
  const objectStorageConfig3 = normalizeObjectStorageConfig(objectStorageConfig2);
  if (!objectStorageConfig3['enabled'] || !objectStorageConfig3['publicBaseUrl']) return false;
  try {
    const uRL2 = new URL(String(key || '')['trim']()),
      uRL3 = new URL(objectStorageConfig3['publicBaseUrl']);
    if (!['http:', 'https:']['includes'](uRL2['protocol']) || uRL2['origin'] !== uRL3['origin']) return false;
    const enabled = uRL3['pathname']['replace'](/\/+$/, '');
    if (!enabled || enabled === '/') return uRL2['pathname']['startsWith']('/');
    return uRL2['pathname'] === enabled || uRL2['pathname']['startsWith'](enabled + '/');
  } catch {
    return false;
  }
}
function inferObjectStorageMediaKind(index, result = {}) {
  const data = String(result['mediaKind'] || result['kind'] || '')
    ['trim']()
    ['toLowerCase']();
  if (OBJECT_STORAGE_MEDIA_DEFAULTS[data]) return data;
  if (data) throw new Error('对象存储上传失败：不支持 ' + data + ' 媒体类型');
  const target = String(index?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    source = target['split']('/', 1)[0];
  return OBJECT_STORAGE_MEDIA_DEFAULTS[source] ? source : 'image';
}
function resolveUploadFileName(error, next, current = {}) {
  const entry =
      OBJECT_STORAGE_MEDIA_DEFAULTS[next]?.['fileName'] || OBJECT_STORAGE_MEDIA_DEFAULTS['image']['fileName'],
    record = String(current['fileName'] || current['filename'] || error?.['name'] || entry)['trim']();
  return record || entry;
}
export async function uploadToConfiguredObjectStorage(enabled2, payload = {}) {
  if (!enabled2) throw new Error('对象存储上传失败：文件不能为空');
  const inferObjectStorageMediaKind2 = inferObjectStorageMediaKind(enabled2, payload),
    validateObjectStorageConfig2 = validateObjectStorageConfig(payload['config'] || getObjectStorageConfig()),
    formData = new FormData();
  (formData['append']('config', JSON['stringify'](validateObjectStorageConfig2)),
    formData['append']('mediaKind', inferObjectStorageMediaKind2),
    formData['append'](
      'file',
      enabled2,
      resolveUploadFileName(enabled2, inferObjectStorageMediaKind2, payload),
    ));
  const response = await post(OBJECT_STORAGE_UPLOAD_PATH, formData, {
      provider: OBJECT_STORAGE_UPLOAD_PROVIDER,
      timeout: Number(
        payload['timeout'] || OBJECT_STORAGE_MEDIA_DEFAULTS[inferObjectStorageMediaKind2]['timeout'],
      ),
      responseType: 'auto',
    }),
    enabled3 = String(response?.['url'] || '')['trim']();
  if (!enabled3) throw new Error('对象存储上传失败：未返回可用 URL');
  return enabled3;
}
export async function uploadPublicMediaToConfiguredObjectStorage(mediaKind, handle, args = {}) {
  return await uploadToConfiguredObjectStorage(handle, { ...args, mediaKind: mediaKind });
}
export async function testObjectStorageConnection(options3 = {}) {
  const config = validateObjectStorageConfig(options3, { requireEnabled: false }),
    response2 = await post(
      OBJECT_STORAGE_TEST_PATH,
      { config: config },
      { provider: OBJECT_STORAGE_UPLOAD_PROVIDER, timeout: 120000, responseType: 'auto' },
    );
  if (response2?.['success'] !== true) throw new Error(response2?.['error'] || '对象存储连接测试失败');
  return response2;
}
