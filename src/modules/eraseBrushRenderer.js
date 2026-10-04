import { drawRoundBrushStroke, getEraserClearLineWidth } from './imageEditorBrushStyle.js';
import { createPixelCheckerboardPattern, getPixelToolPalette } from './pixelToolPalette.js';
export function getEraseCanvasPalette() {
  const eraseDark = getPixelToolPalette();
  return {
    eraseDark: eraseDark.maskPreviewStroke,
    maskPreviewFill: eraseDark.maskPreviewFill,
    brushLight: eraseDark.checkerLight,
    checkerAccent: eraseDark.checkerDark,
  };
}
export function createEraseCheckerboardPattern(value, item = 1) {
  return createPixelCheckerboardPattern(value, item);
}
const OPAQUE_ERASER_SOURCE = 'black',
  OPAQUE_MASK_SOURCE = 'white';
export function drawEraseBrushCommand(
  ctx,
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
  if (!ctx || !Array.isArray(points) || !points.length) return;
  const key = type === 'eraser' ? 'eraser' : 'brush',
    lineWidth2 = Math.max(1, Number(lineWidth) || 1);
  (ctx.save(), (ctx.lineCap = 'round'), (ctx.lineJoin = 'round'), (ctx.lineWidth = lineWidth2));
  if (key === 'eraser') {
    const lineWidth3 = getEraserClearLineWidth(lineWidth2);
    (drawRoundBrushStroke(ctx, {
      points: points,
      lineWidth: lineWidth3,
      strokeStyle: OPAQUE_ERASER_SOURCE,
      fillStyle: OPAQUE_ERASER_SOURCE,
      globalCompositeOperation: 'destination-out',
    }),
      ctx.restore());
    return;
  }
  const strokeStyle =
    checkerPattern || createEraseCheckerboardPattern(ctx, checkerZoom) || palette.checkerAccent;
  if (includeErasePass) {
    const lineWidth4 = getEraserClearLineWidth(lineWidth2);
    drawRoundBrushStroke(ctx, {
      points: points,
      lineWidth: lineWidth4,
      strokeStyle: OPAQUE_ERASER_SOURCE,
      fillStyle: OPAQUE_ERASER_SOURCE,
      globalCompositeOperation: 'destination-out',
    });
  }
  (drawRoundBrushStroke(ctx, {
    points: points,
    lineWidth: lineWidth2,
    strokeStyle: strokeStyle,
    fillStyle: strokeStyle,
    globalCompositeOperation: 'source-over',
    globalAlpha: Math.max(0, Math.min(1, Number(checkerAlpha) || 0.8)),
  }),
    ctx.restore());
}
export function drawEraseMaskCommand(
  ctx2,
  { type: type = 'brush', points: points = [], lineWidth: lineWidth = 1 } = {},
) {
  if (!ctx2 || !Array.isArray(points) || !points.length) return;
  const eraseCanvasPalette = getEraseCanvasPalette(),
    globalCompositeOperation = type === 'eraser' ? 'eraser' : 'brush',
    index = Math.max(1, Number(lineWidth) || 1);
  ctx2.save();
  const strokeStyle2 = globalCompositeOperation === 'eraser' ? OPAQUE_ERASER_SOURCE : OPAQUE_MASK_SOURCE,
    lineWidth5 = globalCompositeOperation === 'eraser' ? getEraserClearLineWidth(index) : index;
  (drawRoundBrushStroke(ctx2, {
    points: points,
    lineWidth: lineWidth5,
    strokeStyle: strokeStyle2,
    fillStyle: strokeStyle2,
    globalCompositeOperation: globalCompositeOperation === 'eraser' ? 'destination-out' : 'source-over',
  }),
    ctx2.restore());
}
export function compositeCheckerMask(
  ctx3,
  {
    maskCanvas: maskCanvas = null,
    width: width = 0,
    height: height = 0,
    checkerPattern: checkerPattern = null,
    checkerZoom: checkerZoom = 1,
    checkerAlpha: checkerAlpha = 0.8,
  } = {},
) {
  if (!ctx3 || !maskCanvas) return;
  const eraseCanvasPalette2 = getEraseCanvasPalette(),
    result = Math.max(1, Number(width) || 0),
    data = Math.max(1, Number(height) || 0),
    options =
      checkerPattern ||
      createEraseCheckerboardPattern(ctx3, checkerZoom) ||
      eraseCanvasPalette2.checkerAccent,
    target = Math.max(0, Math.min(1, Number(checkerAlpha) || 0.8));
  (ctx3.save(),
    (ctx3.globalCompositeOperation = 'source-over'),
    (ctx3.globalAlpha = target),
    (ctx3.fillStyle = options),
    ctx3.fillRect(0, 0, result, data),
    (ctx3.globalCompositeOperation = 'destination-in'),
    (ctx3.globalAlpha = 1),
    ctx3.drawImage(maskCanvas, 0, 0, result, data),
    ctx3.restore());
}
export function compositeSolidMaskPreview(
  ctx4,
  { maskCanvas: maskCanvas = null, width: width = 0, height: height = 0 } = {},
) {
  if (!ctx4 || !maskCanvas) return;
  const eraseCanvasPalette3 = getEraseCanvasPalette(),
    source = Math.max(1, Number(width) || 0),
    next = Math.max(1, Number(height) || 0),
    current = eraseCanvasPalette3.maskPreviewFill || eraseCanvasPalette3.eraseDark;
  (ctx4.save(),
    (ctx4.globalCompositeOperation = 'source-over'),
    (ctx4.globalAlpha = 1),
    (ctx4.fillStyle = current),
    ctx4.fillRect(0, 0, source, next),
    (ctx4.globalCompositeOperation = 'destination-in'),
    ctx4.drawImage(maskCanvas, 0, 0, source, next),
    ctx4.restore());
}
