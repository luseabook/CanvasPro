export function registerAppIpcHandlers({
  ipcMain: ipcMain,
  getAppVersion: getAppVersion,
  getStableDeviceId: getStableDeviceId,
  getUpdaterController: getUpdaterController,
  getBackgroundCompletionNotifier: getBackgroundCompletionNotifier,
}) {
  (ipcMain.handle('app:getVersion', () => {
    return getAppVersion();
  }),
    ipcMain.handle('app:getDeviceId', (value, item = {}) => {
      return getStableDeviceId(item);
    }),
    ipcMain.handle('appUpdater:getState', () => {
      return getUpdaterController().getState();
    }),
    ipcMain.handle('appUpdater:checkForUpdates', async () => {
      return getUpdaterController().checkForUpdates({ manual: true });
    }),
    ipcMain.handle('appUpdater:quitAndInstall', () => {
      return getUpdaterController().installDownloadedUpdate();
    }),
    ipcMain.handle('appUpdater:downloadUpdate', async () => {
      return getUpdaterController().downloadUpdate();
    }),
    ipcMain.handle('notification:showGenerationComplete', (key, index = {}) => {
      const enabled = getBackgroundCompletionNotifier?.();
      if (!enabled || typeof enabled.showGenerationComplete !== 'function')
        return { success: true, shown: false, reason: 'unavailable' };
      return enabled.showGenerationComplete(index || {});
    }),
    ipcMain.handle('notification:updateGlobalShortcut', (result, data = {}) =>
      getBackgroundCompletionNotifier?.()?.updateGlobalShortcut(data || {}),
    ),
    ipcMain.handle('notification:acknowledge', (options, target = {}) =>
      getBackgroundCompletionNotifier?.()?.acknowledge(target || {}),
    ));
}
