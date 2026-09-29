const DEFAULT_IMAGE_READY_TIMEOUT_MS = 0x2710;
export function waitForImageElementReady({
  image: _0x3d851b,
  onReady: onReady = () => {},
  onError: onError = () => {},
  onTimeout: onTimeout = onError,
  timeoutMs: timeoutMs = DEFAULT_IMAGE_READY_TIMEOUT_MS,
  setTimeoutFn: setTimeoutFn = globalThis['setTimeout'],
  clearTimeoutFn: clearTimeoutFn = globalThis['clearTimeout'],
} = {}) {
  let _0x32da56 = ![],
    _0x4889ec = null;
  const _0x258515 = () => {
      (_0x3d851b?.['removeEventListener']?.('load', _0x49b668),
        _0x3d851b?.['removeEventListener']?.('error', _0x13d5d3),
        _0x4889ec != null && (clearTimeoutFn?.(_0x4889ec), (_0x4889ec = null)));
    },
    _0x4e265b = (_0x23e753) => {
      if (_0x32da56) return;
      ((_0x32da56 = !![]), _0x258515(), _0x23e753?.());
    },
    _0x49b668 = () => _0x4e265b(onReady),
    _0x13d5d3 = () => _0x4e265b(onError);
  (_0x3d851b?.['addEventListener']?.('load', _0x49b668),
    _0x3d851b?.['addEventListener']?.('error', _0x13d5d3));
  const _0x1cf98b = Math['max'](0x0, Number(timeoutMs) || 0x0);
  _0x1cf98b > 0x0 &&
    typeof setTimeoutFn === 'function' &&
    (_0x4889ec = setTimeoutFn(() => _0x4e265b(onTimeout), _0x1cf98b));
  if (!_0x3d851b) _0x4e265b(onError);
  else _0x3d851b['complete'] && _0x4e265b(_0x3d851b['naturalWidth'] > 0x0 ? onReady : onError);
  return _0x258515;
}
