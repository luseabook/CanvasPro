const ENABLED_GLOBAL_FLAG = '__AI_CANVAS_DRAG_IMPORT_PROFILING__',
  ENABLED_STORAGE_KEY = 'aic:dragImportProfile',
  ENABLED_QUERY_KEY = 'aicDragImportProfile';
function isTruthyFlag(_0x3501bc) {
  const _0x1a0dfb = String(_0x3501bc || '')
    .trim()
    .toLowerCase();
  return _0x1a0dfb === '1' || _0x1a0dfb === 'true' || _0x1a0dfb === 'yes' || _0x1a0dfb === 'on';
}
export function isDragImportProfilingEnabled() {
  try {
    if (globalThis[ENABLED_GLOBAL_FLAG] === true) return true;
    const _0x42de11 = globalThis.window;
    if (_0x42de11?.[ENABLED_GLOBAL_FLAG] === true) return true;
    const _0x449108 = new URLSearchParams(String(_0x42de11?.location?.search || ''));
    if (isTruthyFlag(_0x449108.get(ENABLED_QUERY_KEY))) return true;
    if (isTruthyFlag(_0x42de11?.localStorage?.getItem?.(ENABLED_STORAGE_KEY))) return true;
  } catch {}
  return false;
}
export function logDragImportProfile(_0x2cd536, _0x906d97 = {}) {
  if (!isDragImportProfilingEnabled()) return;
  try {
    const _0x51f06a = {
      t: Math.round(globalThis.performance?.now?.() || 0),
      ...(_0x906d97 && typeof _0x906d97 === 'object' ? _0x906d97 : {}),
    };
    (console.debug?.('[drag-import-prof] ' + _0x2cd536, _0x51f06a),
      globalThis.window?.electronAPI?.logDragImport?.(_0x2cd536, _0x51f06a));
  } catch {}
}
