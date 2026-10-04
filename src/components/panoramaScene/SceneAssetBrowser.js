import {
  SCENE_ASSET_COUNT,
  getSceneAssetCategories,
  searchSceneAssets,
} from '../../modules/panoramaSceneNode/sceneAssetCatalog.js';
import { t } from '../../i18n/index.js';
function sceneText(value, item = {}) {
  return t('panoramaSceneNode.assets.' + value, item);
}
function syncStaticText(el) {
  const el2 = el['querySelector']('.panorama-asset-browser__title');
  if (el2) el2['textContent'] = sceneText('title', { count: SCENE_ASSET_COUNT });
  const el3 = el['querySelector']('.panorama-asset-browser__category');
  el3 &&
    (el3['setAttribute']('aria-label', sceneText('categoryAria')),
    Array['from'](el3['options'])['forEach']((el4) => {
      el4['textContent'] = sceneText('categories.' + el4['value']);
    }));
  const el5 = el['querySelector']('.panorama-asset-browser__search');
  el5 &&
    ((el5['placeholder'] = sceneText('searchPlaceholder')),
    el5['setAttribute']('aria-label', sceneText('searchAria')));
  const el6 = el['querySelector']('.panorama-asset-browser__empty');
  if (el6) el6['textContent'] = sceneText('empty');
}
function renderResults(el7) {
  const enabled = el7['querySelector']('.panorama-asset-browser__results');
  if (!enabled) return;
  const query = el7['querySelector']('.panorama-asset-browser__search')?.['value'] || '',
    category = el7['querySelector']('.panorama-asset-browser__category')?.['value'] || 'all',
    list = searchSceneAssets({ query: query, category: category, limit: 0x78 });
  enabled['replaceChildren'](
    ...list['map']((error) => {
      const el8 = document['createElement']('button');
      ((el8['type'] = 'button'),
        (el8['className'] = 'panorama-asset-browser__item'),
        (el8['dataset']['assetId'] = error['id']),
        (el8['dataset']['assetPrimitive'] = error['parts'][0x0]?.['primitive'] || 'box'),
        (el8['title'] = error['name']));
      const el9 = document['createElement']('span');
      ((el9['className'] = 'panorama-asset-browser__preview'),
        (el9['dataset']['assetPrimitive'] = error['parts'][0x0]?.['primitive'] || 'box'));
      const el10 = document['createElement']('span');
      return (
        (el10['className'] = 'panorama-asset-browser__label'),
        (el10['textContent'] = error['name']),
        el8['append'](el9, el10),
        el8
      );
    }),
  );
  const el11 = el7['querySelector']('.panorama-asset-browser__empty');
  if (el11) el11['hidden'] = list['length'] > 0x0;
}
export function createSceneAssetBrowser({ onSelect: onSelect } = {}) {
  const el12 = document['createElement']('div');
  ((el12['className'] = 'panorama-asset-browser'), (el12['dataset']['uiStop'] = '1'));
  const key = document['createElement']('div');
  key['className'] = 'panorama-asset-browser__header';
  const index = document['createElement']('strong');
  index['className'] = 'panorama-asset-browser__title';
  const el13 = document['createElement']('select');
  ((el13['className'] = 'panorama-asset-browser__category'),
    el13['append'](
      ...['all', ...getSceneAssetCategories()]['map']((result) => {
        const el14 = document['createElement']('option');
        return ((el14['value'] = result), el14);
      }),
    ),
    key['append'](index, el13));
  const el15 = document['createElement']('input');
  ((el15['type'] = 'search'), (el15['className'] = 'panorama-asset-browser__search'));
  const el16 = document['createElement']('div');
  el16['className'] = 'panorama-asset-browser__results';
  const el17 = document['createElement']('div');
  return (
    (el17['className'] = 'panorama-asset-browser__empty'),
    (el17['hidden'] = !![]),
    el12['append'](key, el15, el16, el17),
    el15['addEventListener']('input', () => renderResults(el12)),
    el13['addEventListener']('change', () => renderResults(el12)),
    el16['addEventListener']('click', (event) => {
      const el18 = event['target']?.['closest']?.('[data-asset-id]');
      if (!el18) return;
      onSelect?.(el18['dataset']['assetId']);
    }),
    syncStaticText(el12),
    renderResults(el12),
    el12
  );
}
export function renderSceneAssetBrowser(enabled2) {
  if (!enabled2) return;
  (syncStaticText(enabled2), renderResults(enabled2));
}
