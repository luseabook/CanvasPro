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
function toFiniteNumber(_0xc653c7, _0x121729) {
  const _0x439a4c = Number(_0xc653c7);
  return Number['isFinite'](_0x439a4c) ? _0x439a4c : _0x121729;
}
function clamp(_0xa34f6f, _0x40e2b7, _0x39712a) {
  return Math['max'](_0x40e2b7, Math['min'](_0xa34f6f, _0x39712a));
}
export function clampCanvasZoom(_0x1e22d9) {
  return clamp(
    toFiniteNumber(_0x1e22d9, CANVAS_ZOOM_LIMITS['default']),
    CANVAS_ZOOM_LIMITS['min'],
    CANVAS_ZOOM_LIMITS['max'],
  );
}
export function canvasZoomAfterWheel(_0x119d10, _0x543fca) {
  const _0x1de2ca = (-toFiniteNumber(_0x543fca, 0x0) * Math['log'](1.1)) / 0x78;
  return clampCanvasZoom(_0x119d10 * Math['exp'](clamp(_0x1de2ca, -0x14, 0x14)));
}
export function canvasZoomToSliderValue(_0x14cd11) {
  const _0x5e7af3 = clampCanvasZoom(_0x14cd11);
  if (_0x5e7af3 === CANVAS_ZOOM_LIMITS['min']) return CANVAS_ZOOM_SLIDER_RANGE['min'];
  if (_0x5e7af3 === CANVAS_ZOOM_LIMITS['max']) return CANVAS_ZOOM_SLIDER_RANGE['max'];
  const _0x4619a3 = Math['log'](_0x5e7af3 / CANVAS_ZOOM_LIMITS['min']) / LOG_ZOOM_RATIO;
  return Math['round'](_0x4619a3 * CANVAS_ZOOM_SLIDER_RANGE['max'] * 0xa) / 0xa;
}
export function sliderValueToCanvasZoom(_0x90503f) {
  const _0x446f65 = clamp(
    toFiniteNumber(_0x90503f, CANVAS_ZOOM_SLIDER_RANGE['min']),
    CANVAS_ZOOM_SLIDER_RANGE['min'],
    CANVAS_ZOOM_SLIDER_RANGE['max'],
  );
  if (_0x446f65 === CANVAS_ZOOM_SLIDER_RANGE['min']) return CANVAS_ZOOM_LIMITS['min'];
  if (_0x446f65 === CANVAS_ZOOM_SLIDER_RANGE['max']) return CANVAS_ZOOM_LIMITS['max'];
  const _0x57132b = _0x446f65 / CANVAS_ZOOM_SLIDER_RANGE['max'];
  return CANVAS_ZOOM_LIMITS['min'] * Math['exp'](LOG_ZOOM_RATIO * _0x57132b);
}
export function canvasZoomToDisplayPercent(_0xe88561) {
  const _0x16f09f = clamp(
    toFiniteNumber(_0xe88561, CANVAS_ZOOM_LIMITS['default']),
    CANVAS_ZOOM_LIMITS['fitMin'],
    CANVAS_ZOOM_LIMITS['max'],
  );
  return Math['round'](_0x16f09f * 0x64);
}
