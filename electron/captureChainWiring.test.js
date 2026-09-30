import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMainIpcHandlerDeps } from './ipc/mainIpcSetup.js';
import { registerTextPresetIpcHandlers } from './ipc/textPresetIpc.js';

const MAIN_SOURCE = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
const IPC_SETUP_SOURCE = readFileSync(new URL('./ipc/mainIpcSetup.js', import.meta.url), 'utf8');

function createDelegatingWindowController(calls) {
  return {
    chooseAction: (payload, sender) => (
      calls.push(['chooseAction', payload, sender]),
      { ok: true, forwardedTo: 'chooseAction' }
    ),
    cancel: (payload, sender) => (
      calls.push(['cancel', payload, sender]),
      { ok: true, forwardedTo: 'cancel' }
    ),
    setExpanded: (payload, sender) => (
      calls.push(['setExpanded', payload, sender]),
      { ok: true, forwardedTo: 'setExpanded' }
    ),
    didPresent: (payload, sender) => (
      calls.push(['didPresent', payload, sender]),
      { ok: true, forwardedTo: 'didPresent' }
    ),
  };
}

function minimalContext(extra = {}) {
  return {
    app: { getVersion: () => '0.0.0' },
    screenshotOverlayController: {},
    diagnostics: { createPackage: async () => ({ ok: true }), getSuggestedPackagePath: () => '' },
    showSaveDialog: async () => ({ canceled: true }),
    openFolder: () => ({}),
    ...extra,
  };
}

function createIpcMainStub() {
  const handlers = new Map();
  return {
    handlers: handlers,
    handle: (channel, handler) => handlers.set(channel, handler),
  };
}

test('mainIpcSetup forwards the capture window controller to four overlay deps', () => {
  const calls = [],
    controller = createDelegatingWindowController(calls),
    deps = buildMainIpcHandlerDeps(minimalContext({ globalCaptureWindowController: controller }));
  for (const key of [
    'chooseGlobalCaptureWindowAction',
    'cancelGlobalCaptureWindow',
    'setGlobalCaptureWindowExpanded',
    'acknowledgeGlobalCaptureWindowPresentation',
  ])
    assert.equal(typeof deps[key], 'function', key);
  assert.equal(deps.chooseGlobalCaptureWindowAction, controller.chooseAction);
  assert.deepEqual(deps.chooseGlobalCaptureWindowAction({ actionId: 'ai-text' }, 'sender'), {
    ok: true,
    forwardedTo: 'chooseAction',
  });
  assert.deepEqual(deps.cancelGlobalCaptureWindow({}, 'sender'), { ok: true, forwardedTo: 'cancel' });
  assert.deepEqual(deps.setGlobalCaptureWindowExpanded({ expanded: true }, 'sender'), {
    ok: true,
    forwardedTo: 'setExpanded',
  });
  assert.deepEqual(deps.acknowledgeGlobalCaptureWindowPresentation({}, 'sender'), {
    ok: true,
    forwardedTo: 'didPresent',
  });
  assert.deepEqual(
    calls.map((entry) => entry[0]),
    ['chooseAction', 'cancel', 'setExpanded', 'didPresent'],
  );
  assert.deepEqual(calls[0], ['chooseAction', { actionId: 'ai-text' }, 'sender']);
});

test('without an assembled controller the four overlay deps stay undefined', () => {
  const deps = buildMainIpcHandlerDeps(minimalContext());
  for (const key of [
    'chooseGlobalCaptureWindowAction',
    'cancelGlobalCaptureWindow',
    'setGlobalCaptureWindowExpanded',
    'acknowledgeGlobalCaptureWindowPresentation',
  ])
    assert.equal(deps[key], undefined, key);
});

test('the capture panel IPC channels reach the assembled controller and forward the sender', async () => {
  const calls = [],
    controller = createDelegatingWindowController(calls),
    ipcMain = createIpcMainStub();
  registerTextPresetIpcHandlers({
    ipcMain: ipcMain,
    ...buildMainIpcHandlerDeps(minimalContext({ globalCaptureWindowController: controller })),
  });
  const sender = { id: 'capture-panel' };
  assert.equal(ipcMain.handlers.has('globalCaptureWindow:chooseAction'), true);
  assert.equal(ipcMain.handlers.has('globalCaptureWindow:cancel'), true);
  assert.equal(ipcMain.handlers.has('globalCaptureWindow:setExpanded'), true);
  assert.equal(ipcMain.handlers.has('globalCaptureWindow:didPresent'), true);
  assert.deepEqual(
    await ipcMain.handlers.get('globalCaptureWindow:chooseAction')(
      { sender: sender },
      {
        actionId: 'ai-video',
        captureId: 'c1',
      },
    ),
    { ok: true, forwardedTo: 'chooseAction' },
  );
  assert.deepEqual(
    await ipcMain.handlers.get('globalCaptureWindow:cancel')(
      { sender: sender },
      {
        captureId: 'c1',
      },
    ),
    { ok: true, forwardedTo: 'cancel' },
  );
  assert.deepEqual(
    await ipcMain.handlers.get('globalCaptureWindow:setExpanded')(
      { sender: sender },
      {
        expanded: true,
      },
    ),
    { ok: true, forwardedTo: 'setExpanded' },
  );
  assert.deepEqual(
    await ipcMain.handlers.get('globalCaptureWindow:didPresent')(
      { sender: sender },
      {
        presentationId: 1,
      },
    ),
    { ok: true, forwardedTo: 'didPresent' },
  );
  assert.deepEqual(
    calls.map((entry) => [entry[0], entry[2]]),
    [
      ['chooseAction', sender],
      ['cancel', sender],
      ['setExpanded', sender],
      ['didPresent', sender],
    ],
  );
});

test('without a controller the overlay channels answer not-supported instead of throwing', async () => {
  const ipcMain = createIpcMainStub();
  registerTextPresetIpcHandlers({ ipcMain: ipcMain, ...buildMainIpcHandlerDeps(minimalContext()) });
  for (const channel of [
    'globalCaptureWindow:chooseAction',
    'globalCaptureWindow:cancel',
    'globalCaptureWindow:setExpanded',
    'globalCaptureWindow:didPresent',
  ])
    assert.deepEqual(
      await ipcMain.handlers.get(channel)({ sender: null }, {}),
      {
        ok: false,
        reason: 'not-supported',
      },
      channel,
    );
});

test('main.js assembles the capture chain through the single assembly factory', () => {
  assert.match(
    MAIN_SOURCE,
    /import \{ createGlobalCaptureControllers \} from '\.\/globalCaptureControllers\.js';/,
  );
  assert.match(
    MAIN_SOURCE,
    /const \{ globalCaptureWindowController, globalTextPresetShortcutController \} = createGlobalCaptureControllers\(\{/,
  );
  assert.match(MAIN_SOURCE, /dirname: __dirname,/);
  assert.match(MAIN_SOURCE, /accelerator: GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR,/);
  assert.equal(MAIN_SOURCE.includes('createSelectedTextCaptureController'), false);
  assert.equal(MAIN_SOURCE.includes('createGlobalTextPresetShortcutController'), false);
  assert.equal(/from '\.\/selectedTextCapture\.js'/.test(MAIN_SOURCE), false);
  assert.equal(/from '\.\/globalTextPresetShortcutController\.js'/.test(MAIN_SOURCE), false);
});

test('main.js exposes the capture window controller and owns its lifecycle', () => {
  assert.match(MAIN_SOURCE, /\n\s+globalCaptureWindowController: globalCaptureWindowController,/);
  assert.match(MAIN_SOURCE, /void globalCaptureWindowController\.prewarm\(\),/);
  assert.match(MAIN_SOURCE, /cleanup:\s*\(\)\s*=>\s*runCleanupSteps\([\s\S]*?\(\)\s*=>\s*globalCaptureWindowController\.destroy\(\)/);
  assert.match(MAIN_SOURCE, /globalTextPresetShortcutController\?\.sendShortcutStatus\?\.\(\),/);
  assert.equal(MAIN_SOURCE.includes('selectedTextCaptureController'), false);
});

test('main.js registers the Alt+C global shortcut on start and unregisters it on quit', () => {
  assert.match(
    MAIN_SOURCE,
    /AIC_DISABLE_GLOBAL_CAPTURE[\s\S]*?screenshotOverlayController\.installGlobalScreenshotShortcut\(\),[\s\S]*?AIC_DISABLE_GLOBAL_CAPTURE[\s\S]*?globalTextPresetShortcutController\.installGlobalShortcut\(\),/,
  );
  assert.match(
    MAIN_SOURCE,
    /screenshotOverlayController\.uninstallGlobalScreenshotShortcut\(\),[\s\S]*?globalShortcut\.unregisterAll\(\),[\s\S]*?globalCaptureWindowController\.destroy\(\)/,
  );
  assert.equal(MAIN_SOURCE.includes('accelerator: GLOBAL_CAPTURE_LAUNCHER_ACCELERATOR'), true);
});

test('mainIpcSetup reads the four overlay deps off the capture window controller', () => {
  assert.match(IPC_SETUP_SOURCE, /globalCaptureWindowController: _0x331d63,/);
  for (const [depKey, member] of [
    ['chooseGlobalCaptureWindowAction', 'chooseAction'],
    ['cancelGlobalCaptureWindow', 'cancel'],
    ['setGlobalCaptureWindowExpanded', 'setExpanded'],
    ['acknowledgeGlobalCaptureWindowPresentation', 'didPresent'],
  ])
    assert.equal(
      IPC_SETUP_SOURCE.includes(`${depKey}: _0x331d63?.['${member}'],`),
      true,
      `${depKey} -> ${member}`,
    );
});
