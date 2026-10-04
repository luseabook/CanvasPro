export const IMAGE_BRUSH_MIN_SIZE_PX = 1;
export const IMAGE_BRUSH_MAX_SIZE_PX = 120;
export const IMAGE_BRUSH_ERASER_MIN_WIDTH = 6;
export const IMAGE_BRUSH_ERASER_EDGE_CLEANUP_PX = 2;
export const IMAGE_BRUSH_DEFAULT_SIZE_PX = 40;
export function clampImageBrushSize(value, item = IMAGE_BRUSH_DEFAULT_SIZE_PX) {
  const key = Number(value),
    index = Number(item),
    result = Number.isFinite(key) ? key : Number.isFinite(index) ? index : IMAGE_BRUSH_DEFAULT_SIZE_PX;
  return Math.max(IMAGE_BRUSH_MIN_SIZE_PX, Math.min(IMAGE_BRUSH_MAX_SIZE_PX, result));
}
export function getBrushLineWidth(data, options = 1, target = 'brush') {
  const source = Number(data),
    next = Number(options),
    current = (Number.isFinite(source) ? source : 0) * (Number.isFinite(next) ? next : 1);
  return Math.max(target === 'eraser' ? IMAGE_BRUSH_ERASER_MIN_WIDTH : 1, current);
}
export function getEraserClearLineWidth(entry) {
  const record = Math.max(1, Number(entry) || 1);
  return record + IMAGE_BRUSH_ERASER_EDGE_CLEANUP_PX;
}
export function mapBrushPoints(payload, handle = 1, state = handle) {
  const config = Number.isFinite(Number(handle)) ? Number(handle) : 1,
    scope = Number.isFinite(Number(state)) ? Number(state) : config;
  return (Array.isArray(payload) ? payload : [])
    .map((box) => ({ x: Number(box?.x) * config, y: Number(box?.y) * scope }))
    .filter((box2) => Number.isFinite(box2.x) && Number.isFinite(box2.y));
}
export function drawRoundBrushStroke(
  ctx,
  {
    points: points = [],
    lineWidth: lineWidth = 1,
    strokeStyle: strokeStyle,
    fillStyle: fillStyle = strokeStyle,
    globalCompositeOperation: globalCompositeOperation,
    globalAlpha: globalAlpha,
  } = {},
) {
  if (!ctx || !Array.isArray(points) || !points.length) return false;
  const input = Math.max(1, Number(lineWidth) || 1),
    list = mapBrushPoints(points, 1, 1);
  if (!list.length) return false;
  ((ctx.lineCap = 'round'), (ctx.lineJoin = 'round'), (ctx.lineWidth = input));
  typeof globalCompositeOperation === 'string' && (ctx.globalCompositeOperation = globalCompositeOperation);
  Number.isFinite(Number(globalAlpha)) && (ctx.globalAlpha = Math.max(0, Math.min(1, Number(globalAlpha))));
  if (strokeStyle !== undefined) ctx.strokeStyle = strokeStyle;
  if (fillStyle !== undefined) ctx.fillStyle = fillStyle;
  if (list.length === 1) {
    const box3 = list[0];
    return (
      ctx.beginPath(),
      typeof ctx.arc === 'function' && typeof ctx.fill === 'function'
        ? (ctx.arc(box3.x, box3.y, Math.max(0.5, input / 2), 0, Math.PI * 2), ctx.fill())
        : (ctx.moveTo(box3.x, box3.y), ctx.lineTo(box3.x + 0.001, box3.y), ctx.stroke()),
      true
    );
  }
  return (
    ctx.beginPath(),
    list.forEach((box4, count) => {
      if (count === 0) ctx.moveTo(box4.x, box4.y);
      else ctx.lineTo(box4.x, box4.y);
    }),
    ctx.stroke(),
    true
  );
}
export function syncCircularBrushCursor({
  cursorEl: cursorEl,
  canvasEl: canvasEl,
  visible: visible = true,
  tool: tool = 'brush',
  allowedTools: allowedTools = ['brush', 'eraser', 'bucket'],
  sizePx: sizePx = IMAGE_BRUSH_DEFAULT_SIZE_PX,
  cursorLast: cursorLast = { x: 0, y: 0 },
  isEraseBrush: isEraseBrush = false,
  hiddenCursor: hiddenCursor = 'var(--precision-cursor)',
  activeCursor: activeCursor = 'none',
  eraseClassName: eraseClassName = 'is-erase-brush',
} = {}) {
  if (!cursorEl) return false;
  const map = new Set(allowedTools);
  if (!visible || !map.has(tool)) {
    ((cursorEl.style.display = 'none'), cursorEl.classList?.remove?.(eraseClassName));
    if (canvasEl) canvasEl.style.cursor = hiddenCursor;
    return false;
  }
  const clampImageBrushSize2 = clampImageBrushSize(sizePx);
  ((cursorEl.style.display = 'block'),
    (cursorEl.style.width = clampImageBrushSize2 + 'px'),
    (cursorEl.style.height = clampImageBrushSize2 + 'px'),
    (cursorEl.style.left = (Number(cursorLast?.x) || 0) + 'px'),
    (cursorEl.style.top = (Number(cursorLast?.y) || 0) + 'px'),
    cursorEl.classList?.toggle?.(eraseClassName, Boolean(isEraseBrush)));
  if (canvasEl) canvasEl.style.cursor = activeCursor;
  return true;
}
