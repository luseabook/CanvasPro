import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotificationShortcutController } from './notificationShortcutController.js';

function createStubShortcutApi(registerResult = true) {
  const calls = [];
  return {
    calls: calls,
    register: (accelerator, callback) => {
      calls.push(['register', accelerator, typeof callback]);
      return registerResult;
    },
    unregister: (accelerator) => {
      calls.push(['unregister', accelerator]);
    },
  };
}

test('updateGlobalShortcut defaults to Alt+E and registers the normalized accelerator', () => {
  const api = createStubShortcutApi(),
    controller = createNotificationShortcutController({ globalShortcutApi: api, activate: () => {} });
  assert.deepEqual(controller.updateGlobalShortcut(), { success: true, accelerator: 'Alt+E' });
  assert.deepEqual(api.calls, [['register', 'Alt+E', 'function']]);
});

test('updateGlobalShortcut registers once and unregisters the previous accelerator on change', () => {
  const api = createStubShortcutApi(),
    controller = createNotificationShortcutController({ globalShortcutApi: api, activate: () => {} });
  controller.updateGlobalShortcut({ keys: ['Alt', 'E'] });
  assert.deepEqual(controller.updateGlobalShortcut({ keys: ['alt', 'e'] }), {
    success: true,
    accelerator: 'Alt+E',
  });
  assert.equal(api.calls.length, 1);
  assert.deepEqual(controller.updateGlobalShortcut({ keys: ['ctrl', 'shift', 'k'] }), {
    success: true,
    accelerator: 'CommandOrControl+Shift+K',
  });
  assert.deepEqual(api.calls, [
    ['register', 'Alt+E', 'function'],
    ['unregister', 'Alt+E'],
    ['register', 'CommandOrControl+Shift+K', 'function'],
  ]);
});

test('updateGlobalShortcut clears the registration when keys are empty', () => {
  const api = createStubShortcutApi(),
    controller = createNotificationShortcutController({ globalShortcutApi: api, activate: () => {} });
  controller.updateGlobalShortcut({ keys: ['Alt', 'E'] });
  assert.deepEqual(controller.updateGlobalShortcut({ keys: [] }), { success: true, accelerator: '' });
  assert.deepEqual(api.calls, [['register', 'Alt+E', 'function'], ['unregister', 'Alt+E']]);
  assert.deepEqual(controller.updateGlobalShortcut({ keys: [] }), { success: true, accelerator: '' });
  assert.equal(api.calls.length, 2);
});

test('updateGlobalShortcut rejects invalid shortcuts without touching the registration', () => {
  const api = createStubShortcutApi(),
    controller = createNotificationShortcutController({ globalShortcutApi: api, activate: () => {} });
  assert.deepEqual(controller.updateGlobalShortcut({ keys: ['ctrl'] }), {
    success: false,
    reason: 'invalid-shortcut',
  });
  assert.deepEqual(controller.updateGlobalShortcut({ keys: 'alt+e' }), {
    success: false,
    reason: 'invalid-shortcut',
  });
  assert.equal(api.calls.length, 0);
});

test('updateGlobalShortcut reports shortcut-unavailable when register fails or throws', () => {
  const failing = createStubShortcutApi(false),
    failingController = createNotificationShortcutController({
      globalShortcutApi: failing,
      activate: () => {},
    });
  assert.deepEqual(failingController.updateGlobalShortcut({ keys: ['Alt', 'E'] }), {
    success: false,
    accelerator: 'Alt+E',
    reason: 'shortcut-unavailable',
  });
  const throwing = {
      register: () => {
        throw new Error('boom');
      },
      unregister: () => {},
    },
    throwingController = createNotificationShortcutController({
      globalShortcutApi: throwing,
      activate: () => {},
    });
  assert.deepEqual(throwingController.updateGlobalShortcut({ keys: ['Alt', 'E'] }), {
    success: false,
    accelerator: 'Alt+E',
    reason: 'shortcut-unavailable',
  });
  assert.deepEqual(throwingController.updateGlobalShortcut({ keys: ['Alt', 'E'] }), {
    success: false,
    accelerator: 'Alt+E',
    reason: 'shortcut-unavailable',
  });
});

test('dispose unregisters the current accelerator and is idempotent', () => {
  const api = createStubShortcutApi(),
    controller = createNotificationShortcutController({ globalShortcutApi: api, activate: () => {} });
  controller.updateGlobalShortcut({ keys: ['Alt', 'E'] });
  controller.dispose();
  controller.dispose();
  assert.deepEqual(api.calls, [['register', 'Alt+E', 'function'], ['unregister', 'Alt+E']]);
});
