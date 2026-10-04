import { post } from './requester.js';
import { isConfiguredObjectStorageEnabled, uploadToConfiguredObjectStorage } from './objectStorageApi.js';
const CUSTOM_PROVIDER_ASSET_MAX_BYTES = 0x64 * 0x400 * 0x400;
function normalizeUploadProvider(value) {
  return String(value || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/[\s_-]+/g, '');
}
function normalizeCustomProviderAssetExtensions(list) {
  if (!Array['isArray'](list)) return [];
  return [
    ...new Set(
      list['map']((item) =>
        String(item || '')
          ['trim']()
          ['toLowerCase']()
          ['replace'](/^\./, ''),
      )['filter']((key) => /^[a-z0-9]{1,10}$/['test'](key)),
    ),
  ]['slice'](0x0, 0x10);
}
function resolveCustomProviderAssetOptions(options = {}) {
  const apiUrl = String(options['apiUrl'] || '')['trim']();
  if (!/^https?:\/\//i['test'](apiUrl)) throw new Error('中转站素材上传缺少安全的上传地址');
  const multipartField = String(options['multipartField'] || 'file')['trim']();
  if (!/^[A-Za-z_][A-Za-z0-9_-]{0,63}$/['test'](multipartField)) throw new Error('中转站素材上传字段无效');
  const responsePath = String(options['responsePath'] || 'url')['trim']();
  if (!/^[A-Za-z0-9_.\[\]-]{1,160}$/['test'](responsePath)) throw new Error('中转站素材上传返回路径无效');
  const count = Number(options['maxBytes']);
  return {
    apiUrl: apiUrl,
    multipartField: multipartField,
    responsePath: responsePath,
    formFields: Object['fromEntries'](
      Object['entries'](options['formFields'] || {})['filter'](
        ([index, list2]) =>
          ['model', 'purpose']['includes'](index) &&
          typeof list2 === 'string' &&
          list2['length'] > 0x0 &&
          list2['length'] <= 0xc0,
      ),
    ),
    allowedExtensions: normalizeCustomProviderAssetExtensions(options['allowedExtensions']),
    maxBytes:
      Number['isFinite'](count) && count > 0x0
        ? Math['min'](CUSTOM_PROVIDER_ASSET_MAX_BYTES, Math['trunc'](count))
        : 0x0,
    filename: String(options['filename'] || '')['trim'](),
    timeout: Number(options['uploadTimeout'] || options['timeout'] || 0xea60),
  };
}
function getBlobFileExtension(error, result = 'bin') {
  const data = String(error?.['name'] || '')['trim'](),
    target = data['match'](/\.([A-Za-z0-9]{1,10})$/);
  if (target) {
    const source = target[0x1]['toLowerCase']();
    return source === 'jpeg' ? 'jpg' : source;
  }
  const next = String(error?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    current = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-wav': 'wav',
      'video/mp4': 'mp4',
    }[next];
  return current || result;
}
function getFilenameExtension(entry) {
  const enabled = String(entry || '')
    ['trim']()
    ['match'](/\.([A-Za-z0-9]{1,10})$/);
  if (!enabled) return '';
  const record = enabled[0x1]['toLowerCase']();
  return record === 'jpeg' ? 'jpg' : record;
}
function resolveCustomProviderAssetResponseValue(payload, handle) {
  const state = String(handle || '')['match'](/[^.\[\]]+|\[(\d+)\]/g) || [];
  let enabled2 = payload;
  for (const list3 of state) {
    const config = list3['startsWith']('[') ? list3['slice'](0x1, -0x1) : list3;
    if (
      !enabled2 ||
      typeof enabled2 !== 'object' ||
      !Object['prototype']['hasOwnProperty']['call'](enabled2, config)
    )
      return '';
    enabled2 = enabled2[config];
  }
  const scope = String(enabled2 || '')['trim']();
  return /^https?:\/\//i['test'](scope) ? scope : '';
}
export function isCustomProviderAssetUploadProvider(input) {
  return normalizeUploadProvider(input) === 'customproviderasset';
}
export function isReusableCustomProviderAssetUrl(output, value2) {
  try {
    const uRL = new URL(String(output || '')['trim']()),
      uRL2 = new URL(String(value2 || '')['trim']());
    return uRL['origin'] === uRL2['origin'] && /\/assets\/uploads\//i['test'](uRL['pathname']);
  } catch {
    return ![];
  }
}
export async function uploadToCustomProviderAsset(enabled3, enabled4, value3 = {}) {
  if (!enabled3) throw new Error('中转站素材上传失败：文件不能为空');
  if (isConfiguredObjectStorageEnabled() && value3['forceProviderUpload'] !== !![])
    return await uploadToConfiguredObjectStorage(enabled3, value3);
  if (!enabled4) throw new Error('中转站素材上传失败：API Key 未配置');
  const customProviderAssetOptions = resolveCustomProviderAssetOptions(value3);
  if (
    customProviderAssetOptions['maxBytes'] &&
    Number(enabled3['size'] || 0x0) > customProviderAssetOptions['maxBytes']
  )
    throw new Error(
      '中转站素材上传失败：文件超过 ' +
        Math['ceil'](customProviderAssetOptions['maxBytes'] / (0x400 * 0x400)) +
        'MB 限制',
    );
  const filenameExtension = getFilenameExtension(customProviderAssetOptions['filename']),
    blobFileExtension = getBlobFileExtension(enabled3, filenameExtension || 'bin');
  if (
    customProviderAssetOptions['allowedExtensions']['length'] > 0x0 &&
    !customProviderAssetOptions['allowedExtensions']['includes'](blobFileExtension)
  )
    throw new Error('中转站素材上传失败：不支持 .' + blobFileExtension + ' 格式');
  const value4 =
      filenameExtension === blobFileExtension
        ? customProviderAssetOptions['filename']
        : 'asset.' + blobFileExtension,
    formData = new FormData();
  formData['append'](customProviderAssetOptions['multipartField'], enabled3, value4);
  for (const [value5, value6] of Object['entries'](customProviderAssetOptions['formFields'])) {
    formData['append'](value5, value6);
  }
  const value7 = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(customProviderAssetOptions['apiUrl']),
    post2 = await post(value7, formData, {
      headers: { Authorization: 'Bearer ' + enabled4 },
      provider: 'custom-provider-asset',
      timeout:
        Number['isFinite'](customProviderAssetOptions['timeout']) &&
        customProviderAssetOptions['timeout'] > 0x0
          ? Math['min'](0x5 * 0x3c * 0x3e8, Math['trunc'](customProviderAssetOptions['timeout']))
          : 0xea60,
    }),
    customProviderAssetResponseValue = resolveCustomProviderAssetResponseValue(
      post2,
      customProviderAssetOptions['responsePath'],
    );
  if (!customProviderAssetResponseValue) throw new Error('中转站素材上传失败：未返回可用 URL');
  return customProviderAssetResponseValue;
}
