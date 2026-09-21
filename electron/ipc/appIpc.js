export function registerAppIpcHandlers({
  ipcMain: _0x91da6a,
  getAppVersion: _0x5476f0,
  getStableDeviceId: _0x4c7565,
  getUpdaterController: _0x139e85,
  getBackgroundCompletionNotifier: _0x3087e5,
}) {
  (_0x91da6a.handle('app:getVersion', () => {
    return _0x5476f0();
  }),
    _0x91da6a.handle('app:getDeviceId', (_0x59f7a1, _0x3326bb = {}) => {
      return _0x4c7565(_0x3326bb);
    }),
    _0x91da6a.handle('appUpdater:getState', () => {
      return _0x139e85().getState();
    }),
    _0x91da6a.handle('appUpdater:checkForUpdates', async () => {
      return _0x139e85().checkForUpdates({ manual: true });
    }),
    _0x91da6a.handle('appUpdater:quitAndInstall', () => {
      return _0x139e85().installDownloadedUpdate();
    }),
    _0x91da6a.handle('appUpdater:downloadUpdate', async () => {
      return _0x139e85().downloadUpdate();
    }),
    _0x91da6a.handle('notification:showGenerationComplete', (_0x642e1b, _0x4f2a07 = {}) => {
      const _0x2c022e = _0x3087e5?.();
      if (!_0x2c022e || typeof _0x2c022e.showGenerationComplete !== 'function')
        return { success: true, shown: false, reason: 'unavailable' };
      return _0x2c022e.showGenerationComplete(_0x4f2a07 || {});
    }));
}
