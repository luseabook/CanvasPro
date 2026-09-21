export function registerScreenshotIpcHandlers({
  ipcMain: _0x339e20,
  captureDesktopDisplay: _0x1778a2,
  handleScreenshotOverlayConfirm: _0x1136e3,
  handleScreenshotOverlayCancel: _0x5366b3,
}) {
  (_0x339e20.handle('screenshot:captureDisplay', async () => {
    if (typeof _0x1778a2 !== 'function') return { ok: false, reason: 'not-supported' };
    try {
      return await _0x1778a2();
    } catch (_0x2f8d00) {
      return { ok: false, reason: 'capture-failed', error: String(_0x2f8d00?.message || _0x2f8d00) };
    }
  }),
    _0x339e20.handle('screenshot:overlayConfirm', async (_0x29ef0d, _0x1ba9f3) => {
      if (typeof _0x1136e3 !== 'function') return { ok: false, reason: 'not-supported' };
      return await _0x1136e3(_0x1ba9f3);
    }),
    _0x339e20.handle('screenshot:overlayCancel', async () => {
      if (typeof _0x5366b3 !== 'function') return { ok: false, reason: 'not-supported' };
      return await _0x5366b3();
    }));
}
