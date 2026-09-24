import test from 'node:test';
import assert from 'node:assert/strict';
import { registerDesktopBridgeIpcHandlers } from './desktopBridgeIpc.js';

function createFakeIpcMain() {
  const handlers = new Map();
  return {
    handlers,
    handle: (channel, listener) => handlers.set(channel, listener),
  };
}

test('starting without capability handlers reports unavailability instead of opening a port', async () => {
  const ipcMain = createFakeIpcMain();
  registerDesktopBridgeIpcHandlers({ ipcMain });
  assert.deepEqual(await ipcMain.handlers.get('desktop-bridge:start')(), {
    ok: false,
    running: false,
    error: 'Capability handlers are unavailable',
  });
  assert.deepEqual(await ipcMain.handlers.get('desktop-bridge:status')(), {
    ok: true,
    running: false,
    url: '',
  });
});

test('start exposes a loopback endpoint guarded by a random per-launch token', async () => {
  const ipcMain = createFakeIpcMain();
  const diagnostics = [];
  registerDesktopBridgeIpcHandlers({
    ipcMain,
    capabilityHandlers: { getAppVersion: () => '9.9.9' },
    logDiagnosticEvent: (event) => diagnostics.push(event),
  });
  const started = await ipcMain.handlers.get('desktop-bridge:start')();
  assert.equal(started.ok, true);
  assert.equal(started.running, true);
  assert.match(started.token, /^[a-f0-9]{64}$/);

  const authorized = await fetch(started.url + '/api/v2/desktop/app/get-version', {
    method: 'POST',
    headers: { 'x-aic-desktop-bridge-token': started.token, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.deepEqual(await authorized.json(), { success: true, data: '9.9.9' });

  const denied = await fetch(started.url + '/api/v2/desktop/app/get-version', { method: 'POST' });
  assert.equal(denied.status, 403);

  const again = await ipcMain.handlers.get('desktop-bridge:start')();
  assert.equal(again.url, started.url);
  assert.equal(again.token, undefined);

  assert.deepEqual(await ipcMain.handlers.get('desktop-bridge:stop')(), { ok: true, running: false });
  assert.deepEqual(await ipcMain.handlers.get('desktop-bridge:status')(), {
    ok: true,
    running: false,
    url: '',
  });
  await assert.rejects(fetch(started.url + '/api/v2/desktop/app/get-version', { method: 'POST' }));
});

test('stopping an idle bridge is a no-op and a fresh start after stop gets a new token', async () => {
  const ipcMain = createFakeIpcMain();
  registerDesktopBridgeIpcHandlers({ ipcMain, capabilityHandlers: { getAppVersion: () => '1' } });
  assert.deepEqual(await ipcMain.handlers.get('desktop-bridge:stop')(), { ok: true, running: false });
  const first = await ipcMain.handlers.get('desktop-bridge:start')();
  await ipcMain.handlers.get('desktop-bridge:stop')();
  const second = await ipcMain.handlers.get('desktop-bridge:start')();
  assert.notEqual(first.token, second.token);
  await ipcMain.handlers.get('desktop-bridge:stop')();
});
