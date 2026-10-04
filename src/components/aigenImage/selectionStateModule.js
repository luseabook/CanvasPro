import { shouldAlwaysShowImageRefBar } from './imageNodeManifestPolicies.js';
export function createAIGenerateNodeSelectionStateModule({ store: store } = {}) {
  class value {
    ['syncSelectionState']({ selected: selected = ![], visible: visible = !![] } = {}) {
      const item =
          typeof store?.['getStateRaw'] === 'function'
            ? store['getStateRaw']()
            : store?.['getState']?.() || {},
        key = item?.['pickConnectMode'] || {},
        enabled =
          selected === !![] ||
          (key['active'] && key['sourceNodeId'] === this['nodeId']) ||
          shouldAlwaysShowImageRefBar(this['_data']?.['model']);
      if (visible !== !![] || this['_rendererMediaDeferred'] === !![] || !enabled)
        return ((this['_renderRefBarPendingWhenVisible'] = !![]), ![]);
      if (this['_renderRefBarPendingWhenVisible'] !== !![]) return ![];
      return ((this['_renderRefBarPendingWhenVisible'] = ![]), void this['_renderRefBar'](), !![]);
    }
  }
  return value['prototype'];
}
