const SELECTION_RECT_ID = 'v2-selection-rect';
let active = false,
  rafId = 0,
  pendingBox = null;
function toFiniteNumber(_0x1307e3, _0x5db640 = 0) {
  const _0x35433e = Number(_0x1307e3);
  return Number.isFinite(_0x35433e) ? _0x35433e : _0x5db640;
}
function normalizeBox(_0x3114de = {}) {
  const _0x1c1619 = toFiniteNumber(_0x3114de.x1, 0),
    _0x4fb793 = toFiniteNumber(_0x3114de.y1, 0),
    _0x364566 = toFiniteNumber(_0x3114de.x2, _0x1c1619),
    _0x598317 = toFiniteNumber(_0x3114de.y2, _0x4fb793);
  return {
    x: Math.min(_0x1c1619, _0x364566),
    y: Math.min(_0x4fb793, _0x598317),
    width: Math.abs(_0x364566 - _0x1c1619),
    height: Math.abs(_0x598317 - _0x4fb793),
  };
}
function resolveSelectionRectEl() {
  if (typeof document === 'undefined') return null;
  return document.getElementById?.(SELECTION_RECT_ID) || null;
}
function applySelectionBox(_0x278f74) {
  const _0x585a26 = resolveSelectionRectEl();
  if (!_0x585a26?.style) return false;
  const _0x2ea559 = normalizeBox(_0x278f74);
  return (
    (_0x585a26.style.display = 'block'),
    (_0x585a26.style.left = _0x2ea559.x + 'px'),
    (_0x585a26.style.top = _0x2ea559.y + 'px'),
    (_0x585a26.style.width = _0x2ea559.width + 'px'),
    (_0x585a26.style.height = _0x2ea559.height + 'px'),
    true
  );
}
function cancelScheduledFrame() {
  if (!rafId) return;
  (typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(rafId), (rafId = 0));
}
function flushPreviewFrame() {
  rafId = 0;
  if (!pendingBox) return;
  const _0x18accc = pendingBox;
  ((pendingBox = null), applySelectionBox(_0x18accc));
}
function schedulePreviewFrame() {
  if (rafId) return;
  if (typeof requestAnimationFrame === 'function') {
    rafId = requestAnimationFrame(flushPreviewFrame);
    return;
  }
  flushPreviewFrame();
}
export function beginSelectionBoxPreview(_0x455811) {
  ((active = true), (pendingBox = null), applySelectionBox(_0x455811));
}
export function updateSelectionBoxPreview(_0x3688c7) {
  if (!active) {
    beginSelectionBoxPreview(_0x3688c7);
    return;
  }
  ((pendingBox = _0x3688c7), schedulePreviewFrame());
}
export function cancelSelectionBoxPreview() {
  (cancelScheduledFrame(), (active = false), (pendingBox = null));
  const _0x57c21b = resolveSelectionRectEl();
  _0x57c21b?.style && (_0x57c21b.style.display = 'none');
}
export function isSelectionBoxPreviewActive() {
  return active;
}
