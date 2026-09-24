import test from 'node:test';
import assert from 'node:assert/strict';
import { installDevReloadShortcuts, isPackagedBrowserShortcut } from './devReloadShortcuts.js';

function makeWindow() {
  const state = { handlers: [], reloads: 0, hardReloads: 0 };
  return {
    state: state,
    webContents: {
      on: (eventName, handler) => state.handlers.push([eventName, handler]),
      reload: () => (state.reloads += 1),
      reloadIgnoringCache: () => (state.hardReloads += 1),
    },
  };
}

function dispatch(window, input) {
  const event = {
    prevented: 0,
    preventDefault() {
      this.prevented += 1;
    },
  };
  for (const [name, handler] of window.state.handlers) {
    assert.equal(name, 'before-input-event');
    handler(event, input);
  }
  return event;
}

test('isPackagedBrowserShortcut accepts F5 and F12', () => {
  assert.equal(isPackagedBrowserShortcut({ key: 'F5' }), true);
  assert.equal(isPackagedBrowserShortcut({ key: 'f12' }), true);
});

test('isPackagedBrowserShortcut accepts refresh chords', () => {
  assert.equal(isPackagedBrowserShortcut({ key: 'r', control: true }), true);
  assert.equal(isPackagedBrowserShortcut({ key: 'R', meta: true }), true);
  assert.equal(isPackagedBrowserShortcut({ key: 'r' }), false);
});

test('isPackagedBrowserShortcut accepts devtools chords', () => {
  assert.equal(isPackagedBrowserShortcut({ key: 'c', control: true, shift: true }), true);
  assert.equal(isPackagedBrowserShortcut({ key: 'i', control: true, shift: true }), true);
  assert.equal(isPackagedBrowserShortcut({ key: 'j', meta: true, alt: true }), true);
});

test('isPackagedBrowserShortcut rejects unrelated keys', () => {
  assert.equal(isPackagedBrowserShortcut({ key: 'a' }), false);
  assert.equal(isPackagedBrowserShortcut({ key: 'c', control: true }), false);
  assert.equal(isPackagedBrowserShortcut({ key: 'i', control: true, alt: true }), false);
  assert.equal(isPackagedBrowserShortcut(null), false);
  assert.equal(isPackagedBrowserShortcut({}), false);
});

test('normalizeInputKey falls back to the physical code', () => {
  assert.equal(isPackagedBrowserShortcut({ code: 'KeyR', control: true }), true);
  assert.equal(isPackagedBrowserShortcut({ code: 'F5' }), true);
});

test('installDevReloadShortcuts ignores a missing window', () => {
  assert.equal(installDevReloadShortcuts({ app: { isPackaged: false }, window: null }), undefined);
});

test('installDevReloadShortcuts reloads in development', () => {
  const window = makeWindow();
  installDevReloadShortcuts({ app: { isPackaged: false }, window: window });
  assert.equal(window.state.handlers.length, 1);
  const event = dispatch(window, { type: 'keyDown', key: 'F5' });
  assert.equal(event.prevented, 1);
  assert.equal(window.state.reloads, 1);
  assert.equal(window.state.hardReloads, 0);
});

test('installDevReloadShortcuts hard reloads with shift in development', () => {
  const window = makeWindow();
  installDevReloadShortcuts({ app: { isPackaged: false }, window: window });
  const event = dispatch(window, { type: 'keyDown', key: 'r', control: true, shift: true });
  assert.equal(event.prevented, 1);
  assert.equal(window.state.reloads, 0);
  assert.equal(window.state.hardReloads, 1);
});

test('installDevReloadShortcuts ignores non keyDown input', () => {
  const window = makeWindow();
  installDevReloadShortcuts({ app: { isPackaged: false }, window: window });
  const event = dispatch(window, { type: 'keyUp', key: 'F5' });
  assert.equal(event.prevented, 0);
  assert.equal(window.state.reloads, 0);
});

test('installDevReloadShortcuts blocks refresh keys when packaged', () => {
  const window = makeWindow();
  installDevReloadShortcuts({ app: { isPackaged: true }, window: window });
  const event = dispatch(window, { type: 'keyDown', key: 'F5' });
  assert.equal(event.prevented, 1);
  assert.equal(window.state.reloads, 0);
  assert.equal(window.state.hardReloads, 0);
});

test('installDevReloadShortcuts leaves F12 to the browser when packaged', () => {
  const window = makeWindow();
  installDevReloadShortcuts({ app: { isPackaged: true }, window: window });
  const event = dispatch(window, { type: 'keyDown', key: 'F12' });
  assert.equal(event.prevented, 0);
  assert.equal(window.state.reloads, 0);
});
