import appStore from '../../core/stores/appStore.js';
import { t } from '../../i18n/index.js';
import { desktopBridge } from '../../services/desktopBridge.js';
import { readViewportInteractionState } from '../../core/viewportInteractionState.js';
import { RENDERER_VIRTUALIZATION_CONFIG } from '../../core/rendererVirtualization.js';
const SOURCE_VIDEO_IDLE_MEDIA_TIMEOUT_MS = 0x78,
  SOURCE_VIDEO_BUSY_RETRY_MS = 0x50,
  SOURCE_VIDEO_MAX_BUSY_WAIT_MS = 0xe10;
export function sourceVideoText(_0x1a48b9, _0x3a8dda = {}) {
  return t('sourceVideoNode.' + _0x1a48b9, _0x3a8dda);
}
export function isDesktopRenderer() {
  return desktopBridge['isElectron'] || desktopBridge['isChromeShell'];
}
export function shouldEagerLoadSourceVideoAtCurrentZoom() {
  let _0x5f2c7c = 0x1;
  try {
    const _0x46ac3f =
        typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']?.(),
      _0x41bc2d = Number(_0x46ac3f?.['viewport']?.['zoom']);
    if (Number['isFinite'](_0x41bc2d) && _0x41bc2d > 0x0) _0x5f2c7c = _0x41bc2d;
  } catch {}
  return _0x5f2c7c > RENDERER_VIRTUALIZATION_CONFIG['denseLowZoomThreshold'];
}
export function isClientFetchableMediaUrl(_0x2a7d71) {
  const _0x1da0d1 = String(_0x2a7d71 || '')['trim']();
  return (
    /^https?:\/\//i['test'](_0x1da0d1) ||
    _0x1da0d1['startsWith']('blob:') ||
    _0x1da0d1['startsWith']('data:') ||
    (_0x1da0d1['startsWith']('/') && !_0x1da0d1['startsWith']('//'))
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
export function hasSourceVideoRecoveryWork(_0x419b2a = {}) {
  return !!(
    String(_0x419b2a?.['rhTaskId'] || '')['trim']() ||
    String(_0x419b2a?.['asyncTaskId'] || '')['trim']() ||
    _0x419b2a?.['rhTaskRecovering'] === !![] ||
    _0x419b2a?.['asyncTaskRecovering'] === !![]
  );
}
export function scheduleSourceVideoIdleTask(
  _0x1fb114,
  { timeout: timeout = SOURCE_VIDEO_IDLE_MEDIA_TIMEOUT_MS } = {},
) {
  if (typeof _0x1fb114 !== 'function') return () => {};
  let _0x522535 = ![],
    _0x4bf657 = () => {};
  const _0xe532d6 = getSourceVideoSchedulerNow(),
    _0x5d3352 = globalThis['window']?.['requestIdleCallback'] || globalThis['requestIdleCallback'],
    _0xb75702 = globalThis['window']?.['cancelIdleCallback'] || globalThis['cancelIdleCallback'];
  function _0x1f6f14(_0x42e081) {
    const _0x4135b4 = setTimeout(_0x29f265, _0x42e081);
    _0x4bf657 = () => clearTimeout(_0x4135b4);
  }
  const _0x29f265 = () => {
    if (_0x522535) return;
    const _0x5730a2 = getSourceVideoSchedulerNow() - _0xe532d6;
    if (isSourceVideoInteractionBusy() && _0x5730a2 < SOURCE_VIDEO_MAX_BUSY_WAIT_MS) {
      _0x1f6f14(SOURCE_VIDEO_BUSY_RETRY_MS);
      return;
    }
    _0x1fb114();
  };
  if (typeof _0x5d3352 === 'function') {
    const _0x136224 = _0x5d3352(_0x29f265, { timeout: timeout });
    _0x4bf657 = () => {
      if (typeof _0xb75702 === 'function') _0xb75702(_0x136224);
    };
  } else _0x1f6f14(0x10);
  return () => {
    ((_0x522535 = !![]), _0x4bf657());
  };
}
export function shouldFetchVideoMetaForNodeInfo() {
  try {
    const _0xe2fbb9 =
      typeof appStore['getStateRaw'] === 'function' ? appStore['getStateRaw']() : appStore['getState']();
    return _0xe2fbb9?.['ui']?.['showVideoMeta'] === !![];
  } catch {
    return ![];
  }
}
