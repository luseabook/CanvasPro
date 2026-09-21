import { post } from './apiBase.js';
function _createLimiter(_0x2241a6) {
  let _0x53b80e = 0;
  const _0x1249d9 = [];
  return function _0x2955b9(_0x5e1f2d) {
    return new Promise((_0x6cb662, _0x4c3eb7) => {
      const _0x567226 = () => {
        (_0x53b80e++,
          Promise.resolve()
            .then(_0x5e1f2d)
            .then(
              (_0x1228d0) => {
                _0x53b80e--;
                if (_0x1249d9.length && _0x53b80e < _0x2241a6) _0x1249d9.shift()();
                _0x6cb662(_0x1228d0);
              },
              (_0x40818b) => {
                _0x53b80e--;
                if (_0x1249d9.length && _0x53b80e < _0x2241a6) _0x1249d9.shift()();
                _0x4c3eb7(_0x40818b);
              },
            ));
      };
      if (_0x53b80e < _0x2241a6) _0x567226();
      else _0x1249d9.push(_0x567226);
    });
  };
}
const _runLimited = _createLimiter(2),
  _inflight = new Map();
export async function fetchVideoMetaFromServer(_0x5f4df2) {
  const _0x510f24 = String(_0x5f4df2 || '').trim();
  if (!_0x510f24) throw new Error('src 不能为空');
  const _0x316392 = _inflight.get(_0x510f24);
  if (_0x316392) return _0x316392;
  let _0xf2e782;
  return (
    (_0xf2e782 = _runLimited(async () => {
      const _0xf9df5c = await post('/api/v2/video/meta', { src: _0x510f24 });
      if (!_0xf9df5c.success) throw new Error(_0xf9df5c.error || '请求失败');
      return _0xf9df5c.data;
    }).finally(() => {
      if (_inflight.get(_0x510f24) === _0xf2e782) _inflight.delete(_0x510f24);
    })),
    _inflight.set(_0x510f24, _0xf2e782),
    _0xf2e782
  );
}
