import { getArrowGeometry } from '../imageAnnotate/arrowGeometry.js';
import { getWhiteboardShapeBounds } from '../imageAnnotate/whiteboardShapes.js';
import { getPolylineBounds } from './whiteboardInteractionGeometry.js';
export const WHITEBOARD_LAYER_HANDLE_RADIUS_SCREEN = 0xa;
export const WHITEBOARD_LAYER_ROTATE_OFFSET_SCREEN = 0x18;
export const WHITEBOARD_LAYER_MIN_SCALE = 0.05;
export const WHITEBOARD_LAYER_MAX_SCALE = 0x28;
const TRANSFORMABLE_TYPES = new Set(['brush', 'eraser', 'rect', 'shape', 'arrow', 'number-label']),
  GENERIC_RESIZE_TYPES = new Set(['brush', 'eraser', 'rect', 'shape', 'number-label']),
  GENERIC_ROTATE_TYPES = new Set(['brush', 'eraser', 'rect', 'shape']),
  finiteNumberOr = (value, item = 0x0) => {
    const key = Number(value);
    return Number['isFinite'](key) ? key : item;
  },
  clamp = (index, result, data) => Math['max'](result, Math['min'](data, index)),
  rotatePointAround = (box, box2, options) => {
    const target = Math['cos'](finiteNumberOr(options)),
      source = Math['sin'](finiteNumberOr(options)),
      finiteNumberOr2 = finiteNumberOr(box?.['x']) - finiteNumberOr(box2?.['x']),
      finiteNumberOr3 = finiteNumberOr(box?.['y']) - finiteNumberOr(box2?.['y']);
    return {
      x: finiteNumberOr(box2?.['x']) + finiteNumberOr2 * target - finiteNumberOr3 * source,
      y: finiteNumberOr(box2?.['y']) + finiteNumberOr2 * source + finiteNumberOr3 * target,
    };
  },
  boundsFromPoints = (next, current = 0x0) => {
    let x = Infinity,
      y = Infinity,
      width = -Infinity,
      height = -Infinity;
    (Array['isArray'](next) ? next : [])['forEach']((box3) => {
      const entry = Number(box3?.['x']),
        record = Number(box3?.['y']);
      if (!Number['isFinite'](entry) || !Number['isFinite'](record)) return;
      ((x = Math['min'](x, entry)),
        (y = Math['min'](y, record)),
        (width = Math['max'](width, entry)),
        (height = Math['max'](height, record)));
    });
    if (!Number['isFinite'](x)) return null;
    const payload = Math['max'](0x0, finiteNumberOr(current));
    return {
      x: x - payload,
      y: y - payload,
      width: width - x + payload * 0x2,
      height: height - y + payload * 0x2,
    };
  },
  getArrowPathPoints = (handle) => {
    const x2 = getArrowGeometry(handle);
    if (x2['type'] === 'elbow') return x2['points'];
    if (x2['type'] !== 'arc') return [x2['start'], x2['end']];
    const list = [],
      state = 0x10;
    for (let config = 0x0; config <= state; config += 0x1) {
      const scope = config / state,
        input = x2['anticlockwise']
          ? x2['startAngle'] - x2['sweep'] * scope
          : x2['startAngle'] + x2['sweep'] * scope;
      list['push']({
        x: x2['center']['x'] + Math['cos'](input) * x2['radius'],
        y: x2['center']['y'] + Math['sin'](input) * x2['radius'],
      });
    }
    return list;
  },
  getLayerBounds = (box4) => {
    const output = Math['max'](0x0, finiteNumberOr(box4?.['sizeWorld'], 0x1) / 0x2);
    if (box4?.['type'] === 'brush' || box4?.['type'] === 'eraser')
      return getPolylineBounds(box4['points'], output);
    if (box4?.['type'] === 'rect' || box4?.['type'] === 'shape') return getWhiteboardShapeBounds(box4);
    if (box4?.['type'] === 'arrow') return boundsFromPoints(getArrowPathPoints(box4), output);
    if (box4?.['type'] === 'number-label') {
      const width2 = Math['max'](0x1, finiteNumberOr(box4['sizeWorld'], 0x12) / 0x2);
      return {
        x: finiteNumberOr(box4['x']) - width2,
        y: finiteNumberOr(box4['y']) - width2,
        width: width2 * 0x2,
        height: width2 * 0x2,
      };
    }
    return null;
  };
export const isWhiteboardLayerTransformable = (value2) => TRANSFORMABLE_TYPES['has'](value2?.['type']);
export function getWhiteboardLayerGeometry(value3, { zoom: zoom = 0x1 } = {}) {
  if (!isWhiteboardLayerTransformable(value3)) return null;
  const x3 = getLayerBounds(value3);
  if (!x3) return null;
  const value4 = Math['max'](0.001, finiteNumberOr(zoom, 0x1)),
    x4 = {
      x: x3['x'] + x3['width'] / 0x2,
      y: x3['y'] + x3['height'] / 0x2,
    },
    rotation2 =
      value3['type'] === 'rect' || value3['type'] === 'shape' ? finiteNumberOr(value3['rotation']) : 0x0,
    list2 = [
      { id: 'nw', point: { x: x3['x'], y: x3['y'] } },
      { id: 'ne', point: { x: x3['x'] + x3['width'], y: x3['y'] } },
      {
        id: 'se',
        point: { x: x3['x'] + x3['width'], y: x3['y'] + x3['height'] },
      },
      { id: 'sw', point: { x: x3['x'], y: x3['y'] + x3['height'] } },
    ],
    corners = list2['map'](({ point: point }) => rotatePointAround(point, x4, rotation2)),
    supportsResize = GENERIC_RESIZE_TYPES['has'](value3['type']),
    supportsRotation = GENERIC_ROTATE_TYPES['has'](value3['type']),
    scaleHandles = supportsResize
      ? list2['map'](({ id: id, point: point2 }) => ({
          id: id,
          mode: 'scale',
          point: rotatePointAround(point2, x4, rotation2),
        }))
      : [],
    topMiddle = rotatePointAround({ x: x4['x'], y: x3['y'] }, x4, rotation2),
    rotationHandle = supportsRotation
      ? {
          id: 'rotate',
          mode: 'rotate',
          point: rotatePointAround(
            { x: x4['x'], y: x3['y'] - WHITEBOARD_LAYER_ROTATE_OFFSET_SCREEN / value4 },
            x4,
            rotation2,
          ),
        }
      : null;
  return {
    bounds: x3,
    center: x4,
    rotation: rotation2,
    corners: corners,
    topMiddle: topMiddle,
    scaleHandles: scaleHandles,
    rotationHandle: rotationHandle,
    supportsResize: supportsResize,
    supportsRotation: supportsRotation,
  };
}
export function getWhiteboardLayerTransformHandleAtPoint(value5, box5, { zoom: zoom = 0x1 } = {}) {
  const args = getWhiteboardLayerGeometry(value5, { zoom: zoom });
  if (!args) return null;
  const value6 = WHITEBOARD_LAYER_HANDLE_RADIUS_SCREEN / Math['max'](0.001, finiteNumberOr(zoom, 0x1)),
    list3 = [...(args['rotationHandle'] ? [args['rotationHandle']] : []), ...args['scaleHandles']];
  return (
    list3['find'](
      (value7) =>
        Math['hypot'](
          finiteNumberOr(box5?.['x']) - value7['point']['x'],
          finiteNumberOr(box5?.['y']) - value7['point']['y'],
        ) <= value6,
    ) || null
  );
}
const cloneCommand = (args2) => ({
  ...args2,
  points: Array['isArray'](args2?.['points'])
    ? args2['points']['map']((box6) => ({
        x: finiteNumberOr(box6?.['x']),
        y: finiteNumberOr(box6?.['y']),
      }))
    : args2?.['points'],
});
export function createWhiteboardLayerTransformSession({
  command: command,
  index: index2,
  mode: mode,
  startPoint: startPoint,
} = {}) {
  const args3 = getWhiteboardLayerGeometry(command);
  if (!args3) return null;
  if (mode === 'scale' && !args3['supportsResize']) return null;
  if (mode === 'rotate' && !args3['supportsRotation']) return null;
  if (mode !== 'move' && mode !== 'scale' && mode !== 'rotate') return null;
  const start = { x: finiteNumberOr(startPoint?.['x']), y: finiteNumberOr(startPoint?.['y']) };
  return {
    index: Number(index2),
    mode: mode,
    start: start,
    center: { ...args3['center'] },
    startDistance: Math['max'](
      0.001,
      Math['hypot'](start['x'] - args3['center']['x'], start['y'] - args3['center']['y']),
    ),
    startAngle: Math['atan2'](start['y'] - args3['center']['y'], start['x'] - args3['center']['x']),
    base: cloneCommand(command),
    moved: ![],
  };
}
const transformPoint = (
    box7,
    x5,
    { scale: scale = 0x1, rotation: rotation = 0x0, dx: dx = 0x0, dy: dy = 0x0 } = {},
  ) => {
    const value8 = {
        x: x5['x'] + (finiteNumberOr(box7?.['x']) - x5['x']) * scale,
        y: x5['y'] + (finiteNumberOr(box7?.['y']) - x5['y']) * scale,
      },
      x6 = rotatePointAround(value8, x5, rotation);
    return { x: x6['x'] + dx, y: x6['y'] + dy };
  },
  applyPointPair = (value9, x7, value10) => {
    const box8 = transformPoint({ x: x7['x1'], y: x7['y1'] }, value10['center'], value10),
      box9 = transformPoint({ x: x7['x2'], y: x7['y2'] }, value10['center'], value10);
    ((value9['x1'] = box8['x']),
      (value9['y1'] = box8['y']),
      (value9['x2'] = box9['x']),
      (value9['y2'] = box9['y']));
  };
export function applyWhiteboardLayerTransform(box10, center, box11) {
  if (!box10 || !center?.['base'] || box10['type'] !== center['base']['type']) return ![];
  const box12 = { x: finiteNumberOr(box11?.['x']), y: finiteNumberOr(box11?.['y']) };
  let scale2 = 0x1,
    rotation3 = 0x0,
    dx2 = 0x0,
    dy2 = 0x0;
  if (center['mode'] === 'move')
    ((dx2 = box12['x'] - center['start']['x']), (dy2 = box12['y'] - center['start']['y']));
  else {
    if (center['mode'] === 'scale')
      scale2 = clamp(
        Math['hypot'](box12['x'] - center['center']['x'], box12['y'] - center['center']['y']) /
          center['startDistance'],
        WHITEBOARD_LAYER_MIN_SCALE,
        WHITEBOARD_LAYER_MAX_SCALE,
      );
    else {
      if (center['mode'] === 'rotate')
        rotation3 =
          Math['atan2'](box12['y'] - center['center']['y'], box12['x'] - center['center']['x']) -
          center['startAngle'];
      else return ![];
    }
  }
  const value11 =
      center['mode'] === 'move'
        ? Math['hypot'](dx2, dy2) > 0.01
        : center['mode'] === 'scale'
          ? Math['abs'](scale2 - 0x1) > 0.001
          : Math['abs'](rotation3) > 0.001,
    args4 = {
      center: center['center'],
      scale: scale2,
      rotation: rotation3,
      dx: dx2,
      dy: dy2,
    },
    value12 = center['base'];
  if (box10['type'] === 'brush' || box10['type'] === 'eraser')
    ((box10['points'] = value12['points']['map']((value13) =>
      transformPoint(value13, center['center'], args4),
    )),
      (box10['sizeWorld'] = Math['max'](0x1, finiteNumberOr(value12['sizeWorld'], 0x1) * scale2)));
  else {
    if (box10['type'] === 'rect' || box10['type'] === 'shape')
      (applyPointPair(box10, value12, { ...args4, rotation: 0x0 }),
        (box10['sizeWorld'] = Math['max'](0x1, finiteNumberOr(value12['sizeWorld'], 0x1) * scale2)),
        (box10['rotation'] = finiteNumberOr(value12['rotation']) + rotation3));
    else {
      if (box10['type'] === 'arrow')
        (applyPointPair(box10, value12, args4),
          (box10['sizeWorld'] = Math['max'](0x1, finiteNumberOr(value12['sizeWorld'], 0x1) * scale2)),
          (box10['bend'] = finiteNumberOr(value12['bend']) * scale2),
          (box10['elbowOffset'] = finiteNumberOr(value12['elbowOffset']) * scale2));
      else {
        if (box10['type'] === 'number-label') {
          const box13 = transformPoint(value12, center['center'], args4);
          ((box10['x'] = box13['x']),
            (box10['y'] = box13['y']),
            (box10['sizeWorld'] = Math['max'](0x1, finiteNumberOr(value12['sizeWorld'], 0x12) * scale2)));
        }
      }
    }
  }
  return ((center['moved'] = value11), value11);
}
