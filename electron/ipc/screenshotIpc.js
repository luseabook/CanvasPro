export function registerScreenshotIpcHandlers({
  ipcMain: ipcMain,
  captureDesktopDisplay: captureDesktopDisplay,
  configureGlobalScreenshotShortcut: configureGlobalScreenshotShortcut,
  handleScreenshotOverlayConfirm: handleScreenshotOverlayConfirm,
  handleScreenshotOverlayCancel: handleScreenshotOverlayCancel,
}) {
  (ipcMain.handle('screenshot:captureDisplay', async () => {
    if (typeof captureDesktopDisplay !== 'function') return { ok: false, reason: 'not-supported' };
    try {
      return await captureDesktopDisplay();
    } catch (error) {
      return { ok: false, reason: 'capture-failed', error: String(error?.message || error) };
    }
  }),
    ipcMain.handle('screenshot:overlayConfirm', async (value, item) => {
      if (typeof handleScreenshotOverlayConfirm !== 'function') return { ok: false, reason: 'not-supported' };
      return await handleScreenshotOverlayConfirm(item);
    }),
    ipcMain.handle('screenshot:overlayCancel', async () => {
      if (typeof handleScreenshotOverlayCancel !== 'function') return { ok: false, reason: 'not-supported' };
      return await handleScreenshotOverlayCancel();
    }),
    ipcMain.handle('screenshot:updateGlobalShortcut', async (key, index) => {
      if (typeof configureGlobalScreenshotShortcut !== 'function')
        return { ok: false, reason: 'not-supported' };
      return configureGlobalScreenshotShortcut(index);
    }));
}
