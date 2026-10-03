import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
export const SECURE_SETTINGS_VERSION = 1;
export function isAllowedSecureSettingKey(value) {
  const key = String(value || '').trim();
  if (!key || key.length > 160 || !/^[A-Za-z0-9._:-]+$/.test(key)) return false;
  return (
    /^apiConfig\.providers\.[A-Za-z0-9_-]{1,120}\.(?:apiKey|modelApiKey)$/.test(key) ||
    /^apiConfig\.objectStorage\.(?:accessKeyId|secretAccessKey|sessionToken)$/.test(key) ||
    /^apiConfig\.objectStorage\.profiles\.[A-Za-z0-9_-]{1,120}\.(?:accessKeyId|secretAccessKey|sessionToken)$/.test(key)
  );
}
function normalizeSecureSettingKey(_0x3644a8) {
  const _0x74658b = String(_0x3644a8 || '').trim();
  return isAllowedSecureSettingKey(_0x74658b) ? _0x74658b : '';
}
function readStoreFile(_0x32122e) {
  try {
    if (!existsSync(_0x32122e)) return {};
    const _0x46875f = JSON.parse(readFileSync(_0x32122e, 'utf8'));
    return _0x46875f &&
      typeof _0x46875f === 'object' &&
      _0x46875f.items &&
      typeof _0x46875f.items === 'object'
      ? _0x46875f.items
      : {};
  } catch {
    return {};
  }
}
function writeStoreFile(_0x2b1dc7, _0x4d0748) {
  mkdirSync(path.dirname(_0x2b1dc7), { recursive: true });
  const _0x251dce = {
      version: SECURE_SETTINGS_VERSION,
      updatedAt: Date.now(),
      items: _0x4d0748 && typeof _0x4d0748 === 'object' ? _0x4d0748 : {},
    },
    _0x943d26 = _0x2b1dc7 + '.' + process.pid + '.' + Date.now() + '.tmp';
  (writeFileSync(_0x943d26, JSON.stringify(_0x251dce, null, 2) + '\n', 'utf8'),
    renameSync(_0x943d26, _0x2b1dc7));
}
export function createSecureSettingsStore({ filePath: _0x4bc64b, safeStorage: _0xc6d7f1 } = {}) {
  const _0x206942 = path.resolve(String(_0x4bc64b || ''));
  if (!_0x206942) throw new Error('secure settings path is required');
  function _0x28ee86() {
    try {
      return (
        typeof _0xc6d7f1?.isEncryptionAvailable === 'function' && _0xc6d7f1.isEncryptionAvailable() === true
      );
    } catch {
      return false;
    }
  }
  function _0x461746(_0x1a9c65) {
    const _0x1afe0b = (Array.isArray(_0x1a9c65) ? _0x1a9c65 : [_0x1a9c65])
        .map(normalizeSecureSettingKey)
        .filter(Boolean),
      _0x4cd895 = {};
    if (!_0x28ee86() || _0x1afe0b.length === 0) return _0x4cd895;
    const _0x2fa36a = readStoreFile(_0x206942);
    return (
      _0x1afe0b.forEach((_0x3e62dd) => {
        const _0x1d4b9c = String(_0x2fa36a[_0x3e62dd]?.encrypted || '').trim();
        if (!_0x1d4b9c) return;
        try {
          _0x4cd895[_0x3e62dd] = _0xc6d7f1.decryptString(Buffer.from(_0x1d4b9c, 'base64'));
        } catch {}
      }),
      _0x4cd895
    );
  }
  function _0x36a98e(_0x45854a, _0x1c8444) {
    const _0x2a9aa5 = normalizeSecureSettingKey(_0x45854a);
    if (!_0x2a9aa5) throw new Error('Invalid secure setting key');
    if (!_0x28ee86()) throw new Error('Secure storage is unavailable');
    const _0x523541 = String(_0x1c8444 || ''),
      _0x5df0a0 = readStoreFile(_0x206942);
    return (
      !_0x523541
        ? delete _0x5df0a0[_0x2a9aa5]
        : (_0x5df0a0[_0x2a9aa5] = {
            encrypted: _0xc6d7f1.encryptString(_0x523541).toString('base64'),
            updatedAt: Date.now(),
          }),
      writeStoreFile(_0x206942, _0x5df0a0),
      true
    );
  }
  function _0x4d8ee7(_0x5e786f) {
    const _0x3d0841 = normalizeSecureSettingKey(_0x5e786f);
    if (!_0x3d0841) throw new Error('Invalid secure setting key');
    if (!_0x28ee86()) throw new Error('Secure storage is unavailable');
    const _0x52670b = readStoreFile(_0x206942);
    return (delete _0x52670b[_0x3d0841], writeStoreFile(_0x206942, _0x52670b), true);
  }
  return { isAvailable: _0x28ee86, getMany: _0x461746, set: _0x36a98e, delete: _0x4d8ee7 };
}
