export const CANVAS_TOOLBAR_PLACEMENTS = Object['freeze'](['left', 'right', 'bottom']);
export const DEFAULT_CANVAS_TOOLBAR_PLACEMENT = 'left';
export const CANVAS_TOOLBAR_PLACEMENT_EVENT = 'canvas-toolbar-placement-changed';
const CANVAS_TOOLBAR_PLACEMENT_SET = new Set(CANVAS_TOOLBAR_PLACEMENTS);
export function normalizeCanvasToolbarPlacement(value) {
  return CANVAS_TOOLBAR_PLACEMENT_SET['has'](value) ? value : DEFAULT_CANVAS_TOOLBAR_PLACEMENT;
}
