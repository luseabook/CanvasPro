import { buildApiUrl } from './apiBase.js';
import { post, get } from './requester.js';
import { isApimartReusableUrl, uploadVideoToApimart } from './apimartUploadApi.js';
export async function uploadVideoToRunningHub(error, enabled) {
  if (!enabled) throw new Error('RunningHUB API Key 未配置，无法上传视频');
  if (!error) throw new Error('视频文件不能为空');
  const value = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    apiUrl = buildApiUrl('/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(value)),
    formData = new FormData(),
    item = error.name || 'video.mp4';
  formData.append('file', error, item);
  const error2 = await post(apiUrl, formData, {
    headers: { Authorization: 'Bearer ' + enabled },
    provider: 'runninghub',
    buildUrl: false,
  });
  if (error2.code !== 0) throw new Error('RunningHUB 视频上传失败: ' + (error2.message || '未知错误'));
  const enabled2 = error2.data?.download_url;
  if (!enabled2) throw new Error('RunningHUB 返回的视频URL为空');
  return enabled2;
}
export async function uploadVideoToApimartCdn(enabled3, key = {}) {
  if (!enabled3) throw new Error('视频文件不能为空');
  return await uploadVideoToApimart(enabled3, key);
}
async function processInputVideosOrdered(list, apiKey, args = {}) {
  if (!list || list.length === 0) return [];
  const index = String(args.provider || 'runninghub').trim() || 'runninghub',
    result = args.strictUpload === true,
    data = new Array(list.length).fill('');
  for (let options = 0; options < list.length; options++) {
    const list2 = String(list[options] || '').trim();
    if (!list2) continue;
    try {
      if (index === 'runninghub' && list2.includes('runninghub.cn')) {
        data[options] = list2;
        continue;
      }
      if (index === 'apimart' && isApimartReusableUrl(list2)) {
        data[options] = list2;
        continue;
      }
      const target = /^https?:\/\//.test(list2)
          ? list2
          : buildApiUrl(list2.startsWith('/') ? list2 : '/' + list2),
        get2 = await get(target, { provider: 'remote', buildUrl: false, responseType: 'blob' }),
        source =
          index === 'apimart'
            ? await uploadVideoToApimart(get2, { ...args, apiKey: apiKey })
            : await uploadVideoToRunningHub(get2, apiKey);
      data[options] = source;
    } catch (next) {
      if (result) throw next;
    }
  }
  return data;
}
export async function processInputVideos(current, entry, record = {}) {
  const list3 = await processInputVideosOrdered(current, entry, record);
  return list3.filter(Boolean);
}
export async function processInputVideosPreserveOrder(payload, handle, state = {}) {
  return await processInputVideosOrdered(payload, handle, state);
}
