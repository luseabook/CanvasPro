export const STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT = 0x4;
let activeRequestCount = 0x0;
const pendingRequests = [];
function drainStoryEpisodeExperimentalRequestQueue() {
  while (
    activeRequestCount < STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT &&
    pendingRequests['length']
  ) {
    const _0x17a34c = pendingRequests['shift']();
    ((activeRequestCount += 0x1),
      void (async () => {
        try {
          _0x17a34c['resolve'](await _0x17a34c['operation']());
        } catch (_0x5682e3) {
          _0x17a34c['reject'](_0x5682e3);
        } finally {
          ((activeRequestCount -= 0x1), drainStoryEpisodeExperimentalRequestQueue());
        }
      })());
  }
}
export function enqueueStoryEpisodeExperimentalRequest(_0x268de4) {
  if (typeof _0x268de4 !== 'function')
    return Promise['reject'](new TypeError('实验分集请求队列需要可执行的请求函数。'));
  return new Promise((_0x12b608, _0x574d6c) => {
    (pendingRequests['push']({
      operation: _0x268de4,
      resolve: _0x12b608,
      reject: _0x574d6c,
    }),
      drainStoryEpisodeExperimentalRequestQueue());
  });
}
