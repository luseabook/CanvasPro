import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

// These are static source-text contract checks: the preload itself runs inside Electron and cannot be
// imported in plain Node, so the channel names are cross-checked against the registering modules instead.
test('the capture window preload is a CommonJS contextBridge module', () => {
  const preload = read('./globalCaptureWindowPreload.cjs');
  assert.match(preload, /const \{ contextBridge, ipcRenderer \} = require\('electron'\);/);
  assert.equal((preload.match(/contextBridge\.exposeInMainWorld\(/g) || []).length, 0x1);
  assert.match(preload, /contextBridge\.exposeInMainWorld\('globalCaptureWindow', \{/);
});

test('the preload exposes exactly the five panel members', () => {
  const preload = read('./globalCaptureWindowPreload.cjs');
  const members = [...preload.matchAll(/^ {2}([A-Za-z]+):/gm)].map((match) => match[1]);
  assert.deepEqual(members, ['chooseAction', 'cancel', 'setExpanded', 'didPresent', 'onPresent']);
});

test('every invoke channel of the preload is registered exactly once by the IPC layer', () => {
  const preload = read('./globalCaptureWindowPreload.cjs');
  const ipc = read('./ipc/textPresetIpc.js');
  const channels = [...preload.matchAll(/ipcRenderer\.invoke\('([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(channels, [
    'globalCaptureWindow:chooseAction',
    'globalCaptureWindow:cancel',
    'globalCaptureWindow:setExpanded',
    'globalCaptureWindow:didPresent',
  ]);
  for (const channel of channels) {
    const registered = ipc.match(new RegExp(`ipcMain\\.handle\\('${channel}'`, 'g')) || [];
    assert.equal(registered.length, 0x1, channel);
  }
});

test('the present event the preload listens for is the one the controller sends', () => {
  const preload = read('./globalCaptureWindowPreload.cjs');
  const controller = read('./globalCaptureWindowController.js');
  assert.match(preload, /ipcRenderer\.on\('globalCaptureWindow:present', listener\);/);
  assert.match(controller, /\['send'\]\?\.\('globalCaptureWindow:present', \{/);
});

test('the preload subscribes and unsubscribes through the same exported closure', () => {
  const preload = read('./globalCaptureWindowPreload.cjs');
  assert.match(preload, /ipcRenderer\.removeListener\('globalCaptureWindow:present', listener\);/);
  assert.match(preload, /if \(typeof callback !== 'function'\) return \(\) => \{\};/);
  assert.match(preload, /return \(\) => \{/);
});
