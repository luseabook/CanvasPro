export const IMAGE_BRUSH_MIN_SIZE_PX = 1;
export const IMAGE_BRUSH_MAX_SIZE_PX = 120;
export const IMAGE_BRUSH_ERASER_MIN_WIDTH = 6;
export const IMAGE_BRUSH_ERASER_EDGE_CLEANUP_PX = 2;
export const IMAGE_BRUSH_DEFAULT_SIZE_PX = 40;
export function clampImageBrushSize(_0x3743cb, _0x4a3265 = IMAGE_BRUSH_DEFAULT_SIZE_PX) {
  const _0x189756 = Number(_0x3743cb),
    _0x1383b3 = Number(_0x4a3265),
    _0x28b61a = Number.isFinite(_0x189756)
      ? _0x189756
      : Number.isFinite(_0x1383b3)
        ? _0x1383b3
        : IMAGE_BRUSH_DEFAULT_SIZE_PX;
  return Math.max(IMAGE_BRUSH_MIN_SIZE_PX, Math.min(IMAGE_BRUSH_MAX_SIZE_PX, _0x28b61a));
}
export function getBrushLineWidth(_0x1cb252, _0x3ed0c6 = 1, _0x1ec8b6 = 'brush') {
  const _0x138d88 = Number(_0x1cb252),
    _0x6c5272 = Number(_0x3ed0c6),
    _0x2ada78 = (Number.isFinite(_0x138d88) ? _0x138d88 : 0) * (Number.isFinite(_0x6c5272) ? _0x6c5272 : 1);
  return Math.max(_0x1ec8b6 === 'eraser' ? IMAGE_BRUSH_ERASER_MIN_WIDTH : 1, _0x2ada78);
}
export function getEraserClearLineWidth(_0x57a39e) {
  const _0x279958 = Math.max(1, Number(_0x57a39e) || 1);
  return _0x279958 + IMAGE_BRUSH_ERASER_EDGE_CLEANUP_PX;
}
export function mapBrushPoints(_0x78cdfa, _0x4b6bb0 = 1, _0x4c3efe = _0x4b6bb0) {
  const _0x5df126 = Number.isFinite(Number(_0x4b6bb0)) ? Number(_0x4b6bb0) : 1,
    _0x5a3d54 = Number.isFinite(Number(_0x4c3efe)) ? Number(_0x4c3efe) : _0x5df126;
  return (Array.isArray(_0x78cdfa) ? _0x78cdfa : [])
    .map((_0x4ec1b1) => ({ x: Number(_0x4ec1b1?.x) * _0x5df126, y: Number(_0x4ec1b1?.y) * _0x5a3d54 }))
    .filter((_0x3fb453) => Number.isFinite(_0x3fb453.x) && Number.isFinite(_0x3fb453.y));
}
export function drawRoundBrushStroke(
  _0x2f226d,
  {
    points: points = [],
    lineWidth: lineWidth = 1,
    strokeStyle: _0x3e968b,
    fillStyle: fillStyle = _0x3e968b,
    globalCompositeOperation: _0xe0f00c,
    globalAlpha: _0x164293,
  } = {},
) {
  if (!_0x2f226d || !Array.isArray(points) || !points.length) return false;
  const _0x1cdbf3 = Math.max(1, Number(lineWidth) || 1),
    _0x44f879 = mapBrushPoints(points, 1, 1);
  if (!_0x44f879.length) return false;
  ((_0x2f226d.lineCap = 'round'), (_0x2f226d.lineJoin = 'round'), (_0x2f226d.lineWidth = _0x1cdbf3));
  typeof _0xe0f00c === 'string' && (_0x2f226d.globalCompositeOperation = _0xe0f00c);
  Number.isFinite(Number(_0x164293)) && (_0x2f226d.globalAlpha = Math.max(0, Math.min(1, Number(_0x164293))));
  if (_0x3e968b !== undefined) _0x2f226d.strokeStyle = _0x3e968b;
  if (fillStyle !== undefined) _0x2f226d.fillStyle = fillStyle;
  if (_0x44f879.length === 1) {
    const _0x2c3fe0 = _0x44f879[0];
    return (
      _0x2f226d.beginPath(),
      typeof _0x2f226d.arc === 'function' && typeof _0x2f226d.fill === 'function'
        ? (_0x2f226d.arc(_0x2c3fe0.x, _0x2c3fe0.y, Math.max(0.5, _0x1cdbf3 / 2), 0, Math.PI * 2),
          _0x2f226d.fill())
        : (_0x2f226d.moveTo(_0x2c3fe0.x, _0x2c3fe0.y),
          _0x2f226d.lineTo(_0x2c3fe0.x + 0.001, _0x2c3fe0.y),
          _0x2f226d.stroke()),
      true
    );
  }
  return (
    _0x2f226d.beginPath(),
    _0x44f879.forEach((_0x4d3d84, _0xa5da89) => {
      if (_0xa5da89 === 0) _0x2f226d.moveTo(_0x4d3d84.x, _0x4d3d84.y);
      else _0x2f226d.lineTo(_0x4d3d84.x, _0x4d3d84.y);
    }),
    _0x2f226d.stroke(),
    true
  );
}
export function syncCircularBrushCursor({
  cursorEl: _0x4b7a80,
  canvasEl: _0x3b1959,
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
  if (!_0x4b7a80) return false;
  const _0x1d832b = new Set(allowedTools);
  if (!visible || !_0x1d832b.has(tool)) {
    ((_0x4b7a80.style.display = 'none'), _0x4b7a80.classList?.remove?.(eraseClassName));
    if (_0x3b1959) _0x3b1959.style.cursor = hiddenCursor;
    return false;
  }
  const _0x54c99f = clampImageBrushSize(sizePx);
  ((_0x4b7a80.style.display = 'block'),
    (_0x4b7a80.style.width = _0x54c99f + 'px'),
    (_0x4b7a80.style.height = _0x54c99f + 'px'),
    (_0x4b7a80.style.left = (Number(cursorLast?.x) || 0) + 'px'),
    (_0x4b7a80.style.top = (Number(cursorLast?.y) || 0) + 'px'),
    _0x4b7a80.classList?.toggle?.(eraseClassName, Boolean(isEraseBrush)));
  if (_0x3b1959) _0x3b1959.style.cursor = activeCursor;
  return true;
}
