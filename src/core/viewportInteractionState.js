export const VIEWPORT_INTERACTION_CLASSES = Object.freeze({
  panning: 'is-panning',
  zooming: 'is-zooming',
  viewportAnimating: 'is-viewport-animating',
});
const BUSY_INTERACTION_FLAGS = Object.freeze([
  'isDragging',
  'isConnecting',
  'isBoxSelecting',
  'isDraggingCell',
]);
function getDefaultDocument() {
  return typeof document !== 'undefined' ? document : globalThis.document;
}
function readBodyClassState(dom = getDefaultDocument()) {
  const value = dom?.body?.classList;
  return {
    isPanning: Boolean(value?.contains?.(VIEWPORT_INTERACTION_CLASSES.panning)),
    isZooming: Boolean(value?.contains?.(VIEWPORT_INTERACTION_CLASSES.zooming)),
    isViewportAnimating: Boolean(value?.contains?.(VIEWPORT_INTERACTION_CLASSES.viewportAnimating)),
  };
}
export function readViewportInteractionState({
  documentRef: documentRef = getDefaultDocument(),
  interactionState: interactionState = null,
  panPreviewActive: panPreviewActive = false,
  pendingPanFreezeActive: pendingPanFreezeActive = false,
} = {}) {
  const bodyClassState = readBodyClassState(documentRef),
    isPanning = Boolean(
      bodyClassState.isPanning ||
      interactionState?.isPanning ||
      interactionState?.assistPanActive ||
      panPreviewActive ||
      pendingPanFreezeActive,
    ),
    isZooming = Boolean(bodyClassState.isZooming),
    isViewportAnimating = Boolean(bodyClassState.isViewportAnimating);
  return {
    isPanning: isPanning,
    isZooming: isZooming,
    isViewportAnimating: isViewportAnimating,
    isViewportBusy: isPanning || isZooming || isViewportAnimating,
  };
}
export function isRendererInteractionBusy({
  documentRef: documentRef = getDefaultDocument(),
  interactionState: interactionState = null,
} = {}) {
  if (BUSY_INTERACTION_FLAGS.some((item) => interactionState?.[item] === true)) return true;
  return readViewportInteractionState({ documentRef: documentRef, interactionState: interactionState }).isViewportBusy;
}
