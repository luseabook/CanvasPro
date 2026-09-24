import test from 'node:test';
import assert from 'node:assert/strict';
import { registerMediaTaskHistoryIpc } from './mediaTaskHistoryIpc.js';

const SESSION = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function fixture() {
  const handlers = new Map();
  const frame = { url: 'app://local/index.html' };
  const webContents = { mainFrame: frame };
  const mainWindow = { isDestroyed: () => false, webContents };
  const event = { sender: webContents, senderFrame: frame };
  const calls = [];
  const history = {
    status: async () => { calls.push('status'); return { version: 1, sessionId: SESSION, controlRevision: 2 }; },
    read: async query => { calls.push({ read: query }); return { rows: [], total: 0, offset: query.offset }; },
    configure: async (request, options) => { calls.push({ configure: request }); options.assertAllowed(); return { enabled: request.enabled }; },
    flush: async options => { calls.push('flush'); options.assertAllowed(); return { pending: false }; },
  };
  registerMediaTaskHistoryIpc({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
    getMediaTaskHistory: () => history, getNodeExportWindow: () => mainWindow,
    isNodeExportAppUrl: url => url === frame.url });
  return { handlers, calls, event };
}

test('four bounded channels are registered only for updated hosts', () => {
  const f = fixture();
  assert.deepEqual([...f.handlers.keys()].sort(), [
    'mediaTaskHistory:configure', 'mediaTaskHistory:flush', 'mediaTaskHistory:read', 'mediaTaskHistory:status',
  ]);
  const old = new Map();
  registerMediaTaskHistoryIpc({ ipcMain: { handle: (key, action) => old.set(key, action) } });
  assert.equal(old.size, 0);
});
test('read/status are non-mutating and do not access queue or accept filesystem paths', async () => {
  const f = fixture();
  const response = await f.handlers.get('mediaTaskHistory:read')(f.event, { taskId: 'task-1', limit: 1 });
  assert.equal(response.ok, true);
  assert.deepEqual(f.calls, [{ read: { offset: 0, limit: 1, taskId: 'task-1' } }, 'status']);
  await assert.rejects(f.handlers.get('mediaTaskHistory:read')(f.event, { path: '../media.mp4' }));
  await assert.rejects(f.handlers.get('mediaTaskHistory:status')(f.event, { payload: {} }));
  assert.equal(f.calls.length, 2);
});
test('renderer other than current local main frame cannot query or change settings', async () => {
  const f = fixture();
  for (const bad of [{ ...f.event, senderFrame: { url: f.event.senderFrame.url } },
    { ...f.event, sender: {} }, { ...f.event, senderFrame: { url: 'https://elsewhere/' } }]) {
    await assert.rejects(f.handlers.get('mediaTaskHistory:read')(bad, {}));
    await assert.rejects(f.handlers.get('mediaTaskHistory:configure')(bad, { enabled: true, expectedSession: SESSION, expectedControlRevision: 2 }));
  }
  assert.deepEqual(f.calls, []);
});
test('settings require explicit boolean + session/revision and reject extra commands', async () => {
  const f = fixture();
  const handler = f.handlers.get('mediaTaskHistory:configure');
  for (const bad of [{ enabled: 1, expectedSession: SESSION, expectedControlRevision: 2 },
    { enabled: true, expectedSession: 'wrong', expectedControlRevision: 2 },
    { enabled: true, expectedSession: SESSION, expectedControlRevision: -1 },
    { enabled: true, expectedSession: SESSION, expectedControlRevision: 2, path: '/tmp/history' }]) {
    await assert.rejects(handler(f.event, bad));
  }
  assert.deepEqual(f.calls, []);
  const receipt = await handler(f.event, { enabled: true, expectedSession: SESSION, expectedControlRevision: 2 });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.status.enabled, true);
  assert.deepEqual(f.calls, [{ configure: { enabled: true, expectedSession: SESSION, expectedControlRevision: 2 } }]);
});
test('storage failure yields an explicit error/status instead of invented success or retry', async () => {
  const f = fixture();
  const error = new Error('no space'); error.historyCode = 'disk-full';
  // The channel's error path re-reads status, but never invokes a media task handler.
  const history = {
    status: async () => ({ problemCode: 'disk-full', enabled: false }),
    flush: async () => { throw error; },
  };
  const secureWindow = { isDestroyed: () => false, webContents: { mainFrame: f.event.senderFrame } };
  const handlers = new Map();
  registerMediaTaskHistoryIpc({ ipcMain: { handle: (name, fn) => handlers.set(name, fn) },
    getMediaTaskHistory: () => history, getNodeExportWindow: () => secureWindow, isNodeExportAppUrl: () => true });
  const response = await handlers.get('mediaTaskHistory:flush')({ sender: secureWindow.webContents, senderFrame: f.event.senderFrame }, {});
  assert.equal(response.ok, false);
  assert.equal(response.status.problemCode, 'disk-full');
  assert.match(response.error, /no space/);
});
