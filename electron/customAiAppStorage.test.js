import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  CUSTOM_AI_APP_STORAGE_DIRNAME,
  CUSTOM_AI_APP_STORAGE_VERSION,
  createCustomAiAppStorage,
} from './customAiAppStorage.js';

function withTempDir(run) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'custom-ai-apps-'));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('reads an empty library without creating files', () => {
  withTempDir((dataDir) => {
    const storage = createCustomAiAppStorage({ getDataDir: () => dataDir });
    const result = storage.read();
    assert.equal(result.ok, true);
    assert.equal(result.version, CUSTOM_AI_APP_STORAGE_VERSION);
    assert.equal(result.hasData, false);
    assert.deepEqual(result.savedApps, []);
    assert.deepEqual(result.panelDraft, { sourceType: '', kind: 'image', kindStates: {} });
    assert.equal(result.storageRoot, path.join(path.resolve(dataDir), CUSTOM_AI_APP_STORAGE_DIRNAME));
  });
});

test('writes split per source type and canonicalises bare kind keys to runninghub on read', () => {
  withTempDir((dataDir) => {
    const storage = createCustomAiAppStorage({ getDataDir: () => dataDir });
    const written = storage.write({
      savedApps: [
        { id: 'a', sourceType: 'runninghub-ai-app' },
        { id: 'b', sourceType: 'comfyui-cloud-workflow' },
        { id: 'c' },
      ],
      panelDraft: {
        sourceType: 'comfyui-local-workflow',
        kind: 'video',
        kindStates: { 'image': { prompt: 'x' }, 'comfyui-cloud-workflow:video': { prompt: 'y' } },
      },
    });
    assert.equal(written.ok, true);
    const runninghubFile = path.join(
      written.storageRoot,
      'runninghub-ai-app',
      'saved-apps.json',
    );
    const stored = JSON.parse(readFileSync(runninghubFile, 'utf8'));
    assert.equal(stored.version, CUSTOM_AI_APP_STORAGE_VERSION);
    assert.deepEqual(
      stored.items.map((item) => item.id),
      ['a', 'c'],
    );
    assert.equal(stored.items[1].sourceType, 'runninghub-ai-app');

    const read = storage.read();
    assert.equal(read.hasData, true);
    assert.deepEqual(
      read.savedApps.map((item) => item.id).sort(),
      ['a', 'b', 'c'],
    );
    assert.equal(read.panelDraft.sourceType, 'comfyui-local-workflow');
    assert.equal(read.panelDraft.kind, 'video');
    assert.deepEqual(read.panelDraft.kindStates['runninghub-ai-app:image'], { prompt: 'x' });
    assert.deepEqual(read.panelDraft.kindStates['comfyui-cloud-workflow:video'], { prompt: 'y' });
  });
});

test('rejects unknown source types and kinds instead of extending the schema', () => {
  withTempDir((dataDir) => {
    const storage = createCustomAiAppStorage({ getDataDir: () => dataDir });
    storage.write({
      savedApps: [{ id: 'x', sourceType: 'evil-source' }],
      panelDraft: { sourceType: 'evil-source', kind: 'neural', kindStates: { 'evil-source': {} } },
    });
    const read = storage.read();
    assert.deepEqual(
      read.savedApps.map((item) => item.sourceType),
      ['runninghub-ai-app'],
    );
    assert.equal(read.panelDraft.sourceType, '');
    assert.equal(read.panelDraft.kind, 'image');
  });
});

test('a corrupt storage file degrades to an empty library instead of throwing', () => {
  withTempDir((dataDir) => {
    const root = path.join(path.resolve(dataDir), CUSTOM_AI_APP_STORAGE_DIRNAME);
    mkdirSync(path.join(root, 'runninghub-ai-app'), { recursive: true });
    writeFileSync(path.join(root, 'runninghub-ai-app', 'saved-apps.json'), '{ not json', 'utf8');
    const storage = createCustomAiAppStorage({ getDataDir: () => dataDir });
    const read = storage.read();
    assert.equal(read.ok, true);
    assert.deepEqual(read.savedApps, []);
  });
});

test('a missing data directory is a hard error, not a silent empty library', () => {
  const storage = createCustomAiAppStorage({ getDataDir: () => '' });
  assert.throws(() => storage.read(), /data directory is unavailable/);
  assert.throws(() => storage.write({}), /data directory is unavailable/);
});
