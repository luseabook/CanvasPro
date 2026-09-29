export const CANVAS_TOOLBAR_PLACEMENTS = Object['freeze'](['left', 'right', 'bottom']);
export const DEFAULT_CANVAS_TOOLBAR_PLACEMENT = 'left';
export const CANVAS_TOOLBAR_PLACEMENT_EVENT = 'canvas-toolbar-placement-changed';
const CANVAS_TOOLBAR_PLACEMENT_SET = new Set(CANVAS_TOOLBAR_PLACEMENTS);
export function normalizeCanvasToolbarPlacement(_0x30bded) {
  return CANVAS_TOOLBAR_PLACEMENT_SET['has'](_0x30bded) ? _0x30bded : DEFAULT_CANVAS_TOOLBAR_PLACEMENT;
}
