export const CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY = 'v2-canvas-wheel-behavior';
export const CANVAS_WHEEL_BEHAVIOR_ZOOM = 'zoom';
export const CANVAS_WHEEL_BEHAVIOR_PAN = 'pan';
function getRuntimeRoot() {
  if (typeof window !== 'undefined') return window;
  return globalThis;
}
function getRuntimeStorage() {
  const _0x331880 = getRuntimeRoot();
  try {
    if (_0x331880?.['localStorage']) return _0x331880['localStorage'];
  } catch {}
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {}
  return null;
}
export function normalizeCanvasWheelBehavior(_0x2860fb) {
  return _0x2860fb === CANVAS_WHEEL_BEHAVIOR_PAN ? CANVAS_WHEEL_BEHAVIOR_PAN : CANVAS_WHEEL_BEHAVIOR_ZOOM;
}
export function readCanvasWheelBehavior() {
  const _0x23be02 = getRuntimeRoot(),
    _0x4dad62 = normalizeCanvasWheelBehavior(_0x23be02?.['v2CanvasWheelBehavior']);
  if (
    _0x23be02?.['v2CanvasWheelBehavior'] === CANVAS_WHEEL_BEHAVIOR_ZOOM ||
    _0x23be02?.['v2CanvasWheelBehavior'] === CANVAS_WHEEL_BEHAVIOR_PAN
  )
    return _0x4dad62;
  let _0x31c8f9 = null;
  try {
    _0x31c8f9 = getRuntimeStorage()?.['getItem'](CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY);
  } catch {}
  const _0x16b26a = normalizeCanvasWheelBehavior(_0x31c8f9);
  if (_0x23be02) _0x23be02['v2CanvasWheelBehavior'] = _0x16b26a;
  return _0x16b26a;
}
function syncCanvasWheelBehaviorButtons(_0x42e941) {
  if (typeof document === 'undefined') return;
  const _0x218081 = normalizeCanvasWheelBehavior(_0x42e941);
  document['querySelectorAll']('#canvasWheelBehaviorGroup [data-canvas-wheel-behavior]')['forEach'](
    (_0x3e718b) => {
      const _0x174c81 = _0x3e718b['dataset']['canvasWheelBehavior'] === _0x218081;
      (_0x3e718b['classList']['toggle']('active', _0x174c81),
        _0x3e718b['setAttribute']?.('aria-pressed', _0x174c81 ? 'true' : 'false'));
    },
  );
}
export function setCanvasWheelBehavior(_0x31c848) {
  const _0x30b273 = normalizeCanvasWheelBehavior(_0x31c848),
    _0x16a916 = getRuntimeRoot();
  if (_0x16a916) _0x16a916['v2CanvasWheelBehavior'] = _0x30b273;
  try {
    getRuntimeStorage()?.['setItem'](CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, _0x30b273);
  } catch {}
  return (syncCanvasWheelBehaviorButtons(_0x30b273), _0x30b273);
}
export function initCanvasControlSettings() {
  if (typeof document === 'undefined') return;
  const _0xa303bb = Array['from'](
    document['querySelectorAll']('#canvasWheelBehaviorGroup [data-canvas-wheel-behavior]'),
  );
  if (_0xa303bb['length'] === 0x0) return;
  (setCanvasWheelBehavior(readCanvasWheelBehavior()),
    _0xa303bb['forEach']((_0x15fa47) => {
      _0x15fa47['addEventListener']('click', () => {
        setCanvasWheelBehavior(_0x15fa47['dataset']['canvasWheelBehavior']);
      });
    }));
}
