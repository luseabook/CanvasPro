import { createRunningHubMediaUploadApiKeyMissingError } from './mediaUploadErrors.js';
import { getMediaKindLabel } from './mediaUploadErrorDetails.js';
import {
  isConfiguredObjectStorageEnabled,
  isConfiguredObjectStoragePublicUrl,
  OBJECT_STORAGE_UPLOAD_PROVIDER,
} from './objectStorageApi.js';
const USER_MEDIA_STORAGE_PROVIDERS = Object.freeze({
  FREE_IMAGE_HOST: 'freeImageHost',
  RUNNINGHUB: 'runninghub',
  OBJECT_STORAGE: OBJECT_STORAGE_UPLOAD_PROVIDER,
});
export const DEFAULT_MODEL_API_MEDIA_UPLOAD_PROVIDERS = Object.freeze({
  image: USER_MEDIA_STORAGE_PROVIDERS.FREE_IMAGE_HOST,
  video: USER_MEDIA_STORAGE_PROVIDERS.RUNNINGHUB,
  audio: USER_MEDIA_STORAGE_PROVIDERS.RUNNINGHUB,
});
function normalizeMediaUrl(value) {
  return String(value || '').trim();
}
function isPrivateIpv4Host(item) {
  const list = String(item || '')
    .split('.')
    .map((key) => Number(key));
  if (list.length !== 4 || list.some((index) => !Number.isInteger(index))) return false;
  const [count, count2] = list;
  return (
    count === 10 ||
    count === 0x7f ||
    (count === 172 && count2 >= 16 && count2 <= 0x1f) ||
    (count === 192 && count2 === 168) ||
    (count === 169 && count2 === 254) ||
    (count === 0 && count2 === 0)
  );
}
export function isPublicHttpMediaUrl(result) {
  const mediaUrl = normalizeMediaUrl(result);
  if (!mediaUrl) return false;
  try {
    const uRL = new URL(mediaUrl);
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return false;
    const data = uRL.hostname.toLowerCase();
    if (
      data === 'localhost' ||
      data === '0.0.0.0' ||
      data === '::1' ||
      data === '[::1]' ||
      data.endsWith('.local') ||
      isPrivateIpv4Host(data)
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
function isReusableProviderMediaUrl(options) {
  return /^asset:\/\//i.test(normalizeMediaUrl(options));
}
function isProviderUploadRequired(options2 = {}) {
  return (
    options2.forceProviderUpload === true || options2.uploadOptions?.forceProviderUpload === true
  );
}
export function isReusableModelApiMediaUrl(target) {
  return isPublicHttpMediaUrl(target) || isReusableProviderMediaUrl(target);
}
function shouldReuseMediaUrl(source, next, current = {}) {
  if (isReusableProviderMediaUrl(source)) return true;
  if (!isPublicHttpMediaUrl(source)) return false;
  if (!isProviderUploadRequired(current) && isConfiguredObjectStoragePublicUrl(source)) return true;
  if (next?.provider === USER_MEDIA_STORAGE_PROVIDERS.OBJECT_STORAGE) return false;
  if (typeof current.reusePublicUrls === 'boolean') return current.reusePublicUrls;
  return next?.provider === USER_MEDIA_STORAGE_PROVIDERS.RUNNINGHUB;
}
export function resolveUserMediaStorageUploadTarget(options3 = {}, args = {}, entry = '') {
  const isProviderUploadRequired2 = isProviderUploadRequired(args);
  if (isConfiguredObjectStorageEnabled() && !isProviderUploadRequired2)
    return { provider: USER_MEDIA_STORAGE_PROVIDERS.OBJECT_STORAGE };
  const mediaKind = String(entry || args.mediaKind || '')
      .trim()
      .toLowerCase(),
    handler = options3.resolveUserMediaStorageUploadTarget;
  if (!isProviderUploadRequired2 && typeof handler === 'function') {
    const args2 = handler({ ...args, ...(mediaKind ? { mediaKind: mediaKind } : {}) }),
      provider = String(args2?.provider || '').trim();
    if (provider) return { ...args2, provider: provider };
  }
  const provider2 =
    String(args.fallbackProvider || '').trim() ||
    DEFAULT_MODEL_API_MEDIA_UPLOAD_PROVIDERS[mediaKind] ||
    USER_MEDIA_STORAGE_PROVIDERS.RUNNINGHUB;
  return { provider: provider2 };
}
export function resolveRunningHubMediaUploadApiKey(options4 = {}, record = {}) {
  const payload = String(record.apiKey || '')
    .trim()
    .replace(/^Bearer\s+/i, '');
  if (payload) return payload;
  const handle = String(record.providerProfileId || 'runninghub').trim(),
    state =
      typeof options4.getProviderConfig === 'function' ? options4.getProviderConfig(handle) || {} : {};
  return String(state.modelApiKey || state.apiKey || '')
    .trim()
    .replace(/^Bearer\s+/i, '');
}
function resolveMediaProcessor(config, scope = {}) {
  if (config === 'image') return scope.processInputImages;
  if (config === 'video') return scope.processInputVideos;
  if (config === 'audio') return scope.processInputAudios;
  return null;
}
function assertMediaUploadAvailable(input, output, value2) {
  if (input === 'image' && typeof output.processInputImages !== 'function')
    throw new Error(value2 + '：缺少图片上传能力，无法准备参考图片，请更新应用后重试');
  if (input === 'video' && typeof output.processInputVideos !== 'function')
    throw new Error(value2 + '：缺少视频上传能力，无法准备参考视频，请更新应用后重试');
  if (input === 'audio' && typeof output.processInputAudios !== 'function')
    throw new Error(value2 + '：缺少音频上传能力，无法准备参考音频，请更新应用后重试');
}
async function uploadViaTarget(value3, value4, apiUrl, value5, strictUpload = {}) {
  const provider3 = String(apiUrl?.provider || '').trim();
  assertMediaUploadAvailable(value3, value5, provider3);
  const run = resolveMediaProcessor(value3, value5);
  let apiKey = String(apiUrl?.apiKey || strictUpload.apiKey || '').trim();
  if (provider3 === USER_MEDIA_STORAGE_PROVIDERS.RUNNINGHUB) {
    apiKey = resolveRunningHubMediaUploadApiKey(value5, { ...strictUpload, apiKey: apiKey });
    if (!apiKey) throw createRunningHubMediaUploadApiKeyMissingError(value3);
  }
  const value6 = {
    ...(strictUpload.uploadOptions || {}),
    ...(apiUrl?.uploadOptions || {}),
    provider: provider3,
    strictUpload: strictUpload.strictUpload !== false,
    ...(apiUrl?.apiUrl || strictUpload.apiUrl
      ? { apiUrl: apiUrl?.apiUrl || strictUpload.apiUrl }
      : {}),
  };
  return await run(value4, apiKey, value6);
}
export async function uploadModelApiMediaInputs(value7, list2, value8, value9 = {}) {
  const value10 = String(value7 || '')
    .trim()
    .toLowerCase();
  if (!['image', 'video', 'audio'].includes(value10))
    throw new Error('Unsupported media upload kind: ' + (value10 || value7));
  const list3 = Array.isArray(list2) ? list2.map(normalizeMediaUrl).filter(Boolean) : [];
  if (list3.length === 0) return [];
  const userMediaStorageUploadTarget = resolveUserMediaStorageUploadTarget(value8, value9, value10),
    list4 = new Array(list3.length).fill(''),
    list5 = [],
    list6 = [];
  list3.forEach((value11, value12) => {
    if (shouldReuseMediaUrl(value11, userMediaStorageUploadTarget, value9)) {
      list4[value12] = value11;
      return;
    }
    (list6.push(value12), list5.push(value11));
  });
  if (list5.length === 0) return list4.filter(Boolean);
  const uploadViaTarget2 = await uploadViaTarget(
    value10,
    list5,
    userMediaStorageUploadTarget,
    value8,
    value9,
  );
  list6.forEach((value13, value14) => {
    list4[value13] = String(uploadViaTarget2?.[value14] || '').trim();
  });
  const list7 = list4.filter(Boolean);
  if (value9.strictUpload !== false && list7.length !== list3.length) {
    const list8 = list4.flatMap((value15, value16) => (value15 ? [] : [value16 + 1]));
    throw new Error(
      userMediaStorageUploadTarget.provider +
        ' ' +
        getMediaKindLabel(value10) +
        '上传失败：第 ' +
        list8.join('、') +
        ' 项未返回有效地址，请重试或重新选择素材',
    );
  }
  return list7;
}
