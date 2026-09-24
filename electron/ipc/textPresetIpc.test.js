import assert from 'node:assert/strict';
import test from 'node:test';
import { registerTextPresetIpcHandlers } from './textPresetIpc.js';

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

const REGISTERED_CHANNELS = [
  'textPreset:consumeEvents',
  'textPreset:claimEvent',
  'textPreset:acknowledgeEvent',
  'textPreset:updateGlobalShortcut',
  'globalCaptureWindow:chooseAction',
  'globalCaptureWindow:cancel',
  'globalCaptureWindow:setExpanded',
  'globalCaptureWindow:didPresent',
];

test('textPresetIpc: registers every channel', () => {
  const ipcMain = createFakeIpcMain();
  registerTextPresetIpcHandlers({ ipcMain: ipcMain });
  assert.deepEqual([...ipcMain.handlers.keys()], REGISTERED_CHANNELS);
});

test('textPresetIpc: delegates the event channel to the controller', async () => {
  const ipcMain = createFakeIpcMain();
  const calls = [];
  registerTextPresetIpcHandlers({
    ipcMain: ipcMain,
    consumeGlobalTextPresetEvents: () => [{ eventId: 'e1' }],
    claimGlobalTextPresetEvent: (payload) => (calls.push(['claim', payload]), { ok: true, text: 't' }),
    acknowledgeGlobalTextPresetEvent: (payload) => (calls.push(['ack', payload]), { ok: true }),
    configureGlobalTextPresetShortcut: async (payload) => (calls.push(['shortcut', payload]), { ok: true, accelerator: 'Alt+C' }),
  });
  assert.deepEqual(await ipcMain.invoke('textPreset:consumeEvents'), [{ eventId: 'e1' }]);
  assert.deepEqual(await ipcMain.invoke('textPreset:claimEvent', { eventId: 'e1', receiverId: 'r1' }), {
    ok: true,
    text: 't',
  });
  assert.deepEqual(await ipcMain.invoke('textPreset:acknowledgeEvent', { eventId: 'e1', receiverId: 'r1' }), {
    ok: true,
  });
  assert.deepEqual(await ipcMain.invoke('textPreset:updateGlobalShortcut', { keys: ['Alt', 'C'] }), {
    ok: true,
    accelerator: 'Alt+C',
  });
  assert.deepEqual(calls, [
    ['claim', { eventId: 'e1', receiverId: 'r1' }],
    ['ack', { eventId: 'e1', receiverId: 'r1' }],
    ['shortcut', { keys: ['Alt', 'C'] }],
  ]);
});

test('textPresetIpc: falls back without a controller', async () => {
  const ipcMain = createFakeIpcMain();
  registerTextPresetIpcHandlers({ ipcMain: ipcMain });
  assert.deepEqual(await ipcMain.invoke('textPreset:consumeEvents'), []);
  assert.deepEqual(await ipcMain.invoke('textPreset:claimEvent', { eventId: 'e1' }), { ok: false });
  assert.deepEqual(await ipcMain.invoke('textPreset:acknowledgeEvent', { eventId: 'e1' }), { ok: false });
  assert.deepEqual(await ipcMain.invoke('textPreset:updateGlobalShortcut', {}), {
    ok: false,
    reason: 'not-supported',
  });
});

test('textPresetIpc: forwards the capture-window payload with the sender', async () => {
  const ipcMain = createFakeIpcMain();
  const calls = [];
  const sender = { id: 'capture-window' };
  registerTextPresetIpcHandlers({
    ipcMain: ipcMain,
    chooseGlobalCaptureWindowAction: (payload, from) => (calls.push(['choose', payload, from]), { ok: true, action: 'insert' }),
    cancelGlobalCaptureWindow: (payload, from) => (calls.push(['cancel', payload, from]), { ok: true }),
    setGlobalCaptureWindowExpanded: (payload, from) => (calls.push(['expanded', payload, from]), { ok: true }),
    acknowledgeGlobalCaptureWindowPresentation: (payload, from) => (calls.push(['present', payload, from]), { ok: true }),
  });
  assert.deepEqual(await ipcMain.invoke('globalCaptureWindow:chooseAction', { actionId: 'a1' }, sender), {
    ok: true,
    action: 'insert',
  });
  assert.deepEqual(await ipcMain.invoke('globalCaptureWindow:cancel', { reason: 'escape' }, sender), { ok: true });
  assert.deepEqual(await ipcMain.invoke('globalCaptureWindow:setExpanded', { expanded: true }, sender), { ok: true });
  assert.deepEqual(await ipcMain.invoke('globalCaptureWindow:didPresent', { captureId: 'c1' }, sender), { ok: true });
  assert.deepEqual(calls, [
    ['choose', { actionId: 'a1' }, sender],
    ['cancel', { reason: 'escape' }, sender],
    ['expanded', { expanded: true }, sender],
    ['present', { captureId: 'c1' }, sender],
  ]);
});

test('textPresetIpc: the capture-window channels report not-supported when unwired', async () => {
  const ipcMain = createFakeIpcMain();
  registerTextPresetIpcHandlers({ ipcMain: ipcMain });
  for (const channel of [
    'globalCaptureWindow:chooseAction',
    'globalCaptureWindow:cancel',
    'globalCaptureWindow:setExpanded',
    'globalCaptureWindow:didPresent',
  ])
    assert.deepEqual(await ipcMain.invoke(channel, {}), { ok: false, reason: 'not-supported' });
});
