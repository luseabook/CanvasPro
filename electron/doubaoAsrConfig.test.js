import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createDoubaoAsrConfigResolver } from './doubaoAsrConfig.js';

function makeRoot(t, config) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'doubao-asr-config-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  if (config !== undefined) writeFileSync(path.join(root, 'config.json'), JSON.stringify(config));
  return root;
}

function makeAppRoot(t, config) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'doubao-asr-app-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'user'), { recursive: true });
  writeFileSync(path.join(root, 'user', 'config.json'), JSON.stringify(config));
  return root;
}

function makeStore(values) {
  return () => ({ getMany: (keys) => Object.fromEntries(keys.map((key) => [key, values[key] || ''])) });
}

test('user config.json is read from the user root', (t) => {
  const userRoot = makeRoot(t, {
    providers: {
      volcengine: { asrAppKey: 'app-from-config', asrAccessKey: 'access-from-config' },
      'volcengine-speech': { apiKey: 'speech-api-key', asrApiUrl: 'https://speech.invalid/asr' },
    },
  });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.deepEqual(resolve({ speechOnly: true }), {
    apiKey: 'speech-api-key',
    appKey: 'app-from-config',
    accessKey: 'access-from-config',
    baseUrl: 'https://speech.invalid/asr',
  });
});

test('process environment wins over every stored source', (t) => {
  const userRoot = makeRoot(t, {
    providers: { 'volcengine-speech': { apiKey: 'stored' }, volcengine: { apiKey: 'general' } },
  });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: makeStore({
      'apiConfig.providers.volcengine-speech.apiKey': 'secure-speech',
    }),
    getUserRoot: () => userRoot,
    processEnv: {
      VOLCENGINE_ASR_API_KEY: 'env-speech',
      DOUBAO_ASR_APP_KEY: 'env-app',
      VOLCENGINE_ASR_ACCESS_KEY: 'env-access',
      DOUBAO_ASR_API_URL: 'https://env.invalid/asr',
    },
  });
  assert.deepEqual(resolve({ speechOnly: true }), {
    apiKey: 'env-speech',
    appKey: 'env-app',
    accessKey: 'env-access',
    baseUrl: 'https://env.invalid/asr',
  });
});

test('the secure settings store outranks config.json', (t) => {
  const userRoot = makeRoot(t, { providers: { 'volcengine-speech': { apiKey: 'stored' } } });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: makeStore({
      'apiConfig.providers.volcengine-speech.apiKey': 'secure-speech',
    }),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(resolve({ speechOnly: true }).apiKey, 'secure-speech');
});

test('speechOnly excludes the general volcengine credentials', (t) => {
  const userRoot = makeRoot(t, {
    providers: {
      volcengine: { apiKey: 'general-api-key', asrApiUrl: 'https://general.invalid/asr' },
    },
  });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: makeStore({ 'apiConfig.providers.volcengine.apiKey': 'secure-general' }),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(resolve({ speechOnly: true }).apiKey, '');
  assert.equal(resolve({ speechOnly: true }).baseUrl, 'https://general.invalid/asr');
  assert.equal(resolve({ speechOnly: false }).apiKey, 'secure-general');
});

test('speechOnly defaults to false so the general key is still reachable', (t) => {
  const userRoot = makeRoot(t, { providers: { volcengine: { apiKey: 'general-config' } } });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(resolve().apiKey, 'general-config');
  assert.equal(resolve({}).apiKey, 'general-config');
});

test('a missing user config falls back to appRoot/user/config.json', (t) => {
  const userRoot = makeRoot(t);
  const appRoot = makeAppRoot(t, {
    providers: { 'volcengine-speech': { apiKey: 'app-scoped-key' } },
  });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: appRoot,
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(resolve({ speechOnly: true }).apiKey, 'app-scoped-key');
});

test('an empty user config object still yields to the app-scoped config', (t) => {
  const userRoot = makeRoot(t, {});
  const appRoot = makeAppRoot(t, {
    providers: { 'volcengine-speech': { apiKey: 'app-scoped-key' } },
  });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: appRoot,
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(resolve({ speechOnly: true }).apiKey, 'app-scoped-key');
});

test('malformed JSON, arrays and non-object providers degrade to empty strings', (t) => {
  const userRoot = mkdtempSync(path.join(os.tmpdir(), 'doubao-asr-config-'));
  t.after(() => rmSync(userRoot, { recursive: true, force: true }));
  writeFileSync(path.join(userRoot, 'config.json'), '{ not json');
  const broken = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.deepEqual(broken({ speechOnly: true }), {
    apiKey: '',
    appKey: '',
    accessKey: '',
    baseUrl: '',
  });

  const arrayRoot = makeRoot(t, [1, 2, 3]);
  const arrayConfig = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => arrayRoot,
    processEnv: {},
  });
  assert.equal(arrayConfig({ speechOnly: true }).apiKey, '');

  const stringProviders = makeRoot(t, { providers: { 'volcengine-speech': 'nope' } });
  const stringConfig = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => stringProviders,
    processEnv: {},
  });
  assert.equal(stringConfig({ speechOnly: true }).apiKey, '');
});

test('a throwing secure settings store never breaks credential resolution', (t) => {
  const userRoot = makeRoot(t, { providers: { 'volcengine-speech': { apiKey: 'stored' } } });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => {
      throw new Error('store unavailable');
    },
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(resolve({ speechOnly: true }).apiKey, 'stored');

  const missingGetMany = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(missingGetMany({ speechOnly: true }).apiKey, 'stored');
});

test('baseUrl keeps the documented precedence order', (t) => {
  const userRoot = makeRoot(t, {
    providers: {
      'volcengine-speech': { apiUrl: 'https://speech-plain.invalid' },
      volcengine: { asrApiUrl: 'https://general.invalid' },
    },
  });
  const resolve = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => userRoot,
    processEnv: {},
  });
  assert.equal(resolve({ speechOnly: true }).baseUrl, 'https://speech-plain.invalid');

  const asrOnly = makeRoot(t, {
    providers: { volcengine: { asrApiUrl: 'https://general.invalid' } },
  });
  const resolveAsrOnly = createDoubaoAsrConfigResolver({
    appRoot: '',
    getSecureSettingsStore: () => ({}),
    getUserRoot: () => asrOnly,
    processEnv: {},
  });
  assert.equal(resolveAsrOnly({ speechOnly: true }).baseUrl, 'https://general.invalid');
});
