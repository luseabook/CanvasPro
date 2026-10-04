export const STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT = 0x4;
let activeRequestCount = 0x0;
const pendingRequests = [];
function drainStoryEpisodeExperimentalRequestQueue() {
  while (
    activeRequestCount < STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT &&
    pendingRequests['length']
  ) {
    const promise = pendingRequests['shift']();
    ((activeRequestCount += 0x1),
      void (async () => {
        try {
          promise['resolve'](await promise['operation']());
        } catch (value) {
          promise['reject'](value);
        } finally {
          ((activeRequestCount -= 0x1), drainStoryEpisodeExperimentalRequestQueue());
        }
      })());
  }
}
export function enqueueStoryEpisodeExperimentalRequest(operation) {
  if (typeof operation !== 'function')
    return Promise['reject'](new TypeError('实验分集请求队列需要可执行的请求函数。'));
  return new Promise((resolve, reject) => {
    (pendingRequests['push']({
      operation: operation,
      resolve: resolve,
      reject: reject,
    }),
      drainStoryEpisodeExperimentalRequestQueue());
  });
}
