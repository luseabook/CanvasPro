import { mkdirSync } from 'node:fs';
import { shell } from 'electron';
export function registerDiagnosticsIpcHandlers({
  ipcMain: _0x17d42d,
  diagnostics: _0x22e85a,
  logDir: _0x330d2f,
  logDiagnosticEvent: _0x2a5dee,
}) {
  (_0x17d42d.handle('diagnostics:createPackage', async (_0x2e6eab, _0x2bd864 = {}) => {
    const _0x3ae1bd = await _0x22e85a.createPackage(
      _0x2bd864 && typeof _0x2bd864 === 'object' ? _0x2bd864 : {},
    );
    return (_0x3ae1bd?.path && shell.showItemInFolder(_0x3ae1bd.path), _0x3ae1bd);
  }),
    _0x17d42d.handle('diagnostics:openLogsFolder', () => {
      return (mkdirSync(_0x330d2f, { recursive: true }), void shell.openPath(_0x330d2f), { ok: true });
    }),
    _0x17d42d.handle('diagnostics:logEvent', (_0x53df58, _0x51416d = {}) => {
      return _0x2a5dee({
        ...(_0x51416d && typeof _0x51416d === 'object' ? _0x51416d : {}),
        source: _0x51416d?.source || 'renderer',
      });
    }),
    _0x17d42d.on('diagnostics:dragImportLog', (_0x2c8d53, _0x41dea9 = {}) => {
      const _0x5a1b43 = {
        label: String(_0x41dea9?.label || ''),
        ...(_0x41dea9?.payload && typeof _0x41dea9.payload === 'object' ? _0x41dea9.payload : {}),
      };
      (console.log('[drag-import-prof] renderer', _0x5a1b43),
        _0x2a5dee({
          type: 'import.drag_profile',
          level: 'debug',
          source: 'renderer',
          message: 'Drag import profile',
          context: _0x5a1b43,
        }));
    }));
}
