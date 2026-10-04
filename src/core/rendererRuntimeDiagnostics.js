function getWindowLike() {
  return typeof window !== 'undefined' ? window : globalThis;
}
export function isRendererRuntimeDiagnosticsEnabled() {
  const windowLike = getWindowLike();
  return (
    windowLike?.['__runtimeCompareRendererDiagnosticsEnabled'] === !![] &&
    typeof windowLike?.['__runtimeCompareRecordRendererDiagnostic'] === 'function'
  );
}
export function recordRendererRuntimeDiagnostic(options = {}) {
  const windowLike2 = getWindowLike();
  if (
    windowLike2?.['__runtimeCompareRendererDiagnosticsEnabled'] !== !![] ||
    typeof windowLike2?.['__runtimeCompareRecordRendererDiagnostic'] !== 'function'
  )
    return null;
  return windowLike2['__runtimeCompareRecordRendererDiagnostic'](options);
}
export function installRendererRuntimeDiagnosticAccess(handler) {
  const windowLike3 = getWindowLike();
  if (windowLike3?.['__runtimeCompareRendererDiagnosticsEnabled'] !== !![] || typeof handler !== 'function')
    return ![];
  return (
    (windowLike3['__runtimeCompareGetRendererNodeDiagnosticState'] = (value) => {
      const args = handler(String(value || ''));
      return args && typeof args === 'object' ? { ...args } : null;
    }),
    !![]
  );
}
