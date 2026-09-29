import { rendererStartupState } from './rendererStartupState.js';
export const STARTUP_LOADER_HARD_DEADLINE_MS = 0x2710;
const STARTUP_LOADER_GUARD_CANCEL_KEY = '__aicCancelStartupLoaderGuard';
function revealAppShell(_0x3ea0a0) {
  const _0x248a39 = _0x3ea0a0?.['getElementById']?.('v2-initial-loader');
  if (!_0x248a39) return ![];
  const _0x7df849 = _0x3ea0a0['getElementById']?.('v2-wrap'),
    _0x3d7684 = _0x3ea0a0['getElementById']?.('v2-canvas') || _0x3ea0a0['querySelector']?.('.v2-canvas');
  if (_0x3d7684) _0x3d7684['style']['transition'] = '';
  return (
    _0x7df849 &&
      ((_0x7df849['style']['transition'] = ''),
      (_0x7df849['style']['opacity'] = '1'),
      _0x7df849['classList']?.['remove']?.('is-initial-header-locked')),
    (_0x248a39['dataset']['failOpen'] = 'true'),
    (_0x248a39['style']['opacity'] = '0'),
    (_0x248a39['style']['visibility'] = 'hidden'),
    _0x248a39['remove']?.(),
    !![]
  );
}
export function cancelStartupLoaderGuard(_0x40cc78 = globalThis['window']) {
  const _0x449ab4 = _0x40cc78?.[STARTUP_LOADER_GUARD_CANCEL_KEY];
  if (typeof _0x449ab4 === 'function') _0x449ab4();
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
  let _0x36444c = !![],
    _0x2b5d28 = ![],
    _0x51faff = () => {};
  const _0x2e8915 = (_0x5ba050) => {
      const _0x4f1be4 = documentObject?.['getElementById']?.('v2-initial-loader');
      if (!_0x4f1be4 || _0x5ba050['ready']) return;
      _0x4f1be4['dataset']['startupState'] = _0x5ba050['failure'] ? 'failed' : _0x5ba050['phase'];
      if (_0x5ba050['failure']) windowObject['hideGlobalLoading']?.();
      _0x4f1be4['setAttribute']?.('aria-busy', String(!_0x5ba050['failure']));
      const _0x51d04f = _0x4f1be4['querySelector']?.('.brand-loader-tagline');
      _0x51d04f &&
        (_0x51d04f['removeAttribute']?.('data-i18n'),
        (_0x51d04f['textContent'] = _0x5ba050['failure']
          ? '画布未能完成加载，请关闭后重新打开；若仍失败，请导出诊断包。'
          : _0x5ba050['phase'] === 'storage-migration'
            ? '正在恢复升级前的数据，请稍候…'
            : '正在加载画布，请稍候…'),
        _0x4f1be4['removeAttribute']?.('data-i18n-aria-label'),
        _0x4f1be4['setAttribute']?.('aria-label', _0x51d04f['textContent']));
    },
    _0xfb7085 = scheduleTimeout(
      () => {
        if (!_0x36444c) return;
        if (!startup['snapshot']()['ready']) {
          ((_0x2b5d28 = !![]),
            _0x2e8915(startup['snapshot']()),
            warn?.(
              '[startup]\x20Still\x20waiting\x20for\x20' +
                startup['snapshot']()['phase'] +
                '; app remains locked.',
            ));
          return;
        }
        if (!revealAppShell(documentObject)) return;
        (_0x1fd4d6(),
          windowObject['hideGlobalLoading']?.(),
          warn?.(
            '[startup] Initial loader exceeded ' +
              timeoutMs +
              'ms\x20before\x20startup\x20completed\x20and\x20was\x20dismissed.',
          ));
      },
      Math['max'](0x0, Number(timeoutMs) || STARTUP_LOADER_HARD_DEADLINE_MS),
    ),
    _0x1fd4d6 = () => {
      if (!_0x36444c) return;
      _0x36444c = ![];
      if (typeof cancelTimeout === 'function') cancelTimeout(_0xfb7085);
      (_0x51faff(),
        windowObject['removeEventListener']?.('pagehide', _0x1fd4d6),
        windowObject[STARTUP_LOADER_GUARD_CANCEL_KEY] === _0x1fd4d6 &&
          delete windowObject[STARTUP_LOADER_GUARD_CANCEL_KEY]);
    };
  return (
    (windowObject[STARTUP_LOADER_GUARD_CANCEL_KEY] = _0x1fd4d6),
    (_0x51faff = startup['subscribe']((_0x4d27ba) => {
      if (_0x4d27ba['failure'] || _0x2b5d28) _0x2e8915(_0x4d27ba);
    })),
    windowObject['addEventListener']?.('pagehide', _0x1fd4d6, { once: !![] }),
    _0x1fd4d6
  );
}
