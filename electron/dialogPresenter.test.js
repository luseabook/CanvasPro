import assert from 'node:assert/strict';
import test from 'node:test';
import { createForegroundDialogPresenter } from './dialogPresenter.js';

class FakeBrowserWindow {
  constructor(options) {
    this.options = options;
  }
  isDestroyed() {
    return false;
  }
  on() {
    return this;
  }
}

function createDialog() {
  const calls = [];
  return {
    calls,
    api: {
      async showOpenDialog(...args) {
        calls.push(['showOpenDialog', ...args]);
        return { canceled: true, filePaths: [] };
      },
      async showSaveDialog(...args) {
        calls.push(['showSaveDialog', ...args]);
        return { canceled: true };
      },
    },
  };
}

test('createForegroundDialogPresenter exposes the foreground dialog surface', () => {
  const presenter = createForegroundDialogPresenter();
  assert.deepEqual(Object.keys(presenter), [
    'destroyOwnerWindow',
    'getDialogParentWindow',
    'showOpenDialog',
    'showSaveDialog',
  ]);
  assert.equal(presenter.getDialogParentWindow(), null);
});

test('createForegroundDialogPresenter routes dialogs through the injected dialog API', async () => {
  const { calls, api } = createDialog();
  const mainWindow = new FakeBrowserWindow({});
  const presenter = createForegroundDialogPresenter({
    app: { focus() {} },
    dialog: api,
    getMainWindow: () => mainWindow,
  });
  assert.equal(presenter.getDialogParentWindow(), mainWindow);
  await presenter.showOpenDialog({ title: '打开项目' });
  await presenter.showSaveDialog({ title: '另存为项目' });
  assert.deepEqual(calls, [
    ['showOpenDialog', mainWindow, { title: '打开项目' }],
    ['showSaveDialog', mainWindow, { title: '另存为项目' }],
  ]);
});

test('createForegroundDialogPresenter forces the electron BrowserWindow and screen overrides', () => {
  const { api } = createDialog();
  const presenter = createForegroundDialogPresenter({
    app: { focus() {} },
    dialog: api,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: FakeBrowserWindow,
    screenApi: { getCursorScreenPoint: () => ({ x: 0, y: 0 }), getDisplayNearestPoint: () => null },
  });
  assert.throws(() => presenter.getDialogParentWindow(), TypeError);
});

test('createForegroundDialogPresenter ignores a caller-supplied owner-window override', () => {
  const { api } = createDialog();
  const presenter = createForegroundDialogPresenter({
    app: { focus() {} },
    dialog: api,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => false,
    BrowserWindowClass: FakeBrowserWindow,
  });
  assert.equal(presenter.getDialogParentWindow(), null);
  assert.equal(presenter.destroyOwnerWindow(), undefined);
});
