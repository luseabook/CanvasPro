import { desktopBridge } from '../../services/desktopBridge.js';
import { openImagePreview } from '../../modules/imagePreview.js';
import { normalizeTextResultImages } from '../../utils/textResultImages.js';
import { normalizeTextToolUsage } from '../../utils/textResultMetadata.js';
import { addTextResultImageToCanvas } from './textResultImageImport.js';
import { t } from '../../i18n/index.js';
export function syncTextResultImages(_0x2f62e8) {
  const _0x24649d = _0x2f62e8['outputEl'];
  if (!_0x24649d?.['ownerDocument']) return;
  const _0x2a3408 = _0x2f62e8['_data'] || {},
    _0x5d1b94 = normalizeTextResultImages(_0x2a3408['outputImages']),
    _0x577d9b = _0x2a3408['outputImageSearchRequested'] === !![],
    _0x2dd54c = normalizeTextToolUsage(_0x2a3408['outputToolUsage']),
    _0x3bda1b = JSON['stringify']([_0x5d1b94, _0x577d9b, _0x2dd54c, t('aigenText.result.images')]),
    _0x6e7209 = _0x2f62e8['_textResultImagesElement'];
  if (_0x2f62e8['_textResultImagesSignature'] === _0x3bda1b && _0x6e7209?.['parentNode'] === _0x24649d)
    return;
  (_0x6e7209?.['remove'](),
    (_0x2f62e8['_textResultImagesElement'] = null),
    (_0x2f62e8['_textResultImagesSignature'] = _0x3bda1b));
  if (!_0x2a3408['outputText'] || (!_0x5d1b94['length'] && !_0x577d9b)) return;
  const _0x2d4e7f = _0x24649d['ownerDocument'],
    _0x36f599 = _0x2d4e7f['createElement']('section');
  ((_0x36f599['className'] = 'aigen-text-images'),
    (_0x36f599['contentEditable'] = 'false'),
    _0x36f599['addEventListener']('pointerdown', (_0x3f24df) => _0x3f24df['stopPropagation']()),
    _0x36f599['addEventListener']('dblclick', (_0x21a379) => _0x21a379['stopPropagation']()));
  const _0x542100 = _0x2d4e7f['createElement']('strong');
  ((_0x542100['textContent'] = t('aigenText.result.images')), _0x36f599['appendChild'](_0x542100));
  const _0x54abf5 = _0x2d4e7f['createElement']('div');
  _0x54abf5['className'] = 'aigen-text-image-grid';
  for (const _0x74747 of _0x5d1b94) {
    const _0x40e9ac = _0x2d4e7f['createElement']('figure');
    _0x40e9ac['className'] = 'aigen-text-image-card';
    const _0x18ff12 = _0x2d4e7f['createElement']('button');
    ((_0x18ff12['type'] = 'button'),
      (_0x18ff12['className'] = 'aigen-text-image-preview'),
      (_0x18ff12['title'] = t('aigenText.result.imagePreview')),
      _0x18ff12['setAttribute']('aria-label', _0x18ff12['title'] + ':\x20' + _0x74747['title']));
    const _0x1edcae = _0x2d4e7f['createElement']('img');
    ((_0x1edcae['alt'] = _0x74747['title']),
      (_0x1edcae['loading'] = 'lazy'),
      (_0x1edcae['decoding'] = 'async'),
      (_0x1edcae['referrerPolicy'] = 'no-referrer'),
      (_0x1edcae['draggable'] = ![]));
    const _0x2c47f9 = _0x2d4e7f['createElement']('span');
    ((_0x2c47f9['className'] = 'aigen-text-image-load-error'),
      (_0x2c47f9['textContent'] = t('aigenText.result.imageLoadFailed')),
      _0x1edcae['addEventListener']('error', () => _0x18ff12['classList']['add']('is-error')),
      _0x1edcae['addEventListener']('load', () => _0x18ff12['classList']['remove']('is-error')),
      (_0x1edcae['src'] = _0x74747['url']),
      _0x18ff12['append'](_0x1edcae, _0x2c47f9),
      _0x18ff12['addEventListener']('click', (_0x5906a2) => {
        (_0x5906a2['stopPropagation'](), openImagePreview(_0x74747['url'], { alt: _0x74747['title'] }));
      }));
    const _0x3496b8 = _0x2d4e7f['createElement']('figcaption');
    _0x3496b8['textContent'] = _0x74747['title'];
    const _0x30bfc = _0x2d4e7f['createElement']('a');
    ((_0x30bfc['href'] = _0x74747['pageUrl'] || _0x74747['url']),
      (_0x30bfc['textContent'] = t(
        _0x74747['pageUrl'] ? 'aigenText.result.imageSource' : 'aigenText.result.imageOriginal',
      )),
      (_0x30bfc['title'] = _0x30bfc['href']),
      (_0x30bfc['rel'] = 'noopener noreferrer'),
      _0x30bfc['addEventListener']('click', (_0x3da912) => {
        (_0x3da912['preventDefault'](),
          _0x3da912['stopPropagation'](),
          Promise['resolve'](desktopBridge['shell']['openExternal'](_0x30bfc['href']))['catch'](() => {}));
      }));
    const _0x28a027 = _0x2d4e7f['createElement']('button');
    ((_0x28a027['type'] = 'button'),
      (_0x28a027['className'] = 'aigen-text-image-add'),
      (_0x28a027['textContent'] = t('aigenText.result.imageAdd')));
    const _0x3e41ae = _0x2d4e7f['createElement']('span');
    ((_0x3e41ae['className'] = 'aigen-text-image-status'),
      _0x3e41ae['setAttribute']('role', 'status'),
      _0x28a027['addEventListener']('click', async (_0x4eeef6) => {
        _0x4eeef6['stopPropagation']();
        if (_0x28a027['disabled']) return;
        ((_0x28a027['disabled'] = !![]),
          (_0x28a027['textContent'] = t('aigenText.result.imageAdding')),
          (_0x3e41ae['textContent'] = ''));
        try {
          (await addTextResultImageToCanvas({ nodeId: _0x2f62e8['nodeId'], image: _0x74747 }),
            (_0x28a027['textContent'] = t('aigenText.result.imageAdded')));
        } catch (_0x562569) {
          ((_0x28a027['textContent'] = t('aigenText.result.imageRetry')),
            (_0x3e41ae['textContent'] = _0x562569?.['message'] || t('aigenText.result.imageImportFailed')));
        } finally {
          _0x28a027['disabled'] = ![];
        }
      }),
      _0x40e9ac['append'](_0x18ff12, _0x3496b8, _0x30bfc, _0x28a027, _0x3e41ae),
      _0x54abf5['appendChild'](_0x40e9ac));
  }
  _0x36f599['appendChild'](_0x54abf5);
  if (_0x577d9b) {
    const _0x1fa136 = _0x2d4e7f['createElement']('p');
    ((_0x1fa136['textContent'] =
      _0x2dd54c === null
        ? t('aigenText.result.toolUsageUnavailable')
        : t('aigenText.result.imageToolUsage', {
            text: _0x2dd54c['web_search_image']?.['count'] || 0x0,
            image: _0x2dd54c['image_search']?.['count'] || 0x0,
          })),
      _0x36f599['appendChild'](_0x1fa136));
    if (!_0x5d1b94['length']) {
      const _0x2d41df = _0x2d4e7f['createElement']('p');
      ((_0x2d41df['textContent'] = t('aigenText.result.imagesEmpty')), _0x36f599['appendChild'](_0x2d41df));
    }
  }
  (_0x24649d['appendChild'](_0x36f599), (_0x2f62e8['_textResultImagesElement'] = _0x36f599));
}
