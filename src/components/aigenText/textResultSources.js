import { desktopBridge } from '../../services/desktopBridge.js';
import { t } from '../../i18n/index.js';
import { normalizeTextResultSources, normalizeTextToolUsage } from '../../utils/textResultMetadata.js';
import { syncTextResultImages } from './textResultImages.js';
export function syncTextResultSources(value) {
  syncTextResultImages(value);
  const el = value.outputEl;
  if (!el?.ownerDocument) return;
  const enabled = value._data || {},
    list = normalizeTextResultSources(enabled.outputSources),
    search = normalizeTextToolUsage(enabled.outputToolUsage),
    enabled2 = enabled.outputWebSearchRequested === true,
    item = JSON.stringify([list, search, enabled2, t('aigenText.result.sources')]),
    el2 = value._textResultSourcesElement;
  if (value._textResultSourcesSignature === item && el2?.parentNode === el) return;
  ((value._textResultSourcesSignature = item),
    el2?.remove(),
    (value._textResultSourcesElement = null));
  if (!enabled.outputText || (!list.length && !enabled2)) return;
  const el3 = el.ownerDocument,
    el4 = el3.createElement('section');
  el4.className = 'aigen-text-sources';
  if (list.length) {
    const el5 = el3.createElement('strong');
    ((el5.textContent = t('aigenText.result.sources')), el4.appendChild(el5));
    const el6 = el3.createElement('ol');
    for (const response of list) {
      const el7 = el3.createElement('li'),
        el8 = el3.createElement('a');
      ((el8.href = response.url),
        (el8.textContent = response.title),
        (el8.title = response.url),
        (el8.rel = 'noopener noreferrer'),
        el8.addEventListener('pointerdown', (event) => event.stopPropagation()),
        el8.addEventListener('click', (event2) => {
          (event2.preventDefault(),
            event2.stopPropagation(),
            Promise.resolve(desktopBridge.shell.openExternal(response.url)).catch(() => {}));
        }),
        el7.appendChild(el8),
        el6.appendChild(el7));
    }
    el4.appendChild(el6);
  }
  if (enabled2) {
    const el9 = el3.createElement('p');
    ((el9.textContent =
      search === null
        ? t('aigenText.result.toolUsageUnavailable')
        : t('aigenText.result.toolUsage', {
            search: search.web_search?.count || 0,
            read: search.web_extractor?.count || 0,
          })),
      el4.appendChild(el9));
  }
  (el.appendChild(el4), (value._textResultSourcesElement = el4));
}
