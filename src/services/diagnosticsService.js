import { getPerfProbeSnapshot, setPerfProbeEnabled } from '../modules/perf/perfProbe.js';
import { t } from '../i18n/index.js';
const MAX_CONTEXT_STRING_LENGTH = 0x4b0,
  MAX_CONTEXT_DEPTH = 5;
function getDiagnosticsApi() {
  const _0x3c30b3 = globalThis.window?.electronAPI?.diagnostics;
  if (!_0x3c30b3 || typeof _0x3c30b3 !== 'object') return null;
  return _0x3c30b3;
}
function toMessage(_0x2289e3, _0xdaf5d3 = 'Unknown error') {
  if (typeof _0x2289e3 === 'string') return _0x2289e3;
  if (_0x2289e3?.message) return String(_0x2289e3.message);
  return String(_0x2289e3 || _0xdaf5d3);
}
function normalizeContextValue(_0x210241, _0x433bfc = 0) {
  if (_0x210241 == null) return _0x210241;
  if (typeof _0x210241 === 'string') {
    if (_0x210241.length <= MAX_CONTEXT_STRING_LENGTH) return _0x210241;
    return _0x210241.slice(0, MAX_CONTEXT_STRING_LENGTH) + '...';
  }
  if (typeof _0x210241 === 'number' || typeof _0x210241 === 'boolean') return _0x210241;
  if (typeof _0x210241 !== 'object') return String(_0x210241);
  if (_0x433bfc >= MAX_CONTEXT_DEPTH) return '[Object]';
  if (_0x210241 instanceof Error)
    return {
      name: _0x210241.name || 'Error',
      message: _0x210241.message || '',
      stack: _0x210241.stack || '',
    };
  if (Array.isArray(_0x210241))
    return _0x210241.slice(0, 20).map((_0x5669a0) => normalizeContextValue(_0x5669a0, _0x433bfc + 1));
  const _0x4a0b0a = {};
  return (
    Object.entries(_0x210241)
      .slice(0, 50)
      .forEach(([_0x8160a1, _0x104b11]) => {
        _0x4a0b0a[_0x8160a1] = normalizeContextValue(_0x104b11, _0x433bfc + 1);
      }),
    _0x4a0b0a
  );
}
export function logDiagnosticEvent(_0x45f280 = {}) {
  const _0x10f560 = getDiagnosticsApi();
  if (typeof _0x10f560?.logEvent !== 'function') return Promise.resolve({ ok: false });
  const _0x1ad520 = _0x45f280.error instanceof Error ? _0x45f280.error : null,
    _0x2a6103 = {
      type: String(_0x45f280.type || 'renderer.event'),
      level: String(_0x45f280.level || 'info'),
      source: String(_0x45f280.source || 'renderer'),
      message: String(_0x45f280.message || toMessage(_0x1ad520 || _0x45f280.error, 'Renderer event')),
      context: normalizeContextValue(_0x45f280.context || {}),
      stack: String(_0x45f280.stack || _0x1ad520?.stack || ''),
    };
  try {
    return Promise.resolve(_0x10f560.logEvent(_0x2a6103)).catch(() => ({ ok: false }));
  } catch {
    return Promise.resolve({ ok: false });
  }
}
export function logPerformanceSnapshot(_0x4bf383 = 'manual') {
  const _0x54b6c4 = String(_0x4bf383 || 'manual').trim() || 'manual';
  return logDiagnosticEvent({
    type: 'performance.snapshot',
    level: 'info',
    source: 'renderer',
    message: 'Canvas performance snapshot',
    context: { reason: _0x54b6c4, snapshot: getPerfProbeSnapshot() },
  });
}
export async function createDiagnosticsPackage(_0xb390a9 = {}) {
  const _0x564743 = getDiagnosticsApi();
  if (typeof _0x564743?.createPackage !== 'function')
    throw new Error(t('coreServices.diagnostics.packageUnsupported'));
  return await _0x564743.createPackage(_0xb390a9 && typeof _0xb390a9 === 'object' ? _0xb390a9 : {});
}
export async function openDiagnosticsLogsFolder() {
  const _0x54f67d = getDiagnosticsApi();
  if (typeof _0x54f67d?.openLogsFolder !== 'function')
    throw new Error(t('coreServices.diagnostics.logsUnsupported'));
  return await _0x54f67d.openLogsFolder();
}
export function canUseDiagnostics() {
  const _0x34aa9c = getDiagnosticsApi();
  return !!(
    _0x34aa9c &&
    typeof _0x34aa9c.logEvent === 'function' &&
    typeof _0x34aa9c.createPackage === 'function' &&
    typeof _0x34aa9c.openLogsFolder === 'function'
  );
}
export function initDiagnosticsService() {
  if (globalThis.window?.__aiCanvasDiagnosticsInstalled) return;
  if (!canUseDiagnostics()) return;
  ((globalThis.window.__aiCanvasDiagnosticsInstalled = true),
    setPerfProbeEnabled(true),
    globalThis.window.addEventListener('error', (_0xb90420) => {
      void logDiagnosticEvent({
        type: 'renderer.window_error',
        level: 'error',
        source: 'renderer',
        message: _0xb90420?.message || 'Renderer window error',
        error: _0xb90420?.error,
        context: {
          filename: _0xb90420?.filename || '',
          lineno: _0xb90420?.lineno || 0,
          colno: _0xb90420?.colno || 0,
        },
      });
    }),
    globalThis.window.addEventListener('unhandledrejection', (_0x2a4f63) => {
      const _0x53ec39 = _0x2a4f63?.reason;
      void logDiagnosticEvent({
        type: 'renderer.unhandled_rejection',
        level: 'error',
        source: 'renderer',
        message: toMessage(_0x53ec39, 'Renderer unhandled rejection'),
        error: _0x53ec39 instanceof Error ? _0x53ec39 : null,
        context: _0x53ec39 instanceof Error ? {} : { reason: toMessage(_0x53ec39) },
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
