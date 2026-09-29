import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createModelMenuPreferenceStore,
  MODEL_MENU_PREFERENCE_CHANGED_EVENT,
  MODEL_MENU_PREFERENCE_STORAGE_KEY,
} from './modelMenuPreferenceStore.js';

function createWindow(initialValue = null) {
  const storage = new Map();
  if (initialValue !== null) storage.set(MODEL_MENU_PREFERENCE_STORAGE_KEY, initialValue);
  const events = [];
  class CustomEvent {
    constructor(type) {
      this.type = type;
    }
  }
  return {
    events,
    storage,
    CustomEvent,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };
}

test('modelMenuPreferenceStore: initializes per version and persists preference changes', () => {
  const currentWindow = createWindow();
  const store = createModelMenuPreferenceStore({ getWindow: () => currentWindow });
  const updates = [];
  store.subscribe((state) => updates.push(state));

  assert.deepEqual(store.getState(), { version: '', hideUnconfigured: false });
  assert.deepEqual(store.setHideUnconfigured(true), { version: '', hideUnconfigured: false });

  const initialized = store.initialize('v0.7.16');
  assert.deepEqual(initialized, { version: '0.7.16', hideUnconfigured: false });
  assert.equal(store.initialize('0.7.16'), initialized);

  const changed = store.setHideUnconfigured(true);
  assert.deepEqual(changed, { version: '0.7.16', hideUnconfigured: true });
  assert.deepEqual(updates.at(-1), changed);
  assert.equal(currentWindow.storage.get(MODEL_MENU_PREFERENCE_STORAGE_KEY), JSON.stringify(changed));
  assert.equal(currentWindow.events.at(-1).type, MODEL_MENU_PREFERENCE_CHANGED_EVENT);
  assert.equal(store.setHideUnconfigured(true), changed);
  assert.deepEqual(store.setHideUnconfigured('true'), {
    version: '0.7.16',
    hideUnconfigured: false,
  });
});

test('modelMenuPreferenceStore: restores the stored preference for the same version', () => {
  const currentWindow = createWindow(JSON.stringify({ version: '0.7.16', hideUnconfigured: true }));
  const store = createModelMenuPreferenceStore({ getWindow: () => currentWindow });

  assert.deepEqual(store.initialize('v0.7.16'), {
    version: '0.7.16',
    hideUnconfigured: true,
  });
  assert.deepEqual(store.initialize('0.7.17'), {
    version: '0.7.17',
    hideUnconfigured: false,
  });
});

test('modelMenuPreferenceStore: storage failures do not block updates or event dispatch', () => {
  const currentWindow = createWindow();
  currentWindow.localStorage.setItem = () => {
    throw new Error('quota');
  };
  currentWindow.localStorage.getItem = () => {
    throw new Error('blocked');
  };
  const store = createModelMenuPreferenceStore({ getWindow: () => currentWindow });

  assert.deepEqual(store.initialize('v1'), { version: '1', hideUnconfigured: false });
  assert.deepEqual(store.setHideUnconfigured(true), { version: '1', hideUnconfigured: true });
});
