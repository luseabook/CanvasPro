import { modelMenuPreferenceStore } from '../../core/stores/modelMenuPreferenceStore.js';
export function publishAppRuntimeInfo({
  runtimeInfo: runtimeInfo = {},
  windowObject: windowObject = globalThis['window'],
  EventCtor: EventCtor = globalThis['CustomEvent'],
} = {}) {
  if (!windowObject) return;
  (modelMenuPreferenceStore['initialize'](runtimeInfo?.['localVersion']),
    (windowObject['AI_CANVAS_IS_DEV_BUILD'] = Boolean(runtimeInfo?.['isDevBuild'])),
    (windowObject['ADVANCED_MODE'] = Boolean(runtimeInfo?.['isAdvancedMode'])),
    typeof windowObject['dispatchEvent'] === 'function' &&
      typeof EventCtor === 'function' &&
      windowObject['dispatchEvent'](new EventCtor('aicanvas:runtime-info', { detail: runtimeInfo })));
}
export async function initAppRuntimeInfo({
  fetchAppRuntimeInfo: _0x2d902f,
  initDevEntries: _0x4d1a36,
  windowObject: windowObject = globalThis['window'],
  EventCtor: EventCtor = globalThis['CustomEvent'],
} = {}) {
  try {
    const _0xefd17e = await _0x2d902f?.();
    return (
      publishAppRuntimeInfo({ runtimeInfo: _0xefd17e, windowObject: windowObject, EventCtor: EventCtor }),
      _0x4d1a36?.({ isDevBuild: Boolean(_0xefd17e?.['isDevBuild']) }),
      _0xefd17e
    );
  } catch (_0xcc0209) {
    const _0x35939a = { isDevBuild: ![], isAdvancedMode: ![] };
    return (
      publishAppRuntimeInfo({ runtimeInfo: _0x35939a, windowObject: windowObject, EventCtor: EventCtor }),
      _0x4d1a36?.({ isDevBuild: ![] }),
      _0x35939a
    );
  }
}
