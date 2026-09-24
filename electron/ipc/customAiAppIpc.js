import { createCustomAiAppStorage } from '../customAiAppStorage.js';

export function registerCustomAiAppIpcHandlers({ ipcMain, getCustomAiAppStorage, getDataDir }) {
  let storage = null;
  function resolveStorage() {
    if (typeof getCustomAiAppStorage === 'function') return getCustomAiAppStorage();
    if (!storage) storage = createCustomAiAppStorage({ getDataDir: getDataDir });
    return storage;
  }
  ipcMain.handle('customAiApps:read', () => resolveStorage().read());
  ipcMain.handle('customAiApps:write', (_event, payload = {}) => resolveStorage().write(payload || {}));
}
