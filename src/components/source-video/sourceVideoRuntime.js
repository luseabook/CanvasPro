import appStore from '../../core/stores/appStore.js';
import { t } from '../../i18n/index.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import { readViewportInteractionState } from '../../core/viewportInteractionState.js';
import { RENDERER_VIRTUALIZATION_CONFIG } from '../../core/rendererVirtualization.js';
const SOURCE_VIDEO_IDLE_MEDIA_TIMEOUT_MS = 120,
  SOURCE_VIDEO_BUSY_RETRY_MS = 80,
  SOURCE_VIDEO_MAX_BUSY_WAIT_MS = 3600;
export function sourceVideoText(value, item = {}) {
  return t('sourceVideoNode.' + value, item);
}
export function isDesktopRenderer() {
  return desktopBridge['isElectron'] || desktopBridge['isChromeShell'];
}
export function shouldEagerLoadSourceVideoAtCurrentZoom() {
  let key = 1;
  try {
    const index =
        typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']?.(),
      count = Number(index?.['viewport']?.['zoom']);
    if (Number['isFinite'](count) && count > 0) key = count;
  } catch {}
  return key > RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'];
}
export function isClientFetchableMediaUrl(result) {
  const enabled = String(result || '')['trim']();
  return (
    /^https?:\/\//i['test'](enabled) ||
    enabled['startsWith']('blob:') ||
    enabled['startsWith']('data:') ||
    (enabled['startsWith']('/') && !enabled['startsWith']('//'))
  );
}
function getSourceVideoSchedulerNow() {
  return typeof performance !== 'undefined' && typeof performance['now'] === 'function'
    ? performance['now']()
    : Date['now']();
}
export function isSourceVideoInteractionBusy() {
  return readViewportInteractionState()['isViewportBusy'];
}
export function hasSourceVideoRecoveryWork(options = {}) {
  return !!(
    String(options?.['rhTaskId'] || '')['trim']() ||
    String(options?.['asyncTaskId'] || '')['trim']() ||
    options?.['rhTaskRecovering'] === true ||
    options?.['asyncTaskRecovering'] === true
  );
}
export function scheduleSourceVideoIdleTask(
  handler,
  { timeout: timeout = SOURCE_VIDEO_IDLE_MEDIA_TIMEOUT_MS } = {},
) {
  if (typeof handler !== 'function') return () => {};
  let data = false,
    handler2 = () => {};
  const sourceVideoSchedulerNow = getSourceVideoSchedulerNow(),
    handler3 = globalThis['window']?.['requestIdleCallback'] || globalThis['requestIdleCallback'],
    handler4 = globalThis['window']?.['cancelIdleCallback'] || globalThis['cancelIdleCallback'];
  function run(target) {
    const setTimeout2 = setTimeout(source, target);
    handler2 = () => clearTimeout(setTimeout2);
  }
  const source = () => {
    if (data) return;
    const sourceVideoSchedulerNow2 = getSourceVideoSchedulerNow() - sourceVideoSchedulerNow;
    if (isSourceVideoInteractionBusy() && sourceVideoSchedulerNow2 < SOURCE_VIDEO_MAX_BUSY_WAIT_MS) {
      run(SOURCE_VIDEO_BUSY_RETRY_MS);
      return;
    }
    handler();
  };
  if (typeof handler3 === 'function') {
    const next = handler3(source, { timeout: timeout });
    handler2 = () => {
      if (typeof handler4 === 'function') handler4(next);
    };
  } else run(16);
  return () => {
    ((data = true), handler2());
  };
}
export function shouldFetchVideoMetaForNodeInfo() {
  try {
    const current =
      typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
    return current?.['ui']?.['showVideoMeta'] === true;
  } catch {
    return false;
  }
}
