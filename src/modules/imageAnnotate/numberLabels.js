const MIN_NUMBER_LABEL_DIAMETER_PX = 18,
  getFiniteNumber = (value, item = 0) => {
    const key = Number(value);
    return Number.isFinite(key) ? key : item;
  },
  getFinitePoint = (box) => {
    const x = Number(box?.x),
      y = Number(box?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x: x, y: y };
  },
  getDistanceSq = (box2, box3) => {
    const index = box2.x - box3.x,
      result = box2.y - box3.y;
    return index * index + result * result;
  },
  getDistanceSqToSegment = (box4, x2, box5) => {
    const data = box5.x - x2.x,
      options = box5.y - x2.y,
      count = data * data + options * options;
    if (count <= 0) return getDistanceSq(box4, x2);
    const target = Math.max(0, Math.min(1, ((box4.x - x2.x) * data + (box4.y - x2.y) * options) / count));
    return getDistanceSq(box4, {
      x: x2.x + data * target,
      y: x2.y + options * target,
    });
  },
  getNumberLabelEraseRadius = (source) =>
    Math.max(1, getFiniteNumber(source?.sizeWorld, MIN_NUMBER_LABEL_DIAMETER_PX) * 0.3),
  getEraserRadius = (next) => Math.max(1, getFiniteNumber(next?.sizeWorld, MIN_NUMBER_LABEL_DIAMETER_PX) / 2);
function doesEraserCoverNumberLabel(current, entry) {
  if (entry?.type !== 'eraser') return false;
  const finitePoint = getFinitePoint(current);
  if (!finitePoint) return false;
  const list = (Array.isArray(entry?.points) ? entry.points : []).map(getFinitePoint).filter(Boolean);
  if (!list.length) return false;
  const numberLabelEraseRadius = getNumberLabelEraseRadius(current) + getEraserRadius(entry),
    record = numberLabelEraseRadius * numberLabelEraseRadius;
  if (list.length === 1) return getDistanceSq(finitePoint, list[0]) <= record;
  for (let payload = 1; payload < list.length; payload += 1) {
    if (getDistanceSqToSegment(finitePoint, list[payload - 1], list[payload]) <= record) return true;
  }
  return false;
}
export function normalizeNumberLabelValue(handle, state = 1) {
  const count2 = Math.floor(Number(handle));
  if (Number.isFinite(count2) && count2 > 0) return count2;
  const count3 = Math.floor(Number(state));
  return Number.isFinite(count3) && count3 > 0 ? count3 : 1;
}
export function getNextNumberLabelValue(list2 = []) {
  const list3 = Array.isArray(list2) ? list2 : [],
    map = new Set();
  list3.forEach((item2, config) => {
    if (item2?.type !== 'number-label') return;
    const enabled = list3.slice(config + 1).some((item3) => doesEraserCoverNumberLabel(item2, item3));
    if (!enabled) map.add(normalizeNumberLabelValue(item2.number));
  });
  let scope = 1;
  while (map.has(scope)) scope += 1;
  return scope;
}
export function drawNumberLabel({
  ctx: ctx,
  x: x3,
  y: y2,
  number: number,
  diameter: diameter,
  color: color,
  backgroundColor: backgroundColor = '',
} = {}) {
  if (!ctx) return false;
  const input = Number(x3),
    output = Number(y2);
  if (!Number.isFinite(input) || !Number.isFinite(output)) return false;
  const value2 = Math.max(
      MIN_NUMBER_LABEL_DIAMETER_PX,
      Number.isFinite(Number(diameter)) ? Number(diameter) : 0,
    ),
    value3 = value2 / 2,
    list4 = String(normalizeNumberLabelValue(number)),
    value4 = list4.length <= 2 ? 0.52 : list4.length === 3 ? 0.42 : 0.34,
    value5 = Math.max(10, value2 * value4),
    value6 = Math.max(2, value2 * 0.08);
  return (
    ctx.save(),
    (ctx.globalCompositeOperation = 'source-over'),
    ctx.beginPath(),
    ctx.arc(input, output, value3, 0, Math.PI * 2),
    backgroundColor &&
      ((ctx.globalAlpha = 0.86), (ctx.fillStyle = backgroundColor), ctx.fill(), (ctx.globalAlpha = 1)),
    color && ((ctx.strokeStyle = color), (ctx.lineWidth = value6), ctx.stroke(), (ctx.fillStyle = color)),
    (ctx.font = '700 ' + value5 + 'px sans-serif'),
    (ctx.textAlign = 'center'),
    (ctx.textBaseline = 'middle'),
    ctx.fillText(list4, input, output),
    ctx.restore(),
    true
  );
}
export function drawNumberLabelCommand({
  ctx: ctx2,
  cmd: cmd,
  scaleX: scaleX = 1,
  scaleY: scaleY = scaleX,
  defaultColor: defaultColor = '',
  backgroundColor: backgroundColor = '',
} = {}) {
  const value7 = Number.isFinite(Number(scaleX)) ? Number(scaleX) : 1,
    value8 = Number.isFinite(Number(scaleY)) ? Number(scaleY) : value7,
    value9 = Math.max(0.001, Math.abs(value7)),
    value10 = Number(cmd?.sizeWorld);
  return drawNumberLabel({
    ctx: ctx2,
    x: Number(cmd?.x) * value7,
    y: Number(cmd?.y) * value8,
    number: cmd?.number,
    diameter: Number.isFinite(value10) ? value10 * value9 : MIN_NUMBER_LABEL_DIAMETER_PX,
    color: cmd?.color || defaultColor,
    backgroundColor: backgroundColor,
  });
}
