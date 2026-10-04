import { getAssetMentionCandidates, getAssetMentionLibrarySettings } from './assetMentionRegistry.js';
import {
  DEFAULT_MATERIAL_LIBRARY_CATEGORIES,
  getMaterialFolderAssetCounts,
  getMaterialLibraryGroups,
  normalizeMaterialFolderParents,
} from './materialLibraryPolicy.js';
const MEDIA_LABELS = Object['freeze']({
  image: '图片',
  video: '视频',
  audio: '音频',
  text: '文本',
});
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function normalizeCategoryKey(item) {
  return normalizeText(item)['toLocaleLowerCase']();
}
function escapeHtml(key) {
  return String(key ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function resolveAssetCategory(options = {}) {
  return normalizeText(options['category'] || options['assetCategory']) || '其他';
}
function formatCategoryLabel(index) {
  return normalizeText(index) === 'Others' ? '其他' : normalizeText(index);
}
function createCategoryValueMap(options2 = {}) {
  return new Map(
    Object['entries'](options2 && typeof options2 === 'object' ? options2 : {})
      ['map'](([result, data]) => [normalizeCategoryKey(result), normalizeText(data)])
      ['filter'](([target, source]) => target && source),
  );
}
function activateWorkspaceAssetLibraryImages(next) {
  next?.['querySelectorAll']?.(
    ':scope > .workspace-asset-library-grid [data-workspace-asset-library-image]',
  )?.['forEach']?.((current) => {
    current['loading'] = 'eager';
  });
}
export function handleWorkspaceAssetLibraryImageError(entry) {
  const record = entry?.['target'],
    text = normalizeText(record?.['getAttribute']?.('data-workspace-asset-library-fallback-src'));
  if (!text) return ![];
  record['removeAttribute']?.('data-workspace-asset-library-fallback-src');
  if (normalizeText(record['getAttribute']?.('src')) === text) return ![];
  return ((record['loading'] = 'eager'), record['setAttribute']?.('src', text), !![]);
}
export function getWorkspaceAssetLibraryMediaLabel(payload) {
  return MEDIA_LABELS[normalizeText(payload)['toLocaleLowerCase']()] || '素材';
}
export function buildWorkspaceAssetLibraryItems({
  allowedTypes: allowedTypes = ['image'],
  limit: limit = 0x0,
} = {}) {
  const assetMentionCandidates = getAssetMentionCandidates({ allowedTypes: allowedTypes }),
    handle =
      Number(limit) > 0x0
        ? assetMentionCandidates['slice'](0x0, Math['trunc'](Number(limit)))
        : assetMentionCandidates;
  return handle['map']((sourceAssetId) => {
    const thumbnailUrl = normalizeText(sourceAssetId['thumbUrl']),
      imageUrl = normalizeText(sourceAssetId['url']) || thumbnailUrl,
      category = normalizeText(sourceAssetId['category'] || sourceAssetId['assetCategory']) || '其他';
    return {
      id: 'library-' + sourceAssetId['assetId'] + '-' + sourceAssetId['itemIndex'],
      sourceAssetId: sourceAssetId['assetId'],
      sourceItemIndex: sourceAssetId['itemIndex'],
      kind: 'library',
      mediaKind: sourceAssetId['type'],
      category: category,
      assetCategory: category,
      name: sourceAssetId['name'] || sourceAssetId['assetName'] || '素材',
      assetName: sourceAssetId['assetName'] || '未分组素材',
      role: getWorkspaceAssetLibraryMediaLabel(sourceAssetId['type']) + '素材',
      occurrences: '来自总素材',
      description: sourceAssetId['assetName']
        ? '来自素材组「' + sourceAssetId['assetName'] + '」'
        : '来自总素材',
      prompt: '',
      imageUrl: imageUrl,
      thumbnailUrl: thumbnailUrl,
      sourceUrl: imageUrl,
      isLibraryAsset: !![],
    };
  });
}
export function buildWorkspaceAssetLibraryHierarchy({
  assets: assets = [],
  categories: categories = null,
  displayNames: displayNames = null,
  parents: parents = null,
} = {}) {
  const assetMentionLibrarySettings = getAssetMentionLibrarySettings(),
    categories2 = Array['isArray'](categories) ? categories : assetMentionLibrarySettings['categories'],
    state =
      displayNames && typeof displayNames === 'object'
        ? displayNames
        : assetMentionLibrarySettings['displayNames'],
    parents2 = parents && typeof parents === 'object' ? parents : assetMentionLibrarySettings['parents'],
    assets2 = (Array['isArray'](assets) ? assets : [])['map']((args) => ({
      ...args,
      category: resolveAssetCategory(args),
    })),
    allCategories = getMaterialLibraryGroups({
      assets: assets2,
      categories: categories2['length'] ? categories2 : DEFAULT_MATERIAL_LIBRARY_CATEGORIES,
      categoryKey: normalizeCategoryKey,
    }),
    parents3 = normalizeMaterialFolderParents({
      parents: parents2,
      userCategories: Object['keys'](parents2 || {}),
      allCategories: allCategories['map']((config) => config['category']),
      categoryKey: normalizeCategoryKey,
    }),
    categoryValueMap = createCategoryValueMap(parents3),
    label = createCategoryValueMap(state),
    count = getMaterialFolderAssetCounts({
      groups: allCategories,
      parents: parents3,
      categoryKey: normalizeCategoryKey,
    }),
    scope = allCategories['map']((assets3) => {
      const category2 = resolveAssetCategory(assets3),
        categoryKey = normalizeCategoryKey(category2);
      return {
        category: category2,
        label: label['get'](categoryKey) || formatCategoryLabel(category2),
        count: count['get'](categoryKey) ?? assets3['assets']['length'],
        assets: assets3['assets'],
        children: [],
      };
    }),
    input = new Map(scope['map']((output) => [normalizeCategoryKey(output['category']), output])),
    value2 = [];
  scope['forEach']((value3) => {
    const value4 = input['get'](
      normalizeCategoryKey(categoryValueMap['get'](normalizeCategoryKey(value3['category']))),
    );
    if (value4 && value4 !== value3) value4['children']['push'](value3);
    else value2['push'](value3);
  });
  const value5 = (value6) => {
    return (
      (value6['children'] = value6['children']['filter'](value5)),
      value6['assets']['length'] > 0x0 || value6['children']['length'] > 0x0
    );
  };
  return value2['filter'](value5);
}
export function getWorkspaceAssetLibrarySelectionOrder(assets4, value7) {
  const run = (value8) =>
    value8['flatMap']((args2) =>
      value7?.['isExpanded'](args2['category'])
        ? [...run(args2['children']), ...args2['assets']['map']((value9) => value9['id'])]
        : [],
    );
  return run(buildWorkspaceAssetLibraryHierarchy({ assets: assets4 }));
}
export function renderWorkspaceAssetLibraryGroups({
  assets: assets = [],
  expandedCategories: expandedCategories = [],
  renderAsset: renderAsset = () => '',
} = {}) {
  const value10 = new Set(
      (Array['isArray'](expandedCategories) ? expandedCategories : [])
        ['map'](normalizeCategoryKey)
        ['filter'](Boolean),
    ),
    workspaceAssetLibraryHierarchy = buildWorkspaceAssetLibraryHierarchy({ assets: assets });
  if (!workspaceAssetLibraryHierarchy['length']) return '';
  const run2 = (value11, count2 = 0x0) => {
    const value12 = value11['category'],
      escapeHtml2 = escapeHtml(value12),
      enabled = value10['has'](normalizeCategoryKey(value12)),
      value13 = value11['children']['map']((value14) => run2(value14, count2 + 0x1))['join'](''),
      value15 = value11['assets']['length']
        ? '<div class="story-asset-grid workspace-asset-library-grid">' +
          value11['assets']['map'](renderAsset)['join']('') +
          '</div>'
        : '';
    return (
      '<section\x20class=\x22v2-material-folder\x20workspace-asset-library-group' +
      (count2 > 0x0 ? ' is-nested' : '') +
      '\x22\x20data-workspace-asset-library-category=\x22' +
      escapeHtml2 +
      '" role="treeitem" aria-level="' +
      (count2 + 0x1) +
      '\x22\x20aria-expanded=\x22' +
      enabled +
      '">\n      <div class="v2-material-folder-row workspace-asset-library-folder-row">\n        <button type="button" class="v2-material-folder-toggle workspace-asset-library-folder-toggle" data-workspace-asset-library-toggle="' +
      escapeHtml2 +
      '" aria-expanded="' +
      enabled +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22v2-material-tree-chevron' +
      (enabled ? ' is-open' : '') +
      '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>\n          <span class="v2-material-folder-icon" aria-hidden="true"><svg viewBox="0 0 28 24"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11l2.4 2.5h10.1A2.5 2.5 0 0 1 26 8v11.5a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 2 19.5v-14Z" fill="currentColor"/></svg></span>\n          <span class="v2-material-folder-name">' +
      escapeHtml(value11['label']) +
      '</span>\n        </button>\n        <span class="v2-material-folder-count">' +
      value11['count'] +
      '</span>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-material-folder-content\x20workspace-asset-library-category-content\x22\x20data-workspace-asset-library-category-content=\x22' +
      escapeHtml2 +
      '\x22\x20role=\x22group\x22\x20aria-hidden=\x22' +
      !enabled +
      '\x22' +
      (enabled ? '' : ' hidden') +
      '>\n        ' +
      value13 +
      value15 +
      '\n      </div>\n    </section>'
    );
  };
  return (
    '<div class="workspace-asset-library-groups" data-workspace-asset-library-groups role="tree" aria-label="总素材分类">\n    ' +
    workspaceAssetLibraryHierarchy['map']((value16) => run2(value16))['join']('') +
    '\n  </div>'
  );
}
export function createWorkspaceAssetLibraryDisclosure({ expandedCategories: expandedCategories = [] } = {}) {
  const args3 = new Set(
      (Array['isArray'](expandedCategories) ? expandedCategories : [])
        ['map'](normalizeCategoryKey)
        ['filter'](Boolean),
    ),
    value17 = new Map(),
    isExpanded = (value18) => args3['has'](normalizeCategoryKey(value18)),
    toggle = (value19) => {
      const text2 = normalizeText(value19),
        categoryKey2 = normalizeCategoryKey(text2);
      if (!categoryKey2) return ![];
      value17['set'](categoryKey2, text2);
      if (args3['has'](categoryKey2)) args3['delete'](categoryKey2);
      else args3['add'](categoryKey2);
      return args3['has'](categoryKey2);
    };
  return {
    getExpandedCategories: () => [...args3]['map']((value20) => value17['get'](value20) || value20),
    isExpanded: isExpanded,
    toggle: toggle,
    toggleFromTarget(value21) {
      const enabled2 = value21?.['closest']?.('[data-workspace-asset-library-toggle]');
      if (!enabled2) return ![];
      const value22 = enabled2['dataset']?.['workspaceAssetLibraryToggle'],
        enabled3 = toggle(value22),
        value23 = enabled2['closest']?.('[data-workspace-asset-library-category]'),
        value24 = value23?.['querySelector']?.('[data-workspace-asset-library-category-content]');
      (value23?.['setAttribute']?.('aria-expanded', String(enabled3)),
        enabled2['setAttribute']?.('aria-expanded', String(enabled3)),
        enabled2['querySelector']?.('.v2-material-tree-chevron')?.['classList']?.['toggle']?.(
          'is-open',
          enabled3,
        ));
      if (value24) {
        ((value24['hidden'] = !enabled3), value24['setAttribute']?.('aria-hidden', String(!enabled3)));
        if (enabled3) activateWorkspaceAssetLibraryImages(value24);
      }
      return !![];
    },
    render(args4 = {}) {
      return renderWorkspaceAssetLibraryGroups({
        ...args4,
        expandedCategories: [...args3],
      });
    },
  };
}
