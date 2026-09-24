import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createBailianAsrConfigResolver } from './bailianAsrConfig.js';

function makeRoot(t, config) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'bailian-asr-config-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  if (config !== undefined) writeFileSync(path.join(root, 'config.json'), JSON.stringify(config));
  return root;
}

test('the secure settings store outranks config.json', (t) => {
  const userRoot = makeRoot(t, { providers: { bailian: { apiKey: 'stored', apiUrl: 'https://stored.invalid' } } });
  const resolve = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({
      getMany: () => ({ 'apiConfig.providers.bailian.apiKey': 'secure-key' }),
    }),
    getUserRoot: () => userRoot,
  });
  assert.deepEqual(resolve(), { apiKey: 'secure-key', baseUrl: 'https://stored.invalid' });
});

test('config.json supplies the key when the store has none', (t) => {
  const userRoot = makeRoot(t, { providers: { bailian: { apiKey: 'stored-key' } } });
  const resolve = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({ getMany: () => ({}) }),
    getUserRoot: () => userRoot,
  });
  assert.deepEqual(resolve(), { apiKey: 'stored-key', baseUrl: '' });
});

test('a whitespace-only secure value masks the stored key after trimming', (t) => {
  const userRoot = makeRoot(t, { providers: { bailian: { apiKey: 'padded', apiUrl: '  https://x.invalid  ' } } });
  const resolve = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({ getMany: () => ({ 'apiConfig.providers.bailian.apiKey': '  ' }) }),
    getUserRoot: () => userRoot,
  });
  assert.deepEqual(resolve(), { apiKey: '', baseUrl: 'https://x.invalid' });
});

test('a missing config.json, malformed JSON or missing bailian section yields empty strings', (t) => {
  const missing = makeRoot(t);
  const resolveMissing = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => missing,
  });
  assert.deepEqual(resolveMissing(), { apiKey: '', baseUrl: '' });

  const broken = mkdtempSync(path.join(os.tmpdir(), 'bailian-asr-config-'));
  t.after(() => rmSync(broken, { recursive: true, force: true }));
  writeFileSync(path.join(broken, 'config.json'), 'not json at all');
  const resolveBroken = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => broken,
  });
  assert.deepEqual(resolveBroken(), { apiKey: '', baseUrl: '' });

  const other = makeRoot(t, { providers: { volcengine: { apiKey: 'other' } } });
  const resolveOther = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => other,
  });
  assert.deepEqual(resolveOther(), { apiKey: '', baseUrl: '' });
});

test('a throwing or incomplete secure store still resolves from config.json', (t) => {
  const userRoot = makeRoot(t, { providers: { bailian: { apiKey: 'stored-key' } } });
  const throwingStore = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({
      getMany: () => {
        throw new Error('store unavailable');
      },
    }),
    getUserRoot: () => userRoot,
  });
  assert.equal(throwingStore().apiKey, 'stored-key');

  const throwingFactory = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => {
      throw new Error('store unavailable');
    },
    getUserRoot: () => userRoot,
  });
  assert.equal(throwingFactory().apiKey, 'stored-key');

  const noStore = createBailianAsrConfigResolver({
    getSecureSettingsStore: undefined,
    getUserRoot: () => userRoot,
  });
  assert.equal(noStore().apiKey, 'stored-key');
});

test('an empty secure value does not mask the config value', (t) => {
  const userRoot = makeRoot(t, { providers: { bailian: { apiKey: 'stored-key' } } });
  const resolve = createBailianAsrConfigResolver({
    getSecureSettingsStore: () => ({ getMany: () => ({ 'apiConfig.providers.bailian.apiKey': '' }) }),
    getUserRoot: () => userRoot,
  });
  assert.equal(resolve().apiKey, 'stored-key');
});
