import { modelMenuPreferenceStore } from '../../core/stores/modelMenuPreferenceStore.js';
export function publishAppRuntimeInfo({
  runtimeInfo: runtimeInfo = {},
  windowObject: windowObject = globalThis.window,
  EventCtor: EventCtor = globalThis.CustomEvent,
} = {}) {
  if (!windowObject) return;
  (modelMenuPreferenceStore.initialize(runtimeInfo?.localVersion),
    (windowObject.AI_CANVAS_IS_DEV_BUILD = Boolean(runtimeInfo?.isDevBuild)),
    (windowObject.ADVANCED_MODE = Boolean(runtimeInfo?.isAdvancedMode)),
    typeof windowObject.dispatchEvent === 'function' &&
      typeof EventCtor === 'function' &&
      windowObject.dispatchEvent(new EventCtor('aicanvas:runtime-info', { detail: runtimeInfo })));
}
export async function initAppRuntimeInfo({
  fetchAppRuntimeInfo: fetchAppRuntimeInfo,
  initDevEntries: initDevEntries,
  windowObject: windowObject = globalThis.window,
  EventCtor: EventCtor = globalThis.CustomEvent,
} = {}) {
  try {
    const runtimeInfo2 = await fetchAppRuntimeInfo?.();
    return (
      publishAppRuntimeInfo({ runtimeInfo: runtimeInfo2, windowObject: windowObject, EventCtor: EventCtor }),
      initDevEntries?.({ isDevBuild: Boolean(runtimeInfo2?.isDevBuild) }),
      runtimeInfo2
    );
  } catch (value) {
    const runtimeInfo3 = { isDevBuild: false, isAdvancedMode: false };
    return (
      publishAppRuntimeInfo({ runtimeInfo: runtimeInfo3, windowObject: windowObject, EventCtor: EventCtor }),
      initDevEntries?.({ isDevBuild: false }),
      runtimeInfo3
    );
  }
}
