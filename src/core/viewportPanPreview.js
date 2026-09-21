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
function toFiniteNumber(_0x2c1278, _0x49168b = 0) {
  const _0x570af2 = Number(_0x2c1278);
  return Number.isFinite(_0x570af2) ? _0x570af2 : _0x49168b;
}
function normalizeViewport(_0x1981de = {}) {
  const _0x1c4e37 = toFiniteNumber(_0x1981de.zoom, 1);
  return {
    x: toFiniteNumber(_0x1981de.x, 0),
    y: toFiniteNumber(_0x1981de.y, 0),
    zoom: _0x1c4e37 > 0 ? _0x1c4e37 : 1,
  };
}
function resolveCanvasEl(_0x16d7ba = null) {
  if (_0x16d7ba) return _0x16d7ba;
  if (canvasEl) return canvasEl;
  if (typeof document === 'undefined') return null;
  return document.getElementById?.(CANVAS_ID) || null;
}
function resolveSidePlusHolderEl(_0x7f241a = null) {
  if (_0x7f241a) return _0x7f241a;
  if (sidePlusHolderEl) return sidePlusHolderEl;
  if (typeof document === 'undefined') return null;
  return document.getElementById?.(SIDE_PLUS_HOLDER_ID) || null;
}
function buildViewportTransform(_0x483ce1) {
  return 'translate3d(' + _0x483ce1.x + 'px, ' + _0x483ce1.y + 'px, 0) scale(' + _0x483ce1.zoom + ')';
}
function buildSidePlusPreviewTransform(_0x37d589) {
  if (!previewStartViewport) return sidePlusHolderInitialTransform;
  const _0x33ab0b = _0x37d589.x - previewStartViewport.x,
    _0x4e9f3a = _0x37d589.y - previewStartViewport.y;
  if (!_0x33ab0b && !_0x4e9f3a) return sidePlusHolderInitialTransform;
  return 'translate3d(' + _0x33ab0b + 'px, ' + _0x4e9f3a + 'px, 0)';
}
function applySidePlusPreviewTransform(_0x12b8d1) {
  const _0x31ca2d = resolveSidePlusHolderEl();
  if (!_0x31ca2d?.style) return false;
  const _0x2e467c = buildSidePlusPreviewTransform(_0x12b8d1);
  return (
    _0x31ca2d.style.transform !== _0x2e467c && (_0x31ca2d.style.transform = _0x2e467c),
    (_0x31ca2d._lastPanPreviewTransform = _0x2e467c),
    true
  );
}
function clearSidePlusPreviewTransform() {
  const _0x51087b = resolveSidePlusHolderEl();
  (_0x51087b?.style &&
    ((_0x51087b.style.transform = sidePlusHolderInitialTransform), (_0x51087b._lastPanPreviewTransform = '')),
    (sidePlusHolderEl = null),
    (sidePlusHolderInitialTransform = ''));
}
function applyViewportTransform(_0x55ad89) {
  const _0x490015 = resolveCanvasEl();
  if (!_0x490015) return false;
  const _0x19a49b = buildViewportTransform(_0x55ad89);
  return (
    _0x490015.style.transform !== _0x19a49b && (_0x490015.style.transform = _0x19a49b),
    (_0x490015._lastTransform = _0x19a49b),
    applySidePlusPreviewTransform(_0x55ad89),
    true
  );
}
function dispatchViewportPanPreviewFrame(_0x5986d9) {
  const _0x44f2f7 = typeof window !== 'undefined' ? window : null;
  if (!_0x44f2f7?.dispatchEvent) return;
  const _0x19a3f3 = { viewport: { ..._0x5986d9 } };
  try {
    const _0x9d7a0c = typeof CustomEvent === 'function' ? CustomEvent : null;
    _0x44f2f7.dispatchEvent(
      _0x9d7a0c
        ? new _0x9d7a0c(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, { detail: _0x19a3f3 })
        : { type: VIEWPORT_PAN_PREVIEW_FRAME_EVENT, detail: _0x19a3f3 },
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
  const _0x1ebb15 = pendingViewport;
  ((pendingViewport = null),
    (latestViewport = _0x1ebb15),
    applyViewportTransform(_0x1ebb15) && dispatchViewportPanPreviewFrame(_0x1ebb15));
}
function schedulePreviewFrame() {
  if (rafId) return;
  if (typeof requestAnimationFrame === 'function') {
    rafId = requestAnimationFrame(flushPreviewFrame);
    return;
  }
  flushPreviewFrame();
}
export function beginViewportPanPreview(_0x229b52, _0x38dacc = {}) {
  ((active = true),
    (dirty = false),
    (canvasEl = resolveCanvasEl(_0x38dacc.canvasEl || null)),
    (sidePlusHolderEl = resolveSidePlusHolderEl(_0x38dacc.sidePlusHolderEl || null)),
    (sidePlusHolderInitialTransform = sidePlusHolderEl?.style?.transform || ''),
    (latestViewport = normalizeViewport(_0x229b52)),
    (previewStartViewport = latestViewport),
    (pendingViewport = null),
    canvasEl?.style && (canvasEl.style.willChange = 'transform'));
}
export function updateViewportPanPreview(_0x76b908, _0x1e3475, _0x345943) {
  !active && beginViewportPanPreview({ x: _0x76b908, y: _0x1e3475, zoom: _0x345943 });
  const _0xc06607 = normalizeViewport({ x: _0x76b908, y: _0x1e3475, zoom: _0x345943 });
  ((dirty = true), (latestViewport = _0xc06607), (pendingViewport = _0xc06607), schedulePreviewFrame());
}
export function getViewportPanPreview() {
  if (!active) return null;
  return pendingViewport || latestViewport;
}
export function flushViewportPanPreview() {
  cancelScheduledFrame();
  pendingViewport && flushPreviewFrame();
  const _0x18f05c = dirty && latestViewport ? { ...latestViewport } : null;
  return (
    (active = false),
    (dirty = false),
    (pendingViewport = null),
    (latestViewport = null),
    (previewStartViewport = null),
    (canvasEl = null),
    clearSidePlusPreviewTransform(),
    _0x18f05c
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
