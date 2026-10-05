import { rendererStartupState } from './rendererStartupState.js';
export const STARTUP_LOADER_HARD_DEADLINE_MS = 10000;
const STARTUP_LOADER_GUARD_CANCEL_KEY = '__aicCancelStartupLoaderGuard';
function revealAppShell(el) {
  const el2 = el?.['getElementById']?.('v2-initial-loader');
  if (!el2) return false;
  const el3 = el['getElementById']?.('v2-wrap'),
    el4 = el['getElementById']?.('v2-canvas') || el['querySelector']?.('.v2-canvas');
  if (el4) el4['style']['transition'] = '';
  return (
    el3 &&
      ((el3['style']['transition'] = ''),
      (el3['style']['opacity'] = '1'),
      el3['classList']?.['remove']?.('is-initial-header-locked')),
    (el2['dataset']['failOpen'] = 'true'),
    (el2['style']['opacity'] = '0'),
    (el2['style']['visibility'] = 'hidden'),
    el2['remove']?.(),
    true
  );
}
export function cancelStartupLoaderGuard(value = globalThis['window']) {
  const run = value?.[STARTUP_LOADER_GUARD_CANCEL_KEY];
  if (typeof run === 'function') run();
}
export function installStartupLoaderGuard({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  timeoutMs: timeoutMs = STARTUP_LOADER_HARD_DEADLINE_MS,
  scheduleTimeout: scheduleTimeout = globalThis['setTimeout'],
  cancelTimeout: cancelTimeout = globalThis['clearTimeout'],
  warn: warn = console['warn'],
  startup: startup = rendererStartupState,
} = {}) {
  cancelStartupLoaderGuard(windowObject);
  if (!windowObject || typeof scheduleTimeout !== 'function') return () => {};
  let enabled = true,
    item = false,
    handler = () => {};
  const run2 = (enabled2) => {
      const el5 = documentObject?.['getElementById']?.('v2-initial-loader');
      if (!el5 || enabled2['ready']) return;
      el5['dataset']['startupState'] = enabled2['failure'] ? 'failed' : enabled2['phase'];
      if (enabled2['failure']) windowObject['hideGlobalLoading']?.();
      el5['setAttribute']?.('aria-busy', String(!enabled2['failure']));
      const el6 = el5['querySelector']?.('.brand-loader-tagline');
      el6 &&
        (el6['removeAttribute']?.('data-i18n'),
        (el6['textContent'] = enabled2['failure']
          ? '画布未能完成加载，请关闭后重新打开；若仍失败，请导出诊断包。'
          : enabled2['phase'] === 'storage-migration'
            ? '正在恢复升级前的数据，请稍候…'
            : '正在加载画布，请稍候…'),
        el5['removeAttribute']?.('data-i18n-aria-label'),
        el5['setAttribute']?.('aria-label', el6['textContent']));
    },
    scheduleTimeout2 = scheduleTimeout(
      () => {
        if (!enabled) return;
        if (!startup['snapshot']()['ready']) {
          ((item = true),
            run2(startup['snapshot']()),
            warn?.(
              '[startup] Still waiting for ' +
                startup['snapshot']()['phase'] +
                '; app remains locked.',
            ));
          return;
        }
        if (!revealAppShell(documentObject)) return;
        (handler2(),
          windowObject['hideGlobalLoading']?.(),
          warn?.(
            '[startup] Initial loader exceeded ' +
              timeoutMs +
              'ms before startup completed and was dismissed.',
          ));
      },
      Math['max'](0, Number(timeoutMs) || STARTUP_LOADER_HARD_DEADLINE_MS),
    ),
    handler2 = () => {
      if (!enabled) return;
      enabled = false;
      if (typeof cancelTimeout === 'function') cancelTimeout(scheduleTimeout2);
      (handler(),
        windowObject['removeEventListener']?.('pagehide', handler2),
        windowObject[STARTUP_LOADER_GUARD_CANCEL_KEY] === handler2 &&
          delete windowObject[STARTUP_LOADER_GUARD_CANCEL_KEY]);
    };
  return (
    (windowObject[STARTUP_LOADER_GUARD_CANCEL_KEY] = handler2),
    (handler = startup['subscribe']((key) => {
      if (key['failure'] || item) run2(key);
    })),
    windowObject['addEventListener']?.('pagehide', handler2, { once: true }),
    handler2
  );
}
