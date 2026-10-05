import { bindGenerationPriceControl } from './generationPriceControl.js';
import { resolveGenerationPriceContext } from '../../services/generationPriceContext.js';
export function bindWorkspacePrices(el, list) {
  const map = new Map();
  let value = false,
    enabled = false;
  const syncPrices = () => {
      if (value) return;
      for (const [enabled2, item] of map) {
        (!el['contains'](enabled2) ||
          !enabled2['previousElementSibling']?.['classList']['contains']('generation-model-price')) &&
          (item['destroy'](), map['delete'](enabled2));
      }
      for (const { selector: selector, getData: getData } of list) {
        for (const key of el?.['querySelectorAll']?.(selector) || []) {
          if (!map['has'](key))
            map['set'](
              key,
              bindGenerationPriceControl(key, {
                getContext: () => resolveGenerationPriceContext(getData(key)),
              }),
            );
        }
      }
      map['forEach']((index) => index['sync']());
    },
    result = list['map']((data) => data['selector'])['join'](','),
    handler = () => {
      if (enabled || value) return;
      ((enabled = true),
        queueMicrotask(() => {
          ((enabled = false), syncPrices());
        }));
    };
  (el?.['addEventListener']?.('input', handler), el?.['addEventListener']?.('change', handler));
  const run = el?.['ownerDocument']?.['defaultView']?.['MutationObserver'],
    options = run
      ? new run((list2) => {
          const target = list2['some']((args) =>
            [...args['addedNodes'], ...args['removedNodes']]['some'](
              (el2) => el2['matches']?.(result) || el2['querySelector']?.(result),
            ),
          );
          if (target) handler();
        })
      : null;
  return (
    options?.['observe'](el, { childList: true, subtree: true }),
    syncPrices(),
    {
      syncPrices: syncPrices,
      destroy() {
        (el?.['removeEventListener']?.('input', handler),
          el?.['removeEventListener']?.('change', handler),
          (value = true),
          options?.['disconnect'](),
          map['forEach']((source) => source['destroy']()),
          map['clear']());
      },
    }
  );
}
