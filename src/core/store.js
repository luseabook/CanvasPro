import appStore, { createStore } from './stores/appStore.js';
let hasWarnedLegacyEntry = false;
function warnLegacyEntryOnce() {
  if (hasWarnedLegacyEntry) return;
  hasWarnedLegacyEntry = true;
  try {
    console.warn(
      '[store] `src/core/store.js` 已进入兼容阶段，请迁移到 `src/core/stores/appStore.js` 或 graph/ui/workspace 分域入口。',
    );
  } catch {}
}
warnLegacyEntryOnce();
export default appStore;
export { createStore };
