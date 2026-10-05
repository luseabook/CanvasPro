import { getPerfProbeSnapshot, setPerfProbeEnabled } from '../modules/perf/perfProbe.js';
import { t } from '../i18n/index.js';
const MAX_CONTEXT_STRING_LENGTH = 1200,
  MAX_CONTEXT_DEPTH = 5;
function getDiagnosticsApi() {
  const enabled = globalThis.window?.electronAPI?.diagnostics;
  if (!enabled || typeof enabled !== 'object') return null;
  return enabled;
}
function toMessage(error, value = 'Unknown error') {
  if (typeof error === 'string') return error;
  if (error?.message) return String(error.message);
  return String(error || value);
}
function normalizeContextValue(name, item = 0) {
  if (name == null) return name;
  if (typeof name === 'string') {
    if (name.length <= MAX_CONTEXT_STRING_LENGTH) return name;
    return name.slice(0, MAX_CONTEXT_STRING_LENGTH) + '...';
  }
  if (typeof name === 'number' || typeof name === 'boolean') return name;
  if (typeof name !== 'object') return String(name);
  if (item >= MAX_CONTEXT_DEPTH) return '[Object]';
  if (name instanceof Error)
    return {
      name: name.name || 'Error',
      message: name.message || '',
      stack: name.stack || '',
    };
  if (Array.isArray(name)) return name.slice(0, 20).map((item2) => normalizeContextValue(item2, item + 1));
  const key = {};
  return (
    Object.entries(name)
      .slice(0, 50)
      .forEach(([index, result]) => {
        key[index] = normalizeContextValue(result, item + 1);
      }),
    key
  );
}
export function logDiagnosticEvent(error2 = {}) {
  const diagnosticsApi = getDiagnosticsApi();
  if (typeof diagnosticsApi?.logEvent !== 'function') return Promise.resolve({ ok: false });
  const error3 = error2.error instanceof Error ? error2.error : null,
    data = {
      type: String(error2.type || 'renderer.event'),
      level: String(error2.level || 'info'),
      source: String(error2.source || 'renderer'),
      message: String(error2.message || toMessage(error3 || error2.error, 'Renderer event')),
      context: normalizeContextValue(error2.context || {}),
      stack: String(error2.stack || error3?.stack || ''),
    };
  try {
    return Promise.resolve(diagnosticsApi.logEvent(data)).catch(() => ({ ok: false }));
  } catch {
    return Promise.resolve({ ok: false });
  }
}
export function logDeveloperDiagnosticEvent(
  options = {},
  { windowObject: windowObject = globalThis.window, logEvent: logEvent = logDiagnosticEvent } = {},
) {
  if (windowObject?.AI_CANVAS_IS_DEV_BUILD !== true) return Promise.resolve({ ok: false, skipped: true });
  try {
    return Promise.resolve(logEvent(options)).catch(() => ({ ok: false }));
  } catch {
    return Promise.resolve({ ok: false });
  }
}
export function logPerformanceSnapshot(target = 'manual') {
  const reason = String(target || 'manual').trim() || 'manual';
  return logDiagnosticEvent({
    type: 'performance.snapshot',
    level: 'info',
    source: 'renderer',
    message: 'Canvas performance snapshot',
    context: { reason: reason, snapshot: getPerfProbeSnapshot() },
  });
}
export async function createDiagnosticsPackage(options2 = {}) {
  const diagnosticsApi2 = getDiagnosticsApi();
  if (typeof diagnosticsApi2?.createPackage !== 'function')
    throw new Error(t('coreServices.diagnostics.packageUnsupported'));
  return await diagnosticsApi2.createPackage(options2 && typeof options2 === 'object' ? options2 : {});
}
export async function openDiagnosticsLogsFolder() {
  const diagnosticsApi3 = getDiagnosticsApi();
  if (typeof diagnosticsApi3?.openLogsFolder !== 'function')
    throw new Error(t('coreServices.diagnostics.logsUnsupported'));
  return await diagnosticsApi3.openLogsFolder();
}
export function canUseDiagnostics() {
  const diagnosticsApi4 = getDiagnosticsApi();
  return !!(
    diagnosticsApi4 &&
    typeof diagnosticsApi4.logEvent === 'function' &&
    typeof diagnosticsApi4.createPackage === 'function' &&
    typeof diagnosticsApi4.openLogsFolder === 'function'
  );
}
export function initDiagnosticsService() {
  if (globalThis.window?.__aiCanvasDiagnosticsInstalled) return;
  if (!canUseDiagnostics()) return;
  ((globalThis.window.__aiCanvasDiagnosticsInstalled = true),
    setPerfProbeEnabled(true),
    globalThis.window.addEventListener('error', (message) => {
      void logDiagnosticEvent({
        type: 'renderer.window_error',
        level: 'error',
        source: 'renderer',
        message: message?.message || 'Renderer window error',
        error: message?.error,
        context: {
          filename: message?.filename || '',
          lineno: message?.lineno || 0,
          colno: message?.colno || 0,
        },
      });
    }),
    globalThis.window.addEventListener('unhandledrejection', (source) => {
      const error4 = source?.reason;
      void logDiagnosticEvent({
        type: 'renderer.unhandled_rejection',
        level: 'error',
        source: 'renderer',
        message: toMessage(error4, 'Renderer unhandled rejection'),
        error: error4 instanceof Error ? error4 : null,
        context: error4 instanceof Error ? {} : { reason: toMessage(error4) },
      });
    }),
    void logDiagnosticEvent({
      type: 'renderer.diagnostics_ready',
      level: 'info',
      source: 'renderer',
      message: 'Renderer diagnostics service initialized',
      context: { href: globalThis.location?.href || '', userAgent: globalThis.navigator?.userAgent || '' },
    }));
}
