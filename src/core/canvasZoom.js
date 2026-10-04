export const CANVAS_ZOOM_LIMITS = Object['freeze']({
  min: 0.05,
  max: 0x4,
  default: 0x1,
  fitMin: 0.01,
  fitMax: 0x2,
});
export const CANVAS_ZOOM_SLIDER_RANGE = Object['freeze']({ min: 0x0, max: 0x64, step: 0.1 });
const ZOOM_RATIO = CANVAS_ZOOM_LIMITS['max'] / CANVAS_ZOOM_LIMITS['min'],
  LOG_ZOOM_RATIO = Math['log'](ZOOM_RATIO);
function toFiniteNumber(value, item) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function clamp(index, result, data) {
  return Math['max'](result, Math['min'](index, data));
}
export function clampCanvasZoom(options) {
  return clamp(
    toFiniteNumber(options, CANVAS_ZOOM_LIMITS['default']),
    CANVAS_ZOOM_LIMITS['min'],
    CANVAS_ZOOM_LIMITS['max'],
  );
}
export function canvasZoomAfterWheel(target, source) {
  const next = (-toFiniteNumber(source, 0x0) * Math['log'](1.1)) / 0x78;
  return clampCanvasZoom(target * Math['exp'](clamp(next, -0x14, 0x14)));
}
export function canvasZoomToSliderValue(current) {
  const clampCanvasZoom2 = clampCanvasZoom(current);
  if (clampCanvasZoom2 === CANVAS_ZOOM_LIMITS['min']) return CANVAS_ZOOM_SLIDER_RANGE['min'];
  if (clampCanvasZoom2 === CANVAS_ZOOM_LIMITS['max']) return CANVAS_ZOOM_SLIDER_RANGE['max'];
  const entry = Math['log'](clampCanvasZoom2 / CANVAS_ZOOM_LIMITS['min']) / LOG_ZOOM_RATIO;
  return Math['round'](entry * CANVAS_ZOOM_SLIDER_RANGE['max'] * 0xa) / 0xa;
}
export function sliderValueToCanvasZoom(record) {
  const clamp2 = clamp(
    toFiniteNumber(record, CANVAS_ZOOM_SLIDER_RANGE['min']),
    CANVAS_ZOOM_SLIDER_RANGE['min'],
    CANVAS_ZOOM_SLIDER_RANGE['max'],
  );
  if (clamp2 === CANVAS_ZOOM_SLIDER_RANGE['min']) return CANVAS_ZOOM_LIMITS['min'];
  if (clamp2 === CANVAS_ZOOM_SLIDER_RANGE['max']) return CANVAS_ZOOM_LIMITS['max'];
  const payload = clamp2 / CANVAS_ZOOM_SLIDER_RANGE['max'];
  return CANVAS_ZOOM_LIMITS['min'] * Math['exp'](LOG_ZOOM_RATIO * payload);
}
export function canvasZoomToDisplayPercent(handle) {
  const clamp3 = clamp(
    toFiniteNumber(handle, CANVAS_ZOOM_LIMITS['default']),
    CANVAS_ZOOM_LIMITS['fitMin'],
    CANVAS_ZOOM_LIMITS['max'],
  );
  return Math['round'](clamp3 * 0x64);
}
