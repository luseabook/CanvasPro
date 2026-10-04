const CANVAS_ID = 'v2-canvas',
  SIDE_PLUS_HOLDER_ID = 'v2-side-plus-holder';
export const VIEWPORT_PAN_PREVIEW_FRAME_EVENT = 'aicanvas:viewport-pan-preview-frame';
let active = false,
  dirty = false,
  canvasEl = null,
  sidePlusHolderEl = null,
  sidePlusHolderInitialTransform = '',
  rafId = 0,
  latestViewport = null,
  pendingViewport = null,
  previewStartViewport = null;
function toFiniteNumber(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function normalizeViewport(box = {}) {
  const zoom = toFiniteNumber(box.zoom, 1);
  return {
    x: toFiniteNumber(box.x, 0),
    y: toFiniteNumber(box.y, 0),
    zoom: zoom > 0 ? zoom : 1,
  };
}
function resolveCanvasEl(value2 = null) {
  if (value2) return value2;
  if (canvasEl) return canvasEl;
  if (typeof document === 'undefined') return null;
  return document.getElementById?.(CANVAS_ID) || null;
}
function resolveSidePlusHolderEl(value3 = null) {
  if (value3) return value3;
  if (sidePlusHolderEl) return sidePlusHolderEl;
  if (typeof document === 'undefined') return null;
  return document.getElementById?.(SIDE_PLUS_HOLDER_ID) || null;
}
function buildViewportTransform(box2) {
  return 'translate3d(' + box2.x + 'px, ' + box2.y + 'px, 0) scale(' + box2.zoom + ')';
}
function buildSidePlusPreviewTransform(box3) {
  if (!previewStartViewport) return sidePlusHolderInitialTransform;
  const enabled = box3.x - previewStartViewport.x,
    enabled2 = box3.y - previewStartViewport.y;
  if (!enabled && !enabled2) return sidePlusHolderInitialTransform;
  return 'translate3d(' + enabled + 'px, ' + enabled2 + 'px, 0)';
}
function applySidePlusPreviewTransform(index) {
  const el = resolveSidePlusHolderEl();
  if (!el?.style) return false;
  const sidePlusPreviewTransform = buildSidePlusPreviewTransform(index);
  return (
    el.style.transform !== sidePlusPreviewTransform && (el.style.transform = sidePlusPreviewTransform),
    (el._lastPanPreviewTransform = sidePlusPreviewTransform),
    true
  );
}
function clearSidePlusPreviewTransform() {
  const el2 = resolveSidePlusHolderEl();
  (el2?.style &&
    ((el2.style.transform = sidePlusHolderInitialTransform), (el2._lastPanPreviewTransform = '')),
    (sidePlusHolderEl = null),
    (sidePlusHolderInitialTransform = ''));
}
function applyViewportTransform(result) {
  const el3 = resolveCanvasEl();
  if (!el3) return false;
  const viewportTransform = buildViewportTransform(result);
  return (
    el3.style.transform !== viewportTransform && (el3.style.transform = viewportTransform),
    (el3._lastTransform = viewportTransform),
    applySidePlusPreviewTransform(result),
    true
  );
}
function dispatchViewportPanPreviewFrame(args) {
  const enabled3 = typeof window !== 'undefined' ? window : null;
  if (!enabled3?.dispatchEvent) return;
  const detail = { viewport: { ...args } };
  try {
    const run = typeof CustomEvent === 'function' ? CustomEvent : null;
    enabled3.dispatchEvent(
      run
        ? new run(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, { detail: detail })
        : { type: VIEWPORT_PAN_PREVIEW_FRAME_EVENT, detail: detail },
    );
  } catch {}
}
function cancelScheduledFrame() {
  if (!rafId) return;
  (typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(rafId), (rafId = 0));
}
function flushPreviewFrame() {
  rafId = 0;
  if (!pendingViewport) return;
  const data = pendingViewport;
  ((pendingViewport = null),
    (latestViewport = data),
    applyViewportTransform(data) && dispatchViewportPanPreviewFrame(data));
}
function schedulePreviewFrame() {
  if (rafId) return;
  if (typeof requestAnimationFrame === 'function') {
    rafId = requestAnimationFrame(flushPreviewFrame);
    return;
  }
  flushPreviewFrame();
}
export function beginViewportPanPreview(options, target = {}) {
  ((active = true),
    (dirty = false),
    (canvasEl = resolveCanvasEl(target.canvasEl || null)),
    (sidePlusHolderEl = resolveSidePlusHolderEl(target.sidePlusHolderEl || null)),
    (sidePlusHolderInitialTransform = sidePlusHolderEl?.style?.transform || ''),
    (latestViewport = normalizeViewport(options)),
    (previewStartViewport = latestViewport),
    (pendingViewport = null),
    canvasEl?.style && (canvasEl.style.willChange = 'transform'));
}
export function updateViewportPanPreview(x, y, zoom2) {
  !active && beginViewportPanPreview({ x: x, y: y, zoom: zoom2 });
  const viewport = normalizeViewport({ x: x, y: y, zoom: zoom2 });
  ((dirty = true), (latestViewport = viewport), (pendingViewport = viewport), schedulePreviewFrame());
}
export function getViewportPanPreview() {
  if (!active) return null;
  return pendingViewport || latestViewport;
}
export function flushViewportPanPreview() {
  cancelScheduledFrame();
  pendingViewport && flushPreviewFrame();
  const source = dirty && latestViewport ? { ...latestViewport } : null;
  return (
    (active = false),
    (dirty = false),
    (pendingViewport = null),
    (latestViewport = null),
    (previewStartViewport = null),
    (canvasEl = null),
    clearSidePlusPreviewTransform(),
    source
  );
}
export function cancelViewportPanPreview() {
  (cancelScheduledFrame(),
    (active = false),
    (dirty = false),
    (pendingViewport = null),
    (latestViewport = null),
    (previewStartViewport = null),
    (canvasEl = null),
    clearSidePlusPreviewTransform());
}
export function isViewportPanPreviewActive() {
  return active;
}
