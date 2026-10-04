const TAU = Math['PI'] * 0x2,
  STRAIGHT_BEND_EPSILON = 0.0001,
  finiteNumberOr = (value, item = 0x0) => {
    const key = Number(value);
    return Number['isFinite'](key) ? key : item;
  },
  positiveAngle = (index) => {
    const count = index % TAU;
    return count < 0x0 ? count + TAU : count;
  },
  getArrowEndpoints = (result) => ({
    start: { x: finiteNumberOr(result?.['x1']), y: finiteNumberOr(result?.['y1']) },
    end: { x: finiteNumberOr(result?.['x2']), y: finiteNumberOr(result?.['y2']) },
  }),
  getLineGeometry = (start, end) => {
    const x = end['x'] - start['x'],
      y = end['y'] - start['y'],
      length = Math['hypot'](x, y),
      startTangent = length > 0x0 ? { x: x / length, y: y / length } : { x: 0x1, y: 0x0 };
    return {
      type: 'straight',
      start: start,
      end: end,
      middle: { x: (start['x'] + end['x']) / 0x2, y: (start['y'] + end['y']) / 0x2 },
      length: length,
      startTangent: startTangent,
      endTangent: startTangent,
    };
  },
  getSegmentDistance = (box, box2, box3) => {
    const data = box3['x'] - box2['x'],
      options = box3['y'] - box2['y'],
      count2 = data * data + options * options;
    if (count2 <= 0x0) return Math['hypot'](box['x'] - box2['x'], box['y'] - box2['y']);
    const target = Math['max'](
      0x0,
      Math['min'](0x1, ((box['x'] - box2['x']) * data + (box['y'] - box2['y']) * options) / count2),
    );
    return Math['hypot'](box['x'] - (box2['x'] + data * target), box['y'] - (box2['y'] + options * target));
  },
  getElbowGeometry = (y2, y3, source = 0x0) => {
    const next = y3['x'] - y2['x'],
      current = y3['y'] - y2['y'],
      horizontalRoute = Math['abs'](next) >= Math['abs'](current),
      x2 = horizontalRoute
        ? {
            x: (y2['x'] + y3['x']) / 0x2 + source,
            y: (y2['y'] + y3['y']) / 0x2,
          }
        : {
            x: (y2['x'] + y3['x']) / 0x2,
            y: (y2['y'] + y3['y']) / 0x2 + source,
          },
      points = horizontalRoute
        ? [y2, { x: x2['x'], y: y2['y'] }, { x: x2['x'], y: y3['y'] }, y3]
        : [y2, { x: y2['x'], y: x2['y'] }, { x: y3['x'], y: x2['y'] }, y3],
      startTangent2 = [];
    let length2 = 0x0;
    for (let entry = 0x1; entry < points['length']; entry += 0x1) {
      const x3 = points[entry]['x'] - points[entry - 0x1]['x'],
        y4 = points[entry]['y'] - points[entry - 0x1]['y'],
        record = Math['hypot'](x3, y4);
      if (record <= STRAIGHT_BEND_EPSILON) continue;
      ((length2 += record), startTangent2['push']({ tangent: { x: x3 / record, y: y4 / record } }));
    }
    const lineGeometry = getLineGeometry(y2, y3)['startTangent'];
    return {
      type: 'elbow',
      start: y2,
      end: y3,
      middle: x2,
      points: points,
      horizontalRoute: horizontalRoute,
      length: length2,
      startTangent: startTangent2[0x0]?.['tangent'] || lineGeometry,
      endTangent: startTangent2['at'](-0x1)?.['tangent'] || lineGeometry,
    };
  };
export function getArrowGeometry(payload) {
  const { start: start2, end: end2 } = getArrowEndpoints(payload),
    x4 = getLineGeometry(start2, end2),
    handle = String(payload?.['arrowKind'] || '')['trim']();
  if (handle === 'elbow') return getElbowGeometry(start2, end2, finiteNumberOr(payload?.['elbowOffset']));
  if (handle === 'straight') return x4;
  const finiteNumberOr2 = finiteNumberOr(payload?.['bend']);
  if (x4['length'] <= STRAIGHT_BEND_EPSILON || Math['abs'](finiteNumberOr2) < STRAIGHT_BEND_EPSILON)
    return x4;
  const y5 = end2['x'] - start2['x'],
    state = end2['y'] - start2['y'],
    box4 = { x: -state / x4['length'], y: y5 / x4['length'] },
    middle = {
      x: x4['middle']['x'] + box4['x'] * finiteNumberOr2,
      y: x4['middle']['y'] + box4['y'] * finiteNumberOr2,
    },
    config = x4['length'] / 0x2,
    scope = (finiteNumberOr2 * finiteNumberOr2 - config * config) / (0x2 * finiteNumberOr2),
    center = {
      x: x4['middle']['x'] + box4['x'] * scope,
      y: x4['middle']['y'] + box4['y'] * scope,
    },
    radius = Math['hypot'](config, scope);
  if (!Number['isFinite'](radius) || radius <= STRAIGHT_BEND_EPSILON) return x4;
  const startAngle = Math['atan2'](start2['y'] - center['y'], start2['x'] - center['x']),
    endAngle = Math['atan2'](end2['y'] - center['y'], end2['x'] - center['x']),
    input = Math['atan2'](middle['y'] - center['y'], middle['x'] - center['x']),
    positiveAngle2 = positiveAngle(endAngle - startAngle),
    positiveAngle3 = positiveAngle(input - startAngle),
    anticlockwise = positiveAngle3 > positiveAngle2 + STRAIGHT_BEND_EPSILON,
    sweep = anticlockwise ? positiveAngle(startAngle - endAngle) : positiveAngle2;
  if (!Number['isFinite'](sweep) || sweep <= STRAIGHT_BEND_EPSILON) return x4;
  const output = anticlockwise ? -0x1 : 0x1,
    startTangent3 = (value2) => ({
      x: -Math['sin'](value2) * output,
      y: Math['cos'](value2) * output,
    });
  return {
    type: 'arc',
    start: start2,
    end: end2,
    middle: middle,
    center: center,
    radius: radius,
    startAngle: startAngle,
    endAngle: endAngle,
    anticlockwise: anticlockwise,
    sweep: sweep,
    length: radius * sweep,
    startTangent: startTangent3(startAngle),
    endTangent: startTangent3(endAngle),
  };
}
export function getArrowElbowOffsetFromPoint(value3, box5) {
  const { start: start3, end: end3 } = getArrowEndpoints(value3),
    value4 = Math['abs'](end3['x'] - start3['x']) >= Math['abs'](end3['y'] - start3['y']);
  return value4
    ? finiteNumberOr(box5?.['x']) - (start3['x'] + end3['x']) / 0x2
    : finiteNumberOr(box5?.['y']) - (start3['y'] + end3['y']) / 0x2;
}
export function getArrowBendFromPoint(value5, box6) {
  const { start: start4, end: end4 } = getArrowEndpoints(value5),
    y6 = end4['x'] - start4['x'],
    value6 = end4['y'] - start4['y'],
    value7 = Math['hypot'](y6, value6);
  if (value7 <= STRAIGHT_BEND_EPSILON) return 0x0;
  const box7 = {
      x: (start4['x'] + end4['x']) / 0x2,
      y: (start4['y'] + end4['y']) / 0x2,
    },
    box8 = { x: -value6 / value7, y: y6 / value7 };
  return (
    (finiteNumberOr(box6?.['x']) - box7['x']) * box8['x'] +
    (finiteNumberOr(box6?.['y']) - box7['y']) * box8['y']
  );
}
export function getDistanceToArrowPath(box9, value8) {
  const arrowGeometry = getArrowGeometry(value8),
    x5 = finiteNumberOr(box9?.['x']),
    y7 = finiteNumberOr(box9?.['y']);
  if (arrowGeometry['type'] === 'straight')
    return getSegmentDistance({ x: x5, y: y7 }, arrowGeometry['start'], arrowGeometry['end']);
  if (arrowGeometry['type'] === 'elbow') {
    let value9 = Number['POSITIVE_INFINITY'];
    for (let value10 = 0x1; value10 < arrowGeometry['points']['length']; value10 += 0x1) {
      value9 = Math['min'](
        value9,
        getSegmentDistance(
          { x: x5, y: y7 },
          arrowGeometry['points'][value10 - 0x1],
          arrowGeometry['points'][value10],
        ),
      );
    }
    return value9;
  }
  const value11 = Math['atan2'](y7 - arrowGeometry['center']['y'], x5 - arrowGeometry['center']['x']),
    value12 = arrowGeometry['anticlockwise']
      ? positiveAngle(arrowGeometry['startAngle'] - value11)
      : positiveAngle(value11 - arrowGeometry['startAngle']);
  if (value12 <= arrowGeometry['sweep'] + STRAIGHT_BEND_EPSILON)
    return Math['abs'](
      Math['hypot'](x5 - arrowGeometry['center']['x'], y7 - arrowGeometry['center']['y']) -
        arrowGeometry['radius'],
    );
  return Math['min'](
    Math['hypot'](x5 - arrowGeometry['start']['x'], y7 - arrowGeometry['start']['y']),
    Math['hypot'](x5 - arrowGeometry['end']['x'], y7 - arrowGeometry['end']['y']),
  );
}
