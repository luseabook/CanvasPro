import { requester } from './requester.js';
const APP_STARTUP_ACTIVITY_PATH = '/api/v2/app-activity/startup';
export async function reportAppStartupActivity(_0xb7fde9 = {}) {
  const _0x41445a = String(_0xb7fde9?.['deviceId'] || '')['trim']();
  if (!_0x41445a) return { success: ![], recorded: ![], reason: 'missing_device_id' };
  if (_0xb7fde9?.['enabled'] !== true) {
    return { success: ![], recorded: ![], reason: 'disabled' };
  }
  return await requester({
    url: APP_STARTUP_ACTIVITY_PATH,
    method: 'POST',
    provider: 'local',
    timeout: 0x1388,
    headers: { 'Content-Type': 'application/json' },
    body: JSON['stringify']({
      deviceId: _0x41445a,
      appVersion: String(_0xb7fde9?.['appVersion'] || '')['trim'](),
      os: String(_0xb7fde9?.['os'] || 'other')['trim'](),
      productCode: 'aicanvas',
    }),
  });
}
