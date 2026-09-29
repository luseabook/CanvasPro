import { graphStore } from '../../core/stores/appStore.js';
import { bindGenerationPriceControl } from './generationPriceControl.js';
import { resolveGenerationPriceContext } from '../../services/generationPriceContext.js';
export function bindGenerationNodePricing(_0x59cead, { store: store = graphStore, cache: _0x235439 } = {}) {
  const _0x26d3f5 = bindGenerationPriceControl(_0x59cead?.['btnEl'], {
    cache: _0x235439,
    getContext() {
      const _0x4c938f = store['getState']();
      return resolveGenerationPriceContext(
        _0x4c938f['nodes']?.[_0x59cead['nodeId']] || _0x59cead['_data'] || {},
        { edges: store['getIncomingEdges']?.(_0x59cead['nodeId']) || [], nodes: _0x4c938f['nodes'] },
      );
    },
    subscribe: (_0x5bb20c) =>
      store['subscribeSelector'](
        (_0x28ecc7) => [
          _0x28ecc7['nodes']?.[_0x59cead['nodeId']],
          _0x28ecc7['_edgesRev'],
          ...(store['getIncomingEdges']?.(_0x59cead['nodeId']) || [])['map'](
            (_0x1b26ce) => _0x28ecc7['nodes']?.[_0x1b26ce['sourceId']],
          ),
        ],
        _0x5bb20c,
      ),
  });
  return _0x26d3f5['destroy'];
}
