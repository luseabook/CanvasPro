export function registerLocalAssetCleanupIpcHandlers({
  ipcMain: _0x17e67d,
  getLocalAssetCleanupManager: _0xfc60ef,
}) {
  (_0x17e67d.handle('localAssetCleanup:scan', async (_0x21cfd3, _0x410b96 = {}) => {
    return await _0xfc60ef().scan(_0x410b96 || {});
  }),
    _0x17e67d.handle('localAssetCleanup:trash', async (_0x11e16b, _0x5d55bd = {}) => {
      return await _0xfc60ef().trash(_0x5d55bd || {});
    }));
}
