import { createPreviewCommitSession } from '../modules/interaction/previewCommitSession.js';
import { syncViewportGridDots } from './viewportGridDots.js';
import { syncViewportZoomCssVars } from './rendererViewportTransform.js';
const CANVAS_ID = 'v2-canvas',
  SIDE_PLUS_HOLDER_ID = 'v2-side-plus-holder';
export const VIEWPORT_PAN_PREVIEW_FRAME_EVENT = 'aicanvas:viewport-pan-preview-frame';
let canvasEl = null,
  sidePlusHolderEl = null,
  sidePlusHolderInitialTransform = '',
  previewStartViewport = null;
function toFiniteNumber(value, item = 0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function normalizeViewport(box = {}) {
  const zoom = toFiniteNumber(box['zoom'], 1);
  return {
    x: toFiniteNumber(box['x'], 0),
    y: toFiniteNumber(box['y'], 0),
    zoom: zoom > 0 ? zoom : 1,
  };
}
function resolveCanvasEl(value2 = null) {
  if (value2) return value2;
  if (canvasEl) return canvasEl;
  if (typeof document === 'undefined') return null;
  return document['getElementById']?.(CANVAS_ID) || null;
}
function resolveSidePlusHolderEl(value3 = null) {
  if (value3) return value3;
  if (sidePlusHolderEl) return sidePlusHolderEl;
  if (typeof document === 'undefined') return null;
  return document['getElementById']?.(SIDE_PLUS_HOLDER_ID) || null;
}
function buildViewportTransform(box2) {
  return (
    'translate3d(' + box2['x'] + 'px, ' + box2['y'] + 'px, 0) scale(' + box2['zoom'] + ')'
  );
}
function buildSidePlusPreviewTransform(box3) {
  if (!previewStartViewport) return sidePlusHolderInitialTransform;
  const enabled = box3['x'] - previewStartViewport['x'],
    enabled2 = box3['y'] - previewStartViewport['y'];
  if (!enabled && !enabled2) return sidePlusHolderInitialTransform;
  return 'translate3d(' + enabled + 'px, ' + enabled2 + 'px, 0)';
}
function applySidePlusPreviewTransform(index) {
  const el = resolveSidePlusHolderEl();
  if (!el?.['style']) return false;
  const canvasEl2 = resolveCanvasEl();
  if (canvasEl2?.['contains']?.(el)) return false;
  const sidePlusPreviewTransform = buildSidePlusPreviewTransform(index);
  return (
    el['style']['transform'] !== sidePlusPreviewTransform && (el['style']['transform'] = sidePlusPreviewTransform),
    (el['_lastPanPreviewTransform'] = sidePlusPreviewTransform),
    true
  );
}
function clearSidePlusPreviewTransform() {
  const el2 = resolveSidePlusHolderEl();
  (el2?.['style'] &&
    ((el2['style']['transform'] = sidePlusHolderInitialTransform),
    (el2['_lastPanPreviewTransform'] = '')),
    (sidePlusHolderEl = null),
    (sidePlusHolderInitialTransform = ''));
}
function applyViewportTransform(box4) {
  const el3 = resolveCanvasEl();
  if (!el3) return false;
  const viewportTransform = buildViewportTransform(box4);
  return (
    el3['style']['transform'] !== viewportTransform && (el3['style']['transform'] = viewportTransform),
    (el3['_lastTransform'] = viewportTransform),
    syncViewportGridDots(el3, box4),
    syncViewportZoomCssVars(box4['zoom']),
    applySidePlusPreviewTransform(box4),
    true
  );
}
function dispatchViewportPanPreviewFrame(args) {
  const enabled3 = typeof window !== 'undefined' ? window : null;
  if (!enabled3?.['dispatchEvent']) return;
  const detail = { viewport: { ...args } };
  try {
    const run = typeof CustomEvent === 'function' ? CustomEvent : null;
    enabled3['dispatchEvent'](
      run
        ? new run(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, { detail: detail })
        : { type: VIEWPORT_PAN_PREVIEW_FRAME_EVENT, detail: detail },
    );
  } catch {}
}
const panPreviewSession = createPreviewCommitSession({
  applyPreview(result) {
    applyViewportTransform(result) && dispatchViewportPanPreviewFrame(result);
  },
});
export function beginViewportPanPreview(data, options = {}) {
  ((canvasEl = resolveCanvasEl(options['canvasEl'] || null)),
    (sidePlusHolderEl = resolveSidePlusHolderEl(options['sidePlusHolderEl'] || null)),
    (sidePlusHolderInitialTransform = sidePlusHolderEl?.['style']?.['transform'] || ''));
  const viewport = normalizeViewport(data);
  ((previewStartViewport = viewport), panPreviewSession['begin'](viewport));
}
export function updateViewportPanPreview(x, y, zoom2) {
  !panPreviewSession['isActive']() &&
    beginViewportPanPreview({ x: x, y: y, zoom: zoom2 });
  const viewport2 = normalizeViewport({ x: x, y: y, zoom: zoom2 });
  panPreviewSession['update'](viewport2);
}
export function getViewportPanPreview() {
  return panPreviewSession['getPreview']();
}
export function flushViewportPanPreview() {
  const args2 = panPreviewSession['commit']();
  return (
    (previewStartViewport = null),
    (canvasEl = null),
    clearSidePlusPreviewTransform(),
    args2 ? { ...args2 } : null
  );
}
export function cancelViewportPanPreview() {
  (panPreviewSession['cancel'](),
    (previewStartViewport = null),
    (canvasEl = null),
    clearSidePlusPreviewTransform());
}
export function isViewportPanPreviewActive() {
  return panPreviewSession['isActive']();
}
