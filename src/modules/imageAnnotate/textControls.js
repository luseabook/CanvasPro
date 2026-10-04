export const TEXT_CONTROL_BUTTON_RADIUS = 9;
export const TEXT_CONTROL_SIDE_HANDLE_RADIUS = 7;
export const TEXT_CONTROL_HIT_RADIUS = 13;
export const TEXT_CONTROL_MIN_SCALE = 0.1;
export const TEXT_CONTROL_MAX_SCALE = 20;
export const TEXT_COPY_OFFSET_WORLD = 16;
export const clampTextScale = (value) => {
  const item = Number(value);
  if (!Number.isFinite(item)) return 1;
  return Math.max(TEXT_CONTROL_MIN_SCALE, Math.min(TEXT_CONTROL_MAX_SCALE, item));
};
export const getTextScalePair = (box = {}) => {
  const clampTextScale2 = clampTextScale(box.scale);
  return {
    scaleX: clampTextScale(box.scaleX === undefined || box.scaleX === null ? clampTextScale2 : box.scaleX),
    scaleY: clampTextScale(box.scaleY === undefined || box.scaleY === null ? clampTextScale2 : box.scaleY),
  };
};
export const getTextLayout = ({ canvasEl: canvasEl, cmd: cmd, viewport: viewport } = {}) => {
  if (!canvasEl || !cmd) return null;
  const key = viewport?.zoom || 1,
    fontSize = Math.max(1, Number(cmd.sizeWorld || 0) * key),
    x = Number(cmd.x || 0) * key,
    y = Number(cmd.y || 0) * key,
    ctx = canvasEl.getContext('2d');
  (ctx.save(), (ctx.font = fontSize + 'px sans-serif'));
  const index = String(cmd.text || ''),
    box2 = ctx.measureText(index || ' ');
  ctx.restore();
  const width = Math.max(1, Number(box2.width) || fontSize),
    result = Number(box2.actualBoundingBoxAscent) || fontSize * 0.8,
    data = Number(box2.actualBoundingBoxDescent) || fontSize * 0.2,
    height = Math.max(1, result + data);
  return { x: x, y: y, width: width, height: height, fontSize: fontSize };
};
export const getTextGeometry = ({ canvasEl: canvasEl2, cmd: cmd2, viewport: viewport2 } = {}) => {
  const box3 = getTextLayout({ canvasEl: canvasEl2, cmd: cmd2, viewport: viewport2 });
  if (!box3) return null;
  const { scaleX: scaleX, scaleY: scaleY } = getTextScalePair(cmd2),
    rotation = Number(cmd2?.rotation) || 0,
    options = box3.width * scaleX,
    target = box3.height * scaleY,
    x2 = box3.x,
    y2 = box3.y,
    handler = (source, next) => {
      const current = source - x2,
        entry = next - y2,
        record = Math.cos(rotation),
        payload = Math.sin(rotation);
      return {
        x: x2 + current * record - entry * payload,
        y: y2 + current * payload + entry * record,
      };
    },
    box4 = handler(x2, y2),
    box5 = handler(x2 + options, y2),
    box6 = handler(x2 + options, y2 + target),
    box7 = handler(x2, y2 + target);
  return {
    ...box3,
    scale: Math.max(scaleX, scaleY),
    scaleX: scaleX,
    scaleY: scaleY,
    rotation: rotation,
    corners: [box4, box5, box6, box7],
    center: { x: (box4.x + box6.x) / 2, y: (box4.y + box6.y) / 2 },
    anchor: { x: x2, y: y2 },
    handles: {
      corners: [box4, box5, box6, box7],
      top: { x: (box4.x + box5.x) / 2, y: (box4.y + box5.y) / 2 },
      right: { x: (box5.x + box6.x) / 2, y: (box5.y + box6.y) / 2 },
      bottom: { x: (box6.x + box7.x) / 2, y: (box6.y + box7.y) / 2 },
      left: { x: (box7.x + box4.x) / 2, y: (box7.y + box4.y) / 2 },
    },
  };
};
export const distanceToPoint = (box8, box9) =>
  Math.hypot(Number(box8?.x || 0) - Number(box9?.x || 0), Number(box8?.y || 0) - Number(box9?.y || 0));
export const toTextLocalTransformSpace = (box10, box11, handle) => {
  const x3 = Number(box10?.x || 0) - Number(box11?.x || 0),
    state = Number(box10?.y || 0) - Number(box11?.y || 0),
    config = Math.cos(-(Number(handle) || 0)),
    scope = Math.sin(-(Number(handle) || 0));
  return { x: x3 * config - state * scope, y: x3 * scope + state * config };
};
export const rotateTextLocalPoint = (box12, input) => {
  const output = Math.cos(Number(input) || 0),
    value2 = Math.sin(Number(input) || 0),
    x4 = Number(box12?.x || 0),
    value3 = Number(box12?.y || 0);
  return {
    x: x4 * output - value3 * value2,
    y: x4 * value2 + value3 * output,
  };
};
export const resolveAxisTextScale = (x5, value4) => {
  const box13 = toTextLocalTransformSpace(value4, x5.anchorPx, x5.rotation);
  let scaleX2 = x5.baseScaleX,
    scaleY2 = x5.baseScaleY,
    value5 = { x: 0, y: 0 };
  if (x5.handle === 'right') scaleX2 = clampTextScale(box13.x / x5.layoutWidth);
  else {
    if (x5.handle === 'left')
      ((scaleX2 = clampTextScale(-box13.x / x5.layoutWidth)),
        (value5 = { x: -x5.layoutWidth * scaleX2, y: 0 }));
    else {
      if (x5.handle === 'bottom') scaleY2 = clampTextScale(box13.y / x5.layoutHeight);
      else
        x5.handle === 'top' &&
          ((scaleY2 = clampTextScale(-box13.y / x5.layoutHeight)),
          (value5 = { x: 0, y: -x5.layoutHeight * scaleY2 }));
    }
  }
  const box14 = rotateTextLocalPoint(value5, x5.rotation);
  return {
    scaleX: scaleX2,
    scaleY: scaleY2,
    originPx: { x: x5.anchorPx.x + box14.x, y: x5.anchorPx.y + box14.y },
  };
};
export const isPointInPolygon = (box15, list) => {
  let enabled = false;
  for (let value6 = 0, value7 = list.length - 1; value6 < list.length; value7 = value6++) {
    const value8 = list[value6].x,
      value9 = list[value6].y,
      value10 = list[value7].x,
      value11 = list[value7].y,
      value12 =
        value9 > box15.y !== value11 > box15.y &&
        box15.x < ((value10 - value8) * (box15.y - value9)) / (value11 - value9 || 0.000001) + value8;
    if (value12) enabled = !enabled;
  }
  return enabled;
};
export const findTextHit = ({
  commands: commands,
  selectedTextCommandIndex: selectedTextCommandIndex,
  local: local,
  viewport: viewport3,
  canvasEl: canvasEl3,
} = {}) => {
  const value13 = viewport3?.zoom || 1,
    value14 = { x: Number(local?.x || 0) * value13, y: Number(local?.y || 0) * value13 },
    index2 = Number(selectedTextCommandIndex);
  if (
    Number.isInteger(index2) &&
    index2 >= 0 &&
    index2 < commands.length &&
    commands[index2]?.type === 'text'
  ) {
    const point = getTextGeometry({ canvasEl: canvasEl3, cmd: commands[index2], viewport: viewport3 });
    if (point) {
      const [point2, point3, point4, point5] = point.corners,
        list2 = [
          { point: point2, mode: 'delete' },
          { point: point5, mode: 'copy' },
          { point: point3, mode: 'rotate' },
          { point: point4, mode: 'scale-uniform' },
        ],
        list3 = [
          { point: point.handles.top, mode: 'scale-y', handle: 'top' },
          { point: point.handles.right, mode: 'scale-x', handle: 'right' },
          { point: point.handles.bottom, mode: 'scale-y', handle: 'bottom' },
          { point: point.handles.left, mode: 'scale-x', handle: 'left' },
        ],
        list4 = [
          ...list2.map((args) => ({
            ...args,
            distance: distanceToPoint(value14, args.point),
            radius: TEXT_CONTROL_HIT_RADIUS,
          })),
          ...list3.map((args2) => ({
            ...args2,
            distance: distanceToPoint(value14, args2.point),
            radius: TEXT_CONTROL_SIDE_HANDLE_RADIUS + 4,
          })),
        ]
          .filter((item2) => item2.distance <= item2.radius)
          .sort((item3, value15) => item3.distance - value15.distance);
      if (list4.length > 0) {
        const mode = list4[0];
        return { index: index2, mode: mode.mode, handle: mode.handle, geom: point };
      }
      if (isPointInPolygon(value14, point.corners)) return { index: index2, mode: 'move', geom: point };
    }
  }
  for (let index3 = commands.length - 1; index3 >= 0; index3 -= 1) {
    const cmd3 = commands[index3];
    if (cmd3?.type !== 'text') continue;
    const geom = getTextGeometry({ canvasEl: canvasEl3, cmd: cmd3, viewport: viewport3 });
    if (!geom) continue;
    if (isPointInPolygon(value14, geom.corners)) return { index: index3, mode: 'move', geom: geom };
  }
  return null;
};
export const createTextTransformState = ({
  commands: commands2,
  hit: hit,
  local: local2,
  viewport: viewport4,
  canvasEl: canvasEl4,
} = {}) => {
  const value16 = viewport4?.zoom || 1,
    box16 = { x: Number(local2?.x || 0) * value16, y: Number(local2?.y || 0) * value16 },
    cmd4 = commands2[hit.index],
    right = hit.geom || getTextGeometry({ canvasEl: canvasEl4, cmd: cmd4, viewport: viewport4 });
  if (!right) return null;
  if (hit.mode === 'move')
    return {
      index: hit.index,
      mode: 'move',
      offsetWorldX: Number(local2?.x || 0) - Number(cmd4?.x || 0),
      offsetWorldY: Number(local2?.y || 0) - Number(cmd4?.y || 0),
    };
  if (hit.mode === 'scale') return null;
  if (hit.mode === 'scale-x' || hit.mode === 'scale-y') {
    const handle2 = String(hit.handle || ''),
      value17 = {
        right: right.corners[0],
        bottom: right.corners[0],
        left: right.corners[1],
        top: right.corners[3],
      },
      x6 = value17[handle2] || right.corners[0];
    return {
      index: hit.index,
      mode: hit.mode,
      handle: handle2,
      anchorPx: { x: x6.x, y: x6.y },
      baseScaleX: right.scaleX,
      baseScaleY: right.scaleY,
      layoutWidth: Math.max(1, Number(right.width) || 1),
      layoutHeight: Math.max(1, Number(right.height) || 1),
      rotation: Number(cmd4?.rotation) || 0,
    };
  }
  if (hit.mode === 'scale-uniform')
    return {
      index: hit.index,
      mode: 'scale-uniform',
      originPx: { x: right.anchor.x, y: right.anchor.y },
      baseWidthPx: Math.max(1, Number(right.width) || 1) * right.scaleX,
      baseHeightPx: Math.max(1, Number(right.height) || 1) * right.scaleY,
      baseScaleX: right.scaleX,
      baseScaleY: right.scaleY,
      rotation: Number(cmd4?.rotation) || 0,
    };
  if (hit.mode === 'rotate')
    return {
      index: hit.index,
      mode: 'rotate',
      centerPx: { x: right.center.x, y: right.center.y },
      baseAngle: Math.atan2(box16.y - right.center.y, box16.x - right.center.x),
      baseRotation: Number(cmd4?.rotation) || 0,
      layoutWidth: Math.max(1, Number(right.width) || 1),
      layoutHeight: Math.max(1, Number(right.height) || 1),
    };
  return null;
};
export const buildCopiedTextCommand = (box17, box18) => {
  const value18 = box18?.zoom || 1,
    value19 = TEXT_COPY_OFFSET_WORLD / value18;
  return { ...box17, x: Number(box17.x || 0) + value19, y: Number(box17.y || 0) + value19 };
};

export const TEXT_LINE_HEIGHT_RATIO = 1.2;

export const TEXT_ROTATE_HANDLE_OFFSET = 0x18;

export const TEXT_ROTATE_HIT_RADIUS = 0xd;

const getViewportZoom = (box19) => {
    const count = Number(box19?.['zoom']);
    return Number['isFinite'](count) && count > 0x0 ? count : 0x1;
  },
  getScreenX = (value20, box20) =>
    ((Number(value20) || 0x0) - (Number(box20?.['x']) || 0x0)) * getViewportZoom(box20),
  getScreenY = (value21, box21) =>
    ((Number(value21) || 0x0) - (Number(box21?.['y']) || 0x0)) * getViewportZoom(box21);

export const getTextRotationHandles = (value22) => {
  const list5 = Array['isArray'](value22?.['corners']) ? value22['corners'] : [];
  if (list5['length'] < 0x2) return [];
  const [box22, box23] = list5,
    value23 = box23['x'] - box22['x'],
    value24 = box23['y'] - box22['y'],
    value25 = Math['hypot'](value23, value24) || 0x1,
    box24 = { x: (box22['x'] + box23['x']) / 0x2, y: (box22['y'] + box23['y']) / 0x2 };
  return [
    {
      point: {
        x: box24['x'] + (value24 / value25) * TEXT_ROTATE_HANDLE_OFFSET,
        y: box24['y'] - (value23 / value25) * TEXT_ROTATE_HANDLE_OFFSET,
      },
      handle: 'rotate',
    },
  ];
};

export const getTextRotationHandle = (value26) => getTextRotationHandles(value26)[0x0]?.['point'] || null;

export const getTextAnchorForCenter = ({
  centerPx: centerPx,
  layoutWidth: layoutWidth,
  layoutHeight: layoutHeight,
  scaleX: scaleX3,
  scaleY: scaleY3,
  rotation: rotation2,
} = {}) => {
  const box25 = rotateTextLocalPoint(
    {
      x: ((Number(layoutWidth) || 0x0) * (Number(scaleX3) || 0x0)) / 0x2,
      y: ((Number(layoutHeight) || 0x0) * (Number(scaleY3) || 0x0)) / 0x2,
    },
    rotation2,
  );
  return { x: Number(centerPx?.['x'] || 0x0) - box25['x'], y: Number(centerPx?.['y'] || 0x0) - box25['y'] };
};
