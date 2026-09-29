import { modelPricingCache, resolveModelPricingContext } from '../../../api/modelPricingApi.js';
import { formatBinghuoUnitPrice } from '../../services/binghuoPricingPresentation.js';
import { priceText } from '../../services/modelPricingText.js';
const requests = new WeakMap();
export function syncModelMenuPrices(
  _0x129bff,
  _0x3e4601,
  { cache: cache = modelPricingCache, resolveContext: resolveContext = resolveModelPricingContext } = {},
) {
  for (const _0x47f03c of _0x3e4601) {
    const _0x2fc5cf = _0x47f03c['dataset']?.['credentialModel'] || _0x47f03c['dataset']?.['value'],
      _0x33ee5d = resolveContext({ model: _0x2fc5cf, provider: _0x47f03c['dataset']?.['provider'] });
    if (_0x33ee5d?.['provider'] !== 'binghuo') continue;
    const _0x220029 = _0x47f03c['querySelector']?.('.fmi-title');
    if (!_0x220029?.['ownerDocument']?.['createElement']) continue;
    const _0x3ec373 = {};
    requests['set'](_0x47f03c, _0x3ec373);
    let _0x1b06e9 = _0x220029['querySelector']('[data-local-model-price]');
    if (!_0x1b06e9) {
      ((_0x1b06e9 = _0x220029['ownerDocument']['createElement']('span')),
        (_0x1b06e9['className'] = 'node-menu-price'),
        (_0x1b06e9['dataset']['localModelPrice'] = 'true'));
      const _0x2662f1 = _0x220029['ownerDocument']['createElement']('span');
      ((_0x2662f1['className'] = 'node-menu-priced-name'),
        (_0x2662f1['textContent'] = _0x220029['textContent']),
        _0x220029['classList']['add']('node-menu-priced-title'),
        _0x220029['replaceChildren'](_0x2662f1, _0x1b06e9));
    }
    const _0x96f692 = (_0x176352, _0x4d9fe0 = ![]) => {
        ((_0x1b06e9['textContent'] = _0x176352
          ? formatBinghuoUnitPrice(_0x176352['data'], _0x33ee5d)
          : priceText(_0x4d9fe0 ? 'unavailable' : 'loading')),
          (_0x1b06e9['title'] = _0x4d9fe0
            ? priceText(_0x176352 ? 'refreshFailed' : 'unavailable')
            : priceText('listed')));
      },
      _0xedfea7 = cache['peek'](_0x33ee5d);
    _0x96f692(_0xedfea7);
    if (!cache['stale'](_0xedfea7)) continue;
    const _0x7c0eec = () =>
      requests['get'](_0x47f03c) === _0x3ec373 &&
      _0x47f03c['isConnected'] &&
      _0x129bff['contains'](_0x47f03c) &&
      resolveContext({
        model: _0x47f03c['dataset']?.['credentialModel'] || _0x47f03c['dataset']?.['value'],
        provider: _0x47f03c['dataset']?.['provider'],
      })?.['key'] === _0x33ee5d['key'];
    cache['ensure'](_0x33ee5d)
      ['then']((_0x3409b1) => {
        if (_0x7c0eec()) _0x96f692(_0x3409b1, cache['stale'](_0x3409b1));
      })
      ['catch'](() => {
        if (_0x7c0eec()) _0x96f692(_0xedfea7, !![]);
      });
  }
}
