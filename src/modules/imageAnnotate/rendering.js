import { getCachedSealedFillRegion, paintFilledRegion } from '../bucketFill.js';
import {
  createEraseCheckerboardPattern,
  drawEraseMaskCommand,
  drawEraseBrushCommand,
  compositeSolidMaskPreview,
} from '../eraseBrushRenderer.js';
import {
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
} from '../imageEditorBrushStyle.js';
import {
  getTextScalePair,
  TEXT_CONTROL_BUTTON_RADIUS,
  TEXT_CONTROL_SIDE_HANDLE_RADIUS,
} from './textControls.js';
import { drawNumberLabelCommand } from './numberLabels.js';
const getCanvasRenderSize = (el) => ({
    width: Number(el?.style?.width?.replace('px', '')) || 1,
    height: Number(el?.style?.height?.replace('px', '')) || 1,
  }),
  getCommandPoints = (value, item) => mapBrushPoints(value?.points, item, item),
  drawTextControlButton = (ctx, box, handler, key) => {
    (ctx.save(),
      ctx.beginPath(),
      ctx.arc(box.x, box.y, TEXT_CONTROL_BUTTON_RADIUS, 0, Math.PI * 2),
      (ctx.fillStyle = key.fill),
      (ctx.strokeStyle = key.stroke),
      (ctx.lineWidth = 1.5),
      ctx.fill(),
      ctx.stroke(),
      (ctx.strokeStyle = key.icon),
      (ctx.fillStyle = key.icon),
      (ctx.lineWidth = 1.6),
      (ctx.lineCap = 'round'),
      (ctx.lineJoin = 'round'),
      handler(ctx, box),
      ctx.restore());
  },
  getBoundaryCommands = (list, index) =>
    list
      .slice(0, index)
      .filter((item2) => item2?.type === 'brush' || item2?.type === 'rect' || item2?.type === 'eraser');
export const drawTextSelectionControls = ({ ctx: ctx2, geom: geom, resolveCssVar: resolveCssVar } = {}) => {
  if (!ctx2 || !geom) return;
  const stroke = resolveCssVar('--blue-border-focus') || ctx2.strokeStyle,
    fill = resolveCssVar('--canvas-white') || ctx2.fillStyle,
    icon = resolveCssVar('--bg') || resolveCssVar('--text-primary') || stroke,
    result = { stroke: stroke, fill: fill, icon: icon },
    [box2, box3, box4, box5] = geom.corners;
  (ctx2.save(),
    (ctx2.strokeStyle = stroke),
    (ctx2.lineWidth = 1.5),
    ctx2.setLineDash([]),
    ctx2.beginPath(),
    ctx2.moveTo(box2.x, box2.y),
    ctx2.lineTo(box3.x, box3.y),
    ctx2.lineTo(box4.x, box4.y),
    ctx2.lineTo(box5.x, box5.y),
    ctx2.closePath(),
    ctx2.stroke(),
    Object.values(geom.handles || {})
      .filter((item3) => item3 && !Array.isArray(item3))
      .forEach((box6) => {
        (ctx2.beginPath(),
          ctx2.arc(box6.x, box6.y, TEXT_CONTROL_SIDE_HANDLE_RADIUS, 0, Math.PI * 2),
          (ctx2.fillStyle = fill),
          (ctx2.strokeStyle = stroke),
          (ctx2.lineWidth = 1.5),
          ctx2.fill(),
          ctx2.stroke());
      }),
    ctx2.restore(),
    drawTextControlButton(
      ctx2,
      box2,
      (ctx3, box7) => {
        (ctx3.beginPath(),
          ctx3.moveTo(box7.x - 3, box7.y - 3),
          ctx3.lineTo(box7.x + 3, box7.y + 3),
          ctx3.moveTo(box7.x + 3, box7.y - 3),
          ctx3.lineTo(box7.x - 3, box7.y + 3),
          ctx3.stroke());
      },
      result,
    ),
    drawTextControlButton(
      ctx2,
      box5,
      (data, box8) => {
        (data.strokeRect(box8.x - 2, box8.y - 4, 6, 6), data.strokeRect(box8.x - 5, box8.y - 1, 6, 6));
      },
      result,
    ),
    drawTextControlButton(
      ctx2,
      box3,
      (ctx4, box9) => {
        (ctx4.beginPath(),
          ctx4.arc(box9.x, box9.y, 4, Math.PI * 0.15, Math.PI * 1.55),
          ctx4.stroke(),
          ctx4.beginPath(),
          ctx4.moveTo(box9.x + 4, box9.y - 3),
          ctx4.lineTo(box9.x + 5, box9.y + 2),
          ctx4.lineTo(box9.x + 1, box9.y),
          ctx4.stroke());
      },
      result,
    ),
    drawTextControlButton(
      ctx2,
      box4,
      (ctx5, box10) => {
        (ctx5.beginPath(),
          ctx5.moveTo(box10.x - 4, box10.y + 4),
          ctx5.lineTo(box10.x + 4, box10.y - 4),
          ctx5.moveTo(box10.x + 1, box10.y - 4),
          ctx5.lineTo(box10.x + 4, box10.y - 4),
          ctx5.lineTo(box10.x + 4, box10.y - 1),
          ctx5.moveTo(box10.x - 1, box10.y + 4),
          ctx5.lineTo(box10.x - 4, box10.y + 4),
          ctx5.lineTo(box10.x - 4, box10.y + 1),
          ctx5.stroke());
      },
      result,
    ));
};
export const renderEraseSceneCommands = ({
  documentRef: documentRef = null,
  canvasEl: canvasEl,
  ctx: ctx6,
  viewport: viewport,
  commands: commands = [],
  draft: draft = null,
  checkerPattern: checkerPattern,
  eraseMaskCanvasEl: eraseMaskCanvasEl = null,
} = {}) => {
  if (!canvasEl || !ctx6) return eraseMaskCanvasEl;
  const el2 = documentRef || globalThis.document,
    options = viewport?.zoom || 1,
    width = getCanvasRenderSize(canvasEl),
    target = Math.max(1, Math.round(width.width)),
    source = Math.max(1, Math.round(width.height));
  let maskCanvas = eraseMaskCanvasEl;
  (!maskCanvas || maskCanvas.width !== target || maskCanvas.height !== source) &&
    ((maskCanvas = el2.createElement('canvas')), (maskCanvas.width = target), (maskCanvas.height = source));
  const ctx7 = maskCanvas.getContext('2d');
  if (!ctx7) return maskCanvas;
  (ctx7.clearRect(0, 0, target, source), (ctx7.lineCap = 'round'), (ctx7.lineJoin = 'round'));
  const run = (type) => {
    if (!type || (type.type !== 'brush' && type.type !== 'eraser')) return;
    const points = getCommandPoints(type, options);
    if (!points.length) return;
    drawEraseMaskCommand(ctx7, {
      type: type.type,
      points: points,
      lineWidth: getBrushLineWidth(type.sizeWorld, options, type.type),
    });
  };
  (Array.isArray(commands) ? commands : []).forEach(run);
  if (draft) run(draft);
  return (
    compositeSolidMaskPreview(ctx6, {
      maskCanvas: maskCanvas,
      width: width.width,
      height: width.height,
    }),
    maskCanvas
  );
};
export const renderCommands = ({
  ctx: ctx8,
  viewport: viewport2,
  canvasEl: canvasEl2,
  commands: commands = [],
  isDraft: isDraft = false,
  isEraseScene: isEraseScene = false,
  checkerPattern: checkerPattern2,
  defaultTextColor: defaultTextColor,
  getTextGeometry: getTextGeometry,
  selectedTextCommandIndex: selectedTextCommandIndex = null,
  selectedCommandsRef: selectedCommandsRef = null,
  resolveCssVar: resolveCssVar2,
  fillRegionCache: fillRegionCache = null,
  numberLabelBackgroundColor: numberLabelBackgroundColor = '',
} = {}) => {
  if (!ctx8 || !canvasEl2) return;
  const checkerZoom = viewport2?.zoom || 1,
    width2 = getCanvasRenderSize(canvasEl2);
  commands.forEach((strokeStyle, next) => {
    if (strokeStyle.type === 'brush') {
      ctx8.save();
      const points2 = getCommandPoints(strokeStyle, checkerZoom);
      if (!points2.length) {
        ctx8.restore();
        return;
      }
      const lineWidth = getBrushLineWidth(strokeStyle.sizeWorld, checkerZoom, 'brush');
      if (isEraseScene) {
        const checkerPattern3 =
          createEraseCheckerboardPattern(ctx8, checkerZoom) ||
          checkerPattern2 ||
          resolveCssVar2?.('--white-20') ||
          'transparent';
        drawEraseBrushCommand(ctx8, {
          type: 'brush',
          points: points2,
          lineWidth: lineWidth,
          checkerPattern: checkerPattern3,
          checkerZoom: checkerZoom,
          checkerAlpha: 0.8,
          includeErasePass: false,
        });
      } else
        drawRoundBrushStroke(ctx8, {
          points: points2,
          lineWidth: lineWidth,
          strokeStyle: strokeStyle.color,
          fillStyle: strokeStyle.color,
          globalCompositeOperation: 'source-over',
        });
      ctx8.restore();
      return;
    }
    if (strokeStyle.type === 'eraser') {
      ctx8.save();
      const points3 = getCommandPoints(strokeStyle, checkerZoom);
      if (!points3.length) {
        ctx8.restore();
        return;
      }
      (drawRoundBrushStroke(ctx8, {
        points: points3,
        lineWidth: getEraserClearLineWidth(getBrushLineWidth(strokeStyle.sizeWorld, checkerZoom, 'eraser')),
        strokeStyle: 'black',
        fillStyle: 'black',
        globalCompositeOperation: 'destination-out',
      }),
        ctx8.restore());
      return;
    }
    if (strokeStyle.type === 'rect') {
      const current = strokeStyle.x1 * checkerZoom,
        entry = strokeStyle.y1 * checkerZoom,
        record = strokeStyle.x2 * checkerZoom,
        payload = strokeStyle.y2 * checkerZoom,
        handle = Math.min(current, record),
        state = Math.min(entry, payload),
        config = Math.abs(record - current),
        scope = Math.abs(payload - entry);
      (ctx8.save(),
        (ctx8.globalCompositeOperation = 'source-over'),
        (ctx8.strokeStyle = strokeStyle.color),
        (ctx8.lineWidth = getBrushLineWidth(strokeStyle.sizeWorld, checkerZoom, 'brush')));
      if (isDraft) ctx8.setLineDash([6, 5]);
      (ctx8.strokeRect(handle, state, config, scope), ctx8.restore());
      return;
    }
    if (strokeStyle.type === 'text') {
      const input = strokeStyle.x * checkerZoom,
        output = strokeStyle.y * checkerZoom,
        value2 = Math.max(1, strokeStyle.sizeWorld * checkerZoom),
        { scaleX: scaleX, scaleY: scaleY } = getTextScalePair(strokeStyle),
        value3 = Number(strokeStyle.rotation) || 0;
      (ctx8.save(),
        (ctx8.globalCompositeOperation = 'source-over'),
        (ctx8.fillStyle = strokeStyle.color || defaultTextColor),
        (ctx8.font = value2 + 'px sans-serif'),
        (ctx8.textBaseline = 'top'));
      const value4 = String(strokeStyle.text || '');
      (ctx8.translate(input, output),
        ctx8.rotate(value3),
        ctx8.scale(scaleX, scaleY),
        ctx8.fillText(value4, 0, 0),
        ctx8.restore());
      if (!isDraft && commands === selectedCommandsRef && selectedTextCommandIndex === next) {
        const geom2 = getTextGeometry?.(strokeStyle, viewport2);
        geom2 && drawTextSelectionControls({ ctx: ctx8, geom: geom2, resolveCssVar: resolveCssVar2 });
      }
      return;
    }
    if (strokeStyle.type === 'number-label') {
      drawNumberLabelCommand({
        ctx: ctx8,
        cmd: strokeStyle,
        scaleX: checkerZoom,
        scaleY: checkerZoom,
        defaultColor: defaultTextColor,
        backgroundColor: numberLabelBackgroundColor,
      });
      return;
    }
    if (strokeStyle.type === 'fill') {
      const seedX = Math.floor(Number(strokeStyle.x || 0) * checkerZoom),
        seedY = Math.floor(Number(strokeStyle.y || 0) * checkerZoom),
        fillStyle = strokeStyle.color || defaultTextColor,
        cachedSealedFillRegion = getCachedSealedFillRegion({
          cache: fillRegionCache,
          width: width2.width,
          height: width2.height,
          zoom: checkerZoom,
          fillCommand: strokeStyle,
          boundaryCommands: getBoundaryCommands(commands, next),
          seedX: seedX,
          seedY: seedY,
          extraKey: 'color:' + fillStyle,
          pointToPixel: (box11) => ({
            x: Number(box11?.x || 0) * checkerZoom,
            y: Number(box11?.y || 0) * checkerZoom,
          }),
          getStrokeWidth: (value5) => getBrushLineWidth(value5?.sizeWorld, checkerZoom, value5?.type),
        });
      (ctx8.save(),
        paintFilledRegion(ctx8, cachedSealedFillRegion, width2.width, width2.height, {
          fillStyle: fillStyle,
          globalCompositeOperation: 'source-over',
        }),
        ctx8.restore());
    }
  });
};
