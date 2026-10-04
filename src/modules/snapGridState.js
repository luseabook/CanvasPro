const SNAP_GRID_STORAGE_KEY = 'v2-snap-grid',
  SNAP_GRID_CHANGED_EVENT = 'v2-snap-grid-changed';
function getRoot() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function readStoredSnapGridEnabled() {
  const root = getRoot();
  try {
    const value = root?.localStorage?.getItem(SNAP_GRID_STORAGE_KEY);
    if (value == null) return false;
    return value === 'true';
  } catch {
    return false;
  }
}
function syncSnapGridButtons(item) {
  if (typeof document === 'undefined') return;
  const enabled = item === true,
    el = document.getElementById('btnToggleDots');
  el && el.classList.toggle('active', enabled);
  const el2 = document.getElementById('btnSnapGridOn'),
    el3 = document.getElementById('btnSnapGridOff');
  if (el2) el2.classList.toggle('active', enabled);
  if (el3) el3.classList.toggle('active', !enabled);
}
export function readSnapGridEnabled() {
  const root2 = getRoot();
  if (typeof root2?.v2SnapToGrid === 'boolean') return root2.v2SnapToGrid;
  return readStoredSnapGridEnabled();
}
export function writeSnapGridEnabled(key, { emitEvent: emitEvent = true } = {}) {
  const root3 = getRoot(),
    enabled2 = key === true;
  root3.v2SnapToGrid = enabled2;
  try {
    root3?.localStorage?.setItem(SNAP_GRID_STORAGE_KEY, enabled2 ? 'true' : 'false');
  } catch {}
  return (
    emitEvent &&
      typeof root3?.dispatchEvent === 'function' &&
      typeof CustomEvent === 'function' &&
      root3.dispatchEvent(new CustomEvent(SNAP_GRID_CHANGED_EVENT, { detail: { enabled: enabled2 } })),
    enabled2
  );
}
export function applySnapGridEnabled(
  index,
  { syncButtons: syncButtons = true, emitEvent: emitEvent = true } = {},
) {
  const writeSnapGridEnabled2 = writeSnapGridEnabled(index, { emitEvent: emitEvent });
  if (syncButtons) syncSnapGridButtons(writeSnapGridEnabled2);
  return writeSnapGridEnabled2;
}
export function subscribeSnapGridChanges(handler) {
  if (typeof window === 'undefined' || typeof handler !== 'function') return () => {};
  const result = (data) => handler(data?.detail?.enabled === true, data);
  return (
    window.addEventListener(SNAP_GRID_CHANGED_EVENT, result),
    () => window.removeEventListener(SNAP_GRID_CHANGED_EVENT, result)
  );
}
