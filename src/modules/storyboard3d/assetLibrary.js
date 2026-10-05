import { getSceneAssetCategories, listSceneAssets } from '../panoramaSceneNode/sceneAssetCatalog.js';
import { STORYBOARD_3D_BODY_PRESETS } from './characterRig.js';
import { resolveStoryboard3DAssetSpatialMetadata } from './spatialLayout.js';
const DEFAULT_RECENT_LIMIT = 24;
export const STORYBOARD_3D_CLAY_MODEL_TINT = '#e8edf5';
const PROCEDURAL_SIZE_TAGS = new Set(['small', 'medium', 'large']),
  PROCEDURAL_COLOR_TAGS = new Set(['blue', 'red', 'green', 'yellow', 'purple']);
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeTags(list) {
  return Array['isArray'](list)
    ? [...new Set(list['map'](normalizeText)['filter'](Boolean))]['slice'](0, 32)
    : [];
}
function normalizeHexColor(item) {
  const text = normalizeText(item)['toLowerCase']();
  return /^#[0-9a-f]{6}$/['test'](text) ? text : '';
}
function getProceduralAssetDisplayName(options = {}) {
  return (
    normalizeText(options['name'])['replace'](
      /\s+(?:Small|Medium|Large)\s+(?:Blue|Red|Green|Yellow|Purple)$/i,
      '',
    ) ||
    normalizeText(options['familyId']) ||
    normalizeText(options['id'])
  );
}
const STORYBOARD_3D_ASSET_CATEGORY_LABELS = Object['freeze']({
  all: '全部',
  architecture: '建筑',
  furniture: '家具',
  stage: '舞台',
  props: '道具',
  nature: '自然',
  animal: '动物',
  appliance: '家电',
  decoration: '装饰',
  electronics: '电子设备',
  food: '食物',
  kitchenware: '厨具',
  lighting: '灯具',
  structure: '建筑结构',
  tableware: '餐具',
  vehicle: '交通工具',
  character: '人物',
  imported: '已导入',
  recent: '最近使用',
  favorite: '我的收藏',
});
export function getStoryboard3DAssetCategoryLabel(key) {
  const text2 = normalizeText(key)['toLocaleLowerCase']();
  return STORYBOARD_3D_ASSET_CATEGORY_LABELS[text2] || text2 || '未分类';
}
export const STORYBOARD_3D_ASSET_CATEGORIES = Object['freeze']([
  Object['freeze']({ id: 'all', label: getStoryboard3DAssetCategoryLabel('all') }),
  ...[
    ...new Set([
      ...getSceneAssetCategories(),
      ...Object['keys'](STORYBOARD_3D_ASSET_CATEGORY_LABELS)['filter'](
        (index) => !['all', 'character', 'imported', 'recent', 'favorite']['includes'](index),
      ),
    ]),
  ]['map']((result) => Object['freeze']({ id: result, label: getStoryboard3DAssetCategoryLabel(result) })),
  Object['freeze']({ id: 'character', label: getStoryboard3DAssetCategoryLabel('character') }),
  Object['freeze']({ id: 'imported', label: getStoryboard3DAssetCategoryLabel('imported') }),
]);
export function normalizeStoryboard3DAssetDescriptor(options2 = {}) {
  const text3 = normalizeText(options2['id']);
  if (!text3) throw new Error('Asset id is required.');
  const text4 = normalizeText(options2['source']?.['kind'])['toLowerCase'](),
    data = text4 === 'file' ? 'file' : text4 === 'pack' ? 'pack' : 'builtin';
  return {
    id: text3,
    name: normalizeText(options2['name']) || text3,
    category: normalizeText(options2['category']) || (data === 'file' ? 'imported' : 'props'),
    tags: normalizeTags(options2['tags']),
    source:
      data === 'file'
        ? {
            kind: 'file',
            format: normalizeText(options2['source']?.['format'])['toLowerCase'](),
            fileName: normalizeText(options2['source']?.['fileName']),
            byteLength: Math['max'](0, Number(options2['source']?.['byteLength']) || 0),
            fingerprint: normalizeText(options2['source']?.['fingerprint']),
          }
        : data === 'pack'
          ? {
              kind: 'pack',
              assetId: normalizeText(options2['source']?.['assetId']) || text3,
              packId: normalizeText(options2['source']?.['packId'] || options2['source']?.['sourcePack']),
              format: normalizeText(options2['source']?.['format'])['toLowerCase'](),
              url: normalizeText(options2['source']?.['url']),
              familyId: normalizeText(options2['source']?.['familyId']),
              license: normalizeText(options2['source']?.['license']),
            }
          : { kind: 'builtin', assetId: normalizeText(options2['source']?.['assetId']) || text3 },
    thumbnailUrl: normalizeText(options2['thumbnailUrl']),
    tint: normalizeHexColor(options2['tint']),
    normalization:
      options2['normalization'] && typeof options2['normalization'] === 'object'
        ? structuredClone(options2['normalization'])
        : null,
    assetRecord:
      options2['assetRecord'] && typeof options2['assetRecord'] === 'object'
        ? structuredClone(options2['assetRecord'])
        : null,
    spatial: resolveStoryboard3DAssetSpatialMetadata(options2),
    createdAt: Math['max'](0, Number(options2['createdAt']) || 0),
  };
}
export function listBuiltinStoryboard3DAssets() {
  const map = new Map();
  return (
    listSceneAssets()['forEach']((target) => {
      const text5 = normalizeText(target['familyId']) || normalizeText(target['id']);
      if (!text5) return;
      const enabled = map['get'](text5),
        source = target['size'] === 'medium' && target['colorKey'] === 'blue';
      if (!enabled || source) map['set'](text5, target);
    }),
    [
      ...[...map['values']()]['map']((args) =>
        normalizeStoryboard3DAssetDescriptor({
          id: args['id'],
          name: getProceduralAssetDisplayName(args),
          category: args['category'],
          tags: [
            args['familyId'],
            ...args['tags']['filter'](
              (next) => !PROCEDURAL_SIZE_TAGS['has'](next) && !PROCEDURAL_COLOR_TAGS['has'](next),
            ),
          ],
          tint: STORYBOARD_3D_CLAY_MODEL_TINT,
          source: { kind: 'builtin', assetId: args['id'] },
        }),
      ),
      ...STORYBOARD_3D_BODY_PRESETS['map']((error) =>
        normalizeStoryboard3DAssetDescriptor({
          id: error['id'],
          name: error['name'],
          category: 'character',
          tags: ['character', '人物', 'mannequin', ...(error['tags'] || [])],
          source: { kind: 'builtin', assetId: error['id'] },
        }),
      ),
    ]
  );
}
export function searchStoryboard3DAssets(
  list2,
  {
    query: query = '',
    category: category = 'all',
    recentAssetIds: recentAssetIds = [],
    limit: limit = 80,
    offset: offset = 0,
  } = {},
) {
  const text6 = normalizeText(query)['toLocaleLowerCase'](),
    text7 = normalizeText(category)['toLocaleLowerCase']() || 'all',
    map2 = new Map(recentAssetIds['map']((current, entry) => [normalizeText(current), entry])),
    record = Math['max'](0, Math['floor'](Number(offset) || 0)),
    payload = Math['max'](1, Math['min'](1600, Math['floor'](Number(limit) || 80)));
  return list2['filter']((args2) => {
    if (text7 === 'recent' && !map2['has'](args2['id'])) return false;
    if (text7 !== 'all' && text7 !== 'recent' && args2['category'] !== text7) return false;
    if (!text6) return true;
    return [args2['id'], args2['name'], args2['category'], ...args2['tags']]
      ['join'](' ')
      ['toLocaleLowerCase']()
      ['includes'](text6);
  })
    ['sort']((handle, state) => {
      if (text7 !== 'recent') return 0;
      return map2['get'](handle['id']) - map2['get'](state['id']);
    })
    ['slice'](record, record + payload);
}
export function createStoryboard3DAssetLibrary({
  builtinAssets: builtinAssets = listBuiltinStoryboard3DAssets(),
  importedAssets: importedAssets = [],
  recentAssetIds: recentAssetIds = [],
  recentLimit: recentLimit = DEFAULT_RECENT_LIMIT,
} = {}) {
  const map3 = new Map(),
    config = Math['max'](1, Math['min'](100, Math['floor'](Number(recentLimit) || DEFAULT_RECENT_LIMIT)));
  let args3 = recentAssetIds['map'](normalizeText)['filter'](Boolean)['slice'](0, config);
  for (const scope of [...builtinAssets, ...importedAssets]) {
    const storyboard3DAssetDescriptor = normalizeStoryboard3DAssetDescriptor(scope);
    map3['set'](storyboard3DAssetDescriptor['id'], storyboard3DAssetDescriptor);
  }
  return (
    (args3 = [...new Set(args3)]['filter']((input) => map3['has'](input))),
    {
      list(args4 = {}) {
        return searchStoryboard3DAssets([...map3['values']()], { ...args4, recentAssetIds: args3 })['map'](
          (output) => structuredClone(output),
        );
      },
      find(value2) {
        const value3 = map3['get'](normalizeText(value2));
        return value3 ? structuredClone(value3) : null;
      },
      registerImported(args5) {
        const storyboard3DAssetDescriptor2 = normalizeStoryboard3DAssetDescriptor({
          ...args5,
          category: 'imported',
          source: { ...args5?.['source'], kind: 'file' },
        });
        return (
          map3['set'](storyboard3DAssetDescriptor2['id'], storyboard3DAssetDescriptor2),
          structuredClone(storyboard3DAssetDescriptor2)
        );
      },
      registerPackAssets(list3 = [], { packId: packId = '' } = {}) {
        const value4 = [];
        for (const response of Array['isArray'](list3) ? list3 : []) {
          const storyboard3DAssetDescriptor3 = normalizeStoryboard3DAssetDescriptor({
            ...response,
            tags: response?.['tags'] || response?.['keywords'],
            source: {
              kind: 'pack',
              assetId: response?.['id'],
              packId: response?.['source']?.['packId'] || response?.['sourcePack'] || packId,
              format: response?.['source']?.['format'] || response?.['format'],
              url: response?.['source']?.['url'] || response?.['url'],
              familyId: response?.['source']?.['familyId'] || response?.['familyId'],
              license: response?.['source']?.['license'] || response?.['license'],
            },
          });
          if (
            !storyboard3DAssetDescriptor3['source']['url'] ||
            !storyboard3DAssetDescriptor3['source']['format']
          )
            continue;
          (map3['set'](storyboard3DAssetDescriptor3['id'], storyboard3DAssetDescriptor3),
            value4['push'](structuredClone(storyboard3DAssetDescriptor3)));
        }
        return value4;
      },
      markUsed(value5) {
        const text8 = normalizeText(value5);
        if (!map3['has'](text8)) return false;
        return (
          (args3 = [text8, ...args3['filter']((value6) => value6 !== text8)]['slice'](0, config)),
          true
        );
      },
      getRecentAssetIds() {
        return [...args3];
      },
      serialize() {
        return {
          importedAssets: [...map3['values']()]
            ['filter']((value7) => value7['source']['kind'] === 'file')
            ['map']((value8) => structuredClone(value8)),
          recentAssetIds: [...args3],
        };
      },
    }
  );
}
