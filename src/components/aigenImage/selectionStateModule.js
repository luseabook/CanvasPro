import { shouldAlwaysShowImageRefBar } from './imageNodeManifestPolicies.js';
export function createAIGenerateNodeSelectionStateModule({ store: _0x557cad } = {}) {
  class _0x73c16 {
    ['syncSelectionState']({ selected: selected = ![], visible: visible = !![] } = {}) {
      const _0x50623f =
          typeof _0x557cad?.['getStateRaw'] === 'function'
            ? _0x557cad['getStateRaw']()
            : _0x557cad?.['getState']?.() || {},
        _0x17b0fb = _0x50623f?.['pickConnectMode'] || {},
        _0x891bf5 =
          selected === !![] ||
          (_0x17b0fb['active'] && _0x17b0fb['sourceNodeId'] === this['nodeId']) ||
          shouldAlwaysShowImageRefBar(this['_data']?.['model']);
      if (visible !== !![] || this['_rendererMediaDeferred'] === !![] || !_0x891bf5)
        return ((this['_renderRefBarPendingWhenVisible'] = !![]), ![]);
      if (this['_renderRefBarPendingWhenVisible'] !== !![]) return ![];
      return ((this['_renderRefBarPendingWhenVisible'] = ![]), void this['_renderRefBar'](), !![]);
    }
  }
  return _0x73c16['prototype'];
}
