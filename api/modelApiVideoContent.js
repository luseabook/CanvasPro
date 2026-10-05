import { requester } from './requester.js';
import { saveOutputToServer } from './projectsV2Api.js';
import { localPathToUrl, pickResultLocalPath } from '../src/utils/localMediaPath.js';
export async function saveModelApiVideoContent(value, item, provider = {}) {
  const uRL = new URL(value);
  ((uRL['pathname'] = uRL['pathname']['replace'](/\/$/, '') + '/content'),
    (uRL['search'] = ''),
    (uRL['hash'] = ''));
  const requester2 = await requester({
    url: '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(uRL['toString']()),
    method: 'GET',
    headers: { Authorization: 'Bearer ' + item },
    provider: provider['providerId'] || 'custom-provider',
    responseType: 'blob',
    timeout: 120000,
    signal: provider['signal'],
    retries: 0,
  });
  if (
    !requester2?.['size'] ||
    !String(requester2['type'] || '')
      ['toLowerCase']()
      ['startsWith']('video/')
  )
    throw new Error('视频下载未返回有效的视频文件');
  const server = await saveOutputToServer(requester2, {
      ext: 'mp4',
      kind: 'video',
    }),
    localPath = pickResultLocalPath(server);
  if (!localPath) throw new Error('视频下载完成，但本地保存失败');
  return { videoUrl: localPathToUrl(localPath), localPath: localPath };
}
