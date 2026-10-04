import { formatPrice, priceText } from './modelPricingText.js';
export function formatBinghuoUnitPrice(value, item) {
  const priceText2 = priceText(
    value['billing'] === 'per_second' ? 'cnySecond' : item['kind'] === 'image' ? 'cnyImage' : 'cnyCall',
  );
  return priceText2['startsWith']('CNY')
    ? value['amount'] + '\x20' + priceText2
    : '' + value['amount'] + priceText2['replace'](/\s/g, '');
}
export function buildBinghuoPriceView(key, index) {
  const enabled = key['billing'] === 'per_second',
    priceText3 = priceText(enabled ? 'cnySecond' : index['kind'] === 'image' ? 'cnyImage' : 'cnyCall'),
    count = Number(index['params']['batchSize'] ?? index['params']['n'] ?? 0x1),
    count2 = Number(index['params']['duration']),
    result = enabled ? count2 * count : count,
    data =
      Number['isInteger'](count) && count > 0x0 && (!enabled || count2 > 0x0) && Number['isFinite'](result)
        ? key['amount'] * result
        : null,
    priceText4 = priceText('reference'),
    options = data === null ? key['amount'] + '\x20' + priceText3 : formatPrice(data, 'CNY');
  return {
    label: priceText4 + '\x20' + options,
    prefix: priceText4,
    amountText: options,
    estimate: data,
    currency: 'CNY',
    rows: [{ label: index['model'], amount: key['amount'], unit: priceText3, section: '' }],
    notes: [priceText('listed'), priceText('variable')],
  };
}
