import { formatPrice, priceText } from './modelPricingText.js';
const valid = (count) => typeof count === 'number' && Number['isFinite'](count) && count >= 0x0,
  effective = (value, item) => (valid(value) && valid(item) ? (value * item) / 0x64 : null),
  same = (key, index) => String(key ?? '')['toLowerCase']() === String(index ?? '')['toLowerCase']();
function tokenRows(args) {
  const list = [],
    result = args['price_factor'],
    handler = (data, options, section) => {
      for (const list2 of new Set([...Object['keys'](data || {}), ...Object['keys'](options || {})])) {
        if (list2 === 'up_to_input_tokens') continue;
        if (list2['includes']('cached') && args['limits']?.['supports_cache_read'] === ![]) continue;
        if (list2['startsWith']('cache_write') && args['limits']?.['supports_cache_write'] === ![]) continue;
        const amount = valid(options?.[list2])
          ? options[list2]
          : valid(data?.[list2]) && valid(result)
            ? data[list2] * result
            : null;
        if (valid(amount))
          list['push']({
            label: priceText(list2),
            amount: amount,
            unit: priceText('tokenUnit'),
            section: section,
          });
      }
    };
  if (args['tier_count'] > 0x1 && Array['isArray'](args['tiers'])) {
    let target = 0x0;
    for (const source of args['tiers']) {
      const valid2 = valid(source['up_to_input_tokens']) ? source['up_to_input_tokens'] : null;
      (handler(source, null, priceText('tier') + '\x20' + target + '–' + (valid2 ?? priceText('unlimited'))),
        (target = valid2 === null ? target : valid2 + 0x1));
    }
  } else handler(args['rates'], args['effective_rates'], '');
  const enabled = { ...args['extras']?.['tools'] };
  if (args['extras']?.['google_web_search'] && !enabled['google_web_search'])
    enabled['google_web_search'] = args['extras']['google_web_search'];
  for (const [next, amount2] of Object['entries'](enabled)) {
    if (valid(amount2?.['price']) && valid(result))
      list['push']({
        label: priceText(next),
        amount: amount2['price'] * result,
        unit: priceText(amount2['unit']),
        section: '',
      });
  }
  const amount3 = args['extras']?.['context_cache_storage'];
  if (valid(amount3?.['price']))
    list['push']({
      label: priceText('storage'),
      amount: amount3['price'],
      unit: priceText(amount3['unit']),
      section: priceText('original'),
    });
  return list;
}
function mediaRows(current, entry) {
  const list3 = [],
    priceText2 = priceText(
      current['billing_type'] === 'per_second' ? 'second' : entry === 'image' ? 'image' : 'call',
    ),
    handler2 = (label, record, payload, unit = priceText2, table = '', path = []) => {
      if (!valid(record)) return;
      const amount4 = effective(record, payload);
      list3['push']({
        label: label,
        amount: amount4 ?? record,
        unit: unit,
        section: amount4 === null ? priceText('original') : '',
        table: table,
        path: path,
        quoted: amount4 !== null,
      });
    },
    handle = [
      ['version_resolution_prices', 'version_resolution_discounts'],
      ['resolution_duration_prices', 'resolution_duration_discounts'],
      ['resolution_prices', 'resolution_discounts'],
      ['size_quality_prices', 'size_quality_discounts'],
      ['billing_variants', 'billing_variant_discounts'],
      ['billing_tiers', 'billing_tier_discounts'],
      ['action_prices', 'action_discounts'],
      ['layer_decomposition_prices', 'layer_decomposition_discounts'],
      ['video_ref_per_second_prices', 'video_ref_discounts'],
    ],
    handler3 = (state, config, scope, args2 = []) => {
      for (const [input, output] of Object['entries'](state || {})) {
        const list4 = [...args2, input];
        if (output && typeof output === 'object') handler3(output, config?.[input], scope, list4);
        else
          handler2(
            list4['join'](' · '),
            output,
            config?.[input],
            scope === 'video_ref_per_second_prices'
              ? priceText('second')
              : scope === 'billing_tiers' && input['startsWith']('token')
                ? priceText('tokenUnit')
                : priceText2,
            scope,
            list4,
          );
      }
    };
  for (const [value2, value3] of handle) handler3(current[value2], current[value3], value2);
  if (valid(current['model_price']))
    handler2(priceText('reference'), current['model_price'], current['actual_discount'], priceText2, 'base');
  if (valid(current['input_image_price']))
    handler2(
      priceText('inputImage'),
      current['input_image_price'],
      current['input_image_actual_discount'],
      priceText('image'),
      'input',
    );
  for (const [value4, value5] of Object['entries'](current['operation_prices'] || {})) {
    handler2(value4, value5['model_price'], value5['actual_discount'], priceText('call'), 'operation');
  }
  return list3;
}
export function buildApimartPriceView(enabled2, value6) {
  const enabled3 = !!enabled2['pricing'],
    rows = enabled3 ? tokenRows(enabled2['pricing']) : mediaRows(enabled2, value6['kind']);
  let label2 = priceText('price'),
    prefix = '',
    amountText = '';
  const notes = [priceText('listed')];
  let estimate = null;
  if (value6['kind'] !== 'text' && !enabled3) {
    const value7 = value6['params'],
      value8 =
        value6['kind'] === 'image'
          ? (value7['imageSize'] ?? value7['resolution'])
          : (value7['resolution'] ?? value7['videoSize'] ?? value7['quality']);
    let value9 = null;
    if (enabled2['version_resolution_prices'])
      value9 = rows['find'](
        (value10) =>
          value10['table'] === 'version_resolution_prices' &&
          same(value10['path'][0x0], value7['version'] ?? value7['mode'] ?? enabled2['default_version']) &&
          same(value10['path'][0x1], value8),
      );
    else {
      if (enabled2['resolution_duration_prices'])
        value9 = rows['find'](
          (value11) =>
            value11['table'] === 'resolution_duration_prices' &&
            same(value11['path'][0x0], value8 + '-' + value7['duration'] + 's'),
        );
      else {
        if (enabled2['resolution_prices'])
          value9 = rows['find'](
            (value12) => value12['table'] === 'resolution_prices' && same(value12['path'][0x0], value8),
          );
        else
          !enabled2['billing_tiers'] &&
            !enabled2['billing_variants'] &&
            !enabled2['action_prices'] &&
            !enabled2['operation_prices'] &&
            (value9 = rows['find']((value13) => value13['table'] === 'base'));
      }
    }
    const value14 = Number(value7['batchSize'] ?? value7['n'] ?? 0x1),
      value15 = Number(value7['duration']),
      count2 = enabled2['billing_type'] === 'per_second' ? value15 * value14 : value14,
      enabled4 =
        value6['hasReferences'] ||
        enabled2['input_image_price'] > 0x0 ||
        enabled2['billing_variants'] ||
        enabled2['operation_prices'] ||
        enabled2['layer_decomposition_prices'] ||
        enabled2['size_quality_prices'];
    if (value9?.['quoted'] && !enabled4 && count2 > 0x0 && Number['isFinite'](count2))
      ((estimate = value9['amount'] * count2),
        (prefix = priceText('estimate')),
        (amountText = formatPrice(estimate)),
        (label2 = prefix + '\x20' + amountText));
    else {
      const list5 = rows['filter'](
        (value16) =>
          value16['quoted'] &&
          !['input', 'operation', 'video_ref_per_second_prices', 'billing_tiers']['includes'](
            value16['table'],
          ),
      );
      if (value9?.['quoted'] && count2 > 0x0 && Number['isFinite'](count2))
        ((prefix = priceText('reference')),
          (amountText = formatPrice(value9['amount'] * count2)),
          (label2 = prefix + '\x20' + amountText));
      else
        list5['length'] &&
          ((prefix = priceText('reference')),
          (amountText = formatPrice(Math['min'](...list5['map']((value17) => value17['amount'])))),
          (label2 = prefix + '\x20' + amountText));
      notes['push'](priceText('variable'));
    }
  } else notes['push'](priceText('variable'));
  !rows['length'] && ((label2 = priceText('unavailable')), notes['push'](priceText('unknown')));
  if (enabled2['pricing']?.['time_pricing']?.['current_window'])
    notes['push'](priceText('timeWindow') + ':\x20' + enabled2['pricing']['time_pricing']['current_window']);
  return {
    label: label2,
    prefix: prefix,
    amountText: amountText,
    rows: rows,
    notes: notes,
    estimate: estimate,
  };
}
