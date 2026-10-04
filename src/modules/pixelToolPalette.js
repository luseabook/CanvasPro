const FALLBACK_PIXEL_TOOL_PALETTE = Object.freeze({
    checkerLight: 'white',
    checkerDark: 'rgba(0, 0, 0, 0.12)',
    maskPreviewFill: 'rgba(0, 0, 0, 0.5)',
    maskPreviewStroke: 'rgba(0, 0, 0, 0.9)',
    toolCursorStroke: 'white',
    toolCursorFill: 'transparent',
    selectionOverlay: 'rgba(0, 0, 0, 0.5)',
  }),
  TOKEN_BY_KEY = Object.freeze({
    checkerLight: '--pixel-checker-light',
    checkerDark: '--pixel-checker-dark',
    maskPreviewFill: '--pixel-mask-preview-fill',
    maskPreviewStroke: '--pixel-mask-preview-stroke',
    toolCursorStroke: '--pixel-tool-cursor-stroke',
    toolCursorFill: '--pixel-tool-cursor-fill',
    selectionOverlay: '--pixel-selection-overlay',
  });
function getRootElement() {
  try {
    return typeof document !== 'undefined' ? document.documentElement : null;
  } catch {
    return null;
  }
}
function readCssToken(value) {
  try {
    const el = getRootElement();
    if (!el || typeof getComputedStyle !== 'function') return '';
    if (el.classList?.contains('is-canvas-theme-light')) {
      const computedStyle = getComputedStyle(el).getPropertyValue(value).trim();
      if (computedStyle) return computedStyle;
    }
    const el2 = document.getElementById?.('v2-wrap');
    if (el2?.classList?.contains('theme-light')) {
      const computedStyle2 = getComputedStyle(el2).getPropertyValue(value).trim();
      if (computedStyle2) return computedStyle2;
    }
    return getComputedStyle(el).getPropertyValue(value).trim();
  } catch {
    return '';
  }
}
export function getPixelToolPalette() {
  return Object.fromEntries(
    Object.entries(TOKEN_BY_KEY).map(([item, key]) => [
      item,
      readCssToken(key) || FALLBACK_PIXEL_TOOL_PALETTE[item],
    ]),
  );
}
export function createPixelCheckerboardPattern(canvas, index = 1) {
  if (!canvas) return null;
  const el3 = (typeof document !== 'undefined' && document) || canvas.canvas?.ownerDocument || null;
  if (!el3?.createElement) return null;
  const pixelToolPalette = getPixelToolPalette(),
    box = el3.createElement('canvas'),
    result = Math.max(4, Math.round(8 * (Number(index) || 1)));
  ((box.width = result * 2), (box.height = result * 2));
  const ctx = box.getContext('2d');
  if (!ctx) return null;
  return (
    (ctx.fillStyle = pixelToolPalette.checkerLight),
    ctx.fillRect(0, 0, result * 2, result * 2),
    (ctx.fillStyle = pixelToolPalette.checkerDark),
    ctx.fillRect(0, 0, result, result),
    ctx.fillRect(result, result, result, result),
    canvas.createPattern(box, 'repeat')
  );
}
