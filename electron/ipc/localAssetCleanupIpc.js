export function registerLocalAssetCleanupIpcHandlers({
  ipcMain: ipcMain,
  getLocalAssetCleanupManager: getLocalAssetCleanupManager,
}) {
  (ipcMain.handle('localAssetCleanup:scan', async (value, item = {}) => {
    return await getLocalAssetCleanupManager().scan(item || {});
  }),
    ipcMain.handle('localAssetCleanup:trash', async (key, index = {}) => {
      return await getLocalAssetCleanupManager().trash(index || {});
    }));
}
