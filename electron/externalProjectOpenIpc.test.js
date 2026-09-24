import test from 'node:test';
import assert from 'node:assert/strict';
import { registerProjectIpcHandlers } from './ipc/projectIpc.js';

function setup() {
  const handlers = new Map();
  const frame = { url: 'app://local/index.html' };
  const localUrl = frame.url;
  const webContents = { mainFrame: frame };
  const mainWindow = { isDestroyed: () => false, webContents };
  const event = { sender: webContents, senderFrame: frame };
  let consumed = 0;
  const clearAttempts = [];
  registerProjectIpcHandlers({
    ipcMain: { handle: (name, callback) => handlers.set(name, callback), on: () => {} },
    getNodeExportWindow: () => mainWindow,
    isNodeExportAppUrl: url => url === localUrl,
    consumeExternalOpenRequests: () => { consumed++; return [{ success: true, filename: 'private.aicanvas' }]; },
    clearDesktopRecoverySnapshot: expected => {
      clearAttempts.push(expected);
      return expected?.revision ? { success: true, cleared: true } : { success: false, cleared: false };
    },
    writeDesktopRecoverySnapshot: () => {
      throw Object.assign(new Error('Protected snapshot'), { code: 'RECOVERY_SNAPSHOT_PROTECTED' });
    },
  });
  return { handler: handlers.get('project:consumeExternalOpenRequests'), mainWindow, event,
    clearHandler: handlers.get('project:clearRecoverySnapshot'),
    writeHandler: handlers.get('project:writeRecoverySnapshot'), clearAttempts,
    count: () => consumed };
}

test('other renderer, subframe, wrong URL or closed main window cannot steal the external-open queue', () => {
  const { handler, mainWindow, event, count } = setup();
  for (const bad of [{ sender: {}, senderFrame: event.senderFrame },
    { sender: event.sender, senderFrame: { url: event.senderFrame.url } }]) {
    assert.throws(() => handler(bad), /主应用窗口/);
  }
  const localUrl = event.senderFrame.url;
  event.senderFrame.url = 'https://other/';
  assert.throws(() => handler(event), /主应用窗口/);
  event.senderFrame.url = localUrl;
  assert.equal(count(), 0);
  mainWindow.isDestroyed = () => true;
  assert.throws(() => handler(event), /主应用窗口/);
  assert.equal(count(), 0);
});
test('only the live local main frame may consume each queued request', () => {
  const { handler, event, count } = setup();
  assert.deepEqual(handler(event), [{ success: true, filename: 'private.aicanvas' }]);
  assert.equal(count(), 1);
});

test('snapshot clear requires a main-frame guarded request; blocked writes preserve the reason', () => {
  const { clearHandler, writeHandler, event, clearAttempts } = setup();
  assert.throws(() => clearHandler({ sender: {}, senderFrame: event.senderFrame }, {}), /主应用窗口/);
  assert.equal(clearAttempts.length, 0);
  assert.equal(clearHandler(event).cleared, false);
  assert.deepEqual(clearAttempts[0], {});
  const expected = { projectId: 'p', revision: 'a'.repeat(64) };
  assert.equal(clearHandler(event, expected).cleared, true);
  assert.deepEqual(clearAttempts[1], expected);
  assert.equal(writeHandler(event, {}).code, 'RECOVERY_SNAPSHOT_PROTECTED');
});
