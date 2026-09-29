const CLOSE_HANDLER_PROP = '__nodeToolbarFullscreenClose';
export function closeExistingNodeToolbarFullscreen(_0x13e6be, _0x2229c4 = document) {
  const _0x1e748a = _0x2229c4?.['querySelector']?.(_0x13e6be);
  if (!_0x1e748a) return ![];
  const _0x2d0a8b = _0x1e748a[CLOSE_HANDLER_PROP];
  if (typeof _0x2d0a8b === 'function') _0x2d0a8b();
  else _0x1e748a['remove']?.();
  return !![];
}
export function bindNodeToolbarFullscreenOverlay(_0x4e1e04, { onClose: _0xa22432 } = {}) {
  if (!_0x4e1e04) return () => {};
  let _0x4694f0 = ![];
  const _0x254c23 = () => {
    if (_0x4694f0) return;
    ((_0x4694f0 = !![]), document['removeEventListener']?.('keydown', _0x35c42f, !![]));
    try {
      _0xa22432?.();
    } finally {
      (_0x4e1e04['remove']?.(), delete _0x4e1e04[CLOSE_HANDLER_PROP]);
    }
  };
  function _0x35c42f(_0x1d4f2d) {
    if (_0x1d4f2d?.['key'] !== 'Escape') return;
    (_0x1d4f2d['preventDefault']?.(), _0x254c23());
  }
  return (
    (_0x4e1e04[CLOSE_HANDLER_PROP] = _0x254c23),
    document['addEventListener']?.('keydown', _0x35c42f, !![]),
    _0x254c23
  );
}
