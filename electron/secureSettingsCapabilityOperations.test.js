import test from 'node:test';
import assert from 'node:assert/strict';
import { createSecureSettingsCapabilityOperations } from './secureSettingsCapabilityOperations.js';

const API_KEY = 'apiConfig.providers.openai.apiKey';
const normalizeKeys = (payload) =>
  Array.isArray(payload?.keys) ? payload.keys : payload?.key ? [payload.key] : [];

function createStore({ available = true, values = {} } = {}) {
  const writes = [];
  return {
    writes,
    isAvailable: () => available,
    getMany: (keys) => Object.fromEntries(keys.filter((key) => key in values).map((key) => [key, values[key]])),
    set: (key, value) => writes.push(['set', key, value]),
    delete: (key) => writes.push(['delete', key]),
  };
}

test('get returns stored values only when the store is available', () => {
  const store = createStore({ values: { [API_KEY]: 'secret' } });
  const operations = createSecureSettingsCapabilityOperations({
    getSecureSettingsStore: () => store,
    normalizeSecureSettingsKeys: normalizeKeys,
  });
  assert.deepEqual(operations.get({ key: 'apiConfig.providers.openai.apiKey' }), {
    ok: true,
    available: true,
    values: { [API_KEY]: 'secret' },
  });

  const offline = createSecureSettingsCapabilityOperations({
    getSecureSettingsStore: () => createStore({ available: false, values: { [API_KEY]: 'secret' } }),
    normalizeSecureSettingsKeys: normalizeKeys,
  });
  assert.deepEqual(offline.get({ key: 'apiConfig.providers.openai.apiKey' }), { ok: true, available: false, values: {} });
});

test('get degrades to an error result when the store throws', () => {
  const operations = createSecureSettingsCapabilityOperations({
    getSecureSettingsStore: () => {
      throw new Error('keychain unavailable');
    },
    normalizeSecureSettingsKeys: normalizeKeys,
  });
  assert.deepEqual(operations.get({ key: 'apiConfig.providers.openai.apiKey' }), {
    ok: false,
    available: false,
    values: {},
    error: 'keychain unavailable',
  });
});

test('set and delete refuse to run without a working store', () => {
  const operations = createSecureSettingsCapabilityOperations({
    getSecureSettingsStore: () => createStore({ available: false }),
    normalizeSecureSettingsKeys: normalizeKeys,
  });
  assert.deepEqual(operations.set({ key: 'apiConfig.providers.openai.apiKey', value: 'v' }), {
    ok: false,
    available: false,
    error: '安全存储不可用',
  });
  assert.deepEqual(operations.delete({ key: 'apiConfig.providers.openai.apiKey' }), {
    ok: false,
    available: false,
    error: '安全存储不可用',
  });
});

test('set and delete reject keys the normalizer drops', () => {
  const store = createStore();
  const operations = createSecureSettingsCapabilityOperations({
    getSecureSettingsStore: () => store,
    normalizeSecureSettingsKeys: normalizeKeys,
  });
  assert.deepEqual(operations.set({ key: '', value: 'v' }), {
    ok: false,
    available: true,
    error: 'Invalid secure setting key',
  });
  assert.deepEqual(operations.delete({ key: '', value: 'v' }), {
    ok: false,
    available: true,
    error: 'Invalid secure setting key',
  });
  assert.deepEqual(store.writes, []);
});

test('get/set/delete reject keys outside the secret configuration namespaces', () => {
  const store = createStore({ values: { 'system.token': 'must stay hidden' } });
  const operations = createSecureSettingsCapabilityOperations({
    getSecureSettingsStore: () => store,
    normalizeSecureSettingsKeys: normalizeKeys,
  });
  assert.deepEqual(operations.get({ key: 'system.token' }), { ok: true, available: true, values: {} });
  assert.equal(operations.set({ key: 'system.token', value: 'overwrite' }).ok, false);
  assert.equal(operations.delete({ key: 'system.token' }).ok, false);
  assert.deepEqual(store.writes, []);
});

test('set and delete forward normalized keys to the store', () => {
  const store = createStore();
  const operations = createSecureSettingsCapabilityOperations({
    getSecureSettingsStore: () => store,
    normalizeSecureSettingsKeys: normalizeKeys,
  });
  assert.deepEqual(operations.set({ key: 'apiConfig.providers.openai.apiKey', value: 'v1' }), { ok: true, available: true });
  assert.deepEqual(operations.delete({ key: 'apiConfig.providers.openai.apiKey' }), { ok: true, available: true });
  assert.deepEqual(store.writes, [
    ['set', 'apiConfig.providers.openai.apiKey', 'v1'],
    ['delete', 'apiConfig.providers.openai.apiKey'],
  ]);
});
