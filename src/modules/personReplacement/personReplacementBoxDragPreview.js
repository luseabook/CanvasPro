export function applyManualBoxPreview(_0x266677, _0x3ac9e4) {
  (_0x266677?.['style']?.['setProperty']?.('--box-x', _0x3ac9e4['x'] * 0x64 + '%'),
    _0x266677?.['style']?.['setProperty']?.('--box-y', _0x3ac9e4['y'] * 0x64 + '%'),
    _0x266677?.['style']?.['setProperty']?.('--box-width', _0x3ac9e4['width'] * 0x64 + '%'),
    _0x266677?.['style']?.['setProperty']?.('--box-height', _0x3ac9e4['height'] * 0x64 + '%'));
}
export function getPersonReplacementBoxDragDistance(_0x15ab8c, _0x55d69b) {
  const _0x2d7cba = Number(_0x15ab8c?.['clientX']),
    _0x2d61d1 = Number(_0x15ab8c?.['clientY']);
  return Number['isFinite'](_0x2d7cba) && Number['isFinite'](_0x2d61d1)
    ? Math['hypot'](_0x2d7cba - _0x55d69b['startClientX'], _0x2d61d1 - _0x55d69b['startClientY'])
    : 0x0;
}
export function createPersonReplacementBoxDragPreview({
  getSession: _0x80451f,
  applyPreview: _0xa8faf0,
  threshold: _0x4aa2d6,
  windowObject: _0x11b7c9,
}) {
  let _0x2db681 = 0x0,
    _0x16f48e = null,
    _0x3f5620 = null;
  const _0x4650a5 = () => {
    _0x2db681 = 0x0;
    const _0x187c58 = _0x16f48e,
      _0x209485 = _0x3f5620;
    ((_0x16f48e = null), (_0x3f5620 = null));
    if (_0x187c58 && _0x209485 === _0x80451f()) _0xa8faf0(_0x187c58);
  };
  return {
    schedule(_0x2bcc35) {
      const _0xabf69b = _0x80451f();
      if (!_0xabf69b) return;
      ((_0x16f48e = { clientX: _0x2bcc35['clientX'], clientY: _0x2bcc35['clientY'] }),
        (_0x3f5620 = _0xabf69b));
      getPersonReplacementBoxDragDistance(_0x2bcc35, _0xabf69b) >= _0x4aa2d6 &&
        (_0xabf69b['hasDragged'] = !![]);
      if (_0x2db681) return;
      typeof _0x11b7c9?.['requestAnimationFrame'] === 'function'
        ? (_0x2db681 = _0x11b7c9['requestAnimationFrame'](_0x4650a5))
        : _0x4650a5();
    },
    cancel() {
      if (_0x2db681) _0x11b7c9?.['cancelAnimationFrame']?.(_0x2db681);
      ((_0x2db681 = 0x0), (_0x16f48e = null), (_0x3f5620 = null));
    },
  };
}
