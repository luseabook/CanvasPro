import { post } from './apiBase.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from './localMediaTaskApi.js';
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
const _runLimited = _createLimiter(2),
  _inflight = new Map();
function buildMediaTaskPayload(src, data = {}) {
  const options = { kind: 'videoFirstFrame', src: src },
    target = String(data?.nodeId || '').trim(),
    source = String(data?.assetId || '').trim();
  if (target) options.nodeId = target;
  if (source) options.assetId = source;
  return options;
}
export async function fetchVideoFirstFrameThumbFromServer(next, current = {}) {
  const src2 = String(next || '').trim();
  if (!src2) throw new Error('src 不能为空');
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(buildMediaTaskPayload(src2, current), {
      wait: true,
      timeout: 120000,
    });
  const entry = _inflight.get(src2);
  if (entry) return entry;
  let _runLimited2;
  return (
    (_runLimited2 = _runLimited(async () => {
      const response = await post('/api/v2/video/first_frame', { src: src2 });
      if (!response.success) throw new Error(response.error || '请求失败');
      return response.data;
    }).finally(() => {
      if (_inflight.get(src2) === _runLimited2) _inflight.delete(src2);
    })),
    _inflight.set(src2, _runLimited2),
    _runLimited2
  );
}
