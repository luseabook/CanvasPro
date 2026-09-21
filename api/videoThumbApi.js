import { post } from './apiBase.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from './localMediaTaskApi.js';
function _createLimiter(_0x28e174) {
  let _0x2ec9d3 = 0;
  const _0x1fc5b1 = [];
  return function _0x49915f(_0xf5b49e) {
    return new Promise((_0x23e0c3, _0xd9225e) => {
      const _0x244ae9 = () => {
        (_0x2ec9d3++,
          Promise.resolve()
            .then(_0xf5b49e)
            .then(
              (_0x52cdb0) => {
                _0x2ec9d3--;
                if (_0x1fc5b1.length && _0x2ec9d3 < _0x28e174) _0x1fc5b1.shift()();
                _0x23e0c3(_0x52cdb0);
              },
              (_0x3add64) => {
                _0x2ec9d3--;
                if (_0x1fc5b1.length && _0x2ec9d3 < _0x28e174) _0x1fc5b1.shift()();
                _0xd9225e(_0x3add64);
              },
            ));
      };
      if (_0x2ec9d3 < _0x28e174) _0x244ae9();
      else _0x1fc5b1.push(_0x244ae9);
    });
  };
}
const _runLimited = _createLimiter(2),
  _inflight = new Map();
function buildMediaTaskPayload(_0x569703, _0x5b53b2 = {}) {
  const _0x2b26f1 = { kind: 'videoFirstFrame', src: _0x569703 },
    _0x94ac9f = String(_0x5b53b2?.nodeId || '').trim(),
    _0xff912 = String(_0x5b53b2?.assetId || '').trim();
  if (_0x94ac9f) _0x2b26f1.nodeId = _0x94ac9f;
  if (_0xff912) _0x2b26f1.assetId = _0xff912;
  return _0x2b26f1;
}
export async function fetchVideoFirstFrameThumbFromServer(_0x17dfbd, _0x1b330e = {}) {
  const _0x73ce06 = String(_0x17dfbd || '').trim();
  if (!_0x73ce06) throw new Error('src 不能为空');
  if (canUseElectronMediaTask())
    return await enqueueElectronMediaTask(buildMediaTaskPayload(_0x73ce06, _0x1b330e), {
      wait: true,
      timeout: 0x1d4c0,
    });
  const _0x342485 = _inflight.get(_0x73ce06);
  if (_0x342485) return _0x342485;
  let _0x3debef;
  return (
    (_0x3debef = _runLimited(async () => {
      const _0xe7b4ed = await post('/api/v2/video/first_frame', { src: _0x73ce06 });
      if (!_0xe7b4ed.success) throw new Error(_0xe7b4ed.error || '请求失败');
      return _0xe7b4ed.data;
    }).finally(() => {
      if (_inflight.get(_0x73ce06) === _0x3debef) _inflight.delete(_0x73ce06);
    })),
    _inflight.set(_0x73ce06, _0x3debef),
    _0x3debef
  );
}
