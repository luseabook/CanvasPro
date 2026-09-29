import test from 'node:test';
import assert from 'node:assert/strict';

import { createRhAiAppConfigRepository } from './rhAiAppConfigRepository.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

function createWindow() {
  const calls = { timeouts: [], cleared: [] };
  let nextId = 0;
  const callbacks = new Map();
  return {
    calls,
    callbacks,
    setTimeout(callback, delay) {
      const id = ++nextId;
      calls.timeouts.push({ id, delay });
      callbacks.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      calls.cleared.push(id);
      callbacks.delete(id);
    },
  };
}

test('rhAiAppConfigRepository: loads and normalizes local seed data', () => {
  const storage = createStorage({
    'aiCanvas.runningHubAiApp.savedApps.v1': JSON.stringify([
      {
        id: 'app-1',
        sourceType: 'runninghub-ai-app',
        kind: 'video',
        name: '  示例应用  ',
        input: '  https://www.runninghub.cn/app/123  ',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      { id: '', input: '' },
    ]),
    'aiCanvas.runningHubAiApp.panelDraft.v1': JSON.stringify({
      sourceType: 'runninghub-ai-app',
      kind: 'video',
      kindStates: {
        'runninghub-ai-app:video': {
          sourceType: 'runninghub-ai-app',
          input: 'draft-input',
          appName: '',
          appDescription: '  description  ',
        },
      },
    }),
  });
  const repository = createRhAiAppConfigRepository({
    storage,
    externalBridge: { isAvailable: () => false },
    windowObject: {},
  });

  const seed = repository.loadLocalSeed();
  assert.equal(seed.hasData, true);
  assert.equal(seed.savedApps.length, 1);
  assert.equal(seed.savedApps[0].name, '示例应用');
  assert.equal(seed.savedApps[0].input, '  https://www.runninghub.cn/app/123  ');
  assert.equal(seed.panelDraft.kind, 'video');
  assert.equal(seed.panelDraft.kindStates['runninghub-ai-app:video'].appName, '未命名 AI应用');
  assert.equal(seed.panelDraft.kindStates['runninghub-ai-app:video'].appDescription, 'description');
});

test('rhAiAppConfigRepository: builds stable saved-app records and exposes empty state factories', () => {
  const repository = createRhAiAppConfigRepository({
    storage: createStorage(),
    externalBridge: { isAvailable: () => false },
    windowObject: {},
  });

  const record = repository.buildSavedAppRecord(
    {
      sourceType: 'runninghub-ai-app',
      kind: 'audio',
      name: '  ',
      input: 'https://www.runninghub.cn/app/42',
      componentDrafts: [{ id: 'field', value: 'x' }],
    },
    {
      id: 'existing-id',
      createdAt: '2026-02-01T00:00:00.000Z',
    },
  );
  assert.equal(record.id, 'existing-id');
  assert.equal(record.name, '未命名 AI应用');
  assert.equal(record.kind, 'audio');
  assert.equal(record.createdAt, '2026-02-01T00:00:00.000Z');
  assert.match(record.updatedAt, /^\d{4}-\d{2}-\d{2}T/);

  const empty = repository.createEmptyKindState();
  assert.equal(empty.appName, '未命名 AI应用');
  assert.deepEqual(empty.componentDrafts, []);
  assert.equal(repository.getKindStateKey('comfyui-local-workflow', 'video'), 'comfyui-workflow:video');
  assert.equal(
    repository.getLegacyKindStateKey('comfyui-local-workflow', 'video'),
    'comfyui-local-workflow:video',
  );
});

test('rhAiAppConfigRepository: hydrates from the external bridge and schedules persistence', async () => {
  const storage = createStorage();
  const windowObject = createWindow();
  const writes = [];
  const snapshots = [];
  const bridge = {
    isAvailable: () => true,
    async read() {
      return {
        ok: true,
        hasData: true,
        storageRoot: 'C:\\custom-ai-apps',
        savedApps: [
          {
            id: 'remote-1',
            sourceType: 'runninghub-ai-app',
            kind: 'image',
            name: 'Remote App',
            input: 'https://www.runninghub.cn/app/remote',
          },
        ],
        panelDraft: {
          sourceType: 'runninghub-ai-app',
          kind: 'image',
          kindStates: {
            image: {
              sourceType: 'runninghub-ai-app',
              input: 'draft',
              appName: 'Draft',
            },
          },
        },
      };
    },
    async write(payload) {
      writes.push(payload);
      return { ok: true };
    },
  };
  const repository = createRhAiAppConfigRepository({
    storage,
    externalBridge: bridge,
    windowObject,
    getSnapshot: () => ({
      savedApps: [
        {
          id: 'local-1',
          sourceType: 'runninghub-ai-app',
          kind: 'image',
          name: 'Local App',
          input: 'https://www.runninghub.cn/app/local',
        },
      ],
      sourceType: 'runninghub-ai-app',
      kind: 'image',
      kindStates: {
        image: {
          sourceType: 'runninghub-ai-app',
          input: 'local draft',
          appName: 'Local Draft',
        },
      },
    }),
    applyExternalSnapshot(snapshot) {
      snapshots.push(snapshot);
    },
  });

  const hydrated = await repository.hydrateExternalStorage();
  assert.equal(hydrated.storageRoot, 'C:\\custom-ai-apps');
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].savedApps[0].id, 'remote-1');

  repository.saveSavedApps([{ id: 'x', input: 'https://example.com' }]);
  assert.equal(windowObject.calls.timeouts.length, 1);
  assert.equal(windowObject.calls.timeouts[0].delay, 250);

  const result = await repository.flushExternalPersist();
  assert.equal(result.ok, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].savedApps[0].id, 'local-1');
  assert.equal(writes[0].savedApps[0].name, 'Local App');
  assert.equal(writes[0].panelDraft.sourceType, 'runninghub-ai-app');

  repository.savePanelDraft({ sourceType: 'runninghub-ai-app', kind: 'image', kindStates: {} });
  repository.dispose();
  assert.ok(windowObject.calls.cleared.includes(2));
});

test('rhAiAppConfigRepository: reports malformed local storage without throwing', () => {
  const warnings = [];
  const repository = createRhAiAppConfigRepository({
    storage: createStorage({
      'aiCanvas.runningHubAiApp.savedApps.v1': '{bad json',
      'aiCanvas.runningHubAiApp.panelDraft.v1': '{bad json',
    }),
    externalBridge: { isAvailable: () => false },
    windowObject: {},
    onWarning(...args) {
      warnings.push(args);
    },
  });

  const seed = repository.loadLocalSeed();
  assert.equal(seed.panelDraft, null);
  assert.deepEqual(seed.savedApps, []);
  assert.equal(seed.hasData, false);
  assert.equal(warnings.length, 2);
});
