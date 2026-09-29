import { formatPrice, priceText } from './modelPricingText.js';
const valid = (_0x31afb9) =>
    typeof _0x31afb9 === 'number' && Number['isFinite'](_0x31afb9) && _0x31afb9 >= 0x0,
  effective = (_0x5912f6, _0x4e39ce) =>
    valid(_0x5912f6) && valid(_0x4e39ce) ? (_0x5912f6 * _0x4e39ce) / 0x64 : null,
  same = (_0x3d4184, _0x2123f0) =>
    String(_0x3d4184 ?? '')['toLowerCase']() === String(_0x2123f0 ?? '')['toLowerCase']();
function tokenRows(_0x3b359a) {
  const _0x57609d = [],
    _0xfece7e = _0x3b359a['price_factor'],
    _0x4ae1c8 = (_0x4b1abc, _0x1de28f, _0x48a0f6) => {
      for (const _0x36be6c of new Set([
        ...Object['keys'](_0x4b1abc || {}),
        ...Object['keys'](_0x1de28f || {}),
      ])) {
        if (_0x36be6c === 'up_to_input_tokens') continue;
        if (_0x36be6c['includes']('cached') && _0x3b359a['limits']?.['supports_cache_read'] === ![]) continue;
        if (_0x36be6c['startsWith']('cache_write') && _0x3b359a['limits']?.['supports_cache_write'] === ![])
          continue;
        const _0x282c60 = valid(_0x1de28f?.[_0x36be6c])
          ? _0x1de28f[_0x36be6c]
          : valid(_0x4b1abc?.[_0x36be6c]) && valid(_0xfece7e)
            ? _0x4b1abc[_0x36be6c] * _0xfece7e
            : null;
        if (valid(_0x282c60))
          _0x57609d['push']({
            label: priceText(_0x36be6c),
            amount: _0x282c60,
            unit: priceText('tokenUnit'),
            section: _0x48a0f6,
          });
      }
    };
  if (_0x3b359a['tier_count'] > 0x1 && Array['isArray'](_0x3b359a['tiers'])) {
    let _0x4c5c01 = 0x0;
    for (const _0x3408b7 of _0x3b359a['tiers']) {
      const _0x1032bc = valid(_0x3408b7['up_to_input_tokens']) ? _0x3408b7['up_to_input_tokens'] : null;
      (_0x4ae1c8(
        _0x3408b7,
        null,
        priceText('tier') + '\x20' + _0x4c5c01 + '–' + (_0x1032bc ?? priceText('unlimited')),
      ),
        (_0x4c5c01 = _0x1032bc === null ? _0x4c5c01 : _0x1032bc + 0x1));
    }
  } else _0x4ae1c8(_0x3b359a['rates'], _0x3b359a['effective_rates'], '');
  const _0x377669 = { ..._0x3b359a['extras']?.['tools'] };
  if (_0x3b359a['extras']?.['google_web_search'] && !_0x377669['google_web_search'])
    _0x377669['google_web_search'] = _0x3b359a['extras']['google_web_search'];
  for (const [_0x29508c, _0x47047c] of Object['entries'](_0x377669)) {
    if (valid(_0x47047c?.['price']) && valid(_0xfece7e))
      _0x57609d['push']({
        label: priceText(_0x29508c),
        amount: _0x47047c['price'] * _0xfece7e,
        unit: priceText(_0x47047c['unit']),
        section: '',
      });
  }
  const _0x3978b1 = _0x3b359a['extras']?.['context_cache_storage'];
  if (valid(_0x3978b1?.['price']))
    _0x57609d['push']({
      label: priceText('storage'),
      amount: _0x3978b1['price'],
      unit: priceText(_0x3978b1['unit']),
      section: priceText('original'),
    });
  return _0x57609d;
}
function mediaRows(_0x2ee747, _0xb36c7e) {
  const _0x1a2461 = [],
    _0x33d045 = priceText(
      _0x2ee747['billing_type'] === 'per_second' ? 'second' : _0xb36c7e === 'image' ? 'image' : 'call',
    ),
    _0x3eb7ac = (_0x9935c7, _0x2957d9, _0x9d613d, _0x155723 = _0x33d045, _0x2c96d3 = '', _0x3b42eb = []) => {
      if (!valid(_0x2957d9)) return;
      const _0x476d8f = effective(_0x2957d9, _0x9d613d);
      _0x1a2461['push']({
        label: _0x9935c7,
        amount: _0x476d8f ?? _0x2957d9,
        unit: _0x155723,
        section: _0x476d8f === null ? priceText('original') : '',
        table: _0x2c96d3,
        path: _0x3b42eb,
        quoted: _0x476d8f !== null,
      });
    },
    _0xd3b26d = [
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
    _0x8d086b = (_0x7ba89e, _0x56c7fd, _0x574d4b, _0x3c08de = []) => {
      for (const [_0x12bdff, _0xa09e51] of Object['entries'](_0x7ba89e || {})) {
        const _0x504e78 = [..._0x3c08de, _0x12bdff];
        if (_0xa09e51 && typeof _0xa09e51 === 'object')
          _0x8d086b(_0xa09e51, _0x56c7fd?.[_0x12bdff], _0x574d4b, _0x504e78);
        else
          _0x3eb7ac(
            _0x504e78['join'](' · '),
            _0xa09e51,
            _0x56c7fd?.[_0x12bdff],
            _0x574d4b === 'video_ref_per_second_prices'
              ? priceText('second')
              : _0x574d4b === 'billing_tiers' && _0x12bdff['startsWith']('token')
                ? priceText('tokenUnit')
                : _0x33d045,
            _0x574d4b,
            _0x504e78,
          );
      }
    };
  for (const [_0x541099, _0x344fce] of _0xd3b26d)
    _0x8d086b(_0x2ee747[_0x541099], _0x2ee747[_0x344fce], _0x541099);
  if (valid(_0x2ee747['model_price']))
    _0x3eb7ac(
      priceText('reference'),
      _0x2ee747['model_price'],
      _0x2ee747['actual_discount'],
      _0x33d045,
      'base',
    );
  if (valid(_0x2ee747['input_image_price']))
    _0x3eb7ac(
      priceText('inputImage'),
      _0x2ee747['input_image_price'],
      _0x2ee747['input_image_actual_discount'],
      priceText('image'),
      'input',
    );
  for (const [_0x24bc5b, _0x44ba3a] of Object['entries'](_0x2ee747['operation_prices'] || {})) {
    _0x3eb7ac(
      _0x24bc5b,
      _0x44ba3a['model_price'],
      _0x44ba3a['actual_discount'],
      priceText('call'),
      'operation',
    );
  }
  return _0x1a2461;
}
export function buildApimartPriceView(_0x3e8862, _0x4e648f) {
  const _0x374987 = !!_0x3e8862['pricing'],
    _0x3b33b9 = _0x374987 ? tokenRows(_0x3e8862['pricing']) : mediaRows(_0x3e8862, _0x4e648f['kind']);
  let _0x375147 = priceText('price'),
    _0x4d9088 = '',
    _0x38b69a = '';
  const _0x146de8 = [priceText('listed')];
  let _0x94f197 = null;
  if (_0x4e648f['kind'] !== 'text' && !_0x374987) {
    const _0x517a63 = _0x4e648f['params'],
      _0x4050ce =
        _0x4e648f['kind'] === 'image'
          ? (_0x517a63['imageSize'] ?? _0x517a63['resolution'])
          : (_0x517a63['resolution'] ?? _0x517a63['videoSize'] ?? _0x517a63['quality']);
    let _0x5ee074 = null;
    if (_0x3e8862['version_resolution_prices'])
      _0x5ee074 = _0x3b33b9['find'](
        (_0x5882ab) =>
          _0x5882ab['table'] === 'version_resolution_prices' &&
          same(
            _0x5882ab['path'][0x0],
            _0x517a63['version'] ?? _0x517a63['mode'] ?? _0x3e8862['default_version'],
          ) &&
          same(_0x5882ab['path'][0x1], _0x4050ce),
      );
    else {
      if (_0x3e8862['resolution_duration_prices'])
        _0x5ee074 = _0x3b33b9['find'](
          (_0x457bc7) =>
            _0x457bc7['table'] === 'resolution_duration_prices' &&
            same(_0x457bc7['path'][0x0], _0x4050ce + '-' + _0x517a63['duration'] + 's'),
        );
      else {
        if (_0x3e8862['resolution_prices'])
          _0x5ee074 = _0x3b33b9['find'](
            (_0x43a88c) =>
              _0x43a88c['table'] === 'resolution_prices' && same(_0x43a88c['path'][0x0], _0x4050ce),
          );
        else
          !_0x3e8862['billing_tiers'] &&
            !_0x3e8862['billing_variants'] &&
            !_0x3e8862['action_prices'] &&
            !_0x3e8862['operation_prices'] &&
            (_0x5ee074 = _0x3b33b9['find']((_0x3bc24a) => _0x3bc24a['table'] === 'base'));
      }
    }
    const _0x474f2e = Number(_0x517a63['batchSize'] ?? _0x517a63['n'] ?? 0x1),
      _0x2e9707 = Number(_0x517a63['duration']),
      _0x39432b = _0x3e8862['billing_type'] === 'per_second' ? _0x2e9707 * _0x474f2e : _0x474f2e,
      _0x1cac2d =
        _0x4e648f['hasReferences'] ||
        _0x3e8862['input_image_price'] > 0x0 ||
        _0x3e8862['billing_variants'] ||
        _0x3e8862['operation_prices'] ||
        _0x3e8862['layer_decomposition_prices'] ||
        _0x3e8862['size_quality_prices'];
    if (_0x5ee074?.['quoted'] && !_0x1cac2d && _0x39432b > 0x0 && Number['isFinite'](_0x39432b))
      ((_0x94f197 = _0x5ee074['amount'] * _0x39432b),
        (_0x4d9088 = priceText('estimate')),
        (_0x38b69a = formatPrice(_0x94f197)),
        (_0x375147 = _0x4d9088 + '\x20' + _0x38b69a));
    else {
      const _0x2c594f = _0x3b33b9['filter'](
        (_0xae2fb1) =>
          _0xae2fb1['quoted'] &&
          !['input', 'operation', 'video_ref_per_second_prices', 'billing_tiers']['includes'](
            _0xae2fb1['table'],
          ),
      );
      if (_0x5ee074?.['quoted'] && _0x39432b > 0x0 && Number['isFinite'](_0x39432b))
        ((_0x4d9088 = priceText('reference')),
          (_0x38b69a = formatPrice(_0x5ee074['amount'] * _0x39432b)),
          (_0x375147 = _0x4d9088 + '\x20' + _0x38b69a));
      else
        _0x2c594f['length'] &&
          ((_0x4d9088 = priceText('reference')),
          (_0x38b69a = formatPrice(Math['min'](..._0x2c594f['map']((_0xac36b4) => _0xac36b4['amount'])))),
          (_0x375147 = _0x4d9088 + '\x20' + _0x38b69a));
      _0x146de8['push'](priceText('variable'));
    }
  } else _0x146de8['push'](priceText('variable'));
  !_0x3b33b9['length'] && ((_0x375147 = priceText('unavailable')), _0x146de8['push'](priceText('unknown')));
  if (_0x3e8862['pricing']?.['time_pricing']?.['current_window'])
    _0x146de8['push'](
      priceText('timeWindow') + ':\x20' + _0x3e8862['pricing']['time_pricing']['current_window'],
    );
  return {
    label: _0x375147,
    prefix: _0x4d9088,
    amountText: _0x38b69a,
    rows: _0x3b33b9,
    notes: _0x146de8,
    estimate: _0x94f197,
  };
}
