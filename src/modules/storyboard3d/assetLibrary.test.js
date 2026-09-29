import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_ASSET_CATEGORIES,
  STORYBOARD_3D_CLAY_MODEL_TINT,
  createStoryboard3DAssetLibrary,
  getStoryboard3DAssetCategoryLabel,
  listBuiltinStoryboard3DAssets,
  normalizeStoryboard3DAssetDescriptor,
  searchStoryboard3DAssets,
} from './assetLibrary.js';

test('assetLibrary: descriptor normalization handles builtin, file, and pack sources', () => {
  assert.throws(() => normalizeStoryboard3DAssetDescriptor({}), /Asset id is required/);

  const fileAsset = normalizeStoryboard3DAssetDescriptor({
    id: ' asset-1 ',
    name: '  ',
    tags: [' hero ', 'hero', '', 7],
    source: {
      kind: 'FILE',
      format: 'GLB',
      fileName: ' hero.glb ',
      byteLength: -3,
      fingerprint: ' abc ',
    },
    thumbnailUrl: ' thumb.png ',
    tint: '#AABBCC',
    normalization: { status: 'ready' },
    assetRecord: { bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 2, z: 3 } } },
    createdAt: -1,
  });
  assert.equal(fileAsset.id, 'asset-1');
  assert.equal(fileAsset.name, 'asset-1');
  assert.equal(fileAsset.category, 'imported');
  assert.deepEqual(fileAsset.tags, ['hero', '7']);
  assert.deepEqual(fileAsset.source, {
    kind: 'file',
    format: 'glb',
    fileName: 'hero.glb',
    byteLength: 0,
    fingerprint: 'abc',
  });
  assert.equal(fileAsset.tint, '#aabbcc');
  assert.equal(fileAsset.createdAt, 0);
  assert.deepEqual(fileAsset.normalization, { status: 'ready' });
  assert.equal(fileAsset.spatial.source, 'measured');

  const packAsset = normalizeStoryboard3DAssetDescriptor({
    id: 'pack-item',
    source: {
      kind: 'pack',
      format: 'GLTF',
      sourcePack: ' pack-1 ',
      url: ' https://example.com/model.gltf ',
      license: ' CC0 ',
    },
  });
  assert.deepEqual(packAsset.source, {
    kind: 'pack',
    assetId: 'pack-item',
    packId: 'pack-1',
    format: 'gltf',
    url: 'https://example.com/model.gltf',
    familyId: '',
    license: 'CC0',
  });

  const builtinAsset = normalizeStoryboard3DAssetDescriptor({ id: 'cube' });
  assert.equal(builtinAsset.category, 'props');
  assert.deepEqual(builtinAsset.source, { kind: 'builtin', assetId: 'cube' });
});

test('assetLibrary: category metadata and builtin catalog are stable and deduplicated', () => {
  assert.equal(getStoryboard3DAssetCategoryLabel(' ARCHITECTURE '), '建筑');
  assert.equal(getStoryboard3DAssetCategoryLabel('custom'), 'custom');
  assert.equal(getStoryboard3DAssetCategoryLabel(''), '未分类');
  for (const category of ['all', 'character', 'imported']) {
    assert.equal(STORYBOARD_3D_ASSET_CATEGORIES.some((entry) => entry.id === category), true);
  }

  const assets = listBuiltinStoryboard3DAssets();
  assert.ok(assets.length > 0);
  assert.equal(new Set(assets.map((asset) => asset.id)).size, assets.length);
  assert.equal(assets.every((asset) => asset.source.kind === 'builtin'), true);
  assert.equal(assets.some((asset) => asset.category === 'character'), true);
  assert.equal(
    assets
      .filter((asset) => asset.tint)
      .every((asset) => asset.tint === STORYBOARD_3D_CLAY_MODEL_TINT),
    true,
  );
  assert.equal(assets.some((asset) => /\b(?:Small|Medium|Large)\s+(?:Blue|Red|Green|Yellow|Purple)$/i.test(asset.name)), false);
});

test('assetLibrary: search supports query, category, recency, and pagination', () => {
  const assets = [
    normalizeStoryboard3DAssetDescriptor({
      id: 'chair',
      name: 'Dining Chair',
      category: 'furniture',
      tags: ['seat'],
    }),
    normalizeStoryboard3DAssetDescriptor({
      id: 'table',
      name: 'Round Table',
      category: 'furniture',
      tags: ['dining'],
    }),
    normalizeStoryboard3DAssetDescriptor({
      id: 'tower',
      name: 'Office Tower',
      category: 'architecture',
      tags: ['city'],
    }),
  ];

  assert.deepEqual(
    searchStoryboard3DAssets(assets, { query: ' seat ' }).map((asset) => asset.id),
    ['chair'],
  );
  assert.deepEqual(
    searchStoryboard3DAssets(assets, { category: 'architecture' }).map((asset) => asset.id),
    ['tower'],
  );
  assert.deepEqual(
    searchStoryboard3DAssets(assets, {
      category: 'recent',
      recentAssetIds: ['table', 'chair'],
    }).map((asset) => asset.id),
    ['table', 'chair'],
  );
  assert.deepEqual(
    searchStoryboard3DAssets(assets, { limit: 1, offset: 1 }).map((asset) => asset.id),
    ['table'],
  );
});

test('assetLibrary: mutable library registers assets, tracks recency, and serializes imports', () => {
  const imported = {
    id: 'custom',
    name: 'Custom',
    source: { kind: 'file', format: 'glb', fileName: 'custom.glb' },
  };
  const library = createStoryboard3DAssetLibrary({
    builtinAssets: [],
    importedAssets: [imported],
    recentAssetIds: ['custom', 'missing'],
    recentLimit: 2,
  });

  assert.deepEqual(library.getRecentAssetIds(), ['custom']);
  assert.equal(library.find('custom').category, 'imported');
  assert.equal(library.markUsed('custom'), true);
  assert.equal(library.markUsed('missing'), false);
  assert.equal(
    library.list({ query: 'custom' }).length,
    1,
  );

  const packs = library.registerPackAssets(
    [
      {
        id: 'pack-chair',
        name: 'Pack Chair',
        format: 'GLTF',
        url: 'https://example.com/chair.gltf',
        keywords: ['chair'],
      },
      { id: 'invalid', format: 'glb' },
    ],
    { packId: 'furniture' },
  );
  assert.equal(packs.length, 1);
  assert.equal(packs[0].source.kind, 'pack');
  assert.equal(packs[0].source.packId, 'furniture');
  assert.deepEqual(packs[0].tags, ['chair']);

  const snapshot = library.serialize();
  assert.deepEqual(snapshot.importedAssets.map((asset) => asset.id), ['custom']);
  assert.deepEqual(snapshot.recentAssetIds, ['custom']);
  snapshot.importedAssets[0].name = 'Mutated';
  assert.equal(library.find('custom').name, 'Custom');
});
