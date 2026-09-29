import { buildApimartPriceView } from './apimartPricingPresentation.js';
import { formatPrice, priceText } from './modelPricingText.js';
import { buildBinghuoPriceView } from './binghuoPricingPresentation.js';
export function buildModelPriceView(_0xa3ae52, _0x25afd2) {
  if (_0x25afd2['provider'] === 'binghuo') return buildBinghuoPriceView(_0xa3ae52, _0x25afd2);
  if (_0x25afd2['provider'] !== 'runninghub')
    return { ...buildApimartPriceView(_0xa3ae52, _0x25afd2), currency: 'USD' };
  const _0x1eed4f = _0xa3ae52['isFreeThisCall'] ? 0x0 : _0xa3ae52['estimatedPrice'],
    _0xfda9a = priceText('reference'),
    _0x1eeb3f = formatPrice(_0x1eed4f, _0xa3ae52['currency']);
  return {
    label: _0xfda9a + '\x20' + _0x1eeb3f,
    prefix: _0xfda9a,
    amountText: _0x1eeb3f,
    estimate: _0x1eed4f,
    currency: _0xa3ae52['currency'],
    rows: [],
    notes: [
      priceText('listed'),
      ...(_0xa3ae52['excludesReferenceUsage']
        ? [priceText(_0xa3ae52['referenceBasis'] === 'textToImage' ? 'textToImageQuote' : 'parameterQuote')]
        : []),
      priceText('variable'),
    ],
  };
}
