export const VIEWPORT_INTERACTION_CLASSES = Object['freeze']({
  panning: 'is-panning',
  zooming: 'is-zooming',
  viewportAnimating: 'is-viewport-animating',
});
const BUSY_INTERACTION_FLAGS = Object['freeze']([
  'isDragging',
  'isConnecting',
  'isBoxSelecting',
  'isDraggingCell',
]);
function getDefaultDocument() {
  return typeof document !== 'undefined' ? document : globalThis['document'];
}
function readBodyClassState(_0x3045b2 = getDefaultDocument()) {
  const _0x1b60a8 = _0x3045b2?.['body']?.['classList'];
  return {
    isPanning: Boolean(_0x1b60a8?.['contains']?.(VIEWPORT_INTERACTION_CLASSES['panning'])),
    isZooming: Boolean(_0x1b60a8?.['contains']?.(VIEWPORT_INTERACTION_CLASSES['zooming'])),
    isViewportAnimating: Boolean(
      _0x1b60a8?.['contains']?.(VIEWPORT_INTERACTION_CLASSES['viewportAnimating']),
    ),
  };
}
export function readViewportInteractionState({
  documentRef: documentRef = getDefaultDocument(),
  interactionState: interactionState = null,
  panPreviewActive: panPreviewActive = ![],
  pendingPanFreezeActive: pendingPanFreezeActive = ![],
} = {}) {
  const _0xfaa4b5 = readBodyClassState(documentRef),
    _0x377c39 = Boolean(
      _0xfaa4b5['isPanning'] ||
      interactionState?.['isPanning'] ||
      interactionState?.['assistPanActive'] ||
      panPreviewActive ||
      pendingPanFreezeActive,
    ),
    _0xf39236 = Boolean(_0xfaa4b5['isZooming']),
    _0x834773 = Boolean(_0xfaa4b5['isViewportAnimating']);
  return {
    isPanning: _0x377c39,
    isZooming: _0xf39236,
    isViewportAnimating: _0x834773,
    isViewportBusy: _0x377c39 || _0xf39236 || _0x834773,
  };
}
export function isRendererInteractionBusy({
  documentRef: documentRef = getDefaultDocument(),
  interactionState: interactionState = null,
} = {}) {
  if (BUSY_INTERACTION_FLAGS['some']((_0x2f5846) => interactionState?.[_0x2f5846] === !![])) return !![];
  return readViewportInteractionState({ documentRef: documentRef, interactionState: interactionState })[
    'isViewportBusy'
  ];
}
