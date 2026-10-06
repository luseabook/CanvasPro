import { modelPricingCache, resolveModelPricingContext } from '../../../api/modelPricingApi.js';
import { formatBinghuoUnitPrice } from '../../services/binghuoPricingPresentation.js';
import { priceText } from '../../services/modelPricingText.js';
const requests = new WeakMap();
export function syncModelMenuPrices(
  value,
  item,
  { cache: cache = modelPricingCache, resolveContext: resolveContext = resolveModelPricingContext } = {},
) {
  for (const provider of item) {
    const model = provider.dataset?.credentialModel || provider.dataset?.value,
      event = resolveContext({ model: model, provider: provider.dataset?.provider });
    if (event?.provider !== 'binghuo') continue;
    const el = provider.querySelector?.('.fmi-title');
    if (!el?.ownerDocument?.createElement) continue;
    const key = {};
    requests.set(provider, key);
    let el2 = el.querySelector('[data-local-model-price]');
    if (!el2) {
      ((el2 = el.ownerDocument.createElement('span')),
        (el2.className = 'node-menu-price'),
        (el2.dataset.localModelPrice = 'true'));
      const el3 = el.ownerDocument.createElement('span');
      ((el3.className = 'node-menu-priced-name'),
        (el3.textContent = el.textContent),
        el.classList.add('node-menu-priced-title'),
        el.replaceChildren(el3, el2));
    }
    const run = (index, result = false) => {
        ((el2.textContent = index
          ? formatBinghuoUnitPrice(index.data, event)
          : priceText(result ? 'unavailable' : 'loading')),
          (el2.title = result ? priceText(index ? 'refreshFailed' : 'unavailable') : priceText('listed')));
      },
      data = cache.peek(event);
    run(data);
    if (!cache.stale(data)) continue;
    const run2 = () =>
      requests.get(provider) === key &&
      provider.isConnected &&
      value.contains(provider) &&
      resolveContext({
        model: provider.dataset?.credentialModel || provider.dataset?.value,
        provider: provider.dataset?.provider,
      })?.key === event.key;
    cache.ensure(event)
      .then((options) => {
        if (run2()) run(options, cache.stale(options));
      })
      .catch(() => {
        if (run2()) run(data, true);
      });
  }
}
