import { desktopBridge } from '../../services/desktopBridge.js';
import { openImagePreview } from '../../modules/imagePreview.js';
import { normalizeTextResultImages } from '../../utils/textResultImages.js';
import { normalizeTextToolUsage } from '../../utils/textResultMetadata.js';
import { addTextResultImageToCanvas } from './textResultImageImport.js';
import { t } from '../../i18n/index.js';
export function syncTextResultImages(nodeId) {
  const el = nodeId['outputEl'];
  if (!el?.['ownerDocument']) return;
  const enabled = nodeId['_data'] || {},
    list = normalizeTextResultImages(enabled['outputImages']),
    enabled2 = enabled['outputImageSearchRequested'] === true,
    text = normalizeTextToolUsage(enabled['outputToolUsage']),
    value = JSON['stringify']([list, enabled2, text, t('aigenText.result.images')]),
    el2 = nodeId['_textResultImagesElement'];
  if (nodeId['_textResultImagesSignature'] === value && el2?.['parentNode'] === el) return;
  (el2?.['remove'](),
    (nodeId['_textResultImagesElement'] = null),
    (nodeId['_textResultImagesSignature'] = value));
  if (!enabled['outputText'] || (!list['length'] && !enabled2)) return;
  const el3 = el['ownerDocument'],
    el4 = el3['createElement']('section');
  ((el4['className'] = 'aigen-text-images'),
    (el4['contentEditable'] = 'false'),
    el4['addEventListener']('pointerdown', (event) => event['stopPropagation']()),
    el4['addEventListener']('dblclick', (event2) => event2['stopPropagation']()));
  const el5 = el3['createElement']('strong');
  ((el5['textContent'] = t('aigenText.result.images')), el4['appendChild'](el5));
  const el6 = el3['createElement']('div');
  el6['className'] = 'aigen-text-image-grid';
  for (const alt of list) {
    const item = el3['createElement']('figure');
    item['className'] = 'aigen-text-image-card';
    const el7 = el3['createElement']('button');
    ((el7['type'] = 'button'),
      (el7['className'] = 'aigen-text-image-preview'),
      (el7['title'] = t('aigenText.result.imagePreview')),
      el7['setAttribute']('aria-label', el7['title'] + ': ' + alt['title']));
    const el8 = el3['createElement']('img');
    ((el8['alt'] = alt['title']),
      (el8['loading'] = 'lazy'),
      (el8['decoding'] = 'async'),
      (el8['referrerPolicy'] = 'no-referrer'),
      (el8['draggable'] = false));
    const el9 = el3['createElement']('span');
    ((el9['className'] = 'aigen-text-image-load-error'),
      (el9['textContent'] = t('aigenText.result.imageLoadFailed')),
      el8['addEventListener']('error', () => el7['classList']['add']('is-error')),
      el8['addEventListener']('load', () => el7['classList']['remove']('is-error')),
      (el8['src'] = alt['url']),
      el7['append'](el8, el9),
      el7['addEventListener']('click', (event3) => {
        (event3['stopPropagation'](), openImagePreview(alt['url'], { alt: alt['title'] }));
      }));
    const el10 = el3['createElement']('figcaption');
    el10['textContent'] = alt['title'];
    const el11 = el3['createElement']('a');
    ((el11['href'] = alt['pageUrl'] || alt['url']),
      (el11['textContent'] = t(
        alt['pageUrl'] ? 'aigenText.result.imageSource' : 'aigenText.result.imageOriginal',
      )),
      (el11['title'] = el11['href']),
      (el11['rel'] = 'noopener noreferrer'),
      el11['addEventListener']('click', (event4) => {
        (event4['preventDefault'](),
          event4['stopPropagation'](),
          Promise['resolve'](desktopBridge['shell']['openExternal'](el11['href']))['catch'](() => {}));
      }));
    const el12 = el3['createElement']('button');
    ((el12['type'] = 'button'),
      (el12['className'] = 'aigen-text-image-add'),
      (el12['textContent'] = t('aigenText.result.imageAdd')));
    const el13 = el3['createElement']('span');
    ((el13['className'] = 'aigen-text-image-status'),
      el13['setAttribute']('role', 'status'),
      el12['addEventListener']('click', async (event5) => {
        event5['stopPropagation']();
        if (el12['disabled']) return;
        ((el12['disabled'] = true),
          (el12['textContent'] = t('aigenText.result.imageAdding')),
          (el13['textContent'] = ''));
        try {
          (await addTextResultImageToCanvas({ nodeId: nodeId['nodeId'], image: alt }),
            (el12['textContent'] = t('aigenText.result.imageAdded')));
        } catch (error) {
          ((el12['textContent'] = t('aigenText.result.imageRetry')),
            (el13['textContent'] = error?.['message'] || t('aigenText.result.imageImportFailed')));
        } finally {
          el12['disabled'] = false;
        }
      }),
      item['append'](el7, el10, el11, el12, el13),
      el6['appendChild'](item));
  }
  el4['appendChild'](el6);
  if (enabled2) {
    const el14 = el3['createElement']('p');
    ((el14['textContent'] =
      text === null
        ? t('aigenText.result.toolUsageUnavailable')
        : t('aigenText.result.imageToolUsage', {
            text: text['web_search_image']?.['count'] || 0,
            image: text['image_search']?.['count'] || 0,
          })),
      el4['appendChild'](el14));
    if (!list['length']) {
      const el15 = el3['createElement']('p');
      ((el15['textContent'] = t('aigenText.result.imagesEmpty')), el4['appendChild'](el15));
    }
  }
  (el['appendChild'](el4), (nodeId['_textResultImagesElement'] = el4));
}
