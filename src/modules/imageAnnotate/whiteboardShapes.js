const finiteNumberOr = (value, item = 0) => {
    const key = Number(value);
    return Number['isFinite'](key) ? key : item;
  },
  addPolygon = (ctx, list) => {
    if (!list['length']) return;
    (ctx['moveTo'](list[0]['x'], list[0]['y']),
      list['slice'](1)['forEach']((box) => ctx['lineTo'](box['x'], box['y'])),
      ctx['closePath']());
  };
export function getWhiteboardShapeBounds(index) {
  const finiteNumberOr2 = finiteNumberOr(index?.['x1']),
    finiteNumberOr3 = finiteNumberOr(index?.['y1']),
    finiteNumberOr4 = finiteNumberOr(index?.['x2']),
    finiteNumberOr5 = finiteNumberOr(index?.['y2']);
  return {
    x: Math['min'](finiteNumberOr2, finiteNumberOr4),
    y: Math['min'](finiteNumberOr3, finiteNumberOr5),
    width: Math['abs'](finiteNumberOr4 - finiteNumberOr2),
    height: Math['abs'](finiteNumberOr5 - finiteNumberOr3),
  };
}
export function isClosedWhiteboardShape(result) {
  return result !== 'line' && result !== 'frame';
}
export function traceWhiteboardShapePath(ctx2, data, box2) {
  if (!ctx2) return false;
  const x = finiteNumberOr(box2?.['x']),
    y = finiteNumberOr(box2?.['y']),
    options = Math['max'](0, finiteNumberOr(box2?.['width'])),
    target = Math['max'](0, finiteNumberOr(box2?.['height'])),
    x2 = x + options,
    y2 = y + target,
    x3 = x + options / 2,
    y3 = y + target / 2;
  switch (data) {
    case 'circle':
      (ctx2['ellipse'](x3, y3, options / 2, target / 2, 0, 0, Math['PI'] * 2), ctx2['closePath']());
      return true;
    case 'triangle':
      addPolygon(ctx2, [
        { x: x3, y: y },
        { x: x2, y: y2 },
        { x: x, y: y2 },
      ]);
      return true;
    case 'diamond':
      addPolygon(ctx2, [
        { x: x3, y: y },
        { x: x2, y: y3 },
        { x: x3, y: y2 },
        { x: x, y: y3 },
      ]);
      return true;
    case 'hexagon':
      addPolygon(ctx2, [
        { x: x + options * 0.25, y: y },
        { x: x + options * 0.75, y: y },
        { x: x2, y: y3 },
        { x: x + options * 0.75, y: y2 },
        { x: x + options * 0.25, y: y2 },
        { x: x, y: y3 },
      ]);
      return true;
    case 'pill': {
      const source = Math['min'](options / 2, target / 2);
      return (
        ctx2['moveTo'](x + source, y),
        ctx2['lineTo'](x2 - source, y),
        ctx2['quadraticCurveTo'](x2, y, x2, y + source),
        ctx2['lineTo'](x2, y2 - source),
        ctx2['quadraticCurveTo'](x2, y2, x2 - source, y2),
        ctx2['lineTo'](x + source, y2),
        ctx2['quadraticCurveTo'](x, y2, x, y2 - source),
        ctx2['lineTo'](x, y + source),
        ctx2['quadraticCurveTo'](x, y, x + source, y),
        ctx2['closePath'](),
        true
      );
    }
    case 'parallelogram':
      addPolygon(ctx2, [
        { x: x + options * 0.2, y: y },
        { x: x2, y: y },
        { x: x + options * 0.8, y: y2 },
        { x: x, y: y2 },
      ]);
      return true;
    case 'star': {
      const list2 = [],
        next = Math['min'](options, target) / 2,
        current = next * 0.46;
      for (let count = 0; count < 10; count += 1) {
        const entry = count % 2 === 0 ? next : current,
          record = -Math['PI'] / 2 + (count * Math['PI']) / 5;
        list2['push']({
          x: x3 + Math['cos'](record) * entry,
          y: y3 + Math['sin'](record) * entry,
        });
      }
      return (addPolygon(ctx2, list2), true);
    }
    case 'cloud':
      (ctx2['moveTo'](x + options * 0.22, y2),
        ctx2['bezierCurveTo'](x, y2, x, y + target * 0.52, x + options * 0.2, y + target * 0.5),
        ctx2['bezierCurveTo'](
          x + options * 0.18,
          y + target * 0.22,
          x + options * 0.48,
          y + target * 0.12,
          x + options * 0.62,
          y + target * 0.35,
        ),
        ctx2['bezierCurveTo'](
          x + options * 0.86,
          y + target * 0.28,
          x2,
          y + target * 0.48,
          x2,
          y + target * 0.67,
        ),
        ctx2['bezierCurveTo'](x2, y2, x + options * 0.76, y2, x + options * 0.6, y2),
        ctx2['closePath']());
      return true;
    case 'heart':
      (ctx2['moveTo'](x3, y2),
        ctx2['bezierCurveTo'](
          x + options * 0.1,
          y + target * 0.65,
          x,
          y + target * 0.35,
          x + options * 0.22,
          y + target * 0.16,
        ),
        ctx2['bezierCurveTo'](x + options * 0.38, y, x3, y + target * 0.14, x3, y + target * 0.28),
        ctx2['bezierCurveTo'](
          x3,
          y + target * 0.14,
          x + options * 0.62,
          y,
          x + options * 0.78,
          y + target * 0.16,
        ),
        ctx2['bezierCurveTo'](x2, y + target * 0.35, x + options * 0.9, y + target * 0.65, x3, y2),
        ctx2['closePath']());
      return true;
    case 'crossed-box':
      (ctx2['rect'](x, y, options, target),
        ctx2['moveTo'](x, y),
        ctx2['lineTo'](x2, y2),
        ctx2['moveTo'](x2, y),
        ctx2['lineTo'](x, y2));
      return true;
    case 'checkbox':
      (ctx2['rect'](x, y, options, target),
        ctx2['moveTo'](x + options * 0.2, y3),
        ctx2['lineTo'](x + options * 0.42, y + target * 0.75),
        ctx2['lineTo'](x + options * 0.82, y + target * 0.22));
      return true;
    case 'arrow-left':
    case 'arrow-right':
    case 'arrow-up':
    case 'arrow-down': {
      const payload = data === 'arrow-left' || data === 'arrow-right',
        list3 = payload
          ? [
              { x: x, y: y3 },
              { x: x + options * 0.42, y: y },
              { x: x + options * 0.42, y: y + target * 0.28 },
              { x: x2, y: y + target * 0.28 },
              { x: x2, y: y + target * 0.72 },
              { x: x + options * 0.42, y: y + target * 0.72 },
              { x: x + options * 0.42, y: y2 },
            ]
          : [
              { x: x3, y: y },
              { x: x2, y: y + target * 0.42 },
              { x: x + options * 0.72, y: y + target * 0.42 },
              { x: x + options * 0.72, y: y2 },
              { x: x + options * 0.28, y: y2 },
              { x: x + options * 0.28, y: y + target * 0.42 },
              { x: x, y: y + target * 0.42 },
            ],
        x4 = data === 'arrow-right',
        y4 = data === 'arrow-down';
      return (
        addPolygon(
          ctx2,
          list3['map']((box3) => ({
            x: x4 ? x2 - (box3['x'] - x) : box3['x'],
            y: y4 ? y2 - (box3['y'] - y) : box3['y'],
          })),
        ),
        true
      );
    }
    case 'line':
      (ctx2['moveTo'](x, y2), ctx2['lineTo'](x2, y));
      return true;
    case 'frame': {
      const handle = Math['min'](options, target) * 0.25;
      return (
        ctx2['moveTo'](x, y + handle),
        ctx2['lineTo'](x, y),
        ctx2['lineTo'](x + handle, y),
        ctx2['moveTo'](x2 - handle, y),
        ctx2['lineTo'](x2, y),
        ctx2['lineTo'](x2, y + handle),
        ctx2['moveTo'](x2, y2 - handle),
        ctx2['lineTo'](x2, y2),
        ctx2['lineTo'](x2 - handle, y2),
        ctx2['moveTo'](x + handle, y2),
        ctx2['lineTo'](x, y2),
        ctx2['lineTo'](x, y2 - handle),
        true
      );
    }
    default:
      ctx2['rect'](x, y, options, target);
      return true;
  }
}
