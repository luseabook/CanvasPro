export function createRendererPresentationSubscription({
  onSnapshot: _0x3b1aea,
  flushSelection: _0x46c27b,
  render: _0x40af29,
  onSuspend: _0x47191b,
  onResume: _0x24b36f,
  requestFrame: requestFrame = (_0x27964e) => requestAnimationFrame(_0x27964e),
  cancelFrame: cancelFrame = (_0x3d9f74) => cancelAnimationFrame(_0x3d9f74),
} = {}) {
  let _0x46becd = !![],
    _0x294830 = ![],
    _0x55e68e = null,
    _0x2b4062 = null,
    _0x7fa16a = null,
    _0x4a2205 = null;
  const _0x4d0331 = () => {
      if (_0x55e68e !== null) cancelFrame(_0x55e68e);
      ((_0x55e68e = null), (_0x2b4062 = null));
    },
    _0x5072b6 = (_0x2db0fc) => {
      if (_0x294830) return;
      _0x7fa16a = _0x2db0fc;
      if (_0x46becd && _0x46c27b?.(_0x2db0fc)) return;
      (_0x3b1aea?.(_0x2db0fc), (_0x2b4062 = _0x2db0fc));
      if (!_0x46becd || _0x55e68e !== null) return;
      _0x55e68e = requestFrame(() => {
        _0x55e68e = null;
        const _0x57e741 = _0x2b4062;
        _0x2b4062 = null;
        if (_0x46becd && !_0x294830) _0x40af29(_0x57e741);
      });
    };
  return {
    connect(_0x1341ab) {
      (_0x24b36f?.(), (_0x4a2205 = _0x1341ab['subscribeRaw'](_0x5072b6)));
    },
    isActive: () => _0x46becd && !_0x294830,
    hasPendingFrame: () => _0x55e68e !== null,
    cancelPending: _0x4d0331,
    clearPendingSnapshot: () => {
      _0x2b4062 = null;
    },
    setActive(_0x35bb83) {
      if (_0x294830 || _0x46becd === (_0x35bb83 === !![])) return;
      _0x46becd = _0x35bb83 === !![];
      if (!_0x46becd) (_0x4d0331(), _0x47191b?.());
      else {
        _0x24b36f?.();
        if (_0x7fa16a) _0x5072b6(_0x7fa16a);
      }
    },
    dispose() {
      ((_0x294830 = !![]), _0x4d0331(), _0x4a2205?.(), (_0x2b4062 = _0x7fa16a = null));
    },
  };
}
