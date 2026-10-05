export const CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY = 'v2-canvas-wheel-behavior';
export const CANVAS_WHEEL_BEHAVIOR_ZOOM = 'zoom';
export const CANVAS_WHEEL_BEHAVIOR_PAN = 'pan';
function getRuntimeRoot() {
  if (typeof window !== 'undefined') return window;
  return globalThis;
}
function getRuntimeStorage() {
  const root = getRuntimeRoot();
  try {
    if (root?.['localStorage']) return root['localStorage'];
  } catch {}
  try {
    if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
  } catch {}
  return null;
}
export function normalizeCanvasWheelBehavior(value) {
  return value === CANVAS_WHEEL_BEHAVIOR_PAN ? CANVAS_WHEEL_BEHAVIOR_PAN : CANVAS_WHEEL_BEHAVIOR_ZOOM;
}
export function readCanvasWheelBehavior() {
  const root = getRuntimeRoot(),
    fromRuntime = normalizeCanvasWheelBehavior(root?.['v2CanvasWheelBehavior']);
  if (
    root?.['v2CanvasWheelBehavior'] === CANVAS_WHEEL_BEHAVIOR_ZOOM ||
    root?.['v2CanvasWheelBehavior'] === CANVAS_WHEEL_BEHAVIOR_PAN
  )
    return fromRuntime;
  let stored = null;
  try {
    stored = getRuntimeStorage()?.['getItem'](CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY);
  } catch {}
  const fromStorage = normalizeCanvasWheelBehavior(stored);
  if (root) root['v2CanvasWheelBehavior'] = fromStorage;
  return fromStorage;
}
function syncCanvasWheelBehaviorButtons(value) {
  if (typeof document === 'undefined') return;
  const normalized = normalizeCanvasWheelBehavior(value);
  document['querySelectorAll']('#canvasWheelBehaviorGroup [data-canvas-wheel-behavior]')['forEach'](
    (button) => {
      const isActive = button['dataset']['canvasWheelBehavior'] === normalized;
      (button['classList']['toggle']('active', isActive),
        button['setAttribute']?.('aria-pressed', isActive ? 'true' : 'false'));
    },
  );
}
export function setCanvasWheelBehavior(value) {
  const normalized = normalizeCanvasWheelBehavior(value),
    root = getRuntimeRoot();
  if (root) root['v2CanvasWheelBehavior'] = normalized;
  try {
    getRuntimeStorage()?.['setItem'](CANVAS_WHEEL_BEHAVIOR_STORAGE_KEY, normalized);
  } catch {}
  return (syncCanvasWheelBehaviorButtons(normalized), normalized);
}
export function initCanvasControlSettings() {
  if (typeof document === 'undefined') return;
  const buttons = Array['from'](
    document['querySelectorAll']('#canvasWheelBehaviorGroup [data-canvas-wheel-behavior]'),
  );
  if (buttons['length'] === 0) return;
  (setCanvasWheelBehavior(readCanvasWheelBehavior()),
    buttons['forEach']((button) => {
      button['addEventListener']('click', () => {
        setCanvasWheelBehavior(button['dataset']['canvasWheelBehavior']);
      });
    }));
}
