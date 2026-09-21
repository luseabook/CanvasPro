export function beginStoryboardCustomGridLineDrag({
  event: _0x38b4b8,
  axis: _0xa1174d,
  index: _0x5d4ac0,
  grid: _0x9d8e1d,
  rootEl: _0x33718b,
  layout: _0x481bd5,
  endDrag: _0x4ba9df,
  onDragMove: _0x598420,
  ensureVisualState: _0x5ebeef,
} = {}) {
  (_0x38b4b8?.preventDefault?.(), _0x38b4b8?.stopPropagation?.());
  if (!_0x9d8e1d || !_0x481bd5) return null;
  (_0x4ba9df?.(), _0x5ebeef?.());
  const _0x32714d = (_0x3e46f0) => _0x598420?.(_0x3e46f0),
    _0x46e6a0 = () => _0x4ba9df?.(),
    _0x4870c6 = {
      axis: _0xa1174d,
      index: _0x5d4ac0,
      startClientX: Number(_0x38b4b8?.clientX) || 0,
      startClientY: Number(_0x38b4b8?.clientY) || 0,
      startColumns: [..._0x481bd5.columns],
      startRows: [..._0x481bd5.rowTracks],
      rect: _0x9d8e1d.getBoundingClientRect(),
      onMove: _0x32714d,
      onEnd: _0x46e6a0,
    };
  _0x33718b?.classList?.add('is-custom-grid-dragging');
  try {
    _0x38b4b8?.currentTarget?.setPointerCapture?.(_0x38b4b8.pointerId);
  } catch (_0x303623) {}
  return (
    document.addEventListener('pointermove', _0x32714d),
    document.addEventListener('pointerup', _0x46e6a0, { once: true }),
    document.addEventListener('pointercancel', _0x46e6a0, { once: true }),
    _0x4870c6
  );
}
export function buildStoryboardCustomGridDragDraft({
  event: _0x4305f1,
  drag: _0xcd5230,
  draft: _0x441996,
  adjustTracks: _0x5bdbea,
} = {}) {
  if (!_0xcd5230 || !_0x441996) return null;
  const _0x15dcb8 = _0xcd5230.axis === 'columns',
    _0x39d693 = _0x15dcb8 ? _0xcd5230.rect.width : _0xcd5230.rect.height,
    _0x42f965 = Math.max(1, _0x39d693),
    _0x1df9aa = _0x15dcb8
      ? (Number(_0x4305f1?.clientX) || 0) - _0xcd5230.startClientX
      : (Number(_0x4305f1?.clientY) || 0) - _0xcd5230.startClientY,
    _0x1ccb4d = _0x15dcb8 ? _0xcd5230.startColumns : _0xcd5230.startRows,
    _0x2733d6 = _0x1ccb4d.reduce((_0x5d57f7, _0x459bba) => _0x5d57f7 + _0x459bba, 0),
    _0x2eb0e3 = _0x5bdbea?.(_0x1ccb4d, _0xcd5230.index, (_0x1df9aa / _0x42f965) * _0x2733d6);
  if (!Array.isArray(_0x2eb0e3)) return null;
  return { columns: _0x15dcb8 ? _0x2eb0e3 : _0x441996.columns, rows: _0x15dcb8 ? _0x441996.rows : _0x2eb0e3 };
}
export function endStoryboardCustomGridLineDrag({ drag: _0x2c1781, rootEl: _0x2d58bf } = {}) {
  if (!_0x2c1781) return null;
  return (
    document.removeEventListener('pointermove', _0x2c1781.onMove),
    document.removeEventListener('pointerup', _0x2c1781.onEnd),
    document.removeEventListener('pointercancel', _0x2c1781.onEnd),
    _0x2d58bf?.classList?.remove('is-custom-grid-dragging'),
    null
  );
}
