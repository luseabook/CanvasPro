export function registerSecureSettingsIpcHandlers({
  ipcMain: ipcMain,
  getSecureSettingsStore: getSecureSettingsStore,
  normalizeSecureSettingsKeys: normalizeSecureSettingsKeys,
}) {
  (ipcMain.handle('secureSettings:get', (value, item = {}) => {
    const key = getSecureSettingsStore(),
      available = key.isAvailable(),
      index = normalizeSecureSettingsKeys(item);
    return { ok: true, available: available, values: available ? key.getMany(index) : {} };
  }),
    ipcMain.handle('secureSettings:set', (result, el = {}) => {
      const map = getSecureSettingsStore(),
        available2 = map.isAvailable();
      if (!available2) return { ok: false, available: available2, error: '安全存储不可用' };
      try {
        return (map.set(el?.key, el?.value), { ok: true, available: available2 });
      } catch (error) {
        return { ok: false, available: available2, error: String(error?.message || error) };
      }
    }),
    ipcMain.handle('secureSettings:delete', (data, event = {}) => {
      const map2 = getSecureSettingsStore(),
        available3 = map2.isAvailable();
      if (!available3) return { ok: false, available: available3, error: '安全存储不可用' };
      try {
        return (map2.delete(event?.key), { ok: true, available: available3 });
      } catch (error2) {
        return { ok: false, available: available3, error: String(error2?.message || error2) };
      }
    }));
}
