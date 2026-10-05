import { compressImage } from '../src/modules/imageUtils.js';
import { getProviderConfig } from './configApi.js';
import { post, get } from './requester.js';
import { resolveImageInputUploadQualityOptions } from '../src/services/imageInputUploadQualityService.js';
import {
  convertImageBlobToPngBlob,
  resolveImageMimeType,
} from '../src/services/imagePngConversionService.js';
import { isApimartReusableUrl, uploadImageToApimart } from './apimartUploadApi.js';
import {
  isCustomProviderAssetUploadProvider,
  isReusableCustomProviderAssetUrl,
  uploadToCustomProviderAsset,
} from './customProviderAssetUploadApi.js';
import { uploadToFreeImageHost } from './freeImageHostApi.js';
import {
  isConfiguredObjectStorageEnabled,
  isConfiguredObjectStoragePublicUrl,
  OBJECT_STORAGE_UPLOAD_PROVIDER,
  uploadPublicMediaToConfiguredObjectStorage,
} from './objectStorageApi.js';
import {
  getRunningHubUploadErrorMessage,
  getRunningHubUploadUrl,
  hasRunningHubUploadFailureCode,
} from './runningHubUploadResponse.js';
function _createLimiter(value) {
  let item = 0;
  const list = [];
  return function run(key) {
    return new Promise((handler, handler2) => {
      const run2 = () => {
        (item++,
          Promise['resolve']()
            ['then'](key)
            ['then'](
              (index) => {
                item--;
                if (list['length'] && item < value) list['shift']()();
                handler(index);
              },
              (result) => {
                item--;
                if (list['length'] && item < value) list['shift']()();
                handler2(result);
              },
            ));
      };
      if (item < value) run2();
      else list['push'](run2);
    });
  };
}
const _runLimited = _createLimiter(3),
  _inflight = new Map(),
  DEFAULT_IMAGE_UPLOAD_RETRIES = 1,
  DEFAULT_IMAGE_UPLOAD_RETRY_DELAY_MS = 500,
  DEFAULT_IMAGE_UPLOAD_PROVIDER = 'freeImageHost';
function sleep(data) {
  const count = Number(data);
  return count > 0
    ? new Promise((options) => setTimeout(options, count))
    : Promise['resolve']();
}
function normalizeRetryCount(target, source = DEFAULT_IMAGE_UPLOAD_RETRIES) {
  const count2 = Number(target);
  return Number['isFinite'](count2) && count2 >= 0
    ? Math['min'](5, Math['trunc'](count2))
    : source;
}
function normalizeDelayMs(next, current = DEFAULT_IMAGE_UPLOAD_RETRY_DELAY_MS) {
  const count3 = Number(next);
  return Number['isFinite'](count3) && count3 >= 0 ? Math['trunc'](count3) : current;
}
function getErrorStatus(response) {
  const entry = response?.['status'] ?? response?.['statusCode'] ?? response?.['httpStatus'],
    record = Number(entry);
  return Number['isFinite'](record) ? record : 0;
}
function isMissingUploadUrlError(error) {
  const payload = String(error?.['message'] || error || '');
  return (
    /未返回可用.*(?:URL|链接)/i['test'](payload) ||
    /(?:URL|链接).*(?:为空|缺失)/i['test'](payload) ||
    /返回格式异常/i['test'](payload) ||
    /(?:empty|missing).*(?:url|link)/i['test'](payload)
  );
}
function isRetryableImageUploadError(handle) {
  if (handle?.['retryable'] === true || isMissingUploadUrlError(handle)) return true;
  const errorStatus = getErrorStatus(handle);
  return errorStatus === 408 || errorStatus === 425 || errorStatus === 429 || errorStatus >= 500;
}
function _buildKey(state, config, scope) {
  const {
      compress: compress = true,
      maxDim: maxDim = 2048,
      quality: quality = 0.9,
      provider: provider = DEFAULT_IMAGE_UPLOAD_PROVIDER,
      preferFree: preferFree = false,
      apiUrl: apiUrl = '',
      multipartField: multipartField = '',
      responsePath: responsePath = '',
      uploadRetries: uploadRetries = DEFAULT_IMAGE_UPLOAD_RETRIES,
      retryDelayMs: retryDelayMs = DEFAULT_IMAGE_UPLOAD_RETRY_DELAY_MS,
    } = scope || {},
    input = Math['round'](quality * 1000),
    output = config ? 1 : 0,
    value2 = compress ? 1 : 0,
    value3 = preferFree ? 1 : 0,
    enabled = scope?.['forceProviderUpload'] === true ? 1 : 0,
    isConfiguredObjectStorageEnabled2 = isConfiguredObjectStorageEnabled() && !enabled ? 1 : 0;
  return [
    state,
    provider,
    value2,
    maxDim,
    input,
    output,
    value3,
    isConfiguredObjectStorageEnabled2,
    enabled,
    apiUrl,
    multipartField,
    responsePath,
    normalizeRetryCount(uploadRetries),
    normalizeDelayMs(retryDelayMs),
  ]['join']('|');
}
function _getUploadPromise(value4, value5, value6) {
  const _buildKey2 = _buildKey(value4, value5, value6);
  let promise = _inflight['get'](_buildKey2);
  return (
    !promise &&
      ((promise = _runLimited(() => _processSingle(value4, value5, value6))),
      _inflight['set'](_buildKey2, promise),
      promise['finally'](() => {
        _inflight['delete'](_buildKey2);
      })['catch'](() => {})),
    promise
  );
}
function isReusableRunningHubUrl(value7, value8 = '') {
  try {
    const uRL = new URL(String(value7 || '')['trim']())['hostname'],
      uRL2 = new URL(String(value8 || 'https://www.runninghub.cn')['trim']())['hostname'];
    return uRL === uRL2;
  } catch {
    return false;
  }
}
function isProviderAssetIdentifier(value9) {
  return /^asset:\/\//i['test'](String(value9 || '')['trim']());
}
function guessImageExtension(value10, value11 = 'png') {
  try {
    const uRL3 = new URL(String(value10 || '')['trim'](), 'https://local.invalid'),
      list2 =
        String(uRL3['pathname'] || '')
          ['split']('/')
          ['pop']() || '',
      value12 = list2['includes']('.') ? list2['split']('.')['pop']()['toLowerCase']() : '';
    if (/^(?:jpe?g|png|webp)$/['test'](value12)) return value12 === 'jpeg' ? 'jpg' : value12;
  } catch {}
  return value11;
}
function normalizeImageExtension(value13) {
  const value14 = String(value13 || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/^\./, '');
  return value14 === 'jpeg' ? 'jpg' : value14;
}
function resolveImageExtension(value15, value16) {
  const imageMimeType = resolveImageMimeType(value15, value16);
  return (
    {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/x-ms-bmp': 'bmp',
      'image/avif': 'avif',
      'image/svg+xml': 'svg',
    }[imageMimeType] || ''
  );
}
async function normalizeCustomProviderImageBlob(value17, value18, value19 = {}) {
  if (!isCustomProviderAssetUploadProvider(value19['provider'])) return value17;
  const map = new Set(
    (Array['isArray'](value19['allowedExtensions']) ? value19['allowedExtensions'] : [])
      ['map'](normalizeImageExtension)
      ['filter'](Boolean),
  );
  if (!map['size'] || !map['has']('png')) return value17;
  const imageExtension = resolveImageExtension(value17, value18);
  if (!imageExtension || map['has'](imageExtension)) return value17;
  const pngBlob = await convertImageBlobToPngBlob(value17);
  if (!pngBlob) throw new Error('中转站素材上传失败：无法将 .' + imageExtension + ' 图片转换为支持的 PNG 格式');
  return pngBlob;
}
async function _processSingle(value20, apiKey, fileName) {
  const {
    compress: compress = true,
    maxDim: maxDim = 2048,
    quality: quality = 0.9,
    provider: provider = DEFAULT_IMAGE_UPLOAD_PROVIDER,
    fallbackCompressOnError: fallbackCompressOnError = false,
    fallbackMaxDim: fallbackMaxDim = 2048,
    fallbackQuality: fallbackQuality = 0.9,
  } = fileName || {};
  if (isProviderAssetIdentifier(value20)) return value20;
  const enabled2 = fileName?.['forceProviderUpload'] === true;
  if (!enabled2 && isConfiguredObjectStoragePublicUrl(value20)) return value20;
  const isConfiguredObjectStorageEnabled3 = isConfiguredObjectStorageEnabled() && !enabled2;
  if (!isConfiguredObjectStorageEnabled3 && provider === 'runninghub' && isReusableRunningHubUrl(value20, fileName?.['apiUrl']))
    return value20;
  if (!isConfiguredObjectStorageEnabled3 && provider === 'apimart' && isApimartReusableUrl(value20)) return value20;
  const run3 = async (value21) => {
      if (isConfiguredObjectStorageEnabled3 || provider === OBJECT_STORAGE_UPLOAD_PROVIDER)
        return await uploadPublicMediaToConfiguredObjectStorage('image', value21, {
          ...(fileName || {}),
          fileName: fileName?.['filename'] || fileName?.['fileName'] || 'image.png',
        });
      if (provider === 'runninghub') return await uploadToRunningHub(value21, apiKey, fileName || {});
      if (isCustomProviderAssetUploadProvider(provider)) {
        const customProviderImageBlob = await normalizeCustomProviderImageBlob(value21, value20, fileName);
        return await uploadToCustomProviderAsset(customProviderImageBlob, apiKey, {
          ...(fileName || {}),
          filename: fileName?.['filename'] || 'image.' + guessImageExtension(value20),
        });
      }
      if (provider === 'apimart')
        return await uploadImageToApimart(value21, { ...(fileName || {}), apiKey: apiKey });
      if (provider === 'grsai')
        return await uploadImageToBed(value21, apiKey, { ...(fileName || {}), preferFree: false });
      if (isFreeImageHostProvider(provider))
        return await uploadImageToBed(value21, '', { ...(fileName || {}), preferFree: true });
      return await uploadImageToBed(value21, '', { ...(fileName || {}), preferFree: true });
    },
    handler3 = async (value22) => {
      const retryCount = normalizeRetryCount(fileName?.['uploadRetries']),
        delayMs = normalizeDelayMs(fileName?.['retryDelayMs']);
      for (let value23 = 0; ; value23++) {
        try {
          const enabled3 = String((await run3(value22)) || '')['trim']();
          if (!enabled3) {
            const error2 = new Error(provider + ' 图片上传失败: 未返回可用文件 URL，请重试');
            error2['retryable'] = true;
            throw error2;
          }
          return enabled3;
        } catch (value24) {
          if (value23 >= retryCount || !isRetryableImageUploadError(value24)) throw value24;
          await sleep(delayMs * (value23 + 1));
        }
      }
    };
  if (compress) {
    let compressImage2;
    try {
      compressImage2 = await compressImage(value20, maxDim, quality);
    } catch (value25) {
      compressImage2 = await get(value20, { provider: 'remote', buildUrl: false, responseType: 'blob' });
    }
    return await handler3(compressImage2);
  }
  if (fallbackCompressOnError)
    try {
      const get2 = await get(value20, { provider: 'remote', buildUrl: false, responseType: 'blob' });
      return await handler3(get2);
    } catch (value26) {
      const compressImage3 = await compressImage(value20, fallbackMaxDim, fallbackQuality);
      return await handler3(compressImage3);
    }
  const get3 = await get(value20, { provider: 'remote', buildUrl: false, responseType: 'blob' });
  return await handler3(get3);
}
async function uploadToTelegraph(value27) {
  const formData = new FormData();
  formData['append']('file', value27, 'image.png');
  const value28 = 'https://telegra.ph/upload',
    value29 = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(value28),
    post2 = await post(value29, formData, { provider: 'telegraph' });
  if (Array['isArray'](post2) && post2[0]?.['src'])
    return 'https://telegra.ph' + post2[0]['src'];
  throw new Error('Telegraph 返回格式异常');
}
function isFreeImageHostProvider(value30) {
  const value31 = String(value30 || '')['trim'](),
    value32 = value31['toLowerCase']()['replace'](/[\s_-]+/g, '');
  return value31 === '免费图床' || value32 === 'freeimagehost';
}
async function uploadToQiniu(value33, value34) {
  const headers = { 'Content-Type': 'application/json' };
  if (value34) headers['Authorization'] = 'Bearer ' + value34;
  const post3 = await post(
    getProviderConfig('grsai')['apiUrl']['replace'](/\/v1\/?$/i, '') + '/client/resource/newUploadTokenZH',
    { sux: 'png' },
    { provider: 'grsai', buildUrl: false, headers: headers },
  );
  if (!post3['data']) throw new Error('GRSAI 返回了无效的上传凭证');
  const { token: token, key: key2, url: url, domain: domain } = post3['data'],
    formData2 = new FormData();
  return (
    formData2['append']('token', token),
    formData2['append']('key', key2),
    formData2['append']('file', value33, 'image.png'),
    await post(url, formData2, { provider: 'qiniu', buildUrl: false }),
    domain + '/' + key2
  );
}
export async function uploadImageToBed(value35, value36, value37 = {}) {
  const { preferFree: preferFree = false } = value37;
  if (isConfiguredObjectStorageEnabled())
    return await uploadPublicMediaToConfiguredObjectStorage('image', value35, value37);
  if (!preferFree && value36)
    try {
      return await uploadToQiniu(value35, value36);
    } catch {
      return await uploadToTelegraph(value35);
    }
  try {
    return await uploadToFreeImageHost(value35, value37);
  } catch (error3) {
    try {
      return await uploadToTelegraph(value35);
    } catch (error4) {
      throw new Error(
        '免费图床上传失败：' + (error4?.['message'] || error3?.['message'] || '未知错误'),
      );
    }
  }
}
export async function uploadToRunningHub(value38, enabled4, value39 = {}) {
  if (isConfiguredObjectStorageEnabled())
    return await uploadPublicMediaToConfiguredObjectStorage('image', value38, value39);
  if (!enabled4) throw new Error('RunningHUB API Key 未配置，无法上传图片');
  const value40 = String(value39?.['apiUrl'] || 'https://www.runninghub.cn')
      ['trim']()
      ['replace'](/\/+$/, ''),
    value41 = value40 + '/openapi/v2/media/upload/binary',
    value42 = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(value41),
    formData3 = new FormData();
  formData3['append']('file', value38, 'image.png');
  const post4 = await post(value42, formData3, {
    headers: { Authorization: 'Bearer ' + enabled4 },
    provider: 'runninghub',
  });
  if (hasRunningHubUploadFailureCode(post4))
    throw new Error('RunningHUB 上传失败: ' + getRunningHubUploadErrorMessage(post4));
  const runningHubUploadUrl = getRunningHubUploadUrl(post4);
  if (!runningHubUploadUrl) throw new Error('RunningHUB 上传失败: 未返回可用文件 URL，请重试');
  return runningHubUploadUrl;
}
async function _processInputImagesOrdered(list3, value43, value44 = {}) {
  const args =
      value44?.['applyInputQualityProfile'] === true
        ? resolveImageInputUploadQualityOptions(value44)
        : value44 || {},
    {
      compress: compress = true,
      maxDim: maxDim = 2048,
      quality: quality = 0.9,
      provider: provider = DEFAULT_IMAGE_UPLOAD_PROVIDER,
    } = args;
  if (!list3 || list3['length'] === 0) return [];
  const value45 = {
      ...args,
      compress: compress,
      maxDim: maxDim,
      quality: quality,
      provider: provider,
    },
    value46 = value45['strictUpload'] === true,
    enabled5 = value45['forceProviderUpload'] === true,
    isConfiguredObjectStorageEnabled4 = isConfiguredObjectStorageEnabled() && !enabled5,
    value47 = new Array(list3['length'])['fill'](''),
    list4 = [];
  for (let value48 = 0; value48 < list3['length']; value48++) {
    const enabled6 = String(list3[value48] || '')['trim']();
    if (!enabled6) continue;
    if (isProviderAssetIdentifier(enabled6)) {
      value47[value48] = enabled6;
      continue;
    }
    if (!enabled5 && isConfiguredObjectStoragePublicUrl(enabled6)) {
      value47[value48] = enabled6;
      continue;
    }
    if (!isConfiguredObjectStorageEnabled4 && provider === 'runninghub' && isReusableRunningHubUrl(enabled6, value45['apiUrl'])) {
      value47[value48] = enabled6;
      continue;
    }
    if (!isConfiguredObjectStorageEnabled4 && provider === 'apimart' && isApimartReusableUrl(enabled6)) {
      value47[value48] = enabled6;
      continue;
    }
    if (
      !isConfiguredObjectStorageEnabled4 &&
      isCustomProviderAssetUploadProvider(provider) &&
      isReusableCustomProviderAssetUrl(enabled6, value45['apiUrl'])
    ) {
      value47[value48] = enabled6;
      continue;
    }
    const promise2 = _getUploadPromise(enabled6, value43, value45),
      promise3 = promise2['then']((value49) => {
        value47[value48] = String(value49 || '')['trim']();
      });
    list4['push'](
      value46
        ? promise3
        : promise3['catch'](() => {
            value47[value48] = '';
          }),
    );
  }
  if (list4['length'] > 0) {
    if (value46) await Promise['all'](list4);
    else await Promise['allSettled'](list4);
  }
  return value47;
}
export async function processInputImages(value50, value51, strictUpload = {}) {
  const list5 = await _processInputImagesOrdered(value50, value51, {
    ...strictUpload,
    strictUpload: strictUpload['strictUpload'] !== false,
  });
  return list5['filter'](Boolean);
}
export async function processInputImagesPreserveOrder(value52, value53, value54 = {}) {
  return await _processInputImagesOrdered(value52, value53, value54);
}
