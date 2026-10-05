import { shouldAlwaysShowImageRefBar } from './imageNodeManifestPolicies.js';
export function createAIGenerateNodeSelectionStateModule({ store: store } = {}) {
  class value {
    ['syncSelectionState']({ selected: selected = false, visible: visible = true } = {}) {
      const item =
          typeof store?.['getStateRaw'] === 'function'
            ? store['getStateRaw']()
            : store?.['getState']?.() || {},
        key = item?.['pickConnectMode'] || {},
        enabled =
          selected === true ||
          (key['active'] && key['sourceNodeId'] === this['nodeId']) ||
          shouldAlwaysShowImageRefBar(this['_data']?.['model']);
      if (visible !== true || this['_rendererMediaDeferred'] === true || !enabled)
        return ((this['_renderRefBarPendingWhenVisible'] = true), false);
      if (this['_renderRefBarPendingWhenVisible'] !== true) return false;
      return ((this['_renderRefBarPendingWhenVisible'] = false), void this['_renderRefBar'](), true);
    }
  }
  return value['prototype'];
}
