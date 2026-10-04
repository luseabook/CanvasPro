import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
export const SECURE_SETTINGS_VERSION = 1;
export function isAllowedSecureSettingKey(value) {
  const key = String(value || '').trim();
  if (!key || key.length > 160 || !/^[A-Za-z0-9._:-]+$/.test(key)) return false;
  return (
    /^apiConfig\.providers\.[A-Za-z0-9_-]{1,120}\.(?:apiKey|modelApiKey)$/.test(key) ||
    /^apiConfig\.objectStorage\.(?:accessKeyId|secretAccessKey|sessionToken)$/.test(key) ||
    /^apiConfig\.objectStorage\.profiles\.[A-Za-z0-9_-]{1,120}\.(?:accessKeyId|secretAccessKey|sessionToken)$/.test(
      key,
    )
  );
}
function normalizeSecureSettingKey(item) {
  const index = String(item || '').trim();
  return isAllowedSecureSettingKey(index) ? index : '';
}
function readStoreFile(result) {
  try {
    if (!existsSync(result)) return {};
    const data = JSON.parse(readFileSync(result, 'utf8'));
    return data && typeof data === 'object' && data.items && typeof data.items === 'object' ? data.items : {};
  } catch {
    return {};
  }
}
function writeStoreFile(options, items) {
  mkdirSync(path.dirname(options), { recursive: true });
  const target = {
      version: SECURE_SETTINGS_VERSION,
      updatedAt: Date.now(),
      items: items && typeof items === 'object' ? items : {},
    },
    source = options + '.' + process.pid + '.' + Date.now() + '.tmp';
  (writeFileSync(source, JSON.stringify(target, null, 2) + '\n', 'utf8'), renameSync(source, options));
}
export function createSecureSettingsStore({ filePath: filePath, safeStorage: safeStorage } = {}) {
  const enabled = path.resolve(String(filePath || ''));
  if (!enabled) throw new Error('secure settings path is required');
  function isAvailable() {
    try {
      return (
        typeof safeStorage?.isEncryptionAvailable === 'function' &&
        safeStorage.isEncryptionAvailable() === true
      );
    } catch {
      return false;
    }
  }
  function getMany(next) {
    const list = (Array.isArray(next) ? next : [next]).map(normalizeSecureSettingKey).filter(Boolean),
      current = {};
    if (!isAvailable() || list.length === 0) return current;
    const storeFile = readStoreFile(enabled);
    return (
      list.forEach((item2) => {
        const enabled2 = String(storeFile[item2]?.encrypted || '').trim();
        if (!enabled2) return;
        try {
          current[item2] = safeStorage.decryptString(Buffer.from(enabled2, 'base64'));
        } catch {}
      }),
      current
    );
  }
  function set(entry, record) {
    const secureSettingKey = normalizeSecureSettingKey(entry);
    if (!secureSettingKey) throw new Error('Invalid secure setting key');
    if (!isAvailable()) throw new Error('Secure storage is unavailable');
    const enabled3 = String(record || ''),
      storeFile2 = readStoreFile(enabled);
    return (
      !enabled3
        ? delete storeFile2[secureSettingKey]
        : (storeFile2[secureSettingKey] = {
            encrypted: safeStorage.encryptString(enabled3).toString('base64'),
            updatedAt: Date.now(),
          }),
      writeStoreFile(enabled, storeFile2),
      true
    );
  }
  function delete2(payload) {
    const secureSettingKey2 = normalizeSecureSettingKey(payload);
    if (!secureSettingKey2) throw new Error('Invalid secure setting key');
    if (!isAvailable()) throw new Error('Secure storage is unavailable');
    const storeFile3 = readStoreFile(enabled);
    return (delete storeFile3[secureSettingKey2], writeStoreFile(enabled, storeFile3), true);
  }
  return { isAvailable: isAvailable, getMany: getMany, set: set, delete: delete2 };
}
