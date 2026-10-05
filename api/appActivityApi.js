import { requester } from './requester.js';
const APP_STARTUP_ACTIVITY_PATH = '/api/v2/app-activity/startup';
export async function reportAppStartupActivity(options = {}) {
  const deviceId = String(options?.['deviceId'] || '')['trim']();
  if (!deviceId) return { success: false, recorded: false, reason: 'missing_device_id' };
  if (options?.['enabled'] !== true) {
    return { success: false, recorded: false, reason: 'disabled' };
  }
  return await requester({
    url: APP_STARTUP_ACTIVITY_PATH,
    method: 'POST',
    provider: 'local',
    timeout: 5000,
    headers: { 'Content-Type': 'application/json' },
    body: JSON['stringify']({
      deviceId: deviceId,
      appVersion: String(options?.['appVersion'] || '')['trim'](),
      os: String(options?.['os'] || 'other')['trim'](),
      productCode: 'aicanvas',
    }),
  });
}
