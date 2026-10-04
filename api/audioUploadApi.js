import { buildApiUrl } from './apiBase.js';
import { post, get } from './requester.js';
import { isApimartReusableUrl, uploadBlobToApimart } from './apimartUploadApi.js';
export async function uploadAudioToRunningHub(error, enabled) {
  if (!enabled) throw new Error('RunningHUB API Key 未配置，无法上传音频');
  if (!error) throw new Error('音频文件不能为空');
  const value = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    apiUrl = buildApiUrl('/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(value)),
    formData = new FormData(),
    item = error.name || 'audio.mp3';
  formData.append('file', error, item);
  const error2 = await post(apiUrl, formData, {
    headers: { Authorization: 'Bearer ' + enabled },
    provider: 'runninghub',
    buildUrl: false,
  });
  if (error2.code !== 0) throw new Error('RunningHUB 音频上传失败: ' + (error2.message || '未知错误'));
  const enabled2 = error2.data?.download_url;
  if (!enabled2) throw new Error('RunningHUB 返回的音频URL为空');
  return enabled2;
}
function guessAudioExtension(key, index = 'mp3') {
  try {
    const uRL = new URL(String(key || ''), 'https://local.invalid'),
      list =
        String(uRL.pathname || '')
          .split('/')
          .pop() || '',
      result = list.includes('.') ? list.split('.').pop().toLowerCase() : '';
    if (/^(mp3|wav|m4a|aac|ogg|flac|webm|mp4)$/.test(result)) return result;
  } catch {}
  return index;
}
export async function uploadAudioToApimart(data, contentType = {}) {
  return await uploadBlobToApimart(data, {
    ...contentType,
    contentType: contentType.contentType || data?.type || 'audio/mpeg',
    fileExtension: contentType.fileExtension || 'mp3',
  });
}
async function processInputAudiosOrdered(list2, apiKey, args = {}) {
  if (!list2 || list2.length === 0) return [];
  const options = String(args.provider || 'runninghub')
      .trim()
      .toLowerCase(),
    target = args.strictUpload === true,
    source = new Array(list2.length).fill('');
  for (let next = 0; next < list2.length; next++) {
    const list3 = String(list2[next] || '').trim();
    if (!list3) continue;
    try {
      if (options === 'apimart') {
        if (isApimartReusableUrl(list3)) {
          source[next] = list3;
          continue;
        }
        const current = /^https?:\/\//.test(list3)
            ? list3
            : buildApiUrl(list3.startsWith('/') ? list3 : '/' + list3),
          contentType2 = await get(current, { provider: 'remote', buildUrl: false, responseType: 'blob' }),
          fileExtension = guessAudioExtension(list3);
        source[next] = await uploadAudioToApimart(contentType2, {
          ...args,
          apiKey: apiKey,
          contentType: contentType2?.type || 'audio/mpeg',
          fileExtension: fileExtension,
          filename: 'audio.' + fileExtension,
        });
        continue;
      }
      if (list3.includes('runninghub.cn')) {
        source[next] = list3;
        continue;
      }
      const entry = /^https?:\/\//.test(list3)
          ? list3
          : buildApiUrl(list3.startsWith('/') ? list3 : '/' + list3),
        get2 = await get(entry, { provider: 'remote', buildUrl: false, responseType: 'blob' }),
        runningHub = await uploadAudioToRunningHub(get2, apiKey);
      source[next] = runningHub;
    } catch (record) {
      if (target) throw record;
    }
  }
  return source;
}
export async function processInputAudios(payload, handle, state = {}) {
  const list4 = await processInputAudiosOrdered(payload, handle, state);
  return list4.filter(Boolean);
}
export async function processInputAudiosPreserveOrder(config, scope, input = {}) {
  return await processInputAudiosOrdered(config, scope, input);
}
