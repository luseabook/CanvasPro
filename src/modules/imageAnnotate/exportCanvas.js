import { getTextScalePair } from './textControls.js';
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from '../imageEditorBrushStyle.js';
import { drawNumberLabelCommand } from './numberLabels.js';
const canvasToBlob = (value, item, key) => new Promise((index) => value.toBlob(index, item, key)),
  renderCommandToNaturalCanvas = ({
    ctx: ctx,
    cmd: cmd,
    scaleX: scaleX,
    scaleY: scaleY,
    isEraseScene: isEraseScene,
    defaultTextColor: defaultTextColor,
    numberLabelBackgroundColor: numberLabelBackgroundColor = '',
  } = {}) => {
    if (isEraseScene) return;
    if (cmd.type === 'brush') {
      (ctx.save(),
        drawRoundBrushStroke(ctx, {
          points: mapBrushPoints(cmd.points, scaleX, scaleY),
          lineWidth: getBrushLineWidth(cmd.sizeWorld, scaleX, 'brush'),
          strokeStyle: cmd.color,
          fillStyle: cmd.color,
          globalCompositeOperation: 'source-over',
        }),
        ctx.restore());
      return;
    }
    if (cmd.type === 'eraser') {
      (ctx.save(),
        drawRoundBrushStroke(ctx, {
          points: mapBrushPoints(cmd.points, scaleX, scaleY),
          lineWidth: getEraserClearLineWidth(getBrushLineWidth(cmd.sizeWorld, scaleX, 'eraser')),
          strokeStyle: '#000',
          fillStyle: '#000',
          globalCompositeOperation: 'destination-out',
        }),
        ctx.restore());
      return;
    }
    if (cmd.type === 'rect') {
      const result = cmd.x1 * scaleX,
        data = cmd.y1 * scaleY,
        options = cmd.x2 * scaleX,
        target = cmd.y2 * scaleY,
        source = Math.min(result, options),
        next = Math.min(data, target),
        current = Math.abs(options - result),
        entry = Math.abs(target - data);
      (ctx.save(),
        (ctx.globalCompositeOperation = 'source-over'),
        (ctx.strokeStyle = cmd.color),
        (ctx.lineWidth = getBrushLineWidth(cmd.sizeWorld, scaleX, 'brush')),
        ctx.strokeRect(source, next, current, entry),
        ctx.restore());
      return;
    }
    if (cmd.type === 'text') {
      const record = cmd.x * scaleX,
        payload = cmd.y * scaleY,
        handle = Math.max(1, cmd.sizeWorld * scaleX),
        textScalePair = getTextScalePair(cmd),
        state = Number(cmd.rotation) || 0;
      (ctx.save(),
        (ctx.globalCompositeOperation = 'source-over'),
        (ctx.fillStyle = cmd.color || defaultTextColor),
        (ctx.font = handle + 'px sans-serif'),
        (ctx.textBaseline = 'top'),
        ctx.translate(record, payload),
        ctx.rotate(state),
        ctx.scale(textScalePair.scaleX, textScalePair.scaleY),
        ctx.fillText(String(cmd.text || ''), 0, 0),
        ctx.restore());
      return;
    }
    cmd.type === 'number-label' &&
      drawNumberLabelCommand({
        ctx: ctx,
        cmd: cmd,
        scaleX: scaleX,
        scaleY: scaleY,
        defaultColor: defaultTextColor,
        backgroundColor: numberLabelBackgroundColor,
      });
  };
export const exportAnnotateCanvasBlob = async ({
  documentRef: documentRef = null,
  node: node,
  imgEl: imgEl,
  imgUrl: imgUrl,
  commands: commands,
  useWhiteboardBase: useWhiteboardBase,
  isEraseScene: isEraseScene2,
  loadImage: loadImage,
  getCurrentFlipState: getCurrentFlipState,
  applyFlipTransformToContext: applyFlipTransformToContext,
  createSelectionMaskCanvas: createSelectionMaskCanvas,
  canvasWhiteColor: canvasWhiteColor,
  defaultTextColor: defaultTextColor2,
} = {}) => {
  const el = documentRef || globalThis.document;
  let box = null,
    naturalWidth = 0,
    naturalHeight = 0;
  useWhiteboardBase &&
    ((naturalWidth = Number(imgEl?.naturalWidth || imgEl?.width || 0)),
    (naturalHeight = Number(imgEl?.naturalHeight || imgEl?.height || 0)));
  (!naturalWidth || !naturalHeight || !useWhiteboardBase) &&
    ((box = await loadImage(imgUrl)),
    (naturalWidth = box.naturalWidth || box.width),
    (naturalHeight = box.naturalHeight || box.height));
  const box2 = el.createElement('canvas');
  ((box2.width = naturalWidth), (box2.height = naturalHeight));
  const ctx2 = box2.getContext('2d'),
    config = getCurrentFlipState();
  !isEraseScene2 &&
    ((ctx2.fillStyle = canvasWhiteColor),
    ctx2.fillRect(0, 0, naturalWidth, naturalHeight),
    ctx2.save(),
    applyFlipTransformToContext(ctx2, naturalWidth, naturalHeight, config));
  !useWhiteboardBase && ctx2.drawImage(box, 0, 0, naturalWidth, naturalHeight);
  const scaleX2 = naturalWidth / (node?.width || 1),
    scaleY2 = naturalHeight / (node?.height || 1);
  if (isEraseScene2) {
    const scope = createSelectionMaskCanvas(naturalWidth, naturalHeight, scaleX2, scaleY2);
    (ctx2.save(),
      (ctx2.globalCompositeOperation = 'destination-out'),
      ctx2.drawImage(scope, 0, 0),
      ctx2.restore());
  }
  (Array.isArray(commands) ? commands : []).forEach((cmd2) =>
    renderCommandToNaturalCanvas({
      ctx: ctx2,
      cmd: cmd2,
      scaleX: scaleX2,
      scaleY: scaleY2,
      isEraseScene: isEraseScene2,
      defaultTextColor: defaultTextColor2,
      numberLabelBackgroundColor: canvasWhiteColor,
    }),
  );
  !isEraseScene2 && ctx2.restore();
  const exportType = isEraseScene2 ? 'image/png' : 'image/jpeg',
    input = isEraseScene2 ? undefined : 0.9,
    blob = await canvasToBlob(box2, exportType, input);
  if (!blob) throw new Error('Canvas 导出失败');
  return { blob: blob, exportType: exportType, naturalWidth: naturalWidth, naturalHeight: naturalHeight };
};
