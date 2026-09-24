import { randomBytes } from 'node:crypto';
import { startDesktopHttpBridge } from '../desktopHttpBridge.js';

export function registerDesktopBridgeIpcHandlers({ ipcMain, capabilityHandlers, logDiagnosticEvent } = {}) {
  let bridge = null;
  ipcMain.handle('desktop-bridge:start', async () => {
    if (bridge) return { ok: true, running: true, url: bridge.url };
    if (!capabilityHandlers) return { ok: false, running: false, error: 'Capability handlers are unavailable' };
    const token = randomBytes(32).toString('hex');
    bridge = await startDesktopHttpBridge({
      token,
      handlers: capabilityHandlers,
      logEvent: logDiagnosticEvent,
    });
    return { ok: true, running: true, url: bridge.url, token: bridge.token };
  });
  ipcMain.handle('desktop-bridge:status', () => ({
    ok: true,
    running: !!bridge,
    url: bridge?.url || '',
  }));
  ipcMain.handle('desktop-bridge:stop', async () => {
    const active = bridge;
    bridge = null;
    if (!active) return { ok: true, running: false };
    await active.close();
    return { ok: true, running: false };
  });
}
