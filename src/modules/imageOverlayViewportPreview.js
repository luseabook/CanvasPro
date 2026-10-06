import { getViewportPanPreview, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from '../core/viewportPanPreview.js';
function normalizePreviewViewport(box) {
  if (!box || typeof box !== 'object') return null;
  const x = Number(box.x),
    y = Number(box.y),
    zoom = Number(box.zoom);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom)) return null;
  if (zoom <= 0) return null;
  return { x: x, y: y, zoom: zoom };
}
export function mergeImageOverlayPreviewViewport(args, value) {
  if (!args || typeof args !== 'object') return null;
  const args2 = normalizePreviewViewport(value);
  if (!args2) return null;
  return { ...args, viewport: { ...(args.viewport || {}), ...args2 } };
}
export function bindImageOverlayViewportPreview({
  windowObject: windowObject = typeof window !== 'undefined' ? window : null,
  getView: getView,
  updateView: updateView,
  getCurrentPreview: getCurrentPreview = getViewportPanPreview,
} = {}) {
  if (
    !windowObject?.addEventListener ||
    typeof getView !== 'function' ||
    typeof updateView !== 'function'
  )
    return () => {};
  const run = (item) => {
      const imageOverlayPreviewViewport = mergeImageOverlayPreviewViewport(getView(), item);
      if (imageOverlayPreviewViewport) updateView(imageOverlayPreviewViewport);
    },
    key = (index) => {
      run(index?.detail?.viewport);
    };
  return (
    windowObject.addEventListener(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, key),
    run(getCurrentPreview?.()),
    () => {
      windowObject.removeEventListener?.(VIEWPORT_PAN_PREVIEW_FRAME_EVENT, key);
    }
  );
}
