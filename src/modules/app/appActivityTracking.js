const APP_VERSION_MAX_LENGTH = 64;
function normalizeAppVersion(value) {
  return String(value || '')
    .trim()
    .slice(0, APP_VERSION_MAX_LENGTH);
}
export function detectClientOperatingSystem(item = globalThis.navigator) {
  const key = String(item?.userAgentData?.platform || item?.platform || '').toLowerCase(),
    index = String(item?.userAgent || '').toLowerCase(),
    result = key + ' ' + index;
  if (/windows|win32|win64/.test(result)) return 'windows';
  if (/macintosh|macintel|mac os|darwin/.test(result)) return 'macos';
  if (/cros|chrome os/.test(result)) return 'chromeos';
  if (/linux|x11/.test(result)) return 'linux';
  return 'other';
}
export async function initAppActivityTracking({
  runtimeInfoPromise: runtimeInfoPromise,
  ensureDeviceId: ensureDeviceId,
  reportStartupActivity: reportStartupActivity,
  navigatorObject: navigatorObject = globalThis.navigator,
} = {}) {
  if (typeof ensureDeviceId !== 'function' || typeof reportStartupActivity !== 'function')
    return { success: false, recorded: false, reason: 'unavailable' };
  try {
    const [data, options] = await Promise.all([
        Promise.resolve(runtimeInfoPromise).catch(() => ({})),
        ensureDeviceId(),
      ]),
      deviceId = String(options || '').trim();
    if (!deviceId) return { success: false, recorded: false, reason: 'missing_device_id' };
    return await reportStartupActivity({
      deviceId: deviceId,
      appVersion: normalizeAppVersion(data?.localVersion),
      os: detectClientOperatingSystem(navigatorObject),
    });
  } catch {
    return { success: false, recorded: false, reason: 'report_failed' };
  }
}
