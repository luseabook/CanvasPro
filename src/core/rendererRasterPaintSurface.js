export function createRendererRasterPaintSurface(
  box,
  {
    createBackingCanvas: createBackingCanvas = (value, item) =>
      typeof globalThis['OffscreenCanvas'] === 'function'
        ? new globalThis['OffscreenCanvas'](value, item)
        : null,
  } = {},
) {
  const ctx = box['getContext']?.('2d', { alpha: true }) || null;
  let box2 = null,
    context = ctx;
  if (ctx)
    try {
      const el = createBackingCanvas(Math['max'](1, box['width']), Math['max'](1, box['height'])),
        key = el?.['getContext']?.('2d', { alpha: true });
      key && ((box2 = el), (context = key));
    } catch {}
  return {
    context: context,
    resize(index, result) {
      if (box['width'] !== index) box['width'] = index;
      if (box['height'] !== result) box['height'] = result;
      if (box2) {
        if (box2['width'] !== index) box2['width'] = index;
        if (box2['height'] !== result) box2['height'] = result;
      }
    },
    present() {
      if (!box2) return;
      ((ctx['globalCompositeOperation'] = 'copy'),
        (ctx['imageSmoothingEnabled'] = false),
        ctx['drawImage'](box2, 0, 0));
    },
    release() {
      box2 && ((box2['width'] = 1), (box2['height'] = 1));
    },
  };
}
