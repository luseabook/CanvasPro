function normalizeNodeId(value) {
  return String(value || '').trim();
}
function hasGenerationRuntimeMethod(options2 = {}) {
  return (
    typeof options2.runGeneration === 'function' ||
    typeof options2.getGenerationStatus === 'function' ||
    typeof options2.cancelGeneration === 'function' ||
    typeof options2.resumeGeneration === 'function'
  );
}
export function createNodeRuntimeRegistry() {
  const map = new Map(),
    runtimeResolvers = new Map();
  return {
    registerResolver(nodeType, resolver) {
      if (typeof resolver !== 'function') throw new TypeError('Node runtime resolver must be a function');
      return (
        runtimeResolvers.set(nodeType, resolver),
        () => {
          if (runtimeResolvers.get(nodeType) === resolver) runtimeResolvers.delete(nodeType);
        }
      );
    },
    resolve(nodeId, options = {}) {
      const normalizedId = normalizeNodeId(nodeId),
        nodeRecord =
          options.store?.getStateRaw?.()?.nodes?.[normalizedId] ||
          options.store?.getState?.()?.nodes?.[normalizedId];
      if (nodeRecord && runtimeResolvers.has(nodeRecord.type))
        return runtimeResolvers.get(nodeRecord.type)(normalizedId, options);
      return normalizedId ? map.get(normalizedId) || null : null;
    },
    register(item, enabled = {}) {
      const nodeId2 = normalizeNodeId(item);
      if (!nodeId2 || !enabled || typeof enabled !== 'object') return null;
      if (!hasGenerationRuntimeMethod(enabled)) return null;
      return (map.set(nodeId2, enabled), enabled);
    },
    unregister(key) {
      const nodeId3 = normalizeNodeId(key);
      if (!nodeId3) return false;
      return map.delete(nodeId3);
    },
    get(index) {
      const nodeId4 = normalizeNodeId(index);
      return nodeId4 ? map.get(nodeId4) || null : null;
    },
    clear() {
      map.clear();
    },
  };
}
export const nodeRuntimeRegistry = createNodeRuntimeRegistry();
export default nodeRuntimeRegistry;
