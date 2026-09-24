export function registerTextPresetIpcHandlers({
  ipcMain,
  configureGlobalTextPresetShortcut,
  chooseGlobalCaptureWindowAction,
  cancelGlobalCaptureWindow,
  setGlobalCaptureWindowExpanded,
  acknowledgeGlobalCaptureWindowPresentation,
  claimGlobalTextPresetEvent,
  acknowledgeGlobalTextPresetEvent,
  consumeGlobalTextPresetEvents,
}) {
  ipcMain.handle('textPreset:consumeEvents', () => consumeGlobalTextPresetEvents?.() || []);
  ipcMain.handle(
    'textPreset:claimEvent',
    (_event, payload) => claimGlobalTextPresetEvent?.(payload) || { ok: false },
  );
  ipcMain.handle(
    'textPreset:acknowledgeEvent',
    (_event, payload) => acknowledgeGlobalTextPresetEvent?.(payload) || { ok: false },
  );
  ipcMain.handle('textPreset:updateGlobalShortcut', async (_event, payload) => {
    if (typeof configureGlobalTextPresetShortcut !== 'function')
      return { ok: false, reason: 'not-supported' };
    return configureGlobalTextPresetShortcut(payload);
  });
  ipcMain.handle('globalCaptureWindow:chooseAction', async (event, payload) => {
    if (typeof chooseGlobalCaptureWindowAction !== 'function')
      return { ok: false, reason: 'not-supported' };
    return chooseGlobalCaptureWindowAction(payload, event?.sender);
  });
  ipcMain.handle('globalCaptureWindow:cancel', async (event, payload) => {
    if (typeof cancelGlobalCaptureWindow !== 'function') return { ok: false, reason: 'not-supported' };
    return cancelGlobalCaptureWindow(payload, event?.sender);
  });
  ipcMain.handle('globalCaptureWindow:setExpanded', async (event, payload) => {
    if (typeof setGlobalCaptureWindowExpanded !== 'function')
      return { ok: false, reason: 'not-supported' };
    return setGlobalCaptureWindowExpanded(payload, event?.sender);
  });
  ipcMain.handle('globalCaptureWindow:didPresent', async (event, payload) => {
    if (typeof acknowledgeGlobalCaptureWindowPresentation !== 'function')
      return { ok: false, reason: 'not-supported' };
    return acknowledgeGlobalCaptureWindowPresentation(payload, event?.sender);
  });
}
