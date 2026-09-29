import { requester } from './requester.js';
import { saveOutputToServer } from './projectsV2Api.js';
import { localPathToUrl, pickResultLocalPath } from '../src/utils/localMediaPath.js';
export async function saveModelApiVideoContent(_0x3beef5, _0x1647b2, _0x121253 = {}) {
  const _0x573c3b = new URL(_0x3beef5);
  ((_0x573c3b['pathname'] = _0x573c3b['pathname']['replace'](/\/$/, '') + '/content'),
    (_0x573c3b['search'] = ''),
    (_0x573c3b['hash'] = ''));
  const _0x5d5194 = await requester({
    url: '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x573c3b['toString']()),
    method: 'GET',
    headers: { Authorization: 'Bearer ' + _0x1647b2 },
    provider: _0x121253['providerId'] || 'custom-provider',
    responseType: 'blob',
    timeout: 0x1d4c0,
    signal: _0x121253['signal'],
    retries: 0x0,
  });
  if (
    !_0x5d5194?.['size'] ||
    !String(_0x5d5194['type'] || '')
      ['toLowerCase']()
      ['startsWith']('video/')
  )
    throw new Error('视频下载未返回有效的视频文件');
  const _0x51044a = await saveOutputToServer(_0x5d5194, {
      ext: 'mp4',
      kind: 'video',
    }),
    _0x5209ca = pickResultLocalPath(_0x51044a);
  if (!_0x5209ca) throw new Error('视频下载完成，但本地保存失败');
  return { videoUrl: localPathToUrl(_0x5209ca), localPath: _0x5209ca };
}
