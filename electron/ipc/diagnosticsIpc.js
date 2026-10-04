import { mkdirSync } from 'node:fs';
import { shell } from 'electron';
export function registerDiagnosticsIpcHandlers({
  ipcMain: ipcMain,
  diagnostics: diagnostics,
  logDir: logDir,
  logDiagnosticEvent: logDiagnosticEvent,
}) {
  (ipcMain.handle('diagnostics:createPackage', async (value, item = {}) => {
    const key = await diagnostics.createPackage(item && typeof item === 'object' ? item : {});
    return (key?.path && shell.showItemInFolder(key.path), key);
  }),
    ipcMain.handle('diagnostics:openLogsFolder', () => {
      return (mkdirSync(logDir, { recursive: true }), void shell.openPath(logDir), { ok: true });
    }),
    ipcMain.handle('diagnostics:logEvent', (index, source = {}) => {
      return logDiagnosticEvent({
        ...(source && typeof source === 'object' ? source : {}),
        source: source?.source || 'renderer',
      });
    }),
    ipcMain.on('diagnostics:dragImportLog', (result, data = {}) => {
      const context = {
        label: String(data?.label || ''),
        ...(data?.payload && typeof data.payload === 'object' ? data.payload : {}),
      };
      (console.log('[drag-import-prof] renderer', context),
        logDiagnosticEvent({
          type: 'import.drag_profile',
          level: 'debug',
          source: 'renderer',
          message: 'Drag import profile',
          context: context,
        }));
    }));
}
