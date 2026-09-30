import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeJsonAtomicallySync } from './atomicJsonStore.js';
import path from 'node:path';
const DEVICE_IDENTITY_FILENAME = 'device-identity.json';
function readJsonFileSyncSafe(_0x4e81ae) {
  try {
    return JSON.parse(readFileSync(_0x4e81ae, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}
function writeJsonFileSyncSafe(_0x27f88b, _0x46179c) {
  writeJsonAtomicallySync(_0x27f88b, _0x46179c || {});
}
function normalizeDeviceIdentityValue(_0x22b0fa) {
  const _0x155885 = String(_0x22b0fa || '').trim();
  if (!_0x155885 || _0x155885.length > 0x100) return '';
  return /^[A-Za-z0-9._:-]+$/.test(_0x155885) ? _0x155885 : '';
}
function readDeviceIdFromFile(_0x50450f) {
  const _0x565736 = readJsonFileSyncSafe(_0x50450f);
  return normalizeDeviceIdentityValue(_0x565736.deviceId || _0x565736.device_id);
}
function readInstallIdFromFile(_0x55590b) {
  const _0x1050d5 = readJsonFileSyncSafe(_0x55590b);
  return normalizeDeviceIdentityValue(_0x1050d5.installId || _0x1050d5.install_id);
}
export function createDeviceIdentityManager({
  app: _0x2cfe96,
  appRoot: _0x27e5d8,
  getUserRoot: _0x1ada4c,
  isolatedProfile = false,
  logEvent: logEvent = () => {},
}) {
  function _0x46dd2f() {
    const _0x1573b8 = 'AI-CanvasPro';
    if (process.platform === 'win32') {
      const _0xde2214 = process.env.LOCALAPPDATA || process.env.APPDATA || _0x2cfe96.getPath('userData');
      return path.join(_0xde2214, _0x1573b8);
    }
    if (process.platform === 'darwin') return path.join(_0x2cfe96.getPath('appData'), _0x1573b8);
    const _0x520bcf = process.env.XDG_STATE_HOME || path.join(_0x2cfe96.getPath('home'), '.local', 'state');
    return path.join(_0x520bcf, _0x1573b8);
  }
  function _0x4cdea1() {
    if (isolatedProfile) return [path.join(_0x2cfe96.getPath('userData'), DEVICE_IDENTITY_FILENAME)];
    return [
      path.join(_0x2cfe96.getPath('userData'), DEVICE_IDENTITY_FILENAME),
      path.join(_0x46dd2f(), DEVICE_IDENTITY_FILENAME),
    ];
  }
  function _0x54fa5d() {
    if (isolatedProfile) return [path.join(_0x1ada4c(), 'settings.json')];
    return [
      path.join(_0x1ada4c(), 'settings.json'),
      path.join(_0x46dd2f(), 'settings.json'),
      path.join(_0x27e5d8, 'user', 'settings.json'),
    ];
  }
  function _0x3be05d(_0x5e5356) {
    const _0xec6844 = normalizeDeviceIdentityValue(_0x5e5356);
    if (!_0xec6844) return;
    for (const _0x5f3bb2 of _0x4cdea1()) {
      try {
        writeJsonFileSyncSafe(_0x5f3bb2, { deviceId: _0xec6844, updatedAt: new Date().toISOString() });
      } catch (_0x4020f3) {
        logEvent({
          type: 'device_identity.write_failed',
          level: 'warn',
          source: 'main',
          message: 'Failed to persist device identity',
          error: _0x4020f3,
          context: { target: path.basename(_0x5f3bb2) },
        });
      }
    }
    for (const _0xdf7b98 of _0x54fa5d().slice(0, 2)) {
      try {
        const _0x499703 = readJsonFileSyncSafe(_0xdf7b98);
        if (normalizeDeviceIdentityValue(_0x499703.deviceId) === _0xec6844) continue;
        writeJsonFileSyncSafe(_0xdf7b98, { ..._0x499703, deviceId: _0xec6844 });
      } catch (_0x5af85d) {
        logEvent({
          type: 'device_identity.settings_write_failed',
          level: 'warn',
          source: 'main',
          message: 'Failed to mirror device identity into settings',
          error: _0x5af85d,
          context: { target: path.basename(_0xdf7b98) },
        });
      }
    }
  }
  function _0x572a9f(_0x5cbe7d = {}) {
    const _0x203392 = normalizeDeviceIdentityValue(_0x5cbe7d?.installId || _0x5cbe7d?.seedInstallId),
      _0x209dcd = _0x4cdea1(),
      _0x480472 = _0x54fa5d(),
      _0x58b6b5 = [
        ..._0x209dcd.map((_0x16f5ae) => readDeviceIdFromFile(_0x16f5ae)),
        ..._0x480472.map((_0x463e9d) => readDeviceIdFromFile(_0x463e9d)),
        ..._0x480472.map((_0x4870f3) => readInstallIdFromFile(_0x4870f3)),
        _0x203392,
      ],
      _0x14a881 = _0x58b6b5.find(Boolean),
      _0x15395a = _0x14a881 || 'aicdev-' + randomBytes(16).toString('hex');
    return (_0x3be05d(_0x15395a), _0x15395a);
  }
  return { getStableDeviceId: _0x572a9f };
}
