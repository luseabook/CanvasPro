import { desktopBridge } from '../../services/desktopBridge.js';
import { t } from '../../i18n/index.js';
import { normalizeTextResultSources, normalizeTextToolUsage } from '../../utils/textResultMetadata.js';
import { syncTextResultImages } from './textResultImages.js';
export function syncTextResultSources(_0x4590a1) {
  syncTextResultImages(_0x4590a1);
  const _0x21ece3 = _0x4590a1['outputEl'];
  if (!_0x21ece3?.['ownerDocument']) return;
  const _0xab08aa = _0x4590a1['_data'] || {},
    _0x1a8ff5 = normalizeTextResultSources(_0xab08aa['outputSources']),
    _0x4d5883 = normalizeTextToolUsage(_0xab08aa['outputToolUsage']),
    _0x57d819 = _0xab08aa['outputWebSearchRequested'] === !![],
    _0xa0b24b = JSON['stringify']([_0x1a8ff5, _0x4d5883, _0x57d819, t('aigenText.result.sources')]),
    _0x53ab5f = _0x4590a1['_textResultSourcesElement'];
  if (_0x4590a1['_textResultSourcesSignature'] === _0xa0b24b && _0x53ab5f?.['parentNode'] === _0x21ece3)
    return;
  ((_0x4590a1['_textResultSourcesSignature'] = _0xa0b24b),
    _0x53ab5f?.['remove'](),
    (_0x4590a1['_textResultSourcesElement'] = null));
  if (!_0xab08aa['outputText'] || (!_0x1a8ff5['length'] && !_0x57d819)) return;
  const _0x544438 = _0x21ece3['ownerDocument'],
    _0x127e4d = _0x544438['createElement']('section');
  _0x127e4d['className'] = 'aigen-text-sources';
  if (_0x1a8ff5['length']) {
    const _0xab51d6 = _0x544438['createElement']('strong');
    ((_0xab51d6['textContent'] = t('aigenText.result.sources')), _0x127e4d['appendChild'](_0xab51d6));
    const _0x8df47f = _0x544438['createElement']('ol');
    for (const _0x499fdc of _0x1a8ff5) {
      const _0x17aa23 = _0x544438['createElement']('li'),
        _0x45e6e3 = _0x544438['createElement']('a');
      ((_0x45e6e3['href'] = _0x499fdc['url']),
        (_0x45e6e3['textContent'] = _0x499fdc['title']),
        (_0x45e6e3['title'] = _0x499fdc['url']),
        (_0x45e6e3['rel'] = 'noopener noreferrer'),
        _0x45e6e3['addEventListener']('pointerdown', (_0x5cf4c4) => _0x5cf4c4['stopPropagation']()),
        _0x45e6e3['addEventListener']('click', (_0x596786) => {
          (_0x596786['preventDefault'](),
            _0x596786['stopPropagation'](),
            Promise['resolve'](desktopBridge['shell']['openExternal'](_0x499fdc['url']))['catch'](() => {}));
        }),
        _0x17aa23['appendChild'](_0x45e6e3),
        _0x8df47f['appendChild'](_0x17aa23));
    }
    _0x127e4d['appendChild'](_0x8df47f);
  }
  if (_0x57d819) {
    const _0x5113c9 = _0x544438['createElement']('p');
    ((_0x5113c9['textContent'] =
      _0x4d5883 === null
        ? t('aigenText.result.toolUsageUnavailable')
        : t('aigenText.result.toolUsage', {
            search: _0x4d5883['web_search']?.['count'] || 0x0,
            read: _0x4d5883['web_extractor']?.['count'] || 0x0,
          })),
      _0x127e4d['appendChild'](_0x5113c9));
  }
  (_0x21ece3['appendChild'](_0x127e4d), (_0x4590a1['_textResultSourcesElement'] = _0x127e4d));
}
