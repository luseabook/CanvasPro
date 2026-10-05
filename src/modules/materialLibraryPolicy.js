const DEFAULT_MEDIA_EXTENSIONS = Object['freeze']({ image: 'png', video: 'mp4', audio: 'mp3' });
export const MATERIAL_LIBRARY_CATEGORY_LIMIT = 99;
export const DEFAULT_MATERIAL_LIBRARY_CATEGORIES = Object['freeze']([
  '人物',
  '场景',
  '物品',
  '风格',
  '音效',
  'Others',
]);
function trimText(value) {
  return String(value || '')['trim']();
}
function normalizeSearchText(item) {
  return trimText(item)['toLocaleLowerCase']();
}
function normalizeMaterialKind(key) {
  const trimText2 = trimText(key)['toLocaleLowerCase']();
  if (trimText2 === 'source-image' || trimText2 === 'ai-image') return 'image';
  if (trimText2 === 'source-video' || trimText2 === 'ai-video') return 'video';
  if (trimText2 === 'source-audio' || trimText2 === 'ai-audio') return 'audio';
  if (trimText2 === 'image' || trimText2 === 'video' || trimText2 === 'audio') return trimText2;
  return '';
}
function getMaterialNodeSource(response = {}) {
  const localPath = trimText(
      response['localPath'] || response['originalLocalPath'] || response['displayLocalPath'],
    ),
    url = trimText(
      response['imageUrl'] ||
        response['videoUrl'] ||
        response['audioUrl'] ||
        response['src'] ||
        response['url'] ||
        response['resultUrl'],
    );
  return { localPath: localPath, url: url };
}
function sanitizeFilenamePart(index, result = 'material') {
  const trimText3 = trimText(index)
    ['replace'](/[<>:"/\\|?*\u0000-\u001F]/g, '-')
    ['replace'](/\s+/g, ' ')
    ['replace'](/[.\s]+$/g, '')
    ['slice'](0, 80);
  return trimText3 || result;
}
function resolveExtension(response2, data) {
  const trimText4 = trimText(response2['localPath'] || response2['url'])['split'](/[?#]/, 1)[0],
    options = trimText4['match'](/\.([a-z0-9]{1,10})$/i);
  return options?.[1]?.['toLocaleLowerCase']() || DEFAULT_MEDIA_EXTENSIONS[data] || 'bin';
}
export function getMaterialAssetItems(state = {}) {
  if (Array['isArray'](state['items']) && state['items']['length'] > 0)
    return state['items']['map']((nodeData, target) => ({
      ...nodeData,
      nodeData: nodeData?.['nodeData'] || state['nodes']?.[target] || null,
    }));
  return (Array['isArray'](state['nodes']) ? state['nodes'] : [])['map']((type) => ({
    type: type?.['type'] || 'other',
    name: type?.['name'] || '',
    thumbSrc: '',
    nodeData: type,
  }));
}
export function isMaterialAssetFavorite(options2 = {}) {
  return options2['favorite'] === true || options2['isFavorite'] === true;
}
export function getMaterialLibraryGroups({
  assets: assets = [],
  categories: categories = [],
  query: query = '',
  favoritesOnly: favoritesOnly = false,
  categoryKey: categoryKey = (source) => normalizeSearchText(source),
} = {}) {
  const searchText = normalizeSearchText(query),
    list = [],
    handler = (next) => {
      const category2 = trimText(next);
      if (!category2) return;
      const key2 = categoryKey(category2);
      if (!key2 || list['some']((event) => event['key'] === key2)) return;
      list['push']({ key: key2, category: category2, assets: [] });
    };
  ((Array['isArray'](categories) ? categories : [])['forEach'](handler),
    (Array['isArray'](assets) ? assets : [])['forEach']((current) => handler(current?.['category'])));
  const map = new Map(list['map']((event2) => [event2['key'], event2]));
  for (const error of Array['isArray'](assets) ? assets : []) {
    if (!error || typeof error !== 'object') continue;
    if (favoritesOnly && !isMaterialAssetFavorite(error)) continue;
    const list2 = getMaterialAssetItems(error),
      list3 = normalizeSearchText(
        [
          error['name'],
          error['category'],
          ...list2['map']((error2) => error2?.['name'] || error2?.['nodeData']?.['name']),
        ]['join'](' '),
      );
    if (searchText && !list3['includes'](searchText)) continue;
    const categoryKey2 = categoryKey(error['category']),
      entry = map['get'](categoryKey2);
    if (entry) entry['assets']['push'](error);
  }
  if (!searchText && !favoritesOnly) return list;
  return list['filter']((record) => record['assets']['length'] > 0);
}
export function getMaterialFolderAssetCounts({
  groups: groups = [],
  parents: parents = {},
  categoryKey: categoryKey = (payload) => normalizeSearchText(payload),
} = {}) {
  const map2 = new Map(),
    map3 = new Map();
  for (const handle of Array['isArray'](groups) ? groups : []) {
    const categoryKey3 = categoryKey(handle?.['category']);
    if (!categoryKey3) continue;
    map2['set'](categoryKey3, Array['isArray'](handle?.['assets']) ? handle['assets']['length'] : 0);
  }
  for (const [config, scope] of Object['entries'](parents || {})) {
    const categoryKey4 = categoryKey(config),
      categoryKey5 = categoryKey(scope);
    if (
      !categoryKey4 ||
      !categoryKey5 ||
      categoryKey4 === categoryKey5 ||
      !map2['has'](categoryKey4) ||
      !map2['has'](categoryKey5)
    )
      continue;
    map3['set'](categoryKey4, categoryKey5);
  }
  for (const input of Array['isArray'](groups) ? groups : []) {
    const categoryKey6 = categoryKey(input?.['category']),
      count = Array['isArray'](input?.['assets']) ? input['assets']['length'] : 0;
    if (!categoryKey6 || count <= 0) continue;
    const map4 = new Set([categoryKey6]);
    let output = map3['get'](categoryKey6);
    while (output && !map4['has'](output)) {
      (map4['add'](output),
        map2['set'](output, (map2['get'](output) || 0) + count),
        (output = map3['get'](output)));
    }
  }
  return map2;
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
  const currentCategory2 = trimText(currentCategory),
    category3 = trimText(nextCategory),
    currentKey = trimText(categoryKey(currentCategory2)),
    nextKey = trimText(categoryKey(category3)),
    list4 = Array['isArray'](userCategories) ? userCategories : [],
    count2 = list4['findIndex']((value2) => trimText(categoryKey(value2)) === currentKey);
  if (!currentKey || !nextKey || count2 < 0) return { status: 'invalid' };
  if (currentCategory2 === category3) return { status: 'unchanged' };
  if (
    nextKey !== currentKey &&
    (Array['isArray'](allCategories) ? allCategories : [])['some'](
      (value3) => trimText(categoryKey(value3)) === nextKey,
    )
  )
    return { status: 'duplicate' };
  const nextUserCategories = [...list4];
  nextUserCategories[count2] = category3;
  const originalAssets = (Array['isArray'](assets) ? assets : [])['filter'](
      (value4) => trimText(categoryKey(value4?.['category'])) === currentKey,
    ),
    updatedAt = Number['isFinite'](Number(now)) ? Number(now) : Date['now'](),
    renamedAssets = originalAssets['map']((args, value5) => ({
      ...args,
      category: category3,
      updatedAt: updatedAt + value5,
    }));
  return {
    status: 'ready',
    currentCategory: currentCategory2,
    currentKey: currentKey,
    nextCategory: category3,
    nextKey: nextKey,
    nextUserCategories: nextUserCategories,
    originalAssets: originalAssets,
    renamedAssets: renamedAssets,
  };
}
export function normalizeMaterialFolderParents({
  parents: parents = {},
  userCategories: userCategories = [],
  allCategories: allCategories = userCategories,
  categoryKey: categoryKey = normalizeSearchText,
} = {}) {
  const map5 = new Map();
  for (const value6 of Array['isArray'](allCategories) ? allCategories : []) {
    const trimText5 = trimText(value6),
      trimText6 = trimText(categoryKey(trimText5));
    trimText5 && trimText6 && !map5['has'](trimText6) && map5['set'](trimText6, trimText5);
  }
  const map6 = new Set(
      (Array['isArray'](userCategories) ? userCategories : [])
        ['map']((value7) => trimText(categoryKey(value7)))
        ['filter'](Boolean),
    ),
    map7 = new Map();
  for (const [value8, value9] of Object['entries'](parents && typeof parents === 'object' ? parents : {})) {
    const trimText7 = trimText(categoryKey(value8)),
      parentKey = trimText(categoryKey(value9)),
      child = map5['get'](trimText7),
      parent = map5['get'](parentKey);
    if (!child || !parent || trimText7 === parentKey || !map6['has'](trimText7)) continue;
    map7['set'](trimText7, { child: child, parent: parent, parentKey: parentKey });
  }
  const value10 = {};
  for (const [value11, value12] of map7) {
    const map8 = new Set([value11]);
    let value13 = value12['parentKey'],
      enabled = false;
    while (map7['has'](value13)) {
      if (map8['has'](value13)) {
        enabled = true;
        break;
      }
      (map8['add'](value13), (value13 = map7['get'](value13)['parentKey']));
    }
    if (!enabled) value10[value12['child']] = value12['parent'];
  }
  return value10;
}
export function renameMaterialFolderParent({
  parents: parents = {},
  currentCategory: currentCategory = '',
  nextCategory: nextCategory = '',
  categoryKey: categoryKey = normalizeSearchText,
} = {}) {
  const trimText8 = trimText(categoryKey(currentCategory)),
    trimText9 = trimText(nextCategory);
  if (!trimText8 || !trimText9) return { ...(parents || {}) };
  const value14 = {};
  for (const [value15, value16] of Object['entries'](parents && typeof parents === 'object' ? parents : {})) {
    const trimText10 = trimText(categoryKey(value15)) === trimText8 ? trimText9 : value15,
      trimText11 = trimText(categoryKey(value16)) === trimText8 ? trimText9 : value16;
    value14[trimText10] = trimText11;
  }
  return value14;
}
export function deleteMaterialFolderParent({
  parents: parents = {},
  category: category = '',
  categoryKey: categoryKey = normalizeSearchText,
} = {}) {
  const trimText12 = trimText(categoryKey(category));
  if (!trimText12) return { ...(parents || {}) };
  const list5 = Object['entries'](parents && typeof parents === 'object' ? parents : {}),
    value17 = list5['find'](([value18]) => trimText(categoryKey(value18)) === trimText12)?.[1] || '',
    value19 = {};
  for (const [value20, value21] of list5) {
    if (trimText(categoryKey(value20)) === trimText12) continue;
    if (trimText(categoryKey(value21)) === trimText12) {
      if (value17) value19[value20] = value17;
      continue;
    }
    value19[value20] = value21;
  }
  return value19;
}
export function buildMaterialDuplicate(
  error3 = {},
  { id: id, now: now = Date['now'](), nameSuffix: nameSuffix = ' 副本' } = {},
) {
  if (!error3 || typeof error3 !== 'object' || !trimText(id)) return null;
  const error4 = JSON['parse'](JSON['stringify'](error3));
  ((error4['id'] = trimText(id)),
    (error4['name'] = '' + (trimText(error3['name']) || '未命名素材') + nameSuffix),
    (error4['createdAt'] = now),
    (error4['updatedAt'] = now),
    (error4['favorite'] = false),
    delete error4['isFavorite'],
    delete error4['packageKey'],
    delete error4['packageMetadata']);
  for (const enabled2 of Array['isArray'](error4['items']) ? error4['items'] : []) {
    if (!enabled2 || typeof enabled2 !== 'object') continue;
    delete enabled2['packageItemKey'];
    if (!enabled2['nodeData'] || typeof enabled2['nodeData'] !== 'object') continue;
    delete enabled2['nodeData']['assetPackageItemKey'];
  }
  for (const enabled3 of Array['isArray'](error4['nodes']) ? error4['nodes'] : []) {
    if (!enabled3 || typeof enabled3 !== 'object') continue;
    delete enabled3['assetPackageItemKey'];
  }
  return error4;
}
export function buildMaterialDownloadFiles(error5 = {}) {
  const sanitizeFilenamePart2 = sanitizeFilenamePart(error5['name'], 'material'),
    list6 = [];
  return (
    getMaterialAssetItems(error5)['forEach']((error6, value22) => {
      const error7 = error6?.['nodeData'] || {},
        kind = normalizeMaterialKind(error6?.['type'] || error7?.['type']);
      if (!kind) return;
      const localPath2 = getMaterialNodeSource(error7);
      if (!localPath2['localPath'] && !localPath2['url']) return;
      const extension = resolveExtension(localPath2, kind),
        sanitizeFilenamePart3 = sanitizeFilenamePart(error6?.['name'] || error7?.['name'], ''),
        value23 =
          sanitizeFilenamePart3 ||
          (getMaterialAssetItems(error5)['length'] > 1 ? '' + (value22 + 1) : '');
      list6['push']({
        kind: kind,
        localPath: localPath2['localPath'],
        url: localPath2['url'],
        filename: '' + sanitizeFilenamePart2 + (value23 ? '-' + value23 : '') + '.' + extension,
      });
    }),
    list6
  );
}
