function requestFrame(_0x24dc0c) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(_0x24dc0c);
  return (_0x24dc0c(), 0x0);
}
function cancelFrame(_0x2d47fd) {
  if (!_0x2d47fd) return;
  typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(_0x2d47fd);
}
export function createPreviewCommitSession({ applyPreview: _0x3b0bb7 } = {}) {
  let _0x261671 = ![],
    _0x249777 = ![],
    _0x29fb4b = 0x0,
    _0x5842d6 = null,
    _0x15afd3 = null;
  const _0x404093 = () => {
      if (!_0x29fb4b) return;
      (cancelFrame(_0x29fb4b), (_0x29fb4b = 0x0));
    },
    _0x2f7db0 = () => {
      _0x29fb4b = 0x0;
      if (_0x5842d6 == null) return;
      const _0x301a9a = _0x5842d6;
      ((_0x5842d6 = null), (_0x15afd3 = _0x301a9a), _0x3b0bb7?.(_0x301a9a));
    },
    _0x3d7834 = () => {
      if (_0x29fb4b) return;
      _0x29fb4b = requestFrame(_0x2f7db0);
    },
    _0x4e1911 = () => {
      (_0x404093(), (_0x261671 = ![]), (_0x249777 = ![]), (_0x5842d6 = null), (_0x15afd3 = null));
    },
    _0x44bf53 = (_0x3875c0) => {
      ((_0x261671 = !![]), (_0x249777 = ![]), (_0x5842d6 = null), (_0x15afd3 = _0x3875c0));
    };
  return {
    begin: _0x44bf53,
    update(_0x1d30e4) {
      (!_0x261671 && _0x44bf53(_0x1d30e4),
        (_0x249777 = !![]),
        (_0x15afd3 = _0x1d30e4),
        (_0x5842d6 = _0x1d30e4),
        _0x3d7834());
    },
    getPreview() {
      if (!_0x261671) return null;
      return _0x5842d6 || _0x15afd3;
    },
    commit() {
      _0x404093();
      _0x5842d6 != null && _0x2f7db0();
      const _0x5ac8a0 = _0x249777 && _0x15afd3 != null ? _0x15afd3 : null;
      return (_0x4e1911(), _0x5ac8a0);
    },
    cancel() {
      _0x4e1911();
    },
    isActive() {
      return _0x261671;
    },
  };
}
