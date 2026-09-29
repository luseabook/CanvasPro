import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MATERIAL_LIBRARY_CATEGORY_LIMIT,
  DEFAULT_MATERIAL_LIBRARY_CATEGORIES,
  getMaterialAssetItems,
  isMaterialAssetFavorite,
  getMaterialLibraryGroups,
  getMaterialFolderAssetCounts,
  buildMaterialCategoryRenamePlan,
  normalizeMaterialFolderParents,
  renameMaterialFolderParent,
  deleteMaterialFolderParent,
  buildMaterialDuplicate,
  buildMaterialDownloadFiles,
} from './materialLibraryPolicy.js';

test('exposes the category limit and freezes the default category list', () => {
  assert.equal(MATERIAL_LIBRARY_CATEGORY_LIMIT, 99);
  assert.equal(Object.isFrozen(DEFAULT_MATERIAL_LIBRARY_CATEGORIES), true);
  assert.deepEqual(
    [...DEFAULT_MATERIAL_LIBRARY_CATEGORIES],
    ['人物', '场景', '物品', '风格', '音效', 'Others'],
  );
});

test('defaults asset items to an empty list when nothing usable is supplied', () => {
  assert.deepEqual(getMaterialAssetItems(), []);
  assert.deepEqual(getMaterialAssetItems({}), []);
  assert.deepEqual(getMaterialAssetItems({ items: [], nodes: 'nope' }), []);
  assert.deepEqual(getMaterialAssetItems({ items: 'nope', nodes: null }), []);
});

test('maps items and fills missing nodeData from the parallel nodes list', () => {
  const nodes = [{ n: 1 }, { n: 2 }];
  const items = [{ type: 'image' }, { type: 'video', nodeData: { own: true }, extra: 'keep' }];
  const result = getMaterialAssetItems({ items, nodes });
  assert.deepEqual(result, [
    { type: 'image', nodeData: { n: 1 } },
    { type: 'video', nodeData: { own: true }, extra: 'keep' },
  ]);
  assert.equal(result[0].nodeData, nodes[0]);
  assert.equal(result[1].nodeData, items[1].nodeData);
  assert.equal(items[0].nodeData, undefined);
});

test('falls back to the nodes list when items is empty and normalizes node fields', () => {
  const nodes = [{ type: 'video', name: 'Clip' }, {}, { type: null, name: '' }];
  const result = getMaterialAssetItems({ items: [], nodes });
  assert.deepEqual(result, [
    { type: 'video', name: 'Clip', thumbSrc: '', nodeData: nodes[0] },
    { type: 'other', name: '', thumbSrc: '', nodeData: nodes[1] },
    { type: 'other', name: '', thumbSrc: '', nodeData: nodes[2] },
  ]);
  assert.equal(result[2].nodeData, nodes[2]);
});

test('treats a null entry of the items branch as an empty object', () => {
  assert.deepEqual(getMaterialAssetItems({ items: [null], nodes: [{ n: 1 }] }), [{ nodeData: { n: 1 } }]);
  assert.deepEqual(getMaterialAssetItems({ items: [null] }), [{ nodeData: null }]);
});

test('recognizes favorites through either flag and only when strictly true', () => {
  assert.equal(isMaterialAssetFavorite({ favorite: true }), true);
  assert.equal(isMaterialAssetFavorite({ isFavorite: true }), true);
  assert.equal(isMaterialAssetFavorite({ favorite: true, isFavorite: true }), true);
  for (const asset of [
    {},
    { favorite: false },
    { isFavorite: 1 },
    { favorite: 'true' },
    { favorite: null },
  ]) {
    assert.equal(isMaterialAssetFavorite(asset), false);
  }
  assert.equal(isMaterialAssetFavorite(undefined), false);
});

test('keeps category order and empty folders when no query or favorites filter is active', () => {
  const assets = [
    { id: 'a', name: 'Alpha', category: '物品' },
    { id: 'b', name: 'Beta', category: '人物' },
  ];
  const groups = getMaterialLibraryGroups({ categories: ['人物', '场景'], assets });
  assert.deepEqual(
    groups.map((group) => group.key),
    ['人物', '场景', '物品'],
  );
  assert.deepEqual(
    groups.map((group) => group.category),
    ['人物', '场景', '物品'],
  );
  assert.deepEqual(
    groups.map((group) => group.assets.map((asset) => asset.id)),
    [['b'], [], ['a']],
  );
  assert.equal(groups[0].assets[0], assets[1]);
});

test('registers category labels from assets while skipping blanks and duplicates', () => {
  const groups = getMaterialLibraryGroups({
    categories: ['  Props ', '', '   ', 'Props', null, false],
    assets: [{ id: 1, category: ' props ' }, { id: 2, category: ' PROPS ' }, { id: 3 }],
  });
  assert.deepEqual(
    groups.map((group) => group.key),
    ['props'],
  );
  assert.equal(groups[0].category, 'Props');
  assert.deepEqual(
    groups[0].assets.map((asset) => asset.id),
    [1, 2],
  );
});

test('matches the query against names, categories and nested item names', () => {
  const assets = [
    { id: 1, name: 'Red Car', category: 'Objects' },
    { id: 2, name: 'Blue Car', category: 'Objects' },
    { id: 3, name: 'Tree', category: 'Scenes' },
    {
      id: 4,
      name: 'Pack',
      category: 'Objects',
      items: [{ type: 'image' }],
      nodes: [{ name: 'Hidden Sunset' }],
    },
  ];
  const byName = getMaterialLibraryGroups({ assets, query: '  CAR ' });
  assert.deepEqual(
    byName.map((group) => group.key),
    ['objects'],
  );
  assert.deepEqual(
    byName[0].assets.map((asset) => asset.id),
    [1, 2],
  );
  const byNode = getMaterialLibraryGroups({ assets, query: 'sunset' });
  assert.deepEqual(
    byNode.map((group) => group.assets.map((asset) => asset.id)),
    [[4]],
  );
});

test('filters to non-empty groups when a query is present', () => {
  const groups = getMaterialLibraryGroups({
    categories: ['Empty'],
    assets: [{ id: 1, name: 'Needle', category: 'Full' }],
    query: 'needle',
  });
  assert.deepEqual(
    groups.map((group) => group.key),
    ['full'],
  );
});

test('keeps only favorites when favoritesOnly is set', () => {
  const assets = [
    { id: 1, category: 'A', favorite: true },
    { id: 2, category: 'A', isFavorite: true },
    { id: 3, category: 'A' },
    { id: 4, category: 'B', favorite: 1 },
  ];
  const groups = getMaterialLibraryGroups({ assets, favoritesOnly: true });
  assert.deepEqual(
    groups.map((group) => group.key),
    ['a'],
  );
  assert.deepEqual(
    groups[0].assets.map((asset) => asset.id),
    [1, 2],
  );
});

test('applies the favorites filter together with the query', () => {
  const groups = getMaterialLibraryGroups({
    assets: [
      { id: 1, name: 'Red', category: 'A', favorite: true },
      { id: 2, name: 'Red', category: 'A' },
      { id: 3, name: 'Blue', category: 'A', favorite: true },
    ],
    query: 'red',
    favoritesOnly: true,
  });
  assert.deepEqual(
    groups[0].assets.map((asset) => asset.id),
    [1],
  );
});

test('ignores non-object assets and honors a custom category key', () => {
  const categoryKey = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^cat:/, '');
  const groups = getMaterialLibraryGroups({
    categories: ['cat:Alpha', 'Beta'],
    assets: ['nope', null, { id: 1, category: 'CAT:alpha' }],
    categoryKey,
  });
  assert.deepEqual(
    groups.map((group) => group.key),
    ['alpha', 'beta'],
  );
  assert.deepEqual(
    groups.map((group) => group.category),
    ['cat:Alpha', 'Beta'],
  );
  assert.deepEqual(
    groups[0].assets.map((asset) => asset.id),
    [1],
  );
});

test('does not mutate the groups inputs', () => {
  const assets = [{ id: 1, name: 'A', category: 'Cat' }];
  const categories = ['Cat'];
  const snapshot = JSON.stringify(assets);
  getMaterialLibraryGroups({ assets, categories, query: 'a', favoritesOnly: true });
  assert.equal(JSON.stringify(assets), snapshot);
  assert.deepEqual(categories, ['Cat']);
});

test('counts assets per normalized folder key', () => {
  const counts = getMaterialFolderAssetCounts({
    groups: [
      { category: 'A', assets: [1, 2] },
      { category: 'B', assets: 'nope' },
      { category: '   ', assets: [1] },
    ],
  });
  assert.deepEqual(
    [...counts],
    [
      ['a', 2],
      ['b', 0],
    ],
  );
});

test('rolls child folder counts up to their parents', () => {
  const counts = getMaterialFolderAssetCounts({
    groups: [
      { category: 'A', assets: [1] },
      { category: 'B', assets: [1, 2] },
      { category: 'C', assets: [1, 2, 3] },
    ],
    parents: { B: 'A', C: 'B' },
  });
  assert.deepEqual(
    [...counts],
    [
      ['a', 6],
      ['b', 5],
      ['c', 3],
    ],
  );
});

test('ignores parents that are unknown, self-referential or not groups', () => {
  const counts = getMaterialFolderAssetCounts({
    groups: [
      { category: 'A', assets: [1] },
      { category: 'B', assets: [1] },
    ],
    parents: { B: 'A', C: 'A', A: 'A', A2: 'B' },
  });
  assert.deepEqual(
    [...counts],
    [
      ['a', 2],
      ['b', 1],
    ],
  );
});

test('counts every edge of a parent cycle once per direction', () => {
  const counts = getMaterialFolderAssetCounts({
    groups: [
      { category: 'A', assets: [1] },
      { category: 'B', assets: [1, 2] },
    ],
    parents: { A: 'B', B: 'A' },
  });
  assert.deepEqual(
    [...counts],
    [
      ['a', 3],
      ['b', 3],
    ],
  );
});

test('normalizes group keys and lets the last duplicate win', () => {
  const counts = getMaterialFolderAssetCounts({
    groups: [
      { category: ' Props ', assets: [1] },
      { category: 'props', assets: [1, 2] },
    ],
  });
  assert.deepEqual([...counts], [['props', 2]]);
});

test('handles missing and malformed count inputs', () => {
  assert.deepEqual([...getMaterialFolderAssetCounts()], []);
  assert.deepEqual([...getMaterialFolderAssetCounts({ groups: 'nope', parents: 'nope' })], []);
});

test('honors a custom category key when counting folders', () => {
  const counts = getMaterialFolderAssetCounts({
    groups: [
      { category: 'cat:A', assets: [1] },
      { category: 'cat:B', assets: [1, 2] },
    ],
    parents: { 'cat:B': 'cat:A' },
    categoryKey: (value) =>
      String(value || '')
        .replace(/^cat:/, '')
        .toLowerCase(),
  });
  assert.deepEqual(
    [...counts],
    [
      ['a', 3],
      ['b', 2],
    ],
  );
});

test('reports an invalid rename when the source category is blank or unknown', () => {
  assert.deepEqual(buildMaterialCategoryRenamePlan(), { status: 'invalid' });
  assert.deepEqual(buildMaterialCategoryRenamePlan({ currentCategory: '人物', nextCategory: '角色' }), {
    status: 'invalid',
  });
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      currentCategory: '   ',
      nextCategory: '角色',
    }),
    { status: 'invalid' },
  );
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      currentCategory: '人物',
      nextCategory: '  ',
    }),
    { status: 'invalid' },
  );
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: 'nope',
      currentCategory: '人物',
      nextCategory: '角色',
    }),
    { status: 'invalid' },
  );
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      currentCategory: '人物',
      nextCategory: '角色',
      categoryKey: () => '',
    }),
    { status: 'invalid' },
  );
});

test('reports unchanged only when the trimmed names are identical', () => {
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      currentCategory: '人物',
      nextCategory: '人物',
    }),
    { status: 'unchanged' },
  );
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      currentCategory: ' 人物 ',
      nextCategory: '人物',
    }),
    { status: 'unchanged' },
  );
});

test('reports invalid before unchanged when the category is not user-owned', () => {
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['场景'],
      currentCategory: '人物',
      nextCategory: '人物',
    }),
    { status: 'invalid' },
  );
});

test('reports duplicate when the target key already exists elsewhere', () => {
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物', '场景'],
      currentCategory: '人物',
      nextCategory: ' 场景 ',
    }),
    { status: 'duplicate' },
  );
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      allCategories: ['人物', 'Others'],
      currentCategory: '人物',
      nextCategory: 'Others',
    }),
    { status: 'duplicate' },
  );
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      allCategories: ['人物', 'Others'],
      currentCategory: '人物',
      nextCategory: '场景',
    }).status,
    'ready',
  );
  assert.deepEqual(
    buildMaterialCategoryRenamePlan({
      userCategories: ['人物'],
      allCategories: 'nope',
      currentCategory: '人物',
      nextCategory: '场景',
    }).status,
    'ready',
  );
});

test('allows a rename that only changes the case of the key', () => {
  const plan = buildMaterialCategoryRenamePlan({
    userCategories: [' Props '],
    currentCategory: 'Props',
    nextCategory: ' props ',
  });
  assert.equal(plan.status, 'ready');
  assert.equal(plan.currentCategory, 'Props');
  assert.equal(plan.nextCategory, 'props');
  assert.equal(plan.currentKey, 'props');
  assert.equal(plan.nextKey, 'props');
  assert.deepEqual(plan.nextUserCategories, ['props']);
});

test('builds the ready plan with renamed assets and staggered timestamps', () => {
  const assets = [
    { id: 'a1', name: 'One', category: ' 人物 ' },
    { id: 'a2', name: 'Two', category: '人物' },
    { id: 'a3', name: 'Three', category: '场景' },
  ];
  const userCategories = ['人物', '场景'];
  const plan = buildMaterialCategoryRenamePlan({
    assets,
    userCategories,
    currentCategory: '人物',
    nextCategory: '角色',
    now: 1000,
  });
  assert.deepEqual(plan, {
    status: 'ready',
    currentCategory: '人物',
    currentKey: '人物',
    nextCategory: '角色',
    nextKey: '角色',
    nextUserCategories: ['角色', '场景'],
    originalAssets: [assets[0], assets[1]],
    renamedAssets: [
      { id: 'a1', name: 'One', category: '角色', updatedAt: 1000 },
      { id: 'a2', name: 'Two', category: '角色', updatedAt: 1001 },
    ],
  });
  assert.equal(plan.originalAssets[0], assets[0]);
  assert.notEqual(plan.renamedAssets[0], assets[0]);
  assert.deepEqual(assets[1], { id: 'a2', name: 'Two', category: '人物' });
  assert.deepEqual(userCategories, ['人物', '场景']);
});

test('accepts string timestamps and falls back to now for unusable ones', () => {
  const stringy = buildMaterialCategoryRenamePlan({
    userCategories: ['A'],
    currentCategory: 'A',
    nextCategory: 'B',
    now: '1500',
    assets: [
      { id: 1, category: 'A' },
      { id: 2, category: 'A' },
    ],
  });
  assert.deepEqual(
    stringy.renamedAssets.map((asset) => asset.updatedAt),
    [1500, 1501],
  );
  const zero = buildMaterialCategoryRenamePlan({
    userCategories: ['A'],
    currentCategory: 'A',
    nextCategory: 'B',
    now: null,
    assets: [{ id: 1, category: 'A' }],
  });
  assert.equal(zero.renamedAssets[0].updatedAt, 0);
  const before = Date.now();
  const fallback = buildMaterialCategoryRenamePlan({
    userCategories: ['A'],
    currentCategory: 'A',
    nextCategory: 'B',
    now: 'oops',
    assets: [{ id: 1, category: 'A' }],
  });
  const after = Date.now();
  assert.ok(fallback.renamedAssets[0].updatedAt >= before);
  assert.ok(fallback.renamedAssets[0].updatedAt <= after);
});

test('maps each folder to its catalog parent', () => {
  assert.deepEqual(
    normalizeMaterialFolderParents({
      parents: { B: 'A' },
      userCategories: ['A', 'B'],
      allCategories: ['A', 'B'],
    }),
    { B: 'A' },
  );
});

test('only allows user categories to become children', () => {
  assert.deepEqual(normalizeMaterialFolderParents({ parents: { B: 'A' }, userCategories: ['A'] }), {});
});

test('drops unknown, self-referential and malformed parent pairs', () => {
  assert.deepEqual(
    normalizeMaterialFolderParents({
      parents: { A: 'A', B: 'missing', C: 'D' },
      userCategories: ['A', 'B', 'C'],
      allCategories: ['A', 'B', 'C'],
    }),
    {},
  );
});

test('lets the first catalog label win for keys that normalize the same', () => {
  assert.deepEqual(
    normalizeMaterialFolderParents({
      parents: { props: 'Other' },
      userCategories: ['Props', 'Other'],
      allCategories: ['Props', 'props', 'Other'],
    }),
    { Props: 'Other' },
  );
});

test('keys the result by catalog labels for a parent chain', () => {
  assert.deepEqual(
    normalizeMaterialFolderParents({
      parents: { B: 'A', C: 'B' },
      userCategories: ['A', 'B', 'C'],
    }),
    { B: 'A', C: 'B' },
  );
});

test('drops every edge that participates in a parent cycle', () => {
  assert.deepEqual(
    normalizeMaterialFolderParents({ parents: { A: 'B', B: 'A' }, userCategories: ['A', 'B'] }),
    {},
  );
});

test('handles missing and malformed parent maps', () => {
  assert.deepEqual(normalizeMaterialFolderParents(), {});
  assert.deepEqual(normalizeMaterialFolderParents({ parents: null, userCategories: ['A'] }), {});
  assert.deepEqual(normalizeMaterialFolderParents({ parents: 'nope', userCategories: ['A'] }), {});
});

test('normalizes parent keys with a custom category key but keeps catalog labels', () => {
  const categoryKey = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/^cat:/, '');
  assert.deepEqual(
    normalizeMaterialFolderParents({
      parents: { 'cat:b': 'cat:a' },
      userCategories: ['b'],
      allCategories: ['cat:a', 'cat:b'],
      categoryKey,
    }),
    { 'cat:b': 'cat:a' },
  );
});

test('renames both keys and values that match the current category', () => {
  assert.deepEqual(
    renameMaterialFolderParent({
      parents: { B: 'A', C: 'A', D: 'B' },
      currentCategory: 'A',
      nextCategory: 'Z',
    }),
    { B: 'Z', C: 'Z', D: 'B' },
  );
});

test('matches the current category after trimming and folding case', () => {
  assert.deepEqual(
    renameMaterialFolderParent({ parents: { B: ' a ' }, currentCategory: ' A ', nextCategory: '  Z  ' }),
    { B: 'Z' },
  );
});

test('returns a copy when the current or next category is blank', () => {
  const parents = { B: 'A' };
  const copy = renameMaterialFolderParent({ parents, currentCategory: '   ', nextCategory: 'Z' });
  assert.deepEqual(copy, { B: 'A' });
  assert.notEqual(copy, parents);
  assert.deepEqual(renameMaterialFolderParent({ parents, currentCategory: 'A', nextCategory: '   ' }), {
    B: 'A',
  });
  assert.deepEqual(renameMaterialFolderParent(), {});
  assert.deepEqual(
    renameMaterialFolderParent({ parents: null, currentCategory: 'A', nextCategory: 'Z' }),
    {},
  );
});

test('keeps raw keys and lets renamed keys collide', () => {
  assert.deepEqual(
    renameMaterialFolderParent({ parents: { A: 'B', B: 'A' }, currentCategory: 'A', nextCategory: 'B' }),
    { B: 'B' },
  );
});

test('does not mutate the parent map while renaming', () => {
  const parents = { B: 'A' };
  renameMaterialFolderParent({ parents, currentCategory: 'A', nextCategory: 'Z' });
  assert.deepEqual(parents, { B: 'A' });
});

test('removes the deleted folder and keeps its siblings', () => {
  assert.deepEqual(deleteMaterialFolderParent({ parents: { B: 'A', C: 'A' }, category: 'B' }), { C: 'A' });
});

test('re-parents grandchildren to the deleted folder parent', () => {
  assert.deepEqual(deleteMaterialFolderParent({ parents: { B: 'A', C: 'B', D: 'B' }, category: 'B' }), {
    C: 'A',
    D: 'A',
  });
});

test('drops grandchildren when the deleted folder has no parent entry', () => {
  assert.deepEqual(deleteMaterialFolderParent({ parents: { C: 'B', D: 'B' }, category: 'B' }), {});
});

test('returns a copy when the deleted category is blank or unknown', () => {
  const parents = { B: 'A' };
  const copy = deleteMaterialFolderParent({ parents, category: '   ' });
  assert.deepEqual(copy, { B: 'A' });
  assert.notEqual(copy, parents);
  assert.deepEqual(deleteMaterialFolderParent({ parents, category: 'Ghost' }), { B: 'A' });
  assert.deepEqual(deleteMaterialFolderParent(), {});
  assert.deepEqual(deleteMaterialFolderParent({ parents: null, category: 'A' }), {});
});

test('matches the deleted category and the parent values after normalization', () => {
  assert.deepEqual(deleteMaterialFolderParent({ parents: { B: 'A' }, category: ' b ' }), {});
  assert.deepEqual(deleteMaterialFolderParent({ parents: { C: ' B ' }, category: 'b' }), {});
});

test('does not mutate the parent map while deleting', () => {
  const parents = { B: 'A', C: 'B' };
  deleteMaterialFolderParent({ parents, category: 'B' });
  assert.deepEqual(parents, { B: 'A', C: 'B' });
});

test('returns null without a target id or a plain object', () => {
  assert.equal(buildMaterialDuplicate(), null);
  assert.equal(buildMaterialDuplicate(null), null);
  assert.equal(buildMaterialDuplicate('nope'), null);
  assert.equal(buildMaterialDuplicate(42), null);
  assert.equal(buildMaterialDuplicate({ name: 'X' }), null);
  assert.equal(buildMaterialDuplicate({ name: 'X' }, {}), null);
  assert.equal(buildMaterialDuplicate({ name: 'X' }, { id: '   ' }), null);
  assert.equal(buildMaterialDuplicate({ name: 'X' }, { id: null }), null);
});

test('clones the asset, stamps audit fields and strips package keys', () => {
  const asset = {
    id: 'old',
    name: '  原始素材  ',
    category: '人物',
    favorite: true,
    isFavorite: true,
    packageKey: 'pkg',
    packageMetadata: { owner: 'me' },
    createdAt: 1,
    items: [
      { packageItemKey: 'k1', name: 'inner', nodeData: { assetPackageItemKey: 'n1', name: 'x' } },
      { packageItemKey: 'k2' },
      null,
      'text',
    ],
    nodes: [{ assetPackageItemKey: 'nn1', type: 'image' }, null, 7],
  };
  const snapshot = JSON.stringify(asset);
  const duplicate = buildMaterialDuplicate(asset, { id: '  new-id ', now: 777, nameSuffix: ' 副本' });
  assert.deepEqual(duplicate, {
    id: 'new-id',
    name: '原始素材 副本',
    category: '人物',
    favorite: false,
    createdAt: 777,
    updatedAt: 777,
    items: [{ name: 'inner', nodeData: { name: 'x' } }, {}, null, 'text'],
    nodes: [{ type: 'image' }, null, 7],
  });
  assert.notEqual(duplicate, asset);
  assert.notEqual(duplicate.items[0], asset.items[0]);
  assert.notEqual(duplicate.items[0].nodeData, asset.items[0].nodeData);
  assert.equal(JSON.stringify(asset), snapshot);
});

test('falls back to a placeholder name and the default copy suffix', () => {
  const duplicate = buildMaterialDuplicate({ name: '   ', id: 'x' }, { id: 'id-1' });
  assert.equal(duplicate.name, '未命名素材 副本');
  assert.equal(duplicate.id, 'id-1');
  assert.equal(duplicate.favorite, false);
  assert.equal(duplicate.createdAt, duplicate.updatedAt);
});

test('accepts numeric ids and honors a zero timestamp', () => {
  const duplicate = buildMaterialDuplicate({ id: 1, name: 'A' }, { id: 123, now: 0 });
  assert.equal(duplicate.id, '123');
  assert.equal(duplicate.createdAt, 0);
  assert.equal(duplicate.updatedAt, 0);
});

test('drops keys that cannot survive a JSON round trip', () => {
  const duplicate = buildMaterialDuplicate(
    { id: 'a', name: 'A', undef: undefined, fn: () => {}, nested: { keep: undefined, ok: 1 } },
    { id: 'b' },
  );
  assert.equal('undef' in duplicate, false);
  assert.equal('fn' in duplicate, false);
  assert.deepEqual(duplicate.nested, { ok: 1 });
  assert.deepEqual(duplicate.items, undefined);
});

test('builds one download entry per usable item', () => {
  const files = buildMaterialDownloadFiles({
    name: ' 我的 素材/图:1 ',
    items: [
      { type: 'ai-image', name: '首图', nodeData: { localPath: '/tmp/a.PNG' } },
      { type: 'source-video', name: '片段', nodeData: { url: 'https://cdn.example.com/v/clip.mp4?sig=1' } },
      { type: 'audio', nodeData: { localPath: '/tmp/s.mp3' } },
      { type: 'text', nodeData: { localPath: '/tmp/x' } },
      { type: 'image', nodeData: {} },
    ],
  });
  assert.deepEqual(files, [
    { kind: 'image', localPath: '/tmp/a.PNG', url: '', filename: '我的 素材-图-1-首图.png' },
    {
      kind: 'video',
      localPath: '',
      url: 'https://cdn.example.com/v/clip.mp4?sig=1',
      filename: '我的 素材-图-1-片段.mp4',
    },
    { kind: 'audio', localPath: '/tmp/s.mp3', url: '', filename: '我的 素材-图-1-3.mp3' },
  ]);
});

test('numbers unnamed items only when the asset holds several of them', () => {
  const files = buildMaterialDownloadFiles({
    items: [{ type: 'image', nodeData: { url: 'https://x/blob' } }],
  });
  assert.deepEqual(files, [
    { kind: 'image', localPath: '', url: 'https://x/blob', filename: 'material.png' },
  ]);
  assert.deepEqual(buildMaterialDownloadFiles(), []);
  assert.deepEqual(buildMaterialDownloadFiles({}), []);
});

test('sanitizes the asset name and strips trailing dots', () => {
  const files = buildMaterialDownloadFiles({
    name: 'Report...  ',
    items: [{ type: 'image', nodeData: { url: 'https://x/a.jpg' } }],
  });
  assert.equal(files[0].filename, 'Report.jpg');
  const illegal = buildMaterialDownloadFiles({
    name: 'A<B>C',
    items: [{ type: 'image', nodeData: { url: 'https://x/a.jpg' } }],
  });
  assert.equal(illegal[0].filename, 'A-B-C.jpg');
  const control = buildMaterialDownloadFiles({
    name: 'a\nb\tc',
    items: [{ type: 'image', nodeData: { url: 'https://x/a.jpg' } }],
  });
  assert.equal(control[0].filename, 'a-b-c.jpg');
});

test('caps the sanitized name at eighty characters', () => {
  const files = buildMaterialDownloadFiles({
    name: 'x'.repeat(90),
    items: [{ type: 'image', nodeData: { url: 'https://x/a.jpg' } }],
  });
  assert.equal(files[0].filename, 'x'.repeat(80) + '.jpg');
});

test('resolves the extension from the path and lowercases it', () => {
  const files = buildMaterialDownloadFiles({
    name: 'Pack',
    items: [
      { type: 'image', nodeData: { url: 'https://x/a.PNG?v=2#frag' } },
      { type: 'video', nodeData: { url: 'https://x/a' } },
      { type: 'audio', nodeData: { localPath: 'C:\\music\\song' } },
      { type: 'image', nodeData: { url: 'https://x/a.superlongext' } },
    ],
  });
  assert.deepEqual(
    files.map((file) => file.filename),
    ['Pack-1.png', 'Pack-2.mp4', 'Pack-3.mp3', 'Pack-4.png'],
  );
});

test('does not read the extension from a query string', () => {
  const files = buildMaterialDownloadFiles({
    name: 'Q',
    items: [{ type: 'video', nodeData: { url: 'https://x/download?file=a.webm' } }],
  });
  assert.deepEqual(files, [
    { kind: 'video', localPath: '', url: 'https://x/download?file=a.webm', filename: 'Q.mp4' },
  ]);
});

test('prefers the object url keys in order and skips empty sources', () => {
  const files = buildMaterialDownloadFiles({
    name: 'P',
    items: [
      { type: 'image', nodeData: { displayLocalPath: ' /x/c.jpg ', imageUrl: ' https://y/d.png ' } },
      { type: 'image', nodeData: { src: 'https://y/e.webp' } },
      { type: 'video', nodeData: { resultUrl: 'https://y/f.mov' } },
    ],
  });
  assert.deepEqual(
    files.map((file) => [file.localPath, file.url, file.filename]),
    [
      ['/x/c.jpg', 'https://y/d.png', 'P-1.jpg'],
      ['', 'https://y/e.webp', 'P-2.webp'],
      ['', 'https://y/f.mov', 'P-3.mov'],
    ],
  );
  assert.deepEqual(
    buildMaterialDownloadFiles({ items: [{ type: 'image', nodeData: { localPath: '   ' } }] }),
    [],
  );
});

test('sanitizes the item label and prefers it over the nodeData name', () => {
  const files = buildMaterialDownloadFiles({
    name: 'P',
    items: [
      { type: 'video', name: ' A/B ', nodeData: { name: 'Other', localPath: '/v/x.mov' } },
      { type: 'video', nodeData: { name: ' Fallback ', localPath: '/v/y.mov' } },
    ],
  });
  assert.deepEqual(
    files.map((file) => file.filename),
    ['P-A-B.mov', 'P-Fallback.mov'],
  );
});

test('falls back to the nodes list when items are absent', () => {
  const nodes = [{ type: 'image', name: 'Shot', localPath: '/a/b.png' }, { type: 'other' }, {}];
  const files = buildMaterialDownloadFiles({ name: 'Pack', nodes });
  assert.deepEqual(files, [{ kind: 'image', localPath: '/a/b.png', url: '', filename: 'Pack-Shot.png' }]);
});

test('does not mutate the asset while building download files', () => {
  const asset = { name: 'P', items: [{ type: 'image', name: 'A', nodeData: { localPath: 'a.png' } }] };
  const snapshot = JSON.stringify(asset);
  buildMaterialDownloadFiles(asset);
  assert.equal(JSON.stringify(asset), snapshot);
});
