const DEFAULT_MEDIA_EXTENSIONS = Object['freeze']({ image: 'png', video: 'mp4', audio: 'mp3' });
export const MATERIAL_LIBRARY_CATEGORY_LIMIT = 0x63;
export const DEFAULT_MATERIAL_LIBRARY_CATEGORIES = Object['freeze']([
  '人物',
  '场景',
  '物品',
  '风格',
  '音效',
  'Others',
]);
function trimText(_0x3cdadd) {
  return String(_0x3cdadd || '')['trim']();
}
function normalizeSearchText(_0x1e456b) {
  return trimText(_0x1e456b)['toLocaleLowerCase']();
}
function normalizeMaterialKind(_0x458bd6) {
  const _0x5946bf = trimText(_0x458bd6)['toLocaleLowerCase']();
  if (_0x5946bf === 'source-image' || _0x5946bf === 'ai-image') return 'image';
  if (_0x5946bf === 'source-video' || _0x5946bf === 'ai-video') return 'video';
  if (_0x5946bf === 'source-audio' || _0x5946bf === 'ai-audio') return 'audio';
  if (_0x5946bf === 'image' || _0x5946bf === 'video' || _0x5946bf === 'audio') return _0x5946bf;
  return '';
}
function getMaterialNodeSource(_0x4d7df1 = {}) {
  const _0x1fe75b = trimText(
      _0x4d7df1['localPath'] || _0x4d7df1['originalLocalPath'] || _0x4d7df1['displayLocalPath'],
    ),
    _0x23011b = trimText(
      _0x4d7df1['imageUrl'] ||
        _0x4d7df1['videoUrl'] ||
        _0x4d7df1['audioUrl'] ||
        _0x4d7df1['src'] ||
        _0x4d7df1['url'] ||
        _0x4d7df1['resultUrl'],
    );
  return { localPath: _0x1fe75b, url: _0x23011b };
}
function sanitizeFilenamePart(_0x4abf42, _0x4621c9 = 'material') {
  const _0x63c422 = trimText(_0x4abf42)
    ['replace'](/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    ['replace'](/\s+/g, '\x20')
    ['replace'](/[.\s]+$/g, '')
    ['slice'](0x0, 0x50);
  return _0x63c422 || _0x4621c9;
}
function resolveExtension(_0x593d50, _0x4b2fc9) {
  const _0x2ede2e = trimText(_0x593d50['localPath'] || _0x593d50['url'])['split'](/[?#]/, 0x1)[0x0],
    _0x56d8b4 = _0x2ede2e['match'](/\.([a-z0-9]{1,10})$/i);
  return _0x56d8b4?.[0x1]?.['toLocaleLowerCase']() || DEFAULT_MEDIA_EXTENSIONS[_0x4b2fc9] || 'bin';
}
export function getMaterialAssetItems(_0x300970 = {}) {
  if (Array['isArray'](_0x300970['items']) && _0x300970['items']['length'] > 0x0)
    return _0x300970['items']['map']((_0x2dff64, _0x4bb3e5) => ({
      ..._0x2dff64,
      nodeData: _0x2dff64?.['nodeData'] || _0x300970['nodes']?.[_0x4bb3e5] || null,
    }));
  return (Array['isArray'](_0x300970['nodes']) ? _0x300970['nodes'] : [])['map']((_0x4a209a) => ({
    type: _0x4a209a?.['type'] || 'other',
    name: _0x4a209a?.['name'] || '',
    thumbSrc: '',
    nodeData: _0x4a209a,
  }));
}
export function isMaterialAssetFavorite(_0x46b795 = {}) {
  return _0x46b795['favorite'] === !![] || _0x46b795['isFavorite'] === !![];
}
export function getMaterialLibraryGroups({
  assets: assets = [],
  categories: categories = [],
  query: query = '',
  favoritesOnly: favoritesOnly = ![],
  categoryKey: categoryKey = (_0x2fe26d) => normalizeSearchText(_0x2fe26d),
} = {}) {
  const _0x17b1b4 = normalizeSearchText(query),
    _0x27bedb = [],
    _0x1171fd = (_0x278267) => {
      const _0xe7fd3f = trimText(_0x278267);
      if (!_0xe7fd3f) return;
      const _0x821d76 = categoryKey(_0xe7fd3f);
      if (!_0x821d76 || _0x27bedb['some']((_0x45d3f5) => _0x45d3f5['key'] === _0x821d76)) return;
      _0x27bedb['push']({ key: _0x821d76, category: _0xe7fd3f, assets: [] });
    };
  ((Array['isArray'](categories) ? categories : [])['forEach'](_0x1171fd),
    (Array['isArray'](assets) ? assets : [])['forEach']((_0x27d345) => _0x1171fd(_0x27d345?.['category'])));
  const _0x49585d = new Map(_0x27bedb['map']((_0x10e739) => [_0x10e739['key'], _0x10e739]));
  for (const _0x2f5ede of Array['isArray'](assets) ? assets : []) {
    if (!_0x2f5ede || typeof _0x2f5ede !== 'object') continue;
    if (favoritesOnly && !isMaterialAssetFavorite(_0x2f5ede)) continue;
    const _0x40ec34 = getMaterialAssetItems(_0x2f5ede),
      _0x3371a3 = normalizeSearchText(
        [
          _0x2f5ede['name'],
          _0x2f5ede['category'],
          ..._0x40ec34['map']((_0x57460e) => _0x57460e?.['name'] || _0x57460e?.['nodeData']?.['name']),
        ]['join']('\x20'),
      );
    if (_0x17b1b4 && !_0x3371a3['includes'](_0x17b1b4)) continue;
    const _0x5ae41a = categoryKey(_0x2f5ede['category']),
      _0x179235 = _0x49585d['get'](_0x5ae41a);
    if (_0x179235) _0x179235['assets']['push'](_0x2f5ede);
  }
  if (!_0x17b1b4 && !favoritesOnly) return _0x27bedb;
  return _0x27bedb['filter']((_0x24c115) => _0x24c115['assets']['length'] > 0x0);
}
export function getMaterialFolderAssetCounts({
  groups: groups = [],
  parents: parents = {},
  categoryKey: categoryKey = (_0x46036e) => normalizeSearchText(_0x46036e),
} = {}) {
  const _0x31ed20 = new Map(),
    _0x22393e = new Map();
  for (const _0x3a4af8 of Array['isArray'](groups) ? groups : []) {
    const _0x25701f = categoryKey(_0x3a4af8?.['category']);
    if (!_0x25701f) continue;
    _0x31ed20['set'](
      _0x25701f,
      Array['isArray'](_0x3a4af8?.['assets']) ? _0x3a4af8['assets']['length'] : 0x0,
    );
  }
  for (const [_0x571f74, _0x3420fe] of Object['entries'](parents || {})) {
    const _0x1d3428 = categoryKey(_0x571f74),
      _0xcfad54 = categoryKey(_0x3420fe);
    if (
      !_0x1d3428 ||
      !_0xcfad54 ||
      _0x1d3428 === _0xcfad54 ||
      !_0x31ed20['has'](_0x1d3428) ||
      !_0x31ed20['has'](_0xcfad54)
    )
      continue;
    _0x22393e['set'](_0x1d3428, _0xcfad54);
  }
  for (const _0x1bfe74 of Array['isArray'](groups) ? groups : []) {
    const _0x214194 = categoryKey(_0x1bfe74?.['category']),
      _0x1cd903 = Array['isArray'](_0x1bfe74?.['assets']) ? _0x1bfe74['assets']['length'] : 0x0;
    if (!_0x214194 || _0x1cd903 <= 0x0) continue;
    const _0x497a6f = new Set([_0x214194]);
    let _0x1d812e = _0x22393e['get'](_0x214194);
    while (_0x1d812e && !_0x497a6f['has'](_0x1d812e)) {
      (_0x497a6f['add'](_0x1d812e),
        _0x31ed20['set'](_0x1d812e, (_0x31ed20['get'](_0x1d812e) || 0x0) + _0x1cd903),
        (_0x1d812e = _0x22393e['get'](_0x1d812e)));
    }
  }
  return _0x31ed20;
}
export function buildMaterialCategoryRenamePlan({
  assets: assets = [],
  userCategories: userCategories = [],
  allCategories: allCategories = userCategories,
  currentCategory: currentCategory = '',
  nextCategory: nextCategory = '',
  categoryKey: categoryKey = normalizeSearchText,
  now: now = Date['now'](),
} = {}) {
  const _0x5ce085 = trimText(currentCategory),
    _0x19a814 = trimText(nextCategory),
    _0x575fdd = trimText(categoryKey(_0x5ce085)),
    _0x5b2912 = trimText(categoryKey(_0x19a814)),
    _0x1d845d = Array['isArray'](userCategories) ? userCategories : [],
    _0x2d1c5c = _0x1d845d['findIndex']((_0x189828) => trimText(categoryKey(_0x189828)) === _0x575fdd);
  if (!_0x575fdd || !_0x5b2912 || _0x2d1c5c < 0x0) return { status: 'invalid' };
  if (_0x5ce085 === _0x19a814) return { status: 'unchanged' };
  if (
    _0x5b2912 !== _0x575fdd &&
    (Array['isArray'](allCategories) ? allCategories : [])['some'](
      (_0x10b2d7) => trimText(categoryKey(_0x10b2d7)) === _0x5b2912,
    )
  )
    return { status: 'duplicate' };
  const _0x240d60 = [..._0x1d845d];
  _0x240d60[_0x2d1c5c] = _0x19a814;
  const _0x3636e7 = (Array['isArray'](assets) ? assets : [])['filter'](
      (_0x290118) => trimText(categoryKey(_0x290118?.['category'])) === _0x575fdd,
    ),
    _0x1e4281 = Number['isFinite'](Number(now)) ? Number(now) : Date['now'](),
    _0x3110f0 = _0x3636e7['map']((_0x1dcbbb, _0x20e81f) => ({
      ..._0x1dcbbb,
      category: _0x19a814,
      updatedAt: _0x1e4281 + _0x20e81f,
    }));
  return {
    status: 'ready',
    currentCategory: _0x5ce085,
    currentKey: _0x575fdd,
    nextCategory: _0x19a814,
    nextKey: _0x5b2912,
    nextUserCategories: _0x240d60,
    originalAssets: _0x3636e7,
    renamedAssets: _0x3110f0,
  };
}
export function normalizeMaterialFolderParents({
  parents: parents = {},
  userCategories: userCategories = [],
  allCategories: allCategories = userCategories,
  categoryKey: categoryKey = normalizeSearchText,
} = {}) {
  const _0x230e23 = new Map();
  for (const _0x13521d of Array['isArray'](allCategories) ? allCategories : []) {
    const _0x3873ee = trimText(_0x13521d),
      _0x3fcbcf = trimText(categoryKey(_0x3873ee));
    _0x3873ee && _0x3fcbcf && !_0x230e23['has'](_0x3fcbcf) && _0x230e23['set'](_0x3fcbcf, _0x3873ee);
  }
  const _0x52dcfc = new Set(
      (Array['isArray'](userCategories) ? userCategories : [])
        ['map']((_0x57015c) => trimText(categoryKey(_0x57015c)))
        ['filter'](Boolean),
    ),
    _0x31381b = new Map();
  for (const [_0x312eec, _0xd479b0] of Object['entries'](
    parents && typeof parents === 'object' ? parents : {},
  )) {
    const _0x5b887a = trimText(categoryKey(_0x312eec)),
      _0x3a9d7f = trimText(categoryKey(_0xd479b0)),
      _0x29d6fb = _0x230e23['get'](_0x5b887a),
      _0x49e9d0 = _0x230e23['get'](_0x3a9d7f);
    if (!_0x29d6fb || !_0x49e9d0 || _0x5b887a === _0x3a9d7f || !_0x52dcfc['has'](_0x5b887a)) continue;
    _0x31381b['set'](_0x5b887a, { child: _0x29d6fb, parent: _0x49e9d0, parentKey: _0x3a9d7f });
  }
  const _0x318f61 = {};
  for (const [_0x3ac555, _0x539d21] of _0x31381b) {
    const _0x4d127b = new Set([_0x3ac555]);
    let _0x284598 = _0x539d21['parentKey'],
      _0x36fde6 = ![];
    while (_0x31381b['has'](_0x284598)) {
      if (_0x4d127b['has'](_0x284598)) {
        _0x36fde6 = !![];
        break;
      }
      (_0x4d127b['add'](_0x284598), (_0x284598 = _0x31381b['get'](_0x284598)['parentKey']));
    }
    if (!_0x36fde6) _0x318f61[_0x539d21['child']] = _0x539d21['parent'];
  }
  return _0x318f61;
}
export function renameMaterialFolderParent({
  parents: parents = {},
  currentCategory: currentCategory = '',
  nextCategory: nextCategory = '',
  categoryKey: categoryKey = normalizeSearchText,
} = {}) {
  const _0xa3aec2 = trimText(categoryKey(currentCategory)),
    _0xb2599f = trimText(nextCategory);
  if (!_0xa3aec2 || !_0xb2599f) return { ...(parents || {}) };
  const _0x341a38 = {};
  for (const [_0x333029, _0x4fc5ac] of Object['entries'](
    parents && typeof parents === 'object' ? parents : {},
  )) {
    const _0x168899 = trimText(categoryKey(_0x333029)) === _0xa3aec2 ? _0xb2599f : _0x333029,
      _0x592ace = trimText(categoryKey(_0x4fc5ac)) === _0xa3aec2 ? _0xb2599f : _0x4fc5ac;
    _0x341a38[_0x168899] = _0x592ace;
  }
  return _0x341a38;
}
export function deleteMaterialFolderParent({
  parents: parents = {},
  category: category = '',
  categoryKey: categoryKey = normalizeSearchText,
} = {}) {
  const _0xc0d00b = trimText(categoryKey(category));
  if (!_0xc0d00b) return { ...(parents || {}) };
  const _0x371455 = Object['entries'](parents && typeof parents === 'object' ? parents : {}),
    _0x313c7b =
      _0x371455['find'](([_0x55b118]) => trimText(categoryKey(_0x55b118)) === _0xc0d00b)?.[0x1] || '',
    _0xc816d8 = {};
  for (const [_0x371bbb, _0x42897a] of _0x371455) {
    if (trimText(categoryKey(_0x371bbb)) === _0xc0d00b) continue;
    if (trimText(categoryKey(_0x42897a)) === _0xc0d00b) {
      if (_0x313c7b) _0xc816d8[_0x371bbb] = _0x313c7b;
      continue;
    }
    _0xc816d8[_0x371bbb] = _0x42897a;
  }
  return _0xc816d8;
}
export function buildMaterialDuplicate(
  _0x2cb617 = {},
  { id: _0x1ee441, now: now = Date['now'](), nameSuffix: nameSuffix = ' 副本' } = {},
) {
  if (!_0x2cb617 || typeof _0x2cb617 !== 'object' || !trimText(_0x1ee441)) return null;
  const _0x840cde = JSON['parse'](JSON['stringify'](_0x2cb617));
  ((_0x840cde['id'] = trimText(_0x1ee441)),
    (_0x840cde['name'] = '' + (trimText(_0x2cb617['name']) || '未命名素材') + nameSuffix),
    (_0x840cde['createdAt'] = now),
    (_0x840cde['updatedAt'] = now),
    (_0x840cde['favorite'] = ![]),
    delete _0x840cde['isFavorite'],
    delete _0x840cde['packageKey'],
    delete _0x840cde['packageMetadata']);
  for (const _0x2f96e0 of Array['isArray'](_0x840cde['items']) ? _0x840cde['items'] : []) {
    if (!_0x2f96e0 || typeof _0x2f96e0 !== 'object') continue;
    delete _0x2f96e0['packageItemKey'];
    if (!_0x2f96e0['nodeData'] || typeof _0x2f96e0['nodeData'] !== 'object') continue;
    delete _0x2f96e0['nodeData']['assetPackageItemKey'];
  }
  for (const _0x4ed56d of Array['isArray'](_0x840cde['nodes']) ? _0x840cde['nodes'] : []) {
    if (!_0x4ed56d || typeof _0x4ed56d !== 'object') continue;
    delete _0x4ed56d['assetPackageItemKey'];
  }
  return _0x840cde;
}
export function buildMaterialDownloadFiles(_0x3f138b = {}) {
  const _0x336b83 = sanitizeFilenamePart(_0x3f138b['name'], 'material'),
    _0x25d767 = [];
  return (
    getMaterialAssetItems(_0x3f138b)['forEach']((_0x128bac, _0x1a320a) => {
      const _0x32b790 = _0x128bac?.['nodeData'] || {},
        _0xc3a20e = normalizeMaterialKind(_0x128bac?.['type'] || _0x32b790?.['type']);
      if (!_0xc3a20e) return;
      const _0x5380cb = getMaterialNodeSource(_0x32b790);
      if (!_0x5380cb['localPath'] && !_0x5380cb['url']) return;
      const _0x56a535 = resolveExtension(_0x5380cb, _0xc3a20e),
        _0x1bcb3a = sanitizeFilenamePart(_0x128bac?.['name'] || _0x32b790?.['name'], ''),
        _0x327dcb =
          _0x1bcb3a || (getMaterialAssetItems(_0x3f138b)['length'] > 0x1 ? '' + (_0x1a320a + 0x1) : '');
      _0x25d767['push']({
        kind: _0xc3a20e,
        localPath: _0x5380cb['localPath'],
        url: _0x5380cb['url'],
        filename: '' + _0x336b83 + (_0x327dcb ? '-' + _0x327dcb : '') + '.' + _0x56a535,
      });
    }),
    _0x25d767
  );
}
