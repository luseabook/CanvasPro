import {
  buildBinaryBoundaryMask,
  floodFillRegion,
  paintFilledRegion,
  sealRegionToBoundary,
} from '../bucketFill.js';
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from '../imageEditorBrushStyle.js';
const getBoundaryCommands = (value, item) =>
  (Array.isArray(value) ? value : [])
    .slice(0, item)
    .filter((item2) => item2?.type === 'brush' || item2?.type === 'rect' || item2?.type === 'eraser');
export const buildSelectionMaskCanvas = ({
  documentRef: documentRef = null,
  commands: commands,
  naturalW: naturalW,
  naturalH: naturalH,
  scaleX: scaleX,
  scaleY: scaleY,
} = {}) => {
  const el = documentRef || globalThis.document,
    box = el.createElement('canvas');
  ((box.width = naturalW), (box.height = naturalH));
  const ctx = box.getContext('2d');
  if (!ctx) return box;
  return (
    (ctx.lineCap = 'round'),
    (ctx.lineJoin = 'round'),
    (Array.isArray(commands) ? commands : []).forEach((box2, key) => {
      if (box2.type === 'brush') {
        (ctx.save(),
          drawRoundBrushStroke(ctx, {
            points: mapBrushPoints(box2.points, scaleX, scaleY),
            lineWidth: getBrushLineWidth(box2.sizeWorld, scaleX, 'brush'),
            strokeStyle: '#fff',
            fillStyle: '#fff',
            globalCompositeOperation: 'source-over',
          }),
          ctx.restore());
        return;
      }
      if (box2.type === 'rect') {
        const index = box2.x1 * scaleX,
          result = box2.y1 * scaleY,
          data = box2.x2 * scaleX,
          options = box2.y2 * scaleY,
          target = Math.min(index, data),
          source = Math.min(result, options),
          next = Math.abs(data - index),
          current = Math.abs(options - result);
        (ctx.save(),
          (ctx.globalCompositeOperation = 'source-over'),
          (ctx.fillStyle = '#fff'),
          ctx.fillRect(target, source, next, current),
          ctx.restore());
        return;
      }
      if (box2.type === 'eraser') {
        (ctx.save(),
          drawRoundBrushStroke(ctx, {
            points: mapBrushPoints(box2.points, scaleX, scaleY),
            lineWidth: getEraserClearLineWidth(getBrushLineWidth(box2.sizeWorld, scaleX, 'eraser')),
            strokeStyle: '#000',
            fillStyle: '#000',
            globalCompositeOperation: 'destination-out',
          }),
          ctx.restore());
        return;
      }
      if (box2.type === 'fill') {
        const box3 = buildBinaryBoundaryMask({
            width: naturalW,
            height: naturalH,
            commands: getBoundaryCommands(commands, key),
            pointToPixel: (box4) => ({
              x: Number(box4?.x || 0) * scaleX,
              y: Number(box4?.y || 0) * scaleY,
            }),
            getStrokeWidth: (entry) => getBrushLineWidth(entry?.sizeWorld, scaleX, entry?.type),
          }),
          floodFillRegion2 = floodFillRegion(
            box3.mask,
            box3.width,
            box3.height,
            Math.floor(Number(box2.x || 0) * scaleX),
            Math.floor(Number(box2.y || 0) * scaleY),
          ),
          boundary = sealRegionToBoundary(floodFillRegion2, box3.mask, box3.width, box3.height);
        (ctx.save(),
          paintFilledRegion(ctx, boundary, naturalW, naturalH, {
            fillStyle: '#fff',
            globalCompositeOperation: 'source-over',
          }),
          ctx.restore());
      }
    }),
    box
  );
};
