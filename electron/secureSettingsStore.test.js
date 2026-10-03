import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSecureSettingsStore, isAllowedSecureSettingKey } from './secureSettingsStore.js';

const safeStorage = {
  isEncryptionAvailable: () => true,
  encryptString: value => Buffer.from(value, 'utf8'),
  decryptString: value => Buffer.from(value).toString('utf8'),
};

test('secure setting allowlist covers app credentials but excludes arbitrary vault keys', () => {
  assert.equal(isAllowedSecureSettingKey('apiConfig.providers.openai.apiKey'), true);
  assert.equal(isAllowedSecureSettingKey('apiConfig.providers.volcengine-speech.modelApiKey'), true);
  assert.equal(isAllowedSecureSettingKey('apiConfig.objectStorage.secretAccessKey'), true);
  assert.equal(isAllowedSecureSettingKey('apiConfig.objectStorage.profiles.s3.sessionToken'), true);
  assert.equal(isAllowedSecureSettingKey('system.token'), false);
  assert.equal(isAllowedSecureSettingKey('apiConfig.providers.openai.password'), false);
  assert.equal(isAllowedSecureSettingKey('apiConfig.providers.openai.apiKey.extra'), false);
});

test('secure store refuses arbitrary get/set/delete keys and keeps allowed provider secrets', t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'secure-settings-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const store = createSecureSettingsStore({ filePath: path.join(root, 'vault.json'), safeStorage });
  const key = 'apiConfig.providers.openai.apiKey';
  store.set(key, 'secret-value');
  assert.deepEqual(store.getMany([key, 'system.token']), { [key]: 'secret-value' });
  assert.throws(() => store.set('system.token', 'overwrite'), /Invalid secure setting key/);
  assert.throws(() => store.delete('system.token'), /Invalid secure setting key/);
  store.delete(key);
  assert.deepEqual(store.getMany([key]), {});
});
