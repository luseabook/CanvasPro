const APP_VERSION_MAX_LENGTH = 0x40;
function normalizeAppVersion(_0x48b826) {
  return String(_0x48b826 || '')
    ['trim']()
    ['slice'](0x0, APP_VERSION_MAX_LENGTH);
}
export function detectClientOperatingSystem(_0x574ed6 = globalThis['navigator']) {
  const _0xcb99be = String(_0x574ed6?.['userAgentData']?.['platform'] || _0x574ed6?.['platform'] || '')[
      'toLowerCase'
    ](),
    _0x29a5a7 = String(_0x574ed6?.['userAgent'] || '')['toLowerCase'](),
    _0x295fbe = _0xcb99be + '\x20' + _0x29a5a7;
  if (/windows|win32|win64/['test'](_0x295fbe)) return 'windows';
  if (/macintosh|macintel|mac os|darwin/['test'](_0x295fbe)) return 'macos';
  if (/cros|chrome os/['test'](_0x295fbe)) return 'chromeos';
  if (/linux|x11/['test'](_0x295fbe)) return 'linux';
  return 'other';
}
export async function initAppActivityTracking({
  runtimeInfoPromise: _0x554596,
  ensureDeviceId: _0x9afef9,
  reportStartupActivity: _0x1550d2,
  navigatorObject: navigatorObject = globalThis['navigator'],
} = {}) {
  if (typeof _0x9afef9 !== 'function' || typeof _0x1550d2 !== 'function')
    return { success: ![], recorded: ![], reason: 'unavailable' };
  try {
    const [_0x659612, _0x4b5c13] = await Promise['all']([
        Promise['resolve'](_0x554596)['catch'](() => ({})),
        _0x9afef9(),
      ]),
      _0x381358 = String(_0x4b5c13 || '')['trim']();
    if (!_0x381358) return { success: ![], recorded: ![], reason: 'missing_device_id' };
    return await _0x1550d2({
      deviceId: _0x381358,
      appVersion: normalizeAppVersion(_0x659612?.['localVersion']),
      os: detectClientOperatingSystem(navigatorObject),
    });
  } catch {
    return { success: ![], recorded: ![], reason: 'report_failed' };
  }
}
