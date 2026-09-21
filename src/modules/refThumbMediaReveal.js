import { preloadCanvasImage, resetCanvasMediaSchedulerForTests } from './canvasMediaScheduler.js';
let _decodePromiseMap = new Map(),
  _revealTokenMap = new WeakMap();
const REVEAL_RETRY_DELAYS_MS = [120, 0x140, 0x2d0],
  ATTACH_RETRY_DELAYS_MS = [0, 16, 50, 120];
function nextRevealToken(_0x37a27f) {
  const _0x40c0c1 = (_revealTokenMap.get(_0x37a27f) || 0) + 1;
  return (_revealTokenMap.set(_0x37a27f, _0x40c0c1), _0x40c0c1);
}
function isRevealCurrent(_0x3ee849, _0x115926, _0x40f07f, _0x14dad2, _0x473817 = false) {
  if (!_0x3ee849) return false;
  if (!_0x473817 && _0x3ee849.isConnected === false) return false;
  if (_0x40f07f && _0x115926?.dataset?.sig !== _0x40f07f) return false;
  return _revealTokenMap.get(_0x3ee849) === _0x14dad2;
}
function afterFrame(_0x529a07) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(_0x529a07);
    return;
  }
  setTimeout(_0x529a07, 0);
}
function setThumbErrorState(_0x351152, _0x5312e7, _0x1fd4cf) {
  if (_0x351152?.dataset) {
    if (_0x1fd4cf) _0x351152.dataset.thumbError = '1';
    else delete _0x351152.dataset.thumbError;
  }
  if (_0x5312e7?.dataset) {
    if (_0x1fd4cf) _0x5312e7.dataset.thumbError = '1';
    else delete _0x5312e7.dataset.thumbError;
  }
}
function refreshImageElement(_0xe052d9, _0x297480) {
  if (!_0xe052d9 || !_0x297480) return;
  try {
    const _0x3e2522 = String(_0xe052d9.getAttribute?.('src') || _0xe052d9.src || '').trim();
    (_0x3e2522 === _0x297480 && (_0xe052d9.src = ''), (_0xe052d9.src = _0x297480));
  } catch {}
}
export function ensureThumbDecoded(_0x126aa9) {
  const _0x31013d = String(_0x126aa9 || '').trim();
  if (!_0x31013d) return Promise.resolve(false);
  const _0x2acbb0 = _decodePromiseMap.get(_0x31013d);
  if (_0x2acbb0) return _0x2acbb0;
  if (typeof Image !== 'function') return Promise.resolve(false);
  let _0xbb87f7 = null;
  const _0x1ba2f4 = preloadCanvasImage(_0x31013d, { priority: 40, fetchPriority: 'auto' }).then(
    () => true,
    () => false,
  );
  return (
    (_0xbb87f7 = _0x1ba2f4.then(
      (_0x13e4c2) => {
        return (
          !_0x13e4c2 && _decodePromiseMap.get(_0x31013d) === _0xbb87f7 && _decodePromiseMap.delete(_0x31013d),
          _0x13e4c2
        );
      },
      () => {
        return (_decodePromiseMap.get(_0x31013d) === _0xbb87f7 && _decodePromiseMap.delete(_0x31013d), false);
      },
    )),
    _decodePromiseMap.set(_0x31013d, _0xbb87f7),
    _0xbb87f7
  );
}
function revealSingleRefThumb(
  _0x5b1369,
  _0xb24e79,
  _0x263065,
  _0x2d4edc,
  _0x448312 = 0,
  _0x55e698 = 0,
  _0x489e81 = _0x5b1369?.isConnected !== false,
) {
  if (!isRevealCurrent(_0x5b1369, _0xb24e79, _0x263065, _0x2d4edc, true)) return;
  if (_0x5b1369.isConnected === false) {
    if (_0x489e81) return;
    const _0x2e2f23 = ATTACH_RETRY_DELAYS_MS[_0x55e698];
    if (_0x2e2f23 == null) return;
    setTimeout(() => {
      revealSingleRefThumb(_0x5b1369, _0xb24e79, _0x263065, _0x2d4edc, _0x448312, _0x55e698 + 1, false);
    }, _0x2e2f23);
    return;
  }
  _0x5b1369.decoding = 'async';
  const _0x343471 = true,
    _0x5a82ae = () => {
      if (!isRevealCurrent(_0x5b1369, _0xb24e79, _0x263065, _0x2d4edc)) return;
      (setThumbErrorState(_0x5b1369, _0xb24e79, false),
        _0x5b1369.classList.remove('is-pending'),
        _0x5b1369.classList.add('is-ready'));
    },
    _0x11292 = () => {
      if (!isRevealCurrent(_0x5b1369, _0xb24e79, _0x263065, _0x2d4edc)) return;
      setThumbErrorState(_0x5b1369, _0xb24e79, true);
    };
  if (_0x5b1369.complete && _0x5b1369.naturalWidth > 0) {
    afterFrame(_0x5a82ae);
    return;
  }
  const _0xccf5df = String(_0x5b1369.getAttribute('src') || '').trim();
  if (!_0xccf5df) {
    _0x11292();
    return;
  }
  (setThumbErrorState(_0x5b1369, _0xb24e79, false),
    ensureThumbDecoded(_0xccf5df)
      .then((_0x272ba3) => {
        if (!isRevealCurrent(_0x5b1369, _0xb24e79, _0x263065, _0x2d4edc)) return;
        if (_0x272ba3) {
          (refreshImageElement(_0x5b1369, _0xccf5df), afterFrame(_0x5a82ae));
          return;
        }
        const _0x364edf = REVEAL_RETRY_DELAYS_MS[_0x448312];
        if (_0x364edf == null) {
          afterFrame(_0x11292);
          return;
        }
        setTimeout(() => {
          revealSingleRefThumb(
            _0x5b1369,
            _0xb24e79,
            _0x263065,
            _0x2d4edc,
            _0x448312 + 1,
            _0x55e698,
            _0x343471,
          );
        }, _0x364edf);
      })
      .catch(() => {
        if (!isRevealCurrent(_0x5b1369, _0xb24e79, _0x263065, _0x2d4edc)) return;
        const _0x559c9d = REVEAL_RETRY_DELAYS_MS[_0x448312];
        if (_0x559c9d == null) {
          afterFrame(_0x11292);
          return;
        }
        setTimeout(() => {
          revealSingleRefThumb(
            _0x5b1369,
            _0xb24e79,
            _0x263065,
            _0x2d4edc,
            _0x448312 + 1,
            _0x55e698,
            _0x343471,
          );
        }, _0x559c9d);
      }));
}
export function revealRefThumbMedia(_0x5c817f, _0x2f7cae = '') {
  if (!_0x5c817f) return;
  const _0x278137 = String(_0x2f7cae || ''),
    _0x9fc316 = Array.from(_0x5c817f.querySelectorAll('img.ref-thumb-media.is-pending'));
  for (const _0x2726b5 of _0x9fc316) {
    revealSingleRefThumb(_0x2726b5, _0x5c817f, _0x278137, nextRevealToken(_0x2726b5));
  }
}
export function _resetRefThumbMediaRevealForTests() {
  ((_decodePromiseMap = new Map()), (_revealTokenMap = new WeakMap()), resetCanvasMediaSchedulerForTests());
}
