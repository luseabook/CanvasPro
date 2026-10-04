import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeJsonAtomicallySync } from './atomicJsonStore.js';
import path from 'node:path';
const DEVICE_IDENTITY_FILENAME = 'device-identity.json';
function readJsonFileSyncSafe(value) {
  try {
    return JSON.parse(readFileSync(value, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return {};
  }
}
function writeJsonFileSyncSafe(item, key) {
  writeJsonAtomicallySync(item, key || {});
}
function normalizeDeviceIdentityValue(index) {
  const list = String(index || '').trim();
  if (!list || list.length > 0x100) return '';
  return /^[A-Za-z0-9._:-]+$/.test(list) ? list : '';
}
function readDeviceIdFromFile(result) {
  const jsonFileSyncSafe = readJsonFileSyncSafe(result);
  return normalizeDeviceIdentityValue(jsonFileSyncSafe.deviceId || jsonFileSyncSafe.device_id);
}
function readInstallIdFromFile(data) {
  const jsonFileSyncSafe2 = readJsonFileSyncSafe(data);
  return normalizeDeviceIdentityValue(jsonFileSyncSafe2.installId || jsonFileSyncSafe2.install_id);
}
export function createDeviceIdentityManager({
  app: app,
  appRoot: appRoot,
  getUserRoot: getUserRoot,
  isolatedProfile = false,
  logEvent: logEvent = () => {},
}) {
  function run() {
    const options = 'AI-CanvasPro';
    if (process.platform === 'win32') {
      const target = process.env.LOCALAPPDATA || process.env.APPDATA || app.getPath('userData');
      return path.join(target, options);
    }
    if (process.platform === 'darwin') return path.join(app.getPath('appData'), options);
    const source = process.env.XDG_STATE_HOME || path.join(app.getPath('home'), '.local', 'state');
    return path.join(source, options);
  }
  function run2() {
    if (isolatedProfile) return [path.join(app.getPath('userData'), DEVICE_IDENTITY_FILENAME)];
    return [
      path.join(app.getPath('userData'), DEVICE_IDENTITY_FILENAME),
      path.join(run(), DEVICE_IDENTITY_FILENAME),
    ];
  }
  function run3() {
    if (isolatedProfile) return [path.join(getUserRoot(), 'settings.json')];
    return [
      path.join(getUserRoot(), 'settings.json'),
      path.join(run(), 'settings.json'),
      path.join(appRoot, 'user', 'settings.json'),
    ];
  }
  function run4(next) {
    const deviceId = normalizeDeviceIdentityValue(next);
    if (!deviceId) return;
    for (const current of run2()) {
      try {
        writeJsonFileSyncSafe(current, { deviceId: deviceId, updatedAt: new Date().toISOString() });
      } catch (error) {
        logEvent({
          type: 'device_identity.write_failed',
          level: 'warn',
          source: 'main',
          message: 'Failed to persist device identity',
          error: error,
          context: { target: path.basename(current) },
        });
      }
    }
    for (const entry of run3().slice(0, 2)) {
      try {
        const args = readJsonFileSyncSafe(entry);
        if (normalizeDeviceIdentityValue(args.deviceId) === deviceId) continue;
        writeJsonFileSyncSafe(entry, { ...args, deviceId: deviceId });
      } catch (error2) {
        logEvent({
          type: 'device_identity.settings_write_failed',
          level: 'warn',
          source: 'main',
          message: 'Failed to mirror device identity into settings',
          error: error2,
          context: { target: path.basename(entry) },
        });
      }
    }
  }
  function getStableDeviceId(options2 = {}) {
    const deviceIdentityValue = normalizeDeviceIdentityValue(options2?.installId || options2?.seedInstallId),
      list2 = run2(),
      list3 = run3(),
      list4 = [
        ...list2.map((item2) => readDeviceIdFromFile(item2)),
        ...list3.map((item3) => readDeviceIdFromFile(item3)),
        ...list3.map((item4) => readInstallIdFromFile(item4)),
        deviceIdentityValue,
      ],
      record = list4.find(Boolean),
      payload = record || 'aicdev-' + randomBytes(16).toString('hex');
    return (run4(payload), payload);
  }
  return { getStableDeviceId: getStableDeviceId };
}
