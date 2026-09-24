import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CUSTOM_AI_APP_STORAGE_DIRNAME } from '../customAiAppStorage.js';
import { registerCustomAiAppIpcHandlers } from './customAiAppIpc.js';

function createFakeIpcMain() {
  const handlers = new Map();
  return {
    handlers: handlers,
    handle: (channel, handler) => {
      handlers.set(channel, handler);
    },
    invoke: (channel, payload, sender = { id: 'sender-1' }) => {
      const handler = handlers.get(channel);
      if (!handler) throw new Error(`no handler for ${channel}`);
      return handler({ sender: sender }, payload);
    },
  };
}

function withTempDir(run) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'custom-ai-app-ipc-'));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('customAiAppIpc: registers exactly the two channels', () => {
  const ipcMain = createFakeIpcMain();
  registerCustomAiAppIpcHandlers({ ipcMain: ipcMain });
  assert.deepEqual([...ipcMain.handlers.keys()], ['customAiApps:read', 'customAiApps:write']);
});

test('customAiAppIpc: delegates to the injected storage for both channels', async () => {
  const ipcMain = createFakeIpcMain();
  const calls = [];
  const storage = {
    read: () => (calls.push(['read']), { ok: true, savedApps: [{ id: 'a' }] }),
    write: (payload) => (calls.push(['write', payload]), { ok: true }),
  };
  registerCustomAiAppIpcHandlers({
    ipcMain: ipcMain,
    getCustomAiAppStorage: () => storage,
    getDataDir: () => {
      throw new Error('the injected accessor must win');
    },
  });
  assert.deepEqual(await ipcMain.invoke('customAiApps:read'), { ok: true, savedApps: [{ id: 'a' }] });
  assert.deepEqual(await ipcMain.invoke('customAiApps:write', { savedApps: [{ id: 'b' }] }), { ok: true });
  assert.deepEqual(calls, [['read'], ['write', { savedApps: [{ id: 'b' }] }]]);
});

test('customAiAppIpc: normalises a missing write payload to an empty object', async () => {
  const ipcMain = createFakeIpcMain();
  const calls = [];
  const storage = {
    read: () => ({ ok: true }),
    write: (payload) => (calls.push(payload), { ok: true }),
  };
  registerCustomAiAppIpcHandlers({ ipcMain: ipcMain, getCustomAiAppStorage: () => storage });
  await ipcMain.invoke('customAiApps:write');
  await ipcMain.invoke('customAiApps:write', null);
  await ipcMain.invoke('customAiApps:write', {});
  assert.deepEqual(calls, [{}, {}, {}]);
});

test('customAiAppIpc: without an accessor it lazily builds storage from getDataDir', async () => {
  await withTempDir(async (dataDir) => {
    const ipcMain = createFakeIpcMain();
    registerCustomAiAppIpcHandlers({ ipcMain: ipcMain, getDataDir: () => dataDir });
    const root = path.join(path.resolve(dataDir), CUSTOM_AI_APP_STORAGE_DIRNAME);
    const initial = await ipcMain.invoke('customAiApps:read');
    assert.equal(initial.ok, true);
    assert.equal(initial.storageRoot, root);
    assert.equal(initial.hasData, false);
    assert.deepEqual(initial.savedApps, []);
    assert.deepEqual(await ipcMain.invoke('customAiApps:write', {
      savedApps: [{ id: 'a', sourceType: 'comfyui-local-workflow' }],
    }), { ok: true, version: 1, storageRoot: root });
    const stored = JSON.parse(
      readFileSync(path.join(root, 'comfyui-local-workflow', 'saved-apps.json'), 'utf8'),
    );
    assert.deepEqual(
      stored.items.map((item) => item.id),
      ['a'],
    );
    const reread = await ipcMain.invoke('customAiApps:read');
    assert.equal(reread.hasData, true);
    assert.deepEqual(
      reread.savedApps.map((item) => item.id),
      ['a'],
    );
  });
});

test('customAiAppIpc: an unusable data directory fails loudly instead of returning empty data', () => {
  const ipcMain = createFakeIpcMain();
  registerCustomAiAppIpcHandlers({ ipcMain: ipcMain, getDataDir: () => '' });
  assert.throws(() => ipcMain.invoke('customAiApps:read'), /data directory is unavailable/);
  assert.throws(() => ipcMain.invoke('customAiApps:write', {}), /data directory is unavailable/);
});

test('customAiAppIpc: a corrupt stored file degrades to an empty library', async () => {
  await withTempDir(async (dataDir) => {
    const root = path.join(path.resolve(dataDir), CUSTOM_AI_APP_STORAGE_DIRNAME);
    mkdirSync(path.join(root, 'runninghub-ai-app'), { recursive: true });
    writeFileSync(path.join(root, 'runninghub-ai-app', 'saved-apps.json'), '{ not json', 'utf8');
    const ipcMain = createFakeIpcMain();
    registerCustomAiAppIpcHandlers({ ipcMain: ipcMain, getDataDir: () => dataDir });
    const result = await ipcMain.invoke('customAiApps:read');
    assert.equal(result.ok, true);
    assert.deepEqual(result.savedApps, []);
  });
});
