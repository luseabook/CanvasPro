const EPSILON = 0.000001,
  finiteNumberOr = (value, item = 0x0) => {
    const key = Number(value);
    return Number['isFinite'](key) ? key : item;
  },
  toPoint = (box) => ({ x: finiteNumberOr(box?.['x']), y: finiteNumberOr(box?.['y']) }),
  cross = (box2, box3, box4) =>
    (box3['x'] - box2['x']) * (box4['y'] - box2['y']) - (box3['y'] - box2['y']) * (box4['x'] - box2['x']),
  isPointOnSegment = (box5, box6, box7) =>
    Math['abs'](cross(box6, box7, box5)) <= EPSILON &&
    box5['x'] >= Math['min'](box6['x'], box7['x']) - EPSILON &&
    box5['x'] <= Math['max'](box6['x'], box7['x']) + EPSILON &&
    box5['y'] >= Math['min'](box6['y'], box7['y']) - EPSILON &&
    box5['y'] <= Math['max'](box6['y'], box7['y']) + EPSILON,
  segmentsIntersect = (index, result, data, options) => {
    const cross2 = cross(index, result, data),
      cross3 = cross(index, result, options),
      cross4 = cross(data, options, index),
      cross5 = cross(data, options, result);
    if (
      ((cross2 > EPSILON && cross3 < -EPSILON) || (cross2 < -EPSILON && cross3 > EPSILON)) &&
      ((cross4 > EPSILON && cross5 < -EPSILON) || (cross4 < -EPSILON && cross5 > EPSILON))
    )
      return !![];
    return (
      (Math['abs'](cross2) <= EPSILON && isPointOnSegment(data, index, result)) ||
      (Math['abs'](cross3) <= EPSILON && isPointOnSegment(options, index, result)) ||
      (Math['abs'](cross4) <= EPSILON && isPointOnSegment(index, data, options)) ||
      (Math['abs'](cross5) <= EPSILON && isPointOnSegment(result, data, options))
    );
  };
export function snapWhiteboardPointToAngle(target, source, next = Math['PI'] / 0xc) {
  const x = toPoint(target),
    box8 = toPoint(source),
    current = box8['x'] - x['x'],
    entry = box8['y'] - x['y'],
    record = Math['hypot'](current, entry);
  if (record <= EPSILON) return { ...x };
  const payload = Math['max'](EPSILON, Math['abs'](finiteNumberOr(next, Math['PI'] / 0xc))),
    handle = Math['round'](Math['atan2'](entry, current) / payload) * payload;
  return {
    x: x['x'] + Math['cos'](handle) * record,
    y: x['y'] + Math['sin'](handle) * record,
  };
}
export function getPointToSegmentDistance(state, config, scope) {
  const box9 = toPoint(state),
    box10 = toPoint(config),
    box11 = toPoint(scope),
    input = box11['x'] - box10['x'],
    output = box11['y'] - box10['y'],
    value2 = input * input + output * output;
  if (value2 <= EPSILON) return Math['hypot'](box9['x'] - box10['x'], box9['y'] - box10['y']);
  const value3 = Math['max'](
    0x0,
    Math['min'](0x1, ((box9['x'] - box10['x']) * input + (box9['y'] - box10['y']) * output) / value2),
  );
  return Math['hypot'](box9['x'] - (box10['x'] + input * value3), box9['y'] - (box10['y'] + output * value3));
}
export function getSegmentToSegmentDistance(value4, value5, value6, value7) {
  const toPoint2 = toPoint(value4),
    toPoint3 = toPoint(value5),
    toPoint4 = toPoint(value6),
    toPoint5 = toPoint(value7);
  if (segmentsIntersect(toPoint2, toPoint3, toPoint4, toPoint5)) return 0x0;
  return Math['min'](
    getPointToSegmentDistance(toPoint2, toPoint4, toPoint5),
    getPointToSegmentDistance(toPoint3, toPoint4, toPoint5),
    getPointToSegmentDistance(toPoint4, toPoint2, toPoint3),
    getPointToSegmentDistance(toPoint5, toPoint2, toPoint3),
  );
}
export function doesSegmentHitPolyline(value8, value9, value10, value11 = 0x0) {
  const list = (Array['isArray'](value10) ? value10 : [])['map'](toPoint);
  if (list['length'] === 0x0) return ![];
  const value12 = Math['max'](0x0, finiteNumberOr(value11));
  if (list['length'] === 0x1) return getPointToSegmentDistance(list[0x0], value8, value9) <= value12;
  for (let value13 = 0x1; value13 < list['length']; value13 += 0x1) {
    if (getSegmentToSegmentDistance(value8, value9, list[value13 - 0x1], list[value13]) <= value12)
      return !![];
  }
  return ![];
}
export function getPolylineBounds(value14, value15 = 0x0) {
  let x2 = Infinity,
    y = Infinity,
    width = -Infinity,
    height = -Infinity;
  (Array['isArray'](value14) ? value14 : [])['forEach']((box12) => {
    const value16 = Number(box12?.['x']),
      value17 = Number(box12?.['y']);
    if (!Number['isFinite'](value16) || !Number['isFinite'](value17)) return;
    ((x2 = Math['min'](x2, value16)),
      (y = Math['min'](y, value17)),
      (width = Math['max'](width, value16)),
      (height = Math['max'](height, value17)));
  });
  if (!Number['isFinite'](x2) || !Number['isFinite'](y)) return null;
  const value18 = Math['max'](0x0, finiteNumberOr(value15));
  return {
    x: x2 - value18,
    y: y - value18,
    width: width - x2 + value18 * 0x2,
    height: height - y + value18 * 0x2,
  };
}
const isPointInBounds = (box13, box14) =>
  box13['x'] >= box14['x'] &&
  box13['x'] <= box14['x'] + box14['width'] &&
  box13['y'] >= box14['y'] &&
  box13['y'] <= box14['y'] + box14['height'];
export function doesSegmentHitBounds(value19, value20, box15, value21 = 0x0) {
  const value22 = Math['max'](0x0, finiteNumberOr(value21)),
    x3 = {
      x: finiteNumberOr(box15?.['x']) - value22,
      y: finiteNumberOr(box15?.['y']) - value22,
      width: Math['max'](0x0, finiteNumberOr(box15?.['width'])) + value22 * 0x2,
      height: Math['max'](0x0, finiteNumberOr(box15?.['height'])) + value22 * 0x2,
    },
    toPoint6 = toPoint(value19),
    toPoint7 = toPoint(value20);
  if (isPointInBounds(toPoint6, x3) || isPointInBounds(toPoint7, x3)) return !![];
  const value23 = { x: x3['x'], y: x3['y'] },
    value24 = { x: x3['x'] + x3['width'], y: x3['y'] },
    value25 = { x: x3['x'] + x3['width'], y: x3['y'] + x3['height'] },
    value26 = { x: x3['x'], y: x3['y'] + x3['height'] };
  return [
    [value23, value24],
    [value24, value25],
    [value25, value26],
    [value26, value23],
  ]['some'](([value27, value28]) => segmentsIntersect(toPoint6, toPoint7, value27, value28));
}
export function doesSegmentHitCircle(value29, value30, value31, value32) {
  return getPointToSegmentDistance(value31, value29, value30) <= Math['max'](0x0, finiteNumberOr(value32));
}
const isPointInPolygon = (box16, list2) => {
  let enabled = ![];
  for (let value33 = 0x0, value34 = list2['length'] - 0x1; value33 < list2['length']; value34 = value33++) {
    const box17 = list2[value33],
      box18 = list2[value34],
      value35 =
        box17['y'] > box16['y'] !== box18['y'] > box16['y'] &&
        box16['x'] <
          ((box18['x'] - box17['x']) * (box16['y'] - box17['y'])) / (box18['y'] - box17['y'] || EPSILON) +
            box17['x'];
    if (value35) enabled = !enabled;
  }
  return enabled;
};
export function doesSegmentHitPolygon(value36, value37, value38, value39 = 0x0) {
  const list3 = (Array['isArray'](value38) ? value38 : [])['map'](toPoint);
  if (list3['length'] < 0x2) return ![];
  const toPoint8 = toPoint(value36),
    toPoint9 = toPoint(value37);
  if (isPointInPolygon(toPoint8, list3) || isPointInPolygon(toPoint9, list3)) return !![];
  const value40 = Math['max'](0x0, finiteNumberOr(value39));
  for (let value41 = 0x0; value41 < list3['length']; value41 += 0x1) {
    const value42 = list3[value41],
      value43 = list3[(value41 + 0x1) % list3['length']];
    if (getSegmentToSegmentDistance(toPoint8, toPoint9, value42, value43) <= value40) return !![];
  }
  return ![];
}
