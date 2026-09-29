import {
  SCENE_ASSET_COUNT,
  getSceneAssetCategories,
  searchSceneAssets,
} from '../../modules/panoramaSceneNode/sceneAssetCatalog.js';
import { t } from '../../i18n/index.js';
function sceneText(_0x51dbc5, _0x5b13a1 = {}) {
  return t('panoramaSceneNode.assets.' + _0x51dbc5, _0x5b13a1);
}
function syncStaticText(_0x302e35) {
  const _0xab4c4b = _0x302e35['querySelector']('.panorama-asset-browser__title');
  if (_0xab4c4b) _0xab4c4b['textContent'] = sceneText('title', { count: SCENE_ASSET_COUNT });
  const _0x210178 = _0x302e35['querySelector']('.panorama-asset-browser__category');
  _0x210178 &&
    (_0x210178['setAttribute']('aria-label', sceneText('categoryAria')),
    Array['from'](_0x210178['options'])['forEach']((_0x5e33aa) => {
      _0x5e33aa['textContent'] = sceneText('categories.' + _0x5e33aa['value']);
    }));
  const _0x510ff0 = _0x302e35['querySelector']('.panorama-asset-browser__search');
  _0x510ff0 &&
    ((_0x510ff0['placeholder'] = sceneText('searchPlaceholder')),
    _0x510ff0['setAttribute']('aria-label', sceneText('searchAria')));
  const _0x16ff4b = _0x302e35['querySelector']('.panorama-asset-browser__empty');
  if (_0x16ff4b) _0x16ff4b['textContent'] = sceneText('empty');
}
function renderResults(_0x4bdfcb) {
  const _0xe8fc8c = _0x4bdfcb['querySelector']('.panorama-asset-browser__results');
  if (!_0xe8fc8c) return;
  const _0x37948f = _0x4bdfcb['querySelector']('.panorama-asset-browser__search')?.['value'] || '',
    _0x5986e0 = _0x4bdfcb['querySelector']('.panorama-asset-browser__category')?.['value'] || 'all',
    _0xe0b3a8 = searchSceneAssets({ query: _0x37948f, category: _0x5986e0, limit: 0x78 });
  _0xe8fc8c['replaceChildren'](
    ..._0xe0b3a8['map']((_0xc4b878) => {
      const _0x2b2c7b = document['createElement']('button');
      ((_0x2b2c7b['type'] = 'button'),
        (_0x2b2c7b['className'] = 'panorama-asset-browser__item'),
        (_0x2b2c7b['dataset']['assetId'] = _0xc4b878['id']),
        (_0x2b2c7b['dataset']['assetPrimitive'] = _0xc4b878['parts'][0x0]?.['primitive'] || 'box'),
        (_0x2b2c7b['title'] = _0xc4b878['name']));
      const _0x4310c0 = document['createElement']('span');
      ((_0x4310c0['className'] = 'panorama-asset-browser__preview'),
        (_0x4310c0['dataset']['assetPrimitive'] = _0xc4b878['parts'][0x0]?.['primitive'] || 'box'));
      const _0x242f44 = document['createElement']('span');
      return (
        (_0x242f44['className'] = 'panorama-asset-browser__label'),
        (_0x242f44['textContent'] = _0xc4b878['name']),
        _0x2b2c7b['append'](_0x4310c0, _0x242f44),
        _0x2b2c7b
      );
    }),
  );
  const _0x64f4b2 = _0x4bdfcb['querySelector']('.panorama-asset-browser__empty');
  if (_0x64f4b2) _0x64f4b2['hidden'] = _0xe0b3a8['length'] > 0x0;
}
export function createSceneAssetBrowser({ onSelect: _0x21eed6 } = {}) {
  const _0x1c98e6 = document['createElement']('div');
  ((_0x1c98e6['className'] = 'panorama-asset-browser'), (_0x1c98e6['dataset']['uiStop'] = '1'));
  const _0x284391 = document['createElement']('div');
  _0x284391['className'] = 'panorama-asset-browser__header';
  const _0x5ac18c = document['createElement']('strong');
  _0x5ac18c['className'] = 'panorama-asset-browser__title';
  const _0x5f3c7c = document['createElement']('select');
  ((_0x5f3c7c['className'] = 'panorama-asset-browser__category'),
    _0x5f3c7c['append'](
      ...['all', ...getSceneAssetCategories()]['map']((_0xd7df9d) => {
        const _0x416498 = document['createElement']('option');
        return ((_0x416498['value'] = _0xd7df9d), _0x416498);
      }),
    ),
    _0x284391['append'](_0x5ac18c, _0x5f3c7c));
  const _0x2b8126 = document['createElement']('input');
  ((_0x2b8126['type'] = 'search'), (_0x2b8126['className'] = 'panorama-asset-browser__search'));
  const _0x1143dd = document['createElement']('div');
  _0x1143dd['className'] = 'panorama-asset-browser__results';
  const _0xf0ff67 = document['createElement']('div');
  return (
    (_0xf0ff67['className'] = 'panorama-asset-browser__empty'),
    (_0xf0ff67['hidden'] = !![]),
    _0x1c98e6['append'](_0x284391, _0x2b8126, _0x1143dd, _0xf0ff67),
    _0x2b8126['addEventListener']('input', () => renderResults(_0x1c98e6)),
    _0x5f3c7c['addEventListener']('change', () => renderResults(_0x1c98e6)),
    _0x1143dd['addEventListener']('click', (_0x1ef462) => {
      const _0xa2e321 = _0x1ef462['target']?.['closest']?.('[data-asset-id]');
      if (!_0xa2e321) return;
      _0x21eed6?.(_0xa2e321['dataset']['assetId']);
    }),
    syncStaticText(_0x1c98e6),
    renderResults(_0x1c98e6),
    _0x1c98e6
  );
}
export function renderSceneAssetBrowser(_0x2e5605) {
  if (!_0x2e5605) return;
  (syncStaticText(_0x2e5605), renderResults(_0x2e5605));
}
