import {
  canUseDiagnostics,
  createDiagnosticsPackage,
  openDiagnosticsLogsFolder,
  logDiagnosticEvent,
  logPerformanceSnapshot,
} from '../../services/diagnosticsService.js';
import { createAiDiagnosticsReport } from '../../services/aiDiagnosticsReport.js';
import { t } from '../../i18n/index.js';
function diagnosticsText(_0xf8c47d, _0x4260c3 = {}) {
  return t('settings.fileSave.diagnostics.' + _0xf8c47d, _0x4260c3);
}
function setButtonBusy(_0x4152dc, _0x5aa1e9, _0x51fd9b) {
  if (!_0x4152dc) return;
  _0x4152dc.disabled = Boolean(_0x5aa1e9);
  if (_0x51fd9b) _0x4152dc.textContent = _0x51fd9b;
}
export function initDiagnosticsSettings({ graphStore: graphStore = null } = {}) {
  const _0x4faf61 = document.getElementById('diagnosticsSettingsCard'),
    _0x1e2c4c = document.getElementById('btnCreateDiagnosticsPackage'),
    _0x142e4a = document.getElementById('btnOpenDiagnosticsLogs'),
    _0x5c4b03 = document.getElementById('diagnosticsStatusText');
  if (!_0x4faf61 || !_0x1e2c4c || !_0x142e4a) return;
  const _0x42361c = canUseDiagnostics();
  _0x4faf61.hidden = !_0x42361c;
  if (!_0x42361c) return;
  (_0x1e2c4c.addEventListener('click', async () => {
    setButtonBusy(_0x1e2c4c, true, diagnosticsText('creating'));
    _0x5c4b03 &&
      ((_0x5c4b03.textContent = diagnosticsText('collecting')), _0x5c4b03.classList.remove('is-error'));
    try {
      const _0x5669b0 = createAiDiagnosticsReport({
        graphStore: graphStore,
        reason: 'settings_diagnostics_package',
      });
      (await logDiagnosticEvent({
        type: 'ai_diagnostics.report',
        level: 'info',
        source: 'renderer',
        message: 'AI-readable diagnostics report captured',
        context: { report: _0x5669b0 },
      }),
        await logPerformanceSnapshot('diagnostics_package'));
      const _0x185314 = await createDiagnosticsPackage({ aiAnalysisReport: _0x5669b0 });
      (_0x5c4b03 &&
        (_0x5c4b03.textContent = _0x185314?.filename
          ? diagnosticsText('createdWithFile', { filename: _0x185314.filename })
          : diagnosticsText('created')),
        window.showToast?.(diagnosticsText('created'), 'success'));
    } catch (_0x53f68e) {
      const _0x6d8ad2 = _0x53f68e?.message || diagnosticsText('createFailed');
      (await logDiagnosticEvent({
        type: 'diagnostics.ui_create_failed',
        level: 'error',
        source: 'renderer',
        message: _0x6d8ad2,
        error: _0x53f68e,
      }),
        _0x5c4b03 && ((_0x5c4b03.textContent = _0x6d8ad2), _0x5c4b03.classList.add('is-error')),
        window.showToast?.(_0x6d8ad2, 'error'));
    } finally {
      setButtonBusy(_0x1e2c4c, false, diagnosticsText('create'));
    }
  }),
    _0x142e4a.addEventListener('click', async () => {
      try {
        await openDiagnosticsLogsFolder();
      } catch (_0x47643c) {
        (await logDiagnosticEvent({
          type: 'diagnostics.ui_open_logs_failed',
          level: 'error',
          source: 'renderer',
          message: _0x47643c?.message || diagnosticsText('openLogsFailed'),
          error: _0x47643c,
        }),
          window.showToast?.(_0x47643c?.message || diagnosticsText('openLogsFailed'), 'error'));
      }
    }));
}
