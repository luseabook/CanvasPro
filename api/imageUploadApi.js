import { compressImage } from '../src/modules/imageUtils.js';
import { post, get } from './requester.js';
import { resolveImageInputUploadQualityOptions } from '../src/services/imageInputUploadQualityService.js';
import { isApimartReusableUrl, uploadImageToApimart } from './apimartUploadApi.js';
import { uploadToFreeImageHost } from './freeImageHostApi.js';
function _createLimiter(value) {
  let item = 0;
  const list = [];
  return function run(key) {
    return new Promise((handler, handler2) => {
      const run2 = () => {
        (item++,
          Promise.resolve()
            .then(key)
            .then(
              (index) => {
                item--;
                if (list.length && item < value) list.shift()();
                handler(index);
              },
              (result) => {
                item--;
                if (list.length && item < value) list.shift()();
                handler2(result);
              },
            ));
      };
      if (item < value) run2();
      else list.push(run2);
    });
  };
}
const _runLimited = _createLimiter(3),
  _inflight = new Map();
function _buildKey(data, options, target) {
  const {
      compress: compress = true,
      maxDim: maxDim = 0x800,
      quality: quality = 0.9,
      provider: provider = 'grsai',
      preferFree: preferFree = false,
    } = target || {},
    source = Math.round(quality * 0x3e8),
    next = options ? 1 : 0,
    current = compress ? 1 : 0,
    entry = preferFree ? 1 : 0;
  return [data, provider, current, maxDim, source, next, entry].join('|');
}
function _getUploadPromise(record, payload, handle) {
  const _buildKey2 = _buildKey(record, payload, handle);
  let promise = _inflight.get(_buildKey2);
  return (
    !promise &&
      ((promise = _runLimited(() => _processSingle(record, payload, handle))),
      _inflight.set(_buildKey2, promise),
      promise
        .finally(() => {
          _inflight.delete(_buildKey2);
        })
        .catch(() => {})),
    promise
  );
}
async function _processSingle(list2, apiKey, state) {
  const {
    compress: compress = true,
    maxDim: maxDim = 0x800,
    quality: quality = 0.9,
    provider: provider = 'grsai',
    fallbackCompressOnError: fallbackCompressOnError = false,
    fallbackMaxDim: fallbackMaxDim = 0x800,
    fallbackQuality: fallbackQuality = 0.9,
  } = state || {};
  if (provider === 'runninghub' && list2.includes('runninghub.cn')) return list2;
  if (provider === 'apimart' && isApimartReusableUrl(list2)) return list2;
  const run3 = async (config) => {
    if (provider === 'runninghub') return await uploadToRunningHub(config, apiKey);
    if (provider === 'apimart')
      return await uploadImageToApimart(config, { ...(state || {}), apiKey: apiKey });
    if (isFreeImageHostProvider(provider)) return await uploadToFreeImageHost(config, state || {});
    return await uploadImageToBed(config, apiKey, state || {});
  };
  if (compress) {
    let compressImage2;
    try {
      compressImage2 = await compressImage(list2, maxDim, quality);
    } catch (scope) {
      compressImage2 = await get(list2, { provider: 'remote', buildUrl: false, responseType: 'blob' });
    }
    return await run3(compressImage2);
  }
  if (fallbackCompressOnError)
    try {
      const get2 = await get(list2, { provider: 'remote', buildUrl: false, responseType: 'blob' });
      return await run3(get2);
    } catch (input) {
      const compressImage3 = await compressImage(list2, fallbackMaxDim, fallbackQuality);
      return await run3(compressImage3);
    }
  const get3 = await get(list2, { provider: 'remote', buildUrl: false, responseType: 'blob' });
  return await run3(get3);
}
async function uploadToTelegraph(output) {
  const formData = new FormData();
  formData.append('file', output, 'image.png');
  const value2 = 'https://telegra.ph/upload',
    value3 = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(value2),
    post2 = await post(value3, formData, { provider: 'telegraph' });
  if (Array.isArray(post2) && post2[0]?.src) return 'https://telegra.ph' + post2[0].src;
  throw new Error('Telegraph 返回格式异常');
}
function isFreeImageHostProvider(value4) {
  const value5 = String(value4 || '').trim(),
    value6 = value5.toLowerCase().replace(/[\s_-]+/g, '');
  return value5 === '免费图床' || value6 === 'freeimagehost';
}
async function uploadToQiniu(value7, value8) {
  const headers = { 'Content-Type': 'application/json' };
  if (value8) headers.Authorization = 'Bearer ' + value8;
  const post3 = await post(
    'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH',
    { sux: 'png' },
    { provider: 'grsai', buildUrl: false, headers: headers },
  );
  if (!post3.data) throw new Error('GRSAI 返回了无效的上传凭证');
  const { token: token, key: key2, url: url, domain: domain } = post3.data,
    formData2 = new FormData();
  return (
    formData2.append('token', token),
    formData2.append('key', key2),
    formData2.append('file', value7, 'image.png'),
    await post(url, formData2, { provider: 'qiniu', buildUrl: false }),
    domain + '/' + key2
  );
}
export async function uploadImageToBed(value9, enabled, value10 = {}) {
  const { preferFree: preferFree = false } = value10;
  if (preferFree)
    try {
      return await uploadToFreeImageHost(value9, value10);
    } catch (error) {
      try {
        return await uploadToTelegraph(value9);
      } catch (error2) {
        if (!enabled)
          throw new Error(
            '免费图床上传失败，且无 GRSAI API Key 备用：' + (error2?.message || error?.message || '未知错误'),
          );
      }
    }
  if (enabled)
    try {
      return await uploadToQiniu(value9, enabled);
    } catch (value11) {
      if (!preferFree) return await uploadToTelegraph(value9);
      throw value11;
    }
  return await uploadToTelegraph(value9);
}
export async function uploadToRunningHub(value12, enabled2) {
  if (!enabled2) throw new Error('RunningHUB API Key 未配置，无法上传图片');
  const value13 = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    value14 = '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(value13),
    formData3 = new FormData();
  formData3.append('file', value12, 'image.png');
  const post4 = await post(value14, formData3, {
      headers: { Authorization: 'Bearer ' + enabled2 },
      provider: 'runninghub',
    }),
    count = Number(post4?.code);
  if (Number.isFinite(count) && count !== 0)
    throw new Error('RunningHUB 上传失败: ' + getRunningHubUploadErrorMessage(post4));
  const runningHubUploadUrl = getRunningHubUploadUrl(post4);
  if (!runningHubUploadUrl) throw new Error('RunningHUB 上传失败: 未返回可用文件 URL');
  return runningHubUploadUrl;
}
function pickFirstUploadMessage(value15) {
  for (const value16 of value15) {
    if (typeof value16 === 'string' && value16.trim()) return value16.trim();
  }
  return '';
}
function getRunningHubUploadErrorMessage(error3) {
  const value17 = error3?.code,
    firstUploadMessage = pickFirstUploadMessage([
      error3?.message,
      error3?.msg,
      error3?.errorMessage,
      error3?.error,
      error3?.data?.message,
      error3?.data?.msg,
      error3?.data?.errorMessage,
      error3?.data?.error,
    ]);
  if (firstUploadMessage)
    return value17 === undefined ? firstUploadMessage : firstUploadMessage + ' (code: ' + value17 + ')';
  return value17 === undefined ? '未知错误' : '未知错误 (code: ' + value17 + ')';
}
function getRunningHubUploadUrl(response) {
  return String(
    response?.data?.download_url ||
      response?.data?.downloadUrl ||
      response?.data?.fileUrl ||
      response?.data?.file_url ||
      response?.data?.url ||
      response?.download_url ||
      response?.downloadUrl ||
      response?.fileUrl ||
      response?.file_url ||
      response?.url ||
      '',
  ).trim();
}
async function _processInputImagesOrdered(list3, value18, value19 = {}) {
  const args =
      value19?.applyInputQualityProfile === true
        ? resolveImageInputUploadQualityOptions(value19)
        : value19 || {},
    {
      compress: compress = true,
      maxDim: maxDim = 0x800,
      quality: quality = 0.9,
      provider: provider = 'grsai',
    } = args;
  if (!list3 || list3.length === 0) return [];
  const value20 = {
      ...args,
      compress: compress,
      maxDim: maxDim,
      quality: quality,
      provider: provider,
    },
    value21 = value20.strictUpload === true,
    value22 = new Array(list3.length).fill(''),
    list4 = [];
  for (let value23 = 0; value23 < list3.length; value23++) {
    const list5 = String(list3[value23] || '').trim();
    if (!list5) continue;
    if (provider === 'runninghub' && list5.includes('runninghub.cn')) {
      value22[value23] = list5;
      continue;
    }
    if (provider === 'apimart' && isApimartReusableUrl(list5)) {
      value22[value23] = list5;
      continue;
    }
    const promise2 = _getUploadPromise(list5, value18, value20),
      promise3 = promise2.then((value24) => {
        value22[value23] = String(value24 || '').trim();
      });
    list4.push(
      value21
        ? promise3
        : promise3.catch(() => {
            value22[value23] = '';
          }),
    );
  }
  if (list4.length > 0) {
    if (value21) await Promise.all(list4);
    else await Promise.allSettled(list4);
  }
  return value22;
}
export async function processInputImages(value25, value26, value27 = {}) {
  const list6 = await _processInputImagesOrdered(value25, value26, value27);
  return list6.filter(Boolean);
}
export async function processInputImagesPreserveOrder(value28, value29, value30 = {}) {
  return await _processInputImagesOrdered(value28, value29, value30);
}
