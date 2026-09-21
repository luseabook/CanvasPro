const BACKGROUND_THROTTLE_SWITCHES = Object.freeze([
    'disable-background-timer-throttling',
    'disable-renderer-backgrounding',
    'disable-backgrounding-occluded-windows',
  ]),
  DISABLED_BACKGROUND_FEATURES = 'CalculateNativeWinOcclusion,IntensiveWakeUpThrottling';
export function configureRendererResponsiveness(_0x59f534) {
  const _0x5dd854 = _0x59f534?.commandLine;
  if (!_0x5dd854?.appendSwitch) return;
  for (const _0x283de6 of BACKGROUND_THROTTLE_SWITCHES) {
    try {
      _0x5dd854.appendSwitch(_0x283de6);
    } catch (_0x5e1b4a) {
      console.warn('[electron] failed to append Chromium switch ' + _0x283de6 + ':', _0x5e1b4a);
    }
  }
  try {
    _0x5dd854.appendSwitch('disable-features', DISABLED_BACKGROUND_FEATURES);
  } catch (_0x2b3b7d) {
    console.warn('[electron] failed to disable Chromium background features:', _0x2b3b7d);
  }
}
export const __rendererResponsivenessForTest = {
  BACKGROUND_THROTTLE_SWITCHES: BACKGROUND_THROTTLE_SWITCHES,
  DISABLED_BACKGROUND_FEATURES: DISABLED_BACKGROUND_FEATURES,
};
