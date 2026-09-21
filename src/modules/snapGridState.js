const SNAP_GRID_STORAGE_KEY = 'v2-snap-grid',
  SNAP_GRID_CHANGED_EVENT = 'v2-snap-grid-changed';
function getRoot() {
  return typeof window !== 'undefined' ? window : globalThis;
}
function readStoredSnapGridEnabled() {
  const _0x202590 = getRoot();
  try {
    const _0x53471a = _0x202590?.localStorage?.getItem(SNAP_GRID_STORAGE_KEY);
    if (_0x53471a == null) return false;
    return _0x53471a === 'true';
  } catch {
    return false;
  }
}
function syncSnapGridButtons(_0x299f92) {
  if (typeof document === 'undefined') return;
  const _0x5dac92 = _0x299f92 === true,
    _0x59717b = document.getElementById('btnToggleDots');
  _0x59717b && _0x59717b.classList.toggle('active', _0x5dac92);
  const _0x55fe83 = document.getElementById('btnSnapGridOn'),
    _0x23ed22 = document.getElementById('btnSnapGridOff');
  if (_0x55fe83) _0x55fe83.classList.toggle('active', _0x5dac92);
  if (_0x23ed22) _0x23ed22.classList.toggle('active', !_0x5dac92);
}
export function readSnapGridEnabled() {
  const _0x3d3ccb = getRoot();
  if (typeof _0x3d3ccb?.v2SnapToGrid === 'boolean') return _0x3d3ccb.v2SnapToGrid;
  return readStoredSnapGridEnabled();
}
export function writeSnapGridEnabled(_0x1b70ba, { emitEvent: emitEvent = true } = {}) {
  const _0x54f21a = getRoot(),
    _0x32734f = _0x1b70ba === true;
  _0x54f21a.v2SnapToGrid = _0x32734f;
  try {
    _0x54f21a?.localStorage?.setItem(SNAP_GRID_STORAGE_KEY, _0x32734f ? 'true' : 'false');
  } catch {}
  return (
    emitEvent &&
      typeof _0x54f21a?.dispatchEvent === 'function' &&
      typeof CustomEvent === 'function' &&
      _0x54f21a.dispatchEvent(new CustomEvent(SNAP_GRID_CHANGED_EVENT, { detail: { enabled: _0x32734f } })),
    _0x32734f
  );
}
export function applySnapGridEnabled(
  _0x18ec97,
  { syncButtons: syncButtons = true, emitEvent: emitEvent = true } = {},
) {
  const _0xfc726f = writeSnapGridEnabled(_0x18ec97, { emitEvent: emitEvent });
  if (syncButtons) syncSnapGridButtons(_0xfc726f);
  return _0xfc726f;
}
export function subscribeSnapGridChanges(_0x4c75b9) {
  if (typeof window === 'undefined' || typeof _0x4c75b9 !== 'function') return () => {};
  const _0x262c0f = (_0x17f58f) => _0x4c75b9(_0x17f58f?.detail?.enabled === true, _0x17f58f);
  return (
    window.addEventListener(SNAP_GRID_CHANGED_EVENT, _0x262c0f),
    () => window.removeEventListener(SNAP_GRID_CHANGED_EVENT, _0x262c0f)
  );
}
