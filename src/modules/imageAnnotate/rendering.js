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
} from '../imageEditorBrushStyle.js';
import {
  getTextLayout,
  getTextRotationHandle,
  getTextScalePair,
  TEXT_CONTROL_BUTTON_RADIUS,
  TEXT_CONTROL_SIDE_HANDLE_RADIUS,
} from './textControls.js';
import { drawNumberLabelCommand } from './numberLabels.js';
import { getArrowGeometry } from './arrowGeometry.js';
import {
  getWhiteboardShapeBounds,
  isClosedWhiteboardShape,
  traceWhiteboardShapePath,
} from './whiteboardShapes.js';
const getCanvasRenderSize = (el) => ({
    width: Number(el?.['style']?.['width']?.['replace']('px', '')) || 1,
    height: Number(el?.['style']?.['height']?.['replace']('px', '')) || 1,
  }),
  getViewportZoom = (box) => {
    const count = Number(box?.['zoom']);
    return Number['isFinite'](count) && count > 0 ? count : 1;
  },
  getCommandOpacity = (value, item = 1) => {
    const key = Number(value?.['opacity']),
      index = Number['isFinite'](key) ? key : 1,
      result = Number['isFinite'](Number(item)) ? Number(item) : 1;
    return Math['max'](0, Math['min'](1, index * result));
  },
  isFreehandCommand = (data) => data?.['type'] === 'brush' || data?.['type'] === 'eraser',
  getCommandStrokeZoom = (options, target, source) =>
    source === 'screen' && isFreehandCommand(options) ? 1 : target,
  worldToScreenPoint = (box2, box3) => {
    const viewportZoom = getViewportZoom(box3),
      next = Number(box3?.['x']) || 0,
      current = Number(box3?.['y']) || 0;
    return {
      x: ((Number(box2?.['x']) || 0) - next) * viewportZoom,
      y: ((Number(box2?.['y']) || 0) - current) * viewportZoom,
    };
  },
  getScreenX = (entry, box4) =>
    ((Number(entry) || 0) - (Number(box4?.['x']) || 0)) * getViewportZoom(box4),
  getScreenY = (record, box5) =>
    ((Number(record) || 0) - (Number(box5?.['y']) || 0)) * getViewportZoom(box5),
  getCommandPoints = (payload, handle) =>
    (Array['isArray'](payload?.['points']) ? payload['points'] : [])
      ['map']((box6) => {
        const state = Number(box6?.['x']),
          config = Number(box6?.['y']);
        if (!Number['isFinite'](state) || !Number['isFinite'](config)) return null;
        return { x: getScreenX(state, handle), y: getScreenY(config, handle) };
      })
      ['filter'](Boolean),
  applyStrokeDash = (enabled, scope, input) => {
    if (!enabled) return;
    if (scope === 'dashed')
      enabled['setLineDash']([Math['max'](6, input * 3), Math['max'](4, input * 1.5)]);
    else
      scope === 'dotted'
        ? enabled['setLineDash']([Math['max'](1, input * 0.2), Math['max'](4, input * 1.8)])
        : enabled['setLineDash']([]);
  },
  rotateCanvasAroundBounds = (enabled2, box7, output) => {
    const value2 = Number(output) || 0;
    if (!enabled2 || Math['abs'](value2) < 0.000001) return;
    const value3 = box7['x'] + box7['width'] / 2,
      value4 = box7['y'] + box7['height'] / 2;
    (enabled2['translate'](value3, value4),
      enabled2['rotate'](value2),
      enabled2['translate'](-value3, -value4));
  },
  rotatePointAround = (box8, x, value5) => {
    const value6 = box8['x'] - x['x'],
      value7 = box8['y'] - x['y'],
      value8 = Math['cos'](value5),
      value9 = Math['sin'](value5);
    return {
      x: x['x'] + value6 * value8 - value7 * value9,
      y: x['y'] + value6 * value9 + value7 * value8,
    };
  },
  drawArrowHead = ({
    ctx: ctx,
    point: point,
    opposite: opposite,
    lineWidth: lineWidth,
    compareLength: compareLength,
  } = {}) => {
    const value10 = Number(opposite?.['x']) - Number(point?.['x']),
      value11 = Number(opposite?.['y']) - Number(point?.['y']),
      count2 = Math['hypot'](value10, value11);
    if (!ctx || !Number['isFinite'](count2) || count2 < 0.5) return false;
    const value12 = Math['max'](lineWidth, Math['min'](lineWidth * 3, compareLength / 5)),
      value13 = {
        x: point['x'] + (value10 / count2) * value12,
        y: point['y'] + (value11 / count2) * value12,
      },
      box9 = rotatePointAround(value13, point, Math['PI'] / 6),
      box10 = rotatePointAround(value13, point, -Math['PI'] / 6);
    return (
      ctx['beginPath'](),
      ctx['moveTo'](box9['x'], box9['y']),
      ctx['lineTo'](point['x'], point['y']),
      ctx['lineTo'](box10['x'], box10['y']),
      ctx['stroke'](),
      true
    );
  },
  drawArrowTerminal = ({
    ctx: ctx2,
    style: style,
    point: point2,
    opposite: opposite2,
    lineWidth: lineWidth2,
    compareLength: compareLength2,
  } = {}) => {
    if (!ctx2 || !style || style === 'none') return false;
    if (style === 'arrow')
      return drawArrowHead({
        ctx: ctx2,
        point: point2,
        opposite: opposite2,
        lineWidth: lineWidth2,
        compareLength: compareLength2,
      });
    const x2 = Number(opposite2?.['x']) - Number(point2?.['x']),
      y = Number(opposite2?.['y']) - Number(point2?.['y']),
      count3 = Math['hypot'](x2, y);
    if (!Number['isFinite'](count3) || count3 < 0.5) return false;
    const y2 = { x: x2 / count3, y: y / count3 },
      box11 = { x: -y2['y'], y: y2['x'] },
      value14 = Math['max'](lineWidth2 * 1.6, Math['min'](lineWidth2 * 3.2, compareLength2 / 5)),
      x3 = {
        x: point2['x'] + y2['x'] * value14,
        y: point2['y'] + y2['y'] * value14,
      },
      value15 = value14 * 0.52,
      box12 = {
        x: x3['x'] + box11['x'] * value15,
        y: x3['y'] + box11['y'] * value15,
      },
      box13 = {
        x: x3['x'] - box11['x'] * value15,
        y: x3['y'] - box11['y'] * value15,
      };
    ctx2['beginPath']();
    if (style === 'circle') {
      const value16 = value14 * 0.46;
      return (
        ctx2['arc'](
          point2['x'] + y2['x'] * value16,
          point2['y'] + y2['y'] * value16,
          value16,
          0,
          Math['PI'] * 2,
        ),
        ctx2['fill'](),
        ctx2['stroke'](),
        true
      );
    }
    if (style === 'bar')
      return (
        ctx2['moveTo'](
          point2['x'] + box11['x'] * value15,
          point2['y'] + box11['y'] * value15,
        ),
        ctx2['lineTo'](
          point2['x'] - box11['x'] * value15,
          point2['y'] - box11['y'] * value15,
        ),
        ctx2['stroke'](),
        true
      );
    if (style === 'inverted')
      return (
        ctx2['moveTo'](
          point2['x'] + box11['x'] * value15,
          point2['y'] + box11['y'] * value15,
        ),
        ctx2['lineTo'](x3['x'], x3['y']),
        ctx2['lineTo'](
          point2['x'] - box11['x'] * value15,
          point2['y'] - box11['y'] * value15,
        ),
        ctx2['closePath'](),
        ctx2['fill'](),
        ctx2['stroke'](),
        true
      );
    if (style === 'diamond') {
      const box14 = {
        x: point2['x'] + y2['x'] * value14 * 0.5,
        y: point2['y'] + y2['y'] * value14 * 0.5,
      };
      return (
        ctx2['moveTo'](point2['x'], point2['y']),
        ctx2['lineTo'](
          box14['x'] + box11['x'] * value15,
          box14['y'] + box11['y'] * value15,
        ),
        ctx2['lineTo'](x3['x'], x3['y']),
        ctx2['lineTo'](
          box14['x'] - box11['x'] * value15,
          box14['y'] - box11['y'] * value15,
        ),
        ctx2['closePath'](),
        ctx2['fill'](),
        ctx2['stroke'](),
        true
      );
    }
    if (style === 'square')
      return (
        ctx2['moveTo'](
          point2['x'] + box11['x'] * value15,
          point2['y'] + box11['y'] * value15,
        ),
        ctx2['lineTo'](box12['x'], box12['y']),
        ctx2['lineTo'](box13['x'], box13['y']),
        ctx2['lineTo'](
          point2['x'] - box11['x'] * value15,
          point2['y'] - box11['y'] * value15,
        ),
        ctx2['closePath'](),
        ctx2['fill'](),
        ctx2['stroke'](),
        true
      );
    return (
      ctx2['moveTo'](point2['x'], point2['y']),
      ctx2['lineTo'](box12['x'], box12['y']),
      ctx2['lineTo'](box13['x'], box13['y']),
      ctx2['closePath'](),
      ctx2['fill'](),
      ctx2['stroke'](),
      true
    );
  },
  drawArrowCommand = ({
    ctx: ctx3,
    cmd: cmd,
    viewport: viewport,
    isDraft: isDraft = false,
    opacityMultiplier: opacityMultiplier = 1,
  } = {}) => {
    const viewportZoom2 = getViewportZoom(viewport),
      list = getArrowGeometry(cmd),
      point3 = worldToScreenPoint(list['start'], viewport),
      point4 = worldToScreenPoint(list['end'], viewport),
      compareLength3 = list['length'] * viewportZoom2;
    if (!ctx3 || compareLength3 < 0.5) return false;
    const lineWidth3 = getBrushLineWidth(cmd['sizeWorld'], viewportZoom2, 'brush');
    (ctx3['save'](),
      (ctx3['globalCompositeOperation'] = 'source-over'),
      (ctx3['strokeStyle'] = cmd['color']),
      (ctx3['fillStyle'] = cmd['color']),
      (ctx3['lineWidth'] = lineWidth3),
      (ctx3['lineCap'] = 'round'),
      (ctx3['lineJoin'] = 'round'));
    if (isDraft) ctx3['setLineDash']([6, 5]);
    else applyStrokeDash(ctx3, cmd['dash'], lineWidth3);
    ((ctx3['globalAlpha'] = getCommandOpacity(cmd, opacityMultiplier)),
      ctx3['beginPath'](),
      ctx3['moveTo'](point3['x'], point3['y']));
    if (list['type'] === 'arc') {
      const box15 = worldToScreenPoint(list['center'], viewport);
      ctx3['arc'](
        box15['x'],
        box15['y'],
        list['radius'] * viewportZoom2,
        list['startAngle'],
        list['endAngle'],
        list['anticlockwise'],
      );
    } else
      list['type'] === 'elbow'
        ? list['points']['slice'](1)['forEach']((value17) => {
            const box16 = worldToScreenPoint(value17, viewport);
            ctx3['lineTo'](box16['x'], box16['y']);
          })
        : ctx3['lineTo'](point4['x'], point4['y']);
    (ctx3['stroke'](), ctx3['setLineDash']([]));
    const value18 = Math['max'](1, lineWidth3);
    return (
      cmd['arrowEnd'] !== 'none' &&
        drawArrowTerminal({
          ctx: ctx3,
          style: cmd['arrowEnd'],
          point: point4,
          opposite: {
            x: point4['x'] - list['endTangent']['x'] * value18,
            y: point4['y'] - list['endTangent']['y'] * value18,
          },
          lineWidth: lineWidth3,
          compareLength: compareLength3,
        }),
      cmd['arrowStart'] !== 'none' &&
        drawArrowTerminal({
          ctx: ctx3,
          style: cmd['arrowStart'],
          point: point3,
          opposite: {
            x: point3['x'] + list['startTangent']['x'] * value18,
            y: point3['y'] + list['startTangent']['y'] * value18,
          },
          lineWidth: lineWidth3,
          compareLength: compareLength3,
        }),
      ctx3['restore'](),
      true
    );
  },
  drawWhiteboardShapeCommand = ({
    ctx: ctx4,
    cmd: cmd2,
    viewport: viewport2,
    isDraft: isDraft = false,
    opacityMultiplier: opacityMultiplier = 1,
  } = {}) => {
    if (!ctx4) return false;
    const viewportZoom3 = getViewportZoom(viewport2),
      x4 = getWhiteboardShapeBounds(cmd2),
      x5 = worldToScreenPoint({ x: x4['x'], y: x4['y'] }, viewport2),
      box17 = {
        x: x5['x'],
        y: x5['y'],
        width: x4['width'] * viewportZoom3,
        height: x4['height'] * viewportZoom3,
      };
    if (box17['width'] < 0.5 && box17['height'] < 0.5) return false;
    const brushLineWidth = getBrushLineWidth(cmd2['sizeWorld'], viewportZoom3, 'brush');
    (ctx4['save'](),
      rotateCanvasAroundBounds(ctx4, box17, cmd2['rotation']),
      (ctx4['globalCompositeOperation'] = 'source-over'),
      (ctx4['strokeStyle'] = cmd2['color']),
      (ctx4['fillStyle'] = cmd2['color']),
      (ctx4['lineWidth'] = brushLineWidth),
      (ctx4['lineCap'] = 'round'),
      (ctx4['lineJoin'] = 'round'),
      (ctx4['globalAlpha'] = getCommandOpacity(cmd2, opacityMultiplier)));
    if (isDraft) ctx4['setLineDash']([6, 5]);
    else applyStrokeDash(ctx4, cmd2['dash'], brushLineWidth);
    (ctx4['beginPath'](), traceWhiteboardShapePath(ctx4, cmd2['shapeType'], box17));
    if (cmd2['fill'] === 'solid' && isClosedWhiteboardShape(cmd2['shapeType'])) ctx4['fill']();
    return (ctx4['stroke'](), ctx4['restore'](), true);
  },
  drawTextControlButton = (ctx5, box18, handler, value19) => {
    (ctx5['save'](),
      ctx5['beginPath'](),
      ctx5['arc'](box18['x'], box18['y'], TEXT_CONTROL_BUTTON_RADIUS, 0, Math['PI'] * 2),
      (ctx5['fillStyle'] = value19['fill']),
      (ctx5['strokeStyle'] = value19['stroke']),
      (ctx5['lineWidth'] = 1.5),
      ctx5['fill'](),
      ctx5['stroke'](),
      (ctx5['strokeStyle'] = value19['icon']),
      (ctx5['fillStyle'] = value19['icon']),
      (ctx5['lineWidth'] = 1.6),
      (ctx5['lineCap'] = 'round'),
      (ctx5['lineJoin'] = 'round'),
      handler(ctx5, box18),
      ctx5['restore']());
  },
  getBoundaryCommands = (list2, value20) =>
    list2['slice'](0, value20)['filter'](
      (value21) =>
        value21?.['type'] === 'brush' ||
        value21?.['type'] === 'rect' ||
        value21?.['type'] === 'arrow' ||
        value21?.['type'] === 'eraser',
    );
export const drawTextSelectionControls = ({
  ctx: ctx6,
  geom: geom,
  resolveCssVar: resolveCssVar,
  variant: variant = 'annotate',
} = {}) => {
  if (!ctx6 || !geom) return;
  const stroke = resolveCssVar('--blue-border-focus') || ctx6['strokeStyle'],
    fill = resolveCssVar('--canvas-white') || ctx6['fillStyle'],
    icon = resolveCssVar('--bg') || resolveCssVar('--text-primary') || stroke,
    value22 = { stroke: stroke, fill: fill, icon: icon },
    [box19, box20, box21, box22] = geom['corners'];
  (ctx6['save'](),
    (ctx6['strokeStyle'] = stroke),
    (ctx6['lineWidth'] = 1.5),
    ctx6['setLineDash']([]),
    ctx6['beginPath'](),
    ctx6['moveTo'](box19['x'], box19['y']),
    ctx6['lineTo'](box20['x'], box20['y']),
    ctx6['lineTo'](box21['x'], box21['y']),
    ctx6['lineTo'](box22['x'], box22['y']),
    ctx6['closePath'](),
    ctx6['stroke'](),
    ctx6['restore']());
  if (variant === 'whiteboard') {
    ctx6['save']();
    const box23 = getTextRotationHandle(geom);
    box23 &&
      geom['handles']?.['top'] &&
      (ctx6['beginPath'](),
      ctx6['moveTo'](geom['handles']['top']['x'], geom['handles']['top']['y']),
      ctx6['lineTo'](box23['x'], box23['y']),
      (ctx6['strokeStyle'] = stroke),
      (ctx6['lineWidth'] = 1.5),
      ctx6['stroke']());
    const list3 = [...geom['corners'], ...(box23 ? [box23] : [])];
    (list3['forEach']((box24) => {
      (ctx6['beginPath'](),
        ctx6['arc'](box24['x'], box24['y'], 5.5, 0, Math['PI'] * 2),
        (ctx6['fillStyle'] = fill),
        (ctx6['strokeStyle'] = stroke),
        (ctx6['lineWidth'] = 1.5),
        ctx6['fill'](),
        ctx6['stroke']());
    }),
      ctx6['restore']());
    return;
  }
  (ctx6['save'](),
    Object['values'](geom['handles'] || {})
      ['filter']((value23) => value23 && !Array['isArray'](value23))
      ['forEach']((box25) => {
        (ctx6['beginPath'](),
          ctx6['arc'](
            box25['x'],
            box25['y'],
            TEXT_CONTROL_SIDE_HANDLE_RADIUS,
            0,
            Math['PI'] * 2,
          ),
          (ctx6['fillStyle'] = fill),
          (ctx6['strokeStyle'] = stroke),
          (ctx6['lineWidth'] = 1.5),
          ctx6['fill'](),
          ctx6['stroke']());
      }),
    ctx6['restore'](),
    drawTextControlButton(
      ctx6,
      box19,
      (ctx7, box26) => {
        (ctx7['beginPath'](),
          ctx7['moveTo'](box26['x'] - 3, box26['y'] - 3),
          ctx7['lineTo'](box26['x'] + 3, box26['y'] + 3),
          ctx7['moveTo'](box26['x'] + 3, box26['y'] - 3),
          ctx7['lineTo'](box26['x'] - 3, box26['y'] + 3),
          ctx7['stroke']());
      },
      value22,
    ),
    drawTextControlButton(
      ctx6,
      box22,
      (value24, box27) => {
        (value24['strokeRect'](box27['x'] - 2, box27['y'] - 4, 6, 6),
          value24['strokeRect'](box27['x'] - 5, box27['y'] - 1, 6, 6));
      },
      value22,
    ),
    drawTextControlButton(
      ctx6,
      box20,
      (ctx8, box28) => {
        (ctx8['beginPath'](),
          ctx8['arc'](box28['x'], box28['y'], 4, Math['PI'] * 0.15, Math['PI'] * 1.55),
          ctx8['stroke'](),
          ctx8['beginPath'](),
          ctx8['moveTo'](box28['x'] + 4, box28['y'] - 3),
          ctx8['lineTo'](box28['x'] + 5, box28['y'] + 2),
          ctx8['lineTo'](box28['x'] + 1, box28['y']),
          ctx8['stroke']());
      },
      value22,
    ),
    drawTextControlButton(
      ctx6,
      box21,
      (ctx9, box29) => {
        (ctx9['beginPath'](),
          ctx9['moveTo'](box29['x'] - 4, box29['y'] + 4),
          ctx9['lineTo'](box29['x'] + 4, box29['y'] - 4),
          ctx9['moveTo'](box29['x'] + 1, box29['y'] - 4),
          ctx9['lineTo'](box29['x'] + 4, box29['y'] - 4),
          ctx9['lineTo'](box29['x'] + 4, box29['y'] - 1),
          ctx9['moveTo'](box29['x'] - 1, box29['y'] + 4),
          ctx9['lineTo'](box29['x'] - 4, box29['y'] + 4),
          ctx9['lineTo'](box29['x'] - 4, box29['y'] + 1),
          ctx9['stroke']());
      },
      value22,
    ));
};
export const renderEraseSceneCommands = ({
  documentRef: documentRef = null,
  canvasEl: canvasEl,
  ctx: ctx10,
  viewport: viewport3,
  commands: commands = [],
  draft: draft = null,
  checkerPattern: checkerPattern,
  eraseMaskCanvasEl: eraseMaskCanvasEl = null,
} = {}) => {
  if (!canvasEl || !ctx10) return eraseMaskCanvasEl;
  const el2 = documentRef || globalThis['document'],
    viewportZoom4 = getViewportZoom(viewport3),
    width = getCanvasRenderSize(canvasEl),
    value25 = Math['max'](1, Math['round'](width['width'])),
    value26 = Math['max'](1, Math['round'](width['height']));
  let maskCanvas = eraseMaskCanvasEl;
  (!maskCanvas || maskCanvas['width'] !== value25 || maskCanvas['height'] !== value26) &&
    ((maskCanvas = el2['createElement']('canvas')),
    (maskCanvas['width'] = value25),
    (maskCanvas['height'] = value26));
  const ctx11 = maskCanvas['getContext']('2d');
  if (!ctx11) return maskCanvas;
  (ctx11['clearRect'](0, 0, value25, value26),
    (ctx11['lineCap'] = 'round'),
    (ctx11['lineJoin'] = 'round'));
  const run = (type) => {
    if (!type || (type['type'] !== 'brush' && type['type'] !== 'eraser')) return;
    const points = getCommandPoints(type, viewport3);
    if (!points['length']) return;
    drawEraseMaskCommand(ctx11, {
      type: type['type'],
      points: points,
      lineWidth: getBrushLineWidth(type['sizeWorld'], viewportZoom4, type['type']),
    });
  };
  (Array['isArray'](commands) ? commands : [])['forEach'](run);
  if (draft) run(draft);
  return (
    compositeSolidMaskPreview(ctx10, {
      maskCanvas: maskCanvas,
      width: width['width'],
      height: width['height'],
    }),
    maskCanvas
  );
};
export const renderCommands = ({
  ctx: ctx12,
  viewport: viewport4,
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
  freehandStrokeScale: freehandStrokeScale = 'world',
  getCommandOpacityMultiplier: getCommandOpacityMultiplier = null,
  textSelectionVariant: textSelectionVariant = 'annotate',
  textOutlineColor: textOutlineColor = '',
  textLayoutVariant: textLayoutVariant = 'annotate',
} = {}) => {
  if (!ctx12 || !canvasEl2) return;
  const checkerZoom = getViewportZoom(viewport4),
    width2 = getCanvasRenderSize(canvasEl2);
  commands['forEach']((strokeStyle, value27) => {
    const opacityMultiplier2 =
      typeof getCommandOpacityMultiplier === 'function'
        ? getCommandOpacityMultiplier(strokeStyle, value27)
        : 1;
    if (strokeStyle['type'] === 'brush') {
      ctx12['save']();
      const points2 = getCommandPoints(strokeStyle, viewport4);
      if (!points2['length']) {
        ctx12['restore']();
        return;
      }
      const lineWidth4 = getBrushLineWidth(
        strokeStyle['sizeWorld'],
        getCommandStrokeZoom(strokeStyle, checkerZoom, freehandStrokeScale),
        'brush',
      );
      if (isEraseScene) {
        const checkerPattern3 =
          createEraseCheckerboardPattern(ctx12, checkerZoom) ||
          checkerPattern2 ||
          resolveCssVar2?.('--white-20') ||
          'transparent';
        drawEraseBrushCommand(ctx12, {
          type: 'brush',
          points: points2,
          lineWidth: lineWidth4,
          checkerPattern: checkerPattern3,
          checkerZoom: checkerZoom,
          checkerAlpha: 0.8,
          includeErasePass: false,
        });
      } else
        ((ctx12['globalAlpha'] = getCommandOpacity(strokeStyle, opacityMultiplier2)),
          applyStrokeDash(ctx12, strokeStyle['dash'], lineWidth4),
          drawRoundBrushStroke(ctx12, {
            points: points2,
            lineWidth: lineWidth4,
            strokeStyle: strokeStyle['color'],
            fillStyle: strokeStyle['color'],
            globalCompositeOperation: 'source-over',
          }));
      (ctx12['setLineDash']([]), ctx12['restore']());
      return;
    }
    if (strokeStyle['type'] === 'eraser') {
      ctx12['save']();
      const points3 = getCommandPoints(strokeStyle, viewport4);
      if (!points3['length']) {
        ctx12['restore']();
        return;
      }
      ((ctx12['globalAlpha'] = getCommandOpacity(strokeStyle, opacityMultiplier2)),
        drawRoundBrushStroke(ctx12, {
          points: points3,
          lineWidth: getEraserClearLineWidth(
            getBrushLineWidth(
              strokeStyle['sizeWorld'],
              getCommandStrokeZoom(strokeStyle, checkerZoom, freehandStrokeScale),
              'eraser',
            ),
          ),
          strokeStyle: 'black',
          fillStyle: 'black',
          globalCompositeOperation: 'destination-out',
        }),
        ctx12['restore']());
      return;
    }
    if (strokeStyle['type'] === 'rect') {
      const screenX = getScreenX(strokeStyle['x1'], viewport4),
        screenY = getScreenY(strokeStyle['y1'], viewport4),
        screenX2 = getScreenX(strokeStyle['x2'], viewport4),
        screenY2 = getScreenY(strokeStyle['y2'], viewport4),
        x6 = Math['min'](screenX, screenX2),
        y3 = Math['min'](screenY, screenY2),
        width3 = Math['abs'](screenX2 - screenX),
        height = Math['abs'](screenY2 - screenY);
      (ctx12['save'](),
        rotateCanvasAroundBounds(
          ctx12,
          { x: x6, y: y3, width: width3, height: height },
          strokeStyle['rotation'],
        ),
        (ctx12['globalCompositeOperation'] = 'source-over'),
        (ctx12['strokeStyle'] = strokeStyle['color']),
        (ctx12['lineWidth'] = getBrushLineWidth(strokeStyle['sizeWorld'], checkerZoom, 'brush')),
        (ctx12['globalAlpha'] = getCommandOpacity(strokeStyle, opacityMultiplier2)));
      strokeStyle['fill'] === 'solid' &&
        (ctx12['save'](),
        (ctx12['globalAlpha'] *= 0.14),
        (ctx12['fillStyle'] = strokeStyle['color']),
        ctx12['fillRect'](x6, y3, width3, height),
        ctx12['restore']());
      if (isDraft) ctx12['setLineDash']([6, 5]);
      else applyStrokeDash(ctx12, strokeStyle['dash'], ctx12['lineWidth']);
      (ctx12['strokeRect'](x6, y3, width3, height), ctx12['restore']());
      return;
    }
    if (strokeStyle['type'] === 'shape') {
      drawWhiteboardShapeCommand({
        ctx: ctx12,
        cmd: strokeStyle,
        viewport: viewport4,
        isDraft: isDraft,
        opacityMultiplier: opacityMultiplier2,
      });
      return;
    }
    if (strokeStyle['type'] === 'arrow') {
      drawArrowCommand({
        ctx: ctx12,
        cmd: strokeStyle,
        viewport: viewport4,
        isDraft: isDraft,
        opacityMultiplier: opacityMultiplier2,
      });
      return;
    }
    if (strokeStyle['type'] === 'text') {
      const screenX3 = getScreenX(strokeStyle['x'], viewport4),
        screenY3 = getScreenY(strokeStyle['y'], viewport4),
        value28 = Math['max'](1, strokeStyle['sizeWorld'] * checkerZoom),
        { scaleX: scaleX, scaleY: scaleY } = getTextScalePair(strokeStyle),
        value29 = Number(strokeStyle['rotation']) || 0;
      (ctx12['save'](),
        (ctx12['globalCompositeOperation'] = 'source-over'),
        (ctx12['globalAlpha'] = getCommandOpacity(strokeStyle, opacityMultiplier2)),
        (ctx12['fillStyle'] = strokeStyle['color'] || defaultTextColor));
      const value30 =
        strokeStyle['font'] === 'serif' ? 'serif' : strokeStyle['font'] === 'mono' ? 'monospace' : 'sans-serif';
      ((ctx12['font'] = value28 + 'px ' + value30),
        (ctx12['textAlign'] = strokeStyle['textAlign'] || 'left'),
        (ctx12['textBaseline'] = 'top'));
      const box30 = getTextLayout({
          canvasEl: canvasEl2,
          cmd: strokeStyle,
          viewport: viewport4,
          layoutVariant: textLayoutVariant,
          context: ctx12,
        }),
        list4 = box30?.['lines'] || [String(strokeStyle['text'] || '')],
        value31 = box30?.['lineHeight'] || value28 * 1.2,
        value32 =
          ctx12['textAlign'] === 'center'
            ? (box30?.['width'] || 0) / 2
            : ctx12['textAlign'] === 'right'
              ? box30?.['width'] || 0
              : 0;
      (ctx12['translate'](screenX3, screenY3),
        ctx12['rotate'](value29),
        ctx12['scale'](scaleX, scaleY),
        list4['forEach']((value33, value34) => {
          const value35 = value34 * value31;
          (textOutlineColor &&
            typeof ctx12['strokeText'] === 'function' &&
            (ctx12['save'](),
            (ctx12['strokeStyle'] = textOutlineColor),
            (ctx12['lineWidth'] = Math['max'](1.5, Math['min'](3, value28 * 0.08))),
            (ctx12['lineJoin'] = 'round'),
            ctx12['strokeText'](value33, value32, value35),
            ctx12['restore']()),
            ctx12['fillText'](value33, value32, value35));
        }),
        ctx12['restore']());
      if (!isDraft && commands === selectedCommandsRef && selectedTextCommandIndex === value27) {
        const geom2 = getTextGeometry?.(strokeStyle, viewport4);
        geom2 &&
          drawTextSelectionControls({
            ctx: ctx12,
            geom: geom2,
            resolveCssVar: resolveCssVar2,
            variant: textSelectionVariant,
          });
      }
      return;
    }
    if (strokeStyle['type'] === 'number-label') {
      drawNumberLabelCommand({
        ctx: ctx12,
        cmd: { ...strokeStyle, opacity: getCommandOpacity(strokeStyle, opacityMultiplier2) },
        viewport: viewport4,
        defaultColor: defaultTextColor,
        backgroundColor: numberLabelBackgroundColor,
      });
      return;
    }
    if (strokeStyle['type'] === 'fill') {
      const seedX = Math['floor'](getScreenX(strokeStyle['x'], viewport4)),
        seedY = Math['floor'](getScreenY(strokeStyle['y'], viewport4)),
        fillStyle = strokeStyle['color'] || defaultTextColor,
        value36 = Number(viewport4?.['x']) || 0,
        value37 = Number(viewport4?.['y']) || 0,
        cachedSealedFillRegion = getCachedSealedFillRegion({
          cache: fillRegionCache,
          width: width2['width'],
          height: width2['height'],
          zoom: checkerZoom,
          fillCommand: strokeStyle,
          boundaryCommands: getBoundaryCommands(commands, value27),
          seedX: seedX,
          seedY: seedY,
          extraKey: 'color:' + fillStyle + ';view:' + value36 + ',' + value37,
          pointToPixel: (value38) => worldToScreenPoint(value38, viewport4),
          getStrokeWidth: (value39) =>
            getBrushLineWidth(
              value39?.['sizeWorld'],
              getCommandStrokeZoom(value39, checkerZoom, freehandStrokeScale),
              value39?.['type'],
            ),
        });
      (ctx12['save'](),
        paintFilledRegion(ctx12, cachedSealedFillRegion, width2['width'], width2['height'], {
          fillStyle: fillStyle,
          globalCompositeOperation: 'source-over',
          globalAlpha: getCommandOpacity(strokeStyle, opacityMultiplier2),
        }),
        ctx12['restore']());
    }
  });
};
