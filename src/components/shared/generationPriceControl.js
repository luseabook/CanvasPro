import { API_CONFIG_CHANGED_EVENT } from '../../../api/configApi.js';
import { modelPricingCache } from '../../../api/modelPricingApi.js';
import { buildModelPriceView } from '../../services/modelPricingPresentation.js';
import { priceText } from '../../services/modelPricingText.js';
import { onLocaleChange } from '../../i18n/index.js';
import { bindModelPriceDetails } from './modelPriceDetails.js';
export function bindGenerationPriceControl(
  _0x1b2278,
  { getContext: _0x2e4cc8, subscribe: _0x3f923c, cache: cache = modelPricingCache } = {},
) {
  if (!_0x1b2278?.['ownerDocument']?.['createElement'] || !_0x1b2278['parentNode'])
    return { sync() {}, destroy() {} };
  const _0x27ace2 = _0x1b2278['ownerDocument'],
    _0x3fc1ad = _0x27ace2['defaultView'],
    _0x35bf72 = _0x27ace2['createElement']('button');
  ((_0x35bf72['type'] = 'button'),
    (_0x35bf72['className'] = 'generation-model-price'),
    (_0x35bf72['hidden'] = !![]));
  const _0x1a254c = _0x27ace2['createElement']('span');
  _0x1a254c['className'] = 'generation-model-price-label';
  const _0xc42852 = _0x27ace2['createElement']('span');
  _0xc42852['className'] = 'generation-model-price-amount';
  const _0x5416dc = _0x27ace2['createElement']('span');
  ((_0x5416dc['className'] = 'generation-model-price-icon'),
    (_0x5416dc['textContent'] = 'ⓘ'),
    _0x5416dc['setAttribute']('aria-hidden', 'true'),
    _0x35bf72['append'](_0x1a254c, _0xc42852, _0x5416dc),
    _0x1b2278['before'](_0x35bf72));
  let _0xcc9c97 = null,
    _0x5a9767 = null,
    _0x930641 = ![],
    _0x4fd803 = '',
    _0x4bac4f = ![],
    _0x2412a7 = ![],
    _0x1b710c = ![],
    _0x2b2df0 = 0x0,
    _0x367fbc = ![],
    _0x109fa8,
    _0x4fc5c6;
  const _0x30a77b = () => ({
      ...(_0x5a9767 && _0xcc9c97
        ? buildModelPriceView(_0x5a9767['data'], _0xcc9c97)
        : { label: priceText('price'), rows: [], notes: [], estimate: null }),
      title: _0xcc9c97 ? _0xcc9c97['label'] + ' · ' + _0xcc9c97['model'] : priceText('price'),
      status: [
        _0x4bac4f ? priceText('loading') : '',
        _0x930641 ? priceText(_0x5a9767 ? 'refreshFailed' : 'unavailable') : '',
        _0x930641 ? _0x4fd803 : '',
        _0x5a9767
          ? (cache['stale'](_0x5a9767) ? priceText('stale') : priceText('updated')) +
            ' · ' +
            new Date(_0x5a9767['fetchedAt'])['toLocaleString']()
          : '',
      ]
        ['filter'](Boolean)
        ['join']('\x0a'),
    }),
    _0x1e0b7f = () => {
      if (_0x2412a7) return;
      ((_0x35bf72['hidden'] = !_0xcc9c97), _0x35bf72['setAttribute']('aria-busy', String(_0x4bac4f)));
      const _0x5d0eb6 = _0x5a9767 ? _0x30a77b() : null;
      ((_0x1a254c['textContent'] = _0x5d0eb6?.['amountText']
        ? _0x5d0eb6['prefix'] + '\x20'
        : _0x5d0eb6?.['label'] || priceText(_0x930641 ? 'unavailable' : 'price')),
        (_0xc42852['textContent'] = _0x5d0eb6?.['amountText'] || ''),
        (_0xc42852['hidden'] = !_0x5d0eb6?.['amountText']),
        (_0x5416dc['hidden'] = _0xcc9c97?.['kind'] !== 'text' && !_0x4bac4f),
        (_0x5416dc['textContent'] = _0xcc9c97?.['kind'] === 'text' ? 'ⓘ' : ''),
        _0x35bf72['setAttribute']('aria-label', priceText('price') + ' · ' + (_0xcc9c97?.['label'] || '')),
        _0x4fc5c6?.['render']());
    },
    _0x10f615 = () => {
      if (_0x2412a7 || !_0xcc9c97 || _0x4bac4f || !_0x1b710c) return;
      _0x5a9767 = cache['peek'](_0xcc9c97);
      if (!cache['stale'](_0x5a9767)) {
        _0x1e0b7f();
        return;
      }
      ((_0x4bac4f = !![]), _0x1e0b7f());
      const _0x16871a = _0x2b2df0;
      cache['ensure'](_0xcc9c97)
        ['then']((_0x4d83d2) => {
          if (_0x2412a7 || _0x16871a !== _0x2b2df0) return;
          ((_0x5a9767 = _0x4d83d2), (_0x930641 = cache['stale'](_0x4d83d2)));
        })
        ['catch']((_0x417f68) => {
          !_0x2412a7 &&
            _0x16871a === _0x2b2df0 &&
            ((_0x930641 = !![]), (_0x4fd803 = _0x417f68['message'] || ''));
        })
        ['finally'](() => {
          !_0x2412a7 && _0x16871a === _0x2b2df0 && ((_0x4bac4f = ![]), _0x1e0b7f());
        });
    },
    _0xcaa95c = () => {
      if (_0x2412a7) return;
      const _0x399fe7 = _0x2e4cc8();
      (_0x399fe7?.['key'] !== _0xcc9c97?.['key'] &&
        ((_0x2b2df0 += 0x1),
        (_0x4bac4f = ![]),
        (_0x930641 = ![]),
        (_0x4fd803 = ''),
        _0x4fc5c6?.['close'](),
        (_0x5a9767 = _0x399fe7 ? cache['peek'](_0x399fe7) : null)),
        (_0xcc9c97 = _0x399fe7),
        _0x1e0b7f(),
        clearTimeout(_0x109fa8),
        (_0x109fa8 = setTimeout(_0x10f615, _0xcc9c97?.['debounceMs'] || 0x0)));
    },
    _0x382f6f = () => {
      if (_0x367fbc) return;
      ((_0x367fbc = !![]),
        queueMicrotask(() => {
          ((_0x367fbc = ![]), _0xcaa95c());
        }));
    };
  _0x4fc5c6 = bindModelPriceDetails(_0x35bf72, _0x30a77b, () => {
    ((_0x1b710c = !![]), _0x10f615());
  });
  const _0x51c1e1 = _0x3fc1ad['IntersectionObserver']
    ? new _0x3fc1ad['IntersectionObserver'](([_0x3c9439]) => {
        _0x1b710c = _0x3c9439['isIntersecting'];
        if (_0x1b710c) _0xcaa95c();
        else _0x4fc5c6['close']();
      })
    : null;
  _0x51c1e1?.['observe'](_0x1b2278);
  const _0x744ea4 = _0x3f923c?.(_0x382f6f);
  _0x3fc1ad['addEventListener'](API_CONFIG_CHANGED_EVENT, _0x382f6f);
  const _0x5d496a = onLocaleChange(_0x1e0b7f);
  return (
    _0xcaa95c(),
    {
      sync: _0x382f6f,
      destroy() {
        ((_0x2412a7 = !![]),
          (_0x2b2df0 += 0x1),
          clearTimeout(_0x109fa8),
          _0x51c1e1?.['disconnect'](),
          _0x744ea4?.(),
          _0x5d496a(),
          _0x3fc1ad['removeEventListener'](API_CONFIG_CHANGED_EVENT, _0x382f6f),
          _0x4fc5c6['destroy'](),
          _0x35bf72['remove']());
      },
    }
  );
}
