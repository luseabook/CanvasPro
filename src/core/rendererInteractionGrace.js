export function createRendererInteractionGraceController({
  delayMs: delayMs = 0,
  getNow: getNow = defaultNow,
  getDragContext: getDragContext = null,
  onBusyStateChange: onBusyStateChange = null,
} = {}) {
  let _0x272a79 = 0,
    _0x201d33 = false;
  function _0x5e8dda(_0x159113) {
    const _0x533d9b = _0x159113 === true;
    if (_0x201d33 === _0x533d9b) return;
    ((_0x201d33 = _0x533d9b), onBusyStateChange?.(_0x533d9b));
  }
  function _0x3b6068() {
    ((_0x272a79 = getNow()), _0x5e8dda(true));
  }
  function _0x1eb3ec() {
    _0x5e8dda(false);
  }
  function _0x137a4c() {
    const _0x55c2b2 = Number(delayMs);
    if (!Number.isFinite(_0x55c2b2) || _0x55c2b2 <= 0 || !_0x272a79) return 0;
    const _0x28c16e = getNow() - _0x272a79;
    return Math.max(0, _0x55c2b2 - Math.max(0, _0x28c16e));
  }
  function _0x5c7cd7() {
    ((_0x272a79 = 0), _0x5e8dda(false));
  }
  function _0x468e7a() {
    const _0x45a5f1 = typeof getDragContext === 'function' ? getDragContext() || {} : {};
    if (
      _0x45a5f1.isPanning ||
      _0x45a5f1.isDragging ||
      _0x45a5f1.isConnecting ||
      _0x45a5f1.isBoxSelecting ||
      _0x45a5f1.isDraggingCell
    )
      return true;
    const _0x5eab05 = typeof document !== 'undefined' ? document.body?.classList : null;
    return !!(
      _0x5eab05?.contains?.('is-panning') ||
      _0x5eab05?.contains?.('is-zooming') ||
      _0x5eab05?.contains?.('is-viewport-animating')
    );
  }
  return {
    getRemainingMs: _0x137a4c,
    isBusy: _0x468e7a,
    markIdle: _0x1eb3ec,
    markBusy: _0x3b6068,
    reset: _0x5c7cd7,
  };
}
function defaultNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}
