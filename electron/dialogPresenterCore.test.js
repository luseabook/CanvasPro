import assert from 'node:assert/strict';
import test from 'node:test';
import { createForegroundDialogPresenterCore } from './dialogPresenterCore.js';

class FakeBrowserWindow {
  constructor(options) {
    this.options = options;
    this.destroyed = false;
    this.actions = [];
    this.handlers = {};
  }
  on(event, handler) {
    this.handlers[event] = handler;
    return this;
  }
  isDestroyed() {
    return this.destroyed;
  }
  isMinimized() {
    return this.minimized === true;
  }
  setOpacity(value) {
    this.actions.push(['setOpacity', value]);
  }
  setBounds(bounds) {
    this.actions.push(['setBounds', bounds]);
  }
  setAlwaysOnTop(value, level) {
    this.actions.push(['setAlwaysOnTop', value, level]);
  }
  show() {
    this.actions.push(['show']);
  }
  hide() {
    this.actions.push(['hide']);
  }
  focus() {
    this.actions.push(['focus']);
  }
  moveTop() {
    this.actions.push(['moveTop']);
  }
  destroy() {
    this.destroyed = true;
    this.actions.push(['destroy']);
  }
}

function createScreen(overrides = {}) {
  const calls = { cursor: 0, nearest: [] };
  const api = {
    getCursorScreenPoint() {
      calls.cursor += 1;
      if (overrides.cursorThrows) throw new Error('cursor unavailable');
      return overrides.cursor || { x: 10, y: 20 };
    },
    getDisplayNearestPoint(point) {
      calls.nearest.push(point);
      if (overrides.displayThrows) throw new Error('display unavailable');
      if (overrides.display === null) return null;
      return overrides.display || { workArea: { x: 0, y: 0, width: 1920, height: 1040 } };
    },
  };
  return { calls, api };
}

function createDeps(overrides = {}) {
  const calls = { focus: [], dialogs: [], windows: [] };
  const app = {
    focus(options) {
      calls.focus.push(options);
      if (overrides.focusThrows === 'steal' && options) throw new Error('steal unsupported');
      if (overrides.focusThrows === 'always') throw new Error('focus unavailable');
    },
  };
  const dialog = {
    async showOpenDialog(...args) {
      calls.dialogs.push(['showOpenDialog', ...args]);
      return { canceled: false, filePaths: ['/picked'] };
    },
    async showSaveDialog(...args) {
      calls.dialogs.push(['showSaveDialog', ...args]);
      return { canceled: false, filePath: '/picked.zip' };
    },
  };
  class TrackingWindow extends FakeBrowserWindow {
    constructor(options) {
      super(options);
      calls.windows.push(this);
    }
  }
  return { calls, app, dialog, BrowserWindowClass: TrackingWindow, screen: createScreen(overrides.screen) };
}

test('createForegroundDialogPresenterCore defaults to an inert presenter', async () => {
  const presenter = createForegroundDialogPresenterCore();
  assert.deepEqual(Object.keys(presenter), [
    'destroyOwnerWindow',
    'getDialogParentWindow',
    'showOpenDialog',
    'showSaveDialog',
  ]);
  assert.equal(presenter.getDialogParentWindow(), null);
  assert.equal(presenter.destroyOwnerWindow(), undefined);
});

test('getDialogParentWindow prefers a usable main window and never builds an owner window', () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps();
  const mainWindow = new FakeBrowserWindow();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  assert.equal(presenter.getDialogParentWindow(), mainWindow);
  assert.equal(calls.windows.length, 0);
});

test('getDialogParentWindow skips a destroyed main window', () => {
  const { app, dialog, BrowserWindowClass, screen } = createDeps();
  const mainWindow = new FakeBrowserWindow();
  mainWindow.destroyed = true;
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => false,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  assert.equal(presenter.getDialogParentWindow(), null);
});

test('creates and reuses an offscreen owner window at the work-area corner', () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  const owner = presenter.getDialogParentWindow();
  assert.equal(calls.windows.length, 1);
  assert.deepEqual(owner.options, {
    x: 1918,
    y: 1038,
    width: 1,
    height: 1,
    show: false,
    frame: false,
    transparent: true,
    opacity: 0,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  assert.deepEqual(owner.actions, [['setOpacity', 0]]);
  assert.deepEqual(screen.calls.nearest, [{ x: 10, y: 20 }]);
  assert.equal(presenter.getDialogParentWindow(), owner);
  assert.equal(calls.windows.length, 1);
});

test('falls back to an offscreen-invisible origin when the screen API fails', () => {
  const { app, dialog, BrowserWindowClass, screen } = createDeps({ screen: { displayThrows: true } });
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  const owner = presenter.getDialogParentWindow();
  assert.deepEqual(
    { x: owner.options.x, y: owner.options.y, width: owner.options.width, height: owner.options.height },
    { x: -32000, y: -32000, width: 1, height: 1 },
  );
});

test('uses bounds when the nearest display has no work area', () => {
  const screen = createScreen({ display: { bounds: { x: 10, y: 20, width: 100, height: 50 } } });
  const { app, dialog, BrowserWindowClass } = createDeps();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  const owner = presenter.getDialogParentWindow();
  assert.equal(owner.options.x, 108);
  assert.equal(owner.options.y, 0x44);
});

test('an unusable cursor point still yields the offscreen origin', () => {
  const screen = createScreen({ cursorThrows: true });
  const { app, dialog, BrowserWindowClass } = createDeps();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  assert.equal(presenter.getDialogParentWindow().options.x, -32000);
});

test('showOpenDialog hands the main window to the dialog API and raises it', async () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps();
  const mainWindow = new FakeBrowserWindow();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => false,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  const result = await presenter.showOpenDialog({ title: '打开项目' });
  assert.deepEqual(result, { canceled: false, filePaths: ['/picked'] });
  assert.deepEqual(calls.dialogs, [['showOpenDialog', mainWindow, { title: '打开项目' }]]);
  assert.deepEqual(calls.focus, [{ steal: true }]);
  assert.deepEqual(
    mainWindow.actions,
    ['show', 'focus', 'moveTop'].map((name) => [name]),
  );
  assert.equal(calls.windows.length, 0);
});

test('showSaveDialog without any window calls the dialog API with options only', async () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => false,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  const result = await presenter.showSaveDialog({ title: '另存为项目' });
  assert.deepEqual(result, { canceled: false, filePath: '/picked.zip' });
  assert.deepEqual(calls.dialogs, [['showSaveDialog', { title: '另存为项目' }]]);
  assert.deepEqual(calls.focus, []);
});

test('restores a minimized main window before showing a dialog', async () => {
  const { app, dialog, BrowserWindowClass, screen } = createDeps();
  const mainWindow = new FakeBrowserWindow();
  mainWindow.minimized = true;
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => false,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  await presenter.showSaveDialog({ title: 'x' });
  assert.deepEqual(mainWindow.actions, [['show'], ['focus'], ['moveTop']]);
});

test('offscreen owner is shown for the dialog and hidden afterwards without being destroyed', async () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  await presenter.showOpenDialog({ title: '打开项目' });
  const owner = calls.windows[0];
  assert.deepEqual(owner.actions, [
    ['setOpacity', 0],
    ['setBounds', { x: 1918, y: 1038, width: 1, height: 1 }],
    ['setOpacity', 0],
    ['setAlwaysOnTop', true, 'screen-saver'],
    ['show'],
    ['focus'],
    ['moveTop'],
    ['hide'],
  ]);
  assert.deepEqual(calls.dialogs, [['showOpenDialog', owner, { title: '打开项目' }]]);
  assert.equal(owner.destroyed, false);
});

test('the offscreen owner is hidden even when the dialog throws', async () => {
  const { calls, app, BrowserWindowClass, screen } = createDeps();
  const dialog = {
    async showOpenDialog() {
      throw new Error('dialog failed');
    },
  };
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  await assert.rejects(() => presenter.showOpenDialog({}), /dialog failed/);
  assert.equal(calls.windows[0].actions.at(-1)[0], 'hide');
});

test('focus failures are swallowed and the older focus signature is retried', async () => {
  const { app, dialog, BrowserWindowClass, screen } = createDeps({ focusThrows: 'steal' });
  const mainWindow = new FakeBrowserWindow();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => false,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  await presenter.showOpenDialog({});
  assert.equal(
    mainWindow.actions.some(([name]) => name === 'focus'),
    true,
  );
});

test('a window whose focus and show throw is tolerated', async () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps({ focusThrows: 'always' });
  const mainWindow = new FakeBrowserWindow();
  mainWindow.show = () => {
    throw new Error('cannot show');
  };
  mainWindow.focus = () => {
    throw new Error('cannot focus');
  };
  mainWindow.moveTop = () => {
    throw new Error('cannot moveTop');
  };
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => false,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  await presenter.showOpenDialog({});
  assert.equal(calls.dialogs.length, 1);
});

test('destroyOwnerWindow destroys a live owner window once and forgets it', () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  const owner = presenter.getDialogParentWindow();
  presenter.destroyOwnerWindow();
  assert.equal(owner.destroyed, true);
  assert.deepEqual(owner.actions.at(-1), ['destroy']);
  const rebuilt = presenter.getDialogParentWindow();
  assert.notEqual(rebuilt, owner);
  assert.equal(calls.windows.length, 2);
});

test('a closed owner window is dropped and rebuilt on demand', () => {
  const { calls, app, dialog, BrowserWindowClass, screen } = createDeps();
  const presenter = createForegroundDialogPresenterCore({
    app: app,
    dialog: dialog,
    getMainWindow: () => null,
    shouldUseOwnerWindow: () => true,
    BrowserWindowClass: BrowserWindowClass,
    screenApi: screen.api,
  });
  const owner = presenter.getDialogParentWindow();
  owner.handlers.closed();
  const rebuilt = presenter.getDialogParentWindow();
  assert.notEqual(rebuilt, owner);
  assert.equal(calls.windows.length, 2);
});
