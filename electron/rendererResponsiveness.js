const BACKGROUND_THROTTLE_SWITCHES = Object.freeze([
    'disable-background-timer-throttling',
    'disable-renderer-backgrounding',
    'disable-backgrounding-occluded-windows',
  ]),
  DISABLED_BACKGROUND_FEATURES = 'CalculateNativeWinOcclusion,IntensiveWakeUpThrottling';
export function configureRendererResponsiveness(value) {
  const enabled = value?.commandLine;
  if (!enabled?.appendSwitch) return;
  for (const item of BACKGROUND_THROTTLE_SWITCHES) {
    try {
      enabled.appendSwitch(item);
    } catch (key) {
      console.warn('[electron] failed to append Chromium switch ' + item + ':', key);
    }
  }
  try {
    enabled.appendSwitch('disable-features', DISABLED_BACKGROUND_FEATURES);
  } catch (index) {
    console.warn('[electron] failed to disable Chromium background features:', index);
  }
}
export const __rendererResponsivenessForTest = {
  BACKGROUND_THROTTLE_SWITCHES: BACKGROUND_THROTTLE_SWITCHES,
  DISABLED_BACKGROUND_FEATURES: DISABLED_BACKGROUND_FEATURES,
};
