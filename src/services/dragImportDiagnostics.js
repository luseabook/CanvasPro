const ENABLED_GLOBAL_FLAG = '__AI_CANVAS_DRAG_IMPORT_PROFILING__',
  ENABLED_STORAGE_KEY = 'aic:dragImportProfile',
  ENABLED_QUERY_KEY = 'aicDragImportProfile';
function isTruthyFlag(value) {
  const item = String(value || '')
    .trim()
    .toLowerCase();
  return item === '1' || item === 'true' || item === 'yes' || item === 'on';
}
export function isDragImportProfilingEnabled() {
  try {
    if (globalThis[ENABLED_GLOBAL_FLAG] === true) return true;
    const key = globalThis.window;
    if (key?.[ENABLED_GLOBAL_FLAG] === true) return true;
    const map = new URLSearchParams(String(key?.location?.search || ''));
    if (isTruthyFlag(map.get(ENABLED_QUERY_KEY))) return true;
    if (isTruthyFlag(key?.localStorage?.getItem?.(ENABLED_STORAGE_KEY))) return true;
  } catch {}
  return false;
}
export function logDragImportProfile(index, result = {}) {
  if (!isDragImportProfilingEnabled()) return;
  try {
    const data = {
      t: Math.round(globalThis.performance?.now?.() || 0),
      ...(result && typeof result === 'object' ? result : {}),
    };
    (console.debug?.('[drag-import-prof] ' + index, data),
      globalThis.window?.electronAPI?.logDragImport?.(index, data));
  } catch {}
}
