import test from 'node:test';
import assert from 'node:assert/strict';

import { bindRunningHubInstanceDevMode } from './runningHubInstanceDevModeBinding.js';

function createWindowLike() {
  const listeners = new Map();
  return {
    DEV_MODE: true,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    emit(type, detail) {
      listeners.get(type)?.({ type, detail });
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

test('bindRunningHubInstanceDevMode: exposes developer values while dev mode is enabled', () => {
  const windowLike = createWindowLike();
  const toggles = [
    {
      dataset: {
        uiSchemaDeveloperValues: '["dev-1","dev-2"]',
        uiSchemaField: 'model',
        uiSchemaNormalDefault: 'default-model',
      },
    },
    { dataset: { uiSchemaDeveloperValues: 'invalid-json' } },
  ];
  const root = { querySelectorAll: () => toggles, ownerDocument: { defaultView: windowLike } };
  const commits = [];

  const dispose = bindRunningHubInstanceDevMode(root, {
    commitValue: (field, value) => commits.push([field, value]),
    getNodeData: () => ({ model: 'dev-1' }),
    getNodeFieldValue: (nodeData, field) => nodeData[field],
  });

  assert.equal(toggles[0].dataset.uiSchemaDeveloperMode, 'true');
  assert.equal(toggles[1].dataset.uiSchemaDeveloperMode, 'false');
  assert.deepEqual(commits, []);

  windowLike.emit('dev-mode-changed', { enabled: false });
  assert.equal(toggles[0].dataset.uiSchemaDeveloperMode, 'false');
  assert.deepEqual(commits, [['model', 'default-model']]);

  dispose();
  assert.equal(windowLike.listenerCount, 0);
});

test('bindRunningHubInstanceDevMode: ignores invalid developer values when committing', () => {
  const windowLike = createWindowLike();
  const toggle = {
    dataset: {
      uiSchemaDeveloperValues: '{bad',
      uiSchemaField: 'model',
      uiSchemaNormalDefault: 'default-model',
    },
  };
  const root = { querySelectorAll: () => [toggle], ownerDocument: { defaultView: windowLike } };
  const commits = [];

  bindRunningHubInstanceDevMode(root, {
    commitValue: (...args) => commits.push(args),
    getNodeData: () => ({ model: 'dev-1' }),
    getNodeFieldValue: (nodeData, field) => nodeData[field],
  });
  windowLike.emit('dev-mode-changed', { enabled: false });

  assert.equal(toggle.dataset.uiSchemaDeveloperMode, 'false');
  assert.deepEqual(commits, []);
});
