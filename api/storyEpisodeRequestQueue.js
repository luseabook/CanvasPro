export const STORY_EPISODE_REQUEST_CONCURRENCY_LIMIT = 0x4;
let activeRequestCount = 0x0;
const pendingRequests = [];
function drainStoryEpisodeRequestQueue() {
  while (activeRequestCount < STORY_EPISODE_REQUEST_CONCURRENCY_LIMIT && pendingRequests['length']) {
    const _0x55fe4d = pendingRequests['shift']();
    ((activeRequestCount += 0x1),
      void (async () => {
        try {
          _0x55fe4d['resolve'](await _0x55fe4d['operation']());
        } catch (_0xa951be) {
          _0x55fe4d['reject'](_0xa951be);
        } finally {
          ((activeRequestCount -= 0x1), drainStoryEpisodeRequestQueue());
        }
      })());
  }
}
export function enqueueStoryEpisodeRequest(_0x2fdaf8) {
  if (typeof _0x2fdaf8 !== 'function')
    return Promise['reject'](new TypeError('分集请求队列需要可执行的请求函数。'));
  return new Promise((_0x5d968f, _0x9f03fc) => {
    (pendingRequests['push']({ operation: _0x2fdaf8, resolve: _0x5d968f, reject: _0x9f03fc }),
      drainStoryEpisodeRequestQueue());
  });
}
