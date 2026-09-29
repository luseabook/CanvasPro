export function createRendererViewportCommitGate({
  delayMs: delayMs = 0x0,
  shouldDefer: shouldDefer = () => ![],
} = {}) {
  let _0x3998ac = null,
    _0x9b9d8e = ![];
  function _0x39fe2b(_0x2ad34e, _0x28b96f, _0x31cf7a) {
    ((_0x3998ac = { mode: _0x2ad34e, nodeCount: _0x28b96f, edgesRev: _0x31cf7a }), (_0x9b9d8e = ![]));
  }
  function _0x52cf4c() {
    ((_0x3998ac = null), (_0x9b9d8e = ![]));
  }
  function _0x3ac71d(_0x316aa4, _0x1b9aef, _0x1eb196) {
    if (_0x9b9d8e) return ![];
    const _0x37ed8c = _0x3998ac;
    if (!_0x37ed8c || (_0x37ed8c['mode'] !== 'panning' && _0x37ed8c['mode'] !== 'zooming')) return ![];
    if (_0x37ed8c['nodeCount'] !== _0x316aa4 || _0x37ed8c['edgesRev'] !== _0x1b9aef) return ![];
    if (!shouldDefer({ nodeCount: _0x316aa4, edgesRev: _0x1b9aef, viewport: _0x1eb196 })) return ![];
    return ((_0x9b9d8e = !![]), !![]);
  }
  return { consumeShouldDefer: _0x3ac71d, delayMs: delayMs, remember: _0x39fe2b, reset: _0x52cf4c };
}
