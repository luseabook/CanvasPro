import { graphStore } from '../../core/stores/appStore.js';
import { bindGenerationPriceControl } from './generationPriceControl.js';
import { resolveGenerationPriceContext } from '../../services/generationPriceContext.js';
export function bindGenerationNodePricing(value, { store: store = graphStore, cache: cache } = {}) {
  const bindGenerationPriceControl2 = bindGenerationPriceControl(value?.btnEl, {
    cache: cache,
    getContext() {
      const nodes = store.getState();
      return resolveGenerationPriceContext(nodes.nodes?.[value.nodeId] || value._data || {}, {
        edges: store.getIncomingEdges?.(value.nodeId) || [],
        nodes: nodes.nodes,
      });
    },
    subscribe: (item) =>
      store.subscribeSelector(
        (state) => [
          state.nodes?.[value.nodeId],
          state._edgesRev,
          ...(store.getIncomingEdges?.(value.nodeId) || []).map(
            (key) => state.nodes?.[key.sourceId],
          ),
        ],
        item,
      ),
  });
  return bindGenerationPriceControl2.destroy;
}
