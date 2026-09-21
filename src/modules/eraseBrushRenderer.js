import { drawRoundBrushStroke, getEraserClearLineWidth } from './imageEditorBrushStyle.js';
import { createPixelCheckerboardPattern, getPixelToolPalette } from './pixelToolPalette.js';
export function getEraseCanvasPalette() {
  const _0x4f2ed6 = getPixelToolPalette();
  return {
    eraseDark: _0x4f2ed6.maskPreviewStroke,
    maskPreviewFill: _0x4f2ed6.maskPreviewFill,
    brushLight: _0x4f2ed6.checkerLight,
    checkerAccent: _0x4f2ed6.checkerDark,
  };
}
export function createEraseCheckerboardPattern(_0x433d5d, _0x1645d0 = 1) {
  return createPixelCheckerboardPattern(_0x433d5d, _0x1645d0);
}
const OPAQUE_ERASER_SOURCE = 'black',
  OPAQUE_MASK_SOURCE = 'white';
export function drawEraseBrushCommand(
  _0x1cd532,
  {
    type: type = 'brush',
    points: points = [],
    lineWidth: lineWidth = 1,
    checkerPattern: checkerPattern = null,
    checkerZoom: checkerZoom = 1,
    checkerAlpha: checkerAlpha = 0.8,
    includeErasePass: includeErasePass = true,
  } = {},
) {
  if (!_0x1cd532 || !Array.isArray(points) || !points.length) return;
  const _0x27eb50 = type === 'eraser' ? 'eraser' : 'brush',
    _0x2a3bd3 = Math.max(1, Number(lineWidth) || 1);
  (_0x1cd532.save(),
    (_0x1cd532.lineCap = 'round'),
    (_0x1cd532.lineJoin = 'round'),
    (_0x1cd532.lineWidth = _0x2a3bd3));
  if (_0x27eb50 === 'eraser') {
    const _0x4b3865 = getEraserClearLineWidth(_0x2a3bd3);
    (drawRoundBrushStroke(_0x1cd532, {
      points: points,
      lineWidth: _0x4b3865,
      strokeStyle: OPAQUE_ERASER_SOURCE,
      fillStyle: OPAQUE_ERASER_SOURCE,
      globalCompositeOperation: 'destination-out',
    }),
      _0x1cd532.restore());
    return;
  }
  const _0x5f033a =
    checkerPattern || createEraseCheckerboardPattern(_0x1cd532, checkerZoom) || palette.checkerAccent;
  if (includeErasePass) {
    const _0x434586 = getEraserClearLineWidth(_0x2a3bd3);
    drawRoundBrushStroke(_0x1cd532, {
      points: points,
      lineWidth: _0x434586,
      strokeStyle: OPAQUE_ERASER_SOURCE,
      fillStyle: OPAQUE_ERASER_SOURCE,
      globalCompositeOperation: 'destination-out',
    });
  }
  (drawRoundBrushStroke(_0x1cd532, {
    points: points,
    lineWidth: _0x2a3bd3,
    strokeStyle: _0x5f033a,
    fillStyle: _0x5f033a,
    globalCompositeOperation: 'source-over',
    globalAlpha: Math.max(0, Math.min(1, Number(checkerAlpha) || 0.8)),
  }),
    _0x1cd532.restore());
}
export function drawEraseMaskCommand(
  _0x497c65,
  { type: type = 'brush', points: points = [], lineWidth: lineWidth = 1 } = {},
) {
  if (!_0x497c65 || !Array.isArray(points) || !points.length) return;
  const _0x2b5638 = getEraseCanvasPalette(),
    _0xd893f0 = type === 'eraser' ? 'eraser' : 'brush',
    _0x5e0fd5 = Math.max(1, Number(lineWidth) || 1);
  _0x497c65.save();
  const _0x18691e = _0xd893f0 === 'eraser' ? OPAQUE_ERASER_SOURCE : OPAQUE_MASK_SOURCE,
    _0x11665c = _0xd893f0 === 'eraser' ? getEraserClearLineWidth(_0x5e0fd5) : _0x5e0fd5;
  (drawRoundBrushStroke(_0x497c65, {
    points: points,
    lineWidth: _0x11665c,
    strokeStyle: _0x18691e,
    fillStyle: _0x18691e,
    globalCompositeOperation: _0xd893f0 === 'eraser' ? 'destination-out' : 'source-over',
  }),
    _0x497c65.restore());
}
export function compositeCheckerMask(
  _0x26a9ce,
  {
    maskCanvas: maskCanvas = null,
    width: width = 0,
    height: height = 0,
    checkerPattern: checkerPattern = null,
    checkerZoom: checkerZoom = 1,
    checkerAlpha: checkerAlpha = 0.8,
  } = {},
) {
  if (!_0x26a9ce || !maskCanvas) return;
  const _0x1ddfd6 = getEraseCanvasPalette(),
    _0x2b52ee = Math.max(1, Number(width) || 0),
    _0x2c611c = Math.max(1, Number(height) || 0),
    _0xaef315 =
      checkerPattern || createEraseCheckerboardPattern(_0x26a9ce, checkerZoom) || _0x1ddfd6.checkerAccent,
    _0x16de3c = Math.max(0, Math.min(1, Number(checkerAlpha) || 0.8));
  (_0x26a9ce.save(),
    (_0x26a9ce.globalCompositeOperation = 'source-over'),
    (_0x26a9ce.globalAlpha = _0x16de3c),
    (_0x26a9ce.fillStyle = _0xaef315),
    _0x26a9ce.fillRect(0, 0, _0x2b52ee, _0x2c611c),
    (_0x26a9ce.globalCompositeOperation = 'destination-in'),
    (_0x26a9ce.globalAlpha = 1),
    _0x26a9ce.drawImage(maskCanvas, 0, 0, _0x2b52ee, _0x2c611c),
    _0x26a9ce.restore());
}
export function compositeSolidMaskPreview(
  _0x64e1e3,
  { maskCanvas: maskCanvas = null, width: width = 0, height: height = 0 } = {},
) {
  if (!_0x64e1e3 || !maskCanvas) return;
  const _0x255f51 = getEraseCanvasPalette(),
    _0x45072f = Math.max(1, Number(width) || 0),
    _0x3073f6 = Math.max(1, Number(height) || 0),
    _0x2cb719 = _0x255f51.maskPreviewFill || _0x255f51.eraseDark;
  (_0x64e1e3.save(),
    (_0x64e1e3.globalCompositeOperation = 'source-over'),
    (_0x64e1e3.globalAlpha = 1),
    (_0x64e1e3.fillStyle = _0x2cb719),
    _0x64e1e3.fillRect(0, 0, _0x45072f, _0x3073f6),
    (_0x64e1e3.globalCompositeOperation = 'destination-in'),
    _0x64e1e3.drawImage(maskCanvas, 0, 0, _0x45072f, _0x3073f6),
    _0x64e1e3.restore());
}
