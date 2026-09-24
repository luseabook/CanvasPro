import { mkdirSync } from 'node:fs';

function withZipExtension(filePath) {
  const raw = String(filePath || '').trim();
  if (!raw) return '';
  return raw.toLowerCase().endsWith('.zip') ? raw : raw + '.zip';
}

export function createDiagnosticsCapabilityOperations({ diagnostics, logDir, showSaveDialog, openFolder } = {}) {
  if (typeof diagnostics?.createPackage !== 'function')
    throw new TypeError('diagnostics.createPackage must be a function');
  if (typeof diagnostics?.getSuggestedPackagePath !== 'function')
    throw new TypeError('diagnostics.getSuggestedPackagePath must be a function');
  if (typeof showSaveDialog !== 'function') throw new TypeError('showSaveDialog must be a function');
  if (typeof openFolder !== 'function') throw new TypeError('openFolder must be a function');
  return Object.freeze({
    async createPackage(payload = {}) {
      const input = payload && typeof payload === 'object' ? payload : {};
      const picked = await showSaveDialog({
        title: '保存诊断包',
        defaultPath: diagnostics.getSuggestedPackagePath(),
        filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
      });
      if (picked?.canceled || !picked?.filePath) return { ok: false, success: false, canceled: true };
      const result = await diagnostics.createPackage({
        aiAnalysisReport: input.aiAnalysisReport,
        outputPath: withZipExtension(picked.filePath),
      });
      return { ...result, success: true, canceled: false };
    },
    openLogsFolder() {
      mkdirSync(logDir, { recursive: true });
      const opened = openFolder(logDir) || {};
      return { ok: true, foregroundRequested: opened.foregroundRequested === true };
    },
  });
}
