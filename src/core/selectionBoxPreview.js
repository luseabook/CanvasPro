const SELECTION_RECT_ID = 'v2-selection-rect';
let active = false,
  rafId = 0,
  pendingBox = null;
function toFiniteNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function normalizeBox(options = {}) {
  const toFiniteNumber2 = toFiniteNumber(options.x1, 0),
    toFiniteNumber3 = toFiniteNumber(options.y1, 0),
    toFiniteNumber4 = toFiniteNumber(options.x2, toFiniteNumber2),
    toFiniteNumber5 = toFiniteNumber(options.y2, toFiniteNumber3);
  return {
    x: Math.min(toFiniteNumber2, toFiniteNumber4),
    y: Math.min(toFiniteNumber3, toFiniteNumber5),
    width: Math.abs(toFiniteNumber4 - toFiniteNumber2),
    height: Math.abs(toFiniteNumber5 - toFiniteNumber3),
  };
}
function resolveSelectionRectEl() {
  if (typeof document === 'undefined') return null;
  return document.getElementById?.(SELECTION_RECT_ID) || null;
}
function applySelectionBox(index) {
  const el = resolveSelectionRectEl();
  if (!el?.style) return false;
  const box = normalizeBox(index);
  return (
    (el.style.display = 'block'),
    (el.style.left = box.x + 'px'),
    (el.style.top = box.y + 'px'),
    (el.style.width = box.width + 'px'),
    (el.style.height = box.height + 'px'),
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
  const result = pendingBox;
  ((pendingBox = null), applySelectionBox(result));
}
function schedulePreviewFrame() {
  if (rafId) return;
  if (typeof requestAnimationFrame === 'function') {
    rafId = requestAnimationFrame(flushPreviewFrame);
    return;
  }
  flushPreviewFrame();
}
export function beginSelectionBoxPreview(data) {
  ((active = true), (pendingBox = null), applySelectionBox(data));
}
export function updateSelectionBoxPreview(target) {
  if (!active) {
    beginSelectionBoxPreview(target);
    return;
  }
  ((pendingBox = target), schedulePreviewFrame());
}
export function cancelSelectionBoxPreview() {
  (cancelScheduledFrame(), (active = false), (pendingBox = null));
  const el2 = resolveSelectionRectEl();
  el2?.style && (el2.style.display = 'none');
}
export function isSelectionBoxPreviewActive() {
  return active;
}
