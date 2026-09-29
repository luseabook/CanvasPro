export function startMediaProgressDragSession({
  target: target = globalThis['window'],
  pointerId: pointerId = null,
  onMove: _0x275201,
  onEnd: _0x5d07c3,
  onCancel: onCancel = _0x5d07c3,
  capture: capture = !![],
} = {}) {
  let _0x3b8c4a = !![];
  const _0xaeeb44 = (_0x4222c1) =>
      pointerId == null || _0x4222c1?.['pointerId'] == null || _0x4222c1['pointerId'] === pointerId,
    _0x92d8c1 = (_0x5db957) => {
      if (!_0x3b8c4a || !_0xaeeb44(_0x5db957)) return;
      _0x275201?.(_0x5db957);
    },
    _0x3e8c4f = () => {
      if (!_0x3b8c4a) return ![];
      return (
        (_0x3b8c4a = ![]),
        target?.['removeEventListener']?.('pointermove', _0x92d8c1, capture),
        target?.['removeEventListener']?.('pointerup', _0x176646, capture),
        target?.['removeEventListener']?.('pointercancel', _0x343cf4, capture),
        target?.['removeEventListener']?.('blur', _0x343cf4, capture),
        !![]
      );
    },
    _0x176646 = (_0x21181d) => {
      if (!_0xaeeb44(_0x21181d) || !_0x3e8c4f()) return;
      _0x5d07c3?.(_0x21181d);
    },
    _0x343cf4 = (_0x5eb44a) => {
      if (_0x5eb44a?.['type'] !== 'blur' && !_0xaeeb44(_0x5eb44a)) return;
      if (!_0x3e8c4f()) return;
      onCancel?.(_0x5eb44a);
    };
  return (
    target?.['addEventListener']?.('pointermove', _0x92d8c1, capture),
    target?.['addEventListener']?.('pointerup', _0x176646, capture),
    target?.['addEventListener']?.('pointercancel', _0x343cf4, capture),
    target?.['addEventListener']?.('blur', _0x343cf4, capture),
    {
      cancel: _0x343cf4,
      dispose: _0x3e8c4f,
      get active() {
        return _0x3b8c4a;
      },
    }
  );
}
