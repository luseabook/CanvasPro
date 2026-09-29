export function createRendererRasterPaintSurface(
  _0x531553,
  {
    createBackingCanvas: createBackingCanvas = (_0x184a52, _0x6a74f6) =>
      typeof globalThis['OffscreenCanvas'] === 'function'
        ? new globalThis['OffscreenCanvas'](_0x184a52, _0x6a74f6)
        : null,
  } = {},
) {
  const _0x5d262e = _0x531553['getContext']?.('2d', { alpha: !![] }) || null;
  let _0x433644 = null,
    _0x4d72e2 = _0x5d262e;
  if (_0x5d262e)
    try {
      const _0x2926e2 = createBackingCanvas(
          Math['max'](0x1, _0x531553['width']),
          Math['max'](0x1, _0x531553['height']),
        ),
        _0x35e024 = _0x2926e2?.['getContext']?.('2d', { alpha: !![] });
      _0x35e024 && ((_0x433644 = _0x2926e2), (_0x4d72e2 = _0x35e024));
    } catch {}
  return {
    context: _0x4d72e2,
    resize(_0x147ad4, _0x6d483) {
      if (_0x531553['width'] !== _0x147ad4) _0x531553['width'] = _0x147ad4;
      if (_0x531553['height'] !== _0x6d483) _0x531553['height'] = _0x6d483;
      if (_0x433644) {
        if (_0x433644['width'] !== _0x147ad4) _0x433644['width'] = _0x147ad4;
        if (_0x433644['height'] !== _0x6d483) _0x433644['height'] = _0x6d483;
      }
    },
    present() {
      if (!_0x433644) return;
      ((_0x5d262e['globalCompositeOperation'] = 'copy'),
        (_0x5d262e['imageSmoothingEnabled'] = ![]),
        _0x5d262e['drawImage'](_0x433644, 0x0, 0x0));
    },
    release() {
      _0x433644 && ((_0x433644['width'] = 0x1), (_0x433644['height'] = 0x1));
    },
  };
}
