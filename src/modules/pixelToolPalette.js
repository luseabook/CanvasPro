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
function readCssToken(_0x16c0dd) {
  try {
    const _0x1b47eb = getRootElement();
    if (!_0x1b47eb || typeof getComputedStyle !== 'function') return '';
    if (_0x1b47eb.classList?.contains('is-canvas-theme-light')) {
      const _0x5dc5de = getComputedStyle(_0x1b47eb).getPropertyValue(_0x16c0dd).trim();
      if (_0x5dc5de) return _0x5dc5de;
    }
    const _0x30a462 = document.getElementById?.('v2-wrap');
    if (_0x30a462?.classList?.contains('theme-light')) {
      const _0x12ae79 = getComputedStyle(_0x30a462).getPropertyValue(_0x16c0dd).trim();
      if (_0x12ae79) return _0x12ae79;
    }
    return getComputedStyle(_0x1b47eb).getPropertyValue(_0x16c0dd).trim();
  } catch {
    return '';
  }
}
export function getPixelToolPalette() {
  return Object.fromEntries(
    Object.entries(TOKEN_BY_KEY).map(([_0x12464b, _0x5c490f]) => [
      _0x12464b,
      readCssToken(_0x5c490f) || FALLBACK_PIXEL_TOOL_PALETTE[_0x12464b],
    ]),
  );
}
export function createPixelCheckerboardPattern(_0x578a0b, _0x1c9d1d = 1) {
  if (!_0x578a0b) return null;
  const _0x34f38c = (typeof document !== 'undefined' && document) || _0x578a0b.canvas?.ownerDocument || null;
  if (!_0x34f38c?.createElement) return null;
  const _0x2a53ee = getPixelToolPalette(),
    _0x5f1458 = _0x34f38c.createElement('canvas'),
    _0x135263 = Math.max(4, Math.round(8 * (Number(_0x1c9d1d) || 1)));
  ((_0x5f1458.width = _0x135263 * 2), (_0x5f1458.height = _0x135263 * 2));
  const _0x4e9fcd = _0x5f1458.getContext('2d');
  if (!_0x4e9fcd) return null;
  return (
    (_0x4e9fcd.fillStyle = _0x2a53ee.checkerLight),
    _0x4e9fcd.fillRect(0, 0, _0x135263 * 2, _0x135263 * 2),
    (_0x4e9fcd.fillStyle = _0x2a53ee.checkerDark),
    _0x4e9fcd.fillRect(0, 0, _0x135263, _0x135263),
    _0x4e9fcd.fillRect(_0x135263, _0x135263, _0x135263, _0x135263),
    _0x578a0b.createPattern(_0x5f1458, 'repeat')
  );
}
