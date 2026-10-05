import { buildApimartPriceView } from './apimartPricingPresentation.js';
import { formatPrice, priceText } from './modelPricingText.js';
import { buildBinghuoPriceView } from './binghuoPricingPresentation.js';
export function buildModelPriceView(currency, value) {
  if (value['provider'] === 'binghuo') return buildBinghuoPriceView(currency, value);
  if (value['provider'] !== 'runninghub')
    return { ...buildApimartPriceView(currency, value), currency: 'USD' };
  const estimate = currency['isFreeThisCall'] ? 0 : currency['estimatedPrice'],
    label = priceText('reference'),
    amountText = formatPrice(estimate, currency['currency']);
  return {
    label: label + ' ' + amountText,
    prefix: label,
    amountText: amountText,
    estimate: estimate,
    currency: currency['currency'],
    rows: [],
    notes: [
      priceText('listed'),
      ...(currency['excludesReferenceUsage']
        ? [priceText(currency['referenceBasis'] === 'textToImage' ? 'textToImageQuote' : 'parameterQuote')]
        : []),
      priceText('variable'),
    ],
  };
}
