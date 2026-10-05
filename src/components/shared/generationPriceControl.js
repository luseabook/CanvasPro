import { API_CONFIG_CHANGED_EVENT } from '../../../api/configApi.js';
import { modelPricingCache } from '../../../api/modelPricingApi.js';
import { buildModelPriceView } from '../../services/modelPricingPresentation.js';
import { priceText } from '../../services/modelPricingText.js';
import { onLocaleChange } from '../../i18n/index.js';
import { bindModelPriceDetails } from './modelPriceDetails.js';
export function bindGenerationPriceControl(
  el,
  { getContext: getContext, subscribe: subscribe, cache: cache = modelPricingCache } = {},
) {
  if (!el?.['ownerDocument']?.['createElement'] || !el['parentNode']) return { sync() {}, destroy() {} };
  const el2 = el['ownerDocument'],
    el3 = el2['defaultView'],
    el4 = el2['createElement']('button');
  ((el4['type'] = 'button'), (el4['className'] = 'generation-model-price'), (el4['hidden'] = !![]));
  const el5 = el2['createElement']('span');
  el5['className'] = 'generation-model-price-label';
  const el6 = el2['createElement']('span');
  el6['className'] = 'generation-model-price-amount';
  const el7 = el2['createElement']('span');
  ((el7['className'] = 'generation-model-price-icon'),
    (el7['textContent'] = 'ⓘ'),
    el7['setAttribute']('aria-hidden', 'true'),
    el4['append'](el5, el6, el7),
    el['before'](el4));
  let title = null,
    value = null,
    enabled = ![],
    item = '',
    enabled2 = ![],
    enabled3 = ![],
    enabled4 = ![],
    key = 0,
    enabled5 = ![],
    setTimeout2,
    bindModelPriceDetails2;
  const run = () => ({
      ...(value && title
        ? buildModelPriceView(value['data'], title)
        : { label: priceText('price'), rows: [], notes: [], estimate: null }),
      title: title ? title['label'] + ' · ' + title['model'] : priceText('price'),
      status: [
        enabled2 ? priceText('loading') : '',
        enabled ? priceText(value ? 'refreshFailed' : 'unavailable') : '',
        enabled ? item : '',
        value
          ? (cache['stale'](value) ? priceText('stale') : priceText('updated')) +
            ' · ' +
            new Date(value['fetchedAt'])['toLocaleString']()
          : '',
      ]
        ['filter'](Boolean)
        ['join']('\n'),
    }),
    handler = () => {
      if (enabled3) return;
      ((el4['hidden'] = !title), el4['setAttribute']('aria-busy', String(enabled2)));
      const enabled6 = value ? run() : null;
      ((el5['textContent'] = enabled6?.['amountText']
        ? enabled6['prefix'] + ' '
        : enabled6?.['label'] || priceText(enabled ? 'unavailable' : 'price')),
        (el6['textContent'] = enabled6?.['amountText'] || ''),
        (el6['hidden'] = !enabled6?.['amountText']),
        (el7['hidden'] = title?.['kind'] !== 'text' && !enabled2),
        (el7['textContent'] = title?.['kind'] === 'text' ? 'ⓘ' : ''),
        el4['setAttribute']('aria-label', priceText('price') + ' · ' + (title?.['label'] || '')),
        bindModelPriceDetails2?.['render']());
    },
    handler2 = () => {
      if (enabled3 || !title || enabled2 || !enabled4) return;
      value = cache['peek'](title);
      if (!cache['stale'](value)) {
        handler();
        return;
      }
      ((enabled2 = !![]), handler());
      const index = key;
      cache['ensure'](title)
        ['then']((result) => {
          if (enabled3 || index !== key) return;
          ((value = result), (enabled = cache['stale'](result)));
        })
        ['catch']((error) => {
          !enabled3 && index === key && ((enabled = !![]), (item = error['message'] || ''));
        })
        ['finally'](() => {
          !enabled3 && index === key && ((enabled2 = ![]), handler());
        });
    },
    handler3 = () => {
      if (enabled3) return;
      const event = getContext();
      (event?.['key'] !== title?.['key'] &&
        ((key += 1),
        (enabled2 = ![]),
        (enabled = ![]),
        (item = ''),
        bindModelPriceDetails2?.['close'](),
        (value = event ? cache['peek'](event) : null)),
        (title = event),
        handler(),
        clearTimeout(setTimeout2),
        (setTimeout2 = setTimeout(handler2, title?.['debounceMs'] || 0)));
    },
    sync2 = () => {
      if (enabled5) return;
      ((enabled5 = !![]),
        queueMicrotask(() => {
          ((enabled5 = ![]), handler3());
        }));
    };
  bindModelPriceDetails2 = bindModelPriceDetails(el4, run, () => {
    ((enabled4 = !![]), handler2());
  });
  const data = el3['IntersectionObserver']
    ? new el3['IntersectionObserver'](([options]) => {
        enabled4 = options['isIntersecting'];
        if (enabled4) handler3();
        else bindModelPriceDetails2['close']();
      })
    : null;
  data?.['observe'](el);
  const target = subscribe?.(sync2);
  el3['addEventListener'](API_CONFIG_CHANGED_EVENT, sync2);
  const run2 = onLocaleChange(handler);
  return (
    handler3(),
    {
      sync: sync2,
      destroy() {
        ((enabled3 = !![]),
          (key += 1),
          clearTimeout(setTimeout2),
          data?.['disconnect'](),
          target?.(),
          run2(),
          el3['removeEventListener'](API_CONFIG_CHANGED_EVENT, sync2),
          bindModelPriceDetails2['destroy'](),
          el4['remove']());
      },
    }
  );
}
