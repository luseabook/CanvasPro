export function registerMediaTaskIpcHandlers({ ipcMain: _0x311421, getMediaTaskQueue: _0x5e1cd1 }) {
  (_0x311421.handle('mediaTask:enqueue', (_0x57cab5, _0x24c70b) => {
    return _0x5e1cd1().enqueue(_0x24c70b || {});
  }),
    _0x311421.handle('mediaTask:cancel', (_0x589c51, _0x3f0605) => {
      return _0x5e1cd1().cancel(_0x3f0605?.taskId || '');
    }),
    _0x311421.handle('mediaTask:list', (_0x346cd2, _0x4be91f) => {
      return _0x5e1cd1().list({ limit: _0x4be91f?.limit || 100 });
    }));
}
