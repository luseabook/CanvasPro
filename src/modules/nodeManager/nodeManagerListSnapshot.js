import { resolveAssetNodeCoverUrl } from '../assetCoverResolver.js';
import { resolveNodeManagerName } from './nodeManagerModel.js';
export function createNodeManagerListSnapshot() {
  let map = new Map(),
    list = [],
    byId = new Map();
  return {
    read(options = {}) {
      const map2 = new Map(),
        list2 = Object.keys(options);
      let changed = list2.length !== list.length;
      (list2.forEach((value, item) => {
        const node = options[value],
          enabled = map.get(value);
        let key = enabled;
        if (!enabled || enabled.node !== node || enabled.bizRev !== node?._bizRev) {
          let coverUrl = '';
          try {
            coverUrl = resolveAssetNodeCoverUrl(node || {});
          } catch {}
          const index = {
              id: String(node?.id || value),
              type: String(node?.type || ''),
              name: resolveNodeManagerName(node, value),
              parentId: String(node?.parentId || ''),
              coverUrl: coverUrl,
            },
            presentation =
              enabled &&
              Object.keys(index).every((result) => enabled.presentation[result] === index[result]);
          key = {
            node: node,
            bizRev: node?._bizRev,
            presentation: presentation ? enabled.presentation : index,
          };
        }
        if (list2[item] !== list[item] || key.presentation !== enabled?.presentation) changed = true;
        map2.set(value, key);
      }),
        (map = map2),
        (list = list2));
      if (changed)
        byId = new Map(
          [...map.values()].map((data) => [data.presentation.id, data.presentation]),
        );
      return { changed: changed, byId: byId };
    },
    clear() {
      (map.clear(), (list = []), (byId = new Map()));
    },
  };
}
