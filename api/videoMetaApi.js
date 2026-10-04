import { post } from './apiBase.js';
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
export async function fetchVideoMetaFromServer(data) {
  const src = String(data || '').trim();
  if (!src) throw new Error('src 不能为空');
  const options = _inflight.get(src);
  if (options) return options;
  let _runLimited2;
  return (
    (_runLimited2 = _runLimited(async () => {
      const response = await post('/api/v2/video/meta', { src: src });
      if (!response.success) throw new Error(response.error || '请求失败');
      return response.data;
    }).finally(() => {
      if (_inflight.get(src) === _runLimited2) _inflight.delete(src);
    })),
    _inflight.set(src, _runLimited2),
    _runLimited2
  );
}
