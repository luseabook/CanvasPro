import appStore from '../core/stores/appStore.js';
function getStateSnapshot() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function normalizeIds(value) {
  return (Array.isArray(value) ? value : [value])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}
export function persistToolbarResultNodes() {
  try {
    globalThis.window?._triggerLocalCacheSave?.();
  } catch {}
}
export function selectToolbarResultNodes(key) {
  const list = normalizeIds(key);
  if (!list.length) return [];
  return (appStore.setSelectedNodes(list), list);
}
export function addToolbarPendingResultNodes({ nodes: nodes = [], persist: persist = true } = {}) {
  const list2 = (Array.isArray(nodes) ? nodes : [nodes]).filter(
    (index) => index && typeof index === 'object' && String(index.id || '').trim(),
  );
  if (!list2.length) return [];
  const run = () => {
    list2.forEach((result) => appStore.addNode(result));
  };
  typeof appStore.batch === 'function' && list2.length > 1 ? appStore.batch(run) : run();
  const data = list2.map((options) => options.id);
  selectToolbarResultNodes(data);
  if (persist) persistToolbarResultNodes();
  return data;
}
export function updateToolbarResultNode(target, enabled) {
  const enabled2 = String(target || '').trim();
  if (!enabled2 || !enabled || typeof enabled !== 'object') return false;
  if (!getStateSnapshot().nodes?.[enabled2]) return false;
  return (appStore.updateNodeData(enabled2, enabled), true);
}
export function updateToolbarResultNodes(list3 = []) {
  const list4 = (Array.isArray(list3) ? list3 : []).filter(
    (source) =>
      String(source?.nodeId || source?.id || '').trim() &&
      source?.patch &&
      typeof source.patch === 'object',
  );
  if (!list4.length) return;
  const run2 = () => {
    list4.forEach((next) => {
      updateToolbarResultNode(next.nodeId || next.id, next.patch);
    });
  };
  typeof appStore.batch === 'function' && list4.length > 1 ? appStore.batch(run2) : run2();
}
