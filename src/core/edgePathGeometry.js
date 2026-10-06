export const CONNECTION_LINE_STYLES = Object.freeze({
  CURVE: 'curve',
  ORTHOGONAL: 'orthogonal',
  STRAIGHT: 'straight',
});
const CONNECTION_ROUTE_CLEARANCE = 60;
export function normalizeConnectionLineStyle(value) {
  const item = String(value || '').trim();
  return item === CONNECTION_LINE_STYLES.ORTHOGONAL || item === CONNECTION_LINE_STYLES.STRAIGHT
    ? item
    : CONNECTION_LINE_STYLES.CURVE;
}
function normalizeNumber(key, index = 0) {
  const result = Number(key);
  return Number.isFinite(result) ? result : index;
}
export function resolveConnectionEndpoints({
  sourceX: sourceX,
  sourceY: sourceY,
  sourceWidth: sourceWidth,
  sourceHeight: sourceHeight,
  targetX: targetX,
  targetY: targetY,
  targetHeight: targetHeight,
} = {}) {
  const number = normalizeNumber(sourceX),
    number2 = normalizeNumber(sourceY),
    data = Math.max(0, normalizeNumber(sourceWidth)),
    options = Math.max(0, normalizeNumber(sourceHeight)),
    number3 = normalizeNumber(targetX),
    number4 = normalizeNumber(targetY),
    target = Math.max(0, normalizeNumber(targetHeight)),
    startX = number + data,
    startY = number2 + options / 2,
    endX = number3,
    endY = number4 + target / 2;
  let orthogonalRouteY = null;
  if (endX < startX) {
    const source = number2 + options,
      next = number4 + target;
    if (source <= number4) orthogonalRouteY = (source + number4) / 2;
    else {
      if (next <= number2) orthogonalRouteY = (next + number2) / 2;
      else {
        const current = Math.min(number2, number4) - CONNECTION_ROUTE_CLEARANCE,
          entry = Math.max(source, next) + CONNECTION_ROUTE_CLEARANCE,
          record = Math.abs(startY - current) + Math.abs(endY - current),
          payload = Math.abs(startY - entry) + Math.abs(endY - entry);
        orthogonalRouteY = payload <= record ? entry : current;
      }
    }
  }
  return {
    startX: startX,
    startY: startY,
    startSide: 'right',
    endX: endX,
    endY: endY,
    endSide: 'left',
    orthogonalRouteY: orthogonalRouteY,
  };
}
export function buildConnectionPathGeometry({
  startX: startX2,
  startY: startY2,
  endX: endX2,
  endY: endY2,
  style: style,
  startSide: startSide = 'right',
  endSide: endSide = 'left',
  orthogonalRouteY: orthogonalRouteY2,
  curveOffset: curveOffset,
} = {}) {
  const startX3 = normalizeNumber(startX2),
    startY3 = normalizeNumber(startY2),
    endX3 = normalizeNumber(endX2),
    endY3 = normalizeNumber(endY2),
    pathStyle = normalizeConnectionLineStyle(style),
    endpointSignature =
      startX3.toFixed(1) +
      ',' +
      startY3.toFixed(1) +
      ',' +
      endX3.toFixed(1) +
      ',' +
      endY3.toFixed(1);
  if (pathStyle === CONNECTION_LINE_STYLES.STRAIGHT)
    return {
      pathStyle: pathStyle,
      startX: startX3,
      startY: startY3,
      startSide: startSide,
      endX: endX3,
      endY: endY3,
      endSide: endSide,
      hitPoints: [
        { x: startX3, y: startY3 },
        { x: endX3, y: endY3 },
      ],
      d: 'M ' + startX3 + ' ' + startY3 + ' L ' + endX3 + ' ' + endY3,
      endpointSignature: endpointSignature,
    };
  if (pathStyle === CONNECTION_LINE_STYLES.ORTHOGONAL) {
    const handle = startSide === 'right' && endSide === 'left' && endX3 < startX3;
    if (handle) {
      const x = startX3 + CONNECTION_ROUTE_CLEARANCE,
        x2 = endX3 - CONNECTION_ROUTE_CLEARANCE,
        y = Number.isFinite(Number(orthogonalRouteY2))
          ? Number(orthogonalRouteY2)
          : (startY3 + endY3) / 2;
      return {
        pathStyle: pathStyle,
        startX: startX3,
        startY: startY3,
        startSide: startSide,
        endX: endX3,
        endY: endY3,
        endSide: endSide,
        hitPoints: [
          { x: startX3, y: startY3 },
          { x: x, y: startY3 },
          { x: x, y: y },
          { x: x2, y: y },
          { x: x2, y: endY3 },
          { x: endX3, y: endY3 },
        ],
        d:
          'M ' +
          startX3 +
          ' ' +
          startY3 +
          ' H ' +
          x +
          ' V ' +
          y +
          ' H ' +
          x2 +
          ' V ' +
          endY3 +
          ' H ' +
          endX3,
        endpointSignature: endpointSignature,
      };
    }
    const x3 = (startX3 + endX3) / 2;
    return {
      pathStyle: pathStyle,
      startX: startX3,
      startY: startY3,
      startSide: startSide,
      endX: endX3,
      endY: endY3,
      endSide: endSide,
      hitPoints: [
        { x: startX3, y: startY3 },
        { x: x3, y: startY3 },
        { x: x3, y: endY3 },
        { x: endX3, y: endY3 },
      ],
      d: 'M ' + startX3 + ' ' + startY3 + ' H ' + x3 + ' V ' + endY3 + ' H ' + endX3,
      endpointSignature: endpointSignature,
    };
  }
  const state = Math.max(Math.abs(endX3 - startX3) * 0.5, 60),
    config = Number.isFinite(Number(curveOffset)) ? Math.max(0, Number(curveOffset)) : state,
    scope = startSide === 'left' ? -1 : 1,
    control1X = startX3 + scope * config,
    control2X = endX3 - scope * config;
  return {
    pathStyle: pathStyle,
    startX: startX3,
    startY: startY3,
    startSide: startSide,
    control1X: control1X,
    control1Y: startY3,
    control2X: control2X,
    control2Y: endY3,
    endX: endX3,
    endY: endY3,
    endSide: endSide,
    hitPoints: null,
    d:
      'M ' +
      startX3 +
      ' ' +
      startY3 +
      ' C ' +
      control1X +
      ' ' +
      startY3 +
      ', ' +
      control2X +
      ' ' +
      endY3 +
      ', ' +
      endX3 +
      ' ' +
      endY3,
    endpointSignature: endpointSignature,
  };
}
