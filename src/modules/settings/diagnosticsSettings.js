import {
  canUseDiagnostics,
  createDiagnosticsPackage,
  openDiagnosticsLogsFolder,
  logDiagnosticEvent,
  logPerformanceSnapshot,
} from '../../services/diagnosticsService.js';
import { createAiDiagnosticsReport } from '../../services/aiDiagnosticsReport.js';
import { t } from '../../i18n/index.js';
function diagnosticsText(value, item = {}) {
  return t('settings.fileSave.diagnostics.' + value, item);
}
function setButtonBusy(el, key, index) {
  if (!el) return;
  el.disabled = Boolean(key);
  if (index) el.textContent = index;
}
export function initDiagnosticsSettings({ graphStore: graphStore = null } = {}) {
  const el2 = document.getElementById('diagnosticsSettingsCard'),
    el3 = document.getElementById('btnCreateDiagnosticsPackage'),
    el4 = document.getElementById('btnOpenDiagnosticsLogs'),
    el5 = document.getElementById('diagnosticsStatusText');
  if (!el2 || !el3 || !el4) return;
  const canUseDiagnostics2 = canUseDiagnostics();
  el2.hidden = !canUseDiagnostics2;
  if (!canUseDiagnostics2) return;
  (el3.addEventListener('click', async () => {
    setButtonBusy(el3, true, diagnosticsText('creating'));
    el5 && ((el5.textContent = diagnosticsText('collecting')), el5.classList.remove('is-error'));
    try {
      const report = createAiDiagnosticsReport({
        graphStore: graphStore,
        reason: 'settings_diagnostics_package',
      });
      (await logDiagnosticEvent({
        type: 'ai_diagnostics.report',
        level: 'info',
        source: 'renderer',
        message: 'AI-readable diagnostics report captured',
        context: { report: report },
      }),
        await logPerformanceSnapshot('diagnostics_package'));
      const filename = await createDiagnosticsPackage({ aiAnalysisReport: report });
      (el5 &&
        (el5.textContent = filename?.filename
          ? diagnosticsText('createdWithFile', { filename: filename.filename })
          : diagnosticsText('created')),
        window.showToast?.(diagnosticsText('created'), 'success'));
    } catch (error) {
      const message = error?.message || diagnosticsText('createFailed');
      (await logDiagnosticEvent({
        type: 'diagnostics.ui_create_failed',
        level: 'error',
        source: 'renderer',
        message: message,
        error: error,
      }),
        el5 && ((el5.textContent = message), el5.classList.add('is-error')),
        window.showToast?.(message, 'error'));
    } finally {
      setButtonBusy(el3, false, diagnosticsText('create'));
    }
  }),
    el4.addEventListener('click', async () => {
      try {
        await openDiagnosticsLogsFolder();
      } catch (message2) {
        (await logDiagnosticEvent({
          type: 'diagnostics.ui_open_logs_failed',
          level: 'error',
          source: 'renderer',
          message: message2?.message || diagnosticsText('openLogsFailed'),
          error: message2,
        }),
          window.showToast?.(message2?.message || diagnosticsText('openLogsFailed'), 'error'));
      }
    }));
}
